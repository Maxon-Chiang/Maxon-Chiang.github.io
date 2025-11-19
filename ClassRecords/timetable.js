const firebaseConfig = {
    apiKey: "AIzaSyAVLFoqQlSR5NK_ZaWgL07eA2LMsfHT_Ew",
    authDomain: "classrecords-13902.firebaseapp.com",
    projectId: "classrecords-13902",
    storageBucket: "classrecords-13902.firebasestorage.app",
    messagingSenderId: "431747377367",
    appId: "1:431747377367:web:b157a8f5c59ce38091e892",
    measurementId: "G-JWTQGM9XMP"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;
let currentUserDisplayName = '';
const recentSchedulesBtn = document.getElementById('recent-schedules-btn');
const recentSchedulesList = document.getElementById('recent-schedules-list');
const MAX_RECENT_ITEMS = 10;
const REFRESH_FLAG_KEY = 'teacherTimetableNeedsRefresh';
const TRANSFER_KEY = 'initialActiveChanges'; 
const USER_AUTH_KEY = 'user_auth_profile_v1';
const STATIC_CACHE_KEY = 'teacher_static_cache_v6';
const TIMETABLE_CACHE_KEY = 'timetable_static_cache_v1'; 
let CACHE_DATA = {};
let PERIOD_TIMES = []; 
let scheduleSnapshot = null;
let teachersDataCache = new Map(); 

const SUBJECT_ORDER = ['國文', '英語', '數學', '社會', '自然', '綜合', '藝術', '健體', '科技'];

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        const displayElement = document.getElementById('user-email');
        let userData = null;
        try {
            const cachedAuthData = localStorage.getItem(USER_AUTH_KEY);
            if (cachedAuthData) {
                const parsedCache = JSON.parse(cachedAuthData);
                userData = parsedCache.userData;
                console.log('✨ 讀取 USER_AUTH_KEY 快取，跳過 Firestore 載入。');
            }
        } catch (e) {
             console.error('❌ 解析 AUTH 快取失敗:', e);
             localStorage.removeItem(USER_AUTH_KEY);
        }
        if (!userData) {
            console.log('載入user資料...');
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) { 
                userData = userDoc.data();
            } else {
                 alert('錯誤：找不到用戶資料，請重新登入。');
                 auth.signOut();
                 return;
            }
             localStorage.setItem(USER_AUTH_KEY, JSON.stringify({
                 uid: user.uid,
                 userData: userData,
                 lastUpdated: new Date().getTime()
             }));
        }
        if (userData && userData.displayName) {
             displayElement.textContent = userData.displayName;
             currentUserDisplayName = userData.displayName;
        } else {
             displayElement.textContent = user.email;
             currentUserDisplayName = user.email;
        }
        main(userData);
    } else {
        window.location.href = 'login.html';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
});

function getPeriodTimeInfo(periodNum) {
    const info = PERIOD_TIMES.find(p => p.period === periodNum);
    if (!info) return null;
    const [startH, startM] = info.start.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + info.duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return {
        start: info.start,
        duration: info.duration,
        end: `${pad(endH)}:${pad(endM)}`, 
        endMinutes: totalMinutes
    };
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

async function loadPeriodTimesFromFirestore(schoolId) {
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
    try {
        const periodsDoc = await db.collection('schools').doc(schoolId)
                                   .collection('periods').doc('current').get();
		console.log('載入節次資料...');
        if (periodsDoc.exists && periodsDoc.data().times && periodsDoc.data().times.length > 0) {
            PERIOD_TIMES = periodsDoc.data().times.map(item => ({
                period: item.period,
                start: item.start,
                duration: item.duration || 50 
            }));
            PERIOD_TIMES.sort((a, b) => a.period - b.period);
        }
    } catch (error) {
         console.warn("載入課程時間表失敗，使用預設值:", error);
    }
}

async function main(userData) {
	const staticCache = sessionStorage.getItem(STATIC_CACHE_KEY);
	if (staticCache) {
		try {
			staticData = JSON.parse(staticCache);
			PERIOD_TIMES = staticData.PERIOD_TIMES;
			console.log(`✨ 成功載入來自 teacher.html 的靜態資料。`);
		} catch (e) {
			console.error("❌ 解析傳遞的靜態資料失敗，改為檢查本地快取。", e);
		}
	}
	if (staticData.length === 0) {
		await loadPeriodTimesFromFirestore(userData.schoolId);
	}

    const transferredChanges = sessionStorage.getItem(TRANSFER_KEY);
	if (transferredChanges) {
		try {
			activeChanges = JSON.parse(transferredChanges);
			console.log(`✨ 成功載入 ${activeChanges.length} 筆傳遞的異動數據（來自 teacher.html）。`);
            // sessionStorage.removeItem(TRANSFER_KEY); 
		} catch (e) {
			console.error("❌ 解析傳遞的異動數據失敗，改為檢查本地快取。", e);
		}
    } 
    if (activeChanges.length === 0) {
        await loadActiveChanges();
    }
	
	const manualReloadBtn = document.getElementById('manual-reload-btn');
    if(manualReloadBtn){
        manualReloadBtn.addEventListener('click', () => {
            if(confirm('確定要從雲端重新下載最新課表資料嗎？')) {
                // 清除課表專用快取
                localStorage.removeItem(TIMETABLE_CACHE_KEY);
                // 建議也清除 Auth 快取以確保角色權限最新
                //localStorage.removeItem(USER_AUTH_KEY); 
                window.location.reload();
            }
        });
    }
    populateRecentList();
    const welcomeModal = document.getElementById('welcome-modal-timetable');
    if (localStorage.getItem('hideTimetableWelcome') !== 'true') {
        setTimeout(() => {
            welcomeModal.style.display = 'block';
        }, 500);
    }
    const closeWelcome = () => {
        if (document.getElementById('dont-show-again-timetable').checked) {
            localStorage.setItem('hideTimetableWelcome', 'true');
        }
        welcomeModal.style.display = 'none';
    };
    welcomeModal.querySelector('.close-button').onclick = closeWelcome;
    document.getElementById('close-welcome-timetable-btn').onclick = closeWelcome;
    const urlParams = new URLSearchParams(window.location.search);
    const teacherNameToShow = urlParams.get('teacher');
    if (!userData || !userData.schoolId) {
        alert('錯誤：您的帳號資料不完整，找不到 schoolId。');
        document.querySelector('.container').innerHTML = '<h2>讀取資料失敗：帳號未綁定學校 ID。</h2>';
        return;
    }
    const schoolId = userData.schoolId;
    let useCache = false;
    try {
        const storedCache = localStorage.getItem(TIMETABLE_CACHE_KEY);
        if (storedCache) {
            const parsedCache = JSON.parse(storedCache);
            if (parsedCache.schoolId === schoolId) {
                CACHE_DATA = parsedCache;
                console.log('✨ 快取命中：加速載入靜態課表資料...');
                PERIOD_TIMES = CACHE_DATA.PERIOD_TIMES || PERIOD_TIMES;
                scheduleSnapshot = { forEach: (callback) => (CACHE_DATA.scheduleData || []).forEach(callback), size: CACHE_DATA.scheduleData ? CACHE_DATA.scheduleData.length : 0 };
                CACHE_DATA.teacherList.forEach(item => teachersDataCache.set(item.id, item.data));
                useCache = true;
            } else {
                localStorage.removeItem(TIMETABLE_CACHE_KEY);
            }
        }
    } catch (e) {
        console.error('❌ 讀取課表快取失敗:', e);
        localStorage.removeItem(TIMETABLE_CACHE_KEY);
    }
    const schoolRef = db.collection('schools').doc(schoolId);
    if (!useCache) {
        scheduleSnapshot = await schoolRef.collection('timetables').get();
        console.log('載入所有教師課表'); 
        const teachersSnapshot = await schoolRef.collection('teachers').get();
        console.log('載入所有教師資料'); 
        teachersDataCache.clear();
        teachersSnapshot.forEach(doc => {
            teachersDataCache.set(doc.id, doc.data());
        });
        CACHE_DATA = {
            schoolId: schoolId,
            PERIOD_TIMES: PERIOD_TIMES,
            scheduleData: scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            teacherList: [...teachersDataCache.entries()].map(([id, data]) => ({ id, data })),
        };
        localStorage.setItem(TIMETABLE_CACHE_KEY, JSON.stringify(CACHE_DATA));
    }
	/*
    const teacherNameToId = new Map();
    const usersSnapshot = await db.collection('users').where('schoolId', '==', schoolId).get();
	console.log('載入所有教師帳號');
    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.displayName && userData.role === 'teacher') {
            teacherNameToId.set(userData.displayName, doc.id);
        }
    });
	*/
    runPostCacheLogic(teacherNameToShow);
}

let currentView = 'subject'; 
let longPressTimer;
const LONG_PRESS_DURATION = 500;
let currentWeekStart = getMonday(new Date());
let activeSchedule = { type: null, name: null };
let teacherViewSelectedCell = null;
let classViewSelectedCell = null;
let activeChanges = [];
let staticData = [];
let allTeachersList = [];
let substitutionInfo = {};
let allTeachersWithSchedule;
const classSchedules = new Map();
const teacherSchedules = new Map();

function runPostCacheLogic(teacherNameToShow) {
    allTeachersWithSchedule = deriveSchedules();
    allTeachersList = [...allTeachersWithSchedule].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    populateTeacherListBySubject(allTeachersWithSchedule); 
    populateClassList();
    bindEventListeners(); 
    
    if (teacherNameToShow) {
        setTimeout(() => {
            const decodedTeacherName = decodeURIComponent(teacherNameToShow);
            if (teacherSchedules.has(decodedTeacherName)) {
                showSchedule(decodedTeacherName, 'teacher');
            } else {
                console.error(`找不到教師「${decodedTeacherName}」的課表資料。`);
            }
        }, 100);
    } else {
        // 修改：加入自動開啟的判斷邏輯
        const lastScheduleJSON = localStorage.getItem('lastSchedule');
        const AUTO_OPEN_KEY = 'timetable_auto_open_preference';
        // 預設為 true (若無設定則視為開啟，以保持舊有體驗，除非使用者手動取消)
        const shouldAutoOpen = localStorage.getItem(AUTO_OPEN_KEY) !== 'false';

        if (lastScheduleJSON && shouldAutoOpen) {
            const savedData = JSON.parse(lastScheduleJSON);
            if (savedData.savedBy && savedData.savedBy === currentUser.uid) {
                const lastSchedule = savedData.schedule;
                lastSchedule.view = 'subject'; 
                if (lastSchedule?.type && lastSchedule?.name) {
                    activeSchedule = { type: lastSchedule.type, name: lastSchedule.name };
                    setTimeout(() => showSchedule(lastSchedule.name, lastSchedule.type), 100);
                }
            } else {
                localStorage.removeItem('lastSchedule');
            }
        }
    }
}

function log(message) {
    console.log(message);
}

function findNextAvailableDate(initialDate, period, day) {
    let nextAvailableDate = new Date(initialDate);
    let safetyCounter = 0;
    while (safetyCounter < 100) {
        const dateString = formatDate(nextAvailableDate, 'YYYY-MM-DD');
        const dayIndex = nextAvailableDate.getDay() - 1;
        const conflict = activeChanges.find(change => {
            if (change.type === 'substitution' || (change.type === 'exchange' && change.originalLessonInfo) ) {
                const info = change.type === 'substitution' ? change.lessonInfo : change.originalLessonInfo;
                const changeDate = change.type === 'substitution' ? change.date : info.date;
                return changeDate === dateString && info.period === period && dayIndex === day;
            }
            if (change.type === 'swap') {
                const infoA = change.originalClassInfo;
                const infoB = change.targetClassInfo;
                return (infoA.date === dateString && infoA.period === period && infoA.day === day) ||
                       (infoB.date === dateString && infoB.period === period && infoB.day === day);
            }
            return false;
        });
        if (conflict) {
            nextAvailableDate.setDate(nextAvailableDate.getDate() + 7);
            safetyCounter++;
        } else {
            return nextAvailableDate;
        }
    }
    console.warn("尋找可用日期超過 100 週，可能存在邏輯問題。");
    return new Date(initialDate);
}

function isDateConflict(dateString, period, day) {
    const dayIndex = new Date(dateString).getDay() - 1;
    if (dayIndex !== day) {
    }
    const conflict = activeChanges.find(change => {
        if (change.status !== 'active') return false;
        if (change.type === 'substitution') {
            return change.date === dateString && change.lessonInfo.period === period;
        }
        if (change.type === 'exchange') {
            const infoA = change.originalLessonInfo;
            const infoB = change.exchangeLessonInfo;
            return (infoA.date === dateString && infoA.period === period) ||
                   (infoB.date === dateString && infoB.period === period);
        }
        if (change.type === 'swap') {
            const infoA = change.originalClassInfo;
            const infoB = change.targetClassInfo;
            return (infoA.date === dateString && infoA.period === period && infoA.day === day) ||
                   (infoB.date === dateString && infoB.period === period && infoB.day === day);
        }
        return false;
    });
    return conflict || null;
}

async function loadActiveChanges() {
    const involvedQuery = db.collection('classChanges')
                            .where('involvedTeacherIds', 'array-contains', currentUser.uid)
                            .where('status', '==', 'active');
    const snapshot = await involvedQuery.get();
	console.log('載入課表異動資料...');
    activeChanges = [];
    snapshot.forEach(doc => {
        activeChanges.push({ id: doc.id, ...doc.data() });
    });
	sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(activeChanges));
}

