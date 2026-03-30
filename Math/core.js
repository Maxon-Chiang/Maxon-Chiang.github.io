let continuousTextStr = "A";
let PEN_SMOOTH_THRESHOLD = 8;
try {
    const savedSmooth = localStorage.getItem('math_editor_pen_smooth');
    if (savedSmooth) PEN_SMOOTH_THRESHOLD = parseFloat(savedSmooth);
} catch(e) {}
const SELECTION_SNAP_RADIUS_LOCK = 8;  // 🔒 鎖定標記的選取半徑 (px)，數字越小越精準
const SELECTION_SNAP_RADIUS_AUX = 12; // 📎 附屬物件(標註/半徑/中線等)的選取半徑 (px)
const SELECTION_SNAP_RADIUS_MAIN = 15; // 🔷 主要幾何圖形的選取半徑 (px)
let svgCanvas = document.getElementById('svg-canvas');
let bgLayer = document.getElementById('background-layer');
let shapesLayer = document.getElementById('shapes-layer');
let tempLayer = document.getElementById('temp-layer');
let handlesLayer = document.getElementById('handles-layer');
const statusText = document.getElementById('status-text');
const selectionRect = document.getElementById('selection-rect');
const drawingArea = document.getElementById('drawing-area');
const ns = "http://www.w3.org/2000/svg";
const symbolContainer = document.getElementById('symbol-container');
let mode = 'draw';
let currentTool = 'line';
let currentSubTool = 'line-simple';
let polygonSides = 5;
let lastClickPos = {
    x: 0,
    y: 0
};
let markModeType = null;
let isContinuousMarking = false;
let isContinuousDraw = false;
let isDirectClick = false;
let labelIndex = 0;
let currentEdgeStyle = '1';
let currentAngleStyle = 'degree';
let isLabelClockwise = false;
let constructionModeType = null;
let constructionStep = 0;
let actionHistory =[];
let potentialSingleSelectTarget = null;
window.potentialRemoveTarget = null; // 記錄要在 mouseup 移除的選取物件
let historyIndex = -1;
const MAX_HISTORY = 50;
let isDragging = false;
let isBoxSelecting = false;
let startX, startY;
let boxStartX = 0;
let boxStartY = 0;
let currentShape = null;
let currentPathPoints =[];
let selectedElements =[];
let draggingHandleIndex = null;
let isRotating = false;
let isEditingText = false;
let editingTextElement = null;
var isImportedContent = false;
let defaultToolIcons = {};
let symmetryStep = 0;
let clipboard =[];
let lastFillColor = '#7f8c8d';
let numberInputCallback = null;
let currentParamTool = null;
let isMathV2Init = false;
let currentProjectName = "MyMathGraph";
let isImportMode = false;
const SNAP_RADIUS = 15; // 吸附偵測半徑 (px)
let isIntersectionSnappingEnabled = false; // <--- 這裡改回 false
let snapIndicator = null; // 用於存放吸附提示的 SVG 物件
let lastContextPos = { x: 0, y: 0 };

window.currentClientX = 0;
window.currentClientY = 0;

// 修正：確實將定錨點掛載到 window 全域物件上
window.anchorPoint = null;
let anchorIndicator = null;


// 新增獨立的視覺標示函式
window.showVisualAnchor = function(x, y, isSubtle = false) {
    if (!anchorIndicator) {
        anchorIndicator = document.createElementNS(ns, "g");
        anchorIndicator.setAttribute("class", "anchor-indicator");
        
        const c = document.createElementNS(ns, "circle");
        c.id = "anchor-ind-circle";
        c.setAttribute("cx", 0); c.setAttribute("cy", 0);
        
        const hLine = document.createElementNS(ns, "line");
        hLine.id = "anchor-ind-hline";
        
        const vLine = document.createElementNS(ns, "line");
        vLine.id = "anchor-ind-vline";
        
        anchorIndicator.appendChild(c);
        anchorIndicator.appendChild(hLine);
        anchorIndicator.appendChild(vLine);
        tempLayer.appendChild(anchorIndicator);
    }
    
    const c = anchorIndicator.querySelector('#anchor-ind-circle');
    const hLine = anchorIndicator.querySelector('#anchor-ind-hline');
    const vLine = anchorIndicator.querySelector('#anchor-ind-vline');

    if (isSubtle) {
        anchorIndicator.style.animation = "anchor-blink 1.5s ease-in-out infinite";
        c.setAttribute("r", 4);
        c.style.cssText = "fill: #3498db; stroke: none;"; 
        hLine.style.display = "none";
        vLine.style.display = "none";
    } else {
        anchorIndicator.style.animation = "anchor-blink 1s ease-in-out infinite";
        c.setAttribute("r", 5);
        c.style.cssText = "fill:none; stroke:#e74c3c; stroke-width:2;";
        hLine.style.display = "block";
        hLine.setAttribute("x1", -8); hLine.setAttribute("y1", 0); hLine.setAttribute("x2", 8); hLine.setAttribute("y2", 0);
        hLine.style.cssText = "stroke:#e74c3c; stroke-width:2;";
        vLine.style.display = "block";
        vLine.setAttribute("x1", 0); vLine.setAttribute("y1", -8); vLine.setAttribute("x2", 0); vLine.setAttribute("y2", 8);
        vLine.style.cssText = "stroke:#e74c3c; stroke-width:2;";
    }

    anchorIndicator.setAttribute("transform", `translate(${x}, ${y})`);
    anchorIndicator.style.display = "block";
};

// 雙擊時使用的實質鎖定
window.setAnchorPoint = function(x, y, isSubtle = false) {
    window.anchorPoint = { x, y }; 
    window.showVisualAnchor(x, y, isSubtle);
    if (!isSubtle) {
        statusText.innerText = `已定錨於 (${Math.round(x)}, ${Math.round(y)})，之後的建立將以此為準`;
    }
};

window.clearAnchorPoint = function() {
    window.anchorPoint = null;
    if (anchorIndicator) {
        anchorIndicator.style.display = "none";
    }
};

window.hideVisualAnchor = function() {
    if (!window.anchorPoint && anchorIndicator) {
        anchorIndicator.style.display = "none";
    }
};

function findShapeAtPosition(x, y) {
    const getDistanceToElement = (el) => {
        if (!el || el.style.display === 'none' || el.closest('[style*="display: none"]')) return Infinity;
        let dist = Infinity;
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();

        if (['line', 'polyline', 'polygon', 'rect', 'tri', 'angle', 'rhombus', 'parallelogram', 'kite', 'trapezoid'].includes(tool) ||['line', 'polyline', 'polygon'].includes(tagName)) {
            const pts = getTransformedPoints(el);
            if (pts && pts.length >= 2) {
                const len = (tool === 'polyline' || tool === 'angle' || tagName === 'line') ? pts.length - 1 : pts.length;
                for (let i = 0; i < len; i++) {
                    const d = distToSegment(x, y, pts[i].x, pts[i].y, pts[(i + 1) % pts.length].x, pts[(i + 1) % pts.length].y);
                    if (d < dist) dist = d;
                }
            }
        } else if (['ellipse', 'circle'].includes(tagName) || tool === 'ellipse' || el.getAttribute('data-sub-tool') === 'circle-smart') {
            try {
                const m = el.getCTM();
                const circleBody = tagName === 'g' ? el.querySelector('circle, ellipse') : el;
                if (circleBody) {
                    const cx = parseFloat(circleBody.getAttribute('cx') || 0) * m.a + m.e;
                    const cy = parseFloat(circleBody.getAttribute('cy') || 0) * m.d + m.f;
                    const rx = parseFloat(circleBody.getAttribute('rx') || circleBody.getAttribute('r') || 0) * m.a;
                    dist = Math.abs(Math.hypot(x - cx, y - cy) - rx);
                }
            } catch(err) {}
        } else if (el.classList.contains('axes-system')) {
            let distToX = Math.abs(y - (parseFloat(svgCanvas.getAttribute('height')) || 600) / 2);
            let distToY = Infinity;
            if (el.getAttribute('data-type') === 'xy') {
                distToY = Math.abs(x - (parseFloat(svgCanvas.getAttribute('width')) || 800) / 2);
            }
            dist = Math.min(distToX, distToY);
        } 
        // 【修復 2：解決標註遮擋問題】特別針對「長度標註」，只計算滑鼠到「文字」的距離，忽略隱形大外框
        else if (el.getAttribute('data-dependency-type') === 'dimension') {
            try {
                const txt = el.querySelector('text');
                if (txt) {
                    const mInv = txt.getCTM().inverse();
                    let p = svgCanvas.createSVGPoint(); p.x = x; p.y = y;
                    const localP = p.matrixTransform(mInv);
                    const bbox = txt.getBBox();
                    // 稍微擴大文字的點擊判定範圍 (+8px)，方便使用者點選文字來選取標註
                    if (localP.x >= bbox.x - 8 && localP.x <= bbox.x + bbox.width + 8 && 
                        localP.y >= bbox.y - 8 && localP.y <= bbox.y + bbox.height + 8) {
                        dist = 0;
                    } else {
                        const dx = Math.max(bbox.x - localP.x, 0, localP.x - (bbox.x + bbox.width));
                        const dy = Math.max(bbox.y - localP.y, 0, localP.y - (bbox.y + bbox.height));
                        dist = Math.hypot(dx, dy);
                    }
                }
            } catch (err) {}
        } 
        else {
            try {
                const mInv = el.getCTM().inverse();
                let p = svgCanvas.createSVGPoint(); p.x = x; p.y = y;
                const localP = p.matrixTransform(mInv);
                const bbox = el.getBBox();
                if (localP.x >= bbox.x && localP.x <= bbox.x + bbox.width && localP.y >= bbox.y && localP.y <= bbox.y + bbox.height) {
                    dist = 0;
                } else {
                    const dx = Math.max(bbox.x - localP.x, 0, localP.x - (bbox.x + bbox.width));
                    const dy = Math.max(bbox.y - localP.y, 0, localP.y - (bbox.y + bbox.height));
                    dist = Math.hypot(dx, dy);
                }
            } catch (err) {}
        }
        return dist;
    };

    const findClosest = (elements, radius) => {
        let best = { el: null, dist: radius };
        elements.forEach(el => {
            const dist = getDistanceToElement(el);
            if (dist < best.dist) {
                best.dist = dist;
                best.el = el;
            }
        });
        return best.el;
    };
    
    let target = findClosest(document.querySelectorAll('.geom-lock-icon'), SELECTION_SNAP_RADIUS_LOCK);
    if (target) return target;

    target = findClosest(document.querySelectorAll('[data-tool="mark"],[data-tool="mark-edge-symbol"], .vertex-label, .angle-label-text, .intersection-mark'), 12);
    if (target) return target;

    // 新增：提高「點」的選取優先級
    target = findClosest(document.querySelectorAll('[data-tool="point"]'), 10);
    if (target) return target;

    target = findClosest(
        Array.from(document.querySelectorAll('[data-dependency-type]')).filter(el => 
            !el.classList.contains('geom-lock-icon') &&
            el.getAttribute('data-tool') !== 'mark' &&
            el.getAttribute('data-tool') !== 'mark-edge-symbol' &&
            !el.classList.contains('intersection-mark') &&
            !el.classList.contains('angle-label-text') &&
            el.getAttribute('data-tool') !== 'point' // 已在前面處理過
        ), 
        SELECTION_SNAP_RADIUS_AUX
    );
    if (target) return target;

    target = findClosest(
        Array.from(document.querySelectorAll('#shapes-layer > .shape')).filter(el => 
            !el.hasAttribute('data-dependency-type') && !el.classList.contains('geom-lock-icon')
        ), 
        SELECTION_SNAP_RADIUS_MAIN
    );
    if (target) return target;

    return null; 
}

// 產生下一個文字，不觸動 labelIndex
function getNextContinuousValue() {
    let code = continuousTextStr.charCodeAt(0);
    // A-Z (65-90), a-z (97-122)
    if (code < 90) code++;       // Z -> [
    else if (code === 90) code = 97; // Z -> a
    else if (code < 122) code++; // z -> {
    else code = 122;             // z (max)
	let result = continuousTextStr;
    continuousTextStr = String.fromCharCode(code);
	return result;
}

window.showToolTipImmediate = function(text) {
    const tooltip = document.getElementById('cursor-tooltip');
    if (tooltip && text) {
        tooltip.style.display = 'block';
        // 修改：讓 X 軸多一點偏移 (向右)，Y 軸稍微置中或對齊底部，避免遮擋
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
        const mode = parts[2] || 'screen'; // 讀取第三個參數，若無則預設 screen

        if (!isNaN(w) && !isNaN(h)) {
            // 呼叫 applyCanvasSize 同步 UI 和 SVG
            if (typeof applyCanvasSize === 'function') {
                applyCanvasSize(w, h, mode);
            }
        }
    }	
    saveState();
    saveState();
    setMode('select');

    // 【新增】呼叫 library.js 中的函式來建立圖庫 UI
    if (typeof initBuiltinLibrary === 'function') {
        initBuiltinLibrary('builtin-library-container');
    }
	if (typeof initPageManager === 'function') {
        initPageManager();
    }
	if (typeof loadSystemSettings === 'function') loadSystemSettings();

    initSymbols();
    const snapIntBtn = document.getElementById('btn-snap-intersection');
    const snapPointBtn = document.getElementById('btn-snap-point');
    if (snapIntBtn && isIntersectionSnappingEnabled) snapIntBtn.classList.add('active'); 
    if (snapPointBtn && window.isPointSnappingEnabled) snapPointBtn.classList.add('active');

	const contextMenu = document.getElementById('context-menu');
	
    window.addEventListener('load', () => {
        const overlay = document.getElementById('app-loading-overlay');
        if (overlay) {
            // 給予一點緩衝時間讓初始渲染更穩定
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }, 300);
        }
    });
	
	// 全域點擊關閉選單 (這部分原本 core.js 應該已有，若無請補上)
	window.addEventListener('click', () => {
		const contextMenu = document.getElementById('context-menu');
		if (contextMenu) contextMenu.style.display = 'none';
	});
});

function redrawSolid(shape) {
    const subTool = shape.getAttribute('data-sub-tool');
    const viewMode = shape.getAttribute('data-view-mode') || '3d';

    shape.innerHTML = '';
    const strokeColor = document.getElementById('stroke-color-select')?.value || "#000000";

    const createFace = (dStr, strokeDash = 'none') => {
        const p = document.createElementNS(ns, "path");
        p.setAttribute('d', dStr);
        p.style.cssText = `fill:transparent; stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${strokeDash}; vector-effect:non-scaling-stroke;`;
        return p;
    };

    const createLabel = (x, y, text) => {
        const t = document.createElementNS(ns, "text");
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        t.textContent = text;
        t.style.cssText = `font-family: 'Microsoft JhengHei', Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #c0392b; text-anchor: middle; dominant-baseline: central; pointer-events: none;`;
        t.style.paintOrder = "stroke fill";
        t.style.stroke = "white";
        t.style.strokeWidth = "3px";
        t.style.strokeLinejoin = "round";
        return t;
    };

    if (subTool === 'solid-cube') {
        const w = parseFloat(shape.getAttribute('data-w')) || 0;
        const h = parseFloat(shape.getAttribute('data-h')) || 0;
        const d = parseFloat(shape.getAttribute('data-d')) || 50; 
        const x = parseFloat(shape.getAttribute('data-x')) || 0;
        const y = parseFloat(shape.getAttribute('data-y')) || 0;

        if (viewMode === '3d') {
            const ang = 45 * Math.PI / 180;
            const dx = d * Math.cos(ang) * 0.5; 
            const dy = -d * Math.sin(ang) * 0.5;
            
            const f1 = { x: x, y: y }; 
            const f2 = { x: x + w, y: y }; 
            const f3 = { x: x + w, y: y + h }; 
            const f4 = { x: x, y: y + h }; 

            const b1 = { x: f1.x + dx, y: f1.y + dy }; 
            const b2 = { x: f2.x + dx, y: f2.y + dy }; 
            const b3 = { x: f3.x + dx, y: f3.y + dy }; 
            const b4 = { x: f4.x + dx, y: f4.y + dy }; 

            shape.setAttribute('data-dx', dx);
            shape.setAttribute('data-dy', dy);

            shape.appendChild(createFace(`M ${b1.x} ${b1.y} L ${b2.x} ${b2.y} L ${b3.x} ${b3.y} L ${b4.x} ${b4.y} Z`, '4,4')); 
            shape.appendChild(createFace(`M ${f1.x} ${f1.y} L ${b1.x} ${b1.y} L ${b4.x} ${b4.y} L ${f4.x} ${f4.y} Z`, '4,4')); 
            shape.appendChild(createFace(`M ${f4.x} ${f4.y} L ${f3.x} ${f3.y} L ${b3.x} ${b3.y} L ${b4.x} ${b4.y} Z`, '4,4')); 
            shape.appendChild(createFace(`M ${f2.x} ${f2.y} L ${b2.x} ${b2.y} L ${b3.x} ${b3.y} L ${f3.x} ${f3.y} Z`)); 
            shape.appendChild(createFace(`M ${f1.x} ${f1.y} L ${b1.x} ${b1.y} L ${b2.x} ${b2.y} L ${f2.x} ${f2.y} Z`)); 
            shape.appendChild(createFace(`M ${f1.x} ${f1.y} L ${f2.x} ${f2.y} L ${f3.x} ${f3.y} L ${f4.x} ${f4.y} Z`)); 

            shape.appendChild(createLabel(x + w/2, y + h/2, '前'));
            shape.appendChild(createLabel(x + w/2 + dx/2, y + dy/2, '上'));
            shape.appendChild(createLabel(x + w + dx/2, y + h/2 + dy/2, '右'));

        } else {
            const cx = x + w/2;
            const cy = y + h/2;
            if (isNaN(cx) || isNaN(cy) || isNaN(w) || isNaN(h) || isNaN(d)) return;

            shape.appendChild(createFace(`M ${x} ${y-d} h ${w} v ${d} h ${-w} Z`)); 
            shape.appendChild(createFace(`M ${x} ${y} h ${w} v ${h} h ${-w} Z`)); 
            shape.appendChild(createFace(`M ${x} ${y+h} h ${w} v ${d} h ${-w} Z`)); 
            shape.appendChild(createFace(`M ${x} ${y+h+d} h ${w} v ${h} h ${-w} Z`)); 
            shape.appendChild(createFace(`M ${x-d} ${y} h ${d} v ${h} h ${-d} Z`)); 
            shape.appendChild(createFace(`M ${x+w} ${y} h ${d} v ${h} h ${-d} Z`)); 

            shape.appendChild(createLabel(cx, cy, '前'));
            shape.appendChild(createLabel(cx, cy - h/2 - d/2, '上')); 
            shape.appendChild(createLabel(cx, cy + h/2 + d/2, '下'));
            shape.appendChild(createLabel(cx, cy + h/2 + d + h/2, '後'));
            shape.appendChild(createLabel(cx - w/2 - d/2, cy, '左'));
            shape.appendChild(createLabel(cx + w/2 + d/2, cy, '右'));
        }
    } 
    else if (subTool === 'solid-cylinder') {
        const cx = parseFloat(shape.getAttribute('data-cx')) || 0;
        const cy = parseFloat(shape.getAttribute('data-cy')) || 0; 
        const r = parseFloat(shape.getAttribute('data-r')) || 0;
        const h = parseFloat(shape.getAttribute('data-h')) || 0;
        
        if (viewMode === '3d') {
            const ry = r * 0.3; 
            const topY = cy;
            const botY = cy + h;

            shape.appendChild(createFace(`M ${cx} ${topY} m ${-r} 0 a ${r} ${ry} 0 1 0 ${r*2} 0 a ${r} ${ry} 0 1 0 ${-r*2} 0`));
            shape.appendChild(createFace(`M ${cx-r} ${botY} A ${r} ${ry} 0 0 1 ${cx+r} ${botY}`, '4,4'));
            shape.appendChild(createFace(`M ${cx-r} ${topY} L ${cx-r} ${botY} A ${r} ${ry} 0 0 0 ${cx+r} ${botY} L ${cx+r} ${topY}`));

            shape.appendChild(createLabel(cx, topY, '上底'));
            shape.appendChild(createLabel(cx, cy + h/2, '側面'));
        } else {
            const width = 2 * Math.PI * r;
            const rx = cx - width / 2;
            const ry = cy; // 將 cy 視為底部定錨點
            if (isNaN(rx) || isNaN(ry) || isNaN(width) || isNaN(h)) return;

            // 【核心修正】矩形改為往上畫 (v -h)
            shape.appendChild(createFace(`M ${rx} ${ry} h ${width} v ${-h} h ${-width} Z`));
            shape.appendChild(createFace(`M ${cx} ${ry-h-r} m ${-r} 0 a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0`));
            shape.appendChild(createFace(`M ${cx} ${ry+r} m ${-r} 0 a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0`));

            shape.appendChild(createLabel(cx, ry - h/2, '側面'));
            shape.appendChild(createLabel(cx, ry - h - r, '上底'));
            shape.appendChild(createLabel(cx, ry + r, '下底'));
        }
    } 
    else if (subTool === 'solid-cone') {
        const cx = parseFloat(shape.getAttribute('data-cx')) || 0;
        const cy = parseFloat(shape.getAttribute('data-cy')) || 0; 
        const r = parseFloat(shape.getAttribute('data-r')) || 0;
        const h = parseFloat(shape.getAttribute('data-h')) || 0;
        
        if (viewMode === '3d') {
            const ry = r * 0.3;
            const botY = cy + h;

            shape.appendChild(createFace(`M ${cx-r} ${botY} A ${r} ${ry} 0 0 1 ${cx+r} ${botY}`, '4,4'));
            shape.appendChild(createFace(`M ${cx-r} ${botY} L ${cx} ${cy} L ${cx+r} ${botY} A ${r} ${ry} 0 0 1 ${cx-r} ${botY}`));
            shape.appendChild(createLabel(cx, cy + h * 0.6, '側面'));

        } else {
            const s = Math.sqrt(r * r + h * h);
            const theta = (2 * Math.PI * r) / s;
            
            // 【核心修正】將扇形開口改為朝上 (-90度為中心)
            const startAngle = -Math.PI / 2 - theta / 2;
            const endAngle = -Math.PI / 2 + theta / 2;
            
            const px1 = cx + s * Math.cos(startAngle);
            const py1 = cy + s * Math.sin(startAngle);
            const px2 = cx + s * Math.cos(endAngle);
            const py2 = cy + s * Math.sin(endAngle);
            
            if (isNaN(px1) || isNaN(py1)) return;

            const largeArc = theta > Math.PI ? 1 : 0;
            // 扇形定點固定在 cy，往上方展開
            shape.appendChild(createFace(`M ${cx} ${cy} L ${px1} ${py1} A ${s} ${s} 0 ${largeArc} 1 ${px2} ${py2} Z`));
            
            const midAngle = -Math.PI / 2;
            const midX = cx + s * Math.cos(midAngle);
            const midY = cy + s * Math.sin(midAngle);
            const circleCX = midX + r * Math.cos(midAngle);
            const circleCY = midY + r * Math.sin(midAngle);
            
            shape.appendChild(createFace(`M ${circleCX} ${circleCY} m ${-r} 0 a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0`));
            shape.appendChild(createLabel(cx, cy - s * 0.5, '側面'));
            shape.appendChild(createLabel(circleCX, circleCY, '底面'));
        }
    }
    // --- 1. 新增：完美的正四角錐 (保證平衡對稱) ---
    else if (subTool === 'solid-pyramid') {
        const cx = parseFloat(shape.getAttribute('data-cx')) || 0;
        const cy = parseFloat(shape.getAttribute('data-cy')) || 0; 
        const w = parseFloat(shape.getAttribute('data-w')) || 0;
        const h = parseFloat(shape.getAttribute('data-h')) || 0;
        
        // 為了相容您不刪除深度參數，這裡保留讀取 d，但在 3D 視圖中我們直接用 w 來計算完美比例
        const d = parseFloat(shape.getAttribute('data-d')) || 0; 
        
        if (viewMode === '3d') {
            // 精算過的等視角投影：保證相鄰邊等長，完美模擬正方形底面，且前後稜線絕不重疊
            const f = { x: cx + w * 0.04, y: cy + w * 0.2 };
            const b = { x: cx - w * 0.04, y: cy - w * 0.2 };
            const l = { x: cx - w * 0.5,  y: cy + w * 0.05 };
            const r = { x: cx + w * 0.5,  y: cy - w * 0.05 };
            const top = { x: cx, y: cy - h };

            // 隱藏線：後底邊(左後, 右後)、後側稜
            shape.appendChild(createFace(`M ${l.x} ${l.y} L ${b.x} ${b.y} L ${r.x} ${r.y}`, '4,4'));
            shape.appendChild(createFace(`M ${top.x} ${top.y} L ${b.x} ${b.y}`, '4,4'));

            // 可見線：前底邊(左前, 右前)、前左稜、前右稜、正前稜
            shape.appendChild(createFace(`M ${l.x} ${l.y} L ${f.x} ${f.y} L ${r.x} ${r.y}`));
            shape.appendChild(createFace(`M ${top.x} ${top.y} L ${l.x} ${l.y}`));
            shape.appendChild(createFace(`M ${top.x} ${top.y} L ${f.x} ${f.y}`));
            shape.appendChild(createFace(`M ${top.x} ${top.y} L ${r.x} ${r.y}`));
            
            // 修正：「底面」文字往上移到中心點附近，避免壓到邊線
            shape.appendChild(createLabel(cx - w *0.1, cy, '底面'));
        } else {
            // 展開圖 (維持原狀不變)
            const sl = Math.sqrt(h*h + (w/2)*(w/2)); 
            shape.appendChild(createFace(`M ${cx-w/2} ${cy-w/2} h ${w} v ${w} h ${-w} Z`)); 
            shape.appendChild(createFace(`M ${cx-w/2} ${cy-w/2} L ${cx+w/2} ${cy-w/2} L ${cx} ${cy-w/2 - sl} Z`)); 
            shape.appendChild(createFace(`M ${cx-w/2} ${cy+w/2} L ${cx+w/2} ${cy+w/2} L ${cx} ${cy+w/2 + sl} Z`)); 
            shape.appendChild(createFace(`M ${cx-w/2} ${cy-w/2} L ${cx-w/2} ${cy+w/2} L ${cx-w/2 - sl} ${cy} Z`)); 
            shape.appendChild(createFace(`M ${cx+w/2} ${cy-w/2} L ${cx+w/2} ${cy+w/2} L ${cx+w/2 + sl} ${cy} Z`)); 

            shape.appendChild(createLabel(cx, cy, '底面'));
            shape.appendChild(createLabel(cx, cy + w/2 + sl/3, '側面'));
        }
    }
    // --- 2. 智慧翻面的三角柱 (拉到極端時虛線變實線) ---
    else if (subTool === 'solid-prism') {
        const cx = parseFloat(shape.getAttribute('data-cx')) || 0;
        const cy = parseFloat(shape.getAttribute('data-cy')) || 0; 
        const w = parseFloat(shape.getAttribute('data-w')) || 0;
        const h = parseFloat(shape.getAttribute('data-h')) || 0;
        
        if (viewMode === '3d') {
            // 使用正三角形的透視畫法
            const pHeight = w * Math.sqrt(3) / 2 * 0.4; // 底面正三角形的透視高度
            
            // 計算底部三個頂點的座標
            const b1 = { x: cx - w/2, y: cy + h/2 }; // 左前點
            const b2 = { x: cx + w/2, y: cy + h/2 }; // 右前點
            const b3 = { x: cx, y: cy + h/2 - pHeight }; // 後方點
            
            // 計算頂部三個頂點的座標
            const t1 = { x: b1.x, y: b1.y - h };
            const t2 = { x: b2.x, y: b2.y - h };
            const t3 = { x: b3.x, y: b3.y - h };

            // 1. 先畫【被遮擋】的虛線，這樣實線才能蓋在上面
            shape.appendChild(createFace(`M ${b1.x} ${b1.y} L ${b3.x} ${b3.y}`, '4,4')); // 底面左後邊
            shape.appendChild(createFace(`M ${b2.x} ${b2.y} L ${b3.x} ${b3.y}`, '4,4')); // 底面右後邊
            shape.appendChild(createFace(`M ${t3.x} ${t3.y} L ${b3.x} ${b3.y}`, '4,4')); // 後方垂直邊

            // 2. 再畫【可看見】的實線
            shape.appendChild(createFace(`M ${t1.x} ${t1.y} L ${t2.x} ${t2.y} L ${t3.x} ${t3.y} Z`)); // 整個上底面
            shape.appendChild(createFace(`M ${b1.x} ${b1.y} L ${t1.x} ${t1.y}`)); // 左前垂直邊
            shape.appendChild(createFace(`M ${b2.x} ${b2.y} L ${t2.x} ${t2.y}`)); // 右前垂直邊
            shape.appendChild(createFace(`M ${b1.x} ${b1.y} L ${b2.x} ${b2.y}`)); // 底面正前方邊

            shape.appendChild(createLabel(cx, cy, '側面'));

        } else {
            // 正三角柱展開圖 (三個相同的矩形側面 + 兩個正三角形底面)
            const eqH = w * Math.sqrt(3) / 2; // 正三角形的高
            const cx = parseFloat(shape.getAttribute('data-cx')) || 0;
            const cy = parseFloat(shape.getAttribute('data-cy')) || 0; 
            
            // 繪製三個並排的矩形側面
            shape.appendChild(createFace(`M ${cx-w/2} ${cy-h/2} h ${w} v ${h} h ${-w} Z`)); // 中間
            shape.appendChild(createFace(`M ${cx-w/2 - w} ${cy-h/2} h ${w} v ${h} h ${-w} Z`)); // 左邊
            shape.appendChild(createFace(`M ${cx+w/2} ${cy-h/2} h ${w} v ${h} h ${-w} Z`)); // 右邊
            
            // 繪製上、下兩個正三角形底面 (附著在中間矩形的上下)
            shape.appendChild(createFace(`M ${cx-w/2} ${cy-h/2} L ${cx+w/2} ${cy-h/2} L ${cx} ${cy-h/2 - eqH} Z`)); 
            shape.appendChild(createFace(`M ${cx-w/2} ${cy+h/2} L ${cx+w/2} ${cy+h/2} L ${cx} ${cy+h/2 + eqH} Z`)); 

            // 標示文字
            shape.appendChild(createLabel(cx, cy, '側面'));
            shape.appendChild(createLabel(cx - w, cy, '側面'));
            shape.appendChild(createLabel(cx + w, cy, '側面'));
            shape.appendChild(createLabel(cx, cy-h/2-eqH/3, '上底'));
            shape.appendChild(createLabel(cx, cy+h/2+eqH/3, '下底'))
		}
    }
    // --- 3. 聊勝於無：球體 ---
    else if (subTool === 'solid-sphere') {
        const cx = parseFloat(shape.getAttribute('data-cx')) || 0;
        const cy = parseFloat(shape.getAttribute('data-cy')) || 0; 
        const r = parseFloat(shape.getAttribute('data-r')) || 0;
        
        if (viewMode === '3d') {
            const ry = r * 0.3; 
            shape.appendChild(createFace(`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`));
            shape.appendChild(createFace(`M ${cx - r} ${cy} A ${r} ${ry} 0 0 0 ${cx + r} ${cy}`));
            shape.appendChild(createFace(`M ${cx - r} ${cy} A ${r} ${ry} 0 0 1 ${cx + r} ${cy}`, '4,4'));
            shape.appendChild(createLabel(cx, cy - r/2, '球體'));
        }
    }
}

