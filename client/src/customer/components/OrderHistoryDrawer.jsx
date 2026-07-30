import React, { useState, useEffect } from 'react';
import { X, Clock, ChevronRight, ShoppingBag, Receipt, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { restaurantConfig } from '../../config/restaurant';

export default function OrderHistoryDrawer({ isOpen, onClose, onTrackOrder }) {
  const navigate = useNavigate();
  const { customerUser, customerToken, customerLogout } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      setLoading(true);

      if (customerToken) {
        try {
          const res = await fetch(`${apiUrl}/api/auth/customer/orders`, {
            headers: {
              'Authorization': `Bearer ${customerToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setOrders(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching customer account order history:', err);
        }
      }

      const savedIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
      if (savedIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const fetchedOrders = await Promise.all(
          savedIds.map(async (id) => {
            const res = await fetch(`${apiUrl}/api/orders/${id}`);
            if (res.ok) {
              return await res.json();
            }
            return null;
          })
        );
        setOrders(fetchedOrders.filter(Boolean));
      } catch (err) {
        console.error('Error fetching order history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, apiUrl, customerToken]);

  const handleSearchOrder = async (e) => {
    e.preventDefault();
    setSearchError('');
    if (!searchId.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/api/orders/${searchId.trim()}`);
      if (!res.ok) {
        setSearchError('Order not found');
        return;
      }
      const orderData = await res.json();
      
      // Save searched order ID to history if not already present
      const savedIds = JSON.parse(localStorage.getItem('my_orders') || '[]');
      if (!savedIds.includes(orderData.id)) {
        localStorage.setItem('my_orders', JSON.stringify([orderData.id, ...savedIds]));
      }

      if (typeof onTrackOrder === 'function') {
        onTrackOrder(orderData.id);
      } else {
        navigate(`/order/${orderData.id}`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setSearchError('Error looking up order');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="pointer-events-auto w-screen max-w-md transform bg-[#FFF9EE] shadow-2xl transition-all duration-300 slide-up flex flex-col h-full border-l border-[#F8A324]/30">
          
          {/* Header */}
          <div className="p-5 border-b border-[#F8A324]/20 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[#691F1A]" />
              <h3 className="font-serif font-black text-base text-gray-900 tracking-wide">Diner Dashboard</h3>
            </div>
            <button 
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-gray-800">
            
            {/* Search/Lookup Form */}
            <form onSubmit={handleSearchOrder} className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Track by Order ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter Order ID (e.g. 12)"
                    className="w-full text-xs p-3 border border-[#F8A324]/30 rounded-xl focus:outline-none focus:border-[#691F1A] bg-white text-gray-800"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Track
                </button>
              </div>
              {searchError && (
                <p className="text-[10px] text-rose-500 font-medium">{searchError}</p>
              )}
            </form>

            <hr className="border-[#F8A324]/20" />

            {/* Orders List */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">
                Recent Orders
              </span>

              {loading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-[#691F1A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">Loading order history...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl p-6 bg-white">
                  <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No recent orders found on this device.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id}
                      onClick={() => {
                        if (typeof onTrackOrder === 'function') {
                          onTrackOrder(order.id);
                        } else {
                          navigate(`/order/${order.id}`);
                        }
                        onClose();
                      }}
                      className="border border-[#F8A324]/20 rounded-2xl p-4 hover:border-[#691F1A]/40 transition-all cursor-pointer bg-white"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-serif font-black text-sm text-gray-900">Order #{order.order_number || order.id}</h4>
                          <span className="text-[10px] text-gray-400 font-light">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          order.status === 'served'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : order.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-150'
                            : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 font-light line-clamp-1 mb-3">
                        {order.items?.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-gray-50">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                        </span>
                        <div className="flex items-center gap-1 font-black text-xs text-[#691F1A]">
                          <span>{restaurantConfig.currency}{parseFloat(order.total_amount).toFixed(0)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
