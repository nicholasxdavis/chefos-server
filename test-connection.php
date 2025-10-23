<?php
// Test Database Connection Script
// Run this from your browser to test the MariaDB connection

header('Content-Type: text/plain');

echo "ChefOS Database Connection Test\n";
echo "===============================\n\n";

try {
    // Load Composer autoloader
    require __DIR__ . '/vendor/autoload.php';
    
    // Load environment variables
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->safeLoad();
    
    use ChefOS\Database\Database;
    
    echo "🔌 Testing database connection...\n";
    
    $pdo = Database::getConnection();
    echo "✅ Database connection successful!\n\n";
    
    echo "📊 Testing database operations...\n";
    
    // Test creating a simple table
    $pdo->exec("CREATE TABLE IF NOT EXISTS test_table (id INT AUTO_INCREMENT PRIMARY KEY, test_data VARCHAR(255))");
    echo "✅ Test table created/verified\n";
    
    // Test inserting data
    $stmt = $pdo->prepare("INSERT INTO test_table (test_data) VALUES (?)");
    $stmt->execute(['ChefOS connection test']);
    echo "✅ Test data inserted\n";
    
    // Test reading data
    $stmt = $pdo->prepare("SELECT * FROM test_table ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $result = $stmt->fetch();
    echo "✅ Test data retrieved: " . $result['test_data'] . "\n";
    
    // Test deleting test data
    $stmt = $pdo->prepare("DELETE FROM test_table WHERE test_data = ?");
    $stmt->execute(['ChefOS connection test']);
    echo "✅ Test data cleaned up\n";
    
    echo "\n🎉 All database tests passed! Your MariaDB connection is working perfectly.\n";
    echo "You can now run init.php to set up your database tables.\n";
    
} catch (PDOException $e) {
    echo "\n❌ DATABASE CONNECTION ERROR:\n";
    echo "Code: " . $e->getCode() . "\n";
    echo "Message: " . $e->getMessage() . "\n\n";
    echo "Please check your MariaDB environment variables:\n";
    echo "- MARIADB_URL: " . (getenv('MARIADB_URL') ?: 'NOT SET') . "\n";
    echo "- MARIADB_DATABASE: " . (getenv('MARIADB_DATABASE') ?: 'NOT SET') . "\n";
    echo "- MARIADB_USER: " . (getenv('MARIADB_USER') ?: 'NOT SET') . "\n";
    echo "- MARIADB_PASSWORD: " . (getenv('MARIADB_PASSWORD') ? 'SET' : 'NOT SET') . "\n";
    
} catch (Exception $e) {
    echo "\n❌ GENERAL ERROR:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Please ensure you run 'composer install' first.\n";
}
?>
