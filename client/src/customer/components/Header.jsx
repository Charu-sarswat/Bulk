import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { 
  UserCircle, Utensils, ChefHat, Trophy, Instagram, Calendar, 
  MapPin, Clock, Phone, ExternalLink, ShoppingCart, History, LogOut, X
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useCustomerUI } from '../../context/CustomerUIContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { restaurantData } from '../../config/restaurantData';
import WhatsAppIcon from './WhatsAppIcon';
const logoBanner = '/log.png';

export default function Header() {
  const { pathname } = useLocation();
  const { tableId } = useParams();
  const { customerUser, customerLogout } = useCustomerAuth();
  const { cartItemCount, setIsCartOpen, setIsHistoryOpen, tableInfo } = useCustomerUI();
  const { restaurant } = useRestaurant();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent(`Hello Bombay Chowpati! I would like to place an order / ask a query.`);
    window.open(`https://wa.me/${restaurantData.whatsappNumber}?text=${text}`, '_blank');
  };

  const confirmLogoutAction = () => {
    customerLogout();
    setShowConfirmLogout(false);
  };

  // Determine path/header types
  const isMenuPage = pathname.includes('/menu');

  if (isMenuPage) {
    return (
      <header className="sticky top-0 z-40 bg-[#080604] text-white border-b border-[#CCA96A]/30 shadow-xl font-sans">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          <Link to={tableId ? `/table/${tableId}` : "/"} className="flex items-center gap-3">
            <img 
              src={logoBanner} 
              alt="Bombay Chowpati" 
              className="h-10 sm:h-11 w-auto object-contain"
            />
            {tableInfo && (
              <span className="hidden xs:inline-flex items-center bg-[#CCA96A]/20 border border-[#CCA96A]/40 text-[#CCA96A] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Table {tableInfo.table_number}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2">
            {/* History Link */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-amber-100 flex items-center justify-center transition-all cursor-pointer border border-[#989083]/20"
              title="Order History"
            >
              <History className="w-5 h-5" />
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative w-10 h-10 rounded-xl bg-[#CCA96A] hover:bg-[#b58d4a] text-[#080604] flex items-center justify-center transition-all shadow-md cursor-pointer font-bold"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#83560E] text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-[#080604]">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Profile / Log In */}
            {customerUser ? (
              <div className="flex items-center gap-1">
                <Link to="/account" className="hidden sm:flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-semibold text-amber-100 transition-all border border-[#989083]/20">
                  <UserCircle className="w-4 h-4 text-[#CCA96A]" />
                  <span>{customerUser.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={() => setShowConfirmLogout(true)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-950 hover:text-rose-300 text-amber-100 flex items-center justify-center transition-all cursor-pointer border border-[#989083]/20"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/account" className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-100 transition-all border border-[#989083]/20">
                <UserCircle className="w-4 h-4 text-[#CCA96A]" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Custom Confirmation Modal */}
        {showConfirmLogout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#F9F6F0] rounded-3xl p-6 max-w-sm w-full border border-[#CCA96A]/30 shadow-2xl text-center space-y-5">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <LogOut className="w-6 h-6 text-[#83560E]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-black text-lg text-gray-900 leading-tight">Confirm Log Out</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Are you sure you want to log out of your Bombay Chowpati account?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmLogout(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogoutAction}
                  className="flex-1 py-3 bg-[#83560E] hover:bg-[#68410d] text-[#CCA96A] font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    );
  }

  const isLanding = pathname === '/' || (pathname.startsWith('/table/') && !pathname.includes('/menu'));
  return (
    <header className={`${isLanding ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-40 px-4 py-3 sm:px-6 sm:py-3.5 bg-[#080604]/95 backdrop-blur-xl border-b border-[#CCA96A]/30 shadow-2xl font-sans`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Brand Logo Banner */}
        <Link to={tableId ? `/table/${tableId}` : "/"} className="flex items-center gap-3">
          <img 
            src={logoBanner} 
            alt="Bombay Chowpati" 
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
          />
        </Link>

        {/* Center Navigation Links (Only shown on Landing page) */}
        {!isMenuPage && pathname === '/' && (
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-amber-100/90">
            <a href="#hero" className="hover:text-[#CCA96A] transition-colors">Home</a>
            <a href="#awards" className="hover:text-[#CCA96A] transition-colors">Awards</a>
            <a href="#reels" className="hover:text-[#CCA96A] transition-colors">Insta Reels</a>
            <a href="#catering" className="hover:text-[#CCA96A] transition-colors">Party & Catering</a>
            <a href="#contact" className="hover:text-[#CCA96A] transition-colors">Contact & Map</a>
          </nav>
        )}

        {/* Right Header Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link 
            to={restaurant ? `/restaurant/${restaurant.slug}/menu` : "/"} 
            className="flex items-center gap-1.5 text-xs text-[#080604] bg-[#CCA96A] hover:bg-[#b58d4a] px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all font-black uppercase tracking-wider cursor-pointer shadow-md"
            title="Explore Menu"
          >
            <ChefHat className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </Link>

          {customerUser ? (
            <Link to="/account" className="flex items-center gap-1.5 bg-[#CCA96A]/20 hover:bg-[#CCA96A]/30 border border-[#CCA96A]/40 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-[#CCA96A] transition-all backdrop-blur-md">
              <UserCircle className="w-4 h-4 text-[#CCA96A]" />
              <span className="hidden sm:inline">{customerUser.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to="/account" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-white transition-all backdrop-blur-md">
              <UserCircle className="w-4 h-4 text-[#CCA96A]" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#F9F6F0] rounded-3xl p-6 max-w-sm w-full border border-[#CCA96A]/30 shadow-2xl text-center space-y-5">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-6 h-6 text-[#83560E]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-black text-lg text-gray-900 leading-tight">Confirm Log Out</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Are you sure you want to log out of your Bombay Chowpati account?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogoutAction}
                className="flex-1 py-3 bg-[#83560E] hover:bg-[#68410d] text-[#CCA96A] font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
