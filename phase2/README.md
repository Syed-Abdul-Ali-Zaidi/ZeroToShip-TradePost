# Phase 2: FastAPI Backend, Pydantic Schemas & Custom JSON Store

## 📌 Overview
Building on the foundational models of Phase 1, Phase 2 implements a fully functional, RESTful backend API for the **TradePost** platform using FastAPI. This phase introduces strict data validation via Pydantic, secure JWT-based authentication, and a custom flat-file JSON database engine designed to handle state management, turn-based negotiation logic, and cascading deletions without relying on an external ORM.

## 📁 Directory Structure
```text
phase2/
├── database/
│   ├── __init__.py
│   └── json_store.py
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   ├── offers.py
│   └── posts.py
├── schemas/
│   ├── __init__.py
│   ├── offer_schema.py
│   ├── post_schema.py
│   └── user_schema.py
├── __init__.py
└── README.md
🛠️ Core API Routers
Authentication (routers/auth.py): Manages user registration, password hashing (SHA-256), and JWT access token generation for secure endpoint gating.

Trade Posts (routers/posts.py): Handles CRUD operations for trade listings, enforcing ownership rules for editing and deleting, and aggregating inbound offers for post authors.

Offers & Negotiations (routers/offers.py): Drives the core barter engine. Enforces a strict state machine using turn_holder_id to ensure only the current turn-holder can edit or accept an offer, while preventing bait-and-switch tampering.

🗄️ Database & State Management
JSONStore Engine (database/json_store.py): A custom class that reads/writes to tradepost_db.json. It provides standard CRUD methods alongside complex operations.

Cascading Deletions: Automatically sweeps and removes orphaned outbound and inbound offers when a parent TradePost is deleted.

Offer Acceptance Processing: When an offer is accepted, the engine automatically updates the parent post status to "Traded" and marks all competing offers on that post as "Declined".