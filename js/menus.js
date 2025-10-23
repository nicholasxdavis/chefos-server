/**
 * Menu Management Module for ChefOS
 * Create and manage menus with recipes or file uploads
 */

// Menu Management State
let menusState = {
    menus: []
};

// Load menus from storage
function loadMenus() {
    try {
        const menus = storage.get('yieldr_menus', []);
        menusState.menus = menus;
        return menus;
    } catch (error) {
        console.error('Error loading menus:', error);
        return [];
    }
}

// Save menu to storage
function saveMenu(menu) {
    try {
        const sanitizedMenu = {
            id: menu.id || Date.now().toString(),
            name: sanitizeInput(menu.name || 'Untitled Menu'),
            description: menu.description ? sanitizeInput(menu.description) : '',
            type: menu.type || 'recipe', // 'recipe' or 'file'
            recipes: menu.recipes || [], // Array of recipe IDs
            fileName: menu.fileName,
            fileData: menu.fileData,
            fileType: menu.fileType,
            fileSize: menu.fileSize,
            createdAt: menu.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const existingIndex = menusState.menus.findIndex(m => m.id === sanitizedMenu.id);
        if (existingIndex >= 0) {
            menusState.menus[existingIndex] = sanitizedMenu;
        } else {
            menusState.menus.push(sanitizedMenu);
        }
        
        storage.set('yieldr_menus', menusState.menus);
        return { success: true, menu: sanitizedMenu };
    } catch (error) {
        console.error('Error saving menu:', error);
        return { success: false, error: error.message };
    }
}

// Delete menu
function deleteMenu(menuId) {
    try {
        menusState.menus = menusState.menus.filter(m => m.id !== menuId);
        storage.set('yieldr_menus', menusState.menus);
        return { success: true };
    } catch (error) {
        console.error('Error deleting menu:', error);
        return { success: false, error: error.message };
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Render menus grid
function renderMenus() {
    const grid = getElement('menus-grid');
    const emptyState = getElement('menus-empty-state');
    
    if (!grid || !emptyState) return;
    
    try {
        const menus = menusState.menus;
        
        if (menus.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            // Update search bar visibility
            if (typeof window.updateSearchBarVisibility === 'function') {
                window.updateSearchBarVisibility();
            }
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        const getFileIcon = (fileType) => {
            if (!fileType) return 'icon-clipboard';
            if (fileType.includes('pdf')) return 'icon-download';
            if (fileType.includes('word') || fileType.includes('document')) return 'icon-edit';
            return 'icon-clipboard';
        };
        
        grid.innerHTML = menus.map(menu => {
            if (menu.type === 'recipe') {
                // Recipe-based menu
                const recipeCount = menu.recipes ? menu.recipes.length : 0;
                const dateLabel = menu.updatedAt 
                    ? new Date(menu.updatedAt).toLocaleDateString()
                    : new Date(menu.createdAt).toLocaleDateString();
                return `
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <div class="flex items-start justify-between mb-2">
                                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <use href="#icon-clipboard"></use>
                                </svg>
                                <span class="badge" style="background-color: var(--accent-color); color: white;">${dateLabel}</span>
                            </div>
                            <h2 class="card-title text-base">${escapeHtml(menu.name)}</h2>
                            ${menu.description ? `<p class="text-sm opacity-70">${escapeHtml(menu.description)}</p>` : ''}
                            <div class="space-y-1 text-sm opacity-70">
                                <p><strong>${recipeCount}</strong> recipe${recipeCount !== 1 ? 's' : ''}</p>
                            </div>
                            <div class="card-actions justify-end mt-4 flex-wrap gap-2">
                                <button onclick="viewMenu('${menu.id}')" class="btn btn-primary btn-sm">View</button>
                                <button onclick="editMenu('${menu.id}')" class="btn btn-ghost btn-sm">Edit</button>
                                <button onclick="deleteMenuById('${menu.id}')" class="btn btn-error btn-sm">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // File-based menu
                const fileType = menu.fileType || 'unknown';
                const fileExtension = fileType.includes('/') ? fileType.split('/')[1].toUpperCase() : 'FILE';
                
                return `
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <div class="flex items-start justify-between mb-2">
                                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <use href="#${getFileIcon(fileType)}"></use>
                                </svg>
                                <span class="badge">File</span>
                            </div>
                            <h2 class="card-title text-base">${escapeHtml(menu.fileName || menu.name)}</h2>
                            <div class="space-y-1 text-sm opacity-70">
                                <p><strong>Size:</strong> ${formatFileSize(menu.fileSize || 0)}</p>
                                <p><strong>Type:</strong> ${fileExtension}</p>
                            </div>
                            <p class="text-xs opacity-50">Uploaded: ${new Date(menu.createdAt).toLocaleDateString()}</p>
                            <div class="card-actions justify-end mt-4">
                                <button onclick="downloadMenu('${menu.id}')" class="btn btn-primary btn-sm">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <use href="#icon-download"></use>
                                    </svg>
                                    Download
                                </button>
                                <button onclick="deleteMenuById('${menu.id}')" class="btn btn-error btn-sm">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        // Update search bar visibility after rendering
        if (typeof window.updateSearchBarVisibility === 'function') {
            window.updateSearchBarVisibility();
        }
    } catch (error) {
        console.error('Error rendering menus:', error);
        showToast('Error loading menus', 'error');
    }
}

// Handle file upload
function handleMenuUpload() {
    const fileInput = getElement('menu-file-input');
    if (!fileInput) return;
    
    fileInput.click();
}

// Process uploaded file
function processMenuFile(file) {
    if (!file) return;
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Please upload a PDF or DOCX file', 'error');
        return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const menu = {
            name: file.name,
            fileName: file.name,
            fileData: e.target.result,
            fileType: file.type,
            fileSize: file.size,
            type: 'file'
        };
        
        const result = saveMenu(menu);
        if (result.success) {
            showToast('Menu uploaded successfully!', 'success');
            renderMenus();
        } else {
            showToast('Error uploading menu', 'error');
        }
    };
    
    reader.readAsDataURL(file);
}

// Download menu
function downloadMenu(menuId) {
    const menu = menusState.menus.find(m => m.id === menuId);
    if (!menu) {
        showToast('Menu not found', 'error');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = menu.fileData;
    link.download = menu.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Menu downloaded!', 'success');
}

// Delete menu by ID
function deleteMenuById(menuId) {
    requirePinProtection(() => {
        showConfirmation(
            'Delete Menu',
            'Are you sure you want to delete this menu? This action cannot be undone.',
            () => {
                const result = deleteMenu(menuId);
                if (result.success) {
                    showToast('Menu deleted successfully!', 'success');
                    renderMenus();
                } else {
                    showToast('Error deleting menu', 'error');
                }
            }
        );
    });
}

// Initialize menu management
function initializeMenuManagement() {
    loadMenus();
    
    // Note: Create Menu button listeners are now in temptabs.js
    // to properly open the Create Menu temp tab instead of old modal
    
    // Close modals on overlay click
    const createMenuModal = getElement('create-menu-modal');
    if (createMenuModal) {
        createMenuModal.addEventListener('click', (e) => {
            if (e.target === createMenuModal) {
                hideCreateMenuModal();
            }
        });
    }
    
    const viewMenuModal = getElement('view-menu-modal');
    if (viewMenuModal) {
        viewMenuModal.addEventListener('click', (e) => {
            if (e.target === viewMenuModal) {
                hideViewMenuModal();
            }
        });
    }
    
    const editMenuModal = getElement('edit-menu-modal');
    if (editMenuModal) {
        editMenuModal.addEventListener('click', (e) => {
            if (e.target === editMenuModal) {
                hideEditMenuModal();
            }
        });
    }
}

// Create new recipe menu
function showCreateMenuModal() {
    requirePinProtection(() => {
        const modal = getElement('create-menu-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Clear form
            const nameInput = getElement('create-menu-name');
            const descInput = getElement('create-menu-description');
            
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
            if (nameInput) nameInput.focus();
        }
    });
}

function hideCreateMenuModal() {
    const modal = getElement('create-menu-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function saveNewMenu() {
    const nameInput = getElement('create-menu-name');
    const descInput = getElement('create-menu-description');
    
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    const description = descInput ? descInput.value.trim() : '';
    
    if (!name) {
        showToast('Please enter a menu name', 'error');
        return;
    }
    
    const menu = {
        name: name,
        description: description,
        type: 'recipe',
        recipes: []
    };
    
    const result = saveMenu(menu);
    if (result.success) {
        hideCreateMenuModal();
        renderMenus();
        showToast('Menu created successfully!', 'success');
    } else {
        showToast('Error creating menu', 'error');
    }
}

// View menu
function viewMenu(menuId) {
    requirePinProtection(() => {
        const menu = menusState.menus.find(m => m.id === menuId);
        if (!menu || menu.type !== 'recipe') {
            showToast('Menu not found', 'error');
            return;
        }
        
        const modal = getElement('view-menu-modal');
        if (!modal) return;
        
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const menuRecipes = menu.recipes.map(recipeId => 
            savedRecipes.find(r => r.id === recipeId)
        ).filter(r => r !== undefined);
        
        // Update modal content
        const title = getElement('view-menu-title');
        const description = getElement('view-menu-description');
        const recipesList = getElement('view-menu-recipes-list');
        
        if (title) title.textContent = menu.name;
        if (description) {
            if (menu.description) {
                description.textContent = menu.description;
                description.style.display = 'block';
            } else {
                description.style.display = 'none';
            }
        }
        
        if (recipesList) {
            if (menuRecipes.length === 0) {
                recipesList.innerHTML = '<p class="text-center text-sm opacity-70 py-8">No recipes in this menu yet</p>';
            } else {
                recipesList.innerHTML = menuRecipes.map(recipe => {
                    const yieldText = recipe.yieldUnit 
                        ? `${recipe.originalServings} ${recipe.yieldUnit}`
                        : `${recipe.originalServings} servings`;
                    
                    return `
                        <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                            <div class="flex-1">
                                <p class="font-medium">${escapeHtml(recipe.name)}</p>
                                <p class="text-sm opacity-70">Yield: ${yieldText} • ${recipe.ingredients.length} ingredients</p>
                            </div>
                            <button onclick="scaleRecipe('${recipe.id}')" class="btn btn-sm btn-primary">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <use href="#icon-ruler"></use>
                                </svg>
                            </button>
                        </div>
                    `;
                }).join('');
            }
        }
        
        // Set export button action
        const exportBtn = getElement('export-menu-btn');
        if (exportBtn) {
            exportBtn.onclick = () => {
                hideViewMenuModal();
                showExportFormatModal('menu', menu);
            };
        }
        
        modal.classList.remove('hidden');
    });
}

function hideViewMenuModal() {
    const modal = getElement('view-menu-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Edit menu
function editMenu(menuId) {
    requirePinProtection(() => {
        const menu = menusState.menus.find(m => m.id === menuId);
        if (!menu || menu.type !== 'recipe') {
            showToast('Menu not found', 'error');
            return;
        }
        
        const modal = getElement('edit-menu-modal');
        if (!modal) return;
        
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        
        // Update modal content
        const title = getElement('edit-menu-name');
        const description = getElement('edit-menu-description');
        const recipesList = getElement('edit-menu-recipes-list');
        const availableRecipesList = getElement('available-recipes-list');
        
        if (title) title.value = menu.name;
        if (description) description.value = menu.description || '';
        
        // Render current recipes
        if (recipesList) {
            renderEditMenuRecipes(menu, recipesList, savedRecipes);
        }
        
        // Render available recipes
        if (availableRecipesList) {
            renderAvailableRecipes(menu, availableRecipesList, savedRecipes);
        }
        
        // Set save button action
        const saveBtn = getElement('edit-menu-save');
        if (saveBtn) {
            saveBtn.onclick = () => updateMenu(menuId);
        }
        
        modal.classList.remove('hidden');
    });
}

function renderEditMenuRecipes(menu, container, savedRecipes) {
    const menuRecipes = menu.recipes.map(recipeId => 
        savedRecipes.find(r => r.id === recipeId)
    ).filter(r => r !== undefined);
    
    if (menuRecipes.length === 0) {
        container.innerHTML = '<p class="text-center text-sm opacity-70 py-4">No recipes added yet</p>';
    } else {
        container.innerHTML = menuRecipes.map(recipe => {
            const yieldText = recipe.yieldUnit 
                ? `${recipe.originalServings} ${recipe.yieldUnit}`
                : `${recipe.originalServings} servings`;
            
            return `
                <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div class="flex-1">
                        <p class="font-medium">${escapeHtml(recipe.name)}</p>
                        <p class="text-sm opacity-70">${yieldText} • ${recipe.ingredients.length} ingredients</p>
                    </div>
                    <button onclick="removeRecipeFromMenu('${menu.id}', '${recipe.id}')" class="btn btn-ghost btn-sm btn-circle">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-trash"></use>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }
}

function renderAvailableRecipes(menu, container, savedRecipes) {
    const availableRecipes = savedRecipes.filter(r => !menu.recipes.includes(r.id));
    
    if (availableRecipes.length === 0) {
        container.innerHTML = '<p class="text-center text-sm opacity-70 py-4">All recipes have been added to this menu</p>';
    } else {
        container.innerHTML = availableRecipes.map(recipe => {
            const yieldText = recipe.yieldUnit 
                ? `${recipe.originalServings} ${recipe.yieldUnit}`
                : `${recipe.originalServings} servings`;
            
            return `
                <div class="flex items-center justify-between p-3 hover:bg-base-200 rounded-lg cursor-pointer" onclick="addRecipeToMenu('${menu.id}', '${recipe.id}')">
                    <div class="flex-1">
                        <p class="font-medium">${escapeHtml(recipe.name)}</p>
                        <p class="text-sm opacity-70">${yieldText} • ${recipe.ingredients.length} ingredients</p>
                    </div>
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <use href="#icon-plus"></use>
                    </svg>
                </div>
            `;
        }).join('');
    }
}

function addRecipeToMenu(menuId, recipeId) {
    const menu = menusState.menus.find(m => m.id === menuId);
    if (!menu) return;
    
    if (!menu.recipes.includes(recipeId)) {
        menu.recipes.push(recipeId);
        saveMenu(menu);
        
        // Re-render
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const recipesList = getElement('edit-menu-recipes-list');
        const availableRecipesList = getElement('available-recipes-list');
        
        if (recipesList) renderEditMenuRecipes(menu, recipesList, savedRecipes);
        if (availableRecipesList) renderAvailableRecipes(menu, availableRecipesList, savedRecipes);
        
        showToast('Recipe added to menu!', 'success');
    }
}

function removeRecipeFromMenu(menuId, recipeId) {
    const menu = menusState.menus.find(m => m.id === menuId);
    if (!menu) return;
    
    menu.recipes = menu.recipes.filter(id => id !== recipeId);
    saveMenu(menu);
    
    // Re-render
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const recipesList = getElement('edit-menu-recipes-list');
    const availableRecipesList = getElement('available-recipes-list');
    
    if (recipesList) renderEditMenuRecipes(menu, recipesList, savedRecipes);
    if (availableRecipesList) renderAvailableRecipes(menu, availableRecipesList, savedRecipes);
    
    showToast('Recipe removed from menu', 'info');
}

function updateMenu(menuId) {
    const menu = menusState.menus.find(m => m.id === menuId);
    if (!menu) return;
    
    const nameInput = getElement('edit-menu-name');
    const descInput = getElement('edit-menu-description');
    
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    const description = descInput ? descInput.value.trim() : '';
    
    if (!name) {
        showToast('Please enter a menu name', 'error');
        return;
    }
    
    menu.name = name;
    menu.description = description;
    
    const result = saveMenu(menu);
    if (result.success) {
        hideEditMenuModal();
        renderMenus();
        showToast('Menu updated successfully!', 'success');
    } else {
        showToast('Error updating menu', 'error');
    }
}

function hideEditMenuModal() {
    const modal = getElement('edit-menu-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}


// Make functions globally available
window.downloadMenu = downloadMenu;
window.deleteMenuById = deleteMenuById;
window.loadMenus = loadMenus;
window.renderMenus = renderMenus;
window.showCreateMenuModal = showCreateMenuModal;
window.hideCreateMenuModal = hideCreateMenuModal;
window.saveNewMenu = saveNewMenu;
window.viewMenu = viewMenu;
window.hideViewMenuModal = hideViewMenuModal;
window.editMenu = editMenu;
window.hideEditMenuModal = hideEditMenuModal;
window.addRecipeToMenu = addRecipeToMenu;
window.removeRecipeFromMenu = removeRecipeFromMenu;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadMenus,
        saveMenu,
        deleteMenu,
        renderMenus,
        initializeMenuManagement
    };
}
