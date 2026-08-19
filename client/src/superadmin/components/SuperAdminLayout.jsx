import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  BarChart3, Store, CalendarDays, Coins, ShieldCheck, 
  LogOut, Menu, User, Shield, Layers, FileText, Settings, X, Wallet, Percent 
} from 'lucide-react';
import logoIcon from '../../assets/logo2.png';
const logoBanner = '/log.png';

export default function SuperAdminLayout() {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-xs font-bold uppercase tracking-wider">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  // Guard: Super Admin Only
  if (!token || !user || user.role !== 'super_admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    addToast('Super Admin logged out', 'info');
    navigate('/admin/login');
  };

  const navLinks = [
    { path: '/superadmin/dashboard', name: 'Dashboard', icon: BarChart3 },
    { path: '/superadmin/restaurants', name: 'Restaurants', icon: Store },
    { path: '/superadmin/plans', name: 'Subscription Plans', icon: Layers },
    { path: '/superadmin/subscriptions', name: 'Subscriptions', icon: CalendarDays },
    { path: '/superadmin/discounts', name: 'Item Discounts', icon: Percent },
    { path: '/superadmin/wallet-topups', name: 'Wallet Top-Ups', icon: Wallet },
    { path: '/superadmin/transactions', name: 'Settlement & Ledger', icon: Coins }
  ];

  return (
    <div className="h-screen w-screen bg-white text-gray-900 flex overflow-hidden font-sans">
      
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar - Desktop Layout */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-gray-200 bg-white shrink-0 h-full transition-all duration-300 shadow-sm ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 border-b border-gray-200 flex items-center justify-center px-4 shrink-0 bg-white">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="Logo" className="h-8 w-auto" />
              <span className="font-serif font-black tracking-widest text-[#83560E] uppercase text-sm">Platform Admin</span>
            </div>
          ) : (
            <img src={logoIcon} alt="Logo" className="h-8 w-auto" />
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const LinkIcon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#83560E] text-white font-black shadow-md shadow-[#83560E]/20'
                    : 'text-gray-600 hover:text-[#83560E] hover:bg-amber-50/70'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? link.name : ''}
              >
                <LinkIcon className="w-4.5 h-4.5 shrink-0" />
                {!isCollapsed && <span className="truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-3 shrink-0">
          <div className={`flex items-center gap-3 px-1 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-[#CCA96A]/40 flex items-center justify-center text-[#83560E] font-black shrink-0">
              S
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">Super Admin</p>
                <span className="flex items-center gap-1 text-[9px] text-[#83560E] font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  SaaS Control
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-200 hover:border-rose-200 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Layout */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-gray-200 lg:hidden transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-0 -pointer-events-none hidden'
        }`}
      >
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="Logo" className="h-8 w-auto" />
            <span className="font-serif font-black tracking-widest text-[#83560E] uppercase text-sm">Platform Admin</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="p-2 text-gray-400 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const LinkIcon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive ? 'bg-[#83560E] text-white' : 'text-gray-600 hover:bg-amber-50'
                }`}
              >
                <LinkIcon className="w-4.5 h-4.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-200"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FBFBFA]">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-sm font-bold text-gray-900 tracking-wide uppercase hidden sm:block">
              SaaS Administration Panel
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-amber-50 border border-[#CCA96A]/40 text-[#83560E] text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full tracking-widest">
              SUPER ADMIN MODE
            </span>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
