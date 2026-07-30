import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { Clock, Play, CheckCircle2, ChevronRight, XCircle, Volume2, AlertCircle, Search } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';

export default function LiveOrders() {
  const { token } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeState, setTimeState] = useState(Date.now());
  const [expandedItems, setExpandedItems] = useState({});
  const [completedItems, setCompletedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const audioContextRef = useRef(null);

  // HTML5 audio synthesis for sound notifications
  const playNewOrderSound = () => {
    try {
      const audioCtx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      if (!audioContextRef.current) audioContextRef.current = audioCtx;

      // Note 1 (C5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.25);

      // Note 2 (E5) after brief delay
      setTimeout(() => {
        if (audioCtx.state === 'suspended') return;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.35);
      }, 120);

    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
          // Filter active kitchen orders from today
          const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
          const active = data.filter(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
            return order.status !== 'served' && order.status !== 'cancelled' && orderDate === todayStr;
          });
          setOrders(active);
        } else {
          setOrders([]);
          addToast(data?.message || 'Failed to fetch orders.', 'error');
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to fetch orders.', 'error');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();

    // Setup live timers
    const timerInterval = setInterval(() => {
      setTimeState(Date.now());
    }, 30000); // refresh every 30s

    return () => clearInterval(timerInterval);
  }, [token, apiUrl, addToast]);

  useEffect(() => {
    if (socket) {
      // 1. Listen for new orders
      socket.on('order_created', (newOrder) => {
        // format fields mapping
        const formatted = {
          id: newOrder.id,
          order_number: newOrder.order_number,
          table_number: newOrder.table_number,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          order_channel: newOrder.order_channel,
          scheduled_time: newOrder.scheduled_time,
          total_amount: newOrder.total_amount,
          status: newOrder.status,
          created_at: newOrder.created_at,
          items: newOrder.items || []
        };
        setOrders((prevOrders) => [formatted, ...prevOrders]);
        playNewOrderSound();
        addToast(`New order #${newOrder.order_number || newOrder.id} placed!`, 'warning');
      });

      // 2. Sync order status updates from server/other staff
      const handleOrderStatusChange = (updatedOrder) => {
        setOrders((prevOrders) => {
          // If status is changed to served or cancelled, remove from kitchen view
          if (updatedOrder.status === 'served' || updatedOrder.status === 'cancelled') {
            return prevOrders.filter(order => order.id !== updatedOrder.id);
          }
          // Otherwise, update properties
          return prevOrders.map(order => order.id === updatedOrder.id ? { ...order, status: updatedOrder.status, payment_status: updatedOrder.payment_status } : order);
        });
      };

      socket.on('order_list_update', handleOrderStatusChange);
      socket.on('order_status_change', handleOrderStatusChange);
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_list_update');
        socket.off('order_status_change');
      }
    };
  }, [socket, addToast]);

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      const response = await fetch(`${apiUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedOrder = await response.json();

      // Update local state instantly
      setOrders((prevOrders) => {
        if (nextStatus === 'served' || nextStatus === 'cancelled') {
          return prevOrders.filter(order => order.id !== orderId);
        }
        return prevOrders.map(order => order.id === orderId ? { ...order, status: nextStatus, updated_at: updatedOrder.updated_at } : order);
      });

      addToast(`Order #${orderId} marked as ${nextStatus}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Error updating order state.', 'error');
    }
  };

  const calculateMinutesAgo = (createdAtString) => {
    let elapsedMs = timeState - new Date(createdAtString).getTime();
    const diffMins = Math.floor(elapsedMs / 60000);
    
    // Auto-normalize timezone offset differences (e.g. server in UTC, client in IST with 330 mins offset)
    if (diffMins > 310 && diffMins < 350) {
      elapsedMs -= 330 * 60 * 1000;
    }
    
    const elapsedMins = Math.floor(elapsedMs / 60000);
    return elapsedMins <= 0 ? 'Just now' : `${elapsedMins}m ago`;
  };

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  const filteredOrders = orders.filter(order => {
    const tableNum = order.table_number || '';
    const customer = order.customer_name || '';
    const query = searchQuery.toLowerCase();
    const matchesQuery = order.id.toString().includes(query) || 
                         tableNum.toLowerCase().includes(query) ||
                         customer.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Top Controls */}
      <PageHeader
        title="Kitchen Screen"
        description="Live updates of incoming kitchen orders."
        icon={Clock}
      />

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Active Tickets</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{orders.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            <Play className="w-5 h-5 fill-orange-600" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">In Preparation</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {orders.filter(o => o.status === 'preparing').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Ready to Serve</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {orders.filter(o => o.status === 'ready').length}
            </div>
          </div>
        </div>
      </div>

      {/* Single Unified Edge-to-Edge Table Panel Card Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {/* Control Bar Header with Padding */}
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active kitchen tickets by ticket #, table, or customer..."
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F8A324] w-full md:w-auto cursor-pointer"
            >
              <option value="ALL">All Active Statuses</option>
              <option value="received">Received / New</option>
              <option value="preparing">In Preparation</option>
              <option value="ready">Ready to Serve</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 border border-gray-100 rounded-2xl p-8 max-w-lg mx-auto my-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-serif font-bold text-xl text-gray-900 mb-1">Kitchen Queue Clear</h3>
            <p className="text-sm text-gray-500">No active customer tickets matching current filters.</p>
          </div>
        ) : (
          /* Orders Tabular Kitchen View */
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-28">Order Ticket</th>
                  <th className="py-3.5 px-4 sm:px-6 w-28">Seating / Mode</th>
                  <th className="py-3.5 px-4 sm:px-6 w-36">Wait Time</th>
                  <th className="py-3.5 px-4 sm:px-6">Dishes Checklist</th>
                  <th className="py-3.5 px-4 sm:px-6 w-48">Kitchen Notes</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                {filteredOrders.map((order) => {
                  const minutesElapsed = Math.floor((timeState - new Date(order.created_at).getTime()) / 60000);
                  const isDelayed = minutesElapsed > 15;

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50/20 transition-colors ${
                        isDelayed ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Ticket ID */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-bold text-gray-900 block">#{order.id}</span>
                        {isDelayed && (
                          <span className="bg-rose-100 text-rose-800 text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase border border-rose-200">
                            Urgent / Delay
                          </span>
                        )}
                      </td>

                      {/* Seating Table & Details */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-bold text-gray-900 block">
                          {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                        </span>
                        {/* Customer Info */}
                        <span className="text-[10px] text-gray-500 block mt-1 font-semibold">
                          👤 {order.customer_name || 'Guest'}
                          {order.customer_phone && <span className="text-gray-400 block font-normal">{order.customer_phone}</span>}
                        </span>
                        {/* Payment Info */}
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-1.5 border ${
                          order.payment_status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          💳 {order.payment_method === 'cash' ? 'Cash' : order.payment_method === 'card' ? 'Card' : 'UPI'} ({order.payment_status})
                        </span>
                      </td>

                      {/* Wait Time */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-semibold block text-gray-600">
                          {calculateMinutesAgo(order.created_at)}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                        </span>
                      </td>

                      {/* Dishes Horizontal Chips */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-lg">
                          {order.items?.map((item, index) => {
                            const itemKey = `${order.id}-${index}`;
                            const isDone = completedItems[itemKey];

                            return (
                              <div key={index} className="flex flex-col items-start gap-0.5">
                                <button
                                  onClick={() => setCompletedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }))}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer select-none active:scale-95 ${
                                    isDone 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-55' 
                                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200 shadow-sm'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span>{item.quantity}x {item.name}</span>
                                  {item.selected_variant && (
                                    <span className="text-gray-500 font-normal">({item.selected_variant.name})</span>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-gray-500 font-normal">
                        {order.notes ? (
                          <div className="bg-amber-50/60 border border-amber-200/60 p-2 rounded-xl text-amber-900 text-[11px]">
                            📝 {order.notes}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="flex flex-col gap-1.5 items-center">
                          {order.status === 'received' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="w-full bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'served')}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                            >
                              Complete / Served
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`Cancel order #${order.id}?`)) {
                                updateOrderStatus(order.id, 'cancelled');
                              }
                            }}
                            className="bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-500 border border-gray-200 hover:border-rose-100 p-2 rounded-xl transition-colors cursor-pointer"
                            title="Cancel Order"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
