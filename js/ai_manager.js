// AI Manager Constants (v2.2 - Final Fix)
console.log('🏁 ai_manager.js loaded - v2.2');

const AI_STORAGE_KEY = 'ai_notebooks_v1';
const ADMIN_CONTROLS_ID = 'adminControls';
const DEFAULT_NOTEBOOKS = [
    {
        id: 'default_1',
        title: 'Genel Asistan',
        description: 'Genel sorular, sohbet ve günlük konular için.',
        link: 'https://notebooklm.google.com/notebook/6b4e5654-c061-4a27-b94f-ccd089921225?authuser=4',
        date: new Date().toISOString()
    }
];

let notebooks = [];
let isAdminMode = false;

// --- INITIALIZATION ---
async function initAiManager() {
    console.log('🚀 [AI] Manager Initializing (v2.2)...');

    // 1. Setup Listeners
    setupSearchListener();
    setupPasswordListener();

    // 2. Load Data
    await loadNotebooks(false);

    // 3. Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 4. Chat Bindings
    const chatInput = document.getElementById('geminiChatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendGeminiMessage();
            }
        });
    }

    console.log('✅ [AI] Manager Ready & Listening');
}

// Bind to DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAiManager);
} else {
    initAiManager();
}

// Global Load Notebooks
async function loadNotebooks(forceRefresh = false) {
    const container = document.getElementById('notebookGrid');
    if (container) {
        // Only show loading if empty
        if (!container.hasChildNodes()) {
            container.innerHTML = '<div style="text-align:center; color:#888; width:100%; grid-column: 1 / -1; padding: 40px;">Defterler yükleniyor...</div>';
        }
    }

    try {
        if (typeof NotebooksSync !== 'undefined' && NotebooksSync.fetchAll) {
            console.log('🔄 [AI] Fetching notebooks...');
            const fetchPromise = NotebooksSync.fetchAll(forceRefresh);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
            const supabaseNotebooks = await Promise.race([fetchPromise, timeoutPromise]);

            if (supabaseNotebooks) {
                notebooks = supabaseNotebooks.length > 0 ? supabaseNotebooks : DEFAULT_NOTEBOOKS;
                console.log('✅ [AI] Loaded:', notebooks.length);
            }
        } else {
            console.warn('⚠️ [AI] Sync module missing');
            throw new Error('Sync module unavailable');
        }
    } catch (err) {
        console.warn('⚠️ [AI] Fetch failed, using local/default:', err.message);
        const stored = localStorage.getItem(AI_STORAGE_KEY);
        notebooks = stored ? JSON.parse(stored) : DEFAULT_NOTEBOOKS;
    }

    // Final check for empty notebooks
    if (!notebooks || notebooks.length === 0) notebooks = DEFAULT_NOTEBOOKS;

    renderNotebooks(notebooks);
}

function disableAdminMode() {
    isAdminMode = false;
    const controls = document.getElementById('adminControlsV2');
    if (controls) controls.style.display = 'none';

    renderNotebooks(notebooks);
}

// Global Search Sync
function syncAiSearch(val) {
    const query = val.toLocaleLowerCase('tr').trim();

    // Update all relevant inputs to keep them in sync
    const inputs = ['aiSearchInput', 'aiSearchInputDesktop', 'aiSearchInputMobile'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value !== val) el.value = val;
    });

    // Handle Admin Command
    const adminCmds = ['yönetici', 'yonetici', 'admin'];
    if (adminCmds.includes(query)) {
        openAdminAuthInline();
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        return;
    }

    const filtered = notebooks.filter(n =>
        (n.title || '').toLocaleLowerCase('tr').includes(query) ||
        (n.description || '').toLocaleLowerCase('tr').includes(query)
    );
    renderNotebooks(filtered);
}

