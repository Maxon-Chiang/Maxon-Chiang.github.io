function findIntersectionsForShape(targetShape) {
    const results = [];
    const targetGeo = extractGeometry(targetShape); // 使用 utils.js 的函式提取幾何
    if (!targetGeo) return results;

    const allShapes = document.querySelectorAll('#shapes-layer .shape');
    
    allShapes.forEach(other => {
        // 排除自己、文字、標記、群組外框
        const tTool = other.getAttribute('data-tool');
        if (other === targetShape || tTool === 'text' || tTool === 'math' || tTool === 'mark' || tTool === 'group' || other.classList.contains('vertex-label')) return;
        
        const otherGeo = extractGeometry(other);
        if (!otherGeo) return;

        // 1. 線段 vs 線段
        targetGeo.segments.forEach(s1 => {
            otherGeo.segments.forEach(s2 => {
                const pt = getLineLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
                if (pt) results.push(pt);
            });
        });

        // 2. 線段 vs 圓
        targetGeo.segments.forEach(s1 => {
            otherGeo.circles.forEach(c2 => {
                const pts = getLineCircleIntersections(s1.p1, s1.p2, c2.center, c2.r);
                pts.forEach(p => results.push(p));
            });
        });
        targetGeo.circles.forEach(c1 => {
            otherGeo.segments.forEach(s2 => {
                const pts = getLineCircleIntersections(s2.p1, s2.p2, c1.center, c1.r);
                pts.forEach(p => results.push(p));
            });
        });

        // 3. 圓 vs 圓
        targetGeo.circles.forEach(c1 => {
            otherGeo.circles.forEach(c2 => {
                const pts = getCircleCircleIntersections(c1.center, c1.r, c2.center, c2.r);
                pts.forEach(p => results.push(p));
            });
        });
    });

    return results;
}

function setShape(value, continuous = false) {
    if (window.anchorPoint && (value === 'point' || value === 'solid-blocks')) {
        const ax = window.anchorPoint.x;
        const ay = window.anchorPoint.y;
        window.clearAnchorPoint();
        
        if (value === 'point') {
            currentTool = 'point';
            currentSubTool = 'point';
            const strokeColor = document.getElementById('stroke-color-select')?.value || "#000000";
            let pointRadius = 3;
            let isSolid = true;
            const cachedPoint = localStorage.getItem('math_editor_param_point');
            if (cachedPoint) {
                try {
                    const savedVals = JSON.parse(cachedPoint);
                    if (savedVals.p_r) pointRadius = parseFloat(savedVals.p_r);
                    if (savedVals.p_solid !== undefined) isSolid = savedVals.p_solid;
                } catch(e) {}
            }
            const shape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
            shape.setAttribute('cx', ax); shape.setAttribute('cy', ay);
            shape.setAttribute('rx', pointRadius); shape.setAttribute('ry', pointRadius);
            shape.setAttribute('data-solid', isSolid ? '1' : '0');
            shape.style.cssText = `stroke: ${strokeColor}; stroke-width: 1.5px; fill: ${isSolid ? strokeColor : 'white'}; vector-effect: non-scaling-stroke; cursor: move;`;
            shape.setAttribute('class', 'shape');
            shape.setAttribute('data-tool', 'point');
            shape.setAttribute('data-sub-tool', 'point');
            shapesLayer.appendChild(shape);
            if (typeof saveState === 'function') saveState();
            
            setMode('select');
            deselectAll();
            addToSelection(shape);
            return;
        } else if (value === 'solid-blocks') {
            if (typeof window.createSolidBlocks === 'function') {
                const blockGroup = window.createSolidBlocks(ax, ay, null);
                if (typeof saveState === 'function') saveState();
                setTimeout(() => { 
                    setMode('select'); 
                    deselectAll(); 
                    addToSelection(blockGroup); 
                }, 50);
            }
            return;
        }
    }
    currentSubTool = value;
    document.querySelectorAll('.shape-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.shape-btn[onclick*="'${value}'"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    if (value === 'polygon-regular') {
        openNumberInputModal("設定正多邊形邊數 (3 ~ 12)", polygonSides || "5", (val) => {
            let n = parseInt(val);
            if (isNaN(n) || n < 3) n = 3;
            if (n > 12) n = 12; 
            polygonSides = n;
            setMode('draw', 'polygon');
            let status = `正多邊形 (${polygonSides}邊)：請在畫布拖曳繪製`;
            if (continuous) {
                status += " (連續模式)";
                isContinuousDraw = true;
            }
            statusText.innerText = status;
        });
        return; 
    }

    // 依據 value 設定對應的工具模式 (tool)
    if (value === 'point') {
        setMode('draw', 'point');
    } else if (value === 'solid-blocks') {
        setMode('draw', 'blocks');
        statusText.innerText = "立體積木：請在畫布空白處「點擊一下」放置積木底盤";
    } else if (value.startsWith('line')) {
        setMode('draw', 'line');
    } else if (value === 'angle') {
        setMode('draw', 'angle');
    } else if (value === 'circle' || value === 'ellipse' || value === 'sector' || value === 'arc' || value === 'arch') {
        setMode('draw', 'ellipse');
    } else if (value.startsWith('solid-')) {
        setMode('draw', 'solid');
    } else if (value === 'freehand') {
        setMode('draw', 'freehand');
    
    // 【關鍵修正】這裡補上 polyline 的判斷
    } else if (value === 'polyline') {
        setMode('draw', 'polyline');
        statusText.innerText = "連續折線：左鍵點擊畫點，右鍵或 ESC 結束";
        
    } else {
        // 預設為多邊形 (rect, square, polygon-regular 等)
        setMode('draw', 'polygon');
    }

    isContinuousDraw = continuous;
    if (isContinuousDraw) {
        statusText.innerText += " (連續繪圖模式：按右鍵或選取工具結束)";
    }
}

function executeSymmetryReflection(axisShape) {
    if (selectedElements.length === 0) {
        statusText.innerText = "❌ 錯誤：沒有選取任何物件";
        return;
    }
    
    // 取得對稱軸的絕對座標
    let p1, p2;
    const axisPts = getTransformedPoints(axisShape);
    if (axisPts.length >= 2) {
        p1 = axisPts[0]; p2 = axisPts[1];
    } else {
        return;
    }

    // 確保對稱軸有 ID (作為連動的主人之一)
    if (!axisShape.id) axisShape.id = 'axis-' + Date.now() + Math.random().toString(36).substr(2, 5);

    const symGroupId = 'sym-grp-' + Date.now(); // 該次對稱操作的共同群組代號
    const newShapes =[];

    // 暫存目前的選取名單，避免處理過程中被污染
    const originals = [...selectedElements];

    origLoop: for (let i = 0; i < originals.length; i++) {
        const el = originals[i];
        // 避免拿對稱軸自己來對稱自己
        if (el.id === axisShape.id) continue;
        // 避免拿對稱輔助線來對稱
        if (el.getAttribute('data-dependency-type') === 'symmetry_connector') continue;

        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();
        
        // 1. 複製並設定關聯屬性
        const clone = el.cloneNode(true);
        const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        clone.id = newId;
        clone.classList.remove('selected');
        
        // 清除舊的附屬關聯
        if (clone.hasAttribute('data-label-ids')) clone.removeAttribute('data-label-ids');
        if (clone.hasAttribute('data-angle-label-ids')) clone.removeAttribute('data-angle-label-ids');
        if (clone.hasAttribute('data-intersection-lines')) clone.removeAttribute('data-intersection-lines');

        // 【核心設定】：設定連動依賴屬性 (雙主人：原圖 & 對稱軸)
        if (!el.id) el.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        clone.setAttribute('data-owner-shape', el.id);
        clone.setAttribute('data-symmetry-axis', axisShape.id);
        clone.setAttribute('data-dependency-type', 'symmetry_shape');
        clone.setAttribute('data-sym-group', symGroupId);

        // 2. 幾何變換與虛線產生
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const axisAngle = Math.atan2(dy, dx);
        const axisDeg = axisAngle * 180 / Math.PI;

        const visualPoints = getTransformedPoints(el);
        const newPoints = visualPoints.map(p => getReflectedPoint(p, p1, axisAngle));
        
        // 產生獨立的對稱輔助線 (Connector)
        visualPoints.forEach((origPt, idx) => {
            const reflPt = newPoints[idx];
            
            const lineGroup = document.createElementNS(ns, "g");
            lineGroup.setAttribute('class', 'shape group symmetry-connector');
            lineGroup.setAttribute('data-tool', 'line');
            // 綁定屬性，使其可與原圖、對稱軸連動，並能被空白鍵群體控制
            lineGroup.setAttribute('data-owner-shape', el.id);
            lineGroup.setAttribute('data-symmetry-axis', axisShape.id);
            lineGroup.setAttribute('data-dependency-type', 'symmetry_connector');
            lineGroup.setAttribute('data-sym-group', symGroupId);
            lineGroup.setAttribute('data-vertex-index', idx);
            lineGroup.id = 'sym-conn-' + Date.now() + Math.random().toString(36).substr(2, 5) + idx;

            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute("x1", origPt.x); hitLine.setAttribute("y1", origPt.y);
            hitLine.setAttribute("x2", reflPt.x); hitLine.setAttribute("y2", reflPt.y);
            hitLine.setAttribute('class', 'hit-line');
            hitLine.style.cssText = "stroke: transparent; stroke-width: 10; cursor: pointer;";
            
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute("x1", origPt.x); visLine.setAttribute("y1", origPt.y);
            visLine.setAttribute("x2", reflPt.x); visLine.setAttribute("y2", reflPt.y);
            visLine.setAttribute('class', 'visible-line');
            visLine.style.cssText = "stroke: #7f8c8d; stroke-width: 1.5; stroke-dasharray: 5,5; pointer-events: none;";
            
            lineGroup.appendChild(hitLine);
            lineGroup.appendChild(visLine);
            shapesLayer.appendChild(lineGroup);
        });

        // 轉換對稱圖形本身
        if (tagName === 'polygon' || tagName === 'polyline' || tagName === 'line' || tool === 'line' || tool === 'polygon' || tool === 'polyline') {
            if (tagName === 'line' || tool === 'line') {
                if (clone.tagName === 'g') {
                    const lines = clone.querySelectorAll('line');
                    lines.forEach(l => {
                        l.setAttribute('x1', newPoints[0].x); l.setAttribute('y1', newPoints[0].y);
                        l.setAttribute('x2', newPoints[1].x); l.setAttribute('y2', newPoints[1].y);
                    });
                } else {
                    clone.setAttribute('x1', newPoints[0].x); clone.setAttribute('y1', newPoints[0].y);
                    clone.setAttribute('x2', newPoints[1].x); clone.setAttribute('y2', newPoints[1].y);
                }
            } else {
                const pointsStr = newPoints.map(p => `${p.x},${p.y}`).join(' ');
                clone.setAttribute('points', pointsStr);
            }
            clone.removeAttribute('transform');
        } else {
            const reflectTransform = `translate(${p1.x}, ${p1.y}) rotate(${axisDeg}) scale(1, -1) rotate(${-axisDeg}) translate(${-p1.x}, ${-p1.y})`;
            const currentTransform = clone.getAttribute('transform') || '';
            clone.setAttribute('transform', `${reflectTransform} ${currentTransform}`);
        }
        
        shapesLayer.appendChild(clone);
        newShapes.push(clone);
    }

    saveState();
    setMode('select');
    deselectAll();
    originals.forEach(s => {
        // 如果原始物件不是對稱軸本身，就將其加回選取
        if (s.id !== axisShape.id) {
            addToSelection(s);
        }
    });
    statusText.innerText = `✅ 已完成鏡像。選取灰色虛線並按【空白鍵】可統一隱藏。`;
}

