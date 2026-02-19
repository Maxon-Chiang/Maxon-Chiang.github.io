function findIntersectionsForShape(targetShape) {
    const results = [];
    const targetGeo = extractGeometry(targetShape);
    if (!targetGeo) return results;
    const allShapes = document.querySelectorAll('#shapes-layer .shape');
    allShapes.forEach(other => {
        const tTool = other.getAttribute('data-tool');
        if (other === targetShape || tTool === 'text' || tTool === 'math' || tTool === 'mark' || tTool === 'group' || other.classList.contains('vertex-label')) return;
        const otherGeo = extractGeometry(other);
        if (!otherGeo) return;
        targetGeo.segments.forEach(s1 => {
            otherGeo.segments.forEach(s2 => {
                const pt = getLineLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
                if (pt) results.push(pt);
            });
        });
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
    if (value === 'point') {
        setMode('draw', 'point');
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
    } else {
        setMode('draw', 'polygon');
    }
    isContinuousDraw = continuous;
    if (isContinuousDraw) {
        statusText.innerText += " (連續繪圖模式：按右鍵或選取工具結束)";
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
                bestTarget = {
                    shape: target,
                    type: 'edge',
                    p1,
                    p2
                };
            }
        }
    } else if (type === 'angle') {
        pts.forEach((p, i) => {
            const d = Math.sqrt((clickX - p.x) ** 2 + (clickY - p.y) ** 2);
            if (d < SEARCH_RADIUS && d < minDist) {
                const prev = pts[(i - 1 + pts.length) % pts.length];
                const next = pts[(i + 1) % pts.length];
                if (tool !== 'line') {
                    minDist = d;
                    bestTarget = {
                        shape: target,
                        type: 'angle',
                        A: prev,
                        B: p,
                        C: next
                    };
                }
            }
        });
    }
    if (bestTarget) {
        if (type === 'edge') {
            createEdgeMarkAt(bestTarget.p1, bestTarget.p2, bestTarget.shape);
        } else {
            createAngleMarkAt(bestTarget.A, bestTarget.B, bestTarget.C, bestTarget.shape);
        }
        if (isContinuousMarking) {
            statusText.innerText = "已加入標記 (連續模式：請繼續點擊)";
        } else {
            setMode('select');
            statusText.innerText = "已加入標記";
        }
        return true;
    }
    return false;
}

function createMarkObject(d, color, ownerShape = null) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "shape mark-path");
    path.setAttribute("data-tool", "mark");
    path.style.stroke = color;
    path.style.strokeWidth = "2";
    path.style.fill = "none";
    const owner = ownerShape || (selectedElements.length > 0 ? selectedElements[0] : null);
    if (owner) {
        if (!owner.id) owner.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        path.setAttribute("data-owner", owner.id);
    }
    shapesLayer.appendChild(path);
    deselectAll();
    addToSelection(path);
    saveState();
    statusText.innerText = "已加入標記 (可選取、移動或刪除)";
}

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
            generateLabels(el, true);
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

