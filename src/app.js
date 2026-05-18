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

document.addEventListener('DOMContentLoaded', () => {
    checkRedDaysSanction();
    initUI();
    bindEvents();
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
    
    // Workout Form
    document.getElementById('add-workout-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('workout-name');
        if(!nameInput.checkValidity()) {
            alert('Назва вправи може містити лише літери!');
            return;
        }

        const name = nameInput.value;
        const sets = parseInt(document.getElementById('workout-sets').value) || 0;
        const reps = parseInt(document.getElementById('workout-reps').value) || 0;
        const weight = parseFloat(document.getElementById('workout-weight').value) || 0;
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        const notes = document.getElementById('workout-notes').value;

        if (name) {
            currentRecord.workouts.push({ name, sets, reps, weight, difficulty, notes });
            saveRecord(currentRecord);
            
            // clear inputs
            nameInput.value = '';
            document.getElementById('workout-sets').value = '';
            document.getElementById('workout-reps').value = '';
            document.getElementById('workout-weight').value = '';
            document.getElementById('workout-notes').value = '';
            
            updateUI();
        }
    });
    
    // Delete Workout event delegation
    document.getElementById('workout-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-workout-btn')) {
            const index = e.target.getAttribute('data-index');
            currentRecord.workouts.splice(index, 1);
            saveRecord(currentRecord);
            updateUI();
        }
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
    const motivatorEl = document.getElementById('motivator-message');
    const hasWorkout = currentRecord.workouts && currentRecord.workouts.length > 0;
    const hasFood = currentRecord.food.calories > 0;
    const isExempt = currentRecord.status === 'Хвороба' || currentRecord.status === 'Відпустка' || currentRecord.status === 'Відпочинок';
    
    if ((hasWorkout && hasFood) || (isExempt && hasFood)) {
        const phrases = MOTIVATORS[profile.motivator] || MOTIVATORS["Потужний Михайло"];
        // Pick phrase deterministically based on date so it doesn't flip on every render
        const dateHash = currentDate.split('-').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        const phrase = phrases[dateHash % phrases.length];
        motivatorEl.innerText = `${profile.motivator} каже: "${phrase}"`;
        motivatorEl.classList.remove('hidden');
    } else {
        motivatorEl.classList.add('hidden');
    }
}

window.selectDate = selectDate;
