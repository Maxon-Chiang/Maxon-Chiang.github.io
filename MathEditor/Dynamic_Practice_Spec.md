1.	座標系與置中機制 (Auto-Centering)
	o	「請注意：繪圖座標 cx, cy 預設可直接使用 (0, 0) 為中心來發展圖形。系統底層的 PracticeEngine 會自動計算所有圖形的 Bounding Box，並將其自動置中偏移到對話框的正確位置，因此不需要寫死絕對螢幕座標（如 400, 300）。」
2.	drawObjects 支援的圖形與屬性
	o	「請嚴格使用以下 type 來建構物件：line, circle, polygon, polyline, rect, path, text。」
	o	「屬性規範：支援 stroke, strokeWidth, fill, dash (對應 stroke-dasharray)。若使用 text，其文字內容請放入 text 屬性中，字體大小為 fontSize，文字顏色為 color。」
3.	文字與數學式的渲染
	o	「注意：PracticeEngine 底層會自動為 type: 'text' 的內容加上 $ 符號進行 MathJax 渲染，因此在傳入 text 屬性時，不需要手動外包錢字號。」
	o	「但在 questionTpl (題目文字) 或 generateChoices (選擇題選項) 中，請務必使用 $ 包裝數學變數與公式。」
4.	亂數與整數控制
	o	「為了讓學生好計算，使用 Math.random() 時請務必搭配 Math.floor 或 Math.round 確保產生的變數為漂亮且合理的整數。」

完整範例如下：

