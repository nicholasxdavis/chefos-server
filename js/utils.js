/**
 * Utility functions for ChefOS
 */

// Simple utility functions
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim();
}

function validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max ? num : null;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Simple UI functions
function getElement(id) {
    return document.getElementById(id);
}

function getElements(selector) {
    return document.querySelectorAll(selector);
}

function showToast(message, type = 'info', duration = 3000) {
    const toastElement = getElement('toast-notification');
    if (!toastElement) return;

    const sanitizedMessage = sanitizeInput(message);
    const icon = '<svg class="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><use href="#icon-info"></use></svg>';

    // Create a new toast div
    const toast = document.createElement('div');
    toast.className = 'animate__animated animate__fadeInRight mb-2 flex items-center p-4 rounded-lg shadow-lg';
    toast.style.backgroundColor = '#1eb854'; // Accent color for all toasts
    toast.style.color = '#ffffff';

    toast.innerHTML = `
        ${icon}
        <span>${sanitizedMessage}</span>
    `;

    toastElement.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('animate__fadeInRight');
        toast.classList.add('animate__fadeOutRight');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, duration);
}


// Recipe parsing and scaling functions
function parseRecipe(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Pre-process: Handle broken words across lines (e.g., "Baki-\nng powder")
    text = text.replace(/([a-z])-\s*\n\s*([a-z])/gi, '$1$2');
    
    // Split into segments (handle both line breaks and commas for inline format)
    let segments = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
        // Check if line contains multiple comma-separated ingredients (inline format)
        if (line.includes(',') && (line.match(/\([^)]*\d+[^)]*\)/g) || []).length > 1) {
            // Inline format: split by commas but keep parentheses content together
            const parts = line.split(/,(?![^()]*\))/);
            segments.push(...parts);
        } else {
            segments.push(line);
        }
    }
    
    const ingredients = [];
    
    for (let segment of segments) {
        segment = segment.trim();
        if (!segment) continue;
        
        const parsed = parseIngredientSegment(segment);
        if (parsed) {
            ingredients.push(parsed);
        }
    }
    
    return ingredients;
}

