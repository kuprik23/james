#!/usr/bin/env node

/**
 * CYBERCAT - AI-Powered Cybersecurity Analysis Tool
 * A standalone executable for security scanning and analysis
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import Table from 'cli-table3';
import * as si from 'systeminformation';
import * as dns from 'dns';
import { exec } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

// Import services
import licenseService from './license-service';
import notificationManager from './notification-manager';
import settingsService from './settings-service';

// Import types
import {
  SystemInfo,
  NetworkAnalysis,
  OpenPort,
  ProcessAnalysis,
  SecurityStatus,
  SecurityReport,
  LicenseTier
} from './types';

// ASCII Art Logo
const logo = `
  ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗
 ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝
 ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║
 ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║
 ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║
  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝
`;

const version = '2.0.0';

// Color scheme
const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  highlight: chalk.magenta,
  gray: chalk.gray,
  white: chalk.white
};

// Utility functions
function printBanner(): void {
  console.log(colors.primary(logo));

  console.log(boxen(
    colors.highlight('Cybersecurity Analysis Tool') + '\n' +
    colors.info(`Version ${version}`) + '\n' +
    colors.gray('━'.repeat(50)) + '\n' +
    colors.white(`License: ${colors.success('MIT - Open Source')}`) + '\n' +
    colors.white(`Scans: ${colors.success('Unlimited ✓')}`),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  ));
  console.log(colors.gray('Emersa Labs © 2025 | MIT License\n'));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Security Analysis Functions
async function analyzeSystem(): Promise<SystemInfo> {
  const spinner = ora('Analyzing system security...').start();

  try {
    const results: SystemInfo = {
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

async function checkOpenPorts(host: string = 'localhost'): Promise<OpenPort[]> {
  const spinner = ora(`Scanning ports on ${host}...`).start();
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 8080, 8443];
  const openPorts: OpenPort[] = [];

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

function checkPort(host: string, port: number, timeout: number = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
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

function getServiceName(port: number): string {
  const services: Record<number, string> = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 135: 'RPC', 139: 'NetBIOS', 143: 'IMAP',
    443: 'HTTPS', 445: 'SMB', 993: 'IMAPS', 995: 'POP3S', 1433: 'MSSQL',
    1521: 'Oracle', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL',
    5900: 'VNC', 8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt'
  };
  return services[port] || 'Unknown';
}

async function checkNetworkSecurity(): Promise<NetworkAnalysis> {
  const spinner = ora('Analyzing network security...').start();

  try {
    const interfaces = await si.networkInterfaces();
    const connections = await si.networkConnections();
    const gateway = await si.networkGatewayDefault();

    const analysis: NetworkAnalysis = {
      interfaces: interfaces.map(iface => ({
        name: iface.iface,
        ip4: iface.ip4,
        ip6: iface.ip6,
        mac: iface.mac,
        type: iface.type,
        speed: iface.speed ?? undefined
      })),
      activeConnections: connections.length,
      suspiciousConnections: connections.filter(conn =>
        conn.state === 'ESTABLISHED' &&
        !['127.0.0.1', '::1', 'localhost'].includes(conn.peerAddress || '')
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

async function checkProcessSecurity(): Promise<ProcessAnalysis> {
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

    const analysis: ProcessAnalysis = {
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

async function checkFirewallStatus(): Promise<SecurityStatus['firewall']> {
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

async function checkAntivirusStatus(): Promise<SecurityStatus['antivirus']> {
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

async function generateSecurityReport(): Promise<SecurityReport | null> {
  printBanner();

  console.log(colors.info('\n📊 Generating Comprehensive Security Report...\n'));
  notificationManager.info('MIT License - Unlimited scans available!');

  const report: SecurityReport = {
    timestamp: new Date().toISOString(),
    system: {
      os: '',
      hostname: '',
      cpu: '',
      memory: '',
      memoryUsed: ''
    },
    network: {
      interfaces: [],
      activeConnections: 0,
      suspiciousConnections: [],
      gateway: null
    },
    processes: {
      total: 0,
      running: 0,
      suspicious: 0,
      highCpu: 0,
      highMemory: 0
    },
    security: {
      firewall: { enabled: false, details: '' },
      antivirus: { enabled: false, details: '' }
    },
    recommendations: [],
    license: licenseService.getLicense().tier
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
      portTable.push([port.toString(), service, risk]);
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
  const settings = settingsService.getSettings();
  const outputDir = settings.scanning.outputDir || './reports';

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = path.join(outputDir, `cybercat-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  notificationManager.success(`Report saved to: ${reportPath}`);

  return report;
}

// Interactive Menu
async function interactiveMenu(): Promise<void> {
  printBanner();

  const choices = [
    { name: '🔍 Full Security Scan', value: 'full' },
    { name: '🌐 Network Analysis', value: 'network' },
    { name: '⚙️  Process Analysis', value: 'process' },
    { name: '🔌 Port Scan', value: 'ports' },
    { name: '🛡️  Security Status Check', value: 'security' },
    { name: '📊 Generate Report', value: 'report' },
    { name: '🔑 License Management', value: 'license' },
    { name: '⚙️  Settings', value: 'settings' },
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
      case 'license':
        await manageLicense();
        break;
      case 'settings':
        await manageSettings();
        break;
      case 'exit':
        console.log(colors.primary('\nGoodbye! Stay secure! 🐱\n'));
        console.log(colors.gray('Emersa Labs © 2025\n'));
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

// License Management
async function manageLicense(): Promise<void> {
  const license = licenseService.getLicense();
  const stats = licenseService.getScanStatistics();

  console.log(colors.primary('\n🔑 License Management\n'));
  console.log('━'.repeat(50));
  console.log(`Current Tier: ${colors.primary(license.tier.toUpperCase())}`);
  console.log(`Status: ${colors.success(license.status)}`);
  console.log(`License Key: ${license.key || colors.gray('None (Free Tier)')}`);
  console.log(`Today's Scans: ${colors.warning(`${stats.todayScans} / ${stats.dailyLimit}`)}`);
  console.log('━'.repeat(50));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '📋 View License Details', value: 'view' },
        { name: '🔑 Activate License Key', value: 'activate' },
        { name: '💎 View Upgrade Options', value: 'upgrade' },
        { name: '📊 View Scan Statistics', value: 'stats' },
        { name: '⬅️  Back', value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'view':
      console.log(colors.success('\n✓ License Details:'));
      console.log(JSON.stringify(license, null, 2));
      break;
    case 'activate':
      const { key } = await inquirer.prompt([
        {
          type: 'input',
          name: 'key',
          message: 'Enter your license key (CC-XXXX-XXXX-XXXX-XXXX):'
        }
      ]);
      const result = licenseService.activateLicense(key, 'pro');
      if (result.success) {
        notificationManager.success('License activated successfully!');
      } else {
        notificationManager.error(`Activation failed: ${result.error}`);
      }
      break;
    case 'upgrade':
      showUpgradeOptions();
      break;
    case 'stats':
      console.log(colors.success('\n📊 Scan Statistics:'));
      console.log(JSON.stringify(stats, null, 2));
      break;
  }
}

// Settings Management
async function manageSettings(): Promise<void> {
  const settings = settingsService.getSettings();

  console.log(colors.primary('\n⚙️  Settings Management\n'));
  console.log('━'.repeat(50));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to configure?',
      choices: [
        { name: '📁 Scanning Settings', value: 'scanning' },
        { name: '🛡️  Security Settings', value: 'security' },
        { name: '🎨 Display Settings', value: 'display' },
        { name: '🔧 Advanced Settings', value: 'advanced' },
        { name: '📤 Export Settings', value: 'export' },
        { name: '📥 Import Settings', value: 'import' },
        { name: '🔄 Reset to Defaults', value: 'reset' },
        { name: '⬅️  Back', value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'scanning':
    case 'security':
    case 'display':
    case 'advanced':
      console.log(colors.info(`\nCurrent ${action} settings:`));
      console.log(JSON.stringify((settings as any)[action], null, 2));
      break;
    case 'export':
      const exported = settingsService.export();
      const exportPath = path.join(process.cwd(), 'cybercat-settings-export.json');
      fs.writeFileSync(exportPath, exported);
      notificationManager.success(`Settings exported to: ${exportPath}`);
      break;
    case 'import':
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Enter path to settings file:'
        }
      ]);
      try {
        const importData = fs.readFileSync(filePath, 'utf8');
        if (settingsService.import(importData)) {
          notificationManager.success('Settings imported successfully!');
        } else {
          notificationManager.error('Failed to import settings');
        }
      } catch (error) {
        notificationManager.error(`Import failed: ${(error as Error).message}`);
      }
      break;
    case 'reset':
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset all settings?',
          default: false
        }
      ]);
      if (confirm) {
        settingsService.reset();
        notificationManager.success('Settings reset to defaults');
      }
      break;
  }
}

// Show About / MIT License Info
function showUpgradeOptions(): void {
  const message = `
${colors.primary('🐱 CYBERCAT - Open Source')}

${colors.success('🆓 MIT License - Completely Free!')}
  ✓ Unlimited scans
  ✓ All features included
  ✓ No restrictions
  ✓ Modify and distribute freely
  ✓ Use commercially without fees

${colors.info('🚀 Want AI-Powered Analysis?')}
  Try ${colors.primary('James Ultimate')} for:
  ✓ Multi-LLM AI support
  ✓ AI Security Agents
  ✓ Web interface
  ✓ IoT management
  ✓ Advanced features

${colors.white('📧 Contribute:')}
  GitHub: ${colors.primary('https://github.com/kuprik23/james')}
  Issues: ${colors.gray('Report bugs and request features')}

${colors.gray('Also MIT Licensed - Fully Open Source!')}
`;

  console.log(boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green'
  }));
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
    ports.forEach(p => table.push([p.port.toString(), p.service]));
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

program
  .command('license')
  .description('Manage license')
  .option('-a, --activate <key>', 'Activate license key')
  .option('-s, --status', 'Show license status')
  .action(async (options) => {
    if (options.activate) {
      const result = licenseService.activateLicense(options.activate, 'pro');
      if (result.success) {
        console.log(colors.success('✓ License activated successfully!'));
      } else {
        console.log(colors.error(`✗ Activation failed: ${result.error}`));
      }
    } else if (options.status) {
      const license = licenseService.getLicense();
      const stats = licenseService.getScanStatistics();
      console.log(colors.primary('\n🔑 License Status\n'));
      console.log(`Tier: ${colors.primary(license.tier.toUpperCase())}`);
      console.log(`Status: ${colors.success(license.status)}`);
      console.log(`Today's Scans: ${colors.warning(`${stats.todayScans} / ${stats.dailyLimit}`)}`);
    } else {
      await manageLicense();
    }
  });

program
  .command('settings')
  .description('Manage settings')
  .action(async () => {
    await manageSettings();
  });

program
  .command('upgrade')
  .description('View upgrade options')
  .action(() => {
    printBanner();
    showUpgradeOptions();
  });

// Default to interactive mode if no command specified
if (process.argv.length <= 2) {
  interactiveMenu();
} else {
  program.parse();
}