#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deploy James AI Security Agent to Digital Ocean
This script creates a droplet and deploys the LangGraph agent
"""

import os
import sys
import time
import json
import requests
from dotenv import load_dotenv

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables
load_dotenv()

# Digital Ocean API configuration
DO_API_TOKEN = os.getenv("DIGITALOCEAN_API_TOKEN")
DO_API_BASE = "https://api.digitalocean.com/v2"

# Droplet configuration
DROPLET_CONFIG = {
    "name": "james-security-agent",
    "region": "nyc1",  # New York 1
    "size": "s-1vcpu-1gb",  # $6/month - Basic droplet
    "image": "docker-20-04",  # Docker on Ubuntu 20.04
    "ssh_keys": [],  # Will be populated if SSH keys exist
    "backups": False,
    "ipv6": True,
    "monitoring": True,
    "tags": ["james", "security", "langgraph"]
}

# Cloud-init script to set up the droplet
CLOUD_INIT_SCRIPT = """#!/bin/bash
set -e

# Update system
apt-get update && apt-get upgrade -y

# Install required packages
apt-get install -y git python3-pip python3-venv

# Create app directory
mkdir -p /opt/james-agent
cd /opt/james-agent

# Clone or copy the application (we'll use git)
# For now, create the files directly

# Create requirements.txt
cat > requirements.txt << 'EOF'
langgraph>=0.0.40
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-anthropic>=0.1.0
langchain-community>=0.0.20
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.5.0
python-dotenv>=1.0.0
psutil>=5.9.0
requests>=2.31.0
aiohttp>=3.9.0
rich>=13.7.0
EOF

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service
cat > /etc/systemd/system/james-agent.service << 'EOF'
[Unit]
Description=James AI Security Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/james-agent
Environment=PATH=/opt/james-agent/venv/bin
ExecStart=/opt/james-agent/venv/bin/python server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service (will fail until we have the code)
systemctl daemon-reload
systemctl enable james-agent

# Configure firewall
ufw allow 22/tcp
ufw allow 8000/tcp
ufw --force enable

