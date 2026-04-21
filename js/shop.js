let currentPage = 1;
const itemsPerPage = 6;

// Get products from localStorage
function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

//  Get wishlist 
function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
}

//  Build product card 
function buildCard(product) {
    const wishlist = getWishlist();
    const isWishlisted = wishlist.includes(String(product.id));

    return `
        <div class="product-card">
            <div class="product-card__image-wrap">

               

                <img src="${product.image}" alt="${product.name}">

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

// Render products 
function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    const count = document.getElementById('results-count');

    if (!products.length) {
        grid.innerHTML = "<p>No products found.</p>";
        if (count) count.textContent = "0 results";
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = products.slice(start, start + itemsPerPage);

    grid.innerHTML = paginated.map(buildCard).join('');

    if (count) {
        count.textContent = `${products.length} result${products.length !== 1 ? 's' : ''}`;
    }

    renderPagination(products.length);
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.querySelector('.pagination');

    container.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;

        if (i === currentPage) {
            btn.style.background = 'black';
            btn.style.color = 'white';
        }

       btn.onclick = () => {
    currentPage = i;
    applyFilters(false); //dont reset page
};
        container.appendChild(btn);
    }
}


//  Apply filters + sorting 
function applyFilters(resetPage = true) {
    if (resetPage) currentPage = 1;
    let products = getProducts();

    
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        products = products.filter(p => {
            const searchableText = `${p.name} ${p.brand} ${p.category || ''} ${p.description || ''}`.toLowerCase();
            return searchableText.includes(query);
        });
        
        
    }

    // CATEGORY
    const categories = [...document.querySelectorAll('.sidebar input[type="checkbox"]:checked')]
    .map(cb => cb.value.trim().toLowerCase());

    if (categories.length) {
        products = products.filter(p =>
            categories.includes((p.category || "").trim().toLowerCase())
        );
    }

    // PRICE
    const min = parseFloat(document.getElementById('price-min').value);
    const max = parseFloat(document.getElementById('price-max').value);

    if (!isNaN(min)) products = products.filter(p => p.price >= min);
    if (!isNaN(max)) products = products.filter(p => p.price <= max);

    const genderRadio = document.querySelector('input[name="gender"]:checked');
    if (genderRadio && genderRadio.value !== '') {
        const selectedGender = genderRadio.value.toLowerCase().trim();
        
        products = products.filter(p => {
            if (!p.gender) return false;
            
            const productGender = String(p.gender).toLowerCase().trim();
            
            if (selectedGender === 'men') {
                return productGender === 'men' || productGender === 'male' || productGender === 'man';
            } else if (selectedGender === 'women') {
                return productGender === 'women' || productGender === 'female' || productGender === 'woman';
            } else if (selectedGender === 'unisex') {
                return productGender === 'unisex';
            }
            
            return productGender === selectedGender;
        });
    }

    // SORT
    const sort = document.getElementById('sort-select').value;

    if (sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
    } else if (sort === 'newest') {
        products.sort((a, b) => b.id - a.id);
    }

    renderProducts(products);
}

//  Wishlist toggle 
function toggleWishlist(id, btn) {
    let wishlist = getWishlist();

    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(item => item !== id);
    } else {
        wishlist.push(id);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    applyFilters();
}

//  Add to cart 
function addProductToCart(id) {
    const products = getProducts();
    const product = products.find(p => String(p.id) === id);

    if (!product) return;

    if (typeof addToCart === 'function') {
        addToCart({ ...product, quantity: 1 });
    } else {
        console.warn("cart.js not loaded");
    }
}

// Event listeners 
function attachListeners() {
    document.querySelectorAll('.sidebar input').forEach(input => {
        input.addEventListener('change', applyFilters);
    });

    document.getElementById('price-min').addEventListener('input', applyFilters);
    document.getElementById('price-max').addEventListener('input', applyFilters);
    document.getElementById('sort-select').addEventListener('change', applyFilters);
}


document.addEventListener('DOMContentLoaded', () => {
    attachListeners();
    applyFilters();
});

function toggleSidebar(btn) {
    btn.parentElement.classList.toggle('open');
    btn.textContent = btn.parentElement.classList.contains('open') ? 'Filters –' : 'Filters +';
}

function goToDetails(id) {
    window.location.href = `details.html?id=${id}`;
}