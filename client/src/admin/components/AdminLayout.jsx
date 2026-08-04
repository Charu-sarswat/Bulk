import React from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  BarChart3, CookingPot, Layers, 
  IndianRupee, LogOut, Menu, User, Shield, FileText,
  ChevronLeft, ChevronRight, Boxes, X, QrCode, Settings
} from 'lucide-react';

// Brand Logos
import logoIcon from '../../assets/logo2.png';
import logoBanner from '../../assets/bombay-logo-3.png';

/** Shared sidebar nav content — renders inside both desktop aside & mobile drawer */
function SidebarContent({ user, navLinks, location, isCollapsed, handleLogout, onLinkClick }) {
  return (
    <>
      {/* Brand Banner */}
      <div className="h-16 border-b border-[#F8A324]/20 flex items-center justify-center px-4 shrink-0 overflow-hidden bg-[#260907]">
        {isCollapsed ? (
          <img src={logoIcon} alt="BC Icon" className="h-9 w-auto object-contain" />
        ) : (
          <img src={logoBanner} alt="Bombay Chowpati Logo" className="h-10 w-auto object-contain drop-shadow-md" />
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => {
          const LinkIcon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#F8A324] via-[#FFB74D] to-[#F8A324] text-[#3C110D]'
                  : 'text-amber-100/70 hover:text-white hover:bg-white/10'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? link.name : ''}
            >
              <LinkIcon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-[#F8A324]/20 bg-[#260907] shrink-0 space-y-3">
        <div className={`flex items-center gap-3 px-1 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-[#F8A324]/20 border border-[#F8A324]/40 flex items-center justify-center text-[#F8A324] font-black shrink-0 uppercase">
            {user.username[0]}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">{user.username}</p>
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider">
                <Shield className="w-2.5 h-2.5" />
                {user.role}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-rose-500/20 text-amber-200 hover:text-rose-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/10 hover:border-rose-500/30 cursor-pointer ${
            isCollapsed ? 'px-0' : ''
          }`}
          title={isCollapsed ? 'Sign Out' : ''}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {!isCollapsed && (
          <div className="text-center pt-1 border-t border-white/5">
            <span className="text-[9px] text-[#F8A324] font-black uppercase tracking-widest block">
              Chat Bhandar Control
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3C110D]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F8A324] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  // Route guarding
  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/admin/login');
  };

  // RBAC Navigation Links Definition
  let navLinks = [];
  if (user.role === 'admin') {
    navLinks = [
      { path: '/admin', name: 'Dashboard', icon: BarChart3 },
      { path: '/admin/live-orders', name: 'Kitchen Screen', icon: CookingPot },
      { path: '/admin/orders', name: 'Orders', icon: FileText },
      { path: '/admin/inventory', name: 'Inventory & Prep', icon: Boxes },
      { path: '/admin/menu', name: 'Menu Catalog', icon: Layers },
      { path: '/admin/payments', name: 'Payments & Revenue', icon: IndianRupee },
      { path: '/admin/customers', name: 'Customer Directory', icon: User },
      { path: '/admin/users', name: 'System Users', icon: Shield },
      { path: '/admin/qr', name: 'Table QR Codes', icon: QrCode },
      { path: '/admin/settings', name: 'Settings', icon: Settings }
    ];
  } else if (user.role === 'staff') {
    navLinks = [
      { path: '/admin/live-orders', name: 'Kitchen Screen', icon: CookingPot },
      { path: '/admin/orders', name: "Today's Orders", icon: FileText },
      { path: '/admin/inventory', name: 'Inventory & Prep', icon: Boxes },
      { path: '/admin/menu', name: 'Menu Catalog', icon: Layers },
      { path: '/admin/qr', name: 'Table QR Codes', icon: QrCode }
    ];
  } else if (user.role === 'kitchen') {
    navLinks = [
      { path: '/admin/live-orders', name: 'Kitchen Screen', icon: CookingPot }
    ];
  }

  return (
    <div className="h-screen w-screen bg-[#FFF9EE] flex overflow-hidden font-sans">

      {/* ─── Mobile Drawer Backdrop ─────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ─── Mobile Sidebar Drawer ──────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#3C110D] text-white flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        <SidebarContent
          user={user}
          navLinks={navLinks}
          location={location}
          isCollapsed={false}
          handleLogout={handleLogout}
          onLinkClick={() => setIsMobileOpen(false)}
        />
      </aside>

      {/* ─── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-[#3C110D] text-white shrink-0 border-r border-[#F8A324]/20 transition-all duration-300 relative ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-25 bg-[#260907] border border-[#F8A324]/40 text-[#F8A324] rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-white/10 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <SidebarContent
          user={user}
          navLinks={navLinks}
          location={location}
          isCollapsed={isCollapsed}
          handleLogout={handleLogout}
          onLinkClick={() => {}}
        />
      </aside>

      {/* ─── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-[#260907] border-b border-[#F8A324]/20 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 text-white">
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-1 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 md:hidden cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="font-serif font-extrabold text-white text-sm sm:text-base tracking-wide truncate">
              {navLinks.find(link => link.path === location.pathname)?.name || 'Bombay Chowpati Control'}
            </h2>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#FFF9EE] overflow-y-auto max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
