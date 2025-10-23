/**
 * Export Module for ChefOS
 * Handles professional exports in TXT and PDF formats
 */

let currentExportData = null;
let currentExportType = null;

// Show export format modal
function showExportFormatModal(exportType, data) {
    currentExportType = exportType;
    currentExportData = data;
    
    const modal = getElement('export-format-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Hide export format modal
function hideExportFormatModal() {
    const modal = getElement('export-format-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentExportData = null;
    currentExportType = null;
}

// Initialize export system
function initializeExportSystem() {
    const txtBtn = getElement('export-txt-btn');
    const pdfBtn = getElement('export-pdf-btn');
    const modal = getElement('export-format-modal');
    
    if (txtBtn) {
        txtBtn.addEventListener('click', () => {
            exportAsTXT();
            hideExportFormatModal();
        });
    }
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            exportAsPDF();
            hideExportFormatModal();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideExportFormatModal();
            }
        });
    }
}

// Export as TXT
function exportAsTXT() {
    if (!currentExportData || !currentExportType) return;
    
    let content = '';
    let filename = 'chefos_export.txt';
    
    switch (currentExportType) {
        case 'recipes':
            content = formatRecipesForTXT(currentExportData);
            filename = `chefos_recipes_${new Date().toISOString().split('T')[0]}.txt`;
            break;
        case 'single-recipe':
            content = formatSingleRecipeForTXT(currentExportData);
            filename = `${currentExportData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
            break;
        case 'menu':
            content = formatMenuForTXT(currentExportData);
            filename = `${currentExportData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_menu.txt`;
            break;
        case 'shopping':
            content = formatShoppingListForTXT(currentExportData);
            filename = `shopping_list_${new Date().toISOString().split('T')[0]}.txt`;
            break;
        case 'stores':
            content = formatStoresForTXT(currentExportData);
            filename = `markets_${new Date().toISOString().split('T')[0]}.txt`;
            break;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Exported as TXT successfully!', 'success');
}

// Export as PDF
function exportAsPDF() {
    if (!currentExportData || !currentExportType) return;
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let filename = 'chefos_export.pdf';
        
        switch (currentExportType) {
            case 'recipes':
                formatRecipesForPDF(doc, currentExportData);
                filename = `chefos_recipes_${new Date().toISOString().split('T')[0]}.pdf`;
                break;
            case 'single-recipe':
                formatSingleRecipeForPDF(doc, currentExportData);
                filename = `${currentExportData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
                break;
            case 'menu':
                formatMenuForPDF(doc, currentExportData);
                filename = `${currentExportData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_menu.pdf`;
                break;
            case 'shopping':
                formatShoppingListForPDF(doc, currentExportData);
                filename = `shopping_list_${new Date().toISOString().split('T')[0]}.pdf`;
                break;
            case 'stores':
                formatStoresForPDF(doc, currentExportData);
                filename = `markets_${new Date().toISOString().split('T')[0]}.pdf`;
                break;
        }
        
        doc.save(filename);
        showToast('Exported as PDF successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showToast('Error exporting PDF', 'error');
    }
}

// ============= TXT FORMATTING FUNCTIONS =============

function formatSingleRecipeForTXT(recipe) {
    let content = '═'.repeat(60) + '\n';
    content += `${recipe.name.toUpperCase()}\n`;
    content += '═'.repeat(60) + '\n\n';
    
    const yieldText = recipe.yieldUnit 
        ? `${recipe.originalServings} ${recipe.yieldUnit}`
        : `${recipe.originalServings} servings`;
    
    content += `Yield: ${yieldText}\n`;
    content += `Exported: ${new Date().toLocaleDateString()}\n\n`;
    
    content += 'INGREDIENTS\n';
    content += '─'.repeat(60) + '\n\n';
    
    recipe.ingredients.forEach(ing => {
        const unit = ing.scaledUnit || ing.unit;
        const qty = unit ? formatKitchenQuantity(ing.scaledQty || ing.quantity, unit) : (ing.scaledQty || ing.quantity).toString();
        const name = ing.name.charAt(0).toUpperCase() + ing.name.slice(1);
        content += `${name} – ${qty}\n`;
    });
    
    if (recipe.instructions) {
        content += '\n\nINSTRUCTIONS\n';
        content += '─'.repeat(60) + '\n\n';
        content += `${recipe.instructions}\n`;
    }
    
    content += '\n' + '═'.repeat(60) + '\n';
    content += 'Generated by ChefOS Professional Edition\n';
    
    return content;
}

function formatRecipesForTXT(recipes) {
    let content = '═'.repeat(60) + '\n';
    content += 'MY RECIPES COLLECTION\n';
    content += '═'.repeat(60) + '\n\n';
    content += `Exported: ${new Date().toLocaleDateString()}\n`;
    content += `Total Recipes: ${recipes.length}\n\n`;
    
    recipes.forEach((recipe, index) => {
        content += '\n' + '─'.repeat(60) + '\n';
        content += `RECIPE ${index + 1}: ${recipe.name.toUpperCase()}\n`;
        content += '─'.repeat(60) + '\n\n';
        
        const yieldText = recipe.yieldUnit 
            ? `${recipe.originalServings} ${recipe.yieldUnit}`
            : `${recipe.originalServings} servings`;
        
        content += `Yield: ${yieldText}\n\n`;
        content += 'Ingredients:\n';
        
        recipe.ingredients.forEach(ing => {
            const unit = ing.scaledUnit || ing.unit;
            const qty = unit ? formatKitchenQuantity(ing.scaledQty || ing.quantity, unit) : (ing.scaledQty || ing.quantity).toString();
            const ingName = ing.name.charAt(0).toUpperCase() + ing.name.slice(1);
            content += `  • ${ingName} – ${qty}\n`;
        });
        
        if (recipe.instructions) {
            content += '\nInstructions:\n';
            content += `  ${recipe.instructions}\n`;
        }
        content += '\n';
    });
    
    content += '═'.repeat(60) + '\n';
    content += 'Generated by ChefOS Professional Edition\n';
    
    return content;
}

function formatMenuForTXT(menu) {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const menuRecipes = menu.recipes.map(recipeId => 
        savedRecipes.find(r => r.id === recipeId)
    ).filter(r => r !== undefined);
    
    let content = '═'.repeat(60) + '\n';
    content += `${menu.name.toUpperCase()}\n`;
    content += '═'.repeat(60) + '\n\n';
    
    if (menu.description) {
        content += `${menu.description}\n\n`;
    }
    
    content += `Exported: ${new Date().toLocaleDateString()}\n`;
    content += `Total Recipes: ${menuRecipes.length}\n\n`;
    
    menuRecipes.forEach((recipe, index) => {
        content += '─'.repeat(60) + '\n';
        content += `RECIPE ${index + 1}: ${recipe.name.toUpperCase()}\n`;
        content += '─'.repeat(60) + '\n\n';
        
        const yieldText = recipe.yieldUnit 
            ? `${recipe.originalServings} ${recipe.yieldUnit}`
            : `${recipe.originalServings} servings`;
        
        content += `Yield: ${yieldText}\n\n`;
        content += 'Ingredients:\n';
        
        recipe.ingredients.forEach(ing => {
            const unit = ing.scaledUnit || ing.unit;
            const qty = unit ? formatKitchenQuantity(ing.scaledQty || ing.quantity, unit) : (ing.scaledQty || ing.quantity).toString();
            const ingName = ing.name.charAt(0).toUpperCase() + ing.name.slice(1);
            content += `  • ${ingName} – ${qty}\n`;
        });
        
        if (recipe.instructions) {
            content += '\nInstructions:\n';
            content += `  ${recipe.instructions}\n`;
        }
        
        content += '\n\n';
    });
    
    content += '═'.repeat(60) + '\n';
    content += 'Generated by ChefOS Professional Edition\n';
    
    return content;
}

function formatShoppingListForTXT(data) {
    let content = '═'.repeat(60) + '\n';
    content += 'SHOPPING LIST\n';
    content += '═'.repeat(60) + '\n\n';
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    data.categories.forEach(category => {
        const items = data.items[category.id] || [];
        if (items.length === 0) return;
        
        content += `${category.name.toUpperCase()}\n`;
        content += '─'.repeat(60) + '\n';
        
        items.forEach(item => {
            const checked = item.checked ? '[✓] ' : '[ ] ';
            const quantity = item.quantity ? ` – ${item.quantity}` : '';
            const price = item.price ? ` ($${item.price.toFixed(2)})` : '';
            content += `${checked}${item.name}${quantity}${price}\n`;
        });
        
        content += '\n';
    });
    
    content += '═'.repeat(60) + '\n';
    content += 'Generated by ChefOS Professional Edition\n';
    
    return content;
}

function formatStoresForTXT(stores) {
    let content = '═'.repeat(60) + '\n';
    content += 'SAVED MARKETS\n';
    content += '═'.repeat(60) + '\n\n';
    content += `Exported: ${new Date().toLocaleDateString()}\n`;
    content += `Total Markets: ${stores.length}\n\n`;
    
    stores.forEach((store, index) => {
        content += '─'.repeat(60) + '\n';
        content += `MARKET ${index + 1}: ${store.name.toUpperCase()}\n`;
        content += '─'.repeat(60) + '\n';
        if (store.address) content += `Address: ${store.address}\n`;
        if (store.phone) content += `Phone: ${store.phone}\n`;
        if (store.notes) content += `Notes: ${store.notes}\n`;
        content += '\n';
    });
    
    content += '═'.repeat(60) + '\n';
    content += 'Generated by ChefOS Professional Edition\n';
    
    return content;
}

// ============= PDF FORMATTING FUNCTIONS =============

function formatSingleRecipeForPDF(doc, recipe) {
    let y = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(recipe.name, 105, y, { align: 'center' });
    y += 15;
    
    // Yield
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const yieldText = recipe.yieldUnit 
        ? `Yield: ${recipe.originalServings} ${recipe.yieldUnit}`
        : `Yield: ${recipe.originalServings} servings`;
    doc.text(yieldText, 105, y, { align: 'center' });
    y += 5;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
    y += 15;
    
    // Ingredients section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INGREDIENTS', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
        recipe.ingredients.forEach(ing => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const unit = ing.scaledUnit || ing.unit;
            const qty = unit ? formatKitchenQuantity(ing.scaledQty || ing.quantity, unit) : (ing.scaledQty || ing.quantity).toString();
            const name = ing.name.charAt(0).toUpperCase() + ing.name.slice(1);
            const text = `${name} – ${qty}`;
            doc.text(text, 25, y);
            y += 6;
        });
    
    // Instructions
    if (recipe.instructions) {
        y += 10;
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('INSTRUCTIONS', 20, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(recipe.instructions, 170);
        lines.forEach(line => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 6;
        });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by ChefOS Professional Edition', 105, 285, { align: 'center' });
}

function formatRecipesForPDF(doc, recipes) {
    let y = 20;
    
    // Title page
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('MY RECIPES COLLECTION', 105, y, { align: 'center' });
    y += 20;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Exported: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
    y += 5;
    doc.text(`Total Recipes: ${recipes.length}`, 105, y, { align: 'center' });
    y += 20;
    
    recipes.forEach((recipe, index) => {
        if (y > 250 || index > 0) {
            doc.addPage();
            y = 20;
        }
        
        // Recipe title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${recipe.name}`, 20, y);
        y += 10;
        
        // Yield
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const yieldText = recipe.yieldUnit 
            ? `Yield: ${recipe.originalServings} ${recipe.yieldUnit}`
            : `Yield: ${recipe.originalServings} servings`;
        doc.text(yieldText, 20, y);
        y += 10;
        
        // Ingredients
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Ingredients:', 20, y);
        y += 7;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        recipe.ingredients.forEach(ing => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const qty = formatKitchenQuantity(ing.scaledQty || ing.quantity, ing.scaledUnit || ing.unit);
            doc.text(`• ${ing.name} – ${qty}`, 25, y);
            y += 6;
        });
        
        if (recipe.instructions) {
            y += 5;
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Instructions:', 20, y);
            y += 7;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const lines = doc.splitTextToSize(recipe.instructions, 170);
            lines.forEach(line => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 20, y);
                y += 6;
            });
        }
    });
    
    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('ChefOS Professional Edition', 105, 285, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
    }
}

