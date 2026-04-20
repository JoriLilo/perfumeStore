const CART_KEY = 'scente_cart';
const FREE_SHIPPING_AT = 50;
const SHIPPING_COST = 5.99;

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function addToCart(product, size = null) {
  const cart = getCart();

  const existing = cart.find(item =>
    item.name === product.name &&
    item.brand === product.brand &&
    item.size === size
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      name: product.name,
      brand: product.brand,
      price: Number(product.price),
      qty: 1,
      image: product.image || null,
      size
    });
  }

  saveCart(cart);
  showCartToast(`${product.name} added to cart`);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function updateQty(index, addedQty) {
  const cart = getCart();
  if (!cart[index]) return;

  cart[index].qty += addedQty;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart(cart);
}

function getSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getShipping() {
  const subtotal = getSubtotal();
  return subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_COST;
}

function getTotal(discountRate = 0) {
  const subtotal = getSubtotal();
  return subtotal - (subtotal * discountRate) + getShipping();
}

function getItemCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const count = getItemCount();
  document.querySelectorAll('#cart-count, .scente-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function showCartToast(message) {
  if (typeof showToast === 'function') {
    showToast(message, 'success');
    return;
  }

  let toast = document.getElementById('scente-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'scente-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999;
      background: var(--color-text-primary);
      color: var(--color-white);
      padding: 11px 28px;
      font-family: var(--font-body);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0;
      transition: opacity 250ms ease;
      pointer-events: none;
      white-space: nowrap;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2200);
}

function toggleSearch() {
  const bar = document.getElementById('scente-search-bar');
  if (!bar) return;

  bar.classList.toggle('open');
  if (bar.classList.contains('open')) {
    const input = document.getElementById('scente-search-input');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }
}

function closeAnn() {
  const ann = document.getElementById('scente-announcement');
  if (ann) ann.style.display = 'none';
  sessionStorage.setItem('ann_closed', 'true');
}

function performSearch() {
  const input = document.getElementById('scente-search-input');
  if (!input) return;

  const query = input.value.trim();
  if (query.length === 0) return;

  const products = JSON.parse(localStorage.getItem('products')) || [];
  const searchResults = products.filter(product => {
    const searchableText = `${product.name} ${product.brand} ${product.category || ''} ${product.description || ''}`.toLowerCase();
    return searchableText.includes(query.toLowerCase());
  });

  sessionStorage.setItem('searchQuery', query);
  sessionStorage.setItem('searchResults', JSON.stringify(searchResults.map(p => p.id)));
  window.location.href = `/pages/shop.html?search=${encodeURIComponent(query)}`;
}

function updateNavbarSession() {
  const session = JSON.parse(sessionStorage.getItem('session'));
  const isLoggedIn = session && session.loggedIn;

  const profileLink = document.getElementById('profile-link');
  if (profileLink) {
    if (isLoggedIn) {
      profileLink.href = '/pages/profile.html';
      profileLink.innerHTML = '<i class="bi bi-person-check"></i>';
      profileLink.setAttribute('title', session.name || 'My Profile');
    } else {
      profileLink.href = '/pages/login.html';
      profileLink.innerHTML = '<i class="bi bi-person"></i>';
      profileLink.setAttribute('title', 'Sign In');
    }
  }

  const mobAccountLink = document.getElementById('mob-account-link');
  if (mobAccountLink) {
    if (isLoggedIn) {
      mobAccountLink.href = '/pages/profile.html';
      mobAccountLink.innerHTML = '<i class="bi bi-person-check"></i> My Profile';
    } else {
      mobAccountLink.href = '/pages/login.html';
      mobAccountLink.innerHTML = '<i class="bi bi-person"></i> Sign In';
    }
  }
}

function restoreAnnouncementBar() {
  if (sessionStorage.getItem('ann_closed') === 'true') {
    const bar = document.getElementById('scente-announcement');
    if (bar) bar.style.display = 'none';
  }
}

function loadLayoutComponent(primaryId, fallbackId, componentPath, afterLoad) {
  const host = document.getElementById(primaryId) || document.getElementById(fallbackId);
  if (!host) return;

  fetch(componentPath)
    .then(res => res.text())
    .then(html => {
      host.innerHTML = html;
      if (typeof afterLoad === 'function') afterLoad();
    });
}

document.addEventListener('DOMContentLoaded', () => {
  loadLayoutComponent('navbar-placeholder', 'navbar', '/components/navbar.html', () => {
    restoreAnnouncementBar();
    updateCartBadge();
    updateNavbarSession();
  });

  loadLayoutComponent('footer-placeholder', 'footer', '/components/footer.html');

  window.addEventListener('scroll', () => {
    const header = document.getElementById('scente-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  });

  updateCartBadge();
  setTimeout(updateNavbarSession, 100);
});

window.performSearch = performSearch;