function toggleConstructMenu() {
    const menu = document.getElementById('menu-construct');
    // 確保按鈕包裝容器存在以進行定位計算
    const btnConstruct = document.getElementById('btn-construct');
    if (!btnConstruct) return;
    const btnWrapper = btnConstruct.parentNode;

    // 1. 判斷當前選單是否已經是開啟狀態
    const isVisible = (menu.style.display === 'flex');

    // 2. 關閉畫面上所有已開啟的選單 (包含自己)
    closeAllMenus();

    // 3. 如果原本是關閉的，則開啟它；如果原本是開啟的，則維持關閉 (達成再次點擊消失)
    if (!isVisible) {
        fixMenuPosition('menu-construct', btnWrapper);
    }
}

function executeConstruction(type) {
    closeAllMenus();
    if (selectedElements.length === 0) return false;
    const target = selectedElements[0];
    const tool = target.getAttribute('data-tool');
    
    // 【修復 Bug】：統一使用最後點擊畫布的真實位置 (不分左右鍵)
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

        if (selectedElements.length === 1 && !target.id) {
            target.id = 'tri-' + Date.now();
        }
        const tid = target.id || 'virtual-tri'; 

        let pointRadius = 3;
        try {
            const cachedP = localStorage.getItem('math_editor_param_point');
            if (cachedP) pointRadius = JSON.parse(cachedP).p_r || 3;
        } catch(e) {}

        const colorAuxLine = '#7f8c8d'; 
        const colorMark = '#e74c3c';    
        const colorCircum = '#2980b9';  
        const colorIn = '#27ae60';      
        const colorDot = '#2c3e50';

        // 1. 生成獨立中心點
        const centerPt = document.createElementNS(ns, "circle");
        centerPt.setAttribute('r', pointRadius);
        centerPt.style.cssText = `fill:${colorDot}; stroke:transparent; stroke-width:10; cursor:move;`;
        centerPt.setAttribute('class', 'shape'); 
        centerPt.setAttribute('data-tool', 'point');
        centerPt.setAttribute('data-owner-shape', tid);
        centerPt.setAttribute('data-dependency-type', type + '_point');
        shapesLayer.appendChild(centerPt);

        // 2. 生成獨立圓形 (外/內)
        if (type === 'circumcenter' || type === 'incenter') {
            const circ = document.createElementNS(ns, "ellipse");
            circ.style.cssText = `fill:none; stroke:${type === 'circumcenter' ? colorCircum : colorIn}; stroke-width:1.5; stroke-dasharray:4,4; pointer-events:visibleStroke; cursor:move;`;
            circ.setAttribute('class', 'shape'); 
            circ.setAttribute('data-tool', 'ellipse');
            circ.setAttribute('data-sub-tool', 'circle');
            circ.setAttribute('data-owner-shape', tid);
            circ.setAttribute('data-dependency-type', type === 'circumcenter' ? 'circumcircle' : 'incircle');
            shapesLayer.appendChild(circ);
        }

        // 3. 生成獨立連線與標記
        for(let i=0; i<3; i++) {
            const lineGrp = document.createElementNS(ns, "g");
            lineGrp.setAttribute('class', 'shape group');
            lineGrp.setAttribute('data-tool', 'line');
            lineGrp.setAttribute('data-owner-shape', tid);
            lineGrp.setAttribute('data-dependency-type', type + '_line');
            if (type === 'circumcenter') lineGrp.setAttribute('data-edge-index', i);
            else lineGrp.setAttribute('data-vertex-index', i);

            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:12; cursor:move;";
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('class', 'visible-line'); visLine.style.cssText = `stroke:${colorAuxLine}; stroke-width:1.2; stroke-dasharray:4,4; vector-effect:non-scaling-stroke; pointer-events:none;`;
            
            lineGrp.appendChild(hitLine); lineGrp.appendChild(visLine);
            shapesLayer.appendChild(lineGrp);

            // 標記
            if (type === 'circumcenter') {
                const mark = document.createElementNS(ns, "polyline");
                mark.setAttribute('class', 'shape mark-path');
                mark.setAttribute('data-tool', 'mark');
                mark.setAttribute('data-owner-shape', tid);
                mark.setAttribute('data-dependency-type', 'circumcenter_mark');
                mark.setAttribute('data-edge-index', i);
                mark.style.cssText = `fill:none; stroke:${colorMark}; stroke-width:1.5; pointer-events:none;`;
                shapesLayer.appendChild(mark);
            } else if (type === 'incenter') {
                const mark = document.createElementNS(ns, "path");
                mark.setAttribute('class', 'shape mark-path');
                mark.setAttribute('data-tool', 'mark');
                mark.setAttribute('data-owner-shape', tid);
                mark.setAttribute('data-dependency-type', 'incenter_mark');
                mark.setAttribute('data-vertex-index', i);
                mark.style.cssText = `fill:none; stroke:${colorMark}; stroke-width:1.5; pointer-events:none;`;
                shapesLayer.appendChild(mark);
            } else if (type === 'centroid') {
                const mark = document.createElementNS(ns, "g");
                mark.setAttribute('class', 'shape group');
                mark.setAttribute('data-tool', 'mark');
                mark.setAttribute('data-owner-shape', tid);
                mark.setAttribute('data-dependency-type', 'centroid_mark');
                mark.setAttribute('data-vertex-index', i);
                shapesLayer.appendChild(mark);
            }
        }

        // 強制計算一次位置
        if (typeof window.syncTriangleCenters === 'function') {
            window.syncTriangleCenters(target);
        }

        saveState();
        if (!isContinuousMarking) {
            setMode('select');
            deselectAll();
            if (target) addToSelection(target); 
        }
        statusText.innerText = `已建立${(type==='circumcenter'?'外心':(type==='incenter'?'內心':'重心'))} (個別物件，可連動重繪)`;
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
            let minDist = Infinity,
                bestIdx = -1;
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
			
			// 1. 補上 class，讓它可以被選取
			pt.setAttribute('class', 'shape'); 

			// 2. 強制確保母物件有 ID，並寫入關聯
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
                x1 = pts[0].x;
                y1 = pts[0].y;
                x2 = pts[1].x;
                y2 = pts[1].y;
            }
        } else if (isMultiPart) {
            if (!isDirectClick) return false;
            const pts = getTransformedPoints(target);
            let minDist = Infinity,
                bestIdx = -1;
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
                x1 = pts[bestIdx].x;
                y1 = pts[bestIdx].y;
                x2 = pts[(bestIdx + 1) % pts.length].x;
                y2 = pts[(bestIdx + 1) % pts.length].y;
            } else {
                return false;
            }
        } else {
            return false;
        }
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
            const t = getTransformRotation(el);
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
        const t1 = {
            x: cPos.x + r * Math.cos(a1),
            y: cPos.y + r * Math.sin(a1)
        };
        const t2 = {
            x: cPos.x + r * Math.cos(a2),
            y: cPos.y + r * Math.sin(a2)
        };
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
            if (pts.length >= 2) {
                p1 = pts[0];
                p2 = pts[1];
            }
        } else if (isMultiPart) {
            if (!isDirectClick) return false;
            const pts = getTransformedPoints(target);
            let minDist = Infinity,
                bestIdx = -1;
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
        } else {
            return false;
        }
        openNumberInputModal("請輸入等分數 (例如 2, 3...)", "2", (inputVal) => {
            const n = parseInt(inputVal);
            if (isNaN(n) || n < 2) return;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const totalLen = Math.sqrt(dx * dx + dy * dy);
            if (totalLen === 0) return;
            const ux = dx / totalLen,
                uy = dy / totalLen;
            const nx = -uy,
                ny = ux;
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
			const createdObjs = []; // 用於收集所有新物件
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
                group.setAttribute('data-dependency-type', 'divide_angle_line'); // 識別類型
                group.setAttribute('data-vertex-index', vertexIdx); // 記錄是哪個頂點
                group.setAttribute('data-divide-ratio', i / n); // 記錄比例
				
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

			// 自動標記所有新產生的夾角
			for (let i = 0; i < n; i++) {
				const markAng = angBA + stepAng * (i + 0.5); // 每個夾角的中央
				// [方案 B] 將角平分符號 (×, ○) 的半徑往內縮 (原本 45，改為 28)，避免與外圈的度數打架
				const markDist = 28; 
				const mx = B.x + markDist * Math.cos(markAng);
				const my = B.y + markDist * Math.sin(markAng);
				
				const txt = document.createElementNS(ns, "text");
				txt.textContent = markSymbols[0]; // 固定使用第一個符號，例如 "×"
				txt.setAttribute('x', mx);
				txt.setAttribute('y', my);
				
                txt.setAttribute('class', 'shape'); 
				txt.setAttribute('data-tool', 'text');
				txt.setAttribute('data-owner-shape', target.id);
                
                // 加入新的依賴屬性
                txt.setAttribute('data-dependency-type', 'angle_division_mark');
                txt.setAttribute('data-vertex-index', vertexIdx);
                txt.setAttribute('data-divide-ratio', (i + 0.5) / n); // 位於區間中間
                // === 修改結束 ===

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
    }
    return false;
}

/**
 * 計算滑鼠位置在指定圓上的吸附點
 * @param {SVGCircleElement} circleEl - 目標圓形
 * @param {number} mouseX - 滑鼠 X 座標
 * @param {number} mouseY - 滑鼠 Y 座標
 * @returns {{x: number, y: number}} - 圓周上的點座標
 */
function snapToCircle(circleEl, mouseX, mouseY) {
    const m = circleEl.getCTM();
    const r = (circleEl.getAttribute('rx') || circleEl.getAttribute('r')) * m.a; // 取得縮放後的半徑
    const cx = (circleEl.getAttribute('cx') || 0) * m.a + m.e;
    const cy = (circleEl.getAttribute('cy') || 0) * m.d + m.f;

    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) { // 如果滑鼠剛好在圓心
        return { x: cx + r, y: cy }; // 回傳右邊的點
    }

    // 計算單位向量並乘以半徑
    const snapX = cx + (dx / dist) * r;
    const snapY = cy + (dy / dist) * r;
    
    return { x: snapX, y: snapY };
}

// 1. 🆕 新增：建立與清除輔助點的函式
let highlightPoints = []; // 儲存所有輔助點

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
    // highlightPoints 變數必須是在 construction.js 上方宣告的全域變數
    if (typeof highlightPoints !== 'undefined') {
        highlightPoints.forEach(p => p.remove());
        highlightPoints.length = 0; // 清空陣列
    }
};

