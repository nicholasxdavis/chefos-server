<?php
// Custom Densities API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $userId = 1; // For now, use user ID 1
            
            $stmt = $pdo->prepare("SELECT * FROM custom_densities WHERE user_id = ? ORDER BY ingredient_name ASC");
            $stmt->execute([$userId]);
            $densities = $stmt->fetchAll();
            
            echo json_encode(['custom_densities' => $densities]);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['ingredient_name']) || !isset($input['density'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ingredient_name and density are required']);
                exit;
            }
            
            $userId = 1;
            
            $stmt = $pdo->prepare("
                INSERT INTO custom_densities (user_id, ingredient_name, density) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE density = VALUES(density)
            ");
            
            $stmt->execute([
                $userId,
                $input['ingredient_name'],
                $input['density']
            ]);
            
            $densityId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'density_id' => $densityId]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Custom density operation failed', 'message' => $e->getMessage()]);
}
?>
