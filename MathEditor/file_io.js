function saveState() {
    history = history.slice(0, historyIndex + 1);
    history.push({
        shapes: shapesLayer.innerHTML,
        bg: bgLayer.innerHTML,
        bgClass: drawingArea.className
    });
    if (history.length > MAX_HISTORY) history.shift();
    else historyIndex++;
}

function restoreState() {
    const state = history[historyIndex];
    if (!state) return;
    shapesLayer.innerHTML = state.shapes;
    bgLayer.innerHTML = state.bg;
    drawingArea.className = state.bgClass;
    selectedElements = [];
    handlesLayer.innerHTML = '';
    const newlyRestoredSelected = shapesLayer.querySelectorAll('.selected');
    newlyRestoredSelected.forEach(el => {
        selectedElements.push(el);
    });
    if (selectedElements.length === 1) {
        drawHandles(selectedElements[0]);
    }
    if (typeof updateGroupStatusUI === 'function') {
        updateGroupStatusUI();
    }
    if (typeof renderPropertyPanel === 'function') {
        renderPropertyPanel(selectedElements.length === 1 ? selectedElements[0] : null);
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreState();
    }
}

async function saveProject() {
    const svgElement = document.getElementById('svg-canvas');
    const svgContent = svgElement.innerHTML;
    const currentW = parseFloat(svgElement.getAttribute('width')) || 800;
    const currentH = parseFloat(svgElement.getAttribute('height')) || 600;
    const data = {
        version: "2.1",
        timestamp: new Date().toISOString(),
        name: currentProjectName || "MyMathGraph",
        gridState: document.getElementById('drawing-area').className,
        bgLayer: document.getElementById('background-layer').innerHTML,
        axisSettings: localStorage.getItem('math_editor_axis_settings') || "",
        canvasWidth: currentW,
        canvasHeight: currentH,
        svgInner: svgContent
    };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = (currentProjectName || "MathGraph_Project") + ".json";
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'MathGraph JSON Project',
                    accept: {
                        'application/json': ['.json']
                    }
                }],
                excludeAcceptAllOption: true
            });
            const writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            currentProjectName = handle.name.replace('.json', '');
            if (typeof statusText !== 'undefined') statusText.innerText = "專案儲存成功！";
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn("SaveFilePicker failed, falling back to download link.", err);
        }
    }
    const blob = new Blob([jsonString], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
    if (typeof statusText !== 'undefined') statusText.innerText = "專案已下載 (請查看下載資料夾)";
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
                    let shapesToImport = [];
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
                        if (isOpeningProject) {
                            if (data.gridState) document.getElementById('drawing-area').className = data.gridState;
                            if (data.bgLayer) document.getElementById('background-layer').innerHTML = data.bgLayer;
                            if (data.name) currentProjectName = data.name;
                            if (data.axisSettings) localStorage.setItem('math_editor_axis_settings', data.axisSettings);
                            if (data.canvasWidth && data.canvasHeight) {
                                applyCanvasSize(data.canvasWidth, data.canvasHeight);
                            }
                        }
                        domString = `<div id="temp-wrapper">${data.svgInner}</div>`;
                    } else if (file.name.endsWith('.svg')) {
                        domString = fileContent;
                        if (isOpeningProject) {
                            currentProjectName = file.name.replace('.svg', '');
                            document.getElementById('background-layer').innerHTML = '';
                        }
                    }
                    if (!isOpeningProject) {
                        saveState();
                        deselectAll();
                    }
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(domString, "text/html");
                    let importedShapesGroup = doc.querySelector('#shapes-layer');
                    if (!importedShapesGroup) importedShapesGroup = doc.querySelector('#temp-wrapper');
                    if (importedShapesGroup) {
                        shapesToImport = Array.from(importedShapesGroup.children);
                    } else {
                        const explicitShapes = Array.from(doc.querySelectorAll('.shape'));
                        if (explicitShapes.length > 0) {
                            shapesToImport = explicitShapes;
                        } else {
                            let svgRoot = doc.querySelector('svg');
                            if (svgRoot) {
                                shapesToImport = Array.from(svgRoot.children);
                            }
                        }
                    }
                    if (shapesToImport.length === 0) {
                        if (!isOpeningProject) showAlert("匯入的檔案中沒有可用的圖形物件。");
                    } else {
                        const idMap = {};
                        const newNodes = [];
                        shapesToImport.forEach(node => {
                            const tagName = node.tagName.toLowerCase();
                            const id = node.id;
                            if (tagName === 'defs' || tagName === 'style' || tagName === 'metadata' || tagName === 'script' ||
                                id === 'background-layer' || id === 'temp-layer' || id === 'handles-layer') {
                                return;
                            }
                            let newEl;
                            newEl = document.createElementNS("http://www.w3.org/2000/svg", tagName === 'foreignobject' ? 'foreignObject' : tagName);
                            if (tagName === 'foreignobject') {
                                newEl.classList.add('math-obj');
                                newEl.classList.add('shape');
                                newEl.setAttribute('data-tool', 'math');
                            }
                            Array.from(node.attributes).forEach(attr => {
                                newEl.setAttribute(attr.name, attr.value);
                            });
                            newEl.innerHTML = node.innerHTML;
                            const oldId = node.id;
                            const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
                            if (oldId) idMap[oldId] = newId;
                            newEl.id = newId;
                            newEl.classList.remove('selected');
                            if (!newEl.classList.contains('shape')) {
                                newEl.classList.add('shape');
                            }
                            if (!newEl.hasAttribute('data-tool')) {
                                if (tagName === 'g') newEl.setAttribute('data-tool', 'group');
                                else if (tagName === 'foreignobject') newEl.setAttribute('data-tool', 'math');
                                else newEl.setAttribute('data-tool', 'freehand');
                            }
                            shapesLayer.appendChild(newEl);
                            newNodes.push(newEl);
                        });
                        newNodes.forEach(el => {
                            const ownerId = el.getAttribute('data-owner');
                            if (ownerId && idMap[ownerId]) el.setAttribute('data-owner', idMap[ownerId]);
                            const ownerShapeId = el.getAttribute('data-owner-shape');
                            if (ownerShapeId && idMap[ownerShapeId]) el.setAttribute('data-owner-shape', idMap[ownerShapeId]);
                            const labelIds = el.getAttribute('data-label-ids');
                            if (labelIds) {
                                const newLabelIds = labelIds.split(',').map(old => idMap[old] || old).join(',');
                                el.setAttribute('data-label-ids', newLabelIds);
                            }
                            if (!isOpeningProject) addToSelection(el);
                        });
                        saveState();
                        if (isOpeningProject) {
                            selectedElements = [];
                            currentShape = null;
                            if (typeof setMode === 'function') setMode('select');
                            setTimeout(() => {
                                selectAllShapes();
                                if (typeof statusText !== 'undefined') statusText.innerText = `檔案已開啟 (共 ${newNodes.length} 個物件)`;
                            }, 50);
                        } else {
                            if (typeof statusText !== 'undefined') statusText.innerText = `已匯入 ${newNodes.length} 個物件`;
                        }
                    }
                } catch (err) {
                    showAlert("檔案讀取發生錯誤：" + err.message);
                    console.error(err);
                } finally {
                    isImportMode = false;
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        } else if (file.type.startsWith('image/')) {
            reader.onload = function(e) {
                importImageAsObject(e.target.result);
                isImportMode = false;
                event.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };
    if (!isImportMode) {
        showConfirm("開啟檔案將會覆蓋目前的畫布，確定要繼續嗎？", () => {
            if (typeof history !== 'undefined') {
                history = [];
                historyIndex = -1;
            }
            shapesLayer.innerHTML = '';
            handlesLayer.innerHTML = '';
            tempLayer.innerHTML = '';
            deselectAll();
            runReader();
        }, () => {
            event.target.value = '';
        });
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

async function copyImageToClipboard() {
    const status = document.getElementById('status-text');
    if (selectedElements.length === 0) {
        status.innerText = "⚠️ 請先選取要複製的物件！";
        return;
    }
    status.innerText = "正在複製圖片...";
    try {
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

async function pasteFromClipboard() {
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

    function getCanvasCenter(elementWidth = 0, elementHeight = 0) {
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
                const ratio = tempImg.height / tempImg.width;
                const w = 300;
                const h = w * ratio;
                const center = getCanvasCenter(w, h);
                img.setAttribute("href", base64Data);
                img.setAttribute("width", w.toString());
                img.setAttribute("height", h.toString());
                img.setAttribute("transform", `translate(${center.x}, ${center.y})`);
                img.setAttribute("class", "shape");
                img.setAttribute("data-tool", "image");
                img.style.cursor = "move";
                shapesLayer.appendChild(img);
                finalizePaste(img, "圖片已貼上並置中於畫布");
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
        const center = getCanvasCenter();
        textNode.setAttribute("transform", `translate(${center.x}, ${center.y})`);
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
        if (typeof deselectAll === 'function') deselectAll();
        if (typeof addToSelection === 'function') addToSelection(element);
        if (typeof saveState === 'function') saveState();
        status.innerText = "✅ " + msg;
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
            let format = 'jpg';
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
    const currentCanvasW = parseFloat(svg.getAttribute('width')) || 800;
    const currentCanvasH = parseFloat(svg.getAttribute('height')) || 600;
    let exportRegion = { x: 0, y: 0, width: currentCanvasW, height: currentCanvasH };
    let elementsToProcess = [];
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
        const padding = 15;
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
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.setAttribute("width", exportRegion.width);
    tempSvg.setAttribute("height", exportRegion.height);
    tempSvg.setAttribute("viewBox", `${exportRegion.x} ${exportRegion.y} ${exportRegion.width} ${exportRegion.height}`);
    tempSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    tempSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
        text, .axis-text, .axis-label, .vertex-label { 
            font-family: Arial, sans-serif !important; 
        }
        .vertex-label { fill: #c0392b; font-weight: bold; }
        .axis-text { font-size: 14px; }
        .axis-label { font-size: 24px; font-weight: bold; }
    `;
    tempSvg.appendChild(styleEl);
    const defs = svg.querySelector('defs');
    if (defs) tempSvg.appendChild(defs.cloneNode(true));
    if (!isSelection) {
        const bgLayer = svg.querySelector('#background-layer');
        if (bgLayer) tempSvg.appendChild(bgLayer.cloneNode(true));
    }
    for (const el of elementsToProcess) {
        const clone = el.cloneNode(true);
        clone.classList.remove('selected');
        tempSvg.appendChild(clone);
        const fos = [];
        if (clone.tagName.toLowerCase() === 'foreignobject') fos.push(clone);
        clone.querySelectorAll('foreignObject').forEach(f => fos.push(f));
        fos.forEach(fo => {
            const mathJaxSvg = fo.querySelector('mjx-container svg, .math-content svg');
            if (mathJaxSvg) {
                const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const x = parseFloat(fo.getAttribute('x')) || 0;
                const y = parseFloat(fo.getAttribute('y')) || 0;
                const transform = fo.getAttribute('transform') || '';
                g.setAttribute('transform', `${transform} translate(${x}, ${y})`);
                const nestedSvg = mathJaxSvg.cloneNode(true);
                nestedSvg.setAttribute('width', mathJaxSvg.getAttribute('width'));
                nestedSvg.setAttribute('height', mathJaxSvg.getAttribute('height'));
                nestedSvg.setAttribute('x', '25');
                nestedSvg.setAttribute('y', '-2');
                const color = fo.getAttribute('fill') || fo.querySelector('div')?.style.color || 'black';
                const fontSize = fo.getAttribute('data-font-size') || '24';
                g.setAttribute('fill', color);
                g.style.fontSize = fontSize + "px";
                g.appendChild(nestedSvg);
                if (fo.parentNode) {
                    fo.parentNode.replaceChild(g, fo);
                }
            } else {
                const div = fo.querySelector('div');
                if (!div) return;
                const fontSize = fo.getAttribute('data-font-size') || '12';
                const color = fo.getAttribute('fill') || div.style.color || '#000000';
                const textContent = fo.getAttribute('data-content') || div.textContent;
                const svgText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                if (fo.hasAttribute('transform')) svgText.setAttribute('transform', fo.getAttribute('transform'));
                const foX = parseFloat(fo.getAttribute('x')) || 0;
                const foY = parseFloat(fo.getAttribute('y')) || 0;
                const foW = parseFloat(fo.getAttribute('width')) || 0;
                const foH = parseFloat(fo.getAttribute('height')) || 0;
                svgText.setAttribute('x', ((foX + foW / 2) - 14).toString());
                svgText.setAttribute('y', ((foY + foH / 2) - 2).toString());
                svgText.setAttribute('font-size', fontSize);
                svgText.setAttribute('fill', color);
                svgText.setAttribute('text-anchor', 'middle');
                svgText.setAttribute('dominant-baseline', 'middle');
                svgText.style.stroke = 'none';
                svgText.style.fontWeight = 'normal';
                svgText.textContent = textContent;
                if (fo.parentNode) {
                    fo.parentNode.replaceChild(svgText, fo);
                }
            }
        });
        const texts = (clone.tagName.toLowerCase() === 'text') ? [clone] : Array.from(clone.querySelectorAll('text'));
        texts.forEach(t => {
            t.style.stroke = 'none';
            t.style.fontWeight = 'normal';
        });
    }
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(tempSvg);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    if (safeRect) safeRect.style.display = 'block';
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    if (format === 'svg') {
        return new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    }
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            try {
                let scale = 2;
                if (typeof currentCanvasMode !== 'undefined' && currentCanvasMode === 'print') {
                    scale = 3.125;
                } canvas.width = exportRegion.width * scale;
                canvas.height = exportRegion.height * scale;
                ctx.scale(scale, scale);
                if (format === 'jpg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(img, 0, 0, exportRegion.width, exportRegion.height);
                URL.revokeObjectURL(url);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas to Blob failed"));
                }, mimeType);
            } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
            }
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error("圖片載入失敗"));
        };
        img.src = url;
    });
}