/* --- START OF FILE questions.js --- */

/* --- questions.js (題庫與浮動入庫系統 - 完整功能版) --- */

window.createQuestionTextShape = function(content, cx, ty) {
    let cleanText = "";
    if (typeof content === 'string') {
        cleanText = content.replace(/<[^>]*>?/gm, '').trim(); 
    }

    const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    const presetWidth = 650;
    const startX = cx - presetWidth / 2;

    fo.setAttribute("transform", `translate(${startX}, ${ty})`);
    fo.setAttribute("x", "0");
    fo.setAttribute("y", "0");
    fo.setAttribute("width", presetWidth);
    fo.setAttribute("height", "50");
    fo.setAttribute("class", "shape math-obj");
    fo.setAttribute("data-tool", "math");
    fo.setAttribute("data-content", cleanText); 
    fo.setAttribute("data-font-size", "22");
    fo.setAttribute("fill", "#000000");
    fo.style.cursor = "move";

    const div = document.createElement("div");
    div.className = "math-content";
    div.style.cssText = `font-size: 22px; color: #000000; white-space: pre-wrap !important; word-break: break-word; line-height: 1.5; margin: 0; padding: 5px;`;

    div.innerHTML = window.formatSmartMathText ? window.formatSmartMathText(cleanText) : cleanText;

    fo.appendChild(div);
    const shapesLayer = document.getElementById('shapes-layer');
    if (shapesLayer) shapesLayer.appendChild(fo);

    if (window.MathJax) {
        MathJax.typesetPromise([div]).then(() => {
            setTimeout(() => {
                const h = div.offsetHeight;
                if (h > 0) fo.setAttribute("height", h + 15);
                if (typeof saveState === 'function') saveState();
            }, 150);
        });
    }
    return fo;
};

let currentSaveTargetElements =[];

// 獨立記憶圖庫與題庫的名稱和標籤
let lastInputNameLibrary = "";
let lastInputTagsLibrary = "";
let lastInputNameQuestion = "";
let lastInputTagsQuestion = "";

function triggerSaveToLibrary() {
    if (selectedElements.length === 0) {
        showAlert("圖形入庫請先「選取」要在畫布上的物件！\n(若要整頁存為題目，請點擊「畫布題目入庫」)");
        return;
    }
    currentSaveTargetElements = [...selectedElements];
    openFloatingSavePanel('library', '');
}

function triggerSaveToQuestionBank() {
    currentSaveTargetElements =[]; 
    openFloatingSavePanel('question', '');
}

async function openFloatingSavePanel(defaultMode = 'question', defaultName = "") {
    const panel = document.getElementById('floating-save-panel');
    const catSelect = document.getElementById('floating-save-category');
    
    catSelect.innerHTML = '';
    const cats = await db.categories.toArray();
    cats.sort((a, b) => a.name === '未分類' ? -1 : 1);
    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name; opt.innerText = c.name;
        if (c.name === (typeof lastInputCategory !== 'undefined' ? lastInputCategory : '未分類')) opt.selected = true;
        catSelect.appendChild(opt);
    });

    document.querySelector(`input[name="save-mode"][value="${defaultMode}"]`).checked = true;
    
    const nameInput = document.getElementById('floating-save-name');
    const tagsInput = document.getElementById('floating-save-tags');
    
    // 依據模式載入對應的記憶
    nameInput.value = defaultName || (defaultMode === 'question' ? lastInputNameQuestion : lastInputNameLibrary);
    tagsInput.value = defaultMode === 'question' ? lastInputTagsQuestion : lastInputTagsLibrary;
    
    panel.style.display = 'flex';
    toggleSaveModeUI();
}

function cancelFloatingSave() {
    document.getElementById('floating-save-panel').style.display = 'none';
}

function toggleSaveModeUI() {
    const mode = document.querySelector('input[name="save-mode"]:checked').value;
    const msgBox = document.getElementById('save-validation-msg');
    const nameInput = document.getElementById('floating-save-name');
    const tagsInput = document.getElementById('floating-save-tags');
    
    if (mode === 'question') {
        msgBox.innerHTML = "提示：系統將自動擷取畫布上的 ASCIIMath 作為題目，其餘作為配圖。";
        msgBox.style.color = "#2980b9";
        // 如果使用者切換 radio，且沒手動亂改，就自動切換回該模式的記憶
        if (nameInput.value === lastInputNameLibrary) nameInput.value = lastInputNameQuestion;
        if (tagsInput.value === lastInputTagsLibrary) tagsInput.value = lastInputTagsQuestion;
    } else {
        msgBox.innerHTML = currentSaveTargetElements.length > 0 
            ? `提示：將儲存目前選取的 ${currentSaveTargetElements.length} 個圖形。` 
            : "⚠️ 警告：目前沒有選取物件，將儲存「全畫布」為單一圖片。";
        msgBox.style.color = currentSaveTargetElements.length > 0 ? "#27ae60" : "#e74c3c";
        if (nameInput.value === lastInputNameQuestion) nameInput.value = lastInputNameLibrary;
        if (tagsInput.value === lastInputTagsQuestion) tagsInput.value = lastInputTagsLibrary;
    }
}

