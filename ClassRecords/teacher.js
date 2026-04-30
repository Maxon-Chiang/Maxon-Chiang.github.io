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
	const storage = firebase.storage();
	const DIRECT_ENTRY_KEY = 'pref_direct_class_entry';
	const toggleDirectEntryBtn = document.getElementById('toggle-direct-entry-btn');
	let currentUser = null, studentsData = [], allPerformanceScores = {}, allClassList = [], visibleClassList = [], modalOrigin = null, rosterModalOrigin = null;
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
	let currentRosterViewMode = 'grid'; // 紀錄目前是網格還是條列式
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
	const myTimetableIconBtn = document.getElementById('user-email');
	const myTimetableTitle = document.getElementById('my-timetable-title');
	const myTimetableBody = document.getElementById('my-timetable-body');
	const timetableMessage = document.getElementById('timetable-message');
	const rosterSortBtn = document.getElementById('roster-sort-btn');
	const mainSortBtn = document.getElementById('main-sort-btn');
	const timetableLink = document.getElementById('sys-link-timetable');
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
	const recordAttachmentInput = document.getElementById('record-attachment');
	const recordCameraPhotoInput = document.getElementById('record-camera-photo');
	const recordCameraVideoInput = document.getElementById('record-camera-video');
	const recordCameraAudioInput = document.getElementById('record-camera-audio');
	const btnSelectAttachment = document.getElementById('btn-select-attachment');
	const btnCameraPhoto = document.getElementById('btn-camera-photo');
	const btnCameraVideo = document.getElementById('btn-camera-video');
	const btnCameraAudio = document.getElementById('btn-camera-audio');
	const attachmentNameDisplay = document.getElementById('attachment-name-display');
	const btnClearAttachment = document.getElementById('btn-clear-attachment');
	let selectedFile = null;

	function checkAndTriggerDirectEntry() {
		if (localStorage.getItem(DIRECT_ENTRY_KEY) !== 'true') return false;
		const currentPeriodIndex = getCurrentPeriodIndex();
		if (currentPeriodIndex === -1) return false;
		const now = new Date();
		const dayOfWeek = now.getDay();
		if (dayOfWeek < 1 || dayOfWeek > 5) return false;
		const dayIndex = dayOfWeek - 1;
		const highlightWeekStart = getMonday(new Date());
		const derivedSchedule = getDerivedCurrentUserSchedule(highlightWeekStart);
		const periods = derivedSchedule.periods;
		const periodData = periods[currentPeriodIndex];
		if (periodData && periodData[dayIndex]) {
			let classCode = null;
			let cellContent = periodData[dayIndex];
			if (typeof cellContent === 'string') {
				const parts = cellContent.split(/\s+/);
				classCode = parts[0];
			} else if (cellContent.class) {
				if (cellContent.isSwappedIn || cellContent.isExchangedIn || cellContent.isSubstitutedIn) {
					classCode = cellContent.class;
				} else if (!cellContent.isSwappedOut && !cellContent.isExchangedOut && !cellContent.isSubstitutedOut) {
					classCode = cellContent.class;
				}
			}
			if (classCode && allClassList.includes(classCode)) {
				setTimeout(() => {
					openStudentRosterModal(classCode, 'main');
				}, 300);
				return true;
			}
		}
		return false;
	}

	if (toggleDirectEntryBtn) {
		const updateBtnText = () => {
			const isEnabled = localStorage.getItem(DIRECT_ENTRY_KEY) === 'true';
			toggleDirectEntryBtn.textContent = isEnabled ? '⚡ 直進上課班級 (已開啟)' : '⚡ 直進上課班級 (已關閉)';
			toggleDirectEntryBtn.style.color = isEnabled ? 'var(--primary-color)' : '#333';
			toggleDirectEntryBtn.style.fontWeight = isEnabled ? 'bold' : 'normal';
		};
		toggleDirectEntryBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const currentState = localStorage.getItem(DIRECT_ENTRY_KEY) === 'true';
			const newState = !currentState;
			localStorage.setItem(DIRECT_ENTRY_KEY, newState);
			updateBtnText();
			alert(newState ? '已開啟！登入時若遇上課時間，將直接進入該班級紀錄頁面。' : '已關閉直進功能。');
		});
		updateBtnText();
	}

	function navigateToTimetable() {
		try {
			if (activeChanges && activeChanges.length > 0) {
				sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(activeChanges));
			}
			const staticData = { PERIOD_TIMES: PERIOD_TIMES };
			sessionStorage.setItem(STATIC_CACHE_KEY, JSON.stringify(staticData));
		} catch(e) {}
		window.location.href = 'timetable.html';
	}

	function getClassBlockColor(totalScore) {
		if (totalScore < 0) return '#D9E2E9';
		else if (totalScore <=30) return '#D4EDDA';
		else if (totalScore <=60) return '#FFFACD';
		else return '#F8D7DA';
	}

	function getGradeColor(className) {
		const firstDigit = className.charAt(0);
		switch (firstDigit) {
			case '1': case '7': return '#1976D2';
			case '2': case '8': return '#F57C00';
			case '3': case '9': return '#388E3C';
			case '4': return '#7B1FA2';
			case '5': return '#D32F2F';
			case '6': return '#00796B';
			default: return '#607D8B';
		}
	}

	function getMonday(d) {
		d = new Date(d);
		d.setHours(0, 0, 0, 0);
		const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
					return;
				} catch (e) {}
			}
			if (allScheduleChanges && allScheduleChanges.length > 0) {
				activeChanges = allScheduleChanges;
				return;
			}
		}
		try {
			const involvedQuery = db.collection('classChanges').where('involvedTeacherIds', 'array-contains', currentUser.uid).where('status', '==', 'active');
			const snapshot = await involvedQuery.get();
			const newActiveChanges = [];
			snapshot.forEach(doc => {
				newActiveChanges.push({ id: doc.id, ...doc.data() });
			});
			activeChanges = newActiveChanges;
			allScheduleChanges = newActiveChanges;
			sessionStorage.removeItem(TRANSFER_KEY);
			cloudDataUpdatedDynamic = true;
			lastSchUpdFetch = new Date().getTime();
		} catch (error) {}
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
			} else if (change.type === 'substitution') {
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
			} else if (change.type === 'exchange') {
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
		}, 8000);
		auth.onAuthStateChanged(async (user) => {
			clearTimeout(authTimeout);
			if (user) {
				document.getElementById('app-container').innerHTML = '<h2>🔄 身分驗證成功，正在讀取設定...</h2>';
				if (currentUser && currentUser.uid === user.uid) return;
				currentUser = user;
				let userDocData = null;
				try {
					const cachedAuth = localStorage.getItem(USER_AUTH_KEY);
					if (cachedAuth) {
						const parsedCache = JSON.parse(cachedAuth);
						if (parsedCache.uid === user.uid) {
							userDocData = parsedCache.userData;
						} else {
							localStorage.removeItem(USER_AUTH_KEY);
						}
					}
				} catch (e) {
					localStorage.removeItem(USER_AUTH_KEY);
				}
				if (!userDocData) {
					try {
						document.getElementById('app-container').innerHTML = '<h2>☁️ 正在從雲端下載使用者資料...</h2>';
						const fetchUserPromise = db.collection('users').doc(user.uid).get();
						const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("讀取逾時")), 10000));
						const userDoc = await Promise.race([fetchUserPromise, timeoutPromise]);
						if (userDoc.exists) {
							userDocData = userDoc.data();
							localStorage.setItem(USER_AUTH_KEY, JSON.stringify({ uid: user.uid, userData: userDocData, lastUpdated: new Date().getTime() }));
						}
					} catch (err) {
						document.getElementById('app-container').innerHTML = `<h2>⚠️ 讀取資料失敗</h2><p>請檢查您的網路連線。</p><button onclick="window.location.reload()" style="padding:10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">重新整理</button>`;
						return;
					}
				}
				const roles = userDocData ? (userDocData.roles || (userDocData.role ? [userDocData.role] : [])) : [];
				if (userDocData && (roles.includes('teacher') || roles.includes('school_admin') || roles.includes('admin'))) {
					const directEntryEnabled = localStorage.getItem('pref_direct_class_entry') === 'true';
					const defaultPage = localStorage.getItem('defaultSystemPage');
					if (!directEntryEnabled && defaultPage && defaultPage !== 'teacher.html' && defaultPage !== 'teacher.html#') {
						const referrer = document.referrer || "";
						const cameFromOtherSystem = referrer.includes('timetable.html') || referrer.includes('worksheet_manager.html');
						if (!cameFromOtherSystem) {
							window.location.href = defaultPage;
							return;
						}
					}
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
	}

	window.addEventListener('pageshow', async (event) => {
		const REFRESH_FLAG_KEY = 'teacherTimetableNeedsRefresh';
		if (event.persisted && localStorage.getItem(REFRESH_FLAG_KEY) === 'true' && currentUser) {
			await initialize(currentUserData, false, 1);
		} else if (event.persisted) {
			highlightCurrentClass();
		}
	});

	const shouldShowWelcome = document.getElementById('welcome-modal') && localStorage.getItem('hideLoginWelcome') !== 'true' && sessionStorage.getItem('welcomeShownForSession') !== 'true';
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
				const parts = cellContent.split(/\s+/);
				classCode = parts[0];
			} else if (cellContent.class) {
				if (cellContent.isSwappedIn || cellContent.isExchangedOut || cellContent.isSubstitutedOut) {
					return;
				}
				classCode = cellContent.class;
			} else {
				return;
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
			const periodsDoc = await db.collection('schools').doc(schoolId).collection('periods').doc('current').get();
			cloudDataUpdatedStatic = true;
			if (periodsDoc.exists && periodsDoc.data().times && periodsDoc.data().times.length > 0) {
				PERIOD_TIMES = periodsDoc.data().times.map(item => ({ period: item.period, start: item.start, duration: item.duration || 50 }));
				PERIOD_TIMES.sort((a, b) => a.period - b.period);
			} else {
				PERIOD_TIMES = [
					{ period: 1, start: '08:10', duration: 50 }, { period: 2, start: '09:10', duration: 50 },
					{ period: 3, start: '10:10', duration: 50 }, { period: 4, start: '11:10', duration: 50 },
					{ period: 5, start: '13:10', duration: 50 }, { period: 6, start: '14:10', duration: 50 },
					{ period: 7, start: '15:10', duration: 50 }, { period: 8, start: '16:10', duration: 50 }
				];
			}
		} catch (error) {
			PERIOD_TIMES = [
				{ period: 1, start: '08:10', duration: 50 }, { period: 2, start: '09:10', duration: 50 },
				{ period: 3, start: '10:10', duration: 50 }, { period: 4, start: '11:10', duration: 50 },
				{ period: 5, start: '13:10', duration: 50 }, { period: 6, start: '14:10', duration: 50 },
				{ period: 7, start: '15:10', duration: 50 }, { period: 8, start: '16:10', duration: 50 }
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
			cloudDataUpdatedStatic = true;
			if (scheduleDoc.exists) {
				teacherTimetableData = scheduleDoc.data();
				scheduleDataLoaded = true;
			} else {
				teacherTimetableData = { periods: {} };
			}
		} catch (error) {
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
		if (!loadedFromCache || force) {
			try {
				let query = db.collection('performanceRecords').doc(currentUser.uid).collection('records');
				// 套用專屬的 perfStartDate / perfEndDate
				if (currentUserData && currentUserData.perfStartDate) {
					query = query.where('timestamp', '>=', new Date(currentUserData.perfStartDate + 'T00:00:00'));
				}
				if (currentUserData && currentUserData.perfEndDate) {
					query = query.where('timestamp', '<=', new Date(currentUserData.perfEndDate + 'T23:59:59.999'));
				}
				const snapshot = await query.get();
				lastPerformanceFetch = new Date().getTime();
				cloudDataUpdatedDynamic = true;
				records = [];
				snapshot.forEach(doc => {
					const r = doc.data();
					r.id = doc.id;
					records.push(r);
				});
				allPerformanceRecords = records;
			} catch (error) { return; }
		}
		allPerformanceScores = {};
		classTotalScores = {};
		studentLatestRecords = {};
		records.forEach(r => {
			const p = r.points || 0;
			const type = r.entityType || 'student';
			const id = r.entityId || r.studentId; // 這裡的 id 現在是 sysId
			if (!id) return;
			if (type === 'student') {
				if (!allPerformanceScores[id]) allPerformanceScores[id] = 0;
				allPerformanceScores[id] += p;
			} else if (type === 'class') {
				if (!classTotalScores[id]) classTotalScores[id] = 0;
				classTotalScores[id] += p;
			}
		});
		studentsData.forEach(student => {
			const studentSysId = student.sysId; // 使用系統追蹤碼
			const className = student.id.substring(0, 3);
			const score = allPerformanceScores[studentSysId] || 0;
			classTotalScores[className] = (classTotalScores[className] || 0) + score;
		});
		studentsData.forEach(student => {
			const studentRecords = records.filter(r => (r.entityId === student.sysId || r.studentId === student.sysId) && (r.entityType === 'student' || !r.entityType)).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
			studentLatestRecords[student.sysId] = null;
			for (const record of studentRecords) {
				const hasText = record.text && record.text.trim() !== '';
				const hasNoPoints = (record.points === undefined || record.points === null || record.points === 0);
				if (hasText) {
					studentLatestRecords[student.sysId] = { latestComment: record.text, needsHighlight: hasNoPoints };
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
			const cacheData = { rosterData: studentsData, allClassList: allClassList, teacherTimetableData: teacherTimetableData, PERIOD_TIMES: PERIOD_TIMES, lastUpdated: new Date().getTime(), uid: currentUser.uid };
			localStorage.setItem(STATIC_CACHE_KEY, JSON.stringify(cacheData));
		} catch (e) {}
	}

	function saveCacheDynamic() {
		try {
			const cacheData = { scheduleChanges: allScheduleChanges, performanceRecords: allPerformanceRecords, lastSchUpdFetch: lastSchUpdFetch, lastPerformanceFetch: lastPerformanceFetch, uid: currentUser.uid };
			localStorage.setItem(DYNAMIC_CACHE_KEY, JSON.stringify(cacheData));
		} catch (e) {}
	}

	let initialize = async function(userData, forceReload = false, forceItem = 0) {
		if (isInitializing) return;
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
				} else if (cachedStatic) {
					localStorage.removeItem(STATIC_CACHE_KEY);
				}
			} catch (e) {
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
				} else if (cachedDynamic) {
					localStorage.removeItem(DYNAMIC_CACHE_KEY);
				}
			} catch (e) {
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
			if (forceReload || needsRefresh || forceItem == 1) {
				await loadActiveChanges(true);
				localStorage.removeItem(REFRESH_FLAG_KEY);
			} else {
				await loadActiveChanges(false);
			}
			if (forceReload) await fetchAllScores(true);
			else await fetchAllScores(false);
			setInterval(highlightCurrentClass, 30000);
			highlightCurrentClass();
			const preference = localStorage.getItem('homepagePreference');
			if (preference === 'timetable') {
				setTimeout(() => { myTimetableIconBtn.click(); }, 100);
			}
			const listenersToReplace = [rosterSortBtn, mainSortBtn, reloadCacheBtn, saveRecordBtn, recordsList, btnCancelEdit];
			const clearTextBtnRef = document.getElementById('clear-text-btn');
			if (clearTextBtnRef) listenersToReplace.push(clearTextBtnRef);
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
			const finalClearTextBtn = document.getElementById('clear-text-btn');
			finalRosterSortBtn.addEventListener('click', toggleRosterSort);
			finalMainSortBtn.addEventListener('click', toggleClassSort);
			finalReloadCacheBtn.addEventListener('click', () => initialize(currentUserData, true));
			finalSaveRecordBtn.addEventListener('click', handleAddRecord);
			finalRecordsList.addEventListener('click', handleRecordListClick);
			finalBtnCancelEdit.addEventListener('click', resetPerformanceForm);
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'visible') highlightCurrentClass();
			});
			if (!useCacheStatic || cloudDataUpdatedStatic) saveCacheStatic();
			if (!useCacheDynamic || cloudDataUpdatedDynamic) saveCacheDynamic();
			if (finalClearTextBtn) {
				finalClearTextBtn.addEventListener('click', () => {
					const input = document.getElementById('record-text');
					input.value = '';
					input.focus();
				});
			}
		} catch (error) {
			document.getElementById('app-container').innerHTML = `<h2>載入資料失敗: ${error.message || '請檢查網路連線。'}</h2>`;
		} finally {
			isInitializing = false;
			const hasDirectEntered = checkAndTriggerDirectEntry();
			const directEntryEnabled = localStorage.getItem('pref_direct_class_entry') === 'true';
			const defaultPage = localStorage.getItem('defaultSystemPage');
			if (directEntryEnabled && !hasDirectEntered && defaultPage && defaultPage !== 'teacher.html' && defaultPage !== 'teacher.html#') {
				const referrer = document.referrer || "";
				const cameFromOtherSystem = referrer.includes('timetable.html') || referrer.includes('worksheet_manager.html');
				if (!cameFromOtherSystem) {
					window.location.href = defaultPage;
				}
			}
		}
	};

	function createClassBlock(className) {
		const totalScore = classTotalScores[className] !== undefined ? classTotalScores[className] : 0;
		const scoreColor = getClassBlockColor(totalScore);
		const gradeColor = getGradeColor(className);
		
		const classBlock = document.createElement('div');
		classBlock.className = 'class-block';
		classBlock.style.backgroundColor = scoreColor;
		classBlock.style.setProperty('--grade-color', gradeColor);
		classBlock.dataset.classId = className;
		
		const titleDiv = document.createElement('div');
		titleDiv.className = 'class-block-title';
		titleDiv.textContent = `${className} 班`;
		titleDiv.title = '點擊以紀錄班級共同事件';
		titleDiv.addEventListener('click', () => openModal(className, 'class', 'main'));
		
		const scoreDiv = document.createElement('div');
		scoreDiv.className = 'class-total-score';
		scoreDiv.textContent = `總分: ${totalScore.toFixed(1)}`;
		scoreDiv.title = '點擊以條列式檢視全班成績';
		scoreDiv.style.cursor = 'pointer';
		scoreDiv.addEventListener('click', (e) => {
			e.stopPropagation(); // 避免觸發格子的其他事件
			openStudentRosterModal(className, 'main', 'list');
		});
		
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
		
		return classBlock;
	}

	function initSortable(container, isUnified) {
		if (typeof Sortable !== 'undefined') {
			new Sortable(container, {
				group: 'classes', // 允許跨年段列拖曳
				animation: 150,
				delay: 150, // 手機版長按 150ms 才能拖曳，避免與手指上下滑動衝突
				delayOnTouchOnly: true,
				ghostClass: 'sortable-ghost',
				onEnd: function (evt) {
					if (classSortState !== 0) return; // 分數排序模式下不存檔
					
					// 抓取畫面上由上到下、由左到右所有的班級格子順序
					const blocks = document.querySelectorAll('.class-block');
					const order = Array.from(blocks).map(b => b.dataset.classId);
					localStorage.setItem('custom_class_order_v1', JSON.stringify(order));
					
					// 如果原本是分列顯示，拖拉後立刻重繪成單一桌面網格
					if (!isUnified) {
						renderLayout();
					}
				}
			});
		}
	}

	function renderLayout() {
		appContainer.innerHTML = '';
		appContainer.className = 'class-grid'; // 重置容器
		let classesToRender = allClassList.filter(className => visibleClassList.includes(className));
		
		// 讀取自訂順序
		let customOrder = null;
		try { customOrder = JSON.parse(localStorage.getItem('custom_class_order_v1')); } catch (e) {}

		// 排序邏輯
		if (classSortState === 1) {
			classesToRender.sort((a, b) => (classTotalScores[b] || 0) - (classTotalScores[a] || 0) || a.localeCompare(b));
		} else if (classSortState === 2) {
			classesToRender.sort((a, b) => (classTotalScores[a] || 0) - (classTotalScores[b] || 0) || a.localeCompare(b));
		} else if (customOrder && customOrder.length > 0) {
			// 套用自訂拖曳順序 (未在紀錄中的新班級排到最後面)
			classesToRender.sort((a, b) => {
				let indexA = customOrder.indexOf(a);
				let indexB = customOrder.indexOf(b);
				if (indexA === -1) indexA = 999;
				if (indexB === -1) indexB = 999;
				return indexA - indexB;
			});
		} else {
			classesToRender.sort((a, b) => a.localeCompare(b));
		}

		if (classesToRender.length === 0 && allClassList.length > 0) {
			appContainer.innerHTML = '<h3>沒有設定要顯示的班級。請點擊下拉選單中的「班級顯示設定」。</h3>';
			return;
		}

		// 渲染邏輯：如果用分數排序，或已有自訂排版，統一用「App單一桌面」渲染
		if (classSortState !== 0 || (customOrder && customOrder.length > 0)) {
			appContainer.classList.add('unified-grid');
			classesToRender.forEach(className => {
				appContainer.appendChild(createClassBlock(className));
			});
			// 只有在預設代碼排序下才啟動拖曳，分數排序時鎖定
			if (classSortState === 0) initSortable(appContainer, true);
		} else {
			// 預設狀態且無自訂排版：維持「一個年段一列」
			const gradeGroups = {};
			classesToRender.forEach(className => {
				const grade = className.charAt(0);
				if (!gradeGroups[grade]) gradeGroups[grade] = [];
				gradeGroups[grade].push(className);
			});

			const sortedGrades = Object.keys(gradeGroups).sort();
			sortedGrades.forEach(grade => {
				const gradeRow = document.createElement('div');
				gradeRow.className = 'grade-row';
				gradeGroups[grade].forEach(className => {
					gradeRow.appendChild(createClassBlock(className));
				});
				appContainer.appendChild(gradeRow);
				initSortable(gradeRow, false); // 每列獨立綁定，但 group 相同可互拖
			});
		}
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
		rosterSortState = (rosterSortState + 1) % 3;
		if (document.getElementById('student-roster-modal').style.display === 'flex' && currentRosterClassId) {
			renderStudentRoster(currentRosterClassId);
		}
		// 重繪完名單後，動態抓取最新元素套用顏色
		const upArrow = document.getElementById('roster-sort-up-arrow');
		const downArrow = document.getElementById('roster-sort-down-arrow');
		if (upArrow && downArrow) {
			updateSortButtonDisplay(rosterSortState, downArrow, upArrow, '#ff9800', 'roster');
		}
	}

	function toggleClassSort() {
		classSortState = (classSortState + 1) % 3;
		updateSortButtonDisplay(classSortState, mainSortDownArrow, mainSortUpArrow, '#f4d03f', 'main');
		renderLayout();
		highlightCurrentClass();
	}

	function openStudentRosterModal(className, origin = 'main', viewMode = 'grid') {
		rosterModalOrigin = origin;
		currentRosterViewMode = viewMode; // 儲存目前的視圖模式
		
		const modalEl = document.getElementById('student-roster-modal');
		if (viewMode === 'list') {
			modalEl.classList.add('is-list-view');
		} else {
			modalEl.classList.remove('is-list-view');
		}

		document.body.classList.add('modal-open');
		currentRosterClassId = className;
		
		// 每次初次從外部開啟視窗時，重置排序
		if (origin !== 'timetable' && !modalEl.style.display || modalEl.style.display === 'none') {
			rosterSortState = 0;
		}
		
		const totalScore = classTotalScores[className] !== undefined ? classTotalScores[className] : 0;
		rosterClassName.textContent = `${className} 班`;
		document.getElementById('roster-total-score-display').textContent = `(總分: ${totalScore.toFixed(1)})`;
		rosterClickArea.title = '點擊以紀錄班級共同事件';
		rosterClickArea.onclick = (e) => {
			if (!e.target.closest('#roster-sort-btn')) {
				document.getElementById('student-roster-modal').style.display = 'none';
				openModal(className, 'class', 'roster');
			}
		};
		
		renderStudentRoster(className);
		
		// 在渲染完成後，動態抓取最新元素強制套用顏色
		const upArrow = document.getElementById('roster-sort-up-arrow');
		const downArrow = document.getElementById('roster-sort-down-arrow');
		if (upArrow && downArrow) {
			updateSortButtonDisplay(rosterSortState, downArrow, upArrow, '#ff9800', 'roster');
		}
		
		modalEl.style.display = 'flex';
	}

	function renderStudentRoster(className) {
		studentGridContainer.innerHTML = '';
		let studentsToRender = studentsData.filter(s => s.id.startsWith(className));
		if (rosterSortState === 1) {
			studentsToRender.sort((a, b) => (allPerformanceScores[b.sysId] || 0) - (allPerformanceScores[a.sysId] || 0) || a.id.localeCompare(b.id));
		} else if (rosterSortState === 2) {
			studentsToRender.sort((a, b) => (allPerformanceScores[a.sysId] || 0) - (allPerformanceScores[b.sysId] || 0) || a.id.localeCompare(b.id));
		} else {
			studentsToRender.sort((a, b) => a.id.localeCompare(b.id));
		}
		
		if (studentsToRender.length === 0) {
			studentGridContainer.innerHTML = '<p>此班級查無學生。</p>';
			studentGridContainer.className = ''; // 查無資料時清除佈局設定
			return;
		}

		if (currentRosterViewMode === 'list') {
			// ================= 條列式視圖 (雙擊格子觸發) =================
			studentGridContainer.className = 'student-list-container';
			
			studentsToRender.forEach(student => {
				const score = allPerformanceScores[student.sysId] || 0;
				const latestRecordInfo = studentLatestRecords[student.sysId];
				
				let latestText = latestRecordInfo && latestRecordInfo.latestComment ? latestRecordInfo.latestComment : '';
				if (latestText.length > 12) latestText = latestText.substring(0, 12) + '...';

				let scoreColor = '#333';
				if (score < 0) scoreColor = '#d0021b';
				else if (score >= 5) scoreColor = '#007bff';
				else if (score > 0) scoreColor = '#28a745';

				const itemDiv = document.createElement('div');
				itemDiv.className = 'student-list-item';
				if (latestRecordInfo && latestRecordInfo.needsHighlight) {
					itemDiv.classList.add('highlight-no-score');
				}

				itemDiv.innerHTML = `
					<div class="student-list-info">
						<span class="student-list-seat">${student.id.substring(3)}</span>
						<span class="student-list-name">${student.name}</span>
						<span class="student-list-text">${latestText}</span>
					</div>
					<div class="student-list-score" style="color: ${scoreColor};">${score.toFixed(1)}</div>
				`;
				
				itemDiv.addEventListener('click', () => {
					document.getElementById('student-roster-modal').style.display = 'none';
					openModal(student.sysId, 'student', 'roster');
				});
				studentGridContainer.appendChild(itemDiv);
			});

		} else {
			// ================= 網格式視圖 (點擊頭像按鈕觸發) =================
			studentGridContainer.className = 'student-grid-container'; // 保持原本的網格佈局
			
			studentsToRender.forEach(student => {
				const studentBlock = document.createElement('div');
				studentBlock.title = `點擊以紀錄 ${student.name} 的表現`;
				const score = allPerformanceScores[student.sysId] || 0;
				let scoreClass = '';
				if (score < 0) {
					scoreClass = 'score-negative';
				} else if (score > 0 && score < 5) {
					scoreClass = 'score-positive-low';
				} else if (score >= 5) {
					scoreClass = 'score-positive-high';
				}
				studentBlock.className = 'student-block ' + scoreClass;
				const latestRecordInfo = studentLatestRecords[student.sysId];
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
					openModal(student.sysId, 'student', 'roster');
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
			const currentModalOrigin = modalOrigin; // 先把來源存起來，因為後面清除了
			currentEntity = null;
			modalOrigin = null;
			resetPerformanceForm();
			
			// 如果是從班級名單(roster)進來的，關閉後回去該班名單
			if (currentModalOrigin === 'roster' && originalEntityId) {
				// 注意：如果原先是學生，originalEntityId 會是 sysId。我們必須透過 studentsData 反查出他的班級
				let className = '';
				if (originalType === 'student') {
					const stu = studentsData.find(s => s.sysId === originalEntityId);
					if (stu) className = stu.id.substring(0, 3);
				} else {
					className = originalEntityId;
				}
				
				if (className) {
					if (rosterModalOrigin === 'timetable') {
						rosterModalOrigin = null;
						openStudentRosterModal(className, 'timetable', currentRosterViewMode);
					} else {
						openStudentRosterModal(className, 'main', currentRosterViewMode);
					}
				}
			} 
			// 如果是從「最近紀錄(recent)」進來的，關閉後重新觸發該按鈕
			else if (currentModalOrigin === 'recent') {
				renderLayout();
				highlightCurrentClass();
				const recentBtn = document.getElementById('recent-records-btn');
				if (recentBtn) {
					// 延遲一點點點擊，確保前一個 modal 完全關閉
					setTimeout(() => recentBtn.click(), 50); 
				}
			} 
			// 如果是從首頁網格進來的，就單純重繪首頁
			else {
				renderLayout();
				highlightCurrentClass();
				document.body.classList.remove('modal-open');
			}
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
		
		saveRecordBtn.disabled = true;
		const originalBtnText = saveRecordBtn.textContent;
		saveRecordBtn.textContent = '儲存中...';

		let uploadOverlay = null; // 宣告提示畫面變數

		try {
			let attachmentUrl = null;
			let attachmentName = null;
			
			// ============================================
			// 如果有選擇檔案，先產生並顯示「上傳中」提示畫面
			// ============================================
			if (selectedFile) {
				uploadOverlay = document.createElement('div');
				// 設定全螢幕半透明遮罩與置中樣式
				uploadOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:1.2em;backdrop-filter:blur(3px);transition:opacity 0.3s;';
				uploadOverlay.innerHTML = `
					<div class="spinner-container" style="border: 5px solid rgba(255,255,255,0.3); border-top: 5px solid #fff; border-radius: 50%; width: 50px; height: 50px; animation: spin-upload 1s linear infinite; margin-bottom: 20px;"></div>
					<div id="upload-status-text" style="font-weight:bold; letter-spacing: 1px;">檔案上傳中，請稍候...</div>
					<style>@keyframes spin-upload { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
				`;
				document.body.appendChild(uploadOverlay);

				saveRecordBtn.textContent = '上傳中...';
				const fileExt = selectedFile.name.split('.').pop();
				const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
				const fileRef = storage.ref(`performance_attachments/${currentUser.uid}/${fileName}`);
				
				// 執行上傳
				await fileRef.put(selectedFile);
				attachmentUrl = await fileRef.getDownloadURL();
				attachmentName = selectedFile.name;

				// 上傳完成，更改提示文字準備寫入資料庫
				if (uploadOverlay) {
					uploadOverlay.querySelector('#upload-status-text').textContent = '檔案處理完成，儲存紀錄中...';
				}
			}

			let data = {
				entityId: sid.id,
				entityType: sid.type,
				text: t,
				teacherId: currentUser.uid,
				studentId: sid.type === 'student' ? sid.id : null
			};

			// ============================================
			// 寫入資料庫邏輯 (區分 更新 或 新增)
			// ============================================
			if (editingRecordId) {
				const originalRecord = allPerformanceRecords.find(r => r.id === editingRecordId);
				if (!originalRecord) {
					alert('更新紀錄失敗: 找不到原始記錄');
					if(uploadOverlay) document.body.removeChild(uploadOverlay); 
					return;
				}
				data.points = originalRecord.points;
				if (t === '' && !attachmentUrl && !originalRecord.attachmentUrl) {
					alert('更新紀錄時，文字描述或附件不可為空！');
					if(uploadOverlay) document.body.removeChild(uploadOverlay); 
					return;
				}

				// 如果有上傳新檔案，刪除舊檔案並寫入新網址
				if (attachmentUrl) {
					data.attachmentUrl = attachmentUrl;
					data.attachmentName = attachmentName;
					if (originalRecord.attachmentUrl) {
						try { await storage.refFromURL(originalRecord.attachmentUrl).delete(); } catch(err){}
					}
				}

				await docRef.doc(editingRecordId).set(data, { merge: true });
				
				// 成功提示
				if (uploadOverlay) {
					uploadOverlay.innerHTML = '<div style="font-size:3.5em; margin-bottom:10px;">✅</div><div style="font-weight:bold;">紀錄已更新！</div>';
				} else {
					alert('紀錄已更新！');
				}
			} else {
				const rawPoints = parseFloat(recordPointsInput.value) || 0;
				const p = Math.round(rawPoints * 10) / 10;
				// 防呆：如果沒分數、沒文字、也沒檔案，就取消操作
				if (p === 0 && t === '' && !attachmentUrl) {
					saveRecordBtn.disabled = false;
					saveRecordBtn.textContent = originalBtnText;
					if(uploadOverlay) document.body.removeChild(uploadOverlay);
					return;
				}
				
				data.points = p;
				data.timestamp = firebase.firestore.FieldValue.serverTimestamp();
				if (attachmentUrl) {
					data.attachmentUrl = attachmentUrl;
					data.attachmentName = attachmentName;
				}
				
				await docRef.add(data);
				
				// 成功提示
				if (uploadOverlay) {
					uploadOverlay.innerHTML = '<div style="font-size:3.5em; margin-bottom:10px;">✅</div><div style="font-weight:bold;">紀錄已新增！</div>';
				} else {
					alert('紀錄已新增！');
				}
			}
			
			// ============================================
			// 結尾收尾與重新載入
			// ============================================
			allPerformanceRecords = [];
			await fetchAllScores(true);
			saveCacheDynamic();

			// 如果有顯示遮罩，延遲 0.8 秒讓使用者看見 ✅，然後淡出關閉
			if (uploadOverlay) {
				setTimeout(() => {
					uploadOverlay.style.opacity = '0';
					setTimeout(() => {
						if(uploadOverlay.parentNode) document.body.removeChild(uploadOverlay);
						closeModal();
					}, 300); // 配合 CSS transition 0.3s
				}, 800);
			} else {
				closeModal(); // 無附件直接關閉
			}

		} catch (err) {
			// 錯誤處理：若有遮罩，直接顯示 ❌ 與錯誤訊息
			if (uploadOverlay) {
				uploadOverlay.innerHTML = `<div style="font-size:3.5em; margin-bottom:10px;">❌</div><div style="font-weight:bold; color:#ffb3b3;">處理失敗</div><div style="font-size:0.85em; margin-top:10px; padding: 0 20px; text-align: center;">${err.message}</div>`;
				setTimeout(() => {
					if(uploadOverlay.parentNode) document.body.removeChild(uploadOverlay);
				}, 2500); // 錯誤訊息停留 2.5 秒後消失
			} else {
				alert((editingRecordId ? '更新' : '新增') + '紀錄失敗: ' + err.message);
			}
		} finally {
			saveRecordBtn.disabled = false;
			saveRecordBtn.textContent = originalBtnText;
		}
	}

	async function handleRecordListClick(e) {
		if (e.target.classList.contains('delete-btn')) {
			const rid = e.target.dataset.id;
			await handleDeleteRecord(rid);
			return;
		}
		const copyTrigger = e.target.closest('.copy-trigger');
		if (copyTrigger) {
			const textToCopy = copyTrigger.dataset.text;
			if (textToCopy) {
				const input = document.getElementById('record-text');
				input.value = textToCopy;
				input.focus();
				input.style.backgroundColor = '#fff3cd';
				setTimeout(() => input.style.backgroundColor = '', 300);
			}
			return;
		}
		const editTrigger = e.target.closest('.edit-trigger');
		if (editTrigger) {
			editRecord(editTrigger.dataset.id);
			return;
		}
	}

	async function handleDeleteRecord(rid) {
		if (confirm('確定刪除？')) {
			try {
				// 刪除前先檢查是否有附件，若有則先從 Storage 刪除檔案
				const recordToDelete = allPerformanceRecords.find(r => r.id === rid);
				if (recordToDelete && recordToDelete.attachmentUrl) {
					try {
						await storage.refFromURL(recordToDelete.attachmentUrl).delete();
					} catch (storageErr) {
						console.warn('刪除附加檔案失敗或檔案已不存在', storageErr);
					}
				}

				await db.collection('performanceRecords').doc(currentUser.uid).collection('records').doc(rid).delete();
				if (editingRecordId === rid) {
					resetPerformanceForm();
				}
				allPerformanceRecords = [];
				await fetchAllScores(true);
				saveCacheDynamic();
				closeModal();
			} catch (err) {
				alert('刪除失敗');
			}
		}
	}

	function resetPerformanceForm() {
		editingRecordId = null;
		recordPointsInput.value = '1';
		recordTextInput.value = '';
		recordPointsInput.disabled = false;
		
		// 解除鎖定加減按鈕
		scorePlusBtn.disabled = false;
		scoreMinusBtn.disabled = false;
		
		saveRecordBtn.textContent = '新增';
		saveRecordBtn.classList.remove('update-mode');
		saveRecordBtn.style.backgroundColor = 'var(--success-color)';
		btnCancelEdit.textContent = '取消';
		btnCancelEdit.style.display = 'none';

		// 新增：清除附件選擇狀態
		if (typeof clearAttachmentSelection === 'function') clearAttachmentSelection();
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
		
		// 編輯狀態下，鎖定加減按鈕
		scorePlusBtn.disabled = true;
		scoreMinusBtn.disabled = true;
		
		recordTextInput.value = record.text || '';
		
		// 新增：提示此紀錄已有附件
		if (typeof clearAttachmentSelection === 'function') clearAttachmentSelection();
		if (record.attachmentUrl) {
			attachmentNameDisplay.textContent = '(已有附件，上傳新檔將覆蓋原檔)';
			attachmentNameDisplay.style.color = '#0d6efd';
		}

		modalTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function openModal(id, type = 'student', origin = 'main') {
		modalOrigin = origin;
		document.body.classList.add('modal-open');
		currentEntity = { id, type };
		resetPerformanceForm();
		let titleText = '';
		if (type === 'student') {
			const student = studentsData.find(s => s.sysId === id);
			const displayId = student ? student.id : 'N/A'; // 用 sysId 找人，但顯示當前的座號
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
		if (!recordsList) return;
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
		if (countDisplay) countDisplay.textContent = `事件數: ${allRecords.length}`;
		if (scoreDisplay) scoreDisplay.textContent = `總分: ${totalCalculatedScore.toFixed(1)}`;
		
		// --- 產生快捷輸入文字標籤 (預設 + 歷史去重複) ---
		const predefinedTexts = ['回答問題', '互動積極', '完成任務', '競賽活動', '兌換獎勵'];
		const historicalTexts = allRecords.map(r => r.text).filter(t => t && t.trim() !== '');
		const uniqueTexts = [...new Set([...predefinedTexts, ...historicalTexts])]; // 確保文字不重複
		
		const quickTextPanel = document.getElementById('quick-text-panel');
		if (quickTextPanel) {
			quickTextPanel.innerHTML = uniqueTexts.map(text => 
				`<span class="quick-text-pill">${text.replace(/"/g, '&quot;')}</span>`
			).join('');
		}
		// ------------------------------------------------

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
				const rawText = record.text || '';
				const escapedText = rawText.replace(/"/g, '&quot;');
				const displayText = rawText || '無文字註記';
				
				// ▼▼▼ 判斷與生成附件 HTML ▼▼▼
				let attachmentHtml = '';
				if (record.attachmentUrl) {
					let icon = '📎';
					let fName = (record.attachmentName || '').toLowerCase();
					if (fName.endsWith('.pdf')) icon = '📄';
					else if (fName.match(/\.(jpg|jpeg|png|gif)$/)) icon = '🖼️';
					else if (fName.match(/\.(mp3|wav|m4a)$/)) icon = '🎵';
					else if (fName.match(/\.(mp4|mov)$/)) icon = '🎞️';
					
					attachmentHtml = `<a href="${record.attachmentUrl}" target="_blank" class="record-attachment-link" title="開啟/下載: ${record.attachmentName || '附件'}">${icon} 附件</a>`;
				}
				// ▲▲▲ 判斷與生成附件 HTML ▲▲▲

				recordItem.innerHTML = `
					<div class="record-content">
						<span class="record-points record-points-area edit-trigger ${pClass}" data-id="${record.id}" title="點擊修改此紀錄">${record.points || 0}分</span>
						<span class="record-text record-text-area copy-trigger" data-text="${escapedText}" title="點擊複製文字到輸入框">${displayText}</span>
						${attachmentHtml} <!-- 加入附件 HTML -->
					</div>
					<div class="record-timestamp">${timestamp}</div>
					<button class="delete-btn" data-id="${record.id}" title="刪除紀錄">🗑️</button>
				`;
				recordsList.appendChild(recordItem);
			} catch (e) {}
		});
	}

	async function loadRecentTexts() {
		const datalist = document.getElementById('recent-texts-list');
		const recordTextInput = document.getElementById('record-text');
		datalist.innerHTML = '';
		recordTextInput.value = '';
		
		// 預設的事件選項清單
		const predefinedTexts = ['回答問題', '互動積極', '完成任務', '競賽活動', '兌換獎勵'];

		// 將所有紀錄依時間由新到舊排序
		const sortedRecords = allPerformanceRecords.slice().sort((a, b) => (b.timestamp?.seconds || b.timestamp?.toMillis() / 1000 || 0) - (a.timestamp?.seconds || a.timestamp?.toMillis() / 1000 || 0));
		
		// 篩選出「目前操作的學生/班級」的專屬紀錄
		const entityRecords = sortedRecords.filter(r => {
			if (!currentEntity) return false;
			if (currentEntity.type === 'student' && (r.entityType === 'student' || !r.entityType)) {
				return r.entityId === currentEntity.id || r.studentId === currentEntity.id;
			}
			if (currentEntity.type === 'class' && r.entityType === 'class') {
				return r.entityId === currentEntity.id;
			}
			return false;
		});

		let foundLastText = false;
		// 找出該學生/班級最近一次「有文字」的事件內容
		for (const doc of entityRecords) {
			const text = doc.text;
			if (text && text.trim() !== '') {
				recordTextInput.value = text;
				foundLastText = true;
				break;
			}
		}

		// 若無上一次事件內容，則預設為預設項目的第一項
		if (!foundLastText) {
			recordTextInput.value = predefinedTexts[0];
		}

		// 建立輸入框的自動完成下拉選單 (Datalist)
		const recentTexts = new Set();
		
		// 先把預設選項加進去，確保它們出現在選項最上方
		predefinedTexts.forEach(text => recentTexts.add(text));

		// 再把歷史所有用過的文字加進去去重複
		sortedRecords.forEach(doc => {
			const text = doc.text;
			if (text && text.trim() !== '') {
				recentTexts.add(text.trim());
			}
		});

		Array.from(recentTexts).slice(0, 15).forEach(text => {
			const option = document.createElement('option');
			option.value = text;
			datalist.appendChild(option);
		});
	}

	document.getElementById('logout-btn').addEventListener('click', () => {
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
			} else if (modalId) {
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
		if (recordPointsInput.disabled) return;
		let currentValue = parseFloat(document.getElementById('record-points').value) || 0;
		let newValue = currentValue + amount;
		document.getElementById('record-points').value = (Math.round(newValue * 10) / 10).toFixed(1);
	};

	scorePlusBtn.addEventListener('click', () => adjustScore(1));
	scoreMinusBtn.addEventListener('click', () => adjustScore(-1));

	passwordResetForm.addEventListener('submit', async (e) => { e.preventDefault(); const p1 = document.getElementById('new-password').value; const p2 = document.getElementById('confirm-password').value; document.getElementById('password-error-message').textContent = ''; if (p1.length < 6) { document.getElementById('password-error-message').textContent = '密碼至少6字元'; return; } if (p1 !== p2) { document.getElementById('password-error-message').textContent = '密碼不相符'; return; } try { await currentUser.updatePassword(p1); await db.collection('users').doc(currentUser.uid).update({ passwordNeedsReset: false }); alert('密碼修改成功，請重新登入'); auth.signOut(); } catch (err) { document.getElementById('password-error-message').textContent = '更新失敗: ' + err.message; } });
	document.getElementById('force-logout-btn').addEventListener('click', () => { auth.signOut(); });

	changePasswordBtn.addEventListener('click', () => { document.body.classList.add('modal-open'); document.getElementById('dropdown-menu').classList.remove('show'); document.getElementById('change-password-modal').style.display = 'flex'; });
	document.getElementById('change-password-modal').querySelector('.close-btn').addEventListener('click', () => { document.body.classList.remove('modal-open'); document.getElementById('change-password-modal').style.display = 'none'; document.getElementById('change-password-form').reset(); document.getElementById('cp-error-message').textContent = ''; });
	document.getElementById('change-password-form').addEventListener('submit', async (e) => { e.preventDefault(); const newPassword = document.getElementById('cp-new-password').value; const confirmPassword = document.getElementById('cp-confirm-password').value; document.getElementById('cp-error-message').textContent = ''; if (newPassword.length < 6) { document.getElementById('cp-error-message').textContent = '密碼至少6字元'; return; } if (newPassword !== confirmPassword) { document.getElementById('cp-error-message').textContent = '密碼不相符'; return; } try { await currentUser.updatePassword(newPassword); alert('密碼更新成功！'); document.getElementById('change-password-modal').querySelector('.close-btn').click(); } catch (error) { if (error.code === 'auth/requires-recent-login') { document.getElementById('cp-error-message').textContent = '此為敏感操作，請先登出再重新登入後再試。'; } else { document.getElementById('cp-error-message').textContent = '更新失敗：' + error.message; } } });

	classSettingsBtn.addEventListener('click', () => { document.body.classList.add('modal-open'); document.getElementById('dropdown-menu').classList.remove('show'); classSettingsList.innerHTML = ''; allClassList.forEach(className => { const isChecked = visibleClassList.includes(className) ? 'checked' : ''; const itemDiv = document.createElement('div'); itemDiv.className = 'class-setting-item'; itemDiv.innerHTML = `<input type="checkbox" id="setting-${className}" value="${className}" class="visible-class-checkbox" ${isChecked}><label for="setting-${className}">${className} 班</label>`; classSettingsList.appendChild(itemDiv); }); selectAllVisibleClasses.checked = allClassList.length > 0 && allClassList.length === visibleClassList.length; document.getElementById('class-settings-modal').style.display = 'flex'; });
	selectAllVisibleClasses.addEventListener('change', (e) => { document.querySelectorAll('.visible-class-checkbox').forEach(checkbox => { checkbox.checked = e.target.checked; }); });
	document.getElementById('class-settings-modal').querySelector('.close-btn').addEventListener('click', () => { document.body.classList.remove('modal-open'); document.getElementById('class-settings-modal').style.display = 'none'; });
	saveClassSettingsBtn.addEventListener('click', async () => { const newVisibleClasses = []; classSettingsList.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => { newVisibleClasses.push(checkbox.value); }); try { await db.collection('users').doc(currentUser.uid).update({ visibleClasses: newVisibleClasses }); visibleClassList = newVisibleClasses; renderLayout(); document.getElementById('class-settings-modal').querySelector('.close-btn').click(); alert('設定已儲存！'); } catch(error) { alert("儲存失敗"); } });
	const resetLayoutBtn = document.getElementById('reset-layout-btn');
	if (resetLayoutBtn) {
		resetLayoutBtn.addEventListener('click', () => {
			document.getElementById('dropdown-menu').classList.remove('show');
			if (confirm('確定要清除自訂的班級排版，恢復預設的「依年段分列」顯示嗎？')) {
				localStorage.removeItem('custom_class_order_v1');
				classSortState = 0; // 強制切回預設排序
				const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
				updateSortButtonDisplay(classSortState, mainSortDownArrow, mainSortUpArrow, '#f4d03f', 'main');
				renderLayout();
			}
		});
	}
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

	const sysSwitchBtn = document.getElementById('sys-switch-btn');
	const sysSwitchMenu = document.getElementById('sys-switch-menu');

	if (sysSwitchBtn) {
		sysSwitchBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const userDropdown = document.getElementById('dropdown-menu');
			if (userDropdown) userDropdown.classList.remove('show');
			sysSwitchMenu.classList.toggle('show');
			updateHomeIcons();
		});
	}

	window.addEventListener('click', (e) => {
		if (sysSwitchMenu && !e.target.closest('.system-switcher-container')) {
			sysSwitchMenu.classList.remove('show');
		}
	});

	window.setDefaultSystem = function(pageName, sysName) {
		const current = localStorage.getItem('defaultSystemPage');
		if (current === pageName && pageName !== 'teacher.html') {
			localStorage.removeItem('defaultSystemPage');
			alert('已取消預設，登入後將回到「綜合紀錄系統」。');
		} else {
			localStorage.setItem('defaultSystemPage', pageName);
			alert(`設定成功，下次登入會直接進入 "${sysName}" !`);
		}
		updateHomeIcons();
	};

	function updateHomeIcons() {
		const currentDefault = localStorage.getItem('defaultSystemPage') || 'teacher.html';
		const items = document.querySelectorAll('.sys-item');
		items.forEach(item => {
			const targetPage = item.dataset.target;
			if (targetPage === currentDefault) {
				item.classList.add('is-default');
				item.querySelector('.sys-home-icon').title = "目前是預設首頁 (點擊可取消)";
			} else {
				item.classList.remove('is-default');
				item.querySelector('.sys-home-icon').title = "設為登入後首頁";
			}
		});
	}

	myTimetableIconBtn.addEventListener('click', async () => {
		document.getElementById('dropdown-menu').classList.remove('show');
		if (autoOpenHomepageChk) {
			const currentPref = localStorage.getItem('homepagePreference');
			autoOpenHomepageChk.checked = (currentPref === 'timetable');
		}
		if (!scheduleDataLoaded) {
			timetableMessage.textContent = '課表數據正在載入中...';
		}
		myTimetableTitle.textContent = `${currentUserData.displayName} 的課表`;
		if (PERIOD_TIMES.length === 0) {
			myTimetableBody.innerHTML = '<p style="text-align: center; color: var(--danger-color);">錯誤：未載入課程時間表數據。</p>';
			timetableMessage.textContent = '資料錯誤';
		} else if (!teacherTimetableData || Object.keys(teacherTimetableData.periods).length === 0) {
			myTimetableBody.innerHTML = '<p style="text-align: center;">找不到您的課表資料。</p>';
			timetableMessage.textContent = '資料錯誤';
		} else {
			currentWeekStart = getMonday(new Date());
			await renderDerivedMyTimetable(10);
			timetableMessage.textContent = '';
		}
		const hasChanges = activeChanges && activeChanges.length > 0;
		const prevChangeBtn = document.getElementById('prev-change-week-btn');
		const nextChangeBtn = document.getElementById('next-change-week-btn');
		if (hasChanges) {
			prevChangeBtn.disabled = false;
			nextChangeBtn.disabled = false;
			prevChangeBtn.style.opacity = 1;
			nextChangeBtn.style.opacity = 1;
			prevChangeBtn.title = "跳至上一個有異動的週次";
			nextChangeBtn.title = "跳至下一個有異動的週次";
		} else {
			prevChangeBtn.disabled = true;
			nextChangeBtn.disabled = true;
			prevChangeBtn.style.opacity = 0.5;
			nextChangeBtn.style.opacity = 0.5;
			prevChangeBtn.title = "目前無任何調代課紀錄";
			nextChangeBtn.title = "目前無任何調代課紀錄";
		}
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
		prevChangeBtn.onclick = () => {
			if (!prevChangeBtn.disabled) {
				const targetWeek = findNextChangeWeek(-1);
				if (targetWeek) {
					currentWeekStart = targetWeek;
					renderDerivedMyTimetable(-1);
				} else {
					alert('沒有找到更早的異動週次了。');
				}
			}
		};
		nextChangeBtn.onclick = () => {
			if (!nextChangeBtn.disabled) {
				const targetWeek = findNextChangeWeek(1);
				if (targetWeek) {
					currentWeekStart = targetWeek;
					renderDerivedMyTimetable(1);
				} else {
					alert('沒有找到更晚的異動週次了。');
				}
			}
		};
		document.body.classList.add('modal-open');
		myTimetableModal.style.display = 'flex';
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
	}

	const dateRangeSettingsBtn = document.getElementById('date-range-settings-btn');
	const dateRangeModal = document.getElementById('date-range-modal');
	const sysDateDisplay = document.getElementById('system-date-range-display');
	const saveDateRangeBtn = document.getElementById('save-date-range-btn');
	const clearDateRangeBtn = document.getElementById('clear-date-range-btn');

	function updateDateRangeDisplay() {
		if (!sysDateDisplay || !currentUserData) return;
		// 簡化顯示，只要有任何設定就顯示為已設定
		const hasSettings = currentUserData.perfStartDate || currentUserData.perfEndDate || currentUserData.gradesStartDate || currentUserData.gradesEndDate;
		sysDateDisplay.textContent = hasSettings ? '📅 期間已設定' : '📅 全部期間';
	}

	if (dateRangeSettingsBtn && dateRangeModal) {
		dateRangeSettingsBtn.addEventListener('click', () => {
			document.getElementById('dropdown-menu').classList.remove('show');
			document.getElementById('sys-perf-start').value = currentUserData.perfStartDate || '';
			document.getElementById('sys-perf-end').value = currentUserData.perfEndDate || '';
			document.getElementById('sys-grades-start').value = currentUserData.gradesStartDate || '';
			document.getElementById('sys-grades-end').value = currentUserData.gradesEndDate || '';
			document.body.classList.add('modal-open');
			dateRangeModal.style.display = 'flex';
		});
		if (sysDateDisplay) sysDateDisplay.addEventListener('click', () => dateRangeSettingsBtn.click());
		const syncDateRangeToDB = async (pStart, pEnd, gStart, gEnd) => {
			try {
				const updateData = {
					perfStartDate: pStart ? pStart : firebase.firestore.FieldValue.delete(),
					perfEndDate: pEnd ? pEnd : firebase.firestore.FieldValue.delete(),
					gradesStartDate: gStart ? gStart : firebase.firestore.FieldValue.delete(),
					gradesEndDate: gEnd ? gEnd : firebase.firestore.FieldValue.delete()
				};
				await db.collection('users').doc(currentUser.uid).update(updateData);
				const cachedAuthData = JSON.parse(localStorage.getItem(USER_AUTH_KEY));
				if(cachedAuthData) {
					if (pStart) cachedAuthData.userData.perfStartDate = pStart; else delete cachedAuthData.userData.perfStartDate;
					if (pEnd) cachedAuthData.userData.perfEndDate = pEnd; else delete cachedAuthData.userData.perfEndDate;
					if (gStart) cachedAuthData.userData.gradesStartDate = gStart; else delete cachedAuthData.userData.gradesStartDate;
					if (gEnd) cachedAuthData.userData.gradesEndDate = gEnd; else delete cachedAuthData.userData.gradesEndDate;
					localStorage.setItem(USER_AUTH_KEY, JSON.stringify(cachedAuthData));
				}
				localStorage.removeItem(DYNAMIC_CACHE_KEY);
				localStorage.removeItem('teacher_grades_list_cache_v1');
				localStorage.removeItem('calculator_cache_v1');
				localStorage.removeItem('report_cache_v1');
				window.location.reload();
			} catch (e) { alert('設定同步失敗：' + e.message); }
		};
		saveDateRangeBtn.addEventListener('click', () => {
			saveDateRangeBtn.textContent = '儲存中...';
			syncDateRangeToDB(
				document.getElementById('sys-perf-start').value,
				document.getElementById('sys-perf-end').value,
				document.getElementById('sys-grades-start').value,
				document.getElementById('sys-grades-end').value
			);
		});
		clearDateRangeBtn.addEventListener('click', () => {
			clearDateRangeBtn.textContent = '清除中...';
			syncDateRangeToDB(null, null, null, null);
		});
	}

	let originalInit = initialize;
	const recordsToggleBtn = document.getElementById('records-toggle-btn');
	const quickTextPanel = document.getElementById('quick-text-panel');
	const recordsToggleIcon = document.getElementById('records-toggle-icon');
	
	if (recordsToggleBtn && quickTextPanel) {
		// 展開/收合切換
		recordsToggleBtn.addEventListener('click', () => {
			if (quickTextPanel.style.display === 'none') {
				quickTextPanel.style.display = 'flex';
				recordsToggleIcon.textContent = '▲';
			} else {
				quickTextPanel.style.display = 'none';
				recordsToggleIcon.textContent = '▼';
			}
		});

		// 點選標籤取代輸入框文字
		quickTextPanel.addEventListener('click', (e) => {
			if (e.target.classList.contains('quick-text-pill')) {
				const text = e.target.textContent;
				const input = document.getElementById('record-text');
				input.value = text;  // 將文字放入（取代）輸入欄位
				input.focus();
				
				// 給予視覺回饋 (閃爍底色)
				input.style.backgroundColor = '#fff3cd';
				setTimeout(() => input.style.backgroundColor = '', 300);
			}
		});
	}
	
	let mediaRecorder = null;
	let audioChunks = [];
	let recordInterval = null;
	let recordSeconds = 0;

	if (btnSelectAttachment) {
		// 1. 檔案與相機 (透過 input)
		btnSelectAttachment.addEventListener('click', () => recordAttachmentInput.click());
		btnCameraPhoto.addEventListener('click', () => recordCameraPhotoInput.click());
		btnCameraVideo.addEventListener('click', () => recordCameraVideoInput.click());

		const handleFileSelection = (e) => {
			if (e.target.files.length > 0) {
				selectedFile = e.target.files[0];
				
				if (selectedFile.size > 10 * 1024 * 1024) {
					alert('檔案大小不能超過 10MB！');
					clearAttachmentSelection();
					return;
				}

				let displayName = selectedFile.name;
				if (e.target.id.includes('camera') || displayName.toLowerCase() === 'image.jpg' || displayName.toLowerCase() === 'video.mp4') {
					const ext = selectedFile.type.includes('video') ? 'mp4' : 'jpg';
					const prefix = selectedFile.type.includes('video') ? '即時錄影' : '即時照片';
					const timeString = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, '');
					displayName = `${prefix}_${timeString}.${ext}`;
					selectedFile = new File([selectedFile], displayName, { type: selectedFile.type });
				}
				
				attachmentNameDisplay.textContent = selectedFile.name;
				attachmentNameDisplay.style.color = '#555';
				btnClearAttachment.style.display = 'inline-block';
			}
		};

		recordAttachmentInput.addEventListener('change', handleFileSelection);
		recordCameraPhotoInput.addEventListener('change', handleFileSelection);
		recordCameraVideoInput.addEventListener('change', handleFileSelection);
		btnClearAttachment.addEventListener('click', clearAttachmentSelection);

		// 2. 網頁錄音 API 實作
		const btnStopAudio = document.getElementById('btn-stop-audio');
		const recordTimer = document.getElementById('record-timer');

		btnCameraAudio.addEventListener('click', async () => {
			try {
				// 請求麥克風權限
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				mediaRecorder = new MediaRecorder(stream);
				audioChunks = [];

				mediaRecorder.ondataavailable = e => {
					if (e.data.size > 0) audioChunks.push(e.data);
				};

				mediaRecorder.onstop = () => {
					// 錄音結束，組合檔案
					const audioBlob = new Blob(audioChunks, { type: 'audio/mp4' });
					const timeString = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, '');
					const displayName = `即時錄音_${timeString}.m4a`;
					
					selectedFile = new File([audioBlob], displayName, { type: 'audio/mp4' });

					// 更新 UI
					attachmentNameDisplay.textContent = selectedFile.name;
					attachmentNameDisplay.style.color = '#555';
					btnClearAttachment.style.display = 'inline-block';

					// 釋放麥克風資源
					stream.getTracks().forEach(track => track.stop());
				};

				// 開始錄音
				mediaRecorder.start();

				// UI 切換：隱藏錄音按鈕，顯示停止按鈕並開始計時
				btnCameraAudio.style.display = 'none';
				btnStopAudio.style.display = 'inline-block';
				recordSeconds = 0;
				recordTimer.textContent = '00:00';
				
				recordInterval = setInterval(() => {
					recordSeconds++;
					const m = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
					const s = String(recordSeconds % 60).padStart(2, '0');
					recordTimer.textContent = `${m}:${s}`;
				}, 1000);

			} catch (err) {
				alert('無法開啟麥克風！請確認您已允許瀏覽器使用麥克風權限。\n' + err.message);
			}
		});

		// 點擊停止錄音
		btnStopAudio.addEventListener('click', () => {
			if (mediaRecorder && mediaRecorder.state !== 'inactive') {
				mediaRecorder.stop();
			}
			clearInterval(recordInterval);
			btnStopAudio.style.display = 'none';
			btnCameraAudio.style.display = 'inline-block';
		});
	}

	function clearAttachmentSelection() {
		selectedFile = null;
		if (recordAttachmentInput) recordAttachmentInput.value = '';
		if (recordCameraPhotoInput) recordCameraPhotoInput.value = '';
		if (recordCameraVideoInput) recordCameraVideoInput.value = '';
		if (attachmentNameDisplay) attachmentNameDisplay.textContent = '';
		if (btnClearAttachment) btnClearAttachment.style.display = 'none';
		
		// 如果正在錄音卻被關閉視窗，強迫停止
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			clearInterval(recordInterval);
			document.getElementById('btn-stop-audio').style.display = 'none';
			btnCameraAudio.style.display = 'inline-block';
		}
	}
	
	initialize = async function(userData, forceReload = false, forceItem = 0) {
		await originalInit(userData, forceReload, forceItem);
		updateDateRangeDisplay();
	};
	const SEARCH_HISTORY_KEY = 'teacher_student_search_history_v1';
	const searchBtn = document.getElementById('student-search-btn');
	const searchModal = document.getElementById('student-search-modal');
	const searchInput = document.getElementById('student-search-input');
	const resultsArea = document.getElementById('search-results-area');
	const historyArea = document.getElementById('search-history-area');
	const resultsList = document.getElementById('search-results-list');
	const historyList = document.getElementById('search-history-list');

	function getSearchHistory() {
		try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []; }
		catch { return []; }
	}

	function saveSearchHistory(history) {
		localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
	}

	function addToHistory(sysId) {
		let history = getSearchHistory();
		history = history.filter(id => id !== sysId); // 移除重複
		history.unshift(sysId); // 塞到最前面
		if (history.length > 20) history = history.slice(0, 20); // 最多 20 筆
		saveSearchHistory(history);
	}

	function renderSearchList(studentSysIds, container, isHistory = false) {
		container.innerHTML = '';
		
		// 將傳入的 sysId 陣列，轉換成最新的學生實體資料 (過濾掉已離校的)
		const validStudents = [];
		studentSysIds.forEach(sysId => {
			const stu = studentsData.find(s => s.sysId === sysId);
			if (stu) validStudents.push(stu);
		});

		if (validStudents.length === 0) {
			container.innerHTML = `<div style="padding: 15px; color: #999; text-align: center;">${isHistory ? '尚無查詢紀錄' : '找不到符合的學生'}</div>`;
			return;
		}

		validStudents.forEach(stu => {
			const currentScore = allPerformanceScores[stu.sysId] || 0;
			
			const div = document.createElement('div');
			div.className = 'search-list-item';
			div.innerHTML = `
				<div class="search-list-info">
					<span class="search-list-class">${stu.id}</span> 
					${stu.name}
				</div>
				<div class="search-list-score">${currentScore.toFixed(1)}</div>
			`;
			
			// 點擊後：加入歷史、關閉搜尋窗、直接打開該生紀錄視窗
			div.onclick = () => {
				addToHistory(stu.sysId);
				searchModal.style.display = 'none';
				document.body.classList.remove('modal-open');
				openModal(stu.sysId, 'student', 'main');
			};
			container.appendChild(div);
		});
	}

	if (searchBtn && searchModal) {
		// 開啟搜尋視窗
		searchBtn.addEventListener('click', () => {
			document.getElementById('dropdown-menu').classList.remove('show');
			searchInput.value = '';
			resultsArea.style.display = 'none';
			historyArea.style.display = 'block';
			
			renderSearchList(getSearchHistory(), historyList, true);
			
			document.body.classList.add('modal-open');
			searchModal.style.display = 'flex';
			setTimeout(() => searchInput.focus(), 100);
		});

		// 輸入關鍵字即時比對
		searchInput.addEventListener('input', (e) => {
			const keyword = e.target.value.trim().toLowerCase();
			if (!keyword) {
				resultsArea.style.display = 'none';
				historyArea.style.display = 'block';
				renderSearchList(getSearchHistory(), historyList, true);
				return;
			}
			
			historyArea.style.display = 'none';
			resultsArea.style.display = 'block';
			
			// 找出名字包含關鍵字的學生，並抽取他們的 sysId
			const matchedIds = studentsData
				.filter(s => s.name.toLowerCase().includes(keyword))
				.map(s => s.sysId);
				
			renderSearchList(matchedIds, resultsList, false);
		});
	}
	// ==========================================
	// 最近登記紀錄學生列表功能
	// ==========================================
	const recentRecordsBtn = document.getElementById('recent-records-btn');
	const recentStudentsModal = document.getElementById('recent-students-modal');
	const recentStudentsList = document.getElementById('recent-students-list');
	const insertRedeemLink = document.getElementById('insert-redeem-link');
	if (insertRedeemLink) {
		insertRedeemLink.addEventListener('click', (e) => {
			e.preventDefault();
			const input = document.getElementById('record-text');
			
			// 直接取代內容為「兌換」，確保符合兌換豁免規則
			input.value = '兌換';
			
			input.focus();
			// 視覺回饋
			input.style.backgroundColor = '#d1e7dd';
			setTimeout(() => input.style.backgroundColor = '', 300);
		});
	}

