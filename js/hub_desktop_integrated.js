
const DESKTOP_HUB_CONFIG = {
    baseUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/rest/v1/hub_items',
    storageUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/storage/v1/object/hub_files',
    apiKey: 'sb_publishable_VQ6Eu0R0LKEMZOh9P93L0w_qR3Ylyu3'
};

const DESKTOP_GITHUB_CONFIG = {
    token: '', // BURAYA KENDİ GITHUB TOKENINIZI EKLEYİN
    owner: 'sosyaala-sketch',
    repo: '9AHUB',
    branch: 'main'
};

let desktopHubItems = [];
let activeDesktopHubFilter = 'all';
let currentDesktopHubPath = '';
let isDesktopHubAdminMode = false;
const MAX_DESKTOP_SUPABASE_SIZE = 90 * 1024 * 1024; // 90MB

// --- CORE FUNCTIONS ---
function formatDesktopHubSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function navigateDesktopHubTo(path) {
    currentDesktopHubPath = path;
    renderDesktopHubBreadcrumbs();
    renderDesktopHubItems();
}

function renderDesktopHubBreadcrumbs() {
    const container = document.getElementById('hubDesktopBreadcrumb');
    if (!container) return; // Guard clause

    let html = `<button onclick="navigateDesktopHubTo('')" class="text-[10px] font-black uppercase ${currentDesktopHubPath === '' ? 'text-white' : 'text-white/40'} hover:text-white transition-all flex items-center gap-1">
        <i data-lucide="home" class="w-3 h-3"></i> ROOT
    </button>`;

    if (currentDesktopHubPath) {
        const parts = currentDesktopHubPath.split('/').filter(p => p && p !== 'uploads');
        let cumulativePath = 'uploads';
        parts.forEach((part, index) => {
            cumulativePath += '/' + part;
            const finalPath = cumulativePath;
            html += `
                <i data-lucide="chevron-right" class="w-3 h-3 text-white/10"></i>
                <button onclick="navigateDesktopHubTo('${finalPath}')" class="text-[10px] font-black uppercase ${index === parts.length - 1 ? 'text-white' : 'text-white/40'} hover:text-white transition-all">
                    ${part}
                </button>
            `;
        });
    }
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

function renderDesktopHubItems() {
    const container = document.getElementById('hubDesktopFileGrid');
    if (!container) return; // Guard clause

    const searchInput = document.getElementById('hubDesktopSearchInput');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const targetDir = currentDesktopHubPath || '';

    let filtered = desktopHubItems.filter(item => (item.parent_path || '') === targetDir);

    if (activeDesktopHubFilter !== 'all') {
        filtered = filtered.filter(i => {
            if (activeDesktopHubFilter === 'private') return i.is_private;
            if (activeDesktopHubFilter === 'file' && i.type === 'note') return true;
            return i.type === activeDesktopHubFilter;
        });
    }

    if (search) {
        filtered = filtered.filter(i => i.title.toLowerCase().includes(search));
    }

    container.innerHTML = '';

    // Geri Dön butonu - currentDesktopHubPath boş değilse göster (herhangi bir klasördeyiz)
    if (currentDesktopHubPath && currentDesktopHubPath !== '') {
        const pathParts = currentDesktopHubPath.split('/');
        const parentDir = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';

        const backCard = document.createElement('div');
        backCard.className = `hub-animate-fade relative group rounded-[28px] border border-white/5 bg-white/5 p-6 h-[220px] flex flex-col transition-all hover:-translate-y-1 cursor-pointer items-center justify-center text-white/40 hover:text-white hover:bg-white/10`;

        backCard.dataset.dropZone = 'true';
        backCard.dataset.folderPath = parentDir;
        backCard.dataset.folderTitle = parentDir || 'ANA DİZİN';

        backCard.innerHTML = `
            <i data-lucide="corner-left-up" class="w-12 h-12 mb-4"></i>
            <span class="text-[10px] font-black uppercase tracking-widest">Geri Dön</span>
            <span class="text-[8px] text-white/20 mt-1">${parentDir || 'ANA DİZİN'}</span>
        `;
        backCard.onclick = () => navigateDesktopHubTo(parentDir);
        container.appendChild(backCard);
    }

    if (filtered.length === 0) {
        container.insertAdjacentHTML('beforeend', `<div class="col-span-full py-20 text-center text-white/20 font-black uppercase tracking-widest">İçerik Bulunamadı</div>`);
        if (window.lucide) lucide.createIcons();
        updateDesktopHubStorageStats();
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        const isFolder = item.type === 'folder';
        const canDrop = isFolder && !item.is_private;

        card.className = `hub-animate-fade relative group rounded-[32px] hub-glass-panel p-6 h-[220px] flex flex-col transition-all hover:-translate-y-2 ${item.is_private ? 'border-dashed opacity-90' : ''} ${isFolder ? 'folder-card' : 'file-card'}`;

        if (!isFolder) {
            card.draggable = true;
            card.dataset.itemId = item.id;
            card.dataset.itemTitle = item.title;
        }
        if (canDrop) {
            card.dataset.dropZone = 'true';
            card.dataset.folderPath = item.path;
            card.dataset.folderTitle = item.title;
        }

        const iconMap = { image: 'image', note: 'file-text', file: 'file-box', folder: 'folder' };

        card.innerHTML = `
            <div class="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
                <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div class="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            ${isDesktopHubAdminMode && !isFolder ? `
                <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button class="move-item p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all" data-id="${item.id}" title="Taşı">
                        <i data-lucide="folder-input" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-item p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" data-id="${item.id}" title="Sil">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            ` : (isDesktopHubAdminMode && isFolder ? `
                <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="delete-item p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" data-id="${item.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            ` : '')}
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-white/5 rounded-xl">
                    <i data-lucide="${iconMap[item.type] || 'file'}" class="${isFolder ? 'text-zinc-400' : (item.type === 'image' ? 'text-white' : 'text-zinc-200')}"></i>
                </div>
                <span class="text-[9px] font-black text-white/20 uppercase bg-white/5 px-2 py-1 rounded-md">
                    ${isFolder ? 'KLASÖR' : item.storage_type.toUpperCase()} | ${formatDesktopHubSize(item.size)}
                </span>
            </div>
            <div class="flex-1 overflow-hidden">
                <h3 class="text-base font-black text-white truncate uppercase mb-1">${item.title}</h3>
                <p class="text-[10px] text-white/20 font-bold uppercase tracking-widest">${item.is_private ? 'Korumalı' : (isFolder ? 'Dizin' : 'Genel Paylaşım')}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    ${isFolder ? (item.is_private ? '<div class="flex items-center gap-1 text-red-400 text-[9px] font-black"><i data-lucide="lock" class="w-2.5 h-2.5"></i> GİZLİ</div>' : '<div class="text-white/20 text-[9px] font-black uppercase">AÇ</div>') : `
                        <div class="flex gap-2">
                            <button class="preview-item text-[9px] font-black uppercase bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all" data-id="${item.id}">ÖNİZLE</button>
                            <button class="download-item text-[9px] font-black uppercase bg-white/10 hover:bg-white text-white hover:text-[#0B0F1A] px-3 py-1.5 rounded-lg transition-all" data-id="${item.id}">İNDİR</button>
                        </div>
                    `}
                </div>
                <div class="flex items-center gap-2">
                    ${item.uploader ? `<span class="text-[9px] font-black text-white/40 uppercase tracking-widest">${item.uploader}</span>` : ''}
                    <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-black text-white">
                        ${item.uploader ? item.uploader.substring(0, 2).toUpperCase() : 'AT'}
                    </div>
                </div>
            </div>
        `;

        card.onclick = (e) => {
            const deleteBtn = e.target.closest('.delete-item');
            const previewBtn = e.target.closest('.preview-item');
            const downloadBtn = e.target.closest('.download-item');

            if (deleteBtn) return;

            if (isFolder) {
                if (item.is_private) {
                    const p = prompt(`${item.title} klasörü için şifre:`);
                    if (p !== item.password) return alert("Hatalı şifre!");
                }
                navigateDesktopHubTo(item.path);
            } else if (previewBtn) {
                handleOpenDesktopHubItem(item);
            } else if (downloadBtn) {
                handleDownloadDesktopHubItem(item);
            } else {
                handleOpenDesktopHubItem(item);
            }
        };

        container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
    updateDesktopHubStorageStats();
}

function updateDesktopHubStorageStats() {
    const stats = document.getElementById('hubDesktopStorageStats');
    if (stats) {
        const total = desktopHubItems.reduce((acc, i) => acc + (i.size || 0), 0);
        stats.innerText = `ALAN: ${formatDesktopHubSize(total)}`;
    }
}

async function handleOpenDesktopHubItem(item) {
    if (item.is_private) {
        const pass = prompt(`${item.title} için şifre:`);
        if (pass !== item.password) return alert("Hatalı!");
    }
    if (item.url) window.open(item.url, '_blank');
}

async function handleDownloadDesktopHubItem(item) {
    if (item.is_private) {
        const pass = prompt(`${item.title} dosyasını indirmek için şifre:`);
        if (pass !== item.password) return alert("Hatalı!");
    }

    if (!confirm(`${item.title} dosyasını indirmek istiyor musunuz?`)) return;

    try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.path.split('/').pop();
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) {
        console.error("İndirme hatası:", err);
        alert("Dosya indirilemedi!");
    }
}

function sanitizeDesktopHubFilename(str) {
    const map = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
    };
    let slug = str.replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m]);
    return slug.replace(/[^a-z0-9.]/gi, '_').replace(/_+/g, '_').toLowerCase();
}

async function uploadToHybridDesktop(item, file) {
    const isLarge = item.size >= MAX_DESKTOP_SUPABASE_SIZE;
    const storageType = isLarge ? 'github' : 'supabase';

    let uploadedUrl = '';
    let storagePath = '';

    const safeTitle = sanitizeDesktopHubFilename(item.title);
    const extension = file ? (file.name.lastIndexOf('.') !== -1 ? file.name.substring(file.name.lastIndexOf('.')) : '') : '.txt';
    const fileName = `${Date.now()}_${safeTitle}${extension}`;
    const targetDir = currentDesktopHubPath || '';
    storagePath = targetDir ? `${targetDir}/${fileName}` : fileName;

    if (storageType === 'supabase') {
        const res = await fetch(`${DESKTOP_HUB_CONFIG.storageUrl}/${storagePath}`, {
            method: 'POST',
            headers: {
                'apikey': DESKTOP_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${DESKTOP_HUB_CONFIG.apiKey}`,
                'Content-Type': file ? file.type : 'text/plain'
            },
            body: file || item.content
        });
        if (!res.ok) {
            const errorJson = await res.json().catch(() => ({}));
            throw new Error(`Supabase Storage hatası: ${errorJson.message || res.statusText || 'Bilinmeyen Hata'}`);
        }
        uploadedUrl = `https://znrlvhbuzmukznnfxpjy.supabase.co/storage/v1/object/public/hub_files/${storagePath}`;
    } else {
        // GitHub fallback - likely not configured but kept for logic consistency
        let content = '';
        if (file) {
            content = await new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
            });
        } else {
            content = btoa(unescape(encodeURIComponent(item.content)));
        }

        const res = await fetch(`https://api.github.com/repos/${DESKTOP_GITHUB_CONFIG.owner}/${DESKTOP_GITHUB_CONFIG.repo}/contents/${storagePath}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${DESKTOP_GITHUB_CONFIG.token}` },
            body: JSON.stringify({
                message: `Hybrid Upload: ${item.title}`,
                content: content,
                branch: DESKTOP_GITHUB_CONFIG.branch
            })
        });
        if (!res.ok) throw new Error("GitHub Upload hatası!");
        const data = await res.json();
        uploadedUrl = data.content.download_url;
    }

    const metaRes = await fetch(DESKTOP_HUB_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
            'apikey': DESKTOP_HUB_CONFIG.apiKey,
            'Authorization': `Bearer ${DESKTOP_HUB_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            title: item.title,
            type: item.type,
            storage_type: storageType,
            path: storagePath,
            size: item.size,
            is_private: item.is_private,
            password: item.password,
            uploader: item.uploader,
            parent_path: targetDir,
            url: uploadedUrl
        })
    });

    if (!metaRes.ok) {
        throw new Error(`Metadata kaydı başarısız`);
    }
    return await metaRes.json();
}

async function createHybridFolderDesktop(name, pass) {
    const targetDir = currentDesktopHubPath || '';
    const res = await fetch(DESKTOP_HUB_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
            'apikey': DESKTOP_HUB_CONFIG.apiKey,
            'Authorization': `Bearer ${DESKTOP_HUB_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            title: name,
            type: 'folder',
            storage_type: 'metadata',
            path: targetDir ? `${targetDir}/${name}` : name,
            size: 0,
            is_private: !!pass,
            password: pass || '',
            parent_path: targetDir
        })
    });
    if (!res.ok) throw new Error("Klasör oluşturulamadı!");
    await fetchAndSyncDesktopHubItems();
}

