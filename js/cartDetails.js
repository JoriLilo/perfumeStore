// ============================================================
// js/cartDetails.js — Cart Page Logic
// SCENTÉ · Updated Week 3
//
// Changes from Week 2:
//   • Loads cart from GET /api/cart?userId={id} when logged in
//   • Remove item calls DELETE /api/cart/items/{id}
//   • Update qty calls PATCH /api/cart/items/{id}
//   • Falls back to localStorage for guests
// ============================================================

let appliedDiscount = 0;
let apiCart = null; // holds the cart from API when logged in

function fmt(n) {
  return '$' + n.toFixed(2);
}

// -- Get session -------------------------------------------
function getSession() {
  return JSON.parse(sessionStorage.getItem('session') || 'null');
}

function isLoggedIn() {
  const s = getSession();
  return s && s.loggedIn && s.userId;
}

// -- Load cart (API or localStorage) ----------------------
async function loadCart() {
  const session = getSession();

  if (session && session.loggedIn && session.userId) {
    try {
      apiCart = await api.get(`api/cart?userId=${session.userId}`);
    } catch (_) {
      apiCart = null;
    }
  } else {
    apiCart = null;
  }

  render();
}

// -- Render cart -------------------------------------------
function render() {
  const tbody = document.getElementById('cart-tbody');
  const content = document.getElementById('cart-content');
  const empty = document.getElementById('cart-empty');
  const label = document.getElementById('cart-count-label');

  tbody.innerHTML = '';

  // Use API cart if available, otherwise localStorage
  const items = apiCart ? apiCart.items : getCart();

  if (!items || items.length === 0) {
    content.classList.add('d-none');
    empty.classList.remove('d-none');
    label.textContent = '';
    return;
  }

  content.classList.remove('d-none');
  empty.classList.add('d-none');

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
  label.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');

  items.forEach((item, i) => {
    const qty = item.quantity || item.qty || 1;
    const price = item.price || 0;
    const lineTotal = price * qty;
    const name = item.product ? item.product.name : item.name;
    const brand = item.product ? item.product.brand : item.brand;
    const image = item.product ? item.product.image : item.image;
    const size = item.size || null;
    const itemId = item.id || i;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width:100px; padding-right:16px;">
        ${image
          ? `<img src="${image}" alt="${name}" class="cart-img">`
          : `<div class="cart-img-placeholder"><i class="bi bi-image"></i></div>`}
      </td>
      <td>
        <div class="cart-brand">${brand || ''}</div>
        <div class="cart-name">${name}</div>
        ${size ? `<div class="cart-meta">${size}</div>` : ''}
      </td>
      <td class="cart-price">${fmt(price)}</td>
      <td>
        <div class="qty-wrap">
          <button class="qty-btn" onclick="handleQty(${itemId}, ${qty}, -1)">-</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn" onclick="handleQty(${itemId}, ${qty}, 1)">+</button>
        </div>
      </td>
      <td class="cart-line-total">${fmt(lineTotal)}</td>
      <td>
        <button class="cart-remove" onclick="handleRemove(${itemId}, ${i})" title="Remove">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateSummary();
}

// -- Summary -----------------------------------------------
function updateSummary() {
  const items = apiCart ? apiCart.items : getCart();
  const subtotal = items
    ? items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || item.qty || 1), 0)
    : getSubtotal();

  const shipping = subtotal === 0 || subtotal >= 50 ? 0 : 5.99;
  const discountAmt = subtotal * appliedDiscount;
  const total = subtotal - discountAmt + shipping;

  document.getElementById('summary-subtotal').textContent = fmt(subtotal);

  const shipEl = document.getElementById('summary-shipping');
  if (shipping === 0) {
    shipEl.textContent = 'Free';
    shipEl.className = 'summary-free';
  } else {
    shipEl.textContent = fmt(shipping);
    shipEl.className = '';
  }

  document.getElementById('summary-discount').textContent =
    discountAmt > 0 ? '-' + fmt(discountAmt) : '—';
  document.getElementById('summary-total').textContent = fmt(total);
}

// -- Actions -----------------------------------------------
async function handleQty(itemId, currentQty, delta) {
  const newQty = currentQty + delta;

  if (apiCart) {
    try {
      if (newQty <= 0) {
        await api.delete(`api/cart/items/${itemId}`);
      } else {
        await api.patch(`api/cart/items/${itemId}`, { quantity: newQty });
      }
      await loadCart();
    } catch (_) {
      showCartToast('Could not update item');
    }
  } else {
    updateQty(itemId, delta);
    render();
  }
}

async function handleRemove(itemId, localIndex) {
  if (apiCart) {
    try {
      await api.delete(`api/cart/items/${itemId}`);
      await loadCart();
      showCartToast('Item removed from cart');
    } catch (_) {
      showCartToast('Could not remove item');
    }
  } else {
    removeFromCart(localIndex);
    render();
    showCartToast('Item removed from cart');
  }
}

function applyPromo() {
  const code = document.getElementById('promo-input').value.trim().toUpperCase();
  const msg = document.getElementById('promo-msg');
  const PROMO_CODES = { SCENTE10: 0.10, SUMMER20: 0.20, VIP30: 0.30 };

  if (PROMO_CODES[code]) {
    appliedDiscount = PROMO_CODES[code];
    msg.style.color = 'var(--color-success)';
    msg.textContent = (appliedDiscount * 100) + '% discount applied!';
    showCartToast('Promo code applied!');
  } else {
    appliedDiscount = 0;
    msg.style.color = 'var(--color-error)';
    msg.textContent = 'Invalid promo code.';
  }

  updateSummary();
}

// -- Init --------------------------------------------------
loadCart();
