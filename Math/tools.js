const SHAPE_PARAMS = {
    'point': { 
        title: '繪製點', 
        inputs:[
            {id: 'p_r', label: '點半徑 (px)', default: 3},
            {id: 'p_solid', label: '實心', type: 'checkbox', default: true} 
        ] 
    },
    'line-simple': { title: '繪製線段', inputs:[{id: 'p_mode', label: '設定模式', type: 'radio', default: 'random', options:[{ value: 'random', text: '任意角度' }, { value: 'fixed', text: '指定角度' }]}, {id: 'p_ang', label: '角度 (°)', default: 0}] },
    'line-end': { title: '繪製單箭頭', inputs:[{id: 'p_mode', label: '設定模式', type: 'radio', default: 'random', options:[{ value: 'random', text: '任意角度' }, { value: 'fixed', text: '指定角度' }]}, {id: 'p_ang', label: '角度 (°)', default: 0}] },
    'line-start': { title: '繪製單箭頭', inputs:[{id: 'p_mode', label: '設定模式', type: 'radio', default: 'random', options:[{ value: 'random', text: '任意角度' }, { value: 'fixed', text: '指定角度' }]}, {id: 'p_ang', label: '角度 (°)', default: 0}] },
    'line-double': { title: '繪製雙箭頭', inputs:[{id: 'p_mode', label: '設定模式', type: 'radio', default: 'random', options:[{ value: 'random', text: '任意角度' }, { value: 'fixed', text: '指定角度' }]}, {id: 'p_ang', label: '角度 (°)', default: 0}] },
    'angle': { title: '繪製角度', inputs:[{id: 'p_mode', label: '設定模式', type: 'radio', default: 'random', options:[{ value: 'random', text: '任意角度' }, { value: 'fixed', text: '指定角度' }]}, {id: 'p_deg', label: '角度 (°)', default: 45}] },
    'tri-any': { 
        title: '繪製任意三角形', 
        inputs:[
            {id: 'p_mode', label: '生成模式', type: 'radio', default: 'ratio', options:[
                { value: 'ratio', text: '三邊比例' },
                { value: 'obtuse', text: '隨機鈍角' },
                { value: 'acute', text: '隨機銳角' },
				{ value: 'random', text: '任意角度 (隨機)' }
            ]},
            {id: 'p_ratio', label: '三邊比例', default: '3,4,5', type: 'ratio', names:['a', 'b', 'c']}
        ] 
    },
    'tri-iso': { 
        title: '繪製等腰三角形', 
        inputs:[
            {id: 'p_mode', label: '生成模式', type: 'radio', default: 'angle', options:[
                { value: 'angle', text: '單一底角設定' },
                { value: 'random', text: '任意等腰三角形' }
            ]},
            {id: 'p_angle', label: '底角度數 (°)', default: 65}
        ] 
    },
    'tri-right': { 
        title: '繪製直角三角形', 
        inputs:[
            {id: 'p_mode', label: '生成模式', type: 'radio', default: 'ratio', options:[
                { value: 'ratio', text: '底高比例' },
                { value: 'angle', text: '一個銳角 (°)' },
                { value: 'random', text: '任意直角三角形' }
            ]},
            {id: 'p_ratio', label: '底高比例', default: '4,3', type: 'ratio', names: ['底', '高']},
            {id: 'p_angle', label: '銳角度數 (°)', default: 30}
        ] 
    },
    'rect': { title: '繪製矩形', inputs:[{id: 'p_ratio', label: '長寬比例', default: '2,1', type: 'ratio', names: ['寬', '高']}] },
    'rhombus': { title: '繪製菱形', inputs:[{id: 'p_ratio', label: '對角線比例', default: '2,1', type: 'ratio', names: ['X', 'Y']}] },
    'parallelogram': { title: '平行四邊形', inputs:[{id: 'p_ratio', label: '底高比例', default: '2,1', type: 'ratio', names: ['底', '高']}, {id: 'p_ang', label: '底角 (°)', default: 60}] },
    'trapezoid': { title: '繪製梯形', inputs:[{id: 'p_ratio', label: '比例', default: '1,2,1', type: 'ratio', names: ['上底', '下底', '高']}] },
    'kite': { title: '繪製箏形', inputs:[{id: 'p_ratio', label: '比例', default: '3,1,3', type: 'ratio', names: ['寬', '上高', '下高']}] },
    'circle': { title: '繪製圓形', inputs:[{id: 'p_show_center', label: '繪製圓心 (O)', type: 'checkbox', default: false}, {id: 'p_show_line', label: '輔助線', type: 'radio', default: 'none', options:[{ value: 'none', text: '無' },{ value: 'radius', text: '半徑' },{ value: 'diameter', text: '直徑' }]}] },
    'ellipse': { title: '繪製橢圓', inputs:[{id: 'p_ratio', label: '軸比例', default: '5,3', type: 'ratio', names: ['X軸', 'Y軸']}] },
    'arc': { title: '繪製圓弧 (逆時針)', inputs:[ { id: 'p_start', label: '起始角 (°)', default: 0 }, { id: 'p_end', label: '結束角 (°)', default: 90 } ] },
    'circular_segment': { title: '繪製弓形 (逆時針)', inputs:[{id: 'p_start', label: '起始角 (°)', default: 0}, {id: 'p_end', label: '結束角 (°)', default: 90}] },
    'sector': { title: '繪製扇形 (逆時針)', inputs:[{id: 'p_start', label: '起始角 (°)', default: 0}, {id: 'p_end', label: '結束角 (°)', default: 60}] },
    'polygon': { title: '正多邊形', inputs:[{id: 'p_n', label: '邊數 n', default: 5}, {id: 'p_diagonals', label: '繪製對角線', type: 'checkbox', default: false}] },
    'star': { title: '繪製正多角星', inputs:[{id: 'p_n', label: '頂點數 n (常用: 5)', default: 5}] },
    'solid-blocks': { title: '立體積木設定', inputs:[{id: 'p_cols', label: '寬度格數 (右方)', default: 3}, {id: 'p_rows', label: '深度格數 (前方)', default: 3}, {id: 'p_arrows', label: '顯示方位指示', type: 'checkbox', default: true}] },
    'solid': { title: '繪製長方體', inputs:[{id: 'p_ratio', label: '比例', default: '2,2,1', type: 'ratio', names:['寬', '高', '深']}] },
    'cylinder': { title: '繪製圓柱', inputs:[{id: 'p_ratio', label: '比例', default: '1,3', type: 'ratio', names: ['半徑', '高']}] },
    'cone': { title: '繪製圓錐', inputs:[{id: 'p_ratio', label: '比例', default: '1,3', type: 'ratio', names: ['半徑', '高']}] },
    'pyramid': { title: '繪製正四角錐', inputs:[{id: 'p_ratio', label: '比例', default: '1,1', type: 'ratio', names:['底寬', '高']}] },
    'prism': { title: '繪製正三角柱', inputs:[{id: 'p_ratio', label: '比例', default: '1,1', type: 'ratio', names:['底寬', '高']}] },
    'boxplot': { title: '繪製盒狀圖', inputs:[{id: 'p_min', label: '最小值 (Min)', default: 0}, {id: 'p_q1', label: '第一四分位 (Q1)', default: 50}, {id: 'p_med', label: '中位數 (Median)', default: 100}, {id: 'p_q3', label: '第三四分位 (Q3)', default: 150}, {id: 'p_max', label: '最大值 (Max)', default: 200}] },
    'histogram': { title: '長條圖 / 直方圖', inputs:[
        {id: 'p_vals', label: '數據 (用逗號分隔)', default: '20, 50, 80, 45, 30', type: 'text'}, 
        {id: 'p_labs', label: '標籤 (用逗號分隔)', default: 'A, B, C, D, E', type: 'text'}, 
        {id: 'p_width', label: '長條寬度', default: 40}, 
        {id: 'p_gap', label: '間距 (0為直方圖)', default: 15}, 
        {id: 'p_y_max', label: 'Y軸最大值 (0自動)', default: 0},
        {id: 'p_y_interval', label: '刻度間隔', default: 20},
        {id: 'p_y_ticks', label: '顯示Y軸刻度', type: 'checkbox', default: true},
        {id: 'p_val_pos', label: '數值標註', default: 'top', type: 'select', options:[{ value: 'top', text: 'Bar上方' },{ value: 'inside', text: 'Bar內部' },{ value: 'none', text: '不顯示' }]},
        {id: 'p_axis_x', label: 'X軸名稱', default: '組別', type: 'text'}, 
        {id: 'p_axis_y', label: 'Y軸名稱', default: '次數', type: 'text'},
        {id: 'p_label_pos', label: '軸名稱位置', default: 'side', type: 'radio', options:[{ value: 'side', text: '數值/文字邊' }, { value: 'arrow', text: '箭頭端' }]},
        {id: 'p_guide_labels', label: '輔助線Y軸標籤(對應數據)', default: '', type: 'text'} // <--- 新增
    ]},
    'axis_chart': { title: '折線圖', inputs:[
        {id: 'p_x_labels', label: 'X軸標籤 (逗號分隔)', default: '1, 2, 3, 4, 5', type: 'text'}, 
        {id: 'p_vals', label: '資料數值 (逗號分隔)', default: '10, 30, 20, 40, 25', type: 'text'},
        {id: 'p_y_max', label: 'Y軸最大值 (0自動)', default: 0},
        {id: 'p_y_interval', label: '刻度間隔', default: 10},
        {id: 'p_show_line', label: '顯示折線', type: 'checkbox', default: true},
        {id: 'p_show_val', label: '顯示折點Y值', type: 'checkbox', default: false},
        {id: 'p_start_y', label: '首點貼齊 Y 軸', type: 'checkbox', default: false},
        {id: 'p_x_name', label: 'X軸名稱', default: 'X', type: 'text'}, 
        {id: 'p_y_name', label: 'Y軸名稱', default: 'Y', type: 'text'},
        {id: 'p_label_pos', label: '軸名稱位置', default: 'side', type: 'radio', options:[{ value: 'side', text: '數值/文字邊' }, { value: 'arrow', text: '箭頭端' }]},
        {id: 'p_guide_labels', label: '輔助線Y軸標籤(對應數據)', default: '', type: 'text'} // <--- 新增
    ]},
    'text_defaults': { title: '文字預設視窗設定', inputs:[{id: 'p_x', label: '預設 X 座標 (置中請留空)', type: 'text', default: ''}, {id: 'p_y', label: '預設 Y 座標 (置中請留空)', type: 'text', default: ''}, {id: 'p_w', label: '預設寬度', default: 250}, {id: 'p_h', label: '預設高度', default: 80}, {id: 'p_fs', label: '預設字體大小', type: 'select', default: '20', options:[{value:'12',text:'12'},{value:'16',text:'16'},{value:'20',text:'20'},{value:'24',text:'24'},{value:'32',text:'32'},{value:'48',text:'48'},{value:'64',text:'64'},{value:'96',text:'96'}]}] },
    'math_defaults': { title: '數學式預設視窗設定', inputs:[{id: 'p_x', label: '預設 X 座標 (置中請留空)', type: 'text', default: ''}, {id: 'p_y', label: '預設 Y 座標 (置中請留空)', type: 'text', default: ''}, {id: 'p_w', label: '預設寬度', default: 250}, {id: 'p_h', label: '預設高度', default: 80}, {id: 'p_fs', label: '預設字體大小', type: 'select', default: '20', options:[{value:'12',text:'12'},{value:'16',text:'16'},{value:'20',text:'20'},{value:'24',text:'24'},{value:'32',text:'32'},{value:'48',text:'48'},{value:'64',text:'64'},{value:'96',text:'96'}]}] },
    'polyline': { title: '繪製折線', inputs:[{id: 'p_n', label: '折段數', default: 3, type: 'number', step: '1', min: '1'}, {id: 'p_show_pts', label: '顯示折點', type: 'checkbox', default: true}] },
    'pie_chart': { title: '圓餅圖 (Pie Chart)', inputs:[{id: 'p_vals', label: '數據 (逗號分隔)', default: '30, 20, 15, 35', type: 'text'}, {id: 'p_labels', label: '標籤 (逗號分隔)', default: 'A, B, C, D', type: 'text'}, {id: 'p_label_style', label: '標籤樣式', default: '1', type: 'select', options:[{ value: '1', text: '名稱+比例 (內部)' },{ value: '2', text: '名稱(內)+比例(外)' },{ value: '3', text: '名稱(外)+比例(內)' },{ value: '4', text: '名稱+比例 (外部)' }] }] },
    'venn_diagram': { title: '文氏圖 (Venn Diagram)', inputs:[{id: 'p_type', label: '集合數量', default: 2, type: 'select', options:[{ value: 2, text: '2 個集合' },{ value: 3, text: '3 個集合' }] }, {id: 'p_spacing', label: '重疊程度 (%)', default: 60}, {id: 'p_label_a', label: '集合 A 名稱', default: 'A', type: 'text'}, {id: 'p_label_b', label: '集合 B 名稱', default: 'B', type: 'text'}, {id: 'p_label_c', label: '集合 C 名稱 (選3個時)', default: 'C', type: 'text'}] },
    'inequality': { title: '數線不等式', inputs:[
        {id: 'p_dir', label: '方向', default: '1', type: 'radio', options:[{value: '1', text: '右(>)'}, {value: '-1', text: '左(<)'}]}, 
        {id: 'p_solid', label: '樣式', default: '0', type: 'radio', options:[{value: '1', text: '實心'}, {value: '0', text: '空心'}]}
    ] }
};