function parseIngredientSegment(segment) {
    // Comprehensive unit mappings
    const unitAliases = {
        'c': 'cup', 'C': 'cup', 'cups': 'cup',
        'tbsp': 'tablespoon', 'Tbsp': 'tablespoon', 'T': 'tablespoon', 'tablespoons': 'tablespoon',
        'tsp': 'teaspoon', 't': 'teaspoon', 'teaspoons': 'teaspoon',
        'oz': 'ounce', 'ounces': 'ounce',
        'lb': 'pound', 'lbs': 'pound', 'pounds': 'pound',
        'g': 'gram', 'grams': 'gram',
        'kg': 'kilogram', 'kgs': 'kilogram', 'kilograms': 'kilogram',
        'ml': 'milliliter', 'milliliters': 'milliliter',
        'l': 'liter', 'liters': 'liter',
        'large': 'large', 'medium': 'medium', 'small': 'small', 'whole': 'whole'
    };
    
    // Pre-normalize the segment
    let normalized = segment;
    
    // Remove bullets at start
    normalized = normalized.replace(/^[•\-\*\+]+\s*/, '');
    
    // Handle various separators but keep them as markers
    normalized = normalized.replace(/::+/g, ':');
    normalized = normalized.replace(/>>>+/g, '>');
    normalized = normalized.replace(/\.\.\./g, ' ');
    
    // Handle "x4" format
    normalized = normalized.replace(/\bx(\d+)/gi, '$1');
    
    // Handle @ symbol
    normalized = normalized.replace(/\s*@\s*/g, ' ');
    
    // Handle "?" and "yep"
    normalized = normalized.replace(/\?/g, '');
    normalized = normalized.replace(/\byep:?\s*/gi, '');
    
    // Handle "one" as "1"
    normalized = normalized.replace(/\bone\b/gi, '1');
    
    // Handle dots between words: "milk.whole.room" -> "milk whole room"
    normalized = normalized.replace(/\.(?=[a-z])/gi, ' ');
    
    // Fix abbreviations
    normalized = normalized.replace(/\bext\.\s*/gi, 'extract ');
    normalized = normalized.replace(/\bgran\.\s*/gi, 'granulated ');
    
    // Normalize multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Try to extract quantity, unit, and name using multiple patterns
    let result = null;
    
    // Pattern 1: Quantity and unit stuck together at end: "Baking powder 2½tsp"
    const pattern1 = /^(.+?)\s+([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[\d\/]+)*)\s*([a-zA-Z]+)$/i;
    const match1 = normalized.match(pattern1);
    if (match1) {
        const [, name, qtyStr, unit] = match1;
        if (Object.keys(unitAliases).includes(unit) || Object.values(unitAliases).includes(unit.toLowerCase())) {
            result = extractIngredient(name, qtyStr, unit, unitAliases);
        }
    }
    
    // Pattern 2: Parentheses format: "ingredient (quantity unit, extras)"
    if (!result) {
        const pattern2 = /^([^(]+)\(([^)]*?([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[\d\/\s]+)*)\s*([a-zA-Z]+)[^)]*)\)(.*)$/i;
        const match2 = normalized.match(pattern2);
        if (match2) {
            const [, nameBefore, , qtyStr, unit, nameAfter] = match2;
            if (Object.keys(unitAliases).includes(unit) || Object.values(unitAliases).includes(unit.toLowerCase())) {
                const fullName = (nameBefore.trim() + ' ' + nameAfter.trim()).trim();
                result = extractIngredient(fullName, qtyStr, unit, unitAliases);
            }
        }
    }
    
    // Pattern 3: Standard "quantity unit name"
    if (!result) {
        const pattern3 = /^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s+[\d\/]+)*)\s+([a-zA-Z]+)\s+(.+)$/i;
        const match3 = normalized.match(pattern3);
        if (match3) {
            const [, qtyStr, unit, name] = match3;
            if (Object.keys(unitAliases).includes(unit) || Object.values(unitAliases).includes(unit.toLowerCase())) {
                result = extractIngredient(name, qtyStr, unit, unitAliases);
            }
        }
    }
    
    // Pattern 4: With separators "name = quantity unit" or "name : quantity unit"
    if (!result) {
        const pattern4 = /^(.+?)\s*[=:–>~]+\s*([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[\d\/]+)*)\s*([a-zA-Z]+)(.*)$/i;
        const match4 = normalized.match(pattern4);
        if (match4) {
            const [, name, qtyStr, unit, extras] = match4;
            if (Object.keys(unitAliases).includes(unit) || Object.values(unitAliases).includes(unit.toLowerCase())) {
                const fullName = extras ? `${name.trim()} ${extras.trim()}` : name.trim();
                result = extractIngredient(fullName, qtyStr, unit, unitAliases);
            }
        }
    }
    
    // Pattern 5: Brackets format "quantity unit name [extras]"
    if (!result) {
        const pattern5 = /^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s+[\d\/]+)*)\s+([a-zA-Z]+)\s+([^\[]+)(?:\[([^\]]+)\])?$/i;
        const match5 = normalized.match(pattern5);
        if (match5) {
            const [, qtyStr, unit, name, extras] = match5;
            if (Object.keys(unitAliases).includes(unit) || Object.values(unitAliases).includes(unit.toLowerCase())) {
                const fullName = extras ? `${name.trim()} ${extras.trim()}` : name.trim();
                result = extractIngredient(fullName, qtyStr, unit, unitAliases);
            }
        }
    }
    
    // Pattern 6: Count-based items without traditional units "2 eggs" or "5 hotdogs"
    if (!result) {
        const pattern6 = /^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s+[\d\/]+)*)\s+(.+)$/i;
        const match6 = normalized.match(pattern6);
        if (match6) {
            const [, qtyStr, name] = match6;
            const quantity = parseQuantity(qtyStr);
            
            if (!isNaN(quantity) && quantity > 0) {
                // Use empty string as unit for count-based items
                const cleanedName = cleanIngredientName(name);
                return {
                    quantity,
                    unit: '', // No unit for count items
                    name: cleanedName,
                    rawQty: qtyStr.trim()
                };
            }
        }
    }
    
    // Pattern 7: Item first then quantity "eggs 2" or "hotdogs 5"
    if (!result) {
        const pattern7 = /^(.+?)\s+([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[\d\/]+)*)$/i;
        const match7 = normalized.match(pattern7);
        if (match7) {
            const [, name, qtyStr] = match7;
            const quantity = parseQuantity(qtyStr);
            
            if (!isNaN(quantity) && quantity > 0) {
                const cleanedName = cleanIngredientName(name);
                // Only accept if name doesn't end with a unit (avoid false matches)
                const nameWords = cleanedName.toLowerCase().split(/\s+/);
                const lastWord = nameWords[nameWords.length - 1];
                const isUnit = Object.keys(unitAliases).includes(lastWord) || 
                              Object.values(unitAliases).includes(lastWord);
                
                if (!isUnit) {
                    return {
                        quantity,
                        unit: '',
                        name: cleanedName,
                        rawQty: qtyStr.trim()
                    };
                }
            }
        }
    }
    
    return result;
}