function executeSymmetryReflection(p1, p2) {
    if (selectedElements.length === 0) {
        statusText.innerText = "❌ 錯誤：沒有選取任何物件";
        return;
    }
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const axisAngle = Math.atan2(dy, dx);
    const axisDeg = axisAngle * 180 / Math.PI;
    const reflectTransform = `translate(${p1.x}, ${p1.y}) rotate(${axisDeg}) scale(1, -1) rotate(${-axisDeg}) translate(${-p1.x}, ${-p1.y})`;
    const newShapes = [];
    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();
        const clone = el.cloneNode(true);
        const newId = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        clone.id = newId;
        clone.classList.remove('selected');
        if (clone.hasAttribute('data-label-ids')) clone.removeAttribute('data-label-ids');
        if (clone.hasAttribute('data-angle-label-ids')) clone.removeAttribute('data-angle-label-ids');
        if (clone.hasAttribute('data-owner-shape')) clone.removeAttribute('data-owner-shape');
        if (clone.hasAttribute('data-intersection-lines')) clone.removeAttribute('data-intersection-lines');
        if (tagName === 'polygon' || tagName === 'polyline' || tagName === 'line' || tool === 'line' || tool === 'polygon' || tool === 'polyline') {
            const visualPoints = getTransformedPoints(el);
            const newPoints = visualPoints.map(p => getReflectedPoint(p, p1, axisAngle));
            if (tagName === 'line' || tool === 'line') {
                if (clone.tagName === 'g') {
                    const lines = clone.querySelectorAll('line');
                    lines.forEach(l => {
                        l.setAttribute('x1', newPoints[0].x);
                        l.setAttribute('y1', newPoints[0].y);
                        l.setAttribute('x2', newPoints[1].x);
                        l.setAttribute('y2', newPoints[1].y);
                    });
                } else {
                    clone.setAttribute('x1', newPoints[0].x);
                    clone.setAttribute('y1', newPoints[0].y);
                    clone.setAttribute('x2', newPoints[1].x);
                    clone.setAttribute('y2', newPoints[1].y);
                }
            } else {
                const pointsStr = newPoints.map(p => `${p.x},${p.y}`).join(' ');
                clone.setAttribute('points', pointsStr);
            }
            clone.removeAttribute('transform');
        } else {
            const currentTransform = clone.getAttribute('transform') || '';
            clone.setAttribute('transform', `${reflectTransform} ${currentTransform}`);
        }
        shapesLayer.appendChild(clone);
        newShapes.push(clone);
    });
    saveState();
    setMode('select');
    deselectAll();
    newShapes.forEach(s => addToSelection(s));
    statusText.innerText = `✅ 已完成鏡像 (物件已對稱翻轉)`;
}

