#Requires -Version 5.1
<#
.SYNOPSIS
    Military-grade credential management for CYBERCAT Security Agent
    
.DESCRIPTION
    This script provides secure storage and retrieval of API credentials
    using Windows Credential Manager (DPAPI encryption)
    
.NOTES
    Security Level: Military Grade
    - Credentials encrypted with DPAPI (Data Protection API)
    - Tied to user account and machine
    - No plaintext storage
    - Audit logging enabled
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('Store', 'Retrieve', 'Delete', 'List', 'Rotate')]
    [string]$Action = 'List',
    
    [Parameter(Mandatory=$false)]
    [string]$CredentialName = 'JamesAI_DigitalOcean',
    
    [Parameter(Mandatory=$false)]
    [SecureString]$SecureToken
)

# Security Configuration
$Script:AuditLogPath = Join-Path $PSScriptRoot "audit.log"
$Script:CredentialPrefix = "JamesAI_"

function Write-AuditLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $Script:AuditLogPath -Value $logEntry -ErrorAction SilentlyContinue
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry }
    }
}

function Store-Credential {
    param(
        [string]$Name,
        [SecureString]$Token
    )
    
    try {
        # Validate input
        if ([string]::IsNullOrEmpty($Name)) {
            throw "Credential name cannot be empty"
        }
        
        if ($null -eq $Token -or $Token.Length -eq 0) {
            # Prompt for token securely
            $Token = Read-Host -Prompt "Enter API Token" -AsSecureString
        }
        
        # Create credential object
        $credential = New-Object System.Management.Automation.PSCredential($Name, $Token)
        
        # Store in Windows Credential Manager using cmdkey
        $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
        )
        
        # Use cmdkey for Windows Credential Manager
        $result = cmdkey /generic:$Name /user:$Name /pass:$plainToken 2>&1
        
        # Clear plaintext from memory immediately
        $plainToken = $null
        [GC]::Collect()
        
        if ($LASTEXITCODE -eq 0) {
            Write-AuditLog "Credential '$Name' stored successfully" "SUCCESS"
            return $true
        } else {
            throw "Failed to store credential: $result"
        }
    }
    catch {
        Write-AuditLog "Failed to store credential '$Name': $_" "ERROR"
        return $false
    }
}

function Get-StoredCredential {
    param([string]$Name)
    
    try {
        # Use cmdkey to list and verify credential exists
        $credentials = cmdkey /list:$Name 2>&1
        
        if ($credentials -match "Target: $Name") {
            Write-AuditLog "Credential '$Name' retrieved successfully" "INFO"
            
            # For actual retrieval, we need to use .NET CredentialManager
            Add-Type -AssemblyName System.Security -ErrorAction SilentlyContinue
            
            # Read from credential store using alternative method
            $credPath = Join-Path $env:LOCALAPPDATA "James\credentials\$Name.enc"
            if (Test-Path $credPath) {
                $encryptedData = Get-Content $credPath -Raw
                $decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
                    [Convert]::FromBase64String($encryptedData),
                    $null,
                    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
                )
                return [System.Text.Encoding]::UTF8.GetString($decryptedBytes)
            }
            
            Write-AuditLog "Credential exists but secure retrieval requires re-storage" "WARNING"
            return $null
        } else {
            Write-AuditLog "Credential '$Name' not found" "WARNING"
            return $null
        }
    }
    catch {
        Write-AuditLog "Failed to retrieve credential '$Name': $_" "ERROR"
        return $null
    }
}

function Remove-StoredCredential {
    param([string]$Name)
    
    try {
        $result = cmdkey /delete:$Name 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-AuditLog "Credential '$Name' deleted successfully" "SUCCESS"
            
            # Also remove encrypted file if exists
            $credPath = Join-Path $env:LOCALAPPDATA "James\credentials\$Name.enc"
            if (Test-Path $credPath) {
                Remove-Item $credPath -Force
            }
            
            return $true
        } else {
            throw "Failed to delete credential: $result"
        }
    }
    catch {
        Write-AuditLog "Failed to delete credential '$Name': $_" "ERROR"
        return $false
    }
}

function Get-AllCredentials {
    try {
        $credentials = cmdkey /list 2>&1 | Where-Object { $_ -match "JamesAI_" }
        
        if ($credentials) {
            Write-AuditLog "Listed all CYBERCAT credentials" "INFO"
            return $credentials
        } else {
            Write-AuditLog "No CYBERCAT credentials found" "INFO"
            return @()
        }
    }
    catch {
        Write-AuditLog "Failed to list credentials: $_" "ERROR"
        return @()
    }
}

