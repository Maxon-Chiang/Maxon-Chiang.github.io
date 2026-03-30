/* --- START: 雲端分享與訊息匣系統 --- */

// 設定您的 Cloud API 基礎路徑
const SHARE_API_BASE_URL = "https://gemini-math-431747377367.asia-east1.run.app/share";

// 1. 綁定按鈕狀態更新
const origUpdateLibUI = window.updateLibraryBatchUI;
window.updateLibraryBatchUI = function() {
    if(origUpdateLibUI) origUpdateLibUI();
    const btnShare = document.getElementById('btn-batch-share');
    if(btnShare) btnShare.disabled = (selectedLibraryIds.size === 0);
};

const origUpdateQBUI = window.updateQBBatchUI;
window.updateQBBatchUI = function() {
    if(origUpdateQBUI) origUpdateQBUI();
    const btnShare = document.getElementById('qb-btn-share');
    if(btnShare) btnShare.disabled = (selectedQBIds.size === 0);
};

// 2. 產生分享連結 (上傳)
window.batchShareItems = async function(type) {
    if (cloudSyncState === 'offline' || !accessToken) {
        showAlert("請先登入 Google 帳號才能使用分享功能。");
        return;
    }

    let items = [];
    if (type === 'library') {
        items = await db.favorites.where('id').anyOf(Array.from(selectedLibraryIds)).toArray();
    } else {
        items = await db.questions.where('id').anyOf(Array.from(selectedQBIds)).toArray();
    }
    if (items.length === 0) return;

    // 重置對話框 UI
    const modal = document.getElementById('share-modal');
    document.getElementById('share-description-input').value = '';
    document.getElementById('share-step-result').style.display = 'none';
    document.getElementById('btn-generate-link').disabled = false;
    document.getElementById('btn-generate-link').innerText = "✨ 產生分享連結";
    modal.style.display = 'flex';

    // 點擊產生連結按鈕
    document.getElementById('btn-generate-link').onclick = async function() {
        const description = document.getElementById('share-description-input').value.trim();
        const btn = this;
        
        btn.disabled = true;
        btn.innerText = "⏳ 處理中...";

        try {
            // 取得使用者資訊
            const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!userResponse.ok) throw new Error("無法取得使用者資訊");
            const profile = await userResponse.json();
            const providerName = profile.name || "使用者";
            const providerEmail = profile.email || "";

            const exportData = {
                type: type === 'library' ? "MathEditor_Library_Backup" : "MathEditor_Questions_Backup",
                version: "2.1",
                timestamp: Date.now(),
                items: items.map(i => { const clone = { ...i }; delete clone.id; return clone; })
            };

            // 上傳到 Cloud Function
            const response = await fetch(SHARE_API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: type === 'library' ? `分享的圖庫素材 (${items.length}件)` : `分享的數學題目 (${items.length}件)`,
                    type: type,
                    providerName: providerName,
                    providerEmail: providerEmail,
                    description: description,
                    payload: exportData
                })
            });

            if (!response.ok) throw new Error("伺服器回應錯誤");
            const result = await response.json();
            
            // 顯示結果
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('share', result.shareId);
            
            document.getElementById('share-link-input').value = currentUrl.toString();
            document.getElementById('share-step-result').style.display = 'block';
            btn.innerText = "✅ 連結已產生";
            statusText.innerText = "分享連結已產生";

        } catch (err) {
            console.error(err);
            showAlert("產生分享連結失敗：" + err.message);
            btn.disabled = false;
            btn.innerText = "✨ 再次嘗試產生";
        }
    };
};

window.copyShareLink = function() {
    const input = document.getElementById('share-link-input');
    const msg = document.getElementById('copy-status-msg');
    input.select();
    document.execCommand('copy');
    
    // 顯示兩秒提示
    msg.style.opacity = '1';
    setTimeout(() => {
        msg.style.opacity = '0';
    }, 2000);
};

