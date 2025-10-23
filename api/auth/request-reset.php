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
require __DIR__ . '/../../src/EmailService.php';

use ChefOS\Database\Database;
use ChefOS\Services\EmailService;

try {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email address is required']);
        exit();
    }

    $email = trim($input['email']);
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit();
    }

    $pdo = Database::getConnection();
    $emailService = new EmailService();

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Always return success to prevent email enumeration attacks
    $response = [
        'success' => true,
        'message' => 'If an account with that email exists, a password reset link has been sent.'
    ];

    if ($user) {
        // Generate reset token
        $resetToken = $emailService->generateResetToken();
        $resetTokenExpires = date('Y-m-d H:i:s', strtotime('+30 minutes'));

        // Save reset token to database
        $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?");
        $stmt->execute([$resetToken, $resetTokenExpires, $user['id']]);

        // Generate reset URL
        $resetUrl = $emailService->generateResetUrl($resetToken);

        // Send reset email
        try {
            $emailService->sendPasswordResetEmail($email, $user['email'], $resetUrl);
        } catch (Exception $e) {
            error_log("Failed to send password reset email: " . $e->getMessage());
            // Don't expose email sending errors to user
        }
    }

    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Database error in request-reset: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
} catch (Exception $e) {
    error_log("General error in request-reset: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
