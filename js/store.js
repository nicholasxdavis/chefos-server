// Simple State Management for ChefOS (Vanilla JavaScript)
// No external dependencies - works with your existing setup

class ChefOSStore {
    constructor() {
        this.state = {
            // Authentication State
            isAuthenticated: localStorage.getItem('chefos_authenticated') === 'true',
            user: null,
            
            // UI State
            isLoading: false,
            currentTheme: localStorage.getItem('chefos_theme') || 'forest',
            language: localStorage.getItem('chefos_language') || 'en',
            
            // Data State
            recipes: [],
            menus: [],
            stores: [],
            shoppingList: null,
            calendarItems: [],
            customDensities: []
        };
        
        this.listeners = [];
    }
    
    // Get current state
    getState() {
        return { ...this.state };
    }
    
    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    // Notify all listeners of state changes
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
    
    // Update state and notify listeners
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }
    
    // Authentication Actions
    setAuthenticated(authenticated, user = null) {
        this.setState({ isAuthenticated: authenticated, user });
        localStorage.setItem('chefos_authenticated', authenticated.toString());
    }
    
    setLoading(loading) {
        this.setState({ isLoading: loading });
    }
    
    setTheme(theme) {
        this.setState({ currentTheme: theme });
        localStorage.setItem('chefos_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    setLanguage(language) {
        this.setState({ language });
        localStorage.setItem('chefos_language', language);
    }
    
    // Recipe Actions
    setRecipes(recipes) {
        this.setState({ recipes });
    }
    
    addRecipe(recipe) {
        this.setState({ recipes: [...this.state.recipes, recipe] });
    }
    
    updateRecipe(id, updates) {
        this.setState({
            recipes: this.state.recipes.map(recipe => 
                recipe.id === id ? { ...recipe, ...updates } : recipe
            )
        });
    }
    
    deleteRecipe(id) {
        this.setState({
            recipes: this.state.recipes.filter(recipe => recipe.id !== id)
        });
    }
    
    // Menu Actions
    setMenus(menus) {
        this.setState({ menus });
    }
    
    addMenu(menu) {
        this.setState({ menus: [...this.state.menus, menu] });
    }
    
    updateMenu(id, updates) {
        this.setState({
            menus: this.state.menus.map(menu => 
                menu.id === id ? { ...menu, ...updates } : menu
            )
        });
    }
    
    deleteMenu(id) {
        this.setState({
            menus: this.state.menus.filter(menu => menu.id !== id)
        });
    }
    
    // Store Actions
    setStores(stores) {
        this.setState({ stores });
    }
    
    addStore(store) {
        this.setState({ stores: [...this.state.stores, store] });
    }
    
    updateStore(id, updates) {
        this.setState({
            stores: this.state.stores.map(store => 
                store.id === id ? { ...store, ...updates } : store
            )
        });
    }
    
    deleteStore(id) {
        this.setState({
            stores: this.state.stores.filter(store => store.id !== id)
        });
    }
    
    // Shopping List Actions
    setShoppingList(shoppingList) {
        this.setState({ shoppingList });
    }
    
    updateShoppingList(updates) {
        this.setState({
            shoppingList: { ...this.state.shoppingList, ...updates }
        });
    }
    
    // Calendar Actions
    setCalendarItems(items) {
        this.setState({ calendarItems: items });
    }
    
    addCalendarItem(item) {
        this.setState({ 
            calendarItems: [...this.state.calendarItems, item] 
        });
    }
    
    updateCalendarItem(id, updates) {
        this.setState({
            calendarItems: this.state.calendarItems.map(item => 
                item.id === id ? { ...item, ...updates } : item
            )
        });
    }
    
    deleteCalendarItem(id) {
        this.setState({
            calendarItems: this.state.calendarItems.filter(item => item.id !== id)
        });
    }
    
    // Custom Densities Actions
    setCustomDensities(densities) {
        this.setState({ customDensities: densities });
    }
    
    addCustomDensity(density) {
        this.setState({ 
            customDensities: [...this.state.customDensities, density] 
        });
    }
    
    updateCustomDensity(id, updates) {
        this.setState({
            customDensities: this.state.customDensities.map(density => 
                density.id === id ? { ...density, ...updates } : density
            )
        });
    }
    
    deleteCustomDensity(id) {
        this.setState({
            customDensities: this.state.customDensities.filter(density => density.id !== id)
        });
    }
}

// Create global store instance
window.ChefOSStore = new ChefOSStore();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChefOSStore;
}