function Store-CredentialSecure {
    <#
    .SYNOPSIS
        Store credential using DPAPI encryption (most secure method)
    #>
    param(
        [string]$Name,
        [string]$Token
    )
    
    try {
        Add-Type -AssemblyName System.Security
        
        # Create secure storage directory
        $credDir = Join-Path $env:LOCALAPPDATA "James\credentials"
        if (-not (Test-Path $credDir)) {
            New-Item -ItemType Directory -Path $credDir -Force | Out-Null
            
            # Set restrictive permissions (owner only)
            $acl = Get-Acl $credDir
            $acl.SetAccessRuleProtection($true, $false)
            $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                $env:USERNAME, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
            )
            $acl.SetAccessRule($rule)
            Set-Acl $credDir $acl
        }
        
        # Encrypt with DPAPI
        $tokenBytes = [System.Text.Encoding]::UTF8.GetBytes($Token)
        $encryptedBytes = [System.Security.Cryptography.ProtectedData]::Protect(
            $tokenBytes,
            $null,
            [System.Security.Cryptography.DataProtectionScope]::CurrentUser
        )
        
        # Store encrypted data
        $credPath = Join-Path $credDir "$Name.enc"
        [Convert]::ToBase64String($encryptedBytes) | Set-Content $credPath -Force
        
        # Clear sensitive data from memory
        $tokenBytes = $null
        $Token = $null
        [GC]::Collect()
        
        Write-AuditLog "Credential '$Name' stored with DPAPI encryption" "SUCCESS"
        return $true
    }
    catch {
        Write-AuditLog "Failed to store credential securely: $_" "ERROR"
        return $false
    }
}

function Get-CredentialSecure {
    <#
    .SYNOPSIS
        Retrieve credential using DPAPI decryption
    #>
    param([string]$Name)
    
    try {
        Add-Type -AssemblyName System.Security
        
        $credPath = Join-Path $env:LOCALAPPDATA "James\credentials\$Name.enc"
        
        if (-not (Test-Path $credPath)) {
            Write-AuditLog "Credential '$Name' not found in secure storage" "WARNING"
            return $null
        }
        
        $encryptedData = Get-Content $credPath -Raw
        $decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
            [Convert]::FromBase64String($encryptedData),
            $null,
            [System.Security.Cryptography.DataProtectionScope]::CurrentUser
        )
        
        $token = [System.Text.Encoding]::UTF8.GetString($decryptedBytes)
        
        Write-AuditLog "Credential '$Name' retrieved from secure storage" "INFO"
        return $token
    }
    catch {
        Write-AuditLog "Failed to retrieve credential securely: $_" "ERROR"
        return $null
    }
}

# Main execution
switch ($Action) {
    'Store' {
        if ($SecureToken) {
            Store-Credential -Name $CredentialName -Token $SecureToken
        } else {
            $token = Read-Host -Prompt "Enter the API token for '$CredentialName'" -AsSecureString
            $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
            )
            Store-CredentialSecure -Name $CredentialName -Token $plainToken
            $plainToken = $null
            [GC]::Collect()
        }
    }
    'Retrieve' {
        $token = Get-CredentialSecure -Name $CredentialName
        if ($token) {
            Write-Host "Token retrieved successfully (not displayed for security)"
            # Return token for programmatic use
            return $token
        }
    }
    'Delete' {
        Remove-StoredCredential -Name $CredentialName
    }
    'List' {
        Write-Host "`nCYBERCAT Stored Credentials:" -ForegroundColor Cyan
        Write-Host "=============================" -ForegroundColor Cyan
        
        $credDir = Join-Path $env:LOCALAPPDATA "James\credentials"
        if (Test-Path $credDir) {
            Get-ChildItem $credDir -Filter "*.enc" | ForEach-Object {
                Write-Host "  - $($_.BaseName)" -ForegroundColor Green
            }
        } else {
            Write-Host "  No credentials stored yet" -ForegroundColor Yellow
        }
    }
    'Rotate' {
        Write-Host "Rotating credential '$CredentialName'..." -ForegroundColor Yellow
        $oldToken = Get-CredentialSecure -Name $CredentialName
        if ($oldToken) {
            Write-Host "Old credential found. Enter new token:" -ForegroundColor Yellow
            $newToken = Read-Host -Prompt "New API Token" -AsSecureString
            $plainNewToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($newToken)
            )
            
            # Store new credential
            if (Store-CredentialSecure -Name $CredentialName -Token $plainNewToken) {
                Write-AuditLog "Credential '$CredentialName' rotated successfully" "SUCCESS"
            }
            
            $plainNewToken = $null
            [GC]::Collect()
        } else {
            Write-Host "No existing credential found. Use 'Store' action instead." -ForegroundColor Red
        }
    }
}
