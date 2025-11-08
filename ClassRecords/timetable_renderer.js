// timetable_renderer.js

// 確保所需的全局變數已在 timetable_core.js 中定義並可用
// 依賴: teacherSchedules, classSchedules, PERIOD_TIMES, currentWeekStart, currentUserDisplayName, activeChanges, getPeriodTimeInfo, formatDate, isValidClassForListing, SUBJECT_ORDER, showSchedule, bindEventListeners

/**
 * 根據異動數據生成最終顯示的課表。
 * 注意: 這裡的邏輯與 timetable_core.js 中的 deriveSchedules 略有不同，
 * 它是在每次渲染前從基礎課表重新計算異動。
 * @returns {Set<string>} 所有有課的教師名稱 Set
 */
function deriveSchedules() {
    teacherSchedules.clear();
    classSchedules.clear();

    const allTeachers = new Set();
    
    // 1. 解析基礎課表
    parseSchedulesFromFirestore(allTeachers);

    // 2. 應用異動
    activeChanges.forEach(change => {
        
        // 檢查異動是否在本週 (只檢查 change.originalClassInfo/change.date 的週次)
        const weekIsCurrent = (dateStr) => getMonday(new Date(dateStr)).getTime() === currentWeekStart.getTime();

        if (change.type === 'swap' && weekIsCurrent(change.originalClassInfo.date)) {
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
        } else if (change.type === 'substitution' && weekIsCurrent(change.date)) {
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
        } else if (change.type === 'exchange') {
            const teacherA = change.originalLessonInfo.teacher; 
            const teacherB = change.exchangeLessonInfo.teacher; 
            const scheduleA = teacherSchedules.get(teacherA);
            const scheduleB = teacherSchedules.get(teacherB);
            const infoA = change.originalLessonInfo; 
            const infoB = change.exchangeLessonInfo; 

            // 檢查還課週次 (B) 是否在本週
            if (weekIsCurrent(infoB.date)) {
                const dayB = new Date(infoB.date).getDay() - 1;
                if (scheduleB && dayB >= 0 && dayB < 5) {
                    scheduleB[infoB.period][dayB] = { ...infoB, isExchangedOut: true, targetTeacher: teacherA, changeId: change.id, reason: change.reason };
                }
                if (scheduleA && dayB >= 0 && dayB < 5) {
                    scheduleA[infoB.period][dayB] = { ...infoB, isExchangedIn: true, originalTeacher: teacherB, changeId: change.id, reason: change.reason };
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
            
            // 檢查原課週次 (A) 是否在本週
            if (weekIsCurrent(infoA.date)) {
                const dayA = new Date(infoA.date).getDay() - 1;
                if (scheduleA && dayA >= 0 && dayA < 5) {
                    scheduleA[infoA.period][dayA] = { ...infoA, isExchangedOut: true, targetTeacher: teacherB, changeId: change.id, reason: change.reason };
                }
                if (scheduleB && dayA >= 0 && dayA < 5) {
                    scheduleB[infoA.period][dayA] = { ...infoA, isExchangedIn: true, originalTeacher: teacherA, changeId: change.id, reason: change.reason };
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


function populateTeacherListBySubject(allTeachersWithSchedule) {
    const container = document.getElementById('teacher-list-by-subject-container');
    container.innerHTML = '';
    
    const subjectsMap = new Map();
    
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
				currentWeekStart = getMonday(new Date()); // 重設為本週一
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

function renderScheduleTable(schedule, name, type, targetElement) {
    if (!schedule) return; 
    
    const titleEl = document.getElementById('modal-title');
    const titleEl2 = document.getElementById('modal-title2');
    const title = type === 'teacher' ? `${name} 課表` : `${name} 班課表`;
    titleEl.textContent = title;

    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const interactionHint = isTouchDevice ? '長按' : '右鍵';
    
    if (type === 'teacher' && name === currentUserDisplayName) {
        titleEl2.textContent = `＊點擊有課格子可進行調/代/換課（點擊自己課程，再點綠色建議格子），${interactionHint}可加入行事曆註記＊`;
    } else if (type === 'teacher') {
        titleEl2.textContent = `＊${interactionHint}可加入行事曆註記＊`;
    } else if (type === 'class') {
         titleEl2.textContent = '＊點擊有課的格子可看換課選擇＊';
    } else {
        titleEl2.textContent = '';
    }

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
    const todayWeekStart = getMonday(now);
    const isCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime();
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

                    const changeType = cellData.isSwappedIn || cellData.isSwappedOut ? '調課異動' : (cellData.isExchangedIn || cellData.isExchangedOut ? '換課異動' : '代課異動');

                    if (cellData.reason && cellData.reason.trim() !== '') {
                        const escapedReason = cellData.reason.replace(/"/g, '&quot;');
                        dataAttrs += ` title="${escapedReason}"`;
                    } else {
                        dataAttrs += ` title="${changeType}"`;
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
                        const teacherName = cellData.isExchangedOut ? cellData.targetTeacher : cellData.originalTeacher;                                 
                        content = `<span class="subject">${cellData.subject}</span><span class="details">${cellData.class || ''}</span>`;
                        content += `<span style="font-size: 0.8em; color: #000000; font-weight: bold;">${teacherName || '不明'}(換)</span>`;
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

    return scheduleTable;
}

/**
 * 顯示課表，處理週次切換的動畫
 * @param {string} name 課表名稱 (教師名或班級名)
 * @param {string} type 課表類型 ('teacher' or 'class')
 * @param {number} direction 導航方向 (-1:上週, 1:下週, 0:本週/垂直切換, 10:靜態載入)
 */
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
    
    const bodyEl = document.getElementById('modal-body');
    
    const todayWeekStart = getMonday(new Date());
    const isCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime();
    
    document.getElementById('today-btn').classList.toggle('current', isCurrentWeek);
    
    // 重新計算異動
    deriveSchedules(); 
    
    let schedule;
    if (type === 'teacher' && teacherSchedules.has(name)) {
        schedule = teacherSchedules.get(name);
    } else if (type === 'class' && classSchedules.has(name)) {
        schedule = classSchedules.get(name);
    } else {
        bodyEl.innerHTML = `<p style="text-align:center;">找不到 ${name} 的課表資料。</p>`;
        document.getElementById('modal-title').textContent = "資料錯誤";
        if (!modal.style.display || modal.style.display === 'none') modal.style.display = 'block';
        return;
    }
    
    
    const oldTable = bodyEl.querySelector('.schedule-table');

    if (isStatic || !oldTable) { 
        const table = renderScheduleTable(schedule, name, type, bodyEl);
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
        const newTable = renderScheduleTable(schedule, name, type, newTableContainer);

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

    if (!modal.style.display || modal.style.display === 'none') {
        modal.style.display = 'block';
    }
}