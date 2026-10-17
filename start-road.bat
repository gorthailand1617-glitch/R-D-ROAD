@echo off
chcp 65001 >nul
echo ========================================================
echo 🚀 กำลังเปิดระบบ ROAD Next-Gen (R&D Research Studio & AI)
echo ========================================================
if exist "D:\--- Sand Box ---\Teacher Plan\node_portable\node.exe" (
    start "" "http://localhost:3080/app?welcome=1"
    "D:\--- Sand Box ---\Teacher Plan\node_portable\node.exe" "%~dp0server.js"
) else (
    start "" "%~dp0index.html"
)
