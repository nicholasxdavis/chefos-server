# Stripe Integration for ChefOS

This document describes the complete Stripe integration for ChefOS billing, subscription management, and usage tracking.

## 🔧 Environment Variables

Configure the following environment variables in your Coolify dashboard:

```bash
# Stripe Configuration
STRIPE_PK=pk_test_...                    # Stripe Publishable Key
STRIPE_SK=sk_test_...                    # Stripe Secret Key
STRIPE_PRICE_ID=price_...                # Stripe Price ID for subscription
STRIPE_WB=whsec_...                      # Stripe Webhook Secret
STRIPE_WB_THIN=whsec_...                 # Stripe Webhook Secret (Thin)
STRIPE_PK_SECRET=sk_test_...             # Stripe Secret Key (alternate)
STRIPE_PROD=false                        # Production mode flag
```

## 🗄️ Database Schema

### Updated Users Table
```sql
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN subscription_status ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing') NULL;
ALTER TABLE users ADD COLUMN subscription_current_period_end TIMESTAMP NULL;
```

### New Tables
- `usage_tracking` - Track user feature usage
- `billing_history` - Store billing and payment records
- `plan_limits` - Define limits for trial and pro plans

## 🚀 API Endpoints

### Billing Endpoints

#### Create Checkout Session
**Endpoint**: `POST /api/billing/create-checkout`

**Request Body**:
```json
{
    "user_id": 1
}
```

**Response**:
```json
{
    "success": true,
    "checkout_url": "https://checkout.stripe.com/...",
    "session_id": "cs_..."
}
```

#### Create Billing Portal Session
**Endpoint**: `POST /api/billing/create-portal`

**Request Body**:
```json
{
    "user_id": 1
}
```

**Response**:
```json
{
    "success": true,
    "portal_url": "https://billing.stripe.com/..."
}
```

#### Get Subscription Status
**Endpoint**: `GET /api/billing/subscription-status?user_id=1`

**Response**:
```json
{
    "success": true,
    "subscription": {
        "plan": "pro",
        "status": "active",
        "current_period_end": "2025-02-22 10:00:00"
    },
    "usage_limits": {
        "max_recipes": 1000,
        "max_menus": 500
    },
    "current_usage": {
        "recipe": {"current": 5, "limit": 1000, "allowed": true}
    }
}
```

#### Track Usage
**Endpoint**: `POST /api/billing/usage-track`

**Request Body**:
```json
{
    "user_id": 1,
    "feature_type": "recipe",
    "action_type": "create",
    "item_id": "recipe_123"
}
```

### Webhook Endpoint
**Endpoint**: `POST /api/stripe-webhook.php`

**Handles Events**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.created`

## 📱 Frontend Integration

### JavaScript Classes

#### BillingIntegration
```javascript
// Upgrade to Pro
await window.ChefOSBilling.upgradeToPro();

// Open billing portal
await window.ChefOSBilling.openBillingPortal();

// Check usage limits
const canCreate = await window.ChefOSBilling.canPerformAction('recipe');

// Show usage statistics
await window.ChefOSBilling.showUsageStats();
```

#### UsageTracker
```javascript
// Track feature usage
await window.ChefOSUsageTracker.trackRecipeCreate('recipe_123');

// Check limits before action
const limits = await window.ChefOSUsageTracker.checkUsageLimits('recipe');
```

### HTML Integration
```html
<!-- Include billing scripts -->
<script src="js/billing-integration.js"></script>
<script src="js/usage-tracking.js"></script>

