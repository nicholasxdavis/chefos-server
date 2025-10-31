/**
 * Custom Popup Interceptor for ChefOS
 * Replaces browser alert(), confirm(), and prompt() with custom themed popups
 * Fully integrated with app themes and light/dark modes
 */

// Store original functions
const originalAlert = window.alert;
const originalConfirm = window.confirm;
const originalPrompt = window.prompt;

// Custom alert function
window.alert = function(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'chefos-popup-overlay';
    
    const container = document.createElement('div');
    container.className = 'chefos-popup-container';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'chefos-popup-icon-container';
    iconContainer.innerHTML = `
      <svg class="chefos-popup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    `;
    
    const title = document.createElement('div');
    title.className = 'chefos-popup-title';
    title.textContent = 'Notice';
    
    const msg = document.createElement('div');
    msg.className = 'chefos-popup-message';
    msg.textContent = message;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'chefos-popup-buttons';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'chefos-popup-button chefos-popup-button-primary';
    closeButton.textContent = 'OK';
    closeButton.addEventListener('click', () => {
      overlay.classList.add('chefos-popup-fade-out');
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve();
      }, 200);
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeButton.click();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    buttonContainer.appendChild(closeButton);
    container.appendChild(iconContainer);
    container.appendChild(title);
    container.appendChild(msg);
    container.appendChild(buttonContainer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Focus the button
    setTimeout(() => closeButton.focus(), 100);
  });
};

// Custom confirm function
window.confirm = function(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'chefos-popup-overlay';
    
    const container = document.createElement('div');
    container.className = 'chefos-popup-container';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'chefos-popup-icon-container chefos-popup-icon-warning';
    iconContainer.innerHTML = `
      <svg class="chefos-popup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    `;
    
    const title = document.createElement('div');
    title.className = 'chefos-popup-title';
    title.textContent = 'Confirm';
    
    const msg = document.createElement('div');
    msg.className = 'chefos-popup-message';
    msg.textContent = message;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'chefos-popup-buttons';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'chefos-popup-button chefos-popup-button-secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
      overlay.classList.add('chefos-popup-fade-out');
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(false);
      }, 200);
    });
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'chefos-popup-button chefos-popup-button-primary';
    confirmButton.textContent = 'Confirm';
    confirmButton.addEventListener('click', () => {
      overlay.classList.add('chefos-popup-fade-out');
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(true);
      }, 200);
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        cancelButton.click();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    container.appendChild(iconContainer);
    container.appendChild(title);
    container.appendChild(msg);
    container.appendChild(buttonContainer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Focus the confirm button
    setTimeout(() => confirmButton.focus(), 100);
  });
};

// Custom prompt function
window.prompt = function(message, defaultValue = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'chefos-popup-overlay';
    
    const container = document.createElement('div');
    container.className = 'chefos-popup-container';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'chefos-popup-icon-container chefos-popup-icon-input';
    iconContainer.innerHTML = `
      <svg class="chefos-popup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
      </svg>
    `;
    
    const title = document.createElement('div');
    title.className = 'chefos-popup-title';
    title.textContent = 'Input Required';
    
    const msg = document.createElement('div');
    msg.className = 'chefos-popup-message';
    msg.textContent = message;
    
    const input = document.createElement('input');
    input.className = 'chefos-popup-input';
    input.type = 'text';
    input.value = defaultValue;
    input.placeholder = 'Enter value...';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'chefos-popup-buttons';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'chefos-popup-button chefos-popup-button-secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
      overlay.classList.add('chefos-popup-fade-out');
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(null);
      }, 200);
    });
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'chefos-popup-button chefos-popup-button-primary';
    confirmButton.textContent = 'Submit';
    confirmButton.addEventListener('click', () => {
      overlay.classList.add('chefos-popup-fade-out');
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(input.value);
      }, 200);
    });
    
    // Submit on Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmButton.click();
      }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        cancelButton.click();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    container.appendChild(iconContainer);
    container.appendChild(title);
    container.appendChild(msg);
    container.appendChild(input);
    container.appendChild(buttonContainer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Focus the input
    setTimeout(() => input.focus(), 100);
  });
};

// Export original functions in case needed
window._originalPopups = {
  alert: originalAlert,
  confirm: originalConfirm,
  prompt: originalPrompt
};

console.log('✅ ChefOS Custom Popups Loaded');

