document.addEventListener("DOMContentLoaded", function(){
    const customizeButton = document.querySelector(".customize-btn");
    const imageButton = document.querySelectorAll(".card");
    const recommendButton = document.querySelectorAll(".route-card");

    if (customizeButton){
            customizeButton.addEventListener("click", () => {
            window.location.href = "/PreferenceScreen/";
        })
    }

    imageButton.forEach(c => {
        c.addEventListener("click", () => {
            const id = Number((c.dataset.id || "").trim());
            if (!id) return;
            window.location.href = `/MainScreen/MapScreen/?near_id=${encodeURIComponent(id)}`;
        })
    });

    recommendButton.forEach(r => {
        r.addEventListener("click", () => {
            const name = r.dataset.name;
            window.location.href = `/MainScreen/RouteScreen/?name=${encodeURIComponent(name)}`;
        })
    });

    const observerOptions = {
        root: null,      // null nghĩa là viewport (màn hình hiển thị)
        rootMargin: '0px',
        threshold: 0.2   // Kích hoạt khi 20% của phần tử xuất hiện trên màn hình
    };

    // --- Hàm xử lý Animation (xuất hiện + biến mất khi rời khung hình) ---
    const animateOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            const cards = entry.target.querySelectorAll('.card, .route-card');

            // Khi phần tử xuất hiện trong khung hình -> chạy animation xuất hiện
            if (entry.isIntersecting) {
                if (!entry.target.classList.contains('in-view')) {
                    entry.target.classList.add('in-view');

                    anime({
                        targets: cards,
                        opacity: [0, 1],
                        translateY: [50, 0],
                        easing: 'easeOutExpo',
                        duration: 1200,
                        delay: anime.stagger(150)
                    });
                }
            } else {
                // Khi phần tử rời khỏi khung hình -> chạy animation biến mất (nguợc lại)
                if (entry.target.classList.contains('in-view')) {
                    anime({
                        targets: cards,
                        opacity: [1, 0],
                        translateY: [0, 50],
                        easing: 'easeInExpo',
                        duration: 800,
                        // Thứ tự biến mất đảo ngược để tạo cảm giác hợp lý
                        delay: anime.stagger(100, { direction: 'reverse' })
                    });

                    entry.target.classList.remove('in-view');
                }
            }
        });
    };

    // --- Khởi tạo Observer ---
    const observer = new IntersectionObserver(animateOnScroll, observerOptions);

    // --- Chọn các vùng chứa (Container) để theo dõi ---
    // Thay vì theo dõi từng card lẻ tẻ, ta theo dõi cái khung bao quanh nó
    // để kích hoạt cả nhóm card cùng lúc cho đẹp.
    const sectionsToWatch = document.querySelectorAll('.destinations__grid, .recommended__list');

    sectionsToWatch.forEach(section => {
        observer.observe(section);
    });
})