function autoApplyMark(x, y) {
    const shapes = document.querySelectorAll('.shape:not(.mark-path)');
    let bestTarget = null;
    if (markModeType === 'edge' && currentEdgeStyle === 'dimension') {
        let closestShape = null;
        let minShapeDist = Infinity;
        shapes.forEach(shape => {
            const tool = shape.getAttribute('data-tool');
            if (tool === 'text' || tool === 'math' || tool === 'mark') return;
            const bbox = shape.getBBox();
            let tx = 0, ty = 0;
            const t = shape.getAttribute('transform');
            if (t && t.includes('translate')) {
                const m = /translate\(([-0-9.]+)[, ]+([-0-9.]+)\)/.exec(t);
                if (m) { tx = +m[1]; ty = +m[2]; }
            }
            if (x >= bbox.x + tx - 50 && x <= bbox.x + tx + bbox.width + 50 &&
                y >= bbox.y + ty - 50 && y <= bbox.y + ty + bbox.height + 50) {
                const geo = extractGeometry(shape);
                if (geo && geo.segments) {
                    geo.segments.forEach(seg => {
                        const d = distToSegment(x, y, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
                        if (d < minShapeDist) {
                            minShapeDist = d;
                            closestShape = shape;
                        }
                    });
                } else if (tool === 'solid' || (tool === 'group' && shape.getAttribute('data-sub-tool')?.startsWith('solid'))) {
                    const center = getShapeCenter(shape);
                    const d = Math.hypot(x - center.x, y - center.y);
                    if (d < minShapeDist) {
                        minShapeDist = d;
                        closestShape = shape;
                    }
                }
            }
        });
        if (closestShape && minShapeDist < 60) {
            const success = executeSmartDimension(closestShape, x, y);
            if (success) {
                if (!isContinuousMarking) {
                    setMode('select');
                    statusText.innerText = "已完成尺寸標註";
                }
                return;
            }
        }
    }
    if (markModeType === 'edge') {
        const EDGE_SEARCH_RADIUS = 30;
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
                const p1 = pts[i];
                const p2 = pts[(i + 1) % pts.length];
                const d = distToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
                if (d < EDGE_SEARCH_RADIUS && d < minDist) {
                    minDist = d;
                    bestTarget = { shape, type: 'edge', p1, p2 };
                }
            }
        });
    } else if (markModeType === 'angle') {
        let bestVertexCenter = null;
        let minVertexDist = Infinity;
        let bestVertexShape = null;
        shapes.forEach(shape => {
            const tool = shape.getAttribute('data-tool');
            if (tool === 'text' || tool === 'math') return;
            const pts = getTransformedPoints(shape);
            pts.forEach(p => {
                const d = Math.hypot(x - p.x, y - p.y);
                if (d < minVertexDist) {
                    minVertexDist = d;
                    bestVertexCenter = p;
                    bestVertexShape = shape;
                }
            });
        });
        if (bestVertexCenter && minVertexDist < 80) {
            const rays = [];
            const MERGE_TOLERANCE = 5;
            shapes.forEach(shape => {
                const tool = shape.getAttribute('data-tool');
                if (tool === 'text' || tool === 'math') return;
                const pts = getTransformedPoints(shape);
                const isLine = (tool === 'line');
                const isPolyline = (tool === 'polyline');
                pts.forEach((p, i) => {
                    if (Math.hypot(p.x - bestVertexCenter.x, p.y - bestVertexCenter.y) < MERGE_TOLERANCE) {
                        let neighbors = [];
                        if (isLine) {
                            const other = pts[(i + 1) % 2];
                            neighbors.push(other);
                        } else {
                            const count = pts.length;
                            const prev = pts[(i - 1 + count) % count];
                            const next = pts[(i + 1) % count];
                            if (isPolyline) {
                                if (i > 0) neighbors.push(prev);
                                if (i < count - 1) neighbors.push(next);
                            } else {
                                neighbors.push(prev);
                                neighbors.push(next);
                            }
                        }
                        neighbors.forEach(nb => rays.push({ x: nb.x, y: nb.y }));
                    }
                });
            });
            if (rays.length >= 2) {
                const rayAngles = rays.map(p => ({
                    point: p,
                    angle: Math.atan2(p.y - bestVertexCenter.y, p.x - bestVertexCenter.x)
                })).sort((a, b) => a.angle - b.angle);
                const mouseAngle = Math.atan2(y - bestVertexCenter.y, x - bestVertexCenter.x);
                let startRay = null;
                let endRay = null;
                if (mouseAngle > rayAngles[rayAngles.length - 1].angle || mouseAngle < rayAngles[0].angle) {
                    startRay = rayAngles[rayAngles.length - 1].point;
                    endRay = rayAngles[0].point;
                } else {
                    for (let i = 0; i < rayAngles.length - 1; i++) {
                        if (mouseAngle >= rayAngles[i].angle && mouseAngle <= rayAngles[i + 1].angle) {
                            startRay = rayAngles[i].point;
                            endRay = rayAngles[i + 1].point;
                            break;
                        }
                    }
                }
                if (startRay && endRay) {
                    bestTarget = {
                        shape: bestVertexShape,
                        type: 'angle',
                        A: startRay,
                        B: bestVertexCenter,
                        C: endRay,
                        radius: minVertexDist
                    };
                }
            }
        }
        if (!bestTarget) {
            const allGeometries = Array.from(shapes).map(s => extractGeometry(s)).filter(g => g);
            const allSegments = allGeometries.flatMap(g => g.segments);
            let bestIntersection = null;
            let minIntersectionDist = 25;
            for (let i = 0; i < allSegments.length; i++) {
                for (let j = i + 1; j < allSegments.length; j++) {
                    const seg1 = allSegments[i];
                    const seg2 = allSegments[j];
                    const intersectionPoint = getLineLineIntersection(seg1.p1, seg1.p2, seg2.p1, seg2.p2);
                    if (intersectionPoint) {
                        const d = Math.hypot(intersectionPoint.x - x, intersectionPoint.y - y);
                        if (d < minIntersectionDist) {
                            minIntersectionDist = d;
                            bestIntersection = { point: intersectionPoint, seg1: seg1, seg2: seg2 };
                        }
                    }
                }
            }
            if (bestIntersection) {
                const center = bestIntersection.point;
                const seg1 = bestIntersection.seg1;
                const seg2 = bestIntersection.seg2;
                const rays = [seg1.p1, seg1.p2, seg2.p1, seg2.p2];
                const rayAngles = rays.map(p => ({
                    point: p,
                    angle: Math.atan2(p.y - center.y, p.x - center.x)
                })).sort((a, b) => a.angle - b.angle);
                const mouseAngle = Math.atan2(y - center.y, x - center.x);
                let startRay = null;
                let endRay = null;
                if (rayAngles.length >= 2 && (mouseAngle > rayAngles[rayAngles.length - 1].angle || mouseAngle < rayAngles[0].angle)) {
                    startRay = rayAngles[rayAngles.length - 1].point;
                    endRay = rayAngles[0].point;
                } else if (rayAngles.length >= 2) {
                    for (let i = 0; i < rayAngles.length - 1; i++) {
                        if (mouseAngle >= rayAngles[i].angle && mouseAngle <= rayAngles[i + 1].angle) {
                            startRay = rayAngles[i].point;
                            endRay = rayAngles[i + 1].point;
                            break;
                        }
                    }
                }
                if (startRay && endRay) {
                    bestTarget = {
                        shape: null,
                        type: 'angle',
                        A: startRay,
                        B: center,
                        C: endRay,
                        radius: Math.max(15, minIntersectionDist)
                    };
                }
            }
        }
    }
    if (bestTarget) {
        if (markModeType === 'edge') {
            createEdgeMarkAt(bestTarget.p1, bestTarget.p2, bestTarget.shape);
        } else {
            createAngleMarkAt(bestTarget.A, bestTarget.B, bestTarget.C, bestTarget.shape, bestTarget.radius);
        }
        if (isContinuousMarking) {
            statusText.innerText = "已加入標記 (連續模式)";
        } else {
            setMode('select');
            statusText.innerText = "已加入標記";
        }
    } else {
        if (!isContinuousMarking) {
            if (markModeType === 'edge' && currentEdgeStyle === 'dimension') {
                statusText.innerText = "未偵測到邊緣，請點擊線條附近";
            } else {
                setMode('select');
                statusText.innerText = "未偵測到標註目標";
            }
        }
    }
}

