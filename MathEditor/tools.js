const SHAPE_PARAMS = {
    'point': {
        title: '繪製點',
        inputs: [{
            id: 'p_x',
            label: 'X 座標',
            default: 0
        }, {
            id: 'p_y',
            label: 'Y 座標',
            default: 0
        }]
    },
    'line': {
        title: '繪製線段',
        inputs: [{
            id: 'p_len',
            label: '長度',
            default: 200
        }, {
            id: 'p_ang',
            label: '角度 (°)',
            default: 0
        }]
    },
    'ray': {
        title: '繪製射線',
        inputs: [{
            id: 'p_len',
            label: '長度 (顯示)',
            default: 200
        }, {
            id: 'p_ang',
            label: '角度 (°)',
            default: 45
        }]
    },
    'segment': {
        title: '繪製線段',
        inputs: [{
            id: 'p_len',
            label: '長度',
            default: 200
        }, {
            id: 'p_ang',
            label: '角度 (°)',
            default: 0
        }]
    },
    'arrow': {
        title: '繪製箭頭',
        inputs: [{
            id: 'p_len',
            label: '長度',
            default: 200
        }, {
            id: 'p_ang',
            label: '角度 (°)',
            default: 0
        }]
    },
    'angle': {
        title: '繪製角度',
        inputs: [{
            id: 'p_deg',
            label: '角度 (°)',
            default: 45
        }]
    },
    'triangle': {
        title: '繪製三角形 (SAS)',
        inputs: [{
            id: 'p_base',
            label: '底邊長',
            default: 200
        }, {
            id: 'p_la',
            label: '左底角 (°)',
            default: 45
        }, {
            id: 'p_ra',
            label: '右底角 (°)',
            default: 45
        }]
    },
    'right_triangle': {
        title: '直角三角形',
        inputs: [{
            id: 'p_w',
            label: '底邊',
            default: 150
        }, {
            id: 'p_h',
            label: '高',
            default: 100
        }]
    },
    'rect': {
        title: '繪製矩形',
        inputs: [{
            id: 'p_w',
            label: '寬度',
            default: 200
        }, {
            id: 'p_h',
            label: '高度',
            default: 100
        }]
    },
    'square': {
        title: '繪製正方形',
        inputs: [{
            id: 'p_w',
            label: '邊長',
            default: 150
        }]
    },
    'parallelogram': {
        title: '平行四邊形',
        inputs: [{
            id: 'p_w',
            label: '底邊長',
            default: 200
        }, {
            id: 'p_h',
            label: '高度',
            default: 100
        }, {
            id: 'p_ang',
            label: '底角 (°)',
            default: 60
        }]
    },
    'trapezoid': {
        title: '繪製梯形',
        inputs: [{
            id: 'p_top',
            label: '上底',
            default: 100
        }, {
            id: 'p_bottom',
            label: '下底',
            default: 200
        }, {
            id: 'p_h',
            label: '高',
            default: 100
        }]
    },
    'kite': {
        title: '繪製箏形',
        inputs: [{
            id: 'p_w',
            label: '寬度 (對角線)',
            default: 150
        }, {
            id: 'p_h1',
            label: '上高',
            default: 50
        }, {
            id: 'p_h2',
            label: '下高',
            default: 150
        }]
    },
    'circle': {
        title: '繪製圓形',
        inputs: [{
            id: 'p_r',
            label: '半徑',
            default: 80
        }, {
            id: 'p_show_center',
            label: '繪製圓心 (O)',
            type: 'checkbox',
            default: true
        }, {
            id: 'p_show_line',
            label: '輔助線',
            type: 'radio',
            default: 'none',
            options: [
                { value: 'none', text: '無' },
                { value: 'radius', text: '半徑' },
                { value: 'diameter', text: '直徑' }
            ]
        }]
    },
    'ellipse': {
        title: '繪製橢圓',
        inputs: [{
            id: 'p_rx',
            label: '半徑 X',
            default: 100
        }, {
            id: 'p_ry',
            label: '半徑 Y',
            default: 60
        }]
    },
    'arc': {
        title: '繪製圓弧 (逆時針)',
        inputs: [
            { id: 'p_r', label: '半徑', default: 100 },
            { id: 'p_start', label: '起始角 (°)', default: 0 },
            { id: 'p_end', label: '結束角 (°)', default: 90 }
        ]
    },
    'circular_segment': {
        title: '繪製弓形 (逆時針)',
        inputs: [{
            id: 'p_r',
            label: '半徑',
            default: 100
        }, {
            id: 'p_start',
            label: '起始角 (°)',
            default: 0
        }, {
            id: 'p_end',
            label: '結束角 (°)',
            default: 90
        }]
    },
    'sector': {
        title: '繪製扇形 (逆時針)',
        inputs: [{
            id: 'p_r',
            label: '半徑',
            default: 100
        }, {
            id: 'p_start',
            label: '起始角 (°)',
            default: 0
        }, {
            id: 'p_end',
            label: '結束角 (°)',
            default: 60
        }]
    },
    'polygon': {
        title: '正多邊形',
        inputs: [{
            id: 'p_n',
            label: '邊數 n',
            default: 5
        }, {
            id: 'p_r',
            label: '半徑',
            default: 100
        }, {
            id: 'p_diagonals',
            label: '繪製對角線',
            type: 'checkbox',
            default: false
        }]
    },
    'star': {
        title: '繪製正多角星',
        inputs: [{
            id: 'p_n',
            label: '頂點數 n (常用: 5)',
            default: 5
        }, {
            id: 'p_r',
            label: '外接圓半徑',
            default: 100
        }]
    },
    'solid': {
        title: '繪製長方體',
        inputs: [{
            id: 'p_w',
            label: '寬度 X',
            default: 100
        }, {
            id: 'p_h',
            label: '高度 Y',
            default: 80
        }, {
            id: 'p_d',
            label: '深度 Z',
            default: 50
        }]
    },
    'cylinder': {
        title: '繪製圓柱',
        inputs: [{
            id: 'p_r',
            label: '底圓半徑',
            default: 60
        }, {
            id: 'p_h',
            label: '柱高',
            default: 150
        }]
    },
    'cone': {
        title: '繪製圓錐',
        inputs: [{
            id: 'p_r',
            label: '底圓半徑',
            default: 60
        }, {
            id: 'p_h',
            label: '錐高',
            default: 150
        }]
    },
    'boxplot': {
        title: '繪製盒狀圖',
        inputs: [{
            id: 'p_min',
            label: '最小值 (Min)',
            default: 0
        }, {
            id: 'p_q1',
            label: '第一四分位 (Q1)',
            default: 50
        }, {
            id: 'p_med',
            label: '中位數 (Median)',
            default: 100
        }, {
            id: 'p_q3',
            label: '第三四分位 (Q3)',
            default: 150
        }, {
            id: 'p_max',
            label: '最大值 (Max)',
            default: 200
        }]
    },
    'parabola': {
        title: '二次函數 (y = ax²)',
        inputs: [{
            id: 'p_a',
            label: '開口係數 a (正開口上)',
            default: 0.01
        }, {
            id: 'p_w',
            label: '顯示寬度',
            default: 300
        }]
    },
    'histogram': {
        title: '長條圖 / 直方圖',
        inputs: [{
            id: 'p_vals',
            label: '數據 (用逗號分隔)',
            default: '20, 50, 80, 45, 30',
            type: 'text'
        }, {
            id: 'p_labs',
            label: '標籤 (用逗號分隔)',
            default: 'A, B, C, D, E',
            type: 'text'
        }, {
            id: 'p_width',
            label: '長條寬度',
            default: 40
        }, {
            id: 'p_gap',
            label: '間距 (0為直方圖)',
            default: 15
        }, {
            id: 'p_axis_x',
            label: 'X軸名稱',
            default: '組別',
            type: 'text'
        }, {
            id: 'p_axis_y',
            label: 'Y軸名稱',
            default: '次數',
            type: 'text'
        }]
    },
    'pie_chart': {
        title: '圓餅圖 (Pie Chart)',
        inputs: [{
            id: 'p_vals',
            label: '數據 (逗號分隔)',
            default: '30, 20, 15, 35',
            type: 'text'
        }, {
            id: 'p_labels',
            label: '標籤 (逗號分隔)',
            default: 'A, B, C, D',
            type: 'text'
        }, {
            id: 'p_r',
            label: '半徑',
            default: 100
        }, {
            id: 'p_label_style',
            label: '標籤樣式',
            default: '1',
            type: 'select',
            options: [
                { value: '1', text: '名稱+比例 (內部)' },
                { value: '2', text: '名稱(內)+比例(外)' },
                { value: '3', text: '名稱(外)+比例(內)' },
                { value: '4', text: '名稱+比例 (外部)' }
            ]
        }]
    },
    'venn_diagram': {
        title: '維恩圖 (Venn Diagram)',
        inputs: [{
            id: 'p_type',
            label: '集合數量',
            default: 2,
            type: 'select',
            options: [
                { value: 2, text: '2 個集合' },
                { value: 3, text: '3 個集合' }
            ]
        }, {
            id: 'p_r',
            label: '圓半徑',
            default: 100
        }, {
            id: 'p_spacing',
            label: '重疊程度 (%)',
            default: 60
        }, {
            id: 'p_label_a',
            label: '集合 A 名稱',
            default: 'A',
            type: 'text'
        }, {
            id: 'p_label_b',
            label: '集合 B 名稱',
            default: 'B',
            type: 'text'
        }, {
            id: 'p_label_c',
            label: '集合 C 名稱 (選3個時)',
            default: 'C',
            type: 'text'
        }]
    },
    'inequality': {
        title: '數線不等式',
        inputs: [{
            id: 'p_dir',
            label: '方向 (1:右 >, -1:左 <)',
            default: 1
        }, {
            id: 'p_solid',
            label: '樣式 (1:實心, 0:空心)',
            default: 0
        }, {
            id: 'p_len',
            label: '線條長度',
            default: 150
        }]
    }
};

