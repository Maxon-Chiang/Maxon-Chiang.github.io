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
    let teacherTimetableData = { periods: {} };
    let currentUserData = null;
    let classTotalScores = {};
    let activeChanges = [];
    let currentWeekStart = getMonday(new Date());
    let timetableIntervalId = null;
    
	const USER_AUTH_KEY = 'user_auth_profile_v1';
	const STATIC_CACHE_KEY = 'teacher_static_cache_v6'; 
	const DYNAMIC_CACHE_KEY = 'teacher_dynamic_cache_v6';
	let CACHE_DATA_STATIC = {};
	let CACHE_DATA_DYNAMIC = {};
   
    const REFRESH_FLAG_KEY = 'teacherTimetableNeedsRefresh';
	
    let rosterSortState = 0;
    let classSortState = 0;
    let currentRosterClassId = null;
    let currentEntity = null;

    let editingRecordId = null;

    let PERIOD_TIMES = [];
	let allPerformanceRecords = []; 
    let studentLatestRecords = {};
	let lastSchUpdFetch = 0;
	let lastPerformanceFetch = 0;
	let cloudDataUpdatedStatic = false;
	let cloudDataUpdatedDynamic = false;
	let isInitializing = false;
	let allScheduleChanges = []; 
	
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
    const myTimetableModal = document.getElementById('my-timetable-modal');
	const myTimetableIconBtn = document.getElementById('my-timetable-icon-btn');
    const myTimetableTitle = document.getElementById('my-timetable-title');
    const myTimetableBody = document.getElementById('my-timetable-body');
    const timetableMessage = document.getElementById('timetable-message');
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
	const TRANSFER_KEY = 'initialActiveChanges';
	const CACHE_LIFETIME = 45 * 60 * 1000; 

	function navigateToTimetable() {
		try {
			if (activeChanges && activeChanges.length > 0) {
				sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(activeChanges));
			}
			const staticData = {
				PERIOD_TIMES: PERIOD_TIMES
			};
			sessionStorage.setItem(STATIC_CACHE_KEY, JSON.stringify(staticData));
		} catch(e) {
			console.error("無法傳遞 activeChanges 數據:", e);
		}
		window.location.href = 'timetable.html';
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

	async function loadActiveChanges(force = false) {
        if (!currentUser || !currentUser.uid) return;
        
        if (!force){
            const cachedChanges = sessionStorage.getItem(TRANSFER_KEY);
            if (cachedChanges) {
                try {
                    activeChanges = JSON.parse(cachedChanges);
                    allScheduleChanges = activeChanges; 
                    console.log('✅ 快取命中：課表異動 Session，無需重新讀取 Firestore！');
                    return; 
                } catch (e) {
                    console.error('❌ 解析 Session 快取失敗，將檢查本地快取。', e);
                }
            }
            if (allScheduleChanges && allScheduleChanges.length > 0) {
                activeChanges = allScheduleChanges;
                console.log('✅ 快取命中：課表異動 LocalStorage，無需重新讀取 Firestore！');
                return; 
            }
        }
        
        try {
            const involvedQuery = db.collection('classChanges')
                                    .where('involvedTeacherIds', 'array-contains', currentUser.uid)
                                    .where('status', '==', 'active');

            const snapshot = await involvedQuery.get();
			console.log('載入課表異動資料...');

            const newActiveChanges = [];
            snapshot.forEach(doc => {
                newActiveChanges.push({ id: doc.id, ...doc.data() });
            });
            
            activeChanges = newActiveChanges;       
            allScheduleChanges = newActiveChanges;  
            
            sessionStorage.removeItem(TRANSFER_KEY); 
			cloudDataUpdatedDynamic = true;
			lastSchUpdFetch = new Date().getTime(); 
            
        } catch (error) {
            console.error("載入課程異動時發生錯誤:", error);
        }
     }
	
    function getDerivedCurrentUserSchedule(weekStart = null) {
        if (!teacherTimetableData || !teacherTimetableData.periods) {
            return { periods: {} };
        }

        const derivedSchedule = JSON.parse(JSON.stringify(teacherTimetableData));
        const teacherName = currentUserData.displayName;
		const targetWeekStart = weekStart || currentWeekStart;

        activeChanges.forEach(change => {

            if (change.type === 'swap') {
                const infoA = change.originalClassInfo;
                const infoB = change.targetClassInfo;

                const weekA = getMonday(new Date(infoA.date));
                const weekB = getMonday(new Date(infoB.date));

				if (weekA.getTime() === targetWeekStart.getTime() && weekB.getTime() === targetWeekStart.getTime()) {
                    if (infoA.teacher === teacherName) {
                        derivedSchedule.periods[infoA.period][infoA.day] = { ...infoB, class: infoA.class, isSwappedIn: true, changeId: change.id };
                        derivedSchedule.periods[infoB.period][infoB.day] = { ...infoA, isSwappedOut: true, changeId: change.id };
                    } else if (infoB.teacher === teacherName) {
                        derivedSchedule.periods[infoB.period][infoB.day] = { ...infoA, class: infoB.class, isSwappedIn: true, changeId: change.id };
                        derivedSchedule.periods[infoA.period][infoA.day] = { ...infoB, isSwappedOut: true, changeId: change.id };
                    }
                }
            }
            else if (change.type === 'substitution') {
                const changeDate = new Date(change.date);
                const changeWeekStart = getMonday(changeDate);

                if (changeWeekStart.getTime() !== targetWeekStart.getTime()) return;

                const lessonInfo = change.lessonInfo;
                const dayIndex = changeDate.getDay() - 1;

                if (dayIndex >= 0 && dayIndex < 5) {
                    if (change.originalTeacherName === teacherName) {
                        derivedSchedule.periods[lessonInfo.period][dayIndex] = { ...lessonInfo, isSubstitutedOut: true, substituteTeacherName: change.substituteTeacherName, reason: change.reason, changeId: change.id };
                    } else if (change.substituteTeacherName === teacherName) {
                        derivedSchedule.periods[lessonInfo.period][dayIndex] = { ...lessonInfo, isSubstitutedIn: true, originalTeacherName: change.originalTeacherName, reason: change.reason, changeId: change.id };
                    }
                }
            }
            else if (change.type === 'exchange') {
                const infoA = change.originalLessonInfo;
                const infoB = change.exchangeLessonInfo;

                const weekA = getMonday(new Date(infoA.date));
				if (weekA.getTime() === targetWeekStart.getTime()) {
                    const dayA = new Date(infoA.date).getDay() - 1;
                    if (dayA >= 0 && dayA < 5) {
                        if (infoA.teacher === teacherName) {
                            derivedSchedule.periods[infoA.period][dayA] = { ...infoA, isExchangedOut: true, targetTeacher: infoB.teacher, originalTeacher: infoA.teacher, changeId: change.id, reason: change.reason };
                        } else if (infoB.teacher === teacherName) {
                            derivedSchedule.periods[infoA.period][dayA] = { ...infoA, isExchangedIn: true, targetTeacher: infoA.teacher, originalTeacher: infoB.teacher, changeId: change.id, reason: change.reason };
                        }
                    }
                }

                const weekB = getMonday(new Date(infoB.date));
                if (weekB.getTime() === targetWeekStart.getTime()) {
                    const dayB = new Date(infoB.date).getDay() - 1;
                    if (dayB >= 0 && dayB < 5) {
                         if (infoB.teacher === teacherName) {
                            derivedSchedule.periods[infoB.period][dayB] = { ...infoB, isExchangedOut: true, targetTeacher: infoB.teacher, originalTeacher: infoA.teacher, changeId: change.id, reason: change.reason };
                        } else if (infoA.teacher === teacherName) {
                            derivedSchedule.periods[infoB.period][dayB] = { ...infoB, isExchangedIn: true, targetTeacher: infoA.teacher, originalTeacher: infoB.teacher, changeId: change.id, reason: change.reason };
                        }
                    }
                }
            }
        });

        return derivedSchedule;
    }

	function runMainApp() {
        /* 🟢 修改 start: 加入逾時檢查與更詳細的狀態顯示 */
        // 設定一個計時器，如果 Auth 超過 5 秒沒反應，提示使用者
        const authTimeout = setTimeout(() => {
            const container = document.getElementById('app-container');
            if (container && container.innerHTML.includes('正在載入您的資料')) {
                container.innerHTML = `
                    <div style="text-align:center; padding:20px;">
                        <h2>連線回應較慢...</h2>
                        <p>系統正在嘗試連接身分驗證伺服器。</p>
                        <p>若持續停留在此畫面，請嘗試 <a href="javascript:window.location.reload()">重新整理</a>。</p>
                    </div>`;
            }
        }, 8000); // 8秒後提示

		auth.onAuthStateChanged(async (user) => {
            clearTimeout(authTimeout); // Auth 有反應了，清除計時器

			if (user) {
                // 立即更新 UI，讓使用者知道 JS 有在跑
                document.getElementById('app-container').innerHTML = '<h2>🔄 身分驗證成功，正在讀取設定...</h2>';

				if (currentUser && currentUser.uid === user.uid) return;
				currentUser = user;
				
				let userDocData = null;
				try {
					const cachedAuth = localStorage.getItem(USER_AUTH_KEY);
					if (cachedAuth) {
						const parsedCache = JSON.parse(cachedAuth);
                        // 這裡配合您之前的修改，已移除時間判斷
						if (parsedCache.uid === user.uid) {
							userDocData = parsedCache.userData;
							console.log('✅ 快取命中：讀取到用戶角色資料。');
						} else {
							console.log('❌ ID 不符，移除快取！');
							localStorage.removeItem(USER_AUTH_KEY);
						}
					}
				} catch (e) {
					 console.error('❌ 解析 AUTH 快取失敗:', e);
					 localStorage.removeItem(USER_AUTH_KEY);
				}
				
				if (!userDocData) {
                    // 增加讀取 Firestore 的逾時保護 (防止網路卡住)
                    try {
                        document.getElementById('app-container').innerHTML = '<h2>☁️ 正在從雲端下載使用者資料...</h2>';
                        
                        const fetchUserPromise = db.collection('users').doc(user.uid).get();
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error("讀取逾時")), 10000)
                        );

                        const userDoc = await Promise.race([fetchUserPromise, timeoutPromise]);
                        
                        console.log('載入user資料...'); 
                        if (userDoc.exists) {
                            userDocData = userDoc.data();
                            localStorage.setItem(USER_AUTH_KEY, JSON.stringify({
                                uid: user.uid,
                                userData: userDocData,
                                lastUpdated: new Date().getTime()
                            }));
                        }
                    } catch (err) {
                        console.error("讀取使用者資料失敗:", err);
                        document.getElementById('app-container').innerHTML = `
                            <h2>⚠️ 讀取資料失敗</h2>
                            <p>請檢查您的網路連線。</p>
                            <button onclick="window.location.reload()" style="padding:10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">重新整理</button>
                        `;
                        return;
                    }
				}

				if (userDocData && (userDocData.role === 'teacher' || userDocData.role === 'school_admin' || userDocData.role === 'admin')) {
					currentUserData = userDocData; 
					
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
        /* 🟢 修改 end */
	}
	
	window.addEventListener('pageshow', async (event) => {
		const REFRESH_FLAG_KEY = 'teacherTimetableNeedsRefresh';
		
		if (event.persisted && localStorage.getItem(REFRESH_FLAG_KEY) === 'true' && currentUser) {
			console.log('🔄 從 bfcache 恢復，偵測到課表異動旗標，執行強制重新載入！');
			await initialize(currentUserData, false, 1); 
		} else if (event.persisted) {
			highlightCurrentClass();
		}
	});

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
         timetableLink.href = `./timetable.html?v=${Date.now()}`;
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
        if (PERIOD_TIMES.length === 0 || !scheduleDataLoaded) return;

        document.querySelectorAll('.class-block').forEach(el => {
            el.classList.remove('current-class-highlight');
        });

        const now = new Date();
        const dayOfWeek = now.getDay();

        if (dayOfWeek < 1 || dayOfWeek > 5) return;

        const dayIndex = dayOfWeek - 1;

        const currentPeriodIndex = getCurrentPeriodIndex();

        if (currentPeriodIndex === -1) return;

        const highlightWeekStart = getMonday(new Date()); 
        
        const derivedSchedule = getDerivedCurrentUserSchedule(highlightWeekStart);
        const periods = derivedSchedule.periods;
        const periodData = periods[currentPeriodIndex];
		
        if (periodData && periodData[dayIndex]) {

            let cellContent = periodData[dayIndex];
            let classCode = null;
            
            if (typeof cellContent === 'string') {
                 // 原始課表內容: "班級代碼 課程名稱"
                 const parts = cellContent.split(/\s+/);
                 classCode = parts[0];
            } else if (cellContent.class) {
                // 異動後課表內容: { class: "班級代碼", ... }
                // 檢查是否是「調出/換出/代出」的情況，如果是則不應高亮
                if (cellContent.isSwappedIn || cellContent.isExchangedOut || cellContent.isSubstitutedOut) {
                    return; 
                }
                classCode = cellContent.class; 
            } else {
                 return; // 無效的課表內容
            }

            if (classCode) {
                const targetCard = document.querySelector(`.class-block[data-class-id="${classCode}"]`);
                if (targetCard) {
                    targetCard.classList.add('current-class-highlight');
                }
            }
        }
    }

    async function loadPeriodTimes(schoolId, useCache) {
        if (!schoolId) return;
        
        if (useCache && PERIOD_TIMES.length > 0) {
            PERIOD_TIMES = CACHE_DATA_STATIC.PERIOD_TIMES;
            return;
        }

        try {
            const periodsDoc = await db.collection('schools').doc(schoolId)
                                       .collection('periods').doc('current').get();
			console.log('載入節次資料...');
			cloudDataUpdatedStatic = true;
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

	async function fetchScheduleData(teacherName, schoolId, useCache) {
        scheduleDataLoaded = false;
        teacherTimetableData = { periods: {} };
        
        if (useCache && allClassList.length > 0) {
            teacherTimetableData = CACHE_DATA_STATIC.teacherTimetableData;
            scheduleDataLoaded = true;
            return;
        }
        
        try {
            const schoolRef = db.collection('schools').doc(schoolId);
            const scheduleDoc = await schoolRef.collection('timetables').doc(teacherName).get();
			console.log('載入課表資料...');
			cloudDataUpdatedStatic = true;
            if (scheduleDoc.exists) {
                teacherTimetableData = scheduleDoc.data();
                scheduleDataLoaded = true;
            } else {
                teacherTimetableData = { periods: {} };
            }
        } catch (error) {
            console.error("載入課表資料失敗:", error);
            teacherTimetableData = { periods: {} };
        }
    }

    async function fetchRosterData(schoolId, useCache) {
        
        if (useCache && studentsData.length > 0) {
            studentsData = CACHE_DATA_STATIC.rosterData;
            allClassList = CACHE_DATA_STATIC.allClassList;
            return;
        }

        const rosterDoc = await db.collection('schools').doc(schoolId).collection('rosters').doc('current').get();
		console.log('載入學生名單資料...');
		cloudDataUpdatedStatic = true;
        if (!rosterDoc.exists) {
             throw new Error('找不到學校名冊');
        }
        studentsData = rosterDoc.data().students;
        allClassList = [...new Set(studentsData.map(s => s.id.substring(0, 3)))].sort(); 
    }

	async function fetchAllScores(force=false) { 
        
        let records = allPerformanceRecords; 
        let loadedFromCache = records.length > 0;

        if (loadedFromCache && !force) {
             console.log('✅ 快取命中：學生紀錄，跳過 Firestore 載入。');
        } else {
            try {
                const snapshot = await db.collection('performanceRecords').doc(currentUser.uid).collection('records').get();
				console.log('載入學生紀錄資料...');
				lastPerformanceFetch = new Date().getTime()
				cloudDataUpdatedDynamic = true;
                records = []; 
                snapshot.forEach(doc => {
                    const r = doc.data();
                    r.id = doc.id;
                    records.push(r);
                });
                
                allPerformanceRecords = records; 
            } catch (error) {
                console.error("載入紀錄失敗:", error);
                return; 
            }
        }
        
        allPerformanceScores = {};
        classTotalScores = {};
        studentLatestRecords = {}; 
        
        records.forEach(r => { 
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
            const studentRecords = records.filter(r => 
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
    }
	
	function saveCacheStatic() {
		try {
			const cacheData = {
				rosterData: studentsData,
				allClassList: allClassList,
				teacherTimetableData: teacherTimetableData,
				PERIOD_TIMES: PERIOD_TIMES,
				lastUpdated: new Date().getTime(),
                uid: currentUser.uid 
			};
			localStorage.setItem(STATIC_CACHE_KEY, JSON.stringify(cacheData));
		} catch (e) {
			console.error('❌ STATIC 快取寫入錯誤:', e);
		}
	}
	
	function saveCacheDynamic() {
		try {
			const cacheData = {
				scheduleChanges: allScheduleChanges, 
				performanceRecords: allPerformanceRecords, 
				lastSchUpdFetch: lastSchUpdFetch,
				lastPerformanceFetch: lastPerformanceFetch,
                uid: currentUser.uid
			};
			localStorage.setItem(DYNAMIC_CACHE_KEY, JSON.stringify(cacheData));
		} catch (e) {
			console.error('❌ DYNAMIC 快取寫入錯誤:', e);
		}
	}

	
	async function initialize(userData, forceReload = false, forceItem = 0) {
		if (isInitializing) {
            console.warn("初始化程序已在運行中，忽略重複調用。");
            return;
        }
        isInitializing = true;
        cloudDataUpdatedStatic = false;
        cloudDataUpdatedDynamic = false;
        const schoolId = userData.schoolId;
        const teacherName = userData.displayName;
        appContainer.innerHTML = '<h2>載入中...</h2>';
        
        let useCacheStatic = false;
        let useCacheDynamic = false;
       
        if (!forceReload) {
            try {
                const cachedStatic = JSON.parse(localStorage.getItem(STATIC_CACHE_KEY));
                if (cachedStatic && cachedStatic.uid === currentUser.uid) { 
                    CACHE_DATA_STATIC = cachedStatic;
                    useCacheStatic = true;
                    studentsData = CACHE_DATA_STATIC.rosterData || [];
                    allClassList = CACHE_DATA_STATIC.allClassList || [];
                    teacherTimetableData = CACHE_DATA_STATIC.teacherTimetableData || { periods: {} };
                    PERIOD_TIMES = CACHE_DATA_STATIC.PERIOD_TIMES || [];
                    scheduleDataLoaded = CACHE_DATA_STATIC.teacherTimetableData ? true : false;
                    console.log('✅ 快取命中：靜態資料(學生名單、班級、教師課表、節次時間)，加速載入資料...');
                } else if (cachedStatic) {
					console.log('❌ 無靜態資料快取！');
                    localStorage.removeItem(STATIC_CACHE_KEY);
                }
            } catch (e) {
                console.error('❌ STATIC 快取讀取錯誤或損壞:', e);
                localStorage.removeItem(STATIC_CACHE_KEY); 
                forceReload = true; 
                useCacheStatic = false;
            }
            try {
                const cachedDynamic = JSON.parse(localStorage.getItem(DYNAMIC_CACHE_KEY));
                if (cachedDynamic && cachedDynamic.uid === currentUser.uid) { 
                    CACHE_DATA_DYNAMIC = cachedDynamic;
                    useCacheDynamic = true;
                    allScheduleChanges = CACHE_DATA_DYNAMIC.scheduleChanges || []; 
                    allPerformanceRecords = CACHE_DATA_DYNAMIC.performanceRecords || []; 
					lastSchUpdFetch = CACHE_DATA_DYNAMIC.lastSchUpdFetch;
					lastPerformanceFetch = CACHE_DATA_DYNAMIC.lastPerformanceFetch;
                    console.log('✅ 快取命中：動態資料(課務異動、學生紀錄)，加速載入資料...');
                } else if (cachedDynamic) {
					console.log('❌ 無動態資料快取！');
                    localStorage.removeItem(DYNAMIC_CACHE_KEY);
                }
            } catch (e) {
                console.error('❌ DYNAMIC 快取讀取錯誤或損壞:', e);
                localStorage.removeItem(DYNAMIC_CACHE_KEY); 
                forceReload = true; 
                useCacheDynamic = false;
            }
       }


        try {
            
            if (!useCacheStatic && !useCacheDynamic) {
                currentUserData = userData; 
            }
            
            visibleClassList = currentUserData.visibleClasses || [];
            
            const periodsPromise = loadPeriodTimes(schoolId, useCacheStatic);
            const rosterPromise = fetchRosterData(schoolId, useCacheStatic);
            const schedulePromise = fetchScheduleData(teacherName, schoolId, useCacheStatic);

            await Promise.all([periodsPromise, rosterPromise, schedulePromise]);
            
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
			
			const needsRefresh = localStorage.getItem(REFRESH_FLAG_KEY) === 'true';
			const needsRefreshSchUpd = false; // ((new Date().getTime() - lastSchUpdFetch) >= CACHE_LIFETIME)
			const needsRefreshPerformance =  false; // ((new Date().getTime() - lastPerformanceFetch) >= CACHE_LIFETIME)
			
			if (forceReload || needsRefresh || (forceItem==1) || needsRefreshSchUpd) {
				await loadActiveChanges(true); 
			    localStorage.removeItem(REFRESH_FLAG_KEY); 					
			} else 
				await loadActiveChanges(false);

			if (forceReload || needsRefreshPerformance)
				await fetchAllScores(true);
            else 
				await fetchAllScores(false);            
            
            setInterval(highlightCurrentClass, 30000); 

            highlightCurrentClass();

			const preference = localStorage.getItem('homepagePreference');
			if (preference === 'timetable') {
				setTimeout(() => {
					myTimetableIconBtn.click();
				}, 100);
			}

            const listenersToReplace = [rosterSortBtn, mainSortBtn, reloadCacheBtn, saveRecordBtn, recordsList, btnCancelEdit];

            listenersToReplace.forEach(originalEl => {
                if (originalEl && originalEl.parentNode) {
                    const newEl = originalEl.cloneNode(true);
                    originalEl.parentNode.replaceChild(newEl, originalEl);
                } 
            });

            const finalRosterSortBtn = document.getElementById('roster-sort-btn');
            const finalMainSortBtn = document.getElementById('main-sort-btn');
            const finalReloadCacheBtn = document.getElementById('reload-cache-btn');
            const finalSaveRecordBtn = document.getElementById('save-record-btn');
            const finalRecordsList = document.getElementById('records-list');
            const finalBtnCancelEdit = document.getElementById('btn-cancel-edit');

            finalRosterSortBtn.addEventListener('click', toggleRosterSort);
            finalMainSortBtn.addEventListener('click', toggleClassSort);
            finalReloadCacheBtn.addEventListener('click', () => initialize(currentUserData, true)); 

            finalSaveRecordBtn.addEventListener('click', handleAddRecord);
            finalRecordsList.addEventListener('click', handleDeleteRecord);
            finalBtnCancelEdit.addEventListener('click', resetPerformanceForm);


            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    highlightCurrentClass();
                }
            });               
            if (!useCacheStatic || cloudDataUpdatedStatic) saveCacheStatic();
			if (!useCacheDynamic || cloudDataUpdatedDynamic) saveCacheDynamic();


        } catch (error) {
            console.error("❌ 初始化失敗:", error);
            document.getElementById('app-container').innerHTML = `<h2>載入資料失敗: ${error.message || '請檢查網路連線。'}</h2>`;
        } finally {
            isInitializing = false;
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
                    if (latestRecordInfo.needsHighlight) {
                        studentBlock.classList.add('highlight-no-score');
                    }
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

            allPerformanceRecords = []; 
            await fetchAllScores(true); 
            saveCacheDynamic(); 
            
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

                    allPerformanceRecords = []; 
                    await fetchAllScores(true);
                    saveCacheDynamic(); 
                    
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
        const recordsList = document.getElementById('records-list');
        
        if (!recordsList) {
            console.error("錯誤: 找不到 id='records-list' 的 HTML 元素。");
            return;
        }
        
        recordsList.innerHTML = '載入中...';

        const countDisplay = document.getElementById('record-count-display');
        const scoreDisplay = document.getElementById('record-total-score-display');
        
        const allRecords = allPerformanceRecords.filter(r => {
            if (r.entityType === 'class' && type === 'student') return false; 
            
            if (type === 'student' && (r.entityType === 'student' || !r.entityType)) {
                return r.entityId === id || r.studentId === id;
            }
            
            if (type === 'class' && r.entityType === 'class') {
                return r.entityId === id; 
            }
            
            return false;
        }).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));


        let totalCalculatedScore = 0;
        allRecords.forEach(record => {
            totalCalculatedScore += record.points || 0;
        });
        const recordScore = totalCalculatedScore; 
        const recordCount = allRecords.length; 

        if (countDisplay) {
            countDisplay.textContent = `事件數: ${recordCount}`; 
        } else {
            console.warn("警告: 找不到 HTML 元素: record-count-display，無法顯示事件數。");
        }

        if (scoreDisplay) {
            scoreDisplay.textContent = `總分: ${recordScore.toFixed(1)}`;
        } else {
             console.warn("警告: 找不到 HTML 元素: record-total-score-display，無法顯示總分。");
        }

        console.log(`DEBUG: 總紀錄數: ${allPerformanceRecords.length}，篩選後紀錄數: ${recordCount}`);

        recordsList.innerHTML = '';
        if (allRecords.length === 0) { 
            recordsList.innerHTML = '尚無紀錄。'; 
            return; 
        }

        allRecords.forEach(record => {
            try {
                const recordItem = document.createElement('div');
                recordItem.className = 'record-item';
                
                const pClass = (record.points || 0) > 0 ? 'positive' : ((record.points || 0) < 0 ? 'negative' : '');

                let timestamp = '日期不明';
                if (record.timestamp) {
                     const dateObj = record.timestamp.seconds ? new Date(record.timestamp.seconds * 1000) : new Date(record.timestamp);
                     timestamp = dateObj.toLocaleString('zh-TW', { hour12: false, year:'numeric', month:'numeric', day:'numeric', hour: '2-digit', minute:'2-digit' });
                }
                
                recordItem.innerHTML = `
                    <div class="record-content edit-trigger" data-id="${record.id}">
                        <span class="record-points ${pClass}">${record.points || 0}分</span>
                        <span class="record-text">${record.text || '無文字註記'}</span>
                    </div>
                    <div class="record-timestamp">${timestamp}</div>
                    <button class="delete-btn" data-id="${record.id}">🗑️</button>
                `;

                recordsList.appendChild(recordItem); 

            } catch (e) {
                console.error("❌ 渲染單筆紀錄時發生錯誤:", e, "紀錄 ID:", record.id);
            }
        });
        
        if (recordsList.children.length === 0 && allRecords.length > 0) {
             console.error("❌ 嚴重錯誤：已篩選到紀錄但 recordsList 仍為空。請檢查父容器或 CSS。");
        }
    }

	async function loadRecentTexts() {
        const datalist = document.getElementById('recent-texts-list');
    	const recordTextInput = document.getElementById('record-text'); 
		
        datalist.innerHTML = ''; 
    	recordTextInput.value = ''; 

        const sortedRecords = allPerformanceRecords.slice().sort((a, b) => 
            (b.timestamp?.seconds || b.timestamp?.toMillis() / 1000 || 0) - (a.timestamp?.seconds || a.timestamp?.toMillis() / 1000 || 0)
        );

        for (const doc of sortedRecords) {
            const text = doc.text;
            if (text && text.trim() !== '') {
                recordTextInput.value = text; 
                break;
            }
        }
        
        const recentTexts = new Set();
        sortedRecords.forEach(doc => { 
            const text = doc.text;
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
	}

	document.getElementById('logout-btn').addEventListener('click', () => { 
		console.log('❌ 登出，移除使用者資料！');
        localStorage.removeItem(USER_AUTH_KEY); 
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
                e.target.style.display = 'none';
                document.body.classList.remove('modal-open');
                if (timetableIntervalId) {
                     clearInterval(timetableIntervalId);
                     timetableIntervalId = null;
                 }
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
	
	const autoOpenHomepageChk = document.getElementById('auto-open-homepage-chk');
    if (autoOpenHomepageChk) {
        autoOpenHomepageChk.addEventListener('change', (e) => {
            const value = e.target.checked ? 'timetable' : 'classGrid';
            localStorage.setItem('homepagePreference', value);
        });
    }

	myTimetableIconBtn.addEventListener('click', async () => {
        document.getElementById('dropdown-menu').classList.remove('show');

        // 初始化 Checkbox 狀態
        if (autoOpenHomepageChk) {
            const currentPref = localStorage.getItem('homepagePreference');
            // 如果設定是 'timetable' 則勾選，否則不勾選
            autoOpenHomepageChk.checked = (currentPref === 'timetable');
        }

        if (!scheduleDataLoaded) {
             timetableMessage.textContent = '課表數據正在載入中...';
        }

        // (以下邏輯保持不變)
        myTimetableTitle.textContent = `${currentUserData.displayName} 的課表`;

        if (PERIOD_TIMES.length === 0) {
             myTimetableBody.innerHTML = '<p style="text-align: center; color: var(--danger-color);">錯誤：未載入課程時間表數據，無法計算節次時間。</p>';
             timetableMessage.textContent = '資料錯誤';
        }
        else if (!teacherTimetableData || Object.keys(teacherTimetableData.periods).length === 0) {
             myTimetableBody.innerHTML = '<p style="text-align: center;">找不到您的課表資料，請聯繫管理員上傳。</p>';
             timetableMessage.textContent = '資料錯誤';
        } else {
             currentWeekStart = getMonday(new Date());

             await renderDerivedMyTimetable(10);
             timetableMessage.textContent = '';
        }

		document.body.classList.add('modal-open');
        myTimetableModal.style.display = 'flex';

        // (以下按鈕監聽器保持不變)
        document.getElementById('prev-week-btn').onclick = () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            renderDerivedMyTimetable(-1);
        };
        document.getElementById('next-week-btn').onclick = () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            renderDerivedMyTimetable(1);
        };
        document.getElementById('today-btn').onclick = () => {
            currentWeekStart = getMonday(new Date());
            renderDerivedMyTimetable(0);
        };
        
        document.getElementById('prev-change-week-btn').onclick = () => {
            const targetWeek = findNextChangeWeek(-1);
            if (targetWeek) {
                currentWeekStart = targetWeek;
                renderDerivedMyTimetable(-1);
            } else {
                alert('沒有找到更早的異動週次了。');
            }
        };
        
        document.getElementById('next-change-week-btn').onclick = () => {
            const targetWeek = findNextChangeWeek(1);
            if (targetWeek) {
                currentWeekStart = targetWeek;
                renderDerivedMyTimetable(1);
            } else {
                alert('沒有找到更晚的異動週次了。');
            }
        };

        if (timetableIntervalId) clearInterval(timetableIntervalId);
        timetableIntervalId = setInterval(() => renderDerivedMyTimetable(10), 30000);
    });

    document.getElementById('my-timetable-modal').querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('my-timetable-modal').style.display = 'none';
        document.body.classList.remove('modal-open');
        if (timetableIntervalId) {
             clearInterval(timetableIntervalId);
             timetableIntervalId = null;
        }
        document.getElementById('prev-week-btn').onclick = null;
        document.getElementById('next-week-btn').onclick = null;
        document.getElementById('today-btn').onclick = null;
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'my-timetable-modal') {
                 e.target.style.display = 'none';
                 document.body.classList.remove('modal-open');
                 if (timetableIntervalId) {
                     clearInterval(timetableIntervalId);
                     timetableIntervalId = null;
                 }
            }
        }
    });

	function renderMyTimetableTable(derivedSchedule, parentElement = null) {
		const myTimetableBody = document.getElementById('my-timetable-body');
		const targetElement = parentElement || myTimetableBody; 

		if (!derivedSchedule || !derivedSchedule.periods || PERIOD_TIMES.length === 0) {
			 targetElement.innerHTML = '<p style="text-align: center;">課表資料錯誤或未載入。</p>';
			 return;
		}

		const days = ['一', '二', '三', '四', '五'];
		const periods = derivedSchedule.periods;
		const currentPeriodIndex = getCurrentPeriodIndex();
		const currentDayIndex = new Date().getDay() - 1;
		const todayWeekStart = getMonday(new Date());
		const isCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime();

		let tableHtml = '<table class="schedule-table"><thead><tr><th>節次</th>';

		const weekDates = [];
		for (let i = 0; i < 5; i++) {
			const date = new Date(currentWeekStart);
			date.setDate(currentWeekStart.getDate() + i);
			weekDates.push(date);
			tableHtml += `<th>星期${days[i]}<br><span class="date-span" style="color: #6c757d; font-size: 0.9em; font-weight:normal;">(${formatDate(date)})</span></th>`;
		}
		tableHtml += '</tr></thead><tbody>';

		PERIOD_TIMES.forEach((periodItem, periodIndex) => {
			const isCurrentPeriod = isCurrentWeek && periodIndex === currentPeriodIndex;

			const [startH, startM] = periodItem.start.split(':').map(Number);
			const endH = Math.floor((startH * 60 + startM + periodItem.duration) / 60) % 24;
			const endM = (startH * 60 + startM + periodItem.duration) % 60;
			const pad = (n) => String(n).padStart(2, '0');
			const timeRange = `${periodItem.start}~${pad(endH)}:${pad(endM)}`;

			tableHtml += `<tr><td class="period-header">${periodItem.period}<br><small style="font-weight:normal; font-size: 0.75em;">${timeRange}</small></td>`;

			for (let d = 0; d < 5; d++) {
				const cellContent = periods[periodIndex] ? periods[periodIndex][d] : null;
				let cellClass = '';
				let content = '';
				let dataAttrs = `data-period="${periodIndex}" data-day="${d}" data-date="${formatDate(weekDates[d], 'YYYY-MM-DD')}"`;

				if (isCurrentPeriod && d === currentDayIndex) {
					cellClass = 'current-timetable-cell';
				}

				if (cellContent) {
					if (cellContent.isSwappedIn || cellContent.isSwappedOut || cellContent.isExchangedIn || cellContent.isExchangedOut || cellContent.isSubstitutedIn || cellContent.isSubstitutedOut) {

						if (cellContent.isSwappedIn || cellContent.isSwappedOut) {
							cellClass += ' swapped-cell swapped-cell-pulse';
						} else if (cellContent.isExchangedIn || cellContent.isExchangedOut) {
							cellClass += ' exchanged-cell exchanged-cell-pulse';
						} else {
							cellClass += ' substituted-cell substituted-cell-pulse';								
						}

						dataAttrs += ` data-change-id="${cellContent.changeId}"`;

						if (cellContent.reason && cellContent.reason.trim() !== '') {
							const escapedReason = cellContent.reason.replace(/"/g, '&quot;');
							dataAttrs += ` title="${escapedReason}"`;
						}

						if (cellContent.isSubstitutedOut) {
							content = `<span class="subject">${cellContent.subject}</span><span class="details">${cellContent.class || ''}</span>`;
							content += `<span style="font-size: 0.8em; color: #000000; display: block; font-weight: bold;">${cellContent.substituteTeacherName || '不明'}(代)</span>`;
						} else if (cellContent.isSubstitutedIn) {
							content = `<span class="subject">${cellContent.subject}</span><span class="details">${cellContent.class || ''}</span>`;
							content += `<span style="font-size: 0.8em; color: #007bff; display: block;">(${cellContent.originalTeacherName || '不明'}(代)</span>`;
						} else if (cellContent.isExchangedOut || cellContent.isExchangedIn) {
							content = `<span class="subject">${cellContent.subject}</span><span class="details">${cellContent.class || ''}</span>`;
							content += `<span style="font-size: 0.8em; color: #000000; display: block; font-weight: bold;">${cellContent.targetTeacher || '不明'}(換)</span>`;
						} else {
							content = `<span class="subject">${cellContent.subject}</span><span class="details">${cellContent.class}</span>`;
							content += `<span style="font-size: 0.8em; color: #000000; display: block; font-weight: bold;">${cellContent.teacher}(調)</span>`;
						}
					} else {
						const [className, ...subjectParts] = cellContent.split(/\s+/);
						const subjectName = subjectParts.join(' ');

						content = `<span class="subject">${subjectName || ''}</span><span class="class-detail">${className || ''}</span>`;
					}
					tableHtml += `<td class="timetable-clickable-cell ${cellClass}" ${dataAttrs}>${content}</td>`;
				} else {
					tableHtml += `<td class="timetable-empty-cell ${cellClass}" ${dataAttrs}></td>`;
				}
			}
			tableHtml += '</tr>';
		});

		tableHtml += '</tbody></table>';
		
		targetElement.innerHTML = tableHtml;

		const scheduleTable = targetElement.querySelector('.schedule-table');
		if (isCurrentWeek) {
			scheduleTable.querySelector('thead').classList.add('current-week');
		}

		targetElement.querySelectorAll('.timetable-clickable-cell').forEach(cell => {
			cell.addEventListener('click', (e) => {
				const period = parseInt(e.currentTarget.dataset.period);
				const day = parseInt(e.currentTarget.dataset.day);

				const cellData = periods[period] ? periods[period][day] : null;
				
				if (cellData) {
					let derivedData;
					if (typeof cellData === 'string') {
						const [className, ...subjectParts] = cellData.split(/\s+/);
						derivedData = { class: className, subject: subjectParts.join(' ') };
					} else {
						derivedData = cellData;
					}

					if (derivedData && derivedData.class) {
						const classCode = derivedData.class;
						document.getElementById('my-timetable-modal').style.display = 'none';
						openStudentRosterModal(classCode, 'timetable');
					}
				}
			});
		});
	}

	async function renderDerivedMyTimetable(direction = 0) {

		const derivedSchedule = getDerivedCurrentUserSchedule();

		const myTimetableBody = document.getElementById('my-timetable-body');
		const oldTable = myTimetableBody.querySelector('.schedule-table');
		const todayWeekStart = getMonday(new Date());
		const isReturningToCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime();

		if (!oldTable || direction === 10) { 
			const tempContainer = document.createElement('div');
			renderMyTimetableTable(derivedSchedule, tempContainer);
			const newTable = tempContainer.querySelector('.schedule-table');
			
			if (newTable && oldTable) {
			    oldTable.replaceWith(newTable);
			} else if (newTable) {
			    myTimetableBody.appendChild(newTable);
			}
			
			myTimetableBody.querySelectorAll('.schedule-table').forEach(table => {
				table.classList.remove('slide-in-right', 'slide-in-left', 'slide-out-right', 'slide-out-left', 'slide-in-down', 'slide-out-up');
			});
			return;
		}
		myTimetableBody.style.position = 'relative';
		myTimetableBody.style.overflow = 'hidden';

		const newTableContainer = document.createElement('div');
		newTableContainer.style.position = 'absolute';
		newTableContainer.style.top = '0';
		newTableContainer.style.left = '0';
		newTableContainer.style.width = '100%';
		newTableContainer.style.height = '100%';
		newTableContainer.style.overflow = 'hidden';

		myTimetableBody.appendChild(newTableContainer);
		renderMyTimetableTable(derivedSchedule, newTableContainer);

		const newTable = newTableContainer.querySelector('.schedule-table');

		oldTable.style.zIndex = 10;
		oldTable.style.position = 'relative';

		let slideOutClass, slideInClass;

	
		if (direction === 1) { 
			slideOutClass = 'slide-out-left';
			slideInClass = 'slide-in-right';
		} else if (direction === -1) { 
			slideOutClass = 'slide-out-right';
			slideInClass = 'slide-in-left';
		} else if (direction === 0) { 
			slideOutClass = 'slide-out-up';
			slideInClass = 'slide-in-down';
		} else {
			myTimetableBody.innerHTML = newTableContainer.innerHTML;
			myTimetableBody.style.overflow = ''; 
			return;
		}

		oldTable.classList.add(slideOutClass);
		newTable.classList.add(slideInClass);

		setTimeout(() => {
			const finalTable = newTableContainer.querySelector('.schedule-table');
			
			oldTable.remove();

			if (finalTable) {
				newTableContainer.replaceWith(finalTable);
				
				finalTable.classList.remove('slide-in-right', 'slide-in-left', 'slide-out-right', 'slide-out-left', 'slide-in-down', 'slide-out-up');
			} else {
				myTimetableBody.innerHTML = '';
			}

			myTimetableBody.style.overflow = '';
		}, 200); 
	}
	
    function findNextChangeWeek(direction) {
        if (activeChanges.length === 0) {
            return null;
        }

        const currentWeekStartTS = currentWeekStart.getTime();
        const changeWeeksTS = new Set();
        
        activeChanges.forEach(change => {
            let dateStr;
            if (change.type === 'swap') {
                dateStr = change.originalClassInfo.date;
                const dateBStr = change.targetClassInfo.date;
                changeWeeksTS.add(getMonday(new Date(dateBStr)).getTime());
            } else if (change.type === 'substitution') {
                dateStr = change.date;
            } else if (change.type === 'exchange') {
                dateStr = change.originalLessonInfo.date;
                const dateBStr = change.exchangeLessonInfo.date;
                changeWeeksTS.add(getMonday(new Date(dateBStr)).getTime());
            } else {
                return;
            }
            changeWeeksTS.add(getMonday(new Date(dateStr)).getTime());
        });

        const sortedChangeWeeks = Array.from(changeWeeksTS).sort((a, b) => a - b);
        
        let targetWeekTS = null;

        if (direction === 1) { 
            for (const ts of sortedChangeWeeks) {
                if (ts > currentWeekStartTS) {
                    targetWeekTS = ts;
                    break;
                }
            }
        } else if (direction === -1) { 
            for (let i = sortedChangeWeeks.length - 1; i >= 0; i--) {
                const ts = sortedChangeWeeks[i];
                if (ts < currentWeekStartTS) {
                    targetWeekTS = ts;
                    break;
                }
            }
        }

        return targetWeekTS ? new Date(targetWeekTS) : null;
    }

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

    const timetableBody = document.getElementById('my-timetable-body');
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; 

    timetableBody.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            touchStartX = event.touches[0].clientX;
            touchEndX = 0; 
        }
    }, { passive: true }); 

    timetableBody.addEventListener('touchmove', (event) => {
        if (event.touches.length > 1) {
            touchStartX = 0; 
            return;
        }
    }, { passive: true }); 

    timetableBody.addEventListener('touchend', (event) => {
        if (event.changedTouches.length === 1 && touchStartX !== 0) {
            touchEndX = event.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX;

            if (Math.abs(deltaX) > swipeThreshold && myTimetableModal.style.display === 'flex') {
                if (deltaX < 0) {
                    document.getElementById('next-week-btn').click();
                } else {
                    document.getElementById('prev-week-btn').click();
                }
            }
        }
        touchStartX = 0;
    });
	if (timetableLink) {
		timetableLink.addEventListener('click', (e) => {
			e.preventDefault(); 
			navigateToTimetable(); 
		});
	} else {
		console.warn("找不到 ID 為 'timetable-link' 的導航元素，請手動綁定 navigateToTimetable()。");
	}
    recordsList.addEventListener('click', function(e) {
        const editTrigger = e.target.closest('.edit-trigger');
        if (editTrigger) {
            editRecord(editTrigger.dataset.id);
        }
    });

});
