```markdown
# Phase 1: Core Domain Models & Serialization Layer

## 📌 Overview
Phase 1 establishes the foundational data architecture for the **TradePost** peer-to-peer barter platform. It defines core domain entities (`User`, `TradePost`, `NegotiationOffer`) and implements explicit serialization (`to_dict()`) and deserialization (`from_dict()`) methods for flat-file JSON persistence without external ORMs.

## 📁 Directory Structure
```text
phase1/
├── models/
│   ├── __init__.py
│   ├── offer.py
│   ├── post.py
│   └── user.py
├── output/
│   └── terminal_screenshot.png
├── __init__.py
├── README.md
└── test_serialization.py

```

## 🛠️ Data Models

* **`User`** (`models/user.py`): `user_id` (`int`), `username` (`str`), `password` (`str`)
* **`TradePost`** (`models/post.py`): `post_id` (`int`), `title` (`str`), `description` (`str`), `owner_id` (`int`), `status` (`str`)
* **`NegotiationOffer`** (`models/offer.py`): `offer_id` (`int`), `post_id` (`int`), `proposer_id` (`int`), `offered_post_id` (`int`), `offered_item_details` (`str`), `turn_holder_id` (`int`)

## 🔄 Serialization Mechanics

* **`to_dict()`**: Serializes class instances into Python dictionaries for `json.dump()`.
* **`from_dict(data: dict)`**: Reconstructs typed class instances from raw dictionary payloads parsed via `json.load()`.

## 🧪 Verification & Manual Testing

Execute the standalone test script from the project root:

```bash
python -m phase1.test_serialization

```

Execution results and visual terminal confirmation are stored in `phase1/output/terminal_screenshot.png`.

```

```