@echo off
set cwd=%cd%
cd /D "%~dp0"

if not exist "node_modules" call :npminstall
if %errorlevel% neq 0 exit /b %errorlevel%

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo "Error:bdsx requires node. Please install node.js first"
    exit /b %errorlevel%
)

call npm run -s install_bds -- %*
if %errorlevel% neq 0 exit /b %errorlevel%

call npm run -s build
if %errorlevel% neq 0 exit /b %errorlevel%

cd bedrock_server
bedrock_server.exe ..
cd /D "%cwd%"
exit /b

:npminstall
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo "Error:bdsx requires npm. Please install node.js first"
    exit /b %errorlevel%
) 
call npm i
exit /b
