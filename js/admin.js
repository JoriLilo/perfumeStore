// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let editingId       = null;  // id of product being edited (null = adding new)
let deleteId        = null;  // id of product pending deletion
let currentOrderKey = null;

let searchQuery      = "";
let orderSearchQuery = "";
let userSearchQuery  = "";


// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await renderProducts();
  await updateDashboard();
  renderOrders();
  renderUsers();

  const modal = document.getElementById("viewOrderModal");
  if (modal) modal.addEventListener("click", e => {
    if (e.target.id === "viewOrderModal") closeOrderModal();
  });
});


// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", function () {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    this.classList.add("active");

    const target = this.textContent.trim().toLowerCase();
    document.querySelectorAll(".section").forEach(section => {
      section.classList.toggle("active", section.id === target);
    });
  });
});


// ─────────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────────
document.getElementById("search-input")
  ?.addEventListener("input", function () { searchQuery = this.value.toLowerCase(); renderProducts(); });

document.getElementById("order-search-input")
  ?.addEventListener("input", function () { orderSearchQuery = this.value.toLowerCase(); renderOrders(); });

document.getElementById("user-search-input")
  ?.addEventListener("input", function () { userSearchQuery = this.value.toLowerCase(); renderUsers(); });


// ─────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────
async function updateDashboard() {
  const stats = await api.get('/admin/stats');

  document.getElementById("total-products").textContent = stats.products;
  document.getElementById("total-users").textContent    = stats.users;
  document.getElementById("total-orders").textContent   = stats.orders;
  document.getElementById("total-revenue").textContent  = "$" + stats.revenue.toFixed(2);
}


