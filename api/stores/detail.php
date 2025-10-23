<?php
// Store Detail API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    preg_match('/^\/stores\/([^\/]+)$/', $_SERVER['REQUEST_URI'], $matches);
    $storeId = $matches[1];
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->prepare("SELECT * FROM stores WHERE id = ?");
            $stmt->execute([$storeId]);
            $store = $stmt->fetch();
            
            if (!$store) {
                http_response_code(404);
                echo json_encode(['error' => 'Store not found']);
                exit;
            }
            
            echo json_encode(['store' => $store]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE stores 
                SET name = ?, address = ?, phone = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['name'] ?? null,
                $input['address'] ?? null,
                $input['phone'] ?? null,
                $input['notes'] ?? null,
                $storeId
            ]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM stores WHERE id = ?");
            $stmt->execute([$storeId]);
            echo json_encode(['success' => true]);
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
