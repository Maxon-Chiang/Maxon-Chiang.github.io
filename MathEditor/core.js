let svgCanvas = document.getElementById('svg-canvas');
let bgLayer = document.getElementById('background-layer');
let shapesLayer = document.getElementById('shapes-layer');
let tempLayer = document.getElementById('temp-layer');
let handlesLayer = document.getElementById('handles-layer');
const statusText = document.getElementById('status-text');
const selectionRect = document.getElementById('selection-rect');
const drawingArea = document.getElementById('drawing-area');
const ns = "http://www.w3.org/2000/svg";
const textModal = document.getElementById('text-modal');
const textArea = document.getElementById('text-input-area');
const fontSizeSelect = document.getElementById('font-size-select');
const symbolContainer = document.getElementById('symbol-container');
let mode = 'draw';
let currentTool = 'line';
let currentSubTool = 'line-simple';
let polygonSides = 5;
let lastClickPos = { x: 0, y: 0 };
let pendingLabelInfo = null;
let pendingDimensionInfo = null;
let markModeType = null;
let isContinuousMarking = false;
let isContinuousDraw = false;
let isDirectClick = false;
let labelIndex = 0;
let currentEdgeStyle = '1';
let currentAngleStyle = 'arc';
let isLabelClockwise = false;
let currentAngleTextValue = 'θ';
let constructionModeType = null;
let constructionStep = 0;
let tempConstructionSource = null;
let step1HighlightObj = null;
let history = [];
let potentialSingleSelectTarget = null;
let historyIndex = -1;
const MAX_HISTORY = 50;
let isDragging = false;
let isBoxSelecting = false;
let startX, startY;
let boxStartX = 0;
let boxStartY = 0;
let currentShape = null;
let selectedElements = [];
let draggingHandleIndex = null;
let isRotating = false;
let isEditingText = false;
let editingTextElement = null;
let newTextPos = { x: 0, y: 0 };
let modalMode = 'text';
var isImportedContent = false;
let defaultToolIcons = {};
let symmetryStep = 0;
let clipboard = [];
let lastFillColor = '#7f8c8d';
let numberInputCallback = null;
let currentParamTool = null;
let isMathV2Init = false;
let currentProjectName = "MyMathGraph";
let currentFileHandle = null;
let isImportMode = false;
const SNAP_RADIUS = 15;
let isIntersectionSnappingEnabled = false;
let snapIndicator = null;
let lastContextPos = { x: 0, y: 0 };
window.currentClientX = 0;
window.currentClientY = 0;
window.showToolTipImmediate = function(text) {
    const tooltip = document.getElementById('cursor-tooltip');
    if (tooltip && text) {
        tooltip.style.display = 'block';
        tooltip.style.left = (window.currentClientX + 15) + 'px';
        tooltip.style.top = (window.currentClientY + 15) + 'px';
        tooltip.innerText = text;
    }
};
window.addEventListener('DOMContentLoaded', () => {
    const btnConstruct = document.getElementById('btn-construct');
    const btnEdge = document.getElementById('btn-mark-edge');
    const btnAngle = document.getElementById('btn-mark-angle');
    if (btnConstruct) defaultToolIcons.construct = btnConstruct.innerHTML;
    if (btnEdge) defaultToolIcons.edge = btnEdge.innerHTML;
    if (btnAngle) defaultToolIcons.angle = btnAngle.innerHTML;
    const cachedSize = localStorage.getItem('math_editor_canvas_size');
    if (cachedSize) {
        const parts = cachedSize.split(',');
        const w = parseInt(parts[0]);
        const h = parseInt(parts[1]);
        const mode = parts[2] || 'screen';
        if (!isNaN(w) && !isNaN(h)) {
            if (typeof applyCanvasSize === 'function') {
                applyCanvasSize(w, h, mode);
            }
        }
    }
    saveState();
    saveState();
    setShape('line-simple');
    if (svgCanvas.classList.contains('grid-bg-css')) {
        const btn = document.getElementById('btn-toggle-grid');
        if (btn) btn.classList.add('active');
    }
    if (typeof initBuiltinLibrary === 'function') {
        initBuiltinLibrary('builtin-library-container');
    }
    initSymbols();
    setTimeout(setupRightClickEvents, 500);
    const snapBtn = document.getElementById('btn-snap-intersection');
    if (snapBtn) snapBtn.classList.remove('active');
    const contextMenu = document.getElementById('context-menu');
    window.addEventListener('load', () => {
        const overlay = document.getElementById('app-loading-overlay');
        if (overlay) {
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }, 300);
        }
    });
    svgCanvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const pos = getMousePos(e);
        lastContextPos = { x: e.clientX, y: e.clientY };
        if (mode === 'symmetry') {
            if (symmetryStep === 0) {
                if (selectedElements.length > 0) {
                    symmetryStep = 1; statusText.innerText = "步驟 2/2：請畫對稱軸"; handlesLayer.innerHTML = '';
                } else { statusText.innerText = "尚未選取物件！"; }
            } else { setMode('select'); statusText.innerText = "已取消對稱作圖"; }
            return;
        }
        if (mode === 'draw' && typeof isContinuousDraw !== 'undefined' && isContinuousDraw) {
            isContinuousDraw = false; setMode('select'); statusText.innerText = "已結束連續繪圖模式。";
            return;
        }
        if (typeof isContinuousMarking !== 'undefined' && isContinuousMarking) {
            isContinuousMarking = false; closeAllMenus();
            document.getElementById('btn-mark-edge').classList.remove('active');
            document.getElementById('btn-mark-angle').classList.remove('active');
            if (mode === 'mark') setMode('select');
            statusText.innerText = "已結束連續標註模式。";
            return;
        }
        if (mode === 'construct') {
            constructionModeType = null; constructionStep = 0; tempConstructionSource = null;
            const tempLine = document.querySelector('.temp-construction-line');
            if (tempLine) tempLine.remove();
            if (typeof window.clearAllHighlightPoints === 'function') window.clearAllHighlightPoints();
            closeAllMenus();
            document.getElementById('btn-construct').classList.remove('active');
            setMode('select');
            statusText.innerText = "已結束尺規作圖模式。";
            return;
        }
        const contextMenu = document.getElementById('context-menu');
        let targetShape = e.target.closest('.shape');
        if (targetShape) {
            let parent = targetShape.parentNode;
            while (parent && parent.getAttribute && parent.getAttribute('data-tool') === 'group') {
                targetShape = parent;
                parent = parent.parentNode;
            }
        }
        if (targetShape && !selectedElements.includes(targetShape)) {
            deselectAll();
            addToSelection(targetShape);
        }
        else if (!targetShape) {
            deselectAll();
        }
        buildContextMenu(selectedElements);
        contextMenu.style.display = 'block';
        const menuRect = contextMenu.getBoundingClientRect();
        let menuX = e.clientX;
        let menuY = e.clientY;
        if (menuX + menuRect.width > window.innerWidth) {
            menuX = window.innerWidth - menuRect.width - 5;
        }
        if (menuY + menuRect.height > window.innerHeight) {
            menuY = window.innerHeight - menuRect.height - 5;
        }
        contextMenu.style.left = `${menuX}px`;
        contextMenu.style.top = `${menuY}px`;
    });
    window.addEventListener('click', () => {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) contextMenu.style.display = 'none';
    });
});
function redrawSolid(shape) {
    const subTool = shape.getAttribute('data-sub-tool');
    const visiblePath = shape.querySelector('.solid-visible');
    const hiddenPath = shape.querySelector('.solid-hidden');
    if (!visiblePath || !hiddenPath) return;
    let dVis = "", dHid = "";
    if (subTool === 'solid-cube') {
        const x = parseFloat(shape.getAttribute('data-x'));
        const y = parseFloat(shape.getAttribute('data-y'));
        const w = parseFloat(shape.getAttribute('data-w'));
        const h = parseFloat(shape.getAttribute('data-h'));
        const dx = parseFloat(shape.getAttribute('data-dx'));
        const dy = parseFloat(shape.getAttribute('data-dy'));
        const f1 = { x: x, y: y };
        const f2 = { x: x + w, y: y };
        const f3 = { x: x + w, y: y + h };
        const f4 = { x: x, y: y + h };
        const b1 = { x: f1.x + dx, y: f1.y + dy };
        const b2 = { x: f2.x + dx, y: f2.y + dy };
        const b3 = { x: f3.x + dx, y: f3.y + dy };
        const b4 = { x: f4.x + dx, y: f4.y + dy };
        dVis = `M ${f1.x} ${f1.y} L ${f2.x} ${f2.y} L ${f3.x} ${f3.y} L ${f4.x} ${f4.y} Z 
                M ${f2.x} ${f2.y} L ${b2.x} ${b2.y} L ${b3.x} ${b3.y} L ${f3.x} ${f3.y} 
                M ${f1.x} ${f1.y} L ${b1.x} ${b1.y} L ${b2.x} ${b2.y}`;
        dHid = `M ${f4.x} ${f4.y} L ${b4.x} ${b4.y} L ${b3.x} ${b3.y} M ${b4.x} ${b4.y} L ${b1.x} ${b1.y}`;
    } else if (subTool === 'solid-cylinder') {
        const cx = parseFloat(shape.getAttribute('data-cx'));
        const cy = parseFloat(shape.getAttribute('data-cy'));
        const r = parseFloat(shape.getAttribute('data-r'));
        const h = parseFloat(shape.getAttribute('data-h'));
        const ry = r * 0.3;
        const topY = cy;
        const botY = cy + h;
        dVis = `M ${cx-r} ${topY} A ${r} ${ry} 0 1 1 ${cx+r} ${topY} A ${r} ${ry} 0 1 1 ${cx-r} ${topY} 
                M ${cx-r} ${topY} L ${cx-r} ${botY} 
                M ${cx+r} ${topY} L ${cx+r} ${botY} 
                M ${cx-r} ${botY} A ${r} ${ry} 0 0 0 ${cx+r} ${botY}`;
        dHid = `M ${cx-r} ${botY} A ${r} ${ry} 0 0 1 ${cx+r} ${botY}`;
    } else if (subTool === 'solid-cone') {
        const cx = parseFloat(shape.getAttribute('data-cx'));
        const cy = parseFloat(shape.getAttribute('data-cy'));
        const r = parseFloat(shape.getAttribute('data-r'));
        const h = parseFloat(shape.getAttribute('data-h'));
        const ry = r * 0.3;
        const botY = cy + h;
        dVis = `M ${cx-r} ${botY} L ${cx} ${cy} L ${cx+r} ${botY} 
                M ${cx-r} ${botY} A ${r} ${ry} 0 0 0 ${cx+r} ${botY}`;
        dHid = `M ${cx-r} ${botY} A ${r} ${ry} 0 0 1 ${cx+r} ${botY}`;
    }
    visiblePath.setAttribute('d', dVis);
    hiddenPath.setAttribute('d', dHid);
}
function showSnapIndicator(p) {
    if (!snapIndicator) {
        snapIndicator = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        snapIndicator.setAttribute('r', '6');
        snapIndicator.style.cssText = "fill: #ff4757; stroke: white; stroke-width: 2px; pointer-events: none; opacity: 0.8;";
        document.getElementById('temp-layer').appendChild(snapIndicator);
    }
    snapIndicator.setAttribute('cx', p.x);
    snapIndicator.setAttribute('cy', p.y);
    snapIndicator.style.display = 'block';
}
function hideSnapIndicator() {
    if (snapIndicator) {
        snapIndicator.style.display = 'none';
    }
}
window.addEventListener('click', function(e) {
    if (!e.target.closest('.tool-btn-wrapper')) {
        closeAllMenus();
    }
    const menu = document.getElementById('header-export-menu');
    const btn = e.target.closest('button');
    if (menu && menu.style.display === 'block' && (!btn || !btn.innerHTML.includes('匯出'))) {
        menu.style.display = 'none';
    }
});
svgCanvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) hideSnapIndicator();
    if (e.button === 2) return;
    const pos = getMousePos(e);
    lastClickPos = { x: pos.x, y: pos.y };
    startX = pos.x;
    startY = pos.y;
    if (mode === 'symmetry' && symmetryStep === 1) {
        isDragging = true;
        currentShape = document.createElementNS(ns, "line");
        currentShape.setAttribute('x1', startX);
        currentShape.setAttribute('y1', startY);
        currentShape.setAttribute('x2', startX);
        currentShape.setAttribute('y2', startY);
        currentShape.style.cssText = "stroke: #e67e22; stroke-width: 2; stroke-dasharray: 5,5; opacity: 0.7; pointer-events: none;";
        tempLayer.appendChild(currentShape);
        return;
    }
    isDirectClick = false;
    let target = e.target;
    let foundShape = null;
    while (target && target !== svgCanvas) {
        if (target.classList && target.classList.contains('shape')) {
            foundShape = target;
            if (target.parentNode.getAttribute('data-tool') === 'group') {
                target = target.parentNode;
                continue;
            }
            break;
        }
        target = target.parentNode;
    }
    const isShape = !!foundShape;
    target = foundShape;
    if (mode === 'construct') {
        const allowEmptyClick = (
            constructionModeType === 'connect_points' ||
            (constructionModeType === 'tangent' && constructionStep === 1) ||
            (constructionModeType === 'parallel' && constructionStep === 1) ||
            (constructionModeType === 'perpendicular_point' && constructionStep === 0) ||
            (constructionModeType === 'median_line' && constructionStep === 0)
        );
        if (!isShape && !allowEmptyClick) {
            setMode('select');
            statusText.innerText = "已取消作圖模式";
            if (typeof window.clearAllHighlightPoints === 'function') {
                window.clearAllHighlightPoints();
            }
        }
        return;
    }
    if (mode === 'mark') {
        autoApplyMark(pos.x, pos.y);
        return;
    }
    if (mode === 'select' || (mode === 'symmetry' && symmetryStep === 0)) {
        if (e.target.classList.contains('rotate-handle')) {
            isRotating = true;
            statusText.innerText = "旋轉模式：拖曳滑鼠旋轉物件 (按住 Shift 鎖定 15 度)";
            return;
        }
        if (e.target.classList.contains('vertex-handle')) {
            isDragging = true;
            draggingHandleIndex = parseInt(e.target.getAttribute('data-index'));
            return;
        }
        if (isShape) {
            e.preventDefault();
            isDirectClick = true;
            if (!e.shiftKey) {
                if (selectedElements.includes(target)) {
                    potentialSingleSelectTarget = target;
                } else {
                    deselectAll();
                    addToSelection(target);
                    potentialSingleSelectTarget = null;
                }
            } else {
                potentialSingleSelectTarget = null;
                if (selectedElements.includes(target)) removeFromSelection(target);
                else addToSelection(target);
            }
            isDragging = true;
            return;
        }
        closeAllMenus();
        deselectAll();
        isBoxSelecting = true;
        const rect = drawingArea.getBoundingClientRect();
        boxStartX = e.clientX - rect.left;
        boxStartY = e.clientY - rect.top;
        selectionRect.style.left = boxStartX + 'px';
        selectionRect.style.top = boxStartY + 'px';
        selectionRect.style.width = '0px';
        selectionRect.style.height = '0px';
        selectionRect.style.display = 'block';
        return;
    }
    if (mode === 'draw') {
        if (currentTool === 'text') {
            openTextModal('text', null, startX, startY);
        } else if (currentTool === 'math') {
            openTextModal('math', null, startX, startY);
        } else {
            isDragging = true;
            createShape(startX, startY);
        }
    }
});
svgCanvas.addEventListener('click', (e) => {
    if (e.button !== 0) return;
    const pos = getMousePos(e);
    const dist = Math.hypot(pos.x - startX, pos.y - startY);
    const isDrag = dist > 5;
    if (mode === 'construct') {
        const pos = getMousePos(e);
        let target = e.target;
        while (target && target !== svgCanvas && !target.classList?.contains('shape')) {
            target = target.parentNode;
        }
        const isShape = target && target.classList.contains('shape');
        autoApplyConstruction(isShape ? target : null, pos.x, pos.y);
    }
});
svgCanvas.addEventListener('dblclick', (e) => {
    let target = e.target;
    if (target.tagName === 'text' && (target.classList.contains('shape') || target.classList.contains('vertex-label'))) {
        openTextModal('text', target);
        return;
    }
    let mathWrapper = target;
    while (mathWrapper && mathWrapper !== svgCanvas && !mathWrapper.classList?.contains('math-obj')) {
        mathWrapper = mathWrapper.parentNode;
    }
    if (mathWrapper && mathWrapper.classList.contains('math-obj')) {
        const toolType = mathWrapper.getAttribute('data-tool');
        if (toolType === 'math') {
            openTextModal('math', mathWrapper);
        } else {
            openTextModal('text', mathWrapper);
        }
    }
});
svgCanvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    let currX = pos.x;
    let currY = pos.y;
    const rawX = pos.x;
    const rawY = pos.y;
    window.currentClientX = e.clientX;
    window.currentClientY = e.clientY;
    if (typeof isIntersectionSnappingEnabled !== 'undefined' && isIntersectionSnappingEnabled) {
        const snappedPos = findIntersectionSnap(currX, currY);
        if (snappedPos) {
            currX = snappedPos.x;
            currY = snappedPos.y;
            showSnapIndicator(snappedPos);
        } else {
            hideSnapIndicator();
        }
    } else {
        hideSnapIndicator();
    }
    const lockCheck = document.getElementById('lock-coords');
    if (lockCheck && !lockCheck.checked) {
        const inputX = document.getElementById('input-coord-x');
        const inputY = document.getElementById('input-coord-y');
        if (inputX) inputX.value = Math.round(currX);
        if (inputY) inputY.value = Math.round(currY);
    }
    const tooltip = document.getElementById('cursor-tooltip');
    if (mode === 'symmetry') {
        let tipText = (symmetryStep === 0) ? "步驟 1/2：選取物件 (可框選，按右鍵確認)" : "步驟 2/2：畫對稱軸";
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
        tooltip.innerText = tipText;
    } else if (mode === 'construct') {
        let tipText = "";
        if (constructionModeType === 'central') {
            if (constructionStep === 0) tipText = "步驟 1/2: 請點擊圓周上第一點";
            else tipText = "步驟 2/2: 請點擊圓周上第二點";
        } else if (constructionModeType === 'inscribed') {
            if (constructionStep === 0) tipText = "步驟 1/3: 請在圓周上點擊第一個點 (A)";
            else if (constructionStep === 1) tipText = "步驟 2/3: 請在圓周上點擊頂點 (V)";
            else tipText = "步驟 3/3: 請在圓周上點擊第二個端點 (B)";
        } else if (constructionModeType === 'tangent-chord') {
            if (constructionStep === 0) tipText = "步驟 1/2: 請在圓周上點擊切點";
            else tipText = "步驟 2/2: 請點擊弦的另一端點";
        } else if (constructionModeType === 'connect_points') {
            if (constructionStep === 0) tipText = "步驟 1/2：請點擊起點";
            else tipText = "步驟 2/2：請點擊終點";
        } else if (constructionModeType === 'perpendicular_point') {
            if (constructionStep === 0) tipText = "步驟 1/2：請選擇一點 (頂點或任意處)";
            else tipText = "步驟 2/2：請選擇一條線段 (作垂線)";
        } else if (constructionModeType === 'median_line') {
            if (constructionStep === 0) tipText = "步驟 1/2：請選擇一點 (頂點或任意處)";
            else tipText = "步驟 2/2：請選擇一條線段 (作中線)";
        } else if (constructionModeType === 'parallel') {
            if (constructionStep === 0) tipText = "步驟 1/2：請選擇參考線段";
            else tipText = "步驟 2/2：請點擊位置以放置平行線";
        } else if (constructionModeType === 'tangent') {
            if (constructionStep === 0) tipText = "步驟 1/2：請選擇圓形";
            else tipText = "步驟 2/2：請點擊圓外一點";
        } else if (constructionModeType === 'midpoint') {
            tipText = "作圖模式：請點擊線段 (取中點)";
        } else if (constructionModeType === 'perpendicular') {
            tipText = "作圖模式：請點擊線段 (作中垂線)";
        } else if (constructionModeType === 'divide_line') {
            tipText = "作圖模式：請點擊線段 (等分)";
        } else if (constructionModeType === 'divide_angle') {
            tipText = "作圖模式：請點擊角或頂點 (角平分)";
        } else if (constructionModeType === 'circumcenter') {
            tipText = "作圖模式：請點擊三角形 (外心)";
        } else if (constructionModeType === 'incenter') {
            tipText = "作圖模式：請點擊三角形 (內心)";
        } else if (constructionModeType === 'centroid') {
            tipText = "作圖模式：請點擊三角形 (重心)";
        }
        if (tipText) {
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
            tooltip.innerText = tipText;
        } else {
            if (tooltip) tooltip.style.display = 'none';
        }
    } else {
        if (tooltip) tooltip.style.display = 'none';
    }
    if (isBoxSelecting) {
        isDirectClick = false;
        const rect = drawingArea.getBoundingClientRect();
        const currMouseX = e.clientX - rect.left;
        const currMouseY = e.clientY - rect.top;
        const w = currMouseX - boxStartX;
        const h = currMouseY - boxStartY;
        selectionRect.style.width = Math.abs(w) + 'px';
        selectionRect.style.height = Math.abs(h) + 'px';
        selectionRect.style.left = (w < 0 ? currMouseX : boxStartX) + 'px';
        selectionRect.style.top = (h < 0 ? currMouseY : boxStartY) + 'px';
        return;
    }
    if (isRotating && selectedElements.length === 1) {
        isDirectClick = false;
        const shape = selectedElements[0];
        const tool = shape.getAttribute('data-tool');
        const parent = shape.parentNode;
        const M_parent = parent.getCTM();
        const M_global = shape.getCTM();
        const M_local = M_parent.inverse().multiply(M_global);
        let localCenter;
        if (tool === 'group' || tool === 'text' || tool === 'math') {
            const bbox = shape.getBBox();
            localCenter = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
        } else {
            localCenter = getShapeCenter(shape);
        }
        let p = svgCanvas.createSVGPoint();
        p.x = localCenter.x; p.y = localCenter.y;
        p = p.matrixTransform(M_local);
        const pivotX = p.x; const pivotY = p.y;
        const dx = rawX - pivotX;
        const dy = rawY - pivotY;
        let targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (e.shiftKey) targetAngle = Math.round(targetAngle / 15) * 15;
        const det = M_local.a * M_local.d - M_local.b * M_local.c;
        let currentAngle = Math.atan2(M_local.b, M_local.a) * (180 / Math.PI);
        if (det < 0) {
            currentAngle += 180;
        }
        const delta = targetAngle - currentAngle;
        const rotM = svgCanvas.createSVGMatrix().translate(pivotX, pivotY).rotate(delta).translate(-pivotX, -pivotY);
        const newM = rotM.multiply(M_local);
        const fix = n => parseFloat(n.toFixed(6));
        shape.setAttribute('transform', `matrix(${fix(newM.a)}, ${fix(newM.b)}, ${fix(newM.c)}, ${fix(newM.d)}, ${fix(newM.e)}, ${fix(newM.f)})`);
        drawHandles(shape);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
        if (typeof updateDependentShapes === 'function') {
            updateDependentShapes(shape);
        }
        if (typeof refreshIntersectionAngles === 'function') {
            refreshIntersectionAngles(shape);
        }
        if (typeof updateLabelPositions === 'function') {
            updateLabelPositions(shape);
        }
        return;
    }
    if (!isDragging) return;
    if (potentialSingleSelectTarget) {
        potentialSingleSelectTarget = null;
    }
    if (mode === 'symmetry' && symmetryStep === 1 && isDragging && currentShape) {
        let targetX = currX;
        let targetY = currY;
        if (e.shiftKey) {
            const dx = Math.abs(targetX - startX);
            const dy = Math.abs(targetY - startY);
            if (dx > dy) targetY = startY; else targetX = startX;
        }
        currentShape.setAttribute('x2', targetX);
        currentShape.setAttribute('y2', targetY);
        return;
    }
    if (mode === 'select') {
        if (selectedElements.length === 1 && draggingHandleIndex !== null) {
            isDirectClick = false;
            updateVertexPosition(selectedElements[0], draggingHandleIndex, currX, currY, e.shiftKey);
            if (typeof refreshAngleLabels === 'function') {
                refreshAngleLabels(selectedElements[0]);
            }
            drawHandles(selectedElements[0]);
        } else if (selectedElements.length > 0) {
            isDirectClick = false;
            const dx = rawX - startX;
            const dy = rawY - startY;
            selectedElements.forEach(el => moveShape(el, dx, dy));
            startX = rawX;
            startY = rawY;
            handlesLayer.innerHTML = '';
        }
    } else if (mode === 'draw' && currentShape) {
        let targetX = currX;
        let targetY = currY;
        if (e.shiftKey && currentTool === 'line') {
            const dx = Math.abs(targetX - startX);
            const dy = Math.abs(targetY - startY);
            if (dx > dy) targetY = startY; else targetX = startX;
        }
        updateShapeSize(currentShape, startX, startY, targetX, targetY, e.shiftKey);
    }
});
svgCanvas.addEventListener('mouseup', (e) => {
    hideSnapIndicator();
    if (potentialSingleSelectTarget) {
        const pos = getMousePos(e);
        const dist = Math.hypot(pos.x - startX, pos.y - startY);
        if (dist < 5) {
            deselectAll();
            addToSelection(potentialSingleSelectTarget);
        }
        potentialSingleSelectTarget = null;
    }
    if (mode === 'symmetry' && symmetryStep === 1 && currentShape) {
        const x2 = parseFloat(currentShape.getAttribute('x2'));
        const y2 = parseFloat(currentShape.getAttribute('y2'));
        if (Math.hypot(x2 - startX, y2 - startY) > 5) {
            const p1 = { x: startX, y: startY };
            const p2 = { x: x2, y: y2 };
            executeSymmetryReflection(p1, p2);
        }
        currentShape.remove();
        currentShape = null;
        isDragging = false;
        setMode('select');
        return;
    }
    if (isBoxSelecting) {
        isBoxSelecting = false;
        const rect = selectionRect.getBoundingClientRect();
        const svgRect = svgCanvas.getBoundingClientRect();
        const rX = rect.left - svgRect.left;
        const rY = rect.top - svgRect.top;
        const rW = rect.width;
        const rH = rect.height;
        selectionRect.style.display = 'none';
        if (rW > 5 && rH > 5) {
            document.querySelectorAll('.shape').forEach(shape => {
                if (shape.getAttribute('data-tool') === 'grid') return;
                const bbox = shape.getBBox();
                let tx = 0, ty = 0;
                const transform = shape.getAttribute('transform') || '';
                const match = /translate\(([-0-9.]+),\s*([-0-9.]+)\)/.exec(transform);
                if (match) {
                    tx = parseFloat(match[1]);
                    ty = parseFloat(match[2]);
                } else if (transform.includes('matrix')) {
                    const mMatch = /matrix\((?:[-0-9.]+\s*,\s*){4}([-0-9.]+)\s*,\s*([-0-9.]+)\)/.exec(transform);
                    if (mMatch) {
                        tx = parseFloat(mMatch[1]);
                        ty = parseFloat(mMatch[2]);
                    }
                }
                const shapeLeft = bbox.x + tx;
                const shapeTop = bbox.y + ty;
                const shapeRight = shapeLeft + bbox.width;
                const shapeBottom = shapeTop + bbox.height;
                const isFullyEnclosed =
                    shapeLeft >= rX &&
                    shapeRight <= (rX + rW) &&
                    shapeTop >= rY &&
                    shapeBottom <= (rY + rH);
                if (isFullyEnclosed) {
                    addToSelection(shape);
                }
            });
            if (selectedElements.length > 0) {
                statusText.innerText = `框選完成：已選取 ${selectedElements.length} 個物件`;
            }
        } else {
            deselectAll();
            statusText.innerText = "已取消選取";
        }
    }
    if (isRotating) {
        isRotating = false;
        saveState();
    }
    if (isDragging) {
        if (mode === 'select' && selectedElements.length > 0) {
            if (selectedElements.length === 1) drawHandles(selectedElements[0]);
            selectedElements.forEach(el => {
                if (el.classList.contains('vertex-label')) {
                    const ownerId = el.getAttribute('data-owner-shape');
                    const ownerShape = document.getElementById(ownerId);
                    if (ownerShape) {
                        recalculateLabelAssociations(ownerShape);
                    }
                }
                if (draggingHandleIndex !== null && typeof refreshAngleLabels === 'function') {
                    refreshAngleLabels(el);
                }
            });
            saveState();
        }
    }
    if (mode === 'draw' && currentShape) {
        const newlyCreatedShape = currentShape;
        generateLabels(newlyCreatedShape);
        if (document.getElementById('auto-angle-label-check').checked || currentSubTool === 'sector') {
            generateAngleLabels(newlyCreatedShape, true);
        }
        saveState();
        if (isContinuousDraw) {
            statusText.innerText = `連續繪圖模式：${currentSubTool} (完成 1 個物件)`;
            deselectAll();
        } else {
            setMode('select');
            addToSelection(newlyCreatedShape);
        }
    }
    isDragging = false;
    currentShape = null;
    draggingHandleIndex = null;
});
svgCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    let handled = false;
    if (mode === 'draw' && isContinuousDraw) {
        isContinuousDraw = false;
        setMode('select');
        statusText.innerText = "已結束連續繪圖模式。";
        handled = true;
    }
    if (isContinuousMarking) {
        isContinuousMarking = false;
        closeAllMenus();
        document.getElementById('btn-mark-edge').classList.remove('active');
        document.getElementById('btn-mark-angle').classList.remove('active');
        if (mode === 'mark') {
            setMode('select');
        }
        statusText.innerText = "已結束連續標註模式。";
        handled = true;
    }
    if (mode === 'construct') {
        constructionModeType = null;
        constructionStep = 0;
        tempConstructionSource = null;
        const tempLine = document.querySelector('.temp-construction-line');
        if (tempLine) tempLine.remove();
        if (typeof window.clearAllHighlightPoints === 'function') {
            window.clearAllHighlightPoints();
        }
        closeAllMenus();
        document.getElementById('btn-construct').classList.remove('active');
        setMode('select');
        statusText.innerText = "已結束尺規作圖模式。";
        handled = true;
    }
    if (!handled && mode === 'draw' && currentShape && currentShape.tagName === 'polyline') { }
});
svgCanvas.addEventListener('wheel', (e) => {
    if (!e.shiftKey || selectedElements.length === 0) return;
    e.preventDefault();
    const zoomIntensity = 0.05;
    const scaleFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 / (1 + zoomIntensity));
    selectedElements.forEach(el => {
        scaleElementFromCenter(el, scaleFactor);
        if (typeof refreshAngleLabels === 'function') {
            refreshAngleLabels(el);
        }
    });
    updateSelectionUI();
    clearTimeout(window.saveStateTimer);
    window.saveStateTimer = setTimeout(saveState, 500);
}, { passive: false });
document.addEventListener('keydown', (e) => {
    const key = e.key;
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = (activeTag === 'input' || activeTag === 'textarea');
    if (key === 'Escape') {
        e.preventDefault();
        const exclusive = document.getElementById('exclusive-options-modal');
        if (exclusive) {
            exclusive.remove();
            return;
        }
        const sysModal = document.getElementById('sys-modal');
        if (sysModal && sysModal.style.display !== 'none') {
            sysModal.style.display = 'none';
            return;
        }
        const previewModal = document.getElementById('library-preview-modal');
        if (previewModal && previewModal.style.display === 'flex') {
            if (typeof closeLibraryPreview === 'function') closeLibraryPreview();
            else previewModal.style.display = 'none';
            return;
        }
        const featureModals = [
            'math-modal-v2', 'text-modal', 'axes-modal', 'function-modal',
            'angle-input-modal', 'number-input-modal', 'paramModal',
            'favorite-name-modal', 'json-import-modal', 'canvas-settings-modal'
        ];
        for (const id of featureModals) {
            const el = document.getElementById(id);
            if (el && el.style.display !== 'none' && el.style.display !== '') {
                if (id === 'math-modal-v2') closeMathModal();
                else if (id === 'text-modal') closeTextModal();
                else if (id === 'paramModal') closeParamModal();
                else if (id === 'number-input-modal') closeNumberInputModal();
                else if (id === 'favorite-name-modal') closeFavoriteNameModal();
                else el.style.display = 'none';
                return;
            }
        }
        const libModal = document.getElementById('library-modal');
        if (libModal && libModal.style.display !== 'none' && libModal.style.display !== '') {
            libModal.style.display = 'none';
            return;
        }
        const dropdowns = ['collection-dropdown', 'menu-edge', 'menu-angle', 'menu-align', 'menu-construct', 'menu-stroke-width', 'menu-circle-angles', 'context-menu'];
        for (const id of dropdowns) {
            const el = document.getElementById(id);
            if (el && el.style.display !== 'none' && el.style.display !== '') {
                el.style.display = 'none';
                return;
            }
        }
        if (selectedElements.length === 1 && selectedElements[0].classList.contains('smart-function')) {
            const panel = document.getElementById('smart-panel');
            if (panel && panel.style.display !== 'none') {
                cleanupTemporaryFunction(selectedElements[0]);
                return;
            }
        }
        if (typeof isContinuousDraw !== 'undefined' && isContinuousDraw) {
            isContinuousDraw = false;
            setMode('select');
            statusText.innerText = "已取消連續繪圖。";
            return;
        }
        if (mode === 'symmetry') {
            setMode('select');
            statusText.innerText = "已取消對稱作圖";
            return;
        }
        if (mode === 'construct') {
            constructionModeType = null;
            constructionStep = 0;
            tempConstructionSource = null;
            if (typeof window.clearAllHighlightPoints === 'function') window.clearAllHighlightPoints();
            closeAllMenus();
            setMode('select');
            return;
        }
        if (mode === 'draw' || mode === 'mark') {
            setMode('select');
        } else if (mode === 'select') {
            deselectAll();
            statusText.innerText = "已取消選取。";
        }
        return;
    }
    if (key === 'Enter') {
        if (mode === 'symmetry' && symmetryStep === 0 && selectedElements.length > 0) {
            e.preventDefault();
            symmetryStep = 1;
            statusText.innerText = "步驟 2/2：請畫對稱軸";
            handlesLayer.innerHTML = '';
            return;
        }
    }
    if (isTyping) return;
    if (key === 'Delete' || key === 'Backspace') {
        e.preventDefault();
        if (typeof deleteSelected === 'function') deleteSelected();
    }
    if (e.ctrlKey || e.metaKey) {
        const k = key.toLowerCase();
        if (k === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
        }
        if (k === 'y') {
            e.preventDefault();
            redo();
        }
        if (k === 'g') {
            e.preventDefault();
            if (e.shiftKey) ungroupSelected();
            else groupSelected();
        }
        if (k === 'a') {
            e.preventDefault();
            selectAllShapes();
        }
        if (k === 'c') {
            e.preventDefault();
            copySelection();
        }
        if (k === 'x') {
            e.preventDefault();
            cutSelection();
        }
        if (k === 'v') {
            e.preventDefault();
            pasteSelection();
        }
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        if (selectedElements.length > 0) {
            e.preventDefault();
            const delta = e.shiftKey ? 10 : 2;
            let dx = 0, dy = 0;
            if (key === 'ArrowLeft') dx = -delta;
            if (key === 'ArrowRight') dx = delta;
            if (key === 'ArrowUp') dy = -delta;
            if (key === 'ArrowDown') dy = delta;
            selectedElements.forEach(el => moveShape(el, dx, dy));
            if (selectedElements.length === 1) drawHandles(selectedElements[0]);
        }
    }
});
function createShape(x, y) {
    let shape;
    const strokeColor = document.getElementById('stroke-color-select').value || "#000000";
    const fillColor = document.getElementById('fill-color-select').value;
    const fillStyle = document.getElementById('fill-style-select').value || "solid";
    const lineStyleVal = document.getElementById('line-style-select').value || "solid";
    const strokeWidth = document.getElementById('stroke-width-select').value || "2";
    let dashArray = "none";
    if (lineStyleVal === 'dashed') dashArray = "8,5";
    else if (lineStyleVal === 'dotted') dashArray = "2,4";
    else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
    let fillValue = fillColor;
    if (fillColor !== 'none' && fillStyle !== 'solid') {
        const dummy = document.createElement('div');
        updateShapeFill(dummy, fillColor, fillStyle);
        fillValue = dummy.style.fill;
    }
    let commonStyle = `stroke: ${strokeColor}; stroke-width: ${strokeWidth}; fill: ${fillValue}; stroke-dasharray: ${dashArray}; vector-effect: non-scaling-stroke;`;
    if (currentTool === 'line' || currentTool === 'freehand' || currentTool === 'angle') {
        commonStyle = `stroke: ${strokeColor}; stroke-width: ${strokeWidth}; fill: none; stroke-dasharray: ${dashArray}; vector-effect: non-scaling-stroke;`;
    }
    if (currentTool === 'text') {
        return;
    } else if (currentTool === 'point') {
        shape = document.createElementNS(ns, "ellipse");
        shape.setAttribute('cx', x);
        shape.setAttribute('cy', y);
        shape.setAttribute('rx', 5);
        shape.setAttribute('ry', 5);
        shape.style.cssText = `stroke: none; fill: ${strokeColor}; vector-effect: non-scaling-stroke; cursor: move;`;
    } else if (currentTool === 'freehand') {
        shape = document.createElementNS(ns, "path");
        shape.setAttribute("d", `M ${x} ${y}`);
        shape.setAttribute("class", "shape freehand");
        shape.style.cssText = commonStyle;
    } else if (currentTool === 'angle') {
        shape = document.createElementNS(ns, "polyline");
        shape.setAttribute('points', `${x},${y} ${x},${y} ${x},${y}`);
        shape.style.cssText = commonStyle;
        shape.style.fill = "none";
    } else if (currentTool === 'ellipse') {
        if (currentSubTool === 'sector' || currentSubTool === 'arc' || currentSubTool === 'arch') {
            shape = document.createElementNS(ns, "path");
            shape.setAttribute("d", `M ${x} ${y}`);
            shape.style.cssText = commonStyle;
            if (currentSubTool === 'arc') {
                shape.style.fill = "none";
            }
        } else {
            shape = document.createElementNS(ns, "ellipse");
            shape.setAttribute('cx', x);
            shape.setAttribute('cy', y);
            shape.setAttribute('rx', 0);
            shape.setAttribute('ry', 0);
            shape.style.cssText = commonStyle;
        }
    } else if (currentTool === 'solid') {
        shape = document.createElementNS(ns, "g");
        const visiblePath = document.createElementNS(ns, "path");
        visiblePath.setAttribute("class", "solid-visible");
        visiblePath.style.cssText = `stroke: ${strokeColor}; stroke-width: 2; fill: none; vector-effect: non-scaling-stroke;`;
        const hiddenPath = document.createElementNS(ns, "path");
        hiddenPath.setAttribute("class", "solid-hidden");
        hiddenPath.style.cssText = `stroke: ${strokeColor}; stroke-width: 2; fill: none; stroke-dasharray: 4,4; vector-effect: non-scaling-stroke;`;
        shape.appendChild(visiblePath);
        shape.appendChild(hiddenPath);
        shape.insertBefore(hiddenPath, visiblePath);
    } else if (currentTool === 'polygon') {
        shape = document.createElementNS(ns, "polygon");
        shape.setAttribute('points', `${x},${y}`);
        shape.style.cssText = commonStyle;
        if (fillColor !== 'none') shape.setAttribute("data-filled", "true");
    } else if (currentTool === 'line') {
        shape = document.createElementNS(ns, "g");
        const hitLine = document.createElementNS(ns, "line");
        hitLine.setAttribute('x1', x); hitLine.setAttribute('y1', y); hitLine.setAttribute('x2', x); hitLine.setAttribute('y2', y);
        hitLine.setAttribute('class', 'hit-line');
        hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        const visLine = document.createElementNS(ns, "line");
        visLine.setAttribute('x1', x); visLine.setAttribute('y1', y); visLine.setAttribute('x2', x); visLine.setAttribute('y2', y);
        visLine.setAttribute('class', 'visible-line');
        visLine.style.cssText = commonStyle + " pointer-events: none;";
        if (currentSubTool === 'line-end' || currentSubTool === 'line-double') {
            visLine.setAttribute('marker-end', 'url(#arrow-end)');
        }
        if (currentSubTool === 'line-start' || currentSubTool === 'line-double') {
            visLine.setAttribute('marker-start', 'url(#arrow-start)');
        }
        shape.appendChild(hitLine);
        shape.appendChild(visLine);
    }
    if (shape) {
        if (currentTool !== 'freehand') shape.setAttribute('class', 'shape');
        shape.setAttribute('data-tool', currentTool);
        shape.setAttribute('data-sub-tool', currentSubTool);
        shapesLayer.appendChild(shape);
        currentShape = shape;
    }
}
function updateShapeSize(shape, sx, sy, cx, cy, isShiftPressed) {
    const tool = shape.getAttribute('data-tool');
    const subTool = currentSubTool;
    if (tool === 'point') return;
    if (tool === 'freehand') {
        const d = shape.getAttribute("d");
        shape.setAttribute("d", `${d} L ${cx} ${cy}`);
        startX = cx;
        startY = cy;
        return;
    }
    if (tool === 'line') {
        if (shape.tagName === 'g') {
            const lines = shape.querySelectorAll('line');
            lines.forEach(l => {
                l.setAttribute('x2', cx);
                l.setAttribute('y2', cy);
            });
        } else {
            shape.setAttribute('x2', cx);
            shape.setAttribute('y2', cy);
        }
        return;
    }
    if (tool === 'angle') {
        const points = `${cx},${cy} ${sx},${sy} ${cx},${sy}`;
        shape.setAttribute('points', points);
        return;
    }
    let w = cx - sx;
    let h = cy - sy;
    if (tool === 'solid') {
        const realX = Math.min(sx, cx);
        const realY = Math.min(sy, cy);
        const realW = Math.abs(w);
        const realH = Math.abs(h);
        if (subTool === 'solid-cube') {
            const depthRatio = 0.35;
            const dx = realW * depthRatio * (w > 0 ? 1 : -1);
            const dy = -realW * depthRatio;
            shape.setAttribute('data-x', realX);
            shape.setAttribute('data-y', realY);
            shape.setAttribute('data-w', realW);
            shape.setAttribute('data-h', realH);
            shape.setAttribute('data-dx', dx);
            shape.setAttribute('data-dy', dy);
        } else if (subTool === 'solid-cylinder') {
            const r = realW / 2;
            const cx_cyl = realX + r;
            const height = realH;
            shape.setAttribute('data-cx', cx_cyl);
            shape.setAttribute('data-cy', realY);
            shape.setAttribute('data-r', r);
            shape.setAttribute('data-h', height);
        } else if (subTool === 'solid-cone') {
            const r = realW / 2;
            const cx_cone = realX + r;
            const height = realH;
            shape.setAttribute('data-cx', cx_cone);
            shape.setAttribute('data-cy', realY);
            shape.setAttribute('data-r', r);
            shape.setAttribute('data-h', height);
        }
        redrawSolid(shape);
        return;
    }
    if (tool === 'ellipse') {
        if (subTool === 'sector' || subTool === 'arc' || subTool === 'arch') {
            const radius = Math.sqrt(w * w + h * h);
            let drawDir = shape.getAttribute('data-draw-dir');
            if (radius < 10) {
                drawDir = null;
                shape.removeAttribute('data-draw-dir');
            }
            if (!drawDir) {
                drawDir = (cx < sx) ? 'left' : 'right';
                shape.setAttribute('data-draw-dir', drawDir);
            }
            let currentAngle = Math.atan2(-(cy - sy), cx - sx);
            if (currentAngle < 0) currentAngle += 2 * Math.PI;
            let startAngle, endAngle, startX, startY, sweepFlag, largeArc;
            if (drawDir === 'left') {
                startAngle = 0;
                endAngle = currentAngle;
                startX = sx + radius;
                startY = sy;
                sweepFlag = 0;
                let diff = endAngle - startAngle;
                while (diff < 0) diff += 2 * Math.PI;
                largeArc = diff > Math.PI ? 1 : 0;
            } else {
                startAngle = Math.PI;
                endAngle = currentAngle;
                startX = sx - radius;
                startY = sy;
                sweepFlag = 1;
                let diff = startAngle - endAngle;
                while (diff < 0) diff += 2 * Math.PI;
                largeArc = diff > Math.PI ? 1 : 0;
            }
            const endX = sx + radius * Math.cos(endAngle);
            const endY = sy - radius * Math.sin(endAngle);
            let d = "";
            if (subTool === 'arc') {
                d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`;
            } else if (subTool === 'sector') {
                d = `M ${sx} ${sy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
            } else if (subTool === 'arch') {
                d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
            }
            shape.setAttribute("d", d);
            shape.setAttribute("data-center-x", sx);
            shape.setAttribute("data-center-y", sy);
            shape.setAttribute("data-radius", radius);
            shape.setAttribute("data-start-angle", startAngle);
            shape.setAttribute("data-end-angle", endAngle);
        } else if (subTool === 'circle') {
            const radius = Math.max(Math.abs(w), Math.abs(h));
            shape.setAttribute('rx', radius);
            shape.setAttribute('ry', radius);
        } else {
            shape.setAttribute('rx', Math.abs(w));
            shape.setAttribute('ry', Math.abs(h));
        }
        return;
    }
    if (tool === 'polygon') {
        let points = "";
        if (subTool === 'rect-square' || subTool === 'rect-free') {
            if (subTool === 'rect-square') {
                const d = Math.max(Math.abs(w), Math.abs(h));
                w = (w > 0 ? d : -d);
                h = (h > 0 ? d : -d);
            }
            const x1 = Math.min(sx, sx + w);
            const x2 = Math.max(sx, sx + w);
            const y1 = Math.min(sy, sy + h);
            const y2 = Math.max(sy, sy + h);
            points = `${x1},${y1} ${x1},${y2} ${x2},${y2} ${x2},${y1}`;
        } else if (subTool === 'tri-iso') {
            points = `${sx + w / 2},${sy} ${sx},${cy} ${cx},${cy}`;
        } else if (subTool === 'tri-right') {
            points = `${sx},${sy} ${sx},${cy} ${cx},${cy}`;
        } else if (subTool === 'tri-equi') {
            const side = Math.abs(w);
            const eqHeight = side * Math.sqrt(3) / 2;
            h = (h >= 0 ? eqHeight : -eqHeight);
            const finalCy = sy + h;
            const finalCx = sx + w;
            points = `${sx + w / 2},${sy} ${sx},${finalCy} ${finalCx},${finalCy}`;
        } else if (subTool === 'rhombus') {
            points = `${sx + w / 2},${sy} ${sx},${sy + h / 2} ${sx + w / 2},${cy} ${cx},${sy + h / 2}`;
        } else if (subTool === 'kite') {
            points = `${sx + w / 2},${sy} ${sx},${sy + h * 0.3} ${sx + w / 2},${cy} ${cx},${sy + h * 0.3}`;
        } else if (subTool === 'parallelogram') {
            const shift = w * 0.25;
            points = `${sx + shift},${sy} ${sx},${cy} ${cx - shift},${cy} ${cx},${sy}`;
        } else if (subTool === 'trapezoid') {
            const shift = w * 0.2;
            points = `${sx + shift},${sy} ${sx},${cy} ${cx},${cy} ${cx - shift},${sy}`;
        } else if (subTool === 'polygon-regular') {
            const n = polygonSides || 5;
            const radius = Math.max(Math.abs(w), Math.abs(h));
            const centX = sx + (w > 0 ? radius : -radius);
            const centY = sy + (h > 0 ? radius : -radius);
            const angleStep = (2 * Math.PI) / n;
            let startAngle = Math.PI / 2;
            if (n % 2 === 0) {
                startAngle = Math.PI / 2 + (angleStep / 2);
            }
            let pts = [];
            for (let i = 0; i < n; i++) {
                const ang = startAngle + i * angleStep;
                pts.push(`${centX + radius * Math.cos(ang)},${centY - radius * Math.sin(ang)}`);
            }
            points = pts.join(' ');
        }
        shape.setAttribute('points', points);
    }
}
function drawHandles(shape) {
    handlesLayer.innerHTML = '';
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    if (tool === 'solid') {
        const matrix = shape.getCTM();
        const transformPoint = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint();
            pt.x = lx; pt.y = ly;
            return pt.matrixTransform(matrix);
        };
        const mkHandle = (idx, lx, ly, color = 'white') => {
            const p = transformPoint(lx, ly);
            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', p.x); h.setAttribute('cy', p.y); h.setAttribute('r', 6);
            h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', idx);
            h.style.fill = color; h.style.stroke = '#2980b9';
            handlesLayer.appendChild(h);
        };
        if (subTool === 'solid-cube') {
            const x = parseFloat(shape.getAttribute('data-x'));
            const y = parseFloat(shape.getAttribute('data-y'));
            const w = parseFloat(shape.getAttribute('data-w'));
            const h = parseFloat(shape.getAttribute('data-h'));
            const dx = parseFloat(shape.getAttribute('data-dx'));
            const dy = parseFloat(shape.getAttribute('data-dy'));
            mkHandle(0, x + w, y + h / 2, '#f1c40f');
            mkHandle(1, x + w / 2, y + h, '#2ecc71');
            mkHandle(2, x + w + dx, y + dy, '#e74c3c');
        } else if (subTool === 'solid-cylinder' || subTool === 'solid-cone') {
            const cx = parseFloat(shape.getAttribute('data-cx'));
            const cy = parseFloat(shape.getAttribute('data-cy'));
            const r = parseFloat(shape.getAttribute('data-r'));
            const h = parseFloat(shape.getAttribute('data-h'));
            const botY = cy + h;
            mkHandle(0, cx + r, botY, '#f1c40f');
            if (subTool === 'solid-cone') mkHandle(1, cx, cy, '#2ecc71');
            else mkHandle(1, cx, cy, '#2ecc71');
        }
        let bbox = shape.getBBox();
        let topX = bbox.x + bbox.width / 2;
        let topY = bbox.y - 25;
        const hp = transformPoint(topX, topY);
        const rHandle = document.createElementNS(ns, "circle");
        rHandle.setAttribute('cx', hp.x); rHandle.setAttribute('cy', hp.y); rHandle.setAttribute('r', 6);
        rHandle.setAttribute('class', 'rotate-handle');
        handlesLayer.appendChild(rHandle);
        return;
    }
    if (subTool === 'circle-smart') {
        const r = parseFloat(shape.getAttribute('data-radius'));
        const m = shape.getCTM();
        const circleBody = shape.querySelector('.circle-body');
        const internalCx = parseFloat(circleBody.getAttribute('cx'));
        const internalCy = parseFloat(circleBody.getAttribute('cy'));
        const pt = svgCanvas.createSVGPoint();
        pt.x = internalCx; pt.y = internalCy;
        const globalCenter = pt.matrixTransform(m);
        const angleDeg = parseFloat(shape.getAttribute('data-angle')) || 0;
        const angleRad = angleDeg * Math.PI / 180;
        const globalR = r * Math.hypot(m.a, m.b);
        const hx = globalCenter.x + globalR * Math.cos(angleRad);
        const hy = globalCenter.y + globalR * Math.sin(angleRad);
        const h = document.createElementNS(ns, "circle");
        h.setAttribute('cx', hx); h.setAttribute('cy', hy); h.setAttribute('r', 7);
        h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', 0);
        h.style.fill = '#e67e22'; h.style.stroke = 'white';
        handlesLayer.appendChild(h);
        return;
    }
    if (subTool === 'venn') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const spacingPercent = parseFloat(shape.getAttribute('data-spacing-percent'));
        const count = parseInt(shape.getAttribute('data-count'));
        const d = r * (spacingPercent / 100) * 2;
        const matrix = shape.getCTM();
        const transformPoint = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint();
            pt.x = lx; pt.y = ly;
            return pt.matrixTransform(matrix);
        };
        let handle1_local;
        if (count === 2) handle1_local = { x: cx - d / 2, y: cy - r };
        else { const h = d * Math.sqrt(3) / 2; handle1_local = { x: cx, y: cy - h / 2 - r }; }
        const handle1_global = transformPoint(handle1_local.x, handle1_local.y);
        const h1 = document.createElementNS(ns, "circle");
        h1.setAttribute('cx', handle1_global.x); h1.setAttribute('cy', handle1_global.y); h1.setAttribute('r', 7);
        h1.setAttribute('class', 'vertex-handle venn-handle'); h1.setAttribute('data-index', 0);
        h1.style.fill = 'cyan';
        handlesLayer.appendChild(h1);
        let handle2_local;
        if (count === 2) handle2_local = { x: cx + d / 2, y: cy };
        else handle2_local = { x: cx - d / 2, y: cy + d * Math.sqrt(3) / 2 / 2 };
        const handle2_global = transformPoint(handle2_local.x, handle2_local.y);
        const h2 = document.createElementNS(ns, "circle");
        h2.setAttribute('cx', handle2_global.x); h2.setAttribute('cy', handle2_global.y); h2.setAttribute('r', 7);
        h2.setAttribute('class', 'vertex-handle venn-handle'); h2.setAttribute('data-index', 1);
        h2.style.fill = 'lime';
        handlesLayer.appendChild(h2);
        return;
    }
    if (subTool === 'pie-chart') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const anglesAttr = shape.getAttribute('data-angles');
        if (!anglesAttr) return;
        const angles = JSON.parse(anglesAttr);
        const m = shape.getCTM();
        const parentInv = handlesLayer.getCTM().inverse();
        const matrix = parentInv.multiply(m);
        const transformPointLocalToHandle = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint();
            pt.x = lx; pt.y = ly;
            return pt.matrixTransform(matrix);
        };
        angles.forEach((angle, i) => {
            if (i === angles.length - 1) return;
            const lx = cx + r * Math.cos(angle);
            const ly = cy + r * Math.sin(angle);
            const pt = transformPointLocalToHandle(lx, ly);
            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', pt.x); h.setAttribute('cy', pt.y); h.setAttribute('r', 7);
            h.setAttribute('class', 'vertex-handle pie-handle'); h.setAttribute('data-index', i);
            h.style.fill = 'cyan'; h.style.stroke = 'blue';
            handlesLayer.appendChild(h);
        });
        const topCenter = { x: cx, y: cy - r - 25 };
        const handlePt = transformPointLocalToHandle(topCenter.x, topCenter.y);
        const rHandle = document.createElementNS(ns, "circle");
        rHandle.setAttribute('cx', handlePt.x); rHandle.setAttribute('cy', handlePt.y); rHandle.setAttribute('r', 6);
        rHandle.setAttribute('class', 'rotate-handle');
        handlesLayer.appendChild(rHandle);
        return;
    }
    if (subTool && subTool.includes('-angle')) {
        const groupMatrix = shape.getCTM();
        const parentMatrix = handlesLayer.getCTM().inverse();
        const localToHandleMatrix = parentMatrix.multiply(groupMatrix);
        const dataNodes = Array.from(shape.querySelectorAll('.vertex-data'));
        let handleIndices = [];
        if (subTool === 'central-angle') handleIndices = [1, 2];
        if (subTool === 'inscribed-angle') handleIndices = [0, 1, 2];
        if (subTool === 'tangent-chord-angle') handleIndices = [0, 1];
        dataNodes.forEach((node, i) => {
            if (handleIndices.includes(i)) {
                const lx = +node.getAttribute('cx');
                const ly = +node.getAttribute('cy');
                let pt = svgCanvas.createSVGPoint();
                pt.x = lx; pt.y = ly;
                pt = pt.matrixTransform(localToHandleMatrix);
                const h = document.createElementNS(ns, "circle");
                h.setAttribute('cx', pt.x); h.setAttribute('cy', pt.y); h.setAttribute('r', 6);
                h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', i);
                h.style.cssText = "fill:white; stroke:#2980b9; stroke-width:2px; cursor:pointer;";
                handlesLayer.appendChild(h);
            }
        });
        return;
    }
    if (tool === 'freehand') return;
    let matrix;
    try {
        const parent = shape.parentNode;
        matrix = parent.getScreenCTM().inverse().multiply(shape.getScreenCTM());
    } catch (e) { return; }
    const transformPoint = (x, y) => {
        let pt = svgCanvas.createSVGPoint();
        pt.x = x; pt.y = y;
        pt = pt.matrixTransform(matrix);
        return { x: pt.x, y: pt.y };
    };
    let points = [];
    let bbox = null;
    try { bbox = shape.getBBox(); } catch (e) { bbox = { x: 0, y: 0, width: 0, height: 0 }; }
    if (tool === 'line') {
        if (shape.tagName === 'g') {
            const l = shape.querySelector('.visible-line') || shape.querySelector('line');
            if (l) points = [{ x: +l.getAttribute('x1'), y: +l.getAttribute('y1') }, { x: +l.getAttribute('x2'), y: +l.getAttribute('y2') }];
        } else { points = [{ x: +shape.getAttribute('x1'), y: +shape.getAttribute('y1') }, { x: +shape.getAttribute('x2'), y: +shape.getAttribute('y2') }]; }
    } else if (tool === 'text' || tool === 'math' || tool === 'group') {
        points = [{ x: bbox.x, y: bbox.y }, { x: bbox.x + bbox.width, y: bbox.y }, { x: bbox.x, y: bbox.y + bbox.height }, { x: bbox.x + bbox.width, y: bbox.y + bbox.height }];
    } else if (tool === 'ellipse') {
        const subTool = shape.getAttribute('data-sub-tool');
        if (subTool === 'sector' || subTool === 'arc' || subTool === 'arch') {
            if (shape.hasAttribute('data-center-x')) {
                const cx = +shape.getAttribute('data-center-x');
                const cy = +shape.getAttribute('data-center-y');
                const r = +shape.getAttribute('data-radius');
                const sA = +shape.getAttribute('data-start-angle');
                const eA = +shape.getAttribute('data-end-angle');
                points.push({ x: cx, y: cy });
                points.push({ x: cx + r * Math.cos(sA), y: cy - r * Math.sin(sA) });
                points.push({ x: cx + r * Math.cos(eA), y: cy - r * Math.sin(eA) });
            } else { points = [{ x: bbox.x, y: bbox.y }, { x: bbox.x + bbox.width, y: bbox.y + bbox.height }]; }
        } else {
            const cx = +shape.getAttribute('cx'), cy = +shape.getAttribute('cy');
            const rx = +shape.getAttribute('rx'), ry = +shape.getAttribute('ry');
            points = [{ x: cx + rx, y: cy }, { x: cx, y: cy + ry }, { x: cx - rx, y: cy }, { x: cx, y: cy - ry }];
        }
    } else if (shape.getAttribute('points')) {
        points = shape.getAttribute('points').trim().split(/\s+/).map(p => {
            const [x, y] = p.split(',');
            return { x: +x, y: +y };
        });
    } else if (tool === 'image' || shape.tagName === 'image' || shape.tagName === 'rect') {
        let x = parseFloat(shape.getAttribute('x')) || 0;
        let y = parseFloat(shape.getAttribute('y')) || 0;
        let w = parseFloat(shape.getAttribute('width')) || 0;
        let h = parseFloat(shape.getAttribute('height')) || 0;
        points = [{ x: x, y: y }, { x: x + w, y: y }, { x: x, y: y + h }, { x: x + w, y: y + h }];
    }
    points.forEach((p, i) => {
        const finalPos = transformPoint(p.x, p.y);
        const h = document.createElementNS(ns, "circle");
        h.setAttribute('cx', finalPos.x); h.setAttribute('cy', finalPos.y); h.setAttribute('r', 6);
        h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', i);
        handlesLayer.appendChild(h);
    });
    let localCenter = { x: 0, y: 0 };
    let localTop = { x: 0, y: 0 };
    if (tool === 'ellipse' && ['sector', 'arc', 'arch'].includes(shape.getAttribute('data-sub-tool'))) {
        if (shape.hasAttribute('data-center-x')) {
            localCenter.x = +shape.getAttribute('data-center-x');
            localCenter.y = +shape.getAttribute('data-center-y');
            const r = +shape.getAttribute('data-radius');
            localTop.x = localCenter.x; localTop.y = localCenter.y - r - 25;
        }
    } else if (tool === 'line') {
        if (points.length >= 2) {
            localCenter.x = (points[0].x + points[1].x) / 2;
            localCenter.y = (points[0].y + points[1].y) / 2;
            localTop.x = localCenter.x; localTop.y = Math.min(points[0].y, points[1].y) - 25;
        }
    } else {
        localCenter.x = bbox.x + bbox.width / 2; localCenter.y = bbox.y + bbox.height / 2;
        localTop.x = localCenter.x; localTop.y = bbox.y - 25;
    }
    const centerPos = transformPoint(localCenter.x, localCenter.y);
    const handlePos = transformPoint(localTop.x, localTop.y);
    const connector = document.createElementNS(ns, "line");
    const edgePos = transformPoint(localTop.x, localTop.y + 25);
    connector.setAttribute('x1', edgePos.x); connector.setAttribute('y1', edgePos.y);
    connector.setAttribute('x2', handlePos.x); connector.setAttribute('y2', handlePos.y);
    connector.setAttribute('stroke', '#27ae60'); connector.setAttribute('stroke-dasharray', '3,3');
    handlesLayer.appendChild(connector);
    const rHandle = document.createElementNS(ns, "circle");
    rHandle.setAttribute('cx', handlePos.x); rHandle.setAttribute('cy', handlePos.y); rHandle.setAttribute('r', 6);
    rHandle.setAttribute('class', 'rotate-handle');
    handlesLayer.appendChild(rHandle);
}
function updateVertexPosition(shape, index, nx, ny, isShiftPressed = false) {
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    if (tool === 'solid') {
        let localPt = { x: nx, y: ny };
        try {
            const mInv = shape.getCTM().inverse();
            let p = svgCanvas.createSVGPoint();
            p.x = nx; p.y = ny;
            const t = p.matrixTransform(mInv);
            localPt = { x: t.x, y: t.y };
        } catch (e) { return; }
        if (subTool === 'solid-cube') {
            const x = parseFloat(shape.getAttribute('data-x'));
            const y = parseFloat(shape.getAttribute('data-y'));
            if (index === 0) {
                let newW = localPt.x - x;
                if (newW < 10) newW = 10;
                shape.setAttribute('data-w', newW);
            } else if (index === 1) {
                let newH = localPt.y - y;
                if (newH < 10) newH = 10;
                shape.setAttribute('data-h', newH);
            } else if (index === 2) {
                const w = parseFloat(shape.getAttribute('data-w'));
                const frontRightX = x + w;
                const frontRightY = y;
                const dx = localPt.x - frontRightX;
                const dy = localPt.y - frontRightY;
                shape.setAttribute('data-dx', dx);
                shape.setAttribute('data-dy', dy);
            }
        }
        else if (subTool === 'solid-cylinder' || subTool === 'solid-cone') {
            const cx = parseFloat(shape.getAttribute('data-cx'));
            const cy = parseFloat(shape.getAttribute('data-cy'));
            const h = parseFloat(shape.getAttribute('data-h'));
            if (index === 0) {
                const dist = Math.abs(localPt.x - cx);
                if (dist > 5) shape.setAttribute('data-r', dist);
            } else if (index === 1) {
                const botY = cy + h;
                let newH = botY - localPt.y;
                if (newH < 10) newH = 10;
                shape.setAttribute('data-cy', localPt.y);
                shape.setAttribute('data-h', newH);
            }
        }
        redrawSolid(shape);
        drawHandles(shape);
        updateDependentShapes(shape);
        return;
    }
    if (subTool === 'circle-smart') {
        const circleBody = shape.querySelector('.circle-body');
        const line = shape.querySelector('.circle-line');
        const internalCx = parseFloat(circleBody.getAttribute('cx'));
        const internalCy = parseFloat(circleBody.getAttribute('cy'));
        const lineType = shape.getAttribute('data-line-type');
        let localPt = { x: nx, y: ny };
        try {
            const mInv = shape.getCTM().inverse();
            let p = svgCanvas.createSVGPoint();
            p.x = nx; p.y = ny;
            const t = p.matrixTransform(mInv);
            localPt = { x: t.x, y: t.y };
        } catch (e) { return; }
        const dx = localPt.x - internalCx;
        const dy = localPt.y - internalCy;
        const newAngleRad = Math.atan2(dy, dx);
        const newAngleDeg = newAngleRad * 180 / Math.PI;
        const newR = Math.sqrt(dx * dx + dy * dy);
        shape.setAttribute('data-radius', newR);
        shape.setAttribute('data-angle', newAngleDeg);
        circleBody.setAttribute('r', newR);
        const cos = Math.cos(newAngleRad);
        const sin = Math.sin(newAngleRad);
        if (lineType === 'radius') {
            line.setAttribute('x1', internalCx); line.setAttribute('y1', internalCy);
            line.setAttribute('x2', internalCx + newR * cos); line.setAttribute('y2', internalCy + newR * sin);
        } else {
            line.setAttribute('x1', internalCx - newR * cos); line.setAttribute('y1', internalCy - newR * sin);
            line.setAttribute('x2', internalCx + newR * cos); line.setAttribute('y2', internalCy + newR * sin);
        }
        drawHandles(shape);
        updateDependentShapes(shape);
        return;
    }
    if (subTool === 'venn') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const count = parseInt(shape.getAttribute('data-count'));
        let localMousePos = { x: nx, y: ny };
        try {
            const mInv = shape.getCTM().inverse();
            let p = svgCanvas.createSVGPoint();
            p.x = nx; p.y = ny;
            const t = p.matrixTransform(mInv);
            localMousePos = { x: t.x, y: t.y };
        } catch (e) { return; }
        if (index === 0) {
            let circleCenterX, circleCenterY;
            if (count === 2) {
                const d = parseFloat(shape.getAttribute('data-radius')) * (parseFloat(shape.getAttribute('data-spacing-percent')) / 100) * 2;
                circleCenterX = cx - d / 2; circleCenterY = cy;
            } else {
                circleCenterX = cx;
                const d = parseFloat(shape.getAttribute('data-radius')) * (parseFloat(shape.getAttribute('data-spacing-percent')) / 100) * 2;
                circleCenterY = cy - (d * Math.sqrt(3) / 2) / 2;
            }
            const newR = Math.hypot(localMousePos.x - circleCenterX, localMousePos.y - circleCenterY);
            if (newR > 10) { shape.setAttribute('data-radius', newR); }
        } else if (index === 1) {
            const r = parseFloat(shape.getAttribute('data-radius'));
            let d;
            if (count === 2) { d = Math.abs(localMousePos.x - (cx - r * (parseFloat(shape.getAttribute('data-spacing-percent')) / 100))); }
            else {
                const h = (localMousePos.y > cy) ? (localMousePos.y - cy) : (cy - localMousePos.y);
                d = (h / (Math.sqrt(3) / 4));
            }
            const newSpacingPercent = (d / (2 * r)) * 100;
            if (newSpacingPercent > 0 && newSpacingPercent < 200) { shape.setAttribute('data-spacing-percent', newSpacingPercent); }
        }
        redrawVennDiagram(shape);
        drawHandles(shape);
        return;
    }
    if (subTool === 'pie-chart') {
        let localMousePos = { x: nx, y: ny };
        try {
            const mInv = shape.getCTM().inverse();
            let p = svgCanvas.createSVGPoint();
            p.x = nx; p.y = ny;
            const t = p.matrixTransform(mInv);
            localMousePos = { x: t.x, y: t.y };
        } catch (e) { return; }
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const valuesAttr = shape.getAttribute('data-values');
        const anglesAttr = shape.getAttribute('data-angles');
        if (!anglesAttr || !valuesAttr) return;
        const values = JSON.parse(valuesAttr);
        const total = values.reduce((a, b) => a + b, 0);
        const dx = localMousePos.x - cx;
        const dy = localMousePos.y - cy;
        let newAngle = Math.atan2(dy, dx);
        if (newAngle < 0) newAngle += 2 * Math.PI;
        const angles = JSON.parse(anglesAttr);
        const prevAngle = (index > 0) ? angles[index - 1] : 0;
        const nextAngle = (index < angles.length - 1) ? angles[index + 1] : 2 * Math.PI;
        const normalizeAngle = (angle) => (angle + 2 * Math.PI) % (2 * Math.PI);
        let normalizedNewAngle = normalizeAngle(newAngle);
        let normalizedPrevAngle = normalizeAngle(prevAngle);
        let normalizedNextAngle = normalizeAngle(nextAngle);
        if (normalizedPrevAngle > normalizedNextAngle) {
            normalizedNextAngle += 2 * Math.PI;
            if (normalizedNewAngle < normalizedPrevAngle) normalizedNewAngle += 2 * Math.PI;
        }
        if (normalizedNewAngle < normalizedPrevAngle) normalizedNewAngle = normalizedPrevAngle;
        if (normalizedNewAngle > normalizedNextAngle) normalizedNewAngle = normalizedNextAngle;
        newAngle = normalizeAngle(normalizedNewAngle);
        angles[index] = newAngle;
        let lastAng = 0;
        for (let i = 0; i < angles.length; i++) {
            let currentAng = angles[i];
            if (currentAng < lastAng) currentAng += 2 * Math.PI;
            values[i] = (currentAng - lastAng) / (2 * Math.PI) * total;
            lastAng = currentAng;
        }
        shape.setAttribute('data-values', JSON.stringify(values.map(v => parseFloat(v.toFixed(2)))));
        shape.setAttribute('data-angles', JSON.stringify(angles.map(a => parseFloat(a.toFixed(4)))));
        redrawPieChart(shape);
        drawHandles(shape);
        return;
    }
    if (subTool && subTool.includes('-angle')) {
        const circleId = shape.getAttribute('data-owner-circle-id');
        const ownerCircle = document.getElementById(circleId);
        if (!ownerCircle) return;
        const m = ownerCircle.getCTM();
        const cx = (parseFloat(ownerCircle.getAttribute('cx') || 0)) * m.a + m.e;
        const cy = (parseFloat(ownerCircle.getAttribute('cy') || 0)) * m.d + m.f;
        const dist = Math.hypot(nx - cx, ny - cy);
        const newR = dist / m.a;
        if (ownerCircle.tagName === 'circle') { ownerCircle.setAttribute('r', newR); }
        else { ownerCircle.setAttribute('rx', newR); ownerCircle.setAttribute('ry', newR); }
        let groupMatrixInv;
        try { groupMatrixInv = shape.getCTM().inverse(); } catch (e) { return; }
        const dataNodes = shape.querySelectorAll('.vertex-data');
        dataNodes.forEach(pt => {
            const idx = parseInt(pt.getAttribute('data-index'));
            const oldLx = parseFloat(pt.getAttribute('cx'));
            const oldLy = parseFloat(pt.getAttribute('cy'));
            let pOld = svgCanvas.createSVGPoint();
            pOld.x = oldLx; pOld.y = oldLy;
            const pGlobalOld = pOld.matrixTransform(shape.getCTM());
            let angle = Math.atan2(pGlobalOld.y - cy, pGlobalOld.x - cx);
            if (idx === index) { angle = Math.atan2(ny - cy, nx - cx); }
            if (subTool === 'central-angle' && idx === 0) {
                let pC = svgCanvas.createSVGPoint();
                pC.x = cx; pC.y = cy;
                const pLocalC = pC.matrixTransform(groupMatrixInv);
                pt.setAttribute('cx', pLocalC.x); pt.setAttribute('cy', pLocalC.y);
                return;
            }
            const newGx = cx + dist * Math.cos(angle);
            const newGy = cy + dist * Math.sin(angle);
            let pNew = svgCanvas.createSVGPoint();
            pNew.x = newGx; pNew.y = newGy;
            const pLocalNew = pNew.matrixTransform(groupMatrixInv);
            pt.setAttribute('cx', pLocalNew.x); pt.setAttribute('cy', pLocalNew.y);
        });
        redrawCircleAngle(shape);
        drawHandles(shape);
        if (typeof refreshAngleLabels === 'function') refreshAngleLabels(shape);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
        return;
    }
    if (isShiftPressed && tool !== 'point' && tool !== 'text' && tool !== 'math' && tool !== 'group') {
        try {
            const mInv = shape.getCTM().inverse();
            let pMouse = svgCanvas.createSVGPoint();
            pMouse.x = nx; pMouse.y = ny;
            const localMouse = pMouse.matrixTransform(mInv);
            const tag = shape.tagName.toLowerCase();
            let lc = { x: 0, y: 0 };
            let lh = { x: 0, y: 0 };
            if (tag === 'circle' || tag === 'ellipse') {
                lc.x = parseFloat(shape.getAttribute('cx') || 0);
                lc.y = parseFloat(shape.getAttribute('cy') || 0);
                const rx = parseFloat(shape.getAttribute('rx') || shape.getAttribute('r') || 0);
                const ry = parseFloat(shape.getAttribute('ry') || shape.getAttribute('r') || 0);
                if (index === 0) lh = { x: lc.x + rx, y: lc.y };
                else if (index === 1) lh = { x: lc.x, y: lc.y + ry };
                else if (index === 2) lh = { x: lc.x - rx, y: lc.y };
                else lh = { x: lc.x, y: lc.y - ry };
            }
            else if (tag === 'rect' || tag === 'image') {
                const x = parseFloat(shape.getAttribute('x') || 0);
                const y = parseFloat(shape.getAttribute('y') || 0);
                const w = parseFloat(shape.getAttribute('width') || 0);
                const h = parseFloat(shape.getAttribute('height') || 0);
                lc = { x: x + w / 2, y: y + h / 2 };
                if (index === 0) lh = { x: x + w, y: y + h };
                else if (index === 1) lh = { x: x, y: y + h };
                else if (index === 2) lh = { x: x + w, y: y };
                else lh = { x: x, y: y };
            }
            else if (tool === 'line' || tag === 'line') {
                let line = (tag === 'g') ? (shape.querySelector('.visible-line') || shape.querySelector('line')) : shape;
                const x1 = parseFloat(line.getAttribute('x1')); const y1 = parseFloat(line.getAttribute('y1'));
                const x2 = parseFloat(line.getAttribute('x2')); const y2 = parseFloat(line.getAttribute('y2'));
                lc = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
                lh = (index === 0) ? { x: x1, y: y1 } : { x: x2, y: y2 };
            }
            else if (tag === 'polygon' || tag === 'polyline') {
                const ptsStr = shape.getAttribute('points');
                if (ptsStr) {
                    const pts = parsePoints(ptsStr);
                    let sx = 0, sy = 0;
                    pts.forEach(p => { sx += p.x; sy += p.y; });
                    lc = { x: sx / pts.length, y: sy / pts.length };
                    lh = pts[index];
                }
            }
            const oldDist = Math.hypot(lh.x - lc.x, lh.y - lc.y);
            const newDist = Math.hypot(localMouse.x - lc.x, localMouse.y - lc.y);
            if (oldDist < 0.1) return;
            const scale = newDist / oldDist;
            if (tag === 'circle' || tag === 'ellipse') {
                const rx = parseFloat(shape.getAttribute('rx') || shape.getAttribute('r') || 0);
                const ry = parseFloat(shape.getAttribute('ry') || shape.getAttribute('r') || 0);
                if (tag === 'circle') shape.setAttribute('r', rx * scale);
                else { shape.setAttribute('rx', rx * scale); shape.setAttribute('ry', ry * scale); }
            }
            else if (tag === 'rect' || tag === 'image') {
                const w = parseFloat(shape.getAttribute('width'));
                const h = parseFloat(shape.getAttribute('height'));
                const newW = w * scale; const newH = h * scale;
                shape.setAttribute('width', newW); shape.setAttribute('height', newH);
                shape.setAttribute('x', lc.x - newW / 2); shape.setAttribute('y', lc.y - newH / 2);
            }
            else if (tool === 'line' || tag === 'line') {
                let targetEl = (tag === 'g') ? shape.querySelectorAll('line') : [shape];
                targetEl.forEach(l => {
                    const x1 = parseFloat(l.getAttribute('x1')); const y1 = parseFloat(l.getAttribute('y1'));
                    const x2 = parseFloat(l.getAttribute('x2')); const y2 = parseFloat(l.getAttribute('y2'));
                    l.setAttribute('x1', lc.x + (x1 - lc.x) * scale); l.setAttribute('y1', lc.y + (y1 - lc.y) * scale);
                    l.setAttribute('x2', lc.x + (x2 - lc.x) * scale); l.setAttribute('y2', lc.y + (y2 - lc.y) * scale);
                });
            }
            else if (tag === 'polygon' || tag === 'polyline') {
                const ptsStr = shape.getAttribute('points');
                if (ptsStr) {
                    const pts = parsePoints(ptsStr);
                    const newPts = pts.map(p => ({ x: lc.x + (p.x - lc.x) * scale, y: lc.y + (p.y - lc.y) * scale }));
                    shape.setAttribute('points', newPts.map(p => `${p.x},${p.y}`).join(' '));
                }
            }
            updateDependentShapes(shape);
            if (typeof refreshIntersectionAngles === 'function') refreshIntersectionAngles(shape);
            drawHandles(shape);
            return;
        } catch (e) { }
    }
    const tagName = shape.tagName.toLowerCase();
    if (tool === 'line' && tagName === 'g' && shape.hasAttribute('data-fixed-angle')) {
        const fixedAng = parseFloat(shape.getAttribute('data-fixed-angle'));
        const lineEl = shape.querySelector('line');
        if (isShiftPressed && lineEl) {
            if (index === 1) {
                const x1 = parseFloat(lineEl.getAttribute('x1')); const y1 = parseFloat(lineEl.getAttribute('y1'));
                const dx = nx - x1; const dy = ny - y1;
                let projectionLen = dx * Math.cos(fixedAng) + dy * Math.sin(fixedAng);
                if (projectionLen < 10) projectionLen = 10;
                nx = x1 + projectionLen * Math.cos(fixedAng); ny = y1 + projectionLen * Math.sin(fixedAng);
            } else if (index === 0) {
                const x2 = parseFloat(lineEl.getAttribute('x2')); const y2 = parseFloat(lineEl.getAttribute('y2'));
                const dx = nx - x2; const dy = ny - y2;
                let projectionLen = dx * Math.cos(fixedAng + Math.PI) + dy * Math.sin(fixedAng + Math.PI);
                if (projectionLen < 10) projectionLen = 10;
                nx = x2 + projectionLen * Math.cos(fixedAng + Math.PI); ny = y2 + projectionLen * Math.sin(fixedAng + Math.PI);
            }
        }
    }
    let localPt = { x: nx, y: ny };
    try {
        const m = shape.getCTM().inverse();
        const p = svgCanvas.createSVGPoint();
        p.x = nx; p.y = ny;
        const t = p.matrixTransform(m);
        localPt = { x: t.x, y: t.y };
    } catch (e) { return; }
    const lx = localPt.x; const ly = localPt.y;
    if (tool === 'line') {
        if (tagName === 'g') {
            const lines = shape.querySelectorAll('line');
            lines.forEach(l => {
                if (index === 0) { l.setAttribute('x1', lx); l.setAttribute('y1', ly); }
                else { l.setAttribute('x2', lx); l.setAttribute('y2', ly); }
            });
        } else {
            if (index === 0) { shape.setAttribute('x1', lx); shape.setAttribute('y1', ly); }
            else { shape.setAttribute('x2', lx); shape.setAttribute('y2', ly); }
        }
    } else if (tool === 'polygon' || tool === 'polyline' || tool === 'angle' || tool === 'tangent') {
        const pointsStr = shape.getAttribute('points');
        if (!pointsStr) return;
        let pts = parsePoints(pointsStr);
        if (pts[index]) {
            if (tool === 'tangent') {
                const circleId = shape.getAttribute('data-circle-id');
                const circle = document.getElementById(circleId);
                if (circle && index === 1) {
                    const mC = circle.getCTM();
                    const cx_abs = (+circle.getAttribute('cx')) * mC.a + mC.e;
                    const cy_abs = (+circle.getAttribute('cy')) * mC.d + mC.f;
                    const r_abs = (+circle.getAttribute('rx')) * mC.a;
                    const mS_inv = shape.getCTM().inverse();
                    let p = svgCanvas.createSVGPoint();
                    p.x = cx_abs; p.y = cy_abs;
                    const localC = p.matrixTransform(mS_inv);
                    const res = getTangentPoints(localC.x, localC.y, r_abs, lx, ly);
                    if (res) { pts[0] = res.t1; pts[2] = res.t2; }
                }
            }
            pts[index] = { x: lx, y: ly };
            const newPointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
            shape.setAttribute('points', newPointsStr);
        }
    } else if (tagName === 'rect' || tagName === 'image') {
        const x = parseFloat(shape.getAttribute('x')); const y = parseFloat(shape.getAttribute('y'));
        const w = parseFloat(shape.getAttribute('width')); const h = parseFloat(shape.getAttribute('height'));
        let anchorX, anchorY;
        if (index === 0) { anchorX = x + w; anchorY = y + h; }
        else if (index === 1) { anchorX = x; anchorY = y + h; }
        else if (index === 2) { anchorX = x + w; anchorY = y; }
        else if (index === 3) { anchorX = x; anchorY = y; }
        const newX = Math.min(lx, anchorX); const newY = Math.min(ly, anchorY);
        const newW = Math.abs(lx - anchorX); const newH = Math.abs(ly - anchorY);
        shape.setAttribute('x', newX); shape.setAttribute('y', newY);
        shape.setAttribute('width', newW); shape.setAttribute('height', newH);
    } else if (tool === 'ellipse' || tool === 'circle') {
        const subTool = shape.getAttribute('data-sub-tool');
        if (['sector', 'arc', 'arch'].includes(subTool)) {
            if (index !== 0) {
                const cx = +shape.getAttribute('data-center-x');
                const cy = +shape.getAttribute('data-center-y');
                const drawDir = shape.getAttribute('data-draw-dir') || 'left';
                const sweepFlag = (drawDir === 'left') ? 0 : 1;
                const newR = Math.hypot(lx - cx, ly - cy);
                let newAng = Math.atan2(-(ly - cy), lx - cx);
                if (newAng < 0) newAng += 2 * Math.PI;
                let sA = +shape.getAttribute('data-start-angle');
                let eA = +shape.getAttribute('data-end-angle');
                if (index === 1) sA = newAng; else eA = newAng;
                const startX = cx + newR * Math.cos(sA); const startY = cy - newR * Math.sin(sA);
                const endX = cx + newR * Math.cos(eA); const endY = cy - newR * Math.sin(eA);
                let diff = (sweepFlag === 0) ? (eA - sA) : (sA - eA);
                while (diff < 0) diff += 2 * Math.PI;
                const largeArc = diff > Math.PI ? 1 : 0;
                let d = "";
                if (subTool === 'arc') d = `M ${startX} ${startY} A ${newR} ${newR} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`;
                else if (subTool === 'sector') d = `M ${cx} ${cy} L ${startX} ${startY} A ${newR} ${newR} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
                else if (subTool === 'arch') d = `M ${startX} ${startY} A ${newR} ${newR} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
                shape.setAttribute('d', d);
                shape.setAttribute('data-radius', newR);
                shape.setAttribute('data-start-angle', sA);
                shape.setAttribute('data-end-angle', eA);
            }
        } else {
            const cx = parseFloat(shape.getAttribute('cx'));
            const cy = parseFloat(shape.getAttribute('cy'));
            const dist = Math.abs((index % 2 === 0) ? (lx - cx) : (ly - cy));
            if (index % 2 === 0) {
                shape.setAttribute('rx', dist);
                if (tool === 'circle') shape.setAttribute('ry', dist);
            } else {
                shape.setAttribute('ry', dist);
                if (tool === 'circle') shape.setAttribute('rx', dist);
            }
        }
    } else if (tool === 'text' || tool === 'math') {
        const anchorY = parseFloat(shape.getAttribute('y'));
        const newH = Math.abs(ly - anchorY);
        if (newH > 5) {
            let newSize = newH;
            if (tool === 'math') newSize = newH * 0.8;
            shape.setAttribute('data-font-size', newSize);
            if (tool === 'math') {
                const div = shape.querySelector('.math-content');
                if (div) div.style.fontSize = newSize + "px";
            } else {
                shape.setAttribute('font-size', newSize);
                shape.style.fontSize = newSize + "px";
            }
        }
    }
    updateDependentShapes(shape);
    if (typeof refreshIntersectionAngles === 'function') { refreshIntersectionAngles(shape); }
    if (typeof updateLabelPositions === 'function') { updateLabelPositions(shape); }
}
function updateDependentShapes(parentShape) {
    if (!parentShape || !parentShape.id) return;
    const pts = getTransformedPoints(parentShape);
    const tagName = parentShape.tagName.toLowerCase();
    const tool = parentShape.getAttribute('data-tool');
    if (tool === 'ellipse') {
        const matrix = parentShape.getCTM();
        const localCx = parseFloat(parentShape.getAttribute('cx') || 0);
        const localCy = parseFloat(parentShape.getAttribute('cy') || 0);
        const globalCx = localCx * matrix.a + localCy * matrix.c + matrix.e;
        const globalCy = localCx * matrix.b + localCy * matrix.d + matrix.f;
        const centers = document.querySelectorAll(`[data-owner-shape="${parentShape.id}"]`);
        centers.forEach(child => {
            const depType = child.getAttribute('data-dependency-type');
            if (depType === 'center-point') {
                child.setAttribute('cx', globalCx);
                child.setAttribute('cy', globalCy);
                child.removeAttribute('transform');
            } else if (depType === 'center-label') {
                child.setAttribute('x', globalCx - 12);
                child.setAttribute('y', globalCy - 12);
                child.removeAttribute('transform');
            }
        });
    }
    const constructionGroups = document.querySelectorAll(`.construction-obj[data-owner-shape="${parentShape.id}"]`);
    if (constructionGroups.length > 0) {
        if (pts.length === 3) {
            constructionGroups.forEach(group => {
                if (typeof updateTriangleConstruction === 'function') {
                    updateTriangleConstruction(group, pts);
                }
            });
        }
    }
    const circleAngles = document.querySelectorAll(`.shape[data-owner-circle-id="${parentShape.id}"]`);
    circleAngles.forEach(group => {
        if (typeof redrawCircleAngle === 'function') { redrawCircleAngle(group); }
        if (typeof updateLabelPositions === 'function') { updateLabelPositions(group); }
    });
    if (typeof refreshAngleLabels === 'function') {
        refreshAngleLabels(parentShape);
        circleAngles.forEach(group => refreshAngleLabels(group));
    }
    if (pts.length >= 2) {
        const dependents = document.querySelectorAll(`
            [data-owner-shape="${parentShape.id}"], 
            [data-owner="${parentShape.id}"]
        `);
        dependents.forEach(child => {
            const type = child.getAttribute('data-dependency-type');
            if (!type) return;
            if (type === 'midpoint') {
                const p1 = pts[0]; const p2 = pts[1];
                const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
                child.setAttribute('cx', mx); child.setAttribute('cy', my);
                child.removeAttribute('transform');
            }
            else if (type === 'perpendicular') {
                const p1 = pts[0]; const p2 = pts[1];
                const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
                const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    const ux = -dy / len; const uy = dx / len;
                    const size = 100;
                    const lines = child.querySelectorAll('line');
                    lines.forEach(l => {
                        l.setAttribute('x1', mx - ux * size); l.setAttribute('y1', my - uy * size);
                        l.setAttribute('x2', mx + ux * size); l.setAttribute('y2', my + uy * size);
                    });
                    child.removeAttribute('transform');
                }
            }
            else if (type === 'divide_line') {
                const ratio = parseFloat(child.getAttribute('data-divide-ratio'));
                if (!isNaN(ratio)) {
                    const p1 = pts[0]; const p2 = pts[1];
                    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                    const totalLen = Math.sqrt(dx * dx + dy * dy);
                    const px = p1.x + dx * ratio; const py = p1.y + dy * ratio;
                    const ux = dx / totalLen; const uy = dy / totalLen;
                    const nx = -uy; const ny = ux;
                    const tickSize = 5;
                    const lines = child.querySelectorAll('line');
                    lines.forEach(l => {
                        l.setAttribute('x1', px - nx * tickSize); l.setAttribute('y1', py - ny * tickSize);
                        l.setAttribute('x2', px + nx * tickSize); l.setAttribute('y2', py + ny * tickSize);
                    });
                    child.removeAttribute('transform');
                }
            }
            else if (type === 'edge_mark') {
                let idx = parseInt(child.getAttribute('data-edge-index'));
                if (isNaN(idx)) idx = 0;
                if (pts[idx] && pts[(idx + 1) % pts.length]) {
                    const p1 = pts[idx]; const p2 = pts[(idx + 1) % pts.length];
                    const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                    child.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle})`);
                }
            }
            else if (type === 'dimension') {
                const p1 = pts[0]; const p2 = pts[1];
                const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                const angle = Math.atan2(dy, dx);
                const offset = 40; const extOver = 10; const extGap = 5; const arrowLen = 10; const arrowW = 4;
                let nx = -Math.sin(angle); let ny = Math.cos(angle);
                if (ny > 0.001 || (Math.abs(ny) < 0.001 && nx > 0)) { nx = -nx; ny = -ny; }
                const ux = Math.cos(angle); const uy = Math.sin(angle);
                const lines = child.querySelectorAll('line.dimension-line');
                if (lines.length >= 2) {
                    lines[0].setAttribute('x1', p1.x + nx * extGap); lines[0].setAttribute('y1', p1.y + ny * extGap);
                    lines[0].setAttribute('x2', p1.x + nx * (offset + extOver)); lines[0].setAttribute('y2', p1.y + ny * (offset + extOver));
                    lines[1].setAttribute('x1', p2.x + nx * extGap); lines[1].setAttribute('y1', p2.y + ny * extGap);
                    lines[1].setAttribute('x2', p2.x + nx * (offset + extOver)); lines[1].setAttribute('y2', p2.y + ny * (offset + extOver));
                }
                const tip1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
                const tip2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
                const midX = (tip1.x + tip2.x) / 2; const midY = (tip1.y + tip2.y) / 2;
                const paths = child.querySelectorAll('path');
                if (paths.length >= 2) {
                    const textEl = child.querySelector('text');
                    const textLen = textEl ? (textEl.textContent.length * 9) : 30;
                    const textGap = Math.max(15, textLen / 2 + 5);
                    const updateArrow = (path, tip, dirSign) => {
                        const shaftStart = { x: midX + (dirSign * ux * textGap), y: midY + (dirSign * uy * textGap) };
                        const backX = tip.x + (dirSign === -1 ? ux : -ux) * arrowLen;
                        const backY = tip.y + (dirSign === -1 ? uy : -uy) * arrowLen;
                        const w1x = backX + nx * arrowW, w1y = backY + ny * arrowW;
                        const w2x = backX - nx * arrowW, w2y = backY - ny * arrowW;
                        let d = `M ${shaftStart.x} ${shaftStart.y} L ${tip.x} ${tip.y} `;
                        d += `M ${tip.x} ${tip.y} L ${w1x} ${w1y} L ${w2x} ${w2y} Z`;
                        path.setAttribute('d', d);
                    };
                    updateArrow(paths[0], tip1, -1); updateArrow(paths[1], tip2, 1);
                }
                const textEl = child.querySelector('text');
                if (textEl) {
                    textEl.setAttribute('x', midX); textEl.setAttribute('y', midY);
                    let textRot = angle * 180 / Math.PI;
                    if (textRot > 90) textRot -= 180; else if (textRot < -90) textRot += 180;
                    textEl.setAttribute("transform", `rotate(${textRot}, ${midX}, ${midY})`);
                }
                child.removeAttribute('transform');
            }
            else if (type === 'divide_angle_line' || type === 'angle_division_mark') {
                const vIdx = parseInt(child.getAttribute('data-vertex-index'));
                if (!isNaN(vIdx) && pts.length >= 3 && pts[vIdx]) {
                    const B = pts[vIdx];
                    const A = pts[(vIdx - 1 + pts.length) % pts.length];
                    const C = pts[(vIdx + 1) % pts.length];
                    const angBA = Math.atan2(A.y - B.y, A.x - B.x);
                    const angBC = Math.atan2(C.y - B.y, C.x - B.x);
                    let diff = angBC - angBA;
                    while (diff <= -Math.PI) diff += 2 * Math.PI;
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    const ratio = parseFloat(child.getAttribute('data-divide-ratio'));
                    const targetAng = angBA + diff * ratio;
                    if (type === 'divide_angle_line') {
                        const len = 150; const ex = B.x + len * Math.cos(targetAng); const ey = B.y + len * Math.sin(targetAng);
                        const lines = child.querySelectorAll('line');
                        lines.forEach(l => { l.setAttribute('x1', B.x); l.setAttribute('y1', B.y); l.setAttribute('x2', ex); l.setAttribute('y2', ey); });
                        child.removeAttribute('transform'); child.setAttribute('data-fixed-angle', targetAng);
                    }
                    else if (type === 'angle_division_mark') {
                        const markDist = 45; const mx = B.x + markDist * Math.cos(targetAng); const my = B.y + markDist * Math.sin(targetAng);
                        child.setAttribute('x', mx); child.setAttribute('y', my); child.removeAttribute('transform');
                    }
                }
            }
            if (typeof updateLabelPositions === 'function') { updateLabelPositions(child); }
        });
    }
}