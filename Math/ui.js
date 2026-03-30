window.ACTION_INFO = {
	'lock_geom': { label: '鎖定/解除 邊角', icon: '🔒' },
	'mark_smart': { label: '智慧標記 (線/角)', icon: '🏷️' },
    'blocks_ortho': { label: '產生三視圖 (含數字)', icon: '👁️' },
    'line_midpoint': { label: '取中點', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>' },
    'line_perp': { label: '中垂線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="18" x2="20" y2="18"/><line x1="12" y1="4" x2="12" y2="22"/><polyline points="12 14 16 14 16 18"/></svg>' },
    'line_div': { label: '線段等分', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="9" y1="8" x2="9" y2="16"/><line x1="15" y1="8" x2="15" y2="16"/></svg>' },
    'line_parallel': { label: '平行線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>' },
    'line_style': { label: '標記邊長樣式', icon: '🏷️' },
    'line_dim': { label: '長度標註', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 12l4-4m-4 4l4 4m12-8l-4 4 4 4"/></svg>' },
    'poly_param': { label: '編輯參數', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' },
    'poly_alt': { label: '畫高 (依游標X找頂點)', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 4 4 20 20 20"/><line x1="12" y1="4" x2="12" y2="20" stroke-dasharray="3 3"/><polyline points="12 17 15 17 15 20"/></svg>' },
    'poly_base': { label: '畫底邊平行線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 4 4 20 20 20"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' },
    'poly_internal_line': { label: '畫形內線段', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"></line></svg>' },
    'poly_diag': { label: '畫對角線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 4l16 16M4 20L20 4"/></svg>' },
    'poly_dim': { label: '長度標註', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 12l4-4m-4 4l4 4m12-8l-4 4 4 4"/></svg>' },
    'poly_ext': { label: '產生外角延長線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18l8-12 8 12H4z"/><path d="M20 18h4" stroke-dasharray="3 2"/></svg>' },
	'poly_add_segment': { label: '新增折段 (於末端)', icon: '➕' },
	'poly_del_segment': { label: '刪除折段 (從點擊處)', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' },
    'tri_circum': { label: '外心/外接圓', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke-dasharray="2 2"/><polygon points="12 3 5 18 19 18"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>' },
    'tri_in': { label: '內心/內切圓', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 3 3 19 21 19"/><circle cx="12" cy="14" r="5" stroke-dasharray="2 2"/><circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>' },
    'tri_cent': { label: '重心', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 4 4 20 20 20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="20" x2="16" y2="12"/><line x1="20" y1="20" x2="8" y2="12"/><circle cx="12" cy="14.6" r="2" fill="currentColor" stroke="none"/></svg>' },
    'angle_div': { label: '角平分線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4L4 12l16 8"/><line x1="4" y1="12" x2="20" y2="12" stroke-dasharray="4 3"/></svg>' },
    'angle_dim': { label: '長度標註', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 12l4-4m-4 4l4 4m12-8l-4 4 4 4"/></svg>' },
    'solid_dim': { label: '長度標註', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 12l4-4m-4 4l4 4m12-8l-4 4 4 4"/></svg>' },
    'solid_net': { label: '開啟/關閉 展開圖', icon: '✂️' },
    'group_ungroup': { label: '解散群組', icon: '🔓' },
    'group_param': { label: '編輯參數', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' },
    'group_rad': { label: '畫半徑', icon: '↗' },
    'group_dia': { label: '畫直徑', icon: '↔' },
    'group_dim': { label: '長度標註', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 12l4-4m-4 4l4 4m12-8l-4 4 4 4"/></svg>' },
    'ell_center': { label: '畫圓心', icon: '⊙' },
    'ell_rad': { label: '畫半徑', icon: '↗' },
    'ell_dia': { label: '畫直徑', icon: '↔' },
    'ell_chord': { label: '畫弦', icon: '➖' },
    'ell_tan_ext': { label: '圓外點切線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="15" r="7"/><path d="M21 3L11 8.5"/><circle cx="21" cy="3" r="1.5" fill="currentColor"/></svg>' },
    'ell_tan_on': { label: '圓上點切線', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="14" r="8"/><path d="M4 6h16"/><circle cx="12" cy="6" r="1.5" fill="currentColor"/></svg>' },
    'ell_dim': { label: '長度標註', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 12l4-4m-4 4l4 4m12-8l-4 4 4 4"/></svg>' },
    'ell_poly_in': { label: '畫內接正多邊形', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2l8.5 6.2-3.2 10.3h-10.6l-3.2-10.3z"/></svg>' },
    'ell_poly_out': { label: '畫外切正多邊形', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><circle cx="12" cy="12" r="9"/></svg>' },
    // 【修改】將圓形角拆平，加入專屬 SVG 圖示
    'ell_angle_central': { label: '畫圓心角', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 12l7-3M12 12l-2-9"/><path d="M11 7a3 3 0 0 1 3 3" stroke-width="1"/></svg>' },
    'ell_angle_inscribed': { label: '畫圓周角', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M6 18L12 4l6 14"/></svg>' },
    'ell_angle_tangent': { label: '畫弦切角', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 22h20"/><path d="M12 22l6-16"/></svg>' },
};

// 每個 sub-tool 可以使用的「所有預設功能列表」
window.MENU_REGISTRY = {
    'point':[], 
    'line':['mark_smart', 'lock_geom', 'line_midpoint', 'line_perp', 'line_div', 'line_parallel', 'line_style', 'line_dim'],
    'polyline':['mark_smart', 'lock_geom', 'line_dim', 'poly_add_segment', 'poly_del_segment'],
    'line-simple':['mark_smart', 'lock_geom', 'line_midpoint', 'line_perp', 'line_div', 'line_parallel', 'line_style', 'line_dim'],
    'line-end':['mark_smart', 'lock_geom', 'line_midpoint', 'line_perp', 'line_div', 'line_parallel', 'line_style', 'line_dim'],
    'line-double':['mark_smart', 'lock_geom', 'line_midpoint', 'line_perp', 'line_div', 'line_parallel', 'line_style', 'line_dim'],
    'angle':['mark_smart', 'lock_geom', 'angle_div', 'angle_dim'],
	'tri-any':['mark_smart', 'lock_geom', 'poly_alt', 'poly_base', 'poly_internal_line', 'poly_dim', 'poly_ext', 'tri_circum', 'tri_in', 'tri_cent'],
    'tri-iso':['mark_smart', 'lock_geom', 'poly_alt', 'poly_base', 'poly_internal_line', 'poly_dim', 'poly_ext', 'tri_circum', 'tri_in', 'tri_cent'],
    'tri-right':['mark_smart', 'lock_geom', 'poly_alt', 'poly_base', 'poly_internal_line', 'poly_dim', 'poly_ext', 'tri_circum', 'tri_in', 'tri_cent'],
    'rect':['mark_smart', 'lock_geom', 'poly_diag', 'poly_internal_line', 'poly_dim', 'poly_ext'],
    'square':['mark_smart', 'lock_geom', 'poly_diag', 'poly_internal_line', 'poly_dim', 'poly_ext'],
    'rhombus':['mark_smart', 'lock_geom', 'poly_diag', 'poly_internal_line', 'poly_dim', 'poly_ext'],
    'kite':['mark_smart', 'lock_geom', 'poly_diag', 'poly_internal_line', 'poly_dim', 'poly_ext'],
    'parallelogram':['mark_smart', 'lock_geom', 'poly_diag', 'poly_internal_line', 'poly_dim', 'poly_ext'],
    'trapezoid':['mark_smart', 'lock_geom', 'poly_diag', 'poly_internal_line', 'poly_dim', 'poly_ext'],
    'circle':['ell_center', 'ell_rad', 'ell_dia', 'ell_chord', 'ell_tan_ext', 'ell_tan_on', 'ell_angle_central', 'ell_angle_inscribed', 'ell_angle_tangent', 'ell_dim', 'ell_poly_in', 'ell_poly_out'],
    'ellipse':['ell_center', 'ell_rad', 'ell_dia', 'ell_chord', 'ell_tan_ext', 'ell_tan_on', 'ell_angle_central', 'ell_angle_inscribed', 'ell_angle_tangent', 'ell_dim', 'ell_poly_in', 'ell_poly_out'],
    'sector': ['ell_dim'], 
    'arc': ['ell_dim'],
    'arch':['ell_dim'],
    'polygon':['mark_smart', 'lock_geom', 'poly_param', 'poly_diag', 'poly_internal_line', 'poly_dim', 'poly_ext'],
    'star':['mark_smart', 'lock_geom', 'poly_param', 'poly_diag', 'poly_dim', 'poly_ext'],
    'solid-cylinder': ['solid_dim', 'solid_net'],
    'solid-cone': ['solid_dim', 'solid_net'],
    'solid-sphere':['solid_dim', 'solid_net'],
    'solid-pyramid':['solid_dim', 'solid_net'],
    'solid-prism': ['solid_dim', 'solid_net'],
    'axis-chart':['group_param', 'group_ungroup'], 
    'boxplot':['group_param', 'group_ungroup'],
    'histogram': ['group_param', 'group_ungroup'],
    'pie-chart':['group_param', 'group_ungroup'],
    'parabola':['group_param', 'group_ungroup'],
    'inequality': ['group_param', 'group_ungroup'],
    'venn': ['group_param', 'group_ungroup'],
    'default_group':['group_ungroup']
};

// 原始帶有邏輯綁定的全域 Config (加入 ID 以供映射)
const CONTEXT_MENU_CONFIG = {
    'blocks':[ { id: 'blocks_ortho', action: () => window.generateOrthographicViews(selectedElements[0]) } ],
	'polyline':[
        { id: 'mark_smart', action: () => { 
            const saved = markModeType; 
            markModeType = 'smart'; 
            autoApplyMark(lastContextPos.x, lastContextPos.y); 
            markModeType = saved; 
        } },
        { id: 'lock_geom', action: () => { if(typeof window.toggleGeometryLock === 'function') window.toggleGeometryLock(); } },
        { id: 'line_dim', action: () => executeSmartDimension() },
        { id: 'poly_add_segment', action: () => { if(typeof window.addPolylineSegment === 'function') window.addPolylineSegment(selectedElements[0]); } },
        { id: 'poly_del_segment', action: () => window.deletePolylineSegment(selectedElements[0], lastContextPos.x, lastContextPos.y) }
    ],
    'line':[
        { id: 'mark_smart', action: () => { 
            const saved = markModeType; 
            markModeType = 'smart'; // 強制啟用智慧模式
            autoApplyMark(lastContextPos.x, lastContextPos.y); 
            markModeType = saved; 
        } },
        { id: 'lock_geom', action: () => { if(typeof window.toggleGeometryLock === 'function') window.toggleGeometryLock(); } }, // <--- 新增這行
        { id: 'line_midpoint', action: () => executeConstruction('midpoint') },
        { id: 'line_perp', action: () => executeConstruction('perpendicular') },
        { id: 'line_div', action: () => executeConstruction('divide_line') },
        { id: 'line_parallel', action: () => toggleConstructMode('parallel') },
        { id: 'line_style', action: () => openSubMenuAtContext('menu-edge') }, 
        { id: 'line_dim', action: () => executeSmartDimension() }
    ],
    'polygon':[
        { id: 'mark_smart', action: () => { 
            const saved = markModeType; 
            markModeType = 'smart'; 
            autoApplyMark(lastContextPos.x, lastContextPos.y); 
            markModeType = saved; 
        } },
        { id: 'lock_geom', action: () => { if(typeof window.toggleGeometryLock === 'function') window.toggleGeometryLock(); } }, 
        { id: 'poly_param', action: () => {
            let sub = selectedElements[0].getAttribute('data-sub-tool');
            if (sub === 'polygon-regular') sub = 'polygon';
            openParamModal(sub, selectedElements[0]);
        }, condition: (els) =>['polygon', 'star', 'polygon-regular'].includes(els[0].getAttribute('data-sub-tool')) },
        { id: 'poly_alt', action: () => toggleConstructMode('altitude'), condition: (els) => getShapePoints(els[0]).length >= 3 }, 
		{ id: 'poly_base', action: () => toggleConstructMode('base_parallel_line'), condition: (els) => getShapePoints(els[0]).length === 3 },
		{ id: 'poly_internal_line', action: () => window.createInternalLine(selectedElements[0]), condition: (els) => getShapePoints(els[0]).length >= 3 },
        { id: 'poly_diag', action: () => drawDiagonalsFromSelection(), condition: (els) => getShapePoints(els[0]).length > 3 }, 
        { id: 'poly_dim', action: () => executeSmartDimension() },
		{ id: 'poly_ext', action: () => { if(typeof drawPolygonExtensions === 'function') drawPolygonExtensions(selectedElements[0]); } },
    ],
    'angle':[ 
        { id: 'mark_smart', action: () => { 
            const saved = markModeType; 
            markModeType = 'smart'; 
            autoApplyMark(lastContextPos.x, lastContextPos.y); 
            markModeType = saved; 
        } },
        { id: 'lock_geom', action: () => { if(typeof window.toggleGeometryLock === 'function') window.toggleGeometryLock(); } },
        { id: 'angle_div', action: () => toggleConstructMode('divide_angle') },
        { id: 'angle_dim', action: () => executeSmartDimension() }
    ],
	'solid':[
        { id: 'solid_dim', action: () => executeSmartDimension() },
        { id: 'solid_net', action: () => { 
            const shape = selectedElements[0];
            if (!shape) return;
            if (!shape.id) shape.id = 'solid-' + Date.now();

            const existingNet = document.querySelector(`g[data-owner-solid="${shape.id}"]`);
            if (existingNet) {
                // --- 關閉展開圖 ---
                existingNet.remove();
                
                // 將主圖向右平移回原位
                const shiftX = parseFloat(shape.getAttribute('data-net-shift-x') || 0);
                if (shiftX !== 0 && typeof moveShape === 'function') {
                    moveShape(shape, shiftX, 0); 
                    shape.removeAttribute('data-net-shift-x');
                }
                
                if (typeof saveState === 'function') saveState();
                statusText.innerText = "已關閉展開圖，主圖已歸位";
            } else {
                // --- 開啟展開圖 ---
                let w = 150; 
                let r = 0;
                if (shape.hasAttribute('data-w')) w = parseFloat(shape.getAttribute('data-w'));
                else if (shape.hasAttribute('data-r')) {
                    r = parseFloat(shape.getAttribute('data-r'));
                    w = r * 2;
                }
                
                const h = parseFloat(shape.getAttribute('data-h')) || 100;
                const subTool = shape.getAttribute('data-sub-tool');

                // 1. 動態計算展開圖的「真實寬度」
                let netWidth = w;
                if (subTool === 'solid-cylinder' || subTool === 'solid-cone') {
                    netWidth = 2 * Math.PI * r; // 展開的扇形或矩形約等於圓周長 (非常寬)
                } else if (subTool === 'solid-pyramid' || subTool === 'solid-prism') {
                    netWidth = w * 3; 
                } else if (subTool === 'solid-cube') {
                    netWidth = w * 4; 
                }

                // 展開圖與主圖的距離：主圖一半 + 展開圖一半 + 100px 安全間距
                const offset = (w / 2) + (netWidth / 2) + 100; 
                const shiftX = offset / 2; // 讓主圖往左退一半
                
                // 2. Y 軸補償：解決右上角偏移問題
                // 因為 3D 圓柱/圓錐的 cy 座標在「頂部」，而展開圖的定錨點在「底部」
                // 所以展開圖必須強制往下推 h 的距離，兩者的視覺中心才會呈完美的水平線！
                let shiftY = 0;
                if (subTool === 'solid-cylinder' || subTool === 'solid-cone') {
                    shiftY = h;
                } else if (subTool === 'solid-cube') {
                    const d = parseFloat(shape.getAttribute('data-d')) || 50;
                    shiftY = -(h/2 + d/2); // 長方體展開圖偏下，稍微往上提
                } else if (subTool === 'solid-pyramid') {
                    shiftY = -h/2;
                }
                
                // 先將主圖向左平移，讓出右邊空間
                if (typeof moveShape === 'function') {
                    moveShape(shape, -shiftX, 0);
                    shape.setAttribute('data-net-shift-x', shiftX); // 記錄下來以便關閉時復原
                }

                const net = document.createElementNS(ns, "g");
                net.setAttribute('class', 'shape group');
                net.setAttribute('data-tool', 'solid');
                net.setAttribute('data-sub-tool', subTool);
                net.setAttribute('data-view-mode', 'net'); 
                net.setAttribute('data-owner-solid', shape.id); 

                // 複製主圖的所有參數
                const attrs =['data-w', 'data-h', 'data-d', 'data-dx', 'data-dy', 'data-r', 'data-cx', 'data-cy', 'data-x', 'data-y', 'transform'];
                attrs.forEach(attr => {
                    if (shape.hasAttribute(attr)) {
                        net.setAttribute(attr, shape.getAttribute(attr));
                    }
                });

                // 設定展開圖的最終 X 與 Y 座標 (加上 offset 與 shiftY 補償)
                if (shape.hasAttribute('data-cx')) {
                    net.setAttribute('data-cx', parseFloat(shape.getAttribute('data-cx')) + offset);
                    net.setAttribute('data-cy', parseFloat(shape.getAttribute('data-cy')) + shiftY);
                } 
                if (shape.hasAttribute('data-x')) {
                    net.setAttribute('data-x', parseFloat(shape.getAttribute('data-x')) + offset);
                    net.setAttribute('data-y', parseFloat(shape.getAttribute('data-y')) + shiftY);
                }

                // 加入畫布並繪製
                document.getElementById('shapes-layer').appendChild(net);
                if (typeof redrawSolid === 'function') redrawSolid(net);
                if (typeof saveState === 'function') saveState();
                statusText.innerText = "已產生展開圖 (拖拉主圖控制點可連動重繪)";
            }
        } } 
    ],
    'group':[
        { id: 'group_ungroup', action: () => ungroupSelected(), condition: (els) => els.some(e => e.getAttribute('data-tool') === 'group') },
        { id: 'group_param', action: () => { 
            // 【完整還原】：群組圖形參數編輯 (統計圖表等)
            const shape = selectedElements[0];
            const mapping = {
                'venn': 'venn_diagram',
                'pie-chart': 'pie_chart',
                'axis-chart': 'axis_chart',
                'histogram': 'histogram',
                'boxplot': 'boxplot',
                'parabola': 'parabola',
                'inequality': 'inequality'
            };
            const sub = shape.getAttribute('data-sub-tool');
            if (mapping[sub]) {
                openParamModal(mapping[sub], shape);
            }
        }, condition: (els) => { if (els.length !== 1) return false; const sub = els[0].getAttribute('data-sub-tool'); return['venn', 'pie-chart', 'histogram', 'boxplot', 'axis-chart', 'parabola', 'inequality'].includes(sub); } },
        { id: 'group_rad', action: () => window.addCircleElement('radius'), condition: (els) => els[0].getAttribute('data-sub-tool') === 'circle-smart' },
        { id: 'group_dia', action: () => window.addCircleElement('diameter'), condition: (els) => els[0].getAttribute('data-sub-tool') === 'circle-smart' },
        { id: 'group_dim', action: () => executeSmartDimension() }
    ],
    'ellipse':[ 
        { id: 'ell_center', action: () => window.addCircleElement('center') },
        { id: 'ell_rad', action: () => window.addCircleElement('radius') },
        { id: 'ell_dia', action: () => window.addCircleElement('diameter') },
        { id: 'ell_chord', action: () => window.addCircleElement('chord') },
        { id: 'ell_tan_ext', action: () => toggleConstructMode('tangent') },
        { id: 'ell_tan_on', action: () => window.addCircleElement('tangent-on-circle') },
        { id: 'ell_angle_central', action: () => toggleCircleAngleMode('central') },
        { id: 'ell_angle_inscribed', action: () => toggleCircleAngleMode('inscribed') },
        { id: 'ell_angle_tangent', action: () => toggleCircleAngleMode('tangent-chord') },
        { id: 'ell_dim', action: () => executeSmartDimension() },
        { id: 'ell_poly_in', action: () => window.createLinkedPolygon(selectedElements[0], 'inscribed') },
        { id: 'ell_poly_out', action: () => window.createLinkedPolygon(selectedElements[0], 'circumscribed') }
    ]
    // 注意：image 和 multi-select 不支援細部設定，維持通用。
};

// 通用操作 (永遠顯示，除非有特殊條件)
const GENERAL_ACTIONS = [
	{ label: '✨ 智慧填滿 (點擊處封閉區域)', icon: '🪣', action: () => { if(typeof smartFloodFill === 'function') smartFloodFill(); } },
    // 第一組：畫布內部操作 (不涉及系統剪貼簿)
    { label: '複製 (畫布內)', icon: '📄', action: () => copySelection() },
    { label: '剪下 (畫布內)', icon: '✂️', action: () => cutSelection() },
    { label: '貼上 (畫布內)', icon: '📋', action: () => pasteSelection(true) },
    
    // 這裡我們用一個特殊的標記來代表分隔線
    { isSeparator: true },
    
    // 第二組：與系統剪貼簿互動 (可跨軟體)
    { label: '複製到剪貼簿', icon: '📸', action: () => copyImageToClipboard() },
	{ label: '複製到剪貼簿 (圖片)', icon: '🖼️', action: () => copyImageToClipboard(true) },
    { label: '剪下到剪貼簿', icon: '✂️', action: () => cutImageToClipboard() }, 
    { label: '從剪貼簿貼上', icon: '📥', action: () => pasteFromClipboard(true) },
    
    { isSeparator: true },
    
    // 第三組：其他操作
    { label: '匯出選取物件', icon: '🖼️', action: () => triggerExportSelection() }, 	
    { label: '插入檔案圖片', icon: '📂', action: () => triggerInsertImageFile() },
    { label: '刪除', icon: '🗑️', action: () => deleteSelected() },
];

window.getShapeEdges = function(shape) {
    if (!shape) return[];
    const tool = shape.getAttribute('data-tool');
    const subTool = shape.getAttribute('data-sub-tool');
    const viewMode = shape.getAttribute('data-view-mode') || '3d';
    
    let m;
    try { m = shape.getCTM(); } catch(e) { return[]; }
    if (!m) return[];
    const toGlobal = (x, y) => ({ x: x * m.a + y * m.c + m.e, y: x * m.b + y * m.d + m.f });
    
    let edges = [];
    
    // 立體圖形
    if (tool === 'solid' || (tool === 'group' && subTool && subTool.startsWith('solid-'))) {
        
        // 模式 A: 3D 視圖
        if (viewMode === '3d') {
            if (subTool === 'solid-cube') {
                const x = parseFloat(shape.getAttribute('data-x')), y = parseFloat(shape.getAttribute('data-y'));
                const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
                const dx = parseFloat(shape.getAttribute('data-dx')), dy = parseFloat(shape.getAttribute('data-dy'));
                const f1 = {x, y}, f2 = {x: x+w, y}, f3 = {x: x+w, y: y+h}, f4 = {x, y: y+h};
                const b1 = {x: f1.x+dx, y: f1.y+dy}, b2 = {x: f2.x+dx, y: f2.y+dy}, b3 = {x: f3.x+dx, y: f3.y+dy}, b4 = {x: f4.x+dx, y: f4.y+dy};
                const rawEdges = [[f1,f2],[f2,f3], [f3,f4],[f4,f1], [b1,b2],[b2,b3], [b3,b4],[b4,b1],[f1,b1], [f2,b2],[f3,b3], [f4,b4]];
                edges = rawEdges.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));
            } else if (subTool === 'solid-cylinder') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const r = parseFloat(shape.getAttribute('data-r')), h = parseFloat(shape.getAttribute('data-h'));
                edges =[
                    { p1: toGlobal(cx-r, cy), p2: toGlobal(cx-r, cy+h), index: 0 },
                    { p1: toGlobal(cx+r, cy), p2: toGlobal(cx+r, cy+h), index: 1 },
                    { p1: toGlobal(cx-r, cy), p2: toGlobal(cx+r, cy), index: 2 },
                    { p1: toGlobal(cx-r, cy+h), p2: toGlobal(cx+r, cy+h), index: 3 }
                ];
            } else if (subTool === 'solid-cone') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const r = parseFloat(shape.getAttribute('data-r')), h = parseFloat(shape.getAttribute('data-h'));
                edges =[
                    { p1: toGlobal(cx, cy), p2: toGlobal(cx-r, cy+h), index: 0 },
                    { p1: toGlobal(cx, cy), p2: toGlobal(cx+r, cy+h), index: 1 },
                    { p1: toGlobal(cx-r, cy+h), p2: toGlobal(cx+r, cy+h), index: 2 },
                    { p1: toGlobal(cx, cy), p2: toGlobal(cx, cy+h), index: 3 }
                ];
            } else if (subTool === 'solid-sphere') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy')), r = parseFloat(shape.getAttribute('data-r'));
                edges =[ { p1: toGlobal(cx-r, cy), p2: toGlobal(cx+r, cy), index: 0 }, { p1: toGlobal(cx, cy-r), p2: toGlobal(cx, cy+r), index: 1 } ];
            } else if (subTool === 'solid-pyramid') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
                
                if (viewMode === '3d') {
                    const l = { x: cx - w/2, y: cy + w*0.05 };
                    const r = { x: cx + w/2, y: cy - w*0.05 };
                    const f = { x: cx + w*0.15, y: cy + w*0.25 };
                    const b = { x: cx - w*0.15, y: cy - w*0.25 };
                    const top = { x: cx, y: cy - h };
                    const rawEdges = [[l,f], [f,r], [r,b], [b,l], [top,l],[top,f], [top,r], [top,b]];
                    edges = rawEdges.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));
                } else {
                    const sl = Math.sqrt(h*h + (w/2)*(w/2));
                    const rect =[{x:cx-w/2, y:cy-w/2}, {x:cx+w/2, y:cy-w/2}, {x:cx+w/2, y:cy+w/2}, {x:cx-w/2, y:cy+w/2}];
                    const rawEdges =[
                        [rect[0], rect[1]], [rect[1], rect[2]], [rect[2], rect[3]], [rect[3], rect[0]],
                        [rect[0], {x:cx, y:cy-w/2-sl}], [rect[1], {x:cx, y:cy-w/2-sl}], 
                        [rect[2], {x:cx, y:cy+w/2+sl}], [rect[3], {x:cx, y:cy+w/2+sl}], 
                        [rect[0], {x:cx-w/2-sl, y:cy}], [rect[3], {x:cx-w/2-sl, y:cy}], 
                        [rect[1], {x:cx+w/2+sl, y:cy}], [rect[2], {x:cx+w/2+sl, y:cy}]  
                    ];
                    edges = rawEdges.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));
                }
            } else if (subTool === 'solid-prism') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
                const dx = parseFloat(shape.getAttribute('data-dx')), dy = parseFloat(shape.getAttribute('data-dy'));
                const b1 = { x: cx - w/2, y: cy }, b2 = { x: cx + w/2, y: cy }, b3 = { x: cx + dx, y: cy + dy };
                const t1 = { x: b1.x, y: b1.y - h }, t2 = { x: b2.x, y: b2.y - h }, t3 = { x: b3.x, y: b3.y - h };
                const rawEdges = [[b1,b2], [b2,b3], [b3,b1], [t1,t2], [t2,t3], [t3,t1], [b1,t1],[b2,t2], [b3,t3]];
                edges = rawEdges.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));
            }
        } 
        // 模式 B: 展開圖 (Net) - [新增邏輯]
        else {
            if (subTool === 'solid-cube') {
                const x = parseFloat(shape.getAttribute('data-x')), y = parseFloat(shape.getAttribute('data-y'));
                const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
                const d = parseFloat(shape.getAttribute('data-d')) || 50;
                // 重建展開圖的關鍵座標點
                const rawSegments = [
                    [{x:x, y:y-d}, {x:x+w, y:y-d}], // 上面頂邊
                    [{x:x-d, y:y}, {x:x+w+d, y:y}], // 中橫線上
                    [{x:x-d, y:y+h}, {x:x+w+d, y:y+h}], // 中橫線下
                    [{x:x, y:y+h+d}, {x:x+w, y:y+h+d}], // 下面底邊
                    [{x:x-d, y:y}, {x:x-d, y:y+h}], // 左側邊
                    [{x:x, y:y-d}, {x:x, y:y+h+d}], // 中左直
                    [{x:x+w, y:y-d}, {x:x+w, y:y+h+d}], // 中右直
                    [{x:x+w+d, y:y}, {x:x+w+d, y:y+h}] // 右側邊
                ];
                edges = rawSegments.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));

            } else if (subTool === 'solid-cylinder') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const r = parseFloat(shape.getAttribute('data-r')), h = parseFloat(shape.getAttribute('data-h'));
                const rectW = 2 * Math.PI * r;
                const rx = cx - rectW / 2;
                
                const rawSegments = [
                    [{x:rx, y:cy}, {x:rx+rectW, y:cy}], // 矩形上
                    [{x:rx, y:cy+h}, {x:rx+rectW, y:cy+h}], // 矩形下
                    [{x:rx, y:cy}, {x:rx, y:cy+h}], // 矩形左
                    [{x:rx+rectW, y:cy}, {x:rx+rectW, y:cy+h}], // 矩形右
                    // 上下圓的水平/垂直直徑 (方便標註半徑)
                    [{x:cx-r, y:cy-r}, {x:cx+r, y:cy-r}], 
                    [{x:cx, y:cy-2*r}, {x:cx, y:cy}],
                    [{x:cx-r, y:cy+h+r}, {x:cx+r, y:cy+h+r}],
                    [{x:cx, y:cy+h}, {x:cx, y:cy+h+2*r}]
                ];
                edges = rawSegments.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));

            } else if (subTool === 'solid-cone') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const r = parseFloat(shape.getAttribute('data-r')), h = parseFloat(shape.getAttribute('data-h'));
                const s = Math.sqrt(r*r + h*h);
                const theta = (2 * Math.PI * r) / s;
                const startAngle = (Math.PI - theta) / 2;
                const endAngle = startAngle + theta;
                
                const px1 = cx + s * Math.cos(startAngle);
                const py1 = cy + s * Math.sin(startAngle);
                const px2 = cx + s * Math.cos(endAngle);
                const py2 = cy + s * Math.sin(endAngle);
                
                const midAngle = startAngle + theta / 2;
                const midX = cx + s * Math.cos(midAngle);
                const midY = cy + s * Math.sin(midAngle);
                const circleCX = midX + r * Math.cos(midAngle);
                const circleCY = midY + r * Math.sin(midAngle);

                const rawSegments = [
                    [{x:cx, y:cy}, {x:px1, y:py1}], // 扇形半徑1
                    [{x:cx, y:cy}, {x:px2, y:py2}], // 扇形半徑2
                    // 底圓直徑
                    [{x:circleCX-r, y:circleCY}, {x:circleCX+r, y:circleCY}],
                    [{x:circleCX, y:circleCY-r}, {x:circleCX, y:circleCY+r}]
                ];
                edges = rawSegments.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));
            } else if (subTool === 'solid-pyramid') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h')), d = parseFloat(shape.getAttribute('data-d'));
                const sl_w = Math.sqrt(h*h + (d/2)*(d/2)), sl_d = Math.sqrt(h*h + (w/2)*(w/2));
                const rect =[{x:cx-w/2, y:cy-d/2}, {x:cx+w/2, y:cy-d/2}, {x:cx+w/2, y:cy+d/2}, {x:cx-w/2, y:cy+d/2}];
                const rawEdges = [
                    [rect[0], rect[1]], [rect[1], rect[2]], [rect[2], rect[3]], [rect[3], rect[0]],
                    [rect[0], {x:cx, y:cy-d/2-sl_w}], [rect[1], {x:cx, y:cy-d/2-sl_w}],
                    [rect[2], {x:cx, y:cy+d/2+sl_w}], [rect[3], {x:cx, y:cy+d/2+sl_w}]
                ];
                edges = rawEdges.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));
            } else if (subTool === 'solid-prism') {
                const cx = parseFloat(shape.getAttribute('data-cx')), cy = parseFloat(shape.getAttribute('data-cy'));
                const w = parseFloat(shape.getAttribute('data-w')), h = parseFloat(shape.getAttribute('data-h'));
                const dx = parseFloat(shape.getAttribute('data-dx')), dy = parseFloat(shape.getAttribute('data-dy'));
                const L1 = Math.hypot(w/2 + dx, dy), L2 = Math.hypot(w/2 - dx, dy);
                const r1 = {x:cx-w/2, y:cy-h/2}, r2 = {x:cx+w/2, y:cy-h/2}, r3 = {x:cx+w/2, y:cy+h/2}, r4 = {x:cx-w/2, y:cy+h/2};
                const rawEdges = [
                    [r1, r2], [r2, r3],[r3, r4], [r4, r1],[r1, {x:r1.x-L1, y:r1.y}],[r4, {x:r4.x-L1, y:r4.y}],[{x:r1.x-L1, y:r1.y}, {x:r4.x-L1, y:r4.y}],[r2, {x:r2.x+L2, y:r2.y}],[r3, {x:r3.x+L2, y:r3.y}],[{x:r2.x+L2, y:r2.y}, {x:r3.x+L2, y:r3.y}],[r1, {x:cx+dx, y:cy-h/2-Math.abs(dy)}],[r2, {x:cx+dx, y:cy-h/2-Math.abs(dy)}],[r4, {x:cx+dx, y:cy+h/2+Math.abs(dy)}],[r3, {x:cx+dx, y:cy+h/2+Math.abs(dy)}]
                ];
                edges = rawEdges.map((e, i) => ({ p1: toGlobal(e[0].x, e[0].y), p2: toGlobal(e[1].x, e[1].y), index: i }));
            }
        }

    } else if (tool === 'group' && subTool === 'circle-smart') {
        const line = shape.querySelector('.circle-line');
        if (line) {
            edges =[{
                p1: toGlobal(parseFloat(line.getAttribute('x1')), parseFloat(line.getAttribute('y1'))),
                p2: toGlobal(parseFloat(line.getAttribute('x2')), parseFloat(line.getAttribute('y2'))),
                index: 0
            }];
        }
    } else if (tool === 'ellipse' && subTool === 'circle') {
        const cx = parseFloat(shape.getAttribute('cx')) || 0;
        const cy = parseFloat(shape.getAttribute('cy')) || 0;
        const r = parseFloat(shape.getAttribute('rx') || shape.getAttribute('r') || 0);
        edges =[
            { p1: toGlobal(cx-r, cy), p2: toGlobal(cx+r, cy), index: 0 }, // 水平直徑
            { p1: toGlobal(cx, cy-r), p2: toGlobal(cx, cy+r), index: 1 }  // 垂直直徑
        ];
    } else if (tool === 'ellipse' && subTool === 'sector') {
        const cx = parseFloat(shape.getAttribute('data-center-x')), cy = parseFloat(shape.getAttribute('data-center-y'));
        const r = parseFloat(shape.getAttribute('data-radius'));
        const sA = parseFloat(shape.getAttribute('data-start-angle')), eA = parseFloat(shape.getAttribute('data-end-angle'));
        const pCenter = toGlobal(cx, cy);
        edges =[
            { p1: pCenter, p2: toGlobal(cx + r * Math.cos(sA), cy - r * Math.sin(sA)), index: 0 },
            { p1: pCenter, p2: toGlobal(cx + r * Math.cos(eA), cy - r * Math.sin(eA)), index: 1 }
        ];
    } else {
        const pts = getTransformedPoints(shape);
        if (pts && pts.length > 1) {
            const isLine = (tool === 'line' || shape.tagName.toLowerCase() === 'line');
            const isPolyline = (tool === 'polyline' || shape.tagName.toLowerCase() === 'polyline');
            const limit = (isLine || isPolyline) ? pts.length - 1 : pts.length;
            for (let i=0; i<limit; i++) {
                edges.push({ p1: pts[i], p2: pts[(i+1)%pts.length], index: i });
            }
        }
    }
    return edges;
};

