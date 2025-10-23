<?php

namespace ChefOS\Services;

use Exception;

class EmailService {
    public $serviceId;
    public $publicKey;
    private $privateKey;
    public $welcomeTemplateId;
    public $resetTemplateId;
    
    public function __construct() {
        $this->serviceId = 'service_v6ncinu';
        $this->publicKey = 'KtQ8yJqts4tZEYQCT';
        $this->privateKey = 'GHtURkj2Q_lreW4bXuO5u';
        $this->welcomeTemplateId = 'template_65za9pc';
        $this->resetTemplateId = 'template_pn4wg4j';
    }
    
    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail($email, $greeting = 'Welcome to ChefOS!', $message = 'Thank you for joining ChefOS. You can now start creating amazing recipes and managing your kitchen operations.', $actionUrl = null) {
        if (!$actionUrl) {
            $actionUrl = 'https://chefos.blacnova.net';
        }
        
        $templateParams = [
            'to_email' => $email,
            'email' => $email,
            'Greeting' => $greeting,
            'Message' => $message,
            'ActionURL' => $actionUrl
        ];
        
        return $this->sendEmail($this->welcomeTemplateId, $templateParams);
    }
    
    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($email, $userName, $resetUrl) {
        $templateParams = [
            'to_email' => $email,
            'email' => $email,
            'UserName' => $userName,
            'ResetURL' => $resetUrl
        ];
        
        return $this->sendEmail($this->resetTemplateId, $templateParams);
    }
    
    /**
     * Send email using EmailJS
     */
    private function sendEmail($templateId, $templateParams) {
        $url = 'https://api.emailjs.com/api/v1.0/email/send';
        
        $data = [
            'service_id' => $this->serviceId,
            'template_id' => $templateId,
            'user_id' => $this->publicKey,
            'template_params' => $templateParams,
            'accessToken' => $this->privateKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("EmailJS connection error: " . $error);
        }
        
        if ($httpCode !== 200) {
            $responseData = json_decode($response, true);
            $errorMessage = isset($responseData['message']) ? $responseData['message'] : 'Unknown error';
            $errorText = isset($responseData['text']) ? $responseData['text'] : $response;
            throw new Exception("EmailJS API error (HTTP $httpCode): " . $errorMessage . " - Response: " . $errorText);
        }
        
        return [
            'success' => true,
            'message' => 'Email sent successfully',
            'response' => $response
        ];
    }
    
    /**
     * Generate a secure random token for password reset
     */
    public function generateResetToken() {
        return bin2hex(random_bytes(32));
    }
    
    /**
     * Generate password reset URL
     */
    public function generateResetUrl($token) {
        return 'https://chefos.blacnova.net/reset-password.html?token=' . $token;
    }
}
