/* --- 修改開始：cloud_sync.js (登出/離開防呆與安全同步邏輯) --- */

// ======================================================================
// 數學繪圖編輯器 - 雲端同步引擎 (v3 - 安全同步與防呆提示)
// ======================================================================

const CLIENT_ID = '431747377367-th1rf0oq6bomupdrkn5bk7es58hfo2jn.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

let tokenClient;
let accessToken = null;
let isGapiLoaded = false;
let isGisLoaded = false;

let cloudSyncState = 'offline'; 
let cloudFileId = null;

window.getValidAccessToken = function() {
    return accessToken;
};

// ==========================================
// 1. API 初始化與登入授權
// ==========================================
window.gapiLoaded = function() {
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs:['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        isGapiLoaded = true;
    });
};

window.gisLoaded = function() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error !== undefined) {
                showAlert("Google 登入失敗：" + resp.error);
                throw (resp);
            }
            accessToken = resp.access_token;
            window.accessToken = resp.access_token;
            await handleLoginSuccess();
        },
    });
    isGisLoaded = true;
};

window.handleCloudSyncClick = async function() {
    if (!isGapiLoaded || !isGisLoaded) {
        showAlert("Google 服務尚未載入完成，請稍候再試。");
        return;
    }

    if (cloudSyncState === 'offline') {
        tokenClient.requestAccessToken();
    } else {
        const menu = document.getElementById('cloud-sync-menu');
        if (menu) {
            if (typeof closeAllMenus === 'function') closeAllMenus(); 
            const isVisible = menu.style.display === 'flex';
            menu.style.display = isVisible ? 'none' : 'flex';
        }
    }
};

function updateCloudUI(state, text = "") {
    cloudSyncState = state;
    const btn = document.getElementById('btn-cloud-sync');
    const span = document.getElementById('cloud-sync-text');
    const inboxBtn = document.getElementById('btn-inbox');
    const commContainer = document.getElementById('cloud-comm-container'); // 取得新的容器 ID
	
    if (!btn || !span) return;

    if (state === 'offline') {
        btn.style.backgroundColor = '#95a5a6';
        span.innerText = '⚪ 登入 Google'; // 修改按鈕文字
        btn.title = "登入 Google 帳號以啟用雲端同步與社群功能"; // 修改滑鼠提示
        if (inboxBtn) inboxBtn.style.display = 'none';
		if (commContainer) commContainer.style.display = 'none';
		
    } else {
        if (inboxBtn) inboxBtn.style.display = 'block';
		if (commContainer) commContainer.style.display = 'inline-block';
        
        if (state === 'synced') {
            btn.style.backgroundColor = '#27ae60';
            span.innerText = '🟢 已同步';
            btn.title = "雲端與本機已同步 (點擊開啟選單)";
        } else if (state === 'dirty') {
            btn.style.backgroundColor = '#f39c12';
            span.innerText = '🟡 尚未同步'; 
            btn.title = "本機有變更，點擊開啟同步選單";
        } else if (state === 'syncing') {
            btn.style.backgroundColor = '#3498db';
            span.innerText = text || '🔄 處理中...';
            btn.title = "正在與雲端通訊中...";
        }
    }
}

window.confirmForceUpload = function() {
    showConfirm("⚠️ 危險警告：這將把【目前的本機資料】強制覆蓋到雲端！\n\n如果您在雲端上原本有舊檔案，將會被完全捨棄遺失。\n強烈建議您優先使用「智慧雙向同步」。\n\n確定要強制覆蓋嗎？", async () => {
        await uploadLocalToCloud();
    });
};

window.handleCloudLogout = function() {
    // 登出前先跳出確認對話框
    showConfirm("確定要登出 Google 帳號嗎？", () => {
        // 使用者確認登出後，再檢查是否需要同步
        if (cloudSyncState === 'dirty') {
            showConfirm("您還有未同步的本機變更，登出前是否要先同步至雲端？", 
                async () => { // [確認] -> 同步後再登出
                    await syncAllData();
                    performLogout();
                }, 
                () => { // [取消] -> 直接登出
                    performLogout();
                }
            );
        } else {
            // 如果已同步，直接登出
            performLogout();
        }
    }); // 如果使用者在第一個確認框按取消，則什麼都不做
};

function performLogout() {
    const displayEl = document.getElementById('user-profile-display');
    if (displayEl) {
        displayEl.style.display = 'none';
        displayEl.innerHTML = '';
    }	
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
			window.accessToken = null;
            cloudFileId = null;
            updateCloudUI('offline');
            if (typeof statusText !== 'undefined') statusText.innerText = "已登出 Google 雲端同步";
        });
    } else {
        updateCloudUI('offline');
    }
}

