const CONTEXT_MENU_CONFIG = {
    'line': [
        { label: '取中點', icon: '·', action: () => executeConstruction('midpoint') },
        { label: '中垂線', icon: '⊥', action: () => executeConstruction('perpendicular') },
        { label: '線段等分', icon: '📏', action: () => executeConstruction('divide_line') },
        { label: '標記邊長樣式', icon: '🏷️', action: () => openSubMenuAtContext('menu-edge') },
        { label: '尺寸標註', icon: '⬌', action: () => executeSmartDimension() },
    ],
    'polygon': [
        { label: '角度標註與刪除', icon: '∠', action: () => toggleAngleLabelOnSelection() },
        { label: '畫對角線', icon: '╳', action: () => drawDiagonalsFromSelection() },
        { label: '手動標記角度', icon: '⭕', action: () => openSubMenuAtContext('menu-angle') },
        { label: '頂點標註與刪除', icon: '🔠', action: () => toggleLabelOnSelection() },
        { label: '尺寸標註', icon: '⬌', action: () => executeSmartDimension() },
    ],
    'angle': [
        { label: '角平分線', icon: '∡', action: () => toggleConstructMode('divide_angle') },
        { label: '手動標記角度', icon: '⭕', action: () => openSubMenuAtContext('menu-angle') },
        { label: '角度標註與刪除', icon: '∠', action: () => toggleAngleLabelOnSelection() },
        { label: '頂點標註與刪除', icon: '🔠', action: () => toggleLabelOnSelection() },
        { label: '尺寸標註', icon: '⬌', action: () => executeSmartDimension() },
    ],
    'solid': [
        { label: '尺寸標註', icon: '⬌', action: () => executeSmartDimension() },
    ],
    'group': [
        { label: '解散群組', icon: '🔓', action: () => ungroupSelected(), condition: (els) => els.some(e => e.getAttribute('data-tool') === 'group') },
        { label: '尺寸標註', icon: '⬌', action: () => executeSmartDimension() },
    ],
    'ellipse': [
        { label: '圓切線', icon: '○', action: () => toggleConstructMode('tangent') },
        { label: '圓形角', icon: '📐', action: () => openSubMenuAtContext('menu-circle-angles') },
    ],
    'multi-select': [
        { label: '建立群組', icon: '🔒', action: () => groupSelected(), condition: (els) => els.length > 1 },
        { label: '對齊工具', icon: '📊', action: () => openSubMenuAtContext('menu-align') },
    ]
};

const GENERAL_ACTIONS = [
    { label: '複製', icon: '📋', action: () => copySelection() },
    { label: '剪下', icon: '✂️', action: () => cutSelection() },
    { label: '貼上', icon: '📥', action: () => pasteSelection(true) },
    { label: '匯出選取物件', icon: '🖼️', action: () => triggerExportSelection() },
    { label: '刪除', icon: '🗑️', action: () => deleteSelected() },
];

function executeSmartDimension(targetOverride = null, mxOverride = null, myOverride = null) {
    let target = targetOverride;
    if (!target) {
        if (selectedElements.length === 0) return;
        target = selectedElements[0];
    }
    const tool = target.getAttribute('data-tool');
    const subTool = target.getAttribute('data-sub-tool');
    let mx, my;
    if (mxOverride !== null && myOverride !== null) {
        mx = mxOverride;
        my = myOverride;
    } else {
        const rawX = (typeof lastContextPos !== 'undefined' && lastContextPos.x !== 0) ? lastContextPos.x : lastClickPos.x;
        const rawY = (typeof lastContextPos !== 'undefined' && lastContextPos.y !== 0) ? lastContextPos.y : lastClickPos.y;
        const svg = document.getElementById('svg-canvas');
        const CTM = svg.getScreenCTM();
        if (!CTM) return;
        mx = (rawX - CTM.e) / CTM.a;
        my = (rawY - CTM.f) / CTM.d;
    }
    let bestSegment = null;
    let minDist = Infinity;
    const checkSegment = (p1, p2) => {
        const d = distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y);
        if (d < minDist) {
            minDist = d;
            bestSegment = { p1, p2 };
        }
    };
    if (tool === 'solid' || (tool === 'group' && subTool && subTool.startsWith('solid-'))) {
        if (subTool === 'solid-cube') {
            const x = parseFloat(target.getAttribute('data-x'));
            const y = parseFloat(target.getAttribute('data-y'));
            const w = parseFloat(target.getAttribute('data-w'));
            const h = parseFloat(target.getAttribute('data-h'));
            const dx = parseFloat(target.getAttribute('data-dx'));
            const dy = parseFloat(target.getAttribute('data-dy'));
            const f1 = { x: x, y: y }, f2 = { x: x + w, y: y }, f3 = { x: x + w, y: y + h }, f4 = { x: x, y: y + h };
            const b1 = { x: f1.x + dx, y: f1.y + dy }, b2 = { x: f2.x + dx, y: f2.y + dy }, b3 = { x: f3.x + dx, y: f3.y + dy }, b4 = { x: f4.x + dx, y: f4.y + dy };
            const edges = [
                [f1, f2], [f2, f3], [f3, f4], [f4, f1],
                [b1, b2], [b2, b3], [b3, b4], [b4, b1],
                [f1, b1], [f2, b2], [f3, b3], [f4, b4]
            ];
            edges.forEach(e => checkSegment(e[0], e[1]));
        } else if (subTool === 'solid-cylinder' || subTool === 'solid-cone') {
            const cx = parseFloat(target.getAttribute('data-cx'));
            const cy = parseFloat(target.getAttribute('data-cy'));
            const r = parseFloat(target.getAttribute('data-r'));
            const h = parseFloat(target.getAttribute('data-h'));
            if (subTool === 'solid-cylinder') {
                checkSegment({ x: cx - r, y: cy }, { x: cx - r, y: cy + h });
                checkSegment({ x: cx + r, y: cy }, { x: cx + r, y: cy + h });
                checkSegment({ x: cx - r, y: cy }, { x: cx + r, y: cy });
            } else {
                checkSegment({ x: cx, y: cy }, { x: cx - r, y: cy + h });
                checkSegment({ x: cx, y: cy }, { x: cx + r, y: cy + h });
                checkSegment({ x: cx - r, y: cy + h }, { x: cx + r, y: cy + h });
            }
        }
    } else {
        const geo = extractGeometry(target);
        if (geo && geo.segments) {
            geo.segments.forEach(seg => {
                checkSegment(seg.p1, seg.p2);
            });
        }
    }
    if (bestSegment && minDist < 60) {
        const pStart = bestSegment.p1;
        const pEnd = bestSegment.p2;
        let splitPoints = [
            { t: 0, pt: pStart },
            { t: 1, pt: pEnd }
        ];
        const vx = pEnd.x - pStart.x;
        const vy = pEnd.y - pStart.y;
        const lenSq = vx * vx + vy * vy;
        const allShapes = document.querySelectorAll('#shapes-layer .shape');
        allShapes.forEach(other => {
            const tTool = other.getAttribute('data-tool');
            if (other === target || tTool === 'text' || tTool === 'math' || tTool === 'mark' || tTool === 'group') return;
            const otherGeo = extractGeometry(other);
            if (!otherGeo) return;
            otherGeo.segments.forEach(seg => {
                const inter = getLineLineIntersection(pStart, pEnd, seg.p1, seg.p2);
                if (inter) {
                    const t = ((inter.x - pStart.x) * vx + (inter.y - pStart.y) * vy) / lenSq;
                    if (t > 0.01 && t < 0.99) splitPoints.push({ t: t, pt: inter });
                }
            });
            otherGeo.circles.forEach(circ => {
                const pts = getLineCircleIntersections(pStart, pEnd, circ.center, circ.r);
                pts.forEach(pt => {
                    const t = ((pt.x - pStart.x) * vx + (pt.y - pStart.y) * vy) / lenSq;
                    if (t > 0.01 && t < 0.99) splitPoints.push({ t: t, pt: pt });
                });
            });
        });
        splitPoints.sort((a, b) => a.t - b.t);
        let tMouse = ((mx - pStart.x) * vx + (my - pStart.y) * vy) / lenSq;
        tMouse = Math.max(0, Math.min(1, tMouse));
        let finalP1 = pStart;
        let finalP2 = pEnd;
        for (let i = 0; i < splitPoints.length - 1; i++) {
            const curr = splitPoints[i];
            const next = splitPoints[i + 1];
            if (tMouse >= curr.t && tMouse <= next.t) {
                finalP1 = curr.pt;
                finalP2 = next.pt;
                break;
            }
        }
        createDimensionMark(finalP1, finalP2, target);
        return true;
    } else {
        if (typeof statusText !== 'undefined') statusText.innerText = `無法偵測到附近的邊緣 (距離: ${Math.round(minDist)})`;
        return false;
    }
}

