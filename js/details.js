
function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function getProduct(id) {
  try {
    return await api.get(`api/products/${id}`);
  } catch (err) {
    return null;
  }
}

let currentProduct = null;

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

  // Show size buttons (e.g. 30ml, 50ml, 100ml)
  buildVolumePicker(product);

  // Set up the Add to Cart button
  setupAddToCartButton(product);

  // Set up the Wishlist button
  setupWishlistButton(product);

  loadReviews(product.id);

  setupReviewForm(product.id);
}

function buildVolumePicker(product) {
  const volumes = product.volumes;
  if (!volumes || volumes.length === 0) return;

  // Find or create the volume picker container
  let container = document.getElementById('volume-picker');
  if (!container) return;

  container.innerHTML = '';

  volumes.forEach((vol, index) => {
    const btn = document.createElement('button');
    btn.className = `volume-option${index === 0 ? ' active' : ''}`;
    btn.textContent = vol.size;
    btn.dataset.volume = vol.size;
    btn.dataset.price  = vol.price;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.volume-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update the displayed price
      const priceEl = document.getElementById('detail-price');
      if (priceEl) priceEl.textContent = `$${Number(vol.price).toFixed(2)}`;

      // Update the volume badge
      const volEl = document.getElementById('detail-volume');
      if (volEl) volEl.textContent = vol.size;
    });

    container.appendChild(btn);
  });

  // Set initial price and volume from first option
  const first = volumes[0];
  const priceEl = document.getElementById('detail-price');
  const volEl   = document.getElementById('detail-volume');
  if (priceEl) priceEl.textContent = `$${Number(first.price).toFixed(2)}`;
  if (volEl)   volEl.textContent   = first.size;
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
async function loadReviews(productId) {
  try {
    const data = await api.get(`api/products/${productId}/reviews`);
    renderStarAverage(data.average, data.count);
    renderReviewCards(data.reviews);
  } catch (err) {
    console.warn('Could not load reviews:', err);
  }
}

function renderStarAverage(average, count) {
  const ratingCount = document.getElementById('product-rating-count');
  const starsWrap   = document.querySelector('.product-info__rating .stars');

  if (ratingCount) {
    ratingCount.textContent = `${average} (${count} review${count !== 1 ? 's' : ''})`;
  }

  if (starsWrap) {
    starsWrap.innerHTML = [1,2,3,4,5].map(i =>
      `<span class="star ${i <= Math.round(average) ? 'star--filled' : ''}">★</span>`
    ).join('');
  }
}

function renderReviewCards(reviews) {
  const grid = document.getElementById('reviews-grid');
  if (!grid) return;

  if (!reviews || reviews.length === 0) {
    grid.innerHTML = `<p style="color:var(--color-text-secondary); font-size:var(--text-sm);">No reviews yet. Be the first to leave one.</p>`;
    return;
  }

  grid.innerHTML = reviews.map(r => {
    const stars = [1,2,3,4,5].map(i =>
      `<span class="star ${i <= r.rating ? 'star--filled' : ''}">★</span>`
    ).join('');
    const date = new Date(r.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const initials = r.authorName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);

    return `
      <div class="review-card">
        <div class="review-card__stars"><div class="stars">${stars}</div></div>
        <p class="review-card__text">"${r.text}"</p>
        <div class="review-card__author">
          <div class="review-card__avatar">${initials}</div>
          <div>
            <div class="review-card__name">${r.authorName}</div>
            <div class="review-card__date">${date}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function setupReviewForm(productId) {
  const form = document.getElementById('review-form');
  if (!form) return;

  // Star picker interaction
  const starPicker = document.querySelectorAll('.star-picker span');
  let selectedRating = 0;

  starPicker.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      starPicker.forEach((s, i) => {
        s.classList.toggle('selected', i < selectedRating);
      });
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const session = JSON.parse(sessionStorage.getItem('session'));
    if (!session || !session.loggedIn) {
      showToast?.('Please sign in to leave a review.', 'error');
      return;
    }

    if (selectedRating === 0) {
      showToast?.('Please select a star rating.', 'error');
      return;
    }

    const text = document.getElementById('review-text')?.value?.trim();
    if (!text) {
      showToast?.('Please write your review.', 'error');
      return;
    }

    try {
      await api.post(`api/products/${productId}/reviews`, {
        rating: selectedRating,
        text
      });
      showToast?.('Review submitted!', 'success');
      form.reset();
      selectedRating = 0;
      starPicker.forEach(s => s.classList.remove('selected'));
      loadReviews(productId);
    } catch (err) {
      showToast?.(err.message || 'Could not submit review.', 'error');
    }
  });
}


async function loadRelatedProducts(productId) {
  const section = document.getElementById('related-products-grid');
  if (!section) return;

  try {
    const products = await api.get(`api/products/related/${productId}`);
    if (!products || products.length === 0) {
      section.closest('.related-section')?.remove();
      return;
    }

    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

    section.innerHTML = products.map(p => {
      const wished = wishlist.includes(String(p.id));
      return `
        <div class="product-card" onclick="window.location.href='details.html?id=${p.id}'">
          <div class="product-card__image-wrap">
            <img class="product-card__img" src="${p.image}" alt="${p.name}"
                 onerror="this.src='https://via.placeholder.com/375x500?text=No+Image'">
            <button class="product-card__wishlist ${wished ? 'wished' : ''}"
                    onclick="event.stopPropagation(); toggleRelatedWishlist('${p.id}', this)"
                    aria-label="Toggle wishlist">
              <i class="bi ${wished ? 'bi-heart-fill' : 'bi-heart'}"></i>
            </button>
            <button class="product-card__quick-add"
                    onclick="event.stopPropagation(); addRelatedToCart(${p.id})">
              Add to Cart
            </button>
          </div>
          <p class="product-card__brand">${p.brand}</p>
          <h3 class="product-card__name">${p.name}</h3>
          <p class="product-card__price">$${Number(p.price).toFixed(2)}</p>
        </div>`;
    }).join('');

  } catch (err) {
    console.warn('Could not load related products:', err);
    section.closest('.related-section')?.remove();
  }
}

function toggleRelatedWishlist(productId, btn) {
  const id = String(productId);
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const icon   = btn.querySelector('i');
  const inList = wishlist.includes(id);

  if (inList) {
    wishlist = wishlist.filter(w => w !== id);
    icon.className = 'bi bi-heart';
    btn.classList.remove('wished');
    showToast?.('Removed from wishlist', 'info');
  } else {
    wishlist.push(id);
    icon.className = 'bi bi-heart-fill';
    btn.classList.add('wished');
    showToast?.('Added to wishlist', 'info');
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

async function addRelatedToCart(productId) {
  try {
    const product = await api.get(`api/products/${productId}`);
    const size    = product.volumes?.[0]?.size || '50ml';
    if (typeof addToCart === 'function') addToCart(product, size);
  } catch (err) {
    showToast?.('Could not add to cart.', 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// START: Run everything once the page has loaded
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const id      = getProductIdFromURL();
  const product = id ? await getProduct(id) : null;

  if (!product) {

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