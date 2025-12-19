#!/usr/bin/env node

/**
 * CyberCAT Scanner - Node.js Implementation
 * Military-Grade Vulnerability Scanner
 */

const net = require('net');
const tls = require('tls');
const dns = require('dns');
const os = require('os');
const { execSync } = require('child_process');

// Common ports to scan
const COMMON_PORTS = {
    21: { name: 'FTP', risk: 'HIGH' },
    22: { name: 'SSH', risk: 'LOW' },
    23: { name: 'Telnet', risk: 'HIGH' },
    25: { name: 'SMTP', risk: 'MEDIUM' },
    80: { name: 'HTTP', risk: 'LOW' },
    443: { name: 'HTTPS', risk: 'LOW' },
    445: { name: 'SMB', risk: 'HIGH' },
    1433: { name: 'MSSQL', risk: 'MEDIUM' },
    3306: { name: 'MySQL', risk: 'MEDIUM' },
    3389: { name: 'RDP', risk: 'HIGH' },
    5432: { name: 'PostgreSQL', risk: 'MEDIUM' },
    5900: { name: 'VNC', risk: 'HIGH' },
    8080: { name: 'HTTP-Proxy', risk: 'MEDIUM' },
    27017: { name: 'MongoDB', risk: 'MEDIUM' }
};

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class CyberCATScanner {
    constructor() {
        this.results = {
            host: '',
            timestamp: new Date().toISOString(),
            ports: [],
            ssl: null,
            system: null,
            riskLevel: 'LOW'
        };
    }

    // Print banner
    printBanner() {
        console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║    /\\_____/\\                                              ║
║   /  o   o  \\                                             ║
║  ( ==  ^  == )  ${colors.bright}CyberCAT Scanner v2.0${colors.cyan}                ║
║   )         (                                              ║
║  (           )   ${colors.reset}Military-Grade Vulnerability Scanner${colors.cyan}   ║
║ ( (  )   (  ) )                                            ║
║(__(__)___(__)__)                                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);
    }

    // Scan a single port
    async scanPort(host, port, timeout = 2000) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            let isResolved = false;

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                if (!isResolved) {
                    isResolved = true;
                    socket.destroy();
                    resolve(true);
                }
            });

            socket.on('timeout', () => {
                if (!isResolved) {
                    isResolved = true;
                    socket.destroy();
                    resolve(false);
                }
            });

            socket.on('error', () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(false);
                }
            });

            socket.connect(port, host);
        });
    }

    // Scan multiple ports
    async scanPorts(host) {
        console.log(`\n${colors.bright}Scanning ports on ${host}...${colors.reset}\n`);
        
        const ports = Object.keys(COMMON_PORTS).map(Number);
        const openPorts = [];

        for (const port of ports) {
            const isOpen = await this.scanPort(host, port);
            if (isOpen) {
                const portInfo = COMMON_PORTS[port];
                openPorts.push({
                    port,
                    service: portInfo.name,
                    risk: portInfo.risk,
                    status: 'OPEN'
                });
                
                const riskColor = portInfo.risk === 'HIGH' ? colors.red : 
                                 portInfo.risk === 'MEDIUM' ? colors.yellow : colors.green;
                console.log(`  ${colors.green}✓${colors.reset} Port ${colors.bright}${port}${colors.reset} (${portInfo.name}) - ${riskColor}${portInfo.risk}${colors.reset}`);
            }
        }

        this.results.ports = openPorts;
        this.calculateRiskLevel();
        return openPorts;
    }

    // Check SSL/TLS configuration
    async checkSSL(host, port = 443) {
        return new Promise((resolve) => {
            console.log(`\n${colors.bright}Analyzing SSL/TLS configuration...${colors.reset}\n`);
            
            const options = {
                host,
                port,
                rejectUnauthorized: false
            };

            const socket = tls.connect(options, () => {
                const cert = socket.getPeerCertificate();
                const cipher = socket.getCipher();
                const protocol = socket.getProtocol();

                const sslInfo = {
                    valid: cert.valid_to ? new Date(cert.valid_to) > new Date() : false,
                    validFrom: cert.valid_from,
                    validTo: cert.valid_to,
                    issuer: cert.issuer ? cert.issuer.O : 'Unknown',
                    subject: cert.subject ? cert.subject.CN : 'Unknown',
                    protocol: protocol,
                    cipher: cipher ? cipher.name : 'Unknown'
                };

                const protocolRating = protocol === 'TLSv1.3' ? 'A' :
                                      protocol === 'TLSv1.2' ? 'B' :
                                      protocol === 'TLSv1.1' ? 'C' : 'F';

                console.log(`  Protocol: ${colors.cyan}${protocol}${colors.reset} (Rating: ${protocolRating})`);
                console.log(`  Cipher: ${colors.cyan}${cipher ? cipher.name : 'Unknown'}${colors.reset}`);
                console.log(`  Certificate Valid: ${sslInfo.valid ? colors.green + '✓ Yes' : colors.red + '✗ No'}${colors.reset}`);
                console.log(`  Valid Until: ${colors.cyan}${sslInfo.validTo}${colors.reset}`);

                socket.end();
                this.results.ssl = sslInfo;
                resolve(sslInfo);
            });

            socket.on('error', (err) => {
                console.log(`  ${colors.red}✗ SSL/TLS analysis failed: ${err.message}${colors.reset}`);
                resolve(null);
            });

            socket.setTimeout(5000, () => {
                socket.destroy();
                resolve(null);
            });
        });
    }

    // Local system security sweep
    async localSecuritySweep() {
        console.log(`\n${colors.bright}Performing local security sweep...${colors.reset}\n`);

        const systemInfo = {
            platform: os.platform(),
            release: os.release(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: Math.floor(os.uptime() / 60 / 60) + ' hours',
            totalMem: Math.floor(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
            freeMem: Math.floor(os.freemem() / 1024 / 1024 / 1024) + ' GB',
            cpus: os.cpus().length,
            networkInterfaces: Object.keys(os.networkInterfaces()).length
        };

        console.log(`  System: ${colors.cyan}${systemInfo.platform} ${systemInfo.release}${colors.reset}`);
        console.log(`  Architecture: ${colors.cyan}${systemInfo.arch}${colors.reset}`);
        console.log(`  Hostname: ${colors.cyan}${systemInfo.hostname}${colors.reset}`);
        console.log(`  Uptime: ${colors.cyan}${systemInfo.uptime}${colors.reset}`);
        console.log(`  Memory: ${colors.cyan}${systemInfo.freeMem}${colors.reset} free of ${colors.cyan}${systemInfo.totalMem}${colors.reset}`);
        console.log(`  CPUs: ${colors.cyan}${systemInfo.cpus}${colors.reset}`);
        console.log(`  Network Interfaces: ${colors.cyan}${systemInfo.networkInterfaces}${colors.reset}`);

        this.results.system = systemInfo;

        // Scan localhost
        console.log(`\n${colors.bright}Scanning localhost ports...${colors.reset}`);
        await this.scanPorts('127.0.0.1');

        return systemInfo;
    }

    // Calculate overall risk level
    calculateRiskLevel() {
        const highRiskPorts = this.results.ports.filter(p => p.risk === 'HIGH').length;
        const mediumRiskPorts = this.results.ports.filter(p => p.risk === 'MEDIUM').length;

        if (highRiskPorts >= 2) {
            this.results.riskLevel = 'HIGH';
        } else if (highRiskPorts >= 1 || mediumRiskPorts >= 3) {
            this.results.riskLevel = 'MEDIUM';
        } else {
            this.results.riskLevel = 'LOW';
        }
    }

    // Print port scan results
    printPortResults() {
        const riskColor = this.results.riskLevel === 'HIGH' ? colors.red :
                         this.results.riskLevel === 'MEDIUM' ? colors.yellow : colors.green;

        console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                    PORT SCAN RESULTS                       ║
╠════════════════════════════════════════════════════════════╣
║  Target: ${this.results.host.padEnd(48)}║
║  Open Ports: ${String(this.results.ports.length).padEnd(45)}║
╠════════════════════════════════════════════════════════════╣
║  PORT      SERVICE          RISK                           ║
║  ────      ───────          ────                           ║${colors.reset}`);

        this.results.ports.forEach(port => {
            const riskColor = port.risk === 'HIGH' ? colors.red :
                             port.risk === 'MEDIUM' ? colors.yellow : colors.green;
            console.log(`${colors.cyan}║${colors.reset}  ${String(port.port).padEnd(9)} ${port.service.padEnd(16)} ${riskColor}${port.risk.padEnd(27)}${colors.cyan}║${colors.reset}`);
        });

        console.log(`${colors.cyan}╠════════════════════════════════════════════════════════════╣
║  Risk Assessment: ${riskColor}${this.results.riskLevel}${colors.cyan}${' '.repeat(37 - this.results.riskLevel.length)}║
╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    }

    // Generate security recommendations
    generateRecommendations() {
        console.log(`\n${colors.bright}Security Recommendations:${colors.reset}\n`);

        const highRiskPorts = this.results.ports.filter(p => p.risk === 'HIGH');
        
        if (highRiskPorts.length > 0) {
            console.log(`  ${colors.red}⚠${colors.reset} HIGH RISK PORTS DETECTED:`);
            highRiskPorts.forEach(port => {
                console.log(`    • Close port ${port.port} (${port.service}) if not required`);
            });
        }

        if (this.results.ssl && !this.results.ssl.valid) {
            console.log(`  ${colors.red}⚠${colors.reset} SSL certificate is expired or invalid`);
        }

        if (this.results.ssl && this.results.ssl.protocol !== 'TLSv1.3') {
            console.log(`  ${colors.yellow}⚠${colors.reset} Upgrade to TLS 1.3 for better security`);
        }

        console.log(`  ${colors.green}✓${colors.reset} Regular security audits recommended`);
        console.log(`  ${colors.green}✓${colors.reset} Keep systems and software updated\n`);
    }

    // Interactive mode
    async interactive() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.printBanner();

        const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

        while (true) {
            console.log(`\n${colors.bright}CyberCAT Commands:${colors.reset}`);
            console.log(`  scan <host>     - Full vulnerability scan`);
            console.log(`  ports <host>    - Port scan only`);
            console.log(`  ssl <host>      - SSL/TLS check`);
            console.log(`  sweep           - Local security sweep`);
            console.log(`  help            - Show this help`);
            console.log(`  exit            - Exit scanner\n`);

            const command = await askQuestion(`${colors.cyan}cybercat>${colors.reset} `);
            const [cmd, ...args] = command.trim().split(' ');

            try {
                switch(cmd.toLowerCase()) {
                    case 'scan':
                        if (!args[0]) {
                            console.log(`${colors.red}Error: Host required${colors.reset}`);
                            break;
                        }
                        await this.fullScan(args[0]);
                        break;
                    
                    case 'ports':
                        if (!args[0]) {
                            console.log(`${colors.red}Error: Host required${colors.reset}`);
                            break;
                        }
                        this.results.host = args[0];
                        await this.scanPorts(args[0]);
                        this.printPortResults();
                        break;
                    
                    case 'ssl':
                        if (!args[0]) {
                            console.log(`${colors.red}Error: Host required${colors.reset}`);
                            break;
                        }
                        await this.checkSSL(args[0]);
                        break;
                    
                    case 'sweep':
                        await this.localSecuritySweep();
                        this.printPortResults();
                        this.generateRecommendations();
                        break;
                    
                    case 'help':
                        // Help is already shown above
                        break;
                    
                    case 'exit':
                        console.log(`\n${colors.cyan}Stay secure! 🐱${colors.reset}\n`);
                        rl.close();
                        return;
                    
                    default:
                        console.log(`${colors.red}Unknown command: ${cmd}${colors.reset}`);
                }
            } catch (error) {
                console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
            }
        }
    }

    // Full vulnerability scan
    async fullScan(host) {
        this.results.host = host;
        
        console.log(`\n${colors.bright}═══════════════════════════════════════════════════════════`);
        console.log(`  FULL VULNERABILITY SCAN: ${host}`);
        console.log(`═══════════════════════════════════════════════════════════${colors.reset}\n`);

        await this.scanPorts(host);
        
        // Check if HTTPS port is open
        if (this.results.ports.some(p => p.port === 443)) {
            await this.checkSSL(host);
        }

        this.printPortResults();
        this.generateRecommendations();
    }
}

