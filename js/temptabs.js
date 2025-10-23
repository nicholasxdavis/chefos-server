/**
 * Temp Tabs System for ChefOS
 * Dynamically creates temporary navigation tabs for create/edit operations
 */

// Temp tabs state
const tempTabsState = {
    activeTabs: new Map(), // pageId => { name, icon, returnPage }
    editingRecipeId: null,
    editingMenuId: null
};

/**
 * Open a temp tab
 * @param {string} pageId - ID of the page to open (without -page suffix)
 * @param {string} tabName - Display name for the tab
 * @param {string} icon - Icon href (e.g., '#icon-plus')
 * @param {string} returnPage - Page to return to when closing (optional)
 */
function openTempTab(pageId, tabName, icon, returnPage = null) {
    console.log('[OPEN TEMP TAB]', pageId);
    
    // Check if temp tab already exists
    if (tempTabsState.activeTabs.has(pageId)) {
        navigateToPage(pageId);
        return;
    }
    
    // Store temp tab info
    tempTabsState.activeTabs.set(pageId, {
        name: tabName,
        icon: icon,
        returnPage: returnPage || getCurrentPage()
    });
    
    // Create temp tab in sidebar (desktop)
    createTempTabElement(pageId, tabName, icon, 'temp-tabs-container');
    
    // Create temp tab in mobile sidebar
    createTempTabElement(pageId, tabName, icon, 'mobile-temp-tabs-container');
    
    // Navigate to the temp tab page
    navigateToPage(pageId);
    
    // Initialize the form AFTER navigation (use setTimeout to ensure page is rendered)
    setTimeout(() => {
        console.log('[OPEN TEMP TAB] Initializing forms for', pageId);
        if (pageId === 'create-recipe') {
            initializeCreateRecipeForm();
        } else if (pageId === 'create-menu') {
            initializeCreateMenuForm();
            loadRecipesForMenu();
        }
    }, 100);
}

/**
 * Close a temp tab
 * @param {string} pageId - ID of the page to close
 */
function closeTempTab(pageId) {
    const tabInfo = tempTabsState.activeTabs.get(pageId);
    
    if (!tabInfo) {
        console.warn(`Temp tab ${pageId} not found`);
        return;
    }
    
    // Remove from both sidebars
    removeTempTabElement(pageId, 'temp-tabs-container');
    removeTempTabElement(pageId, 'mobile-temp-tabs-container');
    
    // Remove from state
    tempTabsState.activeTabs.delete(pageId);
    
    // Navigate back to return page
    if (tabInfo.returnPage) {
        navigateToPage(tabInfo.returnPage);
    } else {
        navigateToPage('recipes'); // Default to recipes page, not 'home'
    }
    
    // Clear form data if it exists
    clearTempTabForm(pageId);
}

/**
 * Create temp tab DOM element - NO LONGER USED
 * Temp tabs are now standalone pages, not sidebar items
 */
function createTempTabElement(pageId, tabName, icon, containerId) {
    // Temp tabs no longer appear in sidebar
    // They are just regular pages that open
    return;
}

/**
 * Remove temp tab DOM element - NO LONGER USED
 */
function removeTempTabElement(pageId, containerId) {
    // No sidebar tabs to remove
    return;
}

/**
 * Get current active page
 */
function getCurrentPage() {
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        return activePage.id.replace('-page', '');
    }
    return 'recipes'; // Default to recipes page, not 'home' which doesn't exist
}

/**
 * Clear form data for a temp tab
 */
function clearTempTabForm(pageId) {
    const form = document.querySelector(`#${pageId}-page form`);
    if (form) {
        form.reset();
    }
    
    // Clear recipe image preview
    if (pageId === 'create-recipe') {
        const preview = document.getElementById('recipe-image-preview');
        if (preview) {
            preview.innerHTML = `
                <div class="text-center">
                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <use href="#icon-image"></use>
                    </svg>
                    <p class="text-sm opacity-70">No image</p>
                </div>
            `;
        }
        const removeBtn = document.getElementById('remove-recipe-image');
        if (removeBtn) removeBtn.style.display = 'none';
        tempTabsState.editingRecipeId = null;
    }
    
    // Clear menu recipe selection
    if (pageId === 'create-menu') {
        const selectedDisplay = document.getElementById('selected-recipes-display');
        if (selectedDisplay) {
            selectedDisplay.innerHTML = '<p class="text-sm opacity-70 text-center">No recipes selected yet</p>';
        }
        tempTabsState.editingMenuId = null;
    }
}

/**
 * Initialize temp tabs system
 */
