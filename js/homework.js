const now = new Date();
let currentMonth = now.getMonth();
let currentYear = now.getFullYear();
let currentSortBy = 'dueDate';
let currentView = 'month'; // 'month' or 'week'
let currentHomeworkFormMode = 'detailed';

// Global homework list - populated by HomeworkSyncV2
window.homeworkList = [];

// V2 Sync will handle all data fetching
// No more localStorage, no more manual sync calls

function removeExpiredHomework() {
    // Temporarily disabled to ensure all GitHub files are visible
    /*
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    window.homeworkList = window.homeworkList.filter(hw => {
        const dueDate = new Date(hw.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
    });
    */
}

function sortHomework(sortBy) {
    currentSortBy = sortBy;
    const sortDueBtn = document.getElementById('sortDueBtn');
    const sortGivenBtn = document.getElementById('sortGivenBtn');

    if (sortDueBtn) {
        sortDueBtn.style.background = sortBy === 'dueDate' ? 'rgba(255,255,255,0.1)' : 'transparent';
        sortDueBtn.style.color = sortBy === 'dueDate' ? '#fff' : '#888';
        sortDueBtn.style.border = sortBy === 'dueDate' ? 'none' : '1px solid #333';
    }
    if (sortGivenBtn) {
        sortGivenBtn.style.background = sortBy === 'givenDate' ? 'rgba(255,255,255,0.1)' : 'transparent';
        sortGivenBtn.style.color = sortBy === 'givenDate' ? '#fff' : '#888';
        sortGivenBtn.style.border = sortBy === 'givenDate' ? 'none' : '1px solid #333';
    }
    renderHomeworkCards();
}