function autoApplyConstruction(targetShape, clickX, clickY) {
    const tool = targetShape ? targetShape.getAttribute('data-tool') : null;
    const subTool = targetShape ? targetShape.getAttribute('data-sub-tool') : null;
    const isTargetCircle = targetShape && (subTool === 'circle' || (tool === 'ellipse' && targetShape.getAttribute('rx') === targetShape.getAttribute('ry')));
    const isTargetValid = !!targetShape; 
    
    let newlyCreated = null; 

    // =========================================================
    // 1. 圓形角系列 (0 步驟：點擊圓形直接生成預設圖形)
    // =========================================================
    if (['central', 'inscribed', 'tangent-chord'].includes(constructionModeType)) {
        if (!isTargetCircle) {
            statusText.innerText = "請點擊一個圓形！";
            return;
        }
        
        const m = targetShape.getCTM();
        const r = (parseFloat(targetShape.getAttribute('rx') || targetShape.getAttribute('r')) || 0) * m.a;
        const C = {
            x: (parseFloat(targetShape.getAttribute('cx')) || 0) * m.a + m.e,
            y: (parseFloat(targetShape.getAttribute('cy')) || 0) * m.d + m.f,
        };

        // 輔助函式：根據圓心與半徑計算圓周上的點
        const getPointOnCirc = (angleDeg) => {
            const rad = angleDeg * Math.PI / 180;
            return { x: C.x + r * Math.cos(rad), y: C.y + r * Math.sin(rad) };
        };

        let group;
        if (constructionModeType === 'central') {
            // 預設生成：右下方的圓心角 (0度 ~ 60度)
            const P1 = getPointOnCirc(0);
            const P2 = getPointOnCirc(60);
            group = createCircleAngleGroup('central-angle', targetShape,[C, P1, P2]);
        } 
        else if (constructionModeType === 'inscribed') {
            // 預設生成：底部的圓周角 (頂點在正上方)
            const A = getPointOnCirc(135);
            const V = getPointOnCirc(-90); 
            const B = getPointOnCirc(45);
            group = createCircleAngleGroup('inscribed-angle', targetShape, [A, V, B]);
        } 
        else if (constructionModeType === 'tangent-chord') {
            // 預設生成：右側的弦切角
            const P = getPointOnCirc(90);   // 切點 (頂點)
            const A = getPointOnCirc(210); // 弦的另一端
            
            // 計算初始切線方向與端點
            const dx = P.x - C.x;
            const dy = P.y - C.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            // 單位切線向量 (-dy, dx)
            const ux = -dy / len;
            const uy = dx / len;
            
            // 生成切線兩端點 T1, T2 (各延伸 80px)
            const ext = 80;
            const T1 = { x: P.x + ux * ext, y: P.y + uy * ext };
            const T2 = { x: P.x - ux * ext, y: P.y - uy * ext };

            // 傳入 4 個點：[A(弦尾), P(切點), T1, T2]
            group = createCircleAngleGroup('tangent-chord-angle', targetShape, [A, P, T1, T2]);
		}

        shapesLayer.appendChild(group);
        newlyCreated = group;
        
        saveState();
        setMode('select');
        setTimeout(() => {
            deselectAll();
            addToSelection(group);
            generateAngleLabels(group, true); 
        }, 50);
        statusText.innerText = `已建立圓形角 (可拖拉控制點修改)`;
        return;
    }
    
    // =========================================================
    // 2. 圓切線 (0 步驟自動生成圓外一點及兩條切線)
    // =========================================================
     else if (constructionModeType === 'tangent') {
        if (!isTargetCircle) {
            statusText.innerText = "這不是圓形，請點擊圓形邊緣";
            return;
        }

        const m = targetShape.getCTM();
        let cx, cy, r;

        // 讀取圓的幾何資訊
        if (subTool === 'circle-smart') {
            const body = targetShape.querySelector('.circle-body');
            cx = (parseFloat(body.getAttribute('cx')) || 0) * m.a + m.e;
            cy = (parseFloat(body.getAttribute('cy')) || 0) * m.d + m.f;
            r = (parseFloat(targetShape.getAttribute('data-radius')) || 0) * m.a;
        } else {
            cx = (parseFloat(targetShape.getAttribute('cx')) || 0) * m.a + m.e;
            cy = (parseFloat(targetShape.getAttribute('cy')) || 0) * m.d + m.f;
            r = (parseFloat(targetShape.getAttribute('rx') || targetShape.getAttribute('r')) || 0) * m.a;
        }
        
        if (!targetShape.id) targetShape.id = 'circle-' + Date.now();

        // 1. 建立「獨立」的控制點 (P)
        const dist = r * 2.5; 
        const ang = -Math.PI / 4; // 右上 45 度
        const px = cx + dist * Math.cos(ang);
        const py = cy + dist * Math.sin(ang);

        const ctrlPt = document.createElementNS(ns, "circle");
        ctrlPt.id = 'pt-' + Date.now();
        ctrlPt.setAttribute('cx', px); ctrlPt.setAttribute('cy', py); ctrlPt.setAttribute('r', 4);
        ctrlPt.setAttribute('class', 'shape'); ctrlPt.setAttribute('data-tool', 'point');
        ctrlPt.style.cssText = "fill:#8e44ad; stroke:white; stroke-width:1.5; cursor:move;";
        shapesLayer.appendChild(ctrlPt);

        // --- 自動補圓心 (如果沒有的話) ---
        const existingCenter = document.querySelector(`[data-owner-shape="${targetShape.id}"][data-dependency-type="center-point"]`);
        if (!existingCenter) {
            const centerPt = document.createElementNS(ns, "circle");
            centerPt.setAttribute('cx', cx); centerPt.setAttribute('cy', cy); centerPt.setAttribute('r', 3);
            centerPt.setAttribute('class', 'shape'); centerPt.setAttribute('data-tool', 'point');
            centerPt.setAttribute('data-owner-shape', targetShape.id);
            centerPt.setAttribute('data-dependency-type', 'center-point');
            centerPt.style.cssText = "fill:black; stroke:none; cursor:move;";
            shapesLayer.appendChild(centerPt);
            
            const textO = document.createElementNS(ns, "text");
            textO.setAttribute('x', cx - 16); textO.setAttribute('y', cy + 20);
            textO.textContent = "O";
            textO.setAttribute('class', 'shape'); textO.setAttribute('data-tool', 'text');
            textO.setAttribute('data-owner-shape', targetShape.id);
            textO.setAttribute('data-dependency-type', 'center-label');
            textO.style.cssText = "font-size:20px; font-family:Arial; font-weight:bold; fill:black; cursor:text;";
            shapesLayer.appendChild(textO);
        }

        // --- 建立兩條切線 ---
        const createTangentLine = (index) => {
            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group');
            group.setAttribute('data-tool', 'line');
            group.setAttribute('data-owner-shape', targetShape.id); // 依賴圓
            group.setAttribute('data-tangent-ctrl', ctrlPt.id);     // 依賴P點
            group.setAttribute('data-dependency-type', 'tangent_line_segment');
            group.setAttribute('data-tangent-index', index); 

            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('class', 'hit-line');
            hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('class', 'visible-line');
            visLine.style.cssText = "stroke:#8e44ad; stroke-width:1.5; fill:none; vector-effect:non-scaling-stroke; pointer-events:none;";
            
            group.appendChild(hitLine); group.appendChild(visLine);
            shapesLayer.appendChild(group);
            return group;
        };
        createTangentLine(1);
        createTangentLine(2);

        // --- 建立連心線 (P-O) ---
        const poGroup = document.createElementNS(ns, "g");
        poGroup.setAttribute('class', 'shape group');
        poGroup.setAttribute('data-tool', 'line');
        poGroup.setAttribute('data-owner-shape', targetShape.id);
        poGroup.setAttribute('data-tangent-ctrl', ctrlPt.id);
        poGroup.setAttribute('data-dependency-type', 'tangent_po_line'); // 專屬類型
        
        const poHit = document.createElementNS(ns, "line");
        poHit.setAttribute('class', 'hit-line'); poHit.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        const poVis = document.createElementNS(ns, "line");
        poVis.setAttribute('class', 'visible-line'); // 虛線
        poVis.style.cssText = "stroke:#7f8c8d; stroke-width:1.2; stroke-dasharray:5,3; vector-effect:non-scaling-stroke; pointer-events:none;";
        poGroup.appendChild(poHit); poGroup.appendChild(poVis);
        shapesLayer.appendChild(poGroup);

        // --- 建立半徑 (O-T1, O-T2) ---
        const createRadius = (index) => {
            const rGroup = document.createElementNS(ns, "g");
            rGroup.setAttribute('class', 'shape group');
            rGroup.setAttribute('data-tool', 'line');
            rGroup.setAttribute('data-owner-shape', targetShape.id);
            rGroup.setAttribute('data-tangent-ctrl', ctrlPt.id);
            rGroup.setAttribute('data-dependency-type', 'tangent_radius');
            rGroup.setAttribute('data-tangent-index', index);

            const rHit = document.createElementNS(ns, "line");
            rHit.setAttribute('class', 'hit-line'); rHit.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            const rVis = document.createElementNS(ns, "line");
            rVis.setAttribute('class', 'visible-line'); // 虛線
            rVis.style.cssText = "stroke:#7f8c8d; stroke-width:1.2; stroke-dasharray:5,3; vector-effect:non-scaling-stroke; pointer-events:none;";
            rGroup.appendChild(rHit); rGroup.appendChild(rVis);
            shapesLayer.appendChild(rGroup);
        };
        createRadius(1);
        createRadius(2);

        // --- 建立直角標記 (Right Angle at T1, T2) ---
        const createRightMark = (index) => {
            const path = document.createElementNS(ns, "path");
            path.setAttribute('class', 'shape mark-path');
            path.setAttribute('data-tool', 'mark');
            path.setAttribute('data-owner-shape', targetShape.id);
            path.setAttribute('data-tangent-ctrl', ctrlPt.id);
            path.setAttribute('data-dependency-type', 'tangent_right_angle');
            path.setAttribute('data-tangent-index', index);
            path.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none; cursor:move;";
            shapesLayer.appendChild(path);
        };
        createRightMark(1);
        createRightMark(2);

        // 3. 觸發首次連動計算
        if (typeof updateDependentShapes === 'function') {
            updateDependentShapes(ctrlPt); 
        }

        saveState();
        setMode('select'); 
        deselectAll(); 
        addToSelection(ctrlPt);
        
        statusText.innerText = "已建立切線性質圖 (圓心、連心線、半徑與垂直標記)";
        return;
    }
	
    // =========================================================
    // 3. 三角形三心
    // =========================================================
    if (['circumcenter', 'incenter', 'centroid'].includes(constructionModeType)) {
        if (!isTargetValid) {
            statusText.innerText = "請點擊三角形邊緣";
            return;
        }
        const pts = getTransformedPoints(targetShape);
        if (!pts || pts.length !== 3) {
            statusText.innerText = "這不是三角形，無法作圖";
            return;
        }
        deselectAll();
        addToSelection(targetShape);
        executeConstruction(constructionModeType);
        return;
    }
    
// =========================================================
    // 4. 一般線段處理 (中點、中垂線、等分線、平行線、任意垂線、中線、高)
    // =========================================================
    // ▼▼▼ 修正1：這裡的陣列必須加入 'altitude' ▼▼▼
    else if (['midpoint', 'perpendicular', 'divide_line', 'parallel', 'perpendicular_point', 'median_line', 'altitude', 'base_parallel_line'].includes(constructionModeType)) {
        if (!isTargetValid) {
            statusText.innerText = "請點擊線段或多邊形邊緣";
            return;
        }

        let p1, p2, edgeIdx = -1;
        const pts = getTransformedPoints(targetShape);

        if (tool === 'line') {
            if (pts.length >= 2) { p1 = pts[0]; p2 = pts[1]; edgeIdx = 0; }
        } else if (['polygon', 'polyline', 'angle', 'rect', 'tri'].includes(tool)) {
            if (pts.length >= 2) {
                let minDst = Infinity;
                const loopLimit = (tool === 'polyline' || tool === 'angle') ? pts.length - 1 : pts.length;
                for (let i = 0; i < loopLimit; i++) {
                    const a = pts[i];
                    const b = pts[(i + 1) % pts.length];
                    const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                    if (d < minDst) { minDst = d; edgeIdx = i; }
                }
                if (edgeIdx !== -1) { p1 = pts[edgeIdx]; p2 = pts[(edgeIdx + 1) % pts.length]; }
            }
        }

        if (!p1 || !p2) {
            statusText.innerText = "無法識別線段";
            return;
        }

        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);

        // --- 中點 ---
        if (constructionModeType === 'midpoint') {
            const pt = document.createElementNS(ns, "ellipse");
            pt.setAttribute('cx', mx); pt.setAttribute('cy', my);
            pt.setAttribute('rx', 4); pt.setAttribute('ry', 4);
            pt.setAttribute('class', 'shape'); pt.setAttribute('data-tool', 'point');
            pt.style.cssText = "fill:#e74c3c; stroke:none; cursor:move;";
            
            if (!targetShape.id) targetShape.id = 'shape-' + Date.now();
            pt.setAttribute('data-owner-shape', targetShape.id);
            pt.setAttribute('data-dependency-type', 'midpoint');
            
            shapesLayer.appendChild(pt);
            saveState();
            setMode('select'); deselectAll(); addToSelection(pt);
            statusText.innerText = "已建立中點";
        } 
        
        // --- 中垂線 ---
        else if (constructionModeType === 'perpendicular') {
            if (len === 0) return;
            const ux = -dy / len; const uy = dx / len;
            const size = 100;
            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group');
            group.setAttribute('data-tool', 'line');
            
            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('x1', mx - ux * size); hitLine.setAttribute('y1', my - uy * size);
            hitLine.setAttribute('x2', mx + ux * size); hitLine.setAttribute('y2', my + uy * size);
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('x1', mx - ux * size); visLine.setAttribute('y1', my - uy * size);
            visLine.setAttribute('x2', mx + ux * size); visLine.setAttribute('y2', my + uy * size);
            visLine.setAttribute('class', 'visible-line');
            visLine.style.cssText = `stroke:#2980b9; stroke-width:2; stroke-dasharray:8,5; vector-effect:non-scaling-stroke; pointer-events:none;`;
            
            group.appendChild(hitLine); group.appendChild(visLine);
            
            if (!targetShape.id) targetShape.id = 'shape-' + Date.now();
            group.setAttribute('data-owner-shape', targetShape.id);
            group.setAttribute('data-dependency-type', 'perpendicular');

            shapesLayer.appendChild(group);
            saveState();
            setMode('select'); deselectAll(); addToSelection(group);
            statusText.innerText = "已建立中垂線";
        } 
        
        // --- 線段等分 ---
        else if (constructionModeType === 'divide_line') {
            openNumberInputModal("請輸入等分數 (例如 2, 3...)", "2", (inputVal) => {
                const n = parseInt(inputVal);
                if (isNaN(n) || n < 2) return;
                const ux = dx / len, uy = dy / len;
                const nx = -uy, ny = ux;
                const tickSize = 5;
                const createdMarks =[];
                
                if (!targetShape.id) targetShape.id = 'shape-' + Date.now();

                for (let i = 1; i < n; i++) {
                    const ratio = i / n;
                    const px = p1.x + dx * ratio; const py = p1.y + dy * ratio;
                    const group = document.createElementNS(ns, "g");
                    group.setAttribute('class', 'shape group');
                    group.setAttribute('data-tool', 'line');
                    group.setAttribute('data-owner-shape', targetShape.id);
                    group.setAttribute('data-dependency-type', 'divide_line');
                    group.setAttribute('data-divide-ratio', ratio);
                    
                    const hitLine = document.createElementNS(ns, "line");
                    hitLine.setAttribute('x1', px - nx * tickSize); hitLine.setAttribute('y1', py - ny * tickSize);
                    hitLine.setAttribute('x2', px + nx * tickSize); hitLine.setAttribute('y2', py + ny * tickSize);
                    hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:12; cursor:pointer;";
                    
                    const visLine = document.createElementNS(ns, "line");
                    visLine.setAttribute('x1', px - nx * tickSize); visLine.setAttribute('y1', py - ny * tickSize);
                    visLine.setAttribute('x2', px + nx * tickSize); visLine.setAttribute('y2', py + ny * tickSize);
                    visLine.setAttribute('class', 'visible-line'); visLine.style.cssText = "stroke:#e74c3c; stroke-width:2; pointer-events:none;";
                    
                    group.appendChild(hitLine); group.appendChild(visLine);
                    shapesLayer.appendChild(group);
                    createdMarks.push(group);
                }
                saveState();
                setMode('select'); deselectAll(); createdMarks.forEach(m => addToSelection(m));
                statusText.innerText = `已將線段分為 ${n} 等分`;
            });
        }
        
        // --- 任意垂線 ---
        else if (constructionModeType === 'perpendicular_point') {
            let t = ((clickX - p1.x)*dx + (clickY - p1.y)*dy) / (len*len);
            t = Math.max(-0.2, Math.min(1.2, t)); 
            const hx = p1.x + t*dx; const hy = p1.y + t*dy;

            const nx = -dy / len; const ny = dx / len;
            const vX = clickX - hx; const vY = clickY - hy;
            const dot = vX*nx + vY*ny;
            const side = dot >= 0 ? 1 : -1; 
            const lineLen = 100;
            const ex = hx + nx * side * lineLen; const ey = hy + ny * side * lineLen;

            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group');
            group.setAttribute('data-tool', 'line');
            
            if (!targetShape.id) targetShape.id = 'shape-' + Date.now();
            group.setAttribute('data-owner-shape', targetShape.id);
            group.setAttribute('data-dependency-type', 'arbitrary_perpendicular');
            group.setAttribute('data-edge-index', edgeIdx);
            group.setAttribute('data-t', t);
            group.setAttribute('data-side', side);
            group.setAttribute('data-len', lineLen);

            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('x1', hx); hitLine.setAttribute('y1', hy); hitLine.setAttribute('x2', ex); hitLine.setAttribute('y2', ey);
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('x1', hx); visLine.setAttribute('y1', hy); visLine.setAttribute('x2', ex); visLine.setAttribute('y2', ey);
            visLine.setAttribute('class', 'visible-line'); visLine.style.cssText = `stroke:#2980b9; stroke-width:2; pointer-events:none; vector-effect:non-scaling-stroke;`;
            
            const size = 12;
            const pAx = hx + nx * side * size; const pAy = hy + ny * side * size;
            const pCx = hx + (dx/len) * size * (t>0.5?-1:1); const pCy = hy + (dy/len) * size * (t>0.5?-1:1);
            const pBx = pAx + pCx - hx; const pBy = pAy + pCy - hy;
            const markPath = document.createElementNS(ns, "polyline");
            markPath.setAttribute('points', `${pAx},${pAy} ${pBx},${pBy} ${pCx},${pCy}`);
            markPath.setAttribute('class', 'perp-mark');
            markPath.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none; vector-effect:non-scaling-stroke;";

            group.appendChild(hitLine); group.appendChild(visLine); group.appendChild(markPath);
            shapesLayer.appendChild(group);
            saveState();
            setMode('select'); deselectAll(); addToSelection(group);
            statusText.innerText = "已建立任意垂線";
        }
        
        // --- 平行線 (1 步驟自動平移) ---
        else if (constructionModeType === 'parallel') {
            const nx = -dy/len; const ny = dx/len;
            const nOffset = 50; 
            const pLen = 150;
            
            const cx = mx + nOffset * nx;
            const cy = my + nOffset * ny;
            const ux = dx/len; const uy = dy/len;
            
            const x1 = cx - (pLen/2)*ux; const y1 = cy - (pLen/2)*uy;
            const x2 = cx + (pLen/2)*ux; const y2 = cy + (pLen/2)*uy;

            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group');
            group.setAttribute('data-tool', 'line');
            
            if (!targetShape.id) targetShape.id = 'shape-' + Date.now();
            group.setAttribute('data-owner-shape', targetShape.id);
            group.setAttribute('data-dependency-type', 'parallel_line');
            group.setAttribute('data-edge-index', edgeIdx);
            group.setAttribute('data-t', 0);
            group.setAttribute('data-n', nOffset);
            group.setAttribute('data-len', pLen);
            
            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('x1', x1); hitLine.setAttribute('y1', y1); hitLine.setAttribute('x2', x2); hitLine.setAttribute('y2', y2);
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('x1', x1); visLine.setAttribute('y1', y1); visLine.setAttribute('x2', x2); visLine.setAttribute('y2', y2);
            visLine.setAttribute('class', 'visible-line'); visLine.style.cssText = `stroke:#000000; stroke-width:2; fill:none; vector-effect:non-scaling-stroke; pointer-events:none;`;
            
            group.appendChild(hitLine); group.appendChild(visLine);
            shapesLayer.appendChild(group);
            saveState();
            setMode('select'); deselectAll(); addToSelection(group);
            statusText.innerText = "已建立平行線 (可拖拉控制點改變距離)";
        }
        
        // --- 中線 (1 步驟，限三角形) ---
        else if (constructionModeType === 'median_line') {
            if (pts.length !== 3) {
                statusText.innerText = "中線作圖必須選擇「三角形」的邊！";
                return;
            }
            
            const oppIdx = (edgeIdx + 2) % 3;
            
            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group');
            group.setAttribute('data-tool', 'line');
            if (!targetShape.id) targetShape.id = 'shape-' + Date.now();
            
            group.setAttribute('data-owner-shape', targetShape.id);
            group.setAttribute('data-dependency-type', 'median_line');
            group.setAttribute('data-edge-index', edgeIdx);
            group.setAttribute('data-start-vertex-index', oppIdx); 

            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('class', 'hit-line'); hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('class', 'visible-line'); visLine.style.cssText = `stroke:#000000; stroke-width:2; pointer-events:none;`;
            group.appendChild(hitLine); group.appendChild(visLine);

            const createTick = () => {
                const tg = document.createElementNS(ns, "g");
                const path = document.createElementNS(ns, "path");
                path.setAttribute('d', "M -3 -6 L -3 6 M 3 -6 L 3 6"); path.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none;";
                tg.appendChild(path); return tg;
            };
            group.appendChild(createTick()); group.appendChild(createTick());
            shapesLayer.appendChild(group);
            
            if(typeof updateDependentShapes === 'function') updateDependentShapes(targetShape);
            
            saveState();
            setMode('select'); deselectAll(); addToSelection(group);
            statusText.innerText = "已建立三角形中線";
        }
        
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 修正2：畫高邏輯必須包在這個大括號內 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
		else if (constructionModeType === 'altitude') {
			if (pts.length < 3) {
				statusText.innerText = "畫高必須選擇多邊形的邊！";
				return;
			}
			
			const p1Idx = edgeIdx;
			const p2Idx = (edgeIdx + 1) % pts.length;
			
			// 找出離滑鼠 X 座標最近的「非相鄰頂點」
			let bestVIdx = -1;
			let minXDiff = Infinity;
			for (let i = 0; i < pts.length; i++) {
				if (i === p1Idx || i === p2Idx) continue;
				const xDiff = Math.abs(pts[i].x - clickX);
				if (xDiff < minXDiff) {
					minXDiff = xDiff;
					bestVIdx = i;
				}
			}
			
			if (bestVIdx === -1) return;
			const V = pts[bestVIdx];

			const l2 = dx*dx + dy*dy;
			if (l2 === 0) return;

			const t = ((V.x - p1.x) * dx + (V.y - p1.y) * dy) / l2;
			const H = { x: p1.x + t * dx, y: p1.y + t * dy };

			const group = document.createElementNS(ns, "g");
			group.setAttribute('class', 'shape group');
			group.setAttribute('data-tool', 'line');
			if (!targetShape.id) targetShape.id = 'shape-' + Date.now();
			group.setAttribute('data-owner-shape', targetShape.id);
			group.setAttribute('data-dependency-type', 'altitude');
			group.setAttribute('data-edge-index', edgeIdx);
			group.setAttribute('data-vertex-index', bestVIdx);

			const hitLine = document.createElementNS(ns, "line");
			hitLine.setAttribute('class', 'hit-line'); 
			hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
			
			const visLine = document.createElementNS(ns, "line");
			visLine.setAttribute('class', 'visible-line'); 
			visLine.style.cssText = `stroke:#e74c3c; stroke-width:2; pointer-events:none;`; 
			
			const markPath = document.createElementNS(ns, "polyline");
			markPath.setAttribute('class', 'right-angle-mark');
			markPath.style.cssText = "stroke:#e74c3c; stroke-width:1.5; fill:none; pointer-events:none;";

			group.appendChild(hitLine); 
			group.appendChild(visLine);
			group.appendChild(markPath);
			shapesLayer.appendChild(group);

			if(typeof updateDependentShapes === 'function') updateDependentShapes(targetShape);

			saveState();
			setMode('select'); deselectAll(); addToSelection(group);
			statusText.innerText = "已建立高 (可右鍵進行長度標註)";
		} 
        else if (constructionModeType === 'base_parallel_line') {
            if (pts.length !== 3) {
                statusText.innerText = "必須選擇「三角形」的邊！";
                return;
            }
            
            const oppIdx = (edgeIdx + 2) % 3;
            const V = pts[oppIdx];
            const p1 = pts[edgeIdx];
            const p2 = pts[(edgeIdx + 1) % 3];

            const t = 0.5; // 預設中點
            const m1 = { x: V.x + t * (p1.x - V.x), y: V.y + t * (p1.y - V.y) };
            const m2 = { x: V.x + t * (p2.x - V.x), y: V.y + t * (p2.y - V.y) };

            const group = document.createElementNS(ns, "g");
            group.setAttribute('class', 'shape group');
            group.setAttribute('data-tool', 'line');
            // 給予獨立隨機ID，允許多條
            group.id = 'base-parallel-' + Date.now() + Math.random().toString(36).substr(2, 5);
            if (!targetShape.id) targetShape.id = 'shape-' + Date.now();
            group.setAttribute('data-owner-shape', targetShape.id);
            group.setAttribute('data-dependency-type', 'base_parallel_line');
            group.setAttribute('data-edge-index', edgeIdx);
            group.setAttribute('data-t', t);

            const hitLine = document.createElementNS(ns, "line");
            hitLine.setAttribute('class', 'hit-line');
            hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
            
            const visLine = document.createElementNS(ns, "line");
            visLine.setAttribute('class', 'visible-line');
            visLine.style.cssText = `stroke:#2980b9; stroke-width:2; pointer-events:none;`;
            
            group.appendChild(hitLine);
            group.appendChild(visLine);
            shapesLayer.appendChild(group);

            if(typeof updateDependentShapes === 'function') updateDependentShapes(targetShape);

            saveState();
            setMode('select'); deselectAll(); addToSelection(group);
            statusText.innerText = "已建立底邊平行線";
        }
    }
	
    // =========================================================
    // 5. 角平分線 (1 步驟，點擊頂點直接產生)
    // =========================================================
    else if (constructionModeType === 'divide_angle') {
        if (!isTargetValid) {
            statusText.innerText = "請點擊角或多邊形的頂點";
            return;
        }
        let A, B, C;
        let vertexIdx = 1;
        const pts = getTransformedPoints(targetShape);
        if (tool === 'line' || tool === 'circle' || tool === 'point') {
            statusText.innerText = "請選擇「角」或「多邊形」物件";
            return;
        }
        const idx = findClosestPointIndex(pts, clickX, clickY);
        if (idx === -1) return;
        B = pts[idx];
        if ((tool === 'angle' || tool === 'polyline') && (idx === 0 || idx === pts.length - 1)) {
            if (pts.length === 3) {
                B = pts[1]; A = pts[0]; C = pts[2]; vertexIdx = 1;
            } else {
                statusText.innerText = "請點擊中間的頂點";
                return;
            }
        } else {
            vertexIdx = idx;
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
            const createdObjs =[]; 

            const strokeColor = document.getElementById('stroke-color-select').value || '#000000';
            const lineStyleVal = document.getElementById('line-style-select').value || 'solid';
            let dashArray = "none";
            if (lineStyleVal === 'dashed') dashArray = "8,5";
            else if (lineStyleVal === 'dotted') dashArray = "2,4";
            else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
            
            const markSymbols =["×", "○", "∙", "※", "*"];
            const stepAng = diff / n;
            
            if (!targetShape.id) targetShape.id = 'shape-' + Date.now();

            for (let i = 1; i < n; i++) {
                const targetAng = angBA + diff * (i / n);
                const ex = B.x + len * Math.cos(targetAng);
                const ey = B.y + len * Math.sin(targetAng);
                
                const group = document.createElementNS(ns, "g");
                group.setAttribute('class', 'shape group');
                group.setAttribute('data-tool', 'line');
                group.setAttribute('data-fixed-angle', targetAng);                
                
                group.setAttribute('data-owner-shape', targetShape.id);
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
                createdObjs.push(group);
            }

            // 自動標記夾角符號
            for (let i = 0; i < n; i++) {
                const markAng = angBA + stepAng * (i + 0.5); 
                const markDist = 28; 
                const mx = B.x + markDist * Math.cos(markAng);
                const my = B.y + markDist * Math.sin(markAng);
                
                const txt = document.createElementNS(ns, "text");
                txt.textContent = markSymbols[0]; 
                txt.setAttribute('x', mx);
                txt.setAttribute('y', my);
                
                txt.setAttribute('class', 'shape'); 
                txt.setAttribute('data-tool', 'text');
                txt.setAttribute('data-owner-shape', targetShape.id);
                
                txt.setAttribute('data-dependency-type', 'angle_division_mark');
                txt.setAttribute('data-vertex-index', vertexIdx);
                txt.setAttribute('data-divide-ratio', (i + 0.5) / n); 

                txt.style.cssText = "font-size:16px; fill:#c0392b; text-anchor:middle; dominant-baseline:central; cursor:move;";
                shapesLayer.appendChild(txt);
                createdObjs.push(txt);
            }

            saveState();
            statusText.innerText = `已建立角 ${n} 等分線`;
            setMode('select');
            deselectAll();
            createdObjs.forEach(o => addToSelection(o));
        });
    }
    else if (constructionModeType.startsWith('shared_')) {
        if (!isTargetValid) {
            statusText.innerText = "請點擊多邊形或線段的邊緣";
            return;
        }

        let p1, p2, edgeIdx = -1;
        const pts = getTransformedPoints(targetShape);

        if (tool === 'line') {
            if (pts.length >= 2) { p1 = pts[0]; p2 = pts[1]; edgeIdx = 0; }
        } else if (['polygon', 'polyline', 'angle', 'rect', 'tri', 'rhombus', 'parallelogram', 'trapezoid', 'kite'].includes(tool)) {
            let minDst = Infinity;
            const loopLimit = (tool === 'polyline' || tool === 'angle') ? pts.length - 1 : pts.length;
            for (let i = 0; i < loopLimit; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const d = distToSegment(clickX, clickY, a.x, a.y, b.x, b.y);
                if (d < minDst) { minDst = d; edgeIdx = i; }
            }
            if (edgeIdx !== -1) { p1 = pts[edgeIdx]; p2 = pts[(edgeIdx + 1) % pts.length]; }
        }

        if (!p1 || !p2) {
            statusText.innerText = "無法識別點擊位置的邊緣";
            return;
        }

        // --- 判斷「向外」的法向量方向 ---
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let nx = -dy;
        let ny = dx;
        
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        
        // 針對多邊形，利用重心來保證絕對「向外」
        if (['polygon', 'rect', 'tri', 'rhombus', 'parallelogram', 'trapezoid', 'kite'].includes(tool)) {
            let cx = 0, cy = 0;
            pts.forEach(p => { cx += p.x; cy += p.y; });
            cx /= pts.length; cy /= pts.length;
            
            const vcx = mx - cx;
            const vcy = my - cy;
            if (nx * vcx + ny * vcy < 0) { nx = -nx; ny = -ny; }
        } else {
            // 若為單純線段，利用滑鼠點擊時偏向哪一側來決定向外方向
            const vcx = clickX - mx;
            const vcy = clickY - my;
            if (nx * vcx + ny * vcy < 0) { nx = -nx; ny = -ny; }
        }

        if (!targetShape.id) targetShape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);

        // 讀取當前顏色設定
        const strokeColor = document.getElementById('stroke-color-select').value || "#2980b9";
        const fillColor = document.getElementById('fill-color-select').value || "rgba(41, 128, 185, 0.2)";
        const fillStyle = document.getElementById('fill-style-select').value || "solid";
        let fillValue = fillColor;
        if (fillColor !== 'none' && fillStyle !== 'solid') {
            const dummy = document.createElement('div');
            updateShapeFill(dummy, fillColor, fillStyle);
            fillValue = dummy.style.fill;
        }

        // --- 特例：半圓 ---
        if (constructionModeType === 'shared_semicircle') {
            const archGroup = document.createElementNS(ns, "g");
            archGroup.setAttribute('class', 'shape group');
            archGroup.setAttribute('data-tool', 'ellipse');
            archGroup.setAttribute('data-sub-tool', 'arch');
            archGroup.setAttribute('data-owner-shape', targetShape.id);
            archGroup.setAttribute('data-dependency-type', 'shared_edge_arch');
            archGroup.setAttribute('data-edge-index', edgeIdx);
            
            const standardNx = -dy; const standardNy = dx;
            const side = (nx * standardNx + ny * standardNy >= 0) ? 1 : -1;
            archGroup.setAttribute('data-side', side);

            const archPath = document.createElementNS(ns, "path");
            archPath.setAttribute("class", "visible-line");
            archPath.style.cssText = `stroke:${strokeColor}; stroke-width:2; fill:${fillValue}; vector-effect:non-scaling-stroke;`;
            
            archGroup.appendChild(archPath);
            archGroup.id = 'arch-' + Date.now() + Math.random().toString(36).substr(2, 5);
            shapesLayer.appendChild(archGroup);

            updateDependentShapes(targetShape); 
            saveState();
            setMode('select'); deselectAll(); addToSelection(archGroup);
            statusText.innerText = "已產生共邊半圓";
            return;
        }

        // --- 多邊形系列 ---
        let n = 3;
        if (constructionModeType === 'shared_square') n = 4;
        else if (constructionModeType === 'shared_pentagon') n = 5;
        else if (constructionModeType === 'shared_hexagon') n = 6;

        // 計算相對座標系參數：底邊對應 [ (0,0), (1,0) ]
        let relPts = [{x: 0, y: 0}, {x: 1, y: 0}]; 
        
        if (n === 3) {
            relPts.push({x: 0.5, y: Math.sqrt(3)/2}); // 正三角形
        } else if (n === 4) {
            relPts.push({x: 1, y: 1}, {x: 0, y: 1});  // 正方形
        } else {
            // 利用轉向角推算正多邊形其餘頂點
            for (let i = 2; i < n; i++) {
                const prevX = relPts[i-1].x; const prevY = relPts[i-1].y;
                const prevPrevX = relPts[i-2].x; const prevPrevY = relPts[i-2].y;
                const edgeX = prevX - prevPrevX; const edgeY = prevY - prevPrevY;
                const extAng = 2 * Math.PI / n;
                const nextEdgeX = edgeX * Math.cos(extAng) - edgeY * Math.sin(extAng);
                const nextEdgeY = edgeX * Math.sin(extAng) + edgeY * Math.cos(extAng);
                relPts.push({x: prevX + nextEdgeX, y: prevY + nextEdgeY});
            }
        }

        const poly = document.createElementNS(ns, "polygon");
        poly.setAttribute('class', 'shape');
        poly.setAttribute('data-tool', 'polygon');
        poly.setAttribute('data-sub-tool', `shared_${n}gon`);
        poly.setAttribute('data-owner-shape', targetShape.id);
        poly.setAttribute('data-dependency-type', 'shared_edge_shape');
        poly.setAttribute('data-edge-index', edgeIdx);
        
        const standardNx = -dy; const standardNy = dx;
        const side = (nx * standardNx + ny * standardNy >= 0) ? 1 : -1;
        poly.setAttribute('data-side', side);
        poly.setAttribute('data-rel-pts', JSON.stringify(relPts));

        poly.style.cssText = `stroke:${strokeColor}; stroke-width:2; fill:${fillValue}; vector-effect:non-scaling-stroke; cursor:move;`;
        
        poly.id = 'poly-' + Date.now() + Math.random().toString(36).substr(2, 5);
        shapesLayer.appendChild(poly);

        updateDependentShapes(targetShape);

        saveState();
        setMode('select'); deselectAll(); addToSelection(poly);
        statusText.innerText = `已產生共邊圖形 (可單獨點選控制點進行變形)`;
        return;
    }	

}

