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

class NamedColor {
    static COLORS = {
$( $jsArray -join ",`n" )
    };
    static findByHex(hex) {
      hex = hex.toLowerCase();
      for (const [name, color] of Object.entries(NamedColor.COLORS)) {
         if (color.hex.toLowerCase() === hex) {
             return name;
         }
     }
     return null;
    }

    static findClosestHex(hex) {
        const rgb = NamedColors.hexToRgb(hex);
        if (!rgb) return null;
        let closestColor = null;
        let minDistance = Infinity;
        for (const [name, color] of Object.entries(NamedColors.COLORS)) {
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
