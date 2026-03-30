/* --- page_manager.js (多頁面與簡報模式核心) --- */

let mathPages = [];
let currentPageIndex = 0;
let isDraggingToolbar = false;
let toolbarOffsetX, toolbarOffsetY;
let lastWheelTime = 0; 

// 初始化頁面管理器
function initPageManager() {
    mathPages = [createEmptyPageData()];
    currentPageIndex = 0;
    renderPageTabs();
}

// 建立空白頁面資料結構
function createEmptyPageData() {
    return {
        id: 'page-' + Date.now() + Math.floor(Math.random() * 1000),
        shapes: '',
        bg: '',
        bgClass: '',
        showAssistGrid: false, // 【新增】獨立的輔助格線狀態，預設為 false
        actionHistory: [], 
        historyIndex: -1
    };
}

// 將當前畫布狀態儲存到記憶體中
function saveCurrentPageToMemory() {
    if (!mathPages[currentPageIndex]) return;
    mathPages[currentPageIndex].shapes = document.getElementById('shapes-layer').innerHTML;
    mathPages[currentPageIndex].bg = document.getElementById('background-layer').innerHTML;
    mathPages[currentPageIndex].bgClass = document.getElementById('drawing-area').className;
    // 【新增】儲存當前的輔助格線狀態
    mathPages[currentPageIndex].showAssistGrid = svgCanvas.classList.contains('grid-bg-css');
    mathPages[currentPageIndex].actionHistory = [...actionHistory]; 
    mathPages[currentPageIndex].historyIndex = historyIndex;
}

// 從記憶體載入頁面到畫布
function loadPageToCanvas(index) {
    const p = mathPages[index];
    if (!p) return;
    
    document.getElementById('shapes-layer').innerHTML = p.shapes;
    document.getElementById('background-layer').innerHTML = p.bg;
    document.getElementById('drawing-area').className = p.bgClass || '';
	
    // 1. 處理右側「輔助格線」按鈕
    const assistGridBtn = document.getElementById('btn-toggle-grid');
    if (p.showAssistGrid) {
        svgCanvas.classList.add('grid-bg-css');
        if (assistGridBtn) assistGridBtn.classList.add('active');
    } else {
        svgCanvas.classList.remove('grid-bg-css');
        if (assistGridBtn) assistGridBtn.classList.remove('active');
    }
    
    // 恢復該頁的 Undo 紀錄
    actionHistory = [...p.actionHistory];
    historyIndex = p.historyIndex;
    
    deselectAll();
    if (typeof updateGroupStatusUI === 'function') updateGroupStatusUI();
    if (typeof renderPropertyPanel === 'function') renderPropertyPanel(null);
    
    // 2. 處理上方「實體方格圖」按鈕
    const realGridBtn = document.getElementById('btn-real-grid');
    if (realGridBtn) {
        const hasGrid = document.getElementById('background-layer').children.length > 0;
        if (hasGrid) {
            realGridBtn.classList.add('active');
            realGridBtn.innerHTML = '🗑️ 清除方格';
        } else {
            realGridBtn.classList.remove('active');
            realGridBtn.innerHTML = '▦ 方格圖';
        }
    }
}

// 切換頁面
function switchPage(index) {
    if (index < 0 || index >= mathPages.length || index === currentPageIndex) return;
    
    saveCurrentPageToMemory();
    currentPageIndex = index;
    loadPageToCanvas(currentPageIndex);
    
    renderPageTabs();
    updatePresentPageInfo();
    statusText.innerText = `已切換至第 ${currentPageIndex + 1} 頁`;
}

// 新增空白頁
function addNewPage() {
    saveCurrentPageToMemory();
    mathPages.push(createEmptyPageData());
    currentPageIndex = mathPages.length - 1;
    loadPageToCanvas(currentPageIndex);
    
    // 初始化第一步 Undo 紀錄
    if (typeof saveState === 'function') saveState();
    
    renderPageTabs();
    updatePresentPageInfo();
    statusText.innerText = `已新增第 ${currentPageIndex + 1} 頁`;
}

