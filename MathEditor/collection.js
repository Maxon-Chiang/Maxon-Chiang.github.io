const db = new Dexie("MathEditorDB");

db.version(1).stores({
    favorites: "++id, name, timestamp"
});

db.version(2).stores({
    favorites: "++id, name, category, timestamp",
    categories: "++id, &name"
}).upgrade(tx => {
    return tx.favorites.toCollection().modify(item => {
        item.category = '未分類';
    });
});

let currentCategory = '未分類';
let libraryItems = [];
let categoriesCache = [];
let pendingFavoriteData = null;
let searchRequestId = 0;
let previewingItemData = null;
let lastInputName = "";
let lastInputCategory = "";

document.addEventListener('DOMContentLoaded', () => {
    const subtext = document.getElementById('loading-subtext');
    if (subtext) subtext.innerText = "正在檢查資料庫與圖庫資源...";
    ensureDefaultCategories();
    const nameInput = document.getElementById('favorite-name-input');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmSaveFavorite();
            }
        });
    }
});

async function ensureDefaultCategories() {
    const count = await db.categories.count();
    if (count === 0) {
        await db.categories.add({ name: '未分類' });
        await db.categories.add({ name: '幾何圖形' });
        await db.categories.add({ name: '函數圖形' });
        await db.categories.add({ name: '立體圖形' });
        await db.categories.add({ name: '統計圖形' });
    }
}

function openLibraryModal() {
    const dropdown = document.getElementById('collection-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    const modal = document.getElementById('library-modal');
    modal.style.display = 'flex';
    selectedLibraryIds.clear();
    updateLibraryBatchUI();
    renderCategories();
    renderLibraryItems(currentCategory);
}

function closeLibraryModal() {
    document.getElementById('library-modal').style.display = 'none';
}

async function renderCategories() {
    const list = document.getElementById('lib-category-list');
    list.innerHTML = '';
    categoriesCache = await db.categories.toArray();
    categoriesCache.sort((a, b) => {
        if (a.name === '未分類') return -1;
        if (b.name === '未分類') return 1;
        return a.name.localeCompare(b.name);
    });
    for (const cat of categoriesCache) {
        const count = await db.favorites.where('category').equals(cat.name).count();
        const div = document.createElement('div');
        div.className = `category-item ${currentCategory === cat.name ? 'active' : ''}`;
        div.innerHTML = `
            <span>${cat.name}</span>
            <span class="cat-count">${count}</span>
        `;
        div.onclick = () => {
            currentCategory = cat.name;
            document.getElementById('lib-search').value = "";
            renderCategories();
            renderLibraryItems(currentCategory);
        };
        list.appendChild(div);
    }
    const btnDel = document.getElementById('btn-del-cat');
    if (btnDel) {
        btnDel.style.display = (currentCategory === '未分類') ? 'none' : 'block';
    }
}

function createNewCategory() {
    openNumberInputModal("請輸入新分類名稱", "", async (val) => {
        const name = val ? val.trim() : "";
        if (name) {
            try {
                const exist = await db.categories.where('name').equals(name).count();
                if (exist > 0) {
                    showAlert("分類名稱已存在");
                    return;
                }
                await db.categories.add({ name: name });
                renderCategories();
            } catch (e) {
                showAlert("建立分類失敗：" + e.message);
            }
        }
    });
}

async function deleteCurrentCategory() {
    if (currentCategory === '未分類') return;
    const count = await db.favorites.where('category').equals(currentCategory).count();
    if (count > 0) {
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
            }
        );
    } else {
        showConfirm(`確定刪除空分類「${currentCategory}」嗎？`, async () => {
            await db.categories.where('name').equals(currentCategory).delete();
            currentCategory = '未分類';
            renderCategories();
            renderLibraryItems('未分類');
        });
    }
}

