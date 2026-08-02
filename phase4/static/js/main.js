document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // LOGIN LOGIC
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            try {
                // Your backend's /api/accounts/login expects a plain JSON body
                // (it's not an OAuth2 form-based login).
                const response = await fetch("/api/accounts/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) throw new Error("Invalid credentials");

                const data = await response.json();
                saveToken(data.access_token); // From auth.js
                window.location.href = "/posts/";
            } catch (error) {
                alert("Login failed. Please check your username and password.");
                console.error(error);
            }
        });
    }

    // ==========================================
    // REGISTRATION LOGIC
    // ==========================================
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Note: your backend's UserCreate schema only accepts
            // {username, password} -- there's no email field on the
            // server, so we don't send one (see register.html note too).
            const payload = {
                username: document.getElementById("regUsername").value,
                password: document.getElementById("regPassword").value
            };

            try {
                const response = await fetch("/api/accounts/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.detail || "Registration failed");
                }

                alert("Registration successful! Please login.");
                window.location.href = "/accounts/login";
            } catch (error) {
                alert(error.message || "Could not register. Username might be taken.");
                console.error(error);
            }
        });
    }
});