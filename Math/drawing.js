const htmlFmt = {
    slot: (val, label) => `
        <span class="math-param-stack">
            <span class="math-param-val">${parseFloat(val).toFixed(1)}</span>
            <span class="math-param-key">${label || ''}</span>
        </span>`,
    
    op: (sign) => `<span class="op-slot">${sign}</span>`,
    
    analyze: (val) => ({
        sign: val >= 0 ? "+" : "-",
        abs: Math.abs(val)
    })
};

const mathFmt = {
    // 清理多餘空格，處理 y = - 1.5 變成 y = -1.5，並處理全空的情況
    clean: (str) => {
        // 先過濾掉所有 undefined, null, 或純空格的部份
        const parts = str.split(' ').filter(p => p && p.trim() !== '');
        
        let cleaned = parts.join(' ');

        // 處理 y = 後面的第一個運算符
        cleaned = cleaned.replace(/^y\s*=\s*\+\s*/, 'y = '); // 移除開頭多餘的正號
        cleaned = cleaned.replace(/^y\s*=\s*-\s*/, 'y = -');  // 首項負號緊貼
        
        // 如果最後只剩 "y ="，補上 0
        if (cleaned === "y =") cleaned = "y = 0";
        return cleaned;
    },
    
    // 處理係數：1x -> x, -1x -> -x, 0x -> "" (完全隱藏)
    coef: (val, sym, isFirst = false) => {
        if (Math.abs(val) < 0.0001) return ""; // 係數為 0，直接回傳空字串，連 sym 都不顯示
        
        let num = Math.abs(val);
        // 如果係數是 1，隱藏數字部份
        let numStr = (Math.abs(num - 1) < 0.0001) ? "" : parseFloat(num.toFixed(2));
        
        if (isFirst) {
            // 首項：負號緊貼，正號不標
            return val < 0 ? `-${numStr}${sym}` : `${numStr}${sym}`;
        } else {
            // 非首項：符號前後留空
            return val < 0 ? `- ${numStr}${sym}` : `+ ${numStr}${sym}`;
        }
    },
    
    // 處理常數項
    term: (val, isFirst = false) => {
        if (Math.abs(val) < 0.0001) return isFirst ? "0" : ""; // 若常數是首項且為0，顯示0；否則隱藏
        
        let num = parseFloat(Math.abs(val).toFixed(2));
        
        if (isFirst) {
            return val < 0 ? `-${num}` : `${num}`;
        } else {
            return val < 0 ? `- ${num}` : `+ ${num}`;
        }
    }
};


const STD_FUNCTIONS = {
    'linear_gen': {
        name: '一次函數', formula: 'ax+b',
        params: { a: 1, b: 0 },
        calc: (x, p) => p.a * x + p.b,
        // --- 修正處 ---
        ascii: (p) => {
            const p1 = mathFmt.coef(p.a, 'x', true);
            const p2 = mathFmt.term(p.b, p1 === "");
            return mathFmt.clean(`y = ${p1} ${p2}`);
        },
        html: (p) => { /* 保持不變 */ }
    },
    'quadratic_vertex': {
        name: '二次函數 (頂點式)', formula: 'a(x-h)^2+k',
        params: { a: 1, h: 0, k: 0 },
        calc: (x, p) => p.a * Math.pow((x - p.h), 2) + p.k,
        ascii: (p) => {
            const hPart = p.h === 0 ? "x^2" : `(x ${mathFmt.term(-p.h)})^2`; 
            let aPart = (Math.abs(p.a - 1) < 0.001) ? "" : (Math.abs(p.a + 1) < 0.001 ? "-" : parseFloat(p.a.toFixed(2)));
            return mathFmt.clean(`y = ${aPart}${hPart} ${mathFmt.term(p.k)}`);
        },
        html: (p) => {
            const hSign = p.h >= 0 ? "-" : "+"; 
            const k = htmlFmt.analyze(p.k);
            return `y = ${htmlFmt.slot(p.a, 'a')}(x ${htmlFmt.op(hSign)} ${htmlFmt.slot(Math.abs(p.h), 'h')})² ${htmlFmt.op(k.sign)} ${htmlFmt.slot(k.abs, 'k')}`;
        }
    },
    'quadratic_gen': {
        name: '二次函數 (一般式)', formula: 'ax^2+bx+c',
        params: { a: 1, b: 0, c: 0 },
        calc: (x, p) => p.a * x*x + p.b * x + p.c,
        // --- 修正處 ---
        ascii: (p) => {
            const p1 = mathFmt.coef(p.a, 'x^2', true);
            const p2 = mathFmt.coef(p.b, 'x', p1 === "");
            const p3 = mathFmt.term(p.c, p1 === "" && p2 === "");
            return mathFmt.clean(`y = ${p1} ${p2} ${p3}`);
        },
        html: (p) => { /* 保持不變 */ }
    },
    'cubic': {
        name: '三次函數', formula: 'ax^3+bx^2+cx+d',
        params: { a: 1, b: 0, c: 0, d: 0 },
        calc: (x, p) => p.a*x**3 + p.b*x**2 + p.c*x + p.d,
        // --- 修正處 ---
        ascii: (p) => {
            const p1 = mathFmt.coef(p.a, 'x^3', true);
            const p2 = mathFmt.coef(p.b, 'x^2', p1 === "");
            const p3 = mathFmt.coef(p.c, 'x', p1 === "" && p2 === "");
            const p4 = mathFmt.term(p.d, p1 === "" && p2 === "" && p3 === "");
            return mathFmt.clean(`y = ${p1} ${p2} ${p3} ${p4}`);
        },
        html: (p) => { /* 保持不變 */ }
    },
    'sin': {
        name: '正弦函數', formula: 'a sin(bx+c)+d',
        params: { a: 1, b: 1, c: 0, d: 0 },
        calc: (x, p) => p.a * Math.sin(p.b * x + p.c) + p.d,
        ascii: (p) => {
            let inner = mathFmt.clean(`${mathFmt.coef(p.b, 'x', true)} ${mathFmt.term(p.c)}`);
            let aPart = (Math.abs(p.a - 1) < 0.001) ? "" : parseFloat(p.a.toFixed(2));
            return mathFmt.clean(`y = ${aPart}sin(${inner}) ${mathFmt.term(p.d)}`);
        },
        html: (p) => {
            const c = htmlFmt.analyze(p.c);
            const d = htmlFmt.analyze(p.d);
            return `y = ${htmlFmt.slot(p.a, 'a')}sin(${htmlFmt.slot(p.b, 'b')}x ${htmlFmt.op(c.sign)} ${htmlFmt.slot(c.abs, 'c')}) ${htmlFmt.op(d.sign)} ${htmlFmt.slot(d.abs, 'd')}`;
        }
    },
    'cos': {
        name: '餘弦函數', formula: 'a cos(bx+c)+d',
        params: { a: 1, b: 1, c: 0, d: 0 },
        calc: (x, p) => p.a * Math.cos(p.b * x + p.c) + p.d,
        ascii: (p) => {
            let inner = mathFmt.clean(`${mathFmt.coef(p.b, 'x', true)} ${mathFmt.term(p.c)}`);
            let aPart = (Math.abs(p.a - 1) < 0.001) ? "" : parseFloat(p.a.toFixed(2));
            return mathFmt.clean(`y = ${aPart}cos(${inner}) ${mathFmt.term(p.d)}`);
        },
        html: (p) => {
            const c = htmlFmt.analyze(p.c);
            const d = htmlFmt.analyze(p.d);
            return `y = ${htmlFmt.slot(p.a, 'a')}cos(${htmlFmt.slot(p.b, 'b')}x ${htmlFmt.op(c.sign)} ${htmlFmt.slot(c.abs, 'c')}) ${htmlFmt.op(d.sign)} ${htmlFmt.slot(d.abs, 'd')}`;
        }
    },
    'tan': {
        name: '正切函數', formula: 'a tan(bx+c)+d',
        params: { a: 1, b: 1, c: 0, d: 0 },
        calc: (x, p) => p.a * Math.tan(p.b * x + p.c) + p.d,
        ascii: (p) => {
            let inner = mathFmt.clean(`${mathFmt.coef(p.b, 'x', true)} ${mathFmt.term(p.c)}`);
            let aPart = (Math.abs(p.a - 1) < 0.001) ? "" : parseFloat(p.a.toFixed(2));
            return mathFmt.clean(`y = ${aPart}tan(${inner}) ${mathFmt.term(p.d)}`);
        },
        html: (p) => {
            const c = htmlFmt.analyze(p.c);
            const d = htmlFmt.analyze(p.d);
            return `y = ${htmlFmt.slot(p.a, 'a')}tan(${htmlFmt.slot(p.b, 'b')}x ${htmlFmt.op(c.sign)} ${htmlFmt.slot(c.abs, 'c')}) ${htmlFmt.op(d.sign)} ${htmlFmt.slot(d.abs, 'd')}`;
        }
    },
    'exp': {
        name: '指數函數', formula: 'a·b^x + k',
        params: { a: 1, b: 2, k: 0 },
        calc: (x, p) => p.a * Math.pow(p.b, x) + p.k,
        ascii: (p) => {
            let aPart = (Math.abs(p.a - 1) < 0.001) ? "" : `${parseFloat(p.a.toFixed(2))} \\cdot `;
            return mathFmt.clean(`y = ${aPart}${parseFloat(p.b.toFixed(2))}^x ${mathFmt.term(p.k)}`);
        },
        html: (p) => {
            const k = htmlFmt.analyze(p.k);
            return `y = ${htmlFmt.slot(p.a, 'a')}·(${htmlFmt.slot(p.b, 'b')})^x ${htmlFmt.op(k.sign)} ${htmlFmt.slot(k.abs, 'k')}`;
        }
    },
    'log': {
        name: '對數函數', formula: 'a log_b(x-h) + k',
        params: { a: 1, b: 10, h: 0, k: 0 },
        calc: (x, p) => (x - p.h <= 0) ? NaN : p.a * (Math.log(x - p.h) / Math.log(p.b)) + p.k,
        ascii: (p) => {
            let aPart = (Math.abs(p.a - 1) < 0.001) ? "" : parseFloat(p.a.toFixed(2));
            let inner = p.h === 0 ? "x" : `(x ${mathFmt.term(-p.h)})`;
            return mathFmt.clean(`y = ${aPart}log_{${parseFloat(p.b.toFixed(2))}}${inner} ${mathFmt.term(p.k)}`);
        },
        html: (p) => {
            const hSign = p.h >= 0 ? "-" : "+";
            const k = htmlFmt.analyze(p.k);
            return `y = ${htmlFmt.slot(p.a, 'a')}log<sub>${htmlFmt.slot(p.b, 'b')}</sub>(x ${htmlFmt.op(hSign)} ${htmlFmt.slot(Math.abs(p.h), 'h')}) ${htmlFmt.op(k.sign)} ${htmlFmt.slot(k.abs, 'k')}`;
        }
    },
    'rational': {
        name: '有理/反比', formula: 'a / (x-h) + k',
        params: { a: 1, h: 0, k: 0 },
        calc: (x, p) => (Math.abs(x - p.h) < 0.0001) ? NaN : p.a / (x - p.h) + p.k,
        ascii: (p) => {
            let inner = p.h === 0 ? "x" : `(x ${mathFmt.term(-p.h)})`;
            return mathFmt.clean(`y = ${parseFloat(p.a.toFixed(2))} / ${inner} ${mathFmt.term(p.k)}`);
        },
        html: (p) => {
            const hSign = p.h >= 0 ? "-" : "+";
            const k = htmlFmt.analyze(p.k);
            return `y = ${htmlFmt.slot(p.a, 'a')} / (x ${htmlFmt.op(hSign)} ${htmlFmt.slot(Math.abs(p.h), 'h')}) ${htmlFmt.op(k.sign)} ${htmlFmt.slot(k.abs, 'k')}`;
        }
    }
};

