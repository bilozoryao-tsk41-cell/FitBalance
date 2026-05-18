// src/components.js
import { getRecordByDate, getRecords } from './storage.js';

export const renderCalendar = (containerId, selectedDate, onDateSelect, profile) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // 30-day calendar (show past 30 days up to today)
    for (let i = -29; i <= 0; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dateString = date.toISOString().split('T')[0];
        const record = getRecordByDate(dateString);
        
        const dayEl = document.createElement('div');
        dayEl.className = `calendar-day ${dateString === selectedDate ? 'selected' : ''}`;
        
        // Determine status color (FR3)
        let colorClass = '';
        let hasFood = record.food.calories > 0;
        let hasWorkout = record.workouts && record.workouts.length > 0;
        
        if (record.status === 'Відпочинок') {
            colorClass = 'status-yellow';
        } else if (record.status === 'Хвороба' || record.status === 'Відпустка') {
            colorClass = 'status-blue';
        } else if (hasFood && hasWorkout) {
            colorClass = 'status-green'; // Green: food filled AND at least one workout
        } else if (date < today && !hasFood && !hasWorkout && !record.status) {
            // Missed day
            colorClass = 'status-red';
        }
        
        if (colorClass) {
            dayEl.classList.add(colorClass);
        }

        // BR3: Donut for calorie limit
        let donutHtml = '';
        if (record.food.calories > profile.calorieGoal) {
            donutHtml = '<div class="calendar-donut">🍩</div>';
        }

        dayEl.innerHTML = `<div>${date.getDate()}/${date.getMonth() + 1}</div><div class="day-status"></div>${donutHtml}`;
        
        dayEl.addEventListener('click', () => onDateSelect(dateString));
        container.appendChild(dayEl);
    }
};

export const renderWorkoutList = (containerId, workouts) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!workouts || workouts.length === 0) {
        container.innerHTML = '<p class="empty-state">Тренувань ще не додано.</p>';
        return;
    }
    
    workouts.forEach((w) => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        let donuts = '🍩'.repeat(parseInt(w.difficulty) || 1);
        item.innerHTML = `
            <div><strong>${w.name}</strong> (${donuts})</div> 
            <span>${w.sets} підходів, ${w.reps} повторень, ${w.weight} кг</span>
            ${w.notes ? `<div class="workout-item-details">Нотатки: ${w.notes}</div>` : ''}
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