// 新增輔助點顯示函式
function showSnapIndicator(p) {
    if (!snapIndicator) {
        // 關鍵：必須指定 SVG 命名空間 http://www.w3.org/2000/svg
        snapIndicator = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        snapIndicator.setAttribute('r', '6');
        // 設定明顯的顏色與外框
        snapIndicator.style.cssText = "fill: #ff4757; stroke: white; stroke-width: 2px; pointer-events: none; opacity: 0.8;";
        // 加入到 temp-layer (這是最上層)
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
    // 如果點擊的目標不是在 .tool-btn-wrapper (按鈕容器) 內部
    if (!e.target.closest('.tool-btn-wrapper')) {
        closeAllMenus(); // 呼叫 ui.js 中的函式
    }
	
    
    // 處理 Header 的匯出選單
    const menu = document.getElementById('header-export-menu');
    const btn = e.target.closest('button');
    if (menu && menu.style.display === 'block' && (!btn || !btn.innerHTML.includes('匯出'))) {
        menu.style.display = 'none';
    }
});
svgCanvas.addEventListener('mousedown', (e) => {
    window.potentialRemoveTarget = null; // 在每次點擊時重置

	if (e.button === 0) hideSnapIndicator();
    if (e.button === 2) return;
	const pos = getMousePos(e);
    lastClickPos = { x: pos.x, y: pos.y };
    startX = pos.x;
    startY = pos.y;
    if (e.button === 0) {
        window.showVisualAnchor(pos.x, pos.y, true);
    }	
	if (mode === 'continuous-label') {
        // 【需求修正】：直接讀取「自動頂點標註」的參數設定
        const labelSettings = window.getAutoLabelSettings ? window.getAutoLabelSettings() : { fontSize: 20, distance: 28, isBold: true };
        const fontSize = labelSettings.fontSize;
        const fontWeight = labelSettings.isBold ? "bold" : "normal";
        
        // 顏色維持從上方的顏色選單抓取，或預設紅色
        const colorSel = document.getElementById('edit-color-select');
        const color = colorSel ? colorSel.value : "#c0392b";

        const labelText = getNextContinuousValue();
        const textEl = document.createElementNS(ns, "text");
        textEl.setAttribute("x", pos.x);
        textEl.setAttribute("y", pos.y);
        textEl.textContent = labelText;
        textEl.setAttribute("class", "shape");
        textEl.setAttribute("data-tool", "text");
        
        // 確保樣式正確且可見，並套用設定
        textEl.setAttribute('font-size', fontSize);
        textEl.setAttribute('fill', color);
        textEl.setAttribute('font-weight', fontWeight);
        textEl.style.cssText = `text-anchor:middle; dominant-baseline:central; font-size:${fontSize}px; fill:${color}; font-family:Arial; font-weight:${fontWeight}; cursor:move; pointer-events:all;`;
        
        shapesLayer.appendChild(textEl);
        saveState();
        statusText.innerText = `已標註 ${labelText}，請點擊下一位置，按右鍵結束。`;
        return; // 必須 return，避免觸發後續的選取邏輯
    }
    if (mode === 'edit-blocks') {
        let target = e.target;
        if (typeof window.handleBlockInteraction === 'function') {
            const handled = window.handleBlockInteraction(e, target);
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
                return; 
            }
        }
        // 如果點到空白處，退出編輯模式
        setMode('select');
        return;
    }

    if (mode === 'symmetry' && symmetryStep === 1) {
        let targetLine = e.target.closest('.shape');
        if (targetLine && targetLine.parentNode.getAttribute('data-tool') === 'line') {
            targetLine = targetLine.parentNode;
        }
        const tool = targetLine ? targetLine.getAttribute('data-tool') : '';
        
        if (targetLine && tool === 'line') {
            // 【核心修正】：直接將選到的線段物件傳給引擎，建立依賴關係
            executeSymmetryReflection(targetLine);
            setMode('select');
            return;
        }

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

    // ▼▼▼ 以下是核心修改處：用新的智慧選取引擎取代舊的 e.target 邏輯 ▼▼▼
    // 呼叫新的智慧選取引擎，設定 15px 的模糊搜尋半徑
    let targetShape = findShapeAtPosition(pos.x, pos.y);
    
    // 如果選到的是群組內的子物件，自動往上找尋最外層的群組容器
    if (targetShape) {
        let parent = targetShape.parentNode;
        while (parent && parent.getAttribute && parent.getAttribute('data-tool') === 'group') {
            targetShape = parent;
            parent = parent.parentNode;
        }
    }
    
    let isShape = !!targetShape;
    let target = targetShape;	
    if (!isShape && window.anchorPoint) {
        window.clearAnchorPoint();
        statusText.innerText = "已取消定錨";
    }

    // A. 尺規作圖模式 (construct)
    if (mode === 'construct') {
        const allowEmptyClick = (
            (constructionModeType === 'tangent' && constructionStep === 1) ||
            (constructionModeType === 'parallel' && constructionStep === 1) ||
            (constructionModeType === 'perpendicular_point' && constructionStep === 0) ||
            (constructionModeType === 'median_line' && constructionStep === 0)
        );

        // 如果點擊空白處，且當前模式不允許點擊空白，則取消作圖
        if (!isShape && !allowEmptyClick) {
            setMode('select');
            statusText.innerText = "已取消作圖模式";
            if (typeof window.clearAllHighlightPoints === 'function') {
                window.clearAllHighlightPoints();
            }
        }
        // 如果點到圖形，或模式允許點空白，則不在此處理，交由 'click' 事件完成後續步驟
        return;
    }

    // B. 標記模式 (mark)
    if (mode === 'mark') {
        autoApplyMark(pos.x, pos.y);
        return;
    }


    // D. 選取模式 (select) 或 對稱作圖步驟1
    if (mode === 'select' || (mode === 'symmetry' && symmetryStep === 0)) {
        // D-1. 點擊控制點或旋轉手柄
        if (e.target.classList.contains('rotate-handle')) {
            isRotating = true;
            statusText.innerText = "旋轉模式：拖曳滑鼠旋轉物件 (按住 Shift 鎖定 15 度)";
            return;
        }
        if (e.target.classList.contains('vertex-handle')) {
            isDragging = true;
            // ▼▼▼ 修正：允許字串型態的 index (例如 'resize')，不要全部強制轉數字 ▼▼▼
            const rawIndex = e.target.getAttribute('data-index');
            draggingHandleIndex = isNaN(parseInt(rawIndex)) ? rawIndex : parseInt(rawIndex);
            return;
        }

        // D-2. 點擊圖形物件
        if (isShape) {
            if (window.anchorPoint) {
                window.clearAnchorPoint();
            }
            e.preventDefault(); // 防止文字或 foreignObject 無法拖曳
            let clickedBlockPolygon = e.target.closest('.block-interact');
            let blockGroup = e.target.closest('.solid-blocks');

            if (blockGroup && clickedBlockPolygon) {
                const r = clickedBlockPolygon.getAttribute('data-r');
                const c = clickedBlockPolygon.getAttribute('data-c');

                // 選取群組
                if (!selectedElements.includes(blockGroup)) {
                    deselectAll();
                    addToSelection(blockGroup);
                    potentialSingleSelectTarget = null;
                } else {
                    potentialSingleSelectTarget = blockGroup;
                }

                // 標記選取的格子並重新渲染高亮
                blockGroup.setAttribute('data-selected-r', r);
                blockGroup.setAttribute('data-selected-c', c);
                if (typeof window.redrawSolidBlocks === 'function') window.redrawSolidBlocks(blockGroup);
                
                isDirectClick = true;
                isDragging = true;
                
                // 提示文字
                statusText.innerText = "已選取格子，請按鍵盤【+】增加積木，按【-】減少積木";
                return;
            }			
            isDirectClick = true;

            if (!(e.shiftKey || window.vkShiftActive)) {
                if (selectedElements.includes(target)) {
                    // 關鍵：如果點擊已選取的物件，先不 deselect，記錄下來準備在 mouseup 處理
                    potentialSingleSelectTarget = target;
                } else {
                    // 如果點擊未選取的，立即單選（這是為了操作流暢感）
                    deselectAll();
                    addToSelection(target);
                    potentialSingleSelectTarget = null;
                }
            } else {
                potentialSingleSelectTarget = null;
                if (selectedElements.includes(target)) {
                    // *** 核心修改點：不要立即移除，先記錄下來 ***
                    window.potentialRemoveTarget = target;
                } else {
                    addToSelection(target);
                }
            }
            
            isDragging = true;
            // statusText.innerText = ... (維持原樣)
            return;
        }

        // D-3. 點擊空白處 (準備框選)
        closeAllMenus(); // 點擊空白處，關閉所有彈出選單
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

    // E. 繪圖模式 (draw)
    if (mode === 'draw') {
        if (currentTool === 'text' || currentTool === 'math') {
            isDragging = true;
            // 建立預覽框
            currentShape = document.createElementNS(ns, "rect");
            currentShape.setAttribute('x', startX); currentShape.setAttribute('y', startY);
            currentShape.setAttribute('width', 0); currentShape.setAttribute('height', 40);
            currentShape.style.cssText = "fill:rgba(52,152,219,0.1); stroke:#2980b9; stroke-width:1; stroke-dasharray:5,5; pointer-events:none;";
            currentShape.setAttribute('data-tool', currentTool);
            tempLayer.appendChild(currentShape);
        } else if (currentTool === 'polyline') {
            const strokeColor = document.getElementById('stroke-color-select').value || "#000000";
            const strokeWidth = document.getElementById('stroke-width-select').value || "2";
            
            let pointRadius = 3;
            let isSolid = true; 
            try {
                const cachedP = localStorage.getItem('math_editor_param_point');
                if (cachedP) {
                    const parsed = JSON.parse(cachedP);
                    pointRadius = parsed.p_r || 3;
                    if (parsed.p_solid !== undefined) isSolid = parsed.p_solid;
                }
            } catch(e) {}

            // 【核心修正】將系統預設值改為 true，與參數面板保持一致
            let showPts = true; 
            try {
                const cachedPoly = localStorage.getItem('math_editor_param_polyline');
                if (cachedPoly) {
                    const parsedPoly = JSON.parse(cachedPoly);
                    if (parsedPoly.p_show_pts !== undefined) showPts = parsedPoly.p_show_pts;
                }
            } catch(e) {}
			
            if (!currentShape) {
                const polyId = 'poly-' + Date.now();
                
                currentShape = document.createElementNS(ns, "polyline");
                currentShape.id = polyId;
                currentShape.setAttribute('points', `${startX},${startY} ${startX},${startY}`);
                
                const lineStyleVal = document.getElementById('line-style-select').value || "solid";
                let dashArray = "none";
                if (lineStyleVal === 'dashed') dashArray = "8,5";
                else if (lineStyleVal === 'dotted') dashArray = "2,4";
                else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";

                currentShape.style.cssText = `stroke: ${strokeColor}; stroke-width: ${strokeWidth}; fill: none; stroke-dasharray: ${dashArray}; vector-effect: non-scaling-stroke;`;
                currentShape.setAttribute('class', 'shape');
                currentShape.setAttribute('data-tool', 'polyline');
                
                shapesLayer.appendChild(currentShape);

                if (showPts) {
                    const point = document.createElementNS(ns, "circle");
                    point.setAttribute('cx', startX); point.setAttribute('cy', startY);
                    point.setAttribute('r', pointRadius);
                    point.setAttribute('data-solid', isSolid ? '1' : '0'); 
                    point.style.cssText = `fill: ${isSolid ? strokeColor : 'white'}; stroke: ${isSolid ? 'none' : strokeColor}; stroke-width: 1.5px; vector-effect: non-scaling-stroke; cursor: move;`;
                    point.setAttribute('class', 'shape');
                    point.setAttribute('data-tool', 'point');
                    point.setAttribute('data-owner-shape', polyId);
                    point.setAttribute('data-dependency-type', 'polyline_point');
                    point.setAttribute('data-vertex-index', 0);
                    shapesLayer.appendChild(point);
                }
                
            } else {
                const pts = currentShape.getAttribute('points').trim().split(' ');
                const newIndex = pts.length - 1; // 剛確定的那個點的索引
                currentShape.setAttribute('points', `${pts.join(' ')} ${startX},${startY}`);
                
                if (showPts) {
                    const point = document.createElementNS(ns, "circle");
                    point.setAttribute('cx', startX); point.setAttribute('cy', startY);
                    point.setAttribute('r', pointRadius);
                    point.setAttribute('data-solid', isSolid ? '1' : '0'); 
                    point.style.cssText = `fill: ${isSolid ? strokeColor : 'white'}; stroke: ${isSolid ? 'none' : strokeColor}; stroke-width: 1.5px; vector-effect: non-scaling-stroke; cursor: move;`;
                    point.setAttribute('class', 'shape');
                    point.setAttribute('data-tool', 'point');
                    point.setAttribute('data-owner-shape', currentShape.id);
                    point.setAttribute('data-dependency-type', 'polyline_point');
                    point.setAttribute('data-vertex-index', newIndex);
                    shapesLayer.appendChild(point);
                }
            }
            return;  
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
        let target = e.target;
        while (target && target !== svgCanvas && !target.classList?.contains('shape')) {
            target = target.parentNode;
        }
        let isShape = target && target.classList.contains('shape');

        // 【需求2修復】如果沒點到圖形 (點在旁邊的空白處)，使用模糊搜尋找出最近的圖形邊緣
        if (!isShape) {
            const searchRadius = 25; // 允許偏離線段的最大距離
            let minDistance = searchRadius;
            let bestCandidate = null;

            const candidates = Array.from(document.querySelectorAll('#shapes-layer > .shape'));
            candidates.forEach(el => {
                if (el.getAttribute('data-tool') === 'grid' || el.style.display === 'none') return;
                let d = Infinity;
                const tool = el.getAttribute('data-tool');
                const tagName = el.tagName.toLowerCase();

                // 計算滑鼠到線段或多邊形邊緣的距離
                if (['line', 'polyline', 'polygon', 'rect', 'tri', 'angle'].includes(tool) ||['line', 'polyline', 'polygon'].includes(tagName)) {
                    if (typeof getTransformedPoints === 'function' && typeof distToSegment === 'function') {
                        const pts = getTransformedPoints(el);
                        if (pts && pts.length >= 2) {
                            const len = (tool === 'polyline' || tool === 'angle' || tagName === 'line') ? pts.length - 1 : pts.length;
                            for (let i = 0; i < len; i++) {
                                const segD = distToSegment(pos.x, pos.y, pts[i].x, pts[i].y, pts[(i + 1) % pts.length].x, pts[(i + 1) % pts.length].y);
                                if (segD < d) d = segD;
                            }
                        }
                    }
                } else {
                    try {
                        const bbox = el.getBBox();
                        const cx = bbox.x + bbox.width / 2;
                        const cy = bbox.y + bbox.height / 2;
                        d = Math.hypot(pos.x - cx, pos.y - cy);
                    } catch (err) {}
                }

                if (d < minDistance) {
                    minDistance = d;
                    bestCandidate = el;
                }
            });

            if (bestCandidate) {
                target = bestCandidate;
                isShape = true;
            }
        }

        autoApplyConstruction(isShape ? target : null, pos.x, pos.y);
    }
});
svgCanvas.addEventListener('dblclick', (e) => {
    if (mode === 'symmetry' && symmetryStep === 0 && selectedElements.length > 0) {
        toggleSymmetryMode(); // 呼叫剛剛修改過的函式，它會自動判斷並進入下一步
        return;
    }	
    let target = e.target;
    let targetShape = target.closest('.shape');
  
    if (targetShape) {
        let parent = targetShape.parentNode;
        while (parent && parent.getAttribute && parent.getAttribute('data-tool') === 'group') {
            targetShape = parent;
            parent = parent.parentNode;
        }
    }
	
    if (targetShape && targetShape.getAttribute('data-tool') === 'blocks') {
        if (typeof window.enterBlockEditMode === 'function') {
            window.enterBlockEditMode(targetShape);
        }
        return;
    }
    if (targetShape) {
        const sub = targetShape.getAttribute('data-sub-tool');
        // 建立映射表： DOM 中的 sub-tool -> SHAPE_PARAMS 的 key
        const mapping = {
            'venn': 'venn_diagram',
            'pie-chart': 'pie_chart',
            'axis-chart': 'axis_chart',
            'histogram': 'histogram',
            'boxplot': 'boxplot',
            'parabola': 'parabola',
            'inequality': 'inequality',
			'polygon': 'polygon',
            'star': 'star'
        };

        if (mapping[sub]) {
            openParamModal(mapping[sub], targetShape);
            return;
        }
    }
    if (target.tagName === 'text' && (target.classList.contains('shape') || target.classList.contains('vertex-label'))) {
        if (target.classList.contains('guide-y-label')) {
            showAlert("這是由圖表生成的輔助標籤，<br>請在圖表主體的右鍵選單「編輯參數」中修改文字內容。");
            return;
        }
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
		return;
    }
    if (!targetShape && !isBoxSelecting && (mode === 'select' || mode === 'draw')) {
        // 確保沒有點擊到數學式或文字
        if (!mathWrapper || !mathWrapper.classList || !mathWrapper.classList.contains('math-obj')) {
            const pos = getMousePos(e);
            window.setAnchorPoint(pos.x, pos.y);
        }
    }
});

let cursorCheckTimeout = null;
let isCursorOverShape = false;

window.addEventListener('mousemove', (e) => {
    // 防呆：如果事件不是發生在 SVG 內，且沒有任何拖曳/框選行為，則直接返回
    if (!isDragging && !isBoxSelecting && !isRotating && e.target.closest('svg') !== svgCanvas) {
        // 如果滑鼠不在畫布上，也順便隱藏吸附提示點
        hideSnapIndicator();
        return;
    }
	
    const pos = getMousePos(e);
    let currX = pos.x;
    let currY = pos.y;
    const rawX = pos.x; 
    const rawY = pos.y;

    // 【新增】如果按住 Alt 鍵，暫時停用所有吸附干擾，讓移動極度平滑
    const isBypassingSnap = e.altKey;

    // --- 【新增】動態游標邏輯 (有節流閥優化) ---
    clearTimeout(cursorCheckTimeout);
    cursorCheckTimeout = setTimeout(() => {
        if (mode === 'select' && !isDragging && !isBoxSelecting) {
            const shapeUnderCursor = findShapeAtPosition(pos.x, pos.y);
            const needsMoveCursor = !!shapeUnderCursor;
            
            if (needsMoveCursor !== isCursorOverShape) {
                isCursorOverShape = needsMoveCursor;
                svgCanvas.style.cursor = isCursorOverShape ? 'move' : 'default';
            }
        } else if (mode !== 'select') {
            isCursorOverShape = false;
            svgCanvas.style.cursor = ''; 
        }
    }, 50); 
    
    // 【核心修正】將 !isBypassingSnap 加入判斷，按住 Alt 時直接跳過吸附計算
    if (mode === 'draw' && currentTool === 'point' && !isBypassingSnap) {
        const snap = findClosestPointOnShapes(currX, currY);
        if (snap) {
            currX = snap.point.x;
            currY = snap.point.y;
            showSnapIndicator({x: currX, y: currY});
        } else {
            hideSnapIndicator();
        }
    } else if (typeof isIntersectionSnappingEnabled !== 'undefined' && isIntersectionSnappingEnabled && !isBypassingSnap) {
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

    // 2. --- 更新座標輸入框顯示 ---
    const displayX = document.getElementById('display-coord-x');
    const displayY = document.getElementById('display-coord-y');
    if (displayX && displayY) {
        // 顯示四捨五入後的整數值
        displayX.innerText = Math.round(currX);
        displayY.innerText = Math.round(currY);
    }

    // 3. --- 處理游標提示 (Tooltip) ---
    const tooltip = document.getElementById('cursor-tooltip');
    if (mode === 'continuous-label') {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
        tooltip.innerText = `下一個: ${continuousTextStr}`;
    } else if (mode === 'symmetry') {
        let tipText = (symmetryStep === 0) ? "步驟 1/2：選取物件 (可框選，按右鍵確認)" : "步驟 2/2：畫或選對稱軸";
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
        tooltip.innerText = tipText;
    } else if (mode === 'construct') {
        let tipText = "";
		if (constructionModeType === 'central' || constructionModeType === 'inscribed' || constructionModeType === 'tangent-chord' || constructionModeType === 'tangent') {
			tipText = "請選擇圓";
        } else if (constructionModeType === 'perpendicular_point') {
			tipText = "作圖模式：請點擊線段作任意垂線 (滑鼠決定方向與位置)";
        } else if (constructionModeType === 'median_line') {
            tipText = "請點擊三角形的一邊";
        } else if (constructionModeType === 'parallel') {
            tipText = "請點擊參考線段";
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
    } else if (mode === 'draw' && (currentTool === 'text' || currentTool === 'math')) {
        if (!isDragging) {
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
            tooltip.innerText = "請框選顯示位置";
        } else {
            if (tooltip) tooltip.style.display = 'none';
        }
    } else {
        if (tooltip) tooltip.style.display = 'none';
    }

    // 4. --- 處理框選 (Box Selection) ---
    if (isBoxSelecting) {
		window.hideVisualAnchor();
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

    // 5. --- 處理旋轉 (Rotation) ---
    if (isRotating && selectedElements.length === 1) {
		window.hideVisualAnchor();
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
        if (e.shiftKey || window.vkShiftActive) targetAngle = Math.round(targetAngle / 15) * 15;
        
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

    // 6. --- 處理拖曳 (Dragging) ---
	if (mode === 'draw' && currentShape && currentTool === 'polyline') {
        let pts = currentShape.getAttribute('points').trim().split(' ');
        pts[pts.length - 1] = `${currX},${currY}`;
        currentShape.setAttribute('points', pts.join(' '));
        return;
    }
    if (!isDragging) return;
    window.hideVisualAnchor();
    if (potentialSingleSelectTarget) {
        potentialSingleSelectTarget = null;
    }
	if (mode === 'symmetry' && symmetryStep === 1 && isDragging && currentShape) {
		let targetX = currX;
		let targetY = currY;
		
		if (e.shiftKey || window.vkShiftActive) {
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
            updateVertexPosition(selectedElements[0], draggingHandleIndex, currX, currY, (e.shiftKey || window.vkShiftActive));
		    if (typeof refreshAngleLabels === 'function') {
				refreshAngleLabels(selectedElements[0]);
			}
            drawHandles(selectedElements[0]);
        } else if (selectedElements.length > 0) {
            isDirectClick = false;
            const dx = rawX - startX;
            const dy = rawY - startY;
            selectedElements.forEach(el => moveShape(el, dx, dy, e));
            startX = rawX;
            startY = rawY;
            handlesLayer.innerHTML = '';
        }
    } else if (mode === 'draw' && currentShape) {
        let targetX = currX; let targetY = currY;
        
        if (currentTool === 'polyline') {
            let ptsStr = currentShape.getAttribute('points');
            if (ptsStr) {
                let pts = ptsStr.trim().split(' ');
                if (pts.length > 0) {
                    pts[pts.length - 1] = `${targetX},${targetY}`;
                    currentShape.setAttribute('points', pts.join(' '));
                }
            }
            return;
        }
        if ((e.shiftKey || window.vkShiftActive) && currentTool === 'line') {
            const dx = Math.abs(targetX - startX); const dy = Math.abs(targetY - startY);
            if (dx > dy) targetY = startY; else targetX = startX;
        }
        updateShapeSize(currentShape, startX, startY, targetX, targetY, (e.shiftKey || window.vkShiftActive));
	}
});

// --- START OF MODIFICATION: core.js - mouseup 修正折線中斷問題 ---
window.addEventListener('mouseup', (e) => {
    hideSnapIndicator();
    if (potentialSingleSelectTarget) {
        const pos = getMousePos(e);
        const dist = Math.hypot(pos.x - startX, pos.y - startY);
        if (dist < 5) {
            if (mode === 'symmetry' && symmetryStep === 0) {
                // Do nothing
            } else {
                deselectAll();
                addToSelection(potentialSingleSelectTarget);
            }
        }
        potentialSingleSelectTarget = null;
    }

    if (window.potentialRemoveTarget) {
        const pos = getMousePos(e);
        const dist = Math.hypot(pos.x - startX, pos.y - startY);
        if (dist < 5) { // 必須是沒有拖曳的單擊
            removeFromSelection(window.potentialRemoveTarget);
        }
        window.potentialRemoveTarget = null;
    }
    
    // 對稱作圖邏輯
    if (mode === 'symmetry' && symmetryStep === 1 && currentShape) {
        const x2 = parseFloat(currentShape.getAttribute('x2'));
        const y2 = parseFloat(currentShape.getAttribute('y2'));
        if (Math.hypot(x2 - startX, y2 - startY) > 5) {
            const axisGroup = document.createElementNS(ns, "g");
            axisGroup.setAttribute('class', 'shape group');
            axisGroup.setAttribute('data-tool', 'line');
            axisGroup.id = 'axis-' + Date.now();
            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('x1', startX); hitLine.setAttribute('y1', startY);
            hitLine.setAttribute('x2', x2); hitLine.setAttribute('y2', y2);
            hitLine.setAttribute('class', 'hit-line');
            hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:move;";
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('x1', startX); visLine.setAttribute('y1', startY);
            visLine.setAttribute('x2', x2); visLine.setAttribute('y2', y2);
            visLine.setAttribute('class', 'visible-line');
            visLine.style.cssText = "stroke:#e67e22; stroke-width:2; stroke-dasharray:5,5; vector-effect:non-scaling-stroke; pointer-events:none;";
            axisGroup.appendChild(hitLine); axisGroup.appendChild(visLine);
            shapesLayer.appendChild(axisGroup);
            
            // 【核心修正】：將新畫的對稱軸物件傳給引擎，建立依賴關係
            executeSymmetryReflection(axisGroup);
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
				let bbox; try { bbox = shape.getBBox(); } catch(e) { return; }
				const matrix = shape.getCTM();
				const corners =[
					{ x: bbox.x, y: bbox.y }, { x: bbox.x + bbox.width, y: bbox.y },
					{ x: bbox.x + bbox.width, y: bbox.y + bbox.height }, { x: bbox.x, y: bbox.y + bbox.height }
				];
				let isFullyEnclosed = true;
				for (let p of corners) {
					let pt = svgCanvas.createSVGPoint(); pt.x = p.x; pt.y = p.y;
					const globalPt = pt.matrixTransform(matrix);
					if (globalPt.x < rX || globalPt.x > (rX + rW) || globalPt.y < rY || globalPt.y > (rY + rH)) {
						isFullyEnclosed = false; break;
					}
				}
				if (isFullyEnclosed) addToSelection(shape);
			});
			if (selectedElements.length > 0) statusText.innerText = `框選完成：已選取 ${selectedElements.length} 個物件`;
		} else {
			deselectAll();
			// 觸發快速定錨 (半透明點)
			const pos = getMousePos(e);
			window.setAnchorPoint(pos.x, pos.y, true);
			statusText.innerText = "已取消選取 (並建立快速定錨)";
		}
    }

    if (isRotating) { isRotating = false; saveState(); }
    
    if (isDragging) {
        if (mode === 'select' && selectedElements.length > 0) {
            if (selectedElements.length === 1) drawHandles(selectedElements[0]);
            selectedElements.forEach(el => {
                if (el.classList.contains('vertex-label')) {
                    const ownerId = el.getAttribute('data-owner-shape');
                    const ownerShape = document.getElementById(ownerId);
                    if (ownerShape) recalculateLabelAssociations(ownerShape);
                }
				/* 刪除暴力呼叫
                if (draggingHandleIndex !== null && typeof refreshAngleLabels === 'function') refreshAngleLabels(el);
				*/
            });
            saveState();
        }
    }

    // 繪圖結束邏輯
    if (mode === 'draw' && currentShape) {
        // 【關鍵修正】優先檢查全域工具狀態是否為折線，若是則直接返回，不執行完成邏輯
        if (currentTool === 'polyline') {
            isDragging = false;
            // 不清空 currentShape，也不切換模式
            return; 
        }

        const tool = currentShape.getAttribute('data-tool');
        if (tool === 'text' || tool === 'math') {
            const finalW = Math.max(100, Math.abs(parseFloat(currentShape.getAttribute('width')) || 0));
            const finalH = Math.max(50, Math.abs(parseFloat(currentShape.getAttribute('height')) || 0));
            const finalX = Math.min(startX, parseFloat(currentShape.getAttribute('x')) || startX);
            const finalY = Math.min(startY, parseFloat(currentShape.getAttribute('y')) || startY);
            currentShape.remove();
            
            const cfg = window.lastTextConfig || { size: "24", color: "#000000", writingMode: "horizontal-tb", bold: false };
            const fw = cfg.bold ? 'bold' : 'normal';

            const fo = document.createElementNS(ns, "foreignObject");
            fo.setAttribute("transform", `translate(${finalX}, ${finalY})`);
            fo.setAttribute("x", "0"); fo.setAttribute("y", "0");
            fo.setAttribute("width", finalW); fo.setAttribute("height", finalH);
            fo.setAttribute("class", "shape math-obj");
            fo.setAttribute("data-tool", tool);
            fo.setAttribute("data-content", "");
            fo.setAttribute("data-font-size", cfg.size);
            fo.setAttribute("fill", cfg.color);
            
            const div = document.createElement("div");
            div.className = "math-content";
            div.style.cssText = `font-size: ${cfg.size}px; color: ${cfg.color}; font-weight: ${fw}; writing-mode: ${cfg.writingMode}; text-orientation: ${cfg.writingMode === 'vertical-rl' ? 'upright' : 'mixed'};`;
            
            if (cfg.writingMode === 'vertical-rl') {
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.style.textAlign = 'center';
            }

            fo.appendChild(div);
            shapesLayer.appendChild(fo);
            
            setMode('select');
            addToSelection(fo);
            openTextModal(tool, fo);
        } else {
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
    }

    isDragging = false;
    // 折線模式不清除 currentShape
    if (mode !== 'draw' || currentTool !== 'polyline') {
        currentShape = null;
    }
    draggingHandleIndex = null;
    currentPathPoints = [];
});


svgCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // 阻止瀏覽器預設選單
    e.stopPropagation();	
    const pos = getMousePos(e);
    lastContextPos = { x: pos.x, y: pos.y };
	lastClickPos = { x: pos.x, y: pos.y }; 
    // =========================================================
    // 第一部分：優先處理「取消/結束」目前的特殊模式
    // (如果進入這些 if，會執行 return，不顯示右鍵選單)
    // =========================================================

    // 1. 結束折線 (Polyline) 繪製
    if (mode === 'draw' && currentTool === 'polyline' && currentShape) {
        let ptsStr = currentShape.getAttribute('points');
        if (ptsStr) {
            let pts = ptsStr.trim().split(' ');
            // 移除最後一個「跟隨游標」的點 (這是橡皮筋效果的暫存點)
            if (pts.length > 1) pts.pop();

            if (pts.length < 2) {
                // 點太少，刪除線與關聯的點
                const pid = currentShape.id;
                currentShape.remove();
                document.querySelectorAll(`[data-owner-shape="${pid}"][data-dependency-type="polyline_point"]`).forEach(p => p.remove());
            } else {
                currentShape.setAttribute('points', pts.join(' '));
                
                // 結束時，只選取線條，讓使用者看到控制點
                deselectAll();
                addToSelection(currentShape);
                
                if (typeof generateLabels === 'function') generateLabels(currentShape);
                saveState();
            }
        }
        currentShape = null;
        setMode('select');
        statusText.innerText = "折線繪製完成。";
        return; // 結束，不顯示選單
    }
	
    // 2. 結束連續標字模式 (Continuous Label)
    if (mode === 'continuous-label') {
        setMode('select');
        statusText.innerText = "已結束連續標字模式。";
        const tooltip = document.getElementById('cursor-tooltip');
        if (tooltip) tooltip.style.display = 'none';
        return; // 結束，不顯示選單
    }

    // 3. 處理對稱作圖 (Symmetry) 的取消與步驟回退
    if (mode === 'symmetry') {
        if (symmetryStep === 0) {
            if (selectedElements.length > 0) {
                // 如果已選物件但還沒按 Enter，右鍵可視為確認進入下一步
                symmetryStep = 1; 
                statusText.innerText = "步驟 2/2：請畫或選對稱軸"; 
                handlesLayer.innerHTML = '';
            } else { 
                statusText.innerText = "尚未選取物件！"; 
            }
        } else { 
            // 如果在步驟 2，右鍵取消整個模式
            setMode('select'); 
            statusText.innerText = "已取消對稱作圖"; 
        }
        return; // 結束，不顯示選單
    }

    // 4. 結束連續繪圖模式 (Continuous Draw)
    if (mode === 'draw' && typeof isContinuousDraw !== 'undefined' && isContinuousDraw) {
        isContinuousDraw = false;
        setMode('select');
        statusText.innerText = "已結束連續繪圖模式。";
        return; // 結束，不顯示選單
    }

    // 5. 結束連續標註模式 (Continuous Marking: 邊長/角度)
    if (typeof isContinuousMarking !== 'undefined' && isContinuousMarking) {
        isContinuousMarking = false;
        closeAllMenus();
        const btnSmart = document.getElementById('btn-mark-smart');
        if (btnSmart) btnSmart.classList.remove('active');
        
        if (mode === 'mark') setMode('select');
        statusText.innerText = "已結束連續標註模式。";
        return; // 結束，不顯示選單
    }

    // 6. 結束尺規作圖模式 (Construct)
    if (mode === 'construct') {
        constructionModeType = null;
        constructionStep = 0;
        const tempLine = document.querySelector('.temp-construction-line');
        if (tempLine) tempLine.remove();
        if (typeof window.clearAllHighlightPoints === 'function') window.clearAllHighlightPoints();
        closeAllMenus();
        const btnConstruct = document.getElementById('btn-construct');
        if (btnConstruct) btnConstruct.classList.remove('active');
        setMode('select');
        statusText.innerText = "已結束尺規作圖模式。";
        return; // 結束，不顯示選單
    }

    // =========================================================
    // 第二部分：智慧物件偵測與右鍵選單顯示
    // (只有在「選取模式」或「閒置」狀態下才會執行到這裡)
    // =========================================================
    
    const contextMenu = document.getElementById('context-menu');
    
    // 1. 判斷點擊目標
    let targetShape = e.target.closest('.shape');

    // 如果直接點擊沒抓到 (例如點擊圓內部空心處，或線條太細)，進行模糊搜尋
    if (!targetShape) {
        targetShape = findShapeAtPosition(pos.x, pos.y);
    }

    // 2. 如果選到的是群組內的子物件，嘗試往上找群組容器
    if (targetShape) {
        let parent = targetShape.parentNode;
        while (parent && parent.getAttribute && parent.getAttribute('data-tool') === 'group') {
            targetShape = parent;
            parent = parent.parentNode;
        }
    }
	
    // 3. 處理選取狀態
    // 如果點擊的物件尚未被選取，則直接單選它 (符合一般 OS 操作習慣)
    if (targetShape && !selectedElements.includes(targetShape)) {
        deselectAll();
        addToSelection(targetShape);
    } 
    // 如果點擊空白處，則取消所有選取
    else if (!targetShape) {
        deselectAll();
    }
    
    // 4. 建立選單內容
    // 呼叫 ui.js 中的函式來建立選單內容
    if (typeof buildContextMenu === 'function') {
        buildContextMenu(selectedElements);
    }

    // 5. 設定選單位置並顯示
    contextMenu.style.display = 'block';
    
    // 邊界檢查，防止選單超出視窗
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

svgCanvas.addEventListener('wheel', (e) => {
    if (!e.shiftKey || selectedElements.length === 0) return;
    e.preventDefault();
    const zoomIntensity = 0.05;
    const scaleFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 / (1 + zoomIntensity));
    
    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();
        
        // 【核心修正】如果物件是文字、數學式、標籤，直接跳過不縮放
        if (tool === 'text' || tool === 'math' || tagName === 'text' || el.classList.contains('vertex-label') || el.classList.contains('angle-label-text') || el.classList.contains('axis-text') || el.classList.contains('axis-label')) {
            return; 
        }

        scaleElementFromCenter(el, scaleFactor);
    });
    
    updateSelectionUI();
    clearTimeout(window.saveStateTimer);
    window.saveStateTimer = setTimeout(saveState, 500);
}, {
    passive: false
});

document.addEventListener('keydown', (e) => {
    const welcome = document.getElementById('welcome-modal');
    if (welcome.style.display === 'flex') {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            nextTourStep();
        }
    }
    if (e.key === 'F1') {
        e.preventDefault(); 
        
        const targetEl = document.elementFromPoint(window.currentClientX, window.currentClientY);
        if (!targetEl) return;

        let zone = 'canvas'; 
        let zoneName = '核心畫布區 (SVG Canvas)';

        // 判斷順序：由內而外
        if (targetEl.closest('.left-sidebar')) {
            zone = 'leftSidebar'; zoneName = '左側幾何工具列 (Shapes)';
        } else if (targetEl.closest('.right-sidebar')) {
            zone = 'rightSidebar'; zoneName = '右側輔助工具列 (Actions)';
        } else if (targetEl.closest('.canvas-right-bar')) {
            zone = 'galleryPanel'; zoneName = '右側系統入庫面板 (Gallery)';
        } else if (targetEl.closest('.page-bar')) { // 【新增】多頁操作區
            zone = 'pageBar'; zoneName = '底部多頁操作區 (Page Bar)';
        } else if (targetEl.closest('#status-bar')) { // 【新增】狀態列
            zone = 'statusBar'; zoneName = '底部狀態列 (Status Bar)';
        } else if (targetEl.closest('#quick-edit-bar') || targetEl.closest('#quick-math-bar') || targetEl.closest('#floating-helper-panel') || targetEl.closest('#math-helper-panel') || targetEl.closest('#text-helper-panel') || targetEl.closest('#formula-library-panel')) {
            zone = 'floatingBars'; zoneName = '浮動編輯與輔助面板';
        } else if (targetEl.closest('.toolbar')) {
            zone = 'toolbar'; zoneName = '頂部快捷工具列 (Quick Toolbar)';
        } else if (targetEl.closest('header')) {
            zone = 'header'; zoneName = '頂部主選單區 (Header)';
        } else if (!targetEl.closest('#editor-container')) {
            zone = 'header'; zoneName = '系統操作說明';
        }

        const helpTitle = document.getElementById('help-zone-name');
        const helpContent = document.getElementById('help-modal-content');
        if (helpTitle) helpTitle.innerText = zoneName;

        let html = '';
        switch (zone) {
            // 【新增】多頁操作與狀態列說明內容
            case 'pageBar':
                html = `
                    <h3>📑 多頁操作區</h3>
                    <ul>
                        <li><kbd>新增/複製</kbd>：在目前頁面之後插入空白頁或複製當前頁面。</li>
                        <li><kbd>跳頁</kbd>：點擊左右箭頭切換，或點擊中間「第 X / Y 頁」開啟快速跳頁選單。</li>
                        <li><kbd>匯出單頁</kbd>：點擊右側的 <kbd>💾</kbd>，可將目前這頁獨立儲存為 JSON 檔案。</li>
                        <li><kbd>刪除</kbd>：刪除目前頁面（若為最後一頁則無法刪除）。</li>
                    </ul>`;
                break;
            case 'statusBar':
                html = `
                    <h3>ℹ️ 底部狀態列</h3>
                    <ul>
                        <li><strong>系統狀態</strong>：顯示目前的作圖模式、操作提示與選取狀態。</li>
                        <li><strong>座標顯示</strong>：即時顯示游標在畫布上的 (X, Y) 幾何座標。</li>
                    </ul>`;
                break;

            case 'header':
                html = `
                    <h3>📁 檔案與系統管理</h3>
                    <ul>
                        <li><kbd>檔案</kbd>：可建立新專案、開啟/儲存 JSON 專案檔，或匯出 JPG/PNG/SVG 圖片。</li>
                        <li><kbd>系統設定</kbd>：可匯出您的自訂顏色、格線偏好等設定檔。</li>
                        <li><kbd>雲端同步</kbd>：登入 Google 後，可將畫布與設定雙向同步至雲端，並開啟社群訊息匣。</li>
                        <li><kbd>播放</kbd>：進入全螢幕簡報模式，使用方向鍵或滾輪換頁。</li>
                    </ul>`;
                break;
            case 'toolbar':
                html = `
                    <h3>✏️ 快速繪圖與樣式</h3>
                    <ul>
                        <li><kbd>左鍵單擊</kbd> 啟用工具；部分工具支援 <kbd>右鍵</kbd> 開啟進階參數設定（如寫字筆平滑度、方格圖格數等）。</li>
                        <li><strong>連續模式</strong>：點擊「手繪」或「寫字」按鈕可鎖定該工具，連續作畫；按 <kbd>ESC</kbd> 結束。</li>
                        <li><strong>樣式連動</strong>：在此更改顏色、粗細或線條樣式後，若畫布上有選取物件，會<span class="help-highlight">即時套用</span>至該物件；若無選取，則作為下一次繪圖的預設樣式。</li>
                        <li><strong>智慧填滿</strong>：選擇顏色與樣式後，點擊畫布上的封閉區域，系統會自動計算邊界並填色。</li>
                    </ul>`;
                break;
            case 'leftSidebar':
                html = `
                    <h3>🔺 幾何圖形生成</h3>
                    <ul>
                        <li><kbd>左鍵單擊</kbd>：使用系統預設的參數，直接在畫布上（或定錨點）生成圖形。</li>
                        <li><kbd>右鍵單擊</kbd>：開啟該圖形的「參數設定」視窗（例如：設定多邊形邊數、設定長度比例等），精確生成圖形。</li>
                        <li><strong>收合/展開</strong>：點擊類別標題的 <kbd>▼</kbd> 可收合該群組，節省畫面空間。</li>
                        <li><strong>自訂選單</strong>：點擊標題右側的 <kbd>⚙️</kbd>，可自訂該類別要在工具列上顯示哪些按鈕，並編排右鍵專屬選單。</li>
                    </ul>`;
                break;
            case 'rightSidebar':
                html = `
                    <h3>🛠️ 輔助操作與修改</h3>
                    <ul>
                        <li><kbd>鎖定邊角</kbd>：需先雙擊畫布產生「定錨點」，再點此按鈕即可鎖定邊長或角度；對此按鈕按 <kbd>右鍵</kbd> 可批次鎖定選取的圖案。</li>
                        <li><kbd>對稱作圖</kbd>：分為兩步驟。先選取要鏡像的圖形，再點擊畫布上的直線（或拖曳畫出新線）作為對稱軸。</li>
                        <li><kbd>尺規作圖</kbd>：包含中垂線、角平分線、三心等。選取工具後，依照提示點擊畫布上的線段或頂點。</li>
                        <li><kbd>吸附功能</kbd>：開啟「交點吸附」或「軌道吸附」後，拖曳控制點時會自動吸附至幾何交點或邊緣線上。</li>
                    </ul>`;
                break;
            case 'galleryPanel':
                html = `
                    <h3>📚 題庫與圖庫管理</h3>
                    <ul>
                        <li><kbd>選擇圖片入庫</kbd>：將畫布上「已選取」的圖形獨立存成素材，方便日後重複使用。</li>
                        <li><kbd>畫布題目入庫</kbd>：將目前畫布上的「所有圖形與數學式」合併存成一道完整的題目。</li>
                        <li><kbd>AI 辨識</kbd>：貼上或上傳外部數學題目圖片，AI 會自動分離文字與幾何圖形並轉為可編輯物件。</li>
                        <li>圖庫/題庫視窗內支援：匯入/備份 JSON 檔、建立自訂分類、批量分享至雲端社群。</li>
                    </ul>`;
                break;
            case 'floatingBars':
                html = `
                    <h3>📝 浮動編輯與輔助輸入</h3>
                    <ul>
                        <li><strong>文字/數學式編輯列</strong>：雙擊畫布上的文字即可喚出。支援調整字體大小、顏色、粗體與直書/橫書。</li>
                        <li><strong>數學符號面板</strong>：點擊符號可快速插入至編輯框。若在公式內（反引號 <code>\`</code> 之間），會自動轉換為 ASCIIMath 語法。</li>
                        <li><strong>公式庫</strong>：提供國中常見數學公式。點擊 <code>➕ 新增自訂公式</code> 可自行擴充，支援即時預覽。</li>
                        <li><strong>視窗拖拉</strong>：按住上方標題列即可自由拖曳視窗位置。</li>
                    </ul>`;
                break;
            case 'canvas':
                html = `
                    <h3>🔠 畫布上方控制列</h3>
                    <ul>
                        <li><strong>頂點標籤控制</strong>：勾選「自動頂點標註」後，繪製幾何圖形時會自動按順序放上標籤（A, B, C...）。</li>
                        <li><strong>起始字元/跳號</strong>：可直接在框內輸入起始字母。點擊或<span class="help-highlight">長按</span>上方的小箭頭可連續跳號。</li>
                        <li><strong>標註順序</strong>：點擊 <kbd>↺</kbd> 或 <kbd>↻</kbd> 切換標記產生的幾何方向（順時針或逆時針）。</li>
                        <li><strong>角度標記控制</strong>：勾選「自動角度標註」後，繪圖時會自動標示內角弧線與度數。</li>
                        <li><strong>快速旋轉</strong>：點擊 <kbd>↺ 0°</kbd> 按鈕可將選取物件以 90 度為單位快速旋轉；亦可手動輸入角度後按「旋轉」。</li>
                        <li><strong>畫布與尺寸設定</strong>：點擊右側的尺寸標籤（如 <span style="border:1px solid #ccc; padding:2px;">800 x 600</span>），可開啟設定視窗，將畫布調整為「螢幕模式」或「列印紙張模式 (A4/B4/A3)」。</li>
                    </ul>

                    <h3>🖱️ 基本滑鼠操作</h3>
                    <ul>
                        <li><kbd>左鍵單擊</kbd>：選取物件 / 確認作圖位置。點擊空白處可取消選取，並產生輔助標示。</li>
                        <li><kbd>左鍵雙擊</kbd>：
                            <br>- 空白處：產生<span class="help-highlight">定錨點</span> (紅藍閃爍)，強制後續圖形生成於此。
                            <br>- 圖形邊緣：開啟專屬參數設定對話框。
                            <br>- 文字/公式：進入編輯模式。
                        </li>
                        <li><kbd>右鍵單擊</kbd>：開啟該物件的「專屬右鍵選單」（如：畫高、外接圓、切線、長度標註等）。</li>
                    </ul>

                    <h3>⌨️ 進階鍵盤與組合操作</h3>
                    <ul>
                        <li><kbd>Shift</kbd> + <kbd>拖曳控制點</kbd>：對圖案強制等比例縮放。</li>
                        <li><kbd>Shift</kbd> + <kbd>滑鼠滾輪</kbd>：對選取的幾何圖形等比例縮放（不影響內部文字大小）。</li>
                        <li><kbd>空白鍵 (Space)</kbd>：
                            <br>- 選取標記時：快速循環切換樣式 (單線、雙線、度數、平行符號等)。
                            <br>- 選取立體積木時：切換顯示/隱藏方位指示箭頭。
                            <br>- 選取公切線系統時：切換顯示/隱藏輔助半徑與連心線。
                        </li>
                        <li><kbd>Delete / Backspace</kbd>：刪除選取的物件。</li>
                        <li><kbd>Ctrl + C / X / V</kbd>：複製、剪下、貼上（支援跨軟體貼圖/文字）。</li>
                        <li><kbd>Ctrl + G</kbd>：群組物件 (<kbd>Ctrl + Shift + G</kbd> 解散)。</li>
                        <li><kbd>方向鍵</kbd>：微調選取物件位置（搭配 <kbd>Shift</kbd> 可加大移動步距）。</li>
                        <li><kbd>+ / -</kbd>：選取立體積木特定方格時，快速增加或減少該格的積木高度。</li>
                        <li><kbd>ESC</kbd>：強制取消目前的作圖模式、關閉所有對話框、清除定錨點。</li>
                    </ul>`;
                break;
        }

        if (helpContent) helpContent.innerHTML = html;
        document.getElementById('help-modal').style.display = 'flex';
        return; 
    }
    if (document.body.classList.contains('presentation-mode')) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            presentNext(); e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            presentPrev(); e.preventDefault();
        } else if (e.key === 'Escape') {
            togglePresentationMode();
        }
        return; 
    }	
    
    const key = e.key;
    const activeEl = document.activeElement;
    const activeTag = activeEl ? activeEl.tagName.toLowerCase() : '';
    
    // 【核心修復 1】：精準判斷 isTyping (排除 checkbox、radio 與 button)
    // 並允許 Escape 鍵永遠生效，就算在文字框內也能關閉視窗！
    const isTyping = activeTag === 'textarea' || (activeTag === 'input' && activeEl.type !== 'checkbox' && activeEl.type !== 'radio' && activeEl.type !== 'button');
    if (isTyping && key !== 'Escape') return; 

    // --- 立體積木高度增減邏輯 ---
    if (selectedElements.length === 1) {
        const group = selectedElements[0];
        if (group.getAttribute('data-tool') === 'blocks') {
            const sr = group.getAttribute('data-selected-r');
            const sc = group.getAttribute('data-selected-c');
            
            if (sr !== null && sc !== null && sr !== '' && sc !== '') {
                const r = parseInt(sr); const c = parseInt(sc);
                let heights = JSON.parse(group.getAttribute('data-heights'));
                let changed = false;
                
                if (key === '+' || key === '=' || key === 'ArrowUp') { heights[r][c]++; changed = true; } 
                else if ((key === '-' || key === '_' || key === 'ArrowDown') && heights[r][c] > 0) { heights[r][c]--; changed = true; }

                if (changed) {
                    group.setAttribute('data-heights', JSON.stringify(heights));
                    if (typeof window.redrawSolidBlocks === 'function') window.redrawSolidBlocks(group);
                    if (typeof window.updateOrthographicViews === 'function') window.updateOrthographicViews(group);
                    if (typeof saveState === 'function') saveState();
                    e.preventDefault(); return; 
                }
            }
        }
    }

    if (key === ' ') {
        let cycledMark = false;
        if (selectedElements.length === 1) {
            const el = selectedElements[0];
            const tool = el.getAttribute('data-tool');
            const depType = el.getAttribute('data-dependency-type'); 
            
            // 【新增】空白鍵切換對稱連線顯示/隱藏
            if (depType === 'symmetry_connector') {
                e.preventDefault();
                const symGroupId = el.getAttribute('data-sym-group');
                const allConnectors = document.querySelectorAll(`[data-dependency-type="symmetry_connector"][data-sym-group="${symGroupId}"]`);
                // 以目前選取的這條線的狀態為基準進行反轉
                const isHidden = el.style.opacity === '0';
                allConnectors.forEach(conn => {
                    conn.style.opacity = isHidden ? '1' : '0';
                });
                cycledMark = true;
            }
            
            if (depType === 'extension_line') {
                e.preventDefault();
                let state = parseInt(el.getAttribute('data-ext-state') || '0');
                state = (state + 1) % 2; el.setAttribute('data-ext-state', state);
                const ownerId = el.getAttribute('data-owner-shape');
                if (ownerId) {
                    const ownerShape = document.getElementById(ownerId);
                    if (ownerShape) updateDependentShapes(ownerShape);
                }
                drawHandles(el); statusText.innerText = "已切換延長線方向"; saveState(); return;
            }

            if (tool === 'mark-edge-symbol') {
                e.preventDefault();
                if(typeof window.cycleEdgeMark === 'function') window.cycleEdgeMark(el);
                cycledMark = true;
            } 
            else if (el.classList.contains('angle-label-text') || (tool === 'mark' && el.hasAttribute('data-owner-angle-shape')) || (tool === 'mark' && el.getAttribute('data-dependency-type') === 'angle_mark') || el.classList.contains('intersection-mark') || el.hasAttribute('data-angle-type')) {
                e.preventDefault();
                let currentStyle = el.getAttribute('data-angle-type') || el.getAttribute('data-angle-style');
                if (!currentStyle) currentStyle = el.classList.contains('angle-label-text') ? 'degree' : 'arc';
                let currentIndex = window.ANGLE_STYLES.indexOf(currentStyle);
                if (currentIndex === -1) currentIndex = 0;
                currentIndex = (currentIndex + 1) % window.ANGLE_STYLES.length;
                currentAngleStyle = window.ANGLE_STYLES[currentIndex];
                if(typeof cycleAngleMark === 'function') cycleAngleMark(el, currentAngleStyle);
                cycledMark = true;
            }
        }
        if (cycledMark) { saveState(); statusText.innerText = "已切換標記樣式 (按空白鍵繼續切換)"; return; }

        let toggledGuides = false;
        if (selectedElements.length > 0) {
            selectedElements.forEach(el => {
                if (el.classList.contains('histogram-bar') || el.classList.contains('line-chart-point')) {
                    e.preventDefault();
                    const guides = el.querySelectorAll('.bar-guide, .point-guide');
                    guides.forEach(g => { g.style.display = (g.style.display === 'none') ? 'block' : 'none'; });
                    toggledGuides = true;
                }
            });
        }
        if (toggledGuides) { saveState(); return; }

        let toggledCT = false;
        if (selectedElements.length > 0) {
            const sysIds = new Set();
            selectedElements.forEach(el => {
                if (el.getAttribute('data-dependency-type') === 'common_tangent') sysIds.add(el.getAttribute('data-system-id'));
            });
            if (sysIds.size > 0) {
                e.preventDefault();
                sysIds.forEach(sysId => {
                    const auxElements = document.querySelectorAll(`[data-system-id="${sysId}"][data-aux="true"]`);
                    if (auxElements.length > 0) {
                        const isHidden = auxElements[0].style.display === 'none';
                        auxElements.forEach(aux => { aux.style.display = isHidden ? '' : 'none'; });
                        toggledCT = true;
                    }
                });
            }
        }
        if (toggledCT) { saveState(); statusText.innerText = "已切換公切線的輔助線顯示狀態"; return; }

        if (selectedElements.length === 1) {
            const el = selectedElements[0];
            if (el.getAttribute('data-sub-tool') === 'inequality') {
                e.preventDefault();
                const currentSolid = el.getAttribute('data-solid') == '1';
                el.setAttribute('data-solid', currentSolid ? '0' : '1');
                redrawInequality(el); statusText.innerText = `已切換為${currentSolid ? '空心' : '實心'}點`; saveState(); return;
            }
            if (el.getAttribute('data-tool') === 'point') {
                e.preventDefault();
                const currentSolid = el.getAttribute('data-solid') !== '0'; 
                if (currentSolid) {
                    el.setAttribute('data-solid', '0'); el.style.fill = 'white'; el.setAttribute('fill', 'white');
                } else {
                    el.setAttribute('data-solid', '1');
                    const strokeColor = el.style.stroke || el.getAttribute('stroke') || '#000000';
                    el.style.fill = strokeColor; el.setAttribute('fill', strokeColor);
                }
                statusText.innerText = `已切換點為${currentSolid ? '空心' : '實心'}`; saveState(); return;
            }
        }
    }

    if (key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (window.anchorPoint) {
            window.clearAnchorPoint();
            statusText.innerText = "已取消定錨";
            return; 
        }
        
        const exclusive = document.getElementById('exclusive-options-modal');
        if (exclusive) { exclusive.remove(); return; }
        
        const sysModal = document.getElementById('sys-modal');
        if (sysModal && sysModal.style.display !== 'none') { sysModal.style.display = 'none'; return; }

        // --- 處理所有 Modal (由上而下) ---
        const featureModals =[
            'welcome-modal',
			'help-modal',
			'reply-attachment-picker-modal', 
            'reply-detail-modal',           
            'reply-preview-modal',          
            'gallery-view-modal',           
            'gallery-import-modal',         
            'publish-modal',                
            'comm-join-modal',              
            'comm-create-modal',            
            'comm-search-modal',            
            'recent-files-modal', 'system-settings-modal',
            'quick-edit-bar',
			'quick-math-bar',
            'axes-modal', 'function-modal', 
            'angle-input-modal', 'number-input-modal', 'paramModal', 
            'json-import-modal', 'canvas-settings-modal',
            'batch-text-format-modal',
            'auto-angle-settings-modal',
            'auto-label-settings-modal',
			'math-copy-settings-modal',
            'community-modal', 
            'library-preview-modal',
            'library-modal',
			'admin-modal'
        ];

        for (const id of featureModals) {
            const el = document.getElementById(id);
            if (el && (el.style.display === 'flex' || el.style.display === 'block')) {
                // 【核心修復 5】不論是一般列還是數學列，都統一呼叫 closeEditMode 關閉並清理
                if (id === 'quick-edit-bar' || id === 'quick-math-bar') closeEditMode();
                else if (id === 'paramModal') closeParamModal();
                else if (id === 'number-input-modal') closeNumberInputModal();
                else if (id === 'library-preview-modal') {
                    if (typeof closeLibraryPreview === 'function') closeLibraryPreview();
                    else el.style.display = 'none';
                }
                else el.style.display = 'none';
                return; 
            }
        }

        // 【核心修復 2】：大廳的返回邏輯，讀取明確掛載在 window 的全域變數
        const galleryModal = document.getElementById('gallery-modal');
        if (galleryModal && galleryModal.style.display === 'flex') {
            galleryModal.style.display = 'none';
            if (typeof window.currentGalleryOnClose === 'function') {
                window.currentGalleryOnClose();
                window.currentGalleryOnClose = null; 
            }
            return; 
        }		

        // 處理下拉選單
        const dropdowns =[
            'project-menu', 'save-menu', 'collection-dropdown', 
            'menu-edge', 'menu-angle', 'menu-align', 'menu-construct', 
            'menu-stroke-width', 'menu-circle-angles', 'context-menu',
            'cloud-comm-menu', 'more-actions-menu-lib', 'more-actions-menu-qb'
        ];
        for (const id of dropdowns) {
            const el = document.getElementById(id);
            if (el && el.style.display !== 'none' && el.style.display !== '') {
                el.style.display = 'none';
                return;
            }
        }		

        // 清理模式
        if (selectedElements.length === 1 && selectedElements[0].classList.contains('smart-function')) {
            const panel = document.getElementById('smart-panel');
            if (panel && panel.style.display !== 'none') { cleanupTemporaryFunction(selectedElements[0]); return; }
        }
        if (mode === 'continuous-label') { setMode('select'); statusText.innerText = "已取消連續標字模式。"; document.getElementById('cursor-tooltip').style.display = 'none'; return; }		
        if (typeof isContinuousDraw !== 'undefined' && isContinuousDraw) { isContinuousDraw = false; setMode('select'); statusText.innerText = "已取消連續繪圖。"; return; }
        if (mode === 'symmetry') { setMode('select'); statusText.innerText = "已取消對稱作圖"; return; }
        if (mode === 'construct') {
            constructionModeType = null; constructionStep = 0;
            if (typeof window.clearAllHighlightPoints === 'function') window.clearAllHighlightPoints();
            closeAllMenus(); setMode('select'); return;
        }
        if (mode === 'draw' && currentTool === 'polyline' && currentShape) {
            let ptsStr = currentShape.getAttribute('points');
            if (ptsStr) {
                let pts = ptsStr.trim().split(' ');
                if (pts.length > 1) pts.pop();
                if (pts.length < 2) {
                    const pid = currentShape.id; 
                    currentShape.remove();
                    document.querySelectorAll(`[data-owner-shape="${pid}"][data-dependency-type="polyline_point"]`).forEach(p => p.remove());
                } else {
                    currentShape.setAttribute('points', pts.join(' '));
                    if (typeof generateLabels === 'function') generateLabels(currentShape); 
                    
                    // 結束時，只選取線條，讓使用者看到控制點
                    deselectAll();
                    addToSelection(currentShape);
                    
                    saveState();
                }
            }
            currentShape = null; setMode('select'); statusText.innerText = "折線繪製完成。"; return;
        }
    }

    if (mode === 'continuous-label' && !isTyping) {
        let code = continuousTextStr.charCodeAt(0);
        if (key === '+' || key === '=') {
            if (code < 90) code++; else if (code === 90) code = 97; else if (code < 122) code++; else code = 122;             
        } else if (key === '-') {
            if (code > 97) code--; else if (code === 97) code = 90; else if (code > 65) code--; else code = 65;              
        }
        continuousTextStr = String.fromCharCode(code);
        svgCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: window.currentClientX, clientY: window.currentClientY }));
        e.preventDefault(); return;
    }	
    
    if (key === 'Enter') {
        if (selectedElements.length > 0) {
            const chartGroups = new Set();
            selectedElements.forEach(el => {
                if (el.classList.contains('line-chart-point')) {
                    if (el.parentNode && el.parentNode.getAttribute('data-sub-tool') === 'axis-chart') chartGroups.add(el.parentNode);
                } else if (el.getAttribute('data-sub-tool') === 'axis-chart') {
                    chartGroups.add(el);
                }
            });
            if (chartGroups.size > 0) {
                e.preventDefault();
                chartGroups.forEach(group => { if (typeof window.resetLineChartXSpacing === 'function') window.resetLineChartXSpacing(group); });
                if (typeof saveState === 'function') saveState();
                statusText.innerText = "已將折線圖節點 X 座標恢復等距"; return;
            }
        }
        if (mode === 'symmetry' && symmetryStep === 0 && selectedElements.length > 0) {
            e.preventDefault(); symmetryStep = 1; statusText.innerText = "步驟 2/2：請畫或選對稱軸"; handlesLayer.innerHTML = ''; return;
        }
    }   

    if (key === 'Delete' || key === 'Backspace') {
        e.preventDefault();
        if (typeof deleteSelected === 'function') deleteSelected();
    }

    if (e.ctrlKey || e.metaKey) {
        const k = key.toLowerCase();
        if (k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        if (k === 'y') { e.preventDefault(); redo(); }
        if (k === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSelected(); else groupSelected(); }
        if (k === 'a') { e.preventDefault(); selectAllShapes(); }
        if (k === 'c') { e.preventDefault(); copySelection(); }
        if (k === 'x') { e.preventDefault(); cutSelection(); }
        if (k === 'v') { e.preventDefault(); pasteSelection(); }
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        if (selectedElements.length > 0) {
            const el = selectedElements[0];
            if (el.getAttribute('data-tool') === 'blocks' && el.hasAttribute('data-selected-r')) return; 			
            e.preventDefault();
            const delta = (e.shiftKey || window.vkShiftActive) ? 10 : 2;
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
        // 將軌道吸附 (btn-snap-point) 與鎖定 (btn-lock-geom) 加入例外清單
        if (['btn-toggle-grid', 'btn-snap-intersection', 'btn-snap-point', 'btn-lock-geom'].includes(btn.id)) {
            return;
        }
        btn.classList.remove('active');
    });
	if (mode !== 'construct') {
        constructionStep = 0;
        document.getElementById('cursor-tooltip').style.display = 'none';
    }
    if (mode === 'continuous-label') {
		const inputEl = document.getElementById('label-start-input');
		const startVal = inputEl ? inputEl.value : 'A';
		continuousTextStr = startVal; 
        const btn = document.getElementById('btn-continuous-label');
        if (btn) btn.classList.add('active'); 
        statusText.innerText = "連續文字標模式：點擊畫布放置文字，按右鍵或 ESC 結束。";
    } else if (mode === 'select') {
        document.getElementById('btn-select').classList.add('active');
        svgCanvas.classList.add('mode-select');
        svgCanvas.classList.remove('mode-draw');
        statusText.innerText = "選取模式：點擊選取，空白處拖拉可框選。";
    } else {
        deselectAll();
        if (currentSubTool && tool !== 'text' && tool !== 'math') {
            const targetBtn = document.querySelector(`.shape-btn[onclick*="'${currentSubTool}'"]`);
            if (targetBtn) targetBtn.classList.add('active');
        }
        if (tool === 'text') document.getElementById('btn-text').classList.add('active');
        if (tool === 'math') document.getElementById('btn-math').classList.add('active');
        svgCanvas.classList.add('mode-draw');
        svgCanvas.classList.remove('mode-select');
        
        // ▼▼▼ 核心修改處：直接在畫布中央生成文字與數學式 ▼▼▼
        if (tool === 'math' || tool === 'text') {
            let ax, ay;
            let isCentered = false; // 紀錄是否使用可視區中心
            
            // 讀取自訂預設值
            const cachedDefaults = localStorage.getItem('math_editor_param_' + tool + '_defaults');
            let defW = 150, defH = 50, defX = null, defY = null, defFs = 20;
            if (cachedDefaults) {
                try {
                    const parsed = JSON.parse(cachedDefaults);
                    if (parsed.p_w !== undefined) defW = parseFloat(parsed.p_w);
                    if (parsed.p_h !== undefined) defH = parseFloat(parsed.p_h);
                    if (parsed.p_x !== '' && parsed.p_x !== null && parsed.p_x !== undefined) defX = parseFloat(parsed.p_x);
                    if (parsed.p_y !== '' && parsed.p_y !== null && parsed.p_y !== undefined) defY = parseFloat(parsed.p_y);
                    if (parsed.p_fs !== undefined) defFs = parseFloat(parsed.p_fs);
                } catch(e){}
            }

            const initWidth = defW;
            const initHeight = defH;

            // 如果有定錨點，優先使用定錨點
            if (window.anchorPoint) {
                ax = window.anchorPoint.x;
                ay = window.anchorPoint.y;
                window.clearAnchorPoint();
            } else if (defX !== null && !isNaN(defX) && defY !== null && !isNaN(defY)) {
                // 如果有設定絕對位置，就以該位置(左上角)計算中心點
                ax = defX + initWidth / 2;
                ay = defY + initHeight / 2;
            } else {
                // 否則抓取畫布的【可視區】中心點
                const center = typeof window.getVisibleCanvasCenter === 'function' 
                               ? window.getVisibleCanvasCenter() 
                               : { x: 400, y: 300 };
                ax = center.x;
                ay = center.y;
                isCentered = true; // 標記為使用了預設中心
            }

            // 複製上次的設定狀態，但強制套用右鍵設定的「預設字體大小」
            const cfg = window.lastTextConfig ? { ...window.lastTextConfig } : { size: "20", color: "#000000", writingMode: "horizontal-tb", bold: false };
            cfg.size = defFs.toString(); 
            window.lastTextConfig = cfg; // 寫回全域變數，讓上方浮動編輯列能抓到正確的值
            
            const fw = cfg.bold ? 'bold' : 'normal';

            const fo = document.createElementNS(ns, "foreignObject");

            // 計算最終 X 座標：若使用預設中心，向左偏移 1/4 寬度
            let finalX = ax - initWidth / 2;
            if (isCentered) {
                finalX -= initWidth / 4;
            }

            // 以中心點定位
            fo.setAttribute("transform", `translate(${finalX}, ${ay - initHeight/2})`);
            fo.setAttribute("x", "0"); 
            fo.setAttribute("y", "0");
            fo.setAttribute("width", initWidth); 
            fo.setAttribute("height", initHeight);
            fo.setAttribute("class", "shape math-obj");
            fo.setAttribute("data-tool", tool);
            fo.setAttribute("data-content", "");
            fo.setAttribute("data-font-size", cfg.size);
            fo.setAttribute("fill", cfg.color);
            
            const div = document.createElement("div");
            div.className = "math-content";
            div.style.cssText = `font-size: ${cfg.size}px; color: ${cfg.color}; font-weight: ${fw}; writing-mode: ${cfg.writingMode}; text-orientation: ${cfg.writingMode === 'vertical-rl' ? 'upright' : 'mixed'};`;
            
            if (cfg.writingMode === 'vertical-rl') {
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.style.textAlign = 'center';
            }

            fo.appendChild(div);
            shapesLayer.appendChild(fo);
            
            // 立即轉為選取模式，並開啟文字編輯器
            setMode('select');
            deselectAll(); // 確保不會多選
            addToSelection(fo);
            openTextModal(tool, fo);
            return;
        } 
        // ▲▲▲ 修改結束 ▲▲▲
        else {
            statusText.innerText = `繪圖模式：${currentSubTool}`;
        }
        
        if (newMode === 'edit-blocks') {
            svgCanvas.classList.add('mode-edit-blocks');
            svgCanvas.classList.remove('mode-select', 'mode-draw');
            statusText.innerText = "積木編輯模式：【左鍵】點擊方格疊加，【Shift+左鍵】消除。點擊空白處結束。";
        } else {
            svgCanvas.classList.remove('mode-edit-blocks');
        }
    }
}
window.setMode = setMode;

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
    } else if (currentTool === 'blocks') {
        // 【新增】呼叫 blocks.js 產生積木
        if (typeof window.createSolidBlocks === 'function') {
            currentShape = window.createSolidBlocks(x, y);
            // 建立完直接結束
            return;
        }
    } else if (currentTool === 'point') {
        shape = document.createElementNS(ns, "ellipse");
        const snap = findClosestPointOnShapes(x, y);
        if (snap && snap.shape.id) {
            shape.setAttribute('data-snapped-to', snap.shape.id);
            if (snap.type === 'line') {
                shape.setAttribute('data-snap-t', snap.t);
            } else if (snap.type === 'circle') {
                shape.setAttribute('data-snap-angle', snap.angle);
            }
            x = snap.point.x;
            y = snap.point.y;
        }		
        
        // ▼▼▼ 修改：讀取右鍵參數面板存下來的「點半徑」與「實心設定」 ▼▼▼
        let pointRadius = 3; // 預設大小
        let isSolid = true;  // 預設實心

        const cachedPoint = localStorage.getItem('math_editor_param_point');
        if (cachedPoint) {
            try {
                const savedVals = JSON.parse(cachedPoint);
                if (savedVals.p_r) pointRadius = parseFloat(savedVals.p_r);
                if (savedVals.p_solid !== undefined) isSolid = savedVals.p_solid;
            } catch(e) {}
        }
        
        shape.setAttribute('cx', x);
        shape.setAttribute('cy', y);
        shape.setAttribute('rx', pointRadius);
        shape.setAttribute('ry', pointRadius);
        
        // 設定實心/空心屬性與顏色
        const solidAttr = isSolid ? '1' : '0';
        const fillColor = isSolid ? strokeColor : 'white';
        
        shape.setAttribute('data-solid', solidAttr);
        shape.style.cssText = `stroke: ${strokeColor}; stroke-width: 1.5px; fill: ${fillColor}; vector-effect: non-scaling-stroke; cursor: move;`;
        // ▲▲▲ 修改結束 ▲▲▲
	} else if (currentTool === 'freehand' || currentTool === 'pen') {
        shape = document.createElementNS(ns, "path");
        shape.setAttribute("d", `M ${x} ${y}`);
        shape.setAttribute("class", `shape ${currentTool}`); 
        shape.style.cssText = commonStyle;
        currentPathPoints = [{x: x, y: y}];
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
        hitLine.setAttribute('x1', x);
        hitLine.setAttribute('y1', y);
        hitLine.setAttribute('x2', x);
        hitLine.setAttribute('y2', y);
        hitLine.setAttribute('class', 'hit-line');
        hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        const visLine = document.createElementNS(ns, "line");
        visLine.setAttribute('x1', x);
        visLine.setAttribute('y1', y);
        visLine.setAttribute('x2', x);
        visLine.setAttribute('y2', y);
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

    if (tool === 'text' || tool === 'math') {
        const x = Math.min(sx, cx);
        const w = Math.abs(cx - sx);
        shape.setAttribute('x', x);
        shape.setAttribute('width', w);
        const h = Math.max(40, Math.abs(cy - sy));
        shape.setAttribute('height', h);
        return;
    }

    if (tool === 'point') return;
    if (tool === 'freehand' || tool === 'pen') {
        if (tool === 'freehand') {
            const d = shape.getAttribute("d");
            shape.setAttribute("d", `${d} L ${cx} ${cy}`);
        } else if (tool === 'pen') {
            const lastPt = currentPathPoints[currentPathPoints.length - 1];
            if (Math.hypot(cx - lastPt.x, cy - lastPt.y) > PEN_SMOOTH_THRESHOLD) {
                currentPathPoints.push({x: cx, y: cy});
                let d = `M ${currentPathPoints[0].x} ${currentPathPoints[0].y}`;
                for (let i = 1; i < currentPathPoints.length - 1; i++) {
                    const p1 = currentPathPoints[i];
                    const p2 = currentPathPoints[i + 1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    d += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`;
                }
                if (currentPathPoints.length > 1) {
                    const finalPt = currentPathPoints[currentPathPoints.length - 1];
                    d += ` L ${finalPt.x} ${finalPt.y}`;
                }
                shape.setAttribute("d", d);
            }
        }
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
            shape.setAttribute('data-cx', cx_cyl);
            shape.setAttribute('data-cy', realY);
            shape.setAttribute('data-r', r);
            shape.setAttribute('data-h', realH);
        } else if (subTool === 'solid-cone') {
            const r = realW / 2;
            const cx_cone = realX + r;
            shape.setAttribute('data-cx', cx_cone);
            shape.setAttribute('data-cy', realY);
            shape.setAttribute('data-r', r);
            shape.setAttribute('data-h', realH);
        } else if (subTool === 'solid-sphere') {
            const r = Math.max(realW, realH) / 2;
            shape.setAttribute('data-cx', realX + r);
            shape.setAttribute('data-cy', realY + r);
            shape.setAttribute('data-r', r);
        } else if (subTool === 'solid-pyramid') {
            shape.setAttribute('data-cx', realX + realW/2);
            shape.setAttribute('data-cy', realY + realH); 
            shape.setAttribute('data-w', realW);
            shape.setAttribute('data-h', realH);
        }  else if (subTool === 'solid-prism') {
            shape.setAttribute('data-cx', realX + realW/2);
            shape.setAttribute('data-cy', realY + realH); // 底面貼齊拖曳框底部
            shape.setAttribute('data-w', realW);
            shape.setAttribute('data-h', realH);
            
            // 給予初始的透視深度與偏移
            if (subTool === 'solid-pyramid') {
                shape.setAttribute('data-d', realW * 0.8);
            } else {
                shape.setAttribute('data-dx', realW * 0.4);
                shape.setAttribute('data-dy', -realW * 0.3);
            }
        }
        redrawSolid(shape);
        return;
    }
    if (tool === 'ellipse') {
        if (subTool === 'sector' || subTool === 'arc' || subTool === 'arch') {
            // [修正] 扇形繪製邏輯：1->2->3->4 象限
            const centerX = (sx + cx) / 2;
            const centerY = (sy + cy) / 2;
            const radius = Math.max(Math.abs(cx - sx), Math.abs(cy - sy)) / 2;
            
            // 固定起始角度為 0 (3點鐘方向)
            const startAngle = 0;
            
            // 將 Y 軸反轉以符合標準數學象限 (逆時針為正)
            let endAngle = Math.atan2(-(cy - centerY), cx - centerX);
            if (endAngle < 0) endAngle += 2 * Math.PI;

            // 運算座標點 (注意 Y 軸減去)
            const stX = centerX + radius * Math.cos(startAngle);
            const stY = centerY - radius * Math.sin(startAngle); 
            const endX = centerX + radius * Math.cos(endAngle);
            const endY = centerY - radius * Math.sin(endAngle);
            
            // 0 -> endAngle 逆時針繪製
            const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
            const sweepFlag = 0; // 0 代表逆時針繪製 (向上掃掠)

            let d = "";
            if (subTool === 'arc') d = `M ${stX} ${stY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`;
            else if (subTool === 'sector') d = `M ${centerX} ${centerY} L ${stX} ${stY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
            else if (subTool === 'arch') d = `M ${stX} ${stY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
            
            shape.setAttribute("d", d);
            shape.setAttribute("data-center-x", centerX);
            shape.setAttribute("data-center-y", centerY);
            shape.setAttribute("data-radius", radius);
            shape.setAttribute("data-start-angle", startAngle);
            shape.setAttribute("data-end-angle", endAngle);
            shape.removeAttribute('data-draw-dir');

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
        let ptsStr = "";
        if (subTool === 'rect-square' || subTool === 'rect-free') {
            if (subTool === 'rect-square') {
                const d = Math.max(Math.abs(w), Math.abs(h));
                w = (w > 0 ? d : -d); h = (h > 0 ? d : -d);
            }
            const x1 = Math.min(sx, sx + w); const x2 = Math.max(sx, sx + w);
            const y1 = Math.min(sy, sy + h); const y2 = Math.max(sy, sy + h);
            ptsStr = `${x1},${y1} ${x1},${y2} ${x2},${y2} ${x2},${y1}`;
        } else if (subTool === 'tri-iso') {
            ptsStr = `${sx + w/2},${sy} ${sx},${cy} ${cx},${cy}`;
        } else if (subTool === 'tri-right') {
            ptsStr = `${sx},${sy} ${sx},${cy} ${cx},${cy}`;
        } else if (subTool === 'tri-equi') {
            const side = Math.abs(w);
            const eqHeight = side * Math.sqrt(3) / 2;
            h = (h >= 0 ? eqHeight : -eqHeight);
            ptsStr = `${sx + w/2},${sy} ${sx},${sy + h} ${sx + w},${sy + h}`;
        } else if (subTool === 'rhombus') {
            ptsStr = `${sx + w/2},${sy} ${sx},${sy + h/2} ${sx + w/2},${cy} ${cx},${sy + h/2}`;
        } else if (subTool === 'kite') {
            ptsStr = `${sx + w/2},${sy} ${sx},${sy + h*0.3} ${sx + w/2},${cy} ${cx},${sy + h*0.3}`;
        } else if (subTool === 'parallelogram') {
            const shift = w * 0.25;
            ptsStr = `${sx + shift},${sy} ${sx},${cy} ${cx - shift},${cy} ${cx},${sy}`;
        } else if (subTool === 'trapezoid') {
            const shift = w * 0.2;
            ptsStr = `${sx + shift},${sy} ${sx},${cy} ${cx},${cy} ${cx - shift},${sy}`;
        } else if (subTool === 'polygon-regular') {
             const n = polygonSides || 5;
             const radius = Math.max(Math.abs(w), Math.abs(h)); 
             const centX = sx + (w > 0 ? radius : -radius);
             const centY = sy + (h > 0 ? radius : -radius);
             const angleStep = (2 * Math.PI) / n;
             let startAngle = Math.PI / 2; 
             if (n % 2 === 0) startAngle = Math.PI / 2 + (angleStep / 2);
             let pts =[];
             for(let i=0; i<n; i++) {
                 const ang = startAngle + i * angleStep;
                 pts.push(`${centX + radius * Math.cos(ang)},${centY - radius * Math.sin(ang)}`);
             }
             ptsStr = pts.join(' ');
        }
        shape.setAttribute('points', ptsStr);
    }
}

function drawHandles(shape) {
    handlesLayer.innerHTML = '';
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    const depType = shape.getAttribute('data-dependency-type');
    
    // 【新增】排除 axes-system
    if (['tangent_po_line', 'tangent_radius', 'common_tangent', 'altitude', 'tangent_on_circle_radius', 'extension_line', 'polygon_diagonal'].includes(depType) || shape.classList.contains('axes-system')) {
        return; 
    }
	
    if (tool === 'line' && depType === 'internal_line') {
        const l = shape.querySelector('.visible-line') || shape.querySelector('line');
        if (l) {
            let matrix;
            try {
                const parent = shape.parentNode;
                matrix = parent.getScreenCTM().inverse().multiply(shape.getScreenCTM());
            } catch (e) { return; }
            const transformPoint = (x, y) => {
                let pt = svgCanvas.createSVGPoint(); pt.x = x; pt.y = y;
                pt = pt.matrixTransform(matrix); return { x: pt.x, y: pt.y };
            };
            const p1 = transformPoint(+l.getAttribute('x1'), +l.getAttribute('y1'));
            const p2 = transformPoint(+l.getAttribute('x2'), +l.getAttribute('y2'));
            
            const h1 = document.createElementNS(ns, "circle");
            h1.setAttribute('cx', p1.x); h1.setAttribute('cy', p1.y); h1.setAttribute('r', 6);
            h1.setAttribute('class', 'vertex-handle'); h1.setAttribute('data-index', 0);
            h1.style.fill = '#3498db'; h1.style.stroke = 'white';
            handlesLayer.appendChild(h1);

            const h2 = document.createElementNS(ns, "circle");
            h2.setAttribute('cx', p2.x); h2.setAttribute('cy', p2.y); h2.setAttribute('r', 6);
            h2.setAttribute('class', 'vertex-handle'); h2.setAttribute('data-index', 1);
            h2.style.fill = '#3498db'; h2.style.stroke = 'white';
            handlesLayer.appendChild(h2);
            return;
        }
    }
    
    if (tool === 'blocks') {
        const heights = JSON.parse(shape.getAttribute('data-heights'));
        const rows = heights.length;
        const cols = heights[0].length;
        const s = parseFloat(shape.getAttribute('data-block-size')) || 35;
        const dx = s * 0.866025; // cos(30)
        const dy = s * 0.5;      // sin(30)
        
        const matrix = shape.getCTM();
        const toGlobal = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint(); pt.x = lx; pt.y = ly;
            return pt.matrixTransform(matrix);
        };

        // 1. 右側角落 (黃色圓形)：控制整體縮放
        const rightPt = toGlobal(cols * dx, cols * dy);
        const h0 = document.createElementNS(ns, "circle");
        h0.setAttribute('cx', rightPt.x); h0.setAttribute('cy', rightPt.y); h0.setAttribute('r', 7);
        h0.setAttribute('class', 'vertex-handle scale-handle'); h0.setAttribute('data-index', 0);
        h0.style.fill = '#f1c40f'; h0.style.stroke = '#e67e22'; h0.style.strokeWidth = '2px';
        h0.style.cursor = 'nwse-resize'; 
        handlesLayer.appendChild(h0);

        // 2. 正前方底部角落 (藍色方形)：控制長寬格數
        const frontPt = toGlobal((cols - rows) * dx, (cols + rows) * dy);
        const h1 = document.createElementNS(ns, "rect");
        h1.setAttribute('x', frontPt.x - 7); h1.setAttribute('y', frontPt.y - 7);
        h1.setAttribute('width', 14); h1.setAttribute('height', 14);
        h1.setAttribute('class', 'vertex-handle grid-resize-handle'); h1.setAttribute('data-index', 1);
        h1.style.fill = '#3498db'; h1.style.stroke = '#fff'; h1.style.strokeWidth = '2px';
        h1.style.cursor = 'move'; 
        handlesLayer.appendChild(h1);
        return;
    }
    if (subTool === 'parabola') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const a = parseFloat(shape.getAttribute('data-a'));
        const height = parseFloat(shape.getAttribute('data-height'));
        const dir = shape.getAttribute('data-dir') || 'up';
        
        const m = shape.getCTM();
        const toGlobal = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint(); pt.x = lx; pt.y = ly;
            return pt.matrixTransform(m);
        };
        
        const halfW = Math.sqrt(height / Math.abs(a));
        let tipX, tipY;
        
        switch (dir) {
            case 'up':    tipX = cx + halfW; tipY = cy - height; break;
            case 'down':  tipX = cx + halfW; tipY = cy + height; break;
            case 'left':  tipX = cx - height; tipY = cy + halfW; break;
            case 'right': tipX = cx + height; tipY = cy + halfW; break;
        }

        const h_glob = toGlobal(tipX, tipY);

        const h = document.createElementNS(ns, "circle");
        h.setAttribute('cx', h_glob.x); h.setAttribute('cy', h_glob.y); h.setAttribute('r', 6);
        h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', 0);
        h.style.fill = '#f1c40f';
        h.style.stroke = 'white'; 
        handlesLayer.appendChild(h);
        return;
    }
	
    if (subTool === 'inequality') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const dir = parseFloat(shape.getAttribute('data-dir'));
        const len = parseFloat(shape.getAttribute('data-len'));
        
        const m = shape.getCTM();
        const toGlobal = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint(); pt.x = lx; pt.y = ly;
            return pt.matrixTransform(m);
        };

        // 控制點在箭頭尖端
        const tipX = cx + len * dir;
        const p_glob = toGlobal(tipX, cy);

        const h = document.createElementNS(ns, "circle");
        h.setAttribute('cx', p_glob.x); h.setAttribute('cy', p_glob.y); h.setAttribute('r', 6);
        h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', 0);
        h.style.fill = '#f1c40f'; h.style.stroke = 'white'; 
        handlesLayer.appendChild(h);
        return;
    }

    // ==========================================
    // 1. 長度標註 (Dimension) - 兩端控制點
    // ==========================================
    if (subTool === 'dimension') {
        const p1x = parseFloat(shape.getAttribute('data-p1-x'));
        const p1y = parseFloat(shape.getAttribute('data-p1-y'));
        const p2x = parseFloat(shape.getAttribute('data-p2-x'));
        const p2y = parseFloat(shape.getAttribute('data-p2-y'));

        if (!isNaN(p1x) && !isNaN(p1y) && !isNaN(p2x) && !isNaN(p2y)) {
            const createHandle = (idx, x, y) => {
                const h = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                h.setAttribute('cx', x); h.setAttribute('cy', y);
                h.setAttribute('r', 6);
                h.setAttribute('class', 'vertex-handle');
                h.setAttribute('data-index', idx);
                h.style.fill = '#f39c12'; // 橘黃色區分
                h.style.stroke = 'white';
                handlesLayer.appendChild(h);
            };
            createHandle(0, p1x, p1y);
            createHandle(1, p2x, p2y);
        }
        return;
    }

    // ==========================================
    // 2. 立體圖形 (Solid)
    // ==========================================
    if (tool === 'solid') {
		if (shape.getAttribute('data-view-mode') === 'net') return;
        const matrix = shape.getCTM();
        const viewMode = shape.getAttribute('data-view-mode') || '3d';
        const transformPoint = (lx, ly) => {
            if (!Number.isFinite(lx) || !Number.isFinite(ly)) return {x: 0, y: 0, valid: false};
            let pt = svgCanvas.createSVGPoint();
            pt.x = lx; pt.y = ly;
            const res = pt.matrixTransform(matrix);
            res.valid = true;
            return res;
        };
        const mkHandle = (idx, lx, ly, color, labelText) => {
            const p = transformPoint(lx, ly);
            if (!p.valid) return;
            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', p.x); h.setAttribute('cy', p.y); h.setAttribute('r', 6);
            h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', idx);
            h.style.fill = color; h.style.stroke = '#2980b9';
            handlesLayer.appendChild(h);
            if (labelText) {
                const text = document.createElementNS(ns, "text");
                text.setAttribute('x', p.x + 10); text.setAttribute('y', p.y + 4);
                text.textContent = labelText;
                text.style.cssText = `font-family: Arial; font-size: 13px; font-weight: bold; fill: ${color}; pointer-events: none;`;
                text.style.paintOrder = "stroke fill"; text.style.stroke = "white"; text.style.strokeWidth = "3px";
                handlesLayer.appendChild(text);
            }
        };
        
        if (subTool === 'solid-cube') {
            const x = parseFloat(shape.getAttribute('data-x')), y = parseFloat(shape.getAttribute('data-y'));
            const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
            if (viewMode === '3d') {
                const dx = parseFloat(shape.getAttribute('data-dx')), dy = parseFloat(shape.getAttribute('data-dy'));
                mkHandle(0, x + w, y + h / 2, '#f1c40f', '寬'); mkHandle(1, x + w / 2, y + h, '#2ecc71', '高'); mkHandle(2, x + w + dx, y + dy, '#e74c3c', '深');
            } else {
                const d = parseFloat(shape.getAttribute('data-d')) || 50;
                const cx = x + w/2; const cy = y + h/2;
                mkHandle(0, cx + w/2, cy, '#f1c40f', '寬'); mkHandle(1, cx, cy + h/2, '#2ecc71', '高'); mkHandle(2, cx, cy - h/2 - d, '#e74c3c', '深'); 
            }
        } else if (subTool === 'solid-cylinder') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
            const r = parseFloat(shape.getAttribute('data-r')), h = parseFloat(shape.getAttribute('data-h'));
            if (viewMode === '3d') {
                mkHandle(0, cx + r, cy + h, '#f1c40f', '半徑'); mkHandle(1, cx, cy, '#2ecc71', '高'); 
            } else {
                const rectW = 2 * Math.PI * r;
                // 【核心修正】展開圖高度把手改在上方 (cy - h)
                mkHandle(0, cx + rectW/2, cy - h/2, '#f1c40f', '半徑'); 
                mkHandle(1, cx, cy - h, '#2ecc71', '高');
            }
        } else if (subTool === 'solid-cone') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
            const r = parseFloat(shape.getAttribute('data-r')), h = parseFloat(shape.getAttribute('data-h'));
            if (viewMode === '3d') {
                mkHandle(0, cx + r, cy + h, '#f1c40f', '半徑'); mkHandle(1, cx, cy, '#2ecc71', '高'); 
            } else {
                const s = Math.sqrt(r * r + h * h);
                // 【核心修正】展開圖半徑與斜高把手改在上方
                mkHandle(0, cx + r, cy - s - r, '#f1c40f', '半徑'); 
                mkHandle(1, cx, cy - s, '#2ecc71', '斜高');
            }
        } else if (subTool === 'solid-sphere') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
            const r = parseFloat(shape.getAttribute('data-r'));
            mkHandle(0, cx + r, cy, '#f1c40f', '半徑'); 
        } else if (subTool === 'solid-pyramid') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
            const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
            if (viewMode === '3d') {
                mkHandle(0, cx + w/2, cy + w*0.05, '#f1c40f', '底寬'); 
                mkHandle(1, cx, cy - h, '#2ecc71', '高');
            } else {
                mkHandle(0, cx + w/2, cy, '#f1c40f', '底寬');
            }
        } else if (subTool === 'solid-prism') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
            const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
            if (viewMode === '3d') {
                // 控制點：右下角(寬)、頂點(高)
                mkHandle(0, cx + w/2, cy + h/2, '#f1c40f', '底寬');
                mkHandle(1, cx, cy - h/2, '#2ecc71', '高');
            } else {
                mkHandle(0, cx + w/2, cy, '#f1c40f', '底寬');
            }
        }
        
        // 旋轉手柄
        let bbox = shape.getBBox();
        let topX = bbox.x + bbox.width/2;
        let topY = bbox.y - 25;
        const hp = transformPoint(topX, topY);
        if (hp.valid) {
            const rHandle = document.createElementNS(ns, "circle");
            rHandle.setAttribute('cx', hp.x); rHandle.setAttribute('cy', hp.y); rHandle.setAttribute('r', 6); rHandle.setAttribute('class', 'rotate-handle');
            handlesLayer.appendChild(rHandle);
        }
        return;
    }

    // ==========================================
    // 3. 智慧圓形 (Circle Smart)
    // ==========================================
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
	if (tool === 'line' && depType === 'altitude_extension') {
        const l = shape.querySelector('.visible-line') || shape.querySelector('line');
        if (l) {
            let matrix;
            try {
                const parent = shape.parentNode;
                matrix = parent.getScreenCTM().inverse().multiply(shape.getScreenCTM());
            } catch (e) { return; }
            const transformPoint = (x, y) => {
                let pt = svgCanvas.createSVGPoint(); pt.x = x; pt.y = y;
                pt = pt.matrixTransform(matrix); return { x: pt.x, y: pt.y };
            };
            // 延長線只需要拖曳外側端點 (index 1)
            const p2 = transformPoint(+l.getAttribute('x2'), +l.getAttribute('y2'));
            
            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', p2.x); h.setAttribute('cy', p2.y); h.setAttribute('r', 7);
            h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', 1);
            h.style.fill = '#e67e22'; h.style.stroke = 'white';
            handlesLayer.appendChild(h);
            return;
        }
    }	
    if (tool === 'line' &&['radius', 'diameter', 'chord'].includes(depType)) {
        const l = shape.querySelector('.visible-line') || shape.querySelector('line');
        if (l) {
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

            const p1 = transformPoint(+l.getAttribute('x1'), +l.getAttribute('y1'));
            const p2 = transformPoint(+l.getAttribute('x2'), +l.getAttribute('y2'));

            const createOrangeHandle = (x, y, idx) => {
                const h = document.createElementNS(ns, "circle");
                h.setAttribute('cx', x); h.setAttribute('cy', y); h.setAttribute('r', 7);
                h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', idx);
                h.style.fill = '#e67e22'; h.style.stroke = 'white'; // 橘色酷炫控制點
                handlesLayer.appendChild(h);
            };

            if (depType === 'radius') {
                createOrangeHandle(p2.x, p2.y, 1); // 只有外側點有控制把手
            } else if (depType === 'diameter' || depType === 'chord') {
                createOrangeHandle(p1.x, p1.y, 0); // 兩側都有控制把手
                createOrangeHandle(p2.x, p2.y, 1);
            }
            return; // 結束，不繪製一般的白色控制點和旋轉把手
        }
    }
    if (tool === 'line' && depType === 'base_parallel_line') {
        const l = shape.querySelector('.visible-line') || shape.querySelector('line');
        if (l) {
            let matrix;
            try {
                const parent = shape.parentNode;
                matrix = parent.getScreenCTM().inverse().multiply(shape.getScreenCTM());
            } catch (e) { return; }
            const transformPoint = (x, y) => {
                let pt = svgCanvas.createSVGPoint(); pt.x = x; pt.y = y;
                pt = pt.matrixTransform(matrix); return { x: pt.x, y: pt.y };
            };
            const x1 = +l.getAttribute('x1'), y1 = +l.getAttribute('y1');
            const x2 = +l.getAttribute('x2'), y2 = +l.getAttribute('y2');
            const mid = transformPoint((x1+x2)/2, (y1+y2)/2); // 取線段中點
            
            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', mid.x); h.setAttribute('cy', mid.y); h.setAttribute('r', 6);
            h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', 0);
            h.style.fill = '#3498db'; h.style.stroke = 'white';
            handlesLayer.appendChild(h);
            return;
        }
    }

    // ==========================================
    // 4. 文氏圖 (Venn)
    // ==========================================
    if (subTool === 'venn') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const spacingPercent = parseFloat(shape.getAttribute('data-spacing-percent'));
        const count = parseInt(shape.getAttribute('data-count'));
        const d = r * (spacingPercent / 100) * 2;
        const matrix = shape.getCTM();
        const transformPoint = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint(); pt.x = lx; pt.y = ly;
            return pt.matrixTransform(matrix);
        };
        let h1_loc, h2_loc;
        if (count === 2) { h1_loc = {x: cx - d/2, y: cy - r}; h2_loc = {x: cx + d/2, y: cy}; }
        else { const h = d * Math.sqrt(3) / 2; h1_loc = {x: cx, y: cy - h/2 - r}; h2_loc = {x: cx - d/2, y: cy + d*Math.sqrt(3)/4}; }
        
        const h1_glob = transformPoint(h1_loc.x, h1_loc.y);
        const h2_glob = transformPoint(h2_loc.x, h2_loc.y);

        const mkH = (p, idx, col) => {
            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', p.x); h.setAttribute('cy', p.y); h.setAttribute('r', 7);
            h.setAttribute('class', 'vertex-handle venn-handle'); h.setAttribute('data-index', idx);
            h.style.fill = col; handlesLayer.appendChild(h);
        };
        mkH(h1_glob, 0, 'cyan'); mkH(h2_glob, 1, 'lime');
        return;
    }

    // ==========================================
    // 5. 圓餅圖 (Pie Chart)
    // ==========================================
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
        const transformPoint = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint(); pt.x = lx; pt.y = ly;
            return pt.matrixTransform(matrix);
        };
        angles.forEach((angle, i) => {
            if (i === angles.length - 1) return; 
            const lx = cx + r * Math.cos(angle);
            const ly = cy + r * Math.sin(angle);
            const pt = transformPoint(lx, ly);
            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', pt.x); h.setAttribute('cy', pt.y); h.setAttribute('r', 7);
            h.setAttribute('class', 'vertex-handle pie-handle'); h.setAttribute('data-index', i);
            h.style.fill = 'cyan'; h.style.stroke = 'blue';
            handlesLayer.appendChild(h);
        });
        const topCenter = { x: cx, y: cy - r - 25 };
        const handlePt = transformPoint(topCenter.x, topCenter.y);
        const rHandle = document.createElementNS(ns, "circle");
        rHandle.setAttribute('cx', handlePt.x); rHandle.setAttribute('cy', handlePt.y);
        rHandle.setAttribute('r', 6); rHandle.setAttribute('class', 'rotate-handle');
        handlesLayer.appendChild(rHandle);
        return; 
    }

    // ==========================================
    // 6. 圓形角群組 (Circle Angles)
    // ==========================================
    if (subTool && subTool.includes('-angle')) {
        const groupMatrix = shape.getCTM();
        const parentMatrix = handlesLayer.getCTM().inverse();
        const localToHandleMatrix = parentMatrix.multiply(groupMatrix);
        const dataNodes = Array.from(shape.querySelectorAll('.vertex-data'));
        let handleIndices = [];
        if (subTool === 'central-angle') handleIndices = [1, 2];
        if (subTool === 'inscribed-angle') handleIndices = [0, 1, 2];
        
        // 【修正】弦切角現在有 4 個控制點 [0:A, 1:P, 2:T1, 3:T2]
        if (subTool === 'tangent-chord-angle') handleIndices = [0, 1, 2, 3];

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
                
                // 區分樣式：切點(1)用紫色，其他用藍色
                if (subTool === 'tangent-chord-angle' && i === 1) {
                    h.style.cssText = "fill:#8e44ad; stroke:white; stroke-width:2px; cursor:pointer;";
                } else {
                    h.style.cssText = "fill:white; stroke:#2980b9; stroke-width:2px; cursor:pointer;";
                }
                handlesLayer.appendChild(h);
            }
        });
        return;
    }
    if (subTool === 'tangent-lines') {
        const ctrlPt = shape.querySelector('.vertex-data');
        if (ctrlPt) {
            const m = shape.getCTM();
            const pt = svgCanvas.createSVGPoint();
            pt.x = parseFloat(ctrlPt.getAttribute('cx'));
            pt.y = parseFloat(ctrlPt.getAttribute('cy'));
            const gPt = pt.matrixTransform(m);

            const h = document.createElementNS(ns, "circle");
            h.setAttribute('cx', gPt.x); h.setAttribute('cy', gPt.y); h.setAttribute('r', 6);
            h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', 0);
            h.style.fill = '#8e44ad'; h.style.stroke = 'white';
            handlesLayer.appendChild(h);
        }
        return;
    }
	if (subTool === 'axis-chart') {
        const w = parseFloat(shape.getAttribute('data-w'));
        const h = parseFloat(shape.getAttribute('data-h'));
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        
        const m = shape.getCTM();
        const parentInv = handlesLayer.getCTM().inverse();
        const matrix = parentInv.multiply(m);
        const transformPoint = (lx, ly) => {
            let pt = svgCanvas.createSVGPoint(); pt.x = lx; pt.y = ly;
            return pt.matrixTransform(matrix);
        };
        
        // 兩個控制點：X軸尾端, Y軸頂端
        const pX = transformPoint(cx - w/2 + w, cy + h/2);
        const pY = transformPoint(cx - w/2, cy + h/2 - h);
        
        const h1 = document.createElementNS(ns, "circle");
        h1.setAttribute('cx', pX.x); h1.setAttribute('cy', pX.y); h1.setAttribute('r', 7);
        h1.setAttribute('class', 'vertex-handle'); h1.setAttribute('data-index', 0);
        h1.style.fill = '#f1c40f'; h1.style.stroke = 'black';
        handlesLayer.appendChild(h1);

        const h2 = document.createElementNS(ns, "circle");
        h2.setAttribute('cx', pY.x); h2.setAttribute('cy', pY.y); h2.setAttribute('r', 7);
        h2.setAttribute('class', 'vertex-handle'); h2.setAttribute('data-index', 1);
        h2.style.fill = '#f1c40f'; h2.style.stroke = 'black';
        handlesLayer.appendChild(h2);
        return;
    }
	
    // ==========================================
    // 7. 通用圖形 (Freehand, Line, Poly, Standard)
    // ==========================================
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
    
    let points =[];
    let bbox = null;
    try { bbox = shape.getBBox(); } catch (e) { bbox = { x: 0, y: 0, width: 0, height: 0 }; }

    if (tool === 'line') {
         if (shape.tagName === 'g') {
            const l = shape.querySelector('.visible-line') || shape.querySelector('line');
            if (l) points =[{x: +l.getAttribute('x1'), y: +l.getAttribute('y1')}, {x: +l.getAttribute('x2'), y: +l.getAttribute('y2')}];
        } else {
            points =[{x: +shape.getAttribute('x1'), y: +shape.getAttribute('y1')}, {x: +shape.getAttribute('x2'), y: +shape.getAttribute('y2')}];
        }
    } else if (tool === 'text' || tool === 'math') {
        const w = parseFloat(shape.getAttribute('width')) || 100;
        const h = parseFloat(shape.getAttribute('height')) || 50;
        points = [ { x: w, y: h } ];
    } else if (tool === 'group') {
        points =[{x: bbox.x, y: bbox.y}, {x: bbox.x + bbox.width, y: bbox.y}, {x: bbox.x, y: bbox.y + bbox.height}, {x: bbox.x + bbox.width, y: bbox.y + bbox.height}];
    } else if (tool === 'ellipse') {
        const subT = shape.getAttribute('data-sub-tool');
        if (subT === 'sector' || subT === 'arc' || subT === 'arch') {
            if (shape.hasAttribute('data-center-x')) {
                const cx = +shape.getAttribute('data-center-x');
                const cy = +shape.getAttribute('data-center-y');
                const r = +shape.getAttribute('data-radius');
                const sA = +shape.getAttribute('data-start-angle');
                const eA = +shape.getAttribute('data-end-angle');
                points.push({x: cx + r * Math.cos(sA), y: cy - r * Math.sin(sA) });
                points.push({x: cx + r * Math.cos(eA), y: cy - r * Math.sin(eA)});
            }
        } else if (subT === 'circle') {
             const cx = +shape.getAttribute('cx'), cy = +shape.getAttribute('cy');
             // 🛠️ 修正：根據標籤類型正確讀取半徑 (r 或是 rx)
             const radius = shape.tagName.toLowerCase() === 'circle' ? +shape.getAttribute('r') : (+shape.getAttribute('rx') || +shape.getAttribute('r'));
             const angle45 = Math.PI / 4; 
             points = [{
                 x: cx + radius * Math.cos(angle45), 
                 y: cy + radius * Math.sin(angle45)
             }];
		} else {
             const cx = +shape.getAttribute('cx'), cy = +shape.getAttribute('cy');
             const rx = +shape.getAttribute('rx'), ry = +shape.getAttribute('ry');
             points =[{x: cx + rx, y: cy}, {x: cx, y: cy + ry}, {x: cx - rx, y: cy}, {x: cx, y: cy - ry}];
        }
    } else if (shape.getAttribute('points')) {
        points = parsePoints(shape.getAttribute('points'));
    } else if (tool === 'image' || shape.tagName === 'rect') {
        let x = parseFloat(shape.getAttribute('x')) || 0;
        let y = parseFloat(shape.getAttribute('y')) || 0;
        let w = parseFloat(shape.getAttribute('width')) || 0;
        let h = parseFloat(shape.getAttribute('height')) || 0;
        points =[{x: x, y: y}, {x: x + w, y: y}, {x: x, y: y + h}, {x: x + w, y: y + h}];
    }

    points.forEach((p, i) => {
        const finalPos = transformPoint(p.x, p.y);
        const h = document.createElementNS(ns, "circle");
        h.setAttribute('cx', finalPos.x); h.setAttribute('cy', finalPos.y); h.setAttribute('r', 6);
        h.setAttribute('class', 'vertex-handle'); h.setAttribute('data-index', i);
        handlesLayer.appendChild(h);
    });

    // ▼▼▼ 新增：三角形與四邊形的專屬右下角拉伸控制點 ▼▼▼
    const tagName = shape.tagName.toLowerCase();
	const parametricQuads =['triangle', 'right_triangle', 'rect', 'square', 'rhombus', 'parallelogram', 'trapezoid', 'kite', 'tri-iso', 'tri-right', 'tri-equi', 'tri-any'];
    if (tagName === 'polygon' && parametricQuads.includes(subTool)) {
        const brPoint = transformPoint(bbox.x + bbox.width + 15, bbox.y + bbox.height + 15);
        const rHandle = document.createElementNS(ns, "rect");
        rHandle.setAttribute('x', brPoint.x - 6);
        rHandle.setAttribute('y', brPoint.y - 6);
        rHandle.setAttribute('width', 12);
        rHandle.setAttribute('height', 12);
        rHandle.setAttribute('class', 'vertex-handle resize-handle');
        rHandle.setAttribute('data-index', 'resize');
        rHandle.style.fill = '#3498db'; // 藍色方形
        rHandle.style.stroke = '#fff';
        rHandle.style.cursor = 'nwse-resize';
        handlesLayer.appendChild(rHandle);
    }
    // ▲▲▲ 新增結束 ▲▲▲
    
    // 旋轉手柄 (排除特殊工具)
    if (tool !== 'solid' && tool !== 'circle-smart' && subTool !== 'pie-chart' && !subTool?.includes('-angle')) {
         let localCenter = { x: bbox.x + bbox.width/2, y: bbox.y + bbox.height/2 };
         let localTop = { x: localCenter.x, y: bbox.y - 25 };
         if (tool === 'line' && points.length >= 2) {
             localCenter = { x: (points[0].x+points[1].x)/2, y: (points[0].y+points[1].y)/2 };
             localTop = { x: localCenter.x, y: Math.min(points[0].y, points[1].y) - 25 };
         }
         const handlePos = transformPoint(localTop.x, localTop.y);
         const edgePos = transformPoint(localTop.x, localTop.y + 25);
         const connector = document.createElementNS(ns, "line");
         connector.setAttribute('x1', edgePos.x); connector.setAttribute('y1', edgePos.y);
         connector.setAttribute('x2', handlePos.x); connector.setAttribute('y2', handlePos.y);
         connector.setAttribute('stroke', '#27ae60'); connector.setAttribute('stroke-dasharray', '3,3');
         handlesLayer.appendChild(connector);
         const rHandle = document.createElementNS(ns, "circle");
         rHandle.setAttribute('cx', handlePos.x); rHandle.setAttribute('cy', handlePos.y);
         rHandle.setAttribute('r', 6); rHandle.setAttribute('class', 'rotate-handle');
         handlesLayer.appendChild(rHandle);
    }
}

function updateVertexPosition(shape, index, nx, ny, isShiftPressed = false) {
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');

    // 【新增】防呆：如果圖形有鎖定邊長，禁止透過 resize 把手或 Shift 縮放
    let lEdges = JSON.parse(shape.getAttribute('data-locked-edges') || '{}');
    let lAngles = JSON.parse(shape.getAttribute('data-locked-angles') || '{}');
    
    if (Object.keys(lEdges).length > 0 && (index === 'resize' || isShiftPressed)) {
        statusText.innerText = "⚠️ 圖案邊長已鎖定，無法進行縮放。請先解鎖。";
        return;
    }
	if (tool === 'line' && shape.getAttribute('data-dependency-type') === 'altitude_extension') {
        if (index === 1) { // 只允許拖曳外側端點
            const ownerId = shape.getAttribute('data-owner-shape');
            const ownerShape = document.getElementById(ownerId);
            if (ownerShape) {
                const pts = getTransformedPoints(ownerShape);
                const idx = parseInt(shape.getAttribute('data-edge-index'));
                const vIdx = parseInt(shape.getAttribute('data-vertex-index'));
                if (pts[idx]) {
                    const V = pts[vIdx];
                    const p1 = pts[idx];
                    const p2 = pts[(idx + 1) % pts.length];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const l2 = dx*dx + dy*dy;
                    if (l2 > 0) {
                        const t = ((V.x - p1.x) * dx + (V.y - p1.y) * dy) / l2;
                        const startP = t < 0 ? p1 : p2;
                        const H = { x: p1.x + t * dx, y: p1.y + t * dy };
                        
                        const dirX = t < 0 ? -dx/Math.sqrt(l2) : dx/Math.sqrt(l2);
                        const dirY = t < 0 ? -dy/Math.sqrt(l2) : dy/Math.sqrt(l2);
                        
                        // 計算滑鼠投影在延長線方向的長度
                        const vMouseX = nx - startP.x;
                        const vMouseY = ny - startP.y;
                        let newTotalLen = vMouseX * dirX + vMouseY * dirY;
                        
                        const distToH = Math.hypot(H.x - startP.x, H.y - startP.y);
                        // 計算超出垂足的額外長度 (不可短於垂足，避免高懸空)
                        let newOverDist = newTotalLen - distToH;
                        if (newOverDist < 0) newOverDist = 0; 
                        
                        shape.setAttribute('data-ext-over-dist', newOverDist);
                        updateDependentShapes(ownerShape);
                        drawHandles(shape);
                    }
                }
            }
        }
        return;
    }
    if (shape.getAttribute('data-dependency-type') === 'shared_edge_shape') {
        if (index === 'resize') {
             statusText.innerText = "共邊圖形大小受母圖形約束，無法使用右下角縮放。";
             return;
        }
        // 防止使用者拖曳「共邊」的那兩個底點
        if (index === 0 || index === 1) {
            statusText.innerText = "此為共邊底點，受到母圖形約束無法直接移動。請移動母圖形對應的頂點。";
            return;
        }
        
        const edgeIdx = parseInt(shape.getAttribute('data-edge-index'));
        const ownerId = shape.getAttribute('data-owner-shape');
        const owner = document.getElementById(ownerId);
        
        if (owner) {
            const pts = getTransformedPoints(owner);
            if (pts[edgeIdx] && pts[(edgeIdx + 1) % pts.length]) {
                const p1 = pts[edgeIdx];
                const p2 = pts[(edgeIdx + 1) % pts.length];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const l2 = dx*dx + dy*dy;
                
                if (l2 > 0) {
                    const side = parseFloat(shape.getAttribute('data-side')) || 1;
                    const normX = -dy * side;
                    const normY = dx * side;
                    
                    const vX = nx - p1.x;
                    const vY = ny - p1.y;
                    
                    // 克拉瑪法則：反推滑鼠座標在相對空間的 [a, b] 值
                    const a = (vX * normY - vY * normX) / (l2 * side);
                    const b = (dx * vY - dy * vX) / (l2 * side);
                    
                    const relPts = JSON.parse(shape.getAttribute('data-rel-pts') || '[]');
                    if (relPts[index]) {
                        relPts[index] = { x: a, y: b };
                        shape.setAttribute('data-rel-pts', JSON.stringify(relPts));
                        
                        updateDependentShapes(owner); 
                        drawHandles(shape);
                    }
                }
            }
        }
        return;
    }

    let globalTarget = { x: nx, y: ny };
    
    // 【核心修正】只有在 index 是數字(代表真正的頂點)時，才呼叫 applyLocks
    // 防止傳入 'resize' 字串導致計算出 NaN 並繞過安全機制
    if (typeof index === 'number' && (['polygon', 'polyline', 'angle', 'line', 'tri'].includes(tool) || ['rect', 'square'].includes(subTool))) {
         if (typeof window.applyLocks === 'function') {
              globalTarget = window.applyLocks(shape, index, nx, ny);
         }
    }
    nx = globalTarget.x;
    ny = globalTarget.y;
 
     if (tool === 'line' && shape.getAttribute('data-dependency-type') === 'internal_line') {
        const ownerId = shape.getAttribute('data-owner-shape');
        const ownerShape = document.getElementById(ownerId);
        if (ownerShape) {
            const pts = getTransformedPoints(ownerShape);
            let localPt = { x: nx, y: ny };
            try {
                const mInv = shape.getCTM().inverse();
                const p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny;
                const t = p.matrixTransform(mInv); localPt = { x: t.x, y: t.y };
            } catch (e) { return; }

            let bestEdge = -1;
            let bestT = 0;
            let minDist = Infinity;

            // 尋找離滑鼠最近的多邊形邊緣，計算投影位置
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const l2 = dx*dx + dy*dy;
                if (l2 === 0) continue;
                
                let t = ((localPt.x - a.x) * dx + (localPt.y - a.y) * dy) / l2;
                t = Math.max(0, Math.min(1, t)); // 強制鎖在邊緣線段內
                const projX = a.x + t * dx;
                const projY = a.y + t * dy;
                const dist = Math.hypot(localPt.x - projX, localPt.y - projY);
                
                if (dist < minDist) {
                    minDist = dist;
                    bestEdge = i;
                    bestT = t;
                }
            }

            if (bestEdge !== -1) {
                if (index === 0) {
                    shape.setAttribute('data-e1', bestEdge);
                    shape.setAttribute('data-t1', bestT);
                } else if (index === 1) {
                    shape.setAttribute('data-e2', bestEdge);
                    shape.setAttribute('data-t2', bestT);
                }
                updateDependentShapes(ownerShape); // 觸發連動重繪
                drawHandles(shape);
            }
        }
        return;
    }

    if (tool === 'line' && shape.getAttribute('data-dependency-type') === 'base_parallel_line') {
        const ownerId = shape.getAttribute('data-owner-shape');
        const ownerShape = document.getElementById(ownerId);
        if (ownerShape) {
            const pts = getTransformedPoints(ownerShape);
            const edgeIdx = parseInt(shape.getAttribute('data-edge-index'));
            if (!isNaN(edgeIdx) && pts.length === 3) {
                const oppIdx = (edgeIdx + 2) % 3;
                const V = pts[oppIdx];
                const p1 = pts[edgeIdx];
                const p2 = pts[(edgeIdx + 1) % 3];
                
                let localPt = { x: nx, y: ny };
                try {
                    const mInv = shape.getCTM().inverse();
                    const p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny;
                    const t = p.matrixTransform(mInv); localPt = { x: t.x, y: t.y };
                } catch (e) { return; }
                const lx = localPt.x; const ly = localPt.y;

                const baseDx = p2.x - p1.x;
                const baseDy = p2.y - p1.y;
                const baseL2 = baseDx*baseDx + baseDy*baseDy;
                if (baseL2 > 0) {
                    const baseT = ((V.x - p1.x)*baseDx + (V.y - p1.y)*baseDy) / baseL2;
                    const H = { x: p1.x + baseT*baseDx, y: p1.y + baseT*baseDy };
                    
                    const altVx = H.x - V.x;
                    const altVy = H.y - V.y;
                    const altL2 = altVx*altVx + altVy*altVy;
                    if (altL2 > 0) {
                        let t = ((lx - V.x)*altVx + (ly - V.y)*altVy) / altL2;
                        t = Math.max(0, Math.min(1, t)); 
                        shape.setAttribute('data-t', t);
                        updateDependentShapes(ownerShape);
                        drawHandles(shape);
                    }
                }
            }
        }
        return;
    }
	if (index === 'resize') {
        let localPt = { x: nx, y: ny };
        try {
            const mInv = shape.getCTM().inverse();
            let p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny;
            const t = p.matrixTransform(mInv); localPt = { x: t.x, y: t.y };
        } catch (e) { return; }

        let bbox; try { bbox = shape.getBBox(); } catch(e) { return; }
        
        let targetX = localPt.x - 15;
        let targetY = localPt.y - 15;
        
        const minX = bbox.x;
        const minY = bbox.y;
        const curW = bbox.width;
        const curH = bbox.height;
        
        const MIN_SIZE = 10; 
        if (targetX - minX < MIN_SIZE) targetX = minX + MIN_SIZE;
        if (targetY - minY < MIN_SIZE) targetY = minY + MIN_SIZE;
        
        let scaleX = (targetX - minX) / curW;
        let scaleY = (targetY - minY) / curH;
        
        if (curW < 1) scaleX = 1;
        if (curH < 1) scaleY = 1;

        // 【核心修正】如果圖案有鎖定角度，強制等比例縮放！
        if (Object.keys(lAngles).length > 0) {
            let uniformScale = Math.max(scaleX, scaleY);
            scaleX = uniformScale;
            scaleY = uniformScale;
            statusText.innerText = "📐 角度已鎖定，強制等比例縮放";
        }

        const ptsStr = shape.getAttribute('points');
        const pts = parsePoints(ptsStr);
        const newPts = pts.map(p => {
            return `${minX + (p.x - minX) * scaleX},${minY + (p.y - minY) * scaleY}`;
        }).join(' ');
        
        shape.setAttribute('points', newPts);
        drawHandles(shape);
        updateDependentShapes(shape);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
        return;
    }

    let ownerId = shape.getAttribute('data-snapped-to');
    const ownerShape = ownerId ? document.getElementById(ownerId) : null;
    if (ownerShape) {
        const geo = extractGeometry(ownerShape);
        if (geo) {
            let bestSnap = { dist: Infinity, point: null };

            // 線段投影
            geo.segments.forEach(seg => {
                const proj = getProjectionOnSegment(nx, ny, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
                const dist = Math.hypot(nx - proj.x, ny - proj.y);
                if (dist < bestSnap.dist) {
                    bestSnap = { dist, point: proj, type: 'line', t: proj.t };
                }
            });

            // 圓周投影
            geo.circles.forEach(circ => {
                const dx = nx - circ.center.x;
                const dy = ny - circ.center.y;
                const distToCenter = Math.hypot(dx, dy);
                if (distToCenter > 0.1) {
                    const angle = Math.atan2(dy, dx);
                    const pointOnCircle = {
                        x: circ.center.x + circ.r * Math.cos(angle),
                        y: circ.center.y + circ.r * Math.sin(angle)
                    };
                    const dist = Math.hypot(nx - pointOnCircle.x, ny - pointOnCircle.y);
                    if (dist < bestSnap.dist) {
                        bestSnap = { dist, point: pointOnCircle, type: 'circle', angle: angle };
                    }
                }
            });

            if (bestSnap.point) {
                shape.setAttribute('cx', bestSnap.point.x);
                shape.setAttribute('cy', bestSnap.point.y);
                if (bestSnap.type === 'line') {
                    shape.setAttribute('data-snap-t', bestSnap.t);
                    shape.removeAttribute('data-snap-angle');
                } else {
                    shape.setAttribute('data-snap-angle', bestSnap.angle);
                    shape.removeAttribute('data-snap-t');
                }
                drawHandles(shape);
                return; // 吸附點處理完畢，直接返回
            }
        }
    }	
    ownerId = shape.getAttribute('data-owner-circle');
    const ownerCircle = ownerId ? document.getElementById(ownerId) : null;
    if (ownerCircle && shape.classList.contains('linked-polygon')) {
        const m = ownerCircle.getCTM();
        const cx = (parseFloat(ownerCircle.getAttribute('cx')) || 0) * m.a + m.e;
        const cy = (parseFloat(ownerCircle.getAttribute('cy')) || 0) * m.d + m.f;
        const r = (parseFloat(ownerCircle.getAttribute('rx')) || parseFloat(ownerCircle.getAttribute('r')) || 0) * m.a;
        
        const type = shape.getAttribute('data-polygon-type');
        const n = parseInt(shape.getAttribute('data-polygon-sides'));
        
        const dx = nx - cx;
        const dy = ny - cy;
        const newAngle = Math.atan2(dy, dx);
        
        const ptsStr = shape.getAttribute('points');
        const pts = parsePoints(ptsStr);

        if (type === 'inscribed') {
            // 內接：被拖曳的單點，強制吸附在圓周上，不影響其他點
            pts[index] = {
                x: cx + r * Math.cos(newAngle),
                y: cy + r * Math.sin(newAngle)
            };
            shape.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));
        } else if (type === 'circumscribed') {
            // 外切：被拖曳的單點自由移動
            pts[index] = { x: nx, y: ny };
            shape.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));

            // 外切的連動效果：藉由該點距離改變圓的半徑
            const dist = Math.hypot(dx, dy);
            const newRadius = dist * Math.cos(Math.PI / n);
            
            const invM = ownerCircle.getCTM().inverse();
            const newR_local = newRadius * Math.hypot(invM.a, invM.c);
            
            if (ownerCircle.tagName.toLowerCase() === 'circle') ownerCircle.setAttribute('r', newR_local);
            else { ownerCircle.setAttribute('rx', newR_local); ownerCircle.setAttribute('ry', newR_local); }

            // 更新 poly 的 baseR，避免這一次圓的變化引發其他點被錯誤縮放
            shape.setAttribute('data-base-r', newRadius);
        }
        
        // 觸發圓的附屬更新
        updateDependentShapes(ownerCircle);
        drawHandles(shape);
        return; // 單點處理完畢，直接結束
	}
	
    if (subTool === 'axis-chart') {
        let localPt = { x: nx, y: ny };
        try { const mInv = shape.getCTM().inverse(); let p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny; const t = p.matrixTransform(mInv); localPt = { x: t.x, y: t.y }; } catch (e) { return; }
        
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const originX = cx - parseFloat(shape.getAttribute('data-w'))/2;
        const originY = cy + parseFloat(shape.getAttribute('data-h'))/2;

        if (index === 0) { // 調整寬度
            let newW = localPt.x - originX;
            if (newW > 50) {
                shape.setAttribute('data-w', newW);
                shape.setAttribute('data-center-x', originX + newW/2);
            }
        } else if (index === 1) { // 調整高度
            let newH = originY - localPt.y;
            if (newH > 50) {
                shape.setAttribute('data-h', newH);
                shape.setAttribute('data-center-y', originY - newH/2);
            }
        }
        if(typeof redrawAxisChart === 'function') redrawAxisChart(shape);
        drawHandles(shape);
        return;
    }
    if (subTool === 'parabola') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        let a = parseFloat(shape.getAttribute('data-a'));
        let height = parseFloat(shape.getAttribute('data-height'));
        let dir = shape.getAttribute('data-dir') || 'up';
        
        let mInv; try { mInv = shape.getCTM().inverse(); } catch (e) { return; }
        let pMouse = svgCanvas.createSVGPoint(); pMouse.x = nx; pMouse.y = ny;
        const localMouse = pMouse.matrixTransform(mInv);

        if (index === 0) {
            let dx, dy;
            let newAVal, newHeight, newDir = dir;
            
            // 核心修正：根據開口方向計算 dx, dy，並偵測是否跨越原點反轉
            if (dir === 'up' || dir === 'down') {
                dx = Math.abs(localMouse.x - cx);
                dy = localMouse.y - cy;
                if ((dir === 'up' && dy > 0) || (dir === 'down' && dy < 0)) newDir = (dir === 'up' ? 'down' : 'up');
            } else { // left or right
                dx = Math.abs(localMouse.y - cy);
                dy = localMouse.x - cx;
                if ((dir === 'left' && dy > 0) || (dir === 'right' && dy < 0)) newDir = (dir === 'left' ? 'right' : 'left');
            }

            newHeight = Math.abs(dy);
            if (newHeight < 10) newHeight = 10;
            
            newAVal = 0.01;
            if (dx > 5) newAVal = newHeight / (dx * dx);
            
            shape.setAttribute('data-a', newAVal);
            shape.setAttribute('data-height', newHeight);
            shape.setAttribute('data-dir', newDir);
            
            redrawParabola(shape); 
            drawHandles(shape);
        }
        return;
    }

    // --- 新增：不等式拖曳 ---
    if (subTool === 'inequality') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        let dir = parseFloat(shape.getAttribute('data-dir'));
        
        let mInv; try { mInv = shape.getCTM().inverse(); } catch (e) { return; }
        let pMouse = svgCanvas.createSVGPoint(); pMouse.x = nx; pMouse.y = ny;
        const localMouse = pMouse.matrixTransform(mInv);

        const dx = localMouse.x - cx;
        
        // 判斷方向反轉
        if (dx > 0) dir = 1;
        else dir = -1;
        
        let newLen = Math.abs(dx);
        if (newLen < 20) newLen = 20; // 最小長度

        shape.setAttribute('data-dir', dir);
        shape.setAttribute('data-len', newLen);
        
        redrawInequality(shape); drawHandles(shape);
        return;
    }
	
    if (tool === 'blocks') {
        let mInv;
        try { mInv = shape.getCTM().inverse(); } catch (e) { return; }
        let pMouse = svgCanvas.createSVGPoint(); pMouse.x = nx; pMouse.y = ny;
        const localMouse = pMouse.matrixTransform(mInv);
        
        const heights = JSON.parse(shape.getAttribute('data-heights'));
        const oldRows = heights.length;
        const oldCols = heights[0].length;
        const currentSize = parseFloat(shape.getAttribute('data-block-size')) || 35;
        const dx = currentSize * 0.866025;
        const dy = currentSize * 0.5;
        
        // --- 點擊右側黃色圓點：縮放大小 ---
        if (index === 0) {
            const originalX = oldCols * dx;
            const originalY = oldCols * dy;
            const originalDist = Math.hypot(originalX, originalY);
            const newDist = Math.hypot(localMouse.x, localMouse.y);
            
            if (originalDist > 10 && newDist > 10) {
                const scale = newDist / originalDist;
                let newSize = currentSize * scale;
                if (newSize < 10) newSize = 10; // 限制最小尺寸
                
                shape.setAttribute('data-block-size', newSize);
                window.redrawSolidBlocks(shape);
                if (typeof window.updateOrthographicViews === 'function') window.updateOrthographicViews(shape);
                drawHandles(shape);
            }
        } 
        // --- 點擊前方藍色方塊：改變長寬格數 ---
        else if (index === 1) {
            // 利用等角投影的逆運算推導出列數與欄數
            // X = (c - r) * dx
            // Y = (c + r) * dy
            let newCols = Math.round((localMouse.x / dx + localMouse.y / dy) / 2);
            let newRows = Math.round((localMouse.y / dy - localMouse.x / dx) / 2);

            // 限制安全範圍 (最少 1x1，最多 15x15 防卡頓)
            if (newCols < 1) newCols = 1;
            if (newRows < 1) newRows = 1;
            if (newCols > 15) newCols = 15;
            if (newRows > 15) newRows = 15;

            // 只有格數有變才重繪
            if (newCols !== oldCols || newRows !== oldRows) {
                const newHeights = Array(newRows).fill().map(() => Array(newCols).fill(0));
                
                // 保留原有的積木高度
                for (let r = 0; r < Math.min(newRows, oldRows); r++) {
                    for (let c = 0; c < Math.min(newCols, oldCols); c++) {
                        newHeights[r][c] = heights[r][c];
                    }
                }
                
                // 防呆：如果完全沒積木，預設放一塊在 (0,0)
                if (newHeights[0][0] === 0 && oldRows > 0 && oldCols > 0 && heights[0][0] === 0) {
                    // 原本就空的不處理
                } else if (newHeights[0][0] === 0) {
                    newHeights[0][0] = 1;
                }

                shape.setAttribute('data-heights', JSON.stringify(newHeights));
                window.redrawSolidBlocks(shape);
                if (typeof window.updateOrthographicViews === 'function') window.updateOrthographicViews(shape);
                drawHandles(shape);
            }
        }
        return;
	}
    // ==========================================
    // 1. 長度標註 (Dimension) - 控制點拖曳
    // ==========================================
    if (subTool === 'dimension') {
        const p1 = { x: parseFloat(shape.getAttribute('data-p1-x')), y: parseFloat(shape.getAttribute('data-p1-y')) };
        const p2 = { x: parseFloat(shape.getAttribute('data-p2-x')), y: parseFloat(shape.getAttribute('data-p2-y')) };
        
        // 原始連線向量
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx*dx + dy*dy;
        
        if (lenSq > 0.001) {
            let fixedPt, targetPt;
            if (index === 0) { fixedPt = p2; targetPt = p1; } // 動 P1，P2 固定
            else { fixedPt = p1; targetPt = p2; } // 動 P2，P1 固定

            // 投影滑鼠位置到連線上
            const vX = dx; const vY = dy;
            const mX = nx - fixedPt.x; const mY = ny - fixedPt.y;
            const t = (mX * vX + mY * vY) / lenSq;
            
            const newX = fixedPt.x + t * vX;
            const newY = fixedPt.y + t * vY;

            if (index === 0) { p1.x = newX; p1.y = newY; }
            else { p2.x = newX; p2.y = newY; }
            
            // 寫回屬性
            shape.setAttribute('data-p1-x', p1.x); shape.setAttribute('data-p1-y', p1.y);
            shape.setAttribute('data-p2-x', p2.x); shape.setAttribute('data-p2-y', p2.y);
            
            // 立即重繪
            if (typeof renderDimensionVisuals === 'function') {
                renderDimensionVisuals(shape, p1, p2);
            }
            drawHandles(shape);
        }
        return;
    }
	if (subTool === 'tangent-lines') {
        const ctrlPt = shape.querySelector('.vertex-data');
        if (ctrlPt) {
            const mInv = shape.getCTM().inverse();
            const pt = svgCanvas.createSVGPoint();
            pt.x = nx; pt.y = ny;
            const lPt = pt.matrixTransform(mInv);
            ctrlPt.setAttribute('cx', lPt.x);
            ctrlPt.setAttribute('cy', lPt.y);
            
            // 【修復】：切線拖曳時，必須通知「母圓」進行重繪，而不是自己
            const ownerId = shape.getAttribute('data-owner-shape');
            const owner = document.getElementById(ownerId);
            if (owner && typeof updateDependentShapes === 'function') {
                updateDependentShapes(owner); 
            }
            drawHandles(shape);
        }
        return;
    }
    if (tool === 'line' && shape.hasAttribute('data-dependency-type')) {
        const depType = shape.getAttribute('data-dependency-type');
        if (['radius', 'diameter', 'chord'].includes(depType)) {
            const ownerId = shape.getAttribute('data-owner-shape');
            const owner = document.getElementById(ownerId);
            
            if (owner) {
                // 取得圓形目前的幾何資訊
                const m = owner.getCTM();
                const cx = parseFloat(owner.getAttribute('cx')||0) * m.a + m.e;
                const cy = parseFloat(owner.getAttribute('cy')||0) * m.d + m.f;
                
                // 計算滑鼠相對於圓心的距離與角度
                const dx = nx - cx;
                const dy = ny - cy;
                const dist = Math.hypot(dx, dy);
                const newAng = Math.atan2(dy, dx);
                
                if (dist > 0) { // 避免除以零
                    if (depType === 'radius' || depType === 'diameter') {
                        // 【超酷功能恢復】：拉動半徑或直徑時，同步改變圓形大小！
                        let newR = dist / m.a; // 轉換回圓形的內部坐標比例
                        if (newR < 5) newR = 5; // 限制最小半徑
                        
                        // 直接修改圓形屬性
                        if (owner.tagName.toLowerCase() === 'circle') {
                            owner.setAttribute('r', newR);
                        } else {
                            owner.setAttribute('rx', newR);
                            owner.setAttribute('ry', newR);
                        }

                        // 記錄新的角度給線段用
                        if (depType === 'radius') {
                            if (index === 1) shape.setAttribute('data-angle', newAng);
                        } else {
                            shape.setAttribute('data-angle', index === 1 ? newAng : newAng + Math.PI);
                        }
                    } 
                    else if (depType === 'chord') {
                        // 弦的兩端：只改變角度，沿著現有的圓周滑動 (不改變圓大小)
                        if (index === 0) shape.setAttribute('data-angle1', newAng);
                        else shape.setAttribute('data-angle2', newAng);
                    }
                    
                    // 【關鍵機制】：通知「宿主圓形」進行重繪
                    // 圓形一更新，它就會自動把依附在身上的半徑、直徑、弦，用完美的數學公式鎖在邊緣上！
                    if (typeof updateDependentShapes === 'function') {
                        updateDependentShapes(owner);
                    }
                    
                    // 重新畫上橘色控制點
                    drawHandles(shape);
                    
                    // 直接 return，絕對不讓底下的普通線段邏輯搞破壞！
                    return; 
                }
            }
        }
    }
    
    // ==========================================
    // 2. 立體圖形 (Solid)
    // ==========================================
    if (tool === 'solid') {
         let localPt = { x: nx, y: ny };
        try {
            const mInv = shape.getCTM().inverse();
            let p = svgCanvas.createSVGPoint();
            p.x = nx; p.y = ny;
            const t = p.matrixTransform(mInv);
            localPt = { x: t.x, y: t.y };
        } catch (e) { return; }
        const viewMode = shape.getAttribute('data-view-mode') || '3d';
        
        if (subTool === 'solid-cube') {
             const x = parseFloat(shape.getAttribute('data-x'));
             const y = parseFloat(shape.getAttribute('data-y'));
             if (viewMode === '3d') {
                if (index === 0) { 
                    let newW = localPt.x - x; if (newW < 10) newW = 10; shape.setAttribute('data-w', newW);
                } else if (index === 1) { 
                    let newH = localPt.y - y; if (newH < 10) newH = 10; shape.setAttribute('data-h', newH);
                } else if (index === 2) { 
                    const w = parseFloat(shape.getAttribute('data-w'));
                    const newDx = localPt.x - (x + w); const newDy = localPt.y - y;
                    shape.setAttribute('data-dx', newDx); shape.setAttribute('data-dy', newDy);
                    shape.setAttribute('data-d', Math.hypot(newDx, newDy)*2);
                }
             } else {
                 if (index === 0) { let newW = localPt.x - x; if (newW < 10) newW = 10; shape.setAttribute('data-w', newW); }
                 else if (index === 1) { let newH = localPt.y - y; if (newH < 10) newH = 10; shape.setAttribute('data-h', newH); }
                 else if (index === 2) { 
                     let newD = y - localPt.y; if (newD < 10) newD = 10; shape.setAttribute('data-d', newD);
                     const ang = 45 * Math.PI / 180; shape.setAttribute('data-dx', newD * Math.cos(ang) * 0.5); shape.setAttribute('data-dy', -newD * Math.sin(ang) * 0.5);
                 }
             }
        } else if (subTool === 'solid-cylinder') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy')), h = parseFloat(shape.getAttribute('data-h'));
            if (viewMode === '3d') {
                if (index === 0) { const dist = Math.abs(localPt.x - cx); if (dist > 5) shape.setAttribute('data-r', dist); }
                else if (index === 1) { let newH = cy + h - localPt.y; if (newH < 10) newH = 10; shape.setAttribute('data-cy', localPt.y); shape.setAttribute('data-h', newH); }
            } else {
                if (index === 0) { let newR = Math.abs(localPt.x - cx) / Math.PI; if (newR > 5) shape.setAttribute('data-r', newR); }
                else if (index === 1) { 
                    // 【核心修正】展開圖向上拖曳時高度變大
                    let newH = cy - localPt.y; 
                    if (newH < 10) newH = 10; 
                    shape.setAttribute('data-h', newH); 
                }
            }
        } else if (subTool === 'solid-cone') {
             const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy')), r = parseFloat(shape.getAttribute('data-r')), h = parseFloat(shape.getAttribute('data-h'));
             if (viewMode === '3d') {
                if (index === 0) { const dist = Math.abs(localPt.x - cx); if (dist > 5) shape.setAttribute('data-r', dist); }
                else if (index === 1) { let newH = cy + h - localPt.y; if (newH < 10) newH = 10; shape.setAttribute('data-cy', localPt.y); shape.setAttribute('data-h', newH); }
            } else {
                if (index === 0) { let newR = Math.abs(localPt.x - cx); if (newR > 5) shape.setAttribute('data-r', newR); }
                else if (index === 1) { 
                    // 【核心修正】展開圖向上拖曳時高度變大
                    let newS = cy - localPt.y; 
                    if (newS > r) { 
                        let newH = Math.sqrt(newS*newS - r*r); 
                        if(newH<10) newH=10; 
                        shape.setAttribute('data-h', newH); 
                    } 
                }
            }
        } else if (subTool === 'solid-sphere') {
            const cx = parseFloat(shape.getAttribute('data-cx'));
            if (index === 0) { 
                let newR = Math.abs(localPt.x - cx); 
                if (newR > 5) shape.setAttribute('data-r', newR); 
            }
        } else if (subTool === 'solid-pyramid') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
            if (index === 0) { 
                let newW = Math.abs(localPt.x - cx) * 2; 
                if (newW > 10) shape.setAttribute('data-w', newW); 
            } else if (index === 1) { 
                let newH = cy - localPt.y; 
                if (newH > 10) shape.setAttribute('data-h', newH); 
            }
        } else if (subTool === 'solid-prism') {
            const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
            if (index === 0) { // 控制底寬
                let newW = Math.abs(localPt.x - cx) * 2; 
                if (newW > 10) shape.setAttribute('data-w', newW); 
            } else if (index === 1) { // 控制高
                let newH = Math.abs(localPt.y - cy) * 2;
                if (newH > 10) shape.setAttribute('data-h', newH); 
            }
        }
        redrawSolid(shape); drawHandles(shape); updateDependentShapes(shape);
        return;
    }

    // ==========================================
    // 3. 智慧圓形 (Circle Smart)
    // ==========================================
    if (subTool === 'circle-smart') {
         const r = parseFloat(shape.getAttribute('data-radius'));
         const m = shape.getCTM();
         const circleBody = shape.querySelector('.circle-body');
         const internalCx = parseFloat(circleBody.getAttribute('cx')), internalCy = parseFloat(circleBody.getAttribute('cy'));
         let localPt = { x: nx, y: ny };
         try { const mInv = shape.getCTM().inverse(); let p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny; const t = p.matrixTransform(mInv); localPt = { x: t.x, y: t.y }; } catch(e) { return; }
         const dx = localPt.x - internalCx, dy = localPt.y - internalCy;
         const newAngleRad = Math.atan2(dy, dx), newR = Math.sqrt(dx*dx + dy*dy);
         shape.setAttribute('data-radius', newR); shape.setAttribute('data-angle', newAngleRad * 180 / Math.PI); circleBody.setAttribute('r', newR);
         const cos = Math.cos(newAngleRad), sin = Math.sin(newAngleRad);
         const line = shape.querySelector('.circle-line');
         const lineType = shape.getAttribute('data-line-type');
         if (lineType === 'radius') { line.setAttribute('x2', internalCx + newR * cos); line.setAttribute('y2', internalCy + newR * sin); }
         else { line.setAttribute('x1', internalCx - newR * cos); line.setAttribute('y1', internalCy - newR * sin); line.setAttribute('x2', internalCx + newR * cos); line.setAttribute('y2', internalCy + newR * sin); }
         drawHandles(shape); updateDependentShapes(shape);
         return;
    }
    
    // ==========================================
    // 4. 文氏圖 (Venn)
    // ==========================================
    if (subTool === 'venn') {
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const count = parseInt(shape.getAttribute('data-count'));
        let localMousePos = { x: nx, y: ny };
        try {
            const mInv = shape.getCTM().inverse();
            let p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny;
            const t = p.matrixTransform(mInv); localMousePos = { x: t.x, y: t.y };
        } catch (e) { return; }

        if (index === 0) { 
            let circleCenterX, circleCenterY;
            if (count === 2) {
                const d = parseFloat(shape.getAttribute('data-radius')) * (parseFloat(shape.getAttribute('data-spacing-percent')) / 100) * 2;
                circleCenterX = cx - d / 2; circleCenterY = cy;
            } else {
                circleCenterX = cx; const d = parseFloat(shape.getAttribute('data-radius')) * (parseFloat(shape.getAttribute('data-spacing-percent')) / 100) * 2;
                circleCenterY = cy - (d * Math.sqrt(3) / 2) / 2;
            }
            const newR = Math.hypot(localMousePos.x - circleCenterX, localMousePos.y - circleCenterY);
            if (newR > 10) shape.setAttribute('data-radius', newR);
        } else if (index === 1) { 
            const r = parseFloat(shape.getAttribute('data-radius'));
            let d;
            if (count === 2) d = Math.abs(localMousePos.x - (cx - r * (parseFloat(shape.getAttribute('data-spacing-percent'))/100)));
            else { const h = (localMousePos.y > cy) ? (localMousePos.y-cy) : (cy-localMousePos.y); d = (h / (Math.sqrt(3) / 4)); }
            const newSpacingPercent = (d / (2 * r)) * 100;
            if (newSpacingPercent > 0 && newSpacingPercent < 200) shape.setAttribute('data-spacing-percent', newSpacingPercent);
        }
        redrawVennDiagram(shape); drawHandles(shape);    
        return;
    }

    // ==========================================
    // 5. 圓餅圖 (Pie Chart)
    // ==========================================
    if (subTool === 'pie-chart') { 
        let localMousePos = { x: nx, y: ny };
        try { const mInv = shape.getCTM().inverse(); let p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny; const t = p.matrixTransform(mInv); localMousePos = { x: t.x, y: t.y }; } catch (e) { return; }
        const cx = parseFloat(shape.getAttribute('data-center-x'));
        const cy = parseFloat(shape.getAttribute('data-center-y'));
        const valuesAttr = shape.getAttribute('data-values');
        const anglesAttr = shape.getAttribute('data-angles');
        if (!anglesAttr || !valuesAttr) return;
        const values = JSON.parse(valuesAttr);
        const total = values.reduce((a, b) => a + b, 0);
        const dx = localMousePos.x - cx; const dy = localMousePos.y - cy;
        let newAngle = Math.atan2(dy, dx);
        if (newAngle < 0) newAngle += 2 * Math.PI;
        const angles = JSON.parse(anglesAttr);
        const prevAngle = (index > 0) ? angles[index - 1] : 0;
        const nextAngle = (index < angles.length - 1) ? angles[index + 1] : 2 * Math.PI;
        const normalizeAngle = (angle) => (angle + 2 * Math.PI) % (2 * Math.PI);
        let normalizedNewAngle = normalizeAngle(newAngle);
        let normalizedPrevAngle = normalizeAngle(prevAngle);
        let normalizedNextAngle = normalizeAngle(nextAngle);
        if (normalizedPrevAngle > normalizedNextAngle) { normalizedNextAngle += 2 * Math.PI; if (normalizedNewAngle < normalizedPrevAngle) normalizedNewAngle += 2 * Math.PI; }
        if (normalizedNewAngle < normalizedPrevAngle) normalizedNewAngle = normalizedPrevAngle;
        if (normalizedNewAngle > normalizedNextAngle) normalizedNewAngle = normalizedNextAngle;
        newAngle = normalizeAngle(normalizedNewAngle);
        angles[index] = newAngle;
        let lastAng = 0;
        for (let i = 0; i < angles.length; i++) {
            let currentAng = angles[i]; if (currentAng < lastAng) currentAng += 2 * Math.PI; 
            values[i] = (currentAng - lastAng) / (2 * Math.PI) * total;
            lastAng = currentAng;
        }
        shape.setAttribute('data-values', JSON.stringify(values.map(v => parseFloat(v.toFixed(2)))));
        shape.setAttribute('data-angles', JSON.stringify(angles.map(a => parseFloat(a.toFixed(4)))));
        redrawPieChart(shape); drawHandles(shape);
        return;
    }
 
    // ==========================================
    // 6. 圓形角 (Circle Angles) - 支援縮放
    // ==========================================
        if (subTool && subTool.includes('-angle')) {
        const circleId = shape.getAttribute('data-owner-circle-id');
        const ownerCircle = document.getElementById(circleId);
        if (!ownerCircle) return;
        const m = ownerCircle.getCTM();
        const cx = (parseFloat(ownerCircle.getAttribute('cx') || 0)) * m.a + m.e;
        const cy = (parseFloat(ownerCircle.getAttribute('cy') || 0)) * m.d + m.f;
        const r_visual = (parseFloat(ownerCircle.getAttribute('rx')) || parseFloat(ownerCircle.getAttribute('r')) || 0) * m.a;
        
        let groupMatrixInv;
        try { groupMatrixInv = shape.getCTM().inverse(); } catch (e) { return; }
        const dataNodes = shape.querySelectorAll('.vertex-data');
        
        if (subTool === 'tangent-chord-angle') {
            const nodeA = dataNodes[0], nodeP = dataNodes[1], nodeT1 = dataNodes[2], nodeT2 = dataNodes[3];
            if (index === 0) {
                const angle = Math.atan2(ny - cy, nx - cx);
                const newGx = cx + r_visual * Math.cos(angle); 
                const newGy = cy + r_visual * Math.sin(angle);
                let pNew = svgCanvas.createSVGPoint(); pNew.x = newGx; pNew.y = newGy;
                const pLocal = pNew.matrixTransform(groupMatrixInv);
                nodeA.setAttribute('cx', pLocal.x); nodeA.setAttribute('cy', pLocal.y);
            } else if (index === 1) {
                const angle = Math.atan2(ny - cy, nx - cx);
                const newPx = cx + r_visual * Math.cos(angle);
                const newPy = cy + r_visual * Math.sin(angle);
                const tx = -Math.sin(angle), ty = Math.cos(angle);
                const dist1 = 80, dist2 = 80;
                let pNew = svgCanvas.createSVGPoint(); 
                pNew.x = newPx; pNew.y = newPy; let loc = pNew.matrixTransform(groupMatrixInv);
                nodeP.setAttribute('cx', loc.x); nodeP.setAttribute('cy', loc.y);
                pNew.x = newPx + tx * dist1; pNew.y = newPy + ty * dist1; loc = pNew.matrixTransform(groupMatrixInv);
                nodeT1.setAttribute('cx', loc.x); nodeT1.setAttribute('cy', loc.y);
                pNew.x = newPx - tx * dist2; pNew.y = newPy - ty * dist2; loc = pNew.matrixTransform(groupMatrixInv);
                nodeT2.setAttribute('cx', loc.x); nodeT2.setAttribute('cy', loc.y);
            } else if (index === 2 || index === 3) {
                let pP = svgCanvas.createSVGPoint(); 
                pP.x = parseFloat(nodeP.getAttribute('cx')); pP.y = parseFloat(nodeP.getAttribute('cy'));
                const P_global = pP.matrixTransform(shape.getCTM());
                const dx = P_global.x - cx, dy = P_global.y - cy;
                const len = Math.hypot(dx, dy);
                const ux = -dy / len, uy = dx / len;
                const dot = (nx - P_global.x) * ux + (ny - P_global.y) * uy;
                let pNew = svgCanvas.createSVGPoint(); pNew.x = P_global.x + ux * dot; pNew.y = P_global.y + uy * dot;
                const loc = pNew.matrixTransform(groupMatrixInv);
                if (index === 2) { nodeT1.setAttribute('cx', loc.x); nodeT1.setAttribute('cy', loc.y); }
                else { nodeT2.setAttribute('cx', loc.x); nodeT2.setAttribute('cy', loc.y); }
            }
        } 
        else {
            const dist = Math.hypot(nx - cx, ny - cy);
            const newR = dist / m.a; 
            if (ownerCircle.tagName === 'circle') ownerCircle.setAttribute('r', newR);
            else { ownerCircle.setAttribute('rx', newR); ownerCircle.setAttribute('ry', newR); }
            
            // 同步更新母圓的紀錄參數，避免拖曳放開後發生微震
            ownerCircle.setAttribute('data-prev-r', newR);
            ownerCircle.setAttribute('data-prev-cx', cx);
            ownerCircle.setAttribute('data-prev-cy', cy);
            
            dataNodes.forEach(pt => {
                const idx = parseInt(pt.getAttribute('data-index'));
                const oldLx = parseFloat(pt.getAttribute('cx')); 
                const oldLy = parseFloat(pt.getAttribute('cy'));
                let pOld = svgCanvas.createSVGPoint(); pOld.x = oldLx; pOld.y = oldLy;
                const pGlobalOld = pOld.matrixTransform(shape.getCTM());
                
                let angle = Math.atan2(pGlobalOld.y - cy, pGlobalOld.x - cx);
                if (idx === index) angle = Math.atan2(ny - cy, nx - cx);
                
                if (subTool === 'central-angle' && idx === 0) {
                    let pC = svgCanvas.createSVGPoint(); pC.x = cx; pC.y = cy;
                    const pLocalC = pC.matrixTransform(groupMatrixInv);
                    pt.setAttribute('cx', pLocalC.x); pt.setAttribute('cy', pLocalC.y);
                    return;
                }
                const newGx = cx + dist * Math.cos(angle); const newGy = cy + dist * Math.sin(angle);
                let pNew = svgCanvas.createSVGPoint(); pNew.x = newGx; pNew.y = newGy;
                const pLocalNew = pNew.matrixTransform(groupMatrixInv);
                pt.setAttribute('cx', pLocalNew.x); pt.setAttribute('cy', pLocalNew.y);
            });
            
            // 觸發母圓更新其附屬物件 (如連心線、直徑等)
            updateDependentShapes(ownerCircle);
        }

        redrawCircleAngle(shape); drawHandles(shape);
        if (typeof refreshAngleLabels === 'function') refreshAngleLabels(shape);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
        return; 
    }
	
    // ==========================================
    // 7. 通用圖形 (含 Shift 縮放)
    // ==========================================
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
                if (index === 0) { lh = { x: lc.x + rx, y: lc.y }; }
                else if (index === 1) { lh = { x: lc.x, y: lc.y + ry }; } 
                else if (index === 2) { lh = { x: lc.x - rx, y: lc.y }; }
                else { lh = { x: lc.x, y: lc.y - ry }; }
            } 
            else if (tag === 'rect' || tag === 'image') {
                const x = parseFloat(shape.getAttribute('x') || 0);
                const y = parseFloat(shape.getAttribute('y') || 0);
                const w = parseFloat(shape.getAttribute('width') || 0);
                const h = parseFloat(shape.getAttribute('height') || 0);
                lc = { x: x + w/2, y: y + h/2 };
                if (index === 0) lh = { x: x+w, y: y+h };
                else if (index === 1) lh = { x: x, y: y+h };
                else if (index === 2) lh = { x: x+w, y: y };
                else lh = { x: x, y: y };
            } 
            else if (tool === 'line' || tag === 'line') {
                let line = (tag === 'g') ? (shape.querySelector('.visible-line') || shape.querySelector('line')) : shape;
                const x1 = parseFloat(line.getAttribute('x1'));
                const y1 = parseFloat(line.getAttribute('y1'));
                const x2 = parseFloat(line.getAttribute('x2'));
                const y2 = parseFloat(line.getAttribute('y2'));
                lc = { x: (x1+x2)/2, y: (y1+y2)/2 };
                lh = (index === 0) ? { x: x1, y: y1 } : { x: x2, y: y2 };
            } 
            else if (tag === 'polygon' || tag === 'polyline') {
                const ptsStr = shape.getAttribute('points');
                if (ptsStr) {
                    const pts = parsePoints(ptsStr);
                    let sx = 0, sy = 0;
                    pts.forEach(p => { sx += p.x; sy += p.y; });
                    lc = { x: sx/pts.length, y: sy/pts.length };
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
                if (tag === 'circle') {
                    shape.setAttribute('r', rx * scale);
                } else {
                    shape.setAttribute('rx', rx * scale);
                    shape.setAttribute('ry', ry * scale);
                }
            }
            else if (tag === 'rect' || tag === 'image') {
                const w = parseFloat(shape.getAttribute('width'));
                const h = parseFloat(shape.getAttribute('height'));
                const newW = w * scale;
                const newH = h * scale;
                shape.setAttribute('width', newW);
                shape.setAttribute('height', newH);
                shape.setAttribute('x', lc.x - newW/2);
                shape.setAttribute('y', lc.y - newH/2);
            }
            else if (tool === 'line' || tag === 'line') {
                let targetEl = (tag === 'g') ? shape.querySelectorAll('line') : [shape];
                targetEl.forEach(l => {
                    const x1 = parseFloat(l.getAttribute('x1'));
                    const y1 = parseFloat(l.getAttribute('y1'));
                    const x2 = parseFloat(l.getAttribute('x2'));
                    const y2 = parseFloat(l.getAttribute('y2'));
                    l.setAttribute('x1', lc.x + (x1 - lc.x) * scale);
                    l.setAttribute('y1', lc.y + (y1 - lc.y) * scale);
                    l.setAttribute('x2', lc.x + (x2 - lc.x) * scale);
                    l.setAttribute('y2', lc.y + (y2 - lc.y) * scale);
                });
            }
            else if (tag === 'polygon' || tag === 'polyline') {
                const ptsStr = shape.getAttribute('points');
                if (ptsStr) {
                    const pts = parsePoints(ptsStr);
                    const newPts = pts.map(p => ({
                        x: lc.x + (p.x - lc.x) * scale,
                        y: lc.y + (p.y - lc.y) * scale
                    }));
                    shape.setAttribute('points', newPts.map(p => `${p.x},${p.y}`).join(' '));
                }
            }
            updateDependentShapes(shape);
            if (typeof refreshIntersectionAngles === 'function') refreshIntersectionAngles(shape);
            drawHandles(shape); 
            return; 
        } catch(e) { }
    }
	
    const tagName = shape.tagName.toLowerCase();
	if (tool === 'line' && tagName === 'g' && shape.hasAttribute('data-fixed-angle')) {
        const fixedAng = parseFloat(shape.getAttribute('data-fixed-angle'));
        const lineEl = shape.querySelector('line');
        if (isShiftPressed && lineEl) {
            if (index === 1) { 
                const x1 = parseFloat(lineEl.getAttribute('x1')), y1 = parseFloat(lineEl.getAttribute('y1'));
                const dx = nx - x1, dy = ny - y1;
                let projectionLen = dx * Math.cos(fixedAng) + dy * Math.sin(fixedAng);
                if (projectionLen < 10) projectionLen = 10;
                nx = x1 + projectionLen * Math.cos(fixedAng); ny = y1 + projectionLen * Math.sin(fixedAng);
            } else if (index === 0) { 
                const x2 = parseFloat(lineEl.getAttribute('x2')), y2 = parseFloat(lineEl.getAttribute('y2'));
                const dx = nx - x2, dy = ny - y2;
                let projectionLen = dx * Math.cos(fixedAng + Math.PI) + dy * Math.sin(fixedAng + Math.PI);
                if (projectionLen < 10) projectionLen = 10;
                nx = x2 + projectionLen * Math.cos(fixedAng + Math.PI); ny = y2 + projectionLen * Math.sin(fixedAng + Math.PI);
            }
        }
    }

    let localPt = { x: nx, y: ny };
    try {
        const m = shape.getCTM().inverse();
        const p = svgCanvas.createSVGPoint(); p.x = nx; p.y = ny;
        const t = p.matrixTransform(m); localPt = { x: t.x, y: t.y };
    } catch (e) { return; }
    let lx = localPt.x; let ly = localPt.y;
    if (tool === 'line' && shape.getAttribute('data-dependency-type') === 'parallel_line') {
        const l = (tagName === 'g') ? (shape.querySelector('.visible-line') || shape.querySelector('line')) : shape;
        if (l) {
            const ox1 = parseFloat(l.getAttribute('x1'));
            const oy1 = parseFloat(l.getAttribute('y1'));
            const ox2 = parseFloat(l.getAttribute('x2'));
            const oy2 = parseFloat(l.getAttribute('y2'));
            const dx = ox2 - ox1;
            const dy = oy2 - oy1;
            const lenSq = dx * dx + dy * dy;
            
            if (lenSq > 0) {
                // 如果目前是拖動第 0 個點，那第 1 個點就是固定不動的端點，反之亦然
                const fixedX = index === 0 ? ox2 : ox1;
                const fixedY = index === 0 ? oy2 : oy1;
                
                // 利用向量內積將滑鼠位置投影到原來的直線上
                const t = ((lx - fixedX) * dx + (ly - fixedY) * dy) / lenSq;
                
                // 覆寫 lx, ly，強制它只能在該斜率直線上移動
                lx = fixedX + t * dx;
                ly = fixedY + t * dy;
            }
        }
    }
    if (tool === 'line') {
        if (tagName === 'g') {
            const lines = shape.querySelectorAll('line');
            lines.forEach(l => { if (index === 0) { l.setAttribute('x1', lx); l.setAttribute('y1', ly); } else { l.setAttribute('x2', lx); l.setAttribute('y2', ly); } });
        } else {
            if (index === 0) { shape.setAttribute('x1', lx); shape.setAttribute('y1', ly); } else { shape.setAttribute('x2', lx); shape.setAttribute('y2', ly); }
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
                    let p = svgCanvas.createSVGPoint(); p.x = cx_abs; p.y = cy_abs;
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
        const x = parseFloat(shape.getAttribute('x')) || 0;
        const y = parseFloat(shape.getAttribute('y')) || 0;
        const w = parseFloat(shape.getAttribute('width')) || 0;
        const h = parseFloat(shape.getAttribute('height')) || 0;
        
        let anchorX, anchorY;
        if (index === 0) { anchorX = x + w; anchorY = y + h; } 
        else if (index === 1) { anchorX = x; anchorY = y + h; } 
        else if (index === 2) { anchorX = x + w; anchorY = y; } 
        else if (index === 3) { anchorX = x; anchorY = y; }
        
        const newX = Math.min(lx, anchorX); const newY = Math.min(ly, anchorY);
        const newW = Math.abs(lx - anchorX); const newH = Math.abs(ly - anchorY);
        shape.setAttribute('x', newX); shape.setAttribute('y', newY); shape.setAttribute('width', newW); shape.setAttribute('height', newH);
    } else if (tool === 'ellipse' || tool === 'circle') {
        const subTool = shape.getAttribute('data-sub-tool');
        if (['sector', 'arc', 'arch'].includes(subTool)) {
            const cx = +shape.getAttribute('data-center-x');
            const cy = +shape.getAttribute('data-center-y');
            const drawDir = shape.getAttribute('data-draw-dir') || 'left';
            const sweepFlag = (drawDir === 'left') ? 0 : 1;
            const newR = Math.hypot(lx - cx, ly - cy);
            let newAng = Math.atan2(-(ly - cy), lx - cx);
            if (newAng < 0) newAng += 2 * Math.PI;
            let sA = +shape.getAttribute('data-start-angle');
            let eA = +shape.getAttribute('data-end-angle');
            
            // 修改處：現在 index 0 是起點，index 1 是終點
            if (index === 0) sA = newAng; else eA = newAng; 
            
            const startX = cx + newR * Math.cos(sA); const startY = cy - newR * Math.sin(sA);
            const endX = cx + newR * Math.cos(eA); const endY = cy - newR * Math.sin(eA);
            let diff = (sweepFlag === 0) ? (eA - sA) : (sA - eA);
            while (diff < 0) diff += 2 * Math.PI;
            const largeArc = diff > Math.PI ? 1 : 0;
            let d = "";
            if (subTool === 'arc') d = `M ${startX} ${startY} A ${newR} ${newR} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`;
            else if (subTool === 'sector') d = `M ${cx} ${cy} L ${startX} ${startY} A ${newR} ${newR} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
            else if (subTool === 'arch') d = `M ${startX} ${startY} A ${newR} ${newR} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} Z`;
            shape.setAttribute('d', d); shape.setAttribute('data-radius', newR); shape.setAttribute('data-start-angle', sA); shape.setAttribute('data-end-angle', eA);
            // ▲▲▲ 修改結束 ▲▲▲
        } else if (subTool === 'circle') {
            const cx = parseFloat(shape.getAttribute('cx')); 
            const cy = parseFloat(shape.getAttribute('cy'));
            const dist = Math.hypot(lx - cx, ly - cy); // 計算游標到圓心的直線距離
            
            // 🛠️ 修正：如果是真實的 circle 標籤，只能寫入 r，否則寫入 rx, ry
            if (shape.tagName.toLowerCase() === 'circle') {
                shape.setAttribute('r', dist);
                // 清除可能殘留的無效屬性，避免干擾
                shape.removeAttribute('rx');
                shape.removeAttribute('ry');
            } else {
                shape.setAttribute('rx', dist);
                shape.setAttribute('ry', dist);
            }
        } else {
            // 原本的橢圓形邏輯 (保留上下左右四個控制點獨立拉伸)
            const cx = parseFloat(shape.getAttribute('cx')); const cy = parseFloat(shape.getAttribute('cy'));
            const dist = Math.abs((index % 2 === 0) ? (lx - cx) : (ly - cy));
            if (index % 2 === 0) { shape.setAttribute('rx', dist); } 
            else { shape.setAttribute('ry', dist); }
        }
    } else if (tool === 'text' || tool === 'math') {
        const m = shape.getCTM(); 
        const originX = m.e; const originY = m.f;
        if (index === 0) { 
            const newW = nx - originX; const newH = ny - originY;
            if (newW > 30) shape.setAttribute('width', newW); if (newH > 20) shape.setAttribute('height', newH);
            if (typeof autoScaleText === 'function') autoScaleText(shape);
        }
    }
	updateDependentShapes(shape);
	if (typeof refreshIntersectionAngles === 'function') { refreshIntersectionAngles(shape); }
	if (typeof updateLabelPositions === 'function') { updateLabelPositions(shape); }
    if (typeof window.updateLockVisuals === 'function') {
        window.updateLockVisuals(shape);
    }
}

window.updateDependentShapes = function(parentShape, visited = new Set()) {
    if (!parentShape || !parentShape.id) return;
    if (visited.has(parentShape.id)) return; // 防止無窮迴圈
    visited.add(parentShape.id);
	
    const pts = getTransformedPoints(parentShape); 
    const tagName = parentShape.tagName.toLowerCase();
    const tool = parentShape.getAttribute('data-tool');
	const intersectionLinesToUpdate = new Set();
    const cascadeTargets = new Set(); // 【新增】收集需要遞迴更新的附屬圖形
	
    const linkedPolygons = document.querySelectorAll(`.linked-polygon[data-owner-circle="${parentShape.id}"]`);
    if (linkedPolygons.length > 0) {
        const m = parentShape.getCTM();
        const cx = (parseFloat(parentShape.getAttribute('cx')) || 0) * m.a + m.e;
        const cy = (parseFloat(parentShape.getAttribute('cy')) || 0) * m.d + m.f;
        const r = (parseFloat(parentShape.getAttribute('rx')) || parseFloat(parentShape.getAttribute('r')) || 0) * m.a;
        
        linkedPolygons.forEach(poly => {
            const baseCx = parseFloat(poly.getAttribute('data-base-cx')) || cx;
            const baseCy = parseFloat(poly.getAttribute('data-base-cy')) || cy;
            const baseR = parseFloat(poly.getAttribute('data-base-r')) || r;

            const scale = baseR > 0 ? r / baseR : 1;
            const ptsStr = poly.getAttribute('points');
            if (ptsStr) {
                const polyPts = parsePoints(ptsStr);
                const newPts = polyPts.map(p => ({
                    x: cx + (p.x - baseCx) * scale,
                    y: cy + (p.y - baseCy) * scale
                }));
                poly.setAttribute('points', newPts.map(p => `${p.x},${p.y}`).join(' '));
            }
            
            poly.setAttribute('data-base-cx', cx);
            poly.setAttribute('data-base-cy', cy);
            poly.setAttribute('data-base-r', r);
            poly.removeAttribute('transform'); 
            
            cascadeTargets.add(poly); // 【新增】連動標籤
        });
    }
	
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
                child.setAttribute('cx', globalCx); child.setAttribute('cy', globalCy); child.removeAttribute('transform'); 
            } else if (depType === 'center-label') {
                child.setAttribute('x', globalCx - 16); child.setAttribute('y', globalCy + 20); child.removeAttribute('transform');
            }
        });
    }	

    const circleAngles = document.querySelectorAll(`.shape[data-owner-circle-id="${parentShape.id}"]`);
    if (circleAngles.length > 0) {
        let cx, cy, r;
        const m = parentShape.getCTM();
        if (parentShape.getAttribute('data-sub-tool') === 'circle-smart') {
            const body = parentShape.querySelector('.circle-body');
            cx = (parseFloat(body.getAttribute('cx')) || 0) * m.a + m.e;
            cy = (parseFloat(body.getAttribute('cy')) || 0) * m.d + m.f;
            r = (parseFloat(parentShape.getAttribute('data-radius')) || 0) * m.a;
        } else {
            cx = (parseFloat(parentShape.getAttribute('cx')) || 0) * m.a + m.e;
            cy = (parseFloat(parentShape.getAttribute('cy')) || 0) * m.d + m.f;
            r = (parseFloat(parentShape.getAttribute('rx')) || parseFloat(parentShape.getAttribute('r')) || 0) * m.a;
        }

        const prevCx = parseFloat(parentShape.getAttribute('data-prev-cx'));
        const prevCy = parseFloat(parentShape.getAttribute('data-prev-cy'));
        const hasPrev = !isNaN(prevCx) && !isNaN(prevCy);
        
        circleAngles.forEach(group => {
            let groupMatrixInv;
            try { groupMatrixInv = group.getCTM().inverse(); } 
            catch (e) { groupMatrixInv = svgCanvas.createSVGMatrix(); }

            const dataNodes = group.querySelectorAll('.vertex-data');
            const subTool = group.getAttribute('data-sub-tool');

            dataNodes.forEach((node, i) => {
                if (subTool === 'tangent-chord-angle' && (i === 2 || i === 3)) return;

                const oldX = parseFloat(node.getAttribute('cx'));
                const oldY = parseFloat(node.getAttribute('cy'));
                let pOld = svgCanvas.createSVGPoint(); pOld.x = oldX; pOld.y = oldY;
                const pGlobalOld = pOld.matrixTransform(group.getCTM());

                if (subTool === 'central-angle' && i === 0) {
                    let pC = svgCanvas.createSVGPoint(); pC.x = cx; pC.y = cy;
                    const pLocalC = pC.matrixTransform(groupMatrixInv);
                    node.setAttribute('cx', pLocalC.x);
                    node.setAttribute('cy', pLocalC.y);
                } else {
                    const refCx = hasPrev ? prevCx : cx;
                    const refCy = hasPrev ? prevCy : cy;
                    const angle = Math.atan2(pGlobalOld.y - refCy, pGlobalOld.x - refCx);
                    
                    const newGx = cx + r * Math.cos(angle);
                    const newGy = cy + r * Math.sin(angle);
                    
                    let pNew = svgCanvas.createSVGPoint(); pNew.x = newGx; pNew.y = newGy;
                    const pLocalNew = pNew.matrixTransform(groupMatrixInv);
                    node.setAttribute('cx', pLocalNew.x);
                    node.setAttribute('cy', pLocalNew.y);
                }
            });

            if (subTool === 'tangent-chord-angle' && dataNodes.length >= 4) {
                let pP = svgCanvas.createSVGPoint();
                pP.x = parseFloat(dataNodes[1].getAttribute('cx'));
                pP.y = parseFloat(dataNodes[1].getAttribute('cy'));
                const P_global = pP.matrixTransform(group.getCTM());
                
                const vX = P_global.x - cx;
                const vY = P_global.y - cy;
                const len = Math.hypot(vX, vY);
                if (len > 0) {
                    const ux = -vY / len;
                    const uy = vX / len;
                    const ext = 80;
                    
                    let pT = svgCanvas.createSVGPoint();
                    pT.x = P_global.x + ux * ext; pT.y = P_global.y + uy * ext;
                    let T1_local = pT.matrixTransform(groupMatrixInv);
                    dataNodes[2].setAttribute('cx', T1_local.x); dataNodes[2].setAttribute('cy', T1_local.y);
                    
                    pT.x = P_global.x - ux * ext; pT.y = P_global.y - uy * ext;
                    let T2_local = pT.matrixTransform(groupMatrixInv);
                    dataNodes[3].setAttribute('cx', T2_local.x); dataNodes[3].setAttribute('cy', T2_local.y);
                }
            }

            if (typeof redrawCircleAngle === 'function') redrawCircleAngle(group);
            if (typeof updateLabelPositions === 'function') updateLabelPositions(group);
            if (typeof refreshAngleLabels === 'function') refreshAngleLabels(group);
            cascadeTargets.add(group); // 【新增】連動遞迴
        });

        parentShape.setAttribute('data-prev-cx', cx);
        parentShape.setAttribute('data-prev-cy', cy);
    }
	
    if (pts.length === 3 && typeof window.syncTriangleCenters === 'function') {
        window.syncTriangleCenters(parentShape);
    }
	
    if (pts.length >= 2 || tool === 'solid' || tagName === 'ellipse' || tool === 'point') { 
        const dependents = document.querySelectorAll(
            `[data-owner-shape="${parentShape.id}"], ` + 
            `[data-owner="${parentShape.id}"], ` + 
            `[data-tangent-ctrl="${parentShape.id}"], ` +
            `[data-c1-id="${parentShape.id}"], ` +
            `[data-c2-id="${parentShape.id}"], ` +
            `[data-symmetry-axis="${parentShape.id}"]` 
        );
		const sysToUpdate = new Set();
        dependents.forEach(child => {
            const type = child.getAttribute('data-dependency-type');
            if (!type) return;
            
            if (type === 'symmetry_connector') {
                const ownerId = child.getAttribute('data-owner-shape');
                const axisId = child.getAttribute('data-symmetry-axis');
                const ownerEl = document.getElementById(ownerId);
                const axisEl = document.getElementById(axisId);
                const vIdx = parseInt(child.getAttribute('data-vertex-index'));
                
                if (ownerEl && axisEl && !isNaN(vIdx)) {
                    const ownerPts = getTransformedPoints(ownerEl);
                    const axisPts = getTransformedPoints(axisEl);
                    if (ownerPts[vIdx] && axisPts.length >= 2) {
                        const p1 = axisPts[0], p2 = axisPts[1];
                        const axisAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                        
                        const origPt = ownerPts[vIdx];
                        const reflPt = getReflectedPoint(origPt, p1, axisAngle);
                        
                        child.querySelectorAll('line').forEach(l => {
                            l.setAttribute('x1', origPt.x); l.setAttribute('y1', origPt.y);
                            l.setAttribute('x2', reflPt.x); l.setAttribute('y2', reflPt.y);
                        });
                        child.removeAttribute('transform');
                    }
                }
            }
            else if (type === 'symmetry_shape') {
                const ownerId = child.getAttribute('data-owner-shape');
                const axisId = child.getAttribute('data-symmetry-axis');
                const ownerEl = document.getElementById(ownerId);
                const axisEl = document.getElementById(axisId);
                
                if (ownerEl && axisEl) {
                    const axisPts = getTransformedPoints(axisEl);
                    if (axisPts.length >= 2) {
                        const p1 = axisPts[0], p2 = axisPts[1];
                        const axisAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                        const axisDeg = axisAngle * 180 / Math.PI;

                        const cTool = child.getAttribute('data-tool');
                        const cTag = child.tagName.toLowerCase();

                        if (cTag === 'polygon' || cTag === 'polyline' || cTag === 'line' || cTool === 'line' || cTool === 'polygon' || cTool === 'polyline') {
                            const ownerPts = getTransformedPoints(ownerEl);
                            const reflPts = ownerPts.map(p => getReflectedPoint(p, p1, axisAngle));
                            
                            if (cTag === 'line' || cTool === 'line') {
                                if (child.tagName === 'g') {
                                    child.querySelectorAll('line').forEach(l => {
                                        l.setAttribute('x1', reflPts[0].x); l.setAttribute('y1', reflPts[0].y);
                                        l.setAttribute('x2', reflPts[1].x); l.setAttribute('y2', reflPts[1].y);
                                    });
                                } else {
                                    child.setAttribute('x1', reflPts[0].x); child.setAttribute('y1', reflPts[0].y);
                                    child.setAttribute('x2', reflPts[1].x); child.setAttribute('y2', reflPts[1].y);
                                }
                            } else {
                                child.setAttribute('points', reflPts.map(p => `${p.x},${p.y}`).join(' '));
                            }
                            child.removeAttribute('transform');
                        } else {
                            const reflectTransform = `translate(${p1.x}, ${p1.y}) rotate(${axisDeg}) scale(1, -1) rotate(${-axisDeg}) translate(${-p1.x}, ${-p1.y})`;
                            const currentTransform = ownerEl.getAttribute('transform') || '';
                            child.setAttribute('transform', `${reflectTransform} ${currentTransform}`);
                        }
                        
                        // 【新增】將對稱形狀加入遞迴佇列，確保它身上的標註跟著移動
                        cascadeTargets.add(child);
                    }
                }
            }
			else if (type === 'polygon_diagonal') {
                const indices = child.getAttribute('data-vertex-indices');
                if (indices && pts.length > 0) {
                    const[i, j] = indices.split(',').map(Number);
                    if (pts[i] && pts[j]) {
                        const p1 = pts[i];
                        const p2 = pts[j];
                        child.querySelectorAll('line').forEach(l => {
                            l.setAttribute('x1', p1.x); l.setAttribute('y1', p1.y);
                            l.setAttribute('x2', p2.x); l.setAttribute('y2', p2.y);
                        });
                        child.removeAttribute('transform');
                    }
                }
                cascadeTargets.add(child); // 【新增】
            }

            if (type === 'angle_mark') {
                const idx = parseInt(child.getAttribute('data-vertex-index'));
                if (!isNaN(idx) && pts.length > 0 && pts[idx]) {
                    let A, B, C;
                    const tool = parentShape.getAttribute('data-tool');
                    const subTool = parentShape.getAttribute('data-sub-tool');

                    if (subTool === 'central-angle') { B = pts[1]; A = pts[0]; C = pts[2]; }
                    else if (tool === 'angle' || subTool === 'inscribed-angle') { B = pts[1]; A = pts[0]; C = pts[2]; }
                    else if (subTool === 'tangent-chord-angle') {
                        B = pts[1]; A = pts[0];
                        if (pts.length >= 4) {
                            const T1 = pts[2], T2 = pts[3];
                            const vChord = { x: A.x - B.x, y: A.y - B.y };
                            const vT1 = { x: T1.x - B.x, y: T1.y - B.y };
                            C = (vChord.x * vT1.x + vChord.y * vT1.y) > 0 ? T1 : T2;
                        }
                    } else {
                        B = pts[idx]; A = pts[(idx - 1 + pts.length) % pts.length]; C = pts[(idx + 1) % pts.length];
                    }

                    if (A && B && C) {
                        const angBA = Math.atan2(A.y - B.y, A.x - B.x);
                        const angBC = Math.atan2(C.y - B.y, C.x - B.x);
                        let diff = angBC - angBA;
                        while (diff <= -Math.PI) diff += 2 * Math.PI;
                        while (diff > Math.PI) diff -= 2 * Math.PI;
                        
                        const r = parseFloat(child.getAttribute('data-radius-offset')) || 25;
                        const angleType = child.getAttribute('data-angle-type') || 'arc';
                        const textOnlyStyles = ['x', 'o', '1', '2', '3'];

                        if (child.tagName.toLowerCase() === 'text' || child.tagName.toLowerCase() === 'foreignobject') {
                            const deg = Math.round(Math.abs(diff * 180 / Math.PI));
                            const mid = angBA + diff / 2;
                            const textDist = textOnlyStyles.includes(angleType) ? Math.max(12, r * 0.8) : (r + 15);
                            let tx = B.x + textDist * Math.cos(mid);
                            let ty = B.y + textDist * Math.sin(mid);
                            
                            try {
                                const parent = child.parentNode;
                                if (parent && parent.tagName.toLowerCase() === 'g') {
                                    const mInv = parent.getCTM().inverse();
                                    let p = svgCanvas.createSVGPoint(); p.x = tx; p.y = ty;
                                    p = p.matrixTransform(mInv);
                                    tx = p.x; ty = p.y;
                                }
                            } catch(e) {}

                            if (child.tagName.toLowerCase() === 'foreignobject') {
                                child.setAttribute('transform', `translate(${tx - 50}, ${ty - 20})`);
                            } else {
                                child.setAttribute('x', tx);
                                child.setAttribute('y', ty);
                                if (angleType === 'degree') child.textContent = `${deg}°`;
                                child.removeAttribute('transform');
                            }
                        } 
                        else {
                            let d = "";
                            const isRight = (angleType === 'right');
                            const toLocal = (gx, gy) => {
                                try {
                                    const parent = child.parentNode;
                                    if (parent && parent.tagName.toLowerCase() === 'g') {
                                        const mInv = parent.getCTM().inverse();
                                        let p = svgCanvas.createSVGPoint(); p.x = gx; p.y = gy;
                                        p = p.matrixTransform(mInv); return { x: p.x, y: p.y };
                                    }
                                } catch(e) {}
                                return { x: gx, y: gy };
                            };

                            if (isRight) {
                                const s = Math.max(8, r * 0.6);
                                const u1 = { x: Math.cos(angBA), y: Math.sin(angBA) };
                                const u2 = { x: Math.cos(angBC), y: Math.sin(angBC) };
                                const p1 = toLocal(B.x + u1.x * s, B.y + u1.y * s);
                                const p2 = toLocal(B.x + u2.x * s, B.y + u2.y * s);
                                const p3 = toLocal(B.x + u1.x * s + u2.x * s, B.y + u1.y * s + u2.y * s);
                                d = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`;
                            } else {
                                const startA = angBA;
                                const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
                                const sweep = diff > 0 ? 1 : 0;
                                const pS = toLocal(B.x + r * Math.cos(startA), B.y + r * Math.sin(startA));
                                const pE = toLocal(B.x + r * Math.cos(startA + diff), B.y + r * Math.sin(startA + diff));
                                d = `M ${pS.x} ${pS.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${pE.x} ${pE.y}`;
                                
                                if (angleType === 'double-arc') {
                                    const gap = Math.max(3, r * 0.15);
                                    const r2 = r + gap;
                                    const pS2 = toLocal(B.x + r2 * Math.cos(startA), B.y + r2 * Math.sin(startA));
                                    const pE2 = toLocal(B.x + r2 * Math.cos(startA + diff), B.y + r2 * Math.sin(startA + diff));
                                    d += ` M ${pS2.x} ${pS2.y} A ${r2} ${r2} 0 ${largeArc} ${sweep} ${pE2.x} ${pE2.y}`;
                                }
                            }
                            child.setAttribute('d', d);
                            child.removeAttribute('transform');
                        }
                    }
                }
            }
            else if (type === 'perpendicular' && pts.length >= 2) {
                const p1 = pts[0], p2 = pts[1];
                const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    const ux = -dy / len, uy = dx / len;
                    const size = 100;
                    child.querySelectorAll('line').forEach(l => {
                        l.setAttribute('x1', mx - ux * size); l.setAttribute('y1', my - uy * size);
                        l.setAttribute('x2', mx + ux * size); l.setAttribute('y2', my + uy * size);
                    });
                    child.removeAttribute('transform');
                }
            } 
            else if (type === 'divide_line' && pts.length >= 2) {
                const ratio = parseFloat(child.getAttribute('data-divide-ratio'));
                if (!isNaN(ratio)) {
                    const p1 = pts[0], p2 = pts[1];
                    const dx = p2.x - p1.x, dy = p2.y - p1.y;
                    const totalLen = Math.sqrt(dx*dx + dy*dy);
                    const px = p1.x + dx * ratio, py = p1.y + dy * ratio;
                    const ux = dx / totalLen, uy = dy / totalLen;
                    const nx = -uy, ny = ux;
                    const tickSize = 5;
                    child.querySelectorAll('line').forEach(l => {
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
                    const p1 = pts[idx], p2 = pts[(idx + 1) % pts.length];
                    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                    
                    if (child.tagName.toLowerCase() === 'text') {
                        const shouldRotate = child.getAttribute('data-rotate') !== 'false';
                        let rot = shouldRotate ? angle : 0;
                        child.setAttribute("transform", `translate(${mx}, ${my}) rotate(${rot})`);
                    } else {
                        child.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle})`);
                    }
                }
            }
            else if (['radius', 'diameter', 'chord'].includes(type)) {
                const m = parentShape.getCTM();
                const cx = parseFloat(parentShape.getAttribute('cx') || 0) * m.a + m.e;
                const cy = parseFloat(parentShape.getAttribute('cy') || 0) * m.d + m.f;
                const r = parseFloat(parentShape.getAttribute('rx') || parentShape.getAttribute('r') || 0) * m.a;
                
                let np1, np2;
                if (type === 'radius') {
                    const ang = parseFloat(child.getAttribute('data-angle')) || 0;
                    np1 = {x: cx, y: cy};
                    np2 = {x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang)};
                } else if (type === 'diameter') {
                    const ang = parseFloat(child.getAttribute('data-angle')) || 0;
                    np1 = {x: cx - r * Math.cos(ang), y: cy - r * Math.sin(ang)};
                    np2 = {x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang)};
                } else if (type === 'chord') {
                    const a1 = parseFloat(child.getAttribute('data-angle1')) || 0;
                    const a2 = parseFloat(child.getAttribute('data-angle2')) || 0;
                    np1 = {x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1)};
                    np2 = {x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2)};
                }
                
                try {
                    const mInv = child.getCTM().inverse();
                    const toLocal = (p) => {
                        let pt = document.getElementById('svg-canvas').createSVGPoint(); pt.x = p.x; pt.y = p.y;
                        return pt.matrixTransform(mInv);
                    };
                    const lp1 = toLocal(np1);
                    const lp2 = toLocal(np2);
                    child.querySelectorAll('line').forEach(l => {
                        l.setAttribute('x1', lp1.x); l.setAttribute('y1', lp1.y);
                        l.setAttribute('x2', lp2.x); l.setAttribute('y2', lp2.y);
                    });
                    child.removeAttribute('transform');
                } catch(e){}
            }
            else if (type === 'dimension') {
                let idx = parseInt(child.getAttribute('data-edge-index'));
                let p1, p2;
                
                if (idx === -1) {
                    p1 = { x: parseFloat(child.getAttribute('data-p1-x')), y: parseFloat(child.getAttribute('data-p1-y')) };
                    p2 = { x: parseFloat(child.getAttribute('data-p2-x')), y: parseFloat(child.getAttribute('data-p2-y')) };
                } else {
                    let edge = null;
                    let edges = window.getShapeEdges(parentShape);
                    if (!isNaN(idx)) {
                        edge = edges.find(e => e.index === idx);
                    }
                    const sub = parentShape.getAttribute('data-sub-tool');
                    if (!edge && (sub === 'circle' || tool === 'ellipse')) {
                         const m = parentShape.getCTM();
                         const cx = parseFloat(parentShape.getAttribute('cx') || parentShape.getAttribute('data-center-x') || 0) * m.a + m.e;
                         const cy = parseFloat(parentShape.getAttribute('cy') || parentShape.getAttribute('data-center-y') || 0) * m.d + m.f;
                         const r = parseFloat(parentShape.getAttribute('r') || parentShape.getAttribute('rx') || parentShape.getAttribute('data-radius') || 50) * m.a;
                         const fixedAngle = parseFloat(child.getAttribute('data-fixed-angle')) || 0;
                         p1 = { x: cx - r * Math.cos(fixedAngle), y: cy - r * Math.sin(fixedAngle) };
                         p2 = { x: cx + r * Math.cos(fixedAngle), y: cy + r * Math.sin(fixedAngle) };
                    } else if (edge) {
                        p1 = edge.p1;
                        p2 = edge.p2;
                    } else {
                        return; 
                    }
                    
                    child.setAttribute('data-p1-x', p1.x);
                    child.setAttribute('data-p1-y', p1.y);
                    child.setAttribute('data-p2-x', p2.x);
                    child.setAttribute('data-p2-y', p2.y);
                }

                if (typeof renderDimensionVisuals === 'function') {
                    renderDimensionVisuals(child, p1, p2);
                }
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
                        const len = 150;
                        const ex = B.x + len * Math.cos(targetAng);
                        const ey = B.y + len * Math.sin(targetAng);
                        child.querySelectorAll('line').forEach(l => {
                            l.setAttribute('x1', B.x); l.setAttribute('y1', B.y);
                            l.setAttribute('x2', ex); l.setAttribute('y2', ey);
                        });
                        child.removeAttribute('transform');
                    } else if (type === 'angle_division_mark') {
                        const markDist = 28;
                        const mx = B.x + markDist * Math.cos(targetAng);
                        const my = B.y + markDist * Math.sin(targetAng);
                        child.setAttribute('x', mx); child.setAttribute('y', my); child.removeAttribute('transform');
                    }
                }
            }
            else if (type === 'arbitrary_perpendicular') {
                let idx = parseInt(child.getAttribute('data-edge-index'));
                let p1, p2;
                if (idx >= 0 && pts[idx] && pts[(idx + 1) % pts.length]) {
                    p1 = pts[idx]; p2 = pts[(idx + 1) % pts.length];
                } else if (pts.length === 2) {
                    p1 = pts[0]; p2 = pts[1];
                }
                if (p1 && p2) {
                    const t = parseFloat(child.getAttribute('data-t')) || 0.5;
                    const side = parseFloat(child.getAttribute('data-side')) || 1;
                    const lineLen = parseFloat(child.getAttribute('data-len')) || 100;
                    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                    const len = Math.hypot(dx, dy);
                    if (len > 0) {
                        const hx = p1.x + t * dx; const hy = p1.y + t * dy;
                        const nx = -dy / len; const ny = dx / len;
                        const ex = hx + nx * side * lineLen; const ey = hy + ny * side * lineLen;
                        child.querySelectorAll('line').forEach(l => {
                            l.setAttribute('x1', hx); l.setAttribute('y1', hy);
                            l.setAttribute('x2', ex); l.setAttribute('y2', ey);
                        });
                        const mark = child.querySelector('.perp-mark');
                        if (mark) {
                            const size = 12;
                            const pAx = hx + (ex-hx)/lineLen * size; const pAy = hy + (ey-hy)/lineLen * size;
                            const pCx = hx + (dx/len) * size * (t>0.5?-1:1); const pCy = hy + (dy/len) * size * (t>0.5?-1:1);
                            const pBx = pAx + pCx - hx; const pBy = pAy + pCy - hy;
                            mark.setAttribute('points', `${pAx},${pAy} ${pBx},${pBy} ${pCx},${pCy}`);
                        }
                        child.removeAttribute('transform');
                    }
                }
            }
            else if (type === 'parallel_line') {
                let idx = parseInt(child.getAttribute('data-edge-index'));
                let p1, p2;
                if (idx >= 0 && pts[idx] && pts[(idx + 1) % pts.length]) {
                    p1 = pts[idx]; p2 = pts[(idx + 1) % pts.length];
                } else if (pts.length === 2) {
                    p1 = pts[0]; p2 = pts[1];
                }
                if (p1 && p2) {
                    const tOffset = parseFloat(child.getAttribute('data-t')) || 0;
                    const nOffset = parseFloat(child.getAttribute('data-n')) || 50;
                    const pLen = parseFloat(child.getAttribute('data-len')) || 100;
                    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                    const len = Math.hypot(dx, dy);
                    if (len > 0) {
                        const mx = (p1.x + p2.x)/2; const my = (p1.y + p2.y)/2;
                        const ux = dx/len; const uy = dy/len;
                        const nx = -uy; const ny = ux;
                        const cx = mx + tOffset * ux + nOffset * nx;
                        const cy = my + tOffset * uy + nOffset * ny;
                        const x1 = cx - (pLen/2)*ux; const y1 = cy - (pLen/2)*uy;
                        const x2 = cx + (pLen/2)*ux; const y2 = cy + (pLen/2)*uy;
                        child.querySelectorAll('line').forEach(l => {
                            l.setAttribute('x1', x1); l.setAttribute('y1', y1);
                            l.setAttribute('x2', x2); l.setAttribute('y2', y2);
                        });
                        child.removeAttribute('transform');
                    }
                }
                cascadeTargets.add(child); // 【新增】平移線可能也有標註
            }
            else if (type === 'median_line') {
                let sX, sY;
                const vIdx = parseInt(child.getAttribute('data-start-vertex-index'));
                if (!isNaN(vIdx) && pts[vIdx]) {
                    sX = pts[vIdx].x; sY = pts[vIdx].y;
                } else {
                    sX = parseFloat(child.getAttribute('data-start-x')); sY = parseFloat(child.getAttribute('data-start-y'));
                }
                let idx = parseInt(child.getAttribute('data-edge-index'));
                let p1, p2;
                if (idx >= 0 && pts[idx] && pts[(idx + 1) % pts.length]) {
                    p1 = pts[idx]; p2 = pts[(idx + 1) % pts.length];
                } else if (pts.length === 2) {
                    p1 = pts[0]; p2 = pts[1];
                }
                if (p1 && p2 && !isNaN(sX) && !isNaN(sY)) {
                    const mx = (p1.x + p2.x)/2; const my = (p1.y + p2.y)/2;
                    child.querySelectorAll('line').forEach(l => {
                        l.setAttribute('x1', sX); l.setAttribute('y1', sY);
                        l.setAttribute('x2', mx); l.setAttribute('y2', my);
                    });
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                    const ticks = child.querySelectorAll('g');
                    if (ticks.length >= 2) {
                        ticks[0].setAttribute('transform', `translate(${(p1.x+mx)/2}, ${(p1.y+my)/2}) rotate(${angle})`);
                        ticks[1].setAttribute('transform', `translate(${(mx+p2.x)/2}, ${(my+p2.y)/2}) rotate(${angle})`);
                    }
                    child.removeAttribute('transform');
                }
            } 
            else if (type === 'shared_edge_shape') {
                const edgeIdx = parseInt(child.getAttribute('data-edge-index'));
                if (!isNaN(edgeIdx) && pts[edgeIdx] && pts[(edgeIdx + 1) % pts.length]) {
                    const p1 = pts[edgeIdx];
                    const p2 = pts[(edgeIdx + 1) % pts.length];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    
                    const side = parseFloat(child.getAttribute('data-side')) || 1;
                    const nx = -dy * side;
                    const ny = dx * side;
                    
                    const relPts = JSON.parse(child.getAttribute('data-rel-pts') || '[]');
                    
                    const newPts = relPts.map(rel => {
                        return {
                            x: p1.x + rel.x * dx + rel.y * nx,
                            y: p1.y + rel.x * dy + rel.y * ny
                        };
                    });
                    
                    child.setAttribute('points', newPts.map(p => `${p.x},${p.y}`).join(' '));
                    child.removeAttribute('transform');
                }
                cascadeTargets.add(child);
            }
            else if (type === 'shared_edge_arch') {
                const edgeIdx = parseInt(child.getAttribute('data-edge-index'));
                if (!isNaN(edgeIdx) && pts[edgeIdx] && pts[(edgeIdx + 1) % pts.length]) {
                    const p1 = pts[edgeIdx];
                    const p2 = pts[(edgeIdx + 1) % pts.length];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const side = parseFloat(child.getAttribute('data-side')) || 1;
                    
                    const mx = (p1.x + p2.x) / 2;
                    const my = (p1.y + p2.y) / 2;
                    const r = Math.hypot(dx, dy) / 2;
                    
                    let sA = Math.atan2(-dy, dx);
                    if (sA < 0) sA += 2*Math.PI;
                    
                    let startAng = side === 1 ? sA : sA + Math.PI;
                    let endAng = side === 1 ? sA + Math.PI : sA + 2*Math.PI;
                    
                    const path = child.querySelector('.visible-line') || child;
                    
                    const pStart = { x: mx + r * Math.cos(startAng), y: my - r * Math.sin(startAng) };
                    const pEnd = { x: mx + r * Math.cos(endAng), y: my - r * Math.sin(endAng) };
                    
                    // 【核心修復】：讓 sweep-flag 隨 side 改變，保證圓弧始終向外凸
                    const sweepFlag = side === 1 ? 1 : 0;
                    const d = `M ${pStart.x} ${pStart.y} A ${r} ${r} 0 0 ${sweepFlag} ${pEnd.x} ${pEnd.y} Z`;
                    
                    path.setAttribute('d', d);
                    
                    child.setAttribute('data-center-x', mx);
                    child.setAttribute('data-center-y', my);
                    child.setAttribute('data-radius', r);
                    child.setAttribute('data-start-angle', startAng);
                    child.setAttribute('data-end-angle', endAng);
                    child.setAttribute('data-draw-dir', sweepFlag === 1 ? 'right' : 'left'); // 同步屬性供標籤與萃取系統讀取
                    child.removeAttribute('transform');
                }
                cascadeTargets.add(child);
            }			
			else if (type === 'altitude') {
                let idx = parseInt(child.getAttribute('data-edge-index'));
                let vIdx = parseInt(child.getAttribute('data-vertex-index'));
                if (!isNaN(idx) && pts.length >= 3 && pts[idx]) {
                    if (isNaN(vIdx)) vIdx = (idx + 2) % pts.length;
                    
                    const V = pts[vIdx];
                    const p1 = pts[idx];
                    const p2 = pts[(idx + 1) % pts.length];

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const l2 = dx*dx + dy*dy;
                    
                    if (l2 > 0) {
                        const t = ((V.x - p1.x) * dx + (V.y - p1.y) * dy) / l2;
                        const H = { x: p1.x + t * dx, y: p1.y + t * dy };

                        child.querySelectorAll('.visible-line, .hit-line').forEach(l => {
                            l.setAttribute('x1', V.x); l.setAttribute('y1', V.y);
                            l.setAttribute('x2', H.x); l.setAttribute('y2', H.y);
                        });

                        // --- 全新邏輯：建立與更新獨立的「延長線物件」 ---
                        let extGroup = document.querySelector(`g[data-owner-shape="${parentShape.id}"][data-dependency-type="altitude_extension"][data-altitude-id="${child.id}"]`);
                        
                        if (t < 0 || t > 1) {
                            if (!extGroup) {
                                extGroup = document.createElementNS(ns, "g");
                                extGroup.setAttribute('class', 'shape group');
                                extGroup.setAttribute('data-tool', 'line');
                                extGroup.id = 'alt-ext-' + Date.now() + Math.random().toString(36).substr(2,5);
                                extGroup.setAttribute('data-owner-shape', parentShape.id);
                                extGroup.setAttribute('data-dependency-type', 'altitude_extension');
                                extGroup.setAttribute('data-altitude-id', child.id);
                                extGroup.setAttribute('data-edge-index', idx);
                                extGroup.setAttribute('data-vertex-index', vIdx);
                                
                                const hl = document.createElementNS(ns, "line");
                                hl.setAttribute('class', 'hit-line');
                                hl.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
                                
                                const vl = document.createElementNS(ns, "line");
                                vl.setAttribute('class', 'visible-line');
                                vl.style.cssText = "stroke:#7f8c8d; stroke-width:1.5; stroke-dasharray:5,3; pointer-events:none;";
                                
                                extGroup.appendChild(hl);
                                extGroup.appendChild(vl);
                                child.parentNode.insertBefore(extGroup, child);
                                cascadeTargets.add(extGroup);
                            }
                            
                            extGroup.style.display = '';
                            const startP = t < 0 ? p1 : p2;
                            
                            // 讀取自訂的額外延長距離 (預設 20px)
                            let overDist = parseFloat(extGroup.getAttribute('data-ext-over-dist'));
                            if (isNaN(overDist)) overDist = 20; 
                            
                            const dirX = t < 0 ? -dx/Math.sqrt(l2) : dx/Math.sqrt(l2);
                            const dirY = t < 0 ? -dy/Math.sqrt(l2) : dy/Math.sqrt(l2);
                            const distToH = Math.hypot(H.x - startP.x, H.y - startP.y);
                            const totalLen = distToH + overDist;
                            
                            const endP = { x: startP.x + dirX * totalLen, y: startP.y + dirY * totalLen };
                            
                            extGroup.querySelectorAll('line').forEach(l => {
                                l.setAttribute('x1', startP.x); l.setAttribute('y1', startP.y);
                                l.setAttribute('x2', endP.x); l.setAttribute('y2', endP.y);
                            });
                            extGroup.removeAttribute('transform');
                        } else if (extGroup) {
                            // 如果變回銳角三角形，隱藏延長線
                            extGroup.style.display = 'none';
                        }
                        // --- 獨立延長線邏輯結束 ---

                        const mark = child.querySelector('.right-angle-mark');
                        if (mark) {
                            const size = 10;
                            const lenEdge = Math.sqrt(l2);
                            const lenAlt = Math.hypot(V.x - H.x, V.y - H.y);
                            if (lenEdge > 0 && lenAlt > 0) {
                                let dirEdgeX = dx / lenEdge;
                                let dirEdgeY = dy / lenEdge;
                                if (t > 0.5) { dirEdgeX = -dirEdgeX; dirEdgeY = -dirEdgeY; } 

                                const uAlt = { x: (V.x - H.x)/lenAlt, y: (V.y - H.y)/lenAlt };
                                const m1 = { x: H.x + dirEdgeX * size, y: H.y + dirEdgeY * size };
                                const m2 = { x: H.x + uAlt.x * size, y: H.y + uAlt.y * size };
                                const m3 = { x: m1.x + m2.x - H.x, y: m1.y + m2.y - H.y };
                                mark.setAttribute('points', `${m1.x},${m1.y} ${m3.x},${m3.y} ${m2.x},${m2.y}`);
                            }
                        }
                        child.removeAttribute('transform');
                    }
                }
                cascadeTargets.add(child); 
            }
			else if (type === 'base_parallel_line') {
                let idx = parseInt(child.getAttribute('data-edge-index'));
                if (!isNaN(idx) && pts.length === 3 && pts[idx]) {
                    const oppIdx = (idx + 2) % 3;
                    const V = pts[oppIdx];
                    const p1 = pts[idx];
                    const p2 = pts[(idx + 1) % 3];
                    const t = parseFloat(child.getAttribute('data-t'));
                    const actualT = isNaN(t) ? 0.5 : t;
                    
                    const m1 = { x: V.x + actualT * (p1.x - V.x), y: V.y + actualT * (p1.y - V.y) };
                    const m2 = { x: V.x + actualT * (p2.x - V.x), y: V.y + actualT * (p2.y - V.y) };
                    
                    child.querySelectorAll('line').forEach(l => {
                        l.setAttribute('x1', m1.x); l.setAttribute('y1', m1.y);
                        l.setAttribute('x2', m2.x); l.setAttribute('y2', m2.y);
                    });
                    child.removeAttribute('transform');
                }
                cascadeTargets.add(child); // 【新增】
            }			
            else if (type === 'polyline_point') {
                const vIdx = parseInt(child.getAttribute('data-vertex-index'));
                if (!isNaN(vIdx) && pts[vIdx]) {
                    child.setAttribute('cx', pts[vIdx].x);
                    child.setAttribute('cy', pts[vIdx].y);
                    child.removeAttribute('transform'); 
                }
            } 
            else if (type === 'extension_line' && pts.length >= 3) {
                let idx = parseInt(child.getAttribute('data-edge-index'));
                let state = parseInt(child.getAttribute('data-ext-state') || '0'); 
                if (!isNaN(idx) && pts[idx]) {
                    const p1 = pts[idx];
                    const p2 = pts[(idx + 1) % pts.length];
                    const p3 = pts[(idx + 2) % pts.length]; 
                    
                    let ex, ey, startP;
                    const extLen = 100; 
                    
                    if (state === 0) {
                        const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                        const len = Math.hypot(dx, dy);
                        ex = p2.x + (dx / len) * extLen;
                        ey = p2.y + (dy / len) * extLen;
                        startP = p2;
                    } else {
                        const dx = p2.x - p3.x; const dy = p2.y - p3.y;
                        const len = Math.hypot(dx, dy);
                        ex = p2.x + (dx / len) * extLen;
                        ey = p2.y + (dy / len) * extLen;
                        startP = p2;
                    }
                    
                    child.querySelectorAll('line').forEach(l => {
                        l.setAttribute('x1', startP.x); l.setAttribute('y1', startP.y);
                        l.setAttribute('x2', ex); l.setAttribute('y2', ey);
                    });
                    child.removeAttribute('transform');

                    if (typeof refreshIntersectionAngles === 'function') {
                        refreshIntersectionAngles(child);
                    }
                }
			}
            else if (type === 'tangent_on_circle_ctrl') {
                const angle = parseFloat(child.getAttribute('data-angle'));
                const m = parentShape.getCTM();
                const cx = (parseFloat(parentShape.getAttribute('cx') || 0)) * m.a + m.e;
                const cy = (parseFloat(parentShape.getAttribute('cy') || 0)) * m.d + m.f;
                const r = (parseFloat(parentShape.getAttribute('rx') || parentShape.getAttribute('r')) || 0) * m.a;
                child.setAttribute('cx', cx + r * Math.cos(angle));
                child.setAttribute('cy', cy + r * Math.sin(angle));
            }
            else if (type.startsWith('tangent_on_circle_')) {
                const ctrlId = child.getAttribute('data-tangent-ctrl');
                const ctrlPt = document.getElementById(ctrlId);
                if (ctrlPt) {
                    const m = parentShape.getCTM();
                    const cx = (parseFloat(parentShape.getAttribute('cx') || 0)) * m.a + m.e;
                    const cy = (parseFloat(parentShape.getAttribute('cy') || 0)) * m.d + m.f;
                    const px = parseFloat(ctrlPt.getAttribute('cx'));
                    const py = parseFloat(ctrlPt.getAttribute('cy'));
                    
                    const dx = px - cx;
                    const dy = py - cy;
                    const len = Math.hypot(dx, dy);
                    
                    if (len > 0) {
                        const ux = dx / len;
                        const uy = dy / len;
                        const tx = -uy;
                        const ty = ux;
                        
                        if (type === 'tangent_on_circle_radius') {
                            child.querySelectorAll('line').forEach(l => {
                                l.setAttribute('x1', cx); l.setAttribute('y1', cy);
                                l.setAttribute('x2', px); l.setAttribute('y2', py);
                            });
                            child.removeAttribute('transform');
                        }
                        else if (type === 'tangent_on_circle_line') {
                            const ext = 120; 
                            child.querySelectorAll('line').forEach(l => {
                                l.setAttribute('x1', px + tx * ext); l.setAttribute('y1', py + ty * ext);
                                l.setAttribute('x2', px - tx * ext); l.setAttribute('y2', py - ty * ext);
                            });
                            child.removeAttribute('transform');
                            cascadeTargets.add(child); // 【新增】切線也可能被加上附屬物件
                        }
                        else if (type === 'tangent_on_circle_mark') {
                            const size = 12;
                            const m1 = { x: px - ux * size, y: py - uy * size };
                            const m2 = { x: px + tx * size, y: py + ty * size };
                            const m3 = { x: m1.x + m2.x - px, y: m1.y + m2.y - py };
                            child.setAttribute('d', `M ${m1.x} ${m1.y} L ${m3.x} ${m3.y} L ${m2.x} ${m2.y}`);
                            child.removeAttribute('transform');
                        }
                    }
                }
            }
			else if (type.startsWith('tangent_')) {
                const ctrlId = child.getAttribute('data-tangent-ctrl');
                const ownerId = child.getAttribute('data-owner-shape');
                const index = parseInt(child.getAttribute('data-tangent-index'));
                
                const ctrlPt = document.getElementById(ctrlId);
                const owner = document.getElementById(ownerId);

                if (ctrlPt && owner) {
                    const m = owner.getCTM();
                    const cx = (parseFloat(owner.getAttribute('cx') || 0)) * m.a + m.e;
                    const cy = (parseFloat(owner.getAttribute('cy') || 0)) * m.d + m.f;
                    const r = (parseFloat(owner.getAttribute('rx') || owner.getAttribute('r')) || 0) * m.a;

                    const pm = ctrlPt.getCTM();
                    const px = (parseFloat(ctrlPt.getAttribute('cx') || 0)) * pm.a + pm.e;
                    const py = (parseFloat(ctrlPt.getAttribute('cy') || 0)) * pm.d + pm.f;

                    let tangents = null;
                    if (typeof getTangentPoints === 'function') {
                        tangents = getTangentPoints(cx, cy, r, px, py);
                    }

                    if (tangents) {
                        if (type === 'tangent_line_segment') {
                            const targetT = (index === 1) ? tangents.t1 : tangents.t2;
                            child.querySelectorAll('line').forEach(l => {
                                l.setAttribute('x1', px); l.setAttribute('y1', py);
                                l.setAttribute('x2', targetT.x); l.setAttribute('y2', targetT.y);
                            });
                            child.removeAttribute('transform');
                            cascadeTargets.add(child); // 【新增】
                        }
                        else if (type === 'tangent_po_line') {
                            child.querySelectorAll('line').forEach(l => {
                                l.setAttribute('x1', px); l.setAttribute('y1', py);
                                l.setAttribute('x2', cx); l.setAttribute('y2', cy);
                            });
                            child.removeAttribute('transform');
                        }
                        else if (type === 'tangent_radius') {
                            const targetT = (index === 1) ? tangents.t1 : tangents.t2;
                            child.querySelectorAll('line').forEach(l => {
                                l.setAttribute('x1', cx); l.setAttribute('y1', cy);
                                l.setAttribute('x2', targetT.x); l.setAttribute('y2', targetT.y);
                            });
                            child.removeAttribute('transform');
                        }
                        else if (type === 'tangent_right_angle') {
                            const targetT = (index === 1) ? tangents.t1 : tangents.t2;
                            const vTP = { x: px - targetT.x, y: py - targetT.y };
                            const vTO = { x: cx - targetT.x, y: cy - targetT.y };
                            const lenTP = Math.hypot(vTP.x, vTP.y);
                            const lenTO = Math.hypot(vTO.x, vTO.y);
                            
                            if (lenTP > 0 && lenTO > 0) {
                                const size = 12; 
                                const u1 = { x: vTP.x / lenTP, y: vTP.y / lenTP };
                                const u2 = { x: vTO.x / lenTO, y: vTO.y / lenTO };
                                const p1 = { x: targetT.x + u1.x * size, y: targetT.y + u1.y * size };
                                const p2 = { x: targetT.x + u2.x * size, y: targetT.y + u2.y * size };
                                const p3 = { x: p1.x + p2.x - targetT.x, y: p1.y + p2.y - targetT.y }; 
                                const d = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`;
                                child.setAttribute('d', d);
                                child.removeAttribute('transform');
                            }
                        }
                    }
                }
            }
            if (type === 'internal_line') {
                const e1 = parseInt(child.getAttribute('data-e1'));
                const t1 = parseFloat(child.getAttribute('data-t1'));
                const e2 = parseInt(child.getAttribute('data-e2'));
                const t2 = parseFloat(child.getAttribute('data-t2'));

                if (!isNaN(e1) && !isNaN(t1) && !isNaN(e2) && !isNaN(t2) && pts.length > Math.max(e1, e2)) {
                    const p1_a = pts[e1];
                    const p1_b = pts[(e1 + 1) % pts.length];
                    const p2_a = pts[e2];
                    const p2_b = pts[(e2 + 1) % pts.length];

                    const nx1 = p1_a.x + t1 * (p1_b.x - p1_a.x);
                    const ny1 = p1_a.y + t1 * (p1_b.y - p1_a.y);
                    const nx2 = p2_a.x + t2 * (p2_b.x - p2_a.x);
                    const ny2 = p2_a.y + t2 * (p2_b.y - p2_a.y);

                    child.querySelectorAll('line').forEach(l => {
                        l.setAttribute('x1', nx1); l.setAttribute('y1', ny1);
                        l.setAttribute('x2', nx2); l.setAttribute('y2', ny2);
                    });
                    child.removeAttribute('transform');
                }
                cascadeTargets.add(child); // 【新增】
            }
		
            if (typeof updateLabelPositions === 'function') {
                updateLabelPositions(child);
            }		
            if (type === 'common_tangent') {
                sysToUpdate.add(child.getAttribute('data-system-id'));
            }			
            
            // 【修復 Bug：全面支援附屬圖形的交點角標連動】
            // 取代原本寫死的清單，只要該附屬物件具備「線段或邊緣」(如對稱圖、對角線、輔助線)，
            // 就強制加入交點角標的重繪佇列，確保它身上的標註能跟著母圖連動！
            const cTool = child.getAttribute('data-tool');
            const cTag = child.tagName.toLowerCase();
            if (['line', 'polyline', 'polygon', 'rect', 'tri', 'angle'].includes(cTool) || ['line', 'polyline', 'polygon'].includes(cTag)) {
                intersectionLinesToUpdate.add(child);
            }	
        });
        
        sysToUpdate.forEach(sysId => {
            if (typeof window.redrawCommonTangentSystem === 'function') {
                window.redrawCommonTangentSystem(sysId);
            }
        });
        intersectionLinesToUpdate.forEach(line => {
            if (typeof refreshIntersectionAngles === 'function') {
                refreshIntersectionAngles(line);
            }
        });
    }
	
    if (tool === 'solid') {
        const nets = document.querySelectorAll(`g[data-owner-solid="${parentShape.id}"]`);
        nets.forEach(net => {
            const attrs =['data-w', 'data-h', 'data-d', 'data-dx', 'data-dy', 'data-r'];
            attrs.forEach(attr => {
                if (parentShape.hasAttribute(attr)) {
                    net.setAttribute(attr, parentShape.getAttribute(attr));
                }
            });
            if (typeof redrawSolid === 'function') redrawSolid(net);
        });
    }	
    
    // 【核心修復】遞迴觸發孫代物件的更新 (例如對稱圖形身上的角標，或是輔助線上的長度標註)
    cascadeTargets.forEach(child => {
        if (typeof refreshAngleLabels === 'function') refreshAngleLabels(child);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(child);
        updateDependentShapes(child, visited);
    });
};

function toggleDrawTool(toolName) {
    if (mode === 'draw' && currentTool === toolName) {
        // 如果再次點擊目前的工具，則關閉並回到選取模式
        setMode('select');
    } else {
        // 否則啟用該工具，並強制開啟連續繪圖模式
        setMode('draw', toolName);
        isContinuousDraw = true;
        
        // 更新按鈕高亮 UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            if (['btn-toggle-grid', 'btn-snap-intersection', 'btn-snap-point', 'btn-real-grid', 'btn-lock-geom'].includes(btn.id)) return;
            btn.classList.remove('active');
        });
        document.getElementById(`btn-${toolName}`).classList.add('active');
        
        const toolLabel = toolName === 'pen' ? '寫字筆 (平滑)' : '手繪 (原始)';
        statusText.innerText = `已啟用 ${toolLabel}，再次點擊按鈕可關閉。`;
    }
}

window.closeWelcomeTour = function() {
    const isChecked = document.getElementById('chk-hide-welcome').checked;
    if (isChecked) {
        localStorage.setItem('math_editor_hide_welcome', 'true');
    }
    document.getElementById('welcome-modal').style.display = 'none';
    document.getElementById('tour-spotlight').style.display = 'none';
    document.getElementById('tour-arrow').style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const hideWelcome = localStorage.getItem('math_editor_hide_welcome');
        if (hideWelcome !== 'true') {
            window.startTour();
        }
    }, 1000);
    function bindPanelDrag(panelId, headerId) {
        const header = document.getElementById(headerId);
        const panel = document.getElementById(panelId);
        if (!header || !panel) return;

        let isDraggingPanel = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener('mousedown', (e) => {
            isDraggingPanel = true;
            const rect = panel.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDraggingPanel) return;
            let newL = e.clientX - dragOffsetX;
            let newT = e.clientY - dragOffsetY;
            
            if (newL < 0) newL = 0;
            if (newT < 0) newT = 0;
            if (newL + panel.offsetWidth > window.innerWidth) newL = window.innerWidth - panel.offsetWidth;
            if (newT + panel.offsetHeight > window.innerHeight) newT = window.innerHeight - panel.offsetHeight;

            panel.style.left = newL + 'px';
            panel.style.top = newT + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDraggingPanel = false;
        });
    }

    // 綁定兩個新的面板
    bindPanelDrag('text-helper-panel', 'text-helper-header');
    bindPanelDrag('math-helper-panel', 'math-helper-header');
});
// ======================================================================
// 【新增】觸控螢幕支援層 (Touch to Mouse Event Translation Layer)
// 包含：長按觸發右鍵、雙擊編輯、雙指縮放
// ======================================================================

let touchTimer = null;
let lastTapTime = 0;
let lastPinchDist = null;
let touchStartX = 0;
let touchStartY = 0;
let isLongPress = false;

// 取得兩點之間的距離 (用於雙指縮放)
function getPinchDistance(touches) {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

// 將 Touch 事件封裝成 MouseEvent 分發出去，騙過原有的系統
function dispatchSyntheticMouse(type, touch, button = 0) {
    const target = document.elementFromPoint(touch.clientX, touch.clientY) || touch.target;
    const mouseEvent = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        button: button,
        buttons: button === 0 ? 1 : (button === 2 ? 2 : 0),
        shiftKey: window.vkShiftActive // 注入虛擬鍵盤的 Shift 狀態
    });
    target.dispatchEvent(mouseEvent);
}

// 1. Touch Start (模擬 mousedown、判斷雙擊、啟動長按計時)
svgCanvas.addEventListener('touchstart', function(e) {
    // 雙指操作 (準備縮放)
    if (e.touches.length === 2) {
        e.preventDefault();
        clearTimeout(touchTimer);
        lastPinchDist = getPinchDistance(e.touches);
        return;
    }

    // 單指操作
    if (e.touches.length === 1) {
        // 阻止預設行為 (避免滑動螢幕)，但保證操作的是畫布或圖形
        if (e.target === svgCanvas || e.target.closest('.shape')) {
            e.preventDefault(); 
        }

        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isLongPress = false;

        // 偵測雙擊 (Double Tap) - 300 毫秒內
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
			preventNextClick = true;
            dispatchSyntheticMouse('dblclick', touch);
            lastTapTime = 0; // 重置
            return; // 觸發雙擊就跳過普通的 mousedown，避免干擾
        }
        lastTapTime = currentTime;

        // 設定長按計時器 (500 毫秒觸發右鍵)
        touchTimer = setTimeout(() => {
            isLongPress = true;
            dispatchSyntheticMouse('contextmenu', touch, 2);
            // 若設備支援，給予輕微震動回饋
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);

        // 正常派發 mousedown
        dispatchSyntheticMouse('mousedown', touch);
    }
}, {passive: false});

// 2. Touch Move (模擬 mousemove、處理雙指縮放、取消長按)
svgCanvas.addEventListener('touchmove', function(e) {
    // 雙指操作 (縮放物件)
    if (e.touches.length === 2) {
        e.preventDefault();
        const newPinchDist = getPinchDistance(e.touches);
        if (lastPinchDist && selectedElements.length > 0) {
            const delta = newPinchDist - lastPinchDist;
            // 給予防抖動閾值
            if (Math.abs(delta) > 3) {
                const zoomIntensity = 0.02;
                const scaleFactor = delta > 0 ? (1 + zoomIntensity) : (1 / (1 + zoomIntensity));
                selectedElements.forEach(el => {
                    scaleElementFromCenter(el, scaleFactor);
                    if (typeof refreshAngleLabels === 'function') refreshAngleLabels(el);
                });
                updateSelectionUI();
                clearTimeout(window.saveStateTimer);
                window.saveStateTimer = setTimeout(saveState, 500);
                lastPinchDist = newPinchDist;
            }
        }
        return;
    }

    // 單指操作
    if (e.touches.length === 1) {
        if (e.target === svgCanvas || e.target.closest('.shape')) {
            e.preventDefault();
        }
        const touch = e.touches[0];
        
        // 如果手指滑動超過 10px，則不視為長按，取消右鍵計時
        if (Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY) > 10) {
            clearTimeout(touchTimer);
        }

        dispatchSyntheticMouse('mousemove', touch);
    }
}, {passive: false});

// 3. Touch End (模擬 mouseup)
svgCanvas.addEventListener('touchend', function(e) {
    clearTimeout(touchTimer);
    lastPinchDist = null;

    // 如果沒有觸發長按，則派發 mouseup
    if (!isLongPress && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        dispatchSyntheticMouse('mouseup', touch);
        
        if (preventNextClick) {
            preventNextClick = false;
        } else if (Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY) < 10) {
            dispatchSyntheticMouse('click', touch);
        }
    }
    isLongPress = false;
});


// ======================================================================
// 【新增】觸控虛擬鍵盤 (Virtual Keyboard) 邏輯
// ======================================================================
window.vkShiftActive = false;

// 顯示/隱藏虛擬鍵盤
window.toggleVirtualKeyboard = function() {
    const panel = document.getElementById('virtual-keyboard-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'flex';
    } else {
        panel.style.display = 'none';
    }
};

// 模擬鍵盤按鍵發送
window.vkSimulateKey = function(keyStr) {
    // 獨立處理 Shift 鎖定開關
    if (keyStr === 'Shift') {
        window.vkShiftActive = !window.vkShiftActive;
        const btn = document.getElementById('vk-shift-btn');
        if (btn) {
            btn.style.background = window.vkShiftActive ? '#3498db' : '#f8f9fa';
            btn.style.color = window.vkShiftActive ? 'white' : 'black';
            btn.title = window.vkShiftActive ? "Shift 已啟用 (微調為10px / 鎖定角度)" : "Shift 未啟用 (微調為2px / 自由角度)";
        }
        return;
    }

    // 處理 Ctrl 組合鍵
    let key = keyStr;
    let ctrlKey = false;
    if (keyStr.startsWith('Ctrl+')) {
        ctrlKey = true;
        key = keyStr.split('+')[1].toLowerCase();
    }

    // 觸發鍵盤事件，欺騙原系統的 keydown
    const event = new KeyboardEvent('keydown', {
        key: key,
        ctrlKey: ctrlKey,
        metaKey: ctrlKey, // metaKey for macOS
        shiftKey: window.vkShiftActive,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
};

// 支援虛擬鍵盤的拖拉移動 (支援滑鼠與觸控)
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('vk-header');
    const panel = document.getElementById('virtual-keyboard-panel');
    if (!header || !panel) return;

    let isDraggingVk = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const startDrag = (clientX, clientY) => {
        isDraggingVk = true;
        const rect = panel.getBoundingClientRect();
        dragOffsetX = clientX - rect.left;
        dragOffsetY = clientY - rect.top;
        // 鎖定定位方式
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    };

    header.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
    header.addEventListener('touchstart', (e) => { startDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, {passive: false});

    const doDrag = (clientX, clientY) => {
        if (!isDraggingVk) return;
        let newL = clientX - dragOffsetX;
        let newT = clientY - dragOffsetY;
        // 防超出邊界
        if (newL < 0) newL = 0;
        if (newT < 0) newT = 0;
        if (newL + panel.offsetWidth > window.innerWidth) newL = window.innerWidth - panel.offsetWidth;
        if (newT + panel.offsetHeight > window.innerHeight) newT = window.innerHeight - panel.offsetHeight;
        panel.style.left = newL + 'px';
        panel.style.top = newT + 'px';
    };

    document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => { if(isDraggingVk){ doDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, {passive: false});

    document.addEventListener('mouseup', () => isDraggingVk = false);
    document.addEventListener('touchend', () => isDraggingVk = false);
});

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.popup-menu') || e.target.closest('.modal-overlay') || e.target.closest('#quick-edit-bar') || e.target.closest('#quick-math-bar') || e.target.closest('#context-menu')) {
        e.preventDefault();
        e.stopPropagation();
    }
});

// ======================================================================
// 📚 國中數學完整公式庫 (ASCIIMath 格式)
// ======================================================================
window.customFormulasList = [];

const JUNIOR_HIGH_FORMULAS =[
    {
        category: "乘法公式與多項式",
        items:[
            { name: "和的平方", code: "(a+b)^2=a^2+2ab+b^2" },
            { name: "差的平方", code: "(a-b)^2=a^2-2ab+b^2" },
            { name: "平方差", code: "(a+b)(a-b)=a^2-b^2" },
            { name: "乘積次方", code: "(ab)^m=a^mb^m" }
        ]
    },
    {
        category: "一元二次方程式",
        items:[
            { name: "公式解", code: "x=(-b+-sqrt(b^2-4ac))/(2a)" },
            { name: "判別式", code: "D=b^2-4ac" }
        ]
    },
    {
        category: "指數律",
        items:[
            { name: "同底相乘", code: "a^m*a^n=a^(m+n)" },
            { name: "同底相除", code: "a^m/a^n=a^(m-n)" },
            { name: "次方再次方", code: "(a^m)^n=a^(mn)" },
            { name: "零次方與負次方", code: "a^0=1 , a^-n=1/a^n" }
        ]
    },
    {
        category: "等差數列與級數",
        items:[
            { name: "一般項", code: "a_n=a_1+(n-1)d" },
            { name: "等差中項", code: "b=(a+c)/2" },
            { name: "級數和 (首末項)", code: "S_n=n/2(a_1+a_n)" },
            { name: "級數和 (公差)", code: "S_n=n/2[2a_1+(n-1)d]" }
        ]
    },
    {
        category: "平面幾何與測量",
        items:[
            { name: "畢氏定理", code: "a^2+b^2=c^2" },
            { name: "三角形面積", code: "1/2 bh" },
            { name: "正三角形高與面積", code: "h=sqrt(3)/2 a, A=sqrt(3)/4 a^2" },
            { name: "海龍公式", code: "sqrt(s(s-a)(s-b)(s-c))" },
            { name: "圓周長與圓面積", code: "C=2pi r, A=pi r^2" },
            { name: "扇形弧長", code: "2pi r * (theta)/360^circ" },
            { name: "扇形面積", code: "pi r^2 * (theta)/360^circ" },
            { name: "多邊形內角和", code: "(n-2)*180^circ" },
            { name: "正多邊形單一內角", code: "((n-2)*180^circ)/n" }
        ]
    },
    {
        category: "立體圖形",
        items:[
            { name: "柱體體積", code: "V=Ah" },
            { name: "錐體體積", code: "V=1/3Ah" },
            { name: "圓柱表面積", code: "2pi r^2+2pi rh" },
            { name: "圓錐表面積", code: "pi r^2+pi r s" }
        ]
    },
    {
        category: "統計與機率",
        items:[
            { name: "算術平均數", code: "bar x=(x_1+x_2+...+x_n)/n" },
            { name: "機率", code: "P(A)=(n(A))/(n(S))" }
        ]
    }
];

window.renderFormulaLibrary = function() {
    const container = document.getElementById('formula-panel-content');
    if (!container) return;
    container.innerHTML = '';

    // 1. 渲染內建公式
    JUNIOR_HIGH_FORMULAS.forEach(group => {
        const details = document.createElement('details');
        details.style.marginBottom = "5px";
        
        const summary = document.createElement('summary');
        summary.className = 'formula-group-summary';
        summary.innerText = group.category;
        details.appendChild(summary);

        const list = document.createElement('div');
        list.style.cssText = "display: flex; flex-direction: column; gap: 6px; padding: 8px 4px;";
        
        group.items.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'formula-item-btn';
            btn.onclick = () => {
                 insertToMathV2(item.code, '`'); // 直接插入游標處
            };
            btn.innerHTML = `
                <div class="formula-item-name">${item.name}</div>
                <div class="formula-item-math">\`${item.code}\`</div>
            `;
            list.appendChild(btn);
        });

        details.appendChild(list);
        container.appendChild(details);
    });

    // 2. 渲染自訂公式區塊
    const customDetails = document.createElement('details');
    customDetails.open = true; // 預設展開
    customDetails.style.marginBottom = "5px";
    customDetails.innerHTML = `<summary class="formula-group-summary" style="background:#e8f6f3; color:#16a085;">🌟 我的自訂公式</summary>`;
    
    const customList = document.createElement('div');
    customList.id = 'custom-formula-list';
    customList.style.cssText = "display: flex; flex-direction: column; gap: 6px; padding: 8px 4px;";
    customDetails.appendChild(customList);

    const addBtn = document.createElement('button');
    addBtn.innerText = "➕ 新增自訂公式";
    addBtn.style.cssText = "width:100%; padding:8px; border:1px dashed #16a085; background:white; color:#16a085; border-radius:4px; cursor:pointer; font-weight:bold; margin-top:5px;";
    addBtn.onclick = promptAddCustomFormula;
    customDetails.appendChild(addBtn);

    container.appendChild(customDetails);

    // 重新繪製 MathJax 與自訂清單
    window.renderCustomFormulaList();
    if (window.MathJax) {
        MathJax.typesetPromise([container]).catch(err => console.error(err));
    }
};

