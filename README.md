# NABD Intelligence (نبض)

NABD Intelligence is a social-intelligence analytics platform that tracks trending topics, detects emerging crises, and turns public conversation into actionable reports. The platform monitors news, social media and RSS sources, analyzes the data with AI, and surfaces insights through an interactive dashboard — all in a bilingual (EN / AR) interface.

## What NABD does

- **Trend analysis** — detects rising topics and measures conversation volume over time.
- **Crisis detection** — flags escalating rumor clusters and misinformation early.
- **Public / private analysis** — keeps sensitive work private, shares the rest with the team.
- **Reports & exports** — generates weekly briefs, risk watches and social pulse reports as PDF/CSV.
- **Connections** — integrates Facebook, RSS, Google News, Google Trends, NewsAPI, SerpAPI and Groq as data sources.
- **Notifications** — AI alerts, trend spikes and system updates in one center.
- **Bilingual + theming** — instant English/Arabic switching with dark, light and system themes.

## Architecture

A dependency-free static web app. No build step, no framework — plain HTML, CSS and JavaScript.

```
/
├── index.html            Landing page
├── pages/                Application pages (dashboard, workspace, signin, ...)
├── js/                   Shared JavaScript
│   ├── script.js         Core: i18n, themes, navigation, landing widgets
│   ├── app.js            App shell + page modules (protected routes, auth guard)
│   ├── auth.js           Sign-in / sign-up logic
│   └── workspace.js      Analysis workspace logic
├── css/
│   └── styles.css        Full design system (dark/light, RTL-ready)
└── assets/               Images / icons (currently unused)
```

### Key conventions

- `script.js` must load first on every page — it exposes the `window.NABD` API used by `app.js`, `auth.js` and `workspace.js`.
- All protected app pages (`dashboard`, `history`, `reports`, `profile`, `settings`, `connections`, `api`, `notifications`, `favorites`, `searches`) load `js/app.js`, which redirects unauthenticated visitors to `pages/signin.html`.
- `pages/workspace.html` is a redirect shim that forwards to `pages/dashboard.html?view=analysis`.
- Translations live in `script.js` under `window.NABD.I18N` (EN + AR keys), applied via `data-i18n` attributes.
- Theme (`nabd-theme`) and language (`nabd-lang`) are persisted in `localStorage`.

## How to run locally

The project is fully static — serve the folder with any static file server and open `index.html`.

```bash
# Python
python -m http.server 8000

# Node (npx)
npx serve .
```

Then open `http://localhost:8000`. No environment variables or build tools are required.

> Note: open `index.html` through a local server (not `file://`) so page navigation between `pages/` works normally.

## How the frontend talks to the n8n backend

The analysis flow is wired to a production **n8n** workflow that performs the real data gathering and AI analysis.

- The webhook endpoint is defined once as `NABD_WEBHOOK` in `js/script.js` and is the only outbound request in the app.
- When a user submits an analysis, the frontend `POST`s the query to the n8n webhook and waits for the raw response.
- A normalization layer then maps the raw response into the `NormalizedAnalysis` shape used by the dashboard, workspace and reports.
- The response is persisted in `localStorage` so history and saved searches keep working offline against the last result.

The webhook itself is hosted at `https://n8n.addme.solutions/webhook/trend-analysis`. Do not replace or rename it — the integration depends on that exact endpoint.

## Authentication

Authentication is a frontend demo (localStorage-backed) for the time being. `N.setUser()`/`N.getUser()` in `script.js` power the sign-in/sign-up flow and the protected-route guard. No credentials are stored or transmitted beyond the current page session.