// CLI Handler
async function main() {
    const args = process.argv.slice(2);
    const scanner = new CyberCATScanner();

    if (args.length === 0) {
        // Interactive mode
        await scanner.interactive();
    } else {
        scanner.printBanner();

        const [command, ...params] = args;

        switch(command) {
            case '--scan':
            case '-s':
            case 'scan':
                if (!params[0]) {
                    console.log(`${colors.red}Error: Host required for scan${colors.reset}`);
                    process.exit(1);
                }
                await scanner.fullScan(params[0]);
                break;

            case '--ports':
            case '-p':
            case 'ports':
                if (!params[0]) {
                    console.log(`${colors.red}Error: Host required for port scan${colors.reset}`);
                    process.exit(1);
                }
                scanner.results.host = params[0];
                await scanner.scanPorts(params[0]);
                scanner.printPortResults();
                break;

            case '--ssl':
            case 'ssl':
                if (!params[0]) {
                    console.log(`${colors.red}Error: Host required for SSL check${colors.reset}`);
                    process.exit(1);
                }
                await scanner.checkSSL(params[0]);
                break;

            case '--sweep':
            case 'sweep':
                await scanner.localSecuritySweep();
                scanner.printPortResults();
                scanner.generateRecommendations();
                break;

            case '--help':
            case '-h':
            case 'help':
                console.log(`
Usage: node scanner.js [command] [options]

Commands:
  scan <host>    Full vulnerability scan
  ports <host>   Port scan only
  ssl <host>     SSL/TLS check only
  sweep          Local security sweep
  help           Show this help
  (no command)   Interactive mode

Examples:
  node scanner.js scan example.com
  node scanner.js ports 192.168.1.1
  node scanner.js ssl example.com
  node scanner.js sweep
  node scanner.js
`);
                break;

            default:
                console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
                console.log(`Use 'node scanner.js --help' for usage information`);
                process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(err => {
        console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = CyberCATScanner;
