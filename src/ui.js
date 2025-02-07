// src/ui.js

  // UI 要素の管理オブジェクト
  const uiElements = {
    themeToggleBtn: document.getElementById('theme-toggle'),
    fileInput: document.getElementById('file-input'), // 画像アップロードのファイル入力
    dropArea: document.getElementById('drop-area'),// ドラッグ＆ドロップ領域
    pasteButton: document.getElementById('paste-button'),// クリップボードから貼り付けるボタン
    canvas: document.getElementById('image-canvas'),// 画像を描画するキャンバス
    canvasContainer: document.getElementById('canvas-container'), /* image-canvasと重複しているため最終的には不要 */
    paletteContainer: document.getElementById('palette-colors'), // カラーパレット表示エリア
    historyContainer: document.getElementById('history-colors'), // カラーヒストリー表示エリア
    errorMessage: document.getElementById('error-message'),// エラーメッセージ表示エリア
    currentColorDisplay: document.getElementById('color-display'),// 現在選択色表示
    colorName: document.getElementById('color-name'),// 名前 表示
    colorClosestName: document.getElementById('color-closest-name'),// 近い名前 表示    
    colorHex: document.getElementById('color-hex'),// HEX 表示
    colorRgb: document.getElementById('color-rgb'),// RGB 表示
    colorHsv: document.getElementById('color-hsv'),// HSV 表示
    colorPreview: document.getElementById('color-preview'),// 色プレビューエリア
    coordinateDisplay: document.getElementById('coordinate-display'), /* 座標表示用オーバーレイ要素 */
    scrollToTopButton: document.getElementById('scroll-to-top'), // 一番上にスクロールボタン
    downloadPaletteBtn: document.getElementById('download-palette'),// パレットダウンロードボタン
    downloadHistoryBtn: document.getElementById('download-history'),// ヒストリーダウンロードボタン
  };
  
  // 各UI要素がnullでないかをチェック
  Object.entries(uiElements).forEach(([key, element]) => {
    if (element === null) {
      throw new Error(`UI element with id '${key}' is missing from the document.`);
    }
  });
  
  const ctx = uiElements.canvas.getContext('2d');
  
  // 最終選択色
  let lastColor = null;
  // 共通のフラグ（ドラッグ中かどうか）
  let isDragging = false;
  // フラグ変数：次のフレームで処理を実行中かどうかを管理します。
  let isFrameScheduled = false;
  
  // スロットリングされたイベントハンドラ
  function throttledMouseMoveHandler(e) {
    // 既にフレームがスケジュール済みなら何もしない
    if (isFrameScheduled){
      return;
    }

    isFrameScheduled = true;
    requestAnimationFrame(() => {
      // カラー情報のプレビュー
      const { x, y } = getCanvasCoordinates(e, uiElements.canvas);
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      try {
        if (a === 0) {
          return;
        }
        
        const hex = ColorHelper.rgbToHex(r, g, b);
        // カーソル下の色で現在選択色を更新
        updateCurrentColor(hex);
      } finally {
        // フレーム実行後にフラグをリセット
        isFrameScheduled = false;
      } 
    });
  }
  /**
  * 開始時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionStart(e) {
    e.preventDefault(); // デフォルト動作の抑制（タッチスクロールなどを防ぐ）
    isDragging = true;
    throttledMouseMoveHandler(e);
    updateColorPreview(e);
  }
  
  /**
  * 移動時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionMove(e) {
    e.preventDefault();
    if (!isDragging) {
      return;
    }
    
    if (e.type.startsWith("touch")) {
      // タッチイベントの場合は最初のタッチ情報を使う
      throttledMouseMoveHandler(e.touches[0]);
      updateColorPreview(e.touches[0]);
    } else {
      throttledMouseMoveHandler(e);
      updateColorPreview(e);
    }
  }
  
  /**
  * 終了時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionEnd(e) {
    e.preventDefault();
    updateColorPreview(e);
    isDragging = false;
  }
  
  // マウスイベントの登録
  uiElements.canvas.addEventListener('mousedown', onInteractionStart);
  uiElements.canvas.addEventListener('mousemove', onInteractionMove);
  uiElements.canvas.addEventListener('mouseup', onInteractionEnd);
  
  // タッチイベントの登録
  uiElements.canvas.addEventListener('touchstart', onInteractionStart);
  uiElements.canvas.addEventListener('touchmove', onInteractionMove);
  uiElements.canvas.addEventListener('touchend', onInteractionEnd);
  
  /**
  * イベントオブジェクトからキャンバス上の座標を取得する関数
  * @param {Event} e - マウスまたはタッチイベント
  * @param {HTMLCanvasElement} canvas - 対象のキャンバス要素
  * @returns {object} { x, y } キャンバス上の座標
  */
  function getCanvasCoordinates(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY)
    };
  }
  
  // カラー更新処理
  const updateColorPreview = (e) => {
    const { x, y } = getCanvasCoordinates(e, uiElements.canvas);
    // オーバーレイ表示を更新
    uiElements.coordinateDisplay.textContent = `x: ${x}, y: ${y}`;
    const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
    if (a === 0) return;
    
    const hex = ColorHelper.rgbToHex(r, g, b);
    
    // キャンバスコンテナの座標を取得
    const containerRect = uiElements.canvasContainer.getBoundingClientRect();
    
    // プレビューの更新（コンテナ内の座標に変換）
    uiElements.colorPreview.style.backgroundColor = hex;
    uiElements.colorPreview.style.color = isDarkColor(hex) ? '#ffffff' : '#000000';
    uiElements.colorPreview.textContent = hex;
    // container内の相対位置に変換（プレビューサイズは80pxなので半分の40pxを引く）
    uiElements.colorPreview.style.left = `${e.clientX - containerRect.left - 40}px`;
    uiElements.colorPreview.style.top = `${e.clientY - containerRect.top - 40}px`;
    uiElements.colorPreview.style.display = 'flex';
    
    // カーソル下の色で現在選択色を更新
    updateCurrentColor(hex);
  };
  
  /** ヘルパー関数：16進数から現在色表示を更新する
  * @param {string} hex
  */
  function updateCurrentColor(hex) {
    uiElements.currentColorDisplay.style.background = hex;
    uiElements.colorHex.textContent = hex;
    
    const currentColorName = NamedColor.findByHex(hex);
    if (currentColorName === null) {
      uiElements.colorName.textContent = "-";
    } else {
      uiElements.colorName.textContent = currentColorName;
    }
    
    const currentColorClosestName = NamedColor.findClosestHex(hex);
    if (currentColorClosestName === null) {
      uiElements.colorClosestName.textContent = "-";
    } else {
      uiElements.colorClosestName.textContent = currentColorClosestName;
    }
    
    const currentColor = new ColorHelper(hex);
    const [r, g, b] = currentColor.toRGB();
    uiElements.colorRgb.textContent = `${r}, ${g}, ${b}`;
    const [h, s, v] = currentColor.toHsv();
    uiElements.colorHsv.textContent = `${h}, ${s}, ${v}`;
    //console.log(hex);
  }
  
  let img = new Image();
  
  // 画像読み込み処理
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      // 古い img の参照を解放
      if (img) {
        img.onload = null;   // イベントハンドラを解除
        if (img.src && img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);  // Blob URL を解放
        }
        img.src = "";         // 画像の参照を解除
        img = null;           // 参照を完全に切り離す
      }
      img = new Image();
      img.onload = function () {
        // キャンバスサイズを画像サイズに合わせる
        uiElements.canvas.width = img.width;
        uiElements.canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        analyzeColors();
      }
      img.src = e.target.result;
    }
    reader.readAsDataURL(file);
  }
  
  // ファイル選択時の処理
  uiElements.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadImage(e.target.files[0]);
    }
  });
  
  // クリップボードボタンから画像を読み込む処理
  async function handlePasteButtonClick() {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            loadImage(blob);
            return;
          }
        }
      }
      alert("クリップボードに画像がありません");
    } catch (error) {
      console.error("クリップボードからの画像取得に失敗:", error);
      alert("クリップボードの画像を取得できませんでした。ブラウザの権限を確認してください。");
    }
  }
  // クリップボードボタンのクリックイベント
  uiElements.pasteButton.addEventListener('click', handlePasteButtonClick);
  
  // ドラッグ＆ドロップの処理
  uiElements.dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uiElements.dropArea.style.background = "#eee";
  });
  uiElements.dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uiElements.dropArea.style.background = "";
  });
  uiElements.dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uiElements.dropArea.style.background = "";
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadImage(e.dataTransfer.files[0]);
    }
  });
  
  // カラーパレット解析
  function analyzeColors() {
    // 画像のピクセルデータ取得
    const width = uiElements.canvas.width;
    const height = uiElements.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const colorCount = {};
    
    // 全ピクセルを対象にすると重いので、一定間隔（例: 10px）でサンプル
    const step = 10;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        // 透明度が低いものは除外（必要に応じて調整）
        const a = data[index + 3];
        if (a < 128) continue;
        // 簡易量子化：各チャンネルを16段階に丸める
        const key = [
        Math.floor(r / 16) * 16,
        Math.floor(g / 16) * 16,
        Math.floor(b / 16) * 16
        ].join(',');
        colorCount[key] = (colorCount[key] || 0) + 1;
      }
    }
    
    // 出現頻度が高い順にソートし、上位64色を抽出
    const sortedColors = Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 64);
    
    // カラーパレット表示エリアのクリア
    uiElements.paletteContainer.innerHTML = "";
    // カラーヒストリー表示エリアのクリア
    uiElements.historyContainer.innerHTML = "";
    // カラーパレットが空になったので無効化
    uiElements.downloadPaletteBtn.disabled = true;
    // ヒストリーが空になったので無効化
    uiElements.downloadHistoryBtn.disabled = true;
    
    // カラーパレット表示（横16個×縦4個のグリッド）
    sortedColors.forEach(([colorKey, count]) => {
      const [r, g, b] = colorKey.split(',').map(Number);
      const hex = ColorHelper.rgbToHex(r, g, b);
      const colorDiv = document.createElement('div');
      colorDiv.className = 'color-box';
      colorDiv.style.background = hex;
      colorDiv.title = `${hex} (${count}回)`;
      colorDiv.textContent = "";
      
      colorDiv.addEventListener('click', () => {
        updateCurrentColor(hex);
        addColorToHistory(hex);
      });
      uiElements.paletteContainer.appendChild(colorDiv);
    });
    
    uiElements.downloadPaletteBtn.disabled = uiElements.paletteContainer.children.length === 0;
  }
  // マウス移動時にカーソル下の色を取得して表示
  uiElements.canvas.addEventListener('mousemove', (e) => {
    throttledMouseMoveHandler(e);
  });
  // クリック時に現在のカーソル色をカラーヒストリーに追加
  uiElements.canvas.addEventListener('click', (e) => {
    const { x, y } = getCanvasCoordinates(e, uiElements.canvas);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b, a] = pixel;
    if (a === 0) return;
    const hex = ColorHelper.rgbToHex(r, g, b);
    addColorToHistory(hex);
  });
  /** 明度判定のための関数（輝度計算）
  * @param {string} hex
  */
  function isDarkColor(hex) {
    // hex が "#RRGGBB" 形式の場合
    const { r, g, b } = ColorHelper.hexToRgb(hex)
    // 輝度の計算（ITU-R BT.601 係数を利用）
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128; // 輝度が低ければ暗いと判断
  }
  /** カラーヒストリーに色を追加する関数
  * @param {string} hex
  */
  function addColorToHistory(hex) {
    if (hex === lastColor) {
      uiElements.errorMessage.textContent = "直前の色と同じため追加できません。";
      return;
    }
    uiElements.errorMessage.textContent = "";  // エラー解除
    lastColor = hex;
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-box';
    colorDiv.style.background = hex;
    colorDiv.style.color = isDarkColor(hex) ? "#ffffff" : "#000000";
    colorDiv.title = hex;
    colorDiv.textContent = hex;
    uiElements.historyContainer.prepend(colorDiv);
    // ヒストリーに項目が追加されたので、ダウンロードボタンを有効化
    uiElements.downloadHistoryBtn.disabled = uiElements.historyContainer.children.length === 0;
  }  
  
  // ヒストリー画像ダウンロード処理
  uiElements.downloadHistoryBtn.addEventListener('click', () => {
    // ヒストリー内の色ボックスをまとめたキャンバスを作成
    const colorDivs = uiElements.historyContainer.querySelectorAll('.color-box');
    if (colorDivs.length === 0) {
      alert("ヒストリーに色がありません。");
      return;
    }
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    // 選択されたオプションを取得
    const selectedOption = document.querySelector('input[name="history-download-option"]:checked').value;
    const includeImage = selectedOption === "include";
    const { width, height } = calculateCanvasSize(colorDivs.length, includeImage);
    downloadCanvas.width = width;
    downloadCanvas.height = height;
    if (includeImage) {
      // 元画像の下にカラーパレット情報を追加してダウンロード
      downloadCtx.drawImage(img, 0, 0); // 元画像をキャンバスに描画
      
      const yOffset = uiElements.canvas.height + 10;
      drawColorBoxes(downloadCtx, colorDivs, yOffset);
      
      triggerDownload(downloadCanvas, "color_history_with_image_");
    } else {
      // ヒストリー情報のみでダウンロード
      drawColorBoxes(downloadCtx, colorDivs);
      
      triggerDownload(downloadCanvas, "color_history_only_");
    }
  });
  
    // パレットダウンロード処理
  uiElements.downloadPaletteBtn.addEventListener('click', () => {
    const selectedOption = document.querySelector('input[name="download-option"]:checked').value;
    const colorDivs = uiElements.paletteContainer.querySelectorAll('.color-box');
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    
    const includeImage = selectedOption === "include";
    const { width, height } = calculateCanvasSize(colorDivs.length, includeImage);
    downloadCanvas.width = width;
    downloadCanvas.height = height;
    if (includeImage) {
      // 元画像の下にカラーパレット情報を追加してダウンロード
      downloadCtx.drawImage(img, 0, 0); // 元画像をキャンバスに描画
      
      const yOffset = uiElements.canvas.height + 10;
      drawColorBoxes(downloadCtx, colorDivs, yOffset);
      
      triggerDownload(downloadCanvas, "image_with_palette_");
    } else {
      // カラーパレット情報のみダウンロード
      drawColorBoxes(downloadCtx, colorDivs);
      
      triggerDownload(downloadCanvas, "palette_only_");
    }
  });
  const maxCols = 16; // 最大16列
  const itemSize = 40; // 各ボックスのサイズ

  // キャンバスサイズを事前計算する関数
  const calculateCanvasSize = (totalItems, includeImage) => {
    const numCols = Math.min(totalItems, maxCols); // 最大16列
    const numRows = Math.ceil(totalItems / maxCols); // 必要な行数
    
    const width = numCols * itemSize;
    const height = numRows * itemSize;
    
    return {
      width: includeImage ? Math.max(uiElements.canvas.width, width) : width, // キャンバスサイズよりパレット数が多い場合は計算値を使用
      height: includeImage ? uiElements.canvas.height + height + 20 : height
    };
  };

  const drawColorBoxes = (ctx, colorDivs, yOffset = 0) => {
    colorDivs.forEach((colorDiv, index) => {
      ctx.fillStyle = colorDiv.style.backgroundColor;
      ctx.fillRect((index % maxCols) * itemSize, yOffset + Math.floor(index / maxCols) * itemSize, itemSize, itemSize);
    });
  };
  
  // ダウンロード
  const triggerDownload = (canvas, filePrefix = "download") => {
    if (!canvas) {
      console.error("Canvas is not provided.");
      return;
    }
    
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.download = `${filePrefix}_${new Date().toISOString()}.png`;
    a.href = dataURL;
    a.click();
  };
  
  /**
   * 一番上にスクロール機能
  */
  // スクロールイベントで「一番上にスクロール」ボタンの表示切替
  window.addEventListener('scroll', () => {
    // ヘッダーの高さ（この例では約80px）
    const headerHeight = 80;
    if (window.scrollY > headerHeight) {
      uiElements.scrollToTopButton.classList.remove('hidden');
    } else {
      uiElements.scrollToTopButton.classList.add('hidden');
    }
  });
  
  // 「一番上にスクロール」ボタンのクリックでスムーズスクロール
  uiElements.scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