function buildContextMenu(selected) {
    const specificMenu = document.getElementById('ctx-actions-specific');
    const generalMenu = document.getElementById('ctx-actions-general');
    const separator = document.getElementById('ctx-separator');
    specificMenu.innerHTML = '';
    generalMenu.innerHTML = '';
    separator.style.display = 'none';
    let specificActions = [];
    if (selected.length === 1) {
        const shape = selected[0];
        const tool = shape.getAttribute('data-tool');
        if (CONTEXT_MENU_CONFIG[tool]) {
            specificActions.push(...CONTEXT_MENU_CONFIG[tool]);
        }
        if (tool === 'polygon' && getShapePoints(shape).length === 3) {
            specificActions.push(
                { label: '外心/外接圓', icon: '🔵', action: () => executeConstruction('circumcenter') },
                { label: '內心/內切圓', icon: '⚪', action: () => executeConstruction('incenter') },
                { label: '重心', icon: '⚖️', action: () => executeConstruction('centroid') }
            );
        }
    } else if (selected.length > 1) {
        if (CONTEXT_MENU_CONFIG['multi-select']) {
            specificActions.push(...CONTEXT_MENU_CONFIG['multi-select']);
        }
    }
    const createItem = (item) => {
        const div = document.createElement('div');
        div.className = 'context-menu-item';
        div.innerHTML = `<i class="context-menu-icon">${item.icon || ''}</i> <span>${item.label}</span>`;
        div.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('context-menu').style.display = 'none';
            setTimeout(() => {
                item.action();
            }, 10);
        };
        return div;
    };
    specificActions.forEach(item => {
        if (!item.condition || item.condition(selected)) {
            specificMenu.appendChild(createItem(item));
        }
    });
    GENERAL_ACTIONS.forEach(item => {
        generalMenu.appendChild(createItem(item));
    });
    if (specificMenu.children.length > 0) {
        separator.style.display = 'block';
    }
}

let currentCanvasMode = 'screen';
const PAPER_SIZES = {
    'a4': { w: 794, h: 1123, name: 'A4' },
    'b4': { w: 971, h: 1376, name: 'B4 (JIS)' },
    'a3': { w: 1123, h: 1587, name: 'A3' }
};
const SCREEN_SIZES = [
    { w: 800, h: 600, name: '800 x 600 (4:3)' },
    { w: 1024, h: 768, name: '1024 x 768 (4:3)' },
    { w: 1280, h: 720, name: '1280 x 720 (16:9)' },
    { w: 1920, h: 1080, name: '1920 x 1080 (16:9)' }
];

function openCanvasSettingsModal() {
    const modal = document.getElementById('canvas-settings-modal');
    modal.style.display = 'flex';
    const svg = document.getElementById('svg-canvas');
    const currentW = parseFloat(svg.getAttribute('width')) || 800;
    const currentH = parseFloat(svg.getAttribute('height')) || 600;
    const mode = (typeof currentCanvasMode !== 'undefined') ? currentCanvasMode : 'screen';
    const infoEl = document.getElementById('current-canvas-info');
    if (infoEl) {
        const modeText = mode === 'print' ? '列印' : '螢幕';
        infoEl.innerText = `目前: ${currentW} x ${currentH} (${modeText})`;
    }
    const modeRad = document.querySelector(`input[name="canvas-mode"][value="${mode}"]`);
    if (modeRad) modeRad.checked = true;
    const orient = currentW >= currentH ? 'landscape' : 'portrait';
    const orientRad = document.querySelector(`input[name="canvas-orient"][value="${orient}"]`);
    if (orientRad) orientRad.checked = true;
    updateCanvasSizeOptions();
    const targetVal = `${currentW},${currentH}`;
    const select = document.getElementById('canvas-size-dropdown');
    let matched = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === targetVal) {
            select.selectedIndex = i;
            matched = true;
            break;
        }
    }
    if (!matched) {
        const customOpt = document.createElement('option');
        customOpt.value = targetVal;
        customOpt.text = `自訂 / 目前 (${currentW} x ${currentH})`;
        customOpt.selected = true;
        select.insertBefore(customOpt, select.firstChild);
        select.value = targetVal;
    }
}

function updateCanvasSizeOptions() {
    const mode = document.querySelector('input[name="canvas-mode"]:checked').value;
    const orient = document.querySelector('input[name="canvas-orient"]:checked').value;
    const select = document.getElementById('canvas-size-dropdown');
    select.innerHTML = '';
    if (mode === 'screen') {
        SCREEN_SIZES.forEach(s => {
            let w = s.w, h = s.h;
            if (orient === 'portrait') { w = s.h; h = s.w; }
            const opt = document.createElement('option');
            opt.value = `${w},${h}`;
            opt.text = `${s.name} ${orient === 'portrait' ? '(直)' : ''}`;
            select.appendChild(opt);
        });
    } else {
        for (let key in PAPER_SIZES) {
            const p = PAPER_SIZES[key];
            let w = p.w, h = p.h;
            if (orient === 'landscape') {
                const temp = w; w = h; h = temp;
            }
            const opt = document.createElement('option');
            opt.value = `${w},${h}`;
            opt.text = `${p.name} - ${orient === 'portrait' ? '直式' : '橫式'} (${w}x${h})`;
            select.appendChild(opt);
        }
    }
}

function confirmCanvasSettings() {
    const val = document.getElementById('canvas-size-dropdown').value;
    const mode = document.querySelector('input[name="canvas-mode"]:checked').value;
    const showMargin = document.getElementById('canvas-safe-margin').checked;
    const [w, h] = val.split(',').map(Number);
    applyCanvasSize(w, h, mode);
    drawSafeMargin(w, h, showMargin);
    document.getElementById('canvas-settings-modal').style.display = 'none';
}

function updateCanvasSettingsUI() {
    const mode = document.querySelector('input[name="canvas-mode"]:checked').value;
    if (mode === 'screen') {
        document.querySelector('input[name="canvas-orient"][value="landscape"]').checked = true;
    } else {
        document.querySelector('input[name="canvas-orient"][value="portrait"]').checked = true;
    }
    updateCanvasSizeOptions();
}

function drawSafeMargin(w, h, enable) {
    const old = document.getElementById('safe-margin-rect');
    if (old) old.remove();
    if (!enable) return;
    const margin = 38;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.id = "safe-margin-rect";
    rect.setAttribute("x", margin);
    rect.setAttribute("y", margin);
    rect.setAttribute("width", w - margin * 2);
    rect.setAttribute("height", h - margin * 2);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", "#e74c3c");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("stroke-dasharray", "10,10");
    rect.style.pointerEvents = "none";
    rect.style.opacity = "0.5";
    const layer = document.getElementById('temp-layer');
    if (layer) layer.appendChild(rect);
}

function fixMenuPosition(menuId, wrapperElement) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('top', 'auto', 'important');
    menu.style.setProperty('left', 'auto', 'important');
    menu.style.setProperty('right', 'auto', 'important');
    menu.style.display = 'flex';
    menu.style.position = 'fixed';
    const btnRect = wrapperElement.getBoundingClientRect();
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const gap = 5;
    const leftPos = btnRect.left - menuWidth - gap;
    menu.style.left = leftPos + 'px';
    let topPos = btnRect.top;
    if (topPos + menuHeight > window.innerHeight) {
        topPos = window.innerHeight - menuHeight - 10;
        if (topPos < 10) topPos = 10;
    }
    menu.style.top = topPos + 'px';
}

function toggleSymmetryMode() {
    if (mode === 'symmetry') {
        setMode('select');
        statusText.innerText = "已取消對稱作圖";
        return;
    }
    closeAllMenus();
    mode = 'symmetry';
    document.querySelectorAll('.tool-btn').forEach(b => {
        if (b.id !== 'btn-toggle-grid' && b.id !== 'btn-snap-intersection') b.classList.remove('active');
    });
    document.getElementById('btn-symmetry').classList.add('active');
    if (selectedElements.length > 0) {
        symmetryStep = 1;
        handlesLayer.innerHTML = '';
        const msg = "對稱作圖 (步驟 2/2)：請直接在畫布上拖曳畫出對稱軸";
        statusText.innerText = msg;
        if (typeof window.showToolTipImmediate === 'function') {
            window.showToolTipImmediate(msg);
        }
    } else {
        symmetryStep = 0;
        deselectAll();
        statusText.innerText = "對稱作圖 (步驟 1/2)：請選取或框選要對稱的物件 (完成後按右鍵或 Enter)";
    }
}

function toggleEdgeMenu() {
    const menu = document.getElementById('menu-edge');
    const btnWrapper = document.getElementById('btn-mark-edge').parentNode;
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        closeAllMenus();
        fixMenuPosition('menu-edge', btnWrapper);
    }
}

function toggleAngleMenu() {
    const menu = document.getElementById('menu-angle');
    const btnWrapper = document.getElementById('btn-mark-angle').parentNode;
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        closeAllMenus();
        fixMenuPosition('menu-angle', btnWrapper);
    }
}