// 3. 處理網址列中的分享連結 (接收)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId) {
        // 移除網址參數保持乾淨
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 【核心修改】檢查是否登入
        if (cloudSyncState === 'offline') {
            // 未登入：暫存 ID，並引導登入
            sessionStorage.setItem('pendingShareId', shareId);
            showConfirm("📦 偵測到分享給您的數學素材包！\n\n為了確保資料能永久保存至您的雲端訊息匣中，請先點擊「確定」登入 Google 帳號。", () => {
                // 觸發登入
                if (typeof tokenClient !== 'undefined') {
                    tokenClient.requestAccessToken();
                } else {
                    showAlert("Google 服務尚未準備好，請稍後再按上方按鈕手動登入。");
                }
            }, () => {
                sessionStorage.removeItem('pendingShareId');
            });
        } else {
            // 已登入：直接接收
            receiveShareLink(shareId);
        }
    }

    // 啟動時更新一次 Badge
    if (typeof updateInboxBadge === 'function') updateInboxBadge();
});

async function receiveShareLink(shareId) {
    if(typeof statusText !== 'undefined') statusText.innerText = "⏳ 正在從雲端下載分享內容...";
    
    try {
        const exist = await db.inbox.where('shareId').equals(shareId).count();
        if (exist > 0) {
            showAlert("此分享內容已經在您的訊息匣中了！");
            openInboxModal();
            return;
        }

        const response = await fetch(`${SHARE_API_BASE_URL}/${shareId}`);
        if (!response.ok) throw new Error("連結已失效或伺服器錯誤");

        const result = await response.json();
        const data = result.data; // 這裡包含 payload, description, providerName 等

        // 【關鍵修正】將所有元數據一起存入本地 inbox
        await db.inbox.add({
            shareId: shareId,
            title: data.title,
            type: data.type,
            providerName: data.providerName || "匿名",
            providerEmail: data.providerEmail || "",
            description: data.description || "", // 確保說明文字被存入
            timestamp: Date.now(),
            isDownloaded: false,
            payload: data.payload
        });

        if(typeof statusText !== 'undefined') statusText.innerText = "✅ 分享內容已成功收進訊息匣！";
        updateInboxBadge();
        if (typeof window.markLocalAsDirty === 'function') window.markLocalAsDirty();

        openInboxModal();

    } catch (err) {
        console.error(err);
        showAlert("接收分享失敗：" + err.message);
    }
}

window.refreshInbox = async function() {
    const btn = document.getElementById('btn-refresh-inbox');
    if (btn) {
        btn.innerText = "⏳ 整理中...";
        btn.disabled = true;
    }
    
    // 確保使用者登入設定已初始化，才能正確抓取 Firestore 通知
    if (typeof window.ensureLogin === 'function') {
        try {
            await window.ensureLogin();
        } catch(e) {
            console.warn("取得登入身分失敗", e);
        }
    }

    // 等待雲端通知抓取完畢
    if (typeof window.fetchCloudNotifications === 'function') {
        await window.fetchCloudNotifications();
    }
    
    await openInboxModal(); // 重新繪製清單
    
    if (btn) {
        btn.innerText = "🔄 重新整理";
        btn.disabled = false;
    }
};

