// Zustand State Management for ChefOS
import { create } from 'zustand';

// Main Application Store
export const useAppStore = create((set, get) => ({
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
  customDensities: [],
  
  // Actions
  setAuthenticated: (authenticated, user = null) => {
    set({ isAuthenticated: authenticated, user });
    localStorage.setItem('chefos_authenticated', authenticated.toString());
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setTheme: (theme) => {
    set({ currentTheme: theme });
    localStorage.setItem('chefos_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },
  
  setLanguage: (language) => {
    set({ language });
    localStorage.setItem('chefos_language', language);
  },
  
  // Recipe Actions
  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
  updateRecipe: (id, updates) => set((state) => ({
    recipes: state.recipes.map(recipe => 
      recipe.id === id ? { ...recipe, ...updates } : recipe
    )
  })),
  deleteRecipe: (id) => set((state) => ({
    recipes: state.recipes.filter(recipe => recipe.id !== id)
  })),
  
  // Menu Actions
  setMenus: (menus) => set({ menus }),
  addMenu: (menu) => set((state) => ({ menus: [...state.menus, menu] })),
  updateMenu: (id, updates) => set((state) => ({
    menus: state.menus.map(menu => 
      menu.id === id ? { ...menu, ...updates } : menu
    )
  })),
  deleteMenu: (id) => set((state) => ({
    menus: state.menus.filter(menu => menu.id !== id)
  })),
  
  // Store Actions
  setStores: (stores) => set({ stores }),
  addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),
  updateStore: (id, updates) => set((state) => ({
    stores: state.stores.map(store => 
      store.id === id ? { ...store, ...updates } : store
    )
  })),
  deleteStore: (id) => set((state) => ({
    stores: state.stores.filter(store => store.id !== id)
  })),
  
  // Shopping List Actions
  setShoppingList: (shoppingList) => set({ shoppingList }),
  updateShoppingList: (updates) => set((state) => ({
    shoppingList: { ...state.shoppingList, ...updates }
  })),
  
  // Calendar Actions
  setCalendarItems: (items) => set({ calendarItems: items }),
  addCalendarItem: (item) => set((state) => ({ 
    calendarItems: [...state.calendarItems, item] 
  })),
  updateCalendarItem: (id, updates) => set((state) => ({
    calendarItems: state.calendarItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  deleteCalendarItem: (id) => set((state) => ({
    calendarItems: state.calendarItems.filter(item => item.id !== id)
  })),
  
  // Custom Densities Actions
  setCustomDensities: (densities) => set({ customDensities: densities }),
  addCustomDensity: (density) => set((state) => ({ 
    customDensities: [...state.customDensities, density] 
  })),
  updateCustomDensity: (id, updates) => set((state) => ({
    customDensities: state.customDensities.map(density => 
      density.id === id ? { ...density, ...updates } : density
    )
  })),
  deleteCustomDensity: (id) => set((state) => ({
    customDensities: state.customDensities.filter(density => density.id !== id)
  })),
}));

// API Store for backend communication
export const useApiStore = create((set, get) => ({
  baseUrl: '', // Will be set based on environment
  
  // API Methods
  async request(endpoint, options = {}) {
    const { baseUrl } = get();
    const url = `${baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Authentication API
  async login(email, password) {
    return get().request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  async register(email, password, plan = 'trial') {
    return get().request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, plan }),
    });
  },
  
  // Recipe API
  async getRecipes() {
    return get().request('/api/recipes');
  },
  
  async createRecipe(recipe) {
    return get().request('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  },
  
  async updateRecipe(id, recipe) {
    return get().request(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
  },
  
  async deleteRecipe(id) {
    return get().request(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Menu API
  async getMenus() {
    return get().request('/api/menus');
  },
  
  async createMenu(menu) {
    return get().request('/api/menus', {
      method: 'POST',
      body: JSON.stringify(menu),
    });
  },
  
  async updateMenu(id, menu) {
    return get().request(`/api/menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menu),
    });
  },
  
  async deleteMenu(id) {
    return get().request(`/api/menus/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Store API
  async getStores() {
    return get().request('/api/stores');
  },
  
  async createStore(store) {
    return get().request('/api/stores', {
      method: 'POST',
      body: JSON.stringify(store),
    });
  },
  
  async updateStore(id, store) {
    return get().request(`/api/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(store),
    });
  },
  
  async deleteStore(id) {
    return get().request(`/api/stores/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Shopping List API
  async getShoppingList() {
    return get().request('/api/shopping-list');
  },
  
  async updateShoppingList(listData) {
    return get().request('/api/shopping-list', {
      method: 'PUT',
      body: JSON.stringify({ listData }),
    });
  },
  
  // Calendar API
  async getCalendarItems() {
    return get().request('/api/calendar');
  },
  
  async createCalendarItem(item) {
    return get().request('/api/calendar', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  
  async updateCalendarItem(id, item) {
    return get().request(`/api/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },
  
  async deleteCalendarItem(id) {
    return get().request(`/api/calendar/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Custom Densities API
  async getCustomDensities() {
    return get().request('/api/custom-densities');
  },
  
  async createCustomDensity(density) {
    return get().request('/api/custom-densities', {
      method: 'POST',
      body: JSON.stringify(density),
    });
  },
  
  async updateCustomDensity(id, density) {
    return get().request(`/api/custom-densities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(density),
    });
  },
  
  async deleteCustomDensity(id) {
    return get().request(`/api/custom-densities/${id}`, {
      method: 'DELETE',
    });
  },
}));

// Initialize API base URL
if (typeof window !== 'undefined') {
  useApiStore.setState({ baseUrl: window.location.origin });
}
