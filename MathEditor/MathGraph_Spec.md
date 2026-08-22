數學公式繪圖編輯器 (MathGraph) - 全能 AI 生成規格書 v4.0

這是一份給 AI 數學幾何生成與排版引擎的嚴格規格書。本系統同時支援「動態互動題型 (Dynamic Script)」與「靜態精確排版 (Static Layout，如 A4 學習單、講義、圖形素材)」。當使用者要求出「講義」或「學習單」時，請務必採用「靜態精確排版模式」，輸出包含 SVG 的 JSON 格式。

=====================================================================
第一部分：全域通用規則 (Global Strict Rules)
=====================================================================
1. SVG 座標系：X 軸向右為正，Y 軸向下為正。原點 (0,0) 在左上角。
2. 幾何精確定位：所有繪圖請務必基於嚴謹的數學計算（如三角函數、畢氏定理）給出精確坐標，切勿目測瞎猜。
3. 數學式包裝與跳脫：所有的數學公式、英文字母、變數，必須用 $ 符號包裝（觸發 MathJax 渲染）。LaTeX 指令必須雙重跳脫，例如 \\triangle ABC 或 \\angle A。
4. 佔位符 (Placeholder)：若遇到無法用單純幾何線條描繪的實物（如河流、車輛、樹木），嚴禁用多條線條刻畫細節，請嚴格使用以下佔位符：
   <rect class='shape ai-icon-placeholder' data-icon-type='物品名稱' x='350' y='250' width='100' height='100' fill='none' stroke='none' />

=====================================================================
第二部分：輸出模式總覽 (Output JSON Format)
=====================================================================
系統預期接收一個包含 items 陣列的 JSON 物件。請只輸出一個乾淨的 JSON 物件。

【模式 A：動態互動題型 (Dynamic Practice)】
適用於：要求產生可以隨機變動數字的互動選擇題、填空題。
{
  "type": "MathEditor_Questions_Backup",
  "items": [
    { 
      "type": "dynamic_template", 
      "title": "題型名稱", 
      "scriptCode": "{\n  id: 'temp_01',\n  title: '題型名稱',\n  hasAdvanced: false,\n  generateVars: (level) => { ... },\n  questionTpl: (vars) => { ... },\n  drawObjects: (vars) => { ... },\n  explanationTpl: (vars) => { ... }\n}" 
    }
  ]
}

【模式 B：靜態學習單 / 講義排版 / 圖形素材 (Static Layout & SVG)】
適用於：要求設計A4講義、學習單、或產生單純不變動的精確幾何圖形/考卷。
請務必依據題目要求判斷並回傳正確的畫布寬高 (`canvasWidth`, `canvasHeight`)。例如 A4直向為 794x1123，A4橫向為 1123x794。
{
  "type": "MathEditor_Questions_Backup",
  "canvasWidth": 794,
  "canvasHeight": 1123,
  "items": [
    {
      "title": "講義標題或題號",
      "category": "未分類",
      "tags": [],
      "questionText": "若為單題可填此處(支援 $數學式$ 與 \\n 換行)。若為全頁講義排版，文字也可直接寫入下方的 illustrationSvg 中使用 foreignObject 排版。",
      "illustrationSvg": "這裡填寫真正的 SVG 幾何圖形與 foreignObject 文字方塊原始碼。"
    }
  ]
}

=====================================================================
第三部分：模式 B 的 A4 精確排版與坐標繪圖規範 (A4 Layout Rules)
=====================================================================
當被要求製作「學習單」或「講義」時，請把幾何內容寫入 illustrationSvg 屬性中，並遵守以下精確排版法則：

1. 畫布尺寸與邊距：
   A4 直式畫布基準為寬度 794，高度 1123。
   建議安全邊距：左 50，右 50，上 50，下 50。(可使用寬度為 694 的文字方塊)。

2. 絕對坐標精確定位 (極度重要)：
   請直接給予所有圖形與文字絕對坐標 (x, y)，嚴禁在最外層使用 <g transform="..."> 進行平移排版。
   例如第一題在 y='100'，第二題在 y='400'，請直接計算好每個圖形與文字的絕對 x,y 座標並填入。

