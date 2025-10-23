/**
 * Main application logic for ChefOS
 */

// Apply dark mode and PRO badge preference immediately (before page load)
(function() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    const showProBadges = localStorage.getItem('chefos_show_pro_badges') !== 'false';
    if (!showProBadges) {
        document.body.classList.add('hide-pro-badges');
    }
})();

// Application state
let appState = {
    recipes: [],
    currentIngredients: [],
    scaledIngredients: [],
    isProcessing: false
};

// Global variables
let currentIngredients = [];
let scaledIngredients = [];
let isProcessing = false;

// Load custom densities from localStorage
function loadCustomDensities() {
    const custom = storage.get('custom_densities', {});
    return custom;
}

function saveCustomDensities(densities) {
    storage.set('custom_densities', densities);
}

// Ingredient density database (g/ml) - Built-in defaults
const BUILTIN_DENSITY_DB_G_PER_ML = {
    // Flours
    'flour': 0.53, 'all-purpose flour': 0.53, 'ap flour': 0.53, 
    'bread flour': 0.56, 'cake flour': 0.49, 'whole wheat flour': 0.57,
    'almond flour': 0.48, 'coconut flour': 0.43, 'rice flour': 0.55,
    
    // Sugars
    'sugar': 0.84, 'white sugar': 0.84, 'granulated sugar': 0.84,
    'brown sugar': 0.93, 'powdered sugar': 0.51, 'confectioners sugar': 0.51,
    'caster sugar': 0.88, 'maple sugar': 0.80, 'coconut sugar': 0.85,
    
    // Fats & Oils
    'butter': 0.92, 'unsalted butter': 0.92, 'margarine': 0.93,
    'shortening': 0.91, 'oil': 0.92, 'vegetable oil': 0.92,
    'olive oil': 0.92, 'coconut oil': 0.92, 'canola oil': 0.92,
    
    // Liquids
    'water': 1.0, 'milk': 1.03, 'whole milk': 1.03, 'skim milk': 1.033,
    'heavy cream': 1.01, 'half and half': 1.02, 'buttermilk': 1.03,
    'yogurt': 1.04, 'sour cream': 1.02,
    
    // Leavening & Starches
    'baking soda': 0.93, 'baking powder': 0.93, 'cornstarch': 0.54,
    'arrowroot': 0.50, 'tapioca starch': 0.60, 'potato starch': 0.55,
    
    // Salts
    'salt': 1.2, 'table salt': 1.2, 'kosher salt': 0.8, 'sea salt': 1.1,
    
    // Flavorings
    'cocoa powder': 0.51, 'vanilla extract': 0.85, 'almond extract': 0.95,
    
    // Nuts & Seeds
    'almonds': 0.56, 'walnuts': 0.52, 'pecans': 0.54, 'peanuts': 0.62,
    'cashews': 0.58, 'chia seeds': 0.62, 'flax seeds': 0.65, 'sesame seeds': 0.60,
    
    // Sweeteners
    'honey': 1.42, 'maple syrup': 1.33, 'molasses': 1.42, 'corn syrup': 1.38,
    'agave': 1.35, 'stevia': 0.3,
    
    // Fruits & Vegetables
    'applesauce': 1.04, 'mashed banana': 1.10, 'pumpkin puree': 1.03,
    'tomato paste': 1.15, 'tomato sauce': 1.02,
    
    // Eggs
    'egg': 1.0, 'egg white': 1.04, 'egg yolk': 1.03,
    
    // Other
    'yeast': 0.63, 'gelatin': 0.68, 'breadcrumbs': 0.45, 'oats': 0.43,
    'rice': 0.85, 'quinoa': 0.75, 'lentils': 0.80
};

// Combined density database (built-in + custom)
function getDensityDB() {
    const custom = loadCustomDensities();
    return { ...BUILTIN_DENSITY_DB_G_PER_ML, ...custom };
}

// For backward compatibility
const DENSITY_DB_G_PER_ML = getDensityDB();

// Unit conversion system
const UNIT_CONVERSIONS = {
    // Weight units (to grams)
    'g': { to_base: 1, type: 'weight' },
    'kg': { to_base: 1000, type: 'weight' },
    'oz': { to_base: 28.35, type: 'weight' },
    'lb': { to_base: 453.6, type: 'weight' },
    
    // Volume units (to ml)
    'ml': { to_base: 1, type: 'volume' },
    'l': { to_base: 1000, type: 'volume' },
    'tsp': { to_base: 4.93, type: 'volume' },
    'tbsp': { to_base: 14.79, type: 'volume' },
    'cup': { to_base: 236.59, type: 'volume' },
    'fl oz': { to_base: 29.57, type: 'volume' },
    'pint': { to_base: 473.18, type: 'volume' },
    'quart': { to_base: 946.35, type: 'volume' },
    'gallon': { to_base: 3785.41, type: 'volume' }
};

// Density conversion function
function convertWithDensity(value, fromUnit, toUnit, ingredient) {
    const fromInfo = UNIT_CONVERSIONS[fromUnit];
    const toInfo = UNIT_CONVERSIONS[toUnit];
    
    if (!fromInfo || !toInfo) return value;
    
    // Convert to base units
    const baseValue = value * fromInfo.to_base;
    
    if (fromInfo.type === toInfo.type) {
        // Same type conversion
        return baseValue / toInfo.to_base;
    } else {
        // Cross-type conversion using density (check custom first, then built-in)
        const densityDB = getDensityDB();
        const density = densityDB[ingredient.toLowerCase()] || 1.0;
        
        if (fromInfo.type === 'weight' && toInfo.type === 'volume') {
            // Weight to volume: divide by density
            return (baseValue / density) / toInfo.to_base;
        } else if (fromInfo.type === 'volume' && toInfo.type === 'weight') {
            // Volume to weight: multiply by density
            return (baseValue * density) / toInfo.to_base;
        }
    }
    
    return value;
}

// Recipe management functions
function loadRecipes() {
    try {
        const recipes = storage.get('yieldr_recipes', []);
        appState.recipes = recipes;
        return recipes;
    } catch (error) {
        console.error('Error loading recipes:', error);
        return [];
    }
}