function openParamModal(type, targetShape = null) {
    currentParamTool = type;
    const config = SHAPE_PARAMS[type];
    if (!config) return;
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = config.title;
    const container = document.getElementById('modalContent');
    if (!container) return;
    container.innerHTML = '';
    
    let savedParams = {};
    if (targetShape) {
        if (!targetShape.id) {
            targetShape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        }
        try { savedParams = JSON.parse(targetShape.getAttribute('data-params') || '{}'); } catch(e){}
        container.setAttribute('data-target-id', targetShape.id);
    } else {
        const cached = localStorage.getItem(`math_editor_param_${type}`);
        if (cached) { try { savedParams = JSON.parse(cached); } catch(e){} }
        container.removeAttribute('data-target-id');
    }

    config.inputs.forEach(input => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.style.cssText = "display: flex; align-items: center; margin-bottom: 0px; justify-content: flex-start;";
        div.setAttribute('data-param-id', input.id); // 為了方便顯示/隱藏
        
        let defVal = savedParams[input.id] !== undefined ? savedParams[input.id] : input.default;

        if (input.type === 'checkbox') {
            const chk = document.createElement('input'); chk.type = 'checkbox'; chk.id = input.id; chk.checked = defVal;
            chk.style.cssText = "margin: 0 6px 0 0; cursor: pointer; width: auto; min-width: auto;"; 
            const lbl = document.createElement('label'); lbl.textContent = input.label; lbl.htmlFor = input.id;
            lbl.style.cssText = "cursor: pointer; width: auto; min-width: 0; flex: none; text-align: left; margin: 0;";
            div.appendChild(chk); div.appendChild(lbl);
        } else if (input.type === 'radio') {
            const label = document.createElement('label'); label.textContent = input.label + ':'; label.style.fontWeight = 'bold';
            div.appendChild(label);
            
            const radioContainer = document.createElement('div');
            radioContainer.style.cssText = "display: flex; gap: 12px; align-items: center; flex-wrap: wrap; overflow: visible;";
            radioContainer.id = input.id; radioContainer.setAttribute('data-input-type', 'radio');

            input.options.forEach(opt => {
                const rLabel = document.createElement('label');
                rLabel.style.cssText = "display: flex; align-items: center; cursor: pointer; white-space: nowrap; margin: 0; width: auto; min-width: 0; flex: none;";
                const rBtn = document.createElement('input');
                rBtn.type = 'radio'; rBtn.name = input.id; rBtn.value = opt.value;
                if (defVal === opt.value) rBtn.checked = true;
                rBtn.style.cssText = "margin: 0 4px 0 0; width: auto; min-width: auto; cursor: pointer;";
                const span = document.createElement('span'); span.textContent = opt.text; span.style.fontSize = '14px';
                
                if (type === 'tri-any' && input.id === 'p_mode') rBtn.onchange = toggleTriAnyInputs;
                if (type === 'tri-iso' && input.id === 'p_mode') rBtn.onchange = toggleTriIsoInputs;
                if (type === 'tri-right' && input.id === 'p_mode') rBtn.onchange = toggleTriRightInputs;
				if (['line-simple', 'line-end', 'line-start', 'line-double', 'angle'].includes(type) && input.id === 'p_mode') rBtn.onchange = toggleLineAngleInputs;
				
                rLabel.appendChild(rBtn); rLabel.appendChild(span);
                radioContainer.appendChild(rLabel);
            });
            div.appendChild(radioContainer);
        } else if (input.type === 'ratio') {
            // 【修改點 1】：將外層的 flex 佈局改為垂直排列 (獨立一行)
            div.style.flexDirection = 'column';
            div.style.alignItems = 'flex-start';
            div.style.gap = '6px'; // 標題與輸入框的上下間距

            const label = document.createElement('label'); 
            label.textContent = input.label + ':';
            label.style.fontWeight = 'bold'; // 標題加粗
            label.style.width = '100%';
            div.appendChild(label);
            
            const ratioContainer = document.createElement('div');
            // 【修改點 2】：強制不換行，讓所有比例輸入框乖乖待在同一行
            ratioContainer.style.cssText = "display: flex; align-items: center; gap: 4px; flex-wrap: nowrap; width: 100%; justify-content: flex-start;";
            ratioContainer.id = input.id; 
            ratioContainer.setAttribute('data-input-type', 'ratio');

            const defaultVals = (defVal || input.default || "").split(/[,:： ]+/);
            
            input.names.forEach((name, idx) => {
                const partLabel = document.createElement('span');
                partLabel.textContent = name;
                partLabel.style.fontSize = '12px';
                partLabel.style.color = '#555';
                partLabel.style.whiteSpace = 'nowrap';
                ratioContainer.appendChild(partLabel);
                
                const partInput = document.createElement('input');
                partInput.type = 'number';
                partInput.min = '1';
                partInput.step = '1'; // 強制跳動整數
                partInput.value = defaultVals[idx] || '1';
                partInput.className = 'ratio-part-input';
                // 【修改點 3】：加入 !important 蓋掉全域 CSS 的 90px 限制，將寬度縮減為 40px
                partInput.style.cssText = 'width: 60px !important; min-width: 40px !important; text-align: center; padding: 4px 2px; border: 1px solid #ccc; border-radius: 4px; margin-left: 0;';
                ratioContainer.appendChild(partInput);
                
                if (idx < input.names.length - 1) {
                    const colon = document.createElement('span');
                    colon.textContent = ':';
                    colon.style.fontWeight = 'bold';
                    colon.style.margin = '0 4px';
					colon.style.fontSize = '16px';
                    ratioContainer.appendChild(colon);
                }
            });
            div.appendChild(ratioContainer);
        }
        else {
            const label = document.createElement('label'); label.textContent = input.label + ':';
            div.appendChild(label);
            let inp;
            if (input.type === 'select') {
                inp = document.createElement('select');
                input.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value; option.textContent = opt.text;
                    inp.appendChild(option);
                });
                inp.value = defVal; inp.style.width = '120px'; 
            } else {
                inp = document.createElement('input');        
                if (input.type === 'text' || typeof input.default === 'string') {
                    inp.type = 'text'; inp.value = defVal; inp.style.textAlign = 'left'; inp.style.width = '150px';
					inp.style.height = '12px';
                } else {
                    inp.type = 'number'; 
                    inp.value = defVal; 
                    inp.step = input.step || 'any'; 
                    if (input.min !== undefined) inp.min = input.min;
                    inp.style.width = '80px'; inp.style.margin = '0';
					inp.style.height = '12px'; inp.style.marginLeft = '0';
                }
            }        
            inp.id = input.id;
            inp.addEventListener('keyup', (e) => { if (e.key === 'Enter') submitParamDrawing(); });
            div.appendChild(inp);
        }
        container.appendChild(div);
    });
    
    if (type === 'tri-any') toggleTriAnyInputs();
    if (type === 'tri-iso') toggleTriIsoInputs();
    if (type === 'tri-right') toggleTriRightInputs();
	if (['line-simple', 'line-end', 'line-start', 'line-double', 'angle'].includes(type)) toggleLineAngleInputs();
    
    const modal = document.getElementById('paramModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            const first = container.querySelector('input[type="number"], input[type="text"]');
            if (first) first.focus();
        }, 100);
    }
}

