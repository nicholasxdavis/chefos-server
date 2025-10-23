<?php

namespace ChefOS\Services;

use Exception;
use ChefOS\Database\Database;

class StripeService {
    private $secretKey;
    private $publishableKey;
    private $priceId;
    private $webhookSecret;
    private $pdo;
    
    public function __construct() {
        $this->secretKey = getenv('STRIPE_SK');
        $this->publishableKey = getenv('STRIPE_PK');
        $this->priceId = getenv('STRIPE_PRICE_ID');
        $this->webhookSecret = getenv('STRIPE_WB');
        
        if (!$this->secretKey || !$this->publishableKey || !$this->priceId) {
            throw new Exception('Stripe configuration is incomplete. Please check environment variables.');
        }
        
        $this->pdo = Database::getConnection();
    }
    
    /**
     * Create a Stripe customer
     */
    public function createCustomer($email, $name = null) {
        $data = [
            'email' => $email,
            'metadata' => [
                'chefos_user' => 'true'
            ]
        ];
        
        if ($name) {
            $data['name'] = $name;
        }
        
        return $this->makeRequest('POST', 'customers', $data);
    }
    
    /**
     * Create a checkout session for subscription
     */
    public function createCheckoutSession($customerId, $successUrl, $cancelUrl) {
        $data = [
            'customer' => $customerId,
            'payment_method_types' => ['card'],
            'line_items' => [
                [
                    'price' => $this->priceId,
                    'quantity' => 1,
                ]
            ],
            'mode' => 'subscription',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'subscription_data' => [
                'metadata' => [
                    'chefos_subscription' => 'true'
                ]
            ]
        ];
        
        return $this->makeRequest('POST', 'checkout/sessions', $data);
    }
    
    /**
     * Create a billing portal session
     */
    public function createBillingPortalSession($customerId, $returnUrl) {
        $data = [
            'customer' => $customerId,
            'return_url' => $returnUrl
        ];
        
        return $this->makeRequest('POST', 'billing_portal/sessions', $data);
    }
    
    /**
     * Get customer details
     */
    public function getCustomer($customerId) {
        return $this->makeRequest('GET', "customers/{$customerId}");
    }
    
    /**
     * Get subscription details
     */
    public function getSubscription($subscriptionId) {
        return $this->makeRequest('GET', "subscriptions/{$subscriptionId}");
    }
    
    /**
     * Cancel subscription
     */
    public function cancelSubscription($subscriptionId) {
        return $this->makeRequest('POST', "subscriptions/{$subscriptionId}", [
            'cancel_at_period_end' => true
        ]);
    }
    
    /**
     * Update user subscription in database
     */
    public function updateUserSubscription($userId, $stripeCustomerId, $subscriptionId, $status, $currentPeriodEnd = null) {
        $stmt = $this->pdo->prepare("
            UPDATE users 
            SET stripe_customer_id = ?, 
                stripe_subscription_id = ?, 
                subscription_status = ?, 
                subscription_current_period_end = ?,
                plan = CASE 
                    WHEN ? IN ('active', 'trialing') THEN 'pro' 
                    ELSE 'trial' 
                END
            WHERE id = ?
        ");
        
        return $stmt->execute([
            $stripeCustomerId,
            $subscriptionId,
            $status,
            $currentPeriodEnd,
            $status,
            $userId
        ]);
    }
    
    /**
     * Get user subscription status
     */
    public function getUserSubscription($userId) {
        $stmt = $this->pdo->prepare("
            SELECT u.*, pl.* 
            FROM users u 
            LEFT JOIN plan_limits pl ON u.plan = pl.plan_type 
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    
    /**
     * Check if user has exceeded plan limits
     */
    public function checkUsageLimits($userId, $featureType) {
        $user = $this->getUserSubscription($userId);
        
        if (!$user || !$user['max_' . $featureType]) {
            return ['allowed' => true, 'current' => 0, 'limit' => 0];
        }
        
        $limitColumn = 'max_' . $featureType;
        $limit = $user[$limitColumn];
        
        // Get current usage count
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as count 
            FROM {$featureType}s 
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $current = $stmt->fetch()['count'];
        
        return [
            'allowed' => $current < $limit,
            'current' => $current,
            'limit' => $limit
        ];
    }
    
    /**
     * Track usage for billing
     */
    public function trackUsage($userId, $featureType, $actionType, $itemId = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO usage_tracking (user_id, feature_type, action_type, item_id, usage_date)
            VALUES (?, ?, ?, ?, CURDATE())
        ");
        
        return $stmt->execute([$userId, $featureType, $actionType, $itemId]);
    }
    
    /**
     * Get usage statistics for user
     */
    public function getUserUsage($userId, $days = 30) {
        $stmt = $this->pdo->prepare("
            SELECT 
                feature_type,
                action_type,
                COUNT(*) as count,
                usage_date
            FROM usage_tracking 
            WHERE user_id = ? AND usage_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY feature_type, action_type, usage_date
            ORDER BY usage_date DESC
        ");
        $stmt->execute([$userId, $days]);
        return $stmt->fetchAll();
    }
    
    /**
     * Add billing record
     */
    public function addBillingRecord($userId, $stripeInvoiceId, $stripePaymentIntentId, $amount, $currency, $status, $invoiceUrl = null, $paymentDate = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO billing_history 
            (user_id, stripe_invoice_id, stripe_payment_intent_id, amount, currency, status, invoice_url, payment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $userId,
            $stripeInvoiceId,
            $stripePaymentIntentId,
            $amount,
            $currency,
            $status,
            $invoiceUrl,
            $paymentDate
        ]);
    }
    
    /**
     * Get billing history for user
     */
    public function getBillingHistory($userId, $limit = 10) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM billing_history 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Make HTTP request to Stripe API
     */
    private function makeRequest($method, $endpoint, $data = null) {
        $url = "https://api.stripe.com/v1/{$endpoint}";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $this->secretKey . ':');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);
        
        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        } elseif ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("Stripe API error: " . $error);
        }
        
        $responseData = json_decode($response, true);
        
        if ($httpCode >= 400) {
            $errorMessage = isset($responseData['error']['message']) 
                ? $responseData['error']['message'] 
                : 'Unknown Stripe API error';
            throw new Exception("Stripe API error (HTTP {$httpCode}): " . $errorMessage);
        }
        
        return $responseData;
    }
    
    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature($payload, $signature) {
        $expectedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);
        $providedSignature = str_replace(['t=', 'v1='], '', $signature);
        
        return hash_equals($expectedSignature, $providedSignature);
    }
    
    /**
     * Get publishable key for frontend
     */
    public function getPublishableKey() {
        return $this->publishableKey;
    }
    
    /**
     * Get price ID
     */
    public function getPriceId() {
        return $this->priceId;
    }
}
