// ============ Form Validation Utilities ============
const Validator = {
    patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[6-9]\d{9}$/,
        postalCode: /^\d{6}$/,
        name: /^[a-zA-Z\s]{2,50}$/
    },

    isEmail(value) {
        return this.patterns.email.test(value);
    },

    isPhone(value) {
        return this.patterns.phone.test(value.replace(/\s|-/g, ''));
    },

    isPostalCode(value) {
        return this.patterns.postalCode.test(value);
    },

    isRequired(value) {
        return value !== null && value !== undefined && value.toString().trim().length > 0;
    },

    minLength(value, min) {
        return value.length >= min;
    },

    maxLength(value, max) {
        return value.length <= max;
    },

    passwordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

        if (score <= 1) return { score, label: 'Weak', class: 'weak' };
        if (score <= 2) return { score, label: 'Fair', class: 'fair' };
        if (score <= 3) return { score, label: 'Good', class: 'good' };
        return { score, label: 'Strong', class: 'strong' };
    },

    showError(input, message) {
        const group = input.closest('.form-group') || input.parentElement;
        group.classList.add('error');
        group.classList.remove('success');

        let errorEl = group.querySelector('.error-msg');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'error-msg';
            group.appendChild(errorEl);
        }
        errorEl.textContent = message;
    },

    showSuccess(input) {
        const group = input.closest('.form-group') || input.parentElement;
        group.classList.remove('error');
        group.classList.add('success');
        const errorEl = group.querySelector('.error-msg');
        if (errorEl) errorEl.remove();
    },

    clearErrors(form) {
        form.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error', 'success');
            const errorEl = group.querySelector('.error-msg');
            if (errorEl) errorEl.remove();
        });
    },

    validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        const name = input.name;
        const required = input.hasAttribute('required');

        if (required && !this.isRequired(value)) {
            this.showError(input, 'This field is required');
            return false;
        }

        if (value && (type === 'email' || name === 'email')) {
            if (!this.isEmail(value)) {
                this.showError(input, 'Please enter a valid email');
                return false;
            }
        }

        if (value && (name === 'phone' || type === 'tel')) {
            if (!this.isPhone(value)) {
                this.showError(input, 'Please enter a valid 10-digit phone number');
                return false;
            }
        }

        if (value && type === 'password') {
            if (value.length < 8) {
                this.showError(input, 'Password must be at least 8 characters');
                return false;
            }
        }

        if (value && name === 'confirm_password') {
            const passwordField = input.form.querySelector('[name="password"]');
            if (passwordField && value !== passwordField.value) {
                this.showError(input, 'Passwords do not match');
                return false;
            }
        }

        if (value && name === 'postal_code') {
            if (!this.isPostalCode(value)) {
                this.showError(input, 'Please enter a valid 6-digit postal code');
                return false;
            }
        }

        this.showSuccess(input);
        return true;
    },

    validateForm(form) {
        let isValid = true;
        form.querySelectorAll('input, select, textarea').forEach(input => {
            if (!this.validateField(input)) isValid = false;
        });
        return isValid;
    },

    // Attach real-time validation
    attachValidation(form) {
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                if (input.closest('.form-group')?.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }
};