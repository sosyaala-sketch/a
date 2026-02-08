/**
 * Exams Module - Total Hub Replication Logic
 * Optimized for Tailwind-integrated layout.
 * REPLACED exams.js due to file corruption/locking issues.
 * FINAL CLEAN VERSION
 */

let activeExamFilter = 'aktif';
let examSearchQuery = '';
let isExamAdminMode = false; // Improved admin state
window.examNotesCache = {};

function initExams() {
    console.log('🚀 [Exams] Hub Replication Sync...');

    const filterButtons = document.querySelectorAll('.hub-filter-btn');
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            activeExamFilter = btn.dataset.filter;
            filterButtons.forEach(b => b.classList.toggle('active', b === btn));
            renderExams();
        };
    });

    const searchInput = document.getElementById('examSearchInput');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const val = e.target.value.toLowerCase();
            if (val === 'yönetiici' || val === 'yönetici') {
                setTimeout(() => {
                    const pass = prompt("Yönetici Şifresi:");
                    if (pass === "829615") {
                        isExamAdminMode = true;
                        const si = document.getElementById('examSearchInput');
                        if (si) si.value = '';
                        examSearchQuery = '';
                        alert("Yönetici Modu Aktif! Sınavları düzenleyebilir, silebilir ve yeni sınav ekleyebilirsiniz.");
                        const addBtn = document.getElementById('adminAddExamBtn');
                        if (addBtn) addBtn.style.display = 'flex';
                        renderExams();
                    } else {
                        if (pass !== null) alert("Hatalı Şifre!");
                        const si = document.getElementById('examSearchInput');
                        if (si) si.value = '';
                        examSearchQuery = '';
                        renderExams();
                    }
                }, 100);
                return;
            }
            examSearchQuery = val;
            renderExams();
        };
    }

    if (window.ExamsSync) {
        window.ExamsSync.fetchAll().then(() => {
            renderExams();
        });
    }
}

function renderExams() {
    const container = document.getElementById('examsGrid');
    if (!container) return;

    if (!window.exams || window.exams.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 text-center text-white/20 font-black uppercase tracking-widest">
                Planlanmış Sınav Bulunmuyor
            </div>
        `;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = window.exams.filter(exam => {
        const examDate = new Date(exam.date);
        return activeExamFilter === 'aktif' ? examDate >= today : examDate < today;
    });

    if (examSearchQuery) {
        filtered = filtered.filter(exam =>
            (exam.subject || '').toLowerCase().includes(examSearchQuery) ||
            (exam.topics && (Array.isArray(exam.topics) ? exam.topics.join(' ').toLowerCase() : exam.topics.toLowerCase()).includes(examSearchQuery))
        );
    }

    filtered.sort((a, b) => {
        const d1 = new Date(a.date);
        const d2 = new Date(b.date);
        return activeExamFilter === 'aktif' ? d1 - d2 : d2 - d1;
    });

    const groups = {};
    filtered.forEach(e => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });

    const sortedDates = Object.keys(groups).sort((a, b) => activeExamFilter === 'aktif' ? new Date(a) - new Date(b) : new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center text-white/20 font-black uppercase tracking-widest">Eşleşen Sınav Yok</div>`;
        return;
    }

    let html = '';
    sortedDates.forEach(date => {
        html += `
            <div class="exam-day-group">
                <div class="hub-section-header">
                    <i data-lucide="calendar" style="color: #ff6b2b; width: 18px; height: 18px;"></i>
                    <h2 class="hub-section-title">${formatExamDate(date)}</h2>
                </div>
                <div class="exam-day-row">
                    ${groups[date].map(exam => renderHubExamCard(exam)).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderHubExamCard(exam) {
    const subject = exam.subject || 'BELİRTİLMEMİŞ DERS';
    const lesson = exam.lessonNumber ? (String(exam.lessonNumber).toLowerCase().includes('ders') ? exam.lessonNumber : `${exam.lessonNumber}. Ders`) : '-';
    const pages = exam.pages || '-';
    const scenario = exam.scenarioNo || '-';
    const notesCount = (window.examNotesCounts && window.examNotesCounts[exam.id]) || 0;

    return `
        <div class="animate-fade exam-card-new" style="cursor: pointer;">
            <div class="exam-card-header" onclick="window.openExamModal('${exam.id}')">
                <div class="exam-note-stats ${notesCount === 0 ? 'empty' : ''}">
                    <i data-lucide="files"></i>
                    <span>${notesCount} NOT</span>
                </div>
                <span class="exam-lesson-badge">${lesson}</span>
            </div>
            
            <h3 class="exam-subject-title" onclick="window.openExamModal('${exam.id}')">${subject}</h3>

            <div class="exam-details-grid" onclick="window.openExamModal('${exam.id}')">
                <div class="detail-item">
                    <span class="detail-label">SAYFALAR</span>
                    <span class="detail-value">${pages}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">SENARYO</span>
                    <span class="detail-value">${scenario}</span>
                </div>
            </div>

            <div class="separator-line"></div>

            <div class="exam-card-footer">
                <button class="btn-detail-view" onclick="window.openExamModal('${exam.id}')">
                    DETAYLAR <i data-lucide="arrow-right"></i>
                </button>
                
                <div class="footer-admin-actions">
                    ${isExamAdminMode ? `
                        <button class="btn-admin-icon edit" onclick="window.openEditExamModal('${exam.id}')" title="Düzenle">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="btn-admin-icon delete" onclick="window.handleDeleteExam('${exam.id}')" title="Sil">
                            <i data-lucide="trash-2"></i>
                        </button>
                    ` : ''}
                    <button class="btn-add-note" title="Notları Gör" onclick="window.openExamNotesModal('${exam.id}', '${subject.replace(/'/g, "\\\'")}')">
                        <i data-lucide="files"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function formatExamDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) return "Bugün";
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === tomorrow.getTime()) return "Yarın";
    return date.toLocaleDateString('tr-TR', options).toUpperCase();
}