function executeSmartDimension(targetOverride = null, mxOverride = null, myOverride = null) {
    let target = targetOverride;
    if (!target) {
        if (selectedElements.length === 0) return;
        target = selectedElements[0];
    }

    let mx, my;
    if (mxOverride !== null && myOverride !== null) {
        mx = mxOverride; my = myOverride;
    } else {
        // 【修復 Bug】：統一使用最後點擊畫布的真實位置 (不分左右鍵)
        mx = lastClickPos.x;
        my = lastClickPos.y;
    }

    let edges = window.getShapeEdges(target);
    if (!edges || edges.length === 0) {
        statusText.innerText = `無法偵測邊緣`;
        return false;
    }

    let bestEdge = null;
    let minDist = Infinity;

    edges.forEach(e => {
        const d = distToSegment(mx, my, e.p1.x, e.p1.y, e.p2.x, e.p2.y);
        if (d < minDist) { minDist = d; bestEdge = e; }
    });

    const tool = target.getAttribute('data-tool');
    const subTool = target.getAttribute('data-sub-tool');
    const tolerance = (tool === 'solid' || subTool === 'circle' || subTool === 'circle-smart') ? 100 : 60;

    if (bestEdge && minDist < tolerance) {
        // --- 新增：優先偵測線段上的交點 ---
        let edgePts = [bestEdge.p1, bestEdge.p2];
        const allShapes = document.querySelectorAll('#shapes-layer .shape');
        
        allShapes.forEach(other => {
            if (other === target || other.getAttribute('data-tool') === 'group' || other.getAttribute('data-tool') === 'text' || other.getAttribute('data-tool') === 'math' || other.getAttribute('data-tool') === 'mark') return;
            
            if (typeof extractGeometry === 'function' && typeof getLineLineIntersection === 'function') {
                const geo = extractGeometry(other);
                if (!geo) return;
                
                geo.segments.forEach(seg => {
                    const pt = getLineLineIntersection(bestEdge.p1, bestEdge.p2, seg.p1, seg.p2);
                    if (pt) edgePts.push(pt);
                });
                geo.circles.forEach(circ => {
                    if (typeof getLineCircleIntersections === 'function') {
                        const pts = getLineCircleIntersections(bestEdge.p1, bestEdge.p2, circ.center, circ.r);
                        pts.forEach(pt => edgePts.push(pt));
                    }
                });
            }
        });
        
        // 過濾重複點並排序 (依照距離 p1 的遠近)
        const uniquePts =[];
        edgePts.forEach(pt => {
            if (!uniquePts.some(u => Math.hypot(u.x - pt.x, u.y - pt.y) < 1)) {
                uniquePts.push(pt);
            }
        });
        uniquePts.sort((a, b) => Math.hypot(a.x - bestEdge.p1.x, a.y - bestEdge.p1.y) - Math.hypot(b.x - bestEdge.p1.x, b.y - bestEdge.p1.y));
        
        // 尋找最接近滑鼠的「子線段」
        let bestSubEdge = null;
        let minSubDist = Infinity;
        for (let i = 0; i < uniquePts.length - 1; i++) {
            const sp1 = uniquePts[i];
            const sp2 = uniquePts[i+1];
            const d = distToSegment(mx, my, sp1.x, sp1.y, sp2.x, sp2.y);
            if (d < minSubDist) {
                minSubDist = d;
                bestSubEdge = { p1: sp1, p2: sp2 };
            }
        }
        
        // 判斷是否為完整邊緣 (若無內部交點，長度幾乎等於原邊長)
        const isWholeEdge = Math.hypot(bestSubEdge.p1.x - bestEdge.p1.x, bestSubEdge.p1.y - bestEdge.p1.y) < 2 &&
                            Math.hypot(bestSubEdge.p2.x - bestEdge.p2.x, bestSubEdge.p2.y - bestEdge.p2.y) < 2;
        
        const finalIdx = isWholeEdge ? bestEdge.index : -1;
        
        createDimensionMark(bestSubEdge.p1, bestSubEdge.p2, target, finalIdx);
        return true; 
    } else {
        if(typeof statusText !== 'undefined') statusText.innerText = `無法偵測到附近的邊緣 (距離: ${Math.round(minDist)})`;
        return false;
    }
}

/**
 * 根據選取的物件動態建立右鍵選單
 * @param {Array} selected - 當前選取的物件陣列
 */
function buildContextMenu(selected) {
    const specificMenu = document.getElementById('ctx-actions-specific');
    const generalMenu = document.getElementById('ctx-actions-general');
    const separator = document.getElementById('ctx-separator');

    specificMenu.innerHTML = '';
    generalMenu.innerHTML = '';
    separator.style.display = 'none';

    let specificActions =[];
    let subToolKey = null;
    // 輔助函式：建立選單 HTML
	
    const createItem = (item) => {
        const div = document.createElement('div');
        div.className = 'context-menu-item';
        div.innerHTML = `<i class="context-menu-icon">${item.icon || ''}</i> <span>${item.label || ''}</span>`;
        
        // 【需求修正】移除智慧填滿的子選單(調色盤)邏輯，直接執行綁定的 action
        // 這會讓智慧填滿直接套用系統頂部工具列的「填滿顏色」與「填滿樣式」！
        div.onclick = (e) => {
            e.stopPropagation(); 
            document.getElementById('context-menu').style.display = 'none';
            setTimeout(() => { item.action(); }, 10); 
        };
        
        return div;
    };
	
    if (selected.length === 1) {
        const shape = selected[0];
        const tool = shape.getAttribute('data-tool');
        const depType = shape.getAttribute('data-dependency-type');

        // 1. 鎖頭圖示
        if (tool === 'lock-icon') {
            specificMenu.appendChild(createItem({ 
                label: '解除/刪除此鎖定', icon: '🔓', action: () => {
                    if (typeof window.toggleGeometryLock === 'function') {
                        // 模擬在該位置點擊一次以觸發解鎖
                        window.toggleGeometryLock(); 
                    }
                }
            }));
            return;
        }

        // 2. 邊長/角度標記 (Mark)
        if (tool === 'mark-edge-symbol' || tool === 'mark' || depType === 'angle_mark' || shape.classList.contains('intersection-mark')) {
            if (tool === 'mark-edge-symbol') {
                specificMenu.appendChild(createItem({ label: '切換樣式', icon: '🔄', action: () => { if(typeof window.cycleEdgeMark === 'function') window.cycleEdgeMark(shape); } }));
            } else {
                 specificMenu.appendChild(createItem({ label: '切換樣式', icon: '🔄', action: () => { if(typeof window.cycleAngleMark === 'function') window.cycleAngleMark(shape); } }));
            }
            specificMenu.appendChild(createItem({ label: '刪除', icon: '🗑️', action: () => deleteSelected() }));
            // 直接結束，不顯示通用選單
            return;
        }

        // 3. 其他附屬繪圖 (中垂線、半徑、對角線等)
		/*
        if (depType && !['center-point', 'center-label'].includes(depType)) {
             specificMenu.appendChild(createItem({ label: '刪除此輔助線', icon: '🗑️', action: () => deleteSelected() }));
             // 直接結束
             return;
        }
		*/
		
		
        subToolKey = shape.getAttribute('data-sub-tool') || tool;
        
        // 如果這個 shape 沒有對應在 MENU_REGISTRY，且他是 group，就給他 default_group
        if (tool === 'group' && !window.MENU_REGISTRY[subToolKey]) {
            subToolKey = 'default_group';
        }

        if (CONTEXT_MENU_CONFIG[tool]) {
            // 合併 ID 與 INFO
            CONTEXT_MENU_CONFIG[tool].forEach(act => {
                if(window.ACTION_INFO[act.id]) {
                    specificActions.push({ ...act, label: window.ACTION_INFO[act.id].label, icon: window.ACTION_INFO[act.id].icon });
                } else {
                    specificActions.push(act); // 備援
                }
            });
        }
        
        // 針對三角形的三心動態加入
        if (tool === 'polygon' && getShapePoints(shape).length === 3) {
            specificActions.push(
                { id: 'tri_circum', label: window.ACTION_INFO['tri_circum'].label, icon: window.ACTION_INFO['tri_circum'].icon, action: () => executeConstruction('circumcenter') },
                { id: 'tri_in', label: window.ACTION_INFO['tri_in'].label, icon: window.ACTION_INFO['tri_in'].icon, action: () => executeConstruction('incenter') },
                { id: 'tri_cent', label: window.ACTION_INFO['tri_cent'].label, icon: window.ACTION_INFO['tri_cent'].icon, action: () => executeConstruction('centroid') }
            );
        }

    } else if (selected.length > 1) {
        // 多選邏輯 (不套用自訂選單)
        if (selected.length === 2) {
            const isTwoCircles = selected.every(el => {
                const t = el.getAttribute('data-tool');
                const st = el.getAttribute('data-sub-tool');
                return t === 'ellipse' || st === 'circle' || st === 'circle-smart';
            });
            if (isTwoCircles) {
                specificActions.push(
                    { label: '外公切線 (附輔助線)', icon: '🔗', action: () => window.createCommonTangentSystem(selected[0], selected[1], 'external') },
                    { label: '內公切線 (附輔助線)', icon: '🔗', action: () => window.createCommonTangentSystem(selected[0], selected[1], 'internal') },
                    { isSeparator: true }
                );
            }
        }
        // 原有 multi-select config 這裡直接 hardcode 寫入，因為我們拿掉了 CONTEXT_MENU_CONFIG 裡的 multi-select
        specificActions.push(
            { label: '建立群組', icon: '🔒', action: () => groupSelected(), condition: (els) => els.length > 1 },
            { label: '對齊工具', icon: '📊', action: () => openSubMenuAtContext('menu-align') },
            { label: '批次設定文字樣式', icon: '🎨', action: () => openBatchTextFormatModal(), condition: (els) => els.some(e => e.getAttribute('data-tool') === 'text' || e.getAttribute('data-tool') === 'math' || e.tagName.toLowerCase() === 'text') }
        );
    }

    // --- 關鍵過濾：讀取 LocalStorage 設定 ---
    if (subToolKey && selected.length === 1) {
        const customConfigStr = localStorage.getItem('math_editor_custom_menus');
        if (customConfigStr) {
            try {
                const customConfig = JSON.parse(customConfigStr);
                if (customConfig[subToolKey]) {
                    const allowedIds = customConfig[subToolKey]; // 使用者決定的 ID 順序
                    const filteredActions =[];
                    // 依照使用者定義的順序推入
                    allowedIds.forEach(id => {
                        const found = specificActions.find(a => a.id === id);
                        if (found) filteredActions.push(found);
                    });
                    specificActions = filteredActions;
                }
            } catch(e) {}
        }
    }

    specificActions.forEach(item => {
        if (item.isSeparator) {
            const sep = document.createElement('div'); sep.className = 'context-menu-separator'; sep.style.display = 'block'; specificMenu.appendChild(sep); return;
        }
        if (!item.condition || item.condition(selected)) {
            specificMenu.appendChild(createItem(item));
        }
    });

    // 渲染通用功能
    GENERAL_ACTIONS.forEach(item => {
        if (item.isSeparator) {
            const sep = document.createElement('div'); sep.className = 'context-menu-separator'; sep.style.display = 'block'; generalMenu.appendChild(sep);
        } else {
            generalMenu.appendChild(createItem(item));
        }
    });

    if (specificMenu.children.length > 0) separator.style.display = 'block';
}

window.SHAPE_CATEGORY_MAP = {
    'line_group':[
        { id: 'point', label: '圓點', icon: '●' }, { id: 'line-simple', label: '直線', icon: '╱' },
        { id: 'polyline', label: '折線', icon: '〰' }, { id: 'line-end', label: '單箭頭', icon: '→' },
        { id: 'line-double', label: '雙箭頭', icon: '↔' }, { id: 'angle', label: '角', icon: '∠' }
    ],
    'tri_group':[
        { id: 'tri-any', label: '任意', icon: '△' }, { id: 'tri-iso', label: '等腰', icon: '△' }, { id: 'tri-right', label: '直角', icon: '⊿' }
    ],
    'quad_group':[
        { id: 'rect', label: '矩形', icon: '▭' },
        { id: 'rhombus', label: '菱形', icon: '◇' }, { id: 'kite', label: '箏形', icon: '⟠' },
        { id: 'parallelogram', label: '平行', icon: '▱' }, { id: 'trapezoid', label: '梯形', icon: '⏢' },
        { id: 'polygon', label: '多邊形', icon: '⬠' }
    ],
    'circle_group':[
        { id: 'circle', label: '圓形', icon: '○' }, { id: 'ellipse', label: '橢圓', icon: '⬭' },
        { id: 'sector', label: '扇形', icon: '⌔' }, { id: 'arc', label: '圓弧', icon: '⌒' },
        { id: 'arch', label: '弓形', icon: '⌓' }, { id: 'star', label: '星形', icon: '☆' }
    ],
    'solid_group':[
        { id: 'blocks', label: '積木', icon: '🧊' }, { id: 'solid-cube', label: '正方體', icon: '🧊' },
        { id: 'solid-cylinder', label: '圓柱', icon: '🛢️' }, { id: 'solid-cone', label: '圓錐', icon: '🍦' },
        { id: 'solid-pyramid', label: '正四角錐', icon: '⛺' }, { id: 'solid-prism', label: '正三角柱', icon: '⛺' }
    ],
    'stats_group':[
        { id: 'axis-chart', label: '折線圖', icon: '📈' }, { id: 'boxplot', label: '盒狀圖', icon: '📊' },
        { id: 'histogram', label: '直方圖', icon: '📉' }, { id: 'pie-chart', label: '圓餅圖', icon: '🥧' }
    ],
    'other_group':[
        { id: 'parabola', label: '拋物線', icon: '∪' }, { id: 'inequality', label: '不等式', icon: '≤' }, { id: 'venn', label: '文氏圖', icon: '⭕' }
    ]
};

let ccmCurrentSubTool = null;
let ccmAvailableItems = [];
let ccmSelectedItems =[];
let ccmLocalConfig = {};

window.openCustomMenuModal = function(categoryKey) {
    const modal = document.getElementById('custom-context-menu-modal');
    modal.style.display = 'flex';
    
    // 讀取既有設定 (右鍵選單與工具列顯示)
    const savedStr = localStorage.getItem('math_editor_custom_menus');
    ccmLocalConfig = savedStr ? JSON.parse(savedStr) : {};

    const visStr = localStorage.getItem('math_editor_toolbar_vis');
    const toolbarVis = visStr ? JSON.parse(visStr) : {};

    // 渲染上方形狀選取器
    const selectorContainer = document.getElementById('ccm-shape-selector');
    selectorContainer.innerHTML = '';
    const shapes = window.SHAPE_CATEGORY_MAP[categoryKey] ||[];
    
    shapes.forEach((shape, index) => {
        const isVisible = toolbarVis[shape.id] !== false; // 預設為 true (打勾)

        const btn = document.createElement('div');
        btn.className = 'ccm-shape-btn';
        btn.id = 'ccm-btn-' + shape.id;
        
        // 加上 Checkbox
        btn.innerHTML = `
            <input type="checkbox" ${isVisible ? 'checked' : ''} style="margin: 0 6px 0 0; cursor: pointer;" title="顯示於左側工具列">
            <span>${shape.icon}</span> <span>${shape.label}</span>
        `;
        
        // 點擊事件分流：點 Checkbox 切換顯示，點其他地方切換 Tab
        btn.onclick = (e) => {
            if (e.target.tagName.toLowerCase() === 'input') {
                toolbarVis[shape.id] = e.target.checked;
                localStorage.setItem('math_editor_toolbar_vis', JSON.stringify(toolbarVis));
                window.applyToolbarVisibility();
            } else {
                window.ccmSelectShape(shape.id);
            }
        };
        selectorContainer.appendChild(btn);
        
        // 預設選取第一個
        if (index === 0) window.ccmSelectShape(shape.id);
    });
};

