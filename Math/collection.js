// 1. 初始化 Dexie 資料庫
const db = new Dexie("MathEditorDB");

// 定義 Schema
db.version(1).stores({
    favorites: "++id, name, timestamp"
});

// 版本 2: 加入分類功能
db.version(2).stores({
    favorites: "++id, name, category, timestamp",
    categories: "++id, &name" 
}).upgrade(tx => {
    return tx.favorites.toCollection().modify(item => {
        item.category = '未分類';
    });
});

// 【核心修正】版本 4: 強制建立 recentFiles 資料表
// (跳過版本 3 直接到 4，確保瀏覽器一定會觸發升級事件)
db.version(4).stores({
    favorites: "++id, name, category, timestamp",
    categories: "++id, &name",
    recentFiles: "++id, name, timestamp" // 這裡儲存最近開啟的檔案
});

db.version(5).stores({
    favorites: "++id, name, category, timestamp",
    categories: "++id, &name",
    recentFiles: "++id, name, timestamp",
    questions: "++id, title, category, questionText, illustrationSvg, timestamp" 
});

db.version(6).stores({
    favorites: "++id, name, category, timestamp",
    categories: "++id, &name",
    recentFiles: "++id, name, timestamp",
    questions: "++id, title, category, questionText, illustrationSvg, timestamp",
    inbox: "++id, shareId, title, type, timestamp, isDownloaded, payload" 
});

// 全域變數
let currentCategory = '未分類';
let libraryItems = []; // 暫存目前檢視的項目
let categoriesCache = [];
let searchRequestId = 0;
let previewingItemData = null;
let lastInputName = "";
let lastInputCategory = "";

// --- 初始化與事件 ---
document.addEventListener('DOMContentLoaded', () => {
    ensureDefaultCategories();
    
    // Enter 鍵綁定 (命名視窗)
    const nameInput = document.getElementById('favorite-name-input');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmFloatingSave();
            }
        });
    }
});

// 確保有預設分類
async function ensureDefaultCategories() {
    try {
        const count = await db.categories.count();
        if (count === 0) {
            await db.categories.add({ name: '未分類' });
            await db.categories.add({ name: '幾何圖形' });
            await db.categories.add({ name: '函數圖形' });
            await db.categories.add({ name: '立體圖形' });
            await db.categories.add({ name: '統計圖形' });		
        }
    } catch (e) {
        // 捕捉並忽略啟動瞬間可能發生的 Dexie 錯誤
        console.warn("初始化預設分類時發生錯誤 (可能資料庫正處於更新狀態，可忽略):", e);
    }
}
// --- Modal 控制 ---

function openLibraryModal() {
    // 關閉舊的下拉 (如果有的話)
    const dropdown = document.getElementById('collection-dropdown');
    if(dropdown) dropdown.style.display = 'none';

    const modal = document.getElementById('library-modal');
    modal.style.display = 'flex';
    
    // 重置選取狀態
    selectedLibraryIds.clear();
    updateLibraryBatchUI();
    
    // 載入資料
    renderCategories();
    renderLibraryItems(currentCategory);
}

function closeLibraryModal() {
    document.getElementById('library-modal').style.display = 'none';
}

// --- 分類管理 ---

async function renderCategories() {
    const list = document.getElementById('lib-category-list');
    list.innerHTML = '';
    
    categoriesCache = await db.categories.toArray();
    // 確保 "未分類" 總是在最上面 (如果它存在)
    categoriesCache.sort((a, b) => {
        if(a.name === '未分類') return -1;
        if(b.name === '未分類') return 1;
        return a.name.localeCompare(b.name);
    });

    for (const cat of categoriesCache) {
        // 計算該分類下的數量
        const count = await db.favorites.where('category').equals(cat.name).count();
        
        const div = document.createElement('div');
        div.className = `category-item ${currentCategory === cat.name ? 'active' : ''}`;
        div.innerHTML = `
            <span>${cat.name}</span>
            <span class="cat-count">${count}</span>
        `;
        div.onclick = () => {
            currentCategory = cat.name;
            document.getElementById('lib-search').value = ""; // 切換分類時清空搜尋
            renderCategories(); // 重新渲染以更新 active 狀態
            renderLibraryItems(currentCategory);
        };
        list.appendChild(div);
    }

    // 控制「刪除分類」按鈕的顯示 (未分類不可刪除)
    const btnDel = document.getElementById('btn-del-cat');
    if(btnDel) {
        btnDel.style.display = (currentCategory === '未分類') ? 'none' : 'block';
    }
}

function createNewCategory() {
    // 使用 utils.js 中的 openNumberInputModal (雖然它叫 NumberInput，但您的實作支援 text type)
    // 參數: Title, DefaultValue, Callback
    openNumberInputModal("請輸入新分類名稱", "", async (val) => {
        const name = val ? val.trim() : "";
        if (name) {
            try {
                // 檢查是否重複
                const exist = await db.categories.where('name').equals(name).count();
                if (exist > 0) {
                    showAlert("分類名稱已存在");
                    return;
                }
                await db.categories.add({ name: name });
                renderCategories();
				if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
            } catch (e) {
                showAlert("建立分類失敗：" + e.message);
            }
        }
    });
}

async function deleteCurrentCategory() {
    if (currentCategory === '未分類') return;

    const count = await db.favorites.where('category').equals(currentCategory).count();
    
    // 如果分類內有東西，詢問處理方式
    if (count > 0) {
        // 選項視窗已經在 utils.js 提高了 z-index，這裡可以正常顯示
        openExclusiveOptionsModal(
            `分類「${currentCategory}」內有 ${count} 個素材，您要？`,
            [
                { label: "刪除分類，並刪除所有內容", checked: false },
                { label: "刪除分類，將內容移至「未分類」", checked: true }
            ],
            async (results) => {
                const deleteAll = results[0];
                const moveToUncategorized = results[1];

                if (deleteAll) {
                    await db.favorites.where('category').equals(currentCategory).delete();
                    await db.categories.where('name').equals(currentCategory).delete();
                } else if (moveToUncategorized) {
                    await db.favorites.where('category').equals(currentCategory).modify({ category: '未分類' });
                    await db.categories.where('name').equals(currentCategory).delete();
                }
                
                currentCategory = '未分類';
                renderCategories();
                renderLibraryItems('未分類');
				if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
            }
        );
    } else {
        // 空分類使用自定義 Confirm
        showConfirm(`確定刪除空分類「${currentCategory}」嗎？`, async () => {
            await db.categories.where('name').equals(currentCategory).delete();
            currentCategory = '未分類';
            renderCategories();
            renderLibraryItems('未分類');
        });
    }
}

// --- 素材檢視與管理 ---
async function renderLibraryItems(category, filterText = "", scope = "global") {
    // 1. 產生新的請求 ID，並鎖定當前執行緒的 ID
    const currentReqId = ++searchRequestId;

    const grid = document.getElementById('lib-item-grid');
    const emptyMsg = document.getElementById('lib-empty-msg');

    let items =[];

    // 2. 根據搜尋範圍查詢資料庫
    if (filterText.trim() !== "") {
        const lowerText = filterText.toLowerCase();
        
        if (scope === 'global') {
            items = await db.favorites.filter(item => {
                const tagStr = (item.tags ||[]).join(' ').toLowerCase();
                return item.name.toLowerCase().includes(lowerText) || tagStr.includes(lowerText);
            }).reverse().toArray();
        } else {
            items = await db.favorites.filter(item => {
                const tagStr = (item.tags ||[]).join(' ').toLowerCase();
                return item.category === category && (item.name.toLowerCase().includes(lowerText) || tagStr.includes(lowerText));
            }).reverse().toArray();
        }
    } else {
        items = await db.favorites.where('category').equals(category).reverse().toArray();
    }

    // 3. 【關鍵修復】檢查這是否是最新的請求
    if (currentReqId !== searchRequestId) return;

    // 4. 更新 UI
    grid.innerHTML = ''; 
    libraryItems = items; 

    if (items.length === 0) {
        emptyMsg.style.display = 'flex';
        emptyMsg.innerHTML = filterText ? `<div style="font-size:48px; margin-bottom:10px;">🔍</div><div>找不到「${filterText}」</div>` : `<div style="font-size:48px; margin-bottom:10px;">📭</div><div>此分類尚無素材</div>`;
        
        grid.style.display = 'none';
        document.getElementById('lib-select-all').checked = false;
        document.getElementById('lib-select-all').disabled = true;
    } else {
        emptyMsg.style.display = 'none';
        grid.style.display = 'grid';
        document.getElementById('lib-select-all').disabled = false;
        
        const allSelected = items.length > 0 && items.every(i => selectedLibraryIds.has(i.id));
        document.getElementById('lib-select-all').checked = allSelected;

        const fragment = document.createDocumentFragment();
		items.forEach(item => {
			const isSelected = selectedLibraryIds.has(item.id);
			const card = document.createElement('div');
			card.className = `lib-card ${isSelected ? 'selected' : ''}`;
			
			const blob = new Blob([item.thumbnail], {type: 'image/svg+xml;charset=utf-8'});
			const url = URL.createObjectURL(blob);

			const showCatTag = (scope === 'global' && filterText !== "");
			const catTagHtml = showCatTag ? `<div class="lib-card-cat-tag">${item.category}</div>` : '';
            
            const tagsDisplay = (item.tags && item.tags.length > 0) 
                ? `<div style="padding: 4px 8px; font-size: 11px; color: #8e44ad; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.tags.map(t=>'#'+t).join(' ')}</div>` 
                : '';

			card.innerHTML = `
				<input type="checkbox" class="lib-card-check" ${isSelected ? 'checked' : ''}>
				<div class="lib-card-thumb">
					<img src="${url}">
				</div>
				${catTagHtml}
				<div class="lib-card-info" title="${item.name}" style="padding-bottom:0;">${item.name}</div>
                ${tagsDisplay}
				<div class="lib-card-actions">
					<div class="lib-btn-mini" title="插入畫布並關閉" onclick="insertItemFromCard(${item.id}, event)">📥</div>
					<div class="lib-btn-mini lib-btn-del" title="刪除" onclick="deleteSingleItem(${item.id}, event)">🗑️</div>
				</div>
			`;

			card.onclick = (e) => {
				if (e.target.tagName === 'INPUT' || e.target.closest('.lib-btn-mini')) {
					if (e.target.tagName === 'INPUT') toggleLibrarySelection(item.id);
					return;
				}
				openLibraryPreview(item.id);
			};
			
			fragment.appendChild(card);
		});
			
		grid.appendChild(fragment);
    }
    
    updateLibraryBatchUI();
}

