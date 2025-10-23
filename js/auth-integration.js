// Authentication Integration for ChefOS
class AuthIntegration {
    constructor() {
        this.baseUrl = window.location.origin;
    }

    /**
     * Request a password reset email
     */
    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/request-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message
                };
            } else {
                return {
                    success: false,
                    message: data.error || 'Failed to request password reset'
                };
            }
        } catch (error) {
            console.error('Password reset request error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, password) {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message
                };
            } else {
                return {
                    success: false,
                    message: data.error || 'Failed to reset password'
                };
            }
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    /**
     * Verify reset token
     */
    async verifyResetToken(token) {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/verify-reset-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    user: data.user
                };
            } else {
                return {
                    success: false,
                    message: data.error || 'Invalid or expired reset token'
                };
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }
}

// Make AuthIntegration available globally
window.ChefOSAuth = new AuthIntegration();
