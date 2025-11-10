document.addEventListener("DOMContentLoaded", function(){
    const homebutton = document.getElementById("ButtonHome");

    homebutton.addEventListener("click", e => {
        e.preventDefault();
        window.location.href = window.location.href;
    })
})