// 【新增】套用工具列隱藏/顯示邏輯
window.applyToolbarVisibility = function() {
    const visStr = localStorage.getItem('math_editor_toolbar_vis');
    const toolbarVis = visStr ? JSON.parse(visStr) : {};
    
    // 建立 HTML onclick 參數到 Shape ID 的反向對照表
    const ID_TO_ONCLICK_MAP = {
        'blocks': "'solid-blocks'",
        'solid-cube': "'solid'",
        'solid-cylinder': "'cylinder'",
        'solid-cone': "'cone'",
        'solid-pyramid': "'pyramid'",
        'solid-prism': "'prism'",
        'arch': "'circular_segment'",
        'pie-chart': "'pie_chart'",
		'axis-chart': "'axis_chart'",
        'venn': "'venn_diagram'"
    };

    document.querySelectorAll('.left-sidebar .shape-btn').forEach(btn => {
        const onclickStr = btn.getAttribute('onclick') || '';
        let isVisible = true;
        
        for (const cat in window.SHAPE_CATEGORY_MAP) {
            const shapes = window.SHAPE_CATEGORY_MAP[cat];
            for (const shape of shapes) {
                const searchStr = ID_TO_ONCLICK_MAP[shape.id] || `'${shape.id}'`;
                if (onclickStr.includes(searchStr)) {
                    if (toolbarVis[shape.id] === false) {
                        isVisible = false;
                    }
                    break;
                }
            }
        }
        btn.style.display = isVisible ? '' : 'none';
    });
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { 
        if(window.renderCustomMarksMenu) window.renderCustomMarksMenu(); 
        if(window.applyToolbarVisibility) window.applyToolbarVisibility(); 
    }, 500);
});

window.ccmSelectShape = function(subToolId) {
    // 儲存前一個形狀的狀態
    if (ccmCurrentSubTool) {
        ccmLocalConfig[ccmCurrentSubTool] = [...ccmSelectedItems];
    }
    
    ccmCurrentSubTool = subToolId;
    
    // UI 高亮切換
    document.querySelectorAll('.ccm-shape-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('ccm-btn-' + subToolId);
    if (activeBtn) activeBtn.classList.add('active');

    // 取得所有可能的功能
    const allPossibleIds = window.MENU_REGISTRY[subToolId] ||[];
    
    if (ccmLocalConfig[subToolId]) {
        // 使用者有自訂過
        ccmSelectedItems = [...ccmLocalConfig[subToolId]];
        // 確保排除掉可能已經不存在的功能
        ccmSelectedItems = ccmSelectedItems.filter(id => allPossibleIds.includes(id));
        ccmAvailableItems = allPossibleIds.filter(id => !ccmSelectedItems.includes(id));
    } else {
        // 預設：全開
        ccmSelectedItems = [...allPossibleIds];
        ccmAvailableItems =[];
    }

    ccmRenderLists();
};

window.ccmRenderLists = function() {
    const renderList = (containerId, items) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = '<div style="color:#aaa; text-align:center; padding:10px; font-size:12px;">無項目</div>';
        }
        items.forEach(id => {
            const info = window.ACTION_INFO[id] || { label: id, icon: '' };
            const div = document.createElement('div');
            div.className = 'ccm-list-item';
            div.setAttribute('data-id', id);
            div.innerHTML = `<span style="width:20px; text-align:center;">${info.icon}</span> <span>${info.label}</span>`;
            div.onclick = function() { this.classList.toggle('selected'); };
            container.appendChild(div);
        });
    };
    renderList('ccm-available-list', ccmAvailableItems);
    renderList('ccm-selected-list', ccmSelectedItems);
};

window.ccmMoveItem = function(direction) {
    const leftBox = document.getElementById('ccm-available-list');
    const rightBox = document.getElementById('ccm-selected-list');
    
    if (direction === 'right') {
        const selected = leftBox.querySelectorAll('.selected');
        selected.forEach(node => {
            const id = node.getAttribute('data-id');
            ccmAvailableItems = ccmAvailableItems.filter(i => i !== id);
            ccmSelectedItems.push(id); // 加入到最後面
        });
    } else {
        const selected = rightBox.querySelectorAll('.selected');
        selected.forEach(node => {
            const id = node.getAttribute('data-id');
            ccmSelectedItems = ccmSelectedItems.filter(i => i !== id);
            ccmAvailableItems.push(id);
        });
    }
    ccmRenderLists();
};

window.ccmReorderItem = function(direction) {
    const rightBox = document.getElementById('ccm-selected-list');
    const selectedNodes = Array.from(rightBox.querySelectorAll('.selected'));
    if (selectedNodes.length === 0) return;

    if (direction === 'up') {
        selectedNodes.forEach(node => {
            const id = node.getAttribute('data-id');
            const idx = ccmSelectedItems.indexOf(id);
            if (idx > 0) {
                // Swap
                const temp = ccmSelectedItems[idx - 1];
                ccmSelectedItems[idx - 1] = id;
                ccmSelectedItems[idx] = temp;
            }
        });
    } else {
        // 從下往上遍歷，避免互相卡住
        for (let i = selectedNodes.length - 1; i >= 0; i--) {
            const id = selectedNodes[i].getAttribute('data-id');
            const idx = ccmSelectedItems.indexOf(id);
            if (idx < ccmSelectedItems.length - 1) {
                // Swap
                const temp = ccmSelectedItems[idx + 1];
                ccmSelectedItems[idx + 1] = id;
                ccmSelectedItems[idx] = temp;
            }
        }
    }
    
    ccmRenderLists();
    
    // 重新選取剛剛移動的項目
    selectedNodes.forEach(node => {
        const id = node.getAttribute('data-id');
        const el = document.querySelector(`#ccm-selected-list [data-id="${id}"]`);
        if (el) el.classList.add('selected');
    });
};

window.ccmSaveConfig = function() {
    // 儲存當前正在編輯的形狀
    if (ccmCurrentSubTool) {
        ccmLocalConfig[ccmCurrentSubTool] = [...ccmSelectedItems];
    }
    
    localStorage.setItem('math_editor_custom_menus', JSON.stringify(ccmLocalConfig));
    document.getElementById('custom-context-menu-modal').style.display = 'none';
    
    if(typeof statusText !== 'undefined') statusText.innerText = "自訂選單設定已儲存！";
};

let currentCanvasMode = 'screen'; // 'screen' or 'print'

// 96 DPI 換算表 (mm -> px)
// A4: 210x297mm, B4(JIS): 257x364mm, A3: 297x420mm
const PAPER_SIZES = {
    'a4': { w: 794, h: 1123, name: 'A4' },
    'b4': { w: 971, h: 1376, name: 'B4 (JIS)' },
    'a3': { w: 1123, h: 1587, name: 'A3' }
};

const SCREEN_SIZES = [
    { w: 800, h: 600, name: '800 x 600 (4:3)' },
    { w: 1024, h: 768, name: '1024 x 768 (4:3)' },
    { w: 1280, h: 720, name: '1280 x 720 (16:9)' },
    { w: 1920, h: 1080, name: '1920 x 1080 (16:9)' }
];

// 開啟設定視窗
function openCanvasSettingsModal() {
    const modal = document.getElementById('canvas-settings-modal');
    modal.style.display = 'flex';
    
    // --- 1. 讀取目前的畫布狀態 ---
    const svg = document.getElementById('svg-canvas');
    const currentW = parseFloat(svg.getAttribute('width')) || 800;
    const currentH = parseFloat(svg.getAttribute('height')) || 600;
    // currentCanvasMode 是全域變數，若未定義則預設 screen
    const mode = (typeof currentCanvasMode !== 'undefined') ? currentCanvasMode : 'screen';

    // --- 2. 更新右上角的「目前設定」顯示 ---
    const infoEl = document.getElementById('current-canvas-info');
    if (infoEl) {
        const modeText = mode === 'print' ? '列印' : '螢幕';
        infoEl.innerText = `目前: ${currentW} x ${currentH} (${modeText})`;
    }

    // --- 3. 同步「使用情境」Radio ---
    const modeRad = document.querySelector(`input[name="canvas-mode"][value="${mode}"]`);
    if (modeRad) modeRad.checked = true;

    // --- 4. 同步「版面方向」Radio ---
    // 簡單判斷：寬 >= 高 為橫向，否則直向
    const orient = currentW >= currentH ? 'landscape' : 'portrait';
    const orientRad = document.querySelector(`input[name="canvas-orient"][value="${orient}"]`);
    if (orientRad) orientRad.checked = true;

    // --- 5. 更新下拉選單內容 (根據 Mode 和 Orient) ---
    // 這一步很重要，必須先重建選項，才能選取正確的值
    updateCanvasSizeOptions(); 

    // --- 6. 同步「尺寸下拉選單」的值 ---
    const targetVal = `${currentW},${currentH}`;
    const select = document.getElementById('canvas-size-dropdown');
    
    // 嘗試選取完全符合的項目
    let matched = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === targetVal) {
            select.selectedIndex = i;
            matched = true;
            break;
        }
    }
    
    // 如果目前的尺寸不在標準清單內 (例如自訂尺寸)，可以選擇加入一個暫時選項或保持預設
    if (!matched) {
        const customOpt = document.createElement('option');
        customOpt.value = targetVal;
        customOpt.text = `自訂 / 目前 (${currentW} x ${currentH})`;
        customOpt.selected = true;
        select.insertBefore(customOpt, select.firstChild); // 插在最前面
        select.value = targetVal;
    }
}

// 更新下拉選單內容
function updateCanvasSizeOptions() {
    const mode = document.querySelector('input[name="canvas-mode"]:checked').value;
    const orient = document.querySelector('input[name="canvas-orient"]:checked').value;
    const select = document.getElementById('canvas-size-dropdown');
    
    select.innerHTML = '';
    
    if (mode === 'screen') {
        SCREEN_SIZES.forEach(s => {
            // 螢幕模式通常指橫向解析度，若選直向則交換
            let w = s.w, h = s.h;
            if (orient === 'portrait') { w = s.h; h = s.w; }
            
            const opt = document.createElement('option');
            opt.value = `${w},${h}`;
            opt.text = `${s.name} ${orient === 'portrait' ? '(直)' : ''}`;
            select.appendChild(opt);
        });
    } else {
        // Print Mode
        for (let key in PAPER_SIZES) {
            const p = PAPER_SIZES[key];
            let w = p.w, h = p.h; // 預設直向數據
            
            if (orient === 'landscape') {
                const temp = w; w = h; h = temp;
            }
            
            const opt = document.createElement('option');
            opt.value = `${w},${h}`;
            opt.text = `${p.name} - ${orient === 'portrait' ? '直式' : '橫式'} (${w}x${h})`;
            select.appendChild(opt);
        }
    }
}

// 確認套用設定
function confirmCanvasSettings() {
    const val = document.getElementById('canvas-size-dropdown').value;
    const mode = document.querySelector('input[name="canvas-mode"]:checked').value;
    const showMargin = document.getElementById('canvas-safe-margin').checked;
    
    const [w, h] = val.split(',').map(Number);
    
    // 呼叫核心套用函式
    applyCanvasSize(w, h, mode);
    
    // 處理安全邊距 (簡單畫一個虛線矩形在 tempLayer 或 backgroundLayer)
    drawSafeMargin(w, h, showMargin);

    document.getElementById('canvas-settings-modal').style.display = 'none';
}

function updateCanvasSettingsUI() {
    const mode = document.querySelector('input[name="canvas-mode"]:checked').value;
    
    // 1. 自動切換預設方向
    if (mode === 'screen') {
        // 螢幕模式 -> 預設橫向
        document.querySelector('input[name="canvas-orient"][value="landscape"]').checked = true;
    } else {
        // 列印模式 -> 預設直向
        document.querySelector('input[name="canvas-orient"][value="portrait"]').checked = true;
    }
    
    // 2. 根據新的模式與方向，更新尺寸下拉選單
    updateCanvasSizeOptions();
}

// 繪製安全邊距 (輔助線)
function drawSafeMargin(w, h, enable) {
    // 先移除舊的
    const old = document.getElementById('safe-margin-rect');
    if (old) old.remove();
    
    if (!enable) return;
    
    const margin = 38; // 約 1cm (96dpi)
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.id = "safe-margin-rect";
    rect.setAttribute("x", margin);
    rect.setAttribute("y", margin);
    rect.setAttribute("width", w - margin * 2);
    rect.setAttribute("height", h - margin * 2);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", "#e74c3c");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("stroke-dasharray", "10,10");
    rect.style.pointerEvents = "none";
    rect.style.opacity = "0.5";
    
    // 加到背景層或最上層 (這裡加到 tempLayer 確保可見但不影響選取)
    const layer = document.getElementById('temp-layer');
    if (layer) layer.appendChild(rect);
}

function fixMenuPosition(menuId, wrapperElement) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // 1. 強制重置所有定位樣式，並覆蓋 CSS 中的 !important
    // 這是關鍵：必須用 'important' 參數才能蓋過 style.css 裡的 bottom: 0 !important
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('top', 'auto', 'important');
    menu.style.setProperty('left', 'auto', 'important');
    menu.style.setProperty('right', 'auto', 'important');

    // 2. 顯示並設定 fixed 定位
    menu.style.display = 'flex';
    menu.style.position = 'fixed';
    
    // 3. 取得尺寸與位置
    const btnRect = wrapperElement.getBoundingClientRect();
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const gap = 5;

    // 4. 計算水平位置 (靠按鈕左側)
    const leftPos = btnRect.left - menuWidth - gap;
    menu.style.left = leftPos + 'px';
    
    // 5. 計算垂直位置 (對齊按鈕頂部)
    let topPos = btnRect.top;
    
    // 6. 垂直邊界檢查 (防止超出視窗底部)
    // 如果 (起點 + 高度) 超過視窗高度，就往上推
    if (topPos + menuHeight > window.innerHeight) {
        // 將選單底部對齊「視窗底部」(保留 10px 緩衝)
        topPos = window.innerHeight - menuHeight - 10;
        
        // 如果往上推導致超出「視窗頂部」，則強制對齊頂部
        if (topPos < 10) topPos = 10;
    }
    
    // 套用計算後的高度
    menu.style.top = topPos + 'px';
}

function toggleSymmetryMode() {
    // 1. 如果已經在對稱模式中，再次點擊按鈕則取消
    if (mode === 'symmetry') {
        // 如果還在第 1 步 (選取)，且已經有選到東西 -> 視為「確認選取」，進入第 2 步
        if (symmetryStep === 0 && selectedElements.length > 0) {
            symmetryStep = 1;
            handlesLayer.innerHTML = ''; // 隱藏控制點
            const msg = "對稱作圖 (步驟 2/2)：請畫出對稱軸，或「點選」現有的直線";
            statusText.innerText = msg;
            if (typeof window.showToolTipImmediate === 'function') window.showToolTipImmediate(msg);
            return;
        }
        
        // 其他情況 (已在第 2 步，或第 1 步沒選東西) -> 取消模式
        setMode('select');
        statusText.innerText = "已取消對稱作圖";
        return;
    }

    closeAllMenus();
    mode = 'symmetry';

    // 2. 更新工具列按鈕狀態 (保護吸附與格線等狀態按鈕)
    document.querySelectorAll('.tool-btn').forEach(b => {
        if (['btn-toggle-grid', 'btn-snap-intersection', 'btn-snap-point', 'btn-real-grid', 'btn-lock-geom'].includes(b.id)) return;
        b.classList.remove('active');
    });
    document.getElementById('btn-symmetry').classList.add('active');

    // 3. 核心邏輯：判斷是否已有選取物件
    if (selectedElements.length > 0) {
        // --- 直接進入第 2 步 (畫或選對稱軸) ---
        symmetryStep = 1; 
        handlesLayer.innerHTML = ''; // 隱藏控制點，讓視覺清爽一點準備畫軸
        const msg = "對稱作圖 (步驟 2/2)：請直接在畫布上拖曳畫出對稱軸";
        statusText.innerText = msg;
        
        // 立即顯示浮動提示 (Tooltip)
        if (typeof window.showToolTipImmediate === 'function') {
            window.showToolTipImmediate(msg);
        }
    } else {
        // --- 進入第 1 步 (選取物件) ---
        symmetryStep = 0;
        deselectAll();
        statusText.innerText = "對稱作圖 (步驟 1/2)：請選取或框選要對稱的物件 (完成後按右鍵或 Enter)";
    }
}

window.EDGE_STYLES =['1', '2', '3', 'tick', 'x', 'o', 'parallel'];
window.ANGLE_STYLES =['degree', 'arc', 'double-arc', 'x', 'o', '1', '2', '3'];

// 智慧判斷演算法：依據座標距離決定是角標還是線標
window.determineSmartType = function(x, y) {
    const shapes = document.querySelectorAll('.shape:not(.mark-path)');
    let minVDist = Infinity;
    let minEDist = Infinity;
    let allSegments =[];
    
    shapes.forEach(shape => {
        const tool = shape.getAttribute('data-tool');
        if (tool === 'group' && shape.tagName !== 'g') return;
        if (tool === 'text' || tool === 'math' || shape.classList.contains('vertex-label') || shape.classList.contains('angle-label-text')) return;

        if (typeof extractGeometry === 'function') {
            const geo = extractGeometry(shape);
            if (geo && geo.segments) {
                geo.segments.forEach(seg => allSegments.push(seg));
            }
        }

        const pts = getTransformedPoints(shape);
        if (!pts) return;
        
        // 算到頂點的距離
        pts.forEach(p => {
            const d = Math.hypot(p.x - x, p.y - y);
            if (d < minVDist) minVDist = d;
        });

        // 算到邊的距離
        if (pts.length >= 2) {
            const isPolygon = (tool === 'polygon' || tool === 'rect' || tool === 'tri');
            const len = (isPolygon || (pts.length > 2 && tool !== 'polyline')) ? pts.length : pts.length - 1;
            for (let i = 0; i < len; i++) {
                const p1 = pts[i];
                const p2 = pts[(i + 1) % pts.length];
                const d = distToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
                if (d < minEDist) minEDist = d;
            }
        }
    });

    // 加入交點判定
    for (let i = 0; i < allSegments.length; i++) {
        for (let j = i + 1; j < allSegments.length; j++) {
            const pt = getLineLineIntersection(allSegments[i].p1, allSegments[i].p2, allSegments[j].p1, allSegments[j].p2);
            if (pt) {
                const d = Math.hypot(pt.x - x, pt.y - y);
                if (d < minVDist) minVDist = d;
            }
        }
    }

    // 偏好：只要距離頂點/交點在 30px 內，優先當作角標，否則視為線標
    if (minVDist <= 30) return 'angle';
    return 'edge';
};

// 整合的智慧標記工具
window.activateSmartMarkTool = function(modeOverride = 'smart', continuous = false) {
    window.currentMarkMode = modeOverride; // 記憶目前模式，以便右鍵選單套用後維持原狀
    let modeToUse = modeOverride;
    isContinuousMarking = continuous;
    
    const fallbackToMarkMode = () => {
        if (typeof deselectAll === 'function') deselectAll();
        if (typeof window.clearAnchorPoint === 'function') window.clearAnchorPoint();
        activateMarkMode(modeToUse);
    };

    // 1. 先定後標 (有定錨點)
    if (window.anchorPoint) {
        const snap = findClosestPointOnShapes(window.anchorPoint.x, window.anchorPoint.y, 25);
        
        if (!snap || !snap.shape) {
            fallbackToMarkMode(); 
            return;
        }

        const actualMode = (modeToUse === 'smart') ? determineSmartType(window.anchorPoint.x, window.anchorPoint.y) : modeToUse;
        const savedType = markModeType;
        markModeType = actualMode;
        
        autoApplyMark(window.anchorPoint.x, window.anchorPoint.y);
        
        markModeType = savedType;
        window.clearAnchorPoint(); 
        if (!continuous) setMode('select');
        return;
    }

       if (selectedElements.length > 0) {
        const targetShape = selectedElements[0];
        const tool = targetShape.getAttribute('data-tool');
        const isMarkOrText = tool === 'mark' || tool === 'mark-edge-symbol' || tool === 'text' || tool === 'math' || 
                             targetShape.classList.contains('vertex-label') || targetShape.classList.contains('angle-label-text');
                             
        if (isMarkOrText || selectedElements.length > 1) {
            fallbackToMarkMode();
            return;
        }

        // 【修復 Bug】：統一使用最後點擊畫布的真實位置 (不分左右鍵)
        const refX = lastClickPos.x;
        const refY = lastClickPos.y;
        
        const bbox = targetShape.getBBox();
        const m = targetShape.getCTM();
        const p1 = {x: bbox.x, y: bbox.y};
        const p2 = {x: bbox.x + bbox.width, y: bbox.y + bbox.height};
        const g_p1 = {x: p1.x * m.a + p1.y * m.c + m.e, y: p1.x * m.b + p1.y * m.d + m.f};
        const g_p2 = {x: p2.x * m.a + p2.y * m.c + m.e, y: p2.x * m.b + p2.y * m.d + m.f};
        
        // 距離太遠則失效
        if (refX < Math.min(g_p1.x, g_p2.x) - 50 || refX > Math.max(g_p1.x, g_p2.x) + 50 || 
            refY < Math.min(g_p1.y, g_p2.y) - 50 || refY > Math.max(g_p1.y, g_p2.y) + 50) {
            fallbackToMarkMode();
            return;
        }

        const actualMode = (modeToUse === 'smart') ? determineSmartType(refX, refY) : modeToUse;
        const savedType = markModeType;
        markModeType = actualMode;
        
        autoApplyMark(refX, refY);
        
        markModeType = savedType;
        if (!continuous) setMode('select');
        return;
    }
    
    // 3. 進入智慧標記等待點擊模式 (先標後定)
    activateMarkMode(modeToUse);
};

// 開啟/關閉智慧標記選單
window.toggleSmartMarkMenu = function(btnId) {
    const menu = document.getElementById('menu-mark-smart');
    const btnWrapper = document.getElementById(btnId).parentNode;
    const isVisible = (menu.style.display === 'flex');
    closeAllMenus();
    if (!isVisible) {
        fixMenuPosition('menu-mark-smart', btnWrapper);
    }
};

// 選定並設定預設樣式
window.selectSmartMarkStyle = function(type, style) {
    if (type === 'edge') currentEdgeStyle = style;
    else if (type === 'angle') currentAngleStyle = style;
    else if (type === 'smart') {
        currentEdgeStyle = style;
        currentAngleStyle = style;
    }
    closeAllMenus();
    let targetMode = type;
    if (type === 'smart') {
        targetMode = window.currentMarkMode || 'smart';
    }
    
    activateSmartMarkTool(targetMode);
};

function activateMarkMode(type) {
    mode = 'mark';
    markModeType = type; // 這裡會是 'smart', 'edge', 或 'angle'
    window.currentMarkMode = type;
    
    document.querySelectorAll('.tool-btn').forEach(btn => {
        if (['btn-toggle-grid', 'btn-snap-intersection', 'btn-real-grid', 'btn-snap-point', 'btn-lock-geom'].includes(btn.id)) return;
        btn.classList.remove('active');
    });
    
    const btnSmart = document.getElementById('btn-mark-smart');
    const btnEdge = document.getElementById('btn-mark-edge');
    const btnAngle = document.getElementById('btn-mark-angle');
    
    if (type === 'smart' && btnSmart) btnSmart.classList.add('active');
    if (type === 'edge' && btnEdge) btnEdge.classList.add('active');
    if (type === 'angle' && btnAngle) btnAngle.classList.add('active');
    
    if (type === 'smart') {
        statusText.innerText = "智慧標記：點擊邊緣標記等長/平行，點擊頂點/交點標記角度";
    } else if (type === 'edge') {
        statusText.innerText = "線標模式：強制標記線段/邊長";
    } else if (type === 'angle') {
        statusText.innerText = "角標模式：強制標記內角/交點角";
    }
    svgCanvas.style.cursor = 'context-menu';
}
window.activateMarkMode = activateMarkMode;

function toggleAlignMenu() {
    const menu = document.getElementById('menu-align');
    const btnWrapper = document.getElementById('btn-align').parentNode; // 取得包裝容器

    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        closeAllMenus();
        // 改用新函式定位
        fixMenuPosition('menu-align', btnWrapper);
    }
}

function toggleStrokeWidthMenu() {
    const menu = document.getElementById('menu-stroke-width');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        closeAllMenus();
        menu.style.display = 'flex';
    }
}

function executeAlign(type) {
    alignSelected(type);
    closeAllMenus();
}

function updateColorSelect(selectEl) {
    // 1. 更新選單本身的文字顏色
    selectEl.style.color = selectEl.value;
    const color = selectEl.value;

    // 2. 針對「線條顏色」的連動
    if (selectEl.id === 'stroke-color-select') {
        // A. 同步「線條樣式」選單
        const lineStyleSelect = document.getElementById('line-style-select');
        if (lineStyleSelect) {
            lineStyleSelect.style.color = color;
            Array.from(lineStyleSelect.options).forEach(opt => {
                opt.style.color = color;
                opt.style.fontWeight = 'bold';
            });
        }
        
        // B. 同步「線條粗細」按鈕上的預覽條
        const widthPreview = document.getElementById('stroke-width-preview');
        if (widthPreview) {
            widthPreview.style.backgroundColor = color;
        }

        // C. 同步「線條粗細」下拉選單內的預覽條
        const widthMenuItems = document.querySelectorAll('#menu-stroke-width .popup-item div');
        widthMenuItems.forEach(div => {
            div.style.backgroundColor = color;
        });
    }

    // 3. 針對「填滿顏色」的連動
    if (selectEl.id === 'fill-color-select') {
        // 同步「填滿樣式」選單
        const fillStyleSelect = document.getElementById('fill-style-select');
        if (fillStyleSelect) {
            // 如果選「無填滿(none)」，樣式選單顯示黑色以免看不見，否則顯示選定色
            const displayColor = (color === 'none') ? '#000000' : color;
            
            fillStyleSelect.style.color = displayColor;
            Array.from(fillStyleSelect.options).forEach(opt => {
                opt.style.color = displayColor;
                opt.style.fontWeight = 'bold';
            });
        }
    }
}

function toggleLabelDirection() {
    isLabelClockwise = !isLabelClockwise;
    const btn = document.getElementById('btn-label-dir');
    if (isLabelClockwise) {
        btn.innerHTML = '↻';
        btn.title = "切換標註順序 (目前: 順時針)";
    } else {
        btn.innerHTML = '↺';
        btn.title = "切換標註順序 (目前: 逆時針)";
    }
    if (selectedElements.length > 0) {
        selectedElements.forEach(el => {
            reorderLabels(el);
        });
        statusText.innerText = `已更新標註方向為：${isLabelClockwise ? "順時針" : "逆時針"}`;
        saveState();
    } else {
        statusText.innerText = `標註方向已設定為：${isLabelClockwise ? "順時針" : "逆時針"} (下次繪圖生效)`;
    }
}