function createEdgeMarkAt(p1, p2, ownerShape) {
    if (currentEdgeStyle === 'dimension') {
        createDimensionMark(p1, p2, ownerShape);
        return;
    }
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
    if (currentEdgeStyle === 'text') {
        let finalDeg = deg;
        if (Math.abs(finalDeg) > 90) finalDeg += 180;
        const rad = finalDeg * Math.PI / 180;
        const offsetDist = 20;
        const offsetX = Math.sin(rad) * offsetDist;
        const offsetY = -Math.cos(rad) * offsetDist;
        pendingLabelInfo = {
            type: 'edge',
            x: mx + offsetX,
            y: my + offsetY,
            rotation: finalDeg,
            owner: ownerShape,
            edgeIndex: edgeIndex,
            fontSize: 12
        };
        openTextModal('math', null);
        return;
    }
    let pathD = "";
    const s = 5;
    const h = 8;
    if (currentEdgeStyle === '1') {
        pathD = `M 0 -${s} L 0 ${s}`;
    } else if (currentEdgeStyle === '2') {
        pathD = `M -2 -${s} L -2 ${s} M 2 -${s} L 2 ${s}`;
    } else if (currentEdgeStyle === '3') {
        pathD = `M -4 -${s} L -4 ${s} M 0 -${s} L 0 ${s} M 4 -${s} L 4 ${s}`;
    } else if (currentEdgeStyle === 'tick') {
        pathD = `M 0 0 L 0 -${s+2}`;
    } else if (currentEdgeStyle === 'x') {
        pathD = `M -4 -4 L 4 4 M -4 4 L 4 -4`;
    } else if (currentEdgeStyle === 'o') {
        pathD = `M -4 0 A 4 4 0 1 0 4 0 A 4 4 0 1 0 -4 0`;
    } else if (currentEdgeStyle === 'parallel') {
        pathD = `M -${h} -${s} L ${h} 0 L -${h} ${s}`;
    } else {
        pathD = `M 0 -${s} L 0 ${s}`;
    }
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
    mark.style.cssText = "stroke:#c0392b; stroke-width:2; fill:none; pointer-events:all; cursor:move;";
    mark.setAttribute("transform", `translate(${mx}, ${my}) rotate(${deg})`);
    shapesLayer.appendChild(mark);
    saveState();
}