function saveRecipe(recipe) {
    try {
        const sanitizedRecipe = {
            id: recipe.id || Date.now().toString(),
            title: sanitizeInput(recipe.title || 'Untitled Recipe'),
            originalYield: validateNumber(recipe.originalYield, 0.1) || 1,
            desiredYield: validateNumber(recipe.desiredYield, 0.1) || 1,
            ingredients: recipe.ingredients || [],
            createdAt: recipe.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const existingIndex = appState.recipes.findIndex(r => r.id === sanitizedRecipe.id);
        if (existingIndex >= 0) {
            appState.recipes[existingIndex] = sanitizedRecipe;
        } else {
            appState.recipes.push(sanitizedRecipe);
        }
        
        storage.set('yieldr_recipes', appState.recipes);
        return { success: true, recipe: sanitizedRecipe };
    } catch (error) {
        console.error('Error saving recipe:', error);
        return { success: false, error: error.message };
    }
}

function deleteRecipe(recipeId) {
    try {
        appState.recipes = appState.recipes.filter(r => r.id !== recipeId);
        storage.set('yieldr_recipes', appState.recipes);
        return { success: true };
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return { success: false, error: error.message };
    }
}

// Recipe processing functions
function processAndDisplay(showToastMsg = true) {
    // Prevent multiple simultaneous processing
    if (isProcessing) {
        showToast('Please wait, processing recipe...', 'info');
        return;
    }
    
    try {
        isProcessing = true;
        
        const recipeInput = getElement('recipe-input');
        const originalYieldInput = getElement('original-yield');
        const desiredYieldInput = getElement('desired-yield');
        
        // Validation: Check if all required elements exist
        if (!recipeInput || !originalYieldInput || !desiredYieldInput) {
            showToast('Required elements not found. Please refresh the page.', 'error');
            isProcessing = false;
            return;
        }
        
        const rawText = recipeInput.value.trim();
        const originalYield = parseFloat(originalYieldInput.value);
        const desiredYield = parseFloat(desiredYieldInput.value);
        
        // Validation: Check if recipe text is provided
        if (!rawText) {
            showToast('Please enter a recipe first', 'error');
            isProcessing = false;
            return;
        }
        
        // Validation: Check if yields are valid numbers
        if (isNaN(originalYield) || isNaN(desiredYield)) {
            showToast('Please enter valid numbers for yield values', 'error');
            isProcessing = false;
            return;
        }
        
        // Validation: Check if yields are positive
        if (originalYield <= 0) {
            showToast('Original yield must be greater than 0', 'error');
            isProcessing = false;
            return;
        }
        
        if (desiredYield <= 0) {
            showToast('Desired yield must be greater than 0', 'error');
            isProcessing = false;
            return;
        }
        
        // Validation: Check if yields are reasonable (not too large)
        if (originalYield > 10000 || desiredYield > 10000) {
            showToast('Yield values seem unusually large. Please check your input.', 'warning');
            isProcessing = false;
            return;
        }
        
        currentIngredients = parseRecipe(rawText);
        
        // Validation: Check if any ingredients were parsed
        if (!currentIngredients || currentIngredients.length === 0) {
            showToast('No ingredients found. Please check your recipe format.', 'error');
            isProcessing = false;
            return;
        }
        
        scaledIngredients = currentIngredients.map(ing => ({ 
            ...ing, 
            scaledQty: ing.quantity * (desiredYield / originalYield), 
            scaledUnit: ing.unit 
        }));
        
        renderResults(scaledIngredients);
        
        const yieldSummary = getElement('yield-summary');
        const outputSection = getElement('output-section');
        
        if (yieldSummary && outputSection) {
            yieldSummary.textContent = `From ${originalYield} to ${desiredYield} servings`;
            outputSection.style.display = 'block';
        }
        
        if (showToastMsg) {
            showToast('Recipe scaled successfully!', 'success');
        }
        
    } catch (error) {
        console.error('Error processing recipe:', error);
        showToast('Error processing recipe', 'error');
    } finally {
        isProcessing = false;
    }
}

function renderResults(scaled) {
    const resultsBody = getElement('results-body');
    if (!resultsBody) return;
    
    if (scaled.length === 0) {
        resultsBody.innerHTML = '<p class="text-center text-gray-500 py-4">No ingredients found. Please check your recipe format.</p>';
        return;
    }
    
    resultsBody.innerHTML = scaled.map(ing => {
        const originalDisplay = ing.unit ? `${escapeHtml(ing.rawQty)} ${escapeHtml(ing.unit)}` : escapeHtml(ing.rawQty);
        const scaledDisplay = ing.scaledUnit ? formatKitchenQuantity(ing.scaledQty, ing.scaledUnit) : ing.scaledQty.toString();
        
        return `
        <div class="flex justify-between items-center py-3 border-b border-base-300">
            <div class="flex-1">
                <p class="font-medium text-white">${escapeHtml(ing.name)}</p>
                <p class="text-sm opacity-70 text-gray-300">Original: ${originalDisplay}</p>
            </div>
            <div class="text-right ml-4">
                <p class="text-lg font-bold text-primary">${escapeHtml(scaledDisplay)}</p>
            </div>
        </div>
        `;
    }).join('');
}

// Recipe rendering functions
function renderRecipes() {
    const grid = getElement('recipes-grid');
    const emptyState = getElement('recipes-empty-state');
    
    if (!grid || !emptyState) return;
    
    try {
        const recipes = appState.recipes;
        
        if (recipes.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = recipes.map(recipe => `
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">${escapeHtml(recipe.title)}</h2>
                    <p class="text-sm opacity-70">${recipe.ingredients.length} ingredients</p>
                    <p class="text-xs opacity-50">Updated: ${new Date(recipe.updatedAt).toLocaleDateString()}</p>
                    <div class="card-actions justify-end">
                        <button onclick="loadRecipe('${recipe.id}')" class="btn btn-primary btn-sm">Load</button>
                        <button onclick="deleteRecipe('${recipe.id}')" class="btn btn-error btn-sm">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error rendering recipes:', error);
        showToast('Error loading recipes', 'error');
    }
}

// Initialize sub-tab navigation
function initializeSubTabNavigation() {
    // Handle parent nav item clicks
    const navParents = document.querySelectorAll('.nav-parent');
    navParents.forEach(parent => {
        parent.addEventListener('click', (e) => {
            e.stopPropagation();
            const group = parent.closest('.nav-group');
            const subItems = group.querySelector('.nav-sub-items');
            
            // Toggle expansion
            parent.classList.toggle('expanded');
            subItems.classList.toggle('expanded');
            subItems.classList.toggle('hidden');
        });
    });
    
    // Open sub-tabs by default for "My Recipes"
    const recipesGroups = document.querySelectorAll('[data-group="recipes-group"]');
    recipesGroups.forEach(parent => {
        parent.classList.add('expanded');
        const group = parent.closest('.nav-group');
        const subItems = group.querySelector('.nav-sub-items');
        if (subItems) {
            subItems.classList.add('expanded');
            subItems.classList.remove('hidden');
        }
    });
}

// Navigation functions
function navigateToPage(pageId, skipHashUpdate = false) {
    // Validation: check if page exists
    const targetPage = document.getElementById(`${pageId}-page`);
    if (!targetPage) {
        console.error(`Page ${pageId} does not exist`);
        showToast('Page not found', 'error');
        return;
    }
    
    // Update URL hash if not from hash change event
    if (!skipHashUpdate) {
        window.location.hash = pageId;
    }
    
    const allNavItems = document.querySelectorAll('.nav-item');
    allNavItems.forEach(nav => nav.classList.remove('active-nav'));
    document.querySelectorAll(`.nav-item[data-page="${pageId}"]`).forEach(i => i.classList.add('active-nav'));
    
    // Ensure parent group is expanded when navigating to sub-page
    const activeSubItem = document.querySelector(`.nav-sub-item[data-page="${pageId}"]`);
    if (activeSubItem) {
        const group = activeSubItem.closest('.nav-group');
        if (group) {
            const parent = group.querySelector('.nav-parent');
            const subItems = group.querySelector('.nav-sub-items');
            if (parent && subItems) {
                parent.classList.add('expanded');
                subItems.classList.add('expanded');
                subItems.classList.remove('hidden');
            }
        }
    }
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    targetPage.classList.add('active');

    // Page titles are now static in HTML, no need to update them dynamically
    
    const mobileSidebar = getElement('mobile-sidebar');
    if (mobileSidebar) mobileSidebar.classList.add('hidden');
    
    // Load saved recipes when navigating to recipes page
    if (pageId === 'recipes') {
        requirePinProtection(() => {
            loadSavedRecipes();
        });
    }
    
    // Load menus when navigating to menus page
    if (pageId === 'menus') {
        requirePinProtection(() => {
            if (typeof renderMenus === 'function') {
                renderMenus();
            } else {
                console.warn('renderMenus function not available');
            }
        });
    }
    
    // Load PDF management when navigating to PDF page
    if (pageId === 'pdf-management') {
        requirePinProtection(() => {
            if (typeof renderPDFManagement === 'function') {
                renderPDFManagement();
            } else {
                console.warn('renderPDFManagement function not available');
            }
        });
    }
    
    // Load shopping list when navigating to shopping page
    if (pageId === 'shopping') {
        requirePinProtectionForShopping(() => {
            if (typeof renderShoppingList === 'function') {
                renderShoppingList();
            } else {
                console.warn('renderShoppingList function not available');
            }
        });
    }
    
    // Load stores when navigating to saved stores page
    if (pageId === 'saved-stores') {
        requirePinProtectionForShopping(() => {
            if (typeof renderStores === 'function') {
                renderStores();
            } else {
                console.warn('renderStores function not available');
            }
        });
    }
    
    // Scroll to top when navigating
    window.scrollTo(0, 0);
}

// Handle browser back/forward buttons with hash navigation
function handleHashChange() {
    const hash = window.location.hash.slice(1); // Remove the '#'
    const pageId = hash || 'scaler'; // Default to scaler if no hash
    
    // Check if valid page - map to proper page IDs (includes temp tab pages!)
    const validPages = [
        'scaler', 
        'calculator', 
        'recipes', 
        'menus', 
        'shopping', 
        'pdf-management', 
        'saved-stores', 
        'calendar',
        'settings', 
        'billing',
        'create-recipe',  // Temp tab page
        'create-menu',     // Temp tab page
        'mobile-recipes-hub',  // Mobile hub page
        'mobile-menus-hub',    // Mobile hub page
        'mobile-shopping-hub'  // Mobile hub page
    ];
    if (validPages.includes(pageId)) {
        navigateToPage(pageId, true); // true = skip hash update since we're already responding to hash change
    } else {
        navigateToPage('scaler', true);
    }
}

// Modal functions
function openIngredientModal() {
    const modal = getElement('ingredient-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        setupIngredientModal();
    }
}

function closeIngredientModal() {
    const modal = getElement('ingredient-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function setupIngredientModal() {
    const ingredientList = getElement('ingredient-list');
    const ingredientSearch = getElement('ingredient-search');
    const closeBtn = getElement('close-ingredient-modal');
    
    if (ingredientList) {
        // Populate ingredient list (built-in + custom)
        const densityDB = getDensityDB();
        const ingredients = Object.keys(densityDB).sort();
        ingredientList.innerHTML = ingredients.map(ing => 
            `<div class="ingredient-item" data-ingredient="${ing}">${ing}</div>`
        ).join('');
        
        // Add click handlers to ingredient items
        ingredientList.addEventListener('click', (e) => {
            const item = e.target.closest('.ingredient-item');
            if (item) {
                const ingredient = item.dataset.ingredient;
                if (window.calculatorModule) {
                    window.calculatorModule.completeConversion(ingredient);
                }
            }
        });
    }
    
    if (ingredientSearch) {
        // Search functionality
        ingredientSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = ingredientList.querySelectorAll('.ingredient-item');
            items.forEach(item => {
                const ingredient = item.dataset.ingredient.toLowerCase();
                item.style.display = ingredient.includes(term) ? 'block' : 'none';
            });
        });
    }
    
    if (closeBtn) {
        // Close button
        closeBtn.addEventListener('click', () => {
            closeIngredientModal();
            if (window.calculatorModule) {
                window.calculatorModule.reset();
            }
        });
    }
    
    // Close modal when clicking overlay
    const modal = getElement('ingredient-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeIngredientModal();
            }
        });
    }
}

// Global functions for HTML onclick handlers
window.loadRecipe = function(recipeId) {
    try {
        const recipe = appState.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        // Load recipe into scaler
        const recipeTitle = getElement('recipe-title');
        const originalYield = getElement('original-yield');
        const desiredYield = getElement('desired-yield');
        const recipeInput = getElement('recipe-input');
        
        if (recipeTitle) recipeTitle.value = recipe.title;
        if (originalYield) originalYield.value = recipe.originalYield;
        if (desiredYield) desiredYield.value = recipe.desiredYield;
        if (recipeInput) {
            recipeInput.value = recipe.ingredients.map(ing => 
                `${ing.rawQty} ${ing.unit} ${ing.name}`
            ).join('\n');
        }
        
        // Process and display
        processAndDisplay(false);
        
        // Navigate to scaler
        navigateToPage('scaler');
        showToast('Recipe loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        showToast('Error loading recipe', 'error');
    }
};


// Shimmer loader - force 2 second display
window.addEventListener('load', () => {
    // Check if language has been selected
    const selectedLanguage = localStorage.getItem('chefos_language');
    const langModal = document.getElementById('lang-select-modal');
    const langLogoContainer = document.getElementById('lang-logo-container');
    const shimmerLoader = document.getElementById('shimmer-loader');
    
    // Set up language logo
    if (langLogoContainer) {
        const savedTheme = localStorage.getItem('selectedTheme') || 'forest';
        const logoPath = `ui/img/logo_${savedTheme}.png`;
        langLogoContainer.style.backgroundImage = `url('${logoPath}')`;
    }
    
    // Show language selector if no language is set
    if (!selectedLanguage && langModal) {
        langModal.style.display = 'flex';
        if (shimmerLoader) shimmerLoader.style.display = 'none';
        
        // Set up language selection
        const langOptions = document.querySelectorAll('.lang-option');
        const langContinueBtn = document.getElementById('lang-continue-btn');
        let selectedLang = null;
        
        langOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected from all
                langOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected to clicked
                option.classList.add('selected');
                selectedLang = option.getAttribute('data-lang');
                
                // Enable continue button
                if (langContinueBtn) {
                    langContinueBtn.disabled = false;
                }
            });
        });
        
        if (langContinueBtn) {
            langContinueBtn.addEventListener('click', () => {
                if (selectedLang) {
                    // Save language
                    localStorage.setItem('chefos_language', selectedLang);
                    setLanguage(selectedLang);
                    
                    // Hide language modal
                    langModal.style.display = 'none';
                    
                    // Continue with normal flow
                    proceedWithAuth();
                }
            });
        }
        
        return; // Don't proceed until language is selected
    }
    
    // Language already selected, apply translations and proceed
    if (selectedLanguage) {
        applyTranslations(selectedLanguage);
    }
    proceedWithAuth();
});

// Proceed with authentication flow
function proceedWithAuth() {
    // Check authentication status
    const isAuthenticated = localStorage.getItem('chefos_authenticated') === 'true';
    const isFirstVisit = window.isFirstVisit || false;
    const authModal = document.getElementById('auth-modal');
    const createAccountModal = document.getElementById('create-account-modal');
    const shimmerLoader = document.getElementById('shimmer-loader');
    const hideStyle = document.getElementById('auth-hide-style');
    
    if (!isAuthenticated) {
        // User is not authenticated - show appropriate modal
        if (isFirstVisit) {
            // First time visitor - show create account modal
            if (createAccountModal) {
                createAccountModal.style.display = 'flex';
            }
            if (authModal) {
                authModal.style.display = 'none';
            }
        } else {
            // Returning visitor - show sign in modal
            if (authModal) {
                authModal.style.display = 'flex';
            }
            if (createAccountModal) {
                createAccountModal.style.display = 'none';
            }
        }
        // Remove the hide style to show appropriate modal
        if (hideStyle) {
            hideStyle.remove();
        }
    } else if (!window.needsPinOnEntry) {
        // User is authenticated and no PIN needed - show shimmer then app
        if (hideStyle) {
            hideStyle.remove();
        }
        if (shimmerLoader) {
            startShimmerLoader();
        }
    } else {
        // PIN is needed
        if (hideStyle) {
            hideStyle.remove();
        }
    }
}

// Check trial expiration on app load
function checkTrialExpiration() {
    const isAuthenticated = localStorage.getItem('chefos_authenticated') === 'true';
    const userPlan = localStorage.getItem('chefos_user_plan');
    const planExpiry = localStorage.getItem('chefos_plan_expiry');
    
    if (isAuthenticated && userPlan === 'trial' && planExpiry) {
        const expiryDate = new Date(planExpiry);
        const now = new Date();
        
        if (now > expiryDate) {
            // Trial has expired - show trial ended modal
            const trialEndedModal = document.getElementById('trial-ended-modal');
            if (trialEndedModal) {
                trialEndedModal.style.display = 'flex';
                
                // Hide app container
                const appContainer = document.getElementById('app-container');
                if (appContainer) {
                    appContainer.style.display = 'none';
                }
                
                return true; // Trial expired
            }
        }
    }
    return false; // Trial still active or not on trial
}

// Periodic trial check every 60 seconds while app is running
function startTrialExpirationMonitor() {
    setInterval(() => {
        const isAuthenticated = localStorage.getItem('chefos_authenticated') === 'true';
        if (isAuthenticated) {
            checkTrialExpiration();
        }
    }, 60000); // Check every minute
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check trial expiration immediately
        const trialExpired = checkTrialExpiration();
        if (trialExpired) {
            // Don't initialize app if trial expired
            return;
        }
        
        // Start monitoring trial expiration
        startTrialExpirationMonitor();
        
        // DOM element references
        window.dom = {
            // Navigation
            allNavItems: document.querySelectorAll('.nav-item'),
            sidebarToggle: document.getElementById('sidebar-toggle'),
            mobileMenuButton: document.getElementById('mobile-menu-button'),
            closeMobileMenu: document.getElementById('close-mobile-menu'),
            mobileSidebar: document.getElementById('mobile-sidebar'),
            mobileSidebarOverlay: document.getElementById('mobile-sidebar-overlay'),
            appContainer: document.getElementById('app-container'),
            
            // Scaler
            recipeInput: document.getElementById('recipe-input'),
            originalYield: document.getElementById('original-yield'),
            desiredYield: document.getElementById('desired-yield'),
            recipeTitle: document.getElementById('recipe-title'),
            recipeName: document.getElementById('recipe-title'),
            originalServings: document.getElementById('original-yield'),
            targetServings: document.getElementById('desired-yield'),
            processRecipeBtn: document.getElementById('process-recipe-btn'),
            pasteRecipeBtn: document.getElementById('paste-recipe-btn'),
            saveRecipeBtn: document.getElementById('save-recipe-btn'),
            downloadRecipeBtn: document.getElementById('download-recipe-btn'),
            printRecipeBtn: document.getElementById('print-recipe-btn'),
            goToScalerBtn: document.getElementById('go-to-scaler-btn'),
            yieldSummary: document.getElementById('yield-summary'),
            outputSection: document.getElementById('output-section'),
            resultsBody: document.getElementById('results-body'),
            
            // Calculator
            calculator: document.getElementById('calculator'),
            calcDisplay: document.getElementById('calc-display'),
            calcHistoryDisplay: document.getElementById('calc-history-display'),
            calcMemoryIndicator: document.getElementById('calc-memory-indicator'),
            
            // Recipes
            recipesGrid: document.getElementById('recipes-grid'),
            recipesEmptyState: document.getElementById('recipes-empty-state'),
            
            // Print
            printTitle: document.getElementById('print-title'),
            printYield: document.getElementById('print-yield'),
            printTable: document.getElementById('print-table'),
            
            // Confirmation Modal
            confirmationModal: document.getElementById('confirmation-modal'),
            confirmationTitle: document.getElementById('confirmation-title'),
            confirmationMessage: document.getElementById('confirmation-message'),
            confirmationCancel: document.getElementById('confirmation-cancel'),
            confirmationConfirm: document.getElementById('confirmation-confirm'),
            
            // PIN Modals
            pinModal: document.getElementById('pin-modal'),
            pinTitle: document.getElementById('pin-title'),
            pinMessage: document.getElementById('pin-message'),
            pinInput: document.getElementById('pin-input'),
            pinError: document.getElementById('pin-error'),
            pinCancel: document.getElementById('pin-cancel'),
            pinSubmit: document.getElementById('pin-submit'),
            
            pinSetupModal: document.getElementById('pin-setup-modal'),
            pinSetupTitle: document.getElementById('pin-setup-title'),
            pinSetupMessage: document.getElementById('pin-setup-message'),
            pinSetupInput: document.getElementById('pin-setup-input'),
            pinConfirmInput: document.getElementById('pin-confirm-input'),
            pinSetupError: document.getElementById('pin-setup-error'),
            pinConfirmError: document.getElementById('pin-confirm-error'),
            pinSetupCancel: document.getElementById('pin-setup-cancel'),
            pinSetupSubmit: document.getElementById('pin-setup-submit'),
            
            // Welcome modal elements
            welcomeModal: document.getElementById('welcome-modal'),
            welcomeUnderstand: document.getElementById('welcome-understand'),
            
        };
        
        // Make global functions available
        window.showToast = showToast;
        window.openIngredientModal = openIngredientModal;
        window.closeIngredientModal = closeIngredientModal;
        window.convertWithDensity = convertWithDensity;
        window.UNIT_CONVERSIONS = UNIT_CONVERSIONS;
        
        // Initialize app
        loadRecipes();
        navigateToPage('scaler');
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize menu management
        if (typeof initializeMenuManagement === 'function') {
            initializeMenuManagement();
        }
        
        // Initialize shopping list
        if (typeof initializeShoppingList === 'function') {
            initializeShoppingList();
        }
        
        // Initialize PDF management
        if (typeof initializePDFManagement === 'function') {
            initializePDFManagement();
        }
        
        // Initialize stores management
        if (typeof initializeStoresManagement === 'function') {
            initializeStoresManagement();
        }
        
        // Initialize export system
        if (typeof initializeExportSystem === 'function') {
            initializeExportSystem();
        }
        
        // Initialize sub-tab navigation
        initializeSubTabNavigation();
        
        // IMPORTANT: Initialize temp tabs LAST so event listeners override any others
        if (typeof initializeTempTabs === 'function') {
            // Small delay to ensure DOM is fully ready
            setTimeout(() => {
                initializeTempTabs();
            }, 100);
        }
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

function setupEventListeners() {
    // Hash change event for browser back/forward buttons
    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial page based on hash
    const initialHash = window.location.hash.slice(1);
    if (initialHash) {
        // Delay to ensure DOM is ready
        setTimeout(() => navigateToPage(initialHash, true), 100);
    }
    
    // Navigation
    window.dom.allNavItems.forEach(item => item.addEventListener('click', () => navigateToPage(item.dataset.page)));
    window.dom.sidebarToggle?.addEventListener('click', () => window.dom.appContainer.classList.toggle('sidebar-collapsed'));
    // Mobile menu button removed - now using bottom navigation bar
    // window.dom.mobileMenuButton?.addEventListener('click', () => window.dom.mobileSidebar.classList.remove('hidden'));
    window.dom.closeMobileMenu?.addEventListener('click', () => window.dom.mobileSidebar.classList.add('hidden'));
    window.dom.mobileSidebarOverlay?.addEventListener('click', () => window.dom.mobileSidebar.classList.add('hidden'));

    // Scaler
    window.dom.processRecipeBtn?.addEventListener('click', () => {
        // Validation: Check if recipe input has content before processing
        const recipeInput = getElement('recipe-input');
        if (recipeInput && !recipeInput.value.trim()) {
            showToast('Please enter a recipe before processing', 'error');
            recipeInput.focus();
            return;
        }
        processAndDisplay(true);
    });
    
    window.dom.pasteRecipeBtn?.addEventListener('click', () => {
        navigator.clipboard.readText().then(text => {
            if (text && text.trim()) {
                window.dom.recipeInput.value = text;
                showToast('Recipe pasted successfully!', 'success');
            } else {
                showToast('Clipboard is empty', 'warning');
            }
        }).catch(() => {
            showToast('Unable to access clipboard. Please paste manually (Ctrl+V).', 'error');
        });
    });
    
    const importRecipeBtn = getElement('import-recipe-btn');
    if (importRecipeBtn) {
        importRecipeBtn.addEventListener('click', () => {
            showImportRecipeModal();
        });
    }
    
    window.dom.saveRecipeBtn?.addEventListener('click', () => saveCurrentRecipe());
    
    window.dom.downloadRecipeBtn?.addEventListener('click', () => {
        // Validation: Check if there's a recipe to download
        if (!scaledIngredients || scaledIngredients.length === 0) {
            showToast('Please scale a recipe first', 'error');
            return;
        }
        
        const recipeName = getElement('recipe-title')?.value?.trim() || 'Scaled Recipe';
        const originalServings = getElement('original-yield')?.value;
        const targetServings = getElement('desired-yield')?.value;
        
        // Validation: Ensure yield values are valid
        if (!originalServings || !targetServings || isNaN(parseFloat(originalServings)) || isNaN(parseFloat(targetServings))) {
            showToast('Invalid yield values. Please check your recipe.', 'error');
            return;
        }
        
        const recipe = {
            name: recipeName,
            originalServings: parseFloat(originalServings),
            targetServings: parseFloat(targetServings),
            ingredients: scaledIngredients
        };
        
        showExportFormatModal('single-recipe', recipe);
    });
    window.dom.printRecipeBtn?.addEventListener('click', () => printRecipe());
    window.dom.goToScalerBtn?.addEventListener('click', () => navigateToPage('scaler'));
    
    // Note: Add Recipe button listeners are now in temptabs.js
    // to properly open the Create Recipe temp tab instead of old modal
    
    const exportRecipesBtn = getElement('export-recipes-btn');
    if (exportRecipesBtn) exportRecipesBtn.addEventListener('click', () => {
        try {
            const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
            
            // Validation: Check if there are recipes to export
            if (!savedRecipes || savedRecipes.length === 0) {
                showToast('No recipes to export. Create some recipes first!', 'warning');
                return;
            }
            
            // Show count of recipes being exported
            showToast(`Preparing to export ${savedRecipes.length} recipe(s)...`, 'info');
            showExportFormatModal('recipes', savedRecipes);
        } catch (error) {
            console.error('Error loading recipes for export:', error);
            showToast('Error loading recipes. Please try again.', 'error');
        }
    });
    
    // Calculator
    window.dom.calculator?.addEventListener('click', (e) => { 
        const btn = e.target.closest('button'); 
        if (btn && window.calculatorModule) {
            window.calculatorModule.handleClick(btn); 
        }
    });
    
    
    // Initialize PIN protection
    initializePinProtection();
    
    // Initialize share functionality
    initializeShareFunctionality();
    
    // Initialize welcome modal
    initializeWelcomeModal();
    
    // Initialize density manager
    const manageDensitiesBtn = getElement('manage-densities-btn');
    if (manageDensitiesBtn) {
        manageDensitiesBtn.addEventListener('click', showDensityManager);
    }
    
    // Initialize complete data backup
    const downloadAllDataBtn = getElement('download-all-data-btn');
    if (downloadAllDataBtn) {
        downloadAllDataBtn.addEventListener('click', downloadCompleteBackup);
    }
}

// Complete data backup function
function downloadCompleteBackup() {
    try {
        // Show loading state
        const btn = getElement('download-all-data-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Creating Backup...';
        }
        
        // Gather all data
        const allData = {
            recipes: JSON.parse(localStorage.getItem('savedRecipes') || '[]'),
            menus: storage.get('yieldr_menus', []),
            shoppingList: storage.get('yieldr_shopping_list', {}),
            shoppingCategories: storage.get('yieldr_shopping_categories', []),
            stores: storage.get('yieldr_stores', []),
            pdfs: storage.get('yieldr_pdfs', []),
            customDensities: storage.get('custom_densities', {}),
            settings: {
                darkMode: localStorage.getItem('darkMode'),
                selectedTheme: localStorage.getItem('selectedTheme'),
                pinProtectionEnabled: localStorage.getItem('pinProtectionEnabled'),
                pinProtectionShoppingEnabled: localStorage.getItem('pinProtectionShoppingEnabled'),
                pinProtectionEntryEnabled: localStorage.getItem('pinProtectionEntryEnabled'),
                pinRememberMinutes: localStorage.getItem('pinRememberMinutes')
            },
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        // Check if there's actually data to backup
        const hasData = allData.recipes.length > 0 || 
                       allData.menus.length > 0 || 
                       Object.keys(allData.shoppingList).length > 0 ||
                       allData.stores.length > 0 ||
                       allData.pdfs.length > 0;
        
        if (!hasData) {
            showToast('No data to backup. Start creating recipes, menus, or shopping lists first!', 'warning');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><use href="#icon-download"></use></svg> Download Complete Backup';
            }
            return;
        }
        
        // Create JSON backup
        const content = JSON.stringify(allData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chefos_complete_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Restore button state
        if (btn) {
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><use href="#icon-download"></use></svg> Download Complete Backup';
            }, 1000);
        }
        
        showToast('Complete backup downloaded successfully!', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showToast('Error creating backup. Please try again.', 'error');
        
        // Restore button state on error
        const btn = getElement('download-all-data-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><use href="#icon-download"></use></svg> Download Complete Backup';
        }
    }
}

// Additional functions that need to be defined
function saveCurrentRecipe() {
    // Validation: Check if there's a recipe to save
    if (!scaledIngredients || scaledIngredients.length === 0) {
        showToast('Please scale a recipe first before saving', 'error');
        return;
    }
    
    // Validation: Check if recipe has been processed
    const recipeInput = getElement('recipe-input');
    if (recipeInput && !recipeInput.value.trim()) {
        showToast('Please enter a recipe first', 'error');
        return;
    }
    
    requirePinProtection(() => {
        performSaveRecipe();
    });
}

function performSaveRecipe() {
    const recipeName = getElement('recipe-title')?.value?.trim() || 'Scaled Recipe';
    const originalServings = getElement('original-yield')?.value;
    const targetServings = getElement('desired-yield')?.value;
    
    // Validation: Check if recipe name is empty after trimming
    if (!recipeName || recipeName === '') {
        showToast('Please enter a recipe name', 'error');
        return;
    }
    
    // Validation: Check servings values
    if (!originalServings || !targetServings) {
        showToast('Please enter yield values', 'error');
        return;
    }
    
    const origServ = parseFloat(originalServings);
    const targServ = parseFloat(targetServings);
    
    if (isNaN(origServ) || isNaN(targServ) || origServ <= 0 || targServ <= 0) {
        showToast('Invalid yield values. Must be positive numbers.', 'error');
        return;
    }
    
    const recipe = {
        id: Date.now().toString(),
        name: recipeName,
        originalServings: origServ,
        targetServings: targServ,
        ingredients: scaledIngredients.map(ing => ({...ing})), // Deep copy
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'scaled'
    };
    
    try {
        // Save to localStorage
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        
        // Check for duplicate names
        const duplicateIndex = savedRecipes.findIndex(r => r.name.toLowerCase() === recipeName.toLowerCase());
        if (duplicateIndex >= 0) {
            // Ask user if they want to overwrite
            if (confirm(`A recipe named "${recipeName}" already exists. Do you want to overwrite it?`)) {
                savedRecipes[duplicateIndex] = recipe;
                showToast('Recipe updated successfully!', 'success');
            } else {
                return; // User cancelled
            }
        } else {
            savedRecipes.push(recipe);
            showToast('Recipe saved successfully!', 'success');
        }
        
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        
        // Refresh recipes list if on recipes page
        const recipesPage = getElement('recipes-page');
        if (recipesPage && recipesPage.classList.contains('active')) {
            loadSavedRecipes();
        }
    } catch (error) {
        console.error('Error saving recipe:', error);
        showToast('Failed to save recipe. Storage might be full.', 'error');
    }
}

function loadSavedRecipes() {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const recipesGrid = getElement('recipes-grid');
    const emptyState = getElement('recipes-empty-state');
    
    if (!recipesGrid || !emptyState) return;
    
    if (savedRecipes.length === 0) {
        recipesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        // Update search bar visibility
        if (typeof window.updateSearchBarVisibility === 'function') {
            window.updateSearchBarVisibility();
        }
        return;
    }
    
    recipesGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    recipesGrid.innerHTML = savedRecipes.map(recipe => {
        const yieldText = recipe.yieldUnit 
            ? `${recipe.originalServings} ${recipe.yieldUnit}`
            : `${recipe.originalServings} servings`;
        
        const scaledText = recipe.type === 'scaled' && recipe.originalServings !== recipe.targetServings
            ? `Scaled from ${recipe.originalServings} to ${recipe.targetServings} servings`
            : `Yield: ${yieldText}`;
        
        const dateLabel = recipe.updatedAt 
            ? new Date(recipe.updatedAt).toLocaleDateString()
            : new Date(recipe.createdAt).toLocaleDateString();
        
        // Check if recipe has an image
        const hasImage = recipe.image && recipe.image.length > 0;
        
        return `
        <div class="card bg-base-100 shadow-xl ${hasImage ? 'recipe-card-with-image' : ''}">
            ${hasImage ? `<img src="${recipe.image}" alt="${escapeHtml(recipe.name)}" class="recipe-card-image">` : ''}
            <div class="${hasImage ? 'recipe-card-content' : 'card-body'}">
                <div class="flex items-start justify-between mb-2">
                    <h2 class="card-title text-lg">${escapeHtml(recipe.name)}</h2>
                    <span class="badge" style="background-color: var(--accent-color); color: white;">${dateLabel}</span>
                </div>
                <p class="text-sm opacity-70">${scaledText}</p>
                <p class="text-sm opacity-70">${recipe.ingredients.length} ingredients</p>
                <div class="card-actions justify-end mt-4 flex-wrap gap-2">
                    <button class="btn btn-sm btn-primary" onclick="scaleRecipe('${recipe.id}')">Scale</button>
                    <button class="btn btn-sm btn-ghost" onclick="editRecipe('${recipe.id}')">Edit</button>
                    <button class="btn btn-sm btn-error" onclick="deleteRecipe('${recipe.id}')">Delete</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function viewRecipe(recipeId) {
    requirePinProtection(() => {
        performViewRecipe(recipeId);
    });
}

function performViewRecipe(recipeId) {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const recipe = savedRecipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        showToast('Recipe not found', 'error');
        return;
    }
    
    // Navigate to scaler and populate with recipe data
    navigateToPage('scaler');
    
    // Populate the form
    if (window.dom.recipeTitle) window.dom.recipeTitle.value = recipe.name;
    if (window.dom.originalYield) window.dom.originalYield.value = recipe.originalServings;
    if (window.dom.desiredYield) window.dom.desiredYield.value = recipe.targetServings || recipe.originalServings;
    
    // Populate ingredients textarea
    if (window.dom.recipeInput) {
        const ingredientsText = recipe.ingredients.map(ing => 
            `${ing.rawQty || ing.quantity} ${ing.unit} ${ing.name}`
        ).join('\n');
        window.dom.recipeInput.value = ingredientsText;
    }
    
    // Set the scaled ingredients and display results
    scaledIngredients = recipe.ingredients;
    currentIngredients = recipe.ingredients;
    
    // Show output section
    const outputSection = getElement('output-section');
    if (outputSection) outputSection.style.display = 'block';
    
    // Update yield summary
    const yieldSummary = getElement('yield-summary');
    if (yieldSummary) {
        if (recipe.type === 'scaled' && recipe.originalServings !== recipe.targetServings) {
            yieldSummary.textContent = `From ${recipe.originalServings} to ${recipe.targetServings} servings`;
        } else {
            const yieldText = recipe.yieldUnit 
                ? `${recipe.originalServings} ${recipe.yieldUnit}`
                : `${recipe.originalServings} servings`;
            yieldSummary.textContent = `Yield: ${yieldText}`;
        }
    }
    
    renderResults(scaledIngredients);
    
    showToast('Recipe loaded successfully!', 'success');
}


function downloadRecipe() {
    if (!scaledIngredients || scaledIngredients.length === 0) {
        showToast('No scaled recipe to download', 'error');
        return;
    }
    
    const recipeName = getElement('recipe-title')?.value || 'Scaled Recipe';
    const originalServings = getElement('original-yield')?.value || 'Unknown';
    const targetServings = getElement('desired-yield')?.value || 'Unknown';
    
    // Create recipe content
    let content = `${recipeName}\n`;
    content += `Scaled from ${originalServings} to ${targetServings} servings\n`;
    content += `Generated on ${new Date().toLocaleDateString()}\n\n`;
    content += `INGREDIENTS:\n`;
    content += `============\n\n`;
    
    scaledIngredients.forEach(ing => {
        const scaledQty = formatKitchenQuantity(ing.scaledQty, ing.scaledUnit);
        content += `• ${scaledQty} ${ing.name}\n`;
    });
    
    content += `\n\nINSTRUCTIONS:\n`;
    content += `=============\n\n`;
    content += `1. Preheat oven as directed in original recipe\n`;
    content += `2. Mix ingredients in the order specified\n`;
    content += `3. Adjust baking time for larger batch (typically 1.2-1.5x longer)\n`;
    content += `4. Check doneness with toothpick test\n\n`;
    content += `Note: This recipe has been scaled using ChefOS\n`;
    content += `For best results, consider dividing into multiple pans if needed.`;
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scaled.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Recipe downloaded successfully!', 'success');
}

// Export all recipes
function exportAllRecipes() {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    
    if (savedRecipes.length === 0) {
        showToast('No recipes to export', 'error');
        return;
    }
    
    let content = 'MY RECIPES - ChefOS\n';
    content += '='.repeat(30) + '\n\n';
    content += `Exported on ${new Date().toLocaleDateString()}\n\n`;
    
    savedRecipes.forEach((recipe, index) => {
        content += `RECIPE ${index + 1}: ${recipe.name}\n`;
        content += '='.repeat(50) + '\n';
        
        // Handle both scaled and direct recipes
        if (recipe.type === 'scaled' && recipe.originalServings !== recipe.targetServings) {
            content += `Scaled from ${recipe.originalServings} to ${recipe.targetServings} servings\n\n`;
        } else {
            const yieldText = recipe.yieldUnit 
                ? `${recipe.originalServings} ${recipe.yieldUnit}`
                : `${recipe.originalServings} servings`;
            content += `Yield: ${yieldText}\n\n`;
        }
        
        content += `INGREDIENTS:\n`;
        content += '-'.repeat(50) + '\n';
        
        recipe.ingredients.forEach(ing => {
            const scaledQty = formatKitchenQuantity(ing.scaledQty || ing.quantity, ing.scaledUnit || ing.unit);
            content += `• ${scaledQty} ${ing.name}\n`;
        });
        
        content += '\n';
        
        // Add instructions if available
        if (recipe.instructions) {
            content += `INSTRUCTIONS:\n`;
            content += '-'.repeat(50) + '\n';
            content += `${recipe.instructions}\n\n`;
        }
    });
    
    content += '\n' + '='.repeat(50) + '\n';
    content += `Total Recipes: ${savedRecipes.length}\n`;
    content += 'Exported from ChefOS\n';
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chefos_recipes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Recipes exported successfully!', 'success');
}

function printRecipe() {
    if (!scaledIngredients || scaledIngredients.length === 0) {
        showToast('No scaled recipe to print', 'error');
        return;
    }
    
    const recipeName = getElement('recipe-title')?.value || 'Scaled Recipe';
    const originalServings = getElement('original-yield')?.value || 'Unknown';
    const targetServings = getElement('desired-yield')?.value || 'Unknown';
    
    // Update print area content
    const printTitle = getElement('print-title');
    const printYield = getElement('print-yield');
    const printTable = getElement('print-table');
    
    if (printTitle) printTitle.textContent = recipeName;
    if (printYield) printYield.textContent = `Scaled from ${originalServings} to ${targetServings} servings - Generated on ${new Date().toLocaleDateString()}`;
    
    if (printTable) {
        printTable.innerHTML = `
            <thead>
                <tr class="border-b">
                    <th class="text-left py-2 font-semibold">Ingredient</th>
                    <th class="text-right py-2 font-semibold">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${scaledIngredients.map(ing => {
                    const unit = ing.scaledUnit;
                    const qty = unit ? formatKitchenQuantity(ing.scaledQty, unit) : ing.scaledQty.toString();
                    return `
                    <tr class="border-b">
                        <td class="py-2">${escapeHtml(ing.name)}</td>
                        <td class="text-right py-2 font-medium">${escapeHtml(qty)}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        `;
    }
    
    // Show print area and print
    const printArea = getElement('print-area');
    if (printArea) {
        printArea.classList.remove('hidden');
        
        // Print after a short delay to ensure content is rendered
        setTimeout(() => {
            window.print();
            printArea.classList.add('hidden');
        }, 100);
    }
}

// Custom confirmation modal functions
function showConfirmation(title, message, onConfirm) {
    const modal = getElement('confirmation-modal');
    const titleEl = getElement('confirmation-title');
    const messageEl = getElement('confirmation-message');
    const cancelBtn = getElement('confirmation-cancel');
    const confirmBtn = getElement('confirmation-confirm');
    
    if (!modal || !titleEl || !messageEl || !cancelBtn || !confirmBtn) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Remove any existing event listeners
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newConfirmBtn = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listeners
    newCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    newConfirmBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (onConfirm) onConfirm();
    });
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Close modal when clicking outside
    const handleOverlayClick = (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            modal.removeEventListener('click', handleOverlayClick);
        }
    };
    modal.addEventListener('click', handleOverlayClick);
}

function deleteRecipe(recipeId) {
    requirePinProtection(() => {
        showConfirmation(
            'Delete Recipe',
            'Are you sure you want to delete this recipe? This action cannot be undone.',
            () => {
                const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
                const filteredRecipes = savedRecipes.filter(r => r.id !== recipeId);
                localStorage.setItem('savedRecipes', JSON.stringify(filteredRecipes));
                
                loadSavedRecipes();
                showToast('Recipe deleted successfully!', 'success');
            }
        );
    });
}

// PIN Protection System
let pinProtectionEnabled = false;
let pinProtectionShoppingEnabled = false;
let pinProtectionEntryEnabled = false;
let storedPIN = null;
let pinAttempts = 0;
const maxPinAttempts = 3;
let pinRememberTimeout = null;
let pinLastVerified = null;

function initializePinProtection() {
    // Load PIN settings from localStorage
    pinProtectionEnabled = localStorage.getItem('pinProtectionEnabled') === 'true';
    pinProtectionShoppingEnabled = localStorage.getItem('pinProtectionShoppingEnabled') === 'true';
    pinProtectionEntryEnabled = localStorage.getItem('pinProtectionEntryEnabled') === 'true';
    storedPIN = localStorage.getItem('storedPIN');
    
    // Update UI
    const toggle = getElement('protect-recipes-toggle');
    const shoppingToggle = getElement('protect-shopping-toggle');
    const entryToggle = getElement('protect-entry-toggle');
    const changePinContainer = getElement('change-pin-container');
    const pinRememberContainer = getElement('pin-remember-container');
    const pinRememberMinutes = getElement('pin-remember-minutes');
    
    if (toggle) {
        toggle.checked = pinProtectionEnabled;
        toggle.addEventListener('change', handlePinToggle);
    }
    
    if (shoppingToggle) {
        shoppingToggle.checked = pinProtectionShoppingEnabled;
        shoppingToggle.addEventListener('change', handleShoppingPinToggle);
    }
    
    if (entryToggle) {
        entryToggle.checked = pinProtectionEntryEnabled;
        entryToggle.addEventListener('change', handleEntryPinToggle);
    }
    
    const anyProtectionEnabled = pinProtectionEnabled || pinProtectionShoppingEnabled || pinProtectionEntryEnabled;
    
    if (changePinContainer) {
        changePinContainer.style.display = anyProtectionEnabled ? 'block' : 'none';
    }
    
    if (pinRememberContainer) {
        pinRememberContainer.style.display = anyProtectionEnabled ? 'block' : 'none';
    }
    
    if (pinRememberMinutes) {
        const savedMinutes = localStorage.getItem('pinRememberMinutes') || '15';
        pinRememberMinutes.value = savedMinutes;
        pinRememberMinutes.addEventListener('change', () => {
            localStorage.setItem('pinRememberMinutes', pinRememberMinutes.value);
            showToast('PIN remember duration updated', 'success');
        });
    }
    
    const changePinBtn = getElement('change-pin-btn');
    if (changePinBtn) {
        changePinBtn.addEventListener('click', () => showPinSetupModal('change'));
    }
    
    // Update lock icons
    updateRecipesLockIcon();
    updateShoppingLockIcon();
    
    // Check for PIN on entry if enabled (flag set in pre-load script)
    if (window.needsPinOnEntry) {
        checkPinOnEntry();
    }
}

function updateRecipesLockIcon() {
    const recipesLockIcon = getElement('recipes-lock-icon');
    const mobileRecipesLockIcon = getElement('mobile-recipes-lock-icon');
    const menusLockIcon = getElement('menus-lock-icon');
    const mobileMenusLockIcon = getElement('mobile-menus-lock-icon');
    
    const updateIcon = (icon) => {
        if (icon) {
            if (pinProtectionEnabled && storedPIN) {
                icon.innerHTML = '<use href="#icon-lock"></use>';
                icon.classList.remove('hidden');
            } else {
                icon.innerHTML = '<use href="#icon-unlock"></use>';
                icon.classList.remove('hidden');
            }
        }
    };
    
    updateIcon(recipesLockIcon);
    updateIcon(mobileRecipesLockIcon);
    updateIcon(menusLockIcon);
    updateIcon(mobileMenusLockIcon);
}

function updateShoppingLockIcon() {
    const shoppingLockIcon = getElement('shopping-lock-icon');
    const mobileShoppingLockIcon = getElement('mobile-shopping-lock-icon');
    
    const updateIcon = (icon) => {
        if (icon) {
            if (pinProtectionShoppingEnabled && storedPIN) {
                icon.innerHTML = '<use href="#icon-lock"></use>';
                icon.classList.remove('hidden');
            } else {
                icon.innerHTML = '<use href="#icon-unlock"></use>';
                icon.classList.remove('hidden');
            }
        }
    };
    
    updateIcon(shoppingLockIcon);
    updateIcon(mobileShoppingLockIcon);
}

function initializeShareFunctionality() {
    const shareButton = getElement('share-with-friends');
    if (shareButton) {
        shareButton.addEventListener('click', shareWithFriends);
    }
}

function shareWithFriends() {
    const url = window.location.href;
    const shareText = "Check out ChefOS - the ultimate professional kitchen management system! 🍳✨";
    
    // Try to use the Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'ChefOS',
            text: shareText,
            url: url
        }).then(() => {
            showToast('Shared successfully!', 'success');
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare(url, shareText);
        });
    } else {
        // Fallback to clipboard copy
        fallbackShare(url, shareText);
    }
}

function fallbackShare(url, text) {
    const shareMessage = `${text}\n\n${url}`;
    
    // Try to copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareMessage).then(() => {
            showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            showShareModal(shareMessage);
        });
    } else {
        showShareModal(shareMessage);
    }
}

function showShareModal(shareMessage) {
    // Create a simple modal for sharing
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-base-100 rounded-3xl p-6 max-w-md mx-4 shadow-2xl border border-base-300">
            <div class="flex items-center mb-4">
                <div class="w-10 h-10 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <use href="#icon-share"></use>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-base-content">Share with Friends</h3>
            </div>
            <p class="text-base-content/70 mb-4">Copy this message to share:</p>
            <textarea class="textarea textarea-bordered w-full h-24 mb-4 text-sm" readonly>${shareMessage}</textarea>
            <div class="flex gap-3 justify-end">
                <button id="copy-share-text" class="btn btn-primary btn-sm">Copy Text</button>
                <button id="close-share-modal" class="btn btn-outline btn-sm">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const copyButton = modal.querySelector('#copy-share-text');
    const closeButton = modal.querySelector('#close-share-modal');
    
    copyButton.addEventListener('click', () => {
        const textarea = modal.querySelector('textarea');
        textarea.select();
        document.execCommand('copy');
        showToast('Text copied to clipboard!', 'success');
    });
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function initializeWelcomeModal() {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    if (!hasSeenWelcome) {
        // Show welcome modal
        if (dom.welcomeModal) {
            dom.welcomeModal.classList.remove('hidden');
        }
        
        // Add event listener to the understand button
        if (dom.welcomeUnderstand) {
            dom.welcomeUnderstand.addEventListener('click', () => {
                // Mark as seen and hide modal
                localStorage.setItem('hasSeenWelcome', 'true');
                if (dom.welcomeModal) {
                    dom.welcomeModal.classList.add('hidden');
                }
            });
        }
    } else {
        // Hide modal if already seen
        if (dom.welcomeModal) {
            dom.welcomeModal.classList.add('hidden');
        }
    }
}

function handlePinToggle() {
    const toggle = getElement('protect-recipes-toggle');
    const changePinContainer = getElement('change-pin-container');
    const pinRememberContainer = getElement('pin-remember-container');
    
    if (toggle.checked) {
        if (!storedPIN) {
            showPinSetupModal('recipes');
        } else {
            pinProtectionEnabled = true;
            localStorage.setItem('pinProtectionEnabled', 'true');
            updatePinContainerVisibility();
            updateRecipesLockIcon();
            showToast('PIN protection enabled for recipes & menus', 'success');
        }
    } else {
        // Require PIN to disable PIN protection
        requirePinProtection(() => {
            showConfirmation(
                'Disable PIN Protection',
                'Are you sure you want to disable PIN protection? Your recipes and menus will no longer be protected.',
                () => {
                    pinProtectionEnabled = false;
                    localStorage.setItem('pinProtectionEnabled', 'false');
                    updatePinContainerVisibility();
                    updateRecipesLockIcon();
                    showToast('PIN protection disabled for recipes & menus', 'info');
                }
            );
        });
    }
}

function handleShoppingPinToggle() {
    const toggle = getElement('protect-shopping-toggle');
    
    if (toggle.checked) {
        if (!storedPIN) {
            showPinSetupModal('shopping');
        } else {
            pinProtectionShoppingEnabled = true;
            localStorage.setItem('pinProtectionShoppingEnabled', 'true');
            updatePinContainerVisibility();
            updateShoppingLockIcon();
            showToast('PIN protection enabled for shopping list', 'success');
        }
    } else {
        // Require PIN to disable PIN protection
        requirePinProtectionForShopping(() => {
            showConfirmation(
                'Disable PIN Protection',
                'Are you sure you want to disable PIN protection? Your shopping list will no longer be protected.',
                () => {
                    pinProtectionShoppingEnabled = false;
                    localStorage.setItem('pinProtectionShoppingEnabled', 'false');
                    updatePinContainerVisibility();
                    updateShoppingLockIcon();
                    showToast('PIN protection disabled for shopping list', 'info');
                }
            );
        });
    }
}

function handleEntryPinToggle() {
    const toggle = getElement('protect-entry-toggle');
    
    if (toggle.checked) {
        if (!storedPIN) {
            showPinSetupModal('entry');
        } else {
            pinProtectionEntryEnabled = true;
            localStorage.setItem('pinProtectionEntryEnabled', 'true');
            updatePinContainerVisibility();
            showToast('PIN required on app entry enabled', 'success');
        }
    } else {
        // Require PIN to disable
        requirePinVerification(() => {
            showConfirmation(
                'Disable PIN on Entry',
                'Are you sure you want to disable PIN requirement on app entry?',
                () => {
                    pinProtectionEntryEnabled = false;
                    localStorage.setItem('pinProtectionEntryEnabled', 'false');
                    updatePinContainerVisibility();
                    showToast('PIN on entry disabled', 'info');
                }
            );
        });
    }
}

function updatePinContainerVisibility() {
    const anyProtectionEnabled = pinProtectionEnabled || pinProtectionShoppingEnabled || pinProtectionEntryEnabled;
    const changePinContainer = getElement('change-pin-container');
    const pinRememberContainer = getElement('pin-remember-container');
    
    if (changePinContainer) {
        changePinContainer.style.display = anyProtectionEnabled ? 'block' : 'none';
    }
    if (pinRememberContainer) {
        pinRememberContainer.style.display = anyProtectionEnabled ? 'block' : 'none';
    }
}

function showPinModal(title, message, onSuccess) {
    const modal = getElement('pin-modal');
    const titleEl = getElement('pin-title');
    const messageEl = getElement('pin-message');
    const input = getElement('pin-input');
    const errorEl = getElement('pin-error');
    const cancelBtn = getElement('pin-cancel');
    const submitBtn = getElement('pin-submit');
    
    if (!modal || !titleEl || !messageEl || !input || !errorEl || !cancelBtn || !submitBtn) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    input.value = '';
    errorEl.classList.add('hidden');
    
    // Remove existing event listeners
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newSubmitBtn = submitBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    // Add new event listeners
    newCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        pinAttempts = 0;
        
        // If this is entry PIN, keep everything hidden
        if (window.needsPinOnEntry && !isPinRemembered()) {
            // Do nothing - everything stays hidden
        } else {
            // Navigate back to scaler page when canceling PIN
            navigateToPage('scaler');
        }
    });
    
    newSubmitBtn.addEventListener('click', () => {
        const enteredPIN = input.value;
        if (enteredPIN === storedPIN) {
            modal.classList.add('hidden');
            pinAttempts = 0;
            rememberPinVerification(); // Remember the PIN verification
            if (onSuccess) onSuccess();
        } else {
            pinAttempts++;
            errorEl.classList.remove('hidden');
            input.value = '';
            input.focus();
            
            if (pinAttempts >= maxPinAttempts) {
                showToast('Too many failed attempts. Please try again later.', 'error');
                modal.classList.add('hidden');
                pinAttempts = 0;
                
                // If this is entry PIN, keep everything hidden
                if (window.needsPinOnEntry) {
                    // Everything stays hidden - they'll need to refresh
                }
            }
        }
    });
    
    // Handle Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            newSubmitBtn.click();
        }
    });
    
    // Show modal and focus input
    modal.classList.remove('hidden');
    input.focus();
}

function showPinSetupModal(context = 'recipes') {
    const modal = getElement('pin-setup-modal');
    const titleEl = getElement('pin-setup-title');
    const messageEl = getElement('pin-setup-message');
    const input = getElement('pin-setup-input');
    const confirmInput = getElement('pin-confirm-input');
    const errorEl = getElement('pin-setup-error');
    const confirmErrorEl = getElement('pin-confirm-error');
    const cancelBtn = getElement('pin-setup-cancel');
    const submitBtn = getElement('pin-setup-submit');
    
    if (!modal || !titleEl || !messageEl || !input || !confirmInput || !errorEl || !confirmErrorEl || !cancelBtn || !submitBtn) return;
    
    titleEl.textContent = storedPIN ? 'Change PIN' : 'Set Up PIN';
    messageEl.textContent = storedPIN ? 'Enter a new 4-6 digit PIN' : 'Create a 4-6 digit PIN to protect your data';
    input.value = '';
    confirmInput.value = '';
    errorEl.classList.add('hidden');
    confirmErrorEl.classList.add('hidden');
    
    // Remove existing event listeners
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newSubmitBtn = submitBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    // Add new event listeners
    newCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        // Reset toggles if PIN setup was cancelled
        if (!storedPIN) {
            const toggle = getElement('protect-recipes-toggle');
            const shoppingToggle = getElement('protect-shopping-toggle');
            const entryToggle = getElement('protect-entry-toggle');
            if (toggle && context === 'recipes') toggle.checked = false;
            if (shoppingToggle && context === 'shopping') shoppingToggle.checked = false;
            if (entryToggle && context === 'entry') entryToggle.checked = false;
        }
    });
    
    newSubmitBtn.addEventListener('click', () => {
        const newPIN = input.value;
        const confirmPIN = confirmInput.value;
        
        // Validate PIN
        if (newPIN.length < 4 || newPIN.length > 6 || !/^\d+$/.test(newPIN)) {
            errorEl.classList.remove('hidden');
            return;
        }
        
        if (newPIN !== confirmPIN) {
            confirmErrorEl.classList.remove('hidden');
            return;
        }
        
        // Save PIN (only one PIN for all features)
        const isNewPIN = !storedPIN;
        storedPIN = newPIN;
        localStorage.setItem('storedPIN', storedPIN);
        
        // Enable protection based on context (only for new PIN setup)
        if (isNewPIN) {
            if (context === 'recipes') {
                pinProtectionEnabled = true;
                localStorage.setItem('pinProtectionEnabled', 'true');
            } else if (context === 'shopping') {
                pinProtectionShoppingEnabled = true;
                localStorage.setItem('pinProtectionShoppingEnabled', 'true');
            } else if (context === 'entry') {
                pinProtectionEntryEnabled = true;
                localStorage.setItem('pinProtectionEntryEnabled', 'true');
            }
        } else {
            // If changing PIN, keep existing settings
            pinProtectionEnabled = localStorage.getItem('pinProtectionEnabled') === 'true';
            pinProtectionShoppingEnabled = localStorage.getItem('pinProtectionShoppingEnabled') === 'true';
            pinProtectionEntryEnabled = localStorage.getItem('pinProtectionEntryEnabled') === 'true';
        }
        
        // Update UI
        const toggle = getElement('protect-recipes-toggle');
        const shoppingToggle = getElement('protect-shopping-toggle');
        const entryToggle = getElement('protect-entry-toggle');
        if (toggle) toggle.checked = pinProtectionEnabled;
        if (shoppingToggle) shoppingToggle.checked = pinProtectionShoppingEnabled;
        if (entryToggle) entryToggle.checked = pinProtectionEntryEnabled;
        
        updatePinContainerVisibility();
        updateRecipesLockIcon();
        updateShoppingLockIcon();
        
        modal.classList.add('hidden');
        showToast(isNewPIN ? 'PIN set up successfully!' : 'PIN changed successfully!', 'success');
    });
    
    // Show modal and focus input
    modal.classList.remove('hidden');
    input.focus();
}

function isPinRemembered() {
    if (!pinLastVerified) return false;
    
    const rememberMinutes = parseInt(localStorage.getItem('pinRememberMinutes') || '15');
    const now = Date.now();
    const elapsed = (now - pinLastVerified) / 1000 / 60; // minutes
    
    return elapsed < rememberMinutes;
}

function rememberPinVerification() {
    pinLastVerified = Date.now();
    
    // Clear any existing timeout
    if (pinRememberTimeout) {
        clearTimeout(pinRememberTimeout);
    }
    
    // Set new timeout to clear verification
    const rememberMinutes = parseInt(localStorage.getItem('pinRememberMinutes') || '15');
    pinRememberTimeout = setTimeout(() => {
        pinLastVerified = null;
        showToast('PIN session expired', 'info');
    }, rememberMinutes * 60 * 1000);
}

function requirePinVerification(action) {
    // Check if PIN is remembered
    if (isPinRemembered()) {
        action();
        return;
    }
    
    showPinModal(
        'PIN Required',
        'Please enter your PIN',
        () => {
            rememberPinVerification();
            action();
        }
    );
}

function requirePinProtection(action) {
    if (!pinProtectionEnabled || !storedPIN) {
        action();
        return;
    }
    
    requirePinVerification(action);
}

function requirePinProtectionForShopping(action) {
    if (!pinProtectionShoppingEnabled || !storedPIN) {
        action();
        return;
    }
    
    requirePinVerification(action);
}

function checkPinOnEntry() {
    if (!pinProtectionEntryEnabled || !storedPIN) return;
    
    // Check if PIN is remembered from a previous session (within same browser session)
    if (isPinRemembered()) {
        // Remove the hide style and show everything normally
        const hideStyle = document.getElementById('pin-entry-hide-style');
        if (hideStyle) {
            hideStyle.remove();
        }
        startShimmerLoader();
        return;
    }
    
    // Show PIN modal before showing anything
    showPinModal(
        'PIN Required',
        'Please enter your PIN to access ChefOS',
        () => {
            rememberPinVerification();
            
            // Remove the hide style to reveal everything
            const hideStyle = document.getElementById('pin-entry-hide-style');
            if (hideStyle) {
                hideStyle.remove();
            }
            
            // Start shimmer loader animation
            startShimmerLoader();
        }
    );
}

function startShimmerLoader(callback) {
    const shimmerLoader = getElement('shimmer-loader');
    if (!shimmerLoader) return;
    
    // Update shimmer logo to match current theme
    const currentTheme = localStorage.getItem('selectedTheme') || 'forest';
    const shimmerLogo = document.getElementById('shimmer-logo-img');
    if (shimmerLogo) {
        shimmerLogo.src = `ui/img/logo_${currentTheme}.png`;
        shimmerLogo.onerror = function() {
            this.src = 'ui/img/logo.png';
        };
    }
    
    // Force minimum 2 seconds display
    setTimeout(() => {
        shimmerLoader.classList.add('fade-out');
        setTimeout(() => {
            shimmerLoader.style.display = 'none';
            // Call callback if provided
            if (callback && typeof callback === 'function') {
                callback();
            }
        }, 500); // Wait for fade animation
    }, 2000);
}

// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('selectedTheme') || 'forest';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeListeners();
        this.updateThemeSelection();
    }

    applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        localStorage.setItem('selectedTheme', themeName);
        this.updateLogos(themeName);
        this.updateFavicons(themeName);
        
        // If light theme is selected, disable dark mode
        if (themeName === 'light') {
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            if (darkModeToggle && darkModeToggle.checked) {
                darkModeToggle.checked = false;
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        }
    }

    updateLogos(themeName) {
        const logoPath = `ui/img/logo_${themeName}.png`;
        const fallbackPath = 'ui/img/logo.png';
        const logoElements = [
            'desktop-sidebar-logo',
            'mobile-header-logo', 
            'mobile-sidebar-logo'
        ];
        
        logoElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Set the new logo path
                element.src = logoPath;
                
                // Add error handling to fallback to default logo if theme logo doesn't exist
                element.onerror = function() {
                    this.src = fallbackPath;
                    this.onerror = null; // Remove the error handler to prevent infinite loop
                };
            }
        });
    }

    updateFavicons(themeName) {
        const faviconPath = `ui/img/logo_${themeName}.png`;
        const fallbackPath = 'ui/img/logo.png';
        
        // Update favicon
        const favicon = document.getElementById('favicon');
        if (favicon) {
            favicon.href = faviconPath;
        }
        
        // Update apple-touch-icon
        const appleTouchIcon = document.getElementById('apple-touch-icon');
        if (appleTouchIcon) {
            appleTouchIcon.href = faviconPath;
        }
        
        // Also update the document title favicon for better browser support
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/png';
        link.rel = 'shortcut icon';
        link.href = faviconPath;
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    setupThemeListeners() {
        // Custom dropdown for theme selection
        const themeDropdown = document.getElementById('theme-dropdown');
        const themeDropdownButton = document.getElementById('theme-dropdown-button');
        const themeDropdownMenu = document.getElementById('theme-dropdown-menu');
        const themeDropdownItems = document.querySelectorAll('#theme-dropdown-menu .custom-dropdown-item');
        
        if (themeDropdownButton && themeDropdownMenu) {
            // Toggle dropdown
            themeDropdownButton.addEventListener('click', (e) => {
                e.stopPropagation();
                themeDropdown.classList.toggle('open');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!themeDropdown.contains(e.target)) {
                    themeDropdown.classList.remove('open');
                }
            });
            
            // Handle theme selection
            themeDropdownItems.forEach(item => {
                item.addEventListener('click', () => {
                    const themeName = item.getAttribute('data-theme');
                    this.applyTheme(themeName);
                    this.updateThemeSelection();
                    themeDropdown.classList.remove('open');
                });
            });
        }
        
        // Support old theme selectors if they exist
        const themeOptions = document.querySelectorAll('.theme-option, .theme-option-circle');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const themeName = option.getAttribute('data-theme');
                this.applyTheme(themeName);
                this.updateThemeSelection();
            });
        });
    }

    updateThemeSelection() {
        // Update custom dropdown
        const selectedThemeName = document.getElementById('selected-theme-name');
        const selectedThemeRibbon = document.getElementById('selected-theme-ribbon');
        const dropdownItems = document.querySelectorAll('#theme-dropdown-menu .custom-dropdown-item');
        
        if (selectedThemeName) {
            selectedThemeName.textContent = this.currentTheme.charAt(0).toUpperCase() + this.currentTheme.slice(1);
        }
        
        // Update ribbon color
        if (selectedThemeRibbon) {
            const ribbonColors = {
                'forest': 'bg-gradient-to-r from-green-600 to-green-800',
                'ocean': 'bg-gradient-to-r from-blue-600 to-blue-800',
                'sunset': 'bg-gradient-to-r from-orange-600 to-red-700',
                'midnight': 'bg-gradient-to-r from-purple-600 to-indigo-800',
                'light': 'bg-gradient-to-r from-indigo-400 to-blue-500',
                'rose': 'bg-gradient-to-r from-pink-600 to-rose-700'
            };
            
            // Remove all existing gradient classes
            Object.values(ribbonColors).forEach(className => {
                selectedThemeRibbon.classList.remove(...className.split(' '));
            });
            
            // Add the current theme's gradient
            if (ribbonColors[this.currentTheme]) {
                selectedThemeRibbon.classList.add(...ribbonColors[this.currentTheme].split(' '));
            }
        }
        
        // Update selected state in dropdown items
        dropdownItems.forEach(item => {
            const themeName = item.getAttribute('data-theme');
            if (themeName === this.currentTheme) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // Support old theme selectors if they exist
        const themeOptions = document.querySelectorAll('.theme-option, .theme-option-circle');
        themeOptions.forEach(option => {
            const themeName = option.getAttribute('data-theme');
            if (themeName === this.currentTheme) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
}

// Dark Mode Manager
class DarkModeManager {
    constructor() {
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        this.applyDarkMode(this.isDarkMode);
        this.setupToggleListener();
    }

    applyDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        this.isDarkMode = enabled;
        localStorage.setItem('darkMode', enabled.toString());
        this.updateToggle();
    }

    updateToggle() {
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) {
            toggle.checked = this.isDarkMode;
        }
    }

    setupToggleListener() {
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.applyDarkMode(e.target.checked);
                
                // If enabling dark mode while on light theme, switch to a dark theme
                const currentTheme = localStorage.getItem('selectedTheme') || 'forest';
                if (e.target.checked && currentTheme === 'light') {
                    // Switch to forest theme when enabling dark mode from light theme
                    const themeManager = new ThemeManager();
                    themeManager.applyTheme('forest');
                    themeManager.updateThemeSelection();
                }
            });
        }
    }
}

// Initialize theme and dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new DarkModeManager();
});

// Show add recipe modal
function showAddRecipeModal() {
    requirePinProtection(() => {
        const modal = getElement('add-recipe-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Clear form
            const nameInput = getElement('add-recipe-name');
            const yieldInput = getElement('add-recipe-yield');
            const yieldUnitInput = getElement('add-recipe-yield-unit');
            const ingredientsInput = getElement('add-recipe-ingredients');
            const instructionsInput = getElement('add-recipe-instructions');
            
            if (nameInput) nameInput.value = '';
            if (yieldInput) yieldInput.value = '1';
            if (yieldUnitInput) yieldUnitInput.value = '';
            if (ingredientsInput) ingredientsInput.value = '';
            if (instructionsInput) instructionsInput.value = '';
            
            // Focus on name input
            if (nameInput) nameInput.focus();
        }
    });
}

// Hide add recipe modal
function hideAddRecipeModal() {
    const modal = getElement('add-recipe-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Save recipe from modal
function saveRecipeFromModal() {
    const nameInput = getElement('add-recipe-name');
    const yieldInput = getElement('add-recipe-yield');
    const yieldUnitInput = getElement('add-recipe-yield-unit');
    const ingredientsInput = getElement('add-recipe-ingredients');
    const instructionsInput = getElement('add-recipe-instructions');
    
    if (!nameInput || !yieldInput || !ingredientsInput) return;
    
    const name = nameInput.value.trim();
    const yieldValue = parseFloat(yieldInput.value) || 1;
    const yieldUnit = yieldUnitInput ? yieldUnitInput.value.trim() : '';
    const ingredientsText = ingredientsInput.value.trim();
    const instructions = instructionsInput ? instructionsInput.value.trim() : '';
    
    if (!name) {
        showToast('Please enter a recipe name', 'error');
        return;
    }
    
    if (!ingredientsText) {
        showToast('Please enter at least one ingredient', 'error');
        return;
    }
    
    // Parse ingredients
    const parsedIngredients = parseRecipe(ingredientsText);
    
    if (parsedIngredients.length === 0) {
        showToast('Could not parse ingredients. Please check format.', 'error');
        return;
    }
    
    // Create recipe object
    const recipe = {
        id: Date.now().toString(),
        name: name,
        originalServings: yieldValue,
        targetServings: yieldValue,
        yieldUnit: yieldUnit,
        ingredients: parsedIngredients.map(ing => ({
            ...ing,
            scaledQty: ing.quantity,
            scaledUnit: ing.unit
        })),
        instructions: instructions,
        createdAt: new Date().toISOString(),
        type: 'direct'
    };
    
    // Save to localStorage
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    savedRecipes.push(recipe);
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    
    hideAddRecipeModal();
    loadSavedRecipes();
    showToast('Recipe added successfully!', 'success');
}

// Edit recipe
// Note: editRecipe is now defined in temptabs.js
function editRecipeOld(recipeId) {
    // This function is kept for backwards compatibility but is no longer used
    // The new editRecipe function in temptabs.js handles editing via temp tabs
    if (typeof window.editRecipe === 'function') {
        window.editRecipe(recipeId);
        return;
    }
    
    requirePinProtection(() => {
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const recipe = savedRecipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            showToast('Recipe not found', 'error');
            return;
        }
        
        // Open modal with recipe data
        const modal = getElement('add-recipe-modal');
        const nameInput = getElement('add-recipe-name');
        const yieldInput = getElement('add-recipe-yield');
        const yieldUnitInput = getElement('add-recipe-yield-unit');
        const ingredientsInput = getElement('add-recipe-ingredients');
        const instructionsInput = getElement('add-recipe-instructions');
        const saveBtn = getElement('add-recipe-save');
        
        if (modal && nameInput && yieldInput && ingredientsInput && saveBtn) {
            modal.classList.remove('hidden');
            nameInput.value = recipe.name;
            yieldInput.value = recipe.originalServings;
            if (yieldUnitInput) yieldUnitInput.value = recipe.yieldUnit || '';
            
            // Reconstruct ingredients text
            const ingredientsText = recipe.ingredients.map(ing => 
                `${ing.rawQty || ing.quantity} ${ing.unit} ${ing.name}`
            ).join('\n');
            ingredientsInput.value = ingredientsText;
            
            if (instructionsInput) instructionsInput.value = recipe.instructions || '';
            
            // Change save button to update
            const originalSaveBtn = saveBtn.cloneNode(true);
            saveBtn.textContent = 'Update Recipe';
            saveBtn.onclick = () => {
                updateRecipeFromModal(recipeId);
            };
            
            // Reset on cancel
            const cancelBtn = getElement('add-recipe-cancel');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    hideAddRecipeModal();
                    saveBtn.textContent = 'Save Recipe';
                    saveBtn.onclick = saveRecipeFromModal;
                };
            }
        }
    });
}

// Update recipe from modal
function updateRecipeFromModal(recipeId) {
    const nameInput = getElement('add-recipe-name');
    const yieldInput = getElement('add-recipe-yield');
    const yieldUnitInput = getElement('add-recipe-yield-unit');
    const ingredientsInput = getElement('add-recipe-ingredients');
    const instructionsInput = getElement('add-recipe-instructions');
    
    if (!nameInput || !yieldInput || !ingredientsInput) return;
    
    const name = nameInput.value.trim();
    const yieldValue = parseFloat(yieldInput.value) || 1;
    const yieldUnit = yieldUnitInput ? yieldUnitInput.value.trim() : '';
    const ingredientsText = ingredientsInput.value.trim();
    const instructions = instructionsInput ? instructionsInput.value.trim() : '';
    
    if (!name || !ingredientsText) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Parse ingredients
    const parsedIngredients = parseRecipe(ingredientsText);
    
    if (parsedIngredients.length === 0) {
        showToast('Could not parse ingredients. Please check format.', 'error');
        return;
    }
    
    // Update recipe
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const recipeIndex = savedRecipes.findIndex(r => r.id === recipeId);
    
    if (recipeIndex !== -1) {
        savedRecipes[recipeIndex] = {
            ...savedRecipes[recipeIndex],
            name: name,
            originalServings: yieldValue,
            targetServings: yieldValue,
            yieldUnit: yieldUnit,
            ingredients: parsedIngredients.map(ing => ({
                ...ing,
                scaledQty: ing.quantity,
                scaledUnit: ing.unit
            })),
            instructions: instructions,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        hideAddRecipeModal();
        loadSavedRecipes();
        showToast('Recipe updated successfully!', 'success');
        
        // Reset save button
        const saveBtn = getElement('add-recipe-save');
        if (saveBtn) {
            saveBtn.textContent = 'Save Recipe';
            saveBtn.onclick = saveRecipeFromModal;
        }
    }
}

// Scale recipe (load into scaler)
function scaleRecipe(recipeId) {
    requirePinProtection(() => {
        performViewRecipe(recipeId);
    });
}

// Make functions globally available
window.viewRecipe = viewRecipe;
window.scaleRecipe = scaleRecipe;
window.deleteRecipe = deleteRecipe;
window.editRecipe = editRecipe;
window.loadSavedRecipes = loadSavedRecipes;
window.showConfirmation = showConfirmation;
window.showPinModal = showPinModal;
window.showPinSetupModal = showPinSetupModal;
window.requirePinProtection = requirePinProtection;
window.requirePinProtectionForShopping = requirePinProtectionForShopping;
window.showAddRecipeModal = showAddRecipeModal;
window.hideAddRecipeModal = hideAddRecipeModal;
window.saveRecipeFromModal = saveRecipeFromModal;

// Density Manager Functions
function showDensityManager() {
    const modal = getElement('density-manager-modal');
    if (modal) {
        modal.classList.remove('hidden');
        renderDensityLists();
    }
}

function hideDensityManager() {
    const modal = getElement('density-manager-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderDensityLists() {
    const customList = getElement('custom-densities-list');
    const builtinList = getElement('builtin-densities-list');
    
    if (customList) {
        const customDensities = loadCustomDensities();
        const customEntries = Object.entries(customDensities);
        
        if (customEntries.length === 0) {
            customList.innerHTML = '<p class="text-center text-sm opacity-70 py-4">No custom ingredients yet</p>';
        } else {
            customList.innerHTML = customEntries.sort((a, b) => a[0].localeCompare(b[0])).map(([name, density]) => `
                <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div class="flex-1">
                        <span class="font-medium capitalize">${escapeHtml(name)}</span>
                        <span class="text-sm opacity-70 ml-2">(${density} g/ml)</span>
                    </div>
                    <button onclick="deleteCustomDensity('${name}')" class="btn btn-ghost btn-sm btn-circle">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-trash"></use>
                        </svg>
                    </button>
                </div>
            `).join('');
        }
    }
    
    if (builtinList) {
        const builtinEntries = Object.entries(BUILTIN_DENSITY_DB_G_PER_ML).slice(0, 20); // Show first 20
        builtinList.innerHTML = builtinEntries.map(([name, density]) => `
            <div class="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg">
                <span class="text-sm capitalize">${escapeHtml(name)}</span>
                <span class="text-xs opacity-70">${density} g/ml</span>
            </div>
        `).join('');
        
        if (Object.keys(BUILTIN_DENSITY_DB_G_PER_ML).length > 20) {
            builtinList.innerHTML += '<p class="text-xs opacity-50 text-center mt-2">+ ' + (Object.keys(BUILTIN_DENSITY_DB_G_PER_ML).length - 20) + ' more built-in ingredients</p>';
        }
    }
}

function addCustomDensity() {
    const nameInput = getElement('new-density-name');
    const valueInput = getElement('new-density-value');
    
    if (!nameInput || !valueInput) return;
    
    const name = nameInput.value.trim().toLowerCase();
    const density = parseFloat(valueInput.value);
    
    if (!name) {
        showToast('Please enter an ingredient name', 'error');
        return;
    }
    
    if (isNaN(density) || density <= 0) {
        showToast('Please enter a valid density (g/ml)', 'error');
        return;
    }
    
    // Check if it's a built-in ingredient
    if (BUILTIN_DENSITY_DB_G_PER_ML[name]) {
        showToast('This ingredient already exists in built-in database', 'error');
        return;
    }
    
    const customDensities = loadCustomDensities();
    customDensities[name] = density;
    saveCustomDensities(customDensities);
    
    nameInput.value = '';
    valueInput.value = '';
    
    renderDensityLists();
    showToast('Custom ingredient added!', 'success');
    
    // Refresh ingredient modal if open
    setupIngredientModal();
}

function deleteCustomDensity(name) {
    showConfirmation(
        'Delete Custom Ingredient',
        `Are you sure you want to delete "${name}"?`,
        () => {
            const customDensities = loadCustomDensities();
            delete customDensities[name];
            saveCustomDensities(customDensities);
            
            renderDensityLists();
            showToast('Custom ingredient deleted', 'success');
            
            // Refresh ingredient modal if open
            setupIngredientModal();
        }
    );
}

// Initialize density manager
document.addEventListener('DOMContentLoaded', () => {
    const densityManagerClose = getElement('density-manager-close');
    const addDensityBtn = getElement('add-density-btn');
    const densityModal = getElement('density-manager-modal');
    
    if (densityManagerClose) {
        densityManagerClose.addEventListener('click', hideDensityManager);
    }
    
    if (addDensityBtn) {
        addDensityBtn.addEventListener('click', addCustomDensity);
    }
    
    if (densityModal) {
        densityModal.addEventListener('click', (e) => {
            if (e.target === densityModal) {
                hideDensityManager();
            }
        });
    }
    
    // Handle Enter key in density inputs
    const densityNameInput = getElement('new-density-name');
    const densityValueInput = getElement('new-density-value');
    
    if (densityNameInput) {
        densityNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                densityValueInput?.focus();
            }
        });
    }
    
    if (densityValueInput) {
        densityValueInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCustomDensity();
            }
        });
    }
});

window.deleteCustomDensity = deleteCustomDensity;

// Import Recipe Modal Functions
function showImportRecipeModal() {
    requirePinProtection(() => {
        const modal = getElement('import-recipe-modal');
        const list = getElement('import-recipes-list');
        
        if (!modal || !list) return;
        
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        
        if (savedRecipes.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <use href="#icon-book"></use>
                    </svg>
                    <p class="text-base-content/70">No saved recipes found</p>
                    <p class="text-sm opacity-60 mt-2">Create some recipes first!</p>
                </div>
            `;
        } else {
            list.innerHTML = savedRecipes.map(recipe => {
                const yieldText = recipe.yieldUnit 
                    ? `${recipe.originalServings} ${recipe.yieldUnit}`
                    : `${recipe.originalServings} servings`;
                
                return `
                    <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer transition-colors" onclick="importRecipeToScaler('${recipe.id}')">
                        <div class="flex-1">
                            <p class="font-medium">${escapeHtml(recipe.name)}</p>
                            <p class="text-sm opacity-70">Yield: ${yieldText} • ${recipe.ingredients.length} ingredients</p>
                        </div>
                        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-upload"></use>
                        </svg>
                    </div>
                `;
            }).join('');
        }
        
        modal.classList.remove('hidden');
    });
}

function hideImportRecipeModal() {
    const modal = getElement('import-recipe-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function importRecipeToScaler(recipeId) {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const recipe = savedRecipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        showToast('Recipe not found', 'error');
        return;
    }
    
    // Populate the scaler form
    const recipeTitle = getElement('recipe-title');
    const originalYield = getElement('original-yield');
    const desiredYield = getElement('desired-yield');
    const recipeInput = getElement('recipe-input');
    
    if (recipeTitle) recipeTitle.value = recipe.name;
    if (originalYield) originalYield.value = recipe.originalServings;
    if (desiredYield) desiredYield.value = recipe.originalServings; // Start with same yield
    
    if (recipeInput) {
        // Reconstruct ingredients text
        const ingredientsText = recipe.ingredients.map(ing => {
            const qty = ing.rawQty || ing.quantity;
            const unit = ing.unit || '';
            const name = ing.name;
            return `${qty} ${unit} ${name}`.trim();
        }).join('\n');
        recipeInput.value = ingredientsText;
    }
    
    // Close the modal
    hideImportRecipeModal();
    
    // Auto-process the recipe
    processAndDisplay(false);
    
    showToast(`Recipe "${recipe.name}" imported successfully!`, 'success');
}

// Initialize import recipe modal
document.addEventListener('DOMContentLoaded', () => {
    const importRecipeCancel = getElement('import-recipe-cancel');
    const importRecipeModal = getElement('import-recipe-modal');
    
    if (importRecipeCancel) {
        importRecipeCancel.addEventListener('click', hideImportRecipeModal);
    }
    
    if (importRecipeModal) {
        importRecipeModal.addEventListener('click', (e) => {
            if (e.target === importRecipeModal) {
                hideImportRecipeModal();
            }
        });
    }
});

// Make functions globally available
window.showImportRecipeModal = showImportRecipeModal;
window.hideImportRecipeModal = hideImportRecipeModal;
window.importRecipeToScaler = importRecipeToScaler;

// Font management function
function applyFont(fontFamily) {
    const fontMap = {
        'manrope': "'Manrope', sans-serif",
        'inter': "'Inter', sans-serif",
        'poppins': "'Poppins', sans-serif",
        'system': "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif"
    };
    
    const fontValue = fontMap[fontFamily] || fontMap['manrope'];
    document.documentElement.style.setProperty('--app-font-family', fontValue);
    document.body.style.fontFamily = fontValue;
    
    // Apply to all text elements
    const style = document.getElementById('dynamic-font-style') || document.createElement('style');
    style.id = 'dynamic-font-style';
    style.textContent = `
        body, input, textarea, select, button, .btn, .card, .label-text, p, span, div, h1, h2, h3, h4, h5, h6 {
            font-family: ${fontValue} !important;
        }
    `;
    
    if (!document.getElementById('dynamic-font-style')) {
        document.head.appendChild(style);
    }
}

// Apply font on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedFont = localStorage.getItem('chefos_font_family') || 'manrope';
    applyFont(savedFont);
});