async function renderLibraryItems(category, filterText = "", scope = "global") {
    const currentReqId = ++searchRequestId;
    const grid = document.getElementById('lib-item-grid');
    const emptyMsg = document.getElementById('lib-empty-msg');
    let items = [];
    if (filterText.trim() !== "") {
        const lowerText = filterText.toLowerCase();
        if (scope === 'global') {
            items = await db.favorites.filter(item => {
                return item.name.toLowerCase().includes(lowerText);
            }).reverse().toArray();
        } else {
            items = await db.favorites.filter(item => {
                return item.category === category && item.name.toLowerCase().includes(lowerText);
            }).reverse().toArray();
        }
    } else {
        items = await db.favorites.where('category').equals(category).reverse().toArray();
    }
    if (currentReqId !== searchRequestId) return;
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
            const blob = new Blob([item.thumbnail], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const showCatTag = (scope === 'global' && filterText !== "");
            const catTagHtml = showCatTag ? `<div class="lib-card-cat-tag">${item.category}</div>` : '';
            card.innerHTML = `
                <input type="checkbox" class="lib-card-check" ${isSelected ? 'checked' : ''}>
                <div class="lib-card-thumb">
                    <img src="${url}">
                </div>
                ${catTagHtml}
                <div class="lib-card-info" title="${item.name}">${item.name}</div>
                <div class="lib-card-actions">
                    <div class="lib-btn-mini" title="插入畫布並關閉" onclick="insertItemFromCard(${item.id}, event)">📥</div>
                    <div class="lib-btn-mini lib-btn-del" title="刪除" onclick="deleteSingleItem(${item.id}, event)">🗑️</div>
                </div>
            `;
            card.onclick = (e) => {
                if (e.target.tagName === 'INPUT' || e.target.closest('.lib-btn-mini')) {
                    if (e.target.tagName === 'INPUT') {
                        toggleLibrarySelection(item.id);
                    }
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
    const scopeEl = document.querySelector('input[name="search-scope"]:checked');
    const scope = scopeEl ? scopeEl.value : 'global';
    renderLibraryItems(currentCategory, text, scope);
}

function insertItemFromCard(id, e) {
    if (e) e.stopPropagation();
    db.favorites.get(id).then(item => {
        if (item) {
            lastInputName = item.name;
            lastInputCategory = item.category;
            insertFromCollection(item.svgInner, item.name, item.category);
            if (typeof statusText !== 'undefined') statusText.innerText = `✅ 已插入圖形：${item.name}`;
            closeLibraryModal();
        }
    });
}

function deleteSingleItem(id, e) {
    if (e) e.stopPropagation();
    showConfirm("確定要刪除此素材嗎？", () => {
        db.favorites.delete(id).then(() => {
            selectedLibraryIds.delete(id);
            renderLibraryItems(currentCategory);
            renderCategories();
        });
    });
}

let selectedLibraryIds = new Set();

function toggleLibrarySelection(id) {
    if (selectedLibraryIds.has(id)) {
        selectedLibraryIds.delete(id);
    } else {
        selectedLibraryIds.add(id);
    }
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
    if (typeof statusText !== 'undefined') statusText.innerText = `✅ 已匯出 ${items.length} 個物件`;
}

function updateLibraryBatchUI() {
    const count = selectedLibraryIds.size;
    const countSpan = document.getElementById('lib-selected-count');
    if (countSpan) countSpan.innerText = `已選 ${count} 項`;
    const btnMove = document.getElementById('btn-batch-move');
    const btnDel = document.getElementById('btn-batch-del');
    const btnCopy = document.getElementById('btn-batch-copy');
    const btnExport = document.getElementById('btn-batch-export');
    const isDisabled = (count === 0);
    if (btnMove) btnMove.disabled = isDisabled;
    if (btnDel) btnDel.disabled = isDisabled;
    if (btnCopy) btnCopy.disabled = isDisabled;
    if (btnExport) btnExport.disabled = isDisabled;
}

function triggerClearLibrary() {
    openExclusiveOptionsModal(
        "清除圖庫前，是否先進行備份？",
        [
            { label: "是，先下載備份檔 (推薦)", checked: true },
            { label: "否，直接清除", checked: false }
        ],
        async (results) => {
            const needBackup = results[0];
            if (needBackup) {
                await exportFullLibrary();
                setTimeout(performClearConfirm, 500);
            } else {
                performClearConfirm();
            }
        }
    );
}

function performClearConfirm() {
    showConfirm("⚠️ 警告：這將刪除圖庫內的所有分類與物件，且無法復原！\n確定要清空嗎？", async () => {
        try {
            await db.favorites.clear();
            await db.categories.clear();
            await ensureDefaultCategories();
            currentCategory = '未分類';
            selectedLibraryIds.clear();
            renderCategories();
            renderLibraryItems(currentCategory);
            updateLibraryBatchUI();
            showAlert("圖庫已清空並重置。");
        } catch (e) {
            showAlert("清除失敗：" + e.message);
        }
    });
}

function triggerLibraryRestore() {
    showConfirm("⚠️ 還原操作會「清空」目前的圖庫，並載入備份檔內容。\n確定要繼續嗎？", () => {
        document.getElementById('library-restore-input').click();
    });
}

async function restoreFullLibrary(input) {
    const file = input.files[0];
    if (!file) return;
    if (typeof statusText !== 'undefined') statusText.innerText = "⏳ 正在還原圖庫...";
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.items) throw new Error("格式錯誤或檔案損毀");
            await db.transaction('rw', db.favorites, db.categories, async () => {
                await db.favorites.clear();
                await db.categories.clear();
                let processedCount = 0;
                for (const item of data.items) {
                    const cat = item.category || '未分類';
                    const exist = await db.categories.where('name').equals(cat).count();
                    if (exist === 0) await db.categories.add({ name: cat });
                    let thumbnail = item.thumbnail;
                    await db.favorites.add({
                        name: item.name,
                        category: cat,
                        svgInner: item.svgInner,
                        thumbnail: thumbnail || item.svgInner,
                        timestamp: Date.now() + processedCount
                    });
                    processedCount++;
                }
                await ensureDefaultCategories();
            });
            currentCategory = '未分類';
            renderCategories();
            renderLibraryItems(currentCategory);
            showAlert(`還原成功！共載入 ${data.items.length} 個物件。`);
            if (typeof statusText !== 'undefined') statusText.innerText = "✅ 還原完成";
        } catch (err) {
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
                showAlert(`已將物件移動至「${targetCat}」`);
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

async function saveToCollection() {
    if (selectedElements.length === 0) {
        showAlert("請先選取要收藏的物件");
        return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const svgRect = svgCanvas.getBoundingClientRect();
        minX = Math.min(minX, rect.left - svgRect.left);
        minY = Math.min(minY, rect.top - svgRect.top);
        maxX = Math.max(maxX, rect.right - svgRect.left);
        maxY = Math.max(maxY, rect.bottom - svgRect.top);
    });
    const padding = 10;
    const width = maxX - minX, height = maxY - minY;
    const serializer = new XMLSerializer();
    let contentHtml = "";
    const selectedSet = new Set(selectedElements);
    const topLevelElements = selectedElements.filter(el => !selectedSet.has(el.parentNode));
    topLevelElements.forEach(el => {
        const clone = el.cloneNode(true);
        clone.classList.remove('selected');
        contentHtml += serializer.serializeToString(clone);
    });
    const bakedContentForThumbnail = await bakeMathJaxIntoSvg(contentHtml);
    const thumbSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}">
            <style>.shape { vector-effect: non-scaling-stroke; stroke: black; stroke-width: 2; fill: rgba(41,128,185,0.2); } text { font-family: Arial, sans-serif; font-weight: bold; }</style>
            ${bakedContentForThumbnail} 
        </svg>`;
    pendingFavoriteData = { svgInner: contentHtml, thumbnail: thumbSvg };
    let defaultName = lastInputName || "";
    let defaultCat = lastInputCategory || currentCategory || '未分類';
    if (topLevelElements.length === 1) {
        const originName = topLevelElements[0].getAttribute('data-origin-name');
        const originCat = topLevelElements[0].getAttribute('data-origin-cat');
        if (originName) defaultName = originName;
        if (originCat) defaultCat = originCat;
    }
    document.getElementById('favorite-name-input').value = lastInputName;
    const catSelect = document.getElementById('favorite-category-select');
    if (catSelect) {
        catSelect.innerHTML = '';
        const cats = await db.categories.toArray();
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name; opt.innerText = c.name;
            const target = lastInputCategory || currentCategory || '未分類';
            if (c.name === target) opt.selected = true;
            catSelect.appendChild(opt);
        });
    }
    document.getElementById('favorite-name-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('favorite-name-input').focus(), 100);
}

async function confirmSaveFavorite() {
    const nameInput = document.getElementById('favorite-name-input');
    const name = nameInput.value.trim() || "未命名收藏";
    const catSelect = document.getElementById('favorite-category-select');
    const targetCat = catSelect ? catSelect.value : '未分類';
    if (!pendingFavoriteData) return;
    lastInputName = name;
    lastInputCategory = targetCat;
    const existingItem = await db.favorites.where('category').equals(targetCat).and(item => item.name === name).first();
    if (existingItem) {
        openExclusiveOptionsModal(
            `分類「${targetCat}」中已有「${name}」，請選擇：`,
            [{ label: "覆蓋原圖 (修改)", checked: true }, { label: "另存新檔 (保留兩者)", checked: false }],
            async (results) => {
                if (results[0]) {
                    await db.favorites.delete(existingItem.id);
                    await saveDataToDB(name, targetCat);
                    finalizeSave(`✅ 已更新素材「${name}」並移至最前`, name, targetCat);
                } else {
                    const newName = name + "_copy";
                    lastInputName = newName;
                    await saveDataToDB(newName, targetCat);
                    finalizeSave(`✅ 已另存為「${newName}」`, newName, targetCat);
                }
            }
        );
    } else {
        await saveDataToDB(name, targetCat);
        finalizeSave(`✅ 已存入分類「${targetCat}」`, name, targetCat);
    }
}

function finalizeSave(msg, savedName, savedCat) {
    closeFavoriteNameModal();
    if (typeof statusText !== 'undefined') statusText.innerText = msg;
    if (selectedElements && selectedElements.length > 0) {
        selectedElements.forEach(el => {
            if (savedName) el.setAttribute('data-origin-name', savedName);
            if (savedCat) el.setAttribute('data-origin-cat', savedCat);
        });
        if (typeof saveState === 'function') saveState();
    }
    const libModal = document.getElementById('library-modal');
    if (libModal && libModal.style.display === 'flex') {
        renderCategories();
        renderLibraryItems(currentCategory);
    }
}

async function saveDataToDB(name, category) {
    await db.favorites.add({
        name: name,
        category: category,
        svgInner: pendingFavoriteData.svgInner,
        thumbnail: pendingFavoriteData.thumbnail,
        timestamp: Date.now()
    });
}

function closeFavoriteNameModal() {
    const modal = document.getElementById('favorite-name-modal');
    if (modal) modal.style.display = 'none';
    pendingFavoriteData = null;
}

window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('collection-dropdown');
    const triggerBtn = document.getElementById('btn-library-trigger');
    if (dropdown && dropdown.style.display === 'flex') {
        if (!dropdown.contains(e.target) && !triggerBtn.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }
});

async function openJsonImportModal() {
    document.getElementById('json-import-modal').style.display = 'flex';
    document.getElementById('json-import-area').value = "";
    const catSelect = document.getElementById('json-import-category');
    if (catSelect) {
        catSelect.innerHTML = '';
        const cats = await db.categories.toArray();
        cats.sort((a, b) => a.name === '未分類' ? -1 : 1);
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.innerText = c.name;
            if (c.name === (lastInputCategory || '未分類')) opt.selected = true;
            catSelect.appendChild(opt);
        });
    }
    setTimeout(() => document.getElementById('json-import-area').focus(), 100);
}

function insertFromCollection(svgInner, originName = null, originCat = null) {
    const svgCanvas = document.getElementById('svg-canvas');
    const shapesLayer = document.getElementById('shapes-layer');
    if (!svgCanvas || !shapesLayer) return;
    const canvasW = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const canvasH = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const tempGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tempGroup.innerHTML = svgInner.trim();
    let finalGroup;
    const children = Array.from(tempGroup.children);
    if (children.length === 1 && children[0].tagName.toLowerCase() === 'g' && children[0].getAttribute('data-tool') === 'group') {
        finalGroup = children[0];
    } else {
        finalGroup = tempGroup;
        finalGroup.setAttribute("class", "shape group");
        finalGroup.setAttribute("data-tool", "group");
    }
    const idMap = {};
    const allElements = Array.from(finalGroup.querySelectorAll('*'));
    allElements.forEach(child => {
        if (child.id) {
            const oldId = child.id;
            const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 9);
            idMap[oldId] = newId;
        }
    });
    allElements.forEach(child => {
        if (child.id && idMap[child.id]) {
            child.id = idMap[child.id];
        }
        if (child.hasAttribute('data-owner-circle-id')) {
            const oldOwnerId = child.getAttribute('data-owner-circle-id');
            if (idMap[oldOwnerId]) {
                child.setAttribute('data-owner-circle-id', idMap[oldOwnerId]);
            }
        }
        if (child.hasAttribute('data-owner-shape')) {
            const oldOwnerId = child.getAttribute('data-owner-shape');
            if (idMap[oldOwnerId]) {
                child.setAttribute('data-owner-shape', idMap[oldOwnerId]);
            }
        }
        if (child.hasAttribute('data-owner')) {
            const oldOwnerId = child.getAttribute('data-owner');
            if (idMap[oldOwnerId]) {
                child.setAttribute('data-owner', idMap[oldOwnerId]);
            }
        }
        if (child.hasAttribute('data-label-ids')) {
            const oldIds = child.getAttribute('data-label-ids').split(',');
            const newIds = oldIds.map(id => idMap[id] || id).join(',');
            child.setAttribute('data-label-ids', newIds);
        }
        if (child.hasAttribute('data-angle-label-ids')) {
            const oldIds = child.getAttribute('data-angle-label-ids').split(',');
            const newIds = oldIds.map(id => idMap[id] || id).join(',');
            child.setAttribute('data-angle-label-ids', newIds);
        }
        if (child.hasAttribute('data-owner-angle-shape')) {
            const oldOwnerId = child.getAttribute('data-owner-angle-shape');
            if (idMap[oldOwnerId]) {
                child.setAttribute('data-owner-angle-shape', idMap[oldOwnerId]);
            }
        }
    });
    if (originName) finalGroup.setAttribute('data-origin-name', originName);
    if (originCat) finalGroup.setAttribute('data-origin-cat', originCat);
    shapesLayer.appendChild(finalGroup);
    try {
        const bbox = finalGroup.getBBox();
        if (bbox.width > 0 || bbox.height > 0) {
            const tx = (canvasW / 2) - (bbox.x + bbox.width / 2);
            const ty = (canvasH / 2) - (bbox.y + bbox.height / 2);
            const currentTransform = finalGroup.getAttribute('transform') || "";
            finalGroup.setAttribute("transform", `translate(${tx}, ${ty}) ${currentTransform}`);
        } else {
            finalGroup.setAttribute("transform", `translate(${canvasW / 2}, ${canvasH / 2})`);
        }
    } catch (e) {
        finalGroup.setAttribute("transform", `translate(100, 100)`);
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
            const cleanContent = rawContent.replace(/^`|`$/g, '');
            div.innerHTML = '`' + cleanContent + '`';
            const fontSize = fo.getAttribute('data-font-size') || '24';
            const color = fo.getAttribute('fill') || 'black';
            div.style.fontSize = fontSize + "px";
            div.style.color = color;
            div.style.display = "inline-block";
            div.style.whiteSpace = "nowrap";
            fo.style.display = "";
            fo.style.visibility = "visible";
        }
    });
    if (window.MathJax) {
        MathJax.typesetPromise([finalGroup]).then(() => {
            mathObjects.forEach(fo => {
                const div = fo.querySelector('.math-content');
                if (div) {
                    const w = div.offsetWidth;
                    const h = div.offsetHeight;
                    if (w > 0 && h > 0) {
                        fo.setAttribute("width", w + 20);
                        fo.setAttribute("height", h + 20);
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
}

const GEMINI_API_KEY = "AIzaSyDJ-XtoTDFELrRPd22Uyr8vzqUdKlthMSE";
const GEMINI_MODEL_NAME = "gemini-3-flash-preview";
const GEOMETRY_SPEC_PROMPT = `
# 角色
你是一個精準的幾何圖形轉換器，擅長分析題目截圖並生成完美的 SVG 代碼。

# 任務
請分析圖片中的幾何圖形與文字，轉換為本編輯器專用的 JSON 格式。
畫布基準尺寸為 800x600，(0,0) 為左上角。請確保生成的圖形在畫布中央。

# 幾何轉換規格 (v2.2) - 必須嚴格遵守
1. 所有物件必須包含 class="shape"。
2. 多邊形優先：閉合圖形必須使用 <polygon points="...">，帶有 data-tool="polygon"。
3. 線段：使用 <line>，帶有 data-tool="line"。
4. 圓形：使用 <circle>，帶有 data-tool="ellipse" data-sub-tool="circle"。
5. 文字標籤：使用 transform="translate(x, y)" 定位，x="0" y="0"，帶有 data-tool="text"。

6. **數學公式 (重要：可編輯化規範)**：
   - 必須使用 <foreignObject>，且 class 必須包含 "shape math-obj"。
   - 必須帶有 data-tool="math" 屬性。
   - **必須帶有 data-content 屬性，內容為純數學公式文字 (不含引號)**。
   - 內部結構必須包含：<div xmlns="http://www.w3.org/1999/xhtml" class="math-content" style="..."> \`公式\` </div>。
   - **語法規範**：使用 **AsciiMath** (禁止使用 LaTeX 的 \\begin, \\\\, {cases} 等語法)。
   - **聯立方程式 (System of Equations)**：
     看到大括號聯立時，使用格式：\`{(方程1), (方程2):}\`。
     例如圖中：\`{(3x + 2y = 12), (x - y = 4):}\`。
   - 分數使用 a/b，根號使用 sqrt(x)。

7. 顏色：線條預設 #000000，填滿預設為 none。

# 輸出範例 (聯立方程)
{
  "name": "三角形與方程組",
  "svgInner": "<polygon class=\\"shape\\" points=\\"...\\" ... /><foreignObject class=\\"shape math-obj\\" data-tool=\\"math\\" data-content=\\"{(3x + 2y = 12), (x - y = 4):}\\" transform=\\"translate(200, 260)\\" width=\\"150\\" height=\\"80\\" x=\\"0\\" y=\\"0\\"><div xmlns=\\"http://www.w3.org/1999/xhtml\\" class=\\"math-content\\" style=\\"font-size:20px;\\">\`{(3x + 2y = 12), (x - y = 4):}\`</div></foreignObject>"
}

僅輸出純 JSON 物件。
`;

document.addEventListener('DOMContentLoaded', () => {
    const aiInput = document.getElementById('ai-image-input');
    const areaInput = document.getElementById('json-import-area');
    const importModal = document.getElementById('json-import-modal');
    if (aiInput) {
        aiInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processAiImageAnalysis(e.target.files[0]);
            }
        });
    }
    window.addEventListener('paste', (e) => {
        if (importModal && importModal.style.display !== 'none') {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    processAiImageAnalysis(blob);
                    e.preventDefault();
                    break;
                }
            }
        }
    });
    if (areaInput) {
        areaInput.addEventListener('input', refreshImportPreview);
    }
});