async function confirmFloatingSave() {
    const mode = document.querySelector('input[name="save-mode"]:checked').value;
    const title = document.getElementById('floating-save-name').value.trim() || "未命名";
    const tagsStr = document.getElementById('floating-save-tags').value.trim();
    const category = document.getElementById('floating-save-category').value;
    const msgBox = document.getElementById('save-validation-msg');

    // 處理 Tags 陣列 (以逗號或空白分隔，去除 # 字號與空值)
    const tagsArray = tagsStr.split(/[, ]+/).map(t => t.replace(/^#/, '').trim()).filter(t => t);

    // 更新記憶
    if (mode === 'question') {
        lastInputNameQuestion = title;
        lastInputTagsQuestion = tagsStr;
    } else {
        lastInputNameLibrary = title;
        lastInputTagsLibrary = tagsStr;
    }
    if (typeof lastInputCategory !== 'undefined') lastInputCategory = category;

    try {
        const targetTable = mode === 'question' ? db.questions : db.favorites;
        const existingItem = await targetTable.where('category').equals(category)
            .and(item => (mode === 'question' ? item.title : item.name) === title).first();

        if (existingItem) {
            openExclusiveOptionsModal(
                `分類「${category}」中已有名稱「${title}」的檔案，請選擇：`,[{ label: "覆蓋原檔 (修改)", checked: true }, { label: "另存新檔 (保留兩者)", checked: false }],
                async (results) => {
                    try {
                        let finalTitle = title;
                        if (results[0]) {
                            await targetTable.delete(existingItem.id);
                        } else {
                            finalTitle = title + "_copy";
                        }

                        if (mode === 'question') {
                            await processQuestionExtraction(finalTitle, category, tagsArray, msgBox);
                        } else {
                            await processLibraryExtraction(finalTitle, category, tagsArray);
                        }
                    } catch (err) {
                        msgBox.style.color = "#e74c3c";
                        msgBox.innerHTML = `❌ ${err.message}`;
                    }
                }
            );
        } else {
            if (mode === 'question') {
                await processQuestionExtraction(title, category, tagsArray, msgBox);
            } else {
                await processLibraryExtraction(title, category, tagsArray);
            }
        }
    } catch (e) {
        msgBox.style.color = "#e74c3c";
        msgBox.innerHTML = `❌ ${e.message}`;
    }
}

async function processQuestionExtraction(title, category, tagsArray, msgBox) {
    const allShapes = Array.from(shapesLayer.children);
    const mathObjects = allShapes.filter(el => el.getAttribute('data-tool') === 'math');

    if (mathObjects.length === 0) {
        throw new Error("無法儲存為題目：找不到 ASCIIMath 公式物件。<br>請使用「∑ 數學式」建立題目文字。");
    }
    if (mathObjects.length > 1) {
        throw new Error("無法儲存為題目：畫布上存在多個 ASCIIMath 物件。<br>請將題目合併到單一個公式方塊中。");
    }

    const targetMathObj = mathObjects[0];
    const questionText = targetMathObj.getAttribute('data-content') || "";

    const graphicObjects = allShapes.filter(el => el !== targetMathObj && el.getAttribute('data-tool') !== 'grid');
    
    let illustrationSvg = "";
    if (graphicObjects.length > 0) {
        illustrationSvg = await extractCleanSvgGroup(graphicObjects);
    }

    await db.questions.add({
        title: title,
        category: category,
        tags: tagsArray, // 寫入標籤
        questionText: questionText,
        illustrationSvg: illustrationSvg,
        timestamp: Date.now()
    });

    document.getElementById('floating-save-panel').style.display = 'none';
    statusText.innerText = `✅ 題目「${title}」已存入題庫。`;
    
    renderQBCategories();
    renderQBItems(currentCategory);
	if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
}

async function processLibraryExtraction(name, category, tagsArray) {
    let elementsToExtract = currentSaveTargetElements.length > 0 
                            ? currentSaveTargetElements 
                            : Array.from(shapesLayer.children).filter(el => el.getAttribute('data-tool') !== 'grid');
    
    if (elementsToExtract.length === 0) throw new Error("畫布上沒有可儲存的物件。");

    const svgInner = await extractCleanSvgGroup(elementsToExtract, false);
    
    let thumbnail = "";
    try {
        if (typeof generateThumbnailFromSvgString === 'function') {
            thumbnail = await generateThumbnailFromSvgString(svgInner);
        }
    } catch(e) {}

    await db.favorites.add({
        name: name,
        category: category,
        tags: tagsArray, // 寫入標籤
        svgInner: svgInner,
        thumbnail: thumbnail || svgInner,
        timestamp: Date.now()
    });

    document.getElementById('floating-save-panel').style.display = 'none';
    statusText.innerText = `✅ 素材「${name}」已存入圖庫。`;
    
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderLibraryItems === 'function') renderLibraryItems(currentCategory);
	if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
}

async function extractCleanSvgGroup(elements, forceGroup = true) {
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const serializer = new XMLSerializer();
    elements.forEach(el => {
        const clone = el.cloneNode(true);
        clone.classList.remove('selected');
        group.innerHTML += serializer.serializeToString(clone);
    });

    tempSvg.appendChild(group);
    document.body.appendChild(tempSvg);

    let resultHtml = "";
    try {
        const bbox = group.getBBox();
        if (bbox.width === 0 && bbox.height === 0) return "";
        
        const tx = -bbox.x;
        const ty = -bbox.y;
        
        if (forceGroup) {
            group.setAttribute('transform', `translate(${tx}, ${ty})`);
            group.setAttribute("class", "shape group");
            group.setAttribute("data-tool", "group");
            resultHtml = serializer.serializeToString(group);
        } else {
            resultHtml = group.innerHTML;
        }
    } finally {
        document.body.removeChild(tempSvg);
    }
    return resultHtml;
}

// ==========================================
// 題庫管理 UI 邏輯 (包含新增的匯出入/備份功能)
// ==========================================
let qbItems = [];
let selectedQBIds = new Set();

async function openQuestionBankModal() {
    document.getElementById('question-bank-modal').style.display = 'flex';
    selectedQBIds.clear();
    await renderQBCategories();
    renderQBItems(currentCategory);
}

async function renderQBCategories() {
    const list = document.getElementById('qb-category-list');
    if (!list) return;
    
    list.innerHTML = '';
    const cats = await db.categories.toArray();
    cats.sort((a, b) => a.name === '未分類' ? -1 : 1);

    for (const cat of cats) {
        const count = await db.questions.where('category').equals(cat.name).count();
        const div = document.createElement('div');
        div.className = `category-item ${currentCategory === cat.name ? 'active' : ''}`;
        div.innerHTML = `<span>${cat.name}</span><span class="cat-count">${count}</span>`;
        div.onclick = () => {
            currentCategory = cat.name;
            // 【修復】加入防呆保護，避免 qb-search 找不到時報錯
            const searchInput = document.getElementById('qb-search');
            if (searchInput) searchInput.value = ""; 
            
            renderQBCategories();
            renderQBItems(currentCategory);
        };
        list.appendChild(div);
    }
    
    // 控制「刪除此分類」按鈕的顯示 (未分類不可刪除)
    const btnDelQB = document.getElementById('btn-del-qb-cat');
    if(btnDelQB) {
        btnDelQB.style.display = (currentCategory === '未分類') ? 'none' : 'block';
    }
}


let qbSearchRequestId = 0;
async function renderQBItems(category, filterText = "", scope = "global") {
    const currentReqId = ++qbSearchRequestId;

    const grid = document.getElementById('qb-item-grid');
    const emptyMsg = document.getElementById('qb-empty-msg');
    const emptyText = document.getElementById('qb-empty-text');

    let items =[];

    if (filterText.trim() !== "") {
        const lowerText = filterText.toLowerCase();
        
        if (scope === 'global') {
            items = await db.questions.filter(item => {
                const tagStr = (item.tags ||[]).join(' ').toLowerCase();
                return (item.title && item.title.toLowerCase().includes(lowerText)) || 
                       (item.questionText && item.questionText.toLowerCase().includes(lowerText)) ||
                       tagStr.includes(lowerText);
            }).reverse().toArray();
        } else {
            items = await db.questions.filter(item => {
                const tagStr = (item.tags ||[]).join(' ').toLowerCase();
                return item.category === category && (
                       (item.title && item.title.toLowerCase().includes(lowerText)) || 
                       (item.questionText && item.questionText.toLowerCase().includes(lowerText)) ||
                       tagStr.includes(lowerText));
            }).reverse().toArray();
        }
    } else {
        items = await db.questions.where('category').equals(category).reverse().toArray();
    }

    if (currentReqId !== qbSearchRequestId) return;

    qbItems = items; 

    if (grid) grid.innerHTML = '';
    
    if (items.length === 0) {
        if (grid) grid.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'flex';
        if (emptyText) emptyText.innerText = filterText ? `找不到「${filterText}」` : "此分類尚無題目";
        
        const selectAllChk = document.getElementById('qb-select-all');
        if (selectAllChk) {
            selectAllChk.checked = false;
            selectAllChk.disabled = true;
        }
    } else {
        if (grid) grid.style.display = 'grid';
        if (emptyMsg) emptyMsg.style.display = 'none';
        
        const selectAllChk = document.getElementById('qb-select-all');
        if (selectAllChk) selectAllChk.disabled = false;

        const allSelected = items.length > 0 && items.every(i => selectedQBIds.has(i.id));
        if (selectAllChk) selectAllChk.checked = allSelected;

        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const isSelected = selectedQBIds.has(item.id);
            const card = document.createElement('div');
            card.className = `lib-card ${isSelected ? 'selected' : ''}`;
            card.style.height = "220px";

            const previewText = item.questionText.length > 50 ? item.questionText.substring(0, 50) + "..." : item.questionText;
            
            let thumbHtml = '<div style="color:#ccc; font-size:12px;">無配圖</div>';
            if (item.illustrationSvg) {
                const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><style>.shape{stroke:black;stroke-width:2;fill:none;}text{font-family:Arial;}</style>${item.illustrationSvg}</svg>`], {type: 'image/svg+xml;charset=utf-8'});
                thumbHtml = `<img src="${URL.createObjectURL(blob)}">`;
            }

            const showCatTag = (scope === 'global' && filterText !== "");
            const catTagHtml = showCatTag ? `<div class="lib-card-cat-tag">${item.category}</div>` : '';
            
            // 顯示標籤
            const tagsDisplay = (item.tags && item.tags.length > 0) 
                ? `<div style="padding: 2px 8px; font-size: 11px; color: #8e44ad; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-bottom:1px dashed #eee;">${item.tags.map(t=>'#'+t).join(' ')}</div>` 
                : '';

            card.innerHTML = `
                <input type="checkbox" class="lib-card-check" ${isSelected ? 'checked' : ''}>
                <div style="padding: 8px 8px 4px 35px; background:#e8f6f3; font-weight:bold; font-size:13px; color:#16a085; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.title}
                </div>
                ${tagsDisplay}
                <div style="padding:8px; font-size:12px; color:#333; height:40px; overflow:hidden; border-bottom:1px dashed #eee; font-family:monospace;">
                    ${previewText}
                </div>
                <div class="lib-card-thumb" style="height:110px; border-bottom:none;">
                    ${thumbHtml}
                </div>
                ${catTagHtml}
                <div class="lib-card-actions">
                    <div class="lib-btn-mini" title="插入畫布編輯" onclick="insertQuestionToCanvas(${item.id}, event)">📥</div>
                    <div class="lib-btn-mini lib-btn-del" title="刪除" onclick="deleteQuestion(${item.id}, event)">🗑️</div>
                </div>
                <div class="lib-card-actions" style="top: auto; bottom: 5px; flex-direction: row-reverse; gap: 5px;">
                    <div class="lib-btn-mini" style="color:#e67e22; border-color:#e67e22;" title="複製整題圖文 (PPT一鍵貼上)" onclick="copyQuestionCompositeImageToClipboard(${item.id}, event)">📸</div>
                    <div class="lib-btn-mini" style="color:#27ae60; border-color:#27ae60;" title="僅複製配圖 (高畫質去背)" onclick="copyQuestionImageToClipboard(${item.id}, event)">🖼️</div>
                    <div class="lib-btn-mini" style="color:#2980b9; border-color:#2980b9;" title="僅複製文字與可編輯公式 (Word專用)" onclick="copyQuestionTextToClipboard(${item.id}, event)">📝</div>
                </div>
            `;
            
            card.onclick = (e) => {
                if (e.target.tagName === 'INPUT') toggleQBSelection(item.id);
                else insertQuestionToCanvas(item.id);
            };
            fragment.appendChild(card);
        });
        if (grid) grid.appendChild(fragment);
    }
    updateQBBatchUI();
}

async function deleteCurrentQBCategory() {
    if (currentCategory === '未分類') return;

    const count = await db.questions.where('category').equals(currentCategory).count();
    
    if (count > 0) {
        openExclusiveOptionsModal(
            `分類「${currentCategory}」內有 ${count} 個題目，您要？`,[
                { label: "刪除分類，並刪除所有內容", checked: false },
                { label: "刪除分類，將內容移至「未分類」", checked: true }
            ],
            async (results) => {
                const deleteAll = results[0];
                const moveToUncategorized = results[1];

                if (deleteAll) {
                    await db.questions.where('category').equals(currentCategory).delete();
                    await db.categories.where('name').equals(currentCategory).delete();
                } else if (moveToUncategorized) {
                    await db.questions.where('category').equals(currentCategory).modify({ category: '未分類' });
                    await db.categories.where('name').equals(currentCategory).delete();
                }
                
                currentCategory = '未分類';
                renderQBCategories();
                renderQBItems('未分類');
            }
        );
    } else {
        showConfirm(`確定刪除空分類「${currentCategory}」嗎？`, async () => {
            await db.categories.where('name').equals(currentCategory).delete();
            currentCategory = '未分類';
            renderQBCategories();
            renderQBItems('未分類');
        });
    }
}

function filterQuestionItems() {
    const text = document.getElementById('qb-search').value;
    const scope = document.querySelector('input[name="qb-search-scope"]:checked')?.value || 'global';
    renderQBItems(currentCategory, text, scope);
}

function insertQuestionToCanvas(id, e) {
    if(e) e.stopPropagation();
    db.questions.get(id).then(item => {
        if (!item) return;

        if (shapesLayer.children.length > 0 && typeof saveCurrentPageToMemory === 'function') {
            saveCurrentPageToMemory();
            mathPages.splice(currentPageIndex + 1, 0, createEmptyPageData());
            currentPageIndex++;
            loadPageToCanvas(currentPageIndex);
            renderPageTabs();
        }

        let mathObj = null;
        if (item.questionText) {
            mathObj = window.createQuestionTextShape(item.questionText, 400, 40);
        }

        if (item.illustrationSvg) {
            const tempGroup = document.createElementNS(ns, "g");
            tempGroup.innerHTML = item.illustrationSvg;
            
            const finalGroup = tempGroup.firstElementChild; 
            if (finalGroup) {
                const allElements = Array.from(finalGroup.querySelectorAll('*'));
                allElements.forEach(child => {
                    if (child.id) child.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2,5);
                });
                
                shapesLayer.appendChild(finalGroup);

                setTimeout(() => {
                    let targetY = 100;
                    if (mathObj) {
                        const bbox = mathObj.getBBox();
                        if (bbox.height > 0) {
                            targetY = bbox.y + bbox.height + 30; 
                        }
                    }
                    
                    const gBBox = finalGroup.getBBox();
                    const canvasW = parseFloat(svgCanvas.getAttribute('width')) || 800;
                    const targetX = (canvasW - gBBox.width) / 2;
                    
                    const shiftX = targetX - gBBox.x;
                    const shiftY = targetY - gBBox.y;
                    
                    finalGroup.setAttribute("transform", `translate(${shiftX}, ${shiftY})`);
                    
                    saveState(); 
                    setMode('select');
                    selectAllShapes();
                }, 200);
            }
        } else {
            setTimeout(() => {
                saveState();
                setMode('select');
                selectAllShapes();
            }, 200);
        }
        
        document.getElementById('question-bank-modal').style.display = 'none';
        statusText.innerText = `✅ 題目載入完成，已自動全選並進入選取模式。`;
    });
}

function deleteQuestion(id, e) {
    if(e) e.stopPropagation();
    showConfirm("確定要刪除此題目嗎？", async () => {
        await db.questions.delete(id);
        renderQBItems(currentCategory);
        renderQBCategories();
		if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
    });
}

// 3. 修改：切換選取時，需帶入當前的搜尋狀態 (避免刷新後搜尋結果消失)
function toggleQBSelection(id) {
    if (selectedQBIds.has(id)) selectedQBIds.delete(id);
    else selectedQBIds.add(id);
    
    // 讀取當前搜尋狀態
    const text = document.getElementById('qb-search').value;
    const scope = document.querySelector('input[name="qb-search-scope"]:checked')?.value || 'global';
    renderQBItems(currentCategory, text, scope);
}

// 4. 修改：全選時，需帶入當前的搜尋狀態
function toggleSelectAllQB() {
    const chk = document.getElementById('qb-select-all');
    if (chk.checked) qbItems.forEach(i => selectedQBIds.add(i.id));
    else selectedQBIds.clear();
    
    // 讀取當前搜尋狀態
    const text = document.getElementById('qb-search').value;
    const scope = document.querySelector('input[name="qb-search-scope"]:checked')?.value || 'global';
    renderQBItems(currentCategory, text, scope);
}

function updateQBBatchUI() {
    const count = selectedQBIds.size;
    const countSpan = document.getElementById('qb-selected-count');
    if(countSpan) countSpan.innerText = `已選 ${count} 題`;
    
    const isDisabled = (count === 0);
    
    // 處理主要按鈕
    document.getElementById('qb-btn-move').disabled = isDisabled;
    document.getElementById('qb-btn-copy').disabled = isDisabled;
    document.getElementById('qb-btn-del').disabled = isDisabled;

    // 處理下拉選單內的項目
    const moreActions = {
        'qb-btn-code': document.getElementById('qb-btn-code'),
        'qb-btn-share': document.getElementById('qb-btn-share'),
        'qb-btn-publish': document.getElementById('qb-btn-publish')
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

    document.getElementById('btn-qb-more-actions').disabled = allMoreDisabled;
}

async function batchDeleteQBItems() {
    showConfirm(`確定刪除這 ${selectedQBIds.size} 題嗎？`, async () => {
        await db.questions.bulkDelete(Array.from(selectedQBIds));
        selectedQBIds.clear();
        renderQBItems(currentCategory);
        renderQBCategories();
		if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
    });
}

async function batchMoveQBItems() {
    await handleQBBatchTransfer(false);
}

async function batchCopyQBItems() {
    await handleQBBatchTransfer(true);
}

async function handleQBBatchTransfer(isCopy) {
    const cats = await db.categories.toArray();
    const targets = cats.map(c => c.name);
    
    openExclusiveOptionsModal(`請選擇目標分類 (${isCopy ? '複製' : '移動'})`, 
        targets.map(t => ({ label: t, checked: false })), 
        async (results) => {
            const targetIndex = results.findIndex(r => r === true);
            if (targetIndex !== -1) {
                const targetCat = targets[targetIndex];
                const items = await db.questions.where('id').anyOf(Array.from(selectedQBIds)).toArray();
                
                if (isCopy) {
                    const newItems = items.map(i => ({...i, id: undefined, category: targetCat, timestamp: Date.now()}));
                    await db.questions.bulkAdd(newItems);
                } else {
                    await db.questions.where('id').anyOf(Array.from(selectedQBIds)).modify({ category: targetCat });
                }
                
                selectedQBIds.clear();
                renderQBCategories();
                renderQBItems(currentCategory);
				if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud();
                showAlert(`✅ 已成功${isCopy ? '複製' : '移動'}至「${targetCat}」`);
            }
        }
    );
}

// ------------------------------------
// 新增功能：匯出、匯入、備份、還原、清除、複製代碼
// ------------------------------------

async function exportFullQuestionBank() {
    const allItems = await db.questions.toArray();
    const exportData = {
        type: "MathEditor_Questions_Backup",
        version: "2.1",
        timestamp: Date.now(),
        items: allItems
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    saveBlobDirectly(blob, `Questions_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    if(typeof statusText !== 'undefined') statusText.innerText = "✅ 題庫備份已下載";
}

function triggerQuestionImport() {
    document.getElementById('question-import-input').click();
}

async function importFullQuestionBank(input) {
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
                    title: (data.name || "Canvas_Page") + "_" + (idx + 1),
                    category: "未分類",
                    questionText: "",
                    illustrationSvg: p.shapes || ""
                }));
            } else if (data.svgInner !== undefined || data.illustrationSvg !== undefined) {
                itemsToProcess =[{
                    title: data.name || data.title || "Imported_Question",
                    category: "未分類",
                    questionText: data.questionText || "",
                    illustrationSvg: data.svgInner || data.illustrationSvg || ""
                }];
            } else {
                throw new Error("格式錯誤");
            }
            
            // 【修復】：改用 itemsToProcess.length
            showConfirm(`偵測到 ${itemsToProcess.length} 個題目，確定要匯入嗎？`, async () => {
                let processedCount = 0;
                for (const item of itemsToProcess) { // 【修復】：改用 itemsToProcess
                    const cat = item.category || '未分類';
                    const exist = await db.categories.where('name').equals(cat).count();
                    if(exist === 0) await db.categories.add({name: cat});

                    delete item.id;
                    item.timestamp = Date.now() + processedCount;
                    
                    await db.questions.add(item);
                    processedCount++;
                }
                
                renderQBCategories();
                renderQBItems(currentCategory);
                showAlert(`成功匯入 ${processedCount} 個題目`);
                if(typeof statusText !== 'undefined') statusText.innerText = "✅ 匯入完成";
                
                input.value = ""; 
            }, () => { input.value = ""; });

        } catch(err) {
            showAlert("匯入失敗：" + err.message);
            input.value = "";
        }
    };
    reader.readAsText(file);
}

