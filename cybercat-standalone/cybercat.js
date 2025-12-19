#!/usr/bin/env node

/**
 * CyberCat - AI-Powered Cybersecurity Analysis Tool
 * A standalone executable for security scanning and analysis
 */

const chalk = require('chalk');
const { Command } = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
const boxen = require('boxen');
const Table = require('cli-table3');
const si = require('systeminformation');
const dns = require('dns');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ASCII Art Logo
const logo = `
   ____      _               ____      _   
  / ___|   _| |__   ___ _ __/ ___|__ _| |_ 
 | |  | | | | '_ \\ / _ \\ '__| |   / _\` | __|
 | |__| |_| | |_) |  __/ |  | |__| (_| | |_ 
  \\____\\__, |_.__/ \\___|_|   \\____\\__,_|\\__|
       |___/                                
`;

const version = '1.0.0';

// Color scheme
const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  highlight: chalk.magenta
};

// Utility functions
function printBanner() {
  console.log(colors.primary(logo));
  console.log(boxen(
    colors.highlight('AI-Powered Cybersecurity Analysis Tool') + '\n' +
    colors.info(`Version ${version}`),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  ));
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Security Analysis Functions
async function analyzeSystem() {
  const spinner = ora('Analyzing system security...').start();
  
  try {
    const results = {
      os: await si.osInfo(),
      cpu: await si.cpu(),
      mem: await si.mem(),
      disk: await si.diskLayout(),
      network: await si.networkInterfaces(),
      processes: await si.processes(),
      services: await si.services('*'),
      users: await si.users()
    };
    
    spinner.succeed('System analysis complete');
    return results;
  } catch (error) {
    spinner.fail('System analysis failed');
    throw error;
  }
}

async function checkOpenPorts(host = 'localhost') {
  const spinner = ora(`Scanning ports on ${host}...`).start();
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 8080, 8443];
  const openPorts = [];
  
  for (const port of commonPorts) {
    try {
      const isOpen = await checkPort(host, port);
      if (isOpen) {
        openPorts.push({ port, service: getServiceName(port) });
      }
    } catch (e) {
      // Port closed or filtered
    }
  }
  
  spinner.succeed(`Port scan complete. Found ${openPorts.length} open ports`);
  return openPorts;
}

function checkPort(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = require('net').createConnection({ host, port });
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function getServiceName(port) {
  const services = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 135: 'RPC', 139: 'NetBIOS', 143: 'IMAP',
    443: 'HTTPS', 445: 'SMB', 993: 'IMAPS', 995: 'POP3S', 1433: 'MSSQL',
    1521: 'Oracle', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL',
    5900: 'VNC', 8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt'
  };
  return services[port] || 'Unknown';
}

async function checkNetworkSecurity() {
  const spinner = ora('Analyzing network security...').start();
  
  try {
    const interfaces = await si.networkInterfaces();
    const connections = await si.networkConnections();
    const gateway = await si.networkGatewayDefault();
    
    const analysis = {
      interfaces: interfaces.map(iface => ({
        name: iface.iface,
        ip4: iface.ip4,
        ip6: iface.ip6,
        mac: iface.mac,
        type: iface.type,
        speed: iface.speed
      })),
      activeConnections: connections.length,
      suspiciousConnections: connections.filter(conn => 
        conn.state === 'ESTABLISHED' && 
        !['127.0.0.1', '::1', 'localhost'].includes(conn.peerAddress)
      ),
      gateway: gateway
    };
    
    spinner.succeed('Network analysis complete');
    return analysis;
  } catch (error) {
    spinner.fail('Network analysis failed');
    throw error;
  }
}

async function checkProcessSecurity() {
  const spinner = ora('Analyzing running processes...').start();
  
  try {
    const processes = await si.processes();
    const suspiciousPatterns = [
      /powershell.*-enc/i,
      /cmd.*\/c/i,
      /wscript/i,
      /cscript/i,
      /mshta/i,
      /regsvr32/i,
      /rundll32/i,
      /certutil.*-decode/i
    ];
    
    const analysis = {
      total: processes.all,
      running: processes.running,
      blocked: processes.blocked,
      sleeping: processes.sleeping,
      suspicious: processes.list.filter(proc => 
        suspiciousPatterns.some(pattern => pattern.test(proc.command || proc.name))
      ),
      highCpu: processes.list.filter(proc => proc.cpu > 50),
      highMemory: processes.list.filter(proc => proc.mem > 10)
    };
    
    spinner.succeed('Process analysis complete');
    return analysis;
  } catch (error) {
    spinner.fail('Process analysis failed');
    throw error;
  }
}

async function checkFirewallStatus() {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      exec('netsh advfirewall show allprofiles state', (error, stdout) => {
        if (error) {
          resolve({ enabled: 'Unknown', details: error.message });
        } else {
          const enabled = stdout.toLowerCase().includes('on');
          resolve({ enabled, details: stdout });
        }
      });
    } else {
      exec('sudo ufw status 2>/dev/null || iptables -L 2>/dev/null', (error, stdout) => {
        if (error) {
          resolve({ enabled: 'Unknown', details: 'Could not determine firewall status' });
        } else {
          resolve({ enabled: stdout.includes('active') || stdout.includes('Chain'), details: stdout });
        }
      });
    }
  });
}

