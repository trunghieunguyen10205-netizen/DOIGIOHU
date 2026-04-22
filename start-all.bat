@echo off
title Doi Gio Hu - Start All Servers
echo.
echo  ========================================
echo   DOI GIO HU - Khoi dong tat ca server
echo  ========================================
echo.
echo  [1] Backend API    ^> http://localhost:3001
echo  [2] Customer App   ^> http://localhost:5174
echo  [3] Staff App      ^> http://localhost:5173
echo.
echo  Dang khoi dong...
echo.

:: Backend
start "BACKEND :3001" cmd /k "cd /d C:\Users\Admin\Downloads\DOIGIOHU\BACKENDQUANNUOC && npm run dev"

:: Doi 1 giay
timeout /t 1 /nobreak > nul

:: Customer App
start "CUSTOMER :5174" cmd /k "cd /d C:\Users\Admin\Downloads\DOIGIOHU\FONTENDQUANNUOC\customer && npm run dev"

:: Staff App
start "STAFF :5173" cmd /k "cd /d C:\Users\Admin\Downloads\DOIGIOHU\FONTENDQUANNUOC\staff && npm run dev"

:: Doi server khoi dong xong roi mo browser
timeout /t 4 /nobreak > nul
start "" "http://localhost:5174/menu"

echo.
echo  Tat ca server da khoi dong!
echo  Nhan phim bat ky de dong cua so nay...
pause > nul
