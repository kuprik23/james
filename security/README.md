# James AI Security - Military-Grade Credential Management

## Overview

This security module provides military-grade protection for API credentials using Windows Data Protection API (DPAPI) encryption.

## Security Features

### 🔐 DPAPI Encryption
- Credentials are encrypted using Windows DPAPI
- Encryption is tied to your Windows user account
- Cannot be decrypted on another machine or by another user
- No master password required - uses Windows credentials

### 🛡️ Security Layers
1. **Encryption at Rest**: All tokens stored encrypted
2. **User Isolation**: Only your Windows account can decrypt
3. **Machine Binding**: Credentials tied to this specific machine
4. **No Version Control**: `.env` files and credentials excluded from Git
5. **Audit Logging**: All credential operations are logged

## File Structure

```
security/
├── credential-manager.ps1  # PowerShell credential management
├── store-token.bat         # Easy token storage script
├── get-token.js           # Node.js token retrieval
├── audit.log              # Security audit log (auto-generated)
└── README.md              # This file

%LOCALAPPDATA%\James\credentials\
└── JamesAI_DigitalOcean.enc  # Encrypted token (DPAPI)
```

## Usage

### Store a New Token
```batch
security\store-token.bat
```

### Rotate Token
```powershell
powershell -ExecutionPolicy Bypass -File security\credential-manager.ps1 -Action Rotate
```

### List Stored Credentials
```powershell
powershell -ExecutionPolicy Bypass -File security\credential-manager.ps1 -Action List
```

### Delete a Credential
```powershell
powershell -ExecutionPolicy Bypass -File security\credential-manager.ps1 -Action Delete -CredentialName "JamesAI_DigitalOcean"
```

## How It Works

1. **Token Input**: You enter your API token (masked input)
2. **DPAPI Encryption**: Token is encrypted using your Windows credentials
3. **Secure Storage**: Encrypted data stored in `%LOCALAPPDATA%\James\credentials\`
4. **Runtime Retrieval**: MCP server decrypts token on-demand using DPAPI
5. **Memory Safety**: Plaintext cleared from memory after use

## Security Best Practices

### ✅ DO
- Use `store-token.bat` to store tokens securely
- Rotate tokens regularly (every 90 days recommended)
- Review audit.log periodically
- Keep your Windows account secure

### ❌ DON'T
- Never commit tokens to version control
- Never share the encrypted `.enc` files
- Never store tokens in plain text files
- Never disable Windows account protection

## Token Priority

The MCP server retrieves tokens in this order:
1. **DPAPI Secure Storage** (recommended)
2. **Environment Variable** (for CI/CD)
3. **`.env` file** (development only)

## Compliance

This implementation follows:
- NIST SP 800-132 (Key Derivation)
- NIST SP 800-57 (Key Management)
- CIS Controls for Credential Management
- OWASP Secure Coding Practices

## Troubleshooting

### Token Not Found
```
[SECURITY] No secure token found
```
**Solution**: Run `security\store-token.bat`

### Decryption Failed
```
[SECURITY] DPAPI retrieval failed
```
**Solution**: Re-store the token - encryption may be corrupted

### Permission Denied
**Solution**: Ensure you're running as the same user who stored the token

## Emergency Procedures

### Token Compromise
1. Immediately revoke token in Digital Ocean dashboard
2. Delete local credential: `credential-manager.ps1 -Action Delete`
3. Generate new token in Digital Ocean
4. Store new token: `store-token.bat`
5. Review audit.log for unauthorized access

### System Recovery
If migrating to a new machine:
1. Tokens cannot be transferred (by design)
2. Generate new tokens for the new machine
3. Store using `store-token.bat`