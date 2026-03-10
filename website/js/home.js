// ============ Home Page ============
document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    loadCategories();
    loadFeaturedProducts();
    loadNewArrivals();
    initDealCountdown();
});

// ============ Hero Slider ============
function initHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    const dotsContainer = document.getElementById('heroDots');

    // Create dots dynamically
    if (dotsContainer && slides.length > 0) {
        dotsContainer.innerHTML = Array.from(slides).map((_, i) =>
            `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></button>`
        ).join('');
    }
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.hero-dot') : [];
    let current = 0;
    let interval;

    function goToSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
    }

    function startAutoplay() {
        interval = setInterval(() => goToSlide(current + 1), 5000);
    }

    function restartAutoplay() {
        clearInterval(interval);
        startAutoplay();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(current - 1); restartAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(current + 1); restartAutoplay(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); restartAutoplay(); }));

    // Touch support
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
    slider.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            goToSlide(diff > 0 ? current + 1 : current - 1);
            restartAutoplay();
        }
    });

    startAutoplay();
}

// ============ Load Categories ============
async function loadCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    try {
        const res = await fetch(`${Config.API_BASE}/products/meta/categories`);
        const data = await res.json();

        if (data.categories && data.categories.length > 0) {
            grid.innerHTML = data.categories.map(cat => `
                <a href="products.html?category=${cat.slug}" class="category-card">
                    <div class="category-icon">
                        <img src="${cat.image_url || 'images/placeholder.jpg'}" alt="${cat.name}">
                    </div>
                    <h3>${cat.name}</h3>
                    <p>${cat.product_count || 0} Products</p>
                </a>
            `).join('');
        }
    } catch {
        // Fallback: keep existing HTML content
    }
}

// ============ Load Featured Products ============
async function loadFeaturedProducts() {
    const grid = document.getElementById('featuredProducts');
    if (!grid) return;

    try {
        const res = await fetch(`${Config.API_BASE}/products?featured=true&limit=8`);
        const data = await res.json();

        if (data.products && data.products.length > 0) {
            grid.innerHTML = data.products.map(p => createProductCard(p)).join('');
        }
    } catch {
        grid.innerHTML = '<p class="text-center">Failed to load products. Please try again later.</p>';
    }
}

// ============ Load New Arrivals ============
async function loadNewArrivals() {
    const grid = document.getElementById('newArrivals');
    if (!grid) return;

    try {
        const res = await fetch(`${Config.API_BASE}/products?sort=newest&limit=8`);
        const data = await res.json();

        if (data.products && data.products.length > 0) {
            grid.innerHTML = data.products.map(p => createProductCard(p)).join('');
        }
    } catch {
        grid.innerHTML = '<p class="text-center">Failed to load products.</p>';
    }
}

// ============ Deal Countdown Timer ============
function initDealCountdown() {
    const timer = document.querySelector('.deal-timer');
    if (!timer) return;

    // Deal ends at midnight tonight
    const dealEnd = new Date();
    dealEnd.setHours(23, 59, 59, 0);

    function update() {
        const now = new Date();
        const diff = dealEnd - now;

        if (diff <= 0) {
            // Reset for next day
            dealEnd.setDate(dealEnd.getDate() + 1);
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        const hoursEl = document.getElementById('dealHours');
        const minsEl = document.getElementById('dealMinutes');
        const secsEl = document.getElementById('dealSeconds');

        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
        if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}