// 監聽關閉/重整網頁事件
window.addEventListener('beforeunload', function (e) {
    if (cloudSyncState === 'dirty') {
        e.preventDefault();
        e.returnValue = '您有尚未同步的變更，確定要離開嗎？';
    }
});

window.addEventListener('click', (e) => {
    const menu = document.getElementById('cloud-sync-menu');
    const btn = document.getElementById('btn-cloud-sync');
    if (menu && menu.style.display === 'flex') {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.style.display = 'none';
        }
    }
});

window.markLocalAsDirty = function() {
    if (cloudSyncState === 'synced') {
        updateCloudUI('dirty');
    }
};

// ==========================================
// 2. 登入後的檢查與雙向同步邏輯
// ==========================================

async function handleLoginSuccess() {
    updateCloudUI('syncing', '🔄 檢查雲端...');
    if(typeof statusText !== 'undefined') statusText.innerText = "成功連接 Google，正在檢查雲端狀態...";

    try {
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (userResponse.ok) {
            const profile = await userResponse.json();
            const displayEl = document.getElementById('user-profile-display');
            if (displayEl) {
                displayEl.innerHTML = `
                    <div style="width:24px; height:24px; border-radius:50%; background:#f1c40f; display:flex; align-items:center; justify-content:center; color:#2c3e50; font-size:12px;">
                        ${(profile.name || 'U')[0].toUpperCase()}
                    </div>
                    <span style="color: #ffffff;">${profile.name || profile.email}</span>
                `;
                displayEl.style.display = 'flex';
            }
        }
    } catch(e) { console.warn("無法取得使用者名稱"); }

    // 【關鍵修正 1】：強制先取得 Firebase 驗證，否則去抓訊息會失敗！
    if (typeof window.ensureLogin === 'function') {
        try { await window.ensureLogin(); } catch(e) { console.warn("Firebase 登入異常", e); }
    }

    // 獨立檢查新訊息的函式
    const checkNewItems = async () => {
        if (typeof window.fetchCloudNotifications === 'function') await window.fetchCloudNotifications();
        if (typeof window.updateInboxBadge === 'function') await window.updateInboxBadge();
        checkPendingShare();
    };

    // 【關鍵修正 2】：不論雲端備份狀況如何，登入成功就立刻抓取最新訊息並更新 Badge！
    await checkNewItems();

    try {
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            q: "name='math_editor_sync.bundle'",
            fields: 'files(id, modifiedTime, size)'
        });

        const files = response.result.files;
        
        if (files && files.length > 0) {
            cloudFileId = files[0].id;
            const modifiedTime = new Date(files[0].modifiedTime).toLocaleString();
            
            openExclusiveOptionsModal(
                `🎉 登入成功！發現雲端備份檔 (時間：${modifiedTime})`,[
                    { label: "✅ 是，立即雙向同步 (推薦)", checked: true },
                    { label: "❌ 否，暫不處理", checked: false }
                ],
                async (results) => {
                    if (results === null || results[1]) {
                        updateCloudUI('dirty'); 
                        if(typeof statusText !== 'undefined') statusText.innerText = "已取消同步。";
                        return;
                    }

                    if (results[0]) {
                        await syncAllData();
                    }
                }
            );
        } else {
            // 雲端沒有備份檔，執行首次上傳
            await uploadLocalToCloud();
        }
    } catch (err) {
        console.error(err);
        showAlert("讀取雲端狀態失敗：" + err.message);
        updateCloudUI('offline');
    }
}

// 一鍵式雙向同步
async function syncAllData() {
    updateCloudUI('syncing', '🔄 同步中 (1/2)');
    await downloadAndApplyFromCloud(false);

    updateCloudUI('syncing', '🔄 同步中 (2/2)');
    await uploadLocalToCloud();

    checkPendingShare();
}

function checkPendingShare() {
    const pendingShareId = sessionStorage.getItem('pendingShareId');
    if (pendingShareId) {
        sessionStorage.removeItem('pendingShareId');
        if (typeof receiveShareLink === 'function') {
            receiveShareLink(pendingShareId);
        }
    }
}

async function checkAndDownloadFromCloud(forcePrompt = false) {
    if (!cloudFileId) return;
    if (forcePrompt) {
        showConfirm("確定要執行【雙向同步】嗎？\n\n1. 會先將雲端資料合併至本機。\n2. 再將合併後的結果上傳回雲端。", async () => {
            await syncAllData();
        });
    } else {
        await syncAllData();
    }
}

