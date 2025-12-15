#!/usr/bin/env node

/**
 * James Ultimate - Main Entry Point
 * AI-Powered Cybersecurity Platform
 */

const chalk = require('chalk');
const { Command } = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
const boxen = require('boxen');
const open = require('open');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ASCII Art Logo
const logo = `
     ██╗ █████╗ ███╗   ███╗███████╗███████╗
     ██║██╔══██╗████╗ ████║██╔════╝██╔════╝
     ██║███████║██╔████╔██║█████╗  ███████╗
██   ██║██╔══██║██║╚██╔╝██║██╔══╝  ╚════██║
╚█████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝
`;

const version = '2.0.0';

// Color scheme
const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  highlight: chalk.magenta
};

function printBanner() {
  console.log(colors.primary(logo));
  console.log(boxen(
    colors.highlight('Ultimate Cybersecurity Platform') + '\n' +
    colors.info(`Version ${version}`) + '\n\n' +
    'Multi-LLM • IoT Integration • Security Analysis',
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  ));
}

// CLI Setup
const program = new Command();

program
  .name('james')
  .description('James Ultimate - AI-Powered Cybersecurity Platform')
  .version(version);

program
  .command('start')
  .description('Start the James server with web GUI')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options) => {
    printBanner();
    
    process.env.PORT = options.port;
    process.env.HOST = options.host;
    
    console.log(colors.info('\n🚀 Starting James Ultimate Server...\n'));
    
    // Start server
    require('./server');
    
    // Open browser
    if (options.open !== false) {
      setTimeout(() => {
        const url = `http://localhost:${options.port}`;
        console.log(colors.success(`\n✓ Opening browser at ${url}\n`));
        open(url);
      }, 2000);
    }
  });

