document.addEventListener("DOMContentLoaded", ()=> {
    renderWishlist();
    updateCartBadge()
});
function renderWishlist() {
    const wishlist=JSON.parse(localStorage.getItem("wishlist"))||[];
    const products=JSON.parse(localStorage.getItem("products"))||[];
    const grid=document.getElementById("wishlist-grid");
    const emptyState=document.getElementById("wishlist-empty");
    const countEl=document.getElementById("wishlist-count");
    if(!grid)return;
    if(countEl) {
        countEl.textContent=`${wishlist.length} ${wishlist.length===1?"item":"items"}`
    }
    if(wishlist.length===0) {
        grid.innerHTML="";
        if(emptyState)emptyState.style.display="block";
        return
    }
    if(emptyState)emptyState.style.display="none";
    grid.innerHTML="";
    const wishlistProducts=JSON.parse(localStorage.getItem("wishlistProducts"))|| {
    };
    wishlist.forEach(id=> {
        const product=products.find(p=>String(p.id)===String(id))||wishlistProducts[id];
        if(!product)return;
        const card=document.createElement("div");
        card.className="product-card";
        card.dataset.productId=id;
        const defaultVolume=product.volumes&&product.volumes[0]||"50ml";
        card.innerHTML=`\n      <div class="product-card__image-wrap">\n        <img\n          class="product-card__img"\n          src="${product.image||"https://via.placeholder.com/375x500?text=No+Image"}"\n          alt="${product.name}"\n          onerror="this.src='https://via.placeholder.com/375x500?text=No+Image'"\n        >\n        <button\n          class="product-card__wishlist active"\n          aria-label="Remove from wishlist"\n          onclick="removeFromWishlist('${id}', this)"\n        >\n          <i class="bi bi-heart-fill" style="color: var(--color-accent);"></i>\n        </button>\n        <button\n          class="product-card__quick-add"\n          onclick="handleAddToCart('${id}')"\n        >Add to Cart</button>\n      </div>\n\n      <p class="product-card__brand">${product.brand||""}</p>\n      <h3 class="product-card__name">\n        <a href="details.html?id=${id}">${product.name}</a>\n      </h3>\n      <p class="product-card__price">$${Number(product.price).toFixed(2)}</p>\n\n      <div class="wishlist-card-actions">\n        <button\n          class="btn btn--primary btn--full btn--sm"\n          onclick="handleAddToCart('${id}')"\n        >Add to Cart</button>\n        <button\n          class="btn btn--secondary btn--full btn--sm"\n          onclick="removeFromWishlist('${id}', this)"\n        >Remove</button>\n      </div>\n    `;
        grid.appendChild(card)
    })
}
function handleAddToCart(productId) {
    const products=JSON.parse(localStorage.getItem("products"))||[];
    const wishlistProducts=JSON.parse(localStorage.getItem("wishlistProducts"))|| {
    };
    const product=products.find(p=>String(p.id)===String(productId))||wishlistProducts[String(productId)];
    if(!product) {
        showToast("Product no longer available.", "error");
        return
    }
    const volume=product.volumes&&product.volumes[0]||"50ml";
    addToCart(product, volume)
}
function removeFromWishlist(productId, triggerEl) {
    let wishlist=JSON.parse(localStorage.getItem("wishlist"))||[];
    wishlist=wishlist.filter(id=>String(id)!==String(productId));
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    const card=document.querySelector(`.product-card[data-product-id="${productId}"]`);
    if(card) {
        card.style.transition="opacity 0.3s ease";
        card.style.opacity="0";
        setTimeout(()=> {
            card.remove();
            checkIfEmpty()
        }, 300)
    }
    showToast("Removed from wishlist", "info");
    const countEl=document.getElementById("wishlist-count");
    if(countEl) {
        countEl.textContent=`${wishlist.length} ${wishlist.length===1?"item":"items"}`
    }
}
function checkIfEmpty() {
    const grid=document.getElementById("wishlist-grid");
    const emptyState=document.getElementById("wishlist-empty");
    const countEl=document.getElementById("wishlist-count");
    if(!grid||!emptyState)return;
    const remaining=grid.querySelectorAll(".product-card").length;
    if(remaining===0) {
        emptyState.style.display="block";
        if(countEl)countEl.textContent="0 items"
    }
}