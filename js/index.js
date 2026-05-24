// ============================================================
// js/index.js — Homepage Logic
// SCENTÉ · Updated Week 2
//
// Changes from Week 1:
//   • renderFeaturedProducts() now fetches from
//     GET /api/products?pageSize=4 instead of localStorage
//   • Falls back to seeded localStorage products if API unreachable
// ============================================================

// ── 1. Page fade-in ───────────────────────────────────────
function revealPage() {
  document.body.classList.add('loaded');
}

window.addEventListener('load', revealPage);
setTimeout(revealPage, 400);

// ── 2. Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderFeaturedProducts();
  setTimeout(restoreAnnouncementBar, 150);
});

// ── 3. Announcement bar ───────────────────────────────────
function restoreAnnouncementBar() {
  if (sessionStorage.getItem('ann_closed') === 'true') {
    const bar = document.getElementById('scente-announcement');
    if (bar) bar.style.display = 'none';
  }
}

// ── 4. Featured products — API first, localStorage fallback
async function renderFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  let products = [];

  // Try the API first
  try {
    products = await api.get('api/products?pageSize=4&sort=newest');
    // Also seed into localStorage so the rest of the site still works
    // while other pages haven't been migrated to the API yet
    if (products && products.length > 0) {
      const existing = JSON.parse(localStorage.getItem('products') || '[]');
      if (existing.length === 0) {
        localStorage.setItem('products', JSON.stringify(products));
      }
    }
  } catch (_) {
    // API unreachable — fall back to localStorage
    products = JSON.parse(localStorage.getItem('products') || '[]');
  }

  if (!products || products.length === 0) return; // show fallback HTML cards

  // Got real products — replace fallback cards
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const featured = products.slice(0, 4);

  grid.innerHTML = '';

  featured.forEach((product, index) => {
    const id = product.id !== undefined ? product.id : index;
    const wished = wishlist.includes(String(id));
    const isNew = index === 0;
    const isSale = product.salePrice != null;

    const badgeHTML = isNew
      ? '<span class="product-card__badge product-card__badge--new">New</span>'
      : isSale
        ? '<span class="product-card__badge product-card__badge--sale">Sale</span>'
        : '';

    const priceHTML = isSale
      ? `<span class="product-card__price--original">$${Number(product.price).toFixed(2)}</span>
         <span class="product-card__price--sale">$${Number(product.salePrice).toFixed(2)}</span>`
      : `$${Number(product.price).toFixed(2)}`;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card__image-wrap">
        ${badgeHTML}
        <img
          class="product-card__img"
          src="${product.image || 'https://via.placeholder.com/375x500?text=No+Image'}"
          alt="${product.name}"
          onerror="this.src='https://via.placeholder.com/375x500?text=No+Image'"
        >
        <button
          class="product-card__wishlist ${wished ? 'wished' : ''}"
          aria-label="Toggle wishlist"
          onclick="toggleWishlistBtn(this, '${id}')">
          <i class="bi ${wished ? 'bi-heart-fill' : 'bi-heart'}"></i>
        </button>
        <button
          class="product-card__quick-add"
          onclick="handleAddToCart(${index})">Add to Cart</button>
      </div>
      <p class="product-card__brand">${product.brand || ''}</p>
      <h3 class="product-card__name">
        <a href="pages/details.html?id=${id}">${product.name}</a>
      </h3>
      <p class="product-card__price">${priceHTML}</p>
    `;
    grid.appendChild(card);
  });

  // Store the fetched products for quick-add
  window._featuredProducts = featured;
}

// ── 5. Add to cart ────────────────────────────────────────
function handleAddToCart(index) {
  // Use API-fetched products if available, else localStorage
  const products = window._featuredProducts
    || JSON.parse(localStorage.getItem('products') || '[]');
  const product = products[index];

  if (!product) {
    if (typeof showToast === 'function') showToast('Product not found.', 'error');
    return;
  }

  if (product.id === undefined) product.id = index;

  const volume = (product.volumes && product.volumes[0]?.size) || '50ml';
  addToCart(product, volume);
}

function addFallbackToCart(name, brand, price, image) {
  const product = {
    id: `fallback-${name.replace(/\s+/g, '-').toLowerCase()}`,
    name, brand, price, image
  };
  addToCart(product, '50ml');
}

// ── 6. Wishlist toggle ────────────────────────────────────
function toggleWishlistBtn(btn, productId) {
  const id = String(productId);
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const icon = btn.querySelector('i');
  const inList = wishlist.includes(id);

  if (inList) {
    wishlist = wishlist.filter(w => w !== id);
    icon.className = 'bi bi-heart';
    btn.classList.remove('wished');
    if (typeof showToast === 'function') showToast('Removed from wishlist', 'info');
  } else {
    wishlist.push(id);
    icon.className = 'bi bi-heart-fill';
    btn.classList.add('wished');
    if (typeof showToast === 'function') showToast('Added to wishlist', 'info');
    saveWishlistProduct(id, btn);
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function saveWishlistProduct(id, btn) {
  const card = btn.closest('.product-card');
  if (!card) return;

  // Try from API-fetched products first
  const apiProducts = window._featuredProducts || [];
  const fromApi = apiProducts.find(p => String(p.id) === id);
  if (fromApi) {
    const saved = JSON.parse(localStorage.getItem('wishlistProducts') || '{}');
    saved[id] = fromApi;
    localStorage.setItem('wishlistProducts', JSON.stringify(saved));
    return;
  }

  // Fall back to localStorage products
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const existing = products.find(p => String(p.id) === id);
  if (existing) {
    const saved = JSON.parse(localStorage.getItem('wishlistProducts') || '{}');
    saved[id] = existing;
    localStorage.setItem('wishlistProducts', JSON.stringify(saved));
    return;
  }

  // Build minimal product from DOM
  const name = card.querySelector('.product-card__name a')?.textContent?.trim() || 'Unknown';
  const brand = card.querySelector('.product-card__brand')?.textContent?.trim() || '';
  const priceText = card.querySelector('.product-card__price')?.textContent?.trim() || '0';
  const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
  const image = card.querySelector('.product-card__img')?.src || '';

  const saved = JSON.parse(localStorage.getItem('wishlistProducts') || '{}');
  saved[id] = { id, name, brand, price, image };
  localStorage.setItem('wishlistProducts', JSON.stringify(saved));
}

// ── 7. Newsletter ─────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  const form = document.getElementById('newsletter-form');
  if (form) form.style.display = 'none';
  const success = document.getElementById('newsletter-success');
  if (success) success.classList.add('show');
}