async function handleExplicitPaste() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            const imageTypes = item.types.filter(type => type.startsWith('image/'));
            if (imageTypes.length > 0) {
                const blob = await item.getType(imageTypes[0]);
                processAiImageAnalysis(blob);
                return;
            }
        }
        alert("剪貼簿中沒有圖片資料，請先截圖。");
    } catch (err) {
        console.error("無法讀取剪貼簿:", err);
        alert("請允許瀏覽器讀取剪貼簿權限，或直接使用 Ctrl+V 貼上。");
    }
}

async function processAiImageAnalysis(imageSource) {
    const statusEl = document.getElementById('ai-status-display');
    const areaInput = document.getElementById('json-import-area');
    const btnConfirm = document.getElementById('btn-ai-confirm');
    const sourcePreview = document.getElementById('source-image-preview');
    statusEl.innerHTML = "⏳ AI (Flash) 正在識圖並建模中...";
    btnConfirm.disabled = true;
    areaInput.value = "";
    const reader = new FileReader();
    reader.onload = (e) => {
        sourcePreview.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
    };
    reader.readAsDataURL(imageSource);
    try {
        const base64Data = await fileToGenerativePart(imageSource);
        const genAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
        const result = await model.generateContent([GEOMETRY_SPEC_PROMPT, base64Data]);
        const text = await result.response.text();
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }
        areaInput.value = cleanJson;
        refreshImportPreview();
        statusEl.innerHTML = "<span style='color:#27ae60;'>✅ 解析完成</span>";
        btnConfirm.disabled = false;
    } catch (err) {
        console.error("AI 解析失敗:", err);
        statusEl.innerHTML = "<span style='color:#c0392b;'>❌ 解析失敗</span>";
        btnConfirm.disabled = false;
    }
}

