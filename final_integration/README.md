# Final Integration

This is the fully integrated version of **TradePost**. It wires together every previous phase into a single runnable FastAPI application — this is the folder you actually run.

## What's integrated here

| Phase | What it contributes |
|-------|----------------------|
| Phase 1 | The core data model shapes (`User`, `TradePost`, `NegotiationOffer`) that the JSON store persists |
| Phase 2 | The API routers (`/api/accounts`, `/api/posts`, `/api/offers`) and the JSON-file persistence layer |
| Phase 3 | The business-logic services layered under those routers: JWT auth, ownership validation, turn-taking rules, and auto-decline on trade acceptance |
| Phase 4 | The server-rendered frontend (Jinja2 templates, static CSS/JS) — the marketplace grid, my-posts dashboard, and negotiation status views |

`main.py` in this folder is the single entry point that mounts all of the above into one `FastAPI` app.

## What `main.py` does

- Creates the `FastAPI` app and enables CORS for all origins (local/eval use).
- Includes the three JSON API routers from Phase 2 (`auth_router`, `posts_router`, `offers_router`).
- Includes the HTML page router from Phase 4 (`views_router`), which serves the templates.
- Mounts `/static` to `phase4/static` (CSS/JS) and `/media` to the project-root `media/` folder (uploaded post images).
- Exposes `GET /api/health` as a simple liveness check.

## Running it

From the **project root** (one level above this folder), with dependencies installed:

```bash
uvicorn final_integration.main:app --reload
```

Then visit:

- **http://127.0.0.1:8000/** — the marketplace homepage (Phase 4 UI)
- **http://127.0.0.1:8000/docs** — Swagger UI for all API endpoints
- **http://127.0.0.1:8000/api/health** — health check

> Run the command from the project root, not from inside `final_integration/`, since imports like `phase2.routers.auth` and paths like `phase4/static` are resolved relative to the project root.

## Data & media

- All application data (users, posts, offers) lives in `tradepost_db.json` at the project root and is created automatically on first run.
- Uploaded post images are saved to `media/uploads/` and served back at `/media/uploads/<filename>`.

## Quick smoke test

1. Register: `POST /api/accounts/register` with `{"username": "...", "password": "..."}`
2. Login: `POST /api/accounts/login` → copy `access_token`
3. Create a post: `POST /api/posts/create_post` with header `Authorization: Bearer <access_token>`
4. Browse posts: `GET /api/posts/` (no auth needed)
5. View the same listing in the browser at `/posts/`

If all five steps work, the integration is healthy.