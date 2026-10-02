# News API

Small Node/Express service that reads digital-marketing RSS feeds and serves separate Indonesian and international article lists to the React frontend.

## Run locally

```bash
npm install
npm run dev
```

The service listens on port `3001` by default. Check `http://localhost:3001/api/health` and `http://localhost:3001/api/news`.

## Structure

- `src/server.js` configures HTTP routes, CORS, and request limits. It runs as a standalone server locally and on Hostinger, and as a Vercel Function in production.
- `src/news.js` owns RSS sources, normalization, topic labels, sorting, cache, and stale fallback.
- `src/news.test.js` covers topic classification, regional grouping, image validation, and RSS normalization.
- `src/server.test.js` covers the CORS origin patterns, the force-refresh decision, and that the CORS middleware actually answers a request.

## Configuration

Copy `.env.example` to `.env` for local development. In production set the same variables in the hosting dashboard instead.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Listening port. Never hardcode this: Hostinger and other platforms assign `PORT` at runtime. |
| `CACHE_TTL_MS` | `0` | In-memory cache lifetime in minutes. `0` re-fetches the feeds on every request, which is what you want while developing. Use `15` in production. |
| `RATE_LIMIT_MAX` | `0` | Requests per minute per IP on `/api/news`. `0` disables the limiter entirely. |
| `TRUST_PROXY_HOPS` | `0` | Number of trusted reverse proxies. Set to `1` behind Vercel or a proxy. |
| `FRONTEND_ORIGINS` | Local development and `https://kreatifest-v1-v16n*.vercel.app` | Optional comma-separated additional frontend origins. The production Vercel domain and its previews are already allowed. Supports `*` as a host-label wildcard. |

### Why `RATE_LIMIT_MAX` must be `0` on Vercel

Without a correct `TRUST_PROXY_HOPS`, every request through Vercel arrives with the same internal IP, so all visitors share one rate-limit bucket. A limit of 30 per minute would return `429` to the entire site. Production Vercel therefore runs with `RATE_LIMIT_MAX=0`; the 15-minute cache already caps how often the RSS feeds are fetched, so the limiter is not what protects the publishers. Hostinger, where the client IP is visible, keeps the limiter on.

## Caching and refresh

The current sources are Search Engine Journal, Social Media Today, and HubSpot Marketing for international coverage, plus Marketing.co.id and DailySocial for Indonesian coverage. Articles are filtered for digital-marketing relevance. Each feed contributes at most 25 items. `/api/news?limit=6` returns up to six recent articles per region (maximum 12 per region), ordered newest first. Because the per-region cut happens after grouping, one region can never crowd out the other. The service warms its cache on start so the first request does not wait on the feeds, retains a successful result for up to six hours when all sources fail, and shares a single in-flight refresh between concurrent requests.

A request re-fetches the feeds when it asks explicitly, with `?refresh=1` or with a `Cache-Control: no-cache` header that is not part of a conditional request. Those responses are sent with `Cache-Control: no-store` so no browser or proxy cache sits in front of them. Any other request is served with `Cache-Control: public, max-age=60` and an `ETag` derived from the refresh timestamp, so a repeat load revalidates with `304` instead of downloading the payload again.

> **`Cache-Control: no-cache` is deliberately ignored on conditional requests.** Browsers and `fetch` automatically attach that header to every request carrying `If-None-Match` or `If-Modified-Since`. Treating it as a force signal would make every page reload bypass the cache, refetch all five RSS feeds, change the `ETag`, and make `304` impossible. The frontend therefore sends that header only in development, and the manual refresh button revalidates against the 15-minute cache in production rather than forcing a refetch.

`GET /api/health` reports `ttlMinutes`, `articleCount`, `lastUpdatedAt`, `lastRefreshAt`, `stale`, `refreshInProgress`, and `rateLimitMax` so you can confirm the cache configuration of a deployed instance. A `lastRefreshAt` of `null` means no refresh has completed yet on this instance.

> **Vercel Hobby cron jobs run at most once per day.** Any expression more frequent than that, such as `*/15 * * * *`, fails the deployment with `Hobby accounts are limited to daily cron jobs`. This service deliberately uses no cron: the TTL is driven by incoming requests instead.

## Deploying to Vercel

Deploy the frontend and backend as two separate Vercel projects from the same GitHub repository. On the New Project page shown in the screenshot, choose **Import single project** for each application; do not import the repository root as a multi-service project. The repository-root `vercel.json` is intentionally absent because each project gets its own Root Directory and Vercel detects its framework there.

**Project A, frontend (static)**

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| API URL | Defaults to `https://backend-v1.vercel.app`; `VITE_NEWS_API_URL` can override it |

`server.proxy` in `vite.config.js` only applies to the Vite dev server. In production the frontend calls the backend by absolute URL. The backend URL is already the frontend's default, so no Vercel environment variable is required unless the backend domain changes.

**Project B, backend (Express)**

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Framework Preset | Express, or "Other" if it is not detected |
| Node.js Version | 22.x |
| Environment | `CACHE_TTL_MS=15`, `RATE_LIMIT_MAX=0`, `TRUST_PROXY_HOPS=1` |

With `backend` as the Root Directory, Vercel detects `src/server.js` as the Express entry point. No custom builds or routes are required. The current frontend production and preview domains are allowed by default. Set `FRONTEND_ORIGINS` only if you add a different frontend domain.

In short: create one Vercel project with Root Directory `backend`, then another with Root Directory `frontend`. Do not set either project's Root Directory to `./`.

## Deploying to Hostinger

**Backend as a Web App**

| hPanel field | Value |
|---|---|
| Application type | express |
| Node.js version | 22 |
| Entry file | `src/server.js` |
| Root directory | `backend` |
| Build script | leave blank |
| Output directory | leave blank |

Environment: `CACHE_TTL_MS=15`, `RATE_LIMIT_MAX=60`, `TRUST_PROXY_HOPS=0`, `FRONTEND_ORIGINS=https://www.domain.tld`.

The code needs no changes for Hostinger. It reads `process.env.PORT`, and Hostinger restarts the process automatically if it crashes. `app.listen()` is skipped only under Vercel, so the server starts normally here.

**Frontend as static files**

```bash
cd frontend
VITE_NEWS_API_URL=https://api.domain.tld npm run build
```

Upload the contents of `frontend/dist/` to `public_html/`.

> `VITE_NEWS_API_URL` is baked in at build time. Moving to a different host, or changing domains, requires a rebuild with the new URL.

**If your plan cannot run Node.js**

Node.js is only available on Hostinger Business, Cloud, and VPS plans. On a cheaper shared plan the backend cannot run there at all. In that case keep the static frontend on Hostinger and move the backend to Railway, Render, or Fly.io. Only `VITE_NEWS_API_URL` and `FRONTEND_ORIGINS` change; no code edits are required.

## Response shape

The API returns article titles, short feed excerpts, source names, dates, topic labels, region keys (`indonesia` or `international`), optional HTTPS image URLs provided by the feed, and original links. It does not fetch full article pages. Confirm each publisher's syndication terms before displaying its excerpts or images on a commercial website.

A process restart clears the cache. On Vercel and on Hostinger, the process is also stopped after a period without traffic, so the first request after an idle period pays the full feed fetch, up to eight seconds. If that becomes noticeable, move the cache to Vercel Blob or Upstash Redis.
