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

use ChefOS\Database\Database;

try {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['token'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Reset token is required']);
        exit();
    }

    $token = trim($input['token']);
    
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['error' => 'Reset token cannot be empty']);
        exit();
    }

    $pdo = Database::getConnection();

    // Check if token exists and is not expired
    $stmt = $pdo->prepare("
        SELECT id, email, reset_token_expires 
        FROM users 
        WHERE reset_token = ? AND reset_token_expires > NOW()
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        exit();
    }

    // Token is valid
    echo json_encode([
        'success' => true,
        'message' => 'Token is valid',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email']
        ]
    ]);

} catch (PDOException $e) {
    error_log("Database error in verify-reset-token: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
} catch (Exception $e) {
    error_log("General error in verify-reset-token: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
