<<<<<<< HEAD

// ── Internal helper: read cart from localStorage ──────────
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}


// ── Internal helper: write cart to localStorage ───────────
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge(); // keep badge in sync whenever cart changes
}


// ── addToCart ─────────────────────────────────────────────
// Adds a product to the cart, or increments qty if it already exists.

function addToCart(product, selectedVolume = "50ml", qty = 1) {
  if (!product || !product.id === undefined) {
    console.error("addToCart: invalid product object", product);
    return;
  }

  const cart = getCart();

  // Check if this exact product + volume combo already exists
  const existingIndex = cart.findIndex(
    item => String(item.id) === String(product.id) && item.volume === selectedVolume
  );

  if (existingIndex !== -1) {
    // Already in cart — just bump the quantity
    cart[existingIndex].qty += qty;
  } else {
    // New entry
    cart.push({
      id:     product.id,
      name:   product.name    || "Unnamed Product",
      brand:  product.brand   || "",
      price:  Number(product.price) || 0,
      image:  product.image   || "",
      volume: selectedVolume,
      qty:    qty
    });
  }

  saveCart(cart);
  showToast(`${product.name} added to cart`);
}


// ── removeFromCart ────────────────────────────────────────
// Removes a specific product + volume from the cart entirely.

function removeFromCart(productId, volume) {
  let cart = getCart();
  cart = cart.filter(
    item => !(String(item.id) === String(productId) && item.volume === volume)
  );
  saveCart(cart);
}


// ── updateCartItemQty ─────────────────────────────────────
// Changes the qty of a specific cart item. Removes it if qty drops to 0.

function updateCartItemQty(productId, volume, newQty) {
  let cart = getCart();

  if (newQty <= 0) {
    // Remove the item entirely
    removeFromCart(productId, volume);
    return;
  }

  const item = cart.find(
    i => String(i.id) === String(productId) && i.volume === volume
  );

  if (item) {
    item.qty = newQty;
    saveCart(cart);
  }
}


// ── clearCart ─────────────────────────────────────────────
// Wipes the entire cart. Call this after a successful checkout.


function clearCart() {
  localStorage.removeItem("cart");
  updateCartBadge();
}


// ── getCartCount ──────────────────────────────────────────
// Returns the TOTAL number of items (summing all quantities).
// Use this for the badge number.

function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
}


// ── updateCartBadge ───────────────────────────────────────
// Updates every element with id="cart-count" on the current page.
// Called automatically by addToCart / removeFromCart / clearCart.
// You can also call it manually on page load.

function updateCartBadge() {
  const count = getCartCount();
  const badges = document.querySelectorAll("#cart-count");
  badges.forEach(badge => {
    badge.textContent = count;
    // Hide badge when cart is empty, show when not
    badge.style.display = count > 0 ? "flex" : "none";
  });
}


// ── Auto-run on every page load ───────────────────────────
// As soon as this file is loaded, sync the badge with current cart state.
document.addEventListener("DOMContentLoaded", () => {
=======
const CART_KEY = 'scente_cart';
const FREE_SHIPPING_AT = 50;
const SHIPPING_COST = 5.99;
 
// ── Storage ───────────────────────────────────────────────
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
 
// ── Add to cart ───────────────────────────────────────────
// Call this from any page: addToCart(product)
// product comes from localStorage "products" (admin.js format)
function addToCart(product, size = null) {
  const cart = getCart();
 
  // Check if same product + size already in cart
  const existing = cart.find(item =>
    item.name === product.name &&
    item.brand === product.brand &&
    item.size === size
  );
 
  if (existing) {
    // Already in cart — just bump quantity
    existing.qty += 1;
  } else {
    // New item — map admin product format to cart format
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
 
// ── Remove item ───────────────────────────────────────────
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}
 
// ── Update quantity ───────────────────────────────────────
function updateQty(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart(cart);
}
 
// ── Totals ────────────────────────────────────────────────
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
 
// ── Cart badge (navbar) ───────────────────────────────────
function updateCartBadge() {
  const count = getItemCount();
  document.querySelectorAll('#cart-count, .scente-badge').forEach(el => {
    el.textContent = count;
  });
}
 
// ── Toast notification ────────────────────────────────────
function showCartToast(msg) {
  let toast = document.getElementById('scente-toast');
 
  // Create toast element if it doesn't exist on the page
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
 
// ── Navbar helpers (shared across all pages) ──────────────
function toggleSearch() {
  const bar = document.getElementById('scente-search-bar');
  if (bar) bar.classList.toggle('open');
}
 
function closeAnn() {
  const ann = document.getElementById('scente-announcement');
  if (ann) ann.style.display = 'none';
}
 
// ── Auto-init on every page ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Load navbar
  const navbarEl = document.getElementById('navbar-placeholder');
  if (navbarEl) {
    fetch('/components/navbar.html')
      .then(res => res.text())
      .then(html => {
        navbarEl.innerHTML = html;
        updateCartBadge();
      });
  }
 
  // Load footer
  const footerEl = document.getElementById('footer-placeholder');
  if (footerEl) {
    fetch('/components/footer.html')
      .then(res => res.text())
      .then(html => {
        footerEl.innerHTML = html;
      });
  }
 
  // Navbar scroll shadow
  window.addEventListener('scroll', () => {
    const header = document.getElementById('scente-header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  });
 
  // Keep badge updated
>>>>>>> e57a9c7 (added cart functionality and matched styles)
  updateCartBadge();
});