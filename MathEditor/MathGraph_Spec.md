# 數學公式繪圖編輯器 (MathGraph) - SVG 元件生成規格書 v3.5

這是一份給 AI 幾何生成引擎的嚴格規格書。本系統內建強大的高階數學組件，請優先使用系統定義的 data-tool 與 data-sub-tool 屬性來生成圖形，以保留圖形的互動性與可編輯性。

---

## 0. 🚨 JSON 輸出結構與文字規範 (Data Format Rules)
系統預期接收一個 JSON 物件，裡面包含 items 陣列，每個 item 代表一個頁面或一題：
{
  "items": [
    {
      "title": "題號或標題",
      "questionText": "數學與幾何符號必須使用 $ 包裝。LaTeX 指令必須雙重跳脫，例如 $\\triangle ABC$ 或 $\\angle A$。換行請使用 \\n",
      "svgInner": "這裡填寫真正的 SVG 幾何圖形原始碼，絕對不能只填純文字！"
    }
  ]
}

JSON 內嵌 SVG 的極度重要限制：
在 svgInner 屬性中的所有 HTML/SVG 屬性，強制使用單引號 (')，以防止破壞 JSON 結構。例如：class='shape'。
(若屬性值本身是 JSON 字串，請使用單引號包裝外部，內部維持雙引號，例如：data-params='{"a":1,"b":0}')。

---

## 1. 🚨 全域作圖黃金法則 (Global Strict Rules)
1. 嚴禁嵌套 <svg> 標籤： svgInner 欄位只能包含內部的幾何元素。絕對不可以包含 <svg> 標籤。
2. 絕對坐標定位： 畫布基準尺寸為 800x600 (中心點為 400,300)。請直接給予所有圖形絕對坐標，嚴禁在最外層使用 <g transform="..."> 進行排版平移。
3. 必須的 Class： 所有可互動的主體物件都必須包含 class='shape'。
4. 必須的 Tool 屬性： 所有物件都必須有 data-tool='對應工具名稱'。
5. 合法的群組化 (Group)： 若需將多個物件打包成群組 (如長度標註、立體圖)，該 <g> 標籤必須具備 class='shape group' data-tool='group'。
6. ID 綁定與關聯： 如果標籤、角度標註等附屬物件依附於主體圖形，主體圖形必須加上 id='自訂ID'，附屬物件則必須透過 data-owner-shape='自訂ID' 進行綁定。
7. 強制無填滿： 除非特別要求，所有平面幾何圖形強制設定 fill='none'、stroke='#000000'、stroke-width='2'。

---

## 2. 基礎幾何圖形 (2D Basic Shapes)

### 2.1 直線與線段 (Line / Segment)
必須使用 <g> 包裝，包含隱藏判定線 (hit-line) 與可見線 (visible-line)。
<g class='shape group' data-tool='line' data-sub-tool='line-simple' id='line-1'>
    <line x1='100' y1='100' x2='300' y2='100' class='hit-line' stroke='transparent' stroke-width='10' />
    <line x1='100' y1='100' x2='300' y2='100' class='visible-line' stroke='#000000' stroke-width='2' />
</g>

### 2.2 數線與箭頭 (Number Line / Arrow)
若題目為「單純的數線」或需要「箭頭」，請直接畫線並加上 marker-end='url(#arrow-end)'，不要呼叫 axes-system。
<g class='shape group' data-tool='line' data-sub-tool='line-end' id='line-2'>
    <line x1='100' y1='300' x2='700' y2='300' class='hit-line' stroke='transparent' stroke-width='10' />
    <line x1='100' y1='300' x2='700' y2='300' class='visible-line' stroke='#000000' stroke-width='2' marker-end='url(#arrow-end)' />
</g>
<!-- 數線上的點 -->
<circle cx='400' cy='300' r='4' class='shape' data-tool='point' fill='#000000' stroke='none' />

### 2.3 多邊形 (Polygon / Triangle / Quadrilateral)
禁止用零碎的 <line> 畫多邊形，必須用 <polygon>。
<polygon points='100,100 200,100 150,50' class='shape' data-tool='polygon' fill='none' stroke='#000000' stroke-width='2' id='poly-1' />

### 2.4 圓形與扇形 (Circle / Sector)
扇形必須包含數學數據屬性。
<ellipse cx='200' cy='200' rx='100' ry='100' class='shape' data-tool='ellipse' data-sub-tool='circle' fill='none' stroke='#000000' stroke-width='2' id='circle-1' />

<path d='M 200 200 L 300 200 A 100 100 0 0 0 250 113 Z' class='shape' data-tool='ellipse' data-sub-tool='sector' data-center-x='200' data-center-y='200' data-radius='100' data-start-angle='0' data-end-angle='1.047' fill='none' stroke='#000000' />

---

## 3. 進階圖形與座標系 (高階組件優先)
若題目出現立體圖形、座標平面或函數，絕對禁止自己用線條慢慢畫！請務必使用下列系統內建的高階組件：

### 3.1 3D 立體圖形 (Solid 3D Shapes)
系統支援 solid-cube(正方/長方體), solid-cylinder(圓柱), solid-cone(圓錐), solid-pyramid(四角錐), solid-prism(三角柱)。
只需給定中心點與長寬高等數值，系統匯入後會自動描繪 3D 線條。
<!-- 圓柱體範例：cx,cy為中心，r為半徑，h為高 -->
<g class='shape group' data-tool='solid' data-sub-tool='solid-cylinder' data-cx='400' data-cy='300' data-r='50' data-h='150'></g>
<!-- 長方體/直角柱範例：cx,cy為中心，w為寬，h為高，d為深 -->
<g class='shape group' data-tool='solid' data-sub-tool='solid-cube' data-cx='400' data-cy='300' data-w='100' data-h='100' data-d='100'></g>

### 3.2 XY 坐標平面 (Coordinate Plane)
<g class='shape axes-system' data-tool='group' data-type='xy' data-range='10' data-minor='1' data-major='5' data-label='5' data-show-grid='false'></g>

### 3.3 數學函數圖形 (Standard Functions)
給定參數 JSON，系統會自動描繪完美的函數曲線。
<!-- 二次函數 y = ax^2 + bx + c -->
<path class='shape smart-function' data-tool='function' data-func-mode='standard' data-func-type='quadratic_gen' data-params='{"a":1,"b":0,"c":-5}' fill='none' stroke='#2980b9' stroke-width='2.5' />

---

## 4. 標註、角標與文字 (Markers & Labels)

### 4.1 頂點標籤 (Vertex Label)
用來標示圖形頂點的 A, B, C 等字母，請獨立放置並綁定 data-owner-shape。
<text x='100' y='90' class='shape vertex-label' data-tool='text' data-owner-shape='poly-1' font-size='20' fill='#c0392b' font-weight='bold' text-anchor='middle' dominant-baseline='central'>A</text>

### 4.2 尺寸與長度標註 (Dimension Line / Length)
如果需要繪製帶有輔助線、箭頭或曲線的長度標註：
- data-dim-style：標準直線為 'standard'，曲線為 'curve'，純文字無箭頭為 'text-only'。
<g class='shape group dimension' data-tool='group' data-sub-tool='dimension' data-owner='poly-1' data-dim-style='curve' data-p1-x='100' data-p1-y='100' data-p2-x='300' data-p2-y='100' data-offset='20'>
    <text x='200' y='70' class='shape dimension-text' data-tool='text' font-size='16' fill='#2980b9' font-weight='bold'>10</text>
</g>

### 4.3 角度標記與直角符號 (Angle Mark / Right Angle)
<!-- 弧線度數 -->
<path d='M 120 100 A 20 20 0 0 1 100 120' class='shape mark-path' data-tool='mark' data-owner-shape='poly-1' stroke='#c0392b' stroke-width='1.5' fill='none' />
<text x='130' y='130' class='shape angle-label-text' data-tool='text' data-owner-shape='poly-1' font-size='14' fill='#c0392b' font-weight='bold'>60°</text>

<!-- 直角符號 -->
<polyline points='100,120 120,120 120,100' class='shape mark-path right-angle-mark' data-tool='mark' data-owner-shape='poly-1' stroke='#c0392b' stroke-width='1.5' fill='none' />

### 4.4 邊長等長/平行標記 (Edge Symbol)
若邊上有一撇、兩撇等平行/等長符號：
<path d='M 0 -5 L 0 5' class='shape mark-path' data-tool='mark-edge-symbol' data-owner='poly-1' transform='translate(200, 100) rotate(45)' stroke='#c0392b' stroke-width='2' fill='none' />

---

## 5. 複雜插圖與實物處理 (極度重要)
若遇到無法用單純幾何線條描繪的實物（如河流、車輛、樹木、實際物品），絕對不要嘗試用 SVG 畫出細節。請嚴格使用以下佔位符：
<rect class='shape ai-icon-placeholder' data-icon-type='物品名稱' x='350' y='250' width='100' height='100' fill='none' stroke='none' />