(function () {
    // Calendar Application - Vanilla JavaScript
    // Academic Calendar 2025-2026 with Liquid Glass Design

    // Event Categories
    const CAL_EVENT_CATEGORY = {
        OKUL_DONEMI: 'OKUL DÖNEMİ',
        ARA_TATIL: 'ARA TATİL',
        RESMI_TATIL: 'RESMİ TATİL'
    };

    // Academic Events Data
    const ACADEMIC_EVENTS = [
        // Birinci Dönem
        { id: 'd1-start', title: '1. Dönem Başlangıcı', startDate: new Date(2025, 8, 8), category: CAL_EVENT_CATEGORY.OKUL_DONEMI },
        { id: 'd1-end', title: '1. Dönem Sonu', startDate: new Date(2026, 0, 16), category: CAL_EVENT_CATEGORY.OKUL_DONEMI },
        // Ara Tatiller
        { id: 'ara-1', title: '1. Dönem Ara Tatili', startDate: new Date(2025, 10, 10), endDate: new Date(2025, 10, 14), category: CAL_EVENT_CATEGORY.ARA_TATIL },
        { id: 'yariyil', title: 'Yarıyıl Tatili', startDate: new Date(2026, 0, 19), endDate: new Date(2026, 0, 30), category: CAL_EVENT_CATEGORY.ARA_TATIL },
        // İkinci Dönem
        { id: 'd2-start', title: '2. Dönem Başlangıcı', startDate: new Date(2026, 1, 2), category: CAL_EVENT_CATEGORY.OKUL_DONEMI },
        { id: 'd2-end', title: '2. Dönem Sonu', startDate: new Date(2026, 5, 26), category: CAL_EVENT_CATEGORY.OKUL_DONEMI },
        { id: 'ara-2', title: '2. Dönem Ara Tatili', startDate: new Date(2026, 2, 16), endDate: new Date(2026, 2, 20), category: CAL_EVENT_CATEGORY.ARA_TATIL },
        // Bayramlar
        { id: 'ramazan-2026', title: 'Ramazan Bayramı', startDate: new Date(2026, 2, 19), endDate: new Date(2026, 2, 22), category: CAL_EVENT_CATEGORY.RESMI_TATIL },
        { id: 'kurban-2026', title: 'Kurban Bayramı', startDate: new Date(2026, 4, 26), endDate: new Date(2026, 4, 30), category: CAL_EVENT_CATEGORY.RESMI_TATIL },
        // Diğer Tatiller
        { id: 'yılbası-2026', title: 'Yılbaşı Tatili', startDate: new Date(2026, 0, 1), category: CAL_EVENT_CATEGORY.RESMI_TATIL },
        { id: '23-nisan', title: '23 Nisan Ulusal Egemenlik', startDate: new Date(2026, 3, 23), category: CAL_EVENT_CATEGORY.RESMI_TATIL },
        { id: '1-mayis', title: '1 Mayıs İşçi Bayramı', startDate: new Date(2026, 4, 1), category: CAL_EVENT_CATEGORY.RESMI_TATIL },
        { id: '19-mayis', title: '19 Mayıs Gençlik ve Spor', startDate: new Date(2026, 4, 19), category: CAL_EVENT_CATEGORY.RESMI_TATIL }
    ];

    const CAL_MONTHS = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
    const CAL_WEEKDAYS = ['PZT', 'SALI', 'ÇARŞ', 'PERŞ', 'CUMA', 'CMT', 'PAZ'];

    // Calendar State
    let currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let selectedDate = new Date();
    let searchQuery = '';
    let selectedCategory = 'HEPSİ';
    let expandedCategory = null;
    let customEvents = [];
    let customCategories = [];
    let isAdminMode = false;
    let isInitialized = false;

    // --- Supabase Integration ---
    async function syncWithSupabase() {
        if (typeof CalendarSync !== 'undefined') {
            const events = await CalendarSync.fetchAll();
            if (events && events.length > 0) {
                // Akademik etkinlikleri ezmeden özel etkinlikleri güncelle
                customEvents = events;
                renderCalendar();
            }
        }
    }

    // Initialize Calendar
    function initCalendar() {
        if (isInitialized) {
            renderCalendar();
            return;
        }
        console.log('🎯 initCalendar called');
        loadFromLocalStorage();
        syncWithSupabase(); // Supabase'den çek
        renderCalendar();
        isInitialized = true;
        console.log('✅ Calendar initialization complete');
    }

    // Save functions
    function saveToLocalStorage() {
        localStorage.setItem('cal_custom_events', JSON.stringify(customEvents));
        localStorage.setItem('cal_custom_categories', JSON.stringify(customCategories));
    }

    // Load data from localStorage
    function loadFromLocalStorage() {
        try {
            const savedEvents = localStorage.getItem('calendar_events');
            const savedCats = localStorage.getItem('calendar_categories');

            if (savedEvents) {
                const parsed = JSON.parse(savedEvents);
                if (Array.isArray(parsed)) {
                    customEvents = parsed.map(e => ({
                        ...e,
                        startDate: new Date(e.startDate),
                        endDate: e.endDate ? new Date(e.endDate) : undefined
                    }));
                }
            }
            if (savedCats) {
                const parsedCats = JSON.parse(savedCats);
                if (Array.isArray(parsedCats)) {
                    customCategories = parsedCats;
                }
            }
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            customEvents = [];
            customCategories = [];
        }
    }

    // Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('calendar_events', JSON.stringify(customEvents));
        localStorage.setItem('calendar_categories', JSON.stringify(customCategories));
    }

    // Get all events
    function getAllEvents() {
        return [...ACADEMIC_EVENTS, ...customEvents];
    }

    // Get all categories
    function getAllCategories() {
        return ['HEPSİ', ...Object.values(CAL_EVENT_CATEGORY), ...customCategories];
    }

    // Check if date is in event range
    function isDateInEvent(d, m, y, event) {
        const current = new Date(y, m, d);
        current.setHours(0, 0, 0, 0);
        const start = new Date(event.startDate);
        start.setHours(0, 0, 0, 0);

        if (event.endDate) {
            const end = new Date(event.endDate);
            end.setHours(23, 59, 59, 999);
            return current >= start && current <= end;
        }
        return current.getTime() === start.getTime();
    }

    // Get events for specific day
    function getEventsForDay(d, m, y) {
        return getAllEvents().filter(event => {
            const isOnDate = isDateInEvent(d, m, y, event);
            if (!isOnDate) return false;
            if (selectedCategory !== 'HEPSİ' && event.category !== selectedCategory) return false;
            if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }

    // Check if two dates are same day
    function isSameDay(d1, d2) {
        return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    }

    // Generate calendar days
    function generateCalendarDays() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const days = [];

        // Previous month days
        const prevMonthLastDate = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDate - i, month: month - 1, year, isCurrentMonth: false });
        }

        // Current month days
        const lastDate = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDate; i++) {
            days.push({ day: i, month, year, isCurrentMonth: true });
        }

        // Next month days
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
        }

        return days;
    }

    // Open Add Event Modal
    function openAddEventModal(date = new Date(), category = null) {
        const modal = document.getElementById('calModalOverlay');
        const titleInput = document.getElementById('modalEventTitle');
        const dateInput = document.getElementById('modalEventDate');
        const catInput = document.getElementById('modalEventCategory');

        if (modal) {
            titleInput.value = '';
            dateInput.value = date.toISOString().split('T')[0];
            if (category) catInput.value = category;
            modal.classList.add('active');
            titleInput.focus();
        }
    }

    // Render Calendar
    function renderCalendar() {
        const activeElId = document.activeElement ? document.activeElement.className : null;
        const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
        const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

        if (window.innerWidth <= 768) {
            renderMobileCalendar();
        } else {
            renderDesktopCalendar();
        }

        // Odağı ve imleç pozisyonunu geri yükle
        if (activeElId && activeElId.includes('cal-search-input')) {
            const inputs = document.querySelectorAll('.cal-search-input');
            inputs.forEach(input => {
                if (input.isConnected) {
                    input.focus();
                    if (selectionStart !== null && selectionEnd !== null) {
                        input.setSelectionRange(selectionStart, selectionEnd);
                    }
                }
            });
        }
    }

    // Render Desktop Calendar
    function renderDesktopCalendar() {
        const container = document.getElementById('desktopCalendarContainer');
        if (!container) return;

        const days = generateCalendarDays();
        const today = new Date();

        container.innerHTML = `
            <div class="calendar-layout">
                <!-- Sidebar -->
                <aside class="calendar-sidebar">
                    <div class="sidebar-header">
                        <h2>AJANDA</h2>
                        ${isAdminMode ? '<div class="admin-badge">YÖNETİCİ</div>' : ''}
                    </div>
                    
                    <div class="calendar-search-wrapper">
                        <input type="text" class="cal-search-input" placeholder="ARA..." value="${searchQuery}">
                        <button class="search-submit-btn"><i data-lucide="search"></i></button>
                    </div>
                    
                    <div class="categories-list" id="categoriesList"></div>
                    
                    ${isAdminMode ? `
                        <div class="add-category-section">
                            <p>YENİ KATEGORİ</p>
                            <div class="add-category-input">
                                <input type="text" id="newCategoryInput" placeholder="KATEGORİ ADI...">
                                <button id="addCategoryBtn"><i data-lucide="plus"></i></button>
                            </div>
                        </div>
                    ` : ''}
                </aside>
                
                <!-- Main Calendar -->
                <main class="calendar-main">
                    <div class="calendar-header">
                        <div>
                            <h1 class="month-title">${CAL_MONTHS[currentDate.getMonth()]}</h1>
                            <div class="year-subtitle">${currentDate.getFullYear()}</div>
                        </div>
                        <div class="month-nav">
                            <button class="nav-prev"><i data-lucide="chevron-left"></i></button>
                            <button class="nav-next"><i data-lucide="chevron-right"></i></button>
                        </div>
                    </div>
                    
                    <div class="calendar-grid-container">
                        <div class="weekdays-header">
                            ${CAL_WEEKDAYS.map(day => `<div>${day}</div>`).join('')}
                        </div>
                        <div class="calendar-grid" id="desktopCalendarGrid">
                            ${days.map(cell => {
            const cellDate = new Date(cell.year, cell.month, cell.day);
            const events = getEventsForDay(cell.day, cell.month, cell.year);
            const isSelected = isSameDay(cellDate, selectedDate);
            const isToday = isSameDay(cellDate, today);

            return `
                                    <div class="calendar-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}" 
                                         data-date="${cell.year}-${cell.month}-${cell.day}">
                                        <span class="day-number">${cell.day}</span>
                                        <div class="day-events">
                                            ${events.slice(0, 3).map(ev => `
                                                <div class="event-pill" title="${ev.title}">
                                                    <span>${ev.title}</span>
                                                    ${isAdminMode && customEvents.some(ce => ce.id === ev.id) ? `
                                                        <button class="pill-delete-btn" data-id="${ev.id}">
                                                            <i data-lucide="trash-2"></i>
                                                        </button>
                                                    ` : ''}
                                                </div>
                                            `).join('')}
                                            ${events.length > 3 ? `<div class="event-more">+${events.length - 3}</div>` : ''}
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                    
                    ${selectedDate ? `
                        <div class="daily-events">
                            <div class="daily-events-header">
                                <h3>GÜNLÜK AKIŞ</h3>
                                <div class="selected-date-badge">
                                    ${selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <div class="daily-events-grid">
                                ${getEventsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).map(ev => `
                                    <div class="event-card">
                                        <div class="event-category">${ev.category}</div>
                                        <div class="event-card-header">
                                            <h4>${ev.title}</h4>
                                            ${isAdminMode && customEvents.some(ce => ce.id === ev.id) ? `
                                                <button class="delete-event-btn" data-id="${ev.id}" title="Sil">
                                                    <i data-lucide="trash-2"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                                ${getEventsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).length === 0 ?
                    '<div class="no-events">BU TARİHTE KAYITLI ETKİNLİK BULUNMADI</div>' : ''}
                            </div>
                        </div>
                    ` : ''}
                </main>
            </div>
        `;

        renderCategories();
        if (window.lucide) lucide.createIcons();
        attachEventListeners('desktop');
    }

    // Render Mobile Calendar (Apple Style)
    function renderMobileCalendar() {
        const container = document.getElementById('mobileCalendarContainer');
        const eventsListContainer = document.getElementById('mobileEventsList');
        if (!container) return;

        const days = generateCalendarDays();
        const today = new Date();

        container.innerHTML = `
            <div class="cal-header-mobile">
                <div class="cal-month-info">
                    <h2>${CAL_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}</h2>
                </div>
                <div class="mobile-month-nav" style="display: flex; gap: 20px;">
                    <button class="nav-prev" style="background: transparent; border: none; color: #000;"><i data-lucide="chevron-left"></i></button>
                    <button class="nav-next" style="background: transparent; border: none; color: #000;"><i data-lucide="chevron-right"></i></button>
                </div>
            </div>
            
            <div class="cal-grid-mobile">
                ${CAL_WEEKDAYS.map(day => `<div class="cal-day-name-mobile">${day}</div>`).join('')}
                ${days.map(cell => {
            const cellDate = new Date(cell.year, cell.month, cell.day);
            const events = getEventsForDay(cell.day, cell.month, cell.year);
            const isSelected = isSameDay(cellDate, selectedDate);
            const isToday = isSameDay(cellDate, today);
            const isOtherMonth = !cell.isCurrentMonth;

            const colors = {
                'OKUL DÖNEMİ': '#007aff',
                'ARA TATİL': '#ff9500',
                'RESMİ TATİL': '#ff3b30'
            };

            return `
                        <div class="cal-day-mobile ${isOtherMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
                             onclick="handleMobileDayClick(${cell.year}, ${cell.month}, ${cell.day})"
                             style="${isOtherMonth ? 'opacity: 0.1;' : ''}">
                            ${cell.day}
                            ${events.length > 0 ? `
                                <div class="event-dots-mobile">
                                    ${events.slice(0, 3).map(ev => `
                                        <div class="dot" style="background: ${ev.color || colors[ev.category] || '#a69076'}"></div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;

        renderMobileEventsDetail(eventsListContainer);
        renderCategoriesMobile(); // Render category folders

        if (window.lucide) lucide.createIcons();
        attachEventListeners('mobile');
    }

    // Render Category Folders for Mobile
    function renderCategoriesMobile() {
        const container = document.getElementById('mobileCategoryFolders');
        if (!container) return;

        const categories = getAllCategories();
        container.innerHTML = categories.map(cat => `
            <div class="mobile-folder-pill ${selectedCategory === cat ? 'active' : ''}" onclick="selectMobileCategory('${cat}')">
                <i data-lucide="${cat === 'HEPSİ' ? 'layers' : (cat === 'OKUL DÖNEMİ' ? 'book-open' : (cat === 'ARA TATİL' ? 'coffee' : 'flag'))}"></i>
                <span>${cat}</span>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Global selector for mobile search close
    window.closeMobileSearch = () => {
        document.body.classList.remove('search-active');
        const categoryFolders = document.getElementById('mobileCategoryFolders');
        if (categoryFolders) categoryFolders.style.display = 'none';
        const searchInput = document.getElementById('mobileCalendarSearch');
        if (searchInput) searchInput.blur();
    };

    // Global helper for mobile category selection
    window.selectMobileCategory = (cat) => {
        selectedCategory = cat;
        renderCalendar();
        closeMobileSearch();
    };

    // Global handler for mobile day click - Now opens detail modal
    window.handleMobileDayClick = (y, m, d) => {
        const date = new Date(y, m, d);
        selectedDate = date;
        renderCalendar();

        // Open detail modal if has events
        const events = getEventsForDay(date.getDate(), date.getMonth(), date.getFullYear());
        if (events.length > 0) {
            openEventDetailModal(date, events);
        }
    };

    // New Detail Modal for Events
    function openEventDetailModal(date, events) {
        if (!document.getElementById('eventDetailOverlay')) {
            const overlayHTML = `
                <div class="cal-modal-overlay" id="eventDetailOverlay">
                    <div class="cal-modal" style="max-height: 80vh; overflow-y: auto;">
                        <div class="modal-header">
                            <h2 style="font-size: 16px;">${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                            <button class="close-modal" onclick="closeDetailModal()">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div id="modalDetailContent"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', overlayHTML);
        }

        const content = document.getElementById('modalDetailContent');
        content.innerHTML = events.map(ev => `
            <div style="margin-bottom: 25px; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px;">
                <span class="modal-detail-badge" style="background: ${ev.color || '#a69076'}">${ev.category}</span>
                <h3 style="font-size: 18px; font-weight: 800; color: #121212; margin: 5px 0 10px 0;">${ev.title}</h3>
                ${ev.description ? `<div class="modal-detail-text">${ev.description}</div>` : ''}
                ${isAdminMode && customEvents.some(ce => ce.id === ev.id) ? `
                    <button class="delete-event-btn" onclick="deleteDetailEvent('${ev.id}')" style="background: #fff5f5; color: #ff3b30; border: none; padding: 10px 15px; border-radius: 12px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> ETKİNLİĞİ SİL
                    </button>
                ` : ''}
            </div>
        `).join('');

        document.getElementById('eventDetailOverlay').classList.add('active');
        if (window.lucide) lucide.createIcons();
    }

    window.closeDetailModal = () => {
        document.getElementById('eventDetailOverlay')?.classList.remove('active');
    };

    window.deleteDetailEvent = async (id) => {
        if (confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
            if (typeof CalendarSync !== 'undefined') {
                await CalendarSync.deleteEvent(id);
            } else {
                customEvents = customEvents.filter(ev => ev.id !== id);
                saveToLocalStorage();
                renderCalendar();
            }
            closeDetailModal();
        }
    };

    // Render Events List below the calendar (Month-wide or Search Results)
    function renderMobileEventsDetail(container) {
        if (!container) return;

        let eventsToShow = [];
        let titleText = "";

        if (searchQuery.trim() !== "") {
            // Live Search Results
            const query = searchQuery.toLowerCase().trim();
            eventsToShow = [...customEvents, ...ACADEMIC_EVENTS].filter(ev =>
                ev.title.toLowerCase().includes(query) ||
                ev.category.toLowerCase().includes(query)
            );
            titleText = `ARAMA SONUÇLARI (${eventsToShow.length})`;
        } else {
            // Month-wide events
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            eventsToShow = [...customEvents, ...ACADEMIC_EVENTS].filter(ev => {
                const evDate = new Date(ev.startDate);
                return evDate.getFullYear() === year && evDate.getMonth() === month;
            });

            // Apply category filter if active
            if (selectedCategory !== 'HEPSİ') {
                eventsToShow = eventsToShow.filter(ev => ev.category === selectedCategory);
            }

            // Sort by date
            eventsToShow.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            titleText = `${CAL_MONTHS[month].toUpperCase()} ${year} ETKİNLİKLERİ`;
        }

        if (eventsToShow.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.2);">
                    <p style="font-size: 12px; margin-top: 5px;">Kayıtlı etkinlik bulunmuyor</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <p style="font-size: 12px; font-weight: 800; color: #a69076; margin-bottom: 20px; padding-left: 5px; letter-spacing: 1px;">${titleText}</p>
            ${eventsToShow.map(ev => {
            const colors = {
                'OKUL DÖNEMİ': '#007aff',
                'ARA TATİL': '#ff9500',
                'RESMİ TATİL': '#ff3b30'
            };
            const barColor = ev.color || colors[ev.category] || '#a69076';
            const evDate = new Date(ev.startDate);
            const dateStr = evDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

            return `
                    <div class="mobile-event-card" onclick="handleMobileDayClick('${evDate.getFullYear()}-${evDate.getMonth()}-${evDate.getDate()}')">
                        <div class="event-color-bar" style="background: ${barColor};"></div>
                        <div class="event-details">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 10px; font-weight: 800; color: #a69076;">${dateStr.toUpperCase()}</span>
                                <span style="font-size: 9px; font-weight: 800; color: #bbb;">${ev.category}</span>
                            </div>
                            <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #121212;">${ev.title}</h4>
                        </div>
                        ${isAdminMode && customEvents.some(ce => ce.id === ev.id) ? `
                            <button class="delete-event-btn" onclick="event.stopPropagation(); deleteDetailEvent('${ev.id}')" style="background: transparent; border: none; color: #ff3b30; padding: 5px;">
                                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
        }).join('')}
        `;
        if (window.lucide) lucide.createIcons();
    }

    // Render Categories Sidebar
    function renderCategories() {
        const container = document.getElementById('categoriesList');
        if (!container) return;

        const allCategories = getAllCategories();

        container.innerHTML = allCategories.map(cat => `
            <div class="category-folder">
                <button class="category-btn ${selectedCategory === cat ? 'active' : ''}" data-category="${cat}">
                    <div class="category-label">
                        <i data-lucide="${expandedCategory === cat ? 'folder-open' : 'folder'}"></i>
                        <span>${cat}</span>
                    </div>
                    <i data-lucide="${expandedCategory === cat ? 'chevron-up' : 'chevron-down'}" class="chevron"></i>
                </button>
                <div class="category-content ${expandedCategory === cat ? 'open' : ''}">
                    <div class="category-content-wrapper">
                        ${getAllEvents().filter(e => e.category === cat || cat === 'HEPSİ').slice(0, 5).map(ev => `
                            <div class="event-item" title="${ev.title}" data-date="${new Date(ev.startDate).toISOString()}">• ${ev.title}</div>
                        `).join('')}
                        ${isAdminMode && cat !== 'HEPSİ' ? `
                            <div class="add-event-sidebar-btn">
                                <button class="open-add-modal-btn" data-category="${cat}">
                                    <i data-lucide="plus"></i> ETKİNLİK EKLE
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }

    // Single unified event listener attachment
    function attachEventListeners(view) {
        const prefix = view === 'mobile' ? '.mobile-calendar-wrapper ' : '';

        // Month navigation
        document.querySelector(prefix + '.nav-prev')?.addEventListener('click', () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            renderCalendar();
        });

        document.querySelector(prefix + '.nav-next')?.addEventListener('click', () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            renderCalendar();
        });

        // Day selection (Desktop Only - Mobile is handled via inline onclick)
        const dayClass = view === 'mobile' ? '.cal-day-mobile' : '.calendar-day';
        if (view !== 'mobile') {
            document.querySelectorAll(prefix + dayClass).forEach(day => {
                day.addEventListener('click', (e) => {
                    const dateParts = e.currentTarget.dataset.date.split('-');
                    const clickedDate = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10), parseInt(dateParts[2], 10));
                    selectedDate = clickedDate;
                    renderCalendar();
                });
            });
        }

        // Mobile header add button
        if (view === 'mobile') {
            const addBtn = document.getElementById('mobileAddEventBtn');
            if (addBtn) {
                addBtn.style.display = isAdminMode ? 'flex' : 'none';
                addBtn.onclick = () => openAddEventModal(selectedDate || new Date());
            }
        }

        // Search Input
        const searchInput = document.querySelector(prefix + '.cal-search-input');
        const handleSearch = (val) => {
            searchQuery = val;
            if (searchQuery.toLowerCase() === 'yönetici') {
                isAdminMode = true;
                searchQuery = '';
            } else if (searchQuery.toLowerCase() === 'çıkış') {
                isAdminMode = false;
                searchQuery = '';
            }
            renderCalendar();
        };

        searchInput?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            // Yönetici modu girişi için anlık kontrol
            if (searchQuery.toLowerCase() === 'yönetici' || searchQuery.toLowerCase() === 'çıkış') {
                handleSearch(searchQuery);
                return;
            }
            // Canlı arama için (live search)
            if (searchQuery.length > 2 || searchQuery.length === 0) {
                renderCalendar();
            }
        });

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e.target.value);
            }
        });

        document.querySelector(prefix + '.search-submit-btn')?.addEventListener('click', () => {
            if (searchInput) handleSearch(searchInput.value);
        });

        // Mobile Search Input (Sena Style)
        const mobileSearch = document.getElementById('mobileCalendarSearch');
        const categoryFolders = document.getElementById('mobileCategoryFolders');

        if (mobileSearch) {
            mobileSearch.value = searchQuery;

            // Fix overlapping icon via inline style to be sure
            mobileSearch.style.paddingLeft = '5px';

            // Show folders on focus
            mobileSearch.onfocus = () => {
                document.body.classList.add('search-active');
                if (categoryFolders) categoryFolders.style.display = 'flex';
            };

            mobileSearch.oninput = (e) => {
                searchQuery = e.target.value;
                const query = searchQuery.toLowerCase().trim();

                // Live Update List
                renderMobileEventsDetail(document.getElementById('mobileEventsList'));

                if (query === 'yönetici' || query === 'yonetici' || query === 'admin') {
                    const pass = prompt('Yönetici Şifresini Giriniz:');
                    if (pass === '829615') {
                        isAdminMode = true;
                        alert('✅ Yönetici Modu Aktif!');
                        searchQuery = '';
                        e.target.value = '';
                        renderCalendar();
                    } else if (pass !== null) {
                        alert('❌ Hatalı Şifre!');
                        e.target.value = '';
                        searchQuery = '';
                    }
                    return;
                }

                if (searchQuery.length > 2 || searchQuery.length === 0) {
                    renderCalendar();
                }
            };
        }

        // Sidebar event navigation
        document.querySelectorAll('.event-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const dateStr = e.currentTarget.dataset.date;
                if (dateStr) {
                    const eventDate = new Date(dateStr);
                    selectedDate = eventDate;
                    currentDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
                    renderCalendar();
                }
            });
            item.style.cursor = 'pointer';
        });

        document.querySelectorAll('.delete-event-btn, .pill-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const eventId = e.currentTarget.dataset.id;
                if (eventId && confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
                    if (typeof CalendarSync !== 'undefined') {
                        await CalendarSync.deleteEvent(eventId);
                    } else {
                        customEvents = customEvents.filter(ev => ev.id !== eventId);
                        saveToLocalStorage();
                        renderCalendar();
                    }
                }
            });
        });

        // Sidebar Add Event Modal Trigger
        document.querySelectorAll('.open-add-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cat = e.currentTarget.dataset.category;
                openAddEventModal(selectedDate || new Date(), cat);
            });
        });

        if (view === 'desktop') {
            // Category buttons
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cat = e.currentTarget.dataset.category;
                    selectedCategory = cat;
                    expandedCategory = expandedCategory === cat ? null : cat;
                    renderCalendar();
                });
            });

            // Add category
            document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
                const input = document.getElementById('newCategoryInput');
                if (input && input.value.trim()) {
                    const newCat = input.value.toUpperCase();
                    if (!customCategories.includes(newCat)) {
                        customCategories.push(newCat);
                        saveToLocalStorage();
                        input.value = '';
                        renderCalendar();
                    }
                }
            });

            // Add event
            document.querySelectorAll('.add-event-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cat = e.currentTarget.dataset.category;
                    const input = document.querySelector(`.new-event-input[data-category="${cat}"]`);
                    const dateInput = document.querySelector(`.event-date-input[data-category="${cat}"]`);

                    if (input && input.value.trim() && dateInput && dateInput.value) {
                        const newEvent = {
                            id: Math.random().toString(36).substr(2, 9),
                            title: input.value,
                            startDate: new Date(dateInput.value),
                            category: cat
                        };
                        customEvents.push(newEvent);
                        saveToLocalStorage();
                        input.value = '';
                        renderCalendar();
                    }
                });
            });
        }
    }

    // Initialize after DOM load
    window.addEventListener('DOMContentLoaded', () => {
        // Sync with Supabase on load
        syncWithSupabase();

        // Modal HTML ekle
        if (!document.getElementById('calModalOverlay')) {
            const modalHTML = `
                <div class="cal-modal-overlay" id="calModalOverlay">
                    <div class="cal-modal">
                        <div class="modal-header">
                            <h2>YENİ ETKİNLİK</h2>
                            <button class="close-modal" id="closeCalModal"><i data-lucide="x"></i></button>
                        </div>
                        <div class="modal-form">
                            <div class="form-group">
                                <label>ETKİNLİK ADI</label>
                                <input type="text" id="modalEventTitle" class="modal-input" placeholder="Örn: Sınav Günü...">
                            </div>
                            <div class="form-group">
                                <label>KATEGORİ</label>
                                <select id="modalEventCategory" class="modal-input">
                                    ${Object.values(CAL_EVENT_CATEGORY).map(c => `
                                        <option value="${c}">${c}</option>
                                    `).join('')}
                                    <option value="ÖZEL">ÖZEL</option>
                                    ${customCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>RENK SEÇİMİ</label>
                                <div class="color-picker-group" id="modalColorPicker">
                                    <div class="color-option selected" style="background: #a69076;" data-color="#a69076"></div>
                                    <div class="color-option" style="background: #007aff;" data-color="#007aff"></div>
                                    <div class="color-option" style="background: #ff9500;" data-color="#ff9500"></div>
                                    <div class="color-option" style="background: #ff3b30;" data-color="#ff3b30"></div>
                                    <div class="color-option" style="background: #4cd964;" data-color="#4cd964"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>TARİH</label>
                                <input type="date" id="modalEventDate" class="modal-input">
                            </div>
                            <div class="form-group">
                                <label>NOTLAR / AYRINTILAR (OPSİYONEL)</label>
                                <textarea id="modalEventDetail" placeholder="Ekstra bilgi ekleyin..." class="modal-input" style="min-height: 80px; resize: none;"></textarea>
                            </div>
                            <button class="modal-btn" id="saveModalEvent">KAYDET</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Color picker logic
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.onclick = () => {
                    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                }
            });
        }

        // Debounced resize listener
        // Modal kontrolleri
        document.getElementById('closeCalModal')?.addEventListener('click', () => {
            document.getElementById('calModalOverlay').classList.remove('active');
        });

        document.getElementById('saveModalEvent')?.addEventListener('click', async () => {
            const title = document.getElementById('modalEventTitle').value;
            const cat = document.getElementById('modalEventCategory').value;
            const dateInput = document.getElementById('modalEventDate').value;
            const color = document.querySelector('.color-option.selected')?.dataset.color || '#a69076';
            const detail = document.getElementById('modalEventDetail')?.value || '';

            if (title.trim() && dateInput) {
                const newEvent = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: title,
                    startDate: new Date(dateInput),
                    category: cat,
                    color: color,
                    description: detail
                };

                // Supabase'e kaydet
                if (typeof CalendarSync !== 'undefined') {
                    await CalendarSync.addEvent(newEvent);
                } else {
                    customEvents.push(newEvent);
                    saveToLocalStorage();
                    renderCalendar();
                }

                document.getElementById('calModalOverlay').classList.remove('active');
            }
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const calendarPage = document.getElementById('calendarPage');
                if (calendarPage && calendarPage.classList.contains('active')) {
                    renderCalendar();
                }
            }, 250);
        });
    });

    // Export internal functions to window for app.js
    window.initCalendar = initCalendar;
    window.renderCalendar = renderCalendar;

    console.log('✅ Calendar module refactored and loaded');
})();
