# build.ps1
# ��ƃf�B���N�g�����X�N���v�g�̂���f�B���N�g���ɕύX
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# �e�t�@�C���̓ǂݍ���
$template = Get-Content -Raw -Path "index.template.html"
$cssContent = Get-Content -Raw -Path "src/styles.css"

# JavaScript�t�@�C���̓ǂݍ��ݏ����`
$jsFiles = @(
    "src/library.js",
    "src/model.js",
    "src/view.js",
    "src/controller.js",
    "src/main.js"
)

# ���ׂĂ�JS�t�@�C���̓��e������
$jsContent = ""
foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        $jsContent += "`n" + (Get-Content -Raw -Path $file) + "`n"
    } else {
        Write-Host "�x��: �t�@�C����������܂��� -> $file"
    }
}

# �e���v���[�g���̃v���[�X�z���_�[��u��
$template = $template -replace '<!-- INLINE_CSS -->', $cssContent
$template = $template -replace '<!-- INLINE_JS -->', $jsContent

# �o�̓t�@�C�������w�肵�ĕۑ�
$outputFile = "index.html"
$template | Out-File -Encoding UTF8 $outputFile

Write-Host "? �r���h����: $outputFile ����������܂����B"
