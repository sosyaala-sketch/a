let scheduleData = sampleSchedule;
let currentDay = '';
let currentLessonIndex = 0;
let realTimeCheckInterval;
let currentMobileTimelineDay = '';

function shortenLessonName(name) {
    if (!name) return "";
    const lowerName = name.toLowerCase();

    const abbreviations = {
        "türk dili ve edebiyatı": "T. Dili Ed.",
        "temel dini bilgiler": "T. Dini Bil.",
        "bilişim teknolojileri": "Bilişim Tek.",
        "peygamberimizin hayatı": "Peygambers Hay.",
        "din kültürü ve ahlak bilgisi": "Din Kültürü",
        "beden eğitimi ve spor": "Beden Eğt.",
        "görsel sanatlar": "Görsel San.",
        "sağlık bilgisi ve trafik kültürü": "Sağlık Bil."
    };

    for (const [key, value] of Object.entries(abbreviations)) {
        if (lowerName.includes(key)) return value;
    }

    return name;
}

function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function getCurrentLessonIndex(day) {
    if (!scheduleData[day]) return 0;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < scheduleData[day].length; i++) {
        const timeRange = scheduleData[day][i].time.split(' - ');
        const startTime = parseTimeToMinutes(timeRange[0]);
        const endTime = parseTimeToMinutes(timeRange[1]);

        if (currentMinutes >= startTime && currentMinutes < endTime) {
            return i;
        }

        if (currentMinutes < startTime) {
            return i;
        }
    }

    return scheduleData[day].length - 1;
}

function getLessonStatus(lesson) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const timeRange = lesson.time.split(' - ');
    const startTime = parseTimeToMinutes(timeRange[0]);
    const endTime = parseTimeToMinutes(timeRange[1]);

    if (currentMinutes >= startTime && currentMinutes < endTime) {
        const remaining = endTime - currentMinutes;
        return { status: 'active', text: `Devam ediyor (${remaining} dk kaldı)` };
    } else if (currentMinutes < startTime) {
        const until = startTime - currentMinutes;
        return { status: 'upcoming', text: `${until} dakika sonra` };
    }

    return { status: '', text: '' };
}

function updateCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    carousel.innerHTML = '';

    if (!scheduleData[currentDay] || scheduleData[currentDay].length === 0) {
        carousel.innerHTML = '<p>Bu gün için ders bulunmamaktadır.</p>';
        return;
    }

    const lessons = scheduleData[currentDay];
    const totalLessons = lessons.length;

    for (let i = -3; i <= 3; i++) {
        let index = (currentLessonIndex + i + totalLessons) % totalLessons;
        const lesson = lessons[index];
        const lessonStatus = getLessonStatus(lesson);

        const card = document.createElement('div');
        card.className = 'lesson-card';

        if (i === 0) card.classList.add('center');
        else if (i === 1) card.classList.add('right-1');
        else if (i === 2) card.classList.add('right-2');
        else if (i === 3) card.classList.add('right-3');
        else if (i === -1) card.classList.add('left-1');
        else if (i === -2) card.classList.add('left-2');
        else if (i === -3) card.classList.add('left-3');

        let statusHtml = '';
        if (i === 0 && lessonStatus.text) {
            statusHtml = `<div class="lesson-status ${lessonStatus.status}">${lessonStatus.text}</div>`;
        }

        card.innerHTML = `
            <div class="time-slot">${lesson.time}</div>
            <div class="lesson-name">${lesson.lesson}</div>
            <div class="lesson-location">${lesson.location}</div>
            ${statusHtml}
        `;

        carousel.appendChild(card);
    }
}

