// Usage Tracking System for ChefOS
class UsageTracker {
    constructor() {
        this.baseUrl = window.location.origin;
        this.currentUserId = this.getCurrentUserId();
    }

    /**
     * Get current user ID from session or localStorage
     */
    getCurrentUserId() {
        // Try to get from global state or localStorage
        if (window.ChefOSStore && window.ChefOSStore.getState().user) {
            return window.ChefOSStore.getState().user.id;
        }
        
        // Fallback to localStorage
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
     * Track usage for a specific feature
     */
    async trackUsage(featureType, actionType, itemId = null) {
        if (!this.currentUserId) {
            console.warn('Cannot track usage: No user ID available');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/billing/usage-track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.currentUserId,
                    feature_type: featureType,
                    action_type: actionType,
                    item_id: itemId
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`Usage tracked: ${featureType} ${actionType}`, data);
                return data;
            } else {
                console.error('Failed to track usage:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Usage tracking error:', error);
            return null;
        }
    }

    /**
     * Check if user can perform an action based on plan limits
     */
    async checkUsageLimits(featureType) {
        if (!this.currentUserId) {
            return { allowed: true, current: 0, limit: 0 };
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/billing/subscription-status?user_id=${this.currentUserId}`);
            const data = await response.json();

            if (response.ok && data.current_usage && data.current_usage[featureType]) {
                return data.current_usage[featureType];
            }

            return { allowed: true, current: 0, limit: 0 };
        } catch (error) {
            console.error('Failed to check usage limits:', error);
            return { allowed: true, current: 0, limit: 0 };
        }
    }

    /**
     * Track recipe creation
     */
    async trackRecipeCreate(recipeId) {
        return await this.trackUsage('recipe', 'create', recipeId);
    }

    /**
     * Track recipe update
     */
    async trackRecipeUpdate(recipeId) {
        return await this.trackUsage('recipe', 'update', recipeId);
    }

    /**
     * Track recipe deletion
     */
    async trackRecipeDelete(recipeId) {
        return await this.trackUsage('recipe', 'delete', recipeId);
    }

    /**
     * Track menu creation
     */
    async trackMenuCreate(menuId) {
        return await this.trackUsage('menu', 'create', menuId);
    }

    /**
     * Track menu update
     */
    async trackMenuUpdate(menuId) {
        return await this.trackUsage('menu', 'update', menuId);
    }

    /**
     * Track menu deletion
     */
    async trackMenuDelete(menuId) {
        return await this.trackUsage('menu', 'delete', menuId);
    }

    /**
     * Track store creation
     */
    async trackStoreCreate(storeId) {
        return await this.trackUsage('store', 'create', storeId);
    }

    /**
     * Track calendar item creation
     */
    async trackCalendarCreate(itemId) {
        return await this.trackUsage('calendar', 'create', itemId);
    }

    /**
     * Track shopping list creation
     */
    async trackShoppingListCreate(listId) {
        return await this.trackUsage('shopping_list', 'create', listId);
    }

    /**
     * Show usage limit warning
     */
    showUsageLimitWarning(featureType, current, limit) {
        const percentage = (current / limit) * 100;
        
        if (percentage >= 90) {
            this.showNotification(
                `Warning: You're at ${Math.round(percentage)}% of your ${featureType} limit (${current}/${limit}). Consider upgrading to Pro for unlimited usage.`,
                'warning'
            );
        } else if (percentage >= 80) {
            this.showNotification(
                `You're using ${Math.round(percentage)}% of your ${featureType} limit (${current}/${limit}).`,
                'info'
            );
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md ${
            type === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-800' :
            type === 'error' ? 'bg-red-100 border border-red-400 text-red-800' :
            'bg-blue-100 border border-blue-400 text-blue-800'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-500 hover:text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Initialize usage tracking for existing features
     */
    init() {
        // Track page views
        this.trackUsage('app', 'view');
        
        // Set up automatic tracking for common actions
        this.setupAutomaticTracking();
        
        console.log('Usage tracking initialized for user:', this.currentUserId);
    }

    /**
     * Set up automatic tracking for common UI actions
     */
    setupAutomaticTracking() {
        // Track when user opens recipe creation modal
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-track="recipe-create"]') || 
                e.target.closest('[data-track="recipe-create"]')) {
                this.trackUsage('recipe', 'view', 'create_modal');
            }
            
            if (e.target.matches('[data-track="menu-create"]') || 
                e.target.closest('[data-track="menu-create"]')) {
                this.trackUsage('menu', 'view', 'create_modal');
            }
            
            if (e.target.matches('[data-track="store-create"]') || 
                e.target.closest('[data-track="store-create"]')) {
                this.trackUsage('store', 'view', 'create_modal');
            }
        });
    }
}

// Make UsageTracker available globally
window.ChefOSUsageTracker = new UsageTracker();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ChefOSUsageTracker.init();
    });
} else {
    window.ChefOSUsageTracker.init();
}
