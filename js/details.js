// ============================================================
// details.js — Product Detail Page
// Shows a single product's info, lets user add to cart/wishlist
// ============================================================


// ─────────────────────────────────────────────────────────────
// STEP 1: Get the product ID from the URL
// Example URL: /details.html?id=3  →  id = "3"
// ─────────────────────────────────────────────────────────────
function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}


// ─────────────────────────────────────────────────────────────
// STEP 2: Find the product in localStorage using its ID
// ─────────────────────────────────────────────────────────────
function getProduct(id) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  return products.find(p => String(p.id) === String(id)) || null;
}


// ─────────────────────────────────────────────────────────────
// STEP 3: Fill the page with the product's information
// ─────────────────────────────────────────────────────────────
let currentProduct = null; // We save this so other functions can use it

function populatePage(product) {
  currentProduct = product;

  // Set the browser tab title
  document.title = `${product.name} — SCENTÉ`;

  // Fill in each element by its ID
  setElementText('breadcrumb-name', product.name);
  setElementText('detail-brand',    product.brand    || '');
  setElementText('detail-name',     product.name);
  setElementText('detail-gender',   `${product.gender || 'Unisex'} · ${product.category || 'Perfume'}`);
  setElementText('detail-description', product.description || 'A luxurious fragrance from SCENTÉ.');

  // Show the price (use salePrice if available, otherwise regular price)
  const price = product.salePrice ?? product.price;
  setElementText('detail-price', `$${Number(price).toFixed(2)}`);

  // Show the product image
  const img = document.getElementById('detail-main-img');
  if (img) {
    img.src = product.image || 'https://via.placeholder.com/375x500?text=No+Image';
    img.alt = product.name;
    img.style.display = 'block';
  }

  // Hide the placeholder box once the real image loads
  const placeholder = document.querySelector('.img-placeholder');
  if (placeholder && product.image) placeholder.style.display = 'none';

  // Show fragrance notes (top / middle / base)
  setElementText('notes-top',    formatNotes(product.topNotes));
  setElementText('notes-middle', formatNotes(product.middleNotes));
  setElementText('notes-base',   formatNotes(product.baseNotes));

 

  // Set up the Add to Cart button
  setupAddToCartButton(product);

  // Set up the Wishlist button
  setupWishlistButton(product);
}

// Helper: sets an element's text if it exists on the page
function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Helper: turns an array like ["Rose","Oud"] into "Rose, Oud"
function formatNotes(notes) {
  if (!notes) return '';
  return Array.isArray(notes) ? notes.join(', ') : notes;
}







// ─────────────────────────────────────────────────────────────
// STEP 5: Add to Cart button
// ─────────────────────────────────────────────────────────────
function setupAddToCartButton(product) {
  const btn = document.getElementById('btn-add-cart');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // Find which size is selected
    const activeSize = document.querySelector('.volume-option.active');
    const size  = activeSize?.dataset.volume || product.volumes?.[0] || '50ml';
    const price = activeSize ? Number(activeSize.dataset.price) : product.price;

    // Read how many the user wants
    const qty = parseInt(document.getElementById('qty')?.textContent || '1', 10);

    // Add to cart once per quantity
    for (let i = 0; i < qty; i++) {
      if (typeof addToCart === 'function') {
        addToCart({ ...product, price }, size);
      } else {
        alert('Cart is not available. Please refresh the page.');
      }
    }
  });
}


// ─────────────────────────────────────────────────────────────
// STEP 6: Wishlist button
// ─────────────────────────────────────────────────────────────
function setupWishlistButton(product) {
  const btn = document.getElementById('btn-wishlist');
  if (!btn) return;

  const productId = String(product.id);

  // Check if this product is already wishlisted
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  btn.textContent = wishlist.includes(productId) ? 'Remove from Wishlist' : 'Add to Wishlist';

  btn.addEventListener('click', () => {
    let wl = JSON.parse(localStorage.getItem('wishlist') || '[]');

    if (wl.includes(productId)) {
      // Remove it
      wl = wl.filter(id => id !== productId);
      btn.textContent = 'Add to Wishlist';
      showToast?.('Removed from wishlist', 'info');
    } else {
      // Add it
      wl.push(productId);
      btn.textContent = 'Remove from Wishlist';
      showToast?.('Added to wishlist', 'success');

      // Also save full product data so the wishlist page can display it
      const savedProducts = JSON.parse(localStorage.getItem('wishlistProducts') || '{}');
      savedProducts[productId] = product;
      localStorage.setItem('wishlistProducts', JSON.stringify(savedProducts));
    }

    localStorage.setItem('wishlist', JSON.stringify(wl));
  });
}


// ─────────────────────────────────────────────────────────────
// STEP 7: Quantity +/- buttons
// ─────────────────────────────────────────────────────────────
function changeQty(delta) {
  const el = document.getElementById('qty');
  if (!el) return;

  const newQty = Math.max(1, parseInt(el.textContent, 10) + delta); // never below 1
  el.textContent = newQty;
}


// ─────────────────────────────────────────────────────────────
// STEP 8: Accordion (expandable sections like "How to use")
// ─────────────────────────────────────────────────────────────
function toggleAccordion(btn) {
  const item   = btn.closest('.accordion-item');
  const isOpen = item.classList.contains('open');

  // Close all sections first
  document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
  document.querySelectorAll('.accordion-item__icon').forEach(icon => icon.textContent = '+');

  // If it wasn't open, open it now
  if (!isOpen) {
    item.classList.add('open');
    item.querySelector('.accordion-item__icon').textContent = '−';
  }
}


// ─────────────────────────────────────────────────────────────
// START: Run everything once the page has loaded
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const id      = getProductIdFromURL();
  const product = id ? getProduct(id) : null;

  if (!product) {
    // Show a friendly error if the product wasn't found
    document.querySelector('main').innerHTML = `
      <div class="container" style="padding:4rem 0; text-align:center;">
        <p>${id ? 'Product not found.' : 'No product selected.'}</p>
        <a href="/pages/shop.html" class="btn btn--primary" style="margin-top:20px;">Browse our shop</a>
      </div>`;
    return;
  }

  populatePage(product);
});


// Make functions available to inline HTML (onclick="...")
window.selectVolume    = selectVolume;
window.changeQty       = changeQty;
window.toggleAccordion = toggleAccordion;