// ============ Products Listing Page ============
document.addEventListener('DOMContentLoaded', () => {
    initProductsPage();
});

async function initProductsPage() {
    const params = new URLSearchParams(window.location.search);
    const state = {
        category: params.get('category') || '',
        search: params.get('search') || '',
        minPrice: params.get('min_price') || '',
        maxPrice: params.get('max_price') || '',
        brand: params.get('brand') || '',
        rating: params.get('rating') || '',
        sort: params.get('sort') || 'default',
        page: parseInt(params.get('page')) || 1,
        view: 'grid'
    };

    // Load categories and brands for filters
    loadFilterOptions();

    // Set initial values from URL
    const searchInput = document.querySelector('.search-filter input');
    if (searchInput && state.search) searchInput.value = state.search;

    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) sortSelect.value = state.sort;

    // Load products
    await loadProducts(state);

    // Event listeners
    setupFilterListeners(state);
}

async function loadFilterOptions() {
    try {
        const [catRes, brandRes] = await Promise.all([
            fetch(`${Config.API_BASE}/products/meta/categories`),
            fetch(`${Config.API_BASE}/products/meta/brands`)
        ]);
        const catData = await catRes.json();
        const brandData = await brandRes.json();

        const catList = document.querySelector('.category-filter-list');
        if (catList && catData.categories) {
            catList.innerHTML = `<label class="filter-option"><input type="radio" name="category" value=""> All Categories</label>` +
                catData.categories.map(c => `
                    <label class="filter-option">
                        <input type="radio" name="category" value="${c.slug}"> ${c.name}
                        <span class="count">(${c.product_count || 0})</span>
                    </label>
                `).join('');
        }

        const brandList = document.querySelector('.brand-filter-list');
        if (brandList && brandData.brands) {
            brandList.innerHTML = brandData.brands.map(b => `
                <label class="filter-option">
                    <input type="checkbox" name="brand" value="${b}"> ${b}
                </label>
            `).join('');
        }
    } catch { /* ignore */ }
}

async function loadProducts(state) {
    const grid = document.querySelector('.products-grid');
    const paginationEl = document.querySelector('.pagination');
    const resultsCount = document.querySelector('.results-count');

    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        const params = new URLSearchParams();
        if (state.category) params.set('category', state.category);
        if (state.search) params.set('search', state.search);
        if (state.minPrice) params.set('min_price', state.minPrice);
        if (state.maxPrice) params.set('max_price', state.maxPrice);
        if (state.brand) params.set('brand', state.brand);
        if (state.rating) params.set('rating', state.rating);
        if (state.sort !== 'default') params.set('sort', state.sort);
        params.set('page', state.page);
        params.set('limit', Config.ITEMS_PER_PAGE);

        const res = await fetch(`${Config.API_BASE}/products?${params}`);
        const data = await res.json();

        if (data.products && data.products.length > 0) {
            grid.className = `products-grid ${state.view}-view`;
            grid.innerHTML = data.products.map(p => createProductCard(p)).join('');

            if (resultsCount) {
                resultsCount.textContent = `Showing ${(state.page - 1) * Config.ITEMS_PER_PAGE + 1}-${Math.min(state.page * Config.ITEMS_PER_PAGE, data.pagination.total)} of ${data.pagination.total} products`;
            }

            if (paginationEl) {
                renderPagination(paginationEl, data.pagination, state);
            }
        } else {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
            if (paginationEl) paginationEl.innerHTML = '';
            if (resultsCount) resultsCount.textContent = '0 products found';
        }
    } catch {
        grid.innerHTML = '<p class="text-center">Failed to load products. Please try again later.</p>';
    }
}

function renderPagination(container, pagination, state) {
    const { page, pages } = pagination;
    if (pages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    if (page > 1) html += `<button class="page-btn" data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>`;

    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);

    if (start > 1) { html += `<button class="page-btn" data-page="1">1</button>`; if (start > 2) html += `<span class="page-dots">...</span>`; }

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (end < pages) { if (end < pages - 1) html += `<span class="page-dots">...</span>`; html += `<button class="page-btn" data-page="${pages}">${pages}</button>`; }
    if (page < pages) html += `<button class="page-btn" data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;

    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.page = parseInt(btn.dataset.page);
            loadProducts(state);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function setupFilterListeners(state) {
    // Sort
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            state.sort = sortSelect.value;
            state.page = 1;
            loadProducts(state);
        });
    }

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.view = btn.dataset.view;
            const grid = document.querySelector('.products-grid');
            if (grid) grid.className = `products-grid ${state.view}-view`;
        });
    });

    // Category filter
    document.addEventListener('change', (e) => {
        if (e.target.name === 'category') {
            state.category = e.target.value;
            state.page = 1;
            loadProducts(state);
        }
    });

    // Price filter
    const priceApplyBtn = document.querySelector('.price-apply');
    if (priceApplyBtn) {
        priceApplyBtn.addEventListener('click', () => {
            const min = document.querySelector('.price-min');
            const max = document.querySelector('.price-max');
            state.minPrice = min ? min.value : '';
            state.maxPrice = max ? max.value : '';
            state.page = 1;
            loadProducts(state);
        });
    }

    // Rating filter
    document.querySelectorAll('.rating-filter input').forEach(input => {
        input.addEventListener('change', () => {
            state.rating = input.value;
            state.page = 1;
            loadProducts(state);
        });
    });

    // Clear filters
    const clearBtn = document.querySelector('.clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            state.category = '';
            state.brand = '';
            state.minPrice = '';
            state.maxPrice = '';
            state.rating = '';
            state.search = '';
            state.sort = 'default';
            state.page = 1;
            document.querySelectorAll('.filter-option input').forEach(i => { i.checked = false; });
            const sortSel = document.querySelector('.sort-select');
            if (sortSel) sortSel.value = 'default';
            loadProducts(state);
        });
    }

    // Mobile filter toggle
    const filterToggle = document.querySelector('.filter-toggle');
    const sidebar = document.querySelector('.products-sidebar');
    if (filterToggle && sidebar) {
        filterToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}
