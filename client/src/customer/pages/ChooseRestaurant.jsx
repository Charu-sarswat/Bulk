import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { Store, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import logoFull from '../../assets/bombay-logo-3.png';

export default function ChooseRestaurant() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { updateRestaurantContext } = useRestaurant();

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/customer/restaurants`);
        if (res.ok) {
          const data = await res.json();
          setRestaurants(data);
        } else {
          setError('Failed to retrieve restaurants list');
        }
      } catch (err) {
        console.error(err);
        setError('Connection error. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [apiUrl]);

  const handleSelect = (r) => {
    updateRestaurantContext({
      id: r.id,
      slug: r.slug,
      name: r.name,
      logo: r.logo
    });
    navigate(`/restaurant/${r.slug}`);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F8A324]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#691F1A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl z-10 space-y-8 text-center">
        
        {/* Brand Header */}
        <div className="space-y-4">
          <img 
            src={logoFull} 
            alt="Bombay Chowpati Chat Bhandar" 
            className="h-24 sm:h-28 w-auto mx-auto object-contain drop-shadow-md"
          />
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#3C110D] tracking-tight">
            Explore Flavors & Order
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto">
            Choose your preferred restaurant location to view the active menu and place dine-in, takeaway, or delivery orders.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="w-8 h-8 text-[#F8A324] animate-spin" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Locating nearest stores...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-bold max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Restaurants Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {restaurants.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs text-gray-500 font-bold">
                No active restaurants found.
              </div>
            ) : (
              restaurants.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="bg-white border border-gray-150 rounded-3xl p-5 text-left cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-100/70 hover:border-[#F8A324]/50 group relative overflow-hidden flex flex-col justify-between h-48"
                >
                  <div className="flex items-start gap-4">
                    {r.logo ? (
                      <img src={r.logo} alt={r.name} className="w-14 h-14 rounded-2xl object-cover border border-gray-100" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#691F1A]/5 flex items-center justify-center text-[#691F1A] border border-gray-100 shrink-0">
                        <Store className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-serif font-black text-gray-800 text-base leading-tight group-hover:text-[#691F1A] transition-colors truncate">
                        {r.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#F8A324]" />
                        <span className="truncate">{r.city}, {r.state}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-50 pt-4 flex justify-between items-center">
                    <span className="text-[10px] text-[#691F1A] font-extrabold uppercase tracking-widest">
                      Browse Menu
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[#691F1A]/5 flex items-center justify-center text-[#691F1A] group-hover:bg-[#F8A324] group-hover:text-[#3C110D] transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
