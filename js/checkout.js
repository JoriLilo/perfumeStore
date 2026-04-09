// 1. Load the Footer
fetch('/components/footer.html')
    .then(res => res.text())
    .then(html => {
    document.getElementById('footer-placeholder').innerHTML = html;
    });

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const modal = document.getElementById('orderModal');
    const overlay = document.getElementById('orderOverlay');
    const orderDisplay = document.getElementById('orderNumberDisplay');

    // Function to generate a random order code (e.g., F + 14 random digits)
    function generateOrderCode() {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
        let randomDigits = "";
        for (let i = 0; i < 14; i++) {
            randomDigits += Math.floor(Math.random() * 10);
        }
        return randomLetter + randomDigits;
    }

    // Listen for the Place Order form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        // Generate and display the new random code
        const newCode = generateOrderCode();
        orderDisplay.textContent = `Order number ${newCode}`;
        
        // Show the modal and the dark overlay
        modal.classList.add('active');
        overlay.classList.add('active');
    });

    // --- PAYMENT TOGGLE LOGIC ---
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