function renderHomeworkCards() {
    removeExpiredHomework();
    const container = document.getElementById('homeworkCards');
    if (!container) return;
    container.innerHTML = '';

    const sorted = [...window.homeworkList].sort((a, b) => {
        if (currentSortBy === 'dueDate') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else {
            return new Date(b.givenDate) - new Date(a.givenDate);
        }
    });

    const homeworkCount = document.getElementById('homeworkCount');
    if (homeworkCount) homeworkCount.textContent = sorted.length;

    sorted.forEach((hw, index) => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: linear-gradient(135deg, rgba(50, 50, 50, 0.6) 0%, rgba(40, 40, 40, 0.6) 100%);
            backdrop-filter: blur(10px);
            padding: 22px;
            border-radius: 18px;
            margin-bottom: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: slideUp 0.4s ease ${index * 0.05}s backwards;
        `;

        card.onmouseover = () => {
            card.style.background = 'linear-gradient(135deg, rgba(60, 60, 60, 0.7) 0%, rgba(50, 50, 50, 0.7) 100%)';
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        };
        card.onmouseout = () => {
            card.style.background = 'linear-gradient(135deg, rgba(50, 50, 50, 0.6) 0%, rgba(40, 40, 40, 0.6) 100%)';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        };
        card.onclick = () => openHomeworkDetail(hw);

        const subject = document.createElement('div');
        subject.textContent = hw.subject;
        subject.style.cssText = `
            font-size: 12px;
            font-weight: 700;
            color: #fff;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
            display: inline-block;
            padding: 5px 14px;
            border-radius: 8px;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
            border: 1px solid rgba(102, 126, 234, 0.4);
            word-break: break-all;
            max-width: 100%;
        `;

        const desc = document.createElement('div');
        desc.textContent = hw.description;
        desc.style.cssText = `
            font-size: 14px;
            color: #ddd;
            margin-bottom: 14px;
            line-height: 1.5;
            font-weight: 500;
            word-break: break-word;
            overflow-wrap: break-word;
        `;

        const dates = document.createElement('div');
        dates.style.cssText = 'display: flex; gap: 18px; font-size: 12px;';

        const givenDate = document.createElement('div');
        givenDate.innerHTML = `<span style="color: #aaa; font-weight: 500;">${hw.dueDate}</span>`;

        const dueDate = document.createElement('div');
        dueDate.innerHTML = `<span style="color: #ef4444; font-weight: 700;">${hw.lesson}. Ders</span>`;

        dates.appendChild(givenDate);
        dates.appendChild(dueDate);

        card.appendChild(subject);
        card.appendChild(desc);
        card.appendChild(dates);
        container.appendChild(card);
    });

    // Regenerate calendar to update homework indicators
    const homeworkPage = document.getElementById('homeworkPage');
    if (homeworkPage && homeworkPage.classList.contains('active')) {
        generateCalendar();
        if (typeof renderMobileHomeworkList === 'function') {
            renderMobileHomeworkList();
        }
    }
}

window.renderMobileHomeworkList = function () {
    const container = document.getElementById('mobileHomeworkList');
    const totalCountEl = document.getElementById('mobileHwTotalCount');
    const urgentCountEl = document.getElementById('mobileHwUrgentCount');

    if (!container) return;

    container.innerHTML = '';

    const sorted = [...window.homeworkList].sort((a, b) => {
        if (currentSortBy === 'dueDate') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else {
            return new Date(b.givenDate) - new Date(a.givenDate);
        }
    });

    // Update Stats
    const total = sorted.length;
    let urgent = 0;
    const now = new Date();

    // Update Tab Active State
    document.querySelectorAll('.hw-tab').forEach(tab => {
        const isDueTab = tab.innerText.includes('Süresi');
        tab.classList.toggle('active', (currentSortBy === 'dueDate' && isDueTab) || (currentSortBy === 'givenDate' && !isDueTab));
    });

    if (totalCountEl) totalCountEl.textContent = total;

    sorted.forEach(hw => {
        const card = document.createElement('div');
        card.className = 'mobile-hw-card-modern animate-fade-in';
        card.onclick = () => openHomeworkDetail(hw);

        const dueDate = new Date(hw.dueDate);
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isUrgent = diffDays <= 2;
        if (isUrgent) urgent++;

        const statusLabel = isUrgent ? 'ACİL' : 'ZAMAN VAR';
        const statusClass = isUrgent ? 'urgent' : 'neutral';

        card.innerHTML = `
            <div class="hw-card-header-v2">
                <span class="hw-card-subject-v2">${hw.subject.toUpperCase()}</span>
                <span class="hw-card-status-v2 ${statusClass}">${statusLabel}</span>
            </div>
            <div class="hw-card-content-v2">
                <h3>${hw.description}</h3>
            </div>
            <div class="hw-card-footer-v2">
                <div class="footer-item">
                    <i data-lucide="calendar"></i>
                    <span>${hw.dueDate}</span>
                </div>
                <div class="footer-item">
                    <i data-lucide="clock"></i>
                    <span>${hw.lesson}. Ders</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    if (urgentCountEl) urgentCountEl.textContent = urgent;
    if (window.lucide) lucide.createIcons();
};

// This function is for the "Upcoming" section on the dashboard, 
// not the main homework page list.
window.renderMobileActiveHomeworks = function () {
    const mobileContainer = document.getElementById('mobileActiveHomeworkList');
    if (!mobileContainer) return;
    mobileContainer.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = [...window.homeworkList].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Get top 2 most urgent
    const urgent = sorted.filter(hw => new Date(hw.dueDate) >= today).slice(0, 2);

    // Add 'Tomorrow's Homework' quick action button
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowCount = sorted.filter(hw => hw.dueDate === tomorrowStr).length;

    if (tomorrowCount > 0) {
        const btn = document.createElement('button');
        btn.innerHTML = `<span style="margin-right:8px;">📅</span> Yarının Ödevleri (${tomorrowCount})`;
        btn.style.cssText = `
            width: 100%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            color: #fff;
            margin-bottom: 20px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        btn.onclick = () => {
            const tomorrowHw = sorted.filter(hw => hw.dueDate === tomorrowStr);
            let msg = "Yarına " + tomorrowCount + " adet ödevin var:\n\n";
            tomorrowHw.forEach(h => msg += "- " + h.subject + "\n");
            alert(msg);
        };
        mobileContainer.appendChild(btn);
    }

    if (urgent.length === 0) {
        mobileContainer.innerHTML = '<div style="color: #666; font-size: 14px; text-align: center; padding: 20px;">Yaklaşan ödev yok</div>';
        return;
    }

    urgent.forEach(hw => {
        const card = document.createElement('div');
        // Styles are handled by CSS class inheritance mostly, but we add structure
        // Content similar to regular card but more compact
        card.onclick = () => openHomeworkDetail(hw);

        // Calculate remaining days
        const diffTime = Math.abs(new Date(hw.dueDate) - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="font-weight: 700; color: #fff; font-size: 14px;">${hw.subject}</div>
                <div style="color: #ef4444; font-size: 10px; font-weight: 700;">${diffDays === 0 ? 'BUGÜN' : diffDays === 1 ? 'YARIN' : diffDays + ' GÜN KALDI'}</div>
            </div>
            <div style="color: #ccc; font-size: 12px; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${hw.description}</div>
            <div style="text-align: right; color: #888; font-size: 10px;">${hw.dueDate}</div>
         `;
        card.style.padding = '15px';

        mobileContainer.appendChild(card);
    });
}

