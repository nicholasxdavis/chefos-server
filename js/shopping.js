/**
 * Shopping List Module for ChefOS
 */

// Shopping List State
let shoppingState = {
    items: {},
    categories: []
};

// Default categories with translation keys
const DEFAULT_CATEGORIES = [
    { id: 'produce', name: 'Produce', i18nKey: 'shopping_produce', isDefault: true },
    { id: 'protein', name: 'Proteins & Dairy', i18nKey: 'shopping_proteins', isDefault: true },
    { id: 'pantry', name: 'Pantry & Dry Goods', i18nKey: 'shopping_pantry', isDefault: true },
    { id: 'other', name: 'Other Items', i18nKey: 'shopping_other', isDefault: true }
];

// Load categories from storage
function loadCategories() {
    try {
        const categories = storage.get('yieldr_shopping_categories', DEFAULT_CATEGORIES);
        shoppingState.categories = categories;
        
        // Ensure items object has all category keys
        categories.forEach(cat => {
            if (!shoppingState.items[cat.id]) {
                shoppingState.items[cat.id] = [];
            }
        });
        
        return categories;
    } catch (error) {
        console.error('Error loading categories:', error);
        return DEFAULT_CATEGORIES;
    }
}

// Save categories to storage
function saveCategories() {
    try {
        storage.set('yieldr_shopping_categories', shoppingState.categories);
        return true;
    } catch (error) {
        console.error('Error saving categories:', error);
        return false;
    }
}

// Add new category
function addCategory(name) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if category already exists
    if (shoppingState.categories.find(c => c.id === id)) {
        showToast('Category already exists', 'error');
        return false;
    }
    
    const newCategory = {
        id,
        name,
        isDefault: false
    };
    
    shoppingState.categories.push(newCategory);
    shoppingState.items[id] = [];
    
    saveCategories();
    saveShoppingList();
    renderShoppingList();
    renderCategoryManager();
    updateCategorySelect();
    
    showToast('Category added successfully!', 'success');
    return true;
}

// Edit category
function editCategory(id, newName) {
    const category = shoppingState.categories.find(c => c.id === id);
    if (!category) return false;
    
    if (category.isDefault) {
        showToast('Cannot rename default categories', 'error');
        return false;
    }
    
    category.name = newName;
    saveCategories();
    renderShoppingList();
    renderCategoryManager();
    
    showToast('Category updated!', 'success');
    return true;
}

// Delete category
function deleteCategory(id) {
    const category = shoppingState.categories.find(c => c.id === id);
    if (!category) return false;
    
    if (category.isDefault) {
        showToast('Cannot delete default categories', 'error');
        return false;
    }
    
    // Move items to "other" category
    const items = shoppingState.items[id] || [];
    if (items.length > 0) {
        if (!shoppingState.items.other) {
            shoppingState.items.other = [];
        }
        shoppingState.items.other.push(...items);
    }
    
    // Remove category
    delete shoppingState.items[id];
    shoppingState.categories = shoppingState.categories.filter(c => c.id !== id);
    
    saveCategories();
    saveShoppingList();
    renderShoppingList();
    renderCategoryManager();
    updateCategorySelect();
    
    showToast('Category deleted!', 'success');
    return true;
}

// Show category manager modal
function showCategoryManager() {
    const modal = getElement('category-manager-modal');
    if (modal) {
        modal.classList.remove('hidden');
        renderCategoryManager();
    }
}

