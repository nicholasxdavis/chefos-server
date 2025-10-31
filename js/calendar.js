/**
 * Calendar Management for ChefOS - Robust & Mobile-Optimized
 */

// Calendar state with safe defaults
let currentCalendarDate = new Date();
let currentCalendarView = 'month'; // 'month' or 'week'
let selectedDate = null;
let calendarData = {};

// Safe element getter with error handling
function safeGetElement(id) {
    try {
        return document.getElementById(id);
    } catch (error) {
        console.warn(`Calendar: Element ${id} not found`, error);
        return null;
    }
}

// Initialize calendar with full error handling
function initializeCalendar() {
    try {
        console.log('Initializing calendar...');
        loadCalendarData();
        renderCalendar();
        setupCalendarEventListeners();
        updateCalendarStats();
        console.log('Calendar initialized successfully');
    } catch (error) {
        console.error('Calendar initialization error:', error);
        showToast('Calendar loading issue. Refreshing...', 'warning');
        // Attempt recovery
        setTimeout(() => {
            try {
                renderCalendar();
            } catch (e) {
                console.error('Calendar recovery failed:', e);
            }
        }, 1000);
    }
}

// Load calendar data from storage with error handling
function loadCalendarData() {
    try {
        const data = storage.get('chefos_calendar', {});
        calendarData = data && typeof data === 'object' ? data : {};
        console.log('Calendar data loaded:', Object.keys(calendarData).length, 'dates');
    } catch (error) {
        console.error('Error loading calendar data:', error);
        calendarData = {};
    }
}

// Save calendar data to storage with error handling
function saveCalendarData() {
    try {
        storage.set('chefos_calendar', calendarData);
        updateCalendarStats();
        console.log('Calendar data saved');
    } catch (error) {
        console.error('Error saving calendar data:', error);
        showToast('Error saving calendar. Please try again.', 'error');
    }
}

// Format date as YYYY-MM-DD for storage keys
function formatDateKey(date) {
    try {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error('Invalid date provided');
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return formatDateKey(new Date()); // Fallback to today
    }
}

// Render calendar based on current view with error handling
function renderCalendar() {
    try {
        if (currentCalendarView === 'month') {
            renderMonthView();
        } else {
            renderWeekView();
        }
        updateMonthYearDisplay();
    } catch (error) {
        console.error('Error rendering calendar:', error);
        showToast('Calendar display error. Resetting view.', 'error');
        // Reset to month view and try again
        currentCalendarView = 'month';
        setTimeout(() => {
            try {
                renderMonthView();
                updateMonthYearDisplay();
            } catch (e) {
                console.error('Calendar recovery failed:', e);
            }
        }, 100);
    }
}

// Update month/year display with error handling
function updateMonthYearDisplay() {
    try {
        const monthYear = safeGetElement('calendar-month-year');
        if (!monthYear) return;
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = currentCalendarDate.getMonth();
        const year = currentCalendarDate.getFullYear();
        
        if (monthIndex < 0 || monthIndex > 11) {
            throw new Error('Invalid month index');
        }
        
        monthYear.textContent = `${months[monthIndex]} ${year}`;
    } catch (error) {
        console.error('Error updating month/year display:', error);
    }
}

