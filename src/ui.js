// src/ui.js

  // UI 要素の管理オブジェクト
  const uiElements = {
    version: document.getElementById('version'), // バージョン情報部
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

  const App = {
    img: new Image(),
    isFrameScheduled: false, // 次のフレームで処理を実行中かどうか
    lastColor: null, // 最終選択色
  };
  const ctx = uiElements.canvas.getContext('2d', { willReadFrequently: true }); // Canvas の context を格納
  
  // スロットリングされたイベントハンドラ
  function throttledMouseMoveHandler(e) {
    // 既にフレームがスケジュール済みなら何もしない
    if (App.isFrameScheduled){
      return;
    }

    App.isFrameScheduled = true;
    requestAnimationFrame(() => {
      // カラー情報のプレビュー
      const { x, y } = getCanvasCoordinates(e, uiElements.canvas);
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      try {
        if (a === 0) {
          return;
        }
        
        // カーソル下の色で現在選択色を更新
        updateCurrentColor(chroma(r, g, b));
      } finally {
        // フレーム実行後にフラグをリセット
        App.isFrameScheduled = false;
      } 
    });
  }
  
  /**
  * 開始時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionStart(e) {
    updateColorPreview(e);
  }
  
  /**
  * 移動時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionMove(e) {
    throttledMouseMoveHandler(e);
    if(e.buttons <= 0) { // https://developer.mozilla.org/ja/docs/Web/API/Pointer_events#%E3%83%9C%E3%82%BF%E3%83%B3%E3%81%AE%E7%8A%B6%E6%85%8B%E3%81%AE%E5%88%A4%E6%96%AD
      return; // ドラッグ時以外
    }
    updateColorPreview(e);
  }
  
  uiElements.canvas.addEventListener('pointerdown', onInteractionStart);
  uiElements.canvas.addEventListener('pointermove', onInteractionMove);
  
  /**
  * イベントオブジェクトからキャンバス上の座標を取得する関数
  * @param {Event} e - マウスまたはタッチイベント
  * @param {HTMLCanvasElement} canvas - 対象のキャンバス要素
  * @returns {object} { x, y } キャンバス上の座標
  */
  function getCanvasCoordinates(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
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
    
    const color = chroma(r, g, b);
    const hex = color.hex();
    
    // キャンバスコンテナの座標を取得
    const containerRect = uiElements.canvasContainer.getBoundingClientRect();
    
    // プレビューの更新（コンテナ内の座標に変換）
    uiElements.colorPreview.style.backgroundColor = hex;
    uiElements.colorPreview.style.color = isDarkColor(color) ? '#ffffff' : '#000000';
    uiElements.colorPreview.textContent = hex;
    // container内の相対位置に変換（プレビューサイズは80pxなので半分の40pxを引く）
    uiElements.colorPreview.style.left = `${e.clientX - containerRect.left - 40}px`;
    uiElements.colorPreview.style.top = `${e.clientY - containerRect.top - 40}px`;
    uiElements.colorPreview.style.display = 'flex';
    
    // カーソル下の色で現在選択色を更新
    updateCurrentColor(color);
  };
  
  /** 現在色表示を更新する
  * @param {chroma} color - 色
  */
  function updateCurrentColor(color) {
    const hex = color.hex();
    
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
    
    const [r, g, b] = color.rgb();
    uiElements.colorRgb.textContent = `${r}, ${g}, ${b}`;
    
    let [h, s, v] = color.hsv();
    // 1. グレースケールの場合（s が 0 または hue が NaN）の場合、色相を 0 に補正
    if (isNaN(h) || s === 0) {
      h = 0;
    }
    uiElements.colorHsv.textContent = `${Math.round(h)}, ${Math.round(s * 100)}, ${Math.round(v * 100)}`;
    
    //console.log(color);
  }
  
  // 画像読み込み処理
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      // 古い img の参照を解放
      if (App.img) {
        App.img.onload = null;   // イベントハンドラを解除
        if (App.img.src && App.img.src.startsWith('blob:')) {
          URL.revokeObjectURL(App.img.src);  // Blob URL を解放
        }
        App.img.src = "";         // 画像の参照を解除0
      }
      App.img = new Image();
      App.img.onload = function () {
        // キャンバスサイズを画像サイズに合わせる
        uiElements.canvas.width = App.img.width;
        uiElements.canvas.height = App.img.height;
        ctx.drawImage(App.img, 0, 0);
        analyzeColors();
      }
      App.img.src = e.target.result;
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
      const color = chroma(r, g, b);
      const hex = color.hex();

      const colorDiv = document.createElement('div');
      colorDiv.className = 'color-box';
      colorDiv.style.background = hex;
      colorDiv.title = `${hex} (${count}回)`;
      colorDiv.textContent = "";
      
      colorDiv.addEventListener('click', (e) => {
        updateCurrentColor(color);
        addColorToHistory(color);
        
        // キャンバスそのものの位置を取得
        const canvasRect = uiElements.canvas.getBoundingClientRect();
        // キャンバス内での相対座標を計算（要素の中心に合わせるため、sparkleは幅10pxなので半分の5pxを引いています）
        const relativeX = e.clientX - canvasRect.left;
        const relativeY = e.clientY - canvasRect.top;
        // キラキラエフェクトを表示
        createSparkles(relativeX,  relativeY);
      });
      uiElements.paletteContainer.appendChild(colorDiv);
    });
    
    uiElements.downloadPaletteBtn.disabled = uiElements.paletteContainer.children.length === 0;
  }

  // クリック時に現在のカーソル色をカラーヒストリーに追加
  uiElements.canvas.addEventListener('click', (e) => {
    const { x, y } = getCanvasCoordinates(e, uiElements.canvas);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b, a] = pixel;
    if (a === 0) return;
    const color = chroma(r, g, b);
    addColorToHistory(color);
    
    // キャンバスそのものの位置を取得
    const canvasRect = uiElements.canvas.getBoundingClientRect();
    // キャンバス内での相対座標を計算（要素の中心に合わせるため、sparkleは幅10pxなので半分の5pxを引いています）
    const relativeX = e.clientX - canvasRect.left;
    const relativeY = e.clientY - canvasRect.top;
    // キラキラエフェクトを表示
    createSparkles(relativeX, relativeY);
  });
  
  /**
   * 指定位置から7つのキラキラ要素を生成し、それぞれ異なる方向に飛ばす関数
   * @param {number} x - キラキラの発生位置（canvas-container 内の相対X座標）
   * @param {number} y - キラキラの発生位置（canvas-container 内の相対Y座標）
   */
  function createSparkles(x, y) {
    const sparkleCount = 7;
    const distance = 60; // キラキラが飛ぶ距離（ピクセル）
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      // 要素の中央を(x, y)に合わせるため、幅の半分（5px）を引く
      sparkle.style.left = `${x - 5}px`;
      sparkle.style.top = `${y - 5}px`;
      
      // 7方向に均等に飛ばす（角度を360°/7で割った値）
      const angle = i * (360 / sparkleCount) * (Math.PI / 180);
      const dx = distance * Math.cos(angle);
      const dy = distance * Math.sin(angle);
      // カスタムプロパティとして移動量をセット
      sparkle.style.setProperty('--dx', `${dx}px`);
      sparkle.style.setProperty('--dy', `${dy}px`);
      
      // キャンバスを含む親要素（#canvas-container）に追加
      uiElements.canvasContainer.appendChild(sparkle);
      
      // アニメーション終了後に要素を自動削除
      sparkle.addEventListener('animationend', () => {
        sparkle.remove();
      });
    }
  }

  /** 輝度が低ければ暗いと判断
  * @param {chroma} color - 色
  * @returns {boolean} - 色が暗い場合にtrue、明るい場合にfalseを返す
  */
  function isDarkColor(color) {
    const luminance = color.luminance();
    // 輝度が0.5未満なら暗い色、0.5以上なら明るい色
    return luminance < 0.5;
  }

  /** カラーヒストリーに色を追加する関数
  * @param {chroma} color - 色
  */
  function addColorToHistory(color) {
    const hex = color.hex();
    if (hex === App.lastColor) {
      uiElements.errorMessage.textContent = "直前の色と同じため追加できません。";
      return;
    }
    uiElements.errorMessage.textContent = "";  // エラー解除
    App.lastColor = hex;
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-box';
    colorDiv.style.background = hex;
    colorDiv.style.color = isDarkColor(color) ? "#ffffff" : "#000000";
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
      downloadCtx.drawImage(App.img, 0, 0); // 元画像をキャンバスに描画
      
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
      downloadCtx.drawImage(App.img, 0, 0); // 元画像をキャンバスに描画
      
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
