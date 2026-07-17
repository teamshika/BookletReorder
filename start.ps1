[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location $PSScriptRoot

Write-Host "Vite サーバーを起動します..."
Write-Host "起動後、ブラウザで http://localhost:5173 を開いてください"
Write-Host "終了するにはこのウィンドウを閉じてください"
Write-Host ""

# 4秒後にブラウザを自動で開く
Start-Process powershell -ArgumentList "-WindowStyle Hidden -Command `"Start-Sleep 4; Start-Process 'http://localhost:5173'`""

# Vite を Node.js で直接起動
& "C:\Program Files\nodejs\node.exe" "$PSScriptRoot\node_modules\.bin\vite"