function extractIngredient(name, qtyStr, unit, unitAliases) {
    const quantity = parseQuantity(qtyStr);
    
    if (isNaN(quantity) || quantity <= 0) {
        return null;
    }
    
    // Normalize unit
    const normalizedUnit = unitAliases[unit] || unitAliases[unit.toLowerCase()] || unit.toLowerCase();
    
    // Apply singular/plural rules
    const displayUnit = getSingularPluralUnit(quantity, normalizedUnit);
    
    // Clean the name
    const cleanedName = cleanIngredientName(name);
    
    return {
        quantity,
        unit: displayUnit,
        name: cleanedName,
        rawQty: qtyStr.trim()
    };
}

function getSingularPluralUnit(quantity, unit) {
    // If no unit (count items), return empty
    if (!unit) return '';
    
    // Map of singular -> plural forms
    const pluralMap = {
        'cup': 'cups',
        'tablespoon': 'tablespoons',
        'teaspoon': 'teaspoons',
        'ounce': 'ounces',
        'pound': 'pounds',
        'gram': 'grams',
        'kilogram': 'kilograms',
        'milliliter': 'milliliters',
        'liter': 'liters'
    };
    
    // Use singular for exactly 1, plural for everything else
    if (quantity === 1) {
        // Return singular form
        return unit;
    } else {
        // Return plural form
        return pluralMap[unit] || unit;
    }
}

function cleanIngredientName(name) {
    // Remove separators but preserve structure
    name = name.replace(/[=:~>]+/g, '');
    name = name.replace(/\[|\]/g, ''); // Remove brackets
    
    // Clean up extra symbols while preserving commas and hyphens in names
    name = name.replace(/–\s*$/, ''); // Remove trailing dashes
    name = name.replace(/^\s*–/, ''); // Remove leading dashes
    
    // Normalize spaces
    name = name.replace(/\s+/g, ' ');
    
    // Handle parenthetical content - keep it but clean
    name = name.replace(/\(([^)]+)\)/g, (match, content) => {
        // Keep meaningful parenthetical content
        if (content.toLowerCase().includes('room') || 
            content.toLowerCase().includes('soft') ||
            content.toLowerCase().includes('unsalt')) {
            return `(${content.trim()})`;
        }
        return ''; // Remove if just numbers/units
    });
    
    // Final cleanup
    name = name.replace(/\s+/g, ' ').trim();
    
    // Capitalize properly (but preserve "all-purpose", "room-temp", etc.)
    if (name.length > 0 && name.charAt(0) !== name.charAt(0).toUpperCase()) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    return name;
}

