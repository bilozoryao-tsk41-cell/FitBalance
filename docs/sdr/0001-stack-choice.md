# 0001 - Stack Choice

**Context**
The FitBalance application needs to be developed and deployed to GitHub Pages. It has simple interactive requirements (calculating BMI, logging workouts and food, changing UI based on conditions).

**Decision**
We will use plain HTML, CSS, and vanilla JavaScript without a build step (no Vite, no React).

**Options Considered**
- Plain HTML/CSS/JS (Chosen)
- Vite + Vanilla JS (Rejected: Unnecessary build step overhead for simple requirements)
- React (Rejected: Requirements are straightforward DOM manipulation, React would be over-engineering for a static GitHub Pages app of this scale)

**Consequences**
- No build step required for deployment.
- Can be directly served from the repository root via GitHub Pages.
- DOM manipulation logic will need to be written manually.