3. 文字排版與外框一體化 (Text Box Layout & Border Integration - 極度重要)：
   為了防止文字超出背景框，**絕對禁止使用獨立的 `<rect>` 來畫文字的背景！**
   請直接在 `<foreignObject>` 標籤上使用以下屬性來定義外框與底色，系統會自動讓框線完美包覆文字：
   - `data-bg-color`: 背景顏色 (例如 '#f9f9f9' 或 'none')
   - `data-border-color`: 框線顏色 (例如 '#34495e' 或 'transparent')
   - `data-border-width`: 框線粗細 (整數，如 '2')
   - `data-border-style`: 框線樣式 ('solid', 'dashed', 'dotted')
   - `data-border-radius`: 圓角大小 (整數，如 '8')
   
   範例寫法：
   <foreignObject x='50' y='100' width='694' height='350' class='shape math-obj' data-tool='text' data-font-size='16' fill='#000000' data-bg-color='#f9f9f9' data-border-color='#34495e' data-border-width='2' data-border-style='solid' data-border-radius='8'>
       <div xmlns='http://www.w3.org/1999/xhtml' class='math-content' style='font-size:16px !important; color:#000000; width:100% !important; height:100% !important; box-sizing:border-box !important; white-space:pre-wrap !important; word-break:break-word !important; line-height:1.8 !important;'>
           1. 已知直角 $\triangle ABC$ 中，$\angle B = 90^{\circ}$。求 $\overline{AC}$ 的長度。
       </div>
   </foreignObject>

