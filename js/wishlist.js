


document.addEventListener("DOMContentLoaded", () => {
  renderWishlist();
  updateCartBadge(); // from cart.js
});


// ── renderWishlist ────────────────────────────────────────
// Main function — reads wishlist IDs + products from localStorage,
// then builds and injects the cards into #wishlist-grid.
// If wishlist is empty, shows the empty state instead.

function renderWishlist() {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const products = JSON.parse(localStorage.getItem("products")) || [];

  const grid      = document.getElementById("wishlist-grid");
  const emptyState = document.getElementById("wishlist-empty");
  const countEl   = document.getElementById("wishlist-count");

  if (!grid) return;

  // Update item count label e.g. "3 items"
  if (countEl) {
    countEl.textContent = `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"}`;
  }

  // Empty state
  if (wishlist.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  // Build a card for each wishlisted product ID
  grid.innerHTML = "";

  wishlist.forEach(id => {
    // Find the matching product — compare as strings to be safe
    const product = products.find(p => String(p.id) === String(id));

    if (!product) return; // product was deleted from admin — skip silently

    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.productId = id;

    // Default volume — use first in volumes array, or "50ml"
    const defaultVolume = (product.volumes && product.volumes[0]) || "50ml";

    card.innerHTML = `
      <div class="product-card__image-wrap">
        <img
          class="product-card__img"
          src="${product.image || 'https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.9828.2x.avif'}"
          alt="${product.name}"
          onerror="this.src='https://via.placeholder.com/375x500?text=No+Image'"
        >
        <button
          class="product-card__wishlist active"
          aria-label="Remove from wishlist"
          onclick="removeFromWishlist('${id}', this)"
        >
          <i class="bi bi-heart-fill" style="color: var(--color-accent);"></i>
        </button>
        <button
          class="product-card__quick-add"
          onclick="handleAddToCart('${id}')"
        >Add to Cart</button>
      </div>

      <p class="product-card__brand">${product.brand || ""}</p>
      <h3 class="product-card__name">
        <a href="details.html?id=${id}">${product.name}</a>
      </h3>
      <p class="product-card__price">$${Number(product.price).toFixed(2)}</p>

      <div class="wishlist-card-actions">
        <button
          class="btn btn--primary btn--full btn--sm"
          onclick="handleAddToCart('${id}')"
        >Add to Cart</button>
        <button
          class="btn btn--secondary btn--full btn--sm"
          onclick="removeFromWishlist('${id}', this)"
        >Remove</button>
      </div>
    `;

    grid.appendChild(card);
  });
}


// ── handleAddToCart ───────────────────────────────────────
// Finds the product by ID and calls addToCart() from cart.js.

function handleAddToCart(productId) {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const product  = products.find(p => String(p.id) === String(productId));

  if (!product) {
    showToast("Product no longer available.", "error");
    return;
  }

  const volume = (product.volumes && product.volumes[0]) || "50ml";
  addToCart(product, volume); // cart.js handles toast + badge update
}


// ── removeFromWishlist ────────────────────────────────────
// Removes a product ID from the wishlist in localStorage,
// then removes its card from the DOM without a full re-render.
//
// @param {string} productId  — the ID to remove
// @param {Element} triggerEl — the button that was clicked (used to find the card)

function removeFromWishlist(productId, triggerEl) {
  // Update localStorage
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  wishlist = wishlist.filter(id => String(id) !== String(productId));
  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  // Remove the card from the DOM
  const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  if (card) {
    // Fade out then remove
    card.style.transition = "opacity 0.3s ease";
    card.style.opacity = "0";
    setTimeout(() => {
      card.remove();
      // After removing, check if wishlist is now empty
      checkIfEmpty();
    }, 300);
  }

  showToast("Removed from wishlist", "info");

  // Update count label
  const countEl = document.getElementById("wishlist-count");
  if (countEl) {
    countEl.textContent = `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"}`;
  }
}


// ── checkIfEmpty ──────────────────────────────────────────
// Shows the empty state message if no cards remain in the grid.

function checkIfEmpty() {
  const grid       = document.getElementById("wishlist-grid");
  const emptyState = document.getElementById("wishlist-empty");
  const countEl    = document.getElementById("wishlist-count");

  if (!grid || !emptyState) return;

  const remaining = grid.querySelectorAll(".product-card").length;

  if (remaining === 0) {
    emptyState.style.display = "block";
    if (countEl) countEl.textContent = "0 items";
  }
}