// src/app.js
import { getProfile, saveProfile, getRecordByDate, saveRecord, resetDemoData, flushData, getRecords, saveRecords } from './storage.js';
import { renderCalendar, renderWorkoutList, renderFoodSummary } from './components.js';

let profile = getProfile();
let currentDate = new Date().toISOString().split('T')[0];
let currentRecord = getRecordByDate(currentDate);

const MOTIVATORS = {
    "Потужний Михайло": [
        "Вставай і роби, бо ти машина, ти кіборг, ти моноліт! Ти закрив задачу тому тобі не прийдеться присідати штрафних 100 присідань!",
        "Це база! Ти сьогодні справжній фундамент",
        "Втома - це твоя ілюція, м'язи - реальність. Хороша робота! Я горжусь тобою)",
        "Життя цікаве, і мотивація то є сила, філософія, психологія, саме головне залишайся людьми і кричіть що ви живі!",
        "Ніколи не здавайся...і іди вперед до свої цілі і будь мужиком не слабаком"
    ],
    "Марта Нутріціолог": [
        "Баланс це головне, навіть якщо щось не вдається в тебе все вийде!",
        "Пам'ятай... чисте харчування - чистий розум, здорове тіло!",
        "Сьогодні ти став ближче до своєї мети, прямуй щоб КБЖВ виглядало ідеально!",
        "Пам'ятай: Авокадо - це любов, а от майонез... давай вдамо що його не існує",
        "Такий смішний нік Нічна Котлетка 67 ахкаха, кх кхм вибач відволіклася! Чудово виконана мета!!)"
    ],
    "Денчик Нінзя": [
        "Моя зброя - це дисципліна, я навчу тебе нею користуватися!",
        "Тихо прийшов, потужно відпрацював, справжній нінзя і на коврику і в залі!",
        "Шлях воїна складається з таких днів, як цей!",
        "Твоя концентрація вражає! Швидкість і точність справжнього сінсея!"
    ],
    "Юлія Астролог": [
        "Твій гороскоп на сьогодні: 100% успіху та жодної зайвої калорії. Ти в ідеальному потоці зі Всесвітом!!!",
        "Ретроградний Меркурій тобі не завада, коли є така воля)))",
        "Всесвіт бачить твої старання і посилає тобі заряд бадьорості!",
        "Відчуваю вібрації росту! Твоя аура сяє золотом після такого продуктивного дня. Зірки тобою пишаються.",
        "Твій Марс сьогодні у фазі максимальної сили! Енергія б'є ключем, а м'язи заряджені самим космосом"
    ]
};

let workoutRows = [{ id: 1 }];

function renderWorkoutRows() {
    const container = document.getElementById('workout-rows-container');
    if (!container) return;
    container.innerHTML = '';
    
    workoutRows.forEach((row, i) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'workout-row';
        rowEl.innerHTML = `
            <div class="workout-row-header">
                <span class="workout-row-title">Вправа ${i + 1}</span>
                ${workoutRows.length > 1 ? `<button type="button" class="delete-row-btn" data-row-id="${row.id}">🗑️</button>` : ''}
            </div>
            <div class="form-group">
                <input type="text" class="workout-row-name" placeholder="Назва (тільки літери)" pattern="[A-Za-zА-Яа-яЁёІіЇїЄєҐґ\\s]+" required>
            </div>
            <div class="form-group-row">
                <input type="number" class="workout-row-sets" placeholder="Підходи" min="0">
                <input type="number" class="workout-row-reps" placeholder="Повтори" min="0">
                <input type="number" class="workout-row-weight" placeholder="Вага (кг)" min="0" step="0.5">
            </div>
            
            <div class="form-group">
              <label>Складність (1-3 пончики):</label>
              <div class="difficulty-selector">
                <label><input type="radio" name="difficulty-${row.id}" value="1" checked> 🍩 Легка</label>
                <label><input type="radio" name="difficulty-${row.id}" value="2"> 🍩🍩 Середня</label>
                <label><input type="radio" name="difficulty-${row.id}" value="3"> 🍩🍩🍩 Складна</label>
              </div>
            </div>
            
            <div class="form-group">
              <input type="text" class="workout-row-notes" placeholder="Нотатки (напр. піша прогулянка)">
            </div>
        `;
        container.appendChild(rowEl);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    checkRedDaysSanction();
    initUI();
    bindEvents();
    renderWorkoutRows();
    updateUI();
});

