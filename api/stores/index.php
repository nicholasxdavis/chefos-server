<?php
// Stores API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->prepare("SELECT * FROM stores ORDER BY created_at DESC");
            $stmt->execute();
            $stores = $stmt->fetchAll();
            echo json_encode(['stores' => $stores]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name is required']);
                exit;
            }
            
            $storeId = uniqid('store_');
            $userId = 1;
            
            $stmt = $pdo->prepare("
                INSERT INTO stores (id, user_id, name, address, phone, notes) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $storeId,
                $userId,
                $input['name'],
                $input['address'] ?? null,
                $input['phone'] ?? null,
                $input['notes'] ?? null
            ]);
            
            echo json_encode(['success' => true, 'store_id' => $storeId]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Store operation failed', 'message' => $e->getMessage()]);
}
?>
