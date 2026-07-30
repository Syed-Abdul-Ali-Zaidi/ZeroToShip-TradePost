Phase 3: Service Layer Modularization & Domain Rule Validation

## 📌 Overview
Building on Phase 2, Phase 3 extracts core business logic, permissions, and state-machine rules out of the web routers and into isolated, reusable service packages within `phase3/services/`.

## 📁 Directory Structure
```text
phase3/
├── services/
│   ├── auth_service.py       # Password hashing, JWT creation, & user context
│   ├── offer_service.py      # Negotiation turn-holder & status validations
│   └── post_service.py       # Post ownership & self-offer validation
├── output/
├── __init__.py
└── README.md
⚙️ Key Services & Implementations
auth_service.py: Manages secure password hashing and token encoding/decoding.

post_service.py: Enforces post-ownership verification and prevents self-offering.

offer_service.py: Validates turn-based negotiation rules, open/pending statuses, and deletion permissions.