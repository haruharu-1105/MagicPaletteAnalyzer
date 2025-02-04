// src/color-helper.js

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