function selectEdgeStyle(style, iconStr, continuous = false) {
    const btn = document.getElementById('btn-mark-edge');
    if (style === 'text') {
        currentEdgeStyle = 'text';
        btn.innerHTML = `<span class="btn-icon" style="font-size:20px; font-weight:bold; color:#d35400;">∑</span><span class="btn-text">公式標</span>`;
    } else if (style === 'dimension') {
        currentEdgeStyle = 'dimension';
        const dimIcon = `
        <svg width="100%" height="100%" viewBox="0 0 40 24" fill="none" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="5" x2="4" y2="19" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="butt"/>
            <line x1="36" y1="5" x2="36" y2="19" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="butt"/>
            <line x1="6" y1="12" x2="34" y2="12" stroke="#FFFFFF" stroke-width="2"/>
            <path d="M6 12 L12 8 V16 Z" fill="#FFFFFF" stroke="none"/>
            <path d="M34 12 L28 8 V16 Z" fill="#FFFFFF" stroke="none"/>
        </svg>`;
        btn.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; width:100%; height:26px;">${dimIcon}</div><span class="btn-text" style="font-size:10px;">尺寸標註</span>`;
    } else {
        currentEdgeStyle = style;
        const cleanIcon = iconStr.replace(/<\/?span[^>]*>/g, "");
        btn.innerHTML = `<span class="btn-icon" style="font-size:22px;">${cleanIcon}</span><span class="btn-text">線標</span>`;
    }
    isContinuousMarking = continuous;
    if (selectedElements.length > 0) {
        let appliedCount = 0;
        const refX = (typeof lastContextPos !== 'undefined' && lastContextPos.x !== 0) ? lastContextPos.x : lastClickPos.x;
        const refY = (typeof lastContextPos !== 'undefined' && lastContextPos.y !== 0) ? lastContextPos.y : lastClickPos.y;
        selectedElements.forEach(el => {
            const tool = el.getAttribute('data-tool');
            const pts = getTransformedPoints(el);
            if (tool === 'line' && pts.length >= 2) {
                createEdgeMarkAt(pts[0], pts[1], el);
                appliedCount++;
            } else if (pts.length > 2) {
                const len = (tool === 'polyline') ? pts.length - 1 : pts.length;
                let minDist = Infinity;
                let bestIdx = -1;
                for (let i = 0; i < len; i++) {
                    const p1 = pts[i];
                    const p2 = pts[(i + 1) % pts.length];
                    const d = distToSegment(refX, refY, p1.x, p1.y, p2.x, p2.y);
                    if (d < minDist) {
                        minDist = d;
                        bestIdx = i;
                    }
                }
                if (bestIdx !== -1 && minDist < 50) {
                    const p1 = pts[bestIdx];
                    const p2 = pts[(bestIdx + 1) % pts.length];
                    createEdgeMarkAt(p1, p2, el);
                    appliedCount++;
                }
            }
        });
        if (appliedCount > 0 && !continuous) {
            closeAllMenus();
            setMode('select');
            statusText.innerText = `✅ 已直接套用 ${appliedCount} 個邊長標記`;
            return;
        }
    }
    activateMarkMode('edge');
    if (continuous) {
        statusText.innerText = "連續標記模式：請點擊線段";
    } else if (style === 'text') {
        statusText.innerText = `邊長公式模式：點擊邊緣後輸入 Math 公式`;
    } else if (style === 'dimension') {
        statusText.innerText = `尺寸標註模式：點擊線段以建立尺寸線`;
    }
    closeAllMenus();
}

function selectAngleStyle(style, continuous = false) {
    if (typeof continuous !== 'boolean') continuous = false;
    currentAngleStyle = style;
    isContinuousMarking = continuous;
    if (style === 'text') {
        const btn = document.getElementById('btn-mark-angle');
        btn.innerHTML = `<span class="btn-icon" style="font-size:20px; font-weight:bold; color:#d35400;">∑</span><span class="btn-text">角公式</span>`;
        if (selectedElements.length > 0) {
            const success = addSmartMark('angle');
            if (success && !continuous) {
                closeAllMenus();
                setMode('select');
                return;
            }
        }
        activateMarkMode('angle');
        statusText.innerText = "角度公式模式：請點擊頂點附近";
        closeAllMenus();
        return;
    }
    const btn = document.getElementById('btn-mark-angle');
    let svgIcon = "";
    if (style === 'arc') {
        svgIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 14 A 8 8 0 0 0 19 14" /></svg>`;
    } else if (style === 'double-arc') {
        svgIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 14 A 5 5 0 0 0 17 14" /> <path d="M4 14 A 8 8 0 0 0 20 14" /></svg>`;
    } else if (style === 'right') {
        svgIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 20 L 6 12 L 14 12" /></svg>`;
    } else {
        svgIcon = `<span class="btn-icon" style="font-size:22px;">Tx</span>`;
    }
    btn.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:24px;">${svgIcon}</div><span class="btn-text">角標</span>`;
    if (selectedElements.length > 0) {
        const success = addSmartMark('angle');
        if (success && !continuous) {
            closeAllMenus();
            setMode('select');
            return;
        }
    }
    activateMarkMode('angle');
    if (continuous) {
        statusText.innerText = "連續角度標記：請連續點擊頂點";
    }
    closeAllMenus();
}

function activateMarkMode(type) {
    mode = 'mark';
    markModeType = type;
    document.querySelectorAll('.tool-btn').forEach(btn => {
        if (btn.id === 'btn-toggle-grid' || btn.id === 'btn-snap-intersection') {
            return;
        }
    });
    if (type === 'edge') {
        document.getElementById('btn-mark-edge').classList.add('active');
        statusText.innerText = "邊長標記模式：請直接點擊線段";
    } else {
        document.getElementById('btn-mark-angle').classList.add('active');
        statusText.innerText = "角度標記模式：請直接點擊頂點附近";
    }
    svgCanvas.style.cursor = 'context-menu';
}

function toggleAlignMenu() {
    const menu = document.getElementById('menu-align');
    const btnWrapper = document.getElementById('btn-align').parentNode;
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        closeAllMenus();
        fixMenuPosition('menu-align', btnWrapper);
    }
}

function toggleStrokeWidthMenu() {
    const menu = document.getElementById('menu-stroke-width');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        closeAllMenus();
        menu.style.display = 'flex';
    }
}

function selectStrokeWidth(width, labelText) {
    document.getElementById('stroke-width-select').value = width;
    const preview = document.getElementById('stroke-width-preview');
    const label = document.getElementById('stroke-width-label');
    if (preview) preview.style.height = width + 'px';
    if (label) label.innerText = labelText;
    if (typeof onStyleChange === 'function') {
        onStyleChange('stroke-width');
    }
    document.getElementById('menu-stroke-width').style.display = 'none';
}

function executeAlign(type) {
    alignSelected(type);
    closeAllMenus();
}

function openAngleModal() {
    document.getElementById('angle-modal-overlay').style.display = 'block';
    document.getElementById('angle-input-modal').style.display = 'block';
    document.getElementById('angle-modal-input').value = currentAngleTextValue;
    document.getElementById('angle-modal-input').focus();
}

function closeAngleModal() {
    document.getElementById('angle-modal-overlay').style.display = 'none';
    document.getElementById('angle-input-modal').style.display = 'none';
}

function insertAngleSymbol(sym) {
    const input = document.getElementById('angle-modal-input');
    if (input.selectionStart || input.selectionStart === 0) {
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        input.value = input.value.substring(0, startPos) + sym + input.value.substring(endPos, input.value.length);
        input.selectionStart = startPos + sym.length;
        input.selectionEnd = startPos + sym.length;
    } else {
        input.value += sym;
    }
    input.focus();
}

function confirmAngleText() {
    const val = document.getElementById('angle-modal-input').value;
    currentAngleTextValue = val || 'θ';
    closeAngleModal();
    activateMarkMode('angle');
    const btn = document.getElementById('btn-mark-angle');
    btn.innerHTML = `<span class="btn-icon" style="font-size:22px;">Tx</span><span class="btn-text">角標</span>`;
}

function updateColorSelect(selectEl) {
    selectEl.style.color = selectEl.value;
    const color = selectEl.value;
    selectEl.style.color = color;
    const lineStyleSelect = document.getElementById('line-style-select');
    if (lineStyleSelect) {
        lineStyleSelect.style.color = color;
        Array.from(lineStyleSelect.options).forEach(opt => {
            opt.style.color = color;
            opt.style.fontWeight = 'bold';
        });
    }
}

function toggleLabelDirection() {
    isLabelClockwise = !isLabelClockwise;
    const btn = document.getElementById('btn-label-dir');
    if (isLabelClockwise) {
        btn.innerHTML = '↻';
        btn.title = "切換標註順序 (目前: 順時針)";
    } else {
        btn.innerHTML = '↺';
        btn.title = "切換標註順序 (目前: 逆時針)";
    }
    if (selectedElements.length > 0) {
        selectedElements.forEach(el => {
            reorderLabels(el);
        });
        statusText.innerText = `已更新標註方向為：${isLabelClockwise ? "順時針" : "逆時針"}`;
        saveState();
    } else {
        statusText.innerText = `標註方向已設定為：${isLabelClockwise ? "順時針" : "逆時針"} (下次繪圖生效)`;
    }
}

function updateLabelInput() {
    const nextLabel = indexToLabel(labelIndex);
    const input = document.getElementById('label-start-input');
    if (input) input.value = nextLabel;
}

function setLabelIndexFromInput() {
    const input = document.getElementById('label-start-input');
    let val = input.value.trim().toUpperCase();
    if (!val) {
        val = 'A';
        input.value = 'A';
    }
    const firstChar = val.charCodeAt(0);
    if (firstChar >= 65 && firstChar <= 90) {
        let baseIndex = firstChar - 65;
        const suffixStr = val.substring(1);
        let suffixNum = 0;
        if (suffixStr && !isNaN(suffixStr)) {
            suffixNum = parseInt(suffixStr);
        }
        labelIndex = baseIndex + (suffixNum * 26);
        statusText.innerText = `下一個標註點已設定為：${val}`;
    } else {
        statusText.innerText = "格式錯誤：請輸入 A-Z 開頭的標籤";
        updateLabelInput();
    }
    input.blur();
}

function initSymbols() {
    symbolContainer.innerHTML = '';
    commonSymbols.forEach(sym => {
        const btn = document.createElement('div');
        btn.className = 'sym-btn';
        btn.textContent = sym;
        btn.onclick = () => insertAtCursor(textArea, sym);
        symbolContainer.appendChild(btn);
    });
}

