@echo off
title Imora - local web server
cd /d "%~dp0"

echo.
echo  ================================================
echo    IMORA SITE - starting a local web server
echo  ================================================
echo.
echo  Your browser will open at:
echo      http://localhost:8000/index.html
echo.
echo  You will see two panels. Click the LEFT one
echo  (Photography ^& Videography) to see the 3D camera
echo  in the hero and the lens in the services section.
echo.
echo  KEEP THIS WINDOW OPEN while you browse the site.
echo  Close it when you are finished.
echo.
echo  (If the page looks blank at first, just refresh -
echo   the browser sometimes opens a moment too early.)
echo.

start "" "http://localhost:8000/index.html"

REM Try the usual Python command first.
python -m http.server 8000
if %errorlevel% equ 9009 goto trypy
goto done

:trypy
echo.
echo  'python' was not found - trying 'py' instead...
echo.
py -m http.server 8000
if %errorlevel% equ 9009 goto nopython
goto done

:nopython
echo.
echo  ------------------------------------------------
echo   Python is not installed on this computer.
echo.
echo   The 3D models (.glb files) cannot load unless
echo   the site is served over http, and Python is the
echo   simplest way to do that.
echo.
echo   Install Python from the Microsoft Store (free),
echo   then double-click this file again.
echo.
echo   Alternative: if you have Node.js installed, run
echo       npx serve
echo   in this folder instead.
echo  ------------------------------------------------
echo.
pause

:done
