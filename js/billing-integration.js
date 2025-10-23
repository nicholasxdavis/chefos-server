// Billing Integration for ChefOS
class BillingIntegration {
    constructor() {
        this.baseUrl = window.location.origin;
        this.currentUserId = this.getCurrentUserId();
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        if (window.ChefOSStore && window.ChefOSStore.getState().user) {
            return window.ChefOSStore.getState().user.id;
        }
        
        const userData = localStorage.getItem('chefos_user');
        if (userData) {
            try {
                return JSON.parse(userData).id;
            } catch (e) {
                console.warn('Failed to parse user data from localStorage');
            }
        }
        
        return null;
    }

    /**
     * Get subscription status and usage
     */
    async getSubscriptionStatus() {
        if (!this.currentUserId) {
            throw new Error('No user ID available');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/billing/subscription-status?user_id=${this.currentUserId}`);
            const data = await response.json();

            if (response.ok) {
                return data;
            } else {
                throw new Error(data.error || 'Failed to get subscription status');
            }
        } catch (error) {
            console.error('Subscription status error:', error);
            throw error;
        }
    }

    /**
     * Create checkout session for subscription
     */
    async createCheckoutSession() {
        if (!this.currentUserId) {
            throw new Error('No user ID available');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/billing/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.currentUserId
                })
            });

            const data = await response.json();

            if (response.ok) {
                return data;
            } else {
                throw new Error(data.error || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('Create checkout session error:', error);
            throw error;
        }
    }

    /**
     * Create billing portal session
     */
    async createBillingPortalSession() {
        if (!this.currentUserId) {
            throw new Error('No user ID available');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/billing/create-portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.currentUserId
                })
            });

            const data = await response.json();

            if (response.ok) {
                return data;
            } else {
                throw new Error(data.error || 'Failed to create billing portal session');
            }
        } catch (error) {
            console.error('Create billing portal error:', error);
            throw error;
        }
    }

    /**
     * Upgrade to Pro plan
     */
    async upgradeToPro() {
        try {
            const checkoutData = await this.createCheckoutSession();
            window.location.href = checkoutData.checkout_url;
        } catch (error) {
            this.showError('Failed to start upgrade process: ' + error.message);
        }
    }

    /**
     * Open billing portal
     */
    async openBillingPortal() {
        try {
            const portalData = await this.createBillingPortalSession();
            window.location.href = portalData.portal_url;
        } catch (error) {
            this.showError('Failed to open billing portal: ' + error.message);
        }
    }

    /**
     * Show usage statistics
     */
    async showUsageStats() {
        try {
            const status = await this.getSubscriptionStatus();
            this.displayUsageStats(status);
        } catch (error) {
            this.showError('Failed to load usage statistics: ' + error.message);
        }
    }

    /**
     * Display usage statistics in a modal
     */
    displayUsageStats(status) {
        const modal = this.createUsageModal(status);
        document.body.appendChild(modal);
        modal.showModal();
    }

    /**
     * Create usage statistics modal
     */
    createUsageModal(status) {
        const modal = document.createElement('dialog');
        modal.className = 'modal modal-open';
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">Usage Statistics</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h4 class="card-title text-sm">Recipes</h4>
                            <div class="flex items-center justify-between">
                                <span>${status.current_usage.recipe.current}/${status.current_usage.recipe.limit}</span>
                                <progress class="progress progress-primary w-20" 
                                    value="${status.current_usage.recipe.current}" 
                                    max="${status.current_usage.recipe.limit}"></progress>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h4 class="card-title text-sm">Menus</h4>
                            <div class="flex items-center justify-between">
                                <span>${status.current_usage.menu.current}/${status.current_usage.menu.limit}</span>
                                <progress class="progress progress-primary w-20" 
                                    value="${status.current_usage.menu.current}" 
                                    max="${status.current_usage.menu.limit}"></progress>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h4 class="card-title text-sm">Stores</h4>
                            <div class="flex items-center justify-between">
                                <span>${status.current_usage.store.current}/${status.current_usage.store.limit}</span>
                                <progress class="progress progress-primary w-20" 
                                    value="${status.current_usage.store.current}" 
                                    max="${status.current_usage.store.limit}"></progress>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h4 class="card-title text-sm">Calendar Items</h4>
                            <div class="flex items-center justify-between">
                                <span>${status.current_usage.calendar.current}/${status.current_usage.calendar.limit}</span>
                                <progress class="progress progress-primary w-20" 
                                    value="${status.current_usage.calendar.current}" 
                                    max="${status.current_usage.calendar.limit}"></progress>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card bg-base-100 shadow mb-4">
                    <div class="card-body">
                        <h4 class="card-title text-sm">Current Plan</h4>
                        <p class="text-lg font-semibold capitalize">${status.subscription.plan}</p>
                        ${status.subscription.status ? `<p class="text-sm text-gray-600">Status: ${status.subscription.status}</p>` : ''}
                        ${status.subscription.current_period_end ? `<p class="text-sm text-gray-600">Renews: ${new Date(status.subscription.current_period_end).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
                
                <div class="modal-action">
                    <button class="btn btn-primary" onclick="window.ChefOSBilling.openBillingPortal()">
                        Manage Billing
                    </button>
                    ${status.subscription.plan === 'trial' ? `
                        <button class="btn btn-success" onclick="window.ChefOSBilling.upgradeToPro()">
                            Upgrade to Pro
                        </button>
                    ` : ''}
                    <button class="btn" onclick="this.closest('dialog').close()">Close</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-end';
        toast.innerHTML = `
            <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-end';
        toast.innerHTML = `
            <div class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * Check if user can perform an action
     */
    async canPerformAction(featureType) {
        try {
            const status = await this.getSubscriptionStatus();
            const usage = status.current_usage[featureType];
            
            if (!usage.allowed) {
                this.showUsageLimitReached(featureType, usage);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to check usage limits:', error);
            return true; // Allow action if check fails
        }
    }

    /**
     * Show usage limit reached message
     */
    showUsageLimitReached(featureType, usage) {
        const message = `You've reached your ${featureType} limit (${usage.current}/${usage.limit}). Upgrade to Pro for unlimited usage.`;
        
        const modal = document.createElement('dialog');
        modal.className = 'modal modal-open';
        modal.innerHTML = `
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">Usage Limit Reached</h3>
                <p class="mb-4">${message}</p>
                <div class="modal-action">
                    <button class="btn btn-success" onclick="window.ChefOSBilling.upgradeToPro()">
                        Upgrade to Pro
                    </button>
                    <button class="btn" onclick="this.closest('dialog').close()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.showModal();
    }
}

// Make BillingIntegration available globally
window.ChefOSBilling = new BillingIntegration();
