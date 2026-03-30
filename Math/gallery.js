import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, updateDoc, increment, query, orderBy, where, limit, serverTimestamp, deleteDoc, doc } from "firebase/firestore";

// ==========================================
// 🚨 Firebase 設定與【系統管理員】設定
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDi-Lh4O9sU7E4u3pT4yhx_6I9HUmB45y0",
    authDomain: "mathgroup-67503.firebaseapp.com",
    projectId: "mathgroup-67503",
    storageBucket: "mathgroup-67503.firebasestorage.app",
    messagingSenderId: "845228009261",
    appId: "1:845228009261:web:f0c870d9d2ab56170715a4"
};

// 👑 請將這裡替換成您自己的 Google 帳號信箱！
const ADMIN_EMAILS =['maxon.chiang@gmail.com']; 

const app = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(app);

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 快取有效時間：2 小時

// 快取管理器
window.getCloudCache = function(key) {
    const cachedStr = localStorage.getItem('math_editor_cache_' + key);
    if (cachedStr) {
        try {
            const parsed = JSON.parse(cachedStr);
            if (Date.now() < parsed.expireAt) return parsed.data;
        } catch(e) {}
    }
    return null;
};

window.setCloudCache = function(key, data) {
    localStorage.setItem('math_editor_cache_' + key, JSON.stringify({
        data: data,
        expireAt: Date.now() + CACHE_TTL_MS
    }));
};

window.invalidateGalleryCache = function() {
    const keysToRemove =[];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 只要是跟 gallery 有關的快取就清除
        if (key && key.startsWith('math_editor_cache_gallery_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
};

// 閱讀時間紀錄器 (紀錄使用者最後一次進入大廳/社群的時間)
window.markAsRead = function(key) {
    if (!currentUserProfile) return;
    let readTimes = JSON.parse(localStorage.getItem(`math_editor_read_${currentUserProfile.email}`) || '{}');
    readTimes[key] = Date.now();
    localStorage.setItem(`math_editor_read_${currentUserProfile.email}`, JSON.stringify(readTimes));
    updateCloudUnreadBadges(); // 標記已讀後立即更新紅點
};

window.getLastReadTime = function(key) {
    if (!currentUserProfile) return 0;
    let readTimes = JSON.parse(localStorage.getItem(`math_editor_read_${currentUserProfile.email}`) || '{}');
    return readTimes[key] || 0;
};

// 【全新引擎】檢查單篇貼文是否已讀
window.isPostRead = function(postId, authorEmail) {
    if (!currentUserProfile) return true;
    // 自己的貼文永遠視為已讀
    if (authorEmail === currentUserProfile.email) return true; 
    
    const key = `math_editor_read_posts_${currentUserProfile.email}`;
    let readList = JSON.parse(localStorage.getItem(key) || '[]');
    return readList.includes(postId);
};

// 【全新引擎】標記單篇貼文為已讀，並消除紅點與觸發同步
window.markPostAsRead = function(postId) {
    if (!currentUserProfile) return;
    const key = `math_editor_read_posts_${currentUserProfile.email}`;
    let readList = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (!readList.includes(postId)) {
        readList.push(postId);
        // 限制儲存數量，避免無限制增長 (保留最近 2000 筆已讀)
        if (readList.length > 2000) readList = readList.slice(-2000);
        localStorage.setItem(key, JSON.stringify(readList));

        // 動態隱藏列表上的「新」標籤，不需重整畫面
        const badge = document.getElementById(`unread-badge-${postId}`);
        if (badge) badge.style.display = 'none';

        // 【核心修正】更新左側選單的未讀總數
        updateCloudUnreadBadges();
        
        // 【核心機制】：狀態改變，自動背景同步到雲端！
        if (typeof window.autoSyncToCloud === 'function') {
            // 稍作延遲，避免短時間內重複觸發
            setTimeout(() => window.autoSyncToCloud(), 500); 
        }
    }
};

// 全域未讀計數器 (掃描大廳與社群的新發文)
window.updateCloudUnreadBadges = async function() {
    if (!currentUserProfile) return;
    try {
        const galleryCol = collection(dbFirestore, "public_gallery");
        
        // 1. 計算公共大廳未讀 (逐篇檢查)
        // 使用 limit(50) 避免掃描過多歷史文章，只檢查最近的 50 篇
        const globalQ = query(galleryCol, where("communityId", "==", ""), orderBy("timestamp", "desc"), limit(50));
        const globalSnap = await getDocs(globalQ);
        
        let globalUnread = 0;
        globalSnap.forEach(doc => {
            const data = doc.data();
            // 【核心修正】只檢查是不是自己的文章，以及該 ID 是否在已讀清單內
            if (data.authorEmail !== currentUserProfile.email && !window.isPostRead(doc.id, data.authorEmail)) {
                globalUnread++;
            }
        });

        const badgeGlobal = document.getElementById('badge-global');
        if (badgeGlobal) {
            badgeGlobal.innerText = globalUnread;
            badgeGlobal.style.display = globalUnread > 0 ? 'inline-block' : 'none';
        }

        // 2. 檢查已加入社群的未讀總和 (逐社群逐篇檢查)
        const commCol = collection(dbFirestore, "communities");
        const commQ = query(commCol, where("members", "array-contains", currentUserProfile.email));
        const commSnap = await getDocs(commQ);
        
        let totalCommUnread = 0;
        
        for (const cDoc of commSnap.docs) {
            const commId = cDoc.id;
            const q = query(galleryCol, where("communityId", "==", commId), orderBy("timestamp", "desc"), limit(20));
            const snap = await getDocs(q);
            
            let commUnreadCount = 0;
            snap.forEach(doc => {
                const data = doc.data();
                // 【核心修正】
                if (data.authorEmail !== currentUserProfile.email && !window.isPostRead(doc.id, data.authorEmail)) {
                    commUnreadCount++;
                }
            });
            
            totalCommUnread += commUnreadCount;
            
            // 同步更新社群管理視窗 (如果打開著) 左側列表的紅點
            // 注意：這裡假設社群列表的 DOM 結構中有特定的 ID 或是可以透過重新渲染更新
            // 最穩妥的做法是如果社群視窗開著，就重新呼叫 loadUserCommunities()
            // 但為避免過度刷新，這交由使用者自行重整，或是在點擊已讀時觸發
        }

        const badgeComm = document.getElementById('badge-comm-total');
        if (badgeComm) {
            badgeComm.innerText = totalCommUnread;
            badgeComm.style.display = totalCommUnread > 0 ? 'inline-block' : 'none';
        }
        
        // 如果目前社群管理視窗是開著的，順便更新裡面的數字
        if (document.getElementById('community-modal').style.display === 'flex') {
            if (typeof window.loadUserCommunities === 'function') {
                // 不阻擋主線程，背景靜默更新社群列表的紅點
                setTimeout(() => { window.loadUserCommunities(true); }, 100); 
            }
        }

    } catch(e) { 
        console.warn("未讀計數掃描失敗", e); 
    }
};

// 全域狀態變數
let pendingPublishItems =[];
let pendingPublishType = ''; 
let currentUserProfile = null; 
let rawGalleryData =[]; 
let currentSortField = 'timestamp';
let currentSortOrder = 'desc';
let currentViewingItem = null; // 目前檢視的分享包
let currentViewingItemIndex = 0;
let pendingReplyAttachmentPayload = null; // 暫存要發布的回覆附件

// ----------------------------------------------------
// 🔐 登入與權限驗證工具 (支援黑名單檢查)
// ----------------------------------------------------
async function ensureLogin() {
    const currentToken = window.accessToken || (typeof window.getValidAccessToken === 'function' ? window.getValidAccessToken() : null);
    if (!currentToken) {
        showConfirm("🔒 您必須先登入 Google 帳號才能使用社群功能！", () => { if (typeof handleCloudSyncClick === 'function') handleCloudSyncClick(); });
        return null;
    }
    if (currentUserProfile) {
        // 觸發 UI 更新
        if (currentUserProfile.isAdmin) {
            const adminMenu = document.getElementById('admin-menu-item');
            const adminSep = document.getElementById('admin-menu-separator');
            if (adminMenu) adminMenu.style.display = 'flex';
            if (adminSep) adminSep.style.display = 'block';
        }
        return currentUserProfile;
    }

    let profile;
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (!res.ok) throw new Error("Google Token 失效");
        profile = await res.json();
    } catch(e) { showAlert("Google 登入狀態已失效"); window.accessToken = null; return null; }

    try {
        const userDocRef = doc(dbFirestore, "users", profile.email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().banned) { showAlert("⛔ 帳號已停權。"); return null; }
        if (!userDoc.exists()) { await setDoc(userDocRef, { email: profile.email, name: profile.name, banned: false, role: ADMIN_EMAILS.includes(profile.email) ? 'admin' : 'user', created: serverTimestamp() }); }

        currentUserProfile = { name: profile.name, email: profile.email, isAdmin: ADMIN_EMAILS.includes(profile.email) };
        
        // 顯示管理員按鈕
        if (currentUserProfile.isAdmin) {
            const adminMenu = document.getElementById('admin-menu-item');
            const adminSep = document.getElementById('admin-menu-separator');
            if (adminMenu) adminMenu.style.display = 'flex';
            if (adminSep) adminSep.style.display = 'block';
        }

        fetchCloudNotifications();
		updateCloudUnreadBadges();
        return currentUserProfile;
    } catch(e) { console.error(e); showAlert("Firebase 連線失敗"); return null; }
}
window.ensureLogin = ensureLogin;

let currentGalleryCommunityId = ""; // 空字串代表公共大廳
let currentGalleryCommunityName = "";
let userCommunities =[]; // 暫存使用者參與的社群

// 2. 修改：發布至大廳 (載入社群選項)
window.publishToGallery = async function(type) {
    const user = await ensureLogin();
    if (!user) return;

    pendingPublishType = type;
    if (type === 'library') {
        pendingPublishItems = await db.favorites.where('id').anyOf(Array.from(selectedLibraryIds)).toArray();
    } else {
        pendingPublishItems = await db.questions.where('id').anyOf(Array.from(selectedQBIds)).toArray();
    }

    if (pendingPublishItems.length === 0) return;

    document.getElementById('publish-count').innerText = pendingPublishItems.length;
    document.getElementById('publish-package-title').value = ""; 
    
    // 【修復 1】讀取暱稱時，綁定專屬 Email 避免帳號衝突
    document.getElementById('publish-author').value = localStorage.getItem('math_editor_author_name_' + user.email) || user.name;
    
    document.getElementById('publish-desc').value = "";
    document.getElementById('publish-password').value = "";
    
    const selectEl = document.getElementById('publish-target-community');
    const pwdContainer = document.getElementById('publish-password-container');
    selectEl.innerHTML = '<option value="">🌍 公共大廳 (所有人可見)</option>';
    
    const commCol = collection(dbFirestore, "communities");
    const q = query(commCol, where("members", "array-contains", user.email));
    try {
        const snap = await getDocs(q);
        snap.forEach(doc => {
            const data = doc.data();
            selectEl.appendChild(new Option(`👥 ${data.name}`, doc.id));
        });
    } catch(e) { console.warn("載入發布社群失敗", e); }
    
    selectEl.onchange = () => {
        pwdContainer.style.display = selectEl.value ? 'none' : 'block';
    };
    pwdContainer.style.display = 'block'; 

    const btn = document.getElementById('btn-confirm-publish');
    btn.disabled = false;
    btn.innerText = "🚀 確認發布打包";

    document.getElementById('publish-modal').style.display = 'flex';
};


document.getElementById('btn-confirm-publish').onclick = async function() {
    const packageTitle = document.getElementById('publish-package-title').value.trim();
    const authorNickname = document.getElementById('publish-author').value.trim() || "匿名使用者";
    const description = document.getElementById('publish-desc').value.trim();
    
    const targetCommunityId = document.getElementById('publish-target-community').value;
    const password = targetCommunityId ? "" : document.getElementById('publish-password').value.trim(); 
    
    if (!packageTitle) { showAlert("請務必輸入「分享包標題」！"); return; }

    // 【修復 2】儲存暱稱時，綁定專屬 Email
    localStorage.setItem('math_editor_author_name_' + currentUserProfile.email, authorNickname);

    const btn = this;
    btn.disabled = true;
    btn.innerText = "⏳ 打包上傳中...";

    try {
        const galleryCol = collection(dbFirestore, "public_gallery");
        const itemsPayloadArray = pendingPublishItems.map(item => {
            const payload = { ...item }; delete payload.id; delete payload.tags; 
            return JSON.stringify(payload);
        });

        await addDoc(galleryCol, {
            title: packageTitle, 
            type: pendingPublishType,
            authorName: authorNickname, 
            authorEmail: currentUserProfile.email,
            description: description, 
            items: itemsPayloadArray, 
            password: password, 
            communityId: targetCommunityId, 
            replyCount: 0, 
            timestamp: serverTimestamp()
        });

        // 【核心修正】：清除快取
        if (typeof window.invalidateGalleryCache === 'function') window.invalidateGalleryCache();

        document.getElementById('publish-modal').style.display = 'none';
        showAlert(`✅ 發布成功！`);
        
        // 【核心修正】：帶入 true 強制重整畫面
        if (document.getElementById('gallery-modal').style.display === 'flex') loadGalleryItems(true);
        if (document.getElementById('personal-space-modal').style.display === 'flex') loadPersonalItems();
		if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();		
    } catch (err) {
        console.error(err);
        showAlert("發布失敗：" + err.message);
        btn.disabled = false;
        btn.innerText = "🚀 重新嘗試發布";
    }
};

// ----------------------------------------------------
// 🌍 大廳讀取與列表顯示
// ----------------------------------------------------
let currentGalleryOnClose = null; 

window.openGalleryModal = async function(communityId = "", communityName = "", onCloseCallback = null) {
    const modal = document.getElementById('gallery-modal');
    const tbody = document.getElementById('gallery-list-body');
    
    // 【核心修正 1/2】：將回呼函式存入全域變數
    window.currentGalleryOnClose = onCloseCallback;
    
    currentGalleryCommunityId = communityId;
    currentGalleryCommunityName = communityName;

    modal.style.display = 'flex';
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color:#7f8c8d; font-size:16px;">⏳ 正在連線資料庫... </td></tr>';

    const user = await ensureLogin();
    if (!user) {
        modal.style.display = 'none';
        return;
    }
    
    const closeBtn = modal.querySelector('button[onclick*="gallery-modal"]');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            if (currentGalleryOnClose) {
                currentGalleryOnClose();
                currentGalleryOnClose = null; // 清除
            }
        };
    }

    const roleIcon = user.isAdmin ? '👑 管理員' : '👤 用戶';
    const titleBase = communityId ? `👥 社群：${communityName}` : `🌍 公共大廳`;
    
    const titleContainer = modal.querySelector('.modal-header') || modal.querySelector('div[style*="font-size: 18px; font-weight: bold;"]');
    if (titleContainer) {
        titleContainer.innerHTML = `<span>${titleBase}</span><span id="gallery-user-info" style="font-size: 13px; font-weight: bold; color: #f1c40f;"> <span style="color:#e74c3c;">${roleIcon}</span> : ${user.email}</span>`;
    }
    
    loadGalleryItems();
};