function checkRedDaysSanction() {
    const records = getRecords();
    const dates = Object.keys(records).sort();
    if (dates.length === 0) return; // No records, so they are a new user
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    
    const pastDates = dates.filter(d => d < todayStr);
    if (pastDates.length === 0) return; // No past history
    
    const lastActiveDate = pastDates[pastDates.length - 1];
    const lastRecord = records[lastActiveDate];
    
    // Indefinite freeze?
    if (lastRecord && (lastRecord.status === 'Хвороба' || lastRecord.status === 'Відпустка')) {
        return;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    
    // Missed completely?
    if (lastActiveDate < yStr) {
        triggerSanction();
        return;
    }
    
    // Or yesterday exists but is empty
    const rec = records[yStr];
    if (rec) {
        const hasFood = rec.food && rec.food.calories > 0;
        const hasWorkout = rec.workouts && rec.workouts.length > 0;
        const isExempt = (rec.status === 'Відпочинок' || rec.status === 'Хвороба' || rec.status === 'Відпустка');
        const isManualTraining = (rec.status === 'Тренування');
        
        if (!hasFood && !hasWorkout && !isExempt && !isManualTraining) {
            triggerSanction();
        }
    }
}

function triggerSanction() {
    document.getElementById('sanction-overlay').classList.remove('hidden');
    saveRecords({});
    currentRecord = getRecordByDate(currentDate); 
}

function initUI() {
    document.getElementById('profile-name').value = profile.name || '';
    document.getElementById('profile-lastname').value = profile.lastname || '';
    document.getElementById('profile-age').value = profile.age || '';
    document.getElementById('profile-gender').value = profile.gender || 'Не вказувати';
    document.getElementById('profile-weight').value = profile.weight || '';
    document.getElementById('profile-height').value = profile.height || '';
    
    document.getElementById('goal-calories').value = profile.calorieGoal;
    document.getElementById('goal-protein').value = profile.proteinGoal;
    document.getElementById('goal-fat').value = profile.fatGoal;
    document.getElementById('goal-carbs').value = profile.carbGoal;
    
    document.getElementById('motivator-select').value = profile.motivator || 'Потужний Михайло';
}

function bindEvents() {
    // Modal toggle
    const settingsBtn = document.getElementById('open-settings-btn');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    settingsBtn.onclick = () => modal.setAttribute('open', '');
    closeBtn.onclick = () => modal.removeAttribute('open');
    saveSettingsBtn.onclick = () => {
        updateProfileAndGoals();
        modal.removeAttribute('open');
    };

    // Auto BMI update
    ['profile-weight', 'profile-height'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            updateBMI();
        });
    });

    // Sanction accept
    document.getElementById('accept-sanction-btn').addEventListener('click', () => {
        document.getElementById('sanction-overlay').classList.add('hidden');
        updateUI();
    });

    // Status Select
    document.getElementById('status-select').addEventListener('change', (e) => {
        currentRecord.status = e.target.value;
        saveRecord(currentRecord);
        updateUI();
    });
    
    // Workout Form (Dynamic Multi-rows)
    document.getElementById('add-workout-row-btn').addEventListener('click', () => {
        workoutRows.push({ id: Date.now() });
        renderWorkoutRows();
    });

    // Delete temporary workout row
    document.getElementById('workout-rows-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-row-btn')) {
            const rowId = parseInt(e.target.getAttribute('data-row-id'));
            workoutRows = workoutRows.filter(r => r.id !== rowId);
            renderWorkoutRows();
        }
    });

    // Save All Workouts
    document.getElementById('save-workouts-btn').addEventListener('click', () => {
        const rows = document.querySelectorAll('.workout-row');
        const newWorkouts = [];
        let allValid = true;

        rows.forEach((row) => {
            const nameEl = row.querySelector('.workout-row-name');
            if (!nameEl.checkValidity() || !nameEl.value.trim()) {
                allValid = false;
                nameEl.focus();
            }
            const name = nameEl.value.trim();
            const sets = parseInt(row.querySelector('.workout-row-sets').value) || 0;
            const reps = parseInt(row.querySelector('.workout-row-reps').value) || 0;
            const weight = parseFloat(row.querySelector('.workout-row-weight').value) || 0;
            const id = row.querySelector('.delete-row-btn')?.getAttribute('data-row-id') || 1;
            const difficulty = row.querySelector(`input[name="difficulty-${id}"]:checked`)?.value || '1';
            const notes = row.querySelector('.workout-row-notes').value;

            newWorkouts.push({ name, sets, reps, weight, difficulty, notes });
        });

        if (!allValid) {
            alert('Перевірте правильність заповнення назв вправ (тільки літери)!');
            return;
        }

        currentRecord.workouts = [...currentRecord.workouts, ...newWorkouts];
        saveRecord(currentRecord);

        // Reset dynamic forms to single row
        workoutRows = [{ id: Date.now() }];
        renderWorkoutRows();
        updateUI();
    });
    
    // Delete Workout from saved list event delegation
    document.getElementById('workout-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-workout-btn')) {
            const index = e.target.getAttribute('data-index');
            currentRecord.workouts.splice(index, 1);
            saveRecord(currentRecord);
            updateUI();
        }
    });

    // Close motivator toast
    document.getElementById('close-toast').addEventListener('click', () => {
        document.getElementById('motivator-toast').classList.add('hidden');
    });
    
    // Food Form
    document.getElementById('save-food-btn').addEventListener('click', () => {
        const cal = parseInt(document.getElementById('food-calories').value) || 0;
        const pro = parseInt(document.getElementById('food-protein').value) || 0;
        const fat = parseInt(document.getElementById('food-fat').value) || 0;
        const carb = parseInt(document.getElementById('food-carbs').value) || 0;
        
        currentRecord.food.calories += cal;
        currentRecord.food.protein += pro;
        currentRecord.food.fat += fat;
        currentRecord.food.carbs += carb;
        
        saveRecord(currentRecord);
        
        // clear inputs
        document.getElementById('food-calories').value = '';
        document.getElementById('food-protein').value = '';
        document.getElementById('food-fat').value = '';
        document.getElementById('food-carbs').value = '';
        
        updateUI();
    });
    
    // Demo data controls
    document.getElementById('reset-demo-btn').addEventListener('click', resetDemoData);
    document.getElementById('flush-data-btn').addEventListener('click', flushData);
}

