# build.ps1

# 作業ディレクトリをスクリプトのあるディレクトリに変更
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# ==========================
# 設定
# ==========================
$template_file = "src/index.template.html"
# JavaScriptファイルの読み込み順を定義
$jsFiles = @(
    "src/color-helper.js",
    "src/ui.js",
    "src/theme-manager.js",
    "src/main.js"
)

# ==========================
# BuildProcess クラス
# ==========================
class BuildProcess {
    [string]$artifactFile
    [array]$inputFiles # 入力ファイルリスト
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

    # ファイルをUTF-8で読み込む（BOMなし）
    [string] ReadFileUTF8($path) {
        if (-not (Test-Path $path)) {
            Write-Host "!!: ファイルが見つかりません -> $path"
            exit 1
        }
        Write-Host "OK: ファイルを読み込みました -> $path"
        return Get-Content -Raw -Path $path -Encoding UTF8
    }

    # ファイルをUTF-8 (BOMなし) で書き込む
    WriteFileUTF8NoBOM($path, $content) {
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

    # ハッシュ生成
    GenerateFileHashes() {
        Write-Host "`n=== ビルド構成物の証跡ハッシュを生成 ==="
        "Build Input Hashes:" | Out-File $this.artifactFile -Encoding utf8
        foreach ($file in $this.inputFiles) {
            if (Test-Path $file) {
                $hash = (Get-FileHash $file -Algorithm SHA256).Hash
                "$($file): $hash" | Out-File $this.artifactFile -Append -Encoding utf8
            } else {
                "$($file): Not Found" | Out-File $this.artifactFile -Append -Encoding utf8
                Write-Host "!!: ファイルが見つかりません、ハッシュを記録できません。 -> $file"
                exit 1
            }
        }

        # ビルド生成物のハッシュ
        "`nBuild Output Hash:" | Out-File $this.artifactFile -Append -Encoding utf8
        if (Test-Path $this.outputFile) {
            $outputHash = (Get-FileHash $this.outputFile -Algorithm SHA256).Hash
            "$($this.outputFile): $outputHash" | Out-File $this.artifactFile -Append -Encoding utf8
        } else {
            "$($this.outputFile): Not Generated" | Out-File $this.artifactFile -Append -Encoding utf8
            Write-Host "!!: 生成物が見つからないため、ハッシュを記録できません。"
            exit 1
        }
    }

    # ファイルのバックアップを作成 (_backup を付加)
    BackupFile($filePath) {
        if (Test-Path $filePath) {
            $backupFile = $filePath -replace '\.([^\.]+)$', '_backup.$1'  # "index.html" → "index_backup.html"
            Copy-Item -Path $filePath -Destination $backupFile -Force
            Write-Host "OK: バックアップを作成しました -> $backupFile"
        } else {
            Write-Host "!!: バックアップ不要（$filePath が存在しないためスキップ）"
        }
    }

    # ビルド処理
    Build() {
        Write-Host "`n=== ビルド処理を開始 ==="

        # テンプレートファイルの読み込み
        $template = $this.ReadFileUTF8($this.templateFile)
        if ($template -eq "") {
            Write-Host "NG: テンプレートの読み込みに失敗したため、処理を中断します。"
            exit 1
        }

        # すべてのJSファイルの内容を結合
        $jsContent = ""
        foreach ($file in $this.jsFiles) {
            $jsContent += $this.ReadFileUTF8($file)
        }

        # テンプレート内のプレースホルダーを置換
        $template = $template -replace '<!-- INLINE_JS -->', $jsContent

        # バックアップ作成
        $this.BackupFile($this.outputFile)

        # 出力ファイルを書き込む（BOMなしUTF-8）
        $this.WriteFileUTF8NoBOM($this.outputFile, $template)
        
        # ビルド生成物のハッシュ
        $this.GenerateFileHashes()

        Write-Host "`n=== ビルド完了 ==="
        Write-Host "成果物: $($this.outputFile)"
        Write-Host "アーティファクトファイル: $($this.artifactFile)"
    }
}

# ==========================
# ビルドプロセス開始
# ==========================
$buildProcess = [BuildProcess]::new($template_file, $jsFiles)
$buildProcess.Build()

exit 0
