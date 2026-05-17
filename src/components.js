// src/components.js
import { getRecordByDate, getRecords } from './storage.js';

export const renderCalendar = (containerId, selectedDate, onDateSelect) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const today = new Date();
    
    // Simple 7-day calendar (3 days ago, today, 3 days ahead)
    for (let i = -3; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dateString = date.toISOString().split('T')[0];
        const record = getRecordByDate(dateString);
        
        const dayEl = document.createElement('div');
        dayEl.className = `calendar-day ${dateString === selectedDate ? 'selected' : ''}`;
        
        // Add status indicator if exists
        if (record.status) {
            dayEl.classList.add(`status-${record.status.toLowerCase().replace('/', '-')}`);
            let statusIcon = '';
            if (record.status === 'Виконано') statusIcon = '✅';
            if (record.status === 'Відпочинок') statusIcon = '🛋️';
            if (record.status === 'Хвороба/Лікарняний') statusIcon = '🤒';
            if (record.status === 'Відпустка') statusIcon = '🏖️';
            dayEl.innerHTML = `<div>${date.getDate()}/${date.getMonth() + 1}</div><div class="day-status">${statusIcon}</div>`;
        } else {
             dayEl.innerHTML = `<div>${date.getDate()}/${date.getMonth() + 1}</div><div class="day-status">-</div>`;
        }
        
        dayEl.addEventListener('click', () => onDateSelect(dateString));
        container.appendChild(dayEl);
    }
};

export const renderWorkoutList = (containerId, workouts) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (workouts.length === 0) {
        container.innerHTML = '<p class="empty-state">Тренувань ще не додано.</p>';
        return;
    }
    
    workouts.forEach((w, index) => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.innerHTML = `
            <strong>${w.name}</strong> 
            <span>${w.sets} підходів, ${w.reps} повторень, ${w.weight} кг</span>
        `;
        container.appendChild(item);
    });
};

export const renderFoodSummary = (containerId, food, profile) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const calorieClass = food.calories > profile.calorieGoal ? 'over-limit' : '';
    
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
    `;
};
