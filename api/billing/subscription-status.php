<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/../../src/Database.php';
require __DIR__ . '/../../src/StripeService.php';

use ChefOS\Database\Database;
use ChefOS\Services\StripeService;

try {
    // Only allow GET and POST requests
    if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'])) {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }

    // Get user ID from query string or POST body
    $userId = null;
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = $_GET['user_id'] ?? null;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? null;
    }
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit();
    }
    
    $pdo = Database::getConnection();
    $stripeService = new StripeService();

    // Get user subscription details
    $subscription = $stripeService->getUserSubscription($userId);
    
    if (!$subscription) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit();
    }

    // Get usage statistics
    $usage = $stripeService->getUserUsage($userId, 30);
    
    // Get billing history
    $billingHistory = $stripeService->getBillingHistory($userId, 5);

    // Calculate usage for each feature
    $usageStats = [];
    $featureTypes = ['recipe', 'menu', 'store', 'calendar', 'shopping_list'];
    
    foreach ($featureTypes as $feature) {
        $limits = $stripeService->checkUsageLimits($userId, $feature);
        $usageStats[$feature] = $limits;
    }

    echo json_encode([
        'success' => true,
        'subscription' => [
            'plan' => $subscription['plan'],
            'status' => $subscription['subscription_status'],
            'current_period_end' => $subscription['subscription_current_period_end'],
            'stripe_customer_id' => $subscription['stripe_customer_id'],
            'stripe_subscription_id' => $subscription['stripe_subscription_id']
        ],
        'usage_limits' => [
            'max_recipes' => $subscription['max_recipes'] ?? 0,
            'max_menus' => $subscription['max_menus'] ?? 0,
            'max_stores' => $subscription['max_stores'] ?? 0,
            'max_calendar_items' => $subscription['max_calendar_items'] ?? 0,
            'max_shopping_lists' => $subscription['max_shopping_lists'] ?? 0,
            'storage_limit_mb' => $subscription['storage_limit_mb'] ?? 0
        ],
        'current_usage' => $usageStats,
        'usage_history' => $usage,
        'billing_history' => $billingHistory
    ]);

} catch (Exception $e) {
    error_log('Subscription status error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to get subscription status: ' . $e->getMessage()]);
}
?>
