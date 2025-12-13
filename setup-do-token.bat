@echo off
echo ============================================
echo Digital Ocean API Token Setup
echo ============================================
echo.
echo To get your API token:
echo 1. Go to: https://cloud.digitalocean.com/account/api/tokens
echo 2. Click "Generate New Token"
echo 3. Name it "James AI Security Agent"
echo 4. Select READ permissions (or full access if needed)
echo 5. Copy the token (starts with dop_v1_)
echo.
set /p TOKEN="Enter your Digital Ocean API token: "
echo.
echo # Digital Ocean API Configuration > digitalocean-mcp\.env
echo DIGITALOCEAN_API_TOKEN=%TOKEN% >> digitalocean-mcp\.env
echo LOG_LEVEL=info >> digitalocean-mcp\.env
echo.
echo [SUCCESS] Token saved to digitalocean-mcp\.env
echo.
echo You can now test the MCP server by running:
echo   cd digitalocean-mcp
echo   npm start
echo.
pause