// 【新增】實作形內線段的初始建立函式
window.createInternalLine = function(shape) {
    if (!shape || !shape.id) shape.id = 'poly-' + Date.now();
    const pts = getTransformedPoints(shape);
    if (pts.length < 3) return;

    // 預設將兩端點放在最左和最右的邊的中點上
    const e1 = 0;
    const e2 = Math.floor(pts.length / 2);
    const t1 = 0.5;
    const t2 = 0.5;

    const group = document.createElementNS(ns, "g");
    group.setAttribute('class', 'shape group');
    group.setAttribute('data-tool', 'line');
    group.id = 'intline-' + Date.now() + Math.random().toString(36).substr(2,5);
    group.setAttribute('data-owner-shape', shape.id);
    group.setAttribute('data-dependency-type', 'internal_line');
    group.setAttribute('data-e1', e1);
    group.setAttribute('data-t1', t1);
    group.setAttribute('data-e2', e2);
    group.setAttribute('data-t2', t2);

    const hitLine = document.createElementNS(ns, "line");
    hitLine.setAttribute('class', 'hit-line');
    hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
    
    const strokeColor = document.getElementById('stroke-color-select').value || '#2980b9';
    const lineStyleVal = document.getElementById('line-style-select').value || 'solid';
    let dashArray = "none";
    if (lineStyleVal === 'dashed') dashArray = "8,5";
    else if (lineStyleVal === 'dotted') dashArray = "2,4";
    
    const visLine = document.createElementNS(ns, "line");
    visLine.setAttribute('class', 'visible-line');
    visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; stroke-dasharray:${dashArray}; vector-effect:non-scaling-stroke; pointer-events:none;`;

    group.appendChild(hitLine);
    group.appendChild(visLine);
    document.getElementById('shapes-layer').appendChild(group);

    if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);

    saveState();
    setMode('select');
    deselectAll();
    addToSelection(group);
    statusText.innerText = "已建立形內線段 (可拖拉兩端點改變位置，支援右鍵長度標註)";
};

function toggleLabelOnSelection() {
    if (selectedElements.length === 0) {
        statusText.innerText = "請先選取要標註的圖形";
        return;
    }
    let addedCount = 0;
    let removedCount = 0;
    const savedLabelIndex = labelIndex;
    const inputEl = document.getElementById('label-start-input');
    const savedInputValue = inputEl ? inputEl.value : 'A';
	const labelColor = document.getElementById('stroke-color-select')?.value || "#c0392b";
    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        if (tool === 'text' || tool === 'math' || tool === 'mark' || el.classList.contains('vertex-label')) return;
        let hasLabel = false;
        const labelIds = el.getAttribute('data-label-ids');
        if (labelIds) {
            const ids = labelIds.split(',');
            if (ids.some(id => document.getElementById(id))) {
                hasLabel = true;
            }
        }
        if (hasLabel) {
            deleteLinkedLabels(el);
            removedCount++;
        } else {
            generateLabels(el, true, labelColor);
            addedCount++;
        }
    });
    labelIndex = savedLabelIndex;
    if (inputEl) inputEl.value = savedInputValue;
    if (addedCount > 0 || removedCount > 0) {
        saveState();
        statusText.innerText = `已新增 ${addedCount} 個標註，移除 ${removedCount} 個標註`;
    }
}

function addSmartMark(type) {
    if (selectedElements.length === 0) return false;
    const target = selectedElements[0];
    const tool = target.getAttribute('data-tool');
    const clickX = lastClickPos.x;
    const clickY = lastClickPos.y;
    const isMultiPart = (tool === 'polygon' || tool === 'angle' || tool === 'polyline' || tool === 'rect' || tool === 'tri');
    if (isMultiPart && !isDirectClick) {
        statusText.innerText = "無法判斷作用位置，請直接點擊目標位置";
        return false;
    }
    const SEARCH_RADIUS = 30;
    let bestTarget = null;
    let minDist = Infinity;
    const pts = getTransformedPoints(target);
    if (pts.length === 0) return false;

    if (type === 'edge') {
        const len = (tool === 'polygon' || tool === 'rect' || tool === 'tri') ? pts.length : pts.length - 1;
        for (let i = 0; i < len; i++) {
            const p1 = pts[i];
            const p2 = pts[(i + 1) % pts.length];
            const d = distToSegment(clickX, clickY, p1.x, p1.y, p2.x, p2.y);
            if (d < SEARCH_RADIUS && d < minDist) {
                minDist = d;
                bestTarget = { shape: target, type: 'edge', p1, p2 };
            }
        }
    } else if (type === 'angle') {
        pts.forEach((p, i) => {
            const d = Math.hypot(clickX - p.x, clickY - p.y);
            if (d < SEARCH_RADIUS && d < minDist) {
                if (tool !== 'line' && tool !== 'polyline') {
                     const prev = pts[(i - 1 + pts.length) % pts.length];
                     const next = pts[(i + 1) % pts.length];
                     minDist = d;
                     // 【修正】：記錄滑鼠到頂點的精確距離作為半徑
                     bestTarget = { shape: target, type: 'angle', A: prev, B: p, C: next, radius: d };
                }
            }
        });
    }

    if (bestTarget) {
        let newMark = null; 
        if (type === 'edge') {
            newMark = createEdgeMarkAt(bestTarget.p1, bestTarget.p2, bestTarget.shape);
        } else {
            // 【修正】：傳入計算好的 radius
            newMark = createAngleMarkAt(bestTarget.A, bestTarget.B, bestTarget.C, bestTarget.shape, bestTarget.radius);
        }
        
        if (isContinuousMarking) {
            statusText.innerText = "已加入標記 (連續模式：請繼續點擊)";
        } else {
            setMode('select');
            deselectAll();
            if (newMark) addToSelection(newMark); 
            statusText.innerText = "已加入標記，可按【空白鍵】切換樣式";
        }
        return true;
    }
    return false;
}

function autoApplyMark(x, y) {
    let actualMode = markModeType;
    
    // 如果是智慧模式，自動計算應該使用邊還是角
    if (markModeType === 'smart') {
        actualMode = window.determineSmartType(x, y);
    }

    const shapes = document.querySelectorAll('.shape:not(.mark-path)');
    let bestTarget = null;

    // 將原本所有的 markModeType 改為 actualMode 判斷
    if (actualMode === 'edge' && currentEdgeStyle === 'dimension') {
        let closestShape = null; let minShapeDist = Infinity;
        shapes.forEach(shape => {
            const tool = shape.getAttribute('data-tool');
            if (tool === 'text' || tool === 'math' || tool === 'mark') return;
            const bbox = shape.getBBox(); let tx = 0, ty = 0;
            const t = shape.getAttribute('transform');
            if(t && t.includes('translate')) { const m = /translate\(([-0-9.]+)[, ]+([-0-9.]+)\)/.exec(t); if(m) { tx = +m[1]; ty = +m[2]; } }
            if (x >= bbox.x + tx - 50 && x <= bbox.x + tx + bbox.width + 50 && y >= bbox.y + ty - 50 && y <= bbox.y + ty + bbox.height + 50) {
                const geo = extractGeometry(shape);
                if (geo && geo.segments) {
                    geo.segments.forEach(seg => {
                        const d = distToSegment(x, y, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
                        if (d < minShapeDist) { minShapeDist = d; closestShape = shape; }
                    });
                }
            }
        });
        if (closestShape && minShapeDist < 60) {
            if (executeSmartDimension(closestShape, x, y)) {
                if (!isContinuousMarking) { setMode('select'); statusText.innerText = "已完成長度標註"; }
                return; 
            }
        }
    }

    if (actualMode === 'edge') {
        let minDist = Infinity;
        shapes.forEach(shape => {
            const tool = shape.getAttribute('data-tool');
            if (tool === 'group' && shape.tagName !== 'g') return;
            if (tool === 'text' || tool === 'math') return;
            const pts = getTransformedPoints(shape);
            if (pts.length < 2) return;
            const isPolygon = (tool === 'polygon' || tool === 'rect' || tool === 'tri');
            const len = (isPolygon || (pts.length > 2 && tool !== 'polyline')) ? pts.length : pts.length - 1;
            for (let i = 0; i < len; i++) {
                const p1 = pts[i]; const p2 = pts[(i + 1) % pts.length];
                const d = distToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
                if (d < 30 && d < minDist) { minDist = d; bestTarget = { shape, type: 'edge', p1, p2 }; }
            }
        });
    } 
    else if (actualMode === 'angle') {
        let allSegments =[];
        shapes.forEach(shape => {
            const tool = shape.getAttribute('data-tool');
            if (tool === 'text' || tool === 'math' || tool === 'mark' || shape.classList.contains('vertex-label') || shape.classList.contains('angle-label-text')) return;
            if (typeof extractGeometry === 'function') {
                const geo = extractGeometry(shape);
                if (geo && geo.segments) {
                    geo.segments.forEach(seg => { seg.shape = shape; allSegments.push(seg); });
                }
            }
        });

        let candidateVertices =[];
        allSegments.forEach(seg => { candidateVertices.push(seg.p1); candidateVertices.push(seg.p2); });
        for (let i = 0; i < allSegments.length; i++) {
            for (let j = i + 1; j < allSegments.length; j++) {
                const pt = getLineLineIntersection(allSegments[i].p1, allSegments[i].p2, allSegments[j].p1, allSegments[j].p2);
                if (pt) candidateVertices.push(pt);
            }
        }

        let bestV = null; let minVDist = Infinity;
        candidateVertices.forEach(pt => {
            const d = Math.hypot(pt.x - x, pt.y - y);
            if (d < minVDist) { minVDist = d; bestV = pt; }
        });

        if (bestV && minVDist < 80) {
            let rays =[];
            allSegments.forEach(seg => {
                const proj = getProjectionOnSegment(bestV.x, bestV.y, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
                if (Math.hypot(proj.x - bestV.x, proj.y - bestV.y) < 2) {
                    if (Math.hypot(seg.p1.x - bestV.x, seg.p1.y - bestV.y) > 1) rays.push({ point: seg.p1, seg: seg });
                    if (Math.hypot(seg.p2.x - bestV.x, seg.p2.y - bestV.y) > 1) rays.push({ point: seg.p2, seg: seg });
                }
            });

            if (rays.length >= 2) {
                const rayAngles = rays.map(r => {
                    let ang = Math.atan2(r.point.y - bestV.y, r.point.x - bestV.x);
                    if (ang < 0) ang += 2 * Math.PI;
                    return { point: r.point, angle: ang, shape: r.seg.shape, sig: window.getRaySig(r, bestV) };
                }).sort((a, b) => a.angle - b.angle);

                const uniqueRays =[];
                rayAngles.forEach(r => {
                    if (uniqueRays.length === 0) uniqueRays.push(r);
                    else {
                        let diff = Math.abs(r.angle - uniqueRays[uniqueRays.length - 1].angle);
                        if (diff > Math.PI) diff = 2 * Math.PI - diff;
                        if (diff > 0.05) uniqueRays.push(r);
                    }
                });

                if (uniqueRays.length >= 2) {
                    let diffLast = Math.abs(uniqueRays[uniqueRays.length - 1].angle - uniqueRays[0].angle);
                    if (diffLast > Math.PI) diffLast = 2 * Math.PI - diffLast;
                    if (diffLast < 0.05) uniqueRays.pop();
                }

                if (uniqueRays.length >= 2) {
                    let r1 = null, r2 = null, sectorIndex = -1; 
                    if (uniqueRays.length === 2 && minVDist < 5) {
                        let diff = uniqueRays[1].angle - uniqueRays[0].angle;
                        if (diff > Math.PI) { r1 = uniqueRays[1]; r2 = uniqueRays[0]; sectorIndex = 1; } 
                        else { r1 = uniqueRays[0]; r2 = uniqueRays[1]; sectorIndex = 0; }
                    } else {
                        let mouseAngle = Math.atan2(y - bestV.y, x - bestV.x);
                        if (mouseAngle < 0) mouseAngle += 2 * Math.PI;
                        for (let i = 0; i < uniqueRays.length; i++) {
                            let curr = uniqueRays[i], next = uniqueRays[(i + 1) % uniqueRays.length];
                            let a1 = curr.angle, a2 = next.angle;
                            if (a2 < a1) a2 += 2 * Math.PI; 
                            let mA = mouseAngle; if (mA < a1) mA += 2 * Math.PI;
                            if (mA >= a1 && mA <= a2) { r1 = curr; r2 = next; sectorIndex = i; break; }
                        }
                    }

                    if (r1 && r2) {
                        let markRadius = Math.max(15, minVDist);
                        bestTarget = {
                            type: 'intersection_angle',
                            V: bestV, r1: r1, r2: r2, radius: markRadius,
                            sectorSig: `${r1.sig}__${r2.sig}`,
                            sectorIndex: sectorIndex
                        };
                    }
                }
            }
        }
    }
    
    if (bestTarget) {
        let newMark = null; 
        if (bestTarget.type === 'edge') {
            newMark = createEdgeMarkAt(bestTarget.p1, bestTarget.p2, bestTarget.shape);
        } else if (bestTarget.type === 'angle') {
            newMark = createAngleMarkAt(bestTarget.A, bestTarget.B, bestTarget.C, bestTarget.shape, bestTarget.radius);
        } else if (bestTarget.type === 'intersection_angle') {
            const r1 = bestTarget.r1, r2 = bestTarget.r2;
            let diff = r2.angle - r1.angle;
            while (diff <= 0) diff += 2 * Math.PI;

            if (r1.shape && r2.shape && r1.shape !== r2.shape) {
                if (!r1.shape.id) r1.shape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
                if (!r2.shape.id) r2.shape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 6);
                const lineRef = `${r1.shape.id},${r2.shape.id}`;
                
                // 傳入半徑設定
                window.tempCustomRadius = bestTarget.radius; 
                newMark = buildIntersectionAngle(bestTarget.V, r1.angle, r2.angle, diff, lineRef, currentAngleStyle, bestTarget.sectorSig, bestTarget.radius);
                window.tempCustomRadius = null;
                
                if (newMark) {
                    newMark.setAttribute('data-sector-index', bestTarget.sectorIndex);
                    const uniqueId = newMark.getAttribute('data-unique-angle-id');
                    if (uniqueId) {
                        const textEl = document.querySelector(`.angle-label-text[data-unique-angle-id="${uniqueId}"]`);
                        if (textEl) textEl.setAttribute('data-sector-index', bestTarget.sectorIndex);
                    }
                }
            } else {
                newMark = createAngleMarkAt(r1.point, bestTarget.V, r2.point, r1.shape, bestTarget.radius);
            }
        }
        if (isContinuousMarking) {
            statusText.innerText = "已加入標記 (連續模式)";
        } else {
            setMode('select'); deselectAll();
            if (newMark) addToSelection(newMark);
            statusText.innerText = "已加入標記，可按【空白鍵】切換樣式";
        }
    } else {
        if (!isContinuousMarking) {
            setMode('select');
            statusText.innerText = (markModeType === 'edge' && currentEdgeStyle === 'dimension') ? "未偵測到邊緣" : "未偵測到標註目標";
        }
    }
}

function createEdgeMarkAt(p1, p2, ownerShape) {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    let deg = angle * 180 / Math.PI;
    let edgeIndex = -1;
    if (ownerShape) {
        const pts = getTransformedPoints(ownerShape);
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            if ((dist(a, p1) < 2 && dist(b, p2) < 2) || (dist(a, p2) < 2 && dist(b, p1) < 2)) {
                edgeIndex = i;
                break;
            }
        }
    }
    
    const isDefault = window.EDGE_STYLES.includes(currentEdgeStyle);

    if (isDefault) {
        let pathD = "";
        const s = 5; const h = 8;
        if (currentEdgeStyle === '1') pathD = `M 0 -${s} L 0 ${s}`;
        else if (currentEdgeStyle === '2') pathD = `M -2 -${s} L -2 ${s} M 2 -${s} L 2 ${s}`;
        else if (currentEdgeStyle === '3') pathD = `M -4 -${s} L -4 ${s} M 0 -${s} L 0 ${s} M 4 -${s} L 4 ${s}`;
        else if (currentEdgeStyle === 'tick') pathD = `M 0 0 L 0 -${s+2}`;
        else if (currentEdgeStyle === 'x') pathD = `M -4 -4 L 4 4 M -4 4 L 4 -4`;
        else if (currentEdgeStyle === 'o') pathD = `M -4 0 A 4 4 0 1 0 4 0 A 4 4 0 1 0 -4 0`;
        else if (currentEdgeStyle === 'parallel') pathD = `M -${h} -${s} L ${h} 0 L -${h} ${s}`;
        else pathD = `M 0 -${s} L 0 ${s}`;

        const mark = document.createElementNS(ns, "path");
        mark.setAttribute("d", pathD);
        mark.setAttribute("class", "shape mark-path");
        mark.setAttribute("data-tool", "mark-edge-symbol");
        if (ownerShape) {
            if (!ownerShape.id) ownerShape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            mark.setAttribute("data-owner", ownerShape.id);
            mark.setAttribute("data-edge-index", edgeIndex);
            mark.setAttribute("data-dependency-type", "edge_mark"); 
        }
        mark.setAttribute("data-edge-style", currentEdgeStyle);
        mark.style.cssText = "stroke:#c0392b; stroke-width:2; fill:none; pointer-events:all; cursor:move;";
        mark.setAttribute("transform", `translate(${mx}, ${my}) rotate(${deg})`);
        shapesLayer.appendChild(mark);
        saveState();
		if (ownerShape && typeof window.updateLockVisuals === 'function') {
			window.updateLockVisuals(ownerShape); // 確保後加的標記也會讀取鎖定狀態閃爍
		}		
        return mark;
    } else {
        // --- 文字與 Emoji 模式 ---
        const mark = document.createElementNS(ns, "text");
        mark.textContent = currentEdgeStyle;
        mark.setAttribute("class", "shape mark-path"); 
        mark.setAttribute("data-tool", "mark-edge-symbol");
        if (ownerShape) {
            if (!ownerShape.id) ownerShape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            mark.setAttribute("data-owner", ownerShape.id);
            mark.setAttribute("data-edge-index", edgeIndex);
            mark.setAttribute("data-dependency-type", "edge_mark"); 
        }
        mark.setAttribute("data-edge-style", currentEdgeStyle);
        mark.style.cssText = "font-size:18px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; pointer-events:all; cursor:move; font-weight:bold;";
        
        // 尋找此符號在清單中的設定
        const customMarkDef = (window.customMarksList ||[]).find(m => m.symbol === currentEdgeStyle);
        const shouldRotate = customMarkDef ? !!customMarkDef.rotate : true; // 內建預設為 true (會旋轉)
        
        // 寫入 DOM 屬性，讓後續拖曳連動時可以讀取這個設定
        mark.setAttribute("data-rotate", shouldRotate ? "true" : "false");
        
        // 【核心修正】：直接使用設定決定旋轉角度，不再加入 offsetY
        let finalDeg = shouldRotate ? deg : 0;
        mark.setAttribute("transform", `translate(${mx}, ${my}) rotate(${finalDeg})`);
        
        shapesLayer.appendChild(mark);
        saveState();
		if (ownerShape && typeof window.updateLockVisuals === 'function') {
			window.updateLockVisuals(ownerShape); // 確保後加的標記也會讀取鎖定狀態閃爍
		}
        return mark;
	}
}

function toggleAngleLabelOnSelection() {
    if (window.anchorPoint) {
        const ax = window.anchorPoint.x; const ay = window.anchorPoint.y; window.clearAnchorPoint();
        activateMarkMode('angle');
        const savedStyle = currentAngleStyle; currentAngleStyle = 'degree';
        autoApplyMark(ax, ay);
        currentAngleStyle = savedStyle; setMode('select'); return;
    }

    if (selectedElements.length === 0) {
        statusText.innerText = "請先選取要標註角度的圖形，或雙擊畫布產生定錨點"; return;
    }

    let removedCount = 0;
    const selectedIds = selectedElements.map(el => {
        if (!el.id) el.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        return el.id;
    });

    selectedIds.forEach(id => {
        const marks = document.querySelectorAll(`[data-owner-angle-shape="${id}"]`);
        if (marks.length > 0) {
            marks.forEach(m => m.remove()); removedCount++;
            const shape = document.getElementById(id);
            if (shape) shape.removeAttribute('data-angle-label-ids');
        }
    });

    document.querySelectorAll('.intersection-mark').forEach(m => {
        const lineRef = m.getAttribute('data-intersection-lines');
        if (lineRef && lineRef.split(',').some(id => selectedIds.includes(id))) {
            m.remove(); removedCount++;
        }
    });

    if (removedCount > 0) {
        saveState(); statusText.innerText = "已清除選取物件的相關角度標註"; setMode('select'); return;
    }

    const markedCount = window.markAllAnglesForSelection();
    if (markedCount > 0) statusText.innerText = "已為選取物件一鍵標註所有內角/交角";
    else statusText.innerText = "選取的物件沒有形成任何可自動標註的角度";
    setMode('select');
}

// 輔助函式：建立單個角標與可編輯文字
function buildIntersectionAngle(inter, angA, angC, diff, lineRef, style = 'degree', sectorSig = '', customRadius = null) {
    // 【導入參數】
    const settings = window.getAutoAngleSettings ? window.getAutoAngleSettings() : { arcRadius: 18, textOffset: 15, textOnlyDist: 15 };
    const MARK_RADIUS = customRadius || window.tempCustomRadius || settings.arcRadius; 
    const deg = Math.round(diff * 180 / Math.PI);
    const isRight = Math.abs(deg - 90) < 1; 
    const isTextStyle = !['degree', 'arc', 'double-arc'].includes(style);
    const uniqueAngleId = 'int-ang-' + Date.now() + Math.random().toString(36).substr(2, 5);

    let mark;

    if (isTextStyle) {
        const textDist = settings.textOnlyDist; // 【替換】純文字距離
        const mid = angA + diff / 2;
        const textEl = document.createElementNS(ns, "text");
        textEl.setAttribute("x", inter.x + textDist * Math.cos(mid));
        textEl.setAttribute("y", inter.y + textDist * Math.sin(mid));
        textEl.textContent = style;
        textEl.setAttribute("class", "shape angle-label-text intersection-mark");
        textEl.setAttribute("data-tool", "text");
        if (lineRef) textEl.setAttribute('data-intersection-lines', lineRef);
        textEl.setAttribute('data-angle-style', style);
        textEl.setAttribute('data-sector-sig', sectorSig);
        textEl.setAttribute('data-unique-angle-id', uniqueAngleId);
        textEl.setAttribute('data-inter-x', inter.x); textEl.setAttribute('data-inter-y', inter.y);
        textEl.setAttribute('data-ang-a', angA); textEl.setAttribute('data-ang-c', angC); textEl.setAttribute('data-diff', diff);
        textEl.setAttribute('data-radius-offset', MARK_RADIUS); // 記憶半徑

        textEl.style.cssText = "font-size:16px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; font-weight:bold; cursor:move;";
        shapesLayer.appendChild(textEl);
        return textEl;
    }

    let d = "";
    if (isRight) { 
        const s = Math.max(8, MARK_RADIUS * 0.6);
        const p1 = {x: inter.x + Math.cos(angA)*s, y: inter.y + Math.sin(angA)*s};
        const p2 = {x: inter.x + Math.cos(angC)*s, y: inter.y + Math.sin(angC)*s};
        const p3 = {x: p1.x + p2.x - inter.x, y: p1.y + p2.y - inter.y};
        d = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`;
    } else {
        const largeArcFlag = diff > Math.PI ? 1 : 0;
        const sweepFlag = 1; 
        const pS = {x: inter.x + MARK_RADIUS * Math.cos(angA), y: inter.y + MARK_RADIUS * Math.sin(angA)};
        const pE = {x: inter.x + MARK_RADIUS * Math.cos(angC), y: inter.y + MARK_RADIUS * Math.sin(angC)};
        d = `M ${pS.x} ${pS.y} A ${MARK_RADIUS} ${MARK_RADIUS} 0 ${largeArcFlag} ${sweepFlag} ${pE.x} ${pE.y}`;
        if (style === 'double-arc') {
            const r2 = MARK_RADIUS + Math.max(3, MARK_RADIUS * 0.15);
            const pS2 = {x: inter.x + r2 * Math.cos(angA), y: inter.y + r2 * Math.sin(angA)};
            const pE2 = {x: inter.x + r2 * Math.cos(angC), y: inter.y + r2 * Math.sin(angC)};
            d += ` M ${pS2.x} ${pS2.y} A ${r2} ${r2} 0 ${largeArcFlag} ${sweepFlag} ${pE2.x} ${pE2.y}`;
        }
    }
    mark = createMarkObject(d, "#c0392b");
    
    if (lineRef) { mark.setAttribute('data-intersection-lines', lineRef); mark.classList.add('intersection-mark'); }
    mark.setAttribute('data-angle-style', style); 
    mark.setAttribute('data-sector-sig', sectorSig);
    mark.setAttribute('data-unique-angle-id', uniqueAngleId);
    mark.setAttribute('data-inter-x', inter.x); mark.setAttribute('data-inter-y', inter.y);
    mark.setAttribute('data-ang-a', angA); mark.setAttribute('data-ang-c', angC); mark.setAttribute('data-diff', diff);
    mark.setAttribute('data-radius-offset', MARK_RADIUS); // 記憶半徑

    if (isRight || style === 'arc' || style === 'double-arc') return mark; 

    const mid = angA + diff/2;
    const textEl = document.createElementNS(ns, "text");
    textEl.setAttribute("x", inter.x + (MARK_RADIUS + settings.textOffset) * Math.cos(mid)); // 【替換】度數間距
    textEl.setAttribute("y", inter.y + (MARK_RADIUS + settings.textOffset) * Math.sin(mid)); // 【替換】度數間距
    textEl.textContent = `${deg}°`;
    textEl.setAttribute("class", "shape angle-label-text intersection-mark");
    textEl.setAttribute("data-tool", "text");
    if (lineRef) textEl.setAttribute('data-intersection-lines', lineRef);
    textEl.setAttribute('data-angle-style', style);
    textEl.setAttribute('data-sector-sig', sectorSig);
    textEl.setAttribute('data-unique-angle-id', uniqueAngleId);
    textEl.setAttribute('data-inter-x', inter.x); textEl.setAttribute('data-inter-y', inter.y);
    textEl.setAttribute('data-ang-a', angA); textEl.setAttribute('data-ang-c', angC); textEl.setAttribute('data-diff', diff);
    textEl.setAttribute('data-radius-offset', MARK_RADIUS); // 記憶半徑
    
    textEl.style.cssText = "font-size:13px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; font-weight:bold; cursor:move;";
    textEl.style.paintOrder = "stroke fill"; textEl.style.stroke = "white"; textEl.style.strokeWidth = "3px"; textEl.style.strokeLinejoin = "round";
    shapesLayer.appendChild(textEl);
    return mark; 
}

