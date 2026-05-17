// src/app.js
import { getProfile, saveProfile, getRecordByDate, saveRecord, resetDemoData, flushData, getRecords } from './storage.js';
import { renderCalendar, renderWorkoutList, renderFoodSummary } from './components.js';

let profile = getProfile();
let currentDate = new Date().toISOString().split('T')[0];
let currentRecord = getRecordByDate(currentDate);
let foodSubmitted = false;
let workoutSubmitted = false;

const MOTIVATORS = {
    "Потужний Михайло": [
        "Не зупиняйся, ти машина!",
        "Ще один підхід, і ти ближче до цілі!",
        "Біль сьогодні - сила завтра!",
        "Відпочинок для слабаків... жартую, відновлюйся!",
        "Ти можеш більше, ніж думаєш!"
    ],
    "Спокійна Олена": [
        "Слухай своє тіло, воно знає краще.",
        "Кожен крок - це перемога.",
        "Баланс - це головне. Ти молодець.",
        "Не поспішай, головне регулярність.",
        "Дихай глибоко і продовжуй."
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    bindEvents();
    updateUI();
});

function initUI() {
    // Populate profile form
    document.getElementById('profile-name').value = profile.name;
    document.getElementById('profile-age').value = profile.age;
    document.getElementById('profile-gender').value = profile.gender;
    document.getElementById('profile-weight').value = profile.weight;
    document.getElementById('profile-height').value = profile.height;
    
    // Populate goals form
    document.getElementById('goal-calories').value = profile.calorieGoal;
    document.getElementById('goal-protein').value = profile.proteinGoal;
    document.getElementById('goal-fat').value = profile.fatGoal;
    document.getElementById('goal-carbs').value = profile.carbGoal;
    
    // Populate motivator
    document.getElementById('motivator-select').value = profile.motivator;
}

function bindEvents() {
    // Profile inputs (auto calc BMI - FR2, NFR4)
    const profileInputs = ['profile-weight', 'profile-height'];
    profileInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            updateProfile();
            checkRules();
        });
    });
    
    // Save Profile & Goals
    document.getElementById('save-profile-btn').addEventListener('click', updateProfile);
    document.getElementById('save-goals-btn').addEventListener('click', updateGoals);
    
    // Status Select
    document.getElementById('status-select').addEventListener('change', (e) => {
        currentRecord.status = e.target.value;
        saveRecord(currentRecord);
        updateUI();
        checkRules();
    });
    
    // Motivator Select
    document.getElementById('motivator-select').addEventListener('change', (e) => {
        profile.motivator = e.target.value;
        saveProfile(profile);
        updateUI();
    });
    
    // Workout Form
    document.getElementById('add-workout-btn').addEventListener('click', () => {
        const name = document.getElementById('workout-name').value;
        const sets = parseInt(document.getElementById('workout-sets').value) || 0;
        const reps = parseInt(document.getElementById('workout-reps').value) || 0;
        const weight = parseFloat(document.getElementById('workout-weight').value) || 0;
        
        if (name) {
            currentRecord.workouts.push({ name, sets, reps, weight });
            saveRecord(currentRecord);
            workoutSubmitted = true;
            document.getElementById('workout-name').value = '';
            updateUI();
            checkRules();
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
        foodSubmitted = true;
        
        // clear inputs
        document.getElementById('food-calories').value = '';
        document.getElementById('food-protein').value = '';
        document.getElementById('food-fat').value = '';
        document.getElementById('food-carbs').value = '';
        
        updateUI();
        checkRules();
    });
    
    // Demo data controls
    document.getElementById('reset-demo-btn').addEventListener('click', resetDemoData);
    document.getElementById('flush-data-btn').addEventListener('click', flushData);
}

function updateProfile() {
    profile.name = document.getElementById('profile-name').value;
    profile.age = document.getElementById('profile-age').value;
    profile.gender = document.getElementById('profile-gender').value;
    profile.weight = parseFloat(document.getElementById('profile-weight').value) || 0;
    profile.height = parseFloat(document.getElementById('profile-height').value) || 0;
    saveProfile(profile);
    
    // Calculate BMI
    if (profile.weight > 0 && profile.height > 0) {
        const bmi = (profile.weight / (profile.height * profile.height)).toFixed(1);
        document.getElementById('bmi-display').innerText = `BMI: ${bmi}`;
    } else {
        document.getElementById('bmi-display').innerText = `BMI: -`;
    }
}

function updateGoals() {
    profile.calorieGoal = parseInt(document.getElementById('goal-calories').value) || 0;
    profile.proteinGoal = parseInt(document.getElementById('goal-protein').value) || 0;
    profile.fatGoal = parseInt(document.getElementById('goal-fat').value) || 0;
    profile.carbGoal = parseInt(document.getElementById('goal-carbs').value) || 0;
    saveProfile(profile);
    updateUI();
}

export function selectDate(dateString) {
    currentDate = dateString;
    currentRecord = getRecordByDate(currentDate);
    // Reset submission flags for the new date to require clicking again
    foodSubmitted = false;
    workoutSubmitted = false;
    updateUI();
    checkRules();
}

function updateUI() {
    // Update Date Header
    document.getElementById('current-date-header').innerText = `День: ${currentDate}`;
    
    // Status Select
    document.getElementById('status-select').value = currentRecord.status;
    
    // Render Components
    renderCalendar('calendar-container', currentDate, selectDate);
    renderWorkoutList('workout-list-container', currentRecord.workouts);
    renderFoodSummary('food-summary-container', currentRecord.food, profile);
    
    updateProfile(); // update BMI display
    checkRules();
}

function checkRules() {
    let showDonut = false;
    
    // BR1: BMI > 25
    if (profile.weight > 0 && profile.height > 0) {
        const bmi = (profile.weight / (profile.height * profile.height));
        if (bmi > 25) showDonut = true;
    }
    
    // BR3: Calories limit exceeded
    if (currentRecord.food.calories > profile.calorieGoal) {
        showDonut = true;
    }
    
    // BR2: 14 days rest
    const records = getRecords();
    let consecutiveRestDays = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const r = records[ds];
        if (r && r.status === 'Відпочинок') {
            consecutiveRestDays++;
        } else if (r && (r.status === 'Хвороба/Лікарняний' || r.status === 'Відпустка')) {
            // BR5: Streak freeze
            continue;
        } else {
            break;
        }
    }
    
    if (consecutiveRestDays >= 14) {
        showDonut = true;
    }
    
    // Display Donut
    const easterEggEl = document.getElementById('easter-egg-donut');
    if (showDonut) {
        easterEggEl.classList.remove('hidden');
    } else {
        easterEggEl.classList.add('hidden');
    }
    
    // BR4: Motivator activation
    const motivatorEl = document.getElementById('motivator-message');
    if (workoutSubmitted && foodSubmitted) {
        const phrases = MOTIVATORS[profile.motivator] || MOTIVATORS["Потужний Михайло"];
        // Pick a random phrase
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        motivatorEl.innerText = `${profile.motivator} каже: "${phrase}"`;
        motivatorEl.classList.remove('hidden');
    } else {
        motivatorEl.classList.add('hidden');
    }
}
window.selectDate = selectDate; // Make it available globally for inline onclick
