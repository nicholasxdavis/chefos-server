<?php
// Custom Density Detail API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    preg_match('/^\/custom-densities\/([^\/]+)$/', $_SERVER['REQUEST_URI'], $matches);
    $densityId = $matches[1];
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->prepare("SELECT * FROM custom_densities WHERE id = ?");
            $stmt->execute([$densityId]);
            $density = $stmt->fetch();
            
            if (!$density) {
                http_response_code(404);
                echo json_encode(['error' => 'Custom density not found']);
                exit;
            }
            
            echo json_encode(['custom_density' => $density]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE custom_densities 
                SET ingredient_name = ?, density = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['ingredient_name'] ?? null,
                $input['density'] ?? null,
                $densityId
            ]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM custom_densities WHERE id = ?");
            $stmt->execute([$densityId]);
            echo json_encode(['success' => true]);
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
