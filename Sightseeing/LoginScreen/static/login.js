document.addEventListener("DOMContentLoaded", function(){
    const loginbtn = document.getElementById("ButtonLogin");

    loginbtn.addEventListener("click", async()=> {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const msg = document.getElementById("message");
        msg.textContent = "";

        if (!username || !password){
            msg.style.color = "red";
            msg.textContent = "Thiếu username hoặc password";
            return;
        }

        try{
            // gửi request
            const res = await axios.post("/check_login/", {username, password});
            msg.textContent = res.data.message;

            if (res.data.success){
                msg.style.color = "green";
                // redirect trang, delay thời gian trước khi chuyển
                setTimeout(() => window.location.href = "/MainScreen/", 1000);
            }else{
                msg.style.color = "red";
            }
        } catch(err){
            msg.style.color = "red";
            msg.textContent = "Lỗi kết nối";
        }
    })
})