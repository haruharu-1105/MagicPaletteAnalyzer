# named-color.txt から namedColor.js を生成するスクリプト

$inputFile = "assets/named-color.txt"
$outputFile = "named-color.js"

# ファイルをUTF-8 (BOMなし) で書き込む
function WriteFileUTF8NoBOM($path, $content) {
  try {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    $writer = [System.IO.StreamWriter]::new($path, $false, $encoding)
    $writer.Write($content)
    $writer.Close()
    Write-Host "OK: $path をBOMなしUTF-8で保存しました。"
    return
  } catch {
    Write-Host "NG: ファイル書き込みに失敗しました -> $path"
    exit 1
  }
}

# 出力用
# 重複を防ぐためのOrderedDictionary
$colorDict = [ordered]@{}

# 入力ファイルを読み込む
Get-Content $inputFile | ForEach-Object {
    # コメントや空行をスキップ
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }

    # タブまたはスペース区切りで分割
    $parts = $_ -split '\s+'

    # データが正しく解析できるかチェック（最低3つの要素が必要）
    if ($parts.Length -ge 3) {
        $name = $parts[0]
        $hex = $parts[1]
        $rgb = $parts[2] -split ','

        # RGB値を数値に変換
        $r = [int]$rgb[0]
        $g = [int]$rgb[1]
        $b = [int]$rgb[2]

        # 重複チェック
        if (-not ($colorDict.Keys -contains $name)) {
            # 初出の色のみ登録
            $colorDict[$name] = @{ hex = $hex; rgb = @($r, $g, $b) }
        } else {
            Write-Host "重複スキップ: $name ($hex)"
        }
    }
}

# JavaScriptのオブジェクト用リスト
$jsArray = [System.Collections.ArrayList]@()

# JavaScript用データ生成
foreach ($key in $colorDict.Keys) {
    $color = $colorDict[$key]
    $line = "`t`"$key`": { hex: `"$($color.hex)`", rgb: [$($color.rgb -join ', ')] }"
    [void]$jsArray.Add($line)
}

# JavaScriptファイルとして保存
$jsContent = @"
// src/named-color.js

/**
 * NamedColor クラスは、名前付きの色に関する情報とユーティリティ関数を提供します。
 * 主な機能として、HEX 値から色名の検索、最も近い色の探索、HEX 値の RGB 変換などを行います。
 */
class NamedColor {
    /**
     * 定義済みの名前付き色の一覧。
     * 各キーは色名を表し、対応する値は HEX 表記と RGB 配列を持つオブジェクトです。
     */
    static COLORS = {
$( $jsArray -join ",`n" )
    };
    
    /**
     * 指定された HEX 値に完全一致する色名を返します。
     * 一致しない場合は null を返します。
     *
     * @param {string} hex - 検索対象の HEX カラーコード（例: "#FF0000"）。
     * @returns {string|null} - 見つかった色名、もしくは null。
     */
    static findByHex(hex) {
      hex = hex.toLowerCase();
      for (const [name, color] of Object.entries(NamedColor.COLORS)) {
         if (color.hex.toLowerCase() === hex) {
             return name;
         }
     }
     return null;
    }

    /**
     * 指定された HEX 値に最も近い色の名前を返します。
     * 色の近さは、RGB 各成分のユークリッド距離に基づいて計算されます。
     * 入力 HEX 値が不正な場合は null を返します。
     *
     * @param {string} hex - 探索対象の HEX カラーコード（例: "#3f627e"）。
     * @returns {string|null} - 最も近い色の名前、もしくは null。
     */
    static findClosestHex(hex) {
        const rgb = NamedColor.hexToRgb(hex);
        if (!rgb) return null;
        let closestColor = null;
        let minDistance = Infinity;
        for (const [name, color] of Object.entries(NamedColor.COLORS)) {
            const distance = Math.sqrt(
                Math.pow(rgb[0] - color.rgb[0], 2) +
                Math.pow(rgb[1] - color.rgb[1], 2) +
                Math.pow(rgb[2] - color.rgb[2], 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = name;
            }
        }
        
        return closestColor;
    }
    /**
     * HEX カラーコードを RGB 配列に変換します。
     * 3桁の省略形もサポートします。
     *
     * @param {string} hex - 変換対象の HEX カラーコード（例: "#fff" や "#ffffff"）。
     * @returns {number[]} - 変換された RGB 値の配列（例: [255, 255, 255]）。
     */
    static hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const bigint = parseInt(hex, 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }
}

"@

# ファイルに出力
WriteFileUTF8NoBOM $outputFile $jsContent
Write-Output "namedColor.js を生成しました！"
