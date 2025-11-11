document.addEventListener("DOMContentLoaded", function(){
    const customizeButton = document.querySelector(".customize-btn");
    const imageButton = document.querySelectorAll(".card");

    if (customizeButton){
            customizeButton.addEventListener("click", () => {
            window.location.href = "/PreferenceScreen/";
        })
    }

    imageButton.forEach(c=> {
        c.addEventListener("click", () => {
            const id = Number((c.dataset.id || "").trim());
            if (!id) return;
            window.location.href = `/MainScreen/MapScreen/?near_id=${encodeURIComponent(id)}`;
        })
    });
})