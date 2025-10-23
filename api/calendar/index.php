<?php
// Calendar API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $userId = 1; // For now, use user ID 1
            
            $stmt = $pdo->prepare("SELECT * FROM calendar_items WHERE user_id = ? ORDER BY date_key ASC");
            $stmt->execute([$userId]);
            $items = $stmt->fetchAll();
            
            echo json_encode(['calendar_items' => $items]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['date_key']) || !isset($input['item_type']) || !isset($input['item_name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'date_key, item_type, and item_name are required']);
                exit;
            }
            
            $userId = 1;
            
            $stmt = $pdo->prepare("
                INSERT INTO calendar_items (user_id, date_key, item_type, item_id, item_name, meal_time) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $userId,
                $input['date_key'],
                $input['item_type'],
                $input['item_id'] ?? null,
                $input['item_name'],
                $input['meal_time'] ?? null
            ]);
            
            $itemId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'item_id' => $itemId]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Calendar operation failed', 'message' => $e->getMessage()]);
}
?>
