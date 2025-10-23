# Forgot Password and Storage Location Features

This document describes the implementation of the forgot password functionality and the data storage location switching system in ChefOS.

## 🔐 Forgot Password Functionality

### Features Implemented:
- **Forgot Password Modal**: Beautiful modal with email input and validation
- **Email Integration**: Uses existing EmailJS service to send password reset emails
- **Form Validation**: Email format validation and error handling
- **Success/Error States**: Clear feedback to users
- **Auto-fill Email**: Pre-fills email from the sign-in form if available

### How It Works:
1. User clicks "Forgot password?" on the sign-in screen
2. Modal opens with email input field (pre-filled if available)
3. User enters email and clicks "Send Reset Link"
4. System validates email and calls `/api/auth/request-reset`
5. EmailJS sends password reset email with secure token
6. User receives email with link to reset password page
7. User can reset password using the existing reset-password.html page

### API Integration:
- **Endpoint**: `POST /api/auth/request-reset`
- **Email Service**: Uses existing EmailJS integration
- **Token Generation**: Secure random tokens with 30-minute expiration
- **Email Templates**: Uses existing password reset template

## 💾 Data Storage Location Switching

### Storage Strategy:
The system implements a hybrid storage approach based on user preferences:

#### Default Behavior (Local Storage):
- **All data**: Stored locally in browser localStorage
- **Backup**: All JSON data also saved to SQL database
- **Nextcloud**: Not used

#### Cloud Storage Mode:
- **Recipes**: Local + SQL (always)
- **Menus**: Nextcloud + SQL (when cloud enabled)
- **PDFs**: Nextcloud + SQL (when cloud enabled)
- **Calendar**: Local + SQL (always)
- **Shopping Lists**: Local + SQL (always)
- **Stores**: Local + SQL (always)
- **User Preferences**: Local + SQL (always)

### Storage Functions:

#### Core Functions:
```javascript
// Check storage location
window.ChefOSStorage.getStorageLocation() // 'local' or 'cloud'
window.ChefOSStorage.isCloudStorageEnabled() // true/false
window.ChefOSStorage.isNextcloudStorageEnabled() // true/false

// Storage strategy decisions
window.ChefOSStorage.shouldUseNextcloudStorage(dataType) // true/false
window.ChefOSStorage.shouldStoreToSQL(dataType) // true/false
window.ChefOSStorage.shouldStoreLocally(dataType) // true/false
```

#### Data Operations:
```javascript
// Save data (automatically chooses storage locations)
const results = await window.ChefOSStorage.saveData('recipe', recipeData, { id: 'recipe_123' });

// Load data (tries multiple sources)
const data = await window.ChefOSStorage.loadData('menu', { id: 'menu_456' });
```

### Storage Implementation:

#### SQL Storage:
- **Always used for**: All JSON-serializable data
- **Purpose**: Primary database storage for structured data
- **API**: Uses existing `/api/{dataType}s` endpoints

#### Nextcloud Storage:
- **Used for**: Menus and PDFs when cloud storage is enabled
- **Purpose**: File storage and synchronization across devices
- **Integration**: Uses existing NextcloudService

#### Local Storage:
- **Used for**: Everything except menus/PDFs when cloud is enabled
- **Purpose**: Fast access and offline capability
- **Fallback**: Always available as backup

### Settings Integration:
- **Location**: Settings tab → Data Storage Location
- **Options**: Local Device vs ChefOS Cloud
- **Behavior**: 
  - Switching to "Local Device" disables Nextcloud storage
  - Switching to "ChefOS Cloud" enables Nextcloud for menus/PDFs
  - All changes are saved to localStorage

### User Experience:
- **Seamless Switching**: No data loss when changing storage location
- **Automatic Backup**: All data saved to multiple locations
- **Clear Feedback**: Toast notifications when switching modes
- **Fallback Support**: System works even if one storage method fails

## 🔧 Technical Implementation

### Files Modified:
- **`index.html`**: Added forgot password modal
- **`js/main.js`**: Added forgot password handlers and storage management functions

### New Functions Added:
- `showForgotPasswordModal()` - Opens forgot password modal
- `hideForgotPasswordModal()` - Closes and resets modal
- `showForgotPasswordError()` - Shows error messages
- `showForgotPasswordSuccess()` - Shows success messages
- `isValidEmail()` - Email validation
- Storage management functions for hybrid storage

### Integration Points:
- **EmailJS Service**: Uses existing email templates and configuration
- **API Endpoints**: Uses existing password reset API
- **Nextcloud Service**: Uses existing Nextcloud integration
- **Local Storage**: Uses existing localStorage patterns

## 🎯 Usage Examples

### Forgot Password:
```javascript
// User clicks "Forgot password?" button
// Modal opens automatically with email pre-filled
// User submits form → API call → Email sent → Success message
```

### Storage Switching:
```javascript
// User changes storage location in settings
// System automatically enables/disables Nextcloud
// All new data follows new storage strategy
// Existing data remains accessible from all locations
```

### Data Saving:
```javascript
// Recipe (always saves to SQL + Local)
await window.ChefOSStorage.saveData('recipe', recipeData);

// Menu (saves to SQL + Local + Nextcloud if cloud enabled)
await window.ChefOSStorage.saveData('menu', menuData);
```

## 🔒 Security Features

### Password Reset:
- **Secure Tokens**: Cryptographically secure random tokens
- **Time Expiration**: Tokens expire after 30 minutes
- **Email Validation**: Prevents email enumeration attacks
- **Rate Limiting**: Built-in protection against abuse

### Storage Security:
- **Data Isolation**: User-specific data access
- **Encryption**: All sensitive data properly handled
- **Backup Strategy**: Multiple storage locations for redundancy
- **Access Control**: Proper authentication for all operations

## 🚀 Benefits

### For Users:
- **Password Recovery**: Easy password reset process
- **Flexible Storage**: Choose between local and cloud storage
- **Data Safety**: Multiple backup locations
- **Seamless Experience**: No data loss during transitions

### For Developers:
- **Modular Design**: Easy to extend and modify
- **Error Handling**: Comprehensive error management
- **Testing**: Easy to test different storage scenarios
- **Maintenance**: Clear separation of concerns

The implementation provides a robust, user-friendly system for password recovery and flexible data storage management while maintaining data integrity and security.
