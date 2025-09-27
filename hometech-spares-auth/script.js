// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/auth';

    // Views
    const loginView = document.getElementById('login-view');
    const forgotPasswordView = document.getElementById('forgot-password-view');
    const verifyOtpView = document.getElementById('verify-otp-view');
    const resetPasswordView = document.getElementById('reset-password-view');

    // Forms
    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const verifyOtpForm = document.getElementById('verify-otp-form');
    const resetPasswordForm = document.getElementById('reset-password-form');

    // Links
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backLinks = document.querySelectorAll('.back-link');

    // Message div
    const messageDiv = document.getElementById('message');

    // Store email and OTP temporarily for the reset flow
    let userEmailForReset = '';
    let userOtp = '';

    // --- View Management ---
    function showView(view) {
        loginView.style.display = 'none';
        forgotPasswordView.style.display = 'none';
        verifyOtpView.style.display = 'none';
        resetPasswordView.style.display = 'none';
        view.style.display = 'block';
    }

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView(forgotPasswordView);
    });

    backLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showView(loginView);
        });
    });

    // --- Message Display ---
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }

    // --- API Call Helper ---
    async function apiCall(endpoint, body) {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            return await response.json();
        } catch (error) {
            return { message: 'Network error. Please try again.' };
        }
    }

    // --- Event Listeners ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const result = await apiCall('login', { email, password });
        
        if (result.message === 'Login successful!') {
            showMessage(result.message, 'success');
            // Redirect to a dashboard or home page in a real app
        } else {
            showMessage(result.message, 'error');
        }
    });

    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        userEmailForReset = email; // Store email
        
        const result = await apiCall('forgot-password', { email });
        showMessage(result.message, result.message.includes('sent') ? 'success' : 'error');
        if (result.message.includes('sent')) {
            showView(verifyOtpView);
        }
    });
    
    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otp').value;
        const result = await apiCall('verify-otp', { email: userEmailForReset, otp });
        
        if (result.message.includes('verified')) {
            userOtp = otp; // Store verified OTP
            showMessage(result.message, 'success');
            showView(resetPasswordView);
        } else {
            showMessage(result.message, 'error');
        }
    });

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const result = await apiCall('reset-password', {
            email: userEmailForReset,
            otp: userOtp,
            newPassword,
        });

        showMessage(result.message, result.message.includes('success') ? 'success' : 'error');
        if (result.message.includes('success')) {
            setTimeout(() => showView(loginView), 2000); // Redirect to login after 2 seconds
        }
    });
});