// ==========================================
// 3. 資料打包與解包 (Pack / Unpack)
// ==========================================
async function packLocalData() {
    const favorites = await db.favorites.toArray();
    const categories = await db.categories.toArray();
    const questions = await db.questions.toArray();
    let inbox =[]; 
    try { 
        inbox = await db.inbox.toArray(); 
        inbox = inbox.filter(item => item.type !== 'notification');
    } catch(e) {}
    
    const localSettings = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 【核心修正】：排除大廳暫存(cache)，但 *保留* 貼文已讀紀錄 (read_posts) 讓它上傳！
        if (key && key.startsWith('math_editor_') && !key.startsWith('math_editor_cache_')) {
            localSettings[key] = localStorage.getItem(key);
        }
    }

    return {
        timestamp: Date.now(),
        dexie: { favorites, categories, questions, inbox },
        localSettings: localSettings
    };
}

async function unpackAndApplyData(bundle) {
    if (!bundle || !bundle.dexie) throw new Error("備份檔損毀或格式錯誤");

    await db.transaction('rw', db.favorites, db.categories, db.questions, db.inbox, async () => {
        if (bundle.dexie.categories) {
            const existingCats = await db.categories.toArray();
            for (let cat of bundle.dexie.categories) {
                if (!existingCats.some(c => c.name === cat.name)) {
                    delete cat.id; await db.categories.add(cat);
                }
            }
        }
        if (bundle.dexie.favorites) {
            const existingFavs = await db.favorites.toArray();
            for (let item of bundle.dexie.favorites) {
                if (!existingFavs.some(e => e.name === item.name && e.category === item.category)) {
                    delete item.id; await db.favorites.add(item);
                }
            }
        }
        if (bundle.dexie.questions) {
            const existingQs = await db.questions.toArray();
            for (let item of bundle.dexie.questions) {
                if (!existingQs.some(e => e.title === item.title && e.category === item.category)) {
                    delete item.id; await db.questions.add(item);
                }
            }
        }
        if (bundle.dexie.inbox) {
            const existingInbox = await db.inbox.toArray();
            for (let item of bundle.dexie.inbox) {
                if (item.type === 'notification') continue;
                if (!existingInbox.some(e => e.shareId === item.shareId)) {
                    delete item.id; await db.inbox.add(item);
                }
            }
        }
        if(typeof ensureDefaultCategories === 'function') await ensureDefaultCategories();
    });

    if (bundle.localSettings) {
        for (const [key, value] of Object.entries(bundle.localSettings)) {
            // 【核心修正】：下載還原時，忽略雲端暫存(cache)，但 *寫入* 已讀紀錄
            if (key.startsWith('math_editor_cache_')) {
                continue;
            }

            if (key === 'math_editor_system_settings') {
                try {
                    const cloudSys = JSON.parse(value);
                    const localSysStr = localStorage.getItem(key);
                    
                    if (localSysStr) {
                        const localSys = JSON.parse(localSysStr);
                        
                        cloudSys.defaultStroke = localSys.defaultStroke || cloudSys.defaultStroke;
                        cloudSys.defaultFill = localSys.defaultFill || cloudSys.defaultFill;
                        cloudSys.defaultStrokeWidth = localSys.defaultStrokeWidth || cloudSys.defaultStrokeWidth;
                        cloudSys.defaultLineStyle = localSys.defaultLineStyle || cloudSys.defaultLineStyle;
                        cloudSys.defaultFillStyle = localSys.defaultFillStyle || cloudSys.defaultFillStyle;
                        
                        if (localSys.autoLabel !== undefined) cloudSys.autoLabel = localSys.autoLabel;
                        if (localSys.autoAngleLabel !== undefined) cloudSys.autoAngleLabel = localSys.autoAngleLabel;

                        const mergedMarks =[...(localSys.customMarks || [])];
                        (cloudSys.customMarks ||[]).forEach(cloudMark => {
                            if (!mergedMarks.some(localMark => localMark.symbol === cloudMark.symbol)) {
                                mergedMarks.push(cloudMark);
                            }
                        });
                        cloudSys.customMarks = mergedMarks;

                        const mergedColors =[...new Set([...(localSys.customColors || []), ...(cloudSys.customColors ||[])])];
                        cloudSys.customColors = mergedColors;
                        
                        localStorage.setItem(key, JSON.stringify(cloudSys));

                    } else {
                        localStorage.setItem(key, JSON.stringify(cloudSys));
                    }

                } catch (e) {
                    console.error("Error merging system settings:", e);
                    localStorage.setItem(key, value);
                }
            } else {
                localStorage.setItem(key, value);
            }
        }
    }

    if(typeof loadSystemSettings === 'function') loadSystemSettings();
    if(typeof renderCategories === 'function') renderCategories();
    if(typeof renderQBCategories === 'function') renderQBCategories();
    if(typeof updateInboxBadge === 'function') updateInboxBadge();
	if(typeof window.updateCloudUnreadBadges === 'function') window.updateCloudUnreadBadges();
}