function renderMobileTimeline() {
    const timelineContainer = document.getElementById('schedulePageTimeline');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = '';

    const lessons = scheduleData[currentDay];
    if (!lessons) return;

    const totalLessons = lessons.length;

    lessons.forEach((lesson, index) => {
        const isActive = index === currentLessonIndex;
        const isUpcoming = index === (currentLessonIndex + 1) % totalLessons;

        const item = document.createElement('div');
        item.className = `timeline-item ${isActive ? 'active' : ''} ${isUpcoming ? 'upcoming' : ''}`;

        item.innerHTML = `
            <div class="timeline-time">${lesson.time}</div>
            <div class="timeline-line"></div>
            <div class="timeline-content">
                <div class="timeline-subject">${lesson.lesson}</div>
                <div class="timeline-location">
                    <span>📍</span> ${lesson.location}
                </div>
            </div>
        `;

        timelineContainer.appendChild(item);

        if (isActive) {
            setTimeout(() => {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });
}

function checkAndUpdateLesson() {
    const today = getTodayDayName();
    const newIndex = getCurrentLessonIndex(today);

    if (newIndex !== currentLessonIndex) {
        currentLessonIndex = newIndex;
    }

    // Always update mobile dashboard components if on home page
    if (document.getElementById('homePage').classList.contains('active')) {
        updateMobileHeroCard();
        updateMobileTimeline(currentMobileTimelineDay || getTomorrowDayName());
    }

    // Refresh UI based on current view
    if (document.getElementById('mobileScheduleContainer').style.display !== 'none') {
        if (currentMobileView === 'week') renderMobileWeekView();
        else setMobileScheduleView(currentMobileView);
    } else {
        updateCarousel();
    }
}

let currentMobileView = 'today';

function setMobileScheduleView(view) {
    currentMobileView = view;

    // Update active tab UI
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `mobile-tab-${view}`);
    });

    if (view === 'week') {
        renderMobileWeekView();
    } else {
        const targetDay = view === 'today' ? getTodayDayName() : getTomorrowDayName();
        renderMobileTimeline(targetDay);
    }
}

function getTodayDayName() {
    const TurkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return TurkishDays[new Date().getDay()];
}

function getTomorrowDayName() {
    const TurkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const tomorrowIndex = (new Date().getDay() + 1) % 7;
    return TurkishDays[tomorrowIndex === 0 || tomorrowIndex === 6 ? 1 : tomorrowIndex];
}

function renderMobileTimeline(dayName) {
    const day = dayName || currentDay;
    const timelineContainer = document.getElementById('schedulePageTimeline');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = '';
    const lessons = scheduleData[day];
    if (!lessons) return;

    lessons.forEach((lesson, index) => {
        const isCurrentDay = day === getTodayDayName();
        const isActive = isCurrentDay && index === currentLessonIndex;

        const item = document.createElement('div');
        item.className = `timeline-item ${isActive ? 'active' : ''}`;

        item.innerHTML = `
            <div class="timeline-time">
                ${lesson.time.split(' - ')[0]}<br>
                <span style="opacity: 0.5; font-size: 10px;">${lesson.time.split(' - ')[1]}</span>
            </div>
            <div class="timeline-content">
                <div class="timeline-subject">${lesson.lesson}</div>
                <div class="timeline-location">${lesson.location}</div>
            </div>
        `;
        timelineContainer.appendChild(item);
    });
}

function renderMobileWeekView() {
    const timelineContainer = document.getElementById('schedulePageTimeline');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = '';
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'mobile-week-day-header';
        header.textContent = day;
        timelineContainer.appendChild(header);

        const lessons = scheduleData[day];
        if (lessons) {
            lessons.forEach(lesson => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `
                    <div class="timeline-time">${lesson.time.split(' - ')[0]}</div>
                    <div class="timeline-content">
                        <div class="timeline-subject">${shortenLessonName(lesson.lesson)}</div>
                        <div class="timeline-location">${lesson.location}</div>
                    </div>
                `;
                timelineContainer.appendChild(item);
            });
        }
    });
}

function selectDay(day) {
    currentDay = day;
    currentLessonIndex = getCurrentLessonIndex(day);

    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.day === day);
    });

    if (document.getElementById('mobileScheduleContainer').style.display !== 'none') {
        // If on mobile, respect the tabs, but default to today if just switching days
        if (currentMobileView === 'week') renderMobileWeekView();
        else renderMobileTimeline(day);
    } else {
        updateCarousel();
    }

    startRealTimeCheck();
}

function startRealTimeCheck() {
    clearInterval(realTimeCheckInterval);
    realTimeCheckInterval = setInterval(() => {
        checkAndUpdateLesson();
    }, 10000);
}