// ─────────────────────────────────────────────
//  PRODUCTS
// ─────────────────────────────────────────────
async function renderProducts() {
  const result    = await api.get('/admin/products');
  const products  = result.data;
  const tableBody = document.getElementById("products-table-body");
  tableBody.innerHTML = "";

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery)  ||
    p.brand.toLowerCase().includes(searchQuery) ||
    String(p.id).includes(searchQuery)
  );

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">No results found</td></tr>`;
    return;
  }

  filtered.forEach(product => {
    const stockClass = product.stock < 5 ? "stock-danger" : product.stock < 10 ? "stock-warning" : "stock-good";
    const status     = product.status || "active";

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
        <a href="#" class="action-link edit"   onclick="editProduct(${product.id})">Edit</a>
        <a href="#" class="action-link delete" onclick="deleteProduct(${product.id})">Delete</a>
      </td>
      <td><span class="status-badge ${status}">${status}</span></td>
    `;
    tableBody.appendChild(row);
  });
}


// ── Product modal ──────────────────────────────
function openModal() {
  editingId = null;
  document.getElementById("add-product-form").reset();
  document.getElementById("modal-title").textContent = "Add New Product";
  document.querySelector(".btn-submit").textContent  = "Add Product";
  document.getElementById("addProductModal").classList.add("active");
}

function closeModal() {
  editingId = null;
  document.getElementById("modal-title").textContent = "Add New Product";
  document.querySelector(".btn-submit").textContent  = "Add Product";
  document.getElementById("addProductModal").classList.remove("active");
}

document.getElementById("addProductModal")
  ?.addEventListener("click", e => { if (e.target.id === "addProductModal") closeModal(); });


// ── Save product (add or update) ──────────────
async function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById("add-product-form");

  const requiredFields = ["name", "brand", "price", "stock", "category", "gender"];
  let hasErrors = false;

  requiredFields.forEach(field => {
    const input   = form.elements[field];
    const errorEl = document.getElementById("err-" + field);
    const empty   = input.value.trim() === "";

    input.classList.toggle("input-error", empty);
    errorEl?.classList.toggle("visible", empty);
    if (empty) hasErrors = true;
  });

  if (hasErrors) return;

  const productData = {
    name:        form.elements["name"].value,
    brand:       form.elements["brand"].value,
    gender:      form.elements["gender"].value,
    status:      form.elements["status"].value || "active",
    price:       Number(form.elements["price"].value),
    stock:       Number(form.elements["stock"].value),
    category:    form.elements["category"].value,
    image:       form.elements["image"].value,
    description: form.elements["description"].value,
    topNotes:    form.elements["topNotes"]?.value    || "",
    middleNotes: form.elements["middleNotes"]?.value || "",
    baseNotes:   form.elements["baseNotes"]?.value   || "",
  };

  if (editingId !== null) {
    await api.put(`/admin/products/${editingId}`, productData);
  } else {
    await api.post('/admin/products', productData);
  }

  await renderProducts();
  await updateDashboard();
  closeModal();
}


// ── Edit ──────────────────────────────────────
async function editProduct(id) {
  const product = await api.get(`/admin/products/${id}`);
  editingId     = id;

  const form = document.getElementById("add-product-form");
  form.elements["name"].value        = product.name;
  form.elements["brand"].value       = product.brand;
  form.elements["price"].value       = product.price;
  form.elements["stock"].value       = product.stock;
  form.elements["category"].value    = product.category;
  form.elements["gender"].value      = product.gender      || "";
  form.elements["status"].value      = product.status      || "active";
  form.elements["image"].value       = product.image       || "";
  form.elements["description"].value = product.description || "";

  document.getElementById("modal-title").textContent = "Edit Product";
  document.querySelector(".btn-submit").textContent  = "Update Product";
  document.getElementById("addProductModal").classList.add("active");
}


// ── Delete ────────────────────────────────────
const deleteModal = document.getElementById("deleteConfirmModal");

async function deleteProduct(id) {
  const product = await api.get(`/admin/products/${id}`);
  deleteId      = id;

  document.getElementById("delete-product-id").textContent          = product.id;
  document.getElementById("delete-product-name").textContent        = product.name;
  document.getElementById("delete-product-brand").textContent       = product.brand;
  document.getElementById("delete-product-category").textContent    = product.category;
  document.getElementById("delete-product-stock").textContent       = product.stock;
  document.getElementById("delete-product-price").textContent       = `$${product.price}`;
  document.getElementById("delete-product-description").textContent = product.description || "—";
  document.getElementById("delete-product-image").textContent       = product.image       || "No image";
  document.getElementById("delete-product-status").textContent      = product.status      || "active";

  deleteModal.classList.add("active");
}

async function confirmDeletion() {
  await api.delete(`/admin/products/${deleteId}`);
  await renderProducts();
  await updateDashboard();
  deleteModal.classList.remove("active");
}

function cancelDeletion() {
  deleteModal.classList.remove("active");
}

deleteModal?.addEventListener("click", e => { if (e.target === deleteModal) cancelDeletion(); });


// ─────────────────────────────────────────────
//  ORDERS — kept as localStorage for now (Kristi's job)
// ─────────────────────────────────────────────
function buildOrderMetrics() {
  const orderCounts = {};
  let totalOrders   = 0;
  let totalRevenue  = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("scente_order_")) continue;

    try {
      const order = JSON.parse(localStorage.getItem(key));
      if (!order) continue;

      totalOrders++;
      totalRevenue += parseFloat(String(order.totalPaid || "").replace("$", "")) || 0;

      const email = (order.customerDetails?.email || "").toLowerCase().trim();
      if (email) orderCounts[email] = (orderCounts[email] || 0) + 1;
    } catch {
      console.warn("Could not parse order:", key);
    }
  }

  return { totalOrders, totalRevenue, orderCounts };
}

async function renderOrders() {
  const tableBody = document.getElementById("orders-table-body");
  tableBody.innerHTML = "";

  try {
    const result = await api.get(`/admin/orders${orderSearchQuery ? '?search=' + encodeURIComponent(orderSearchQuery) : ''}`);
    const orders = result.data || [];

    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">No results found</td></tr>`;
      return;
    }

    orders.forEach(order => {
      const date   = new Date(order.date).toLocaleDateString("en-US");
      const status = order.status || "pending";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>#${order.orderNumber}</td>
        <td>${order.customer}</td>
        <td>${date}</td>
        <td>$${Number(order.totalPaid).toFixed(2)}</td>
        <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
        <td><a href="#" class="action-link edit" onclick="viewOrder('${order.orderNumber}')">View</a></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Could not load orders</td></tr>`;
  }
}

async function viewOrder(orderNumber) {
  try {
    const orders = await api.get(`/admin/orders?search=${encodeURIComponent(orderNumber)}`);
    const order  = orders.data?.find(o => o.orderNumber === orderNumber);
    if (!order) return;

    const full = await api.get(`/admin/orders/${order.id}`);
    currentOrderKey = full.orderNumber;

    document.getElementById("order-id").textContent       = "#" + full.orderNumber;
    document.getElementById("order-customer").textContent = full.customer;
    document.getElementById("order-date").textContent     = new Date(full.date).toLocaleDateString("en-US");
    document.getElementById("order-total").textContent    = `$${Number(full.totalPaid).toFixed(2)}`;

    const statusEl = document.getElementById("order-status");
    const status   = full.status || "pending";
    statusEl.className = `status-badge ${status}`;
    statusEl.innerHTML = `
      <select id="order-status-select" onchange="updateOrderStatus(${full.id}, this.value)">
        <option value="pending"   ${status === "pending"   ? "selected" : ""}>Pending</option>
        <option value="shipped"   ${status === "shipped"   ? "selected" : ""}>Shipped</option>
        <option value="delivered" ${status === "delivered" ? "selected" : ""}>Delivered</option>
      </select>`;

    const itemsList = document.getElementById("order-items");
    if (full.items && full.items.length > 0) {
      itemsList.innerHTML = full.items.map(item =>
        `<li>${item.productName} — ${item.quantity} × $${Number(item.price).toFixed(2)}</li>`
      ).join("");
    } else {
      itemsList.innerHTML = "<li>No items</li>";
    }

    document.getElementById("viewOrderModal").classList.add("active");
  } catch (err) {
    console.warn("Could not load order:", err);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
    renderOrders();
  } catch (err) {
    console.warn("Could not update status:", err);
  }
}

function closeOrderModal() {
  document.getElementById("viewOrderModal").classList.remove("active");
}



async function renderUsers() {
  const tableBody = document.getElementById("users-table-body");

  tableBody.innerHTML = "";

  try {
    const result = await api.get(`/admin/users${userSearchQuery ? '?search=' + encodeURIComponent(userSearchQuery) : ''}`);
    const users  = result.data || [];

    if (users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">No results found</td></tr>`;
      return;
    }

    users.forEach((user, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.firstName} ${user.lastName}</td>
        <td>${user.email}</td>
        <td>${user.joinDate ? new Date(user.joinDate).toLocaleDateString("en-US") : "—"}</td>
        <td>${user.role}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Could not load users</td></tr>`;
  }
}