function filterLibraryItems() {
    const text = document.getElementById('lib-search').value;
    // 讀取 radio 選項：全域或分類
    const scopeEl = document.querySelector('input[name="search-scope"]:checked');
    const scope = scopeEl ? scopeEl.value : 'global';
    
    renderLibraryItems(currentCategory, text, scope);
}

function insertItemFromCard(id, e) {
    if(e) e.stopPropagation();
    db.favorites.get(id).then(item => {
        if(item) {
            lastInputName = item.name;
            lastInputCategory = item.category;			
            insertFromCollection(item.svgInner, item.name, item.category);
            
            if(typeof statusText !== 'undefined') statusText.innerText = `✅ 已插入圖形：${item.name}`;

            // 【新增】關閉圖庫視窗
            closeLibraryModal(); 
        }
    });
}

function deleteSingleItem(id, e) {
    if(e) e.stopPropagation();
    showConfirm("確定要刪除此素材嗎？", () => {
        db.favorites.delete(id).then(() => {
            selectedLibraryIds.delete(id);
            renderLibraryItems(currentCategory);
            renderCategories(); 
			if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
        });
    });
}

// --- 批次選取與操作 ---

let selectedLibraryIds = new Set();

function toggleLibrarySelection(id) {
    if (selectedLibraryIds.has(id)) {
        selectedLibraryIds.delete(id);
    } else {
        selectedLibraryIds.add(id);
    }
    // 重新渲染時，帶入當前的搜尋字串與 Scope，保持畫面一致
    const text = document.getElementById('lib-search').value;
    const scope = document.querySelector('input[name="search-scope"]:checked')?.value || 'global';
    renderLibraryItems(currentCategory, text, scope);
}

function toggleSelectAllLibrary() {
    const chk = document.getElementById('lib-select-all');
    if (chk.checked) {
        libraryItems.forEach(item => selectedLibraryIds.add(item.id));
    } else {
        libraryItems.forEach(item => selectedLibraryIds.delete(item.id));
    }
    const text = document.getElementById('lib-search').value;
    const scope = document.querySelector('input[name="search-scope"]:checked')?.value || 'global';
    renderLibraryItems(currentCategory, text, scope);
}

async function batchExportLibraryItems() {
    if (selectedLibraryIds.size === 0) return;
    
    const items = await db.favorites.where('id').anyOf(Array.from(selectedLibraryIds)).toArray();
    
    // 使用與完整備份相同的格式，這樣這份檔案也能被「匯入/還原」讀取
    const exportData = {
        type: "MathEditor_Library_Backup",
        version: "2.1",
        timestamp: Date.now(),
        items: items.map(i => ({ 
            name: i.name, 
            svgInner: i.svgInner, 
            category: i.category,
            thumbnail: i.thumbnail 
        }))
    };

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    saveBlobDirectly(blob, `Library_Selected_${timestamp}.json`);
    
    // 選用：匯出後是否取消選取？通常保留選取比較方便使用者確認
    if(typeof statusText !== 'undefined') statusText.innerText = `✅ 已匯出 ${items.length} 個物件`;
}

function updateLibraryBatchUI() {
    const count = selectedLibraryIds.size;
    const countSpan = document.getElementById('lib-selected-count');
    if(countSpan) countSpan.innerText = `已選 ${count} 項`;
    
    const isDisabled = (count === 0);

    // 處理主要按鈕
    document.getElementById('btn-batch-move').disabled = isDisabled;
    document.getElementById('btn-batch-del').disabled = isDisabled;
    document.querySelector('button[onclick="batchCopyLibraryItems()"]').disabled = isDisabled;

    // 處理下拉選單內的項目 (改用 class 控制)
    const moreActions = {
        'btn-batch-copy': document.getElementById('btn-batch-copy'),
        'btn-batch-export': document.getElementById('btn-batch-export'),
        'btn-batch-share': document.getElementById('btn-batch-share'),
        'btn-batch-publish-lib': document.getElementById('btn-batch-publish-lib')
    };

    let allMoreDisabled = true;
    for (const id in moreActions) {
        const item = moreActions[id];
        if (item) {
            if (isDisabled) {
                item.classList.add('disabled');
            } else {
                item.classList.remove('disabled');
                allMoreDisabled = false;
            }
        }
    }
    
    // 如果下拉選單內所有項目都禁用，則禁用「更多操作」按鈕本身
    document.getElementById('btn-lib-more-actions').disabled = allMoreDisabled;
}

// 2. 新增：複製到某一類別功能 (與 Move 類似，但保留原檔)
// 請確保在 index.html 的圖庫管理視窗中有對應的按鈕呼叫此函式
// 例如：<button ... onclick="batchCopyLibraryItems()">📑 複製到...</button>
async function batchCopyLibraryItems() {
    await handleLibraryBatchTransfer(true); // true = 複製模式
}
async function handleLibraryBatchTransfer(isCopy) {
    if (selectedLibraryIds.size === 0) return;
    
    const allCats = await db.categories.toArray();
    // 複製模式下，目標可以是當前分類 (複製一份)；移動模式下通常不選當前
    const targets = allCats.map(c => c.name);
    
    openExclusiveOptionsModal(`請選擇目標分類 (${isCopy ? '複製' : '移動'})`, 
        targets.map(t => ({ label: t, checked: false })), 
        async (results) => {
            const targetIndex = results.findIndex(r => r === true);
            if (targetIndex !== -1) {
                const targetCat = targets[targetIndex];
                const items = await db.favorites.where('id').anyOf(Array.from(selectedLibraryIds)).toArray();
                
                if (isCopy) {
                    // 複製：建立新物件，移除 ID，更新分類與時間戳記
                    // 若在同分類複製，名稱加後綴以示區別
                    const newItems = items.map(i => {
                        let newName = i.name;
                        if (i.category === targetCat) newName += "_copy";
                        return {
                            ...i,
                            id: undefined, // 讓 DB 自動生成新 ID
                            name: newName,
                            category: targetCat,
                            timestamp: Date.now()
                        };
                    });
                    await db.favorites.bulkAdd(newItems);
                } else {
                    // 移動：直接更新分類
                    await db.favorites.where('id').anyOf(Array.from(selectedLibraryIds))
                            .modify({ category: targetCat });
                }
                
                // 完成後重置選取並刷新
                selectedLibraryIds.clear();
                renderCategories();
                renderLibraryItems(currentCategory);
				if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
                showAlert(`✅ 已成功${isCopy ? '複製' : '移動'}至「${targetCat}」`);
            }
        }
    );
}

function triggerClearLibrary() {
    // 第一段：詢問是否備份 (使用我們在 utils.js 改過 z-index 的選項視窗)
    openExclusiveOptionsModal(
        "清除圖庫前，是否先進行備份？", 
        [
            { label: "是，先下載備份檔 (推薦)", checked: true },
            { label: "否，直接清除", checked: false }
        ], 
        async (results) => {
            const needBackup = results[0];
            
            if (needBackup) {
                // 如果需要備份，先執行備份，再執行清除確認
                await exportFullLibrary();
                // 給一點時間讓下載觸發
                setTimeout(performClearConfirm, 500);
            } else {
                performClearConfirm();
            }
        }
    );
}

function performClearConfirm() {
    // 第二段：最終確認
    showConfirm("⚠️ 警告：這將刪除圖庫內的所有分類與物件，且無法復原！\n確定要清空嗎？", async () => {
        try {
            await db.favorites.clear();
            await db.categories.clear();
            await ensureDefaultCategories(); // 重建預設分類
            
            currentCategory = '未分類';
            selectedLibraryIds.clear();
            renderCategories();
            renderLibraryItems(currentCategory);
            updateLibraryBatchUI();
            
            showAlert("圖庫已清空並重置。");
        } catch(e) {
            showAlert("清除失敗：" + e.message);
        }
    });
}

