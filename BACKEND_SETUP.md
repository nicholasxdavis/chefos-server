# ChefOS Backend Setup Guide

## 🚀 Quick Start

Your ChefOS backend is now ready! Here's what has been set up:

### ✅ What's Been Implemented

1. **MariaDB Database Connection** - Using your Coolify environment variables
2. **REST API Endpoints** - Complete CRUD operations for all features
3. **Vanilla JavaScript State Management** - Simple, lightweight state management for your frontend
4. **Database Schema** - All tables ready for your ChefOS features

### 🔧 Environment Variables (Already Set in Coolify)

Make sure these are set in your Coolify environment:

**MariaDB Database:**
- `MARIADB_URL`
- `MARIADB_DATABASE` 
- `MARIADB_USER`
- `MARIADB_PASSWORD`
- `MARIADB_NAME`

**Nextcloud Storage:**
- `NEXTCLOUD_URL` - Your Nextcloud server URL (https://cloud.blacnova.net/)
- `NEXTCLOUD_USERNAME` - Nextcloud admin username
- `NEXTCLOUD_PASSWORD` - Nextcloud admin password
- `STORAGE_DRIVER=nextcloud` - Enable Nextcloud integration

### 📋 Setup Steps

1. **Test Database Connection**:
   ```
   Visit: https://your-domain.com/test-connection.php
   ```
   This will verify your MariaDB connection is working.

2. **Initialize Database Tables**:
   ```
   Visit: https://your-domain.com/init.php
   ```
   This will create all the necessary database tables.

3. **Test Nextcloud Integration**:
   ```
   Visit: https://your-domain.com/test-nextcloud.php
   ```

4. **Install Dependencies** (if not already done):
   ```bash
   composer install
   npm install
   ```

### 🗄️ Database Tables Created

- `users` - User authentication and plans
- `recipes` - Recipe storage with ingredients
- `menus` - Menu collections
- `menu_recipes` - Menu-recipe relationships
- `recipe_ingredients` - Recipe ingredient data (JSON)
- `stores` - Store/market information
- `custom_densities` - Calculator density data
- `calendar_items` - Calendar scheduling
- `shopping_lists` - Shopping list data (JSON)

### 🔌 API Endpoints

All endpoints are available at `/api/`:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Recipes
- `GET /api/recipes` - Get all recipes
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/{id}` - Get specific recipe
- `PUT /api/recipes/{id}` - Update recipe
- `DELETE /api/recipes/{id}` - Delete recipe

#### Menus
- `GET /api/menus` - Get all menus
- `POST /api/menus` - Create menu
- `GET /api/menus/{id}` - Get specific menu
- `PUT /api/menus/{id}` - Update menu
- `DELETE /api/menus/{id}` - Delete menu

#### Stores
- `GET /api/stores` - Get all stores
- `POST /api/stores` - Create store
- `GET /api/stores/{id}` - Get specific store
- `PUT /api/stores/{id}` - Update store
- `DELETE /api/stores/{id}` - Delete store

#### Shopping Lists
- `GET /api/shopping-list` - Get shopping list
- `PUT /api/shopping-list` - Update shopping list

#### Calendar
- `GET /api/calendar` - Get calendar items
- `POST /api/calendar` - Create calendar item
- `GET /api/calendar/{id}` - Get specific calendar item
- `PUT /api/calendar/{id}` - Update calendar item
- `DELETE /api/calendar/{id}` - Delete calendar item

#### Custom Densities
- `GET /api/custom-densities` - Get custom densities
- `POST /api/custom-densities` - Create custom density
- `GET /api/custom-densities/{id}` - Get specific custom density
- `PUT /api/custom-densities/{id}` - Update custom density
- `DELETE /api/custom-densities/{id}` - Delete custom density

### 🎯 Using the API in Your Frontend

The API integration script (`js/api-integration.js`) provides a global `ChefOSAPI` object, and the state management is available as `window.ChefOSStore`:

```javascript
// Test connection
await ChefOSAPI.testConnection();

// Get all recipes
const recipes = await ChefOSAPI.getRecipes();

// Create a new recipe
const newRecipe = await ChefOSAPI.createRecipe({
    name: "My Recipe",
    original_servings: 4,
    target_servings: 8,
    ingredients: [
        { name: "Flour", quantity: 2, unit: "cups" }
    ]
});

// Update a recipe
await ChefOSAPI.updateRecipe(recipeId, updatedData);

// Delete a recipe
await ChefOSAPI.deleteRecipe(recipeId);

// Using the state store
const store = window.ChefOSStore;
store.setRecipes(recipes.recipes);
store.addRecipe(newRecipe);

// Subscribe to state changes
store.subscribe((state) => {
    console.log('State updated:', state);
});
```

### 🔒 Security Notes

- All passwords are hashed using PHP's `password_hash()`
- API endpoints include proper error handling
- CORS headers are set for cross-origin requests
- Input validation is implemented for all endpoints

### 🚀 Deployment Ready

Your backend is now ready for deployment on Coolify with Hostinger! The system will:

1. ✅ Connect to MariaDB using environment variables
2. ✅ Serve your existing HTML5 frontend
3. ✅ Provide REST API endpoints
4. ✅ Handle static assets properly
5. ✅ Work with your existing authentication system

### 🆘 Troubleshooting

If you encounter issues:

1. Check the database connection test: `/test-connection.php`
2. Verify environment variables are set in Coolify
3. Ensure `composer install` has been run
4. Check server logs for any PHP errors

Your ChefOS backend is now fully functional and ready to use! 🎉