// 複製當前頁
function duplicatePage() {
    saveCurrentPageToMemory();
    const curr = mathPages[currentPageIndex];
    const newPage = {
        id: 'page-' + Date.now(),
        shapes: curr.shapes,
        bg: curr.bg,
        bgClass: curr.bgClass,
        actionHistory: [...curr.actionHistory],
        historyIndex: curr.historyIndex
    };
    mathPages.splice(currentPageIndex + 1, 0, newPage);
    currentPageIndex++;
    loadPageToCanvas(currentPageIndex);
    
    renderPageTabs();
    updatePresentPageInfo();
    statusText.innerText = `已複製並切換至新頁面`;
}

// 刪除頁面
function deletePage(index, event) {
    if(event) event.stopPropagation();
    if (mathPages.length <= 1) {
        showAlert("這是最後一頁，無法刪除！");
        return;
    }
    
    showConfirm(`確定要刪除第 ${index + 1} 頁嗎？`, () => {
        mathPages.splice(index, 1);
        
        if (currentPageIndex >= mathPages.length) {
            currentPageIndex = mathPages.length - 1;
        } else if (currentPageIndex > index) {
            currentPageIndex--;
        }
        
        loadPageToCanvas(currentPageIndex);
        renderPageTabs();
        updatePresentPageInfo();
        statusText.innerText = `已刪除頁面`;
    });
}

// 渲染底部頁面標籤 UI
function renderPageTabs() {
    const bar = document.getElementById('page-bar-container');
    if (!bar) return;
    bar.innerHTML = ''; // 清空容器

    const total = mathPages.length;
    const current = currentPageIndex + 1;

    // --- 1. 左側功能區 (新增/複製) ---
    const addBtn = createNavBtn('➕', '新增空白頁', addNewPage);
    const dupBtn = createNavBtn('📑', '複製當前頁', duplicatePage);
    
    // --- 2. 中間導覽區 ---
    const firstBtn = createNavBtn('⏮', '第一頁', () => switchPage(0));
    firstBtn.disabled = (currentPageIndex === 0);

    const prevBtn = createNavBtn('◀', '上一頁', () => switchPage(currentPageIndex - 1));
    prevBtn.disabled = (currentPageIndex === 0);

    // 頁碼顯示 (可點擊)
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info-display';
    pageInfo.innerText = `第 ${current} / ${total} 頁`;
    pageInfo.title = '點擊開啟快速跳頁清單';
    pageInfo.onclick = (e) => {
        e.stopPropagation();
        togglePageListPopup();
    };

    // 頁面清單彈窗 (隱藏容器)
    const popup = document.createElement('div');
    popup.id = 'page-list-popup';
    // 填充清單內容
    mathPages.forEach((p, i) => {
        const item = document.createElement('div');
        item.className = `page-list-item ${i === currentPageIndex ? 'current' : ''}`;
        item.innerHTML = `<span>第 ${i + 1} 頁</span>`;
        item.onclick = () => {
            switchPage(i);
            popup.style.display = 'none';
        };
        popup.appendChild(item);
    });
    // 將彈窗加入 bar (或是 body 也可以，但 bar 有 relative 定位比較好算)
    bar.appendChild(popup);

    const nextBtn = createNavBtn('▶', '下一頁', () => switchPage(currentPageIndex + 1));
    nextBtn.disabled = (currentPageIndex === total - 1);

    const lastBtn = createNavBtn('⏭', '最末頁', () => switchPage(total - 1));
    lastBtn.disabled = (currentPageIndex === total - 1);

    // --- 3. 右側功能區 (刪除) ---
    const savePageBtn = createNavBtn('💾', '匯出單頁 (JSON)', saveSinglePage); // <--- 新增此按鈕
    
    const delBtn = createNavBtn('🗑️', '刪除當前頁', () => deletePage(currentPageIndex));
    delBtn.style.color = '#c0392b'; // 紅色警示

    // --- 4. 組裝 DOM ---
    bar.appendChild(addBtn);
    bar.appendChild(dupBtn);
    bar.appendChild(createDivider());
    
    bar.appendChild(firstBtn);
    bar.appendChild(prevBtn);
    bar.appendChild(pageInfo);
    bar.appendChild(nextBtn);
    bar.appendChild(lastBtn);
    
    bar.appendChild(createDivider());
    bar.appendChild(savePageBtn); // <--- 將儲存按鈕加在垃圾桶的左邊
    bar.appendChild(delBtn);
}