function onStyleChange(changeType) {
    const colorSelect = document.getElementById('fill-color-select');
    const styleSelect = document.getElementById('fill-style-select');
    let strokeColor = document.getElementById('stroke-color-select').value;
    let lineStyleVal = document.getElementById('line-style-select').value;
    let fillColor = colorSelect.value;
    let fillStyle = styleSelect.value;
    let strokeWidth = document.getElementById('stroke-width-select').value;
    if (changeType === 'fill' && fillColor !== 'none') {
        lastFillColor = fillColor;
    }
    if (changeType === 'fill-style' && fillStyle !== 'solid' && fillColor === 'none') {
        fillColor = lastFillColor;
        colorSelect.value = fillColor;
        statusText.innerText = `已自動套用顏色：${fillColor}`;
    }
    if (selectedElements.length > 0) {
        let dashArray = "none";
        if (lineStyleVal === 'dashed') dashArray = "8,5";
        else if (lineStyleVal === 'dotted') dashArray = "2,4";
        else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
        selectedElements.forEach(el => {
            const tool = el.getAttribute('data-tool');
            const tagName = el.tagName;
            const isMark = tool && tool.startsWith('mark');
            const applyStyleToElement = (targetEl) => {
                if (targetEl.classList.contains('hit-line')) return;
                if (changeType === 'stroke') {
                    if (targetEl.tagName === 'text' || targetEl.getAttribute('data-tool') === 'point') {
                        targetEl.style.fill = strokeColor;
                    } else {
                        targetEl.style.stroke = strokeColor;
                    }
                }
                if (changeType === 'line-style') {
                    if (targetEl.tagName !== 'text' && targetEl.getAttribute('data-tool') !== 'point') {
                        targetEl.style.strokeDasharray = dashArray;
                    }
                }
                if (changeType === 'stroke-width') {
                    if (targetEl.tagName !== 'text' && targetEl.getAttribute('data-tool') !== 'point') {
                        targetEl.style.strokeWidth = strokeWidth;
                    }
                }
                if ((changeType === 'fill' || changeType === 'fill-style') && !isMark) {
                    if (targetEl.getAttribute('data-tool') !== 'line' && targetEl.getAttribute('data-tool') !== 'angle' && targetEl.getAttribute('data-tool') !== 'freehand' && !targetEl.classList.contains('visible-line')) {
                        updateShapeFill(targetEl, fillColor, fillStyle);
                    }
                }
            };
            if (tagName === 'g' || tool === 'group') {
                const children = el.querySelectorAll('*');
                children.forEach(child => {
                    if (['path', 'line', 'rect', 'circle', 'ellipse', 'polyline', 'polygon'].includes(child.tagName)) {
                        applyStyleToElement(child);
                    }
                });
            } else {
                applyStyleToElement(el);
            }
        });
        saveState();
        if (!(changeType === 'fill-style' && fillColor === lastFillColor && colorSelect.value !== 'none')) {
            statusText.innerText = "已更新選取物件的樣式。";
        }
    } else {
        let currentModeName = mode;
        if (mode === 'draw') currentModeName = "繪圖";
        else if (mode === 'select') currentModeName = "選取";
        else if (mode === 'mark') currentModeName = "標註";
        else if (mode === 'construct') currentModeName = "尺規作圖";
        statusText.innerText = `預設樣式已更新。目前模式：${currentModeName}`;
    }
}

function updateShapeFill(shape, color, style) {
    if (color === 'none') {
        shape.style.fill = 'none';
        return;
    }
    if (style === 'solid') {
        shape.style.fill = color;
        return;
    }
    const colorId = color.replace('#', '').replace(/[() ,.]/g, '');
    const patternId = `${style}-${colorId}`;
    let pattern = document.getElementById(patternId);
    if (!pattern) {
        const template = document.getElementById(style);
        if (template) {
            pattern = template.cloneNode(true);
            pattern.id = patternId;
            const children = pattern.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.getAttribute('stroke') === 'currentColor') {
                    child.setAttribute('stroke', color);
                }
                if (child.getAttribute('fill') === 'currentColor') {
                    child.setAttribute('fill', color);
                }
            }
            document.querySelector('defs').appendChild(pattern);
        }
    }
    if (pattern) {
        shape.style.fill = `url(#${patternId})`;
    } else {
        shape.style.fill = color;
    }
}

function resetToolIcons() {
    if (defaultToolIcons.construct) {
        document.getElementById('btn-construct').innerHTML = defaultToolIcons.construct;
    }
    if (defaultToolIcons.edge) {
        document.getElementById('btn-mark-edge').innerHTML = defaultToolIcons.edge;
    }
    if (defaultToolIcons.angle) {
        document.getElementById('btn-mark-angle').innerHTML = defaultToolIcons.angle;
    }
}

function setMode(newMode, tool = null) {
    isContinuousMarking = false;
    if (newMode === 'select') {
        isContinuousDraw = false;
    }
    resetToolIcons();
    closeAllMenus();
    mode = newMode;
    if (tool) currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
        if (btn.id === 'btn-toggle-grid' || btn.id === 'btn-snap-intersection') {
            return;
        }
        btn.classList.remove('active');
    });
    if (mode !== 'construct') {
        constructionStep = 0;
        tempConstructionSource = null;
        clearStep1Highlight();
        document.getElementById('cursor-tooltip').style.display = 'none';
    }
    if (mode === 'select') {
        document.getElementById('btn-select').classList.add('active');
        svgCanvas.classList.add('mode-select');
        svgCanvas.classList.remove('mode-draw');
        statusText.innerText = "選取模式：點擊選取，空白處拖拉可框選。";
    } else {
        deselectAll();
        if (currentSubTool) {
            const targetBtn = document.querySelector(`.shape-btn[onclick*="'${currentSubTool}'"]`);
            if (targetBtn) targetBtn.classList.add('active');
        }
        if (tool === 'text') document.getElementById('btn-text').classList.add('active');
        if (tool === 'math') document.getElementById('btn-math').classList.add('active');
        svgCanvas.classList.add('mode-draw');
        svgCanvas.classList.remove('mode-select');
        if (tool === 'math') statusText.innerText = "Math 模式：請點擊畫布位置以插入公式";
        else statusText.innerText = `繪圖模式：${currentSubTool}`;
    }
}
window.setMode = setMode;

function toggleInput(chkId, inputId) {
    const chk = document.getElementById(chkId);
    const inp = document.getElementById(inputId);
    if (chk && inp) {
        inp.disabled = !chk.checked;
        if (!chk.checked) inp.style.backgroundColor = "#f0f0f0";
        else inp.style.backgroundColor = "#fff";
    }
}

function closeAxesModal() {
    document.getElementById('axes-modal').style.display = 'none';
}

function clearRealBackground() {
    if (bgLayer.innerHTML === '') {
        statusText.innerText = "背景已經是空的了";
        return;
    }
    bgLayer.innerHTML = '';
    svgCanvas.classList.add('grid-bg-css');
    if (document.getElementById('btn-toggle-grid')) document.getElementById('btn-toggle-grid').classList.add('active');
    saveState();
    statusText.innerText = "已清除實體背景物件";
}

function toggleGrid() {
    svgCanvas.classList.toggle('grid-bg-css');
    const btn = document.getElementById('btn-toggle-grid');
    if (btn) {
        if (svgCanvas.classList.contains('grid-bg-css')) {
            btn.classList.add('active');
            statusText.innerText = "輔助格線：開啟";
        } else {
            btn.classList.remove('active');
            statusText.innerText = "輔助格線：隱藏";
        }
    }
    saveState();
}

function toggleConstructMode(type, continuous = false) {
    const btn = document.getElementById('btn-construct');
    isContinuousMarking = continuous;
    if (mode === 'construct' && constructionModeType === type && !continuous) {
        setMode('select');
        return;
    }
    closeAllMenus();
    if (type === 'tangent' && selectedElements.length === 1) {
        const target = selectedElements[0];
        const subTool = target.getAttribute('data-sub-tool');
        if (subTool === 'circle' || target.getAttribute('data-tool') === 'ellipse') {
            mode = 'construct';
            constructionModeType = 'tangent';
            constructionStep = 1;
            tempConstructionSource = target;
            deselectAll();
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btn.innerHTML = `<span class="btn-icon" style="font-size:22px;">○</span><span class="btn-text">尺規作圖</span>`;
            const msg = "作圖模式：步驟 2/2 - 請點擊圓外一點作切線";
            statusText.innerText = msg;
            if (typeof window.showToolTipImmediate === 'function') {
                window.showToolTipImmediate(msg);
            }
            return;
        }
    }
    if (selectedElements.length > 0) {
        const success = executeConstruction(type);
        if (success && !continuous) {
            setMode('select');
            return;
        }
    }
    mode = 'construct';
    constructionModeType = type;
    constructionStep = 0;
    tempConstructionSource = null;
    deselectAll();
    document.querySelectorAll('.tool-btn').forEach(b => {
        if (b.id !== 'btn-toggle-grid') b.classList.remove('active');
    });
    btn.classList.add('active');
    let icon = '';
    let hint = "";
    if (type === 'midpoint') {
        icon = '·';
        hint = "作圖模式：請點擊一條「線段」以產生中點";
    } else if (type === 'perpendicular') {
        icon = '⊥';
        hint = "作圖模式：請點擊一條「線段」以產生中垂線";
    } else if (type === 'perpendicular_point') {
        icon = '⟂';
        hint = "作圖模式：步驟 1/2 - 請點擊一點";
    } else if (type === 'median_line') {
        icon = '∕';
        hint = "作圖模式：步驟 1/2 - 請點擊一點";
    } else if (type === 'tangent') {
        icon = '○';
        hint = "作圖模式：步驟 1/2 - 請點擊一個「圓形」";
    } else if (type === 'connect_points') {
        icon = '/';
        hint = "作圖模式：步驟 1/2 - 請點擊第一個點 (端點或圓心)";
    } else if (type === 'parallel') {
        icon = '∥';
        hint = "作圖模式：步驟 1/2 - 請點擊一條「線段」作為參考";
    } else if (type === 'divide_line') {
        icon = '📏';
        hint = "作圖模式：請點擊一條「線段」進行等分";
    } else if (type === 'divide_angle') {
        icon = '∠';
        hint = "作圖模式：請點擊一個「角」或「多邊形頂點」進行平分";
    } else if (type === 'circumcenter') {
        icon = '🔵';
        hint = "作圖模式：請點擊一個「三角形」或「三個頂點」以繪製外心";
    } else if (type === 'incenter') {
        icon = '⚪';
        hint = "作圖模式：請點擊一個「三角形」或「三個頂點」以繪製內心";
    } else if (type === 'centroid') {
        icon = '⚖️';
        hint = "作圖模式：請點擊一個「三角形」或「三個頂點」以繪製重心";
    }
    btn.innerHTML = `<span class="btn-icon" style="font-size:22px;">${icon}</span><span class="btn-text">尺規作圖</span>`;
    const suffix = continuous ? " (連續模式)" : "";
    statusText.innerText = hint + suffix;
    if (typeof window.showToolTipImmediate === 'function') {
        window.showToolTipImmediate(hint);
    }
}