function openExamModal(id) {
    try {
        const exam = window.exams.find(e => e.id == id);
        const targetExam = exam || window.exams.find(e => String(e.id) === String(id));
        const modal = document.getElementById('examDetailsModal');
        if (!modal) return;

        document.getElementById('modalExamSubject').innerText = targetExam.subject || 'DERS ADI YOK';
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isPast = new Date(targetExam.date) < today;
        const dot = document.getElementById('modalExamDotStatus');
        const statusText = document.getElementById('modalExamStatusText');

        if (dot) dot.className = `w-1.5 h-1.5 rounded-full ${isPast ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`;
        if (statusText) statusText.innerText = isPast ? 'TAMAMLANDI' : 'SIRADA';

        document.getElementById('modalExamDate').innerText = formatExamDate(targetExam.date);
        document.getElementById('modalExamLesson').innerText = targetExam.lessonNumber ? `${targetExam.lessonNumber}. DERS SAATİ` : '-';
        const topics = targetExam.topics || 'Detaylar henüz eklenmedi.';
        document.getElementById('modalExamTopics').innerText = Array.isArray(topics) ? topics.join(', ') : topics;
        document.getElementById('modalExamPages').innerText = targetExam.pages || 'Belirtilmedi';
        document.getElementById('modalExamScenario').innerText = targetExam.scenarioNo || 'Senaryo Yok';

        const mebLinkBtn = document.getElementById('modalMebLink');
        const scenarioLinkBtn = document.getElementById('modalScenarioLink');
        if (mebLinkBtn) targetExam.mebSampleLink ? (mebLinkBtn.href = targetExam.mebSampleLink, mebLinkBtn.classList.remove('hidden')) : mebLinkBtn.classList.add('hidden');
        if (scenarioLinkBtn) targetExam.scenarioLink ? (scenarioLinkBtn.href = targetExam.scenarioLink, scenarioLinkBtn.classList.remove('hidden')) : scenarioLinkBtn.classList.add('hidden');

        const noteContainer = document.getElementById('modalTeacherNoteContainer');
        const noteEl = document.getElementById('modalTeacherNote');
        if (targetExam.teacherNotes) { noteContainer.classList.remove('hidden'); noteEl.innerText = targetExam.teacherNotes; } else { noteContainer.classList.add('hidden'); }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) { console.error(err); }
}

