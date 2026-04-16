const modal = document.getElementById("addProductModal");
const deleteModal = document.getElementById("deleteConfirmModal");

let editingIndex = null;
let deleteIndex = null;
let searchQuery = "";
let orderSearchQuery = "";
let userSearchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderOrders();
  renderUsers(); 

  const orderModal = document.getElementById("viewOrderModal");

  if (orderModal) {
    orderModal.addEventListener("click", function (e) {
      if (e.target === orderModal) {
        closeOrderModal();
      }
    });
  }
});

const links = document.querySelectorAll(".nav-link");

links.forEach(link => {
  link.addEventListener("click", function () {
    links.forEach(l => l.classList.remove("active"));
    this.classList.add("active");

    const sectionId = this.textContent.trim().toLowerCase();
    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
      section.classList.toggle("active", section.id === sectionId);
    });
  });
});

function updateDashboard() {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  document.getElementById("total-products").textContent = products.length;
}

const searchInput = document.getElementById("search-input");

if (searchInput) {
  searchInput.addEventListener("input", function () {
    searchQuery = this.value.toLowerCase();
    renderProducts();
  });
}

const orderSearchInput = document.getElementById("order-search-input");
if (orderSearchInput) {
  orderSearchInput.addEventListener("input", function () {
    orderSearchQuery = this.value.toLowerCase();
    renderOrders();
  });
}

const userSearchInput = document.getElementById("user-search-input");
if (userSearchInput) {
  userSearchInput.addEventListener("input", function () {
    userSearchQuery = this.value.toLowerCase();
    renderUsers();
  });
}

function renderProducts() {
  let products = JSON.parse(localStorage.getItem("products")) || [];
  const tableBody = document.getElementById("products-table-body");

  tableBody.innerHTML = "";

  const processed = products.map((product, index) => ({
    product,
    index
  }));

  processed.sort((a, b) => b.product.id - a.product.id);

  const filteredProducts = processed.filter(item => {
    const p = item.product;
    return (
      p.name.toLowerCase().includes(searchQuery) ||
      p.brand.toLowerCase().includes(searchQuery) ||
      String(p.id).includes(searchQuery)
    );
  });

  if (filteredProducts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:20px; color:#888;">
          No results found
        </td>
      </tr>
    `;
    updateDashboard();
    return;
  }

  filteredProducts.forEach(item => {
    const product = item.product;
    const index = item.index;

    let stockClass = "";
    if (product.stock < 5) stockClass = "stock-danger";
    else if (product.stock < 10) stockClass = "stock-warning";
    else stockClass = "stock-good";

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.brand}</td>
      <td>${product.category}</td>
      <td>${product.gender || "—"}</td>
      <td>$${product.price}</td>
      <td class="${stockClass}">${product.stock}</td>
      <td>
        <a href="#" class="action-link edit" onclick="editProduct(${index})">Edit</a>
        <a href="#" class="action-link delete" onclick="deleteProduct(${index})">Delete</a>
      </td>
      <td>
        <span class="status-badge ${product.status || "active"}">
          ${product.status || "active"}
        </span>
      </td>
    `;

    tableBody.appendChild(row);
  });

  updateDashboard();
}

function openModal() {
  editingIndex = null;

  const form = document.getElementById("add-product-form");
  form.reset();

  document.getElementById("modal-title").textContent = "Add New Product";
  document.querySelector(".btn-submit").textContent = "Add Product";

  modal.classList.add("active");
}

function closeModal() {
  modal.classList.remove("active");

  document.getElementById("modal-title").textContent = "Add New Product";
  document.querySelector(".btn-submit").textContent = "Add Product";

  editingIndex = null;
}

if (modal) {
  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
  });
}

function handleSubmit(e) {
  e.preventDefault();

  const form = document.getElementById("add-product-form");

  const requiredFields = ["name", "brand", "price", "stock", "category"];
  let hasErrors = false;

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

  if (hasErrors) return;

  const products = JSON.parse(localStorage.getItem("products")) || [];

  const productData = {
    id: Date.now(),
    name: form.elements["name"].value,
    brand: form.elements["brand"].value,
    gender: form.elements["gender"].value || "unisex",
    status: form.elements["status"].value || "active",
    price: Number(form.elements["price"].value),
    stock: Number(form.elements["stock"].value),
    category: form.elements["category"].value,
    image: form.elements["image"].value,
    description: form.elements["description"].value
  };

  if (editingIndex !== null) {
    productData.id = products[editingIndex].id;
    products[editingIndex] = productData;
    editingIndex = null;
  } else {
    products.push(productData);
  }

  localStorage.setItem("products", JSON.stringify(products));

  renderProducts();
  form.reset();
  closeModal();
}

