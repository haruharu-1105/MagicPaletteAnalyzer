@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "generateNamedColor.ps1"
timeout /T 30