window.openInboxModal = async function() {
    const modal = document.getElementById('inbox-modal');
    const list = document.getElementById('inbox-list');
    modal.style.display = 'flex';
    
    list.innerHTML = `<div style="text-align:center; padding:40px; color:#999;">⏳ 正在檢查雲端新訊息...</div>`;
    
    if (typeof window.ensureLogin === 'function') {
        try { await window.ensureLogin(); } catch(e) { console.warn(e); }
    }
    if (typeof window.fetchCloudNotifications === 'function') {
        await window.fetchCloudNotifications();
    }
    
    const inboxItems = await db.inbox.reverse().toArray();
    if (inboxItems.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:40px; color:#999;">📭 訊息匣目前是空的</div>`;
        return;
    }

    list.innerHTML = '';
    inboxItems.forEach(item => {
        const dateStr = new Date(item.timestamp).toLocaleString();
        const isNotification = item.type === 'notification';
        
        // 嚴格判斷未讀狀態 (未讀=白色底帶藍邊，已讀=灰色底)
        const bgStyle = item.isDownloaded ? 'background:#fdfdfd; border:1px solid #eee;' : 'background:#fff; border:1px solid #3498db; border-left: 5px solid #3498db;';
        const unreadBadge = item.isDownloaded ? '' : '<span style="background:#e74c3c; color:white; padding:2px 6px; border-radius:10px; font-size:10px; margin-left:8px; vertical-align:middle;">新</span>';

        const div = document.createElement('div');
        div.style.cssText = `${bgStyle} padding:12px 15px; border-radius:6px; margin-bottom:5px; box-shadow:0 2px 5px rgba(0,0,0,0.05);`;

        // 狀態切換與刪除按鈕 (共用)
        let readToggleBtn = item.isDownloaded
            ? `<button onclick="toggleInboxItemReadState(${item.id}, false)" title="標為未讀" style="padding:6px 10px; background:#95a5a6; color:white; border:none; border-radius:4px; cursor:pointer; font-size:14px;">✉️</button>`
            : `<button onclick="toggleInboxItemReadState(${item.id}, true)" title="標為已讀" style="padding:6px 10px; background:#27ae60; color:white; border:none; border-radius:4px; cursor:pointer; font-size:14px;">✔️</button>`;
        
        let delBtn = `<button onclick="deleteInboxItem(${item.id})" title="刪除" style="padding:6px 10px; background:white; color:#c0392b; border:1px solid #f5b7b1; border-radius:4px; cursor:pointer; font-size:14px;">🗑️</button>`;

        if (isNotification) {
            let viewBtnHtml = '';
            if (item.postId) {
                viewBtnHtml = `<button onclick="openGalleryPost('${item.postId}', ${item.id})" title="檢視發文" style="padding:6px 10px; background:#f1c40f; color:#333; border:none; border-radius:4px; cursor:pointer; font-size:14px;">🔍</button>`;
            }

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="flex:1; padding-right: 15px;">
                        <div style="font-weight:bold; font-size:15px; color:#2c3e50; margin-bottom:4px;">${item.title} ${unreadBadge}</div>
                        <div style="font-size:12px; color:#7f8c8d; margin-bottom:8px;">
                            👤 來源：<span style="color:#333; font-weight:bold;">${item.providerName}</span> 
                            <span style="margin:0 8px; color:#ddd;">|</span> 
                            🕒 時間：${dateStr}
                        </div>
                        <div style="background:#f8f9fa; border:1px solid #eef0f2; padding:8px 12px; border-radius:4px; font-size:13px; color:#333; line-height:1.5; white-space:pre-wrap;">${item.description}</div>
                    </div>
                    <div style="display:flex; flex-direction:row; gap:5px; align-items:center;">
                        ${viewBtnHtml}
                        ${readToggleBtn}
                        ${delBtn}
                    </div>
                </div>
            `;
        } else {
            const typeIcon = item.type === 'library' ? '⭐ 圖庫' : '📝 題庫';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:15px; color:#2c3e50;">${item.title} ${unreadBadge}</div>
                        <div style="font-size:12px; color:#7f8c8d; margin-top:4px;">
                            <span style="background:#eee; padding:1px 5px; border-radius:3px; color:#8e44ad; font-weight:bold;">${typeIcon}</span>
                            <span style="margin-left:10px;">來自：${item.providerName}</span>
                            <span style="margin-left:10px;">時間：${dateStr}</span>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:row; gap:5px; align-items:center;">
                        <button onclick="placeInboxItemOnCanvas(${item.id})" title="放入畫布" style="padding:6px 10px; background:#f39c12; color:white; border:none; border-radius:4px; cursor:pointer; font-size:14px;">🖼️</button>
                        <button onclick="importFromInbox(${item.id})" title="存入資料庫" style="padding:6px 10px; background:#2980b9; color:white; border:none; border-radius:4px; cursor:pointer; font-size:14px;">📥</button>
                        ${readToggleBtn}
                        ${delBtn}
                    </div>
                </div>
            `;
        }
        list.appendChild(div);
    });
};

// --- 【新增】從訊息匣將分享包「放入畫布」 ---
window.placeInboxItemOnCanvas = async function(id) {
    const item = await db.inbox.get(id);
    if (!item) return;
    try {
        const payloadItems = item.payload.items ||[];
        const payloads = payloadItems.map(str => JSON.parse(str));
        
        await window.insertPayloadsToCanvas(payloads);
        
        // 標記為已讀
        await window.toggleInboxItemReadState(id, true);
    } catch (err) {
        showAlert("放入畫布失敗：" + err.message);
    }
};

