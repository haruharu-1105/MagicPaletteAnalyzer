// src/main.js

  // -------------------------------
  // テーマ切替・初期表示処理
  // -------------------------------
  this.themeManager = new ThemeManager();

  // ネット環境（httpsプロトコル）で実行されているかを判定
  if (window.location.protocol === "https:") {
     // ネット環境とローカル環境を区別しやすくするため変更
     uiElements.version.classList.add("font-bold", "italic");
  }
