@echo off
echo ============================================
echo CYBERCAT - Secure Token Storage
echo Military-Grade Encryption (DPAPI)
echo ============================================
echo.
echo This will securely store your Digital Ocean API token
echo using Windows Data Protection API (DPAPI) encryption.
echo.
echo The token will be:
echo   - Encrypted with your Windows user credentials
echo   - Stored locally (never in version control)
echo   - Only accessible by your user account
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0credential-manager.ps1" -Action Store -CredentialName "JamesAI_DigitalOcean"

echo.
echo ============================================
echo Token stored securely!
echo ============================================
pause
