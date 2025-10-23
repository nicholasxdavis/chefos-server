<?php
// API Router for ChefOS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set the base directory
$baseDir = dirname(__DIR__);

// Load Composer autoloader
require $baseDir . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable($baseDir);
$dotenv->safeLoad();

// Direct require for Database class to ensure it's loaded
require $baseDir . '/src/Database.php';

use ChefOS\Database\Database;

try {
    // Parse the request
    $requestUri = $_SERVER['REQUEST_URI'];
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    
    // Remove query string and get the path
    $path = parse_url($requestUri, PHP_URL_PATH);
    
    // Remove /api prefix
    $path = preg_replace('/^\/api/', '', $path);
    
    // Route the request
    $routes = [
        '/auth/login' => 'auth/login.php',
        '/auth/register' => 'auth/register.php',
        '/recipes' => 'recipes/index.php',
        '/menus' => 'menus/index.php',
        '/stores' => 'stores/index.php',
        '/shopping-list' => 'shopping/index.php',
        '/calendar' => 'calendar/index.php',
        '/custom-densities' => 'densities/index.php',
    ];
    
    // Handle exact route matches
    if (isset($routes[$path])) {
        $apiFile = $baseDir . '/api/' . $routes[$path];
        if (file_exists($apiFile)) {
            include $apiFile;
            exit;
        }
    }
    
    // Handle specific ID routes
    if (preg_match('/^\/recipes\/([^\/]+)$/', $path, $matches)) {
        include $baseDir . '/api/recipes/detail.php';
        exit;
    }
    
    if (preg_match('/^\/menus\/([^\/]+)$/', $path, $matches)) {
        include $baseDir . '/api/menus/detail.php';
        exit;
    }
    
    if (preg_match('/^\/stores\/([^\/]+)$/', $path, $matches)) {
        include $baseDir . '/api/stores/detail.php';
        exit;
    }
    
    if (preg_match('/^\/calendar\/([^\/]+)$/', $path, $matches)) {
        include $baseDir . '/api/calendar/detail.php';
        exit;
    }
    
    if (preg_match('/^\/custom-densities\/([^\/]+)$/', $path, $matches)) {
        include $baseDir . '/api/densities/detail.php';
        exit;
    }
    
    // No route found
    http_response_code(404);
    echo json_encode(['error' => 'Route not found']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}
?>
