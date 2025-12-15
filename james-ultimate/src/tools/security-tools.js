/**
 * James Ultimate - Security Tools
 * Comprehensive security analysis and scanning tools
 */

const os = require('os');
const dns = require('dns');
const net = require('net');
const { exec, spawn } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let si;
try {
  si = require('systeminformation');
} catch (e) {
  si = null;
}

class SecurityTools {
  constructor() {
    this.tools = new Map();
    this.initializeTools();
  }

  initializeTools() {
    // Port Scanner
    this.registerTool('port_scan', {
      name: 'Port Scanner',
      description: 'Scan for open ports on a target host',
      category: 'network',
      async execute(params) {
        const { host = 'localhost', ports = '1-1024', timeout = 1000 } = params;
        const openPorts = [];
        
        // Parse port range
        let portList = [];
        if (ports.includes('-')) {
          const [start, end] = ports.split('-').map(Number);
          for (let i = start; i <= Math.min(end, 65535); i++) {
            portList.push(i);
          }
        } else {
          portList = ports.split(',').map(p => parseInt(p.trim()));
        }
        
        // Limit to 1000 ports
        portList = portList.slice(0, 1000);
        
        const scanPort = (port) => {
          return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(timeout);
            
            socket.on('connect', () => {
              socket.destroy();
              resolve({ port, open: true });
            });
            
            socket.on('timeout', () => {
              socket.destroy();
              resolve({ port, open: false });
            });
            
            socket.on('error', () => {
              socket.destroy();
              resolve({ port, open: false });
            });
            
            socket.connect(port, host);
          });
        };
        
        // Scan in batches
        const batchSize = 100;
        for (let i = 0; i < portList.length; i += batchSize) {
          const batch = portList.slice(i, i + batchSize);
          const results = await Promise.all(batch.map(scanPort));
          
          for (const result of results) {
            if (result.open) {
              openPorts.push({
                port: result.port,
                service: getServiceName(result.port),
                risk: getPortRisk(result.port)
              });
            }
          }
        }
        
        return {
          host,
          portsScanned: portList.length,
          openPorts,
          timestamp: new Date().toISOString()
        };
      }
    });

    // System Security Analysis
    this.registerTool('system_analysis', {
      name: 'System Security Analysis',
      description: 'Analyze system security posture',
      category: 'system',
      async execute(params) {
        const analysis = {
          timestamp: new Date().toISOString(),
          system: {},
          security: {},
          processes: {},
          network: {},
          score: 100,
          issues: [],
          recommendations: []
        };
        
        // System info
        analysis.system = {
          platform: os.platform(),
          release: os.release(),
          hostname: os.hostname(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemory: formatBytes(os.totalmem()),
          freeMemory: formatBytes(os.freemem()),
          uptime: formatUptime(os.uptime())
        };
        
        // Memory usage
        const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
        if (memUsage > 90) {
          analysis.score -= 10;
          analysis.issues.push('Critical: Memory usage above 90%');
        } else if (memUsage > 80) {
          analysis.score -= 5;
          analysis.issues.push('Warning: Memory usage above 80%');
        }
        
        // Check for systeminformation
        if (si) {
          try {
            const [processes, networkConnections, users] = await Promise.all([
              si.processes(),
              si.networkConnections(),
              si.users()
            ]);
            
            analysis.processes = {
              total: processes.all,
              running: processes.running,
              blocked: processes.blocked
            };
            
            analysis.network = {
              connections: networkConnections.length,
              established: networkConnections.filter(c => c.state === 'ESTABLISHED').length
            };
            
            // Check for suspicious processes
            const suspiciousPatterns = [
              /powershell.*-enc/i,
              /cmd.*\/c/i,
              /mshta/i,
              /certutil.*-decode/i
            ];
            
            const suspicious = processes.list.filter(p => 
              suspiciousPatterns.some(pattern => pattern.test(p.command || p.name))
            );
            
            if (suspicious.length > 0) {
              analysis.score -= 20;
              analysis.issues.push(`Found ${suspicious.length} potentially suspicious processes`);
              analysis.security.suspiciousProcesses = suspicious.map(p => ({
                name: p.name,
                pid: p.pid,
                command: p.command
              }));
            }
            
            // Check for multiple users
            if (users.length > 1) {
              analysis.issues.push(`Multiple users logged in: ${users.length}`);
            }
            
          } catch (e) {
            // systeminformation not available
          }
        }
        
        // Windows-specific checks
        if (os.platform() === 'win32') {
          // Check firewall
          try {
            const firewallStatus = await execPromise('netsh advfirewall show allprofiles state');
            const firewallEnabled = firewallStatus.toLowerCase().includes('on');
            analysis.security.firewall = firewallEnabled ? 'Enabled' : 'Disabled';
            
            if (!firewallEnabled) {
              analysis.score -= 15;
              analysis.issues.push('Windows Firewall is disabled');
              analysis.recommendations.push('Enable Windows Firewall');
            }
          } catch (e) {
            analysis.security.firewall = 'Unknown';
          }
          
          // Check Windows Defender
          try {
            const defenderStatus = await execPromise('powershell -Command "Get-MpComputerStatus | Select-Object -Property AntivirusEnabled"');
            const defenderEnabled = defenderStatus.toLowerCase().includes('true');
            analysis.security.antivirus = defenderEnabled ? 'Enabled' : 'Disabled';
            
            if (!defenderEnabled) {
              analysis.score -= 15;
              analysis.issues.push('Windows Defender is disabled');
              analysis.recommendations.push('Enable Windows Defender or install antivirus');
            }
          } catch (e) {
            analysis.security.antivirus = 'Unknown';
          }
        }
        
        // Add general recommendations
        analysis.recommendations.push(
          'Keep operating system and software updated',
          'Use strong, unique passwords',
          'Enable two-factor authentication',
          'Regular backup important data',
          'Review installed applications periodically'
        );
        
        analysis.score = Math.max(0, analysis.score);
        
        return analysis;
      }
    });

    // Network Analysis
    this.registerTool('network_analysis', {
      name: 'Network Analysis',
      description: 'Analyze network interfaces and connections',
      category: 'network',
      async execute(params) {
        const analysis = {
          timestamp: new Date().toISOString(),
          interfaces: [],
          connections: [],
          dns: {},
          gateway: null
        };
        
        // Get network interfaces
        const interfaces = os.networkInterfaces();
        for (const [name, addrs] of Object.entries(interfaces)) {
          for (const addr of addrs) {
            if (!addr.internal) {
              analysis.interfaces.push({
                name,
                address: addr.address,
                family: addr.family,
                mac: addr.mac,
                netmask: addr.netmask
              });
            }
          }
        }
        
        // Get connections if systeminformation available
        if (si) {
          try {
            const connections = await si.networkConnections();
            analysis.connections = connections.slice(0, 50).map(c => ({
              protocol: c.protocol,
              localAddress: c.localAddress,
              localPort: c.localPort,
              peerAddress: c.peerAddress,
              peerPort: c.peerPort,
              state: c.state
            }));
            
            const gateway = await si.networkGatewayDefault();
            analysis.gateway = gateway;
          } catch (e) {
            // Not available
          }
        }
        
        // DNS servers
        analysis.dns.servers = dns.getServers();
        
        return analysis;
      }
    });

    // DNS Lookup
    this.registerTool('dns_lookup', {
      name: 'DNS Lookup',
      description: 'Perform DNS lookups for a domain',
      category: 'network',
      async execute(params) {
        const { domain } = params;
        if (!domain) throw new Error('Domain is required');
        
        const results = {
          domain,
          timestamp: new Date().toISOString(),
          records: {}
        };
        
        // A records
        try {
          results.records.A = await dnsResolve(domain, 'A');
        } catch (e) {
          results.records.A = [];
        }
        
        // AAAA records
        try {
          results.records.AAAA = await dnsResolve(domain, 'AAAA');
        } catch (e) {
          results.records.AAAA = [];
        }
        
        // MX records
        try {
          results.records.MX = await dnsResolve(domain, 'MX');
        } catch (e) {
          results.records.MX = [];
        }
        
        // TXT records
        try {
          results.records.TXT = await dnsResolve(domain, 'TXT');
        } catch (e) {
          results.records.TXT = [];
        }
        
        // NS records
        try {
          results.records.NS = await dnsResolve(domain, 'NS');
        } catch (e) {
          results.records.NS = [];
        }
        
        return results;
      }
    });

    // IP Reputation Check
    this.registerTool('ip_reputation', {
      name: 'IP Reputation Check',
      description: 'Check reputation of an IP address',
      category: 'threat_intel',
      async execute(params) {
        const { ip } = params;
        if (!ip) throw new Error('IP address is required');
        
        const result = {
          ip,
          timestamp: new Date().toISOString(),
          type: 'unknown',
          geolocation: null,
          reputation: 'unknown',
          riskLevel: 'unknown'
        };
        
        // Check if private IP
        if (isPrivateIP(ip)) {
          result.type = 'private';
          result.reputation = 'safe';
          result.riskLevel = 'low';
          return result;
        }
        
        // Try to get geolocation
        try {
          const geoResponse = await httpGet(`http://ip-api.com/json/${ip}`);
          const geoData = JSON.parse(geoResponse);
          
          if (geoData.status === 'success') {
            result.geolocation = {
              country: geoData.country,
              countryCode: geoData.countryCode,
              region: geoData.regionName,
              city: geoData.city,
              isp: geoData.isp,
              org: geoData.org,
              as: geoData.as
            };
          }
        } catch (e) {
          // Geolocation failed
        }
        
        result.type = 'public';
        result.reputation = 'unknown';
        result.riskLevel = 'medium';
        
        return result;
      }
    });

    // URL Analysis
    this.registerTool('url_analysis', {
      name: 'URL Analysis',
      description: 'Analyze a URL for potential threats',
      category: 'threat_intel',
      async execute(params) {
        const { url } = params;
        if (!url) throw new Error('URL is required');
        
        const result = {
          url,
          timestamp: new Date().toISOString(),
          safe: true,
          warnings: [],
          details: {}
        };
        
        // Parse URL
        try {
          const parsed = new URL(url);
          result.details = {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
            path: parsed.pathname,
            query: parsed.search
          };
          
          // Check for suspicious patterns
          const suspiciousPatterns = [
            { pattern: /^http:/, warning: 'Uses insecure HTTP protocol' },
            { pattern: /\.exe$/i, warning: 'Links to executable file' },
            { pattern: /\.zip$/i, warning: 'Links to archive file' },
            { pattern: /@/, warning: 'Contains @ symbol (potential phishing)' },
            { pattern: /login|signin|verify|account|secure|update/i, warning: 'Contains suspicious keywords' },
            { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, warning: 'Uses IP address instead of domain' }
          ];
          
          for (const { pattern, warning } of suspiciousPatterns) {
            if (pattern.test(url)) {
              result.warnings.push(warning);
            }
          }
          
          // Check for unusual port
          if (parsed.port && !['80', '443', '8080', '8443'].includes(parsed.port)) {
            result.warnings.push(`Uses unusual port: ${parsed.port}`);
          }
          
          // Check for long subdomain (potential phishing)
          const subdomains = parsed.hostname.split('.');
          if (subdomains.length > 4) {
            result.warnings.push('Unusually long subdomain chain');
          }
          
        } catch (e) {
          result.safe = false;
          result.warnings.push('Invalid URL format');
        }
        
        result.safe = result.warnings.length === 0;
        result.riskLevel = result.warnings.length > 3 ? 'high' : 
                          result.warnings.length > 0 ? 'medium' : 'low';
        
        return result;
      }
    });

    // File Hash Analysis
    this.registerTool('file_hash', {
      name: 'File Hash Analysis',
      description: 'Calculate and analyze file hashes',
      category: 'forensics',
      async execute(params) {
        const { filePath } = params;
        if (!filePath) throw new Error('File path is required');
        
        if (!fs.existsSync(filePath)) {
          throw new Error('File not found');
        }
        
        const stats = fs.statSync(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        
        return {
          filePath,
          timestamp: new Date().toISOString(),
          size: formatBytes(stats.size),
          sizeBytes: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          hashes: {
            md5: crypto.createHash('md5').update(fileBuffer).digest('hex'),
            sha1: crypto.createHash('sha1').update(fileBuffer).digest('hex'),
            sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex')
          }
        };
      }
    });

    // Process Analysis
    this.registerTool('process_analysis', {
      name: 'Process Analysis',
      description: 'Analyze running processes for suspicious activity',
      category: 'forensics',
      async execute(params) {
        if (!si) {
          return { error: 'systeminformation module not available' };
        }
        
        const processes = await si.processes();
        
        const suspiciousPatterns = [
          { pattern: /powershell.*-enc/i, reason: 'Encoded PowerShell command' },
          { pattern: /cmd.*\/c/i, reason: 'Command execution' },
          { pattern: /wscript|cscript/i, reason: 'Script host' },
          { pattern: /mshta/i, reason: 'HTML Application host' },
          { pattern: /regsvr32/i, reason: 'DLL registration' },
          { pattern: /rundll32/i, reason: 'DLL execution' },
          { pattern: /certutil.*-decode/i, reason: 'Certificate utility decode' },
          { pattern: /bitsadmin/i, reason: 'BITS transfer' }
        ];
        
        const suspicious = [];
        const highCpu = [];
        const highMemory = [];
        
        for (const proc of processes.list) {
          // Check for suspicious patterns
          for (const { pattern, reason } of suspiciousPatterns) {
            if (pattern.test(proc.command || proc.name)) {
              suspicious.push({
                pid: proc.pid,
                name: proc.name,
                command: proc.command,
                reason
              });
            }
          }
          
          // High CPU
          if (proc.cpu > 50) {
            highCpu.push({
              pid: proc.pid,
              name: proc.name,
              cpu: proc.cpu
            });
          }
          
          // High memory
          if (proc.mem > 10) {
            highMemory.push({
              pid: proc.pid,
              name: proc.name,
              memory: proc.mem
            });
          }
        }
        
        return {
          timestamp: new Date().toISOString(),
          total: processes.all,
          running: processes.running,
          suspicious: suspicious.slice(0, 20),
          highCpu: highCpu.slice(0, 10),
          highMemory: highMemory.slice(0, 10)
        };
      }
    });

    // Password Strength Checker
    this.registerTool('password_check', {
      name: 'Password Strength Checker',
      description: 'Analyze password strength',
      category: 'utility',
      async execute(params) {
        const { password } = params;
        if (!password) throw new Error('Password is required');
        
        const result = {
          length: password.length,
          score: 0,
          strength: 'weak',
          issues: [],
          suggestions: []
        };
        
        // Length check
        if (password.length >= 16) result.score += 30;
        else if (password.length >= 12) result.score += 20;
        else if (password.length >= 8) result.score += 10;
        else result.issues.push('Password is too short (minimum 8 characters)');
        
        // Character variety
        if (/[a-z]/.test(password)) result.score += 10;
        else result.issues.push('Add lowercase letters');
        
        if (/[A-Z]/.test(password)) result.score += 10;
        else result.issues.push('Add uppercase letters');
        
        if (/[0-9]/.test(password)) result.score += 10;
        else result.issues.push('Add numbers');
        
        if (/[^a-zA-Z0-9]/.test(password)) result.score += 20;
        else result.issues.push('Add special characters');
        
        // Common patterns
        const commonPatterns = [
          /^123/, /321$/, /password/i, /qwerty/i, /abc/i,
          /111/, /000/, /admin/i, /user/i, /login/i
        ];
        
        for (const pattern of commonPatterns) {
          if (pattern.test(password)) {
            result.score -= 20;
            result.issues.push('Contains common pattern');
            break;
          }
        }
        
        // Determine strength
        result.score = Math.max(0, Math.min(100, result.score));
        
        if (result.score >= 80) result.strength = 'strong';
        else if (result.score >= 60) result.strength = 'good';
        else if (result.score >= 40) result.strength = 'moderate';
        else result.strength = 'weak';
        
        // Suggestions
        if (result.strength !== 'strong') {
          result.suggestions = [
            'Use at least 12 characters',
            'Mix uppercase and lowercase letters',
            'Include numbers and special characters',
            'Avoid common words and patterns',
            'Consider using a passphrase'
          ];
        }
        
        return result;
      }
    });

    // SSL/TLS Certificate Check
    this.registerTool('ssl_check', {
      name: 'SSL/TLS Certificate Check',
      description: 'Check SSL/TLS certificate of a domain',
      category: 'network',
      async execute(params) {
        const { domain, port = 443 } = params;
        if (!domain) throw new Error('Domain is required');
        
        return new Promise((resolve, reject) => {
          const options = {
            host: domain,
            port: port,
            method: 'GET',
            rejectUnauthorized: false
          };
          
          const req = https.request(options, (res) => {
            const cert = res.socket.getPeerCertificate();
            
            if (!cert || Object.keys(cert).length === 0) {
              resolve({
                domain,
                port,
                hasCertificate: false,
                error: 'No certificate found'
              });
              return;
            }
            
            const now = new Date();
            const validFrom = new Date(cert.valid_from);
            const validTo = new Date(cert.valid_to);
            const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
            
            resolve({
              domain,
              port,
              hasCertificate: true,
              subject: cert.subject,
              issuer: cert.issuer,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysUntilExpiry,
              isExpired: now > validTo,
              isNotYetValid: now < validFrom,
              serialNumber: cert.serialNumber,
              fingerprint: cert.fingerprint,
              warnings: daysUntilExpiry < 30 ? ['Certificate expires soon'] : []
            });
          });
          
          req.on('error', (e) => {
            resolve({
              domain,
              port,
              hasCertificate: false,
              error: e.message
            });
          });
          
          req.setTimeout(10000, () => {
            req.destroy();
            resolve({
              domain,
              port,
              hasCertificate: false,
              error: 'Connection timeout'
            });
          });
          
          req.end();
        });
      }
    });

    // WHOIS Lookup
    this.registerTool('whois_lookup', {
      name: 'WHOIS Lookup',
      description: 'Perform WHOIS lookup for a domain',
      category: 'network',
      async execute(params) {
        const { domain } = params;
        if (!domain) throw new Error('Domain is required');
        
        // Basic WHOIS via DNS
        const result = {
          domain,
          timestamp: new Date().toISOString(),
          nameservers: [],
          note: 'Full WHOIS requires external API'
        };
        
        try {
          result.nameservers = await dnsResolve(domain, 'NS');
        } catch (e) {
          result.nameservers = [];
        }
        
        return result;
      }
    });

    // Generate Security Report
    this.registerTool('security_report', {
      name: 'Security Report Generator',
      description: 'Generate comprehensive security report',
      category: 'reporting',
      async execute(params) {
        const report = {
          reportId: `RPT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          summary: {},
          systemAnalysis: null,
          networkAnalysis: null,
          processAnalysis: null,
          recommendations: [],
          overallScore: 0
        };
        
        // Run system analysis
        try {
          report.systemAnalysis = await this.tools.get('system_analysis').execute({});
        } catch (e) {
          report.systemAnalysis = { error: e.message };
        }
        
        // Run network analysis
        try {
          report.networkAnalysis = await this.tools.get('network_analysis').execute({});
        } catch (e) {
          report.networkAnalysis = { error: e.message };
        }
        
        // Run process analysis
        try {
          report.processAnalysis = await this.tools.get('process_analysis').execute({});
        } catch (e) {
          report.processAnalysis = { error: e.message };
        }
        
        // Calculate overall score
        let scores = [];
        if (report.systemAnalysis?.score) scores.push(report.systemAnalysis.score);
        
        report.overallScore = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 50;
        
        // Compile recommendations
        if (report.systemAnalysis?.recommendations) {
          report.recommendations.push(...report.systemAnalysis.recommendations);
        }
        
        // Summary
        report.summary = {
          overallScore: report.overallScore,
          riskLevel: report.overallScore >= 80 ? 'Low' : 
                     report.overallScore >= 60 ? 'Medium' : 'High',
          issuesFound: (report.systemAnalysis?.issues?.length || 0) +
                       (report.processAnalysis?.suspicious?.length || 0),
          recommendationCount: report.recommendations.length
        };
        
        return report;
      }
    });
  }

  registerTool(id, config) {
    this.tools.set(id, {
      id,
      ...config,
      execute: config.execute.bind(this)
    });
  }

  getTool(id) {
    return this.tools.get(id);
  }

  getTools() {
    return Array.from(this.tools.values()).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category
    }));
  }

  getToolsByCategory(category) {
    return this.getTools().filter(t => t.category === category);
  }

  async executeTool(toolId, params = {}) {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool '${toolId}' not found`);
    }
    
    return await tool.execute(params);
  }
}

// Helper functions
function getServiceName(port) {
  const services = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 135: 'RPC', 139: 'NetBIOS', 143: 'IMAP',
    443: 'HTTPS', 445: 'SMB', 993: 'IMAPS', 995: 'POP3S', 1433: 'MSSQL',
    1521: 'Oracle', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL',
    5900: 'VNC', 8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt', 27017: 'MongoDB',
    6379: 'Redis', 11211: 'Memcached', 9200: 'Elasticsearch'
  };
  return services[port] || 'Unknown';
}

function getPortRisk(port) {
  const highRisk = [21, 23, 135, 139, 445, 1433, 3389, 5900];
  const mediumRisk = [22, 25, 110, 143, 3306, 5432, 27017, 6379];
  
  if (highRisk.includes(port)) return 'high';
  if (mediumRisk.includes(port)) return 'medium';
  return 'low';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8
  if (parts[0] === 127) return true;
  
  return false;
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

function dnsResolve(domain, type) {
  return new Promise((resolve, reject) => {
    dns.resolve(domain, type, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Singleton instance
const securityTools = new SecurityTools();

module.exports = { SecurityTools, securityTools };