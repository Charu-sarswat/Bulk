import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCustomerUI } from '../../context/CustomerUIContext';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function RestaurantResolverMode({ element }) {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { restaurant, updateRestaurantContext } = useRestaurant();
  const { cart, clearCart } = useCustomerUI();
  
  const [resolving, setResolving] = useState(true);
  const [error, setError] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!restaurantSlug) {
      setError('Restaurant address not specified.');
      setResolving(false);
      return;
    }

    // If context is already matching, do not re-fetch
    if (restaurant && restaurant.slug === restaurantSlug.toLowerCase()) {
      setResolving(false);
      return;
    }

    const resolveSlug = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/customer/restaurant-by-slug/${restaurantSlug.toLowerCase()}`);
        if (res.ok) {
          const data = await res.json();
          
          // Cart conflict check
          if (cart.length > 0 && cart[0].restaurantId !== data._id) {
            const activeRestaurantName = localStorage.getItem('activeRestaurantName') || 'your active store';
            const confirmSwitch = window.confirm(`Your current cart is from ${activeRestaurantName}. Would you like to clear your cart and switch to ${data.name}?`);
            if (confirmSwitch) {
              clearCart();
            } else {
              // Redirect back to current restaurant's menu
              const activeSlug = localStorage.getItem('activeRestaurantSlug') || 'bombay-chowpati';
              navigate(`/restaurant/${activeSlug}/menu`);
              return;
            }
          }

          // Set resolved restaurant context. Table context is set to null because they visited via direct URL
          updateRestaurantContext({
            id: data._id,
            slug: data.slug,
            name: data.name,
            logo: data.logo,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode
          }, null);
          setResolving(false);
        } else {
          const errData = await res.json();
          setError(errData.message || 'This restaurant is currently unavailable.');
          setResolving(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to resolve restaurant context. Check connection.');
        setResolving(false);
      }
    };

    resolveSlug();
  }, [restaurantSlug, restaurant, cart, clearCart, navigate, apiUrl]);

  if (resolving) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-[#F8A324] animate-spin mb-4" />
        <h2 className="text-base font-serif font-black text-gray-800 uppercase tracking-wider">Loading Restaurant Profile</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Building fresh secure context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-black text-gray-800 mb-2">Store Unavailable</h2>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-6">
          {error}
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#3C110D] hover:bg-[#5C1F1A] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          Select Another Restaurant
        </button>
      </div>
    );
  }

  return element;
}
