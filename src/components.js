// src/components.js
import { getRecordByDate, getRecords } from './storage.js';

let viewDate = new Date();

export const renderCalendar = (containerId, selectedDate, onDateSelect, profile) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    
    let html = `
        <div class="calendar-month-header">
            <button id="prev-month-btn">&lt;</button>
            <span>${monthNames[month]} ${year}</span>
            <button id="next-month-btn">&gt;</button>
        </div>
        <div class="calendar-header">
            <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Нд</div>
        </div>
        <div class="calendar-wrapper"></div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('prev-month-btn').onclick = () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        renderCalendar(containerId, selectedDate, onDateSelect, profile);
    };
    document.getElementById('next-month-btn').onclick = () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        renderCalendar(containerId, selectedDate, onDateSelect, profile);
    };
    
    const wrapper = container.querySelector('.calendar-wrapper');
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'calendar-day empty';
        wrapper.appendChild(emptyEl);
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateObj = new Date(year, month, d, 12, 0, 0);
        const dStr = dateObj.toISOString().split('T')[0];
        const record = getRecordByDate(dStr);
        
        const isFuture = dStr > todayStr;
        const dayEl = document.createElement('div');
        dayEl.className = `calendar-day ${dStr === selectedDate ? 'selected' : ''} ${dStr === todayStr ? 'today' : ''} ${isFuture ? 'future' : ''}`;
        
        let colorClass = '';
        let hasFood = record.food.calories > 0;
        let hasWorkout = record.workouts && record.workouts.length > 0;
        
        if (record.status === 'Відпочинок') {
            colorClass = 'status-yellow';
        } else if (record.status === 'Хвороба' || record.status === 'Відпустка') {
            colorClass = 'status-blue';
        } else if (record.status === 'Тренування' || (hasFood && hasWorkout)) {
            colorClass = 'status-green';
        } else if (dStr < todayStr && !hasFood && !hasWorkout && !record.status) {
            colorClass = 'status-red';
        }
        
        if (colorClass) dayEl.classList.add(colorClass);

        let donutHtml = '';
        if (record.food.calories > profile.calorieGoal) {
            donutHtml = '<div class="calendar-donut">🍩</div>';
        }

        let statusIcon = '';
        if (record.status === 'Тренування') statusIcon = '🏋️';
        if (record.status === 'Відпочинок') statusIcon = '🛌';
        if (record.status === 'Хвороба') statusIcon = '🤒';
        if (record.status === 'Відпустка') statusIcon = '🏖️';
        if (hasFood && hasWorkout && !statusIcon) statusIcon = '✅';

        let statsHtml = '';
        if (hasFood || hasWorkout) {
            const kcalText = hasFood ? `${record.food.calories}к` : '';
            let workoutText = '';
            if (hasWorkout) {
                const totalSets = record.workouts.reduce((acc, w) => acc + (parseInt(w.sets) || 0), 0);
                workoutText = `${record.workouts.length}в/${totalSets}п`;
            }
            statsHtml = `
                <div class="day-mini-stats">
                    ${kcalText ? `<span class="stat-kcal">🔥 ${kcalText}</span>` : ''}
                    ${workoutText ? `<span class="stat-workout">💪 ${workoutText}</span>` : ''}
                </div>
            `;
        }

        dayEl.innerHTML = `
            <div class="date-number">${d}</div>
            <div class="day-status-icon">${statusIcon}</div>
            ${donutHtml}
            ${statsHtml}
        `;
        
        dayEl.addEventListener('click', () => onDateSelect(dStr));
        wrapper.appendChild(dayEl);
    }
};

export const renderWorkoutList = (containerId, workouts, isToday) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!workouts || workouts.length === 0) {
        container.innerHTML = '<p class="empty-state">Тренувань ще не додано.</p>';
        return;
    }
    
    workouts.forEach((w, index) => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        let donuts = '🍩'.repeat(parseInt(w.difficulty) || 1);
        
        let editButtonsHtml = '';
        if (isToday) {
            editButtonsHtml = `
                <button class="edit-workout-btn outline-btn" data-index="${index}" style="padding: 0.3rem 0.6rem; font-size: 0.9rem; margin-left: 0.5rem; width: auto;">✏️</button>
                <button class="delete-workout-btn outline-btn danger" data-index="${index}" style="padding: 0.3rem 0.6rem; font-size: 0.9rem; margin-left: 0.5rem; width: auto;">❌</button>
            `;
        }
        
        item.innerHTML = `
            <div style="flex-grow: 1;">
                <div><strong>${w.name}</strong> (${donuts})</div> 
                <span>${w.sets} підходів, ${w.reps} повторень, ${w.weight} кг</span>
                ${w.notes ? `<div class="workout-item-details">Нотатки: ${w.notes}</div>` : ''}
            </div>
            ${editButtonsHtml}
        `;
        container.appendChild(item);
    });
};

export const renderFoodSummary = (containerId, food, profile, isToday) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const calorieClass = food.calories > profile.calorieGoal ? 'over-limit' : '';
    
    let editButtonHtml = '';
    if (isToday) {
        editButtonHtml = `
            <div style="text-align: right; margin-top: 0.5rem;">
                <button id="edit-food-totals-btn" class="outline-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; width: auto;">✏️ Редагувати підсумки</button>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="summary-item ${calorieClass}">
            <label>Калорії:</label>
            <span>${food.calories} / ${profile.calorieGoal}</span>
        </div>
        <div class="summary-item">
            <label>Білки:</label>
            <span>${food.protein} / ${profile.proteinGoal} г</span>
        </div>
        <div class="summary-item">
            <label>Жири:</label>
            <span>${food.fat} / ${profile.fatGoal} г</span>
        </div>
        <div class="summary-item">
            <label>Вуглеводи:</label>
            <span>${food.carbs} / ${profile.carbGoal} г</span>
        </div>
        ${editButtonHtml}
    `;
};