function setupRightClickEvents() {
    const buttons = document.querySelectorAll('.left-sidebar .tool-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof isContinuousDrawing !== 'undefined') isContinuousDrawing = false;
        });
        const text = (btn.title || btn.innerText).toLowerCase();
        let type = null;
        if (text.includes('線') || text.includes('line')) type = 'line';
        if (text.includes('射線')) type = 'ray';
        if (text.includes('箭頭')) type = 'arrow';
        if (text.includes('直角三角')) type = 'right_triangle';
        else if (text.includes('三角')) type = 'triangle';
        if (text.includes('正方')) type = 'square';
        else if (text.includes('矩') || text.includes('四邊')) type = 'rect';
        if (text.includes('箏')) type = 'kite';
        else if (text.includes('平行')) type = 'parallelogram';
        else if (text.includes('梯')) type = 'trapezoid';
        if (text.includes('扇')) type = 'sector';
        else if (text.includes('弓')) type = 'circular_segment';
        else if (text.includes('弧')) type = 'arc';
        if (text.includes('圓柱')) type = 'cylinder';
        else if (text.includes('圓錐')) type = 'cone';
        else if (text.includes('圓') && !text.includes('橢') && !text.includes('柱') && !text.includes('錐') && !text.includes('弧')) type = 'circle';
        else if (text.includes('橢')) type = 'ellipse';
        if (text.includes('多邊')) type = 'polygon';
        if (text.includes('星')) type = 'star';
        if (text.includes('角') && !text.includes('三角') && !text.includes('多邊')) type = 'angle';
        if (text.includes('立體') || text.includes('方體')) type = 'solid';
        if (text.includes('盒狀圖') || text.includes('box')) type = 'boxplot';
        if (text.includes('拋物線') || text.includes('parabola')) type = 'parabola';
        if (text.includes('直方圖') || text.includes('histogram')) type = 'histogram';
        if (text.includes('不等式') || text.includes('inequality')) type = 'inequality';
        if (type && SHAPE_PARAMS[type]) {
            btn.oncontextmenu = (e) => {
                e.preventDefault();
                openParamModal(type);
            };
        }
    });
}