// 1. 初始化彈窗中的輸入框 (在 HTML onchange 中呼叫)
function renderStdFuncInputs() {
    const type = document.getElementById('std-func-selector').value;
    const container = document.getElementById('std-func-params');
    container.innerHTML = '';
    
	if (!type) return; 
	
    const config = STD_FUNCTIONS[type];
    if (!config) return;

    for (let key in config.params) {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '5px'; // 新增間距
        // 【問題2 修改處】移除 input 的 width:100% 樣式
        div.innerHTML = `
            <span style="font-family:Times New Roman; font-weight:bold; font-size:16px; white-space:nowrap;">${key} =</span>
            <input type="number" id="std-in-${key}" value="${config.params[key]}" step="0.1" 
                   style="width: 52px; padding: 3px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
        `;
        container.appendChild(div);
    }
}

function plotStandardFunction() {
    const type = document.getElementById('std-func-selector').value;
    const range = parseFloat(document.getElementById('func-range').value) || 10;
    const needAxis = document.getElementById('chk-draw-axis').checked;
    
    const config = STD_FUNCTIONS[type];
    const params = {};
    for (let key in config.params) {
        params[key] = parseFloat(document.getElementById(`std-in-${key}`).value) || 0;
    }

    if (needAxis) {
        const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
        const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
        
        // [關鍵修正]：同樣使用 Math.min(w, h) 統一比例
        const scale = (Math.min(w, h) - 100) / (range * 2);
        
        drawAxesInternal(scale, range, 1, 5, 5, true, 'xy');
		
		const svg = document.getElementById('svg-canvas');
        const gridBtn = document.getElementById('btn-toggle-grid');
        if (svg.classList.contains('grid-bg-css')) {
            svg.classList.remove('grid-bg-css');
            if (gridBtn) gridBtn.classList.remove('active');
        }
    }

    // 建立物件
    const path = document.createElementNS(ns, "path");
    const pathId = 'func-' + Date.now();
    path.id = pathId;
    path.setAttribute("class", "shape smart-function");
    path.setAttribute("data-tool", "function");
    path.setAttribute("data-func-mode", "standard");
    path.setAttribute("data-func-type", type);
    path.setAttribute("data-params", JSON.stringify(params));
    path.style.cssText = "stroke:#2980b9; stroke-width:2.5; fill:none; vector-effect:non-scaling-stroke; cursor:move;";
    path.setAttribute("clip-path", "url(#canvas-clip)");

    // 建立 MathJax 標籤
    const fo = document.createElementNS(ns, "foreignObject");
    const labelId = 'label-' + pathId;
    fo.id = labelId;
    fo.setAttribute("width", "300");
    fo.setAttribute("height", "60");
    fo.setAttribute("class", "shape math-obj no-pointer-events"); 
    fo.setAttribute("data-tool", "label-display");
    
    const div = document.createElement('div');
    div.className = 'math-content';
    div.style.fontSize = '20px';
    div.style.color = '#2980b9'; 
    fo.appendChild(div);

    path.setAttribute("data-label-id", labelId);

    const layer = document.getElementById('shapes-layer');
    layer.appendChild(path);
    layer.appendChild(fo);

    updateStandardFunctionGraph(path); 
    saveState();
    
    document.getElementById('function-modal').style.display = 'none';
    setMode('select');
    deselectAll();
    addToSelection(path);
    
    statusText.innerText = `已建立 ${config.name}，可於右側面板調整係數`;
}

// 3. 核心重繪函式 (支援斷點與 MathJax 更新)
function updateStandardFunctionGraph(shape) {
    const type = shape.getAttribute('data-func-type');
    const params = JSON.parse(shape.getAttribute('data-params'));
    const labelId = shape.getAttribute('data-label-id');
    const config = STD_FUNCTIONS[type];
    
    if (!config) return;

    // 1. 繪圖邏輯 (這部分不用動)
    let range = 10;
    const axisGroup = document.getElementById('axes-group');
    if (axisGroup) range = parseFloat(axisGroup.getAttribute('data-range')) || 10;
    
	const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
	const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const cx = w/2, cy = h/2;
    const scale = (Math.min(w, h) - 100) / (range * 2);

    let d = "";
    let started = false;
    let prevY = null;
    const xMin = -range * 1.2;
    const xMax = range * 1.2;
    const step = 1 / scale; 

    for (let x = xMin; x <= xMax; x += step) {
        let y = config.calc(x, params);
        if (isNaN(y) || !isFinite(y)) { started = false; prevY = null; continue; }
        const px = cx + x * scale;
        const py = cy - y * scale;
        if (py < -h || py > h * 2) { started = false; prevY = null; continue; }
        if (started && prevY !== null) {
            if (Math.abs(py - prevY) > h) started = false;
        }
        if (!started) { d += `M ${px.toFixed(1)} ${py.toFixed(1)} `; started = true; } 
        else { d += `L ${px.toFixed(1)} ${py.toFixed(1)} `; }
        prevY = py;
    }
    shape.setAttribute('d', d);

    // 【核心修正點】：更新標籤的邏輯
    const labelEl = document.getElementById(labelId);
    if (labelEl) {
        // 直接呼叫已經修復好的 ascii 函式，並加上反引號
        const mathString = '`' + config.ascii(params) + '`';

        // 寫入 ForeignObject
        const div = labelEl.querySelector('.math-content');
        if(div) {
            div.innerHTML = mathString;

            // 觸發 MathJax 渲染與自動調整大小
            if (window.MathJax) {
                MathJax.typesetPromise([div]).then(() => {
                    setTimeout(() => {
                        const lw = div.offsetWidth + 2; 
                        const lh = div.offsetHeight + 2;
                        labelEl.setAttribute('width', lw);
                        labelEl.setAttribute('height', lh);
                        labelEl.setAttribute('x', (parseFloat(svgCanvas.getAttribute('width')) || 800) - lw); 
                        labelEl.setAttribute('y', 0);
                    }, 50); // 給予一點點延遲讓 DOM 更新
                });
            }
        }
    }
}

// 4. 新增：當座標軸變更時，重繪所有函數
function redrawAllFunctions() {
    // 重繪舊的智慧參數函數 (Smart Parameter / Slider)
    document.querySelectorAll('.smart-function[data-smart-type]').forEach(el => {
        updateSmartFunctionGraph(el);
    });
    
    // 重繪新的標準函數 (Standard / Settings)
    document.querySelectorAll('.smart-function[data-func-mode="standard"]').forEach(el => {
        updateStandardFunctionGraph(el);
    });
}

function drawSmartAxes() {
    const modal = document.getElementById('axes-modal');
    modal.style.display = 'flex';
    const cached = localStorage.getItem('math_editor_axis_settings');
    let settings = cached ? JSON.parse(cached) : null;
    const group = document.getElementById('axes-group');
    if (group) {
        document.getElementById('axis-range').value = group.getAttribute('data-range') || 10;
        const type = group.getAttribute('data-type') || 'xy';
        const radio = document.querySelector(`input[name="axis-type"][value="${type}"]`);
        if (radio) radio.checked = true;
        const setField = (val, chkId, inpId) => {
            const hasVal = (val !== null && val !== '' && val !== 'null');
            document.getElementById(chkId).checked = hasVal;
            const inp = document.getElementById(inpId);
            inp.value = hasVal ? val : (settings?.[inpId] || 1); 
            toggleInput(chkId, inpId);
        };
        setField(group.getAttribute('data-minor'), 'chk-axis-minor', 'axis-step-minor');
        setField(group.getAttribute('data-major'), 'chk-axis-major', 'axis-step-major');
        setField(group.getAttribute('data-label'), 'chk-axis-label', 'axis-step-label');
        const showGrid = group.getAttribute('data-show-grid') === 'true';
        document.getElementById('axis-show-grid').checked = showGrid;
    } else if (settings) {
        document.getElementById('axis-range').value = settings.range || 10;
        const type = settings.axisType || 'xy';
        const radio = document.querySelector(`input[name="axis-type"][value="${type}"]`);
        if (radio) radio.checked = true;
        const restore = (key, chkId, inpId) => {
            const val = settings[key];
            const hasVal = (val !== null);
            document.getElementById(chkId).checked = hasVal;
            document.getElementById(inpId).value = hasVal ? val : 1;
            toggleInput(chkId, inpId);
        };
        restore('minor', 'chk-axis-minor', 'axis-step-minor');
        restore('major', 'chk-axis-major', 'axis-step-major');
        restore('label', 'chk-axis-label', 'axis-step-label');
        document.getElementById('axis-show-grid').checked = settings.showGrid !== false;
    } else {
        document.querySelector('input[name="axis-type"][value="xy"]').checked = true;
        ['chk-axis-minor', 'chk-axis-major', 'chk-axis-label'].forEach(id => {
            document.getElementById(id).checked = true;
            toggleInput(id, id.replace('chk-axis', 'axis-step'));
        });
        document.getElementById('axis-show-grid').checked = false;
    }
    document.getElementById('axis-range').focus();
}