function updateLabelInput() {
    const nextLabel = indexToLabel(labelIndex);
    const input = document.getElementById('label-start-input');
    if (input) input.value = nextLabel;
}

function setLabelIndexFromInput() {
    const input = document.getElementById('label-start-input');
    let val = input.value.trim().toUpperCase();
    if (!val) {
        val = 'A';
        input.value = 'A';
    }
    const firstChar = val.charCodeAt(0);
    if (firstChar >= 65 && firstChar <= 90) {
        let baseIndex = firstChar - 65;
        const suffixStr = val.substring(1);
        let suffixNum = 0;
        if (suffixStr && !isNaN(suffixStr)) {
            suffixNum = parseInt(suffixStr);
        }
        labelIndex = baseIndex + (suffixNum * 26);
        statusText.innerText = `下一個標註點已設定為：${val}`;
    } else {
        statusText.innerText = "格式錯誤：請輸入 A-Z 開頭的標籤";
        updateLabelInput();
    }
    input.blur();
}

function initSymbols() {
    const symbolContainer = document.getElementById('symbol-container');
    if (!symbolContainer) return;
    symbolContainer.innerHTML = '';
    
    commonSymbols.forEach(sym => {
        const btn = document.createElement('div');
        btn.className = 'sym-btn';
        btn.textContent = sym;
        btn.onclick = () => {
            // 1. 偵測目前應該輸入到哪裡
            const customModal = document.getElementById('custom-formula-modal');
            // 只要 modal 的 style 不是 none 且不是空的，就判定為開啟中
            const isCustomOpen = customModal && (customModal.style.display === 'flex' || customModal.style.display === 'block');
            
            const targetInput = isCustomOpen ? 
                document.getElementById('custom-formula-code') : 
                document.getElementById('edit-input-area');
            
            if (!targetInput) return;

            // 2. 使用系統內建的 insertAtCursor 插入符號
            if (typeof insertAtCursor === 'function') {
                insertAtCursor(targetInput, sym);
            } else {
                // 備援方案
                targetInput.value += sym;
            }
            
            // 3. 如果是畫布編輯框，觸發即時預覽
            if (!isCustomOpen && typeof syncTextLive === 'function') {
                syncTextLive();
            }
        };
        symbolContainer.appendChild(btn);
    });
}

function onStyleChange(changeType, updateSystem=true) {
    const colorSelect = document.getElementById('fill-color-select');
    const styleSelect = document.getElementById('fill-style-select');
    const strokeColorSelect = document.getElementById('stroke-color-select');
    const lineStyleSelect = document.getElementById('line-style-select');
    const strokeWidthSelect = document.getElementById('stroke-width-select');
    
    // 取值時全面加上防呆
    let strokeColor = strokeColorSelect ? strokeColorSelect.value : "#000000";
    let lineStyleVal = lineStyleSelect ? lineStyleSelect.value : "solid";
    let fillColor = colorSelect ? colorSelect.value : "none";
    let fillStyle = styleSelect ? styleSelect.value : "solid";
    let strokeWidth = strokeWidthSelect ? strokeWidthSelect.value : "2";

    if (changeType === 'fill' && fillColor !== 'none') {
        lastFillColor = fillColor;
    }
    if (changeType === 'fill-style' && fillStyle !== 'solid' && fillColor === 'none') {
        fillColor = lastFillColor;
        if (colorSelect) colorSelect.value = fillColor;
        statusText.innerText = `已自動套用顏色：${fillColor}`;
    }
    
    if (selectedElements.length > 0) {
        let dashArray = "none";
        if (lineStyleVal === 'dashed') dashArray = "8,5";
        else if (lineStyleVal === 'dotted') dashArray = "2,4";
        else if (lineStyleVal === 'dash-dot') dashArray = "10,4,2,4";
        
        selectedElements.forEach(el => {
            const tool = el.getAttribute('data-tool');
            const tagName = el.tagName;
            const isMark = tool && tool.startsWith('mark');
            
            const applyStyleToElement = (targetEl) => {
                if (targetEl.classList.contains('hit-line')) return;
                if (changeType === 'stroke') {
                    if (targetEl.tagName === 'text') {
                        targetEl.style.fill = strokeColor;
                    } else if (targetEl.getAttribute('data-tool') === 'point') {
                        targetEl.style.stroke = strokeColor; 
                        targetEl.setAttribute('stroke', strokeColor);
                        if (targetEl.getAttribute('data-solid') !== '0') {
                            targetEl.style.fill = strokeColor;
                            targetEl.setAttribute('fill', strokeColor);
                        }
                    } else {
                        targetEl.style.stroke = strokeColor;
                    }
                }
                if (changeType === 'line-style') {
                    if (targetEl.tagName !== 'text' && targetEl.getAttribute('data-tool') !== 'point') {
                        targetEl.style.strokeDasharray = dashArray;
                    }
                }
                if (changeType === 'stroke-width') {
                    if (targetEl.tagName !== 'text' && targetEl.getAttribute('data-tool') !== 'point') {
                        targetEl.style.strokeWidth = strokeWidth;
                    }
                }
                if ((changeType === 'fill' || changeType === 'fill-style') && !isMark) {
                    if (targetEl.getAttribute('data-tool') !== 'line' && targetEl.getAttribute('data-tool') !== 'angle' && targetEl.getAttribute('data-tool') !== 'freehand' && !targetEl.classList.contains('visible-line')) {
                        updateShapeFill(targetEl, fillColor, fillStyle);
                    }
                }
            };
            if (tagName === 'g' || tool === 'group') {
                const children = el.querySelectorAll('*');
                children.forEach(child => {
                    if (['path', 'line', 'rect', 'circle', 'ellipse', 'polyline', 'polygon', 'text'].includes(child.tagName)) {
                        applyStyleToElement(child);
                    }
                });
            } else {
                applyStyleToElement(el);
            }
        });
        saveState();
        if (!(changeType === 'fill-style' && fillColor === lastFillColor && colorSelect && colorSelect.value !== 'none')) {
            statusText.innerText = "已更新選取物件的樣式。";
        }
    } else {
        let currentModeName = mode;
        if (mode === 'draw') currentModeName = "繪圖";
        else if (mode === 'select') currentModeName = "選取";
        else if (mode === 'mark') currentModeName = "標註";
        else if (mode === 'construct') currentModeName = "尺規作圖";
        statusText.innerText = `預設樣式已更新。目前模式：${currentModeName}`;
    }
	if (updateSystem) saveSystemSettings();
}

function updateShapeFill(shape, color, style) {
    if (color === 'none') {
        shape.style.fill = 'none';
        return;
    }
    if (style === 'solid') {
        shape.style.fill = color;
        return;
    }
    const colorId = color.replace('#', '').replace(/[() ,.]/g, '');
    const patternId = `${style}-${colorId}`;
    let pattern = document.getElementById(patternId);
    if (!pattern) {
        const template = document.getElementById(style);
        if (template) {
            pattern = template.cloneNode(true);
            pattern.id = patternId;
            const children = pattern.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.getAttribute('stroke') === 'currentColor') {
                    child.setAttribute('stroke', color);
                }
                if (child.getAttribute('fill') === 'currentColor') {
                    child.setAttribute('fill', color);
                }
            }
            document.querySelector('defs').appendChild(pattern);
        }
    }
    if (pattern) {
        shape.style.fill = `url(#${patternId})`;
    } else {
        shape.style.fill = color;
    }
}

function resetToolIcons() {
    if (defaultToolIcons.construct) {
        document.getElementById('btn-construct').innerHTML = defaultToolIcons.construct;
    }
    if (defaultToolIcons.edge) {
        document.getElementById('btn-mark-edge').innerHTML = defaultToolIcons.edge;
    }
    if (defaultToolIcons.angle) {
        document.getElementById('btn-mark-angle').innerHTML = defaultToolIcons.angle;
    }
}

function toggleInput(chkId, inputId) {
    const chk = document.getElementById(chkId);
    const inp = document.getElementById(inputId);
    if (chk && inp) {
        inp.disabled = !chk.checked;
        if (!chk.checked) inp.style.backgroundColor = "#f0f0f0";
        else inp.style.backgroundColor = "#fff";
    }
}

function closeAxesModal() {
    document.getElementById('axes-modal').style.display = 'none';
}

function clearRealBackground() {
    if (bgLayer.innerHTML === '') {
        statusText.innerText = "背景已經是空的了";
        return;
    }
    bgLayer.innerHTML = '';
    
    // 【修改】格線類名改加在 svgCanvas 上
    svgCanvas.classList.add('grid-bg-css'); 
    
    if (document.getElementById('btn-toggle-grid')) document.getElementById('btn-toggle-grid').classList.add('active');
    saveState();
    statusText.innerText = "已清除實體背景物件";
}

function toggleGrid() {
    svgCanvas.classList.toggle('grid-bg-css');
    
    const isActive = svgCanvas.classList.contains('grid-bg-css');
    const btn = document.getElementById('btn-toggle-grid');

    if (btn) {
        if (isActive) {
            btn.classList.add('active');
            statusText.innerText = "輔助格線：開啟";
        } else {
            btn.classList.remove('active');
            statusText.innerText = "輔助格線：隱藏";
        }
    }
    
    // 【核心修正】將輔助格線的狀態變更也記錄到 Undo 歷史中
    // 這樣使用者按 Undo 時，格線也會跟著恢復顯示/隱藏
    saveState(); 
}

function toggleConstructMode(type, continuous = false) {
    const btn = document.getElementById('btn-construct');
    isContinuousMarking = continuous;

    if (mode === 'construct' && constructionModeType === type && !continuous) {
        setMode('select');
        return;
    }
    closeAllMenus();

    // 0 步驟觸發：如果已經選取物件，直接呼叫 autoApplyConstruction 處理
    if (selectedElements.length > 0) {
        constructionModeType = type;
        const target = selectedElements[0];
        
        // 【修復 Bug】：統一使用最後點擊畫布的真實位置 (不分左右鍵)
        const cx = lastClickPos.x || 400;
        const cy = lastClickPos.y || 300;

        // 進入 autoApplyConstruction 進行處理
        autoApplyConstruction(target, cx, cy);
        return; // 完成後直接結束
    }

    // --- 新增：如果有定錨點，直接在定錨點進行作圖 ---
    if (window.anchorPoint) {
        constructionModeType = type;
        autoApplyConstruction(null, window.anchorPoint.x, window.anchorPoint.y);
        window.clearAnchorPoint();
        return;
    }

    mode = 'construct';
    constructionModeType = type;
    constructionStep = 0;
    deselectAll();
    
    document.querySelectorAll('.tool-btn').forEach(b => {
        if (['btn-toggle-grid', 'btn-snap-intersection', 'btn-snap-point', 'btn-real-grid', 'btn-lock-geom'].includes(b.id)) return;
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    let icon = '';
    let hint = "";
    if (type === 'midpoint') { icon = '·'; hint = "請點擊一條線段或邊"; } 
    else if (type === 'perpendicular') { icon = '⊥'; hint = "請點擊一條線段或邊"; } 
    else if (type === 'perpendicular_point') { icon = '⟂'; hint = "請點擊線段"; } 
    else if (type === 'median_line') { icon = '∕'; hint = "請點擊「三角形的邊」"; } 
    else if (type === 'parallel') { icon = '∥'; hint = "請點擊參考線段"; } 
    else if (type === 'tangent') { icon = '○'; hint = "請點擊一個圓形"; } 
    else if (type === 'divide_line') { icon = '📏'; hint = "請點擊線段"; } 
    else if (type === 'divide_angle') { icon = '∠'; hint = "請點擊角或頂點"; } 
    else if (type === 'circumcenter') { icon = '🔵'; hint = "請點擊三角形"; } 
    else if (type === 'incenter') { icon = '⚪'; hint = "請點擊三角形"; } 
    else if (type === 'centroid') { icon = '⚖️'; hint = "請點擊三角形"; }
    else if (type === 'altitude') { icon = '📐'; hint = "請點擊三角形的「底邊」以作高"; }
    else if (type === 'base_parallel_line') { icon = '◫'; hint = "請點擊三角形的「底邊」以作平行線"; }
	else if (type.startsWith('shared_')) { icon = '🧩'; hint = "請點擊多邊形的一邊以向外產生共邊圖形"; }
	
    btn.innerHTML = `<span class="btn-icon" style="font-size:22px;">${icon}</span><span class="btn-text">尺規作圖</span>`;
    statusText.innerText = hint;
    if (typeof window.showToolTipImmediate === 'function') window.showToolTipImmediate(hint);
}

function getShapeCenter(shape) {
    if (shape.tagName === 'line') {
        return {
            x: (parseFloat(shape.getAttribute('x1')) + parseFloat(shape.getAttribute('x2'))) / 2,
            y: (parseFloat(shape.getAttribute('y1')) + parseFloat(shape.getAttribute('y2'))) / 2
        };
    }
    const bbox = shape.getBBox();
    return {
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2
    };
}

function rotatePoint(x, y, cx, cy, angleDeg) {
    const rad = angleDeg * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - cx;
    const dy = y - cy;
    return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos
    };
}

function getTransformRotation(shape) {
    const transform = shape.getAttribute('transform') || '';
    const match = /rotate\(([-0-9.]+)[, ]+([-0-9.]+)[, ]+([-0-9.]+)\)/.exec(transform);
    if (match) {
        return {
            angle: parseFloat(match[1]),
            cx: parseFloat(match[2]),
            cy: parseFloat(match[3])
        };
    }
    return {
        angle: 0,
        cx: 0,
        cy: 0
    };
}

function moveShape(shape, dx, dy, e) {
	window.lastDx = dx; window.lastDy = dy;
    if (shape.parentNode && selectedElements.includes(shape.parentNode)) {
        return;
    }
    // 【新增】禁止移動座標軸，保持其固定
    if (shape.classList.contains('axes-system')) {
        return;
    }
    if (shape.classList.contains('guide-y-label')) {
        const currentX = parseFloat(shape.getAttribute('x')) || 0;
        shape.setAttribute('x', currentX + dx);
        return; // 直接結束，不再執行任何 Y 軸位移或矩陣運算
    }

    const isLabel = shape.classList.contains('vertex-label') || shape.getAttribute('data-is-label') === 'true';
    const tag = shape.tagName.toLowerCase();
    const tool = shape.getAttribute('data-tool');
	const isShift = e && (e.shiftKey || window.vkShiftActive);

    if (shape.classList.contains('line-chart-point')) {
        const chartGroup = shape.parentNode;
        if (!chartGroup || chartGroup.getAttribute('data-tool') !== 'group') return;
        
        const scaleY = parseFloat(chartGroup.getAttribute('data-scale-y'));
        const originY = parseFloat(chartGroup.getAttribute('data-origin-y'));
        const originX = parseFloat(chartGroup.getAttribute('data-origin-x'));
        const chartW = parseFloat(chartGroup.getAttribute('data-w'));
        if (!scaleY || !originY || isNaN(originX) || isNaN(chartW)) return;

        const circle = shape.querySelector('.point-circle');
        const gX = shape.querySelector('.guide-x');
        const gY = shape.querySelector('.guide-y');
        const txt = shape.querySelector('.point-val');
        const tickX = shape.querySelector('.point-x-tick');
        const lblX = shape.querySelector('.point-x-label');
        const guideYLabel = shape.querySelector('.guide-y-label'); // <--- 新增
        
        let currentCy = parseFloat(circle.getAttribute('cy'));
        let newCy = currentCy + dy;
        if (newCy > originY) newCy = originY; 
        
        let currentCx = parseFloat(circle.getAttribute('cx'));
        let newCx = currentCx + dx;
        if (newCx < originX) newCx = originX; 
        if (newCx > originX + chartW) newCx = originX + chartW; 
        
        circle.setAttribute('cx', newCx);
        circle.setAttribute('cy', newCy);
        if(gX) { gX.setAttribute('x2', newCx); gX.setAttribute('y1', newCy); gX.setAttribute('y2', newCy); }
        if(gY) { gY.setAttribute('x1', newCx); gY.setAttribute('x2', newCx); gY.setAttribute('y2', newCy); }
        if(txt) { txt.setAttribute('x', newCx); txt.setAttribute('y', newCy - 12); }
        if(guideYLabel) { guideYLabel.setAttribute('y', newCy); } // <--- 新增連動
        
        if(tickX) { tickX.setAttribute('x1', newCx); tickX.setAttribute('x2', newCx); }
        if(lblX) { lblX.setAttribute('x', newCx); }
        
        let newVal = Math.round((originY - newCy) / scaleY);
        if(txt) txt.textContent = newVal.toString();
        
        const idx = parseInt(shape.getAttribute('data-index'));
        const polyline = chartGroup.querySelector('.chart-polyline');
        if (polyline) {
            const ptsStr = polyline.getAttribute('points');
            if (ptsStr) {
                const ptsArr = ptsStr.split(' ');
                if (ptsArr[idx]) {
                    ptsArr[idx] = `${newCx},${newCy}`;
                    polyline.setAttribute('points', ptsArr.join(' '));
                }
            }
        }
        
        try {
            let params = JSON.parse(chartGroup.getAttribute('data-params'));
            if (params && params.p_vals) {
                // 【修改】：分割時用逗號，確保空值原樣保留
                const valsArr = (params.p_vals || "").split(/[,，]/).map(s => s.trim());
                valsArr[idx] = newVal;
                params.p_vals = valsArr.join(','); // 寫回時用逗號
                chartGroup.setAttribute('data-params', JSON.stringify(params));
            }
        } catch(err) {}

        return;
    }
    // ===============================================
    //  點吸附功能的完整邏輯 (Point Snapping Logic)
    // ===============================================
    if (tool === 'point' || (tag === 'ellipse' && (shape.getAttribute('rx') < 8 || shape.getAttribute('r') < 8))) {
        if (shape.getAttribute('data-dependency-type') === 'tangent_on_circle_ctrl') {
            const ownerId = shape.getAttribute('data-owner-shape');
            const owner = document.getElementById(ownerId);
            if (owner) {
                const m = owner.getCTM();
                const cx = (parseFloat(owner.getAttribute('cx') || 0)) * m.a + m.e;
                const cy = (parseFloat(owner.getAttribute('cy') || 0)) * m.d + m.f;
                const r = (parseFloat(owner.getAttribute('rx') || owner.getAttribute('r')) || 0) * m.a;
                
                const newX = parseFloat(shape.getAttribute('cx')) + dx;
                const newY = parseFloat(shape.getAttribute('cy')) + dy;
                
                const angle = Math.atan2(newY - cy, newX - cx);
                shape.setAttribute('data-angle', angle); 
                
                shape.setAttribute('cx', cx + r * Math.cos(angle));
                shape.setAttribute('cy', cy + r * Math.sin(angle));
                
                if (typeof updateDependentShapes === 'function') updateDependentShapes(owner);
                return;
            }
        }
        const currentCx = parseFloat(shape.getAttribute('cx'));
        const currentCy = parseFloat(shape.getAttribute('cy'));
        const newX = currentCx + dx;
        const newY = currentCy + dy;
        const ownerId = shape.getAttribute('data-snapped-to');
        
        // --- A. 強制解除吸附 (按住 Shift 或 關閉吸附功能) ---
        if (isShift || !window.isPointSnappingEnabled) {
            if (ownerId) {
                shape.removeAttribute('data-snapped-to');
                shape.removeAttribute('data-snap-t');
                shape.removeAttribute('data-snap-angle');
            }
            shape.setAttribute('cx', newX);
            shape.setAttribute('cy', newY);
            if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);
            return;
        }

        // --- B. 維持鎖定軌道 (如果已經吸附) ---
        if (ownerId) {
            const ownerShape = document.getElementById(ownerId);
            if (ownerShape) {
                const geo = extractGeometry(ownerShape);
                if (geo) {
                    let bestSnap = { dist: Infinity, point: null };

                    geo.segments.forEach(seg => {
                        const proj = getProjectionOnSegment(newX, newY, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
                        const dist = Math.hypot(newX - proj.x, newY - proj.y);
                        if (dist < bestSnap.dist) bestSnap = { dist, point: proj, type: 'line', t: proj.t };
                    });
                    
                    geo.circles.forEach(circ => {
                        const d_x = newX - circ.center.x; const d_y = newY - circ.center.y;
                        const distToCenter = Math.hypot(d_x, d_y);
                        if (distToCenter > 0.1) {
                            const angle = Math.atan2(d_y, d_x);
                            const pointOnCircle = { x: circ.center.x + circ.r * Math.cos(angle), y: circ.center.y + circ.r * Math.sin(angle) };
                            const dist = Math.abs(distToCenter - circ.r);
                            if (dist < bestSnap.dist) bestSnap = { dist, point: pointOnCircle, type: 'circle', angle: angle };
                        }
                    });
                    
                    if (bestSnap.point) {
                        shape.setAttribute('cx', bestSnap.point.x); shape.setAttribute('cy', bestSnap.point.y);
                        if (bestSnap.type === 'line') {
                            shape.setAttribute('data-snap-t', bestSnap.t); shape.removeAttribute('data-snap-angle');
                        } else {
                            shape.setAttribute('data-snap-angle', bestSnap.angle); shape.removeAttribute('data-snap-t');
                        }
                        if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);
                        return; 
                    }
                }
            }
        }

        // --- C. 尋找並初次吸附 (如果尚未吸附) ---
        const snap = findClosestPointOnShapes(newX, newY, 20, shape.id);
        if (snap && snap.shape) {
            // 【修復核心】：確保被吸附的目標擁有 ID，否則系統事後會找不到它
            if (!snap.shape.id) snap.shape.id = 'shape-' + Date.now() + Math.random().toString(36).substr(2, 5);
            
            shape.setAttribute('cx', snap.point.x);
            shape.setAttribute('cy', snap.point.y);
            shape.setAttribute('data-snapped-to', snap.shape.id);
            if (snap.type === 'line') {
                shape.setAttribute('data-snap-t', snap.t); shape.removeAttribute('data-snap-angle');
            } else {
                shape.setAttribute('data-snap-angle', snap.angle); shape.removeAttribute('data-snap-t');
            }
        } else {
            // --- D. 自由移動 ---
            shape.setAttribute('cx', newX);
            shape.setAttribute('cy', newY);
        }
        if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);
        return;
    }
    // ======================================================================
    // 1. 連動檢查：優先權最高
    // ======================================================================
    if (shape.hasAttribute('data-owner-shape') && !isLabel) {
        const ownerId = shape.getAttribute('data-owner-shape');
        const owner = document.getElementById(ownerId);
        
        const depType = shape.getAttribute('data-dependency-type');
        const isAutoUpdated = depType || 
                              shape.hasAttribute('data-construction-type') || 
                              shape.getAttribute('data-tool') === 'tangent' ||
                              (shape.getAttribute('data-sub-tool') || '').includes('-angle');

        if (owner && selectedElements.includes(owner)) {
            if (isAutoUpdated) return; 
        }
    }

    // ======================================================================
    // 2. 移動策略 A: 使用矩陣變換 (Transform Matrix)
    // ======================================================================
    if (shape.getAttribute('transform') || tool === 'group' || tool === 'solid' || (tool === 'line' && tag === 'g')) {
        let matrix;
        const transformList = shape.transform.baseVal;
        
        if (transformList.numberOfItems === 0) {
            const svg = document.querySelector('svg');
            matrix = svg.createSVGMatrix();
        } else {
            transformList.consolidate();
            matrix = transformList.getItem(0).matrix;
        }

        matrix.e += dx;
        matrix.f += dy;

        const a = matrix.a.toFixed(6);
        const b = matrix.b.toFixed(6);
        const c = matrix.c.toFixed(6);
        const d = matrix.d.toFixed(6);
        const eVal = matrix.e.toFixed(6);
        const f = matrix.f.toFixed(6);
        
        shape.setAttribute('transform', `matrix(${a}, ${b}, ${c}, ${d}, ${eVal}, ${f})`);
    } 
    // ======================================================================
    // 3. 移動策略 B: 直接修改座標屬性 (Attribute Manipulation)
    // ======================================================================
    else {
        const get = attr => parseFloat(shape.getAttribute(attr)) || 0;
        const set = (attr, val) => shape.setAttribute(attr, val);

        if (tag === 'text' || tool === 'math' || tag === 'foreignObject' || tag === 'image' || tag === 'rect' || tag === 'use') {
            set('x', get('x') + dx);
            set('y', get('y') + dy);
        } else if (tag === 'line') {
            set('x1', get('x1') + dx);
            set('y1', get('y1') + dy);
            set('x2', get('x2') + dx);
            set('y2', get('y2') + dy);
        } else if (tag === 'circle' || tag === 'ellipse') {
            set('cx', get('cx') + dx);
            set('cy', get('cy') + dy);
        } else if (tag === 'polygon' || tag === 'polyline') {
            const points = shape.getAttribute('points');
            if (points) {
                const newPoints = points.split(/\s+|,/).filter(p => p !== '').reduce((acc, val, i, arr) => {
                    if (i % 2 === 0) {
                        const x = parseFloat(val) + dx;
                        const y = parseFloat(arr[i+1]) + dy;
                        acc.push(`${x},${y}`);
                    }
                    return acc;
                },[]).join(' ');
                shape.setAttribute('points', newPoints);
            }
        } else if (tag === 'path') {
            const d = shape.getAttribute('d');
            const newD = d.replace(/([a-zA-Z])\s*([^a-zA-Z]*)/g, function(match, command, paramsStr) {
                const params = paramsStr.trim().split(/[\s,]+/).filter(s => s !== "").map(parseFloat);
                if (params.length === 0) return match;
                const newParams = [...params];
                const upperCmd = command.toUpperCase();

                if (upperCmd === 'M' || upperCmd === 'L' || upperCmd === 'T' || upperCmd === 'C' || upperCmd === 'Q') {
                    for (let i = 0; i < newParams.length; i += 2) {
                        newParams[i] += dx; newParams[i + 1] += dy;
                    }
                } else if (upperCmd === 'H') {
                    for (let i = 0; i < newParams.length; i++) newParams[i] += dx;
                } else if (upperCmd === 'V') {
                    for (let i = 0; i < newParams.length; i++) newParams[i] += dy;
                } else if (upperCmd === 'A') {
                    if (newParams.length >= 7) { newParams[5] += dx; newParams[6] += dy; }
                }
                return command + " " + newParams.map(n => parseFloat(n.toFixed(2))).join(" ");
            });
            
            if (shape.hasAttribute('data-center-x')) {
                shape.setAttribute('data-center-x', parseFloat(shape.getAttribute('data-center-x')) + dx);
                shape.setAttribute('data-center-y', parseFloat(shape.getAttribute('data-center-y')) + dy);
            }
            shape.setAttribute('d', newD);
        }
    }

    // ======================================================================
    // 4. 後續更新：通知所有依賴此物件的圖形進行重繪
    // ======================================================================
    if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);
    if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
	if (typeof refreshIntersectionAngles === 'function') refreshIntersectionAngles(shape);
    if (typeof window.updateLockVisuals === 'function') {
        window.updateLockVisuals(shape);
    }
}

