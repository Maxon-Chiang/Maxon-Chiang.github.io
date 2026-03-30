const commonSymbols =[
    '°', '℃', 'θ', 'π', 'α', 'β', 'Δ', '∠', '⊥', '∥',
    '△', '◯', '≈', '≅', '≠', '±', '×', '÷', '∞', 'Ω',
    'μ', 'λ', 'φ', '→', '←', '↑', '↓', '²', '³', '½',
    '∵', '∴', '≤', '≥', '∩', '∪', '⊂', '⊃', '∈', '∅'
];

window.getDefaultTextSize = function() {
    // 優先：讀取使用者在右鍵選單「文字預設視窗設定」裡儲存的字體大小
    const cachedDefaults = localStorage.getItem('math_editor_param_text_defaults');
    if (cachedDefaults) {
        try {
            const parsed = JSON.parse(cachedDefaults);
            if (parsed.p_fs !== undefined && parsed.p_fs !== "") return parsed.p_fs.toString();
        } catch(e){}
    }
    // 次要：讀取上次文字編輯器操作留下的字體大小
    if (window.lastTextConfig && window.lastTextConfig.size) {
        return window.lastTextConfig.size.toString();
    }
    return "20"; // 預設值
};

function showAlert(msg, title = "提示", callback = null) {
    const modal = document.getElementById('sys-modal');
    const titleEl = document.getElementById('sys-modal-title');
    const msgEl = document.getElementById('sys-modal-msg');
    const btnOk = document.getElementById('sys-btn-ok');
    const btnCancel = document.getElementById('sys-btn-cancel');

    titleEl.innerText = title;
    msgEl.innerHTML = msg.replace(/\n/g, '<br>'); // 支援換行
    
    // 設定按鈕
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

    // 設定按鈕
    btnCancel.style.display = 'inline-block';
    
    // 綁定事件
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
        let sel = document.selection.createRange();
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
    if (tool === 'group' && subTool === 'circle-smart') {
        const line = shape.querySelector('.circle-line');
        if (line) {
            // 考慮 Transform 矩陣
            const m = shape.getCTM();
            const p1 = { x: +line.getAttribute('x1'), y: +line.getAttribute('y1') };
            const p2 = { x: +line.getAttribute('x2'), y: +line.getAttribute('y2') };
            return[
                { x: p1.x * m.a + p1.y * m.c + m.e, y: p1.x * m.b + p1.y * m.d + m.f },
                { x: p2.x * m.a + p2.y * m.c + m.e, y: p2.x * m.b + p2.y * m.d + m.f }
            ];
        }
    }
    if (tool === 'group' && ['central-angle', 'inscribed-angle', 'tangent-chord-angle'].includes(subTool)) {
        const dataNodes = shape.querySelectorAll('.vertex-data');
        if (subTool === 'tangent-chord-angle' && dataNodes.length >= 4) {
			const A = {x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy')};
			const P = {x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy')};
            const T1 = {x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy')};
            const T2 = {x: +dataNodes[3].getAttribute('cx'), y: +dataNodes[3].getAttribute('cy')};
            
            return [A, P, T1, T2];
        }
        // 1. 圓心角 (Central Angle): 數據存序 [Center, P1, P2] -> 幾何順序 [P1, Center, P2]
        if (subTool === 'central-angle' && dataNodes.length >= 3) {
            return [
                {x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy')},
                {x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy')},
                {x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy')}
            ];
        }
        // 2. 圓周角 (Inscribed Angle): 數據存序 [A, V, B] -> 幾何順序 [A, V, B]
        if (subTool === 'inscribed-angle' && dataNodes.length >= 3) {
            return [
                {x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy')},
                {x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy')},
                {x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy')}
            ];
        }
        // 3. 弦切角 (Tangent Chord): 數據存序 [A, P] -> 需計算切線方向 T -> 幾何順序 [A, P, T]
        if (subTool === 'tangent-chord-angle' && dataNodes.length >= 4) {
			const A = {x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy')};
			const P = {x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy')};
			
			const circleId = shape.getAttribute('data-owner-circle-id');
			const circle = document.getElementById(circleId);
			if(circle) {
				const mC = circle.getCTM();
				const mG = shape.getCTM();
				const mCtoG = mG.inverse().multiply(mC);
                
                // 找出區域座標中的圓心
				const L_Cx = (+circle.getAttribute('cx') || 0) * mCtoG.a + (+circle.getAttribute('cy') || 0) * mCtoG.c + mCtoG.e;
				const L_Cy = (+circle.getAttribute('cx') || 0) * mCtoG.b + (+circle.getAttribute('cy') || 0) * mCtoG.d + mCtoG.f;
				
				const dx = P.x - L_Cx;
				const dy = P.y - L_Cy;
				
                // 切線與內積判斷 (與重繪邏輯同步)
				const t1 = { x: -dy, y: dx };
				const t2 = { x: dy, y: -dx };
                const vChord = { x: A.x - P.x, y: A.y - P.y };
                const chosenT = (vChord.x * t1.x + vChord.y * t1.y) > 0 ? t1 : t2;

				const T = { x: P.x + chosenT.x, y: P.y + chosenT.y }; 
				return [A, P, T]; // 這樣標註函式就能準確畫出銳角的弧線
			}
			return [A, P];
        }
        if (dataNodes.length > 0) {
            // 直接回傳數據點的座標 (這些座標已經是相對於群組原點的，或者是絕對座標)
            // 根據我們在 moveShape 的邏輯，我們是直接修改 cx/cy，所以這裡直接讀取即可
            // 這裡要注意順序：dataNodes 的順序通常是固定的
            return Array.from(dataNodes).map(node => ({
                x: parseFloat(node.getAttribute('cx')),
                y: parseFloat(node.getAttribute('cy'))
            }));
        }        		
    }
	if (['sector', 'arc', 'arch'].includes(subTool)) {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const sA = parseFloat(shape.getAttribute('data-start-angle'));
        const eA = parseFloat(shape.getAttribute('data-end-angle'));
        
        const pStart = {x: cx + r * Math.cos(sA), y: cy - r * Math.sin(sA)};
        const pEnd = {x: cx + r * Math.cos(eA), y: cy - r * Math.sin(eA)};

        if (subTool === 'sector') {
            // 扇形回傳 [起點, 圓心, 終點]
            return [pEnd, {x: cx, y: cy}, pStart];
        } else {
            // 弧與弓形只回傳 [起點, 終點]
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

function openNumberInputModal(title, defaultValue, callback) {
    const modal = document.getElementById('number-input-modal');
    
    // 【核心修正】每次開啟時，先移除定位類別，讓它回歸 CSS 預設的 Flexbox 畫面置中
    modal.classList.remove('param-positioned-modal');

    const titleEl = document.getElementById('number-modal-title');
    const input = document.getElementById('number-modal-input');
    titleEl.innerText = title;
    input.value = defaultValue;
    numberInputCallback = callback;
    modal.style.display = 'flex'; // 使用 flex 才能觸發置中
    
	if ((typeof defaultValue === 'string' && isNaN(parseFloat(defaultValue))) || title.includes("名稱") || title.includes("密碼")) {
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
    const modal = document.getElementById('number-input-modal');
    modal.style.display = 'none';
    // 關閉時也順便清理，確保下次乾淨
    modal.classList.remove('param-positioned-modal');
    numberInputCallback = null;
}

function confirmNumberInput() {
    const val = document.getElementById('number-modal-input').value;
    if (numberInputCallback) {
        numberInputCallback(val);
    }
    closeNumberInputModal();
}

function openExclusiveOptionsModal(title, options, callback) {
    const old = document.getElementById('exclusive-options-modal');
    if (old) old.remove();

    // 1. 初始化選取狀態 (預設選中第一個 checked 為 true 的項目，若無則選第0個)
    let currentSelectedIndex = options.findIndex(o => o.checked);
    if (currentSelectedIndex === -1) currentSelectedIndex = 0;

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'exclusive-options-modal';
    // 保持 z-index 6000 以蓋過圖庫視窗
    modalOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:6000; display:flex; justify-content:center; align-items:center;";
    
    // 2. 產生選項 HTML (注意：onclick 改為呼叫 updateSelection)
    let buttonsHtml = '';
    options.forEach((opt, i) => {
        // 判斷是否為當前選中
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
            <!-- 3. 底部按鈕區：取消 & 確定 -->
            <div style="padding:12px 20px; background:#f8f9fa; text-align:right; border-top:1px solid #f0f0f0; display:flex; justify-content:flex-end; gap:10px;">
                <button onclick="window.handleExclusiveCancel()" 
						style="padding:8px 15px; background:#eee; border:none; border-radius:4px; color:#555; cursor:pointer; font-size:14px;">取消</button>
                <button onclick="window.handleExclusiveConfirm()" 
                        style="padding:8px 20px; background:#2980b9; border:none; border-radius:4px; color:white; cursor:pointer; font-size:14px; font-weight:bold;">確定</button>
            </div>
        </div>
    `;

    // 4. 定義全域更新函式 (點擊選項時只更新 UI)
    window.handleExclusiveUpdate = (idx) => {
        currentSelectedIndex = idx;
        // 更新所有選項的樣式
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

    // 5. 定義全域確認函式 (點擊確定才執行 Callback)
    window.handleExclusiveConfirm = () => {
        // 產生 boolean 陣列回傳 [false, true, false...]
        const results = options.map((_, i) => i === currentSelectedIndex);
        document.getElementById('exclusive-options-modal').remove();
        
        // 清除全域暫存函式
        delete window.handleExclusiveUpdate;
        delete window.handleExclusiveConfirm;
        
        callback(results);
    };
    window.handleExclusiveCancel = () => {
        document.getElementById('exclusive-options-modal').remove();
        delete window.handleExclusiveUpdate;
        delete window.handleExclusiveConfirm;
        delete window.handleExclusiveCancel;
        callback(null); // 傳回 null 代表使用者取消
    };
    document.body.appendChild(modalOverlay);
}

function addToSelection(el) {
    if (!selectedElements.includes(el)) {
        selectedElements.push(el);
        el.classList.add('selected');
    }
    
    // 【新增】更新旋轉度數顯示
    const rotationDisplay = document.getElementById('rotation-display');
    if (selectedElements.length === 1 && rotationDisplay) {
        const angle = getTrueRotation(el);
        const normalized = Math.round((angle % 360 + 360) % 360);
        rotationDisplay.innerText = `${normalized}°`;
    } else if (rotationDisplay) {
        rotationDisplay.innerText = `---°`; // 多選時顯示破折號
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

    // 【新增】重置旋轉度數顯示
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

    // --- 新增：虛擬鍵盤的立體積木工具切換 ---
    const vkBlocks = document.getElementById('vk-blocks-tools');
    if (vkBlocks) {
        if (selectedElements.length === 1 && selectedElements[0].getAttribute('data-tool') === 'blocks') {
            vkBlocks.style.display = 'grid';
        } else {
            vkBlocks.style.display = 'none';
        }
    }
}


function clearCanvas() {
    showConfirm("確定清空畫布？\n(這會清除所有圖形，保留背景設定)", () => {
        // 【核心修正 4/4】：先清除所有現存的鎖頭圖示
        document.querySelectorAll('.geom-lock-icon').forEach(el => el.remove());

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

/* --- ui.js (修復版 pasteSelection：支援群組、立體圖與所有形狀) --- */

function pasteSelection(atMouse = false) {
    if (clipboard.length === 0) return;
    
    deselectAll();
    const idMap = {};
    const newNodes = [];

    // --- 1. 定義：遞迴計算任意節點的邊界框 (Bounding Box) ---
    // 回傳格式: { minX, minY, maxX, maxY, valid }
    const getRecursiveBBox = (node) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let valid = false;

        const tag = node.tagName.toLowerCase();
        const tool = node.getAttribute('data-tool');
        const display = node.style.display;
        if (display === 'none') return { valid: false };

        // 解析 Transform (位移量)
        let tx = 0, ty = 0;
        const transform = node.getAttribute('transform') || "";
        
        // 簡易解析 matrix 和 translate
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

        // 輔助：更新邊界
        const addPoint = (x, y) => {
            // 將自身的 transform 加到座標上
            const gx = x + tx;
            const gy = y + ty;
            if (gx < minX) minX = gx;
            if (gx > maxX) maxX = gx;
            if (gy < minY) minY = gy;
            if (gy > maxY) maxY = gy;
            valid = true;
        };

        // 針對不同標籤讀取座標
        if (tag === 'g') {
            // 對於群組，遞迴檢查所有子元素
            const children = Array.from(node.children);
            children.forEach(child => {
                // 忽略非圖形元素 (defs, style, etc)
                if(child.tagName === 'defs' || child.tagName === 'style') return;
                
                const childBox = getRecursiveBBox(child);
                if (childBox.valid) {
                    // 子元素的邊界已經是包含其自身 transform 的結果
                    // 但我們需要再加上父層(當前 node) 的 transform
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
                if (!isNaN(pts[i]) && !isNaN(pts[i+1])) {
                    addPoint(pts[i], pts[i+1]);
                }
            }
        } 
        else if (tag === 'text') {
            const x = parseFloat(node.getAttribute('x') || 0);
            const y = parseFloat(node.getAttribute('y') || 0);
            // 文字大小難以精確估算，這裡簡單假設一個範圍
            // 更好的做法是讀取 font-size
            const fs = parseFloat(node.getAttribute('font-size') || 12);
            const len = (node.textContent || "").length;
            addPoint(x - (len*fs)/4, y - fs); // 粗略估計左上
            addPoint(x + (len*fs)/4, y + fs/2); // 粗略估計右下
        }
        else if (tag === 'path') {
            // 嘗試讀取 data-center (圓餅圖/扇形/弧線特有)
            if (node.hasAttribute('data-center-x')) {
                const dcx = parseFloat(node.getAttribute('data-center-x'));
                const dcy = parseFloat(node.getAttribute('data-center-y'));
                // 這裡假設半徑存在，擴大邊界
                const dr = parseFloat(node.getAttribute('data-radius') || 0);
                addPoint(dcx - dr, dcy - dr);
                addPoint(dcx + dr, dcy + dr);
            } else {
                // 嘗試解析 d 屬性中的所有座標 (M, L, C...)
                // 這是一個簡化的解析器，抓取所有數字對
                const d = node.getAttribute('d') || "";
                const coords = d.match(/[-0-9.]+/g);
                if (coords && coords.length >= 2) {
                    for(let i=0; i<coords.length; i+=2) {
                        const px = parseFloat(coords[i]);
                        const py = parseFloat(coords[i+1]);
                        if(!isNaN(px) && !isNaN(py)) {
                            addPoint(px, py);
                        }
                    }
                }
            }
        }

        // 若沒有找到有效座標 (例如空的 group)，但有 transform，至少把 transform 原點算進去
        if (!valid && (tx !== 0 || ty !== 0)) {
            // 這是一種保險策略，避免完全沒有座標導致無限大
            // 但如果 group 內真的沒東西，valid 還是 false 比較好
        }

        return { minX, minY, maxX, maxY, valid };
    };

    // --- 2. 計算剪貼簿整體的「幾何中心」 ---
    // 我們要找出所有物件合起來的大邊界框
    let globalMinX = Infinity, globalMinY = Infinity, globalMaxX = -Infinity, globalMaxY = -Infinity;
    let anyValid = false;

    // 【核心修正】不論是否 atMouse，都必須計算群組邊界來找中心點
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

    let dx = 20, dy = 20; // 預設微小偏移

    if (anyValid) {
        // 取群組的絕對中心點
        const groupCenterX = (globalMinX + globalMaxX) / 2;
        const groupCenterY = (globalMinY + globalMaxY) / 2;
        
        // --- 新增：如果有定錨點優先使用定錨點 ---
        if (window.anchorPoint) {
            dx = window.anchorPoint.x - groupCenterX;
            dy = window.anchorPoint.y - groupCenterY;
            window.clearAnchorPoint();
        } else if (atMouse && typeof lastContextPos !== 'undefined' && lastContextPos.x !== 0) {
            dx = lastContextPos.x - groupCenterX;
            dy = lastContextPos.y - groupCenterY;
        } else {
            // 【核心修正】快捷鍵貼上時，對齊到目前可視畫面的正中央
            if (typeof window.getVisibleCanvasCenter === 'function') {
                const center = window.getVisibleCanvasCenter();
                dx = center.x - groupCenterX;
                dy = center.y - groupCenterY;
            }
        }
    }

    // --- 3. 複製並套用位移 ---
    clipboard.forEach(item => {
        const newEl = item.node.cloneNode(true);
        const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        idMap[item.originalId] = newId;
        newEl.id = newId;
        newEl.classList.remove('selected');

        const tagName = newEl.tagName.toLowerCase();
        const tool = newEl.getAttribute('data-tool');

        // 套用位移邏輯
        
        // 條件 A: 必須使用 transform 的物件 
        // Group (包含立體圖、箭頭、標註), Text, Math, Solid, Path
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
                // 如果沒有位移 transform，加在最前面
                newEl.setAttribute('transform', `translate(${dx}, ${dy}) ${currentTransform}`);
            }
        } 
        // 條件 B: 簡單圖形，直接修改座標屬性
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
                            const ny = parseFloat(arr[i+1]) + dy;
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

    // --- 4. 修復 ID 關聯 ---
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

            if (el.classList.contains('geom-lock-icon')) {
                const ownerId = el.getAttribute('data-owner');
                const lockType = el.getAttribute('data-lock-type'); 
                const lockIdx = el.getAttribute('data-lock-index');
                if (ownerId && lockType && lockIdx) {
                    const ownerShape = document.getElementById(ownerId);
                    if (ownerShape) {
                        const attrName = lockType === 'edge' ? 'data-locked-edges' : 'data-locked-angles';
                        let locks = JSON.parse(ownerShape.getAttribute(attrName) || '{}');
                        delete locks[lockIdx];
                        ownerShape.setAttribute(attrName, JSON.stringify(locks));
                        if (typeof window.updateLockVisuals === 'function') window.updateLockVisuals(ownerShape);
                    }
                }
            }
            
            // 【核心修正 3/4】：刪除前先呼叫清理函式
            if (typeof window.clearAllLockVisuals === 'function') {
                window.clearAllLockVisuals(el);
            }

            if (typeof isEditingText !== 'undefined' && isEditingText && 
                typeof editingTextElement !== 'undefined' && editingTextElement === el) {
                closeEditMode();
            }

            const id = el.id;

            if (id) {
                const dependents = document.querySelectorAll(
                    `[data-owner-circle-id="${id}"], ` +
                    `[data-owner-shape="${id}"], ` +
                    `[data-circle-id="${id}"], ` +
                    `[data-owner="${id}"], ` +
                    `[data-owner-angle-shape="${id}"], ` +
                    `[data-tangent-ctrl="${id}"], ` +
                    `[data-c1-id="${id}"], ` +
                    `[data-c2-id="${id}"]`				
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

    // 1. 計算所有選取物件的「水平中心軸」(midX)
    let minX = Infinity, maxX = -Infinity;
    
    selectedElements.forEach(el => {
        // 嘗試取得轉換後的頂點來計算精確邊界
        const pts = getTransformedPoints(el); 
        if (pts.length > 0) {
            pts.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
            });
        } else {
            // 如果無法取得頂點(例如 Math/Text)，使用 BBox 估算
            const bbox = el.getBBox();
            // 簡單估算：取 bbox 的四個角經過 transform 後的位置
            const m = el.getCTM();
            const corners = [
                {x: bbox.x, y: bbox.y},
                {x: bbox.x + bbox.width, y: bbox.y},
                {x: bbox.x + bbox.width, y: bbox.y + bbox.height},
                {x: bbox.x, y: bbox.y + bbox.height}
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

    // 2. 構建「水平鏡像」變換字串
    // 邏輯：(1)將座標系移至中心軸 -> (2)對 X 軸進行翻轉(scale -1,1) -> (3)移回原處
    // 這樣可以保證物件原地翻轉，文字會變成鏡像字
    const mirrorTransform = `translate(${midX}, 0) scale(-1, 1) translate(-${midX}, 0)`;

    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();

        // --- 策略 A: 純幾何點定義的圖形 (線段、多邊形) ---
        // 這些圖形沒有文字內容，直接計算座標鏡像比較乾淨 (避免 stroke 變形)
        if (tagName === 'polygon' || tagName === 'polyline' || tagName === 'line' || tool === 'line' || tool === 'polygon' || tool === 'polyline') {
            
            // 輔助函式：將某個點針對 midX 做水平鏡像
            const reflectPoint = (x, y, matrix) => {
                // 先轉全域
                const gx = x * matrix.a + y * matrix.c + matrix.e;
                const gy = x * matrix.b + y * matrix.d + matrix.f;
                // 鏡像計算
                return { x: 2 * midX - gx, y: gy };
            };

            const m = el.getCTM();

            if (tagName === 'line' || tool === 'line') {
                const lines = (tagName === 'g' || tool === 'group') ? el.querySelectorAll('line') : [el];
                lines.forEach(l => {
                    // 讀取原始屬性
                    const lx1 = +l.getAttribute('x1'); const ly1 = +l.getAttribute('y1');
                    const lx2 = +l.getAttribute('x2'); const ly2 = +l.getAttribute('y2');
                    
                    // 計算鏡像後的全域座標
                    const p1 = reflectPoint(lx1, ly1, m);
                    const p2 = reflectPoint(lx2, ly2, m);
                    
                    // 寫回屬性
                    l.setAttribute('x1', p1.x);
                    l.setAttribute('y1', p1.y);
                    l.setAttribute('x2', p2.x);
                    l.setAttribute('y2', p2.y);
                });
            } else {
                // Polygon / Polyline / Angle
                const visualPts = getTransformedPoints(el);
                const reflectedPts = visualPts.map(p => ({
                    x: 2 * midX - p.x,
                    y: p.y
                }));
                const pointsStr = reflectedPts.map(p => `${p.x},${p.y}`).join(' ');
                el.setAttribute('points', pointsStr);
            }
            
            // 因為座標已經重算為全域鏡像位置，移除舊的變形以免重複作用
            el.removeAttribute('transform');
        } 
        // --- 策略 B: 屬性定義物件 (文字、數學式、圖片、群組、圓、矩形) ---
        // 使用 Transform String 堆疊法
        // 這裡會將 scale(-1, 1) 疊加到物件上，實現真正的「左右鏡像」顯示
        else {
            const currentTransform = el.getAttribute('transform') || '';
            // 拼接變換字串：新變換在左 (先作用)
            el.setAttribute('transform', `${mirrorTransform} ${currentTransform}`);
        }

        // 更新關聯標籤位置 (若有的話)
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
        
        // 1. 取得 shapesLayer 的反矩陣，用於計算相對座標
        const layerMatrixInv = shapesLayer.getScreenCTM().inverse();

        children.forEach(child => {
            // 忽略內部數據點 (隱藏的控制點)
            if (child.classList.contains('vertex-data')) return;

            // 2. 取得子物件在畫布上的「絕對」視覺變換矩陣 (CTM)
            const childMatrix = child.getScreenCTM();
            
            // 3. 計算子物件相對於 shapesLayer 的新變換矩陣
            // 公式: NewTransform = Layer⁻¹ * ChildAbsolute
            const finalMatrix = layerMatrixInv.multiply(childMatrix);

            // 4. 直接將這個最終矩陣設定為子物件的新 transform
            const fix = n => parseFloat(n.toFixed(6));
            const matrixStr = `matrix(${fix(finalMatrix.a)}, ${fix(finalMatrix.b)}, ${fix(finalMatrix.c)}, ${fix(finalMatrix.d)}, ${fix(finalMatrix.e)}, ${fix(finalMatrix.f)})`;
            child.setAttribute('transform', matrixStr);
            
            // 處理 ID 和 class
            if (!child.id || child.id.startsWith('lib-')) {
                child.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            }
            child.classList.remove('selected');

            // --- [新增修正] 為解群後的物件補上 data-tool 屬性，使其可被選取 ---
            const tagName = child.tagName.toLowerCase();
            
            // 確保有 shape class
            if (!child.classList.contains('shape')) {
                child.classList.add('shape');
            }

            // 針對圓形本體與半徑線進行修復
            if (!child.hasAttribute('data-tool')) {
                if (tagName === 'circle' || tagName === 'ellipse') {
                    // 排除小半徑的圓點 (Point)
                    const r = parseFloat(child.getAttribute('r') || child.getAttribute('rx') || 0);
                    if (r < 8 && child.style.fill !== 'none') {
                        child.setAttribute('data-tool', 'point');
                    } else {
                        child.setAttribute('data-tool', 'ellipse');
                        child.setAttribute('data-sub-tool', 'circle');
                    }
                } else if (tagName === 'line') {
                    child.setAttribute('data-tool', 'line');
                } else if (tagName === 'text') {
                    child.setAttribute('data-tool', 'text');
                } else if (tagName === 'path') {
                    child.setAttribute('data-tool', 'freehand'); // 或其他適當的預設值
                }
            }
            // 移除特定內部 class 以免干擾後續操作
            child.classList.remove('circle-body', 'circle-line');
            // -----------------------------------------------------------

            // 5. 將處理完的子物件移出群組，直接放到 shapesLayer 中
            shapesLayer.appendChild(child);
            newElementsToSelect.push(child);
        });
        
        // 6. 移除空的舊群組
        group.remove();
    });
    
    // 7. 更新選取狀態
    deselectAll();
    newElementsToSelect.forEach(el => addToSelection(el));
    
    saveState();
    statusText.innerText = "已解散群組，物件位置已保留";
}

window.lastTextConfig = {
    size: "24",
    color: "#000000",
    writingMode: "horizontal-tb",
    bold: false
};

function openTextModal(mode, existingEl = null, x = 0, y = 0) {
    if (mode === 'math') {
        openMathModalV2(existingEl, x, y);
        return;
    }
    modalMode = mode;
    
    const bar = document.getElementById('quick-edit-bar');
    const textPanel = document.getElementById('text-helper-panel');
    const mathPanel = document.getElementById('math-helper-panel');
    const input = document.getElementById('edit-input-area');
    const sizeSel = document.getElementById('edit-size-select');
    // 取消了顏色選單
    const wmSel = document.getElementById('edit-writing-mode'); 
    const boldChk = document.getElementById('edit-bold-check');
    
    let isDim = false;
    if (existingEl && existingEl.parentNode && existingEl.parentNode.getAttribute('data-sub-tool') === 'dimension') {
        isDim = true;
        document.getElementById('edit-bar-title').innerText = "📐 長度標註";
    } else {
        document.getElementById('edit-bar-title').innerText = "📝 編輯文字";
    }

    bar.style.borderColor = "#3498db";
    
    if (mathPanel) mathPanel.style.display = 'none';
    if (textPanel) textPanel.style.display = 'flex';
    bar.style.display = 'flex';
    
    const dimOptions = document.getElementById('dim-height-options');
    const styleOptions = document.getElementById('dim-style-options');

    if (existingEl) {
        isEditingText = true;
        editingTextElement = existingEl;
        
        let currentWm = "horizontal-tb"; 
        
        const ensureFontSizeOption = (selectEl, sizeVal) => {
            if (!Array.from(selectEl.options).some(opt => parseInt(opt.value) === sizeVal)) {
                selectEl.add(new Option(sizeVal, sizeVal));
                const opts = Array.from(selectEl.options).sort((a, b) => parseInt(a.value) - parseInt(b.value));
                selectEl.innerHTML = '';
                opts.forEach(o => selectEl.add(o));
            }
        };

        if (existingEl.tagName.toLowerCase() === 'text') {
            input.value = existingEl.textContent || "";
            let fsStr = existingEl.style.fontSize || existingEl.getAttribute('font-size') || "12px";
            let fs = parseInt(fsStr.replace('px', ''));
            ensureFontSizeOption(sizeSel, fs);
            sizeSel.value = fs; 
            
            if (existingEl.style.writingMode === 'vertical-rl') currentWm = 'vertical-rl';
            if (boldChk) boldChk.checked = (existingEl.style.fontWeight === 'bold' || existingEl.getAttribute('font-weight') === 'bold');
        } else {
            input.value = existingEl.getAttribute('data-content') || ""; 
            let fs = parseInt(existingEl.getAttribute('data-font-size') || "24");
            ensureFontSizeOption(sizeSel, fs);
            sizeSel.value = fs;
            
            const div = existingEl.querySelector('.math-content');
            if (div && div.style.writingMode === 'vertical-rl') currentWm = 'vertical-rl';
            if (boldChk && div) boldChk.checked = (div.style.fontWeight === 'bold');
        }
        
        if (wmSel) wmSel.value = currentWm; 

        if (isDim) {
            const ownerId = existingEl.parentNode.getAttribute('data-owner');
            let isCircleDim = false;
            if (ownerId) {
                const owner = document.getElementById(ownerId);
                if (owner && (owner.tagName.toLowerCase() === 'ellipse' || owner.tagName.toLowerCase() === 'circle' || owner.getAttribute('data-sub-tool') === 'circle' || owner.getAttribute('data-sub-tool') === 'circle-smart')) {
                    isCircleDim = true;
                }
            }

            if (dimOptions) {
                dimOptions.style.display = isCircleDim ? 'none' : 'flex';
                const currentOffset = existingEl.parentNode.getAttribute('data-offset') || "20";
                const radio = document.querySelector(`input[name="dim-height"][value="${currentOffset}"]`);
                if (radio) radio.checked = true;
            }
            if (styleOptions) {
                styleOptions.style.display = isCircleDim ? 'none' : 'flex';
                const currentStyle = existingEl.parentNode.getAttribute('data-dim-style') || "standard";
                const radioS = document.querySelector(`input[name="dim-style"][value="${currentStyle}"]`);
                if (radioS) radioS.checked = true;
            }
            
            const textDirOptions = document.getElementById('dim-text-dir-options');
            if (textDirOptions) {
                textDirOptions.style.display = 'flex';
                const isAlign = existingEl.parentNode.getAttribute('data-align-text') !== 'false';
                const chkAlign = document.getElementById('chk-dim-align-text');
                if (chkAlign) chkAlign.checked = isAlign;
                
                // 【新增】標註換邊的讀取
                const isSwapped = existingEl.parentNode.getAttribute('data-swap-side') === 'true';
                const chkSwap = document.getElementById('chk-dim-swap-side');
                if (chkSwap) chkSwap.checked = isSwapped;
            }
        } else {
            if (dimOptions) dimOptions.style.display = 'none';
            if (styleOptions) styleOptions.style.display = 'none';
            const textDirOptions = document.getElementById('dim-text-dir-options');
            if (textDirOptions) textDirOptions.style.display = 'none';
        }
    } else {
        input.value = "";
        if (wmSel) wmSel.value = "horizontal-tb";
        if (dimOptions) dimOptions.style.display = 'none';
        if (styleOptions) styleOptions.style.display = 'none';
        const textDirOptions = document.getElementById('dim-text-dir-options');
        if (textDirOptions) textDirOptions.style.display = 'none';
    }
    input.oninput = syncTextLive;
    sizeSel.onchange = syncTextLive;
    if (wmSel) wmSel.onchange = syncTextLive; 
    if (boldChk) boldChk.onchange = syncTextLive; 
    setTimeout(() => input.focus(), 100);
}

window.updateDimensionHeight = function(val) {
    if (editingTextElement && editingTextElement.parentNode && editingTextElement.parentNode.getAttribute('data-sub-tool') === 'dimension') {
        const group = editingTextElement.parentNode;
        group.setAttribute('data-offset', val);
        
        // 直接使用 p1, p2 進行重繪，不再經過連動系統，徹底解決交點標註的更新問題
        const p1 = { x: parseFloat(group.getAttribute('data-p1-x')), y: parseFloat(group.getAttribute('data-p1-y')) };
        const p2 = { x: parseFloat(group.getAttribute('data-p2-x')), y: parseFloat(group.getAttribute('data-p2-y')) };
        if (typeof renderDimensionVisuals === 'function') renderDimensionVisuals(group, p1, p2);
        if (typeof saveState === 'function') saveState();
    }
};

function syncTextLive() {
    if (!isEditingText || !editingTextElement) return;
    const input = document.getElementById('edit-input-area');
    const size = document.getElementById('edit-size-select').value;
    
    // 【修改】動態抓取系統目前的線條顏色設定
    const colorSelect = document.getElementById('stroke-color-select');
    const color = colorSelect ? colorSelect.value : '#000000';
    
    const wmSel = document.getElementById('edit-writing-mode');
    const writingMode = wmSel ? wmSel.value : 'horizontal-tb';
    const boldChk = document.getElementById('edit-bold-check');
    const isBold = boldChk && boldChk.checked;
    let content = input.value;
    
    window.lastTextConfig = { size, color, writingMode, bold: isBold };
    
    const el = editingTextElement;    
    if (el.tagName.toLowerCase() === 'foreignobject') {
        el.setAttribute('data-content', content);
        el.setAttribute('data-font-size', size);
        el.setAttribute('fill', color);
        
        let div = el.querySelector('.math-content');
        if(div) {
            div.style.color = color;
            div.style.fontSize = size + "px";
            div.style.fontWeight = isBold ? "bold" : "normal";
            div.style.writingMode = writingMode;
            div.style.textOrientation = writingMode === 'vertical-rl' ? 'upright' : 'mixed';            

            if (writingMode === 'vertical-rl') {
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.style.textAlign = 'center';
            } else {
                div.style.display = 'inline-block';
                div.style.textAlign = 'left';
            }
            
            div.innerHTML = content.replace(/\n/g, '<br>');
            if (typeof autoScaleText === 'function') autoScaleText(el);
        }
    } 
    else if (el.tagName.toLowerCase() === 'text') {
        el.textContent = content;
        el.setAttribute('font-size', size);
        el.style.fontSize = size + "px";
        el.setAttribute('fill', color);
        el.style.fill = color;
        el.setAttribute('font-weight', isBold ? 'bold' : 'normal');
        el.style.fontWeight = isBold ? 'bold' : 'normal';
        el.style.writingMode = writingMode;
        el.style.textOrientation = writingMode === 'vertical-rl' ? 'upright' : 'mixed';

        if (el.parentNode && el.parentNode.getAttribute('data-sub-tool') === 'dimension') {
            const ownerId = el.parentNode.getAttribute('data-owner');
            if (ownerId && typeof updateDependentShapes === 'function') {
                const ownerShape = document.getElementById(ownerId);
                if (ownerShape) {
                    updateDependentShapes(ownerShape); 
                }
            }
        }
    }
}

function openMathModalV2(existingEl, x, y) {
    modalMode = 'math';
    
    const bar = document.getElementById('quick-math-bar');
    const textPanel = document.getElementById('text-helper-panel');
    const mathPanel = document.getElementById('math-helper-panel');
    const fPanel = document.getElementById('formula-library-panel'); 
    const input = document.getElementById('math-input-area');
    const sizeSel = document.getElementById('math-size-select');
    
    initMathV2Assets();
    
    document.getElementById('math-bar-title').innerText = "∑ 數學式";
    bar.style.borderColor = "#6c5ce7";
    
    if (textPanel) textPanel.style.display = 'none';
    if (mathPanel) mathPanel.style.display = 'flex';
    bar.style.display = 'flex';
    
    if (fPanel) {
        fPanel.style.display = 'flex';
        if (!window.isFormulaLibraryInit) {
            window.renderFormulaLibrary();
            window.isFormulaLibraryInit = true;
        }
    }
    
    if (existingEl) {
        isEditingText = true;
        editingTextElement = existingEl;
        input.value = existingEl.getAttribute('data-content') || ""; 
        let fs = parseInt(existingEl.getAttribute('data-font-size') || "24");
        
        if (!Array.from(sizeSel.options).some(opt => parseInt(opt.value) === fs)) {
            sizeSel.add(new Option(fs, fs));
            const opts = Array.from(sizeSel.options).sort((a, b) => parseInt(a.value) - parseInt(b.value));
            sizeSel.innerHTML = '';
            opts.forEach(o => sizeSel.add(o));
        }
        sizeSel.value = fs;
    } else {
        input.value = "";
    }
    
    input.oninput = syncMathLive;
    sizeSel.onchange = syncMathLive;
    
    setTimeout(() => input.focus(), 100);
}

// 【新增】處理標註換邊連動
window.updateDimensionSwapSide = function(checked) {
    if (editingTextElement && editingTextElement.parentNode && editingTextElement.parentNode.getAttribute('data-sub-tool') === 'dimension') {
        const group = editingTextElement.parentNode;
        group.setAttribute('data-swap-side', checked ? 'true' : 'false');
        
        const p1 = { x: parseFloat(group.getAttribute('data-p1-x')), y: parseFloat(group.getAttribute('data-p1-y')) };
        const p2 = { x: parseFloat(group.getAttribute('data-p2-x')), y: parseFloat(group.getAttribute('data-p2-y')) };
        if (typeof renderDimensionVisuals === 'function') renderDimensionVisuals(group, p1, p2);
        if (typeof saveState === 'function') saveState();
    }
};

let typingDebounceTimer = null;

function syncMathLive() {
    if (!isEditingText || !editingTextElement) return;
    
    const input = document.getElementById('math-input-area');
    const size = document.getElementById('math-size-select').value;
    
    // 【修改】動態抓取系統目前的線條顏色設定
    const colorSelect = document.getElementById('stroke-color-select');
    const color = colorSelect ? colorSelect.value : '#000000';
    
    let content = input.value;

    if (!window.lastTextConfig) window.lastTextConfig = {};
    window.lastTextConfig.size = size;
    window.lastTextConfig.color = color;

    const fo = editingTextElement;
    fo.setAttribute('data-content', content);
    fo.setAttribute('data-font-size', size);
    fo.setAttribute('fill', color);
    
    let div = fo.querySelector('.math-content');
    if(div) {
        div.style.color = color;
        div.style.fontSize = size + "px";
        
        const displayHTML = window.formatSmartMathText ? window.formatSmartMathText(content) : content;
        div.innerHTML = displayHTML;

        clearTimeout(typingDebounceTimer);
        typingDebounceTimer = setTimeout(() => {
            if (window.MathJax) {
                MathJax.typesetPromise([div]).then(() => {
                    if (typeof autoScaleText === 'function') autoScaleText(fo);
                });
            } else {
                if (typeof autoScaleText === 'function') autoScaleText(fo);
            }
        }, 150);
    }
}

// 統一的關閉與刪除邏輯
window.closeEditMode = function() {
    document.getElementById('quick-edit-bar').style.display = 'none';
    const mathBar = document.getElementById('quick-math-bar');
    if (mathBar) mathBar.style.display = 'none';
    const textPanel = document.getElementById('text-helper-panel');
    if (textPanel) textPanel.style.display = 'none';
    const mathPanel = document.getElementById('math-helper-panel');
    if (mathPanel) mathPanel.style.display = 'none';
    
    const formulaPanel = document.getElementById('formula-library-panel');
    if (formulaPanel) formulaPanel.style.display = 'none';
    
    if (editingTextElement) {
        let content = editingTextElement.tagName.toLowerCase() === 'text' 
            ? editingTextElement.textContent 
            : editingTextElement.getAttribute('data-content');
            
        if (!content || !content.trim()) {
            if (editingTextElement.parentNode && editingTextElement.parentNode.getAttribute('data-sub-tool') === 'dimension') {
                editingTextElement.parentNode.remove();
            } else {
                editingTextElement.remove();
            }
            deselectAll();
        }
    }
    isEditingText = false;
    editingTextElement = null;
    saveState();
};

window.deleteEditingText = function() {
    if (editingTextElement) {
        editingTextElement.remove();
        deselectAll();
        saveState();
    }
    closeEditMode();
};

// 為了相容其他呼叫此舊名稱的程式碼
window.closeTextModal = closeEditMode;
window.closeMathModal = closeEditMode;
window.confirmTextEntry = closeEditMode;
/* ======= 修改結束 ======= */

function initMathV2Assets() {
    if (isMathV2Init) return;
    const quickFormulas = [{
        label: '公式解',
        code: 'x = (-b +- sqrt(b^2-4ac))/(2a)'
    }, {
        label: '二元聯立',
        code: '{(3x + 2y = 12),(x - y = 4):}'
    }, {
        label: '距離',
        code: 'd=sqrt((x_2-x_1)^2+(y_2-y_1)^2)'
    }];
	/*
	 , {
        label: '等差級數',
        code: 'S_n = (n(a_1 + a_n))/2'
    }
	*/
    const quickScroll = document.getElementById('quick-formula-scroll');
    if (quickScroll) {
        quickScroll.innerHTML = '';
        quickFormulas.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'quick-btn';
            btn.title = item.label + "\n代碼: " + item.code;
            btn.innerHTML = '`' + item.code + '`';
            btn.onclick = () => {
                if (typeof insertToMathV2 === 'function') {
                    insertToMathV2(item.code, '`');
                }
            };
            quickScroll.appendChild(btn);
        });
        if (window.MathJax) {
            MathJax.typesetPromise([quickScroll]).catch(err => {});
        }
    }
    const examples = [
        // --- 幾何標記 ---
        { l: '線段', c: 'overline(AB)' },
        { l: '直線', c: 'stackrel(harr)(AB)' },
        { l: '射線/向量', c: 'vec(AB)' },
        { l: '弧', c: 'stackrel(frown)(AB)' },
        { l: '小於等於', c: '<=' },
		{ l: '大於等於', c: '>=' },
		{ l: '不等於', c: '!=' },
        // --- 運算/結構 ---
        { l: '分數', c: 'a/b' },
        { l: '根號', c: 'sqrt(x)' },
        { l: 'n次根', c: 'root(n)(x)' },
        { l: '次方', c: 'x^2' },
        { l: '下標', c: 'x_1' },
        { l: '絕對值', c: 'abs(x)' },
        // --- 希臘字母 ---
        { l: '希臘α', c: 'alpha' },
        { l: '希臘β', c: 'beta' },
        { l: '希臘θ', c: 'theta' },
        { l: '希臘pi', c: 'pi' }		
    ];
    const exContainer = document.getElementById('math-v2-examples');
    if (exContainer) {
        exContainer.innerHTML = '';
        examples.forEach(ex => {
            const btn = document.createElement('div');
            btn.className = 'math-example-btn';
            btn.innerHTML = '`' + ex.c + '`'; // 將按鈕文字改為實際數學式
            btn.title = ex.l + "\n代碼: " + ex.c; // 滑鼠提示顯示原本的中文與代碼
            btn.onclick = () => insertToMathV2(ex.c, '`');
            exContainer.appendChild(btn);
        });
        if (window.MathJax) {
            MathJax.typesetPromise([exContainer]).catch(err => {});
        }
    }
    const symContainer = document.getElementById('math-v2-symbols');
    if (symContainer) {
        symContainer.innerHTML = '';
        commonSymbols.forEach(s => {
            const btn = document.createElement('div');
            btn.className = 'math-symbol-btn';
            btn.innerText = s;
            btn.onclick = () => insertToMathV2(s, '');
            symContainer.appendChild(btn);
        });
    }
    isMathV2Init = true;
}

window.lastFocusedInput = null;
function insertToMathV2(txt, quote) {
    const customModal = document.getElementById('custom-formula-modal');
    const isCustomOpen = customModal && (customModal.style.display === 'flex' || customModal.style.display === 'block');
    
    let targetInput;
    // 【修改】優先判斷是否有大廳發文/回覆的輸入框被對焦
    if (window.lastFocusedInput && (
        document.getElementById('gallery-new-post-modal').style.display === 'flex' ||
        document.getElementById('gallery-view-modal').style.display === 'flex'
    )) {
        targetInput = window.lastFocusedInput;
    } else if (isCustomOpen) {
        targetInput = document.getElementById('custom-formula-code');
    } else if (modalMode === 'math') {
        targetInput = document.getElementById('math-input-area');
    } else {
        targetInput = document.getElementById('edit-input-area');
    }
    
    if (!targetInput) return;

    const start = targetInput.selectionStart;
    const val = targetInput.value;

    // 智慧判斷游標是否在反引號 (`) 內
    let isInsideMath = false;
    const textBeforeCursor = val.substring(0, start);
    const backtickCount = (textBeforeCursor.match(/`/g) ||[]).length;
    if (backtickCount % 2 === 1) isInsideMath = true; 

    let textToInsert = txt;
    if (!isCustomOpen && targetInput.id !== 'new-post-title' && targetInput.id !== 'new-post-desc' && targetInput.id !== 'gallery-reply-input') {
        if (isInsideMath) {
            textToInsert = txt.replace(/`/g, "");
        } else {
            textToInsert = quote + txt.replace(/`/g, "") + quote;
        }
    } else if (targetInput.id === 'new-post-title' || targetInput.id === 'new-post-desc' || targetInput.id === 'gallery-reply-input') {
        // 【新增】大廳文字框統一邏輯：如果在公式內不加引號，在公式外加引號
        if (isInsideMath) {
            textToInsert = txt.replace(/`/g, "");
        } else {
            textToInsert = quote + txt.replace(/`/g, "") + quote;
        }
    }

    if (typeof insertAtCursor === 'function') {
        insertAtCursor(targetInput, textToInsert);
    } else {
        targetInput.value = val.substring(0, start) + textToInsert + val.substring(targetInput.selectionEnd);
    }
    
    // 【新增】觸發大廳預覽更新
    if (targetInput.id === 'new-post-title' || targetInput.id === 'new-post-desc') {
        if (typeof window.previewNewPostMath === 'function') window.previewNewPostMath();
    } else if (targetInput.id === 'gallery-reply-input') {
        if (typeof window.previewReplyMath === 'function') window.previewReplyMath();
    } else if (isCustomOpen) {
        window.previewCustomFormula();
    } else if (modalMode === 'math' && typeof syncMathLive === 'function') {
        syncMathLive();
    } else if (typeof syncTextLive === 'function') {
        syncTextLive();
    }
}

// 1. 基礎數學：線段交點 (無限延伸直線的交點，需過濾範圍)
function getLineLineIntersection(p1, p2, p3, p4, isInfinite = false) {
    const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (d === 0) return null; // 平行無交點

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

    // 若是無限直線求解，不檢查 t, u 的範圍
    if (isInfinite || (t >= -0.001 && t <= 1.001 && u >= -0.001 && u <= 1.001)) {
        return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
    }
    return null;
}
window.getLineLineIntersection = getLineLineIntersection;
window.getLineCircleIntersections = getLineCircleIntersections;
window.getCircleCircleIntersections = getCircleCircleIntersections;

// ==============================================================
// 🌟 核心：幾何約束鎖定系統 (Geometric Constraint Solver)
// ==============================================================

window.toggleGeometryLock = function() {
    let targetX, targetY;

    if (window.anchorPoint) {
        targetX = window.anchorPoint.x;
        targetY = window.anchorPoint.y;
    } else if (selectedElements.length > 0) {
        // 【修正】一律使用最新同步的 lastClickPos，不再被舊的右鍵紀錄干擾
        targetX = lastClickPos.x;
        targetY = lastClickPos.y;
    } else {
        showAlert("請先「選取圖形」並在目標處點擊，或「雙擊」畫布產生定錨點，再執行此功能！");
        return;
    }

    const snap = findClosestPointOnShapes(targetX, targetY, 25);
    if (!snap || !snap.shape) {
         showAlert("點擊位置附近找不到可鎖定的多邊形或線段。"); return;
    }
    const shape = snap.shape;
    const tool = shape.getAttribute('data-tool');
    if (!['polygon', 'polyline', 'line', 'tri', 'rect', 'square', 'angle', 'rhombus', 'kite', 'parallelogram', 'trapezoid'].includes(tool)) {
        showAlert("此工具僅支援多邊形與線段的邊/角鎖定。"); return;
    }

    const pts = getTransformedPoints(shape);
    if (pts.length < 2) return;

    let isVertex = false;
    let targetIdx = -1;
    let minVertexDist = Infinity;
    
    pts.forEach((p, i) => {
        const d = Math.hypot(p.x - targetX, p.y - targetY);
        if (d < 25 && d < minVertexDist) {
            minVertexDist = d;
            isVertex = true; 
            targetIdx = i;
        }
    });

    if (!isVertex) {
        let minDist = Infinity;
        for (let i=0; i < pts.length; i++) {
            const next = (i+1) % pts.length;
            if ((tool === 'polyline' || tool === 'line' || tool === 'angle') && i === pts.length-1) continue;
            const d = distToSegment(targetX, targetY, pts[i].x, pts[i].y, pts[next].x, pts[next].y);
            if (d < minDist) { minDist = d; targetIdx = i; }
        }
    }

    if (targetIdx === -1) {
        showAlert("無法識別點擊位置對應的邊或角。");
        return;
    }

    let lEdges = JSON.parse(shape.getAttribute('data-locked-edges') || '{}');
    let lAngles = JSON.parse(shape.getAttribute('data-locked-angles') || '{}');

    if (isVertex) {
        if (lAngles[targetIdx] !== undefined) {
            delete lAngles[targetIdx];
            statusText.innerText = "🔓 已解除角鎖定";
        } else {
            const prev = (targetIdx - 1 + pts.length) % pts.length;
            const next = (targetIdx + 1) % pts.length;
            if(tool === 'polyline' && (targetIdx === 0 || targetIdx === pts.length-1)) {
                statusText.innerText = "無法鎖定折線的端點角度。"; return;
            }
            const a1 = Math.atan2(pts[prev].y - pts[targetIdx].y, pts[prev].x - pts[targetIdx].x);
            const a2 = Math.atan2(pts[next].y - pts[targetIdx].y, pts[next].x - pts[targetIdx].x);
            let diff = a2 - a1;
            while (diff <= -Math.PI) diff += 2*Math.PI;
            while (diff > Math.PI) diff -= 2*Math.PI;
            lAngles[targetIdx] = diff;
            statusText.innerText = "🔒 已鎖定夾角";
        }
    } else {
        if (lEdges[targetIdx] !== undefined) {
            delete lEdges[targetIdx];
            statusText.innerText = "🔓 已解除邊長鎖定";
        } else {
            const next = (targetIdx+1) % pts.length;
            const len = Math.hypot(pts[next].x - pts[targetIdx].x, pts[next].y - pts[targetIdx].y);
            lEdges[targetIdx] = len;
            statusText.innerText = "🔒 已鎖定邊長";
        }
    }

    shape.setAttribute('data-locked-edges', JSON.stringify(lEdges));
    shape.setAttribute('data-locked-angles', JSON.stringify(lAngles));

    window.clearAnchorPoint();
    window.updateLockVisuals(shape);
    if (typeof saveState === 'function') saveState();
};

// 計算容許路徑並投影座標
window.applyLocks = function(shape, dragIndex, nx, ny) {
    let lEdges = JSON.parse(shape.getAttribute('data-locked-edges') || '{}');
    let lAngles = JSON.parse(shape.getAttribute('data-locked-angles') || '{}');

    if (Object.keys(lEdges).length === 0 && Object.keys(lAngles).length === 0) {
        return { x: nx, y: ny };
    }

    const pts = getTransformedPoints(shape);
    const n = pts.length;
    const isClosed = !(['polyline', 'line'].includes(shape.getAttribute('data-tool')));

    let paths =[];
    const k = dragIndex;
    const prevIdx = (k - 1 + n) % n;
    const nextIdx = (k + 1) % n;

    let constraintCount = 0; // 記錄這個頂點被幾條規則限制

    // 條件 1: 連接的前一條邊被鎖定 (圓形軌道)
    if (lEdges[prevIdx] !== undefined && (isClosed || k > 0)) {
        paths.push({ type: 'circle', cx: pts[prevIdx].x, cy: pts[prevIdx].y, r: lEdges[prevIdx] });
        constraintCount++;
    }
    // 條件 2: 連接的後一條邊被鎖定 (圓形軌道)
    if (lEdges[k] !== undefined && (isClosed || k < n - 1)) {
        paths.push({ type: 'circle', cx: pts[nextIdx].x, cy: pts[nextIdx].y, r: lEdges[k] });
        constraintCount++;
    }

    // 條件 3: 前一個頂點的角被鎖定 (射線軌道)
    if (lAngles[prevIdx] !== undefined && (isClosed || k > 1)) {
        const p2Idx = (prevIdx - 1 + n) % n;
        const baseAng = Math.atan2(pts[prevIdx].y - pts[p2Idx].y, pts[prevIdx].x - pts[p2Idx].x);
        const targetAng = baseAng + lAngles[prevIdx];
        paths.push({ type: 'line', px: pts[prevIdx].x, py: pts[prevIdx].y, ux: Math.cos(targetAng), uy: Math.sin(targetAng) });
        constraintCount++;
    }

    // 條件 4: 後一個頂點的角被鎖定 (射線軌道)
    if (lAngles[nextIdx] !== undefined && (isClosed || k < n - 2)) {
        const n2Idx = (nextIdx + 1) % n;
        const baseAng = Math.atan2(pts[n2Idx].y - pts[nextIdx].y, pts[n2Idx].x - pts[nextIdx].x);
        const targetAng = baseAng - lAngles[nextIdx]; 
        paths.push({ type: 'line', px: pts[nextIdx].x, py: pts[nextIdx].y, ux: Math.cos(targetAng), uy: Math.sin(targetAng) });
        constraintCount++;
    }

    if (lAngles[k] !== undefined && (isClosed || (k > 0 && k < n - 1))) {
        constraintCount++;
    }

    // 【核心修復】：如果被大於等於 2 個條件約束，代表該點已經被完全固定，禁止移動！
    if (constraintCount >= 2) {
        return pts[k]; 
    }

    // --- 求解單一滑動軌跡 ---
    let result = { x: nx, y: ny };
    if (paths.length === 0) return result;

    if (paths.length === 1) {
        const p = paths[0];
        if (p.type === 'circle') {
            const dx = nx - p.cx; const dy = ny - p.cy;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                result.x = p.cx + (dx/dist)*p.r;
                result.y = p.cy + (dy/dist)*p.r;
            }
        } else if (p.type === 'line') {
            const vx = nx - p.px; const vy = ny - p.py;
            const t = vx * p.ux + vy * p.uy;
            result.x = p.px + t * p.ux;
            result.y = p.py + t * p.uy;
        }
        return result;
    }

    return result;
};

// 即時更新視覺特效
window.updateLockVisuals = function(shape) {
    if (!shape || !shape.id) return;

    // 先清除這個 shape 舊有的鎖頭
    document.querySelectorAll(`.geom-lock-icon[data-owner="${shape.id}"]`).forEach(el => el.remove());

    const lEdges = JSON.parse(shape.getAttribute('data-locked-edges') || '{}');
    const lAngles = JSON.parse(shape.getAttribute('data-locked-angles') || '{}');

    // 1. 同步長度標註
    document.querySelectorAll(`g[data-dependency-type="dimension"][data-owner="${shape.id}"]`).forEach(dimGroup => {
        const idx = dimGroup.getAttribute('data-edge-index');
        const txt = dimGroup.querySelector('text');
        const lines = dimGroup.querySelectorAll('.dimension-line, .dimension-path');
        if (lEdges[idx] !== undefined) {
            if(txt) txt.classList.add('geom-lock-text');
            lines.forEach(l => l.classList.add('geom-lock-line'));
        } else {
            if(txt) txt.classList.remove('geom-lock-text');
            lines.forEach(l => l.classList.remove('geom-lock-line'));
        }
    });

    // 2. 同步角度標註
    document.querySelectorAll(`[data-dependency-type="angle_mark"][data-owner-shape="${shape.id}"]`).forEach(angMark => {
        const idx = angMark.getAttribute('data-vertex-index');
        if (lAngles[idx] !== undefined) {
            if (angMark.tagName.toLowerCase() === 'text') angMark.classList.add('geom-lock-text');
            else angMark.classList.add('geom-lock-line');
        } else {
            if (angMark.tagName.toLowerCase() === 'text') angMark.classList.remove('geom-lock-text');
            else angMark.classList.remove('geom-lock-line');
        }
    });

    // 3. 繪製小鎖頭 (針對沒有標註的邊角)
    const pts = getTransformedPoints(shape);
    const tool = shape.getAttribute('data-tool');
    const drawIcon = (x, y, lockType, idxStr) => {
        const icon = document.createElementNS(ns, "text");
        icon.setAttribute('x', x); icon.setAttribute('y', y);
        icon.textContent = "🔒";
        icon.setAttribute('class', 'shape geom-lock-icon geom-lock-indicator');
        icon.setAttribute('data-tool', 'lock-icon'); // 讓鎖頭可被選取
        icon.setAttribute('data-owner', shape.id);
        icon.setAttribute('data-lock-type', lockType); // edge 或 angle
        icon.setAttribute('data-lock-index', idxStr);
        icon.style.cssText = "font-size:16px; text-anchor:middle; dominant-baseline:central; pointer-events:all; cursor:pointer; opacity:0.8;";
        document.getElementById('temp-layer').appendChild(icon);
    };

    Object.keys(lEdges).forEach(idxStr => {
        const i = parseInt(idxStr);
        if (pts[i] && pts[(i+1)%pts.length]) {
            const mx = (pts[i].x + pts[(i+1)%pts.length].x) / 2;
            const my = (pts[i].y + pts[(i+1)%pts.length].y) / 2;
            drawIcon(mx, my, 'edge', idxStr);
        }
    });

    Object.keys(lAngles).forEach(idxStr => {
        const i = parseInt(idxStr);
        if (pts[i]) {
            if ((tool === 'polyline' || tool === 'line') && (i === 0 || i === pts.length-1)) return; 
            drawIcon(pts[i].x, pts[i].y - 20, 'angle', idxStr); 
        }
    });
};

// 【新增函式】清除所有與特定圖形相關的鎖定視覺特效
window.clearAllLockVisuals = function(shape) {
    if (!shape || !shape.id) return;
    
    // 1. 移除鎖頭圖示
    document.querySelectorAll(`.geom-lock-icon[data-owner="${shape.id}"]`).forEach(el => el.remove());

    // 2. 移除長度標註的鎖定樣式
    document.querySelectorAll(`g[data-dependency-type="dimension"][data-owner="${shape.id}"]`).forEach(dimGroup => {
        const txt = dimGroup.querySelector('text');
        const lines = dimGroup.querySelectorAll('.dimension-line, .dimension-path');
        if(txt) txt.classList.remove('geom-lock-text');
        lines.forEach(l => l.classList.remove('geom-lock-line'));
    });

    // 3. 移除角度標註的鎖定樣式
    document.querySelectorAll(`[data-dependency-type="angle_mark"][data-owner-shape="${shape.id}"]`).forEach(angMark => {
        if (angMark.tagName.toLowerCase() === 'text') angMark.classList.remove('geom-lock-text');
        else angMark.classList.remove('geom-lock-line');
    });
};

// 2. 基礎數學：線段與圓交點
function getLineCircleIntersections(p1, p2, center, r) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - center.x;
    const fy = p1.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - r * r;

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return []; // 無交點

    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    const res = [];
    // 檢查 t 是否在線段範圍內
    if (t1 >= -0.001 && t1 <= 1.001) res.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
    if (t2 >= -0.001 && t2 <= 1.001) res.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
    return res;
}

// 3. 基礎數學：圓與圓交點
function getCircleCircleIntersections(c1, r1, c2, r2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return []; // 無交點或同心圓

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    
    const x2 = c1.x + a * dx / d;
    const y2 = c1.y + a * dy / d;

    return [
        { x: x2 + h * dy / d, y: y2 - h * dx / d },
        { x: x2 - h * dy / d, y: y2 + h * dx / d }
    ];
}

// 4. 輔助：檢查點是否在角度範圍內 (用於扇形/弧形)
function isPointInAngleRange(pt, center, startAngle, endAngle) {
    // startAngle, endAngle 單位是弧度 (0 ~ 2PI)
    // 這裡我們假設繪圖邏輯是逆時針，但為了保險，我們正規化角度
    let angle = Math.atan2(center.y - pt.y, pt.x - center.x); // 注意 SVG Y 軸方向
    // 修正：我們的系統 Y 軸向下，之前的繪圖邏輯是: y = cy - r * sin(theta)
    // 所以 theta = atan2(-(y-cy), x-cx)
    angle = Math.atan2(-(pt.y - center.y), pt.x - center.x);
    
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

// 5. 核心：將任意 SVG 形狀轉換為幾何數據 (線段列表 + 圓列表)
function extractGeometry(shape) {
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    const tagName = shape.tagName.toLowerCase();
    
    // 排除名單 (立體圖、文字、標註)
    if (['solid', 'text', 'math', 'mark', 'function'].includes(tool)) return null;
    if (['solid-cube', 'solid-cylinder', 'solid-cone'].includes(subTool)) return null;
    if (shape.style.display === 'none') return null;

    const m = shape.getCTM();
    const toGlobal = (x, y) => ({ x: x * m.a + y * m.c + m.e, y: x * m.b + y * m.d + m.f });

    let segments = [];
    let circles = [];

    // A. 處理圓形、橢圓 (限正圓)
    if (tagName === 'circle' || (tagName === 'ellipse' && Math.abs(shape.getAttribute('rx') - shape.getAttribute('ry')) < 0.1)) {
        const cx = parseFloat(shape.getAttribute('cx')) || 0;
        const cy = parseFloat(shape.getAttribute('cy')) || 0;
        const r = parseFloat(shape.getAttribute('r') || shape.getAttribute('rx'));
        circles.push({ center: toGlobal(cx, cy), r: r * m.a }); // 假設均勻縮放
    }
    // B. 處理特殊的 Path (扇形、弧形) - 利用 data 屬性
    else if (['sector', 'arc', 'arch', 'circular_segment'].includes(subTool)) {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const startA = parseFloat(shape.getAttribute('data-start-angle'));
        const endA = parseFloat(shape.getAttribute('data-end-angle'));
        
        if (!isNaN(cx)) {
            const center = toGlobal(cx, cy);
            const radius = r * m.a;
            
            // 加入圓弧部分
            circles.push({ center, r: radius, startAngle: startA, endAngle: endA, isArc: true });

            // 計算端點
            const pStart = { 
                x: center.x + radius * Math.cos(startA), 
                y: center.y - radius * Math.sin(startA) 
            };
            const pEnd = { 
                x: center.x + radius * Math.cos(endA), 
                y: center.y - radius * Math.sin(endA) 
            };

            // 加入直線部分
            if (subTool === 'sector') {
                segments.push({ p1: center, p2: pStart });
                segments.push({ p1: center, p2: pEnd });
            } else if (subTool === 'arch' || subTool === 'circular_segment') {
                segments.push({ p1: pStart, p2: pEnd });
            }
        }
    }
    // C. 處理直線
    else if (tool === 'line' || tagName === 'line') {
        const l = (tagName === 'g') ? (shape.querySelector('.visible-line') || shape.querySelector('line')) : shape;
        if (l) {
            const p1 = toGlobal(+l.getAttribute('x1'), +l.getAttribute('y1'));
            const p2 = toGlobal(+l.getAttribute('x2'), +l.getAttribute('y2'));
            segments.push({ p1, p2, edgeIndex: 0 }); // 加入 edgeIndex
        }
    }
    // D. 處理多邊形、折線、矩形 (星形也是 polygon)
    else if (tagName === 'polygon' || tagName === 'polyline' || tagName === 'rect') {
        let pts =[];
        if (tagName === 'rect') {
            const x = parseFloat(shape.getAttribute('x'));
            const y = parseFloat(shape.getAttribute('y'));
            const w = parseFloat(shape.getAttribute('width'));
            const h = parseFloat(shape.getAttribute('height'));
            pts =[{x, y}, {x: x+w, y}, {x: x+w, y: y+h}, {x, y: y+h}];
        } else {
            const pointsStr = shape.getAttribute('points');
            if (pointsStr) {
                pts = pointsStr.trim().split(/\s+|,/).filter(v => v !== '').reduce((acc, val, i, arr) => {
                    if (i % 2 === 0) acc.push({ x: +val, y: +arr[i+1] });
                    return acc;
                },[]);
            }
        }

        // 轉換為全域座標並建立線段
        if (pts.length > 1) {
            const globalPts = pts.map(p => toGlobal(p.x, p.y));
            for (let i = 0; i < globalPts.length - 1; i++) {
                segments.push({ p1: globalPts[i], p2: globalPts[i+1], edgeIndex: i }); // 加入 edgeIndex
            }
            // 如果是多邊形或矩形，需封閉
            if (tagName !== 'polyline') {
                segments.push({ p1: globalPts[globalPts.length - 1], p2: globalPts[0], edgeIndex: globalPts.length - 1 }); // 加入 edgeIndex
            }
        }
    }
    // E. 處理群組 (例如 Venn 圖) - 遞迴處理
    else if (tagName === 'g') {
        Array.from(shape.children).forEach(child => {
            // 只處理有明確形狀定義的子物件
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

// 6. 主函式：尋找最近的交點
function findIntersectionSnap(mouseX, mouseY) {
    const shapes = document.querySelectorAll('#shapes-layer .shape');
    let allSegments = [];
    let allCircles = [];

    // 1. 提取所有圖形的幾何資訊
    shapes.forEach(shape => {
        // 忽略群組內的子物件，避免重複計算 (除非它是獨立的)
        if (shape.parentNode.id !== 'shapes-layer' && shape.parentNode.getAttribute('data-tool') === 'group') return;
        
        const geo = extractGeometry(shape);
        if (geo) {
            allSegments.push(...geo.segments);
            allCircles.push(...geo.circles);
        }
    });

    let intersections = [];

    // 2. 計算 線段 vs 線段
    for (let i = 0; i < allSegments.length; i++) {
        for (let j = i + 1; j < allSegments.length; j++) {
            const pt = getLineLineIntersection(allSegments[i].p1, allSegments[i].p2, allSegments[j].p1, allSegments[j].p2);
            if (pt) intersections.push(pt);
        }
    }

    // 3. 計算 線段 vs 圓 (含弧形)
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

    // 4. 計算 圓 vs 圓 (含弧形)
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

    // 5. 找出距離滑鼠最近的交點
    let closestPoint = null;
    let minDist = 15; // 吸附半徑

    intersections.forEach(pt => {
        const d = Math.hypot(pt.x - mouseX, pt.y - mouseY);
        if (d < minDist) {
            minDist = d;
            closestPoint = pt;
        }
    });

    return closestPoint;
}

window.formatSmartMathText = function(content) {
    if (!content) return "";
    
    const rawLines = content.split('\n');
    return rawLines.map(line => {
        if (!line.trim()) return '';

        // 正規表達式切割：抓取所有被反引號 `...` 包裹的部分
        // 偶數索引是「純文字」，奇數索引是「數學公式」
        const parts = line.split(/(`[^`]+`)/g);
        
        return parts.map(part => {
            if (part.startsWith('`') && part.endsWith('`')) {
                // 【公式部分】：自動將公式內的空格轉為 ASCIIMath 的強制空格 '\ '
                // 這樣 MathJax 就不會忽略公式裡的空白了
                let inner = part.slice(1, -1).replace(/ /g, '\\ ');
                return '`' + inner + '`';
            } else {
                // 【純文字部分】：包含中文、英文、普通空白
                // 包在 span 裡讓瀏覽器處理折行，CSS pre-wrap 會負責顯示空白
                return `<span>${part}</span>`;
            }
        }).join('');
    }).join('<br>');
};

/**
 * 計算點在線段上的投影點與參數 t
 */
function getProjectionOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return { x: x1, y: y1, t: 0 };
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t)); // 限制在線段兩端點內
    return {
        x: x1 + t * dx,
        y: y1 + t * dy,
        t: t
    };
}

/**
 * 尋找給定座標附近最近的幾何邊緣 (用於吸附)
 */
function findClosestPointOnShapes(mouseX, mouseY, radius = 15, excludeShapeId = null) {
    const shapes = document.querySelectorAll('#shapes-layer > .shape');
    let bestSnap = { dist: radius, point: null };

    shapes.forEach(shape => {
        const tool = shape.getAttribute('data-tool');
        if (['text', 'math', 'point', 'group'].includes(tool)) return;
        if (excludeShapeId && shape.id === excludeShapeId) return;

        const geo = extractGeometry(shape);
        if (!geo) return;

        geo.segments.forEach(seg => {
            const proj = getProjectionOnSegment(mouseX, mouseY, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
            const dist = Math.hypot(mouseX - proj.x, mouseY - proj.y);
            if (dist < bestSnap.dist) {
                bestSnap = { dist, point: proj, shape: shape, t: proj.t, type: 'line' };
            }
        });

        geo.circles.forEach(circ => {
            const dx = mouseX - circ.center.x;
            const dy = mouseY - circ.center.y;
            const distToCenter = Math.hypot(dx, dy);
            if (distToCenter > 0.1 && Math.abs(distToCenter - circ.r) < bestSnap.dist) {
                const angle = Math.atan2(dy, dx);
                const pointOnCircle = {
                    x: circ.center.x + circ.r * Math.cos(angle),
                    y: circ.center.y + circ.r * Math.sin(angle)
                };
                bestSnap = { dist: Math.abs(distToCenter - circ.r), point: pointOnCircle, shape: shape, angle: angle, type: 'circle' };
            }
        });
    });

    return bestSnap.point ? bestSnap : null;
}

/**
 * 計算兩圓的公切線切點
 * @param {Object} c1 - 圓1 {x, y, r}
 * @param {Object} c2 - 圓2 {x, y, r}
 * @returns {Object} { external: [{p1, p2}], internal: [{p1, p2}] }
 */
function getCommonTangents(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const res = { external: [], internal:[] };

    if (d === 0) return res; // 同心圓無公切線

    // --- 1. 外公切線 (External Tangents) ---
    // 條件：圓心距 > 半徑差
    if (d > Math.abs(c1.r - c2.r)) {
        const alpha = Math.acos((c1.r - c2.r) / d);
        [1, -1].forEach(sign => {
            const a = angle + sign * alpha;
            res.external.push({
                p1: { x: c1.x + c1.r * Math.cos(a), y: c1.y + c1.r * Math.sin(a) },
                p2: { x: c2.x + c2.r * Math.cos(a), y: c2.y + c2.r * Math.sin(a) }
            });
        });
    } else if (Math.abs(d - Math.abs(c1.r - c2.r)) < 0.1) {
        // 內切 (只有一條外公切線)
        const a = angle + (c1.r > c2.r ? 0 : Math.PI);
        res.external.push({
            p1: { x: c1.x + c1.r * Math.cos(a), y: c1.y + c1.r * Math.sin(a) },
            p2: { x: c2.x + c2.r * Math.cos(a), y: c2.y + c2.r * Math.sin(a) }
        });
    }

    // --- 2. 內公切線 (Internal Tangents) ---
    // 條件：圓心距 > 半徑和
    if (d > c1.r + c2.r) {
        const alpha = Math.acos((c1.r + c2.r) / d);
        [1, -1].forEach(sign => {
            const a1 = angle + sign * alpha;
            // ▼▼▼ 修正處：內公切線的半徑方向相反 (相差 180 度) ▼▼▼
            const a2 = a1 + Math.PI; 
            // ▲▲▲ 修正結束 ▲▲▲
            
            res.internal.push({
                p1: { x: c1.x + c1.r * Math.cos(a1), y: c1.y + c1.r * Math.sin(a1) },
                p2: { x: c2.x + c2.r * Math.cos(a2), y: c2.y + c2.r * Math.sin(a2) }
            });
        });
    } else if (Math.abs(d - (c1.r + c2.r)) < 0.1) {
        // 外切 (只有一條內公切線)
        const a1 = angle;
        const a2 = angle + Math.PI;
        res.internal.push({
            p1: { x: c1.x + c1.r * Math.cos(a1), y: c1.y + c1.r * Math.sin(a1) },
            p2: { x: c2.x + c2.r * Math.cos(a2), y: c2.y + c2.r * Math.sin(a2) }
        });
    }

    return res;
}
window.getCommonTangents = getCommonTangents;