function showTomorrowSchedule() {
    try {
        const tomorrowName = getTomorrowDayName();
        const tomorrowLessons = scheduleData[tomorrowName];
        const modal = document.getElementById('tomorrowScheduleModal');
        const list = document.getElementById('tomorrowScheduleList');
        const header = document.getElementById('tomorrowDayHeader');

        if (!modal || !list || !header) {
            console.error('Tomorrow modal elements not found');
            return;
        }

        header.textContent = tomorrowName;
        list.innerHTML = '';

        if (!tomorrowLessons || tomorrowLessons.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.4); padding: 40px; font-weight: 700;">
                    Yarın için ders programı bulunamadı.
                </div>
            `;
        } else {
            tomorrowLessons.forEach((lesson, index) => {
                const card = document.createElement('div');
                card.style.cssText = `
                    background: rgba(255, 255, 255, 0.03);
                    padding: 22px 28px;
                    border-radius: 25px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    backdrop-filter: blur(10px);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s backwards;
                `;

                card.onmouseover = () => {
                    card.style.background = 'rgba(255, 255, 255, 0.07)';
                    card.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    card.style.transform = 'translateY(-4px)';
                };
                card.onmouseleave = () => {
                    card.style.background = 'rgba(255, 255, 255, 0.03)';
                    card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    card.style.transform = 'translateY(0)';
                };

                card.innerHTML = `
                    <div style="flex: 1;">
                        <div style="color: rgba(255,255,255,0.4); font-weight: 800; font-size: 10px; margin-bottom: 4px; letter-spacing: 1px;">${lesson.time}</div>
                        <div style="color: #fff; font-weight: 700; font-size: 18px; letter-spacing: -0.5px;">${lesson.lesson}</div>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        modal.style.display = 'flex';
        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (e) {
        console.error('showTomorrowSchedule Error:', e);
    }
}

function closeTomorrowScheduleModal() {
    const modal = document.getElementById('tomorrowScheduleModal');
    if (modal) modal.style.display = 'none';
}
function updateMobileHeroCard() {
    const heroTime = document.getElementById('mobileHeroTime');
    const heroEndTime = document.getElementById('mobileHeroEndTime');
    const heroSubject = document.getElementById('mobileHeroSubject');
    const heroLocation = document.getElementById('mobileHeroLocation');
    const heroLocationContainer = document.querySelector('.hero-location');
    const hwStatus = document.getElementById('mobileHeroHwStatus');
    const progressFill = document.getElementById('heroProgressFill');
    const nowBadge = document.querySelector('.now-badge');

    const TurkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    let heroLesson = null;
    let isActive = false;
    let dayOffset = 0;
    let targetStartM = 0;

    // Search for the next available lesson (unending loop until lesson found)
    while (dayOffset < 8) {
        const checkDayIndex = (now.getDay() + dayOffset) % 7;
        const checkDayName = TurkishDays[checkDayIndex];
        const dayLessons = scheduleData[checkDayName];

        if (dayLessons && dayLessons.length > 0) {
            for (let i = 0; i < dayLessons.length; i++) {
                const l = dayLessons[i];
                const [start, end] = l.time.split(' - ');
                const startM = parseTimeToMinutes(start);
                const endM = parseTimeToMinutes(end);

                if (dayOffset === 0) {
                    if (currentMinutes >= startM && currentMinutes < endM) {
                        heroLesson = l;
                        isActive = true;
                        break;
                    } else if (currentMinutes < startM) {
                        heroLesson = l;
                        targetStartM = startM;
                        break;
                    }
                } else {
                    heroLesson = l;
                    targetStartM = startM + (dayOffset * 1440);
                    break;
                }
            }
        }
        if (heroLesson) break;
        dayOffset++;
    }

    if (!heroLesson) {
        if (heroSubject) heroSubject.textContent = "DERS PROGRAMI BOŞ";
        return;
    }

    const [start, end] = heroLesson.time.split(' - ');
    const startM = parseTimeToMinutes(start);
    const endM = parseTimeToMinutes(end);

    if (isActive) {
        if (heroSubject) heroSubject.textContent = shortenLessonName(heroLesson.lesson);
        if (nowBadge) nowBadge.textContent = "ŞU AN";
        if (heroTime) heroTime.textContent = start;
        if (heroEndTime) heroEndTime.textContent = `${end} biter`;
        if (heroLocationContainer) heroLocationContainer.style.display = 'none';
        if (hwStatus) hwStatus.style.display = 'flex';

        const total = endM - startM;
        const elapsed = currentMinutes - startM;
        const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
        if (progressFill) progressFill.style.width = `${percent}%`;
    } else {
        if (heroSubject) heroSubject.textContent = shortenLessonName(heroLesson.lesson).toUpperCase();
        if (nowBadge) nowBadge.textContent = "SIRADAKİ";

        // Accurate countdown including multi-day offsets
        const totalDiffM = targetStartM - currentMinutes;
        const h = Math.floor(totalDiffM / 60);
        const m = totalDiffM % 60;

        let countdownStr = "";
        if (h > 0) {
            countdownStr = `${h} sa ${m} dk`;
        } else {
            countdownStr = `${m} dk kaldı`;
        }

        if (heroTime) heroTime.textContent = countdownStr;
        if (heroEndTime) heroEndTime.textContent = "başlamasına";
        if (heroLocationContainer) heroLocationContainer.style.display = 'none';
        if (hwStatus) hwStatus.style.display = 'none';
        if (progressFill) progressFill.style.width = "0%";
    }

    // Check for homework
    if (hwStatus && hwStatus.style.display !== 'none') {
        const hasHw = window.homeworkList && window.homeworkList.some(hw =>
            hw.subject && heroLesson.lesson && hw.subject.toLowerCase().includes(heroLesson.lesson.toLowerCase())
        );
        hwStatus.innerHTML = hasHw ? '🔥 ÖDEV VAR' : '✨ Ödev Yok';
        hwStatus.style.background = hasHw ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)';
        hwStatus.style.color = hasHw ? '#e74c3c' : '#2ecc71';
    }
}

