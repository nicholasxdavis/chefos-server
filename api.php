<?php
/**
 * ChefOS API Endpoint
 * Handles all backend operations
 */

require_once __DIR__ . '/config.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if ($input === null && $_SERVER['CONTENT_LENGTH'] > 0) {
    $input = [];
}

// Route handling
try {
    $action = $pathParts[1] ?? 'index';
    $endpoint = $pathParts[2] ?? '';
    
    switch ($action) {
        case 'auth':
            handleAuth($method, $endpoint, $input);
            break;
            
        case 'user':
            handleUser($method, $endpoint, $input);
            break;
            
        case 'data':
            handleData($method, $endpoint, $input);
            break;
            
        case 'sync':
            handleSync($method, $endpoint, $input);
            break;
            
        default:
            jsonResponse(['error' => 'Invalid endpoint'], 404);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    jsonResponse(['error' => $e->getMessage()], 500);
}

// Authentication handlers
function handleAuth($method, $endpoint, $input) {
    $pdo = getDB();
    
    switch ($endpoint) {
        case 'register':
            if ($method !== 'POST') {
                jsonResponse(['error' => 'Method not allowed'], 405);
            }
            
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $plan = $input['plan'] ?? 'trial';
            
            if (empty($email) || empty($password)) {
                jsonResponse(['error' => 'Email and password required'], 400);
            }
            
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                jsonResponse(['error' => 'User already exists'], 409);
            }
            
            // Create user
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $planExpiry = $plan === 'trial' ? date('Y-m-d H:i:s', strtotime('+7 days')) : null;
            
            $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, plan, plan_expiry) VALUES (?, ?, ?, ?)");
            $stmt->execute([$email, $passwordHash, $plan, $planExpiry]);
            
            $userId = $pdo->lastInsertId();
            
            jsonResponse([
                'success' => true,
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'plan' => $plan,
                    'plan_expiry' => $planExpiry
                ]
            ]);
            break;
            
        case 'login':
            if ($method !== 'POST') {
                jsonResponse(['error' => 'Method not allowed'], 405);
            }
            
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            
            if (empty($email) || empty($password)) {
                jsonResponse(['error' => 'Email and password required'], 400);
            }
            
            // Get user
            $stmt = $pdo->prepare("SELECT id, email, password_hash, plan, plan_expiry FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($password, $user['password_hash'])) {
                jsonResponse(['error' => 'Invalid credentials'], 401);
            }
            
            // Check trial expiry
            if ($user['plan'] === 'trial' && $user['plan_expiry']) {
                $expiry = new DateTime($user['plan_expiry']);
                if ($expiry < new DateTime()) {
                    jsonResponse(['error' => 'Trial expired'], 403);
                }
            }
            
            jsonResponse([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'plan' => $user['plan'],
                    'plan_expiry' => $user['plan_expiry']
                ]
            ]);
            break;
            
        default:
            jsonResponse(['error' => 'Invalid auth endpoint'], 404);
    }
}

