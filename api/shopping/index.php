<?php
// Shopping List API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get shopping list for user
            $userId = 1; // For now, use user ID 1
            
            $stmt = $pdo->prepare("SELECT * FROM shopping_lists WHERE user_id = ?");
            $stmt->execute([$userId]);
            $shoppingList = $stmt->fetch();
            
            if (!$shoppingList) {
                // Create empty shopping list if none exists
                $listData = json_encode(['categories' => [], 'items' => []]);
                $stmt = $pdo->prepare("INSERT INTO shopping_lists (user_id, list_data) VALUES (?, ?)");
                $stmt->execute([$userId, $listData]);
                
                $shoppingList = [
                    'id' => $pdo->lastInsertId(),
                    'user_id' => $userId,
                    'list_data' => $listData,
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }
            
            // Parse JSON data
            $shoppingList['list_data'] = json_decode($shoppingList['list_data'], true);
            
            echo json_encode(['shopping_list' => $shoppingList]);
            break;
            
        case 'PUT':
            // Update shopping list
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['list_data'])) {
                http_response_code(400);
                echo json_encode(['error' => 'list_data is required']);
                exit;
            }
            
            $userId = 1;
            $listData = json_encode($input['list_data']);
            
            // Update or insert shopping list
            $stmt = $pdo->prepare("
                INSERT INTO shopping_lists (user_id, list_data, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                list_data = VALUES(list_data), 
                updated_at = CURRENT_TIMESTAMP
            ");
            
            $stmt->execute([$userId, $listData]);
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Shopping list operation failed', 'message' => $e->getMessage()]);
}
?>