function renderNotebooks(items) {
    const container = document.getElementById('notebookGrid');
    if (!container) return;

    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#666; width:100%; grid-column: 1 / -1; padding: 40px;">Sonuç bulunamadı.</div>`;
        return;
    }

    items.forEach((notebook, index) => {
        const card = document.createElement('div');
        card.className = 'notebook-card';
        card.style.animation = `slideUp 0.5s ease forwards ${index * 0.1}s`;
        card.style.opacity = '1';
        card.style.position = 'relative';

        card.onclick = (e) => {
            if (e.target.closest('.delete-notebook-wrapper')) return;
            openAiPopup(notebook.link);
        };

        card.innerHTML = `
            <div class="notebook-icon">
                <i data-lucide="bot"></i>
            </div>
            <div class="notebook-info">
                <h3>${notebook.title}</h3>
                <p>${notebook.description || 'Google NotebookLM Asistanı'}</p>
            </div>
            <div class="notebook-arrow">
                <i data-lucide="chevron-right"></i>
            </div>
        `;

        if (isAdminMode) {
            const btnWrapper = document.createElement('div');
            btnWrapper.className = 'delete-notebook-wrapper';
            btnWrapper.style.cssText = 'position: absolute; top: 12px; right: 12px; z-index: 9999;';

            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i data-lucide="trash-2" style="width: 22px; height: 22px;"></i>';
            delBtn.style.cssText = `
                background: #ef4444; 
                border: 2px solid #fff; 
                color: #fff; 
                width: 44px; 
                height: 44px; 
                border-radius: 12px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                cursor: pointer; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                transition: transform 0.2s;
            `;

            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteNotebookFromHub(notebook.id, delBtn);
            });

            delBtn.addEventListener('mouseenter', () => {
                card.classList.add('no-hover');
                delBtn.style.transform = 'scale(1.1)';
            });

            delBtn.addEventListener('mouseleave', () => {
                card.classList.remove('no-hover');
                delBtn.style.transform = 'scale(1)';
            });

            btnWrapper.appendChild(delBtn);
            card.appendChild(btnWrapper);
        }

        container.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Update count in UI
    const countEl = document.getElementById('aiNotebookCount');
    if (countEl) countEl.innerText = items.length;
}

function setupSearchListener() {
    const searchInput = document.getElementById('aiSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => syncAiSearch(e.target.value));
}

function setupPasswordListener() {
    const passInput = document.getElementById('adminPasswordInputInline');
    if (passInput) {
        passInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyAdminPasswordInline();
            }
        });
    }
}

function openAdminAuthInline() {
    console.log('🗝️ OPENING ADMIN POP-UP');
    const container = document.getElementById('adminAuthInline');
    if (container) {
        container.style.display = 'flex';
        const passInput = document.getElementById('adminPasswordInputInline');
        if (passInput) {
            passInput.value = '';
            setTimeout(() => passInput.focus(), 200);
        }
    } else {
        alert('Admin modalı bulunamadı (HTML hatası).');
    }
}

function closeAdminAuthInline() {
    const container = document.getElementById('adminAuthInline');
    if (container) container.style.display = 'none';
}

function verifyAdminPasswordInline() {
    const input = document.getElementById('adminPasswordInputInline').value;
    if (input === '829615') {
        closeAdminAuthInline();
        enableAdminMode();
    } else {
        alert('Hatalı şifre!');
    }
}

function enableAdminMode() {
    isAdminMode = true;
    const controls = document.getElementById('adminControlsV2');
    if (controls) controls.style.display = 'flex';

    renderNotebooks(notebooks);
    alert('✅ Yönetici Modu Aktif!');
}

function openAddNotebookInline() {
    const container = document.getElementById('addNotebookInline');
    if (container) {
        container.style.display = 'flex';
        const firstInput = document.getElementById('newNbTitle');
        if (firstInput) firstInput.focus();
    }
}

function closeAddNotebookInline() {
    const container = document.getElementById('addNotebookInline');
    if (container) container.style.display = 'none';
}

async function addNewNotebook(event) {
    if (event) event.preventDefault();

    if (!isAdminMode) return;

    const title = document.getElementById('newNbTitle').value;
    const desc = document.getElementById('newNbDesc').value;
    const link = document.getElementById('newNbLink').value;

    if (!title || !link) {
        alert('Lütfen başlık ve linki doldurun!');
        return;
    }

    const newNotebook = {
        id: 'nb_' + Date.now(),
        title,
        description: desc,
        link,
        date: new Date().toISOString()
    };

    try {
        if (typeof NotebooksSync !== 'undefined') {
            await NotebooksSync.addNotebook(newNotebook);
            await loadNotebooks();
        } else {
            notebooks.push(newNotebook);
            localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(notebooks));
            renderNotebooks(notebooks);
        }
        closeAddNotebookInline();
        document.getElementById('newNbTitle').value = '';
        document.getElementById('newNbDesc').value = '';
        document.getElementById('newNbLink').value = '';
        alert('✅ Yeni defter başarıyla eklendi!');
    } catch (err) {
        console.error('Add Error:', err);
        alert('Ekleme hatası: ' + err.message);
    }
}

async function deleteNotebookFromHub(id, btnElement) {
    if (!isAdminMode) {
        alert('Hata: Yönetici modu aktif değil!');
        return;
    }

    if (confirm('Silmek istediğine emin misin?')) {
        try {
            if (typeof NotebooksSync !== 'undefined') {
                await NotebooksSync.deleteNotebook(id);
                await loadNotebooks();
            } else {
                notebooks = notebooks.filter(n => n.id !== id);
                localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(notebooks));
                renderNotebooks(notebooks);
            }
        } catch (err) {
            console.error(err);
            alert('Hata: ' + err.message);
        }
    }
}