function drawAxesInternal(scale, rangeVal, minorStep, majorStep, labelStep, showGrid, axisType = 'xy') {
    bgLayer.innerHTML = '';
    drawingArea.classList.remove('grid-bg-css');
    const existingGroup = document.getElementById('axes-group');
    if (existingGroup) existingGroup.remove();
	const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
	const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const cx = w / 2,
        cy = h / 2;
    const arrowSafeZone = 35;
    const axisGroup = document.createElementNS(ns, "g");
    axisGroup.id = "axes-group";
    axisGroup.setAttribute("class", "shape axes-system");
    axisGroup.setAttribute("data-tool", "group");
    axisGroup.setAttribute('data-type', axisType);
    axisGroup.setAttribute('data-range', rangeVal);
    axisGroup.setAttribute('data-minor', minorStep !== null ? minorStep : '');
    axisGroup.setAttribute('data-major', majorStep !== null ? majorStep : '');
    axisGroup.setAttribute('data-label', labelStep !== null ? labelStep : '');
    axisGroup.setAttribute('data-show-grid', showGrid);
    axisGroup.addEventListener('click', function(e) {
        if (e.detail === 2) {
            e.stopPropagation();
			showConfirm("要修改座標軸設定嗎？", () => {
				drawSmartAxes();
			});
        }
    });
    const createHitLine = (x1, y1, x2, y2) => {
        const hl = document.createElementNS(ns, "line");
        hl.setAttribute("x1", x1);
        hl.setAttribute("y1", y1);
        hl.setAttribute("x2", x2);
        hl.setAttribute("y2", y2);
        hl.setAttribute("stroke", "rgba(0,0,0,0)");
        hl.setAttribute("stroke-width", "20");
        hl.style.cursor = "move";
        axisGroup.appendChild(hl);
    };
    const createLine = (x1, y1, x2, y2, cls, color = "#000", width = 1) => {
        const l = document.createElementNS(ns, "line");
        l.setAttribute("x1", x1);
        l.setAttribute("y1", y1);
        l.setAttribute("x2", x2);
        l.setAttribute("y2", y2);
        l.setAttribute("class", cls);
        l.style.stroke = color;
        l.style.strokeWidth = width;
        l.style.pointerEvents = "none";
        if (cls === 'grid-line' || cls === 'axis-tick') {
            l.setAttribute("clip-path", "url(#canvas-clip)");
        }
        axisGroup.appendChild(l);
    };
    const createText = (x, y, txt, cls, size) => {
        const t = document.createElementNS(ns, "text");
        t.setAttribute("x", x);
        t.setAttribute("y", y);
        t.textContent = txt;
        t.setAttribute("class", cls);
        if (size) t.style.fontSize = size;
        axisGroup.appendChild(t);
    };
    createHitLine(0, cy, w, cy);
    if (axisType === 'xy') {
        createHitLine(cx, 0, cx, h);
    }
    if (showGrid) {
        const maxDistX = Math.max(cx, w - cx);
        const maxDistY = Math.max(cy, h - cy);
        const logicalMax = Math.max(maxDistX, maxDistY) / scale;
        const drawGridLines = (step, color, width) => {
            if (!step) return;
            const limit = Math.ceil(logicalMax / step) * step;
            for (let i = step; i <= limit; i += step) {
                const val = parseFloat(i.toPrecision(12));
                const px = val * scale;
                if (cx + px < w - arrowSafeZone) {
                    createLine(cx + px, 0, cx + px, h, "grid-line", color, width);
                }
                if (cx - px > 0) {
                    createLine(cx - px, 0, cx - px, h, "grid-line", color, width);
                }
                if (axisType === 'xy') {
                    if (cy - px > arrowSafeZone) {
                        createLine(0, cy - px, w, cy - px, "grid-line", color, width);
                    }
                    if (cy + px < h) {
                        createLine(0, cy + px, w, cy + px, "grid-line", color, width);
                    }
                }
            }
        };
        if (minorStep) drawGridLines(minorStep, "#e0e0e0", 1);
        if (majorStep) drawGridLines(majorStep, "#ccc", 1);
    }
    createLine(20, cy, w - 20, cy, "axis-line", "#000", 2);
    if (axisType === 'xy') {
        createLine(cx, h - 20, cx, 20, "axis-line", "#000", 2);
    }
    const axisLines = axisGroup.querySelectorAll('.axis-line');
    axisLines.forEach(line => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const y2 = parseFloat(line.getAttribute('y2'));
        if (Math.abs(y1 - y2) < 1 && x2 > x1) {
            line.setAttribute("marker-end", "url(#arrow-end)");
        }
        if (Math.abs(x1 - x2) < 1 && y1 > y2) {
            line.setAttribute("marker-end", "url(#arrow-end)");
        }
    });
    createText(w - 15, cy + 30, "X", "axis-label");
    if (axisType === 'xy') {
        createText(cx - 30, 25, "Y", "axis-label");
    }
    const drawTicks = (step, isMajor) => {
        if (!step) return;
        const tickLen = isMajor ? 8 : 4;
        const maxDistX = Math.max(cx, w - cx);
        const maxDistY = Math.max(cy, h - cy);
        const logicalMax = Math.max(maxDistX, maxDistY) / scale;
        const limit = Math.ceil(logicalMax / step) * step;
        for (let i = step; i <= limit; i += step) {
            const val = parseFloat(i.toPrecision(12));
            const px = val * scale;
            if (cx + px < w - arrowSafeZone) {
                createLine(cx + px, cy - tickLen, cx + px, cy + tickLen, "axis-tick", "#000", 1.5);
            }
            if (cx - px > 0) {
                createLine(cx - px, cy - tickLen, cx - px, cy + tickLen, "axis-tick", "#000", 1.5);
            }
            if (axisType === 'xy') {
                if (cy - px > arrowSafeZone) {
                    createLine(cx - tickLen, cy - px, cx + tickLen, cy - px, "axis-tick", "#000", 1.5);
                }
                if (cy + px < h) {
                    createLine(cx - tickLen, cy + px, cx + tickLen, cy + px, "axis-tick", "#000", 1.5);
                }
            }
        }
    };
    if (minorStep) drawTicks(minorStep, false);
    if (majorStep) drawTicks(majorStep, true);
    if (labelStep) {
        const maxDistX = Math.max(cx, w - cx);
        const maxDistY = Math.max(cy, h - cy);
        const logicalMax = Math.max(maxDistX, maxDistY) / scale;
        const limit = Math.ceil(logicalMax / labelStep) * labelStep;
        for (let i = labelStep; i <= limit; i += labelStep) {
            const val = parseFloat(i.toPrecision(12));
            const px = val * scale;
            if (cx + px <= w - 30) createText(cx + px, cy + 20, val, "axis-text");
            if (cx - px >= 10) createText(cx - px, cy + 20, -val, "axis-text");
            if (axisType === 'xy') {
                if (cy - px >= 30) createText(cx + 20, cy - px + 5, val, "axis-text");
                if (cy + px <= h - 10) createText(cx + 20, cy + px + 5, -val, "axis-text");
            }
        }
    }
    if (axisType === 'number-line') {
        createLine(cx, cy - 10, cx, cy + 10, "axis-tick", "#000", 3);
    }
    if (axisType === 'number-line') {
        createOriginLabelObject(cx, cy + 35, 'middle');
    } else {
        createOriginLabelObject(cx - 15, cy + 25, 'end');
    }
	redrawAllFunctions(); 
    saveState();
    const typeName = axisType === 'xy' ? "XY座標" : "數線";
    statusText.innerText = `已更新${typeName} (網格:${showGrid?"開啟":"關閉"}, 範圍:${rangeVal})`;
    if (shapesLayer.firstChild) {
        shapesLayer.insertBefore(axisGroup, shapesLayer.firstChild);
    } else {
        shapesLayer.appendChild(axisGroup);
    }
    setMode('select');
    deselectAll();
    addToSelection(axisGroup);
}

function createOriginLabelObject(x, y, align = 'start') {
    let originLabel = document.querySelector('.shape[data-subtype="origin-label"]');
    const fontSize = window.getDefaultTextSize ? window.getDefaultTextSize() : "20";
    if (!originLabel) {
        originLabel = document.createElementNS(ns, "text");
        originLabel.textContent = "O";
        originLabel.setAttribute("class", "shape");
        originLabel.setAttribute("data-tool", "text");
        originLabel.setAttribute("data-subtype", "origin-label");
        originLabel.style.cssText = `stroke: none; fill: #000; font-size: ${fontSize}px; font-family: 'Times New Roman', serif; font-weight: bold; cursor: move;`;
        originLabel.setAttribute('font-size', fontSize);
        shapesLayer.appendChild(originLabel);
    }
    originLabel.setAttribute("x", x);
    originLabel.setAttribute("y", y);
    originLabel.style.textAnchor = align;
}

let currentRealGridCount = 20; // 本機變數記憶格數
try {
    const cached = localStorage.getItem('math_editor_real_grid_count');
    if (cached) currentRealGridCount = parseInt(cached) || 20;
} catch(e){}

// [左鍵] 直接畫/清除方格
window.toggleRealGridDirectly = function() {
    const realGridBtn = document.getElementById('btn-real-grid');
    const hasGrid = bgLayer.children.length > 0;

    if (hasGrid) {
        bgLayer.innerHTML = '';
        if (realGridBtn) {
            realGridBtn.classList.remove('active');
            realGridBtn.innerHTML = '▦ 方格圖';
        }
        if (typeof saveState === 'function') saveState();
        if (typeof statusText !== 'undefined') statusText.innerText = "已清除實體方格圖";
        return;
    }

    // 若無方格，直接取快取預設值繪製
    window.executeDrawRealGrid(currentRealGridCount);
};

//[右鍵] 開啟方格數設定視窗
window.openRealGridSettings = function() {
    // 先呼叫 open (這會清空舊的定位)，再補上定位
    openNumberInputModal("請輸入橫向總格數\n(例如 20 代表橫向切成 20 格):", currentRealGridCount.toString(), (inputVal) => {
        const count = parseInt(inputVal);
        if (isNaN(count) || count <= 0) {
            showAlert("請輸入有效的數字");
            return;
        }
        currentRealGridCount = count;
        localStorage.setItem('math_editor_real_grid_count', count.toString());
        window.executeDrawRealGrid(count);
    });
    
    // 加上左側定位
    document.getElementById('number-input-modal').classList.add('param-positioned-modal');
};


// 實際繪製方格的核心函式
window.executeDrawRealGrid = function(count) {
    const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const size = w / count;

    bgLayer.innerHTML = '';
    
    // 自動關閉輔助點狀格線
    svgCanvas.classList.remove('grid-bg-css');
    const assistGridBtn = document.getElementById('btn-toggle-grid');
    if (assistGridBtn) assistGridBtn.classList.remove('active');

    const realGridBtn = document.getElementById('btn-real-grid');
    if (realGridBtn) {
        realGridBtn.classList.add('active');
        realGridBtn.innerHTML = '🗑️ 去方格';
    }

    for (let x = size; x < w; x += size) {
        const l = document.createElementNS(ns, "line");
        l.setAttribute("x1", x); l.setAttribute("y1", 0);
        l.setAttribute("x2", x); l.setAttribute("y2", h);
        l.setAttribute("class", "real-grid-line");
        bgLayer.appendChild(l);
    }

    for (let y = size; y < h; y += size) {
        const l = document.createElementNS(ns, "line");
        l.setAttribute("x1", 0); l.setAttribute("y1", y);
        l.setAttribute("x2", w); l.setAttribute("y2", y);
        l.setAttribute("class", "real-grid-line");
        bgLayer.appendChild(l);
    }

    if (typeof saveState === 'function') saveState();
    if (typeof statusText !== 'undefined') {
        statusText.innerText = `已繪製方格紙：${count} 格`;
    }
};

