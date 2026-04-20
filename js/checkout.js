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

    // --- 1. DYNAMIC CART RENDERING ---
    const cartContainer = document.getElementById('cartItemsContainer');
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    const grandTotalDisplay = document.getElementById('grandTotalDisplay');
    const shippingCost = 15.00;

    function loadCartItems() {
        // Read from local storage (parse string to array)
        const cartData = JSON.parse(localStorage.getItem('scente_cart')) || [];
        
        // Handle empty cart
        if (cartData.length === 0) {
            cartContainer.innerHTML = '<p class="empty-cart-msg">Your shopping bag is empty.</p>';
            subtotalDisplay.textContent = '$0.00';
            grandTotalDisplay.textContent = '$0.00';
            return;
        }

        cartContainer.innerHTML = ''; 
        let subtotal = 0;

        // Loop through each product and create the HTML structure
        cartData.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 1;
            const itemTotal = price * qty;
            subtotal += itemTotal;

            const itemHTML = `
                <div class="cart-item">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h3 class="heading-md">${item.name}</h3>
                        <p class="text-sm text-secondary">Size: ${item.size}</p>
                        <p class="text-sm text-secondary">Qty: ${qty}</p>
                    </div>
                    <div class="item-price text-lg font-medium">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        // Update Summary displays
        subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
        grandTotalDisplay.textContent = `$${(subtotal + shippingCost).toFixed(2)}`;
    }

    
    loadCartItems();


    // --- 2. ORDER MODAL & DATA SAVING ---
    const form = document.querySelector('form');
    const modal = document.getElementById('orderModal');
    const overlay = document.getElementById('orderOverlay');
    const orderDisplay = document.getElementById('orderNumberDisplay');

    function generateOrderCode() {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
        let randomDigits = "";
        for (let i = 0; i < 14; i++) {
            randomDigits += Math.floor(Math.random() * 10);
        }
        return randomLetter + randomDigits;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        // Generate random code
        const newCode = generateOrderCode();
        orderDisplay.textContent = `Order number ${newCode}`;
        
        // Package the order details for saving
        const formData = new FormData(form);
        const orderCredentials = Object.fromEntries(formData.entries());

        // Get the current user's email from session
        const userEmail = session.email;

        const completedOrder = {
            orderNumber: newCode,
            date: new Date().toISOString(),
            status: 'pending',
            payment: cardRadio.checked ? 'Paid' : 'COD',
            customerDetails: {
                name: orderCredentials.fullName || session?.name || 'Customer',
                email: userEmail,
                address: orderCredentials.addressLine1,
                city: orderCredentials.city,
                country: orderCredentials.country,
                phone: orderCredentials.phone
            },
            items: JSON.parse(localStorage.getItem('scente_cart') || '[]'),
            totalPaid: document.getElementById('grandTotalDisplay').textContent
        };

        // Save to localStorage
        localStorage.setItem(`scente_order_${newCode}`, JSON.stringify(completedOrder));

        console.log('Order saved:', completedOrder);
        //Delete cart
        localStorage.removeItem('scente_cart');

        // Show the modal and the dark overlay
        modal.classList.add('active');
        overlay.classList.add('active');
    });


    // --- 3. PAYMENT TOGGLE LOGIC ---
    const postRadio = document.getElementById('payPost');
    const cardRadio = document.getElementById('payCard');
    const labelPost = document.getElementById('labelPost');
    const labelCard = document.getElementById('labelCard');
    const cardFields = document.getElementById('cardDetailsForm');

    function togglePayment() {
        if (cardRadio.checked) {
            // Show Card Fields
            cardFields.classList.remove('d-none');
            // Update Visuals
            labelCard.classList.add('active');
            labelPost.classList.remove('active');
            
            // Make card fields required if showing
            cardFields.querySelectorAll('input').forEach(input => input.required = true);
        } else {
            // Hide Card Fields
            cardFields.classList.add('d-none');
            // Update Visuals
            labelPost.classList.add('active');
            labelCard.classList.remove('active');
            
            // Remove required if hidden
            cardFields.querySelectorAll('input').forEach(input => input.required = false);
        }
    }

    // Listen for changes
    postRadio.addEventListener('change', togglePayment);
    cardRadio.addEventListener('change', togglePayment);
});