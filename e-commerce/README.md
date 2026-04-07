# 🛍️ ShopZone – eCommerce Product Service

Full-stack eCommerce product listing system with **React.js** frontend and **Express.js** backend.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js (`.js`) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Cache | node-cache (in-memory) |
| API Docs | Swagger / OpenAPI |
| Frontend | React.js (`.jsx`) + React Router |

---

## 📁 Project Structure

```
ecommerce/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # DB schema with indexes
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # Prisma client singleton
│   │   │   ├── cache.js          # In-memory cache
│   │   │   └── swagger.js        # OpenAPI config
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── categoryController.js
│   │   │   └── reviewController.js
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT middleware
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── utils/
│   │   │   ├── helpers.js        # slugify, SKU gen, pagination
│   │   │   └── seed.js           # 14 products + categories
│   │   └── index.js              # Express app entry
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx
    │   │   │   └── AdminLayout.jsx
    │   │   └── ui/
    │   │       └── ProductCard.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx    # JWT auth state
    │   ├── pages/
    │   │   ├── ProductListPage.jsx
    │   │   ├── ProductDetailPage.jsx
    │   │   └── admin/
    │   │       ├── AdminLoginPage.jsx
    │   │       ├── AdminDashboard.jsx
    │   │       ├── AdminProductList.jsx
    │   │       ├── AdminProductForm.jsx
    │   │       └── AdminCategoryList.jsx
    │   ├── services/
    │   │   └── api.js             # Axios service layer
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html                 # Full meta tags
    └── package.json
```

---

## ⚙️ Setup Instructions

### 1. PostgreSQL Database

```bash
# Create database
psql -U postgres
CREATE DATABASE ecommerce_db;
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Edit .env with your DB credentials
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ecommerce_db"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (14 products, 6 categories, 1 admin)
npm run prisma:seed

# Start dev server
npm run dev
```

Backend runs at: **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🌐 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products?q=nike&page=1` | Search products with pagination |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/:identifier` | Product detail (slug/SKU/UUID) |
| GET | `/api/products/:id/reviews` | Product reviews |
| POST | `/api/products/:id/reviews` | Submit review |
| GET | `/api/categories` | All categories |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login → JWT |
| GET | `/api/auth/me` | Current user |

### Admin (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/products` | All products (incl. inactive) |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Soft delete |
| GET | `/api/admin/categories` | All categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |

### Docs
- **Swagger UI**: http://localhost:5000/api/docs
- **Health**: http://localhost:5000/health

---

## 🔐 Default Admin Credentials

```
Email:    admin@shop.com
Password: Admin@123
```

---

## ⚡ Performance Features

- **DB Indexing** – Composite & single indexes on slug, sku, categoryId, price, isActive, brand
- **In-memory Cache** – 2min TTL for product list, 5min for detail
- **Gzip Compression** – ~70% bandwidth reduction
- **Soft Delete** – Products deactivated, not permanently deleted
- **Singleton Prisma** – No duplicate DB connections in dev
- **Lazy Image Loading** – Frontend `loading="lazy"` on all product images
- **Rate Limiting** – 100 req/15min public, 10 req/15min auth

## 🚀 Deployment (Render.com - Free)

1. Push to GitHub
2. Create **PostgreSQL** service on Render
3. Create **Web Service** → connect repo → set `BACKEND_DIR=backend`
4. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
5. Build command: `npm install && npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed`
6. Start command: `npm start`
