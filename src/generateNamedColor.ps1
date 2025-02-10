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

# JavaScript�p�f�[�^�����i3��ŏo�́j
$sb = New-Object System.Text.StringBuilder
$counter = 0

foreach ($key in $colorDict.Keys) {
    $color = $colorDict[$key]
    $line = "`"$key`": { hex: `"$($color.hex)`", rgb: [$($color.rgb -join ', ')] }"

    if ($counter -gt 0) {
        # 3�񂲂Ƃɉ��s�A����ȊO�̓J���}��؂�
        if ($counter % 3 -eq 0) {
            [void]$sb.AppendLine(",")  # ���s
        } else {
            [void]$sb.Append(", ")
        }
    }
    
    [void]$sb.Append($line)
    $counter++
}

# JavaScript�t�@�C���Ƃ��ĕۑ�
$jsContent = @"
// src/named-color.js

/**
 * NamedColor �N���X�́A���O�t���̐F�Ɋւ�����ƃ��[�e�B���e�B�֐���񋟂��܂��B
 * ��ȋ@�\�Ƃ��āAHEX �l����F���̌����A�ł��߂��F�̒T���AHEX �l�� RGB �ϊ��Ȃǂ��s���܂��B
 */
class NamedColor {
    /**
     * ��`�ς݂̖��O�t���F�̈ꗗ�B
     * �e�L�[�͐F����\���A�Ή�����l�� HEX �\�L�� RGB �z������I�u�W�F�N�g�ł��B
     */
    static COLORS = {
$( $sb.ToString() )
    };
    
    /**
     * �w�肳�ꂽ HEX �l�Ɋ��S��v����F����Ԃ��܂��B
     * ��v���Ȃ��ꍇ�� null ��Ԃ��܂��B
     *
     * @param {string} hex - �����Ώۂ� HEX �J���[�R�[�h�i��: "#FF0000"�j�B
     * @returns {string|null} - ���������F���A�������� null�B
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
     * �w�肳�ꂽ HEX �l�ɍł��߂��F�̖��O��Ԃ��܂��B
     * �F�̋߂��́ALab�F��ԂŌv�Z����鋗���Ɋ�Â��Ă��܂��B
     * ���� HEX �l���s���ȏꍇ�� null ��Ԃ��܂��B
     *
     * @param {string} hex - �T���Ώۂ� HEX �J���[�R�[�h�i��: "#3f627e"�j�B
     * @returns {string|null} - �ł��߂��F�̖��O�A�������� null�B
     */
    static findClosestHex(hex) {
      const color = chroma(hex);  // ���͂��ꂽHEX�J���[
      if (!color) return null;

      let closestColor = null;
      let minDistance = Infinity;

      for (const [name, namedColor] of Object.entries(NamedColor.COLORS)) {
        const distance = chroma.distance(color, chroma(namedColor.hex), 'lab'); // Lab��Ԃŋ������v�Z
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = name;
        }
      }
      
      return closestColor;
    }
}

"@

# �t�@�C���ɏo��
WriteFileUTF8NoBOM $outputFile $jsContent
Write-Output "namedColor.js �𐶐����܂����I"
