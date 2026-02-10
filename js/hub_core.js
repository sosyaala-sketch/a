/**
 * HUB MODULE - CORE LOGIC (v3 - Admin & Upload)
 */

const SUPABASE_HUB_CONFIG = {
    baseUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/rest/v1/hub_items',
    storageUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/storage/v1/object/hub_files',
    apiKey: 'sb_publishable_VQ6Eu0R0LKEMZOh9P93L0w_qR3Ylyu3'
};

const MAX_HUB_SUPABASE_SIZE = 90 * 1024 * 1024; // 90MB

let hubItems = [];
let activeHubFilter = 'all';
let isHubAdminMode = false;
let currentHubPath = '';

const hubIconMap = {
    image: 'image',
    note: 'file-text',
    file: 'file-box',
    folder: 'folder'
};

/**
 * Initialize Hub Module
 */
function initHub() {
    console.log("🚀 Initializing Hub Module...");

    // Mobile Search Listener
    const searchInput = document.getElementById('mobileHubSearchInput');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const val = e.target.value.toLowerCase().trim();
            if (val === 'yönetici' || val === 'yönetiici') {
                triggerHubAdmin();
                e.target.value = '';
            }
            renderHub();
        };
    }

    // Mobile Filters
    const mobileTabs = document.querySelectorAll('.hub-tab');
    mobileTabs.forEach(tab => {
        tab.onclick = () => {
            activeHubFilter = tab.dataset.filter;
            mobileTabs.forEach(t => t.classList.toggle('active', t === tab));
            renderHub();
        };
    });

    fetchHubItems();
}

/**
 * Fetch items from Supabase
 */
