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
    
    if (!$input || !isset($input['user_id']) || !isset($input['feature_type']) || !isset($input['action_type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id, feature_type, and action_type are required']);
        exit();
    }

    $userId = $input['user_id'];
    $featureType = $input['feature_type'];
    $actionType = $input['action_type'];
    $itemId = $input['item_id'] ?? null;
    
    // Validate feature type
    $validFeatureTypes = ['recipe', 'menu', 'calendar', 'shopping_list', 'store'];
    if (!in_array($featureType, $validFeatureTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid feature type']);
        exit();
    }
    
    // Validate action type
    $validActionTypes = ['create', 'update', 'delete', 'view'];
    if (!in_array($actionType, $validActionTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action type']);
        exit();
    }
    
    $pdo = Database::getConnection();
    $stripeService = new StripeService();

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit();
    }

    // Track usage
    $success = $stripeService->trackUsage($userId, $featureType, $actionType, $itemId);
    
    if ($success) {
        // Get updated usage limits
        $usageLimits = $stripeService->checkUsageLimits($userId, $featureType);
        
        echo json_encode([
            'success' => true,
            'message' => 'Usage tracked successfully',
            'usage_limits' => $usageLimits
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to track usage']);
    }

} catch (Exception $e) {
    error_log('Usage tracking error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to track usage: ' . $e->getMessage()]);
}
?>
