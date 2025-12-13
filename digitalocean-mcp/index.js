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

// Load environment variables
dotenv.config();

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

    this.apiToken = process.env.DIGITALOCEAN_API_TOKEN;
    this.baseURL = 'https://api.digitalocean.com/v2';
    
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
          name: 'list_ssh_keys',
          description: 'List all SSH keys in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
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
        {
          name: 'list_volumes',
          description: 'List all volumes in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_load_balancers',
          description: 'List all load balancers in your Digital Ocean account',
          inputSchema: {
            type: 'object',
            properties: {},
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