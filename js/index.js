// ============================================================
// js/homepage.js — Homepage Interactivity
// SCENTÉ · Week 3
// ============================================================


// ── 1. Safety net — always show the page ─────────────────
// Body starts at opacity:0 in the CSS for a fade-in effect.
// We ALWAYS remove that after 400ms maximum, even if something
// else on the page errors. Nothing should ever cause a blank page.
function revealPage() {
  document.body.classList.add('loaded');
}
window.addEventListener('load', revealPage);
setTimeout(revealPage, 400); // hard fallback — fires no matter what


// ── 2. Load navbar + footer ───────────────────────────────
// Uses relative paths so it works both on Live Server AND
// when opening the file directly from disk.
document.addEventListener('DOMContentLoaded', () => {

  fetch('components/navbar.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('navbar-placeholder').innerHTML = html;
      restoreAnnouncementBar();
      updateCartBadge();
      // updateNavUser is from auth-guard.js — only call if loaded
      if (typeof updateNavUser === 'function') updateNavUser();
    })
    .catch(() => {
      // fetch failed (e.g. opened as file:// without a server)
      // page still works — navbar just won't show
      console.warn('Navbar component could not be loaded.');
    });

  fetch('components/footer.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(() => {
      console.warn('Footer component could not be loaded.');
    });

  // Run the rest of the homepage setup
  renderFeaturedProducts();
  syncWishlistHearts();
});


// ── 3. Announcement bar ───────────────────────────────────
function restoreAnnouncementBar() {
  if (sessionStorage.getItem('ann_closed') === 'true') {
    const bar = document.getElementById('scente-announcement');
    if (bar) bar.style.display = 'none';
  }
}

// Called by the × button in navbar.html
function closeAnn() {
  const bar = document.getElementById('scente-announcement');
  if (bar) bar.style.display = 'none';
  sessionStorage.setItem('ann_closed', 'true');
}

// Called by the search icon in navbar.html
function toggleSearch() {
  const bar = document.getElementById('scente-search-bar');
  if (!bar) return;
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) {
    const input = document.getElementById('scente-search-input');
    if (input) input.focus();
  }
}


// ── 4. Featured products ──────────────────────────────────
// Reads up to 4 products from localStorage.
// If none exist yet (Sara hasn't seeded), the fallback
// hardcoded cards in the HTML stay untouched.
function renderFeaturedProducts() {
  const products = JSON.parse(localStorage.getItem('products')) || [];
  if (products.length === 0) return; // keep fallback cards

  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const featured = products.slice(0, 4);

  grid.innerHTML = ''; // clear fallback cards

  featured.forEach((product, index) => {
    const id     = product.id !== undefined ? product.id : index;
    const wished = wishlist.includes(String(id));
    const isNew  = index === 0;
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

// For dynamically rendered cards (product from localStorage)
function handleAddToCart(index) {
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const product  = products[index];

  if (!product) {
    if (typeof showToast === 'function') showToast('Product not found.', 'error');
    return;
  }

  if (product.id === undefined) product.id = index;

  const volume = (product.volumes && product.volumes[0]) || '50ml';
  addToCart(product, volume); // cart.js handles toast + badge update
}

// For the 4 fallback hardcoded cards
function addFallbackToCart(name, brand, price, image) {
  const product = {
    id:    'fallback-' + name.replace(/\s+/g, '-').toLowerCase(),
    name,
    brand,
    price,
    image
  };
  addToCart(product, '50ml');
}


// ── 6. Wishlist toggle ────────────────────────────────────
function toggleWishlistBtn(btn, productId) {
  const id     = String(productId);
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const icon   = btn.querySelector('i');
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

    // Save full product data so wishlist.html can display it
    // even if localStorage["products"] is empty (fallback cards)
    saveWishlistProduct(id, btn);
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Saves a minimal product object into localStorage["wishlistProducts"]
// keyed by product ID so wishlist.js can always find it.
function saveWishlistProduct(id, btn) {
  const card = btn.closest('.product-card');
  if (!card) return;

  // Try to get full product from localStorage first
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const existing = products.find(p => String(p.id) === id);
  if (existing) {
    // Already in products — no need to duplicate
    const saved = JSON.parse(localStorage.getItem('wishlistProducts')) || {};
    saved[id] = existing;
    localStorage.setItem('wishlistProducts', JSON.stringify(saved));
    return;
  }

  // Fallback card — scrape the data from the DOM
  const name  = card.querySelector('.product-card__name a')?.textContent?.trim() || 'Unknown';
  const brand = card.querySelector('.product-card__brand')?.textContent?.trim() || '';
  const priceText = card.querySelector('.product-card__price')?.textContent?.trim() || '0';
  const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
  const image = card.querySelector('.product-card__img')?.src || '';

  const saved = JSON.parse(localStorage.getItem('wishlistProducts')) || {};
  saved[id] = { id, name, brand, price, image };
  localStorage.setItem('wishlistProducts', JSON.stringify(saved));
}

// Restore heart fill state on fallback cards on page load
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
// ── Search functionality ─────────────────────────────────
function performSearch() {
  const input = document.getElementById('scente-search-input');
  if (!input) return;
  
  const query = input.value.trim();
  if (query.length === 0) return;
  
  // Redirect to shop page with search parameter
  window.location.href = `/pages/shop.html?search=${encodeURIComponent(query)}`;
}

// Make it globally available
window.performSearch = performSearch;

// ── 7. Newsletter ─────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  document.getElementById('newsletter-form').style.display = 'none';
  document.getElementById('newsletter-success').classList.add('show');
}