async function fetchHubItems() {
    try {
        const res = await fetch(`${SUPABASE_HUB_CONFIG.baseUrl}?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${SUPABASE_HUB_CONFIG.apiKey}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (res.ok) {
            hubItems = await res.json();
            renderHub();
            updateHubStats();
        }
    } catch (err) {
        console.error("Hub fetch error:", err);
    }
}

/**
 * Render Hub Cards
 */
function renderHub() {
    const mobileContainer = document.getElementById('mobileHubGrid');
    if (!mobileContainer) return;

    const search = document.getElementById('mobileHubSearchInput')?.value.toLowerCase() || '';

    // Filter items based on path, type and search
    let filtered = hubItems.filter(item => (item.parent_path || '') === currentHubPath);

    if (activeHubFilter !== 'all') {
        filtered = filtered.filter(i => {
            if (activeHubFilter === 'private') return i.is_private;
            if (activeHubFilter === 'image' && i.type === 'image') return true;
            if (activeHubFilter === 'file' && (i.type === 'file' || i.type === 'note')) return true;
            return i.type === activeHubFilter;
        });
    }

    if (search) {
        filtered = filtered.filter(i => i.title.toLowerCase().includes(search));
    }

    mobileContainer.innerHTML = '';

    // Back Button if inside a folder
    if (currentHubPath) {
        const backBtn = document.createElement('div');
        backBtn.className = 'mobile-hub-card-back';
        backBtn.innerHTML = `
            <i data-lucide="corner-left-up"></i>
            <span>Üst Klasöre Dön</span>
        `;
        backBtn.onclick = () => {
            const pathParts = currentHubPath.split('/');
            currentHubPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
            renderHub();
        };

        mobileContainer.appendChild(backBtn);
    }

    // Update Header Title based on Path
    const headerTitle = document.querySelector('#hubPage .mobile-header h1');
    if (headerTitle) {
        if (!currentHubPath) {
            headerTitle.innerText = "Bulut Paylaşım";
        } else {
            const parts = currentHubPath.split('/');
            const currentFolder = parts[parts.length - 1];
            headerTitle.innerText = currentFolder.toUpperCase();
        }
    }

    if (filtered.length === 0) {
        mobileContainer.innerHTML += `<div class="empty-state">İçerik Bulunamadı</div>`;
    } else {
        filtered.forEach(item => {
            mobileContainer.appendChild(renderMobileHubCard(item));
        });
    }

    if (window.lucide) lucide.createIcons();
    updateHubAdminUI();
}

/**
 * Render a single mobile hub card
 */
function renderMobileHubCard(item) {
    const card = document.createElement('div');
    const isFolder = item.type === 'folder';
    card.className = `mobile-hub-card-modern ${isFolder ? 'folder' : ''}`;

    // Admin Drag & Drop Move
    if (isHubAdminMode) {
        if (!isFolder) {
            card.draggable = true;
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.id);
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        } else {
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            });
            card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
            card.addEventListener('drop', async (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                const fileId = e.dataTransfer.getData('text/plain');
                if (fileId && fileId != item.id) moveHubItem(fileId, item.path);
            });
        }
    }

    const icon = hubIconMap[item.type] || 'file';
    const sizeStr = formatBytes(item.size);

    card.innerHTML = `
        <div class="item-icon-box ${item.type}">
            <i data-lucide="${icon}"></i>
        </div>
        <div class="card-body">
            <h3 class="item-title">${item.title}</h3>
            <div class="item-meta">
                <span>${item.uploader || 'Anonim'}</span>
                <span style="opacity:0.3; margin:0 4px;">|</span>
                <span>${sizeStr}</span>
                ${item.is_private ? '<span style="color:#FF4D4D; margin-left:6px;">🔒</span>' : ''}
            </div>
        </div>
        <div class="card-actions">
            ${isFolder ? `
                <div class="btn-action-circle"><i data-lucide="chevron-right"></i></div>
            ` : `
                <button class="btn-action-circle" onclick="event.stopPropagation(); window.openHubItem('${item.id}')"><i data-lucide="external-link"></i></button>
                <button class="btn-action-circle" onclick="event.stopPropagation(); window.downloadHubItem('${item.id}')"><i data-lucide="download"></i></button>
            `}
            ${isHubAdminMode ? `
                <button class="btn-action-circle delete" onclick="event.stopPropagation(); window.deleteHubItem('${item.id}')"><i data-lucide="trash-2"></i></button>
            ` : ''}
        </div>
    `;

    if (isFolder) {
        card.onclick = (e) => {
            if (e.target.closest('.delete')) return;
            if (item.is_private) {
                const pass = prompt(`${item.title} klasörü şifreli! Şifreyi girin:`);
                if (pass !== item.password) return alert("Hatalı şifre!");
            }
            currentHubPath = item.path;
            renderHub();
        };
    } else {
        card.onclick = () => window.openHubItem(item.id);
    }

    return card;
}

/**
 * Mobile Admin Actions
 */
function triggerHubAdmin() {
    const pass = prompt("Yönetici Şifresi:");
    if (pass === "829615") {
        isHubAdminMode = true;
        alert("Yönetici Modu Aktif! Paylaşım yapabilir ve klasör ekleyebilirisiniz.");
        updateHubAdminUI();
        renderHub();
    } else if (pass !== null) {
        alert("Hatalı!");
    }
}

function updateHubAdminUI() {
    const mainFab = document.getElementById('mobileFabMain');
    const folderFab = document.getElementById('mobileFabFolder');

    if (mainFab) {
        mainFab.setAttribute('onclick', 'toggleHubFabs()');
    }

    if (folderFab) {
        folderFab.style.display = isHubAdminMode ? 'flex' : 'none';
        if (!isHubAdminMode) folderFab.classList.remove('show');
    }
}

let isHubActionSheetOpen = false;


window.toggleHubFabs = () => {
    // Legacy name for header button action - NOW DIRECTLY OPENS ACTION SHEET
    openHubActionSheet();
};

window.openHubActionSheet = () => {
    const existing = document.getElementById('hubActionSheetOverlay');
    if (existing) existing.remove();

    const html = `
        <div id="hubActionSheetOverlay" class="modal-overlay active" style="z-index: 1999;" onclick="closeHubActionSheet()"></div>
        <div class="hub-action-sheet active">
            <h3>İşlem Seçin</h3>
            <button class="hub-action-btn primary" onclick="closeHubActionSheet(); openHubUploadModal()">
                <i data-lucide="upload-cloud"></i> Dosya Yükle
            </button>
            <button class="hub-action-btn" onclick="closeHubActionSheet(); handleFolderCreationRequest()">
                <i data-lucide="folder-plus"></i> Klasör Oluştur (Yönetici)
            </button>
            <button class="hub-action-btn hub-cancel-btn" onclick="closeHubActionSheet()">
                İptal
            </button>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();
};

window.handleFolderCreationRequest = () => {
    if (isHubAdminMode) {
        openMobileAddFolder();
    } else {
        const pass = prompt("Klasör oluşturmak için yönetici şifresi:");
        if (pass === "829615") {
            isHubAdminMode = true;
            alert("Yönetici girişi başarılı!");
            openMobileAddFolder();
        } else if (pass !== null) {
            alert("Hatalı şifre!");
        }
    }
};

window.closeHubActionSheet = () => {
    const overlay = document.getElementById('hubActionSheetOverlay');
    const sheet = document.querySelector('.hub-action-sheet');
    if (sheet) sheet.classList.remove('active');
    if (overlay) setTimeout(() => overlay.remove(), 300); // Wait for transition
    // Also remove the container div if needed
    const container = overlay?.parentNode;
    if (container && container.tagName === 'DIV' && !container.id) {
        setTimeout(() => container.remove(), 300);
    }
};

/**
 * Global Actions (Exposed to window)
 */
window.openHubItem = (id) => {
    const item = hubItems.find(i => i.id == id);
    if (!item) return;
    if (item.is_private) {
        const pass = prompt("Şifre:");
        if (pass !== item.password) return alert("Hatalı!");
    }
    window.open(item.url, '_blank');
};

window.downloadHubItem = async (id) => {
    const item = hubItems.find(i => i.id == id);
    if (!item) return;
    if (item.is_private) {
        const pass = prompt("Şifre:");
        if (pass !== item.password) return alert("Hatalı!");
    }

    try {
        const res = await fetch(item.url);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.title;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert("İndirme başarısız.");
    }
};

window.deleteHubItem = async (id) => {
    const item = hubItems.find(i => i.id == id);
    if (!item || !confirm(`"${item.title}" silinsin mi?`)) return;

    try {
        const res = await fetch(`${SUPABASE_HUB_CONFIG.baseUrl}?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${SUPABASE_HUB_CONFIG.apiKey}`
            }
        });
        if (res.ok) {
            fetchHubItems();
        }
    } catch (err) {
        alert("Silinemedi.");
    }
};