function parseQuantity(qtyStr) {
    if (!qtyStr || typeof qtyStr !== 'string') return 0;
    
    // Clean up the string
    qtyStr = qtyStr.trim();
    
    // Handle word numbers first
    const wordNumbers = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
    };
    
    for (const [word, num] of Object.entries(wordNumbers)) {
        qtyStr = qtyStr.replace(new RegExp(`\\b${word}\\b`, 'gi'), num);
    }
    
    // Handle Unicode fractions
    const unicodeFractions = {
        '½': '0.5', '⅓': '0.333', '⅔': '0.667', '¼': '0.25', '¾': '0.75',
        '⅕': '0.2', '⅖': '0.4', '⅗': '0.6', '⅘': '0.8', '⅙': '0.167',
        '⅚': '0.833', '⅛': '0.125', '⅜': '0.375', '⅝': '0.625', '⅞': '0.875'
    };
    
    let workingStr = qtyStr;
    
    // Handle "2+1/2" format to "2 1/2" BEFORE processing fractions
    workingStr = workingStr.replace(/(\d+)\+(\d+)\/(\d+)/g, '$1 $2/$3');
    workingStr = workingStr.replace(/(\d+)\+([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, '$1 $2');
    
    // Replace Unicode fractions with space + decimal to keep them separate
    for (const [unicode, decimal] of Object.entries(unicodeFractions)) {
        workingStr = workingStr.replace(new RegExp(unicode, 'g'), ` ${decimal} `);
    }
    
    // Normalize spacing around numbers
    workingStr = workingStr.replace(/\s+/g, ' ').trim();
    
    // Split by spaces and sum all numeric values
    const parts = workingStr.split(/\s+/);
    let total = 0;
    
    for (const part of parts) {
        if (!part) continue;
        
        if (part.includes('/')) {
            // Handle fractions like 1/2, 3/4
            const [numerator, denominator] = part.split('/');
            const num = parseFloat(numerator);
            const den = parseFloat(denominator);
            if (den && !isNaN(num) && !isNaN(den) && den !== 0) {
                total += num / den;
            }
        } else {
            // Handle decimal numbers (support both . and ,)
            const cleaned = part.replace(',', '.');
            const num = parseFloat(cleaned);
            if (!isNaN(num)) {
                total += num;
            }
        }
    }
    
    return total;
}

function formatKitchenQuantity(qty, unit) {
    if (qty <= 0) return 'a dash';
    
    // Convert to appropriate units for large quantities
    const converted = convertToPracticalUnit(qty, unit);
    
    // Handle common kitchen fractions for small quantities
    if (converted.qty < 1) {
        const fractions = {
            0.125: '⅛',
            0.25: '¼',
            0.333: '⅓',
            0.5: '½',
            0.667: '⅔',
            0.75: '¾'
        };
        
        for (const [decimal, fraction] of Object.entries(fractions)) {
            if (Math.abs(converted.qty - parseFloat(decimal)) < 0.01) {
                return `${fraction} ${converted.unit}`;
            }
        }
    }
    
    // Format the quantity nicely
    let formattedQty;
    if (converted.qty >= 1000) {
        formattedQty = Math.round(converted.qty).toLocaleString();
    } else if (converted.qty >= 10) {
        formattedQty = Math.round(converted.qty * 10) / 10;
    } else if (converted.qty >= 1) {
        formattedQty = Math.round(converted.qty * 100) / 100;
    } else {
        formattedQty = Math.round(converted.qty * 1000) / 1000;
    }
    
    return `${formattedQty} ${converted.unit}`;
}

function convertToPracticalUnit(qty, unit) {
    const unitConversions = {
        // Volume conversions
        'cup': { to: 'cups', threshold: 4, factor: 1 },
        'cups': { to: 'cups', threshold: 4, factor: 1 },
        'tablespoon': { to: 'tablespoons', threshold: 16, factor: 1 },
        'tbsp': { to: 'tablespoons', threshold: 16, factor: 1 },
        'tablespoons': { to: 'tablespoons', threshold: 16, factor: 1 },
        'teaspoon': { to: 'teaspoons', threshold: 16, factor: 1 },
        'tsp': { to: 'teaspoons', threshold: 16, factor: 1 },
        'teaspoons': { to: 'teaspoons', threshold: 16, factor: 1 },
        'ml': { to: 'ml', threshold: 1000, factor: 1 },
        'milliliter': { to: 'ml', threshold: 1000, factor: 1 },
        'milliliters': { to: 'ml', threshold: 1000, factor: 1 },
        
        // Weight conversions
        'g': { to: 'g', threshold: 1000, factor: 1 },
        'gram': { to: 'g', threshold: 1000, factor: 1 },
        'grams': { to: 'g', threshold: 1000, factor: 1 },
        'oz': { to: 'oz', threshold: 16, factor: 1 },
        'ounce': { to: 'oz', threshold: 16, factor: 1 },
        'ounces': { to: 'oz', threshold: 16, factor: 1 },
        'lb': { to: 'lbs', threshold: 1, factor: 1 },
        'pound': { to: 'lbs', threshold: 1, factor: 1 },
        'pounds': { to: 'lbs', threshold: 1, factor: 1 },
        'kg': { to: 'kg', threshold: 1, factor: 1 },
        'kilogram': { to: 'kg', threshold: 1, factor: 1 },
        'kilograms': { to: 'kg', threshold: 1, factor: 1 },
        
        // Count items
        'large': { to: 'large', threshold: 50, factor: 1 },
        'medium': { to: 'medium', threshold: 50, factor: 1 },
        'small': { to: 'small', threshold: 50, factor: 1 },
        'egg': { to: 'eggs', threshold: 1, factor: 1 },
        'eggs': { to: 'eggs', threshold: 1, factor: 1 }
    };
    
    const conversion = unitConversions[unit.toLowerCase()];
    if (!conversion) {
        return { qty, unit };
    }
    
    // Convert to larger units if quantity exceeds threshold
    if (qty >= conversion.threshold) {
        if (unit.toLowerCase() === 'cup' || unit.toLowerCase() === 'cups') {
            // Convert cups to quarts/gallons
            if (qty >= 16) {
                return { qty: qty / 16, unit: 'gallons' };
            } else if (qty >= 4) {
                return { qty: qty / 4, unit: 'quarts' };
            }
        } else if (unit.toLowerCase() === 'tablespoon' || unit.toLowerCase() === 'tbsp' || unit.toLowerCase() === 'tablespoons') {
            // Convert tablespoons to cups
            if (qty >= 16) {
                return { qty: qty / 16, unit: 'cups' };
            }
        } else if (unit.toLowerCase() === 'teaspoon' || unit.toLowerCase() === 'tsp' || unit.toLowerCase() === 'teaspoons') {
            // Convert teaspoons to tablespoons
            if (qty >= 3) {
                return { qty: qty / 3, unit: 'tablespoons' };
            }
        } else if (unit.toLowerCase() === 'ml' || unit.toLowerCase() === 'milliliter' || unit.toLowerCase() === 'milliliters') {
            // Convert ml to liters
            if (qty >= 1000) {
                return { qty: qty / 1000, unit: 'liters' };
            }
        } else if (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gram' || unit.toLowerCase() === 'grams') {
            // Convert grams to kilograms
            if (qty >= 1000) {
                return { qty: qty / 1000, unit: 'kg' };
            }
        } else if (unit.toLowerCase() === 'oz' || unit.toLowerCase() === 'ounce' || unit.toLowerCase() === 'ounces') {
            // Convert ounces to pounds
            if (qty >= 16) {
                return { qty: qty / 16, unit: 'lbs' };
            }
        }
    }
    
    return { qty, unit: conversion.to };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeInput,
        validateNumber,
        escapeHtml,
        getElement,
        getElements,
        showToast,
        parseRecipe,
        formatKitchenQuantity
    };
}