function generateMobileCalendar() {
    const container = document.getElementById('mobileCalendarContainer');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    // Generate next 14 days
    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);

        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
        const dayNumber = date.getDate();

        // Check for homework
        const hasHomework = window.homeworkList.some(hw => hw.dueDate === dateStr);
        const isActive = i === 0; // Today is active by default in this view

        const dayEl = document.createElement('div');
        dayEl.className = `mobile-calendar-day ${isActive ? 'active' : ''}`;
        dayEl.onclick = () => {
            document.querySelectorAll('.mobile-calendar-day').forEach(d => d.classList.remove('active'));
            dayEl.classList.add('active');

            // Filter mobile homework list
            const hwOnDate = window.homeworkList.filter(hw => hw.dueDate === dateStr);
            renderFilteredMobileHomeworkList(hwOnDate, date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }));
        };

        dayEl.innerHTML = `
            <span>${dayName}</span>
            <strong>${dayNumber}</strong>
            ${hasHomework ? '<div class="has-homework-dot"></div>' : ''}
        `;

        container.appendChild(dayEl);
    }
}

function generateCalendar() {
    if (currentView === 'week') {
        generateWeekView();
        return;
    }
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const calendarMonthTitle = document.getElementById('calendarMonthTitle');
    if (calendarMonthTitle) calendarMonthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Skip previous month days - just add empty cells
    for (let i = 0; i < dayOfWeek; i++) {
        const cell = document.createElement('div');
        cell.style.cssText = 'min-height: 90px;';
        grid.appendChild(cell);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const cell = createCalendarCell(day, false);
        grid.appendChild(cell);
    }

    // Skip next month days - just add empty cells if needed
    const totalCells = grid.children.length;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
        const cell = document.createElement('div');
        cell.style.cssText = 'min-height: 90px;';
        grid.appendChild(cell);
    }
}

function generateWeekView() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    const diff = today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const monday = new Date(today.setDate(diff));

    const calendarMonthTitle = document.getElementById('calendarMonthTitle');
    if (calendarMonthTitle) calendarMonthTitle.textContent = 'HAFTALIK GÖRÜNÜM';

    for (let i = 0; i < 7; i++) {
        const cellDate = new Date(monday);
        cellDate.setDate(monday.getDate() + i);
        const cell = createCalendarCell(cellDate, false);
        grid.appendChild(cell);
    }
}