function updateMobileTimeline(day) {
    const timeline = document.getElementById('mobileHomeTimeline');
    if (!timeline) return;

    // Update Modern Day Selector active state
    document.querySelectorAll('.day-circle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.day === day);
    });

    const lessons = scheduleData[day];
    if (!lessons) {
        timeline.innerHTML = '<p style="text-align:center; padding: 20px; color: #b5a48e; grid-column: span 2;">Ders bulunamadı.</p>';
        return;
    }

    const isToday = day === getTodayDayName();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    timeline.innerHTML = '';
    lessons.forEach((l, index) => {
        const [start, end] = l.time.split(' - ');
        const startM = parseTimeToMinutes(start);
        const endM = parseTimeToMinutes(end);

        const isActive = isToday && (currentMinutes >= startM && currentMinutes < endM);

        // Define icons based on lesson
        let icon = 'book-open';
        const lessonLower = l.lesson.toLowerCase();
        if (lessonLower.includes('mat')) icon = 'calculator';
        if (lessonLower.includes('edebiyat')) icon = 'book-text';
        if (lessonLower.includes('dil') || lessonLower.includes('almanca') || lessonLower.includes('ing')) icon = 'languages';
        if (lessonLower.includes('tarih')) icon = 'landmark';
        if (lessonLower.includes('coğrafya')) icon = 'map';
        if (lessonLower.includes('fizik')) icon = 'atom';
        if (lessonLower.includes('kimya')) icon = 'flask-conical';
        if (lessonLower.includes('biyo') || lessonLower.includes('fen')) icon = 'dna';
        if (lessonLower.includes('spor') || lessonLower.includes('beden')) icon = 'dumbbell';
        if (lessonLower.includes('müzik')) icon = 'music';
        if (lessonLower.includes('görsel') || lessonLower.includes('resim')) icon = 'palette';
        if (lessonLower.includes('din')) icon = 'scroll';
        if (lessonLower.includes('bilişim')) icon = 'cpu';
        if (lessonLower.includes('sağlık')) icon = 'heart-pulse';
        if (lessonLower.includes('sosyal') || lessonLower.includes('aile')) icon = 'users';
        if (lessonLower.includes('rehber')) icon = 'user-check';

        const card = document.createElement('div');
        card.className = `modern-timeline-card ${isActive ? 'active' : ''}`;
        if (isActive) {
            card.style.background = '#fff';
            card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        }

        card.innerHTML = `
            <div class="m-card-lesson-num" style="${isActive ? 'background: #d1a684; color: #fff;' : ''}">
                ${index + 1}
            </div>
            <div>
                <h4>${shortenLessonName(l.lesson)}</h4>
                <p class="m-card-time">${start} — ${end}</p>
            </div>
            <div class="m-card-location" style="margin-top: 10px;">
                ${l.location}
            </div>
         `;
        timeline.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}