// Authentication System with Security Protection
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authRemember = document.getElementById('auth-remember');
    const authError = document.getElementById('auth-error');
    const authErrorMessage = document.getElementById('auth-error-message');
    const authForgotPassword = document.getElementById('auth-forgot-password');
    const authCreateAccount = document.getElementById('auth-create-account');
    const authModal = document.getElementById('auth-modal');
    const appContainer = document.getElementById('app-container');
    
    // Security: Disable right-click and common inspect shortcuts when not authenticated
    function setupSecurityMeasures() {
        const isAuthenticated = localStorage.getItem('chefos_authenticated') === 'true';
        
        if (!isAuthenticated) {
            // Disable right-click
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showToast('Please sign in to access ChefOS', 'warning');
                return false;
            }, { passive: false });
            
            // Disable common inspect element shortcuts
            document.addEventListener('keydown', (e) => {
                // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
                if (
                    e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
                    (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
                ) {
                    e.preventDefault();
                    showToast('Developer tools disabled. Please sign in.', 'warning');
                    return false;
                }
            }, { passive: false });
            
            // Add auth-required class to body
            document.body.classList.add('auth-required');
        }
    }
    
    // Security: Monitor auth modal removal attempts
    function setupAuthModalProtection() {
        const isAuthenticated = localStorage.getItem('chefos_authenticated') === 'true';
        
        if (!isAuthenticated && authModal) {
            // Create MutationObserver to detect modal removal
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((node) => {
                            // If auth modal is removed without proper authentication
                            if (node === authModal || (node.contains && node.contains(authModal))) {
                                handleSecurityBreach();
                            }
                        });
                    }
                    
                    // Check if display style is being manipulated
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const currentAuth = localStorage.getItem('chefos_authenticated');
                        const createAccountModal = document.getElementById('create-account-modal');
                        
                        // Allow hiding auth modal if create account modal is visible
                        const isCreatingAccount = createAccountModal && createAccountModal.style.display === 'flex';
                        
                        if (currentAuth !== 'true' && authModal && authModal.style.display === 'none' && !isCreatingAccount) {
                            // Modal was hidden without authentication and not switching to create account
                            handleSecurityBreach();
                        }
                    }
                });
            });
            
            // Observe the document body for auth modal removal
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            });
            
            // Also observe the auth modal itself
            if (authModal) {
                observer.observe(authModal, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            }
            
            // Periodic check every 500ms
            setInterval(() => {
                const currentAuth = localStorage.getItem('chefos_authenticated');
                const createAccountModal = document.getElementById('create-account-modal');
                const isCreatingAccount = createAccountModal && createAccountModal.style.display === 'flex';
                
                if (currentAuth !== 'true') {
                    // Allow if either auth modal or create account modal is visible
                    const authModalVisible = authModal && authModal.style.display !== 'none';
                    const hasValidModal = authModalVisible || isCreatingAccount;
                    
                    if (!document.getElementById('auth-modal') || !hasValidModal) {
                        handleSecurityBreach();
                    }
                }
            }, 500);
        }
    }
    
    // Security breach handler - clear content and force reload
    function handleSecurityBreach() {
        // Clear all app content
        if (appContainer) {
            appContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 1rem;"><svg style="width: 4rem; height: 4rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><h2 style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">Security Violation Detected</h2><p style="text-align: center; opacity: 0.8;">Unauthorized access attempt detected.<br>Please reload the page and sign in properly.</p><button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Reload Page</button></div>';
        }
        
        // Clear authentication data
        localStorage.removeItem('chefos_authenticated');
        localStorage.removeItem('chefos_user_email');
        localStorage.removeItem('chefos_user_plan');
        
        // Show breach notification
        console.warn('Security breach detected: Unauthorized modal manipulation');
        
        // Force page reload after 3 seconds
        setTimeout(() => {
            location.reload();
        }, 3000);
    }
    
    // Initialize security measures
    setupSecurityMeasures();
    setupAuthModalProtection();
    
    // Handle authentication form submission
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = authEmail.value.trim();
            const password = authPassword.value;
            const remember = authRemember.checked;
            
            // Check hardcoded test account first
            let authenticated = false;
            let userPlan = null;
            let planExpiry = null;
            
            if (email === 'nic@blacnova.net' && password === '2900') {
                authenticated = true;
                userPlan = 'pro';
            } else {
                // Check against stored accounts
                const accounts = JSON.parse(localStorage.getItem('chefos_accounts') || '{}');
                if (accounts[email] && accounts[email].password === password) {
                    authenticated = true;
                    userPlan = accounts[email].plan;
                    planExpiry = accounts[email].planExpiry;
                    
                    // Check if trial has expired
                    if (userPlan === 'trial' && planExpiry) {
                        const expiryDate = new Date(planExpiry);
                        const now = new Date();
                        if (now > expiryDate) {
                            // Trial expired
                            if (authError && authErrorMessage) {
                                authError.classList.remove('hidden');
                                authErrorMessage.textContent = 'Your free trial has expired. Please upgrade to continue.';
                            }
                            return;
                        }
                    }
                }
            }
            
            if (authenticated) {
                // Successful authentication
                localStorage.setItem('chefos_authenticated', 'true');
                localStorage.setItem('chefos_user_email', email);
                localStorage.setItem('chefos_user_plan', userPlan);
                if (planExpiry) {
                    localStorage.setItem('chefos_plan_expiry', planExpiry);
                }
                
                if (remember) {
                    localStorage.setItem('chefos_remember_me', 'true');
                }
                
                // Update billing page with email and plan info
                const billingEmail = document.getElementById('billing-email');
                const billingStatus = document.getElementById('billing-status');
                const billingPlanName = document.getElementById('billing-plan-name');
                const billingPlanDescription = document.getElementById('billing-plan-description');
                const billingSubscribeDate = document.getElementById('billing-subscribe-date');
                const billingNextBillDate = document.getElementById('billing-next-bill-date');
                const billingNextBillContainer = document.getElementById('billing-next-bill-container');
                
                if (billingEmail) {
                    billingEmail.textContent = email;
                }
                
                // Get account creation date
                const accounts = JSON.parse(localStorage.getItem('chefos_accounts') || '{}');
                let subscribeDate = new Date();
                if (email !== 'nic@blacnova.net' && accounts[email] && accounts[email].createdAt) {
                    subscribeDate = new Date(accounts[email].createdAt);
                }
                
                if (billingSubscribeDate) {
                    billingSubscribeDate.textContent = subscribeDate.toLocaleDateString();
                }
                
                if (userPlan === 'trial' && planExpiry) {
                    const daysLeft = Math.ceil((new Date(planExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                    if (billingStatus) billingStatus.textContent = 'Trial Active';
                    if (billingPlanName) billingPlanName.textContent = '7-Day Free Trial';
                    if (billingPlanDescription) billingPlanDescription.textContent = `${daysLeft} days remaining in trial`;
                    
                    // Hide next bill for trial
                    if (billingNextBillContainer) {
                        billingNextBillContainer.style.display = 'none';
                    }
                } else {
                    if (billingStatus) billingStatus.textContent = 'Active';
                    if (billingPlanName) billingPlanName.textContent = 'Professional Plan';
                    if (billingPlanDescription) billingPlanDescription.textContent = 'Full access to all ChefOS features';
                    
                    // Show and calculate next bill date (30 days from subscribe date)
                    if (billingNextBillContainer) {
                        billingNextBillContainer.style.display = 'block';
                    }
                    if (billingNextBillDate) {
                        const nextBill = new Date(subscribeDate);
                        nextBill.setDate(nextBill.getDate() + 30);
                        billingNextBillDate.textContent = nextBill.toLocaleDateString();
                    }
                }
                
                // Remove auth-required class
                document.body.classList.remove('auth-required');
                
                // Hide auth modal properly
                if (authModal) {
                    authModal.style.display = 'none';
                }
                
                // Hide auth error if visible
                if (authError) {
                    authError.classList.add('hidden');
                }
                
                // Remove any auth hide styles
                const hideStyle = document.getElementById('auth-hide-style');
                if (hideStyle) {
                    hideStyle.remove();
                }
                
                // Show the shimmer loader and app
                const shimmerLoader = document.getElementById('shimmer-loader');
                const appContainer = document.getElementById('app-container');
                if (shimmerLoader) {
                    shimmerLoader.style.display = 'flex';
                    shimmerLoader.style.visibility = 'visible';
                    shimmerLoader.style.opacity = '1';
                    startShimmerLoader();
                }
                if (appContainer) {
                    appContainer.style.display = '';
                    appContainer.style.visibility = '';
                    appContainer.style.opacity = '';
                }
                
                // Re-enable right-click after authentication
                document.removeEventListener('contextmenu', () => {});
                
                showToast('Welcome to ChefOS Professional!', 'success');
            } else {
                // Authentication failed
                if (authError && authErrorMessage) {
                    authError.classList.remove('hidden');
                    authErrorMessage.textContent = 'Invalid email or password. For testing, use: nic@blacnova.net / 2900';
                }
            }
        });
    }
    
    // Forgot password handler
    if (authForgotPassword) {
        authForgotPassword.addEventListener('click', () => {
            showToast('Password reset feature coming soon! Contact support for assistance.', 'info');
        });
    }
    
    // Create account handler
    if (authCreateAccount) {
        authCreateAccount.addEventListener('click', () => {
            // Hide auth error if visible
            if (authError) {
                authError.classList.add('hidden');
            }
            
            // Clear create account form
            const createEmail = document.getElementById('create-email');
            const createPassword = document.getElementById('create-password');
            const createPasswordConfirm = document.getElementById('create-password-confirm');
            const createAccountError = document.getElementById('create-account-error');
            const planTrial = document.getElementById('plan-trial');
            
            if (createEmail) createEmail.value = '';
            if (createPassword) createPassword.value = '';
            if (createPasswordConfirm) createPasswordConfirm.value = '';
            if (createAccountError) createAccountError.classList.add('hidden');
            if (planTrial) planTrial.checked = true;
            
            // Switch modals
            if (authModal) {
                authModal.style.display = 'none';
            }
            const createAccountModal = document.getElementById('create-account-modal');
            if (createAccountModal) {
                createAccountModal.style.display = 'flex';
            }
        });
    }
    
    // Back to sign in handler
    const backToSignin = document.getElementById('back-to-signin');
    if (backToSignin) {
        backToSignin.addEventListener('click', () => {
            const createAccountModal = document.getElementById('create-account-modal');
            const createAccountError = document.getElementById('create-account-error');
            
            // Hide error if visible
            if (createAccountError) {
                createAccountError.classList.add('hidden');
            }
            
            // Switch modals
            if (createAccountModal) {
                createAccountModal.style.display = 'none';
            }
            if (authModal) {
                authModal.style.display = 'flex';
            }
        });
    }
    
    // Create account form submission
    const createAccountForm = document.getElementById('create-account-form');
    const createEmail = document.getElementById('create-email');
    const createPassword = document.getElementById('create-password');
    const createPasswordConfirm = document.getElementById('create-password-confirm');
    const createAccountError = document.getElementById('create-account-error');
    const createAccountErrorMessage = document.getElementById('create-account-error-message');
    const createAccountModal = document.getElementById('create-account-modal');
    
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = createEmail.value.trim();
            const password = createPassword.value;
            const passwordConfirm = createPasswordConfirm.value;
            const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value || 'trial';
            
            // Validation
            if (password !== passwordConfirm) {
                if (createAccountError && createAccountErrorMessage) {
                    createAccountError.classList.remove('hidden');
                    createAccountErrorMessage.textContent = 'Passwords do not match';
                }
                return;
            }
            
            if (password.length < 4) {
                if (createAccountError && createAccountErrorMessage) {
                    createAccountError.classList.remove('hidden');
                    createAccountErrorMessage.textContent = 'Password must be at least 4 characters';
                }
                return;
            }
            
            // Create account
            const accounts = JSON.parse(localStorage.getItem('chefos_accounts') || '{}');
            
            if (accounts[email]) {
                if (createAccountError && createAccountErrorMessage) {
                    createAccountError.classList.remove('hidden');
                    createAccountErrorMessage.textContent = 'An account with this email already exists';
                }
                return;
            }
            
            // Determine plan details
            let planType, planExpiry = null;
            if (selectedPlan === 'trial') {
                planType = 'trial';
                // Set trial expiry to 7 days from now
                planExpiry = new Date();
                planExpiry.setDate(planExpiry.getDate() + 7);
                planExpiry = planExpiry.toISOString();
            } else {
                planType = 'pro';
            }
            
            // Save account
            accounts[email] = {
                password: password, // In production, this should be hashed
                plan: planType,
                planExpiry: planExpiry,
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('chefos_accounts', JSON.stringify(accounts));
            
            // Auto-login
            localStorage.setItem('chefos_authenticated', 'true');
            localStorage.setItem('chefos_user_email', email);
            localStorage.setItem('chefos_user_plan', planType);
            if (planExpiry) {
                localStorage.setItem('chefos_plan_expiry', planExpiry);
            }
            
            // Update billing page with email
            const billingEmail = document.getElementById('billing-email');
            if (billingEmail) {
                billingEmail.textContent = email;
            }
            
            // Update billing page with plan info
            const billingStatus = document.getElementById('billing-status');
            const billingPlanName = document.getElementById('billing-plan-name');
            const billingPlanDescription = document.getElementById('billing-plan-description');
            const billingSubscribeDate = document.getElementById('billing-subscribe-date');
            const billingNextBillDate = document.getElementById('billing-next-bill-date');
            const billingNextBillContainer = document.getElementById('billing-next-bill-container');
            
            // Set subscribe date
            if (billingSubscribeDate) {
                billingSubscribeDate.textContent = new Date().toLocaleDateString();
            }
            
            if (selectedPlan === 'trial') {
                if (billingStatus) billingStatus.textContent = 'Trial Active';
                if (billingPlanName) billingPlanName.textContent = '7-Day Free Trial';
                if (billingPlanDescription) {
                    const daysLeft = Math.ceil((new Date(planExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                    billingPlanDescription.textContent = `${daysLeft} days remaining in trial`;
                }
                // Hide next bill for trial
                if (billingNextBillContainer) {
                    billingNextBillContainer.style.display = 'none';
                }
            } else {
                if (billingStatus) billingStatus.textContent = 'Active';
                if (billingPlanName) billingPlanName.textContent = 'Professional Plan';
                if (billingPlanDescription) billingPlanDescription.textContent = 'Full access to all ChefOS features';
                
                // Show and calculate next bill date
                if (billingNextBillContainer) {
                    billingNextBillContainer.style.display = 'block';
                }
                if (billingNextBillDate) {
                    const nextBill = new Date();
                    nextBill.setDate(nextBill.getDate() + 30);
                    billingNextBillDate.textContent = nextBill.toLocaleDateString();
                }
            }
            
            // Remove auth-required class
            document.body.classList.remove('auth-required');
            
            // Hide create account modal
            if (createAccountModal) {
                createAccountModal.style.display = 'none';
            }
            
            // Remove any auth hide styles
            const hideStyle = document.getElementById('auth-hide-style');
            if (hideStyle) {
                hideStyle.remove();
            }
            
            // Show the shimmer loader and app
            const shimmerLoader = document.getElementById('shimmer-loader');
            const appContainer = document.getElementById('app-container');
            if (shimmerLoader) {
                shimmerLoader.style.display = 'flex';
                shimmerLoader.style.visibility = 'visible';
                shimmerLoader.style.opacity = '1';
                startShimmerLoader();
            }
            if (appContainer) {
                appContainer.style.display = '';
                appContainer.style.visibility = '';
                appContainer.style.opacity = '';
            }
            
            const welcomeMessage = selectedPlan === 'trial' 
                ? 'Welcome to ChefOS! Your 7-day free trial has started.' 
                : 'Welcome to ChefOS Professional!';
            showToast(welcomeMessage, 'success');
        });
    }
    
    // Update billing page when it loads
    const billingPage = document.getElementById('billing-page');
    if (billingPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && billingPage.classList.contains('active')) {
                    const billingEmail = document.getElementById('billing-email');
                    const userEmail = localStorage.getItem('chefos_user_email');
                    if (billingEmail && userEmail) {
                        billingEmail.textContent = userEmail;
                    }
                }
            });
        });
        
        observer.observe(billingPage, { attributes: true });
    }
    
    // Sign out functionality
    function handleSignOut() {
        // Show confirmation
        if (confirm('Are you sure you want to sign out?')) {
            // Clear authentication data
            localStorage.removeItem('chefos_authenticated');
            localStorage.removeItem('chefos_user_email');
            localStorage.removeItem('chefos_user_plan');
            localStorage.removeItem('chefos_plan_expiry');
            localStorage.removeItem('chefos_remember_me');
            
            // Show toast
            showToast('You have been signed out', 'info');
            
            // Reload page to show auth modal
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    }
    
    // Desktop sign out button
    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', handleSignOut);
    }
    
    // Mobile sign out button
    const mobileSignoutBtn = document.getElementById('mobile-signout-btn');
    if (mobileSignoutBtn) {
        mobileSignoutBtn.addEventListener('click', handleSignOut);
    }
    
    // PRO badges toggle
    const showProBadgesToggle = document.getElementById('show-pro-badges-toggle');
    if (showProBadgesToggle) {
        // Load saved preference
        const showBadges = localStorage.getItem('chefos_show_pro_badges') !== 'false'; // Default true
        showProBadgesToggle.checked = showBadges;
        
        if (!showBadges) {
            document.body.classList.add('hide-pro-badges');
        }
        
        showProBadgesToggle.addEventListener('change', (e) => {
            const show = e.target.checked;
            localStorage.setItem('chefos_show_pro_badges', show.toString());
            
            if (show) {
                document.body.classList.remove('hide-pro-badges');
                showToast('PRO badges enabled', 'success');
            } else {
                document.body.classList.add('hide-pro-badges');
                showToast('PRO badges hidden', 'success');
            }
        });
    }
    
    // Function to update search bar visibility based on item count
    window.updateSearchBarVisibility = function() {
        // Recipes search bar
        const recipesGrid = document.getElementById('recipes-grid');
        const recipesSearchContainer = document.getElementById('recipes-search-container');
        const recipesEmptyState = document.getElementById('recipes-empty-state');
        if (recipesGrid && recipesSearchContainer) {
            // Check if grid has content AND is visible (not hidden by empty state)
            const hasContent = recipesGrid.children.length > 0 && 
                              recipesGrid.style.display !== 'none' &&
                              (!recipesEmptyState || recipesEmptyState.style.display === 'none');
            recipesSearchContainer.style.display = hasContent ? '' : 'none';
        }
        
        // Menus search bar
        const menusGrid = document.getElementById('menus-grid');
        const menusSearchContainer = document.getElementById('menus-search-container');
        const menusEmptyState = document.getElementById('menus-empty-state');
        if (menusGrid && menusSearchContainer) {
            const hasContent = menusGrid.children.length > 0 && 
                              menusGrid.style.display !== 'none' &&
                              (!menusEmptyState || menusEmptyState.style.display === 'none');
            menusSearchContainer.style.display = hasContent ? '' : 'none';
        }
        
        // PDFs search bar
        const pdfsGrid = document.getElementById('pdf-files-grid');
        const pdfsSearchContainer = document.getElementById('pdfs-search-container');
        const pdfsEmptyState = document.getElementById('pdf-empty-state');
        if (pdfsGrid && pdfsSearchContainer) {
            const hasContent = pdfsGrid.children.length > 0 && 
                              pdfsGrid.style.display !== 'none' &&
                              (!pdfsEmptyState || pdfsEmptyState.style.display === 'none');
            pdfsSearchContainer.style.display = hasContent ? '' : 'none';
        }
        
        // Markets search bar
        const storesGrid = document.getElementById('stores-grid');
        const marketsSearchContainer = document.getElementById('markets-search-container');
        const storesEmptyState = document.getElementById('stores-empty-state');
        if (storesGrid && marketsSearchContainer) {
            const hasContent = storesGrid.children.length > 0 && 
                              storesGrid.style.display !== 'none' &&
                              (!storesEmptyState || storesEmptyState.style.display === 'none');
            marketsSearchContainer.style.display = hasContent ? '' : 'none';
        }
    };
    
    // Search functionality for recipes
    const recipesSearch = document.getElementById('recipes-search');
    if (recipesSearch) {
        recipesSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const recipeCards = document.querySelectorAll('#recipes-grid > .card');
            
            recipeCards.forEach(card => {
                const title = card.querySelector('.card-title');
                if (title) {
                    const text = title.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // Search functionality for menus
    const menusSearch = document.getElementById('menus-search');
    if (menusSearch) {
        menusSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const menuCards = document.querySelectorAll('#menus-grid > .card');
            
            menuCards.forEach(card => {
                const title = card.querySelector('.card-title');
                if (title) {
                    const text = title.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // Search functionality for PDFs
    const pdfsSearch = document.getElementById('pdfs-search');
    if (pdfsSearch) {
        pdfsSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const pdfCards = document.querySelectorAll('#pdf-files-grid > .card');
            
            pdfCards.forEach(card => {
                const title = card.querySelector('.card-title, h3');
                if (title) {
                    const text = title.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // Search functionality for markets
    const marketsSearch = document.getElementById('markets-search');
    if (marketsSearch) {
        marketsSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const storeCards = document.querySelectorAll('#stores-grid > .card');
            
            storeCards.forEach(card => {
                const title = card.querySelector('.card-title, h3');
                if (title) {
                    const text = title.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // Language dropdown in settings
    const languageDropdown = document.getElementById('language-dropdown');
    const languageDropdownButton = document.getElementById('language-dropdown-button');
    const languageDropdownMenu = document.getElementById('language-dropdown-menu');
    const selectedLangName = document.getElementById('selected-lang-name');
    const selectedLangFlag = document.getElementById('selected-lang-flag');
    
    if (languageDropdownButton && languageDropdownMenu) {
        // Set initial language
        const currentLang = getCurrentLanguage();
        const langNames = {
            'en': 'English',
            'zh': '中文',
            'hi': 'हिन्दी',
            'es': 'Español',
            'fr': 'Français',
            'ar': 'العربية',
            'bn': 'বাংলা'
        };
        const langFlags = {
            'en': '🇺🇸',
            'zh': '🇨🇳',
            'hi': '🇮🇳',
            'es': '🇪🇸',
            'fr': '🇫🇷',
            'ar': '🇸🇦',
            'bn': '🇧🇩'
        };
        
        if (selectedLangName) selectedLangName.textContent = langNames[currentLang] || 'English';
        if (selectedLangFlag) selectedLangFlag.textContent = langFlags[currentLang] || '🇺🇸';
        
        // Toggle dropdown
        languageDropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!languageDropdown.contains(e.target)) {
                languageDropdown.classList.remove('open');
            }
        });
        
        // Handle language selection
        const langItems = languageDropdownMenu.querySelectorAll('.custom-dropdown-item');
        langItems.forEach(item => {
            item.addEventListener('click', () => {
                const langCode = item.getAttribute('data-lang');
                const flagEmoji = item.getAttribute('data-flag');
                const langName = item.querySelector('span').textContent;
                
                // Update UI
                if (selectedLangName) selectedLangName.textContent = langName;
                if (selectedLangFlag) selectedLangFlag.textContent = flagEmoji;
                
                // Save and apply language
                setLanguage(langCode);
                
                // Update selected state
                langItems.forEach(it => it.classList.remove('selected'));
                item.classList.add('selected');
                
                // Close dropdown
                languageDropdown.classList.remove('open');
                
                showToast(`Language changed to ${langName}`, 'success');
            });
        });
        
        // Set initial selected state
        const currentLangItem = languageDropdownMenu.querySelector(`[data-lang="${currentLang}"]`);
        if (currentLangItem) currentLangItem.classList.add('selected');
    }
    
    // Font family selection
    const fontOptions = document.querySelectorAll('.font-option');
    if (fontOptions.length > 0) {
        // Load saved font
        const savedFont = localStorage.getItem('chefos_font_family') || 'manrope';
        applyFont(savedFont);
        
        // Update radio buttons
        const fontRadio = document.querySelector(`.font-radio[value="${savedFont}"]`);
        if (fontRadio) fontRadio.checked = true;
        
        // Add event listeners
        fontOptions.forEach(option => {
            option.addEventListener('click', () => {
                const fontValue = option.dataset.font;
                const radio = option.querySelector('.font-radio');
                if (radio) radio.checked = true;
                applyFont(fontValue);
                localStorage.setItem('chefos_font_family', fontValue);
                showToast(`Font changed to ${fontValue.charAt(0).toUpperCase() + fontValue.slice(1)}`, 'success');
            });
        });
    }
    
    // Storage location selection (new design)
    const localStorageRadio = document.getElementById('local-storage-radio');
    const cloudStorageRadio = document.getElementById('cloud-storage-radio');
    const localStorageOption = document.getElementById('local-storage-option');
    const cloudStorageOption = document.getElementById('cloud-storage-option');
    
    if (localStorageRadio && cloudStorageRadio) {
        // Load saved preference
        const storageLocation = localStorage.getItem('chefos_storage_location') || 'local';
        
        if (storageLocation === 'cloud') {
            cloudStorageRadio.checked = true;
            localStorageRadio.checked = false;
        }
        
        // Handle storage location change
        localStorageRadio.addEventListener('change', () => {
            if (localStorageRadio.checked) {
                localStorage.setItem('chefos_storage_location', 'local');
                showToast('Switched to Local Device Storage', 'success');
            }
        });
        
        cloudStorageRadio.addEventListener('change', () => {
            if (cloudStorageRadio.checked) {
                localStorage.setItem('chefos_storage_location', 'cloud');
                showToast('Switched to ChefOS Cloud Storage', 'success');
                setTimeout(() => {
                    showToast('Cloud sync enabled. Your data is being backed up.', 'info');
                }, 1500);
            }
        });
    }
    
    // Trial ended modal handlers
    const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');
    const trialEndedSignoutBtn = document.getElementById('trial-ended-signout-btn');
    const trialEndedModal = document.getElementById('trial-ended-modal');
    
    if (upgradeToProBtn) {
        upgradeToProBtn.addEventListener('click', () => {
            const userEmail = localStorage.getItem('chefos_user_email');
            if (!userEmail) {
                showToast('Error: User email not found', 'error');
                return;
            }
            
            // Upgrade user to pro
            const accounts = JSON.parse(localStorage.getItem('chefos_accounts') || '{}');
            if (accounts[userEmail]) {
                accounts[userEmail].plan = 'pro';
                accounts[userEmail].planExpiry = null; // Remove expiry for pro
                accounts[userEmail].upgradedAt = new Date().toISOString();
                localStorage.setItem('chefos_accounts', JSON.stringify(accounts));
            }
            
            // Update current session
            localStorage.setItem('chefos_user_plan', 'pro');
            localStorage.removeItem('chefos_plan_expiry');
            
            // Update billing page
            const billingStatus = document.getElementById('billing-status');
            const billingPlanName = document.getElementById('billing-plan-name');
            const billingPlanDescription = document.getElementById('billing-plan-description');
            const billingNextBillContainer = document.getElementById('billing-next-bill-container');
            const billingNextBillDate = document.getElementById('billing-next-bill-date');
            
            if (billingStatus) billingStatus.textContent = 'Active';
            if (billingPlanName) billingPlanName.textContent = 'Professional Plan';
            if (billingPlanDescription) billingPlanDescription.textContent = 'Full access to all ChefOS features';
            
            // Show next bill date
            if (billingNextBillContainer) {
                billingNextBillContainer.style.display = 'block';
            }
            if (billingNextBillDate) {
                const nextBill = new Date();
                nextBill.setDate(nextBill.getDate() + 30);
                billingNextBillDate.textContent = nextBill.toLocaleDateString();
            }
            
            // Hide trial ended modal
            if (trialEndedModal) {
                trialEndedModal.style.display = 'none';
            }
            
            // Show app container
            const appContainer = document.getElementById('app-container');
            if (appContainer) {
                appContainer.style.display = '';
            }
            
            showToast('Upgraded to Professional Plan! Welcome to ChefOS Pro.', 'success');
            
            // Navigate to billing page to show updated plan
            setTimeout(() => {
                navigateToPage('billing');
            }, 1000);
        });
    }
    
    if (trialEndedSignoutBtn) {
        trialEndedSignoutBtn.addEventListener('click', () => {
            handleSignOut();
        });
    }
});