// 5. 修改：讀取大廳項目 (改回本地過濾)
window.loadGalleryItems = async function(forceRefresh = false) {
    const tbody = document.getElementById('gallery-list-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color:#7f8c8d; font-size:16px;">⏳ 正在讀取資料... </td></tr>';
    const filterType = document.getElementById('gallery-type-filter').value;
    
    // 定義此列表的快取/已讀 Key
    const cacheKey = currentGalleryCommunityId === "" ? "gallery_global" : `gallery_${currentGalleryCommunityId}`;
    const readKey = currentGalleryCommunityId === "" ? "global" : currentGalleryCommunityId;

    try {
        // 1. 嘗試讀取快取
        let dataList = forceRefresh ? null : getCloudCache(cacheKey);

        // 2. 如果沒有快取或強制重整，則連線 Firestore 下載
        if (!dataList) {
            const galleryCol = collection(dbFirestore, "public_gallery");
            
            // 【核心修正】不使用 where("communityId") 過濾，改為全部抓取後在前端過濾
            // 這是為了向下相容早期沒有 communityId 欄位的舊貼文
            const q = query(galleryCol, orderBy("timestamp", "desc"), limit(200));

            const querySnapshot = await getDocs(q);
            dataList =[];

            querySnapshot.forEach((doc) => {
                const data = doc.data(); 
                data.id = doc.id; 

                // 前端過濾社群 ID (相容沒有該欄位的舊貼文)
                const postCommId = data.communityId || "";
                if (currentGalleryCommunityId === "") {
                    if (postCommId !== "") return; // 在大廳，跳過屬於社群的文
                } else {
                    if (postCommId !== currentGalleryCommunityId) return; // 在社群，跳過不屬於此社群的文
                }

                data.replyCount = data.replyCount || 0;
                
                // 為了存入 localStorage，必須將 Firestore Timestamp 轉為純數字
                const timeObj = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date(0);
                data.timestamp = timeObj.getTime(); 
                data.timeStr = timeObj.toLocaleString();
                
                data.titleStr = (data.title || "").toLowerCase(); 
                data.descStr = (data.description || "").toLowerCase(); 
                data.authorStr = (data.authorName || "").toLowerCase() + " " + (data.authorEmail || "").toLowerCase();
                data.items = Array.isArray(data.items) ? data.items :[];
                if (data.items.length === 0 && data.payload) data.items = [data.payload]; 
                
                dataList.push(data);
            });
            
            // 儲存至快取
            setCloudCache(cacheKey, dataList);
        }

        // 3. 還原時間物件供排序使用
        rawGalleryData = dataList.map(item => ({
            ...item,
            timeObj: new Date(item.timestamp)
        }));

        // 4. 根據 filterType 進行二次過濾 (因為快取是存全部的)
        if (filterType !== 'all') {
            rawGalleryData = rawGalleryData.filter(item => item.type === filterType);
        }

        currentSortField = 'timestamp'; currentSortOrder = 'desc';
        if (typeof updateSortIcons === 'function') updateSortIcons(); 
        
        filterGalleryTable();
    } catch (err) {
        console.error("讀取大廳失敗:", err); 
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#c0392b; padding: 40px;">讀取失敗：${err.message}</td></tr>`;
    }
};

window.filterGalleryTable = function() {
    const keyword = document.getElementById('gallery-search-input').value.toLowerCase().trim();
    let filteredData = rawGalleryData;
    if (keyword !== "") filteredData = rawGalleryData.filter(item => item.titleStr.includes(keyword) || item.descStr.includes(keyword) || item.authorStr.includes(keyword));

    if (currentSortOrder !== 'none') {
        filteredData.sort((a, b) => {
            let valA, valB;
            if (currentSortField === 'title') { valA = a.titleStr; valB = b.titleStr; }
            else if (currentSortField === 'description') { valA = a.descStr; valB = b.descStr; }
            else if (currentSortField === 'authorName') { valA = a.authorStr; valB = b.authorStr; }
            else if (currentSortField === 'timestamp') { valA = a.timeObj.getTime(); valB = b.timeObj.getTime(); }
            else if (currentSortField === 'replyCount') { valA = a.replyCount; valB = b.replyCount; } // 新增回覆數排序
            if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
    renderGalleryTable(filteredData);
};

window.sortGalleryTable = function(field) {
    if (currentSortField === field) {
        if (currentSortOrder === 'desc') currentSortOrder = 'asc';
        else if (currentSortOrder === 'asc') currentSortOrder = 'none';
        else currentSortOrder = 'desc';
    } else { currentSortField = field; currentSortOrder = 'desc'; }
    updateSortIcons(); filterGalleryTable();
};

function updateSortIcons() {['title', 'description', 'authorName', 'timestamp', 'replyCount'].forEach(f => {
        const icon = document.getElementById(`sort-icon-${f}`);
        if (!icon) return;
        if (currentSortField === f && currentSortOrder !== 'none') { icon.innerText = currentSortOrder === 'desc' ? '▼' : '▲'; icon.style.color = '#2980b9'; icon.style.fontWeight = 'bold'; } 
        else { icon.innerText = '↕'; icon.style.color = '#999'; icon.style.fontWeight = 'normal'; }
    });
}

window.renderGalleryTable = function(dataList) {
    const tbody = document.getElementById('gallery-list-body');
    tbody.innerHTML = '';
    if (dataList.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#7f8c8d; padding: 40px;">找不到符合的項目</td></tr>'; return; }

    dataList.forEach(data => {
        const isQuestion = data.type === 'question';
        const typeBadge = isQuestion ? '<span style="background:#e8f6f3; color:#16a085; padding:2px 6px; border-radius:4px; font-size:11px;">題庫</span>' : '<span style="background:#fef9e7; color:#d35400; padding:2px 6px; border-radius:4px; font-size:11px;">圖庫</span>';
        const lockIcon = data.password ? '<span title="需要密碼" style="color:#e67e22; margin-left:5px;">🔒</span>' : '';
        const isRead = window.isPostRead(data.id, data.authorEmail);
        const unreadBadgeHtml = !isRead ? `<span id="unread-badge-${data.id}" style="background:#e74c3c; color:white; padding:2px 6px; border-radius:10px; font-size:10px; margin-left:8px; vertical-align:middle; box-shadow:0 1px 3px rgba(0,0,0,0.2);">新</span>` : `<span id="unread-badge-${data.id}" style="display:none;"></span>`;

        let thumbHtml = '<div style="color:#ccc; font-size:11px; text-align:center; padding-top:15px;">無</div>';
        if (data.items.length > 0) {
            try {
                const firstItem = JSON.parse(data.items[0]);
                const rawSvg = isQuestion ? firstItem.illustrationSvg : (firstItem.thumbnail || firstItem.svgInner);
                if (rawSvg) {
                    const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><style>.shape{stroke:black;stroke-width:2;fill:none;}text{font-family:Arial;}</style>${rawSvg}</svg>`], {type: 'image/svg+xml;charset=utf-8'});
                    thumbHtml = `<img src="${URL.createObjectURL(blob)}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
                }
            } catch(e){}
        }

        let deleteBtn = '';
        if (currentUserProfile && (currentUserProfile.isAdmin || currentUserProfile.email === data.authorEmail)) {
            deleteBtn = `<button onclick="deleteGalleryItem('${data.id}')" style="background:transparent; color:#c0392b; border:1px solid #c0392b; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:12px;" title="刪除此發布">🗑️</button>`;
        }
        let banBtn = '';
        if (currentUserProfile && currentUserProfile.isAdmin && currentUserProfile.email !== data.authorEmail) {
            banBtn = `<button onclick="banUser('${data.authorEmail}', '${data.authorName}')" style="background:#000; color:white; border:none; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer; margin-top:4px;" title="將此用戶加入黑名單">🚫 封鎖</button>`;
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #eee'; tr.onmouseenter = () => tr.style.background = '#f0f8ff'; tr.onmouseleave = () => tr.style.background = 'transparent';
        tr.setAttribute('data-full-json', encodeURIComponent(JSON.stringify(data)));

        // 【修改】跳脫標題與說明，並套用 MathJax 格式
        const safeTitle = window.escapeHTML(data.title);
        const safeDesc = window.escapeHTML(data.description || "無說明");
        const formattedTitle = window.formatSmartMathText ? window.formatSmartMathText(safeTitle) : safeTitle;
        const formattedDesc = window.formatSmartMathText ? window.formatSmartMathText(safeDesc) : safeDesc.replace(/\n/g, '<br>');

        tr.innerHTML = `
            <td style="padding: 8px;">
                <div style="width:80px; height:60px; background:#fdfdfd; border:1px solid #eee; border-radius:4px; overflow:hidden;">${thumbHtml}</div>
            </td>
            <td style="padding: 8px; font-weight:bold; color:#2c3e50;">
                ${typeBadge} <span>${formattedTitle}</span> ${lockIcon} ${unreadBadgeHtml}
                <div style="font-size:11px; color:#8e44ad; font-weight:normal; margin-top:4px;">(包含 ${data.items.length} 件)</div>
            </td>
            <td style="padding: 8px; color:#555; font-size:13px; max-width:200px; max-height:60px; overflow:hidden; text-overflow:ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                ${formattedDesc}
            </td>
            <td style="padding: 8px; color:#333;">
                ${window.escapeHTML(data.authorName)}<br><span style="font-size:11px; color:#999;">(${data.authorEmail})</span><br>${banBtn}
            </td>
            <td style="padding: 8px; color:#7f8c8d; font-size:12px;">${data.timeStr}</td>
            <td style="padding: 8px; text-align:center; color:#2980b9; font-weight:bold;">${data.replyCount}</td>
            <td style="padding: 8px; text-align:center;">
                <div style="display:flex; gap:5px; justify-content:center; flex-wrap:wrap;">
                    <button onclick="viewGalleryItem(this)" style="background:#f1c40f; color:#333; border:none; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:bold; white-space:nowrap;">🔍 檢視</button>
                    <button onclick="triggerGalleryImport(this)" style="background:#27ae60; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:bold; white-space:nowrap;">📥 匯入</button>
                    ${deleteBtn}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 渲染完表格後，呼叫 MathJax 處理
    if (window.MathJax) {
        MathJax.typesetPromise([tbody]).catch(e => console.warn("MathJax list render error", e));
    }
};

window.checkPasswordAccess = async function(data) {
    if (!data.password) return true; // 沒有密碼，直接放行
    if (currentUserProfile && (currentUserProfile.isAdmin || currentUserProfile.email === data.authorEmail)) return true; // 作者本人或管理員放行

    return new Promise((resolve) => {
        // 使用 utils.js 提供的共用輸入框，傳入包含「密碼」字眼的 title 以觸發文字輸入模式
        openNumberInputModal("🔒 此分享包受到保護，請輸入存取密碼：", "", (pwd) => {
            if (pwd === data.password) {
                resolve(true);
            } else {
                if (pwd !== null) showAlert("❌ 密碼錯誤，無法存取！");
                resolve(false);
            }
        });
    });
};

// ----------------------------------------------------
// 🗑️ 刪除與封鎖功能 (管理員權限)
// ----------------------------------------------------
window.deleteGalleryItem = async function(docId) {
    showConfirm("確定要從大廳刪除這個項目嗎？\n(底下的留言回覆也會一併被清理)", async () => {
        try {
            const repliesCol = collection(dbFirestore, `public_gallery/${docId}/replies`);
            const snap = await getDocs(repliesCol);
            for (const docSnap of snap.docs) {
                await deleteDoc(docSnap.ref); // 先刪除所有子留言
            }
            await deleteDoc(doc(dbFirestore, "public_gallery", docId)); // 刪除貼文主體
            
            // 【核心修正】：清除快取
            if (typeof window.invalidateGalleryCache === 'function') window.invalidateGalleryCache();

            showAlert("✅ 刪除成功");
            
            // 【核心修正】：帶入 true 強制重整畫面
            loadGalleryItems(true); 
            if (document.getElementById('personal-space-modal').style.display === 'flex') loadPersonalItems();
			if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
        } catch(e) { showAlert("刪除失敗：" + e.message); }
    });
};

window.banUser = async function(email, name) {
    showConfirm(`⚠️ 確定要將「${name} (${email})」加入黑名單嗎？\n該用戶將無法再發布任何內容。`, async () => {
        try {
            const userDocRef = doc(dbFirestore, "users", email);
            await setDoc(userDocRef, { banned: true }, { merge: true });
            showAlert(`✅ 已封鎖 ${email}`);
        } catch(e) { showAlert("封鎖失敗：" + e.message); }
    });
};

// ----------------------------------------------------
// 🔍 放大檢視與 💬 回覆功能
// ----------------------------------------------------
window.viewGalleryItem = async function(btnElement) {
    const tr = btnElement.closest('tr');
    const data = JSON.parse(decodeURIComponent(tr.getAttribute('data-full-json')));
    
    const hasAccess = await checkPasswordAccess(data);
    if (!hasAccess) return;

    // 【新增】：標記為已讀 (這會消滅紅點並背景同步)
    window.markPostAsRead(data.id);

    currentViewingItem = data;
    // ... 下方保留原本 viewGalleryItem 的其餘邏輯 ...
    currentViewingItemIndex = 0; 
    clearReplyAttachment();
    
    document.getElementById('view-modal-title').innerText = (data.type === 'question' ? '📝 ' : '⭐ ') + data.title;
    document.getElementById('view-modal-author').innerHTML = `${window.escapeHTML(data.authorName)}<br><span style="font-size:12px; color:#7f8c8d; font-weight:normal;">${window.escapeHTML(data.authorEmail)}</span>`;
    document.getElementById('view-modal-time').innerText = `📅 ${data.timeStr}`;
    document.getElementById('view-modal-count').innerText = `📦 共 ${data.items.length} 個項目`;
	
    const parsedItems = data.items.map(i => { try { return JSON.parse(i); } catch(e) { return {}; } });
    const thumbContainer = document.getElementById('view-modal-thumbnails');
    thumbContainer.innerHTML = '';
    
    parsedItems.forEach((item, index) => {
        const rawSvg = data.type === 'question' ? item.illustrationSvg : (item.thumbnail || item.svgInner);
        const itemTitle = item.title || item.name || `項目 ${index + 1}`;
        const safeTitle = itemTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const encodedText = encodeURIComponent(item.questionText || '');

        if (rawSvg) {
            const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><style>.shape{stroke:black;stroke-width:2;fill:none;}text{font-family:Arial;}</style>${rawSvg}</svg>`], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            
            const thumbImg = document.createElement('img');
            thumbImg.src = url;
            thumbImg.style.cssText = `width: 60px; height: 60px; object-fit: contain; cursor: pointer; border: 2px solid ${index === 0 ? '#3498db' : '#ddd'}; border-radius: 4px; background: white;`;
            thumbImg.onclick = () => changeViewMainImage(url, thumbImg, safeTitle, encodedText, index);
            thumbContainer.appendChild(thumbImg);
            
            if (index === 0) changeViewMainImage(url, thumbImg, safeTitle, encodedText, 0);
        }
    });

    loadReplies(data.id);
    document.getElementById('gallery-view-modal').style.display = 'flex';
};

window.changeViewMainImage = function(url, thumbElement, title, encodedQText, index) {
    currentViewingItemIndex = index;
    const mainImgContainer = document.getElementById('view-modal-main-image');
    if (mainImgContainer) {
        mainImgContainer.innerHTML = url ? `<img src="${url}" style="width:100%; height:100%; object-fit:contain;">` : `<span style="color:#ccc;">無預覽</span>`;
    }
    
    // 【修復】加上防呆檢查，避免找不到元素時報錯當機
    const titleEl = document.getElementById('view-modal-item-title');
    if (titleEl) {
        titleEl.innerText = title;
    }
    
    const qText = decodeURIComponent(encodedQText);
    const textContainer = document.getElementById('view-modal-item-text');
    if (textContainer) {
        if (currentViewingItem && currentViewingItem.type === 'question' && qText) {
            textContainer.style.display = 'block';
            textContainer.innerText = qText;
        } else { 
            textContainer.style.display = 'none'; 
        }
    }
    
    const allThumbs = document.getElementById('view-modal-thumbnails')?.querySelectorAll('img') || [];
    allThumbs.forEach(img => img.style.borderColor = '#ddd');
    if(thumbElement) thumbElement.style.borderColor = '#3498db';
};

let attachmentPickerContext = 'reply';
// 【修改】將單一變數改為陣列，支援多個附件
let pendingReplyAttachments =[];
let pendingReplyAttachmentNames = [];
let pendingNewPostAttachments = [];
let pendingNewPostAttachmentNames =[];

window.openReplyAttachmentPicker = function(context = 'reply') {
    attachmentPickerContext = context;
    document.getElementById('reply-attachment-picker-modal').style.display = 'flex';
    loadReplyAttachmentOptions();
};

window.loadReplyAttachmentOptions = async function() {
    const type = document.getElementById('reply-attachment-type').value;
    const list = document.getElementById('reply-attachment-list');
    list.innerHTML = '<div style="text-align:center; padding:20px; color:#999; grid-column: 1/-1;">載入中...</div>';
    
    let items =[];
    try {
        items = (type === 'library') ? await db.favorites.reverse().toArray() : await db.questions.reverse().toArray();
    } catch(e) { console.warn(e); }
    
    list.innerHTML = '';
    if (items.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#999; grid-column: 1/-1;">此分類下沒有可選擇的項目</div>';
        return;
    }
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.style.cssText = "background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; overflow: hidden; transition: all 0.2s;";
        card.onmouseover = () => { card.style.borderColor = '#3498db'; card.style.transform = 'translateY(-2px)'; };
        card.onmouseout = () => { card.style.borderColor = '#ddd'; card.style.transform = 'translateY(0)'; };
        
        const name = type === 'library' ? item.name : item.title;
        const rawSvg = type === 'library' ? (item.thumbnail || item.svgInner) : item.illustrationSvg;
        const subInfo = type === 'question' ? (item.questionText.substring(0, 30) + "...") : item.category;

        let imgHtml = '<div style="height:80px; background:#f9f9f9; color:#ccc; display:flex; align-items:center; justify-content:center; font-size:10px;">無預覽</div>';
        if (rawSvg) {
            const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><style>.shape{stroke:black;stroke-width:2;fill:none;}text{font-family:Arial;}</style>${rawSvg}</svg>`], {type: 'image/svg+xml;charset=utf-8'});
            imgHtml = `<div style="height:80px; background:white; display:flex; align-items:center; justify-content:center; padding:5px;"><img src="${URL.createObjectURL(blob)}" style="max-width:100%; max-height:100%; object-fit:contain;"></div>`;
        }

        card.innerHTML = `
            ${imgHtml}
            <div style="padding: 8px; border-top: 1px solid #eee;">
                <div style="font-weight:bold; font-size:12px; color:#2c3e50; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${name}">${name}</div>
                <div style="font-size:10px; color:#7f8c8d; margin-top:2px; height: 1.2em; overflow:hidden;">${subInfo}</div>
            </div>
        `;
        card.onclick = () => {
            const payload = { ...item };
            delete payload.id; delete payload.tags;
            const payloadStr = JSON.stringify(payload);
            
            // 加入到陣列中，然後呼叫對應的渲染函式
            if (attachmentPickerContext === 'reply') {
                pendingReplyAttachments.push(payloadStr);
                pendingReplyAttachmentNames.push(name);
                window.renderReplyAttachments();
            } else if (attachmentPickerContext === 'new_post') {
                pendingNewPostAttachments.push(payloadStr);
                pendingNewPostAttachmentNames.push(name);
                window.renderNewPostAttachments();
            }
            document.getElementById('reply-attachment-picker-modal').style.display = 'none';
        };
        list.appendChild(card);
    });
};

// ==========================================
// 附件的動態標籤渲染與個別刪除功能
// ==========================================

// 處理留言回覆的附件
window.renderReplyAttachments = function() {
    const preview = document.getElementById('reply-attachment-preview');
    const tagsContainer = document.getElementById('reply-attachment-tags');
    if (!preview || !tagsContainer) return;

    if (pendingReplyAttachments.length === 0) {
        preview.style.display = 'none';
    } else {
        preview.style.display = 'flex';
        tagsContainer.innerHTML = '';
        pendingReplyAttachmentNames.forEach((name, idx) => {
            const tag = document.createElement('div');
            tag.style.cssText = "background: white; border: 1px solid #3498db; padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 5px; font-weight: bold; color: #2980b9; font-size: 11px;";
            tag.innerHTML = `
                <span>${window.escapeHTML(name)}</span>
                <span style="color: #e74c3c; cursor: pointer; font-size: 15px; line-height: 1;" onclick="removeReplyAttachment(${idx})" title="移除此附件">×</span>
            `;
            tagsContainer.appendChild(tag);
        });
    }
};

window.removeReplyAttachment = function(index) {
    pendingReplyAttachments.splice(index, 1);
    pendingReplyAttachmentNames.splice(index, 1);
    window.renderReplyAttachments();
};

window.clearReplyAttachment = function() {
    pendingReplyAttachments = [];
    pendingReplyAttachmentNames =[];
    window.renderReplyAttachments();
};

// 處理發布新貼文的附件
window.renderNewPostAttachments = function() {
    const preview = document.getElementById('new-post-attachment-preview');
    const tagsContainer = document.getElementById('new-post-attachment-tags');
    if (!preview || !tagsContainer) return;

    if (pendingNewPostAttachments.length === 0) {
        preview.style.display = 'none';
    } else {
        preview.style.display = 'flex';
        tagsContainer.innerHTML = '';
        pendingNewPostAttachmentNames.forEach((name, idx) => {
            const tag = document.createElement('div');
            tag.style.cssText = "background: white; border: 1px solid #3498db; padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 5px; font-weight: bold; color: #2980b9; font-size: 11px;";
            tag.innerHTML = `
                <span>${window.escapeHTML(name)}</span>
                <span style="color: #e74c3c; cursor: pointer; font-size: 15px; line-height: 1;" onclick="removeNewPostAttachment(${idx})" title="移除此附件">×</span>
            `;
            tagsContainer.appendChild(tag);
        });
    }
};

window.removeNewPostAttachment = function(index) {
    pendingNewPostAttachments.splice(index, 1);
    pendingNewPostAttachmentNames.splice(index, 1);
    window.renderNewPostAttachments();
};

window.clearNewPostAttachment = function() {
    pendingNewPostAttachments =[];
    pendingNewPostAttachmentNames =[];
    window.renderNewPostAttachments();
};

window.openNewPostModal = async function() {
    const user = await ensureLogin();
    if (!user) return;

    document.getElementById('new-post-title').value = "";
    document.getElementById('new-post-author').value = localStorage.getItem('math_editor_author_name_' + user.email) || user.name;
    document.getElementById('new-post-desc').value = "";
    clearNewPostAttachment();

    const selectEl = document.getElementById('new-post-target-community');
    selectEl.innerHTML = '<option value="">🌍 公共大廳 (所有人可見)</option>';
    
    const commCol = collection(dbFirestore, "communities");
    const q = query(commCol, where("members", "array-contains", user.email));
    try {
        const snap = await getDocs(q);
        snap.forEach(doc => {
            const data = doc.data();
            selectEl.appendChild(new Option(`👥 ${data.name}`, doc.id));
        });
    } catch(e) { console.warn("載入發布社群失敗", e); }
    
    if (typeof currentGalleryCommunityId !== 'undefined' && currentGalleryCommunityId) {
        selectEl.value = currentGalleryCommunityId;
    }

    document.getElementById('gallery-new-post-modal').style.display = 'flex';
};

window.submitNewGalleryPost = async function(event) {
    const user = await ensureLogin();
    if (!user) return;

    const title = document.getElementById('new-post-title').value.trim();
    const authorName = document.getElementById('new-post-author').value.trim() || "匿名使用者";
    const desc = document.getElementById('new-post-desc').value.trim();
    const communityId = document.getElementById('new-post-target-community').value;

    if (!title) { showAlert("請輸入貼文標題！"); return; }
    if (!desc && pendingNewPostAttachments.length === 0) { showAlert("請輸入貼文說明或選擇附件！"); return; }

    localStorage.setItem('math_editor_author_name_' + currentUserProfile.email, authorName);

    const btn = event.target;
    btn.disabled = true;
    btn.innerText = "⏳ 發布中...";
    
    try {
        let postType = 'library';
        let itemsPayloadArray =[...pendingNewPostAttachments];

        if (itemsPayloadArray.length > 0) {
            try {
                const firstPayload = JSON.parse(itemsPayloadArray[0]);
                if (firstPayload.questionText !== undefined) {
                    postType = 'question';
                }
            } catch(e) {}
        }

        const galleryCol = collection(dbFirestore, "public_gallery");
        await addDoc(galleryCol, {
            title: title, 
            type: postType,
            authorName: authorName, 
            authorEmail: currentUserProfile.email,
            description: desc, 
            items: itemsPayloadArray,
            password: "", 
            communityId: communityId, 
            replyCount: 0, 
            timestamp: serverTimestamp()
        });

        if (typeof window.invalidateGalleryCache === 'function') window.invalidateGalleryCache();

        document.getElementById('gallery-new-post-modal').style.display = 'none';
        if (typeof window.hideMathPanelsForGallery === 'function') window.hideMathPanelsForGallery();
        showAlert(`✅ 貼文「${title}」已成功發布！`);
        
        loadGalleryItems(true);

    } catch (err) {
        console.error(err);
        showAlert("發布失敗：" + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 確認發布";
    }
};

window.submitGalleryReply = async function(event) {
    const user = await ensureLogin();
    if (!user) return;

    const inputEl = document.getElementById('gallery-reply-input');
    const content = inputEl.value.trim();
    
    if (!content && pendingReplyAttachments.length === 0) { showAlert("請輸入回覆內容或選擇附件！"); return; }

    const btn = event.target;
    const origText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "傳送中...";

    try {
        const repliesCol = collection(dbFirestore, `public_gallery/${currentViewingItem.id}/replies`);
        
        const attachmentPayloadStr = pendingReplyAttachments.length > 0 ? JSON.stringify(pendingReplyAttachments) : null;

        await addDoc(repliesCol, {
            authorName: localStorage.getItem('math_editor_author_name_' + user.email) || user.name,
            authorEmail: user.email,
            content: content,
            attachmentPayload: attachmentPayloadStr, 
            timestamp: serverTimestamp()
        });

        const docRef = doc(dbFirestore, "public_gallery", currentViewingItem.id);
        await updateDoc(docRef, { replyCount: increment(1) });
        if (typeof currentViewingItem.replyCount === 'number') currentViewingItem.replyCount++;

        let activeCommunityMembers = null;
        if (currentViewingItem.communityId) {
            const commRef = doc(dbFirestore, "communities", currentViewingItem.communityId);
            const commSnap = await getDoc(commRef);
            if (commSnap.exists()) {
                activeCommunityMembers = commSnap.data().members ||[];
            }
        }

        try {
            const participants = new Set();
            if (currentViewingItem.authorEmail) participants.add(currentViewingItem.authorEmail); 
            
            const snap = await getDocs(query(repliesCol));
            snap.forEach(d => {
                const email = d.data().authorEmail;
                if (email) participants.add(email);
            });
            
            participants.delete(user.email); 

            for (const email of participants) {
                if (activeCommunityMembers && !activeCommunityMembers.includes(email)) continue;
                try {
                    await addDoc(collection(dbFirestore, `users/${email}/notifications`), {
                        title: `💬[${currentViewingItem.title}] 新回覆`,
                        description: content, 
                        providerName: user.name, 
                        type: 'notification',
                        postId: currentViewingItem.id, 
                        timestamp: serverTimestamp()
                    });
                } catch (err) {}
            }
        } catch(e) {}

        if (typeof window.invalidateGalleryCache === 'function') window.invalidateGalleryCache();

        inputEl.value = ''; 
        clearReplyAttachment();
        loadReplies(currentViewingItem.id); 
        loadGalleryItems(true);

    } catch (e) {
        showAlert("回覆失敗：" + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = origText;
    }
};

window.deleteReply = async function(postId, replyId) {
    showConfirm("確定刪除這則回覆嗎？", async () => {
        try {
            await deleteDoc(doc(dbFirestore, `public_gallery/${postId}/replies`, replyId));
            
            const docRef = doc(dbFirestore, "public_gallery", postId);
            await updateDoc(docRef, { replyCount: increment(-1) });
            if (typeof currentViewingItem.replyCount === 'number' && currentViewingItem.replyCount > 0) currentViewingItem.replyCount--;
            
            if (typeof window.invalidateGalleryCache === 'function') window.invalidateGalleryCache();
            
            loadReplies(postId);
            loadGalleryItems(true); 
        } catch (e) { showAlert("刪除失敗"); }
    });
};

const originalLoadReplies = window.loadReplies; // 如果原本沒掛在 window 就無法這樣寫，所以整段覆蓋
window.loadReplies = async function(postId) {
    const listContainer = document.getElementById('gallery-replies-list');
    listContainer.innerHTML = '<div style="color:#999; text-align:center; font-size:12px; padding: 20px;">載入回覆中...</div>';

    try {
        const repliesCol = collection(dbFirestore, `public_gallery/${postId}/replies`);
        const q = query(repliesCol, orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);

        listContainer.innerHTML = '';
        if (snapshot.empty) {
            listContainer.innerHTML = '<div style="color:#999; text-align:center; font-size:12px; padding: 5px;">尚未有任何回覆。</div>';
            return;
        }

        snapshot.forEach(docSnap => {
            const reply = docSnap.data();
            const timeStr = reply.timestamp ? reply.timestamp.toDate().toLocaleString() : '';
            const attachmentIcon = reply.attachmentPayload ? '📎' : '';
            
            let delBtn = '';
            if (currentUserProfile && (currentUserProfile.isAdmin || currentUserProfile.email === reply.authorEmail)) {
                delBtn = `<span style="color:#e74c3c; cursor:pointer; margin-left:8px;" onclick="deleteReply('${postId}', '${docSnap.id}'); event.stopPropagation();" title="刪除">🗑️</span>`;
            }

            const div = document.createElement('div');
            div.style.cssText = "display: flex; align-items: flex-start; padding: 10px 12px; background: white; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.1s; font-size: 14px; gap: 10px;";
            div.onmouseover = () => div.style.background = "#f7fbff";
            div.onmouseout = () => div.style.background = "white";
            div.onclick = () => openReplyDetail(reply);

            // 【修改】跳脫與 MathJax 格式化
            const safeContent = window.escapeHTML(reply.content || "(僅附件)");
            const formattedContent = window.formatSmartMathText ? window.formatSmartMathText(safeContent) : safeContent.replace(/\n/g, '<br>');

            div.innerHTML = `
                <div style="font-weight:bold; color:#2980b9; width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;" title="${window.escapeHTML(reply.authorName)}">${window.escapeHTML(reply.authorName)}</div>
                <div style="flex: 1; color: #333; word-break: break-word; line-height: 1.4;">${formattedContent}</div>
                <div style="color: #aaa; font-size: 11px; width: 130px; text-align: right; flex-shrink: 0;">${timeStr}</div>
                <div style="width: 30px; text-align: center; font-size: 16px; flex-shrink: 0;" title="檢視詳情內容">${attachmentIcon || '📄'}</div>
                <div style="width: 30px; text-align: center; flex-shrink: 0;">${delBtn}</div>
            `;
            listContainer.appendChild(div);
        });
        
        const modalBody = document.querySelector('#gallery-view-modal .modal-body');
        if (modalBody) {
            modalBody.scrollTop = modalBody.scrollHeight;
        }
        
        // 渲染完後，呼叫 MathJax 處理
        if (window.MathJax) {
            MathJax.typesetPromise([listContainer]).catch(e => console.warn(e));
        }

    } catch (e) {
        listContainer.innerHTML = '<div style="color:#e74c3c; text-align:center; font-size:12px;">載入失敗</div>';
    }
};

window.openReplyDetail = function(replyData) {
    const modal = document.getElementById('reply-detail-modal');
    document.getElementById('reply-detail-author-title').innerText = `來自 ${replyData.authorName} 的回覆`;
    document.getElementById('reply-detail-full-text').innerText = replyData.content || "";
    
    const attachZone = document.getElementById('reply-detail-attachment-zone');
    const importBtn = document.getElementById('btn-reply-detail-import');
    const placeBtn = document.getElementById('btn-reply-detail-place');
    const svgContainer = document.getElementById('reply-detail-svg-container');

    if (replyData.attachmentPayload) {
        attachZone.style.display = 'block';
        importBtn.style.display = 'block';
        placeBtn.style.display = 'block';
        
        try {
            // 【修改】相容舊版單一物件，或新版多物件陣列
            const parsed = JSON.parse(replyData.attachmentPayload);
            const payloads = Array.isArray(parsed) ? parsed :[parsed];
            
            svgContainer.innerHTML = '';
            svgContainer.style.justifyContent = 'flex-start';
            svgContainer.style.overflowX = 'auto'; // 允許水平滑動看多圖
            svgContainer.style.padding = '10px';
            svgContainer.style.gap = '10px';

            payloads.forEach(payload => {
                const rawSvg = payload.illustrationSvg || payload.svgInner;
                const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><style>.shape{stroke:black;stroke-width:2;fill:none;}text{font-family:Arial;}</style>${rawSvg}</svg>`], {type: 'image/svg+xml;charset=utf-8'});
                const img = document.createElement('img');
                img.src = URL.createObjectURL(blob);
                img.style.cssText = "height: 100%; min-width: 180px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; background: white;";
                svgContainer.appendChild(img);
            });
            
            // 【修改】將陣列直接交給匯入函式處理
            importBtn.onclick = () => {
                importReplyAttachment(encodeURIComponent(replyData.attachmentPayload));
                modal.style.display = 'none';
            };
            placeBtn.onclick = () => {
                window.insertPayloadsToCanvas(payloads);
                modal.style.display = 'none';
                document.getElementById('gallery-view-modal').style.display = 'none';
            };
        } catch(e) { svgContainer.innerHTML = "無法預覽附件"; }
    } else {
        attachZone.style.display = 'none';
        importBtn.style.display = 'none';
        placeBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
};