function parseSchedulesFromFirestore(allTeachers) {
    scheduleSnapshot.forEach(doc => {
        const data = typeof doc.data === 'function' ? doc.data() : doc;
        const teacherName = doc.id; 
        if (!isValidTeacher(teacherName)) return;
        allTeachers.add(teacherName);
        if (!teacherSchedules.has(teacherName)) {
             teacherSchedules.set(teacherName, Array.from({ length: 8 }, () => Array(5).fill(null)));
        }
        const teacherGrid = teacherSchedules.get(teacherName);
        const cachedData = teachersDataCache.get(teacherName) || {};
        const subject = cachedData.subject || data.subject || '其他';
        const title = cachedData.title || data.title || '專任教師'; 
        if (data.periods) {
            for (const periodKey in data.periods) {
                const period = parseInt(periodKey, 10);
                if (period < 0 || period >= 8) continue;
                const dailyLessons = data.periods[periodKey];
                for(let day = 0; day < dailyLessons.length; day++) {
                    const cellContent = dailyLessons[day];
                    if (cellContent) {
                        const [className, ...subjectParts] = cellContent.split(/\s+/);
                        const extractedSubject = subjectParts.join(' ').trim(); 
                        const finalSubject = extractedSubject || subject; 
                        if(className) {
                            teacherGrid[period][day] = { 
                                subject: finalSubject, 
                                class: className, 
                                location: '', 
                                period, 
                                title 
                            };
                            if (!classSchedules.has(className)) {
                                classSchedules.set(className, Array.from({ length: 8 }, () => Array(5).fill(null)));
                            }
                            classSchedules.get(className)[period][day] = { subject: finalSubject, teacher: teacherName, location: '' };
                        }
                    }
                }
            }
        }
    });
}

function deriveSchedules() {
    teacherSchedules.clear();
    classSchedules.clear();
    const allTeachers = new Set();
    const baseTeacherSchedules = new Map();
    parseSchedulesFromFirestore(allTeachers);
    for (const [teacher, schedule] of teacherSchedules.entries()) {
        baseTeacherSchedules.set(teacher, JSON.parse(JSON.stringify(schedule)));
    }
    activeChanges.forEach(change => {
        if (change.type === 'swap' || change.type === 'substitution') {
            const changeDateStr = change.type === 'swap' ? change.originalClassInfo.date : change.date;
            const changeDate = new Date(changeDateStr);
            const changeWeekStart = getMonday(changeDate);
            if (changeWeekStart.getTime() !== currentWeekStart.getTime()) return;
            if (change.type === 'swap') {
                const teacherA_name = change.originalClassInfo.teacher;
                const teacherB_name = change.targetClassInfo.teacher;
                const scheduleA = teacherSchedules.get(teacherA_name);
                const scheduleB = teacherSchedules.get(teacherB_name);
                if (scheduleA && scheduleB) {
                    const infoA = change.originalClassInfo;
                    const infoB = change.targetClassInfo;
                    scheduleA[infoA.period][infoA.day] = { ...infoB, class: infoA.class, isSwappedIn: true, changeId: change.id };
                    scheduleA[infoB.period][infoB.day] = { ...infoA, isSwappedOut: true, changeId: change.id };
                    scheduleB[infoB.period][infoB.day] = { ...infoA, class: infoB.class, isSwappedIn: true, changeId: change.id };
                    scheduleB[infoA.period][infoA.day] = { ...infoB, isSwappedOut: true, changeId: change.id };
                    const classA_schedule = classSchedules.get(infoA.class);
                    const classB_schedule = classSchedules.get(infoB.class); 
                    if (classA_schedule) {
                        classA_schedule[infoA.period][infoA.day] = { subject: infoB.subject, teacher: teacherB_name, location: infoB.location, isSwapped: true, changeId: change.id };
                        classA_schedule[infoB.period][infoB.day] = { subject: infoA.subject, teacher: teacherA_name, location: infoA.location, isSwapped: true, changeId: change.id };
                    }
                    if (classB_schedule) {
                        classB_schedule[infoB.period][infoB.day] = { subject: infoA.subject, teacher: teacherA_name, location: infoA.location, isSwapped: true, changeId: change.id };
                        classB_schedule[infoA.period][infoA.day] = { subject: infoB.subject, teacher: teacherB_name, location: infoB.location, isSwapped: true, changeId: change.id };
                    }
                }
            } else { 
                const originalTeacher = change.originalTeacherName;
                const substituteTeacher = change.substituteTeacherName;
                const scheduleOriginal = teacherSchedules.get(originalTeacher);
                const scheduleSubstitute = teacherSchedules.get(substituteTeacher);
                const lessonInfo = change.lessonInfo;
                const dayIndex = new Date(change.date).getDay() - 1; 
                if (scheduleOriginal && dayIndex >= 0 && dayIndex < 5) {
                    scheduleOriginal[lessonInfo.period][dayIndex] = { ...lessonInfo, isSubstitutedOut: true, substituteTeacherName: substituteTeacher, reason: change.reason, changeId: change.id };
                }
                if (scheduleSubstitute && dayIndex >= 0 && dayIndex < 5) {
                    scheduleSubstitute[lessonInfo.period][dayIndex] = { ...lessonInfo, isSubstitutedIn: true, originalTeacherName: originalTeacher, reason: change.reason, changeId: change.id };
                }
                const classSchedule = classSchedules.get(lessonInfo.class);
                if (classSchedule && dayIndex >= 0 && dayIndex < 5) {
                    classSchedule[lessonInfo.period][dayIndex] = { 
                        subject: lessonInfo.subject, 
                        teacher: substituteTeacher, 
                        location: lessonInfo.location, 
                        isSubstituted: true, 
                        changeId: change.id 
                    };
                }
            }
        } else if (change.type === 'exchange') {
            const teacherA = change.originalLessonInfo.teacher; 
            const teacherB = change.exchangeLessonInfo.teacher; 
            const scheduleA = teacherSchedules.get(teacherA);
            const scheduleB = teacherSchedules.get(teacherB);
            const infoA = change.originalLessonInfo; 
            const infoB = change.exchangeLessonInfo; 
            const weekB = getMonday(new Date(infoB.date));
            if (weekB.getTime() === currentWeekStart.getTime()) {
                const dayB = new Date(infoB.date).getDay() - 1;
                if (scheduleB && dayB >= 0 && dayB < 5) {
                    scheduleB[infoB.period][dayB] = { ...infoB, isExchangedOut: true, targetTeacher: teacherB, originalTeacher: teacherA, changeId: change.id, reason: change.reason };
                }
                if (scheduleA && dayB >= 0 && dayB < 5) { 
                    scheduleA[infoB.period][dayB] = { ...infoB, isExchangedIn: true, targetTeacher: teacherA, originalTeacher: teacherB, changeId: change.id, reason: change.reason };
                }
                
                const classB_schedule = classSchedules.get(infoB.class);
                if (classB_schedule && dayB >= 0 && dayB < 5) {
                    classB_schedule[infoB.period][dayB] = { 
                        subject: infoB.subject, 
                        teacher: teacherA, 
                        location: infoB.location, 
                        isExchanged: true, 
                        changeId: change.id 
                    };
                }
            }
            const weekA = getMonday(new Date(infoA.date));
            if (weekA.getTime() === currentWeekStart.getTime()) {
                const dayA = new Date(infoA.date).getDay() - 1;
                if (scheduleA && dayA >= 0 && dayA < 5) {
                    scheduleA[infoA.period][dayA] = { ...infoA, isExchangedOut: true, targetTeacher: teacherB, originalTeacher: teacherA, changeId: change.id, reason: change.reason };
                }
                if (scheduleB && dayA >= 0 && dayA < 5) {
                    scheduleB[infoA.period][dayA] = { ...infoA, isExchangedIn: true, targetTeacher: teacherA, originalTeacher: teacherB, changeId: change.id, reason: change.reason };
                }
                
                const classA_schedule = classSchedules.get(infoA.class);
                if (classA_schedule && dayA >= 0 && dayA < 5) {
                    classA_schedule[infoA.period][dayA] = { 
                        subject: infoA.subject, 
                        teacher: teacherB, 
                        location: infoA.location, 
                        isExchanged: true, 
                        changeId: change.id 
                    };
                }
            }				
        }
    });
    return allTeachers;
}

function isValidTeacher(name) {
    if (!name) return false;
    return !/^(英文師|數學師|自然師|共選師|社團師|彈學師)\d*$/.test(name);
}

function updateActiveChangesInSession() {
    try {
        sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(activeChanges));
    } catch (e) {
        console.error("更新 Session Storage 中的 activeChanges 失敗:", e);
    }
}

function isValidClassForListing(name) {
    if (!name) return false;
    return true; 
}

function populateTeacherListBySubject(allTeachersWithSchedule) {
    const container = document.getElementById('teacher-list-by-subject-container');
    container.innerHTML = '';
    const subjectsMap = new Map();
    const scheduleDocs = scheduleSnapshot.forEach ? 
        (Array.isArray(scheduleSnapshot.scheduleData) ? scheduleSnapshot.scheduleData : []) : 
        (Array.isArray(scheduleSnapshot.docs) ? scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []);
    scheduleSnapshot.forEach(doc => {
        const teacherName = doc.id;
        if (allTeachersWithSchedule.has(teacherName)) { 
            const cachedData = teachersDataCache.get(teacherName) || {};
            const rawSubject = cachedData.subject || '其他';
            const subjects = rawSubject.split(/,|、|\s+/).map(s => s.trim()).filter(Boolean);
            subjects.forEach(subjectName => {
                if (!subjectsMap.has(subjectName)) {
                    subjectsMap.set(subjectName, []);
                }
                subjectsMap.get(subjectName).push({
                    name: teacherName,
                    role: cachedData.title || '教師',
                    ext: '' 
                });
            });
        }
    });
    const customOrder = SUBJECT_ORDER.reduce((acc, subject, index) => {
        acc[subject] = index;
        return acc;
    }, {});
    const sortedSubjects = [...subjectsMap.keys()].sort((a, b) => {
        const orderA = customOrder[a] !== undefined ? customOrder[a] : Infinity;
        const orderB = customOrder[b] !== undefined ? customOrder[b] : Infinity;
        if (orderA !== Infinity || orderB !== Infinity) {
            return orderA - orderB;
        }
        return a.localeCompare(b, 'zh-Hant');
    });
    if (sortedSubjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">找不到教師列表。請確認學校管理員是否已上傳「全校教師課表」及「教師基本資料」。</p>';
        return;
    }
    sortedSubjects.forEach(subjectName => {
        const members = subjectsMap.get(subjectName);
        const table = document.createElement('table');
        table.className = 'department-table';
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const th = document.createElement('th');
        th.colSpan = 3;
        th.textContent = subjectName;
        headerRow.appendChild(th);
        const tbody = table.createTBody();
        members.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')).forEach(member => {
            const row = tbody.insertRow();
            row.insertCell().textContent = member.role;
            const nameCell = row.insertCell();
            nameCell.className = 'name-cell';
            nameCell.textContent = member.name;
			nameCell.onclick = () => {
				currentWeekStart = getMonday(new Date()); 
				showSchedule(member.name, 'teacher');
			};
            row.insertCell().textContent = '';
        });
        container.appendChild(table);
    });
}

