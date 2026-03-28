// Grab the modal element once so we can reuse it everywhere
const modal = document.getElementById("addProductModal");

// Tracks which product is being edited. null = adding new, number = editing existing
let editingIndex = null;

// Opens the modal and resets editingIndex to null (we assume adding unless editProduct sets it)
function openModal(){
  editingIndex = null;
  modal.classList.add("active");
}

// Closes the modal and resets everything back to default state
function closeModal(){
  modal.classList.remove("active");
  const submitBtn = document.querySelector(".btn-submit");
  submitBtn.textContent = "Add Product"; // reset button text
  editingIndex = null; // reset editing state
}

// Close modal when clicking the dark backdrop (not the white box)
modal.addEventListener("click", function(event){
  if(event.target === modal){
    closeModal();
  }
});

// Nav link click — switch active link and show matching section
const links = document.querySelectorAll(".nav-link");
links.forEach(link => {
  link.addEventListener("click", function(){
    // remove active from all links
    links.forEach(l => l.classList.remove("active"));
    // add active to clicked link
    this.classList.add("active");

    // get section id from link text e.g "Products" → "products"
    const sectionId = this.textContent.trim().toLowerCase();
    const sections = document.querySelectorAll(".section");

    // hide all sections, show only the matching one
    sections.forEach(section => {
      if(section.id === sectionId){
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });
  });
});

// Handles both adding and editing a product
function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById("add-product-form");
  const requiredFields = ["name", "brand", "price", "stock", "category"];
  let hasErrors = false;

  // Validate required fields — add red border and show error message if empty
  requiredFields.forEach(field => {   
    const input = form.elements[field];
    const errorEl = document.getElementById("err-" + field);
    if (input.value.trim() === "") {
      input.classList.add("input-error");
      errorEl.classList.add("visible");
      hasErrors = true; 
    } else {
      input.classList.remove("input-error");
      errorEl.classList.remove("visible");
    }
  });

  if(hasErrors === false) {
    // Load existing products from localStorage
    const products = JSON.parse(localStorage.getItem("products")) || [];

    // Collect form data into an object
    const productData = {
      name: form.elements["name"].value,
      brand: form.elements["brand"].value,
      price: Number(form.elements["price"].value),
      stock: Number(form.elements["stock"].value),
      category: form.elements["category"].value,
      image: form.elements["image"].value,
      description: form.elements["description"].value
    };

    if(editingIndex !== null) {
      // EDIT MODE — overwrite the product at editingIndex
      products[editingIndex] = productData;
      editingIndex = null; // reset after saving
    } else {
      // ADD MODE — push new product to the array
      products.push(productData);
    }

    // Save updated array back to localStorage
    localStorage.setItem("products", JSON.stringify(products));

    // Refresh the table to show updated data
    renderProducts();
    form.reset();
    closeModal();
  }
} 

// Reads products from localStorage and builds the table rows dynamically
function renderProducts() {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const tableBody = document.getElementById("products-table-body");
  
  // Clear existing rows before re-rendering
  tableBody.innerHTML = "";

  products.forEach((product, index) => {
    const row = document.createElement("tr");

    // determine stock level color
    let stockClass = "";
    if(Number(product.stock) < 5) {
      stockClass = "stock-danger";
    } else if(Number(product.stock) < 10) {
      stockClass = "stock-warning";
    } else {
      stockClass = "stock-good";
    }

    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.brand}</td>
      <td>${product.category}</td>
      <td>$${product.price}</td>
      <td class="${stockClass}">${product.stock}</td>
      <td>
        <a href="#" class="action-link edit" onclick="editProduct(${index})">Edit</a>
        <a href="#" class="action-link delete" onclick="deleteProduct(${index})">Delete</a>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update dashboard after rendering — outside forEach so it runs once
  updateDashboard();
}

// Render products as soon as the page loads
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
});

// Removes a product from localStorage by index and refreshes the table
function deleteProduct(index) {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  products.splice(index, 1); // remove 1 item at that index
  localStorage.setItem("products", JSON.stringify(products));
  renderProducts();
}

// Prefills the modal form with existing product data for editing
function editProduct(index) {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const product = products[index];
  
  // Save the index so handleSubmit knows which product to overwrite
  editingIndex = index;
  
  // Fill in the form fields with existing product data
  const form = document.getElementById("add-product-form");
  form.elements["name"].value = product.name;
  form.elements["brand"].value = product.brand;
  form.elements["price"].value = product.price;
  form.elements["stock"].value = product.stock;
  form.elements["category"].value = product.category;
  form.elements["image"].value = product.image || "";
  form.elements["description"].value = product.description || "";

  // Change button text to make it clear we are updating not adding
  const submitBtn = form.querySelector(".btn-submit");
  submitBtn.textContent = "Update Product";

  // Open modal directly to avoid resetting editingIndex
  modal.classList.add("active");
}

// Updates dashboard stat cards from localStorage
function updateDashboard(){
  const products = JSON.parse(localStorage.getItem("products")) || [];
  document.getElementById("total-products").textContent = products.length;
}

