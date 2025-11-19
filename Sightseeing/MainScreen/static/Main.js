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

    // --- Hàm xử lý Animation ---
    const animateOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            // Nếu phần tử đã xuất hiện trong khung hình
            if (entry.isIntersecting) {
                
                // Tìm tất cả các card con bên trong container đó
                // (Logic này giúp chúng ta áp dụng hiệu ứng "stagger" - xuất hiện lần lượt)
                const cards = entry.target.querySelectorAll('.card, .route-card');

                anime({
                    targets: cards,
                    opacity: [0, 1],       // Từ trong suốt -> Hiện rõ
                    translateY: [50, 0],   // Dịch chuyển: Từ dưới (50px) -> Về vị trí gốc (0px)
                    easing: 'easeOutExpo', // Hiệu ứng trồi lên dứt khoát nhưng mượt
                    duration: 1200,        // Thời gian chạy 1.2 giây
                    delay: anime.stagger(150) // Quan trọng: Card sau trễ hơn card trước 150ms
                });

                // Sau khi animate xong thì thôi, không cần theo dõi nữa (đỡ tốn RAM)
                observer.unobserve(entry.target);
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