window.renderCustomFormulaList = function() {
    const list = document.getElementById('custom-formula-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (window.customFormulasList.length === 0) {
        list.innerHTML = `<div style="font-size:12px; color:#999; text-align:center; padding:5px;">尚無自訂公式</div>`;
        return;
    }

    window.customFormulasList.forEach((item, index) => {
        const btn = document.createElement('div');
        btn.className = 'formula-item-btn';
        btn.style.borderColor = '#1abc9c';
        
        // 插入功能
        btn.onclick = () => insertToMathV2(item.code, '`');
        
        btn.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <div class="formula-item-name" style="color:#16a085; margin:0;">${item.name}</div>
                <button onclick="deleteCustomFormula(${index}, event)" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:14px; padding:0 4px;" title="刪除">✕</button>
            </div>
            <div class="formula-item-math">\`${item.code}\`</div>
        `;
        list.appendChild(btn);
    });

    if (window.MathJax) {
        MathJax.typesetPromise([list]).catch(e => {});
    }
};

window.promptAddCustomFormula = function() {
    document.getElementById('custom-formula-name').value = '';
    document.getElementById('custom-formula-code').value = '';
    document.getElementById('custom-formula-modal').style.display = 'flex';
};

window.executeAddCustomFormula = function() {
    const name = document.getElementById('custom-formula-name').value.trim();
    const code = document.getElementById('custom-formula-code').value.trim();
    if (!name || !code) {
        showAlert("請完整輸入公式名稱與內容！");
        return;
    }
    
    window.customFormulasList.push({ name: name, code: code });
    if (typeof saveSystemSettings === 'function') saveSystemSettings(); // 同步到快取
    window.renderCustomFormulaList();
    
    document.getElementById('custom-formula-modal').style.display = 'none';
};