// 輔助：修改 createMarkObject 讓它回傳物件，方便記錄 ID
function createMarkObject(d, color, ownerShape = null) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "shape mark-path");
    path.setAttribute("data-tool", "mark");
    path.style.stroke = color;
    path.style.strokeWidth = "1.5";
    path.style.fill = "none";
    path.id = 'mark-' + Date.now() + Math.random().toString(36).substr(2, 5);
    
    const owner = ownerShape || (selectedElements.length > 0 ? selectedElements[0] : null);
    if (owner) {
        if (!owner.id) owner.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        path.setAttribute("data-owner", owner.id);
    }
    shapesLayer.appendChild(path);
    return path;
}

function generateAngleLabels(shape, force = false) {
    if (!force && !document.getElementById('auto-angle-label-check').checked) return false;
    if (!shape.id) shape.id = 'shape-' + Date.now();
    
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool'); 

    // 支援的類型
    if (!['polygon', 'angle', 'rect', 'tri', 'tangent', 'group', 'ellipse'].includes(tool)) return false;

    const pts = getTransformedPoints(shape);
    if (pts.length < 2) return false; 
    
    const createdMarkIds =[];
    
    // 【導入參數】
    const settings = window.getAutoAngleSettings ? window.getAutoAngleSettings() : { arcRadius: 18, textOffset: 15, textOnlyDist: 15 };
    const MARK_RADIUS = settings.arcRadius; 
    const TEXT_OFFSET = settings.textOffset; 

    let targetIndices =[]; 

    if (tool === 'group' && subTool) {
        if (subTool === 'central-angle') {
            targetIndices = [1]; // 圓心角：數據結構是 [圓心, P1, P2]，頂點是 0
        } else if (subTool === 'inscribed-angle') {
            targetIndices = [1]; // 圓周角：數據結構是 [A, 頂點, B]，頂點是 1
        } else if (subTool === 'tangent-chord-angle') {
            targetIndices = [1]; // 弦切角：數據結構是 [A, 切點P, 方向T]，頂點是 1
        }
    } else if (tool === 'angle' || tool === 'tangent') {
        targetIndices = [1]; // 普通角/切線：頂點在中間
    } else if (subTool === 'sector') {
		targetIndices = [1]; // 扇形：角在圓心 (utils.js 回傳的第 2 個點)
	} else {
        // 多邊形/三角形/矩形：所有點都是頂點
        targetIndices = pts.map((_, i) => i);
    }

    for (let i = 0; i < pts.length; i++) {
        // 如果這個點不是目標頂點，跳過
        if (!targetIndices.includes(i)) continue;

        // 確保前後有點 (圓形角如果是封閉的，邏輯要處理 loop)
        // 圓形角群組通常不是閉合多邊形，但 vertex-data 有順序
        // Central: 1(P1) -> 0(Center) -> 2(P2)
        let p_prev, p_curr, p_next;

        if (subTool === 'central-angle') {
            p_curr = pts[1]; p_prev = pts[0]; p_next = pts[2];
        } else if (subTool === 'tangent-chord-angle' && pts.length >= 4) {
            // 【修正】弦切角自動判斷銳角側
            p_curr = pts[1]; // P
            p_prev = pts[0]; // A
            const T1 = pts[2];
            const T2 = pts[3];
            
            // 計算向量 PA 與 PT1
            const vChord = { x: p_prev.x - p_curr.x, y: p_prev.y - p_curr.y };
            const vT1 = { x: T1.x - p_curr.x, y: T1.y - p_curr.y };
            // 內積 > 0 為銳角
            const dot = vChord.x * vT1.x + vChord.y * vT1.y;
            p_next = dot > 0 ? T1 : T2;
            
        } else {
            // 一般邏輯
            p_prev = pts[(i - 1 + pts.length) % pts.length];
            p_curr = pts[i];
            p_next = pts[(i + 1) % pts.length];
        }

        const v1 = { x: p_prev.x - p_curr.x, y: p_prev.y - p_curr.y };
        const v2 = { x: p_next.x - p_curr.x, y: p_next.y - p_curr.y };
        
        const angStart = Math.atan2(v1.y, v1.x);
        const angEnd = Math.atan2(v2.y, v2.x);
        let diff = angEnd - angStart;

        const drawDir = shape.getAttribute('data-draw-dir');
        if (subTool === 'sector' && drawDir) {
            if (drawDir === 'left') { // 逆時針
                while (diff < 0) diff += 2 * Math.PI;
            } else { // 順時針
                while (diff > 0) diff -= 2 * Math.PI;
            }
        } else {
            // 維持其他圖形的預設行為 (取小於180度的夾角)
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
        }

        let degrees = Math.abs(diff * 180 / Math.PI);
        // 對於扇形，不過濾 180 度
		if (subTool !== 'sector' && subTool !== 'central-angle' && (Math.abs(degrees - 180) < 1 || isNaN(degrees))) continue;
        if (isNaN(degrees)) continue;

        const isRightAngle = Math.abs(degrees - 90) < 0.5;
        const displayDegrees = Math.round(degrees);
        let pathD = "";
        
        if (isRightAngle) {
            const size = 10;
            const u1 = { x: v1.x / Math.hypot(v1.x, v1.y), y: v1.y / Math.hypot(v1.x, v1.y) };
            const u2 = { x: v2.x / Math.hypot(v2.x, v2.y), y: v2.y / Math.hypot(v2.x, v2.y) };
            const r1 = { x: p_curr.x + u1.x * size, y: p_curr.y + u1.y * size };
            const r2 = { x: p_curr.x + u2.x * size, y: p_curr.y + u2.y * size };
            const r3 = { x: r1.x + r2.x - p_curr.x, y: r1.y + r2.y - p_curr.y };
            pathD = `M ${r1.x} ${r1.y} L ${r3.x} ${r3.y} L ${r2.x} ${r2.y}`;
        } else {
            const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;
            const sweepFlag = diff > 0 ? 1 : 0;
            const pStart = { x: p_curr.x + MARK_RADIUS * Math.cos(angStart), y: p_curr.y + MARK_RADIUS * Math.sin(angStart) };
            const pEnd = { x: p_curr.x + MARK_RADIUS * Math.cos(angEnd), y: p_curr.y + MARK_RADIUS * Math.sin(angEnd) };
            pathD = `M ${pStart.x} ${pStart.y} A ${MARK_RADIUS} ${MARK_RADIUS} 0 ${largeArcFlag} ${sweepFlag} ${pEnd.x} ${pEnd.y}`;
        }

        const markPath = document.createElementNS(ns, "path");
        markPath.setAttribute("d", pathD);
        markPath.setAttribute("class", "shape mark-path");
        markPath.setAttribute("data-tool", "mark");
        markPath.setAttribute("data-owner-angle-shape", shape.id); 
        markPath.setAttribute("data-vertex-index", i); 
        markPath.setAttribute("data-angle-type", isRightAngle ? "right" : "arc"); 
        
        // ▼▼▼ 新增這三行屬性，讓更新系統能辨識並平滑連動 ▼▼▼
        markPath.setAttribute("data-owner-shape", shape.id);
        markPath.setAttribute("data-dependency-type", "angle_mark");
        markPath.setAttribute("data-radius-offset", MARK_RADIUS); 
        // ▲▲▲ 新增結束 ▲▲▲

        markPath.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none; cursor:move;";
        markPath.id = 'ang-path-' + Date.now() + Math.random().toString(36).substr(2, 5);
        shapesLayer.appendChild(markPath);
        createdMarkIds.push(markPath.id);

        // --- B. 繪製度數文字 (Text) ---
        if (!isRightAngle && subTool !== 'arc' && subTool !== 'arch') {
            let tX, tY;
            const dist = MARK_RADIUS + TEXT_OFFSET;

            if (subTool === 'sector') {
                const midAngle = angStart + diff / 2;
                tX = p_curr.x + dist * Math.cos(midAngle);
                tY = p_curr.y + dist * Math.sin(midAngle);
            } else {
                const bX = v1.x / Math.hypot(v1.x, v1.y) + v2.x / Math.hypot(v2.x, v2.y);
                const bY = v1.y / Math.hypot(v1.x, v1.y) + v2.y / Math.hypot(v2.x, v2.y);
                const bLen = Math.hypot(bX, bY);
                tX = p_curr.x + (bX / bLen) * dist;
                tY = p_curr.y + (bY / bLen) * dist;
            }
            
            const textEl = document.createElementNS(ns, "text");
            textEl.setAttribute("x", tX);
            textEl.setAttribute("y", tY);
            textEl.textContent = `${displayDegrees}°`;
            textEl.setAttribute("class", "shape angle-label-text"); 
            textEl.setAttribute("data-tool", "text"); 
            textEl.setAttribute("data-owner-angle-shape", shape.id); 
            textEl.setAttribute("data-vertex-index", i); 
            textEl.setAttribute("data-angle-type", "degree"); 

            // ▼▼▼ 新增這三行屬性，讓文字也能平滑連動 ▼▼▼
            textEl.setAttribute("data-owner-shape", shape.id);
            textEl.setAttribute("data-dependency-type", "angle_mark");
            textEl.setAttribute("data-radius-offset", MARK_RADIUS);
            // ▲▲▲ 新增結束 ▲▲▲
            
            textEl.style.cssText = "font-size:13px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; cursor:text; font-weight:bold;";
            textEl.style.paintOrder = "stroke fill";
            textEl.style.stroke = "white";
            textEl.style.strokeWidth = "3px";
            textEl.style.strokeLinejoin = "round";
            
            textEl.id = 'ang-txt-' + Date.now() + Math.random().toString(36).substr(2, 5);
            shapesLayer.appendChild(textEl);
            createdMarkIds.push(textEl.id);
        }
    }
    if (createdMarkIds.length > 0) {
        const oldIds = shape.getAttribute('data-angle-label-ids');
        shape.setAttribute('data-angle-label-ids', oldIds ? oldIds + ',' + createdMarkIds.join(',') : createdMarkIds.join(','));
        return true;
    }
    return false;
}

