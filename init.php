<?php
// init.php - Database Initialization Script for ChefOS

// Set the base directory (assuming this file is in the project root)
$baseDir = __DIR__;

// Load Composer autoloader
require $baseDir . '/vendor/autoload.php';

// Load environment variables (useful for local testing)
$dotenv = Dotenv\Dotenv::createImmutable($baseDir);
// Suppress warnings if .env file is missing, relying on Coolify env vars
$dotenv->safeLoad();

// Direct require for Database class to ensure it's loaded
require $baseDir . '/src/Database.php';

use ChefOS\Database\Database;

header('Content-Type: text/plain');

echo "ChefOS MariaDB Initialization Script\n";
echo "======================================\n\n";

try {
    echo "🔌 Testing database connection...\n";
    echo "Host: " . getenv('MARIADB_NAME') . "\n";
    echo "Database: " . getenv('MARIADB_DATABASE') . "\n";
    echo "User: " . getenv('MARIADB_USER') . "\n";
    echo "Password: " . (getenv('MARIADB_PASSWORD') ? 'SET' : 'NOT SET') . "\n\n";
    
    $pdo = Database::getConnection();
    echo "✅ Database connection established successfully.\n\n";
    
    // --- SQL Definitions ---
    $sql = [
        // 1. Users Table (for Authentication)
        'users' => "
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                plan ENUM('trial', 'pro') NOT NULL DEFAULT 'trial',
                plan_expiry DATETIME NULL,
                reset_token VARCHAR(255) NULL,
                reset_token_expires TIMESTAMP NULL,
                email_verified BOOLEAN DEFAULT FALSE,
                email_verification_token VARCHAR(255) NULL,
                stripe_customer_id VARCHAR(255) NULL,
                stripe_subscription_id VARCHAR(255) NULL,
                subscription_status ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing') NULL,
                subscription_current_period_end TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        ",
        
        // 2. Recipes Table
        'recipes' => "
            CREATE TABLE IF NOT EXISTS recipes (
                id VARCHAR(255) PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                original_servings DECIMAL(10, 2) NOT NULL,
                target_servings DECIMAL(10, 2) NOT NULL,
                yield_unit VARCHAR(50) NULL,
                instructions TEXT NULL,
                image_data TEXT NULL, -- Base64 data for small images, Nextcloud path for larger files
                image_path VARCHAR(500) NULL, -- Nextcloud file path for images
                type ENUM('direct', 'scaled') NOT NULL DEFAULT 'direct',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ",
        
        // 3. Menus Table
        'menus' => "
            CREATE TABLE IF NOT EXISTS menus (
                id VARCHAR(255) PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                type ENUM('recipe', 'file') NOT NULL DEFAULT 'recipe',
                file_name VARCHAR(255) NULL,
                file_path VARCHAR(500) NULL, -- Nextcloud file path for PDF files
                file_data LONGBLOB NULL, -- For small files only, use Nextcloud for larger files
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ",
        
        // 4. Menu Recipes Junction Table
        'menu_recipes' => "
            CREATE TABLE IF NOT EXISTS menu_recipes (
                menu_id VARCHAR(255) NOT NULL,
                recipe_id VARCHAR(255) NOT NULL,
                PRIMARY KEY (menu_id, recipe_id),
                FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
            );
        ",

        // 5. Recipe Ingredients Table (Store recipe ingredient details as JSON)
        'recipe_ingredients' => "
            CREATE TABLE IF NOT EXISTS recipe_ingredients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recipe_id VARCHAR(255) NOT NULL,
                ingredient_data JSON NOT NULL, -- Store parsed ingredient object (quantity, unit, name, rawQty, etc.)
                FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
            );
        ",
        
        // 6. Stores/Markets Table
        'stores' => "
            CREATE TABLE IF NOT EXISTS stores (
                id VARCHAR(255) PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(255) NULL,
                phone VARCHAR(50) NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ",

        // 7. Custom Densities Table (Calculator data)
        'custom_densities' => "
            CREATE TABLE IF NOT EXISTS custom_densities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                ingredient_name VARCHAR(255) UNIQUE NOT NULL,
                density DECIMAL(10, 4) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ",

        // 8. Calendar Items Table
        'calendar_items' => "
            CREATE TABLE IF NOT EXISTS calendar_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                date_key DATE NOT NULL,
                item_type ENUM('recipe', 'menu', 'note') NOT NULL,
                item_id VARCHAR(255) NULL, -- recipe_id, menu_id, or NULL for notes
                item_name VARCHAR(255) NOT NULL,
                meal_time VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ",

        // 9. Shopping Lists Table (Maintains one active list per user)
        'shopping_lists' => "
            CREATE TABLE IF NOT EXISTS shopping_lists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNIQUE NOT NULL,
                list_data JSON NOT NULL, -- Store the entire list structure (categories, items) as JSON
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ",

        // 10. Usage Tracking Table
        'usage_tracking' => "
            CREATE TABLE IF NOT EXISTS usage_tracking (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                feature_type ENUM('recipe', 'menu', 'calendar', 'shopping_list', 'store') NOT NULL,
                action_type ENUM('create', 'update', 'delete', 'view') NOT NULL,
                item_id VARCHAR(255) NULL,
                usage_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_date (user_id, usage_date),
                INDEX idx_user_feature (user_id, feature_type)
            );
        ",

        // 11. Billing History Table
        'billing_history' => "
            CREATE TABLE IF NOT EXISTS billing_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                stripe_invoice_id VARCHAR(255) NULL,
                stripe_payment_intent_id VARCHAR(255) NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'usd',
                status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL,
                invoice_url VARCHAR(500) NULL,
                payment_date TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ",

        // 12. Plan Limits Table
        'plan_limits' => "
            CREATE TABLE IF NOT EXISTS plan_limits (
                plan_type ENUM('trial', 'pro') PRIMARY KEY,
                max_recipes INT DEFAULT 50,
                max_menus INT DEFAULT 20,
                max_stores INT DEFAULT 10,
                max_calendar_items INT DEFAULT 100,
                max_shopping_lists INT DEFAULT 5,
                storage_limit_mb INT DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        "
    ];
    
    // --- Execute SQL ---
    foreach ($sql as $tableName => $query) {
        $pdo->exec($query);
        echo "✅ Table '$tableName' created or checked.\n";
    }
    
    echo "\n✨ Database initialization complete. Tables are ready. ✨\n";
    
    // Initialize plan limits
    echo "\n🔧 Initializing plan limits...\n";
    $planLimits = [
        'trial' => [
            'max_recipes' => 10,
            'max_menus' => 5,
            'max_stores' => 3,
            'max_calendar_items' => 50,
            'max_shopping_lists' => 2,
            'storage_limit_mb' => 50
        ],
        'pro' => [
            'max_recipes' => 1000,
            'max_menus' => 500,
            'max_stores' => 100,
            'max_calendar_items' => 5000,
            'max_shopping_lists' => 50,
            'storage_limit_mb' => 1000
        ]
    ];
    
    foreach ($planLimits as $planType => $limits) {
        $stmt = $pdo->prepare("
            INSERT INTO plan_limits (plan_type, max_recipes, max_menus, max_stores, max_calendar_items, max_shopping_lists, storage_limit_mb)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            max_recipes = VALUES(max_recipes),
            max_menus = VALUES(max_menus),
            max_stores = VALUES(max_stores),
            max_calendar_items = VALUES(max_calendar_items),
            max_shopping_lists = VALUES(max_shopping_lists),
            storage_limit_mb = VALUES(storage_limit_mb)
        ");
        $stmt->execute([
            $planType,
            $limits['max_recipes'],
            $limits['max_menus'],
            $limits['max_stores'],
            $limits['max_calendar_items'],
            $limits['max_shopping_lists'],
            $limits['storage_limit_mb']
        ]);
        echo "✅ Plan limits for '$planType' initialized.\n";
    }
    
    // Test Nextcloud connection if configured
    if (getenv('STORAGE_DRIVER') === 'nextcloud') {
        echo "\n🔗 Testing Nextcloud integration...\n";
        try {
            require $baseDir . '/src/NextcloudService.php';
            $nextcloud = new \ChefOS\Storage\NextcloudService();
            echo "✅ Nextcloud service initialized successfully.\n";
            echo "URL: " . getenv('NEXTCLOUD_URL') . "\n";
            echo "Username: " . getenv('NEXTCLOUD_USERNAME') . "\n";
            echo "Base Folder: " . (getenv('NEXTCLOUD_BASE_FOLDER') ?: '/ChefOS') . "\n";
        } catch (Exception $e) {
            echo "⚠️  Nextcloud integration warning: " . $e->getMessage() . "\n";
            echo "Files will be stored locally until Nextcloud is properly configured.\n";
        }
    }

} catch (PDOException $e) {
    echo "\n❌ FATAL DATABASE ERROR:\n";
    echo "Code: " . $e->getCode() . "\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Please ensure MariaDB/MySQL is running and environment variables (MARIADB_USER, MARIADB_PASSWORD, MARIADB_DATABASE, MARIADB_URL) are correctly set in Coolify.\n";
} catch (Exception $e) {
    echo "\n❌ GENERAL ERROR:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Please ensure you run 'composer install' locally and on Coolify.\n";
}