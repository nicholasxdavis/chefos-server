/**
 * Kitchen Calculator Module for ChefOS
 */

// Kitchen Calculator Module (Fixed for Culinary Accuracy)
const calculatorModule = (() => {
    let state = {
        displayValue: '0',
        firstOperand: null,
        operator: null,
        waitingForSecondOperand: false,
        unit: null,
        lastOperation: null
    };
    const memory = { value: 0, hasValue: false };
    let conversionOperand = null;

    const reset = () => {
        state = { 
            displayValue: '0', 
            firstOperand: null, 
            operator: null, 
            waitingForSecondOperand: false, 
            unit: null,
            lastOperation: null
        };
        conversionOperand = null;
        updateDisplay();
    };
    
    const updateDisplay = () => {
        if (!window.dom?.calcDisplay) return;
        
        // Format display value properly
        let displayText = state.displayValue;
        if (state.unit && !state.displayValue.includes(state.unit)) {
            displayText = `${parseFloat(state.displayValue)} ${state.unit}`;
        }
        
        // Handle long numbers
        if (displayText.length > 12) {
            const num = parseFloat(displayText);
            if (Math.abs(num) >= 1e6 || (Math.abs(num) < 0.001 && num !== 0)) {
                displayText = num.toExponential(4);
            } else {
                displayText = num.toFixed(6).replace(/\.?0+$/, '');
            }
        }
        
        window.dom.calcDisplay.value = displayText;
        
        // Update history display
        if (conversionOperand) {
            window.dom.calcHistoryDisplay.textContent = `Convert ${conversionOperand.value} ${conversionOperand.unit} of...`;
        } else if (state.operator && state.firstOperand !== null) {
            const opSymbol = { multiply: '×', divide: '÷', add: '+', subtract: '−' }[state.operator];
            window.dom.calcHistoryDisplay.textContent = `${state.firstOperand} ${state.unit || ''} ${opSymbol}`;
        } else if (state.lastOperation) {
            window.dom.calcHistoryDisplay.textContent = state.lastOperation;
        } else {
            window.dom.calcHistoryDisplay.textContent = '';
        }
        
        // Update memory indicator
        window.dom.calcMemoryIndicator.style.opacity = memory.hasValue ? '1' : '0';
    };

    const inputDigit = (digit) => {
        if (state.waitingForSecondOperand) {
            state.displayValue = digit;
            state.waitingForSecondOperand = false;
            state.unit = null;
        } else {
            state.displayValue = state.displayValue === '0' ? digit : state.displayValue + digit;
        }
        state.lastOperation = null;
    };

    const inputDecimal = () => {
        if (state.waitingForSecondOperand) { 
            state.displayValue = '0.';
            state.waitingForSecondOperand = false;
            state.unit = null;
        } else if (!state.displayValue.includes('.')) {
            state.displayValue += '.';
        }
        state.lastOperation = null;
    };

    const handleOperator = (nextOperator) => {
        const inputValue = parseFloat(state.displayValue);
        if (state.operator && state.waitingForSecondOperand) {
            state.operator = nextOperator;
            return;
        }
        if (state.firstOperand === null && !isNaN(inputValue)) {
            state.firstOperand = inputValue;
        } else if (state.operator) {
            const result = performCalculation();
            state.displayValue = String(parseFloat(result.toFixed(8)));
            state.firstOperand = result;
        }
        state.waitingForSecondOperand = true;
        state.operator = nextOperator;
        state.lastOperation = null;
    };
    
    const performCalculation = () => {
        const { firstOperand, operator, displayValue } = state;
        const secondOperand = parseFloat(displayValue);
        
        if (isNaN(firstOperand) || isNaN(secondOperand)) {
            return secondOperand;
        }
        
        let result;
        switch (operator) {
            case 'add': result = firstOperand + secondOperand; break;
            case 'subtract': result = firstOperand - secondOperand; break;
            case 'multiply': result = firstOperand * secondOperand; break;
            case 'divide': 
                if (secondOperand === 0) {
                    window.showToast('Cannot divide by zero', 'error');
                    return secondOperand;
                }
                result = firstOperand / secondOperand; 
                break;
            default: return secondOperand;
        }
        
        // Round to prevent floating point errors
        return Math.round(result * 1e8) / 1e8;
    };

    const handleUnit = (unit) => {
        state.unit = unit;
        state.waitingForSecondOperand = true;
        state.lastOperation = null;
    };

    const handleAction = (action) => {
        if (action === 'clear') {
            reset();
        } else if (action === 'equals') {
            if (state.operator === null || state.firstOperand === null) return;
            const secondOperand = parseFloat(state.displayValue);
            const result = performCalculation();
            state.displayValue = String(parseFloat(result.toFixed(8)));
            state.lastOperation = `${state.firstOperand} ${getOperatorSymbol(state.operator)} ${secondOperand} = ${result}`;
            state.firstOperand = null;
            state.operator = null;
            state.waitingForSecondOperand = true;
            state.unit = null;
        } else if (action === 'conv') {
            // IMPROVED CONVERSION LOGIC
            const value = parseFloat(state.displayValue);
            const fromUnit = state.unit; // Store original unit before conversion
            const unitInfo = window.UNIT_CONVERSIONS?.[fromUnit];
            
            if (isNaN(value) || !fromUnit || !unitInfo) {
                window.showToast('Enter a number and unit first (e.g., 250 g)', 'error');
                return;
            }
            
            const conversionTargets = {
                'g': 'oz', 'oz': 'lb', 'lb': 'kg', 'kg': 'g',
                'cup': 'ml', 'ml': 'l', 'l': 'tbsp', 'tbsp': 'tsp', 'tsp': 'cup'
            };
            
            const targetUnit = conversionTargets[fromUnit] || (unitInfo.type === 'volume' ? 'g' : 'cup');
            
            let result;
            if (unitInfo.type === window.UNIT_CONVERSIONS?.[targetUnit]?.type) {
                // Same type conversion
                result = (value * unitInfo.to_base) / window.UNIT_CONVERSIONS[targetUnit].to_base;
            } else {
                // Cross-type conversion using water density
                result = window.convertWithDensity?.(value, fromUnit, targetUnit, 'water') || value;
            }
            
            // Round to appropriate precision
            const roundedResult = Math.round(result * 1e6) / 1e6;
            state.displayValue = String(roundedResult);
            state.unit = targetUnit; // Update state unit to target
            state.waitingForSecondOperand = true;
            state.lastOperation = `Converted ${value} ${fromUnit} to ${roundedResult} ${targetUnit}`;
            
            window.showToast(`Converted ${value} ${fromUnit} to ${roundedResult} ${targetUnit}`, 'success');
        } else if (action === 'of') {
            // IMPROVED OF BUTTON LOGIC
            const value = parseFloat(state.displayValue);
            const unitInfo = window.UNIT_CONVERSIONS?.[state.unit];
            
            if (isNaN(value) || !state.unit || !unitInfo) {
                window.showToast('Enter a number and unit first (e.g., 250 g)', 'error');
                return;
            }
            
            conversionOperand = { value, unit: state.unit, type: unitInfo.type };
            state.lastOperation = `Convert ${value} ${state.unit} of...`;
            window.openIngredientModal?.();
        }
        updateDisplay();
    };

    const getOperatorSymbol = (op) => {
        const symbols = { multiply: '×', divide: '÷', add: '+', subtract: '−' };
        return symbols[op] || op;
    };

    const handleMemory = (mem) => {
        const currentValue = parseFloat(state.displayValue);
        
        switch (mem) {
            case 'mc':
                memory.value = 0;
                memory.hasValue = false;
                window.showToast('Memory cleared', 'info');
                break;
            case 'mr':
                if (memory.hasValue) {
                    state.displayValue = String(memory.value);
                    state.waitingForSecondOperand = true;
                    state.lastOperation = `Recalled ${memory.value}`;
                } else {
                    window.showToast('Memory is empty', 'error');
                }
                break;
            case 'm-plus':
                if (!isNaN(currentValue)) {
                    memory.value += currentValue;
                    memory.hasValue = true;
                    state.lastOperation = `Added ${currentValue} to memory (${memory.value})`;
                    window.showToast(`Added ${currentValue} to memory`, 'success');
                } else {
                    window.showToast('Cannot add non-numeric value to memory', 'error');
                }
                break;
        }
        updateDisplay();
    };

    const handleClick = (button) => {
        const { num, op, unit, action, mem } = button.dataset;
        
        if (num === '.') { 
            inputDecimal(); 
        } else if (num) { 
            inputDigit(num); 
        } else if (op) { 
            handleOperator(op); 
        } else if (unit) { 
            handleUnit(unit); 
        } else if (action) { 
            handleAction(action); 
        } else if (mem) { 
            handleMemory(mem); 
        }
        updateDisplay();
    };
    
    const completeConversion = (ingredient) => {
        if (!conversionOperand) return;
        const { value, unit, type } = conversionOperand;
        
        let targetUnit;
        if (type === 'volume') {
            targetUnit = 'g';
        } else {
            targetUnit = 'cup';
        }
        
        const result = window.convertWithDensity?.(value, unit, targetUnit, ingredient) || value;
        const roundedResult = Math.round(result * 1e6) / 1e6;
        
        state.displayValue = String(roundedResult);
        state.unit = targetUnit;
        state.waitingForSecondOperand = true;
        state.lastOperation = `Converted ${value} ${unit} of ${ingredient} to ${roundedResult} ${targetUnit}`;
        
        window.closeIngredientModal?.();
        conversionOperand = null;
        updateDisplay();
    };

    reset();
    return { handleClick, completeConversion, reset };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculatorModule;
}

// Make available globally
window.calculatorModule = calculatorModule;
