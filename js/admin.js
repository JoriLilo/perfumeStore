// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let editingId       = null;
let deleteId        = null;
let currentOrderKey = null;

let searchQuery      = "";
let orderSearchQuery = "";
let userSearchQuery  = "";


// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

  // ── Auth guard — must be logged in AND admin ──
  const session = JSON.parse(sessionStorage.getItem("session") || "null");
  if (!session || !session.loggedIn) {
    window.location.href = "/pages/login.html";
    return;
  }

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
  try {
    const stats = await api.get("api/admin/stats");

    document.getElementById("total-products").textContent = stats.products  ?? 0;
    document.getElementById("total-users").textContent    = stats.users     ?? 0;
    document.getElementById("total-orders").textContent   = stats.orders    ?? 0;
    document.getElementById("total-revenue").textContent  = "$" + (stats.revenue ?? 0).toFixed(2);
  } catch (err) {
    console.warn("Could not load dashboard stats:", err);
  }
}


// ─────────────────────────────────────────────
//  PRODUCTS
// ─────────────────────────────────────────────
async function renderProducts() {
  const tableBody = document.getElementById("products-table-body");
  tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">Loading…</td></tr>`;

  try {
    const result = await api.get("api/admin/products?pageSize=100");
    const products = result.data ?? [];

    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery)  ||
      p.brand.toLowerCase().includes(searchQuery) ||
      String(p.id).includes(searchQuery)
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">No results found</td></tr>`;
      return;
    }

    tableBody.innerHTML = "";
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
          <a href="#" class="action-link edit"   onclick="editProduct(${product.id}); return false;">Edit</a>
          <a href="#" class="action-link delete" onclick="deleteProduct(${product.id}); return false;">Delete</a>
        </td>
        <td><span class="status-badge ${status}">${status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">Could not load products. Make sure you are logged in as Admin.</td></tr>`;
    console.warn("renderProducts error:", err);
  }
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

  try {
    if (editingId !== null) {
      await api.put(`api/admin/products/${editingId}`, productData);
    } else {
      await api.post("api/admin/products", productData);
    }

    await renderProducts();
    await updateDashboard();
    closeModal();
  } catch (err) {
    console.warn("handleSubmit error:", err);
  }
}


// ── Edit ──────────────────────────────────────
async function editProduct(id) {
  try {
    // Fetch from the public products endpoint since admin GET single isn't separate
    const product = await api.get(`api/products/${id}`);
    editingId = id;

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
  } catch (err) {
    console.warn("editProduct error:", err);
  }
}


// ── Delete ────────────────────────────────────
const deleteModal = document.getElementById("deleteConfirmModal");

async function deleteProduct(id) {
  try {
    const product = await api.get(`api/products/${id}`);
    deleteId = id;

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
  } catch (err) {
    console.warn("deleteProduct error:", err);
  }
}

async function confirmDeletion() {
  try {
    await api.delete(`api/admin/products/${deleteId}`);
    await renderProducts();
    await updateDashboard();
    deleteModal.classList.remove("active");
  } catch (err) {
    console.warn("confirmDeletion error:", err);
  }
}

function cancelDeletion() {
  deleteModal.classList.remove("active");
}

deleteModal?.addEventListener("click", e => { if (e.target === deleteModal) cancelDeletion(); });


// ─────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────
async function renderOrders() {
  const tableBody = document.getElementById("orders-table-body");
  tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Loading…</td></tr>`;

  try {
    const result = await api.get(
      `api/admin/orders${orderSearchQuery ? "?search=" + encodeURIComponent(orderSearchQuery) : ""}`
    );
    const orders = result.data ?? [];

    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">No results found</td></tr>`;
      return;
    }

    tableBody.innerHTML = "";
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
        <td><a href="#" class="action-link edit" onclick="viewOrder('${order.orderNumber}'); return false;">View</a></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Could not load orders.</td></tr>`;
    console.warn("renderOrders error:", err);
  }
}

async function viewOrder(orderNumber) {
  try {
    const result = await api.get(
      `api/admin/orders?search=${encodeURIComponent(orderNumber)}`
    );
    const order = (result.data ?? []).find(o => o.orderNumber === orderNumber);
    if (!order) return;

    const full = await api.get(`api/admin/orders/${order.id}`);
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
    await api.put(`api/admin/orders/${orderId}/status`, { status: newStatus });
    renderOrders();
  } catch (err) {
    console.warn("Could not update status:", err);
  }
}

function closeOrderModal() {
  document.getElementById("viewOrderModal").classList.remove("active");
}


// ─────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────
async function renderUsers() {
  const tableBody = document.getElementById("users-table-body");
  tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Loading…</td></tr>`;

  try {
    const result = await api.get(
      `api/admin/users${userSearchQuery ? "?search=" + encodeURIComponent(userSearchQuery) : ""}`
    );
    const users = result.data ?? [];

    if (users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">No results found</td></tr>`;
      return;
    }

    tableBody.innerHTML = "";
    users.forEach(user => {
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
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Could not load users.</td></tr>`;
    console.warn("renderUsers error:", err);
  }
}