import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';

// Customer Layout + Pages
import CustomerLayout from './customer/components/CustomerLayout';
import { CustomerUIProvider } from './context/CustomerUIContext';
import Landing from './customer/pages/Landing';
import Menu from './customer/pages/Menu';
import OrderStatus from './customer/pages/OrderStatus';
import Account from './customer/pages/Account';

// Admin Components & Pages
import AdminLayout from './admin/components/AdminLayout';
import Login from './admin/pages/Login';
import Dashboard from './admin/pages/Dashboard';
import LiveOrders from './admin/pages/LiveOrders';
import OrderHistory from './admin/pages/OrderHistory';
import InventoryManagement from './admin/pages/InventoryManagement';
import MenuManagement from './admin/pages/MenuManagement';
import TableManagement from './admin/pages/TableManagement';
import PaymentReports from './admin/pages/PaymentReports';
import CustomerDirectory from './admin/pages/CustomerDirectory';
import UserManagement from './admin/pages/UserManagement';
import QrGenerator from './admin/pages/QrGenerator';
import Settings from './admin/pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <AuthProvider>
          <CustomerAuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Customer Flow — shared persistent header via CustomerLayout */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/table/:tableId" element={<Landing />} />
                  <Route path="/table/:tableId/menu" element={<Menu />} />
                  <Route path="/order/:orderId" element={<OrderStatus />} />
                </Route>

                {/* Admin Flow */}
                <Route path="/admin/login" element={<Login />} />
                
                {/* Secure Dashboard subroutes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="live-orders" element={<LiveOrders />} />
                  <Route path="orders" element={<OrderHistory />} />
                  <Route path="order-history" element={<Navigate to="/admin/orders" replace />} />
                  <Route path="inventory" element={<InventoryManagement />} />
                  <Route path="menu" element={<MenuManagement />} />
                  <Route path="payments" element={<PaymentReports />} />
                  <Route path="customers" element={<CustomerDirectory />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="qr" element={<QrGenerator />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CustomerAuthProvider>
        </AuthProvider>
      </SocketProvider>
    </ToastProvider>
  );
}