// 3. 🆕 新增：建立可互動的圓形角度群組的核心函式
function createCircleAngleGroup(type, ownerCircle, points) {
    const group = document.createElementNS(ns, "g");
    group.setAttribute("class", "shape group");
    group.setAttribute("data-tool", "group");
    group.setAttribute("data-sub-tool", type); // 'central-angle', etc.
    if (!ownerCircle.id) ownerCircle.id = 'circle-' + Date.now();
    group.setAttribute("data-owner-circle-id", ownerCircle.id);
    
    // 將幾何點的座標儲存在內部看不見的 <circle> 元素中，作為數據節點
    points.forEach((p, i) => {
        const dataNode = createSVGElement('circle', {
            'class': 'vertex-data',
            'cx': p.x,
            'cy': p.y,
            'data-index': i // 紀錄索引
        });
        dataNode.style.display = 'none'; // 隱藏
        group.appendChild(dataNode);
    });
    
    // 根據這些數據點，繪製實際可見的圖形
    redrawCircleAngle(group);
    
    return group;
}

// 4. 🆕 新增：重繪圓形角度物件的函式
function redrawCircleAngle(group) {
    const type = group.getAttribute('data-sub-tool');
    const ownerCircle = document.getElementById(group.getAttribute('data-owner-circle-id'));
    if (!ownerCircle) return;

    if (!group.id) group.id = 'group-' + Date.now() + Math.random().toString(36).substr(2, 5);

    Array.from(group.querySelectorAll('.visible-line')).forEach(el => el.remove());
    const oldArc = document.querySelector(`.angle-arc[data-owner="${group.id}"]`);
    if (oldArc) oldArc.remove();

    const dataNodes = Array.from(group.querySelectorAll('.vertex-data'));
    const strokeStyle = `stroke:#1abc9c; stroke-width:2; vector-effect:non-scaling-stroke;`;
    
    let L_center, L_pStart, L_pEnd;

    // 依據類型讀取數據點
    if (type === 'central-angle') {
        L_center = { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') };
        L_pStart = { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') };
        L_pEnd   = { x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy') };
        
        group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pStart.x, y2: L_pStart.y, style: strokeStyle }));
        group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pEnd.x, y2: L_pEnd.y, style: strokeStyle }));
    } 
    else if (type === 'inscribed-angle') {
        L_pStart = { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') };
        L_center = { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') }; // 這裡是頂點
        L_pEnd   = { x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy') };
        
        group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pStart.x, y2: L_pStart.y, style: strokeStyle }));
        group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pEnd.x, y2: L_pEnd.y, style: strokeStyle }));
    }
    else if (type === 'tangent-chord-angle') {
        // 數據結構：[0:A(弦), 1:P(切點), 2:T1, 3:T2]
        const A = { x: +dataNodes[0].getAttribute('cx'), y: +dataNodes[0].getAttribute('cy') };
        const P = { x: +dataNodes[1].getAttribute('cx'), y: +dataNodes[1].getAttribute('cy') };
        
        // 確保有 4 個點 (相容舊版)
        let T1, T2;
        if (dataNodes.length >= 4) {
            T1 = { x: +dataNodes[2].getAttribute('cx'), y: +dataNodes[2].getAttribute('cy') };
            T2 = { x: +dataNodes[3].getAttribute('cx'), y: +dataNodes[3].getAttribute('cy') };
        } else {
            // 舊版備援：暫時重疊
            T1 = P; T2 = P; 
        }

        // 畫弦 A-P
        group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: A.x, y1: A.y, x2: P.x, y2: P.y, style: strokeStyle }));
        
        // 畫切線 T1-T2 (直接連線，不再重新計算向量)
        group.appendChild(createSVGElement('line', { 'class': 'visible-line tangent-line', x1: T1.x, y1: T1.y, x2: T2.x, y2: T2.y, style: strokeStyle }));
        
        // 為了讓角標計算正確，這裡不畫角標弧線，因為角標是另外生成的物件
        // 但我們需要指定 L_center 等變數給下方通用邏輯(若有)使用，或是直接 return
        return; 
    } else {
        group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pStart.x, y2: L_pStart.y, style: strokeStyle }));
        group.appendChild(createSVGElement('line', { 'class': 'visible-line', x1: L_center.x, y1: L_center.y, x2: L_pEnd.x, y2: L_pEnd.y, style: strokeStyle }));
    }
	
    // 5. 轉換為「全域座標」以建立獨立角標
    const m = group.getCTM();
    const getGlobal = (p) => ({
        x: p.x * m.a + p.y * m.c + m.e,
        y: p.x * m.b + p.y * m.d + m.f
    });

    const G_C = getGlobal(L_center);
    const G_S = getGlobal(L_pStart);
    const G_E = getGlobal(L_pEnd);

    // 6. 計算角度並建立弧線 (修正原本的 atan2 錯誤)
    const r = 30; // 角標半徑
    const angStart = Math.atan2(G_S.y - G_C.y, G_S.x - G_C.x);
    const angEnd   = Math.atan2(G_E.y - G_C.y, G_E.x - G_C.x);
    
    let diff = angEnd - angStart;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
    const sweep = diff > 0 ? 1 : 0;
    
    const x1 = G_C.x + r * Math.cos(angStart);
    const y1 = G_C.y + r * Math.sin(angStart);
    const x2 = G_C.x + r * Math.cos(angEnd);
    const y2 = G_C.y + r * Math.sin(angEnd);

    // 關鍵修正：只畫弧線 M...A... 不連回中心，不使用 Z，解決填滿問題
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;

}