// 點擊留言附件匯入本機 (直接加入畫布)
window.importReplyAttachment = function(encodedPayload) {
    try {
        const parsed = JSON.parse(decodeURIComponent(encodedPayload));
        const payloads = Array.isArray(parsed) ? parsed : [parsed];
        
        // 統一使用新的畫布置入函式 (它本來就支援陣列)
        window.insertPayloadsToCanvas(payloads);
        
        document.getElementById('reply-preview-modal').style.display = 'none';
        document.getElementById('reply-detail-modal').style.display = 'none';
        document.getElementById('gallery-view-modal').style.display = 'none';
        document.getElementById('gallery-modal').style.display = 'none';
        
    } catch(e) {
        showAlert("匯入附件失敗");
    }
};

// ----------------------------------------------------
// 📥 原有的大廳匯入功能 (單筆/整包)
// ----------------------------------------------------
let pendingImportItem = null;
let pendingImportItemIndex = -1; 

window.triggerGalleryImport = async function(btnElement) {
    const tr = btnElement.closest('tr');
    const data = JSON.parse(decodeURIComponent(tr.getAttribute('data-full-json')));
    
    const hasAccess = await checkPasswordAccess(data);
    if (!hasAccess) return;

    // 【新增】：標記為已讀
    window.markPostAsRead(data.id);

    openGalleryImportModal(data, -1); 
};

