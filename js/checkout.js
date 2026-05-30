// ============================================================
// js/checkout.js — Checkout Page Logic
// SCENTÉ · Week 2
//
// Requires: /js/api.js loaded FIRST (provides window.api).
//
// Week 1: orders POST to the real API (no localStorage saving).
// Week 2: cart DISPLAY + shipping + total all come from the API,
//         and the thank-you modal is filled from the confirmation
//         endpoint (server-calculated, never trusts the browser).
// ============================================================

// Inject the footer (unchanged)
fetch('/components/footer.html')
    .then(res => res.text())
    .then(html => {
        const ph = document.getElementById('footer-placeholder');
        if (ph) ph.innerHTML = html;
    })
    .catch(() => { /* footer is non-critical */ });


document.addEventListener('DOMContentLoaded', () => {

    // --- AUTH GUARD ---
    // The team's api.js stores the JWT at session.token in sessionStorage.
    const session = JSON.parse(sessionStorage.getItem('session') || 'null');
    if (!session || !session.loggedIn) {
        window.location.href = '/pages/login.html';
        return;
    }

    // -- DOM refs --
    const cartContainer    = document.getElementById('cartItemsContainer');
    const subtotalDisplay   = document.getElementById('subtotalDisplay');
    const shippingDisplay   = document.getElementById('shippingDisplay');
    const grandTotalDisplay = document.getElementById('grandTotalDisplay');

    const form         = document.querySelector('form');
    const modal        = document.getElementById('orderModal');
    const overlay      = document.getElementById('orderOverlay');
    const orderDisplay = document.getElementById('orderNumberDisplay');
    const cardRadio    = document.getElementById('payCard');

    // ------------------------------------------------------------
    // 1. CART DISPLAY -- load from the DB cart via the API.
    //    Matches Ari's GET /api/cart shape:
    //      { items: [{ name, brand, price, qty, image, size, productId }],
    //        subtotal, warnings }
    //    Shipping shown here is a PREVIEW; the order endpoint
    //    recalculates it authoritatively on submit (Week 2).
    // ------------------------------------------------------------
    const FREE_SHIPPING_AT = 50;
    const FLAT_SHIPPING     = 15.00;

    async function loadCart() {
        let data;
        try {
            data = await api.get('api/cart');
        } catch (err) {
            cartContainer.innerHTML =
                '<p class="empty-cart-msg">Could not load your bag. Please refresh.</p>';
            return [];
        }

        const items    = (data && data.items) || [];
        const subtotal = (data && typeof data.subtotal === 'number')
            ? data.subtotal
            : items.reduce((s, i) => s + (i.price * i.qty), 0);

        if (items.length === 0) {
            cartContainer.innerHTML =
                '<p class="empty-cart-msg">Your shopping bag is empty.</p>';
            subtotalDisplay.textContent   = '$0.00';
            shippingDisplay.textContent   = '$0.00';
            grandTotalDisplay.textContent = '$0.00';
            return [];
        }

        cartContainer.innerHTML = '';
        items.forEach(item => {
            const itemTotal = item.price * item.qty;
            cartContainer.insertAdjacentHTML('beforeend', `
                <div class="cart-item">
                    <div class="item-image">
                        <img src="${item.image || ''}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h3 class="heading-md">${item.name}</h3>
                        <p class="text-sm text-secondary">Size: ${item.size || '-'}</p>
                        <p class="text-sm text-secondary">Qty: ${item.qty}</p>
                    </div>
                    <div class="item-price text-lg font-medium">$${itemTotal.toFixed(2)}</div>
                </div>
            `);
        });

        // Preview shipping (server is the source of truth on submit).
        const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : FLAT_SHIPPING;

        subtotalDisplay.textContent   = `$${subtotal.toFixed(2)}`;
        shippingDisplay.textContent   = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        grandTotalDisplay.textContent = `$${(subtotal + shipping).toFixed(2)}`;

        return items;
    }

    // Keep the latest known items so submit can guard an empty bag.
    let currentItems = [];
    loadCart().then(items => { currentItems = items; });


    // ------------------------------------------------------------
    // 2. ORDER SUBMISSION -> POST api/orders
    // ------------------------------------------------------------
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('[checkout] submit fired');
        console.log('[checkout] currentItems =', currentItems);

        if (currentItems.length === 0) {
            console.warn('[checkout] cart is empty, aborting');
            if (typeof showToast === 'function') showToast('Your bag is empty.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"], .btn-place-order');
        if (submitBtn) submitBtn.disabled = true;

        const f = Object.fromEntries(new FormData(form).entries());
        const paymentMethod = (cardRadio && cardRadio.checked) ? 'card' : 'cod';

        const payload = {
            paymentMethod,
            shippingAddress: f.addressLine1 || '',
            city:            f.city || '',
            postalCode:      f.postalCode || '',
            country:         f.country || '',
            phone:           f.phone || ''
        };

        try {
            // Create the order. Server clears the cart and returns the number.
            const result = await api.post('api/orders', payload);
            const orderNumber = result.orderNumber;

            // Week 2: pull the authoritative summary for the modal.
            await showConfirmation(orderNumber);

            // Refresh the navbar badge (cart is now empty in the DB).
            if (typeof updateCartBadge === 'function') updateCartBadge();

            modal.classList.add('active');
            overlay.classList.add('active');

        } catch (err) {
            console.error('Order failed:', err);
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // ------------------------------------------------------------
    // Fill the modal from GET api/orders/{orderNumber}/confirmation
    // ------------------------------------------------------------
    async function showConfirmation(orderNumber) {
        // Always show the number even if the summary fetch fails.
        orderDisplay.textContent = `Order number ${orderNumber}`;

        try {
            const summary = await api.get(`api/orders/${orderNumber}/confirmation`);

            const totalEl    = document.getElementById('modalTotal');
            const shipEl     = document.getElementById('modalShipping');
            const deliveryEl = document.getElementById('modalDelivery');

            if (totalEl && typeof summary.totalPaid === 'number')
                totalEl.textContent = `Total paid $${summary.totalPaid.toFixed(2)}`;
            if (shipEl && typeof summary.shippingCost === 'number')
                shipEl.textContent = summary.shippingCost === 0
                    ? 'Shipping Free'
                    : `Shipping $${summary.shippingCost.toFixed(2)}`;
            if (deliveryEl && summary.estimatedDelivery)
                deliveryEl.textContent = `Estimated delivery ${summary.estimatedDelivery}`;
        } catch (err) {
            console.warn('Could not load confirmation summary:', err);
        }
    }
});