function refreshImportPreview() {
    const areaInput = document.getElementById('json-import-area');
    const previewSvg = document.getElementById('import-preview-svg');
    const errorMsg = document.getElementById('preview-error-msg');
    const nameInput = document.getElementById('json-import-name');
    if (!areaInput || !previewSvg) return;
    const rawVal = areaInput.value.trim();
    if (!rawVal) {
        previewSvg.innerHTML = "";
        errorMsg.style.display = "none";
        return;
    }
    try {
        const data = JSON.parse(rawVal);
        if (data.svgInner) {
            previewSvg.innerHTML = data.svgInner;
            errorMsg.style.display = "none";
            if (nameInput && !nameInput.value && data.name) {
                nameInput.value = data.name;
            }
        }
    } catch (e) {
        errorMsg.style.display = "block";
    }
}

async function confirmJsonImport() {
    const jsonStr = document.getElementById('json-import-area').value.trim();
    const customName = document.getElementById('json-import-name').value.trim();
    const targetCategory = document.getElementById('json-import-category').value;
    if (!jsonStr) {
        showAlert("請先上傳圖片解析或貼上 JSON 代碼");
        return;
    }
    try {
        const data = JSON.parse(jsonStr);
        lastInputCategory = targetCategory;
        if (data.type === "MathEditor_Library_Backup" && Array.isArray(data.items)) {
            for (const item of data.items) {
                await saveSingleItemToDb(item.name, item.svgInner, item.category || targetCategory);
            }
            showAlert(`成功匯入 ${data.items.length} 個素材`, "批量匯入成功");
        } else {
            const finalName = customName || data.name || "未命名素材";
            await saveSingleItemToDb(finalName, data.svgInner, targetCategory);
            lastInputName = finalName;
            insertFromCollection(data.svgInner, finalName, targetCategory);
        }
        closeJsonImportModal();
        if (typeof renderCategories === 'function') renderCategories();
        if (typeof renderLibraryItems === 'function') renderLibraryItems(currentCategory);
    } catch (err) {
        console.error("Import Error:", err);
        showAlert("解析失敗：JSON 格式不正確或內容損毀。", "錯誤");
    }
}