// Hide category manager modal
function hideCategoryManager() {
    const modal = getElement('category-manager-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Render category manager
function renderCategoryManager() {
    const list = getElement('categories-list');
    if (!list) return;
    
    list.innerHTML = shoppingState.categories.map(cat => `
        <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div class="flex items-center space-x-3 flex-1">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <use href="#icon-list"></use>
                </svg>
                <span class="font-medium">${escapeHtml(cat.name)}</span>
                ${cat.isDefault ? '<span class="badge badge-sm">Default</span>' : ''}
            </div>
            ${!cat.isDefault ? `
                <div class="flex gap-2">
                    <button onclick="promptEditCategory('${cat.id}')" class="btn btn-ghost btn-sm btn-square">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-edit"></use>
                        </svg>
                    </button>
                    <button onclick="confirmDeleteCategory('${cat.id}')" class="btn btn-ghost btn-sm btn-square text-error">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-trash"></use>
                        </svg>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Update category select dropdown
function updateCategorySelect() {
    const select = getElement('custom-item-category');
    if (!select) return;
    
    select.innerHTML = shoppingState.categories.map(cat => 
        `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`
    ).join('');
}

// Prompt edit category
function promptEditCategory(id) {
    const category = shoppingState.categories.find(c => c.id === id);
    if (!category) return;
    
    const newName = prompt('Enter new category name:', category.name);
    if (newName && newName.trim()) {
        editCategory(id, newName.trim());
    }
}

// Confirm delete category
function confirmDeleteCategory(id) {
    showConfirmation(
        'Delete Category',
        'Are you sure you want to delete this category? Items will be moved to "Other Items".',
        () => deleteCategory(id)
    );
}

// Category mappings for ingredients
const INGREDIENT_CATEGORIES = {
    // Produce
    'produce': ['vegetable', 'fruit', 'herb', 'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'potato', 'apple', 'banana', 'lemon', 'lime', 'orange', 'berry', 'basil', 'parsley', 'cilantro', 'thyme', 'rosemary', 'spinach', 'kale', 'cabbage', 'broccoli', 'cauliflower', 'zucchini', 'squash', 'cucumber', 'mushroom', 'avocado', 'ginger'],
    
    // Proteins & Dairy
    'protein': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'lamb', 'egg', 'milk', 'cream', 'cheese', 'butter', 'yogurt', 'tofu', 'bacon', 'sausage', 'ham', 'steak', 'ground', 'breast', 'thigh', 'wing'],
    
    // Pantry
    'pantry': ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'sauce', 'stock', 'broth', 'pasta', 'rice', 'bean', 'lentil', 'nut', 'seed', 'spice', 'seasoning', 'extract', 'vanilla', 'cocoa', 'chocolate', 'baking powder', 'baking soda', 'yeast', 'honey', 'syrup', 'molasses', 'cornstarch', 'breadcrumb', 'oat', 'quinoa']
};

// Load shopping list from storage
function loadShoppingList() {
    try {
        loadCategories();
        const items = storage.get('yieldr_shopping_list', {});
        
        // Ensure all categories have arrays
        shoppingState.categories.forEach(cat => {
            if (!items[cat.id]) {
                items[cat.id] = [];
            }
        });
        
        shoppingState.items = items;
        return items;
    } catch (error) {
        console.error('Error loading shopping list:', error);
        return shoppingState.items;
    }
}

// Save shopping list to storage
function saveShoppingList() {
    try {
        storage.set('yieldr_shopping_list', shoppingState.items);
        return true;
    } catch (error) {
        console.error('Error saving shopping list:', error);
        return false;
    }
}

// Categorize ingredient
function categorizeIngredient(ingredientName) {
    const lowerName = ingredientName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
            return category;
        }
    }
    
    return 'other';
}

// Add item to shopping list
function addItemToShoppingList(name, quantity, category = null, price = null) {
    const item = {
        id: Date.now().toString() + Math.random(),
        name: sanitizeInput(name),
        quantity: sanitizeInput(quantity || ''),
        price: price ? parseFloat(price) : null,
        checked: false,
        addedAt: new Date().toISOString()
    };
    
    const cat = category || categorizeIngredient(name);
    if (!shoppingState.items[cat]) {
        shoppingState.items[cat] = [];
    }
    shoppingState.items[cat].push(item);
    
    saveShoppingList();
    renderShoppingList();
}

// Remove item from shopping list
function removeItemFromShoppingList(itemId) {
    for (const category in shoppingState.items) {
        shoppingState.items[category] = shoppingState.items[category].filter(item => item.id !== itemId);
    }
    saveShoppingList();
    renderShoppingList();
}

// Toggle item checked status
function toggleItemChecked(itemId) {
    for (const category in shoppingState.items) {
        const item = shoppingState.items[category].find(i => i.id === itemId);
        if (item) {
            item.checked = !item.checked;
            break;
        }
    }
    saveShoppingList();
    renderShoppingList();
}

// Clear all checked items
function clearCheckedItems() {
    for (const category in shoppingState.items) {
        shoppingState.items[category] = shoppingState.items[category].filter(item => !item.checked);
    }
    saveShoppingList();
    renderShoppingList();
    showToast('Checked items cleared', 'success');
}

// Render shopping list
function renderShoppingList() {
    const container = getElement('shopping-categories-container');
    if (!container) return;
    
    let totalItems = 0;
    let subtotal = 0;
    let itemsWithPrice = 0;
    let lastUpdated = null;
    
    // Find the most recent update time
    for (const categoryId in shoppingState.items) {
        const items = shoppingState.items[categoryId] || [];
        items.forEach(item => {
            if (item.addedAt) {
                const itemDate = new Date(item.addedAt);
                if (!lastUpdated || itemDate > lastUpdated) {
                    lastUpdated = itemDate;
                }
            }
        });
    }
    
    // Dynamically render all categories
    container.innerHTML = shoppingState.categories.map(category => {
        const items = shoppingState.items[category.id] || [];
        totalItems += items.length;
        
        const itemsHTML = items.length === 0 
            ? `<p class="text-sm opacity-50 italic">${window.t ? window.t('shopping_no_items') : 'No items in this category'}</p>`
            : items.map(item => {
                // Calculate subtotal
                if (item.price && !item.checked) {
                    subtotal += item.price;
                    itemsWithPrice++;
                }
                
                return `
                <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg ${item.checked ? 'opacity-50' : ''}">
                    <label class="flex items-center space-x-3 flex-1 cursor-pointer">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItemChecked('${item.id}')" class="checkbox checkbox-primary">
                        <div class="flex-1">
                            <p class="font-medium ${item.checked ? 'line-through' : ''}">${escapeHtml(item.name)}</p>
                            <div class="flex items-center gap-2 text-sm opacity-70">
                                ${item.quantity ? `<span>${escapeHtml(item.quantity)}</span>` : ''}
                                ${item.price ? `<span class="font-medium" style="color: var(--accent-color);">$${item.price.toFixed(2)}</span>` : ''}
                            </div>
                        </div>
                    </label>
                    <button onclick="removeItemFromShoppingList('${item.id}')" class="btn btn-ghost btn-sm btn-circle">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-trash"></use>
                        </svg>
                    </button>
                </div>
            `}).join('');
        
        // Get translated category name if available
        const categoryName = category.i18nKey && window.t ? window.t(category.i18nKey) : category.name;
        const itemsText = window.t ? window.t('shopping_items') : 'items';
        
        return `
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h3 class="text-lg font-semibold">${escapeHtml(categoryName)}</h3>
                            ${lastUpdated ? `<p class="text-xs opacity-50">Last Updated: ${lastUpdated.toLocaleDateString()}</p>` : ''}
                        </div>
                        <span class="badge" style="background-color: var(--accent-color); color: white;">${items.length} ${itemsText}</span>
                    </div>
                    <div class="space-y-2">${itemsHTML}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update subtotal display
    const subtotalEl = getElement('shopping-subtotal');
    const itemsWithPriceEl = getElement('shopping-items-with-price');
    const itemsPricedText = window.t ? window.t('shopping_items_priced') : 'items priced';
    
    if (subtotalEl) {
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    }
    if (itemsWithPriceEl) {
        itemsWithPriceEl.textContent = `${itemsWithPrice} ${itemsPricedText}`;
    }
    
    // Show/hide empty state
    const emptyState = getElement('shopping-empty-state');
    if (emptyState) {
        emptyState.style.display = totalItems === 0 ? 'block' : 'none';
    }
}

// Populate shopping list with ingredients
function populateShoppingListWithIngredients(ingredients) {
    // Clear existing items
    shoppingState.items = {
        produce: [],
        protein: [],
        pantry: [],
        other: []
    };
    
    // Group similar ingredients
    const groupedIngredients = {};
    
    ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        if (groupedIngredients[key]) {
            // Try to combine quantities if same unit
            if (groupedIngredients[key].unit === ing.unit) {
                groupedIngredients[key].quantity += ing.quantity;
            } else {
                // Different units, keep separate
                const newKey = `${key}_${Math.random()}`;
                groupedIngredients[newKey] = { ...ing };
            }
        } else {
            groupedIngredients[key] = { ...ing };
        }
    });
    
    // Add to shopping list
    Object.values(groupedIngredients).forEach(ing => {
        const quantity = ing.unit ? formatKitchenQuantity(ing.quantity, ing.unit) : ing.quantity.toString();
        addItemToShoppingList(ing.name, quantity);
    });
}

// Show custom item modal
function showCustomItemModal() {
    const modal = getElement('custom-item-modal');
    if (modal) {
        modal.classList.remove('hidden');
        getElement('custom-item-name').focus();
    }
}

// Hide custom item modal
function hideCustomItemModal() {
    const modal = getElement('custom-item-modal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear form
        const nameInput = getElement('custom-item-name');
        const quantityInput = getElement('custom-item-quantity');
        const priceInput = getElement('custom-item-price');
        const categorySelect = getElement('custom-item-category');
        
        if (nameInput) nameInput.value = '';
        if (quantityInput) quantityInput.value = '';
        if (priceInput) priceInput.value = '';
        if (categorySelect) categorySelect.value = 'produce';
    }
}

// Add custom item from modal
function addCustomItemFromModal() {
    const nameInput = getElement('custom-item-name');
    const quantityInput = getElement('custom-item-quantity');
    const priceInput = getElement('custom-item-price');
    const categorySelect = getElement('custom-item-category');
    
    if (!nameInput || !quantityInput || !categorySelect) return;
    
    const name = nameInput.value.trim();
    const quantity = quantityInput.value.trim();
    const price = priceInput ? priceInput.value : null;
    const category = categorySelect.value;
    
    if (!name) {
        showToast('Please enter an item name', 'error');
        return;
    }
    
    addItemToShoppingList(name, quantity, category, price);
    showToast('Item added to shopping list', 'success');
    hideCustomItemModal();
}

// Generate shopping list from saved recipes
function generateShoppingListFromRecipes() {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    
    if (savedRecipes.length === 0) {
        showToast('No saved recipes available', 'error');
        return;
    }
    
    // Show recipe selection modal
    const modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="modal-icon-container">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <use href="#icon-list"></use>
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-base-content mb-4">Select Recipes for Shopping List</h3>
            <div class="max-h-96 overflow-y-auto space-y-2 mb-6">
                ${savedRecipes.map(recipe => `
                    <label class="recipe-selection-item flex items-center space-x-3 p-3 rounded cursor-pointer">
                        <input type="checkbox" class="checkbox checkbox-primary" value="${recipe.id}">
                        <div class="flex-1">
                            <p class="font-medium">${escapeHtml(recipe.name)}</p>
                            <p class="text-sm opacity-70">${recipe.ingredients.length} ingredients</p>
                        </div>
                    </label>
                `).join('')}
            </div>
            <div class="flex gap-3 justify-end">
                <button id="recipe-select-cancel" class="btn btn-outline btn-sm">Cancel</button>
                <button id="recipe-select-generate" class="btn btn-primary btn-sm">Generate List</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const cancelBtn = modal.querySelector('#recipe-select-cancel');
    const generateBtn = modal.querySelector('#recipe-select-generate');
    
    cancelBtn.addEventListener('click', () => modal.remove());
    
    generateBtn.addEventListener('click', () => {
        const selectedCheckboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        const selectedRecipeIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedRecipeIds.length === 0) {
            showToast('Please select at least one recipe', 'error');
            return;
        }
        
        const selectedRecipes = savedRecipes.filter(r => selectedRecipeIds.includes(r.id));
        const allIngredients = [];
        
        selectedRecipes.forEach(recipe => {
            recipe.ingredients.forEach(ing => {
                allIngredients.push({
                    name: ing.name,
                    quantity: ing.scaledQty || ing.quantity,
                    unit: ing.scaledUnit || ing.unit
                });
            });
        });
        
        populateShoppingListWithIngredients(allIngredients);
        modal.remove();
        showToast('Shopping list generated from recipes!', 'success');
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Export shopping list
function exportShoppingList() {
    const data = {
        categories: shoppingState.categories,
        items: shoppingState.items
    };
    showExportFormatModal('shopping', data);
}

// Initialize shopping list
function initializeShoppingList() {
    loadShoppingList();
    updateCategorySelect();
    renderShoppingList();
    
    // Event listeners
    const addCustomItemBtn = getElement('add-custom-item-btn');
    const generateFromRecipesBtn = getElement('generate-from-recipes-btn');
    const customItemCancel = getElement('custom-item-cancel');
    const customItemAdd = getElement('custom-item-add');
    const clearCheckedBtn = getElement('clear-checked-btn');
    const exportShoppingListBtn = getElement('export-shopping-list-btn');
    const manageCategoriesBtn = getElement('manage-categories-btn');
    const categoryManagerClose = getElement('category-manager-close');
    const addCategoryBtn = getElement('add-category-btn');
    const newCategoryName = getElement('new-category-name');
    
    if (addCustomItemBtn) addCustomItemBtn.addEventListener('click', showCustomItemModal);
    if (generateFromRecipesBtn) generateFromRecipesBtn.addEventListener('click', generateShoppingListFromRecipes);
    if (customItemCancel) customItemCancel.addEventListener('click', hideCustomItemModal);
    if (customItemAdd) customItemAdd.addEventListener('click', addCustomItemFromModal);
    if (clearCheckedBtn) clearCheckedBtn.addEventListener('click', clearCheckedItems);
    if (exportShoppingListBtn) exportShoppingListBtn.addEventListener('click', exportShoppingList);
    if (manageCategoriesBtn) manageCategoriesBtn.addEventListener('click', showCategoryManager);
    if (categoryManagerClose) categoryManagerClose.addEventListener('click', hideCategoryManager);
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => {
        const name = newCategoryName.value.trim();
        if (name) {
            addCategory(name);
            newCategoryName.value = '';
        }
    });
    if (newCategoryName) newCategoryName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && newCategoryName.value.trim()) {
            addCategory(newCategoryName.value.trim());
            newCategoryName.value = '';
        }
    });
}

// Make functions globally available
window.toggleItemChecked = toggleItemChecked;
window.removeItemFromShoppingList = removeItemFromShoppingList;
window.populateShoppingListWithIngredients = populateShoppingListWithIngredients;
window.renderShoppingList = renderShoppingList;
window.promptEditCategory = promptEditCategory;
window.confirmDeleteCategory = confirmDeleteCategory;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadShoppingList,
        saveShoppingList,
        addItemToShoppingList,
        renderShoppingList,
        initializeShoppingList
    };
}

