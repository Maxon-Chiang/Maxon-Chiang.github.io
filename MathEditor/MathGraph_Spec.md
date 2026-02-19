# 數學公式繪圖編輯器 (MathGraph) - SVG 元件生成規格書 v1.0

這是一份給 AI 幾何生成引擎的嚴格規格書。本系統使用特製的 SVG 結構與自訂屬性 (`data-*`) 來維持圖形的互動性與關聯性。在生成 JSON 結構的 `svgInner` 內容時，請絕對遵守以下元件的 HTML/SVG 結構規範。

---

## 0. 全域基礎規範 (Global Rules)
1. 必須的 Class：所有可互動的主體物件都必須包含 `class="shape"`。
2. 必須的 Tool 屬性：所有物件都必須有 `data-tool="對應工具名稱"`。
3. ID 綁定：如果標籤、標註、圓心角等附屬物件依附於主體圖形，主體圖形必須有 `id="自訂ID"`，附屬物件透過 `data-owner-shape="自訂ID"` 等屬性進行綁定。

---

## 1. 基本幾何圖形 (Basic Shapes)

### 1.1 直線與線段 (Line / Segment / Ray / Arrow)
- 必須使用 `<g>` 包裝，包含一條隱藏的判定線 (`hit-line`) 與一條可見線 (`visible-line`)。
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
- 必須包裝在 `<foreignObject>` 與 `<div>` 結構中，且 div 內容必須用單反引號包住。

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

## 4. 複合與連動幾何 (Advanced Constructs)

### 4.1 圓心角 / 圓周角 / 弦切角 (Circle Angles)
- 必須有一個主體 `<ellipse>` 帶 ID。
- 群組必須有 `data-owner-circle-id="主體圓ID"`。
- 必須包含對應數量的 `<circle class="vertex-data">` 作為隱藏的控制把手。

<!-- 主體圓 -->
<ellipse id="circle-obj-1" cx="400" cy="300" rx="150" ry="150" class="shape" data-tool="ellipse" data-sub-tool="circle" fill="none" stroke="#000" />

<!-- 圓心角群組 -->
<g class="shape group" data-tool="group" data-sub-tool="central-angle" data-owner-circle-id="circle-obj-1">
    <circle class="vertex-data" cx="400" cy="300" data-index="0" style="display:none;"></circle>
    <circle class="vertex-data" cx="550" cy="300" data-index="1" style="display:none;"></circle>
    <circle class="vertex-data" cx="400" cy="150" data-index="2" style="display:none;"></circle>
    <line class="visible-line" x1="400" y1="300" x2="550" y2="300" stroke="#1abc9c" stroke-width="2" />
    <line class="visible-line" x1="400" y1="300" x2="400" y2="150" stroke="#1abc9c" stroke-width="2" />
</g>


### 4.2 內心 / 外心 / 重心 (Triangle Centers)
- 綁定對應的三角形 ID。

<g class="shape group construction-obj" data-tool="group" data-construction-type="incenter" data-owner-shape="poly-1">
    <circle cx="200" cy="180" r="4" fill="#2c3e50" stroke="none" />
    <circle cx="200" cy="180" r="50" stroke="#27ae60" stroke-dasharray="4,4" fill="none" />
</g>


---

## 5. 函數圖形與立體圖形 (Smart Functions & Solids)

### 5.1 標準函數 (Standard Function)
- 必須具備 `data-func-mode="standard"` 與對應的參數 JSON。

<path class="shape smart-function" data-tool="function" data-func-mode="standard" data-func-type="quadratic_gen" data-params="{&quot;a&quot;:1,&quot;b&quot;:0,&quot;c&quot;:-5}" d="M..." fill="none" stroke="#2980b9" stroke-width="2.5" />


### 5.2 立體圖形 (Solids - Cube)
- 包含 3D 空間數學參數 (`data-x, data-w, data-dx` 等) 以及兩條路徑 (可見線與隱藏虛線)。

<g class="shape" data-tool="solid" data-sub-tool="solid-cube" data-x="200" data-y="300" data-w="100" data-h="100" data-dx="40" data-dy="-40">
    <path class="solid-visible" d="M..." stroke="#000" fill="none" />
    <path class="solid-hidden" d="M..." stroke="#000" stroke-dasharray="4,4" fill="none" />
</g>