// 輔助：建立導覽按鈕
function createNavBtn(text, title, onClick) {
    const btn = document.createElement('button');
    btn.className = 'page-nav-btn';
    btn.innerText = text;
    btn.title = title;
    btn.onclick = onClick;
    return btn;
}

// 輔助：建立分隔線
function createDivider() {
    const div = document.createElement('div');
    div.className = 'page-bar-divider';
    return div;
}

// 輔助：切換頁面清單顯示
function togglePageListPopup() {
    const popup = document.getElementById('page-list-popup');
    if (popup) {
        const isVisible = popup.style.display === 'flex';
        popup.style.display = isVisible ? 'none' : 'flex';
        
        // 自動捲動到當前頁
        if (!isVisible) {
            const currentItem = popup.querySelector('.current');
            if (currentItem) currentItem.scrollIntoView({ block: 'center' });
        }
    }
}

// 全局點擊關閉頁面清單 (加在 window click 監聽器中)
window.addEventListener('click', (e) => {
    const popup = document.getElementById('page-list-popup');
    const trigger = document.querySelector('.page-info-display');
    if (popup && popup.style.display === 'flex') {
        if (!popup.contains(e.target) && e.target !== trigger) {
            popup.style.display = 'none';
        }
    }
});

// --- 簡報瀏覽模式 (Presentation Mode) ---

function togglePresentationMode() {
    const body = document.body;
    const isPresenting = body.classList.contains('presentation-mode');
    const toolbar = document.querySelector('.present-toolbar');
    
    if (isPresenting) {
        body.classList.remove('presentation-mode');
        setMode('select');
        statusText.innerText = "已回到編輯模式";

        toolbar.removeEventListener('mousedown', onToolbarMouseDown);
        window.removeEventListener('mousemove', onToolbarMouseMove);
        window.removeEventListener('mouseup', onToolbarMouseUp);
        
        // 【新增】移除滾輪監聽
        window.removeEventListener('wheel', onPresentWheel);

        toolbar.style.left = '50%';
        toolbar.style.top = '';
        toolbar.style.bottom = '30px';
        toolbar.style.transform = 'translateX(-50%)';

    } else {
        body.classList.add('presentation-mode');
        setMode('select'); 
        updatePresentPageInfo();
        statusText.innerText = "播放模式：滾輪或左右鍵換頁，ESC 離開。";

        toolbar.addEventListener('mousedown', onToolbarMouseDown);
        window.addEventListener('mousemove', onToolbarMouseMove);
        window.addEventListener('mouseup', onToolbarMouseUp);
        
        // 【新增】註冊滾輪監聽 (需設定 { passive: false } 才能阻止預設捲動)
        window.addEventListener('wheel', onPresentWheel, { passive: false });
    }
}

function presentNext() {
    if (currentPageIndex < mathPages.length - 1) switchPage(currentPageIndex + 1);
}

function presentPrev() {
    if (currentPageIndex > 0) switchPage(currentPageIndex - 1);
}

function updatePresentPageInfo() {
    const info = document.getElementById('present-page-info');
    if(info) info.innerText = `${currentPageIndex + 1} / ${mathPages.length}`;
}

// 攔截並擴充原有的 setMode，以同步簡報工具列的按鈕狀態
const originalSetMode = window.setMode;
window.setMode = function(newMode, tool = null) {
    if(originalSetMode) originalSetMode(newMode, tool);
    
    const btnSel = document.getElementById('btn-present-select');
    const btnDrw = document.getElementById('btn-present-draw');
    if(btnSel && btnDrw) {
        btnSel.classList.remove('active');
        btnDrw.classList.remove('active');
        if(newMode === 'select') btnSel.classList.add('active');
        if(newMode === 'draw' && tool === 'freehand') btnDrw.classList.add('active');
    }
};

