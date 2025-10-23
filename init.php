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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
                image_data TEXT NULL, -- Base64 data for simplicity, consider object storage (Nextcloud) for production images
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
                file_data LONGBLOB NULL, -- For file-based menus (or store reference to Nextcloud)
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
        "
    ];
    
    // --- Execute SQL ---
    foreach ($sql as $tableName => $query) {
        $pdo->exec($query);
        echo "✅ Table '$tableName' created or checked.\n";
    }
    
    echo "\n✨ Database initialization complete. Tables are ready. ✨\n";

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