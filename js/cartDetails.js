 let appliedDiscount = 0;

    // ── Seed demo products if cart is empty ───────────────────
    function seedDemoProducts() {
      const existing = getCart();
      if (existing.length === 0) {
        const demo = [];
        localStorage.setItem('scente_cart', JSON.stringify(demo));
      }
    }

    function fmt(n) {
      return '$' + n.toFixed(2);
    }

    // ── Render cart ───────────────────────────────────────────
    function render() {
      const cart = getCart();
      const tbody = document.getElementById('cart-tbody');
      const content = document.getElementById('cart-content');
      const empty = document.getElementById('cart-empty');
      const label = document.getElementById('cart-count-label');

      tbody.innerHTML = '';

      if (cart.length === 0) {
        content.classList.add('d-none');
        empty.classList.remove('d-none');
        label.textContent = '';
        return;
      }

      content.classList.remove('d-none');
      empty.classList.add('d-none');

      const totalItems = getItemCount();
      label.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');

      cart.forEach((item, i) => {
        const lineTotal = item.price * item.qty;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="width:100px; padding-right:16px;">
            ${item.image
              ? `<img src="${item.image}" alt="${item.name}" class="cart-img">`
              : `<div class="cart-img-placeholder"><i class="bi bi-image"></i></div>`}
          </td>
          <td>
            <div class="cart-brand">${item.brand || ''}</div>
            <div class="cart-name">${item.name}</div>
            ${item.size ? `<div class="cart-meta">${item.size}</div>` : ''}
          </td>
          <td class="cart-price">${fmt(item.price)}</td>
          <td>
            <div class="qty-wrap">
              <button class="qty-btn" onclick="handleQty(${i}, -1)">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="handleQty(${i}, 1)">+</button>
            </div>
          </td>
          <td class="cart-line-total">${fmt(lineTotal)}</td>
          <td>
            <button class="cart-remove" onclick="handleRemove(${i})" title="Remove">
              <i class="bi bi-x-lg"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      updateSummary();
    }

    // ── Summary ───────────────────────────────────────────────
    function updateSummary() {
      const subtotal = getSubtotal();
      const shipping = getShipping();
      const discountAmt = subtotal * appliedDiscount;
      const total = getTotal(appliedDiscount);

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
        discountAmt > 0 ? '−' + fmt(discountAmt) : '—';
      document.getElementById('summary-total').textContent = fmt(total);
    }

    // ── Actions ───────────────────────────────────────────────
    function handleQty(index, delta) {
      updateQty(index, delta);
      render();
    }

    function handleRemove(index) {
      removeFromCart(index);
      render();
      showCartToast('Item removed from cart');
    }
    
    async function applyPromo() {
      const code = document.getElementById('promo-input').value.trim().toUpperCase();
      const msg  = document.getElementById('promo-msg');

      if (!code) {
        msg.style.color = 'var(--color-error)';
        msg.textContent = 'Please enter a promo code.';
        return;
      }

      try {
        const result = await api.post('api/cart/promo', { code });
        appliedDiscount = Number(result.discountRate);
        msg.style.color = 'var(--color-success)';
        msg.textContent = result.message;
        showCartToast('Promo code applied!');
        updateSummary();
      } catch (err) {
        appliedDiscount = 0;
        msg.style.color = 'var(--color-error)';
        msg.textContent = err.message || 'Invalid promo code.';
        updateSummary();
      }
    }

    // ── Init ──────────────────────────────────────────────────
    seedDemoProducts();
    render();