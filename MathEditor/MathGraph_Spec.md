# 數學公式繪圖編輯器 (MathGraph) - 系統生成規格書

這是一份給 AI 數學幾何生成引擎的嚴格規格書。本系統支援兩種輸出模式：**【一般靜態 SVG 作圖】** 與 **【動態互動題型 JavaScript Object】**，請依據使用者的任務需求引用對應的章節。

---

## 1. 🚨 靜態圖形 JSON 輸出結構與文字規範 (Static Mode Rules)
靜態模式下，系統預期接收一個 JSON 物件，裡面包含 items 陣列，每個 item 代表一個頁面或一題：
{
  "items": [
    {
      "title": "題號或標題",
      "questionText": "數學與幾何符號必須使用 $ 包裝。LaTeX 指令必須雙重跳脫，例如 $\\triangle ABC$ 或 $\\angle A$。換行請使用 \\n",
      "svgInner": "這裡填寫真正的 SVG 幾何圖形原始碼，絕對不能只填純文字！"
    }
  ]
}

**JSON 內嵌 SVG 的極度重要限制：**
在 svgInner 屬性中的所有 HTML/SVG 屬性，強制使用單引號 (')，以防止破壞 JSON 結構。例如：class='shape'。
(若屬性值本身是 JSON 字串，請使用單引號包裝外部，內部維持雙引號，例如：data-params='{"a":1,"b":0}')。

---

## 2. 靜態圖形作圖黃金法則 (Static SVG Strict Rules)
1. 嚴禁嵌套 <svg> 標籤： svgInner 欄位只能包含內部的幾何元素。絕對不可以包含 <svg> 標籤。
2. 絕對坐標定位： 畫布基準尺寸為 800x600 (中心點為 400,300)。請直接給予所有圖形絕對坐標，嚴禁在最外層使用 <g transform="..."> 進行排版平移。
3. 必須的 Class： 所有可互動的主體物件都必須包含 class='shape'。
4. 必須的 Tool 屬性： 所有物件都必須有 data-tool='對應工具名稱'。
5. 合法的群組化 (Group)： 若需將多個物件打包成群組 (如長度標註、立體圖)，該 <g> 標籤必須具備 class='shape group' data-tool='group'。
6. ID 綁定與關聯： 如果標籤、角度標註等附屬物件依附於主體圖形，主體圖形必須加上 id='自訂ID'，附屬物件則必須透過 data-owner-shape='自訂ID' 進行綁定。
7. 強制無填滿： 除非特別要求，所有平面幾何圖形強制設定 fill='none'、stroke='#000000'、stroke-width='2'。

---

## 3. 靜態基礎幾何圖形 (2D Basic Shapes)

### 3.1 直線與線段 (Line / Segment)
必須使用 <g> 包裝，包含隱藏判定線 (hit-line) 與可見線 (visible-line)。
<g class='shape group' data-tool='line' data-sub-tool='line-simple' id='line-1'>
    <line x1='100' y1='100' x2='300' y2='100' class='hit-line' stroke='transparent' stroke-width='10' />
    <line x1='100' y1='100' x2='300' y2='100' class='visible-line' stroke='#000000' stroke-width='2' />
</g>

### 3.2 數線與箭頭 (Number Line / Arrow)
若題目為「單純的數線」或需要「箭頭」，請直接畫線並加上 marker-end='url(#arrow-end)'，不要呼叫 axes-system。
<g class='shape group' data-tool='line' data-sub-tool='line-end' id='line-2'>
    <line x1='100' y1='300' x2='700' y2='300' class='hit-line' stroke='transparent' stroke-width='10' />
    <line x1='100' y1='300' x2='700' y2='300' class='visible-line' stroke='#000000' stroke-width='2' marker-end='url(#arrow-end)' />
</g>
<!-- 數線上的點 -->
<circle cx='400' cy='300' r='4' class='shape' data-tool='point' fill='#000000' stroke='none' />

### 3.3 多邊形 (Polygon / Triangle / Quadrilateral)
禁止用零碎的 <line> 畫多邊形，必須用 <polygon>。
<polygon points='100,100 200,100 150,50' class='shape' data-tool='polygon' fill='none' stroke='#000000' stroke-width='2' id='poly-1' />

### 3.4 圓形與扇形 (Circle / Sector)
扇形必須包含數學數據屬性。
<ellipse cx='200' cy='200' rx='100' ry='100' class='shape' data-tool='ellipse' data-sub-tool='circle' fill='none' stroke='#000000' stroke-width='2' id='circle-1' />

<path d='M 200 200 L 300 200 A 100 100 0 0 0 250 113 Z' class='shape' data-tool='ellipse' data-sub-tool='sector' data-center-x='200' data-center-y='200' data-radius='100' data-start-angle='0' data-end-angle='1.047' fill='none' stroke='#000000' />

---

## 4. 進階圖形與坐標系 (高階組件優先)
若題目出現立體圖形、坐標平面或函數，絕對禁止自己用線條慢慢畫！請務必使用下列系統內建的高階組件：

### 4.1 3D 立體圖形 (Solid 3D Shapes)
系統支援 solid-cube(正方/長方體), solid-cylinder(圓柱), solid-cone(圓錐), solid-pyramid(四角錐), solid-prism(三角柱)。
只需給定中心點與長寬高等數值，系統匯入後會自動描繪 3D 線條。
<!-- 圓柱體範例：cx,cy為中心，r為半徑，h為高 -->
<g class='shape group' data-tool='solid' data-sub-tool='solid-cylinder' data-cx='400' data-cy='300' data-r='50' data-h='150'></g>
<!-- 長方體/直角柱範例：cx,cy為中心，w為寬，h為高，d為深 -->
<g class='shape group' data-tool='solid' data-sub-tool='solid-cube' data-cx='400' data-cy='300' data-w='100' data-h='100' data-d='100'></g>

### 4.2 XY 坐標平面 (Coordinate Plane)
<g class='shape axes-system' data-tool='group' data-type='xy' data-range='10' data-minor='1' data-major='5' data-label='5' data-show-grid='false'></g>

### 4.3 數學函數圖形 (Standard Functions)
給定參數 JSON，系統會自動描繪完美的函數曲線。
<!-- 二次函數 y = ax^2 + bx + c -->
<path class='shape smart-function' data-tool='function' data-func-mode='standard' data-func-type='quadratic_gen' data-params='{"a":1,"b":0,"c":-5}' fill='none' stroke='#2980b9' stroke-width='2.5' />

---

## 5. 標註、角標與文字 (Markers & Labels)

### 5.1 頂點標籤 (Vertex Label)
用來標示圖形頂點的 A, B, C 等字母，請獨立放置並綁定 data-owner-shape。
<text x='100' y='90' class='shape vertex-label' data-tool='text' data-owner-shape='poly-1' font-size='20' fill='#c0392b' font-weight='bold' text-anchor='middle' dominant-baseline='central'>A</text>

### 5.2 尺寸與長度標註 (Dimension Line / Length)
如果需要繪製帶有輔助線、箭頭或曲線的長度標註：
- data-dim-style：標準直線為 'standard'，曲線為 'curve'，純文字無箭頭為 'text-only'。
<g class='shape group dimension' data-tool='group' data-sub-tool='dimension' data-owner='poly-1' data-dim-style='curve' data-p1-x='100' data-p1-y='100' data-p2-x='300' data-p2-y='100' data-offset='20'>
    <text x='200' y='70' class='shape dimension-text' data-tool='text' font-size='16' fill='#2980b9' font-weight='bold'>10</text>
</g>

### 5.3 角度標記與直角符號 (Angle Mark / Right Angle)
<!-- 弧線度數 -->
<path d='M 120 100 A 20 20 0 0 1 100 120' class='shape mark-path' data-tool='mark' data-owner-shape='poly-1' stroke='#c0392b' stroke-width='1.5' fill='none' />
<text x='130' y='130' class='shape angle-label-text' data-tool='text' data-owner-shape='poly-1' font-size='14' fill='#c0392b' font-weight='bold'>60°</text>

<!-- 直角符號 -->
<polyline points='100,120 120,120 120,100' class='shape mark-path right-angle-mark' data-tool='mark' data-owner-shape='poly-1' stroke='#c0392b' stroke-width='1.5' fill='none' />

### 5.4 邊長等長/平行標記 (Edge Symbol)
若邊上有一撇、兩撇等平行/等長符號：
<path d='M 0 -5 L 0 5' class='shape mark-path' data-tool='mark-edge-symbol' data-owner='poly-1' transform='translate(200, 100) rotate(45)' stroke='#c0392b' stroke-width='2' fill='none' />

### 5.5 真實插圖佔位符 (Image Placeholder)
若遇到無法用單純幾何線條描繪的實物（如河流、車輛、梯子、樹木、紙片圖案），絕對不要嘗試用 SVG 畫出細節。請嚴格使用以下佔位符：
<rect class='shape ai-icon-placeholder' data-icon-type='物品名稱' x='350' y='250' width='100' height='100' fill='none' stroke='none' />

---

## 6. 🚨 動態題型 JavaScript 物件規格 (Dynamic Practice Spec)
動態模式下，你需要建構一個 JavaScript Object 作為題庫的動態樣板，它可以產生出隨機亂數的題目內容與幾何圖形。

**輸出 JSON 格式範例：**
{
  "items": [
    { 
      "type": "dynamic_template", 
      "title": "動態題型一", 
      "scriptCode": "{\n  id: 'template_1',\n  title: '動態題型一',\n  hasAdvanced: false,\n  generateVars: (level) => { ... },\n  questionTpl: (vars) => { ... },\n  drawObjects: (vars) => { ... }\n}" 
    }
  ]
}

### 6.1 核心屬性規範

1.	**坐標系與置中機制 (Auto-Centering)**
	- 請注意：繪圖坐標 cx, cy 預設可直接使用 (0, 0) 為中心來發展圖形。系統底層的 PracticeEngine 會自動計算所有圖形的 Bounding Box，並將其自動置中偏移到對話框的正確位置，因此**不需要**寫死絕對螢幕坐標（如 400, 300）。

2.	**drawObjects 支援的圖形與屬性**
	- 請嚴格使用以下 type 來建構物件陣列：`line`, `circle`, `polygon`, `polyline`, `rect`, `path`, `text`。
	- 屬性規範：支援 stroke, strokeWidth, fill, dash (對應 stroke-dasharray)。若使用 text，其文字內容請放入 text 屬性中，字體大小為 fontSize，文字顏色為 color。

3.	**文字與數學式的渲染**
	- 注意：PracticeEngine 底層會自動為 type: 'text' 的內容加上 $ 符號進行 MathJax 渲染，因此在傳入 text 屬性時，不需要手動外包錢字號。
	- 但在 `questionTpl` (題目文字) 或 `generateChoices` (選擇題選項) 中，請務必使用 `$` 包裝數學變數與公式。

4.	**亂數與整數控制**
	- 為了讓學生好計算，使用 Math.random() 時請務必搭配 Math.floor 或 Math.round 確保產生的變數為漂亮且合理的整數。

### 6.2 完整腳本寫法範例 (scriptCode 內容)

```javascript
{
  id: 'alg_absolute_equation',
  title: '絕對值方程式應用',
  hasAdvanced: true,
  hasLiteracy: true,
  aliases: [],
  generateVars: (level) => {
        const isAdvanced = level === 'advanced';
        const isLiteracy = level === 'literacy';
        const subType = Math.floor(Math.random() * 2) + 1;
        
        if (isLiteracy) {
            // 素養題: 無人車煞車測試
            const h = Math.floor(Math.random() * 50) + 100; 
            const d = Math.floor(Math.random() * 10) + 5;   
            return { vars: { level: 'literacy', type: 1, h, d }, ans: h + d, type: 'input' };
        } else if (!isAdvanced) {
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
        
        if (vars.level === 'literacy') {
            return `某車廠進行智慧無人車的精準煞車測試。在筆直的測試跑道上，設定的「基準目標線」位於坐標 $${vars.h}$ 公尺處。<br>依據測試規範，無人車停止的位置 $x$ 與基準目標線的誤差距離必須剛好等於 $${vars.d}$ 公尺（即 $|x ${formatEq(vars.h)}| = ${vars.d}$）。<br>請問無人車可能停放的位置中，距離起點 (坐標 $0$) <b>最遠</b>的坐標位置是多少？`;
        } else if (vars.level === 'basic') {
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

        if (vars.level === 'literacy') {
            const h = vars.h, d = vars.d;
            const { mapX } = drawAxis(h - d - 5, h + d + 5, Math.max(1, Math.ceil(d / 3)));
            const xC = mapX(h);
            
            // 畫基準目標線 (旗幟或虛線)
            objs.push({ type: 'line', x1: xC, y1: axisY - 8, x2: xC, y2: axisY - 50, stroke: '#27ae60', strokeWidth: 2, dash: '4,4' });
            objs.push({ type: 'polygon', points: `${xC},${axisY-50} ${xC+15},${axisY-45} ${xC},${axisY-40}`, fill: '#27ae60', stroke: 'none' }); 
            objs.push({ type: 'text', x: xC, y: axisY - 65, text: `目標線 ${h}m`, color: '#27ae60', fontSize: 14, fontWeight: 'bold' });
            
            const xL = mapX(h - d);
            const xR = mapX(h + d);
            
            // 無人車示意圖
            objs.push({ type: 'rect', x: xL - 12, y: axisY - 14, width: 24, height: 10, fill: '#e67e22', stroke: '#d35400', strokeWidth: 1.5 });
            objs.push({ type: 'circle', cx: xL - 6, cy: axisY - 4, r: 3, fill: '#333', stroke: 'none' });
            objs.push({ type: 'circle', cx: xL + 6, cy: axisY - 4, r: 3, fill: '#333', stroke: 'none' });
            objs.push({ type: 'text', x: xL, y: axisY - 25, text: "車₁", color: '#e67e22', fontSize: 15, fontWeight: 'bold' });
            
            objs.push({ type: 'rect', x: xR - 12, y: axisY - 14, width: 24, height: 10, fill: '#e67e22', stroke: '#d35400', strokeWidth: 1.5 });
            objs.push({ type: 'circle', cx: xR - 6, cy: axisY - 4, r: 3, fill: '#333', stroke: 'none' });
            objs.push({ type: 'circle', cx: xR + 6, cy: axisY - 4, r: 3, fill: '#333', stroke: 'none' });
            objs.push({ type: 'text', x: xR, y: axisY - 25, text: "車₂", color: '#e67e22', fontSize: 15, fontWeight: 'bold' });
            
            // 誤差距離標示
            objs.push(drawHBrace(xL, axisY - 45, xC - xL, true, '#2980b9'));
            objs.push(drawHBrace(xC, axisY - 45, xR - xC, true, '#2980b9'));
            objs.push({ type: 'text', x: (xL + xC)/2, y: axisY - 65, text: `誤差 ${d}m`, color: '#2980b9', fontSize: 13, fontWeight: 'bold' });
            objs.push({ type: 'text', x: (xC + xR)/2, y: axisY - 65, text: `誤差 ${d}m`, color: '#2980b9', fontSize: 13, fontWeight: 'bold' });
            
        } else if (vars.level === 'basic') {
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