// 這裡綁定預覽視窗下方的匯入按鈕
document.getElementById('view-modal-import-single-btn').onclick = function() {
    openGalleryImportModal(currentViewingItem, currentViewingItemIndex);
};
document.getElementById('view-modal-import-pkg-btn').onclick = function() {
    openGalleryImportModal(currentViewingItem, -1);
};

async function openGalleryImportModal(data, index = -1) {
    pendingImportItem = data;
    pendingImportItemIndex = index;
    
    document.getElementById('import-pack-info').innerText = index >= 0 ? `📦 將匯入 1 個項目 (單筆萃取)` : `📦 將匯入 ${data.items.length} 個項目 (完整分享包)`;
    const select = document.getElementById('gallery-import-category');
    select.innerHTML = '';
    const cats = await db.categories.toArray();
    cats.sort((a, b) => a.name === '未分類' ? -1 : 1);
    cats.forEach(c => { select.appendChild(new Option(c.name, c.name)); });

    document.getElementById('gallery-import-modal').style.display = 'flex';
}

document.getElementById('btn-confirm-import').onclick = async function() {
    if (!pendingImportItem) return;
    const category = document.getElementById('gallery-import-category').value;
    const type = pendingImportItem.type;
    const itemsArray = pendingImportItemIndex >= 0 ?[pendingImportItem.items[pendingImportItemIndex]] : pendingImportItem.items;

    try {
        let count = 0;
        for (const payloadStr of itemsArray) {
            let payload = {};
            try { payload = JSON.parse(payloadStr); } catch(e) { continue; }

            if (type === 'library') {
                await db.favorites.add({ name: payload.name || "下載素材", category, svgInner: payload.svgInner || "", thumbnail: payload.thumbnail || payload.svgInner, timestamp: Date.now() + count });
            } else {
                await db.questions.add({ title: payload.title || "下載題目", category, questionText: payload.questionText || "", illustrationSvg: payload.illustrationSvg || "", timestamp: Date.now() + count });
            }
            count++;
        }
        
        // 🆕 將雲端的「匯入次數(downloadCount)」+1
        if (pendingImportItem.id) {
            try {
                const docRef = doc(dbFirestore, "public_gallery", pendingImportItem.id);
                await updateDoc(docRef, { downloadCount: increment(1) });
            } catch (e) { console.warn("無法更新匯入次數", e); }
        }

        document.getElementById('gallery-import-modal').style.display = 'none';
        showAlert(`✅ 已成功匯入 ${count} 個項目！`);
        if (document.getElementById('library-modal').style.display !== 'none') { renderCategories(); renderLibraryItems(currentCategory); }
        if (document.getElementById('question-bank-modal').style.display !== 'none') { renderQBCategories(); renderQBItems(currentCategory); }
    } catch (err) { showAlert("匯入失敗：" + err.message); }
};