function toggleTriAnyInputs() {
    const mode = document.querySelector('input[name="p_mode"]:checked')?.value;
    const getEl = (id) => document.getElementById(id)?.closest('.input-group');
    const ratioGroup = getEl('p_ratio'); const scaleGroup = getEl('p_scale');
    const baseGroup = getEl('p_base'); const angleAGroup = getEl('p_angleA'); const angleBGroup = getEl('p_angleB');
    if (ratioGroup) ratioGroup.style.display = 'none'; if (scaleGroup) scaleGroup.style.display = 'none';
    if (baseGroup) baseGroup.style.display = 'none'; if (angleAGroup) angleAGroup.style.display = 'none'; if (angleBGroup) angleBGroup.style.display = 'none';
    if (mode === 'ratio') { if(ratioGroup) ratioGroup.style.display = 'flex'; if(scaleGroup) scaleGroup.style.display = 'flex'; } 
    else if (mode === 'angles') { if(baseGroup) baseGroup.style.display = 'flex'; if(angleAGroup) angleAGroup.style.display = 'flex'; if(angleBGroup) angleBGroup.style.display = 'flex'; }
    else { if(scaleGroup) scaleGroup.style.display = 'flex'; }
}

function toggleTriIsoInputs() {
    const mode = document.querySelector('input[name="p_mode"]:checked')?.value;
    const getEl = (id) => document.getElementById(id)?.closest('.input-group');
    if (getEl('p_angle')) getEl('p_angle').style.display = (mode === 'angle') ? 'flex' : 'none';
}

function toggleLineAngleInputs() {
    const mode = document.querySelector('input[name="p_mode"]:checked')?.value;
    const getEl = (id) => document.getElementById(id)?.closest('.input-group');
    if (getEl('p_ang')) getEl('p_ang').style.display = (mode === 'fixed') ? 'flex' : 'none';
    if (getEl('p_deg')) getEl('p_deg').style.display = (mode === 'fixed') ? 'flex' : 'none';
}


