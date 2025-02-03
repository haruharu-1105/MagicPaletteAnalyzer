# build.ps1
# 作業ディレクトリをスクリプトのあるディレクトリに変更
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# 各ファイルの読み込み
$template = Get-Content -Raw -Path "index.template.html"
$cssContent = Get-Content -Raw -Path "src/styles.css"

# JavaScriptファイルの読み込み順を定義
$jsFiles = @(
    "src/library.js",
    "src/model.js",
    "src/view.js",
    "src/controller.js",
    "src/main.js"
)

# すべてのJSファイルの内容を結合
$jsContent = ""
foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        $jsContent += "`n" + (Get-Content -Raw -Path $file) + "`n"
    } else {
        Write-Host "警告: ファイルが見つかりません -> $file"
    }
}

# テンプレート内のプレースホルダーを置換
$template = $template -replace '<!-- INLINE_CSS -->', $cssContent
$template = $template -replace '<!-- INLINE_JS -->', $jsContent

# 出力ファイル名を指定して保存
$outputFile = "index.html"
$template | Out-File -Encoding UTF8 $outputFile

Write-Host "? ビルド完了: $outputFile が生成されました。"
