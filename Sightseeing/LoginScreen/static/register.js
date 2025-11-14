document.addEventListener("DOMContentLoaded", function() {
// Reg handler
    const registerbtn = document.getElementById("registerButton");
    
    registerbtn.addEventListener("click", async () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        const confirmPass = document.getElementById("confirmPasswordInput").value.trim();

        const msg = document.getElementById("message");
        msg.textContent = "";

        if (!username || !password) {
            msg.style.color = "red";
            msg.textContent = "Username or password missing";
            return;
        }

        if (confirmPass !== password) {
            msg.style.color = "red";
            msg.textContent = "Password do not match";
            return;
        }

        try {
            const res = await axios.post("/check_register/", { username, password });
            msg.textContent = res.data.message;

            if (res.data.success) {
                msg.style.color = "green";
                setTimeout(() => window.location.href = "/", 1000);
            } else {
                msg.style.color = "red";
            }

        } catch (err) {
            msg.style.color = "red";
            msg.textContent = "Connection error";
        }
    });

// Password toggle handler
    const togglePasswordFields = [
        { toggleId: 'togglePassword', inputId: 'passwordInput' },
        { toggleId: 'toggleConfirmPassword', inputId: 'confirmPasswordInput' }
    ];

    togglePasswordFields.forEach(item => {
        const toggle = document.getElementById(item.toggleId);
        const input = document.getElementById(item.inputId);
        const eyeClosed = toggle.querySelector('.eye-closed');
        const eyeOpen = toggle.querySelector('.eye-open');

        toggle.addEventListener('click', () => {
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            eyeClosed.style.display = showing ? 'block' : 'none';
            eyeOpen.style.display = showing ? 'none' : 'block';
        });
    });
});