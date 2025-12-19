# Stripe MCP Server

Enhanced MCP server for comprehensive Stripe payment processing and subscription management with CYBERCAT platform.

## Features

### Checkout & Payment Processing
- **create_checkout_session** - Create Stripe Checkout session for subscriptions
- **create_payment_intent** - Create payment intent for one-time payments
- **confirm_payment_intent** - Confirm and process a payment intent

### Subscription Management
- **create_subscription** - Create new subscription for customer
- **verify_subscription** - Verify subscription status
- **cancel_subscription** - Cancel active subscription
- **list_subscriptions** - List all customer subscriptions
- **update_subscription** - Update/change subscription plan

### Customer Management
- **create_customer** - Create new Stripe customer
- **get_customer** - Retrieve customer details
- **update_customer** - Update customer information

### Invoice Management
- **list_invoices** - List customer invoices
- **get_invoice** - Get invoice details
- **create_billing_portal_session** - Create self-service billing portal session

### Refunds
- **create_refund** - Process full or partial refund

### Products & Prices
- **create_product** - Create new product
- **create_price** - Create pricing for product
- **list_products** - List all products

### Webhooks
- **list_webhook_endpoints** - List configured webhook endpoints

## Installation

```bash
cd james-ultimate/stripe-mcp
npm install
```

## Configuration

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_...
```

### .env File
```
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Usage

### Starting the Server
```bash
npm start
```

### Example Tool Calls

#### Create Checkout Session
```json
{
  "name": "create_checkout_session",
  "arguments": {
    "priceId": "price_1234567890",
    "customerEmail": "customer@example.com",
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }
}
```

#### Create Payment Intent
```json
{
  "name": "create_payment_intent",
  "arguments": {
    "amount": 5000,
    "currency": "usd",
    "customerId": "cus_1234567890"
  }
}
```

#### List Subscriptions
```json
{
  "name": "list_subscriptions",
  "arguments": {
    "customerId": "cus_1234567890"
  }
}
```

#### Create Billing Portal Session
```json
{
  "name": "create_billing_portal_session",
  "arguments": {
    "customerId": "cus_1234567890",
    "returnUrl": "https://example.com/account"
  }
}
```

## Security Features

- **API Key Protection** - Secret key stored in environment variables
- **Webhook Signature Verification** - Validates webhook events
- **PCI Compliance** - Uses Stripe's secure payment processing
- **Customer Data Encryption** - All data encrypted in transit and at rest

## Error Handling

The server provides detailed error responses:
- **Invalid API Key** - API key not configured or invalid
- **Payment Errors** - Card declined, insufficient funds, etc.
- **Subscription Errors** - Invalid plan, customer not found
- **Network Errors** - Connection timeouts, API unavailable

## Integration with CYBERCAT

This MCP server integrates with CYBERCAT to provide:
- Automated license provisioning
- Subscription lifecycle management
- Payment tracking and reporting
- Customer account management
- Billing automation

## Stripe API Reference

Full Stripe API documentation: https://stripe.com/docs/api

## Testing

Use Stripe test mode for development:
- Test API keys: `sk_test_...`
- Test card numbers: `4242 4242 4242 4242`
- Test webhooks: Use Stripe CLI

## License

MIT License - Copyright © 2025 Emersa Ltd.

## Support

For issues and questions:
- GitHub Issues: [CYBERCAT Issues](https://github.com/emersa/james/issues)
- Stripe Support: [Stripe Support](https://support.stripe.com/)