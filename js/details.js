// ============================================================
// js/details.js — Product Detail Page Logic
// SCENTÉ · Handles product display, add to cart, and wishlist
// ============================================================

// ── 1. Read ?id= from URL ─────────────────────────────────
function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ── 2. Find product (localStorage first, then JSON fallback) ─
async function getProduct(id) {
  // Try localStorage first
  const stored = JSON.parse(localStorage.getItem('products') || '[]');
  const found = stored.find(p => String(p.id) === String(id));
  if (found) return found;

  // Fallback to JSON file
  try {
    const res = await fetch('/data/Perfume.json');
    const all = await res.json();
    return all.find(p => String(p.id) === String(id)) || null;
  } catch {
    return null;
  }
}

// ── 3. Populate the page ─────────────────────────────────
let currentProduct = null;

function populatePage(product) {
  currentProduct = product;
  
  document.title = `${product.name} — SCENTÉ`;

  // Breadcrumb
  const breadcrumbName = document.getElementById('breadcrumb-name');
  if (breadcrumbName) breadcrumbName.textContent = product.name;

  // Main image
  const mainImg = document.getElementById('detail-main-img');
  if (mainImg) {
    mainImg.src = product.image || 'https://via.placeholder.com/375x500?text=No+Image';
    mainImg.alt = product.name;
    mainImg.style.display = 'block';
  }
  
  const imgPlaceholder = document.querySelector('.img-placeholder');
  if (imgPlaceholder && product.image) imgPlaceholder.style.display = 'none';

  // Brand
  const brandEl = document.getElementById('detail-brand');
  if (brandEl) brandEl.textContent = product.brand || '';

  // Name
  const nameEl = document.getElementById('detail-name');
  if (nameEl) nameEl.textContent = product.name;

  // Price
  const priceEl = document.getElementById('detail-price');
  if (priceEl) {
    const price = product.salePrice ?? product.price;
    priceEl.textContent = `$${Number(price).toFixed(2)}`;
  }

  // Description
  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = product.description || 'A luxurious fragrance from SCENTÉ.';

  // Volume selector
  const volumeWrap = document.getElementById('detail-volumes');
  if (volumeWrap && product.volumes && product.volumes.length) {
    volumeWrap.innerHTML = product.volumes.map((v, i) => {
      const price = product.volumePrices?.[v] || product.price;
      return `<button class="volume-option ${i === 0 ? 'active' : ''}" data-volume="${v}" data-price="${price}" onclick="selectVolume(this)">${v}</button>`;
    }).join('');
  }

  // Fragrance notes
  const topEl = document.getElementById('notes-top');
  const midEl = document.getElementById('notes-middle');
  const baseEl = document.getElementById('notes-base');
  if (topEl && product.topNotes) topEl.textContent = Array.isArray(product.topNotes) ? product.topNotes.join(', ') : product.topNotes;
  if (midEl && product.middleNotes) midEl.textContent = Array.isArray(product.middleNotes) ? product.middleNotes.join(', ') : product.middleNotes;
  if (baseEl && product.baseNotes) baseEl.textContent = Array.isArray(product.baseNotes) ? product.baseNotes.join(', ') : product.baseNotes;

  // Gender/Category
  const genderEl = document.getElementById('detail-gender');
  if (genderEl) genderEl.textContent = `${product.gender || 'Unisex'} · ${product.category || 'Perfume'}`;

  // ── ADD TO CART BUTTON ─────────────────────────────────
  const addCartBtn = document.getElementById('btn-add-cart');
  if (addCartBtn) {
    // Remove any existing listeners
    const newBtn = addCartBtn.cloneNode(true);
    addCartBtn.parentNode.replaceChild(newBtn, addCartBtn);
    
    newBtn.addEventListener('click', () => {
      const activeVol = document.querySelector('.volume-option.active');
      const size = activeVol ? activeVol.dataset.volume : (product.volumes?.[0] || '50ml');
      const price = activeVol ? Number(activeVol.dataset.price) : product.price;
      const qty = parseInt(document.getElementById('qty')?.textContent || '1', 10);
      
      // Add to cart multiple times based on quantity
      for (let i = 0; i < qty; i++) {
        if (typeof addToCart === 'function') {
          addToCart({ ...product, price }, size);
        } else {
          console.error('addToCart function not found! Make sure cart.js is loaded.');
          alert('Cart functionality not available. Please refresh the page.');
        }
      }
    });
  }

  // ── WISHLIST BUTTON ─────────────────────────────────────
  const wishBtn = document.getElementById('btn-wishlist');
  if (wishBtn) {
    // Remove any existing listeners
    const newWishBtn = wishBtn.cloneNode(true);
    wishBtn.parentNode.replaceChild(newWishBtn, wishBtn);
    
    // Check if already in wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isWished = wishlist.includes(String(product.id));
    newWishBtn.textContent = isWished ? 'Remove from Wishlist' : 'Add to Wishlist';

    newWishBtn.addEventListener('click', () => {
      let wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const id = String(product.id);
      
      if (wl.includes(id)) {
        // Remove from wishlist
        wl = wl.filter(w => w !== id);
        newWishBtn.textContent = 'Add to Wishlist';
        if (typeof showToast === 'function') {
          showToast('Removed from wishlist', 'info');
        }
      } else {
        // Add to wishlist
        wl.push(id);
        newWishBtn.textContent = 'Remove from Wishlist';
        if (typeof showToast === 'function') {
          showToast('Added to wishlist', 'success');
        }
        
        // Save product data for wishlist page
        const saved = JSON.parse(localStorage.getItem('wishlistProducts') || '{}');
        saved[id] = product;
        localStorage.setItem('wishlistProducts', JSON.stringify(saved));
      }
      
      localStorage.setItem('wishlist', JSON.stringify(wl));
    });
  }
}

// ── 4. Volume selection ───────────────────────────────────
function selectVolume(btn) {
  document.querySelectorAll('.volume-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const priceEl = document.getElementById('detail-price');
  if (priceEl && btn.dataset.price) {
    priceEl.textContent = `$${Number(btn.dataset.price).toFixed(2)}`;
  }
}

// ── 5. Quantity control ───────────────────────────────────
function changeQty(delta) {
  const el = document.getElementById('qty');
  if (!el) return;
  const next = Math.max(1, parseInt(el.textContent, 10) + delta);
  el.textContent = next;
}

// ── 6. Accordion ─────────────────────────────────────────
function toggleAccordion(btn) {
  const item = btn.closest('.accordion-item');
  const isOpen = item.classList.contains('open');
  
  document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
  
  document.querySelectorAll('.accordion-item__icon').forEach(icon => {
    icon.textContent = icon.closest('.accordion-item').classList.contains('open') ? '−' : '+';
  });
}

// ── 7. Initialize page ───────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const id = getProductIdFromURL();
  
  if (!id) {
    document.querySelector('main').innerHTML = `
      <div class="container" style="padding:4rem 0; text-align:center;">
        <p>No product selected.</p>
        <a href="/pages/shop.html" class="btn btn--primary" style="margin-top:20px;">Browse our shop</a>
      </div>`;
    return;
  }
  
  const product = await getProduct(id);
  
  if (!product) {
    document.querySelector('main').innerHTML = `
      <div class="container" style="padding:4rem 0; text-align:center;">
        <p>Product not found.</p>
        <a href="/pages/shop.html" class="btn btn--primary" style="margin-top:20px;">Browse our shop</a>
      </div>`;
    return;
  }
  
  populatePage(product);
});

// Expose functions globally
window.selectVolume = selectVolume;
window.changeQty = changeQty;
window.toggleAccordion = toggleAccordion;