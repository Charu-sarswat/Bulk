import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LegacyQRResolver() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { updateRestaurantContext } = useRestaurant();

  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!tableId) {
      setError('Table parameter is missing from the scan.');
      return;
    }

    const resolveLegacyQR = async () => {
      try {
        // 1. Fetch table details
        const tableRes = await fetch(`${apiUrl}/api/tables/${tableId}`);
        if (!tableRes.ok) {
          setError('Invalid table scanned.');
          return;
        }
        const tableData = await tableRes.json();

        // 2. Fetch restaurant details
        const restRes = await fetch(`${apiUrl}/api/customer/restaurant-by-slug/${tableData.restaurantId}`);
        if (!restRes.ok) {
          setError('Associated restaurant is currently unavailable.');
          return;
        }
        const restData = await restRes.json();

        // 3. Update context and redirect
        updateRestaurantContext({
          id: restData._id,
          slug: restData.slug,
          name: restData.name,
          logo: restData.logo
        }, {
          id: tableData.id,
          tableNumber: tableData.table_number
        }, 'DINE_IN');

        navigate(`/restaurant/${restData.slug}/menu`);
      } catch (err) {
        console.error(err);
        setError('Network error resolving scanned code.');
      }
    };

    resolveLegacyQR();
  }, [tableId, apiUrl]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-black text-gray-800 mb-2">Legacy Verification Failed</h2>
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

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6">
      <Loader2 className="w-10 h-10 text-[#F8A324] animate-spin mb-4" />
      <h2 className="text-base font-serif font-black text-gray-800 uppercase tracking-wider">Resolving legacy QR</h2>
      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Upgrading connection context...</p>
    </div>
  );
}
