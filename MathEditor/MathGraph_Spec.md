# 數學公式繪圖編輯器 (MathGraph) - SVG 元件生成規格書 v2.0

這是一份給 AI 幾何生成引擎的嚴格規格書。本系統使用特製的 SVG 結構與自訂屬性 (`data-*`) 來維持圖形的互動性與關聯性。在生成 JSON 結構的 `svgInner` 內容時，請絕對遵守以下元件的 HTML/SVG 結構規範。

---

## 0. 🚨 全域基礎規範與嚴格禁止事項 (Global Strict Rules)
1. **嚴禁嵌套 `<svg>` 標籤：** `svgInner` 欄位只能包含內部的幾何元素（如 `<g>`, `<polygon>`, `<path>` 等）。絕對不可以包含 `<svg>` 開頭與結尾標籤，否則會破壞編輯器座標系。
2. **嚴禁使用任意的 `<g transform="...">` 進行排版：** 請直接計算並給予所有幾何圖形「絕對坐標」（以 800x600 視窗為基準計算）。絕對不可用外層 `<g>` 來平移整個圖形，這會導致內部文字標籤產生「雙重位移錯誤」。
3. **必須的 Class：** 所有可互動的主體物件都必須包含 `class="shape"`。
4. **必須的 Tool 屬性：** 所有物件都必須有 `data-tool="對應工具名稱"`。
5. **合法的群組化 (Group)：** 若需將多個物件群組，該 `<g>` 標籤必須具備 `class="shape group" data-tool="group"`。
6. **ID 綁定：** 如果標籤、標註、圓心角等附屬物件依附於主體圖形，主體必須有 `id="自訂ID"`，附屬物件透過 `data-owner-shape="自訂ID"` 進行綁定。

---

## 1. 基本幾何圖形 (Basic Shapes)

### 1.1 直線與線段 (Line / Segment / Ray / Arrow)
- 必須使用 `<g>` 包裝，包含一條隱藏的判定線 (`hit-line`) 與一條可見線 (`visible-line`)，解決線條太細無法點擊的問題。
- 若有箭頭，加在 `visible-line` 上。

<g class="shape group" data-tool="line" data-sub-tool="line-simple" id="line-1">
    <line x1="100" y1="100" x2="300" y2="100" class="hit-line" stroke="transparent" stroke-width="10" />
    <line x1="100" y1="100" x2="300" y2="100" class="visible-line" stroke="#000000" stroke-width="2" marker-end="url(#arrow-end)" />
</g>


### 1.2 多邊形 (Polygon / Triangle / Quadrilateral)

<polygon points="100,100 200,100 150,50" class="shape" data-tool="polygon" data-sub-tool="tri-iso" fill="none" stroke="#000000" stroke-width="2" id="poly-1" />


### 1.3 圓形與橢圓 (Circle / Ellipse)

<ellipse cx="200" cy="200" rx="100" ry="100" class="shape" data-tool="ellipse" data-sub-tool="circle" fill="none" stroke="#000" stroke-width="2" id="circle-1" />


### 1.4 扇形與圓弧 (Sector / Arc)
- 必須包含中心點與半徑、角度的數學數據屬性。

<path d="M 200 200 L 300 200 A 100 100 0 0 0 250 113 Z" class="shape" data-tool="ellipse" data-sub-tool="sector" data-center-x="200" data-center-y="200" data-radius="100" data-start-angle="0" data-end-angle="1.047" fill="rgba(41,128,185,0.2)" stroke="#000" id="sector-1" />


---

## 2. 文字與數學公式 (Text & Math)

### 2.1 數學公式 (MathJax AsciiMath) - 最重要
- 禁用 LaTeX，必須使用純 AsciiMath 語法（分號 `a/b`、根號 `sqrt(x)`、聯立 `{(eq1),(eq2):}`）。
- 必須包裝在 `<foreignObject>` 與 `<div class="math-content">` 結構中，且 div 內容必須用單反引號包住。

<foreignObject x="150" y="100" width="120" height="50" class="shape math-obj" data-tool="math" data-content="{(x+y=5),(x-y=1):}">
    <div xmlns="http://www.w3.org/1999/xhtml" class="math-content" style="font-size:24px; color:#000000;">
        `{(x+y=5),(x-y=1):}`
    </div>
</foreignObject>


### 2.2 純文字 (Text)

<text x="150" y="100" class="shape" data-tool="text" font-size="24" fill="#000" text-anchor="middle" dominant-baseline="central">純文字內容</text>


---

## 3. 標註與尺寸 (Markers & Dimensions)

### 3.1 頂點標籤 (Vertex Label)
- 必須綁定主體形狀。

<text x="100" y="90" class="shape vertex-label" data-tool="text" data-owner-shape="poly-1" font-size="20" fill="#c0392b" font-weight="bold" text-anchor="middle" dominant-baseline="central">A</text>


### 3.2 尺寸標註線 (Dimension Line)
- 包含虛線延伸線與帶箭頭的雙向尺寸線及置中文字。

<g class="shape group dimension" data-tool="group" data-sub-tool="dimension" data-owner="poly-1" data-dependency-type="dimension">
    <line x1="10" y1="10" x2="10" y2="50" class="dimension-line" style="stroke-dasharray:2,2; fill:none;" stroke="#2980b9" />
    <line x1="100" y1="10" x2="100" y2="50" class="dimension-line" style="stroke-dasharray:2,2; fill:none;" stroke="#2980b9" />
    <path d="M 10 30 L 100 30" style="stroke-dasharray: 4,2; fill:none;" stroke="#2980b9"/>
    <text x="55" y="25" transform="rotate(0)">10cm</text>
</g>


### 3.3 角度標記 (Angle Mark)

<path d="M 120 100 A 20 20 0 0 1 100 120" class="shape mark-path" data-tool="mark" data-owner-angle-shape="poly-1" stroke="#c0392b" stroke-width="1.5" fill="none" />
<text x="130" y="130" class="shape vertex-label" data-tool="text" data-owner-angle-shape="poly-1">60°</text>


### 3.4 邊長等長/平行標記 (Edge Symbol)
- `data-edge-index` 指定作用於主體的哪一條邊。

<path d="M 0 -5 L 0 5" class="shape mark-path" data-tool="mark-edge-symbol" data-owner="poly-1" data-edge-index="0" data-dependency-type="edge_mark" transform="translate(150, 100) rotate(45)" stroke="#c0392b" stroke-width="2" fill="none" />


---

## 4. 函數與坐標系 (Functions & Axes)

### 4.1 標準函數 (Standard Function)
- 必須具備 `data-func-mode="standard"` 與對應的參數 JSON。

<path class="shape smart-function" data-tool="function" data-func-mode="standard" data-func-type="quadratic_gen" data-params="{&quot;a&quot;:1,&quot;b&quot;:0,&quot;c&quot;:-5}" d="M..." fill="none" stroke="#2980b9" stroke-width="2.5" />
