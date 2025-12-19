@echo off
echo Digital Ocean Token Setup
echo ========================
echo.
echo Please enter your Digital Ocean API token below.
echo It should start with "dop_v1_" and be about 64 characters long.
echo.
set /p TOKEN=Enter your Digital Ocean API token: 
echo.
echo DIGITALOCEAN_API_TOKEN=%TOKEN% > mcp-servers\digitalocean\.env
echo LOG_LEVEL=info >> mcp-servers\digitalocean\.env
echo.
echo Token saved to mcp-servers\digitalocean\.env
echo.
echo You can now run: python setup_mcp_server.py
pause
