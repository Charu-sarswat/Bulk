import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCustomerUI } from '../../context/CustomerUIContext';
import { Loader2, AlertCircle } from 'lucide-react';

export default function QRRedirectLoader() {
  const query = new URLSearchParams(useLocation().search);
  const restaurantParam = query.get('restaurant');
  const tableParam = query.get('table');
  const navigate = useNavigate();
  const { updateRestaurantContext } = useRestaurant();
  const { cart, clearCart } = useCustomerUI();

  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!restaurantParam || !tableParam) {
      setError('Invalid QR code scanned. Restaurant and table parameters are missing.');
      return;
    }

    const validateQR = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/customer/validate-qr?restaurant=${encodeURIComponent(restaurantParam)}&table=${encodeURIComponent(tableParam)}`);
        const data = await res.json();
        
        if (res.ok) {
          // Cart conflict check
          if (cart.length > 0 && cart[0].restaurantId !== data.restaurant.id) {
            const activeRestaurantName = localStorage.getItem('activeRestaurantName') || 'your active store';
            const confirmSwitch = window.confirm(`Your current cart is from ${activeRestaurantName}. Would you like to clear your cart and switch to ${data.restaurant.name}?`);
            if (confirmSwitch) {
              clearCart();
            } else {
              // Redirect back to current restaurant's menu
              const activeSlug = localStorage.getItem('activeRestaurantSlug') || 'bombay-chowpati';
              navigate(`/restaurant/${activeSlug}/menu`);
              return;
            }
          }

          // Store validated restaurant and table contexts, setting orderMode to DINE_IN
          updateRestaurantContext(data.restaurant, data.table, 'DINE_IN');
          navigate(`/restaurant/${data.restaurant.slug}/menu`);
        } else {
          setError(data.message || 'Restaurant or table verification failed.');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to reach server. Please verify your connection and try again.');
      }
    };

    validateQR();
  }, [restaurantParam, tableParam, cart, clearCart, navigate, apiUrl]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-black text-gray-800 mb-2">Scan Verification Failed</h2>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-6">
          {error}
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#83560E] hover:bg-[#68410d] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          Select Another Restaurant
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6">
      <Loader2 className="w-10 h-10 text-[#F8A324] animate-spin mb-4" />
      <h2 className="text-base font-serif font-black text-gray-800 uppercase tracking-wider">Verifying Table Scan</h2>
      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Connecting to restaurant network...</p>
    </div>
  );
}