function toggleAngleLabelOnSelection() {
    if (selectedElements.length === 0) {
        statusText.innerText = "請先選取要標註角度的圖形";
        return;
    }
    const lines = selectedElements.filter(el => el.getAttribute('data-tool') === 'line' || el.tagName === 'line');
    if (lines.length === 2) {
        if (!lines[0].id) lines[0].id = 'line-' + Date.now() + '1';
        if (!lines[1].id) lines[1].id = 'line-' + Date.now() + '2';
        const id1 = lines[0].id;
        const id2 = lines[1].id;
        let removedAny = false;
        const oldMarks = document.querySelectorAll(`.intersection-mark`);
        oldMarks.forEach(m => {
            const refs = m.getAttribute('data-intersection-lines');
            if (refs && refs.includes(id1) && refs.includes(id2)) {
                m.remove();
                removedAny = true;
            }
        });
        if (removedAny) {
            saveState();
            statusText.innerText = `已移除交點標註`;
            return;
        }
        const g1 = extractGeometry(lines[0]);
        const g2 = extractGeometry(lines[1]);
        if (g1 && g2 && g1.segments[0] && g2.segments[0]) {
            const s1 = g1.segments[0], s2 = g2.segments[0];
            const inter = getLineLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
            if (inter) {
                const allEnds = [s1.p1, s1.p2, s2.p1, s2.p2];
                let rays = [];
                allEnds.forEach(p => {
                    if (Math.hypot(p.x - inter.x, p.y - inter.y) > 1) {
                        rays.push(p);
                    }
                });
                const rayAngles = rays.map(p => ({
                    point: p,
                    angle: Math.atan2(p.y - inter.y, p.x - inter.x)
                })).sort((a, b) => a.angle - b.angle);
                const lineRef = `${id1},${id2}`;
                const count = rayAngles.length;
                for (let i = 0; i < count; i++) {
                    const A = rayAngles[i].angle;
                    let C = rayAngles[(i + 1) % count].angle;
                    let diff = C - A;
                    while (diff <= 0) diff += 2 * Math.PI;
                    if (count === 3 && diff > 3.0) continue;
                    if (count === 2 && diff > Math.PI) continue;
                    buildIntersectionAngle(inter, A, C, diff, lineRef);
                }
                saveState();
                statusText.innerText = `已標註交點 (共存模式)`;
                return;
            }
        }
    }
    selectedElements.forEach(el => {
        if (el.getAttribute('data-tool') === 'line') return;
        if (el.hasAttribute('data-angle-label-ids')) {
            const ids = el.getAttribute('data-angle-label-ids').split(',');
            ids.forEach(id => { const m = document.getElementById(id); if (m) m.remove(); });
            el.removeAttribute('data-angle-label-ids');
        } else {
            generateAngleLabels(el, true);
        }
    });
    saveState();
    setMode('select');
}

