<?php
/**
 * Configuration file for ChefOS Backend
 * Handles environment variables and database connections
 */

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get environment variables with fallbacks
function getEnvVar($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

// MariaDB Configuration
define('DB_HOST', getEnvVar('MARIADB_URL', 'localhost'));
define('DB_NAME', getEnvVar('MARIADB_DATABASE', getEnvVar('MARIADB_NAME', 'chefos')));
define('DB_USER', getEnvVar('MARIADB_USER', 'root'));
define('DB_PASS', getEnvVar('MARIADB_PASSWORD', getEnvVar('MARIADB_ROOT_PASSWORD', '')));
define('DB_CHARSET', 'utf8mb4');

// Nextcloud Configuration
define('NEXTCLOUD_ENABLED', !empty(getEnvVar('NEXTCLOUD_URL')));
define('NEXTCLOUD_URL', getEnvVar('NEXTCLOUD_URL', ''));
define('NEXTCLOUD_USER', getEnvVar('NEXTCLOUD_USERNAME', getEnvVar('NEXT_USER', '')));
define('NEXTCLOUD_PASS', getEnvVar('NEXTCLOUD_PASSWORD', getEnvVar('NEXT_PASSWORD', '')));

// Stripe Configuration (for future use)
define('STRIPE_PK', getEnvVar('STRIPE_PK', ''));
define('STRIPE_SK', getEnvVar('STRIPE_SK', getEnvVar('STRIPE_PK_SECRET', '')));
define('STRIPE_PRICE_ID', getEnvVar('STRIPE_PRICE_ID', ''));

// Database connection
function getDB() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit();
        }
    }
    
    return $pdo;
}

// Helper function to send JSON response
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Helper function to validate auth token/session
function validateAuth($email) {
    if (empty($email)) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    return $email;
}

// Nextcloud helper function (if enabled)
function syncToNextcloud($userId, $dataType, $data) {
    if (!NEXTCLOUD_ENABLED) {
        return true;
    }
    
    try {
        $path = "/remote.php/dav/files/" . NEXTCLOUD_USER . "/chefos/{$userId}/{$dataType}.json";
        $url = rtrim(NEXTCLOUD_URL, '/') . $path;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_USERPWD, NEXTCLOUD_USER . ':' . NEXTCLOUD_PASS);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Create directory if needed (404 means path doesn't exist)
        if ($httpCode === 404) {
            // Try to create directory structure
            $dirPath = "/remote.php/dav/files/" . NEXTCLOUD_USER . "/chefos/{$userId}/";
            $dirUrl = rtrim(NEXTCLOUD_URL, '/') . $dirPath;
            
            $ch = curl_init($dirUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'MKCOL');
            curl_setopt($ch, CURLOPT_USERPWD, NEXTCLOUD_USER . ':' . NEXTCLOUD_PASS);
            curl_exec($ch);
            curl_close($ch);
            
            // Retry the file upload
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_USERPWD, NEXTCLOUD_USER . ':' . NEXTCLOUD_PASS);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
            ]);
            curl_exec($ch);
            curl_close($ch);
        }
        
        return $httpCode >= 200 && $httpCode < 300;
    } catch (Exception $e) {
        error_log("Nextcloud sync error: " . $e->getMessage());
        return false;
    }
}

