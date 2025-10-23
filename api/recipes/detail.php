<?php
// Recipe Detail API Endpoint

use ChefOS\Database\Database;

try {
    $pdo = Database::getConnection();
    
    // Extract recipe ID from URL
    preg_match('/^\/recipes\/([^\/]+)$/', $_SERVER['REQUEST_URI'], $matches);
    $recipeId = $matches[1];
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get single recipe
            $stmt = $pdo->prepare("
                SELECT r.*, 
                       GROUP_CONCAT(ri.ingredient_data) as ingredients
                FROM recipes r 
                LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id 
                WHERE r.id = ?
                GROUP BY r.id
            ");
            $stmt->execute([$recipeId]);
            $recipe = $stmt->fetch();
            
            if (!$recipe) {
                http_response_code(404);
                echo json_encode(['error' => 'Recipe not found']);
                exit;
            }
            
            // Parse ingredients JSON
            if ($recipe['ingredients']) {
                $recipe['ingredients'] = array_map('json_decode', explode(',', $recipe['ingredients']));
            } else {
                $recipe['ingredients'] = [];
            }
            
            echo json_encode(['recipe' => $recipe]);
            break;
            
        case 'PUT':
            // Update recipe
            $input = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE recipes 
                SET name = ?, original_servings = ?, target_servings = ?, yield_unit = ?, 
                    instructions = ?, image_data = ?, type = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['name'] ?? null,
                $input['original_servings'] ?? null,
                $input['target_servings'] ?? null,
                $input['yield_unit'] ?? null,
                $input['instructions'] ?? null,
                $input['image_data'] ?? null,
                $input['type'] ?? 'direct',
                $recipeId
            ]);
            
            // Update ingredients if provided
            if (isset($input['ingredients']) && is_array($input['ingredients'])) {
                // Delete existing ingredients
                $deleteStmt = $pdo->prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?");
                $deleteStmt->execute([$recipeId]);
                
                // Insert new ingredients
                $ingredientStmt = $pdo->prepare("INSERT INTO recipe_ingredients (recipe_id, ingredient_data) VALUES (?, ?)");
                foreach ($input['ingredients'] as $ingredient) {
                    $ingredientStmt->execute([$recipeId, json_encode($ingredient)]);
                }
            }
            
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            // Delete recipe
            $stmt = $pdo->prepare("DELETE FROM recipes WHERE id = ?");
            $stmt->execute([$recipeId]);
            
            echo json_encode(['success' => true]);
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
