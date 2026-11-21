@echo off
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" "%~dp0index.html"
) else (
  start "" msedge.exe "%~dp0index.html"
)
exit /b