//[左鍵] 直接繪製座標圖
window.drawAxesDirectly = function() {
    const cached = localStorage.getItem('math_editor_axis_settings');
    let settings = cached ? JSON.parse(cached) : null;

    // 預設參數
    let rangeVal = 10, axisType = 'xy', minorStep = 1, majorStep = 5, labelStep = 5, showGrid = false;

    if (settings) {
        rangeVal = settings.range || 10;
        axisType = settings.axisType || 'xy';
        minorStep = settings.minor !== null && settings.minor !== undefined ? settings.minor : 1;
        majorStep = settings.major !== null && settings.major !== undefined ? settings.major : 5;
        labelStep = settings.label !== null && settings.label !== undefined ? settings.label : 5;
        showGrid = settings.showGrid || false;
    }

    const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const availableSize = Math.min(w - 100, h - 100);
    const scale = availableSize / (rangeVal * 2);
    
    // 直接呼叫已存在的函式進行繪製 (包含重繪所有連動函數)
    drawAxesInternal(scale, rangeVal, minorStep, majorStep, labelStep, showGrid, axisType);
};

function openFunctionModal() {
    const modal = document.getElementById('function-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    
    // 修正點：補上空值檢查防止 innerText 報錯
    const errorMsg = document.getElementById('func-error-msg');
    if (errorMsg) errorMsg.innerText = '';

    const cached = localStorage.getItem('math_editor_func_settings');
    if (cached) {
        try {
            const s = JSON.parse(cached);
            if (s.range && document.getElementById('func-range')) 
                document.getElementById('func-range').value = s.range;
            
            const chkDrawAxis = document.getElementById('chk-draw-axis');
            if (chkDrawAxis && s.drawAxis !== undefined) {
                chkDrawAxis.checked = s.drawAxis;
                toggleFuncAxisInputs(s.drawAxis);
            }
        } catch (e) {
            console.warn("讀取設定失敗", e);
        }
    }
    
    // 修正點：確保元素存在才執行 focus (防止 Uncaught TypeError)
    const selector = document.getElementById('std-func-selector');
    if (selector) selector.focus();
}

function parsePoints(str) {
    if (!str) return [];
    const nums = str.replace(/,/g, ' ').trim().split(/\s+/).map(Number);
    const pts = [];
    for (let i = 0; i < nums.length; i += 2) {
        if (!isNaN(nums[i]) && !isNaN(nums[i + 1])) {
            pts.push({
                x: nums[i],
                y: nums[i + 1]
            });
        }
    }
    return pts;
}

function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function findClosestPointIndex(points, px, py) {
    let minDst = Infinity;
    let idx = -1;
    points.forEach((p, i) => {
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < minDst) {
            minDst = d;
            idx = i;
        }
    });
    return idx;
}

function getTriangleCenters(p1, p2, p3) {
    const x1 = p1.x,
        y1 = p1.y;
    const x2 = p2.x,
        y2 = p2.y;
    const x3 = p3.x,
        y3 = p3.y;
    const a = Math.sqrt((x2 - x3) ** 2 + (y2 - y3) ** 2);
    const b = Math.sqrt((x1 - x3) ** 2 + (y1 - y3) ** 2);
    const c = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    const circumX = ((x1 ** 2 + y1 ** 2) * (y2 - y3) + (x2 ** 2 + y2 ** 2) * (y3 - y1) + (x3 ** 2 + y3 ** 2) * (y1 - y2)) / D;
    const circumY = ((x1 ** 2 + y1 ** 2) * (x3 - x2) + (x2 ** 2 + y2 ** 2) * (x1 - x3) + (x3 ** 2 + y3 ** 2) * (x2 - x1)) / D;
    const R = Math.sqrt((circumX - x1) ** 2 + (circumY - y1) ** 2);
    const P = a + b + c;
    const inX = (a * x1 + b * x2 + c * x3) / P;
    const inY = (a * y1 + b * y2 + c * y3) / P;
    const s = P / 2;
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
    const r = area / s;
    const centX = (x1 + x2 + x3) / 3;
    const centY = (y1 + y2 + y3) / 3;
    return {
        circum: {
            x: circumX,
            y: circumY,
            r: R,
            A: p1,
            B: p2,
            C: p3
        },
        in: {
            x: inX,
            y: inY,
            r: r,
            A: p1,
            B: p2,
            C: p3
        },
        centroid: {
            x: centX,
            y: centY,
            A: p1,
            B: p2,
            C: p3
        }
    };
}

function getTangentPoints(cx, cy, r, px, py) {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < r) return null;
    const baseAngle = Math.atan2(dy, dx);
    const offsetAngle = Math.acos(r / dist);
    const a1 = baseAngle + offsetAngle;
    const a2 = baseAngle - offsetAngle;
    return {
        t1: {
            x: cx + r * Math.cos(a1),
            y: cy + r * Math.sin(a1)
        },
        t2: {
            x: cx + r * Math.cos(a2),
            y: cy + r * Math.sin(a2)
        }
    };
}

function getReflectedPoint(p, axisP, axisAngle) {
    const tx = p.x - axisP.x;
    const ty = p.y - axisP.y;
    const cos = Math.cos(-axisAngle);
    const sin = Math.sin(-axisAngle);
    const rx = tx * cos - ty * sin;
    const ry = tx * sin + ty * cos;
    const mirRx = rx;
    const mirRy = -ry;
    const cosB = Math.cos(axisAngle);
    const sinB = Math.sin(axisAngle);
    const finalX = mirRx * cosB - mirRy * sinB;
    const finalY = mirRx * sinB + mirRy * cosB;
    return {
        x: finalX + axisP.x,
        y: finalY + axisP.y
    };
}

function sortVertices(points, clockwise) {
    if (points.length < 2) return points;
    let cx = 0,
        cy = 0;
    points.forEach(p => {
        cx += p.x;
        cy += p.y;
    });
    cx /= points.length;
    cy /= points.length;
    points.sort((a, b) => {
        const angA = Math.atan2(a.y - cy, a.x - cx);
        const angB = Math.atan2(b.y - cy, b.x - cx);
        return clockwise ? (angA - angB) : (angB - angA);
    });
    let startIndex = 0;
    let minScore = Infinity;
    points.forEach((p, i) => {
        const score = p.y * 1000 + p.x;
        if (score < minScore) {
            minScore = score;
            startIndex = i;
        }
    });
    const sorted = [];
    for (let i = 0; i < points.length; i++) {
        sorted.push(points[(startIndex + i) % points.length]);
    }
    return sorted;
}

function reorderLabels(shape) {
    const labelIdsStr = shape.getAttribute('data-label-ids');
    if (!labelIdsStr) return;
    
    const ids = labelIdsStr.split(',');
    const pts = getTransformedPoints(shape);
    const domVerticesCount = pts.length;
    if (domVerticesCount === 0) return;

    // 將主要的頂點標籤與額外的標籤 (如交點) 分開處理
    const mainIds = ids.slice(0, domVerticesCount);
    const extraIds = ids.slice(domVerticesCount);
    
    // 取得畫面上真實的標籤元素
    let mainLabels =[];
    mainIds.forEach(id => {
        if (id) {
            const el = document.getElementById(id);
            if (el) mainLabels.push(el);
        }
    });
    if (mainLabels.length === 0) return;
    
    // 1. 將標籤按字母順序排列 (A, B, C...)
    mainLabels.sort((a, b) => a.textContent.localeCompare(b.textContent));
    
    // 2. 將頂點包裝，記住它們原本在 DOM 裡的「真實索引」
    let ptsWithIndex = pts.map((p, i) => ({ x: p.x, y: p.y, originalIndex: i }));
    
    // 3. 根據目前設定的方向 (順/逆時針) 對頂點進行幾何排序
    let sortedPts = sortVertices(ptsWithIndex, isLabelClockwise);
    
    // 4. 重新配對：排序後的第一個點配 A，第二個配 B... 
    // 並根據「真實索引」將標籤 ID 寫回新陣列中
    let newMainIds = new Array(domVerticesCount).fill('');
    sortedPts.forEach((pt, i) => {
        if (mainLabels[i]) {
            newMainIds[pt.originalIndex] = mainLabels[i].id;
        }
    });
    
    // 5. 【核心修復】將全新的對應陣列寫回 DOM 屬性，徹底覆蓋舊記憶
    const finalIds = [...newMainIds, ...extraIds];
    shape.setAttribute('data-label-ids', finalIds.join(','));
    
    // 6. 直接呼叫統一更新位置的函式，讓它根據新的 data-label-ids 就位
    if (typeof updateLabelPositions === 'function') {
        updateLabelPositions(shape);
    }
}

function getNextLabelName() {
    const currentName = indexToLabel(labelIndex);
    labelIndex++;
    updateLabelInput();
    return currentName;
}

function indexToLabel(idx) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const base = idx % 26;
    const suffixNum = Math.floor(idx / 26);
    const suffix = suffixNum > 0 ? suffixNum : "";
    return chars[base] + suffix;
}

