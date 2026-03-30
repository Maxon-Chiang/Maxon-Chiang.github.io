function cleanSelectionState(htmlStr) {
    if (!htmlStr) return "";
    // 移除 class 屬性中的 "selected" 字眼
    return htmlStr.replace(/class="([^"]*)"/g, function(match, classContent) {
        // 使用 \bselected\b 確保只移除單字，不會誤刪其他類似名稱
        const newContent = classContent.replace(/\bselected\b/g, '').replace(/\s+/g, ' ').trim();
        return 'class="' + newContent + '"';
    });
}

function saveState() {
    actionHistory = actionHistory.slice(0, historyIndex + 1);
    actionHistory.push({
        shapes: shapesLayer.innerHTML,
        bg: bgLayer.innerHTML,
        bgClass: drawingArea.className
    });
    if (actionHistory.length > MAX_HISTORY) actionHistory.shift();
    else historyIndex++;
}

function restoreState() {
    const state = actionHistory[historyIndex];
    if (!state) return;
    shapesLayer.innerHTML = state.shapes;
    bgLayer.innerHTML = state.bg;
    drawingArea.className = state.bgClass;
    selectedElements = [];
    handlesLayer.innerHTML = '';
    const newlyRestoredSelected = shapesLayer.querySelectorAll('.selected');
    newlyRestoredSelected.forEach(el => selectedElements.push(el));
    if (selectedElements.length === 1) drawHandles(selectedElements[0]);
    if (typeof updateGroupStatusUI === 'function') updateGroupStatusUI();
    if (typeof renderPropertyPanel === 'function') renderPropertyPanel(selectedElements.length === 1 ? selectedElements[0] : null);
	const gridBtn = document.getElementById('btn-real-grid');
	if (gridBtn) {
		const hasGrid = bgLayer.children.length > 0;
		if (hasGrid) {
			gridBtn.classList.add('active');
			gridBtn.innerHTML = '🗑️ 去方格';
		} else {
			gridBtn.classList.remove('active');
			gridBtn.innerHTML = '▦ 方格圖';
		}
	}
}

function undo() {
    if (historyIndex > 0) { historyIndex--; restoreState(); }
}

function redo() {
    if (historyIndex < actionHistory.length - 1) { historyIndex++; restoreState(); }
}

// 儲存整本專案
async function saveProject() {
    saveCurrentPageToMemory(); 

    const svgElement = document.getElementById('svg-canvas');
    const currentW = parseFloat(svgElement.getAttribute('width')) || 800;
    const currentH = parseFloat(svgElement.getAttribute('height')) || 600;

    const cleanPages = mathPages.map(p => ({
        ...p,
        shapes: cleanSelectionState(p.shapes) // 移除 selected class
    }));

    const data = {
        version: "3.0",
        timestamp: new Date().toISOString(),
        name: currentProjectName || "MyMathGraph",
        axisSettings: localStorage.getItem('math_editor_axis_settings') || "",
        canvasWidth: currentW,
        canvasHeight: currentH,
        pages: cleanPages, // 使用清洗後的頁面資料
        currentPageIndex: currentPageIndex
    };
    
    const fileName = (currentProjectName || "MathGraph_Project") + ".json";
    
    // 1. 支援原生 File System API 的瀏覽器 (Chrome, Edge)
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: 'MathGraph JSON Project', accept: { 'application/json': ['.json'] } }],
                excludeAcceptAllOption: true
            });
            
            const newName = handle.name.replace('.json', '');
            currentProjectName = newName; 
            data.name = newName;          
            
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            
            // 寫入最近檔案庫
            saveToRecentFiles(currentProjectName, data);
            
            if (typeof statusText !== 'undefined') statusText.innerText = `專案「${currentProjectName}」儲存成功！`;
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn("Save picker failed, fallback to download.", err);
        }
    }

    // 2. 備援方案 (傳統下載，適用於 Firefox, Safari)
    // 【核心修正 2】如果是不支援新 API 的瀏覽器，會先彈窗詢問檔名，確保不同檔案有不同名稱
    const defaultInputName = currentProjectName === "MyMathGraph" ? "新專案" : currentProjectName;
    openNumberInputModal("請輸入專案名稱：", defaultInputName, (inputName) => {
        if (!inputName) return;
        
        currentProjectName = inputName;
        data.name = inputName;
        const finalFileName = inputName + ".json";
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        saveBlobDirectly(blob, finalFileName);
        
        // 寫入最近檔案庫
        saveToRecentFiles(currentProjectName, data);
        
        if (typeof statusText !== 'undefined') statusText.innerText = `專案「${currentProjectName}」已下載`;
    });
}