function openParamModal(type) {
    currentParamTool = type;
    const config = SHAPE_PARAMS[type];
    if (!config) return;
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = config.title;
    const container = document.getElementById('modalContent');
    if (!container) return;
    container.innerHTML = '';
    config.inputs.forEach(input => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.style.cssText = "display: flex; align-items: center; margin-bottom: 8px; justify-content: flex-start;";
        if (input.type === 'checkbox') {
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.id = input.id;
            chk.checked = input.default;
            chk.style.cssText = "margin: 0 6px 0 0; cursor: pointer; width: auto; min-width: auto;";
            const lbl = document.createElement('label');
            lbl.textContent = input.label;
            lbl.htmlFor = input.id;
            lbl.style.cssText = "cursor: pointer; width: auto; min-width: 0; flex: none; text-align: left; margin: 0;";
            div.appendChild(chk);
            div.appendChild(lbl);
        } else if (input.type === 'radio') {
            const label = document.createElement('label');
            label.textContent = input.label + ':';
            label.style.fontWeight = 'bold';
            div.appendChild(label);
            const radioContainer = document.createElement('div');
            radioContainer.style.cssText = "display: flex; gap: 12px; align-items: center; flex-wrap: wrap; overflow: visible;";
            radioContainer.id = input.id;
            radioContainer.setAttribute('data-input-type', 'radio');
            input.options.forEach(opt => {
                const rLabel = document.createElement('label');
                rLabel.style.cssText = "display: flex; align-items: center; cursor: pointer; white-space: nowrap; margin: 0; width: auto; min-width: 0; flex: none;";
                const rBtn = document.createElement('input');
                rBtn.type = 'radio';
                rBtn.name = input.id;
                rBtn.value = opt.value;
                if (input.default === opt.value) rBtn.checked = true;
                rBtn.style.cssText = "margin: 0 4px 0 0; width: auto; min-width: auto; cursor: pointer;";
                const span = document.createElement('span');
                span.textContent = opt.text;
                span.style.fontSize = '14px';
                rLabel.appendChild(rBtn);
                rLabel.appendChild(span);
                radioContainer.appendChild(rLabel);
            });
            div.appendChild(radioContainer);
        } else {
            const label = document.createElement('label');
            label.textContent = input.label + ':';
            div.appendChild(label);
            let inp;
            if (input.type === 'select') {
                inp = document.createElement('select');
                input.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    inp.appendChild(option);
                });
                inp.value = input.default;
                inp.style.width = '120px';
            } else {
                inp = document.createElement('input');
                if (input.type === 'text' || typeof input.default === 'string') {
                    inp.type = 'text';
                    inp.value = input.default;
                    inp.style.textAlign = 'left';
                    inp.style.width = '150px';
                } else {
                    inp.type = 'number';
                    inp.value = input.default;
                    inp.step = 'any';
                    inp.style.width = '80px';
                    inp.style.marginLeft = '0';
                }
            }
            inp.id = input.id;
            inp.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') submitParamDrawing();
            });
            div.appendChild(inp);
        }
        container.appendChild(div);
    });
    const modal = document.getElementById('paramModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            const first = container.querySelector('input[type="number"], input[type="text"]');
            if (first) first.focus();
        }, 100);
    }
}

function submitParamDrawing() {
    if (!currentParamTool) return;
    const container = document.getElementById('modalContent');
    if (!container) return;
    const values = {};
    const inputs = container.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(inp => {
        if (inp.type === 'number') {
            values[inp.id] = inp.value === "" ? 0 : parseFloat(inp.value);
        } else {
            values[inp.id] = inp.value;
        }
    });
    const selects = container.querySelectorAll('select');
    selects.forEach(sel => {
        values[sel.id] = sel.value;
    });
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(chk => {
        values[chk.id] = chk.checked;
    });
    const radioContainers = container.querySelectorAll('div[data-input-type="radio"]');
    radioContainers.forEach(div => {
        const id = div.id;
        const checked = div.querySelector(`input[name="${id}"]:checked`);
        if (checked) {
            values[id] = checked.value;
        }
    });
    if (typeof drawParamShape === 'function') {
        drawParamShape(currentParamTool, values);
    } else {
        console.error("drawParamShape 函式未定義");
    }
    closeParamModal();
}

function closeParamModal() {
    const modal = document.getElementById('paramModal');
    if (modal) modal.style.display = 'none';
    currentParamTool = null;
}

function mkText(x, y, txt, anchor, fontSize = '12') {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.textContent = txt;
    t.setAttribute('fill', 'black');
    t.style.fill = 'black';
    t.setAttribute('font-size', fontSize);
    t.style.fontSize = fontSize + "px";
    t.setAttribute('font-weight', 'normal');
    t.style.fontWeight = 'normal';
    t.style.stroke = 'rgba(0,0,0,0)';
    t.style.strokeWidth = '10px';
    t.style.paintOrder = 'stroke';
    t.style.strokeLinecap = 'round';
    t.style.strokeLinejoin = 'round';
    t.setAttribute('text-anchor', anchor || 'middle');
    t.setAttribute('class', 'shape');
    t.setAttribute('data-tool', 'text');
    t.style.pointerEvents = 'all';
    t.style.userSelect = 'none';
    t.style.cursor = 'text';
    return t;
};