function generateLabels(shape, force = false, colorOverride = null) {
    if (!force && !document.getElementById('auto-label-check').checked) return;
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    
    // 確保有 ID
    if (!shape.id) shape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
    const shapeId = shape.id;
    
    // 分開儲存：原始頂點 與 交點
    let vertices = [];
    let intersections =[];
    
    // 1. 取得原始幾何頂點 (端點/頂點)，並【核心修正】記錄真實的 DOM 索引
    if (subTool === 'circle' || tool === 'point') {
        let cx = parseFloat(shape.getAttribute('cx')) || 0;
        let cy = parseFloat(shape.getAttribute('cy')) || 0;
        const m = shape.getCTM();
        const p = {
            x: cx * m.a + cy * m.c + m.e,
            y: cx * m.b + cy * m.d + m.f
        };
        vertices.push({
            x: p.x,
            y: p.y,
            text: (tool === 'point' ? 'P' : 'O'),
            domIndex: 0
        });
    } else {
        vertices = getTransformedPoints(shape).map((p, i) => ({
            x: p.x,
            y: p.y,
            domIndex: i
        }));
    }
    
    const domVerticesCount = vertices.length; // 記住原本有幾個頂點

    if (subTool === 'sector' && vertices.length === 3) {
        vertices[1].text = 'O'; 
    }

    // 2. 排序「原始頂點」 (讓 A, B, C 順序符合幾何邏輯)
    if (tool !== 'point' && subTool !== 'circle' && vertices.length > 0) {
        vertices = sortVertices(vertices, isLabelClockwise);
    }

    // 3. 偵測交點
    if (tool !== 'point' && tool !== 'text' && tool !== 'math') {
        const rawIntersections = findIntersectionsForShape(shape);
        
        rawIntersections.forEach(ip => {
            const isDuplicateVertex = vertices.some(p => Math.hypot(p.x - ip.x, p.y - ip.y) < 5);
            const isDuplicateIntersection = intersections.some(p => Math.hypot(p.x - ip.x, p.y - ip.y) < 5);

            if (!isDuplicateVertex && !isDuplicateIntersection) {
                intersections.push({ x: ip.x, y: ip.y, text: null });
            }
        });
        
        if (intersections.length > 1) {
            intersections = sortVertices(intersections, isLabelClockwise);
        }
    }

    const combinedPoints = [...vertices, ...intersections];
    if (combinedPoints.length === 0) return;
    
    // 計算幾何中心
    let center = { x: 0, y: 0 };
    if (vertices.length > 0) {
        vertices.forEach(p => { center.x += p.x; center.y += p.y; });
        center.x /= vertices.length;
        center.y /= vertices.length;
    } else {
        combinedPoints.forEach(p => { center.x += p.x; center.y += p.y; });
        center.x /= combinedPoints.length;
        center.y /= combinedPoints.length;
    }
    
    // 調整標籤距離
    const labelSettings = window.getAutoLabelSettings ? window.getAutoLabelSettings() : { fontSize: 20, distance: 28, isBold: true };
    const offsetDist = labelSettings.distance; 
    
    const shapesLayer = document.getElementById('shapes-layer');
    let layerMatrix = null;
    try { layerMatrix = shapesLayer.getCTM().inverse(); } 
    catch (e) { layerMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }

    // 【核心修正】建立與 DOM 節點完全對應的 ID 陣列 (空字串代表該點沒有標籤)
    let domOrderedLabels = new Array(domVerticesCount).fill('');
    let extraLabels =[];
    const existingLabels = document.querySelectorAll('.vertex-label');

    // 5. 依序產生標籤
    combinedPoints.forEach((pt, i) => {
        let isAlreadyLabeled = false;
        for (let el of existingLabels) {
            if (el.getAttribute('data-owner-shape') === shapeId) continue;
            const ex = parseFloat(el.getAttribute('x'));
            const ey = parseFloat(el.getAttribute('y'));
            const dist = Math.hypot(ex - pt.x, ey - pt.y);
            if (dist < offsetDist + 10) { 
                isAlreadyLabeled = true;
                break;
            }
        }
        if (isAlreadyLabeled) return; 

        const labelText = pt.text || getNextLabelName();
        
        let dx = pt.x - center.x;
        let dy = pt.y - center.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        let ux = 0, uy = 0;
        if (len < 0.001) { ux = 0.707; uy = -0.707; } 
        else { ux = dx / len; uy = dy / len; }

        if (tool === 'line') {
            const temp = ux; ux = -uy; uy = temp;
        }

        const targetGlobalX = pt.x + ux * offsetDist;
        const targetGlobalY = pt.y + uy * offsetDist;
        
        const localX = targetGlobalX * layerMatrix.a + targetGlobalY * layerMatrix.c + layerMatrix.e;
        const localY = targetGlobalX * layerMatrix.b + targetGlobalY * layerMatrix.d + layerMatrix.f;
        
        const textEl = document.createElementNS(ns, "text");
        textEl.setAttribute("x", localX);
        textEl.setAttribute("y", localY);
        textEl.textContent = labelText;
        textEl.setAttribute("class", "shape vertex-label");
        textEl.setAttribute("data-owner-shape", shapeId);
		const finalColor = colorOverride || document.getElementById('stroke-color-select')?.value || "#c0392b";        textEl.style.textAnchor = "middle";
        textEl.style.dominantBaseline = "central";
        textEl.style.fontSize = labelSettings.fontSize + "px"; // 【替換】動態大小
        textEl.style.fill = finalColor;
        textEl.style.fontFamily = "Arial, sans-serif";
        textEl.style.fontWeight = labelSettings.isBold ? "bold" : "normal"; // 【替換】動態粗細
        textEl.style.cursor = "move";
        textEl.style.userSelect = "none";
        
        const newId = 'lbl-' + Date.now() + Math.random().toString(36).substr(2, 5);        textEl.id = newId;
        shapesLayer.appendChild(textEl);
        
        // 【核心修正】將標籤 ID 填入正確的對應陣列位置中
        if (pt.domIndex !== undefined) {
            domOrderedLabels[pt.domIndex] = newId;
        } else {
            extraLabels.push(newId);
        }
    });
    
    // 將陣列合併後寫入屬性
    const finalLabelIds = [...domOrderedLabels, ...extraLabels];
    shape.setAttribute('data-label-ids', finalLabelIds.join(','));
}


function recalculateLabelAssociations(shape) {
    const labelIds = shape.getAttribute('data-label-ids');
    if (!labelIds) return;
    
    // 【核心修正】這個函式被呼叫時，需要重組正確的 data-label-ids 陣列
    let labels =[];
    labelIds.split(',').forEach(id => {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) labels.push(el);
    });
    if (labels.length === 0) return;
    
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    const rotInfo = getTransformRotation(shape);
    let center = (rotInfo.angle !== 0) ? { x: rotInfo.cx, y: rotInfo.cy } : getShapeCenter(shape);
    
    let rawPoints =[];
    if (tool === 'line') {
        rawPoints.push({ x: +shape.getAttribute('x1'), y: +shape.getAttribute('y1') });
        rawPoints.push({ x: +shape.getAttribute('x2'), y: +shape.getAttribute('y2') });
    } else if (tool === 'polygon' || tool === 'angle') {
        const ptsStr = shape.getAttribute('points').trim().split(/\s+/);
        ptsStr.forEach(p => {
            const[x, y] = p.split(',');
            rawPoints.push({ x: +x, y: +y });
        });
    } else if (subTool === 'circle') {
        rawPoints.push({ x: +shape.getAttribute('cx'), y: +shape.getAttribute('cy') });
    }
    
    let visualVertices = rawPoints.map(p => {
        return rotatePoint(p.x, p.y, center.x, center.y, rotInfo.angle);
    });
    
    let newOrderedIds = [];
    let availableLabels = [...labels];
    
    visualVertices.forEach(v => {
        if (availableLabels.length === 0) {
            newOrderedIds.push(''); // 如果沒標籤了，補空字串維持陣列索引
            return;
        }
        let closestIndex = -1;
        let minDist = Infinity;
        availableLabels.forEach((lbl, idx) => {
            const lx = parseFloat(lbl.getAttribute('x'));
            const ly = parseFloat(lbl.getAttribute('y'));
            const dx = lx - v.x;
            const dy = ly - v.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = idx;
            }
        });
        if (closestIndex !== -1) {
            newOrderedIds.push(availableLabels[closestIndex].id);
            availableLabels.splice(closestIndex, 1);
        } else {
            newOrderedIds.push('');
        }
    });
    
    // 剩下的標籤 (交點標籤) 直接塞在陣列尾端
    availableLabels.forEach(lbl => newOrderedIds.push(lbl.id));
    shape.setAttribute('data-label-ids', newOrderedIds.join(','));
}

