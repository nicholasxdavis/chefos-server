/**
 * Saved Markets Module for ChefOS
 */

// Stores State
let storesState = {
    stores: []
};

// Load stores from storage
function loadStores() {
    try {
        const stores = storage.get('yieldr_stores', []);
        storesState.stores = stores;
        return stores;
    } catch (error) {
        console.error('Error loading stores:', error);
        return [];
    }
}

// Save store to storage
function saveStore(store) {
    try {
        const sanitizedStore = {
            id: store.id || Date.now().toString(),
            name: sanitizeInput(store.name || 'Untitled Store'),
            address: sanitizeInput(store.address || ''),
            phone: sanitizeInput(store.phone || ''),
            notes: sanitizeInput(store.notes || ''),
            createdAt: store.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const existingIndex = storesState.stores.findIndex(s => s.id === sanitizedStore.id);
        if (existingIndex >= 0) {
            storesState.stores[existingIndex] = sanitizedStore;
        } else {
            storesState.stores.push(sanitizedStore);
        }
        
        storage.set('yieldr_stores', storesState.stores);
        return { success: true, store: sanitizedStore };
    } catch (error) {
        console.error('Error saving store:', error);
        return { success: false, error: error.message };
    }
}

// Delete store
function deleteStore(storeId) {
    try {
        storesState.stores = storesState.stores.filter(s => s.id !== storeId);
        storage.set('yieldr_stores', storesState.stores);
        return { success: true };
    } catch (error) {
        console.error('Error deleting store:', error);
        return { success: false, error: error.message };
    }
}

// Render stores grid
function renderStores() {
    const grid = getElement('stores-grid');
    const emptyState = getElement('stores-empty-state');
    
    if (!grid || !emptyState) return;
    
    try {
        const stores = storesState.stores;
        
        if (stores.length === 0) {
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
        
        grid.innerHTML = stores.map(store => {
            const dateLabel = store.updatedAt 
                ? new Date(store.updatedAt).toLocaleDateString()
                : new Date(store.createdAt).toLocaleDateString();
            return `
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <div class="flex items-start justify-between mb-2">
                            <h2 class="card-title">${escapeHtml(store.name)}</h2>
                            <span class="badge" style="background-color: var(--accent-color); color: white;">${dateLabel}</span>
                        </div>
                        <div class="space-y-2 text-sm">
                            ${store.address ? `
                                <div class="flex items-start gap-2">
                                    <svg class="w-4 h-4 mt-0.5" style="color: var(--accent-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span class="opacity-70">${escapeHtml(store.address)}</span>
                                </div>
                            ` : ''}
                            ${store.phone ? `
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4" style="color: var(--accent-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                    <span class="opacity-70">${escapeHtml(store.phone)}</span>
                                </div>
                            ` : ''}
                            ${store.notes ? `
                                <div class="flex items-start gap-2">
                                    <svg class="w-4 h-4 mt-0.5" style="color: var(--accent-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <use href="#icon-info"></use>
                                    </svg>
                                    <span class="opacity-70 text-xs">${escapeHtml(store.notes)}</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="card-actions justify-end mt-4">
                            <button onclick="editStore('${store.id}')" class="btn btn-outline btn-sm">Edit</button>
                            <button onclick="deleteStoreById('${store.id}')" class="btn btn-error btn-sm">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update search bar visibility after rendering
        if (typeof window.updateSearchBarVisibility === 'function') {
            window.updateSearchBarVisibility();
        }
    } catch (error) {
        console.error('Error rendering stores:', error);
        showToast('Error loading stores', 'error');
    }
}

// Show store modal
function showStoreModal(storeId = null) {
    const modal = getElement('store-modal');
    if (!modal) return;
    
    const nameInput = getElement('store-name-input');
    const addressInput = getElement('store-address-input');
    const phoneInput = getElement('store-phone-input');
    const notesInput = getElement('store-notes-input');
    
    if (storeId) {
        // Edit mode
        const store = storesState.stores.find(s => s.id === storeId);
        if (store) {
            nameInput.value = store.name;
            addressInput.value = store.address;
            phoneInput.value = store.phone;
            notesInput.value = store.notes;
            modal.dataset.editId = storeId;
        }
    } else {
        // Add mode
        nameInput.value = '';
        addressInput.value = '';
        phoneInput.value = '';
        notesInput.value = '';
        delete modal.dataset.editId;
    }
    
    modal.classList.remove('hidden');
    
    // Add click outside to close
    setTimeout(() => {
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                hideStoreModal();
                modal.removeEventListener('click', handleOutsideClick);
            }
        };
        modal.addEventListener('click', handleOutsideClick);
    }, 100);
}

// Hide store modal
function hideStoreModal() {
    const modal = getElement('store-modal');
    if (modal) {
        modal.classList.add('hidden');
        delete modal.dataset.editId;
    }
}

// Save store from modal
function saveStoreFromModal() {
    const modal = getElement('store-modal');
    const nameInput = getElement('store-name-input');
    const addressInput = getElement('store-address-input');
    const phoneInput = getElement('store-phone-input');
    const notesInput = getElement('store-notes-input');
    
    const name = nameInput.value.trim();
    if (!name) {
        showToast('Please enter a market name', 'error');
        return;
    }
    
    const store = {
        name,
        address: addressInput.value.trim(),
        phone: phoneInput.value.trim(),
        notes: notesInput.value.trim()
    };
    
    // If editing, preserve the ID
    if (modal.dataset.editId) {
        store.id = modal.dataset.editId;
        const existing = storesState.stores.find(s => s.id === store.id);
        if (existing) {
            store.createdAt = existing.createdAt;
        }
    }
    
    const result = saveStore(store);
    if (result.success) {
        showToast(modal.dataset.editId ? 'Market updated!' : 'Market added!', 'success');
        hideStoreModal();
        renderStores();
    } else {
        showToast('Error saving store', 'error');
    }
}

// Edit store
function editStore(storeId) {
    showStoreModal(storeId);
}

// Delete store by ID
function deleteStoreById(storeId) {
    showConfirmation(
        'Delete Market',
        'Are you sure you want to delete this market?',
        () => {
            const result = deleteStore(storeId);
            if (result.success) {
                showToast('Market deleted!', 'success');
                renderStores();
            } else {
                showToast('Error deleting store', 'error');
            }
        }
    );
}

// Export all stores
function exportStores() {
    if (storesState.stores.length === 0) {
        showToast('No markets to export', 'error');
        return;
    }
    showExportFormatModal('stores', storesState.stores);
}

// Initialize stores management
function initializeStoresManagement() {
    loadStores();
    
    // Event listeners
    const addStoreBtn = getElement('add-store-btn');
    const addStoreBtn2 = getElement('add-store-btn-2');
    const storeModalCancel = getElement('store-modal-cancel');
    const storeModalSave = getElement('store-modal-save');
    const exportStoresBtn = getElement('export-stores-btn');
    
    if (addStoreBtn) addStoreBtn.addEventListener('click', () => showStoreModal());
    if (addStoreBtn2) addStoreBtn2.addEventListener('click', () => showStoreModal());
    if (storeModalCancel) storeModalCancel.addEventListener('click', hideStoreModal);
    if (storeModalSave) storeModalSave.addEventListener('click', saveStoreFromModal);
    if (exportStoresBtn) exportStoresBtn.addEventListener('click', exportStores);
}

// Make functions globally available
window.editStore = editStore;
window.deleteStoreById = deleteStoreById;
window.renderStores = renderStores;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadStores,
        saveStore,
        deleteStore,
        renderStores,
        initializeStoresManagement
    };
}

