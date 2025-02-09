// src/color-helper.js

  // ------------------------------------------------
  // ColorHelper クラス（色変換・情報取得用のユーティリティクラス）
  // ------------------------------------------------
  class ColorHelper {
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
  }
