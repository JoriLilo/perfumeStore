// ============================================================
// js/order.js — Orders Page Logic
// Parfum · Tab filtering, search, and dynamic order rendering
//
// Orders are stored in localStorage under "orders" as an array.
// When checkout creates an order, it should push to this array.
// For now, demo data is seeded if no orders exist yet.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ── Auth guard ───────────────────────────────────────────
  const session = JSON.parse(sessionStorage.getItem("session"));

  if (!session || !session.loggedIn) {
    window.location.href = "login.html";
    return;
  }

  // ── DOM refs ─────────────────────────────────────────────
  const tableBody    = document.querySelector(".otable tbody");
  const mobileCards  = document.querySelector(".mcards");
  const tabs         = document.querySelectorAll(".otab");
  const searchInput  = document.getElementById("searchInput");

  // ── Load orders (from localStorage or seed demo data) ────
  let orders = JSON.parse(localStorage.getItem("orders")) || [];

  // Filter only this user's orders
  orders = orders.filter(o => o.userEmail === session.email);

  // If the user has no orders yet, seed demo data so the page isn't empty
  if (orders.length === 0) {
    orders = [
      {
        id: "#00123",
        product: "Chanel N°5 Eau de Parfum",
        date: "June 1, 2025",
        payment: "Paid",
        status: "delivered",
        total: "$89.99",
        userEmail: session.email,
        imgClass: "prod__img--1"
      },
      {
        id: "#00118",
        product: "Dior Miss Dior Blooming",
        date: "May 14, 2025",
        payment: "COD",
        status: "shipped",
        total: "$54.00",
        userEmail: session.email,
        imgClass: "prod__img--2"
      },
      {
        id: "#00105",
        product: "Tom Ford Black Orchid",
        date: "April 22, 2025",
        payment: "Paid",
        status: "pending",
        total: "$120.50",
        userEmail: session.email,
        imgClass: "prod__img--3"
      }
    ];
    localStorage.setItem("orders", JSON.stringify(orders));
  }

  // ── Render helpers ───────────────────────────────────────

  // Payment badge class
  function payClass(payment) {
    return payment.toLowerCase() === "paid" ? "pay--paid" : "pay--cod";
  }

  // Status badge class
  function statClass(status) {
    return `stat--${status}`;
  }

  // Status display label (capitalize first letter)
  function statLabel(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // Invoice SVG icon (reused in both table and cards)
  const invoiceSVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>`;


  // ── Render orders into table + mobile cards ──────────────
  function renderOrders(list) {
    // Clear existing content
    tableBody.innerHTML = "";
    mobileCards.innerHTML = "";

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:48px 24px; color:#c8a0a8; font-family:'Jost',sans-serif; font-size:14px;">
            No orders found.
          </td>
        </tr>`;
      mobileCards.innerHTML = `
        <div style="text-align:center; padding:48px 24px; color:#c8a0a8; font-family:'Jost',sans-serif; font-size:14px;">
          No orders found.
        </div>`;
      return;
    }

    list.forEach(order => {
      // — Desktop table row —
      const tr = document.createElement("tr");
      tr.dataset.status = order.status;
      tr.innerHTML = `
        <td class="c-id">${order.id}</td>
        <td>
          <div class="prod">
            <div class="prod__img ${order.imgClass || ""}"></div>
            <span class="prod__name">${order.product}</span>
          </div>
        </td>
        <td class="c-date">${order.date}</td>
        <td><span class="pay ${payClass(order.payment)}">${order.payment}</span></td>
        <td><span class="stat ${statClass(order.status)}">${statLabel(order.status)}</span></td>
        <td class="c-total">${order.total}</td>
        <td class="c-inv">
          <a href="#" class="inv-btn" title="Download Invoice">${invoiceSVG}</a>
        </td>`;
      tableBody.appendChild(tr);

      // — Mobile card —
      const card = document.createElement("div");
      card.className = "mc";
      card.dataset.status = order.status;
      card.innerHTML = `
        <div class="mc__head">
          <span class="mc__id">${order.id}</span>
          <span class="stat ${statClass(order.status)}">${statLabel(order.status)}</span>
        </div>
        <div class="mc__product">
          <div class="prod__img ${order.imgClass || ""}"></div>
          <div>
            <span class="mc__pname">${order.product}</span>
            <span class="mc__date">${order.date}</span>
          </div>
        </div>
        <div class="mc__foot">
          <span class="pay ${payClass(order.payment)}">${order.payment}</span>
          <span class="mc__total">${order.total}</span>
          <a href="#" class="inv-btn">${invoiceSVG}</a>
        </div>`;
      mobileCards.appendChild(card);
    });
  }

  // ── Update tab counts ────────────────────────────────────
  function updateTabCounts(list) {
    const counts = { all: list.length, delivered: 0, shipped: 0, pending: 0 };
    list.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

    tabs.forEach(tab => {
      const filter = tab.dataset.filter;
      const countEl = tab.querySelector(".otab__n");
      if (countEl) {
        countEl.textContent = `(${counts[filter] ?? 0})`;
      }
    });
  }

  // ── Initial render ───────────────────────────────────────
  renderOrders(orders);
  updateTabCounts(orders);

  // ── Tab filtering ────────────────────────────────────────
  let activeFilter = "all";

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Update active tab style
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      activeFilter = tab.dataset.filter;
      applyFilters();
    });
  });

  // ── Search ───────────────────────────────────────────────
  searchInput.addEventListener("input", () => {
    applyFilters();
  });

  // ── Combined filter + search ─────────────────────────────
  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();

    const filtered = orders.filter(order => {
      // Tab filter
      const matchesTab = (activeFilter === "all" || order.status === activeFilter);

      // Search filter — match across id, product name, date, total
      const matchesSearch = !query ||
        order.id.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query) ||
        order.date.toLowerCase().includes(query) ||
        order.total.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });

    renderOrders(filtered);
  }
});