function initializeTempTabs() {
    console.log('[TEMP TABS] Initializing temp tabs system...');
    
    // Replace "Add Recipe" button functionality with PIN protection
    const addRecipeBtn = document.getElementById('add-recipe-btn');
    const addRecipeBtn2 = document.getElementById('add-recipe-btn-2');
    
    if (addRecipeBtn) {
        console.log('[TEMP TABS] Setting up Add Recipe button 1');
        addRecipeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[TEMP TABS] Add Recipe clicked!');
            requirePinProtection(() => {
                openTempTab('create-recipe', 'New Recipe', '#icon-plus');
            });
        });
    }
    
    if (addRecipeBtn2) {
        console.log('[TEMP TABS] Setting up Add Recipe button 2');
        addRecipeBtn2.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[TEMP TABS] Add Recipe 2 clicked!');
            requirePinProtection(() => {
                openTempTab('create-recipe', 'New Recipe', '#icon-plus');
            });
        });
    }
    
    // Replace "Create Menu" button functionality with PIN protection
    const createMenuBtn = document.getElementById('create-menu-btn');
    const createMenuBtn2 = document.getElementById('create-menu-btn-2');
    
    if (createMenuBtn) {
        console.log('[TEMP TABS] Setting up Create Menu button 1');
        createMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[TEMP TABS] Create Menu clicked!');
            requirePinProtection(() => {
                openTempTab('create-menu', 'New Menu', '#icon-clipboard');
            });
        });
    }
    
    if (createMenuBtn2) {
        console.log('[TEMP TABS] Setting up Create Menu button 2');
        createMenuBtn2.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[TEMP TABS] Create Menu 2 clicked!');
            requirePinProtection(() => {
                openTempTab('create-menu', 'New Menu', '#icon-clipboard');
            });
        });
    }
    
    // NOTE: Forms are NOW initialized when temp tab opens (see openTempTab function)
    // This ensures the forms exist before we try to attach event listeners
    
    console.log('[TEMP TABS] Temp tabs system initialized successfully!');
}

/**
 * Initialize create recipe form with image upload
 */
function initializeCreateRecipeForm() {
    const form = document.getElementById('create-recipe-form');
    const imageInput = document.getElementById('recipe-image-input');
    const imagePreview = document.getElementById('recipe-image-preview');
    const removeImageBtn = document.getElementById('remove-recipe-image');
    
    console.log('[RECIPE FORM] Initializing... Form:', !!form);
    
    // Handle image upload
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size must be less than 5MB', 'error');
                imageInput.value = '';
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please upload a valid image file', 'error');
                imageInput.value = '';
                return;
            }
            
            // Read and preview image
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.innerHTML = `
                    <img src="${event.target.result}" alt="Recipe preview" class="w-full h-full object-cover rounded-lg">
                `;
                removeImageBtn.style.display = 'inline-flex';
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Handle remove image
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageInput.value = '';
            imagePreview.innerHTML = `
                <div class="text-center">
                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <use href="#icon-image"></use>
                    </svg>
                    <p class="text-sm opacity-70">No image</p>
                </div>
            `;
            removeImageBtn.style.display = 'none';
        });
    }
    
    // Handle form submission
    if (form) {
        console.log('[RECIPE FORM] Setting up submit handler');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[RECIPE FORM] Form submitted!');
            await saveRecipeFromTempTab();
        });
    } else {
        console.warn('[RECIPE FORM] Form not found!');
    }
}

/**
 * Save recipe from temp tab form
 */
