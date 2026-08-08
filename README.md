# TradePost — A Web-Based Peer-to-Peer Barter Exchange

TradePost is a lightweight, web-based barter board where users list items and negotiate trades with other users without any real money changing hands. It was built as part of the **ZeroToShip Summer Activity 2026**, run by **CIS Community, NEDUET**, and was developed in five incremental phases, each adding a new layer to the system.

## What it does

- Users **register / log in** and receive a session (JWT-based).
- Any user can **create a trade post** for an item they own (title, description, optional image).
- Other users can browse open posts and **submit an offer** (with optional item-for-item counter-proposal).
- Offers use a **turn-taking model**: the `turn_holder_id` flips between the proposer and the post owner each time either side edits the offer.
- **Accepting** an offer marks the post (and the offered post, if it was a two-way trade) as `Traded`, and automatically **auto-declines** every other pending offer on that post.
- Posts and offers can be **edited, withdrawn, or deleted**, with ownership/permission checks enforced server-side.
- A small **HTML/CSS/JS frontend** (Phase 4) provides a marketplace grid, a "my posts" dashboard, and a negotiation status view with turn-based badges.

## Project structure

```
.
├── phase1/               # Data models + JSON serialization (no server)
│   ├── models/
│   │   ├── user.py
│   │   ├── post.py
│   │   └── offer.py
│   └── test_serialization.py
│
├── phase2/                # Headless FastAPI server: auth, sessions, JSON persistence
│   ├── database/json_store.py
│   ├── routers/{auth,posts,offers}.py
│   └── schemas/{user,post,offer}_schema.py
│
├── phase3/                # Business-logic services: ownership checks, turn-taking,
│   └── services/            auto-decline, JWT helpers, response enrichment
│
├── phase4/                 # Static-first frontend (HTML/CSS/JS + Jinja2 view routes)
│   ├── frontend/views.py
│   ├── templates/
│   └── static/{css,js}/
│
├── final_integration/      # The fully wired app — entry point for running the project
│   └── main.py
│
├── media/uploads/          # Uploaded post images (created at runtime)
├── tradepost_db.json       # Flat-file "database" (auto-created on first run)
└── requirements.txt
```

Each `phaseN/README.md` documents what that phase covers on its own; `final_integration/README.md` documents how everything is wired together and how to actually run the app.

## Tech stack

- **Backend:** Python, FastAPI
- **Auth:** JWT bearer tokens (`PyJWT`), password hashing
- **Persistence:** a flat JSON file (`tradepost_db.json`) via a small `JSONStore` class — no external database required
- **Frontend:** server-rendered Jinja2 templates + vanilla HTML/CSS/JS, calling the JSON API from `static/js/*.js`
- **Validation:** Pydantic v2 schemas for every request/response

## Setup & installation

### 1. Prerequisites
- Python 3.10+ installed
- `pip`

### 2. Clone and enter the project
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 3. Create and activate a virtual environment (recommended)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Run the app
The runnable entry point lives in `final_integration/`. From the project root:
```bash
uvicorn final_integration.main:app --reload
```

### 6. Open it
- App / pages: **http://127.0.0.1:8000/**
- Interactive API docs (Swagger): **http://127.0.0.1:8000/docs**
- Health check: **http://127.0.0.1:8000/api/health**

On first run, `tradepost_db.json` is created automatically with empty `users`, `posts`, and `offers` tables — no manual database setup needed.

## Typical flow to try it out

1. `POST /api/accounts/register` — create a user
2. `POST /api/accounts/login` — get a bearer token
3. `POST /api/posts/create_post` — list an item (send the token as `Authorization: Bearer <token>`)
4. Log in as a second user and `POST /api/offers/create_offer` on that post
5. As the post owner, `POST /api/offers/{offer_id}/accept` to close the trade
6. Visit `/posts/` in the browser to see the same data rendered in the UI

## Notes

- This project intentionally avoids a real database in favor of a flat JSON file, to keep the focus on request/response cycles, session handling, and state-transition logic rather than ORM setup.
- CORS is fully open (`allow_origins=["*"]`) since this was built for local/hackathon evaluation, not production deployment.