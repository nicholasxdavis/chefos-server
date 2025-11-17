<?php
/**
 * Configuration file for ChefOS Backend
 * Handles environment variables and database connections
 */

// Production environment detection
define('IS_PRODUCTION', getEnvVar('APP_ENV', 'development') === 'production' || 
                        getEnvVar('ENVIRONMENT', 'development') === 'production');

// Error reporting (production-safe)
if (IS_PRODUCTION) {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', sys_get_temp_dir() . '/php-errors.log');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Check if running from CLI
$isCli = php_sapi_name() === 'cli' || !isset($_SERVER['REQUEST_METHOD']);

// CORS headers (only for web requests)
if (!$isCli) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Get environment variables with fallbacks
function getEnvVar($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

// MariaDB Configuration
// Parse MARIADB_URL if it's a full connection string, otherwise use individual vars
$mariadbUrl = getEnvVar('MARIADB_URL', '');
if (!empty($mariadbUrl) && strpos($mariadbUrl, 'mysql://') === 0) {
    // Parse connection string: mysql://user:pass@host:port/database
    $parsed = parse_url($mariadbUrl);
    define('DB_HOST', $parsed['host'] ?? 'localhost');
    define('DB_PORT', $parsed['port'] ?? 3306);
    define('DB_NAME', ltrim($parsed['path'] ?? '', '/') ?: getEnvVar('MARIADB_DATABASE', getEnvVar('MARIADB_NAME', 'default')));
    define('DB_USER', $parsed['user'] ?? getEnvVar('MARIADB_USER', 'root'));
    define('DB_PASS', $parsed['pass'] ?? getEnvVar('MARIADB_PASSWORD', getEnvVar('MARIADB_ROOT_PASSWORD', '')));
} else {
    // Use individual environment variables
    $host = getEnvVar('MARIADB_URL', 'localhost');
    // If MARIADB_URL is just a hostname, use it; otherwise try to extract host from connection string
    if (strpos($host, '@') !== false) {
        // Has format user:pass@host:port
        $parts = explode('@', $host);
        $hostPart = $parts[1] ?? $host;
        $hostPort = explode(':', $hostPart);
        define('DB_HOST', $hostPort[0] ?? 'localhost');
        define('DB_PORT', isset($hostPort[1]) ? (int)$hostPort[1] : 3306);
    } else {
        // Check if host includes port
        $hostPort = explode(':', $host);
        define('DB_HOST', $hostPort[0] ?? 'localhost');
        define('DB_PORT', isset($hostPort[1]) ? (int)$hostPort[1] : 3306);
    }
    define('DB_NAME', getEnvVar('MARIADB_DATABASE', getEnvVar('MARIADB_NAME', 'default')));
    define('DB_USER', getEnvVar('MARIADB_USER', 'root'));
    define('DB_PASS', getEnvVar('MARIADB_PASSWORD', getEnvVar('MARIADB_ROOT_PASSWORD', '')));
}
define('DB_CHARSET', 'utf8mb4');

// Nextcloud Configuration
define('NEXTCLOUD_ENABLED', !empty(getEnvVar('NEXTCLOUD_URL')));
define('NEXTCLOUD_URL', getEnvVar('NEXTCLOUD_URL', ''));
define('NEXTCLOUD_USER', getEnvVar('NEXTCLOUD_USERNAME', getEnvVar('NEXT_USER', '')));
define('NEXTCLOUD_PASS', getEnvVar('NEXTCLOUD_PASSWORD', getEnvVar('NEXT_PASSWORD', '')));

// Stripe Configuration
define('STRIPE_PK', getEnvVar('STRIPE_PK', ''));
define('STRIPE_SK', getEnvVar('STRIPE_SK', getEnvVar('STRIPE_PK_SECRET', '')));
define('STRIPE_PRICE_ID', getEnvVar('STRIPE_PRICE_ID', ''));
define('STRIPE_WEBHOOK_SECRET', getEnvVar('STRIPE_WB', getEnvVar('STRIPE_WB_THIN', '')));
define('STRIPE_PRODUCT_ID', getEnvVar('STRIPE_PROD', ''));

// Database connection
function getDB() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $port = defined('DB_PORT') ? DB_PORT : 3306;
            $dsn = "mysql:host=" . DB_HOST . ";port=" . $port . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
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
// This function is non-blocking and will never throw exceptions
// Returns true if sync succeeded, false if failed, but failures won't break the app
function syncToNextcloud($userId, $dataType, $data) {
    // Validate Nextcloud is properly configured
    if (!NEXTCLOUD_ENABLED || empty(NEXTCLOUD_URL) || empty(NEXTCLOUD_USER) || empty(NEXTCLOUD_PASS)) {
        return false; // Silently fail if not configured
    }
    
    // Validate inputs
    if (empty($userId) || empty($dataType)) {
        return false;
    }
    
    try {
        $path = "/remote.php/dav/files/" . NEXTCLOUD_USER . "/chefos/{$userId}/{$dataType}.json";
        $url = rtrim(NEXTCLOUD_URL, '/') . $path;
        
        // Set up curl with proper timeouts and error handling
        $ch = curl_init($url);
        if ($ch === false) {
            error_log("Nextcloud sync error: Failed to initialize curl");
            return false;
        }
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'PUT',
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_USERPWD => NEXTCLOUD_USER . ':' . NEXTCLOUD_PASS,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
            ],
            CURLOPT_CONNECTTIMEOUT => 5, // 5 second connection timeout
            CURLOPT_TIMEOUT => 10, // 10 second total timeout
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_FAILONERROR => false, // Don't fail on HTTP error codes, we'll check manually
        ]);
        
        $response = curl_exec($ch);
        $httpCode = 0;
        $curlError = '';
        
        if ($response === false) {
            $curlError = curl_error($ch);
            error_log("Nextcloud sync error (curl): " . $curlError);
        } else {
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        }
        
        curl_close($ch);
        
        // If connection failed or timed out, silently fail
        if ($response === false || $curlError) {
            return false;
        }
        
        // Create directory if needed (404 means path doesn't exist)
        if ($httpCode === 404) {
            // Try to create directory structure
            $dirPath = "/remote.php/dav/files/" . NEXTCLOUD_USER . "/chefos/{$userId}/";
            $dirUrl = rtrim(NEXTCLOUD_URL, '/') . $dirPath;
            
            $ch = curl_init($dirUrl);
            if ($ch !== false) {
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CUSTOMREQUEST => 'MKCOL',
                    CURLOPT_USERPWD => NEXTCLOUD_USER . ':' . NEXTCLOUD_PASS,
                    CURLOPT_CONNECTTIMEOUT => 5,
                    CURLOPT_TIMEOUT => 10,
                    CURLOPT_SSL_VERIFYPEER => true,
                    CURLOPT_SSL_VERIFYHOST => 2,
                    CURLOPT_FAILONERROR => false,
                ]);
                
                curl_exec($ch);
                curl_close($ch);
            }
            
            // Retry the file upload
            $ch = curl_init($url);
            if ($ch !== false) {
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CUSTOMREQUEST => 'PUT',
                    CURLOPT_POSTFIELDS => json_encode($data),
                    CURLOPT_USERPWD => NEXTCLOUD_USER . ':' . NEXTCLOUD_PASS,
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/json',
                    ],
                    CURLOPT_CONNECTTIMEOUT => 5,
                    CURLOPT_TIMEOUT => 10,
                    CURLOPT_SSL_VERIFYPEER => true,
                    CURLOPT_SSL_VERIFYHOST => 2,
                    CURLOPT_FAILONERROR => false,
                ]);
                
                $response = curl_exec($ch);
                if ($response !== false) {
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                }
                curl_close($ch);
            }
        }
        
        // Success if HTTP code is 2xx
        $success = $httpCode >= 200 && $httpCode < 300;
        
        if (!$success && $httpCode > 0) {
            error_log("Nextcloud sync error: HTTP $httpCode for $dataType");
        }
        
        return $success;
        
    } catch (Exception $e) {
        // Log but don't throw - this is non-critical
        error_log("Nextcloud sync error (exception): " . $e->getMessage());
        return false;
    } catch (Error $e) {
        // Catch PHP 7+ errors too
        error_log("Nextcloud sync error (fatal): " . $e->getMessage());
        return false;
    }
}

