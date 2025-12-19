#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create MCP server
const server = new Server(
  {
    name: 'stripe-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_checkout_session',
        description: 'Create a Stripe checkout session for license purchase',
        inputSchema: {
          type: 'object',
          properties: {
            priceId: {
              type: 'string',
              description: 'Stripe Price ID for the subscription',
            },
            customerEmail: {
              type: 'string',
              description: 'Customer email address',
            },
            successUrl: {
              type: 'string',
              description: 'URL to redirect after successful payment',
            },
            cancelUrl: {
              type: 'string',
              description: 'URL to redirect after cancelled payment',
            },
          },
          required: ['priceId', 'successUrl', 'cancelUrl'],
        },
      },
      {
        name: 'create_subscription',
        description: 'Create a subscription for a customer',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'Stripe Customer ID',
            },
            priceId: {
              type: 'string',
              description: 'Stripe Price ID',
            },
          },
          required: ['customerId', 'priceId'],
        },
      },
      {
        name: 'verify_subscription',
        description: 'Verify if a subscription is active',
        inputSchema: {
          type: 'object',
          properties: {
            subscriptionId: {
              type: 'string',
              description: 'Stripe Subscription ID',
            },
          },
          required: ['subscriptionId'],
        },
      },
      {
        name: 'cancel_subscription',
        description: 'Cancel a subscription',
        inputSchema: {
          type: 'object',
          properties: {
            subscriptionId: {
              type: 'string',
              description: 'Stripe Subscription ID',
            },
          },
          required: ['subscriptionId'],
        },
      },
      {
        name: 'create_customer',
        description: 'Create a new Stripe customer',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Customer email',
            },
            name: {
              type: 'string',
              description: 'Customer name',
            },
            metadata: {
              type: 'object',
              description: 'Additional customer metadata',
            },
          },
          required: ['email'],
        },
      },
      {
        name: 'get_customer',
        description: 'Get customer details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'Stripe Customer ID',
            },
          },
          required: ['customerId'],
        },
      },
      {
        name: 'create_product',
        description: 'Create a new product in Stripe',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Product name',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'create_price',
        description: 'Create a price for a product',
        inputSchema: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'Product ID',
            },
            amount: {
              type: 'number',
              description: 'Price amount in cents',
            },
            currency: {
              type: 'string',
              description: 'Currency code (e.g., usd)',
            },
            interval: {
              type: 'string',
              description: 'Billing interval (month or year)',
            },
          },
          required: ['productId', 'amount', 'currency', 'interval'],
        },
      },
    ],
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_checkout_session': {
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: args.priceId,
              quantity: 1,
            },
          ],
          customer_email: args.customerEmail,
          success_url: args.successUrl,
          cancel_url: args.cancelUrl,
          metadata: {
            product: 'CYBERCAT License',
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                sessionId: session.id,
                url: session.url,
                status: session.status,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_subscription': {
        const subscription = await stripe.subscriptions.create({
          customer: args.customerId,
          items: [{ price: args.priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                subscriptionId: subscription.id,
                status: subscription.status,
                clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
              }, null, 2),
            },
          ],
        };
      }

      case 'verify_subscription': {
        const subscription = await stripe.subscriptions.retrieve(args.subscriptionId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                subscriptionId: subscription.id,
                status: subscription.status,
                active: subscription.status === 'active',
                currentPeriodEnd: subscription.current_period_end,
              }, null, 2),
            },
          ],
        };
      }

      case 'cancel_subscription': {
        const subscription = await stripe.subscriptions.cancel(args.subscriptionId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                subscriptionId: subscription.id,
                status: subscription.status,
                canceledAt: subscription.canceled_at,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_customer': {
        const customer = await stripe.customers.create({
          email: args.email,
          name: args.name,
          metadata: args.metadata || {},
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                customerId: customer.id,
                email: customer.email,
                name: customer.name,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_customer': {
        const customer = await stripe.customers.retrieve(args.customerId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                customerId: customer.id,
                email: customer.email,
                name: customer.name,
                created: customer.created,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_product': {
        const product = await stripe.products.create({
          name: args.name,
          description: args.description,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                productId: product.id,
                name: product.name,
                description: product.description,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_price': {
        const price = await stripe.prices.create({
          product: args.productId,
          unit_amount: args.amount,
          currency: args.currency,
          recurring: {
            interval: args.interval,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                priceId: price.id,
                amount: price.unit_amount,
                currency: price.currency,
                interval: price.recurring?.interval,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            type: error.type || 'unknown',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stripe MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});