// ==========================================
// 1. TOKEN MANAGEMENT
// ==========================================
function saveToken(token) {
    localStorage.setItem("access_token", token);
}

function getToken() {
    return localStorage.getItem("access_token");
}

function removeToken() {
    localStorage.removeItem("access_token");
}

function isAuthenticated() {
    return !!getToken();
}

// Reads the user_id out of the JWT payload (the token itself is not
// re-verified here -- that's the server's job. This is only used to
// decide what to SHOW in the UI, e.g. "is this my own post?").
function getUserIdFromToken() {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return parseInt(payload.sub, 10);
    } catch (e) {
        return null;
    }
}

// ==========================================
// 2. API HEADER BUILDER
// ==========================================
function getAuthHeaders(includeContentType = true) {
    const headers = {};
    const token = getToken();

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    if (includeContentType) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

// ==========================================
// 3. SHARED HELPER: pull a numeric ID out of the current URL
// ==========================================
// Works regardless of where the ID sits in the path
// (/posts/5, /offers/9/accept, /offers/delete_offer/9 all resolve correctly),
// unlike "just take the last path segment" which breaks on /offers/9/accept.
function getIdFromPath() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idPart = parts.find((p) => /^\d+$/.test(p));
    return idPart ? parseInt(idPart, 10) : null;
}

// ==========================================
// 4. DYNAMIC NAVBAR UI
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const authNav = document.getElementById("auth-nav");

    if (authNav) {
        if (isAuthenticated()) {
            authNav.innerHTML = `
                <a href="/posts/my_posts" class="btn btn-outline-primary btn-sm">My Listings</a>
                <a href="/offers/my_offers" class="btn btn-outline-secondary btn-sm">My Offers</a>
                <button id="logoutBtn" class="btn btn-danger btn-sm">Logout</button>
            `;

            document.getElementById("logoutBtn").addEventListener("click", (e) => {
                e.preventDefault();
                removeToken();
                window.location.href = "/accounts/logout";
            });
        } else {
            authNav.innerHTML = `
                <a href="/accounts/login" class="btn btn-outline-primary btn-sm">Login</a>
                <a href="/accounts/register" class="btn btn-primary btn-sm">Register</a>
            `;
        }
    }
});