// 新增：儲存單頁
function saveSinglePage() {
    saveCurrentPageToMemory();
    const p = mathPages[currentPageIndex];
    const svgElement = document.getElementById('svg-canvas');
    const currentW = parseFloat(svgElement.getAttribute('width')) || 800;
    const currentH = parseFloat(svgElement.getAttribute('height')) || 600;

    const data = {
        version: "2.1", // 保持 2.1 格式，使其成為相容的單頁圖形
        timestamp: new Date().toISOString(),
        name: (currentProjectName || "Page") + "_P" + (currentPageIndex + 1),
        gridState: p.bgClass,
        bgLayer: p.bg,
        axisSettings: localStorage.getItem('math_editor_axis_settings') || "",
        canvasWidth: currentW,
        canvasHeight: currentH,
        svgInner: cleanSelectionState(p.shapes)
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    saveBlobDirectly(blob, data.name + ".json");
    if (typeof statusText !== 'undefined') statusText.innerText = "單頁已成功匯出為 JSON";
}

function saveBlobDirectly(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const runReader = () => {
        const reader = new FileReader();

        if (file.name.endsWith('.json') || file.name.endsWith('.svg')) {
            reader.onload = function(e) {
                try {
                    let isOpeningProject = false;
                    const fileContent = e.target.result;
                    let domString = "";

                    if (!isImportMode) {
                        isOpeningProject = true;
                        isImportMode = true; 
                    }

                    isImportedContent = true;

                    if (file.name.endsWith('.json')) {
                        const data = JSON.parse(fileContent);
                        
                        // ===== 檔案格式相容性轉換 (讓主畫布能讀取圖庫與AI的JSON) =====
                        if (data.items) {
                            // 來源：圖庫或題庫格式 -> 轉換為多頁畫布格式，每個素材獨立一頁
                            const newPages = data.items.map((item, idx) => {
                                let shapesHtml = item.svgInner || item.illustrationSvg || "";
                                if (item.questionText) {
                                    // 將文字轉換為畫布的 ASCIIMath 方塊
                                    const cleanText = item.questionText.replace(/<[^>]*>?/gm, '').trim();
                                    shapesHtml += `<foreignObject transform="translate(50, 50)" x="0" y="0" width="650" height="50" class="shape math-obj" data-tool="math" data-content="${cleanText}" data-font-size="24" fill="#000000"><div xmlns="http://www.w3.org/1999/xhtml" class="math-content" style="font-size:24px; color:#000000; display:inline-block; white-space:pre-wrap; word-break:break-word;">\`${cleanText}\`</div></foreignObject>`;
                                }
                                return {
                                    id: 'page-' + Date.now() + '-' + idx,
                                    shapes: shapesHtml,
                                    bg: "",
                                    bgClass: "",
                                    showAssistGrid: false,
                                    actionHistory:[],
                                    historyIndex: -1
                                };
                            });
                            data.version = "3.0";
                            data.pages = newPages;
                            data.currentPageIndex = 0;
                            data.name = data.name || data.type || "Imported_Collection";
                        } else if (!data.version && (data.svgInner !== undefined || data.illustrationSvg !== undefined)) {
                            // 來源：AI 解析格式 -> 轉換為單頁格式
                            let shapesHtml = data.svgInner || data.illustrationSvg || "";
                            if (data.questionText) {
                                const cleanText = data.questionText.replace(/<[^>]*>?/gm, '').trim();
                                shapesHtml += `<foreignObject transform="translate(50, 50)" x="0" y="0" width="650" height="50" class="shape math-obj" data-tool="math" data-content="${cleanText}" data-font-size="24" fill="#000000"><div xmlns="http://www.w3.org/1999/xhtml" class="math-content" style="font-size:24px; color:#000000; display:inline-block; white-space:pre-wrap; word-break:break-word;">\`${cleanText}\`</div></foreignObject>`;
                            }
                            data.version = "2.1";
                            data.svgInner = shapesHtml;
                        }                                                
                        if (isOpeningProject) {
                            // 【模式 A：開啟檔案 (覆蓋)】
                            currentProjectName = file.name.replace(/\.json$/i, '');
                            data.name = currentProjectName; // 同步更新內部資料                            if (data.name) currentProjectName = data.name;
                            if (data.axisSettings) localStorage.setItem('math_editor_axis_settings', data.axisSettings);
                            if (data.canvasWidth && data.canvasHeight) applyCanvasSize(data.canvasWidth, data.canvasHeight);
                            
                            // 【核心修復 1】在這裡記錄「最近開啟的檔案」(針對 v3.0 多頁格式)
                            saveToRecentFiles(currentProjectName, data);

                            if (data.version && data.version.startsWith("3")) {
                                // [修正] 開啟檔案時，強制清洗所有頁面的選取狀態
                                if (data.pages && Array.isArray(data.pages)) {
                                    data.pages.forEach(p => {
                                        p.shapes = cleanSelectionState(p.shapes);
                                    });
                                }

                                mathPages = data.pages;
                                currentPageIndex = data.currentPageIndex || 0;
                                loadPageToCanvas(currentPageIndex);
                                renderPageTabs();
                                statusText.innerText = `專案已開啟 (共 ${mathPages.length} 頁)`;
                                isImportMode = false;
                                event.target.value = '';
                                return; // 直接結束
                            }
                            
                            // 舊版單頁格式
                            if (data.gridState) document.getElementById('drawing-area').className = data.gridState;
                            if (data.bgLayer) document.getElementById('background-layer').innerHTML = data.bgLayer;
                            // 【關鍵修復】：必須包裝在 <svg> 標籤內，否則 HTML Parser 會吃掉 <line> 與 <circle> 等單閉合標籤
                            domString = `<div id="temp-wrapper"><svg>${data.svgInner}</svg></div>`;
                            
                            saveToRecentFiles(currentProjectName, data);
                            
                        } else {
                            // 【模式 B：匯入檔案 (附加)】
                            if (data.version && data.version.startsWith("3")) {
                                saveCurrentPageToMemory();
                                const importedPages = data.pages;
                                if (importedPages && importedPages.length > 0) {
                                    importedPages.forEach(p => { p.id = 'page-' + Date.now() + Math.floor(Math.random() * 10000); });
                                    mathPages.splice(currentPageIndex + 1, 0, ...importedPages);
                                    currentPageIndex++;
                                    loadPageToCanvas(currentPageIndex);
                                    renderPageTabs();
                                    statusText.innerText = `已成功匯入 ${importedPages.length} 頁`;
                                }
                                isImportMode = false;
                                event.target.value = '';
                                return; 
                            } else {
                                // 【關鍵修復】：同樣包裝在 <svg> 標籤內
                                domString = `<div id="temp-wrapper"><svg>${data.svgInner}</svg></div>`;
                            }
                        }
                    } else if (file.name.endsWith('.svg')) {
                        domString = fileContent;
                        if (isOpeningProject) {
                            currentProjectName = file.name.replace('.svg', '');
                            document.getElementById('background-layer').innerHTML = '';
                        }
                    }

                    if (!isOpeningProject) {
                        saveCurrentPageToMemory();
                        const newPage = createEmptyPageData();
                        mathPages.splice(currentPageIndex + 1, 0, newPage);
                        currentPageIndex++;
                        loadPageToCanvas(currentPageIndex); 
                        renderPageTabs();
                    }

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(domString, "text/html");
                    
                    let importedShapesGroup = doc.querySelector('#shapes-layer');
                    // 【關鍵修復】：從 wrapper 中精準抓取 svg 裡面的內容
                    if (!importedShapesGroup) importedShapesGroup = doc.querySelector('#temp-wrapper svg') || doc.querySelector('#temp-wrapper');                    

                    let shapesToImport = [];
                    if (importedShapesGroup) {
                        shapesToImport = Array.from(importedShapesGroup.children);
                    } else {
                        const explicitShapes = Array.from(doc.querySelectorAll('.shape'));
                        if (explicitShapes.length > 0) shapesToImport = explicitShapes;
                        else {
                            let svgRoot = doc.querySelector('svg');
                            if (svgRoot) shapesToImport = Array.from(svgRoot.children);
                        }
                    }

                    if (shapesToImport.length > 0) {
                        const idMap = {};
                        const newNodes = [];
                        
                        shapesToImport.forEach(node => {
                            const tagName = node.tagName.toLowerCase();
                            if (tagName === 'defs' || tagName === 'style' || tagName === 'metadata' || tagName === 'script' ||
                                node.id === 'background-layer' || node.id === 'temp-layer' || node.id === 'handles-layer') return;
                            
                            let newEl = document.createElementNS("http://www.w3.org/2000/svg", tagName === 'foreignobject' ? 'foreignObject' : tagName);
                            if (tagName === 'foreignobject') {
                                newEl.classList.add('math-obj', 'shape');
                                newEl.setAttribute('data-tool', 'math');
                            }
                            
                            Array.from(node.attributes).forEach(attr => newEl.setAttribute(attr.name, attr.value));
                            newEl.innerHTML = node.innerHTML;
                            
                            const oldId = node.id;
                            const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
                            if (oldId) idMap[oldId] = newId;
                            newEl.id = newId;
                            newEl.classList.remove('selected');
                            if (!newEl.classList.contains('shape')) newEl.classList.add('shape');
                            if (!newEl.hasAttribute('data-tool')) newEl.setAttribute('data-tool', tagName === 'g' ? 'group' : 'freehand');
                            
                            shapesLayer.appendChild(newEl);
                            newNodes.push(newEl);
                        });

                        newNodes.forEach(el => {
                            const ownerId = el.getAttribute('data-owner');
                            if (ownerId && idMap[ownerId]) el.setAttribute('data-owner', idMap[ownerId]);
                            const ownerShapeId = el.getAttribute('data-owner-shape');
                            if (ownerShapeId && idMap[ownerShapeId]) el.setAttribute('data-owner-shape', idMap[ownerShapeId]);
                            const labelIds = el.getAttribute('data-label-ids');
                            if (labelIds) el.setAttribute('data-label-ids', labelIds.split(',').map(old => idMap[old] || old).join(','));
                            if (!isOpeningProject) addToSelection(el);
                        });

                        saveState(); 

                        if (isOpeningProject) {
                            mathPages =[createEmptyPageData()];
                            currentPageIndex = 0;
                            saveCurrentPageToMemory();
                            renderPageTabs();
                            
                            selectedElements =[];
                            if (typeof setMode === 'function') setMode('select');
                            setTimeout(() => { selectAllShapes(); statusText.innerText = `舊版檔案已開啟 (轉為第 1 頁)`; }, 50);
                        } else {
                            statusText.innerText = `已匯入為新頁面 (共 ${newNodes.length} 個物件)`;
                        }
                    }
                    
                    // 確保剛匯入/轉換的數學公式能夠被正確渲染
                    if (window.MathJax) {
                        setTimeout(() => {
                            MathJax.typesetPromise([document.getElementById('shapes-layer')]).catch(e => console.error(e));
                        }, 100);
                    }
                } catch (err) {
                    showAlert("檔案讀取發生錯誤：" + err.message);
                } finally {
                    isImportMode = false;
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        } else if (file.type.startsWith('image/')) {
            reader.onload = function(e) {
                saveCurrentPageToMemory();
                const newPage = createEmptyPageData();
                mathPages.splice(currentPageIndex + 1, 0, newPage);
                currentPageIndex++;
                loadPageToCanvas(currentPageIndex);
                renderPageTabs();
                
                importImageAsObject(e.target.result);
                isImportMode = false;
                event.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isImportMode) {
        showConfirm("開啟專案將會覆蓋目前的所有頁面，確定要繼續嗎？", () => {
            actionHistory = []; historyIndex = -1;
            shapesLayer.innerHTML = ''; handlesLayer.innerHTML = ''; bgLayer.innerHTML = '';
            deselectAll();
            runReader();
        }, () => { event.target.value = ''; });
    } else {
        runReader();
    }
}

function importImageAsObject(dataUrl) {
    const svg = document.getElementById('shapes-layer') || document.getElementById('svg-canvas');
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
    img.setAttribute("x", "50");
    img.setAttribute("y", "50");
    img.setAttribute("class", "shape drawing-obj");
    img.setAttribute("data-tool", "image");
    img.setAttribute("transform", "matrix(1,0,0,1,0,0)");
    const tempImg = new Image();
    tempImg.onload = function() {
        let w = tempImg.width;
        let h = tempImg.height;
        const maxSize = 400;
        if (w > maxSize || h > maxSize) {
            const ratio = w / h;
            if (w > h) {
                w = maxSize;
                h = maxSize / ratio;
            } else {
                h = maxSize;
                w = maxSize * ratio;
            }
        }
        img.setAttribute("width", w);
        img.setAttribute("height", h);
        svg.appendChild(img);
        if (typeof window.deselectAll === 'function') window.deselectAll();
        else if (typeof deselectAll === 'function') deselectAll();
        addToSelection(img);
        if (typeof window.setMode === 'function') {
            window.setMode('select');
        } else if (typeof setMode === 'function') {
            setMode('select');
        }
        if (typeof statusText !== 'undefined') statusText.innerText = "已匯入圖片 (已切換至選取模式)";
    }
    tempImg.src = dataUrl;
}

async function copyImageToClipboard(forceImage = false) {
    const status = document.getElementById('status-text');
    if (selectedElements.length === 0) {
        status.innerText = "⚠️ 請先選取要複製的物件！";
        return;
    }

    // 新增：判斷是否全為 text 或 math 物件
    const isAllText = selectedElements.every(el => {
        const tool = el.getAttribute('data-tool');
        return tool === 'text' || tool === 'math';
    });

    // 加入 !forceImage 條件，如果是強制轉圖片就跳過這個文字判斷
    if (isAllText && !forceImage) {
        if (typeof copyElementsAsTextToClipboard === 'function') {
            await copyElementsAsTextToClipboard(selectedElements, status);
        }
        return;
    }

    status.innerText = "正在複製圖片...";
    try {
        // 直接呼叫核心函式產生 PNG Blob
        const blob = await generateExportBlob('png', true);
        if (!blob) {
            throw new Error("產生圖片 Blob 失敗");
        }

        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        status.innerText = "✅ 圖片已成功複製到剪貼簿！";
        setTimeout(() => { if (status.innerText.includes("複製")) status.innerText = "就緒。"; }, 3000);
    } catch (e) {
        console.error("複製失敗:", e);
        status.innerText = "❌ 複製失敗 (瀏覽器可能不支援)";
        showAlert("複製失敗", "您的瀏覽器可能不支援此功能，或需要授予剪貼簿權限。請嘗試使用「匯出」功能。");
    }
}

async function cutImageToClipboard() {
    const status = document.getElementById('status-text');
    if (selectedElements.length === 0) {
        status.innerText = "⚠️ 請先選取要剪下的物件！";
        return;
    }
    
    const isAllText = selectedElements.every(el => {
        const tool = el.getAttribute('data-tool');
        return tool === 'text' || tool === 'math';
    });

    if (isAllText) {
        if (typeof copyElementsAsTextToClipboard === 'function') {
            await copyElementsAsTextToClipboard(selectedElements, status);
        }
        if (typeof deleteSelected === 'function') deleteSelected();
        return;
    }

    status.innerText = "正在剪下圖片...";
    try {
        // 1. 產生 PNG Blob
        const blob = await generateExportBlob('png', true);
        if (!blob) {
            throw new Error("產生圖片 Blob 失敗");
        }

        // 2. 寫入系統剪貼簿
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        
        // 3. 【關鍵步驟】複製成功後，刪除畫布上的物件
        deleteSelected();
        
        status.innerText = "✅ 圖片已剪下到剪貼簿！";
        setTimeout(() => { if (status.innerText.includes("剪下")) status.innerText = "就緒。"; }, 3000);
        
    } catch (e) {
        console.error("剪下失敗:", e);
        status.innerText = "❌ 剪下失敗 (瀏覽器可能不支援)";
        showAlert("剪下失敗", "您的瀏覽器可能不支援此功能，或需要授予剪貼簿權限。請嘗試使用「匯出」功能。");
    }
}

async function pasteFromClipboard(atMouse = false) {
    const status = document.getElementById('status-text');
    const svg = document.getElementById('svg-canvas');
    const shapesLayer = document.getElementById('shapes-layer') || svg;
    if (!svg || !status) return;
    status.innerText = "正在讀取剪貼簿...";
    
    try {
        const items = await navigator.clipboard.read();
        let hasImage = false;
        let hasText = false;
        let imgItem = null;
        let textItem = null;
        
        for (const item of items) {
            if (item.types.some(t => t.startsWith('image/'))) {
                hasImage = true;
                imgItem = item;
            }
            if (item.types.includes('text/plain')) {
                hasText = true;
                textItem = item;
            }
        }
        
        if (hasImage && hasText) {
            if (typeof openExclusiveOptionsModal === 'function') {
                openExclusiveOptionsModal("貼上選項 (請擇一)", [{
                    label: "貼上為『可編輯文字』",
                    checked: true
                }, {
                    label: "貼上為『圖片截圖』(保留原始外觀)",
                    checked: false
                }], (results) => {
                    if (results[0]) {
                        processTextPaste(textItem);
                    } else {
                        processImagePaste(imgItem);
                    }
                });
            } else {
                processTextPaste(textItem);
            }
        } else if (hasText) {
            processTextPaste(textItem);
        } else if (hasImage) {
            processImagePaste(imgItem);
        } else {
            status.innerText = "⚠️ 剪貼簿中沒有可識別的文字或圖片內容。";
        }
    } catch (err) {
        console.error("Paste Error:", err);
        status.innerText = "❌ 貼上失敗：請檢查瀏覽器權限或嘗試使用快捷鍵 Ctrl+V。";
    }

    function getPastePosition(elementWidth = 0, elementHeight = 0) {
        if (atMouse && typeof lastContextPos !== 'undefined' && lastContextPos.x !== 0) {
            return {
                x: lastContextPos.x,
                y: lastContextPos.y
            };
        }
        
        // 取得畫布可視區中心
        if (typeof window.getVisibleCanvasCenter === 'function') {
            const center = window.getVisibleCanvasCenter();
            return {
                x: center.x - elementWidth / 2,
                y: center.y - elementHeight / 2
            };
        }

        const vb = svg.viewBox.baseVal;
        const vbx = vb.width > 0 ? vb.x : 0;
        const vby = vb.height > 0 ? vb.y : 0;
        const vbw = vb.width > 0 ? vb.width : svg.clientWidth;
        const vbh = vb.height > 0 ? vb.height : svg.clientHeight;
        return {
            x: vbx + (vbw - elementWidth) / 2,
            y: vby + (vbh - elementHeight) / 2
        };
    }

    async function processImagePaste(item) {
        const type = item.types.find(t => t.startsWith('image/'));
        const blob = await item.getType(type);
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result;
            const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
            const tempImg = new Image();
            tempImg.onload = function() {
                // 【核心修正 1】讀取圖片真實尺寸，並等比例縮放 (最大不超過 400px)
                let w = tempImg.width;
                let h = tempImg.height;
                const maxSize = 400;
                
                if (w > maxSize || h > maxSize) {
                    const ratio = w / h;
                    if (w > h) {
                        w = maxSize;
                        h = maxSize / ratio;
                    } else {
                        h = maxSize;
                        w = maxSize * ratio;
                    }
                }
                
                const pos = getPastePosition(w, h); // 使用真實尺寸計算座標
                
                img.setAttribute("href", base64Data);
                img.setAttribute("x", "0");
                img.setAttribute("y", "0");
                img.setAttribute("width", w.toString());
                img.setAttribute("height", h.toString());
                img.setAttribute("preserveAspectRatio", "none"); 
                img.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
                img.setAttribute("class", "shape");
                img.setAttribute("data-tool", "image");
                img.style.cursor = "move";
                shapesLayer.appendChild(img);
                finalizePaste(img, "圖片已貼上");
            };
            tempImg.src = base64Data;
        };
        reader.readAsDataURL(blob);
    }

    async function processTextPaste(item) {
        const blob = await item.getType('text/plain');
        const text = await blob.text();
        if (!text.trim()) {
            status.innerText = "⚠️ 剪貼簿中的文字內容為空。";
            return;
        }
        const textNode = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const pos = getPastePosition(); 
        
        textNode.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
        textNode.setAttribute("class", "shape");
        textNode.setAttribute("data-tool", "text");
        textNode.setAttribute("font-family", "'Times New Roman', '微軟正黑體', serif");
        textNode.setAttribute("font-size", "24");
        textNode.setAttribute("font-weight", "bold");
        textNode.setAttribute("fill", "#000000");
        textNode.setAttribute("text-anchor", "middle");
        textNode.setAttribute("dominant-baseline", "middle");
        textNode.style.cursor = "move";
        textNode.style.userSelect = "none";
        textNode.textContent = text;
        shapesLayer.appendChild(textNode);
        finalizePaste(textNode, "文字已貼上，雙擊該物件可進行編輯");
    }

    function finalizePaste(element, msg) {
        // 【核心修正 2】強制將畫布切換為「選取模式」
        if (typeof setMode === 'function') setMode('select'); 
        
        if (typeof deselectAll === 'function') deselectAll();
        if (typeof addToSelection === 'function') addToSelection(element);
        if (typeof saveState === 'function') saveState();
        status.innerText = "✅ " + msg + " (已切換至選取模式)";
    }
}

const fileInput = document.getElementById('file-input');
if (fileInput) {
    fileInput.removeEventListener('change', handleFileSelect);
    fileInput.addEventListener('change', handleFileSelect);
}

async function startExportProcess(isSelection = false) {
    const status = document.getElementById('status-text');
    const types = [
        { description: 'JPG 圖片 (白色背景)', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } },
        { description: 'PNG 圖片 (透明背景)', accept: { 'image/png': ['.png'] } },
        { description: 'SVG 向量檔', accept: { 'image/svg+xml': ['.svg'] } },
    ];
    const suggestedName = isSelection ? 'selection_export' : (currentProjectName || 'canvas_export');

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: types,
                excludeAcceptAllOption: true
            });
            const fileName = handle.name.toLowerCase();
            let format = 'jpg'; // 預設為 jpg
            if (fileName.endsWith('.png')) format = 'png';
            else if (fileName.endsWith('.svg')) format = 'svg';

            status.innerText = `正在產生 ${format.toUpperCase()} 檔案...`;
            const blob = await generateExportBlob(format, isSelection);
            if (!blob) throw new Error("產生 Blob 失敗");

            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            status.innerText = `✅ 成功匯出檔案: ${handle.name}`;
        } catch (err) {
            if (err.name === 'AbortError') {
                status.innerText = "使用者取消匯出。";
            } else {
                status.innerText = `❌ 匯出失敗: ${err.message}`;
                console.error(err);
            }
        }
    } else {
        // Fallback
        openExclusiveOptionsModal("選擇匯出格式", 
            [{ label: 'JPG (白色背景)', checked: true }, { label: 'PNG (透明背景)', checked: false }, { label: 'SVG (向量格式)', checked: false }], 
            async (results) => {
                let format = 'jpg';
                if (results[1]) format = 'png';
                if (results[2]) format = 'svg';
                
                status.innerText = `正在產生 ${format.toUpperCase()} 檔案...`;
                const blob = await generateExportBlob(format, isSelection);
                if (blob) {
                    saveBlobDirectly(blob, `${suggestedName}.${format}`);
                    status.innerText = `✅ 已下載檔案: ${suggestedName}.${format}`;
                } else {
                    status.innerText = "❌ 產生檔案失敗。";
                }
            }
        );
    }
}

