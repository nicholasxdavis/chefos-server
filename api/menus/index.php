<?php
// Menus API Endpoint

use ChefOS\Database\Database;
use ChefOS\Storage\NextcloudService;

try {
    $pdo = Database::getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get all menus
            $stmt = $pdo->prepare("
                SELECT m.*, 
                       GROUP_CONCAT(mr.recipe_id) as recipe_ids
                FROM menus m 
                LEFT JOIN menu_recipes mr ON m.id = mr.menu_id 
                GROUP BY m.id 
                ORDER BY m.created_at DESC
            ");
            $stmt->execute();
            $menus = $stmt->fetchAll();
            
            // Parse recipe IDs
            foreach ($menus as &$menu) {
                if ($menu['recipe_ids']) {
                    $menu['recipe_ids'] = explode(',', $menu['recipe_ids']);
                } else {
                    $menu['recipe_ids'] = [];
                }
            }
            
            echo json_encode(['menus' => $menus]);
            break;
            
        case 'POST':
            // Create new menu
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name is required']);
                exit;
            }
            
            $menuId = uniqid('menu_');
            $userId = 1; // For now, use user ID 1
            
            // Handle file upload to Nextcloud if provided
            $filePath = null;
            if (isset($input['file_data']) && !empty($input['file_data'])) {
                // Check if it's a large file that should go to Nextcloud
                $fileSize = strlen($input['file_data']);
                if ($fileSize > 50000) { // 50KB threshold for files
                    try {
                        require dirname(__DIR__, 2) . '/src/NextcloudService.php';
                        $nextcloud = new NextcloudService();
                        $fileName = $input['file_name'] ?? $menuId . '_' . time() . '.pdf';
                        $result = $nextcloud->uploadFile(null, 'menus/' . $fileName, $input['file_data']);
                        $filePath = $result['path'];
                        $input['file_data'] = null; // Clear file data
                    } catch (Exception $e) {
                        // If Nextcloud fails, keep as blob
                        error_log('Nextcloud upload failed: ' . $e->getMessage());
                    }
                }
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO menus (id, user_id, name, description, type, file_name, file_path, file_data) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $menuId,
                $userId,
                $input['name'],
                $input['description'] ?? null,
                $input['type'] ?? 'recipe',
                $input['file_name'] ?? null,
                $filePath,
                $input['file_data'] ?? null
            ]);
            
            // Insert recipe associations if provided
            if (isset($input['recipe_ids']) && is_array($input['recipe_ids'])) {
                $recipeStmt = $pdo->prepare("INSERT INTO menu_recipes (menu_id, recipe_id) VALUES (?, ?)");
                foreach ($input['recipe_ids'] as $recipeId) {
                    $recipeStmt->execute([$menuId, $recipeId]);
                }
            }
            
            echo json_encode(['success' => true, 'menu_id' => $menuId]);
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
