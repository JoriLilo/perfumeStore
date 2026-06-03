// ============================================================
// js/order.js — Orders Page Logic
// SCENTÉ · Connected to real API
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

  // ── Auth guard ───────────────────────────────────────────
  const session = JSON.parse(sessionStorage.getItem("session"));
  if (!session || !session.loggedIn) {
    window.location.href = "/pages/login.html";
    return;
  }

  // ── Load orders from API ──────────────────────────────────
  async function loadUserOrders() {
    try {
      return await api.get('api/orders');
    } catch (err) {
      console.warn('Could not load orders from API:', err);
      return [];
    }
  }

  // ── Load counts from API ──────────────────────────────────
  async function loadCounts() {
    try {
      return await api.get('api/orders/counts');
    } catch (err) {
      return { all: 0, pending: 0, shipped: 0, delivered: 0 };
    }
  }

  let orders = await loadUserOrders();
  let filteredOrders = [...orders];
  let activeFilter = 'all';
  let searchQuery = '';

  // ── DOM refs ─────────────────────────────────────────────
  const tableBody = document.getElementById('orders-table-body');
  const mobileContainer = document.getElementById('mobile-orders-container');
  const tabs = document.querySelectorAll('.otab');
  const searchInput = document.getElementById('searchInput');

  const countAll       = document.getElementById('count-all');
  const countDelivered = document.getElementById('count-delivered');
  const countShipped   = document.getElementById('count-shipped');
  const countPending   = document.getElementById('count-pending');

  // ── Update tab counts from API ───────────────────────────
  async function updateCounts() {
    const counts = await loadCounts();
    if (countAll)       countAll.textContent       = `(${counts.all})`;
    if (countDelivered) countDelivered.textContent = `(${counts.delivered})`;
    if (countShipped)   countShipped.textContent   = `(${counts.shipped})`;
    if (countPending)   countPending.textContent   = `(${counts.pending})`;
  }

  // ── Helpers ───────────────────────────────────────────────
  function getStatusClass(status) {
    const classes = {
      delivered: 'stat--delivered',
      shipped:   'stat--shipped',
      pending:   'stat--pending'
    };
    return classes[status] || 'stat--pending';
  }

  function getPaymentClass(payment) {
    return (payment || '').toLowerCase() === 'card' ? 'pay--paid' : 'pay--cod';
  }

  function formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateString || 'N/A';
    }
  }

  function getProductNames(order) {
    if (order.items && order.items.length > 0) {
      return order.items.map(i => i.productName).join(', ');
    }
    return 'Fragrance';
  }

  function formatTotal(total) {
    return typeof total === 'number' ? `$${total.toFixed(2)}` : total || '$0.00';
  }

  // ── Filter ────────────────────────────────────────────────
  function applyFilters() {
    filteredOrders = orders.filter(order => {
      if (activeFilter !== 'all' && order.status !== activeFilter) return false;
      if (searchQuery) {
        const searchable = [
          order.orderNumber,
          getProductNames(order),
          order.status,
          order.paymentMethod
        ].join(' ').toLowerCase();
        if (!searchable.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
    renderOrders();
  }

  // ── Render desktop table + mobile cards ───────────────────
  function renderOrders() {
    if (!tableBody) return;

    if (filteredOrders.length === 0) {
      const emptyHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:64px 24px;">
            <div style="color:#c8a0a8; font-family:Jost,sans-serif;">
              <i class="bi bi-box" style="font-size:48px; display:block; margin-bottom:16px; opacity:0.5;"></i>
              <p style="font-size:15px; margin-bottom:8px;">No orders found</p>
              <a href="/pages/shop.html" style="font-size:13px; color:#d4808a; text-decoration:underline;">Start shopping</a>
            </div>
          </td>
        </tr>`;
      tableBody.innerHTML = emptyHTML;
      if (mobileContainer) mobileContainer.innerHTML = '';
      return;
    }

    tableBody.innerHTML = filteredOrders.map(order => {
      const productName = getProductNames(order);
      const date        = formatDate(order.date);
      const total       = formatTotal(order.totalPaid);
      const statusCap   = order.status.charAt(0).toUpperCase() + order.status.slice(1);

      return `
        <tr data-status="${order.status}">
          <td class="c-id">#${order.orderNumber}</td>
          <td>
            <div class="prod">
              <div class="prod__img"></div>
              <span class="prod__name">${productName}</span>
            </div>
          </td>
          <td class="c-date">${date}</td>
          <td><span class="pay ${getPaymentClass(order.paymentMethod)}">${order.paymentMethod || 'COD'}</span></td>
          <td><span class="stat ${getStatusClass(order.status)}">${statusCap}</span></td>
          <td class="c-total">${total}</td>
          <td class="c-inv">
            <button class="inv-btn" title="Download Invoice" onclick="downloadInvoice(${order.id})">
              <i class="bi bi-download"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    if (mobileContainer) {
      mobileContainer.innerHTML = filteredOrders.map(order => {
        const productName = getProductNames(order);
        const date        = formatDate(order.date);
        const total       = formatTotal(order.totalPaid);
        const statusCap   = order.status.charAt(0).toUpperCase() + order.status.slice(1);

        return `
          <div class="mc" data-status="${order.status}">
            <div class="mc__head">
              <span class="mc__id">#${order.orderNumber}</span>
              <span class="stat ${getStatusClass(order.status)}">${statusCap}</span>
            </div>
            <div class="mc__product">
              <div class="prod__img"></div>
              <div>
                <span class="mc__pname">${productName}</span>
                <span class="mc__date">${date}</span>
              </div>
            </div>
            <div class="mc__foot">
              <span class="pay ${getPaymentClass(order.paymentMethod)}">${order.paymentMethod || 'COD'}</span>
              <span class="mc__total">${total}</span>
              <button class="inv-btn" title="Download Invoice" onclick="downloadInvoice(${order.id})">
                <i class="bi bi-download"></i>
              </button>
            </div>
          </div>`;
      }).join('');
    }
  }

  // ── Tab listeners ─────────────────────────────────────────
  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.getAttribute('data-filter');

      // Re-fetch filtered orders from API when tab changes
      try {
        const status = activeFilter === 'all' ? '' : activeFilter;
        orders = await api.get(`api/orders${status ? '?status=' + status : ''}`);
      } catch {
        orders = [];
      }

      filteredOrders = [...orders];
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      renderOrders();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  // ── Init ──────────────────────────────────────────────────
  updateCounts();
  renderOrders();

  // Check URL params for pre-selected filter
  const urlParams = new URLSearchParams(window.location.search);
  const statusFilter = urlParams.get('status');
  if (statusFilter) {
    const tab = document.querySelector(`.otab[data-filter="${statusFilter}"]`);
    if (tab) tab.click();
  }
});


async function downloadInvoice(orderId) {
  const session = JSON.parse(sessionStorage.getItem("session"));
  try {
    const response = await fetch(`http://localhost:5123/api/orders/${orderId}/invoice`, {
      headers: { "Authorization": `Bearer ${session.token}` }
    });

    if (!response.ok) {
      showToast("Could not load invoice.", "error");
      return;
    }

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);

    // Open in a popup modal
    const modal = document.getElementById("invoice-modal");
    const frame = document.getElementById("invoice-frame");
    frame.src = url;
    modal.classList.add("active");

  } catch (err) {
    showToast("Could not load invoice.", "error");
    console.warn("Invoice error:", err);
  }
}

function closeInvoiceModal() {
  const modal = document.getElementById("invoice-modal");
  const frame = document.getElementById("invoice-frame");
  modal.classList.remove("active");
  frame.src = "";
}