async function generateExportBlob(format, isSelection = false) {
    const svg = document.getElementById('svg-canvas');
    if (!svg) return null;

    // 1. 決定匯出範圍
    const currentCanvasW = parseFloat(svg.getAttribute('width')) || 800;
    const currentCanvasH = parseFloat(svg.getAttribute('height')) || 600;
    let exportRegion = { x: 0, y: 0, width: currentCanvasW, height: currentCanvasH };
    
    let elementsToProcess =[];
    if (isSelection && selectedElements.length > 0) {
        const selectedSet = new Set(selectedElements);
        elementsToProcess = selectedElements.filter(el => !selectedSet.has(el.parentNode));

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elementsToProcess.forEach(el => {
            const rect = el.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            minX = Math.min(minX, rect.left - svgRect.left);
            minY = Math.min(minY, rect.top - svgRect.top);
            maxX = Math.max(maxX, rect.right - svgRect.left);
            maxY = Math.max(maxY, rect.bottom - svgRect.top);
        });
        const padding = 0;
        exportRegion = {
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + padding * 2,
            height: (maxY - minY) + padding * 2,
        };
    } else {
        elementsToProcess = Array.from(svg.querySelector('#shapes-layer').children);
    }
    
    const safeRect = document.getElementById('safe-margin-rect');
    if (safeRect) safeRect.style.display = 'none';

    // A-1. 收集 MathJax 定義
    const mathJaxDefs = {};
    document.querySelectorAll('svg defs >[id^="MJX-"]').forEach(el => {
        mathJaxDefs['#' + el.id] = el;
    });

    // 2. 建立匯出容器
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.setAttribute("width", exportRegion.width);
    tempSvg.setAttribute("height", exportRegion.height);
    tempSvg.setAttribute("viewBox", `${exportRegion.x} ${exportRegion.y} ${exportRegion.width} ${exportRegion.height}`);
    tempSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // 複製背景與定義
    const originalDefs = svg.querySelector('defs');
    if (originalDefs) tempSvg.appendChild(originalDefs.cloneNode(true));

    if (!isSelection) {
        const bgLayer = svg.querySelector('#background-layer');
        if (bgLayer) tempSvg.appendChild(bgLayer.cloneNode(true));
    }

    // 3. 處理物件
    for (const el of elementsToProcess) {
        const clone = el.cloneNode(true);
        clone.classList.remove('selected');
        tempSvg.appendChild(clone);

        const fos =[];
        if (clone.tagName.toLowerCase() === 'foreignobject') fos.push(clone);
        clone.querySelectorAll('foreignObject').forEach(f => fos.push(f));
        
        // 處理 ForeignObject (文字與公式)
        fos.forEach(fo => {
            const div = fo.querySelector('div');
            if (!div) return;

            div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            
            // 優先讀取 inline style (縮放後的大小)，若無則讀取屬性
            let finalFontSize = div.style.fontSize; 
            if (!finalFontSize || finalFontSize === "") {
                const attrSize = fo.getAttribute('data-font-size');
                finalFontSize = attrSize ? (attrSize + "px") : "24px";
            }

            const color = fo.getAttribute('fill') || div.style.color || '#000000';

            // 【核心修正】CSS 樣式回歸 Block 流式排版：
            // 1. display: block (這能讓瀏覽器正確處理行內元素的 vertical-align)
            // 2. text-align: left (滿足您的「靠左」需求)
            // 3. 移除 justify-content / align-items (這些是 Flex 專用，會干擾 MathJax 的對齊)
            div.style.cssText = `
                font-size: ${finalFontSize} !important;
                color: ${color};
                display: block;              /* 回歸標準流式排版 */
                text-align: left;            /* 水平靠左 */
                white-space: pre-wrap;       /* 保留換行 */
                word-break: break-word;      /* 自動折行 */
                margin: 0;
                padding: 2px;
                font-family: Arial, "Microsoft JhengHei", sans-serif;
                width: 100%;
                height: 100%;
                background-color: transparent;
                line-height: 1.2;            /* 設定行高，避免過度擁擠 */
                overflow: visible;
                box-sizing: border-box;
            `;

            // 處理內部所有的 MathJax SVG
            const mathSvgs = fo.querySelectorAll('svg');
            mathSvgs.forEach(nestedSvg => {
                
                // 【關鍵修正】
                // 1. 移除 verticalAlign 強制設定。MathJax 原本就會在 SVG 上設定 style="vertical-align: -0.xxx ex"
                //    我們必須保留這個值，分數線才會對齊文字中線。
                // 2. 移除 margin，避免干擾位置。
                
                // 強制繼承尺寸，防止被瀏覽器重置
                nestedSvg.style.width = "auto";
                nestedSvg.style.height = "auto";
                nestedSvg.style.maxWidth = "100%";

                // 展平 <use> 標籤
                nestedSvg.querySelectorAll('use').forEach(useEl => {
                    const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
                    if (href && mathJaxDefs[href]) {
                        const replacement = mathJaxDefs[href].cloneNode(true);
                        replacement.removeAttribute('id'); 
                        
                        const ux = parseFloat(useEl.getAttribute('x')) || 0;
                        const uy = parseFloat(useEl.getAttribute('y')) || 0;
                        const uTransform = useEl.getAttribute('transform') || '';
                        
                        let finalTransform = "";
                        if (ux !== 0 || uy !== 0) finalTransform += `translate(${ux}, ${uy}) `;
                        finalTransform += uTransform;
                        
                        if (finalTransform.trim()) replacement.setAttribute('transform', finalTransform.trim());

                        Array.from(useEl.attributes).forEach(attr => {
                            if (!['href', 'xlink:href', 'x', 'y', 'transform', 'id'].includes(attr.name)) {
                                replacement.setAttribute(attr.name, attr.value);
                            }
                        });
                        useEl.parentNode.replaceChild(replacement, useEl);
                    }
                });

                const nestedDefs = nestedSvg.querySelector('defs');
                if (nestedDefs) nestedDefs.remove();

                nestedSvg.querySelectorAll('*').forEach(child => {
                    if (child.getAttribute('fill') === 'currentColor' || !child.getAttribute('fill')) child.setAttribute('fill', color);
                    if (child.getAttribute('stroke') === 'currentColor') child.setAttribute('stroke', color);
                });
            });
        });

        // 處理一般 Text 標籤
        const texts = (clone.tagName.toLowerCase() === 'text') ? [clone] : Array.from(clone.querySelectorAll('text'));
        texts.forEach(t => {
            t.style.stroke = 'none';
            t.style.fontWeight = 'normal';
        });
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(tempSvg);

    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    if (safeRect) safeRect.style.display = 'block';
    
    if (format === 'svg') {
        return new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    }

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.crossOrigin = "anonymous";

        const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.src = e.target.result;
        };

        img.onload = () => {
            try {
                let scale = 2; 
                if (typeof currentCanvasMode !== 'undefined' && currentCanvasMode === 'print') scale = 3.125; 
                                
                canvas.width = exportRegion.width * scale;
                canvas.height = exportRegion.height * scale;
                ctx.scale(scale, scale);
                
                if (format === 'jpg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                ctx.drawImage(img, 0, 0, exportRegion.width, exportRegion.height);
                
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas export failed."));
                }, format === 'jpg' ? 'image/jpeg' : 'image/png');
            } catch (e) {
                console.error("Export Error:", e);
                reject(e);
            }
        };
        
        img.onerror = (e) => {
            reject(new Error("Image load failed during export."));
        };

        reader.readAsDataURL(svgBlob);
    });
}

