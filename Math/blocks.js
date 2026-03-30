// --- START OF FILE blocks.js (修改與覆蓋) ---

// 動態注入積木編輯模式的專屬 CSS
const blockStyle = document.createElement('style');
blockStyle.innerHTML = `
    .block-interact {
        cursor: pointer !important;
        transition: fill 0.1s;
    }
    .block-interact:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(blockStyle);

window.createSolidBlocks = function(x, y, params) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "shape group solid-blocks");
    group.setAttribute("data-tool", "blocks");
    
    const cols = parseInt(params?.p_cols) || 3; // 寬
    const rows = parseInt(params?.p_rows) || 3; // 深
    const showArrows = params?.p_arrows !== undefined ? params.p_arrows : true;
    
    const initialHeights = Array(rows).fill().map(() => Array(cols).fill(0));
    // 預設在左前角放一塊積木 (r=0 為前方)
    if(rows > 0 && cols > 0) initialHeights[0][0] = 1;

    group.setAttribute("data-heights", JSON.stringify(initialHeights));
    group.setAttribute("data-block-size", "35"); 
    group.setAttribute("data-show-arrows", showArrows);
    group.setAttribute("transform", `translate(${x}, ${y})`);
    
    document.getElementById('shapes-layer').appendChild(group);
    redrawSolidBlocks(group);
    return group;
};

// 2. 繪製積木核心邏輯 (修正畫家演算法與箭頭指示)
window.redrawSolidBlocks = function(group) {
    group.innerHTML = ''; 
    
    const heights = JSON.parse(group.getAttribute('data-heights'));
    const rows = heights.length;
    const cols = heights[0].length;
    const s = parseFloat(group.getAttribute('data-block-size')) || 35;
    const showArrows = group.getAttribute('data-show-arrows') === 'true';
    
    const selR = parseInt(group.getAttribute('data-selected-r'));
    const selC = parseInt(group.getAttribute('data-selected-c'));

    // 等角投影參數 (30度)
    const cos30 = 0.866025;
    const sin30 = 0.5;
    const dx = s * cos30;
    const dy = s * sin30;
    const ns = "http://www.w3.org/2000/svg";

    const createPoly = (points, fill, r, c) => {
        const poly = document.createElementNS(ns, "polygon");
        poly.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
        poly.style.cssText = `fill: ${fill}; stroke: #2c3e50; stroke-width: 1.2; stroke-linejoin: round; vector-effect: non-scaling-stroke;`;
        poly.setAttribute("class", "block-interact");
        poly.setAttribute("data-r", r);
        poly.setAttribute("data-c", c);
        return poly;
    };

    let minVisualY = Infinity; 

    // 【修正畫家演算法】
    // r=0 為最前方，r=rows-1 為最後方。必須從後 (rows-1) 往前 (0) 畫，積木才不會被後面的蓋住
    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
            const h = heights[r][c];
            
            // 計算反轉的 r_inv，確保 r=0 (前方) 落在螢幕下方 (Y較大)
            const r_inv = rows - 1 - r;
            const baseX = (c - r_inv) * dx;
            const baseY = (c + r_inv) * dy;

            const isSelected = (r === selR && c === selC);

            // 【需求4】實心色碼，確保沒有透明度問題
            const baseColor = isSelected ? '#fae5a0' : '#f5f6f8'; 

            const ptsBase =[
                {x: baseX, y: baseY}, {x: baseX+dx, y: baseY+dy},
                {x: baseX, y: baseY+dy*2}, {x: baseX-dx, y: baseY+dy}
            ];
            const basePoly = createPoly(ptsBase, baseColor, r, c);
            
            if (h === 0) {
                basePoly.style.strokeDasharray = "3,3";
                basePoly.style.stroke = isSelected ? "#e67e22" : "#bdc3c7";
                if (baseY < minVisualY) minVisualY = baseY;
            } else {
                basePoly.style.stroke = "none"; 
            }
            group.appendChild(basePoly);

            for (let z = 0; z < h; z++) {
                const Z = baseY - z * s;

                // 紀錄最高點，供上方箭頭對齊用
                if (Z - s < minVisualY) minVisualY = Z - s;

                // 實心色碼
                const cTop = (isSelected && z === h-1) ? '#ffeaa7' : '#fced72'; 
                const cRight = isSelected ? '#e1b12c' : '#c89d5f'; 
                const cLeft = isSelected ? '#a4b0be' : '#888888';  

                const tPts =[{x: baseX, y: Z-s}, {x: baseX+dx, y: Z-s+dy}, {x: baseX, y: Z-s+dy*2}, {x: baseX-dx, y: Z-s+dy}];
                const rPts =[{x: baseX, y: Z+dy*2}, {x: baseX+dx, y: Z+dy}, {x: baseX+dx, y: Z-s+dy}, {x: baseX, y: Z-s+dy*2}];
                const lPts =[{x: baseX, y: Z+dy*2}, {x: baseX-dx, y: Z+dy}, {x: baseX-dx, y: Z-s+dy}, {x: baseX, y: Z-s+dy*2}];
                
                group.appendChild(createPoly(lPts, cLeft, r, c));
                group.appendChild(createPoly(rPts, cRight, r, c));
                group.appendChild(createPoly(tPts, cTop, r, c));
            }
        }
    }

    // 繪製方位指示箭頭
    // 繪製方位指示箭頭 (改為獨立物件)
    if (!group.id) group.id = 'blocks-' + Date.now(); // 確保積木有 ID
    
    // 先清除舊的箭頭
    document.querySelectorAll(`g[data-owner-blocks="${group.id}"][data-sub-tool="block-arrow"]`).forEach(el => el.remove());

    if (showArrows) {
        const createArrow = (targetX, targetY, angle, label) => {
            // 轉換為全域座標
            const matrix = group.getCTM() || {a:1,b:0,c:0,d:1,e:0,f:0};
            const gX = targetX * matrix.a + targetY * matrix.c + matrix.e;
            const gY = targetX * matrix.b + targetY * matrix.d + matrix.f;

            const arrG = document.createElementNS(ns, "g");
            arrG.setAttribute('class', 'shape group');
            arrG.setAttribute('data-tool', 'group');
            arrG.setAttribute('data-sub-tool', 'block-arrow');
            arrG.setAttribute('data-owner-blocks', group.id); // 綁定積木

            const len = s * 0.8; 
            const rad = angle * Math.PI / 180;
            
            // 箭頭終點指向 gX, gY，起點往外推
            const startX = gX - len * Math.cos(rad);
            const startY = gY - len * Math.sin(rad);

            const line = document.createElementNS(ns, "line");
            line.setAttribute("x1", startX); line.setAttribute("y1", startY);
            line.setAttribute("x2", gX); line.setAttribute("y2", gY);
            line.style.cssText = "stroke:black; stroke-width:1.5; marker-end:url(#arrow-end); vector-effect:non-scaling-stroke;";
            
            const txt = document.createElementNS(ns, "text");
            txt.textContent = label;
            
            let anchor = "middle";
            if (Math.abs(Math.cos(rad)) > 0.1) anchor = Math.cos(rad) > 0 ? "end" : "start";
            let baseline = "middle";
            if (Math.abs(Math.sin(rad)) > 0.1) baseline = Math.sin(rad) > 0 ? "auto" : "hanging";
            
            const txtOffset = 6;
            txt.setAttribute("x", startX - txtOffset * Math.cos(rad)); 
            txt.setAttribute("y", startY - txtOffset * Math.sin(rad));
            txt.style.cssText = `font-family: Arial, 'Microsoft JhengHei', sans-serif; font-size: 15px; font-weight: bold; fill: black; text-anchor: ${anchor}; dominant-baseline: ${baseline}; stroke: none !important; cursor:move;`;
            
            arrG.appendChild(line);
            arrG.appendChild(txt);
            document.getElementById('shapes-layer').appendChild(arrG); // 加到外層
        };

        const centerX = ((cols - 1) / 2 - (rows - 1) / 2) * dx;
        createArrow(centerX, minVisualY - s * 0.8, 90, "上方");

        const centerFrontX = ((cols - 1) / 2 - (rows - 1)) * dx;
        const centerFrontY = ((cols - 1) / 2 + (rows - 1)) * dy;
        createArrow(centerFrontX - dx * 1.8, centerFrontY + dy * 1.8, -30, "前方");

        const centerRightX = ((cols - 1) - (rows - 1) / 2) * dx;
        const centerRightY = ((cols - 1) + (rows - 1) / 2) * dy;
        createArrow(centerRightX + dx * 1.8, centerRightY + dy * 1.8, -150, "右方"); 
    }
};