echo "Setup complete! Upload your code to /opt/james-agent/"
"""


def get_headers():
    """Get API headers"""
    return {
        "Authorization": f"Bearer {DO_API_TOKEN}",
        "Content-Type": "application/json"
    }


def check_api_token():
    """Verify the API token is valid"""
    response = requests.get(
        f"{DO_API_BASE}/account",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        account = response.json()["account"]
        print(f"✅ Authenticated as: {account['email']}")
        return True
    else:
        print(f"❌ Authentication failed: {response.status_code}")
        print(response.text)
        return False


def get_ssh_keys():
    """Get available SSH keys"""
    response = requests.get(
        f"{DO_API_BASE}/account/keys",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        keys = response.json()["ssh_keys"]
        return [key["id"] for key in keys]
    return []


def create_droplet():
    """Create a new droplet"""
    print("\n📦 Creating droplet...")
    
    # Get SSH keys
    ssh_keys = get_ssh_keys()
    if ssh_keys:
        DROPLET_CONFIG["ssh_keys"] = ssh_keys
        print(f"   Using {len(ssh_keys)} SSH key(s)")
    else:
        print("   ⚠️  No SSH keys found. You'll need to use console access.")
    
    # Add cloud-init script
    DROPLET_CONFIG["user_data"] = CLOUD_INIT_SCRIPT
    
    response = requests.post(
        f"{DO_API_BASE}/droplets",
        headers=get_headers(),
        json=DROPLET_CONFIG
    )
    
    if response.status_code == 202:
        droplet = response.json()["droplet"]
        print(f"✅ Droplet created! ID: {droplet['id']}")
        return droplet
    else:
        print(f"❌ Failed to create droplet: {response.status_code}")
        print(response.text)
        return None


def wait_for_droplet(droplet_id, timeout=300):
    """Wait for droplet to be ready"""
    print("\n⏳ Waiting for droplet to be ready...")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        response = requests.get(
            f"{DO_API_BASE}/droplets/{droplet_id}",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            droplet = response.json()["droplet"]
            status = droplet["status"]
            
            if status == "active":
                # Get IP address
                networks = droplet.get("networks", {})
                v4_networks = networks.get("v4", [])
                
                public_ip = None
                for network in v4_networks:
                    if network["type"] == "public":
                        public_ip = network["ip_address"]
                        break
                
                if public_ip:
                    print(f"✅ Droplet is ready!")
                    print(f"   IP Address: {public_ip}")
                    return droplet, public_ip
            
            print(f"   Status: {status}...")
        
        time.sleep(10)
    
    print("❌ Timeout waiting for droplet")
    return None, None


def list_droplets():
    """List existing droplets"""
    response = requests.get(
        f"{DO_API_BASE}/droplets",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        droplets = response.json()["droplets"]
        return droplets
    return []


def delete_droplet(droplet_id):
    """Delete a droplet"""
    response = requests.delete(
        f"{DO_API_BASE}/droplets/{droplet_id}",
        headers=get_headers()
    )
    
    return response.status_code == 204


def main():
    """Main deployment function"""
    print("=" * 60)
    print("  James AI Security Agent - Digital Ocean Deployment")
    print("=" * 60)
    
    # Check for API token
    if not DO_API_TOKEN:
        print("\n❌ DIGITALOCEAN_API_TOKEN not set!")
        print("   Please set it in your .env file or environment variables.")
        sys.exit(1)
    
    # Verify token
    if not check_api_token():
        sys.exit(1)
    
    # Check for existing droplets
    print("\n📋 Checking existing droplets...")
    droplets = list_droplets()
    james_droplets = [d for d in droplets if d["name"] == "james-security-agent"]
    
    if james_droplets:
        print(f"   Found {len(james_droplets)} existing James droplet(s):")
        for d in james_droplets:
            networks = d.get("networks", {}).get("v4", [])
            ip = next((n["ip_address"] for n in networks if n["type"] == "public"), "N/A")
            print(f"   - {d['name']} (ID: {d['id']}, IP: {ip}, Status: {d['status']})")
        
        choice = input("\nCreate a new droplet anyway? (y/n): ").lower()
        if choice != 'y':
            print("Exiting.")
            sys.exit(0)
    
    # Create droplet
    droplet = create_droplet()
    if not droplet:
        sys.exit(1)
    
    # Wait for droplet
    droplet, ip_address = wait_for_droplet(droplet["id"])
    if not droplet:
        sys.exit(1)
    
    # Print deployment instructions
    print("\n" + "=" * 60)
    print("  Deployment Complete!")
    print("=" * 60)
    print(f"""
Your James AI Security Agent droplet is ready!

📍 IP Address: {ip_address}
🔗 API URL: http://{ip_address}:8000
📚 API Docs: http://{ip_address}:8000/docs

Next Steps:
1. SSH into the droplet:
   ssh root@{ip_address}

2. Upload your agent code to /opt/james-agent/
   - agent.py
   - server.py
   - .env (with your API keys)

3. Start the service:
   systemctl start james-agent

4. Check status:
   systemctl status james-agent

5. View logs:
   journalctl -u james-agent -f

To delete this droplet:
   python deploy-to-digitalocean.py --delete {droplet['id']}
""")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--delete":
        if len(sys.argv) > 2:
            droplet_id = sys.argv[2]
            print(f"Deleting droplet {droplet_id}...")
            if delete_droplet(droplet_id):
                print("✅ Droplet deleted")
            else:
                print("❌ Failed to delete droplet")
        else:
            print("Usage: python deploy-to-digitalocean.py --delete <droplet_id>")
    elif len(sys.argv) > 1 and sys.argv[1] == "--list":
        droplets = list_droplets()
        print(f"Found {len(droplets)} droplet(s):")
        for d in droplets:
            networks = d.get("networks", {}).get("v4", [])
            ip = next((n["ip_address"] for n in networks if n["type"] == "public"), "N/A")
            print(f"  - {d['name']} (ID: {d['id']}, IP: {ip}, Status: {d['status']})")
    else:
        main()