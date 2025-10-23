<?php
// Database Connection Test Script for ChefOS

header('Content-Type: text/plain');

echo "ChefOS Database Connection Test\n";
echo "===============================\n\n";

// Load Composer autoloader
require __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

try {
    echo "🔌 Testing database connection...\n";
    echo "Host: " . getenv('MARIADB_NAME') . "\n";
    echo "Database: " . getenv('MARIADB_DATABASE') . "\n";
    echo "User: " . getenv('MARIADB_USER') . "\n";
    echo "Password: " . (getenv('MARIADB_PASSWORD') ? 'SET' : 'NOT SET') . "\n\n";
    
    $host = getenv('MARIADB_NAME');
    $dbname = getenv('MARIADB_DATABASE');
    $user = getenv('MARIADB_USER');
    $password = getenv('MARIADB_PASSWORD');
    
    if (!$host || !$dbname || !$user || !$password) {
        throw new Exception('Database configuration incomplete. Missing environment variables.');
    }
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    echo "DSN: {$dsn}\n\n";
    
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    echo "✅ Database connection successful!\n\n";
    
    // Test basic queries
    echo "🧪 Testing basic queries...\n";
    
    // Test if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $usersTable = $stmt->fetch();
    if ($usersTable) {
        echo "✅ Users table exists\n";
        
        // Count users
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch()['count'];
        echo "Users count: {$count}\n";
    } else {
        echo "❌ Users table does not exist\n";
    }
    
    // Test if plan_limits table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'plan_limits'");
    $planLimitsTable = $stmt->fetch();
    if ($planLimitsTable) {
        echo "✅ Plan limits table exists\n";
        
        // Show plan limits
        $stmt = $pdo->query("SELECT * FROM plan_limits");
        $limits = $stmt->fetchAll();
        foreach ($limits as $limit) {
            echo "Plan: {$limit['plan_type']} - Recipes: {$limit['max_recipes']}, Menus: {$limit['max_menus']}\n";
        }
    } else {
        echo "❌ Plan limits table does not exist\n";
    }
    
    // Test if usage_tracking table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'usage_tracking'");
    $usageTable = $stmt->fetch();
    if ($usageTable) {
        echo "✅ Usage tracking table exists\n";
        
        // Count usage records
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM usage_tracking");
        $count = $stmt->fetch()['count'];
        echo "Usage tracking records: {$count}\n";
    } else {
        echo "❌ Usage tracking table does not exist\n";
    }
    
    // Test if billing_history table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'billing_history'");
    $billingTable = $stmt->fetch();
    if ($billingTable) {
        echo "✅ Billing history table exists\n";
        
        // Count billing records
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM billing_history");
        $count = $stmt->fetch()['count'];
        echo "Billing history records: {$count}\n";
    } else {
        echo "❌ Billing history table does not exist\n";
    }
    
    echo "\n🎉 Database connection test completed successfully!\n";
    echo "All required tables are present and accessible.\n";
    
} catch (PDOException $e) {
    echo "\n❌ DATABASE CONNECTION ERROR:\n";
    echo "Code: " . $e->getCode() . "\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "\nPlease check your MariaDB environment variables:\n";
    echo "- MARIADB_NAME: " . (getenv('MARIADB_NAME') ?: 'NOT SET') . "\n";
    echo "- MARIADB_DATABASE: " . (getenv('MARIADB_DATABASE') ?: 'NOT SET') . "\n";
    echo "- MARIADB_USER: " . (getenv('MARIADB_USER') ?: 'NOT SET') . "\n";
    echo "- MARIADB_PASSWORD: " . (getenv('MARIADB_PASSWORD') ? 'SET' : 'NOT SET') . "\n";
} catch (Exception $e) {
    echo "\n❌ GENERAL ERROR:\n";
    echo "Message: " . $e->getMessage() . "\n";
}
?>
