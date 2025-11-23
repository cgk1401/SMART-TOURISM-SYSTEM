document.addEventListener("DOMContentLoaded", function() {

    // Login handler
    const loginbtn = document.getElementById("ButtonLogin");

    loginbtn.addEventListener("click", async () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        const msg = document.getElementById("message");
        msg.textContent = "";

        if (!username || !password) {
            msg.style.color = "red";
            msg.textContent = "Username or password missing";
            return;
        }

        try {
            // send request
            const res = await axios.post("/check_login/", { username, password });
            msg.textContent = res.data.message;

            if (res.data.success) {
                msg.style.color = "green";
                setTimeout(() => window.location.href = "/MainScreen/", 1000);
            } else {
                msg.style.color = "red";
            }
        } catch (err) {
            msg.style.color = "red";
            msg.textContent = "Connection error";
        }
    })

// Password toggle handler
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    const eyeClosed = document.querySelector('.eye-closed');
    const eyeOpen = document.querySelector('.eye-open');

    togglePassword.addEventListener('click', () => {
        const showing = passwordInput.type === 'text';
        passwordInput.type = showing ? 'password' : 'text';

        eyeClosed.style.display = showing ? 'block' : 'none';
        eyeOpen.style.display = showing ? 'none' : 'block';
    })
})