function getMousePos(evt) {
    const CTM = svgCanvas.getScreenCTM();
    // 移除所有讀取輸入框與鎖定勾選的邏輯，回歸純粹的座標轉換
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
}

function scaleElementFromCenter(el, scale) {
    const tool = el.getAttribute('data-tool');
    const subTool = el.getAttribute('data-sub-tool');

    // 【新增】針對會自動重繪的參數型圖案（積木、統計圖、立體圖等），
    // 使用「修改參數並重繪」的方式來縮放，確保內部的文字絕對不會被拉伸變形。
    if (tool === 'blocks') {
        const oldSize = parseFloat(el.getAttribute('data-block-size')) || 35;
        el.setAttribute('data-block-size', oldSize * scale);
        if (typeof window.redrawSolidBlocks === 'function') window.redrawSolidBlocks(el);
        if (typeof window.updateOrthographicViews === 'function') window.updateOrthographicViews(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }

    if (tool === 'solid') {
        const attrs =['data-w', 'data-h', 'data-d', 'data-dx', 'data-dy', 'data-r'];
        attrs.forEach(attr => {
            if (el.hasAttribute(attr)) {
                el.setAttribute(attr, parseFloat(el.getAttribute(attr)) * scale);
            }
        });
        if (typeof redrawSolid === 'function') redrawSolid(el);
        if (typeof updateDependentShapes === 'function') updateDependentShapes(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }

    if (subTool === 'pie-chart' || subTool === 'venn') {
        const oldR = parseFloat(el.getAttribute('data-radius'));
        el.setAttribute('data-radius', oldR * scale);
        if (subTool === 'pie-chart' && typeof redrawPieChart === 'function') redrawPieChart(el);
        else if (subTool === 'venn' && typeof redrawVennDiagram === 'function') redrawVennDiagram(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }

    if (subTool === 'axis-chart') {
        const oldW = parseFloat(el.getAttribute('data-w')) || 350;
        const oldH = parseFloat(el.getAttribute('data-h')) || 200;
        el.setAttribute('data-w', oldW * scale);
        el.setAttribute('data-h', oldH * scale);
        if (typeof redrawAxisChart === 'function') redrawAxisChart(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }

    if (subTool === 'histogram') {
        try {
            let params = JSON.parse(el.getAttribute('data-params'));
            params.p_width = (parseFloat(params.p_width) || 40) * scale;
            params.p_gap = (parseFloat(params.p_gap) || 15) * scale;
            el.setAttribute('data-params', JSON.stringify(params));
            const oldH = parseFloat(el.getAttribute('data-h')) || 200;
            el.setAttribute('data-h', oldH * scale);
            if (typeof redrawHistogram === 'function') redrawHistogram(el);
            if (selectedElements.includes(el)) drawHandles(el);
        } catch(e) {}
        return;
    }

    if (subTool === 'boxplot') {
        const oldScale = parseFloat(el.getAttribute('data-scale')) || 1;
        el.setAttribute('data-scale', oldScale * scale);
        if (typeof redrawBoxplot === 'function') redrawBoxplot(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }

    if (subTool === 'parabola') {
        const oldA = parseFloat(el.getAttribute('data-a'));
        const oldH = parseFloat(el.getAttribute('data-height'));
        el.setAttribute('data-a', oldA / scale);
        el.setAttribute('data-height', oldH * scale);
        if (typeof redrawParabola === 'function') redrawParabola(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }
    
    if (subTool === 'inequality') {
        const oldLen = parseFloat(el.getAttribute('data-len')) || 150;
        el.setAttribute('data-len', oldLen * scale);
        if (typeof redrawInequality === 'function') redrawInequality(el);
        if (selectedElements.includes(el)) drawHandles(el);
        return;
    }
	
    // 1. 取得物件目前的「全域」變換矩陣
    const ctm = el.getCTM();

    // 2. 取得物件在「局部」座標中的邊界框
    let bbox;
    try {
        bbox = el.getBBox();
    } catch (e) {
        console.error("無法取得 BBox 進行縮放:", el);
        return; 
    }

    // 3. 計算物件的「局部」中心點
    const local_cx = bbox.x + bbox.width / 2;
    const local_cy = bbox.y + bbox.height / 2;

    // 4. 將局部中心點轉換為「全域」螢幕座標
    const svg = el.ownerSVGElement;
    let pt = svg.createSVGPoint();
    pt.x = local_cx;
    pt.y = local_cy;
    const global_center = pt.matrixTransform(ctm);
    const global_cx = global_center.x;
    const global_cy = global_center.y;

    // 5. 建立一個圍繞「全域中心點」進行縮放的新變換矩陣
    const scaleMatrix = svg.createSVGMatrix()
        .translate(global_cx, global_cy)
        .scale(scale)
        .translate(-global_cx, -global_cy);

    // 6. 取得物件自身的 transform 屬性矩陣
    let currentMatrix;
    if (el.transform.baseVal.numberOfItems > 0) {
        el.transform.baseVal.consolidate(); // 將所有 transform 合併為一個矩陣
        currentMatrix = el.transform.baseVal.getItem(0).matrix;
    } else {
        currentMatrix = svg.createSVGMatrix(); // 如果沒有 transform，則為單位矩陣
    }

    // 7. 將新的縮放變換「前乘」到現有變換上
    // 數學意義： C_new = S * C_old
    // 這會先應用物件原本的移動/旋轉，然後再對結果進行置中縮放
    const newMatrix = scaleMatrix.multiply(currentMatrix);

    // 8. 將計算後的新矩陣設定回物件的 transform 屬性
    const a = newMatrix.a.toFixed(6);
    const b = newMatrix.b.toFixed(6);
    const c = newMatrix.c.toFixed(6);
    const d = newMatrix.d.toFixed(6);
    const e_val = newMatrix.e.toFixed(6);
    const f = newMatrix.f.toFixed(6);
    el.setAttribute('transform', `matrix(${a}, ${b}, ${c}, ${d}, ${e_val}, ${f})`);
    if (el.id) {
        const fills = document.querySelectorAll(`[data-owner-shape="${el.id}"][data-dependency-type="smart_fill"]`);
        fills.forEach(fill => {
            let currentMatrix;
            if (fill.transform && fill.transform.baseVal.numberOfItems > 0) {
                fill.transform.baseVal.consolidate();
                currentMatrix = fill.transform.baseVal.getItem(0).matrix;
            } else {
                currentMatrix = el.ownerSVGElement.createSVGMatrix();
            }
            // 套用與主圖完全相同的縮放矩陣
            const fM = scaleMatrix.multiply(currentMatrix);
            fill.setAttribute('transform', `matrix(${fM.a.toFixed(6)}, ${fM.b.toFixed(6)}, ${fM.c.toFixed(6)}, ${fM.d.toFixed(6)}, ${fM.e.toFixed(6)}, ${fM.f.toFixed(6)})`);
        });
    }
    // 如果縮放的是圓形，更新依賴的圓形角 (需要更新 vertex-data 的位置)
    if (el.getAttribute('data-tool') === 'ellipse' || el.getAttribute('data-sub-tool') === 'circle') {
        const circleAngles = document.querySelectorAll(`.shape[data-owner-circle-id="${el.id}"]`);
        circleAngles.forEach(group => {
            // 根據縮放比例，調整隱藏點相對於圓心的位置
            const dataNodes = group.querySelectorAll('.vertex-data');
            const gc = global_center; // 圓心 (全域)
            
            dataNodes.forEach(pt => {
                const px = parseFloat(pt.getAttribute('cx'));
                const py = parseFloat(pt.getAttribute('cy'));
                
                // 向量計算：新位置 = 圓心 + (舊位置 - 圓心) * 縮放比例
                const dx = px - gc.x;
                const dy = py - gc.y;
                
                const newX = gc.x + dx * scale;
                const newY = gc.y + dy * scale;
                
                pt.setAttribute('cx', newX);
                pt.setAttribute('cy', newY);
            });
            
            // 重繪圓形角幾何圖形
            if (typeof redrawCircleAngle === 'function') redrawCircleAngle(group);
            
            // 【關鍵】更新依附在圓形角上的標籤 (A, B, C)
            if (typeof updateLabelPositions === 'function') updateLabelPositions(group);
            
            // 【關鍵】更新圓形角上的角度標註 (紅色弧線)
            const childMarks = document.querySelectorAll(`[data-owner-angle-shape="${group.id}"]`);
            childMarks.forEach(m => m.remove()); // 先刪除舊的
            if (typeof generateAngleLabels === 'function') {
                generateAngleLabels(group, true); // 重新產生新的
            }
        });
    }
	
    // 更新關聯的標籤位置
    if (typeof updateLabelPositions === 'function') {
        updateLabelPositions(el);
    }
	
    if (el.getAttribute('data-tool') === 'ellipse' || el.getAttribute('data-sub-tool') === 'circle') {
        const circleAngles = document.querySelectorAll(`.shape[data-owner-circle-id="${el.id}"]`);
        circleAngles.forEach(group => {
            // 圓形角需要特殊的縮放邏輯：
            // 角的頂點需要沿著圓心方向縮放
            const m = el.getCTM(); // 圓的新矩陣
            const cx = parseFloat(el.getAttribute('cx') || 0) * m.a + m.e;
            const cy = parseFloat(el.getAttribute('cy') || 0) * m.d + m.f;
            
            const dataNodes = group.querySelectorAll('.vertex-data');
            dataNodes.forEach(pt => {
                const px = parseFloat(pt.getAttribute('cx'));
                const py = parseFloat(pt.getAttribute('cy'));
                
                // 計算向量並縮放
                const dx = px - cx;
                const dy = py - cy;
                
                // 這裡有點複雜，因為 scale 是增量。
                // 簡單做法：直接對這個 group 也做同樣的 scaleElementFromCenter
                // 但這樣線條會變粗。
                
                // 更好的做法：更新 vertex-data 的座標
                // 因為我們知道縮放中心是 cx, cy，比例是 scale
                // 新位置 = Center + (Old - Center) * scale
                const newX = cx + (dx * scale);
                const newY = cy + (dy * scale);
                
                pt.setAttribute('cx', newX);
                pt.setAttribute('cy', newY);
            });
            
            // 重繪連線
            if (typeof redrawCircleAngle === 'function') redrawCircleAngle(group);
        });
    }
    
    // 2. 如果縮放的是三角形，更新外心/內心
    if (el.getAttribute('data-tool') === 'polygon' || el.getAttribute('data-tool') === 'tri') {
        updateDependentShapes(el);
    }	
}

function alignSelected(type) {
    if (selectedElements.length === 0) return; // 沒選物件直接返回

    // 取得「相對畫布」勾選狀態
    const alignToCanvas = document.getElementById('chk-align-canvas') && document.getElementById('chk-align-canvas').checked;

    // 畫布尺寸
    const svg = document.getElementById('svg-canvas');
    const canvasW = parseFloat(svg.getAttribute('width')) || 800;
    const canvasH = parseFloat(svg.getAttribute('height')) || 600;

    // 取得每個物件的邊界
    const bounds = selectedElements.map(el => {
        const bbox = el.getBBox();
        let tx = 0, ty = 0;
        
        // 【核心修復】改進變形讀取邏輯
        // 優先讀取 DOM 矩陣物件，這能同時支援 translate 與 matrix
        if (el.transform && el.transform.baseVal.numberOfItems > 0) {
            // 合併所有變形為單一矩陣
            const m = el.transform.baseVal.consolidate().matrix;
            tx = m.e; // X 平移量
            ty = m.f; // Y 平移量
        } else {
            // 備援：解析字串 (針對舊版或特殊狀況)
            const t = el.getAttribute('transform') || '';
            if (t.includes('matrix')) {
                // 解析 matrix(a, b, c, d, e, f)
                const m = /matrix\(([^)]+)\)/.exec(t);
                if (m) {
                    const v = m[1].split(/[,\s]+/).map(parseFloat);
                    tx = v[4]; ty = v[5];
                }
            } else if (t.includes('translate')) {
                // 解析 translate(x, y)
                const m = /translate\(([-0-9.]+)[, ]*([-0-9.]*)\)/.exec(t);
                if (m) { tx = parseFloat(m[1]); ty = parseFloat(m[2] || 0); }
            }
        }
        
        return {
            el: el,
            x: bbox.x + tx,
            y: bbox.y + ty,
            w: bbox.width,
            h: bbox.height,
            cx: bbox.x + tx + bbox.width / 2,
            cy: bbox.y + ty + bbox.height / 2
        };
    });

    let targetVal = 0;

    if (alignToCanvas) {
        // --- 模式 A: 相對於畫布 ---
        if (type === 'left') targetVal = 0;
        if (type === 'right') targetVal = canvasW;
        if (type === 'top') targetVal = 0;
        if (type === 'bottom') targetVal = canvasH;
        if (type === 'center-x') targetVal = canvasW / 2;
        if (type === 'center-y') targetVal = canvasH / 2;

        // 均分功能在相對畫布模式下，通常定義為「在畫布範圍內均分」
        if (type === 'dist-h') {
            if (bounds.length < 2) return;
            bounds.sort((a, b) => a.cx - b.cx);
            // 將物件平均散佈在 0 到 canvasW 之間
            // 策略：最左邊一個貼左，最右邊一個貼右 (或保留邊距)，中間均分
            // 這裡採用簡單策略：將所有物件中心點均分在畫布寬度上
            const step = canvasW / (bounds.length + 1);
            bounds.forEach((b, i) => {
                const newCx = step * (i + 1);
                moveShape(b.el, newCx - b.cx, 0);
            });
            saveState();
            if (selectedElements.length === 1) drawHandles(selectedElements[0]);
            return;
        }
        if (type === 'dist-v') {
            if (bounds.length < 2) return;
            bounds.sort((a, b) => a.cy - b.cy);
            const step = canvasH / (bounds.length + 1);
            bounds.forEach((b, i) => {
                const newCy = step * (i + 1);
                moveShape(b.el, 0, newCy - b.cy);
            });
            saveState();
            if (selectedElements.length === 1) drawHandles(selectedElements[0]);
            return;
        }

        // 執行對齊
        bounds.forEach(b => {
            let dx = 0, dy = 0;
            if (type === 'left') dx = targetVal - b.x;
            else if (type === 'right') dx = targetVal - (b.x + b.w);
            else if (type === 'top') dy = targetVal - b.y;
            else if (type === 'bottom') dy = targetVal - (b.y + b.h);
            else if (type === 'center-x') dx = targetVal - b.cx;
            else if (type === 'center-y') dy = targetVal - b.cy;
            moveShape(b.el, dx, dy);
        });

    } else {
        // --- 模式 B: 相對於選取物件 (原有的邏輯) ---
        if (selectedElements.length < 2) return; // 原有邏輯需要至少2個物件

        if (type === 'left') targetVal = Math.min(...bounds.map(b => b.x));
        if (type === 'right') targetVal = Math.max(...bounds.map(b => b.x + b.w));
        if (type === 'top') targetVal = Math.min(...bounds.map(b => b.y));
        if (type === 'bottom') targetVal = Math.max(...bounds.map(b => b.y + b.h));
        if (type === 'center-x') {
            const minX = Math.min(...bounds.map(b => b.x));
            const maxX = Math.max(...bounds.map(b => b.x + b.w));
            targetVal = (minX + maxX) / 2;
        }
        if (type === 'center-y') {
            const minY = Math.min(...bounds.map(b => b.y));
            const maxY = Math.max(...bounds.map(b => b.y + b.h));
            targetVal = (minY + maxY) / 2;
        }

        if (type.startsWith('dist')) {
            if (type === 'dist-h') {
                bounds.sort((a, b) => a.cx - b.cx);
                const totalW = bounds[bounds.length - 1].cx - bounds[0].cx;
                const step = totalW / (bounds.length - 1);
                bounds.forEach((b, i) => {
                    const newCx = bounds[0].cx + i * step;
                    moveShape(b.el, newCx - b.cx, 0);
                });
            }
            if (type === 'dist-v') {
                bounds.sort((a, b) => a.cy - b.cy);
                const totalH = bounds[bounds.length - 1].cy - bounds[0].cy;
                const step = totalH / (bounds.length - 1);
                bounds.forEach((b, i) => {
                    const newCy = bounds[0].cy + i * step;
                    moveShape(b.el, 0, newCy - b.cy);
                });
            }
        } else {
            bounds.forEach(b => {
                let dx = 0, dy = 0;
                if (type === 'left') dx = targetVal - b.x;
                else if (type === 'right') dx = targetVal - (b.x + b.w);
                else if (type === 'top') dy = targetVal - b.y;
                else if (type === 'bottom') dy = targetVal - (b.y + b.h);
                else if (type === 'center-x') dx = targetVal - b.cx;
                else if (type === 'center-y') dy = targetVal - b.cy;
                moveShape(b.el, dx, dy);
            });
        }
    }

    saveState();
    if (selectedElements.length === 1) drawHandles(selectedElements[0]);
}

function rotateFixed(e, step) {
    if (e) e.preventDefault();
    if (selectedElements.length === 0) {
        statusText.innerText = "請先選取要旋轉的物件";
        return;
    }

    const rotationDisplay = document.getElementById('rotation-display');
    
    // 【核心設定】旋轉速度：每毫秒轉幾度 (0.36 deg/ms 約等於 90度/250ms)
    const ROTATION_SPEED = 0.2; 

    let completedCount = 0;

    selectedElements.forEach(shape => {
        let currentAbs = getTrueRotation(shape); 
        let currentCCW = ((-currentAbs % 360) + 360) % 360;
        
        let targetCCW = 0;
        if (step === 0 || (e && e.button === 2)) {
            targetCCW = 0;
        } else {
            let snapped = Math.round(currentCCW / 90) * 90;
            targetCCW = (snapped + 90) % 360;
        }

        let startAnim = currentCCW;
        let endAnim = targetCCW;
        if (endAnim === 0 && startAnim > 0) endAnim = 360;

        // 【核心修改】動態計算時間：距離 / 速度 = 時間
        const distance = Math.abs(endAnim - startAnim);
        // 設定最小時間 100ms，避免距離太短瞬間閃爍
        const duration = Math.max(100, distance / ROTATION_SPEED);

        const startTime = performance.now();
        
        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用 Ease-Out 讓停止時有緩衝感
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const intermediateAngle = startAnim + (endAnim - startAnim) * easeProgress;
            
            applyAbsoluteRotation(shape, -intermediateAngle);
            
            if (rotationDisplay) {
                rotationDisplay.innerText = `${Math.round(intermediateAngle % 360)}°`;
            }

            if (selectedElements.length === 1) {
                drawHandles(selectedElements[0]);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                applyAbsoluteRotation(shape, -targetCCW);
                if (rotationDisplay) rotationDisplay.innerText = `${targetCCW}°`;
                
                if (selectedElements.length === 1) {
                    drawHandles(selectedElements[0]);
                }

                completedCount++;
                if (completedCount === selectedElements.length) {
                    saveState();
                    statusText.innerText = `已旋轉至 ${targetCCW}° (耗時 ${(duration/1000).toFixed(2)}秒)`;
                }
            }
        }

        requestAnimationFrame(animate);
    });
}

function rotateSpecific() {
    const input = document.getElementById('input-angle-custom');
    const val = parseFloat(input.value);
    
    if (isNaN(val)) {
        showAlert("請輸入有效的角度數字");
        return;
    }
    if (selectedElements.length === 0) {
        statusText.innerText = "請先選取要旋轉的物件";
        return;
    }

    // 【核心設定】旋轉速度 (手動輸入時稍微慢一點點，讓使用者看清楚變化軌跡)
    const ROTATION_SPEED = 0.2; 
    let completedCount = 0;
    const targetAngleCCW = val; 

    selectedElements.forEach(shape => {
        let currentAbs = getTrueRotation(shape); 
        let startAngleCCW = ((-currentAbs % 360) + 360) % 360;
        
        const startAnim = startAngleCCW;
        const endAnim = targetAngleCCW;

        // 【核心修改】動態計算時間：距離 / 速度 = 時間
        const distance = Math.abs(endAnim - startAnim);
        // 如果距離為 0 (沒變)，至少跑 10ms 走完流程，避免 bug
        const duration = Math.max(10, distance / ROTATION_SPEED);

        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const intermediateAngle = startAnim + (endAnim - startAnim) * easeProgress;
            
            applyAbsoluteRotation(shape, -intermediateAngle);
            
            if (selectedElements.length === 1) {
                drawHandles(selectedElements[0]);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                applyAbsoluteRotation(shape, -endAnim);
                if (selectedElements.length === 1) {
                    drawHandles(selectedElements[0]);
                }

                completedCount++;
                if (completedCount === selectedElements.length) {
                    saveState();
                    statusText.innerText = `已設定角度為 ${targetAngleCCW}° (耗時 ${(duration/1000).toFixed(2)}秒)`;
                }
            }
        }

        requestAnimationFrame(animate);
    });
}

function applyAbsoluteRotation(shape, targetAngleDeg) {
    // 1. 連動檢查：如果試圖旋轉依附物件，改為旋轉其宿主
    if (shape.hasAttribute('data-owner-shape')) {
        const ownerId = shape.getAttribute('data-owner-shape');
        const owner = document.getElementById(ownerId);
        if (owner) {
            applyAbsoluteRotation(owner, targetAngleDeg);
            return; 
        }
    }

    // --- 2. 核心修正：計算精確的視覺中心點 (與控制點旋轉相同的矩陣邏輯) ---
    const svgCanvas = document.getElementById('svg-canvas');
    const tool = shape.getAttribute('data-tool');
    const parent = shape.parentNode;
    
    // 取得相對於父層的局部變換矩陣
    let M_local;
    try {
        const M_parent = parent.getCTM();
        const M_global = shape.getCTM();
        M_local = M_parent.inverse().multiply(M_global);
    } catch(e) {
        // 例外備援：直接讀取元素的 transform 屬性
        if (shape.transform && shape.transform.baseVal.numberOfItems > 0) {
            shape.transform.baseVal.consolidate();
            M_local = shape.transform.baseVal.getItem(0).matrix;
        } else {
            M_local = svgCanvas.createSVGMatrix();
        }
    }

    // 取得局部未變形的幾何中心
    let localCenter;
    if (tool === 'group' || tool === 'text' || tool === 'math' || tool === 'solid') {
        let bbox;
        try { bbox = shape.getBBox(); } catch(e) { bbox = { x: 0, y: 0, width: 0, height: 0 }; }
        localCenter = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    } else {
        localCenter = getShapeCenter(shape);
    }

    // 將局部中心點透過矩陣轉換為當前的「全域視覺中心點」
    let p = svgCanvas.createSVGPoint();
    p.x = localCenter.x; 
    p.y = localCenter.y;
    p = p.matrixTransform(M_local);
    const cx = p.x; 
    const cy = p.y;

    // --- 3. 計算角度差並套用矩陣旋轉 ---
    const currentAngle = getTrueRotation(shape);
    const delta = targetAngleDeg - currentAngle;
    
    // 為了讓動畫平滑，我們不阻擋微小的 delta (移除 < 0.01 的限制，交由動畫系統控制)

    // 建立新的旋轉矩陣：移至中心 -> 旋轉 -> 移回原位
    const rotMatrix = svgCanvas.createSVGMatrix().translate(cx, cy).rotate(delta).translate(-cx, -cy);
    // 將旋轉矩陣「前乘」到現有的變換矩陣上
    const newMatrix = rotMatrix.multiply(M_local);

    const a = newMatrix.a.toFixed(6); const b = newMatrix.b.toFixed(6);
    const c = newMatrix.c.toFixed(6); const d = newMatrix.d.toFixed(6);
    const e_val = newMatrix.e.toFixed(6); const f = newMatrix.f.toFixed(6);
    shape.setAttribute('transform', `matrix(${a}, ${b}, ${c}, ${d}, ${e_val}, ${f})`);
    if (shape.id) {
        const fills = document.querySelectorAll(`[data-owner-shape="${shape.id}"][data-dependency-type="smart_fill"]`);
        fills.forEach(fill => {
            let fillLocal;
            if (fill.transform && fill.transform.baseVal.numberOfItems > 0) {
                fill.transform.baseVal.consolidate();
                fillLocal = fill.transform.baseVal.getItem(0).matrix;
            } else {
                fillLocal = svgCanvas.createSVGMatrix();
            }
            // 套用與主圖完全相同的旋轉矩陣
            const fM = rotMatrix.multiply(fillLocal);
            fill.setAttribute('transform', `matrix(${fM.a.toFixed(6)}, ${fM.b.toFixed(6)}, ${fM.c.toFixed(6)}, ${fM.d.toFixed(6)}, ${fM.e.toFixed(6)}, ${fM.f.toFixed(6)})`);
        });
    }
    // --- 4. 延遲更新連動物件 ---
    setTimeout(() => {
        if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
    }, 0);
}

function getTrueRotation(shape) {
    // 優先從標準的 SVG DOM 屬性中提取矩陣並計算角度
    if (shape.transform && shape.transform.baseVal.numberOfItems > 0) {
        shape.transform.baseVal.consolidate();
        const matrix = shape.transform.baseVal.getItem(0).matrix;
        let angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        // 檢查行列式是否小於 0 (處理鏡像翻轉的情況)
        const det = matrix.a * matrix.d - matrix.b * matrix.c;
        if (det < 0) {
            angle += 180;
        }
        return angle;
    }
    
    // 備援：解析 transform 字串
    const transform = shape.getAttribute('transform') || '';
    const matchM = /matrix\(([^)]+)\)/.exec(transform);
    if (matchM) {
        const vals = matchM[1].split(/[\s,]+/).map(parseFloat);
        let angle = Math.atan2(vals[1], vals[0]) * (180 / Math.PI);
        const det = vals[0] * vals[3] - vals[1] * vals[2];
        if (det < 0) angle += 180;
        return angle;
    }
    const matchR = /rotate\(([-0-9.]+)/.exec(transform);
    if (matchR) {
        return parseFloat(matchR[1]);
    }
    return 0;
}

// 1. 🆕 新增：圓形角度選單的開關函式
function toggleCircleAngleMenu() {
    const menu = document.getElementById('menu-circle-angles');
    const btnWrapper = document.getElementById('btn-circle-angles').parentNode;
    const isVisible = (menu.style.display === 'flex');
    
    closeAllMenus();
    
    if (!isVisible) {
        fixMenuPosition('menu-circle-angles', btnWrapper);
    }
}

// 2. 🆕 新增：切換到指定的圓形角度作圖模式
function toggleCircleAngleMode(type) {
    const btn = document.getElementById('btn-circle-angles');
    
    if (mode === 'construct' && constructionModeType === type) {
        setMode('select');
        return;
    }
    closeAllMenus();
    
    // 0 步驟觸發：如果已經選取物件，直接呼叫 autoApplyConstruction 處理
    if (selectedElements.length > 0) {
        constructionModeType = type;
        const target = selectedElements[0];
        autoApplyConstruction(target, 0, 0); // 圓形角不需要滑鼠座標
        return; // 完成後直接結束
    }

    // --- 新增：如果有定錨點，直接在該位置嘗試建立 ---
    if (window.anchorPoint) {
        constructionModeType = type;
        autoApplyConstruction(null, window.anchorPoint.x, window.anchorPoint.y);
        window.clearAnchorPoint();
        return;
    }

    mode = 'construct';
    constructionModeType = type;
    constructionStep = 0; 
    
    deselectAll();

    document.querySelectorAll('.tool-btn').forEach(b => {
        if (['btn-toggle-grid', 'btn-snap-intersection', 'btn-snap-point', 'btn-real-grid', 'btn-lock-geom'].includes(b.id)) return;
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    let hint = "";
    if (type === 'central') hint = "請點擊圓形以產生圓心角";
    else if (type === 'inscribed') hint = "請點擊圓形以產生圓周角"; 
    else if (type === 'tangent-chord') hint = "請點擊圓形以產生弦切角";
    
    statusText.innerText = hint;
    if (typeof window.showToolTipImmediate === 'function') window.showToolTipImmediate(hint);
}

// 3. 🛠️ 修改：將新選單加入 closeAllMenus
window.closeAllMenus = function() {
    // 【新增】'more-actions-menu-lib' 和 'more-actions-menu-qb'
    const ids =[
        'menu-align', 'menu-construct', 'menu-stroke-width', 
        'menu-mark-smart', 'menu-circle-angles', 'menu-lock-geom',
        'menu-shared-edge', /* 新增共邊圖形選單 */
        'more-actions-menu-lib', 'more-actions-menu-qb' 
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
};
// 為了相容性，同時保留全域無 window 的宣告
function closeAllMenus() {
    window.closeAllMenus();
}


// 4. 🛠️ 修改：將新按鈕加入 resetToolIcons (非必要，但為了完整性)
function resetToolIcons() {
    if (defaultToolIcons.construct) {
        document.getElementById('btn-construct').innerHTML = defaultToolIcons.construct;
    }
    if (defaultToolIcons.edge) {
        document.getElementById('btn-mark-edge').innerHTML = defaultToolIcons.edge;
    }
    if (defaultToolIcons.angle) {
        document.getElementById('btn-mark-angle').innerHTML = defaultToolIcons.angle;
    }
    // 🆕 新增：如果未來要改變圓形角度圖示，可以在這裡重置
    // const btnCircle = document.getElementById('btn-circle-angles');
    // if (btnCircle && defaultToolIcons.circle) btnCircle.innerHTML = defaultToolIcons.circle;
}

function toggleIntersectionSnapping() {
    const btn = document.getElementById('btn-snap-intersection');
    
    // 切換開關
    isIntersectionSnappingEnabled = !isIntersectionSnappingEnabled;
    
    if (isIntersectionSnappingEnabled) {
        btn.classList.add('active'); // 變藍色背景
        statusText.innerText = "交點吸附模式：已開啟";
    } else {
        btn.classList.remove('active'); // 變回白色背景
        statusText.innerText = "交點吸附模式：已關閉";
        hideSnapIndicator(); // 關閉時立即隱藏紅點
    }
}


/**
 * 【輔助函式 1/2】 - 渲染「拉桿式」智慧函數的控制面板 (教學用)
 * 這是您原有的邏輯，保持不變。
 */
function renderSliderControls(content, shape, params) {
    const type = shape.getAttribute('data-smart-type');
    const isSnapped = shape.getAttribute('data-snap') === 'true';
    const showFocus = shape.getAttribute('data-show-focus') === 'true';

    // --- 頂部工具列 (Checkbox) ---
    const toolsRow = document.createElement('div');
    toolsRow.style.cssText = "display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #eee;";
    
    const snapLabel = document.createElement('label');
    snapLabel.style.fontSize = "12px";
    snapLabel.style.cursor = "pointer";
    snapLabel.innerHTML = `<input type="checkbox" id="chk-snap" ${isSnapped ? 'checked' : ''}> 吸附整數`;
    toolsRow.appendChild(snapLabel);

    if (type === 'quadratic') {
        const focusLabel = document.createElement('label');
        focusLabel.style.fontSize = "12px";
        focusLabel.style.cursor = "pointer";
        focusLabel.innerHTML = `<input type="checkbox" id="chk-focus" ${showFocus ? 'checked' : ''}> 焦點/準線`;
        toolsRow.appendChild(focusLabel);
        
        focusLabel.querySelector('input').addEventListener('change', (e) => {
            shape.setAttribute('data-show-focus', e.target.checked);
            updateSmartFunctionGraph(shape); // 注意：這是舊版的更新函式
            saveState();
        });
    }
    content.appendChild(toolsRow);

    snapLabel.querySelector('input').addEventListener('change', (e) => {
        const snapped = e.target.checked;
        shape.setAttribute('data-snap', snapped);
        
        if (snapped) {
            for (let key in params) {
                params[key] = Math.round(params[key]);
            }
            shape.setAttribute('data-params', JSON.stringify(params));
            updateSmartFunctionGraph(shape); // 舊版更新
        }
        renderPropertyPanel(shape); // 重繪面板以更新 step
    });

    // --- 拉桿控制項 ---
    let controls = [];
    const stepVal = isSnapped ? 1 : 0.1;

    if (type === 'linear') {
        controls =[
            { key: 'a', label: '斜率 a =', min: -5, max: 5, step: stepVal, color: '#e74c3c' },
            { key: 'b', label: '截距 b =', min: -10, max: 10, step: isSnapped ? 1 : 0.5, color: '#2980b9' }
        ];
    } else if (type === 'quadratic') {
        controls =[
            { key: 'a', label: '開口 a = ', min: -3, max: 3, step: stepVal, color: '#e74c3c' },
            { key: 'h', label: '水平 h = ', min: -10, max: 10, step: isSnapped ? 1 : 0.5, color: '#2980b9' },
            { key: 'k', label: '垂直 k = ', min: -10, max: 10, step: isSnapped ? 1 : 0.5, color: '#27ae60' }
        ];
    }

    controls.forEach(ctrl => {
        const wrapper = document.createElement('div');
        wrapper.className = 'param-row';
        
        const header = document.createElement('div');
        header.className = 'param-header';
        header.innerHTML = `<span style="color:${ctrl.color}">${ctrl.label}</span><span id="val-${ctrl.key}" style="color:${ctrl.color}">${params[ctrl.key]}</span>`;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'param-slider';
        slider.min = ctrl.min;
        slider.max = ctrl.max;
        slider.step = ctrl.step;
        slider.value = params[ctrl.key];
        slider.style.accentColor = ctrl.color; 

        slider.oninput = (e) => {
            const newVal = parseFloat(e.target.value);
            document.getElementById(`val-${ctrl.key}`).innerText = newVal;
            params[ctrl.key] = newVal;
            shape.setAttribute('data-params', JSON.stringify(params));
            updateSmartFunctionGraph(shape); // 舊版更新
        };
        slider.onchange = () => saveState();

        wrapper.appendChild(header);
        wrapper.appendChild(slider);
        content.appendChild(wrapper);
    });

    const plotBtnContainer = document.createElement('div');
    plotBtnContainer.style.cssText = "margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;";

    const plotBtn = document.createElement('button');
    plotBtn.innerHTML = "📍 標示點位";
    plotBtn.className = "tool-btn btn-labeled";
    plotBtn.style.width = "100%";
    plotBtn.title = "在函數圖形上標示一個 (x, y) 座標點";

    plotBtn.onclick = () => {
        openNumberInputModal("請輸入 X 值", "1", (val) => {
            const xValue = parseFloat(val);
            if (!isNaN(xValue)) {
                if (typeof plotPointOnFunction === 'function') {
                    plotPointOnFunction(shape, xValue);
                }
            } else {
                showAlert("請輸入有效的數字！");
            }
        });
    };

    plotBtnContainer.appendChild(plotBtn);
    content.appendChild(plotBtnContainer);	
}

/**
 * 輔助函式：產生用於「標準式」的係數輸入介面
 * @param {HTMLElement} content - 要填入內容的容器元素
 * @param {SVGElement} shape - 當前選中的智慧函數圖形
 * @param {object} params - 函數的參數物件
 */
function renderCoefficientInputs(content, shape, params) {
    const type = shape.getAttribute('data-smart-type');

    // --- 1. 頂部顯示函數形式 ---
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = "text-align:center; padding:5px; border-bottom:1px solid #ddd; margin-bottom:10px; background:#f4f6f7;";
    let formulaTitle = "";
    if (type === 'linear_std') formulaTitle = "y = ax + b";
    else if (type === 'quadratic_std') formulaTitle = "y = ax² + bx + c";
    else if (type === 'inverse_std') formulaTitle = "y = k / x";
    headerDiv.innerHTML = `<div style="font-family:'Times New Roman'; font-weight:bold; font-size:16px; color:#2c3e50;">${formulaTitle}</div>`;
    content.appendChild(headerDiv);
    
    // --- 2. 建立係數輸入框 ---
    const createControl = (key, label) => {
        const row = document.createElement('div');
        row.className = 'param-row';
        row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;';
        
        row.innerHTML = `<label style="font-family:'Times New Roman'; font-weight:bold; font-size:16px; width:40px;">${label} =</label>`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = params[key];
        input.step = '0.1';
        input.style.cssText = 'width:120px; padding:4px; border:1px solid #ccc; border-radius:4px; text-align:right; font-size:14px;';
        
        input.oninput = (e) => {
            params[key] = parseFloat(e.target.value) || 0;
            shape.setAttribute('data-params', JSON.stringify(params));
            updateSmartFunctionGraph(shape);
        };
        input.onchange = () => saveState();

        row.appendChild(input);
        content.appendChild(row);
    };

    if (type === 'linear_std') {
        createControl('a', 'a');
        createControl('b', 'b');
    } else if (type === 'quadratic_std') {
        createControl('a', 'a');
        createControl('b', 'b');
        createControl('c', 'c');
    } else if (type === 'inverse_std') {
        createControl('k', 'k');
    }
}

/**
 * 【主函式/分派器】 - 決定渲染哪種面板
 * 請用這段程式碼完整替換舊的 renderPropertyPanel
 */
function renderPropertyPanel(shape) {
    const panel = document.getElementById('smart-panel');
    const content = document.getElementById('smart-panel-content');
    
    const isOldSmart = shape && shape.hasAttribute('data-smart-type');
    const isNewStd = shape && shape.getAttribute('data-func-mode') === 'standard';

    if (!isOldSmart && !isNewStd) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'flex';
    content.innerHTML = ''; 

    const params = JSON.parse(shape.getAttribute('data-params'));

    // --- 核心分派邏輯 ---
    if (isOldSmart) {
        // 呼叫舊的拉桿面板產生器
        renderSliderControls(content, shape, params);
    } 
    else if (isNewStd) {
        // 呼叫新的係數面板產生器
        renderStandardFuncPanel(content, shape, params);
    }

    // --- 底部共同的「完成編輯」按鈕 ---
    const footer = document.createElement('div');
    footer.style.cssText = "margin-top:15px; text-align:center; border-top:1px solid #eee; padding-top:10px;";
    
    const finishBtn = document.createElement('button');
    finishBtn.innerText = "✔ 完成編輯\n (轉為靜態物件)";
    finishBtn.className = "btn-confirm";
    finishBtn.style.cssText = "width:100%; padding:8px; font-size:13px;";
    
    finishBtn.onclick = () => {
		const confirmMsg = `
			確定完成編輯？<br>這將移除參數面板，並將函數轉為正式寫法。<br><br>
			<label style="cursor:pointer; color:#2980b9; font-size: 14px;">
				<input type="checkbox" id="chk-finalize-keep-grid"> 保留座標格線
			</label>
		`;

		showConfirm(confirmMsg, () => {
			// 取得勾選狀態
			const keepGrid = document.getElementById('chk-finalize-keep-grid').checked;
			
			// 呼叫轉換函式並傳入參數
			finalizeSmartGraph(shape, keepGrid); 
			panel.style.display = 'none';
		}, null, "確認");
    };
    
    footer.appendChild(finishBtn);
    content.appendChild(footer);
}

// 1. 專為標準函數設計的係數面板
function renderStandardFuncPanel(content, shape, params) {
    const type = shape.getAttribute('data-func-type');
    const config = STD_FUNCTIONS[type];
    
    // 標題
    const header = document.createElement('div');
    header.style.cssText = "text-align:center; padding:5px; background:#eee; font-weight:bold; color:#333; margin-bottom:10px;";
    header.innerText = config ? config.name : "函數係數設定";
    content.appendChild(header);

    // 產生輸入框
    for (let key in params) {
        const row = document.createElement('div');
        row.className = 'param-row';
        row.style.cssText = "display:flex; justify-content: flex-end; align-items:center; margin-bottom:8px; gap: 5px;";
        
        row.innerHTML = `<label style="font-family:'Times New Roman'; font-weight:bold; font-size:14px;">${key} = </label>`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = params[key];
        input.step = 0.1;
        // 關鍵：寬度縮小，文字置中
        input.style.cssText = "width:60px; padding:3px; text-align:center; border: 1px solid #ccc; border-radius: 4px; font-size:14px;";

        input.oninput = (e) => {
            params[key] = parseFloat(e.target.value) || 0;
            shape.setAttribute('data-params', JSON.stringify(params));
            updateStandardFunctionGraph(shape); // 即時更新圖形與標籤
        };
        input.onchange = () => saveState();

        row.appendChild(input);
        content.appendChild(row);
    }
    const plotBtnContainer = document.createElement('div');
    plotBtnContainer.style.cssText = "margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;";

    const plotBtn = document.createElement('button');
    plotBtn.innerHTML = "📍 標示點位";
    plotBtn.className = "tool-btn btn-labeled";
    plotBtn.style.width = "100%";
    plotBtn.title = "在函數圖形上標示一個 (x, y) 座標點";

    plotBtn.onclick = () => {
        openNumberInputModal("請輸入 X 值", "1", (val) => {
            const xValue = parseFloat(val);
            if (!isNaN(xValue)) {
                if (typeof plotPointOnFunction === 'function') {
                    plotPointOnFunction(shape, xValue);
                }
            } else {
                showAlert("請輸入有效的數字！");
            }
        });
    };
    
    plotBtnContainer.appendChild(plotBtn);
    content.appendChild(plotBtnContainer);	
}

// 實際套用畫布大小
function applyCanvasSize(width, height, mode = 'screen') {
    const svg = document.getElementById('svg-canvas');
    const drawingArea = document.getElementById('drawing-area');
    const clipRect = document.querySelector('#canvas-clip rect');
    
    // 更新全域狀態
    currentCanvasMode = mode;

    // 1. 更新 SVG 屬性與樣式
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.width = width + 'px';
    svg.style.height = height + 'px';

    // 2. 更新外層容器寬度 (這裡不需要了，因為改用 flex layout，容器會自動適應，或我們可以設定 max-width)
    // drawingArea.style.width = width + 'px'; // 註解掉，由 flex 控制

    // 3. 更新裁切區域
    if (clipRect) {
        clipRect.setAttribute('width', width - 70); // 這裡的 -70 是您舊邏輯保留的
        clipRect.setAttribute('height', height - 70);
    }

    // ▼▼▼ 【修復 Bug】自動將超出新畫布範圍的主體圖形移回畫布內 ▼▼▼
    const shapes = document.querySelectorAll('#shapes-layer > .shape');
    shapes.forEach(shape => {
        // 排除附屬物件 (母圖移動時會帶著它們) 與 座標軸
        if (shape.hasAttribute('data-owner-shape') || shape.hasAttribute('data-owner') || shape.classList.contains('axes-system')) return;
        
        try {
            const bbox = shape.getBBox();
            const m = shape.getCTM();
            if (!m) return;
            
            // 計算圖形的真實視覺中心點 (對應於畫布左上角)
            const cx = bbox.x + bbox.width / 2;
            const cy = bbox.y + bbox.height / 2;
            const globalCx = cx * m.a + cy * m.c + m.e;
            const globalCy = cx * m.b + cy * m.d + m.f;
            
            let dx = 0, dy = 0;
            
            // 如果中心點超出了新的邊界，計算拉回的偏移量 (拉回至距離邊界 100px 的安全區)
            if (globalCx > width - 30) dx = (width - 100) - globalCx;
            else if (globalCx < 0) dx = 60 - globalCx; // 防呆：如果跑到左邊界外也拉回來
            
            if (globalCy > height - 30) dy = (height - 100) - globalCy;
            else if (globalCy < 0) dy = 60 - globalCy; // 防呆：如果跑到上邊界外也拉回來
            
            // 執行平移
            if (dx !== 0 || dy !== 0) {
                if (typeof moveShape === 'function') {
                    moveShape(shape, dx, dy);
                }
            }
        } catch (e) {}
    });
    // ▲▲▲ 修改結束 ▲▲▲

    // 4. 重繪實體方格 (如果有的話)
    const bgLayer = document.getElementById('background-layer');
    if (bgLayer && bgLayer.innerHTML !== '') {
        // 這裡可以選擇自動重繪，或提示使用者
        // clearRealBackground(); // 暫不清除，保留使用者選擇
    }

    // 5. 寫入本地快取
    localStorage.setItem('math_editor_canvas_size', `${width},${height},${mode}`);

    // 更新狀態列
    if (typeof statusText !== 'undefined' && statusText) {
        statusText.innerText = `畫布已設定為 ${width} x ${height} (${mode === 'print' ? '列印模式' : '螢幕模式'})`;
    }

    const infoDisplay = document.getElementById('canvas-info-display');
    if (infoDisplay) {
        const modeText = (mode === 'print') ? '🖨️ 列印' : '🖥️ 螢幕';
        infoDisplay.innerText = `${width} x ${height} (${modeText})`;
        
        // 可選：依模式改變顏色提示
        if (mode === 'print') {
            infoDisplay.style.borderColor = '#e67e22'; // 橘色邊框提示列印模式
            infoDisplay.style.color = '#d35400';
        } else {
            infoDisplay.style.borderColor = '#ccc';
            infoDisplay.style.color = '#34495e';
        }
    }
    
    saveState();
}

function triggerExportSelection() {
    if (selectedElements.length === 0) {
        showAlert('沒有選取的物件', '請先選取您想匯出的圖形。');
        return;
    }
    // 呼叫 file_io.js 中的新函式，true 代表「僅匯出選取範圍」
    startExportProcess(true);
}

function openSubMenuAtContext(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    closeAllMenus(); // 先關閉所有其他選單

    // 【關鍵修正】強制覆寫 CSS 中的 !important 設定
    // style.css 中為了側邊欄選單設定了 bottom: 0 !important
    // 這裡必須用 'important' 參數將其重置為 auto，top 才能生效
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('right', 'auto', 'important');
    menu.style.setProperty('top', 'auto', 'important');
    menu.style.setProperty('left', 'auto', 'important');

    menu.style.display = 'flex';
    menu.style.position = 'fixed'; 
    menu.style.zIndex = '10001'; 

    // lastContextPos 變數已在 core.js 的 contextmenu 事件中被設定
    // 增加一點 Y 軸偏移，讓選單出現在游標下方一點點，避免誤觸
    const menuRect = menu.getBoundingClientRect();
    let menuX = lastContextPos.x;
    let menuY = lastContextPos.y + 5; 

    // 邊界檢查，防止選單超出視窗
    if (menuX + menuRect.width > window.innerWidth) {
        menuX = window.innerWidth - menuRect.width - 5;
    }
    if (menuY + menuRect.height > window.innerHeight) {
        menuY = window.innerHeight - menuRect.height - 5;
    }

    // 使用 setProperty ... 'important' 確保覆蓋任何 CSS 優先級
    menu.style.setProperty('left', `${menuX}px`, 'important');
    menu.style.setProperty('top', `${menuY}px`, 'important');
}

const previousColorValues = {
    'stroke-color-select': '#000000',
    'fill-color-select': 'none'
};

let activeColorSelectId = null;
let activeColorType = null;

window.handleColorSelection = function(selectEl, type) {
    if (selectEl.value === 'custom') {
        // 紀錄來源
        activeColorSelectId = selectEl.id;
        activeColorType = type;

        // 1. 將下拉選單「外觀」立刻退回原本的有效顏色，避免卡在「自訂顏色...」文字上
        let initVal = previousColorValues[selectEl.id];
        if (!initVal || initVal === 'none' || initVal.startsWith('rgba')) {
            initVal = '#000000'; 
        }
        selectEl.value = previousColorValues[selectEl.id];

        // 2. 開啟對話框
        document.getElementById('new-custom-color-picker').value = initVal;
        renderCustomColorList();
        document.getElementById('custom-color-modal').style.display = 'flex';
    } else {
        // 正常選擇顏色
        previousColorValues[selectEl.id] = selectEl.value;
        
        // 【修正】無論是 stroke 還是 fill，都要更新 UI 顏色
        updateColorSelect(selectEl);
        
        onStyleChange(type);
    }
};

function closeCustomColorModal() {
    document.getElementById('custom-color-modal').style.display = 'none';
}

function applyAndSaveCustomColor() {
    const color = document.getElementById('new-custom-color-picker').value;
    const targetSelect = document.getElementById(activeColorSelectId);

    // 為了方便，我們把這個自訂顏色同時加到「線條」跟「填滿」的選單裡
    const selects = [document.getElementById('stroke-color-select'), document.getElementById('fill-color-select')];
    
    selects.forEach(sel => {
        if(!sel) return;
        let opt = Array.from(sel.options).find(o => o.value === color);
        if (!opt) {
            // 建立新選項，加上專屬 class 以便後續刪除
            opt = document.createElement('option');
            opt.value = color;
            opt.text = `■ 自訂 (${color.toUpperCase()})`;
            opt.style.color = color;
            opt.style.fontWeight = 'bold';
            opt.className = 'custom-color-opt'; 
            
            // 插入到 "custom" 選項的正上方
            const customOpt = Array.from(sel.options).find(o => o.value === 'custom');
            sel.insertBefore(opt, customOpt);
        }
    });

    // 立即套用這個新顏色
    targetSelect.value = color;
    previousColorValues[activeColorSelectId] = color;
    
    // 【修正】無論是 stroke 還是 fill，都要更新 UI 顏色
    updateColorSelect(targetSelect);
    
    onStyleChange(activeColorType);

    saveSystemSettings();
    closeCustomColorModal();
	saveSystemSettings();
}


// 渲染對話框裡的已儲存顏色清單 (包含刪除功能)
function renderCustomColorList() {
    const listContainer = document.getElementById('custom-color-list');
    listContainer.innerHTML = '';
    
    const targetSelect = document.getElementById(activeColorSelectId);
    if (!targetSelect) return;

    // 抓出所有帶有 custom-color-opt 的選項
    const customOptions = targetSelect.querySelectorAll('.custom-color-opt');
    
    if(customOptions.length === 0) {
        listContainer.innerHTML = '<span style="font-size:12px; color:#aaa; font-style:italic;">目前沒有自訂顏色</span>';
        return;
    }

    // 產生色塊與刪除按鈕
    customOptions.forEach(opt => {
        const color = opt.value;
        const badge = document.createElement('div');
        badge.style.cssText = `
            background-color: ${color}; 
            width: 30px; height: 30px; 
            border-radius: 4px; border: 1px solid #999;
            cursor: pointer; position: relative;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            transition: transform 0.1s;
        `;
        badge.title = `點擊刪除 ${color}`;
        
        // 滑鼠移上去時顯示 X
        badge.onmouseenter = () => {
            badge.style.transform = 'scale(1.1)';
            badge.innerHTML = '<span style="color:white; text-shadow:0px 0px 3px black, 0px 0px 3px black; font-size:16px; font-weight:bold;">✕</span>';
        };
        badge.onmouseleave = () => {
            badge.style.transform = 'scale(1)';
            badge.innerHTML = '';
        };
        
        // 點擊執行刪除
        badge.onclick = () => {
            const selects = [document.getElementById('stroke-color-select'), document.getElementById('fill-color-select')];
            selects.forEach(sel => {
                const optionToRemove = sel.querySelector(`.custom-color-opt[value="${color}"]`);
                if (optionToRemove) optionToRemove.remove();
            });
            // 重新渲染清單
            renderCustomColorList(); 
        };
        
        listContainer.appendChild(badge);
    });
}

window.customMarksList =[]; // 全域變數儲存自訂符號

function saveSystemSettings() {
    const customColorOpts = document.querySelectorAll('.custom-color-opt');
    const customColors = Array.from(customColorOpts).map(opt => opt.value);
    const uniqueColors =[...new Set(customColors)];
    
    const settings = {
        autoLabel: document.getElementById('auto-label-check')?.checked || false,
        autoAngleLabel: document.getElementById('auto-angle-label-check')?.checked || false,
        customColors: uniqueColors,
        defaultStroke: document.getElementById('stroke-color-select')?.value || '#000000',
        defaultFill: document.getElementById('fill-color-select')?.value || 'none',
        defaultStrokeWidth: document.getElementById('stroke-width-select')?.value || '2',
        defaultLineStyle: document.getElementById('line-style-select')?.value || 'solid',
        defaultFillStyle: document.getElementById('fill-style-select')?.value || 'solid', 
        customMarks: window.customMarksList ||[],
        // 【新增】將自訂公式陣列存入系統設定
        customFormulas: window.customFormulasList ||[]
    };
    localStorage.setItem('math_editor_system_settings', JSON.stringify(settings));
}

function loadSystemSettings() {
    const saved = localStorage.getItem('math_editor_system_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            
            const autoLabel = document.getElementById('auto-label-check');
            if (autoLabel && settings.autoLabel !== undefined) autoLabel.checked = settings.autoLabel;
            
            const autoAngle = document.getElementById('auto-angle-label-check');
            if (autoAngle && settings.autoAngleLabel !== undefined) autoAngle.checked = settings.autoAngleLabel;
            
            if (settings.customColors && settings.customColors.length > 0) {
                const strokeSel = document.getElementById('stroke-color-select');
                const fillSel = document.getElementById('fill-color-select');
                settings.customColors.forEach(color => {
                    [strokeSel, fillSel].forEach(sel => {
                        if(!sel) return;
                        if (!Array.from(sel.options).some(o => o.value === color)) {
                            let opt = document.createElement('option');
                            opt.value = color; opt.text = `■ 自訂 (${color.toUpperCase()})`; opt.style.color = color; opt.style.fontWeight = 'bold'; opt.className = 'custom-color-opt'; 
                            const customOpt = Array.from(sel.options).find(o => o.value === 'custom');
                            if (customOpt) sel.insertBefore(opt, customOpt);
                        }
                    });
                });
            }
                   
            const strokeWidthSel = document.getElementById('stroke-width-select');
            if (settings.defaultStrokeWidth && strokeWidthSel) strokeWidthSel.value = settings.defaultStrokeWidth;
            const strokeSel = document.getElementById('stroke-color-select');
            if (settings.defaultStroke && strokeSel) strokeSel.value = settings.defaultStroke;
            const fillSel = document.getElementById('fill-color-select');
            if (settings.defaultFill && fillSel) fillSel.value = settings.defaultFill;
            const lineStyleSel = document.getElementById('line-style-select');
            if (settings.defaultLineStyle && lineStyleSel) lineStyleSel.value = settings.defaultLineStyle;
            
            // 【核心修復】載入填滿樣式
            const fillStyleSel = document.getElementById('fill-style-select');
            if (settings.defaultFillStyle && fillStyleSel) fillStyleSel.value = settings.defaultFillStyle;

            if (strokeSel) updateColorSelect(strokeSel);
            if (fillSel) updateColorSelect(fillSel);
            
            if (settings.defaultStroke) previousColorValues['stroke-color-select'] = settings.defaultStroke;
            if (settings.defaultFill) previousColorValues['fill-color-select'] = settings.defaultFill;

            if (settings.customMarks) {
                window.customMarksList = settings.customMarks.map(item => {
                    return typeof item === 'string' ? { name: item, symbol: item } : item;
                });
                if (typeof window.renderCustomMarksMenu === 'function') window.renderCustomMarksMenu();
            }
            if (settings.customFormulas) {
                window.customFormulasList = settings.customFormulas;
                if (typeof window.renderCustomFormulaList === 'function') window.renderCustomFormulaList();
            }
        } catch(e) { console.warn("Failed to load settings completely", e); }
    }
}

// 設定檔視窗功能
function openSystemSettingsModal() {
    document.getElementById('system-settings-modal').style.display = 'flex';
}

function exportSystemSettings() {
    saveSystemSettings(); // 確保基礎系統設定為最新
    
    const data = {
        version: "2.0",
        timestamp: Date.now(),
        settings: {}
    };
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 【核心修正】：匯出設定檔時也排除快取與閱讀紀錄
        if (key && key.startsWith('math_editor_') && 
            !key.startsWith('math_editor_cache_') && 
            !key.startsWith('math_editor_read_')) {
            try {
                let val = localStorage.getItem(key);
                try { val = JSON.parse(val); } catch(e){}
                data.settings[key] = val;
            } catch(e){}
        }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    saveBlobDirectly(blob, "MathGraph_Settings.config");
}
function importSystemSettings(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // 1. 處理新版的動態全域設定格式
            if (data.settings) {
                for (let key in data.settings) {
                    if (key.startsWith('math_editor_')) {
                        let val = data.settings[key];
                        if (typeof val === 'object') val = JSON.stringify(val);
                        localStorage.setItem(key, val);
                    }
                }
            } 
            // 2. 舊版備援：相容以前舊格式的匯入檔
            else {
                if (data.shapeParams) {
                    for (let key in data.shapeParams) {
                        localStorage.setItem(key, JSON.stringify(data.shapeParams[key]));
                    }
                }
                if (data.customMenus) localStorage.setItem('math_editor_custom_menus', JSON.stringify(data.customMenus));
                if (data.autoAngleSettings) localStorage.setItem('math_editor_auto_angle_settings', JSON.stringify(data.autoAngleSettings));
                if (data.defaultStroke !== undefined) localStorage.setItem('math_editor_system_settings', JSON.stringify(data));
            }
            
            showAlert("設定與圖形參數已成功匯入！系統即將重新載入以套用新設定。", "匯入成功", () => location.reload());
        } catch(err) { showAlert("設定檔格式錯誤！"); }
    };
    reader.readAsText(file);
    input.value = "";
}

function resetSystemSettings() {
    showConfirm("確定要還原所有系統設定嗎？\n(這將清除您所有的自訂顏色與偏好記憶，並重新整理網頁)", () => {
        localStorage.removeItem('math_editor_system_settings');
        localStorage.removeItem('math_editor_canvas_size');
        localStorage.removeItem('math_editor_axis_settings');
        location.reload();
    }, null, "警告");
}
let hintTimeout;

function showUngroupHint() {
    const hint = document.getElementById('temp-floating-hint');
    if (!hint) return;

    // 重置狀態
    hint.style.display = 'block';
    // 強制重繪以觸發 transition
    void hint.offsetWidth; 
    hint.style.opacity = '1';

    // 清除舊的計時器 (如果使用者連續操作)
    if (hintTimeout) clearTimeout(hintTimeout);

    // 5秒後淡出
    hintTimeout = setTimeout(() => {
        hint.style.opacity = '0';
        // 淡出動畫結束後隱藏元素
        setTimeout(() => {
            hint.style.display = 'none';
        }, 500); 
    }, 5000);
}

// --- 新增：自動根據寬高縮放字體的演算法 ---
window.autoScaleText = function(fo) {
    if (!fo) return;
    const div = fo.querySelector('.math-content');
    if (!div) return;

    // 1. 取得舊的寬度 (用於後續維持中心點)
    const oldW = parseFloat(fo.getAttribute('width')) || 0;
    const oldH = parseFloat(fo.getAttribute('height')) || 0;

    // 2. 暫時允許 div 撐開，以測量真實內容尺寸
    div.style.width = 'max-content';
    div.style.whiteSpace = 'nowrap'; 
    
    // 如果內容包含手動換行 <br>，則允許測量高度
    if (div.innerHTML.includes('<br')) {
        div.style.whiteSpace = 'pre-wrap';
    }

    // 3. 測量真實尺寸 (使用 scrollWidth/Height 獲取內容自然大小)
    // 加上極小的緩衝值 (4px) 避免邊緣被裁切，但不進行迭代累加
    const contentW = div.scrollWidth + 4;
    const contentH = div.scrollHeight + 4;

    // 4. 【穩定機制】如果變動極小 (小於 1px)，則不更新，防止 Feedback Loop
    if (Math.abs(contentW - oldW) < 1 && Math.abs(contentH - oldH) < 1) {
        return;
    }

    // 5. 更新 SVG 寬高屬性
    fo.setAttribute('width', contentW);
    fo.setAttribute('height', contentH);

    // 6. 修正中心點：處理您之前的 1/4 偏移與置中邏輯
    // 確保當寬度「自動增寬」時，物件的中心位置保持穩定
    const transform = fo.getAttribute('transform') || '';
    const match = /translate\(([-0-9.]+)[, ]+([-0-9.]+)\)/.exec(transform);
    if (match) {
        const tx = parseFloat(match[1]);
        const ty = parseFloat(match[2]);
        
        // 計算寬度變動產生的偏移差
        const dw = contentW - oldW;
        const dh = contentH - oldH;

        // 維持中心點不動：新座標 = 舊座標 - 寬度變動量的一半
        const newTx = tx - dw / 2;
        const newTy = ty - dh / 2;

        const newTransform = transform.replace(/translate\([^)]+\)/, `translate(${newTx.toFixed(2)}, ${newTy.toFixed(2)})`);
        fo.setAttribute('transform', newTransform);
    }

    // 7. 恢復 div 的 CSS 設定讓其填滿容器
    div.style.width = '100%';
};

window.updateDimensionStyle = function(val) {
    if (editingTextElement && editingTextElement.parentNode && editingTextElement.parentNode.getAttribute('data-sub-tool') === 'dimension') {
        const group = editingTextElement.parentNode;
        group.setAttribute('data-dim-style', val);
        
        const p1 = { x: parseFloat(group.getAttribute('data-p1-x')), y: parseFloat(group.getAttribute('data-p1-y')) };
        const p2 = { x: parseFloat(group.getAttribute('data-p2-x')), y: parseFloat(group.getAttribute('data-p2-y')) };
        if (typeof renderDimensionVisuals === 'function') renderDimensionVisuals(group, p1, p2);
        if (typeof saveState === 'function') saveState();
    }
};

window.updateDimensionTextDir = function(checked) {
    if (editingTextElement && editingTextElement.parentNode && editingTextElement.parentNode.getAttribute('data-sub-tool') === 'dimension') {
        const group = editingTextElement.parentNode;
        group.setAttribute('data-align-text', checked ? 'true' : 'false');
        
        const p1 = { x: parseFloat(group.getAttribute('data-p1-x')), y: parseFloat(group.getAttribute('data-p1-y')) };
        const p2 = { x: parseFloat(group.getAttribute('data-p2-x')), y: parseFloat(group.getAttribute('data-p2-y')) };
        if (typeof renderDimensionVisuals === 'function') renderDimensionVisuals(group, p1, p2);
        if (typeof saveState === 'function') saveState();
    }
};

function renderDimensionVisuals(group, p1, p2) {
    const offset = parseFloat(group.getAttribute('data-offset')) || 20; 
    const pushDir = parseFloat(group.getAttribute('data-push-dir')) || 1;
    const dimStyle = group.getAttribute('data-dim-style') || 'standard';
    
    // 【修改】讀取換邊倍數，有勾選就反轉乘數
    const swapSideMultiplier = group.getAttribute('data-swap-side') === 'true' ? -1 : 1;
    
    const ownerId = group.getAttribute('data-owner');
    const ownerShape = document.getElementById(ownerId);
    let startGap = 5; 
    
    if (ownerShape) {
        const hostSub = ownerShape.getAttribute('data-sub-tool');
        if (hostSub === 'circle' || hostSub === 'circle-smart' || dimStyle === 'internal' || dimStyle === 'text-only') {
            startGap = 0; 
        }
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    
    // 【修改】將 nx, ny 乘上 swapSideMultiplier 以實現換邊連動
    let nx = -Math.sin(angle) * pushDir * swapSideMultiplier;
    let ny = Math.cos(angle) * pushDir * swapSideMultiplier;
    
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);

    const textEl = group.querySelector('text');
    if (!textEl) return; 
    
    Array.from(group.querySelectorAll('.dimension-line')).forEach(el => el.remove());
    Array.from(group.querySelectorAll('.dimension-path')).forEach(el => el.remove());

    let textX = 0, textY = 0;
    const textLen = textEl.textContent.length * 9; 
    const textGap = Math.max(15, textLen/2 + 5);

    // --- 開始繪製 ---

    if (dimStyle === 'internal') {
        textX = (p1.x + p2.x) / 2;
        textY = (p1.y + p2.y) / 2;
        
        const styleArrow = `stroke:#2980b9; stroke-width:1.2; fill:#2980b9; vector-effect:non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round;`;
        const arrowLen = 6, arrowW = 3;
        
        const makeArrow = (tip, dirSign) => {
            const shaftStart = { x: textX + (dirSign * ux * textGap), y: textY + (dirSign * uy * textGap) };
            const backX = tip.x + (dirSign === -1 ? ux : -ux) * arrowLen;
            const backY = tip.y + (dirSign === -1 ? uy : -uy) * arrowLen;
            const w1x = backX + nx * arrowW, w1y = backY + ny * arrowW;
            const w2x = backX - nx * arrowW, w2y = backY - ny * arrowW;
            
            let d = `M ${shaftStart.x} ${shaftStart.y} L ${tip.x} ${tip.y} M ${tip.x} ${tip.y} L ${w1x} ${w1y} L ${w2x} ${w2y} Z`;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', d);
            path.setAttribute('class', 'dimension-path');
            path.style.cssText = styleArrow;
            group.insertBefore(path, textEl);
        };
        makeArrow(p1, -1);
        makeArrow(p2, 1);

    } else if (dimStyle === 'text-only') {
        textX = (p1.x + p2.x) / 2 + nx * 12;
        textY = (p1.y + p2.y) / 2 + ny * 12;

    } else if (dimStyle === 'standard') {
        const extOver = 5;
        const arrowLen = 6, arrowW = 3;
        const extGap = startGap; 
        
        const e1_s = { x: p1.x + nx * extGap, y: p1.y + ny * extGap };
        const e1_e = { x: p1.x + nx * (offset + extOver), y: p1.y + ny * (offset + extOver) };
        const e2_s = { x: p2.x + nx * extGap, y: p2.y + ny * extGap };
        const e2_e = { x: p2.x + nx * (offset + extOver), y: p2.y + ny * (offset + extOver) };

        const styleExt = `stroke:#2980b9; stroke-width:1.2; stroke-dasharray:2,2; fill:none; vector-effect:non-scaling-stroke;`;
        const styleArrow = `stroke:#2980b9; stroke-width:1.2; stroke-dasharray:4,2; fill:#2980b9; vector-effect:non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round;`;
        const styleLine = `stroke:#2980b9; stroke-width:1.2; stroke-dasharray:4,2; fill:none; vector-effect:non-scaling-stroke;`;

        const makeLine = (pS, pE, style) => {
            const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
            el.setAttribute("x1", pS.x); el.setAttribute("y1", pS.y);
            el.setAttribute("x2", pE.x); el.setAttribute("y2", pE.y);
            el.setAttribute("class", "dimension-line");
            el.style.cssText = style;
            group.insertBefore(el, textEl);
        };
        makeLine(e1_s, e1_e, styleExt);
        makeLine(e2_s, e2_e, styleExt);

        const tip1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
        const tip2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
        textX = (tip1.x + tip2.x) / 2;
        textY = (tip1.y + tip2.y) / 2;

        const makeArrow = (tip, dirSign) => {
            const shaftStart = { x: textX + (dirSign * ux * textGap), y: textY + (dirSign * uy * textGap) };
            const backX = tip.x + (dirSign === -1 ? ux : -ux) * arrowLen;
            const backY = tip.y + (dirSign === -1 ? uy : -uy) * arrowLen;
            const w1x = backX + nx * arrowW, w1y = backY + ny * arrowW;
            const w2x = backX - nx * arrowW, w2y = backY - ny * arrowW;
            
            let d = `M ${shaftStart.x} ${shaftStart.y} L ${tip.x} ${tip.y} M ${tip.x} ${tip.y} L ${w1x} ${w1y} L ${w2x} ${w2y} Z`;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', d);
            path.setAttribute('class', 'dimension-path');
            path.style.cssText = styleArrow;
            group.insertBefore(path, textEl);
        };
        makeArrow(tip1, -1);
        makeArrow(tip2, 1);
    } else {
        // Curve / Brace
        // 【修正】直接使用原始端點 p1, p2，不再計算內縮的 p1_gap, p2_gap
        const totalLen = Math.hypot(dx, dy);
        const styleLine = `stroke:#2980b9; stroke-width:1.2; stroke-dasharray: 2, 2; fill:none; vector-effect:non-scaling-stroke;`;

        if (dimStyle === 'curve') {
            const M = { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 };
            const C = { x: M.x + nx * offset * 1.5, y: M.y + ny * offset * 1.5 };
            textX = M.x + nx * offset * 0.8;
            textY = M.y + ny * offset * 0.8;
            
            const qBezier = (t, P0, P1, P2) => ({
                x: (1-t)**2 * P0.x + 2*(1-t)*t * P1.x + t**2 * P2.x,
                y: (1-t)**2 * P0.y + 2*(1-t)*t * P1.y + t**2 * P2.y
            });
            const approxLen = Math.hypot(p2.x - p1.x, p2.y - p1.y); // 【修正】
            const safeTextGap = Math.min(textGap, approxLen / 2 - 5);
            const tGap = safeTextGap / approxLen; 
            
            const tLeftEnd = 0.5 - tGap;
            const tRightStart = 0.5 + tGap;
           if (tLeftEnd > 0) {
                const Q_left = qBezier(tLeftEnd, p1, C, p2); // 【修正】
                const Q_right = qBezier(tRightStart, p1, C, p2); // 【修正】
                const C_left = { 
                    x: p1.x + tLeftEnd * (C.x - p1.x), // 【修正】
                    y: p1.y + tLeftEnd * (C.y - p1.y)  // 【修正】
                };
                const C_right = {
                    x: p2.x + (1 - tRightStart) * (C.x - p2.x), // 【修正】
                    y: p2.y + (1 - tRightStart) * (C.y - p2.y)  // 【修正】
                };
                const dLeft = `M ${p1.x} ${p1.y} Q ${C_left.x} ${C_left.y} ${Q_left.x} ${Q_left.y}`; // 【修正】
                const dRight = `M ${Q_right.x} ${Q_right.y} Q ${C_right.x} ${C_right.y} ${p2.x} ${p2.y}`; // 【修正】

                const pathL = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathL.setAttribute('d', dLeft);
                pathL.setAttribute('class', 'dimension-path');
                pathL.style.cssText = styleLine;
                
                const pathR = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathR.setAttribute('d', dRight);
                pathR.setAttribute('class', 'dimension-path');
                pathR.style.cssText = styleLine;

                group.insertBefore(pathL, textEl);
                group.insertBefore(pathR, textEl);
            }
        } else if (dimStyle === 'brace') {
            const M = { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 };
            const T = { x: M.x + nx * offset, y: M.y + ny * offset };
            const L = Math.hypot(dx, dy);
            const q = Math.min(0.2, 10/L); 
            // 【修正】將所有 p1_gap, p2_gap 換成 p1, p2
            const dBrace = `M ${p1.x} ${p1.y} C ${p1.x + nx*offset*0.5} ${p1.y + ny*offset*0.5}, ${M.x - ux*L*q} ${M.y - uy*L*q}, ${T.x} ${T.y} C ${M.x + ux*L*q} ${M.y + uy*L*q}, ${p2.x + nx*offset*0.5} ${p2.y + ny*offset*0.5}, ${p2.x} ${p2.y}`;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', dBrace);
            path.setAttribute('class', 'dimension-path');
            path.style.cssText = styleLine;
            group.insertBefore(path, textEl);
            textX = T.x + nx * 12;
            textY = T.y + ny * 12;
        }
    }
    // 更新文字位置與角度
    textEl.setAttribute('x', textX);
    textEl.setAttribute('y', textY);
    textEl.setAttribute('x', textX);
    textEl.setAttribute('y', textY);
    const alignText = group.getAttribute('data-align-text') !== 'false';
    if (alignText) {
        let textRot = angle * 180 / Math.PI;
        // 確保文字保持由左至右閱讀
        if (textRot > 90) textRot -= 180;
        else if (textRot < -90) textRot += 180;
        
        // 【核心修正】：嚴格遵守工程圖學標準，垂直線一律由下往上讀 (-90度，字首朝左)
        // 解決由上往下畫線時，文字不小心變成由上往下讀的 Bug
        if (Math.abs(textRot - 90) < 0.1) {
            textRot = -90;
        }
        
        textEl.setAttribute("transform", `rotate(${textRot}, ${textX}, ${textY})`);
    } else {
        textEl.removeAttribute("transform"); // 取消旋轉，保持水平
    }     
    // 確保描邊樣式還在
    textEl.style.paintOrder = "stroke";
    textEl.style.stroke = "white";
    textEl.style.strokeWidth = "3px";
    textEl.style.strokeLinecap = "butt";
    textEl.style.strokeLinejoin = "miter";
}
document.addEventListener('DOMContentLoaded', () => {
    const leftSidebar = document.querySelector('.left-sidebar');
    const rightSidebar = document.querySelector('.right-sidebar');

    // 1. 左側按鈕
    if (leftSidebar) {
        const btnL = document.createElement('button');
        btnL.innerHTML = '◀';
        btnL.className = 'toggle-sidebar-btn left-toggle';
        btnL.title = "收起/展開左工具列";
        btnL.onclick = () => {
            leftSidebar.classList.toggle('collapsed');
            btnL.classList.toggle('collapsed'); // 按鈕自己也要移動
            btnL.innerHTML = leftSidebar.classList.contains('collapsed') ? '▶' : '◀';
        };
        document.body.appendChild(btnL); // 掛載到 body
    }

    // 2. 右側按鈕
    if (rightSidebar) {
        const btnR = document.createElement('button');
        btnR.innerHTML = '▶';
        btnR.className = 'toggle-sidebar-btn right-toggle';
        btnR.title = "收起/展開右工具列";
        btnR.onclick = () => {
            rightSidebar.classList.toggle('collapsed');
            btnR.classList.toggle('collapsed'); // 按鈕自己也要移動
            btnR.innerHTML = rightSidebar.classList.contains('collapsed') ? '◀' : '▶';
        };
        document.body.appendChild(btnR); // 掛載到 body
    }
});
window.drawPolygonExtensions = function(shape) {
    const pts = getTransformedPoints(shape);
    if (!pts || pts.length < 3) return;

    if(!shape.id) shape.id = 'poly-' + Date.now();

    const extLen = 100; 
    const newLines = [];

    for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        
        const ex = p2.x + (dx / len) * extLen;
        const ey = p2.y + (dy / len) * extLen;

        const lineGroup = document.createElementNS(ns, "g");
        lineGroup.setAttribute('class', 'shape group extension-obj'); // 加上 extension-obj 標記
        lineGroup.setAttribute('data-tool', 'group'); // 設為 group 讓它可以被選取
        lineGroup.setAttribute('data-owner-shape', shape.id); 
        lineGroup.setAttribute('data-dependency-type', 'extension_line');
        lineGroup.setAttribute('data-edge-index', i);
        lineGroup.id = 'ext-' + Date.now() + '-' + i;

        const hitLine = document.createElementNS(ns, "line");
        hitLine.setAttribute('x1', p2.x); hitLine.setAttribute('y1', p2.y);
        hitLine.setAttribute('x2', ex); hitLine.setAttribute('y2', ey);
        hitLine.setAttribute('class', 'hit-line');
        hitLine.style.cssText = "stroke:transparent; stroke-width:10; cursor:pointer;";
        
        const visLine = document.createElementNS(ns, "line");
        visLine.setAttribute('x1', p2.x); visLine.setAttribute('y1', p2.y);
        visLine.setAttribute('x2', ex); visLine.setAttribute('y2', ey);
        visLine.setAttribute('class', 'visible-line');
        visLine.style.cssText = "stroke:#e67e22; stroke-width:1.5; stroke-dasharray:5,5; vector-effect:non-scaling-stroke; pointer-events:none;";
        
        lineGroup.appendChild(hitLine);
        lineGroup.appendChild(visLine);
        
        document.getElementById('shapes-layer').appendChild(lineGroup);
        newLines.push(lineGroup);
    }

    saveState();
    setMode('select');
    deselectAll();
    newLines.forEach(l => addToSelection(l));
    statusText.innerText = "已產生外角延長線。若要標註外角，請使用「角標」工具，依序點擊：內部頂點 -> 角頂點 -> 延長線末端。";
};

window.openBatchTextFormatModal = function() {
    document.getElementById('batch-text-format-modal').style.display = 'flex';
    
    // 重置所有輸入框為「不更動」
    document.getElementById('batch-text-size').value = "";
    document.getElementById('batch-text-bold').value = "";
    
    // 【核心修正】動態從主介面複製顏色選項
    const sourceColorSelect = document.getElementById('stroke-color-select');
    const targetColorSelect = document.getElementById('batch-text-color');
    
    // 清空並加入預設選項
    targetColorSelect.innerHTML = '<option value="">-- 不更動 --</option>';

    if (sourceColorSelect) {
        Array.from(sourceColorSelect.options).forEach(opt => {
            // 複製節點，保留所有樣式與自訂屬性
            targetColorSelect.appendChild(opt.cloneNode(true));
        });
    }
    // 預設選中「不更動」
    targetColorSelect.value = "";
    
    closeAllMenus();
};

window.applyBatchTextFormat = function() {
    const size = document.getElementById('batch-text-size').value;
    const color = document.getElementById('batch-text-color').value;
    const bold = document.getElementById('batch-text-bold').value;

    if (!size && !color && !bold) {
        document.getElementById('batch-text-format-modal').style.display = 'none';
        return;
    }

    let updatedCount = 0;
    
    const applyToTextNode = (node) => {
        if (size) {
            node.setAttribute('font-size', size);
            node.style.fontSize = size + "px";
        }
        if (color) {
            node.setAttribute('fill', color);
            node.style.fill = color;
        }
        if (bold) {
            node.setAttribute('font-weight', bold);
            node.style.fontWeight = bold;
        }
        updatedCount++;
    };
    
    selectedElements.forEach(el => {
        const tool = el.getAttribute('data-tool');
        const tagName = el.tagName.toLowerCase();
        
        const isTextObject = (tool === 'text' || tool === 'math' || tagName === 'text' || el.classList.contains('vertex-label') || el.classList.contains('angle-label-text') || el.classList.contains('axis-text') || el.classList.contains('axis-label'));

        if (isTextObject) {
            if (tagName === 'foreignobject') {
                if (size) {
                    el.setAttribute('data-font-size', size);
                    const div = el.querySelector('.math-content');
                    if (div) div.style.fontSize = size + "px";
                    if (typeof autoScaleText === 'function') autoScaleText(el);
                }
                if (color) {
                    el.setAttribute('fill', color);
                    const div = el.querySelector('.math-content');
                    if (div) div.style.color = color;
                    
                    const mathSvgs = el.querySelectorAll('svg *');
                    mathSvgs.forEach(child => {
                        if (child.getAttribute('fill') === 'currentColor' || (child.getAttribute('fill') && child.getAttribute('fill') !== 'none')) {
                            child.setAttribute('fill', color);
                        }
                        if (child.getAttribute('stroke') === 'currentColor') {
                            child.setAttribute('stroke', color);
                        }
                    });
                }
                if (bold) {
                    const div = el.querySelector('.math-content');
                    if (div) div.style.fontWeight = bold;
                }
                updatedCount++;
            } else if (tagName === 'text') {
                applyToTextNode(el);
            }
        } else if (tagName === 'g') {
            // 【新增】針對群組(座標軸、統計圖)內的文字進行批次變更
            const subTool = el.getAttribute('data-sub-tool');
            const isAxis = el.classList.contains('axes-system');
            const isChart =['histogram', 'boxplot', 'axis-chart', 'pie-chart'].includes(subTool);
            const isSolid = tool === 'solid' || tool === 'blocks';
            const isVenn = subTool === 'venn';
            
            if (isAxis || isChart || isSolid || isVenn) {
                // 找出群組內所有文字節點
                const textNodes = el.querySelectorAll('text');
                textNodes.forEach(tNode => {
                    applyToTextNode(tNode);
                });
                
                // 處理外國物件(如圓餅圖內部標籤)
                const foNodes = el.querySelectorAll('foreignObject.pie-label');
                foNodes.forEach(fo => {
                    if (size) {
                        fo.setAttribute('data-font-size', size);
                        const div = fo.querySelector('.math-content');
                        if (div) div.style.fontSize = size + "px";
                        
                        setTimeout(() => {
                            if (!div || !div.isConnected) return; 
                            const w = div.offsetWidth;
                            const h = div.offsetHeight;
                            fo.setAttribute("width", w + 4);
                            fo.setAttribute("height", h + 4);
                            const offsetX = -(w + 4) / 2;
                            const offsetY = -(h + 4) / 2;
                            fo.setAttribute("x", offsetX);
                            fo.setAttribute("y", offsetY);
                        }, 50);
                    }
                    if (color) {
                        fo.setAttribute('fill', color);
                        const div = fo.querySelector('.math-content');
                        if (div) div.style.color = color;
                    }
                    if (bold) {
                        const div = fo.querySelector('.math-content');
                        if (div) div.style.fontWeight = bold;
                    }
                    updatedCount++;
                });
            }
        }
    });

    if (updatedCount > 0) {
        if (typeof saveState === 'function') saveState();
        if (typeof statusText !== 'undefined') {
            statusText.innerText = `已批次更新 ${updatedCount} 個文字/公式的樣式`;
        }
    } else {
        if (typeof statusText !== 'undefined') {
            statusText.innerText = `選取的物件中沒有包含可修改的文字或公式`;
        }
    }
    
    document.getElementById('batch-text-format-modal').style.display = 'none';
};

window.isPointSnappingEnabled = true;

window.togglePointSnapping = function() {
    const btn = document.getElementById('btn-snap-point');
    window.isPointSnappingEnabled = !window.isPointSnappingEnabled;
    
    if (window.isPointSnappingEnabled) {
        btn.classList.add('active'); // 變藍色背景
        if (typeof statusText !== 'undefined') statusText.innerText = "軌道吸附模式：已開啟";
    } else {
        btn.classList.remove('active'); // 變回白色背景
        if (typeof statusText !== 'undefined') statusText.innerText = "軌道吸附模式：已關閉";
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('quick-edit-bar');
    const header = document.getElementById('edit-bar-header');
    if (!bar || !header) return;

    let isDraggingBar = false;
    let dragOffsetX = 0, dragOffsetY = 0;

    const onDragStart = (e) => {
        isDraggingBar = true;
        const rect = bar.getBoundingClientRect();
        
        // 判斷是滑鼠還是觸控事件
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        dragOffsetX = clientX - rect.left;
        dragOffsetY = clientY - rect.top;

        // 關鍵：將置中用的 transform 移除，改為純粹的 top/left 定位
        bar.style.transform = 'none';
        bar.style.left = `${rect.left}px`;
        bar.style.top = `${rect.top}px`;
        bar.style.margin = '0';
        
        e.preventDefault();
    };

    const onDragMove = (e) => {
        if (!isDraggingBar) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        let newL = clientX - dragOffsetX;
        let newT = clientY - dragOffsetY;

        // 邊界檢查
        if (newL < 0) newL = 0;
        if (newT < 0) newT = 0;
        if (newL + bar.offsetWidth > window.innerWidth) newL = window.innerWidth - bar.offsetWidth;
        if (newT + bar.offsetHeight > window.innerHeight) newT = window.innerHeight - bar.offsetHeight;

        bar.style.left = `${newL}px`;
        bar.style.top = `${newT}px`;
    };

    const onDragEnd = () => {
        isDraggingBar = false;
    };

    // 綁定事件
    header.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    
    // 加入觸控支援
    header.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
});

window.promptAddCustomMark = function() {
    closeAllMenus();
    
    const modal = document.getElementById('custom-mark-modal');
    const nameInput = document.getElementById('custom-mark-name-modal');
    const symbolInput = document.getElementById('custom-mark-symbol-modal');
    const rotateInput = document.getElementById('custom-mark-rotate-modal'); // 取得 checkbox
    const confirmBtn = document.getElementById('btn-confirm-mark');
    const cancelBtn = document.getElementById('btn-cancel-mark');

    if (!modal || !nameInput || !symbolInput || !confirmBtn || !cancelBtn) return;

    nameInput.value = '';
    symbolInput.value = '';
    if (rotateInput) rotateInput.checked = false; // 預設不勾選

    const closeModal = () => {
        modal.style.display = 'none';
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        nameInput.onkeydown = null;
        symbolInput.onkeydown = null;
    };

    const handleConfirm = () => {
        const name = nameInput.value.trim();
        const symbol = symbolInput.value.trim();
        const rotate = rotateInput ? rotateInput.checked : false; // 讀取設定

        if (symbol) {
            if (!window.customMarksList) window.customMarksList =[];
            if (!window.customMarksList.some(m => m.symbol === symbol)) {
                // 儲存時把 rotate 屬性也包進去
                window.customMarksList.push({ name: name || symbol, symbol: symbol, rotate: rotate });
                saveSystemSettings();
                renderCustomMarksMenu();
            }
            if (typeof selectSmartMarkStyle === 'function') {
                selectSmartMarkStyle('smart', symbol);
            }
        }
        closeModal();
    };

    const handleKeydown = (event) => {
        if (event.key === 'Enter') handleConfirm();
        else if (event.key === 'Escape') closeModal();
    };

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = closeModal;
    nameInput.onkeydown = handleKeydown;
    symbolInput.onkeydown = handleKeydown;

    modal.style.display = 'flex';
    setTimeout(() => nameInput.focus(), 50);
};

window.renderCustomMarksMenu = function() {
    const container = document.getElementById('custom-marks-container');
    if (!container) return;

    const smartMenu = document.getElementById('menu-mark-smart');
    if (smartMenu) {
        smartMenu.style.width = '180px'; 
    }
    
    container.innerHTML = '';
    
    if (window.customMarksList && window.customMarksList.length > 0) {
        const header = document.createElement('div');
        header.style.cssText = "padding: 4px 8px; background: #ecf0f1; font-size: 12px; font-weight: bold; color: #7f8c8d; text-align: center; border-top: 1px solid #ddd; margin-top: 4px;";
        header.innerText = "── 我的符號庫 ──";
        container.appendChild(header);

        window.customMarksList.forEach(item => {
            const symbol = item.symbol;
            const name = item.name;
            const isRotate = !!item.rotate; // 判斷是否隨線旋轉
            
            // 根據旋轉屬性選擇小圖示
            const rotIcon = isRotate 
                ? '<span title="隨線旋轉" style="color:#3498db; font-size:12px; margin-left:4px;">🔄</span>' 
                : '<span title="保持直立" style="color:#95a5a6; font-size:12px; margin-left:4px;">⬆️</span>';

            const div = document.createElement('div');
            div.className = 'popup-item';
            div.style.justifyContent = 'space-between';
            
            const left = document.createElement('div');
            left.style.cssText = "display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;";
            
            // 將小圖示放到名字的旁邊
            left.innerHTML = `<span style="font-size: 16px; width:20px; text-align:center; flex-shrink: 0;">${symbol}</span>
                              <div style="display:flex; align-items:center; white-space: nowrap; overflow: hidden;">
                                  <div style="color:#555; font-size:13px; overflow: hidden; text-overflow: ellipsis;" title="${name}">${name}</div>
                                  ${rotIcon}
                              </div>`;

            left.onclick = () => {
                selectSmartMarkStyle('smart', symbol);
            };
            
            const delBtn = document.createElement('div');
            delBtn.innerText = '✕';
            delBtn.className = 'custom-mark-del';
            delBtn.title = '刪除此符號';
            delBtn.style.flexShrink = '0'; 
            delBtn.style.marginLeft = '5px';
            delBtn.onclick = (e) => {
                e.stopPropagation(); 
                window.customMarksList = window.customMarksList.filter(s => s.symbol !== symbol);
                saveSystemSettings();
                renderCustomMarksMenu();
            };
            
            div.appendChild(left);
            div.appendChild(delBtn);
            container.appendChild(div);
        });
    }
};

// 初始化時渲染一次
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if(window.renderCustomMarksMenu) window.renderCustomMarksMenu(); }, 500);
});