// ==========================================
// 4. Drive API 核心上傳與下載
// ==========================================
async function uploadLocalToCloud() {
    updateCloudUI('syncing', '⬆️ 上傳中...');
    if(typeof statusText !== 'undefined') statusText.innerText = "正在打包資料並上傳至雲端...";

    try {
        const bundle = await packLocalData();
        const fileContent = JSON.stringify(bundle);
        const file = new Blob([fileContent], {type: 'application/json'});

        let metadata = { 'name': 'math_editor_sync.bundle', 'mimeType': 'application/json' };
        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (cloudFileId) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${cloudFileId}?uploadType=multipart`;
            method = 'PATCH';
        } else {
            metadata.parents =['appDataFolder'];
        }

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const res = await fetch(url, {
            method: method,
            headers: { 'Authorization': 'Bearer ' + accessToken },
            body: form
        });

        const result = await res.json();
        if (result.error) throw new Error(result.error.message);

        cloudFileId = result.id; 
        updateCloudUI('synced');
        if(typeof statusText !== 'undefined') statusText.innerText = "✅ 已成功備份至 Google 雲端";

    } catch (err) {
        console.error(err);
        showAlert("上傳失敗：" + err.message);
        updateCloudUI('dirty'); 
    }
}

window.autoSyncToCloud = async function() {
    if (cloudSyncState === 'offline' || !accessToken) return;
    // 若已在同步中，避免重複觸發
    if (cloudSyncState === 'syncing') return;
    
    updateCloudUI('syncing', '⬆️ 背景同步中...');
    
    try {
        const bundle = await packLocalData();
        const file = new Blob([JSON.stringify(bundle)], {type: 'application/json'});
        let metadata = { 'name': 'math_editor_sync.bundle', 'mimeType': 'application/json' };
        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (cloudFileId) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${cloudFileId}?uploadType=multipart`;
            method = 'PATCH';
        } else {
            metadata.parents =['appDataFolder'];
        }

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const res = await fetch(url, { method: method, headers: { 'Authorization': 'Bearer ' + accessToken }, body: form });
        const result = await res.json();
        if (result.error) throw new Error(result.error.message);

        cloudFileId = result.id; 
        updateCloudUI('synced'); // 同步完成，黃燈變綠燈！
    } catch (err) {
        updateCloudUI('dirty'); 
    }
};

async function downloadAndApplyFromCloud(showSuccessAlert = true) {
    if (!cloudFileId) return;
    updateCloudUI('syncing', '⬇️ 合併中...');
    if(typeof statusText !== 'undefined') statusText.innerText = "正在從雲端下載並合併資料...";

    try {
        const res = await gapi.client.drive.files.get({
            fileId: cloudFileId,
            alt: 'media'
        });

        const bundle = res.result;
        await unpackAndApplyData(bundle);
        
        updateCloudUI('dirty');
        
        if(showSuccessAlert) {
            showAlert("✅ 雲端資料已成功合併至本機！");
        }
        if(typeof statusText !== 'undefined') statusText.innerText = "✅ 下載與合併完成，請點擊黃色按鈕上傳同步。";

    } catch (err) {
        console.error(err);
        showAlert("下載/合併失敗：" + (err.message || "可能是網路問題"));
        updateCloudUI('dirty');
    }
}

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    // 【核心修正】：排除 cache 觸發黃燈。已讀紀錄 (read_posts) 由於會自動背景同步，所以也不用觸發黃燈干擾使用者
    if (key.startsWith('math_editor_') && 
        !key.startsWith('math_editor_cache_') && 
        !key.startsWith('math_editor_read_posts_') && 
        typeof window.markLocalAsDirty === 'function') {
        window.markLocalAsDirty();
    }
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
    originalRemoveItem.apply(this, arguments);
    if (key.startsWith('math_editor_') && 
        !key.startsWith('math_editor_cache_') && 
        !key.startsWith('math_editor_read_posts_') && 
        typeof window.markLocalAsDirty === 'function') {
        window.markLocalAsDirty();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof db !== 'undefined') {
            const tables =[db.favorites, db.categories, db.questions];
            tables.forEach(table => {
                if(table) {
                    table.hook("creating", () => { window.markLocalAsDirty(); });
                    table.hook("updating", () => { window.markLocalAsDirty(); });
                    table.hook("deleting", () => { window.markLocalAsDirty(); });
                }
            });
        }
    }, 500);
});