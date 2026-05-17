# 0003 - Routing, State, and Data Model

**Context**
The application requires a seamless user experience where profile updates instantly trigger BMI calculation, and daily logs affect the visibility of motivational elements.

**Decision**
The application will be built as a Single Page Application (SPA). Routing will be simple section toggling or a single-view dashboard. 

**Data Model**
- `profile`: `{ name, age, gender, weight, height, calorieGoal, proteinGoal, fatGoal, carbGoal, motivator }`
- `records`: A dictionary keyed by date (`YYYY-MM-DD`). 
  Each record contains: `{ date, status, workouts: [], food: { calories, protein, fat, carbs } }`

**Options Considered**
- SPA with manual DOM updates (Chosen)
- Multi-page application (Rejected: Slower interactions, harder to maintain state between pages without a framework)

**Consequences**
- All UI sections will exist in `index.html` and be shown/hidden or updated dynamically via JavaScript.
- We must handle state changes carefully to ensure the UI remains in sync with `localStorage`.
