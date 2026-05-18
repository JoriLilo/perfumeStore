let currentPage = 1;
const itemsPerPage = 6;
let totalPages = 1;

// ── Wishlist helpers ──────────────────────────────────────
function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
}

// ── Build product card ────────────────────────────────────
function buildCard(product) {
    const wishlist = getWishlist();
    const isWishlisted = wishlist.includes(String(product.id));

    return `
        <div class="product-card">
            <div class="product-card__image-wrap">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='/images/placeholder.jpg'">

                <button class="product-card__wishlist" onclick="toggleWishlist('${product.id}', this)">
                    <i class="bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}"></i>
                </button>

                <button class="product-card__quick-add" onclick="addProductToCart('${product.id}')">
                    Add to Cart
                </button>
            </div>

            <p>${product.brand}</p>
            <h3 class="product-title" onclick="goToDetails('${product.id}')">
                ${product.name}
            </h3>
            <p>$${product.price}</p>
        </div>
    `;
}

// ── Render products ───────────────────────────────────────
function renderProducts(products, total) {
    const grid = document.getElementById('products-grid');
    const count = document.getElementById('results-count');

    if (!products || !products.length) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; padding:60px 0; text-align:center;">
                <p style="font-size:14px; color:var(--color-text-secondary);">
                    No products found.
                </p>
            </div>`;
        if (count) count.textContent = '0 results';
        document.querySelector('.pagination').innerHTML = '';
        return;
    }

    grid.innerHTML = products.map(buildCard).join('');

    if (count) {
        count.textContent = `${total} result${total !== 1 ? 's' : ''}`;
    }

    renderPagination();
}

// ── Pagination ────────────────────────────────────────────
function renderPagination() {
    const container = document.querySelector('.pagination');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const window = 2; // pages to show on each side of current
    let start = Math.max(1, currentPage - window);
    let end = Math.min(totalPages, currentPage + window);

    // Always show 3 buttons if possible
    if (end - start < 2) {
        if (start === 1) end = Math.min(totalPages, start + 4);
        else start = Math.max(1, end - 4);
    }

    // Prev button
    const prev = document.createElement('button');
    prev.textContent = '←';
    prev.disabled = currentPage === 1;
    prev.onclick = () => { currentPage--; fetchProducts(); };
    container.appendChild(prev);

    // First page + dots
    if (start > 1) {
        const btn = document.createElement('button');
        btn.textContent = '1';
        btn.onclick = () => { currentPage = 1; fetchProducts(); };
        container.appendChild(btn);
        if (start > 2) {
            const dots = document.createElement('span');
            dots.textContent = '…';
            dots.style.padding = '0 4px';
            container.appendChild(dots);
        }
    }

    // Page buttons
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) {
            btn.style.background = 'black';
            btn.style.color = 'white';
        }
        btn.onclick = () => { currentPage = i; fetchProducts(); };
        container.appendChild(btn);
    }

    // Last page + dots
    if (end < totalPages) {
        if (end < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '…';
            dots.style.padding = '0 4px';
            container.appendChild(dots);
        }
        const btn = document.createElement('button');
        btn.textContent = totalPages;
        btn.onclick = () => { currentPage = totalPages; fetchProducts(); };
        container.appendChild(btn);
    }

    // Next button
    const next = document.createElement('button');
    next.textContent = '→';
    next.disabled = currentPage === totalPages;
    next.onclick = () => { currentPage++; fetchProducts(); };
    container.appendChild(next);
}

// ── Build query string from sidebar state ─────────────────
function buildQueryString() {
    const params = new URLSearchParams();

    // Search from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) params.set('search', searchQuery);

    // Category
    const categories = [...document.querySelectorAll('.sidebar input[type="checkbox"][value="perfume"], .sidebar input[type="checkbox"][value="cologne"]')]
        .filter(cb => cb.checked)
        .map(cb => cb.value.trim());
    if (categories.length === 1) params.set('category', categories[0]);

    // Brand
    const brands = [...document.querySelectorAll('#brand-list input[type="checkbox"]:checked')]
        .map(cb => cb.value.trim());
    if (brands.length === 1) params.set('brand', brands[0]);

    // Price
    const min = document.getElementById('price-min').value;
    const max = document.getElementById('price-max').value;
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);

    // Gender
    const genderRadio = document.querySelector('input[name="gender"]:checked');
    if (genderRadio && genderRadio.value !== '') {
        params.set('gender', genderRadio.value);
    }

    // Sort
    const sort = document.getElementById('sort-select').value;
    if (sort) params.set('sort', sort);

    return params.toString();
}

// ── Update URL without reloading page ────────────────────
function updateURL() {
    const params = new URLSearchParams();

    // Category
    const categories = [...document.querySelectorAll('.sidebar input[type="checkbox"][value="perfume"], .sidebar input[type="checkbox"][value="cologne"]')]
        .filter(cb => cb.checked)
        .map(cb => cb.value.trim());
    if (categories.length === 1) params.set('cat', categories[0]);

    // Brand
    const brands = [...document.querySelectorAll('#brand-list input[type="checkbox"]:checked')]
        .map(cb => cb.value.trim());
    if (brands.length === 1) params.set('brand', brands[0]);

    // Price
    const min = document.getElementById('price-min').value;
    const max = document.getElementById('price-max').value;
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);

    // Gender
    const genderRadio = document.querySelector('input[name="gender"]:checked');
    if (genderRadio && genderRadio.value !== '') {
        params.set('gender', genderRadio.value);
    }

    // Sort
    const sort = document.getElementById('sort-select').value;
    if (sort) params.set('sort', sort);

    // Update URL without reloading
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

// ── Read URL params and pre-select filters on page load ───
function readURLParams() {
    const params = new URLSearchParams(window.location.search);

    // Category
    const cat = params.get('cat');
    if (cat) {
        const cb = document.querySelector(`.sidebar input[type="checkbox"][value="${cat}"]`);
        if (cb) cb.checked = true;
    }

    // Price
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    if (minPrice) document.getElementById('price-min').value = minPrice;
    if (maxPrice) document.getElementById('price-max').value = maxPrice;

    // Gender
    const gender = params.get('gender');
    if (gender) {
        const radio = document.querySelector(`input[name="gender"][value="${gender}"]`);
        if (radio) radio.checked = true;
    }

    // Sort
    const sort = params.get('sort');
    if (sort) document.getElementById('sort-select').value = sort;
}

// ── Load brands from API into sidebar ────────────────────
async function loadBrands() {
    try {
        const brands = await api.get('/brands');
        const container = document.getElementById('brand-list');

        // Check if a brand is already selected from URL
        const params = new URLSearchParams(window.location.search);
        const selectedBrand = params.get('brand');

        container.innerHTML = brands.map(brand => `
            <label>
                <input type="checkbox" value="${brand}" name="brand"
                    ${selectedBrand === brand ? 'checked' : ''}> ${brand}
            </label>
        `).join('');

        // Attach listeners to the new brand checkboxes
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => applyFilters(true));
        });

    } catch (err) {
        console.warn('Could not load brands:', err);
    }
}

// ── Main fetch — all filtering done server-side ───────────
async function fetchProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <p style="grid-column:1/-1; font-size:13px; color:var(--color-text-secondary);">
            Loading…
        </p>`;

    try {
        const queryString = buildQueryString();
        const response = await api.get(`/products?${queryString}`);

        let products, total;

        if (Array.isArray(response)) {
            // Flat array — Sibo hasn't added pagination yet
            total = response.length;
            totalPages = Math.ceil(total / itemsPerPage);
            const start = (currentPage - 1) * itemsPerPage;
            products = response.slice(start, start + itemsPerPage);
        } else {
            // Paginated response { data, totalPages, total }
            products = response.data;
            total = response.total;
            totalPages = response.totalPages;
        }

        updateURL();
        renderProducts(products, total);

    } catch (err) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; padding:60px 0; text-align:center;">
                <p style="font-size:14px; color:var(--color-text-secondary);">
                    Could not load products. Please try again.
                </p>
            </div>`;
    }
}

// ── applyFilters ──────────────────────────────────────────
function applyFilters(resetPage = true) {
    if (resetPage) currentPage = 1;
    fetchProducts();
}

// ── Wishlist toggle ───────────────────────────────────────
function toggleWishlist(id, btn) {
    let wishlist = getWishlist();

    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(item => item !== id);
        btn.querySelector('i').className = 'bi bi-heart';
    } else {
        wishlist.push(id);
        btn.querySelector('i').className = 'bi bi-heart-fill';
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    // When Jasi's wishlist API is ready: POST/DELETE /api/wishlist/{id}
}

// ── Add to cart ───────────────────────────────────────────
async function addProductToCart(id) {
    try {
        const product = await api.get(`/products/${id}`);
        if (typeof addToCart === 'function') {
            addToCart({ ...product, quantity: 1 });
        }
    } catch (err) {
        console.warn('Could not fetch product for cart:', err);
    }
}

// ── Event listeners ───────────────────────────────────────
function attachListeners() {
    document.querySelectorAll('.sidebar input').forEach(input => {
        input.addEventListener('change', () => applyFilters(true));
    });

    document.getElementById('price-min').addEventListener('input', () => applyFilters(true));
    document.getElementById('price-max').addEventListener('input', () => applyFilters(true));
    document.getElementById('sort-select').addEventListener('change', () => applyFilters(true));
}

// ── Sidebar toggle (mobile) ───────────────────────────────
function toggleSidebar(btn) {
    btn.parentElement.classList.toggle('open');
    btn.textContent = btn.parentElement.classList.contains('open') ? 'Filters –' : 'Filters +';
}

// ── Navigate to detail page ───────────────────────────────
function goToDetails(id) {
    window.location.href = `details.html?id=${id}`;
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    readURLParams();    // pre-select filters from URL
    attachListeners();
    loadBrands();       // fetch brands from API and populate sidebar

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        const count = document.getElementById('results-count');
        if (count) count.textContent = `Searching for "${searchQuery}"…`;
    }

    fetchProducts();
});