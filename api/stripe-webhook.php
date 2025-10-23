<?php
// Stripe Webhook Handler for ChefOS

require __DIR__ . '/../src/Database.php';
require __DIR__ . '/../src/StripeService.php';

use ChefOS\Database\Database;
use ChefOS\Services\StripeService;

// Get the raw POST body
$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

try {
    $stripeService = new StripeService();
    
    // Verify webhook signature
    if (!$stripeService->verifyWebhookSignature($payload, $sigHeader)) {
        http_response_code(400);
        error_log('Stripe webhook signature verification failed');
        exit('Invalid signature');
    }
    
    $event = json_decode($payload, true);
    
    if (!$event || !isset($event['type'])) {
        http_response_code(400);
        error_log('Invalid Stripe webhook payload');
        exit('Invalid payload');
    }
    
    $pdo = Database::getConnection();
    
    // Handle different event types
    switch ($event['type']) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            handleSubscriptionEvent($event, $pdo, $stripeService);
            break;
            
        case 'customer.subscription.deleted':
            handleSubscriptionDeleted($event, $pdo, $stripeService);
            break;
            
        case 'invoice.payment_succeeded':
            handlePaymentSucceeded($event, $pdo, $stripeService);
            break;
            
        case 'invoice.payment_failed':
            handlePaymentFailed($event, $pdo, $stripeService);
            break;
            
        case 'customer.created':
            handleCustomerCreated($event, $pdo);
            break;
            
        default:
            error_log('Unhandled Stripe webhook event type: ' . $event['type']);
            break;
    }
    
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    
} catch (Exception $e) {
    error_log('Stripe webhook error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Webhook processing failed']);
}

/**
 * Handle subscription created/updated events
 */
function handleSubscriptionEvent($event, $pdo, $stripeService) {
    $subscription = $event['data']['object'];
    $customerId = $subscription['customer'];
    
    // Find user by Stripe customer ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE stripe_customer_id = ?");
    $stmt->execute([$customerId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        error_log('User not found for Stripe customer: ' . $customerId);
        return;
    }
    
    $status = $subscription['status'];
    $currentPeriodEnd = date('Y-m-d H:i:s', $subscription['current_period_end']);
    
    // Update user subscription
    $stripeService->updateUserSubscription(
        $user['id'],
        $customerId,
        $subscription['id'],
        $status,
        $currentPeriodEnd
    );
    
    error_log("Updated subscription for user {$user['id']}: status={$status}, period_end={$currentPeriodEnd}");
}

/**
 * Handle subscription deleted event
 */
function handleSubscriptionDeleted($event, $pdo, $stripeService) {
    $subscription = $event['data']['object'];
    $customerId = $subscription['customer'];
    
    // Find user by Stripe customer ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE stripe_customer_id = ?");
    $stmt->execute([$customerId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        error_log('User not found for Stripe customer: ' . $customerId);
        return;
    }
    
    // Update user subscription to canceled
    $stripeService->updateUserSubscription(
        $user['id'],
        $customerId,
        $subscription['id'],
        'canceled'
    );
    
    error_log("Canceled subscription for user {$user['id']}");
}

/**
 * Handle successful payment
 */
function handlePaymentSucceeded($event, $pdo, $stripeService) {
    $invoice = $event['data']['object'];
    $customerId = $invoice['customer'];
    $subscriptionId = $invoice['subscription'] ?? null;
    
    // Find user by Stripe customer ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE stripe_customer_id = ?");
    $stmt->execute([$customerId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        error_log('User not found for Stripe customer: ' . $customerId);
        return;
    }
    
    // Add billing record
    $amount = $invoice['amount_paid'] / 100; // Convert from cents
    $currency = $invoice['currency'];
    $paymentDate = date('Y-m-d H:i:s', $invoice['status_transitions']['paid_at']);
    
    $stripeService->addBillingRecord(
        $user['id'],
        $invoice['id'],
        $invoice['payment_intent'],
        $amount,
        $currency,
        'paid',
        $invoice['hosted_invoice_url'],
        $paymentDate
    );
    
    error_log("Recorded successful payment for user {$user['id']}: ${amount} {$currency}");
}

/**
 * Handle failed payment
 */
function handlePaymentFailed($event, $pdo, $stripeService) {
    $invoice = $event['data']['object'];
    $customerId = $invoice['customer'];
    
    // Find user by Stripe customer ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE stripe_customer_id = ?");
    $stmt->execute([$customerId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        error_log('User not found for Stripe customer: ' . $customerId);
        return;
    }
    
    // Add billing record for failed payment
    $amount = $invoice['amount_due'] / 100; // Convert from cents
    $currency = $invoice['currency'];
    
    $stripeService->addBillingRecord(
        $user['id'],
        $invoice['id'],
        $invoice['payment_intent'] ?? null,
        $amount,
        $currency,
        'failed',
        $invoice['hosted_invoice_url'] ?? null
    );
    
    error_log("Recorded failed payment for user {$user['id']}: ${amount} {$currency}");
}

/**
 * Handle customer created event
 */
function handleCustomerCreated($event, $pdo) {
    $customer = $event['data']['object'];
    
    // Log customer creation for debugging
    error_log("New Stripe customer created: " . $customer['id'] . " for email: " . $customer['email']);
}
?>
