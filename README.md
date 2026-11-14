# NOVA Commerce — Next-Gen E-Commerce Frontend

A modern, high-performance, and responsive e-commerce storefront built with pure modern web technologies (HTML5, Modern CSS3 with Design Tokens, ES6 JavaScript) and seamless PHP/MySQL backend integration.

---

## ✨ Features & Capabilities

- 🎨 **Ultra-Modern Aesthetic & Theme System**:
  - Full Dark Mode and Light Mode support with smooth transition, persisted in `localStorage`.
  - Glassmorphic navigation header with backdrop blur, glowing gradients, and micro-interactions.
  - Fluid responsive layouts tailored for mobile, tablet, laptop, and ultra-wide screens.

- 🛍️ **Slide-Over Cart Drawer (`cart-drawer`)**:
  - Off-canvas drawer sliding from the right edge.
  - Real-time quantity adjustment stepper `[− 1 +]`, item deletion, and clear cart.
  - Interactive **Free Shipping Progress Tracker** (Unlocks free delivery over ₹999).
  - Discount Coupon Code engine supporting `NOVA20` (20% OFF) and `WELCOME10` (10% OFF).

- 🔍 **Live Search & Autocomplete**:
  - Debounced real-time product search with thumbnail previews, category tags, and instant pricing.
  - Category selector filter in the search bar.

- ⚡ **Flash Sale Countdown & Deals**:
  - Dynamic real-time countdown timer targeting midnight.
  - Progress bar showing claimed stock percentage on limited-time deals.

- 👁️ **Quick View Modal**:
  - Two-column preview modal with high-res product photo, detailed specifications pills, star ratings, and instant "Add to Cart" or "Buy Now" triggers.

- ❤️ **Wishlist System**:
  - Persistent favorite items saved with heart animations and badge counters across all pages.

- 📦 **Multi-Step Checkout & Backend Sync**:
  - Pre-fills saved customer delivery address from `localStorage`.
  - Payment method choices (Cash on Delivery, UPI / QR Code).
  - POSTs order payload `{ address, cart, total }` directly to `checkout.php`.
  - Graceful fallback: If opened statically or offline, simulates order creation with a unique Order ID and stores it in order history.

- 📑 **Comprehensive Pages Included**:
  - `index.html` — Flagship storefront with hero slider, quick category rail, flash deals, footwear spotlight, and full catalog.
  - `category.html` — Advanced catalog browse with sidebar filters (price slider, category checkboxes, star rating filter, on-sale toggle, sorting).
  - `orders.html` — Customer order history dashboard with tabs, tracking progress modal, reorder trigger, and printable invoice generator.
  - `signin.html` — Glassmorphic auth portal with Sign In and Sign Up tabs, social login, and password visibility toggle.
  - `contact.html` — Help & Customer Care Hub with searchable FAQ accordion, ticket submission form, and interactive live chat mock.

---

## 🗂️ Project Structure

```text
ecommerce/
├── index.html              # Flagship homepage
├── category.html           # Catalog & filtered browse page
├── category.js             # Filter & sort engine for catalog
├── orders.html             # Order history & package tracking dashboard
├── signin.html             # Customer authentication & registration
├── contact.html            # Customer care, FAQ, and live chat
├── products.js             # Enriched product catalog with ratings & specs
├── javascript.js           # Core application engine (Cart, Wishlist, Themes, Modals)
├── style.css               # Modern CSS design system & responsive styling
├── checkout.php            # PHP backend processing order transactions into MySQL
├── db.php                  # Database connection config
└── backup_old_frontend/    # Complete safety backup of the original version
```

---

## 🚀 How to Run

### Method 1: Instant Browser Preview
Simply double click or open `index.html` in any web browser (Chrome, Edge, Firefox, Safari). All features, cart management, animations, and modals work 100% out of the box with zero build steps or dependencies.

### Method 2: With PHP & MySQL (XAMPP / WAMP / Laragon)
1. Move the folder to your web server root (e.g. `C:\xampp\htdocs\ecommerce`).
2. Start Apache and MySQL in your XAMPP Control Panel.
3. Import your database tables (`orders` and `order_items`) using `db.php`.
4. Open `http://localhost/ecommerce/index.html` in your browser.
