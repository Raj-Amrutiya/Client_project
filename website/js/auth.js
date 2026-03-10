// Authentication Manager
const Auth = {
    TOKEN_KEY: 'shopverse_token',
    USER_KEY: 'shopverse_user',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        CartManager.clearLocal();
        window.location.href = 'index.html';
    },

    async fetchWithAuth(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            this.logout();
            return null;
        }
        return response;
    },

    updateUI() {
        const user = this.getUser();

        // Update auth links vs user links
        const authLinks = document.getElementById('authLinks');
        const userLinks = document.getElementById('userLinks');

        if (authLinks && userLinks) {
            if (user) {
                authLinks.style.display = 'none';
                userLinks.style.display = 'block';
            } else {
                authLinks.style.display = 'block';
                userLinks.style.display = 'none';
            }
        }

        // Also handle user-dropdown pattern
        document.querySelectorAll('.user-dropdown').forEach(dropdown => {
            const loginLink = dropdown.querySelector('.login-link');
            const loggedInMenu = dropdown.querySelector('.logged-in-menu');

            if (loginLink && loggedInMenu) {
                if (user) {
                    loginLink.style.display = 'none';
                    loggedInMenu.style.display = 'block';
                    const nameEl = loggedInMenu.querySelector('.user-name');
                    if (nameEl) nameEl.textContent = `${user.first_name} ${user.last_name}`;
                } else {
                    loginLink.style.display = 'block';
                    loggedInMenu.style.display = 'none';
                }
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Show/hide admin link
        document.querySelectorAll('.admin-link').forEach(el => {
            el.style.display = this.isAdmin() ? 'block' : 'none';
        });
    }
};

// Update auth UI on page load
document.addEventListener('DOMContentLoaded', () => Auth.updateUI());