// --- 4. 新增：還原功能 (覆蓋模式) ---
function triggerLibraryRestore() {
    // 還原前的確認
    showConfirm("⚠️ 還原操作會「清空」目前的圖庫，並載入備份檔內容。\n確定要繼續嗎？", () => {
        document.getElementById('library-restore-input').click();
    });
}

async function restoreFullLibrary(input) {
    const file = input.files[0];
    if (!file) return;

    if(typeof statusText !== 'undefined') statusText.innerText = "⏳ 正在還原圖庫...";

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            let itemsToProcess =[];
            if (data.items) {
                itemsToProcess = data.items;
            } else if (data.version && data.version.startsWith("3") && data.pages) {
                itemsToProcess = data.pages.map((p, idx) => ({
                    name: (data.name || "Canvas_Page") + "_" + (idx + 1),
                    category: "未分類",
                    svgInner: p.shapes || ""
                }));
            } else if (data.svgInner !== undefined || data.illustrationSvg !== undefined) {
                itemsToProcess =[{
                    name: data.name || data.title || "Imported_Item",
                    category: "未分類",
                    svgInner: data.svgInner || data.illustrationSvg || ""
                }];
            } else {
                throw new Error("格式錯誤或檔案損毀");
            }
			
            await db.transaction('rw', db.favorites, db.categories, async () => {
                await db.favorites.clear();
                await db.categories.clear();
                
                let processedCount = 0;
                for (const item of itemsToProcess) { // 【修復】：改用 itemsToProcess
                    const cat = item.category || '未分類';
                    const exist = await db.categories.where('name').equals(cat).count();
                    if(exist === 0) await db.categories.add({name: cat});

                    await db.favorites.add({
                        name: item.name,
                        category: cat,
                        svgInner: item.svgInner,
                        thumbnail: item.thumbnail || item.svgInner,
                        timestamp: Date.now() + processedCount
                    });
                    processedCount++;
                }
                await ensureDefaultCategories();
            });

            currentCategory = '未分類';
            renderCategories();
            renderLibraryItems(currentCategory);
            // 【修復】：改用 itemsToProcess.length
            showAlert(`還原成功！共載入 ${itemsToProcess.length} 個物件。`);
            if(typeof statusText !== 'undefined') statusText.innerText = "✅ 還原完成";

        } catch(err) {
            showAlert("還原失敗：" + err.message);
            console.error(err);
        } finally {
            input.value = "";
        }
    };
    reader.readAsText(file);
}

async function batchDeleteLibraryItems() {
    if (selectedLibraryIds.size === 0) return;
    showConfirm(`確定要刪除選取的 ${selectedLibraryIds.size} 個素材嗎？`, async () => {
        await db.favorites.bulkDelete(Array.from(selectedLibraryIds));
        selectedLibraryIds.clear();
        renderCategories();
        renderLibraryItems(currentCategory);
		if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
    });
}
async function batchMoveLibraryItems() {
    if (selectedLibraryIds.size === 0) return;
    
    const allCats = await db.categories.toArray();
    const targets = allCats.filter(c => c.name !== currentCategory).map(c => c.name);
    
    if (targets.length === 0) {
        showAlert("沒有其他分類可移動，請先新增分類。");
        return;
    }

    openExclusiveOptionsModal("請選擇目標分類", 
        targets.map(t => ({ label: t, checked: false })), 
        async (results) => {
            const targetIndex = results.findIndex(r => r === true);
            if (targetIndex !== -1) {
                const targetCat = targets[targetIndex];
                await db.favorites.where('id').anyOf(Array.from(selectedLibraryIds))
                        .modify({ category: targetCat });
                
                selectedLibraryIds.clear();
                renderCategories();
                renderLibraryItems(currentCategory);
                showAlert(`已將物件移動至「${targetCat}」`); // 替換 alert
            }
        }
    );
}

async function batchCopyLibraryJson() {
    if (selectedLibraryIds.size === 0) return;
    const items = await db.favorites.where('id').anyOf(Array.from(selectedLibraryIds)).toArray();
    const exportData = {
        type: "MathEditor_Library_Backup",
        items: items.map(i => ({ name: i.name, svgInner: i.svgInner, category: i.category }))
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
        showAlert("已複製選取項目的 JSON 代碼");
    });
}

/**
 * 全域點擊監聽：點擊外部時關閉收藏下拉選單
 */
window.addEventListener('click', (e) => {
    // 1. 處理圖庫下拉選單 (Library Dropdown)
    const dropdown = document.getElementById('collection-dropdown');
    const libTrigger = document.getElementById('btn-library-trigger'); 
    
    if (dropdown && dropdown.style.display === 'flex') {
        if (!dropdown.contains(e.target) && !libTrigger.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }

    // 2. 處理檔案/專案選單 (File/Project Menu)
    const menu = document.getElementById('project-menu');
    const fileTrigger = document.getElementById('btn-main-file'); 
    const btn = e.target.closest('button'); 

    if (menu && menu.style.display === 'flex') {
        const isClickingTrigger = (fileTrigger && fileTrigger.contains(e.target)) || (btn && btn.id === 'btn-main-file');
        if (!menu.contains(e.target) && !isClickingTrigger) {
            menu.style.display = 'none';
        }
    }
    
    // 3. 處理「雲端交流」下拉選單
    const commMenu = document.getElementById('cloud-comm-menu');
    const commBtn = document.getElementById('btn-cloud-comm');
    if (commMenu && commMenu.style.display === 'flex') {
        if (!commMenu.contains(e.target) && (!commBtn || !commBtn.contains(e.target))) {
            commMenu.style.display = 'none';
        }
    }

    // 4. 【新增】：處理圖庫/題庫的「更多操作」下拉選單
    const moreLib = document.getElementById('more-actions-menu-lib');
    const btnLib = document.getElementById('btn-lib-more-actions');
    if (moreLib && moreLib.style.display === 'flex') {
        if (!moreLib.contains(e.target) && (!btnLib || !btnLib.contains(e.target))) {
            moreLib.style.display = 'none';
        }
    }

    const moreQb = document.getElementById('more-actions-menu-qb');
    const btnQb = document.getElementById('btn-qb-more-actions');
    if (moreQb && moreQb.style.display === 'flex') {
        if (!moreQb.contains(e.target) && (!btnQb || !btnQb.contains(e.target))) {
            moreQb.style.display = 'none';
        }
    }

    // 5. 處理右鍵選單 (Context Menu)
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu && contextMenu.style.display === 'block') {
        // 只有點擊在選單外部才關閉
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    }
});

/*
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化渲染收藏列表
    //renderCollection();

    // 2. [新增] 綁定輸入框的 Enter 鍵事件
    const nameInput = document.getElementById('favorite-name-input');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 防止誤觸其他瀏覽器預設行為
                confirmSaveFavorite();
            }
        });
    }
});
*/

/**
 * 開啟 JSON 匯入彈窗
 */