async function checkAntivirusStatus() {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      exec('powershell -Command "Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,AntivirusSignatureLastUpdated"', (error, stdout) => {
        if (error) {
          resolve({ enabled: 'Unknown', details: error.message });
        } else {
          resolve({ 
            enabled: stdout.toLowerCase().includes('true'),
            details: stdout
          });
        }
      });
    } else {
      resolve({ enabled: 'N/A', details: 'Antivirus check not available on this platform' });
    }
  });
}

async function generateSecurityReport() {
  printBanner();
  console.log(colors.info('\n📊 Generating Comprehensive Security Report...\n'));
  
  const report = {
    timestamp: new Date().toISOString(),
    system: {},
    network: {},
    processes: {},
    security: {},
    recommendations: []
  };
  
  // System Analysis
  console.log(colors.primary('\n🖥️  System Analysis'));
  console.log('─'.repeat(50));
  const system = await analyzeSystem();
  report.system = {
    os: `${system.os.distro} ${system.os.release}`,
    hostname: system.os.hostname,
    cpu: system.cpu.brand,
    memory: formatBytes(system.mem.total),
    memoryUsed: `${((system.mem.used / system.mem.total) * 100).toFixed(1)}%`
  };
  
  const sysTable = new Table({
    head: [colors.primary('Property'), colors.primary('Value')],
    colWidths: [20, 50]
  });
  Object.entries(report.system).forEach(([key, value]) => {
    sysTable.push([key, value]);
  });
  console.log(sysTable.toString());
  
  // Network Analysis
  console.log(colors.primary('\n🌐 Network Analysis'));
  console.log('─'.repeat(50));
  const network = await checkNetworkSecurity();
  report.network = network;
  
  const netTable = new Table({
    head: [colors.primary('Interface'), colors.primary('IP Address'), colors.primary('MAC'), colors.primary('Type')],
    colWidths: [15, 20, 20, 15]
  });
  network.interfaces.forEach(iface => {
    netTable.push([iface.name, iface.ip4 || 'N/A', iface.mac || 'N/A', iface.type || 'N/A']);
  });
  console.log(netTable.toString());
  console.log(colors.info(`Active Connections: ${network.activeConnections}`));
  
  if (network.suspiciousConnections.length > 0) {
    console.log(colors.warning(`⚠️  Suspicious Connections: ${network.suspiciousConnections.length}`));
    report.recommendations.push('Review suspicious network connections');
  }
  
  // Port Scan
  console.log(colors.primary('\n🔍 Port Scan'));
  console.log('─'.repeat(50));
  const openPorts = await checkOpenPorts();
  report.network.openPorts = openPorts;
  
  if (openPorts.length > 0) {
    const portTable = new Table({
      head: [colors.primary('Port'), colors.primary('Service'), colors.primary('Risk Level')],
      colWidths: [10, 20, 15]
    });
    openPorts.forEach(({ port, service }) => {
      const risk = [22, 23, 3389, 5900].includes(port) ? colors.warning('Medium') : 
                   [21, 445, 135, 139].includes(port) ? colors.error('High') : colors.success('Low');
      portTable.push([port, service, risk]);
    });
    console.log(portTable.toString());
  } else {
    console.log(colors.success('✓ No common ports open'));
  }
  
  // Process Analysis
  console.log(colors.primary('\n⚙️  Process Analysis'));
  console.log('─'.repeat(50));
  const processes = await checkProcessSecurity();
  report.processes = {
    total: processes.total,
    running: processes.running,
    suspicious: processes.suspicious.length,
    highCpu: processes.highCpu.length,
    highMemory: processes.highMemory.length
  };
  
  console.log(`Total Processes: ${processes.total}`);
  console.log(`Running: ${processes.running}`);
  
  if (processes.suspicious.length > 0) {
    console.log(colors.error(`⚠️  Suspicious Processes: ${processes.suspicious.length}`));
    processes.suspicious.forEach(proc => {
      console.log(colors.warning(`  - ${proc.name} (PID: ${proc.pid})`));
    });
    report.recommendations.push('Investigate suspicious processes');
  } else {
    console.log(colors.success('✓ No suspicious processes detected'));
  }
  
  // Security Status
  console.log(colors.primary('\n🛡️  Security Status'));
  console.log('─'.repeat(50));
  
  const firewall = await checkFirewallStatus();
  const antivirus = await checkAntivirusStatus();
  
  report.security = { firewall, antivirus };
  
  console.log(`Firewall: ${firewall.enabled ? colors.success('✓ Enabled') : colors.error('✗ Disabled')}`);
  console.log(`Antivirus: ${antivirus.enabled === true ? colors.success('✓ Enabled') : 
               antivirus.enabled === 'N/A' ? colors.info('N/A') : colors.error('✗ Disabled')}`);
  
  if (!firewall.enabled) {
    report.recommendations.push('Enable Windows Firewall');
  }
  if (antivirus.enabled === false) {
    report.recommendations.push('Enable Windows Defender or install antivirus software');
  }
  
  // Recommendations
  console.log(colors.primary('\n📋 Security Recommendations'));
  console.log('─'.repeat(50));
  
  if (report.recommendations.length === 0) {
    report.recommendations.push('Keep your system and software updated');
    report.recommendations.push('Use strong, unique passwords');
    report.recommendations.push('Enable two-factor authentication where possible');
    report.recommendations.push('Regularly backup important data');
  }
  
  report.recommendations.forEach((rec, i) => {
    console.log(colors.warning(`${i + 1}. ${rec}`));
  });
  
  // Save Report
  const reportPath = path.join(process.cwd(), `cybercat-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(colors.success(`\n✓ Report saved to: ${reportPath}`));
  
  return report;
}

// Interactive Menu
async function interactiveMenu() {
  printBanner();
  
  const choices = [
    { name: '🔍 Full Security Scan', value: 'full' },
    { name: '🌐 Network Analysis', value: 'network' },
    { name: '⚙️  Process Analysis', value: 'process' },
    { name: '🔌 Port Scan', value: 'ports' },
    { name: '🛡️  Security Status Check', value: 'security' },
    { name: '📊 Generate Report', value: 'report' },
    { name: '❌ Exit', value: 'exit' }
  ];
  
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices
      }
    ]);
    
    console.log('');
    
    switch (action) {
      case 'full':
        await generateSecurityReport();
        break;
      case 'network':
        const network = await checkNetworkSecurity();
        console.log(colors.success('\nNetwork Analysis Results:'));
        console.log(JSON.stringify(network, null, 2));
        break;
      case 'process':
        const processes = await checkProcessSecurity();
        console.log(colors.success('\nProcess Analysis Results:'));
        console.log(`Total: ${processes.total}, Running: ${processes.running}`);
        console.log(`Suspicious: ${processes.suspicious.length}, High CPU: ${processes.highCpu.length}`);
        break;
      case 'ports':
        const { host } = await inquirer.prompt([
          {
            type: 'input',
            name: 'host',
            message: 'Enter host to scan:',
            default: 'localhost'
          }
        ]);
        const ports = await checkOpenPorts(host);
        console.log(colors.success('\nOpen Ports:'));
        ports.forEach(p => console.log(`  Port ${p.port}: ${p.service}`));
        break;
      case 'security':
        const firewall = await checkFirewallStatus();
        const antivirus = await checkAntivirusStatus();
        console.log(colors.success('\nSecurity Status:'));
        console.log(`Firewall: ${firewall.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`Antivirus: ${antivirus.enabled}`);
        break;
      case 'report':
        await generateSecurityReport();
        break;
      case 'exit':
        console.log(colors.primary('\nGoodbye! Stay secure! 🐱\n'));
        process.exit(0);
    }
    
    console.log('');
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
      }
    ]);
    console.clear();
    printBanner();
  }
}