program
  .command('scan')
  .description('Run a security scan')
  .option('-t, --type <type>', 'Scan type (system, network, ports, full)', 'full')
  .option('--host <host>', 'Target host for port scan', 'localhost')
  .action(async (options) => {
    printBanner();
    
    const { securityTools } = require('./tools/security-tools');
    
    console.log(colors.info(`\n🔍 Running ${options.type} scan...\n`));
    
    const spinner = ora('Scanning...').start();
    
    try {
      let result;
      
      switch (options.type) {
        case 'system':
          result = await securityTools.executeTool('system_analysis', {});
          break;
        case 'network':
          result = await securityTools.executeTool('network_analysis', {});
          break;
        case 'ports':
          result = await securityTools.executeTool('port_scan', { host: options.host });
          break;
        case 'full':
        default:
          result = await securityTools.executeTool('security_report', {});
          break;
      }
      
      spinner.succeed('Scan complete');
      console.log('\n' + JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(colors.error(error.message));
    }
  });

program
  .command('chat')
  .description('Start interactive chat mode')
  .action(async () => {
    printBanner();
    
    const { agentManager } = require('./agents/agent-manager');
    const { llmProvider } = require('./llm/provider');
    
    console.log(colors.info('\n💬 Interactive Chat Mode\n'));
    console.log('Type /help for commands, /exit to quit\n');
    
    // Try to set up a provider
    const providers = llmProvider.getProviders();
    const availableProvider = providers.find(p => p.hasKey || p.isLocal);
    
    if (availableProvider) {
      llmProvider.setActiveProvider(availableProvider.id);
      console.log(colors.success(`Using ${availableProvider.name}\n`));
    } else {
      console.log(colors.warning('No LLM provider available. Set an API key or install Ollama.\n'));
      console.log('You can still use /tools commands.\n');
    }
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const prompt = () => {
      rl.question(colors.primary('You: '), async (input) => {
        const trimmed = input.trim();
        
        if (trimmed === '/exit' || trimmed === '/quit') {
          console.log(colors.info('\nGoodbye! Stay secure! 🛡️\n'));
          rl.close();
          process.exit(0);
        }
        
        if (trimmed === '') {
          prompt();
          return;
        }
        
        try {
          const result = await agentManager.chat(trimmed);
          console.log(colors.success(`\n${result.agent.icon} ${result.agent.name}: `) + result.response + '\n');
        } catch (error) {
          console.log(colors.error(`\nError: ${error.message}\n`));
        }
        
        prompt();
      });
    };
    
    prompt();
  });

program
  .command('tools')
  .description('List available security tools')
  .action(() => {
    printBanner();
    
    const { securityTools } = require('./tools/security-tools');
    const tools = securityTools.getTools();
    
    console.log(colors.info('\n🔧 Available Security Tools:\n'));
    
    const categories = {};
    tools.forEach(tool => {
      if (!categories[tool.category]) {
        categories[tool.category] = [];
      }
      categories[tool.category].push(tool);
    });
    
    for (const [category, categoryTools] of Object.entries(categories)) {
      console.log(colors.highlight(`\n${category.toUpperCase()}:`));
      categoryTools.forEach(tool => {
        console.log(`  ${colors.primary(tool.id)} - ${tool.name}`);
        console.log(`    ${colors.info(tool.description)}`);
      });
    }
    
    console.log('\n');
  });

program
  .command('providers')
  .description('List available LLM providers')
  .action(() => {
    printBanner();
    
    const { llmProvider } = require('./llm/provider');
    const providers = llmProvider.getProviders();
    
    console.log(colors.info('\n🤖 Available LLM Providers:\n'));
    
    providers.forEach(provider => {
      const status = provider.hasKey || provider.isLocal 
        ? colors.success('✓ Ready') 
        : colors.warning('⚠ Needs API Key');
      
      console.log(`${provider.isLocal ? '🏠' : '☁️'} ${colors.primary(provider.name)} (${provider.id})`);
      console.log(`   Status: ${status}`);
      console.log(`   Models: ${provider.models.slice(0, 3).join(', ')}${provider.models.length > 3 ? '...' : ''}`);
      console.log('');
    });
  });

program
  .command('agents')
  .description('List available AI agents')
  .action(() => {
    printBanner();
    
    const { agentManager } = require('./agents/agent-manager');
    const agents = agentManager.getAgents();
    
    console.log(colors.info('\n🤖 Available AI Agents:\n'));
    
    agents.forEach(agent => {
      const active = agent.isActive ? colors.success(' (Active)') : '';
      console.log(`${agent.icon} ${colors.primary(agent.name)}${active}`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   ${colors.info(agent.description)}`);
      console.log('');
    });
  });

program
  .command('config')
  .description('Configure James settings')
  .action(async () => {
    printBanner();
    
    const { llmProvider } = require('./llm/provider');
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to configure?',
        choices: [
          { name: 'Set API Key', value: 'apikey' },
          { name: 'Select Default Provider', value: 'provider' },
          { name: 'Select Default Agent', value: 'agent' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);
    
    if (answers.action === 'apikey') {
      const providers = llmProvider.getProviders().filter(p => p.requiresKey);
      
      const keyAnswers = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'Select provider:',
          choices: providers.map(p => ({ name: p.name, value: p.id }))
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter API key:'
        }
      ]);
      
      llmProvider.setApiKey(keyAnswers.provider, keyAnswers.apiKey);
      console.log(colors.success('\n✓ API key saved!\n'));
    }
    
    if (answers.action === 'provider') {
      const providers = llmProvider.getProviders();
      
      const providerAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'Select default provider:',
          choices: providers.map(p => ({ 
            name: `${p.isLocal ? '🏠' : '☁️'} ${p.name}${p.hasKey || p.isLocal ? ' ✓' : ''}`, 
            value: p.id 
          }))
        }
      ]);
      
      llmProvider.setActiveProvider(providerAnswer.provider);
      console.log(colors.success('\n✓ Default provider set!\n'));
    }
  });

// Interactive mode if no command specified
if (process.argv.length <= 2) {
  printBanner();
  
  const startInteractive = async () => {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🌐 Start Web Server (GUI)', value: 'server' },
          { name: '💬 Interactive Chat', value: 'chat' },
          { name: '🔍 Run Security Scan', value: 'scan' },
          { name: '🔧 List Tools', value: 'tools' },
          { name: '🤖 List Providers', value: 'providers' },
          { name: '⚙️  Configure', value: 'config' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);
    
    switch (answers.action) {
      case 'server':
        process.argv.push('start');
        program.parse();
        break;
      case 'chat':
        process.argv.push('chat');
        program.parse();
        break;
      case 'scan':
        const scanType = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'Select scan type:',
            choices: [
              { name: 'Full Security Report', value: 'full' },
              { name: 'System Analysis', value: 'system' },
              { name: 'Network Analysis', value: 'network' },
              { name: 'Port Scan', value: 'ports' }
            ]
          }
        ]);
        process.argv.push('scan', '-t', scanType.type);
        program.parse();
        break;
      case 'tools':
        process.argv.push('tools');
        program.parse();
        break;
      case 'providers':
        process.argv.push('providers');
        program.parse();
        break;
      case 'config':
        process.argv.push('config');
        program.parse();
        break;
      case 'exit':
        console.log(colors.info('\nGoodbye! Stay secure! 🛡️\n'));
        process.exit(0);
    }
  };
  
  startInteractive();
} else {
  program.parse();
}