function triggerInsertImageFile() {
    const input = document.createElement('input');
    input.type = 'file';
    // 【防呆機制】限制只能選擇常見的單頁圖片格式，避免選到 PDF 導致破圖
    input.accept = 'image/png, image/jpeg, image/jpg, image/svg+xml, image/webp';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const status = document.getElementById('status-text');
        if (status) status.innerText = "正在讀取圖片檔案...";

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Data = event.target.result;
            insertImageAtContextPos(base64Data);
        };
        reader.readAsDataURL(file);
    };
    
    // 模擬點擊觸發檔案選擇視窗
    input.click();
}

// 在右鍵點擊位置插入圖片
function insertImageAtContextPos(base64Data) {
    const svg = document.getElementById('svg-canvas');
    const shapesLayer = document.getElementById('shapes-layer') || svg;
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    const tempImg = new Image();
    
    tempImg.onload = function() {
        // 1. 取得真實物理尺寸並等比例縮放
        let nw = tempImg.naturalWidth || tempImg.width;
        let nh = tempImg.naturalHeight || tempImg.height;
        
        let w = nw;
        let h = nh;
        const maxSize = 400;
        
        if (w > maxSize || h > maxSize) {
            if (w > h) {
                h = (nh / nw) * maxSize;
                w = maxSize;
            } else {
                w = (nw / nh) * maxSize;
                h = maxSize;
            }
        }
        
        // 2. 計算右鍵當下、或定錨點的 SVG 座標
        let x = 0, y = 0;
        if (window.anchorPoint) {
            // 優先使用定錨點置中
            x = window.anchorPoint.x - w / 2;
            y = window.anchorPoint.y - h / 2;
            window.clearAnchorPoint();
        } else if (typeof lastContextPos !== 'undefined' && lastContextPos.x !== 0) {
            x = lastContextPos.x;
            y = lastContextPos.y;
        } else {
            // 備援：若無右鍵座標則放畫面可視區中間
            if (typeof window.getVisibleCanvasCenter === 'function') {
                const center = window.getVisibleCanvasCenter();
                x = center.x - w / 2;
                y = center.y - h / 2;
            } else {
                const vb = svg.viewBox.baseVal;
                const vbx = vb.width > 0 ? vb.x : 0;
                const vby = vb.height > 0 ? vb.y : 0;
                const vbw = vb.width > 0 ? vb.width : svg.clientWidth;
                const vbh = vb.height > 0 ? vb.height : svg.clientHeight;
                x = vbx + (vbw - w) / 2;
                y = vby + (vbh - h) / 2;
            }
        }
        
        // 3. 設定 SVG 圖片屬性
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', base64Data);
        img.setAttribute("x", "0");
        img.setAttribute("y", "0");
        img.setAttribute("width", w.toString());
        img.setAttribute("height", h.toString());
        img.setAttribute("preserveAspectRatio", "none"); 
        img.setAttribute("transform", `translate(${x}, ${y})`);
        img.setAttribute("class", "shape");
        img.setAttribute("data-tool", "image");
        img.style.cursor = "move";
        
        shapesLayer.appendChild(img);
        
        // 4. 清理狀態並切換至選取模式
        if (window.setMode) {
            window.setMode('select'); 
        } else if (typeof setMode === 'function') {
            setMode('select');
        }
        if (typeof currentShape !== 'undefined') currentShape = null; 
        if (typeof isDragging !== 'undefined') isDragging = false;
        
        if (typeof deselectAll === 'function') deselectAll();
        if (typeof addToSelection === 'function') addToSelection(img);
        if (typeof saveState === 'function') saveState();
        
        const status = document.getElementById('status-text');
        if (status) status.innerText = "✅ 圖片檔案已插入 (已自動切換至選取模式)";
    };
    tempImg.src = base64Data;
}
async function saveToRecentFiles(projectName, projectData) {
    // 【核心修正 1】如果專案名稱為空，或是系統預設的暫存名，則不要加入「最近清單」
    if (!projectName || projectName === "MyMathGraph") return; 

    try {
        await db.recentFiles.where('name').equals(projectName).delete();
        await db.recentFiles.add({
            name: projectName,
            timestamp: Date.now(),
            data: projectData 
        });
        
        const count = await db.recentFiles.count();
        if (count > 10) {
            const oldest = await db.recentFiles.orderBy('timestamp').first();
            if (oldest) await db.recentFiles.delete(oldest.id);
        }
    } catch (e) { console.error("Recent files save error", e); }
}