window.deleteCustomFormula = function(index, event) {
    event.stopPropagation(); // 避免觸發插入
    window.customFormulasList.splice(index, 1);
    if (typeof saveSystemSettings === 'function') saveSystemSettings();
    window.renderCustomFormulaList();
};

// --- 公式面板拖拉功能 ---
document.addEventListener('DOMContentLoaded', () => {
    const fHeader = document.getElementById('formula-panel-header');
    const fPanel = document.getElementById('formula-library-panel');
    if (!fHeader || !fPanel) return;

    let isDraggingFPanel = false;
    let fDragOffsetX = 0, fDragOffsetY = 0;

    const startDrag = (clientX, clientY) => {
        isDraggingFPanel = true;
        const rect = fPanel.getBoundingClientRect();
        fDragOffsetX = clientX - rect.left;
        fDragOffsetY = clientY - rect.top;
        fPanel.style.left = rect.left + 'px';
        fPanel.style.top = rect.top + 'px';
        fPanel.style.right = 'auto';
        fPanel.style.bottom = 'auto';
    };

    fHeader.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
    fHeader.addEventListener('touchstart', (e) => { startDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, {passive: false});

    const doDrag = (clientX, clientY) => {
        if (!isDraggingFPanel) return;
        let newL = clientX - fDragOffsetX;
        let newT = clientY - fDragOffsetY;
        if (newL < 0) newL = 0;
        if (newT < 0) newT = 0;
        if (newL + fPanel.offsetWidth > window.innerWidth) newL = window.innerWidth - fPanel.offsetWidth;
        if (newT + fPanel.offsetHeight > window.innerHeight) newT = window.innerHeight - fPanel.offsetHeight;
        fPanel.style.left = newL + 'px';
        fPanel.style.top = newT + 'px';
    };

    document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => { if(isDraggingFPanel){ doDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, {passive: false});

    document.addEventListener('mouseup', () => isDraggingFPanel = false);
    document.addEventListener('touchend', () => isDraggingFPanel = false);
});

window.addEventListener('mousemove', (e) => {
    window.currentClientX = e.clientX;
    window.currentClientY = e.clientY;
});

let currentTourStep = 0;
const tourSteps =[
    {
        title: "👋 歡迎使用",
        content: "這是一個專為國中數學設計的繪圖系統。現在為您進行 1 分鐘快速導覽，幫助您快速上手！<br><br><span style='color:#2980b9;'>💡 提示：按 <b>Enter</b> 或 <b>空白鍵</b> 即可前往下一步。</span>",
        target: null,
        arrow: "",
        pos: "center"
    },
    {
        title: "📁 頂部選單",
        content: "這裡負責檔案的<b>開啟、儲存、匯出圖片</b>。同時也可以在此進行雲端同步與系統設定。",
        target: "header",
        arrow: "⬆️",
        pos: "top-center"
    },
    {
        title: "✏️ 快速繪圖工具",
        content: "提供手繪、寫字、文字與公式工具。在此選取顏色與線條樣式後，可直接套用到繪圖物件。",
        target: ".toolbar",
        arrow: "⬆️",
        pos: "top-center"
    },
    {
        title: "🔺 幾何圖案庫",
        content: "左側可以一鍵產生線段、三角形、四邊形與立體積木等。點擊標題 <kbd>▼</kbd> 可以收合類別。",
        target: ".left-sidebar",
        arrow: "⬅️",
        pos: "left-center"
    },
    {
        title: "🛠️ 修改與作圖工具",
        content: "包含選取、群組、對稱作圖與尺規作圖。這裡是進行進階幾何修正的核心區。",
        target: ".right-sidebar",
        arrow: "➡️",
        pos: "right-center"
    },
    {
        title: "📚 資源管理",
        content: "右側這排按鈕可以將畫好的圖形「存入圖庫」或「存為題目」，也可以管理您的題庫資料。",
        target: ".canvas-right-bar",
        arrow: "➡️",
        pos: "right-center"
    },
    {
        title: "🔠 畫布控制項",
        content: "快速切換自動標註 (A,B,C...)、自動角度、快速旋轉。點擊右側尺寸標籤可設定紙張大小。",
        target: ".canvas-top-bar",
        arrow: "⬆️",
        pos: "top-center"
    },
    // 【新增】多頁操作區導覽
    {
        title: "📑 多頁操作區",
        content: "這裡可以新增、複製、刪除或<b>匯出單一頁面</b>，並在不同頁面間切換。點擊中間的頁碼可展開快速跳頁選單。",
        target: ".page-bar",
        arrow: "⬇️",
        pos: "bottom-center"
    },
    // 【新增】狀態列導覽
    {
        title: "ℹ️ 狀態列",
        content: "顯示目前的作圖模式、操作提示，以及游標在畫布上的即時 (X, Y) 幾何座標。",
        target: "#status-bar",
        arrow: "⬇️",
        pos: "bottom-center"
    },
    {
        title: "🔥 最強祕技：F1 鍵",
        content: "<div style='background:#fdf2f2; border:2px solid #e74c3c; padding:10px; border-radius:8px;'>滑鼠移到任何功能分區，按下 <kbd>F1</kbd> 鍵，即可立即查看該區域的操作說明！</div>",
        target: null,
        arrow: "",
        pos: "center"
    }
];

window.startTour = function() {
    currentTourStep = 0;
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        modal.style.display = 'flex';
        showStep(0);
    }
};

window.skipTour = function() {
    currentTourStep = tourSteps.length - 1; // 設定為最後一項的索引
    showStep(currentTourStep);
};

// 【修改】更新 showStep 函式，隱藏最後一頁的跳過按鈕
function showStep(index) {
    const step = tourSteps[index];
    const modalWrap = document.getElementById('welcome-modal'); // 取得最外層遮罩
    const modalBox = document.getElementById('tour-modal-box');
    const spotlight = document.getElementById('tour-spotlight');
    const arrow = document.getElementById('tour-arrow');
    const title = document.getElementById('tour-title');
    const body = document.getElementById('tour-body');
    const nextBtn = document.getElementById('btn-tour-next');
    const skipBtn = document.getElementById('btn-tour-skip');

    if (!modalBox || !spotlight || !arrow || !title || !body || !nextBtn) return;

    // 重置對話框樣式
    modalBox.style.position = "relative"; 
    modalBox.style.left = "auto";
    modalBox.style.top = "auto";
    modalBox.style.transform = "none";
    modalBox.style.margin = "0";

    title.innerText = step.title;
    body.innerHTML = step.content;
    
    const isLastStep = (index === tourSteps.length - 1);
    nextBtn.innerText = isLastStep ? "完畢！開始使用" : "下一步 (Enter)";
    
    if (skipBtn) {
        skipBtn.style.display = isLastStep ? 'none' : 'block';
    }

    if (step.target) {
        // --- 有導覽目標時：讓最外層遮罩全透明，避免「雙重變暗」 ---
        modalWrap.style.background = "transparent";

        const el = document.querySelector(step.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            const pad = 5;
            
            spotlight.style.display = 'block';
            spotlight.style.left = (rect.left - pad) + 'px';
            spotlight.style.top = (rect.top - pad) + 'px';
            spotlight.style.width = (rect.width + pad * 2) + 'px';
            spotlight.style.height = (rect.height + pad * 2) + 'px';

            arrow.style.display = 'block';
            arrow.innerText = step.arrow;
            
            if (step.pos === 'top-center') {
                arrow.style.left = (rect.left + rect.width / 2 - 20) + 'px';
                arrow.style.top = (rect.bottom + 5) + 'px';
            } else if (step.pos === 'left-center') {
                arrow.style.left = (rect.right + 5) + 'px';
                arrow.style.top = (rect.top + rect.height / 2 - 20) + 'px';
            } else if (step.pos === 'right-center') {
                arrow.style.left = (rect.left - 45) + 'px';
                arrow.style.top = (rect.top + rect.height / 2 - 20) + 'px';
            } else if (step.pos === 'bottom-center') {
                arrow.style.left = (rect.left + rect.width / 2 - 20) + 'px';
                arrow.style.top = (rect.top - 45) + 'px';
            }
        }
    } else {
        // --- 歡迎畫面或最後一步 (沒有目標物) 時：恢復全域遮罩顏色 ---
        modalWrap.style.background = "rgba(0,0,0,0.6)";
        spotlight.style.display = 'none';
        arrow.style.display = 'none';
    }
}

window.nextTourStep = function() {
    currentTourStep++;
    if (currentTourStep < tourSteps.length) {
        showStep(currentTourStep);
    } else {
        closeWelcomeTour();
    }
};