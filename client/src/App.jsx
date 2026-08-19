import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { RestaurantProvider } from './context/RestaurantContext';

// Customer Layout + Pages
import CustomerLayout from './customer/components/CustomerLayout';
import ChooseRestaurant from './customer/pages/ChooseRestaurant';
import Landing from './customer/pages/Landing';
import Menu from './customer/pages/Menu';
import OrderStatus from './customer/pages/OrderStatus';
import Account from './customer/pages/Account';
import QRRedirectLoader from './customer/pages/QRRedirectLoader';
import RestaurantResolverMode from './customer/components/RestaurantResolverMode';
import LegacyQRResolver from './customer/pages/LegacyQRResolver';

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
import StudentPlans from './admin/pages/StudentPlans';
import WalletTopups from './admin/pages/WalletTopups';

// Super Admin Components & Pages
import SuperAdminLayout from './superadmin/components/SuperAdminLayout';
import SuperAdminDashboard from './superadmin/pages/SuperAdminDashboard';
import SuperAdminRestaurants from './superadmin/pages/SuperAdminRestaurants';
import SuperAdminPlans from './superadmin/pages/SuperAdminPlans';
import SuperAdminSubscriptions from './superadmin/pages/SuperAdminSubscriptions';
import SuperAdminTransactions from './superadmin/pages/SuperAdminTransactions';
import SuperAdminWalletTopups from './superadmin/pages/SuperAdminWalletTopups';
import SuperAdminDiscounts from './superadmin/pages/SuperAdminDiscounts';

export default function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <AuthProvider>
          <CustomerAuthProvider>
            <RestaurantProvider>
              <BrowserRouter>
                <Routes>
                  {/* Customer Flow — shared persistent header via CustomerLayout */}
                  <Route element={<CustomerLayout />}>
                    {/* Main Entry Points */}
                    <Route path="/" element={<ChooseRestaurant />} />
                    <Route path="/order" element={<QRRedirectLoader />} />
                    
                    {/* Restaurant Specific Resolution Paths */}
                    <Route path="/restaurant/:restaurantSlug" element={<RestaurantResolverMode element={<Landing />} />} />
                    <Route path="/restaurant/:restaurantSlug/menu" element={<RestaurantResolverMode element={<Menu />} />} />
                    
                    {/* Direct / Legacy Fallback Routes */}
                    <Route path="/menu" element={<Navigate to="/" replace />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/table/:tableId" element={<LegacyQRResolver />} />
                    <Route path="/table/:tableId/menu" element={<LegacyQRResolver />} />
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
                    <Route path="student-plans" element={<StudentPlans />} />
                    <Route path="wallet-topups" element={<WalletTopups />} />
                    <Route path="billing" element={<Navigate to="/admin" replace />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Super Admin Flow */}
                  <Route path="/superadmin" element={<SuperAdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<SuperAdminDashboard />} />
                    <Route path="restaurants" element={<SuperAdminRestaurants />} />
                    <Route path="plans" element={<SuperAdminPlans />} />
                    <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
                    <Route path="discounts" element={<SuperAdminDiscounts />} />
                    <Route path="wallet-topups" element={<SuperAdminWalletTopups />} />
                    <Route path="transactions" element={<SuperAdminTransactions />} />
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </RestaurantProvider>
          </CustomerAuthProvider>
        </AuthProvider>
      </SocketProvider>
    </ToastProvider>
  );
}