async function moveHubItem(fileId, targetPath) {
    const item = hubItems.find(i => i.id == fileId);
    if (!item) return;

    if (confirm(`"${item.title}" dosyasını bu klasöre taşımak istiyor musunuz?`)) {
        try {
            await fetch(`${SUPABASE_HUB_CONFIG.baseUrl}?id=eq.${fileId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_HUB_CONFIG.apiKey,
                    'Authorization': `Bearer ${SUPABASE_HUB_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ parent_path: targetPath })
            });
            fetchHubItems();
        } catch (err) {
            alert("Taşıma başarısız.");
        }
    }
}

/**
 * Mobile Native Item Creation
 */
window.openMobileAddFolder = () => {
    const name = prompt("Yeni Klasör Adı:");
    if (!name) return;
    const isPrivate = confirm("Şifreli klasör olsun mu?");
    let password = "";
    if (isPrivate) {
        password = prompt("Klasör şifresi belirleyin:");
        if (!password) return;
    }

    createHubFolder(name, password);
};

async function createHubFolder(name, password) {
    const path = currentHubPath ? `${currentHubPath}/${name}` : `uploads/${name}`;
    const parentPath = currentHubPath || '';

    try {
        const res = await fetch(SUPABASE_HUB_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${SUPABASE_HUB_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: name,
                type: 'folder',
                path: path,
                parent_path: parentPath,
                is_private: !!password,
                password: password,
                storage_type: 'meta',
                size: 0
            })
        });

        if (res.ok) {
            alert("Klasör oluşturuldu!");
            fetchHubItems();
        }
    } catch (err) {
        alert("Klasör oluşturulamadı.");
    }
}

/**
 * Integrated Upload Modal (Native Mobile Experience)
 */
