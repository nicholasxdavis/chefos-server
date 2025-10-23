<?php
// Test Nextcloud Integration Script

header('Content-Type: text/plain');

echo "ChefOS Nextcloud Integration Test\n";
echo "=================================\n\n";

// Load Composer autoloader
require __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Direct require for NextcloudService
require __DIR__ . '/src/NextcloudService.php';

use ChefOS\Storage\NextcloudService;

try {
    
    echo "🔗 Testing Nextcloud connection...\n";
    echo "URL: " . getenv('NEXTCLOUD_URL') . "\n";
    echo "Username: " . getenv('NEXTCLOUD_USERNAME') . "\n";
    echo "Storage Driver: " . getenv('STORAGE_DRIVER') . "\n\n";
    
    if (getenv('STORAGE_DRIVER') !== 'nextcloud') {
        echo "⚠️  Storage driver is not set to 'nextcloud'. Current: " . getenv('STORAGE_DRIVER') . "\n";
        echo "Set STORAGE_DRIVER=nextcloud to enable Nextcloud integration.\n";
        exit;
    }
    
    $nextcloud = new NextcloudService();
    echo "✅ Nextcloud service initialized successfully!\n\n";
    
    echo "📁 Testing directory creation...\n";
    try {
        $nextcloud->createDirectory('test');
        echo "✅ Test directory created successfully.\n";
    } catch (Exception $e) {
        echo "⚠️  Directory creation failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n📄 Testing file upload...\n";
    try {
        $testContent = "ChefOS Test File - " . date('Y-m-d H:i:s');
        $result = $nextcloud->uploadFile(null, 'test/chefos-test.txt', $testContent);
        echo "✅ Test file uploaded successfully.\n";
        echo "Path: " . $result['path'] . "\n";
    } catch (Exception $e) {
        echo "❌ File upload failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n📋 Testing file listing...\n";
    try {
        $files = $nextcloud->listFiles('test');
        echo "✅ File listing successful. Found " . count($files) . " files:\n";
        foreach ($files as $file) {
            echo "  - " . $file['name'] . " (" . $file['size'] . " bytes)\n";
        }
    } catch (Exception $e) {
        echo "❌ File listing failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n🎉 Nextcloud integration test completed!\n";
    echo "Your ChefOS is ready to use Nextcloud for file storage.\n";
    
} catch (Exception $e) {
    echo "\n❌ NEXTCLOUD INTEGRATION ERROR:\n";
    echo "Message: " . $e->getMessage() . "\n\n";
    echo "Please check your Nextcloud environment variables:\n";
    echo "- NEXTCLOUD_URL: " . (getenv('NEXTCLOUD_URL') ?: 'NOT SET') . "\n";
    echo "- NEXTCLOUD_USERNAME: " . (getenv('NEXTCLOUD_USERNAME') ?: 'NOT SET') . "\n";
    echo "- NEXTCLOUD_PASSWORD: " . (getenv('NEXTCLOUD_PASSWORD') ? 'SET' : 'NOT SET') . "\n";
    echo "- STORAGE_DRIVER: " . (getenv('STORAGE_DRIVER') ?: 'NOT SET') . "\n";
}
?>
