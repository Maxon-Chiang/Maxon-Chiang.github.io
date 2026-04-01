# Math Formula & Graphic Editor (MathGraph) - SVG Component Generation Specification v2.0

This is a strict specification document for the AI geometry generation engine. This system uses custom SVG structures and custom attributes (`data-*`) to maintain the interactivity and relationships of the graphics. When generating the content for the `svgInner` field in the JSON structure, you must strictly adhere to the HTML/SVG structural specifications for the components below.

---

## 0. 🚨 Global Strict Rules & Prohibitions
1. **Prohibit nested `<svg>` tags:** The `svgInner` field must only contain internal geometric elements (e.g., `<g>`, `<polygon>`, `<path>`, etc.). It must absolutely not contain `<svg>` start and end tags, as this will break the editor's coordinate system.
2. **Prohibit arbitrary `<g transform="...">` for layout:** You must directly calculate and provide "absolute coordinates" for all geometric shapes (calculated based on an 800x600 viewport). Absolutely do not use an outer `<g>` to translate the entire figure, as this will cause a "double translation error" for internal text labels.
3. **Required Class:** All interactive main objects must include `class="shape"`.
4. **Required Tool Attribute:** All objects must have a `data-tool="corresponding_tool_name"`.
5. **Legal Grouping:** If multiple objects need to be grouped, the `<g>` tag must have `class="shape group" data-tool="group"`.
6. **ID Binding:** If labels, markers, central angles, etc., are attached to a main shape, the main shape must have an `id="custom_id"`, and the attached object is bound via `data-owner-shape="custom_id"`.

---

## 1. Basic Shapes

### 1.1 Line / Segment / Ray / Arrow
- Must be wrapped in a `<g>`, containing a hidden hit-line and a visible-line to solve the issue of thin lines being unclickable.
- If there's an arrowhead, add it to the `visible-line`.

<g class="shape group" data-tool="line" data-sub-tool="line-simple" id="line-1">
    <line x1="100" y1="100" x2="300" y2="100" class="hit-line" stroke="transparent" stroke-width="10" />
    <line x1="100" y1="100" x2="300" y2="100" class="visible-line" stroke="#000000" stroke-width="2" marker-end="url(#arrow-end)" />
</g>


### 1.2 Polygon / Triangle / Quadrilateral

<polygon points="100,100 200,100 150,50" class="shape" data-tool="polygon" data-sub-tool="tri-iso" fill="none" stroke="#000000" stroke-width="2" id="poly-1" />


### 1.3 Circle / Ellipse

<ellipse cx="200" cy="200" rx="100" ry="100" class="shape" data-tool="ellipse" data-sub-tool="circle" fill="none" stroke="#000" stroke-width="2" id="circle-1" />


### 1.4 Sector / Arc
- Must include mathematical data attributes for center point, radius, and angles.

<path d="M 200 200 L 300 200 A 100 100 0 0 0 250 113 Z" class="shape" data-tool="ellipse" data-sub-tool="sector" data-center-x="200" data-center-y="200" data-radius="100" data-start-angle="0" data-end-angle="1.047" fill="rgba(41,128,185,0.2)" stroke="#000" id="sector-1" />


---

## 2. Text & Math Formulas

### 2.1 Math Formula (MathJax AsciiMath) - Most Important
- LaTeX is forbidden. You must use pure AsciiMath syntax (fractions `a/b`, square roots `sqrt(x)`, systems of equations `{(eq1),(eq2):}`).
- Must be wrapped in a `<foreignObject>` and `<div class="math-content">` structure, and the div content must be enclosed in single backticks.

<foreignObject x="150" y="100" width="120" height="50" class="shape math-obj" data-tool="math" data-content="{(x+y=5),(x-y=1):}">
    <div xmlns="http://www.w3.org/1999/xhtml" class="math-content" style="font-size:24px; color:#000000;">
        `{(x+y=5),(x-y=1):}`
    </div>
</foreignObject>


### 2.2 Plain Text

<text x="150" y="100" class="shape" data-tool="text" font-size="24" fill="#000" text-anchor="middle" dominant-baseline="central">Plain text content</text>


---

## 3. Markers & Dimensions

### 3.1 Vertex Label
- Must be bound to the main shape.

<text x="100" y="90" class="shape vertex-label" data-tool="text" data-owner-shape="poly-1" font-size="20" fill="#c0392b" font-weight="bold" text-anchor="middle" dominant-baseline="central">A</text>


### 3.2 Dimension Line
- Includes dashed extension lines, a double-arrowed dimension line, and centered text.

<g class="shape group dimension" data-tool="group" data-sub-tool="dimension" data-owner="poly-1" data-dependency-type="dimension">
    <line x1="10" y1="10" x2="10" y2="50" class="dimension-line" style="stroke-dasharray:2,2; fill:none;" stroke="#2980b9" />
    <line x1="100" y1="10" x2="100" y2="50" class="dimension-line" style="stroke-dasharray:2,2; fill:none;" stroke="#2980b9" />
    <path d="M 10 30 L 100 30" style="stroke-dasharray: 4,2; fill:none;" stroke="#2980b9"/>
    <text x="55" y="25" transform="rotate(0)">10cm</text>
</g>


### 3.3 Angle Mark

<path d="M 120 100 A 20 20 0 0 1 100 120" class="shape mark-path" data-tool="mark" data-owner-angle-shape="poly-1" stroke="#c0392b" stroke-width="1.5" fill="none" />
<text x="130" y="130" class="shape vertex-label" data-tool="text" data-owner-angle-shape="poly-1">60°</text>


### 3.4 Edge Symbol (Equal Length / Parallel)
- `data-edge-index` specifies which edge of the main shape it applies to.

<path d="M 0 -5 L 0 5" class="shape mark-path" data-tool="mark-edge-symbol" data-owner="poly-1" data-edge-index="0" data-dependency-type="edge_mark" transform="translate(150, 100) rotate(45)" stroke="#c0392b" stroke-width="2" fill="none" />


---

## 4. Functions & Axes

### 4.1 Standard Function
- Must have `data-func-mode="standard"` and the corresponding parameters JSON.

<path class="shape smart-function" data-tool="function" data-func-mode="standard" data-func-type="quadratic_gen" data-params="{&quot;a&quot;:1,&quot;b&quot;:0,&quot;c&quot;:-5}" d="M..." fill="none" stroke="#2980b9" stroke-width="2.5" />