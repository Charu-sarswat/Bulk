import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { Clock, Play, CheckCircle2, ChevronRight, XCircle, Volume2, AlertCircle, Search, Bike, Copy, ExternalLink, Phone, ShieldCheck, UserCheck, X } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import { restaurantData } from '../../config/restaurantData';

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
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [expandedAddresses, setExpandedAddresses] = useState({});

  // Porter & Delivery Dispatch Modal State
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [dispatchRiderName, setDispatchRiderName] = useState('');
  const [dispatchRiderPhone, setDispatchRiderPhone] = useState('');
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const unhandledOrders = orders.filter(o => o.status === 'received');
  const hasUnhandledOrders = unhandledOrders.length > 0;

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
          // Show all active kitchen orders that need action
          const active = data.filter(order => 
            order.status !== 'served' && order.status !== 'delivered' && order.status !== 'cancelled'
          );
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
      const handleOrderCreated = (newOrder) => {
        const orderId = newOrder.order_number || newOrder.id || newOrder._id;
        
        setOrders((prevOrders) => {
          // Prevent duplicates if already received or fetched
          const exists = prevOrders.some(
            (o) => (o.order_number && o.order_number === newOrder.order_number) || (o.id && (o.id === newOrder.id || o.id === newOrder._id)) || (o._id && o._id === newOrder._id)
          );
          if (exists) {
            return prevOrders;
          }

          const formatted = {
            id: orderId,
            _id: newOrder._id || newOrder.id,
            order_number: newOrder.order_number || orderId,
            table_id: newOrder.table_id,
            table_number: newOrder.table_number || newOrder.table_snapshot || 'Takeaway',
            customer_name: newOrder.customer_name || 'Guest',
            customer_phone: newOrder.customer_phone || '',
            order_channel: newOrder.order_channel || 'dine_in',
            scheduled_time: newOrder.scheduled_time,
            total_amount: newOrder.total_amount,
            status: newOrder.status || 'received',
            payment_status: newOrder.payment_status || 'pending',
            payment_method: newOrder.payment_method || 'upi',
            notes: newOrder.notes || '',
            created_at: newOrder.created_at || new Date().toISOString(),
            items: newOrder.items || [],
            delivery_address: newOrder.delivery_address || '',
            delivery_job_id: newOrder.delivery_job_id,
            delivery_status: newOrder.delivery_status,
            delivery_rider_name: newOrder.delivery_rider_name,
            delivery_rider_phone: newOrder.delivery_rider_phone,
            delivery_otp: newOrder.delivery_otp,
            delivery_tracking_url: newOrder.delivery_tracking_url
          };

          addToast(`New order #${formatted.order_number} placed!`, 'warning');
          return [formatted, ...prevOrders];
        });
      };

      // 2. Sync order status updates from server/other staff
      const handleOrderStatusChange = (updatedOrder) => {
        setOrders((prevOrders) => {
          const updateId = updatedOrder.order_number || updatedOrder.id || updatedOrder._id;

          // If status is changed to served, delivered, or cancelled, remove from kitchen view
          if (updatedOrder.status === 'served' || updatedOrder.status === 'delivered' || updatedOrder.status === 'cancelled') {
            return prevOrders.filter(
              (order) => order.order_number !== updateId && order.id !== updateId && order._id !== updateId
            );
          }
          
          const exists = prevOrders.some(
            (order) => (order.order_number && order.order_number === updateId) || order.id === updateId || order._id === updateId
          );

          if (!exists) {
            // It's a new active order being synced! Add it to the list
            const formatted = {
              id: updateId,
              _id: updatedOrder._id || updateId,
              order_number: updatedOrder.order_number || updateId,
              table_number: updatedOrder.table_number || updatedOrder.table_snapshot || 'Takeaway',
              customer_name: updatedOrder.customer_name || 'Guest',
              customer_phone: updatedOrder.customer_phone || '',
              order_channel: updatedOrder.order_channel || 'dine_in',
              scheduled_time: updatedOrder.scheduled_time,
              total_amount: updatedOrder.total_amount,
              status: updatedOrder.status || 'received',
              payment_status: updatedOrder.payment_status || 'pending',
              payment_method: updatedOrder.payment_method || 'upi',
              notes: updatedOrder.notes || '',
              created_at: updatedOrder.created_at || new Date().toISOString(),
              items: updatedOrder.items || [],
              delivery_address: updatedOrder.delivery_address || '',
              delivery_job_id: updatedOrder.delivery_job_id,
              delivery_status: updatedOrder.delivery_status,
              delivery_rider_name: updatedOrder.delivery_rider_name,
              delivery_rider_phone: updatedOrder.delivery_rider_phone,
              delivery_otp: updatedOrder.delivery_otp,
              delivery_tracking_url: updatedOrder.delivery_tracking_url
            };
            return [formatted, ...prevOrders];
          }

          // Otherwise, update properties
          return prevOrders.map((order) => {
            const isMatch = (order.order_number && order.order_number === updateId) || order.id === updateId || order._id === updateId;
            if (!isMatch) return order;

            return { 
              ...order, 
              status: updatedOrder.status || order.status, 
              payment_status: updatedOrder.payment_status || order.payment_status,
              payment_method: updatedOrder.payment_method || order.payment_method,
              notes: updatedOrder.notes !== undefined ? updatedOrder.notes : order.notes,
              items: updatedOrder.items && updatedOrder.items.length > 0 ? updatedOrder.items : order.items,
              delivery_job_id: updatedOrder.delivery_job_id || order.delivery_job_id,
              delivery_status: updatedOrder.delivery_status || order.delivery_status,
              delivery_rider_name: updatedOrder.delivery_rider_name || order.delivery_rider_name,
              delivery_rider_phone: updatedOrder.delivery_rider_phone || order.delivery_rider_phone,
              delivery_otp: updatedOrder.delivery_otp || order.delivery_otp,
              delivery_tracking_url: updatedOrder.delivery_tracking_url || order.delivery_tracking_url
            };
          });
        });
      };

      socket.on('order_created', handleOrderCreated);
      socket.on('order_list_update', handleOrderStatusChange);
      socket.on('order_status_change', handleOrderStatusChange);

      return () => {
        socket.off('order_created', handleOrderCreated);
        socket.off('order_list_update', handleOrderStatusChange);
        socket.off('order_status_change', handleOrderStatusChange);
      };
    }
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
        return prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: nextStatus, 
                updated_at: updatedOrder.updated_at,
                delivery_job_id: updatedOrder.delivery_job_id || order.delivery_job_id,
                delivery_status: updatedOrder.delivery_status || order.delivery_status,
                delivery_rider_name: updatedOrder.delivery_rider_name || order.delivery_rider_name,
                delivery_rider_phone: updatedOrder.delivery_rider_phone || order.delivery_rider_phone,
                delivery_otp: updatedOrder.delivery_otp || order.delivery_otp,
                delivery_tracking_url: updatedOrder.delivery_tracking_url || order.delivery_tracking_url
              } 
            : order
        );
      });

      addToast(`Order #${orderId} marked as ${nextStatus}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Error updating order state.', 'error');
    }
  };

  const openPorterBooking = (order) => {
    const dropAddr = order.delivery_address || 'Hyderabad';
    const text = `Drop: ${dropAddr} | Phone: ${order.customer_phone || ''} | Name: ${order.customer_name || 'Customer'}`;
    
    // Copy clean drop address for instant paste in Porter/Rapido app
    navigator.clipboard.writeText(dropAddr).then(() => {
      addToast(`📋 Drop address copied: "${dropAddr.slice(0, 32)}..."`, 'success');
    }).catch(() => {
      addToast('Opening Porter...', 'info');
    });

    // Try opening Porter mobile app if on mobile, or main site
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = 'porter://';
      setTimeout(() => {
        window.open('https://porter.in/', '_blank');
      }, 1000);
    } else {
      window.open('https://porter.in/', '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenDispatchModal = (order) => {
    setDispatchModalOrder(order);
    setDispatchRiderName(order.delivery_rider_name || 'Porter 2-Wheeler');
    setDispatchRiderPhone(order.delivery_rider_phone || '');
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalOrder) return;
    setDispatchSubmitting(true);
    try {
      const orderId = dispatchModalOrder.id || dispatchModalOrder.order_number;
      const response = await fetch(`${apiUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'out_for_delivery',
          delivery_status: 'out_for_delivery',
          delivery_rider_name: dispatchRiderName || 'Porter Rider',
          delivery_rider_phone: dispatchRiderPhone || '',
          delivery_job_id: dispatchModalOrder.delivery_job_id || 'PORTER-DIR'
        })
      });

      if (!response.ok) throw new Error('Failed to dispatch order');
      const updatedOrder = await response.json();

      setOrders(prev => prev.map(o => {
        if (o.id === orderId || o.order_number === orderId) {
          return {
            ...o,
            status: 'out_for_delivery',
            delivery_status: 'out_for_delivery',
            delivery_rider_name: dispatchRiderName || 'Porter Rider',
            delivery_rider_phone: dispatchRiderPhone || '',
            delivery_job_id: updatedOrder.delivery_job_id || o.delivery_job_id || 'PORTER-DIR',
            delivery_otp: updatedOrder.delivery_otp || o.delivery_otp
          };
        }
        return o;
      }));

      addToast(`🛵 Order #${orderId} marked Out for Delivery!`, 'success');
      setDispatchModalOrder(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to dispatch order.', 'error');
    } finally {
      setDispatchSubmitting(false);
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
    const matchesChannel = channelFilter === 'ALL' || order.order_channel === channelFilter;
    return matchesQuery && matchesStatus && matchesChannel;
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
              <option value="hold">On Hold</option>
              <option value="received">Received / New</option>
              <option value="preparing">In Preparation</option>
              <option value="ready">Ready to Serve</option>
            </select>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F8A324] w-full md:w-auto cursor-pointer"
            >
              <option value="ALL">All Order Types</option>
              <option value="dine_in">Dine-In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Home Delivery</option>
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
            <table className="min-w-[1200px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-48">Order Ticket</th>
                  <th className="py-3.5 px-4 sm:px-6 w-48">Seating / Mode</th>
                  <th className="py-3.5 px-4 sm:px-6 w-40">Wait Time</th>
                  <th className="py-3.5 px-4 sm:px-6 min-w-[360px]">Dishes Checklist</th>
                  <th className="py-3.5 px-4 sm:px-6 w-56">Kitchen Notes</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center w-64">Actions</th>
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
                        order.status === 'hold' ? 'bg-orange-50/40 border-l-4 border-orange-400' : isDelayed ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Ticket ID */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-bold text-gray-900 block whitespace-nowrap">#{order.order_number || order.id}</span>
                        {order.status === 'hold' && (
                          <span className="bg-orange-100 text-orange-800 text-[8px] font-black px-1.5 py-0.5 rounded mt-1 inline-block uppercase border border-orange-200 block w-max animate-pulse">
                            ⏸️ On Hold
                          </span>
                        )}
                        {order.scheduled_time && (
                          <span className="bg-purple-100 text-purple-800 text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase border border-purple-250 block w-max">
                            📅 {new Date(order.scheduled_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        )}
                        {isDelayed && order.status !== 'hold' && (
                          <span className="bg-rose-100 text-rose-800 text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase border border-rose-200 block w-max">
                            Urgent / Delay
                          </span>
                        )}
                      </td>

                      {/* Seating Table & Details */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-bold text-gray-900 block">
                          {order.order_channel === 'dine_in' ? '🍽️ Dine-In' : order.order_channel === 'delivery' ? '🚗 Delivery' : '🛍️ Takeaway'}
                        </span>
                        {order.delivery_address && (
                          <div className="mt-1.5">
                            {expandedAddresses[order.id] ? (
                              <div className="text-[10px] text-[#83560E] bg-rose-50 border border-red-200/50 rounded p-1.5 font-semibold max-w-[200px] break-words relative">
                                <span>📍 {order.delivery_address}</span>
                                <button
                                  onClick={() => setExpandedAddresses(prev => ({ ...prev, [order.id]: false }))}
                                  className="text-[8px] text-gray-400 block mt-1 hover:underline text-left cursor-pointer font-bold"
                                >
                                  Hide Address
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setExpandedAddresses(prev => ({ ...prev, [order.id]: true }))}
                                className="text-[9px] text-[#83560E] bg-rose-50 border border-red-200/40 hover:bg-rose-100/40 rounded px-1.5 py-0.5 font-semibold cursor-pointer flex items-center gap-1 transition-all"
                                title="Click to show address"
                              >
                                <span>📍 Show Address</span>
                              </button>
                            )}
                          </div>
                        )}
                        {/* Customer Info */}
                        <span className="text-[10px] text-gray-500 block mt-1 font-semibold">
                          👤 {order.customer_name || 'Guest'}
                          {order.customer_phone && <span className="text-gray-400 block font-normal">{order.customer_phone}</span>}
                        </span>
                        {/* Delivery Partner / Porter Info */}
                        {order.order_channel === 'delivery' && (
                          <div className="border text-[9px] font-black rounded-xl p-2.5 mt-2 max-w-[240px] bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-amber-200/80 text-amber-900 shadow-2xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-[#83560E] flex items-center gap-1">
                                <Bike className="w-3.5 h-3.5 text-[#F8A324]" />
                                <span>{order.delivery_rider_name || 'Delivery Partner'}</span>
                              </span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                order.status === 'out_for_delivery'
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-amber-200/70 text-amber-900'
                              }`}>
                                {order.delivery_status || (order.status === 'out_for_delivery' ? 'On The Way' : 'Pending Rider')}
                              </span>
                            </div>

                            {order.delivery_rider_phone ? (
                              <a href={`tel:${order.delivery_rider_phone}`} className="text-[#83560E] font-bold block mt-1 hover:underline flex items-center gap-1">
                                📞 {order.delivery_rider_phone}
                              </a>
                            ) : (
                              <span className="text-gray-400 block mt-0.5 font-normal">No rider phone assigned yet</span>
                            )}

                            {order.delivery_otp && (
                              <div className="mt-1.5 bg-white/90 border border-amber-200/80 rounded-lg px-2 py-1 flex items-center justify-between text-[9px]">
                                <span className="text-gray-500 font-bold">Delivery OTP:</span>
                                <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {order.delivery_otp}
                                </span>
                              </div>
                            )}

                            {/* 1-Click Quick Porter & Assign Buttons */}
                            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-amber-200/60">
                              <button
                                onClick={() => openPorterBooking(order)}
                                className="flex-1 bg-[#83560E] hover:bg-[#68410d] text-[#F8A324] font-black py-1 px-2 rounded-lg text-[8px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Open Porter with pre-filled address & phone"
                              >
                                <span>🏍️ Porter 1-Click</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>

                              <button
                                onClick={() => handleOpenDispatchModal(order)}
                                className="bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300/80 font-bold py-1 px-2 rounded-lg text-[8px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                title="Assign Rider & Dispatch"
                              >
                                <span>Assign Rider</span>
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Payment Info */}
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-1.5 border ${
                          order.payment_status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          💳 {order.payment_method === 'cash' ? 'Cash' : order.payment_method === 'card' ? 'Card' : order.payment_method === 'cod' ? 'COD' : 'UPI'} ({order.payment_status})
                        </span>
                      </td>

                      {/* Wait Time */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-semibold block text-gray-600 whitespace-nowrap">
                          {calculateMinutesAgo(order.created_at)}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5 whitespace-nowrap">
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
                        <div className="flex flex-row gap-2 items-center justify-center flex-wrap">
                          {order.status === 'hold' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="w-max bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm shrink-0"
                            >
                              Release & Prepare
                            </button>
                          )}
                          {order.status === 'received' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="w-max bg-[#83560E] hover:bg-[#68410d] text-[#F8A324] font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm shrink-0"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="w-max bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm shrink-0"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            order.order_channel === 'delivery' ? (
                              <button
                                onClick={() => handleOpenDispatchModal(order)}
                                className="w-max bg-[#F8A324] hover:bg-[#d97a10] text-[#83560E] font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm uppercase tracking-wider shrink-0 flex items-center gap-1"
                              >
                                <Bike className="w-3.5 h-3.5" />
                                <span>Dispatch Rider</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'served')}
                                className="w-max bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm uppercase tracking-wider shrink-0"
                              >
                                Complete / Served
                              </button>
                            )
                          )}
                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="w-max bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-sm uppercase tracking-wider shrink-0"
                            >
                              Mark Delivered
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

      {/* Porter 1-Click Booking & Rider Dispatch Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-150 space-y-5 relative">
            <button
              onClick={() => setDispatchModalOrder(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#83560E] flex items-center justify-center font-bold shrink-0">
                <Bike className="w-6 h-6 text-[#F8A324]" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-gray-900">
                  Dispatch Delivery #{dispatchModalOrder.order_number || dispatchModalOrder.id}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Book via Porter 2-Wheeler or assign in-house rider
                </p>
              </div>
            </div>

            {/* Quick 1-Click Porter Box */}
            <div className="bg-gradient-to-br from-[#FFF9EE] to-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#83560E] flex items-center gap-1.5">
                  <span>🏍️ Porter 1-Click Launcher</span>
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-black px-2 py-0.5 rounded-md uppercase">
                  Hyderabad 2-Wheeler
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-gray-700 bg-white/80 p-3 rounded-xl border border-amber-200/40">
                <div>
                  <span className="font-bold text-gray-500">Pickup: </span>
                  <span className="font-semibold text-gray-900">{restaurantData.name}, {restaurantData.gmbAddress}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500">Drop Address: </span>
                  <span className="font-semibold text-[#83560E]">{dispatchModalOrder.delivery_address || 'Abids, Hyderabad'}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500">Customer: </span>
                  <span className="font-semibold text-gray-900">{dispatchModalOrder.customer_name} ({dispatchModalOrder.customer_phone})</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPorterBooking(dispatchModalOrder)}
                  className="w-full sm:flex-1 bg-[#83560E] hover:bg-[#68410d] text-[#F8A324] font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <span>Open Porter (Bike Booking)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(restaurantData.gmbAddress)}&destination=${encodeURIComponent(dispatchModalOrder.delivery_address || 'Hyderabad')}&travelmode=two_wheeler`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="View Distance & Route"
                  >
                    <span>🗺️ Route</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const text = dispatchModalOrder.delivery_address || 'Hyderabad';
                      navigator.clipboard.writeText(text);
                      addToast(`📋 Address copied: "${text.slice(0, 30)}..."`, 'success');
                    }}
                    className="flex-1 sm:flex-initial bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy Drop Address for Porter/Rapido"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy Address</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Quick Rider Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Porter 2-Wheeler', phone: '' },
                  { name: 'In-House Staff (Ramesh)', phone: '9876543210' },
                  { name: 'Rapido Bike Rider', phone: '' },
                  { name: 'Uber Moto Partner', phone: '' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDispatchRiderName(preset.name);
                      if (preset.phone) setDispatchRiderPhone(preset.phone);
                    }}
                    className="bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Rider Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Rider Name / Partner
                </label>
                <input
                  type="text"
                  value={dispatchRiderName}
                  onChange={(e) => setDispatchRiderName(e.target.value)}
                  placeholder="e.g. Porter Bike Rider"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F8A324] font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Rider Phone Number
                </label>
                <input
                  type="tel"
                  value={dispatchRiderPhone}
                  onChange={(e) => setDispatchRiderPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F8A324] font-semibold"
                />
              </div>
            </div>

            {/* Delivery OTP Notice */}
            {dispatchModalOrder.delivery_otp && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-900 font-bold">Secure Delivery OTP:</span>
                </div>
                <span className="font-mono font-black text-sm text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                  {dispatchModalOrder.delivery_otp}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={dispatchSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Bike className="w-4 h-4" />
                <span>{dispatchSubmitting ? 'Dispatching...' : 'Confirm & Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