function populateClassList() {
    const selector = document.getElementById('class-selector');
    selector.innerHTML = '<option value="" disabled selected>班級課表</option>';
    const classesForList = [...classSchedules.keys()].filter(isValidClassForListing).sort();
    classesForList.forEach(name => {
        selector.appendChild(new Option(name, name));
    });
    selector.onchange = function() {
        if (this.value) {
            currentWeekStart = getMonday(new Date()); 
            showSchedule(this.value, 'class');
        }
    };
}

async function showSchedule(name, type, direction = 10) {
    document.getElementById('substitution-btn').classList.remove('visible'); 
    const isStatic = direction === 10;
    if (isStatic) {
        addRecentSchedule(name, type);
        populateRecentList();
        activeSchedule = { type, name };
        const dataToStore = { 
            savedBy: currentUser.uid, 
            schedule: { view: currentView, ...activeSchedule } 
        };
        localStorage.setItem('lastSchedule', JSON.stringify(dataToStore));
    } else if (activeSchedule.name !== name || activeSchedule.type !== type) {
        activeSchedule = { type, name };
    }
    const modal = document.getElementById('schedule-modal');
    if (type === 'class') {
        modal.classList.add('class-schedule-view');
    } else {
        modal.classList.remove('class-schedule-view');
    }		
    const titleEl = document.getElementById('modal-title');
    const titleEl2 = document.getElementById('modal-title2');
    const bodyEl = document.getElementById('modal-body');
    const todayWeekStart = getMonday(new Date());
    const isCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime();
    document.getElementById('today-btn').classList.toggle('current', isCurrentWeek);
    await deriveSchedules(); 
    let schedule, title;
    if (type === 'teacher' && teacherSchedules.has(name)) {
        schedule = teacherSchedules.get(name);
        title = `${name} 課表`;
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const interactionHint = isTouchDevice ? '長按' : '右鍵';
        if (name === currentUserDisplayName) {
            titleEl2.textContent = `＊點擊有課格子可進行調/代/換課（點擊自己課程，再點綠色建議格子），${interactionHint}可加入行事曆註記＊`;
        } else {
            titleEl2.textContent = `＊${interactionHint}可加入行事曆註記＊`;
        }
    } else if (type === 'class' && classSchedules.has(name)) {
        schedule = classSchedules.get(name);
        title = `${name} 班課表`;
        titleEl2.textContent = '＊點擊有課的格子可看換課選擇＊';
    } else {
        bodyEl.innerHTML = `<p style="text-align:center;">找不到 ${name} 的課表資料。</p>`;
        titleEl.textContent = "資料錯誤";
        if (!modal.style.display || modal.style.display === 'none') modal.style.display = 'block';
        return;
    }
    const renderScheduleTable = (targetElement) => {
         if (!schedule) return; 
         titleEl.textContent = title;
         const daysOfWeek = ['星期一', '星期二', '星期三', '星期四', '星期五'];
         let tableHtml = '<table class="schedule-table"><thead><tr><th>節次</th>';
         const weekDates = [];
         for (let i = 0; i < 5; i++) {
             const date = new Date(currentWeekStart);
             date.setDate(currentWeekStart.getDate() + i);
             weekDates.push(date);
             tableHtml += `<th>${daysOfWeek[i]}<br><span class="date-span" style="color: #6c757d; font-size: 0.9em;">(${formatDate(date)})</span></th>`;
         }
         tableHtml += '</tr></thead><tbody>';
         const now = new Date();
         const currentDayIndex = now.getDay() - 1; 
         const currentPeriodIndex = getPeriodIndexForTimetableHighlight(); 
         for (let period = 0; period < 8; period++) {
             const periodTimeInfo = getPeriodTimeInfo(period + 1);
             const timeRangeStr = periodTimeInfo ? 
                 `<span style="font-size: 0.7em; font-weight: normal; line-height: 1.2; white-space: nowrap;">${periodTimeInfo.start}~${periodTimeInfo.end}</span>` 
                 : '';
             tableHtml += `<tr><td class="period-header">${period + 1}<br>${timeRangeStr}</td>`;
             for (let day = 0; day < 5; day++) {
                 const cellDate = formatDate(weekDates[day], 'YYYY-MM-DD');
                 const cellData = schedule[period]?.[day];
                 let content = '';
                 let cellClass = '';
                 let dataAttrs = `data-period="${period}" data-day="${day}" data-date="${cellDate}"`;
                 const isCurrent = isCurrentWeek && day === currentDayIndex && period === currentPeriodIndex;
                 if (isCurrent) {
                      cellClass += ' current-timetable-cell'; 
                 }
                 if (cellData) {
                     if (type === 'class') {
                         if (cellData.isSwapped) {
                            cellClass += ' swapped-class-cell';
                         } else if (cellData.isSubstituted) {
                            cellClass += ' substituted-class-cell';
                         } else if (cellData.isExchanged) {
                            cellClass += ' exchanged-class-cell';
                         }
                         if (cellData.isSwapped || cellData.isSubstituted || cellData.isExchanged) {
                             dataAttrs += ` data-change-id="${cellData.changeId}" title="課程異動"`;
                             const tag = cellData.isSwapped ? '(調)' : (cellData.isSubstituted ? '(代)' : '(換)');
                             content = `<span class="subject">${cellData.subject || ''}</span><span class="details"><span style="color: blue;">${cellData.teacher || ''}${tag}</span></span>`;
                         } else {
                             content = `<span class="subject">${cellData.subject || ''}</span><span class="details"><span style="color: blue;">${cellData.teacher || ''}</span></span>`;
                         }
                     } else if (cellData.isSwappedIn || cellData.isSwappedOut || cellData.isExchangedIn || cellData.isExchangedOut || cellData.isSubstitutedIn || cellData.isSubstitutedOut) {
                         cellClass += ' ' + (cellData.isSwappedIn || cellData.isSwappedOut ? 'swapped-cell swapped-cell-pulse' : (cellData.isExchangedIn || cellData.isExchangedOut ? 'exchanged-cell exchanged-cell-pulse' : 'substituted-cell'));
                         dataAttrs += ` data-change-id="${cellData.changeId}"`;
                         if (cellData.reason && cellData.reason.trim() !== '') {
                             const escapedReason = cellData.reason.replace(/"/g, '&quot;');
                             dataAttrs += ` title="${escapedReason}"`;
                         } else if (cellData.isSubstitutedIn || cellData.isSubstitutedOut) {
                             dataAttrs += ` title="代課異動"`;
                         } else if (cellData.isSwappedIn || cellData.isSwappedOut) {
                             dataAttrs += ` title="調課異動"`;
                         } else if (cellData.isExchangedIn || cellData.isExchangedOut) {
                             dataAttrs += ` title="換課異動"`;
                         }
                         if (cellData.isSwappedIn) {
                             content = `<span class="subject">${cellData.subject}</span><span class="details">${cellData.class}</span>`;
                             content += `<span style="font-size: 0.8em; color: #000000; display: block; font-weight: bold;">${cellData.teacher}(調)</span>`;
                         } 
                         else if (cellData.isSwappedOut) {
                             content = `<span class="subject">${cellData.subject}</span><span class="details">${cellData.class}</span>`;
                             content += `<span style="font-size: 0.8em; color: #000000; display: block; font-weight: bold;">${cellData.teacher}(調)</span>`;
                         }
                         else if (cellData.isSubstitutedOut) {
                             content = `<span class="subject">${cellData.subject}</span><span class="details">${cellData.class || ''}</span>`;
                             content += `<span style="font-size: 0.8em; color: #000000; display: block; font-weight: bold;">${cellData.substituteTeacherName || '不明'}(代)</span>`;
                         }
                         else if (cellData.isSubstitutedIn) {
                             content = `<span class="subject">${cellData.subject}</span><span class="details">${cellData.class || ''}</span>`;
                             content += `<span style="font-size: 0.8em; color: #007bff; display: block;">(${cellData.originalTeacherName || '不明'}(代)</span>`;
                          }
                         else if (cellData.isExchangedOut || cellData.isExchangedIn) {
                             const teacherName = cellData.isExchangedOut ? cellData.targetTeacher : cellData.targetTeacher;                                 
                             content = `<span class="subject">${cellData.subject}</span><span class="details">${cellData.class || ''}</span>`;
                             content += `<span style="font-size: 0.8em; color: #000000; font-weight: bold;">${teacherName || '不明'}(換)</span>`;
                         }
                         if (type === 'class' && (cellData.isSwapped || cellData.isSubstituted || cellData.isExchanged)) {
                             if (cellData.isSwapped) {
                                cellClass += ' swapped-class-cell';
                             } else if (cellData.isSubstituted) {
                                cellClass += ' substituted-class-cell';
                             } else if (cellData.isExchanged) {
                                cellClass += ' exchanged-class-cell';
                             }
                             dataAttrs += ` data-change-id="${cellData.changeId}" title="課程異動"`;
                             const tag = cellData.isSwapped ? '(調)' : (cellData.isSubstituted ? '(代)' : '(換)');
                             content = `<span class="subject">${cellData.subject || ''}</span><span class="details"><span style="color: blue;">${cellData.teacher || ''}${tag}</span></span>`;
                         }
                     } else {
                         if (type === 'teacher') {
                             content = `<span class="subject">${cellData.subject || ''}</span><span class="details">${cellData.class || ''}</span>`;
                             dataAttrs += ` data-course-data='${JSON.stringify({ 
                                 subjectName: cellData.subject, 
                                 className: cellData.class, 
                                 teacherName: name, 
                                 periodNum: period + 1,
                                 location: cellData.location
                             })}'`;
                         }
                         else if (type === 'class') content = `<span class="subject">${cellData.subject || ''}</span><span class="details"><span style="color: blue;">${cellData.teacher || ''}</span></span>`;
                     }
                     tableHtml += `<td class="${cellClass}" ${dataAttrs}>${content}</td>`;
                 } else {
                     tableHtml += `<td class="empty-cell ${cellClass}" ${dataAttrs}></td>`;
                 }
             }
             tableHtml += '</tr>';
         }
         tableHtml += '</tbody></table>';
         targetElement.innerHTML = tableHtml;
         const scheduleTable = targetElement.querySelector('.schedule-table');
         if (isCurrentWeek) {
             scheduleTable.querySelector('thead').classList.add('current-week');
         }
        if (type === 'teacher') {
            teacherViewSelectedCell = null;
            scheduleTable.removeEventListener('click', (e) => handleTeacherCellClick(e, name));
            scheduleTable.removeEventListener('contextmenu', (e) => handleTeacherCellInteraction(e, name));
            scheduleTable.addEventListener('click', (e) => handleTeacherCellClick(e, name));
            scheduleTable.addEventListener('contextmenu', (e) => handleTeacherCellInteraction(e, name));
        } else if (type === 'class') {
            classViewSelectedCell = null;
            scheduleTable.addEventListener('click', (e) => handleClassCellClick(e, name));
        }
         if (!modal.style.display || modal.style.display === 'none') {
             modal.style.display = 'block';
         }
    };        
    const oldTable = bodyEl.querySelector('.schedule-table');
    const isReturningToCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime();
    if (isStatic || !oldTable) { 
        renderScheduleTable(bodyEl);
        const table = bodyEl.querySelector('.schedule-table');
        if (table) {
            table.classList.remove('slide-in-right', 'slide-in-left', 'slide-out-right', 'slide-out-left', 'slide-in-down', 'slide-out-up');
        }
    } else {
        bodyEl.style.position = 'relative';
        bodyEl.style.overflow = 'hidden';
        const newTableContainer = document.createElement('div');
        newTableContainer.style.position = 'absolute';
        newTableContainer.style.top = '0';
        newTableContainer.style.left = '0';
        newTableContainer.style.width = '100%';
        newTableContainer.style.height = '100%';
        newTableContainer.style.overflow = 'hidden';
        bodyEl.appendChild(newTableContainer);
        renderScheduleTable(newTableContainer);
        const newTable = newTableContainer.querySelector('.schedule-table');
        oldTable.style.zIndex = 10;
        oldTable.style.position = 'relative';
        let slideOutClass, slideInClass;
        if (direction === 0) { 
            slideOutClass = 'slide-out-up'; 
            slideInClass = 'slide-in-down'; 
        } else if (direction === 1) { 
            slideOutClass = 'slide-out-left';
            slideInClass = 'slide-in-right';
        } else if (direction === -1) { 
            slideOutClass = 'slide-out-right';
            slideInClass = 'slide-in-left';
        } else {
            bodyEl.innerHTML = newTableContainer.innerHTML;
            bodyEl.style.overflow = ''; 
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
            }
            bodyEl.style.overflow = '';
        }, 200); 
    }

	function bindEventListeners() {
		// 防止重複執行的旗標
		if (window.isTimetableEventsBound) return;
		window.isTimetableEventsBound = true;

		// 1. 自動開啟 Checkbox 設定 (獨立綁定，因為它只需要處理 change)
		const autoOpenChk = document.getElementById('auto-open-chk');
		const AUTO_OPEN_KEY = 'timetable_auto_open_preference';
		if (autoOpenChk) {
			autoOpenChk.checked = localStorage.getItem(AUTO_OPEN_KEY) !== 'false';
			autoOpenChk.addEventListener('change', (e) => {
				localStorage.setItem(AUTO_OPEN_KEY, e.target.checked);
			});
		}

		// 2. 統一的點擊事件管理員 (處理所有點擊：下拉選單、關閉選單、Modal、關閉按鈕)
		document.addEventListener('click', (event) => {
			const target = event.target;
			const dropdownList = document.getElementById('recent-schedules-list');
			
			// === A. 處理「下拉選單切換」 (點擊按鈕 或 點擊標題) ===
			// 使用 closest 確保點擊到按鈕內部的 icon 也能觸發
			if (target.closest('#recent-schedules-btn') || target.closest('#main-title')) {
				event.stopPropagation(); // 防止冒泡觸發其他不需要的邏輯
				populateRecentList(); // 更新清單內容
				if (dropdownList) {
					dropdownList.classList.toggle('show');
				}
				return; // 處理完畢，結束
			}

			// === B. 處理「點擊外部關閉下拉選單」 ===
			// 如果點擊的不是選單本身，且選單是開著的，就關掉
			if (dropdownList && dropdownList.classList.contains('show') && !target.closest('.dropdown-content')) {
				dropdownList.classList.remove('show');
			}

			// === C. 處理「Modal 相關關閉」 ===
			// C-1. 點擊 Modal 黑色背景 -> 關閉
			if (target.classList.contains('modal')) {
				target.style.display = 'none';
			}
			// C-2. 點擊 Modal 內部的 X 關閉按鈕 -> 關閉
			if (target.closest('.close-button')) {
				const modal = target.closest('.modal');
				if (modal) modal.style.display = 'none';
			}
		});

		// 3. 搜尋框輸入監聽 (維持不變)
		const searchInput = document.getElementById('search-teacher');
		if (searchInput) {
			searchInput.addEventListener('input', (e) => {
				const searchTerm = e.target.value.toLowerCase().trim();
				const container = document.getElementById('teacher-list-by-subject-container'); 
				if (container) {
					container.querySelectorAll('.department-table').forEach(table => {
						let tableHasVisibleRow = false;
						table.querySelectorAll('tbody tr').forEach(row => {
							const nameCell = row.querySelector('.name-cell');
							const isVisible = nameCell && nameCell.textContent.toLowerCase().includes(searchTerm);
							row.style.display = isVisible ? '' : 'none';
							if (isVisible) tableHasVisibleRow = true;
						});
						table.style.display = (tableHasVisibleRow || !searchTerm) ? '' : 'none';
					});
				}
			});
		}
		
		const userEmailSpan = document.getElementById('user-email');
		if (userEmailSpan) {
			userEmailSpan.addEventListener('click', () => {
				if (currentUserDisplayName) {
					// 重設為本週
					currentWeekStart = getMonday(new Date());
					// 呼叫顯示課表函式 (使用全域變數 currentUserDisplayName)
					showSchedule(currentUserDisplayName, 'teacher');
				}
			});
		}
		
		// 4. 手機滑動手勢 (維持不變)
		const scheduleModalBody = document.getElementById('modal-body'); 
		const exchangeModalBody = document.getElementById('exchange-modal-body'); 
		let touchStartX = 0;
		let touchEndX = 0;
		const swipeThreshold = 50; 

		function handleTouchStart(event) {
			if (event.touches.length === 1) {
				touchStartX = event.touches[0].clientX;
				touchEndX = 0;
			}
		}
		function handleTouchMove(event) {
			if (event.touches.length > 1) {
				touchStartX = 0;
			}
		}

		if (scheduleModalBody) {
			scheduleModalBody.addEventListener('touchstart', handleTouchStart, { passive: true });
			scheduleModalBody.addEventListener('touchmove', handleTouchMove, { passive: true });
			scheduleModalBody.addEventListener('touchend', (event) => {
				if (event.changedTouches.length === 1 && touchStartX !== 0) {
					touchEndX = event.changedTouches[0].clientX;
					const deltaX = touchEndX - touchStartX;
					if (Math.abs(deltaX) > swipeThreshold && document.getElementById('schedule-modal').style.display === 'block') {
						if (deltaX < 0) {
							currentWeekStart.setDate(currentWeekStart.getDate() + 7);
							showSchedule(activeSchedule.name, activeSchedule.type, 1);
						} else {
							currentWeekStart.setDate(currentWeekStart.getDate() - 7);
							showSchedule(activeSchedule.name, activeSchedule.type, -1);
						}
					}
				}
				touchStartX = 0;
			});
		}

		if (exchangeModalBody) {
			exchangeModalBody.addEventListener('touchstart', handleTouchStart, { passive: true });
			exchangeModalBody.addEventListener('touchmove', handleTouchMove, { passive: true });
			exchangeModalBody.addEventListener('touchend', (event) => {
				if (event.changedTouches.length === 1 && touchStartX !== 0) {
					touchEndX = event.changedTouches[0].clientX;
					const deltaX = touchEndX - touchStartX;
					if (Math.abs(deltaX) > swipeThreshold && document.getElementById('exchange-modal').style.display === 'block') {
						if (deltaX < 0) {
							document.getElementById('exchange-next-week-btn')?.click(); 
						} else {
							document.getElementById('exchange-prev-week-btn')?.click(); 
						}
					}
				}
				touchStartX = 0;
			});
		}
	}

	
    bindEventListeners();
}