async function saveRecipeFromTempTab() {
    console.log('[SAVE RECIPE] Starting save process...');
    
    const nameEl = document.getElementById('create-recipe-name');
    const yieldEl = document.getElementById('create-recipe-yield');
    const yieldUnitEl = document.getElementById('create-recipe-yield-unit');
    const ingredientsEl = document.getElementById('create-recipe-ingredients');
    const instructionsEl = document.getElementById('create-recipe-instructions');
    const imageInput = document.getElementById('recipe-image-input');
    
    console.log('[SAVE RECIPE] Elements found:', {
        nameEl: !!nameEl,
        yieldEl: !!yieldEl,
        ingredientsEl: !!ingredientsEl
    });
    
    const name = nameEl?.value?.trim();
    const yield_val = parseFloat(yieldEl?.value);
    const yieldUnit = yieldUnitEl?.value?.trim();
    const ingredientsText = ingredientsEl?.value?.trim();
    const instructions = instructionsEl?.value?.trim();
    
    console.log('[SAVE RECIPE] Raw values:', {
        name,
        yield_val,
        ingredientsLength: ingredientsText?.length || 0,
        ingredientsPreview: ingredientsText?.substring(0, 100) || 'EMPTY'
    });
    
    // Validation
    if (!name) {
        showToast('Please enter a recipe name', 'error');
        return;
    }
    
    if (!ingredientsText) {
        showToast('Please enter ingredients', 'error');
        return;
    }
    
    if (isNaN(yield_val) || yield_val <= 0) {
        showToast('Please enter a valid yield value', 'error');
        return;
    }
    
    // Parse ingredients
    console.log('[SAVE RECIPE] Parsing ingredients...');
    console.log('[SAVE RECIPE] Ingredients text:', ingredientsText);
    const ingredients = parseRecipe(ingredientsText);
    console.log('[SAVE RECIPE] Parsed ingredients count:', ingredients?.length);
    console.log('[SAVE RECIPE] Parsed ingredients:', ingredients);
    if (!ingredients || ingredients.length === 0) {
        console.error('[SAVE RECIPE] Failed to parse ingredients!');
        showToast('Could not parse ingredients. Please check format. Expected: "2 cups flour" or "Flour - 2 cups"', 'error');
        return;
    }
    
    // Get image data if available
    let imageData = null;
    if (imageInput && imageInput.files.length > 0) {
        const file = imageInput.files[0];
        imageData = await fileToBase64(file);
    }
    
    // Create recipe object
    const recipe = {
        id: tempTabsState.editingRecipeId || Date.now().toString(),
        name: name,
        originalServings: yield_val,
        targetServings: yield_val,
        yieldUnit: yieldUnit || null,
        ingredients: ingredients,
        instructions: instructions || null,
        image: imageData,
        createdAt: tempTabsState.editingRecipeId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'direct'
    };
    
    try {
        console.log('[SAVE RECIPE] Saving to localStorage...');
        // Save to localStorage
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        console.log('[SAVE RECIPE] Current recipes count:', savedRecipes.length);
        
        if (tempTabsState.editingRecipeId) {
            // Update existing recipe
            const index = savedRecipes.findIndex(r => r.id === tempTabsState.editingRecipeId);
            if (index >= 0) {
                savedRecipes[index] = { ...savedRecipes[index], ...recipe };
                showToast('Recipe updated successfully!', 'success');
                console.log('[SAVE RECIPE] Recipe updated!');
            }
        } else {
            // Add new recipe
            savedRecipes.push(recipe);
            showToast('Recipe saved successfully!', 'success');
            console.log('[SAVE RECIPE] Recipe added! New count:', savedRecipes.length);
        }
        
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        console.log('[SAVE RECIPE] Saved to localStorage');
        
        // Close temp tab and refresh recipes page
        console.log('[SAVE RECIPE] Closing temp tab...');
        closeTempTab('create-recipe');
        
        // Reload recipes if on recipes page
        if (typeof loadSavedRecipes === 'function') {
            console.log('[SAVE RECIPE] Reloading recipes page...');
            loadSavedRecipes();
        }
        console.log('[SAVE RECIPE] Complete!');
    } catch (error) {
        console.error('[SAVE RECIPE] ERROR:', error);
        showToast('Failed to save recipe. Storage might be full.', 'error');
    }
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Load recipes for menu creation
 */
function loadRecipesForMenu() {
    const container = document.getElementById('menu-recipe-selection');
    const selectedDisplay = document.getElementById('selected-recipes-display');
    
    if (!container) return;
    
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    
    if (savedRecipes.length === 0) {
        container.innerHTML = '<p class="text-sm opacity-70 text-center py-8">No recipes yet. Create some recipes first!</p>';
        return;
    }
    
    container.innerHTML = '';
    const selectedRecipes = new Set();
    
    savedRecipes.forEach(recipe => {
        const checkbox = document.createElement('label');
        checkbox.className = 'flex items-center gap-3 p-3 hover:bg-base-300 rounded-lg cursor-pointer transition-colors';
        checkbox.innerHTML = `
            <input type="checkbox" class="checkbox checkbox-primary" value="${recipe.id}">
            <div class="flex-1">
                <p class="font-medium">${escapeHtml(recipe.name)}</p>
                <p class="text-xs opacity-70">${recipe.ingredients.length} ingredients</p>
            </div>
        `;
        
        const input = checkbox.querySelector('input');
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedRecipes.add(recipe);
            } else {
                selectedRecipes.delete(recipe);
            }
            updateSelectedRecipesDisplay(selectedRecipes, selectedDisplay);
        });
        
        container.appendChild(checkbox);
    });
}

/**
 * Update selected recipes display
 */
