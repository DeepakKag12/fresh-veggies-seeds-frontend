import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { WishlistProvider } from './context/WishlistContext';
import { ChatProvider } from './context/ChatContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ChatProvider>
                <App />
              </ChatProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
// Build trigger
