// ============================================================
// js/homepage.js — Homepage Interactivity
// SCENTÉ · Week 3
// ============================================================

// ── 1. Safety net — always show the page ─────────────────
function revealPage() {
  document.body.classList.add('loaded');
}

window.addEventListener('load', revealPage);
setTimeout(revealPage, 400);

// ── 2. Homepage setup ─────────────────────────────────────
// Navbar/footer are injected globally by cart.js.
document.addEventListener('DOMContentLoaded', () => {
  renderFeaturedProducts();
  syncWishlistHearts();
  setTimeout(restoreAnnouncementBar, 150);
});

// ── 3. Announcement bar ───────────────────────────────────
function restoreAnnouncementBar() {
  if (sessionStorage.getItem('ann_closed') === 'true') {
    const bar = document.getElementById('scente-announcement');
    if (bar) bar.style.display = 'none';
  }
}

// ── 4. Featured products ──────────────────────────────────
function renderFeaturedProducts() {
  const products = JSON.parse(localStorage.getItem('products')) || [];
  if (products.length === 0) return;

  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
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
}

// ── 5. Add to cart ────────────────────────────────────────
function handleAddToCart(index) {
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const product = products[index];

  if (!product) {
    if (typeof showToast === 'function') showToast('Product not found.', 'error');
    return;
  }

  if (product.id === undefined) product.id = index;

  const volume = (product.volumes && product.volumes[0]) || '50ml';
  addToCart(product, volume);
}

function addFallbackToCart(name, brand, price, image) {
  const product = {
    id: `fallback-${name.replace(/\s+/g, '-').toLowerCase()}`,
    name,
    brand,
    price,
    image
  };
  addToCart(product, '50ml');
}

// ── 6. Wishlist toggle ────────────────────────────────────
function toggleWishlistBtn(btn, productId) {
  const id = String(productId);
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
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

  const products = JSON.parse(localStorage.getItem('products')) || [];
  const existing = products.find(p => String(p.id) === id);
  if (existing) {
    const saved = JSON.parse(localStorage.getItem('wishlistProducts')) || {};
    saved[id] = existing;
    localStorage.setItem('wishlistProducts', JSON.stringify(saved));
    return;
  }

  const name = card.querySelector('.product-card__name a')?.textContent?.trim() || 'Unknown';
  const brand = card.querySelector('.product-card__brand')?.textContent?.trim() || '';
  const priceText = card.querySelector('.product-card__price')?.textContent?.trim() || '0';
  const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
  const image = card.querySelector('.product-card__img')?.src || '';

  const saved = JSON.parse(localStorage.getItem('wishlistProducts')) || {};
  saved[id] = { id, name, brand, price, image };
  localStorage.setItem('wishlistProducts', JSON.stringify(saved));
}

function syncWishlistHearts() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  document.querySelectorAll('.product-card__wishlist').forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick') || '';
    const match = onclickAttr.match(/'([^']+)'\)$/);
    if (!match) return;

    const id = match[1];
    if (wishlist.includes(id)) {
      btn.classList.add('wished');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'bi bi-heart-fill';
    }
  });
}

// ── 7. Newsletter ─────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  document.getElementById('newsletter-form').style.display = 'none';
  document.getElementById('newsletter-success').classList.add('show');
}