function updateSelectedRecipesDisplay(selectedRecipes, displayElement) {
    if (!displayElement) return;
    
    if (selectedRecipes.size === 0) {
        displayElement.innerHTML = '<p class="text-sm opacity-70 text-center">No recipes selected yet</p>';
        return;
    }
    
    const html = Array.from(selectedRecipes).map(recipe => `
        <div class="flex items-center gap-2 bg-base-300 p-2 rounded">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <use href="#icon-book"></use>
            </svg>
            <span class="text-sm flex-1">${escapeHtml(recipe.name)}</span>
        </div>
    `).join('');
    
    displayElement.innerHTML = html;
}

/**
 * Initialize create menu form
 */
function initializeCreateMenuForm() {
    const form = document.getElementById('create-menu-form');
    
    console.log('[MENU FORM] Initializing... Form:', !!form);
    
    if (form) {
        console.log('[MENU FORM] Setting up submit handler');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[MENU FORM] Form submitted!');
            await saveMenuFromTempTab();
        });
    } else {
        console.warn('[MENU FORM] Form not found!');
    }
}

/**
 * Save menu from temp tab form
 */
async function saveMenuFromTempTab() {
    const name = document.getElementById('create-menu-name').value.trim();
    const description = document.getElementById('create-menu-description').value.trim();
    const checkboxes = document.querySelectorAll('#menu-recipe-selection input[type="checkbox"]:checked');
    
    // Validation
    if (!name) {
        showToast('Please enter a menu name', 'error');
        return;
    }
    
    if (checkboxes.length === 0) {
        showToast('Please select at least one recipe', 'error');
        return;
    }
    
    // Get selected recipe IDs
    const recipeIds = Array.from(checkboxes).map(cb => cb.value);
    
    // Create menu object
    const menu = {
        id: tempTabsState.editingMenuId || Date.now().toString(),
        name: name,
        description: description || '',
        type: 'recipe',
        recipes: recipeIds,
        createdAt: tempTabsState.editingMenuId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        // Save using existing menu system
        if (typeof saveMenu === 'function') {
            const result = saveMenu(menu);
            if (result.success) {
                showToast('Menu created successfully!', 'success');
                closeTempTab('create-menu');
                
                // Reload menus if on menus page
                if (typeof renderMenus === 'function') {
                    renderMenus();
                }
            } else {
                showToast('Error creating menu', 'error');
            }
        }
    } catch (error) {
        console.error('Error saving menu:', error);
        showToast('Failed to save menu', 'error');
    }
}

/**
 * Edit an existing recipe
 */
window.editRecipe = function(recipeId) {
    requirePinProtection(() => {
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const recipe = savedRecipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            showToast('Recipe not found', 'error');
            return;
        }
        
        // Set editing state
        tempTabsState.editingRecipeId = recipeId;
        
        // Open temp tab
        openTempTab('create-recipe', `Edit: ${recipe.name}`, '#icon-edit');
        
        // Populate form after a short delay to ensure page is active
        setTimeout(() => {
            const nameInput = document.getElementById('create-recipe-name');
            const yieldInput = document.getElementById('create-recipe-yield');
            const yieldUnitInput = document.getElementById('create-recipe-yield-unit');
            const ingredientsInput = document.getElementById('create-recipe-ingredients');
            const instructionsInput = document.getElementById('create-recipe-instructions');
            const imagePreview = document.getElementById('recipe-image-preview');
            const removeImageBtn = document.getElementById('remove-recipe-image');
            
            if (nameInput) nameInput.value = recipe.name;
            if (yieldInput) yieldInput.value = recipe.originalServings;
            if (yieldUnitInput) yieldUnitInput.value = recipe.yieldUnit || '';
            
            // Reconstruct ingredients text
            if (ingredientsInput) {
                const ingredientsText = recipe.ingredients.map(ing => 
                    `${ing.rawQty || ing.quantity} ${ing.unit} ${ing.name}`
                ).join('\n');
                ingredientsInput.value = ingredientsText;
            }
            
            if (instructionsInput) {
                instructionsInput.value = recipe.instructions || '';
            }
            
            // Show image if available
            if (recipe.image && imagePreview) {
                imagePreview.innerHTML = `
                    <img src="${recipe.image}" alt="Recipe preview" class="w-full h-full object-cover rounded-lg">
                `;
                if (removeImageBtn) removeImageBtn.style.display = 'inline-flex';
            }
            
            showToast('Editing recipe', 'info');
        }, 100);
    });
};

// Make functions globally available
window.openTempTab = openTempTab;
window.closeTempTab = closeTempTab;
window.initializeTempTabs = initializeTempTabs;

// NOTE: Initialization is now called from main.js AFTER all other modules
// to ensure event listeners override any conflicting ones
// See main.js DOMContentLoaded for initializeTempTabs() call