function updateLabelPositions(shape) {
    if (!shape || !shape.id) return;

    // 1. 取得物件最新的「全域」頂點座標 (這是依據 DOM 節點順序排列的)
    const pts = getTransformedPoints(shape);
    if (pts.length === 0) return;

    // 2. 讀取標籤 ID (此字串現在已保證與 DOM 節點順序對應)
    const labelIdsStr = shape.getAttribute('data-label-ids');
    if (!labelIdsStr) return; 
    
    const labelIds = labelIdsStr.split(',');

    // 3. 計算圖形幾何中心
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p.x; cy += p.y; });
    cx /= pts.length;
    cy /= pts.length;

    // 4. 根據每個頂點，計算標籤應該在的新位置
    // 【導入參數】
    const labelSettings = window.getAutoLabelSettings ? window.getAutoLabelSettings() : { distance: 28 };
    const offsetDist = labelSettings.distance; 

    // 嚴格依照索引映射標籤與點
    labelIds.forEach((id, i) => {
        if (!id) return; // 如果該索引沒有標籤 (空字串)，跳過
        
        const label = document.getElementById(id);
        if (!label) return;

        const pt = pts[i];
        if (!pt) return; // 如果標籤存在但沒有對應的點，則跳過
        
        let dx = pt.x - cx;
        let dy = pt.y - cy;
        const len = Math.hypot(dx, dy);
        
        let tx, ty;
        if (len < 0.01) { 
            // 若為單點或圓心，用等比例偏移
            tx = pt.x + offsetDist * 0.7; 
            ty = pt.y - offsetDist * 0.7; 
        } else {
            tx = pt.x + (dx / len) * offsetDist; 
            ty = pt.y + (dy / len) * offsetDist; 
        }
        
        try {
            const parent = label.parentNode;
            if (parent && parent.tagName.toLowerCase() === 'g') {
                const mInv = parent.getCTM().inverse();
                let p = svgCanvas.createSVGPoint(); p.x = tx; p.y = ty;
                p = p.matrixTransform(mInv);
                tx = p.x; ty = p.y;
            }
        } catch(e) {}
        
        label.setAttribute("x", tx);
        label.setAttribute("y", ty);
    });

    // 5. 更新依附在邊上的標記 (例如等長符號)
    const edgeMarks = document.querySelectorAll(`.mark-path[data-owner="${shape.id}"]`);
    edgeMarks.forEach(mark => {
        const edgeIdx = parseInt(mark.getAttribute('data-edge-index'));
        const type = mark.getAttribute('data-tool');
        if (!isNaN(edgeIdx) && pts[edgeIdx]) {
            const p1 = pts[edgeIdx];
            const p2 = pts[(edgeIdx + 1) % pts.length];
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
            
            if (type === 'mark-edge-symbol') {
                if (mark.tagName.toLowerCase() === 'text') {
                    const shouldRotate = mark.getAttribute('data-rotate') !== 'false';
                    let rot = shouldRotate ? angle : 0;
                    mark.setAttribute("transform", `translate(${mx}, ${my}) rotate(${rot})`);
                } else {
                    mark.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle})`);
                }
            }
        }
    });
}

function deleteLinkedLabels(shape) {
    const labelIds = shape.getAttribute('data-label-ids');
    if (labelIds) {
        labelIds.split(',').forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }
}
function createDimensionMark(p1, p2, ownerShape, edgeIndex = -1) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const defaultText = Math.round(length) + "cm";
    const angle = Math.atan2(dy, dx);
    
    let defaultStyle = 'curve';
    let pushDir = 1;
    
    if (ownerShape) {
        const viewMode = ownerShape.getAttribute('data-view-mode') || '3d';
        const tool = ownerShape.getAttribute('data-tool');
        const subTool = ownerShape.getAttribute('data-sub-tool');
        const isSolid3D = (tool === 'solid' || (tool === 'group' && subTool && subTool.startsWith('solid-'))) && viewMode === '3d';

        if (isSolid3D) {
            defaultStyle = 'standard'; // 【修正】：立體圖恢復為 standard (有標註線)
        } else if (tool === 'group' && subTool === 'circle-smart') {
            defaultStyle = 'curve';
        } else if (tool === 'ellipse' && subTool === 'circle') {
            defaultStyle = 'internal';
        } else if (tool === 'ellipse' && subTool === 'sector') {
            defaultStyle = 'curve';
        }
        
        // 判斷推移方向
        const bbox = ownerShape.getBBox();
        const m = ownerShape.getCTM();
        const localCx = bbox.x + bbox.width / 2;
        const localCy = bbox.y + bbox.height / 2;
        const cx = localCx * m.a + localCy * m.c + m.e;
        const cy = localCx * m.b + localCy * m.d + m.f;
        
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const vOutX = midX - cx;
        const vOutY = midY - cy;
        let nx = -Math.sin(angle);
        let ny = Math.cos(angle);
        
        if (Math.abs(vOutX) < 1 && Math.abs(vOutY) < 1) { 
             if (Math.abs(dy) < Math.abs(dx)) { if (ny > 0) pushDir = -1; } 
             else { if (nx < 0) pushDir = -1; }
        } else {
             if (nx * vOutX + ny * vOutY < 0) pushDir = -1;
        }
    }

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "shape group dimension");
    group.setAttribute("data-tool", "group");
    group.setAttribute("data-sub-tool", "dimension");
    group.setAttribute("data-dim-style", defaultStyle);
    group.setAttribute("data-offset", "20"); 
    
    // 寫入座標資料供控制點使用
    group.setAttribute("data-p1-x", p1.x);
    group.setAttribute("data-p1-y", p1.y);
    group.setAttribute("data-p2-x", p2.x);
    group.setAttribute("data-p2-y", p2.y);

    if (ownerShape) {
        if (!ownerShape.id) ownerShape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        group.setAttribute("data-owner", ownerShape.id);
        group.setAttribute("data-dependency-type", "dimension");
        group.setAttribute("data-edge-index", edgeIndex.toString());
        group.setAttribute("data-push-dir", pushDir.toString());
        group.setAttribute("data-fixed-angle", angle.toString());
    }

    const objTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    objTxt.textContent = defaultText;
    objTxt.style.cssText = `font-family: Arial; font-size: 12px; font-weight:bold; fill:#2980b9; stroke:none; text-anchor:middle; dominant-baseline:central; cursor:text;`;
    objTxt.setAttribute("class", "shape dimension-text");
    objTxt.setAttribute("data-tool", "text");
    group.appendChild(objTxt);

    document.getElementById('shapes-layer').appendChild(group);

    // 呼叫共用繪圖
    renderDimensionVisuals(group, p1, p2);
    
    saveState();

    if (isContinuousMarking) {
        if (typeof statusText !== 'undefined') statusText.innerText = "已標註，請繼續 (連續模式...)";
        deselectAll();
    } else {
        setMode('select');
        deselectAll();
        addToSelection(group);
    }

    openTextModal('text', objTxt);
    if(document.getElementById('edit-bar-title')) document.getElementById('edit-bar-title').innerText = "📐 長度標註";
    setTimeout(() => {
        const textArea = document.getElementById('edit-input-area');
        if (textArea) textArea.select();
    }, 150);
}

function createAngleMarkAt(A, B, C, ownerShape = null, customRadius = null) {
    const markType = currentAngleStyle;
    const angBA = Math.atan2(A.y - B.y, A.x - B.x);
    const angBC = Math.atan2(C.y - B.y, C.x - B.x);
    let diff = angBC - angBA;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const lenBA = Math.hypot(A.x - B.x, A.y - B.y);
    const lenBC = Math.hypot(C.x - B.x, C.y - B.y);
    let r = customRadius || Math.max(12, Math.min(40, Math.min(lenBA, lenBC) * 0.12));

    let vertexIdx = -1;
    if (ownerShape) {
        if (!ownerShape.id) ownerShape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        const pts = getTransformedPoints(ownerShape);
        let minD = Infinity;
        pts.forEach((p, i) => {
            const d = Math.hypot(p.x - B.x, p.y - B.y);
            if (d < minD) { minD = d; vertexIdx = i; }
        });
    }

    const deg = Math.round(Math.abs(diff * 180 / Math.PI));
    const isRightAngle = Math.abs(deg - 90) < 0.5;
    const isTextStyle = !['degree', 'arc', 'double-arc'].includes(markType);

    // 【導入參數】
    const settings = window.getAutoAngleSettings ? window.getAutoAngleSettings() : { arcRadius: 18, textOffset: 15, textOnlyDist: 15 };

    let markObj = null;

    if (isTextStyle) {
        const textDist = settings.textOnlyDist; // 【替換】純文字距離
        const midAngle = angBA + diff / 2;
        const tX = B.x + textDist * Math.cos(midAngle);
        const tY = B.y + textDist * Math.sin(midAngle);
        
        const textEl = document.createElementNS(ns, "text");
        textEl.setAttribute("x", tX);
        textEl.setAttribute("y", tY);
        textEl.textContent = markType;
        textEl.setAttribute("class", "shape angle-label-text"); 
        textEl.setAttribute("data-tool", "text"); 
        textEl.style.cssText = "font-size:16px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; cursor:move; font-weight:bold;";
        
        // 【關鍵修正】確保純文字角標獲得連動屬性
        if (ownerShape && ownerShape.id && vertexIdx !== -1) {
            textEl.setAttribute("data-owner-shape", ownerShape.id);
            textEl.setAttribute("data-owner-angle-shape", ownerShape.id); // 雙重保險
            textEl.setAttribute("data-dependency-type", "angle_mark");
            textEl.setAttribute("data-vertex-index", vertexIdx);
            textEl.setAttribute("data-angle-type", markType);
            textEl.setAttribute("data-radius-offset", r); // 記憶半徑
        }
        shapesLayer.appendChild(textEl);
        markObj = textEl;
    } 
    else {
        let d = "";
        if (isRightAngle) {
            const s = Math.max(8, r * 0.6);
            const u1 = { x: Math.cos(angBA), y: Math.sin(angBA) };
            const u2 = { x: Math.cos(angBC), y: Math.sin(angBC) };
            const p1 = { x: B.x + u1.x * s, y: B.y + u1.y * s };
            const p2 = { x: B.x + u2.x * s, y: B.y + u2.y * s };
            const p3 = { x: p1.x + p2.x - B.x, y: p1.y + p2.y - B.y };
            d = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`;
        } else {
            const startA = angBA;
            const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
            const sweep = diff > 0 ? 1 : 0;
            const pS = { x: B.x + r * Math.cos(startA), y: B.y + r * Math.sin(startA) };
            const pE = { x: B.x + r * Math.cos(startA + diff), y: B.y + r * Math.sin(startA + diff) };
            d = `M ${pS.x} ${pS.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${pE.x} ${pE.y}`;
            
            if (markType === 'double-arc') {
                const r2 = r + Math.max(3, r * 0.15);
                const pS2 = { x: B.x + r2 * Math.cos(startA), y: B.y + r2 * Math.sin(startA) };
                const pE2 = { x: B.x + r2 * Math.cos(startA + diff), y: B.y + r2 * Math.sin(startA + diff) };
                d += ` M ${pS2.x} ${pS2.y} A ${r2} ${r2} 0 ${largeArc} ${sweep} ${pE2.x} ${pE2.y}`;
            }
        }
        markObj = createMarkObject(d, "#c0392b", ownerShape);

        if (markType === 'degree' && !isRightAngle) {
            const dist = r + settings.textOffset; // 【替換】度數間距
            const midAngle = angBA + diff / 2;
            const textEl = document.createElementNS(ns, "text");
            textEl.setAttribute("x", B.x + dist * Math.cos(midAngle));
            textEl.setAttribute("y", B.y + dist * Math.sin(midAngle));
            textEl.textContent = `${deg}°`;
            textEl.setAttribute("class", "shape angle-label-text"); 
            textEl.setAttribute("data-tool", "text"); 
            textEl.style.cssText = "font-size:13px; fill:#c0392b; font-family:Arial; text-anchor:middle; dominant-baseline:central; cursor:text; font-weight:bold; paint-order:stroke; stroke:white; stroke-width:3px; stroke-linejoin:round;";
            
            // 【關鍵修正】確保文字獲得連動屬性與半徑記憶
            if (ownerShape && ownerShape.id && vertexIdx !== -1) {
                textEl.setAttribute("data-owner-shape", ownerShape.id); 
                textEl.setAttribute("data-owner-angle-shape", ownerShape.id);
                textEl.setAttribute("data-dependency-type", "angle_mark");
                textEl.setAttribute("data-vertex-index", vertexIdx);
                textEl.setAttribute("data-angle-type", "degree");
                textEl.setAttribute("data-radius-offset", r); // 記憶半徑
            }
            shapesLayer.appendChild(textEl);
        }
    }
    
    if (markObj && ownerShape && ownerShape.id && vertexIdx !== -1) {
        markObj.setAttribute("data-owner-shape", ownerShape.id);
        markObj.setAttribute("data-dependency-type", "angle_mark");
        markObj.setAttribute("data-vertex-index", vertexIdx);
        markObj.setAttribute("data-angle-type", markType);
        markObj.setAttribute("data-radius-offset", r); // 記憶半徑
    }
    if (ownerShape && typeof window.updateLockVisuals === 'function') {
        window.updateLockVisuals(ownerShape); // 確保後加的標記也會讀取鎖定狀態閃爍
    }	
    return markObj;
}

function getTransformedPoints(shape) {
    const rawPts = getShapePoints(shape);
    if (!rawPts || rawPts.length === 0) {
        return [];
    }

    // 2. 取得該物件當前的「全域變換矩陣」(Current Transformation Matrix)
    //    這個矩陣包含了所有 translate, rotate, scale 的疊加效果
    const m = shape.getCTM();
    if (!m) {
        return rawPts; // 如果無法取得矩陣，返回原始點以防出錯
    }

    // 3. 將每個原始點透過矩陣運算，轉換成全域座標
    return rawPts.map(p => {
        let pt = svgCanvas.createSVGPoint();
        pt.x = p.x;
        pt.y = p.y;
        pt = pt.matrixTransform(m);
        return { x: pt.x, y: pt.y };
    });
}

function createMathShape(asciiContent, x, y, color, fontSize = '24') {
    const fo = document.createElementNS(ns, "foreignObject");
    fo.setAttribute("x", x);
    fo.setAttribute("y", y);
    fo.setAttribute("width", "650"); // 放大初始寬度確保能正常折行
    fo.setAttribute("height", "50");
    fo.setAttribute("class", "shape math-obj");
    fo.setAttribute("data-tool", "math");
    fo.setAttribute("data-content", asciiContent);
    fo.setAttribute("data-font-size", fontSize);
    
    const div = document.createElement("div");
    div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    div.className = "math-content";
    
    div.style.fontSize = fontSize + "px";
    div.style.color = color;
    div.style.display = "inline-block";
    div.style.whiteSpace = "pre-wrap"; // 允許折行與保留空白
    
    // 呼叫智慧排版處理
    div.innerHTML = window.formatSmartMathText ? window.formatSmartMathText(asciiContent) : "`" + asciiContent + "`";
    
    fo.appendChild(div);
    shapesLayer.appendChild(fo);
    
    MathJax.typesetPromise([div]).then(() => {
        const svgs = div.querySelectorAll('svg');
        svgs.forEach(s => {
            s.style.width = "auto";
            s.style.height = "auto";
        });
        // 給一點緩衝時間確保 DOM 渲染排版完成
        setTimeout(() => {
            const w = div.offsetWidth;
            const h = div.offsetHeight;
            const finalW = w + 20;
            const finalH = h + 20;		
            fo.setAttribute("width", finalW);
            fo.setAttribute("height", finalH);
            
            // 將原本的 x, y (點擊點) 減去一半的寬高，達成置中效果
            fo.setAttribute("x", x - finalW / 2);
            fo.setAttribute("y", y - finalH / 2);
            saveState();
        }, 100);
    }).catch(err => console.error(err));
    
    return fo;
}

function createSmartFunction(type) {
    // 1. 自動檢查並繪製背景座標軸 (單例模式)
    if (!document.getElementById('axes-group')) {
        const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
        const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
        
        // [關鍵修正]：統一使用 Math.min(w, h) 來計算比例，確保與函數繪圖邏輯一致
        // 預設範圍 10，扣除邊距 100
        const range = 10;
        const scale = (Math.min(w, h) - 100) / (range * 2);
        
        // 參數說明: scale, range, minorStep, majorStep, labelStep, showGrid, type
        drawAxesInternal(scale, range, 1, 5, 5, true, 'xy');
		
		const svg = document.getElementById('svg-canvas');
        const gridBtn = document.getElementById('btn-toggle-grid');
        if (svg.classList.contains('grid-bg-css')) {
            svg.classList.remove('grid-bg-css');
            if (gridBtn) gridBtn.classList.remove('active');
        }
		
    }

    // 預設參數設定
    let params = {};
    const offset = Math.floor(Math.random() * 3); 

    if (type === 'linear') {
        params = { a: 1, b: offset };
    } else if (type === 'quadratic') {
        params = { a: 1, h: offset, k: 0 }; 
    }

    // 2. 建立函數路徑 Path
    const path = document.createElementNS(ns, "path");
    const pathId = 'func-' + Date.now();
    path.id = pathId;
    path.setAttribute("class", "shape smart-function");
    path.setAttribute("data-tool", "function");
    path.setAttribute("data-smart-type", type);
    path.setAttribute("data-params", JSON.stringify(params));
    path.style.cssText = "stroke:#e74c3c; stroke-width:3; fill:none; vector-effect:non-scaling-stroke; cursor:move;";
    path.setAttribute("clip-path", "url(#canvas-clip)"); 

    // 3. 建立關聯的數學式標籤
    const fo = document.createElementNS(ns, "foreignObject");
    const labelId = 'label-' + pathId;
    fo.id = labelId;
    fo.setAttribute("width", "400");
    fo.setAttribute("height", "60");
    fo.setAttribute("class", "shape math-obj no-pointer-events"); 
    fo.setAttribute("data-tool", "label-display");
    
    path.setAttribute("data-label-id", labelId);

    // 4. 將元素加入畫布
    const layer = document.getElementById('shapes-layer');
    layer.appendChild(path);
    layer.appendChild(fo);

    // 5. 初始計算與繪製
    updateSmartFunctionGraph(path);
    
    saveState();
    
    // 6. 選取它以顯示拉桿
    setMode('select');
    deselectAll();
    addToSelection(path);
    
    statusText.innerText = `已建立${type === 'linear' ? '一次' : '二次'}函數，請使用右側面板調整參數`;
}

/**
 * 【新增】清理暫存智慧函數的專用函式
 * @param {SVGElement} shape - 函數圖形的 <path> 元素
 */
function cleanupTemporaryFunction(shape) {
    // 確保傳入的是函數圖形本身
    if (!shape || !shape.classList.contains('smart-function')) {
        // 如果傳入的是標籤，反向查找圖形
        if (shape && shape.getAttribute('data-tool') === 'label-display') {
             const ownerPath = document.querySelector(`.smart-function[data-label-id="${shape.id}"]`);
             if (ownerPath) shape = ownerPath;
             else { shape.remove(); return; }
        } else {
            return;
        }
    }
    
    const labelId = shape.getAttribute('data-label-id');
    const labelEl = document.getElementById(labelId);
    
    // 從畫布移除
    if (labelEl) labelEl.remove();
    shape.remove();

    // 關閉面板並從選取中移除
    document.getElementById('smart-panel').style.display = 'none';
    removeFromSelection(shape); // utils.js 中的函式
    
    statusText.innerText = "已取消函數繪製";
    saveState();
}

function updateSmartFunctionGraph(shape) {
    const type = shape.getAttribute('data-smart-type');
    const params = JSON.parse(shape.getAttribute('data-params'));
    const labelId = shape.getAttribute('data-label-id');
    const labelEl = document.getElementById(labelId);
    const showFocus = shape.getAttribute('data-show-focus') === 'true';

    let range = 10;
    const axisGroup = document.getElementById('axes-group');
    if (axisGroup) {
        range = parseFloat(axisGroup.getAttribute('data-range')) || 10;
    }
    
	const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
	const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const cx = w / 2, cy = h / 2;
    const scale = (Math.min(w, h) - 100) / (range * 2);

    let d = "";
	let asciiContent = ""; // 改用 asciiContent
	
    if (type === 'linear_gen' || type === 'linear') {
        const func = (x) => params.a * x + params.b;
        const xMin = -range * 1.5, xMax = range * 1.5;
        const step = 1/scale;
        let started = false;
        for (let x = xMin; x <= xMax; x += step) {
            let y = func(x);
            if(Math.abs(y * scale) > h) { started = false; continue; }
            const px = cx + x * scale, py = cy - y * scale;
            if (!started) { d += `M ${px.toFixed(1)} ${py.toFixed(1)} `; started = true; }
            else { d += `L ${px.toFixed(1)} ${py.toFixed(1)} `; }
        }
        // 【核心修正點】：直接呼叫 ascii 函式
        asciiContent = STD_FUNCTIONS['linear_gen'].ascii(params);

    } else if (type === 'quadratic_vertex' || type === 'quadratic') {
        const func = (x) => params.a * Math.pow((x - params.h), 2) + params.k;
        const xMin = -range * 1.5, xMax = range * 1.5;
        const step = 1/scale;
        let started = false;
        for (let x = xMin; x <= xMax; x += step) {
            let y = func(x);
            if(Math.abs(y * scale) > h) { started = false; continue; }
            const px = cx + x * scale, py = cy - y * scale;
            if (!started) { d += `M ${px.toFixed(1)} ${py.toFixed(1)} `; started = true; }
            else { d += `L ${px.toFixed(1)} ${py.toFixed(1)} `; }
        }
        // 【核心修正點】：直接呼叫 ascii 函式
        asciiContent = STD_FUNCTIONS['quadratic_vertex'].ascii(params);
    
    } else {
        const config = STD_FUNCTIONS[type];
        if(config) {
             const xMin = -range * 1.5, xMax = range * 1.5;
             const step = 1/scale;
             let started = false;
             for (let x = xMin; x <= xMax; x += step) {
                let y = config.calc(x, params);
                if(isNaN(y) || Math.abs(y * scale) > h*2) { started = false; continue; }
                const px = cx + x * scale, py = cy - y * scale;
                if (!started) { d += `M ${px.toFixed(1)} ${py.toFixed(1)} `; started = true; }
                else { d += `L ${px.toFixed(1)} ${py.toFixed(1)} `; }
             }
             if (config.ascii) {
                 asciiContent = config.ascii(params);
             } else {
                 asciiContent = `y = ${config.formula}`;
             }
        }
    }
	
    shape.setAttribute('d', d);

    // 【核心修正點】：統一使用 ascii 函式渲染
    if (labelEl) {
        labelEl.innerHTML = `<div class="math-fixed-container">\`${asciiContent}\`</div>`;
        if (window.MathJax) {
            MathJax.typesetPromise([labelEl]).then(() => {
                setTimeout(() => {
                    const div = labelEl.querySelector('.math-fixed-container');
                    if(div) {
                        const lw = div.offsetWidth + 2; 
                        labelEl.setAttribute('width', lw);
                        labelEl.setAttribute('height', div.offsetHeight + 2);
                        labelEl.setAttribute('x', (parseFloat(svgCanvas.getAttribute('width')) || 800) - lw); 
                        labelEl.setAttribute('y', 0); 
                    }
                }, 50);
            });
        }
    }

    const oldAux = document.querySelectorAll(`.aux-focus[data-owner="${shape.id}"]`);
    oldAux.forEach(el => el.remove());
    if (type === 'quadratic' && showFocus) {
        const a = params.a;
        if (Math.abs(a) > 0.001) {
            const p = 1 / (4 * a);
            const focusX = cx + params.h * scale;
            const focusY = cy - (params.k + p) * scale;
            const directrixY = cy - (params.k - p) * scale;
            const focusDot = document.createElementNS(ns, "circle");
            focusDot.setAttribute("cx", focusX); focusDot.setAttribute("cy", focusY);
            focusDot.setAttribute("r", 4); focusDot.style.fill = "#e67e22";
            focusDot.setAttribute("class", "shape aux-focus");
            focusDot.setAttribute("data-owner", shape.id);
            focusDot.style.pointerEvents = "none";
            const directrixLine = document.createElementNS(ns, "line");
            directrixLine.setAttribute("x1", 0); directrixLine.setAttribute("y1", directrixY);
            directrixLine.setAttribute("x2", parseFloat(svgCanvas.getAttribute('width')) || 800); directrixLine.setAttribute("y2", directrixY);
            directrixLine.style.stroke = "#e67e22"; directrixLine.style.strokeWidth = 1;
            directrixLine.style.strokeDasharray = "5,5";
            directrixLine.setAttribute("class", "shape aux-focus");
            directrixLine.setAttribute("data-owner", shape.id);
            directrixLine.style.pointerEvents = "none";
            shape.parentNode.insertBefore(directrixLine, shape);
            shape.parentNode.appendChild(focusDot);
        }
    }
}

function confirmAxesSetup() {
    // 1. 先記住當前選取的函數 ID (如果是單選且為智慧函數)
    const selectedFunc = (selectedElements.length === 1 && selectedElements[0].classList.contains('smart-function')) ? selectedElements[0] : null;
    const selectedFuncId = selectedFunc ? selectedFunc.id : null;

    const rangeInput = document.getElementById('axis-range').value;
    const showGrid = document.getElementById('axis-show-grid').checked;
    const axisType = document.querySelector('input[name="axis-type"]:checked').value;
    const range = parseFloat(rangeInput);
    
    if (isNaN(range) || range <= 0) { showAlert("請輸入有效的範圍 (必須大於 0)");  return; }

    const getVal = (chkId, inpId) => {
        if (!document.getElementById(chkId).checked) return null;
        const v = parseFloat(document.getElementById(inpId).value);
        return (isNaN(v) || v <= 0) ? null : v;
    };
    const minorStep = getVal('chk-axis-minor', 'axis-step-minor');
    const majorStep = getVal('chk-axis-major', 'axis-step-major');
    const labelStep = getVal('chk-axis-label', 'axis-step-label');
    
    const settings = { axisType, range, minor: minorStep, major: majorStep, label: labelStep, showGrid };
    localStorage.setItem('math_editor_axis_settings', JSON.stringify(settings));
    closeAxesModal();

	const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
	const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const availableSize = Math.min(w - 100, h - 100);
    const scale = availableSize / (range * 2);
    
    // 2. 重繪座標軸 (這會導致所有物件被取消選取，並自動選取座標軸)
    drawAxesInternal(scale, range, minorStep, majorStep, labelStep, showGrid, axisType);

    // 3. 【關鍵修復】如果之前有選取函數，強制取消選取座標軸，改回選取函數
    if (selectedFuncId) {
        const elementToReselect = document.getElementById(selectedFuncId);
        if (elementToReselect) {
             deselectAll(); // 先取消 drawAxesInternal 選到的座標軸
             addToSelection(elementToReselect); // 重新選取函數 -> 觸發 renderPropertyPanel -> 面板出現
        }
    }
	
	redrawAllFunctions();
}

function toggleFuncAxisInputs(visible) {
    const ids = ['func-step-minor', 'func-step-major', 'func-step-label', 'chk-func-minor', 'chk-func-major', 'chk-func-label'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !visible;
    });
}


function finalizeSmartGraph(shape, keepGrid) {
    const isOldSmart = shape.hasAttribute('data-smart-type');
    const isNewStd = shape.getAttribute('data-func-mode') === 'standard';
    const params = JSON.parse(shape.getAttribute('data-params'));
    const labelId = shape.getAttribute('data-label-id');
    const labelEl = document.getElementById(labelId);

    // 1. 精確移除格線邏輯 (保留座標軸與數字)
    if (!keepGrid) {
        const axisGroup = document.getElementById('axes-group');
        if (axisGroup) {
            const grids = axisGroup.querySelectorAll('.grid-line, .real-grid-line');
            grids.forEach(g => g.remove());
            drawingArea.classList.remove('grid-bg-css');
            axisGroup.setAttribute('data-show-grid', 'false');
        }
    }

    // 移除輔助線
    const aux = document.querySelectorAll(`.aux-focus[data-owner="${shape.id}"]`);
    aux.forEach(el => el.remove());

    let finalMath = ""; 
    let funcCalc = null;
    let funcType = "";

    // 取得函數資訊
    if (isOldSmart) {
        funcType = shape.getAttribute('data-smart-type');
        finalMath = STD_FUNCTIONS[funcType === 'linear' ? 'linear_gen' : 'quadratic_vertex'].ascii(params);
        funcCalc = (x) => funcType === 'linear' ? (params.a * x + params.b) : (params.a * Math.pow((x - params.h), 2) + params.k);
    } else if (isNewStd) {
        funcType = shape.getAttribute('data-func-type');
        const config = STD_FUNCTIONS[funcType];
        if (config) {
            finalMath = config.ascii(params);
            funcCalc = (x) => config.calc(x, params);
        }
    }

    if (labelEl) labelEl.remove();

    if (finalMath && funcCalc) {
        const canvasWidth = parseFloat(svgCanvas.getAttribute('width')) || 800;
        
        // 加上反引號 ` ` 讓它被識別為真正的數學式
        const expression = finalMath.replace(/y\s*=\s*/, '');
        const mathStr = `\`y = ${expression}\``;

        // 建立數學式物件，設定字體 "18"，透明度設為 0 避免定位前的閃爍
        const newLabel = createMathShape(mathStr, canvasWidth - 100, 50, "#000000", "18");
        newLabel.style.opacity = "0"; 

        // 核心修正：等待 MathJax 渲染完成後重新計算位置
        setTimeout(() => {
            const div = newLabel.querySelector('.math-content');
            let finalW = 150;
            let finalH = 40;

            if (div) {
                // 暫時解除限制以取得真實內容寬度
                div.style.setProperty('width', 'max-content', 'important');
                finalW = div.offsetWidth + 15;
                finalH = div.offsetHeight + 10;
                div.style.setProperty('width', '100%', 'important');
            }

            // 更新外框尺寸
            newLabel.setAttribute('width', finalW);
            newLabel.setAttribute('height', finalH);

            // 【關鍵修改】：靠右對齊 (畫布寬度 - 物件寬度 - 20px 間距)
            const targetX = canvasWidth - finalW - 20;
            const targetY = 20; // 頂部留白 20px

            // 強制設定位置
            newLabel.setAttribute('x', targetX);
            newLabel.setAttribute('y', targetY);
            newLabel.removeAttribute('transform'); 
            
            // 定位完成後顯示並儲存狀態
            newLabel.style.opacity = "1";
            saveState();
        }, 350); // 給予足夠的渲染緩衝時間
    }

    // 清除智慧屬性
    shape.removeAttribute('data-smart-type');
    shape.removeAttribute('data-func-mode');
    shape.removeAttribute('data-func-type');
    shape.removeAttribute('data-params');
    shape.removeAttribute('data-label-id');
    shape.removeAttribute('data-snap');
    shape.removeAttribute('data-show-focus');
    shape.classList.remove('smart-function');
    shape.style.stroke = "#000000";
    shape.style.strokeWidth = "2";
    
    document.getElementById('smart-panel').style.display = 'none';
    deselectAll();
    addToSelection(shape);
}

function plotPointOnFunction(functionShape, xValue) {
    // 1. 檢查是否有座標軸 (保持不變)
    const axisGroup = document.getElementById('axes-group');
    if (!axisGroup) {
        showAlert("錯誤", "請先建立座標軸才能標示點位！");
        return;
    }

    // 2. 讀取座標軸與函數參數 (保持不變)
    const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const cx = w / 2, cy = h / 2;
    const range = parseFloat(axisGroup.getAttribute('data-range')) || 10;
    const scale = (Math.min(w, h) - 100) / (range * 2);

    const isOldSmart = functionShape.hasAttribute('data-smart-type');
    const funcType = isOldSmart 
        ? (functionShape.getAttribute('data-smart-type') === 'linear' ? 'linear_gen' : 'quadratic_vertex')
        : functionShape.getAttribute('data-func-type');
    
    const params = JSON.parse(functionShape.getAttribute('data-params'));
    const config = STD_FUNCTIONS[funcType];

    if (!config) {
        showAlert("錯誤", "找不到對應的函數定義。");
        return;
    }

    // 3. 計算座標 (保持不變)
    const yValue = config.calc(xValue, params);
    
    if (isNaN(yValue) || !isFinite(yValue)) {
        showAlert("計算錯誤", `x = ${xValue} 時，函數無定義或值無效。`);
        return;
    }

    const px = cx + xValue * scale;
    const py = cy - yValue * scale;

    // 4. 建立物件群組 (保持不變)
    const group = document.createElementNS(ns, "g");
    group.setAttribute("class", "shape group function-plot-point");
    group.setAttribute("data-tool", "group");
    group.setAttribute("data-owner-function-id", functionShape.id);
    
    // 5. 建立輔助物件 (核心修改處)
    const plotColor = "#e74c3c";
    const formatNum = (n) => parseFloat(n.toFixed(2));

    // -- 輔助函式：建立帶有點擊區的線段群組 --
    const createLineGroup = (x1, y1, x2, y2) => {
        const g = document.createElementNS(ns, "g");
        g.setAttribute("class", "shape");
        g.setAttribute("data-tool", "line");
        const hitLine = createSVGElement('line', { x1, y1, x2, y2, class: 'hit-line', style: "stroke:transparent; stroke-width:10; cursor:move;" });
        const visLine = createSVGElement('line', { x1, y1, x2, y2, class: 'visible-line plot-line', style: "pointer-events:none;" });
        g.appendChild(hitLine);
        g.appendChild(visLine);
        return g;
    };
    
    // -- 輔助函式：建立可被選取的文字物件 --
    const createTextObject = (x, y, textContent, anchor, baseline) => {
        const textEl = createSVGElement('text', { x, y, 'text-anchor': anchor, 'dominant-baseline': baseline, class: 'shape plot-label' });
        textEl.setAttribute("data-tool", "text"); // 讓它可以被雙擊編輯
        textEl.style.cursor = "move";
        textEl.textContent = textContent;
        return textEl;
    };

    // 物件 1: 函數圖形上的點 (本身就是可選取的 shape)
    const point = createSVGElement('circle', { cx: px, cy: py, r: 5, class: 'shape plot-point', 'data-tool': 'point', style: `fill:${plotColor}; stroke:white; stroke-width:1.5px; cursor:move;` });

    // 物件 2 & 3: 使用輔助函式建立的線段群組
    const vertLineGroup = createLineGroup(px, cy, px, py);
    const horzLineGroup = createLineGroup(cx, py, px, py);

    // 物件 4, 5, 6: 使用輔助函式建立的文字物件
    const xLabel = createTextObject(px, cy + 5, formatNum(xValue), 'middle', 'hanging');
    const yLabel = createTextObject(cx - 5, py, formatNum(yValue), 'end', 'middle');
    const coordLabel = createTextObject(px + 8, py - 8, `(${formatNum(xValue)}, ${formatNum(yValue)})`, 'start', 'auto');

    // 6. 將物件加入群組
    group.appendChild(vertLineGroup);
    group.appendChild(horzLineGroup);
    group.appendChild(xLabel);
    group.appendChild(yLabel);
    group.appendChild(point);
    group.appendChild(coordLabel);
    
    // 7. 新增至畫布並完成
    shapesLayer.appendChild(group);
    saveState();
    
    // 選取新建立的群組
    //deselectAll();
    //addToSelection(group);
    statusText.innerText = `已標示點 (${formatNum(xValue)}, ${formatNum(yValue)})`;
}