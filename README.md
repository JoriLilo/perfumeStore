# Scenté — Luxury Fragrance E-Commerce

A full-featured luxury perfume e-commerce platform built with vanilla HTML, CSS, and JavaScript on the frontend, with a .NET backend in active development.

---

## What it does

- Browse and filter a catalogue of 40+ luxury and niche fragrances by category, gender, and price
- Full cart system with quantity management, promo codes, and order summaries
- User authentication — register, login, session management, password change
- Wishlist system persisted across pages
- Checkout flow with shipping form and payment toggle (card / cash on delivery)
- Order history page with tab filtering and search
- Admin panel for product management, order tracking, and user overview
- Responsive design across desktop, tablet, and mobile
- Component-based navbar and footer loaded dynamically via fetch

---

## Tech Stack

**Frontend**
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5 for grid and UI components
- Bootstrap Icons
- Google Fonts — Cormorant Garamond, Jost, Great Vibes
- CSS custom properties design system (shared.css)
- localStorage for cart, wishlist, orders, and user data

**Backend** *(in development — separate repo)*
- ASP.NET Core
- REST API with JWT authentication
- Entity Framework Core

---

## Project Structure

```
├── index.html                  # Homepage
├── components/
│   ├── navbar.html             # Shared navbar component
│   └── footer.html             # Shared footer component
├── pages/
│   ├── shop.html               # Product catalogue with filters
│   ├── details.html            # Single product detail page
│   ├── cart.html               # Shopping cart
│   ├── checkout.html           # Checkout with shipping and payment
│   ├── wishlist.html           # Saved products
│   ├── order.html              # Order history
│   ├── profile.html            # User profile and password change
│   ├── login.html              # Authentication
│   ├── register.html           # Account creation
│   └── admin.html              # Admin dashboard
├── css/
│   ├── shared.css              # Design system — variables, typography, components
│   ├── navbar.css
│   ├── footer.css
│   ├── homepage.css
│   ├── shop.css
│   ├── details.css
│   ├── cart.css
│   ├── checkout.css
│   ├── wishlist.css
│   ├── order.css
│   ├── profile.css
│   └── admin.css
├── js/
│   ├── cart.js                 # Cart logic, navbar/footer loader, session sync
│   ├── toast.js                # Toast notification utility
│   ├── auth.js                 # Register, login, validation, password toggle
│   ├── index.js                # Homepage — featured products, wishlist sync
│   ├── shop.js                 # Filtering, sorting, pagination
│   ├── details.js              # Product detail page, accordion, add to cart
│   ├── wishlist.js             # Wishlist page rendering and management
│   ├── cartDetails.js          # Cart page rendering and promo codes
│   ├── checkout.js             # Order creation, payment toggle, confirmation modal
│   ├── order.js                # Order history with tabs, filters, search
│   ├── profile.js              # Profile form, password change, logout
│   ├── admin.js                # Admin panel — products, orders, users
│   └── api.js                  # API utility (fetch wrapper, JWT handling)
└── data/
    └── Perfume.json            # Seed data — 40 products
```

---

## Getting Started

No build step required. Serve the project with any static file server.

Using VS Code Live Server, Python, or Node:

```bash
# Python
python -m http.server 8080

# Node (http-server)
npx http-server .
```

Open `http://localhost:8080` in your browser.

To seed the product catalogue, the app reads from `localStorage`. On first load the admin panel can be used to add products, or you can seed manually by pasting the contents of `data/Perfume.json` into `localStorage['products']` via the browser console:

```javascript
fetch('/data/Perfume.json')
  .then(r => r.json())
  .then(data => localStorage.setItem('products', JSON.stringify(data)));
```

---

## Features in Detail

**Design system** — `shared.css` defines all colours, fonts, spacing, and components as CSS variables. No hardcoded hex values anywhere in page-specific stylesheets.

**Cart** — persisted in `localStorage`. Quantity controls, free shipping threshold at $50, promo code support, and real-time badge updates in the navbar.

**Auth** — client-side validation with regex for email, password strength, and name fields. Session stored in `sessionStorage`. Profile-link in navbar updates based on login state.

**Admin panel** — full CRUD for products with modal forms and delete confirmation. Order management with status updates (Pending / Shipped / Delivered). User overview with order counts.

**Responsive** — fluid grid from 4 columns on desktop to 2 on mobile. Sidebar collapses to a toggle on small screens. Offcanvas mobile navigation.

---

## Backend

The REST API is being built in a separate repository using ASP.NET Core. `js/api.js` is already wired up as the fetch wrapper and will replace localStorage once the backend is live.

---

## Author

Jori — [github.com/JoriLilo](https://github.com/JoriLilo)