let desktopItemToMove = null;

async function moveDesktopHubItemToFolder(targetPath) {
    if (!desktopItemToMove) return;

    const res = await fetch(`${DESKTOP_HUB_CONFIG.baseUrl}?id=eq.${desktopItemToMove.id}`, {
        method: 'PATCH',
        headers: {
            'apikey': DESKTOP_HUB_CONFIG.apiKey,
            'Authorization': `Bearer ${DESKTOP_HUB_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            parent_path: targetPath
        })
    });

    if (!res.ok) throw new Error("Taşıma işlemi başarısız!");

    document.getElementById('hubDesktopMoveModal').classList.remove('active');
    await fetchAndSyncDesktopHubItems();
    alert(`"${desktopItemToMove.title}" başarıyla taşındı!`);
    desktopItemToMove = null;
}

function openDesktopHubMoveModal(item) {
    desktopItemToMove = item;
    document.getElementById('moveFileName').innerText = `"${item.title}"`;

    const folderList = document.getElementById('hubDesktopFolderList');
    const folders = desktopHubItems.filter(i => i.type === 'folder');

    if (folders.length === 0) {
        folderList.innerHTML = '<p class="text-white/20 text-xs text-center py-4">Henüz klasör yok</p>';
    } else {
        folderList.innerHTML = folders.map(f => `
            <button class="folder-select-btn w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center gap-3 transition-all" data-path="${f.path}">
                <i data-lucide="folder" class="w-5 h-5 text-yellow-400"></i>
                ${f.title}
            </button>
        `).join('');
    }

    document.getElementById('hubDesktopMoveModal').classList.add('active');
    if (window.lucide) lucide.createIcons();
}

async function deleteFromDesktopHub(item) {
    const metaRes = await fetch(`${DESKTOP_HUB_CONFIG.baseUrl}?id=eq.${item.id}`, {
        method: 'DELETE',
        headers: {
            'apikey': DESKTOP_HUB_CONFIG.apiKey,
            'Authorization': `Bearer ${DESKTOP_HUB_CONFIG.apiKey}`
        }
    });

    if (!metaRes.ok && metaRes.status !== 204) {
        throw new Error(`Kayıt silinemedi`);
    }

    if (item.storage_type === 'supabase' && item.path) {
        await fetch(`${DESKTOP_HUB_CONFIG.storageUrl}/${item.path}`, {
            method: 'DELETE',
            headers: {
                'apikey': DESKTOP_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${DESKTOP_HUB_CONFIG.apiKey}`
            }
        });
    }
}

