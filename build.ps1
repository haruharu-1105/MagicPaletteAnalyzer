# build.ps1
# 作業ディレクトリをスクリプトのあるディレクトリに変更
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# ==========================
# 設定
# ==========================
$template_file = "src/index.template.html"
$output_file = "index.html"

# JavaScriptファイルの読み込み順を定義
$jsFiles = @(
    "src/library.js",
    "src/model.js",
    "src/view.js",
    "src/controller.js",
    "src/main.js"
)

# ==========================
# 関数定義
# ==========================
# ファイルをUTF-8で読み込む（BOMなし）
function Read-FileUTF8($path) {
    if (-not (Test-Path $path)) {
        Write-Host "!!: ファイルが見つかりません -> $path"
        return ""
    }
    Write-Host "OK: ファイルを読み込みました -> $path"
    return Get-Content -Raw -Path $path -Encoding UTF8
}
# ファイルをUTF-8 (BOMなし) で書き込む（.NET FrameworkのStreamWriterを使用）
function Write-FileUTF8NoBOM($path, $content) {
    try {
        $encoding = New-Object System.Text.UTF8Encoding($false)  # BOMなしUTF-8
        $writer = [System.IO.StreamWriter]::new($path, $false, $encoding)
        $writer.Write($content)
        $writer.Close()
        Write-Host "OK: $path をBOMなしUTF-8で保存しました。"
    } catch {
        Write-Host "NG: ファイル書き込みに失敗しました -> $path"
    }
}

# ==========================
# ビルド処理
# ==========================

# テンプレートファイルの読み込み
$template = Read-FileUTF8 $template_file
if ($template -eq "") {
    Write-Host "NG: テンプレートの読み込みに失敗したため、処理を中断します。"
    exit 1
}


# すべてのJSファイルの内容を結合
$jsContent = ""
foreach ($file in $jsFiles) {
    $jsContent += "`n" + (Read-FileUTF8 $file) + "`n"
}

# テンプレート内のプレースホルダーを置換
$template = $template -replace '<!-- INLINE_JS -->', $jsContent

# 出力ファイルを書き込む（BOMなしUTF-8）
Write-FileUTF8NoBOM $output_file $template


Write-Host "OK:ビルド完了: $outputFile が生成されました。"
exit 0
