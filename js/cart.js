
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
  updateCartBadge();
});