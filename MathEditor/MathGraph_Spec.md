# 數學公式繪圖編輯器 (MathGraph) - SVG 元件生成規格書 v1.3

這是一份給 AI 幾何生成引擎的嚴格規格書。本系統使用特製的 SVG 結構與自訂屬性 (`data-*`) 來維持圖形的互動性與關聯性。在生成 JSON 結構的 `svgInner` 內容時，請絕對遵守以下元件的 HTML/SVG 結構規範。

---

## 🟢 0. 全域基礎規範 (Global Rules)
1. 必須的 Class：所有可互動的主體物件都必須包含 `class="shape"`。
2. 必須的 Tool 屬性：所有物件都必須有 `data-tool="對應工具名稱"`，有時需搭配 `data-sub-tool`。
3. ID 綁定：如果標籤、標註、圓心角等附屬物件依附於主體圖形，主體圖形必須有 `id="自訂ID"`，附屬物件透過 `data-owner-shape="自訂ID"` 等屬性進行綁定。
4. 強制透明 (無填滿)：為了不阻擋滑鼠點擊內部線條，所有圖形（如 `<ellipse>`, `<polygon>`, `<path>` 等）預設必須加上 `fill="none"`，除非題目明確要求塗色。

---

## 🟢 1. 基本幾何圖形 (Basic Shapes)

### 1.1 直線與線段 (Line / Segment / Ray / Arrow)
- 必須使用 `<g>` 包裝，包含一條隱藏的判定線 (`hit-line`) 與一條可見線 (`visible-line`)。

<g class="shape group" data-tool="line" data-sub-tool="line-simple" id="line-1">
    <line x1="100" y1="100" x2="300" y2="100" class="hit-line" stroke="transparent" stroke-width="10" />
    <line x1="100" y1="100" x2="300" y2="100" class="visible-line" stroke="#000000" stroke-width="2" marker-end="url(#arrow-end)" />
</g>

### 1.2 多邊形 (Polygon / Triangle / Quadrilateral)

<polygon points="100,100 200,100 150,50" class="shape" data-tool="polygon" data-sub-tool="tri-iso" fill="none" stroke="#000000" stroke-width="2" id="poly-1" />

### 1.3 圓形與橢圓 (Circle / Ellipse)

<ellipse cx="200" cy="200" rx="100" ry="100" class="shape" data-tool="ellipse" data-sub-tool="circle" fill="none" stroke="#000" stroke-width="2" id="circle-1" />

### 1.4 扇形與圓弧 (Sector / Arc)

<path d="M 200 200 L 300 200 A 100 100 0 0 0 250 113 Z" class="shape" data-tool="ellipse" data-sub-tool="sector" data-center-x="200" data-center-y="200" data-radius="100" data-start-angle="0" data-end-angle="1.047" fill="none" stroke="#000" id="sector-1" />

---

## 🟢 2. 文字與數學公式 (Text & Math)