async function openJsonImportModal() {
    // 【新增】強制檢查登入與額度
    document.getElementById('ai-quota-info').innerText = "讀取額度中...";
    const quotaInfo = await window.checkAiQuota();
    
    // 如果回傳 null，代表未登入(ensureLogin會自動彈窗)，直接中斷開啟視窗
    if (!quotaInfo) return;

    const modal = document.getElementById('json-import-modal');
    modal.style.display = 'flex';
    
    // 顯示可用額度
    const quotaDisplay = document.getElementById('ai-quota-info');
    quotaDisplay.innerText = `已用次數: ${quotaInfo.used} / ${quotaInfo.quota}`;
    if (!quotaInfo.allowed) {
        quotaDisplay.style.color = "#c0392b";
        quotaDisplay.style.borderColor = "#e74c3c";
        quotaDisplay.style.background = "#fdedec";
        quotaDisplay.innerText += " (限制使用)";
    } else {
        quotaDisplay.style.color = "#27ae60";
        quotaDisplay.style.borderColor = "#2ecc71";
        quotaDisplay.style.background = "#eafaf1";
    }

    // 填充分類
    const catSelect = document.getElementById('json-import-category');
    if (catSelect) {
        catSelect.innerHTML = '';
        const cats = await db.categories.toArray();
        cats.sort((a, b) => a.name === '未分類' ? -1 : 1);
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name; opt.innerText = c.name;
            if (c.name === (lastInputCategory || '未分類')) opt.selected = true;
            catSelect.appendChild(opt);
        });
    }

    // 還原 LocalStorage 的狀態
    const savedImg = localStorage.getItem('saved_ai_image');
    const savedJson = localStorage.getItem('saved_ai_json');
    const savedName = localStorage.getItem('saved_ai_name');

    if (savedImg) {
        document.getElementById('source-image-preview').innerHTML = `<img src="${savedImg}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        const btn = document.getElementById('btn-submit-ai');
        btn.disabled = false;
        btn.style.backgroundColor = "#e67e22";
        btn.style.cursor = "pointer";
        btn.title = "點擊以重新解析此圖片";
        lastAiCache.imageSrc = savedImg; 
    }
    
    if (savedJson) document.getElementById('json-import-area').value = savedJson;
    if (savedName) document.getElementById('json-import-name').value = savedName;

    refreshImportPreview();
    updateConfirmButtonState();
    setTimeout(() => document.getElementById('json-import-area').focus(), 100);
}

async function confirmJsonImport() {
    const jsonStr = document.getElementById('json-import-area').value.trim();
    const actionType = document.querySelector('input[name="import-action-type"]:checked').value;
    const ns = "http://www.w3.org/2000/svg"; 
    if (!jsonStr) return;

    try {
        const data = JSON.parse(jsonStr);
        
        if (actionType === 'replace') {
            document.getElementById('shapes-layer').innerHTML = '';
            if (typeof deselectAll === 'function') deselectAll();
        }

		if (data.svgInner) {
            const tempGroup = document.createElementNS(ns, "g");
            // 【系統淨化】：自動剝除 AI 錯誤包裹的 <svg> 標籤
            let cleanSvg = data.svgInner.trim();
            cleanSvg = cleanSvg.replace(/<\/?svg[^>]*>/gi, '');
            tempGroup.innerHTML = cleanSvg;
            if (typeof refineImportedGeometry === 'function') refineImportedGeometry(tempGroup);
            
            Array.from(tempGroup.children).forEach(child => {
                child.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2,5);
                shapesLayer.appendChild(child);
            });
        }

        // 核心修正：使用全新的排版函式
        if (data.questionText) {
            if (typeof window.createQuestionTextShape === 'function') {
                window.createQuestionTextShape(data.questionText, 400, 40);
            }
        }
        
        saveState();
        setMode('select');
        closeJsonImportModal();

		/*
        setTimeout(() => {
            const mode = data.type === 'question' || data.questionText ? 'question' : 'library';
            if (typeof openFloatingSavePanel === 'function') {
                openFloatingSavePanel(mode, data.title || data.name || "AI 生成素材");
            }
        }, 300);
		*/

    } catch (err) {
        console.error("Import Error:", err);
        showAlert("JSON 格式錯誤，請檢查內容。");
    }
}

function updateConfirmButtonState() {
    const areaInput = document.getElementById('json-import-area');
    const btnConfirm = document.getElementById('btn-ai-confirm');
    const hasContent = areaInput && areaInput.value.trim().length > 0;
    
    if (btnConfirm) {
        btnConfirm.disabled = !hasContent;
        if (hasContent) {
            btnConfirm.style.backgroundColor = ""; // 恢復 CSS 預設顏色
            btnConfirm.style.cursor = "pointer";
        } else {
            btnConfirm.style.backgroundColor = "#e0e0e0";
            btnConfirm.style.cursor = "not-allowed";
        }
    }
}

function startLoadingAnimation(element, baseText) {
    if (loadingInterval) clearInterval(loadingInterval);
    let dots = 0;
    element.style.color = "#2980b9";
    element.innerText = baseText;
    loadingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        element.innerText = `⏳ ${baseText}${'.'.repeat(dots)}`;
    }, 500);
}

function stopLoadingAnimation() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}

// 7. 代碼操作按鈕功能
window.copyImportJson = function() {
    const val = document.getElementById('json-import-area').value;
    if(!val) return;
    navigator.clipboard.writeText(val);
    const status = document.getElementById('ai-status-display');
    const old = status.innerText;
    status.innerText = "✅ 已複製 JSON";
    setTimeout(() => status.innerText = old, 2000);
};

window.pasteImportJson = function() {
    navigator.clipboard.readText().then(text => {
        if(text) {
            const area = document.getElementById('json-import-area');
            area.value = text;
            // 觸發 input 事件以更新預覽
            area.dispatchEvent(new Event('input'));
        }
    });
};

window.loadImportJson = function(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        let text = evt.target.result;
        try {
            // 嘗試解析並正規化為 AI 格式
            const data = JSON.parse(text);
            let normalized = data;

            if (data.items && data.items.length > 0) {
                // 來源：圖庫/題庫
                normalized = {
                    title: data.items[0].name || data.items[0].title || "Imported_Item",
                    questionText: data.items[0].questionText || "",
                    svgInner: data.items[0].svgInner || data.items[0].illustrationSvg || ""
                };
            } else if (data.version && data.version.startsWith("3") && data.pages && data.pages.length > 0) {
                // 來源：主畫布 (取第一頁)
                normalized = {
                    title: data.name || "Imported_Canvas",
                    questionText: "",
                    svgInner: data.pages[0].shapes || ""
                };
            } else if (data.version === "2.1" && data.svgInner) {
                // 來源：主畫布舊版
                normalized = { title: data.name || "Imported", questionText: "", svgInner: data.svgInner };
            }
            text = JSON.stringify(normalized, null, 2);
        } catch(err) {
            // 若解析失敗則直接貼上純文字
        }

        const area = document.getElementById('json-import-area');
        area.value = text;
        area.dispatchEvent(new Event('input'));
        e.target.value = ""; // 重置 input
    };
    reader.readAsText(file);
};

// 儲存 JSON (修復 Blob 語法錯誤)
window.saveImportJson = function() {
    const val = document.getElementById('json-import-area').value;
    const nameEl = document.getElementById('json-import-name');
    const name = (nameEl && nameEl.value) ? nameEl.value : "AI_Code";
    if(!val) return;
    
    // 使用陣列包裝避免語法問題
    const blobData = [val]; 
    const blob = new Blob(blobData, { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};



// 插入圖庫物件到畫布 (共用函式)
function insertFromCollection(svgInner, originName = null, originCat = null) {
    const svgCanvas = document.getElementById('svg-canvas');
    const shapesLayer = document.getElementById('shapes-layer');
    if (!svgCanvas || !shapesLayer) return;
    
    const canvasW = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const canvasH = parseFloat(svgCanvas.getAttribute('height')) || 600;

    const tempGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // 【系統淨化】：自動剝除 AI 錯誤包裹的 <svg> 標籤
    let cleanSvg = svgInner.trim();
    cleanSvg = cleanSvg.replace(/<\/?svg[^>]*>/gi, '');
    tempGroup.innerHTML = cleanSvg;

    // 【核心修正】：移除 refineImportedGeometry 的呼叫，保留圖庫物件原汁原味的顏色與屬性
    // refineImportedGeometry(tempGroup); 

    let finalGroup;
    const children = Array.from(tempGroup.children);
    
    // 【核心修正】：如果只有一個子節點，不論是什麼，都直接當作主體，不再強制包裝為 group
    if (children.length === 1) {
        finalGroup = children[0];
        if (!finalGroup.id) finalGroup.id = 'shape-' + Date.now();
    } else {
        finalGroup = tempGroup;
        finalGroup.setAttribute("class", "shape group");
        finalGroup.setAttribute("data-tool", "group");
        finalGroup.id = 'group-' + Date.now();
    }
    
    const idMap = {};
    const allElements = Array.from(finalGroup.querySelectorAll('*'));
    // 也把 finalGroup 自己算進去
    allElements.push(finalGroup);

    allElements.forEach(child => {
        if (child.id) {
            const oldId = child.id;
            // 避免重複產生 ID
            if (!idMap[oldId]) {
                const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 9);
                idMap[oldId] = newId;
            }
        }
    });

    allElements.forEach(child => {
        if (child.id && idMap[child.id]) {
            child.id = idMap[child.id];
        }
        
        // 修正積木視圖關聯 (blocks.js 依賴 owner-blocks)
        if (child.hasAttribute('data-owner-blocks')) {
            const oldOwnerId = child.getAttribute('data-owner-blocks');
            if (idMap[oldOwnerId]) {
                child.setAttribute('data-owner-blocks', idMap[oldOwnerId]);
            }
        }
        
        const attrsToCheck =['data-owner-circle-id', 'data-owner-shape', 'data-owner', 'data-owner-angle-shape', 'data-circle-id', 'data-tangent-ctrl', 'data-c1-id', 'data-c2-id', 'data-system-id', 'data-owner-solid'];
        attrsToCheck.forEach(attr => {
            if (child.hasAttribute(attr)) {
                const oldOwnerId = child.getAttribute(attr);
                if (idMap[oldOwnerId]) {
                    child.setAttribute(attr, idMap[oldOwnerId]);
                }
            }
        });

        const listAttrs =['data-label-ids', 'data-angle-label-ids', 'data-intersection-lines'];
        listAttrs.forEach(attr => {
            if (child.hasAttribute(attr)) {
                const oldIds = child.getAttribute(attr).split(',');
                const newIds = oldIds.map(id => idMap[id] || id).join(',');
                child.setAttribute(attr, newIds);
            }
        });
    });

    if (originName) finalGroup.setAttribute('data-origin-name', originName);
    if (originCat) finalGroup.setAttribute('data-origin-cat', originCat);

    shapesLayer.appendChild(finalGroup);
    
    try {
        const bbox = finalGroup.getBBox();
        if (bbox.width > 0 || bbox.height > 0) {
            // 【核心修正】取得可視區中心，並對齊物件的「幾何中心」而不是左上角
            let targetX = canvasW / 2;
            let targetY = canvasH / 2;
            if (typeof window.getVisibleCanvasCenter === 'function') {
                const center = window.getVisibleCanvasCenter();
                targetX = center.x;
                targetY = center.y;
            }
            const tx = targetX - (bbox.x + bbox.width / 2);
            const ty = targetY - (bbox.y + bbox.height / 2);
            const currentTransform = finalGroup.getAttribute('transform') || "";
            finalGroup.setAttribute("transform", `translate(${tx}, ${ty}) ${currentTransform}`);
        } else {
            // 備援：若無有效邊界，直接放可視區中心
            let targetX = canvasW / 2;
            let targetY = canvasH / 2;
            if (typeof window.getVisibleCanvasCenter === 'function') {
                const center = window.getVisibleCanvasCenter();
                targetX = center.x;
                targetY = center.y;
            }
            finalGroup.setAttribute("transform", `translate(${targetX}, ${targetY})`);
        }
    } catch (e) {
        finalGroup.setAttribute("transform", `translate(100, 100)`);
    }

    const angleGroups = finalGroup.querySelectorAll('g[data-sub-tool$="-angle"]');
    angleGroups.forEach(group => {
        if (typeof redrawCircleAngle === 'function') {
            redrawCircleAngle(group);
        }
        if (typeof refreshAngleLabels === 'function') {
            refreshAngleLabels(group);
        }
    });

    // 處理公切線系統重繪
    const tangentSystems = finalGroup.querySelectorAll('[data-dependency-type="common_tangent"]');
    if (tangentSystems.length > 0) {
        const sysIds = new Set();
        tangentSystems.forEach(t => sysIds.add(t.getAttribute('data-system-id')));
        sysIds.forEach(sysId => {
            if (typeof window.redrawCommonTangentSystem === 'function') {
                window.redrawCommonTangentSystem(sysId);
            }
        });
    }

    const mathObjects = finalGroup.querySelectorAll('[data-tool="math"], .math-obj');
    mathObjects.forEach(fo => {
        const rawContent = fo.getAttribute('data-content');
        if (rawContent) {
            let div = fo.querySelector('.math-content');
            if (!div) {
                div = document.createElement('div');
                div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
                div.className = 'math-content';
                fo.appendChild(div);
            }
            
            div.innerHTML = window.formatSmartMathText ? window.formatSmartMathText(rawContent) : rawContent;
            
            const fontSize = fo.getAttribute('data-font-size') || '24';
            const color = fo.getAttribute('fill') || 'black';
            
            div.style.fontSize = fontSize + "px";
            div.style.color = color;
            // 恢復正確的顯示屬性
            const wm = div.style.writingMode || 'horizontal-tb';
            div.style.display = wm === 'vertical-rl' ? 'flex' : 'inline-block';
            
            div.style.whiteSpace = "pre-wrap"; 
            div.style.wordBreak = "break-word";
            
            fo.style.display = "";
            fo.style.visibility = "visible";
        }
    });

    if (window.MathJax) {
        MathJax.typesetPromise([finalGroup]).then(() => {
            mathObjects.forEach(fo => {
                if (typeof autoScaleText === 'function') {
                    autoScaleText(fo);
                } else {
                    const div = fo.querySelector('.math-content');
                    if (div) {
                        const w = div.offsetWidth;
                        const h = div.offsetHeight;
                        if (w > 0 && h > 0) {
                            fo.setAttribute("width", w + 20);
                            fo.setAttribute("height", h + 20); 
                        }
                    }
                }
            });
            if (typeof saveState === 'function') saveState();
        });
    }

    if (typeof saveState === 'function') saveState();
    if (typeof deselectAll === 'function') deselectAll();
    if (typeof addToSelection === 'function') addToSelection(finalGroup);
    if (typeof setMode === 'function') setMode('select');

    if (typeof showUngroupHint === 'function' && finalGroup.getAttribute('data-tool') === 'group') {
        showUngroupHint();
    }
}

const CLOUD_FUNCTION_URL = "https://gemini-math-431747377367.asia-east1.run.app";

// 暫存變數
let currentAiImageFile = null; // 暫存使用者選擇的圖片
let loadingInterval = null;    // 載入動畫計時器
let lastAiCache = {            // 瀏覽器暫存，避免重整後消失
    imageSrc: null,
    json: "",
    name: "",
    statusText: "請選擇圖片或使用上次紀錄"
};


document.addEventListener('DOMContentLoaded', () => {
    const aiInput = document.getElementById('ai-image-input');
    const areaInput = document.getElementById('json-import-area');
    const importModal = document.getElementById('json-import-modal');
    const nameInput = document.getElementById('json-import-name');

    // 檔案選擇：只預覽，不解析
    if (aiInput) {
        aiInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                // 使用 item(0) 避開陣列解析 bug
                handleImageSelection(e.target.files.item(0));
            }
        });
    }

    // 貼上事件：只預覽，不解析
    window.addEventListener('paste', (e) => {
        if (importModal && importModal.style.display !== 'none') {
            const items = e.clipboardData.items;
            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const blob = item.getAsFile();
                    handleImageSelection(blob);
                    e.preventDefault();
                    break;
                }
            }
        }
    });

    // 監聽 JSON 輸入與名稱變更 (即時存入快取 & 更新按鈕狀態)
    if (areaInput) {
        areaInput.addEventListener('input', () => {
            lastAiCache.json = areaInput.value;
            localStorage.setItem('saved_ai_json', areaInput.value);
            refreshImportPreview();
            updateConfirmButtonState();
        });
    }
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            lastAiCache.name = e.target.value;
            localStorage.setItem('saved_ai_name', e.target.value);
        });
    }
});

function handleImageSelection(imageFile) {
    currentAiImageFile = imageFile;

    const reader = new FileReader();
    reader.onload = (e) => {
        const src = e.target.result;
        lastAiCache.imageSrc = src;
        localStorage.setItem('saved_ai_image', src); // 存入 LocalStorage

        // 顯示預覽
        document.getElementById('source-image-preview').innerHTML = `<img src="${src}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        
        // 啟用「提交 AI 解析」按鈕
        const btn = document.getElementById('btn-submit-ai');
        if (btn) {
            btn.disabled = false;
            btn.style.backgroundColor = "#e67e22";
            btn.style.cursor = "pointer";
        }
        
        const statusEl = document.getElementById('ai-status-display');
        statusEl.innerText = "新圖片已就緒，請點擊「提交 AI 解析」。";
        
        // 清空舊 JSON，因為圖片換了
        document.getElementById('json-import-area').value = "";
        refreshImportPreview(); // 清空 SVG 預覽
        updateConfirmButtonState(); // 禁用匯入按鈕
    };
    reader.readAsDataURL(imageFile);
}

