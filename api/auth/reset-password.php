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
    
    if (!$input || !isset($input['token']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token and password are required']);
        exit();
    }

    $token = trim($input['token']);
    $password = trim($input['password']);
    
    if (empty($token) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Token and password cannot be empty']);
        exit();
    }

    // Validate password strength
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters long']);
        exit();
    }

    if (!preg_match('/[A-Z]/', $password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must contain at least one uppercase letter']);
        exit();
    }

    if (!preg_match('/[a-z]/', $password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must contain at least one lowercase letter']);
        exit();
    }

    if (!preg_match('/[0-9]/', $password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must contain at least one number']);
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

    // Hash the new password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Update password and clear reset token
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL 
        WHERE id = ?
    ");
    $stmt->execute([$passwordHash, $user['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully'
    ]);

} catch (PDOException $e) {
    error_log("Database error in reset-password: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
} catch (Exception $e) {
    error_log("General error in reset-password: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