function createCalendarCell(dateOrDay, isOtherMonth) {
    const cell = document.createElement('div');
    const today = new Date();
    let cellDate;

    if (dateOrDay instanceof Date) {
        cellDate = dateOrDay;
    } else {
        cellDate = new Date(currentYear, currentMonth, dateOrDay);
    }

    const cellDateStr = cellDate.toISOString().split('T')[0];
    const isToday = cellDate.toDateString() === today.toDateString();

    cell.style.cssText = `
        padding: 10px;
        text-align: left;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s;
        color: ${isOtherMonth ? '#444' : '#fff'};
        background: ${isOtherMonth ? 'transparent' : 'rgba(255,255,255,0.04)'};
        font-size: 14px;
        font-weight: 600;
        position: relative;
        min-height: 90px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        border: 1px solid rgba(255, 255, 255, 0.08);
    `;

    const dayNumber = document.createElement('div');
    dayNumber.textContent = cellDate.getDate();
    dayNumber.style.cssText = 'margin-bottom: 8px; font-size: 16px; font-weight: 700; color: #aaa;';
    cell.appendChild(dayNumber);

    if (!isOtherMonth) {
        if (isToday) {
            cell.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)';
            cell.style.border = '2px solid rgba(102, 126, 234, 0.6)';
            dayNumber.style.color = '#fff';
        }

        const homeworkOnDate = window.homeworkList.filter(hw => hw.dueDate === cellDateStr);
        if (homeworkOnDate.length > 0) {
            const homeworkContainer = document.createElement('div');
            homeworkContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
                width: 100%;
                overflow: hidden;
            `;

            homeworkOnDate.slice(0, 3).forEach(hw => {
                const hwItem = document.createElement('div');
                hwItem.style.cssText = `
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
                    padding: 4px 6px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #fff;
                    border: 1px solid rgba(102, 126, 234, 0.4);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                `;

                hwItem.textContent = `${hw.subject}`;

                if (hw.lesson) {
                    const timeSpan = document.createElement('div');
                    timeSpan.style.cssText = 'font-size: 9px; color: #ef4444; margin-top: 2px; font-weight: 700;';
                    timeSpan.textContent = `${hw.lesson}. Ders`;
                    hwItem.appendChild(timeSpan);
                }

                hwItem.onclick = (e) => {
                    e.stopPropagation();
                    openHomeworkDetail(hw);
                };

                homeworkContainer.appendChild(hwItem);
            });

            if (homeworkOnDate.length > 3) {
                const moreText = document.createElement('div');
                moreText.style.cssText = 'font-size: 9px; color: #888; margin-top: 2px;';
                moreText.textContent = `+${homeworkOnDate.length - 3} daha`;
                homeworkContainer.appendChild(moreText);
            }

            cell.appendChild(homeworkContainer);
        }

        cell.onclick = () => {
            const homeworkOnDate = window.homeworkList.filter(hw => hw.dueDate === cellDateStr);
            if (homeworkOnDate.length > 0) {
                // Find all cards with same date and highlight them
                const cards = document.getElementById('homeworkCards').children;
                let firstFound = null;
                for (let card of cards) {
                    const cardDate = card.querySelector('div:last-child div span').textContent;
                    // Simple check if card date matches or subject matches. 
                    // Better: find by ID or data-attribute if we had one.
                    // For now, let's scroll to the first one that matches the date.
                    if (window.homeworkList.some(h => h.dueDate === cellDateStr && card.textContent.includes(h.subject))) {
                        card.style.borderColor = '#ef4444';
                        card.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
                        if (!firstFound) firstFound = card;
                        setTimeout(() => {
                            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                        }, 2000);
                    }
                }
                if (firstFound) {
                    firstFound.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        cell.onmouseover = () => {
            if (!isToday) {
                cell.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)';
                cell.style.transform = 'scale(1.02)';
                cell.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.1)';
            }
        };
        cell.onmouseout = () => {
            if (!isToday) {
                cell.style.background = 'rgba(255,255,255,0.04)';
                cell.style.transform = 'scale(1)';
                cell.style.boxShadow = 'none';
            }
        };
    }

    return cell;
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar();
}

function showTodayHomework() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayHomework = window.homeworkList.filter(hw => hw.dueDate === todayStr);

    const modal = document.getElementById('todayHomeworkModal');
    const list = document.getElementById('todayHomeworkList');
    const dateEl = document.getElementById('todayDate');

    if (!modal || !list || !dateEl) return;

    dateEl.textContent = today.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (todayHomework.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #888;">
                <div style="font-size: 18px; font-weight: 600;">Bugün ödev yok!</div>
            </div>
        `;
    } else {
        list.innerHTML = '';
        todayHomework.forEach((hw, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: linear-gradient(135deg, rgba(50, 50, 50, 0.6) 0%, rgba(40, 40, 40, 0.6) 100%);
                backdrop-filter: blur(10px);
                padding: 20px;
                border-radius: 16px;
                margin-bottom: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                animation: slideUp 0.4s ease ${index * 0.05}s backwards;
            `;

            card.onmouseover = () => {
                card.style.background = 'linear-gradient(135deg, rgba(60, 60, 60, 0.7) 0%, rgba(50, 50, 50, 0.7) 100%)';
                card.style.transform = 'translateX(4px)';
                card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            };
            card.onmouseout = () => {
                card.style.background = 'linear-gradient(135deg, rgba(50, 50, 50, 0.6) 0%, rgba(40, 40, 40, 0.6) 100%)';
                card.style.transform = 'translateX(0)';
                card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            };
            card.onclick = () => {
                closeTodayHomeworkModal();
                openHomeworkDetail(hw);
            };

            const subject = document.createElement('div');
            subject.textContent = hw.subject;
            subject.style.cssText = `
                font-size: 13px;
                font-weight: 700;
                color: #fff;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
                display: inline-block;
                padding: 6px 14px;
                border-radius: 8px;
                margin-bottom: 12px;
                letter-spacing: 0.5px;
                border: 1px solid rgba(102, 126, 234, 0.4);
            `;

            const desc = document.createElement('div');
            desc.textContent = hw.description;
            desc.style.cssText = `
                font-size: 15px;
                color: #ddd;
                margin-bottom: 12px;
                line-height: 1.5;
                font-weight: 500;
            `;

            const lesson = document.createElement('div');
            lesson.innerHTML = `<span style="color: #ef4444; font-weight: 700; font-size: 14px;">${hw.lesson}. Ders</span>`;

            card.appendChild(subject);
            card.appendChild(desc);
            card.appendChild(lesson);
            list.appendChild(card);
        });
    }

    modal.style.display = 'flex';
}

function closeTodayHomeworkModal() {
    const modal = document.getElementById('todayHomeworkModal');
    if (modal) modal.style.display = 'none';
}

function openHomeworkModal() {
    const modal = document.getElementById('homeworkModal');
    if (modal) {
        modal.style.display = 'flex';
        const givenDateInput = document.getElementById('hwGivenDate');
        if (givenDateInput) givenDateInput.valueAsDate = new Date();
    }
}

function switchHomeworkFormMode(mode) {
    currentHomeworkFormMode = mode;
    const detailedSection = document.getElementById('detailedFormSection');
    const quickSection = document.getElementById('quickFormSection');
    const glider = document.getElementById('modeGlider');
    const btns = document.querySelectorAll('.mode-toggle-btn');

    if (mode === 'detailed') {
        detailedSection.style.display = 'block';
        quickSection.style.display = 'none';
        glider.style.transform = 'translateX(0)';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        detailedSection.style.display = 'none';
        quickSection.style.display = 'block';
        glider.style.transform = 'translateX(100%)';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

function closeHomeworkModal() {
    const modal = document.getElementById('homeworkModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('homeworkForm');
    if (form) form.reset();
    switchHomeworkFormMode('detailed'); // Reset to detailed
}

function addHomework(e) {
    if (e) e.preventDefault();

    let homeworkData = {};

    if (currentHomeworkFormMode === 'detailed') {
        const sub = document.getElementById('hwSubject').value;
        const desc = document.getElementById('hwDescription').value;
        const given = document.getElementById('hwGivenDate').value;
        const due = document.getElementById('hwDueDate').value;
        const lesson = document.getElementById('hwLesson').value;

        if (!sub || !desc || !given || !due) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        homeworkData = {
            subject: sub,
            description: desc,
            givenDate: given,
            dueDate: due,
            lesson: lesson
        };
    } else {
        const sub = document.getElementById('hwSubjectQuick').value;
        const due = document.getElementById('hwDueDateQuick').value;
        const type = document.getElementById('hwTypeQuick').value;

        if (!sub || !due) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        homeworkData = {
            subject: sub,
            description: type, // Store type in description
            givenDate: new Date().toISOString().split('T')[0], // Today
            dueDate: due,
            lesson: "1" // Default to 1st lesson for quick entries
        };
    }

    console.log('➕ Adding homework via V2:', homeworkData);

    // Use V2 sync
    if (typeof HomeworkSyncV2 !== 'undefined') {
        HomeworkSyncV2.addHomework(homeworkData)
            .then(() => {
                console.log('✅ Homework added successfully');
                closeHomeworkModal();
                renderHomeworkCards();
                if (typeof renderMobileHomeworkList === 'function') {
                    renderMobileHomeworkList();
                }
            })
            .catch(err => {
                console.error('❌ Failed to add homework:', err);
                alert('Ödev eklenirken hata oluştu. Konsolu kontrol edin.');
            });
    } else {
        alert('Sync sistemi yüklenmedi!');
    }
}

function openHomeworkDetail(hw) {
    const modal = document.getElementById('homeworkDetailModal');
    if (!modal) return;

    document.getElementById('detailSubject').textContent = hw.subject;
    document.getElementById('detailDescription').textContent = hw.description;
    document.getElementById('detailGivenDate').textContent = hw.givenDate;
    document.getElementById('detailDueDate').textContent = hw.dueDate;
    document.getElementById('detailLesson').textContent = `${hw.lesson}. Ders`;
    modal.style.display = 'flex';

    const editBtn = document.getElementById('editHomeworkBtn');
    if (editBtn) {
        editBtn.onclick = () => {
            const password = prompt("Ödevi düzenlemek için şifreyi girin:");
            if (password === '829615') {
                openEditHomeworkModal(hw);
            } else if (password !== null) {
                alert("Hatalı şifre!");
            }
        };
    }

    const deleteBtn = document.getElementById('deleteHomeworkBtn');
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (!hw.id) {
                alert("Hata: Ödev ID'si bulunamadı!");
                return;
            }
            const password = prompt("Ödevi silmek için şifreyi girin:");
            if (password === '829615') {
                console.log('🗑️ Deleting homework via V2:', hw.subject);

                // Use V2 sync
                if (typeof HomeworkSyncV2 !== 'undefined') {
                    HomeworkSyncV2.deleteHomework(hw.id)
                        .then(() => {
                            console.log('✅ Homework deleted successfully');
                            closeHomeworkDetailModal();
                            renderHomeworkCards();
                            if (typeof renderMobileHomeworkList === 'function') {
                                renderMobileHomeworkList();
                            }
                        })
                        .catch(err => {
                            console.error('❌ Failed to delete homework:', err);
                            alert('Ödev silinirken hata oluştu. Konsolu kontrol edin.');
                        });
                } else {
                    alert('Sync sistemi yüklenmedi!');
                }
            } else if (password !== null) {
                alert("Hatalı şifre!");
            }
        };
    }
}

function closeHomeworkDetailModal() {
    const modal = document.getElementById('homeworkDetailModal');
    if (modal) modal.style.display = 'none';
}

function openEditHomeworkModal(hw) {
    closeHomeworkDetailModal();
    const modal = document.getElementById('editHomeworkModal');
    if (!modal) return;

    document.getElementById('editHwId').value = hw.id;
    document.getElementById('editHwSubject').value = hw.subject;
    document.getElementById('editHwDescription').value = hw.description;
    document.getElementById('editHwGivenDate').value = hw.givenDate;
    document.getElementById('editHwDueDate').value = hw.dueDate;
    document.getElementById('editHwLesson').value = hw.lesson;

    modal.style.display = 'flex';
}

function closeEditHomeworkModal() {
    const modal = document.getElementById('editHomeworkModal');
    if (modal) modal.style.display = 'none';
}

// Global function to be called from the form
window.closeEditHomeworkModal = closeEditHomeworkModal;

document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editHomeworkForm');
    if (editForm) {
        editForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('editHwId').value;
            const homeworkData = {
                subject: document.getElementById('editHwSubject').value,
                description: document.getElementById('editHwDescription').value,
                givenDate: document.getElementById('editHwGivenDate').value,
                dueDate: document.getElementById('editHwDueDate').value,
                lesson: document.getElementById('editHwLesson').value
            };

            if (typeof HomeworkSyncV2 !== 'undefined') {
                try {
                    await HomeworkSyncV2.updateHomework(id, homeworkData);
                    closeEditHomeworkModal();
                    renderHomeworkCards();
                } catch (err) {
                    alert('Hata: ' + err.message);
                }
            }
        };
    }
});

function setupViewToggles() {
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.onclick = () => {
            const view = btn.dataset.view;
            currentView = view;

            document.querySelectorAll('.view-toggle').forEach(b => {
                if (b.dataset.view === view) {
                    b.classList.add('active');
                    b.style.background = '#222';
                    b.style.color = '#fff';
                    b.style.border = 'none';
                } else {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = '#888';
                    b.style.border = '1px solid #333';
                }
            });

            generateCalendar();
        };
    });
}
function renderFilteredMobileHomeworkList(list, dateText) {
    const container = document.getElementById('mobileHomeworkList');
    if (!container) return;
    container.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
    header.innerHTML = `
        <span style="font-size: 14px; font-weight: 800; color: #aaa; text-transform: uppercase;">${dateText}</span>
        <button onclick="renderMobileHomeworkList()" style="font-size: 11px; font-weight: 800; color: #3498db; background: transparent; border: none; cursor: pointer;">HEPSİNİ GÖR</button>
    `;
    container.appendChild(header);

    if (list.length === 0) {
        const msg = document.createElement('div');
        msg.style.cssText = 'padding: 40px; text-align: center; color: #555; font-weight: 700; font-size: 14px;';
        msg.textContent = 'Bu tarihte ödev bulunamadı.';
        container.appendChild(msg);
        return;
    }

    list.forEach(hw => {
        const card = document.createElement('div');
        card.className = 'mobile-hw-card';
        card.onclick = () => openHomeworkDetail(hw);
        card.innerHTML = `
            <div class="hw-card-header">
                <div class="hw-subject-badge">${hw.subject}</div>
                <div class="hw-lesson-info">${hw.lesson}. DERS</div>
            </div>
            <div class="hw-content">
                <h3>${hw.description}</h3>
                <p><i data-lucide="calendar"></i> ${hw.dueDate}</p>
            </div>
        `;
        container.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}