async function triggerAiAnalysis() {
    const cachedSrc = localStorage.getItem('saved_ai_image');
    if (!currentAiImageFile && !cachedSrc) {
        showAlert("請先選擇或貼上圖片！");
        return;
    }

    // 【新增】呼叫前再次檢查額度與冷卻狀態
    const quotaInfo = await window.checkAiQuota();
    if (!quotaInfo) return; // 未登入
    if (!quotaInfo.allowed) {
        showAlert(quotaInfo.reason);
        return;
    }

    const statusEl = document.getElementById('ai-status-display');
    const btnSubmitAi = document.getElementById('btn-submit-ai');
    const areaInput = document.getElementById('json-import-area');

    btnSubmitAi.disabled = true;
    btnSubmitAi.style.backgroundColor = "#ccc";
    btnSubmitAi.style.cursor = "not-allowed";
    
    startLoadingAnimation(statusEl, "AI 正在深度解析題目與幾何");
    areaInput.value = "";
    document.getElementById('import-preview-svg').innerHTML = ""; 

    try {
        let imagePart;
        if (currentAiImageFile) {
            imagePart = await fileToGenerativePart(currentAiImageFile);
        } else {
            const base64Data = cachedSrc.split(',')[1];
            const mimeType = cachedSrc.split(',')[0].match(/:(.*?);/)[1];
            imagePart = { inlineData: { data: base64Data, mimeType: mimeType } };
        }
        
        let specContent = "";
        try {
            const specUrl = "https://maxon-chiang.github.io/MathEditor/MathGraph_Spec.md";
            const specResponse = await fetch(`${specUrl}?t=${new Date().getTime()}`);
            if (specResponse.ok) specContent = await specResponse.text();
        } catch (err) {}

        const promptText = `
# 角色
你是一個精準的數學圖形與題目轉換 AI。你不但要辨識形狀，還要理解幾何結構。

# 任務
1.分析圖片。判斷它是一道「數學題目（包含文字）」，還是純粹的「幾何圖形」。
2.畫布基準尺寸為 800x600，(0,0) 為左上角。請將圖形置中。
3.嚴格禁止使用單引號來包裹文字。
4 🚨 輸出文字規範 (Strict Rules for Text)
  **反引號區分法 (極度重要)**：
   - 所有「數學符號、公式、變數(如 x, y, AB線段)」必須包裝在反引號中，例如 \`x^2 + y^2 = r^2\` 或 \`angle ABC\`。
   - 所有「敘述性文字、單位、題目要求」請直接輸出，**不要**包在反引號內。
   - 範例：若題目是「已知三角形ABC的面積為 20 平方公分」，應輸出：「已知 \`triangle ABC\` 的面積為 20 平方公分」。

# 幾何構圖原則 (重要)
1. **結構完整性：** 優先識別完整的幾何物件，而非零碎的線條。
2. **曲線優先級：** 扇形(sector) > 圓弧(arc) > 弧線(path)。若圖片由圓弧構成，請計算其圓心與半徑，盡可能套用扇形格式。
3. **直線優先級：** 閉合多邊形(polygon/tri/rect) > 角(angle) > 獨立線段(line)。
4. **允許重疊 (Overlap)：** 絕對禁止為了避免線條重疊而將圖形「切斷」。例如正方形與三角形共用邊時，應輸出完整的 polygon 矩形與完整的 polygon 三角形。
5. **控制點意識：** 你的構圖是為了讓使用者可以拖拉控制點。因此，請使用最符合直覺的工具（如多邊形），這樣使用者才能修改頂點。

# 🚨 絕對禁止的錯誤 (Strict Rules)
1. **ASCIIMath 強制：** 所有的「題目敘述與條件文字」必須轉換為純 ASCIIMath 語法。絕對禁止使用 SVG <text> 或 foreignObject 包裝。
2. **語意幾何強制：** 必須依照規格書使用 polygon, rect, ellipse 等標籤，不可用多條 <line> 拼湊圖形。
3. **無填滿：** 所有形狀強制 \`fill="none"\`。
4. 當題目出現聯立方程式時，必須使用 \`{(式1),(式2):}\` 格式。
5. 禁止使用多條 <line> 拼湊出三角形或矩形，必須使用 <polygon>。
6. 禁止將扇形拆解為一段弧加兩條線。
7. 禁止輸出破碎的標籤。

# 規格書
${specContent}

# 輸出格式
只輸出一個 JSON 物件，格式如下：
{
  "type": "question", // 若只有圖形無文字敘述，則填 "library"
  "title": "AI 建議的名稱或題號",
  "questionText": "若有題目文字，將其合併為一段純 ASCIIMath 字串。若純圖形則為空字串。",
  "svgInner": "這裡填入純幾何圖形的 SVG 代碼 (排除題目文字)。"
}
絕對不要包含任何 Markdown 標籤 (如 \`\`\`json)。
        `;

        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                imagePart: imagePart, 
                modelName: "gemini-3-flash-preview", 
                prompt: promptText 
            })
        });

        if (!response.ok) throw new Error("伺服器連線錯誤");
        
        const data = await response.json();
        let cleanJson = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
        cleanJson = cleanJson.substring(cleanJson.indexOf('{'), cleanJson.lastIndexOf('}') + 1);

        // 嘗試解析 JSON 確認格式無誤
        JSON.parse(cleanJson);

        // 【新增】成功產生有效 JSON，寫入成功紀錄並扣除額度
        await window.logAiSuccess();
        
        // 更新 UI 上的數字
        const newInfo = await window.checkAiQuota();
        if(newInfo) document.getElementById('ai-quota-info').innerText = `已用次數: ${newInfo.used} / ${newInfo.quota}`;

        areaInput.value = cleanJson;
        lastAiCache.json = cleanJson;
        localStorage.setItem('saved_ai_json', cleanJson);
        
        refreshImportPreview();
        stopLoadingAnimation();
        statusEl.innerHTML = "<span style='color:#27ae60;'>✅ 解析完成，可修改 JSON 或直接放入畫布</span>";

    } catch (err) {
        console.error(err);
        
        // 【新增】執行失敗邏輯並取得冷卻訊息
        const cooldownMsg = await window.logAiFail();
        if (cooldownMsg) {
            showAlert(cooldownMsg);
        }

        stopLoadingAnimation();
        statusEl.innerHTML = `<span style='color:#c0392b;'>❌ 解析失敗: ${err.message}</span>`;
    } finally {
        btnSubmitAi.disabled = false;
        btnSubmitAi.style.backgroundColor = "#e67e22";
        btnSubmitAi.style.cursor = "pointer";
        updateConfirmButtonState();
    }
}

