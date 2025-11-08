// teacher.js

document.addEventListener('DOMContentLoaded', function() {
  const firebaseConfig = {
	apiKey: "AIzaSyAVLFoqQlSR5NK_ZaWgL07eA2LMsfHT_Ew",
	authDomain: "classrecords-13902.firebaseapp.com",
	projectId: "classrecords-13902",
	storageBucket: "classrecords-13902.firebasestorage.app",
	messagingSenderId: "431747377367",
	appId: "1:431747377367:web:b157a485c59ce38091e892",
	measurementId: "G-JWTQGM9XMP"
  };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

	let currentUser = null, studentsData = [],
        allPerformanceScores = {},
        allClassList = [], visibleClassList = [], modalOrigin = null, rosterModalOrigin = null;

    let scheduleDataLoaded = false;
    let teacherTimetableData = null;
    let currentUserData = null;
    let classTotalScores = {};
    window.activeChanges = []; // 更改為 window 屬性，以便模組存取
    window.currentWeekStart = getMonday(new Date()); // 更改為 window 屬性，以便模組存取
    // 移除了 timetableIntervalId，改由模組內部管理
    
	const CACHE_KEY = 'teacher_static_cache_v6'; 
    let CACHE_DATA = {};
    
    const REFRESH_FLAG_KEY = 'teacherTimetableNeedsRefresh';
	
    let rosterSortState = 0;
    let classSortState = 0;
    let currentRosterClassId = null;
    let currentEntity = null;

    let editingRecordId = null;

    window.PERIOD_TIMES = []; // 更改為 window 屬性，以便模組存取
	
	let allPerformanceRecords = []; 
    let studentLatestRecords = {}; 
    let allScoresSnapshotUnsubscribe = null; 
	
    const appContainer = document.getElementById('app-container');
    const welcomeModal = document.getElementById('welcome-modal');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const recordsList = document.getElementById('records-list');
    const passwordResetOverlay = document.getElementById('password-reset-overlay');
    const changePasswordModal = document.getElementById('change-password-modal');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const classSettingsModal = document.getElementById('class-settings-modal');
    const classSettingsBtn = document.getElementById('class-settings-btn');
    const infoModal = document.getElementById('info-modal');
    // 課表相關的 DOM 元素也需要掛載到 window，以便模組存取
    window.myTimetableModal = document.getElementById('my-timetable-modal');
    window.myTimetableIconBtn = document.getElementById('my-timetable-icon-btn');
    window.myTimetableTitle = document.getElementById('my-timetable-title');
    window.myTimetableBody = document.getElementById('my-timetable-body');
    window.timetableMessage = document.getElementById('timetable-message');

    const homepageSettingsModal = document.getElementById('homepage-settings-modal');
    const homepageSettingsBtn = document.getElementById('homepage-settings-btn');
    const saveHomepageSettingsBtn = document.getElementById('save-homepage-settings-btn');
    const rosterSortBtn = document.getElementById('roster-sort-btn');
    const mainSortBtn = document.getElementById('main-sort-btn');
    const timetableLink = document.getElementById('timetable-link');
    
    const reloadCacheBtn = document.getElementById('reload-cache-btn');

    const saveRecordBtn = document.getElementById('save-record-btn');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const recordPointsInput = document.getElementById('record-points');
    const recordTextInput = document.getElementById('record-text');

    const scorePlusBtn = document.getElementById('score-plus-btn');
    const scoreMinusBtn = document.getElementById('score-minus-btn');
    const recordCountDisplay = document.getElementById('record-count-display');
    const recordTotalScoreDisplay = document.getElementById('record-total-score-display');
    const passwordResetForm = document.getElementById('password-reset-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const cpErrorMessage = document.getElementById('cp-error-message');
    const addRecordForm = document.getElementById('add-record-form');
    const rosterSortDownArrow = document.getElementById('roster-sort-down-arrow');
    const rosterSortUpArrow = document.getElementById('roster-sort-up-arrow');
    const mainSortDownArrow = document.getElementById('main-sort-down-arrow');
    const mainSortUpArrow = document.getElementById('main-sort-up-arrow');
    const rosterClickArea = document.getElementById('roster-click-area');
    const studentRosterModal = document.getElementById('student-roster-modal');
    const rosterClassName = document.getElementById('roster-class-name');
    const studentGridContainer = document.getElementById('student-grid-container');
    const selectAllVisibleClasses = document.getElementById('select-all-visible-classes');
    const classSettingsList = document.getElementById('class-settings-list');
    const saveClassSettingsBtn = document.getElementById('save-class-settings-btn');
    const resetWelcomePrefsBtn = document.getElementById('reset-welcome-prefs-btn');
    const homepageModalCloseBtn = homepageSettingsModal.querySelector('.close-btn');
	const TRANSFER_KEY = 'initialActiveChanges';
    let timetableModuleLoaded = false;
    
    // 將公用函數掛載到 window，以便模組存取
    window.getMonday = getMonday;
    window.formatDate = formatDate;
    window.getCurrentPeriodIndex = getCurrentPeriodIndex;
    window.openStudentRosterModal = openStudentRosterModal;
    window.loadActiveChanges = loadActiveChanges;
    // ------------------------------------------

	function navigateToTimetable() {
		// 1. 將當前載入的 activeChanges 數據存入 sessionStorage
		try {
			if (activeChanges && activeChanges.length > 0) {
				sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(activeChanges));
			}
			const selectorData = {
				classes: allClassList     
			};
			sessionStorage.setItem('initialScheduleSelectors', JSON.stringify(selectorData)); 

		} catch(e) {
			console.error("無法傳遞 activeChanges 數據:", e);
		}
		// 2. 導航至目標頁面
		window.location.href = 'timetable.html';
	}
	
	// 【新增】動態載入課表模組函數
    async function loadTimetableModule() {
        if (timetableModuleLoaded) {
            return true;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'teacher_timetable_module.js';
            script.onload = () => {
                timetableModuleLoaded = true;
                resolve(true);
            };
            script.onerror = (e) => {
                console.error("載入課表模組失敗:", e);
                reject(false);
            };
            document.body.appendChild(script);
        });
    }

	
    function getClassBlockColor(totalScore) {
        if (totalScore < 0) {
            return '#D9E2E9';
        } else if (totalScore < 10) {
            return '#D4EDDA';
        } else if (totalScore < 20) {
            return '#FFFACD';
        } else {
            return '#F8D7DA';
        }
    }

    function getMonday(d) {
        d = new Date(d);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay(),
            diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function formatDate(date, format = 'MM/DD') {
        if (!date) return '';
        const month = date.getMonth() + 1;
        const day = date.getDate();
        if (format === 'YYYY-MM-DD') {
            return `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return `${month}/${day}`;
    }

    async function loadActiveChanges() {
        if (!currentUser || !currentUser.uid) return;
		const cachedChanges = sessionStorage.getItem(TRANSFER_KEY);
		if (cachedChanges) {
			try {
				activeChanges = JSON.parse(cachedChanges);
				console.log('課表異動快取命中，無需重新讀取 Firestore！');
				sessionStorage.removeItem(TRANSFER_KEY); // 用完就清除
				return; // 成功從快取載入，退出函數
			} catch (e) {
				console.error('解析 Session 快取失敗，將強制從 Firestore 讀取。', e);
				// 繼續執行，讓程式碼進入下面的 Firestore 讀取作為備援
			}
		}
		try {
            const involvedQuery = db.collection('classChanges')
                                    .where('involvedTeacherIds', 'array-contains', currentUser.uid)
                                    .where('status', '==', 'active');

            const snapshot = await involvedQuery.get();
            activeChanges = [];
            snapshot.forEach(doc => {
                activeChanges.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error("載入課程異動時發生錯誤:", error);
            timetableMessage.textContent = '載入課程異動失敗。';
        }
     }


    function runMainApp() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                if (currentUser && currentUser.uid === user.uid) return;
                currentUser = user;
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().role === 'teacher') {
                    currentUserData = userDoc.data();
                    
                    try {
                        const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
                        if (cached && cached.userData && cached.userData.uid === user.uid) {
                            currentUserData = cached.userData;
                        }
                    } catch (e) {
                    }
                    
                    document.getElementById('user-email').textContent = currentUserData.displayName || user.email;
                    
                    if (currentUserData.passwordNeedsReset === true) {
                        showPasswordResetUI();
                    } else {
                        await initialize(currentUserData, false); 
                    }
                } else {
                    window.location.href = `login.html?from=teacher`;
                }
            } else {
                window.location.href = `login.html`;
            }
        });
    }

    const shouldShowWelcome = document.getElementById('welcome-modal') &&
                              localStorage.getItem('hideLoginWelcome') !== 'true' &&
                              sessionStorage.getItem('welcomeShownForSession') !== 'true';

    if (shouldShowWelcome) {
        sessionStorage.setItem('welcomeShownForSession', 'true');

        const closeWelcome = () => {
            if (document.getElementById('dont-show-again-login').checked) {
                localStorage.setItem('hideLoginWelcome', 'true');
            }
            document.getElementById('welcome-modal').style.display = 'none';
            runMainApp();
        };

        document.getElementById('close-welcome-btn').onclick = closeWelcome;
        document.getElementById('welcome-modal').querySelector('.close-btn').onclick = closeWelcome;

        document.getElementById('welcome-modal').style.display = 'flex';
    } else {
        runMainApp();
    }

    if (timetableLink) {
         // 註冊新的導航函數
         timetableLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            navigateToTimetable(); 
        });
    }

    function showPasswordResetUI() {
        document.querySelector('header').style.display = 'none';
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('password-reset-overlay').style.display = 'flex';
    }

    function getCurrentPeriodIndex() {
        if (PERIOD_TIMES.length === 0) return -1;

        const now = new Date();
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

        for (let i = 0; i < PERIOD_TIMES.length; i++) {
            const period = PERIOD_TIMES[i];

            const [startH, startM] = period.start.split(':').map(Number);

            let startTimeMinutes = startH * 60 + startM;
            let endTimeMinutes = startTimeMinutes + period.duration;

            const bufferMinutes = 5;
            startTimeMinutes = startTimeMinutes - bufferMinutes;
            endTimeMinutes = endTimeMinutes + bufferMinutes;

            if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes) {
                return i;
            }
        }
        return -1;
    }

    function highlightCurrentClass() {
        if (PERIOD_TIMES.length === 0 || !teacherTimetableData || !scheduleDataLoaded) return;

        document.querySelectorAll('.class-block').forEach(el => {
            el.classList.remove('current-class-highlight');
        });

        const now = new Date();
        const dayOfWeek = now.getDay();

        if (dayOfWeek < 1 || dayOfWeek > 5) return;

        const dayIndex = dayOfWeek - 1;

        const currentPeriodIndex = getCurrentPeriodIndex();

        if (currentPeriodIndex === -1) return;

        // 這裡需要使用 getDerivedCurrentUserSchedule 函數來獲取考慮了異動的課表
        let derivedSchedule = teacherTimetableData; 
        // 為了不依賴動態載入的模組，這裡簡單判斷。如果需要精準判斷，則必須等待模組載入。
        if (window.getDerivedCurrentUserSchedule) {
             derivedSchedule = window.getDerivedCurrentUserSchedule();
        }

        const periods = derivedSchedule.periods;

        const periodData = periods[currentPeriodIndex];
        if (periodData && periodData[dayIndex]) {
             let cellContent = periodData[dayIndex];
             let classCode = '';

             if (typeof cellContent === 'string') {
                 [classCode, ...rest] = cellContent.split(/\s+/);
             } else if (cellContent.class) {
                 classCode = cellContent.class;
             }

            if (classCode) {
                const targetCard = document.querySelector(`.class-block[data-class-id="${classCode}"]`);
                if (targetCard) {
                    targetCard.classList.add('current-class-highlight');
                }
            }
        }
    }

    // 【快取函數 1: 載入課程時間表】
    async function loadPeriodTimes(schoolId, useCache) {
        if (!schoolId) return;
        
        if (useCache && CACHE_DATA.PERIOD_TIMES) {
            PERIOD_TIMES = CACHE_DATA.PERIOD_TIMES;
            return;
        }

        try {
            const periodsDoc = await db.collection('schools').doc(schoolId)
                                       .collection('periods').doc('current').get();

            if (periodsDoc.exists && periodsDoc.data().times && periodsDoc.data().times.length > 0) {
                PERIOD_TIMES = periodsDoc.data().times.map(item => ({
                    period: item.period,
                    start: item.start,
                    duration: item.duration || 50
                }));
                PERIOD_TIMES.sort((a, b) => a.period - b.period);
            } else {
                console.warn("警告: 學校尚未設定課程時間表。使用預設值。");
                PERIOD_TIMES = [
                    { period: 1, start: '08:10', duration: 50 },
                    { period: 2, start: '09:10', duration: 50 },
                    { period: 3, start: '10:10', duration: 50 },
                    { period: 4, start: '11:10', duration: 50 },
                    { period: 5, start: '13:10', duration: 50 },
                    { period: 6, start: '14:10', duration: 50 },
                    { period: 7, start: '15:10', duration: 50 },
                    { period: 8, start: '16:10', duration: 50 }
                ];
            }
            CACHE_DATA.PERIOD_TIMES = PERIOD_TIMES; 
        } catch (error) {
            console.error("載入課程時間表時發生錯誤:", error);
            PERIOD_TIMES = [
                    { period: 1, start: '08:10', duration: 50 },
                    { period: 2, start: '09:10', duration: 50 },
                    { period: 3, start: '10:10', duration: 50 },
                    { period: 4, start: '11:10', duration: 50 },
                    { period: 5, start: '13:10', duration: 50 },
                    { period: 6, start: '14:10', duration: 50 },
                    { period: 7, start: '15:10', duration: 50 },
                    { period: 8, start: '16:10', duration: 50 }
                ];
        }
    }

    // 【快取函數 2: 載入教師課表】
    async function fetchScheduleData(teacherName, schoolId, useCache) {
        scheduleDataLoaded = false;
        teacherTimetableData = { periods: {} };
        
        if (useCache && CACHE_DATA.teacherTimetableData) {
            teacherTimetableData = CACHE_DATA.teacherTimetableData;
            scheduleDataLoaded = true;
            return;
        }
        
        try {
            const schoolRef = db.collection('schools').doc(schoolId);
            const scheduleDoc = await schoolRef.collection('timetables').doc(teacherName).get();

            if (scheduleDoc.exists) {
                teacherTimetableData = scheduleDoc.data();
                scheduleDataLoaded = true;
            } else {
                teacherTimetableData = { periods: {} };
            }
            
            CACHE_DATA.teacherTimetableData = teacherTimetableData; 

        } catch (error) {
            console.error("載入課表資料失敗:", error);
            teacherTimetableData = { periods: {} };
        }
    }

    // 【快取函數 3: 載入學生名冊】
    async function fetchRosterData(schoolId, useCache) {
        if (useCache && CACHE_DATA.rosterData) {
            studentsData = CACHE_DATA.rosterData;
            allClassList = CACHE_DATA.allClassList;
            return;
        }

        const rosterDoc = await db.collection('schools').doc(schoolId).collection('rosters').doc('current').get();
        if (!rosterDoc.exists) {
             throw new Error('找不到學校名冊');
        }
        studentsData = rosterDoc.data().students;
        allClassList = [...new Set(studentsData.map(s => s.id.substring(0, 3)))].sort(); 
        CACHE_DATA.rosterData = studentsData;
        CACHE_DATA.allClassList = allClassList;
    }

    // 【優化：分數 onSnapshot 監聽】
    async function fetchAllScores() {
        // 如果監聽器已經啟動，則不執行任何動作，讓它自己更新
        if (allScoresSnapshotUnsubscribe) {
             return;
        }
        
        allScoresSnapshotUnsubscribe = db.collection('performanceRecords').doc(currentUser.uid).collection('records')
          .onSnapshot(snapshot => {
            
            allPerformanceScores = {};
            classTotalScores = {};
            allPerformanceRecords = [];
			studentLatestRecords = {}; 
			  
            snapshot.forEach(doc => {
                const r = doc.data();
                r.id = doc.id;
                allPerformanceRecords.push(r);

                const p = r.points || 0;
                const type = r.entityType || 'student';
                const id = r.entityId || r.studentId;
                if (!id) return;

                if (type === 'student') {
                    const studentId = id;
                    if (!allPerformanceScores[studentId]) allPerformanceScores[studentId] = 0;
                    allPerformanceScores[studentId] += p;
                }
                else if (type === 'class') {
                    const classId = id;
                    if (!classTotalScores[classId]) classTotalScores[classId] = 0;
                    classTotalScores[classId] += p;
                }
            });

            studentsData.forEach(student => {
                const studentId = student.id;
                const className = studentId.substring(0, 3);
                const score = allPerformanceScores[studentId] || 0;

                classTotalScores[className] = (classTotalScores[className] || 0) + score;
            });
			  
			studentsData.forEach(student => {
                const studentRecords = allPerformanceRecords.filter(r => 
                     (r.entityId === student.id || r.studentId === student.id) && (r.entityType === 'student' || !r.entityType)
                ).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)); 
                
                studentLatestRecords[student.id] = null; 

                for (const record of studentRecords) {
                    const hasText = record.text && record.text.trim() !== '';
                    const hasNoPoints = (record.points === undefined || record.points === null || record.points === 0);
                    
                    if (hasText) {
                        studentLatestRecords[student.id] = {
                            latestComment: record.text,
                            needsHighlight: hasNoPoints 
                        };
                        break; 
                    }
                }
            });
			  
            renderLayout();
            highlightCurrentClass();

            if (modal.style.display === 'flex' && currentEntity) {
                renderModalRecords(currentEntity.id, currentEntity.type);
            } else if (studentRosterModal.style.display === 'flex' && currentRosterClassId) {
                renderStudentRoster(currentRosterClassId);
            }
            
            
        }, error => {
            console.error("監聽紀錄失敗:", error);
        });
    }

	async function initialize(userData, forceReload = false) {
        
        const schoolId = userData.schoolId;
        const teacherName = userData.displayName;
        appContainer.innerHTML = '<h2>載入中...</h2>';
        
        let useCache = false;
        
        // --- 1. 嘗試使用快取加速載入 ---
        if (!forceReload) {
            try {
                const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
                if (cached && cached.userData && cached.userData.uid === currentUser.uid && cached.rosterData && cached.rosterData.length > 0) {
                    CACHE_DATA = cached;
                    useCache = true;
                    
                    studentsData = CACHE_DATA.rosterData;
                    allClassList = CACHE_DATA.allClassList;
                    teacherTimetableData = CACHE_DATA.teacherTimetableData || { periods: {} };
                    PERIOD_TIMES = CACHE_DATA.PERIOD_TIMES || [];
                    scheduleDataLoaded = true; 
                    currentUserData = CACHE_DATA.userData; 
                    console.log('快取命中，加速載入基本資料...');
                }
            } catch (e) {
                console.error('快取讀取錯誤或損壞:', e);
                localStorage.removeItem(CACHE_KEY); 
                forceReload = true; 
                useCache = false;
            }
        }


        try {
            
            if (!useCache) {
                currentUserData = userData; 
            }
            visibleClassList = currentUserData.visibleClasses || [];
            
            // --- 【優化核心：並行載入快取/網路數據】 ---
            const periodsPromise = loadPeriodTimes(schoolId, useCache);
            const rosterPromise = fetchRosterData(schoolId, useCache);
            const schedulePromise = fetchScheduleData(teacherName, schoolId, useCache);
            const timetableModulePromise = loadTimetableModule(); // 【新增】嘗試載入課表模組 (非必要等待)

            await Promise.all([periodsPromise, rosterPromise, schedulePromise]);
            // --- 【並行載入結束】 ---

            // --- 數據整合與快取寫入 ---
            if (visibleClassList.length === 0 && allClassList.length > 0) {
                const taughtClasses = new Set();
                if (teacherTimetableData && teacherTimetableData.periods) {
                    Object.values(teacherTimetableData.periods).forEach(dayArray => {
                        dayArray.forEach(cellContent => {
                            if (typeof cellContent === 'string' && cellContent.trim() !== '') {
                                const classCode = cellContent.split(/\s+/)[0]; 
                                if (classCode && allClassList.includes(classCode)) {
                                    taughtClasses.add(classCode);
                                }
                            }
                        });
                    });
                }
                visibleClassList = Array.from(taughtClasses).sort();
            } 

            if (!useCache || forceReload) {
                CACHE_DATA.userData = currentUserData; 
                localStorage.setItem(CACHE_KEY, JSON.stringify(CACHE_DATA));
            }

			const needsRefresh = localStorage.getItem(REFRESH_FLAG_KEY) === 'true';

            // 載入異動的條件：強制刷新 (點擊 reload) / 異動發生 (從 login 或子頁面返回)
            if (needsRefresh || forceReload) {
                await loadActiveChanges(); // 執行 Firestore 讀取
                localStorage.removeItem(REFRESH_FLAG_KEY); // 清除旗標
            }
			
            // --- 啟動分數 onSnapshot 監聽 ---
            await fetchAllScores(); 
            setInterval(highlightCurrentClass, 30000);

            highlightCurrentClass();

			const preference = localStorage.getItem('homepagePreference');
			if (preference === 'timetable') {
				// 確保模組已經載入，再點擊按鈕
                await timetableModulePromise;
				setTimeout(() => {
					myTimetableIconBtn.click();
				}, 100);
			}

            rosterSortBtn.addEventListener('click', toggleRosterSort);
            mainSortBtn.addEventListener('click', toggleClassSort);
            reloadCacheBtn.addEventListener('click', () => initialize(currentUserData, true)); 

            updateSortButtonDisplay(0, rosterSortDownArrow, rosterSortUpArrow, 'var(--primary-color)', 'roster');
            updateSortButtonDisplay(0, mainSortDownArrow, mainSortUpArrow, '#f4d03f', 'main');

            saveRecordBtn.addEventListener('click', handleAddRecord);
            recordsList.addEventListener('click', handleDeleteRecord);

            btnCancelEdit.addEventListener('click', resetPerformanceForm);

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    highlightCurrentClass();
                }
            });


        } catch (error) {
            console.error("初始化失敗:", error);
            document.getElementById('app-container').innerHTML = `<h2>載入資料失敗: ${error.message || '請檢查網路連線。'}</h2>`;
        }
    }


    function renderLayout() {
        appContainer.innerHTML = '';
        let classesToRender = allClassList.filter(className => visibleClassList.includes(className));

        if (classSortState === 1) {
             classesToRender.sort((a, b) => (classTotalScores[b] || 0) - (classTotalScores[a] || 0) || a.localeCompare(b));
        } else if (classSortState === 2) {
             classesToRender.sort((a, b) => (classTotalScores[a] || 0) - (classTotalScores[b] || 0) || a.localeCompare(b));
        } else {
             classesToRender.sort((a, b) => a.localeCompare(b));
        }


        if (classesToRender.length === 0 && allClassList.length > 0) {
            appContainer.innerHTML = '<h3>沒有設定要顯示的班級。請點擊下拉選單中的「班級顯示設定」。</h3>';
            return;
        }

        classesToRender.forEach(className => {

            const totalScore = classTotalScores[className] !== undefined ? classTotalScores[className] : 0;
            const backgroundColor = getClassBlockColor(totalScore);

            const classBlock = document.createElement('div');
            classBlock.className = 'class-block';
            classBlock.style.backgroundColor = backgroundColor;
            classBlock.dataset.classId = className;

            const titleDiv = document.createElement('div');
            titleDiv.className = 'class-block-title';
            titleDiv.textContent = `${className} 班`;
            titleDiv.title = '點擊以紀錄班級共同事件';
            titleDiv.addEventListener('click', () => openModal(className, 'class', 'main'));

            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'class-total-score';
            scoreDiv.textContent = `總分: ${totalScore.toFixed(1)}`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'class-block-actions';

            const studentBtn = document.createElement('button');
            studentBtn.innerHTML = '🧑‍🎓';
            studentBtn.title = '開啟學生名單';
	        studentBtn.addEventListener('click', () => openStudentRosterModal(className, 'main'));

            const gradesLink = document.createElement('a');
            gradesLink.href = `./grades.html?class=${className}`;
            gradesLink.innerHTML = '📋';
            gradesLink.title = '前往成績登錄';

            actionsDiv.appendChild(studentBtn);
            actionsDiv.appendChild(gradesLink);

            classBlock.appendChild(titleDiv);
            classBlock.appendChild(scoreDiv);
            classBlock.appendChild(actionsDiv);

            appContainer.appendChild(classBlock);
        });
    }

    function updateSortButtonDisplay(state, downArrowEl, upArrowEl, activeColor, type) {

		if (state === 0) {
            downArrowEl.classList.remove('active');
            upArrowEl.classList.remove('active');
            downArrowEl.style.color = type === 'main' ? 'white' : '#999';
            upArrowEl.style.color = type === 'main' ? 'white' : '#999';
        } else if (state === 1) {
            downArrowEl.classList.add('active');
            upArrowEl.classList.remove('active');
            downArrowEl.style.color = activeColor;
            upArrowEl.style.color = type === 'main' ? 'white' : '#999';
        } else if (state === 2) {
            upArrowEl.classList.add('active');
            downArrowEl.classList.remove('active');
            downArrowEl.style.color = type === 'main' ? 'white' : '#999';
            upArrowEl.style.color = activeColor;
        }
    }

    function toggleRosterSort() {
        const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

        rosterSortState = (rosterSortState + 1) % 3;
        updateSortButtonDisplay(rosterSortState, rosterSortDownArrow, rosterSortUpArrow, activeColor, 'roster');

        if (document.getElementById('student-roster-modal').style.display === 'flex' && currentRosterClassId) {
            renderStudentRoster(currentRosterClassId);
        }
    }

    function toggleClassSort() {
        classSortState = (classSortState + 1) % 3;
        updateSortButtonDisplay(classSortState, mainSortDownArrow, mainSortUpArrow, '#f4d03f', 'main');

        renderLayout();

        highlightCurrentClass();
    }

	function openStudentRosterModal(className, origin = 'main') {
		rosterModalOrigin = origin;
		document.body.classList.add('modal-open');

        currentRosterClassId = className;

        if (origin !== 'timetable') {
            rosterSortState = 0;
        }

        updateSortButtonDisplay(rosterSortState, rosterSortDownArrow, rosterSortUpArrow, 'var(--primary-color)', 'roster');

        const totalScore = classTotalScores[className] !== undefined ? classTotalScores[className] : 0;

        rosterClassName.textContent = `${className} 班 學生名單`;
        document.getElementById('roster-total-score-display').textContent = `(累積總分: ${totalScore.toFixed(1)})`;

		rosterClickArea.title = '點擊以紀錄班級共同事件';
		rosterClickArea.onclick = (e) => {
            if (!e.target.closest('#roster-sort-btn')) {
                document.getElementById('student-roster-modal').style.display = 'none';
                openModal(className, 'class', 'roster');
            }
		};

        renderStudentRoster(className);
		document.getElementById('student-roster-modal').style.display = 'flex';
	}

    function renderStudentRoster(className) {
        studentGridContainer.innerHTML = '';

        let studentsToRender = studentsData
			.filter(s => s.id.startsWith(className));

        if (rosterSortState === 1) {
             studentsToRender.sort((a, b) => (allPerformanceScores[b.id] || 0) - (allPerformanceScores[a.id] || 0) || a.id.localeCompare(b.id));
        } else if (rosterSortState === 2) {
             studentsToRender.sort((a, b) => (allPerformanceScores[a.id] || 0) - (allPerformanceScores[b.id] || 0) || a.id.localeCompare(b.id));
        } else {
             studentsToRender.sort((a, b) => a.id.localeCompare(b.id));
        }


		if (studentsToRender.length === 0) {
			studentGridContainer.innerHTML = '<p>此班級查無學生。</p>';
		} else {
			studentsToRender.forEach(student => {
				const studentBlock = document.createElement('div');
				studentBlock.title = `點擊以紀錄 ${student.name} 的表現`;

				const score = allPerformanceScores[student.id] || 0;
				let scoreClass = '';
				if (score < 0) {
					scoreClass = 'score-negative';
				} else if (score > 0 && score < 5) {
					scoreClass = 'score-positive-low';
				} else if (score >= 5) {
					scoreClass = 'score-positive-high';
				}
				studentBlock.className = 'student-block ' + scoreClass;

				const latestRecordInfo = studentLatestRecords[student.id];
                let latestCommentHtml = '';

                if (latestRecordInfo) {
                    // 1. 應用藍框標註
                    if (latestRecordInfo.needsHighlight) {
                        studentBlock.classList.add('highlight-no-score');
                    }
                    // 2. 準備最小字體顯示文字
                    if (latestRecordInfo.needsHighlight && latestRecordInfo.latestComment.trim() !== '') {
                        latestCommentHtml = `<div class="student-record-text">(${latestRecordInfo.latestComment})</div>`;
                    }
                }
				
				studentBlock.innerHTML = `
					<div class="student-block-info">
						${student.id.substring(3)} <span class="score">(${score.toFixed(1)}分)</span>
					</div>
					<div class="student-block-name">${student.name}</div>
					${latestCommentHtml}`;

				studentBlock.addEventListener('click', () => {
					document.getElementById('student-roster-modal').style.display = 'none';
					openModal(student.id, 'student', 'roster');
				});

				studentGridContainer.appendChild(studentBlock);
			});
		}
    }

    function closeModal(id = 'modal') {
		document.getElementById(id).style.display = 'none';
		document.getElementById('add-record-form').reset();

        const refreshAndClose = () => {
            const originalEntityId = currentEntity ? currentEntity.id : null;
            const originalType = currentEntity ? currentEntity.type : null;
            currentEntity = null;

            resetPerformanceForm();

            if (modalOrigin === 'roster' && originalEntityId) {
                const className = originalType === 'student' ? originalEntityId.substring(0, 3) : originalEntityId;

                if (rosterModalOrigin === 'timetable') {
                    rosterModalOrigin = null;
                    openStudentRosterModal(className, 'timetable');
                } else {
                    openStudentRosterModal(className);
                }
            } else {
                renderLayout();
                highlightCurrentClass();
                document.body.classList.remove('modal-open');
            }
            modalOrigin = null;
        };

        refreshAndClose();
	}

    function closeStudentRosterModal() {
		document.getElementById('student-roster-modal').style.display = 'none';
        currentRosterClassId = null;
        document.body.classList.remove('modal-open');

		if (rosterModalOrigin === 'timetable') {
			document.getElementById('my-timetable-modal').style.display = 'flex';
		} else {
            renderLayout();
            highlightCurrentClass();
		}
		rosterModalOrigin = null;
	}

    async function handleAddRecord(e) {
        e.preventDefault();

        const t = recordTextInput.value.trim();
        const sid = currentEntity;
        const docRef = db.collection('performanceRecords').doc(currentUser.uid).collection('records');

        let data = {
            entityId: sid.id,
            entityType: sid.type,
            text: t,
            teacherId: currentUser.uid,
            studentId: sid.type === 'student' ? sid.id : null
        };

        try {
			if (editingRecordId) {
                const originalRecord = allPerformanceRecords.find(r => r.id === editingRecordId);
                if (!originalRecord) {
                     alert('更新紀錄失敗: 找不到原始記錄');
                     return;
                }

                data.points = originalRecord.points;

                if (t === '') {
                    alert('更新紀錄時，文字描述不可為空！');
                    return;
                }

                await docRef.doc(editingRecordId).set(data, { merge: true });
                alert('紀錄已更新！');

			} else {
                const rawPoints = parseFloat(recordPointsInput.value) || 0;

                const p = Math.round(rawPoints * 10) / 10;

                if (p === 0 && t === '') return;

                data.points = p;
                data.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                await docRef.add(data);
                alert('紀錄已新增！');
			}

			closeModal();
        } catch (err) {
            console.error(err);
            alert((editingRecordId ? '更新' : '新增') + '紀錄失敗: ' + err.message);
        }
    }

    async function handleDeleteRecord(e) {
		if (e.target.classList.contains('delete-btn')) {
			const rid = e.target.dataset.id;
			if (confirm('確定刪除？')) {
				try {
					await db.collection('performanceRecords').doc(currentUser.uid).collection('records').doc(rid).delete();

                    if (editingRecordId === rid) {
                        resetPerformanceForm();
                    }

					closeModal();
				} catch (err) {
					console.error(err);
				}
			}
		}
	}

    function resetPerformanceForm() {
        editingRecordId = null;
        recordPointsInput.value = '1';
        recordTextInput.value = '';

        recordPointsInput.disabled = false;
        if (window.innerWidth > 768) {
             recordPointsInput.placeholder = '加/減分 (可用方向鍵調整整數)';
        }
        scorePlusBtn.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';
        scoreMinusBtn.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';


        saveRecordBtn.textContent = '新增';
        saveRecordBtn.classList.remove('update-mode');
        saveRecordBtn.style.backgroundColor = 'var(--success-color)';
		btnCancelEdit.textContent = '取消';
        btnCancelEdit.style.display = 'none';
    }

    function editRecord(recordId) {
        const record = allPerformanceRecords.find(r => r.id === recordId);
        if (!record) return;

        editingRecordId = recordId;
        saveRecordBtn.textContent = '更新';
        saveRecordBtn.classList.add('update-mode');
		btnCancelEdit.textContent = '取消';
        btnCancelEdit.style.display = 'inline-block';

        recordPointsInput.value = record.points || 0;
        recordPointsInput.disabled = true;
        scorePlusBtn.style.display = 'none';
        scoreMinusBtn.style.display = 'none';

        recordTextInput.value = record.text || '';

        modalTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }


    function openModal(id, type = 'student', origin = 'main') {
		modalOrigin = origin;
        document.body.classList.add('modal-open');
        currentEntity = { id, type };

        resetPerformanceForm();

        let titleText = '';
        if (type === 'student') {
            const student = studentsData.find(s => s.id === id);
            const displayId = student ? `${student.id.substring(0,3)}${student.id.substring(3)}` : 'N/A';
            titleText = student ? `${student.name} (${displayId}) 的紀錄` : `學生紀錄 (${id})`;
        } else {
            titleText = `班級事件紀錄 (${id} 班)`;
        }

        document.getElementById('modal-title').textContent = titleText;

        renderModalRecords(id, type);
		loadRecentTexts();
        document.getElementById('modal').style.display = 'flex';
    }

    function renderModalRecords(id, type) {
        recordsList.innerHTML = '載入中...';
        document.getElementById('record-count-display').textContent = '事件數: 0';
        document.getElementById('record-total-score-display').textContent = '總分: 0.0';

        const allRecords = allPerformanceRecords.filter(r => {
            if (type === 'class' && r.entityType === 'class') {
                return r.entityId === id;
            } else if (type === 'student' && (r.entityType === 'student' || !r.entityType)) {
                return r.entityId === id || r.studentId === id;
            }
            return false;
        }).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        let totalScore = 0;
        let recordCount = 0;
        allRecords.forEach(record => {
            totalScore += record.points || 0;
            recordCount++;
        });

        document.getElementById('record-count-display').textContent = `事件數: ${recordCount}`;
        document.getElementById('record-total-score-display').textContent = `總分: ${totalScore.toFixed(1)}`;

        recordsList.innerHTML = '';
        if (allRecords.length === 0) { recordsList.innerHTML = '尚無紀錄。'; return; }

        allRecords.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            const pClass = (record.points || 0) > 0 ? 'positive' : ((record.points || 0) < 0 ? 'negative' : '');

            const timestamp = record.timestamp ? new Date(record.timestamp.seconds * 1000).toLocaleString('zh-TW', { hour12: false, year:'numeric', month:'numeric', day:'numeric', hour: '2-digit', minute:'2-digit' }) : '日期不明';

            recordItem.innerHTML = `
                <div class="record-content edit-trigger" data-id="${record.id}">
                    <span class="record-points ${pClass}">${record.points||0}分</span>
                    <span class="record-text">${record.text || ''}</span>
                </div>
                <div class="record-timestamp">${timestamp}</div>
                <button class="delete-btn" data-id="${record.id}">🗑️</button>
            `;
            recordsList.appendChild(recordItem);
        });

        recordsList.querySelectorAll('.record-content').forEach(element => {
            element.addEventListener('click', (e) => {
                const recordId = e.currentTarget.dataset.id;
                editRecord(recordId);
            });
        });
    }


	async function loadRecentTexts() {
		const datalist = document.getElementById('recent-texts-list');
    	const recordTextInput = document.getElementById('record-text'); 
		
        datalist.innerHTML = ''; 
    	recordTextInput.value = ''; 

		try {
			const snapshot = await db.collection('performanceRecords').doc(currentUser.uid).collection('records')
				.orderBy('timestamp', 'desc') 
				.limit(50) 
				.get();

			if (snapshot.docs.length > 0) {
				const mostRecentDoc = snapshot.docs[0];
				const mostRecentText = mostRecentDoc.data().text;

				if (mostRecentText !== null && mostRecentText !== undefined) {
					recordTextInput.value = mostRecentText; 
				}
			}
            
			const recentTexts = new Set();
			snapshot.forEach(doc => { 
				const text = doc.data().text;
				if (text && text.trim() !== '') { 
                    const trimmedText = text.trim();
					recentTexts.add(trimmedText);
				}
			});
            
			Array.from(recentTexts).slice(0, 10).forEach(text => { 
				const option = document.createElement('option');
				option.value = text;
				datalist.appendChild(option);
			});

		} catch (error) {
			console.error("讀取最近的文字紀錄失敗:", error);
		}
	}

    document.getElementById('logout-btn').addEventListener('click', () => { 
        if (allScoresSnapshotUnsubscribe) allScoresSnapshotUnsubscribe();
        auth.signOut().then(() => { window.location.href = 'login.html'; }); 
    });
    document.querySelectorAll('.close-btn').forEach(btn => {
         btn.onclick = (e) => {
            const modalId = e.target.dataset.modal;
            if(modalId === 'modal') {
                closeModal();
            } else if (modalId === 'student-roster-modal') {
                closeStudentRosterModal();
            }
            else if (modalId) {
                document.getElementById(modalId).style.display = 'none';
                document.body.classList.remove('modal-open');
            }
         };
    });

    btnCancelEdit.addEventListener('click', resetPerformanceForm);


    document.getElementById('record-points').addEventListener('blur', function() {
        const value = this.value;
        if (value !== '' && !isNaN(value)) {
            const roundedValue = Math.round(parseFloat(value) * 10) / 10;
            this.value = roundedValue;
        }
    });

    const adjustScore = (amount) => {
        if (window.innerWidth > 768) return;
        if (recordPointsInput.disabled) return;

        let currentValue = parseFloat(document.getElementById('record-points').value) || 0;
        let newValue = currentValue + amount;

        document.getElementById('record-points').value = (Math.round(newValue * 10) / 10).toFixed(1);
    };

    scorePlusBtn.addEventListener('click', () => adjustScore(1));
    scoreMinusBtn.addEventListener('click', () => adjustScore(-1));


    passwordResetForm.addEventListener('submit', async (e) => { e.preventDefault(); const p1 = document.getElementById('new-password').value; const p2 = document.getElementById('confirm-password').value; document.getElementById('password-error-message').textContent = ''; if (p1.length < 6) { document.getElementById('password-error-message').textContent = '密碼至少6字元'; return; } if (p1 !== p2) { document.getElementById('password-error-message').textContent = '密碼不相符'; return; } try { await currentUser.updatePassword(p1); await db.collection('users').doc(currentUser.uid).update({ passwordNeedsReset: false }); alert('密碼修改成功，請重新登入'); auth.signOut(); } catch (err) { document.getElementById('password-error-message').textContent = '更新失敗: ' + err.message; } });
    document.getElementById('force-logout-btn').addEventListener('click', () => {
		auth.signOut();
	});

    changePasswordBtn.addEventListener('click', () => { document.body.classList.add('modal-open'); document.getElementById('dropdown-menu').classList.remove('show'); document.getElementById('change-password-modal').style.display = 'flex'; });
    document.getElementById('change-password-modal').querySelector('.close-btn').addEventListener('click', () => { document.body.classList.remove('modal-open'); document.getElementById('change-password-modal').style.display = 'none'; document.getElementById('change-password-form').reset(); document.getElementById('cp-error-message').textContent = ''; });
    document.getElementById('change-password-form').addEventListener('submit', async (e) => { e.preventDefault(); const newPassword = document.getElementById('cp-new-password').value; const confirmPassword = document.getElementById('cp-confirm-password').value; document.getElementById('cp-error-message').textContent = ''; if (newPassword.length < 6) { document.getElementById('cp-error-message').textContent = '密碼至少6字元'; return; } if (newPassword !== confirmPassword) { document.getElementById('cp-error-message').textContent = '密碼不相符'; return; } try { await currentUser.updatePassword(newPassword); alert('密碼更新成功！'); document.getElementById('change-password-modal').querySelector('.close-btn').click(); } catch (error) { if (error.code === 'auth/requires-recent-login') { document.getElementById('cp-error-message').textContent = '此為敏感操作，請先登出再重新登入後再試。'; } else { document.getElementById('cp-error-message').textContent = '更新失敗：' + error.message; } } });

    classSettingsBtn.addEventListener('click', () => { document.body.classList.add('modal-open'); document.getElementById('dropdown-menu').classList.remove('show'); classSettingsList.innerHTML = ''; allClassList.forEach(className => { const isChecked = visibleClassList.includes(className) ? 'checked' : ''; const itemDiv = document.createElement('div'); itemDiv.className = 'class-setting-item';
        itemDiv.innerHTML = `<input type="checkbox" id="setting-${className}" value="${className}" class="visible-class-checkbox" ${isChecked}><label for="setting-${className}">${className} 班</label>`;
        classSettingsList.appendChild(itemDiv); }); selectAllVisibleClasses.checked = allClassList.length > 0 && allClassList.length === visibleClassList.length; document.getElementById('class-settings-modal').style.display = 'flex'; });
    selectAllVisibleClasses.addEventListener('change', (e) => { document.querySelectorAll('.visible-class-checkbox').forEach(checkbox => { checkbox.checked = e.target.checked; }); });
    document.getElementById('class-settings-modal').querySelector('.close-btn').addEventListener('click', () => { document.body.classList.remove('modal-open'); document.getElementById('class-settings-modal').style.display = 'none'; });
    saveClassSettingsBtn.addEventListener('click', async () => { const newVisibleClasses = []; classSettingsList.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => { newVisibleClasses.push(checkbox.value); }); try { await db.collection('users').doc(currentUser.uid).update({ visibleClasses: newVisibleClasses }); visibleClassList = newVisibleClasses; renderLayout(); document.getElementById('class-settings-modal').querySelector('.close-btn').click(); alert('設定已儲存！'); } catch(error) { console.error("儲存設定失敗:", error); alert("儲存失敗"); } });

    function openInfoModal() {
        document.body.classList.add('modal-open');
        document.getElementById('info-modal').style.display = 'flex';
    }
    function closeInfoModal() {
        document.body.classList.remove('modal-open');
        document.getElementById('info-modal').style.display = 'none';
    }
    document.getElementById('info-modal').querySelector('.close-btn').addEventListener('click', closeInfoModal);

	resetWelcomePrefsBtn.addEventListener('click', () => {
        localStorage.removeItem('hideLoginWelcome');
        localStorage.removeItem('hideTimetableWelcome');
        sessionStorage.removeItem('welcomeShownForSession');
        alert('歡迎訊息的顯示偏好已重設！');
        closeInfoModal();
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            if(modalId === 'modal') {
                closeModal();
            } else if (modalId === 'change-password-modal') {
                document.getElementById('change-password-modal').querySelector('.close-btn').click();
            } else if (modalId === 'class-settings-modal') {
                document.getElementById('class-settings-modal').querySelector('.close-btn').click();
            } else if (modalId === 'info-modal') {
                closeInfoModal();
            } else if (modalId === 'welcome-modal') {
                document.getElementById('close-welcome-btn').onclick();
            } else if (modalId === 'my-timetable-modal') {
                 // 這裡交由模組處理關閉邏輯
                 document.getElementById('my-timetable-modal').style.display = 'none';
                 document.body.classList.remove('modal-open');
            } else if (modalId === 'homepage-settings-modal') {
                closeHomepageSettingsModal();
            } else if (modalId === 'student-roster-modal') {
                closeStudentRosterModal();
            }
        }
    });

    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
	const newInfoBtn = document.getElementById('info-btn-new');

    dropdownBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    const userEmailSpan = document.getElementById('user-email');

    userEmailSpan.addEventListener('click', function(event) {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    window.addEventListener('click', function(event) {
        if (!event.target.matches('#dropdown-btn') && !event.target.matches('#user-email')) {
            if (dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        }
    });

    // 【修改】動態載入模組，然後觸發點擊事件
    myTimetableIconBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await loadTimetableModule();
            // 由於事件監聽已經在 teacher_timetable_module.js 中註冊，
            // 這裡只需確保註冊成功，並讓模組中的點擊處理邏輯執行。
            // 為了不重複執行，這裡直接跳轉到模組的邏輯。
            // 由於模組已經載入，可以直接呼叫其內部的點擊處理邏輯。
            // 在這個重構中，我們將按鈕的事件監聽移到了模組內部，
            // 這裡只需確保模組載入成功。
            // e.currentTarget.click(); // 這可能會導致無限循環
        } catch (error) {
            console.error("載入課表模組失敗，無法開啟課表:", error);
            alert("載入課表模組失敗，請重新整理頁面。");
        }
    });


	newInfoBtn.addEventListener('click', () => {
		document.getElementById('dropdown-menu').classList.remove('show');
		openInfoModal();
	});
	document.getElementById('tutorial-btn').addEventListener('click', () => {
		document.getElementById('dropdown-menu').classList.remove('show');
		document.body.classList.add('modal-open');
		document.getElementById('tutorial-modal').style.display = 'flex';
	});

	document.getElementById('tutorial-modal').querySelector('.close-btn').addEventListener('click', () => {
		document.body.classList.remove('modal-open');
		document.getElementById('tutorial-modal').style.display = 'none';
	});
	
	document.querySelectorAll('.toggle-password').forEach(toggle => {
		toggle.addEventListener('click', () => {
			const targetId = toggle.dataset.target;
			const passwordInput = document.getElementById(targetId);
			if (passwordInput.type === 'password') {
				passwordInput.type = 'text';
				toggle.textContent = '🙈';
			} else {
				passwordInput.type = 'password';
				toggle.textContent = '👁️';
			}
		});
	});
	homepageSettingsBtn.addEventListener('click', () => {
		document.getElementById('dropdown-menu').classList.remove('show');
		const currentPref = localStorage.getItem('homepagePreference') || 'classGrid';
		document.querySelector(`input[name="homepage-pref"][value="${currentPref}"]`).checked = true;
		document.body.classList.add('modal-open');
		homepageSettingsModal.style.display = 'flex';
	});

	function closeHomepageSettingsModal() {
		document.body.classList.remove('modal-open');
		homepageSettingsModal.style.display = 'none';
	}
	homepageModalCloseBtn.addEventListener('click', closeHomepageSettingsModal);

	saveHomepageSettingsBtn.addEventListener('click', () => {
		const selectedPref = document.querySelector('input[name="homepage-pref"]:checked').value;
		localStorage.setItem('homepagePreference', selectedPref);
		alert('首頁設定已儲存！');
		closeHomepageSettingsModal();
	});

});