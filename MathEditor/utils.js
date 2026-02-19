const commonSymbols = [
    '°', '℃', '℉', 'θ', 'π', 'α', 'β', 'Δ',
    '∠', '⊥', '∥', '△', '◯', '≈', '≠', '±',
    '×', '÷', '√', '∞', 'Ω', 'μ', 'λ', 'φ',
    '²', '³', '½', '→', '←', '↑', '↓'
];
function showAlert(msg, title = "提示", callback = null) {
    const modal = document.getElementById('sys-modal');
    const titleEl = document.getElementById('sys-modal-title');
    const msgEl = document.getElementById('sys-modal-msg');
    const btnOk = document.getElementById('sys-btn-ok');
    const btnCancel = document.getElementById('sys-btn-cancel');
    titleEl.innerText = title;
    msgEl.innerHTML = msg.replace(/\n/g, '<br>');
    btnCancel.style.display = 'none';
    btnOk.onclick = function() {
        modal.style.display = 'none';
        if (callback) callback();
    };
    modal.style.display = 'flex';
}
function showConfirm(msg, onConfirm, onCancel = null, title = "確認") {
    const modal = document.getElementById('sys-modal');
    const titleEl = document.getElementById('sys-modal-title');
    const msgEl = document.getElementById('sys-modal-msg');
    const btnOk = document.getElementById('sys-btn-ok');
    const btnCancel = document.getElementById('sys-btn-cancel');
    titleEl.innerText = title;
    msgEl.innerHTML = msg.replace(/\n/g, '<br>');
    btnCancel.style.display = 'inline-block';
    btnOk.onclick = function() {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    };
    btnCancel.onclick = function() {
        modal.style.display = 'none';
        if (onCancel) onCancel();
    };
    modal.style.display = 'flex';
}
window.showAlert = showAlert;
window.showConfirm = showConfirm;
function insertAtCursor(input, textToInsert) {
    if (document.selection) {
        input.focus();
        sel = document.selection.createRange();
        sel.text = textToInsert;
    } else if (input.selectionStart || input.selectionStart == '0') {
        var startPos = input.selectionStart;
        var endPos = input.selectionEnd;
        input.value = input.value.substring(0, startPos) +
            textToInsert +
            input.value.substring(endPos, input.value.length);
        input.selectionStart = startPos + textToInsert.length;
        input.selectionEnd = startPos + textToInsert.length;
    } else {
        input.value += textToInsert;
    }
    input.focus();
}
function getShapePoints(shape) {
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    if (tool === 'group' && ['central-angle', 'inscribed-angle', 'tangent-chord-angle'].includes(subTool)) {
        const dataNodes = shape.querySelectorAll('.vertex-data');
        if (dataNodes.length > 0) {
            return Array.from(dataNodes).map(node => ({
                x: parseFloat(node.getAttribute('cx')),
                y: parseFloat(node.getAttribute('cy'))
            }));
        }
        if (subTool === 'central-angle' && dataNodes.length >= 3) {
            return [
                { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') },
                { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') },
                { x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy') }
            ];
        }
        if (subTool === 'inscribed-angle' && dataNodes.length >= 3) {
            return [
                { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') },
                { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') },
                { x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy') }
            ];
        }
        if (subTool === 'tangent-chord-angle' && dataNodes.length >= 2) {
            const A = { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') };
            const P = { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') };
            const circleId = shape.getAttribute('data-owner-circle-id');
            const circle = document.getElementById(circleId);
            if (circle) {
                const mC = circle.getCTM();
                const gCx = (+circle.getAttribute('cx') || 0) * mC.a + mC.e;
                const gCy = (+circle.getAttribute('cy') || 0) * mC.d + mC.f;
                const mG = shape.getCTM().inverse();
                const lCx = gCx * mG.a + gCy * mG.c + mG.e;
                const lCy = gCx * mG.b + gCy * mG.d + mG.f;
                const dx = P.x - lCx;
                const dy = P.y - lCy;
                const T = { x: P.x - dy, y: P.y + dx };
                return [A, P, T];
            }
            return [A, P];
        }
    }
    if (['sector', 'arc', 'arch'].includes(subTool)) {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const sA = parseFloat(shape.getAttribute('data-start-angle'));
        const eA = parseFloat(shape.getAttribute('data-end-angle'));
        const pStart = { x: cx + r * Math.cos(sA), y: cy - r * Math.sin(sA) };
        const pEnd = { x: cx + r * Math.cos(eA), y: cy - r * Math.sin(eA) };
        if (subTool === 'sector') {
            return [pEnd, { x: cx, y: cy }, pStart];
        } else {
            return [pStart, pEnd];
        }
    }
    if (tool === 'line') {
        if (shape.tagName === 'g') {
            const l = shape.querySelector('.visible-line') || shape.querySelector('line');
            if (l) {
                return [{
                    x: +l.getAttribute('x1'),
                    y: +l.getAttribute('y1')
                }, {
                    x: +l.getAttribute('x2'),
                    y: +l.getAttribute('y2')
                }];
            }
            return [];
        } else {
            return [{
                x: +shape.getAttribute('x1'),
                y: +shape.getAttribute('y1')
            }, {
                x: +shape.getAttribute('x2'),
                y: +shape.getAttribute('y2')
            }];
        }
    } else if (shape.getAttribute('points')) {
        return parsePoints(shape.getAttribute('points'));
    }
    return [];
}
function createStep1Highlight(type, source) {
    clearStep1Highlight();
    const highlightColor = "#00b894";
    if (type === 'connect_points') {
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute('cx', source.x);
        circle.setAttribute('cy', source.y);
        circle.setAttribute('r', 6);
        circle.style.cssText = `fill:none; stroke:${highlightColor}; stroke-width:3; pointer-events:none;`;
        shapesLayer.appendChild(circle);
        tempLayer.appendChild(circle);
        step1HighlightObj = circle;
    } else if (type === 'parallel') {
        const line = document.createElementNS(ns, "line");
        line.setAttribute('x1', source.p1.x);
        line.setAttribute('y1', source.p1.y);
        line.setAttribute('x2', source.p2.x);
        line.setAttribute('y2', source.p2.y);
        line.style.cssText = `stroke:${highlightColor}; stroke-width:3; stroke-dasharray:5,3; pointer-events:none;`;
        shapesLayer.appendChild(line);
        step1HighlightObj = line;
    } else if (type === 'tangent') {
        const ghost = source.cloneNode(true);
        ghost.removeAttribute('id');
        ghost.style.cssText = `fill:none; stroke:${highlightColor}; stroke-width:3; stroke-dasharray:5,3; pointer-events:none; vector-effect:non-scaling-stroke;`;
        shapesLayer.appendChild(ghost);
        step1HighlightObj = ghost;
    }
}
function clearStep1Highlight() {
    if (step1HighlightObj) {
        if (step1HighlightObj.parentNode) {
            step1HighlightObj.parentNode.removeChild(step1HighlightObj);
        }
        step1HighlightObj = null;
    }
}
function openNumberInputModal(title, defaultValue, callback) {
    const modal = document.getElementById('number-input-modal');
    const titleEl = document.getElementById('number-modal-title');
    const input = document.getElementById('number-modal-input');
    titleEl.innerText = title;
    input.value = defaultValue;
    numberInputCallback = callback;
    modal.style.display = 'block';
    if (typeof defaultValue === 'string' && isNaN(parseFloat(defaultValue)) || title.includes("名稱")) {
        input.type = 'text';
        input.style.textAlign = 'left';
    } else {
        input.type = 'number';
        input.style.textAlign = 'center';
    }
    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);
}
function closeNumberInputModal() {
    document.getElementById('number-input-modal').style.display = 'none';
    numberInputCallback = null;
}
function confirmNumberInput() {
    const val = document.getElementById('number-modal-input').value;
    if (numberInputCallback) {
        numberInputCallback(val);
    }
    closeNumberInputModal();
}
function openOptionsModal(title, options, callback) {
    const old = document.getElementById('options-modal');
    if (old) old.remove();
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'options-modal';
    modalOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; display:flex; justify-content:center; align-items:center;";
    let checksHtml = '';
    options.forEach((opt, i) => {
        checksHtml += `
            <div style="margin: 10px 0; text-align: left;">
                <label style="font-size: 16px; cursor: pointer; display: flex; align-items: center;">
                    <input type="checkbox" id="opt-check-${i}" ${opt.checked ? 'checked' : ''} style="width:18px; height:18px; margin-right:8px;">
                    ${opt.label}
                </label>
            </div>
        `;
    });
    modalOverlay.innerHTML = `
        <div style="background:white; padding:20px; border-radius:8px; width:300px; box-shadow:0 4px 15px rgba(0,0,0,0.3); text-align:center;">
            <h3 style="margin-top:0; color:#2c3e50;">${title}</h3>
            <div style="margin-bottom: 20px;">${checksHtml}</div>
            <div style="display:flex; justify-content:space-around;">
                <button id="btn-opt-cancel" style="padding:8px 20px; background:#95a5a6; color:white; border:none; border-radius:4px; cursor:pointer;">取消</button>
                <button id="btn-opt-ok" style="padding:8px 20px; background:#2980b9; color:white; border:none; border-radius:4px; cursor:pointer;">確定</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);
    const close = () => modalOverlay.remove();
    document.getElementById('btn-opt-cancel').onclick = close;
    document.getElementById('btn-opt-ok').onclick = () => {
        const results = options.map((_, i) => document.getElementById(`opt-check-${i}`).checked);
        close();
        callback(results);
    };
}
function openExclusiveOptionsModal(title, options, callback) {
    const old = document.getElementById('exclusive-options-modal');
    if (old) old.remove();
    let currentSelectedIndex = options.findIndex(o => o.checked);
    if (currentSelectedIndex === -1) currentSelectedIndex = 0;
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'exclusive-options-modal';
    modalOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:6000; display:flex; justify-content:center; align-items:center;";
    let buttonsHtml = '';
    options.forEach((opt, i) => {
        const isSelected = (i === currentSelectedIndex);
        const circleInner = isSelected ? '<span style="width:8px; height:8px; background:#2980b9; border-radius:50%;"></span>' : '';
        const bgStyle = isSelected ? 'background:#f0f8ff; border-color:#2980b9;' : 'background:white; border-color:#ddd;';
        buttonsHtml += `
            <div id="ex-opt-${i}" onclick="window.handleExclusiveUpdate(${i})" 
                 style="width:100%; padding:12px 15px; margin-bottom:8px; text-align:left; border:1px solid; border-radius:6px; cursor:pointer; font-size:15px; display:flex; align-items:center; transition: all 0.2s; box-sizing: border-box; ${bgStyle}">
                <span id="ex-circle-${i}" style="width:16px; height:16px; border-radius:50%; border:2px solid #2980b9; margin-right:12px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                     ${circleInner}
                </span>
                <span style="color:#333; font-weight:500;">${opt.label}</span>
            </div>
        `;
    });
    modalOverlay.innerHTML = `
        <div style="background:white; padding:0; border-radius:12px; width:340px; box-shadow:0 10px 25px rgba(0,0,0,0.2); overflow:hidden; font-family: sans-serif; display:flex; flex-direction:column; max-height:80vh;">
            <div style="padding:15px 20px; background:#f8f9fa; border-bottom:1px solid #eee; font-weight:bold; color:#2c3e50; font-size:17px;">
                ${title}
            </div>
            <div style="padding:20px; overflow-y:auto;">
                ${buttonsHtml}
            </div>
            <div style="padding:12px 20px; background:#f8f9fa; text-align:right; border-top:1px solid #f0f0f0; display:flex; justify-content:flex-end; gap:10px;">
                <button onclick="document.getElementById('exclusive-options-modal').remove()" 
                        style="padding:8px 15px; background:#eee; border:none; border-radius:4px; color:#555; cursor:pointer; font-size:14px;">取消</button>
                <button onclick="window.handleExclusiveConfirm()" 
                        style="padding:8px 20px; background:#2980b9; border:none; border-radius:4px; color:white; cursor:pointer; font-size:14px; font-weight:bold;">確定</button>
            </div>
        </div>
    `;
    window.handleExclusiveUpdate = (idx) => {
        currentSelectedIndex = idx;
        options.forEach((_, i) => {
            const div = document.getElementById(`ex-opt-${i}`);
            const circle = document.getElementById(`ex-circle-${i}`);
            if (i === idx) {
                div.style.background = '#f0f8ff';
                div.style.borderColor = '#2980b9';
                circle.innerHTML = '<span style="width:8px; height:8px; background:#2980b9; border-radius:50%;"></span>';
            } else {
                div.style.background = 'white';
                div.style.borderColor = '#ddd';
                circle.innerHTML = '';
            }
        });
    };
    window.handleExclusiveConfirm = () => {
        const results = options.map((_, i) => i === currentSelectedIndex);
        document.getElementById('exclusive-options-modal').remove();
        delete window.handleExclusiveUpdate;
        delete window.handleExclusiveConfirm;
        callback(results);
    };
    document.body.appendChild(modalOverlay);
}
function addToSelection(el) {
    if (!selectedElements.includes(el)) {
        selectedElements.push(el);
        el.classList.add('selected');
    }
    const rotationDisplay = document.getElementById('rotation-display');
    if (selectedElements.length === 1 && rotationDisplay) {
        const angle = getTrueRotation(el);
        const normalized = Math.round((angle % 360 + 360) % 360);
        rotationDisplay.innerText = `${normalized}°`;
    } else if (rotationDisplay) {
        rotationDisplay.innerText = `---°`;
    }
    if (selectedElements.length === 1 && el.getAttribute('data-tool') !== 'math') {
        drawHandles(el);
    } else {
        handlesLayer.innerHTML = '';
    }
    updateGroupStatusUI();
    if (selectedElements.length === 1) {
        if (typeof renderPropertyPanel === 'function') renderPropertyPanel(el);
    } else {
        if (typeof renderPropertyPanel === 'function') renderPropertyPanel(null);
    }
}
function removeFromSelection(el) {
    const idx = selectedElements.indexOf(el);
    if (idx > -1) {
        selectedElements.splice(idx, 1);
        el.classList.remove('selected');
    }
    handlesLayer.innerHTML = '';
    if (selectedElements.length === 1 && selectedElements[0].getAttribute('data-tool') !== 'math') {
        drawHandles(selectedElements[0]);
    }
    updateGroupStatusUI();
}
function deselectAll() {
    selectedElements.forEach(el => el.classList.remove('selected'));
    selectedElements = [];
    handlesLayer.innerHTML = '';
    draggingHandleIndex = null;
    updateGroupStatusUI();
    if (typeof renderPropertyPanel === 'function') renderPropertyPanel(null);
    const rotationDisplay = document.getElementById('rotation-display');
    if (rotationDisplay) {
        rotationDisplay.innerText = `0°`;
    }
}
window.deselectAll = deselectAll;
function selectAllShapes() {
    if (mode !== 'select') setMode('select');
    const allShapes = shapesLayer.querySelectorAll('.shape');
    deselectAll();
    allShapes.forEach(el => {
        if (el.getAttribute('data-tool') !== 'grid') {
            addToSelection(el);
        }
    });
    statusText.innerText = `已全選 ${selectedElements.length} 個物件`;
}
function updateGroupStatusUI() {
    const btn = document.getElementById('btn-group-action');
    if (!btn) return;
    const hasGroup = selectedElements.some(el => el.getAttribute('data-tool') === 'group');
    if (hasGroup) {
        btn.classList.add('status-group-active');
        if (selectedElements.length === 1) {
            statusText.innerText = "已選取群組物件 (紫色高亮)";
        }
    } else {
        btn.classList.remove('status-group-active');
    }
}
function clearCanvas() {
    showConfirm("確定清空畫布？\n(這會清除所有圖形，保留背景設定)", () => {
        shapesLayer.innerHTML = '';
        deselectAll();
        saveState();
        isImportedContent = false;
        statusText.innerText = "畫布已清空";
    });
}
function updateSelectionUI() {
    if (selectedElements.length === 1) {
        drawHandles(selectedElements[0]);
    } else {
        handlesLayer.innerHTML = '';
    }
}
function copySelection() {
    if (selectedElements.length === 0) return;
    clipboard = [];
    const idsToCopy = new Set();
    selectedElements.forEach(el => {
        if (!el.id) el.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        idsToCopy.add(el.id);
    });
    const allMarks = document.querySelectorAll('.mark-path, .vertex-label');
    allMarks.forEach(mark => {
        const ownerId = mark.getAttribute('data-owner');
        const ownerShapeId = mark.getAttribute('data-owner-shape');
        const targetId = ownerId || ownerShapeId;
        if (targetId && idsToCopy.has(targetId)) {
            if (!mark.id) mark.id = 'mark-' + Date.now() + Math.random().toString(36).substr(2, 5);
            idsToCopy.add(mark.id);
        }
    });
    idsToCopy.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            clipboard.push({
                originalId: el.id,
                node: el.cloneNode(true)
            });
        }
    });
    statusText.innerText = `已複製 ${clipboard.length} 個物件 (含關聯標記)`;
}
function cutSelection() {
    if (selectedElements.length === 0) return;
    copySelection();
    deleteSelected();
    statusText.innerText = "已剪下物件";
}
function pasteSelection(atMouse = false) {
    if (clipboard.length === 0) return;
    deselectAll();
    const idMap = {};
    const newNodes = [];
    const getRecursiveBBox = (node) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let valid = false;
        const tag = node.tagName.toLowerCase();
        const tool = node.getAttribute('data-tool');
        const display = node.style.display;
        if (display === 'none') return { valid: false };
        let tx = 0, ty = 0;
        const transform = node.getAttribute('transform') || "";
        if (transform.includes('matrix')) {
            const m = /matrix\(([^)]+)\)/.exec(transform);
            if (m) {
                const v = m[1].split(/[,\s]+/).map(parseFloat);
                tx = v[4]; ty = v[5];
            }
        } else if (transform.includes('translate')) {
            const t = /translate\(([-0-9.]+)(?:[, ]+([-0-9.]+))?\)/.exec(transform);
            if (t) {
                tx = parseFloat(t[1]);
                ty = parseFloat(t[2] || 0);
            }
        }
        const addPoint = (x, y) => {
            const gx = x + tx;
            const gy = y + ty;
            if (gx < minX) minX = gx;
            if (gx > maxX) maxX = gx;
            if (gy < minY) minY = gy;
            if (gy > maxY) maxY = gy;
            valid = true;
        };
        if (tag === 'g') {
            const children = Array.from(node.children);
            children.forEach(child => {
                if (child.tagName === 'defs' || child.tagName === 'style') return;
                const childBox = getRecursiveBBox(child);
                if (childBox.valid) {
                    if (childBox.minX + tx < minX) minX = childBox.minX + tx;
                    if (childBox.maxX + tx > maxX) maxX = childBox.maxX + tx;
                    if (childBox.minY + ty < minY) minY = childBox.minY + ty;
                    if (childBox.maxY + ty > maxY) maxY = childBox.maxY + ty;
                    valid = true;
                }
            });
        }
        else if (tag === 'circle' || tag === 'ellipse') {
            const cx = parseFloat(node.getAttribute('cx') || 0);
            const cy = parseFloat(node.getAttribute('cy') || 0);
            const rx = parseFloat(node.getAttribute('rx') || node.getAttribute('r') || 0);
            const ry = parseFloat(node.getAttribute('ry') || node.getAttribute('r') || 0);
            addPoint(cx - rx, cy - ry);
            addPoint(cx + rx, cy + ry);
        }
        else if (['rect', 'image', 'foreignobject', 'use'].includes(tag)) {
            const x = parseFloat(node.getAttribute('x') || 0);
            const y = parseFloat(node.getAttribute('y') || 0);
            const w = parseFloat(node.getAttribute('width') || 0);
            const h = parseFloat(node.getAttribute('height') || 0);
            addPoint(x, y);
            addPoint(x + w, y + h);
        }
        else if (tag === 'line') {
            addPoint(parseFloat(node.getAttribute('x1') || 0), parseFloat(node.getAttribute('y1') || 0));
            addPoint(parseFloat(node.getAttribute('x2') || 0), parseFloat(node.getAttribute('y2') || 0));
        }
        else if (tag === 'polygon' || tag === 'polyline') {
            const pointsStr = node.getAttribute('points') || "";
            const pts = pointsStr.trim().split(/[\s,]+/).map(parseFloat);
            for (let i = 0; i < pts.length; i += 2) {
                if (!isNaN(pts[i]) && !isNaN(pts[i + 1])) {
                    addPoint(pts[i], pts[i + 1]);
                }
            }
        }
        else if (tag === 'text') {
            const x = parseFloat(node.getAttribute('x') || 0);
            const y = parseFloat(node.getAttribute('y') || 0);
            const fs = parseFloat(node.getAttribute('font-size') || 12);
            const len = (node.textContent || "").length;
            addPoint(x - (len * fs) / 4, y - fs);
            addPoint(x + (len * fs) / 4, y + fs / 2);
        }
        else if (tag === 'path') {
            if (node.hasAttribute('data-center-x')) {
                const dcx = parseFloat(node.getAttribute('data-center-x'));
                const dcy = parseFloat(node.getAttribute('data-center-y'));
                const dr = parseFloat(node.getAttribute('data-radius') || 0);
                addPoint(dcx - dr, dcy - dr);
                addPoint(dcx + dr, dcy + dr);
            } else {
                const d = node.getAttribute('d') || "";
                const coords = d.match(/[-0-9.]+/g);
                if (coords && coords.length >= 2) {
                    for (let i = 0; i < coords.length; i += 2) {
                        const px = parseFloat(coords[i]);
                        const py = parseFloat(coords[i + 1]);
                        if (!isNaN(px) && !isNaN(py)) {
                            addPoint(px, py);
                        }
                    }
                }
            }
        }
        return { minX, minY, maxX, maxY, valid };
    };
    let globalMinX = Infinity, globalMinY = Infinity, globalMaxX = -Infinity, globalMaxY = -Infinity;
    let anyValid = false;
    if (atMouse) {
        clipboard.forEach(item => {
            const bbox = getRecursiveBBox(item.node);
            if (bbox.valid) {
                if (bbox.minX < globalMinX) globalMinX = bbox.minX;
                if (bbox.minY < globalMinY) globalMinY = bbox.minY;
                if (bbox.maxX > globalMaxX) globalMaxX = bbox.maxX;
                if (bbox.maxY > globalMaxY) globalMaxY = bbox.maxY;
                anyValid = true;
            }
        });
    }
    let dx, dy;
    if (atMouse && anyValid) {
        const centerX = (globalMinX + globalMaxX) / 2;
        const centerY = (globalMinY + globalMaxY) / 2;
        dx = lastContextPos.x - centerX;
        dy = lastContextPos.y - centerY;
    } else {
        dx = 20;
        dy = 20;
    }
    clipboard.forEach(item => {
        const newEl = item.node.cloneNode(true);
        const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        idMap[item.originalId] = newId;
        newEl.id = newId;
        newEl.classList.remove('selected');
        const tagName = newEl.tagName.toLowerCase();
        const tool = newEl.getAttribute('data-tool');
        if (newEl.getAttribute('transform') || tool === 'group' || tool === 'solid' || tool === 'text' || tool === 'math' || tagName === 'path' || tagName === 'g') {
            let currentTransform = newEl.getAttribute('transform') || '';
            if (currentTransform.includes('matrix')) {
                const match = /matrix\(([^)]+)\)/.exec(currentTransform);
                if (match) {
                    const values = match[1].split(/[,\s]+/).map(parseFloat);
                    values[4] += dx;
                    values[5] += dy;
                    newEl.setAttribute('transform', `matrix(${values.join(',')})`);
                }
            } else if (currentTransform.includes('translate')) {
                newEl.setAttribute('transform', currentTransform.replace(/translate\(([-0-9.]+)(?:[, ]+([-0-9.]+))?\)/, (match, p1, p2) => {
                    const ox = parseFloat(p1);
                    const oy = parseFloat(p2 || 0);
                    return `translate(${ox + dx}, ${oy + dy})`;
                }));
            } else {
                newEl.setAttribute('transform', `translate(${dx}, ${dy}) ${currentTransform}`);
            }
        }
        else {
            if (['rect', 'image', 'use'].includes(tagName)) {
                newEl.setAttribute('x', parseFloat(newEl.getAttribute('x') || 0) + dx);
                newEl.setAttribute('y', parseFloat(newEl.getAttribute('y') || 0) + dy);
            } else if (tagName === 'circle' || tagName === 'ellipse') {
                newEl.setAttribute('cx', parseFloat(newEl.getAttribute('cx') || 0) + dx);
                newEl.setAttribute('cy', parseFloat(newEl.getAttribute('cy') || 0) + dy);
            } else if (tagName === 'line') {
                newEl.setAttribute('x1', parseFloat(newEl.getAttribute('x1') || 0) + dx);
                newEl.setAttribute('y1', parseFloat(newEl.getAttribute('y1') || 0) + dy);
                newEl.setAttribute('x2', parseFloat(newEl.getAttribute('x2') || 0) + dx);
                newEl.setAttribute('y2', parseFloat(newEl.getAttribute('y2') || 0) + dy);
            } else if (tagName === 'polygon' || tagName === 'polyline') {
                const points = newEl.getAttribute('points');
                if (points) {
                    const newPoints = points.split(/\s+|,/).filter(p => p !== '').reduce((acc, val, i, arr) => {
                        if (i % 2 === 0) {
                            const nx = parseFloat(val) + dx;
                            const ny = parseFloat(arr[i + 1]) + dy;
                            acc.push(`${nx},${ny}`);
                        }
                        return acc;
                    }, []).join(' ');
                    newEl.setAttribute('points', newPoints);
                }
            }
        }
        shapesLayer.appendChild(newEl);
        newNodes.push(newEl);
    });
    newNodes.forEach(el => {
        const ownerId = el.getAttribute('data-owner');
        if (ownerId && idMap[ownerId]) {
            el.setAttribute('data-owner', idMap[ownerId]);
        }
        const ownerShapeId = el.getAttribute('data-owner-shape');
        if (ownerShapeId && idMap[ownerShapeId]) {
            el.setAttribute('data-owner-shape', idMap[ownerShapeId]);
        }
        const labelIds = el.getAttribute('data-label-ids');
        if (labelIds) {
            const newLabelIds = labelIds.split(',').map(oldLabelId => {
                return idMap[oldLabelId] ? idMap[oldLabelId] : oldLabelId;
            }).join(',');
            el.setAttribute('data-label-ids', newLabelIds);
        }
        addToSelection(el);
    });
    saveState();
    if (typeof statusText !== 'undefined') statusText.innerText = `已貼上 ${clipboard.length} 個物件${atMouse ? ' (游標位置)' : ''}`;
}
function deleteSelected() {
    if (selectedElements.length > 0) {
        selectedElements.forEach(el => {
            const id = el.id;
            if (id) {
                const dependents = document.querySelectorAll(
                    `[data-owner-circle-id="${id}"], ` +
                    `[data-owner-shape="${id}"], ` +
                    `[data-circle-id="${id}"], ` +
                    `[data-owner="${id}"], ` +
                    `[data-owner-angle-shape="${id}"]`
                );
                dependents.forEach(dep => {
                    if (typeof deleteLinkedLabels === 'function') {
                        deleteLinkedLabels(dep);
                    }
                    dep.remove();
                });
            }
            if (el.classList.contains('vertex-label')) {
                el.remove();
            } else {
                if (typeof deleteLinkedLabels === 'function') {
                    deleteLinkedLabels(el);
                }
                el.remove();
            }
        });
        selectedElements = [];
        handlesLayer.innerHTML = '';
        saveState();
        if (typeof renderPropertyPanel === 'function') {
            renderPropertyPanel(null);
        }
        if (typeof statusText !== 'undefined') {
            statusText.innerText = "物件及其關聯標記已刪除";
        }
    }
}
function mirrorSelected() {
    if (selectedElements.length === 0) {
        statusText.innerText = "⚠️ 請先選取要鏡像的物件";
        return;
    }
    let minX = Infinity, maxX = -Infinity;
    selectedElements.forEach(el => {
        const pts = getTransformedPoints(el);
        if (pts.length > 0) {
            pts.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
            });
        } else {
            const bbox = el.getBBox();
            const m = el.getCTM();
            const corners = [
                { x: bbox.x, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                { x: bbox.x, y: bbox.y + bbox.height }
            ];
            corners.forEach(c => {
                const tx = c.x * m.a + c.y * m.c + m.e;
                minX = Math.min(minX, tx);
                maxX = Math.max(maxX, tx);
            });
        }
    });
    if (minX === Infinity) return;
    const midX = (minX + maxX) / 2;
    const mirrorTransform = `translate(${midX}, 0) scale(-1, 1) translate(-${midX}, 0)`;
    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'polygon' || tagName === 'polyline' || tagName === 'line' || tool === 'line' || tool === 'polygon' || tool === 'polyline') {
            const reflectPoint = (x, y, matrix) => {
                const gx = x * matrix.a + y * matrix.c + matrix.e;
                const gy = x * matrix.b + y * matrix.d + matrix.f;
                return { x: 2 * midX - gx, y: gy };
            };
            const m = el.getCTM();
            if (tagName === 'line' || tool === 'line') {
                const lines = (tagName === 'g' || tool === 'group') ? el.querySelectorAll('line') : [el];
                lines.forEach(l => {
                    const lx1 = +l.getAttribute('x1'); const ly1 = +l.getAttribute('y1');
                    const lx2 = +l.getAttribute('x2'); const ly2 = +l.getAttribute('y2');
                    const p1 = reflectPoint(lx1, ly1, m);
                    const p2 = reflectPoint(lx2, ly2, m);
                    l.setAttribute('x1', p1.x);
                    l.setAttribute('y1', p1.y);
                    l.setAttribute('x2', p2.x);
                    l.setAttribute('y2', p2.y);
                });
            } else {
                const visualPts = getTransformedPoints(el);
                const reflectedPts = visualPts.map(p => ({
                    x: 2 * midX - p.x,
                    y: p.y
                }));
                const pointsStr = reflectedPts.map(p => `${p.x},${p.y}`).join(' ');
                el.setAttribute('points', pointsStr);
            }
            el.removeAttribute('transform');
        }
        else {
            const currentTransform = el.getAttribute('transform') || '';
            el.setAttribute('transform', `${mirrorTransform} ${currentTransform}`);
        }
        if (el.hasAttribute('data-label-ids')) {
            reorderLabels(el);
        }
        if (typeof updateLabelPositions === 'function') updateLabelPositions(el);
    });
    if (selectedElements.length === 1) drawHandles(selectedElements[0]);
    saveState();
    statusText.innerText = `✅ 已完成左右鏡像 (文字/數學式已翻轉)`;
}
function zOrder(action) {
    if (selectedElements.length === 0) return;
    selectedElements.forEach(el => {
        const parent = el.parentNode;
        if (action === 'front') {
            parent.appendChild(el);
        } else if (action === 'back') {
            parent.insertBefore(el, parent.firstChild);
        }
    });
    saveState();
    statusText.innerText = "已調整圖層順序";
}
function groupSelected() {
    if (selectedElements.length < 2) {
        statusText.innerText = "請至少選取兩個物件才能群組";
        return;
    }
    const group = document.createElementNS(ns, "g");
    group.setAttribute("class", "shape group");
    group.setAttribute("data-tool", "group");
    const firstEl = selectedElements[0];
    firstEl.parentNode.insertBefore(group, firstEl);
    selectedElements.forEach(el => {
        el.classList.remove('selected');
        group.appendChild(el);
    });
    selectedElements = [group];
    group.classList.add('selected');
    drawHandles(group);
    updateGroupStatusUI();
    saveState();
    statusText.innerText = "已建立群組";
}
function ungroupSelected() {
    const groups = selectedElements.filter(el => el.getAttribute('data-tool') === 'group');
    if (groups.length === 0) {
        statusText.innerText = "請先選取群組物件";
        return;
    }
    const shapesLayer = document.getElementById('shapes-layer');
    const newElementsToSelect = [];
    groups.forEach(group => {
        const children = Array.from(group.children);
        const layerMatrixInv = shapesLayer.getScreenCTM().inverse();
        children.forEach(child => {
            if (child.classList.contains('vertex-data')) return;
            const childMatrix = child.getScreenCTM();
            const finalMatrix = layerMatrixInv.multiply(childMatrix);
            const fix = n => parseFloat(n.toFixed(6));
            const matrixStr = `matrix(${fix(finalMatrix.a)}, ${fix(finalMatrix.b)}, ${fix(finalMatrix.c)}, ${fix(finalMatrix.d)}, ${fix(finalMatrix.e)}, ${fix(finalMatrix.f)})`;
            child.setAttribute('transform', matrixStr);
            if (!child.id || child.id.startsWith('lib-')) {
                child.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            }
            child.classList.remove('selected');
            shapesLayer.appendChild(child);
            newElementsToSelect.push(child);
        });
        group.remove();
    });
    deselectAll();
    newElementsToSelect.forEach(el => addToSelection(el));
    saveState();
    statusText.innerText = "已解散群組，物件位置已保留";
}
function openTextModal(mode, existingEl = null, x = 0, y = 0) {
    if (mode === 'math') {
        openMathModalV2(existingEl, x, y);
        return;
    }
    modalMode = mode;
    const modal = document.getElementById('text-modal');
    const input = document.getElementById('text-input-area');
    const sizeSel = document.getElementById('font-size-select');
    const colorSel = document.getElementById('text-color-select');
    modal.style.display = 'flex';
    input.focus();
    if (existingEl) {
        isEditingText = true;
        editingTextElement = existingEl;
        const rawContent = existingEl.getAttribute('data-content');
        if (rawContent) {
            input.value = rawContent;
        } else {
            let innerDiv = existingEl.querySelector('.math-content') || existingEl.querySelector('div');
            if (innerDiv) {
                input.value = innerDiv.innerHTML.replace(/<br\s*\/?>/gi, '\n');
            } else {
                input.value = existingEl.textContent;
            }
        }
        let fSize = existingEl.getAttribute('font-size') || existingEl.getAttribute('data-font-size') || existingEl.style.fontSize || "24";
        sizeSel.value = parseInt(fSize);
        let currentColor = existingEl.getAttribute('fill') || existingEl.style.fill;
        if (!currentColor) {
            let innerDiv = existingEl.querySelector('.math-content');
            if (innerDiv) currentColor = innerDiv.style.color;
        }
        colorSel.value = currentColor || "#000000";
    } else {
        isEditingText = false;
        editingTextElement = null;
        newTextPos = { x, y };
        input.value = "";
        let defaultSize = "24";
        for (let i = 0; i < sizeSel.options.length; i++) {
            if (sizeSel.options[i].defaultSelected) {
                defaultSize = sizeSel.options[i].value;
                break;
            }
        }
        sizeSel.value = defaultSize;
        colorSel.value = "#000000";
    }
}
function closeTextModal() {
    textModal.style.display = 'none';
    isEditingText = false;
    editingTextElement = null;
}
function confirmTextEntry() {
    let content = "";
    let size = "24";
    let color = "#000000";
    const textInput = document.getElementById('text-input-area');
    const sizeSel = document.getElementById('font-size-select');
    const colorSel = document.getElementById('text-color-select');
    if (textInput) {
        content = textInput.value;
        size = sizeSel ? sizeSel.value : "24";
        color = colorSel ? colorSel.value : "#000000";
    }
    if (!content && !pendingLabelInfo && !pendingDimensionInfo) {
        closeTextModal();
        return;
    }
    const displayHTML = content.replace(/\n/g, '<br>');
    if (typeof pendingDimensionInfo !== 'undefined' && pendingDimensionInfo) {
        finalizeDimensionMark(content);
        pendingDimensionInfo = null;
        closeTextModal();
        return;
    }
    if (pendingLabelInfo) {
        const { x, y, rotation, fontSize, owner, type } = pendingLabelInfo;
        const fo = document.createElementNS(ns, "foreignObject");
        fo.setAttribute("x", x);
        fo.setAttribute("y", y);
        fo.setAttribute("width", "100");
        fo.setAttribute("height", "50");
        fo.setAttribute("class", "shape math-obj");
        fo.setAttribute("data-tool", "text");
        fo.setAttribute("data-is-label", "true");
        if (owner) fo.setAttribute("data-owner", owner.id);
        if (type) fo.setAttribute("data-label-type", type);
        fo.setAttribute("data-content", content);
        fo.setAttribute("data-font-size", fontSize || size);
        fo.setAttribute("fill", color);
        const div = document.createElement("div");
        div.className = "math-content";
        div.style.fontSize = (fontSize || size) + "px";
        div.style.color = color;
        div.style.display = "inline-block";
        div.style.whiteSpace = "nowrap";
        div.style.textAlign = "center";
        div.innerHTML = displayHTML;
        fo.appendChild(div);
        shapesLayer.appendChild(fo);
        setTimeout(() => {
            const w = div.offsetWidth;
            const h = div.offsetHeight;
            fo.setAttribute("width", w + 20);
            fo.setAttribute("height", h + 20);
            fo.setAttribute("x", x - w / 2);
            fo.setAttribute("y", y - h / 2);
            if (rotation) {
                fo.setAttribute("transform", `rotate(${rotation}, ${x}, ${y})`);
            }
            saveState();
        }, 50);
        if (typeof isContinuousMarking !== 'undefined' && isContinuousMarking) {
            constructionStep = 0;
            tempConstructionSource = null;
            deselectAll();
            if (typeof statusText !== 'undefined') statusText.innerText = "已標註，請繼續 (連續模式...按右鍵結束)";
        } else {
            setMode('select');
            addToSelection(fo);
        }
        pendingLabelInfo = null;
        closeTextModal();
        return;
    }
    if (isEditingText && editingTextElement) {
        if (editingTextElement.tagName === 'text') {
            editingTextElement.textContent = content;
            editingTextElement.setAttribute('font-size', size);
            editingTextElement.style.fontSize = size + "px";
            editingTextElement.setAttribute('fill', color);
            editingTextElement.style.fill = color;
            editingTextElement.setAttribute('data-content', content);
            editingTextElement.setAttribute('data-font-size', size);
            saveState();
            setMode('select');
            addToSelection(editingTextElement);
            closeTextModal();
            return;
        }
        const fo = editingTextElement;
        fo.setAttribute('data-content', content);
        fo.setAttribute('data-font-size', size);
        fo.setAttribute('fill', color);
        let div = fo.querySelector('.math-content') || fo.querySelector('div');
        if (!div) {
            div = document.createElement("div");
            div.className = "math-content";
            fo.appendChild(div);
        }
        div.style.fontSize = size + "px";
        div.style.color = color;
        div.innerHTML = displayHTML;
        setTimeout(() => {
            const w = div.offsetWidth;
            const h = div.offsetHeight;
            fo.setAttribute("width", w + 20);
            fo.setAttribute("height", h + 20);
            saveState();
        }, 10);
        setMode('select');
        addToSelection(fo);
    } else {
        const fo = document.createElementNS(ns, "foreignObject");
        const startX = newTextPos.x || 100;
        const startY = newTextPos.y || 100;
        fo.setAttribute("transform", `translate(${startX}, ${startY})`);
        fo.setAttribute("x", -50);
        fo.setAttribute("y", -25);
        fo.setAttribute("width", "100");
        fo.setAttribute("height", "50");
        fo.setAttribute("class", "shape math-obj");
        fo.setAttribute("data-tool", "text");
        fo.setAttribute("data-content", content);
        fo.setAttribute("data-font-size", size);
        fo.setAttribute("fill", color);
        const div = document.createElement("div");
        div.className = "math-content";
        div.style.fontSize = size + "px";
        div.style.color = color;
        div.style.display = "inline-block";
        div.style.whiteSpace = "nowrap";
        div.innerHTML = displayHTML;
        fo.appendChild(div);
        shapesLayer.appendChild(fo);
        setTimeout(() => {
            const w = div.offsetWidth;
            const h = div.offsetHeight;
            const finalWidth = w + 20;
            const finalHeight = h + 20;
            fo.setAttribute("width", finalWidth);
            fo.setAttribute("height", finalHeight);
            fo.setAttribute("x", -finalWidth / 2);
            fo.setAttribute("y", -finalHeight / 2);
            saveState();
            setMode('select');
            addToSelection(fo);
        }, 50);
    }
    closeTextModal();
}
function openMathModalV2(existingEl, x, y) {
    const modal = document.getElementById('math-modal-v2');
    const input = document.getElementById('math-v2-input');
    const sizeSel = document.getElementById('math-v2-size');
    const colorSel = document.getElementById('math-v2-color');
    initMathV2Assets();
    modal.style.display = 'flex';
    modalMode = 'math';
    if (existingEl) {
        isEditingText = true;
        editingTextElement = existingEl;
        let raw = existingEl.getAttribute('data-content') || "";
        input.value = raw.replace(/`/g, '');
        let fSize = existingEl.getAttribute('data-font-size') || "24";
        sizeSel.value = parseInt(fSize);
        let innerDiv = existingEl.querySelector('.math-content');
        let fColor = innerDiv ? innerDiv.style.color : "#000000";
        colorSel.value = rgbToHex(fColor) || fColor;
    } else {
        isEditingText = false;
        editingTextElement = null;
        newTextPos = { x, y };
        input.value = "";
        let defaultSize = "24";
        for (let i = 0; i < sizeSel.options.length; i++) {
            if (sizeSel.options[i].defaultSelected) {
                defaultSize = sizeSel.options[i].value;
                break;
            }
        }
        sizeSel.value = defaultSize;
        colorSel.value = "#000000";
    }
    previewMathV2();
    setTimeout(() => input.focus(), 100);
}
function closeMathModal() {
    document.getElementById('math-modal-v2').style.display = 'none';
}
function confirmMathEntryV2() {
    const input = document.getElementById('math-v2-input');
    const size = document.getElementById('math-v2-size').value;
    const color = document.getElementById('math-v2-color').value;
    let content = input.value;
    if (!content.trim()) {
        closeMathModal();
        return;
    }
    if (pendingLabelInfo) {
        let fo = createMathShape(content, pendingLabelInfo.x, pendingLabelInfo.y, color, pendingLabelInfo.fontSize || size);
        fo.setAttribute("data-is-label", "true");
        if (pendingLabelInfo.owner) fo.setAttribute("data-owner", pendingLabelInfo.owner.id);
        fo.setAttribute("data-font-size", pendingLabelInfo.fontSize || size);
        fo.querySelector('.math-content').style.fontSize = (pendingLabelInfo.fontSize || size) + "px";
        if (pendingLabelInfo.rotation) fo.setAttribute("transform", `rotate(${pendingLabelInfo.rotation}, ${pendingLabelInfo.x}, ${pendingLabelInfo.y})`);
        setTimeout(() => {
            const div = fo.querySelector('.math-content');
            if (div) {
                const w = div.offsetWidth;
                const h = div.offsetHeight;
                fo.setAttribute("x", pendingLabelInfo.x - w / 2);
                fo.setAttribute("y", pendingLabelInfo.y - h / 2);
            }
        }, 100);
        pendingLabelInfo = null;
        closeMathModal();
        return;
    }
    const rawLines = content.split('\n');
    const displayHTML = rawLines.map(line => {
        return line.trim() ? '`' + line + '`' : '';
    }).join('<br>');
    if (isEditingText && editingTextElement) {
        const fo = editingTextElement;
        fo.setAttribute('data-content', content);
        fo.setAttribute('data-font-size', size);
        let div = fo.querySelector('.math-content');
        if (!div) {
            div = document.createElement("div");
            div.className = "math-content";
            fo.appendChild(div);
        }
        div.style.fontSize = size + "px";
        div.style.color = color;
        div.innerHTML = displayHTML;
        if (window.MathJax) {
            MathJax.typesetPromise([div]).then(() => {
                const w = div.offsetWidth;
                const h = div.offsetHeight;
                fo.setAttribute("width", w + 20);
                fo.setAttribute("height", h + 20);
                saveState();
            });
        }
        setMode('select');
        addToSelection(fo);
    } else {
        const newObj = createMathShape(content, newTextPos.x, newTextPos.y, color, size);
        const div = newObj.querySelector('.math-content');
        if (div) {
            div.innerHTML = displayHTML;
            div.style.fontSize = size + "px";
            if (window.MathJax) {
                MathJax.typesetPromise([div]).then(() => {
                    const w = div.offsetWidth;
                    const h = div.offsetHeight;
                    newObj.setAttribute("width", w + 20);
                    newObj.setAttribute("height", h + 20);
                });
            }
        }
        setMode('select');
        addToSelection(newObj);
        setTimeout(() => {
            if (selectedElements.includes(newObj)) drawHandles(newObj);
        }, 150);
    }
    closeMathModal();
}
function previewMathV2() {
    const input = document.getElementById('math-v2-input');
    const output = document.getElementById('math-v2-output');
    const size = document.getElementById('math-v2-size').value;
    const color = document.getElementById('math-v2-color').value;
    if (!input.value.trim()) {
        output.innerHTML = '';
        return;
    }
    output.style.fontSize = size + 'px';
    output.style.color = color;
    const rawLines = input.value.split('\n');
    const displayHTML = rawLines.map(line => {
        return line.trim() ? '`' + line + '`' : '';
    }).join('<br>');
    output.innerHTML = displayHTML;
    if (window.MathJax) {
        MathJax.typesetPromise([output]).catch(err => {});
    }
}
function initMathV2Assets() {
    if (isMathV2Init) return;
    const quickFormulas = [{
        label: '公式解',
        code: 'x = (-b +- sqrt(b^2-4ac))/(2a)'
    }, {
        label: '二元聯立',
        code: '{(3x + 2y = 12), (x - y = 4):}'
    }];
    const quickScroll = document.getElementById('quick-formula-scroll');
    if (quickScroll) {
        quickScroll.innerHTML = '';
        quickFormulas.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'quick-btn';
            btn.title = item.label + "\n代碼: " + item.code;
            btn.innerHTML = '`' + item.code + '`';
            btn.onclick = () => {
                const input = document.getElementById('math-v2-input');
                if (input.value.trim() === "") {
                    input.value = item.code;
                } else {
                    input.value += "\n" + item.code;
                }
                previewMathV2();
                input.focus();
            };
            quickScroll.appendChild(btn);
        });
        if (window.MathJax) {
            MathJax.typesetPromise([quickScroll]).catch(err => {});
        }
    }
    const examples = [
        { l: '分數', c: 'a/b' }, { l: '根號', c: 'sqrt(x)' }, { l: '次方', c: 'x^2' }, { l: '下標', c: 'x_1' },
        { l: '總和', c: 'sum_(i=1)^n' }, { l: '積分', c: 'int f(x)dx' }, { l: '極限', c: 'lim_(x->0)' }, { l: '矩陣', c: '[(1,2),(3,4)]' },
        { l: '向量', c: 'vec(v)' }, { l: '希臘α', c: 'alpha' }, { l: '希臘β', c: 'beta' }, { l: '希臘θ', c: 'theta' },
        { l: '大於等於', c: '>=' }, { l: '不等於', c: '!=' }, { l: '圓周率', c: 'pi' }, { l: '因為', c: 'because' },
        { l: '所以', c: 'therefore' }, { l: '三角形', c: 'triangle' }, { l: '角度', c: 'angle' }, { l: '垂直', c: 'bot' },
        { l: '平行', c: '//' }
    ];
    const exContainer = document.getElementById('math-v2-examples');
    if (exContainer) {
        exContainer.innerHTML = '';
        examples.forEach(ex => {
            const btn = document.createElement('div');
            btn.className = 'math-example-btn';
            btn.innerText = ex.l;
            btn.title = ex.c;
            btn.onclick = () => insertToMathV2(ex.c);
            exContainer.appendChild(btn);
        });
    }
    const syms = [
        '°', '℃', 'θ', 'π', 'α', 'β', 'Δ', '∠',
        '⊥', '∥', '△', '◯', '≈', '≠', '±', '×',
        '÷', '√', '∞', 'Ω', 'μ', 'λ', 'φ', '→',
        '←', '↑', '↓', '²', '³', '½', '∴', '∵'
    ];
    const symContainer = document.getElementById('math-v2-symbols');
    if (symContainer) {
        symContainer.innerHTML = '';
        syms.forEach(s => {
            const btn = document.createElement('div');
            btn.className = 'math-symbol-btn';
            btn.innerText = s;
            btn.onclick = () => insertToMathV2(s);
            symContainer.appendChild(btn);
        });
    }
    isMathV2Init = true;
}
function insertToMathV2(txt) {
    const input = document.getElementById('math-v2-input');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const val = input.value;
    input.value = val.substring(0, start) + txt + val.substring(end);
    input.selectionStart = input.selectionEnd = start + txt.length;
    input.focus();
    previewMathV2();
}
function getLineLineIntersection(p1, p2, p3, p4) {
    const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (d === 0) return null;
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;
    if (t >= -0.001 && t <= 1.001 && u >= -0.001 && u <= 1.001) {
        return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
    }
    return null;
}
function getLineCircleIntersections(p1, p2, center, r) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - center.x;
    const fy = p1.y - center.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - r * r;
    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    const res = [];
    if (t1 >= -0.001 && t1 <= 1.001) res.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
    if (t2 >= -0.001 && t2 <= 1.001) res.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
    return res;
}
function getCircleCircleIntersections(c1, r1, c2, r2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const x2 = c1.x + a * dx / d;
    const y2 = c1.y + a * dy / d;
    return [
        { x: x2 + h * dy / d, y: y2 - h * dx / d },
        { x: x2 - h * dy / d, y: y2 + h * dx / d }
    ];
}
function isPointInAngleRange(pt, center, startAngle, endAngle) {
    let angle = Math.atan2(-(pt.y - center.y), pt.x - center.x);
    if (angle < 0) angle += 2 * Math.PI;
    let s = startAngle % (2 * Math.PI);
    let e = endAngle % (2 * Math.PI);
    if (s < 0) s += 2 * Math.PI;
    if (e < 0) e += 2 * Math.PI;
    if (s < e) {
        return angle >= s - 0.01 && angle <= e + 0.01;
    } else {
        return angle >= s - 0.01 || angle <= e + 0.01;
    }
}
function extractGeometry(shape) {
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    const tagName = shape.tagName.toLowerCase();
    if (['solid', 'text', 'math', 'mark', 'function'].includes(tool)) return null;
    if (['solid-cube', 'solid-cylinder', 'solid-cone'].includes(subTool)) return null;
    if (shape.style.display === 'none') return null;
    const m = shape.getCTM();
    const toGlobal = (x, y) => ({ x: x * m.a + y * m.c + m.e, y: x * m.b + y * m.d + m.f });
    let segments = [];
    let circles = [];
    if (tagName === 'circle' || (tagName === 'ellipse' && Math.abs(shape.getAttribute('rx') - shape.getAttribute('ry')) < 0.1)) {
        const cx = parseFloat(shape.getAttribute('cx')) || 0;
        const cy = parseFloat(shape.getAttribute('cy')) || 0;
        const r = parseFloat(shape.getAttribute('r') || shape.getAttribute('rx'));
        circles.push({ center: toGlobal(cx, cy), r: r * m.a });
    }
    else if (['sector', 'arc', 'arch', 'circular_segment'].includes(subTool)) {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const startA = parseFloat(shape.getAttribute('data-start-angle'));
        const endA = parseFloat(shape.getAttribute('data-end-angle'));
        if (!isNaN(cx)) {
            const center = toGlobal(cx, cy);
            const radius = r * m.a;
            circles.push({ center, r: radius, startAngle: startA, endAngle: endA, isArc: true });
            const pStart = {
                x: center.x + radius * Math.cos(startA),
                y: center.y - radius * Math.sin(startA)
            };
            const pEnd = {
                x: center.x + radius * Math.cos(endA),
                y: center.y - radius * Math.sin(endA)
            };
            if (subTool === 'sector') {
                segments.push({ p1: center, p2: pStart });
                segments.push({ p1: center, p2: pEnd });
            } else if (subTool === 'arch' || subTool === 'circular_segment') {
                segments.push({ p1: pStart, p2: pEnd });
            }
        }
    }
    else if (tool === 'line' || tagName === 'line') {
        const l = (tagName === 'g') ? (shape.querySelector('.visible-line') || shape.querySelector('line')) : shape;
        if (l) {
            const p1 = toGlobal(+l.getAttribute('x1'), +l.getAttribute('y1'));
            const p2 = toGlobal(+l.getAttribute('x2'), +l.getAttribute('y2'));
            segments.push({ p1, p2 });
        }
    }
    else if (tagName === 'polygon' || tagName === 'polyline' || tagName === 'rect') {
        let pts = [];
        if (tagName === 'rect') {
            const x = parseFloat(shape.getAttribute('x'));
            const y = parseFloat(shape.getAttribute('y'));
            const w = parseFloat(shape.getAttribute('width'));
            const h = parseFloat(shape.getAttribute('height'));
            pts = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
        } else {
            const pointsStr = shape.getAttribute('points');
            if (pointsStr) {
                pts = pointsStr.trim().split(/\s+|,/).filter(v => v !== '').reduce((acc, val, i, arr) => {
                    if (i % 2 === 0) acc.push({ x: +val, y: +arr[i + 1] });
                    return acc;
                }, []);
            }
        }
        if (pts.length > 1) {
            const globalPts = pts.map(p => toGlobal(p.x, p.y));
            for (let i = 0; i < globalPts.length - 1; i++) {
                segments.push({ p1: globalPts[i], p2: globalPts[i + 1] });
            }
            if (tagName !== 'polyline') {
                segments.push({ p1: globalPts[globalPts.length - 1], p2: globalPts[0] });
            }
        }
    }
    else if (tagName === 'g') {
        Array.from(shape.children).forEach(child => {
            if (child.classList.contains('shape') || ['circle', 'path', 'line', 'polygon', 'rect'].includes(child.tagName.toLowerCase())) {
                const childGeo = extractGeometry(child);
                if (childGeo) {
                    segments.push(...childGeo.segments);
                    circles.push(...childGeo.circles);
                }
            }
        });
    }
    return { segments, circles };
}
function findIntersectionSnap(mouseX, mouseY) {
    const shapes = document.querySelectorAll('#shapes-layer .shape');
    let allSegments = [];
    let allCircles = [];
    shapes.forEach(shape => {
        if (shape.parentNode.id !== 'shapes-layer' && shape.parentNode.getAttribute('data-tool') === 'group') return;
        const geo = extractGeometry(shape);
        if (geo) {
            allSegments.push(...geo.segments);
            allCircles.push(...geo.circles);
        }
    });
    let intersections = [];
    for (let i = 0; i < allSegments.length; i++) {
        for (let j = i + 1; j < allSegments.length; j++) {
            const pt = getLineLineIntersection(allSegments[i].p1, allSegments[i].p2, allSegments[j].p1, allSegments[j].p2);
            if (pt) intersections.push(pt);
        }
    }
    for (let seg of allSegments) {
        for (let circ of allCircles) {
            const pts = getLineCircleIntersections(seg.p1, seg.p2, circ.center, circ.r);
            pts.forEach(pt => {
                if (!circ.isArc || isPointInAngleRange(pt, circ.center, circ.startAngle, circ.endAngle)) {
                    intersections.push(pt);
                }
            });
        }
    }
    for (let i = 0; i < allCircles.length; i++) {
        for (let j = i + 1; j < allCircles.length; j++) {
            const pts = getCircleCircleIntersections(allCircles[i].center, allCircles[i].r, allCircles[j].center, allCircles[j].r);
            pts.forEach(pt => {
                const inRange1 = !allCircles[i].isArc || isPointInAngleRange(pt, allCircles[i].center, allCircles[i].startAngle, allCircles[i].endAngle);
                const inRange2 = !allCircles[j].isArc || isPointInAngleRange(pt, allCircles[j].center, allCircles[j].startAngle, allCircles[j].endAngle);
                if (inRange1 && inRange2) {
                    intersections.push(pt);
                }
            });
        }
    }
    let closestPoint = null;
    let minDist = 15;
    intersections.forEach(pt => {
        const d = Math.hypot(pt.x - mouseX, pt.y - mouseY);
        if (d < minDist) {
            minDist = d;
            closestPoint = pt;
        }
    });
    return closestPoint;
}