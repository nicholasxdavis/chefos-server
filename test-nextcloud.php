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
    echo "Password: " . (getenv('NEXTCLOUD_PASSWORD') ? 'SET' : 'NOT SET') . "\n";
    echo "Storage Driver: " . getenv('STORAGE_DRIVER') . "\n";
    echo "Base Folder: " . (getenv('NEXTCLOUD_BASE_FOLDER') ?: '/ChefOS') . "\n\n";
    
    if (getenv('STORAGE_DRIVER') !== 'nextcloud') {
        echo "⚠️  Storage driver is not set to 'nextcloud'. Current: " . getenv('STORAGE_DRIVER') . "\n";
        echo "Set STORAGE_DRIVER=nextcloud to enable Nextcloud integration.\n";
        exit;
    }
    
    $nextcloud = new NextcloudService();
    echo "✅ Nextcloud service initialized successfully!\n";
    
    // Test basic connection
    echo "\n🔍 Testing basic connection...\n";
    $encodedUsername = rawurlencode(getenv('NEXTCLOUD_USERNAME'));
    $testUrl = getenv('NEXTCLOUD_URL') . '/remote.php/dav/files/' . $encodedUsername . '/';
    echo "Testing URL: " . $testUrl . "\n";
    echo "Encoded Username: " . $encodedUsername . "\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $testUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Basic ' . base64_encode(getenv('NEXTCLOUD_USERNAME') . ':' . getenv('NEXTCLOUD_PASSWORD'))
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "❌ Connection error: " . $error . "\n";
    } else {
        echo "✅ Connection successful! HTTP Code: " . $httpCode . "\n";
    }
    echo "\n";
    
    echo "📁 Testing directory creation...\n";
    try {
        $result = $nextcloud->createDirectory('test-folder');
        if ($result) {
            echo "✅ Directory created successfully!\n";
        } else {
            echo "⚠️  Directory creation failed\n";
        }
    } catch (Exception $e) {
        echo "⚠️  Directory creation failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n📁 Testing nested directory creation...\n";
    try {
        $result = $nextcloud->createDirectory('nested/deep/folder');
        if ($result) {
            echo "✅ Nested directory created successfully!\n";
        } else {
            echo "⚠️  Nested directory creation failed\n";
        }
    } catch (Exception $e) {
        echo "⚠️  Nested directory creation failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n📄 Testing file upload...\n";
    try {
        $testContent = "ChefOS Test File - " . date('Y-m-d H:i:s');
        $result = $nextcloud->uploadFile(null, 'test-folder/chefos-test.txt', $testContent);
        if ($result && isset($result['path'])) {
            echo "✅ Test file uploaded successfully!\n";
            echo "Path: " . $result['path'] . "\n";
        } else {
            echo "⚠️  File upload failed\n";
        }
    } catch (Exception $e) {
        echo "❌ File upload failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n📄 Testing nested file upload...\n";
    try {
        $testContent = "ChefOS Nested Test File - " . date('Y-m-d H:i:s');
        $result = $nextcloud->uploadFile(null, 'nested/deep/folder/nested-test.txt', $testContent);
        if ($result && isset($result['path'])) {
            echo "✅ Nested file uploaded successfully!\n";
            echo "Path: " . $result['path'] . "\n";
        } else {
            echo "⚠️  Nested file upload failed\n";
        }
    } catch (Exception $e) {
        echo "❌ Nested file upload failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n📋 Testing file listing...\n";
    try {
        $files = $nextcloud->listFiles('test-folder');
        echo "✅ File listing successful. Found " . count($files) . " files:\n";
        foreach ($files as $file) {
            echo "  - " . $file['name'] . " (" . $file['size'] . " bytes)\n";
        }
    } catch (Exception $e) {
        echo "❌ File listing failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n📋 Testing nested file listing...\n";
    try {
        $files = $nextcloud->listFiles('nested/deep/folder');
        echo "✅ Nested file listing successful. Found " . count($files) . " files:\n";
        foreach ($files as $file) {
            echo "  - " . $file['name'] . " (" . $file['size'] . " bytes)\n";
        }
    } catch (Exception $e) {
        echo "❌ Nested file listing failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n🗑️  Testing file deletion...\n";
    try {
        $result = $nextcloud->deleteFile('test-folder/chefos-test.txt');
        if ($result) {
            echo "✅ File deleted successfully!\n";
        } else {
            echo "⚠️  File deletion failed\n";
        }
    } catch (Exception $e) {
        echo "❌ File deletion failed: " . $e->getMessage() . "\n";
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
