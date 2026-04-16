 
// ── 1. Read ?id= from URL ─────────────────────────────────
function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ── 2. Find product (localStorage first, then JSON fallback) ─
async function getProduct(id) {
  const stored = JSON.parse(localStorage.getItem('products') || '[]');
  const found = stored.find(p => String(p.id) === String(id));
  if (found) return found;

  try {
    const res = await fetch('../data/Perfume.json');
    const all = await res.json();
    return all.find(p => String(p.id) === String(id)) || null;
  } catch {
    return null;
  }
}

// ── 3. Populate the page ─────────────────────────────────
function populatePage(product) {
  document.title = `${product.name} — SCENTÉ`;

  const breadcrumbName = document.getElementById('breadcrumb-name');
  if (breadcrumbName) breadcrumbName.textContent = product.name;

  const mainImg = document.getElementById('detail-main-img');
  if (mainImg) {
    mainImg.src = product.image || '';
    mainImg.alt = product.name;
    mainImg.style.display = 'block';
  }
  const imgPlaceholder = document.querySelector('.img-placeholder');
  if (imgPlaceholder && product.image) imgPlaceholder.style.display = 'none';

  const brandEl = document.getElementById('detail-brand');
  if (brandEl) brandEl.textContent = product.brand || '';

  const nameEl = document.getElementById('detail-name');
  if (nameEl) nameEl.textContent = product.name;

  const priceEl = document.getElementById('detail-price');
  if (priceEl) {
    const price = product.salePrice ?? product.price;
    priceEl.textContent = `$${Number(price).toFixed(2)}`;
  }

  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = product.description || '';

  const volumeWrap = document.getElementById('detail-volumes');
  if (volumeWrap && product.volumes && product.volumes.length) {
    volumeWrap.innerHTML = product.volumes.map((v, i) => {
      const price = product.volumePrices ? product.volumePrices[v] : product.price;
      return `<button class="volume-option ${i === 0 ? 'active' : ''}" data-volume="${v}" data-price="${price}" onclick="selectVolume(this)">${v}</button>`;
    }).join('');
  }

  const topEl = document.getElementById('notes-top');
  const midEl = document.getElementById('notes-middle');
  const baseEl = document.getElementById('notes-base');
  if (topEl && product.topNotes) topEl.textContent = product.topNotes.join(', ');
  if (midEl && product.middleNotes) midEl.textContent = product.middleNotes.join(', ');
  if (baseEl && product.baseNotes) baseEl.textContent = product.baseNotes.join(', ');

  const genderEl = document.getElementById('detail-gender');
  if (genderEl) genderEl.textContent = `${product.gender || ''} · ${product.category || ''}`;

  const addCartBtn = document.getElementById('btn-add-cart');
  if (addCartBtn) {
    addCartBtn.onclick = () => {
      const activeVol = document.querySelector('.volume-option.active');
      const size = activeVol ? activeVol.dataset.volume : (product.volumes?.[0] || null);
      const price = activeVol ? Number(activeVol.dataset.price) : product.price;
      const qty = parseInt(document.getElementById('qty')?.textContent || '1', 10);
      for (let i = 0; i < qty; i++) {
        addToCart({ ...product, price }, size);
      }
    };
  }

  const wishBtn = document.getElementById('btn-wishlist');
  if (wishBtn) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isWished = wishlist.includes(String(product.id));
    wishBtn.textContent = isWished ? 'Remove from Wishlist' : 'Add to Wishlist';

    wishBtn.onclick = () => {
      let wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const id = String(product.id);
      if (wl.includes(id)) {
        wl = wl.filter(w => w !== id);
        wishBtn.textContent = 'Add to Wishlist';
        showCartToast('Removed from wishlist');
      } else {
        wl.push(id);
        wishBtn.textContent = 'Remove from Wishlist';
        showCartToast('Added to wishlist');
        const saved = JSON.parse(localStorage.getItem('wishlistProducts') || '{}');
        saved[id] = product;
        localStorage.setItem('wishlistProducts', JSON.stringify(saved));
      }
      localStorage.setItem('wishlist', JSON.stringify(wl));
    };
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

 let selectedRating = 0;
function setRating(n) {
  selectedRating = n;
  document.querySelectorAll('#starPicker span').forEach((star, i) => {
    star.style.color = i < n ? 'var(--color-text-primary)' : '#ccc';
  });
}

 document.addEventListener('DOMContentLoaded', async () => {
  const id = getProductIdFromURL();
  if (!id) {
    document.querySelector('main').innerHTML =
      '<div class="container" style="padding:4rem 0"><p>No product selected. <a href="../pages/shop.html">Browse our shop</a>.</p></div>';
    return;
  }
  const product = await getProduct(id);
  if (!product) {
    document.querySelector('main').innerHTML =
      '<div class="container" style="padding:4rem 0"><p>Product not found. <a href="../pages/shop.html">Browse our shop</a>.</p></div>';
    return;
  }
  populatePage(product);
});
