// src/storage.js

const STORAGE_KEY_PROFILE = 'fitbalance_profile';
const STORAGE_KEY_RECORDS = 'fitbalance_records';

export const getProfile = () => {
    const data = localStorage.getItem(STORAGE_KEY_PROFILE);
    return data ? JSON.parse(data) : {
        name: '',
        age: '',
        gender: '',
        weight: '',
        height: '',
        calorieGoal: 2000,
        proteinGoal: 100,
        fatGoal: 60,
        carbGoal: 250,
        motivator: 'Потужний Михайло'
    };
};

export const saveProfile = (profileData) => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profileData));
};

export const getRecords = () => {
    const data = localStorage.getItem(STORAGE_KEY_RECORDS);
    return data ? JSON.parse(data) : {};
};

export const saveRecords = (records) => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
};

export const getRecordByDate = (dateString) => {
    const records = getRecords();
    return records[dateString] || { date: dateString, status: '', workouts: [], food: { calories: 0, protein: 0, fat: 0, carbs: 0 } };
};

export const saveRecord = (record) => {
    const records = getRecords();
    records[record.date] = record;
    saveRecords(records);
};

export const resetDemoData = async () => {
    try {
        const response = await fetch('./data/demo-data.json');
        if (response.ok) {
            const demoData = await response.json();
            saveProfile(demoData.profile);
            saveRecords(demoData.records);
            window.location.reload();
        } else {
            console.error('Failed to load demo data.');
        }
    } catch (e) {
        console.error('Error fetching demo data', e);
    }
};

export const flushData = () => {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    window.location.reload();
}