function getPeriodIndexForTimetableHighlight() {
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

function handleTeacherCellClick(event, teacherName) {
    if (teacherName !== currentUserDisplayName) {
        const cell = event.target.closest('td');
        if(cell && cell.dataset.courseData) {
            alert(`您點擊了 ${teacherName} 老師的課。\n\n如需加入行事曆，請使用滑鼠右鍵或長按。`);
        }
        return;
    }
    const cell = event.target.closest('td');
    const substitutionBtn = document.getElementById('substitution-btn');
    substitutionBtn.classList.remove('visible');
    if (!cell || cell.classList.contains('period-header')) return;
    const changeId = cell.dataset.changeId;
    const isSuggestion = cell.classList.contains('swap-suggestion');
    const table = cell.closest('table');
    const originalCell = document.querySelector('.schedule-table .highlight');
    const clearAllSelections = () => {
        table.querySelectorAll('.highlight, .swap-suggestion').forEach(el => {
            el.classList.remove('highlight', 'swap-suggestion');
            if (el.dataset.originalText !== undefined) {
                el.innerHTML = el.dataset.originalText;
                delete el.dataset.originalText;
                delete el.dataset.originalLesson; 
                delete el.dataset.targetLesson;   
            }
        });
        teacherViewSelectedCell = null;
        substitutionBtn.classList.remove('visible');
    };
    if (changeId) {
        clearAllSelections();
        const changeToCancel = activeChanges.find(c => c.id === changeId);
        if (!changeToCancel) return;
        let message = '';
        if (changeToCancel.type === 'swap') {
            const infoA = changeToCancel.originalClassInfo;
            const infoB = changeToCancel.targetClassInfo;
            message = `這是一筆調課紀錄：\n\n${infoA.date} 第${infoA.period + 1}節 [${infoA.subject}]\n與\n${infoB.date} 第${infoB.period + 1}節 [${infoB.subject}]\n\n您確定要取消嗎？`;
        } else if (changeToCancel.type === 'substitution') {
            const info = changeToCancel.lessonInfo;
            message = `這是一筆代課紀錄：\n\n${changeToCancel.date} 第${info.period + 1}節 [${info.subject}]\n由 ${changeToCancel.substituteTeacherName} 老師代課。\n\n您確定要取消嗎？`;
        } else if (changeToCancel.type === 'exchange') {
             const infoA = changeToCancel.originalLessonInfo;
             const infoB = changeToCancel.exchangeLessonInfo;
             message = `這是一筆換課紀錄：\n\n- ${infoA.date} 第${infoA.period+1}節 [${infoA.subject}] 由 ${infoB.teacher} 代課\n- ${infoB.date} 第${infoB.period+1}節 [${infoB.subject}] 由 ${infoA.teacher} 代課\n\n您確定要取消嗎？`;
        }
        if (confirm(message)) {
            cancelChange(changeId);
        }
        return; 
    }
    if (isSuggestion) {
        let originalLessonData, targetLessonData;
        try {
            if (!cell.dataset.originalLesson || !cell.dataset.targetLesson) {
                 throw new Error("Missing dataset keys.");
            }
            originalLessonData = JSON.parse(cell.dataset.originalLesson);
            targetLessonData = JSON.parse(cell.dataset.targetLesson);
        } catch (e) {
            alert("錯誤：調課建議資料解析失敗。請檢查課程名稱或聯繫開發人員。");
            console.error("JSON Parse Error for swap-suggestion:", e);
            clearAllSelections();
            return;
        }
        if (originalLessonData && targetLessonData) {
            showSwapConfirmationModal({
                original: originalLessonData,
                target: targetLessonData
            });
        }
        clearAllSelections(); 
        return;
    }
    if (cell === teacherViewSelectedCell) {
        clearAllSelections();
        return;
    }
    clearAllSelections();
    const period = parseInt(cell.dataset.period);
    const day = parseInt(cell.dataset.day);
    const clickedLesson = teacherSchedules.get(teacherName)?.[period]?.[day];
    if (!clickedLesson) return;
    const cellDate = cell.dataset.date;
    const periodInfo = getPeriodTimeInfo(period + 1);
    if (periodInfo) {
        const now = new Date();
        const lessonEnd = new Date(cellDate);
        const [endH, endM] = periodInfo.end.split(':').map(Number);
        lessonEnd.setHours(endH, endM, 0, 0);
        if (lessonEnd < now) {
            alert(`課程已過時：${cellDate} 第 ${period + 1} 節 [${clickedLesson.subject}] 已結束。\n\n無法進行調課或代課操作。`);
            return; 
        }
    }
    if (period >= 7 || (day === 4 && period >= 5)) return; 
    cell.classList.add('highlight');
    teacherViewSelectedCell = cell;
    substitutionBtn.classList.add('visible');
    substitutionBtn.onclick = () => showSubstitutionModal(clickedLesson, teacherViewSelectedCell.dataset.date, teacherName);
    const classSchedule = classSchedules.get(clickedLesson.class);
    if (!classSchedule) return;
    const originalLesson = {
        teacher: teacherName,
        class: clickedLesson.class,
        subject: clickedLesson.subject,
        location: clickedLesson.location,
        day: day,
        period: period,
        date: cellDate 
    };
    for (let p = 0; p < 7; p++) {
        for (let d = 0; d < 5; d++) {
            if ((d === 4 && p >= 5) || (p === period && d === day)) continue; 
            const ownTargetCellData = teacherSchedules.get(teacherName)?.[p]?.[d];
            if (!ownTargetCellData) {
                const lessonAtTarget = classSchedule[p]?.[d];
                if (lessonAtTarget?.teacher && lessonAtTarget.teacher !== teacherName) {
                    const otherTeacherSchedule = teacherSchedules.get(lessonAtTarget.teacher);
                    if (otherTeacherSchedule && !otherTeacherSchedule[period]?.[day]) {
                        const targetCell = table.querySelector(`td[data-period="${p}"][data-day="${d}"]`);
                        if (targetCell) {
                            const targetLesson = {
                                teacher: lessonAtTarget.teacher,
                                class: originalLesson.class, 
                                subject: lessonAtTarget.subject,
                                location: lessonAtTarget.location,
                                day: d,
                                period: p,
                                date: targetCell.dataset.date
                            };
                            targetCell.classList.remove('cleared-cell', 'empty-cell');
                            targetCell.classList.add('swap-suggestion');
                            targetCell.dataset.originalText = targetCell.innerHTML;
                            targetCell.dataset.originalLesson = JSON.stringify(originalLesson);
                            targetCell.dataset.targetLesson = JSON.stringify(targetLesson);
                            const extHtml = ''; 
                            targetCell.innerHTML = `<span class="subject">${lessonAtTarget.subject}</span><span class="class-details">${clickedLesson.class}</span><span class="teacher-details">${lessonAtTarget.teacher}</span>${extHtml}`;
                        }
                    }
                }
            }
        }
    }
}

function showPureTeacherSchedule(teacherName, className, subject, location, cellDate) {
    const teacherSchedule = teacherSchedules.get(teacherName);
    if (!teacherSchedule) {
        alert(`找不到 ${teacherName} 老師的課表資料。`);
        return;
    }
    const modal = document.getElementById('view-only-modal');
    const titleEl = document.getElementById('view-only-modal-title');
    const bodyEl = document.getElementById('view-only-modal-body');
    const backBtn = document.getElementById('back-to-class-btn');
    const closeBtn = document.getElementById('view-only-close-btn');
    titleEl.textContent = `${teacherName} 老師課表 (純瀏覽)`;
    const daysOfWeek = ['星期一', '星期二', '星期三', '星期四', '星期五'];
    let tableHtml = '<table class="schedule-table"><thead><tr><th>節次</th>';
    const currentWeekStartLocal = getMonday(new Date(cellDate));
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date(currentWeekStartLocal);
        date.setDate(currentWeekStartLocal.getDate() + i);
        weekDates.push(date);
        tableHtml += `<th>${daysOfWeek[i]}<br>(${formatDate(date)})</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let period = 0; period < 8; period++) {
        const periodTimeInfo = getPeriodTimeInfo(period + 1);
        const timeRangeStr = periodTimeInfo ? 
            `<span style="font-size: 0.7em; font-weight: normal; line-height: 1.2; white-space: nowrap;">${periodTimeInfo.start}~${periodTimeInfo.end}</span>` 
            : '';
        tableHtml += `<tr><td class="period-header">${period + 1}<br>${timeRangeStr}</td>`;
        for (let day = 0; day < 5; day++) {
            const cellData = teacherSchedule[period]?.[day];
            let content = '';
            let cellClass = 'view-only-cell'; 
            const isClickedLesson = cellDate === formatDate(weekDates[day], 'YYYY-MM-DD') && period === teacherSchedule[period][day]?.period;
            if (cellData) {
                content = `<span class="subject">${cellData.subject || ''}</span><span class="details">${cellData.class || ''}</span>`;
                if (isClickedLesson) {
                     cellClass += ' highlight';
                }
            } else {
                cellClass += ' empty-cell';
            }
            tableHtml += `<td class="${cellClass}" style="cursor: default;" data-period="${period}" data-day="${day}">${content}</td>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    bodyEl.innerHTML = tableHtml;
    const returnToClassSchedule = () => {
         modal.style.display = 'none';
         showSchedule(className, 'class');
    };
    backBtn.onclick = returnToClassSchedule;
    closeBtn.onclick = returnToClassSchedule; 
    document.getElementById('schedule-modal').style.display = 'none';
    modal.style.display = 'flex';
}

function handleClassCellClick(event, className) {
    const cell = event.target.closest('td');
    if (!cell || cell.classList.contains('period-header')) {
        if (classViewSelectedCell) showSchedule(className, 'class');
        return;
    }
    const cellData = classSchedules.get(className)?.[parseInt(cell.dataset.period)]?.[parseInt(cell.dataset.day)];
    if (cellData && cellData.teacher) {
        showPureTeacherSchedule(cellData.teacher, className, cellData.subject, cellData.location, cell.dataset.date);
    } else {
        if (classViewSelectedCell) showSchedule(className, 'class');
    }
}

function handleTeacherCellInteraction(event, teacherName) {
    
    if (event.type === 'contextmenu') {
        event.preventDefault(); 
        event.stopPropagation();
    }
    
    const cell = event.target.closest('td');
    
    if (!cell || cell.classList.contains('period-header') || !cell.dataset.period) {
        clearTimeout(longPressTimer);
        return;
    }
    const period = parseInt(cell.dataset.period);
    const day = parseInt(cell.dataset.day);
    const cellDate = cell.dataset.date;
    if (cell.classList.contains('empty-cell') && !cell.dataset.courseData) {
        clearTimeout(longPressTimer);
        return;
    }
    let lesson;
    let isSpecialChange = cell.dataset.changeId;
    if (isSpecialChange) {
        const change = activeChanges.find(c => c.id === isSpecialChange);
        if (change.type === 'substitution') {
            lesson = { 
                ...change.lessonInfo, 
                reason: change.reason,
                isSubstitutedOut: true,
                substituteTeacherName: change.substituteTeacherName, 
            };
        } else if (change.type === 'exchange') {
            const isOut = change.originalLessonInfo.teacher === teacherName;
            lesson = isOut ? { ...change.originalLessonInfo } : { ...change.exchangeLessonInfo };
            lesson.isExchangedOut = isOut;
            lesson.isExchangedIn = !isOut;
            lesson.reason = change.reason;
            lesson.targetTeacher = isOut ? change.exchangeLessonInfo.teacher : undefined;
        } else if (change.type === 'swap') {
             clearTimeout(longPressTimer);
             return;
        }
    } else {
         lesson = teacherSchedules.get(teacherName)?.[period]?.[day];
    }
    if (!lesson) {
        clearTimeout(longPressTimer);
        return;
    }
    const periodInfo = getPeriodTimeInfo(period + 1);
    if (periodInfo) {
        const now = new Date();
        const lessonEnd = new Date(cellDate);
        const [endH, endM] = periodInfo.end.split(':').map(Number);
        lessonEnd.setHours(endH, endM, 0, 0);
        if (lessonEnd < now) {
            alert(`課程已過時：${cellDate} 第 ${period + 1} 節 [${lesson.subject || lesson.subjectName}] 已結束。\n\n無法新增行事曆註記。`);
            clearTimeout(longPressTimer);
            return;
        }
    }
    const showModal = () => {
         const cleanCourseData = JSON.parse(cell.dataset.courseData || '{}');
         const finalLesson = {
            subject: cleanCourseData.subjectName || lesson.subject,
            class: cleanCourseData.className || lesson.class,
            teacher: cleanCourseData.teacherName || teacherName,
            periodNum: period + 1,
            location: cleanCourseData.location || lesson.location,
            period: period,
            day: day,
            isSubstitutedOut: lesson.isSubstitutedOut,
            substituteTeacherName: lesson.substituteTeacherName, 
            isExchangedOut: lesson.isExchangedOut,
            targetTeacher: lesson.targetTeacher, 
            isSwappedOut: lesson.isSwappedOut,
            reason: lesson.reason
         };
         showSingleEventModal(finalLesson, currentWeekStart, day + 1); 
    }
    if (event.type === 'contextmenu') {
        showModal();
    } 
}
   
function showSwapConfirmationModal(swapInfo) {
    const modal = document.getElementById('swap-confirm-modal');
    const originalInfoEl = document.getElementById('original-class-info');
    const targetInfoEl = document.getElementById('target-class-info');
    const originalDateInput = document.getElementById('original-class-date');
    const targetDateInput = document.getElementById('target-class-date');
    const confirmBtn = document.getElementById('confirm-swap-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const originalPeriodInfo = getPeriodTimeInfo(swapInfo.original.period + 1);
    const targetPeriodInfo = getPeriodTimeInfo(swapInfo.target.period + 1);
    const originalTimeStr = originalPeriodInfo ? ` (${originalPeriodInfo.start} - ${originalPeriodInfo.end})` : '';
    const targetTimeStr = targetPeriodInfo ? ` (${targetPeriodInfo.start} - ${targetPeriodInfo.end})` : '';
    originalInfoEl.innerHTML = `
        <b>您的課程:</b> 週${days[swapInfo.original.day + 1]} 第 ${swapInfo.original.period + 1} 節${originalTimeStr} - ${swapInfo.original.subject} (${swapInfo.original.class})
    `;
    targetInfoEl.innerHTML = `
        <b>調換對象:</b> 週${days[swapInfo.target.day + 1]} 第 ${swapInfo.target.period + 1} 節${targetTimeStr} - <span style="color: blue;">${swapInfo.target.teacher}</span>老師的 ${swapInfo.target.subject}
    `;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = formatDate(today, 'YYYY-MM-DD');
    let initialDateOriginal = new Date(swapInfo.original.date);
    if (originalPeriodInfo) {
        const lessonFullDateTime = new Date(initialDateOriginal);
        const [endH, endM] = originalPeriodInfo.end.split(':').map(Number);
        lessonFullDateTime.setHours(endH, endM, 0, 0);
        if (lessonFullDateTime < now) {
            initialDateOriginal.setDate(initialDateOriginal.getDate() + 7);
        }
    }
    const defaultDateOriginal = findNextAvailableDate(initialDateOriginal, swapInfo.original.period, swapInfo.original.day);
    originalDateInput.value = formatDate(defaultDateOriginal, 'YYYY-MM-DD');
    let initialDateTarget = new Date(swapInfo.target.date);
    if (targetPeriodInfo) {
        const lessonFullDateTime = new Date(initialDateTarget);
        const [endH, endM] = targetPeriodInfo.end.split(':').map(Number);
        lessonFullDateTime.setHours(endH, endM, 0, 0);
        if (lessonFullDateTime < now) {
            initialDateTarget.setDate(initialDateTarget.getDate() + 7);
        }
    }
    const defaultDateTarget = findNextAvailableDate(initialDateTarget, swapInfo.target.period, swapInfo.target.day);
    targetDateInput.value = formatDate(defaultDateTarget, 'YYYY-MM-DD');
    originalDateInput.min = todayString;
    targetDateInput.min = todayString;
    let lastValidDateOriginal = originalDateInput.value;
    const originalDateValidationHandler = () => {
        const newDate = new Date(originalDateInput.value);
        const newDayIndex = (newDate.getDay() + 6) % 7;
        if (newDayIndex !== swapInfo.original.day) {
            alert(`日期選擇錯誤！\n\n您的課程是「星期${days[swapInfo.original.day + 1]}」，您不能選擇其他星期。\n系統將自動還原。`);
            originalDateInput.value = lastValidDateOriginal;
        } else {
            lastValidDateOriginal = originalDateInput.value;
        }
    };
    let lastValidDateTarget = targetDateInput.value;
    const targetDateValidationHandler = () => {
        const newDate = new Date(targetDateInput.value);
        const newDayIndex = (newDate.getDay() + 6) % 7;
        if (newDayIndex !== swapInfo.target.day) {
            alert(`日期選擇錯誤！\n\n調換對象的課程是「星期${days[swapInfo.target.day + 1]}」，您不能選擇其他星期。\n系統將自動還原。`);
            targetDateInput.value = lastValidDateTarget;
        } else {
            lastValidDateTarget = targetDateInput.value;
        }
    };
    originalDateInput.onchange = null;
    targetDateInput.onchange = null;
    originalDateInput.addEventListener('change', originalDateValidationHandler);
    targetDateInput.addEventListener('change', targetDateValidationHandler);
    newConfirmBtn.addEventListener('click', async () => {
        const originalDate = originalDateInput.value;
        const targetDate = targetDateInput.value;
        const conflict1 = isDateConflict(originalDate, swapInfo.original.period, swapInfo.original.day);
        if (conflict1) {
            alert(`錯誤：您的原課程節次 (${originalDate} 第 ${swapInfo.original.period + 1} 節) 已有其他的課程異動，無法設定。`);
            return;
        }
        const conflict2 = isDateConflict(targetDate, swapInfo.target.period, swapInfo.target.day);
        if (conflict2) {
            alert(`錯誤：您選擇的調換對象節次 (${targetDate} 第 ${swapInfo.target.period + 1} 節) 已有其他的課程異動，無法設定。`);
            return;
        }
        newConfirmBtn.disabled = true;
        newConfirmBtn.textContent = '儲存中...';
        let involvedIds = [currentUser.uid];
        const changeData = {
            type: 'swap',
            originalClassInfo: { ...swapInfo.original, teacher: swapInfo.original.teacher, date: originalDateInput.value },
            targetClassInfo: { ...swapInfo.target, teacher: swapInfo.target.teacher, class: swapInfo.original.class, date: targetDateInput.value },
            involvedTeacherIds: involvedIds, 
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
			const docRef = await db.collection('classChanges').add(changeData);
            			
            localStorage.setItem(REFRESH_FLAG_KEY, 'true');
			
			changeData.id = docRef.id;
            activeChanges.push(changeData);
            updateActiveChangesInSession(); 
            currentWeekStart = getMonday(new Date(originalDateInput.value));
            if (activeSchedule.type && activeSchedule.name) {
	                await showSchedule(activeSchedule.name, activeSchedule.type, 0); 
            }
            modal.style.display = 'none';
			const exportConfirmed = confirm("調課成功！課表已自動跳轉至調課週次。\n\n是否將相關異動事件加入行事曆？");
            if (exportConfirmed) {
                promptForIcsExport('swap', changeData); 
            }
        } catch (error) {
            console.error("儲存調課失敗:", error);
            alert("儲存失敗: " + error.message);
        } finally {
            newConfirmBtn.disabled = false;
            newConfirmBtn.textContent = '確認調課';
        }
    });
    modal.querySelector('.close-button').onclick = () => {
        originalDateInput.removeEventListener('change', originalDateValidationHandler);
        targetDateInput.removeEventListener('change', targetDateValidationHandler);
        modal.style.display = 'none';
    };
    modal.style.display = 'block';
}

async function cancelChange(changeId) {
    try {
        await db.collection('classChanges').doc(changeId).update({ status: 'cancelled' });
		localStorage.setItem(REFRESH_FLAG_KEY, 'true');
        activeChanges = activeChanges.filter(c => c.id !== changeId);
        updateActiveChangesInSession(); 
        if (activeSchedule.type && activeSchedule.name) {
            await showSchedule(activeSchedule.name, activeSchedule.type, 0); 
        }
        console.log('課程異動已成功取消！');
    } catch (error) {
        console.error("取消異動失敗:", error);
        console.error("取消失敗: " + error.message);
    }
}

function showSubstitutionModal(lesson, date, ownTeacherName) {
    console.log('DEBUG: showSubstitutionModal called.');
    substitutionInfo = {
        originalLesson: lesson,
        originalDate: date,
        ownTeacherName: ownTeacherName
    };
    const modal = document.getElementById('substitution-modal');
    const detailsEl = document.getElementById('substitution-details');
    const teacherSelect = document.getElementById('substitute-teacher-select');
    const dateInput = document.getElementById('substitution-date');
    const reasonInput = document.getElementById('substitution-reason');
    const exchangeCheckbox = document.getElementById('exchange-checkbox');
    const confirmBtn = document.getElementById('confirm-substitution-btn'); 
    const days = ['一', '二', '三', '四', '五'];
    const originalDayIndex = new Date(substitutionInfo.originalDate).getDay() - 1;
    const dayChar = days[originalDayIndex] || '假日';
    const periodInfo = getPeriodTimeInfo(lesson.period + 1);
    const timeStr = periodInfo ? ` (${periodInfo.start} - ${periodInfo.end})` : '';
    detailsEl.innerHTML = `<p style="margin: 0;"><strong>您要請假的課程：</strong><br>
                        週${dayChar} 第 ${lesson.period + 1} 節${timeStr}<br>
                        ${lesson.subject} (${lesson.class})</p>`;
    teacherSelect.innerHTML = '<option value="">-- 請選擇 --</option>';
    allTeachersList.forEach(teacher => {
        const isBusy = teacherSchedules.get(teacher)?.[lesson.period]?.[originalDayIndex];
        if (teacher !== ownTeacherName && !isBusy) {
            const option = new Option(teacher, teacher);
            teacherSelect.appendChild(option);
        }
    });
    const now = new Date();
    let initialDate = new Date(date);
    if (periodInfo) {
        const lessonFullDateTime = new Date(initialDate);
        lessonFullDateTime.setHours(Math.floor(periodInfo.endMinutes / 60), periodInfo.endMinutes % 60, 0, 0); 
        if (lessonFullDateTime < now) {
            initialDate.setDate(initialDate.getDate() + 7);
        }
    }
    const defaultDate = findNextAvailableDate(initialDate, lesson.period, originalDayIndex);
    dateInput.value = formatDate(defaultDate, 'YYYY-MM-DD');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateInput.min = formatDate(today, 'YYYY-MM-DD');
    reasonInput.value = '';
    exchangeCheckbox.checked = false;
    let lastValidDate = dateInput.value;
    const dateValidationHandler = () => {
        const newDate = new Date(dateInput.value);
        const newDayIndex = (newDate.getDay() + 6) % 7;
        if (newDayIndex !== originalDayIndex) {
            alert(`日期選擇錯誤！\n\n原始課程是「星期${dayChar}」，您不能選擇其他星期。\n系統將自動還原。`);
            dateInput.value = lastValidDate;
        } else {
            lastValidDate = dateInput.value;
        }
    };
    const updateButtonState = () => {
        const selectedTeacher = teacherSelect.value;
        if (!selectedTeacher) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = '請先選擇老師';
            confirmBtn.style.backgroundColor = '#ccc';
            return;
        }
        confirmBtn.disabled = false;
        confirmBtn.style.backgroundColor = exchangeCheckbox.checked ? '#ff8c00' : '#28a745';
        confirmBtn.textContent = exchangeCheckbox.checked ? '下一步：選擇還課時段' : '確認指定代課';
    };
    const confirmClickHandler = () => {
        console.log('DEBUG: confirmClickHandler activated.');
        const selectedTeacher = teacherSelect.value;
        if (!selectedTeacher) return;
        substitutionInfo.substituteTeacherName = selectedTeacher;
        substitutionInfo.newDate = dateInput.value;
        substitutionInfo.reason = reasonInput.value.trim();
        if (exchangeCheckbox.checked) {
            showExchangeModal();
        } else {
            confirmAndSaveChange('substitution', confirmBtn); 
        }
    };
    confirmBtn.onclick = null;
    confirmBtn.removeEventListener('click', confirmClickHandler); 
    dateInput.removeEventListener('change', dateValidationHandler);
    dateInput.addEventListener('change', dateValidationHandler);
    exchangeCheckbox.removeEventListener('change', updateButtonState);
    exchangeCheckbox.addEventListener('change', updateButtonState);
    teacherSelect.removeEventListener('change', updateButtonState);
    teacherSelect.addEventListener('change', updateButtonState);
    confirmBtn.onclick = confirmClickHandler;
    modal.querySelector('.close-button').onclick = () => {
        dateInput.removeEventListener('change', dateValidationHandler);
        confirmBtn.onclick = null; 
        document.getElementById('exchange-modal').style.display = 'none'; 
        modal.style.display = 'none';
    };
    updateButtonState();
    modal.style.display = 'block';
}

function showExchangeModal() {
    const modal = document.getElementById('exchange-modal');
    const titleEl = document.getElementById('exchange-modal-title');
    const subtitleEl = document.getElementById('exchange-modal-subtitle');
    const bodyEl = document.getElementById('exchange-modal-body');
    const ownTeacherName = substitutionInfo.ownTeacherName;
    const targetTeacherName = substitutionInfo.substituteTeacherName;
    let exchangeWeekStart = getMonday(new Date(substitutionInfo.newDate));
    titleEl.textContent = `請選擇一節 ${targetTeacherName} 老師的課來交換`;
    subtitleEl.textContent = `灰色格子代表您(${ownTeacherName})當時有課，或為您請假時段，無法選擇`;
    const renderExchangeSchedule = () => {
        const ownSchedule = teacherSchedules.get(ownTeacherName);
        const targetSchedule = teacherSchedules.get(targetTeacherName);
        const daysOfWeekForHeader = ['星期一', '星期二', '星期三', '星期四', '星期五'];
        let tableHtml = '<table class="schedule-table"><thead><tr><th>節次</th>';
        const weekDates = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date(exchangeWeekStart);
            date.setDate(exchangeWeekStart.getDate() + i);
            weekDates.push(date);
            tableHtml += `<th>${daysOfWeekForHeader[i]}<br>(${formatDate(date)})</th>`;
        }
        tableHtml += '</tr></thead><tbody>';
        const originalDayIndex = new Date(substitutionInfo.originalDate).getDay() - 1;
        for (let period = 0; period < 8; period++) {
            const periodTimeInfo = getPeriodTimeInfo(period + 1);
            const timeRangeStr = periodTimeInfo ? 
                `<br><span style="font-size: 0.7em; font-weight: normal; line-height: 1.2; white-space: nowrap;">${periodTimeInfo.start}~${periodTimeInfo.end}</span>` 
                : '';
            tableHtml += `<tr><td class="period-header">${period + 1}${timeRangeStr}</td>`;
            for (let day = 0; day < 5; day++) {
                const targetLesson = targetSchedule?.[period]?.[day];
                const ownLesson = ownSchedule?.[period]?.[day];
                const isOriginalExchangeTime = (period === substitutionInfo.originalLesson.period && day === originalDayIndex && exchangeWeekStart.getTime() === getMonday(new Date(substitutionInfo.newDate)).getTime());
                if (targetLesson) {
                    if (ownLesson || isOriginalExchangeTime) {
                        tableHtml += `<td class="disabled-cell"><span class="subject">${targetLesson.subject}</span><span class="details">${targetLesson.class}</span></td>`;
                    } else {
                        const cellDate = formatDate(weekDates[day], 'YYYY-MM-DD');
                        tableHtml += `<td class="exchange-target-cell" data-period="${period}" data-day="${day}" data-date="${cellDate}"><span class="subject">${targetLesson.subject}</span><span class="details">${targetLesson.class}</span></td>`;
                    }
                } else {
                    tableHtml += `<td class="empty-cell"></td>`;
                }
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        bodyEl.innerHTML = tableHtml;
        bodyEl.querySelector('.schedule-table').addEventListener('click', (e) => {
            const cell = e.target.closest('td');
            if (cell && cell.classList.contains('exchange-target-cell')) {
                const period = parseInt(cell.dataset.period);
                const day = parseInt(cell.dataset.day);
                const date = cell.dataset.date;
                const exchangeLesson = targetSchedule[period][day];
                if (!exchangeLesson || !date || day === undefined || period === undefined) {
                    alert("錯誤：無法獲取完整的課程資訊，請重試。");
                    return;
                }
                substitutionInfo.exchangeLessonInfo = {
                    ...exchangeLesson,
                    teacher: targetTeacherName,
                    date,
                    period,
                    day
                };
                const tempBtnReference = document.getElementById('confirm-substitution-btn');
                confirmAndSaveChange('exchange', tempBtnReference);					
            }
        });
    };
    document.getElementById('exchange-prev-week-btn').onclick = () => {
        exchangeWeekStart.setDate(exchangeWeekStart.getDate() - 7);
        renderExchangeSchedule();
    };
    document.getElementById('exchange-next-week-btn').onclick = () => {
        exchangeWeekStart.setDate(exchangeWeekStart.getDate() + 7);
        renderExchangeSchedule();
    };
    document.getElementById('exchange-today-btn').onclick = () => {
        exchangeWeekStart = getMonday(new Date());
        renderExchangeSchedule();
    };
    renderExchangeSchedule();
    document.getElementById('substitution-modal').style.display = 'none';
    modal.style.display = 'block';
    modal.querySelector('.close-button').onclick = () => modal.style.display = 'none';
}

async function confirmAndSaveChange(type, callingBtn) {
    let message = '';
    let changeData = {};
    
    if (type === 'substitution') {
        const { substituteTeacherName, newDate } = substitutionInfo;
        message = `您確定要請 ${substituteTeacherName} 老師於 ${newDate} 代您這節課嗎？`;
    } else if (type === 'exchange') {
        const infoA = substitutionInfo.originalLesson;
        const teacherB = substitutionInfo.substituteTeacherName;
        const dateA = substitutionInfo.newDate;
        const infoB = substitutionInfo.exchangeLessonInfo;
        const dateB = infoB.date;
        message = `您確定要進行以下換課嗎？\n\n` +
                  `您的課程：\n${dateA} 第${infoA.period+1}節 [${infoA.subject}] 將由 ${teacherB} 代課。\n\n`+
                  `您需還課：\n${dateB} 第${infoB.period+1}節 您將前往 ${infoB.class} 代 ${teacherB} 的 [${infoB.subject}] 課。`;
    } else if (type === 'swap') {
         const { originalClassInfo, targetClassInfo } = arguments[2];
         message = `您確定要將 ${originalClassInfo.date} 的課與 ${targetClassInfo.date} 的課進行調換嗎？`;
    }
    if (confirm(message)) {
        if (type === 'substitution' || type === 'exchange') {
            const dateToCheck = substitutionInfo.newDate;
            const periodToCheck = substitutionInfo.originalLesson.period;
            const dayToCheck = new Date(dateToCheck).getDay() - 1;
            const conflict = isDateConflict(dateToCheck, periodToCheck, dayToCheck);
            if (conflict) {
                let conflictType = '';
                switch (conflict.type) {
                    case 'swap': conflictType = '調課'; break;
                    case 'exchange': conflictType = '換課'; break;
                    case 'substitution': conflictType = '指定代課'; break;
                    default: conflictType = '課程異動';
                }
                alert(`錯誤：該節次 (${dateToCheck} 第 ${periodToCheck + 1} 節) 已被『${conflictType}』，無法重複設定。`);
                return;
            }
        }
        callingBtn.disabled = true;
        callingBtn.textContent = '儲存中...';
        let involvedIds = [currentUser.uid];
        try {
            if (type === 'substitution') {
                 changeData = {
                    type: 'substitution',
                    date: substitutionInfo.newDate,
                    reason: substitutionInfo.reason || '',
                    originalTeacherName: substitutionInfo.ownTeacherName,
                    substituteTeacherName: substitutionInfo.substituteTeacherName,
                    involvedTeacherIds: involvedIds, 
                    lessonInfo: {
                        subject: substitutionInfo.originalLesson.subject,
                        class: substitutionInfo.originalLesson.class,
                        location: substitutionInfo.originalLesson.location,
                        period: substitutionInfo.originalLesson.period
                    },
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
            } else if (type === 'exchange') {
                const { originalLesson, ownTeacherName, newDate, exchangeLessonInfo } = substitutionInfo;
                changeData = {
                    type: 'exchange',
                    reason: substitutionInfo.reason || '',
                    originalLessonInfo: {
                        teacher: ownTeacherName,
                        date: newDate,
                        subject: originalLesson.subject,
                        class: originalLesson.class,
                        location: originalLesson.location,
                        period: originalLesson.period
                    },
                    exchangeLessonInfo: {
                        teacher: exchangeLessonInfo.teacher,
                        date: exchangeLessonInfo.date,
                        subject: exchangeLessonInfo.subject,
                        class: exchangeLessonInfo.class,
                        location: exchangeLessonInfo.location,
                        period: exchangeLessonInfo.period
                    },
                    involvedTeacherIds: involvedIds, 
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }
            } else if (type === 'swap') {
                const swapInfo = arguments[2];
                changeData = {
                    type: 'swap',
                    originalClassInfo: { ...swapInfo.original, teacher: swapInfo.original.teacher, date: swapInfo.original.date },
                    targetClassInfo: { ...swapInfo.target, teacher: swapInfo.target.teacher, class: swapInfo.original.class, date: swapInfo.target.date },
                    involvedTeacherIds: involvedIds, 
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
            }
            const docRef = await db.collection('classChanges').add(changeData);
			localStorage.setItem(REFRESH_FLAG_KEY, 'true'); 
            document.getElementById('substitution-modal').style.display = 'none';
            document.getElementById('exchange-modal').style.display = 'none';
            let successMessage = ''; 
            if (type === 'substitution') {
                successMessage = "代課指定成功！是否將此代課事件加入行事曆？";
            } else if (type === 'swap') {
                successMessage = "調課成功！是否將相關異動事件加入行事曆？";
            } else if (type === 'exchange') {
                successMessage = "換課成功！是否將相關異動事件加入行事曆？";
            } else {
                successMessage = "異動儲存成功！是否將相關事件加入行事曆？";
            }
            const exportConfirmed = confirm(successMessage); 
            changeData.id = docRef.id;
			activeChanges.push(changeData);
			updateActiveChangesInSession(); 
            const jumpDate = type === 'substitution' ? substitutionInfo.newDate : (type === 'exchange' ? substitutionInfo.newDate : changeData.originalClassInfo.date);
			currentWeekStart = getMonday(new Date(jumpDate));
			if (activeSchedule.type && activeSchedule.name) {
				await showSchedule(activeSchedule.name, activeSchedule.type, 0); 
			}			
            if (exportConfirmed) {
                promptForIcsExport(type, changeData);
            }
        } catch (error) {
            console.error("儲存異動紀錄失敗:", error);
            alert('儲存失敗: ' + error.message);
        } finally {
            const isExchangeChecked = document.getElementById('exchange-checkbox')?.checked;
            callingBtn.disabled = false;
            if (type === 'substitution' || type === 'exchange') {
                callingBtn.textContent = isExchangeChecked ? '下一步：選擇還課時段' : '確認指定代課';
                callingBtn.style.backgroundColor = isExchangeChecked ? '#ff8c00' : '#28a745';
            } else {
                callingBtn.textContent = '確認調課';
                callingBtn.style.backgroundColor = '#007bff';
            }
        }
    }
}

function promptForIcsExport(type, changeData) {
    const eventsToExport = [];
    const changeReason = changeData.reason || ''; 
    const selfTeacherName = currentUser.displayName; 

    if (type === 'substitution') {
        const lessonInfo = changeData.lessonInfo;
        const substituteTeacherName = changeData.substituteTeacherName || '不明代課老師'; 
        const originalTeacherName = changeData.originalTeacherName || '不明原老師';      
        const reasonContent = `[代課] ${changeReason ? '事由: ' + changeReason + '。' : ''}由 ${substituteTeacherName} 老師上課。`;
        eventsToExport.push({
            subject: lessonInfo.subject,
            class: lessonInfo.class,
            teacher: substituteTeacherName, 
            substituteTeacherName: substituteTeacherName, 
            period: lessonInfo.period, 
            day: lessonInfo.day,       
            periodNum: lessonInfo.period + 1,
            date: changeData.date,
            location: lessonInfo.location,
            reason: reasonContent, 
            isSubstitutedOut: true 
        });
        eventsToExport.forEach(event => {
            const eventDate = new Date(event.date);
            const weekStart = getMonday(eventDate);
            const dayIndex = eventDate.getDay(); 
            showSingleEventModal(event, weekStart, dayIndex);
        });
    } 
    else if (type === 'swap' || type === 'exchange') {
        const infoA = type === 'swap' ? changeData.originalClassInfo : changeData.originalLessonInfo; 
        const infoB = type === 'swap' ? changeData.targetClassInfo : changeData.exchangeLessonInfo; 
        const statusPrefix = type === 'swap' ? '[調課]' : '[換課]';
        const reasonAContent = `${statusPrefix}${changeReason ? '事由: ' + changeReason + '。' : ''}`+ (type === 'swap'?` ${infoB.teacher}`:`由 ${infoB.teacher} 老師代。`);
        eventsToExport.push({
            subject: (type === 'swap' ? infoB.subject : infoA.subject),
            class: (type === 'swap' ? infoB.class : infoA.class),
            teacher: selfTeacherName, 
            targetTeacher: infoB.teacher, 
            period: infoA.period, 
            day: infoA.day,       
            periodNum: infoA.period + 1,
            date: infoA.date,
            location: infoA.location,
            reason: reasonAContent, 
            isExchangedOut: type === 'exchange',
            isSwappedOut: type === 'swap'
        });
        const reasonBContent = `${statusPrefix}${changeReason ? '事由: ' + changeReason + '。' : ''}`+ (type === 'swap'?` ${infoA.teacher}`:`由 ${infoA.teacher} 老師代。`);
        eventsToExport.push({
            subject: (type === 'swap' ? infoA.subject : infoB.subject),
            class: (type === 'swap' ? infoA.class : infoB.class),
            teacher: selfTeacherName,
            period: infoB.period, 
            day: infoB.day,       
            periodNum: infoB.period + 1,
            date: infoB.date,
            location: infoB.location,
            reason: reasonBContent, 
            isExchangedIn: type === 'exchange',
            isSwappedIn: type === 'swap'
        });
        showMultipleEventsModal(eventsToExport);
    }
}

function showSingleEventModal(lesson, weekStart, dayIndex) {
    const modal = document.getElementById('single-event-modal');
    const infoEl = document.getElementById('single-event-info');
    const dateInput = document.getElementById('single-event-date');
    const notesInput = document.getElementById('event-notes');
    const downloadBtn = document.getElementById('download-single-ics-btn');
    const periodNum = lesson.periodNum || (lesson.period !== undefined ? lesson.period + 1 : null);
    const periodInfo = getPeriodTimeInfo(periodNum);
    if (!periodInfo) {
        alert('錯誤：找不到課程時間資訊，無法匯出行事曆。');
        return;
    }
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex - 1); 
    const dateStr = formatDate(targetDate, 'YYYY-MM-DD');
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const targetDayOfWeek = targetDate.getDay(); 
    let title = `${lesson.subjectName || lesson.subject} (${lesson.className || lesson.class})`;
    let details = `由 ${lesson.teacherName || lesson.teacher} 老師授課`;
    if (lesson.isSubstitutedOut) {
        title = `[代課] ${title}`;
        details = `由 ${lesson.substituteTeacherName} 老師代課`;
    } else if (lesson.isExchangedOut) {
        title = `[換課] ${title}`;
        details = `由 ${lesson.targetTeacher} 老師代課 (您需還課)`;
    }
    infoEl.innerHTML = `
        <h3>${title}</h3>
        <p><strong>日期：</strong>${dateStr} (週${dayNames[targetDayOfWeek]})</p>
        <p><strong>時間：：</strong>第 ${periodNum} 節 (${periodInfo.start} - ${periodInfo.end})</p>
        <p><strong>細節：：</strong>${details}</p>
        <p><strong>地點：：</strong>${lesson.location || '無'}</p>
    `;
    notesInput.value = lesson.reason || '';
    dateInput.value = dateStr; 
    downloadBtn.onclick = () => {
        generateIcsForLesson({
            ...lesson, 
            periodNum: periodNum
        }, {
            teacherName: lesson.teacherName || lesson.teacher,
            date: dateInput.value, 
            notes: notesInput.value
        });
        modal.style.display = 'none';
    };
    modal.style.display = 'block';
}

function toIcsDateTime(date) {
    return date.toISOString().replace(/[-:]/g, '').substring(0, 15) + 'Z';
}

function generateMultipleIcs(events) {
    let icsContent = "BEGIN:VCALENDAR\r\n";
    icsContent += "VERSION:2.0\r\n";
    icsContent += "PRODID:-//TeacherScheduleSystem//NONSGML v1.0//EN\r\n";
    events.forEach(event => {
        const periodInfo = getPeriodTimeInfo(event.period + 1);
        if (!periodInfo) return;
        const dateObj = new Date(event.date);
        const [startH, startM] = periodInfo.start.split(':').map(Number);
        const [endH, endM] = periodInfo.end.split(':').map(Number);
        dateObj.setHours(startH, startM, 0, 0);
        const dtstart = toIcsDateTime(dateObj);
        dateObj.setHours(endH, endM, 0, 0);
        const dtend = toIcsDateTime(dateObj);
        const summary = `[${event.class}] ${event.subject} (${event.teacher})`;
        let description = event.reason || '';
        description = description.replace(/,/g, '\\,').replace(/\n/g, '\\n'); 
        const uid = `${Date.now()}-${Math.random().toString(36).substring(2)}-${event.period}-${event.day}-${event.date.replace(/-/g, '')}`;
        icsContent += "BEGIN:VEVENT\r\n";
        icsContent += `UID:${uid}\r\n`;
        icsContent += `DTSTAMP:${toIcsDateTime(new Date())}\r\n`;
        icsContent += `DTSTART:${dtstart}\r\n`;
        icsContent += `DTEND:${dtend}\r\n`;
        icsContent += `SUMMARY:${summary}\r\n`;
        icsContent += `LOCATION:${event.location || '未知地點'}\r\n`;
        icsContent += `DESCRIPTION:${description}\r\n`;
        icsContent += "END:VEVENT\r\n";
    });
    icsContent += "END:VCALENDAR\r\n";
    return icsContent;
}	

function showMultipleEventsModal(events) {
    const modal = document.getElementById('multiple-ics-export-modal');
    const contentDiv = document.getElementById('multiple-ics-event-details');
    const downloadBtn = document.getElementById('multiple-ics-download-btn');
    const closeBtn = modal.querySelector('.close-button');
    if (!modal) return;
    contentDiv.innerHTML = ''; 
    events.forEach((event, index) => {
        const periodInfo = getPeriodTimeInfo(event.period + 1);
        if (!periodInfo) return;
        const dateStr = new Date(event.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' });
        const timeStr = `${periodInfo.start} - ${periodInfo.end}`;
        let typeLabel = '異動事件';
        let color = '#333';
        if (event.isSwappedOut || event.isExchangedOut) {
            if (event.isSwappedOut)
                typeLabel = '【(調課)原課調出，新課調入】';
            else
                typeLabel = '【(換課)原課被代】';
            color = 'red';
        } else if (event.isSwappedIn || event.isExchangedIn) {
            if (event.isSwappedIn)
                typeLabel = '【(調課)原課調入】';
            else
                typeLabel = '【(換課)換代新課】';
            color = 'green';			
        }
        const eventHtml = `
            <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; background-color: #f9f9f9;">
                <h4 style="margin-top: 0; color: ${color};">${typeLabel}</h4>
                <p style="margin: 3px 0;"><strong>日期與時間：</strong> ${dateStr} ${timeStr} (第 ${event.periodNum} 節)</p>
                <p style="margin: 3px 0;"><strong>班級/科目：</strong> ${event.class} - ${event.subject}</p>
                <p style="margin: 3px 0;"><strong>註記/事由：</strong> ${event.reason || '無'}</p>
            </div>
        `;
        contentDiv.innerHTML += eventHtml;
    });
    downloadBtn.onclick = () => {
        const icsContent = generateMultipleIcs(events);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `課表異動_${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        modal.style.display = 'none';
    };
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    modal.style.display = 'flex';
}

function generateIcsForLesson(lesson, options) {
    const { teacherName, date, notes } = options;
    const periodData = PERIOD_TIMES.find(p => p.period === lesson.periodNum);
    if(!periodData) {
         console.error("錯誤：找不到該節次的確切時間資訊，無法匯出 ICS 檔案。請聯繫管理員更新課程時間表。");
         return;
    }
    const classStartTimeStr = periodData.start;
    const durationMinutes = periodData.duration;
    const [startH, startM] = classStartTimeStr.split(':');
    const startTime = new Date(`${date}T00:00:00`);
    startTime.setHours(startH, startM);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000); 
    const formatTime = (d) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };
    const formattedNotes = (notes || '').replace(/\n/g, '\\n');
    let summary = '';
    if (lesson.isSubstitutedIn) {
        summary = `[${lesson.subject}] 代 ${lesson.originalTeacherName} (${lesson.class})`;
    } else if (lesson.isSubstitutedOut) {
        summary = `[${lesson.subject}] 由 ${lesson.substituteTeacherName} 代課 (${lesson.class})`;
    } else if (lesson.isExchangedIn) {
        summary = `[${lesson.subject}] 換課: 代 ${lesson.originalTeacher} (${lesson.class})`;
    } else if (lesson.isExchangedOut) {
        summary = `[${lesson.subject}] 換課: 由 ${lesson.targetTeacher} 代 (${lesson.class})`;
    } else {
        summary = `[${lesson.subject}] ${lesson.class} (${teacherName})`;
    }
    let eventDetails = [
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random()}@myapp.com`,
        `DTSTAMP:${formatTime(new Date())}Z`,
        `DTSTART;TZID=Asia/Taipei:${formatTime(startTime)}`,
        `DTEND;TZID=Asia/Taipei:${formatTime(endTime)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${formattedNotes}`,
        `LOCATION:${lesson.location || ''}`,
        'END:VEVENT'
    ];
    const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//My School//EN', ...eventDetails, 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${date}-${teacherName}-${lesson.subject}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

/* 🟢 修改 start: bindEventListeners 函式 (修正點擊名字無反應的問題) */
function bindEventListeners() {
    // 防止重複執行的旗標
    if (window.isTimetableEventsBound) return;
    window.isTimetableEventsBound = true;

    // 1. 自動開啟 Checkbox 設定
    const autoOpenChk = document.getElementById('auto-open-chk');
    const AUTO_OPEN_KEY = 'timetable_auto_open_preference';
    if (autoOpenChk) {
        autoOpenChk.checked = localStorage.getItem(AUTO_OPEN_KEY) !== 'false';
        autoOpenChk.addEventListener('change', (e) => {
            localStorage.setItem(AUTO_OPEN_KEY, e.target.checked);
        });
    }

    // 2. 統一的點擊事件管理員
    document.addEventListener('click', (event) => {
        const target = event.target;
        const dropdownList = document.getElementById('recent-schedules-list');
        
        // A. 下拉選單切換
        if (target.closest('#recent-schedules-btn') || target.closest('#main-title')) {
            event.stopPropagation();
            populateRecentList();
            if (dropdownList) dropdownList.classList.toggle('show');
            return;
        }

        // B. 關閉下拉選單
        if (dropdownList && dropdownList.classList.contains('show') && !target.closest('.dropdown-content')) {
            dropdownList.classList.remove('show');
        }

        // C. 關閉 Modal
        if (target.classList.contains('modal') || target.closest('.close-button')) {
            const modal = target.classList.contains('modal') ? target : target.closest('.modal').closest('.modal'); 
            if (modal) modal.style.display = 'none';
        }
    });

    // 3. 搜尋框輸入監聽
    const searchInput = document.getElementById('search-teacher');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const container = document.getElementById('teacher-list-by-subject-container'); 
            if (container) {
                container.querySelectorAll('.department-table').forEach(table => {
                    let tableHasVisibleRow = false;
                    table.querySelectorAll('tbody tr').forEach(row => {
                        const nameCell = row.querySelector('.name-cell');
                        const isVisible = nameCell && nameCell.textContent.toLowerCase().includes(searchTerm);
                        row.style.display = isVisible ? '' : 'none';
                        if (isVisible) tableHasVisibleRow = true;
                    });
                    table.style.display = (tableHasVisibleRow || !searchTerm) ? '' : 'none';
                });
            }
        });
    }
    
    // 🟢 修改重點：點擊使用者名稱顯示課表
    const userEmailSpan = document.getElementById('user-email');
    if (userEmailSpan) {
        userEmailSpan.onclick = () => {
            if (!currentUserDisplayName) {
                alert('系統尚未讀取到您的身分名稱，請稍後再試。');
                return;
            }
            // 移除 teacherSchedules.has() 的預先檢查
            // 直接嘗試開啟，如果課表不存在，showSchedule 內部會顯示「資料錯誤」的提示
            // 這樣可以避免因資料初始化延遲導致的「點擊無反應」現象
            currentWeekStart = getMonday(new Date());
            showSchedule(currentUserDisplayName, 'teacher');
        };
    }

    // 4. 手機滑動手勢
    const scheduleModalBody = document.getElementById('modal-body'); 
    const exchangeModalBody = document.getElementById('exchange-modal-body'); 
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; 

    function handleTouchStart(event) {
        if (event.touches.length === 1) {
            touchStartX = event.touches[0].clientX;
            touchEndX = 0;
        }
    }
    function handleTouchMove(event) {
        if (event.touches.length > 1) {
            touchStartX = 0;
        }
    }

    if (scheduleModalBody) {
        scheduleModalBody.addEventListener('touchstart', handleTouchStart, { passive: true });
        scheduleModalBody.addEventListener('touchmove', handleTouchMove, { passive: true });
        scheduleModalBody.addEventListener('touchend', (event) => {
            if (event.changedTouches.length === 1 && touchStartX !== 0) {
                touchEndX = event.changedTouches[0].clientX;
                const deltaX = touchEndX - touchStartX;
                if (Math.abs(deltaX) > swipeThreshold && document.getElementById('schedule-modal').style.display === 'block') {
                    if (deltaX < 0) {
                        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
                        showSchedule(activeSchedule.name, activeSchedule.type, 1);
                    } else {
                        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
                        showSchedule(activeSchedule.name, activeSchedule.type, -1);
                    }
                }
            }
            touchStartX = 0;
        });
    }

    if (exchangeModalBody) {
        exchangeModalBody.addEventListener('touchstart', handleTouchStart, { passive: true });
        exchangeModalBody.addEventListener('touchmove', handleTouchMove, { passive: true });
        exchangeModalBody.addEventListener('touchend', (event) => {
            if (event.changedTouches.length === 1 && touchStartX !== 0) {
                touchEndX = event.changedTouches[0].clientX;
                const deltaX = touchEndX - touchStartX;
                if (Math.abs(deltaX) > swipeThreshold && document.getElementById('exchange-modal').style.display === 'block') {
                    if (deltaX < 0) {
                        document.getElementById('exchange-next-week-btn')?.click(); 
                    } else {
                        document.getElementById('exchange-prev-week-btn')?.click(); 
                    }
                }
            }
            touchStartX = 0;
        });
    }
}
/* 🟢 修改 end */
    
function getRecentSchedules() {
    try {
        const stored = localStorage.getItem('recentSchedules');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function addRecentSchedule(name, type) {
    let recents = getRecentSchedules();
    recents = recents.filter(item => !(item.name === name && item.type === type));
    recents.unshift({ name, type });
    if (recents.length > MAX_RECENT_ITEMS) {
        recents = recents.slice(0, MAX_RECENT_ITEMS);
    }
    localStorage.setItem('recentSchedules', JSON.stringify(recents));
}

function populateRecentList() {
    const recents = getRecentSchedules();
    recentSchedulesList.innerHTML = '';
    if (recents.length === 0) {
        const emptyItem = document.createElement('span');
        emptyItem.textContent = '尚無瀏覽紀錄';
        emptyItem.style.padding = '10px 15px';
        emptyItem.style.color = '#999';
        emptyItem.style.fontSize = '0.9em';
        recentSchedulesList.appendChild(emptyItem);
        return;
    }
    recents.forEach(item => {
        const btn = document.createElement('button');
        let typeText = '';
        if (item.type === 'teacher') typeText = ' (教師)';
        if (item.type === 'class') typeText = ' (班級)';
        btn.textContent = item.name + typeText;
        btn.onclick = () => {
            showSchedule(item.name, item.type);
            recentSchedulesList.classList.remove('show');
        };
        recentSchedulesList.appendChild(btn);
    });
}