// Render month view with comprehensive error handling
function renderMonthView() {
    const grid = safeGetElement('calendar-days-grid');
    if (!grid) {
        console.warn('Calendar grid element not found');
        return;
    }
    
    try {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Clear grid safely
        grid.innerHTML = '';
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day-cell empty';
            grid.appendChild(emptyCell);
        }
        
        // Add days of month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            try {
                const date = new Date(year, month, day);
                const dateKey = formatDateKey(date);
                const dayItems = Array.isArray(calendarData[dateKey]) ? calendarData[dateKey] : [];
                
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day-cell';
                
                // Check if today
                const cellDate = new Date(year, month, day);
                cellDate.setHours(0, 0, 0, 0);
                if (cellDate.getTime() === today.getTime()) {
                    dayCell.classList.add('today');
                }
                
                // Check if has items
                if (dayItems.length > 0) {
                    dayCell.classList.add('has-items');
                }
                
                dayCell.innerHTML = `
                    <div class="calendar-day-number">${day}</div>
                    ${dayItems.length > 0 ? `<div class="calendar-day-indicator">${dayItems.length}</div>` : ''}
                `;
                
                // Safe event listener
                dayCell.addEventListener('click', (function(dateToOpen) {
                    return function() {
                        try {
                            openDayModal(dateToOpen);
                        } catch (error) {
                            console.error('Error opening day modal:', error);
                            showToast('Error opening day planner', 'error');
                        }
                    };
                })(new Date(date)));
                
                grid.appendChild(dayCell);
            } catch (error) {
                console.error(`Error rendering day ${day}:`, error);
                // Continue rendering other days
            }
        }
    } catch (error) {
        console.error('Error in renderMonthView:', error);
        grid.innerHTML = '<div class="col-span-7 text-center py-8"><p class="text-error">Error loading calendar. Please refresh.</p></div>';
    }
}

// Render week view with error handling
function renderWeekView() {
    const weekGrid = safeGetElement('calendar-week-grid');
    if (!weekGrid) return;
    
    try {
        // Get start of week (Sunday)
        const currentDate = new Date(currentCalendarDate);
        const dayOfWeek = currentDate.getDay();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
        
        weekGrid.innerHTML = '';
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            try {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const dateKey = formatDateKey(date);
                const dayItems = Array.isArray(calendarData[dateKey]) ? calendarData[dateKey] : [];
                
                const isToday = date.getTime() === today.getTime();
                
                const dayCard = document.createElement('div');
                dayCard.className = `calendar-week-day ${isToday ? 'today' : ''}`;
                
                const dateTimestamp = date.getTime();
                
                dayCard.innerHTML = `
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h4 class="font-semibold">${days[i]}</h4>
                            <p class="text-sm opacity-70">${date.toLocaleDateString()}</p>
                        </div>
                        <button class="btn btn-ghost btn-sm btn-circle week-add-btn" data-date="${dateTimestamp}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <use href="#icon-plus"></use>
                            </svg>
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${dayItems.length === 0 ? '<p class="text-xs opacity-60 text-center py-2">No plans</p>' : renderDayItems(dayItems)}
                    </div>
                `;
                
                weekGrid.appendChild(dayCard);
            } catch (error) {
                console.error(`Error rendering week day ${i}:`, error);
            }
        }
        
        // Add event listeners to week add buttons
        const addButtons = weekGrid.querySelectorAll('.week-add-btn');
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const timestamp = parseInt(btn.dataset.date);
                if (!isNaN(timestamp)) {
                    openDayModal(new Date(timestamp));
                }
            });
        });
        
    } catch (error) {
        console.error('Error in renderWeekView:', error);
        weekGrid.innerHTML = '<div class="text-center py-8"><p class="text-error">Error loading week view</p></div>';
    }
}