function closeExamModal() {
    const modal = document.getElementById('examDetailsModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Exam Notes Modal Logic
async function openExamNotesModal(examId, subject) {
    const modal = document.getElementById('examNotesListModal');
    const container = document.getElementById('examNotesContainer');
    const subjectEl = document.getElementById('notesModalSubjectName');
    const addBtn = document.getElementById('addNoteBtnInModal');
    const searchInput = document.getElementById('noteSearchInput');

    if (!modal || !container) return;
    if (subjectEl) subjectEl.innerText = subject;

    // Set identifying value for children functions
    const examIdInput = document.getElementById('uploadNoteExamId');
    if (examIdInput) examIdInput.value = examId;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    addBtn.onclick = () => window.openNoteUploadModal(examId);

    // Caching logic: Fetch once per page load
    let notes;
    if (window.examNotesCache[examId]) {
        console.log(`📦 [Exams] Using cached notes for exam: ${examId}`);
        notes = window.examNotesCache[examId];
    } else {
        container.innerHTML = `<div class="col-span-full py-20 text-center text-white/40 font-black uppercase tracking-[0.3em] animate-pulse">Materyaller Getiriliyor...</div>`;
        notes = await window.ExamNotesSync.fetchNotesByExam(examId);
        window.examNotesCache[examId] = notes;
    }

    renderNotesListInternal(notes, container);

    if (searchInput) {
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            if (query === 'yönetici') {
                const pass = prompt("Yönetici Şifresi:");
                if (pass === "829615") {
                    isNoteAdminMode = true;
                    e.target.value = '';
                    alert("Yönetici Modu Aktif! Düzenleme ve Silme seçenekleri açıldı.");
                    renderNotesListInternal(notes, container);
                } else {
                    alert("Hatalı Şifre!");
                    e.target.value = '';
                }
                return;
            }
            const filtered = notes.filter(n => (n.title || '').toLowerCase().includes(query) || (n.uploader || '').toLowerCase().includes(query));
            renderNotesListInternal(filtered, container);
        };
    }
}

function renderNotesListInternal(list, container) {
    if (list.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center text-white/40 font-black uppercase tracking-[0.3em]">Sonuç Bulunamadı</div>`;
        return;
    }

    // Group by Uploader for "Folders"
    const grouped = {};
    list.forEach(note => {
        const key = note.uploader || 'MİSAFİR';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(note);
    });

    container.innerHTML = Object.values(grouped).map(group => {
        const uploader = group[0].uploader || 'MİSAFİR';
        // USER REQUEST: Always treat uploader groups as folders, even if 1 file
        const isFolder = true;
        const mainNote = group[0];
        const title = `${uploader}'ın Notları`;
        const fileCount = group.length;

        let icon = 'folder';
        let iconColor = '#eab308';

        const escapedUploader = uploader.replace(/`/g, "\\`").replace(/'/g, "\\'");

        return `
            <div class="hub-note-card-premium animate-fade hub-border-yellow-500/30">
                <div class="hub-flex hub-items-center hub-gap-5">
                    <div class="hub-note-icon-box" style="color: ${iconColor}; border-color: ${iconColor}20;">
                        <i data-lucide="${icon}" class="hub-w-8 hub-h-8"></i>
                    </div>
                    <div class="hub-flex-1">
                        <h4 class="hub-note-title" style="white-space: normal; overflow: visible; line-height: 1.2; font-size: 1.15rem;">
                            ${title}
                        </h4>
                        <div class="hub-note-meta" style="margin-top: 0.5rem;">
                            <span class="hub-note-badge page-count" style="background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6);">${fileCount} DOSYA</span>
                            <span class="hub-note-badge type" style="background: rgba(16,185,129,0.1); color: #10b981;">KLASÖR</span>
                        </div>
                    </div>
                </div>
                
                <div class="hub-note-actions">
                    <button onclick="window.viewFolderDetails(\`${escapedUploader}\`)" class="hub-action-btn view">
                        <i data-lucide="folder-open" style="width: 14px; height: 14px;"></i> KLASÖRÜ AÇ
                    </button>
                    
                    ${isNoteAdminMode ? `
                        <button onclick="window.handleDeleteFolder('${escapedUploader}')" class="hub-action-btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> KLASÖRÜ SİL
                        </button>
                    ` : ''}
                </div>

                <div class="hub-mt-4 hub-pt-4 hub-border-t hub-border-white-5 hub-flex hub-items-center hub-justify-between">
                    <div class="hub-flex hub-items-center hub-gap-3">
                        <div class="hub-w-7 hub-h-7 hub-rounded-full hub-bg-white/5 hub-border hub-border-white-10 hub-flex hub-items-center hub-justify-center hub-text-[8px] hub-font-black hub-text-white-40">
                            ${uploader.substring(0, 2).toUpperCase()}
                        </div>
                        <span class="hub-text-[9px] hub-font-black hub-text-white-20">${uploader}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeExamNotesModal() {
    const modal = document.getElementById('examNotesListModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

window.viewFolderDetails = function (uploader) {
    const examId = document.getElementById('uploadNoteExamId').value;
    const subject = document.getElementById('notesModalSubjectName').innerText;
    const container = document.getElementById('examNotesContainer');

    // Use cache
    const notes = window.examNotesCache[examId] || [];
    const folderNotes = notes.filter(n => (n.uploader || 'MİSAFİR') === uploader);

    // Check if folder is protected (anyone note has a password)
    const isProtected = folderNotes.some(n => n.is_public === false);
    const folderPass = folderNotes.find(n => n.folder_password)?.folder_password;

    const escapedSubject = subject.replace(/'/g, "\\'");
    const backAction = `window.openExamNotesModal('${examId}', '${escapedSubject}')`;

    window.handleFolderAddRequest = function () {
        if (isNoteAdminMode) return window.openNoteUploadModalWithUploader(examId, uploader, true);

        if (isProtected && folderPass) {
            const pass = prompt("Bu klasör kilitlenmiş. Not eklemek için klasör şifresini girin:");
            if (pass !== folderPass) return alert("Hatalı klasör şifresi!");
        }
        window.openNoteUploadModalWithUploader(examId, uploader, isProtected, folderPass || '');
    };

    container.innerHTML = `
        <div class="col-span-full mb-6 hub-flex hub-justify-between hub-items-center hub-gap-4">
            <button onclick="${backAction}" class="hub-btn-sub" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> GERİ DÖN
            </button>
            <button onclick="window.handleFolderAddRequest()" class="hub-btn-primary" style="padding: 10px 20px; font-size: 10px; border-radius: 12px; position: relative;">
                ${isProtected ? '<i data-lucide="lock" style="width: 10px; height: 10px; position: absolute; top: -5px; right: -5px; color: #fbbf24;"></i>' : ''}
                <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i> BU KLASÖRE NOT EKLE
            </button>
        </div>
        ${folderNotes.map(note => renderSingleNoteCard(note)).join('')}
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

function renderSingleNoteCard(note) {
    const title = note.title || 'İSİMSİZ NOT';
    const extension = title.split('.').pop().toLowerCase();
    let icon = 'file-text';
    if (['jpg', 'jpeg', 'png', 'svg'].includes(extension)) icon = 'image';
    else if (extension === 'pdf') icon = 'file-type-2';

    return `
        <div class="hub-note-card-premium animate-fade">
            <div class="hub-flex hub-items-center hub-gap-5">
                <div class="hub-note-icon-box"><i data-lucide="${icon}"></i></div>
                <div class="hub-flex-1">
                    <h4 class="hub-note-title" style="white-space: normal; overflow: visible; line-height: 1.2; font-size: 1.1rem;">
                        ${title}
                    </h4>
                    <div class="hub-note-meta" style="margin-top: 0.5rem;">
                        ${note.page_count > 0 ? `<span class="hub-note-badge page-count" style="background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6);">${note.page_count} SAYFA</span>` : ''}
                        <span class="hub-note-badge type" style="background: rgba(59,130,246,0.1); color: #3b82f6;">MATERYAL</span>
                    </div>
                </div>
            </div>
            <div class="hub-note-actions">
                <a href="${note.file_url}" target="_blank" class="hub-action-btn view">
                    <i data-lucide="eye" style="width: 14px; height: 14px;"></i> GÖRÜNTÜLE
                </a>
                
                ${isNoteAdminMode ? `
                    <button onclick="window.handleEditNote('${note.id}')" class="hub-action-btn download">
                        <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> DÜZENLE
                    </button>
                    <button onclick="window.handleDeleteNote('${note.id}')" class="hub-action-btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> SİL
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

window.openNoteUploadModalWithUploader = function (examId, uploader, isProtected = false, password = '') {
    window.openNoteUploadModal(examId);
    const uploaderInput = document.getElementById('noteUploaderName');
    const isPublicCheck = document.getElementById('noteIsPublic');
    const passInput = document.getElementById('folderPassword');
    const passContainer = document.getElementById('folderPassContainer');

    if (uploaderInput) {
        uploaderInput.value = uploader;
        uploaderInput.readOnly = true;
        uploaderInput.style.opacity = '0.5';
    }

    if (isProtected) {
        if (isPublicCheck) {
            isPublicCheck.checked = false;
            isPublicCheck.disabled = true; // Lock the setting inside folder
        }
        if (passInput) {
            passInput.value = password;
            passInput.readOnly = true;
        }
        if (passContainer) passContainer.style.display = 'block';
    }
}

window.handleEditNote = async function (noteId) {
    const newTitle = prompt("Yeni başlık girin:");
    if (!newTitle) return;
    try {
        await window.ExamNotesSync.updateNote(noteId, { title: newTitle });
        alert("Güncellendi!");
        const examId = document.getElementById('uploadNoteExamId').value;
        const subject = document.getElementById('notesModalSubjectName').innerText;
        delete window.examNotesCache[examId]; // Invalidate cache
        window.openExamNotesModal(examId, subject);
    } catch (err) { alert(err.message); }
};

window.handleDeleteNote = async function (noteId) {
    if (!confirm("Bu notu silmek istediğinize emin misiniz?")) return;
    try {
        await window.ExamNotesSync.deleteNote(noteId);
        alert("Başarıyla silindi!");
        const examId = document.getElementById('uploadNoteExamId').value;
        const subject = document.getElementById('notesModalSubjectName').innerText;
        delete window.examNotesCache[examId]; // Invalidate cache
        window.openExamNotesModal(examId, subject);
    } catch (err) { alert("Silme hatası: " + err.message); }
};

window.handleDeleteFolder = async function (uploader) {
    if (!confirm(`${uploader}'ın tüm notlarını silmek istediğinize emin misiniz?`)) return;
    try {
        const examId = document.getElementById('uploadNoteExamId').value;
        const notes = await window.ExamNotesSync.fetchNotesByExam(examId);
        const folderNotes = notes.filter(n => (n.uploader || 'MİSAFİR') === uploader);

        for (const n of folderNotes) {
            await window.ExamNotesSync.deleteNote(n.id);
        }

        alert("Klasör başarıyla silindi!");
        delete window.examNotesCache[examId];
        window.openExamNotesModal(examId, document.getElementById('notesModalSubjectName').innerText);
    } catch (err) { alert("Silme hatası: " + err.message); }
};

function openNoteUploadModal(examId) {
    const modal = document.getElementById('examNoteUploadModal');
    const examIdInput = document.getElementById('uploadNoteExamId');
    const uploaderInput = document.getElementById('noteUploaderName');
    const passContainer = document.getElementById('folderPassContainer');
    const passInput = document.getElementById('folderPassword');
    const isPublicCheck = document.getElementById('noteIsPublic');

    if (uploaderInput) { uploaderInput.readOnly = false; uploaderInput.style.opacity = '1'; }

    // Reset protection fields
    if (passContainer) passContainer.style.display = 'none';
    if (passInput) { passInput.value = ''; passInput.readOnly = false; }
    if (isPublicCheck) { isPublicCheck.checked = true; isPublicCheck.disabled = false; }

    if (modal && examIdInput) { examIdInput.value = examId; modal.classList.add('active'); }
}

function closeNoteUploadModal() {
    const actualModal = document.getElementById('examNoteUploadModal');
    if (actualModal) { actualModal.classList.remove('active'); document.getElementById('uploadNoteForm').reset(); }
}

async function handleNoteUpload(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submitUploadBtn');
    const examId = document.getElementById('uploadNoteExamId').value;
    const uploader = document.getElementById('noteUploaderName').value;
    const isPublic = document.getElementById('noteIsPublic') ? document.getElementById('noteIsPublic').checked : true;
    const folderPassword = document.getElementById('folderPassword') ? document.getElementById('folderPassword').value : '';
    const fileInput = document.getElementById('noteFile');
    const pageCount = 0; // Manual input removed, will default/detect
    const progressList = document.getElementById('uploadProgressList');

    if (!fileInput.files.length) return alert("Dosya seçin.");

    try {
        submitBtn.disabled = true;
        document.getElementById('uploadStatusContainer').classList.remove('hub-hidden');
        progressList.innerHTML = '';
        const files = Array.from(fileInput.files);
        const batchId = crypto.randomUUID();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Automatic page count detection logic
            let detectedPageCount = 1; // Default to 1
            const extension = file.name.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'svg'].includes(extension)) {
                detectedPageCount = 1;
            } else if (extension === 'pdf') {
                detectedPageCount = 0; // PDF page count is harder without a library, setting 0 to avoid guess
            }

            const item = document.createElement('div');
            item.className = 'hub-flex hub-items-center hub-justify-between hub-bg-white/5 hub-p-3 hub-rounded-xl';
            item.innerHTML = `<span>${file.name}</span><span id="prog-${i}">Yükleniyor...</span>`;
            progressList.appendChild(item);

            const fileUrl = await window.ExamNotesSync.uploadFile(file, examId);
            await window.ExamNotesSync.addNote({
                exam_id: examId, title: file.name, uploader: uploader,
                file_url: fileUrl, page_count: detectedPageCount, batch_id: batchId,
                is_public: isPublic, folder_password: folderPassword
            });
            document.getElementById(`prog-${i}`).innerText = "TAMAMLANDI";
        }
        alert("Yüklendi!");
        delete window.examNotesCache[examId]; // Invalidate cache
        closeNoteUploadModal();
        openExamNotesModal(examId, document.getElementById('notesModalSubjectName').innerText);
        await fetchAllNoteCounts(); // Re-fetch counts
        renderExams();
    } catch (err) { alert(err.message); }
    finally { submitBtn.disabled = false; }
}

async function cleanupExpiredNotes() {
    if (!window.exams) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expired = window.exams.filter(e => new Date(e.date) < today);
    for (const e of expired) {
        const notes = await window.ExamNotesSync.fetchNotesByExam(e.id);
        for (const n of notes) await window.ExamNotesSync.deleteNote(n.id);
    }
}

async function fetchAllNoteCounts() {
    try {
        const res = await fetch(`${window.ExamNotesSync.config.baseUrl}?select=exam_id`, {
            headers: { 'apikey': window.ExamNotesSync.config.apiKey, 'Authorization': `Bearer ${window.ExamNotesSync.config.apiKey}` }
        });
        const data = await res.json();
        const counts = {};
        data.forEach(n => counts[n.exam_id] = (counts[n.exam_id] || 0) + 1);
        window.examNotesCounts = counts;
    } catch (e) { console.error(e); }
}

const originalInitExams = initExams;
window.initExams = function () {
    // Run setup immediately
    if (originalInitExams) originalInitExams();

    // Fetch extended data in background
    fetchAllNoteCounts().then(() => {
        console.log("📝 [Exams] Note counts updated");
        renderExams(); // Re-render to show counts
    }).catch(e => console.error("Note count fetch failed", e));

    setTimeout(cleanupExpiredNotes, 2000);
};

// --- Admin Panel Logic ---
let currentExamFormMode = 'detailed';

function openAdminModal(editId = null) {
    const modal = document.getElementById('adminPanelModal');
    const form = document.getElementById('addExamForm');
    const title = document.getElementById('adminModalTitle');
    const submitBtn = document.getElementById('adminSubmitBtn');
    const editIdInput = document.getElementById('editExamId');

    if (!modal) return;

    if (form) form.reset();
    if (editIdInput) editIdInput.value = editId || '';

    if (editId) {
        const exam = window.exams.find(e => e.id == editId);
        if (exam) {
            title.innerText = 'YAZILI DÜZENLE';
            submitBtn.innerText = 'GÜNCELLE';

            // Fill Detailed fields
            document.getElementById('newExamSubject').value = exam.subject || '';
            document.getElementById('newExamTeacher').value = exam.uploader || ''; // Reusing uploader as teacher for simplicity or mapping if separate
            document.getElementById('newExamDate').value = exam.date || '';
            document.getElementById('newExamLesson').value = exam.lessonNumber || '1';
            document.getElementById('newExamScenario').value = exam.scenarioNo || '';
            document.getElementById('newExamPages').value = exam.pages || '';
            document.getElementById('newExamTopics').value = Array.isArray(exam.topics) ? exam.topics.join(', ') : (exam.topics || '');
            document.getElementById('newExamScenarioLink').value = exam.scenarioLink || '';
            document.getElementById('newExamMebLink').value = exam.mebSampleLink || '';
            document.getElementById('newExamTeacherNotes').value = exam.teacherNotes || '';

            // Same for Quick fields
            document.getElementById('quickExamSubject').value = exam.subject || '';
            document.getElementById('quickExamDate').value = exam.date || '';
            document.getElementById('quickExamLesson').value = exam.lessonNumber || '1';
        }
    } else {
        title.innerText = 'YENİ YAZILI EKLE';
        submitBtn.innerText = 'EKLE';
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('newExamDate').value = today;
        document.getElementById('quickExamDate').value = today;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset mode to detailed on close
        switchExamFormMode('detailed');
    }
}

function switchExamFormMode(mode) {
    currentExamFormMode = mode;
    const detailed = document.getElementById('detailedExamSection');
    const quick = document.getElementById('quickExamSection');
    const glider = document.getElementById('examModeGlider');
    const btns = modal.querySelectorAll('.mode-toggle-btn'); // Fixing context error from homework attempt

    // Re-calculating btns specifically for exam modal
    const examModal = document.getElementById('adminPanelModal');
    const examBtns = examModal ? examModal.querySelectorAll('.mode-toggle-btn') : [];

    if (mode === 'detailed') {
        if (detailed) detailed.style.display = 'block';
        if (quick) quick.style.display = 'none';
        if (glider) glider.style.transform = 'translateX(0)';
        if (examBtns[0]) examBtns[0].classList.add('active');
        if (examBtns[1]) examBtns[1].classList.remove('active');
    } else {
        if (detailed) detailed.style.display = 'none';
        if (quick) quick.style.display = 'block';
        if (glider) glider.style.transform = 'translateX(100%)';
        if (examBtns[0]) examBtns[0].classList.remove('active');
        if (examBtns[1]) examBtns[1].classList.add('active');
    }
}

async function handleNewExam(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('adminSubmitBtn');
    const editId = document.getElementById('editExamId').value;

    let examData = {};

    if (currentExamFormMode === 'detailed') {
        examData = {
            subject: document.getElementById('newExamSubject').value,
            date: document.getElementById('newExamDate').value,
            lessonNumber: document.getElementById('newExamLesson').value,
            topics: document.getElementById('newExamTopics').value,
            pages: document.getElementById('newExamPages').value,
            scenarioNo: document.getElementById('newExamScenario').value,
            scenarioLink: document.getElementById('newExamScenarioLink').value,
            mebSampleLink: document.getElementById('newExamMebLink').value,
            teacherNotes: document.getElementById('newExamTeacherNotes').value,
            uploader: document.getElementById('newExamTeacher').value
        };
    } else {
        examData = {
            subject: document.getElementById('quickExamSubject').value,
            date: document.getElementById('quickExamDate').value,
            lessonNumber: document.getElementById('quickExamLesson').value,
            topics: '',
            pages: '',
            scenarioNo: '',
            scenarioLink: '',
            mebSampleLink: '',
            teacherNotes: '',
            uploader: ''
        };
    }

    if (!examData.subject || !examData.date) {
        alert("Lütfen en azından Ders Adı ve Tarih alanlarını doldurun.");
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = editId ? "GÜNCELLENİYOR..." : "EKLENİYOR...";

        if (editId) {
            await window.ExamsSync.updateExam(editId, examData);
            alert("Sınav başarıyla güncellendi!");
        } else {
            await window.ExamsSync.addExam(examData);
            alert("Sınav başarıyla eklendi!");
        }

        closeAdminModal();
        renderExams();
    } catch (err) {
        alert("Hata: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = editId ? "GÜNCELLE" : "EKLE";
    }
}

window.openEditExamModal = function (id) {
    openAdminModal(id);
};

window.handleDeleteExam = async function (id) {
    if (!confirm("Bu sınav kaydını silmek istediğinize emin misiniz? Sınava ait notlar da silinecektir!")) return;

    try {
        // Option to cleanup notes too? Sync logic usually handles it or it's manual
        // The cleanupExpiredNotes handles past ones, but manual delete should probably clear cache
        await window.ExamsSync.deleteExam(id);
        delete window.examNotesCache[id];
        alert("Sınav başarıyla silindi!");
        renderExams();
    } catch (err) {
        alert("Silme hatası: " + err.message);
    }
};

window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.switchExamFormMode = switchExamFormMode;
window.handleNewExam = handleNewExam;

window.renderExams = renderExams;
window.openExamNotesModal = openExamNotesModal;
window.closeExamNotesModal = closeExamNotesModal;
window.openNoteUploadModal = openNoteUploadModal;
window.closeNoteUploadModal = closeNoteUploadModal;
window.handleNoteUpload = handleNoteUpload;

if (typeof window.initExams === 'function') window.initExams();