function editProduct(index) {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const product = products[index];

  editingIndex = index;

  const form = document.getElementById("add-product-form");

  form.elements["name"].value = product.name;
  form.elements["brand"].value = product.brand;
  form.elements["price"].value = product.price;
  form.elements["stock"].value = product.stock;
  form.elements["category"].value = product.category;
  form.elements["gender"].value = product.gender || "unisex";
  form.elements["status"].value = product.status || "active";
  form.elements["image"].value = product.image || "";
  form.elements["description"].value = product.description || "";

  document.getElementById("modal-title").textContent = "Edit Product";
  document.querySelector(".btn-submit").textContent = "Update Product";

  modal.classList.add("active");
}

function deleteProduct(index) {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const product = products[index];

  deleteIndex = index;

  document.getElementById("delete-product-id").textContent = product.id;
  document.getElementById("delete-product-name").textContent = product.name;
  document.getElementById("delete-product-brand").textContent = product.brand;
  document.getElementById("delete-product-category").textContent = product.category;
  document.getElementById("delete-product-stock").textContent = product.stock;
  document.getElementById("delete-product-price").textContent = `$${product.price}`;
  document.getElementById("delete-product-description").textContent = product.description || "—";
  document.getElementById("delete-product-image").textContent = product.image || "No image";
  document.getElementById("delete-product-status").textContent = product.status || "active";

  deleteModal.classList.add("active");
}

function confirmDeletion() {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  products.splice(deleteIndex, 1);

  localStorage.setItem("products", JSON.stringify(products));

  renderProducts();
  deleteModal.classList.remove("active");
}

function cancelDeletion() {
  deleteModal.classList.remove("active");
}

if (deleteModal) {
  deleteModal.addEventListener("click", function (event) {
    if (event.target === deleteModal) cancelDeletion();
  });
}

function renderOrders() {
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  const tableBody = document.getElementById("orders-table-body");
  tableBody.innerHTML = "";

  const processed = orders.map((order, index) => ({
    order,
    index
  }));

  processed.sort((a, b) => b.order.id - a.order.id);

  const filteredOrders = processed.filter(item => {
    const o = item.order;
    return (
      String(o.id).includes(orderSearchQuery) ||
      o.customer.toLowerCase().includes(orderSearchQuery) ||
      o.status.toLowerCase().includes(orderSearchQuery)
    );
  });

  if (filteredOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:20px; color:#888;">
          No results found
        </td>
      </tr>`;
    return;
  }

  filteredOrders.forEach(item => {
    const order = item.order;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${order.id}</td>
      <td>${order.customer}</td>
      <td>${order.date}</td>
      <td>$${order.total}</td>
      <td>
        <span class="status-badge ${order.status}">
          ${order.status.toUpperCase()}
        </span>
      </td>
      <td><a href="#" class="action-link edit" onclick="viewOrder(${item.index})">View</a></td>
    `;
    tableBody.appendChild(row);
  });
}

function viewOrder(index) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders[index];

  document.getElementById("order-id").textContent = "#" + order.id;
  document.getElementById("order-customer").textContent = order.customer;
  document.getElementById("order-date").textContent = order.date;
  document.getElementById("order-total").textContent = "$" + order.total;
  document.getElementById("order-status").textContent = order.status;

  const itemsList = document.getElementById("order-items");
  itemsList.innerHTML = "";

  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} - ${item.quantity} x $${item.price}`;
      itemsList.appendChild(li);
    });
  } else {
    itemsList.innerHTML = "<li>No items</li>";
  }

  document.getElementById("viewOrderModal").classList.add("active");
}

function closeOrderModal() {
  document.getElementById("viewOrderModal").classList.remove("active");
}

function renderUsers() {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const tableBody = document.getElementById("users-table-body");
  tableBody.innerHTML = "";

  const processed = users.map((user, index) => ({
    user,
    index
  }));

  processed.sort((a, b) => b.user.id - a.user.id);

  const filteredUsers = processed.filter(item => {
    const u = item.user;
    return (
      String(u.id).includes(userSearchQuery) ||
      u.name.toLowerCase().includes(userSearchQuery) ||
      u.email.toLowerCase().includes(userSearchQuery)
    );
  });

  if (filteredUsers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px; color:#888;">
          No results found
        </td>
      </tr>`;
    return;
  }

  filteredUsers.forEach(item => {
    const user = item.user;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.joinDate}</td>
      <td>${user.orders ? user.orders.length : 0}</td>
    `;
    tableBody.appendChild(row);
  });
}