function triggerQuestionRestore() {
    showConfirm("⚠️ 還原操作會「清空」目前的題庫，並載入備份檔內容。\n確定要繼續嗎？", () => {
        document.getElementById('question-restore-input').click();
    });
}
async function restoreFullQuestionBank(input) {
    const file = input.files[0];
    if (!file) return;

    if(typeof statusText !== 'undefined') statusText.innerText = "⏳ 正在還原題庫...";

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            let itemsToProcess =[];
            if (data.items) {
                itemsToProcess = data.items;
            } else if (data.version && data.version.startsWith("3") && data.pages) {
                itemsToProcess = data.pages.map((p, idx) => ({
                    title: (data.name || "Canvas_Page") + "_" + (idx + 1),
                    category: "未分類",
                    questionText: "",
                    illustrationSvg: p.shapes || ""
                }));
            } else if (data.svgInner !== undefined || data.illustrationSvg !== undefined) {
                itemsToProcess =[{
                    title: data.name || data.title || "Imported_Question",
                    category: "未分類",
                    questionText: data.questionText || "",
                    illustrationSvg: data.svgInner || data.illustrationSvg || ""
                }];
            } else {
                throw new Error("格式錯誤或檔案損毀");
            }

            await db.transaction('rw', db.questions, db.categories, async () => {
                await db.questions.clear();
                
                for (const item of itemsToProcess) { // 【修復】：改用 itemsToProcess
                    const cat = item.category || '未分類';
                    const exist = await db.categories.where('name').equals(cat).count();
                    if(exist === 0) await db.categories.add({name: cat});

                    delete item.id;
                    item.timestamp = Date.now();
                    await db.questions.add(item);
                }
            });

			currentCategory = '未分類';
            renderQBCategories();
            renderQBItems(currentCategory);
            // 【修復】：改用 itemsToProcess.length
            showAlert(`還原成功！共載入 ${itemsToProcess.length} 個題目。`);
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

function triggerClearQuestionBank() {
    openExclusiveOptionsModal(
        "清除題庫前，是否先進行備份？", 
        [
            { label: "是，先下載備份檔 (推薦)", checked: true },
            { label: "否，直接清除", checked: false }
        ], 
        async (results) => {
            const needBackup = results[0];
            if (needBackup) {
                await exportFullQuestionBank();
                setTimeout(performClearQuestionBank, 500);
            } else {
                performClearQuestionBank();
            }
        }
    );
}

function performClearQuestionBank() {
    showConfirm("⚠️ 警告：這將刪除題庫內的所有題目，且無法復原！\n確定要清空嗎？", async () => {
        try {
            await db.questions.clear();
            // 不清除分類，只清除內容
            selectedQBIds.clear();
            renderQBCategories();
            renderQBItems(currentCategory);
            updateQBBatchUI();
            showAlert("題庫已清空。");
        } catch(e) {
            showAlert("清除失敗：" + e.message);
        }
    });
}

async function batchCopyQuestionJson() {
    if (selectedQBIds.size === 0) return;
    const items = await db.questions.where('id').anyOf(Array.from(selectedQBIds)).toArray();
    const exportData = {
        type: "MathEditor_Questions_Backup",
        items: items
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
        showAlert("已複製選取題目的 JSON 代碼");
    });
}