async function openRecentFilesModal() {
    const modal = document.getElementById('recent-files-modal');
    const list = document.getElementById('recent-files-list');
    list.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">載入中...</div>';
    modal.style.display = 'flex';
    
    try {
        const files = await db.recentFiles.orderBy('timestamp').reverse().toArray();
        
        if (files.length === 0) {
            list.innerHTML = '<div style="padding:40px; text-align:center; color:#999; font-style:italic;">尚無最近開啟的專案紀錄</div>';
            return;
        }
        
        list.innerHTML = '';
        files.forEach(f => {
            const dateObj = new Date(f.timestamp);
            // 格式化時間：YYYY/MM/DD HH:MM
            const dateStr = dateObj.getFullYear() + '/' + 
                            (dateObj.getMonth()+1).toString().padStart(2,'0') + '/' + 
                            dateObj.getDate().toString().padStart(2,'0') + ' ' + 
                            dateObj.getHours().toString().padStart(2,'0') + ':' + 
                            dateObj.getMinutes().toString().padStart(2,'0');
            
            const div = document.createElement('div');
            div.className = 'recent-file-item';
            
            // 單行佈局結構
            div.innerHTML = `
                <div class="recent-file-info" onclick="loadRecentFile(${f.id})" title="檔名: ${f.name}&#10;時間: ${dateStr}">
                    <div class="recent-file-name">📄 ${f.name}</div>
                    <div class="recent-file-time">${dateStr}</div>
                </div>
                <button class="btn-delete-record" onclick="deleteRecentFile(${f.id}, event)" title="移除此紀錄">✕</button>
            `;
            list.appendChild(div);
        });
    } catch(e) {
        console.error(e);
        list.innerHTML = `<div style="color:#c0392b; padding:20px; text-align:center;">讀取失敗 (${e.message})</div>`;
    }
}

