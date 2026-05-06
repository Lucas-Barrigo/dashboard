@echo off
echo A parar backend (python)...
taskkill /F /IM python.exe 2>nul
echo A parar frontend (node)...
taskkill /F /IM node.exe 2>nul
echo Feito.
pause