// 切換雲端交流下拉選單
window.toggleCloudCommMenu = function() {
    const menu = document.getElementById('cloud-comm-menu');
    const isVisible = menu.style.display === 'flex';
    
    if (typeof closeAllMenus === 'function') closeAllMenus(); // 先關閉其他選單
    
    menu.style.display = isVisible ? 'none' : 'flex';
};

// 確保點擊空白處時關閉選單 (這段應已經在 ui.js 裡，只需將 cloud-comm-menu 加進去即可)
window.addEventListener('click', function(e) {
    // 1. 如果點擊的目標不是在按鈕容器內，也不是在選單內，就關閉全域選單
    if (!e.target.closest('.tool-btn-wrapper') && !e.target.closest('.popup-menu')) {
        if (typeof closeAllMenus === 'function') closeAllMenus(); 
    }

    // 2. 獨立處理圖庫/題庫的「更多操作」下拉選單
    const moreLib = document.getElementById('more-actions-menu-lib');
    const btnLib = document.getElementById('btn-lib-more-actions');
    if (moreLib && (moreLib.style.display === 'flex' || moreLib.style.display === 'block')) {
        if (!moreLib.contains(e.target) && (!btnLib || !btnLib.contains(e.target))) {
            moreLib.style.display = 'none';
        }
    }

    const moreQb = document.getElementById('more-actions-menu-qb');
    const btnQb = document.getElementById('btn-qb-more-actions');
    if (moreQb && (moreQb.style.display === 'flex' || moreQb.style.display === 'block')) {
        if (!moreQb.contains(e.target) && (!btnQb || !btnQb.contains(e.target))) {
            moreQb.style.display = 'none';
        }
    }

    // 3. 處理「雲端交流」下拉選單
    const commMenu = document.getElementById('cloud-comm-menu');
    const commBtn = document.getElementById('btn-cloud-comm');
    if (commMenu && (commMenu.style.display === 'flex' || commMenu.style.display === 'block')) {
        if (!commMenu.contains(e.target) && (!commBtn || !commBtn.contains(e.target))) {
            commMenu.style.display = 'none';
        }
    }

    // 4. 處理「檔案」下拉選單
    const fileMenu = document.getElementById('project-menu');
    const fileBtn = document.getElementById('btn-main-file');
    if (fileMenu && (fileMenu.style.display === 'flex' || fileMenu.style.display === 'block')) {
        if (!fileMenu.contains(e.target) && (!fileBtn || !fileBtn.contains(e.target))) {
            fileMenu.style.display = 'none';
        }
    }
    
    // 5. 處理右鍵選單 (Context Menu)
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu && contextMenu.style.display === 'block') {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    }
});