function refreshAngleLabels(shape) {
    if (!shape || !shape.id) return;
    
    // 找出所有依附於此圖形的角標 (包含路徑與文字)
    const marks = document.querySelectorAll(`[data-owner-shape="${shape.id}"][data-dependency-type="angle_mark"]`);
    if (marks.length === 0) return;

    const pts = getTransformedPoints(shape);
    if (pts.length < 2) return;

    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');

    marks.forEach(mark => {
        const vIdx = parseInt(mark.getAttribute('data-vertex-index'));
        if (isNaN(vIdx) || !pts[vIdx]) return;

        // --- 核心邏輯：根據目前的索引重新計算幾何位置 ---
        let A, B, C;
        if (subTool === 'central-angle') { 
            // 圓心角：0為圓心(頂點)，1為起點，2為終點
            B = pts[1]; A = pts[0]; C = pts[2]; 
        } else if (tool === 'angle' || subTool === 'inscribed-angle') { 
            // 圓周角/普通角：1為頂點
            B = pts[1]; A = pts[0]; C = pts[2]; 
        } else if (subTool === 'tangent-chord-angle') {
            // 弦切角：1為切點(頂點)，0為弦端點，2/3為切線向
            B = pts[1]; A = pts[0];
            const T1 = pts[2], T2 = pts[3];
            const vChord = { x: A.x - B.x, y: A.y - B.y };
            const vT1 = { x: T1.x - B.x, y: T1.y - B.y };
            C = (vChord.x * vT1.x + vChord.y * vT1.y) > 0 ? T1 : T2;
        } else {
            // 一般多邊形
            B = pts[vIdx];
            A = pts[(vIdx - 1 + pts.length) % pts.length];
            C = pts[(vIdx + 1) % pts.length];
        }

        const angBA = Math.atan2(A.y - B.y, A.x - B.x);
        const angBC = Math.atan2(C.y - B.y, C.x - B.x);
        let diff = angBC - angBA;
        while (diff <= -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;

        // 【導入參數】
        const settings = window.getAutoAngleSettings ? window.getAutoAngleSettings() : { arcRadius: 18, textOffset: 15, textOnlyDist: 15 };
        const r = parseFloat(mark.getAttribute('data-radius-offset')) || settings.arcRadius;
        const angleType = mark.getAttribute('data-angle-type');

        // 更新位置 (文字或路徑)
        if (mark.tagName.toLowerCase() === 'text') {
            const deg = Math.round(Math.abs(diff * 180 / Math.PI));
            const mid = angBA + diff / 2;
            const isPureText = !['degree', 'arc', 'double-arc'].includes(angleType);
            // 【替換】動態使用設定距離
            const textDist = isPureText ? settings.textOnlyDist : (r + settings.textOffset);
            
            mark.setAttribute('x', B.x + textDist * Math.cos(mid));
            mark.setAttribute('y', B.y + textDist * Math.sin(mid));
            if (angleType === 'degree') mark.textContent = `${deg}°`;
        } else {
            // 更新路徑 (Arc/Right Angle)
            let d = "";
            const isRight = (angleType === 'right');
            if (isRight) {
                const s = Math.max(8, r * 0.6);
                const p1 = { x: B.x + Math.cos(angBA) * s, y: B.y + Math.sin(angBA) * s };
                const p2 = { x: B.x + Math.cos(angBC) * s, y: B.y + Math.sin(angBC) * s };
                const p3 = { x: p1.x + p2.x - B.x, y: p1.y + p2.y - B.y };
                d = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`;
            } else {
                const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
                const sweep = diff > 0 ? 1 : 0;
                const pS = { x: B.x + r * Math.cos(angBA), y: B.y + r * Math.sin(angBA) };
                const pE = { x: B.x + r * Math.cos(angBC), y: B.y + r * Math.sin(angBC) };
                d = `M ${pS.x} ${pS.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${pE.x} ${pE.y}`;
                if (angleType === 'double-arc') {
                    const r2 = r + Math.max(3, r * 0.15);
                    const pS2 = { x: B.x + r2 * Math.cos(angBA), y: B.y + r2 * Math.sin(angBA) };
                    const pE2 = { x: B.x + r2 * Math.cos(angBC), y: B.y + r2 * Math.sin(angBC) };
                    d += ` M ${pS2.x} ${pS2.y} A ${r2} ${r2} 0 ${largeArc} ${sweep} ${pE2.x} ${pE2.y}`;
                }
            }
            mark.setAttribute('d', d);
        }
        mark.removeAttribute('transform'); // 重要：清除位移殘留
    });
}
// 確保全域可呼叫，以便 core.js 使用
window.refreshAngleLabels = refreshAngleLabels;

function refreshIntersectionAngles(movedLine) {
    if (!movedLine || !movedLine.id) return;
    const allRelatedMarks = document.querySelectorAll(`.intersection-mark`);
    const marksToProcess = Array.from(allRelatedMarks).filter(m => {
        const refs = m.getAttribute('data-intersection-lines');
        return refs && refs.split(',').includes(movedLine.id);
    });
    if (marksToProcess.length === 0) return;

    const pairSet = new Set();
    const activeSectors = {}; 

    // 收集現存角標的記憶狀態
    marksToProcess.forEach(m => {
        const pStr = m.getAttribute('data-intersection-lines');
        pairSet.add(pStr);
        if (!activeSectors[pStr]) activeSectors[pStr] = {};
        const sig = m.getAttribute('data-sector-sig');
        const style = m.getAttribute('data-angle-style') || 'degree';
        const rad = parseFloat(m.getAttribute('data-radius-offset')) || 25;
        if (sig) activeSectors[pStr][sig] = { style, rad };
    });

    pairSet.forEach(pairStr => {
        const lines = pairStr.split(',').map(id => document.getElementById(id)).filter(el => el);
        if (lines.length < 2) return;

        document.querySelectorAll(`.intersection-mark[data-intersection-lines="${pairStr}"]`).forEach(m => m.remove());

        let allSegments =[];
        lines.forEach(line => {
            const geo = extractGeometry(line);
            if (geo && geo.segments) { geo.segments.forEach(seg => { seg.shape = line; allSegments.push(seg); }); }
        });

        let inter = null;
        for (let i = 0; i < allSegments.length; i++) {
            for (let j = i + 1; j < allSegments.length; j++) {
                if (allSegments[i].shape.id !== allSegments[j].shape.id) {
                    // 【需求2修正】：傳入 true 將線段視為無限長直線，避免浮點數誤差導致找不到交點
                    let pt = getLineLineIntersection(allSegments[i].p1, allSegments[i].p2, allSegments[j].p1, allSegments[j].p2, true);
                    if (pt) { inter = pt; break; }
                }
            }
            if (inter) break;
        }
        if (!inter) return; 

        let rays =[];
        allSegments.forEach(seg => {
            const proj = getProjectionOnSegment(inter.x, inter.y, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
            // 【需求2修正】：放寬投影誤差從 < 1px 變成 < 5px，確保對角線在快速拖拉中不會斷線
            if (Math.hypot(proj.x - inter.x, proj.y - inter.y) < 5) {
                if (Math.hypot(seg.p1.x - inter.x, seg.p1.y - inter.y) > 2) rays.push({ point: seg.p1, seg: seg });
                if (Math.hypot(seg.p2.x - inter.x, seg.p2.y - inter.y) > 2) rays.push({ point: seg.p2, seg: seg });
            }
        });

        if (rays.length >= 2) {
            const rayAngles = rays.map(r => ({
                angle: Math.atan2(r.point.y - inter.y, r.point.x - inter.x),
                sig: window.getRaySig(r, inter)
            })).sort((a, b) => a.angle - b.angle);

            const uniqueRays =[];
            rayAngles.forEach(r => {
                if (uniqueRays.length === 0) uniqueRays.push(r);
                else {
                    let diff = Math.abs(r.angle - uniqueRays[uniqueRays.length - 1].angle);
                    if (diff > Math.PI) diff = 2 * Math.PI - diff;
                    if (diff > 0.05) uniqueRays.push(r);
                }
            });

            if (uniqueRays.length >= 2) {
                let diffLast = Math.abs(uniqueRays[uniqueRays.length - 1].angle - uniqueRays[0].angle);
                if (diffLast > Math.PI) diffLast = 2 * Math.PI - diffLast;
                if (diffLast < 0.05) uniqueRays.pop(); 
            }

            for (let i = 0; i < uniqueRays.length; i++) {
                const rayA = uniqueRays[i];
                const rayC = uniqueRays[(i + 1) % uniqueRays.length];
                const sig = `${rayA.sig}__${rayC.sig}`; 

                if (!activeSectors[pairStr] || !activeSectors[pairStr][sig]) continue;

                let diff = rayC.angle - rayA.angle;
                while (diff <= 0) diff += 2 * Math.PI;
                // 【需求2修正】：放寬平角偵測容忍度
                if (diff > 3.1 && diff < 3.18) continue; 

                const savedData = activeSectors[pairStr][sig]; 
                buildIntersectionAngle(inter, rayA.angle, rayC.angle, diff, pairStr, savedData.style, sig, savedData.rad);
            }
        }
    });
}

// 【全新函式】：支援選取物件後，一鍵標註所有關聯角度
window.markAllAnglesForSelection = function() {
    let count = 0;
    if (selectedElements.length === 0) return 0;

    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        // 【Bug 修復】：將 'angle' 加入支援多角標註的陣列中
        if (['polygon', 'rect', 'tri', 'ellipse', 'angle'].includes(tool) || el.tagName.toLowerCase() === 'polygon') {
            if (!el.hasAttribute('data-angle-label-ids') || el.getAttribute('data-angle-label-ids') === '') {
                if (typeof generateAngleLabels === 'function' && generateAngleLabels(el, true)) count++;
            }
        }
    });

    if (selectedElements.length >= 2) {
        let allSegments =[];
        selectedElements.forEach(el => {
            const geo = extractGeometry(el);
            if (geo && geo.segments.length > 0) {
                if (!el.id) el.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
                geo.segments.forEach(seg => { seg.shape = el; allSegments.push(seg); });
            }
        });

        let intersections =[];
        for (let i = 0; i < allSegments.length; i++) {
            for (let j = i + 1; j < allSegments.length; j++) {
                const s1 = allSegments[i], s2 = allSegments[j];
                if (s1.shape.id === s2.shape.id) continue; 
                const pt = getLineLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
                if (pt) {
                    const duplicate = intersections.find(ip => Math.hypot(ip.pt.x - pt.x, ip.pt.y - pt.y) < 1);
                    if (duplicate) { duplicate.shapes.add(s1.shape); duplicate.shapes.add(s2.shape); } 
                    else { intersections.push({ pt: pt, shapes: new Set([s1.shape, s2.shape]) }); }
                }
            }
        }

        intersections.forEach(inter => {
            const pt = inter.pt;
            let rays =[];
            allSegments.forEach(seg => {
                const proj = getProjectionOnSegment(pt.x, pt.y, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
                // 【修正 1】：放寬抓取相交線段的容忍度 (1 -> 2)
                if (Math.hypot(proj.x - pt.x, proj.y - pt.y) < 2) {
                    if (Math.hypot(seg.p1.x - pt.x, seg.p1.y - pt.y) > 1) rays.push({ point: seg.p1, seg: seg });
                    if (Math.hypot(seg.p2.x - pt.x, seg.p2.y - pt.y) > 1) rays.push({ point: seg.p2, seg: seg });
                }
            });

            if (rays.length >= 2) {
                const rayAngles = rays.map(r => ({ angle: Math.atan2(r.point.y - pt.y, r.point.x - pt.x), shapeId: r.seg.shape.id, sig: window.getRaySig(r, pt) })).sort((a, b) => a.angle - b.angle);
                
                const uniqueRays =[];
                rayAngles.forEach(r => {
                    if (uniqueRays.length === 0) uniqueRays.push(r);
                    else {
                        let diff = Math.abs(r.angle - uniqueRays[uniqueRays.length - 1].angle);
                        if (diff > Math.PI) diff -= 2 * Math.PI; if (diff < -Math.PI) diff += 2 * Math.PI;
                        if (Math.abs(diff) > 0.08) uniqueRays.push(r);
                    }
                });

                if (uniqueRays.length >= 2) {
                    let diffLast = Math.abs(uniqueRays[uniqueRays.length - 1].angle - uniqueRays[0].angle);
                    if (diffLast > Math.PI) diffLast -= 2 * Math.PI; if (diffLast < -Math.PI) diffLast += 2 * Math.PI;
                    if (Math.abs(diffLast) < 0.08) uniqueRays.pop(); 
                }

                const shapeIds = Array.from(inter.shapes).map(s => s.id).sort().join(',');
                const existing = document.querySelectorAll(`[data-intersection-lines="${shapeIds}"]`);
                
                if (existing.length === 0) {
                    for (let i = 0; i < uniqueRays.length; i++) {
                        const rayA = uniqueRays[i], rayC = uniqueRays[(i + 1) % uniqueRays.length];
                        
                        if (rayA.shapeId === rayC.shapeId) continue;

                        let diff = rayC.angle - rayA.angle;
                        while (diff <= 0) diff += 2 * Math.PI;
                        
                        // 【修正 2】：移除平角跳過機制，或放寬平角的判定，確保十字相交角不會被遺漏
                        if (diff > 3.1 && diff < 3.18) continue; 
                        
                        const sig = `${rayA.sig}__${rayC.sig}`; 
                        const mark = buildIntersectionAngle(pt, rayA.angle, rayC.angle, diff, shapeIds, currentAngleStyle, sig);
                        if (mark) {
                            mark.setAttribute('data-sector-index', i);
                            const uniqueId = mark.getAttribute('data-unique-angle-id');
                            if (uniqueId) {
                                const textEl = document.querySelector(`.angle-label-text[data-unique-angle-id="${uniqueId}"]`);
                                if (textEl) textEl.setAttribute('data-sector-index', i);
                            }
                            count++;
                        }
                    }
                }
            }
        });
    }
    if (count > 0) saveState();
    return count;
};

function drawDiagonalsFromSelection() {
    if (selectedElements.length === 0) return;
    
    let createdCount = 0;
    const newLines =[];
    const origShape = selectedElements[0]; // 記住主圖

    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();
        
        if (tagName === 'polygon' || tool === 'polygon' || tool === 'rect' || tool === 'square' || tool === 'rhombus' || tool === 'kite' || tool === 'trapezoid' || tool === 'parallelogram') {
            
            const pts = getTransformedPoints(el);
            const n = pts.length;
            if (n < 4) return; 

            // 確保主圖有 ID (連動需要)
            if (!el.id) el.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2,5);

            for (let i = 0; i < n; i++) {
                for (let j = i + 2; j < n; j++) {
                    if (i === 0 && j === n - 1) continue;

                    const p1 = pts[i];
                    const p2 = pts[j];

                    const line = document.createElementNS(ns, "line");
                    line.setAttribute('x1', p1.x);
                    line.setAttribute('y1', p1.y);
                    line.setAttribute('x2', p2.x);
                    line.setAttribute('y2', p2.y);
                    // 【問題2 修復核心】：絕對不可以有 'shape' class，否則會被幾何引擎重複抓取導致 ID 錯亂
                    line.setAttribute('class', 'visible-line');
                    
                    const g = document.createElementNS(ns, "g");
                    g.setAttribute('class', 'shape group');
                    g.setAttribute('data-tool', 'line');
                    // 立即給予 ID，讓後續角標一產生就能精準綁定
                    g.id = 'diag-' + Date.now() + Math.random().toString(36).substr(2,5);
                    
                    const hitLine = document.createElementNS(ns, "line");
                    hitLine.setAttribute('x1', p1.x); hitLine.setAttribute('y1', p1.y);
                    hitLine.setAttribute('x2', p2.x); hitLine.setAttribute('y2', p2.y);
                    hitLine.setAttribute('class', 'hit-line');
                    hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
                    
                    g.appendChild(hitLine);
                    g.appendChild(line);
                    
                    g.setAttribute('data-owner-shape', el.id);
                    g.setAttribute('data-dependency-type', 'polygon_diagonal'); // 設定特殊類型
                    g.setAttribute('data-vertex-indices', `${i},${j}`);         

                    // 套用預設虛線樣式
                    line.style.cssText = "stroke:#7f8c8d; stroke-width:1; stroke-dasharray:5,3; vector-effect:non-scaling-stroke;";

                    shapesLayer.appendChild(g);
                    newLines.push(g);
                    createdCount++;
                }
            }
        }
    });

    if (createdCount > 0) {
        saveState();
        setMode('select');
        // 【需求1 修復】：畫完對角線後，取消全選並保持選取原多邊形主體
        deselectAll();
        if (origShape) addToSelection(origShape);
        statusText.innerText = `已繪製 ${createdCount} 條對角線`;
    } else {
        statusText.innerText = "無法繪製對角線 (請選取四邊以上的多邊形)";
    }
}
window.drawDiagonalsFromSelection = drawDiagonalsFromSelection;

window.addCircleElement = function(type) {
    if (selectedElements.length !== 1) return;
    const target = selectedElements[0];
    
    // 支援純圓形、橢圓形或舊版的 circle-smart
    const isCircle = target.getAttribute('data-sub-tool') === 'circle' || 
                     target.tagName.toLowerCase() === 'circle' || 
                     target.tagName.toLowerCase() === 'ellipse' ||
                     target.getAttribute('data-sub-tool') === 'circle-smart';
    if (!isCircle) return;

    // 確保圓有 ID
    if (!target.id) target.id = 'circle-' + Date.now();

    // 取得圓心與半徑的絕對坐標
    let cx, cy, r;
    const m = target.getCTM();
    if (target.getAttribute('data-sub-tool') === 'circle-smart') {
        const circleBody = target.querySelector('.circle-body');
        r = parseFloat(target.getAttribute('data-radius'));
        cx = parseFloat(circleBody.getAttribute('cx')) * m.a + m.e;
        cy = parseFloat(circleBody.getAttribute('cy')) * m.d + m.f;
    } else {
        cx = parseFloat(target.getAttribute('cx') || 0) * m.a + m.e;
        cy = parseFloat(target.getAttribute('cy') || 0) * m.d + m.f;
        r = parseFloat(target.getAttribute('r') || target.getAttribute('rx') || 0) * m.a;
    }

    // 取得右鍵點擊位置來決定方向
    const clickX = lastClickPos.x;
    const clickY = lastClickPos.y;
    let angleRad = Math.atan2(clickY - cy, clickX - cx);

    // 1. 畫圓心
    if (type === 'center') {
        if (!document.querySelector(`[data-owner-shape="${target.id}"][data-dependency-type="center-point"]`)) {
            const centerPt = document.createElementNS(ns, "circle");
            centerPt.setAttribute('cx', cx); centerPt.setAttribute('cy', cy); centerPt.setAttribute('r', 3);
            centerPt.setAttribute('class', 'shape'); centerPt.setAttribute('data-tool', 'point');
            centerPt.setAttribute('data-owner-shape', target.id); centerPt.setAttribute('data-dependency-type', 'center-point');
            centerPt.style.cssText = "fill:black; stroke:none; cursor:move;";
            shapesLayer.appendChild(centerPt);

            const fontSize = window.getDefaultTextSize ? window.getDefaultTextSize() : "20";
            const textO = document.createElementNS(ns, "text");
            textO.setAttribute('x', cx - 16); textO.setAttribute('y', cy + 20);
            textO.textContent = "O"; textO.setAttribute('class', 'shape'); textO.setAttribute('data-tool', 'text');
            textO.setAttribute('data-owner-shape', target.id); textO.setAttribute('data-dependency-type', 'center-label');
            textO.style.cssText = `font-size:${fontSize}px; font-family:Arial; font-weight:bold; fill:black; cursor:text;`;
            shapesLayer.appendChild(textO);
        }
        saveState();
        return;
    }
    if (type === 'tangent-on-circle') {
        // 1. 確保有圓心
        if (!document.querySelector(`[data-owner-shape="${target.id}"][data-dependency-type="center-point"]`)) {
            const centerPt = document.createElementNS(ns, "circle");
            centerPt.setAttribute('cx', cx); centerPt.setAttribute('cy', cy); centerPt.setAttribute('r', 3);
            centerPt.setAttribute('class', 'shape'); centerPt.setAttribute('data-tool', 'point');
            centerPt.setAttribute('data-owner-shape', target.id); centerPt.setAttribute('data-dependency-type', 'center-point');
            centerPt.style.cssText = "fill:black; stroke:none; cursor:move;";
            shapesLayer.appendChild(centerPt);
            
            const fontSize = window.getDefaultTextSize ? window.getDefaultTextSize() : "20";
            const textO = document.createElementNS(ns, "text");
            textO.setAttribute('x', cx - 16); textO.setAttribute('y', cy + 20);
            textO.textContent = "O"; textO.setAttribute('class', 'shape'); textO.setAttribute('data-tool', 'text');
            textO.setAttribute('data-owner-shape', target.id); textO.setAttribute('data-dependency-type', 'center-label');
            textO.style.cssText = `font-size:${fontSize}px; font-family:Arial; font-weight:bold; fill:black; cursor:text;`;
            shapesLayer.appendChild(textO);
        }

        let pointRadius = 4;
        try {
            const cachedP = localStorage.getItem('math_editor_param_point');
            if (cachedP) pointRadius = JSON.parse(cachedP).p_r || 4;
        } catch(e) {}

        const px = cx + r * Math.cos(angleRad);
        const py = cy + r * Math.sin(angleRad);
        const strokeColor = document.getElementById('stroke-color-select').value || "#000000";

        // 建立唯一 ID 給切點
        const ctrlId = 'pt-' + Date.now();

        // 【修正1】先畫半徑 (最底層)
        const rGroup = document.createElementNS(ns, "g");
        rGroup.setAttribute('class', 'shape group');
        rGroup.setAttribute('data-tool', 'line');
        rGroup.setAttribute('data-owner-shape', target.id);
        rGroup.setAttribute('data-tangent-ctrl', ctrlId);
        rGroup.setAttribute('data-dependency-type', 'tangent_on_circle_radius');
        
        const rHit = document.createElementNS(ns, "line");
        rHit.setAttribute('class', 'hit-line'); rHit.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        const rVis = document.createElementNS(ns, "line");
        rVis.setAttribute('class', 'visible-line');
        rVis.style.cssText = "stroke:#7f8c8d; stroke-width:1.5; stroke-dasharray:5,3; pointer-events:none;";
        rGroup.appendChild(rHit); rGroup.appendChild(rVis);
        shapesLayer.appendChild(rGroup);

        // 【修正2】再畫切線本體 (中間層，初始長度預設 120)
        const tGroup = document.createElementNS(ns, "g");
        tGroup.setAttribute('class', 'shape group');
        tGroup.setAttribute('data-tool', 'line');
        tGroup.setAttribute('data-owner-shape', target.id);
        tGroup.setAttribute('data-tangent-ctrl', ctrlId);
        tGroup.setAttribute('data-dependency-type', 'tangent_on_circle_line');
        tGroup.setAttribute('data-ext1', '120'); 
        tGroup.setAttribute('data-ext2', '120'); 
        
        const tHit = document.createElementNS(ns, "line");
        tHit.setAttribute('class', 'hit-line'); tHit.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        const tVis = document.createElementNS(ns, "line");
        tVis.setAttribute('class', 'visible-line');
        tVis.style.cssText = `stroke:${strokeColor}; stroke-width:2; pointer-events:none;`;
        tGroup.appendChild(tHit); tGroup.appendChild(tVis);
        shapesLayer.appendChild(tGroup);

        // 建立直角標
        const mark = document.createElementNS(ns, "path");
        mark.setAttribute('class', 'shape mark-path');
        mark.setAttribute('data-tool', 'mark');
        mark.setAttribute('data-owner-shape', target.id);
        mark.setAttribute('data-tangent-ctrl', ctrlId);
        mark.setAttribute('data-dependency-type', 'tangent_on_circle_mark');
        mark.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none; cursor:move;";
        shapesLayer.appendChild(mark);

        // 【修正3】最後建立切點控制點 (最上層)
        const ctrlPt = document.createElementNS(ns, "circle");
        ctrlPt.id = ctrlId;
        ctrlPt.setAttribute('cx', px); ctrlPt.setAttribute('cy', py); ctrlPt.setAttribute('r', pointRadius);
        ctrlPt.setAttribute('class', 'shape vertex-handle-like'); 
        ctrlPt.setAttribute('data-tool', 'point');
        ctrlPt.setAttribute('data-owner-shape', target.id);
        ctrlPt.setAttribute('data-dependency-type', 'tangent_on_circle_ctrl');
        ctrlPt.setAttribute('data-angle', angleRad); 
        ctrlPt.style.cssText = "fill:#8e44ad; stroke:white; stroke-width:1.5; cursor:move;";
        shapesLayer.appendChild(ctrlPt);

        if (typeof updateDependentShapes === 'function') updateDependentShapes(target);

        saveState();
        setMode('select');
        deselectAll();
        addToSelection(ctrlPt);
        return;
    }    // 2. 畫半徑、直徑、弦 (產生獨立的連動線段)
    const group = document.createElementNS(ns, "g");
    group.setAttribute('class', 'shape group');
    group.setAttribute('data-tool', 'line');
    group.setAttribute('data-owner-shape', target.id); // 綁定給圓形
    group.setAttribute('data-dependency-type', type);  // 記錄類型: radius, diameter, chord
    group.id = 'line-' + Date.now();

    let p1, p2;
    if (type === 'radius') {
        group.setAttribute('data-angle', angleRad); // 紀錄角度
        p1 = { x: cx, y: cy }; // 圓心
        p2 = { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }; // 圓周
    } else if (type === 'diameter') {
        group.setAttribute('data-angle', angleRad); // 紀錄角度
        p1 = { x: cx - r * Math.cos(angleRad), y: cy - r * Math.sin(angleRad) }; // 對向圓周
        p2 = { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }; // 點擊圓周
    } else if (type === 'chord') {
        const a1 = angleRad - Math.PI/4;
        const a2 = angleRad + Math.PI/4;
        group.setAttribute('data-angle1', a1); // 紀錄弦的兩個角度
        group.setAttribute('data-angle2', a2);
        p1 = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
        p2 = { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) };
    }
    const strokeColor = document.getElementById('stroke-color-select').value || "#000000";

    const hitLine = document.createElementNS(ns, "line");
    hitLine.setAttribute('x1', p1.x); hitLine.setAttribute('y1', p1.y);
    hitLine.setAttribute('x2', p2.x); hitLine.setAttribute('y2', p2.y);
    hitLine.setAttribute('class', 'hit-line');
    hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";

    const visLine = document.createElementNS(ns, "line");
    visLine.setAttribute('x1', p1.x); visLine.setAttribute('y1', p1.y);
    visLine.setAttribute('x2', p2.x); visLine.setAttribute('y2', p2.y);
    visLine.setAttribute('class', 'visible-line');
    visLine.style.cssText = `stroke:${strokeColor}; stroke-width:2; pointer-events:none;`;

    group.appendChild(hitLine);
    group.appendChild(visLine);
    shapesLayer.appendChild(group);

    saveState();
    setMode('select');
    deselectAll();
    addToSelection(group); // 選取新線段，讓控制點顯示出來
};

window.smartFloodFill = function(colorOverride = null) {
    const x = Math.round(lastContextPos.x);
    const y = Math.round(lastContextPos.y);
    const fillColor = colorOverride || document.getElementById('fill-color-select').value;
    const fillStyle = document.getElementById('fill-style-select').value;
    
    // 1. 不論選了什麼顏色，只要點到已存在的填色區域，就先將其清除！
    const allPaths = document.querySelectorAll('path[data-tool="polygon"]');
    const pt = svgCanvas.createSVGPoint();
    pt.x = x;
    pt.y = y;
    let removedOldFill = false;

    // 反向迴圈：從最後加入(最上層)的圖層開始偵測
    for (let i = allPaths.length - 1; i >= 0; i--) {
        const fillPath = allPaths[i];
        
        // 確保只針對「填滿產生的物件」進行刪除 (排除使用者自己畫的有邊框多邊形)
        if (fillPath.getAttribute('data-dependency-type') !== 'smart_fill' && fillPath.style.stroke !== 'none' && fillPath.getAttribute('stroke') !== 'none') {
            continue;
        }

        try {
            const matrix = fillPath.getCTM().inverse();
            const localPt = pt.matrixTransform(matrix);

            // 判斷點擊位置是否在該 path 的填滿範圍內
            if (fillPath.isPointInFill(localPt)) {
                fillPath.remove();
                removedOldFill = true;
                if (typeof saveState === 'function') saveState();
                
                // 如果使用者選了「無填滿」，只要刪掉舊的就結束
                if (fillColor === 'none') {
                    if (typeof statusText !== 'undefined') statusText.innerText = "已移除該區域的填色";
                    return; 
                }
                break; // 刪完後跳出迴圈，準備重新填滿新顏色
            }
        } catch(e) { continue; }
    }
    
    if (fillColor === 'none' && !removedOldFill) {
        if (typeof statusText !== 'undefined') statusText.innerText = "此處沒有可移除的填色";
        return;
    }

    // 2. 隱藏所有包含定錨點、控制點的輔助圖層，避免在填色時挖出空洞
    const tempLayer = document.getElementById('temp-layer');
    const handlesLayer = document.getElementById('handles-layer');
    const selRect = document.getElementById('selection-rect');
    
    const safeHide = (el) => { if (el) { el.dataset.oldDisplay = el.style.display; el.style.display = 'none'; } };
    const safeRestore = (el) => { if (el) el.style.display = el.dataset.oldDisplay || ''; };

    safeHide(tempLayer);
    safeHide(handlesLayer);
    safeHide(selRect);

    // 3. 【防漏水機制】：在截圖計算前，將畫布上所有「虛線」暫時強制轉為「實線」
    const dashCache =[];
    const allElements = svgCanvas.querySelectorAll('*');
    allElements.forEach(el => {
        const sDash = el.style.strokeDasharray;
        const aDash = el.getAttribute('stroke-dasharray');
        if ((sDash && sDash !== 'none') || (aDash && aDash !== 'none')) {
            dashCache.push({ el, sDash, aDash });
            el.style.strokeDasharray = 'none';
            el.setAttribute('stroke-dasharray', 'none');
        }
    });

    const w = svgCanvas.clientWidth;
    const h = svgCanvas.clientHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // 將乾淨且「全部皆為實線」的畫布轉為字串
    const svgData = new XMLSerializer().serializeToString(svgCanvas);
    
    // 拍照完成，立即恢復輔助圖層顯示與原本的虛線樣式 (肉眼完全看不出變化)
    safeRestore(tempLayer);
    safeRestore(handlesLayer);
    safeRestore(selRect);
    
    dashCache.forEach(cache => {
        if (cache.sDash) cache.el.style.strokeDasharray = cache.sDash;
        else cache.el.style.strokeDasharray = '';
        
        if (cache.aDash) cache.el.setAttribute('stroke-dasharray', cache.aDash);
        else cache.el.removeAttribute('stroke-dasharray');
    });

    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = "white"; 
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const pixels = imgData.data;
        const targetIdx = (y * w + x) * 4;

        // 如果點擊處非白色，代表點在黑線上 (或者有未清掉的東西)
        if (pixels[targetIdx] < 200 || pixels[targetIdx+1] < 200 || pixels[targetIdx+2] < 200) { 
            showAlert("請點擊在封閉區域的「內部空白處」"); 
            return; 
        }

        const filledPixels = new Uint8Array(w * h);
        const stack = [[x, y]];
        while (stack.length > 0) {
            const [curX, curY] = stack.pop();
            const idx = (curY * w + curX);
            if (curX < 0 || curX >= w || curY < 0 || curY >= h || filledPixels[idx] || (pixels[idx * 4] < 200 || pixels[idx * 4 + 1] < 200 || pixels[idx * 4 + 2] < 200)) {
                continue;
            }
            filledPixels[idx] = 1;
            stack.push([curX + 1, curY], [curX - 1, curY],[curX, curY + 1],[curX, curY - 1]);
        }

        const pathData = generatePathFromBitmask(filledPixels, w, h);
        if (pathData) {
            const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            newPath.setAttribute("d", pathData);
            newPath.setAttribute("class", "shape");
            newPath.setAttribute("data-tool", "polygon");
            // 標示它是一個智慧填滿區塊
            newPath.setAttribute("data-dependency-type", "smart_fill");
            
            if (typeof updateShapeFill === 'function') {
                updateShapeFill(newPath, fillColor, fillStyle);
            } else {
                newPath.style.fill = fillColor;
            }
            
            // 4. 【修復純色背景 Bug】：讓邊框直接繼承 fill 的樣式！
            // 不論是單純的色碼，還是 pattern 的網址 (url(#...))，都完美繼承
            newPath.style.stroke = newPath.style.fill; 
            newPath.style.strokeWidth = "2.5px"; 
            newPath.style.strokeLinejoin = "round";

            let ownerShape = null;
            if (typeof findShapeAtPosition === 'function') {
                ownerShape = findShapeAtPosition(x, y);
            }
            if (ownerShape) {
                if (!ownerShape.id) ownerShape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2,5);
                newPath.setAttribute('data-owner-shape', ownerShape.id);
            }

            shapesLayer.insertBefore(newPath, shapesLayer.firstChild);
            saveState();
            statusText.innerText = "已完成區域填色 (含去鋸齒與虛線防漏)";
        }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
};

function generatePathFromBitmask(mask, w, h) {
    let d = "";
    // ▼▼▼ 核心修改：將掃描步長從 2 改為 1，產生更精細的路徑 ▼▼▼
    const step = 1; 
    
    for (let y = 0; y < h; y += step) {
        let x = 0;
        while (x < w) {
            if (mask[y * w + x]) {
                let startX = x;
                while (x < w && mask[y * w + x]) {
                    x += step;
                }
                let endX = x;
                d += `M ${startX} ${y} h ${endX - startX} v ${step} h ${-(endX - startX)} Z `;
            } else {
                x += step;
            }
        }
    }
    return d;
}
window.createLinkedPolygon = function(circle, type) {
    if (!circle.id) circle.id = 'circle-' + Date.now();
    
    openNumberInputModal("請輸入多邊形邊數 (例如: 5)", "5", (val) => {
        const n = parseInt(val);
        if (isNaN(n) || n < 3) return;

        const m = circle.getCTM();
        const cx = (parseFloat(circle.getAttribute('cx')) || 0) * m.a + m.e;
        const cy = (parseFloat(circle.getAttribute('cy')) || 0) * m.d + m.f;
        const r = (parseFloat(circle.getAttribute('rx')) || parseFloat(circle.getAttribute('r')) || 0) * m.a;

        const poly = document.createElementNS(ns, "polygon");
        poly.setAttribute('class', 'shape linked-polygon');
        poly.setAttribute('data-tool', 'polygon');
        poly.setAttribute('data-sub-tool', 'polygon-regular');
        poly.setAttribute('data-owner-circle', circle.id);
        poly.setAttribute('data-polygon-type', type);
        poly.setAttribute('data-polygon-sides', n);
        
        let radius = r;
        if (type === 'circumscribed') {
            radius = r / Math.cos(Math.PI / n);
        }
        
        const startAngle = 0;
        const polyPts =[];
        for (let i = 0; i < n; i++) {
            const angle = startAngle + (i * 2 * Math.PI) / n;
            polyPts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
        }
        poly.setAttribute('points', polyPts.join(' '));
        
        // 🌟 記錄原始狀態，供後續圓形縮放時計算比例
        poly.setAttribute('data-base-cx', cx);
        poly.setAttribute('data-base-cy', cy);
        poly.setAttribute('data-base-r', r);
        
        poly.style.cssText = "stroke:#8e44ad; stroke-width:2; fill:none; vector-effect:non-scaling-stroke;";
        poly.id = 'poly-' + Date.now();
        document.getElementById('shapes-layer').appendChild(poly);
        
        saveState();
        statusText.innerText = `已建立與圓連動的${type === 'inscribed' ? '內接' : '外切'}正 ${n} 邊形`;

        // 🌟 畫完預設選取
        setTimeout(() => {
            setMode('select');
            deselectAll();
            addToSelection(poly);
        }, 50);
    });
};

window.redrawAxisChart = function(group) {
    if (!group) return;
    Array.from(group.children).forEach(c => c.remove());

    const w = parseFloat(group.getAttribute('data-w')) || 350;
    const h = parseFloat(group.getAttribute('data-h')) || 200;
    const cx = parseFloat(group.getAttribute('data-center-x'));
    const cy = parseFloat(group.getAttribute('data-center-y'));
    
    let params;
    try { params = JSON.parse(group.getAttribute('data-params')); } catch(e) { return; }

    // 【修改】：以逗號分割，保留空字串，將空數值轉為 0
    const xLabels = (params.p_x_labels || "").split(/[,，]/).map(s => s.trim());
    const vals = (params.p_vals || "").split(/[,，]/).map(s => parseFloat(s.trim())).map(n => isNaN(n) ? 0 : n);
    const guideLabels = (params.p_guide_labels || "").split(/[,，]/).map(s => s.trim());

    const count = Math.max(xLabels.length, vals.length);
    const yInterval = parseFloat(params.p_y_interval) || 10;

    const userMax = parseFloat(params.p_y_max) || 0;
    const maxV = userMax > 0 ? userMax : Math.max(...vals, 100);
    const scaleY = h / maxV;

    const originX = cx - w/2;
    const originY = cy + h/2;
    
    // 記錄供拖曳計算使用
    group.setAttribute('data-origin-x', originX);
    group.setAttribute('data-origin-y', originY);
    group.setAttribute('data-scale-y', scaleY);
    group.setAttribute('data-w', w);

    const mkLine = (x1, y1, x2, y2, color, width, dash = 'none', marker = null) => {
        const l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.style.cssText = `stroke:${color}; stroke-width:${width}; stroke-dasharray:${dash}; vector-effect:non-scaling-stroke; pointer-events:none;`;
        if (marker) l.setAttribute('marker-end', marker);
        return l;
    };

    // Axes
	const xAxis = mkLine(originX, originY, originX + w + 20, originY, 'black', 2, 'none', 'url(#arrow-end)');
    xAxis.setAttribute('class', 'shape');
    xAxis.style.pointerEvents = 'all';
    group.appendChild(xAxis);
    
    const yAxis = mkLine(originX, originY, originX, originY - h - 20, 'black', 2, 'none', 'url(#arrow-end)');
    yAxis.setAttribute('class', 'shape');
    yAxis.style.pointerEvents = 'all';
    group.appendChild(yAxis);
	
    const labelPos = params.p_label_pos || 'side';

    if (params.p_x_name) {
        if (labelPos === 'arrow') {
             group.appendChild(mkText(originX + w + 20, originY + 20, params.p_x_name, 'end', '16'));
        } else {
             group.appendChild(mkText(originX + w / 2, originY + 45, params.p_x_name, 'middle', '16'));
        }
    }

    if (params.p_y_name) {
        if (labelPos === 'arrow') {
             group.appendChild(mkText(originX - 15, originY - h - 20, params.p_y_name, 'end', '16'));
        } else {
             const labelX = originX - 55;
             const labelY = originY - h / 2;
             const t = mkText(labelX, labelY, params.p_y_name, 'middle', '16');
             
             if (/[\u4e00-\u9fa5]/.test(params.p_y_name)) {
                 t.style.writingMode = "vertical-rl";
                 t.style.textOrientation = "upright";
             } else {
                 t.setAttribute("transform", `rotate(-90, ${labelX}, ${labelY})`);
             }
             group.appendChild(t);
        }
    }

	group.appendChild(mkText(originX - 10, originY, "0", 'end', '14'));

    for (let v = yInterval; v <= maxV; v += yInterval) {
        const py = originY - v * scaleY;
        group.appendChild(mkLine(originX - 5, py, originX, py, 'black', 1.5));
        group.appendChild(mkText(originX - 10, py, v.toString(), 'end', '14'));
    }

    const ptsData =[];
    const startAtY = params.p_start_y === true; 
    const xStep = startAtY ? (w / Math.max(count, 1)) : (w / (count + 1));
	
    let pointRadius = 5; 
    try {
        const cachedP = localStorage.getItem('math_editor_param_point');
        if (cachedP) pointRadius = parseFloat(JSON.parse(cachedP).p_r) || 5;
    } catch(e) {}	

    for (let i = 0; i < count; i++) {
        const px = startAtY ? (originX + i * xStep) : (originX + (i + 1) * xStep);
        const val = vals[i] !== undefined ? vals[i] : 0;
        const py = originY - val * scaleY;
        ptsData.push({x: px, y: py, val: val, index: i});
    }

    if (params.p_show_line && ptsData.length > 0) {
        const polyline = document.createElementNS(ns, 'polyline');
        const ptsString = ptsData.map(p => `${p.x},${p.y}`).join(' ');
        polyline.setAttribute('points', ptsString);
        polyline.setAttribute('class', 'chart-polyline');
        polyline.style.cssText = "stroke:#2980b9; stroke-width:2.5; fill:none; pointer-events:none;";
        group.appendChild(polyline);
    }

    ptsData.forEach(p => {
        const ptGroup = document.createElementNS(ns, 'g');
        ptGroup.setAttribute('class', 'shape line-chart-point');
        ptGroup.setAttribute('data-tool', 'line-chart-point');
        ptGroup.setAttribute('data-index', p.index);
        ptGroup.style.cursor = 'move'; 

        const gX = mkLine(originX, p.y, p.x, p.y, '#e74c3c', 1.5, '4,4');
        gX.classList.add('point-guide', 'guide-x');
        gX.style.display = 'none';

        const gY = mkLine(p.x, originY, p.x, p.y, '#e74c3c', 1.5, '4,4');
        gY.classList.add('point-guide', 'guide-y');
        gY.style.display = 'none';

        ptGroup.appendChild(gX);
        ptGroup.appendChild(gY);

        // 【新增】：輔助線 Y 軸標籤
        if (guideLabels[p.index]) {
            const guideTxt = mkText(originX - 5, p.y, guideLabels[p.index], 'end', '14');
            guideTxt.classList.add('point-guide', 'guide-y-label', 'shape'); // 加入 shape 讓系統可選取
            guideTxt.setAttribute('data-tool', 'guide-y-label');
            guideTxt.style.display = 'none';
            guideTxt.style.fill = '#e74c3c';
            guideTxt.style.fontWeight = 'bold';
            guideTxt.style.pointerEvents = 'all'; // 允許滑鼠點擊
            guideTxt.style.setProperty('cursor', 'ew-resize', 'important'); // 顯示左右拖曳游標
            ptGroup.appendChild(guideTxt);
        }
		
        const tickX = mkLine(p.x, originY, p.x, originY + 5, 'black', 1.5);
        tickX.classList.add('point-x-tick');
        ptGroup.appendChild(tickX);

        if (xLabels[p.index]) {
            const xTxt = mkText(p.x, originY + 20, xLabels[p.index], 'middle', '14');
            xTxt.classList.add('point-x-label');
            xTxt.style.pointerEvents = 'none'; 
            ptGroup.appendChild(xTxt);
        }

        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', p.x); circle.setAttribute('cy', p.y);
        circle.setAttribute('r', pointRadius);
        circle.setAttribute('class', 'point-circle');
        circle.style.cssText = "fill:#e74c3c; stroke:white; stroke-width:1.5px;";
        ptGroup.appendChild(circle);

        if (params.p_show_val && p.val !== 0) {
            const txt = mkText(p.x, p.y - 12, p.val.toString(), 'middle', '14');
            txt.setAttribute('class', 'point-val');
            txt.style.stroke = 'none'; 
            txt.style.paintOrder = 'fill';
            txt.style.pointerEvents = 'all'; 
            txt.style.fill = '#c0392b';
            txt.style.fontWeight = 'bold';
            ptGroup.appendChild(txt);
        }

        group.appendChild(ptGroup);
    });
};

window.resetLineChartXSpacing = function(chartGroup) {
    if (!chartGroup || chartGroup.getAttribute('data-sub-tool') !== 'axis-chart') return;
    
    const w = parseFloat(chartGroup.getAttribute('data-w')) || 350;
    const originX = parseFloat(chartGroup.getAttribute('data-origin-x'));
    if (isNaN(originX)) return;

    let params;
    try { params = JSON.parse(chartGroup.getAttribute('data-params')); } catch(e) { return; }

    // 【修改】：同樣改為逗號分割不略過空值
    const xLabels = (params.p_x_labels || "").split(/[,，]/).map(s => s.trim());
    const vals = (params.p_vals || "").split(/[,，]/).map(s => parseFloat(s.trim())).map(n => isNaN(n) ? 0 : n);
    const count = Math.max(xLabels.length, vals.length);
    if (count === 0) return;

    const startAtY = params.p_start_y === true; 
    const xStep = startAtY ? (w / Math.max(count, 1)) : (w / (count + 1));
    
    const points = chartGroup.querySelectorAll('.line-chart-point');
    const polyline = chartGroup.querySelector('.chart-polyline');
    let ptsArr = polyline ? polyline.getAttribute('points').split(' ') :[];

    points.forEach(ptGroup => {
        const idx = parseInt(ptGroup.getAttribute('data-index'));
        if (isNaN(idx)) return;

        const targetX = startAtY ? (originX + idx * xStep) : (originX + (idx + 1) * xStep);
        
        const circle = ptGroup.querySelector('.point-circle');
        const gX = ptGroup.querySelector('.guide-x');
        const gY = ptGroup.querySelector('.guide-y');
        const txt = ptGroup.querySelector('.point-val');
        const tickX = ptGroup.querySelector('.point-x-tick');
        const lblX = ptGroup.querySelector('.point-x-label');
        
        if (circle) circle.setAttribute('cx', targetX);
        if (gX) gX.setAttribute('x2', targetX);
        if (gY) {
            gY.setAttribute('x1', targetX);
            gY.setAttribute('x2', targetX);
        }
        if (txt) txt.setAttribute('x', targetX);
        if (tickX) {
            tickX.setAttribute('x1', targetX);
            tickX.setAttribute('x2', targetX);
        }
        if (lblX) lblX.setAttribute('x', targetX);
        
        if (polyline && ptsArr[idx]) {
            const coords = ptsArr[idx].split(',');
            if (coords.length === 2) {
                ptsArr[idx] = `${targetX},${coords[1]}`;
            }
        }
    });

    if (polyline && ptsArr.length > 0) {
        polyline.setAttribute('points', ptsArr.join(' '));
    }
};

window.markAnglesAtPoint = function(rawX, rawY, style = 'degree') {
    const allShapes = document.querySelectorAll('#shapes-layer .shape');
    let allSegments =[];
    
    allShapes.forEach(shape => {
        const tool = shape.getAttribute('data-tool');
        if (tool === 'text' || tool === 'math' || tool === 'mark' || tool === 'group' || shape.classList.contains('vertex-label') || shape.classList.contains('angle-label-text')) return;
        
        const geo = extractGeometry(shape);
        if (!geo) return;
        
        geo.segments.forEach(seg => {
            allSegments.push({ p1: seg.p1, p2: seg.p2, shape: shape });
        });
    });

    let exactCenter = { x: rawX, y: rawY };
    let minSnapDist = 20; 

    // 尋找真正的數學交點或頂點
    let potentialCenters =[];
    allSegments.forEach(seg => {
        potentialCenters.push(seg.p1);
        potentialCenters.push(seg.p2);
    });
    for (let i = 0; i < allSegments.length; i++) {
        for (let j = i + 1; j < allSegments.length; j++) {
            const pt = getLineLineIntersection(allSegments[i].p1, allSegments[i].p2, allSegments[j].p1, allSegments[j].p2);
            if (pt) potentialCenters.push(pt);
        }
    }
    
    potentialCenters.forEach(pt => {
        const d = Math.hypot(pt.x - rawX, pt.y - rawY);
        if (d < minSnapDist) {
            minSnapDist = d;
            exactCenter = { x: pt.x, y: pt.y };
        }
    });

    // 收集從交點發散出去的射線
    let rays =[];
    allSegments.forEach(seg => {
        const proj = getProjectionOnSegment(exactCenter.x, exactCenter.y, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
        if (Math.hypot(proj.x - exactCenter.x, proj.y - exactCenter.y) < 1) {
            const d1 = Math.hypot(seg.p1.x - exactCenter.x, seg.p1.y - exactCenter.y);
            const d2 = Math.hypot(seg.p2.x - exactCenter.x, seg.p2.y - exactCenter.y);
            if (d1 > 2) rays.push({ point: seg.p1, shape: seg.shape });
            if (d2 > 2) rays.push({ point: seg.p2, shape: seg.shape });
        }
    });

    if (rays.length >= 2) {
        const rayAngles = rays.map(r => ({
            angle: Math.atan2(r.point.y - exactCenter.y, r.point.x - exactCenter.x),
            shape: r.shape,
            point: r.point
        })).sort((a, b) => a.angle - b.angle);

        const uniqueRays =[];
        rayAngles.forEach(r => {
            if (uniqueRays.length === 0) {
                uniqueRays.push(r);
            } else {
                const last = uniqueRays[uniqueRays.length - 1];
                let diff = r.angle - last.angle;
                if (diff > Math.PI) diff -= 2 * Math.PI;
                if (diff < -Math.PI) diff += 2 * Math.PI;
                if (Math.abs(diff) > 0.05) uniqueRays.push(r);
            }
        });

        if (uniqueRays.length >= 2) {
            const first = uniqueRays[0];
            const last = uniqueRays[uniqueRays.length - 1];
            if (Math.abs((last.angle - first.angle) - 2 * Math.PI) < 0.05) {
                uniqueRays.pop(); 
            }
        }

        const count = uniqueRays.length;
        if (count < 2) return false;

        let markedCount = 0;
        
        let mouseAngle = Math.atan2(rawY - exactCenter.y, rawX - exactCenter.x);
        if (mouseAngle < 0) mouseAngle += 2 * Math.PI;
        
        let targetRayIndex = -1;
        for (let i = 0; i < count; i++) {
            let a1 = uniqueRays[i].angle;
            let a2 = uniqueRays[(i + 1) % count].angle;
            if (a1 < 0) a1 += 2 * Math.PI;
            if (a2 < 0) a2 += 2 * Math.PI;
            if (a2 < a1) a2 += 2 * Math.PI; 
            
            let mA = mouseAngle;
            if (mA < a1) mA += 2 * Math.PI;

            if (mA >= a1 && mA <= a2) {
                targetRayIndex = i;
                break;
            }
        }

        if (targetRayIndex !== -1) {
            const r1 = uniqueRays[targetRayIndex];
            const r2 = uniqueRays[(targetRayIndex + 1) % count];
            
            let diff = r2.angle - r1.angle;
            while (diff <= 0) diff += 2 * Math.PI;

            if (diff > 3.0) return false; // 跳過平角
            
            if (r1.shape && !r1.shape.id) r1.shape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            if (r2.shape && !r2.shape.id) r2.shape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            
            const lineRef = (r1.shape && r2.shape) ? `${r1.shape.id},${r2.shape.id}` : null;
            buildIntersectionAngle(exactCenter, r1.angle, r2.angle, diff, lineRef, style);
            markedCount++;
        }

        if (markedCount > 0) {
            saveState();
            if(typeof statusText !== 'undefined') statusText.innerText = `✅ 已精準標註該區塊角度`;
            return true;
        }
    }
    if(typeof statusText !== 'undefined') statusText.innerText = "無法在該點找到足夠的線段形成角度";
    return false;
};
window.updateEdgeMarkStyle = function(markEl, style) {
    let pathD = "";
    const s = 5; 
    const h = 8;
    if (style === '1') pathD = `M 0 -${s} L 0 ${s}`;
    else if (style === '2') pathD = `M -2 -${s} L -2 ${s} M 2 -${s} L 2 ${s}`;
    else if (style === '3') pathD = `M -4 -${s} L -4 ${s} M 0 -${s} L 0 ${s} M 4 -${s} L 4 ${s}`;
    else if (style === 'tick') pathD = `M 0 0 L 0 -${s+2}`;
    else if (style === 'x') pathD = `M -4 -4 L 4 4 M -4 4 L 4 -4`;
    else if (style === 'o') pathD = `M -4 0 A 4 4 0 1 0 4 0 A 4 4 0 1 0 -4 0`;
    else if (style === 'parallel') pathD = `M -${h} -${s} L ${h} 0 L -${h} ${s}`;
    else pathD = `M 0 -${s} L 0 ${s}`;
    
    markEl.setAttribute("d", pathD);
};

window.cycleAngleMark = function(el, ignoreNewStyle = null) {
    const ownerId = el.getAttribute('data-owner-shape') || el.getAttribute('data-owner-angle-shape');
    const lineRef = el.getAttribute('data-intersection-lines');

    let currentStyle = el.getAttribute('data-angle-type') || el.getAttribute('data-angle-style');
    if (!currentStyle) {
        currentStyle = el.classList.contains('angle-label-text') ? 'degree' : 'arc';
    }
    
    // 【修正】從物件陣列中提取 symbol
    const customSymbols = (window.customMarksList ||[]).map(m => m.symbol);
    const allStyles = [...window.ANGLE_STYLES, ...customSymbols];
    
    let currentIndex = allStyles.indexOf(currentStyle);
    if (currentIndex === -1) currentIndex = 0;
    currentIndex = (currentIndex + 1) % allStyles.length;
    
    currentAngleStyle = allStyles[currentIndex];

    // ==========================================
    // A. 處理交點角 (Intersection Angles)
    // ==========================================
    if (lineRef) {
        const uniqueId = el.getAttribute('data-unique-angle-id');
        const sig = el.getAttribute('data-sector-sig') || ''; 
        const rad = parseFloat(el.getAttribute('data-radius-offset')) || 25;

        if (uniqueId) {
            const inter = { x: parseFloat(el.getAttribute('data-inter-x')), y: parseFloat(el.getAttribute('data-inter-y')) };
            const angA = parseFloat(el.getAttribute('data-ang-a'));
            const angC = parseFloat(el.getAttribute('data-ang-c'));
            const diff = parseFloat(el.getAttribute('data-diff'));

            document.querySelectorAll(`[data-unique-angle-id="${uniqueId}"]`).forEach(s => s.remove());
            const newMark = buildIntersectionAngle(inter, angA, angC, diff, lineRef, currentAngleStyle, sig, rad);
            
            deselectAll();
            if (newMark) addToSelection(newMark);
            return;
        }
    }

    // ==========================================
    // B. 處理頂點角 (Vertex Angles)
    // ==========================================
    if (ownerId) {
        const ownerShape = document.getElementById(ownerId);
        const vertexIdx = parseInt(el.getAttribute('data-vertex-index'));
        const radius = parseFloat(el.getAttribute('data-radius-offset')) || 25;

        if (ownerShape && !isNaN(vertexIdx)) {
            document.querySelectorAll(`[data-owner-shape="${ownerId}"][data-vertex-index="${vertexIdx}"],[data-owner-angle-shape="${ownerId}"][data-vertex-index="${vertexIdx}"]`).forEach(m => m.remove());
            
            const pts = getTransformedPoints(ownerShape);
            const tool = ownerShape.getAttribute('data-tool');
            const subTool = ownerShape.getAttribute('data-sub-tool');
            
            let A, B, C;
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
                B = pts[vertexIdx]; 
                A = pts[(vertexIdx - 1 + pts.length) % pts.length]; 
                C = pts[(vertexIdx + 1) % pts.length]; 
            }

            if (!A || !B || !C) return;
            const newMark = createAngleMarkAt(A, B, C, ownerShape, radius);

            deselectAll();
            if (newMark) addToSelection(newMark);
        }
    }
};

window.getRaySig = function(ray, inter) {
    if (!ray.seg || !ray.seg.shape || !ray.seg.shape.id) return '';
    const dx = ray.seg.p2.x - ray.seg.p1.x;
    const dy = ray.seg.p2.y - ray.seg.p1.y;
    const rdx = ray.point.x - inter.x;
    const rdy = ray.point.y - inter.y;
    const dot = dx * rdx + dy * rdy;
    const dir = dot >= 0 ? 'p' : 'n'; // p: 同向, n: 反向
    return `${ray.seg.shape.id}_e${ray.seg.edgeIndex || 0}_${dir}`;
};

window.cycleEdgeMark = function(el) {
    const ownerId = el.getAttribute('data-owner');
    const ownerShape = document.getElementById(ownerId);
    
    let currentStyle = el.getAttribute('data-edge-style') || currentEdgeStyle;
    
    // 【修正】從物件陣列中提取 symbol
    const customSymbols = (window.customMarksList ||[]).map(m => m.symbol);
    const allStyles = [...window.EDGE_STYLES, ...customSymbols];
    
    let currentIndex = allStyles.indexOf(currentStyle);
    if (currentIndex === -1) currentIndex = 0;
    currentIndex = (currentIndex + 1) % allStyles.length;
    
    const newStyle = allStyles[currentIndex];
    currentEdgeStyle = newStyle;

    if (ownerShape) {
        const edgeIndex = parseInt(el.getAttribute('data-edge-index'));
        const pts = getTransformedPoints(ownerShape);
        if (!isNaN(edgeIndex) && pts[edgeIndex] && pts[(edgeIndex+1)%pts.length]) {
            const p1 = pts[edgeIndex];
            const p2 = pts[(edgeIndex+1)%pts.length];
            
            el.remove(); // 刪除舊標記
            const newMark = createEdgeMarkAt(p1, p2, ownerShape); // 建立新標記
            
            deselectAll();
            if (newMark) addToSelection(newMark);
        }
    }
};

window.addPolylineSegment = function(shape) {
    if (!shape || shape.getAttribute('data-tool') !== 'polyline') return;
    
    openNumberInputModal("請輸入新增折段數 (最小1)", "1", (val) => {
        let n = parseInt(val);
        if (isNaN(n) || n < 1) return;
        
        const ptsStr = shape.getAttribute('points');
        if (!ptsStr) return;
        
        let pts = ptsStr.trim().split(/\s+|,/).filter(v => v !== '');
        if (pts.length < 2) return;
        
        let lastX = parseFloat(pts[pts.length - 2]);
        let lastY = parseFloat(pts[pts.length - 1]);
        
        // 找出最後兩個點的向量，如果只有一點則預設向右下方
        let dirX = 50, dirY = 0;
        if (pts.length >= 4) {
            let prevX = parseFloat(pts[pts.length - 4]);
            let prevY = parseFloat(pts[pts.length - 3]);
            let len = Math.hypot(lastX - prevX, lastY - prevY);
            if (len > 0) {
                dirX = (lastX - prevX) / len * 50;
                dirY = (lastY - prevY) / len * 50;
            }
        }

        // 取得畫點的屬性 (半徑、實心與否)
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

        // 【新增】判斷是否要顯示折點：優先檢查該折線是否已有附屬折點
        let showPts = false;
        const existingPoints = document.querySelectorAll(`[data-owner-shape="${shape.id}"][data-dependency-type="polyline_point"]`);
        
        if (existingPoints.length > 0) {
            showPts = true;
        } else {
            // 若畫布上該圖形目前沒有折點，則讀取折線的參數設定
            try {
                const cachedPoly = localStorage.getItem('math_editor_param_polyline');
                if (cachedPoly) {
                    const parsedPoly = JSON.parse(cachedPoly);
                    if (parsedPoly.p_show_pts !== undefined) showPts = parsedPoly.p_show_pts;
                } else {
                    showPts = true; // 預設值
                }
            } catch(e) {
                showPts = true;
            }
        }
        
        const strokeColor = shape.getAttribute('stroke') || document.getElementById('stroke-color-select')?.value || '#000000';
        let currentPtsCount = pts.length / 2;

        for (let i = 0; i < n; i++) {
            // 轉個角度產生折線感
            let sign = (i % 2 === 0) ? 1 : -1;
            lastX += dirX + sign * (-dirY) * 0.5;
            lastY += dirY + sign * (dirX) * 0.5;
            
            pts.push(lastX);
            pts.push(lastY);
            
            // 根據設定決定是否新增端點圖示
            if (showPts) {
                const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                point.setAttribute('cx', lastX); 
                point.setAttribute('cy', lastY);
                point.setAttribute('r', pointRadius);
                point.setAttribute('data-solid', isSolid ? '1' : '0'); 
                point.style.cssText = `fill: ${isSolid ? strokeColor : 'white'}; stroke: ${isSolid ? 'none' : strokeColor}; stroke-width: 1.5px; vector-effect: non-scaling-stroke; cursor: move;`;
                point.setAttribute('class', 'shape'); 
                point.setAttribute('data-tool', 'point');
                point.setAttribute('data-owner-shape', shape.id); 
                point.setAttribute('data-dependency-type', 'polyline_point'); 
                point.setAttribute('data-vertex-index', currentPtsCount + i);
                document.getElementById('shapes-layer').appendChild(point);
            }
        }
        
        shape.setAttribute('points', pts.join(' '));
        
        // 更新把手與連動物件
        if (selectedElements.includes(shape)) {
            if (typeof drawHandles === 'function') drawHandles(shape);
        }
        if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
        
        // 若有開自動標註，重新產生標籤
        const autoLabel = document.getElementById('auto-label-check');
        if (autoLabel && autoLabel.checked && typeof deleteLinkedLabels === 'function' && typeof generateLabels === 'function') {
            deleteLinkedLabels(shape);
            generateLabels(shape, true);
        }
        
        saveState();
        statusText.innerText = `已新增 ${n} 個折段`;
    });
};
