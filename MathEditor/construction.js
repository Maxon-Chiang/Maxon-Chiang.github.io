function toggleConstructMenu() {
    closeAllMenus();
    const menu = document.getElementById('menu-construct');
    const btnWrapper = document.getElementById('btn-construct').parentNode;
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        const isVisible = (menu.style.display === 'flex');
        closeAllMenus();
        if (!isVisible) {
            fixMenuPosition('menu-construct', btnWrapper);
        }
    }
}
function executeConstruction(type) {
    closeAllMenus();
    if (selectedElements.length === 0) return false;
    const target = selectedElements[0];
    const tool = target.getAttribute('data-tool');
    const clickX = lastClickPos.x;
    const clickY = lastClickPos.y;
    const SEARCH_RADIUS = 30;
    const isMultiPart = (tool === 'polygon' || tool === 'angle' || tool === 'polyline' || tool === 'rect' || tool === 'tri');
    const getTrianglePts = () => {
        let pts = [];
        if (isMultiPart && selectedElements.length === 1) {
            pts = getTransformedPoints(target);
            if (pts.length !== 3) return null;
        } else if (selectedElements.length === 3) {
            const allPoints = selectedElements.every(el =>
                el.getAttribute('data-tool') === 'point' || el.getAttribute('data-sub-tool') === 'circle'
            );
            if (!allPoints) return null;
            pts = selectedElements.map(el => {
                const m = el.getCTM();
                const cx = +el.getAttribute('cx');
                const cy = +el.getAttribute('cy');
                return {
                    x: cx * m.a + cy * m.c + m.e,
                    y: cx * m.b + cy * m.d + m.f
                };
            });
        }
        return (pts && pts.length === 3) ? pts : null;
    };
    if (type === 'circumcenter' || type === 'incenter' || type === 'centroid') {
        const pts = getTrianglePts();
        if (!pts) {
            statusText.innerText = "請選取一個三角形，或同時選取三個點";
            return false;
        }
        const containerGroup = document.createElementNS(ns, "g");
        containerGroup.setAttribute('class', 'shape group construction-obj');
        containerGroup.setAttribute('data-tool', 'group');
        containerGroup.setAttribute('data-construction-type', type);
        if (selectedElements.length === 1 && target.id) {
            containerGroup.setAttribute('data-owner-shape', target.id);
        } else if (selectedElements.length === 1) {
            target.id = 'tri-' + Date.now();
            containerGroup.setAttribute('data-owner-shape', target.id);
        }
        updateTriangleConstruction(containerGroup, pts);
        shapesLayer.appendChild(containerGroup);
        saveState();
        if (!isContinuousMarking) {
            setMode('select');
            deselectAll();
            if (target) addToSelection(target);
        }
        statusText.innerText = `已建立${(type === 'circumcenter' ? '外心' : (type === 'incenter' ? '內心' : '重心'))} (與三角形連動)`;
        return true;
    } else if (type === 'midpoint') {
        let p1, p2;
        if (tool === 'line') {
            const pts = getTransformedPoints(target);
            if (pts.length >= 2) {
                p1 = pts[0];
                p2 = pts[1];
            }
        } else if (isMultiPart) {
            if (!isDirectClick) return false;
            const pts = getTransformedPoints(target);
            let minDist = Infinity, bestIdx = -1;
            const len = (tool === 'polygon' || tool === 'rect' || tool === 'tri') ? pts.length : pts.length - 1;
            for (let i = 0; i < len; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                if (d < SEARCH_RADIUS && d < minDist) {
                    minDist = d;
                    bestIdx = i;
                }
            }
            if (bestIdx !== -1) {
                p1 = pts[bestIdx];
                p2 = pts[(bestIdx + 1) % pts.length];
            } else {
                return false;
            }
        } else if (selectedElements.length === 2) {
            p1 = getShapeCenter(selectedElements[0]);
            p2 = getShapeCenter(selectedElements[1]);
        }
        if (p1 && p2) {
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const pt = document.createElementNS(ns, "ellipse");
            pt.setAttribute('cx', mx);
            pt.setAttribute('cy', my);
            pt.setAttribute('rx', 4);
            pt.setAttribute('ry', 4);
            pt.style.cssText = "fill:#e74c3c; stroke:none; cursor:move;";
            pt.setAttribute('data-tool', 'point');
            pt.setAttribute('class', 'shape');
            if (target) {
                if (!target.id) target.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
                pt.setAttribute('data-owner-shape', target.id);
                pt.setAttribute('data-dependency-type', 'midpoint');
            }
            shapesLayer.appendChild(pt);
            saveState();
            if (isContinuousMarking) {
                statusText.innerText = "已建立中點 (連續模式)";
                deselectAll();
                addToSelection(pt);
            } else {
                statusText.innerText = "已建立中點";
                setMode('select');
                deselectAll();
                addToSelection(pt);
            }
            return true;
        }
        return false;
    } else if (type === 'perpendicular') {
        let x1, y1, x2, y2;
        if (tool === 'line') {
            const pts = getTransformedPoints(target);
            if (pts.length >= 2) {
                x1 = pts[0].x; y1 = pts[0].y;
                x2 = pts[1].x; y2 = pts[1].y;
            }
        } else if (isMultiPart) {
            if (!isDirectClick) return false;
            const pts = getTransformedPoints(target);
            let minDist = Infinity, bestIdx = -1;
            const len = (tool === 'polygon' || tool === 'rect' || tool === 'tri') ? pts.length : pts.length - 1;
            for (let i = 0; i < len; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                if (d < SEARCH_RADIUS && d < minDist) {
                    minDist = d;
                    bestIdx = i;
                }
            }
            if (bestIdx !== -1) {
                x1 = pts[bestIdx].x; y1 = pts[bestIdx].y;
                x2 = pts[(bestIdx + 1) % pts.length].x; y2 = pts[(bestIdx + 1) % pts.length].y;
            } else { return false; }
        } else { return false; }
        if (x1 === undefined || x2 === undefined) return false;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return false;
        const ux = -dy / len;
        const uy = dx / len;
        const size = 100;
        const group = document.createElementNS(ns, "g");
        group.setAttribute('class', 'shape group');
        group.setAttribute('data-tool', 'line');
        const fixedAngle = Math.atan2(uy, ux);
        group.setAttribute('data-fixed-angle', fixedAngle);
        const hitLine = document.createElementNS(ns, "line");
        hitLine.setAttribute('x1', mx - ux * size);
        hitLine.setAttribute('y1', my - uy * size);
        hitLine.setAttribute('x2', mx + ux * size);
        hitLine.setAttribute('y2', my + uy * size);
        hitLine.setAttribute('class', 'hit-line');
        hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        const line = document.createElementNS(ns, "line");
        line.setAttribute('x1', mx - ux * size);
        line.setAttribute('y1', my - uy * size);
        line.setAttribute('x2', mx + ux * size);
        line.setAttribute('y2', my + uy * size);
        line.setAttribute('class', 'visible-line');
        const strokeColor = document.getElementById('stroke-color-select').value || '#2980b9';
        const lineStyleVal = document.getElementById('line-style-select').value || 'dashed';
        let dashArray = "8,5";
        if (lineStyleVal === 'solid') dashArray = "none";
        else if (lineStyleVal === 'dotted') dashArray = "2,4";
        else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
        else if (lineStyleVal === 'dashed') dashArray = "8,5";
        line.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; pointer-events:none;`;
        group.appendChild(hitLine);
        group.appendChild(line);
        if (target) {
            if (!target.id) target.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            group.setAttribute('data-owner-shape', target.id);
            group.setAttribute('data-dependency-type', 'perpendicular');
        }
        shapesLayer.appendChild(group);
        saveState();
        if (isContinuousMarking) {
            statusText.innerText = "已建立中垂線 (連續模式)";
            deselectAll();
            addToSelection(group);
        } else {
            statusText.innerText = "已建立中垂線";
            setMode('select');
            deselectAll();
            addToSelection(group);
        }
        return true;
    } else if (type === 'tangent') {
        if (selectedElements.length !== 2) return false;
        let circle, point;
        selectedElements.forEach(el => {
            if (el.getAttribute('data-sub-tool') === 'circle') circle = el;
            else if (el.getAttribute('data-tool') === 'point') point = el;
        });
        if (!circle || !point) return false;
        const getAbsCenter = (el) => {
            const m = el.getCTM();
            const cx = +el.getAttribute('cx');
            const cy = +el.getAttribute('cy');
            return {
                x: cx * m.a + cy * m.c + m.e,
                y: cx * m.b + cy * m.d + m.f
            };
        };
        const cPos = getAbsCenter(circle);
        const pPos = getAbsCenter(point);
        const r = +circle.getAttribute('rx') * circle.getCTM().a;
        const dx = pPos.x - cPos.x;
        const dy = pPos.y - cPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r) {
            statusText.innerText = "點在圓內，無法作切線";
            return false;
        }
        const baseAngle = Math.atan2(dy, dx);
        const offsetAngle = Math.acos(r / dist);
        const a1 = baseAngle + offsetAngle;
        const a2 = baseAngle - offsetAngle;
        const t1 = { x: cPos.x + r * Math.cos(a1), y: cPos.y + r * Math.sin(a1) };
        const t2 = { x: cPos.x + r * Math.cos(a2), y: cPos.y + r * Math.sin(a2) };
        const group = document.createElementNS(ns, "g");
        group.setAttribute('class', 'shape group');
        group.setAttribute('data-tool', 'tangent');
        if (!circle.id) circle.id = 'circle-' + Date.now();
        group.setAttribute('data-circle-id', circle.id);
        const pointsStr = `${t1.x},${t1.y} ${pPos.x},${pPos.y} ${t2.x},${t2.y}`;
        const hitPoly = document.createElementNS(ns, "polyline");
        hitPoly.setAttribute('points', pointsStr);
        hitPoly.setAttribute('class', 'hit-line');
        hitPoly.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer; fill:none;";
        const visPoly = document.createElementNS(ns, "polyline");
        visPoly.setAttribute('points', pointsStr);
        visPoly.setAttribute('class', 'visible-line');
        visPoly.style.cssText = "stroke:#8e44ad; stroke-width:1; fill:none; vector-effect:non-scaling-stroke; pointer-events:none;";
        group.appendChild(hitPoly);
        group.appendChild(visPoly);
        shapesLayer.appendChild(group);
        saveState();
        if (isContinuousMarking) {
            statusText.innerText = "已建立切線 (連續模式)";
            deselectAll();
            addToSelection(group);
        } else {
            statusText.innerText = "已建立切線";
            setMode('select');
            deselectAll();
            addToSelection(group);
        }
        return true;
    } else if (type === 'divide_line') {
        let p1, p2;
        if (tool === 'line') {
            const pts = getTransformedPoints(target);
            if (pts.length >= 2) { p1 = pts[0]; p2 = pts[1]; }
        } else if (isMultiPart) {
            if (!isDirectClick) return false;
            const pts = getTransformedPoints(target);
            let minDist = Infinity, bestIdx = -1;
            const len = (tool === 'polygon' || tool === 'rect' || tool === 'tri') ? pts.length : pts.length - 1;
            for (let i = 0; i < len; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                if (d < SEARCH_RADIUS && d < minDist) { minDist = d; bestIdx = i; }
            }
            if (bestIdx !== -1) { p1 = pts[bestIdx]; p2 = pts[(bestIdx + 1) % pts.length]; }
            else { return false; }
        } else { return false; }
        openNumberInputModal("請輸入等分數 (例如 2, 3...)", "2", (inputVal) => {
            const n = parseInt(inputVal);
            if (isNaN(n) || n < 2) return;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const totalLen = Math.sqrt(dx * dx + dy * dy);
            if (totalLen === 0) return;
            const ux = dx / totalLen, uy = dy / totalLen;
            const nx = -uy, ny = ux;
            const tickSize = 5;
            const createdMarks = [];
            for (let i = 1; i < n; i++) {
                const ratio = i / n;
                const px = p1.x + dx * ratio;
                const py = p1.y + dy * ratio;
                const group = document.createElementNS(ns, "g");
                group.setAttribute('class', 'shape group');
                group.setAttribute('data-tool', 'line');
                const hitLine = document.createElementNS(ns, "line");
                hitLine.setAttribute('x1', px - nx * tickSize);
                hitLine.setAttribute('y1', py - ny * tickSize);
                hitLine.setAttribute('x2', px + nx * tickSize);
                hitLine.setAttribute('y2', py + ny * tickSize);
                hitLine.setAttribute('class', 'hit-line');
                hitLine.style.cssText = "stroke:transparent; stroke-width:12; cursor:pointer;";
                const visLine = document.createElementNS(ns, "line");
                visLine.setAttribute('x1', px - nx * tickSize);
                visLine.setAttribute('y1', py - ny * tickSize);
                visLine.setAttribute('x2', px + nx * tickSize);
                visLine.setAttribute('y2', py + ny * tickSize);
                visLine.setAttribute('class', 'visible-line');
                visLine.style.cssText = "stroke:#e74c3c; stroke-width:2; pointer-events:none;";
                group.appendChild(hitLine);
                group.appendChild(visLine);
                if (target) {
                    if (!target.id) target.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
                    group.setAttribute('data-owner-shape', target.id);
                    group.setAttribute('data-dependency-type', 'divide_line');
                    group.setAttribute('data-divide-ratio', i / n);
                }
                shapesLayer.appendChild(group);
                createdMarks.push(group);
            }
            saveState();
            if (isContinuousMarking) {
                statusText.innerText = `已將線段分為 ${n} 等分 (連續模式)`;
                deselectAll();
                createdMarks.forEach(m => addToSelection(m));
            } else {
                statusText.innerText = `已將線段分為 ${n} 等分`;
                setMode('select');
                deselectAll();
                createdMarks.forEach(m => addToSelection(m));
            }
        });
        return true;
    } else if (type === 'divide_angle') {
        if (!isMultiPart) {
            statusText.innerText = "請選取一個「角」或「多邊形」物件";
            return false;
        }
        const pts = getTransformedPoints(target);
        if (pts.length < 3) return false;
        let A, B, C;
        let vertexIdx = 1;
        if (tool === 'angle' && pts.length === 3) {
            A = pts[0]; B = pts[1]; C = pts[2];
            vertexIdx = 1;
        } else {
            const idx = findClosestPointIndex(pts, clickX, clickY);
            if (idx === -1) return false;
            if ((tool === 'angle' || tool === 'polyline') && (idx === 0 || idx === pts.length - 1)) {
                statusText.innerText = "請點擊中間的頂點位置";
                return false;
            }
            vertexIdx = idx;
            B = pts[idx];
            A = pts[(idx - 1 + pts.length) % pts.length];
            C = pts[(idx + 1) % pts.length];
        }
        openNumberInputModal("請輸入等分數 (預設 2 為角平分)", "2", (inputVal) => {
            const n = parseInt(inputVal);
            if (isNaN(n) || n < 2) return;
            const angBA = Math.atan2(A.y - B.y, A.x - B.x);
            const angBC = Math.atan2(C.y - B.y, C.x - B.x);
            let diff = angBC - angBA;
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            const len = 150;
            const createdLines = [];
            const createdObjs = [];
            const strokeColor = document.getElementById('stroke-color-select').value || '#000000';
            const lineStyleVal = document.getElementById('line-style-select').value || 'solid';
            let dashArray = "none";
            if (lineStyleVal === 'dashed') dashArray = "8,5";
            else if (lineStyleVal === 'dotted') dashArray = "2,4";
            else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
            const markSymbols = ["×", "○", "∙", "※", "*"];
            const stepAng = diff / n;
            if (!target.id) target.id = 'shape-' + Date.now();
            for (let i = 1; i < n; i++) {
                const targetAng = angBA + diff * (i / n);
                const ex = B.x + len * Math.cos(targetAng);
                const ey = B.y + len * Math.sin(targetAng);
                const group = document.createElementNS(ns, "g");
                group.setAttribute('class', 'shape group');
                group.setAttribute('data-tool', 'line');
                group.setAttribute('data-fixed-angle', targetAng);
                group.setAttribute('data-owner-shape', target.id);
                group.setAttribute('data-dependency-type', 'divide_angle_line');
                group.setAttribute('data-vertex-index', vertexIdx);
                group.setAttribute('data-divide-ratio', i / n);
                const visLine = document.createElementNS(ns, "line");
                visLine.setAttribute('x1', B.x); visLine.setAttribute('y1', B.y);
                visLine.setAttribute('x2', ex); visLine.setAttribute('y2', ey);
                visLine.setAttribute('class', 'visible-line');
                visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; pointer-events:none;`;
                const hitLine = document.createElementNS(ns, "line");
                hitLine.setAttribute('x1', B.x); hitLine.setAttribute('y1', B.y);
                hitLine.setAttribute('x2', ex); hitLine.setAttribute('y2', ey);
                hitLine.setAttribute('class', 'hit-line');
                hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
                group.appendChild(hitLine);
                group.appendChild(visLine);
                shapesLayer.appendChild(group);
                createdLines.push(group);
                createdObjs.push(group);
            }
            for (let i = 0; i < n; i++) {
                const markAng = angBA + stepAng * (i + 0.5);
                const markDist = 45;
                const mx = B.x + markDist * Math.cos(markAng);
                const my = B.y + markDist * Math.sin(markAng);
                const txt = document.createElementNS(ns, "text");
                txt.textContent = markSymbols[0];
                txt.setAttribute('x', mx);
                txt.setAttribute('y', my);
                txt.setAttribute('class', 'shape');
                txt.setAttribute('data-tool', 'text');
                txt.setAttribute('data-owner-shape', target.id);
                txt.setAttribute('data-dependency-type', 'angle_division_mark');
                txt.setAttribute('data-vertex-index', vertexIdx);
                txt.setAttribute('data-divide-ratio', (i + 0.5) / n);
                txt.style.cssText = "font-size:16px; fill:#c0392b; text-anchor:middle; dominant-baseline:central; cursor:move;";
                shapesLayer.appendChild(txt);
                createdObjs.push(txt);
            }
            saveState();
            if (isContinuousMarking) {
                statusText.innerText = `已建立角 ${n} 等分線 (連續模式)`;
                deselectAll();
                createdObjs.forEach(o => addToSelection(o));
            } else {
                statusText.innerText = `已建立角 ${n} 等分線`;
                setMode('select');
                deselectAll();
                createdObjs.forEach(o => addToSelection(o));
            }
        });
        return true;
    } else if (type === 'connect_points') {
        if (selectedElements.length !== 2) return false;
        const getAbsCenter = (el) => {
            const m = el.getCTM();
            const cx = +el.getAttribute('cx') || 0;
            const cy = +el.getAttribute('cy') || 0;
            return {
                x: cx * m.a + cy * m.c + m.e,
                y: cx * m.b + cy * m.d + m.f
            };
        };
        const p1 = getAbsCenter(selectedElements[0]);
        const p2 = getAbsCenter(selectedElements[1]);
        const group = document.createElementNS(ns, "g");
        group.setAttribute('class', 'shape group');
        group.setAttribute('data-tool', 'line');
        const strokeColor = document.getElementById('stroke-color-select').value || '#000000';
        const lineStyleVal = document.getElementById('line-style-select').value || 'solid';
        let dashArray = "none";
        if (lineStyleVal === 'dashed') dashArray = "8,5";
        else if (lineStyleVal === 'dotted') dashArray = "2,4";
        else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
        const hitLine = document.createElementNS(ns, "line");
        hitLine.setAttribute('x1', p1.x); hitLine.setAttribute('y1', p1.y);
        hitLine.setAttribute('x2', p2.x); hitLine.setAttribute('y2', p2.y);
        hitLine.setAttribute('class', 'hit-line');
        hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        const visLine = document.createElementNS(ns, "line");
        visLine.setAttribute('x1', p1.x); visLine.setAttribute('y1', p1.y);
        visLine.setAttribute('x2', p2.x); visLine.setAttribute('y2', p2.y);
        visLine.setAttribute('class', 'visible-line');
        visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; fill:none; vector-effect:non-scaling-stroke; pointer-events:none;`;
        group.appendChild(hitLine);
        group.appendChild(visLine);
        shapesLayer.appendChild(group);
        saveState();
        if (isContinuousMarking) {
            statusText.innerText = "已建立連線 (連續模式)";
            deselectAll();
            addToSelection(group);
        } else {
            statusText.innerText = "已建立連線";
            setMode('select');
            deselectAll();
            addToSelection(group);
        }
        return true;
    }
    return false;
}
function snapToCircle(circleEl, mouseX, mouseY) {
    const m = circleEl.getCTM();
    const r = (circleEl.getAttribute('rx') || circleEl.getAttribute('r')) * m.a;
    const cx = (circleEl.getAttribute('cx') || 0) * m.a + m.e;
    const cy = (circleEl.getAttribute('cy') || 0) * m.d + m.f;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) { return { x: cx + r, y: cy }; }
    const snapX = cx + (dx / dist) * r;
    const snapY = cy + (dy / dist) * r;
    return { x: snapX, y: snapY };
}
let highlightPoints = [];
function createHighlightPoint(p) {
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', 5);
    circle.style.cssText = `fill:#1abc9c; stroke:white; stroke-width:1.5; pointer-events:none;`;
    tempLayer.appendChild(circle);
    highlightPoints.push(circle);
}
window.clearAllHighlightPoints = function() {
    if (typeof highlightPoints !== 'undefined') {
        highlightPoints.forEach(p => p.remove());
        highlightPoints.length = 0;
    }
};
function autoApplyConstruction(targetShape, clickX, clickY) {
    const tool = targetShape ? targetShape.getAttribute('data-tool') : null;
    const subTool = targetShape ? targetShape.getAttribute('data-sub-tool') : null;
    const isTargetCircle = targetShape && (subTool === 'circle' || (tool === 'ellipse' && targetShape.getAttribute('rx') === targetShape.getAttribute('ry')));
    const isTargetValid = !!targetShape;
    let newlyCreated = null;
    if (constructionModeType === 'central') {
        if (constructionStep === 0) {
            if (isTargetCircle) {
                const P1 = snapToCircle(targetShape, clickX, clickY);
                tempConstructionSource = { circle: targetShape, points: [P1] };
                createHighlightPoint(P1);
                constructionStep = 1;
                const msg = "步驟 2/2：請在圓周上點擊第二點";
                statusText.innerText = msg;
                window.showToolTipImmediate(msg);
            } else { statusText.innerText = "請先點擊一個圓形！"; }
        } else if (constructionStep === 1) {
            const P2 = snapToCircle(tempConstructionSource.circle, clickX, clickY);
            const { circle, points } = tempConstructionSource;
            const P1 = points[0];
            const m = circle.getCTM();
            const C = {
                x: (circle.getAttribute('cx') || 0) * m.a + m.e,
                y: (circle.getAttribute('cy') || 0) * m.d + m.f,
            };
            const group = createCircleAngleGroup('central-angle', circle, [C, P1, P2]);
            shapesLayer.appendChild(group);
            newlyCreated = group;
            clearAllHighlightPoints();
            saveState();
            setMode('select');
            setTimeout(() => {
                deselectAll();
                addToSelection(group);
                generateAngleLabels(group, true);
            }, 50);
        }
    }
    else if (constructionModeType === 'inscribed') {
        if (constructionStep === 0) {
            if (isTargetCircle) {
                const A = snapToCircle(targetShape, clickX, clickY);
                tempConstructionSource = { circle: targetShape, points: [A] };
                createHighlightPoint(A);
                constructionStep = 1;
                const msg = "步驟 2/3：請在圓周上點擊頂點 (V)";
                statusText.innerText = msg;
                window.showToolTipImmediate(msg);
            } else { statusText.innerText = "請先點擊一個圓形！"; }
        } else if (constructionStep === 1) {
            const V = snapToCircle(tempConstructionSource.circle, clickX, clickY);
            tempConstructionSource.points.push(V);
            createHighlightPoint(V);
            constructionStep = 2;
            const msg = "步驟 3/3：請在圓周上點擊第二個端點 (B)";
            statusText.innerText = msg;
            window.showToolTipImmediate(msg);
        } else if (constructionStep === 2) {
            const B = snapToCircle(tempConstructionSource.circle, clickX, clickY);
            const [A, V] = tempConstructionSource.points;
            const group = createCircleAngleGroup('inscribed-angle', tempConstructionSource.circle, [A, V, B]);
            shapesLayer.appendChild(group);
            newlyCreated = group;
            clearAllHighlightPoints();
            saveState();
            setMode('select');
            setTimeout(() => {
                deselectAll();
                addToSelection(group);
                generateAngleLabels(group, true);
            }, 50);
        }
    }
    else if (constructionModeType === 'tangent-chord') {
        if (constructionStep === 0) {
            if (isTargetCircle) {
                const P = snapToCircle(targetShape, clickX, clickY);
                tempConstructionSource = { circle: targetShape, points: [P] };
                createHighlightPoint(P);
                constructionStep = 1;
                const msg = "步驟 2/2：請在圓周上點擊弦的另一端點 (A)";
                statusText.innerText = msg;
                window.showToolTipImmediate(msg);
            } else { statusText.innerText = "請先點擊一個圓形！"; }
        } else if (constructionStep === 1) {
            const A = snapToCircle(tempConstructionSource.circle, clickX, clickY);
            const P = tempConstructionSource.points[0];
            const group = createCircleAngleGroup('tangent-chord-angle', tempConstructionSource.circle, [A, P]);
            shapesLayer.appendChild(group);
            newlyCreated = group;
            clearAllHighlightPoints();
            saveState();
            setMode('select');
            setTimeout(() => {
                deselectAll();
                addToSelection(group);
                generateAngleLabels(group, true);
            }, 50);
        }
    }
    if (['circumcenter', 'incenter', 'centroid'].includes(constructionModeType)) {
        if (!isTargetValid) { statusText.innerText = "請點擊三角形邊緣"; return; }
        const pts = getTransformedPoints(targetShape);
        if (!pts || pts.length !== 3) { statusText.innerText = "這不是三角形，無法作圖"; return; }
        deselectAll();
        addToSelection(targetShape);
        executeConstruction(constructionModeType);
        return;
    }
    else if (['midpoint', 'perpendicular', 'divide_line'].includes(constructionModeType)) {
        if (!isTargetValid) { statusText.innerText = "請點擊線段或多邊形邊緣 (不支援空白處)"; return; }
        let p1, p2;
        if (tool === 'line') {
            const pts = getTransformedPoints(targetShape);
            if (pts.length >= 2) { p1 = pts[0]; p2 = pts[1]; }
        } else if (tool === 'polygon' || tool === 'polyline' || tool === 'angle' || tool === 'rect' || tool === 'tri') {
            const pts = getTransformedPoints(targetShape);
            if (pts.length < 2) return;
            let minDst = Infinity; let bestIdx = -1;
            const loopLimit = (tool === 'polyline' || tool === 'angle') ? pts.length - 1 : pts.length;
            for (let i = 0; i < loopLimit; i++) {
                const a = pts[i]; const b = pts[(i + 1) % pts.length];
                const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                if (d < minDst) { minDst = d; bestIdx = i; }
            }
            if (bestIdx !== -1) { p1 = pts[bestIdx]; p2 = pts[(bestIdx + 1) % pts.length]; }
        }
        if (!p1 || !p2) { statusText.innerText = "無法識別線段"; return; }
        if (constructionModeType === 'midpoint') {
            const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
            const pt = document.createElementNS(ns, "ellipse");
            pt.setAttribute('cx', mx); pt.setAttribute('cy', my); pt.setAttribute('rx', 4); pt.setAttribute('ry', 4);
            pt.setAttribute('class', 'shape'); pt.setAttribute('data-tool', 'point');
            pt.style.cssText = "fill:#e74c3c; stroke:none; cursor:move;";
            shapesLayer.appendChild(pt);
            saveState();
            if (isContinuousMarking) {
                statusText.innerText = "已建立中點 (連續模式)";
                deselectAll(); addToSelection(pt);
            } else {
                statusText.innerText = "已建立中點";
                setMode('select'); deselectAll(); addToSelection(pt);
            }
        } else if (constructionModeType === 'perpendicular') {
            const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x; const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return;
            const ux = -dy / len; const uy = dx / len;
            const size = 100;
            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group'); group.setAttribute('data-tool', 'line');
            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('x1', mx - ux * size); hitLine.setAttribute('y1', my - uy * size);
            hitLine.setAttribute('x2', mx + ux * size); hitLine.setAttribute('y2', my + uy * size);
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('x1', mx - ux * size); visLine.setAttribute('y1', my - uy * size);
            visLine.setAttribute('x2', mx + ux * size); visLine.setAttribute('y2', my + uy * size);
            visLine.setAttribute('class', 'visible-line');
            const strokeColor = document.getElementById('stroke-color-select').value || '#2980b9';
            const lineStyleVal = document.getElementById('line-style-select').value || 'dashed';
            let dashArray = "8,5";
            if (lineStyleVal === 'solid') dashArray = "none";
            else if (lineStyleVal === 'dotted') dashArray = "2,4";
            else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
            else if (lineStyleVal === 'dashed') dashArray = "8,5";
            visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; vector-effect:non-scaling-stroke; pointer-events:none;`;
            group.appendChild(hitLine); group.appendChild(visLine);
            shapesLayer.appendChild(group);
            newlyCreated = group;
            saveState();
            if (isContinuousMarking) {
                statusText.innerText = "已建立中垂線 (連續模式)";
                deselectAll(); addToSelection(group);
            } else {
                statusText.innerText = "已建立中垂線";
                setMode('select'); deselectAll(); addToSelection(group);
            }
        } else if (constructionModeType === 'divide_line') {
            openNumberInputModal("請輸入等分數 (例如 2, 3...)", "2", (inputVal) => {
                const n = parseInt(inputVal);
                if (isNaN(n) || n < 2) return;
                const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                const totalLen = Math.sqrt(dx * dx + dy * dy);
                if (totalLen === 0) return;
                const ux = dx / totalLen, uy = dy / totalLen;
                const nx = -uy, ny = ux;
                const tickSize = 5;
                const createdMarks = [];
                for (let i = 1; i < n; i++) {
                    const ratio = i / n;
                    const px = p1.x + dx * ratio; const py = p1.y + dy * ratio;
                    const group = document.createElementNS(ns, "g");
                    group.setAttribute('class', 'shape group'); group.setAttribute('data-tool', 'line');
                    const hitLine = document.createElementNS(ns, "line");
                    hitLine.setAttribute('x1', px - nx * tickSize); hitLine.setAttribute('y1', py - ny * tickSize);
                    hitLine.setAttribute('x2', px + nx * tickSize); hitLine.setAttribute('y2', py + ny * tickSize);
                    hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:12; cursor:pointer;";
                    const visLine = document.createElementNS(ns, "line");
                    visLine.setAttribute('x1', px - nx * tickSize); visLine.setAttribute('y1', py - ny * tickSize);
                    visLine.setAttribute('x2', px + nx * tickSize); visLine.setAttribute('y2', py + ny * tickSize);
                    visLine.setAttribute('class', 'visible-line');
                    visLine.style.cssText = "stroke:#e74c3c; stroke-width:2; pointer-events:none;";
                    group.appendChild(hitLine); group.appendChild(visLine);
                    shapesLayer.appendChild(group);
                    newlyCreated = group;
                    createdMarks.push(group);
                }
                saveState();
                if (isContinuousMarking) {
                    statusText.innerText = `已將線段分為 ${n} 等分 (連續模式)`;
                    deselectAll(); createdMarks.forEach(m => addToSelection(m));
                } else {
                    statusText.innerText = `已將線段分為 ${n} 等分`;
                    setMode('select'); deselectAll(); createdMarks.forEach(m => addToSelection(m));
                }
            });
        }
    } else if (constructionModeType === 'divide_angle') {
        if (!isTargetValid) { statusText.innerText = "請點擊角或多邊形的頂點"; return; }
        let A, B, C;
        const pts = getTransformedPoints(targetShape);
        if (tool === 'line' || tool === 'circle' || tool === 'point') { statusText.innerText = "請選擇「角」或「多邊形」物件"; return; }
        const idx = findClosestPointIndex(pts, clickX, clickY);
        if (idx === -1) return;
        B = pts[idx];
        if ((tool === 'angle' || tool === 'polyline') && (idx === 0 || idx === pts.length - 1)) {
            if (pts.length === 3) { B = pts[1]; A = pts[0]; C = pts[2]; }
            else { statusText.innerText = "請點擊中間的頂點"; return; }
        } else { A = pts[(idx - 1 + pts.length) % pts.length]; C = pts[(idx + 1) % pts.length]; }
        openNumberInputModal("請輸入等分數 (預設 2 為角平分)", "2", (inputVal) => {
            const n = parseInt(inputVal);
            if (isNaN(n) || n < 2) return;
            const angBA = Math.atan2(A.y - B.y, A.x - B.x);
            const angBC = Math.atan2(C.y - B.y, C.x - B.x);
            let diff = angBC - angBA;
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            const len = 150;
            const createdLines = [];
            const strokeColor = document.getElementById('stroke-color-select').value || '#000000';
            const lineStyleVal = document.getElementById('line-style-select').value || 'solid';
            let dashArray = "none";
            if (lineStyleVal === 'dashed') dashArray = "8,5";
            else if (lineStyleVal === 'dotted') dashArray = "2,4";
            else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
            const markSymbols = ["×", "○", "∙"];
            const stepAng = diff / n;
            for (let i = 1; i < n; i++) {
                const targetAng = angBA + diff * (i / n);
                const ex = B.x + len * Math.cos(targetAng); const ey = B.y + len * Math.sin(targetAng);
                const group = document.createElementNS(ns, "g");
                group.setAttribute('class', 'shape group'); group.setAttribute('data-tool', 'line');
                group.setAttribute('data-fixed-angle', targetAng);
                const visLine = document.createElementNS(ns, "line");
                visLine.setAttribute('x1', B.x); visLine.setAttribute('y1', B.y); visLine.setAttribute('x2', ex); visLine.setAttribute('y2', ey);
                visLine.setAttribute('class', 'visible-line');
                visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; pointer-events:none;`;
                const hitLine = document.createElementNS(ns, "line");
                hitLine.setAttribute('x1', B.x); hitLine.setAttribute('y1', B.y); hitLine.setAttribute('x2', ex); hitLine.setAttribute('y2', ey);
                hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
                group.appendChild(hitLine); group.appendChild(visLine);
                shapesLayer.appendChild(group);
                newlyCreated = group;
                createdLines.push(group);
            }
            for (let i = 0; i < n; i++) {
                const markAng = angBA + stepAng * (i + 0.5);
                const markDist = 45;
                const mx = B.x + markDist * Math.cos(markAng); const my = B.y + markDist * Math.sin(markAng);
                const txt = document.createElementNS(ns, "text");
                txt.textContent = markSymbols[0]; txt.setAttribute('x', mx); txt.setAttribute('y', my);
                txt.setAttribute('class', 'shape vertex-label'); txt.setAttribute('data-tool', 'text');
                txt.setAttribute('data-owner-shape', target.id);
                txt.style.cssText = "font-size:16px; fill:#c0392b; text-anchor:middle; dominant-baseline:central; cursor:move;";
                shapesLayer.appendChild(txt);
            }
            saveState();
            if (isContinuousMarking) {
                statusText.innerText = `已建立角 ${n} 等分線 (連續模式)`;
                deselectAll(); createdLines.forEach(l => addToSelection(l));
            } else {
                statusText.innerText = `已建立角 ${n} 等分線`;
                setMode('select'); deselectAll(); createdLines.forEach(l => addToSelection(l));
            }
        });
    } else if (constructionModeType === 'parallel') {
        if (constructionStep === 0) {
            if (!targetShape) { statusText.innerText = "請點擊一條線段"; return; }
            const pts = getTransformedPoints(targetShape);
            if (pts.length < 2) { statusText.innerText = "無效線段"; return; }
            let p1 = pts[0], p2 = pts[1];
            const tool = targetShape.getAttribute('data-tool');
            if (pts.length > 2) {
                let minDst = Infinity; let bestIdx = -1;
                const loopLimit = (tool === 'polyline' || tool === 'angle') ? pts.length - 1 : pts.length;
                for (let i = 0; i < loopLimit; i++) {
                    const a = pts[i]; const b = pts[(i + 1) % pts.length];
                    const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                    if (d < minDst) { minDst = d; bestIdx = i; }
                }
                if (bestIdx !== -1) { p1 = pts[bestIdx]; p2 = pts[(bestIdx + 1) % pts.length]; }
            }
            tempConstructionSource = { p1, p2 };
            constructionStep = 1;
            const msg = "步驟 2/2 - 請點擊位置放置平行線";
            statusText.innerText = msg;
            window.showToolTipImmediate(msg);
            createStep1Highlight('parallel', tempConstructionSource);
        } else if (constructionStep === 1) {
            const src = tempConstructionSource;
            const isSrcHorizontal = Math.abs(src.p1.y - src.p2.y) < 1;
            const oldCy = (src.p1.y + src.p2.y) / 2;
            const newCy = isSrcHorizontal ? clickY : oldCy;
            const newCx = clickX;
            const dx = src.p2.x - src.p1.x;
            const dy = src.p2.y - src.p1.y;
            const newP1 = { x: newCx - dx / 2, y: newCy - dy / 2 };
            const newP2 = { x: newCx + dx / 2, y: newCy + dy / 2 };
            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group'); group.setAttribute('data-tool', 'line'); group.setAttribute('data-sub-tool', 'line-simple');
            const strokeColor = document.getElementById('stroke-color-select').value || '#000000';
            const lineStyleVal = document.getElementById('line-style-select').value || 'solid';
            let dashArray = "none";
            if (lineStyleVal === 'dashed') dashArray = "8,5";
            else if (lineStyleVal === 'dotted') dashArray = "2,4";
            else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('x1', newP1.x); hitLine.setAttribute('y1', newP1.y); hitLine.setAttribute('x2', newP2.x); hitLine.setAttribute('y2', newP2.y);
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('x1', newP1.x); visLine.setAttribute('y1', newP1.y); visLine.setAttribute('x2', newP2.x); visLine.setAttribute('y2', newP2.y);
            visLine.setAttribute('class', 'visible-line');
            visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; fill:none; vector-effect:non-scaling-stroke; pointer-events:none;`;
            group.appendChild(hitLine); group.appendChild(visLine);
            shapesLayer.appendChild(group);
            newlyCreated = group;
            saveState();
            clearStep1Highlight();
            if (isContinuousMarking) {
                statusText.innerText = "已建立平行線 (連續模式)";
                constructionStep = 0; tempConstructionSource = null;
                deselectAll(); addToSelection(group);
            } else {
                statusText.innerText = "已建立平行線";
                constructionStep = 0; tempConstructionSource = null;
                setMode('select'); deselectAll(); addToSelection(group);
            }
        }
    } else if (constructionModeType === 'tangent') {
        if (constructionStep === 0) {
            if (targetShape && (tool === 'circle' || targetShape.getAttribute('data-sub-tool') === 'circle')) {
                tempConstructionSource = targetShape;
                constructionStep = 1;
                const msg = "步驟 2/2 - 請點擊圓外任意位置";
                statusText.innerText = msg;
                window.showToolTipImmediate(msg);
                createStep1Highlight('tangent', targetShape);
            } else { statusText.innerText = "這不是圓形，請點擊圓形"; }
        } else if (constructionStep === 1) {
            const circle = tempConstructionSource;
            const getAbsCenter = (el) => {
                const m = el.getCTM();
                const cx = +el.getAttribute('cx');
                const cy = +el.getAttribute('cy');
                return { x: cx * m.a + cy * m.c + m.e, y: cx * m.b + cy * m.d + m.f };
            };
            const cPos = getAbsCenter(circle);
            const r = +circle.getAttribute('rx') * circle.getCTM().a;
            let px = clickX, py = clickY;
            if (targetShape && tool === 'point') {
                const pPos = getAbsCenter(targetShape);
                px = pPos.x; py = pPos.y;
            }
            const dx = px - cPos.x;
            const dy = py - cPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < r) { statusText.innerText = "點在圓內，無法作切線。"; return; }
            const baseAngle = Math.atan2(dy, dx);
            const offsetAngle = Math.acos(r / dist);
            const a1 = baseAngle + offsetAngle;
            const a2 = baseAngle - offsetAngle;
            const t1 = { x: cPos.x + r * Math.cos(a1), y: cPos.y + r * Math.sin(a1) };
            const t2 = { x: cPos.x + r * Math.cos(a2), y: cPos.y + r * Math.sin(a2) };
            const poly = document.createElementNS(ns, "polyline");
            const pointsStr = `${t1.x},${t1.y} ${px},${py} ${t2.x},${t2.y}`;
            poly.setAttribute('points', pointsStr); poly.setAttribute('class', 'shape');
            poly.setAttribute('data-tool', 'tangent');
            if (!circle.id) circle.id = 'circle-' + Date.now();
            poly.setAttribute('data-circle-id', circle.id);
            poly.style.cssText = "stroke:#8e44ad; stroke-width:1; fill:none; vector-effect:non-scaling-stroke;";
            shapesLayer.appendChild(poly);
            saveState();
            clearStep1Highlight();
            if (isContinuousMarking) {
                statusText.innerText = "已建立切線 (連續模式)";
                constructionStep = 0; tempConstructionSource = null;
                deselectAll(); addToSelection(poly);
            } else {
                statusText.innerText = "已建立切線";
                constructionStep = 0; tempConstructionSource = null;
                setMode('select'); deselectAll(); addToSelection(poly);
            }
        }
    } else if (constructionModeType === 'perpendicular_point' || constructionModeType === 'median_line') {
        if (constructionStep === 0) {
            const getSmartCoord = (shape, cx, cy) => {
                if (!shape) return { x: cx, y: cy };
                const t = shape.getAttribute('data-tool');
                const st = shape.getAttribute('data-sub-tool');
                if (t === 'point' || st === 'circle') {
                    const m = shape.getCTM();
                    const sx = +shape.getAttribute('cx');
                    const sy = +shape.getAttribute('cy');
                    return { x: sx * m.a + sy * m.c + m.e, y: sx * m.b + sy * m.d + m.f };
                }
                const pts = getTransformedPoints(shape);
                if (pts.length > 0) {
                    let minDst = Infinity; let bestPt = null;
                    pts.forEach(p => { const d = Math.hypot(p.x - cx, p.y - cy); if (d < minDst) { minDst = d; bestPt = p; } });
                    if (minDst < 20) return bestPt;
                }
                return { x: cx, y: cy };
            };
            const pt = getSmartCoord(targetShape, clickX, clickY);
            tempConstructionSource = pt;
            constructionStep = 1;
            const msg = "步驟 2/2 - 請點擊目標線段";
            statusText.innerText = msg;
            window.showToolTipImmediate(msg);
            createStep1Highlight('connect_points', pt);
            return;
        } else if (constructionStep === 1) {
            if (!targetShape) { statusText.innerText = "請點擊一條線段"; return; }
            const pts = getTransformedPoints(targetShape);
            let p1, p2;
            const tool = targetShape.getAttribute('data-tool');
            if (tool === 'line' && pts.length >= 2) { p1 = pts[0]; p2 = pts[1]; }
            else if (pts.length >= 2) {
                let minDst = Infinity; let bestIdx = -1;
                const loopLimit = (tool === 'polyline' || tool === 'angle') ? pts.length - 1 : pts.length;
                for (let i = 0; i < loopLimit; i++) {
                    const a = pts[i]; const b = pts[(i + 1) % pts.length];
                    const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                    if (d < minDst) { minDst = d; bestIdx = i; }
                }
                if (bestIdx !== -1) { p1 = pts[bestIdx]; p2 = pts[(bestIdx + 1) % pts.length]; }
            }
            if (!p1 || !p2) { statusText.innerText = "無效的線段，請重新選擇"; return; }
            const startPt = tempConstructionSource;
            const createdObjs = [];
            const strokeColor = document.getElementById('stroke-color-select').value || '#000000';
            if (constructionModeType === 'perpendicular_point') {
                const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                const mag2 = dx * dx + dy * dy;
                const apx = startPt.x - p1.x; const apy = startPt.y - p1.y;
                const t = (apx * dx + apy * dy) / mag2;
                const hx = p1.x + t * dx; const hy = p1.y + t * dy;
                const linePH = document.createElementNS(ns, "line");
                linePH.setAttribute('x1', startPt.x); linePH.setAttribute('y1', startPt.y);
                linePH.setAttribute('x2', hx); linePH.setAttribute('y2', hy);
                linePH.setAttribute('class', 'shape visible-line'); linePH.setAttribute('data-tool', 'line');
                linePH.style.cssText = `stroke:${strokeColor}; stroke-width:2;`;
                shapesLayer.appendChild(linePH); createdObjs.push(linePH);
                const distPH = Math.hypot(startPt.x - hx, startPt.y - hy);
                const vec_Vx = (distPH > 0) ? (startPt.x - hx) / distPH : 0;
                const vec_Vy = (distPH > 0) ? (startPt.y - hy) / distPH : 0;
                let dirX = 0, dirY = 0;
                if (t < 0) {
                    const extLine = document.createElementNS(ns, "line");
                    extLine.setAttribute('class', 'shape visible-line'); extLine.setAttribute('data-tool', 'line');
                    extLine.style.cssText = `stroke:${strokeColor}; stroke-width:1.5; stroke-dasharray:5,3;`;
                    extLine.setAttribute('x1', hx); extLine.setAttribute('y1', hy); extLine.setAttribute('x2', p1.x); extLine.setAttribute('y2', p1.y);
                    shapesLayer.appendChild(extLine); createdObjs.push(extLine);
                    dirX = p1.x - hx; dirY = p1.y - hy;
                } else if (t > 1) {
                    const extLine = document.createElementNS(ns, "line");
                    extLine.setAttribute('class', 'shape visible-line'); extLine.setAttribute('data-tool', 'line');
                    extLine.style.cssText = `stroke:${strokeColor}; stroke-width:1.5; stroke-dasharray:5,3;`;
                    extLine.setAttribute('x1', hx); extLine.setAttribute('y1', hy); extLine.setAttribute('x2', p2.x); extLine.setAttribute('y2', p2.y);
                    shapesLayer.appendChild(extLine); createdObjs.push(extLine);
                    dirX = p2.x - hx; dirY = p2.y - hy;
                } else {
                    dirX = p1.x - hx; dirY = p1.y - hy;
                    if (Math.abs(dirX) < 0.1 && Math.abs(dirY) < 0.1) { dirX = p2.x - hx; dirY = p2.y - hy; }
                }
                const distDir = Math.hypot(dirX, dirY);
                const vec_Hx = (distDir > 0) ? dirX / distDir : 0;
                const vec_Hy = (distDir > 0) ? dirY / distDir : 0;
                const size = 12;
                const pAx = hx + vec_Vx * size; const pAy = hy + vec_Vy * size;
                const pCx = hx + vec_Hx * size; const pCy = hy + vec_Hy * size;
                const pBx = hx + vec_Vx * size + vec_Hx * size; const pBy = hy + vec_Vy * size + vec_Hy * size;
                const markG = document.createElementNS(ns, "g");
                markG.setAttribute('class', 'shape'); markG.setAttribute('data-tool', 'group');
                const hitPath = document.createElementNS(ns, "polyline");
                hitPath.setAttribute('points', `${pAx},${pAy} ${pBx},${pBy} ${pCx},${pCy}`);
                hitPath.setAttribute('class', 'hit-line'); hitPath.style.cssText = "stroke:transparent; stroke-width:10; fill:none; cursor:pointer;";
                markG.appendChild(hitPath);
                const markPath = document.createElementNS(ns, "polyline");
                markPath.setAttribute('points', `${pAx},${pAy} ${pBx},${pBy} ${pCx},${pCy}`);
                markPath.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none; vector-effect:non-scaling-stroke;";
                markG.appendChild(markPath);
                shapesLayer.appendChild(markG); createdObjs.push(markG);
                statusText.innerText = "已建立垂直線與標註";
            } else if (constructionModeType === 'median_line') {
                const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
                const linePM = document.createElementNS(ns, "line");
                linePM.setAttribute('x1', startPt.x); linePM.setAttribute('y1', startPt.y);
                linePM.setAttribute('x2', mx); linePM.setAttribute('y2', my);
                linePM.setAttribute('class', 'shape visible-line'); linePM.setAttribute('data-tool', 'line');
                linePM.style.cssText = `stroke:${strokeColor}; stroke-width:2;`;
                shapesLayer.appendChild(linePM); createdObjs.push(linePM);
                const createTick = (cx, cy, angleDeg) => {
                    const tickG = document.createElementNS(ns, "g");
                    tickG.setAttribute('transform', `translate(${cx}, ${cy}) rotate(${angleDeg})`);
                    tickG.setAttribute('class', 'shape'); tickG.setAttribute('data-tool', 'group');
                    const path = document.createElementNS(ns, "path");
                    path.setAttribute('d', "M -3 -6 L -3 6 M 3 -6 L 3 6");
                    path.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none;";
                    tickG.appendChild(path);
                    return tickG;
                };
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                const amX = (p1.x + mx) / 2; const amY = (p1.y + my) / 2;
                const tick1 = createTick(amX, amY, angle); shapesLayer.appendChild(tick1); createdObjs.push(tick1);
                const mbX = (mx + p2.x) / 2; const mbY = (my + p2.y) / 2;
                const tick2 = createTick(mbX, mbY, angle); shapesLayer.appendChild(tick2); createdObjs.push(tick2);
                statusText.innerText = "已建立中線與等長標註";
            }
            saveState();
            clearStep1Highlight();
            if (isContinuousMarking) { constructionStep = 0; tempConstructionSource = null; deselectAll(); }
            else { constructionStep = 0; tempConstructionSource = null; setMode('select'); deselectAll(); createdObjs.forEach(o => addToSelection(o)); }
            return;
        }
    } else if (constructionModeType === 'connect_points') {
        const getSmartCoord = (shape, cx, cy) => {
            if (!shape) return { x: cx, y: cy };
            const t = shape.getAttribute('data-tool');
            const st = shape.getAttribute('data-sub-tool');
            if (t === 'point' || st === 'circle') {
                const m = shape.getCTM();
                const sx = +shape.getAttribute('cx') || 0;
                const sy = +shape.getAttribute('cy') || 0;
                return { x: sx * m.a + sy * m.c + m.e, y: sx * m.b + sy * m.d + m.f };
            }
            const pts = getTransformedPoints(shape);
            if (pts.length > 0) {
                let minDst = Infinity; let bestPt = null;
                pts.forEach(p => { const d = Math.hypot(p.x - cx, p.y - cy); if (d < minDst) { minDst = d; bestPt = p; } });
                if (minDst < 20) return bestPt;
            }
            return { x: cx, y: cy };
        };
        const pt = getSmartCoord(targetShape, clickX, clickY);
        if (constructionStep === 0) {
            tempConstructionSource = pt;
            constructionStep = 1;
            const msg = "步驟 2/2 - 請點擊第二個位置";
            statusText.innerText = msg;
            window.showToolTipImmediate(msg);
            createStep1Highlight('connect_points', pt);
        } else if (constructionStep === 1) {
            const startPt = tempConstructionSource;
            const endPt = pt;
            if (Math.hypot(startPt.x - endPt.x, startPt.y - endPt.y) < 1) { statusText.innerText = "距離太近，請點選其他位置"; return; }
            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group'); group.setAttribute('data-tool', 'line');
            const strokeColor = document.getElementById('stroke-color-select').value || '#000000';
            const lineStyleVal = document.getElementById('line-style-select').value || 'solid';
            let dashArray = "none";
            if (lineStyleVal === 'dashed') dashArray = "8,5";
            else if (lineStyleVal === 'dotted') dashArray = "2,4";
            else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('x1', startPt.x); hitLine.setAttribute('y1', startPt.y);
            hitLine.setAttribute('x2', endPt.x); hitLine.setAttribute('y2', endPt.y);
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('x1', startPt.x); visLine.setAttribute('y1', startPt.y);
            visLine.setAttribute('x2', endPt.x); visLine.setAttribute('y2', endPt.y);
            visLine.setAttribute('class', 'visible-line');
            visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; fill:none; vector-effect:non-scaling-stroke; pointer-events:none;`;
            group.appendChild(hitLine); group.appendChild(visLine);
            shapesLayer.appendChild(group);
            newlyCreated = group;
            saveState();
            clearStep1Highlight();
            if (isContinuousMarking) { constructionStep = 0; tempConstructionSource = null; deselectAll(); addToSelection(group); }
            else { constructionStep = 0; tempConstructionSource = null; setMode('select'); deselectAll(); addToSelection(group); }
        }
    }
    if (newlyCreated) {
        if (document.getElementById('auto-label-check').checked) { generateLabels(newlyCreated); }
        if (document.getElementById('auto-angle-label-check').checked) { generateAngleLabels(newlyCreated, true); }
    }
}
function createCircleAngleGroup(type, ownerCircle, points) {
    const group = document.createElementNS(ns, "g");
    group.setAttribute("class", "shape group");
    group.setAttribute("data-tool", "group");
    group.setAttribute("data-sub-tool", type);
    if (!ownerCircle.id) ownerCircle.id = 'circle-' + Date.now();
    group.setAttribute("data-owner-circle-id", ownerCircle.id);
    points.forEach((p, i) => {
        const dataNode = createSVGElement('circle', {
            'class': 'vertex-data',
            'cx': p.x,
            'cy': p.y,
            'data-index': i
        });
        dataNode.style.display = 'none';
        group.appendChild(dataNode);
    });
    redrawCircleAngle(group);
    return group;
}
function redrawCircleAngle(group) {
    const type = group.getAttribute('data-sub-tool');
    const ownerCircle = document.getElementById(group.getAttribute('data-owner-circle-id'));
    if (!ownerCircle) return;
    if (!group.id) group.id = 'group-' + Date.now() + Math.random().toString(36).substr(2, 5);
    Array.from(group.querySelectorAll('.visible-line, .tangent-line')).forEach(el => el.remove());
    const oldArc = document.querySelector(`.angle-arc[data-owner="${group.id}"]`);
    if (oldArc) oldArc.remove();
    const dataNodes = Array.from(group.querySelectorAll('.vertex-data'));
    const strokeStyle = `stroke:#1abc9c; stroke-width:2; vector-effect:non-scaling-stroke;`;
    let L_center, L_pStart, L_pEnd;
    if (type === 'central-angle') {
        L_center = { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') };
        L_pStart = { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') };
        L_pEnd = { x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy') };
    }
    else if (type === 'inscribed-angle') {
        L_pStart = { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') };
        L_center = { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') };
        L_pEnd = { x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy') };
    }
    else if (type === 'tangent-chord-angle') {
        L_pStart = { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') };
        L_center = { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') };
        const mCircle = ownerCircle.getCTM();
        const C = { x: (+ownerCircle.getAttribute('cx')) * mCircle.a + mCircle.e, y: (+ownerCircle.getAttribute('cy')) * mCircle.d + mCircle.f };
        const mGroup = group.getCTM();
        const G_P = { x: L_center.x * mGroup.a + mGroup.e, y: L_center.y * mGroup.d + mGroup.f };
        const dx = G_P.x - C.x, dy = G_P.y - C.y;
        const tangentVec = { x: -dy, y: dx };
        const invM = mGroup.inverse();
        L_pEnd = {
            x: L_center.x + (tangentVec.x * invM.a),
            y: L_center.y + (tangentVec.y * invM.d)
        };
    }
    group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pStart.x, y2: L_pStart.y, style: strokeStyle }));
    group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pEnd.x, y2: L_pEnd.y, style: strokeStyle }));
}
function updateTriangleConstruction(group, pts) {
    if (!pts || pts.length !== 3) return;
    group.removeAttribute('transform');
    const type = group.getAttribute('data-construction-type');
    const centers = getTriangleCenters(pts[0], pts[1], pts[2]);
    const data = (type === 'circumcenter') ? centers.circum :
        (type === 'incenter') ? centers.in : centers.centroid;
    group.innerHTML = '';
    const colorAuxLine = '#7f8c8d';
    const colorMark = '#e74c3c';
    const colorCircum = '#2980b9';
    const colorIn = '#27ae60';
    const colorDot = '#2c3e50';
    const createSelectableLine = (x1, y1, x2, y2, isDash = true) => {
        const hitLine = document.createElementNS(ns, "line");
        hitLine.setAttribute('x1', x1); hitLine.setAttribute('y1', y1); hitLine.setAttribute('x2', x2); hitLine.setAttribute('y2', y2);
        hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:12; cursor:move;";
        group.appendChild(hitLine);
        const visLine = document.createElementNS(ns, "line");
        visLine.setAttribute('x1', x1); visLine.setAttribute('y1', y1); visLine.setAttribute('x2', x2); visLine.setAttribute('y2', y2);
        visLine.style.cssText = `stroke:${colorAuxLine}; stroke-width:1.2; ${isDash ? 'stroke-dasharray:4,4;' : ''} vector-effect:non-scaling-stroke; pointer-events:none;`;
        group.appendChild(visLine);
    };
    const centerPoint = document.createElementNS(ns, "circle");
    centerPoint.setAttribute('cx', data.x); centerPoint.setAttribute('cy', data.y); centerPoint.setAttribute('r', 4);
    centerPoint.style.cssText = `fill:${colorDot}; stroke:transparent; stroke-width:10; cursor:move;`;
    group.appendChild(centerPoint);
    if (type === 'circumcenter') {
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute('cx', data.x); circle.setAttribute('cy', data.y); circle.setAttribute('r', data.r);
        circle.style.cssText = `fill:none; stroke:${colorCircum}; stroke-width:1.5; stroke-dasharray:4,4; pointer-events:visibleStroke; cursor:move;`;
        group.appendChild(circle);
        const edges = [[pts[0], pts[1]], [pts[1], pts[2]], [pts[2], pts[0]]];
        edges.forEach(e => {
            const mx = (e[0].x + e[1].x) / 2; const my = (e[0].y + e[1].y) / 2;
            const distToCenter = Math.hypot(data.x - mx, data.y - my);
            if (distToCenter < 1.0) { return; }
            createSelectableLine(mx, my, data.x, data.y);
            const size = 10; const dx = e[1].x - e[0].x; const dy = e[1].y - e[0].y;
            const len = Math.hypot(dx, dy); const ux = dx / len; const uy = dy / len;
            const nx = -uy; const ny = ux;
            const vcx = data.x - mx; const vcy = data.y - my;
            const dot = vcx * nx + vcy * ny; const side = dot > 0 ? 1 : -1;
            const p1 = { x: mx + ux * size, y: my + uy * size };
            const p2 = { x: mx + ux * size + nx * size * side, y: my + uy * size + ny * size * side };
            const p3 = { x: mx + nx * size * side, y: my + ny * size * side };
            const ra = document.createElementNS(ns, "polyline");
            ra.setAttribute("points", `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
            ra.style.cssText = `fill:none; stroke:${colorMark}; stroke-width:1.5; pointer-events:none;`;
            group.appendChild(ra);
        });
    } else if (type === 'incenter') {
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute('cx', data.x); circle.setAttribute('cy', data.y); circle.setAttribute('r', data.r);
        circle.style.cssText = `fill:none; stroke:${colorIn}; stroke-width:1.5; stroke-dasharray:4,4; pointer-events:visibleStroke; cursor:move;`;
        group.appendChild(circle);
        const symbols = ['circle', 'cross', 'equal'];
        pts.forEach((v, i) => {
            createSelectableLine(v.x, v.y, data.x, data.y);
            const pPrev = pts[(i + 2) % 3]; const pNext = pts[(i + 1) % 3];
            const a1 = Math.atan2(pPrev.y - v.y, pPrev.x - v.x); const a2 = Math.atan2(pNext.y - v.y, pNext.x - v.x);
            const angBisect = Math.atan2(data.y - v.y, data.x - v.x);
            let totalAngle = a2 - a1;
            while (totalAngle <= -Math.PI) totalAngle += 2 * Math.PI;
            while (totalAngle > Math.PI) totalAngle -= 2 * Math.PI;
            totalAngle = Math.abs(totalAngle);
            const dist = 32; const offset = totalAngle / 4;
            const markAngles = [angBisect - offset, angBisect + offset];
            const sym = symbols[i];
            markAngles.forEach(ma => {
                const mx = v.x + Math.cos(ma) * dist; const my = v.y + Math.sin(ma) * dist;
                if (sym === 'circle') {
                    const c = document.createElementNS(ns, "circle");
                    c.setAttribute("cx", mx); c.setAttribute("cy", my); c.setAttribute("r", 3);
                    c.style.cssText = `fill:none; stroke:${colorMark}; stroke-width:1.2;`;
                    group.appendChild(c);
                } else if (sym === 'cross') {
                    const p = document.createElementNS(ns, "path");
                    const s = 3; p.setAttribute("d", `M ${mx-s} ${my-s} L ${mx+s} ${my+s} M ${mx+s} ${my-s} L ${mx-s} ${my+s}`);
                    p.style.cssText = `stroke:${colorMark}; stroke-width:1.5;`;
                    group.appendChild(p);
                } else if (sym === 'equal') {
                    const lineLen = 3.5; const lineGap = 2;
                    const tnx = -Math.sin(ma); const tny = Math.cos(ma);
                    const dx = Math.cos(ma) * lineGap; const dy = Math.sin(ma) * lineGap;
                    for (let n = -1; n <= 1; n += 2) {
                        const shiftX = (n * dx) / 2; const shiftY = (n * dy) / 2;
                        const l = document.createElementNS(ns, "line");
                        l.setAttribute("x1", mx + shiftX - tnx * lineLen); l.setAttribute("y1", my + shiftY - tny * lineLen);
                        l.setAttribute("x2", mx + shiftX + tnx * lineLen); l.setAttribute("y2", my + shiftY + tny * lineLen);
                        l.style.cssText = `stroke:${colorMark}; stroke-width:1.5; stroke-linecap:round;`;
                        group.appendChild(l);
                    }
                }
            });
        });
    } else if (type === 'centroid') {
        pts.forEach((v, i) => {
            const p1 = pts[(i + 1) % 3]; const p2 = pts[(i + 2) % 3];
            const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
            createSelectableLine(v.x, v.y, mx, my);
            const count = i + 1; const dx = p2.x - p1.x; const dy = p2.y - p1.y;
            const ang = Math.atan2(dy, dx); const nx = -Math.sin(ang); const ny = Math.cos(ang);
            const tickLen = 6, tickGap = 3.5;
            const positions = [{ x: (p1.x + mx) / 2, y: (p1.y + my) / 2 }, { x: (p2.x + mx) / 2, y: (p2.y + my) / 2 }];
            positions.forEach(pos => {
                for (let n = 0; n < count; n++) {
                    const shift = (n - (count - 1) / 2) * tickGap;
                    const tx = pos.x + Math.cos(ang) * shift; const ty = pos.y + Math.sin(ang) * shift;
                    const tick = document.createElementNS(ns, "line");
                    tick.setAttribute("x1", tx - nx * tickLen); tick.setAttribute("y1", ty - ny * tickLen);
                    tick.setAttribute("x2", tx + nx * tickLen); tick.setAttribute("y2", ty + ny * tickLen);
                    tick.style.cssText = `stroke:${colorMark}; stroke-width:1.8; pointer-events:none;`;
                    group.appendChild(tick);
                }
            });
        });
    }
}