# named-color.txt ���� namedColor.js �𐶐�����X�N���v�g

$inputFile = "assets/named-color.txt"
$outputFile = "named-color.js"

# �t�@�C����UTF-8 (BOM�Ȃ�) �ŏ�������
function WriteFileUTF8NoBOM($path, $content) {
  try {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    $writer = [System.IO.StreamWriter]::new($path, $false, $encoding)
    $writer.Write($content)
    $writer.Close()
    Write-Host "OK: $path ��BOM�Ȃ�UTF-8�ŕۑ����܂����B"
    return
  } catch {
    Write-Host "NG: �t�@�C���������݂Ɏ��s���܂��� -> $path"
    exit 1
  }
}

# �o�͗p
# �d����h�����߂�OrderedDictionary
$colorDict = [ordered]@{}

# ���̓t�@�C����ǂݍ���
Get-Content $inputFile | ForEach-Object {
    # �R�����g���s���X�L�b�v
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }

    # �^�u�܂��̓X�y�[�X��؂�ŕ���
    $parts = $_ -split '\s+'

    # �f�[�^����������͂ł��邩�`�F�b�N�i�Œ�3�̗v�f���K�v�j
    if ($parts.Length -ge 3) {
        $name = $parts[0]
        $hex = $parts[1]
        $rgb = $parts[2] -split ','

        # RGB�l�𐔒l�ɕϊ�
        $r = [int]$rgb[0]
        $g = [int]$rgb[1]
        $b = [int]$rgb[2]

        # �d���`�F�b�N
        if (-not ($colorDict.Keys -contains $name)) {
            # ���o�̐F�̂ݓo�^
            $colorDict[$name] = @{ hex = $hex; rgb = @($r, $g, $b) }
        } else {
            Write-Host "�d���X�L�b�v: $name ($hex)"
        }
    }
}

# JavaScript�̃I�u�W�F�N�g�p���X�g
$jsArray = [System.Collections.ArrayList]@()

# JavaScript�p�f�[�^����
foreach ($key in $colorDict.Keys) {
    $color = $colorDict[$key]
    $line = "`t`"$key`": { hex: `"$($color.hex)`", rgb: [$($color.rgb -join ', ')] }"
    [void]$jsArray.Add($line)
}

# JavaScript�t�@�C���Ƃ��ĕۑ�
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

# �t�@�C���ɏo��
WriteFileUTF8NoBOM $outputFile $jsContent
Write-Output "namedColor.js �𐶐����܂����I"
