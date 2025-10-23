<?php
// Menu Detail API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    // Extract menu ID from URL
    preg_match('/^\/menus\/([^\/]+)$/', $_SERVER['REQUEST_URI'], $matches);
    $menuId = $matches[1];
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get single menu
            $stmt = $pdo->prepare("
                SELECT m.*, 
                       GROUP_CONCAT(mr.recipe_id) as recipe_ids
                FROM menus m 
                LEFT JOIN menu_recipes mr ON m.id = mr.menu_id 
                WHERE m.id = ?
                GROUP BY m.id
            ");
            $stmt->execute([$menuId]);
            $menu = $stmt->fetch();
            
            if (!$menu) {
                http_response_code(404);
                echo json_encode(['error' => 'Menu not found']);
                exit;
            }
            
            // Parse recipe IDs
            if ($menu['recipe_ids']) {
                $menu['recipe_ids'] = explode(',', $menu['recipe_ids']);
            } else {
                $menu['recipe_ids'] = [];
            }
            
            echo json_encode(['menu' => $menu]);
            break;
            
        case 'PUT':
            // Update menu
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE menus 
                SET name = ?, description = ?, type = ?, file_name = ?, file_data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['name'] ?? null,
                $input['description'] ?? null,
                $input['type'] ?? 'recipe',
                $input['file_name'] ?? null,
                $input['file_data'] ?? null,
                $menuId
            ]);
            
            // Update recipe associations if provided
            if (isset($input['recipe_ids']) && is_array($input['recipe_ids'])) {
                // Delete existing associations
                $deleteStmt = $pdo->prepare("DELETE FROM menu_recipes WHERE menu_id = ?");
                $deleteStmt->execute([$menuId]);
                
                // Insert new associations
                $recipeStmt = $pdo->prepare("INSERT INTO menu_recipes (menu_id, recipe_id) VALUES (?, ?)");
                foreach ($input['recipe_ids'] as $recipeId) {
                    $recipeStmt->execute([$menuId, $recipeId]);
                }
            }
            
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            // Delete menu
            $stmt = $pdo->prepare("DELETE FROM menus WHERE id = ?");
            $stmt->execute([$menuId]);
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Menu operation failed', 'message' => $e->getMessage()]);
}
?>
