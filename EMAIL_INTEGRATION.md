# EmailJS Integration for ChefOS

This document describes the email integration setup for ChefOS using EmailJS for welcome emails and password reset functionality.

## 📧 EmailJS Configuration

### Service Details
- **Service ID**: `service_v6ncinu`
- **Public Key**: `KtQ8yJqts4tZEYQCT`
- **Private Key**: `GHtURkj2Q_lreW4bXuO5u`

### Email Templates
- **Welcome Email Template ID**: `template_65za9pc`
- **Password Reset Template ID**: `template_pn4wg4j`

## 🗄️ Database Schema Updates

The `users` table has been updated with the following new fields:

```sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

## 🚀 API Endpoints

### Password Reset Flow

#### 1. Request Password Reset
**Endpoint**: `POST /api/auth/request-reset`

**Request Body**:
```json
{
    "email": "user@example.com"
}
```

**Response**:
```json
{
    "success": true,
    "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### 2. Verify Reset Token
**Endpoint**: `POST /api/auth/verify-reset-token`

**Request Body**:
```json
{
    "token": "reset_token_here"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Token is valid",
    "user": {
        "id": 1,
        "email": "user@example.com"
    }
}
```

#### 3. Reset Password
**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
    "token": "reset_token_here",
    "password": "new_password_here"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Password reset successfully"
}
```

## 📄 Frontend Integration

### Password Reset Page
- **File**: `reset-password.html`
- **Features**:
  - Token validation
  - Password strength requirements
  - Real-time password validation
  - Responsive design

### JavaScript Integration
- **File**: `js/auth-integration.js`
- **Class**: `AuthIntegration`
- **Methods**:
  - `requestPasswordReset(email)`
  - `resetPassword(token, password)`
  - `verifyResetToken(token)`

## 🧪 Testing

### Test EmailJS Integration
Run the test script to verify email functionality:
```
https://chefos.blacnova.net/test-email.php
```

### Test Password Reset Flow
1. Visit the password reset page: `https://chefos.blacnova.net/reset-password.html`
2. Test with a valid reset token
3. Verify password validation works
4. Confirm password reset completes successfully

## 📧 Email Templates

### Welcome Email Template Variables
- `{{email}}` - Recipient email address
- `{{Greeting}}` - Welcome greeting
- `{{Message}}` - Welcome message
- `{{ActionURL}}` - Call-to-action URL

### Password Reset Email Template Variables
- `{{email}}` - Recipient email address
- `{{UserName}}` - User's name
- `{{ResetURL}}` - Password reset URL with token

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Token Security
- Reset tokens are cryptographically secure (32 random bytes)
- Tokens expire after 30 minutes
- Tokens are cleared after successful password reset
- Email enumeration protection (always returns success message)

### Rate Limiting
Consider implementing rate limiting for password reset requests to prevent abuse.

## 🛠️ Usage Examples

### Frontend JavaScript
```javascript
// Request password reset
const result = await window.ChefOSAuth.requestPasswordReset('user@example.com');
if (result.success) {
    alert('Password reset email sent!');
}

// Reset password
const resetResult = await window.ChefOSAuth.resetPassword(token, newPassword);
if (resetResult.success) {
    // Redirect to login page
    window.location.href = '/index.html';
}
```

### PHP Backend
```php
// Send welcome email
$emailService = new \ChefOS\Services\EmailService();
$emailService->sendWelcomeEmail(
    'user@example.com',
    'Welcome to ChefOS!',
    'Thank you for joining ChefOS.',
    'https://chefos.blacnova.net'
);

// Send password reset email
$resetUrl = $emailService->generateResetUrl($resetToken);
$emailService->sendPasswordResetEmail(
    'user@example.com',
    'John Doe',
    $resetUrl
);
```

## 🔧 Configuration

### Environment Variables
No additional environment variables are required for EmailJS integration. The service uses hardcoded credentials for simplicity.

### Customization
To customize email templates:
1. Log into EmailJS dashboard
2. Edit templates with IDs `template_65za9pc` and `template_pn4wg4j`
3. Update template variables as needed
4. Test using the test script

## 📝 Notes

- EmailJS is used for simplicity and reliability
- All email operations are handled server-side
- Password reset tokens are stored in the database
- The system prevents email enumeration attacks
- All API endpoints include proper error handling
