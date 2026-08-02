# Phase 4: Frontend Views, Jinja2 Integration & Client-Side Architecture

## 📌 Overview

Building on previous phases, Phase 4 introduces the user interface layer, serving server-side rendered HTML templates via FastAPI Jinja2 integration and dynamic client-side JavaScript architecture for the marketplace, user listings, and interactive negotiations.

## 📁 Directory Structure

```text
phase4/
├── templates/
│   ├── layout.html                 # Base layout with navbar, theme toggle, and dynamic auth items[cite: 20]
│   ├── posts/
│   │   ├── posts.html              # Main marketplace feed & status filtering[cite: 4, 26]
│   │   ├── my_posts.html           # Personal listings dashboard[cite: 4, 25]
│   │   ├── post_create_form.html   # Form for creating or editing posts[cite: 4]
│   │   ├── post_details.html       # Detailed post view with inbound offers[cite: 4]
│   │   └── post_delete_confirm_form.html # Confirmation view for post deletion[cite: 4]
│   ├── offers/
│   │   ├── offer_create_form.html  # Form to propose or counter-offer a trade[cite: 5, 28]
│   │   ├── my_offers.html          # Dashboard for outbound offers[cite: 5, 13]
│   │   ├── offer_accept_confirm_form.html # Trade acceptance confirmation[cite: 5, 14]
│   │   └── offer_delete_confirm_form.html # Withdrawal/decline confirmation[cite: 5, 16]
│   └── registration/
│       ├── login.html              # User login interface[cite: 6, 18]
│       ├── register.html           # New account registration form[cite: 6, 19]
│       └── logged_out.html         # Session termination confirmation screen[cite: 6, 17]
static/
├── js/
│   ├── auth.js                     # JWT management, decoding, and dynamic navbar control
│   ├── main.js                     # Authentication form handling (Login/Register)
│   ├── posts.js                    # Marketplace feed loading, image uploads, and post management
│   └── offers.js                   # Negotiation workflows, turn badges, counter-offers, and actions[cite: 28]
└── css/
    └── style.css                   # Custom application styles and theme configurations

```

---

## ⚙️ Key Features & Implementations

* **Jinja2 Server-Side Routing (`views.py`):** Integrates FastAPI with templates to deliver dedicated views for marketplace browsing, personal dashboard management, and multi-step trade workflows.


* **Dynamic Client-Side Architecture:** Modular JavaScript files (`auth.js`, `main.js`, `posts.js`, `offers.js`) handle asynchronous communication with the backend API, token-based authorization headers, and real-time DOM updates.


* **Enhanced Negotiation & Access Control:** Implements turn-based badges (`Your Turn` vs. `Waiting for Peer`), inline counter-offer mechanisms (`/offers/edit_offer/{offer_id}`), and context-aware UI rendering (automatically hiding "Propose Offer" buttons on a user's own listings).


* **Responsive Styling & Theme Support:** Leverages Bootstrap 5 and Bootstrap Icons paired with a persistent dark/light mode toggle stored in local storage.