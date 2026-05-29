// ============================================================
// js/wishlist.js — Wishlist Page Interactivity
// SCENTÉ · Week 3
//
// Depends on:  js/cart.js   js/toast.js   (load them first)
//
// Add to pages/wishlist.html before </body>:
//   <script src="../js/cart.js"></script>
//   <script src="../js/toast.js"></script>
//   <script src="../js/wishlist.js"></script>
//
// What this file does:
//   1. Reads wishlist (array of product IDs) from localStorage "wishlist"
//   2. Looks up each ID in localStorage "products" to get full product data
//   3. Renders product cards into the wishlist grid
//   4. "Add to Cart" button on each card calls addToCart() from cart.js
//   5. "Remove" button removes the item from the wishlist
//   6. Shows an empty state message when the wishlist is empty
//   7. Keeps the cart badge in the navbar up to date
// ============================================================
const API_BASE = "http://localhost:5123/api";

document.addEventListener("DOMContentLoaded", async () => {
  await renderWishlist();
  updateCartBadge();
});


// ── renderWishlist ────────────────────────────────────────
// Main function — reads wishlist IDs + products from localStorage,
// then builds and injects the cards into #wishlist-grid.
// If wishlist is empty, shows the empty state instead.

async function renderWishlist() {

const session = JSON.parse(sessionStorage.getItem("session") || "null");
const token = session?.token || null;

  if (!token) {
  window.location.href = '/pages/login.html';
  return;
  }

  const response = await fetch(`${API_BASE}/wishlist`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error("Failed to fetch wishlist");
    return;
  }

  const wishlist = await response.json();

  const grid = document.getElementById("wishlist-grid");
  const emptyState = document.getElementById("wishlist-empty");
  const countEl = document.getElementById("wishlist-count");

  if (!grid) return;

  if (countEl) {
    countEl.textContent =
      `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"}`;
  }

  if (wishlist.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  grid.innerHTML = "";

  wishlist.forEach(product => {

    const card = document.createElement("div");

    card.className = "product-card";

    card.dataset.productId = product.id;

    card.innerHTML = `
      <div class="product-card__image-wrap">

        <img
          class="product-card__img"
          src="${product.image}"
          alt="${product.name}"
        >

        <button
          class="product-card__wishlist active"
          onclick="removeFromWishlist('${product.id}')"
        >
          <i class="bi bi-heart-fill"></i>
        </button>

        <button
          class="product-card__quick-add"
          onclick="handleAddToCart('${product.id}')"
        >
          Add to Cart
        </button>

      </div>

      <p class="product-card__brand">${product.brand}</p>

      <h3 class="product-card__name">
        <a href="details.html?id=${product.id}">
          ${product.name}
        </a>
      </h3>

      <p class="product-card__price">
        $${Number(product.price).toFixed(2)}
      </p>

      <div class="wishlist-card-actions">

        <button
          class="btn btn--primary btn--full btn--sm"
          onclick="handleAddToCart('${product.id}')"
        >
          Add to Cart
        </button>

        <button
          class="btn btn--secondary btn--full btn--sm"
          onclick="removeFromWishlist('${product.id}')"
        >
          Remove
        </button>

      </div>
    `;

    grid.appendChild(card);
  });
}


// ── handleAddToCart ───────────────────────────────────────
// Finds the product by ID and calls addToCart() from cart.js.

function handleAddToCart(productId) {
  const products         = JSON.parse(localStorage.getItem("products")) || [];
  const wishlistProducts = JSON.parse(localStorage.getItem("wishlistProducts")) || {};
  const product = products.find(p => String(p.id) === String(productId))
               || wishlistProducts[String(productId)];

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

async function removeFromWishlist(productId) {

  const session = JSON.parse(sessionStorage.getItem("session") || "null");
  const token = session?.token || null;

  const response = await fetch(
    `${API_BASE}/wishlist/${productId}`,
    {
      method: "DELETE",

      headers: {
        "Authorization": `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    showToast("Failed to remove item", "error");
    return;
  }

  showToast("Removed from wishlist", "info");

  await renderWishlist();
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