// ==========================================
// 專業排版模式：文字與 MathML 轉換引擎 (終極完整版)
// ==========================================
async function copyQuestionTextToClipboard(id, e) {
    if(e) e.stopPropagation();
    const item = await db.questions.get(id);
    if (!item || !item.questionText) {
        showAlert("此題目沒有文字內容"); 
        return;
    }
    
    statusText.innerText = "⏳ 正在將數學式轉換為 Word 原生公式...";
    
    let rawText = item.questionText.replace(/\\ /g, ' ');
    
    const parts = rawText.split(/(`[^`]+`)/g);
    let htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body style="font-family: \'Times New Roman\', serif; font-size: 12pt;">';
    let plainText = "";

    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'absolute';
    hiddenContainer.style.visibility = 'hidden';
    hiddenContainer.style.top = '-9999px';
    document.body.appendChild(hiddenContainer);

    for (let i = 0; i < parts.length; i++) {
        let part = parts[i];
        if (!part) continue;

        if (part.startsWith('`') && part.endsWith('`')) {
            let mathStr = part.slice(1, -1);
            let mathML = "";
            
            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = '`' + mathStr + '`';
                hiddenContainer.appendChild(tempDiv);
                
                await MathJax.typesetPromise([tempDiv]);
                
                if (window.MathJax && MathJax.startup && MathJax.startup.document) {
                    const mathItems = MathJax.startup.document.getMathItemsWithin(tempDiv);
                    if (mathItems && mathItems.length > 0 && mathItems[0].root) {
                        const SerializedMmlVisitor = MathJax._.core.MmlTree.SerializedMmlVisitor.SerializedMmlVisitor;
                        if (SerializedMmlVisitor) {
                            const visitor = new SerializedMmlVisitor();
                            mathML = visitor.visitTree(mathItems[0].root);
                        }
                    }
                }
            } catch(err) {
                console.warn("MathML 轉換失敗，將啟用降級方案", err);
            }

            if (mathML) {
                htmlContent += `<span>${mathML}</span>`;
                plainText += mathStr;
            } else {
                let linearMath = mathStr
                    .replace(/triangle/g, '\\Delta ')
                    .replace(/angle/g, '\\angle ')
                    .replace(/\^circ/g, '^\\circ ')
                    .replace(/pi/g, '\\pi ')
                    .replace(/bot/g, '\\bot ')
                    .replace(/\/\//g, '\\parallel ')
                    .replace(/\+-/g, '\\pm ')
                    .replace(/>=/g, '\\ge ')
                    .replace(/<=/g, '\\le ')
                    .replace(/!=/g, '\\ne ')
                    .replace(/sqrt\(/g, '\\sqrt(')
                    .replace(/\{\s*\(([^)]+)\)\s*,\s*\(([^)]+)\)\s*:\}/g, '\\eqarray($1@$2)');
                
                htmlContent += `<span style="font-family: 'Cambria Math', 'Times New Roman', serif; font-style: italic;">${linearMath}</span>`;
                plainText += linearMath;
            }
            
        } else {
            let textHtml = part
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>')
                .replace(/  /g, ' &nbsp;');
            htmlContent += `<span>${textHtml}</span>`;
            plainText += part;
        }
    }
    
    htmlContent += '</body></html>';
    document.body.removeChild(hiddenContainer);

    try {
        const blobHtml = new Blob([htmlContent], { type: "text/html" });
        const blobText = new Blob([plainText], { type: "text/plain" });
        
        const clipboardItem = new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText
        });
        
        await navigator.clipboard.write([clipboardItem]);
        statusText.innerText = "✅ 題目文字與公式已完美複製！請至 Word 貼上。";
    } catch (err) {
        console.error(err);
        showAlert("複製失敗，請檢查瀏覽器是否給予剪貼簿權限。");
    }
}

// ==========================================
// 專業排版模式：高畫質配圖渲染引擎
// ==========================================
async function copyQuestionImageToClipboard(id, e) {
    if(e) e.stopPropagation();
    const item = await db.questions.get(id);
    if (!item || !item.illustrationSvg) {
        showAlert("此題目沒有幾何配圖"); 
        return;
    }
    
    statusText.innerText = "⏳ 正在產生高畫質去背圖片...";

    try {
        let safeSvgString = item.illustrationSvg;
        if (typeof bakeMathJaxIntoSvg === 'function') {
            safeSvgString = await bakeMathJaxIntoSvg(item.illustrationSvg);
        }

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.visibility = 'hidden'; 
        document.body.appendChild(container);

        const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        
        style.textContent = `
            .shape:not(text) { vector-effect: non-scaling-stroke; stroke: black; stroke-width: 2; fill: none; }
            text { stroke: none !important; font-family: Arial, sans-serif !important; font-weight: bold; }
            .vertex-label { fill: #c0392b !important; }
            .angle-label-text { fill: #c0392b !important; }
            .mark-path { stroke: #c0392b; stroke-width: 1.5; fill: none; }
            .dimension-line { stroke: #2980b9; stroke-width: 1.2; stroke-dasharray: 2,2; fill: none; }
        `;
        tempSvg.appendChild(style);
        
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.innerHTML = safeSvgString; 
        tempSvg.appendChild(group);
        container.appendChild(tempSvg);
        
        await new Promise(r => setTimeout(r, 50));

        const bbox = group.getBBox();
        const padding = 15; 
        const width = bbox.width + padding * 2;
        const height = bbox.height + padding * 2;
        
        tempSvg.setAttribute("viewBox", `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);
        tempSvg.setAttribute("width", width);
        tempSvg.setAttribute("height", height);
        
        const scale = 3;
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        
        const serializer = new XMLSerializer();
        let finalSvgStr = serializer.serializeToString(tempSvg);
        if (!finalSvgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
            finalSvgStr = finalSvgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        const base64Svg = btoa(unescape(encodeURIComponent(finalSvgStr)));
        const url = 'data:image/svg+xml;base64,' + base64Svg;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
        
        canvas.toBlob(async (blob) => {
            if(blob) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                statusText.innerText = "✅ 高畫質配圖已複製！可直接貼上 Word。";
            } else {
                showAlert("圖片產生失敗 (Canvas 轉 Blob 錯誤)");
            }
        }, "image/png");

        document.body.removeChild(container);
        
    } catch (err) {
        console.error(err);
        showAlert("圖片產生失敗: " + err.message);
    }
}

// ==========================================
// 專業排版模式：整題(圖+文) 複合高畫質渲染引擎 (PPT 專用)
// ==========================================
async function copyQuestionCompositeImageToClipboard(id, e) {
    if (e) e.stopPropagation();
    const item = await db.questions.get(id);
    if (!item) return;

    statusText.innerText = "⏳ 正在合成圖文高畫質圖片...";

    try {
        const textWidth = 700; 
        let textHeight = 0;
        let finalHtmlStr = "";

        // --- 1. 處理文字 ---
        if (item.questionText) {
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
                width: ${textWidth}px; 
                font-family: 'Times New Roman', Arial, "Microsoft JhengHei", sans-serif; 
                font-size: 24px; 
                color: #000000; 
                line-height: 1.5; 
                visibility: hidden; 
                position: absolute;
                white-space: pre-wrap; 
                word-break: break-word;
            `;
            
            tempDiv.innerHTML = window.formatSmartMathText ? window.formatSmartMathText(item.questionText) : item.questionText;
            document.body.appendChild(tempDiv);
            
            await MathJax.typesetPromise([tempDiv]);
            
            textHeight = tempDiv.offsetHeight + 10;
            
            let rawHtml = tempDiv.innerHTML;
            rawHtml = rawHtml.replace(/<br>/g, '<br/>');
            rawHtml = rawHtml.replace(/<input([^>]*)>/g, '<input$1/>');
            rawHtml = rawHtml.replace(/<hr>/g, '<hr/>');
            rawHtml = rawHtml.replace(/<img([^>]*)>/g, '<img$1/>');
            rawHtml = rawHtml.replace(/&nbsp;/g, '&#160;');
            
            finalHtmlStr = rawHtml;
            document.body.removeChild(tempDiv);
        }

        // --- 2. 處理配圖 ---
        let illustrationGroup = "";
        let imgHeight = 0;
        let imgWidth = 0;
        
        if (item.illustrationSvg) {
            const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            tempSvg.style.visibility = 'hidden';
            tempSvg.style.position = 'absolute';
            
            const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
            
            // 【核心修正】 CSS 設定調整
            // 加入 padding: 0 5px 保留左側隱形距離
            style.textContent = `
                .shape { vector-effect: non-scaling-stroke; stroke: black; stroke-width: 2; fill: none; }
                
                /* SVG Text 校正 */
                text { 
                    stroke: none !important; 
                    font-family: Arial, "Microsoft JhengHei", sans-serif !important; 
                    dominant-baseline: central;
                    alignment-baseline: middle;
                }
                .vertex-label { font-weight: bold; fill: #c0392b !important; }
                .angle-label-text { font-weight: normal; fill: #c0392b !important; }
                .mark-path { stroke: #c0392b; stroke-width: 1.5; fill: none; }
                .dimension-line { stroke: #2980b9; stroke-width: 1.2; stroke-dasharray: 2,2; fill: none; }
                
                /* 【關鍵修正】foreignObject 內的 div 設定 */
                /* 1. 上下置中 (align-items: center) */
                /* 2. 左右靠左 (justify-content: flex-start) */
                /* 3. 加入 padding-left: 5px 保留微小間距 */
                foreignObject div, .math-content {
                    display: flex !important;
                    justify-content: flex-start !important; /* 水平靠左 */
                    align-items: center !important;         /* 垂直置中 */
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    padding: 0 5px !important;              /* 保留左右 5px 間距 */
                    text-align: left !important;            /* 文字靠左 */
                    box-sizing: border-box !important;
                    background-color: transparent !important;
                }
            `;
            tempSvg.appendChild(style);

            const tempG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            tempG.innerHTML = item.illustrationSvg;
            tempSvg.appendChild(tempG);
            document.body.appendChild(tempSvg);
            
            const bbox = tempG.getBBox();
            imgWidth = bbox.width;
            imgHeight = bbox.height;
            
            const targetX = (textWidth - imgWidth) / 2;
            const targetY = textHeight + (textHeight > 0 ? 30 : 0);
            
            illustrationGroup = `
                <g transform="translate(${targetX}, ${targetY})">
                    <g transform="translate(${-bbox.x}, ${-bbox.y})">
                        ${item.illustrationSvg}
                    </g>
                </g>`;
            
            document.body.removeChild(tempSvg);
        }

        // --- 3. 組合 SVG ---
        const finalWidth = textWidth + 40; 
        const finalHeight = textHeight + (imgHeight > 0 ? imgHeight + 30 : 0) + 40; 

        const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${finalWidth} ${finalHeight}">
                <style>
                    .shape { vector-effect: non-scaling-stroke; stroke: black; stroke-width: 2; fill: none; }
                    
                    text { 
                        stroke: none !important; 
                        font-family: Arial, "Microsoft JhengHei", sans-serif !important; 
                        dominant-baseline: central;
                        alignment-baseline: middle;
                    }
                    
                    .vertex-label { font-weight: bold; fill: #c0392b !important; }
                    .angle-label-text { font-weight: normal; fill: #c0392b !important; }
                    .mark-path { stroke: #c0392b; stroke-width: 1.5; fill: none; }
                    .dimension-line { stroke: #2980b9; stroke-width: 1.2; stroke-dasharray: 2,2; fill: none; }
                    mjx-container { font-size: 110% !important; }

                    /* 【關鍵修正】再次確保輸出的 SVG 包含置中設定與間距 */
                    foreignObject div, .math-content {
                        display: flex !important;
                        justify-content: flex-start !important; /* 靠左 */
                        align-items: center !important;         /* 垂直居中 */
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 5px !important;              /* 保留間距 */
                        text-align: left !important;            /* 靠左 */
                    }
                </style>
                
                <foreignObject x="20" y="20" width="${textWidth}" height="${textHeight + 50}">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Times New Roman', Arial, 'Microsoft JhengHei', sans-serif; font-size: 24px; color: black; display:block !important; text-align:left !important;">
                        ${finalHtmlStr}
                    </div>
                </foreignObject>
                <g transform="translate(20, 20)">
                    ${illustrationGroup}
                </g>
            </svg>
        `;

        // --- 4. 輸出圖片 ---
        const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
        const url = 'data:image/svg+xml;base64,' + base64Svg;

        const img = new Image();
        img.onload = () => {
            const scale = 3; 
            const canvas = document.createElement("canvas");
            canvas.width = finalWidth * scale;
            canvas.height = finalHeight * scale;
            const ctx = canvas.getContext("2d");
            ctx.scale(scale, scale);
            
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(async (blob) => {
                if(blob) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    statusText.innerText = "✅ 📸 整題圖文已複製！(精準對位版)";
                } else {
                    showAlert("圖片轉換失敗");
                }
            }, "image/png");
        };
        img.onerror = (e) => {
            console.error(e);
            showAlert("SVG 載入失敗");
        };
        img.src = url;

    } catch (err) {
        console.error("合成失敗:", err);
        showAlert("合成圖片失敗: " + err.message);
    }
}