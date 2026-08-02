document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // LOGIN LOGIC
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
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

                alert("Registration successful! Please login.");
                window.location.href = "/accounts/login";
            } catch (error) {
                alert("Could not register. Username might be taken.");
                console.error(error);
            }
        });
    }
});