async function loadRecentFile(id) {
    const file = await db.recentFiles.get(id);
    if (!file) return;
    
    showConfirm(`即將載入專案「${file.name}」\n這將會覆蓋您目前未儲存的工作，確定繼續嗎？`, async () => {
        try {
            const data = typeof file.data === 'string' ? JSON.parse(file.data) : file.data;
            
            // 清空畫布
            actionHistory = []; historyIndex = -1;
            shapesLayer.innerHTML = ''; handlesLayer.innerHTML = ''; bgLayer.innerHTML = '';
            deselectAll();
            
            currentProjectName = data.name || file.name;
            if (data.axisSettings) localStorage.setItem('math_editor_axis_settings', data.axisSettings);
            if (data.canvasWidth && data.canvasHeight) applyCanvasSize(data.canvasWidth, data.canvasHeight);
            
            if (data.version && data.version.startsWith("3")) {
                mathPages = data.pages;
                currentPageIndex = data.currentPageIndex || 0;
                loadPageToCanvas(currentPageIndex);
                renderPageTabs();
                statusText.innerText = `專案已載入 (共 ${mathPages.length} 頁)`;
            } else {
                // 相容舊版單頁格式
                if (data.gridState) document.getElementById('drawing-area').className = data.gridState;
                if (data.bgLayer) document.getElementById('background-layer').innerHTML = data.bgLayer;
                document.getElementById('shapes-layer').innerHTML = data.svgInner || "";
                
                mathPages = [createEmptyPageData()];
                currentPageIndex = 0;
                saveCurrentPageToMemory();
                renderPageTabs();
                statusText.innerText = `舊版專案已載入`;
            }
            
            document.getElementById('recent-files-modal').style.display = 'none';
            // 更新時間戳記
            await saveToRecentFiles(currentProjectName, data); 
        } catch(e) {
            showAlert("載入失敗：" + e.message);
        }
    });
}