window.toggleInboxItemReadState = async function(id, newState) {
    // 1. 取得本地項目資訊
    const item = await db.inbox.get(id);
    
    // 2. 如果是 Firebase 雲端通知，自動同步狀態到雲端
    if (item && item.shareId && item.shareId.startsWith('notif-')) {
        const docId = item.shareId.replace('notif-', '');
        if (typeof window.updateCloudNotificationState === 'function') {
            // 背景非同步更新雲端，不阻擋畫面
            window.updateCloudNotificationState(docId, newState);
        }
    }

    // 3. 更新本地資料庫
    await db.inbox.update(id, { isDownloaded: newState });
    
    // 4. 更新介面數字與選單 UI
    if (typeof window.updateInboxBadge === 'function') await window.updateInboxBadge();
    if (document.getElementById('inbox-modal').style.display !== 'none') {
        openInboxModal();
    }

    // 【新增】：切換已讀狀態後，自動背景備份至雲端
    if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
};

window.updateInboxBadge = async function() {
    const badge = document.getElementById('inbox-badge');
    if (!badge) return;
    try {
        const items = await db.inbox.toArray();
        const unreadCount = items.filter(item => !item.isDownloaded).length;
        
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch(e) {
        badge.style.display = 'none';
    }
};

window.importFromInbox = async function(id) {
    const item = await db.inbox.get(id);
    if (!item) return;

    try {
        let processedCount = 0;
        const payloadItems = item.payload.items || [];
        const type = item.type;

        for (const payloadItem of payloadItems) {
            const cat = payloadItem.category || '未分類';
            const exist = await db.categories.where('name').equals(cat).count();
            if (exist === 0) {
                await db.categories.add({ name: cat });
            }

            if (type === 'library') {
                let thumbnail = payloadItem.thumbnail;
                if (!thumbnail && typeof generateThumbnailFromSvgString === 'function') {
                    thumbnail = await generateThumbnailFromSvgString(payloadItem.svgInner || '');
                }
                
                await db.favorites.add({
                    name: payloadItem.name || "未命名素材",
                    category: cat,
                    svgInner: payloadItem.svgInner || '',
                    thumbnail: thumbnail || payloadItem.svgInner,
                    timestamp: Date.now() + processedCount
                });
            } else if (type === 'question') {
                await db.questions.add({
                    title: payloadItem.title || "未命名題目",
                    category: cat,
                    questionText: payloadItem.questionText || "",
                    illustrationSvg: payloadItem.illustrationSvg || "",
                    timestamp: Date.now() + processedCount
                });
            }
            processedCount++;
        }

        if (processedCount > 0) {
            await window.toggleInboxItemReadState(id, true);

            showAlert(`成功匯入 ${processedCount} 個${type === 'library' ? '素材' : '題目'}！`);
            openInboxModal();
            
            if (document.getElementById('library-modal').style.display !== 'none') {
                renderCategories();
                renderLibraryItems(currentCategory);
            }
            if (document.getElementById('question-bank-modal').style.display !== 'none') {
                renderQBCategories();
                renderQBItems(currentCategory);
            }
        } else {
            showAlert("這個分享包是空的，沒有可匯入的項目。");
        }
    } catch (err) {
        console.error(err);
        showAlert("匯入失敗：" + err.message);
    }
};

window.deleteInboxItem = async function(id) {
    showConfirm("確定要刪除這則訊息嗎？\n(這不會影響您已經匯入的資料庫內容)", async () => {
        
        // 1. 先取得這筆資料，檢查是否為雲端通知
        const item = await db.inbox.get(id);
        if (item && item.shareId && item.shareId.startsWith('notif-')) {
            // 解析出 Firebase 上的真實 docId
            const docId = item.shareId.replace('notif-', '');
            // 2. 呼叫 gallery.js 提供的函式刪除雲端資料
            if (typeof window.deleteCloudNotification === 'function') {
                await window.deleteCloudNotification(docId);
            }
        }

        // 3. 刪除本地端資料
        await db.inbox.delete(id);
        openInboxModal(); 
        await updateInboxBadge();
        
        // 只有圖庫/題庫變動才需要 markLocalAsDirty，訊息匣不用，所以把那行拿掉
    });
};

// 更新訊息匣的未讀計數
async function updateInboxBadge() {
    const badge = document.getElementById('inbox-badge');
    if (!badge) return;

    try {
        const unreadCount = await db.inbox.where('isDownloaded').equals(0).count();
        
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch(e) {
        // 資料庫可能尚未初始化完成，暫時隱藏
        badge.style.display = 'none';
    }
}
