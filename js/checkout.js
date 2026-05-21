fetch('/components/footer.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer-placeholder').innerHTML = html;
    });


document.addEventListener('DOMContentLoaded', () => {

    const session = JSON.parse(sessionStorage.getItem('session'));
    if (!session || !session.loggedIn) {
        window.location.href = '/pages/login.html';
        return;
    }

    // ── Retrieve the JWT for API calls ────────────────────────
    // The token is stored in localStorage by auth.js on login.
    const token = localStorage.getItem('scente_token');


    // ════════════════════════════════════════════════════════
    //  1. RENDER CART ITEMS (from localStorage — unchanged)
    // ════════════════════════════════════════════════════════
    const cartContainer    = document.getElementById('cartItemsContainer');
    const subtotalDisplay  = document.getElementById('subtotalDisplay');
    const shippingDisplay  = document.getElementById('shippingDisplay');
    const grandTotalDisplay = document.getElementById('grandTotalDisplay');

    // Shipping constants — must mirror the server-side logic
    const FREE_SHIPPING_AT = 50;
    const SHIPPING_COST    = 15;

    function loadCartItems() {
        const cartData = JSON.parse(localStorage.getItem('scente_cart')) || [];

        if (cartData.length === 0) {
            cartContainer.innerHTML = '<p class="empty-cart-msg">Your shopping bag is empty.</p>';
            subtotalDisplay.textContent  = '$0.00';
            shippingDisplay.textContent  = `$${SHIPPING_COST.toFixed(2)}`;
            grandTotalDisplay.textContent = '$0.00';
            return;
        }

        cartContainer.innerHTML = '';
        let subtotal = 0;

        cartData.forEach(item => {
            const price     = parseFloat(item.price) || 0;
            const qty       = parseInt(item.quantity || item.qty) || 1;
            const itemTotal = price * qty;
            subtotal += itemTotal;

            cartContainer.insertAdjacentHTML('beforeend', `
                <div class="cart-item">
                    <div class="item-image">
                        <img src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'">
                    </div>
                    <div class="item-details">
                        <h3 class="heading-md">${item.name}</h3>
                        <p class="text-sm text-secondary">Size: ${item.size || '50ml'}</p>
                        <p class="text-sm text-secondary">Qty: ${qty}</p>
                    </div>
                    <div class="item-price text-lg font-medium">$${itemTotal.toFixed(2)}</div>
                </div>
            `);
        });

        const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_COST;
        const total    = subtotal + shipping;

        subtotalDisplay.textContent   = `$${subtotal.toFixed(2)}`;
        shippingDisplay.textContent   = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        grandTotalDisplay.textContent = `$${total.toFixed(2)}`;
    }

    loadCartItems();


    // ════════════════════════════════════════════════════════
    //  2. PAYMENT TOGGLE (Post / Card)
    // ════════════════════════════════════════════════════════
    const postRadio  = document.getElementById('payPost');
    const cardRadio  = document.getElementById('payCard');
    const labelPost  = document.getElementById('labelPost');
    const labelCard  = document.getElementById('labelCard');
    const cardFields = document.getElementById('cardDetailsForm');

    function togglePayment() {
        if (cardRadio.checked) {
            cardFields.classList.remove('d-none');
            labelCard.classList.add('active');
            labelPost.classList.remove('active');
            cardFields.querySelectorAll('input').forEach(i => i.required = true);
        } else {
            cardFields.classList.add('d-none');
            labelPost.classList.add('active');
            labelCard.classList.remove('active');
            cardFields.querySelectorAll('input').forEach(i => i.required = false);
        }
    }

    postRadio.addEventListener('change', togglePayment);
    cardRadio.addEventListener('change', togglePayment);


    // ════════════════════════════════════════════════════════
    //  3. FORM SUBMIT — POST to /api/orders
    // ════════════════════════════════════════════════════════
    const form        = document.querySelector('form');
    const modal       = document.getElementById('orderModal');
    const overlay     = document.getElementById('orderOverlay');
    const orderDisplay = document.getElementById('orderNumberDisplay');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Collect shipping + payment fields from the form
        const formData = new FormData(form);

        const orderPayload = {
            fullName     : formData.get('fullName')     || '',
            addressLine1 : formData.get('addressLine1') || '',
            addressLine2 : formData.get('addressLine2') || '',
            city         : formData.get('city')         || '',
            postalCode   : formData.get('postalCode')   || '',
            country      : formData.get('country')      || '',
            phone        : formData.get('phone')        || '',
            paymentMethod: cardRadio.checked ? 'card' : 'cod'
        };

        try {
            // ── Call the real API ─────────────────────────────
            const response = await fetch('/api/orders', {
                method : 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                    // Attach JWT so [Authorize] passes on the server
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                // Show the server's error message if available
                const err = await response.json().catch(() => ({}));
                alert(err.message || 'Something went wrong. Please try again.');
                return;
            }

            const data = await response.json();

            // ── Success ───────────────────────────────────────
            // Show the real order number from the API in the modal
            orderDisplay.textContent = `Order number ${data.orderNumber}`;

            // Clear localStorage cart so badge updates immediately
            localStorage.removeItem('scente_cart');
            // Update the cart badge in the navbar
            if (typeof updateCartBadge === 'function') updateCartBadge();

            // Show confirmation modal + overlay
            modal.classList.add('active');
            overlay.classList.add('active');

        } catch (err) {
            console.error('Order submission failed:', err);
            alert('Network error — please check your connection and try again.');
        }
    });

});