function formatMenuForPDF(doc, menu) {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const menuRecipes = menu.recipes.map(recipeId => 
        savedRecipes.find(r => r.id === recipeId)
    ).filter(r => r !== undefined);
    
    let y = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(menu.name, 105, y, { align: 'center' });
    y += 15;
    
    if (menu.description) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'italic');
        const descLines = doc.splitTextToSize(menu.description, 170);
        descLines.forEach(line => {
            doc.text(line, 105, y, { align: 'center' });
            y += 6;
        });
        y += 5;
    }
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
    y += 15;
    
    menuRecipes.forEach((recipe, index) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${recipe.name}`, 20, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const yieldText = recipe.yieldUnit 
            ? `Yield: ${recipe.originalServings} ${recipe.yieldUnit}`
            : `Yield: ${recipe.originalServings} servings`;
        doc.text(yieldText, 25, y);
        y += 8;
        
        recipe.ingredients.forEach(ing => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }
            const unit = ing.scaledUnit || ing.unit;
            const qty = unit ? formatKitchenQuantity(ing.scaledQty || ing.quantity, unit) : (ing.scaledQty || ing.quantity).toString();
            const name = ing.name.charAt(0).toUpperCase() + ing.name.slice(1);
            doc.text(`${name} – ${qty}`, 30, y);
            y += 5;
        });
        
        y += 8;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('ChefOS Professional Edition', 105, 285, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
    }
}

function formatShoppingListForPDF(doc, data) {
    let y = 20;
    
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('SHOPPING LIST', 105, y, { align: 'center' });
    y += 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
    y += 15;
    
    data.categories.forEach(category => {
        const items = data.items[category.id] || [];
        if (items.length === 0) return;
        
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(category.name, 20, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        items.forEach(item => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }
            const checked = item.checked ? '☑ ' : '☐ ';
            const quantity = item.quantity ? ` – ${item.quantity}` : '';
            const price = item.price ? ` ($${item.price.toFixed(2)})` : '';
            doc.text(`${checked}${item.name}${quantity}${price}`, 25, y);
            y += 6;
        });
        
        y += 8;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('ChefOS Professional Edition', 105, 285, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
    }
}

function formatStoresForPDF(doc, stores) {
    let y = 20;
    
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('SAVED MARKETS', 105, y, { align: 'center' });
    y += 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Exported: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
    y += 5;
    doc.text(`Total Markets: ${stores.length}`, 105, y, { align: 'center' });
    y += 15;
    
    stores.forEach((store, index) => {
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${store.name}`, 20, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        if (store.address) {
            doc.text(`Address: ${store.address}`, 25, y);
            y += 6;
        }
        if (store.phone) {
            doc.text(`Phone: ${store.phone}`, 25, y);
            y += 6;
        }
        if (store.notes) {
            doc.text(`Notes: ${store.notes}`, 25, y);
            y += 6;
        }
        
        y += 8;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('ChefOS Professional Edition', 105, 285, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
    }
}

// Make functions globally available
window.showExportFormatModal = showExportFormatModal;
window.hideExportFormatModal = hideExportFormatModal;
window.initializeExportSystem = initializeExportSystem;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showExportFormatModal,
        hideExportFormatModal,
        initializeExportSystem
    };
}