function updateBMI() {
    const w = parseFloat(document.getElementById('profile-weight').value) || 0;
    const h_cm = parseFloat(document.getElementById('profile-height').value) || 0;
    if (w > 0 && h_cm > 0) {
        const h = h_cm / 100;
        const bmi = (w / (h * h)).toFixed(1);
        document.getElementById('bmi-display').innerText = `BMI: ${bmi}`;
        
        // BR1: Easter Egg replacing gear with donut
        const btn = document.getElementById('open-settings-btn');
        if (bmi > 25) {
            btn.innerText = '🍩';
        } else {
            btn.innerText = '⚙️';
        }
    } else {
        document.getElementById('bmi-display').innerText = `BMI: -`;
    }
}

function updateProfileAndGoals() {
    profile.name = document.getElementById('profile-name').value;
    profile.lastname = document.getElementById('profile-lastname').value;
    profile.age = parseInt(document.getElementById('profile-age').value) || '';
    profile.gender = document.getElementById('profile-gender').value;
    profile.weight = parseFloat(document.getElementById('profile-weight').value) || 0;
    profile.height = parseFloat(document.getElementById('profile-height').value) || 0;
    
    profile.calorieGoal = parseInt(document.getElementById('goal-calories').value) || 0;
    profile.proteinGoal = parseInt(document.getElementById('goal-protein').value) || 0;
    profile.fatGoal = parseInt(document.getElementById('goal-fat').value) || 0;
    profile.carbGoal = parseInt(document.getElementById('goal-carbs').value) || 0;
    
    profile.motivator = document.getElementById('motivator-select').value;
    
    saveProfile(profile);
    updateBMI();
    updateUI();
}

export function selectDate(dateString) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateString > todayStr) {
        alert('Ви не можете заповнювати дані на майбутні дні!');
        return;
    }
    currentDate = dateString;
    currentRecord = getRecordByDate(currentDate);
    updateUI();
}

function updateUI() {
    document.getElementById('current-date-header').innerText = `День: ${currentDate}`;
    
    // Check 15 days rest limit (BR.X)
    checkRestLimit();

    // Render Components
    renderCalendar('calendar-container', currentDate, selectDate, profile);
    renderWorkoutList('workout-list-container', currentRecord.workouts);
    renderFoodSummary('food-summary-container', currentRecord.food, profile);
    
    updateBMI(); // Initialize BMI display and icon
    checkMotivator();
}

function checkRestLimit() {
    const records = getRecords();
    let consecutiveRestDays = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const r = records[ds];
        
        if (r && r.status === 'Відпочинок') {
            consecutiveRestDays++;
        } else if (r && (r.status === 'Хвороба' || r.status === 'Відпустка')) {
            // Freeze
            continue;
        } else {
            break;
        }
    }
    
    const statusSelect = document.getElementById('status-select');
    // If 15 days or more, prohibit selecting "Відпочинок"
    if (consecutiveRestDays >= 15) {
        if(statusSelect.querySelector('option[value="Відпочинок"]')) {
            statusSelect.querySelector('option[value="Відпочинок"]').disabled = true;
            if(statusSelect.value === 'Відпочинок') statusSelect.value = '';
        }
    } else {
        if(statusSelect.querySelector('option[value="Відпочинок"]')) {
            statusSelect.querySelector('option[value="Відпочинок"]').disabled = false;
        }
    }
    document.getElementById('status-select').value = currentRecord.status || '';
}

function checkMotivator() {
    const toastEl = document.getElementById('motivator-toast');
    const contentEl = document.getElementById('motivator-message-content');
    if (!toastEl || !contentEl) return;
    
    const hasWorkout = currentRecord.workouts && currentRecord.workouts.length > 0;
    const hasFood = currentRecord.food.calories > 0;
    const isExempt = currentRecord.status === 'Хвороба' || currentRecord.status === 'Відпустка' || currentRecord.status === 'Відпочинок';
    const isManualTraining = currentRecord.status === 'Тренування';
    
    if ((hasWorkout && hasFood) || (isExempt && hasFood) || (isManualTraining && hasFood)) {
        const phrases = MOTIVATORS[profile.motivator] || MOTIVATORS["Потужний Михайло"];
        // Pick phrase deterministically based on date so it doesn't flip on every render
        const dateHash = currentDate.split('-').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        const phrase = phrases[dateHash % phrases.length];
        contentEl.innerText = `${profile.motivator} каже: "${phrase}"`;
        toastEl.classList.remove('hidden');
    } else {
        toastEl.classList.add('hidden');
    }
}

window.selectDate = selectDate;
