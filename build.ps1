# build.ps1
# ��ƃf�B���N�g�����X�N���v�g�̂���f�B���N�g���ɕύX
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# ==========================
# �ݒ�
# ==========================
$template_file = "src/index.template.html"
$output_file = "index.html"

# JavaScript�t�@�C���̓ǂݍ��ݏ����`
$jsFiles = @(
    "src/library.js",
    "src/model.js",
    "src/view.js",
    "src/controller.js",
    "src/main.js"
)

# ==========================
# �֐���`
# ==========================
# �t�@�C����UTF-8�œǂݍ��ށiBOM�Ȃ��j
function Read-FileUTF8($path) {
    if (-not (Test-Path $path)) {
        Write-Host "!!: �t�@�C����������܂��� -> $path"
        return ""
    }
    Write-Host "OK: �t�@�C����ǂݍ��݂܂��� -> $path"
    return Get-Content -Raw -Path $path -Encoding UTF8
}
# �t�@�C����UTF-8 (BOM�Ȃ�) �ŏ������ށi.NET Framework��StreamWriter���g�p�j
function Write-FileUTF8NoBOM($path, $content) {
    try {
        $encoding = New-Object System.Text.UTF8Encoding($false)  # BOM�Ȃ�UTF-8
        $writer = [System.IO.StreamWriter]::new($path, $false, $encoding)
        $writer.Write($content)
        $writer.Close()
        Write-Host "OK: $path ��BOM�Ȃ�UTF-8�ŕۑ����܂����B"
    } catch {
        Write-Host "NG: �t�@�C���������݂Ɏ��s���܂��� -> $path"
    }
}

# ==========================
# �r���h����
# ==========================

# �e���v���[�g�t�@�C���̓ǂݍ���
$template = Read-FileUTF8 $template_file
if ($template -eq "") {
    Write-Host "NG: �e���v���[�g�̓ǂݍ��݂Ɏ��s�������߁A�����𒆒f���܂��B"
    exit 1
}


# ���ׂĂ�JS�t�@�C���̓��e������
$jsContent = ""
foreach ($file in $jsFiles) {
    $jsContent += "`n" + (Read-FileUTF8 $file) + "`n"
}

# �e���v���[�g���̃v���[�X�z���_�[��u��
$template = $template -replace '<!-- INLINE_JS -->', $jsContent

# �o�̓t�@�C�����������ށiBOM�Ȃ�UTF-8�j
Write-FileUTF8NoBOM $output_file $template


Write-Host "OK:�r���h����: $outputFile ����������܂����B"
exit 0
