# Quick Guide: Get Your Digital Ocean API Token

## Manual Steps:

1. **Open your browser and go to:**
   ```
   https://cloud.digitalocean.com/account/api/tokens
   ```

2. **Log in with:**
   - Email: martkrupik@gmail.com
   - Your Digital Ocean password

3. **Once logged in:**
   - You'll see the API tokens page
   - Click the blue "Generate New Token" button

4. **Configure your token:**
   - **Token name**: `CYBERCAT Security Agent`
   - **Expiration**: No expiry (or choose as needed)
   - **Scopes** - Select these READ permissions:
     - ✅ account:read
     - ✅ droplet:read
     - ✅ kubernetes:read
     - ✅ image:read
     - ✅ volume:read
     - ✅ snapshot:read
     - ✅ load_balancer:read
     - ✅ firewall:read
     - ✅ domain:read
     - ✅ certificate:read
     - ✅ ssh_key:read
     - ✅ project:read
     - ✅ vpc:read

5. **Generate and copy:**
   - Click "Generate Token"
   - **IMPORTANT**: Copy the token immediately!
   - It will look like: `dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

6. **Add to your project:**
   - Open file: `mcp-servers/digitalocean/.env`
   - Add your token:
     ```
     DIGITALOCEAN_API_TOKEN=your_token_here
     ```

## Alternative Direct Link:
If the above doesn't work, try:
```
https://cloud.digitalocean.com/
```
Then navigate to: Account (bottom left) → API → Tokens

## Once you have your token:
Run this command to complete setup:
```bash
python setup_mcp_server.py