### 2.1 數學公式 (MathJax AsciiMath) - 最重要
- 禁用 LaTeX，必須使用純 AsciiMath 語法。必須包裝在 `<foreignObject>` 結構中，且 div 內容必須用單反引號 ` 包住。

<foreignObject x="150" y="100" width="120" height="50" class="shape math-obj" data-tool="math" data-content="{(x+y=5),(x-y=1):}">
    <div xmlns="http://www.w3.org/1999/xhtml" class="math-content" style="font-size:24px; color:#000000;">
        `{(x+y=5),(x-y=1):}`
    </div>
</foreignObject>

### 2.2 純文字 (Text)

<text x="150" y="100" class="shape" data-tool="text" font-size="24" fill="#000" text-anchor="middle" dominant-baseline="central">純文字內容</text>

---

## 🟢 3. 標註與尺寸 (Markers & Dimensions)

### 3.1 角度標記 (Angle Mark) - 【極重要：雙向綁定】
若要畫出角度弧線與文字，父圖形必須加上 `data-angle-label-ids="弧線ID,文字ID"`。

<!-- 父圖形 (必須登記附屬的標籤 IDs) -->
<polygon id="poly-2" data-angle-label-ids="arc-1,txt-1" points="100,100 200,100 150,50" class="shape" data-tool="polygon" fill="none" stroke="#000" />

<path id="arc-1" data-owner-angle-shape="poly-2" d="M 120 100 A 20 20 0 0 1 100 120" class="shape mark-path" data-tool="mark" stroke="#c0392b" stroke-width="1.5" fill="none" />
<text id="txt-1" data-owner-angle-shape="poly-2" x="130" y="130" class="shape vertex-label" data-tool="text">60°</text>

### 3.2 尺寸標註線 (Dimension Line)
<g class="shape group dimension" data-tool="group" data-sub-tool="dimension" data-owner="poly-1" data-dependency-type="dimension">
    <line x1="10" y1="10" x2="10" y2="50" class="dimension-line" style="stroke-dasharray:2,2; fill:none;" stroke="#2980b9" />
    <line x1="100" y1="10" x2="100" y2="50" class="dimension-line" style="stroke-dasharray:2,2; fill:none;" stroke="#2980b9" />
    <path d="M 10 30 L 100 30" style="stroke-dasharray: 4,2; fill:none;" stroke="#2980b9"/>
    <text x="55" y="25" transform="rotate(0)">10cm</text>
</g>

### 3.3 邊長等長/平行標記 (Edge Symbol)
<path d="M 0 -5 L 0 5" class="shape mark-path" data-tool="mark-edge-symbol" data-owner="poly-1" data-edge-index="0" data-dependency-type="edge_mark" transform="translate(150, 100) rotate(45)" stroke="#c0392b" stroke-width="2" fill="none" />

---

## 🟢 4. 複合與連動幾何 (Advanced Constructs)

### 4.1 圓心角 / 圓周角 (Circle Angles)
<!-- 主體圓 -->
<ellipse id="circle-obj-1" cx="400" cy="300" rx="150" ry="150" class="shape" data-tool="ellipse" data-sub-tool="circle" fill="none" stroke="#000" />

<!-- 圓心角群組 -->
<g class="shape group" data-tool="group" data-sub-tool="central-angle" id="ca-1" data-owner-circle-id="circle-obj-1" data-angle-label-ids="arc-ca,txt-ca">
    <circle class="vertex-data" cx="400" cy="300" data-index="0" style="display:none;"></circle>
    <circle class="vertex-data" cx="550" cy="300" data-index="1" style="display:none;"></circle>
    <circle class="vertex-data" cx="400" cy="150" data-index="2" style="display:none;"></circle>
    <line class="visible-line" x1="400" y1="300" x2="550" y2="300" stroke="#1abc9c" stroke-width="2" />
    <line class="visible-line" x1="400" y1="300" x2="400" y2="150" stroke="#1abc9c" stroke-width="2" />
</g>

<!-- 附屬的圓心角標示 -->
<path id="arc-ca" data-owner-angle-shape="ca-1" d="..." class="shape mark-path" data-tool="mark" stroke="#ab473e" stroke-width="2" fill="none" />
<text id="txt-ca" data-owner-angle-shape="ca-1" x="..." y="..." class="shape vertex-label" data-tool="text">62°</text>

---

## 🟢 5. 函數圖形與立體圖形 (Smart Functions & Solids)

### 5.1 立體圖形 (Solids) - 【屬性座標嚴格定義】
必須包含 3D 空間數學參數，這些參數與系統把手絕對綁定，SVG 畫布 Y 軸向下增長，請嚴格遵守：
- **長方體 (`solid-cube`)**：
  - `data-x`, `data-y`：絕對是**正面矩形的「左上角(Top-Left)」**座標！(切勿設為左下角)
  - `data-w`, `data-h`：正面矩形的寬度與高度。
  - `data-dx`, `data-dy`：後方面相對於正前面的偏移量 (向右上後方延伸時 dy 為負值)。
- **圓柱 (`solid-cylinder`)**：
  - `data-cx`, `data-cy`：**頂部**圓面的中心座標。
  - `data-r`, `data-h`：底面半徑與柱體高度。
- **圓錐 (`solid-cone`)**：
  - `data-cx`, `data-cy`：**頂部尖端(Apex)**的座標。
  - `data-r`, `data-h`：底面半徑與錐體高度。

<g class="shape" data-tool="solid" data-sub-tool="solid-cube" data-x="250" data-y="150" data-w="250" data-h="350" data-dx="80" data-dy="-80">
    <path class="solid-visible" d="M 250 150 L 500 150 L 500 500 L 250 500 Z M 500 150 L 580 70 L 580 420 L 500 500 M 250 150 L 330 70 L 580 70" stroke="#000" fill="none" />
    <path class="solid-hidden" d="M 250 500 L 330 420 L 580 420 M 330 420 L 330 70" stroke="#000" stroke-dasharray="4,4" fill="none" />
</g>

### 5.2 標準函數 (Standard Function)
<path class="shape smart-function" data-tool="function" data-func-mode="standard" data-func-type="quadratic_gen" data-params="{&quot;a&quot;:1,&quot;b&quot;:0,&quot;c&quot;:-5}" d="M..." fill="none" stroke="#2980b9" stroke-width="2.5" />
