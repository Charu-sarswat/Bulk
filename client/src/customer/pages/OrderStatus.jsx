import React, { useEffect, useState } from 'react';
import { useSEO } from '../../hooks/useSEO';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { 
  CheckCircle, Clock, Utensils, Award, HelpCircle, 
  ChevronLeft, MessageSquare, PhoneCall, Receipt, Sparkles,
  Star, ExternalLink
} from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';

export default function OrderStatus() {
  useSEO({
    title: 'Order Status - Live Tracking',
    description: 'Track your Bombay Chowpati order in real-time.',
    noIndex: true,
  });
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { socket, joinOrderRoom, leaveOrderRoom } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderRef = React.useRef(order);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // 1. Fetch Order initially
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/orders/${orderId}`);
        if (!response.ok) throw new Error('Order not found');
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
        addToast('Unable to find this order tracker.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, apiUrl, addToast]);

  useEffect(() => {
    // 2. Setup Socket room listener
    if (socket) {
      joinOrderRoom(orderId);
      
      socket.on('order_status_change', (updatedOrder) => {
        if (orderId && (updatedOrder.order_number === orderId || updatedOrder.id === orderId || updatedOrder._id === orderId)) {
          setOrder((prevOrder) => ({
            ...prevOrder,
            status: updatedOrder.status,
            payment_status: updatedOrder.payment_status,
            delivery_job_id: updatedOrder.delivery_job_id || prevOrder.delivery_job_id,
            delivery_status: updatedOrder.delivery_status || prevOrder.delivery_status,
            delivery_rider_name: updatedOrder.delivery_rider_name || prevOrder.delivery_rider_name,
            delivery_rider_phone: updatedOrder.delivery_rider_phone || prevOrder.delivery_rider_phone,
            delivery_otp: updatedOrder.delivery_otp || prevOrder.delivery_otp,
            delivery_tracking_url: updatedOrder.delivery_tracking_url || prevOrder.delivery_tracking_url,
            updated_at: updatedOrder.updated_at
          }));
          
          let alertMsg = `Order status updated to ${updatedOrder.status.replace(/_/g, ' ').toUpperCase()}`;
          if (updatedOrder.status === 'preparing') alertMsg = 'Chef is preparing your meal!';
          if (updatedOrder.status === 'ready') alertMsg = orderRef.current?.order_channel === 'delivery' ? 'Your order is packed and ready for delivery!' : 'Your order is ready and heading to your table!';
          if (updatedOrder.status === 'out_for_delivery') alertMsg = 'Valet is on the way with your food!';
          if (updatedOrder.status === 'delivered') alertMsg = 'Your order has been delivered. Enjoy!';
          if (updatedOrder.status === 'served') alertMsg = 'Bon appétit! Order has been served.';
          
          addToast(alertMsg, (updatedOrder.status === 'served' || updatedOrder.status === 'delivered') ? 'success' : 'info');
        }
      });
    }

    return () => {
      if (socket) {
        leaveOrderRoom(orderId);
        socket.off('order_status_change');
      }
    };
  }, [socket, orderId, joinOrderRoom, leaveOrderRoom, addToast]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-76px)] flex items-center justify-center bg-[#fbfaf7]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-500 font-medium font-serif">Tracking order dispatch...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-76px)] flex flex-col items-center justify-center p-6 bg-[#fbfaf7]">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl shadow-xl text-center border-rose-100 bg-white">
          <HelpCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6 font-medium">We could not fetch tracking details for Order ID #{orderId}. Contact server staff if you placed an order.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isDelivery = order.order_channel === 'delivery';

  // Stepper Progression Mapping
  const steps = isDelivery ? [
    { key: 'received', title: 'Order Received', desc: 'The kitchen has logged your ticket.', icon: Clock },
    { key: 'preparing', title: 'Preparing', desc: 'Our chef is preparing your fresh meal.', icon: Utensils },
    { key: 'ready', title: 'Food Ready', desc: 'Order is packed and ready for delivery.', icon: Sparkles },
    { key: 'out_for_delivery', title: 'Out for Delivery', desc: 'Valet has picked up your order and is on the way.', icon: Award },
    { key: 'delivered', title: 'Delivered', desc: 'Order has been delivered at your doorstep.', icon: CheckCircle }
  ] : [
    { key: 'received', title: 'Order Received', desc: 'The kitchen has logged your ticket.', icon: Clock },
    { key: 'preparing', title: 'Preparing', desc: 'Our chef is preparing your fresh meal.', icon: Utensils },
    { key: 'ready', title: 'Food Ready', desc: 'Dish has plated and leaves the pass.', icon: Sparkles },
    { key: 'served', title: 'Served & Satiated', desc: 'Items served. Enjoy your culinary experience!', icon: Award }
  ];

  const statusIndexMap = isDelivery ? {
    'received': 0,
    'preparing': 1,
    'ready': 2,
    'out_for_delivery': 3,
    'delivered': 4,
    'cancelled': -1
  } : {
    'received': 0,
    'preparing': 1,
    'ready': 2,
    'served': 3,
    'cancelled': -1
  };

  const currentStatusIndex = statusIndexMap[order.status];

  // Helper for WhatsApp Pre-filled text
  const generateWhatsAppLink = () => {
    const tableInfo = order.order_channel === 'dine_in' ? 'Dine-In' : order.order_channel === 'delivery' ? 'Delivery' : 'Takeaway';
    const message = `Hello, I placed a ${tableInfo} order. I need assistance regarding my Order #${order.order_number || order.id} (Total: ${restaurantConfig.currency}${parseFloat(order.total_amount).toFixed(2)}). Thank you!`;
    return `https://wa.me/${restaurantConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };
  const handlePrintInvoice = () => {
    const subtotal = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const totalAmount = parseFloat(order.total_amount || 0);
    const deliveryFee = totalAmount > subtotal ? (totalAmount - subtotal) : 0;

    const printWindow = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.order_number || order.id} Invoice</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { margin: 0; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            body {
              font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
              color: #000;
              max-width: 320px;
              margin: 5px auto;
              padding: 10px;
              font-size: 11px;
              line-height: 1.3;
            }
            * {
              color: #000 !important;
              font-weight: bold !important;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .header-title { font-size: 18px; margin: 0 0 1px 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .subtitle { font-size: 10px; margin: 0 0 1px 0; line-height: 1.2; }
            .site-link { font-size: 10px; text-decoration: underline !important; color: #0000ee !important; margin-bottom: 2px; display: inline-block; cursor: pointer !important; -webkit-user-select: text; user-select: text; }
            .divider { border-top: 2px solid #000; margin: 6px 0; }
            .double-divider { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 2px 0; margin: 6px 0; }
            .meta-table, .items-table, .summary-table { width: 100%; border-collapse: collapse; }
            .meta-table td { padding: 1px 0; font-size: 11px; vertical-align: top; }
            .items-table th { border-bottom: 2px solid #000; padding: 3px 0; font-size: 10px; }
            .items-table td { padding: 3px 0; font-size: 11px; vertical-align: top; }
            .summary-table td { padding: 2px 0; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 class="header-title">${restaurantConfig.name}</h2>
            <p class="subtitle">${restaurantConfig.gmbAddress}</p>
            <p class="subtitle">Phone: ${restaurantConfig.formattedPhone || restaurantConfig.supportPhone}</p>
            <div>
              <a href="https://bombaychowpati.com" class="site-link" target="_blank" rel="noopener noreferrer" onclick="window.open('https://bombaychowpati.com', '_blank'); return true;">https://bombaychowpati.com</a>
            </div>
            <p class="bold" style="font-size: 12px; margin: 5px 0 1px 0; letter-spacing: 1px; text-transform: uppercase; border: 1.5px solid #000; padding: 2px 0; display: block;">RECEIPT</p>
          </div>

          <div class="divider"></div>

          <table class="meta-table">
            <tr>
              <td class="bold" style="width: 45%; text-align: left;">Order ID:</td>
              <td class="text-right">#${order.order_number || order.id}</td>
            </tr>
            <tr>
              <td class="bold" style="text-align: left;">Date & Time:</td>
              <td class="text-right">${new Date(order.created_at).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td class="bold" style="text-align: left;">Service Mode:</td>
              <td class="text-right" style="text-transform: uppercase;">${order.order_channel === 'dine_in' ? 'Dine-In' : order.order_channel === 'delivery' ? 'Delivery' : 'Takeaway'}</td>
            </tr>
          </table>

          <div class="double-divider" style="font-weight: bold; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
            Order Items
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th class="text-left" style="width: 46%;">ITEM</th>
                <th class="text-right" style="width: 16%;">QTY</th>
                <th class="text-right" style="width: 18%;">RATE</th>
                <th class="text-right" style="width: 20%;">AMT</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td class="text-left" style="padding: 3px 0;">
                    <div>${item.name?.toUpperCase()}</div>
                    ${item.notes ? `<div style="font-size: 9px; font-style: italic; color: #444; margin-top: 1px;">Note: ${item.notes}</div>` : ''}
                  </td>
                  <td class="text-right" style="padding: 3px 0;">${item.quantity}</td>
                  <td class="text-right" style="padding: 3px 0;">${Number(item.price).toFixed(2)}</td>
                  <td class="text-right" style="padding: 3px 0;">${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <table class="summary-table">
            <tr>
              <td style="text-align: left;">Subtotal</td>
              <td class="text-right">${restaurantConfig.currency}${subtotal.toFixed(2)}</td>
            </tr>
            ${deliveryFee > 0 ? `
            <tr>
              <td style="text-align: left;">Delivery Charges</td>
              <td class="text-right">${restaurantConfig.currency}${deliveryFee.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="bold" style="font-size: 13px;">
              <td style="text-align: left; padding-top: 4px; border-top: 1.5px solid #000;">TOTAL</td>
              <td class="text-right" style="padding-top: 4px; border-top: 1.5px solid #000; font-size: 14px;">${restaurantConfig.currency}${totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <div class="text-center" style="margin-top: 10px; font-size: 11px;">
            <p style="margin: 0 0 2px 0;">Thank you for dining with us!</p>
            <p style="font-size: 9px; margin: 0; color: #333;">Please visit us again</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const finalTotal = parseFloat(order.total_amount);
  return (
    <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-76px)] bg-gray-50/50 pb-20 bg-[#fbfaf7]">


      <main className="max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Status Alert */}
        {order.status === 'cancelled' ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Order Cancelled</h3>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                This order has been cancelled by the restaurant. Please see cashier or waiter for clarification.
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-2xl shadow-sm text-center relative overflow-hidden bg-white border border-gray-200/60">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F8A324]/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Live Order Status</span>
            <h2 className="font-serif font-black text-xl text-gray-900 mb-1">Ticket #{order.order_number || order.id}</h2>
            <p className="text-xs text-gray-400 font-medium">Placed: {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</p>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs">
              <span className={`px-3 py-1 rounded-full font-bold uppercase ${
                order.payment_status === 'paid' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
              }`}>
                {order.payment_status === 'paid' 
                  ? 'Paid' 
                  : order.payment_method === 'upi'
                    ? 'UPI (Pending Verification)'
                    : order.payment_method === 'cod' 
                      ? 'Cash on Delivery' 
                      : 'Pay at Counter'}
              </span>
              <span className="text-gray-300 font-semibold">•</span>
            </div>
          </div>
        )}

        {/* Live Delivery Valet Card */}
        {order.order_channel === 'delivery' && (order.delivery_job_id || order.delivery_rider_name || order.status === 'out_for_delivery') && (
          <div className="bg-white border border-amber-200/70 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold shrink-0 border bg-amber-50 border-amber-200 text-amber-900 text-lg shadow-2xs">
                  🛵
                </div>
                <div>
                  <h4 className="font-serif font-black text-sm text-gray-900 flex items-center gap-1.5">
                    <span>{order.delivery_rider_name || 'Delivery Partner'}</span>
                    {order.status === 'out_for_delivery' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-amber-900 font-extrabold font-mono bg-amber-100/70 px-2 py-0.5 rounded-md">
                      {order.delivery_job_id && !order.delivery_job_id.startsWith('PORTER-DIR') ? `ID: ${order.delivery_job_id}` : 'Express 2-Wheeler'}
                    </span>
                  </div>
                </div>
              </div>
              {(() => {
                const raw = (order.delivery_status || '').toLowerCase();
                let label = 'RIDER ASSIGNED';
                let style = 'bg-blue-50 border-blue-200 text-blue-800 font-bold';
                if (order.status === 'out_for_delivery' || raw === 'active' || raw === 'out_for_delivery') {
                  label = 'ON THE WAY 🛵';
                  style = 'bg-amber-500 text-white font-black animate-pulse';
                } else if (order.status === 'delivered' || raw === 'completed' || raw === 'delivered') {
                  label = 'DELIVERED ✅';
                  style = 'bg-emerald-50 border-emerald-200 text-emerald-800 font-black';
                }
                return (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider border ${style}`}>
                    {label}
                  </span>
                );
              })()}
            </div>

            <div className="flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Partner</span>
                <span className="font-bold text-gray-900 text-sm mt-0.5 block">{order.delivery_rider_name || 'Porter Express Rider'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {order.delivery_rider_phone ? (
                  <a
                    href={`tel:${order.delivery_rider_phone}`}
                    className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Rider</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium">Contact via Restaurant</span>
                )}
                {order.delivery_job_id && order.delivery_job_id.startsWith('BRZ-') && (
                  <a
                    href={`https://borzodelivery.com/in/track/${order.delivery_job_id.replace(/^BRZ-/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer text-xs"
                  >
                    <span>📍 Live Map</span>
                  </a>
                )}
              </div>
            </div>

            {/* Secure Delivery OTP Box */}
            {order.delivery_otp && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                    🔒 Delivery Verification Code
                  </span>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Share this 4-digit OTP with your delivery partner:
                  </p>
                </div>
                <div className="font-mono font-black text-lg text-emerald-900 bg-white border-2 border-emerald-400/80 px-3 py-1 rounded-xl shadow-xs tracking-widest">
                  {order.delivery_otp}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Google Review Prompt Card (Visible when order is served/delivered) */}
        {(order.status === 'served' || order.status === 'delivered') && (
          <div className="bg-gradient-to-br from-[#FFF9EE] via-amber-50/40 to-white border border-[#F8A324]/50 rounded-2xl p-5 sm:p-6 shadow-sm text-center space-y-4 animate-fade-in">
            <div className="flex justify-center text-amber-500 gap-1.5 animate-bounce">
              <Star className="w-6 h-6 fill-current text-amber-400" />
              <Star className="w-6 h-6 fill-current text-amber-400" />
              <Star className="w-6 h-6 fill-current text-amber-400" />
              <Star className="w-6 h-6 fill-current text-amber-400" />
              <Star className="w-6 h-6 fill-current text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-black text-lg text-gray-900">Loved Your Bombay Chowpati Food? 🌟</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Your 5-star review means the world to our team! Tap below to open Google Maps directly and rate us.
              </p>
            </div>

            <div className="bg-white/80 border border-amber-200/70 rounded-xl p-3 text-left flex items-center justify-between gap-2 shadow-2xs">
              <div className="text-[11px] text-gray-700 italic truncate font-semibold">
                "Amazing authentic Bombay street food, prompt service and great taste! 5/5 ⭐"
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("Amazing authentic Bombay street food, prompt service and great taste! Highly recommend Bombay Chowpati MPM Mall Abids.");
                  addToast("Sample review copied to clipboard! Ready to paste on Google.", "success");
                }}
                className="shrink-0 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer"
              >
                Copy Review 📋
              </button>
            </div>

            <a
              href="https://g.page/r/CYziHBfS7U_wEAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg w-full active:scale-[0.99]"
            >
              <span>Rate 5 Stars on Google ↗</span>
              <ExternalLink className="w-4 h-4 text-[#F8A324]" />
            </a>
          </div>
        )}

        {/* Stepper Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm border-gray-200/60">
            <h3 className="font-serif font-bold text-base text-gray-900 mb-6">Order Timeline</h3>
            <div className="relative space-y-8">
              {/* Stepper vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />
              
              {steps.map((step, idx) => {
                const IconComponent = step.icon;
                const isCompleted = idx < currentStatusIndex;
                const isActive = idx === currentStatusIndex;
                const isPending = idx > currentStatusIndex;

                let nodeColors = 'bg-white border-gray-200 text-gray-400';
                let labelColors = 'text-gray-400';
                if (isActive) {
                  if (step.key === 'received') {
                    nodeColors = 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/25 animate-pulse';
                    labelColors = 'text-blue-600 font-extrabold';
                  } else if (step.key === 'preparing') {
                    nodeColors = 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/25 animate-pulse';
                    labelColors = 'text-amber-600 font-extrabold';
                  } else if (step.key === 'ready') {
                    nodeColors = 'bg-[#F8A324] border-[#F8A324] text-white shadow-md shadow-[#F8A324]/25 animate-pulse';
                    labelColors = 'text-[#F8A324] font-black';
                  } else if (step.key === 'served') {
                    nodeColors = 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25';
                    labelColors = 'text-emerald-600 font-extrabold';
                  } else if (step.key === 'out_for_delivery') {
                    nodeColors = 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/25 animate-pulse';
                    labelColors = 'text-indigo-600 font-extrabold';
                  } else if (step.key === 'delivered') {
                    nodeColors = 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25';
                    labelColors = 'text-emerald-600 font-extrabold';
                  }
                } else if (isCompleted) {
                  nodeColors = 'bg-emerald-500 border-emerald-500 text-white';
                  labelColors = 'text-gray-800 font-bold';
                }

                return (
                  <div key={step.key} className="relative flex gap-4 items-start">
                    {/* Circle Node */}
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 z-10 ${nodeColors}`}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <IconComponent className="w-4 h-4" />
                      )}
                    </div>

                    {/* Step description */}
                    <div className="min-w-0 flex-1 pt-1">
                      <h4 className={`font-bold text-sm ${labelColors}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items Summary list */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-1.5 font-serif font-black text-base text-gray-900 mb-4 pb-2 border-b border-gray-100">
            <Receipt className="w-4 h-4 text-gray-400" />
            <h3>Items in this Ticket</h3>
          </div>
          
          <div className="divide-y divide-gray-50 space-y-3 pb-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start text-sm pt-3 first:pt-0">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-gray-150 text-gray-700 px-2 py-0.5 rounded">
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-gray-800 truncate">{item.name}</span>
                  </div>
                  {item.notes && (
                    <span className="text-xs text-[#691F1A] font-semibold italic block ml-9 mt-0.5">
                      Note: {item.notes}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-gray-900 shrink-0">
                  {restaurantConfig.currency}{(parseFloat(item.price) * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs text-neutral-500 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm font-bold text-neutral-900">
              <span>Total Amount</span>
              <span className="text-[#691F1A] font-black text-base">{restaurantConfig.currency}{finalTotal.toFixed(0)}</span>
            </div>
          </div>

          <button
            onClick={handlePrintInvoice}
            className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 bg-[#FFF9EE] border border-[#F8A324]/30 text-[#691F1A] hover:bg-[#FFF3D6] rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
          >
            <Receipt className="w-4 h-4 text-[#691F1A]" />
            Download / Print Bill
          </button>
        </div>

        {/* Support Buttons */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <a
            href={generateWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-colors text-center cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.56 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp</span>
          </a>

          <a
            href={`tel:${restaurantConfig.supportPhone}`}
            className="flex items-center justify-center gap-2 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black py-3 px-4 rounded-xl text-xs transition-colors text-center cursor-pointer shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-[#F8A324]" />
            <span>Call Support</span>
          </a>
        </div>
      </main>
    </div>
  );
}