window.toggleMoreActionsMenu = function(event, type) {
    event.stopPropagation();
    const menuId = (type === 'library') ? 'more-actions-menu-lib' : 'more-actions-menu-qb';
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // 增強判斷可見性
    const isVisible = (menu.style.display === 'flex' || menu.style.display === 'block');
    
    if (typeof closeAllMenus === 'function') closeAllMenus(); // 先關閉所有其他選單

    // 如果原本是隱藏的，就打開它
    if (!isVisible) {
        menu.style.display = 'flex';
    }
};
window.getAutoAngleSettings = function() {
    const cached = localStorage.getItem('math_editor_auto_angle_settings');
    if (cached) {
        try { return JSON.parse(cached); } catch(e){}
    }
    // 系統預設值
    return { arcRadius: 18, textOffset: 15, textOnlyDist: 15 };
};

window.openAutoAngleSettingsModal = function() {
    const settings = window.getAutoAngleSettings();
    document.getElementById('setting-arc-radius').value = settings.arcRadius;
    document.getElementById('setting-text-offset').value = settings.textOffset;
    document.getElementById('setting-text-only-dist').value = settings.textOnlyDist;
    closeAllMenus();
    document.getElementById('auto-angle-settings-modal').style.display = 'flex';
};

window.saveAutoAngleSettings = function() {
    const settings = {
        arcRadius: parseFloat(document.getElementById('setting-arc-radius').value) || 18,
        textOffset: parseFloat(document.getElementById('setting-text-offset').value) || 15,
        textOnlyDist: parseFloat(document.getElementById('setting-text-only-dist').value) || 15
    };
    localStorage.setItem('math_editor_auto_angle_settings', JSON.stringify(settings));
    document.getElementById('auto-angle-settings-modal').style.display = 'none';
    if(typeof statusText !== 'undefined') statusText.innerText = "多角標註參數已儲存 (將套用於後續的標註)。";
};
window.getAutoLabelSettings = function() {
    const cached = localStorage.getItem('math_editor_auto_label_settings');
    if (cached) {
        try { return JSON.parse(cached); } catch(e){}
    }
    // 系統預設值
    return { fontSize: 20, distance: 28, isBold: true };
};