window.openPersonalSpaceModal = async function() {
    const modal = document.getElementById('personal-space-modal');
    const tbody = document.getElementById('personal-list-body');
    
    modal.style.display = 'flex';
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color:#7f8c8d; font-size:16px;">⏳ 正在連線您的個人專區...</td></tr>';

    const user = await ensureLogin();
    if (!user) {
        modal.style.display = 'none';
        return;
    }
    
    document.getElementById('personal-user-info').innerText = `管理員：${user.name}`;
    loadPersonalItems();
};

window.loadPersonalItems = async function() {
    const tbody = document.getElementById('personal-list-body');
    try {
        const galleryCol = collection(dbFirestore, "public_gallery");
        // 篩選出目前登入信箱發布的內容
        const q = query(galleryCol, where("authorEmail", "==", currentUserProfile.email), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        let personalData =[];
        querySnapshot.forEach((doc) => {
            const data = doc.data(); data.id = doc.id; 
            data.timeObj = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date(0);
            data.timeStr = data.timeObj.toLocaleString();
            data.items = Array.isArray(data.items) ? data.items :[];
            personalData.push(data);
        });

        renderPersonalTable(personalData);
    } catch (err) {
        // 🆕 輸出完整錯誤到 Console
        console.error("🚨 個人專區讀取失敗！請點擊下方連結建立 Firestore 索引：");
        console.error(err); 

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#c0392b; padding: 40px;">讀取失敗：${err.code}<br>請按 F12 查看控制台 (Console) 點擊連結建立索引。</td></tr>`;
    }
};

function renderPersonalTable(dataList) {
    const tbody = document.getElementById('personal-list-body');
    tbody.innerHTML = '';
    if (dataList.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#7f8c8d; padding: 40px;">您尚未發布過任何主題。</td></tr>'; 
        return; 
    }

    dataList.forEach(data => {
        const isQuestion = data.type === 'question';
        const typeBadge = isQuestion 
            ? '<span style="color:#16a085; font-size:10px; border:1px solid #16a085; padding:0 2px; border-radius:3px; margin-right:4px;">題</span>' 
            : '<span style="color:#d35400; font-size:10px; border:1px solid #d35400; padding:0 2px; border-radius:3px; margin-right:4px;">圖</span>';
        
        // 狀態極簡化
        const statusHtml = data.password 
            ? `<div style="color:#e67e22; font-weight:bold; font-size:13px;">🔒加密</div><div style="font-size:10px; color:#aaa;">${data.password}</div>` 
            : `<div style="color:#27ae60; font-weight:bold; font-size:13px;">🌍公開</div>`;

        // 處理時間垂直堆疊：日期在上，時間在下
        let timeDisplay = "";
        if (data.timeStr) {
            const parts = data.timeStr.split(' '); // 假設格式為 "2026/3/16 上午12:14:15"
            const datePart = parts[0] || "";
            const timePart = parts[1] || "";
            timeDisplay = `<div style="line-height:1.2;">${datePart}</div><div style="font-size:11px; color:#999;">${timePart}</div>`;
        }

        let thumbHtml = '<div style="color:#ccc; font-size:10px; text-align:center;">無</div>';
        if (data.items.length > 0) {
            try {
                const firstItem = JSON.parse(data.items[0]);
                const rawSvg = isQuestion ? firstItem.illustrationSvg : (firstItem.thumbnail || firstItem.svgInner);
                if (rawSvg) {
                    const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><style>.shape{stroke:black;stroke-width:2;fill:none;}text{font-family:Arial;}</style>${rawSvg}</svg>`], {type: 'image/svg+xml;charset=utf-8'});
                    thumbHtml = `<img src="${URL.createObjectURL(blob)}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
                }
            } catch(e){}
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f0f0f0'; 
        tr.setAttribute('data-full-json', encodeURIComponent(JSON.stringify(data)));

        tr.innerHTML = `
            <td style="padding: 6px; text-align:center;">
                <div style="width:75px; height:50px; background:#fdfdfd; border:1px solid #eee; border-radius:3px; overflow:hidden; margin:0 auto;">${thumbHtml}</div>
            </td>
            <td style="padding: 6px; font-weight:bold; color:#2c3e50;">
                <div style="display:flex; align-items:center;">
                    ${typeBadge}
                    <div style="word-break:break-all;">${data.title}</div>
                </div>
                <div style="font-size:10px; color:#8e44ad; font-weight:normal;">(${data.items.length}件)</div>
            </td>
            <td style="padding: 6px; color:#666; font-size:12px; line-height:1.4;">
                <div style="max-height:40px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                    ${data.description || "-"}
                </div>
            </td>
            <td style="padding: 6px; text-align:center; white-space:nowrap;">${statusHtml}</td>
            <td style="padding: 6px; text-align:center; color:#27ae60; font-weight:bold;">${data.downloadCount || 0}</td>
            <td style="padding: 6px; text-align:center; color:#2980b9; font-weight:bold;">${data.replyCount || 0}</td>
            <td style="padding: 6px; text-align:center; font-size:12px; color:#666; white-space:nowrap;">${timeDisplay}</td>
            <td style="padding: 6px; text-align:center;">
                <!-- 操作按鈕垂直堆疊 -->
                <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                    <button onclick="viewGalleryItem(this)" style="width:65px; background:#f1c40f; color:#333; border:none; border-radius:3px; padding:3px 0; cursor:pointer; font-size:12px; font-weight:bold;">🔍 檢視</button>
                    <button onclick="deleteGalleryItem('${data.id}')" style="width:65px; background:white; color:#c0392b; border:1px solid #c0392b; border-radius:3px; padding:2px 0; cursor:pointer; font-size:12px;">🗑️ 刪除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let isFetchingNotifs = false;

window.fetchCloudNotifications = async function() {
    if (!currentUserProfile || !currentUserProfile.email) return false;
    
    // 如果正在抓取中，就不要再發出重複請求
    if (isFetchingNotifs) return false;
    isFetchingNotifs = true;

    try {
        const notifRef = collection(dbFirestore, `users/${currentUserProfile.email}/notifications`);
        const snap = await getDocs(notifRef);
        if (snap.empty) {
            isFetchingNotifs = false;
            return false;
        }

        let addedOrUpdated = false;
        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            const shareId = 'notif-' + docSnap.id;
            
            const existingItem = await db.inbox.where('shareId').equals(shareId).first();
            if (!existingItem) {
                // 本地沒有，新增這筆
                await db.inbox.add({
                    shareId: shareId,
                    title: data.title,
                    type: data.type,
                    providerName: data.providerName || "系統",
                    providerEmail: "",
                    description: data.description || "",
                    postId: data.postId || null, 
                    timestamp: Date.now(),
                    isDownloaded: data.isDownloaded || false, // 同步雲端的初始狀態
                    payload: {} 
                });
                addedOrUpdated = true;
            } else {
                // 本地已經有，檢查雲端的已讀狀態是否與本地不同，進行狀態覆寫
                const cloudReadState = data.isDownloaded || false;
                if (existingItem.isDownloaded !== cloudReadState) {
                    await db.inbox.update(existingItem.id, { isDownloaded: cloudReadState });
                    addedOrUpdated = true;
                }
            }
        }
        
        if (addedOrUpdated && typeof updateInboxBadge === 'function') {
            updateInboxBadge();
        }
        
        isFetchingNotifs = false;
        return addedOrUpdated;
    } catch(e) { 
        console.error("讀取通知失敗:", e); 
        isFetchingNotifs = false;
        return false;
    }
};

window.deleteCloudNotification = async function(docId) {
    if (!currentUserProfile || !currentUserProfile.email) return;
    try {
        await deleteDoc(doc(dbFirestore, `users/${currentUserProfile.email}/notifications`, docId));
    } catch (e) {
        console.warn("無法刪除雲端的通知資料:", e);
    }
};

// 【新增】：更新雲端通知的已讀/未讀狀態
window.updateCloudNotificationState = async function(docId, isRead) {
    if (!currentUserProfile || !currentUserProfile.email) return;
    try {
        const notifRef = doc(dbFirestore, `users/${currentUserProfile.email}/notifications`, docId);
        await updateDoc(notifRef, { isDownloaded: isRead });
    } catch (e) {
        console.warn("無法更新雲端通知狀態:", e);
    }
};

// ----------------------------------------------------
// 【新增】開啟特定發文 (從訊息匣通知連過來)
// ----------------------------------------------------
window.openGalleryPost = async function(postId, inboxId = null) {
    // 1. 如果是從訊息匣點進來，將該訊息標記為已讀 (並同步雲端)
    if (inboxId) {
        if (typeof window.toggleInboxItemReadState === 'function') {
            await window.toggleInboxItemReadState(inboxId, true);
        } else {
            await db.inbox.update(inboxId, { isDownloaded: true });
            if (typeof updateInboxBadge === 'function') updateInboxBadge();
        }
    }

    document.getElementById('inbox-modal').style.display = 'none'; // 關閉訊息匣
    
    try {
        if(typeof statusText !== 'undefined') statusText.innerText = "⏳ 正在讀取原始發文...";
        
        const docRef = doc(dbFirestore, "public_gallery", postId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            data.id = docSnap.id;
            data.timeObj = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date(0);
            data.timeStr = data.timeObj.toLocaleString();
            
            const hasAccess = await checkPasswordAccess(data);
            if (!hasAccess) {
                if(typeof statusText !== 'undefined') statusText.innerText = "就緒。";
                return;
            }

            currentViewingItem = data;
            currentViewingItemIndex = 0; 
            clearReplyAttachment();
            
            document.getElementById('view-modal-title').innerText = (data.type === 'question' ? '📝 ' : '⭐ ') + data.title;
            document.getElementById('view-modal-author').innerHTML = `${window.escapeHTML(data.authorName)}<br><span style="font-size:12px; color:#7f8c8d; font-weight:normal;">${window.escapeHTML(data.authorEmail)}</span>`;
			document.getElementById('view-modal-time').innerText = `📅 ${data.timeStr}`;
			document.getElementById('view-modal-count').innerText = `📦 共 ${data.items.length} 個項目`;

            const parsedItems = data.items.map(i => { try { return JSON.parse(i); } catch(e) { return {}; } });
            const thumbContainer = document.getElementById('view-modal-thumbnails');
            thumbContainer.innerHTML = '';
            
            parsedItems.forEach((item, index) => {
                const rawSvg = data.type === 'question' ? item.illustrationSvg : (item.thumbnail || item.svgInner);
                const itemTitle = item.title || item.name || `項目 ${index + 1}`;
                const safeTitle = itemTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                const encodedText = encodeURIComponent(item.questionText || '');

                if (rawSvg) {
                    const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><style>.shape{stroke:black;stroke-width:2;fill:none;}text{font-family:Arial;}</style>${rawSvg}</svg>`], {type: 'image/svg+xml;charset=utf-8'});
                    const url = URL.createObjectURL(blob);
                    
                    const thumbImg = document.createElement('img');
                    thumbImg.src = url;
                    thumbImg.style.cssText = `width: 60px; height: 60px; object-fit: contain; cursor: pointer; border: 2px solid ${index === 0 ? '#3498db' : '#ddd'}; border-radius: 4px; background: white;`;
                    thumbImg.onclick = () => changeViewMainImage(url, thumbImg, safeTitle, encodedText, index);
                    thumbContainer.appendChild(thumbImg);
                    
                    if (index === 0) changeViewMainImage(url, thumbImg, safeTitle, encodedText, 0);
                }
            });

            loadReplies(data.id);
            document.getElementById('gallery-view-modal').style.display = 'flex';
            if(typeof statusText !== 'undefined') statusText.innerText = "就緒。";

        } else {
            showAlert("❌ 該發文已被刪除或不存在！");
            if(typeof statusText !== 'undefined') statusText.innerText = "就緒。";
        }
    } catch(e) {
        console.error(e);
        showAlert("讀取發文失敗：" + e.message);
    }
};

