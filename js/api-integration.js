// API Integration Helper for ChefOS
// This file helps integrate your existing JavaScript with the new backend API

// Uses the vanilla JavaScript ChefOSStore (no imports needed)
// The store is available globally as window.ChefOSStore

// API Integration Class
class ChefOSAPI {
    constructor() {
        this.baseUrl = window.location.origin;
        this.isConnected = false;
    }

    // Test API connection
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/recipes`);
            if (response.ok) {
                this.isConnected = true;
                console.log('✅ API connection successful');
                return true;
            } else {
                console.error('❌ API connection failed:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ API connection error:', error);
            return false;
        }
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Recipe methods
    async getRecipes() {
        return this.request('/api/recipes');
    }

    async createRecipe(recipe) {
        return this.request('/api/recipes', {
            method: 'POST',
            body: JSON.stringify(recipe),
        });
    }

    async updateRecipe(id, recipe) {
        return this.request(`/api/recipes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(recipe),
        });
    }

    async deleteRecipe(id) {
        return this.request(`/api/recipes/${id}`, {
            method: 'DELETE',
        });
    }

    // Menu methods
    async getMenus() {
        return this.request('/api/menus');
    }

    async createMenu(menu) {
        return this.request('/api/menus', {
            method: 'POST',
            body: JSON.stringify(menu),
        });
    }

    async updateMenu(id, menu) {
        return this.request(`/api/menus/${id}`, {
            method: 'PUT',
            body: JSON.stringify(menu),
        });
    }

    async deleteMenu(id) {
        return this.request(`/api/menus/${id}`, {
            method: 'DELETE',
        });
    }

    // Store methods
    async getStores() {
        return this.request('/api/stores');
    }

    async createStore(store) {
        return this.request('/api/stores', {
            method: 'POST',
            body: JSON.stringify(store),
        });
    }

    async updateStore(id, store) {
        return this.request(`/api/stores/${id}`, {
            method: 'PUT',
            body: JSON.stringify(store),
        });
    }

    async deleteStore(id) {
        return this.request(`/api/stores/${id}`, {
            method: 'DELETE',
        });
    }

    // Shopping list methods
    async getShoppingList() {
        return this.request('/api/shopping-list');
    }

    async updateShoppingList(listData) {
        return this.request('/api/shopping-list', {
            method: 'PUT',
            body: JSON.stringify({ listData }),
        });
    }

    // Calendar methods
    async getCalendarItems() {
        return this.request('/api/calendar');
    }

    async createCalendarItem(item) {
        return this.request('/api/calendar', {
            method: 'POST',
            body: JSON.stringify(item),
        });
    }

    async updateCalendarItem(id, item) {
        return this.request(`/api/calendar/${id}`, {
            method: 'PUT',
            body: JSON.stringify(item),
        });
    }

    async deleteCalendarItem(id) {
        return this.request(`/api/calendar/${id}`, {
            method: 'DELETE',
        });
    }

    // Custom densities methods
    async getCustomDensities() {
        return this.request('/api/custom-densities');
    }

    async createCustomDensity(density) {
        return this.request('/api/custom-densities', {
            method: 'POST',
            body: JSON.stringify(density),
        });
    }

    async updateCustomDensity(id, density) {
        return this.request(`/api/custom-densities/${id}`, {
            method: 'PUT',
            body: JSON.stringify(density),
        });
    }

    async deleteCustomDensity(id) {
        return this.request(`/api/custom-densities/${id}`, {
            method: 'DELETE',
        });
    }

    // Authentication methods
    async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(email, password, plan = 'trial') {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, plan }),
        });
    }
}

// Create global API instance
window.ChefOSAPI = new ChefOSAPI();

// Auto-test connection on load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔌 Testing API connection...');
    await window.ChefOSAPI.testConnection();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChefOSAPI;
}
