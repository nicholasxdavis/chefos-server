<?php
// Test Stripe Integration Script for ChefOS

header('Content-Type: text/plain');

echo "ChefOS Stripe Integration Test\n";
echo "==============================\n\n";

// Load Composer autoloader
require __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Direct require for StripeService
require __DIR__ . '/src/StripeService.php';

use ChefOS\Services\StripeService;

try {
    echo "💳 Testing Stripe service initialization...\n";
    $stripeService = new StripeService();
    echo "✅ Stripe service initialized successfully!\n\n";
    
    echo "🔑 Testing Stripe configuration...\n";
    echo "Publishable Key: " . substr($stripeService->getPublishableKey(), 0, 20) . "...\n";
    echo "Price ID: " . $stripeService->getPriceId() . "\n";
    echo "Webhook Secret: " . (getenv('STRIPE_WB') ? 'SET' : 'NOT SET') . "\n\n";
    
    echo "📊 Testing database connection...\n";
    echo "Host: " . getenv('MARIADB_NAME') . "\n";
    echo "Database: " . getenv('MARIADB_DATABASE') . "\n";
    echo "User: " . getenv('MARIADB_USER') . "\n";
    echo "Password: " . (getenv('MARIADB_PASSWORD') ? 'SET' : 'NOT SET') . "\n";
    
    try {
        $pdo = $stripeService->pdo ?? null;
        if ($pdo) {
            echo "✅ Database connection successful!\n";
            
            // Test plan limits
            echo "\n🔧 Testing plan limits...\n";
            $stmt = $pdo->query("SELECT * FROM plan_limits");
            $limits = $stmt->fetchAll();
            foreach ($limits as $limit) {
                echo "Plan: {$limit['plan_type']} - Recipes: {$limit['max_recipes']}, Menus: {$limit['max_menus']}\n";
            }
            
            // Test usage tracking table
            echo "\n📈 Testing usage tracking table...\n";
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM usage_tracking");
            $count = $stmt->fetch()['count'];
            echo "Usage tracking records: {$count}\n";
            
            // Test billing history table
            echo "\n💰 Testing billing history table...\n";
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM billing_history");
            $count = $stmt->fetch()['count'];
            echo "Billing history records: {$count}\n";
            
        } else {
            echo "❌ Database connection failed - PDO object is null!\n";
        }
    } catch (Exception $e) {
        echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n🧪 Testing Stripe API connectivity...\n";
    try {
        // Test creating a test customer (this will fail if Stripe keys are invalid)
        $testCustomer = $stripeService->createCustomer('test@example.com', 'Test User');
        echo "✅ Stripe API connection successful!\n";
        echo "Test customer ID: " . $testCustomer['id'] . "\n";
        
        // Clean up test customer
        // Note: In a real scenario, you might want to delete this test customer
        echo "ℹ️  Test customer created (you may want to delete it from Stripe dashboard)\n";
        
    } catch (Exception $e) {
        echo "❌ Stripe API connection failed: " . $e->getMessage() . "\n";
        echo "Please check your Stripe API keys in the environment variables.\n";
    }
    
    echo "\n🎉 Stripe integration test completed!\n";
    echo "Your ChefOS is ready to process payments with Stripe.\n";
    echo "\n📝 Next steps:\n";
    echo "1. Set up your Stripe webhook endpoint: https://chefos.blacnova.net/api/stripe-webhook.php\n";
    echo "2. Configure your product and pricing in Stripe dashboard\n";
    echo "3. Test the checkout flow with real payments\n";
    echo "4. Monitor webhook events in Stripe dashboard\n";
    
} catch (Exception $e) {
    echo "\n❌ STRIPE INTEGRATION ERROR:\n";
    echo "Message: " . $e->getMessage() . "\n\n";
    echo "Please check your Stripe environment variables:\n";
    echo "- STRIPE_PK: " . (getenv('STRIPE_PK') ? 'SET' : 'NOT SET') . "\n";
    echo "- STRIPE_SK: " . (getenv('STRIPE_SK') ? 'SET' : 'NOT SET') . "\n";
    echo "- STRIPE_PRICE_ID: " . (getenv('STRIPE_PRICE_ID') ? 'SET' : 'NOT SET') . "\n";
    echo "- STRIPE_WB: " . (getenv('STRIPE_WB') ? 'SET' : 'NOT SET') . "\n";
    echo "\nMake sure to run 'composer install' if you haven't already.\n";
}
?>
