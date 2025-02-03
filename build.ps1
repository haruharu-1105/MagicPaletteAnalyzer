# build.ps1

# 作業ディレクトリをスクリプトのあるディレクトリに変更
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# ==========================
# 設定
# ==========================
$template_file = "src/index.template.html"
$output_file = "dist/index.html"
$artifactFile = "dist/build_artifacts_hashes.txt"

# JavaScriptファイルの読み込み順を定義
$jsFiles = @(
    "src/color-helper.js",
    "src/ui.js",
    "src/theme-manager.js",
    "src/main.js"
)

# 入力ファイルリストの定義
$inputFiles = @($template_file) + $jsFiles

# ==========================
# BuildProcess クラス
# ==========================
class BuildProcess {
    [string]$artifactFile
    [array]$inputFiles
    [array]$jsFiles
    [string]$templateFile
    [string]$outputFile

    BuildProcess($templateFile, $jsFiles, $outputFile, $artifactFile) {
        $this.templateFile = $templateFile
        $this.jsFiles = $jsFiles
        $this.outputFile = $outputFile
        $this.artifactFile = $artifactFile
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
    GenerateFileHashes($inputFiles) {
        Write-Host "`n=== ビルド構成物のハッシュを生成 ==="
        "Build Input Hashes:" | Out-File $this.artifactFile -Encoding utf8
        foreach ($file in $inputFiles) {
            if (Test-Path $file) {
                $hash = (Get-FileHash $file -Algorithm SHA256).Hash
                "$($file): $hash" | Out-File $this.artifactFile -Append -Encoding utf8
                Write-Host "OK: ハッシュを生成しました -> $file"
            } else {
                "$($file): Not Found" | Out-File $this.artifactFile -Append -Encoding utf8
                Write-Host "!!: ファイルが見つかりません、ハッシュ生成をスキップします -> $file"
            }
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

        # 出力ファイルを書き込む（BOMなしUTF-8）
        $this.WriteFileUTF8NoBOM($this.outputFile, $template)

        # ビルド生成物のハッシュ
        Write-Host "`n=== ビルド生成物のハッシュを生成 ==="
        "`nBuild Output Hash:" | Out-File $this.artifactFile -Append -Encoding utf8

        if (Test-Path $this.outputFile) {
            $outputHash = (Get-FileHash $this.outputFile -Algorithm SHA256).Hash
            "$($this.outputFile): $outputHash" | Out-File $this.artifactFile -Append -Encoding utf8
            Write-Host "OK: 生成物のハッシュを記録しました -> $this.outputFile"
        } else {
            "$($this.outputFile): Not Generated" | Out-File $this.artifactFile -Append -Encoding utf8
            Write-Host "!!: 生成物が見つからないため、ハッシュを記録できません。"
            exit 1
        }

        Write-Host "OK: ビルド完了: $this.outputFile が生成されました。"
        Write-Host "アーティファクトファイル: $this.artifactFile"
    }
}

# ==========================
# ビルドプロセス開始
# ==========================
$buildProcess = [BuildProcess]::new($template_file, $jsFiles, $output_file, $artifactFile)
$buildProcess.GenerateFileHashes($inputFiles)
$buildProcess.Build()

exit 0