// CLI Setup
const program = new Command();

program
  .name('cybercat')
  .description('CyberCat - AI-Powered Cybersecurity Analysis Tool')
  .version(version);

program
  .command('scan')
  .description('Run a full security scan')
  .action(async () => {
    await generateSecurityReport();
  });

program
  .command('network')
  .description('Analyze network security')
  .action(async () => {
    printBanner();
    const result = await checkNetworkSecurity();
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('ports')
  .description('Scan for open ports')
  .option('-h, --host <host>', 'Host to scan', 'localhost')
  .action(async (options) => {
    printBanner();
    const ports = await checkOpenPorts(options.host);
    const table = new Table({
      head: ['Port', 'Service'],
      colWidths: [10, 20]
    });
    ports.forEach(p => table.push([p.port, p.service]));
    console.log(table.toString());
  });

program
  .command('processes')
  .description('Analyze running processes')
  .action(async () => {
    printBanner();
    const result = await checkProcessSecurity();
    console.log(`Total Processes: ${result.total}`);
    console.log(`Running: ${result.running}`);
    console.log(`Suspicious: ${result.suspicious.length}`);
    if (result.suspicious.length > 0) {
      console.log('\nSuspicious Processes:');
      result.suspicious.forEach(p => console.log(`  - ${p.name} (PID: ${p.pid})`));
    }
  });

program
  .command('status')
  .description('Check security status (firewall, antivirus)')
  .action(async () => {
    printBanner();
    const firewall = await checkFirewallStatus();
    const antivirus = await checkAntivirusStatus();
    console.log(`\nFirewall: ${firewall.enabled ? colors.success('Enabled') : colors.error('Disabled')}`);
    console.log(`Antivirus: ${antivirus.enabled === true ? colors.success('Enabled') : colors.error('Disabled/Unknown')}`);
  });

program
  .command('interactive')
  .description('Start interactive mode')
  .action(async () => {
    await interactiveMenu();
  });

// Default to interactive mode if no command specified
if (process.argv.length <= 2) {
  interactiveMenu();
} else {
  program.parse();
}
