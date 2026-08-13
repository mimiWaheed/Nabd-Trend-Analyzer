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
│   ├── script.js         Core: i18n, themes, navigation, API layer, helpers
│   ├── app.js            App shell + page modules (protected routes, auth guard)
│   ├── auth.js           Sign-in / sign-up logic
│   └── workspace.js      Analysis workspace logic (dead — workspace.html redirects)
├── api/                  Vercel serverless routes
│   ├── config.js         Serves the configurable n8n webhook URL
│   └── meta/             Meta OAuth (start / callback / revoke)
├── css/
│   └── styles.css        Full design system (dark/light, RTL-ready)
├── vercel.json           Vercel deployment config
├── .env.example          Documented environment variables (copy to .env)
└── assets/               Images / icons (currently unused)
```

### Key conventions

- `script.js` must load first on every page — it exposes the `window.NABD` API used by `app.js`, `auth.js` and `workspace.js`.
- All protected app pages (`dashboard`, `history`, `reports`, `profile`, `settings`, `connections`, `api`, `notifications`, `favorites`, `searches`) load `js/app.js`, which redirects unauthenticated visitors to `pages/signin.html`.
- `pages/workspace.html` is a redirect shim that forwards to `pages/dashboard.html?view=analysis`.
- Translations live in `script.js` under `window.NABD.I18N` (EN + AR keys), applied via `data-i18n` attributes.
- Theme (`nabd-theme`) and language (`nabd-lang`) are persisted in `localStorage`.

## How to run locally

The frontend is fully static, but auth and the dashboard APIs are real Vercel
serverless functions under `api/` — they only exist when the site is served by
the Vercel runtime. A plain static server (e.g. `python -m http.server`) serves
the pages but CANNOT handle the `/api/*` POSTs, so sign-in/sign-up fail with a
**501 "Unsupported method ('POST')"** error.

### Full local runtime (recommended) — static files + real `/api/*`

```bash
npm install
npm start        # = npx vercel dev   → http://localhost:3000
```

`vercel dev` starts the actual serverless runtime locally: it serves the static
files AND mounts every `api/` route at `/api/*`, so login, signup and the
dashboard APIs behave exactly as deployed. It needs a Vercel account once:

```bash
npx vercel login
```

### No-login alternative — real handlers, in-memory data

```bash
npm run dev      # = node dev-server.js   → http://localhost:3000
```

`dev-server.js` mounts the real `api/*` handlers and serves the static files
without Vercel credentials. It uses the in-memory store by default
(`NABD_DATA=memory`), so it never touches a real database; verification OTPs are
printed to the terminal. Use `npm start` for the real Postgres backend.

### Static preview only (no auth backend)

```bash
python -m http.server 8000
```

Fine for browsing the UI, but every `/api/*` call returns a 501 because a static
server has no POST endpoint. Open `http://localhost:3000` (Vercel dev) or
`http://localhost:8000` (static preview).

### Environment variables

Copy `.env.example` to `.env` for `vercel dev` / deployments. Required for auth:
`DATABASE_URL` (Postgres). Optional: `AUTH_SECRET` (encrypts Facebook tokens),
SMTP vars (real verification emails — without them the OTP is printed to the
server console), `NABD_WEBHOOK_URL` (analysis), Meta OAuth vars.

## How the frontend talks to the n8n backend

The analysis flow is wired to a production **n8n** workflow that performs the real data gathering and AI analysis.

- The webhook endpoint is defined once as `DEFAULT_WEBHOOK` in `js/script.js`. In a Vercel deployment it can be overridden with the `NABD_WEBHOOK_URL` environment variable, served through `api/config.js`.
- When a user submits an analysis, the frontend `POST`s the query to the n8n webhook and waits for the raw response.
- A normalization layer maps the raw response into the `NormalizedAnalysis` shape used by the dashboard, reports and saved searches.
- Every metric respects the `null`/`undefined` = unavailable vs `0` = real-zero distinction; unavailable values render as "—" and missing sections collapse into compact intentional empty states — the dashboard never shows fake data or huge empty placeholder cards.
- The response is persisted in `localStorage` so history and saved searches keep working offline against the last result.

The webhook is hosted at `https://n8n.addme.solutions/webhook/trend-analysis`. Do not replace or rename it — the integration depends on that exact endpoint. The workflow expects the request body to carry both `query` and `prompt` (the analysis prompt), and returns the result wrapped as `{ "text": "<json string>" }`; the normalization layer unwraps that before mapping. The n8n workflow itself is read-only reference; the frontend only consumes its contract.

## Authentication

Auth is a real serverless backend (`api/auth.js`): bcrypt password hashing,
DB-backed sessions (httpOnly cookie), email-verification OTP, and per-account
login rate limiting. `N.api()` in `script.js` posts to same-origin `/api/*`
routes. Because the handlers only run under the Vercel runtime, auth does NOT
work from a plain static server (you'll get the 501 shown above) — use `npm start`
or `npm run dev`. The protected-route guard in `js/app.js` re-validates the
session against `GET /api/auth?action=me` and bounces unauthenticated visitors.

## Meta (Facebook) private analysis

Private analysis (`scope: "private"`) connects a user's Meta Page and Instagram Business account through a real OAuth flow handled by the Vercel routes under `api/meta/`:

1. `api/meta/index.js` (`?action=start`) builds the Meta authorization dialog URL.
2. `api/meta/callback.js` exchanges the authorization code for a token server-side (the App Secret never leaves the server), resolves the connected Page + Instagram business account, converts the user token into a **page access token** (the new Pages experience requires a page token for `/{pageId}/posts`), and hands the result back to the opener via `postMessage`.
3. `api/meta/index.js` (`?action=revoke`) clears the token on disconnect.

Required environment variables (see `.env.example`): `NABD_WEBHOOK_URL`, `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`. Optional: `META_DEFAULT_PAGE_ID` (page to analyze when the account manages several pages; defaults to the first page Meta returns). The access token is kept only in `sessionStorage` and never in `localStorage`. If Meta variables are missing, the UI shows a clear setup error instead of pretending the account is connected. Public analysis never sends Facebook credentials.

### One-time Meta Developer Console setup

For the OAuth popup to succeed, the Facebook app must be configured:

1. In the [Meta Developer Console](https://developers.facebook.com/apps/), open the app with `META_APP_ID` and add **Facebook Login** as a product.
2. Under **Facebook Login > Settings**, add the exact callback URL (`META_REDIRECT_URI`, e.g. `https://your-project.vercel.app/api/meta/callback`) to **Valid OAuth Redirect URIs**.
3. Confirm the app has the permissions used by `api/meta/start.js`: `pages_show_list`, `pages_read_engagement`, `read_insights`, `business_management`, `instagram_basic`, `instagram_content_publish`.
4. The app must be in **Live** mode (Development mode only works for app admins/testers). Use the app-mode toggle in the console, then submit the required permissions for review if the app is used by other people.
