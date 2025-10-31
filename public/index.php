<?php
/**
 * Main entry point for ChefOS
 * Routes API requests to api.php, serves index.html for everything else
 */

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Route API requests to api.php in parent directory
if (strpos($path, '/api/') === 0) {
    // Remove /api prefix and route to api.php
    $_SERVER['REQUEST_URI'] = substr($path, 4); // Remove /api
    require __DIR__ . '/../api.php';
    exit;
}

// Route init.php
if ($path === '/init.php') {
    require __DIR__ . '/../init.php';
    exit;
}

// Serve index.html for all other requests
if (file_exists(__DIR__ . '/index.html')) {
    readfile(__DIR__ . '/index.html');
    exit;
}

// 404 if index.html doesn't exist
http_response_code(404);
echo '404 - File not found';