// ===================================================================
// 🌟 核心新功能：將陣列物件「依序」放入畫布，不夠就自動加新分頁
// ===================================================================
window.insertPayloadsToCanvas = async function(payloads) {
    if (!payloads || payloads.length === 0) return;
    
    // 儲存當前頁面的最新狀態
    if (typeof saveCurrentPageToMemory === 'function') saveCurrentPageToMemory();
    
    let startPageIndex = currentPageIndex;
    
    for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];
        const targetPageIndex = startPageIndex + i;
        
        // 1. 如果目標分頁不存在，自動建立新的空白頁
        while (targetPageIndex >= mathPages.length) {
            if (typeof createEmptyPageData === 'function') {
                mathPages.push(createEmptyPageData());
            }
        }
        
        // 2. 切換到目標頁面 (這會自動將 DOM 切換過去)
        if (currentPageIndex !== targetPageIndex) {
            if (typeof switchPage === 'function') switchPage(targetPageIndex);
        }
        
        // 3. 在當前頁面的畫布中加入圖形
        const rawSvg = payload.illustrationSvg || payload.svgInner || "";
        if (rawSvg) {
            const tempGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            let cleanSvg = rawSvg.trim().replace(/<\/?svg[^>]*>/gi, '');
            tempGroup.innerHTML = cleanSvg;
            
            if (typeof refineImportedGeometry === 'function') refineImportedGeometry(tempGroup);
            
            const finalGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            finalGroup.setAttribute("class", "shape group");
            finalGroup.setAttribute("data-tool", "group");
            
            while (tempGroup.firstChild) finalGroup.appendChild(tempGroup.firstChild);
            
            Array.from(finalGroup.querySelectorAll('*')).forEach(child => {
                if (child.id) child.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            });
            
            document.getElementById('shapes-layer').appendChild(finalGroup);
            
            // 【核心修正】抓取可視區中心，並考慮群組自身的 BBox 來達成完美置中
            let targetX = 400;
            let targetY = 300;
            if (typeof window.getVisibleCanvasCenter === 'function') {
                const center = window.getVisibleCanvasCenter();
                targetX = center.x;
                targetY = center.y;
            }
            
            try {
                const bbox = finalGroup.getBBox();
                if (bbox.width > 0 || bbox.height > 0) {
                    const tx = targetX - (bbox.x + bbox.width / 2);
                    const ty = targetY - (bbox.y + bbox.height / 2);
                    finalGroup.setAttribute("transform", `translate(${tx}, ${ty})`);
                } else {
                    finalGroup.setAttribute("transform", `translate(${targetX}, ${targetY})`);
                }
            } catch(e) {
                finalGroup.setAttribute("transform", `translate(${targetX}, ${targetY})`);
            }
            
            if (typeof deselectAll === 'function') deselectAll();
            if (typeof addToSelection === 'function') addToSelection(finalGroup);
        }
        
        // 4. 在當前頁面的畫布中加入文字
        if (payload.questionText && typeof window.createQuestionTextShape === 'function') {
            window.createQuestionTextShape(payload.questionText, 400, 40);
        }
        
        // 5. 存入歷史紀錄與分頁記憶體
        if (typeof saveState === 'function') saveState();
        if (typeof saveCurrentPageToMemory === 'function') saveCurrentPageToMemory();
    }
    
    // 更新底部頁籤 UI
    if (typeof renderPageTabs === 'function') renderPageTabs();
    if (typeof setMode === 'function') setMode('select');
    
    if(typeof statusText !== 'undefined') statusText.innerText = `✅ 已成功將 ${payloads.length} 個項目依序放入畫布！`;
};

// 放入畫布 (單筆)
document.getElementById('view-modal-place-single-btn').onclick = function() {
    if (!currentViewingItem || currentViewingItemIndex < 0) return;
    const payloadStr = currentViewingItem.items[currentViewingItemIndex];
    const payload = JSON.parse(payloadStr);
    window.insertPayloadsToCanvas([payload]);
    document.getElementById('gallery-view-modal').style.display = 'none';
};

// 放入畫布 (整包 - 觸發分頁邏輯)
document.getElementById('view-modal-place-pkg-btn').onclick = function() {
    if (!currentViewingItem) return;
    const payloads = currentViewingItem.items.map(str => JSON.parse(str));
    window.insertPayloadsToCanvas(payloads);
    document.getElementById('gallery-view-modal').style.display = 'none';
};

window.openCommunityModal = async function() {
    const user = await ensureLogin();
    if (!user) return;
    
    document.getElementById('community-user-info').innerText = `${user.name} (${user.email})`;
    document.getElementById('community-modal').style.display = 'flex';
    document.getElementById('comm-detail-area').style.display = 'none';
    document.getElementById('comm-empty-area').style.display = 'flex';
    
    loadUserCommunities();
};

async function loadUserCommunities() {
    const user = await ensureLogin();
    if (!user) return;

    const listCreated = document.getElementById('comm-list-created');
    const listJoined = document.getElementById('comm-list-joined');
    listCreated.innerHTML = '<div style="padding:10px; color:#999; font-size:12px;">讀取中...</div>';
    listJoined.innerHTML = '<div style="padding:10px; color:#999; font-size:12px;">讀取中...</div>';

    try {
        const commCol = collection(dbFirestore, "communities");
        const q = query(commCol, where("members", "array-contains", user.email));
        const snap = await getDocs(q);
        
        userCommunities =[];
        snap.forEach(doc => {
            const data = doc.data(); data.id = doc.id;
            userCommunities.push(data);
        });

        listCreated.innerHTML = '';
        listJoined.innerHTML = '';

        userCommunities.sort((a,b) => a.name.localeCompare(b.name)); // 按名稱排序

        let createdCount = 0, joinedCount = 0;

        const galleryCol = collection(dbFirestore, "public_gallery");

        for (const comm of userCommunities) {
            const isCreator = comm.creatorEmail === user.email;
            
            // 【核心修正】計算該社群的未讀數量：改用 isPostRead 判斷
            let unreadCount = 0;
            const qPosts = query(galleryCol, where("communityId", "==", comm.id), orderBy("timestamp", "desc"), limit(20));
            const snapPosts = await getDocs(qPosts);
            
            snapPosts.forEach(doc => {
                const data = doc.data();
                if (data.authorEmail !== currentUserProfile.email && !window.isPostRead(doc.id, data.authorEmail)) {
                    unreadCount++;
                }
            });
            
            const badgeHtml = unreadCount > 0 ? `<span class="cloud-badge">${unreadCount}</span>` : '';

            const div = document.createElement('div');
            // 【核心修正】改為 Flex 佈局以容納紅點
            div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.1s;";
            
            div.innerHTML = `
                <div>
                    <strong style="font-size:14px; color:#333;">${comm.name}</strong>
                    <div style="font-size:11px; color:#999; margin-top:3px;">${comm.members.length} 位成員</div>
                </div>
                ${badgeHtml}
            `;
            
            div.onmouseover = () => div.style.background = "#f0f8ff";
            div.onmouseout = () => div.style.background = "transparent";
            div.onclick = () => showCommunityDetail(comm);

            if (isCreator) {
                listCreated.appendChild(div); createdCount++;
            } else {
                listJoined.appendChild(div); joinedCount++;
            }
        }

        if (createdCount === 0) listCreated.innerHTML = '<div style="padding:10px; color:#ccc; font-size:12px;">尚無建立的社群</div>';
        if (joinedCount === 0) listJoined.innerHTML = '<div style="padding:10px; color:#ccc; font-size:12px;">尚無加入的社群</div>';

    } catch (e) { console.error(e); showAlert("讀取社群失敗：" + e.message); }
}

function showCommunityDetail(comm) {
    const user = currentUserProfile;
    document.getElementById('comm-empty-area').style.display = 'none';
    document.getElementById('comm-detail-area').style.display = 'flex';

    document.getElementById('comm-detail-name').innerText = comm.name;
    document.getElementById('comm-detail-desc').innerText = comm.description || "無簡介";
    document.getElementById('comm-detail-creator').innerText = comm.creatorName || comm.creatorEmail;
    document.getElementById('comm-detail-code').innerText = comm.joinCode;
    document.getElementById('comm-detail-count').innerText = `${comm.members.length} 人`;

    const isCreator = comm.creatorEmail === user.email;
    document.getElementById('btn-leave-comm').style.display = isCreator ? 'none' : 'block';
    document.getElementById('btn-delete-comm').style.display = isCreator ? 'block' : 'none';

    // 【核心修正】：傳入回呼函式，讓它知道要回到社群視窗
    document.getElementById('btn-enter-comm-gallery').onclick = () => {
        document.getElementById('community-modal').style.display = 'none';
        openGalleryModal(comm.id, comm.name, window.openCommunityModal);
    };

    document.getElementById('btn-leave-comm').onclick = () => executeLeaveCommunity(comm.id, comm.name);
    document.getElementById('btn-delete-comm').onclick = () => executeDeleteCommunity(comm.id, comm.name);

    const memList = document.getElementById('comm-members-list');
    memList.innerHTML = '';
    comm.members.forEach(email => {
        const isMe = email === user.email;
        const tag = isMe ? '<span style="color:#2ecc71; font-size:11px;">(我)</span>' : '';
        const kickBtn = (isCreator && !isMe) ? `<button onclick="executeKickMember('${comm.id}', '${email}')" style="background:transparent; border:none; color:#c0392b; cursor:pointer;" title="踢出成員">✕</button>` : '';
        
        memList.innerHTML += `
            <div style="display:flex; justify-content:space-between; padding: 6px 10px; background: #fff; border: 1px solid #eee; border-radius: 4px;">
                <span style="font-size:14px; color:#555;">${email} ${tag}</span>
                ${kickBtn}
            </div>
        `;
    });
}

