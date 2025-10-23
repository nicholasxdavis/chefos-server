# ChefOS Deployment Guide for Coolify

## Issues Fixed

1. **404 Error for index.html**: Fixed PHP routing to properly handle SPA requests
2. **localStorage Access Errors**: Updated CSP and added proper error handling
3. **Missing Nixpacks Configuration**: Created proper nixpacks.toml for PHP deployment

## Deployment Steps

### Option 1: Using Nixpacks (Recommended)

1. **Ensure you have these files in your project root:**
   - `nixpacks.toml` ✅ (Created)
   - `index.php` ✅ (Updated)
   - `index.html` ✅ (Updated)
   - `composer.json` ✅ (Exists)
   - `.htaccess` ✅ (Created)

2. **In Coolify:**
   - Set the build pack to "Nixpacks"
   - The system will automatically detect PHP and use our configuration
   - Deploy the application

### Option 2: Using Docker

1. **Use the provided Dockerfile:**
   - Set the build pack to "Dockerfile"
   - The Dockerfile will handle PHP setup and Apache configuration

## Key Changes Made

### 1. nixpacks.toml
```toml
providers = ["php"]

[phases.setup]
nixPkgs = ["php82", "php82Packages.composer"]

[phases.install]
cmds = ["composer install --no-dev --optimize-autoloader"]

[phases.build]
cmds = []

[start]
cmd = "php -S 0.0.0.0:$PORT index.php"

[variables]
NIXPACKS_PHP_ROOT_DIR = "/app"
```

### 2. Procfile (Alternative)
```
web: php -S 0.0.0.0:$PORT index.php
```

### 2. Updated index.php
- Better error handling for missing Composer dependencies
- Improved static file serving with proper caching headers
- Fallback routing for SPA

### 3. Updated index.html
- Fixed Content Security Policy to allow localStorage access
- Added `storage-src 'self'` directive
- Added `'unsafe-eval'` for dynamic script execution

### 4. Enhanced Error Handling
- Added try-catch blocks around localStorage access
- Graceful fallback when storage is unavailable
- Better error logging

### 5. .htaccess for Apache
- Proper URL rewriting for SPA
- Security headers
- Static asset caching

## Environment Variables

No special environment variables are required for basic deployment. The application will work with default settings.

## Troubleshooting

### If you still get 404 errors:
1. Check that `index.php` is in the project root
2. Verify that the web server is configured to use `index.php` as the entry point
3. Check Coolify logs for any PHP errors

### If localStorage still doesn't work:
1. Check browser console for CSP violations
2. Ensure the domain is using HTTPS (some browsers require this for localStorage)
3. Check if the browser has localStorage disabled

### If static assets don't load:
1. Verify file paths are correct
2. Check that the `.htaccess` file is being processed
3. Ensure proper MIME types are set

## Testing Locally

To test the deployment locally:

```bash
# Install dependencies
composer install

# Start PHP development server
php -S localhost:8000 index.php
```

Visit `http://localhost:8000` to test the application.

## Production Notes

- The application uses in-memory storage as fallback when localStorage is unavailable
- All static assets are properly cached
- Security headers are configured
- The application is optimized for production deployment
