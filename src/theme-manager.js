// src/theme-manager.js

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
