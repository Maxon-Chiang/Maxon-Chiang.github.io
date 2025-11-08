// timetable_interactions.js

// 確保所需的全局變數已在 timetable_core.js 和 timetable_renderer.js 中定義並可用
// 依賴: ...所有全局變數, showSchedule, getMonday, formatDate, getPeriodTimeInfo, isDateConflict, updateActiveChangesInSession, teacherSchedules, classSchedules, allTeachersList

// ----------------------------------------------------
// 事件處理函數 (調課、代課、換課、ICS)
// ----------------------------------------------------

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
            originalLessonData = JSON.parse(cell.dataset.originalLesson);
            targetLessonData = JSON.parse(cell.dataset.targetLesson);
        } catch (e) {
            alert("錯誤：調課建議資料解析失敗。請檢查課程名稱或聯繫開發人員。");
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
    
    if (!clickedLesson || clickedLesson.isSwappedOut || clickedLesson.isExchangedOut || clickedLesson.isSubstitutedOut) {
         return; // 不處理空單元格或已調出的單元格
    }
    
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

    // 排除點擊長節次 (如午休、第 8 節)
    if (period >= 7 || (day === 4 && period >= 5)) return; 

    cell.classList.add('highlight');
    teacherViewSelectedCell = cell;

    substitutionBtn.classList.add('visible');
    // 假設 showSubstitutionModal 是一個已定義的函數
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

    // 尋找調課建議 (雙邊有空)
    for (let p = 0; p < 7; p++) {
        for (let d = 0; d < 5; d++) {
            if ((d === 4 && p >= 5) || (p === period && d === day)) continue; 

            const ownTargetCellData = teacherSchedules.get(teacherName)?.[p]?.[d];
            if (!ownTargetCellData) { // 自己的目標時段沒課
                const lessonAtTarget = classSchedule[p]?.[d];
                if (lessonAtTarget?.teacher && lessonAtTarget.teacher !== teacherName) { // 該班級目標時段有其他老師的課
                    const otherTeacherSchedule = teacherSchedules.get(lessonAtTarget.teacher);
                    
                    const isOtherTeacherBusy = otherTeacherSchedule?.[period]?.[day];
                    if (!isOtherTeacherBusy) { // 對方的原時段也沒課
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

    const confirmSwapHandler = async () => {
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

        confirmBtn.disabled = true;
        confirmBtn.textContent = '儲存中...';
        
        let involvedIds = [currentUser.uid, teacherNameToId.get(swapInfo.target.teacher)];
        
        const changeData = {
            type: 'swap',
            originalClassInfo: { ...swapInfo.original, teacher: swapInfo.original.teacher, date: originalDateInput.value },
            targetClassInfo: { ...swapInfo.target, teacher: swapInfo.target.teacher, class: swapInfo.original.class, date: targetDateInput.value },
            involvedTeacherIds: involvedIds.filter(id => id), 
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
            confirmBtn.disabled = false;
            confirmBtn.textContent = '確認調課';
        }
    };
    
    confirmBtn.onclick = confirmSwapHandler;

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

    substitutionInfo = {
        originalLesson: { ...lesson, date: date, day: new Date(date).getDay() - 1 },
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
        // 檢查該時段是否已有異動 (如果異動不在本週，則忽略，因為這段邏輯是針對基礎課表)
        const isConflict = isDateConflict(date, lesson.period, originalDayIndex);
        
        if (teacher !== ownTeacherName && !isBusy && !isConflict) {
            const option = new Option(teacher, teacher);
            teacherSelect.appendChild(option);
        }
    });

    const now = new Date();
    let initialDate = new Date(date);
    
    if (periodInfo) {
        const lessonFullDateTime = new Date(initialDate);
        const totalMinutes = periodInfo.endMinutes;
        lessonFullDateTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0); 
        
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
    
    confirmBtn.onclick = confirmClickHandler;
    
    dateInput.addEventListener('change', dateValidationHandler);
    exchangeCheckbox.addEventListener('change', updateButtonState);
    teacherSelect.addEventListener('change', updateButtonState);
    
    modal.querySelector('.close-button').onclick = () => {
        dateInput.removeEventListener('change', dateValidationHandler);
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
    
    let exchangeWeekStart = getMonday(new Date(substitutionInfo.originalLesson.date)); // 預設從原請假週次的周一開始

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

        const originalLessonInfo = substitutionInfo.originalLesson;

        for (let period = 0; period < 8; period++) {
            const periodTimeInfo = getPeriodTimeInfo(period + 1);
            const timeRangeStr = periodTimeInfo ? 
                `<br><span style="font-size: 0.7em; font-weight: normal; line-height: 1.2; white-space: nowrap;">${periodTimeInfo.start}~${periodTimeInfo.end}</span>` 
                : '';

            tableHtml += `<tr><td class="period-header">${period + 1}${timeRangeStr}</td>`;
            
            for (let day = 0; day < 5; day++) {
                const targetLesson = targetSchedule?.[period]?.[day];
                const ownLesson = ownSchedule?.[period]?.[day];
                
                const cellDate = formatDate(weekDates[day], 'YYYY-MM-DD');

                // 檢查是否為請假時段 (原課時段在當前週次)
                const isOriginalExchangeTime = (period === originalLessonInfo.period && day === originalLessonInfo.day && getMonday(new Date(originalLessonInfo.date)).getTime() === exchangeWeekStart.getTime());
                
                // 檢查是否為活躍異動時段 (避免二次異動，只檢查自己)
                const isConflict = isDateConflict(cellDate, period, day);


                if (targetLesson) {
                    if (ownLesson || isOriginalExchangeTime || isConflict) {
                        tableHtml += `<td class="disabled-cell"><span class="subject">${targetLesson.subject}</span><span class="details">${targetLesson.class}</span></td>`;
                    } else {
                        tableHtml += `<td class="exchange-target-cell" data-period="${period}" data-day="${day}" data-date="${cellDate}"><span class="subject">${targetLesson.subject}</span><span class="details">${targetLesson.class}</span></td>`;
                    }
                } else {
                    tableHtml += `<td class="empty-cell"></td>`;
                }
            }
            tableHtml += '</tr>';
        }
        tableHTML += '</tbody></table>';
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
        const { substituteTeacherName, newDate, originalLesson } = substitutionInfo;
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
    }

    if (confirm(message)) {
        
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

        callingBtn.disabled = true;
        callingBtn.textContent = '儲存中...';

        let involvedIds = [currentUser.uid];
        const originalLesson = substitutionInfo.originalLesson;
        
        try {
            if (type === 'substitution') {
                involvedIds.push(teacherNameToId.get(substitutionInfo.substituteTeacherName));

                 changeData = {
                    type: 'substitution',
                    date: substitutionInfo.newDate,
                    reason: substitutionInfo.reason || '',
                    originalTeacherName: substitutionInfo.ownTeacherName,
                    substituteTeacherName: substitutionInfo.substituteTeacherName,
                    involvedTeacherIds: involvedIds.filter(id => id), 
                    lessonInfo: {
                        subject: originalLesson.subject,
                        class: originalLesson.class,
                        location: originalLesson.location,
                        period: originalLesson.period,
                        day: originalLesson.day // 儲存基礎課表資訊
                    },
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
            } else if (type === 'exchange') {
                const { ownTeacherName, newDate, exchangeLessonInfo } = substitutionInfo;
                involvedIds.push(teacherNameToId.get(exchangeLessonInfo.teacher));

                changeData = {
                    type: 'exchange',
                    reason: substitutionInfo.reason || '',
                    originalLessonInfo: { // 自己的課被代
                        teacher: ownTeacherName,
                        date: newDate,
                        subject: originalLesson.subject,
                        class: originalLesson.class,
                        location: originalLesson.location,
                        period: originalLesson.period,
                        day: originalLesson.day
                    },
                    exchangeLessonInfo: { // 自己去代對方的課 (還課)
                        teacher: exchangeLessonInfo.teacher,
                        date: exchangeLessonInfo.date,
                        subject: exchangeLessonInfo.subject,
                        class: exchangeLessonInfo.class,
                        location: exchangeLessonInfo.location,
                        period: exchangeLessonInfo.period,
                        day: exchangeLessonInfo.day
                    },
                    involvedTeacherIds: involvedIds.filter(id => id), 
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }
            }
            
            const docRef = await db.collection('classChanges').add(changeData);
			
			localStorage.setItem(REFRESH_FLAG_KEY, 'true');
            
            document.getElementById('substitution-modal').style.display = 'none';
            document.getElementById('exchange-modal').style.display = 'none';

            let successMessage = ''; 
            if (type === 'substitution') {
                successMessage = "代課指定成功！是否將此代課事件加入行事曆？";
            } else if (type === 'exchange') {
                successMessage = "換課成功！是否將相關異動事件加入行事曆？";
            }
            
            const exportConfirmed = confirm(successMessage); 
            
            // 由於 Firestore FieldValue.serverTimestamp() 會在伺服器端寫入時間，
            // 這裡將 docRef.id 填入 changeData.id，並在本地使用 new Date() 作為 fallback 時間。
			changeData.id = docRef.id;
			activeChanges.push(changeData);
			updateActiveChangesInSession(); 
			
			// 2. 重新定位到異動日期
			const jumpDate = type === 'substitution' ? substitutionInfo.newDate : substitutionInfo.originalLesson.date; 
			currentWeekStart = getMonday(new Date(jumpDate));

			// 3. 重新渲染當前的課表
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
            callingBtn.textContent = isExchangeChecked ? '下一步：選擇還課時段' : '確認指定代課';
            callingBtn.style.backgroundColor = isExchangeChecked ? '#ff8c00' : '#28a745';
        }
    }
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


// ----------------------------------------------------
// 行事曆匯出與 Modal 函數
// ----------------------------------------------------

function findNextAvailableDate(initialDate, period, day) {
    let nextAvailableDate = new Date(initialDate);
    let safetyCounter = 0;

    while (safetyCounter < 100) {
        const dateString = formatDate(nextAvailableDate, 'YYYY-MM-DD');
        const dayIndex = nextAvailableDate.getDay() - 1;
        
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
        // 這是因為輸入欄位已經限制了星期，但以防萬一
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

function promptForIcsExport(type, changeData) {
    const eventsToExport = [];
    const changeReason = changeData.reason || ''; 
    const selfTeacherName = currentUserDisplayName; 

    if (type === 'substitution') {
        const lessonInfo = changeData.lessonInfo;
        const substituteTeacherName = changeData.substituteTeacherName || '不明代課老師'; 
        
        // 匯出代課老師 (自己請假，代課老師來上課)
        const reasonContent = `[代課] ${changeReason ? '事由: ' + changeReason + '。' : ''}由 ${substituteTeacherName} 老師上課。`;
        
        const eventDate = new Date(changeData.date);
        const weekStart = getMonday(eventDate);
        const dayIndex = eventDate.getDay(); 

        showSingleEventModal({
            subject: lessonInfo.subject,
            class: lessonInfo.class,
            teacher: substituteTeacherName, 
            period: lessonInfo.period, // 0-7
            day: lessonInfo.day, // 0-4
            periodNum: lessonInfo.period + 1,
            location: lessonInfo.location,
            reason: reasonContent,
            isSubstitutedOut: true,
            substituteTeacherName: substituteTeacherName, 
        }, weekStart, dayIndex); 
    } 
    
    else if (type === 'swap' || type === 'exchange') {
        const infoA = type === 'swap' ? changeData.originalClassInfo : changeData.originalLessonInfo; // 自己調/換出的課
        const infoB = type === 'swap' ? changeData.targetClassInfo : changeData.exchangeLessonInfo; // 自己調/換入的課
        const statusPrefix = type === 'swap' ? '[調課]' : '[換課]';
        
        // 事件 1: 自己原課程被取代
        const reasonAContent = `${statusPrefix} ${changeReason ? '事由: ' + changeReason + '。' : ''}`+ (type === 'swap'?`調至 ${infoB.date} 第${infoB.period+1}節。`:`由 ${infoB.teacher} 老師代。`);

        eventsToExport.push({
            subject: (type === 'swap' ? infoA.subject : infoA.subject),
            class: (type === 'swap' ? infoA.class : infoA.class),
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

        // 事件 2: 自己去上取代的課
        const reasonBContent = `${statusPrefix} ${changeReason ? '事由: ' + changeReason + '。' : ''}`+ (type === 'swap'?`調自 ${infoA.date} 第${infoA.period+1}節。`:`代 ${infoB.teacher} 的課。`);

        eventsToExport.push({
            subject: (type === 'swap' ? infoB.subject : infoB.subject),
            class: (type === 'swap' ? infoB.class : infoB.class),
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
            const cellDateFormatted = formatDate(weekDates[day], 'YYYY-MM-DD');
            const cellData = teacherSchedule[period]?.[day];
            let content = '';
            let cellClass = 'view-only-cell'; 
            
            const isClickedLesson = cellDate === cellDateFormatted && period === teacherSchedule[period][day]?.period;

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

    let title = `${lesson.subject} (${lesson.class})`;
    let details = `由 ${lesson.teacher} 老師授課`;

    if (lesson.isSubstitutedOut) {
        title = `[代課] ${title}`;
        details = `由 ${lesson.substituteTeacherName} 老師代課`;
    } else if (lesson.isExchangedOut) {
        title = `[換課] ${title}`;
        details = `由 ${lesson.targetTeacher} 老師代課 (您需還課)`;
    } else if (lesson.isSwappedOut) {
        title = `[調課] ${title}`;
        details = `本課調出`;
    }
    
    infoEl.innerHTML = `
        <h3>${title}</h3>
        <p><strong>日期：</strong>${dateStr} (週${dayNames[targetDayOfWeek]})</p>
        <p><strong>時間：</strong>第 ${periodNum} 節 (${periodInfo.start} - ${periodInfo.end})</p>
        <p><strong>細節：</strong>${details}</p>
        <p><strong>地點：</strong>${lesson.location || '無'}</p>
    `;

    notesInput.value = lesson.reason || '';
    dateInput.value = dateStr; 
    
    downloadBtn.onclick = () => {
        generateIcsForLesson({
            ...lesson, 
            periodNum: periodNum
        }, {
            teacherName: lesson.teacher,
            date: dateInput.value, 
            notes: notesInput.value
        });
        modal.style.display = 'none';
    };

    modal.style.display = 'block';
}

function showMultipleEventsModal(events) {
    const modal = document.getElementById('multiple-ics-export-modal');
    const contentDiv = document.getElementById('multiple-ics-event-details');
    const downloadBtn = document.getElementById('multiple-ics-download-btn');
    const closeBtn = modal.querySelector('.close-button');

    if (!modal) return;
    
    contentDiv.innerHTML = ''; 

    events.forEach((event) => {
        const periodInfo = getPeriodTimeInfo(event.period + 1);
        if (!periodInfo) return;
        
        const dateStr = new Date(event.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' });
        const timeStr = `${periodInfo.start} - ${periodInfo.end}`;
        
        let typeLabel = '異動事件';
        let color = '#333';
        if (event.isSwappedOut || event.isExchangedOut) {
            if (event.isSwappedOut)
                typeLabel = '【(調課)原課調出】';
            else
                typeLabel = '【(換課)原課被代】';
            color = 'red';
        } else if (event.isSwappedIn || event.isExchangedIn) {
            if (event.isSwappedIn)
                typeLabel = '【(調課)新課調入】';
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

        const endObj = new Date(event.date);
        endObj.setHours(endH, endM, 0, 0);
        const dtend = toIcsDateTime(endObj);

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
    if (lesson.isSubstitutedOut) {
        summary = `[${lesson.subject}] 由 ${lesson.substituteTeacherName} 代課 (${lesson.class})`;
    } else if (lesson.isExchangedOut) {
        summary = `[${lesson.subject}] 換課: 由 ${lesson.targetTeacher} 代 (${lesson.class})`;
    } else if (lesson.isSwappedOut) {
        summary = `[${lesson.subject}] 調課: 調出 (${lesson.class})`;
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


// ----------------------------------------------------
// 總事件綁定
// ----------------------------------------------------

function bindEventListeners() {
    const modal = document.getElementById('schedule-modal');
    const bodyEl = document.getElementById('modal-body');
    const recentSchedulesBtn = document.getElementById('recent-schedules-btn');
    const recentSchedulesList = document.getElementById('recent-schedules-list');
    
    
    // --- 導航按鈕綁定 ---
    document.getElementById('prev-week-btn').onclick = () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        showSchedule(activeSchedule.name, activeSchedule.type, -1);
    };
    document.getElementById('next-week-btn').onclick = () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        showSchedule(activeSchedule.name, activeSchedule.type, 1);
    };
    document.getElementById('today-btn').onclick = () => {
        currentWeekStart = getMonday(new Date());
        showSchedule(activeSchedule.name, activeSchedule.type, 0); 
    };
    const prevChangeBtn = document.getElementById('prev-change-week-btn');
    const nextChangeBtn = document.getElementById('next-change-week-btn');

    prevChangeBtn.onclick = () => {
        const targetWeek = findNextChangeWeek(-1);
        if (targetWeek) {
            currentWeekStart = targetWeek;
            showSchedule(activeSchedule.name, activeSchedule.type, -1);
        } else {
            alert('沒有找到更早的異動週次了。');
        }
    };

    nextChangeBtn.onclick = () => {
        const targetWeek = findNextChangeWeek(1);
        if (targetWeek) {
            currentWeekStart = targetWeek;
            showSchedule(activeSchedule.name, activeSchedule.type, 1);
        } else {
            alert('沒有找到更晚的異動週次了。');
        }
    };
    
    modal.querySelector('.close-button').onclick = () => {
        modal.style.display = 'none';
    };

    // --- 頁首導航綁定 ---
    recentSchedulesBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        populateRecentList();
        recentSchedulesList.classList.toggle('show');
    });

    window.addEventListener('click', (event) => {
        if (!event.target.matches('#recent-schedules-btn')) {
            if (recentSchedulesList.classList.contains('show')) {
                recentSchedulesList.classList.remove('show');
            }
        }
    });

    // --- Modal 關閉和窗口點擊事件 ---
    document.querySelectorAll('.modal .close-button').forEach(btn => {
        btn.onclick = (e) => {
            const modal = e.target.closest('.modal');
            modal.style.display = 'none';
        };
    });
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
    
    // --- 教師搜尋事件 ---
    document.getElementById('search-teacher').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const container = document.getElementById('teacher-list-by-subject-container'); 
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
    });

    // --- 點擊和長按事件委派 ---
    bodyEl.addEventListener('click', (e) => {
        const cell = e.target.closest('td');
        if (cell && modal.style.display === 'block') {
            if (activeSchedule.type === 'teacher') {
                handleTeacherCellClick(e, activeSchedule.name);
            } else if (activeSchedule.type === 'class') {
                handleClassCellClick(e, activeSchedule.name);
            }
        }
    });

    // 右鍵菜單/長按處理 (老師課表)
    bodyEl.addEventListener('contextmenu', (e) => {
        const cell = e.target.closest('td');
        if (cell && activeSchedule.type === 'teacher' && activeSchedule.name === currentUserDisplayName) {
            handleTeacherCellInteraction(e, activeSchedule.name);
        }
    });

    // 觸控長按模擬 (老師課表)
    bodyEl.addEventListener('touchstart', (e) => {
        const cell = e.target.closest('td');
        if (cell && activeSchedule.type === 'teacher' && activeSchedule.name === currentUserDisplayName) {
            longPressTimer = setTimeout(() => {
                handleTeacherCellInteraction({ type: 'contextmenu', preventDefault: () => {} }, activeSchedule.name);
            }, LONG_PRESS_DURATION);
        }
    }, { passive: true });

    bodyEl.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });

    bodyEl.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    });

    // --- 觸控滑動事件 ---
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; 

    bodyEl.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            touchStartX = event.touches[0].clientX;
            touchEndX = 0;
        }
    }, { passive: true });

    bodyEl.addEventListener('touchmove', (event) => {
        if (event.touches.length > 1) {
            touchStartX = 0;
        }
    }, { passive: true });

    bodyEl.addEventListener('touchend', (event) => {
        if (event.changedTouches.length === 1 && touchStartX !== 0) {
            touchEndX = event.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX;

            if (Math.abs(deltaX) > swipeThreshold && modal.style.display === 'block') {
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

function populateRecentList() {
    const recents = getRecentSchedules();
    const recentSchedulesList = document.getElementById('recent-schedules-list');
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