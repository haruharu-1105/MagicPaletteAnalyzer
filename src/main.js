
  // ------------------------------------------------
  // ColorHelper クラス（色変換・情報取得用のユーティリティクラス）
  // ------------------------------------------------
  class ColorHelper {
    /**
    * コンストラクタ  
    * input: 文字列（"#RRGGBB"形式など）または {r, g, b} オブジェクト
    */
    constructor(input) {
      if (typeof input === 'string') {
        this.rgb = ColorHelper.hexToRgb(input);
      } else if (typeof input === 'object' && input.r !== undefined) {
        this.rgb = { r: input.r, g: input.g, b: input.b };
      } else {
        throw new Error("Invalid color input");
      }
    }
    
    /**
    * 16進数文字列から RGB オブジェクトへ変換する静的メソッド
    * @param {string} hex - "#RRGGBB" 形式の文字列
    * @returns {object} {r, g, b}
    */
    static hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(ch => ch + ch).join('');
      }
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    }
    
    /**
    * RGBから16進数表記に変換する静的メソッド
    * @param {number} r 
    * @param {number} g 
    * @param {number} b 
    * @returns {string} "#RRGGBB" 形式の文字列
    */
    static rgbToHex(r, g, b) {
      return "#" + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    }
    
    /**
    * インスタンスの RGB 値から 16進数表記に変換する
    * @returns {string} "#RRGGBB" 形式の文字列
    */
    toHex() {
      return ColorHelper.rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
    }
    
    /**
    * RGB値から HSV 値へ変換する静的メソッド  
    * @param {number} r 
    * @param {number} g 
    * @param {number} b 
    * @returns {Array} [h, s, v]（h: 0～360, s,v: 0～100）
    */
    static rgbToHsv(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, v = max;
      const d = max - min;
      s = max === 0 ? 0 : d / max;
      if (max === min) {
        h = 0;
      } else {
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
    }
    
    /**
    * インスタンスの RGB 値から HSV 値へ変換する
    * @returns {Array} [h, s, v]（h: 0～360, s,v: 0～100）
    */
    toHsv() {
      return ColorHelper.rgbToHsv(this.rgb.r, this.rgb.g, this.rgb.b);
    }
    /**
    * インスタンスの RGB 値から RGB オブジェクトへ変換する
    * @returns {Array} [r, g, b]
    */
    toRGB() {
      return [this.rgb.r, this.rgb.g, this.rgb.b];
    }
    
    /**
    * ファクトリーメソッド：RGB値からインスタンス生成
    * @param {number} r
    * @param {number} g
    * @param {number} b
    * @returns {ColorHelper}
    */
    static fromRgb(r, g, b) {
      return new ColorHelper({ r, g, b });
    }
    
  }
  
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
    colorHex: document.getElementById('color-hex'),// HEX 表示
    colorRgb: document.getElementById('color-rgb'),// RGB 表示
    colorHsv: document.getElementById('color-hsv'),// HSV 表示
    colorPreview: document.getElementById('color-preview'),// 色プレビューエリア
    coordinateDisplay: document.getElementById('coordinate-display'), /* 座標表示用オーバーレイ要素 */
    scrollToTopButton: document.getElementById('scroll-to-top'), // 一番上にスクロールボタン
    downloadPaletteBtn: document.getElementById('download-palette'),// パレットダウンロードボタン
    downloadHistoryBtn: document.getElementById('download-history'),// ヒストリーダウンロードボタン
    canvasMessage: document.getElementById('canvas-message'),
  };
  
  const ctx = uiElements.canvas.getContext('2d', {
    willReadFrequently: true
  });
  
  let lastColor = null;
  // 共通のフラグ（ドラッグ中かどうか）
  let isDragging = false;
  
  /**
  * 交互開始時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionStart(e) {
    e.preventDefault(); // デフォルト動作の抑制（タッチスクロールなどを防ぐ）
    isDragging = true;
    updateColorPreview(e); // イベントオブジェクトをそのまま渡す
  }
  
  /**
  * 移動時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionMove(e) {
    e.preventDefault();
    if (isDragging) {
      updateColorPreview(e);
    }
  }
  
  /**
  * 終了時のハンドラ（マウス、タッチどちらも）
  * @param {Event} e 
  */
  function onInteractionEnd(e) {
    e.preventDefault();
    isDragging = false;
    uiElements.colorPreview.classList.add('hidden'); // プレビューを非表示にする
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
  
  // カラー更新処理（アロー関数、分割代入）
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
    console.log(hex);
  };
  
  /** ヘルパー関数：16進数から現在色表示を更新する
  * @param {string} hex
  */
  function updateCurrentColor(hex) {
    uiElements.currentColorDisplay.style.background = hex;
    uiElements.colorHex.textContent = hex;
    const currentColor = new ColorHelper(hex);
    const [r, g, b] = currentColor.toRGB();
    uiElements.colorRgb.textContent = `${r}, ${g}, ${b}`;
    const [h, s, v] = currentColor.toHsv();
    uiElements.colorHsv.textContent = `${h}, ${s}, ${v}`;
  }
  
  let img = new Image();
  
  // 画像読み込み処理
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
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
    
    uiElements.downloadPaletteBtn.disabled = uiElements.paletteContainer.length > 0;
  }
  
  // マウス移動時にカーソル下の色を取得して表示
  uiElements.canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getCanvasCoordinates(event, uiElements.canvas);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b, a] = pixel;
    if (a === 0) return;  // 透明な場合は無視
    const hex = ColorHelper.rgbToHex(r, g, b);
    updateCurrentColor(hex)
  });
  
  // クリック時に現在のカーソル色をカラーヒストリーに追加
  uiElements.canvas.addEventListener('click', (e) => {
    const { x, y } = getCanvasCoordinates(event, uiElements.canvas);
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
    uiElements.historyContainer.appendChild(colorDiv);
    // ヒストリーに項目が追加されたので、ダウンロードボタンを有効化
    uiElements.downloadHistoryBtn.disabled = uiElements.historyContainer.length > 0;
  }
  
    /**
    * 指定のコンテナ内の各カラーボックスをキャンバスに描画する共通関数
    * @param {CanvasRenderingContext2D} ctx - 描画先のキャンバスコンテキスト
    * @param {HTMLElement} container - カラーボックスが含まれるコンテナ（例：historyContainer や paletteContainer）
    * @param {number} itemSize - 各色ボックスのサイズ（ピクセル）
    * @param {number} columns - 1行あたりのボックス数
    * @param {number} offsetY - キャンバス上に描画する際の縦方向のオフセット
    */
    function drawColorBoxes(ctx, container, itemSize, columns, offsetY) {
      const items = container.querySelectorAll('.color-box');
      items.forEach((item, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        // title 属性に hex が入っている前提（もしくは style.backgroundColor）
        const hex = item.title || item.style.backgroundColor;
        ctx.fillStyle = hex;
        ctx.fillRect(col * itemSize, offsetY + row * itemSize, itemSize, itemSize);
        // 境界線の描画
        ctx.strokeStyle = "#000";
        ctx.strokeRect(col * itemSize, offsetY + row * itemSize, itemSize, itemSize);
      });
    }
  
  // ヒストリー画像ダウンロード処理
  uiElements.downloadHistoryBtn.addEventListener('click', () => {
    // ヒストリー内の色ボックスをまとめたキャンバスを作成
    const historyItems = uiElements.historyContainer.querySelectorAll('.color-box');
    if (historyItems.length === 0) {
      alert("ヒストリーに色がありません。");
      return;
    }
    // 選択されたオプションを取得
    const selectedOption = document.querySelector('input[name="history-download-option"]:checked').value;
    if (selectedOption === "include") {
      // 元画像付きでダウンロード
      const downloadCanvas = document.createElement('canvas');
      // キャンバスの高さは元画像とヒストリー領域の高さを合わせる
      downloadCanvas.width = uiElements.canvas.width;
      downloadCanvas.height = uiElements.canvas.height + uiElements.historyContainer.offsetHeight + 20;
      const downloadCtx = downloadCanvas.getContext('2d');
      
      // 元画像を描画
      downloadCtx.drawImage(img, 0, 0);
      
      // ヒストリーの色ボックスを元画像の下に描画
      const itemSize = 40;  // 各色ボックスのサイズ
      let yOffset = uiElements.canvas.height + 10;
      historyItems.forEach((item, index) => {
        const col = index % 10;
        const row = Math.floor(index / 10);
        downloadCtx.fillStyle = item.title;  // title 属性に hex 値を設定している
        downloadCtx.fillRect(col * itemSize, yOffset + row * itemSize, itemSize, itemSize);
        // 境界線描画
        downloadCtx.strokeStyle = "#000";
        downloadCtx.strokeRect(col * itemSize, yOffset + row * itemSize, itemSize, itemSize);
      });
      
      const dataURL = downloadCanvas.toDataURL("image/png");
      const a = document.createElement('a');
      const now = new Date().toISOString();
      a.download = `color_history_with_image_${now}.png`;
      a.href = dataURL;
      a.click();
      
    } else {
      // ヒストリー情報のみでダウンロード
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = uiElements.historyContainer.offsetWidth;
      downloadCanvas.height = uiElements.historyContainer.offsetHeight;
      const downloadCtx = downloadCanvas.getContext('2d');
      
      const itemSize = 40;
      historyItems.forEach((item, index) => {
        const col = index % 10;
        const row = Math.floor(index / 10);
        downloadCtx.fillStyle = item.title;
        downloadCtx.fillRect(col * itemSize, row * itemSize, itemSize, itemSize);
      });
      
      const dataURL = downloadCanvas.toDataURL("image/png");
      const a = document.createElement('a');
      const now = new Date().toISOString();
      a.download = `color_history_only_${now}.png`;
      a.href = dataURL;
      a.click();
    }
  });
  
    // パレットダウンロード処理
  uiElements.downloadPaletteBtn.addEventListener('click', () => {
    const selectedOption = document.querySelector('input[name="download-option"]:checked').value;
    
    if (selectedOption === "include") {
      // 元画像の下にカラーパレット情報を追加してダウンロード
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = uiElements.canvas.width;
      downloadCanvas.height = uiElements.canvas.height + uiElements.paletteContainer.offsetHeight + 20;
      const downloadCtx = downloadCanvas.getContext('2d');
      
      // 元画像をキャンバスに描画
      downloadCtx.drawImage(img, 0, 0);
      
      // カラーパレット情報を描画
      let yOffset = uiElements.canvas.height + 10;
      const colorDivs = uiElements.paletteContainer.querySelectorAll('.color-box');
      colorDivs.forEach((colorDiv, index) => {
        const hex = colorDiv.style.backgroundColor;
        downloadCtx.fillStyle = hex;
        downloadCtx.fillRect(index % 16 * 40, yOffset + Math.floor(index / 16) * 40, 40, 40);
      });
      
      // ダウンロード
      const dataURL = downloadCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      const now = new Date().toISOString();
      a.download = `image_with_palette_${now}.png`;
      a.href = dataURL;
      a.click();
    } else {
      // カラーパレット情報のみダウンロード
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = uiElements.paletteContainer.offsetWidth;
      downloadCanvas.height = uiElements.paletteContainer.offsetHeight;
      const downloadCtx = downloadCanvas.getContext('2d');
      
      // カラーパレット情報を描画
      const colorDivs = uiElements.paletteContainer.querySelectorAll('.color-box');
      colorDivs.forEach((colorDiv, index) => {
        const hex = colorDiv.style.backgroundColor;
        downloadCtx.fillStyle = hex;
        downloadCtx.fillRect(index % 16 * 40, Math.floor(index / 16) * 40, 40, 40);
      });
      
      // ダウンロード
      const dataURL = downloadCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      const now = new Date().toISOString();
      a.download = `palette_only_${now}.png`;
      a.href = dataURL;
      a.click();
    }
  });
  
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

  // テーマ管理クラス
  class ThemeManager {
    /**
    * コンストラクタ
    * ブラウザのローカルストレージに選択したテーマ（ライトモード・ダークモード）を保存し、表示時に使用します。
    */
    constructor() {
      this.currentMode = localStorage.getItem('theme') || 'light';
      this.themeToggleBtn = uiElements.themeToggleBtn;
      this.initialize();
    }
    /**
    * 初期化関数
    */
    initialize() {
      this.applyTheme();
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    /**
    * テーマを適用し画面に表示する関数
    */
    applyTheme() {
      const isDark = this.currentMode === 'dark';
      document.body.classList.toggle('dark', isDark);
      document.body.classList.toggle('bg-gray-900', isDark);
      document.body.classList.toggle('bg-gray-100', !isDark);
      this.themeToggleBtn.textContent = isDark ? "☀️ライトモードへ" : "🌙ダークモードへ";
      this.themeToggleBtn.classList.toggle('text-white', isDark);
      this.themeToggleBtn.classList.toggle('text-black', !isDark);
      localStorage.setItem('theme', this.currentMode);
    }
    /**
    * テーマを切り替える関数
    */
    toggleTheme() {
      this.currentMode = this.currentMode === 'light' ? 'dark' : 'light';
      this.applyTheme();
    }
  }

  // -------------------------------
  // テーマ切替・初期表示処理
  // -------------------------------
  this.themeManager = new ThemeManager();