async function deleteRecentFile(id, e) {
    if(e) e.stopPropagation();
    await db.recentFiles.delete(id);
    openRecentFilesModal(); // 重新整理列表
}

function createNewProject() {
    showConfirm("建立新專案將會清空目前所有的頁面與未儲存的進度，確定要繼續嗎？", () => {
        // 1. 重置專案名稱
        currentProjectName = "MyMathGraph";
        
        // 2. 清空歷史紀錄
        actionHistory = []; 
        historyIndex = -1;
        
        // 3. 清空畫布 DOM
        document.getElementById('shapes-layer').innerHTML = '';
        document.getElementById('background-layer').innerHTML = '';
        document.getElementById('handles-layer').innerHTML = '';
        
        // 4. 解除選取狀態
        deselectAll();
        
        // 5. 重新初始化多頁面管理器
        if (typeof initPageManager === 'function') {
            initPageManager();
        }
        
        if (typeof statusText !== 'undefined') statusText.innerText = "已建立全新的空白專案";
    });
}

async function copyElementsAsTextToClipboard(elements, statusEl) {
    statusEl.innerText = "⏳ 正在將文字/數學式轉換為 Word 原生公式...";
    
    // 依 Y 座標排序，由上而下
    const sortedElements = [...elements].sort((a, b) => {
        let yA = 0, yB = 0;
        try {
            const bboxA = a.getBBox();
            const ctmA = a.getCTM();
            yA = bboxA.y * ctmA.d + ctmA.f;
        } catch(e){}
        try {
            const bboxB = b.getBBox();
            const ctmB = b.getCTM();
            yB = bboxB.y * ctmB.d + ctmB.f;
        } catch(e){}
        return yA - yB;
    });

    let rawText = "";
    sortedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        if (tool === 'math') {
            const content = el.getAttribute('data-content') || "";
            rawText += content + "\n";
        } else if (tool === 'text') {
            rawText += el.textContent + "\n";
        }
    });

    rawText = rawText.trim().replace(/\\ /g, ' ');

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
                
                if (window.MathJax) {
                    await MathJax.typesetPromise([tempDiv]);
                    if (MathJax.startup && MathJax.startup.document) {
                        const mathItems = MathJax.startup.document.getMathItemsWithin(tempDiv);
                        if (mathItems && mathItems.length > 0 && mathItems[0].root) {
                            const SerializedMmlVisitor = MathJax._.core.MmlTree.SerializedMmlVisitor.SerializedMmlVisitor;
                            if (SerializedMmlVisitor) {
                                const visitor = new SerializedMmlVisitor();
                                mathML = visitor.visitTree(mathItems[0].root);
                            }
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
        statusEl.innerText = "✅ 複製成功！(支援貼入 Word 變更為可編輯公式)";
        setTimeout(() => { if (statusEl.innerText.includes("複製成功")) statusEl.innerText = "就緒。"; }, 3000);
    } catch (err) {
        console.error(err);
        showAlert("複製失敗，請檢查瀏覽器是否給予剪貼簿權限。"); // 統一使用系統 Modal
        statusEl.innerText = "❌ 複製失敗";
    }
}