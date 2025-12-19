/**
 * Secure Token Retrieval for CYBERCAT
 * Retrieves tokens from DPAPI-encrypted storage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getSecureToken(credentialName = 'JamesAI_DigitalOcean') {
    try {
        // Path to encrypted credential
        const credPath = path.join(
            process.env.LOCALAPPDATA,
            'James',
            'credentials',
            `${credentialName}.enc`
        );

        if (!fs.existsSync(credPath)) {
            console.error(`[SECURITY] Credential '${credentialName}' not found in secure storage`);
            console.error('[SECURITY] Run security/store-token.bat to store your token securely');
            return null;
        }

        // Use PowerShell to decrypt with DPAPI
        const psScript = `
            Add-Type -AssemblyName System.Security
            $encryptedData = Get-Content '${credPath.replace(/\\/g, '\\\\')}' -Raw
            $decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
                [Convert]::FromBase64String($encryptedData),
                $null,
                [System.Security.Cryptography.DataProtectionScope]::CurrentUser
            )
            [System.Text.Encoding]::UTF8.GetString($decryptedBytes)
        `;

        const token = execSync(`powershell -Command "${psScript}"`, {
            encoding: 'utf8',
            windowsHide: true
        }).trim();

        if (token) {
            console.error('[SECURITY] Token retrieved from secure storage');
            return token;
        }

        return null;
    } catch (error) {
        console.error('[SECURITY] Failed to retrieve token:', error.message);
        return null;
    }
}

// Export for use in MCP server
module.exports = { getSecureToken };

// If run directly, output token (for testing only)
if (require.main === module) {
    const token = getSecureToken();
    if (token) {
        console.log('[SECURITY] Token retrieved successfully (not displayed)');
        console.log('[SECURITY] Token length:', token.length, 'characters');
    } else {
        console.log('[SECURITY] No token found. Run security/store-token.bat first.');
        process.exit(1);
    }
}
