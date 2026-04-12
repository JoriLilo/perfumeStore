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
      name:  product.name,
      brand: product.brand,
      price: Number(product.price),
      qty:   1,
      image: product.image || null,
      size:  size
    });
  }

  saveCart(cart);
  showCartToast(product.name + ' added to cart');
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function updateQty(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty += delta;
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

function showCartToast(msg) {
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

  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

function toggleSearch() {
  const bar = document.getElementById('scente-search-bar');
  if (bar) bar.classList.toggle('open');
}

function closeAnn() {
  const ann = document.getElementById('scente-announcement');
  if (ann) ann.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const navbarEl = document.getElementById('navbar-placeholder');
  if (navbarEl) {
    fetch('/components/navbar.html')
      .then(res => res.text())
      .then(html => {
        navbarEl.innerHTML = html;
        updateCartBadge();
      });
  }

  const footerEl = document.getElementById('footer-placeholder');
  if (footerEl) {
    fetch('/components/footer.html')
      .then(res => res.text())
      .then(html => {
        footerEl.innerHTML = html;
      });
  }

  window.addEventListener('scroll', () => {
    const header = document.getElementById('scente-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  });

  updateCartBadge();
});