4. SVG 語法與引號限制：
   illustrationSvg 內的所有 SVG 屬性，強制使用單引號 (')！例如：class='shape'。
   若有 JSON 屬性值請包裝成 data-params='{"a":1}'。
   嚴禁嵌套 <svg> 標籤，請直接輸出內部元素如 <polygon>, <g>, <line> 等。

=====================================================================
第四部分：靜態幾何圖形生成語法 (SVG Elements Catalog)
=====================================================================
所有互動主體必須包含 class='shape' 與 data-tool='對應工具名稱'。
幾何圖形預設設定為 fill='none'、stroke='black'、stroke-width='2'。
⚠️ 極度重要：所有 `<text>` 標籤務必明確加入 `fill='#000000'` (或其他顏色)，絕對不可省略，否則文字會變成透明消失！

1. 基礎多邊形與直線
多邊形 (Polygon)：禁止用零碎的 <line> 畫多邊形，必須使用 <polygon>。
<polygon points='341.4,425.6 409.1,315.5 299.0,247.7' class='shape' data-tool='polygon' fill='none' stroke='black' stroke-width='2' id='poly-1' />

直線與線段 (Line)：
可直接使用 <g> 群組包裝，包含隱藏判定線與可見線。
<g class='shape' data-tool='line' data-x1='299.0' data-y1='247.7' data-x2='409.1' data-y2='425.6'>
   <path class='hit-line' stroke='transparent' stroke-width='10' d='M 299.0 247.7 L 409.1 425.6'/>
   <path class='visible-line' stroke='black' stroke-width='2' d='M 299.0 247.7 L 409.1 425.6'/>
</g>

2. 共邊多邊形 (Shared Edge Polygon)
若需繪製黏合在其他多邊形上的圖案，可使用以下語法：
<polygon class='shape' data-tool='polygon' data-sub-tool='shared_4gon' data-owner-shape='poly-1' data-dependency-type='shared_edge_shape' data-edge-index='2' data-side='-1' id='poly-shared-1' stroke='black' stroke-width='2' fill='none' points='...' />

3. 系統高階組件 (3D、函數、坐標系)
遇到立體圖、函數或座標平面，絕對禁止自行用線條刻畫，必須呼叫系統組件：

3D 立體圖形 (Solid)：支援 solid-cube, solid-cylinder, solid-cone, solid-pyramid, solid-prism。
<g class='shape group' data-tool='solid' data-sub-tool='solid-cube' data-cx='400' data-cy='300' data-w='100' data-h='100' data-d='100'></g>

XY 坐標平面：
<g class='shape axes-system' data-tool='group' data-type='xy' data-range='10' data-minor='1' data-major='5' data-label='5' data-show-grid='false'></g>

二次函數曲線：
<path class='shape smart-function' data-tool='function' data-func-mode='standard' data-func-type='quadratic_gen' data-params='{"a":1,"b":0,"c":-5}' fill='none' stroke='#2980b9' stroke-width='2.5' />

4. 幾何標註與符號 (Markers & Labels)
ID 綁定與關聯：頂點標籤必須具備獨立 x, y 坐標，並建議綁定 data-owner-shape。

幾何變數與邊長標註 (Math Labels & Variables - 極度重要)：
絕對禁止使用 `<text>` 來包裝含有 `$` 的數學式或變數。請一律使用 `<foreignObject>`，確保文字能被系統正確渲染並防爆框。
<foreignObject x='130' y='220' width='60' height='40' class='shape math-obj' data-tool='math' data-font-size='16' fill='#000000'>
    <div xmlns='http://www.w3.org/1999/xhtml' class='math-content' style='font-size:16px !important; color:#000000; width:100% !important; height:100% !important; display:flex !important; justify-content:center !important; align-items:center !important;'>$a$</div>
</foreignObject>

純文字頂點標籤 (純英文字母，不含 $)：
若是單純的 A, B, C 等不需 $ 包裝的頂點標籤，才允許使用 `<text>`，並確保包含 `fill='#000000'`。
<text x='293.7' y='230.0' class='shape' data-tool='text' font-size='16' fill='#000000' font-weight='bold' font-family='Arial' text-anchor='middle' dominant-baseline='central'>A</text>

弧線角度標記 (Angle Mark)：
<path d='M 120 100 A 20 20 0 0 1 100 120' class='shape mark-path' data-tool='mark' data-owner-shape='poly-1' stroke='#c0392b' stroke-width='1.5' fill='none' />
<text x='130' y='130' class='shape angle-label-text' data-tool='text' data-owner-shape='poly-1' font-size='14' fill='#c0392b' font-weight='bold'>60°</text>

直角符號 (Right Angle)：
<polyline points='100,120 120,120 120,100' class='shape mark-path right-angle-mark' data-tool='mark' data-owner-shape='poly-1' stroke='#c0392b' stroke-width='1.5' fill='none' />

長度尺寸標註 (Dimension Line)：
<g class='shape group dimension' data-tool='group' data-sub-tool='dimension' data-owner='poly-1' data-dim-style='curve' data-p1-x='100' data-p1-y='100' data-p2-x='300' data-p2-y='100' data-offset='20'><text x='200' y='70' class='shape dimension-text' data-tool='text' font-size='16' fill='#2980b9' font-weight='bold'>10</text></g>

=====================================================================
第五部分：模式 A 的動態題庫腳本內部 API (Dynamic Script Code API)
=====================================================================
若被要求產生「動態互動題型」，scriptCode 必須是包含以下屬性的 JavaScript 物件字串：

1. 基礎設定：
   id: '唯一英文代號',
   title: '題目標題',
   hasAdvanced: true/false,
   hasLiteracy: true/false,

2. generateVars(level): 產生亂數變數。
   傳入 'basic', 'advanced', 'literacy' 判斷難度。
   回傳格式：return { vars: {a: 3, b: 4}, ans: 5, type: 'input' };。若為選擇題，設 type: 'choice' 並提供選項 options 陣列。

3. questionTpl(vars) & explanationTpl(vars): 回傳題目與詳解的 HTML 字串。
   必須使用 ES6 樣板字面值 (Template Literals ` `)。數學式需用 $ 包裝。
   ⚠️ 選擇題選項絕對不要加入 (A)(B)(C)(D) 或 (1)(2)(3)(4) 等選項編號，系統會自動在畫面上加上標號。

4. drawObjects(vars) & drawExplanationObjects(vars): 回傳陣列，定義要畫的幾何物件。
   - 系統底層會自動將所有圖形置中，不需計算絕對畫面座標。
   - 支援的 type:
     'line': { x1, y1, x2, y2 }
     'circle': { cx, cy, r }
     'polygon' / 'polyline': { points: '0,0 100,0 50,50' }
     'rect': { x, y, width, height }
     'text': { text: 'A', x, y, color, fontSize } (不用包 $ 符號，底層會自動加)
   - 通用屬性: stroke, strokeWidth, fill, dash。
   - ⚠️ 標註極度重要：頂點名稱、變數邊長、角度值，必須明確使用 type: 'text' 放入陣列中畫出來！直角記號等輔助圖形可用 polyline 或 line 繪製。

5. 完整的物件結構範例 (必須遵照此格式)：
{
  id: 'template_01',
  title: '標題',
  hasAdvanced: false,
  hasLiteracy: false,
  generateVars: (level) => { 
    return { vars: {a:1, b:2, options:['3, 30°','4, 45°']}, ans: 0, type: 'choice' }; 
  },
  questionTpl: (vars) => { 
    return `求 ${vars.a} + ${vars.b} 以及角度？`; 
  },
  generateChoices: (ans, vars) => { 
    return vars.options.map(opt => ({ text: opt })); 
  },
  drawObjects: (vars, askKey) => { 
    return [
      {type:'polygon', points:'0,0 100,0 50,50', stroke:'black', fill:'none'},
      {type:'text', text:'A', x:0, y:-15, color:'black', fontSize:18},
      {type:'text', text:vars.a, x:50, y:-15, color:'blue', fontSize:18}
    ]; 
  },
  explanationTpl: (vars) => { 
    return `<b>【解題步驟】</b><br>1. 根據題意計算邊長...<br>2. 故答案為 ${vars.a + vars.b}`; 
  },
  drawExplanationObjects: (vars, askKey) => {
    // (極度重要) 必須回傳解說時需「疊加上去」的幾何物件陣列（如紅色輔助線、直角標記、特別塗色的重點三角形）。
    // 系統會自動將它與 drawObjects 的原圖重疊對位顯示！
    return [{type:'line', x1:0, y1:0, x2:50, y2:50, stroke:'red', dash:'5,5'}]; 
  }
}