window.promptCreateCommunity = function() {
    document.getElementById('comm-create-name').value = '';
    document.getElementById('comm-create-desc').value = '';
    // 隨機產生 6 碼大寫英數
    document.getElementById('comm-create-code').value = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('comm-create-modal').style.display = 'flex';
};

window.executeCreateCommunity = async function() {
    const user = currentUserProfile;
    const name = document.getElementById('comm-create-name').value.trim();
    const desc = document.getElementById('comm-create-desc').value.trim();
    const code = document.getElementById('comm-create-code').value.trim().toUpperCase();

    if (!name || code.length !== 6) {
        showAlert("請輸入社群名稱，並確認代碼為 6 碼！");
        return;
    }

    try {
        const commCol = collection(dbFirestore, "communities");
        
        // 檢查名稱是否重複
        const q = query(commCol, where("name", "==", name));
        const snap = await getDocs(q);
        if (!snap.empty) {
            showAlert("❌ 此社群名稱已存在，請更換一個名稱！");
            return;
        }

        await addDoc(commCol, {
            name: name,
            description: desc,
            joinCode: code,
            creatorEmail: user.email,
            creatorName: user.name,
            members: [user.email], // 建立者自動成為第一個成員
            timestamp: serverTimestamp()
        });

        document.getElementById('comm-create-modal').style.display = 'none';
        showAlert("✅ 社群建立成功！將代碼分享給學生即可讓他們加入。");
        loadUserCommunities();

    } catch(e) {
        showAlert("建立失敗：" + e.message);
    }
};
// 【新增】：步驟一，開啟搜尋對話框
window.promptSearchCommunity = function() {
    document.getElementById('comm-search-modal').style.display = 'flex';
    document.getElementById('comm-search-keyword').value = '';
    document.getElementById('comm-search-results').innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">請輸入關鍵字後按搜尋</div>';
};

// 【新增】：步驟一，執行搜尋
window.executeSearchCommunity = async function() {
    const keyword = document.getElementById('comm-search-keyword').value.trim();
    if (!keyword) { showAlert("請輸入關鍵字！"); return; }
    
    const resultsContainer = document.getElementById('comm-search-results');
    resultsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">搜尋中...</div>';

    try {
        const commCol = collection(dbFirestore, "communities");
        const snap = await getDocs(commCol); // 取得所有社群
        
        let results = [];
        snap.forEach(doc => {
            const data = doc.data();
            if (data.name.toLowerCase().includes(keyword.toLowerCase())) {
                results.push({ id: doc.id, ...data });
            }
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">找不到符合的社群</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        results.forEach(comm => {
            const div = document.createElement('div');
            div.style.cssText = "padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.1s;";
            div.onmouseover = () => div.style.background = '#eaf2f8';
            div.onmouseout = () => div.style.background = 'transparent';
            div.innerHTML = `<strong>${comm.name}</strong><br><span style="font-size:12px; color:#888;">建立者：${comm.creatorName || comm.creatorEmail}</span>`;
            
            // 點擊後觸發步驟二
            div.onclick = () => promptEnterJoinCode(comm);
            resultsContainer.appendChild(div);
        });

    } catch (e) {
        resultsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #c0392b;">搜尋失敗，請檢查網路連線。</div>';
    }
};

// 【新增】：步驟二，彈出輸入代碼的視窗
window.promptEnterJoinCode = function(communityData) {
    if (communityData.members.includes(currentUserProfile.email)) {
        showAlert("您已經在這個社群中了！");
        return;
    }

    openNumberInputModal(`請輸入「${communityData.name}」的加入代碼：`, "", (code) => {
        if (code) {
            executeJoinCommunity(communityData, code.trim().toUpperCase());
        }
    });
};

window.executeJoinCommunity = async function(communityData, joinCode) {
    const user = currentUserProfile;
    try {
        if (communityData.joinCode !== joinCode) {
            showAlert("❌ 加入代碼錯誤！");
            return;
        }

        const docRef = doc(dbFirestore, "communities", communityData.id);
        const newMembers = [...communityData.members, user.email];
        await updateDoc(docRef, { members: newMembers });

        document.getElementById('comm-search-modal').style.display = 'none';
        showAlert(`✅ 成功加入「${communityData.name}」！`);
        loadUserCommunities();

    } catch(e) {
        showAlert("加入失敗：" + e.message);
    }
};

window.executeLeaveCommunity = async function(commId, commName) {
    const user = currentUserProfile;
    showConfirm(`確定要退出「${commName}」嗎？\n退出後您將無法查看社群貼文，也不會收到新回覆通知。`, async () => {
        try {
            const docRef = doc(dbFirestore, "communities", commId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const members = snap.data().members;
                const newMembers = members.filter(email => email !== user.email);
                await updateDoc(docRef, { members: newMembers });
                
                document.getElementById('comm-detail-area').style.display = 'none';
                document.getElementById('comm-empty-area').style.display = 'flex';
                loadUserCommunities();
                showAlert("已退出社群。");
            }
        } catch(e) { showAlert("退出失敗：" + e.message); }
    });
};

window.executeKickMember = async function(commId, targetEmail) {
    showConfirm(`確定要將 ${targetEmail} 踢出社群嗎？`, async () => {
        try {
            const docRef = doc(dbFirestore, "communities", commId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const members = snap.data().members;
                const newMembers = members.filter(email => email !== targetEmail);
                await updateDoc(docRef, { members: newMembers });
                
                loadUserCommunities(); // 重新整理
                // 因為畫面會重刷，我們需要重新顯示 Detail 區塊
                setTimeout(() => {
                    const updatedComm = userCommunities.find(c => c.id === commId);
                    if (updatedComm) showCommunityDetail(updatedComm);
                }, 500);
            }
        } catch(e) { showAlert("操作失敗：" + e.message); }
    });
};

window.executeDeleteCommunity = async function(commId, commName) {
    showConfirm(`⚠️ 危險操作：確定要【解散】「${commName}」嗎？\n此社群內的所有專屬貼文也會一併被刪除，且無法復原！`, async () => {
        try {
            // 1. 刪除該社群下的所有貼文
            const galleryCol = collection(dbFirestore, "public_gallery");
            const q = query(galleryCol, where("communityId", "==", commId));
            const snap = await getDocs(q);
            
            for (const docSnap of snap.docs) {
                // 註：若有回覆(replies子集合) Firebase不支援直接遞迴刪除，必須用 Cloud Function，或留著當孤兒資料
                await deleteDoc(docSnap.ref);
            }

            // 2. 刪除社群主檔
            await deleteDoc(doc(dbFirestore, "communities", commId));
            
            document.getElementById('comm-detail-area').style.display = 'none';
            document.getElementById('comm-empty-area').style.display = 'flex';
            loadUserCommunities();
            showAlert("✅ 社群已解散。");

        } catch(e) { showAlert("解散失敗：" + e.message); }
    });
};
window.openAdminPanel = async function() {
    const user = await ensureLogin();
    if (!user || !user.isAdmin) { showAlert("權限不足！"); return; }
    document.getElementById('admin-modal').style.display = 'flex';
    switchAdminTab('communities');
    loadAdminData();
};

window.switchAdminTab = function(tab) {
    document.getElementById('tab-btn-communities').classList.remove('active');
    document.getElementById('tab-btn-ghosts').classList.remove('active');
    document.getElementById('admin-content-communities').style.display = 'none';
    document.getElementById('admin-content-ghosts').style.display = 'none';

    document.getElementById(`tab-btn-${tab}`).classList.add('active');
    document.getElementById(`admin-content-${tab}`).style.display = 'flex';
};