// 3. 一鍵產生三視圖 (同步修正 r=0 為前方的邏輯)
window.generateOrthographicViews = function(group) {
    // 確保積木有 ID 以便綁定
    if (!group.id) group.id = 'blocks-' + Date.now();
    // 加上標記，代表此積木已開啟三視圖連動
    group.setAttribute('data-has-views', 'true');
    
    // 呼叫連動重繪函式
    window.updateOrthographicViews(group);
    
    if (typeof saveState === 'function') saveState();
    if (typeof setMode === 'function') setMode('select');
    if (typeof deselectAll === 'function') deselectAll();
    
    // 自動選取新產生的三個獨立視圖，方便使用者立刻移動
    setTimeout(() => {
        const views = document.querySelectorAll(`g[data-owner-blocks="${group.id}"]`);
        views.forEach(v => {
            if (typeof addToSelection === 'function') addToSelection(v);
        });
    }, 50);
};

// 獨立的核心：三視圖連動重繪邏輯
window.updateOrthographicViews = function(group) {
    if (group.getAttribute('data-has-views') !== 'true') return;
    if (!group.id) group.id = 'blocks-' + Date.now();
    
    const blockId = group.id;
    const heights = JSON.parse(group.getAttribute('data-heights'));
    const R = heights.length;
    const C = heights[0].length;
    const s = 30; // 視圖網格大小
    const blockSize = parseFloat(group.getAttribute('data-block-size')) || 35;
    const dx = blockSize * 0.866025;
    const dy = blockSize * 0.5;
    
    // 計算高度陣列
    const frontH = new Array(C).fill(0);
    const rightH = new Array(R).fill(0);
    let minVisualY = Infinity;
    
    for (let r = 0; r < R; r++) {
        let rightViewCol = r; 
        for (let c = 0; c < C; c++) {
            frontH[c] = Math.max(frontH[c], heights[r][c]);
            rightH[rightViewCol] = Math.max(rightH[rightViewCol], heights[r][c]);
            
            const baseY = (c + (R - 1 - r)) * dy;
            const topY = baseY - heights[r][c] * blockSize;
            if (topY < minVisualY) minVisualY = topY;
        }
    }

    // --- 計算 3 個視圖應該出現的絕對座標 ---
    const matrix = group.getCTM();
    const toGlobal = (lx, ly) => ({
        x: lx * matrix.a + ly * matrix.c + matrix.e,
        y: lx * matrix.b + ly * matrix.d + matrix.f
    });

    // 1. 前視圖位置：在「前方」箭頭的【左邊】 (X 往左推 dx * 5)
    const centerFrontX = ((C - 1) / 2 - (R - 1)) * dx;
    const centerFrontY = ((C - 1) / 2 + (R - 1)) * dy;
    const posFront = toGlobal(centerFrontX - dx * 6, centerFrontY + dy * 4);

    // 2. 右視圖位置：在「右方」箭頭的【右邊】 (X 往右推 dx * 4)
    const centerRightX = ((C - 1) - (R - 1) / 2) * dx;
    const centerRightY = ((C - 1) + (R - 1) / 2) * dy;
    const posRight = toGlobal(centerRightX + dx * 6, centerRightY + dy * 4);

    // 3. 上視圖位置：在「上方」箭頭的【上方】
    // 由於上視圖繪圖是從 Y=-30 繼續往上長，所以基準點設定在箭頭上方一點點即可
    const centerX = ((C - 1) / 2 - (R - 1) / 2) * dx;
    const posTop = toGlobal(centerX + dx * 3, minVisualY);

    // 封裝視圖更新邏輯 (以文字為 0,0 原點，網格向上延伸)
    const renderView = (viewType, title, defaultPos, drawLogic) => {
        let viewG = document.querySelector(`g[data-owner-blocks="${blockId}"][data-view-type="${viewType}"]`);
        
        if (!viewG) {
            viewG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            viewG.setAttribute("class", "shape group");
            viewG.setAttribute("data-tool", "group");
            viewG.setAttribute("data-owner-blocks", blockId);
            viewG.setAttribute("data-view-type", viewType);
            viewG.setAttribute("transform", `translate(${defaultPos.x}, ${defaultPos.y})`);
            document.getElementById('shapes-layer').appendChild(viewG);
        }
        viewG.innerHTML = '';
        drawLogic(viewG);
    };

    const textStyle = "font-family:'Microsoft JhengHei', Arial, sans-serif; font-size:16px; font-weight:bold; fill:#2c3e50; text-anchor:middle; stroke:none !important;";
    const numStyle = "font-family:Arial, sans-serif; font-size:18px; font-weight:bold; fill:#c0392b; text-anchor:middle; dominant-baseline:central; stroke:none !important;";

    // --- 1. 更新上視圖 ---
    renderView('top', '上視圖', posTop, (viewG) => {
        const startX = -(C * s) / 2; // 文字置中，往左偏移一半寬度
        const baseY = -30; // 網格底線距離文字 30px
        
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                const h = heights[r][c];
                const displayY = baseY - (r + 1) * s; // 往上長，r=0 最下面
                const displayX = startX + c * s;
                
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", displayX);
                rect.setAttribute("y", displayY);
                rect.setAttribute("width", s);
                rect.setAttribute("height", s);
                rect.style.cssText = h > 0 ? "fill:#ecf0f1; stroke:#2c3e50; stroke-width:2;" : "fill:none; stroke:#ccc; stroke-width:1; stroke-dasharray:4,4;";
                viewG.appendChild(rect);
                
                if (h > 0) {
                    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    txt.setAttribute("x", displayX + s / 2);
                    txt.setAttribute("y", displayY + s / 2 + 2);
                    txt.textContent = h;
                    txt.style.cssText = numStyle;
                    viewG.appendChild(txt);
                }
            }
        }
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", 0);
        txt.setAttribute("y", 0);
        txt.textContent = "上視圖";
        txt.style.cssText = textStyle;
        viewG.appendChild(txt);
    });

    // 2. 更新前視圖
    renderView('front', '前視圖', posFront, (viewG) => {
        const startX = -(C * s) / 2;
        const baseY = -30;

        for (let c = 0; c < frontH.length; c++) {
            const h = frontH[c];
            
            if (h === 0) {
                // 【新增】若該列高度為 0，繪製底部第一層的虛線格
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", startX + c * s);
                rect.setAttribute("y", baseY - s); // 對應 z=0 的位置
                rect.setAttribute("width", s);
                rect.setAttribute("height", s);
                rect.style.cssText = "fill:none; stroke:#ccc; stroke-width:1; stroke-dasharray:4,4;";
                viewG.appendChild(rect);
            } else {
                // 原有的實心積木繪製
                for (let z = 0; z < h; z++) {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("x", startX + c * s);
                    rect.setAttribute("y", baseY - (z + 1) * s); // 依高度往上疊加
                    rect.setAttribute("width", s);
                    rect.setAttribute("height", s);
                    rect.style.cssText = "fill:#ecf0f1; stroke:#2c3e50; stroke-width:2;";
                    viewG.appendChild(rect);
                }
            }
        }
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", 0);
        txt.setAttribute("y", 0);
        txt.textContent = '前視圖';
        txt.style.cssText = textStyle;
        viewG.appendChild(txt);
    });

    // 3. 更新右視圖
    renderView('right', '右視圖', posRight, (viewG) => {
        const startX = -(R * s) / 2;
        const baseY = -30;

        for (let c = 0; c < rightH.length; c++) {
            const h = rightH[c];
            
            if (h === 0) {
                // 【新增】若該列高度為 0，繪製底部第一層的虛線格
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", startX + c * s);
                rect.setAttribute("y", baseY - s); // 對應 z=0 的位置
                rect.setAttribute("width", s);
                rect.setAttribute("height", s);
                rect.style.cssText = "fill:none; stroke:#ccc; stroke-width:1; stroke-dasharray:4,4;";
                viewG.appendChild(rect);
            } else {
                // 原有的實心積木繪製
                for (let z = 0; z < h; z++) {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("x", startX + c * s);
                    rect.setAttribute("y", baseY - (z + 1) * s); // 依高度往上疊加
                    rect.setAttribute("width", s);
                    rect.setAttribute("height", s);
                    rect.style.cssText = "fill:#ecf0f1; stroke:#2c3e50; stroke-width:2;";
                    viewG.appendChild(rect);
                }
            }
        }
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", 0);
        txt.setAttribute("y", 0);
        txt.textContent = '右視圖';
        txt.style.cssText = textStyle;
        viewG.appendChild(txt);
    });
};