if (recentRecordsBtn && recentStudentsModal) {
		let recentSortState = 0; // 0: 座號遞增, 1: 座號遞減, 2: 最近時間
		let currentRecentStudents = []; // 暫存撈出的 20 筆資料

		function updateRecentSortArrow() {
			const upArrow = document.getElementById('recent-sort-up-arrow');
			const downArrow = document.getElementById('recent-sort-down-arrow');
			if (!upArrow || !downArrow) return;
			
			upArrow.classList.remove('active');
			downArrow.classList.remove('active');
			upArrow.style.color = '#999';
			downArrow.style.color = '#999';
			
			if (recentSortState === 0) {
				upArrow.classList.add('active');
				upArrow.style.color = '#ff9800'; // 座號升冪 (亮上箭頭)
			} else if (recentSortState === 1) {
				downArrow.classList.add('active');
				downArrow.style.color = '#ff9800'; // 座號降冪 (亮下箭頭)
			}
			// 狀態 2 (時間序) 兩者皆灰，表示原始時間狀態
		}

		function renderRecentStudentsList() {
			recentStudentsList.innerHTML = '';
			if (currentRecentStudents.length === 0) {
				recentStudentsList.innerHTML = '<div style="padding: 15px; color: #999; text-align: center;">尚無任何學生紀錄</div>';
				return;
			}

			let listToRender = [...currentRecentStudents];
			const isSortedByClass = recentSortState === 0 || recentSortState === 1;
			
			if (recentSortState === 0) {
				listToRender.sort((a, b) => a.studentId.localeCompare(b.studentId));
			} else if (recentSortState === 1) {
				listToRender.sort((a, b) => b.studentId.localeCompare(a.studentId));
			} else {
				listToRender.sort((a, b) => a.originIndex - b.originIndex);
			}

			let currentClassTracker = '';

			listToRender.forEach(item => {
				const stuClass = item.studentId.substring(0, 3);
				
				// 如果是依照座號排序，且遇到不同的班級，就插入一條班級分隔列
				if (isSortedByClass && stuClass !== currentClassTracker) {
					currentClassTracker = stuClass;
					const divider = document.createElement('div');
					divider.className = 'search-list-class-divider';
					// 讓班級標題變成可點擊的按鈕外觀
					divider.innerHTML = `<span style="cursor: pointer; display: flex; align-items: center; gap: 5px;" title="點擊進入班級紀錄">▶ ${stuClass} 班 <span style="font-size: 0.8em; color: #888; font-weight: normal;">(點擊進入班級)</span></span>`;
					
					divider.querySelector('span').onclick = (e) => {
						e.stopPropagation();
						recentStudentsModal.style.display = 'none';
						document.body.classList.remove('modal-open');
						// 打開班級紀錄，並標記來源為 'recent'
						openModal(stuClass, 'class', 'recent');
					};
					recentStudentsList.appendChild(divider);
				}

				const div = document.createElement('div');
				div.className = 'search-list-item';
				
				// 若已經有分班標題，名單內的座號就可以精簡，只顯示末兩碼 (例如: 10105 -> 05)
				// 若是時間排序 (混班)，則顯示完整五碼
				const displaySeat = isSortedByClass ? item.studentId.substring(3) : item.studentId;

				let attachmentHtml = '';
				if (item.attachmentUrl) {
					let icon = '📎';
					let fName = (item.attachmentName || '').toLowerCase();
					if (fName.endsWith('.pdf')) icon = '📄';
					else if (fName.match(/\.(jpg|jpeg|png|gif)$/)) icon = '🖼️';
					else if (fName.match(/\.(mp3|wav|m4a)$/)) icon = '🎵';
					else if (fName.match(/\.(mp4|mov)$/)) icon = '🎞️';
					
					// onclick 加上 event.stopPropagation() 防止點擊附件時觸發進入學生紀錄的動作
					attachmentHtml = `<a href="${item.attachmentUrl}" target="_blank" title="開啟附件: ${item.attachmentName}" style="text-decoration: none; margin-left: 5px; font-size: 1.1em; flex-shrink: 0; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));" onclick="event.stopPropagation();">${icon}</a>`;
				}

				div.innerHTML = `
					<div class="search-list-info" style="flex-grow: 1; min-width: 0;">
						<span class="search-list-class" style="${isSortedByClass ? 'width: 20px; text-align: right;' : ''} flex-shrink: 0;">${displaySeat}</span> 
						<span style="flex-shrink: 0;">${item.studentName}</span>
						<span class="search-list-recent-text" style="max-width: none; flex-grow: 1;">${item.latestText}</span>
						${attachmentHtml}
					</div>
					<div class="search-list-score" style="margin-left: 10px; flex-shrink: 0;">${item.pointsDisplay}</div>
				`;
				
				div.onclick = () => {
					recentStudentsModal.style.display = 'none';
					document.body.classList.remove('modal-open');
					// 打開學生紀錄，並標記來源為 'recent'
					openModal(item.sysId, 'student', 'recent');
				};
				recentStudentsList.appendChild(div);
			});
		}

		recentRecordsBtn.addEventListener('click', () => {
			document.getElementById('dropdown-menu').classList.remove('show');
			
			// 1. 從 allPerformanceRecords 提取最近的學生 sysId (去重複)
			const uniqueRecentSysIds = new Set();
			const sortedRecords = [...allPerformanceRecords].sort((a, b) => {
				const tA = a.timestamp?.seconds || a.timestamp?.toMillis?.() / 1000 || 0;
				const tB = b.timestamp?.seconds || b.timestamp?.toMillis?.() / 1000 || 0;
				return tB - tA;
			});

			for (const r of sortedRecords) {
				const sysId = r.entityId || r.studentId;
				const type = r.entityType || 'student';
				if (type === 'student' && sysId) {
					uniqueRecentSysIds.add(sysId);
				}
				if (uniqueRecentSysIds.size >= 20) break;
			}

			// 2. 統整資料為陣列，方便排序
			currentRecentStudents = [];
			let originIdx = 0; // 記錄原始的時間順序

			uniqueRecentSysIds.forEach(sysId => {
				const stu = studentsData.find(s => s.sysId === sysId);
				if (!stu) return; 

				const latestRecord = sortedRecords.find(r => (r.entityId === sysId || r.studentId === sysId));
				if (!latestRecord) return; 

				let latestText = (latestRecord.text || '').trim();
				// 移除 5 個字的強制截斷，交給 CSS 自動處理版面
				
				const eventPoints = latestRecord.points || 0;
				const pointsDisplay = eventPoints > 0 ? `+${eventPoints}` : eventPoints;

				currentRecentStudents.push({
					sysId: sysId,
					studentId: stu.id,
					studentName: stu.name,
					latestText: latestText,
					attachmentUrl: latestRecord.attachmentUrl || null,   // 新增：提取附件網址
					attachmentName: latestRecord.attachmentName || null, // 新增：提取附件名稱
					pointsDisplay: pointsDisplay,
					originIndex: originIdx++
				});
			});

			// 預設開啟時套用「座號遞增(0)」排序
			recentSortState = 0; 
			updateRecentSortArrow();
			renderRecentStudentsList();

			document.body.classList.add('modal-open');
			recentStudentsModal.style.display = 'flex';
		});

		// 綁定排序按鈕點擊事件
		const recentSortBtn = document.getElementById('recent-sort-btn');
		if (recentSortBtn) {
			recentSortBtn.addEventListener('click', () => {
				recentSortState = (recentSortState + 1) % 3;
				updateRecentSortArrow();
				renderRecentStudentsList();
			});
		}
	}
});
