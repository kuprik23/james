# Node.js Installation Guide for Windows

## Step-by-Step Installation

1. **Locate the Downloaded Installer**
   - Check your Downloads folder for `node-v24.12.0-x64.msi` (or similar)
   - Double-click to run the installer

2. **Installation Process**
   - Click "Next" on the welcome screen
   - Accept the license agreement
   - Use the default installation path (or choose custom)
   - Leave all features selected
   - **Important**: Ensure "Automatically install the necessary tools" is checked
   - Click "Install" (may require administrator privileges)
   - Click "Finish" when complete

3. **Restart Terminal/VSCode**
   - Close all terminal windows
   - Restart VSCode to ensure PATH updates are loaded

## Verify Installation

After restarting, run these commands:

```bash
# Check Node.js version
node --version
# Should output: v24.12.0 (or similar)

# Check npm version  
npm --version
# Should output: 11.6.2 (or similar)
```

## What's Next?

Once Node.js is installed:
1. Run `python setup_mcp_server.py` to complete MCP server setup
2. Add your Digital Ocean API token when prompted
3. The MCP server will be automatically available in VSCode

## Troubleshooting

### Node.js not recognized?
- Ensure you restarted your terminal/VSCode
- Check if Node.js is in your PATH:
  ```bash
  echo %PATH%
  ```
- If not, add manually:
  - System Properties > Environment Variables
  - Add to PATH: `C:\Program Files\nodejs\`

### Installation failed?
- Run installer as Administrator
- Disable antivirus temporarily
- Check Windows Event Viewer for errors

### npm command not found?
- npm is installed with Node.js
- If missing, reinstall Node.js with all features selected