/**
 * 核心：更新三角形相關作圖 (外心/內心/重心)
 * @param {SVGElement} group - 作圖的容器群組
 * @param {Array} pts - 三角形三個頂點 [{x,y}, {x,y}, {x,y}]
 */
/* --- construction.js --- */

function updateTriangleConstruction(group, pts) {
    if (!pts || pts.length !== 3) return;
    
    group.removeAttribute('transform');

    const type = group.getAttribute('data-construction-type');
    const centers = getTriangleCenters(pts[0], pts[1], pts[2]);
    const data = (type === 'circumcenter') ? centers.circum : 
                 (type === 'incenter') ? centers.in : centers.centroid;
    
    group.innerHTML = ''; 

    // --- 顏色與參數定義 ---
    const colorAuxLine = '#7f8c8d'; // 灰色
    const colorMark = '#e74c3c';    // 紅色
    const colorCircum = '#2980b9';  // 藍色
    const colorIn = '#27ae60';      // 綠色
    const colorDot = '#2c3e50';     // 深色

    const createSelectableLine = (x1, y1, x2, y2, isDash = true) => {
        const hitLine = document.createElementNS(ns, "line");
        hitLine.setAttribute('x1', x1); hitLine.setAttribute('y1', y1);
        hitLine.setAttribute('x2', x2); hitLine.setAttribute('y2', y2);
        hitLine.setAttribute('class', 'hit-line');
        hitLine.style.cssText = "stroke:transparent; stroke-width:12; cursor:move;";
        group.appendChild(hitLine);

        const visLine = document.createElementNS(ns, "line");
        visLine.setAttribute('x1', x1); visLine.setAttribute('y1', y1);
        visLine.setAttribute('x2', x2); visLine.setAttribute('y2', y2);
        visLine.style.cssText = `stroke:${colorAuxLine}; stroke-width:1.2; ${isDash ? 'stroke-dasharray:4,4;' : ''} vector-effect:non-scaling-stroke; pointer-events:none;`;
        group.appendChild(visLine);
    };
	let pointRadius = 3;
    try {
        const cachedP = localStorage.getItem('math_editor_param_point');
        if (cachedP) pointRadius = JSON.parse(cachedP).p_r || 3;
    } catch(e) {}


    const centerPoint = document.createElementNS(ns, "circle");
    centerPoint.setAttribute('cx', data.x); centerPoint.setAttribute('cy', data.y);
    centerPoint.setAttribute('r', pointRadius);
    centerPoint.style.cssText = `fill:${colorDot}; stroke:transparent; stroke-width:10; cursor:move;`;
    group.appendChild(centerPoint);

    if (type === 'circumcenter') {
        // --- 外心：外接圓 (虛線) + 中垂線 + 直角標 ---
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute('cx', data.x); circle.setAttribute('cy', data.y); circle.setAttribute('r', data.r);
        circle.style.cssText = `fill:none; stroke:${colorCircum}; stroke-width:1.5; stroke-dasharray:4,4; pointer-events:visibleStroke; cursor:move;`;
        group.appendChild(circle);

        const edges = [[pts[0], pts[1]], [pts[1], pts[2]], [pts[2], pts[0]]];
        edges.forEach(e => {
            const mx = (e[0].x + e[1].x) / 2;
            const my = (e[0].y + e[1].y) / 2;

            // 【關鍵修正】檢查邊的中點是否與外心重疊 (處理直角三角形斜邊)
            const distToCenter = Math.hypot(data.x - mx, data.y - my);
            if (distToCenter < 1.0) {
                return; // 若重疊 (距離小於 1px)，代表是斜邊，不畫輔助線與直角標
            }

            createSelectableLine(mx, my, data.x, data.y);

            // 繪製直角標 (紅色)
            const size = 10;
            const dx = e[1].x - e[0].x; const dy = e[1].y - e[0].y;
            const len = Math.hypot(dx, dy);
            const ux = dx / len; const uy = dy / len;
            const nx = -uy; const ny = ux;
            
            const vcx = data.x - mx; const vcy = data.y - my;
            const dot = vcx * nx + vcy * ny;
            const side = dot > 0 ? 1 : -1;

            const p1 = { x: mx + ux * size, y: my + uy * size };
            const p2 = { x: mx + ux * size + nx * size * side, y: my + uy * size + ny * size * side };
            const p3 = { x: mx + nx * size * side, y: my + ny * size * side };
            const ra = document.createElementNS(ns, "polyline");
            ra.setAttribute("points", `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
            ra.style.cssText = `fill:none; stroke:${colorMark}; stroke-width:1.5; pointer-events:none;`;
            group.appendChild(ra);
        });

    } else if (type === 'incenter') {
        // --- 內心：內切圓 (預設虛線) + 角平分線 + 等角標 ---
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute('cx', data.x); circle.setAttribute('cy', data.y); circle.setAttribute('r', data.r);
        // 【修正】內切圓改為虛線 (stroke-dasharray: 4,4)
        circle.style.cssText = `fill:none; stroke:${colorIn}; stroke-width:1.5; stroke-dasharray:4,4; pointer-events:visibleStroke; cursor:move;`;
        group.appendChild(circle);

        const symbols = ['circle', 'cross', 'equal'];
        pts.forEach((v, i) => {
            createSelectableLine(v.x, v.y, data.x, data.y);

            const pPrev = pts[(i + 2) % 3];
            const pNext = pts[(i + 1) % 3];
            const a1 = Math.atan2(pPrev.y - v.y, pPrev.x - v.x);
            const a2 = Math.atan2(pNext.y - v.y, pNext.x - v.x);
            const angBisect = Math.atan2(data.y - v.y, data.x - v.x);

            let totalAngle = a2 - a1;
            while (totalAngle <= -Math.PI) totalAngle += 2 * Math.PI;
            while (totalAngle > Math.PI) totalAngle -= 2 * Math.PI;
            totalAngle = Math.abs(totalAngle);

            const dist = 32;               
            const offset = totalAngle / 4; 

            const markAngles = [angBisect - offset, angBisect + offset];
            const sym = symbols[i];

            markAngles.forEach(ma => {
                const mx = v.x + Math.cos(ma) * dist;
                const my = v.y + Math.sin(ma) * dist;

                if (sym === 'circle') {
                    const c = document.createElementNS(ns, "circle");
                    c.setAttribute("cx", mx); c.setAttribute("cy", my); c.setAttribute("r", 3);
                    c.style.cssText = `fill:none; stroke:${colorMark}; stroke-width:1.2;`;
                    group.appendChild(c);
                } else if (sym === 'cross') {
                    const p = document.createElementNS(ns, "path");
                    const s = 3;
                    p.setAttribute("d", `M ${mx-s} ${my-s} L ${mx+s} ${my+s} M ${mx+s} ${my-s} L ${mx-s} ${my+s}`);
                    p.style.cssText = `stroke:${colorMark}; stroke-width:1.5;`;
                    group.appendChild(p);
                } else if (sym === 'equal') {
                    const lineLen = 3.5;  
                    const lineGap = 2; 
                    const tnx = -Math.sin(ma); const tny = Math.cos(ma);
                    const dx = Math.cos(ma) * lineGap; const dy = Math.sin(ma) * lineGap;

                    for (let n = -1; n <= 1; n += 2) {
                        const shiftX = (n * dx) / 2; const shiftY = (n * dy) / 2;
                        const l = document.createElementNS(ns, "line");
                        l.setAttribute("x1", mx + shiftX - tnx * lineLen);
                        l.setAttribute("y1", my + shiftY - tny * lineLen);
                        l.setAttribute("x2", mx + shiftX + tnx * lineLen);
                        l.setAttribute("y2", my + shiftY + tny * lineLen);
                        l.style.cssText = `stroke:${colorMark}; stroke-width:1.5; stroke-linecap:round;`;
                        group.appendChild(l);
                    }
                }
            });
        });

    } else if (type === 'centroid') {
        // 重心邏輯保持不變 ... (略)
        pts.forEach((v, i) => {
            const p1 = pts[(i + 1) % 3]; const p2 = pts[(i + 2) % 3];
            const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
            createSelectableLine(v.x, v.y, mx, my);

            const count = i + 1; 
            const dx = p2.x - p1.x; const dy = p2.y - p1.y;
            const ang = Math.atan2(dy, dx);
            const nx = -Math.sin(ang); const ny = Math.cos(ang); 
            const tickLen = 6, tickGap = 3.5;

            const positions = [{ x: (p1.x + mx) / 2, y: (p1.y + my) / 2 }, { x: (p2.x + mx) / 2, y: (p2.y + my) / 2 }];

            positions.forEach(pos => {
                for (let n = 0; n < count; n++) {
                    const shift = (n - (count - 1) / 2) * tickGap;
                    const tx = pos.x + Math.cos(ang) * shift;
                    const ty = pos.y + Math.sin(ang) * shift;
                    const tick = document.createElementNS(ns, "line");
                    tick.setAttribute("x1", tx - nx * tickLen);
                    tick.setAttribute("y1", ty - ny * tickLen);
                    tick.setAttribute("x2", tx + nx * tickLen);
                    tick.setAttribute("y2", ty + ny * tickLen);
                    tick.style.cssText = `stroke:${colorMark}; stroke-width:1.8; pointer-events:none;`;
                    group.appendChild(tick);
                }
            });
        });
    }
}
window.getCircleInfo = function(shape) {
    if (!shape) return null;
    const m = shape.getCTM();
    if (!m) return null; 
    let cx, cy, r;
    if (shape.getAttribute('data-sub-tool') === 'circle-smart') {
        const body = shape.querySelector('.circle-body');
        cx = (parseFloat(body.getAttribute('cx')) || 0) * m.a + m.e;
        cy = (parseFloat(body.getAttribute('cy')) || 0) * m.d + m.f;
        r = (parseFloat(shape.getAttribute('data-radius')) || 0) * m.a;
    } else {
        cx = (parseFloat(shape.getAttribute('cx')) || 0) * m.a + m.e;
        cy = (parseFloat(shape.getAttribute('cy')) || 0) * m.d + m.f;
        r = (parseFloat(shape.getAttribute('rx') || shape.getAttribute('r')) || 0) * m.a;
    }
    return { x: cx, y: cy, r: r };
};

// 建立公切線系統 (切線、半徑、連心線、直角標)
window.createCommonTangentSystem = function(c1_el, c2_el, type) {
    if (!c1_el.id) c1_el.id = 'circle-' + Date.now() + 'A';
    if (!c2_el.id) c2_el.id = 'circle-' + Date.now() + 'B';

    const sysId = 'tsys-' + Date.now(); // 產生此系統的唯一 ID
    const ns = "http://www.w3.org/2000/svg";
    const layer = document.getElementById('shapes-layer');

    // --- 【新增：自動標註圓心 O1, O2 邏輯】 ---
    const ensureCenterLabel = (circleEl, labelText) => {
        const info = window.getCircleInfo(circleEl);
        if (!info) return;

        // 1. 建立或更新圓心點 (Dot)
        let centerPt = document.querySelector(`[data-owner-shape="${circleEl.id}"][data-dependency-type="center-point"]`);
        if (!centerPt) {
            centerPt = document.createElementNS(ns, "circle");
            centerPt.setAttribute('cx', info.x); centerPt.setAttribute('cy', info.y); centerPt.setAttribute('r', 3);
            centerPt.setAttribute('class', 'shape'); centerPt.setAttribute('data-tool', 'point');
            centerPt.setAttribute('data-owner-shape', circleEl.id); 
            centerPt.setAttribute('data-dependency-type', 'center-point');
            centerPt.style.cssText = "fill:black; stroke:none; cursor:move;";
            layer.appendChild(centerPt);
        }

        // 2. 建立或更新文字標籤 (O1, O2)
        let centerLabel = document.querySelector(`[data-owner-shape="${circleEl.id}"][data-dependency-type="center-label"]`);
        if (!centerLabel) {
            centerLabel = document.createElementNS(ns, "text");
            centerLabel.setAttribute('x', info.x - 16); centerLabel.setAttribute('y', info.y + 20);
            centerLabel.textContent = labelText;
            centerLabel.setAttribute('class', 'shape'); centerLabel.setAttribute('data-tool', 'text');
            centerLabel.setAttribute('data-owner-shape', circleEl.id); 
            centerLabel.setAttribute('data-dependency-type', 'center-label');
            centerLabel.style.cssText = "font-size:20px; font-family:'Times New Roman', serif; font-weight:bold; fill:black; cursor:text;";
            layer.appendChild(centerLabel);
        } else {
            // 如果原本標註是 "O"，自動更正為 O1 或 O2
            centerLabel.textContent = labelText;
        }
    };

    // 執行圓心標註
    ensureCenterLabel(c1_el, "O1");
    ensureCenterLabel(c2_el, "O2");
	
    // 內部輔助：建立線段群組
    const createGroupLine = (role, index, circleNum, isAux) => {
        const g = document.createElementNS(ns, "g");
        g.setAttribute('class', 'shape group common-tangent-obj');
        g.setAttribute('data-tool', 'line');
        g.setAttribute('data-dependency-type', 'common_tangent');
        g.setAttribute('data-system-id', sysId);
        g.setAttribute('data-c1-id', c1_el.id);
        g.setAttribute('data-c2-id', c2_el.id);
        g.setAttribute('data-tangent-type', type);
        g.setAttribute('data-role', role);
        if (index !== null) g.setAttribute('data-index', index);
        if (circleNum !== null) g.setAttribute('data-circle', circleNum);
        if (isAux) g.setAttribute('data-aux', 'true');

        const hitLine = document.createElementNS(ns, "line");
        hitLine.setAttribute('class', 'hit-line');
        hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        
        const visLine = document.createElementNS(ns, "line");
        visLine.setAttribute('class', 'visible-line');
        
        if (role === 'tangent') {
            visLine.style.cssText = "stroke:#8e44ad; stroke-width:2; vector-effect:non-scaling-stroke; pointer-events:none;";
        } else { // radius 或 center-line
            visLine.style.cssText = "stroke:#7f8c8d; stroke-width:1.2; stroke-dasharray:5,3; vector-effect:non-scaling-stroke; pointer-events:none;";
        }

        g.appendChild(hitLine);
        g.appendChild(visLine);
        document.getElementById('shapes-layer').appendChild(g);
    };

    // 內部輔助：建立直角標記
    const createMark = (index, circleNum) => {
        const path = document.createElementNS(ns, "path");
        path.setAttribute('class', 'shape mark-path common-tangent-obj');
        path.setAttribute('data-tool', 'mark');
        path.setAttribute('data-dependency-type', 'common_tangent');
        path.setAttribute('data-system-id', sysId);
        path.setAttribute('data-c1-id', c1_el.id);
        path.setAttribute('data-c2-id', c2_el.id);
        path.setAttribute('data-tangent-type', type);
        path.setAttribute('data-role', 'mark');
        path.setAttribute('data-index', index);
        path.setAttribute('data-circle', circleNum);
        path.setAttribute('data-aux', 'true');
        path.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none; cursor:pointer;";
        document.getElementById('shapes-layer').appendChild(path);
    };

    // 產生全部需要的 SVG 容器 (最多2條切線，所以 index=0,1)
    for (let i = 0; i < 2; i++) {
        createGroupLine('tangent', i, null, false);
        createGroupLine('radius', i, '1', true);
        createGroupLine('radius', i, '2', true);
        createMark(i, '1');
        createMark(i, '2');
    }
    createGroupLine('center-line', null, null, true);

    // 觸發首次座標計算與重繪
    window.redrawCommonTangentSystem(sysId);

    if (typeof saveState === 'function') saveState();
    if (typeof deselectAll === 'function') deselectAll();
    
    const status = document.getElementById('status-text');
    if (status) status.innerText = `已建立${type==='external'?'外':'內'}公切線系統 (選取後按【空白鍵】可開關輔助線)`;
};

// 重新計算與更新公切線系統座標
window.redrawCommonTangentSystem = function(sysId) {
    const elements = document.querySelectorAll(`[data-system-id="${sysId}"]`);
    if (elements.length === 0) return;

    const first = elements[0];
    const c1_id = first.getAttribute('data-c1-id');
    const c2_id = first.getAttribute('data-c2-id');
    const type = first.getAttribute('data-tangent-type');

    const c1_el = document.getElementById(c1_id);
    const c2_el = document.getElementById(c2_id);
    if (!c1_el || !c2_el) return;

    const c1 = window.getCircleInfo(c1_el);
    const c2 = window.getCircleInfo(c2_el);
    if (!c1 || !c2) return;

    // 計算切線
    const tangs = window.getCommonTangents(c1, c2)[type];
    
    // 輔助更新線段函式
    const updateLine = (g, x1, y1, x2, y2) => {
        g.querySelectorAll('line').forEach(l => {
            l.setAttribute('x1', x1); l.setAttribute('y1', y1);
            l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        });
        g.removeAttribute('transform');
    };

    elements.forEach(el => {
        const role = el.getAttribute('data-role');
        const idx = parseInt(el.getAttribute('data-index') || 0);
        const circleNum = el.getAttribute('data-circle'); 
        
        // 若因為圓靠近導致切線消失，將透明度設為 0 (不改 display，以免干擾空白鍵切換)
        if (!tangs[idx] && role !== 'center-line') {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
        } else {
            el.style.opacity = '1';
            el.style.pointerEvents = 'all';
        }
        
        if (role === 'center-line') {
            updateLine(el, c1.x, c1.y, c2.x, c2.y);
        } else {
            const t = tangs[idx];
            const p1 = t.p1, p2 = t.p2;
            
            if (role === 'tangent') {
                // 將切線向外延伸一點，視覺效果更好
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const len = Math.hypot(dx, dy);
                if (len > 0) {
                    const ux = dx/len, uy = dy/len;
                    const ext = 60; // 延伸 60px
                    updateLine(el, p1.x - ux*ext, p1.y - uy*ext, p2.x + ux*ext, p2.y + uy*ext);
                }
            } else if (role === 'radius') {
                if (circleNum === '1') updateLine(el, c1.x, c1.y, p1.x, p1.y);
                if (circleNum === '2') updateLine(el, c2.x, c2.y, p2.x, p2.y);
            } else if (role === 'mark') {
                // 計算直角標
                const isC1 = circleNum === '1';
                const P = isC1 ? p1 : p2;
                const C = isC1 ? c1 : c2;
                const P_other = isC1 ? p2 : p1;
                
                const vC = { x: C.x - P.x, y: C.y - P.y };
                const vC_len = Math.hypot(vC.x, vC.y);
                const vT = { x: P_other.x - P.x, y: P_other.y - P.y };
                const vT_len = Math.hypot(vT.x, vT.y);
                
                if (vC_len > 0 && vT_len > 0) {
                    const uC = { x: vC.x/vC_len, y: vC.y/vC_len };
                    const uT = { x: vT.x/vT_len, y: vT.y/vT_len };
                    const size = 10;
                    
                    const m1 = { x: P.x + uC.x * size, y: P.y + uC.y * size };
                    const m2 = { x: P.x + uT.x * size, y: P.y + uT.y * size };
                    const m3 = { x: m1.x + m2.x - P.x, y: m1.y + m2.y - P.y };
                    
                    el.setAttribute('d', `M ${m1.x} ${m1.y} L ${m3.x} ${m3.y} L ${m2.x} ${m2.y}`);
                    el.removeAttribute('transform');
                }
            }
        }
    });
};

window.syncTriangleCenters = function(triangleShape) {
    if (!triangleShape || !triangleShape.id) return;
    const pts = getTransformedPoints(triangleShape);
    if (pts.length !== 3) return;
    const centers = getTriangleCenters(pts[0], pts[1], pts[2]);
    const tid = triangleShape.id;

    const updatePt = (type, data) => {
        const pt = document.querySelector(`[data-owner-shape="${tid}"][data-dependency-type="${type}_point"]`);
        if (pt) { pt.setAttribute('cx', data.x); pt.setAttribute('cy', data.y); pt.removeAttribute('transform'); }
    };
    const updateCirc = (type, data) => {
        const circ = document.querySelector(`[data-owner-shape="${tid}"][data-dependency-type="${type}"]`);
        if (circ) { circ.setAttribute('cx', data.x); circ.setAttribute('cy', data.y); circ.setAttribute('rx', data.r); circ.setAttribute('ry', data.r); circ.removeAttribute('transform'); }
    };

    updatePt('circumcenter', centers.circum);
    updateCirc('circumcircle', centers.circum);
    updatePt('incenter', centers.in);
    updateCirc('incircle', centers.in);
    updatePt('centroid', centers.centroid);

    // 外心輔助線與直角標記
    document.querySelectorAll(`[data-owner-shape="${tid}"][data-dependency-type="circumcenter_line"]`).forEach(g => {
        const idx = parseInt(g.getAttribute('data-edge-index'));
        if (!isNaN(idx)) {
            const p1 = pts[idx], p2 = pts[(idx+1)%3];
            const mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2;
            const distToCenter = Math.hypot(centers.circum.x - mx, centers.circum.y - my);
            if (distToCenter < 1.0) { g.style.display = 'none'; } 
            else {
                g.style.display = '';
                g.querySelectorAll('line').forEach(l => {
                    l.setAttribute('x1', mx); l.setAttribute('y1', my);
                    l.setAttribute('x2', centers.circum.x); l.setAttribute('y2', centers.circum.y);
                });
                g.removeAttribute('transform');
                
                // 【修復 Bug】：通知外心輔助線上的交點角標重繪
                if (typeof refreshIntersectionAngles === 'function') refreshIntersectionAngles(g);
            }
        }
    });

    document.querySelectorAll(`[data-owner-shape="${tid}"][data-dependency-type="circumcenter_mark"]`).forEach(m => {
        // ... (這段保持原樣不動) ...
        const idx = parseInt(m.getAttribute('data-edge-index'));
        if (!isNaN(idx)) {
            const p1 = pts[idx], p2 = pts[(idx+1)%3];
            const mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2;
            const distToCenter = Math.hypot(centers.circum.x - mx, centers.circum.y - my);
            if (distToCenter < 1.0) { m.setAttribute('points', ''); return; }

            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            const ux = dx/len, uy = dy/len;
            const nx = -uy, ny = ux;
            
            const vcx = centers.circum.x - mx, vcy = centers.circum.y - my;
            const dot = vcx * nx + vcy * ny;
            const side = dot > 0 ? 1 : -1;
            
            const size = 10;
            const m1 = {x: mx + ux*size, y: my + uy*size};
            const m2 = {x: mx + ux*size + nx*size*side, y: my + uy*size + ny*size*side};
            const m3 = {x: mx + nx*size*side, y: my + ny*size*side};
            m.setAttribute('points', `${m1.x},${m1.y} ${m2.x},${m2.y} ${m3.x},${m3.y}`);
            m.removeAttribute('transform');
        }
    });

    // 內心輔助線與等角標記
    document.querySelectorAll(`[data-owner-shape="${tid}"][data-dependency-type="incenter_line"]`).forEach(g => {
        const idx = parseInt(g.getAttribute('data-vertex-index'));
        if (!isNaN(idx)) {
            const v = pts[idx];
            g.querySelectorAll('line').forEach(l => {
                l.setAttribute('x1', v.x); l.setAttribute('y1', v.y);
                l.setAttribute('x2', centers.in.x); l.setAttribute('y2', centers.in.y);
            });
            g.removeAttribute('transform');
            
            // 【修復 Bug】：通知內心輔助線上的交點角標重繪
            if (typeof refreshIntersectionAngles === 'function') refreshIntersectionAngles(g);
        }
    });

    const incenterSymbols = ['circle', 'cross', 'equal'];
    document.querySelectorAll(`[data-owner-shape="${tid}"][data-dependency-type="incenter_mark"]`).forEach(m => {
        // ... (這段保持原樣不動) ...
        const idx = parseInt(m.getAttribute('data-vertex-index'));
        if (!isNaN(idx)) {
            const v = pts[idx];
            const pPrev = pts[(idx + 2) % 3];
            const pNext = pts[(idx + 1) % 3];
            const a1 = Math.atan2(pPrev.y - v.y, pPrev.x - v.x);
            const a2 = Math.atan2(pNext.y - v.y, pNext.x - v.x);
            const angBisect = Math.atan2(centers.in.y - v.y, centers.in.x - v.x);

            let totalAngle = a2 - a1;
            while (totalAngle <= -Math.PI) totalAngle += 2 * Math.PI;
            while (totalAngle > Math.PI) totalAngle -= 2 * Math.PI;
            totalAngle = Math.abs(totalAngle);

            const dist = 32;               
            const offset = totalAngle / 4; 
            const markAngles = [angBisect - offset, angBisect + offset];
            const sym = incenterSymbols[idx];

            let dPath = "";
            markAngles.forEach(ma => {
                const mx = v.x + Math.cos(ma) * dist;
                const my = v.y + Math.sin(ma) * dist;
                const s = 3;

                if (sym === 'circle') dPath += `M ${mx-s} ${my} A ${s} ${s} 0 1 1 ${mx+s} ${my} A ${s} ${s} 0 1 1 ${mx-s} ${my} `;
                else if (sym === 'cross') dPath += `M ${mx-s} ${my-s} L ${mx+s} ${my+s} M ${mx+s} ${my-s} L ${mx-s} ${my+s} `;
                else if (sym === 'equal') {
                    const lineLen = 3.5, lineGap = 2; 
                    const tnx = -Math.sin(ma), tny = Math.cos(ma);
                    const dx = Math.cos(ma) * lineGap, dy = Math.sin(ma) * lineGap;
                    dPath += `M ${mx - dx/2 - tnx*lineLen} ${my - dy/2 - tny*lineLen} L ${mx - dx/2 + tnx*lineLen} ${my - dy/2 + tny*lineLen} `;
                    dPath += `M ${mx + dx/2 - tnx*lineLen} ${my + dy/2 - tny*lineLen} L ${mx + dx/2 + tnx*lineLen} ${my + dy/2 + tny*lineLen} `;
                }
            });
            m.setAttribute('d', dPath);
            m.removeAttribute('transform');
        }
    });

    // 重心中線與等距標記
    document.querySelectorAll(`[data-owner-shape="${tid}"][data-dependency-type="centroid_line"]`).forEach(g => {
        const idx = parseInt(g.getAttribute('data-vertex-index'));
        if (!isNaN(idx)) {
            const v = pts[idx]; 
            const p1 = pts[(idx+1)%3], p2 = pts[(idx+2)%3];
            const mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2;
            g.querySelectorAll('line').forEach(l => {
                l.setAttribute('x1', v.x); l.setAttribute('y1', v.y);
                l.setAttribute('x2', mx); l.setAttribute('y2', my);
            });
            g.removeAttribute('transform');
            
            // 【修復 Bug】：通知重心中線上的交點角標重繪
            if (typeof refreshIntersectionAngles === 'function') refreshIntersectionAngles(g);
        }
    });

    document.querySelectorAll(`[data-owner-shape="${tid}"][data-dependency-type="centroid_mark"]`).forEach(g => {
        const idx = parseInt(g.getAttribute('data-vertex-index'));
        if (!isNaN(idx)) {
            g.innerHTML = ''; 
            const v = pts[idx]; 
            const p1 = pts[(idx+1)%3], p2 = pts[(idx+2)%3];
            const mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2;
            
            const count = idx + 1; 
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const ang = Math.atan2(dy, dx);
            const nx = -Math.sin(ang), ny = Math.cos(ang); 
            const tickLen = 6, tickGap = 3.5;

            const positions =[{ x: (p1.x + mx) / 2, y: (p1.y + my) / 2 }, { x: (p2.x + mx) / 2, y: (p2.y + my) / 2 }];

            positions.forEach(pos => {
                for (let n = 0; n < count; n++) {
                    const shift = (n - (count - 1) / 2) * tickGap;
                    const tx = pos.x + Math.cos(ang) * shift;
                    const ty = pos.y + Math.sin(ang) * shift;
                    const tick = document.createElementNS(ns, "line");
                    tick.setAttribute("x1", tx - nx * tickLen); tick.setAttribute("y1", ty - ny * tickLen);
                    tick.setAttribute("x2", tx + nx * tickLen); tick.setAttribute("y2", ty + ny * tickLen);
                    tick.style.cssText = `stroke:#e74c3c; stroke-width:1.8; pointer-events:none;`;
                    g.appendChild(tick);
                }
            });
            g.removeAttribute('transform');
        }
    });
};

