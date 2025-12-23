<<<<<<< HEAD
# Fresh Veggies Frontend

React-based frontend for Fresh Veggies e-commerce platform with Material-UI components.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment:
```bash
cp .env.example .env
```

3. Configure `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm start
```

Application will open at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── Navbar.js
│   ├── Footer.js
│   ├── ProductCard.js
│   ├── PrivateRoute.js
│   └── AdminRoute.js
│
├── context/           # Context providers
│   ├── AuthContext.js
│   └── CartContext.js
│
├── pages/            # Page components
│   ├── Home.js
│   ├── Shop.js
│   ├── ProductDetail.js
│   ├── Cart.js
│   ├── Checkout.js
│   ├── Login.js
│   ├── Register.js
│   ├── MyOrders.js
│   ├── OrderDetail.js
│   ├── ComboOffers.js
│   ├── About.js
│   ├── Contact.js
│   └── admin/
│       ├── AdminDashboard.js
│       ├── AdminProducts.js
│       ├── AdminCategories.js
│       ├── AdminCombos.js
│       ├── AdminOrders.js
│       └── AdminUsers.js
│
├── utils/            # Utilities
│   └── api.js        # Axios instance
│
├── App.js            # Main app with routes
└── index.js          # Entry point
```

## Features

### Customer Features
- Product browsing with search and filters
- Shopping cart management
- User authentication
- Order placement and tracking
- Responsive design for mobile and desktop

### Admin Features
- Dashboard with statistics
- Product management (add, edit, delete)
- Category management
- Combo pack management
- Order status updates
- User management

## Routes

### Public Routes
- `/` - Home page
- `/shop` - Product listing
- `/product/:id` - Product details
- `/combos` - Combo packs
- `/cart` - Shopping cart
- `/login` - Login page
- `/register` - Register page
- `/about` - About us
- `/contact` - Contact us

### Protected Routes (Requires Login)
- `/checkout` - Checkout page
- `/orders` - User orders
- `/orders/:id` - Order details

### Admin Routes (Requires Admin Role)
- `/admin/dashboard` - Admin dashboard
- `/admin/products` - Product management
- `/admin/categories` - Category management
- `/admin/combos` - Combo management
- `/admin/orders` - Order management
- `/admin/users` - User management

## State Management

### AuthContext
- User authentication state
- Login/logout functionality
- User profile management

### CartContext
- Shopping cart state
- Add/remove items
- Update quantities
- Calculate totals
- Local storage persistence

## Styling

Uses Material-UI with custom theme:
- Primary color: Green (#4caf50)
- Secondary color: Orange (#ff9800)
- Custom component styles
- Responsive breakpoints

## API Integration

All API calls use Axios with:
- Base URL from environment variables
- Automatic token attachment
- Error handling
- Response interceptors

## Development Tips

1. **Hot Reload**: Changes auto-refresh in development
2. **Console Errors**: Check browser console for errors
3. **Network Tab**: Monitor API calls in browser dev tools
4. **React DevTools**: Install for component inspection

## Environment Variables

```
REACT_APP_API_URL=http://localhost:5000/api
```

Add `REACT_APP_` prefix to all custom environment variables.

## Building for Production

1. Update API URL in `.env` to production backend
2. Run `npm run build`
3. Deploy `build` folder to hosting service
4. Configure routing (React Router needs all routes to serve index.html)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

**Blank Page**
- Check console for errors
- Verify API URL is correct
- Ensure backend is running

**Authentication Issues**
- Clear localStorage
- Check token expiration
- Verify backend authentication

**Styling Issues**
- Clear browser cache
- Check Material-UI version compatibility
=======
# fresh-veggies-seeds-frontend
Full-stack e-commerce platform for selling organic seeds, fertilizers, gardening kits, and combo packs with admin product management.
>>>>>>> 2d0f18f0a4951af63d8a87b2eda1beee6e3f9c5c
