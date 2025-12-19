# Stripe MCP Server

MCP (Model Context Protocol) server for handling Stripe payment integration for CYBERCAT licensing system.

## Features

- Create checkout sessions for subscription purchases
- Manage customer subscriptions
- Verify subscription status
- Handle customer creation and management
- Create products and pricing tiers

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Add your Stripe API keys to `.env`:
- Get your keys from https://dashboard.stripe.com/apikeys
- Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY

4. Run the server:
```bash
npm start
```

## Available Tools

### create_checkout_session
Create a Stripe checkout session for license purchase.

### create_subscription
Create a subscription for a customer.

### verify_subscription
Verify if a subscription is active.

### cancel_subscription
Cancel a subscription.

### create_customer
Create a new Stripe customer.

### get_customer
Get customer details by ID.

### create_product
Create a new product in Stripe.

### create_price
Create a price for a product.

## Testing

Use Stripe test mode with test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

## Integration

This MCP server is used by CYBERCAT's licensing system to handle all payment-related operations.