window.toggleLockMenu = function() {
    const menu = document.getElementById('menu-lock-geom');
    const btn = document.getElementById('btn-lock-geom');
    if (!btn) return;
    const btnWrapper = btn.parentNode;

    const isVisible = (menu.style.display === 'flex');
    closeAllMenus();
    
    if (!isVisible) {
        fixMenuPosition('menu-lock-geom', btnWrapper);
    }
};

window.batchLockGeometry = function(actionType) {
    closeAllMenus();
    if (selectedElements.length === 0) {
        showAlert("請先選取要設定的圖形");
        return;
    }
    
    let modified = false;

    selectedElements.forEach(shape => {
        const tool = shape.getAttribute('data-tool');
        if (!['polygon', 'polyline', 'line', 'tri', 'rect', 'square', 'angle', 'rhombus', 'kite', 'parallelogram', 'trapezoid'].includes(tool)) {
            return;
        }

        const pts = getTransformedPoints(shape);
        if (pts.length < 2) return;

        let lEdges = JSON.parse(shape.getAttribute('data-locked-edges') || '{}');
        let lAngles = JSON.parse(shape.getAttribute('data-locked-angles') || '{}');

        if (actionType === 'unlock') {
            lEdges = {};
            lAngles = {};
        } else {
            // 鎖定所有邊
            if (actionType === 'edges' || actionType === 'both') {
                for (let i = 0; i < pts.length; i++) {
                    const next = (i + 1) % pts.length;
                    // 折線最後一段不連回起點
                    if ((tool === 'polyline' || tool === 'line' || tool === 'angle') && i === pts.length - 1) continue;
                    const len = Math.hypot(pts[next].x - pts[i].x, pts[next].y - pts[i].y);
                    lEdges[i] = len;
                }
            }
            // 鎖定所有角
            if (actionType === 'angles' || actionType === 'both') {
                for (let i = 0; i < pts.length; i++) {
                    // 折線頭尾無夾角
                    if ((tool === 'polyline' || tool === 'line') && (i === 0 || i === pts.length - 1)) continue;
                    const prev = (i - 1 + pts.length) % pts.length;
                    const next = (i + 1) % pts.length;
                    const a1 = Math.atan2(pts[prev].y - pts[i].y, pts[prev].x - pts[i].x);
                    const a2 = Math.atan2(pts[next].y - pts[i].y, pts[next].x - pts[i].x);
                    let diff = a2 - a1;
                    while (diff <= -Math.PI) diff += 2 * Math.PI;
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    lAngles[i] = diff;
                }
            }
        }

        shape.setAttribute('data-locked-edges', JSON.stringify(lEdges));
        shape.setAttribute('data-locked-angles', JSON.stringify(lAngles));
        window.updateLockVisuals(shape);
        modified = true;
    });

    if (modified) {
        if (typeof saveState === 'function') saveState();
        const msgMap = {
            'unlock': '已解除圖案鎖定',
            'edges': '已鎖定圖案所有邊長',
            'angles': '已鎖定圖案所有角',
            'both': '已鎖定圖案所有邊與角'
        };
        statusText.innerText = msgMap[actionType];
    } else {
        statusText.innerText = "所選物件不支援邊角鎖定";
    }
};