window.openAutoLabelSettingsModal = function(isContinuous = false) {
    const settings = window.getAutoLabelSettings();
    document.getElementById('setting-label-size').value = settings.fontSize;
    document.getElementById('setting-label-dist').value = settings.distance;
    document.getElementById('setting-label-bold').checked = settings.isBold;
    
    // 依據模式動態隱藏「距離」輸入框與更換標題
    const distRow = document.getElementById('row-label-dist');
    if (distRow) {
        distRow.style.display = isContinuous ? 'none' : 'flex';
    }
    const titleEl = document.querySelector('#auto-label-settings-modal .modal-header');
    if (titleEl) {
        titleEl.innerText = isContinuous ? '🅰️ 連續標字參數設定' : '🔠 頂點標註參數設定';
    }
    
    closeAllMenus();
    document.getElementById('auto-label-settings-modal').style.display = 'flex';
};

window.saveAutoLabelSettings = function() {
    const settings = {
        fontSize: parseFloat(document.getElementById('setting-label-size').value) || 20,
        distance: parseFloat(document.getElementById('setting-label-dist').value) || 28,
        isBold: document.getElementById('setting-label-bold').checked
    };
    localStorage.setItem('math_editor_auto_label_settings', JSON.stringify(settings));
    document.getElementById('auto-label-settings-modal').style.display = 'none';
    const title = document.querySelector('#auto-label-settings-modal .modal-header').innerText;
    if (title.includes('🅰️')) {
        if (typeof setMode === 'function') setMode('continuous-label');
    }	
    if(typeof statusText !== 'undefined') statusText.innerText = "頂點標註參數已儲存 (將套用於後續的標註)。";
};
window.adjustLabelStart = function(delta) {
    const input = document.getElementById('label-start-input');
    if (!input) return;
    
    // 目前系統的全域變數 labelIndex 代表字母順序 (0=A, 1=B ... 26=A1 ...)
    labelIndex += delta;
    if (labelIndex < 0) labelIndex = 0; // 防呆：不可小於 A
    
    // 更新輸入框顯示
    if (typeof indexToLabel === 'function') {
        input.value = indexToLabel(labelIndex);
    }
    
    if (typeof statusText !== 'undefined') {
        statusText.innerText = `下一個標註點已設定為：${input.value}`;
    }
};

// 【新增】長按連續觸發邏輯
let adjustLabelTimeout = null;
let adjustLabelInterval = null;

window.startAdjustLabel = function(delta) {
    // 按下時先執行一次單跳
    window.adjustLabelStart(delta);
    
    // 清除可能殘留的舊計時器
    window.stopAdjustLabel();
    
    // 設定長按計時器 (按下 600 毫秒後，認定為「長按」開始連續觸發)
    adjustLabelTimeout = setTimeout(() => {
        adjustLabelInterval = setInterval(() => {
            window.adjustLabelStart(delta);
        }, 100); // 連續觸發的速度 (每 100 毫秒跳一格)
    }, 600); 
};

window.stopAdjustLabel = function() {
    // 滑鼠放開或移出按鈕時，清除所有計時器
    if (adjustLabelTimeout) clearTimeout(adjustLabelTimeout);
    if (adjustLabelInterval) clearInterval(adjustLabelInterval);
};

window.previewCustomFormula = function() {
    const code = document.getElementById('custom-formula-code').value.trim();
    const previewEl = document.getElementById('custom-formula-preview');
    if (!code) {
        previewEl.innerHTML = "";
        return;
    }
    previewEl.innerHTML = "`" + code + "`";
    if (window.MathJax) {
        MathJax.typesetPromise([previewEl]).catch(err => console.error(err));
    }
};
window.openPenSettings = function() {
    openNumberInputModal("設定寫字筆平滑度\n(預設 8，數值越大越平滑)", PEN_SMOOTH_THRESHOLD.toString(), (val) => {
        let n = parseFloat(val);
        if (!isNaN(n) && n > 0) {
            PEN_SMOOTH_THRESHOLD = n;
            localStorage.setItem('math_editor_pen_smooth', n.toString());
            if (typeof statusText !== 'undefined') statusText.innerText = `寫字筆平滑度已設定為 ${n}，並已啟用該工具`;
            if (typeof toggleDrawTool === 'function') {
                if (mode !== 'draw' || currentTool !== 'pen') {
                    toggleDrawTool('pen');
                }
            }
        }
    });
    // 【修正】在 open 執行完（已清空 class）之後，再幫寫字筆功能加回左側定位
    document.getElementById('number-input-modal').classList.add('param-positioned-modal');
};

window.getVisibleCanvasCenter = function() {
    const svgCanvas = document.getElementById('svg-canvas');
    const container = document.getElementById('editor-container') || document.body;
    if (!svgCanvas) return { x: 400, y: 300 };

    const containerRect = container.getBoundingClientRect();
    // 抓取可視區域 (viewport) 的中心點
    const viewCenterX = containerRect.left + containerRect.width / 2;
    const viewCenterY = containerRect.top + containerRect.height / 2;

    let pt = svgCanvas.createSVGPoint();
    pt.x = viewCenterX;
    pt.y = viewCenterY;
    
    const ctm = svgCanvas.getScreenCTM();
    if (ctm) {
        // 將螢幕座標轉換為 SVG 內部座標
        pt = pt.matrixTransform(ctm.inverse());
        
        // 限制在畫布範圍內，避免因捲動超出邊界而跑到畫布外的虛無空間
        const w = parseFloat(svgCanvas.getAttribute('width')) || 800;
        const h = parseFloat(svgCanvas.getAttribute('height')) || 600;
        const cx = Math.max(0, Math.min(w, pt.x));
        const cy = Math.max(0, Math.min(h, pt.y));
        return { x: cx, y: cy };
    }
    
    // 備援方案
    return { 
        x: parseFloat(svgCanvas.getAttribute('width') || 800) / 2, 
        y: parseFloat(svgCanvas.getAttribute('height') || 600) / 2 
    };
};
window.deletePolylineSegment = function(shape, clickX, clickY) {
    if (!shape || shape.getAttribute('data-tool') !== 'polyline') return;
    
    const ptsStr = shape.getAttribute('points');
    if (!ptsStr) return;
    
    let pts = ptsStr.trim().split(/\s+|,/).filter(v => v !== '').reduce((acc, val, i, arr) => {
        if (i % 2 === 0) acc.push({ x: +val, y: +arr[i+1] });
        return acc;
    },[]);

    if (pts.length < 3) {
        statusText.innerText = "折線點數過少，無法繼續刪除折段。";
        return;
    }

    // 將滑鼠座標從全域轉回局部 (防範如果有外層 transform)
    let localPt = { x: clickX, y: clickY };
    try {
        const mInv = shape.getCTM().inverse();
        let p = svgCanvas.createSVGPoint(); p.x = clickX; p.y = clickY;
        const t = p.matrixTransform(mInv); 
        localPt = { x: t.x, y: t.y };
    } catch(e) {}

    // 尋找被點擊的線段索引
    let targetEdgeIdx = -1;
    let minD = Infinity;
    
    for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i+1];
        // 直接使用 localPt 進行計算，因為 pts 本來就是 local 座標
        const d = distToSegment(localPt.x, localPt.y, p1.x, p1.y, p2.x, p2.y);
        
        if (d < 30 && d < minD) {
            minD = d;
            targetEdgeIdx = i;
        }
    }

    if (targetEdgeIdx !== -1) {
        // 從該線段開始截斷 (保留 targetEdgeIdx 之前的點，以及線段起點)
        // 也就是說，被點擊的線段與其後面的點全被刪除
        const newPts = pts.slice(0, targetEdgeIdx + 1);
        
        if (newPts.length < 2) {
            statusText.innerText = "刪除後折線將不足兩點，無法執行。若需刪除請直接刪除整個物件。";
            return;
        }

        // 更新 Polyline
        shape.setAttribute('points', newPts.map(p => `${p.x},${p.y}`).join(' '));
        
        // 刪除被遺棄的折點圖示 (polyline_point)
        const pointGroups = document.querySelectorAll(`[data-owner-shape="${shape.id}"][data-dependency-type="polyline_point"]`);
        pointGroups.forEach(pt => {
            const idx = parseInt(pt.getAttribute('data-vertex-index'));
            if (idx > targetEdgeIdx) {
                pt.remove();
            }
        });
        
        // 更新把手
        if (selectedElements.includes(shape)) {
            drawHandles(shape);
        }

        // 更新連動物件
        if (typeof updateDependentShapes === 'function') updateDependentShapes(shape);
        if (typeof updateLabelPositions === 'function') updateLabelPositions(shape);
        
        saveState();
        statusText.innerText = `已從點擊處刪除折段 (剩餘 ${newPts.length} 點)`;
    } else {
        statusText.innerText = "無法定位點擊位置所在的折段";
    }
};
window.toggleSidebarGroup = function(groupId) {
    const content = document.getElementById('content-' + groupId);
    const icon = document.getElementById('icon-' + groupId);
    if (!content || !icon) return;

    let states = JSON.parse(localStorage.getItem('math_editor_group_states') || '{}');
    
    if (content.style.display === 'none') {
        content.style.display = ''; // 恢復預設的 grid 顯示
        icon.style.transform = 'rotate(0deg)';
        states[groupId] = 'open';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
        states[groupId] = 'closed';
    }
    localStorage.setItem('math_editor_group_states', JSON.stringify(states));
};

window.applySidebarGroupStates = function() {
    let states;
    const savedStates = localStorage.getItem('math_editor_group_states');
    
    // 【核心修正】如果本地沒有儲存過狀態（例如第一次開啟或無痕模式），則使用系統預設值
    if (!savedStates) {
        states = {
            "line_group": "open",
            "tri_group": "open",
            "quad_group": "open",
            "circle_group": "closed",
            "solid_group": "closed",
            "stats_group": "closed",
            "other_group": "closed"
        };
    } else {
        states = JSON.parse(savedStates);
    }
    
    const groups =['line_group', 'tri_group', 'quad_group', 'circle_group', 'solid_group', 'stats_group', 'other_group'];
    groups.forEach(groupId => {
        if (states[groupId] === 'closed') {
            const content = document.getElementById('content-' + groupId);
            const icon = document.getElementById('icon-' + groupId);
            if (content) content.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(-90deg)';
        }
    });
};

// 將 applyToolbarVisibility 與 applySidebarGroupStates 統一加入到初始化載入清單中
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { 
        if(window.renderCustomMarksMenu) window.renderCustomMarksMenu(); 
        if(window.applyToolbarVisibility) window.applyToolbarVisibility(); 
        if(window.applySidebarGroupStates) window.applySidebarGroupStates(); // <--- 載入收合狀態
    }, 500);
});

window.toggleSharedEdgeMenu = function() {
    const menu = document.getElementById('menu-shared-edge');
    const btnWrapper = document.getElementById('btn-shared-edge').parentNode;
    const isVisible = (menu.style.display === 'flex');
    closeAllMenus();
    if (!isVisible) {
        fixMenuPosition('menu-shared-edge', btnWrapper);
    }
};