function drawParamShape(type, v) {
    let layer = document.getElementById('shapes-layer');
    if (!layer) {
        const svg = document.getElementById('svg-canvas');
        if (svg) layer = svg;
        else {
            showAlert("錯誤：找不到繪圖圖層 (shapes-layer)！");
            return;
        }
    }
    let cx = 400,
        cy = 300;
    const svgEl = document.getElementById('svg-canvas');
    if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        if (rect.width > 0) {
            cx = rect.width / 2;
            cy = rect.height / 2;
        }
    }
    let newElement = null;
    const rad = deg => deg * Math.PI / 180;
    let systemFill = 'none';
    const colorSel = document.getElementById('fill-color-select');
    const styleSel = document.getElementById('fill-style-select');
    if (colorSel && styleSel && colorSel.value !== 'none') {
        if (typeof updateShapeFill === 'function') {
            const tmp = document.createElement('div');
            updateShapeFill(tmp, colorSel.value, styleSel.value);
            systemFill = tmp.style.fill;
        } else {
            systemFill = colorSel.value;
        }
    }
    const mk = (tag, attrs, applySystemFill = false) => {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        el.style.fill = applySystemFill ? systemFill : 'none';
        el.setAttribute('stroke', 'black');
        el.setAttribute('stroke-width', '2');
        el.setAttribute('vector-effect', 'non-scaling-stroke');
        for (let k in attrs) {
            if (k === 'fill') {
                el.style.fill = attrs[k];
            } else {
                el.setAttribute(k, attrs[k]);
            }
        }
        return el;
    };
    if (type === 'venn_diagram') {
        const group = document.createElementNS(ns, "g");
        group.setAttribute("class", "shape group");
        group.setAttribute("data-tool", "group");
        group.setAttribute("data-sub-tool", "venn");
        group.setAttribute("data-center-x", cx);
        group.setAttribute("data-center-y", cy);
        group.setAttribute("data-count", v.p_type);
        group.setAttribute("data-radius", v.p_r);
        group.setAttribute("data-spacing-percent", v.p_spacing);
        group.setAttribute("data-label-a", v.p_label_a);
        group.setAttribute("data-label-b", v.p_label_b);
        group.setAttribute("data-label-c", v.p_label_c);
        redrawVennDiagram(group);
        newElement = group;
    } else if (type === 'point') {
        newElement = mk('circle', { cx: v.p_x || cx, cy: v.p_y || cy, r: 3, fill: 'black', stroke: 'none', 'class': 'shape', 'data-tool': 'point' });
    } else if (['line', 'ray', 'arrow', 'segment'].includes(type)) {
        const len = v.p_len, ang = rad(v.p_ang);
        const dx = len * Math.cos(ang), dy = -len * Math.sin(ang);
        const x1 = cx - dx / 2, y1 = cy - dy / 2;
        const x2 = cx + dx / 2, y2 = cy + dy / 2;
        const g = mk('g', { 'class': 'shape', 'data-tool': 'line' });
        g.appendChild(mk('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 10 }));
        const lineAttrs = { x1, y1, x2, y2, 'class': 'visible-line' };
        if (type === 'arrow') lineAttrs['marker-end'] = 'url(#arrow-end)';
        g.appendChild(mk('line', lineAttrs));
        newElement = g;
    } else if (type === 'angle') {
        const deg = v.p_deg, R = 150, ang = rad(deg);
        const ex = cx + R * Math.cos(ang), ey = cy - R * Math.sin(ang);
        newElement = mk('polyline', { points: `${cx+R},${cy} ${cx},${cy} ${ex},${ey}`, 'class': 'shape', 'data-tool': 'angle' });
    } else if (['triangle', 'right_triangle', 'rect', 'square', 'polygon', 'parallelogram', 'trapezoid', 'kite'].includes(type)) {
        let points = [];
        if (type === 'rect') {
            const w = v.p_w, h = v.p_h;
            points = [[cx - w / 2, cy - h / 2], [cx - w / 2, cy + h / 2], [cx + w / 2, cy + h / 2], [cx + w / 2, cy - h / 2]];
        } else if (type === 'square') {
            const w = v.p_w;
            points = [[cx - w / 2, cy - w / 2], [cx - w / 2, cy + w / 2], [cx + w / 2, cy + w / 2], [cx + w / 2, cy - w / 2]];
        } else if (type === 'parallelogram') {
            const w = v.p_w, h = v.p_h, ang = rad(v.p_ang);
            const dx = h / Math.tan(ang);
            points = [[cx - w / 2 - dx / 2, cy + h / 2], [cx + w / 2 - dx / 2, cy + h / 2], [cx + w / 2 + dx / 2, cy - h / 2], [cx - w / 2 + dx / 2, cy - h / 2]];
        } else if (type === 'kite') {
            const w = v.p_w, h1 = v.p_h1, h2 = v.p_h2;
            const totalH = h1 + h2;
            points = [[cx, cy - totalH / 2], [cx + w / 2, cy - totalH / 2 + h1], [cx, cy + totalH / 2], [cx - w / 2, cy - totalH / 2 + h1]];
        } else if (type === 'trapezoid') {
            const top = v.p_top, bot = v.p_bottom, h = v.p_h;
            points = [[cx - bot / 2, cy + h / 2], [cx + bot / 2, cy + h / 2], [cx + top / 2, cy - h / 2], [cx - top / 2, cy - h / 2]];
        } else if (type === 'triangle') {
            const b = v.p_base, A = rad(v.p_la), B = rad(v.p_ra);
            const h = (b * Math.tan(A) * Math.tan(B)) / (Math.tan(A) + Math.tan(B));
            const x_proj = h / Math.tan(A);
            points = [[cx - b / 2, cy + h / 2], [cx - b / 2 + b, cy + h / 2], [cx - b / 2 + x_proj, cy + h / 2 - h]];
        } else if (type === 'right_triangle') {
            const w = v.p_w, h = v.p_h;
            points = [[cx - w / 2, cy + h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy - h / 2]];
        } else if (type === 'polygon') {
            const n = v.p_n, r = v.p_r;
            for (let i = 0; i < n; i++) {
                const theta = rad(90 + 360 * i / n);
                points.push([cx + r * Math.cos(theta), cy - r * Math.sin(theta)]);
            }
            const ptsStr = points.map(p => `${p[0]},${p[1]}`).join(' ');
            const poly = mk('polygon', { points: ptsStr, 'class': 'shape', 'data-tool': 'polygon' }, true);
            if (v.p_diagonals) {
                const group = mk('g', { 'class': 'shape group', 'data-tool': 'group' });
                group.appendChild(poly);
                for (let i = 0; i < n; i++) {
                    for (let j = i + 2; j < n; j++) {
                        if (i === 0 && j === n - 1) continue;
                        const diag = mk('line', { x1: points[i][0], y1: points[i][1], x2: points[j][0], y2: points[j][1], stroke: '#7f8c8d', 'stroke-width': 1, 'stroke-dasharray': '5,3', 'class': 'shape', 'data-tool': 'line' });
                        group.appendChild(diag);
                    }
                }
                newElement = group;
            } else { newElement = poly; }
        }
        if (!newElement) {
            const ptsStr = points.map(p => `${p[0]},${p[1]}`).join(' ');
            newElement = mk('polygon', { points: ptsStr, 'class': 'shape', 'data-tool': 'polygon' }, true);
        }
    } else if (type === 'circle' || type === 'ellipse') {
        const rx = (type === 'circle') ? v.p_r : v.p_rx;
        const ry = (type === 'circle') ? v.p_r : v.p_ry;
        const showCenter = (type === 'circle') ? v.p_show_center : false;
        const showLine = (type === 'circle') ? (v.p_show_line || 'none') : 'none';
        if (type === 'circle' && showLine !== 'none') {
            const g = mk('g', { 'class': 'shape group', 'data-tool': 'group', 'data-sub-tool': 'circle-smart', 'data-line-type': showLine, 'data-radius': rx, 'data-angle': 0 });
            g.id = 'group-' + Date.now();
            const circle = mk('circle', { cx: cx, cy: cy, r: rx, 'class': 'circle-body' }, true);
            g.appendChild(circle);
            let x2 = cx + rx;
            if (showLine === 'diameter') {
                g.appendChild(mk('line', { x1: cx - rx, y1: cy, x2: cx + rx, y2: cy, 'class': 'circle-line', stroke: 'black', 'stroke-width': 2 }));
            } else {
                g.appendChild(mk('line', { x1: cx, y1: cy, x2: cx + rx, y2: cy, 'class': 'circle-line', stroke: 'black', 'stroke-width': 2 }));
            }
            if (showCenter) {
                g.appendChild(mk('circle', { cx, cy, r: 3, fill: 'black', stroke: 'none', 'class': 'shape', 'data-tool': 'point' }));
                const textO = mkText(cx - 10, cy - 10, "O", "middle", "20");
                textO.style.fontWeight = "bold"; g.appendChild(textO);
            }
            layer.appendChild(g);
            if (typeof saveState === 'function') saveState();
            setTimeout(() => { if (typeof setMode === 'function') setMode('select'); deselectAll(); addToSelection(g); }, 50);
            newElement = null;
        } else {
            const body = mk('ellipse', {
                cx: cx, cy: cy, rx: rx, ry: ry,
                'class': 'shape',
                'data-tool': 'ellipse',
                'data-sub-tool': (type === 'circle' ? 'circle' : 'ellipse')
            }, true);
            body.id = 'body-' + Date.now();
            layer.appendChild(body);
            if (showCenter) {
                const centerPt = mk('circle', { cx, cy, r: 3, fill: 'black', stroke: 'none', 'class': 'shape', 'data-tool': 'point', 'data-owner-shape': body.id, 'data-dependency-type': 'center-point' });
                centerPt.id = 'center-' + Date.now();
                layer.appendChild(centerPt);
                const textO = mkText(cx - 10, cy - 10, "O", "middle", "20");
                textO.id = 'label-' + Date.now();
                textO.style.fontWeight = "bold"; textO.setAttribute('data-owner-shape', body.id); textO.setAttribute('data-dependency-type', 'center-label');
                layer.appendChild(textO);
            }
            newElement = body;
        }
    } else if (['arc', 'sector', 'circular_segment'].includes(type)) {
        const r = v.p_r, sA = rad(v.p_start), eA = rad(v.p_end);
        const x1 = cx + r * Math.cos(sA), y1 = cy - r * Math.sin(sA), x2 = cx + r * Math.cos(eA), y2 = cy - r * Math.sin(eA);
        let diff = v.p_end - v.p_start; while (diff < 0) diff += 360;
        const large = diff > 180 ? 1 : 0;
        let d = (type === 'sector') ? `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z` :
            (type === 'circular_segment') ? `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z` : `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
        newElement = mk('path', { d, 'class': 'shape', 'data-tool': 'ellipse', 'data-sub-tool': (type === 'circular_segment' ? 'arch' : type), 'data-center-x': cx, 'data-center-y': cy, 'data-radius': r, 'data-start-angle': sA, 'data-end-angle': eA }, type !== 'arc');
    } else if (type === 'star') {
        const n = Math.max(5, v.p_n), r = v.p_r, jump = Math.floor(n / 2);
        let pts = [];
        for (let i = 0; i < n; i++) {
            const theta = rad(90 + 360 * i / n);
            pts.push({ x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) });
        }
        let order = []; let curr = 0;
        for (let i = 0; i < n; i++) { order.push(pts[curr]); curr = (curr + jump) % n; }
        newElement = mk('polygon', { points: order.map(p => `${p.x},${p.y}`).join(' '), 'class': 'shape star-polygon', 'data-tool': 'polygon', 'data-sub-tool': 'star' }, true);
    } else if (type === 'solid') {
        const w = v.p_w, h = v.p_h, d = v.p_d, ang = rad(45), dx = d * Math.cos(ang), dy = -d * Math.sin(ang);
        const sx = cx - (w + Math.abs(dx)) / 2, sy = cy + (h + Math.abs(dy)) / 2;
        const g = mk('g', { 'class': 'shape', 'data-tool': 'solid', 'data-sub-tool': 'solid-cube' });
        g.appendChild(mk('path', { d: `M ${sx} ${sy} L ${sx+w} ${sy} L ${sx+w} ${sy-h} L ${sx} ${sy-h} Z M ${sx} ${sy-h} L ${sx+dx} ${sy-h+dy} L ${sx+w+dx} ${sy-h+dy} L ${sx+w} ${sy-h} M ${sx+w} ${sy} L ${sx+w+dx} ${sy+dy} L ${sx+w+dx} ${sy-h+dy}`, class: 'solid-visible' }));
        g.appendChild(mk('path', { d: `M ${sx} ${sy} L ${sx+dx} ${sy+dy} L ${sx+w+dx} ${sy+dy} M ${sx+dx} ${sy+dy} L ${sx+dx} ${sy-h+dy}`, class: 'solid-hidden', 'stroke-dasharray': '4,4' }));
        newElement = g;
    } else if (type === 'cylinder' || type === 'cone') {
        const r = v.p_r, h = v.p_h, ry = r * 0.3, g = mk('g', { 'class': 'shape', 'data-tool': 'group', 'data-sub-tool': type });
        const ty = cy - h / 2, by = cy + h / 2;
        g.appendChild(mk('path', { d: `M ${cx-r} ${by} A ${r} ${ry} 0 0 1 ${cx+r} ${by}`, 'stroke-dasharray': '4,4' }));
        g.appendChild(mk('path', { d: `M ${cx-r} ${by} A ${r} ${ry} 0 0 0 ${cx+r} ${by}` }));
        if (type === 'cylinder') {
            g.appendChild(mk('line', { x1: cx - r, y1: ty, x2: cx - r, y2: by })); g.appendChild(mk('line', { x1: cx + r, y1: ty, x2: cx + r, y2: by })); g.appendChild(mk('ellipse', { cx, cy: ty, rx: r, ry }));
        } else {
            g.appendChild(mk('line', { x1: cx, y1: ty, x2: cx - r, y2: by })); g.appendChild(mk('line', { x1: cx, y1: ty, x2: cx + r, y2: by }));
        }
        newElement = g;
    } else if (type === 'boxplot') {
        const min = v.p_min, q1 = v.p_q1, med = v.p_med, q3 = v.p_q3, max = v.p_max, boxH = 60, whiskH = 30;
        const sx = cx - (max - min) / 2;
        const mapX = (val) => sx + (val - min);
        const g = mk('g', { 'class': 'shape group', 'data-tool': 'group', 'data-sub-tool': 'boxplot' });
        g.appendChild(mk('line', { x1: mapX(min), y1: cy, x2: mapX(q1), y2: cy, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('line', { x1: mapX(q3), y1: cy, x2: mapX(max), y2: cy, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('line', { x1: mapX(min), y1: cy - whiskH / 2, x2: mapX(min), y2: cy + whiskH / 2, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('line', { x1: mapX(max), y1: cy - whiskH / 2, x2: mapX(max), y2: cy + whiskH / 2, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('rect', { x: mapX(q1), y: cy - boxH / 2, width: Math.abs(mapX(q3) - mapX(q1)), height: boxH, 'class': 'shape', 'data-tool': 'rect' }, true));
        g.appendChild(mk('line', { x1: mapX(med), y1: cy - boxH / 2, x2: mapX(med), y2: cy + boxH / 2, 'class': 'shape', 'data-tool': 'line' }));
        [min, q1, med, q3, max].forEach(val => g.appendChild(mkText(mapX(val), cy + boxH / 2 + 20, val, "middle", "12")));
        newElement = g;
    } else if (type === 'parabola') {
        const a = v.p_a || 0.01, w = v.p_w || 200, halfW = w / 2;
        let d = "";
        for (let x = -halfW; x <= halfW; x += 2) {
            const px = cx + x, py = cy - a * x * x;
            d += (d === "" ? "M" : "L") + ` ${px} ${py}`;
        }
        const g = mk('g', { 'class': 'shape', 'data-tool': 'line' });
        g.appendChild(mk('path', { d, 'class': 'visible-line' }));
        g.appendChild(mk('circle', { cx, cy, r: 2, fill: 'black' }));
        newElement = g;
    } else if (type === 'histogram') {
        const vals = v.p_vals.split(/[,，\s]+/).map(parseFloat).filter(n => !isNaN(n));
        const labs = v.p_labs.split(/[,，\s]+/).filter(s => s.trim() !== "");
        const bw = v.p_width, gap = v.p_gap, count = vals.length, maxV = Math.max(...vals, 100), chartH = 200, scale = chartH / maxV;
        const tw = count * bw + (count - 1) * gap, sx = cx - tw / 2, sy = cy + chartH / 2;
        const g = mk('g', { 'class': 'shape group', 'data-tool': 'group', 'data-sub-tool': 'histogram' });
        g.appendChild(mk('line', { x1: sx - 20, y1: sy, x2: sx + tw + 40, y2: sy, 'marker-end': 'url(#arrow-end)', 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('line', { x1: sx - 10, y1: sy, x2: sx - 10, y2: sy - chartH - 40, 'marker-end': 'url(#arrow-end)', 'class': 'shape', 'data-tool': 'line' }));
        vals.forEach((val, i) => {
            const h = val * scale, x = sx + i * (bw + gap), y = sy - h;
            g.appendChild(mk('rect', { x, y, width: bw, height: h, 'class': 'shape', 'data-tool': 'rect' }, true));
            g.appendChild(mkText(x + bw / 2, y - 5, val, "middle", "12"));
            if (labs[i]) g.appendChild(mkText(x + bw / 2, sy + 20, labs[i], "middle", "18"));
        });
        newElement = g;
    } else if (type === 'pie_chart') {
        const vals = v.p_vals.split(/[,，\s]+/).map(parseFloat).filter(n => !isNaN(n));
        const labs = v.p_labs.split(/[,，\s]+/).map(s => s.trim());
        const r = v.p_r, total = vals.reduce((a, b) => a + b, 0);
        let cur = 0; let angles = [];
        vals.forEach(val => { cur += (val / total) * 2 * Math.PI; angles.push(cur); });
        const g = mk('g', { 'class': 'shape group pie-chart', 'data-tool': 'group', 'data-sub-tool': 'pie-chart', 'data-center-x': cx, 'data-center-y': cy, 'data-radius': r, 'data-values': JSON.stringify(vals), 'data-labels': JSON.stringify(labs), 'data-angles': JSON.stringify(angles), 'data-label-style': v.p_label_style });
        redrawPieChart(g); newElement = g;
    } else if (type === 'venn_diagram') {
        const count = v.p_type, r = v.p_r, d = v.p_spacing * 2 * r / 100;
        const g = mk('g', { 'class': 'shape group', 'data-tool': 'group', 'data-sub-tool': 'venn', 'data-center-x': cx, 'data-center-y': cy, 'data-count': count, 'data-radius': r, 'data-spacing-percent': v.p_spacing, 'data-label-a': v.p_label_a, 'data-label-b': v.p_label_b, 'data-label-c': v.p_label_c });
        redrawVennDiagram(g); newElement = g;
    } else if (type === 'inequality') {
        const dir = v.p_dir >= 0 ? 1 : -1, len = v.p_len, r = 5;
        const created = [];
        const add = (el) => { layer.appendChild(el); created.push(el); };
        add(mk('line', { x1: v.p_solid ? cx : cx + r * dir, y1: cy, x2: cx + len * dir, y2: cy, 'marker-end': 'url(#arrow-end)', 'class': 'shape', 'data-tool': 'line' }));
        add(mk('circle', { cx, cy, r, fill: v.p_solid ? 'black' : 'white', 'class': 'shape', 'data-tool': 'ellipse', 'data-sub-tool': 'circle' }));
        add(mk('line', { x1: cx, y1: cy + r + 2, x2: cx, y2: cy + r + 10, 'class': 'shape', 'data-tool': 'line' }));
        if (typeof saveState === 'function') saveState();
        setTimeout(() => { if (typeof setMode === 'function') setMode('select'); deselectAll(); created.forEach(el => addToSelection(el)); }, 50);
        newElement = null;
    }
    if (newElement) {
        layer.appendChild(newElement);
        if (type === 'star') {
            if (document.getElementById('auto-label-check').checked) generateLabels(newElement);
            if (document.getElementById('auto-angle-label-check').checked) generateAngleLabels(newElement, true);
        }
        if (typeof saveState === 'function') saveState();
        setTimeout(() => {
            if (typeof setMode === 'function') setMode('select');
            deselectAll();
            addToSelection(newElement);
        }, 50);
    }
}

function createSVGElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

function createPieLabelObject(x, y, text, size, color) {
    const fo = document.createElementNS(ns, "foreignObject");
    fo.setAttribute("transform", `translate(${x}, ${y})`);
    fo.setAttribute("x", "-25");
    fo.setAttribute("y", "-15");
    fo.setAttribute("width", "50");
    fo.setAttribute("height", "30");
    fo.setAttribute("class", "shape math-obj pie-label");
    fo.setAttribute("data-tool", "text");
    fo.setAttribute("data-content", text);
    fo.setAttribute("data-font-size", size);
    fo.setAttribute("fill", color);
    const div = document.createElement("div");
    div.className = "math-content";
    div.style.fontSize = size + "px";
    div.style.color = color;
    div.style.display = "inline-block";
    div.style.whiteSpace = "nowrap";
    div.style.textAlign = "center";
    div.innerHTML = text;
    fo.appendChild(div);
    setTimeout(() => {
        if (!div.isConnected) return;
        const w = div.offsetWidth;
        const h = div.offsetHeight;
        fo.setAttribute("width", w + 4);
        fo.setAttribute("height", h + 4);
        const offsetX = -(w + 4) / 2;
        const offsetY = -(h + 4) / 2;
        fo.setAttribute("x", offsetX);
        fo.setAttribute("y", offsetY);
        fo.setAttribute("transform", `translate(${x}, ${y})`);
    }, 50);
    return fo;
}

function redrawPieChart(group) {
    Array.from(group.children).forEach(child => child.remove());
    const cx = parseFloat(group.getAttribute('data-center-x'));
    const cy = parseFloat(group.getAttribute('data-center-y'));
    const r = parseFloat(group.getAttribute('data-radius'));
    const values = JSON.parse(group.getAttribute('data-values'));
    const labels = JSON.parse(group.getAttribute('data-labels'));
    const labelStyle = group.getAttribute('data-label-style');
    const total = values.reduce((a, b) => a + b, 0);
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
    let startAngle = 0;
    const angles = JSON.parse(group.getAttribute('data-angles'));
    const textColor = '#000000';
    angles.forEach((endAngle, i) => {
        const val = values[i];
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', d);
        path.setAttribute('fill', colors[i % colors.length]);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('class', 'pie-slice');
        path.setAttribute('data-index', i);
        group.appendChild(path);
        const sliceAngle = endAngle - startAngle;
        const midAngle = startAngle + sliceAngle / 2;
        const percentText = Math.round((val / total) * 100) + "%";
        const nameText = labels[i] || "";
        const addText = (textStr, radius, fontSize, col, offsetY = 0) => {
            if (!textStr) return;
            const tx = cx + radius * Math.cos(midAngle);
            const ty = cy + radius * Math.sin(midAngle) + offsetY;
            const textObj = createPieLabelObject(tx, ty, textStr, fontSize, col);
            textObj.setAttribute('data-index', i);
            group.appendChild(textObj);
        };
        if (labelStyle === '2') {
            addText(nameText, r * 0.7, 14, textColor, 0);
            addText(percentText, r + 20, 12, textColor, 0);
        } else if (labelStyle === '3') {
            addText(nameText, r + 20, 14, textColor, 0);
            addText(percentText, r * 0.7, 12, textColor, 0);
        } else if (labelStyle === '4') {
            const dist = r + 20;
            if (nameText && percentText) {
                addText(nameText, dist, 14, textColor, -10);
                addText(percentText, dist, 12, textColor, 10);
            } else {
                addText(nameText || percentText, dist, 14, textColor, 0);
            }
        } else {
            const dist = r * 0.65;
            if (nameText && percentText) {
                addText(nameText, dist, 14, textColor, -10);
                addText(percentText, dist, 12, textColor, 10);
            } else {
                addText(nameText || percentText, dist, 14, textColor, 0);
            }
        }
        startAngle = endAngle;
    });
}

function redrawVennDiagram(group) {
    while (group.firstChild) {
        group.removeChild(group.firstChild);
    }
    const cx = parseFloat(group.getAttribute('data-center-x'));
    const cy = parseFloat(group.getAttribute('data-center-y'));
    const count = parseInt(group.getAttribute('data-count'));
    const r = parseFloat(group.getAttribute('data-radius'));
    const spacingPercent = parseFloat(group.getAttribute('data-spacing-percent'));
    const labels = {
        a: group.getAttribute('data-label-a') || "A",
        b: group.getAttribute('data-label-b') || "B",
        c: group.getAttribute('data-label-c') || "C"
    };
    const colors = {
        a: 'rgba(231, 76, 60, 0.5)',
        b: 'rgba(52, 152, 219, 0.5)',
        c: 'rgba(46, 204, 113, 0.5)'
    };
    const d = r * (spacingPercent / 100) * 2;
    const createCircle = (cx, cy, r, fill) => {
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('class', 'shape');
        circle.setAttribute('data-tool', 'ellipse');
        circle.setAttribute('data-sub-tool', 'circle');
        circle.style.fill = fill;
        circle.style.stroke = '#333';
        circle.style.strokeWidth = '1';
        return circle;
    };
    if (count === 2) {
        const c1 = { x: cx - d / 2, y: cy };
        const c2 = { x: cx + d / 2, y: cy };
        group.appendChild(createCircle(c1.x, c1.y, r, colors.a));
        group.appendChild(createCircle(c2.x, c2.y, r, colors.b));
        group.appendChild(mkText(c1.x - r * 0.4, c1.y, labels.a, 'middle', '20'));
        group.appendChild(mkText(c2.x + r * 0.4, c2.y, labels.b, 'middle', '20'));
        if (d < 2 * r) {
            const intersectLabel = `${labels.a}∩${labels.b}`;
            group.appendChild(mkText(cx, cy, intersectLabel, 'middle', '14'));
        }
    } else if (count === 3) {
        const h = d * Math.sqrt(3) / 2;
        const c1 = { x: cx, y: cy - h / 2 - (r * 0.2) };
        const c2 = { x: cx - d / 2, y: cy + h / 2 };
        const c3 = { x: cx + d / 2, y: cy + h / 2 };
        group.appendChild(createCircle(c1.x, c1.y, r, colors.a));
        group.appendChild(createCircle(c2.x, c2.y, r, colors.b));
        group.appendChild(createCircle(c3.x, c3.y, r, colors.c));
        group.appendChild(mkText(c1.x, c1.y - r * 0.5, labels.a, 'middle', '20'));
        group.appendChild(mkText(c2.x - r * 0.5, c2.y + r * 0.2, labels.b, 'middle', '20'));
        group.appendChild(mkText(c3.x + r * 0.5, c3.y + r * 0.2, labels.c, 'middle', '20'));
        const p12 = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
        const p13 = { x: (c1.x + c3.x) / 2, y: (c1.y + c3.y) / 2 };
        const p23 = { x: (c2.x + c3.x) / 2, y: (c2.y + c3.y) / 2 };
        group.appendChild(mkText(p12.x - 10, p12.y - 10, `${labels.a}∩${labels.b}`, 'middle', '12'));
        group.appendChild(mkText(p13.x + 10, p13.y - 10, `${labels.a}∩${labels.c}`, 'middle', '12'));
        group.appendChild(mkText(p23.x, p23.y + 15, `${labels.b}∩${labels.c}`, 'middle', '12'));
        if (d < r * 1.5) {
            const centerLabel = `${labels.a}∩${labels.b}∩${labels.c}`;
            group.appendChild(mkText(cx, cy + h / 6, centerLabel, 'middle', '12'));
        }
    }
}