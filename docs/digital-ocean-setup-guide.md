# Digital Ocean Setup Guide

## Getting Your Digital Ocean API Token

### Step 1: Log into Digital Ocean
1. Visit https://cloud.digitalocean.com/
2. Log in with your Digital Ocean account credentials

### Step 2: Navigate to API Tokens
1. Click on "API" in the left sidebar
2. Or directly visit: https://cloud.digitalocean.com/account/api/tokens

### Step 3: Generate New Token
1. Click the "Generate New Token" button
2. Give your token a descriptive name (e.g., "James AI Security Agent")
3. Select the appropriate scopes:
   - **For monitoring only**: Select all "read" permissions
   - **For full management**: Select both "read" and "write" permissions
   
   Recommended permissions for security monitoring:
   - ✅ Read: Account
   - ✅ Read: Droplets
   - ✅ Read: Kubernetes
   - ✅ Read: Images
   - ✅ Read: Volumes
   - ✅ Read: Snapshots
   - ✅ Read: Load Balancers
   - ✅ Read: Firewalls
   - ✅ Read: Domains
   - ✅ Read: Certificates
   - ✅ Read: SSH Keys
   - ✅ Read: Projects
   - ✅ Read: VPCs

4. Click "Generate Token"

### Step 4: Save Your Token
⚠️ **IMPORTANT**: The token will only be shown once! Copy it immediately.

1. Click the copy button next to your token
2. Store it securely (password manager recommended)
3. Add it to your `.env` file:
   ```
   DIGITALOCEAN_API_TOKEN=your_token_here
   ```

## Security Best Practices

1. **Never commit tokens to Git**
   - The `.gitignore` file is configured to exclude `.env`
   - Always use environment variables

2. **Use read-only tokens when possible**
   - For security monitoring, read-only is sufficient
   - Only use write permissions when needed

3. **Rotate tokens regularly**
   - Set a reminder to rotate tokens every 90 days
   - Delete old tokens after creating new ones

4. **Monitor token usage**
   - Check the "Last Used" column in the API tokens page
   - Review API logs for unusual activity

## Testing Your Token

Once you have your token configured, you can test it:

```bash
# After installing Node.js
cd mcp-servers/digitalocean
npm install
npm start
```

Or use the Python setup script:
```bash
python setup_mcp_server.py
```

## Troubleshooting

### Token not working?
1. Check for extra spaces or newlines in the token
2. Ensure the token has the required permissions
3. Verify the token hasn't been revoked

### Connection errors?
1. Check your internet connection
2. Verify Digital Ocean's API status: https://status.digitalocean.com/
3. Check if your IP is whitelisted (if using IP restrictions)