function buildIntersectionAngle(inter, angA, angC, diff, lineRef) {
    const MARK_RADIUS = 18;
    const TEXT_OFFSET = 15;
    const deg = Math.round(diff * 180 / Math.PI);
    const isRight = Math.abs(deg - 90) < 1;
    const largeArcFlag = diff > Math.PI ? 1 : 0;
    const sweepFlag = 1;
    let mark;
    if (isRight && diff < Math.PI) {
        const s = 10;
        const p1 = { x: inter.x + Math.cos(angA) * s, y: inter.y + Math.sin(angA) * s };
        const p2 = { x: inter.x + Math.cos(angC) * s, y: inter.y + Math.sin(angC) * s };
        const p3 = { x: p1.x + p2.x - inter.x, y: p1.y + p2.y - inter.y };
        const d = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`;
        mark = createMarkObject(d, "#c0392b");
    } else {
        const pS = { x: inter.x + MARK_RADIUS * Math.cos(angA), y: inter.y + MARK_RADIUS * Math.sin(angA) };
        const pE = { x: inter.x + MARK_RADIUS * Math.cos(angC), y: inter.y + MARK_RADIUS * Math.sin(angC) };
        const d = `M ${pS.x} ${pS.y} A ${MARK_RADIUS} ${MARK_RADIUS} 0 ${largeArcFlag} ${sweepFlag} ${pE.x} ${pE.y}`;
        mark = createMarkObject(d, "#c0392b");
    }
    if (lineRef) {
        mark.setAttribute('data-intersection-lines', lineRef);
        mark.classList.add('intersection-mark');
    }
    if (isRight) return;
    const mid = angA + diff / 2;
    const textEl = document.createElementNS(ns, "text");
    textEl.setAttribute("x", inter.x + (MARK_RADIUS + TEXT_OFFSET) * Math.cos(mid));
    textEl.setAttribute("y", inter.y + (MARK_RADIUS + TEXT_OFFSET) * Math.sin(mid));
    textEl.textContent = `${deg}°`;
    textEl.setAttribute("class", "shape vertex-label intersection-mark");
    textEl.setAttribute("data-tool", "text");
    if (lineRef) textEl.setAttribute('data-intersection-lines', lineRef);
    textEl.style.cssText = "font-size:12px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; font-weight:bold; cursor:move;";
    shapesLayer.appendChild(textEl);
}

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
    if (!['polygon', 'angle', 'rect', 'tri', 'tangent', 'group', 'ellipse'].includes(tool)) return false;
    const pts = getTransformedPoints(shape);
    if (pts.length < 2) return false;
    const createdMarkIds = [];
    const MARK_RADIUS = 18;
    const TEXT_OFFSET = 15;
    let targetIndices = [];
    if (tool === 'group' && subTool) {
        if (subTool === 'central-angle') {
            targetIndices = [0];
        } else if (subTool === 'inscribed-angle') {
            targetIndices = [1];
        } else if (subTool === 'tangent-chord-angle') {
            targetIndices = [1];
        }
    } else if (tool === 'angle' || tool === 'tangent') {
        targetIndices = [1];
    } else if (subTool === 'sector') {
        targetIndices = [1];
    } else {
        targetIndices = pts.map((_, i) => i);
    }
    for (let i = 0; i < pts.length; i++) {
        if (!targetIndices.includes(i)) continue;
        let p_prev, p_curr, p_next;
        if (subTool === 'central-angle') {
            p_curr = pts[0]; p_prev = pts[1]; p_next = pts[2];
        } else {
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
            if (drawDir === 'left') {
                while (diff < 0) diff += 2 * Math.PI;
            } else {
                while (diff > 0) diff -= 2 * Math.PI;
            }
        } else {
            while (diff <= -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
        }
        let degrees = Math.abs(diff * 180 / Math.PI);
        if (subTool !== 'sector' && (Math.abs(degrees - 180) < 1 || isNaN(degrees))) continue;
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
        markPath.style.cssText = "stroke:#c0392b; stroke-width:1.5; fill:none; cursor:move;";
        markPath.id = 'ang-path-' + Date.now() + Math.random().toString(36).substr(2, 5);
        shapesLayer.appendChild(markPath);
        createdMarkIds.push(markPath.id);
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
            textEl.setAttribute("class", "shape vertex-label");
            textEl.setAttribute("data-tool", "text");
            textEl.setAttribute("data-owner-angle-shape", shape.id);
            textEl.style.cssText = "font-size:13px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; cursor:text; font-weight:normal;";
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
    if (shape && shape.hasAttribute('data-angle-label-ids')) {
        const ids = shape.getAttribute('data-angle-label-ids').split(',');
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        shape.removeAttribute('data-angle-label-ids');
        generateAngleLabels(shape, true);
    }
}
window.refreshAngleLabels = refreshAngleLabels;

function refreshIntersectionAngles(movedLine) {
    if (!movedLine || !movedLine.id) return;
    const allRelatedMarks = document.querySelectorAll(`.intersection-mark`);
    const marksToProcess = Array.from(allRelatedMarks).filter(m => {
        const refs = m.getAttribute('data-intersection-lines');
        if (!refs) return false;
        const ids = refs.split(',');
        return ids.includes(movedLine.id);
    });
    if (marksToProcess.length === 0) return;
    const pairSet = new Set();
    marksToProcess.forEach(m => {
        pairSet.add(m.getAttribute('data-intersection-lines'));
    });
    pairSet.forEach(pairStr => {
        const ids = pairStr.split(',');
        const lineA = document.getElementById(ids[0]);
        const lineB = document.getElementById(ids[1]);
        if (!lineA || !lineB) return;
        document.querySelectorAll(`.intersection-mark[data-intersection-lines="${pairStr}"]`)
            .forEach(m => m.remove());
        const g1 = extractGeometry(lineA);
        const g2 = extractGeometry(lineB);
        if (!g1 || !g2 || !g1.segments[0] || !g2.segments[0]) return;
        const s1 = g1.segments[0], s2 = g2.segments[0];
        const inter = getLineLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
        if (!inter) return;
        const allEnds = [s1.p1, s1.p2, s2.p1, s2.p2];
        let rays = [];
        allEnds.forEach(p => {
            if (Math.hypot(p.x - inter.x, p.y - inter.y) > 1) {
                rays.push(p);
            }
        });
        const rayAngles = rays.map(p => ({
            point: p,
            angle: Math.atan2(p.y - inter.y, p.x - inter.x)
        })).sort((a, b) => a.angle - b.angle);
        const count = rayAngles.length;
        for (let i = 0; i < count; i++) {
            const A = rayAngles[i].angle;
            let C = rayAngles[(i + 1) % count].angle;
            let diff = C - A;
            while (diff <= 0) diff += 2 * Math.PI;
            if (count === 3 && diff > 3.0) continue;
            if (count === 2 && diff > Math.PI) continue;
            buildIntersectionAngle(inter, A, C, diff, pairStr);
        }
    });
}

function drawDiagonalsFromSelection() {
    if (selectedElements.length === 0) return;
    let createdCount = 0;
    const newLines = [];
    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'polygon' || tool === 'polygon' || tool === 'rect' || tool === 'square' || tool === 'rhombus' || tool === 'kite' || tool === 'trapezoid' || tool === 'parallelogram') {
            const pts = getTransformedPoints(el);
            const n = pts.length;
            if (n < 4) return;
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
                    line.setAttribute('class', 'shape visible-line');
                    line.setAttribute('data-tool', 'line');
                    line.style.cssText = "stroke:#7f8c8d; stroke-width:1; stroke-dasharray:5,3; vector-effect:non-scaling-stroke;";
                    const g = document.createElementNS(ns, "g");
                    g.setAttribute('class', 'shape group');
                    g.setAttribute('data-tool', 'line');
                    const hitLine = document.createElementNS(ns, "line");
                    hitLine.setAttribute('x1', p1.x); hitLine.setAttribute('y1', p1.y);
                    hitLine.setAttribute('x2', p2.x); hitLine.setAttribute('y2', p2.y);
                    hitLine.setAttribute('class', 'hit-line');
                    hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
                    g.appendChild(hitLine);
                    g.appendChild(line);
                    if (el.id) g.setAttribute('data-owner-shape', el.id);
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
        deselectAll();
        newLines.forEach(l => addToSelection(l));
        statusText.innerText = `已繪製 ${createdCount} 條對角線`;
    } else {
        statusText.innerText = "無法繪製對角線 (請選取四邊以上的多邊形)";
    }
}
window.drawDiagonalsFromSelection = drawDiagonalsFromSelection;