document.addEventListener("DOMContentLoaded", function(){
    const registerbtn = document.getElementById("register");

    registerbtn.addEventListener("click", async() => {
        const username = document.getElementById("username").value.trim()
        const password = document.getElementById("passwordInput").value.trim()
        const msg = document.getElementById("message");
        msg.textContent = "";

        if (!username || !password){
            msg.style.color = "red";
            msg.textContent = "Thiếu username hoặc password";
            return;
        }

        try{
            const res = await axios.post("/check_register/", {username, password});
            msg.textContent = res.data.message;

            if (res.data.success){
                msg.style.color = "green";
                setTimeout(() => window.location.href = "/", 1000);
            }else{
                msg.style.color = "red";
            }

        } catch (err){
            msg.style.color = "red";
            msg.textContent = "Lỗi kết nối";
        }
    })
})