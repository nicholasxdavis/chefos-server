<?php
// Test EmailJS Integration Script

header('Content-Type: text/plain');

echo "ChefOS EmailJS Integration Test\n";
echo "===============================\n\n";

// Load Composer autoloader
require __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Direct require for EmailService
require __DIR__ . '/src/EmailService.php';

use ChefOS\Services\EmailService;

try {
    echo "📧 Testing EmailJS service initialization...\n";
    $emailService = new EmailService();
    echo "✅ EmailJS service initialized successfully!\n\n";
    
    // Test email addresses (replace with your test emails)
    $testEmail = 'test@example.com'; // Replace with your test email
    $testUserName = 'Test User';
    
    echo "🔑 Testing password reset token generation...\n";
    $resetToken = $emailService->generateResetToken();
    echo "✅ Reset token generated: " . substr($resetToken, 0, 8) . "...\n";
    
    echo "🔗 Testing reset URL generation...\n";
    $resetUrl = $emailService->generateResetUrl($resetToken);
    echo "✅ Reset URL generated: " . $resetUrl . "\n\n";
    
    echo "📤 Testing welcome email sending...\n";
    echo "Sending to: " . $testEmail . "\n";
    try {
        $result = $emailService->sendWelcomeEmail(
            $testEmail,
            'Welcome to ChefOS!',
            'Thank you for joining ChefOS. You can now start creating amazing recipes and managing your kitchen operations.',
            'https://chefos.blacnova.net'
        );
        echo "✅ Welcome email sent successfully!\n";
        echo "Response: " . json_encode($result) . "\n\n";
    } catch (Exception $e) {
        echo "❌ Welcome email failed: " . $e->getMessage() . "\n\n";
    }
    
    echo "📤 Testing password reset email sending...\n";
    echo "Sending to: " . $testEmail . "\n";
    try {
        $result = $emailService->sendPasswordResetEmail(
            $testEmail,
            $testUserName,
            $resetUrl
        );
        echo "✅ Password reset email sent successfully!\n";
        echo "Response: " . json_encode($result) . "\n\n";
    } catch (Exception $e) {
        echo "❌ Password reset email failed: " . $e->getMessage() . "\n\n";
    }
    
    echo "🎉 EmailJS integration test completed!\n";
    echo "Your ChefOS is ready to send emails via EmailJS.\n";
    echo "\n📝 Note: Replace 'test@example.com' with your actual test email address to receive test emails.\n";
    
} catch (Exception $e) {
    echo "\n❌ EMAIL INTEGRATION ERROR:\n";
    echo "Message: " . $e->getMessage() . "\n\n";
    echo "Please check your EmailJS configuration:\n";
    echo "- Service ID: service_v6ncinu\n";
    echo "- Public Key: KtQ8yJqts4tZEYQCT\n";
    echo "- Welcome Template: template_65za9pc\n";
    echo "- Reset Template: template_pn4wg4j\n";
}
?>
