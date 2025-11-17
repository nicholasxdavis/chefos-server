<?php
/**
 * Database Initialization Script for ChefOS
 * Creates all tables if they don't exist
 * 
 * SECURITY: To drop and recreate tables, add ?force=1&confirm=yes to the URL
 * This prevents accidental data loss in production
 */

require_once __DIR__ . '/config.php';

// Production safety check (only for web requests)
$forceRecreate = false;
if (php_sapi_name() !== 'cli' && isset($_GET['force']) && $_GET['force'] == '1' && 
    isset($_GET['confirm']) && $_GET['confirm'] === 'yes') {
    $forceRecreate = true;
}
// For CLI, allow force recreate via command line argument
if (php_sapi_name() === 'cli' && isset($argv[1]) && $argv[1] === '--force') {
    $forceRecreate = true;
}

try {
    $pdo = getDB();
    
    // Note: DDL statements (CREATE TABLE, DROP TABLE) auto-commit in MySQL/MariaDB
    // So we don't strictly need transactions, but we'll use them for consistency
    // Start transaction (will be auto-committed by DDL statements, but that's OK)
    try {
        $pdo->beginTransaction();
    } catch (PDOException $e) {
        // If transaction fails to start, continue anyway (DDL will work)
        // This can happen if we're already in a transaction or DDL auto-committed
    }
    
    // Only drop tables if explicitly forced (for development/testing)
    if ($forceRecreate) {
        // Drop existing tables if they exist (in reverse order of dependencies)
        $tables = [
            'user_data',
            'recipes',
            'menus',
            'shopping_lists',
            'stores',
            'pdfs',
            'settings',
            'users'
        ];
        
        foreach ($tables as $table) {
            $pdo->exec("DROP TABLE IF EXISTS `{$table}`");
        }
    }
    
    // Create users table (always stored, regardless of cloud setting)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `email` VARCHAR(255) UNIQUE NOT NULL,
        `password_hash` VARCHAR(255) NOT NULL,
        `plan` ENUM('trial', 'pro', 'free') DEFAULT 'trial',
        `plan_expiry` DATETIME NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_email` (`email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Create settings table (always stored for auth-related settings)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `setting_key` VARCHAR(100) NOT NULL,
        `setting_value` TEXT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `user_setting` (`user_id`, `setting_key`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Create recipes table (only if cloud enabled)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `recipes` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `recipe_id` VARCHAR(255) NOT NULL,
        `data` JSON NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `user_recipe` (`user_id`, `recipe_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Create menus table (only if cloud enabled)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `menus` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `menu_id` VARCHAR(255) NOT NULL,
        `data` JSON NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `user_menu` (`user_id`, `menu_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Create shopping_lists table (only if cloud enabled)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `shopping_lists` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `data` JSON NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `user_shopping` (`user_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Create stores table (only if cloud enabled)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `stores` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `store_id` VARCHAR(255) NOT NULL,
        `data` JSON NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `user_store` (`user_id`, `store_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Create pdfs table (only if cloud enabled)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `pdfs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `pdf_id` VARCHAR(255) NOT NULL,
        `data` JSON NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `user_pdf` (`user_id`, `pdf_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Create user_data table for other data types (only if cloud enabled)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `user_data` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `data_type` VARCHAR(50) NOT NULL,
        `data_key` VARCHAR(255) NOT NULL,
        `data` JSON NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `user_data_type_key` (`user_id`, `data_type`, `data_key`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX `idx_user_id` (`user_id`),
        INDEX `idx_data_type` (`data_type`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Commit transaction only if we're still in one
    if ($pdo->inTransaction()) {
        $pdo->commit();
    }
    
    $message = $forceRecreate 
        ? 'Database reinitialized successfully (tables were dropped and recreated)'
        : 'Database initialized successfully (existing tables preserved)';
    
    $output = [
        'success' => true,
        'message' => $message,
        'force_recreate' => $forceRecreate
    ];
    
    // Output JSON (or plain text if running from CLI)
    if (php_sapi_name() === 'cli') {
        echo json_encode($output, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo json_encode($output);
    }
    
} catch (PDOException $e) {
    // Rollback only if we're in a transaction
    if (isset($pdo) && $pdo->inTransaction()) {
        try {
            $pdo->rollBack();
        } catch (PDOException $rollbackError) {
            // Ignore rollback errors
        }
    }
    
    $errorOutput = [
        'success' => false,
        'error' => 'Database initialization failed: ' . $e->getMessage()
    ];
    
    // Output error (or plain text if running from CLI)
    if (php_sapi_name() === 'cli') {
        echo json_encode($errorOutput, JSON_PRETTY_PRINT) . "\n";
    } else {
        http_response_code(500);
        echo json_encode($errorOutput);
    }
} catch (Exception $e) {
    // Handle any other exceptions
    $errorOutput = [
        'success' => false,
        'error' => 'Initialization failed: ' . $e->getMessage()
    ];
    
    if (php_sapi_name() === 'cli') {
        echo json_encode($errorOutput, JSON_PRETTY_PRINT) . "\n";
    } else {
        http_response_code(500);
        echo json_encode($errorOutput);
    }
}