// 用於 Header 下拉選單
function toggleProjectMenu() {
    const menu = document.getElementById('project-menu');
    const isVisible = menu.style.display === 'flex';
    
    // 關閉其他可能開啟的選單
    if (typeof closeAllMenus === 'function') closeAllMenus();
    
    menu.style.display = isVisible ? 'none' : 'flex';
}

// 簡報模式：跳至第一頁
function presentGoToStart() {
    switchPage(0);
}

// 簡報模式：跳至最後一頁
function presentGoToEnd() {
    switchPage(mathPages.length - 1);
}

// 簡報模式：開啟跳頁輸入框
function presentJumpToPage() {
    const promptTitle = `跳至頁面 (共 ${mathPages.length} 頁)`;
    const currentPageDisplay = currentPageIndex + 1; // 顯示給使用者的是 1-based 頁碼
    openNumberInputModal(promptTitle, currentPageDisplay.toString(), (val) => {
        const targetPage = parseInt(val, 10);
        if (isNaN(targetPage) || targetPage < 1 || targetPage > mathPages.length) {
            showAlert('無效的頁碼', `請輸入 1 到 ${mathPages.length} 之間的數字。`);
            return;
        }
        // 呼叫 switchPage 時需轉回 0-based 索引
        switchPage(targetPage - 1);
    });
}

function onToolbarMouseDown(e) {
    // 只在點擊工具列背景時觸發拖曳 (避開按鈕與文字)
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('span')) return;
    
    isDraggingToolbar = true;
    const toolbar = document.querySelector('.present-toolbar');
    
    // 1. 【關鍵修正】取得工具列當前在螢幕上的精確像素位置
    const rect = toolbar.getBoundingClientRect();
    
    // 2. 計算滑鼠點擊點相對於工具列左上角的偏移
    toolbarOffsetX = e.clientX - rect.left;
    toolbarOffsetY = e.clientY - rect.top;
    
    // 3. 【核心修正】立即將定位轉為 top/left 模式，並移除 bottom 和 transform
    // 這樣可以防止向上拉時高度被拉伸
    toolbar.style.bottom = 'auto'; 
    toolbar.style.transform = 'none';
    toolbar.style.left = `${rect.left}px`;
    toolbar.style.top = `${rect.top}px`;
    toolbar.style.margin = '0'; // 移除可能影響定位的 margin
    
    e.preventDefault(); 
}

function onToolbarMouseMove(e) {
    if (!isDraggingToolbar) return;
    
    const toolbar = document.querySelector('.present-toolbar');
    let newLeft = e.clientX - toolbarOffsetX;
    let newTop = e.clientY - toolbarOffsetY;

    // 邊界檢查 (防止工具列跑出視窗)
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const toolbarWidth = toolbar.offsetWidth;
    const toolbarHeight = toolbar.offsetHeight;

    if (newLeft < 0) newLeft = 0;
    if (newTop < 0) newTop = 0;
    if (newLeft + toolbarWidth > winWidth) newLeft = winWidth - toolbarWidth;
    if (newTop + toolbarHeight > winHeight) newTop = winHeight - toolbarHeight;

    // 更新位置 (只變動座標，不改變高度)
    toolbar.style.left = `${newLeft}px`;
    toolbar.style.top = `${newTop}px`;
}

function onToolbarMouseUp(e) {
    isDraggingToolbar = false;
}
// 處理簡報模式下的滑鼠滾輪換頁
function onPresentWheel(e) {
    // 只有在簡報模式下才執行
    if (!document.body.classList.contains('presentation-mode')) return;

    // 阻止頁面原本的捲動行為
    e.preventDefault();

    // 防止捲動過快 (設定 600 毫秒的間隔)
    const now = Date.now();
    if (now - lastWheelTime < 600) return;

    if (e.deltaY > 0) {
        // 向下滾 -> 下一頁
        if (currentPageIndex < mathPages.length - 1) {
            presentNext();
            lastWheelTime = now;
        }
    } else if (e.deltaY < 0) {
        // 向上滾 -> 上一頁
        if (currentPageIndex > 0) {
            presentPrev();
            lastWheelTime = now;
        }
    }
}