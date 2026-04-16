// ============================================================
// js/order.js — Orders Page Logic
// SCENTÉ · Tab filtering, search, and dynamic order rendering
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ── Auth guard ───────────────────────────────────────────
  const session = JSON.parse(sessionStorage.getItem("session"));

  if (!session || !session.loggedIn) {
    window.location.href = "/pages/login.html";
    return;
  }

  // ── Load orders from localStorage ────────────────────────
function loadUserOrders() {
  const session = JSON.parse(sessionStorage.getItem('session'));
  const userEmail = session?.email;
  
  if (!userEmail) {
    console.warn('No user email found in session');
    return [];
  }
  
  console.log('Loading orders for email:', userEmail);
  
  const orders = [];
  
  // Method 1: Check individual order keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('scente_order_')) {
      try {
        const order = JSON.parse(localStorage.getItem(key));
        
        // Check multiple possible email locations
        const orderEmail = order.customerDetails?.email || 
                          order.customerDetails?.emailAddress ||
                          order.email ||
                          order.userEmail ||
                          '';
        
        console.log('Found order:', order.orderNumber, 'Email:', orderEmail);
        
        if (orderEmail.toLowerCase() === userEmail.toLowerCase()) {
          orders.push(order);
        }
      } catch (e) {
        console.warn('Failed to parse order:', key, e);
      }
    }
  }
  
  // Method 2: Check the global orders array
  const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
  allOrders.forEach(order => {
    const orderEmail = order.customerDetails?.email || 
                      order.email || 
                      order.userEmail || 
                      '';
    
    if (orderEmail.toLowerCase() === userEmail.toLowerCase()) {
      // Check if not already added
      if (!orders.find(o => o.orderNumber === order.orderNumber)) {
        orders.push(order);
      }
    }
  });
  
  console.log('Total orders found for user:', orders.length);
  
  // Sort by date (newest first)
  orders.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return orders;
}

  // ── Create demo orders if none exist ─────────────────────
  function createDemoOrdersIfNeeded(orders) {
    if (orders.length > 0) return orders;
    
    // Create some demo orders for presentation
    const demoOrders = [
      {
        orderNumber: 'SC2025001',
        date: new Date('2025-04-10').toISOString(),
        status: 'delivered',
        payment: 'Paid',
        totalPaid: '$375.00',
        items: [{ name: 'Baccarat Rouge 540', qty: 1, price: 375 }],
        customerDetails: { 
          name: session.name || 'Customer',
          email: session.email 
        }
      },
      {
        orderNumber: 'SC2025042',
        date: new Date('2025-04-14').toISOString(),
        status: 'shipped',
        payment: 'COD',
        totalPaid: '$275.00',
        items: [{ name: 'Angels\' Share', qty: 1, price: 275 }],
        customerDetails: { 
          name: session.name || 'Customer',
          email: session.email 
        }
      },
      {
        orderNumber: 'SC2025015',
        date: new Date('2025-04-15').toISOString(),
        status: 'pending',
        payment: 'Paid',
        totalPaid: '$235.00',
        items: [{ name: 'Aventus', qty: 1, price: 235 }],
        customerDetails: { 
          name: session.name || 'Customer',
          email: session.email 
        }
      }
    ];
    
    // Save demo orders to localStorage
    demoOrders.forEach(order => {
      localStorage.setItem(`scente_order_${order.orderNumber}`, JSON.stringify(order));
    });
    
    return demoOrders;
  }

  let orders = loadUserOrders();
  orders = createDemoOrdersIfNeeded(orders);
  
  let filteredOrders = [...orders];
  let activeFilter = 'all';
  let searchQuery = '';

  // ── DOM refs ─────────────────────────────────────────────
  const tableBody = document.getElementById('orders-table-body');
  const mobileContainer = document.getElementById('mobile-orders-container');
  const tabs = document.querySelectorAll('.otab');
  const searchInput = document.getElementById('searchInput');
  
  const countAll = document.getElementById('count-all');
  const countDelivered = document.getElementById('count-delivered');
  const countShipped = document.getElementById('count-shipped');
  const countPending = document.getElementById('count-pending');

  // ── Helper functions ─────────────────────────────────────
  function getStatusClass(status) {
    const classes = {
      'delivered': 'stat--delivered',
      'shipped': 'stat--shipped',
      'pending': 'stat--pending'
    };
    return classes[status] || 'stat--pending';
  }

  function getPaymentClass(payment) {
    return payment?.toLowerCase() === 'paid' ? 'pay--paid' : 'pay--cod';
  }

  function formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString || 'N/A';
    }
  }

  function getProductNames(order) {
    if (order.items && order.items.length > 0) {
      return order.items.map(item => item.name).join(', ');
    }
    return order.product || 'Fragrance';
  }

  // ── Update counts ────────────────────────────────────────
  function updateCounts() {
    const counts = {
      all: orders.length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      pending: orders.filter(o => o.status === 'pending').length
    };
    
    if (countAll) countAll.textContent = `(${counts.all})`;
    if (countDelivered) countDelivered.textContent = `(${counts.delivered})`;
    if (countShipped) countShipped.textContent = `(${counts.shipped})`;
    if (countPending) countPending.textContent = `(${counts.pending})`;
  }

  // ── Filter orders ────────────────────────────────────────
  function applyFilters() {
    filteredOrders = orders.filter(order => {
      // Status filter
      if (activeFilter !== 'all' && order.status !== activeFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const searchable = [
          order.orderNumber,
          getProductNames(order),
          order.status,
          order.payment,
          order.totalPaid
        ].join(' ').toLowerCase();
        
        if (!searchable.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
    
    renderOrders();
  }

  // ── Render orders ────────────────────────────────────────
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
        </tr>
      `;
      tableBody.innerHTML = emptyHTML;
      if (mobileContainer) mobileContainer.innerHTML = emptyHTML.replace('table', 'div');
      return;
    }
    
    // Render desktop table
    tableBody.innerHTML = filteredOrders.map(order => {
      const productName = getProductNames(order);
      const date = formatDate(order.date);
      
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
          <td><span class="pay ${getPaymentClass(order.payment)}">${order.payment || 'Paid'}</span></td>
          <td><span class="stat ${getStatusClass(order.status)}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
          <td class="c-total">${order.totalPaid}</td>
          <td class="c-inv">
            <a href="#" class="inv-btn" title="Download Invoice" onclick="alert('Invoice for order #${order.orderNumber}')">
              <i class="bi bi-download"></i>
            </a>
          </td>
        </tr>
      `;
    }).join('');
    
    // Render mobile cards
    if (mobileContainer) {
      mobileContainer.innerHTML = filteredOrders.map(order => {
        const productName = getProductNames(order);
        const date = formatDate(order.date);
        
        return `
          <div class="mc" data-status="${order.status}">
            <div class="mc__head">
              <span class="mc__id">#${order.orderNumber}</span>
              <span class="stat ${getStatusClass(order.status)}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
            <div class="mc__product">
              <div class="prod__img"></div>
              <div>
                <span class="mc__pname">${productName}</span>
                <span class="mc__date">${date}</span>
              </div>
            </div>
            <div class="mc__foot">
              <span class="pay ${getPaymentClass(order.payment)}">${order.payment || 'Paid'}</span>
              <span class="mc__total">${order.totalPaid}</span>
              <a href="#" class="inv-btn" onclick="alert('Invoice for order #${order.orderNumber}')">
                <i class="bi bi-download"></i>
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // ── Event listeners ──────────────────────────────────────
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.getAttribute('data-filter');
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  // ── Initialize ───────────────────────────────────────────
  updateCounts();
  renderOrders();
  
  // Also check URL params for filter
  const urlParams = new URLSearchParams(window.location.search);
  const statusFilter = urlParams.get('status');
  if (statusFilter) {
    const tab = document.querySelector(`.otab[data-filter="${statusFilter}"]`);
    if (tab) {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = statusFilter;
      applyFilters();
    }
  }
});