// ============================================================
// js/order.js — Orders Page Logic
// Parfum · Tab filtering, search, and dynamic order rendering
//
// Orders are stored in localStorage under "orders" as an array.
// Each order object should have:
//   { id, product, date, payment, status, total, userEmail }
//
// To add an order from checkout, push to this array:
//   const orders = JSON.parse(localStorage.getItem("orders")) || [];
//   orders.push({ id, product, date, payment, status, total, userEmail });
//   localStorage.setItem("orders", JSON.stringify(orders));
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ── Auth guard ───────────────────────────────────────────
  const session = JSON.parse(sessionStorage.getItem("session"));

  if (!session || !session.loggedIn) {
    window.location.href = "login.html";
    return;
  }

  // ── DOM refs ─────────────────────────────────────────────
  const tableBody   = document.querySelector(".otable tbody");
  const mobileCards = document.querySelector(".mcards");
  const tabs        = document.querySelectorAll(".otab");
  const searchInput = document.getElementById("searchInput");

  // ── Load only this user's orders ─────────────────────────
  const allOrders = JSON.parse(localStorage.getItem("orders")) || [];
  const orders    = allOrders.filter(o => o.userEmail === session.email);

  // ── Helper functions ─────────────────────────────────────

  // Payment badge class
  function payClass(payment) {
    return payment.toLowerCase() === "paid" ? "pay--paid" : "pay--cod";
  }

  // Status badge class
  function statClass(status) {
    return "stat--" + status;
  }

  // Status display label (capitalize first letter)
  function statLabel(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const invoiceSVG = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">'
    + '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>'
    + '<polyline points="14 2 14 8 20 8"/>'
    + '<line x1="12" y1="18" x2="12" y2="12"/>'
    + '<polyline points="9 15 12 18 15 15"/>'
    + '</svg>';

  // ── Empty state ──────────────────────────────────────────
  function emptyHTML() {
    return '<div style="text-align:center; padding:64px 24px; color:#c8a0a8; font-family:Jost,sans-serif;">'
      + '<p style="font-size:15px; margin-bottom:8px;">You have no orders yet.</p>'
      + '<a href="shop.html" style="font-size:13px; color:#d4808a; text-decoration:underline;">Start shopping</a>'
      + '</div>';
  }

  // ── Render ───────────────────────────────────────────────
  function renderOrders(list) {
    tableBody.innerHTML  = "";
    mobileCards.innerHTML = "";

    if (list.length === 0) {
      tableBody.innerHTML  = '<tr><td colspan="7">' + emptyHTML() + '</td></tr>';
      mobileCards.innerHTML = emptyHTML();
      return;
    }

    list.forEach(function (order) {

      // Desktop row
      var tr = document.createElement("tr");
      tr.setAttribute("data-status", order.status);
      tr.innerHTML = ''
        + '<td class="c-id">' + order.id + '</td>'
        + '<td><div class="prod">'
        +   '<div class="prod__img"></div>'
        +   '<span class="prod__name">' + order.product + '</span>'
        + '</div></td>'
        + '<td class="c-date">' + order.date + '</td>'
        + '<td><span class="pay ' + payClass(order.payment) + '">' + order.payment + '</span></td>'
        + '<td><span class="stat ' + statClass(order.status) + '">' + statLabel(order.status) + '</span></td>'
        + '<td class="c-total">' + order.total + '</td>'
        + '<td class="c-inv"><a href="#" class="inv-btn" title="Download Invoice">' + invoiceSVG + '</a></td>';
      tableBody.appendChild(tr);

      // Mobile card
      var card = document.createElement("div");
      card.className = "mc";
      card.setAttribute("data-status", order.status);
      card.innerHTML = ''
        + '<div class="mc__head">'
        +   '<span class="mc__id">' + order.id + '</span>'
        +   '<span class="stat ' + statClass(order.status) + '">' + statLabel(order.status) + '</span>'
        + '</div>'
        + '<div class="mc__product">'
        +   '<div class="prod__img"></div>'
        +   '<div>'
        +     '<span class="mc__pname">' + order.product + '</span>'
        +     '<span class="mc__date">' + order.date + '</span>'
        +   '</div>'
        + '</div>'
        + '<div class="mc__foot">'
        +   '<span class="pay ' + payClass(order.payment) + '">' + order.payment + '</span>'
        +   '<span class="mc__total">' + order.total + '</span>'
        +   '<a href="#" class="inv-btn">' + invoiceSVG + '</a>'
        + '</div>';
      mobileCards.appendChild(card);
    });
  }

  // ── Update tab counts ────────────────────────────────────
  function updateTabCounts(list) {
    var counts = { all: list.length, delivered: 0, shipped: 0, pending: 0 };

    list.forEach(function (o) {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });

    tabs.forEach(function (tab) {
      var filter  = tab.getAttribute("data-filter");
      var countEl = tab.querySelector(".otab__n");
      if (countEl) {
        countEl.textContent = "(" + (counts[filter] || 0) + ")";
      }
    });
  }

  // ── Initial render ───────────────────────────────────────
  renderOrders(orders);
  updateTabCounts(orders);

  // ── Tab filtering ────────────────────────────────────────
  var activeFilter = "all";

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      activeFilter = tab.getAttribute("data-filter");
      applyFilters();
    });
  });

  // ── Search ───────────────────────────────────────────────
  searchInput.addEventListener("input", function () {
    applyFilters();
  });

  // ── Combined filter + search ─────────────────────────────
  function applyFilters() {
    var query = searchInput.value.toLowerCase().trim();

    var filtered = orders.filter(function (order) {
      var matchesTab = (activeFilter === "all" || order.status === activeFilter);
      var matchesSearch = !query
        || order.id.toLowerCase().indexOf(query) !== -1
        || order.product.toLowerCase().indexOf(query) !== -1
        || order.date.toLowerCase().indexOf(query) !== -1
        || order.total.toLowerCase().indexOf(query) !== -1;
      return matchesTab && matchesSearch;
    });

    renderOrders(filtered);
  }

});