// --- SYNC WITH SUPABASE ---
async function fetchAndSyncDesktopHubItems() {
    try {
        const res = await fetch(`${DESKTOP_HUB_CONFIG.baseUrl}?select=*&order=created_at.desc`, {
            headers: {
                'apikey': DESKTOP_HUB_CONFIG.apiKey,
                'Authorization': `Bearer ${DESKTOP_HUB_CONFIG.apiKey}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (res.ok) {
            desktopHubItems = await res.json();
            // Optional: localStorage logic if needed
            renderDesktopHubItems();
        } else {
            console.error("Desktop Hub Fetch failed:", res.status);
        }
    } catch (err) {
        console.error("Senkronizasyon hatası:", err);
    }
}

function initDesktopHub() {
    console.log("Initializing Desktop Hub...");

    // Bind Events
    const openAddBtn = document.getElementById('hubDesktopOpenAddModal');
    if (openAddBtn) openAddBtn.onclick = () => {
        const pathText = currentDesktopHubPath ? currentDesktopHubPath.split('/').pop() : 'Ana Dizin';
        document.getElementById('uploadPathText').innerText = currentDesktopHubPath ? `📁 ${pathText}` : 'Ana Dizin';
        document.getElementById('hubDesktopAddModal').classList.add('active');
        if (window.lucide) lucide.createIcons();
    };

    const openFolderBtn = document.getElementById('hubDesktopOpenFolderModal');
    if (openFolderBtn) openFolderBtn.onclick = () => document.getElementById('hubDesktopFolderModal').classList.add('active');

    document.querySelectorAll('.hub-desktop-close-modal').forEach(btn => {
        btn.onclick = () => document.querySelectorAll('.hub-desktop-modal-overlay').forEach(m => m.classList.remove('active'));
    });

    // Tab switching
    const tabNote = document.getElementById('hubDesktopTabNote');
    const tabFile = document.getElementById('hubDesktopTabFile');
    if (tabNote && tabFile) {
        tabNote.onclick = () => {
            tabNote.className = "flex-1 flex items-center justify-center gap-2 p-5 rounded-2xl border-2 border-white bg-white/20 text-white font-black text-[10px] uppercase";
            tabFile.className = "flex-1 flex items-center justify-center gap-2 p-5 rounded-2xl border-2 border-transparent bg-white/10 text-white/40 font-black text-[10px] uppercase";
            document.getElementById('hubDesktopFileZone').classList.add('hidden');
            document.getElementById('hubDesktopItemContent').classList.remove('hidden');
            document.getElementById('hubDesktopItemTitle').dataset.type = 'note';
        };

        tabFile.onclick = () => {
            tabFile.className = "flex-1 flex items-center justify-center gap-2 p-5 rounded-2xl border-2 border-white bg-white/20 text-white font-black text-[10px] uppercase";
            tabNote.className = "flex-1 flex items-center justify-center gap-2 p-5 rounded-2xl border-2 border-transparent bg-white/10 text-white/40 font-black text-[10px] uppercase";
            document.getElementById('hubDesktopFileZone').classList.remove('hidden');
            document.getElementById('hubDesktopItemContent').classList.add('hidden');
            document.getElementById('hubDesktopItemTitle').dataset.type = 'file';
        };
    }

    const fileZone = document.getElementById('hubDesktopFileZone');
    const fileInput = document.getElementById('hubDesktopFileInput');
    if (fileZone && fileInput) {
        fileZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if (e.target.files[0]) {
                document.getElementById('hubDesktopFileNameDisplay').innerText = e.target.files[0].name;
                const titleInput = document.getElementById('hubDesktopItemTitle');
                if (!titleInput.value) titleInput.value = e.target.files[0].name.split('.')[0];
            }
        };
    }

    const submitShare = document.getElementById('hubDesktopSubmitShare');
    if (submitShare) submitShare.onclick = async () => {
        const title = document.getElementById('hubDesktopItemTitle').value;
        const uploader = document.getElementById('hubDesktopItemUploader').value;
        const type = document.getElementById('hubDesktopItemTitle').dataset.type || 'file';
        const pass = document.getElementById('hubDesktopItemPassword').value;
        const file = document.getElementById('hubDesktopFileInput').files[0];
        const content = document.getElementById('hubDesktopItemContent').value;

        if (!title) return alert("İsim girin!");
        if (type === 'file' && !file) return alert("Dosya seçin!");

        document.getElementById('hubDesktopUploadLoader').classList.remove('hidden');

        try {
            const itemData = {
                title: title,
                type: file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'note',
                is_private: pass.length >= 3,
                password: pass,
                uploader: uploader,
                size: file ? file.size : new Blob([content]).size,
                content: content
            };

            await uploadToHybridDesktop(itemData, file);
            await fetchAndSyncDesktopHubItems();
            document.getElementById('hubDesktopAddModal').classList.remove('active');

            // Reset
            document.getElementById('hubDesktopItemTitle').value = '';
            document.getElementById('hubDesktopItemUploader').value = '';
            document.getElementById('hubDesktopItemContent').value = '';
            document.getElementById('hubDesktopItemPassword').value = '';
            document.getElementById('hubDesktopFileInput').value = '';
            document.getElementById('hubDesktopFileNameDisplay').innerText = 'Dosya Seçiniz';
        } catch (err) {
            alert("Hata: " + err.message);
        } finally {
            document.getElementById('hubDesktopUploadLoader').classList.add('hidden');
        }
    };

    // Folder creation
    const createFolderSubmit = document.getElementById('hubDesktopCreateFolderSubmit');
    if (createFolderSubmit) createFolderSubmit.onclick = async () => {
        const name = document.getElementById('hubDesktopFolderNameInput').value;
        const pass = document.getElementById('hubDesktopFolderPasswordInput').value;
        if (!name) return alert("Klasör adı girin!");

        document.getElementById('hubDesktopStatusAlert').classList.remove('hidden');
        document.getElementById('hubDesktopStatusText').innerText = "KLASÖR OLUŞTURULUYOR...";

        try {
            await createHybridFolderDesktop(name, pass);
            document.getElementById('hubDesktopFolderModal').classList.remove('active');
            document.getElementById('hubDesktopFolderNameInput').value = '';
            document.getElementById('hubDesktopFolderPasswordInput').value = '';
        } catch (err) {
            alert(err.message);
        } finally {
            document.getElementById('hubDesktopStatusAlert').classList.add('hidden');
        }
    };

    // Filter Buttons
    document.querySelectorAll('.hub-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.hub-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeDesktopHubFilter = btn.dataset.filter;
            renderDesktopHubItems();
        };
    });

    // Search
    const searchInput = document.getElementById('hubDesktopSearchInput');
    if (searchInput) searchInput.oninput = (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (val === 'yönetici' || val === 'yönetiici') {
            const pass = prompt("Yönetici Şifresi:");
            if (pass === "829615") {
                isDesktopHubAdminMode = true;
                e.target.value = '';
                alert("Yönetici Modu Aktif!");
                renderDesktopHubItems();
            } else {
                if (pass !== null) alert("Hatalı Şifre!");
                e.target.value = '';
            }
            return;
        }
        renderDesktopHubItems();
    };

    // Drag and Drop (Global scope listeners needs care, maybe scope to container?)
    // Basic implementation for now
    let draggedDesktopItemId = null;
    const fileGrid = document.getElementById('hubDesktopFileGrid');
    if (fileGrid) {
        fileGrid.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.file-card');
            if (card && card.draggable) {
                draggedDesktopItemId = card.dataset.itemId;
                desktopItemToMove = desktopHubItems.find(i => i.id == draggedDesktopItemId);
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', draggedDesktopItemId);
            }
        });

        fileGrid.addEventListener('dragend', (e) => {
            const card = e.target.closest('.file-card');
            if (card) card.classList.remove('dragging');
            document.querySelectorAll('.drop-zone-active').forEach(el => el.classList.remove('drop-zone-active'));
        });

        fileGrid.addEventListener('dragover', (e) => {
            const dropZone = e.target.closest('[data-drop-zone="true"]');
            if (dropZone && draggedDesktopItemId) {
                e.preventDefault();
                dropZone.classList.add('drop-zone-active');
            }
        });

        fileGrid.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('[data-drop-zone="true"]');
            if (dropZone) dropZone.classList.remove('drop-zone-active');
        });

        fileGrid.addEventListener('drop', async (e) => {
            const dropZone = e.target.closest('[data-drop-zone="true"]');
            if (dropZone && draggedDesktopItemId && desktopItemToMove) {
                e.preventDefault();
                dropZone.classList.remove('drop-zone-active');
                const targetPath = dropZone.dataset.folderPath;
                const folderTitle = dropZone.dataset.folderTitle;

                if (confirm(`"${desktopItemToMove.title}" dosyasını "${folderTitle}" klasörüne taşımak istiyor musunuz?`)) {
                    try {
                        await moveDesktopHubItemToFolder(targetPath);
                    } catch (err) {
                        alert("Taşıma hatası: " + err.message);
                    }
                }
            }
            draggedDesktopItemId = null;
        });

        // Click handling for delete/move
        fileGrid.addEventListener('click', async (e) => {
            const delBtn = e.target.closest('.delete-item');
            if (delBtn) {
                const id = delBtn.dataset.id;
                const item = desktopHubItems.find(i => i.id == id);
                if (!item) return;
                if (!confirm(`"${item.title}" silinsin mi?`)) return;
                try {
                    await deleteFromDesktopHub(item);
                    await new Promise(r => setTimeout(r, 500));
                    await fetchAndSyncDesktopHubItems();
                    alert("Silindi!");
                } catch (err) {
                    alert("Hata: " + err.message);
                }
            }

            const moveBtn = e.target.closest('.move-item');
            if (moveBtn) {
                e.preventDefault();
                e.stopPropagation();
                const id = moveBtn.dataset.id;
                const item = desktopHubItems.find(i => i.id == id);
                if (item) openDesktopHubMoveModal(item);
            }
        });
    }

    // Initial Fetch
    fetchAndSyncDesktopHubItems();
    if (window.lucide) lucide.createIcons();
    renderDesktopHubBreadcrumbs();
}

window.initDesktopHub = initDesktopHub;