// Render day items for display with error handling
function renderDayItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return '<p class="text-xs opacity-60 text-center py-2">No plans</p>';
    }
    
    try {
        return items.map((item, index) => {
            try {
                if (!item || typeof item !== 'object') return '';
                
                const mealTimeIcon = getMealTimeIcon(item.mealTime);
                const typeColor = item.type === 'recipe' ? 'text-primary' : 
                                 item.type === 'menu' ? 'text-success' : 'text-warning';
                const itemName = item.name || 'Untitled';
                
                return `
                    <div class="calendar-item ${typeColor}">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                ${mealTimeIcon}
                                <span class="text-sm font-medium truncate">${escapeHtml(itemName)}</span>
                            </div>
                            <button class="btn btn-ghost btn-xs btn-circle flex-shrink-0 remove-calendar-item-btn" data-date-key="${item.dateKey}" data-index="${index}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <use href="#icon-close"></use>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error rendering item:', error);
                return '';
            }
        }).filter(html => html).join('');
    } catch (error) {
        console.error('Error in renderDayItems:', error);
        return '<p class="text-xs text-error">Error displaying items</p>';
    }
}

// Get meal time icon
function getMealTimeIcon(mealTime) {
    try {
        const icons = {
            'breakfast': '🌅',
            'lunch': '☀️',
            'dinner': '🌙',
            'prep': '🔪'
        };
        return mealTime && icons[mealTime] ? `<span class="text-lg flex-shrink-0">${icons[mealTime]}</span>` : '';
    } catch (error) {
        return '';
    }
}

// Open day modal with error handling
function openDayModal(date) {
    try {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error('Invalid date provided to openDayModal');
        }
        
        selectedDate = date;
        const dateKey = formatDateKey(date);
        const modal = safeGetElement('calendar-day-modal');
        const title = safeGetElement('calendar-day-modal-title');
        const itemsList = safeGetElement('calendar-day-items-list');
        
        if (!modal) {
            console.error('Calendar day modal not found');
            return;
        }
        
        // Update title
        if (title) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
            title.textContent = `Plan for ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        }
        
        // Populate recipes and menus
        populateRecipeSelect();
        populateMenuSelect();
        
        // Show current items for this day
        if (itemsList) {
            const dayItems = Array.isArray(calendarData[dateKey]) ? calendarData[dateKey] : [];
            if (dayItems.length === 0) {
                itemsList.innerHTML = '<p class="text-sm opacity-70 text-center py-4">No items planned yet</p>';
            } else {
                itemsList.innerHTML = renderDayItems(dayItems);
                
                // Add event listeners to remove buttons
                const removeButtons = itemsList.querySelectorAll('.remove-calendar-item-btn');
                removeButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const dateKey = btn.dataset.dateKey;
                        const index = parseInt(btn.dataset.index);
                        if (dateKey && !isNaN(index)) {
                            removeCalendarItem(dateKey, index);
                        }
                    });
                });
            }
        }
        
        // Reset form safely
        resetCalendarForm();
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error opening day modal:', error);
        showToast('Error opening calendar day', 'error');
    }
}

// Reset calendar form
function resetCalendarForm() {
    try {
        const itemType = safeGetElement('calendar-item-type');
        const recipeContainer = safeGetElement('calendar-recipe-select-container');
        const menuContainer = safeGetElement('calendar-menu-select-container');
        const noteContainer = safeGetElement('calendar-note-container');
        const noteInput = safeGetElement('calendar-note-input');
        const mealTime = safeGetElement('calendar-meal-time');
        
        if (itemType) itemType.value = '';
        if (recipeContainer) recipeContainer.style.display = 'none';
        if (menuContainer) menuContainer.style.display = 'none';
        if (noteContainer) noteContainer.style.display = 'none';
        if (noteInput) noteInput.value = '';
        if (mealTime) mealTime.value = '';
    } catch (error) {
        console.error('Error resetting form:', error);
    }
}

