@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tableau.ps1"
if errorlevel 1 pause
