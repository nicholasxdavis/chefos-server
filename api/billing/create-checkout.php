<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit();
    }

    $userId = $input['user_id'];
    
    $pdo = Database::getConnection();
    $stripeService = new StripeService();

    // Get user details
    $stmt = $pdo->prepare("SELECT id, email, full_name, stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit();
    }

    // Create or get Stripe customer
    $customerId = $user['stripe_customer_id'];
    if (!$customerId) {
        $customer = $stripeService->createCustomer($user['email'], $user['full_name']);
        $customerId = $customer['id'];
        
        // Update user with Stripe customer ID
        $stmt = $pdo->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
        $stmt->execute([$customerId, $userId]);
    }

    // Create checkout session
    $successUrl = 'https://chefos.blacnova.net/billing-success.html?session_id={CHECKOUT_SESSION_ID}';
    $cancelUrl = 'https://chefos.blacnova.net/billing-cancel.html';
    
    $checkoutSession = $stripeService->createCheckoutSession($customerId, $successUrl, $cancelUrl);

    echo json_encode([
        'success' => true,
        'checkout_url' => $checkoutSession['url'],
        'session_id' => $checkoutSession['id']
    ]);

} catch (Exception $e) {
    error_log('Create checkout session error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create checkout session: ' . $e->getMessage()]);
}
?>
