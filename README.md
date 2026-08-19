# 🍽️ Bombay Chowpati — Restaurant Management System

> **100% Pure Veg Mumbai Chaat & Fast Food** · Hyderabad, Telangana  
> A full-stack, real-time restaurant ordering & management platform for **Bombay Chowpati**.

[![Live Site](https://img.shields.io/badge/Live%20Site-bombaychowpati.com-orange?style=flat-square)](https://bombaychowpati.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=flat-square)](./client)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=flat-square)](./server)
[![DB](https://img.shields.io/badge/Database-MongoDB-brightgreen?style=flat-square)](#)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-black?style=flat-square)](#)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Admin Panel](#-admin-panel)
- [Customer Flows](#-customer-flows)
- [API Routes](#-api-routes)
- [SEO](#-seo)
- [Deployment](#-deployment)

---

## 🌟 Overview

Bombay Chowpati is a complete restaurant digital ecosystem covering:

- **Customer-facing** ordering app (QR scan, dine-in, takeaway, home delivery, schedule orders)
- **Real-time kitchen** display with live order tracking via WebSockets
- **Admin dashboard** for orders, menu, inventory, payments, and customer management
- **SEO-optimised** public website with JSON-LD structured data, sitemap, and GA4

---

## ✨ Features

### Customer App
| Feature | Details |
|---|---|
| QR-code ordering | Scan table QR → browse menu → place order |
| Order modes | Dine-In · Takeaway · Home Delivery |
| Scheduled orders | Set future delivery/pickup time |
| Payment options | Pay at Counter · Cash on Delivery · UPI |
| Real-time tracking | Live order status via Socket.IO |
| Customer auth | OTP-free register/login with JWT |
| Order history | Full past orders per customer |
| Cart | Add/remove/customise items with quantity controls |
| Catering enquiry | Live chaat counter booking form |

### Admin Panel
| Module | Details |
|---|---|
| **Dashboard** | Revenue, orders, top dishes — daily/weekly/monthly charts |
| **Kitchen / Live Orders** | Real-time queue with order type filters (Dine-In / Takeaway / Delivery) |
| **Order History** | Full searchable log with status filters and Excel export |
| **Menu Management** | Categories, items, images (Cloudinary), pricing, availability toggle |
| **Inventory Management** | Stock tracking, low-stock alerts, Excel export |
| **Table Management** | Add/edit tables, generate QR codes |
| **Payment Reports** | Revenue breakdown with Excel export |
| **Customer Directory** | Browse customers, view full order profile |
| **User Management** | Add/remove admin staff accounts |
| **Catering Enquiries** | View and manage catering requests |

---

## 🛠️ Tech Stack

### Frontend (`/client`)
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Realtime | Socket.IO Client |
| Charts | Recharts |
| Icons | Lucide React |
| Excel export | ExcelJS |
| HTTP | Native Fetch API |

### Backend (`/server`)
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Realtime | Socket.IO |
| Auth | JWT + bcryptjs |
| Image uploads | Cloudinary |
| QR Codes | qrcode |
| Environment | dotenv |
| Dev server | nodemon |

---

## 📁 Project Structure

```
Bombay-chowpati/
├── client/                         # React frontend (Vite)
│   ├── public/
│   │   ├── logo.png                # Brand logo (favicon + OG image)
│   │   ├── sitemap.xml             # Main sitemap
│   │   ├── sitemap-images.xml      # Image sitemap
│   │   └── robots.txt              # Crawler directives
│   └── src/
│       ├── admin/
│       │   ├── components/         # Admin UI components
│       │   └── pages/
│       │       ├── Dashboard.jsx
│       │       ├── LiveOrders.jsx  # Kitchen display screen
│       │       ├── OrderHistory.jsx
│       │       ├── MenuManagement.jsx
│       │       ├── InventoryManagement.jsx
│       │       ├── TableManagement.jsx
│       │       ├── PaymentReports.jsx
│       │       ├── CustomerDirectory.jsx
│       │       ├── UserManagement.jsx
│       │       └── Login.jsx
│       ├── customer/
│       │   ├── components/         # Customer UI components
│       │   └── pages/
│       │       ├── Landing.jsx     # Homepage
│       │       ├── Menu.jsx        # Digital menu & cart
│       │       ├── Account.jsx     # Customer account
│       │       └── OrderStatus.jsx # Real-time order tracking
│       ├── config/
│       │   ├── restaurant.js       # Restaurant config (name, phone, etc.)
│       │   └── restaurantData.js   # Static content (features, reviews)
│       ├── context/
│       │   ├── AuthContext.jsx     # Admin auth
│       │   ├── CustomerAuthContext.jsx
│       │   ├── CustomerUIContext.jsx
│       │   ├── SocketContext.jsx
│       │   └── ToastContext.jsx
│       ├── hooks/
│       │   └── useSEO.js           # Dynamic SEO meta tag updater
│       └── utils/
│           └── csvExporter.js      # Excel (.xlsx) export utility
│
└── server/                         # Express backend
    ├── models/
    │   ├── Order.js
    │   ├── MenuItem.js
    │   ├── Category.js
    │   ├── Customer.js
    │   ├── Table.js
    │   ├── User.js
    │   ├── InventoryLog.js
    │   └── CateringEnquiry.js
    ├── routes/
    │   ├── auth.js                 # Admin login/register
    │   ├── customerAuth.js         # Customer login/register
    │   ├── orders.js               # Full order lifecycle
    │   ├── menu.js                 # Menu & categories
    │   ├── customers.js            # Customer CRUD
    │   ├── inventory.js            # Inventory management
    │   ├── tables.js               # Table & QR management
    │   ├── catering.js             # Catering enquiries
    │   └── upload.js               # Cloudinary image upload
    ├── middleware/
    ├── config/
    ├── index.js                    # Entry point (Express + Socket.IO)
    ├── seedMenu.js                 # Seed script for menu data
    └── seedCustomersAndOrders.js   # Seed script for demo data
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image uploads)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/bombay-chowpati.git
cd Bombay-chowpati
```

### 2. Set up the backend
```bash
cd server
npm install
cp .env.example .env   # fill in your values (see below)
npm run dev
```

### 3. Set up the frontend
```bash
cd ../client
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev
```

The app will be available at:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`

### 4. Seed demo data (optional)
```bash
cd server
node seedMenu.js                  # seeds menu categories & items
node seedCustomersAndOrders.js    # seeds demo customers & orders
```

---

## 🔐 Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/bombay-chowpati
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## 🖥️ Admin Panel

Access at `/admin/login`

| Route | Page |
|---|---|
| `/admin/login` | Staff login |
| `/admin/dashboard` | Analytics & overview |
| `/admin/kitchen` | Live kitchen orders queue |
| `/admin/orders` | Full order history |
| `/admin/menu` | Menu & category management |
| `/admin/inventory` | Inventory tracking |
| `/admin/tables` | Table & QR code management |
| `/admin/payments` | Payment reports |
| `/admin/customers` | Customer directory |
| `/admin/users` | Staff user management |

---

## 👤 Customer Flows

| Route | Page |
|---|---|
| `/` | Landing page |
| `/menu` | Browse menu (walk-in / delivery) |
| `/menu/:tableId` | QR scan → dine-in ordering |
| `/account` | Customer login / profile / order history |
| `/order-status/:orderId` | Real-time order tracking |

---

## 🔌 API Routes

| Prefix | Description |
|---|---|
| `POST /api/auth/*` | Admin authentication |
| `POST /api/customer-auth/*` | Customer authentication |
| `GET/POST/PATCH /api/orders/*` | Order lifecycle |
| `GET/POST/PUT/DELETE /api/menu/*` | Menu items & categories |
| `GET/POST /api/customers/*` | Customer profiles |
| `GET/POST /api/inventory/*` | Inventory logs |
| `GET/POST /api/tables/*` | Table & QR codes |
| `POST /api/catering` | Catering enquiry submission |
| `POST /api/upload` | Cloudinary image upload |

---

## 🔍 SEO

The project includes a full production SEO setup:

| Asset | Location | Purpose |
|---|---|---|
| Meta tags + JSON-LD | `client/index.html` | Title, description, OG, Twitter, 5 schema types |
| Dynamic SEO hook | `src/hooks/useSEO.js` | Per-page title/description/canonical updates |
| Sitemap | `public/sitemap.xml` | Page index for crawlers |
| Image sitemap | `public/sitemap-images.xml` | Food photo indexing |
| robots.txt | `public/robots.txt` | Crawler permissions, bad bot blocking |
| GA4 | `index.html` | Analytics (replace `G-XXXXXXXXXX`) |
| GSC | `index.html` | Search Console verification (replace token) |

**After deploying:**
1. Replace `G-XXXXXXXXXX` in `index.html` with your **GA4 Measurement ID**
2. Replace `REPLACE_WITH_YOUR_GSC_VERIFICATION_TOKEN` with your **Google Search Console** token
3. Submit `sitemap.xml` and `sitemap-images.xml` in GSC

---

## 🌐 Deployment

The system is deployed on **Render** with the domain `bombaychowpati.com`.

### Backend (Render Web Service)
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Environment:** Set all `server/.env` variables in Render dashboard

### Frontend (Render Static Site)
- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`
- **Environment:** Set `VITE_API_URL` to your Render backend URL

### Important: `public/logo.png`
Before deploying, copy `src/assets/logo2.png` → `public/logo.png` so the favicon and OG image are served correctly:
```bash
cp client/src/assets/logo2.png client/public/logo.png
```

---

## 📞 Contact

**Bombay Chowpati - Chaat Bhandar**  
MPM Mall, Abids Road, Hanuman Tekdi, Abids  
Hyderabad – 500001, Telangana  
📞 +91 72078 36300  
🌐 [bombaychowpati.com](https://bombaychowpati.com)  
📸 [@bombay_chowpati_](https://www.instagram.com/bombay_chowpati_)

---

*Built with ❤️ for authentic Mumbai chaat lovers in Hyderabad.*
#   B u l k  
 