function getShapeCenter(shape) {
    if (shape.tagName === 'line') {
        return {
            x: (parseFloat(shape.getAttribute('x1')) + parseFloat(shape.getAttribute('x2'))) / 2,
            y: (parseFloat(shape.getAttribute('y1')) + parseFloat(shape.getAttribute('y2'))) / 2
        };
    }
    const bbox = shape.getBBox();
    return {
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2
    };
}

function rotatePoint(x, y, cx, cy, angleDeg) {
    const rad = angleDeg * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - cx;
    const dy = y - cy;
    return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos
    };
}

function getTransformRotation(shape) {
    const transform = shape.getAttribute('transform') || '';
    const match = /rotate\(([-0-9.]+)[, ]+([-0-9.]+)[, ]+([-0-9.]+)\)/.exec(transform);
    if (match) {
        return {
            angle: parseFloat(match[1]),
            cx: parseFloat(match[2]),
            cy: parseFloat(match[3])
        };
    }
    return {
        angle: 0,
        cx: 0,
        cy: 0
    };
}

function getRotation(shape) {
    const transform = shape.getAttribute('transform') || '';
    const match = /rotate\(([-0-9.]+)/.exec(transform);
    return match ? parseFloat(match[1]) : 0;
}

function moveShape(shape, dx, dy) {
    if (shape.parentNode && selectedElements.includes(shape.parentNode)) {
        return;
    }
    const isLabel = shape.classList.contains('vertex-label') || shape.getAttribute('data-is-label') === 'true';
    if (shape.hasAttribute('data-owner-shape') && !isLabel) {
        const ownerId = shape.getAttribute('data-owner-shape');
        const owner = document.getElementById(ownerId);
        const depType = shape.getAttribute('data-dependency-type');
        const isAutoUpdated = depType ||
            shape.hasAttribute('data-construction-type') ||
            shape.getAttribute('data-tool') === 'tangent' ||
            (shape.getAttribute('data-sub-tool') || '').includes('-angle');
        if (owner) {
            if (selectedElements.includes(owner)) {
                if (isAutoUpdated) {
                    return;
                }
            } else {
                moveShape(owner, dx, dy);
                if (isAutoUpdated) {
                    return;
                }
            }
        }
    }
    const tag = shape.tagName.toLowerCase();
    const tool = shape.getAttribute('data-tool');
    if (shape.getAttribute('transform') || tool === 'group' || tool === 'solid' || (tool === 'line' && tag === 'g')) {
        let matrix;
        const transformList = shape.transform.baseVal;
        if (transformList.numberOfItems === 0) {
            const svg = document.querySelector('svg');
            matrix = svg.createSVGMatrix();
        } else {
            transformList.consolidate();
            matrix = transformList.getItem(0).matrix;
        }
        matrix.e += dx;
        matrix.f += dy;
        const a = matrix.a.toFixed(6);
        const b = matrix.b.toFixed(6);
        const c = matrix.c.toFixed(6);
        const d = matrix.d.toFixed(6);
        const eVal = matrix.e.toFixed(6);
        const f = matrix.f.toFixed(6);
        shape.setAttribute('transform', `matrix(${a}, ${b}, ${c}, ${d}, ${eVal}, ${f})`);
    } else {
        const get = attr => parseFloat(shape.getAttribute(attr)) || 0;
        const set = (attr, val) => shape.setAttribute(attr, val);
        if (tag === 'text' || tool === 'math' || tag === 'foreignObject' || tag === 'image' || tag === 'rect' || tag === 'use') {
            set('x', get('x') + dx);
            set('y', get('y') + dy);
        } else if (tag === 'line') {
            set('x1', get('x1') + dx);
            set('y1', get('y1') + dy);
            set('x2', get('x2') + dx);
            set('y2', get('y2') + dy);
        } else if (tag === 'circle' || tag === 'ellipse') {
            set('cx', get('cx') + dx);
            set('cy', get('cy') + dy);
        } else if (tag === 'polygon' || tag === 'polyline') {
            const points = shape.getAttribute('points');
            if (points) {
                const newPoints = points.split(/\s+|,/).filter(p => p !== '').reduce((acc, val, i, arr) => {
                    if (i % 2 === 0) {
                        const x = parseFloat(val) + dx;
                        const y = parseFloat(arr[i + 1]) + dy;
                        acc.push(`${x},${y}`);
                    }
                    return acc;
                }, []).join(' ');
                shape.setAttribute('points', newPoints);
            }
        } else if (tag === 'path') {
            const d = shape.getAttribute('d');
            const newD = d.replace(/([a-zA-Z])\s*([^a-zA-Z]*)/g, function(match, command, paramsStr) {
                const params = paramsStr.trim().split(/[\s,]+/).filter(s => s !== "").map(parseFloat);
                if (params.length === 0) return match;
                const newParams = [...params];
                const upperCmd = command.toUpperCase();
                if (upperCmd === 'M' || upperCmd === 'L' || upperCmd === 'T') {
                    for (let i = 0; i < newParams.length; i += 2) {
                        newParams[i] += dx; newParams[i + 1] += dy;
                    }
                } else if (upperCmd === 'H') {
                    for (let i = 0; i < newParams.length; i++) newParams[i] += dx;
                } else if (upperCmd === 'V') {
                    for (let i = 0; i < newParams.length; i++) newParams[i] += dy;
                } else if (upperCmd === 'A') {
                    if (newParams.length >= 7) {
                        newParams[5] += dx; newParams[6] += dy;
                    }
                } else if (upperCmd === 'C') {
                    for (let i = 0; i < newParams.length; i += 2) {
                        newParams[i] += dx; newParams[i + 1] += dy;
                    }
                } else if (upperCmd === 'Q') {
                    for (let i = 0; i < newParams.length; i += 2) {
                        newParams[i] += dx; newParams[i + 1] += dy;
                    }
                }
                return command + " " + newParams.map(n => parseFloat(n.toFixed(2))).join(" ");
            });
            if (shape.hasAttribute('data-center-x')) {
                shape.setAttribute('data-center-x', parseFloat(shape.getAttribute('data-center-x')) + dx);
                shape.setAttribute('data-center-y', parseFloat(shape.getAttribute('data-center-y')) + dy);
            }
            shape.setAttribute('d', newD);
        }
    }
    if (shape.id) {
        const circleAngles = document.querySelectorAll(`.shape[data-owner-circle-id="${shape.id}"]`);
        circleAngles.forEach(angleGroup => {
            const dataNodes = angleGroup.querySelectorAll('.vertex-data');
            dataNodes.forEach(pt => {
                let ox = parseFloat(pt.getAttribute('cx'));
                let oy = parseFloat(pt.getAttribute('cy'));
                pt.setAttribute('cx', ox + dx);
                pt.setAttribute('cy', oy + dy);
            });
            if (typeof redrawCircleAngle === 'function') {
                redrawCircleAngle(angleGroup);
            }
            if (typeof refreshAngleLabels === 'function') {
                refreshAngleLabels(angleGroup);
            }
        });
    }
    if (typeof updateDependentShapes === 'function') {
        updateDependentShapes(shape);
    }
    if (typeof updateLabelPositions === 'function') {
        updateLabelPositions(shape);
    }
    if (typeof refreshIntersectionAngles === 'function') {
        refreshIntersectionAngles(shape);
    }
}

function getMousePos(evt) {
    const CTM = svgCanvas.getScreenCTM();
    const lockCheck = document.getElementById('lock-coords');
    const inputX = document.getElementById('input-coord-x');
    const inputY = document.getElementById('input-coord-y');
    let realX = (evt.clientX - CTM.e) / CTM.a;
    let realY = (evt.clientY - CTM.f) / CTM.d;
    if (lockCheck && lockCheck.checked) {
        let lx = parseFloat(inputX.value);
        let ly = parseFloat(inputY.value);
        if (!isNaN(lx)) realX = lx;
        if (!isNaN(ly)) realY = ly;
    }
    return {
        x: realX,
        y: realY
    };
}

function scaleElementFromCenter(el, scale) {
    const subTool = el.getAttribute('data-sub-tool');
    if (subTool === 'pie-chart') {
        const oldR = parseFloat(el.getAttribute('data-radius'));
        const newR = oldR * scale;
        el.setAttribute('data-radius', newR);
        redrawPieChart(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }
    const ctm = el.getCTM();
    let bbox;
    try {
        bbox = el.getBBox();
    } catch (e) {
        console.error("無法取得 BBox 進行縮放:", el);
        return;
    }
    const local_cx = bbox.x + bbox.width / 2;
    const local_cy = bbox.y + bbox.height / 2;
    const svg = el.ownerSVGElement;
    let pt = svg.createSVGPoint();
    pt.x = local_cx;
    pt.y = local_cy;
    const global_center = pt.matrixTransform(ctm);
    const global_cx = global_center.x;
    const global_cy = global_center.y;
    const scaleMatrix = svg.createSVGMatrix()
        .translate(global_cx, global_cy)
        .scale(scale)
        .translate(-global_cx, -global_cy);
    let currentMatrix;
    if (el.transform.baseVal.numberOfItems > 0) {
        el.transform.baseVal.consolidate();
        currentMatrix = el.transform.baseVal.getItem(0).matrix;
    } else {
        currentMatrix = svg.createSVGMatrix();
    }
    const newMatrix = scaleMatrix.multiply(currentMatrix);
    const a = newMatrix.a.toFixed(6);
    const b = newMatrix.b.toFixed(6);
    const c = newMatrix.c.toFixed(6);
    const d = newMatrix.d.toFixed(6);
    const e_val = newMatrix.e.toFixed(6);
    const f = newMatrix.f.toFixed(6);
    el.setAttribute('transform', `matrix(${a}, ${b}, ${c}, ${d}, ${e_val}, ${f})`);
    if (el.getAttribute('data-tool') === 'ellipse' || el.getAttribute('data-sub-tool') === 'circle') {
        const circleAngles = document.querySelectorAll(`.shape[data-owner-circle-id="${el.id}"]`);
        circleAngles.forEach(group => {
            const dataNodes = group.querySelectorAll('.vertex-data');
            const gc = global_center;
            dataNodes.forEach(pt => {
                const px = parseFloat(pt.getAttribute('cx'));
                const py = parseFloat(pt.getAttribute('cy'));
                const dx = px - gc.x;
                const dy = py - gc.y;
                const newX = gc.x + dx * scale;
                const newY = gc.y + dy * scale;
                pt.setAttribute('cx', newX);
                pt.setAttribute('cy', newY);
            });
            if (typeof redrawCircleAngle === 'function') redrawCircleAngle(group);
            if (typeof updateLabelPositions === 'function') updateLabelPositions(group);
            const childMarks = document.querySelectorAll(`[data-owner-angle-shape="${group.id}"]`);
            childMarks.forEach(m => m.remove());
            if (typeof generateAngleLabels === 'function') {
                generateAngleLabels(group, true);
            }
        });
    }
    if (typeof updateLabelPositions === 'function') {
        updateLabelPositions(el);
    }
    if (el.getAttribute('data-tool') === 'ellipse' || el.getAttribute('data-sub-tool') === 'circle') {
        const circleAngles = document.querySelectorAll(`.shape[data-owner-circle-id="${el.id}"]`);
        circleAngles.forEach(group => {
            const m = el.getCTM();
            const cx = parseFloat(el.getAttribute('cx') || 0) * m.a + m.e;
            const cy = parseFloat(el.getAttribute('cy') || 0) * m.d + m.f;
            const dataNodes = group.querySelectorAll('.vertex-data');
            dataNodes.forEach(pt => {
                const px = parseFloat(pt.getAttribute('cx'));
                const py = parseFloat(pt.getAttribute('cy'));
                const dx = px - cx;
                const dy = py - cy;
                const newX = cx + (dx * scale);
                const newY = cy + (dy * scale);
                pt.setAttribute('cx', newX);
                pt.setAttribute('cy', newY);
            });
            if (typeof redrawCircleAngle === 'function') redrawCircleAngle(group);
        });
    }
    if (el.getAttribute('data-tool') === 'polygon' || el.getAttribute('data-tool') === 'tri') {
        updateDependentShapes(el);
    }
}

function alignSelected(type) {
    if (selectedElements.length === 0) return;
    const alignToCanvas = document.getElementById('chk-align-canvas') && document.getElementById('chk-align-canvas').checked;
    const svg = document.getElementById('svg-canvas');
    const canvasW = parseFloat(svg.getAttribute('width')) || 800;
    const canvasH = parseFloat(svg.getAttribute('height')) || 600;
    const bounds = selectedElements.map(el => {
        const bbox = el.getBBox();
        let tx = 0, ty = 0;
        const t = el.getAttribute('transform');
        if (t && t.includes('translate')) {
            const m = /translate\(([-0-9.]+)[, ]+([-0-9.]+)\)/.exec(t);
            if (m) { tx = parseFloat(m[1]); ty = parseFloat(m[2]); }
        }
        return {
            el: el,
            x: bbox.x + tx,
            y: bbox.y + ty,
            w: bbox.width,
            h: bbox.height,
            cx: bbox.x + tx + bbox.width / 2,
            cy: bbox.y + ty + bbox.height / 2
        };
    });
    let targetVal = 0;
    if (alignToCanvas) {
        if (type === 'left') targetVal = 0;
        if (type === 'right') targetVal = canvasW;
        if (type === 'top') targetVal = 0;
        if (type === 'bottom') targetVal = canvasH;
        if (type === 'center-x') targetVal = canvasW / 2;
        if (type === 'center-y') targetVal = canvasH / 2;
        if (type === 'dist-h') {
            if (bounds.length < 2) return;
            bounds.sort((a, b) => a.cx - b.cx);
            const step = canvasW / (bounds.length + 1);
            bounds.forEach((b, i) => {
                const newCx = step * (i + 1);
                moveShape(b.el, newCx - b.cx, 0);
            });
            saveState();
            if (selectedElements.length === 1) drawHandles(selectedElements[0]);
            return;
        }
        if (type === 'dist-v') {
            if (bounds.length < 2) return;
            bounds.sort((a, b) => a.cy - b.cy);
            const step = canvasH / (bounds.length + 1);
            bounds.forEach((b, i) => {
                const newCy = step * (i + 1);
                moveShape(b.el, 0, newCy - b.cy);
            });
            saveState();
            if (selectedElements.length === 1) drawHandles(selectedElements[0]);
            return;
        }
        bounds.forEach(b => {
            let dx = 0, dy = 0;
            if (type === 'left') dx = targetVal - b.x;
            else if (type === 'right') dx = targetVal - (b.x + b.w);
            else if (type === 'top') dy = targetVal - b.y;
            else if (type === 'bottom') dy = targetVal - (b.y + b.h);
            else if (type === 'center-x') dx = targetVal - b.cx;
            else if (type === 'center-y') dy = targetVal - b.cy;
            moveShape(b.el, dx, dy);
        });
    } else {
        if (selectedElements.length < 2) return;
        if (type === 'left') targetVal = Math.min(...bounds.map(b => b.x));
        if (type === 'right') targetVal = Math.max(...bounds.map(b => b.x + b.w));
        if (type === 'top') targetVal = Math.min(...bounds.map(b => b.y));
        if (type === 'bottom') targetVal = Math.max(...bounds.map(b => b.y + b.h));
        if (type === 'center-x') {
            const minX = Math.min(...bounds.map(b => b.x));
            const maxX = Math.max(...bounds.map(b => b.x + b.w));
            targetVal = (minX + maxX) / 2;
        }
        if (type === 'center-y') {
            const minY = Math.min(...bounds.map(b => b.y));
            const maxY = Math.max(...bounds.map(b => b.y + b.h));
            targetVal = (minY + maxY) / 2;
        }
        if (type.startsWith('dist')) {
            if (type === 'dist-h') {
                bounds.sort((a, b) => a.cx - b.cx);
                const totalW = bounds[bounds.length - 1].cx - bounds[0].cx;
                const step = totalW / (bounds.length - 1);
                bounds.forEach((b, i) => {
                    const newCx = bounds[0].cx + i * step;
                    moveShape(b.el, newCx - b.cx, 0);
                });
            }
            if (type === 'dist-v') {
                bounds.sort((a, b) => a.cy - b.cy);
                const totalH = bounds[bounds.length - 1].cy - bounds[0].cy;
                const step = totalH / (bounds.length - 1);
                bounds.forEach((b, i) => {
                    const newCy = bounds[0].cy + i * step;
                    moveShape(b.el, 0, newCy - b.cy);
                });
            }
        } else {
            bounds.forEach(b => {
                let dx = 0, dy = 0;
                if (type === 'left') dx = targetVal - b.x;
                else if (type === 'right') dx = targetVal - (b.x + b.w);
                else if (type === 'top') dy = targetVal - b.y;
                else if (type === 'bottom') dy = targetVal - (b.y + b.h);
                else if (type === 'center-x') dx = targetVal - b.cx;
                else if (type === 'center-y') dy = targetVal - b.cy;
                moveShape(b.el, dx, dy);
            });
        }
    }
    saveState();
    if (selectedElements.length === 1) drawHandles(selectedElements[0]);
}

function rotateFixed(e, step) {
    if (e) e.preventDefault();
    if (selectedElements.length === 0) {
        statusText.innerText = "請先選取要旋轉的物件";
        return;
    }
    const rotationDisplay = document.getElementById('rotation-display');
    let finalDisplayAngle = 0;
    selectedElements.forEach(shape => {
        let currentAbs = getTrueRotation(shape);
        let currentCCW = ((-currentAbs % 360) + 360) % 360;
        let targetCCW = 0;
        if (step === 0 || (e && e.button === 2)) {
            targetCCW = 0;
        } else {
            let snapped = Math.round(currentCCW / 90) * 90;
            targetCCW = (snapped + 90) % 360;
        }
        applyAbsoluteRotation(shape, -targetCCW);
        finalDisplayAngle = targetCCW;
    });
    if (rotationDisplay) rotationDisplay.innerText = `${finalDisplayAngle}°`;
    if (selectedElements.length === 1) drawHandles(selectedElements[0]);
    saveState();
    statusText.innerText = `已旋轉至 ${finalDisplayAngle}°`;
}

function rotateSpecific() {
    const input = document.getElementById('input-angle-custom');
    const val = parseFloat(input.value);
    if (isNaN(val)) {
        showAlert("請輸入有效的角度數字");
        return;
    }
    if (selectedElements.length === 0) {
        statusText.innerText = "請先選取要旋轉的物件";
        return;
    }
    const targetAngle = -Math.abs(val);
    selectedElements.forEach(shape => {
        applyAbsoluteRotation(shape, targetAngle);
    });
    if (selectedElements.length === 1) drawHandles(selectedElements[0]);
    saveState();
    statusText.innerText = `已設定角度為 ${targetAngle}°`;
}

function applyAbsoluteRotation(shape, targetAngleDeg) {
    if (shape.hasAttribute('data-owner-shape')) {
        const ownerId = shape.getAttribute('data-owner-shape');
        const owner = document.getElementById(ownerId);
        if (owner) {
            applyAbsoluteRotation(owner, targetAngleDeg);
            return;
        }
    }
    let cx, cy;
    const transformStr = shape.getAttribute('transform') || '';
    const matchRot = /rotate\(([-0-9.]+)[, ]+([-0-9.]+)[, ]+([-0-9.]+)\)/.exec(transformStr);
    if (matchRot && matchRot.length >= 4) {
        cx = parseFloat(matchRot[2]); cy = parseFloat(matchRot[3]);
    } else {
        let bbox;
        try { bbox = shape.getBBox(); } catch (e) { bbox = { x: 0, y: 0, width: 0, height: 0 }; }
        let tx = 0, ty = 0;
        const matchTr = /translate\(([-0-9.]+),\s*([-0-9.]+)\)/.exec(transformStr);
        if (matchTr) {
            tx = parseFloat(matchTr[1]); ty = parseFloat(matchTr[2]);
            if (bbox.width > 0) { cx = bbox.x + tx + bbox.width / 2; cy = bbox.y + ty + bbox.height / 2; }
            else { cx = tx; cy = ty; }
        } else {
            const center = getShapeCenter(shape); cx = center.x; cy = center.y;
        }
    }
    const currentAngle = getTrueRotation(shape);
    const delta = targetAngleDeg - currentAngle;
    if (Math.abs(delta) < 0.01) return;
    let currentMatrix;
    if (shape.transform.baseVal.numberOfItems > 0) {
        shape.transform.baseVal.consolidate();
        currentMatrix = shape.transform.baseVal.getItem(0).matrix;
    } else {
        currentMatrix = svgCanvas.createSVGMatrix();
    }
    const rotMatrix = svgCanvas.createSVGMatrix().translate(cx, cy).rotate(delta).translate(-cx, -cy);
    const newMatrix = rotMatrix.multiply(currentMatrix);
    const a = newMatrix.a.toFixed(6); const b = newMatrix.b.toFixed(6);
    const c = newMatrix.c.toFixed(6); const d = newMatrix.d.toFixed(6);
    const e_val = newMatrix.e.toFixed(6); const f = newMatrix.f.toFixed(6);
    shape.setAttribute('transform', `matrix(${a}, ${b}, ${c}, ${d}, ${e_val}, ${f})`);
    setTimeout(() => {
        if (typeof updateDependentShapes === 'function') {
            updateDependentShapes(shape);
        }
        if (typeof updateLabelPositions === 'function') {
            updateLabelPositions(shape);
        }
    }, 0);
}

function getTrueRotation(shape) {
    let matrix;
    const transform = shape.getAttribute('transform') || '';
    const matchM = /matrix\(([^)]+)\)/.exec(transform);
    if (matchM) {
        const vals = matchM[1].split(/[\s,]+/).map(parseFloat);
        return Math.atan2(vals[1], vals[0]) * (180 / Math.PI);
    }
    if (shape.transform && shape.transform.baseVal.numberOfItems > 0) {
        shape.transform.baseVal.consolidate();
        matrix = shape.transform.baseVal.getItem(0).matrix;
        return Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    }
    const matchR = /rotate\(([-0-9.]+)/.exec(transform);
    if (matchR) {
        return parseFloat(matchR[1]);
    }
    return 0;
}

function toggleCircleAngleMenu() {
    const menu = document.getElementById('menu-circle-angles');
    const btnWrapper = document.getElementById('btn-circle-angles').parentNode;
    const isVisible = (menu.style.display === 'flex');
    closeAllMenus();
    if (!isVisible) {
        fixMenuPosition('menu-circle-angles', btnWrapper);
    }
}

function toggleCircleAngleMode(type) {
    const btn = document.getElementById('btn-circle-angles');
    if (mode === 'construct' && constructionModeType === type) {
        setMode('select');
        return;
    }
    closeAllMenus();
    mode = 'construct';
    constructionModeType = type;
    constructionStep = 0;
    tempConstructionSource = null;
    deselectAll();
    document.querySelectorAll('.tool-btn').forEach(b => {
        if (b.id !== 'btn-toggle-grid') b.classList.remove('active');
    });
    btn.classList.add('active');
    let hint = "";
    if (type === 'central') hint = "步驟 1/2：請在圓周上點擊第一點";
    else if (type === 'inscribed') hint = "步驟 1/3：請在圓周上點擊第一個端點 (A)";
    else if (type === 'tangent-chord') hint = "步驟 1/2：請在圓周上點擊切點 (P)";
    statusText.innerText = hint;
    if (typeof window.showToolTipImmediate === 'function') {
        window.showToolTipImmediate(hint);
    }
}

function closeAllMenus() {
    const ids = ['menu-edge', 'menu-angle', 'menu-align', 'menu-construct', 'menu-stroke-width', 'menu-circle-angles'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function resetToolIcons() {
    if (defaultToolIcons.construct) {
        document.getElementById('btn-construct').innerHTML = defaultToolIcons.construct;
    }
    if (defaultToolIcons.edge) {
        document.getElementById('btn-mark-edge').innerHTML = defaultToolIcons.edge;
    }
    if (defaultToolIcons.angle) {
        document.getElementById('btn-mark-angle').innerHTML = defaultToolIcons.angle;
    }
}

function toggleIntersectionSnapping() {
    const btn = document.getElementById('btn-snap-intersection');
    isIntersectionSnappingEnabled = !isIntersectionSnappingEnabled;
    if (isIntersectionSnappingEnabled) {
        btn.classList.add('active');
        statusText.innerText = "交點吸附模式：已開啟";
    } else {
        btn.classList.remove('active');
        statusText.innerText = "交點吸附模式：已關閉";
        hideSnapIndicator();
    }
}

function renderSliderControls(content, shape, params) {
    const type = shape.getAttribute('data-smart-type');
    const isSnapped = shape.getAttribute('data-snap') === 'true';
    const showFocus = shape.getAttribute('data-show-focus') === 'true';
    const toolsRow = document.createElement('div');
    toolsRow.style.cssText = "display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #eee;";
    const snapLabel = document.createElement('label');
    snapLabel.style.fontSize = "12px";
    snapLabel.style.cursor = "pointer";
    snapLabel.innerHTML = `<input type="checkbox" id="chk-snap" ${isSnapped ? 'checked' : ''}> 吸附整數`;
    toolsRow.appendChild(snapLabel);
    if (type === 'quadratic') {
        const focusLabel = document.createElement('label');
        focusLabel.style.fontSize = "12px";
        focusLabel.style.cursor = "pointer";
        focusLabel.innerHTML = `<input type="checkbox" id="chk-focus" ${showFocus ? 'checked' : ''}> 焦點/準線`;
        toolsRow.appendChild(focusLabel);
        focusLabel.querySelector('input').addEventListener('change', (e) => {
            shape.setAttribute('data-show-focus', e.target.checked);
            updateSmartFunctionGraph(shape);
            saveState();
        });
    }
    content.appendChild(toolsRow);
    snapLabel.querySelector('input').addEventListener('change', (e) => {
        const snapped = e.target.checked;
        shape.setAttribute('data-snap', snapped);
        if (snapped) {
            for (let key in params) {
                params[key] = Math.round(params[key]);
            }
            shape.setAttribute('data-params', JSON.stringify(params));
            updateSmartFunctionGraph(shape);
        }
        renderPropertyPanel(shape);
    });
    let controls = [];
    const stepVal = isSnapped ? 1 : 0.1;
    if (type === 'linear') {
        controls = [
            { key: 'a', label: '斜率 a =', min: -5, max: 5, step: stepVal, color: '#e74c3c' },
            { key: 'b', label: '截距 b =', min: -10, max: 10, step: isSnapped ? 1 : 0.5, color: '#2980b9' }
        ];
    } else if (type === 'quadratic') {
        controls = [
            { key: 'a', label: '開口 a = ', min: -3, max: 3, step: stepVal, color: '#e74c3c' },
            { key: 'h', label: '水平 h = ', min: -10, max: 10, step: isSnapped ? 1 : 0.5, color: '#2980b9' },
            { key: 'k', label: '垂直 k = ', min: -10, max: 10, step: isSnapped ? 1 : 0.5, color: '#27ae60' }
        ];
    }
    controls.forEach(ctrl => {
        const wrapper = document.createElement('div');
        wrapper.className = 'param-row';
        const header = document.createElement('div');
        header.className = 'param-header';
        header.innerHTML = `<span style="color:${ctrl.color}">${ctrl.label}</span><span id="val-${ctrl.key}" style="color:${ctrl.color}">${params[ctrl.key]}</span>`;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'param-slider';
        slider.min = ctrl.min;
        slider.max = ctrl.max;
        slider.step = ctrl.step;
        slider.value = params[ctrl.key];
        slider.style.accentColor = ctrl.color;
        slider.oninput = (e) => {
            const newVal = parseFloat(e.target.value);
            document.getElementById(`val-${ctrl.key}`).innerText = newVal;
            params[ctrl.key] = newVal;
            shape.setAttribute('data-params', JSON.stringify(params));
            updateSmartFunctionGraph(shape);
        };
        slider.onchange = () => saveState();
        wrapper.appendChild(header);
        wrapper.appendChild(slider);
        content.appendChild(wrapper);
    });
    const plotBtnContainer = document.createElement('div');
    plotBtnContainer.style.cssText = "margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;";
    const plotBtn = document.createElement('button');
    plotBtn.innerHTML = "📍 標示點位";
    plotBtn.className = "tool-btn btn-labeled";
    plotBtn.style.width = "100%";
    plotBtn.title = "在函數圖形上標示一個 (x, y) 座標點";
    plotBtn.onclick = () => {
        openNumberInputModal("請輸入 X 值", "1", (val) => {
            const xValue = parseFloat(val);
            if (!isNaN(xValue)) {
                if (typeof plotPointOnFunction === 'function') {
                    plotPointOnFunction(shape, xValue);
                }
            } else {
                showAlert("請輸入有效的數字！");
            }
        });
    };
    plotBtnContainer.appendChild(plotBtn);
    content.appendChild(plotBtnContainer);
}

function renderCoefficientInputs(content, shape, params) {
    const type = shape.getAttribute('data-smart-type');
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = "text-align:center; padding:5px; border-bottom:1px solid #ddd; margin-bottom:10px; background:#f4f6f7;";
    let formulaTitle = "";
    if (type === 'linear_std') formulaTitle = "y = ax + b";
    else if (type === 'quadratic_std') formulaTitle = "y = ax² + bx + c";
    else if (type === 'inverse_std') formulaTitle = "y = k / x";
    headerDiv.innerHTML = `<div style="font-family:'Times New Roman'; font-weight:bold; font-size:16px; color:#2c3e50;">${formulaTitle}</div>`;
    content.appendChild(headerDiv);
    const createControl = (key, label) => {
        const row = document.createElement('div');
        row.className = 'param-row';
        row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;';
        row.innerHTML = `<label style="font-family:'Times New Roman'; font-weight:bold; font-size:16px; width:40px;">${label} =</label>`;
        const input = document.createElement('input');
        input.type = 'number';
        input.value = params[key];
        input.step = '0.1';
        input.style.cssText = 'width:120px; padding:4px; border:1px solid #ccc; border-radius:4px; text-align:right; font-size:14px;';
        input.oninput = (e) => {
            params[key] = parseFloat(e.target.value) || 0;
            shape.setAttribute('data-params', JSON.stringify(params));
            updateSmartFunctionGraph(shape);
        };
        input.onchange = () => saveState();
        row.appendChild(input);
        content.appendChild(row);
    };
    if (type === 'linear_std') {
        createControl('a', 'a');
        createControl('b', 'b');
    } else if (type === 'quadratic_std') {
        createControl('a', 'a');
        createControl('b', 'b');
        createControl('c', 'c');
    } else if (type === 'inverse_std') {
        createControl('k', 'k');
    }
}

function renderPropertyPanel(shape) {
    const panel = document.getElementById('smart-panel');
    const content = document.getElementById('smart-panel-content');
    const isOldSmart = shape && shape.hasAttribute('data-smart-type');
    const isNewStd = shape && shape.getAttribute('data-func-mode') === 'standard';
    if (!isOldSmart && !isNewStd) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'flex';
    content.innerHTML = '';
    const params = JSON.parse(shape.getAttribute('data-params'));
    if (isOldSmart) {
        renderSliderControls(content, shape, params);
    } else if (isNewStd) {
        renderStandardFuncPanel(content, shape, params);
    }
    const footer = document.createElement('div');
    footer.style.cssText = "margin-top:15px; text-align:center; border-top:1px solid #eee; padding-top:10px;";
    const finishBtn = document.createElement('button');
    finishBtn.innerText = "✔ 完成編輯\n (轉為靜態物件)";
    finishBtn.className = "btn-confirm";
    finishBtn.style.cssText = "width:100%; padding:8px; font-size:13px;";
    finishBtn.onclick = () => {
        const confirmMsg = `
			確定完成編輯？<br>這將移除參數面板，並將函數轉為正式寫法。<br><br>
			<label style="cursor:pointer; color:#2980b9; font-size: 14px;">
				<input type="checkbox" id="chk-finalize-keep-grid"> 保留座標格線
			</label>
		`;
        showConfirm(confirmMsg, () => {
            const keepGrid = document.getElementById('chk-finalize-keep-grid').checked;
            finalizeSmartGraph(shape, keepGrid);
            panel.style.display = 'none';
        }, null, "確認");
    };
    footer.appendChild(finishBtn);
    content.appendChild(footer);
}

function renderStandardFuncPanel(content, shape, params) {
    const type = shape.getAttribute('data-func-type');
    const config = STD_FUNCTIONS[type];
    const header = document.createElement('div');
    header.style.cssText = "text-align:center; padding:5px; background:#eee; font-weight:bold; color:#333; margin-bottom:10px;";
    header.innerText = config ? config.name : "函數係數設定";
    content.appendChild(header);
    for (let key in params) {
        const row = document.createElement('div');
        row.className = 'param-row';
        row.style.cssText = "display:flex; justify-content: flex-end; align-items:center; margin-bottom:8px; gap: 5px;";
        row.innerHTML = `<label style="font-family:'Times New Roman'; font-weight:bold; font-size:14px;">${key} = </label>`;
        const input = document.createElement('input');
        input.type = 'number';
        input.value = params[key];
        input.step = 0.1;
        input.style.cssText = "width:60px; padding:3px; text-align:center; border: 1px solid #ccc; border-radius: 4px; font-size:14px;";
        input.oninput = (e) => {
            params[key] = parseFloat(e.target.value) || 0;
            shape.setAttribute('data-params', JSON.stringify(params));
            updateStandardFunctionGraph(shape);
        };
        input.onchange = () => saveState();
        row.appendChild(input);
        content.appendChild(row);
    }
    const plotBtnContainer = document.createElement('div');
    plotBtnContainer.style.cssText = "margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;";
    const plotBtn = document.createElement('button');
    plotBtn.innerHTML = "📍 標示點位";
    plotBtn.className = "tool-btn btn-labeled";
    plotBtn.style.width = "100%";
    plotBtn.title = "在函數圖形上標示一個 (x, y) 座標點";
    plotBtn.onclick = () => {
        openNumberInputModal("請輸入 X 值", "1", (val) => {
            const xValue = parseFloat(val);
            if (!isNaN(xValue)) {
                if (typeof plotPointOnFunction === 'function') {
                    plotPointOnFunction(shape, xValue);
                }
            } else {
                showAlert("請輸入有效的數字！");
            }
        });
    };
    plotBtnContainer.appendChild(plotBtn);
    content.appendChild(plotBtnContainer);
}

function applyCanvasSize(width, height, mode = 'screen') {
    const svg = document.getElementById('svg-canvas');
    const drawingArea = document.getElementById('drawing-area');
    const clipRect = document.querySelector('#canvas-clip rect');
    currentCanvasMode = mode;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.width = width + 'px';
    svg.style.height = height + 'px';
    if (clipRect) {
        clipRect.setAttribute('width', width - 70);
        clipRect.setAttribute('height', height - 70);
    }
    const bgLayer = document.getElementById('background-layer');
    if (bgLayer && bgLayer.innerHTML !== '') {
    }
    localStorage.setItem('math_editor_canvas_size', `${width},${height},${mode}`);
    if (typeof statusText !== 'undefined' && statusText) {
        statusText.innerText = `畫布已設定為 ${width} x ${height} (${mode === 'print' ? '列印模式' : '螢幕模式'})`;
    }
    const infoDisplay = document.getElementById('canvas-info-display');
    if (infoDisplay) {
        const modeText = (mode === 'print') ? '🖨️ 列印' : '🖥️ 螢幕';
        infoDisplay.innerText = `${width} x ${height} (${modeText})`;
        if (mode === 'print') {
            infoDisplay.style.borderColor = '#e67e22';
            infoDisplay.style.color = '#d35400';
        } else {
            infoDisplay.style.borderColor = '#ccc';
            infoDisplay.style.color = '#34495e';
        }
    }
    saveState();
}

function triggerExportSelection() {
    if (selectedElements.length === 0) {
        showAlert('沒有選取的物件', '請先選取您想匯出的圖形。');
        return;
    }
    startExportProcess(true);
}

function openSubMenuAtContext(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    closeAllMenus();
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('right', 'auto', 'important');
    menu.style.setProperty('top', 'auto', 'important');
    menu.style.setProperty('left', 'auto', 'important');
    menu.style.display = 'flex';
    menu.style.position = 'fixed';
    menu.style.zIndex = '10001';
    const menuRect = menu.getBoundingClientRect();
    let menuX = lastContextPos.x;
    let menuY = lastContextPos.y + 5;
    if (menuX + menuRect.width > window.innerWidth) {
        menuX = window.innerWidth - menuRect.width - 5;
    }
    if (menuY + menuRect.height > window.innerHeight) {
        menuY = window.innerHeight - menuRect.height - 5;
    }
    menu.style.setProperty('left', `${menuX}px`, 'important');
    menu.style.setProperty('top', `${menuY}px`, 'important');
}