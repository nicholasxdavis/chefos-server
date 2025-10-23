<?php
// Calendar Item Detail API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    preg_match('/^\/calendar\/([^\/]+)$/', $_SERVER['REQUEST_URI'], $matches);
    $itemId = $matches[1];
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->prepare("SELECT * FROM calendar_items WHERE id = ?");
            $stmt->execute([$itemId]);
            $item = $stmt->fetch();
            
            if (!$item) {
                http_response_code(404);
                echo json_encode(['error' => 'Calendar item not found']);
                exit;
            }
            
            echo json_encode(['calendar_item' => $item]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE calendar_items 
                SET date_key = ?, item_type = ?, item_id = ?, item_name = ?, meal_time = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['date_key'] ?? null,
                $input['item_type'] ?? null,
                $input['item_id'] ?? null,
                $input['item_name'] ?? null,
                $input['meal_time'] ?? null,
                $itemId
            ]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM calendar_items WHERE id = ?");
            $stmt->execute([$itemId]);
            echo json_encode(['success' => true]);
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