function submitParamDrawing() {
    if (!currentParamTool) return;
    const container = document.getElementById('modalContent');
    if (!container) return;
    
    const values = {};
    const inputs = container.querySelectorAll('input, select');
    
    inputs.forEach(inp => {
        if (inp.type === 'checkbox') {
            values[inp.id] = inp.checked;
        } else if (inp.type === 'radio') {
            if (inp.checked) values[inp.name] = inp.value;
        } else {
            if (inp.type === 'number') {
                 values[inp.id] = inp.value === "" ? 0 : parseFloat(inp.value);
            } else {
                 values[inp.id] = inp.value;
            }
        }
    });

    const radioContainers = container.querySelectorAll('div[data-input-type="radio"]');
    radioContainers.forEach(div => {
        const id = div.id;
        const checked = div.querySelector(`input[name="${id}"]:checked`);
        if (checked) values[id] = checked.value;
    });

    // 處理比率輸入框的取值
    const ratioGroups = container.querySelectorAll('div[data-input-type="ratio"]');
    ratioGroups.forEach(div => {
        const inputs = div.querySelectorAll('.ratio-part-input');
        const vals = Array.from(inputs).map(inp => inp.value).join(',');
        values[div.id] = vals;
    });

    localStorage.setItem(`math_editor_param_${currentParamTool}`, JSON.stringify(values));
	
    const targetId = container.getAttribute('data-target-id');
    if (targetId) {
        // --- 編輯模式：更新現有物件 ---
        const shape = document.getElementById(targetId);
        if (shape) {
            // 更新參數
            shape.setAttribute('data-params', JSON.stringify(values));
            
            // ▼▼▼ 關鍵修復：拉平 if-else 判斷式，確保所有圖形都能執行到重繪 ▼▼▼
            if (currentParamTool === 'axis_chart') {
                if (typeof redrawAxisChart === 'function') redrawAxisChart(shape);
            } 
            else if (currentParamTool === 'venn_diagram') {
                shape.setAttribute("data-count", values.p_type);
                shape.setAttribute("data-spacing-percent", values.p_spacing);
                shape.setAttribute("data-label-a", values.p_label_a);
                shape.setAttribute("data-label-b", values.p_label_b);
                shape.setAttribute("data-label-c", values.p_label_c);
                if (typeof redrawVennDiagram === 'function') redrawVennDiagram(shape);
            }
            else if (currentParamTool === 'pie_chart') {
                const vals = values.p_vals.split(/[,，\s]+/).map(parseFloat).filter(n => !isNaN(n));
                const labs = values.p_labels.split(/[,，\s]+/).map(s => s.trim());
                const total = vals.reduce((a, b) => a + b, 0);
                let cur = 0; let angles =[];
                vals.forEach(val => { cur += (val/total)*2*Math.PI; angles.push(cur); });
                
                shape.setAttribute('data-values', JSON.stringify(vals));
                shape.setAttribute('data-labels', JSON.stringify(labs));
                shape.setAttribute('data-angles', JSON.stringify(angles));
                shape.setAttribute('data-label-style', values.p_label_style);
                if (typeof redrawPieChart === 'function') redrawPieChart(shape);
            }
            else if (currentParamTool === 'histogram') {
                if (typeof redrawHistogram === 'function') redrawHistogram(shape);
            }
            else if (currentParamTool === 'boxplot') {
                if (typeof redrawBoxplot === 'function') redrawBoxplot(shape);
            }
            else if (currentParamTool === 'parabola') {
                shape.setAttribute('data-a', Math.abs(values.p_a));
                shape.setAttribute('data-dir', values.p_dir);
                const height = Math.abs(values.p_a * (values.p_w/2)**2);
                shape.setAttribute('data-height', height);
                if (typeof redrawParabola === 'function') redrawParabola(shape);
            } 
            else if (currentParamTool === 'inequality') {
                // Radio button 回傳的 value 是字串，需要轉換為數字
                shape.setAttribute('data-dir', parseInt(values.p_dir) || 1);
                shape.setAttribute('data-solid', parseInt(values.p_solid) || 0);
                if (typeof redrawInequality === 'function') redrawInequality(shape);
            }  
			else if (currentParamTool === 'polygon') {
                if (typeof redrawPolygon === 'function') redrawPolygon(shape, values);
            }
            else if (currentParamTool === 'star') {
                if (typeof redrawStar === 'function') redrawStar(shape, values);
            }

            saveState();
            statusText.innerText = "已更新圖形設定";
            // 更新選取框
            if(selectedElements.includes(shape)) drawHandles(shape);
        }
    } else {
        // --- 新增模式 ---
        // 加入判斷：如果是在設定文字與數學的預設值，存好檔後直接結束並啟用該功能
        if (currentParamTool === 'text_defaults' || currentParamTool === 'math_defaults') {
            if (typeof statusText !== 'undefined') statusText.innerText = "預設視窗設定已儲存，為您產生輸入視窗";
            
            // 設定完直接觸發插入 (會呼叫我們剛改好的 setMode 置中生成邏輯)
            const targetTool = currentParamTool === 'text_defaults' ? 'text' : 'math';
            if (typeof setMode === 'function') setMode('draw', targetTool);
            
        } else if (typeof drawParamShape === 'function') {
            drawParamShape(currentParamTool, values);
        }
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
    
    // 樣式設定
    t.setAttribute('fill', 'black');
    t.style.fill = 'black';
    t.setAttribute('font-size', fontSize);
    t.style.fontSize = fontSize + "px";
    
    // [視覺設定]
    t.setAttribute('font-weight', 'normal'); 
    t.style.fontWeight = 'normal';
  
    t.setAttribute('text-anchor', anchor || 'middle');
    
    // [編輯器邏輯]
    t.setAttribute('class', 'shape');
    t.setAttribute('data-tool', 'text');
    
    t.style.pointerEvents = 'all'; // 讓透明邊框接收點擊事件
    t.style.userSelect = 'none';
    t.style.cursor = 'text';
    
    return t;
};
window.mkText = mkText;

function drawParamShape(type, v) {
    const cached = localStorage.getItem(`math_editor_param_${type}`);
    if (cached) {
        try {
            const savedVals = JSON.parse(cached);
            v = { ...v, ...savedVals }; // 合併，覆蓋掉寫死在 HTML 的預設值
        } catch(e) {}
    }

    let layer = document.getElementById('shapes-layer');
    if (!layer) {
        const svg = document.getElementById('svg-canvas');
        if (svg) layer = svg;
        else {
            showAlert("錯誤：找不到繪圖圖層 (shapes-layer)！");
            return;
        }
    }
    
    // 計算畫布中心或是取得定錨點
    let isCentered = false; // 紀錄是否使用可視區中心
    let cx = 400, cy = 300;
    if (window.anchorPoint) {
        cx = window.anchorPoint.x;
        cy = window.anchorPoint.y;
        window.clearAnchorPoint();
    } else {
        const center = typeof window.getVisibleCanvasCenter === 'function' 
                       ? window.getVisibleCanvasCenter() 
                       : { x: 400, y: 300 };
        cx = center.x;
        cy = center.y;
        isCentered = true;
    }
    
    let newElement = null;
    const rad = deg => deg * Math.PI / 180;
    
    // 【新增】解析比例字串的輔助函數 (自動將最大維度縮放至設定大小)
    const parseRatio = (ratioStr, defaultArr, maxScale) => {
        let arr = (ratioStr || "").split(/[,，:： ]+/).map(Number).filter(n => !isNaN(n) && n > 0);
        if (arr.length < defaultArr.length) arr = defaultArr;
        const maxVal = Math.max(...arr);
        const scale = maxScale / maxVal;
        return arr.map(v => v * scale);
    };

    // 準備填滿樣式
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
        const count = v.p_type, r = 100; // 強制使用預設 100
        const g = mk('g', { 'class': 'shape group', 'data-tool': 'group', 'data-sub-tool': 'venn', 'data-center-x': cx, 'data-center-y': cy, 'data-count': count, 'data-radius': r, 'data-spacing-percent': v.p_spacing, 'data-label-a': v.p_label_a, 'data-label-b': v.p_label_b, 'data-label-c': v.p_label_c });
        g.setAttribute('data-params', JSON.stringify(v));
        redrawVennDiagram(g); 
        newElement = g;
        
    } else if (type === 'point') {
        const strokeColor = document.getElementById('stroke-color-select').value || "#000000";
        const r = v.p_r || 3;
        // 讀取是否實心，預設為 true (實心)
        const isSolid = (v.p_solid !== false); 
        
        const fillColor = isSolid ? strokeColor : 'white';
        const solidAttr = isSolid ? '1' : '0';

        newElement = mk('circle', { 
            cx: cx, 
            cy: cy, 
            r: r, 
            fill: fillColor, 
            stroke: strokeColor, 
            'stroke-width': '1.5', 
            'class': 'shape', 
            'data-tool': 'point', 
            'data-solid': solidAttr 
        });       
    } else if (['line-simple', 'line-end', 'line-start', 'line-double', 'ray', 'arrow', 'segment'].includes(type)) {
        const len = 200; // 系統預設長度
        let angDeg = 0;
        if (v.p_mode === 'random') {
            angDeg = Math.random() * 360;
        } else {
            angDeg = parseFloat(v.p_ang) || 0;
        }
        const ang = rad(angDeg);
        const dx = len * Math.cos(ang), dy = -len * Math.sin(ang);
        const x1 = cx - dx / 2, y1 = cy - dy / 2;
        const x2 = cx + dx / 2, y2 = cy + dy / 2;
        const g = mk('g', { 'class': 'shape', 'data-tool': 'line' });
        g.appendChild(mk('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 10 }));
        
        const lineAttrs = { x1, y1, x2, y2, 'class': 'visible-line' };
        if (type === 'line-end' || type === 'line-double' || type === 'arrow') lineAttrs['marker-end'] = 'url(#arrow-end)';
        if (type === 'line-start' || type === 'line-double') lineAttrs['marker-start'] = 'url(#arrow-start)';
        
        g.appendChild(mk('line', lineAttrs));
        newElement = g;
        
    } else if (type === 'angle') {
        let deg = 45;
        if (v.p_mode === 'random') {
            deg = 10 + Math.random() * 160;
        } else {
            deg = parseFloat(v.p_deg) || 45;
        }
        const R = 150, ang = rad(deg);
        const ex = cx + R * Math.cos(ang), ey = cy - R * Math.sin(ang);
        newElement = mk('polyline', { points: `${cx+R},${cy} ${cx},${cy} ${ex},${ey}`, 'class': 'shape', 'data-tool': 'angle' });
        
    } else if (type === 'polyline') {
        const n = Math.max(1, parseInt(v.p_n) || 3); // 讀取折段數
        const showPts = v.p_show_pts !== false;
        
        let pointRadius = 3;
        let isSolid = true;
        try {
            const cachedP = localStorage.getItem('math_editor_param_point');
            if (cachedP) {
                const parsed = JSON.parse(cachedP);
                pointRadius = parsed.p_r || 3;
                if (parsed.p_solid !== undefined) isSolid = parsed.p_solid;
            }
        } catch(e) {}

        const w = 200;
        const h = 100;
        const stepX = w / n;
        const startX = cx - w / 2;
        
        let rawPts =[];
        for (let i = 0; i <= n; i++) {
            rawPts.push({ x: startX + i * stepX, y: cy + (i % 2 === 0 ? -h/2 : h/2) });
        }

        const polyId = 'poly-param-' + Date.now();
        const polyline = document.createElementNS(ns, "polyline");
        const mappedPts = rawPts.map(p => `${p.x},${p.y}`).join(' ');
        polyline.setAttribute('points', mappedPts);
        polyline.setAttribute('class', 'shape');
        polyline.setAttribute('data-tool', 'polyline');
        polyline.id = polyId;
        
        const strokeColor = document.getElementById('stroke-color-select').value || "#000000";
        const strokeWidth = document.getElementById('stroke-width-select').value || "2";
        const lineStyleVal = document.getElementById('line-style-select').value || "solid";
        let dashArray = "none";
        if (lineStyleVal === 'dashed') dashArray = "8,5"; 
        else if (lineStyleVal === 'dotted') dashArray = "2,4"; 
        else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
        polyline.style.cssText = `stroke: ${strokeColor}; stroke-width: ${strokeWidth}; fill: none; stroke-dasharray: ${dashArray}; vector-effect: non-scaling-stroke;`;
        
        layer.appendChild(polyline);
        
        if (showPts) {
            // 【核心修復】不再使用群組，直接將圓點加到畫布上，賦予獨立 shape 屬性
            rawPts.forEach((p, i) => {
                const point = document.createElementNS(ns, "circle");
                point.setAttribute('cx', p.x); 
                point.setAttribute('cy', p.y);
                point.setAttribute('r', pointRadius);
                point.setAttribute('data-solid', isSolid ? '1' : '0'); 
                point.style.cssText = `fill: ${isSolid ? strokeColor : 'white'}; stroke: ${isSolid ? 'none' : strokeColor}; stroke-width: 1.5px; vector-effect: non-scaling-stroke; cursor: move;`;
                point.setAttribute('class', 'shape'); 
                point.setAttribute('data-tool', 'point');
                point.setAttribute('data-owner-shape', polyId); 
                point.setAttribute('data-dependency-type', 'polyline_point'); 
                point.setAttribute('data-vertex-index', i);
                layer.appendChild(point);
            });
        }
        newElement = polyline;      
    }  else if (['tri-any', 'tri-iso', 'tri-right', 'rect', 'rhombus', 'polygon', 'parallelogram', 'trapezoid', 'kite'].includes(type)) {
        let points =[];

        const autoScaleTriangle = (pts) => {
            const [p1, p2, p3] = pts;
            const a = Math.hypot(p2.x - p3.x, p2.y - p3.y);
            const b = Math.hypot(p1.x - p3.x, p1.y - p3.y);
            const c = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            const s = (a + b + c) / 2;
            const currentArea = Math.sqrt(s * (s-a) * (s-b) * (s-c));
            const TARGET_AREA = 15000; 
            if (isNaN(currentArea) || currentArea < 10) return pts; 
            let scale = Math.sqrt(TARGET_AREA / currentArea);
            scale = Math.max(0.5, Math.min(2.5, scale));
            const centroid = { x: (p1.x + p2.x + p3.x) / 3, y: (p1.y + p2.y + p3.y) / 3 };
            return pts.map(p => ({
                x: centroid.x + (p.x - centroid.x) * scale,
                y: centroid.y + (p.y - centroid.y) * scale
            }));
        };

        if (type === 'rect') { 
            const [w, h] = parseRatio(v.p_ratio, [2, 1], 200);
            points = [[cx - w/2, cy - h/2],[cx - w/2, cy + h/2],[cx + w/2, cy + h/2],[cx + w/2, cy - h/2]]; 
        } else if (type === 'rhombus') { 
            const[w, h] = parseRatio(v.p_ratio, [2, 1], 200);
            points = [[cx, cy - h/2],[cx + w/2, cy],[cx, cy + h/2],[cx - w/2, cy]]; 
        } else if (type === 'parallelogram') { 
            const [w, h] = parseRatio(v.p_ratio, [2, 1], 200);
            const ang = rad(v.p_ang); 
            const dx = h / Math.tan(ang); 
            points = [[cx - w/2 - dx/2, cy + h/2],[cx + w/2 - dx/2, cy + h/2],[cx + w/2 + dx/2, cy - h/2],[cx - w/2 + dx/2, cy - h/2]]; 
        } else if (type === 'kite') { 
            const[w, h1, h2] = parseRatio(v.p_ratio,[3, 1, 3], 200);
            const totalH = h1 + h2; 
            points = [[cx, cy - totalH/2],[cx + w/2, cy - totalH/2 + h1],[cx, cy + totalH/2],[cx - w/2, cy - totalH/2 + h1]]; 
        } else if (type === 'trapezoid') { 
            const[top, bot, h] = parseRatio(v.p_ratio, [1, 2, 1], 200);
            points = [[cx - bot/2, cy + h/2],[cx + bot/2, cy + h/2],[cx + top/2, cy - h/2],[cx - top/2, cy - h/2]]; 
        } else if (type === 'tri-iso') { 
            let mode = v.p_mode || 'angle';
            let angRad = 0;
            if (mode === 'random') {
                angRad = rad(20 + Math.random() * 60); 
            } else {
                let deg = parseFloat(v.p_angle);
                if (isNaN(deg) || deg <= 0 || deg >= 90) deg = 65;
                angRad = rad(deg);
            }
            const b = 100; 
            const h = (b / 2) * Math.tan(angRad); 
            const pA = {x: -b/2, y: h/2};
            const pB = {x: b/2, y: h/2};
            const pC = {x: 0, y: -h/2}; 
            const scaled = autoScaleTriangle([pA, pB, pC]);
            const centroidX = (scaled[0].x + scaled[1].x + scaled[2].x) / 3;
            const centroidY = (scaled[0].y + scaled[1].y + scaled[2].y) / 3;
            points = scaled.map(p =>[p.x + cx - centroidX, p.y + cy - centroidY]);
        } else if (type === 'tri-right') { 
            let mode = v.p_mode || 'random';
            let w = 120, h = 90;
            if (mode === 'random') {
                w = 100 + Math.random() * 50; h = 100 + Math.random() * 50;
            } else if (mode === 'angle') {
                let deg = parseFloat(v.p_angle);
                if (isNaN(deg) || deg <= 0 || deg >= 90) deg = 30;
                w = 150; h = w * Math.tan(rad(deg));
            } else { // ratio
                const rArr = parseRatio(v.p_ratio, [4, 3], 200);
                w = rArr[0]; h = rArr[1];
            }
            const pA = {x: -w/2, y: h/2}; const pB = {x: w/2, y: h/2}; const pC = {x: -w/2, y: -h/2};
            const scaled = autoScaleTriangle([pA, pB, pC]);
            const centroidX = (scaled[0].x + scaled[1].x + scaled[2].x) / 3;
            const centroidY = (scaled[0].y + scaled[1].y + scaled[2].y) / 3;
            points = scaled.map(p =>[p.x + cx - centroidX, p.y + cy - centroidY]);
        } else if (type === 'tri-any') {
            let mode = v.p_mode;
            if (mode === 'random') mode = Math.random() > 0.5 ? 'acute' : 'obtuse';
            
            let pA, pB, pC;

            if (mode === 'ratio') {
                let sides = (v.p_ratio || "3,4,5").split(/[,，:： ]+/).map(Number).filter(n => !isNaN(n) && n > 0);
                if (sides.length !== 3 || sides[0]+sides[1]<=sides[2] || sides[0]+sides[2]<=sides[1] || sides[1]+sides[2]<=sides[0]) {
                    showAlert("無效的三邊比例，無法構成三角形！已自動套用 3:4:5");
                    sides = [3, 4, 5];
                }
                const[a, b, c_side] = sides;
                const scale = 30;
                const sa = a * scale, sb = b * scale, sc = c_side * scale;
                const cosA = (sc*sc + sb*sb - sa*sa) / (2 * sc * sb);
                const angleA_rad = Math.acos(cosA);
                pA = {x: 0, y: 0}; 
                pB = {x: sc, y: 0}; 
                pC = {x: sb * Math.cos(angleA_rad), y: -sb * Math.sin(angleA_rad)};
            } else { 
                const isObtuse = (mode === 'obtuse');
                const isAcute = (mode === 'acute');
                const R = 100;
                let a1, a2, a3;
                const baseAng = Math.random() * Math.PI * 2;
                
                if (isObtuse) {
                    // 隨機決定哪一段弧是超過 180 度的「大弧」
                    const hugeArc = Math.PI + (5 + Math.random() * 50) * Math.PI / 180;
                    const remain = 2 * Math.PI - hugeArc;
                    const arc1 = (remain * 0.3) + Math.random() * (remain * 0.4);
                    const arc2 = remain - arc1;
                    
                    // 隨機分配弧長順序，讓鈍角頂點位置不固定
                    const arcs = [hugeArc, arc1, arc2].sort(() => Math.random() - 0.5);
                    a1 = baseAng;
                    a2 = a1 + arcs[0];
                    a3 = a2 + arcs[1];
                } else if (isAcute) {
                    a1 = baseAng + (Math.random() * 60 - 30) * Math.PI/180;
                    a2 = baseAng + 120 * Math.PI/180 + (Math.random() * 60 - 30) * Math.PI/180;
                    a3 = baseAng + 240 * Math.PI/180 + (Math.random() * 60 - 30) * Math.PI/180;
                } else { 
                    const u = Math.random() * Math.PI, v_val = Math.random() * Math.PI;
                    const min = Math.min(u, v_val), max = Math.max(u, v_val);
                    a1 = baseAng;
                    a2 = baseAng + Math.PI/3 + min;
                    a3 = baseAng + 2*Math.PI/3 + max;
                }
                pA = {x: R*Math.cos(a1), y: -R*Math.sin(a1)};
                pB = {x: R*Math.cos(a2), y: -R*Math.sin(a2)};
                pC = {x: R*Math.cos(a3), y: -R*Math.sin(a3)};
            }

            // 【核心修正】：隨機打亂頂點順序
            // 這樣在下方的旋轉邏輯中，被選為 p1, p2 (底邊) 的線段就是隨機的
            let rawVertices = [pA, pB, pC].sort(() => Math.random() - 0.5);

            const scaledPoints = autoScaleTriangle(rawVertices);
            
            const p1 = scaledPoints[0];
            const p2 = scaledPoints[1];
            const p3 = scaledPoints[2];
            
            const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const cosAng = Math.cos(-ang), sinAng = Math.sin(-ang);
            const rot = (pt) => ({
                x: p1.x + (pt.x - p1.x) * cosAng - (pt.y - p1.y) * sinAng,
                y: p1.y + (pt.x - p1.x) * sinAng + (pt.y - p1.y) * cosAng
            });
            
            let rA = rot(p1), rB = rot(p2), rC = rot(p3);
            if (rC.y > rA.y) rC.y = rA.y - (rC.y - rA.y); 

            const sA = rA, sB = rB, sC = rC;
            const centroidX = (sA.x + sB.x + sC.x) / 3;
            const centroidY = (sA.y + sB.y + sC.y) / 3;
            const offsetX = cx - centroidX;
            const offsetY = cy - centroidY;
            points = [[sA.x + offsetX, sA.y + offsetY],[sB.x + offsetX, sB.y + offsetY],[sC.x + offsetX, sC.y + offsetY]];
		} else if (type === 'polygon') {
            const n = v.p_n, r = 100; 
            for(let i=0; i<n; i++) { 
                const theta = rad(90 + 360 * i / n); 
                points.push([cx + r * Math.cos(theta), cy - r * Math.sin(theta)]); 
            } 
        }

        const ptsStr = points.map(p => `${p[0]},${p[1]}`).join(' ');
        const poly = mk('polygon', { points: ptsStr, 'class': 'shape', 'data-tool': 'polygon', 'data-sub-tool': type }, true);
        
        if (type === 'polygon' || type === 'star') {
            poly.setAttribute('data-center-x', cx);
            poly.setAttribute('data-center-y', cy);
            poly.setAttribute('data-params', JSON.stringify(v));
        }

        if (!poly.id) poly.id = 'poly-' + Date.now();
        layer.appendChild(poly);
        newElement = poly; // 設定多邊形為主體，讓最後的程式碼選取它

        if (type === 'polygon' && v.p_diagonals) {
            const diagColor = '#7f8c8d'; // 灰色虛線
            
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 2; j < points.length; j++) {
                    // 排除相鄰頂點 (這是邊，不是對角線)
                    if (i === 0 && j === points.length - 1) continue;
                    
                    // 建立對角線群組 (為了好點擊，包含 hit-line)
                    const g = mk('g', { 'class': 'shape group', 'data-tool': 'line' });
                    g.setAttribute('data-owner-shape', poly.id);
                    g.setAttribute('data-dependency-type', 'polygon_diagonal'); // 設定特殊類型
                    g.setAttribute('data-vertex-indices', `${i},${j}`);         // 記錄連接哪兩個點
                    
                    const p1 = { x: points[i][0], y: points[i][1] };
                    const p2 = { x: points[j][0], y: points[j][1] };

                    const hitLine = mk('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: 'transparent', 'stroke-width': 10, 'class': 'hit-line' });
                    hitLine.style.cursor = 'pointer';
                    
                    const visLine = mk('line', { 
                        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, 
                        stroke: diagColor, 'stroke-width': 1, 'stroke-dasharray': '5,3', 
                        'class': 'visible-line' 
                    });
                    visLine.style.pointerEvents = 'none';

                    g.appendChild(hitLine);
                    g.appendChild(visLine);
                    layer.appendChild(g);
                }
            }
            // 注意：這裡不設定 newElement = group，而是保持 newElement = poly
            // 這樣下面的通用邏輯就會將 newElement (多邊形) 加入選取，而不是選不到東西
        }
    } else if (type === 'circle' || type === 'ellipse') {
        const[rx, ry] = (type === 'ellipse') ? parseRatio(v.p_ratio, [5, 3], 100) : [100, 100];
        const showCenter = (type === 'circle') ? v.p_show_center : false;
        const showLine = (type === 'circle') ? (v.p_show_line || 'none') : 'none';

        const body = mk('ellipse', { 
            cx: cx, cy: cy, rx: rx, ry: ry, 
            'class': 'shape', 
            'data-tool': 'ellipse', 
            'data-sub-tool': (type === 'circle' ? 'circle' : 'ellipse') 
        }, true);
        
        body.id = 'circle-' + Date.now();
        layer.appendChild(body);
        newElement = body;

        if (showCenter) {
            const centerPt = mk('circle', { 
                cx: cx, cy: cy, r: 3, fill: 'black', stroke: 'none', 
                'class': 'shape', 'data-tool': 'point', 
                'data-owner-shape': body.id, 
                'data-dependency-type': 'center-point' 
            });
            layer.appendChild(centerPt);
            const fontSize = window.getDefaultTextSize ? window.getDefaultTextSize() : "20";
            const textO = mkText(cx - 16, cy + 20, "O", "middle", fontSize);
            textO.style.fontWeight = "bold"; 
            textO.setAttribute('data-owner-shape', body.id); 
            textO.setAttribute('data-dependency-type', 'center-label');
            layer.appendChild(textO);
        }

        if (showLine !== 'none') {
            const g = mk('g', { 'class': 'shape group', 'data-tool': 'line' });
            g.setAttribute('data-owner-shape', body.id);
            const angleRad = 0;
            g.setAttribute('data-angle', angleRad);

            let p1, p2;
            if (showLine === 'diameter') {
                g.setAttribute('data-dependency-type', 'diameter');
                p1 = { x: cx - rx, y: cy };
                p2 = { x: cx + rx, y: cy };
            } else {
                g.setAttribute('data-dependency-type', 'radius');
                p1 = { x: cx, y: cy };
                p2 = { x: cx + rx, y: cy };
            }

            const hitLine = mk('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: 'transparent', 'stroke-width': 10, 'class': 'hit-line' });
            hitLine.style.cursor = 'pointer';
            const strokeColor = document.getElementById('stroke-color-select').value || "#000000";
            const visLine = mk('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: strokeColor, 'stroke-width': 2, 'class': 'visible-line' });
            visLine.style.pointerEvents = 'none';

            g.appendChild(hitLine); g.appendChild(visLine);
            layer.appendChild(g);
        }
	} else if (['arc', 'sector', 'circular_segment'].includes(type)) {
        const r = 100, sA = rad(v.p_start), eA = rad(v.p_end);
        const x1 = cx + r * Math.cos(sA), y1 = cy - r * Math.sin(sA), x2 = cx + r * Math.cos(eA), y2 = cy - r * Math.sin(eA);
        let diff = v.p_end - v.p_start; while(diff < 0) diff += 360;
        const large = diff > 180 ? 1 : 0;
        let d = (type === 'sector') ? `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z` : 
                (type === 'circular_segment') ? `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z` : `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
        newElement = mk('path', { d, 'class': 'shape', 'data-tool': 'ellipse', 'data-sub-tool': (type==='circular_segment'?'arch':type), 'data-center-x': cx, 'data-center-y': cy, 'data-radius': r, 'data-start-angle': sA, 'data-end-angle': eA }, type !== 'arc');
        
    }  else if (type === 'star') {
        const n = Math.max(5, v.p_n), r = 100, jump = Math.floor(n / 2);
        let pts =[]; for (let i = 0; i < n; i++) { const theta = rad(90 + 360 * i / n); pts.push({ x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) }); }
        let order =[]; let curr = 0; for (let i = 0; i < n; i++) { order.push(pts[curr]); curr = (curr + jump) % n; }
        newElement = mk('polygon', { points: order.map(p => `${p.x},${p.y}`).join(' '), 'class': 'shape star-polygon', 'data-tool': 'polygon', 'data-sub-tool': 'star', 'data-center-x': cx, 'data-center-y': cy }, true);
        newElement.setAttribute('data-params', JSON.stringify(v));
	} else if (type === 'solid-blocks') {
        if (typeof window.createSolidBlocks === 'function') {
            const blockGroup = window.createSolidBlocks(cx, cy-50, v);
            if (typeof saveState === 'function') saveState();
            setTimeout(() => { if (typeof setMode === 'function') setMode('select'); if (typeof deselectAll === 'function') deselectAll(); if (typeof addToSelection === 'function') addToSelection(blockGroup); }, 50);
            newElement = null; 
        }
        
    } else if (['solid', 'cylinder', 'cone', 'sphere', 'pyramid', 'prism'].includes(type)) {
        let w = 150, h = 150, dVal = 100, r = 75;
        
        if (type === 'solid') {
            [w, h, dVal] = parseRatio(v.p_ratio, [2, 2, 1], 150);
        } else if (type === 'cylinder' || type === 'cone') {
            // 對於圓柱與圓錐，我們將半徑 r 乘 2 視為寬度來比較比例
            let arr = parseRatio(v.p_ratio, [1, 3], 150);
            r = arr[0]; h = arr[1];
        } else if (type === 'pyramid' || type === 'prism') {
            [w, h] = parseRatio(v.p_ratio, [1, 1], 150);
        }
        let g;
        if (type === 'solid') {
            const ang = 45 * Math.PI / 180;
            const dx = dVal * Math.cos(ang) * 0.5; const dy = -dVal * Math.sin(ang) * 0.5;
            g = mk('g', { 'class': 'shape group', 'data-tool': 'solid', 'data-sub-tool': 'solid-cube', 'data-view-mode': '3d', 'data-x': cx - w/2, 'data-y': cy - h/2, 'data-w': w, 'data-h': h, 'data-d': dVal, 'data-dx': dx, 'data-dy': dy });
        } else if (type === 'sphere') {
            g = mk('g', { 'class': 'shape group', 'data-tool': 'solid', 'data-sub-tool': 'solid-sphere', 'data-view-mode': '3d', 'data-cx': cx, 'data-cy': cy, 'data-r': 75 });
        } else if (type === 'pyramid') {
			g = mk('g', { 'class': 'shape group', 'data-tool': 'solid', 'data-sub-tool': 'solid-pyramid', 'data-view-mode': '3d', 'data-cx': cx, 'data-cy': cy + h/2, 'data-w': w, 'data-h': h, 'data-d': dVal });
        } else if (type === 'prism') {
            g = mk('g', { 'class': 'shape group', 'data-tool': 'solid', 'data-sub-tool': 'solid-prism', 'data-view-mode': '3d', 'data-cx': cx, 'data-cy': cy, 'data-w': w, 'data-h': h });
        } else {
            const subT = type === 'cylinder' ? 'solid-cylinder' : 'solid-cone';
            g = mk('g', { 'class': 'shape group', 'data-tool': 'solid', 'data-sub-tool': subT, 'data-view-mode': '3d', 'data-cx': cx, 'data-cy': cy - h/2, 'data-r': r, 'data-h': h });
        }
		
        const visPath = mk('path', { class: 'solid-visible' });
        const hidPath = mk('path', { class: 'solid-hidden', 'stroke-dasharray': '4,4' });
        g.appendChild(visPath); g.appendChild(hidPath);
        if (typeof redrawSolid === 'function') redrawSolid(g);
        newElement = g;
    } else if (type === 'boxplot') {
        const min = v.p_min, q1 = v.p_q1, med = v.p_med, q3 = v.p_q3, max = v.p_max, boxH = 60, whiskH = 30;
        const sx = cx - (max - min) / 2;
        const mapX = (val) => sx + (val - min);
        const g = mk('g', { 'class': 'shape group', 'data-tool': 'group', 'data-sub-tool': 'boxplot' });
        g.setAttribute('data-params', JSON.stringify(v));
        g.appendChild(mk('line', { x1: mapX(min), y1: cy, x2: mapX(q1), y2: cy, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('line', { x1: mapX(q3), y1: cy, x2: mapX(max), y2: cy, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('line', { x1: mapX(min), y1: cy - whiskH/2, x2: mapX(min), y2: cy + whiskH/2, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('line', { x1: mapX(max), y1: cy - whiskH/2, x2: mapX(max), y2: cy + whiskH/2, 'class': 'shape', 'data-tool': 'line' }));
        g.appendChild(mk('rect', { x: mapX(q1), y: cy - boxH/2, width: Math.abs(mapX(q3)-mapX(q1)), height: boxH, 'class': 'shape', 'data-tool': 'rect' }, true));
        g.appendChild(mk('line', { x1: mapX(med), y1: cy - boxH/2, x2: mapX(med), y2: cy + boxH/2, 'class': 'shape', 'data-tool': 'line' }));
        [min, q1, med, q3, max].forEach(val => g.appendChild(mkText(mapX(val), cy + boxH/2 + 20, val, "middle", "12")));
        newElement = g;
        
    } else if (type === 'parabola') {
        // 【修改】拋物線：改為 Group，支援兩個控制點 (長度與開口)
        const a = v.p_a || 0.01;
        const width = v.p_w || 200; // 顯示範圍寬度
        // 計算對應的 y 深度 (height) = a * (width/2)^2
        const height = Math.abs(a * (width/2)**2);
        
        const g = mk('g', { 
            'class': 'shape group', 
            'data-tool': 'group', 
            'data-sub-tool': 'parabola',
            'data-center-x': cx,
            'data-center-y': cy,
            'data-a': a,
            'data-height': height
        });
        g.setAttribute('data-params', JSON.stringify(v));
        
        // 建立路徑與控制點 (隱藏的數據點)
        redrawParabola(g);
        newElement = g;

    } else if (type === 'histogram') {
        const g = mk('g', { 
            'class': 'shape group', 
            'data-tool': 'group', 
            'data-sub-tool': 'histogram', 
            'data-center-x': cx, 
            'data-center-y': cy 
        });
        
        // 寫入參數
        g.setAttribute('data-params', JSON.stringify(v));
        
        // 加入畫布 (因為 redraw 需要計算文字寬度，雖非必須但較保險)
        layer.appendChild(g);
        
        // 呼叫共用重繪函式
        if (typeof redrawHistogram === 'function') {
            redrawHistogram(g);
        }
        
        // 設定為新元件 (這樣外層邏輯會處理選取)
        newElement = g;        
    } else if (type === 'axis_chart') {
        const g = mk('g', { 'class': 'shape group axis-chart', 'data-tool': 'group', 'data-sub-tool': 'axis-chart' });
        g.id = 'axis-chart-' + Date.now();
        g.setAttribute('data-w', 300); g.setAttribute('data-h', 200); 
        g.setAttribute('data-center-x', cx); g.setAttribute('data-center-y', cy);
        g.setAttribute('data-params', JSON.stringify(v));
        document.getElementById('shapes-layer').appendChild(g);
        if(typeof redrawAxisChart === 'function') redrawAxisChart(g);
        saveState();
        setTimeout(() => { if (typeof setMode === 'function') setMode('select'); deselectAll(); addToSelection(g); }, 50);
        newElement = null; 

	} else if (type === 'pie_chart') {
		const vals = v.p_vals.split(/[,，\s]+/).map(parseFloat).filter(n => !isNaN(n));
		const labs = v.p_labels.split(/[,，\s]+/).map(s => s.trim());
		const r = 100, total = vals.reduce((a, b) => a + b, 0);
		let cur = 0; let angles = [];
		vals.forEach(val => { cur += (val/total)*2*Math.PI; angles.push(cur); });
		const g = mk('g', { 'class': 'shape group pie-chart', 'data-tool': 'group', 'data-sub-tool': 'pie-chart', 'data-center-x': cx, 'data-center-y': cy, 'data-radius': r, 'data-values': JSON.stringify(vals), 'data-labels': JSON.stringify(labs), 'data-angles': JSON.stringify(angles), 'data-label-style': v.p_label_style });
		g.setAttribute('data-params', JSON.stringify(v));
        redrawPieChart(g); newElement = g;
        
    } else if (type === 'inequality') {
        const dir = parseInt(v.p_dir) || 1;
        const isSolid = parseInt(v.p_solid) || 0;
        const len = 150; // 系統預設長度
        
        const g = mk('g', {
            'class': 'shape group',
            'data-tool': 'group',
            'data-sub-tool': 'inequality',
            'data-center-x': cx,
            'data-center-y': cy,
            'data-dir': dir,
            'data-len': len,
            'data-solid': isSolid
        });
        g.setAttribute('data-params', JSON.stringify(v));
        redrawInequality(g);
        newElement = g;
    }

    // 通用加入邏輯
    if (newElement) {
        if (!newElement.id) {
            newElement.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
        }

        if (!newElement.parentNode) {
            layer.appendChild(newElement);
        }

        // --- 核心修正：若使用可視區中心，圖形完成後向左平移 1/4 寬度 ---
        if (isCentered) {
            try {
                const bbox = newElement.getBBox();
                if (bbox.width > 0) {
                    if (typeof moveShape === 'function') {
                        moveShape(newElement, -bbox.width / 4, 0);
                    }
                }
            } catch(e) {}
        }
        
        const toolT = newElement.getAttribute('data-tool');
        const subT = newElement.getAttribute('data-sub-tool') || '';
        
        // 【修正】補上 toolT === 'angle' 和 'polyline'，讓角圖案也能自動標出度數！
        if (toolT === 'polygon' || toolT === 'tri' || toolT === 'ellipse' || toolT === 'angle' || toolT === 'polyline' || 
            subT.startsWith('tri-') || subT === 'rect' || subT === 'square') {
            
            if (typeof generateLabels === 'function') {
                generateLabels(newElement);
            }
            
            if (typeof generateAngleLabels === 'function') {
                generateAngleLabels(newElement);
            }
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

// 🆕 新增：建立【可編輯】的文字物件 (修正移動與顏色問題版)
function createPieLabelObject(x, y, text, size, color) {
    const fo = document.createElementNS(ns, "foreignObject");
    
    // 策略改變：使用 transform 來定位錨點，這樣 moveShape 函式就能正確識別並移動它
    fo.setAttribute("transform", `translate(${x}, ${y})`);
    
    // 初始 x, y 用於微調置中 (相對於 transform 的原點)
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

    // 非同步調整大小與置中偏移
    setTimeout(() => {
        if (!div.isConnected) return; 
        const w = div.offsetWidth;
        const h = div.offsetHeight;
        fo.setAttribute("width", w + 4);
        fo.setAttribute("height", h + 4);
        
        // 計算置中偏移量 (讓 transform 的點位於物件正中心)
        const offsetX = -(w + 4) / 2;
        const offsetY = -(h + 4) / 2;
        
        fo.setAttribute("x", offsetX);
        fo.setAttribute("y", offsetY);
        
        // 再次強制寫入 transform 確保位置鎖定
        fo.setAttribute("transform", `translate(${x}, ${y})`);
    }, 50);

    return fo;
}

// 3. 🛠️ 修改：核心重繪函式 (強制黑字版)
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

    // 統一設定文字顏色為黑色，解決解群後在白底看不見的問題
    const textColor = '#000000'; 

    angles.forEach((endAngle, i) => {
        const val = values[i];
        
        // --- 1. 繪製扇形 ---
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

        // --- 2. 處理標籤 ---
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

        // 樣式邏輯：不管原本邏輯為何，顏色參數全部傳入 textColor (黑色)
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
            // 樣式1 (內部)
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
    // 1. 清空群組內的舊元素
    while (group.firstChild) {
        group.removeChild(group.firstChild);
    }

    // 2. 從 data-* 屬性讀取參數
    const cx = parseFloat(group.getAttribute('data-center-x'));
    const cy = parseFloat(group.getAttribute('data-center-y'));
    const count = parseInt(group.getAttribute('data-count'));
    const r = parseFloat(group.getAttribute('data-radius'));
    const spacingPercent = parseFloat(group.getAttribute('data-spacing-percent'));
    
    // 讀取標籤文字
    const labels = {
        a: group.getAttribute('data-label-a') || "A",
        b: group.getAttribute('data-label-b') || "B",
        c: group.getAttribute('data-label-c') || "C"
    };
    
    // 3. 定義顏色 (半透明)
    const colors = {
        a: 'rgba(231, 76, 60, 0.5)',   // 紅
        b: 'rgba(52, 152, 219, 0.5)',  // 藍
        c: 'rgba(46, 204, 113, 0.5)'   // 綠
    };

    // 4. 計算圓心距離
    const d = r * (spacingPercent / 100) * 2;

    // 輔助函式：建立圓形
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
    
    // 5. 根據圓的數量進行繪製
    if (count === 2) {
        const c1 = { x: cx - d / 2, y: cy };
        const c2 = { x: cx + d / 2, y: cy };

        // 繪製圓
        group.appendChild(createCircle(c1.x, c1.y, r, colors.a));
        group.appendChild(createCircle(c2.x, c2.y, r, colors.b));

        // 繪製主要標籤
        group.appendChild(mkText(c1.x - r * 0.4, c1.y, labels.a, 'middle', '20'));
        group.appendChild(mkText(c2.x + r * 0.4, c2.y, labels.b, 'middle', '20'));
        
        // 交集標籤
        if (d < 2 * r) {
            const intersectLabel = `${labels.a}∩${labels.b}`;
            group.appendChild(mkText(cx, cy, intersectLabel, 'middle', '14'));
        }

    } else if (count === 3) {
        const h = d * Math.sqrt(3) / 2;
        const c1 = { x: cx, y: cy - h / 2 - (r * 0.2) }; // 上 A
        const c2 = { x: cx - d / 2, y: cy + h / 2 };     // 左下 B
        const c3 = { x: cx + d / 2, y: cy + h / 2 };     // 右下 C

        // 繪製圓
        group.appendChild(createCircle(c1.x, c1.y, r, colors.a));
        group.appendChild(createCircle(c2.x, c2.y, r, colors.b));
        group.appendChild(createCircle(c3.x, c3.y, r, colors.c));

        // 繪製主要標籤
        group.appendChild(mkText(c1.x, c1.y - r * 0.5, labels.a, 'middle', '20'));
        group.appendChild(mkText(c2.x - r * 0.5, c2.y + r * 0.2, labels.b, 'middle', '20'));
        group.appendChild(mkText(c3.x + r * 0.5, c3.y + r * 0.2, labels.c, 'middle', '20'));
        
        // 繪製交集標籤
        const p12 = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
        const p13 = { x: (c1.x + c3.x) / 2, y: (c1.y + c3.y) / 2 };
        const p23 = { x: (c2.x + c3.x) / 2, y: (c2.y + c3.y) / 2 };
        
        // A∩B
        group.appendChild(mkText(p12.x - 10, p12.y - 10, `${labels.a}∩${labels.b}`, 'middle', '12')); 
        // A∩C
        group.appendChild(mkText(p13.x + 10, p13.y - 10, `${labels.a}∩${labels.c}`, 'middle', '12'));
        // B∩C
        group.appendChild(mkText(p23.x, p23.y + 15, `${labels.b}∩${labels.c}`, 'middle', '12'));
        
        // A∩B∩C (正中心)
        // 🛠️ 修正重點：這裡原本寫死成 "∩"，現在改為正確的變數 centerLabel
        if (d < r * 1.5) {
             const centerLabel = `${labels.a}∩${labels.b}∩${labels.c}`;
             // 中心點位置稍微下移一點點 (+ h/6) 以符合視覺重心
             group.appendChild(mkText(cx, cy + h / 6, centerLabel, 'middle', '12'));
        }
    }
}

function redrawParabola(group) {
    group.innerHTML = '';
    const cx = parseFloat(group.getAttribute('data-center-x'));
    const cy = parseFloat(group.getAttribute('data-center-y'));
    const a = parseFloat(group.getAttribute('data-a'));
    const height = parseFloat(group.getAttribute('data-height'));
    const dir = group.getAttribute('data-dir') || 'up';
    
    // 計算寬度的一半
    const halfW = Math.sqrt(height / Math.abs(a));
    const startX = -halfW;
    const endX = halfW;
    const step = (endX - startX) / 20; 

    let d = "";
    for (let i = startX; i <= endX + 0.01; i += step) {
        let x, y;
        const val = a * i * i;

        switch (dir) {
            case 'up':    x = cx + i; y = cy - val; break;
            case 'down':  x = cx + i; y = cy + val; break;
            case 'left':  x = cx - val; y = cy + i; break;
            case 'right': x = cx + val; y = cy + i; break;
        }
        
        d += (d === "" ? "M" : "L") + ` ${x} ${y}`;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "visible-line");
    path.style.cssText = "fill:none; stroke:black; stroke-width:2; vector-effect:non-scaling-stroke;";
    
    const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitPath.setAttribute("d", d);
    hitPath.setAttribute("class", "hit-line");
    hitPath.style.cssText = "fill:none; stroke:transparent; stroke-width:15; cursor:move;";

    group.appendChild(hitPath);
    group.appendChild(path);
    
    const vertex = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    vertex.setAttribute("cx", cx);
    vertex.setAttribute("cy", cy);
    vertex.setAttribute("r", 3);
    vertex.setAttribute("fill", "black");
    group.appendChild(vertex);
}

// 【新增】不等式重繪函式
function redrawInequality(group) {
    group.innerHTML = '';
    const cx = parseFloat(group.getAttribute('data-center-x'));
    const cy = parseFloat(group.getAttribute('data-center-y'));
    const dir = parseFloat(group.getAttribute('data-dir')); // 1 or -1
    const len = parseFloat(group.getAttribute('data-len'));
    const isSolid = group.getAttribute('data-solid') == '1';

    const endX = cx + len * dir;
    const r = 5;

    // 線條
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    // 起點稍微讓開，避免被圓圈蓋住
    const lineStart = isSolid ? cx : cx + r * dir; 
    line.setAttribute("x1", lineStart);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", endX);
    line.setAttribute("y2", cy);
    line.setAttribute("marker-end", "url(#arrow-end)");
    line.setAttribute("class", "visible-line");
    line.style.cssText = "stroke:black; stroke-width:2; pointer-events:none;";
    
    // 隱形點擊區
    const hitLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hitLine.setAttribute("x1", cx); hitLine.setAttribute("y1", cy);
    hitLine.setAttribute("x2", endX); hitLine.setAttribute("y2", cy);
    hitLine.style.cssText = "stroke:transparent; stroke-width:15; cursor:move;";

    // 起點圓圈
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", r);
    circle.setAttribute("class", "inequality-point");
    circle.style.cssText = `fill:${isSolid ? 'black' : 'white'}; stroke:black; stroke-width:2px;`;

    // 垂直標記線 (裝飾)
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", cx); tick.setAttribute("y1", cy + r + 5);
    tick.setAttribute("x2", cx); tick.setAttribute("y2", cy + r + 15);
    tick.style.cssText = "stroke:black; stroke-width:1.5;";

    group.appendChild(hitLine);
    group.appendChild(line);
    group.appendChild(circle);
    group.appendChild(tick);
}

function redrawHistogram(group) {
    group.innerHTML = '';
    const params = JSON.parse(group.getAttribute('data-params'));
    let cx = 400, cy = 300;
    if (group.hasAttribute('data-center-x')) {
        cx = parseFloat(group.getAttribute('data-center-x'));
        cy = parseFloat(group.getAttribute('data-center-y'));
    }

    // 【修改】：以逗號分割，保留空字串，將空數值轉為 0
    const vals = (params.p_vals || "").split(/[,，]/).map(s => parseFloat(s.trim())).map(n => isNaN(n) ? 0 : n);
    const labs = (params.p_labs || "").split(/[,，]/).map(s => s.trim());
    const guideLabels = (params.p_guide_labels || "").split(/[,，]/).map(s => s.trim());

    const bw = params.p_width, gap = params.p_gap;
    
    const userMax = parseFloat(params.p_y_max) || 0;
    const maxV = userMax > 0 ? userMax : Math.max(...vals, 100);
    
    const count = vals.length;
    // 【修改】支援從外部讀取高度，以便等比例縮放
    const chartH = parseFloat(group.getAttribute('data-h')) || 200; 
    const scale = chartH / maxV;
    const tw = count * bw + (count - 1) * gap;
    const sx = cx - tw / 2, sy = cy + chartH / 2;

    const mk = (tag, attrs) => {
        const el = document.createElementNS(ns, tag);
        for(let k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    };

    const xAxis = mk('line', { x1: sx - 20, y1: sy, x2: sx + tw + 40, y2: sy, 'marker-end': 'url(#arrow-end)', 'stroke':'black', 'stroke-width':2 });
    xAxis.setAttribute('class', 'shape');
    xAxis.style.pointerEvents = 'all';
    group.appendChild(xAxis);
    
    const yAxis = mk('line', { x1: sx - 10, y1: sy, x2: sx - 10, y2: sy - chartH - 40, 'marker-end': 'url(#arrow-end)', 'stroke':'black', 'stroke-width':2 });
    yAxis.setAttribute('class', 'shape');
    yAxis.style.pointerEvents = 'all';
    group.appendChild(yAxis);
	
    const labelPos = params.p_label_pos || 'side';

    if (params.p_axis_x) {
        if (labelPos === 'arrow') {
            group.appendChild(mkText(sx + tw + 50, sy + 5, params.p_axis_x, "start", "16"));
        } else {
            group.appendChild(mkText(sx + tw / 2, sy + 45, params.p_axis_x, "middle", "16"));
        }
    }

    if (params.p_axis_y) {
        if (labelPos === 'arrow') {
            group.appendChild(mkText(sx - 10, sy - chartH - 50, params.p_axis_y, "middle", "16"));
        } else {
            const labelX = sx - 55;
            const labelY = sy - chartH / 2;
            const t = mkText(labelX, labelY, params.p_axis_y, "middle", "16");
            if (/[\u4e00-\u9fa5]/.test(params.p_axis_y)) {
                t.style.writingMode = "vertical-rl";
                t.style.textOrientation = "upright";
            } else {
                t.setAttribute("transform", `rotate(-90, ${labelX}, ${labelY})`);
            }
            group.appendChild(t);
        }
    }
	
    const yInterval = parseFloat(params.p_y_interval) || 20;
    const showTicks = (params.p_y_ticks !== false); 

    if (showTicks && yInterval > 0) {
        for (let v = yInterval; v <= maxV; v += yInterval) {
            const py = sy - v * scale;
            group.appendChild(mk('line', { x1: sx - 15, y1: py, x2: sx - 10, y2: py, stroke: 'black', 'stroke-width': 1.5 }));
            group.appendChild(mkText(sx - 20, py, v.toString(), "end", "14"));
        }
    }

    vals.forEach((val, i) => {
        const h = val * scale, x = sx + i * (bw + gap), y = sy - h;
        
        const barGroup = document.createElementNS(ns, 'g');
        barGroup.setAttribute('class', 'shape histogram-bar');
        barGroup.setAttribute('data-tool', 'histogram-bar');
        barGroup.style.cursor = 'pointer';

        const guide = mk('line', { x1: sx - 10, y1: y, x2: x, y2: y, class: 'bar-guide', stroke: '#2980b9', 'stroke-width': 1.5, 'stroke-dasharray': '4,4' });
        guide.style.display = 'none';
        guide.style.pointerEvents = 'none';
        barGroup.appendChild(guide);

        // 【新增】：輔助線 Y 軸標籤
        if (guideLabels[i]) {
            const guideTxt = mkText(sx - 15, y, guideLabels[i], 'end', '14');
            guideTxt.classList.add('bar-guide', 'guide-y-label', 'shape'); // 加入 shape 讓系統可選取
            guideTxt.setAttribute('data-tool', 'guide-y-label');
            guideTxt.style.display = 'none';
            guideTxt.style.fill = '#2980b9';
            guideTxt.style.fontWeight = 'bold';
            guideTxt.style.pointerEvents = 'all'; // 允許滑鼠點擊
            guideTxt.style.setProperty('cursor', 'ew-resize', 'important'); // 顯示左右拖曳游標
            barGroup.appendChild(guideTxt);
        }
		
        const rect = mk('rect', { x, y, width: bw, height: h, fill: 'rgba(41, 128, 185, 0.2)', stroke: 'black', 'stroke-width': 2 });
        barGroup.appendChild(rect);

        if (params.p_val_pos !== 'none') {
            const tY = params.p_val_pos === 'inside' ? (y + h/2) : (y - 8);
            const tCol = params.p_val_pos === 'inside' ? '#ffffff' : 'black';
            const t1 = mkText(x + bw/2, tY, val, 'middle', '14');
            t1.setAttribute('fill', tCol);
            t1.style.pointerEvents = 'none';
            barGroup.appendChild(t1);
        }

        if (labs[i]) {
            const t2 = mkText(x + bw/2, sy + 20, labs[i], 'middle', '16');
            t2.style.pointerEvents = 'none';
            barGroup.appendChild(t2);
        }
        group.appendChild(barGroup);
    });
}

function redrawBoxplot(group) {
    group.innerHTML = '';
    const params = JSON.parse(group.getAttribute('data-params'));
    let cx = 400, cy = 300;
    if (group.hasAttribute('data-center-x')) {
        cx = parseFloat(group.getAttribute('data-center-x'));
        cy = parseFloat(group.getAttribute('data-center-y'));
    }

    const min = params.p_min, q1 = params.p_q1, med = params.p_med, q3 = params.p_q3, max = params.p_max;
    // 【修改】支援從外部讀取整體縮放比例，避免文字被拉伸
    const renderScale = parseFloat(group.getAttribute('data-scale')) || 1;
    const boxH = 60 * renderScale;
    const whiskH = 30 * renderScale;
    const sx = cx - ((max - min) / 2) * renderScale;
    const mapX = (val) => sx + (val - min) * renderScale;
    
    const mk = (tag, attrs) => {
        const el = document.createElementNS(ns, tag);
        for(let k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    };
    
    const lineStyle = {'class': 'shape', 'data-tool': 'line', 'stroke':'black', 'stroke-width':2};
    
    group.appendChild(mk('line', { x1: mapX(min), y1: cy, x2: mapX(q1), y2: cy, ...lineStyle }));
    group.appendChild(mk('line', { x1: mapX(q3), y1: cy, x2: mapX(max), y2: cy, ...lineStyle }));
    group.appendChild(mk('line', { x1: mapX(min), y1: cy - whiskH/2, x2: mapX(min), y2: cy + whiskH/2, ...lineStyle }));
    group.appendChild(mk('line', { x1: mapX(max), y1: cy - whiskH/2, x2: mapX(max), y2: cy + whiskH/2, ...lineStyle }));
    group.appendChild(mk('rect', { x: mapX(q1), y: cy - boxH/2, width: Math.abs(mapX(q3)-mapX(q1)), height: boxH, 'class': 'shape', 'data-tool': 'rect', 'fill':'none', 'stroke':'black', 'stroke-width':2 }));
    group.appendChild(mk('line', { x1: mapX(med), y1: cy - boxH/2, x2: mapX(med), y2: cy + boxH/2, ...lineStyle }));
    
    [min, q1, med, q3, max].forEach(val => {
        const t = mk('text', {x:mapX(val), y:cy+boxH/2+20, 'text-anchor':'middle', 'font-size':12, fill:'black', stroke:'none'});
        t.textContent = val;
        group.appendChild(t);
    });
}

function redrawPolygon(shape, v) {
    const cx = parseFloat(shape.getAttribute('data-center-x')) || 400;
    const cy = parseFloat(shape.getAttribute('data-center-y')) || 300;
    const n = v.p_n, r = v.p_r; 
    const rad = deg => deg * Math.PI / 180;
    let points =[];
    for(let i=0; i<n; i++) { 
        const theta = rad(90 + 360 * i / n); 
        points.push([cx + r * Math.cos(theta), cy - r * Math.sin(theta)]); 
    }
    shape.setAttribute('points', points.map(p => `${p[0]},${p[1]}`).join(' '));
}

function redrawStar(shape, v) {
    const cx = parseFloat(shape.getAttribute('data-center-x')) || 400;
    const cy = parseFloat(shape.getAttribute('data-center-y')) || 300;
    const n = Math.max(5, v.p_n), r = v.p_r, jump = Math.floor(n / 2);
    const rad = deg => deg * Math.PI / 180;
    let pts =[]; 
    for (let i = 0; i < n; i++) { 
        const theta = rad(90 + 360 * i / n); 
        pts.push({ x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) }); 
    }
    let order =[]; let curr = 0; 
    for (let i = 0; i < n; i++) { 
        order.push(pts[curr]); curr = (curr + jump) % n; 
    }
    shape.setAttribute('points', order.map(p => `${p.x},${p.y}`).join(' '));
}
