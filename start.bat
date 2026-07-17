@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo Vite サーバーを起動します...
echo 起動後、ブラウザで http://localhost:5173 を開いてください
echo 終了するにはこのウィンドウを閉じてください
echo.

start "" "http://localhost:5173"

"C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js