async function saveSingleItemToDb(name, svgInner, category = "未分類") {
    let thumbnail = "";
    try {
        thumbnail = await generateThumbnailFromSvgString(svgInner);
    } catch (e) {
        thumbnail = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50">無預覽</text>${svgInner}</svg>`;
    }
    return await db.favorites.add({
        name: name || "未命名素材",
        category: category,
        svgInner: svgInner,
        thumbnail: thumbnail,
        timestamp: Date.now()
    });
}

function closeJsonImportModal() {
    document.getElementById('json-import-modal').style.display = 'none';
    document.getElementById('ai-status-display').innerHTML = "";
    document.getElementById('ai-image-input').value = "";
    document.getElementById('json-import-area').value = "";
    document.getElementById('json-import-name').value = "";
    document.getElementById('import-preview-svg').innerHTML = "";
    document.getElementById('source-image-preview').innerHTML = `<span style="color: #ccc; font-size: 11px;">尚未上傳圖片</span>`;
    document.getElementById('preview-error-msg').style.display = "none";
}

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

async function exportFullLibrary() {
    const allItems = await db.favorites.toArray();
    const exportData = {
        type: "MathEditor_Library_Backup",
        version: "2.1",
        timestamp: Date.now(),
        items: allItems.map(i => ({
            name: i.name,
            svgInner: i.svgInner,
            category: i.category,
            thumbnail: i.thumbnail
        }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    saveBlobDirectly(blob, `Library_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    if (typeof statusText !== 'undefined') statusText.innerText = "✅ 圖庫備份已下載 (含縮圖)";
}

function triggerLibraryImport() {
    document.getElementById('library-import-input').click();
}

async function importFullLibrary(input) {
    const file = input.files[0];
    if (!file) return;
    if (typeof statusText !== 'undefined') statusText.innerText = "⏳ 正在處理匯入...";
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.items) throw new Error("格式錯誤");
            showConfirm(`偵測到 ${data.items.length} 個素材，確定要匯入嗎？\n(若無縮圖將自動生成，可能需要幾秒鐘)`, async () => {
                let processedCount = 0;
                for (const item of data.items) {
                    const cat = item.category || '未分類';
                    const exist = await db.categories.where('name').equals(cat).count();
                    if (exist === 0) await db.categories.add({ name: cat });
                    let thumbnail = item.thumbnail;
                    if (!thumbnail || thumbnail.includes('已匯入') || thumbnail.includes('text y="50"')) {
                        thumbnail = await generateThumbnailFromSvgString(item.svgInner);
                    }
                    await db.favorites.add({
                        name: item.name,
                        category: cat,
                        svgInner: item.svgInner,
                        thumbnail: thumbnail,
                        timestamp: Date.now() + processedCount
                    });
                    processedCount++;
                }
                renderCategories();
                renderLibraryItems(currentCategory);
                showAlert(`成功匯入 ${processedCount} 個素材`);
                if (typeof statusText !== 'undefined') statusText.innerText = "✅ 匯入完成";
                input.value = "";
            }, () => {
                input.value = "";
            });
        } catch (err) {
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

async function openLibraryPreview(id) {
    const item = await db.favorites.get(id);
    if (!item) return;
    previewingItemData = item;
    const modal = document.getElementById('library-preview-modal');
    const header = document.getElementById('preview-header');
    const container = document.getElementById('preview-image-container');
    header.textContent = `預覽：${item.name}`;
    const blob = new Blob([item.thumbnail], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    container.innerHTML = `<img src="${url}" 
                                style="max-width: 400px; max-height: 400px; object-fit: contain; cursor: pointer;" 
                                onclick="insertFromPreview()"
                                title="點擊圖片可直接插入畫布">`;
    modal.style.display = 'flex';
}

function closeLibraryPreview() {
    const modal = document.getElementById('library-preview-modal');
    modal.style.display = 'none';
    previewingItemData = null;
}

function insertFromPreview() {
    if (previewingItemData) {
        lastInputName = previewingItemData.name;
        lastInputCategory = previewingItemData.category;
        insertFromCollection(previewingItemData.svgInner, previewingItemData.name, previewingItemData.category);
        if (typeof statusText !== 'undefined') statusText.innerText = `✅ 已插入圖形：${previewingItemData.name}`;
        closeLibraryPreview();
        closeLibraryModal();
    }
}

async function bakeMathJaxIntoSvg(svgInner) {
    const div = document.createElement('div');
    div.style.cssText = "position: absolute; left: -9999px; top: -9999px; visibility: hidden;";
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${svgInner}</svg>`;
    document.body.appendChild(div);
    const tempSvg = div.querySelector('svg');
    try {
        const fos = tempSvg.querySelectorAll('foreignObject[data-tool="math"], foreignObject.math-obj');
        for (const fo of fos) {
            let mathJaxSvg = fo.querySelector('mjx-container svg, .math-content svg');
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
                const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const x = parseFloat(fo.getAttribute('x')) || 0;
                const y = parseFloat(fo.getAttribute('y')) || 0;
                const transform = fo.getAttribute('transform') || '';
                g.setAttribute('transform', `${transform} translate(${x}, ${y})`);
                const nestedSvg = mathJaxSvg.cloneNode(true);
                nestedSvg.setAttribute('width', mathJaxSvg.getAttribute('width'));
                nestedSvg.setAttribute('height', mathJaxSvg.getAttribute('height'));
                nestedSvg.setAttribute('x', '10');
                nestedSvg.setAttribute('y', '10');
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
        const shapesLayer = document.getElementById('shapes-layer');
        if (shapesLayer) shapesLayer.innerHTML = '';
        if (typeof deselectAll === 'function') deselectAll();
        isImportedContent = false;
        insertFromPreview();
        if (typeof statusText !== 'undefined') statusText.innerText = "✅ 已清空畫布並取代為新物件";
    }
}