// User handlers
function handleUser($method, $endpoint, $input) {
    $pdo = getDB();
    $email = $input['email'] ?? '';
    validateAuth($email);
    
    // Get user ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        jsonResponse(['error' => 'User not found'], 404);
    }
    $userId = $user['id'];
    
    switch ($endpoint) {
        case 'plan':
            if ($method === 'GET') {
                $stmt = $pdo->prepare("SELECT plan, plan_expiry FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $plan = $stmt->fetch();
                jsonResponse(['success' => true, 'plan' => $plan]);
            } elseif ($method === 'PUT') {
                $plan = $input['plan'] ?? '';
                $planExpiry = $input['plan_expiry'] ?? null;
                
                $stmt = $pdo->prepare("UPDATE users SET plan = ?, plan_expiry = ? WHERE id = ?");
                $stmt->execute([$plan, $planExpiry, $userId]);
                
                jsonResponse(['success' => true]);
            }
            break;
            
        case 'settings':
            if ($method === 'GET') {
                $key = $_GET['key'] ?? null;
                if ($key) {
                    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = ?");
                    $stmt->execute([$userId, $key]);
                    $setting = $stmt->fetch();
                    jsonResponse(['success' => true, 'value' => $setting ? json_decode($setting['setting_value'], true) : null]);
                } else {
                    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    $settings = [];
                    while ($row = $stmt->fetch()) {
                        $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
                    }
                    jsonResponse(['success' => true, 'settings' => $settings]);
                }
            } elseif ($method === 'POST' || $method === 'PUT') {
                $key = $input['key'] ?? '';
                $value = $input['value'] ?? null;
                
                if (empty($key)) {
                    jsonResponse(['error' => 'Setting key required'], 400);
                }
                
                $stmt = $pdo->prepare("INSERT INTO settings (user_id, setting_key, setting_value) 
                                     VALUES (?, ?, ?) 
                                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
                $stmt->execute([$userId, $key, json_encode($value)]);
                
                jsonResponse(['success' => true]);
            }
            break;
            
        case 'cloud-enabled':
            // Check if cloud storage is enabled for this user
            $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = 'chefos_storage_location'");
            $stmt->execute([$userId]);
            $setting = $stmt->fetch();
            $cloudEnabled = $setting && json_decode($setting['setting_value'], true) === 'cloud';
            jsonResponse(['success' => true, 'cloud_enabled' => $cloudEnabled]);
            break;
            
        default:
            jsonResponse(['error' => 'Invalid user endpoint'], 404);
    }
}

// Data handlers (only sync if cloud enabled)
function handleData($method, $endpoint, $input) {
    $pdo = getDB();
    $email = $input['email'] ?? '';
    validateAuth($email);
    
    // Get user ID and check cloud status
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        jsonResponse(['error' => 'User not found'], 404);
    }
    $userId = $user['id'];
    
    // Check if cloud is enabled
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = 'chefos_storage_location'");
    $stmt->execute([$userId]);
    $setting = $stmt->fetch();
    $cloudEnabled = $setting && json_decode($setting['setting_value'], true) === 'cloud';
    
    if (!$cloudEnabled) {
        jsonResponse(['error' => 'Cloud storage not enabled'], 403);
    }
    
    switch ($endpoint) {
        case 'recipes':
            if ($method === 'GET') {
                $stmt = $pdo->prepare("SELECT recipe_id, data FROM recipes WHERE user_id = ?");
                $stmt->execute([$userId]);
                $recipes = [];
                while ($row = $stmt->fetch()) {
                    $recipes[$row['recipe_id']] = json_decode($row['data'], true);
                }
                jsonResponse(['success' => true, 'recipes' => $recipes]);
            } elseif ($method === 'POST' || $method === 'PUT') {
                $recipeId = $input['recipe_id'] ?? '';
                $data = $input['data'] ?? [];
                
                if (empty($recipeId)) {
                    jsonResponse(['error' => 'Recipe ID required'], 400);
                }
                
                $stmt = $pdo->prepare("INSERT INTO recipes (user_id, recipe_id, data) 
                                     VALUES (?, ?, ?) 
                                     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP");
                $stmt->execute([$userId, $recipeId, json_encode($data)]);
                
                // Sync to Nextcloud
                if (NEXTCLOUD_ENABLED) {
                    $recipes = [];
                    $stmt = $pdo->prepare("SELECT recipe_id, data FROM recipes WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $recipes[$row['recipe_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'recipes', $recipes);
                }
                
                jsonResponse(['success' => true]);
            } elseif ($method === 'DELETE') {
                $recipeId = $input['recipe_id'] ?? '';
                if (empty($recipeId)) {
                    jsonResponse(['error' => 'Recipe ID required'], 400);
                }
                
                $stmt = $pdo->prepare("DELETE FROM recipes WHERE user_id = ? AND recipe_id = ?");
                $stmt->execute([$userId, $recipeId]);
                
                // Sync to Nextcloud
                if (NEXTCLOUD_ENABLED) {
                    $recipes = [];
                    $stmt = $pdo->prepare("SELECT recipe_id, data FROM recipes WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $recipes[$row['recipe_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'recipes', $recipes);
                }
                
                jsonResponse(['success' => true]);
            }
            break;
            
        case 'menus':
            if ($method === 'GET') {
                $stmt = $pdo->prepare("SELECT menu_id, data FROM menus WHERE user_id = ?");
                $stmt->execute([$userId]);
                $menus = [];
                while ($row = $stmt->fetch()) {
                    $menus[$row['menu_id']] = json_decode($row['data'], true);
                }
                jsonResponse(['success' => true, 'menus' => $menus]);
            } elseif ($method === 'POST' || $method === 'PUT') {
                $menuId = $input['menu_id'] ?? '';
                $data = $input['data'] ?? [];
                
                if (empty($menuId)) {
                    jsonResponse(['error' => 'Menu ID required'], 400);
                }
                
                $stmt = $pdo->prepare("INSERT INTO menus (user_id, menu_id, data) 
                                     VALUES (?, ?, ?) 
                                     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP");
                $stmt->execute([$userId, $menuId, json_encode($data)]);
                
                if (NEXTCLOUD_ENABLED) {
                    $menus = [];
                    $stmt = $pdo->prepare("SELECT menu_id, data FROM menus WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $menus[$row['menu_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'menus', $menus);
                }
                
                jsonResponse(['success' => true]);
            } elseif ($method === 'DELETE') {
                $menuId = $input['menu_id'] ?? '';
                if (empty($menuId)) {
                    jsonResponse(['error' => 'Menu ID required'], 400);
                }
                
                $stmt = $pdo->prepare("DELETE FROM menus WHERE user_id = ? AND menu_id = ?");
                $stmt->execute([$userId, $menuId]);
                
                if (NEXTCLOUD_ENABLED) {
                    $menus = [];
                    $stmt = $pdo->prepare("SELECT menu_id, data FROM menus WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $menus[$row['menu_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'menus', $menus);
                }
                
                jsonResponse(['success' => true]);
            }
            break;
            
        case 'shopping':
            if ($method === 'GET') {
                $stmt = $pdo->prepare("SELECT data FROM shopping_lists WHERE user_id = ?");
                $stmt->execute([$userId]);
                $row = $stmt->fetch();
                jsonResponse(['success' => true, 'data' => $row ? json_decode($row['data'], true) : []]);
            } elseif ($method === 'POST' || $method === 'PUT') {
                $data = $input['data'] ?? [];
                
                $stmt = $pdo->prepare("INSERT INTO shopping_lists (user_id, data) 
                                     VALUES (?, ?) 
                                     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP");
                $stmt->execute([$userId, json_encode($data)]);
                
                if (NEXTCLOUD_ENABLED) {
                    syncToNextcloud($userId, 'shopping', $data);
                }
                
                jsonResponse(['success' => true]);
            }
            break;
            
        case 'stores':
            if ($method === 'GET') {
                $stmt = $pdo->prepare("SELECT store_id, data FROM stores WHERE user_id = ?");
                $stmt->execute([$userId]);
                $stores = [];
                while ($row = $stmt->fetch()) {
                    $stores[$row['store_id']] = json_decode($row['data'], true);
                }
                jsonResponse(['success' => true, 'stores' => $stores]);
            } elseif ($method === 'POST' || $method === 'PUT') {
                $storeId = $input['store_id'] ?? '';
                $data = $input['data'] ?? [];
                
                if (empty($storeId)) {
                    jsonResponse(['error' => 'Store ID required'], 400);
                }
                
                $stmt = $pdo->prepare("INSERT INTO stores (user_id, store_id, data) 
                                     VALUES (?, ?, ?) 
                                     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP");
                $stmt->execute([$userId, $storeId, json_encode($data)]);
                
                if (NEXTCLOUD_ENABLED) {
                    $stores = [];
                    $stmt = $pdo->prepare("SELECT store_id, data FROM stores WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $stores[$row['store_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'stores', $stores);
                }
                
                jsonResponse(['success' => true]);
            } elseif ($method === 'DELETE') {
                $storeId = $input['store_id'] ?? '';
                if (empty($storeId)) {
                    jsonResponse(['error' => 'Store ID required'], 400);
                }
                
                $stmt = $pdo->prepare("DELETE FROM stores WHERE user_id = ? AND store_id = ?");
                $stmt->execute([$userId, $storeId]);
                
                if (NEXTCLOUD_ENABLED) {
                    $stores = [];
                    $stmt = $pdo->prepare("SELECT store_id, data FROM stores WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $stores[$row['store_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'stores', $stores);
                }
                
                jsonResponse(['success' => true]);
            }
            break;
            
        case 'pdfs':
            if ($method === 'GET') {
                $stmt = $pdo->prepare("SELECT pdf_id, data FROM pdfs WHERE user_id = ?");
                $stmt->execute([$userId]);
                $pdfs = [];
                while ($row = $stmt->fetch()) {
                    $pdfs[$row['pdf_id']] = json_decode($row['data'], true);
                }
                jsonResponse(['success' => true, 'pdfs' => $pdfs]);
            } elseif ($method === 'POST' || $method === 'PUT') {
                $pdfId = $input['pdf_id'] ?? '';
                $data = $input['data'] ?? [];
                
                if (empty($pdfId)) {
                    jsonResponse(['error' => 'PDF ID required'], 400);
                }
                
                $stmt = $pdo->prepare("INSERT INTO pdfs (user_id, pdf_id, data) 
                                     VALUES (?, ?, ?) 
                                     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP");
                $stmt->execute([$userId, $pdfId, json_encode($data)]);
                
                if (NEXTCLOUD_ENABLED) {
                    $pdfs = [];
                    $stmt = $pdo->prepare("SELECT pdf_id, data FROM pdfs WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $pdfs[$row['pdf_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'pdfs', $pdfs);
                }
                
                jsonResponse(['success' => true]);
            } elseif ($method === 'DELETE') {
                $pdfId = $input['pdf_id'] ?? '';
                if (empty($pdfId)) {
                    jsonResponse(['error' => 'PDF ID required'], 400);
                }
                
                $stmt = $pdo->prepare("DELETE FROM pdfs WHERE user_id = ? AND pdf_id = ?");
                $stmt->execute([$userId, $pdfId]);
                
                if (NEXTCLOUD_ENABLED) {
                    $pdfs = [];
                    $stmt = $pdo->prepare("SELECT pdf_id, data FROM pdfs WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    while ($row = $stmt->fetch()) {
                        $pdfs[$row['pdf_id']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, 'pdfs', $pdfs);
                }
                
                jsonResponse(['success' => true]);
            }
            break;
            
        case 'custom':
            // Generic data storage for custom_densities, shopping_categories, etc.
            if ($method === 'GET') {
                $dataType = $input['data_type'] ?? '';
                if (empty($dataType)) {
                    jsonResponse(['error' => 'Data type required'], 400);
                }
                
                $stmt = $pdo->prepare("SELECT data_key, data FROM user_data WHERE user_id = ? AND data_type = ?");
                $stmt->execute([$userId, $dataType]);
                $data = [];
                while ($row = $stmt->fetch()) {
                    $data[$row['data_key']] = json_decode($row['data'], true);
                }
                jsonResponse(['success' => true, 'data' => $data]);
            } elseif ($method === 'POST' || $method === 'PUT') {
                $dataType = $input['data_type'] ?? '';
                $dataKey = $input['data_key'] ?? '';
                $data = $input['data'] ?? [];
                
                if (empty($dataType) || empty($dataKey)) {
                    jsonResponse(['error' => 'Data type and key required'], 400);
                }
                
                $stmt = $pdo->prepare("INSERT INTO user_data (user_id, data_type, data_key, data) 
                                     VALUES (?, ?, ?, ?) 
                                     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP");
                $stmt->execute([$userId, $dataType, $dataKey, json_encode($data)]);
                
                if (NEXTCLOUD_ENABLED) {
                    $allData = [];
                    $stmt = $pdo->prepare("SELECT data_key, data FROM user_data WHERE user_id = ? AND data_type = ?");
                    $stmt->execute([$userId, $dataType]);
                    while ($row = $stmt->fetch()) {
                        $allData[$row['data_key']] = json_decode($row['data'], true);
                    }
                    syncToNextcloud($userId, $dataType, $allData);
                }
                
                jsonResponse(['success' => true]);
            }
            break;
            
        default:
            jsonResponse(['error' => 'Invalid data endpoint'], 404);
    }
}

// Sync handler (get all data for user)
function handleSync($method, $endpoint, $input) {
    if ($method !== 'GET') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }
    
    $pdo = getDB();
    $email = $_GET['email'] ?? '';
    validateAuth($email);
    
    // Get user ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        jsonResponse(['error' => 'User not found'], 404);
    }
    $userId = $user['id'];
    
    // Check if cloud is enabled
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = 'chefos_storage_location'");
    $stmt->execute([$userId]);
    $setting = $stmt->fetch();
    $cloudEnabled = $setting && json_decode($setting['setting_value'], true) === 'cloud';
    
    $result = [
        'success' => true,
        'cloud_enabled' => $cloudEnabled,
        'user' => [
            'email' => $email,
            'id' => $userId
        ]
    ];
    
    if ($cloudEnabled) {
        // Get all recipes
        $stmt = $pdo->prepare("SELECT recipe_id, data FROM recipes WHERE user_id = ?");
        $stmt->execute([$userId]);
        $recipes = [];
        while ($row = $stmt->fetch()) {
            $recipes[$row['recipe_id']] = json_decode($row['data'], true);
        }
        $result['recipes'] = $recipes;
        
        // Get all menus
        $stmt = $pdo->prepare("SELECT menu_id, data FROM menus WHERE user_id = ?");
        $stmt->execute([$userId]);
        $menus = [];
        while ($row = $stmt->fetch()) {
            $menus[$row['menu_id']] = json_decode($row['data'], true);
        }
        $result['menus'] = $menus;
        
        // Get shopping list
        $stmt = $pdo->prepare("SELECT data FROM shopping_lists WHERE user_id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        $result['shopping'] = $row ? json_decode($row['data'], true) : [];
        
        // Get stores
        $stmt = $pdo->prepare("SELECT store_id, data FROM stores WHERE user_id = ?");
        $stmt->execute([$userId]);
        $stores = [];
        while ($row = $stmt->fetch()) {
            $stores[$row['store_id']] = json_decode($row['data'], true);
        }
        $result['stores'] = $stores;
        
        // Get PDFs
        $stmt = $pdo->prepare("SELECT pdf_id, data FROM pdfs WHERE user_id = ?");
        $stmt->execute([$userId]);
        $pdfs = [];
        while ($row = $stmt->fetch()) {
            $pdfs[$row['pdf_id']] = json_decode($row['data'], true);
        }
        $result['pdfs'] = $pdfs;
        
        // Get custom data
        $stmt = $pdo->prepare("SELECT data_type, data_key, data FROM user_data WHERE user_id = ?");
        $stmt->execute([$userId]);
        $customData = [];
        while ($row = $stmt->fetch()) {
            if (!isset($customData[$row['data_type']])) {
                $customData[$row['data_type']] = [];
            }
            $customData[$row['data_type']][$row['data_key']] = json_decode($row['data'], true);
        }
        $result['custom'] = $customData;
    }
    
    // Always get user plan and settings
    $stmt = $pdo->prepare("SELECT plan, plan_expiry FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $userInfo = $stmt->fetch();
    $result['user']['plan'] = $userInfo['plan'];
    $result['user']['plan_expiry'] = $userInfo['plan_expiry'];
    
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE user_id = ?");
    $stmt->execute([$userId]);
    $settings = [];
    while ($row = $stmt->fetch()) {
        $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
    }
    $result['settings'] = $settings;
    
    jsonResponse($result);
}

