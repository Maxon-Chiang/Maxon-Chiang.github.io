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
    clean: (str) => str.replace(/\s+/g, ' ').replace(/\+ -/g, '- ').trim(),
    coef: (val, sym, isFirst = false) => {
        if (Math.abs(val) < 0.0001) return "";
        let prefix = "";
        if (val < 0) prefix = "-";
        else if (!isFirst) prefix = "+";
        let num = Math.abs(val);
        let numStr = (Math.abs(num - 1) < 0.0001) ? "" : parseFloat(num.toFixed(2));
        return `${prefix} ${numStr}${sym}`;
    },
    term: (val, isFirst = false) => {
        if (Math.abs(val) < 0.0001) return "";
        let prefix = "";
        if (val < 0) prefix = "-";
        else if (!isFirst) prefix = "+";
        return `${prefix} ${parseFloat(Math.abs(val).toFixed(2))}`;
    }
};
const STD_FUNCTIONS = {
    'linear_gen': {
        name: '一次函數', formula: 'ax+b',
        params: { a: 1, b: 0 },
        calc: (x, p) => p.a * x + p.b,
        ascii: (p) => mathFmt.clean(`y = ${mathFmt.coef(p.a, 'x', true)} ${mathFmt.term(p.b)}`),
        html: (p) => {
            const b = htmlFmt.analyze(p.b);
            return `y = ${htmlFmt.slot(p.a, 'a')}x ${htmlFmt.op(b.sign)} ${htmlFmt.slot(b.abs, 'b')}`;
        }
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
        calc: (x, p) => p.a * x * x + p.b * x + p.c,
        ascii: (p) => mathFmt.clean(`y = ${mathFmt.coef(p.a, 'x^2', true)} ${mathFmt.coef(p.b, 'x')} ${mathFmt.term(p.c)}`),
        html: (p) => {
            const b = htmlFmt.analyze(p.b);
            const c = htmlFmt.analyze(p.c);
            return `y = ${htmlFmt.slot(p.a, 'a')}x² ${htmlFmt.op(b.sign)} ${htmlFmt.slot(b.abs, 'b')}x ${htmlFmt.op(c.sign)} ${htmlFmt.slot(c.abs, 'c')}`;
        }
    },
    'cubic': {
        name: '三次函數', formula: 'ax^3+bx^2+cx+d',
        params: { a: 1, b: 0, c: 0, d: 0 },
        calc: (x, p) => p.a * x ** 3 + p.b * x ** 2 + p.c * x + p.d,
        ascii: (p) => mathFmt.clean(`y = ${mathFmt.coef(p.a, 'x^3', true)} ${mathFmt.coef(p.b, 'x^2')} ${mathFmt.coef(p.c, 'x')} ${mathFmt.term(p.d)}`),
        html: (p) => {
            const b = htmlFmt.analyze(p.b);
            const c = htmlFmt.analyze(p.c);
            const d = htmlFmt.analyze(p.d);
            return `y = ${htmlFmt.slot(p.a, 'a')}x³ ${htmlFmt.op(b.sign)} ${htmlFmt.slot(b.abs, 'b')}x² ${htmlFmt.op(c.sign)} ${htmlFmt.slot(c.abs, 'c')}x ${htmlFmt.op(d.sign)} ${htmlFmt.slot(d.abs, 'd')}`;
        }
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
            return `y = ${htmlFmt.slot(p.a, 'a')}sin(${htmlFmt.slot(p.b, 'b')}x ${htmlFmt.op(c.sign)} ${htmlFmt.slot(b.abs, 'c')}) ${htmlFmt.op(d.sign)} ${htmlFmt.slot(d.abs, 'd')}`;
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
            return `y = ${htmlFmt.slot(p.a, 'a')}cos(${htmlFmt.slot(p.b, 'b')}x ${htmlFmt.op(c.sign)} ${htmlFmt.slot(b.abs, 'c')}) ${htmlFmt.op(d.sign)} ${htmlFmt.slot(d.abs, 'd')}`;
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
            return `y = ${htmlFmt.slot(p.a, 'a')}tan(${htmlFmt.slot(p.b, 'b')}x ${htmlFmt.op(c.sign)} ${htmlFmt.slot(b.abs, 'c')}) ${htmlFmt.op(d.sign)} ${htmlFmt.slot(d.abs, 'd')}`;
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
        div.style.gap = '5px';
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
        const scale = (Math.min(w, h) - 100) / (range * 2);
        drawAxesInternal(scale, range, 1, 5, 5, true, 'xy');
        const svg = document.getElementById('svg-canvas');
        const gridBtn = document.getElementById('btn-toggle-grid');
        if (svg.classList.contains('grid-bg-css')) {
            svg.classList.remove('grid-bg-css');
            if (gridBtn) gridBtn.classList.remove('active');
        }
    }
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
function updateStandardFunctionGraph(shape) {
    const type = shape.getAttribute('data-func-type');
    const params = JSON.parse(shape.getAttribute('data-params'));
    const labelId = shape.getAttribute('data-label-id');
    const config = STD_FUNCTIONS[type];
    if (!config) return;
    let range = 10;
    const axisGroup = document.getElementById('axes-group');
    if (axisGroup) range = parseFloat(axisGroup.getAttribute('data-range')) || 10;
    const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const cx = w / 2, cy = h / 2;
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
    const labelEl = document.getElementById(labelId);
    if (labelEl) {
        let htmlContent = "";
        if (config.html) {
            htmlContent = config.html(params);
        } else {
            htmlContent = `<span style="font-family:monospace">${config.formula}</span>`;
        }
        labelEl.innerHTML = `<div class="math-fixed-container">${htmlContent}</div>`;
        setTimeout(() => {
            const div = labelEl.querySelector('.math-fixed-container');
            if (div) {
                const lw = div.offsetWidth + 2;
                const lh = div.offsetHeight + 2;
                labelEl.setAttribute('width', lw);
                labelEl.setAttribute('height', lh);
                labelEl.setAttribute('x', (parseFloat(svgCanvas.getAttribute('width')) || 800) - lw);
                labelEl.setAttribute('y', 0);
            }
        }, 0);
    }
}
function redrawAllFunctions() {
    document.querySelectorAll('.smart-function[data-smart-type]').forEach(el => {
        updateSmartFunctionGraph(el);
    });
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
    statusText.innerText = `已更新${typeName} (網格:${showGrid ? "開啟" : "關閉"}, 範圍:${rangeVal})`;
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
    if (!originLabel) {
        originLabel = document.createElementNS(ns, "text");
        originLabel.textContent = "O";
        originLabel.setAttribute("class", "shape");
        originLabel.setAttribute("data-tool", "text");
        originLabel.setAttribute("data-subtype", "origin-label");
        originLabel.style.cssText = "stroke: none; fill: #000; font-size: 24px; font-family: 'Times New Roman', serif; font-weight: bold; cursor: move;";
        originLabel.setAttribute('font-size', "24");
        shapesLayer.appendChild(originLabel);
    }
    originLabel.setAttribute("x", x);
    originLabel.setAttribute("y", y);
    originLabel.style.textAnchor = align;
}
function drawRealGrid() {
    const input = prompt("請輸入橫向總格數 (例如 20 代表橫向切成 20 格):", "20");
    if (!input) return;
    const count = parseInt(input);
    if (isNaN(count) || count <= 0) {
        showAlert("請輸入有效的數字");
        return;
    }
    const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const size = w / count;
    bgLayer.innerHTML = '';
    drawingArea.classList.remove('grid-bg-css');
    for (let x = size; x < w; x += size) {
        const l = document.createElementNS(ns, "line");
        l.setAttribute("x1", x);
        l.setAttribute("y1", 0);
        l.setAttribute("x2", x);
        l.setAttribute("y2", h);
        l.setAttribute("class", "real-grid-line");
        bgLayer.appendChild(l);
    }
    for (let y = size; y < h; y += size) {
        const l = document.createElementNS(ns, "line");
        l.setAttribute("x1", 0);
        l.setAttribute("y1", y);
        l.setAttribute("x2", w);
        l.setAttribute("y2", y);
        l.setAttribute("class", "real-grid-line");
        bgLayer.appendChild(l);
    }
    saveState();
    statusText.innerText = `已繪製方格紙：橫向 ${count} 格 (每格約 ${size.toFixed(1)} px)`;
}
function openFunctionModal() {
    const modal = document.getElementById('function-modal');
    if (!modal) return;
    modal.style.display = 'flex';
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
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
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
        circum: { x: circumX, y: circumY, r: R, A: p1, B: p2, C: p3 },
        in: { x: inX, y: inY, r: r, A: p1, B: p2, C: p3 },
        centroid: { x: centX, y: centY, A: p1, B: p2, C: p3 }
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
        t1: { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) },
        t2: { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) }
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
    return { x: finalX + axisP.x, y: finalY + axisP.y };
}
function rgbToHex(col) {
    if (!col) return null;
    if (col.startsWith('#')) return col;
    const rgb = col.match(/\d+/g);
    if (rgb && rgb.length === 3) {
        return "#" + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
    }
    return null;
}
function finalizeDimensionMark(labelContent) {
    const info = pendingDimensionInfo;
    if (!info) return;
    const { p1, p2, angle } = info;
    let nx = -Math.sin(angle);
    let ny = Math.cos(angle);
    function findShapeCenter(pA, pB) {
        const shapes = Array.from(shapesLayer.querySelectorAll('polygon, polyline, rect'));
        const tolerance = 1.0;
        for (let el of shapes) {
            const tag = el.tagName.toLowerCase();
            let center = null;
            let matchA = false, matchB = false;
            if (tag === 'polygon' || tag === 'polyline') {
                const pts = el.points;
                let sumX = 0, sumY = 0;
                for (let i = 0; i < pts.numberOfItems; i++) {
                    const pt = pts.getItem(i);
                    if (Math.abs(pt.x - pA.x) < tolerance && Math.abs(pt.y - pA.y) < tolerance) matchA = true;
                    if (Math.abs(pt.x - pB.x) < tolerance && Math.abs(pt.y - pB.y) < tolerance) matchB = true;
                    sumX += pt.x; sumY += pt.y;
                }
                if (matchA && matchB) { center = { x: sumX / pts.numberOfItems, y: sumY / pts.numberOfItems }; }
            } else if (tag === 'rect') {
                const rx = parseFloat(el.getAttribute('x'));
                const ry = parseFloat(el.getAttribute('y'));
                const rw = parseFloat(el.getAttribute('width'));
                const rh = parseFloat(el.getAttribute('height'));
                const corners = [{ x: rx, y: ry }, { x: rx + rw, y: ry }, { x: rx + rw, y: ry + rh }, { x: rx, y: ry + rh }];
                corners.forEach(c => {
                    if (Math.abs(c.x - pA.x) < tolerance && Math.abs(c.y - pA.y) < tolerance) matchA = true;
                    if (Math.abs(c.x - pB.x) < tolerance && Math.abs(c.y - pB.y) < tolerance) matchB = true;
                });
                if (matchA && matchB) { center = { x: rx + rw / 2, y: ry + rh / 2 }; }
            }
            if (center) return center;
        }
        return null;
    }
    const shapeCenter = findShapeCenter(p1, p2);
    if (shapeCenter) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const vOutX = midX - shapeCenter.x;
        const vOutY = midY - shapeCenter.y;
        const dotProduct = nx * vOutX + ny * vOutY;
        if (dotProduct < 0) { nx = -nx; ny = -ny; }
    } else {
        if (ny > 0.001 || (Math.abs(ny) < 0.001 && nx > 0)) { nx = -nx; ny = -ny; }
    }
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const offset = 20; const extOver = 5; const extGap = 5; const arrowLen = 6; const arrowW = 3;
    const lineColor = "#2980b9"; const textColor = "#2980b9"; const lineWidth = "1.2";
    const styleExtension = `stroke:${lineColor}; stroke-width:${lineWidth}; stroke-dasharray:2,2; fill:none; vector-effect:non-scaling-stroke;`;
    const styleLine = `stroke:${lineColor}; stroke-width:${lineWidth}; fill:none; vector-effect:non-scaling-stroke;`;
    const styleArrow = `stroke:${lineColor}; stroke-width:${lineWidth}; fill:${lineColor}; vector-effect:non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; stroke-dasharray: 4,2;`;
    const e1_s = { x: p1.x + nx * extGap, y: p1.y + ny * extGap };
    const e1_e = { x: p1.x + nx * (offset + extOver), y: p1.y + ny * (offset + extOver) };
    const e2_s = { x: p2.x + nx * extGap, y: p2.y + ny * extGap };
    const e2_e = { x: p2.x + nx * (offset + extOver), y: p2.y + ny * (offset + extOver) };
    const tip1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
    const tip2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
    const midX = (tip1.x + tip2.x) / 2;
    const midY = (tip1.y + tip2.y) / 2;
    const textGap = Math.max(15, (labelContent.length * 9) / 2 + 5);
    const shaft1_s = { x: midX - ux * textGap, y: midY - uy * textGap };
    const shaft2_s = { x: midX + ux * textGap, y: midY + uy * textGap };
    const group = document.createElementNS(ns, "g");
    group.setAttribute("class", "shape group dimension");
    group.setAttribute("data-tool", "group");
    group.setAttribute("data-sub-tool", "dimension");
    if (info.owner) {
        if (!info.owner.id) info.owner.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        group.setAttribute("data-owner", info.owner.id);
        group.setAttribute("data-dependency-type", "dimension");
    }
    function makeLine(pS, pE, style) {
        const el = document.createElementNS(ns, "line");
        el.setAttribute("x1", pS.x); el.setAttribute("y1", pS.y);
        el.setAttribute("x2", pE.x); el.setAttribute("y2", pE.y);
        el.setAttribute("class", "dimension-line");
        el.style.cssText = style;
        return el;
    }
    group.appendChild(makeLine(e1_s, e1_e, styleExtension));
    group.appendChild(makeLine(e2_s, e2_e, styleExtension));
    function makeArrowPath(shaftStart, tip, dirSign) {
        const backX = tip.x + (dirSign === -1 ? ux : -ux) * arrowLen;
        const backY = tip.y + (dirSign === -1 ? uy : -uy) * arrowLen;
        const w1x = backX + nx * arrowW, w1y = backY + ny * arrowW;
        const w2x = backX - nx * arrowW, w2y = backY - ny * arrowW;
        let d = `M ${shaftStart.x} ${shaftStart.y} L ${tip.x} ${tip.y} `;
        d += `M ${tip.x} ${tip.y} L ${w1x} ${w1y} L ${w2x} ${w2y} Z`;
        const el = document.createElementNS(ns, "path");
        el.setAttribute("d", d);
        el.style.cssText = styleArrow;
        return el;
    }
    group.appendChild(makeArrowPath(shaft1_s, tip1, -1));
    group.appendChild(makeArrowPath(shaft2_s, tip2, 1));
    let textRot = info.angle * 180 / Math.PI;
    if (textRot > 90) textRot -= 180;
    else if (textRot < -90) textRot += 180;
    const objTxt = document.createElementNS(ns, "text");
    objTxt.setAttribute("x", midX);
    objTxt.setAttribute("y", midY);
    objTxt.textContent = labelContent;
    objTxt.style.cssText = `font-family: Arial; font-size: 13px; font-weight:bold; fill:${textColor}; stroke:none; text-anchor:middle; dominant-baseline:central; cursor:move;`;
    objTxt.style.paintOrder = "stroke";
    objTxt.style.stroke = "white";
    objTxt.style.strokeWidth = "3px";
    objTxt.style.strokeLinecap = "butt";
    objTxt.style.strokeLinejoin = "miter";
    objTxt.setAttribute("transform", `rotate(${textRot}, ${midX}, ${midY})`);
    group.appendChild(objTxt);
    shapesLayer.appendChild(group);
    saveState();
    if (isContinuousMarking) {
        constructionStep = 0;
        tempConstructionSource = null;
        if (typeof statusText !== 'undefined') statusText.innerText = "已標註，請繼續 (連續模式...)";
        deselectAll();
    } else {
        setMode('select');
        deselectAll();
        addToSelection(group);
    }
    pendingDimensionInfo = null;
}
function sortVertices(points, clockwise) {
    if (points.length < 2) return points;
    let cx = 0, cy = 0;
    points.forEach(p => { cx += p.x; cy += p.y; });
    cx /= points.length; cy /= points.length;
    points.sort((a, b) => {
        const angA = Math.atan2(a.y - cy, a.x - cx);
        const angB = Math.atan2(b.y - cy, b.x - cx);
        return clockwise ? (angA - angB) : (angB - angA);
    });
    let startIndex = 0;
    let minScore = Infinity;
    points.forEach((p, i) => {
        const score = p.y * 1000 + p.x;
        if (score < minScore) { minScore = score; startIndex = i; }
    });
    const sorted = [];
    for (let i = 0; i < points.length; i++) {
        sorted.push(points[(startIndex + i) % points.length]);
    }
    return sorted;
}
function reorderLabels(shape) {
    const labelIds = shape.getAttribute('data-label-ids');
    if (!labelIds) return;
    const ids = labelIds.split(',');
    const labels = ids.map(id => document.getElementById(id)).filter(el => el);
    if (labels.length === 0) return;
    labels.sort((a, b) => a.textContent.localeCompare(b.textContent));
    let pts = getTransformedPoints(shape);
    pts = sortVertices(pts, isLabelClockwise);
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p.x; cy += p.y; });
    cx /= pts.length; cy /= pts.length;
    const offsetDist = 15;
    labels.forEach((lbl, i) => {
        if (pts[i]) {
            const pt = pts[i];
            let dx = pt.x - cx; let dy = pt.y - cy;
            const len = Math.sqrt(dx * dx + dy * dy);
            let offX = 0, offY = 0;
            if (len > 0) { offX = (dx / len) * offsetDist; offY = (dy / len) * offsetDist; }
            else { offX = 10; offY = -10; }
            lbl.setAttribute("x", pt.x + offX); lbl.setAttribute("y", pt.y + offY);
            lbl.style.textAnchor = "middle"; lbl.style.dominantBaseline = "central";
        }
    });
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
function generateLabels(shape, force = false) {
    if (!force && !document.getElementById('auto-label-check').checked) return;
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    if (!shape.id) shape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
    const shapeId = shape.id;
    let vertices = [];
    let intersections = [];
    if (subTool === 'circle' || tool === 'point') {
        let cx = parseFloat(shape.getAttribute('cx')) || 0;
        let cy = parseFloat(shape.getAttribute('cy')) || 0;
        const m = shape.getCTM();
        const p = { x: cx * m.a + cy * m.c + m.e, y: cx * m.b + cy * m.d + m.f };
        vertices.push({ x: p.x, y: p.y, text: (tool === 'point' ? 'P' : 'O') });
    } else { vertices = getTransformedPoints(shape); }
    if (subTool === 'sector' && vertices.length === 3) { vertices[1].text = 'O'; }
    if (tool !== 'point' && subTool !== 'circle' && vertices.length > 0) { vertices = sortVertices(vertices, isLabelClockwise); }
    if (tool !== 'point' && tool !== 'text' && tool !== 'math') {
        const rawIntersections = findIntersectionsForShape(shape);
        rawIntersections.forEach(ip => {
            const isDuplicateVertex = vertices.some(p => Math.hypot(p.x - ip.x, p.y - ip.y) < 5);
            const isDuplicateIntersection = intersections.some(p => Math.hypot(p.x - ip.x, p.y - ip.y) < 5);
            if (!isDuplicateVertex && !isDuplicateIntersection) { intersections.push({ x: ip.x, y: ip.y, text: null }); }
        });
        if (intersections.length > 1) { intersections = sortVertices(intersections, isLabelClockwise); }
    }
    const combinedPoints = [...vertices, ...intersections];
    if (combinedPoints.length === 0) return;
    let center = { x: 0, y: 0 };
    if (vertices.length > 0) {
        vertices.forEach(p => { center.x += p.x; center.y += p.y; });
        center.x /= vertices.length; center.y /= vertices.length;
    } else {
        combinedPoints.forEach(p => { center.x += p.x; center.y += p.y; });
        center.x /= combinedPoints.length; center.y /= combinedPoints.length;
    }
    const offsetDist = 28;
    const shapesLayer = document.getElementById('shapes-layer');
    let layerMatrix = null;
    try { layerMatrix = shapesLayer.getCTM().inverse(); } catch (e) { layerMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
    let labels = [];
    const existingLabels = document.querySelectorAll('.vertex-label');
    combinedPoints.forEach((pt, i) => {
        let isAlreadyLabeled = false;
        for (let el of existingLabels) {
            if (el.getAttribute('data-owner-shape') === shapeId) continue;
            const ex = parseFloat(el.getAttribute('x')); const ey = parseFloat(el.getAttribute('y'));
            const dist = Math.hypot(ex - pt.x, ey - pt.y);
            if (dist < offsetDist + 10) { isAlreadyLabeled = true; break; }
        }
        if (isAlreadyLabeled) return;
        const labelText = pt.text || getNextLabelName();
        let dx = pt.x - center.x; let dy = pt.y - center.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        let ux = 0, uy = 0;
        if (len < 0.001) { ux = 0.707; uy = -0.707; }
        else { ux = dx / len; uy = dy / len; }
        if (tool === 'line') { const temp = ux; ux = -uy; uy = temp; }
        const targetGlobalX = pt.x + ux * offsetDist;
        const targetGlobalY = pt.y + uy * offsetDist;
        const localX = targetGlobalX * layerMatrix.a + targetGlobalY * layerMatrix.c + layerMatrix.e;
        const localY = targetGlobalX * layerMatrix.b + targetGlobalY * layerMatrix.d + layerMatrix.f;
        const textEl = document.createElementNS(ns, "text");
        textEl.setAttribute("x", localX); textEl.setAttribute("y", localY);
        textEl.textContent = labelText;
        textEl.setAttribute("class", "shape vertex-label");
        textEl.setAttribute("data-owner-shape", shapeId);
        textEl.style.textAnchor = "middle"; textEl.style.dominantBaseline = "central";
        textEl.style.fontSize = "20px"; textEl.style.fill = "#c0392b";
        textEl.style.fontFamily = "Arial, sans-serif"; textEl.style.fontWeight = "bold";
        textEl.style.cursor = "move"; textEl.style.userSelect = "none";
        shapesLayer.appendChild(textEl);
        labels.push(textEl.id = 'lbl-' + Date.now() + Math.random().toString(36).substr(2, 5));
    });
    shape.setAttribute('data-label-ids', labels.join(','));
}
function recalculateLabelAssociations(shape) {
    const labelIds = shape.getAttribute('data-label-ids');
    if (!labelIds) return;
    let labels = [];
    labelIds.split(',').forEach(id => {
        const el = document.getElementById(id);
        if (el) labels.push(el);
    });
    if (labels.length === 0) return;
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    const rotInfo = getTransformRotation(shape);
    let center = (rotInfo.angle !== 0) ? { x: rotInfo.cx, y: rotInfo.cy } : getShapeCenter(shape);
    let rawPoints = [];
    if (tool === 'line') {
        rawPoints.push({ x: +shape.getAttribute('x1'), y: +shape.getAttribute('y1') });
        rawPoints.push({ x: +shape.getAttribute('x2'), y: +shape.getAttribute('y2') });
    } else if (tool === 'polygon' || tool === 'angle') {
        const ptsStr = shape.getAttribute('points').trim().split(/\s+/);
        ptsStr.forEach(p => { const [x, y] = p.split(','); rawPoints.push({ x: +x, y: +y }); });
    } else if (subTool === 'circle') {
        rawPoints.push({ x: +shape.getAttribute('cx'), y: +shape.getAttribute('cy') });
    }
    let visualVertices = rawPoints.map(p => { return rotatePoint(p.x, p.y, center.x, center.y, rotInfo.angle); });
    let newOrderedIds = [];
    let availableLabels = [...labels];
    visualVertices.forEach(v => {
        if (availableLabels.length === 0) return;
        let closestIndex = -1; let minDist = Infinity;
        availableLabels.forEach((lbl, idx) => {
            const lx = parseFloat(lbl.getAttribute('x')); const ly = parseFloat(lbl.getAttribute('y'));
            const dx = lx - v.x; const dy = ly - v.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) { minDist = dist; closestIndex = idx; }
        });
        if (closestIndex !== -1) { newOrderedIds.push(availableLabels[closestIndex].id); availableLabels.splice(closestIndex, 1); }
    });
    availableLabels.forEach(lbl => newOrderedIds.push(lbl.id));
    shape.setAttribute('data-label-ids', newOrderedIds.join(','));
}
function updateLabelPositions(shape) {
    if (!shape || !shape.id) return;
    const pts = getTransformedPoints(shape);
    if (pts.length === 0) return;
    let labelEls = [];
    const labelIds = shape.getAttribute('data-label-ids');
    if (labelIds) {
        labelIds.split(',').forEach(id => { const el = document.getElementById(id); if (el) labelEls.push(el); });
    } else { labelEls = Array.from(document.querySelectorAll(`.vertex-label[data-owner-shape="${shape.id}"]`)); }
    if (labelEls.length === 0) return;
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p.x; cy += p.y; });
    cx /= pts.length; cy /= pts.length;
    const offsetDist = 20;
    labelEls.forEach((label, i) => {
        if (!pts[i]) return;
        const pt = pts[i];
        let dx = pt.x - cx; let dy = pt.y - cy;
        const len = Math.hypot(dx, dy);
        let tx, ty;
        if (len < 0.01) { tx = pt.x + 15; ty = pt.y - 15; }
        else { tx = pt.x + (dx / len) * offsetDist; ty = pt.y + (dy / len) * offsetDist; }
        label.setAttribute("x", tx); label.setAttribute("y", ty);
    });
    const edgeMarks = document.querySelectorAll(`.mark-path[data-owner="${shape.id}"]`);
    edgeMarks.forEach(mark => {
        const edgeIdx = parseInt(mark.getAttribute('data-edge-index'));
        const type = mark.getAttribute('data-tool');
        if (!isNaN(edgeIdx) && pts[edgeIdx]) {
            const p1 = pts[edgeIdx]; const p2 = pts[(edgeIdx + 1) % pts.length];
            const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
            if (type === 'mark-edge-symbol') { mark.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle})`); }
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
function createDimensionMark(p1, p2, ownerShape) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const defaultText = Math.round(length) + "cm";
    pendingDimensionInfo = { p1, p2, length, angle: Math.atan2(dy, dx), owner: ownerShape };
    openTextModal('text', null);
    const textArea = document.getElementById('text-input-area');
    textArea.value = defaultText;
    document.querySelector('#text-modal .modal-header').innerText = "輸入尺寸標註文字";
    textArea.select();
}
function createAngleMarkAt(A, B, C, ownerShape = null, customRadius = null) {
    const markType = currentAngleStyle;
    const angBA = Math.atan2(A.y - B.y, A.x - B.x);
    const angBC = Math.atan2(C.y - B.y, C.x - B.x);
    let diff = angBC - angBA;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    const lenBA = Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
    const lenBC = Math.sqrt(Math.pow(C.x - B.x, 2) + Math.pow(C.y - B.y, 2));
    let r;
    if (customRadius) { r = customRadius; }
    else { r = Math.min(lenBA, lenBC) * 0.12; r = Math.max(12, Math.min(40, r)); }
    if (markType === 'text') {
        const midAng = angBA + diff / 2;
        const labelDist = r + 30;
        const labelPos = { x: B.x + labelDist * Math.cos(midAng), y: B.y + labelDist * Math.sin(midAng) };
        pendingLabelInfo = { type: 'angle', x: labelPos.x, y: labelPos.y, rotation: 0, owner: ownerShape, fontSize: 12 };
        openTextModal('math', null);
    }
    let d = "";
    if (markType === 'right') {
        const size = customRadius ? customRadius : Math.max(8, r * 0.6);
        const u1x = Math.cos(angBA), u1y = Math.sin(angBA);
        const u2x = Math.cos(angBC), u2y = Math.sin(angBC);
        const p1 = { x: B.x + u1x * size, y: B.y + u1y * size };
        const p2 = { x: B.x + u2x * size, y: B.y + u2y * size };
        const p3 = { x: p1.x + p2.x - B.x, y: p1.y + p2.y - B.y };
        d = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`;
    } else {
        const startA = angBA;
        const endA = angBA + diff;
        const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
        const sweep = diff > 0 ? 1 : 0;
        const pStart = { x: B.x + r * Math.cos(startA), y: B.y + r * Math.sin(startA) };
        const pEnd = { x: B.x + r * Math.cos(endA), y: B.y + r * Math.sin(endA) };
        d = `M ${pStart.x} ${pStart.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${pEnd.x} ${pEnd.y}`;
        if (markType === 'double-arc') {
            const gap = Math.max(3, r * 0.15);
            const r2 = r + gap;
            const pStart2 = { x: B.x + r2 * Math.cos(startA), y: B.y + r2 * Math.sin(startA) };
            const pEnd2 = { x: B.x + r2 * Math.cos(endA), y: B.y + r2 * Math.sin(endA) };
            d += ` M ${pStart2.x} ${pStart2.y} A ${r2} ${r2} 0 ${largeArc} ${sweep} ${pEnd2.x} ${pEnd2.y}`;
        }
    }
    return createMarkObject(d, "#c0392b", ownerShape);
}
function getTransformedPoints(shape) {
    const rawPts = getShapePoints(shape);
    if (!rawPts || rawPts.length === 0) return [];
    const m = shape.getCTM();
    if (!m) return rawPts;
    return rawPts.map(p => {
        let pt = svgCanvas.createSVGPoint();
        pt.x = p.x; pt.y = p.y;
        pt = pt.matrixTransform(m);
        return { x: pt.x, y: pt.y };
    });
}
function createMathShape(asciiContent, x, y, color, fontSize = '24') {
    const fo = document.createElementNS(ns, "foreignObject");
    fo.setAttribute("x", x); fo.setAttribute("y", y); fo.setAttribute("width", "100"); fo.setAttribute("height", "50");
    fo.setAttribute("class", "shape math-obj"); fo.setAttribute("data-tool", "math");
    fo.setAttribute("data-content", asciiContent); fo.setAttribute("data-font-size", fontSize);
    const div = document.createElement("div");
    div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml"); div.className = "math-content";
    div.style.fontSize = fontSize + "px"; div.style.color = color;
    div.style.display = "inline-block"; div.style.whiteSpace = "nowrap";
    div.innerHTML = "`" + asciiContent + "`";
    fo.appendChild(div);
    shapesLayer.appendChild(fo);
    MathJax.typesetPromise([div]).then(() => {
        const svgs = div.querySelectorAll('svg');
        svgs.forEach(s => { s.style.width = "auto"; s.style.height = "auto"; });
        const w = div.offsetWidth; const h = div.offsetHeight;
        const finalW = w + 20; const finalH = h + 20;
        fo.setAttribute("width", finalW); fo.setAttribute("height", finalH);
        fo.setAttribute("x", x - finalW / 2); fo.setAttribute("y", y - finalH / 2);
        saveState();
    }).catch(err => console.error(err));
    return fo;
}
function createSmartFunction(type) {
    if (!document.getElementById('axes-group')) {
        const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
        const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
        const range = 10;
        const scale = (Math.min(w, h) - 100) / (range * 2);
        drawAxesInternal(scale, range, 1, 5, 5, true, 'xy');
        const svg = document.getElementById('svg-canvas');
        const gridBtn = document.getElementById('btn-toggle-grid');
        if (svg.classList.contains('grid-bg-css')) {
            svg.classList.remove('grid-bg-css');
            if (gridBtn) gridBtn.classList.remove('active');
        }
    }
    let params = {};
    const offset = Math.floor(Math.random() * 3);
    if (type === 'linear') { params = { a: 1, b: offset }; }
    else if (type === 'quadratic') { params = { a: 1, h: offset, k: 0 }; }
    const path = document.createElementNS(ns, "path");
    const pathId = 'func-' + Date.now();
    path.id = pathId;
    path.setAttribute("class", "shape smart-function");
    path.setAttribute("data-tool", "function");
    path.setAttribute("data-smart-type", type);
    path.setAttribute("data-params", JSON.stringify(params));
    path.style.cssText = "stroke:#e74c3c; stroke-width:3; fill:none; vector-effect:non-scaling-stroke; cursor:move;";
    path.setAttribute("clip-path", "url(#canvas-clip)");
    const fo = document.createElementNS(ns, "foreignObject");
    const labelId = 'label-' + pathId;
    fo.id = labelId;
    fo.setAttribute("width", "400"); fo.setAttribute("height", "60");
    fo.setAttribute("class", "shape math-obj no-pointer-events");
    fo.setAttribute("data-tool", "label-display");
    path.setAttribute("data-label-id", labelId);
    const layer = document.getElementById('shapes-layer');
    layer.appendChild(path);
    layer.appendChild(fo);
    updateSmartFunctionGraph(path);
    saveState();
    setMode('select');
    deselectAll();
    addToSelection(path);
    statusText.innerText = `已建立${type === 'linear' ? '一次' : '二次'}函數，請使用右側面板調整參數`;
}
function cleanupTemporaryFunction(shape) {
    if (!shape || !shape.classList.contains('smart-function')) {
        if (shape && shape.getAttribute('data-tool') === 'label-display') {
            const ownerPath = document.querySelector(`.smart-function[data-label-id="${shape.id}"]`);
            if (ownerPath) shape = ownerPath;
            else { shape.remove(); return; }
        } else { return; }
    }
    const labelId = shape.getAttribute('data-label-id');
    const labelEl = document.getElementById(labelId);
    if (labelEl) labelEl.remove();
    shape.remove();
    document.getElementById('smart-panel').style.display = 'none';
    removeFromSelection(shape);
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
    if (axisGroup) { range = parseFloat(axisGroup.getAttribute('data-range')) || 10; }
    const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
    const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
    const cx = w / 2, cy = h / 2;
    const scale = (Math.min(w, h) - 100) / (range * 2);
    let d = "";
    let htmlContent = "";
    if (type === 'linear_gen' || type === 'linear') {
        const func = (x) => params.a * x + params.b;
        const xMin = -range * 1.5, xMax = range * 1.5;
        const step = 1 / scale;
        let started = false;
        for (let x = xMin; x <= xMax; x += step) {
            let y = func(x);
            if (Math.abs(y * scale) > h) { started = false; continue; }
            const px = cx + x * scale, py = cy - y * scale;
            if (!started) { d += `M ${px.toFixed(1)} ${py.toFixed(1)} `; started = true; }
            else { d += `L ${px.toFixed(1)} ${py.toFixed(1)} `; }
        }
        const b = htmlFmt.analyze(params.b);
        htmlContent = `y = ${htmlFmt.slot(params.a, 'a')} x ${htmlFmt.op(b.sign)} ${htmlFmt.slot(b.abs, 'b')}`;
    } else if (type === 'quadratic_vertex' || type === 'quadratic') {
        const func = (x) => params.a * Math.pow((x - params.h), 2) + params.k;
        const xMin = -range * 1.5, xMax = range * 1.5;
        const step = 1 / scale;
        let started = false;
        for (let x = xMin; x <= xMax; x += step) {
            let y = func(x);
            if (Math.abs(y * scale) > h) { started = false; continue; }
            const px = cx + x * scale, py = cy - y * scale;
            if (!started) { d += `M ${px.toFixed(1)} ${py.toFixed(1)} `; started = true; }
            else { d += `L ${px.toFixed(1)} ${py.toFixed(1)} `; }
        }
        const hSign = params.h >= 0 ? "-" : "+";
        const valH = Math.abs(params.h);
        const k = htmlFmt.analyze(params.k);
        htmlContent = `y = ${htmlFmt.slot(params.a, 'a')} (x ${htmlFmt.op(hSign)} ${htmlFmt.slot(valH, 'h')})² ${htmlFmt.op(k.sign)} ${htmlFmt.slot(k.abs, 'k')}`;
    } else {
        const config = STD_FUNCTIONS[type];
        if (config) {
            const xMin = -range * 1.5, xMax = range * 1.5;
            const step = 1 / scale;
            let started = false;
            for (let x = xMin; x <= xMax; x += step) {
                let y = config.calc(x, params);
                if (isNaN(y) || Math.abs(y * scale) > h * 2) { started = false; continue; }
                const px = cx + x * scale, py = cy - y * scale;
                if (!started) { d += `M ${px.toFixed(1)} ${py.toFixed(1)} `; started = true; }
                else { d += `L ${px.toFixed(1)} ${py.toFixed(1)} `; }
            }
            if (config.html) { htmlContent = config.html(params); }
            else { htmlContent = `<span style="font-family:monospace; font-size:20px;">y = ${config.formula}</span>`; }
        }
    }
    shape.setAttribute('d', d);
    if (labelEl) {
        labelEl.innerHTML = `<div class="math-fixed-container">${htmlContent}</div>`;
        setTimeout(() => {
            const div = labelEl.querySelector('.math-fixed-container');
            if (div) {
                const lw = div.offsetWidth + 2;
                labelEl.setAttribute('width', lw);
                labelEl.setAttribute('height', div.offsetHeight + 2);
                labelEl.setAttribute('x', (parseFloat(svgCanvas.getAttribute('width')) || 800) - lw);
                labelEl.setAttribute('y', 0);
            }
        }, 0);
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
    const selectedFunc = (selectedElements.length === 1 && selectedElements[0].classList.contains('smart-function')) ? selectedElements[0] : null;
    const selectedFuncId = selectedFunc ? selectedFunc.id : null;
    const rangeInput = document.getElementById('axis-range').value;
    const showGrid = document.getElementById('axis-show-grid').checked;
    const axisType = document.querySelector('input[name="axis-type"]:checked').value;
    const range = parseFloat(rangeInput);
    if (isNaN(range) || range <= 0) { showAlert("請輸入有效的範圍 (必須大於 0)"); return; }
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
    drawAxesInternal(scale, range, minorStep, majorStep, labelStep, showGrid, axisType);
    if (selectedFuncId) {
        const elementToReselect = document.getElementById(selectedFuncId);
        if (elementToReselect) {
            deselectAll();
            addToSelection(elementToReselect);
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
    if (!keepGrid) {
        const axisGroup = document.getElementById('axes-group');
        if (axisGroup) {
            const grids = axisGroup.querySelectorAll('.grid-line, .real-grid-line');
            grids.forEach(g => g.remove());
            drawingArea.classList.remove('grid-bg-css');
            axisGroup.setAttribute('data-show-grid', 'false');
        }
    }
    const aux = document.querySelectorAll(`.aux-focus[data-owner="${shape.id}"]`);
    aux.forEach(el => el.remove());
    let finalMath = "";
    let funcCalc = null;
    let funcType = "";
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
        const expression = finalMath.replace(/y\s*=\s*/, '');
        const newLabel = createMathShape(`y = ${expression}`, canvasWidth - 50, 5, "#000000");
        newLabel.style.opacity = "0";
        setTimeout(() => {
            const bbox = newLabel.getBBox();
            const targetX = canvasWidth - bbox.width - 15;
            const targetY = 5;
            newLabel.setAttribute('x', targetX);
            newLabel.setAttribute('y', targetY);
            newLabel.removeAttribute('transform');
            newLabel.style.opacity = "1";
            saveState();
        }, 100);
    }
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
    const axisGroup = document.getElementById('axes-group');
    if (!axisGroup) { showAlert("錯誤", "請先建立座標軸才能標示點位！"); return; }
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
    if (!config) { showAlert("錯誤", "找不到對應的函數定義。"); return; }
    const yValue = config.calc(xValue, params);
    if (isNaN(yValue) || !isFinite(yValue)) { showAlert("計算錯誤", `x = ${xValue} 時，函數無定義或值無效。`); return; }
    const px = cx + xValue * scale;
    const py = cy - yValue * scale;
    const group = document.createElementNS(ns, "g");
    group.setAttribute("class", "shape group function-plot-point");
    group.setAttribute("data-tool", "group");
    group.setAttribute("data-owner-function-id", functionShape.id);
    const plotColor = "#e74c3c";
    const formatNum = (n) => parseFloat(n.toFixed(2));
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
    const createTextObject = (x, y, textContent, anchor, baseline) => {
        const textEl = createSVGElement('text', { x, y, 'text-anchor': anchor, 'dominant-baseline': baseline, class: 'shape plot-label' });
        textEl.setAttribute("data-tool", "text");
        textEl.style.cursor = "move";
        textEl.textContent = textContent;
        return textEl;
    };
    const point = createSVGElement('circle', { cx: px, cy: py, r: 5, class: 'shape plot-point', 'data-tool': 'point', style: `fill:${plotColor}; stroke:white; stroke-width:1.5px; cursor:move;` });
    const vertLineGroup = createLineGroup(px, cy, px, py);
    const horzLineGroup = createLineGroup(cx, py, px, py);
    const xLabel = createTextObject(px, cy + 5, formatNum(xValue), 'middle', 'hanging');
    const yLabel = createTextObject(cx - 5, py, formatNum(yValue), 'end', 'middle');
    const coordLabel = createTextObject(px + 8, py - 8, `(${formatNum(xValue)}, ${formatNum(yValue)})`, 'start', 'auto');
    group.appendChild(vertLineGroup);
    group.appendChild(horzLineGroup);
    group.appendChild(xLabel);
    group.appendChild(yLabel);
    group.appendChild(point);
    group.appendChild(coordLabel);
    shapesLayer.appendChild(group);
    saveState();
    statusText.innerText = `已標示點 (${formatNum(xValue)}, ${formatNum(yValue)})`;
}