{
  id: 'alg_absolute_equation',
  title: '絕對值方程式應用',
  hasAdvanced: true,
  aliases: [],
  generateVars: (level) => {
        const isAdvanced = level === 'advanced';
        const subType = Math.floor(Math.random() * 2) + 1;
        
        if (!isAdvanced) {
            if (subType === 1) {
                // 基礎題 1: |x - h| = d, 求最大解
                const h = Math.floor(Math.random() * 21) - 10; 
                const d = Math.floor(Math.random() * 10) + 3;  
                return { vars: { level: 'basic', type: 1, h, d }, ans: h + d, type: 'input' };
            } else {
                // 基礎題 2: |x - a| = d, 求兩解之和 (a 就是中心點)
                const a = Math.floor(Math.random() * 15) - 7;
                const d = Math.floor(Math.random() * 10) + 5;
                return { vars: { level: 'basic', type: 2, a, d }, ans: 2 * a, type: 'input' };
            }
        } else {
            if (subType === 1) {
                // 進階題 1: |x - p1| + |x - p2| = K (K > p2 - p1)，求最大解
                let p1 = Math.floor(Math.random() * 10) - 10; // 負數座標
                let p2 = Math.floor(Math.random() * 10) + 1;  // 正數座標
                let dist = p2 - p1;
                let extra = Math.floor(Math.random() * 4) * 2 + 2; // 偶數確保整數解
                let K = dist + extra;
                let ans = p2 + extra / 2; 
                return { vars: { level: 'advanced', type: 1, p1, p2, dist, K, extra }, ans: ans, type: 'input' };
            } else {
                // 進階題 2: |x - p1| + |x - p2| = K，判斷解的狀態 (改為選擇題)
                let p1 = Math.floor(Math.random() * 8) - 10; // -10 ~ -3
                let p2 = Math.floor(Math.random() * 8) + 2;  // 2 ~ 9
                let dist = Math.abs(p2 - p1); // 最少是 5，保證選項空間充足
                
                // 隨機決定題型: 0(無限多組解), 1(無解), 2(兩組解)
                let conditionType = Math.floor(Math.random() * 3); 
                let K_ans, wrongOpts;
                if (conditionType === 0) { 
                    K_ans = dist; 
                    wrongOpts = [dist + 2, dist + 4, dist - 2];
                } else if (conditionType === 1) { 
                    K_ans = dist - 2; 
                    wrongOpts = [dist, dist + 2, dist + 4];
                } else { 
                    K_ans = dist + 2; 
                    wrongOpts = [dist, dist - 1, dist - 2];
                }
                
                let optArr = [K_ans, ...wrongOpts].sort((a,b) => a - b);
                let ansIdx = optArr.indexOf(K_ans);

                return { 
                    vars: { level: 'advanced', type: 2, p1, p2, dist, conditionType, options: optArr }, 
                    ans: ansIdx, 
                    type: 'choice' 
                };
            }
        }
    },
  questionTpl: (vars) => {
        const formatEq = (num) => num < 0 ? `+ ${-num}` : `- ${num}`;
        
        if (vars.level === 'basic') {
            if (vars.type === 1) {
                return `已知方程式 $|x ${formatEq(vars.h)}| = ${vars.d}$，<br>請問滿足此方程式的 $x$ 的「<b>最大值</b>」為何？`;
            } else {
                return `已知方程式 $|x ${formatEq(vars.a)}| = ${vars.d}$ 有兩個解，<br>請問這兩個解的「<b>總和</b>」為何？<br><span style="font-size: 13px; color: #7f8c8d;">(提示：善用數線上「中心點」的概念，可以一秒看出答案！)</span>`;
            }
        } else {
            if (vars.type === 1) {
                return `已知方程式 $|x ${formatEq(vars.p1)}| + |x ${formatEq(vars.p2)}| = ${vars.K}$，<br>請問滿足此方程式的 $x$ 的「<b>最大值</b>」為何？<br><span style="font-size: 13px; color: #7f8c8d;">(提示：可以將題目視為「到 ${vars.p1} 與 ${vars.p2} 兩點的距離和為 ${vars.K}」)</span>`;
            } else {
                let condStr = ["無限多組解", "無解", "兩組解"][vars.conditionType];
                return `已知方程式 $|x ${formatEq(vars.p1)}| + |x ${formatEq(vars.p2)}| = K$。<br>若此方程式具有「<b style="color:#e74c3c;">${condStr}</b>」，請問常數 $K$ 可能為下列何者？`;
            }
        }
    },
  drawObjects: (vars) => {
        const objs = [];
        const cx = 0, cy = 0; 
        const axisY = cy + 40;

        const drawAxis = (minV, maxV, step) => {
            const range = maxV - minV;
            const scale = 550 / range; 
            const sx = cx - 275;
            const mapX = (v) => sx + (v - minV) * scale;

            objs.push({ type: 'line', x1: mapX(minV - step), y1: axisY, x2: mapX(maxV + step), y2: axisY, stroke: '#2c3e50', strokeWidth: 3, dash: 'none' });
            objs.push({ type: 'polygon', points: `${mapX(maxV + step)},${axisY} ${mapX(maxV + step)-15},${axisY-6} ${mapX(maxV + step)-15},${axisY+6}`, fill: '#2c3e50', stroke: 'none' });
            objs.push({ type: 'polygon', points: `${mapX(minV - step)},${axisY} ${mapX(minV - step)+15},${axisY-6} ${mapX(minV - step)+15},${axisY+6}`, fill: '#2c3e50', stroke: 'none' });

            let firstTick = Math.ceil(minV / step) * step;
            for (let v = firstTick; v <= maxV; v += step) {
                const x = mapX(v);
                const isOrigin = (v === 0);
                objs.push({ type: 'line', x1: x, y1: axisY - (isOrigin ? 8 : 4), x2: x, y2: axisY + (isOrigin ? 8 : 4), stroke: isOrigin ? '#000' : '#7f8c8d', strokeWidth: isOrigin ? 2.5 : 1.5 });
                objs.push({ type: 'text', x: x, y: axisY + 22, text: v.toString(), color: isOrigin ? '#000' : '#7f8c8d', fontSize: isOrigin ? 15 : 12 });
            }
            return { mapX, scale };
        };

        const drawHBrace = (x, y, w, isTop, col) => {
            let q = Math.min(8, w/4); let h = 15; let dir = isTop ? -1 : 1;
            return { type: 'path', d: `M ${x} ${y} Q ${x} ${y+dir*q} ${x+q} ${y+dir*q} L ${x+w/2-q} ${y+dir*q} Q ${x+w/2} ${y+dir*q} ${x+w/2} ${y+dir*h} Q ${x+w/2} ${y+dir*q} ${x+w/2+q} ${y+dir*q} L ${x+w-q} ${y+dir*q} Q ${x+w} ${y+dir*q} ${x+w} ${y}`, stroke: col, strokeWidth: 2, fill: 'none' };
        };

        if (vars.level === 'basic') {
            const h = vars.type === 1 ? vars.h : vars.a;
            const d = vars.d;
            const { mapX } = drawAxis(h - d - 2, h + d + 2, Math.max(1, Math.ceil(d / 4)));
            const xC = mapX(h);
            
            objs.push({ type: 'circle', cx: xC, cy: axisY, r: 5, fill: '#3498db', stroke: 'none' });
            objs.push({ type: 'text', x: xC, y: axisY - 20, width: 150, text: `中心點 ${h}`, color: '#2980b9', fontSize: 14, fontWeight: 'bold' });
            objs.push({ type: 'line', x1: xC, y1: axisY - 8, x2: xC, y2: axisY - 35, stroke: '#bdc3c7', strokeWidth: 1.5, dash: '4,4' });
            
            const xL = mapX(h - d);
            const xR = mapX(h + d);

            objs.push({ type: 'circle', cx: xL, cy: axisY, r: 6, fill: '#e67e22', stroke: 'white' });
            objs.push({ type: 'circle', cx: xR, cy: axisY, r: 6, fill: '#e67e22', stroke: 'white' });
            
            objs.push({ type: 'text', x: xL, y: axisY - 25, text: "X₁", color: '#e67e22', fontSize: 16, fontWeight: 'bold' });
            objs.push({ type: 'text', x: xR, y: axisY - 25, text: "X₂", color: '#e67e22', fontSize: 16, fontWeight: 'bold' });
            
            objs.push(drawHBrace(xL, axisY - 45, xC - xL, true, '#2980b9'));
            objs.push(drawHBrace(xC, axisY - 45, xR - xC, true, '#2980b9'));
            objs.push({ type: 'text', x: (xL + xC)/2, y: axisY - 70, text: `距離 ${d}`, color: '#2980b9', fontSize: 14 });
            objs.push({ type: 'text', x: (xC + xR)/2, y: axisY - 70, text: `距離 ${d}`, color: '#2980b9', fontSize: 14 });

        } else {
            if (vars.type === 1) {
                const { mapX } = drawAxis(vars.p1 - vars.extra/2 - 2, vars.p2 + vars.extra/2 + 2, Math.max(1, Math.ceil(vars.K / 6)));
                const x1 = mapX(vars.p1);
                const x2 = mapX(vars.p2);
                const xAns = mapX(vars.p2 + vars.extra/2);
                
                objs.push({ type: 'circle', cx: x1, cy: axisY, r: 5, fill: '#3498db', stroke: 'none' });
                objs.push({ type: 'circle', cx: x2, cy: axisY, r: 5, fill: '#3498db', stroke: 'none' });
                objs.push({ type: 'text', x: x1, y: axisY - 20, text: vars.p1.toString(), color: '#2980b9', fontSize: 14, fontWeight: 'bold' });
                objs.push({ type: 'text', x: x2, y: axisY - 20, text: vars.p2.toString(), color: '#2980b9', fontSize: 14, fontWeight: 'bold' });
                
                objs.push(drawHBrace(x1, axisY - 40, xAns - x1, true, '#e74c3c'));
                objs.push({ type: 'text', x: (x1 + xAns)/2, y: axisY - 65, text: `距離 1`, color: '#c0392b', fontSize: 14, fontWeight: 'bold' });
                
                // 距離 2 掛在數線下方，避免與距離 1 的線條重疊
                objs.push(drawHBrace(x2, axisY + 45, xAns - x2, false, '#e67e22'));
                objs.push({ type: 'text', x: (x2 + xAns)/2, y: axisY + 70, text: `距離 2`, color: '#d35400', fontSize: 14, fontWeight: 'bold' });

                objs.push({ type: 'text', x: cx, y: axisY - 100, width: 250, text: `距離1 + 距離2 = ${vars.K}`, color: '#8e44ad', fontSize: 16, fontWeight: 'bold' });

                objs.push({ type: 'circle', cx: xAns, cy: axisY, r: 6, fill: '#8e44ad', stroke: 'white' });
                objs.push({ type: 'text', x: xAns, y: axisY - 25, width: 150, text: "X (最大解)", color: '#8e44ad', fontSize: 16, fontWeight: 'bold' });

            } else {
                const { mapX } = drawAxis(vars.p1 - 6, vars.p2 + 6, Math.max(1, Math.ceil(vars.dist / 5)));
                const x1 = mapX(vars.p1);
                const x2 = mapX(vars.p2);
                
                objs.push({ type: 'circle', cx: x1, cy: axisY, r: 6, fill: '#3498db', stroke: 'white' });
                objs.push({ type: 'circle', cx: x2, cy: axisY, r: 6, fill: '#3498db', stroke: 'white' });
                objs.push({ type: 'text', x: x1, y: axisY + 22, text: vars.p1.toString(), color: '#2980b9', fontSize: 15, fontWeight: 'bold' });
                objs.push({ type: 'text', x: x2, y: axisY + 22, text: vars.p2.toString(), color: '#2980b9', fontSize: 15, fontWeight: 'bold' });
                
                objs.push(drawHBrace(x1, axisY - 40, x2 - x1, true, '#3498db'));
                objs.push({ type: 'text', x: (x1 + x2)/2, y: axisY - 65, width: 200, text: `兩點距離 D = ${vars.dist}`, color: '#2980b9', fontSize: 14, fontWeight: 'bold' });

                const xL = mapX(vars.p1 - 4);
                const xM = mapX((vars.p1 + vars.p2) / 2);
                const xR = mapX(vars.p2 + 4);

                const drawXNode = (nodeX, label, mathLogic, color, width = 120) => {
                    objs.push({ type: 'circle', cx: nodeX, cy: axisY, r: 4, fill: color, stroke: 'none' });
                    objs.push({ type: 'text', x: nodeX, y: axisY - 20, text: label, color: color, fontSize: 16, fontWeight: 'bold' });
                    objs.push({ type: 'text', x: nodeX, y: axisY + 45, width: width, text: mathLogic, color: color, fontSize: 13, fontWeight: 'bold' });
                };

                drawXNode(xL, "X₁", `距和 > ${vars.dist}`, "#e74c3c", 150);
                drawXNode(xR, "X₃", `距和 > ${vars.dist}`, "#e74c3c", 150);
                
                objs.push({ type: 'line', x1: x1, y1: axisY, x2: x2, y2: axisY, stroke: '#27ae60', strokeWidth: 8, dash: 'none' });
                drawXNode(xM, "X₂", `距和 恰好等於 ${vars.dist}`, "#27ae60", 250);
            }
        }
        return objs;
    },
  generateChoices: (ans, vars) => {
        if (vars.type === 2) {
            return vars.options.map(val => ({ text: `$${val}$` }));
        }
        return [];
    }
}