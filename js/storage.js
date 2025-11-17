/**
 * Storage wrapper for ChefOS
 * Handles localStorage and backend sync
 */

// Backend API base URL
const API_BASE = '/api';

// Check if cloud storage is enabled
function isCloudEnabled() {
    return localStorage.getItem('chefos_storage_location') === 'cloud';
}

// Get authenticated user email
function getUserEmail() {
    return localStorage.getItem('chefos_user_email') || '';
}

// Make API call with proper error handling and timeout
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const email = getUserEmail();
        if (!email) {
            return { error: 'Not authenticated' };
        }

        const url = `${API_BASE}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(30000) // 30 second timeout
        };

        if (data) {
            options.body = JSON.stringify({ ...data, email });
        } else if (method === 'GET') {
            // Add email as query param for GET requests
            const separator = endpoint.includes('?') ? '&' : '?';
            const urlWithEmail = `${url}${separator}email=${encodeURIComponent(email)}`;
            const response = await fetch(urlWithEmail, options);
            if (!response.ok) {
                // If response is not OK, try to parse error message
                try {
                    const errorData = await response.json();
                    return { error: errorData.error || `HTTP ${response.status}` };
                } catch {
                    return { error: `HTTP ${response.status}` };
                }
            }
            return await response.json();
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            // If response is not OK, try to parse error message
            try {
                const errorData = await response.json();
                return { error: errorData.error || `HTTP ${response.status}` };
            } catch {
                return { error: `HTTP ${response.status}` };
            }
        }
        return await response.json();
    } catch (error) {
        // Handle timeout, network errors, etc.
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return { error: 'Request timeout - server may be unavailable' };
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { error: 'Network error - check your connection' };
        }
        return { error: error.message || 'Unknown error occurred' };
    }
}

// Storage wrapper with backend sync
const storage = {
    // Synchronous get (uses localStorage - backend sync happens via syncAll)
    get(key, fallback = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (error) {
            return fallback;
        }
    },
    
    set(key, value) {
        try {
            // Always save to localStorage first (for offline support)
            localStorage.setItem(key, JSON.stringify(value));
            
            // Sync to backend if cloud enabled and user is authenticated
            if (isCloudEnabled() && getUserEmail()) {
                this.syncToBackend(key, value);
            }
            
            return true;
        } catch (error) {
            // Silently fail in production
            if (typeof console !== 'undefined' && console.error) {
                console.error('Storage error:', error);
            }
            return false;
        }
    },
    
    async syncToBackend(key, value) {
        try {
            const email = getUserEmail();
            if (!email) return;

            // Map localStorage keys to API endpoints
            const keyMapping = {
                'savedRecipes': 'recipes',
                'yieldr_recipes': 'recipes',
                'yieldr_menus': 'menus',
                'yieldr_shopping_list': 'shopping',
                'yieldr_stores': 'stores',
                'yieldr_pdfs': 'pdfs',
                'custom_densities': { type: 'custom', dataType: 'custom_densities' },
                'yieldr_shopping_categories': { type: 'custom', dataType: 'shopping_categories' }
            };

            const mapping = keyMapping[key];
            if (!mapping) {
                // Generic settings - save via settings endpoint
                if (key.startsWith('chefos_') || key === 'darkMode' || key === 'selectedTheme' || 
                    key.startsWith('pin') || key === 'storedPIN' || key === 'chefos_font_family') {
                    try {
                        await apiCall('/user/settings', 'POST', {
                            key: key,
                            value: value
                        });
                    } catch (error) {
                        // Silently fail - settings sync is optional, data is still in localStorage
                        if (typeof console !== 'undefined' && console.warn) {
            console.warn('Settings sync failed (non-critical):', error);
        }
                    }
                }
                return;
            }

            if (typeof mapping === 'string') {
                // Direct endpoint mapping
                if (key === 'yieldr_shopping_list' || key === 'yieldr_shopping_list') {
                    try {
                        await apiCall(`/data/shopping`, 'PUT', { data: value });
                    } catch (error) {
                        // Silently fail - sync is optional, data is still in localStorage and database
                        if (typeof console !== 'undefined' && console.warn) {
            console.warn('Shopping list sync failed (non-critical):', error);
        }
                    }
                } else if (key === 'savedRecipes' || key === 'yieldr_recipes') {
                    // Save all recipes
                    const recipes = Array.isArray(value) ? value : [];
                    // Save recipes in parallel (fire and forget for performance)
                    recipes.forEach(recipe => {
                        apiCall(`/data/recipes`, 'POST', {
                            recipe_id: recipe.id || recipe.recipe_id || Date.now().toString(),
                            data: recipe
                        }).catch(err => {
                            // Silently fail - sync is optional, data is still in localStorage and database
                            if (typeof console !== 'undefined' && console.warn) {
                                console.warn('Recipe sync failed (non-critical):', err);
                            }
                        });
                    });
                } else {
                    // For other types, convert array to object with IDs
                    const data = Array.isArray(value) ? value : value;
                    if (Array.isArray(data)) {
                        // Save items in parallel (fire and forget for performance)
                        data.forEach(item => {
                            const itemId = item.id || item.menu_id || item.store_id || item.pdf_id || Date.now().toString();
                            apiCall(`/data/${mapping}`, 'POST', {
                                [`${mapping.slice(0, -1)}_id`]: itemId,
                                data: item
                            }).catch(err => {
                                // Silently fail - sync is optional, data is still in localStorage and database
                                if (typeof console !== 'undefined' && console.warn) {
                                    console.warn(`${mapping} sync failed (non-critical):`, err);
                                }
                            });
                        });
                    } else {
                        // Single item
                        const itemId = data.id || data.menu_id || data.store_id || data.pdf_id || Date.now().toString();
                        apiCall(`/data/${mapping}`, 'POST', {
                            [`${mapping.slice(0, -1)}_id`]: itemId,
                            data: data
                        }).catch(err => {
                            // Silently fail - sync is optional, data is still in localStorage and database
                            if (typeof console !== 'undefined' && console.warn) {
                                console.warn(`${mapping} sync failed (non-critical):`, err);
                            }
                        });
                    }
                }
            } else {
                // Custom data type
                try {
                    await apiCall('/data/custom', 'POST', {
                        data_type: mapping.dataType,
                        data_key: 'main',
                        data: value
                    });
                } catch (error) {
                    // Silently fail - sync is optional, data is still in localStorage and database
                    if (typeof console !== 'undefined' && console.warn) {
                        console.warn('Custom data sync failed (non-critical):', error);
                    }
                }
            }
        } catch (error) {
            // Silently fail - sync is optional, data is still in localStorage and database
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('Backend sync error (non-critical):', error);
            }
        }
    },
    
    // Load from backend
    async loadFromBackend(key) {
        if (!isCloudEnabled() || !getUserEmail()) {
            return null;
        }

        try {
            const keyMapping = {
                'savedRecipes': 'recipes',
                'yieldr_recipes': 'recipes',
                'yieldr_menus': 'menus',
                'yieldr_shopping_list': 'shopping',
                'yieldr_stores': 'stores',
                'yieldr_pdfs': 'pdfs',
                'custom_densities': { type: 'custom', dataType: 'custom_densities' },
                'yieldr_shopping_categories': { type: 'custom', dataType: 'shopping_categories' }
            };

            const mapping = keyMapping[key];
            if (!mapping) return null;

            if (typeof mapping === 'string') {
                const result = await apiCall(`/data/${mapping}`, 'GET');
                // Check for errors in response
                if (result && result.error) {
                    if (typeof console !== 'undefined' && console.warn) {
                        console.warn(`Backend load error for ${key}:`, result.error);
                    }
                    return null; // Return null to fall back to localStorage
                }
                if (result && result.success) {
                    if (mapping === 'shopping') {
                        return result.data || {};
                    } else if (mapping === 'recipes') {
                        // Convert object to array
                        return Object.values(result.recipes || {});
                    } else {
                        // Convert object to array
                        return Object.values(result[mapping] || {});
                    }
                }
            } else {
                const result = await apiCall('/data/custom', 'GET', {
                    data_type: mapping.dataType
                });
                // Check for errors in response
                if (result && result.error) {
                    if (typeof console !== 'undefined' && console.warn) {
                        console.warn(`Backend load error for ${key}:`, result.error);
                    }
                    return null; // Return null to fall back to localStorage
                }
                if (result && result.success && result.data) {
                    return result.data.main || result.data;
                }
            }
        } catch (error) {
            // Silently fail - fall back to localStorage if backend is unavailable
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('Backend load error (falling back to local storage):', error);
            }
        }
        
        return null;
    },
    
    // Sync all data from backend
    async syncAll() {
        if (!isCloudEnabled() || !getUserEmail()) {
            return;
        }

        try {
            const result = await apiCall('/sync', 'GET');
            
            // Check for errors in response
            if (result && result.error) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Sync error (non-critical, using local storage):', result.error);
                }
                return; // Silently fail - app continues with local storage
            }
            
            if (result && result.success && result.cloud_enabled) {
                // Save recipes
                if (result.recipes) {
                    const recipesArray = Object.values(result.recipes);
                    localStorage.setItem('savedRecipes', JSON.stringify(recipesArray));
                    localStorage.setItem('yieldr_recipes', JSON.stringify(recipesArray));
                }

                // Save menus
                if (result.menus) {
                    localStorage.setItem('yieldr_menus', JSON.stringify(Object.values(result.menus)));
                }

                // Save shopping list
                if (result.shopping) {
                    localStorage.setItem('yieldr_shopping_list', JSON.stringify(result.shopping));
                }

                // Save stores
                if (result.stores) {
                    localStorage.setItem('yieldr_stores', JSON.stringify(Object.values(result.stores)));
                }

                // Save PDFs
                if (result.pdfs) {
                    localStorage.setItem('yieldr_pdfs', JSON.stringify(Object.values(result.pdfs)));
                }

                // Save custom data
                if (result.custom) {
                    if (result.custom.custom_densities) {
                        localStorage.setItem('custom_densities', JSON.stringify(result.custom.custom_densities.main || result.custom.custom_densities));
                    }
                    if (result.custom.shopping_categories) {
                        localStorage.setItem('yieldr_shopping_categories', JSON.stringify(result.custom.shopping_categories.main || result.custom.shopping_categories));
                    }
                }

                // Save settings
                if (result.settings) {
                    for (const [key, value] of Object.entries(result.settings)) {
                        if (typeof value !== 'object') {
                            localStorage.setItem(key, value);
                        } else {
                            localStorage.setItem(key, JSON.stringify(value));
                        }
                    }
                }

                // Update user plan
                if (result.user && result.user.plan) {
                    localStorage.setItem('chefos_user_plan', result.user.plan);
                    if (result.user.plan_expiry) {
                        localStorage.setItem('chefos_plan_expiry', result.user.plan_expiry);
                    }
                }
            }
        } catch (error) {
            // Silently fail - app continues with local storage if backend is unavailable
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('Sync all error (non-critical, using local storage):', error);
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storage;
}
