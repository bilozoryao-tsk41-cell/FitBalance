# 0002 - Client Storage Choice

**Context**
FitBalance requires storing user profile data (weight, height, goals) and daily logs (food, workouts, status). A key constraint is that the app will run on GitHub Pages, meaning there is no secure backend to handle data storage.

**Decision**
We will use the browser's `localStorage` to persist data.

**Options Considered**
- `localStorage` (Chosen: Fits the single-user, modest data requirements of the application)
- `sessionStorage` (Rejected: Data would be lost when the tab is closed, defeating the purpose of a tracker)
- `IndexedDB` (Rejected: Overly complex API for the simple CRUD requirements and small data payload)

**Consequences**
- Data is strictly tied to the user's browser.
- No multi-device sync.
- Data storage logic is simplified to JSON serialization/deserialization.
- Demo data reset function will be straightforward to implement.
