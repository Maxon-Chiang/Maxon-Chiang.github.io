// timetable_core.js

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

// 全局/共享狀態變數 (在新的 JS 檔案中保留為 window 屬性或使用 const)
let currentUser = null;
let currentUserDisplayName = '';
const MAX_RECENT_ITEMS = 10;
const REFRESH_FLAG_KEY = 'teacherTimetableNeedsRefresh';
const TRANSFER_KEY = 'initialActiveChanges';
const TIMETABLE_CACHE_KEY = 'timetable_static_cache_v1'; 

let CACHE_DATA = {};
let PERIOD_TIMES = [];
let scheduleSnapshot = null;
let teachersDataCache = new Map();

const SUBJECT_ORDER = ['國文', '英語', '數學', '社會', '自然', '綜合', '藝術', '健體', '科技'];
const LONG_PRESS_DURATION = 500;

let currentView = 'subject'; 
let currentWeekStart = getMonday(new Date());
let activeSchedule = { type: null, name: null };
let teacherViewSelectedCell = null;
let classViewSelectedCell = null;

let activeChanges = [];

let allTeachersList = [];
let substitutionInfo = {};

const classSchedules = new Map();
const teacherSchedules = new Map();
const teacherNameToId = new Map();

// ----------------------------------------------------
// 輔助函數
// ----------------------------------------------------

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

function isValidTeacher(name) {
    if (!name) return false;
    return !/^(英文師|數學師|自然師|共選師|社團師|彈學師)\d*$/.test(name);
}

function isValidClassForListing(name) {
    if (!name) return false;
    return true; 
}

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

function updateActiveChangesInSession() {
    try {
        sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(activeChanges));
    } catch (e) {
        console.error("更新 Session Storage 中的 activeChanges 失敗:", e);
    }
}

// ----------------------------------------------------
// 資料讀取與快取管理
// ----------------------------------------------------

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

async function loadActiveChanges() {
    const transferredChanges = sessionStorage.getItem(TRANSFER_KEY);
	if (transferredChanges) {
		try {
			activeChanges = JSON.parse(transferredChanges);
			sessionStorage.removeItem(TRANSFER_KEY);
			console.log(`成功載入 ${activeChanges.length} 筆傳遞的異動數據（來自 teacher.html）。`);
            return;
		} catch (e) {
			console.error("解析傳遞的異動數據失敗:", e);
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
		updateActiveChangesInSession(); // 確保雲端數據寫入 Session
	} catch (e) {
		console.error("載入活躍異動失敗:", e);
	}
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

// ----------------------------------------------------
// 主入口點
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            const displayElement = document.getElementById('user-email');

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) { 
                    const userData = userDoc.data();
                    if (userData.displayName) {
                        displayElement.textContent = userData.displayName;
                        currentUserDisplayName = userData.displayName;
                    } else {
                        displayElement.textContent = user.email;
                        currentUserDisplayName = user.email;
                    }
                } else {
                    displayElement.textContent = user.email;
                }
            } catch (e) {
                displayElement.textContent = user.email;
            }

            main();
        } else {
            window.location.href = 'login.html';
        }
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut();
    });
});


async function main() {
    
    await loadActiveChanges();

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
    
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (!userDoc.exists || !userDoc.data().schoolId) {
        alert('錯誤：您的帳號資料不完整，找不到 schoolId。');
        document.querySelector('.container').innerHTML = '<h2>讀取資料失敗：帳號未綁定學校 ID。</h2>';
        return;
    }
    const userData = userDoc.data();
    const schoolId = userData.schoolId;
    
    let useCache = false;
    try {
        const storedCache = localStorage.getItem(TIMETABLE_CACHE_KEY);
        if (storedCache) {
            const parsedCache = JSON.parse(storedCache);
            if (parsedCache.schoolId === schoolId && parsedCache.version === TIMETABLE_CACHE_KEY) {
                CACHE_DATA = parsedCache;
                console.log('快取命中，加速載入課表資料...');
                
                PERIOD_TIMES = CACHE_DATA.PERIOD_TIMES || PERIOD_TIMES;
                scheduleSnapshot = { forEach: (callback) => (CACHE_DATA.scheduleData || []).forEach(callback), size: CACHE_DATA.scheduleData ? CACHE_DATA.scheduleData.length : 0 };
                CACHE_DATA.teacherList.forEach(item => teachersDataCache.set(item.id, item.data));
                useCache = true;
            } else {
                localStorage.removeItem(TIMETABLE_CACHE_KEY);
            }
        }
    } catch (e) {
        console.error('讀取課表快取失敗:', e);
        localStorage.removeItem(TIMETABLE_CACHE_KEY);
    }
    
    const schoolRef = db.collection('schools').doc(schoolId);
    
    if (!useCache) {
        // 從 Firestore 載入資料
        await loadPeriodTimesFromFirestore(schoolId);
        scheduleSnapshot = await schoolRef.collection('timetables').get();
        
        const teachersSnapshot = await schoolRef.collection('teachers').get();
        teachersDataCache.clear();
        teachersSnapshot.forEach(doc => {
            teachersDataCache.set(doc.id, doc.data());
        });
        
        // 寫入快取
        CACHE_DATA = {
            schoolId: schoolId,
            version: TIMETABLE_CACHE_KEY,
            PERIOD_TIMES: PERIOD_TIMES,
            scheduleData: scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            teacherList: [...teachersDataCache.entries()].map(([id, data]) => ({ id, data })),
        };
        localStorage.setItem(TIMETABLE_CACHE_KEY, JSON.stringify(CACHE_DATA));
    }


    const usersSnapshot = await db.collection('users').where('schoolId', '==', schoolId).get();
    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.displayName && userData.role === 'teacher') {
            teacherNameToId.set(userData.displayName, doc.id);
        }
    });

    runPostCacheLogic(teacherNameToShow);
}


function runPostCacheLogic(teacherNameToShow) {
    const allTeachersWithSchedule = deriveSchedules();
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
        const lastScheduleJSON = localStorage.getItem('lastSchedule');
        if (lastScheduleJSON) {
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