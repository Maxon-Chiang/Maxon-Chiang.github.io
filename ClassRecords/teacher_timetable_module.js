// teacher_timetable_module.js

/**
 * 此模組包含所有與「我的課表」Modal 相關的邏輯和函數。
 * 它依賴於 teacher.js 中定義的全局變量和函數，例如：
 * - firebase (和 db, auth)
 * - currentUserData, teacherTimetableData, activeChanges, PERIOD_TIMES, currentWeekStart
 * - myTimetableModal, myTimetableTitle, myTimetableBody, timetableMessage
 * - formatDate, getMonday, getCurrentPeriodIndex, openStudentRosterModal
 */


// 避免重複載入或重複綁定事件
if (typeof window.teacherTimetableModuleLoaded === 'undefined') {
    window.teacherTimetableModuleLoaded = true;
} else {
    // 如果已經載入，則終止執行
    console.warn("teacher_timetable_module.js 已載入。終止重複載入。");
    // 雖然這裡終止，但仍需確保導航函數已經綁定，這在 teacher.js 中進行。
    // 為了安全，確保模組函數在 window 作用域下可用：
    // window.renderDerivedMyTimetable = renderDerivedMyTimetable;
    // window.findNextChangeWeek = findNextChangeWeek;
    
    // 如果是第一次載入，則繼續執行下面的函數定義
}

let timetableIntervalId = null;

function getDerivedCurrentUserSchedule() {
    if (!teacherTimetableData || !teacherTimetableData.periods) {
        return { periods: {} };
    }

    const derivedSchedule = JSON.parse(JSON.stringify(teacherTimetableData));
    const teacherName = currentUserData.displayName;

    activeChanges.forEach(change => {

        if (change.type === 'swap') {
            const infoA = change.originalClassInfo;
            const infoB = change.targetClassInfo;

            const weekA = getMonday(new Date(infoA.date));
            const weekB = getMonday(new Date(infoB.date));

            if (weekA.getTime() === currentWeekStart.getTime() && weekB.getTime() === currentWeekStart.getTime()) {
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

            if (changeWeekStart.getTime() !== currentWeekStart.getTime()) return;

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
            if (weekA.getTime() === currentWeekStart.getTime()) {
                const dayA = new Date(infoA.date).getDay() - 1;
                if (dayA >= 0 && dayA < 5) {
                    if (infoA.teacher === teacherName) {
                        derivedSchedule.periods[infoA.period][dayA] = { ...infoA, isExchangedOut: true, targetTeacher: infoB.teacher, changeId: change.id, reason: change.reason };
                    } else if (infoB.teacher === teacherName) {
                        derivedSchedule.periods[infoA.period][dayA] = { ...infoA, isExchangedIn: true, originalTeacher: infoA.teacher, changeId: change.id, reason: change.reason };
                    }
                }
            }

            const weekB = getMonday(new Date(infoB.date));
            if (weekB.getTime() === currentWeekStart.getTime()) {
                const dayB = new Date(infoB.date).getDay() - 1;
                if (dayB >= 0 && dayB < 5) {
                     if (infoB.teacher === teacherName) {
                        derivedSchedule.periods[infoB.period][dayB] = { ...infoB, isExchangedOut: true, targetTeacher: infoA.teacher, changeId: change.id, reason: change.reason };
                    } else if (infoA.teacher === teacherName) {
                        derivedSchedule.periods[infoB.period][dayB] = { ...infoB, isExchangedIn: true, originalTeacher: infoB.teacher, changeId: change.id, reason: change.reason };
                    }
                }
            }
        }
    });

    return derivedSchedule;
}

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
					} else if (cellContent.isExchangedOut) {
						const teacherName = cellContent.targetTeacher;
						content = `<span class="subject">${cellContent.subject}</span><span class="details">${cellContent.class || ''}</span>`;
						content += `<span style="font-size: 0.8em; color: #000000; font-weight: bold;">${teacherName || '不明'}(換)</span>`;
					} else if (cellContent.isExchangedIn) {
						const teacherName = cellContent.originalTeacher;
						content = `<span class="subject">${cellContent.subject}</span><span class="details">${cellContent.class || ''}</span>`;
						content += `<span style="font-size: 0.8em; color: #000000; font-weight: bold;">(${teacherName || '不明'}(換)</span>`;
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

function renderDerivedMyTimetable(direction = 0) {

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

// ----------------------------------------------------
// 將函數掛載到 window，以便 teacher.js 可以存取 (重要)
window.renderDerivedMyTimetable = renderDerivedMyTimetable;
window.findNextChangeWeek = findNextChangeWeek;
window.getDerivedCurrentUserSchedule = getDerivedCurrentUserSchedule;
window.renderMyTimetableTable = renderMyTimetableTable;

// ----------------------------------------------------
// 處理 Modal 事件監聽
document.getElementById('my-timetable-icon-btn').addEventListener('click', async () => {
    document.getElementById('dropdown-menu').classList.remove('show');

    if (!scheduleDataLoaded) {
         timetableMessage.textContent = '課表數據正在載入中...';
    }

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
         await loadActiveChanges(); // 確保每次打開課表時異動都是最新的
         await renderDerivedMyTimetable(10);
         timetableMessage.textContent = '';
    }

	document.body.classList.add('modal-open');
    myTimetableModal.style.display = 'flex';

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

// Modal 關閉時清除計時器
document.getElementById('my-timetable-modal').querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('my-timetable-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
    if (timetableIntervalId) {
         clearInterval(timetableIntervalId);
         timetableIntervalId = null;
    }
    // 清除事件，防止重複綁定
    document.getElementById('prev-week-btn').onclick = null;
    document.getElementById('next-week-btn').onclick = null;
    document.getElementById('today-btn').onclick = null;
});

// 處理 Modal 外部點擊關閉
window.addEventListener('click', (e) => {
    if (e.target.id === 'my-timetable-modal') {
         e.target.style.display = 'none';
         document.body.classList.remove('modal-open');
         if (timetableIntervalId) {
             clearInterval(timetableIntervalId);
             timetableIntervalId = null;
         }
    }
});

// 處理手機滑動事件
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