async function deleteAllNotebooks() {
    if (!isAdminMode) return;
    if (confirm('⚠️ DİKKAT: Tüm defterler silinecek!')) {
        try {
            if (typeof NotebooksSync !== 'undefined') {
                for (const nb of notebooks) {
                    await NotebooksSync.deleteNotebook(nb.id);
                }
                await loadNotebooks();
            } else {
                notebooks = [];
                localStorage.removeItem(AI_STORAGE_KEY);
                renderNotebooks([]);
            }
            alert('✅ Temizlendi.');
        } catch (err) {
            console.error(err);
            alert('Hata: ' + err.message);
        }
    }
}

// Global pop-up helper
function openAiPopup(customLink) {
    const url = customLink || "https://notebooklm.google.com/notebook/6b4e5654-c061-4a27-b94f-ccd089921225?authuser=4";

    // Use the premium unified modal
    const modal = document.getElementById('aiIframeModal');
    const iframe = document.getElementById('aiIframe');

    if (modal && iframe) {
        iframe.src = url;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('🖥️ [AI] Opening assistant inline:', url);
    } else {
        // Fallback to popup if modal missing
        const width = 1000;
        const height = 800;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        window.open(url, "9A_Assistant_AI", `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
    }
}

// Close helper
function closeAiIframeModal() {
    const modal = document.getElementById('aiIframeModal');
    const iframe = document.getElementById('aiIframe');
    if (modal) {
        modal.classList.remove('active');
        if (iframe) iframe.src = ''; // Clear source to stop audio/scripts
        document.body.style.overflow = '';
    }
}
window.closeAiIframeModal = closeAiIframeModal;

// GEMINI CHAT
function toggleGeminiChat() {
    const widget = document.getElementById('geminiChatWidget');
    const toggleBtn = document.getElementById('geminiToggleBtn');
    if (widget.classList.contains('active')) {
        widget.classList.remove('active');
        toggleBtn.style.display = 'flex';
    } else {
        widget.classList.add('active');
        toggleBtn.style.display = 'none';
        setTimeout(() => document.getElementById('geminiChatInput').focus(), 100);
    }
}

async function sendGeminiMessage() {
    const input = document.getElementById('geminiChatInput');
    const msgContainer = document.getElementById('geminiChatMessages');
    const userMsg = input.value.trim();

    if (!userMsg) return;

    appendMessage('user', userMsg);
    input.value = '';

    const typingId = appendMessage('system', '<div class="typing-indicator">...</div>', true);

    try {
        const reply = await GeminiService.chat(userMsg);
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        const div = document.createElement('div');
        div.className = 'message system';
        msgContainer.appendChild(div);

        let formattedData = reply
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>');

        div.innerHTML = formattedData;
        div.style.animation = 'fadeIn 0.3s ease';
        msgContainer.scrollTop = msgContainer.scrollHeight;

    } catch (e) {
        console.error("Chat Error:", e);
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        appendMessage('system', 'Hata: ' + e.message);
    }
}

function appendMessage(role, text, isHtml = false) {
    const container = document.getElementById('geminiChatMessages');
    const div = document.createElement('div');
    div.className = `message ${role}`;
    if (isHtml) div.innerHTML = text;
    else div.innerText = text;
    // Fix ID collision (Date.now() is not enough for sync calls)
    div.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

// Edit Modal Stubs (if needed)
function openEditNotebookModal(id) { /* Implementation if needed */ }
function closeEditNotebookModal() { document.getElementById('editNotebookModal').style.display = 'none'; }
function handleUpdateNotebook(e) { e.preventDefault(); }

// --- EXSPOSE TO WINDOW (FINAL) ---
window.syncAiSearch = syncAiSearch;
window.loadNotebooks = loadNotebooks;
window.renderNotebooks = renderNotebooks;
window.notebooks = notebooks;
window.openAdminAuthInline = openAdminAuthInline;
window.closeAdminAuthInline = closeAdminAuthInline;
window.verifyAdminPasswordInline = verifyAdminPasswordInline;
window.openAddNotebookInline = openAddNotebookInline;
window.closeAddNotebookInline = closeAddNotebookInline;
window.addNewNotebook = addNewNotebook;
window.deleteNotebookFromHub = deleteNotebookFromHub;
window.deleteAllNotebooks = deleteAllNotebooks;
window.toggleGeminiChat = toggleGeminiChat;
window.sendGeminiMessage = sendGeminiMessage;
window.openAiPopup = openAiPopup;
