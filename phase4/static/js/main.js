document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // LOGIN LOGIC
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Clear any previous messages
            if (loginMessage) loginMessage.innerHTML = "";
            
            const payload = {
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            };

            try {
                const response = await fetch("/api/accounts/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error("Invalid credentials");

                const data = await response.json();
                saveToken(data.access_token);

                // Show success message temporarily before redirecting
                if (loginMessage) {
                    loginMessage.innerHTML = `<div class="text-success mt-3 mb-0 p-2 text-center">Login successful!</div>`
                }
                setTimeout(() => {
                    window.location.href = "/posts/";
                }, 1500);

            } catch (error) {
                if (loginMessage) {
                    loginMessage.innerHTML = `<div class="text-danger mt-3 mb-0 p-2 text-center">Login failed. Please check your username and password.</div>`;
                }
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

            // Clear any previous messages
            if (registerMessage) registerMessage.innerHTML = "";

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

                if (!response.ok) throw new Error("Registration failed");
                
                if (registerMessage) {
                    registerMessage.innerHTML = `<div class="text-success mt-3 mb-0 p-2 text-center">Registration successful! Redirecting to login...</div>`;
                }
                setTimeout(() => {
                    window.location.href = "/accounts/login";
                }, 1500);
            } catch (error) {
                if (registerMessage) {
                    registerMessage.innerHTML = `<div class="text-danger mt-3 mb-0 p-2 text-center">Could not register. Username might be taken.</div>`;
                }
                console.error(error);
            }
        });
    }
});