window.loadAdminData = async function() {
    const tbody = document.getElementById('admin-communities-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">讀取中...</td></tr>';
    
    try {
        const commCol = collection(dbFirestore, "communities");
        const snap = await getDocs(commCol);
        tbody.innerHTML = '';
        if (snap.empty) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">目前沒有任何社群。</td></tr>'; return; }

        snap.forEach(doc => {
            const data = doc.data();
            tbody.innerHTML += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px; font-family:monospace; color:#8e44ad; font-weight:bold;">${data.joinCode}</td>
                    <td style="padding:10px; font-weight:bold;">${data.name}</td>
                    <td style="padding:10px; font-size:12px; color:#555;">${data.creatorName}<br>(${data.creatorEmail})</td>
                    <td style="padding:10px;">${(data.members ||[]).length} 人</td>
                    <td style="padding:10px;">
                        <button onclick="adminForceDeleteCommunity('${doc.id}', '${data.name}')" style="background:#c0392b; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:12px;">強制作廢</button>
                    </td>
                </tr>
            `;
        });
    } catch(e) { tbody.innerHTML = `<tr><td colspan="5" style="color:red;">錯誤: ${e.message}</td></tr>`; }
};

window.adminForceDeleteCommunity = async function(id, name) {
    showConfirm(`⚠️ 確定強制作廢社群「${name}」嗎？\n資料庫將直接移除該節點。`, async () => {
        try {
            await deleteDoc(doc(dbFirestore, "communities", id));
            loadAdminData();
            showAlert("✅ 社群已作廢。建議執行幽靈清理以移除孤兒貼文。");
        } catch(e) { showAlert("刪除失敗：" + e.message); }
    });
};

const adminLog = (msg) => {
    const logBox = document.getElementById('admin-ghost-log');
    logBox.innerHTML += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
    logBox.scrollTop = logBox.scrollHeight;
};

window.scanAndCleanGhostData = async function() {
    const btn = document.getElementById('btn-scan-ghost');
    const logBox = document.getElementById('admin-ghost-log');
    btn.disabled = true;
    logBox.innerHTML = "啟動掃描程序...\n=============================";

    try {
        adminLog("1. 取得所有合法社群名單...");
        const commSnap = await getDocs(collection(dbFirestore, "communities"));
        const validCommIds = new Set();
        commSnap.forEach(d => validCommIds.add(d.id));
        adminLog(`-> 找到 ${validCommIds.size} 個合法社群。`);

        adminLog("\n2. 掃描所有公開/社群貼文...");
        const gallerySnap = await getDocs(collection(dbFirestore, "public_gallery"));
        let deletedPosts = 0;

        for (const docSnap of gallerySnap.docs) {
            const data = docSnap.data();
            const cid = data.communityId;
            // 若貼文綁定社群，但該社群已不存在
            if (cid && cid !== "" && !validCommIds.has(cid)) {
                adminLog(`-> 發現幽靈貼文: [${data.title}] (原社群遺失)，執行刪除...`);
                // 先刪除其底下的回覆
                const repSnap = await getDocs(collection(dbFirestore, `public_gallery/${docSnap.id}/replies`));
                for (const r of repSnap.docs) await deleteDoc(r.ref);
                // 刪除貼文
                await deleteDoc(docSnap.ref);
                deletedPosts++;
            }
        }
        
        adminLog(`\n=============================\n清理完成！共移除了 ${deletedPosts} 篇幽靈貼文。`);

    } catch(e) {
        adminLog(`\n❌ 發生嚴重錯誤: ${e.message}`);
    } finally {
        btn.disabled = false;
    }
};
// 1. 檢查 AI 額度與冷卻狀態
window.checkAiQuota = async function() {
    const user = await ensureLogin();
    if (!user) return null;

    const userRef = doc(dbFirestore, "users", user.email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;
    const data = userSnap.data();

    const quota = data.aiQuota !== undefined ? data.aiQuota : 2; // 預設終身2次
    const used = data.aiUsed || 0;
    const fails = data.aiFails || 0;

    let allowed = true;
    let reason = "";

    // 檢查冷卻時間
    if (data.aiCooldownUntil) {
        const cooldownTime = data.aiCooldownUntil.toDate().getTime();
        if (Date.now() < cooldownTime) {
            allowed = false;
            const minutesLeft = Math.ceil((cooldownTime - Date.now()) / 60000);
            reason = `❌ 失敗次數過多，冷卻中。\n請於 ${minutesLeft} 分鐘後再試。`;
        } else {
            // 冷卻已結束，重置失敗次數
            await updateDoc(userRef, { aiCooldownUntil: null, aiFails: 0 });
        }
    }

    // 檢查額度 (若已在冷卻中則不需覆蓋原因)
    if (allowed && used >= quota) {
        allowed = false;
        reason = `❌ 您的 AI 辨識次數已達上限 (${used}/${quota}次)。\n請聯繫管理員申請擴充額度。`;
    }

    return { allowed, used, quota, reason, fails };
};

// 2. AI 成功：扣除額度、重置失敗、寫入 Log
window.logAiSuccess = async function() {
    const user = currentUserProfile;
    if (!user) return;
    const userRef = doc(dbFirestore, "users", user.email);
    
    // 更新使用者狀態
    await updateDoc(userRef, {
        aiUsed: increment(1),
        aiFails: 0,
        aiCooldownUntil: null
    });
    
    // 寫入紀錄
    await addDoc(collection(dbFirestore, "ai_logs"), {
        userEmail: user.email,
        userName: user.name,
        timestamp: serverTimestamp(),
        type: "AI 辨識成功"
    });
};

// 3. AI 失敗：累計失敗次數，滿3次觸發冷卻
window.logAiFail = async function() {
    const user = currentUserProfile;
    if (!user) return null;
    
    const userRef = doc(dbFirestore, "users", user.email);
    const userSnap = await getDoc(userRef);
    const fails = (userSnap.data().aiFails || 0) + 1;

    let updates = { aiFails: fails };
    let cooldownMsg = "";
    
    if (fails >= 3) {
        const cooldownEnd = new Date(Date.now() + 3600000); // 1 小時後
        updates.aiCooldownUntil = cooldownEnd;
        updates.aiFails = 0;
        cooldownMsg = "❌ 連續辨識失敗達 3 次！系統已暫停您的 AI 使用權限 1 小時。";
    }
    
    await updateDoc(userRef, updates);
    return cooldownMsg;
};

// 4. 重寫後台 Tab 切換功能
window.switchAdminTab = function(tab) {
    document.getElementById('tab-btn-communities').classList.remove('active');
    document.getElementById('tab-btn-ghosts').classList.remove('active');
    document.getElementById('tab-btn-ai').classList.remove('active');
    
    document.getElementById('admin-content-communities').style.display = 'none';
    document.getElementById('admin-content-ghosts').style.display = 'none';
    document.getElementById('admin-content-ai').style.display = 'none';

    document.getElementById(`tab-btn-${tab}`).classList.add('active');
    document.getElementById(`admin-content-${tab}`).style.display = 'flex';

    if (tab === 'ai') loadAdminAiUsers();
};

// 5. 後台：載入使用者 AI 額度列表
window.loadAdminAiUsers = async function() {
    const tbody = document.getElementById('admin-ai-users-tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">載入中...</td></tr>';
    try {
        const snap = await getDocs(collection(dbFirestore, "users"));
        tbody.innerHTML = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const quota = data.aiQuota !== undefined ? data.aiQuota : 2;
            const used = data.aiUsed || 0;
            const cooldown = (data.aiCooldownUntil && data.aiCooldownUntil.toDate().getTime() > Date.now()) 
                ? `<span style="color:#e74c3c; font-weight:bold;">(冷卻中)</span>` : "";
            
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding:10px;"><strong>${data.name}</strong><br><span style="font-size:12px;color:#7f8c8d;">${docSnap.id}</span></td>
                    <td style="padding:10px; font-size:16px;">${used} / ${quota} ${cooldown}</td>
                    <td style="padding:10px;">
                        <button class="btn-modal" onclick="updateUserAiQuota('${docSnap.id}', ${quota})" style="background:#2980b9; color:white; padding:6px 12px; font-weight:bold;">修改上限</button>
                    </td>
                </tr>
            `;
        });
    } catch(e) { tbody.innerHTML = `<tr><td colspan="3">錯誤: ${e.message}</td></tr>`; }
};

// 6. 後台：修改特定使用者額度
window.updateUserAiQuota = function(email, currentQuota) {
    openNumberInputModal(`請輸入 ${email} 的新 AI 次數上限：`, currentQuota.toString(), async (val) => {
        const newQuota = parseInt(val);
        if (!isNaN(newQuota) && newQuota >= 0) {
            try {
                await updateDoc(doc(dbFirestore, "users", email), { aiQuota: newQuota });
                showAlert("✅ 額度上限修改成功！");
                loadAdminAiUsers();
            } catch(e) { showAlert("修改失敗: " + e.message); }
        }
    });
};

// 7. 後台：查詢指定日期範圍的 Log
window.loadAdminAiLogs = async function() {
    const startInput = document.getElementById('ai-log-start').value;
    const endInput = document.getElementById('ai-log-end').value;
    const tbody = document.getElementById('admin-ai-logs-tbody');
    const totalDiv = document.getElementById('ai-log-total');

    if (!startInput || !endInput) { showAlert("請先選擇完整的日期範圍！"); return; }

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">資料查詢中...</td></tr>';
    totalDiv.innerText = "查詢中...";

    try {
        const startDate = new Date(startInput + "T00:00:00");
        const endDate = new Date(endInput + "T23:59:59");

        const logsCol = collection(dbFirestore, "ai_logs");
        // 需注意：如果您第一次執行範圍查詢，Firebase Console 會跳出黃色警告要求建立 Index，點擊連結建立即可
        const q = query(logsCol, where("timestamp", ">=", startDate), where("timestamp", "<=", endDate), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);

        totalDiv.innerText = `共計 ${snap.size} 次辨識`;
        tbody.innerHTML = '';

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#7f8c8d;">此範圍內無使用紀錄。</td></tr>';
            return;
        }

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const timeStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : '';
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding:10px; color:#555;">${timeStr}</td>
                    <td style="padding:10px;"><strong>${data.userName}</strong><br><span style="font-size:12px; color:#7f8c8d;">${data.userEmail}</span></td>
                    <td style="padding:10px; color:#27ae60; font-weight:bold;">${data.type}</td>
                </tr>
            `;
        });
    } catch(e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="3" style="color:#c0392b; padding:20px;">錯誤: ${e.message}<br>(若是初次查詢，請按 F12 打開 Console 點擊 Firebase 的建立 Index 連結)</td></tr>`;
        totalDiv.innerText = "";
    }
};

// ==========================================
// 輔助工具：跳脫 HTML 字元防 XSS 與破版
// ==========================================
window.escapeHTML = function(str) {
    if (!str) return "";
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
};

// ==========================================
// 輔助工具：顯示/隱藏全域數學輔助面板
// ==========================================
window.showMathPanelsForGallery = function() {
    const mathP = document.getElementById('math-helper-panel');
    const formP = document.getElementById('formula-library-panel');
    
    // 【修復】確保右側數學符號面板被初始化 (如果還沒初始化的話)
    if (typeof initMathV2Assets === 'function' && !window.isMathV2Init) {
        initMathV2Assets();
    }

    // 強制提高 z-index 蓋過大廳遮罩
    if(mathP) { mathP.style.display = 'flex'; mathP.style.zIndex = '10000'; }
    if(formP) {
        formP.style.display = 'flex'; formP.style.zIndex = '10000';
        if (!window.isFormulaLibraryInit && typeof window.renderFormulaLibrary === 'function') { 
            window.renderFormulaLibrary(); 
            window.isFormulaLibraryInit = true; 
        }
    }
};


window.hideMathPanelsForGallery = function() {
    const mathP = document.getElementById('math-helper-panel');
    const formP = document.getElementById('formula-library-panel');
    if(mathP) mathP.style.display = 'none';
    if(formP) formP.style.display = 'none';
    window.lastFocusedInput = null; // 清除對焦紀錄
};

// ==========================================
// 預覽更新邏輯 (綁定到 index.html 的 oninput)
// ==========================================
window.previewNewPostMath = function() {
    const title = document.getElementById('new-post-title').value;
    const desc = document.getElementById('new-post-desc').value;
    const previewEl = document.getElementById('new-post-math-preview');
    if (!title && !desc) {
        previewEl.innerHTML = "<span style='color:#ccc;'>輸入標題或內容後即時預覽...</span>";
        return;
    }
    // 呼叫 formatSmartMathText 或自行轉譯
    const formattedTitle = window.formatSmartMathText ? window.formatSmartMathText(window.escapeHTML(title)) : window.escapeHTML(title);
    const formattedDesc = window.formatSmartMathText ? window.formatSmartMathText(window.escapeHTML(desc)) : window.escapeHTML(desc).replace(/\n/g, '<br>');
    
    previewEl.innerHTML = `<div style="font-weight:bold; font-size:16px; margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:5px;">${formattedTitle}</div><div style="font-size:14px;">${formattedDesc}</div>`;
    if(window.MathJax) MathJax.typesetPromise([previewEl]).catch(e=>{});
};

window.previewReplyMath = function() {
    const content = document.getElementById('gallery-reply-input').value;
    const previewEl = document.getElementById('reply-math-preview');
    if (!content) {
        previewEl.style.display = 'none';
        return;
    }
    previewEl.style.display = 'block';
    const formattedContent = window.formatSmartMathText ? window.formatSmartMathText(window.escapeHTML(content)) : window.escapeHTML(content).replace(/\n/g, '<br>');
    previewEl.innerHTML = formattedContent;
    if(window.MathJax) MathJax.typesetPromise([previewEl]).catch(e=>{});
};

// ==========================================
// 覆寫：在發文與檢視時叫出面板
// ==========================================
const originalOpenNewPostModal = window.openNewPostModal;
window.openNewPostModal = async function() {
    const user = await ensureLogin();
    if (!user) return;

    document.getElementById('new-post-title').value = "";
    
    // 【修復 3】讀取暱稱時，綁定專屬 Email
    document.getElementById('new-post-author').value = localStorage.getItem('math_editor_author_name_' + user.email) || user.name;
    
    document.getElementById('new-post-desc').value = "";
    clearNewPostAttachment();

    const selectEl = document.getElementById('new-post-target-community');
    selectEl.innerHTML = '<option value="">🌍 公共大廳 (所有人可見)</option>';
    
    const commCol = collection(dbFirestore, "communities");
    const q = query(commCol, where("members", "array-contains", user.email));
    try {
        const snap = await getDocs(q);
        snap.forEach(doc => {
            const data = doc.data();
            selectEl.appendChild(new Option(`👥 ${data.name}`, doc.id));
        });
    } catch(e) { console.warn("載入發布社群失敗", e); }
    
    if (typeof currentGalleryCommunityId !== 'undefined' && currentGalleryCommunityId) {
        selectEl.value = currentGalleryCommunityId;
    }

    document.getElementById('gallery-new-post-modal').style.display = 'flex';

    window.showMathPanelsForGallery();
    window.previewNewPostMath(); 
};

const originalViewGalleryItem = window.viewGalleryItem;
window.viewGalleryItem = async function(btnElement) {
    await originalViewGalleryItem(btnElement);
    
    // 【修改】將視窗內的標題與說明也進行跳脫並呼叫 MathJax
    if (currentViewingItem) {
        const titleEl = document.getElementById('view-modal-title');
        const descEl = document.getElementById('view-modal-desc');
        
        const safeTitle = window.escapeHTML(currentViewingItem.title);
        const safeDesc = window.escapeHTML(currentViewingItem.description || "無詳細說明");
        
        titleEl.innerHTML = (currentViewingItem.type === 'question' ? '📝 ' : '⭐ ') + (window.formatSmartMathText ? window.formatSmartMathText(safeTitle) : safeTitle);
        descEl.innerHTML = window.formatSmartMathText ? window.formatSmartMathText(safeDesc) : safeDesc.replace(/\n/g, '<br>');
        
        if (window.MathJax) {
            MathJax.typesetPromise([titleEl, descEl]).catch(e=>{});
        }
    }
    
    document.getElementById('reply-math-preview').style.display = 'none';
    document.getElementById('gallery-reply-input').value = "";
    
    window.showMathPanelsForGallery();
};

const originalOpenGalleryPost = window.openGalleryPost;
window.openGalleryPost = async function(postId, inboxId = null) {
    await originalOpenGalleryPost(postId, inboxId);
    
    if (currentViewingItem) {
        const titleEl = document.getElementById('view-modal-title');
        const descEl = document.getElementById('view-modal-desc');
        const safeTitle = window.escapeHTML(currentViewingItem.title);
        const safeDesc = window.escapeHTML(currentViewingItem.description || "無詳細說明");
        titleEl.innerHTML = (currentViewingItem.type === 'question' ? '📝 ' : '⭐ ') + (window.formatSmartMathText ? window.formatSmartMathText(safeTitle) : safeTitle);
        descEl.innerHTML = window.formatSmartMathText ? window.formatSmartMathText(safeDesc) : safeDesc.replace(/\n/g, '<br>');
        if (window.MathJax) MathJax.typesetPromise([titleEl, descEl]).catch(e=>{});
    }
    
    document.getElementById('reply-math-preview').style.display = 'none';
    document.getElementById('gallery-reply-input').value = "";
    window.showMathPanelsForGallery();
};