async function handleExplicitPaste() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            const imageTypes = item.types.filter(type => type.startsWith('image/'));
            if (imageTypes.length > 0) {
                const blob = await item.getType(imageTypes[0]);
                // 核心修正：將貼上的圖片直接交給 UI 預覽，走正確的 triggerAiAnalysis 流程
                if (typeof handleImageSelection === 'function') {
                    handleImageSelection(blob);
                }
                return;
            }
        }
        showAlert("剪貼簿中沒有圖片資料。");
    } catch (err) {
        console.error("Paste Error:", err);
        showAlert("無法讀取剪貼簿，請嘗試 Ctrl+V 貼上。");
    }
}

// 輔助：即時更新預覽
function refreshImportPreview() {
    const areaInput = document.getElementById('json-import-area');
    const previewSvg = document.getElementById('import-preview-svg');
    const errorMsg = document.getElementById('preview-error-msg');
    
    if (!areaInput || !previewSvg) return;
    
    const rawVal = areaInput.value.trim();
    if (!rawVal) {
        previewSvg.innerHTML = "";
        previewSvg.setAttribute('viewBox', '0 0 800 600'); // 重置 viewBox
        errorMsg.style.display = "none";
        return;
    }

    try {
        const data = JSON.parse(rawVal);
        if (data.svgInner) {
            // 1. 清空並將新內容包在 <g> 元素中
            previewSvg.innerHTML = '';
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.innerHTML = data.svgInner;
            previewSvg.appendChild(g);

            // 2. 延遲計算邊界框並設定 viewBox 以達成縮放效果
            setTimeout(() => {
                try {
                    const bbox = g.getBBox();
                    // 確保有實際寬高，避免空內容或錯誤造成 viewBox 無限大
                    if (bbox.width > 0 && bbox.height > 0) {
                        const padding = 50; // 邊緣留白
                        const viewBoxStr = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`;
                        previewSvg.setAttribute('viewBox', viewBoxStr);
                    } else {
                        // 若無有效內容，退回預設
                        previewSvg.setAttribute('viewBox', '0 0 800 600');
                    }
                } catch(e) {
                    // 計算 BBox 失敗時的備援方案
                    previewSvg.setAttribute('viewBox', '0 0 800 600');
                    console.error("BBox calculation failed for preview:", e);
                }
            }, 50); // 給予一點點渲染時間
            
            errorMsg.style.display = "none";
            
        } else {
             // JSON 有效但沒有 svgInner 的情況
             previewSvg.innerHTML = "";
             previewSvg.setAttribute('viewBox', '0 0 800 600');
        }
    } catch (e) {
        errorMsg.style.display = "block";
        previewSvg.setAttribute('viewBox', '0 0 800 600'); // 解析失敗也要重置
    }
}

// 輔助函式：將單一物件存入資料庫並生成縮圖
async function saveSingleItemToDb(name, svgInner, category = "未分類") {
    // 使用系統現有的高品質縮圖產生器 (會處理 MathJax 烘焙)
    let thumbnail = "";
    try {
        thumbnail = await generateThumbnailFromSvgString(svgInner);
    } catch (e) {
        // 備援方案：簡單生成
        thumbnail = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50">無預覽</text>${svgInner}</svg>`;
    }

    return await db.favorites.add({
        name: name || "未命名素材",
        category: category, // 【核心修正】預設加入分類
        svgInner: svgInner,
        thumbnail: thumbnail,
        timestamp: Date.now()
    });
}

// 關閉視窗函式
function closeJsonImportModal() {
    document.getElementById('json-import-modal').style.display = 'none';
    document.getElementById('ai-status-display').innerHTML = "";
    document.getElementById('ai-image-input').value = "";
    document.getElementById('json-import-area').value = "";
    const nameInput = document.getElementById('json-import-name');
    if (nameInput) nameInput.value = "";
    document.getElementById('import-preview-svg').innerHTML = "";
    document.getElementById('source-image-preview').innerHTML = `<span style="color: #ccc; font-size: 11px;">尚未上傳圖片</span>`;
    document.getElementById('preview-error-msg').style.display = "none";
}

// 輔助：檔案轉 API 格式
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
}


// 匯出/匯入完整庫 (更新版)
async function exportFullLibrary() {
    const allItems = await db.favorites.toArray();
    const exportData = {
        type: "MathEditor_Library_Backup",
        version: "2.1", // 版號微升
        timestamp: Date.now(),
        items: allItems.map(i => ({ 
            name: i.name, 
            svgInner: i.svgInner, 
            category: i.category,
            thumbnail: i.thumbnail // 【新增】保留縮圖資料
        }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    saveBlobDirectly(blob, `Library_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    if(typeof statusText !== 'undefined') statusText.innerText = "✅ 圖庫備份已下載 (含縮圖)";
}

function triggerLibraryImport() {
    document.getElementById('library-import-input').click();
}

// 保留既有的 importFullLibrary (在 HTML 中 onchange 綁定)
// 需更新邏輯以讀取 category
async function importFullLibrary(input) {
    const file = input.files[0];
    if (!file) return;
    
    if(typeof statusText !== 'undefined') statusText.innerText = "⏳ 正在處理匯入...";

    const reader = new FileReader();
    reader.onload = (e) => { 
        try {
            const data = JSON.parse(e.target.result);
            
            let itemsToProcess =[];
            if (data.items) {
                itemsToProcess = data.items;
            } else if (data.version && data.version.startsWith("3") && data.pages) {
                itemsToProcess = data.pages.map((p, idx) => ({
                    name: (data.name || "Canvas_Page") + "_" + (idx + 1),
                    category: "未分類",
                    svgInner: p.shapes || ""
                }));
            } else if (data.svgInner !== undefined || data.illustrationSvg !== undefined) {
                itemsToProcess =[{
                    name: data.name || data.title || "Imported_Item",
                    category: "未分類",
                    svgInner: data.svgInner || data.illustrationSvg || ""
                }];
            } else {
                throw new Error("格式錯誤或不支援的檔案");
            }
			
            // 【修復】：改用 itemsToProcess.length
            showConfirm(`偵測到 ${itemsToProcess.length} 個素材，確定要匯入嗎？\n(若無縮圖將自動生成，可能需要幾秒鐘)`, async () => {
                let processedCount = 0;
                for (const item of itemsToProcess) { // 【修復】：改用 itemsToProcess
                    const cat = item.category || '未分類';
                    const exist = await db.categories.where('name').equals(cat).count();
                    if(exist === 0) await db.categories.add({name: cat});

                    let thumbnail = item.thumbnail;
                    if (!thumbnail || thumbnail.includes('已匯入') || thumbnail.includes('text y="50"')) {
                        if (typeof generateThumbnailFromSvgString === 'function') {
                            thumbnail = await generateThumbnailFromSvgString(item.svgInner);
                        }
                    }

                    await db.favorites.add({
                        name: item.name,
                        category: cat,
                        svgInner: item.svgInner,
                        thumbnail: thumbnail || item.svgInner, 
                        timestamp: Date.now() + processedCount
                    });
                    processedCount++;
                }
                
                renderCategories();
                renderLibraryItems(currentCategory);
                showAlert(`成功匯入 ${processedCount} 個素材`);
                if(typeof statusText !== 'undefined') statusText.innerText = "✅ 匯入完成";
                
                input.value = ""; 
            }, () => {
                input.value = ""; 
            });

        } catch(err) {
            showAlert("匯入失敗：" + err.message);
            input.value = "";
        }
    };
    reader.readAsText(file);
}

async function generateThumbnailFromSvgString(svgInner) {
    const bakedSvgInner = await bakeMathJaxIntoSvg(svgInner);

    return new Promise((resolve) => {
        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        tempSvg.style.cssText = "visibility: hidden; position: absolute; top: -9999px;";
        document.body.appendChild(tempSvg);

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.innerHTML = bakedSvgInner;
        tempSvg.appendChild(g);

        setTimeout(() => {
            try {
                const bbox = g.getBBox();
                const padding = 15;
                // 在縮圖 SVG 中注入 Arial 字體設定
                const thumb = `
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                         viewBox="${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}">
                        <style>
                            .shape { vector-effect: non-scaling-stroke; stroke: black; stroke-width: 2; fill: none; }
                            text, .vertex-label { font-family: Arial, sans-serif !important; font-weight: bold; }
                        </style>
                        ${bakedSvgInner} 
                    </svg>`;
                resolve(thumb);
            } catch (e) {
                resolve(`<svg viewBox="0 0 100 100"><text y="50">Error</text></svg>`);
            } finally {
                document.body.removeChild(tempSvg);
            }
        }, 60); 
    });
}

/**
 * 開啟素材預覽視窗
 * @param {number} id - Dexie 中的物件 ID
 */
async function openLibraryPreview(id) {
    const item = await db.favorites.get(id);
    if (!item) return;

    // 暫存物件資料供後續插入使用
    previewingItemData = item;

    const modal = document.getElementById('library-preview-modal');
    const header = document.getElementById('preview-header');
    const container = document.getElementById('preview-image-container');

    header.textContent = `預覽：${item.name}`;
    
    // 【修改點】改用 Blob 方式產生網址，解決中文/數學符號導致 btoa 報錯的問題
    const blob = new Blob([item.thumbnail], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);

	container.innerHTML = `<img src="${url}" 
                                    style="max-width: 100%; max-height: 100%; object-fit: contain; cursor: pointer;" 
                                    onclick="insertFromPreview()"
                                    title="點擊圖片可直接插入畫布">`;
    
    modal.style.display = 'flex';
}

/**
 * 關閉素材預覽視窗
 */
function closeLibraryPreview() {
    const modal = document.getElementById('library-preview-modal');
    modal.style.display = 'none';
    previewingItemData = null; // 清空暫存
}

/**
 * 從預覽視窗將物件插入畫布
 */
function insertFromPreview() {
    if (previewingItemData) {
		lastInputName = previewingItemData.name;
        lastInputCategory = previewingItemData.category;
        insertFromCollection(previewingItemData.svgInner, previewingItemData.name, previewingItemData.category);
        
        if(typeof statusText !== 'undefined') statusText.innerText = `✅ 已插入圖形：${previewingItemData.name}`;

        // 關閉所有相關視窗
        closeLibraryPreview();
        closeLibraryModal();
    }
}

/**
 * [輔助] 將 SVG 字串中的 MathJax <foreignObject> "烘焙" 成純 SVG 路徑
 * @param {string} svgInner - 包含 <foreignObject> 的原始 SVG 內部 HTML
 * @returns {Promise<string>} - 返回一個 <foreignObject> 已被 <g> 包裹的 SVG 取代的純 SVG 字串
 */
async function bakeMathJaxIntoSvg(svgInner) {
    const div = document.createElement('div');
    div.style.cssText = "position: absolute; left: -9999px; top: -9999px; visibility: hidden;";
    // 務必加上 xmlns:xlink，否則符號可能消失
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${svgInner}</svg>`;
    document.body.appendChild(div);

    const tempSvg = div.querySelector('svg');

    try {
        const fos = tempSvg.querySelectorAll('foreignObject[data-tool="math"], foreignObject.math-obj');
        
        for (const fo of fos) {
            let mathJaxSvg = fo.querySelector('mjx-container svg, .math-content svg');

            // 如果沒渲染過，先渲染
            if (!mathJaxSvg) {
                const rawContent = fo.getAttribute('data-content');
                if (rawContent) {
                    const tempMathDiv = document.createElement('div');
                    tempMathDiv.style.color = fo.getAttribute('fill') || 'black';
                    tempMathDiv.innerText = '`' + rawContent.replace(/^`|`$/g, '') + '`';
                    fo.innerHTML = ''; 
                    fo.appendChild(tempMathDiv);
                    await MathJax.typesetPromise([tempMathDiv]);
                    mathJaxSvg = fo.querySelector('svg');
                }
            }

            if (mathJaxSvg) {
                // --- 參考自 generateExportBlob 的精確定位邏輯 ---
                const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                
                const x = parseFloat(fo.getAttribute('x')) || 0;
                const y = parseFloat(fo.getAttribute('y')) || 0;
                const transform = fo.getAttribute('transform') || '';
                
                // 1. 套用相同的 Transform 與 Translate
                g.setAttribute('transform', `${transform} translate(${x}, ${y})`);

                const nestedSvg = mathJaxSvg.cloneNode(true);
                
                // 2. 鎖定原始寬高 (不隨 FO 縮放)
                nestedSvg.setAttribute('width', mathJaxSvg.getAttribute('width'));
                nestedSvg.setAttribute('height', mathJaxSvg.getAttribute('height'));
                
                // 3. 【核心修正】同步匯出函式的 10px 補償，解決縮圖字體偏高的問題
                nestedSvg.setAttribute('x', '10'); 
                nestedSvg.setAttribute('y', '10');

                // 4. 設定顏色與統一字型 (Arial)
                const color = fo.getAttribute('fill') || fo.querySelector('div')?.style.color || 'black';
                const fontSize = fo.getAttribute('data-font-size') || '24';
                g.setAttribute('fill', color);
                g.style.fontSize = fontSize + "px";
                g.style.fontFamily = "Arial, sans-serif";

                g.appendChild(nestedSvg);
                fo.parentNode.replaceChild(g, fo);
            }
        }
        return tempSvg.innerHTML;
    } catch (e) {
        console.error("縮圖烘焙失敗:", e);
        return svgInner;
    } finally {
        document.body.removeChild(div);
    }
}

function replaceCanvasFromPreview() {
    if (previewingItemData) {
        // 直接清空畫布圖層，不跳 Confirm（因為使用者已在預覽介面選擇「取代」）
        const shapesLayer = document.getElementById('shapes-layer');
        if (shapesLayer) shapesLayer.innerHTML = '';
        
        if (typeof deselectAll === 'function') deselectAll();
        isImportedContent = false; // 重置匯入狀態
        
        // 執行插入邏輯
        insertFromPreview();
        
        if (typeof statusText !== 'undefined') statusText.innerText = "✅ 已清空畫布並取代為新物件";
    }
}

function refineImportedGeometry(containerGroup) {
    // 1. 強制移除填色 (針對圓、橢圓、多邊形、路徑)
    // 排除 math-obj, image, 和特定的實心點
    const shapes = containerGroup.querySelectorAll('circle, ellipse, polygon, path');
    shapes.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const subTool = el.getAttribute('data-sub-tool');
        
        // 排除點(point)、標記(mark)、實心圖(solid)的內部路徑
        if (tool === 'point' || tool === 'mark' || tool === 'mark-edge-symbol') return;
        if (el.classList.contains('solid-visible') || el.classList.contains('solid-hidden')) return;
        
        // 強制設定 fill="none"
        el.setAttribute('fill', 'none');
        el.style.fill = 'none';
    });

    // 2. 圓形角幾何校正 (將端點吸附回圓周)
    const angleGroups = containerGroup.querySelectorAll('g[data-sub-tool$="-angle"]'); // 抓取所有 ...-angle
    
    angleGroups.forEach(group => {
        const type = group.getAttribute('data-sub-tool');
        const ownerId = group.getAttribute('data-owner-circle-id');
        if (!ownerId) return;

        // 尋找宿主圓 (可能在同一個 containerGroup 內，也可能在畫布上)
        let ownerCircle = containerGroup.querySelector(`#${ownerId}`);
        if (!ownerCircle) ownerCircle = document.getElementById(ownerId);
        
        if (ownerCircle) {
            // 取得圓的幾何資訊
            const cx = parseFloat(ownerCircle.getAttribute('cx'));
            const cy = parseFloat(ownerCircle.getAttribute('cy'));
            // 處理半徑：AI 有時給 rx/ry，有時給 r
            const r = parseFloat(ownerCircle.getAttribute('rx')) || parseFloat(ownerCircle.getAttribute('r'));

            // 取得群組內的控制點 (vertex-data)
            const dataNodes = Array.from(group.querySelectorAll('.vertex-data'));
            
            // 定義校正函式：輸入一點，回傳圓周上的點
            const snapPoint = (tx, ty) => {
                const dx = tx - cx;
                const dy = ty - cy;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist === 0) return {x: cx, y: cy}; // 避免除以零
                const scale = r / dist;
                return {
                    x: cx + dx * scale,
                    y: cy + dy * scale
                };
            };

            // 針對不同類型進行校正
            if (type === 'central-angle' && dataNodes.length >= 3) {
                // 結構：[0:圓心, 1:端點P1, 2:端點P2]
                // 校正 0: 強制對齊圓心
                dataNodes[0].setAttribute('cx', cx);
                dataNodes[0].setAttribute('cy', cy);
                
                // 校正 1 & 2: 吸附到圓周
                [1, 2].forEach(idx => {
                    const node = dataNodes[idx];
                    const oldX = parseFloat(node.getAttribute('cx'));
                    const oldY = parseFloat(node.getAttribute('cy'));
                    const fixed = snapPoint(oldX, oldY);
                    node.setAttribute('cx', fixed.x);
                    node.setAttribute('cy', fixed.y);
                });
            } 
            else if (type === 'inscribed-angle' && dataNodes.length >= 3) {
                // 結構：[0:A, 1:頂點V, 2:B] -> 全部都在圓周上
                [0, 1, 2].forEach(idx => {
                    const node = dataNodes[idx];
                    const oldX = parseFloat(node.getAttribute('cx'));
                    const oldY = parseFloat(node.getAttribute('cy'));
                    const fixed = snapPoint(oldX, oldY);
                    node.setAttribute('cx', fixed.x);
                    node.setAttribute('cy', fixed.y);
                });
            }
            
            // 3. 觸發重繪 (更新可見線條與標註位置)
            // 注意：因為此時物件可能還沒上 DOM，我們手動呼叫 redrawCircleAngle
            // 但 redrawCircleAngle 依賴 getCTM，如果還沒上 DOM 會報錯。
            // 所以我們只更新數據點，真正的重繪留到 insertFromCollection 最後執行
        }
    });
}
let targetImageForAi = null; // 暫存要被取代的圖片物件
let aiResultSvg = "";        // 暫存 AI 算出來的 SVG 字串

// 1. 觸發流程：顯示警告與確認
function triggerAiReplaceFlow() {
    if (selectedElements.length !== 1 || selectedElements[0].tagName.toLowerCase() !== 'image') {
        showAlert("請先選取一張圖片！");
        return;
    }
    
    targetImageForAi = selectedElements[0];
    
    showConfirm(
        "✨ 即將進行 AI 幾何解析\n\n• 此過程約需 10~20 秒，請耐心等待。\n• 僅適用於幾何圖形、函數圖形或簡單圖表。\n• 若圖片過於複雜或非數學圖形，解析可能會失敗。\n\n確定要開始嗎？", 
        () => {
            processAiImageReplacement(targetImageForAi);
        },
        null,
        "開始 AI 解析"
    );
}

// 2. 呼叫 AI 進行處理
async function processAiImageReplacement(imgEl) {
    const loadingModal = document.getElementById('ai-processing-modal');
    if (loadingModal) loadingModal.style.display = 'flex';
    document.body.style.cursor = 'wait';
    
    try {
        const href = imgEl.getAttribute('href') || imgEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        const base64Data = href.split(',')[1];
        
        let specContent = "";
        try {
            const res = await fetch(`https://maxon-chiang.github.io/MathEditor/MathGraph_Spec.md?t=${new Date().getTime()}`);
            if (res.ok) specContent = await res.text();
        } catch(e) {}

        const promptText = `
你是一個數學圖形轉換引擎。分析圖片。
1. 如果明顯非數學圖形，回傳 {"error": "NON_GEOMETRY"}。
2. 如果是，將其轉換為 SVG。若包含題目文字，轉為 ASCIIMath。
${specContent}
輸出 JSON:
{
  "questionText": "若有題目文字放這，否則為空",
  "svgInner": "SVG 代碼"
}`;

        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imagePart: { inlineData: { data: base64Data, mimeType: "image/png" } },
                modelName: "gemini-2.0-flash",
                prompt: promptText
            })
        });

        if (!response.ok) throw new Error("伺服器連線錯誤");
        
        const data = await response.json();
        let text = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
        text = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        
        const result = JSON.parse(text);
        if (result.error === "NON_GEOMETRY") {
            showAlert("AI 判斷此圖片並非數學圖形，無法轉換。");
            return;
        }
        
        // 將 AI 結果存入全域變數供預覽視窗使用
        aiResultSvg = result.svgInner || "";
        window.aiResultText = result.questionText || ""; // 新增全域變數存文字
        
        openAiReplacePreview(href, aiResultSvg);
        if(typeof statusText !== 'undefined') statusText.innerText = "✅ AI 解析完成，請確認結果";

    } catch (err) {
        showAlert("解析失敗：" + err.message);
    } finally {
        document.body.style.cursor = 'default';
        if (loadingModal) loadingModal.style.display = 'none';
    }
}

// 3. 開啟預覽視窗
function openAiReplacePreview(originalSrc, svgContent) {
    const modal = document.getElementById('ai-replace-modal');
    const origContainer = document.getElementById('ai-replace-original');
    const svgContainer = document.getElementById('ai-replace-preview-svg');
    
    // 顯示原圖
    origContainer.innerHTML = `<img src="${originalSrc}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
    
    // 顯示 AI SVG
    svgContainer.innerHTML = svgContent;
    
    modal.style.display = 'flex';
}

// 4. 確認取代
function confirmAiReplace() {
    if (!targetImageForAi) return;
    
    const bbox = targetImageForAi.getBBox();
    const m = targetImageForAi.getCTM();
    const cx = (bbox.x + bbox.width / 2) * m.a + m.e;
    const cy = (bbox.y + bbox.height / 2) * m.d + m.f;
    
    targetImageForAi.remove();
    
	if (aiResultSvg) {
        const tempGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        // 【系統淨化】：自動剝除 AI 錯誤包裹的 <svg> 標籤
        let cleanSvg = aiResultSvg.trim();
        cleanSvg = cleanSvg.replace(/<\/?svg[^>]*>/gi, '');
        tempGroup.innerHTML = cleanSvg;
        refineImportedGeometry(tempGroup);
        
        const finalGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        finalGroup.setAttribute("class", "shape group");
        finalGroup.setAttribute("data-tool", "group");
        
        while (tempGroup.firstChild) finalGroup.appendChild(tempGroup.firstChild);
        
        Array.from(finalGroup.querySelectorAll('*')).forEach(child => {
            if (child.id) child.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        });

        document.getElementById('shapes-layer').appendChild(finalGroup);
        finalGroup.setAttribute("transform", `translate(${cx}, ${cy})`);
        
        deselectAll();
        addToSelection(finalGroup);
    }

    // 核心修正：使用全新的排版函式
    if (window.aiResultText) {
        if (typeof window.createQuestionTextShape === 'function') {
            window.createQuestionTextShape(window.aiResultText, cx, cy - 100);
        }
    }

    saveState();
    setMode('select');
    document.getElementById('ai-replace-modal').style.display = 'none';
    
    targetImageForAi = null;
    aiResultSvg = "";
    window.aiResultText = "";
}
