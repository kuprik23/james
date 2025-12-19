# 🚀 Quick Start Guide - CYBERCAT Standalone

```
  ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗
 ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝
 ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║
 ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║
 ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║
  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝
```

**Cyber Analysis & Threat Detection System**

## Step 1: Extract the Package

Extract the entire `james-standalone-windows` folder to a location on your computer, such as:
- `C:\Program Files\James-Ultimate\`
- `C:\Users\YourName\Desktop\James\`
- Any folder you prefer

## Step 2: Choose Your Interface

### Option A: Web Interface (Easiest)
1. Navigate to the `dist` folder
2. Double-click **`Start-James-GUI.bat`**
3. Your browser opens automatically
4. Done! 🎉

### Option B: Command Line
1. Navigate to the `dist` folder
2. Double-click **`Start-James-CLI.bat`**
3. Type your questions
4. Type `/exit` to quit

### Option C: Quick Security Scan
1. Navigate to the `dist` folder
2. Double-click **`Run-Security-Scan.bat`**
3. View your security report

## Step 3: Configure (Optional)

### For Cloud AI (OpenAI, Claude, etc.)
1. Go to `dist\config` folder
2. Open `.env.example` in Notepad
3. Copy it and rename to `.env`
4. Add your API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
5. Save and restart James

### For Local AI (No Internet Required)
1. Install Ollama from https://ollama.ai
2. Open command prompt and run:
   ```
   ollama pull llama2
   ```
3. Start CYBERCAT - it auto-detects Ollama!

## First Time Setup Checklist

✅ Extract package to your preferred location
✅ Run `Start-James-GUI.bat` from `dist` folder
✅ (Optional) Add API key in `config/.env`
✅ (Optional) Install Ollama for local AI
✅ Start using CYBERCAT! 🐱

## Quick Commands

From the `dist` folder, you can run:

```batch
# Start web interface
James.exe start

# Chat mode
James.exe chat

# Security scan
James.exe scan

# List features
James.exe tools
James.exe agents
James.exe providers
```

## Need Help?

- Check `README.md` for full documentation
- Check `logs/james.log` for error messages
- Ensure port 3000 is not in use by another application

## System Requirements

✔️ Windows 10 or 11 (64-bit)  
✔️ 4 GB RAM minimum  
✔️ Internet connection (for cloud AI)  
✔️ Modern web browser (Chrome, Edge, Firefox)

---

**That's it! You're ready to use CYBERCAT! 🐱🛡️**

**Stay secure with military-grade AI protection!**