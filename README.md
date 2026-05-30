# Scenté — Luxury Fragrance E-Commerce

A full-featured luxury perfume e-commerce platform built with vanilla HTML, CSS, and JavaScript on the frontend, and ASP.NET Core with MySQL on the backend.

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [MySQL 8.0+](https://dev.mysql.com/downloads/)
- [Node.js](https://nodejs.org/) (optional, for http-server)
- VS Code with Live Server extension (port 5501)

---

## Backend Setup

1. Clone the repository and navigate to the API folder:
```bash
cd Scente.API
```

2. Create `appsettings.Development.json` in the project root (this file is git-ignored):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ScenteDb;User=root;Password=YOUR_PASSWORD;"
  },
  "Jwt": {
    "Key": "your-secret-key-minimum-32-characters-long",
    "Issuer": "ScenteAPI",
    "Audience": "ScenteClient"
  }
}
```

3. Run migrations and seed the database:
```bash
dotnet ef database update
```

4. Start the API:
```bash
dotnet run
```

The API runs on `http://localhost:5123`. Swagger UI is available at `http://localhost:5123/swagger`.

---

## Frontend Setup

Open the project root in VS Code and start Live Server. Make sure Live Server is set to port 5501 (already configured in `.vscode/settings.json`).

Open `http://127.0.0.1:5501/index.html` in your browser.

---

## Seeded Data

The database is automatically seeded with:
- 59 luxury and niche perfumes across 15 brands
- Product volumes with correct sizes and prices per brand
- 3 promo codes: `SCENTE10` (10%), `SUMMER20` (20%), `VIP30` (30%)

To create an admin account, register normally then update the role directly in MySQL:
```sql
UPDATE Users SET Role = 'Admin' WHERE Email = 'your@email.com';
```

---

## Project Structure
├── index.html
├── components/
│   ├── navbar.html
│   └── footer.html
├── pages/
│   ├── shop.html
│   ├── details.html
│   ├── cart.html
│   ├── checkout.html
│   ├── wishlist.html
│   ├── order.html
│   ├── profile.html
│   ├── login.html
│   ├── register.html
│   └── admin.html
├── css/
│   └── shared.css (+ page-specific stylesheets)
├── js/
│   ├── api.js          — fetch wrapper, JWT headers, error handling
│   ├── cart.js         — cart logic, navbar/footer loader
│   ├── auth.js         — register, login, validation
│   ├── index.js        — homepage featured products
│   ├── shop.js         — filters, sorting, pagination
│   ├── details.js      — product detail, reviews, volume picker
│   ├── wishlist.js     — wishlist page
│   ├── cartDetails.js  — cart page, promo codes
│   ├── checkout.js     — order creation, confirmation modal
│   ├── order.js        — order history
│   ├── profile.js      — profile form, password change
│   ├── admin.js        — admin panel
│   └── toast.js        — toast notifications
└── Controllers/
├── AuthController.cs
├── ProductController.cs
├── CartController.cs
├── OrdersController.cs
├── WishlistController.cs
├── UsersController.cs
├── AdminController.cs
├── BrandsController.cs
└── ReviewController.cs

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login, returns JWT |
| GET | /api/products | — | List products with filters |
| GET | /api/products/{id} | — | Single product |
| GET | /api/products/related/{id} | — | Related products |
| GET | /api/products/search?q= | — | Full-text search |
| GET | /api/brands | — | Distinct brand list |
| GET | /api/cart | ✓ | Get user cart |
| POST | /api/cart/items | ✓ | Add item to cart |
| PATCH | /api/cart/items/{id} | ✓ | Update quantity |
| DELETE | /api/cart/items/{id} | ✓ | Remove item |
| POST | /api/cart/promo | ✓ | Validate promo code |
| POST | /api/orders | ✓ | Place order |
| GET | /api/orders | ✓ | Order history |
| GET | /api/orders/{id} | ✓ | Order detail |
| GET | /api/orders/counts | ✓ | Tab badge counts |
| GET | /api/orders/{id}/invoice | ✓ | PDF invoice |
| GET | /api/wishlist | ✓ | Get wishlist |
| POST | /api/wishlist/{productId} | ✓ | Add to wishlist |
| DELETE | /api/wishlist/{productId} | ✓ | Remove from wishlist |
| GET | /api/users/me | ✓ | Get profile |
| PUT | /api/users/me | ✓ | Update profile |
| PUT | /api/users/me/password | ✓ | Change password |
| GET | /api/admin/products | Admin | All products |
| POST | /api/admin/products | Admin | Create product |
| PUT | /api/admin/products/{id} | Admin | Update product |
| DELETE | /api/admin/products/{id} | Admin | Delete product |
| GET | /api/admin/orders | Admin | All orders |
| PUT | /api/admin/orders/{id}/status | Admin | Update order status |
| GET | /api/admin/users | Admin | All users |
| GET | /api/admin/stats | Admin | Dashboard stats |