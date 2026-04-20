




function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}



function getProduct(id) {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  return products.find(p => String(p.id) === String(id)) || null;
}



let currentProduct = null; 

function populatePage(product) {
  currentProduct = product;

  document.title = `${product.name} — SCENTÉ`;

  setElementText('breadcrumb-name', product.name);
  setElementText('detail-brand',    product.brand    || '');
  setElementText('detail-name',     product.name);
  setElementText('detail-gender',   `${product.gender || 'Unisex'} · ${product.category || 'Perfume'}`);
  setElementText('detail-description', product.description || 'A luxurious fragrance from SCENTÉ.');


  const price = product.salePrice ?? product.price;
  setElementText('detail-price', `$${Number(price).toFixed(2)}`);


  const img = document.getElementById('detail-main-img');
  if (img) {
    img.src = product.image || 'https://via.placeholder.com/375x500?text=No+Image';
    img.alt = product.name;
    img.style.display = 'block';
  }


  const placeholder = document.querySelector('.img-placeholder');
  if (placeholder && product.image) placeholder.style.display = 'none';

  
  setElementText('notes-top',    formatNotes(product.topNotes));
  setElementText('notes-middle', formatNotes(product.middleNotes));
  setElementText('notes-base',   formatNotes(product.baseNotes));

 


  setupAddToCartButton(product);

 
  setupWishlistButton(product);
}


function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}


function formatNotes(notes) {
  if (!notes) return '';
  return Array.isArray(notes) ? notes.join(', ') : notes;
}








function setupAddToCartButton(product) {
  const btn = document.getElementById('btn-add-cart');
  if (!btn) return;

  btn.addEventListener('click', () => {
   
    const activeSize = document.querySelector('.volume-option.active');
    const size  = activeSize?.dataset.volume || product.volumes?.[0] || '50ml';
    const price = activeSize ? Number(activeSize.dataset.price) : product.price;


    const qty = parseInt(document.getElementById('qty')?.textContent || '1', 10);


    for (let i = 0; i < qty; i++) {
      if (typeof addToCart === 'function') {
        addToCart({ ...product, price }, size);
      } else {
        alert('Cart is not available. Please refresh the page.');
      }
    }
  });
}



function setupWishlistButton(product) {
  const btn = document.getElementById('btn-wishlist');
  if (!btn) return;

  const productId = String(product.id);

 
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  btn.textContent = wishlist.includes(productId) ? 'Remove from Wishlist' : 'Add to Wishlist';

  btn.addEventListener('click', () => {
    let wl = JSON.parse(localStorage.getItem('wishlist') || '[]');

    if (wl.includes(productId)) {
      wl = wl.filter(id => id !== productId);
      btn.textContent = 'Add to Wishlist';
      showToast?.('Removed from wishlist', 'info');
    } else {
      wl.push(productId);
      btn.textContent = 'Remove from Wishlist';
      showToast?.('Added to wishlist', 'success');

      const savedProducts = JSON.parse(localStorage.getItem('wishlistProducts') || '{}');
      savedProducts[productId] = product;
      localStorage.setItem('wishlistProducts', JSON.stringify(savedProducts));
    }

    localStorage.setItem('wishlist', JSON.stringify(wl));
  });
}


function changeQty(delta) {
  const el = document.getElementById('qty');
  if (!el) return;

  const newQty = Math.max(1, parseInt(el.textContent, 10) + delta); 
  el.textContent = newQty;
}


function toggleAccordion(btn) {
  const item   = btn.closest('.accordion-item');
  const isOpen = item.classList.contains('open');

  document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
  document.querySelectorAll('.accordion-item__icon').forEach(icon => icon.textContent = '+');

  if (!isOpen) {
    item.classList.add('open');
    item.querySelector('.accordion-item__icon').textContent = '−';
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const id      = getProductIdFromURL();
  const product = id ? getProduct(id) : null;

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


window.selectVolume    = selectVolume;
window.changeQty       = changeQty;
window.toggleAccordion = toggleAccordion;