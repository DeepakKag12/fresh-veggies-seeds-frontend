# Fresh Veggies — Frontend SPA

Responsive, mobile-first Single Page Application (SPA) for **Fresh Veggies**, an e-commerce platform specializing in non-GMO vegetable/flower seeds, combo gardening kits, and organic soil across India. Built with React 18, React Router v6, Tailwind CSS, and Framer Motion.

---

## 1. Quick Start

### Installation
```bash
cd frontend
npm install
```

### Environment Configuration
```bash
cp .env.example .env
```
Populate `.env` with:
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MSG91_WIDGET_ID=your_msg91_widget_id
REACT_APP_MSG91_TOKEN_AUTH=your_msg91_token_auth
```

### Available Scripts
```bash
npm start   # Starts React development server on port 3000 (proxies to http://localhost:5000)
npm run build # Generates optimized production build in build/ (0 warnings, 0 lint errors)
```

---

## 2. Modern Folder Structure

```text
frontend/src/
├── App.jsx                     # Router, layout shell, and react-hot-toast container
├── index.jsx                   # React 18 createRoot & provider hierarchy
├── index.css                   # Tailwind directives & CSS custom design tokens
├── animations.css              # Custom keyframe definitions for botanical micro-animations
├── components/
│   ├── NavbarNew.jsx           # Responsive header with search bar & dynamic cart pill
│   ├── CartDrawer.jsx          # Slide-out interactive shopping cart drawer
│   ├── WishlistDrawer.jsx      # Slide-out wishlist drawer with out-of-stock guard
│   ├── BottomNav.jsx           # Mobile fixed bottom navigation bar
│   ├── WhatsAppButton.jsx      # Floating WhatsApp support button
│   ├── PageLoader.jsx          # Botanical loading screen
│   ├── Pagination.jsx          # Accessible pagination controls
│   ├── PrivateRoute.jsx        # Authenticated route guard
│   ├── admin/                  # Centralized admin suite
│   │   ├── AdminBottomNav.jsx  # Mobile admin bottom navigation bar
│   │   ├── AdminHeader.jsx     # Admin top bar with notification bell & profile
│   │   ├── AdminNotificationBell.jsx # Admin real-time notification alerts
│   │   ├── AdminRoute.jsx      # Admin role verification route guard
│   │   ├── AdminSidebar.jsx    # Responsive desktop navigation drawer
│   │   └── dashboard/          # Metric cards, quick actions & charts
│   ├── checkout/
│   │   └── GuestMobileOtpStep.jsx # Embedded MSG91 guest mobile OTP component
│   ├── storefront/             # UI cards, carousels, variant pickers
│   └── ui/                     # Primitives: buttons, inputs, badge, auth-switch
├── context/
│   ├── AuthContext.jsx         # User state, JWT storage, login, logout, and me
│   ├── CartContext.jsx         # Cart state, local/remote sync, line modifications
│   └── SettingsContext.jsx     # Global store configuration and trust pillars
├── hooks/admin/
│   ├── useAdminDashboard.js    # Data fetching & state hook for dashboard
│   └── useAdminOrders.js       # Workflow & filtering hook for order management
├── pages/                      # Application route screens
│   ├── Storefront.jsx          # Main landing page with hero banners & collections
│   ├── ProductDetails.jsx      # Sticky details gallery, variant picker, PIN checker
│   ├── Cart.jsx                # Full-page cart view
│   ├── Checkout.jsx            # Multi-step checkout with embedded OTP
│   ├── LoginPage.jsx           # Sign-in page
│   ├── RegisterPage.jsx        # Sign-up page
│   ├── MyOrders.jsx            # Customer order history & tracking
│   └── admin/                  # Admin management screens
└── utils/
    ├── api.jsx                 # Axios instance with cache, dedupe & interceptors
    ├── cache.js                # In-memory frontend cache store
    ├── locationService.js      # Browser GPS & reverse geocoding
    ├── msg91.js                # MSG91 widget script loader & client bridge
    ├── passwordPolicy.js       # Password validation regex
    └── pincodeService.js       # India Post PIN code lookup and validation
```

---

## 3. Core Features
- **Botanical Ugaoo Design System:** Earthy greens, warm amber gold, botanical accents, and Lucide React SVG icons (zero pictorial emojis).
- **Embedded Guest SMS OTP Checkout:** Reduces mobile cart abandonment by converting guests to authenticated accounts during checkout.
- **Atomic Multi-Variant Packaging:** Package selection (e.g. 50, 100 seeds) with real-time stock and price adjustments.
- **Dual-Mode Cart Hydration:** Seamless transition from guest LocalStorage to authenticated MongoDB cloud cart on sign-in.
- **Out-of-Stock Guarding:** Immediate visual feedback with badges, disabled actions, and toast notifications.
- **Zero-Warning Production Standard:** Minified bundle (`288.36 kB` JS, `23.12 kB` CSS) with zero ESLint/compiler warnings.
