


// ── 1. Page load ─────────────────────────────────────────
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});


// ── 2. Load shared components ─────────────────────────────
fetch('/components/navbar.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('navbar-placeholder').innerHTML = html;
    restoreAnnouncementBar(); // hide bar if user already closed it
    updateCartBadge();        // cart.js — sync badge number
    updateNavUser();          // auth-guard.js — show name if logged in
  });

fetch('/components/footer.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('footer-placeholder').innerHTML = html;
  });


// ── 3. Announcement bar ───────────────────────────────────
// Checks sessionStorage to see if the user already dismissed the bar.
function restoreAnnouncementBar() {
  if (sessionStorage.getItem('ann_closed') === 'true') {
    const bar = document.getElementById('scente-announcement');
    if (bar) bar.style.display = 'none';
  }
}
function closeAnn() {
  const bar = document.getElementById('scente-announcement');
  if (bar) bar.style.display = 'none';
  sessionStorage.setItem('ann_closed', 'true');
}

function toggleSearch() {
  const bar = document.getElementById('scente-search-bar');
  if (!bar) return;
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) {
    document.getElementById('scente-search-input')?.focus();
  }
}


// ── 4. Featured products ──────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderFeaturedProducts();
  syncWishlistHearts();
});

function renderFeaturedProducts() {
  const products = JSON.parse(localStorage.getItem('products')) || [];
  if (products.length === 0) return;

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
          src="${product.image || ' https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.62615.2x.avif'}"
          alt="${product.name}"
          onerror="this.src=' https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.62615.2x.avif'"
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
        <a href="/pages/details.html?id=${id}">${product.name}</a>
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
    showToast('Product not found.', 'error');
    return;
  }

  if (product.id === undefined) product.id = index;

  const volume = (product.volumes && product.volumes[0]) || '50ml';
  addToCart(product, volume); // cart.js handles toast + badge
}

// For fallback hardcoded cards (no localStorage products yet)
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
// Toggles a product ID in localStorage wishlist key.
// Updates the heart icon in place without a page reload.
function toggleWishlistBtn(btn, productId) {
  const id     = String(productId);
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const icon   = btn.querySelector('i');
  const inList = wishlist.includes(id);

  if (inList) {
    wishlist = wishlist.filter(w => w !== id);
    icon.className = 'bi bi-heart';
    btn.classList.remove('wished');
    showToast('Removed from wishlist', 'info');
  } else {
    wishlist.push(id);
    icon.className = 'bi bi-heart-fill';
    btn.classList.add('wished');
    showToast('Added to wishlist', 'info');
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Restore heart state on fallback cards on page load
function syncWishlistHearts() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  document.querySelectorAll('.product-card__wishlist').forEach(btn => {
    const onclick = btn.getAttribute('onclick') || '';
    const match   = onclick.match(/'([^']+)'\)$/);
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
// Hides the form and shows a success message on submit.
function handleNewsletter(e) {
  e.preventDefault();
  document.getElementById('newsletter-form').style.display = 'none';
  document.getElementById('newsletter-success').classList.add('show');
}