import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables (fallback for development)
dotenv.config();

/**
 * Secure Token Retrieval
 * Priority: 1. DPAPI Secure Storage, 2. Environment Variable, 3. .env file
 */
function getSecureToken() {
  // Method 1: Try DPAPI encrypted storage (most secure)
  try {
    const credPath = join(
      process.env.LOCALAPPDATA || '',
      'James',
      'credentials',
      'JamesAI_DigitalOcean.enc'
    );

    if (existsSync(credPath)) {
      // Read encrypted data directly and use PowerShell for decryption
      const encryptedData = readFileSync(credPath, 'utf8').trim();
      
      // Create a temporary PowerShell script for reliable execution
      const psScript = `
[System.Reflection.Assembly]::LoadWithPartialName('System.Security') | Out-Null
$encryptedData = '${encryptedData}'
$decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
  [Convert]::FromBase64String($encryptedData),
  $null,
  [System.Security.Cryptography.DataProtectionScope]::CurrentUser
)
[System.Text.Encoding]::UTF8.GetString($decryptedBytes)
`;

      const token = execSync(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      if (token && token.startsWith('dop_')) {
        console.error('[SECURITY] Token loaded from DPAPI secure storage');
        return token;
      }
    }
  } catch (error) {
    console.error('[SECURITY] DPAPI retrieval failed:', error.message);
  }

  // Method 2: Environment variable
  if (process.env.DIGITALOCEAN_API_TOKEN) {
    console.error('[SECURITY] Token loaded from environment variable');
    return process.env.DIGITALOCEAN_API_TOKEN;
  }

  // Method 3: .env file (development only)
  console.error('[SECURITY] No secure token found. Run security/store-token.bat to store securely.');
  return null;
}

class DigitalOceanMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'digitalocean-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Use secure token retrieval
    this.apiToken = getSecureToken();
    this.baseURL = 'https://api.digitalocean.com/v2';
    
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Droplet Management
        {
          name: 'list_droplets',
          description: 'List all droplets in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {
              tag: {
                type: 'string',
                description: 'Filter droplets by tag (optional)',
              },
            },
          },
        },
        {
          name: 'get_droplet',
          description: 'Get detailed information about a specific droplet',
          inputSchema: {
            type: 'object',
            properties: {
              droplet_id: {
                type: 'string',
                description: 'The ID of the droplet',
              },
            },
            required: ['droplet_id'],
          },
        },
        {
          name: 'get_droplet_snapshots',
          description: 'List all snapshots for a specific droplet',
          inputSchema: {
            type: 'object',
            properties: {
              droplet_id: {
                type: 'string',
                description: 'The ID of the droplet',
              },
            },
            required: ['droplet_id'],
          },
        },
        // Monitoring Tools
        {
          name: 'get_droplet_metrics',
          description: 'Get monitoring metrics for a specific droplet (CPU, memory, bandwidth)',
          inputSchema: {
            type: 'object',
            properties: {
              droplet_id: {
                type: 'string',
                description: 'The ID of the droplet',
              },
              metric: {
                type: 'string',
                description: 'Metric type: cpu, memory_free, memory_available, disk_read, disk_write, bandwidth_inbound, bandwidth_outbound',
              },
              start: {
                type: 'string',
                description: 'Start time for metrics (ISO 8601 format)',
              },
              end: {
                type: 'string',
                description: 'End time for metrics (ISO 8601 format)',
              },
            },
            required: ['droplet_id', 'metric', 'start', 'end'],
          },
        },
        {
          name: 'get_droplet_alerts',
          description: 'List all alert policies for monitoring',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        // Networking
        {
          name: 'list_firewalls',
          description: 'List all firewalls in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_firewall',
          description: 'Get detailed information about a specific firewall',
          inputSchema: {
            type: 'object',
            properties: {
              firewall_id: {
                type: 'string',
                description: 'The ID of the firewall',
              },
            },
            required: ['firewall_id'],
          },
        },
        {
          name: 'list_vpcs',
          description: 'List all Virtual Private Clouds (VPCs)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_domains',
          description: 'List all domains',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_domain',
          description: 'Get details about a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain_name: {
                type: 'string',
                description: 'The domain name',
              },
            },
            required: ['domain_name'],
          },
        },
        // Load Balancers
        {
          name: 'list_load_balancers',
          description: 'List all load balancers in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_load_balancer',
          description: 'Get detailed information about a specific load balancer',
          inputSchema: {
            type: 'object',
            properties: {
              lb_id: {
                type: 'string',
                description: 'The ID of the load balancer',
              },
            },
            required: ['lb_id'],
          },
        },
        // Databases
        {
          name: 'list_databases',
          description: 'List all managed databases',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_database',
          description: 'Get details about a specific database cluster',
          inputSchema: {
            type: 'object',
            properties: {
              db_id: {
                type: 'string',
                description: 'The ID of the database cluster',
              },
            },
            required: ['db_id'],
          },
        },
        // SSH Keys
        {
          name: 'list_ssh_keys',
          description: 'List all SSH keys in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        // Account & Projects
        {
          name: 'get_account_info',
          description: 'Get information about your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_projects',
          description: 'List all projects in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        // Storage
        {
          name: 'list_volumes',
          description: 'List all volumes in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_volume',
          description: 'Get details about a specific volume',
          inputSchema: {
            type: 'object',
            properties: {
              volume_id: {
                type: 'string',
                description: 'The ID of the volume',
              },
            },
            required: ['volume_id'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.apiToken) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Digital Ocean API token not configured. Please set DIGITALOCEAN_API_TOKEN environment variable.'
        );
      }

      try {
        const headers = {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        };

        switch (name) {
          case 'list_droplets': {
            const url = args.tag 
              ? `${this.baseURL}/droplets?tag_name=${args.tag}`
              : `${this.baseURL}/droplets`;
            const response = await axios.get(url, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_droplet': {
            const response = await axios.get(
              `${this.baseURL}/droplets/${args.droplet_id}`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_firewalls': {
            const response = await axios.get(`${this.baseURL}/firewalls`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_firewall': {
            const response = await axios.get(
              `${this.baseURL}/firewalls/${args.firewall_id}`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_ssh_keys': {
            const response = await axios.get(`${this.baseURL}/account/keys`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_account_info': {
            const response = await axios.get(`${this.baseURL}/account`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_projects': {
            const response = await axios.get(`${this.baseURL}/projects`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_volumes': {
            const response = await axios.get(`${this.baseURL}/volumes`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_load_balancers': {
            const response = await axios.get(`${this.baseURL}/load_balancers`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_droplet_snapshots': {
            const response = await axios.get(
              `${this.baseURL}/droplets/${args.droplet_id}/snapshots`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_droplet_metrics': {
            const response = await axios.get(
              `${this.baseURL}/monitoring/metrics/droplet/${args.metric}?host_id=${args.droplet_id}&start=${args.start}&end=${args.end}`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_droplet_alerts': {
            const response = await axios.get(`${this.baseURL}/monitoring/alerts`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_vpcs': {
            const response = await axios.get(`${this.baseURL}/vpcs`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_domains': {
            const response = await axios.get(`${this.baseURL}/domains`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_domain': {
            const response = await axios.get(
              `${this.baseURL}/domains/${args.domain_name}`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_load_balancer': {
            const response = await axios.get(
              `${this.baseURL}/load_balancers/${args.lb_id}`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'list_databases': {
            const response = await axios.get(`${this.baseURL}/databases`, { headers });
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_database': {
            const response = await axios.get(
              `${this.baseURL}/databases/${args.db_id}`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          case 'get_volume': {
            const response = await axios.get(
              `${this.baseURL}/volumes/${args.volume_id}`,
              { headers }
            );
            return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error.response) {
          throw new McpError(
            ErrorCode.InternalError,
            `Digital Ocean API error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Digital Ocean MCP server running');
  }
}

// Start the server
const server = new DigitalOceanMCPServer();
server.run().catch(console.error);
