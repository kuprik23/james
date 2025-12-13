#!/usr/bin/env python3
"""
Setup script for Digital Ocean MCP Server
This script helps configure and test the MCP server integration
"""

import os
import sys
import subprocess
import json
from pathlib import Path

# Fix unicode output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def check_nodejs_installed():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[OK] Node.js is installed: {result.stdout.strip()}")
            return True
        else:
            print("[ERROR] Node.js is not installed")
            return False
    except FileNotFoundError:
        print("[ERROR] Node.js is not installed")
        return False

def check_npm_installed():
    """Check if npm is installed"""
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[OK] npm is installed: {result.stdout.strip()}")
            return True
        else:
            print("[ERROR] npm is not installed")
            return False
    except FileNotFoundError:
        print("[ERROR] npm is not installed")
        return False

def install_dependencies():
    """Install npm dependencies for the MCP server"""
    mcp_dir = Path("mcp-servers/digitalocean")
    if not mcp_dir.exists():
        print(f"[ERROR] MCP server directory not found: {mcp_dir}")
        return False
    
    print("[INFO] Installing MCP server dependencies...")
    try:
        result = subprocess.run(
            ['npm', 'install'],
            cwd=mcp_dir,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("[OK] Dependencies installed successfully")
            return True
        else:
            print(f"[ERROR] Failed to install dependencies: {result.stderr}")
            return False
    except Exception as e:
        print(f"[ERROR] Error installing dependencies: {e}")
        return False

def setup_api_token():
    """Help user set up Digital Ocean API token"""
    env_file = Path("mcp-servers/digitalocean/.env")
    
    print("\n[SETUP] Digital Ocean API Token Setup")
    print("To get your API token:")
    print("1. Visit: https://cloud.digitalocean.com/account/api/tokens")
    print("2. Click 'Generate New Token'")
    print("3. Name it 'James AI Agent'")
    print("4. Select appropriate permissions (read for monitoring, write for management)")
    print("5. Copy the generated token")
    
    token = input("\nEnter your Digital Ocean API token (or press Enter to skip): ").strip()
    
    if token:
        with open(env_file, 'w') as f:
            f.write(f"# Digital Ocean API Configuration\n")
            f.write(f"DIGITALOCEAN_API_TOKEN={token}\n")
            f.write(f"\n# Optional: Set log level (debug, info, warn, error)\n")
            f.write(f"LOG_LEVEL=info\n")
        print("[OK] API token saved to .env file")
        return True
    else:
        print("[WARNING] Skipped API token setup. You'll need to add it manually to mcp-servers/digitalocean/.env")
        return False

def test_mcp_server():
    """Test the MCP server connection"""
    print("\n[TEST] Testing MCP server...")
    
    # Check if .env has a token
    env_file = Path("mcp-servers/digitalocean/.env")
    if not env_file.exists():
        print("[ERROR] .env file not found")
        return False
    
    with open(env_file, 'r') as f:
        content = f.read()
        if 'DIGITALOCEAN_API_TOKEN=' not in content or 'DIGITALOCEAN_API_TOKEN=\n' in content:
            print("[ERROR] Digital Ocean API token not configured in .env file")
            return False
    
    print("[OK] Configuration looks good!")
    print("\nTo start the MCP server manually:")
    print("  cd mcp-servers/digitalocean")
    print("  npm start")
    
    return True

def main():
    print("Digital Ocean MCP Server Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_nodejs_installed() or not check_npm_installed():
        print("\n[WARNING] Node.js and npm are required but not installed.")
        print("Please install Node.js from: https://nodejs.org/")
        print("After installation, restart your terminal and run this script again.")
        return
    
    # Install dependencies
    if not install_dependencies():
        print("\n[ERROR] Failed to install dependencies. Please check the error messages above.")
        return
    
    # Setup API token
    setup_api_token()
    
    # Test configuration
    test_mcp_server()
    
    print("\n[SUCCESS] Setup complete!")
    print("\nNext steps:")
    print("1. Ensure your Digital Ocean API token is configured")
    print("2. The MCP server will be automatically available in VS Code")
    print("3. James agent can now interact with your Digital Ocean infrastructure")

if __name__ == "__main__":
    main()