// Close day modal
function closeDayModal() {
    try {
        const modal = safeGetElement('calendar-day-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        selectedDate = null;
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

// Populate recipe select with error handling
function populateRecipeSelect() {
    try {
        const select = safeGetElement('calendar-recipe-select');
        if (!select) return;
        
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        select.innerHTML = '<option value="">Choose a recipe...</option>';
        
        if (Array.isArray(savedRecipes)) {
            savedRecipes.forEach(recipe => {
                try {
                    if (recipe && recipe.id && recipe.name) {
                        const option = document.createElement('option');
                        option.value = recipe.id;
                        option.textContent = recipe.name;
                        select.appendChild(option);
                    }
                } catch (error) {
                    console.error('Error adding recipe option:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error populating recipes:', error);
    }
}

// Populate menu select with error handling
function populateMenuSelect() {
    try {
        const select = safeGetElement('calendar-menu-select');
        if (!select) return;
        
        const menus = storage.get('yieldr_menus', []);
        select.innerHTML = '<option value="">Choose a menu...</option>';
        
        if (Array.isArray(menus)) {
            menus.forEach(menu => {
                try {
                    if (menu && menu.id && menu.name) {
                        const option = document.createElement('option');
                        option.value = menu.id;
                        option.textContent = menu.name;
                        select.appendChild(option);
                    }
                } catch (error) {
                    console.error('Error adding menu option:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error populating menus:', error);
    }
}

// Add item to calendar with comprehensive validation
function addItemToCalendar() {
    try {
        if (!selectedDate) {
            showToast('No date selected', 'error');
            return;
        }
        
        const itemType = safeGetElement('calendar-item-type');
        const mealTime = safeGetElement('calendar-meal-time');
        
        if (!itemType || !itemType.value) {
            showToast('Please select an item type', 'error');
            return;
        }
        
        const dateKey = formatDateKey(selectedDate);
        
        let item = {
            dateKey: dateKey,
            type: itemType.value,
            mealTime: mealTime ? mealTime.value : '',
            createdAt: new Date().toISOString()
        };
        
        // Handle different item types
        if (itemType.value === 'recipe') {
            const recipeSelect = safeGetElement('calendar-recipe-select');
            if (!recipeSelect || !recipeSelect.value) {
                showToast('Please select a recipe', 'error');
                return;
            }
            
            const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
            const recipe = savedRecipes.find(r => r.id === recipeSelect.value);
            if (recipe) {
                item.name = recipe.name;
                item.recipeId = recipe.id;
            } else {
                showToast('Recipe not found', 'error');
                return;
            }
        } else if (itemType.value === 'menu') {
            const menuSelect = safeGetElement('calendar-menu-select');
            if (!menuSelect || !menuSelect.value) {
                showToast('Please select a menu', 'error');
                return;
            }
            
            const menus = storage.get('yieldr_menus', []);
            const menu = menus.find(m => m.id === menuSelect.value);
            if (menu) {
                item.name = menu.name;
                item.menuId = menu.id;
            } else {
                showToast('Menu not found', 'error');
                return;
            }
        } else if (itemType.value === 'note') {
            const noteInput = safeGetElement('calendar-note-input');
            if (!noteInput) {
                showToast('Note input not found', 'error');
                return;
            }
            const note = noteInput.value.trim();
            if (!note) {
                showToast('Please enter a note or task', 'error');
                return;
            }
            item.name = note;
        }
        
        // Add to calendar data safely
        if (!calendarData[dateKey]) {
            calendarData[dateKey] = [];
        }
        
        if (!Array.isArray(calendarData[dateKey])) {
            calendarData[dateKey] = [];
        }
        
        calendarData[dateKey].push(item);
        
        saveCalendarData();
        renderCalendar();
        
        // Update modal display
        const itemsList = safeGetElement('calendar-day-items-list');
        if (itemsList) {
            itemsList.innerHTML = renderDayItems(calendarData[dateKey]);
            
            // Re-add event listeners
            const removeButtons = itemsList.querySelectorAll('.remove-calendar-item-btn');
            removeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dateKey = btn.dataset.dateKey;
                    const index = parseInt(btn.dataset.index);
                    if (dateKey && !isNaN(index)) {
                        removeCalendarItem(dateKey, index);
                    }
                });
            });
        }
        
        // Reset form
        resetCalendarForm();
        
        showToast('Added to calendar!', 'success');
    } catch (error) {
        console.error('Error adding calendar item:', error);
        showToast('Error adding item. Please try again.', 'error');
    }
}

// Remove item from calendar with error handling
function removeCalendarItem(dateKey, index) {
    try {
        if (!dateKey || !calendarData[dateKey]) {
            console.warn('Invalid date key or no data for this date');
            return;
        }
        
        if (!Array.isArray(calendarData[dateKey])) {
            console.warn('Calendar data for date is not an array');
            calendarData[dateKey] = [];
            return;
        }
        
        const parsedIndex = typeof index === 'string' ? parseInt(index) : index;
        
        if (isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= calendarData[dateKey].length) {
            console.warn('Invalid index for calendar item removal');
            return;
        }
        
        calendarData[dateKey].splice(parsedIndex, 1);
        
        // Remove date entry if empty
        if (calendarData[dateKey].length === 0) {
            delete calendarData[dateKey];
        }
        
        saveCalendarData();
        renderCalendar();
        
        // Update modal if open
        const modal = safeGetElement('calendar-day-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const itemsList = safeGetElement('calendar-day-items-list');
            if (itemsList) {
                const items = Array.isArray(calendarData[dateKey]) ? calendarData[dateKey] : [];
                if (items.length === 0) {
                    itemsList.innerHTML = '<p class="text-sm opacity-70 text-center py-4">No items planned yet</p>';
                } else {
                    itemsList.innerHTML = renderDayItems(items);
                    
                    // Re-add event listeners
                    const removeButtons = itemsList.querySelectorAll('.remove-calendar-item-btn');
                    removeButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const dateKey = btn.dataset.dateKey;
                            const index = parseInt(btn.dataset.index);
                            if (dateKey && !isNaN(index)) {
                                removeCalendarItem(dateKey, index);
                            }
                        });
                    });
                }
            }
        }
        
        showToast('Item removed', 'success');
    } catch (error) {
        console.error('Error removing calendar item:', error);
        showToast('Error removing item', 'error');
    }
}

// Navigate calendar (prev/next month or week)
function navigateCalendar(direction) {
    try {
        const dir = typeof direction === 'number' ? direction : (direction > 0 ? 1 : -1);
        
        if (currentCalendarView === 'month') {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + dir);
        } else {
            currentCalendarDate.setDate(currentCalendarDate.getDate() + (dir * 7));
        }
        renderCalendar();
    } catch (error) {
        console.error('Error navigating calendar:', error);
        showToast('Navigation error. Resetting to today.', 'error');
        goToToday();
    }
}

// Go to today with error handling
function goToToday() {
    try {
        currentCalendarDate = new Date();
        renderCalendar();
        showToast('Jumped to today', 'success');
    } catch (error) {
        console.error('Error going to today:', error);
    }
}

// Switch view with error handling
function switchCalendarView(view) {
    try {
        if (view !== 'month' && view !== 'week') {
            console.warn('Invalid calendar view:', view);
            return;
        }
        
        currentCalendarView = view;
        const monthView = safeGetElement('calendar-month-view');
        const weekView = safeGetElement('calendar-week-view');
        const monthBtn = safeGetElement('calendar-view-month');
        const weekBtn = safeGetElement('calendar-view-week');
        
        if (view === 'month') {
            if (monthView) monthView.style.display = 'block';
            if (weekView) weekView.style.display = 'none';
            if (monthBtn) monthBtn.classList.add('btn-primary');
            if (weekBtn) weekBtn.classList.remove('btn-primary');
        } else {
            if (monthView) monthView.style.display = 'none';
            if (weekView) weekView.style.display = 'block';
            if (monthBtn) monthBtn.classList.remove('btn-primary');
            if (weekBtn) weekBtn.classList.add('btn-primary');
        }
        
        renderCalendar();
    } catch (error) {
        console.error('Error switching view:', error);
        showToast('View switching error', 'error');
    }
}

// Update calendar statistics with error handling
function updateCalendarStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get start and end of this week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // Get start and end of this month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Get next 7 days
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);
        
        let weekCount = 0;
        let monthCount = 0;
        let upcomingCount = 0;
        
        Object.keys(calendarData || {}).forEach(dateKey => {
            try {
                const date = new Date(dateKey);
                date.setHours(0, 0, 0, 0);
                const items = calendarData[dateKey];
                
                if (!Array.isArray(items)) return;
                
                if (date >= startOfWeek && date <= endOfWeek) {
                    weekCount += items.length;
                }
                if (date >= startOfMonth && date <= endOfMonth) {
                    monthCount += items.length;
                }
                if (date >= today && date < next7Days) {
                    upcomingCount += items.length;
                }
            } catch (error) {
                console.error('Error processing date stats:', error);
            }
        });
        
        const weekStat = safeGetElement('calendar-stat-week');
        const monthStat = safeGetElement('calendar-stat-month');
        const upcomingStat = safeGetElement('calendar-stat-upcoming');
        
        if (weekStat) weekStat.textContent = weekCount;
        if (monthStat) monthStat.textContent = monthCount;
        if (upcomingStat) upcomingStat.textContent = upcomingCount;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Setup event listeners with error handling
function setupCalendarEventListeners() {
    try {
        // Navigation
        const prevBtn = safeGetElement('calendar-prev');
        const nextBtn = safeGetElement('calendar-next');
        const todayBtn = safeGetElement('calendar-today-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigateCalendar(-1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigateCalendar(1);
            });
        }
        if (todayBtn) {
            todayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                goToToday();
            });
        }
        
        // View switchers
        const monthViewBtn = safeGetElement('calendar-view-month');
        const weekViewBtn = safeGetElement('calendar-view-week');
        
        if (monthViewBtn) {
            monthViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchCalendarView('month');
            });
        }
        if (weekViewBtn) {
            weekViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchCalendarView('week');
            });
        }
        
        // Modal controls
        const modalClose = safeGetElement('calendar-day-modal-close');
        const modalAdd = safeGetElement('calendar-day-modal-add');
        const itemTypeSelect = safeGetElement('calendar-item-type');
        const modal = safeGetElement('calendar-day-modal');
        
        if (modalClose) {
            modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                closeDayModal();
            });
        }
        if (modalAdd) {
            modalAdd.addEventListener('click', (e) => {
                e.preventDefault();
                addItemToCalendar();
            });
        }
        
        // Item type selection
        if (itemTypeSelect) {
            itemTypeSelect.addEventListener('change', (e) => {
                try {
                    const type = e.target.value;
                    const recipeContainer = safeGetElement('calendar-recipe-select-container');
                    const menuContainer = safeGetElement('calendar-menu-select-container');
                    const noteContainer = safeGetElement('calendar-note-container');
                    
                    if (recipeContainer) recipeContainer.style.display = type === 'recipe' ? 'block' : 'none';
                    if (menuContainer) menuContainer.style.display = type === 'menu' ? 'block' : 'none';
                    if (noteContainer) noteContainer.style.display = type === 'note' ? 'block' : 'none';
                } catch (error) {
                    console.error('Error changing item type:', error);
                }
            });
        }
        
        // Close modal on overlay click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeDayModal();
                }
            });
        }
        
        console.log('Calendar event listeners set up successfully');
    } catch (error) {
        console.error('Error setting up calendar listeners:', error);
    }
}

// Make functions globally available
window.initializeCalendar = initializeCalendar;
window.openDayModal = openDayModal;
window.closeDayModal = closeDayModal;
window.removeCalendarItem = removeCalendarItem;

// Auto-initialize when calendar page is shown
document.addEventListener('DOMContentLoaded', () => {
    try {
        const calendarPage = safeGetElement('calendar-page');
        if (calendarPage) {
            const observer = new MutationObserver((mutations) => {
                try {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'class' && calendarPage.classList.contains('active')) {
                            initializeCalendar();
                        }
                    });
                } catch (error) {
                    console.error('Calendar observer error:', error);
                }
            });
            
            observer.observe(calendarPage, { attributes: true });
        }
    } catch (error) {
        console.error('Error setting up calendar observer:', error);
    }
});
