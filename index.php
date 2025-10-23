<?php
// index.php - ChefOS Main Application Entry Point

// Set the base directory (assuming this file is in the project root)
$baseDir = __DIR__;
$requestUri = strtok($_SERVER['REQUEST_URI'], '?');

// --- STEP 1: Static Asset Handling (Robust Version) ---
// Check if the requested URI looks like a static file.
$staticFilePattern = '/\.(css|js|png|ico|jpg|jpeg|webp|svg|woff2|woff|ttf|eot)$/i';
if (preg_match($staticFilePattern, $requestUri)) {
    
    $staticFilePath = $baseDir . $requestUri;

    if (file_exists($staticFilePath)) {
        // Map common extensions to MIME types
        $extension = pathinfo($staticFilePath, PATHINFO_EXTENSION);
        $mimeMap = [
            'css' => 'text/css',
            'js' => 'text/javascript',
            'png' => 'image/png',
            'ico' => 'image/x-icon',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject'
        ];
        
        $mimeType = $mimeMap[strtolower($extension)] ?? 'application/octet-stream';
        
        // Serve the file directly
        header("Content-Type: $mimeType");
        header('Content-Length: ' . filesize($staticFilePath));
        header('Cache-Control: public, max-age=31536000'); // Cache static assets
        readfile($staticFilePath);
        exit;
    } else {
        // Static file not found - fall through to SPA
        // Don't return 404 here, let SPA handle routing
    }
}

// --- STEP 2: API Route Handling ---
// Check if this is an API request
if (strpos($requestUri, '/api/') === 0) {
    // Load Composer autoloader
    if (file_exists($baseDir . '/vendor/autoload.php')) {
        require $baseDir . '/vendor/autoload.php';
        
        // Load environment variables
        if (class_exists('Dotenv\Dotenv')) {
            try {
                $dotenv = Dotenv\Dotenv::createImmutable($baseDir);
                $dotenv->safeLoad();
            } catch (Exception $e) {
                // Ignore dotenv errors in production
            }
        }
    }
    
    // Handle API request
    include $baseDir . '/api/index.php';
    exit;
}

// --- STEP 3: SPA Entry Point (Fallback for all non-static requests) ---

// Load Composer autoloader if it exists (optional for basic deployment)
if (file_exists($baseDir . '/vendor/autoload.php')) {
    require $baseDir . '/vendor/autoload.php';
    
    // Load environment variables if Dotenv is available
    if (class_exists('Dotenv\Dotenv')) {
        try {
            $dotenv = Dotenv\Dotenv::createImmutable($baseDir);
            $dotenv->safeLoad();
        } catch (Exception $e) {
            // Ignore dotenv errors in production
        }
    }
}

// Serve the main application index.html for all non-static requests
$appFilePath = $baseDir . '/index.html';

if (file_exists($appFilePath)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate'); // Don't cache the main HTML
    readfile($appFilePath);
    exit;
} else {
    // Fatal error if index.html is missing
    http_response_code(500);
    echo "<h1>Error 500: Internal Server Error</h1>";
    echo "<p>The main application file (index.html) could not be found.</p>";
    exit;
}