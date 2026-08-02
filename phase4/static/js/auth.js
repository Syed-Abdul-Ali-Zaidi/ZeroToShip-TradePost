// ==========================================
// 1. TOKEN & IDENTITY MANAGEMENT
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

function getUserIdFromToken() {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return parseInt(payload.sub, 10);
    } catch (e) {
        console.error("Token decoding error:", e);
        return null;
    }
}

// ==========================================
// 2. API REQUEST HELPERS
// ==========================================
function getAuthHeaders(includeJSONType = true) {
    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    if (includeJSONType) headers["Content-Type"] = "application/json";
    return headers;
}

function getIdFromPath() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idPart = parts.find((p) => /^\d+$/.test(p));
    return idPart ? parseInt(idPart, 10) : null;
}

// ==========================================
// 3. DYNAMIC NAVBAR
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const authNav = document.getElementById("auth-nav");
    if (!authNav) return;

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
});