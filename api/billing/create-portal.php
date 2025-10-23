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
    $stmt = $pdo->prepare("SELECT id, stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user || !$user['stripe_customer_id']) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found or not a Stripe customer']);
        exit();
    }

    // Create billing portal session
    $returnUrl = 'https://chefos.blacnova.net/billing.html';
    $portalSession = $stripeService->createBillingPortalSession($user['stripe_customer_id'], $returnUrl);

    echo json_encode([
        'success' => true,
        'portal_url' => $portalSession['url']
    ]);

} catch (Exception $e) {
    error_log('Create billing portal error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create billing portal session: ' . $e->getMessage()]);
}
?>
