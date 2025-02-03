# build.ps1

# ��ƃf�B���N�g�����X�N���v�g�̂���f�B���N�g���ɕύX
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# ==========================
# �ݒ�
# ==========================
$template_file = "src/index.template.html"
# JavaScript�t�@�C���̓ǂݍ��ݏ����`
$jsFiles = @(
    "src/color-helper.js",
    "src/ui.js",
    "src/theme-manager.js",
    "src/main.js"
)

# ==========================
# BuildProcess �N���X
# ==========================
class BuildProcess {
    [string]$artifactFile
    [array]$inputFiles # ���̓t�@�C�����X�g
    [array]$jsFiles
    [string]$templateFile
    [string]$outputFile

    BuildProcess($templateFile, $jsFiles) {
        $this.templateFile = $templateFile
        $this.jsFiles = $jsFiles
        $this.outputFile = "dist/index.html"
        $this.artifactFile = "dist/build_artifacts_hashes.txt"
        $this.inputFiles = @($templateFile) + $jsFiles
    }

    # �t�@�C����UTF-8�œǂݍ��ށiBOM�Ȃ��j
    [string] ReadFileUTF8($path) {
        if (-not (Test-Path $path)) {
            Write-Host "!!: �t�@�C����������܂��� -> $path"
            exit 1
        }
        Write-Host "OK: �t�@�C����ǂݍ��݂܂��� -> $path"
        return Get-Content -Raw -Path $path -Encoding UTF8
    }

    # �t�@�C����UTF-8 (BOM�Ȃ�) �ŏ�������
    WriteFileUTF8NoBOM($path, $content) {
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

    # �n�b�V������
    GenerateFileHashes() {
        Write-Host "`n=== �r���h�\�����̏ؐՃn�b�V���𐶐� ==="
        "Build Input Hashes:" | Out-File $this.artifactFile -Encoding utf8
        foreach ($file in $this.inputFiles) {
            if (Test-Path $file) {
                $hash = (Get-FileHash $file -Algorithm SHA256).Hash
                "$($file): $hash" | Out-File $this.artifactFile -Append -Encoding utf8
            } else {
                "$($file): Not Found" | Out-File $this.artifactFile -Append -Encoding utf8
                Write-Host "!!: �t�@�C����������܂���A�n�b�V�����L�^�ł��܂���B -> $file"
                exit 1
            }
        }

        # �r���h�������̃n�b�V��
        "`nBuild Output Hash:" | Out-File $this.artifactFile -Append -Encoding utf8
        if (Test-Path $this.outputFile) {
            $outputHash = (Get-FileHash $this.outputFile -Algorithm SHA256).Hash
            "$($this.outputFile): $outputHash" | Out-File $this.artifactFile -Append -Encoding utf8
        } else {
            "$($this.outputFile): Not Generated" | Out-File $this.artifactFile -Append -Encoding utf8
            Write-Host "!!: ��������������Ȃ����߁A�n�b�V�����L�^�ł��܂���B"
            exit 1
        }
    }

    # �t�@�C���̃o�b�N�A�b�v���쐬 (_backup ��t��)
    BackupFile($filePath) {
        if (Test-Path $filePath) {
            $backupFile = $filePath -replace '\.([^\.]+)$', '_backup.$1'  # "index.html" �� "index_backup.html"
            Copy-Item -Path $filePath -Destination $backupFile -Force
            Write-Host "OK: �o�b�N�A�b�v���쐬���܂��� -> $backupFile"
        } else {
            Write-Host "!!: �o�b�N�A�b�v�s�v�i$filePath �����݂��Ȃ����߃X�L�b�v�j"
        }
    }

    # �r���h����
    Build() {
        Write-Host "`n=== �r���h�������J�n ==="

        # �e���v���[�g�t�@�C���̓ǂݍ���
        $template = $this.ReadFileUTF8($this.templateFile)
        if ($template -eq "") {
            Write-Host "NG: �e���v���[�g�̓ǂݍ��݂Ɏ��s�������߁A�����𒆒f���܂��B"
            exit 1
        }

        # ���ׂĂ�JS�t�@�C���̓��e������
        $jsContent = ""
        foreach ($file in $this.jsFiles) {
            $jsContent += $this.ReadFileUTF8($file)
        }

        # �e���v���[�g���̃v���[�X�z���_�[��u��
        $template = $template -replace '<!-- INLINE_JS -->', $jsContent

        # �o�b�N�A�b�v�쐬
        $this.BackupFile($this.outputFile)

        # �o�̓t�@�C�����������ށiBOM�Ȃ�UTF-8�j
        $this.WriteFileUTF8NoBOM($this.outputFile, $template)
        
        # �r���h�������̃n�b�V��
        $this.GenerateFileHashes()

        Write-Host "`n=== �r���h���� ==="
        Write-Host "���ʕ�: $($this.outputFile)"
        Write-Host "�A�[�e�B�t�@�N�g�t�@�C��: $($this.artifactFile)"
    }
}

# ==========================
# �r���h�v���Z�X�J�n
# ==========================
$buildProcess = [BuildProcess]::new($template_file, $jsFiles)
$buildProcess.Build()

exit 0
