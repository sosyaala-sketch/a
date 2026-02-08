function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const timeEl = document.getElementById('currentTime');
    const dateEl = document.getElementById('currentDate');
    const mobileDateEl = document.getElementById('mobileDateDisplay');

    if (timeEl) timeEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
    if (mobileDateEl) mobileDateEl.textContent = dateStr.toUpperCase();
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Reset Mobile Nav Active States
    document.querySelectorAll('.mobile-nav-item').forEach(link => {
        link.classList.remove('active');
        link.style.color = '#666';
        const i = link.querySelector('i');
        if (i) i.style.color = '#666';
    });

    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });

    if (pageName === 'home') {
        const homePage = document.getElementById('homePage');
        const mobileNav = document.getElementById('mobile-nav-home');
        if (homePage) homePage.classList.add('active');
        if (mobileNav) {
            mobileNav.classList.add('active');
            mobileNav.style.color = '#fff';
            const i = mobileNav.querySelector('i');
            if (i) i.style.color = '#fff';
        }
    } else if (pageName === 'schedule') {
        const schedulePage = document.getElementById('schedulePage');
        const navSchedule = document.getElementById('nav-schedule');
        const mobileNav = document.getElementById('mobile-nav-schedule');
        if (schedulePage) schedulePage.classList.add('active');
        if (navSchedule) navSchedule.classList.add('active');
        if (mobileNav) {
            mobileNav.classList.add('active');
            mobileNav.style.color = '#fff';
            const i = mobileNav.querySelector('i');
            if (i) i.style.color = '#fff';
        }
        generateCalendar();
        renderHomeworkCards();
    } else if (pageName === 'homework') {
        const homeworkPage = document.getElementById('homeworkPage');
        const navHomework = document.getElementById('nav-homework');
        const mobileNav = document.getElementById('mobile-nav-homework');
        if (homeworkPage) homeworkPage.classList.add('active');
        if (navHomework) navHomework.classList.add('active');
        if (mobileNav) {
            mobileNav.classList.add('active');
            mobileNav.style.color = '#fff';
            const i = mobileNav.querySelector('i');
            if (i) i.style.color = '#fff';
        }
        generateCalendar();
        renderHomeworkCards();
        // Also render mobile homework list to update count
        if (typeof renderMobileHomeworkList === 'function') {
            renderMobileHomeworkList();
        }
    } else if (pageName === 'exams') {
        const examsPage = document.getElementById('examsPage');
        const navExams = document.getElementById('nav-exams');
        const mobileNav = document.getElementById('mobile-nav-exams');
        if (examsPage) examsPage.classList.add('active');
        if (navExams) navExams.classList.add('active');
        if (mobileNav) {
            mobileNav.classList.add('active');
            mobileNav.style.color = '#fff';
            const i = mobileNav.querySelector('i');
            if (i) i.style.color = '#fff';
        }
        if (typeof initExams === 'function') {
            initExams();
        }
    } else if (pageName === 'hub') {
        const hubPage = document.getElementById('hubPage');
        const mobileNav = document.getElementById('mobile-nav-hub');
        const navHub = document.getElementById('nav-hub');
        if (hubPage) hubPage.classList.add('active');
        if (navHub) navHub.classList.add('active');
        if (mobileNav) {
            mobileNav.classList.add('active');
            mobileNav.style.color = '#fff';
            const i = mobileNav.querySelector('i');
            if (i) i.style.color = '#fff';
        }
    } else if (pageName === 'ai') {
        const aiPage = document.getElementById('aiPage');
        const mobileNav = document.getElementById('mobile-nav-ai');
        const navAi = document.getElementById('nav-ai');
        if (aiPage) aiPage.classList.add('active');
        if (navAi) navAi.classList.add('active');
        if (mobileNav) {
            mobileNav.classList.add('active');
            mobileNav.style.color = '#fff';
            const i = mobileNav.querySelector('i');
            if (i) i.style.color = '#fff';
        }
    }
}

window.addEventListener('load', () => {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    setupViewToggles();

    // Setup day selection event listeners
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectDay(btn.dataset.day);
        });
    });

    // Mobile Day Selector Listeners
    document.querySelectorAll('.m-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedDay = btn.dataset.day;
            currentMobileTimelineDay = selectedDay;
            updateMobileTimeline(selectedDay);
        });
    });

    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    const today = new Date().getDay();
    const currentDayName = days[today === 0 || today === 6 ? 0 : today - 1];

    selectDay(currentDayName);

    // Initialize Mobile Dashboard independently
    if (typeof updateMobileHeroCard === 'function') {
        updateMobileHeroCard(); // Always shows today
    }
    if (typeof updateMobileTimeline === 'function') {
        currentMobileTimelineDay = getTomorrowDayName(); // Set default to tomorrow
        updateMobileTimeline(currentMobileTimelineDay);
    }
});

function openDefaultAiNotebook() {
    const url = "https://notebooklm.google.com/notebook/6b4e5654-c061-4a27-b94f-ccd089921225?authuser=4";
    const width = 500;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open(url, "9A_Assistant_AI", `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
}
