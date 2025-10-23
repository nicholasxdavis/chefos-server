<?php
// Recipes API Endpoint

use ChefOS\Database\Database;
use ChefOS\Storage\NextcloudService;

try {
    $pdo = Database::getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get all recipes for user (for now, return all - you can add user filtering later)
            $stmt = $pdo->prepare("
                SELECT r.*, 
                       GROUP_CONCAT(ri.ingredient_data) as ingredients
                FROM recipes r 
                LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id 
                GROUP BY r.id 
                ORDER BY r.created_at DESC
            ");
            $stmt->execute();
            $recipes = $stmt->fetchAll();
            
            // Parse ingredients JSON
            foreach ($recipes as &$recipe) {
                if ($recipe['ingredients']) {
                    $recipe['ingredients'] = array_map('json_decode', explode(',', $recipe['ingredients']));
                } else {
                    $recipe['ingredients'] = [];
                }
            }
            
            echo json_encode(['recipes' => $recipes]);
            break;
            
        case 'POST':
            // Create new recipe
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name']) || !isset($input['original_servings']) || !isset($input['target_servings'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, original_servings, and target_servings are required']);
                exit;
            }
            
            $recipeId = uniqid('recipe_');
            $userId = 1; // For now, use user ID 1 - you can get this from session/auth later
            
            // Handle image upload to Nextcloud if provided
            $imagePath = null;
            if (isset($input['image_data']) && !empty($input['image_data'])) {
                // Check if it's a large image that should go to Nextcloud
                $imageSize = strlen(base64_decode($input['image_data']));
                if ($imageSize > 100000) { // 100KB threshold
                    try {
                        require dirname(__DIR__, 2) . '/src/NextcloudService.php';
                        $nextcloud = new NextcloudService();
                        $imageContent = base64_decode($input['image_data']);
                        $imageFileName = $recipeId . '_' . time() . '.jpg';
                        $result = $nextcloud->uploadFile(null, 'recipes/' . $imageFileName, $imageContent);
                        $imagePath = $result['path'];
                        $input['image_data'] = null; // Clear base64 data
                    } catch (Exception $e) {
                        // If Nextcloud fails, keep as base64
                        error_log('Nextcloud upload failed: ' . $e->getMessage());
                    }
                }
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO recipes (id, user_id, name, original_servings, target_servings, yield_unit, instructions, image_data, image_path, type) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $recipeId,
                $userId,
                $input['name'],
                $input['original_servings'],
                $input['target_servings'],
                $input['yield_unit'] ?? null,
                $input['instructions'] ?? null,
                $input['image_data'] ?? null,
                $imagePath,
                $input['type'] ?? 'direct'
            ]);
            
            // Insert ingredients if provided
            if (isset($input['ingredients']) && is_array($input['ingredients'])) {
                $ingredientStmt = $pdo->prepare("INSERT INTO recipe_ingredients (recipe_id, ingredient_data) VALUES (?, ?)");
                foreach ($input['ingredients'] as $ingredient) {
                    $ingredientStmt->execute([$recipeId, json_encode($ingredient)]);
                }
            }
            
            echo json_encode(['success' => true, 'recipe_id' => $recipeId]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Recipe operation failed', 'message' => $e->getMessage()]);
}
?>