window.openHubUploadModal = () => {
    const modalHtml = `
        <div id="mobileUploadModalOverlay" class="modal-overlay" style="display: flex; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center;">
             <div class="modal-content premium" style="width:90%; max-width:400px; padding:30px; border-radius:30px; background:#fff; color:#1a1a1a;">
                <h2 style="margin-bottom:20px; font-size:20px;">Paylaşım Yap</h2>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">İSİM</label>
                    <input id="mobileUplTitle" type="text" class="premium-input" placeholder="Dosya adı..." style="background:#f5f5f5; color:#1a1a1a; border:1px solid #ddd;">
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">YÜKLEYEN</label>
                    <input id="mobileUplUser" type="text" class="premium-input" placeholder="İsminiz..." style="background:#f5f5f5; color:#1a1a1a; border:1px solid #ddd;">
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">DOSYA SEÇ</label>
                    <input id="mobileUplFile" type="file" style="color:#1a1a1a; font-size:12px;">
                </div>
                <div class="form-group" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                    <label style="font-size:12px; color:#666;">ŞİFRE KOY</label>
                    <input id="mobileUplPass" type="password" class="premium-input" style="width:100px; padding:8px; background:#f5f5f5; color:#1a1a1a; border:1px solid #ddd;" placeholder="Opsiyonel">
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="closeMobileUploadModal()" style="flex:1; padding:15px; border-radius:15px; border:none; background:#f5f5f5; color:#666;">İptal</button>
                    <button onclick="handleMobileUpload()" id="mobileUplBtn" style="flex:2; padding:15px; border-radius:15px; border:none; background:#f3a682; color:#fff; font-weight:bold;">Yükle</button>
                </div>
             </div>
        </div>
    `;
    const div = document.createElement('div');
    div.id = "mobileUploadAnchor";
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
};

window.closeMobileUploadModal = () => {
    const anchor = document.getElementById('mobileUploadAnchor');
    if (anchor) anchor.remove();
};

window.handleMobileUpload = async () => {
    const title = document.getElementById('mobileUplTitle').value;
    const uploader = document.getElementById('mobileUplUser').value;
    const pass = document.getElementById('mobileUplPass').value;
    const fileInput = document.getElementById('mobileUplFile');
    const file = fileInput.files[0];

    if (!title || !file) return alert("Dosya ve isim zorunludur!");

    const btn = document.getElementById('mobileUplBtn');
    btn.innerText = "Yükleniyor...";
    btn.disabled = true;

    try {
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        const fileName = `${Date.now()}_${safeTitle}${extension}`;
        const storagePath = currentHubPath ? `${currentHubPath}/${fileName}` : `uploads/${fileName}`;

        // 1. Upload to Storage
        const res = await fetch(`${SUPABASE_HUB_CONFIG.storageUrl}/${storagePath}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${SUPABASE_HUB_CONFIG.apiKey}`,
                'Content-Type': file.type
            },
            body: file
        });

        if (!res.ok) throw new Error("Storage upload error");

        const uploadedUrl = `https://znrlvhbuzmukznnfxpjy.supabase.co/storage/v1/object/public/hub_files/${storagePath}`;

        // 2. Metadata Database
        await fetch(SUPABASE_HUB_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${SUPABASE_HUB_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                type: file.type.includes('image') ? 'image' : 'file',
                storage_type: 'supabase',
                path: storagePath,
                size: file.size,
                is_private: !!pass,
                password: pass,
                uploader: uploader || 'Mobil Kullanıcı',
                parent_path: currentHubPath || '',
                url: uploadedUrl
            })
        });

        alert("Dosya başarıyla yüklendi!");
        closeMobileUploadModal();
        fetchHubItems();
    } catch (err) {
        alert("Yükleme hatası: " + err.message);
    } finally {
        btn.innerText = "Yükle";
        btn.disabled = false;
    }
};

function updateHubStats() {
    const totalCount = hubItems.length;
    const folderCount = hubItems.filter(i => i.type === 'folder').length;
    const fileCount = totalCount - folderCount;

    const totalEl = document.getElementById('mobileHubTotalCount');
    const fileEl = document.getElementById('mobileHubFileCount');
    const folderEl = document.getElementById('mobileHubFolderCount');

    if (totalEl) totalEl.innerText = totalCount;
    if (fileEl) fileEl.innerText = fileCount;
    if (folderEl) folderEl.innerText = folderCount;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Global exposure
window.initHub = initHub;
window.renderHub = renderHub;
window.triggerHubAdmin = triggerHubAdmin;
