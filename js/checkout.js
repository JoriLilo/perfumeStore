// ============================================================
// js/checkout.js — Checkout Page Logic
// SCENTÉ · Week 1: orders now go to the real API (no localStorage)
//
// Requires: /js/api.js loaded first (provides window.api + auth helpers)
// ============================================================

// Inject the footer (unchanged from before)
fetch('/components/footer.html')
    .then(res => res.text())
    .then(html => {
        const ph = document.getElementById('footer-placeholder');
        if (ph) ph.innerHTML = html;
    });


document.addEventListener('DOMContentLoaded', () => {

    // --- AUTH GUARD ---
    // Must be logged in to check out. api.js exposes isLoggedIn().
    if (!isLoggedIn()) {
        window.location.href = '/pages/login.html';
        return;
    }

    // ────────────────────────────────────────────────────────
    // 1. DYNAMIC CART RENDERING
    //    (Still reads the localStorage cart for display in Week 1.
    //     Ari is moving the cart into the DB this week — once that
    //     lands, this render can switch to `await api.get('/cart')`.)
    // ────────────────────────────────────────────────────────
    const cartContainer   = document.getElementById('cartItemsContainer');
    const subtotalDisplay  = document.getElementById('subtotalDisplay');
    const shippingDisplay  = document.getElementById('shippingDisplay');
    const grandTotalDisplay = document.getElementById('grandTotalDisplay');

    // Display-only shipping rule. The REAL shipping + total are
    // calculated on the server when the order is placed (Week 2).
    const FREE_SHIPPING_AT = 50;
    const FLAT_SHIPPING    = 15.00;

    function loadCartItems() {
        const cartData = JSON.parse(localStorage.getItem('scente_cart')) || [];

        if (cartData.length === 0) {
            cartContainer.innerHTML =
                '<p class="empty-cart-msg">Your shopping bag is empty.</p>';
            subtotalDisplay.textContent  = '$0.00';
            shippingDisplay.textContent  = '$0.00';
            grandTotalDisplay.textContent = '$0.00';
            return;
        }

        cartContainer.innerHTML = '';
        let subtotal = 0;

        cartData.forEach(item => {
            const price = parseFloat(item.price) || 0;
            // cart.js uses `qty`; tolerate `quantity` too just in case
            const qty   = parseInt(item.qty ?? item.quantity) || 1;
            const itemTotal = price * qty;
            subtotal += itemTotal;

            cartContainer.insertAdjacentHTML('beforeend', `
                <div class="cart-item">
                    <div class="item-image">
                        <img src="${item.image || ''}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h3 class="heading-md">${item.name}</h3>
                        <p class="text-sm text-secondary">Size: ${item.size || '—'}</p>
                        <p class="text-sm text-secondary">Qty: ${qty}</p>
                    </div>
                    <div class="item-price text-lg font-medium">$${itemTotal.toFixed(2)}</div>
                </div>
            `);
        });

        const shipping = (subtotal === 0 || subtotal >= FREE_SHIPPING_AT)
            ? 0
            : FLAT_SHIPPING;

        subtotalDisplay.textContent   = `$${subtotal.toFixed(2)}`;
        shippingDisplay.textContent   = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        grandTotalDisplay.textContent = `$${(subtotal + shipping).toFixed(2)}`;
    }

    loadCartItems();


    // ────────────────────────────────────────────────────────
    // 2. ORDER SUBMISSION → POST /api/orders
    // ────────────────────────────────────────────────────────
    const form         = document.querySelector('form');
    const modal        = document.getElementById('orderModal');
    const overlay      = document.getElementById('orderOverlay');
    const orderDisplay = document.getElementById('orderNumberDisplay');
    const cardRadio    = document.getElementById('cardRadio'); // may be null

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Don't let anyone check out with an empty bag.
        const cartData = JSON.parse(localStorage.getItem('scente_cart')) || [];
        if (cartData.length === 0) {
            showToast?.('Your bag is empty.', 'error');
            return;
        }

        // Disable the button so a double-click can't place two orders.
        const submitBtn = form.querySelector('button[type="submit"], .btn-place-order');
        if (submitBtn) submitBtn.disabled = true;

        // Collect the shipping/payment details from the form.
        const formData = new FormData(form);
        const f = Object.fromEntries(formData.entries());

        // Card radio may not exist on the page yet — default to COD.
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
            // api.post attaches the JWT and handles 401 automatically.
            const result = await api.post('/orders', payload);

            // Show the REAL order number the server generated.
            const orderNumber = result.orderNumber;
            orderDisplay.textContent = `Order number ${orderNumber}`;

            // Cart was cleared in the DB; clear the local copy too,
            // and refresh the navbar badge.
            localStorage.removeItem('scente_cart');
            if (typeof updateCartBadge === 'function') updateCartBadge();

            // Show the confirmation modal.
            modal.classList.add('active');
            overlay.classList.add('active');

        } catch (err) {
            // api.js already showed a toast for 401/500/validation.
            console.error('Order failed:', err);
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});