<!-- Track actions with data attributes -->
<button data-track="recipe-create">Create Recipe</button>
```

## 💳 Subscription Plans

### Trial Plan
- **Recipes**: 10 max
- **Menus**: 5 max
- **Stores**: 3 max
- **Calendar Items**: 50 max
- **Shopping Lists**: 2 max
- **Storage**: 50 MB

### Pro Plan
- **Recipes**: 1,000 max
- **Menus**: 500 max
- **Stores**: 100 max
- **Calendar Items**: 5,000 max
- **Shopping Lists**: 50 max
- **Storage**: 1,000 MB

## 🔄 Usage Tracking

### Automatic Tracking
The system automatically tracks:
- Recipe creation, updates, deletions
- Menu creation, updates, deletions
- Store creation
- Calendar item creation
- Shopping list creation

### Manual Tracking
```javascript
// Track custom actions
await window.ChefOSUsageTracker.trackUsage('recipe', 'view', 'recipe_123');
```

### Usage Limits Enforcement
```javascript
// Check before allowing action
const canCreate = await window.ChefOSBilling.canPerformAction('recipe');
if (!canCreate) {
    // Show upgrade prompt
    return;
}
```

## 🎯 Webhook Configuration

### Stripe Dashboard Setup
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://chefos.blacnova.net/api/stripe-webhook.php`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`

### Webhook Security
- Signature verification using webhook secret
- Event type validation
- Error logging and handling

## 🧪 Testing

### Test Stripe Integration
Visit: `https://chefos.blacnova.net/test-stripe.php`

### Test Webhook
Use Stripe CLI or dashboard to send test events:
```bash
stripe listen --forward-to https://chefos.blacnova.net/api/stripe-webhook.php
```

### Test Checkout Flow
1. Create a test user
2. Call `/api/billing/create-checkout`
3. Complete test payment
4. Verify webhook events

## 📊 Billing Features

### Subscription Management
- **Upgrade**: Trial → Pro
- **Downgrade**: Pro → Trial (via cancellation)
- **Portal**: Self-service billing management
- **History**: Payment and invoice tracking

### Usage Monitoring
- **Real-time**: Track usage as it happens
- **Limits**: Enforce plan limits
- **Alerts**: Notify when approaching limits
- **Analytics**: Usage statistics and trends

### Payment Processing
- **Stripe Checkout**: Secure payment forms
- **Billing Portal**: Customer self-service
- **Webhooks**: Real-time subscription updates
- **History**: Complete payment tracking

## 🔒 Security Features

### Data Protection
- **PCI Compliance**: Stripe handles payment data
- **Webhook Verification**: Signature validation
- **User Isolation**: User-specific data access
- **Audit Trail**: Complete usage and payment logs

### Rate Limiting
Consider implementing rate limiting for:
- Checkout session creation
- Usage tracking requests
- Billing portal access

## 🛠️ Configuration

### Stripe Dashboard
1. **Products**: Create subscription product
2. **Prices**: Set up recurring pricing
3. **Webhooks**: Configure endpoint
4. **Customers**: Manage customer data

### Environment Setup
```bash
# Development
STRIPE_PK=pk_test_...
STRIPE_SK=sk_test_...
STRIPE_PRICE_ID=price_test_...

# Production
STRIPE_PK=pk_live_...
STRIPE_SK=sk_live_...
STRIPE_PRICE_ID=price_live_...
```

## 📝 Usage Examples

### Frontend Integration
```javascript
// Check subscription status
const status = await window.ChefOSBilling.getSubscriptionStatus();

// Upgrade to Pro
if (status.subscription.plan === 'trial') {
    await window.ChefOSBilling.upgradeToPro();
}

// Track recipe creation
await window.ChefOSUsageTracker.trackRecipeCreate('recipe_123');
```

### Backend Integration
```php
// Check usage limits
$stripeService = new \ChefOS\Services\StripeService();
$limits = $stripeService->checkUsageLimits($userId, 'recipe');

// Track usage
$stripeService->trackUsage($userId, 'recipe', 'create', $recipeId);

// Create checkout session
$checkout = $stripeService->createCheckoutSession($customerId, $successUrl, $cancelUrl);
```

## 🚀 Deployment Checklist

- [ ] Set up Stripe account and products
- [ ] Configure environment variables
- [ ] Set up webhook endpoint
- [ ] Test checkout flow
- [ ] Test webhook events
- [ ] Configure plan limits
- [ ] Test usage tracking
- [ ] Set up monitoring and alerts

## 📞 Support

For Stripe integration support:
1. Check Stripe dashboard for webhook events
2. Review server logs for errors
3. Test with Stripe CLI
4. Verify environment variables
5. Check database connectivity

The integration provides a complete billing solution with subscription management, usage tracking, and payment processing for ChefOS.
