import React, { useState, useEffect } from 'react';
import { X, Trash2, CreditCard, ShoppingBag, Banknote, Clipboard, Plus, RefreshCw, Utensils, Calendar, Clock, Phone, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../context/ToastContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { restaurantConfig } from '../../config/restaurant';
import PaymentModal from './PaymentModal';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  tableId, 
  tableNumber, 
  updateCartQuantity, 
  removeFromCart, 
  clearCart, 
  onOrderPlaced,
  menuItems = [],
  addToCart
}) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { addToast } = useToast();
  const { customerUser, customerToken } = useCustomerAuth();
  
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [deliveryFee, setDeliveryFee] = useState(45);
  const [freeThreshold, setFreeThreshold] = useState(399);

  useEffect(() => {
    if (isOpen) {
      fetch(`${apiUrl}/api/settings`)
        .then(res => res.json())
        .then(data => {
          if (data.delivery_fee !== undefined) setDeliveryFee(data.delivery_fee);
          if (data.free_delivery_threshold !== undefined) setFreeThreshold(data.free_delivery_threshold);
        })
        .catch(err => console.error('Failed to load settings:', err));
    }
  }, [isOpen, apiUrl]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Dining and Channels
  const [orderChannel, setOrderChannel] = useState('dine_in');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'en'
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setDeliveryAddress(data.display_name);
              setCoordinates({ latitude, longitude });
              addToast('Location detected successfully!', 'success');
            } else {
              setDeliveryAddress(`${latitude}, ${longitude}`);
              setCoordinates({ latitude, longitude });
              addToast('Coordinates fetched, but address lookup failed.', 'warning');
            }
          } else {
            setDeliveryAddress(`${latitude}, ${longitude}`);
            setCoordinates({ latitude, longitude });
            addToast('Coordinates fetched, but address lookup failed.', 'warning');
          }
        } catch (err) {
          console.error(err);
          setDeliveryAddress(`${latitude}, ${longitude}`);
          setCoordinates({ latitude, longitude });
          addToast('Coordinates fetched, but address lookup failed.', 'warning');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        addToast(error.message || 'Failed to retrieve location.', 'error');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Scheduled Order State
  const [orderTimeType, setOrderTimeType] = useState('now'); // 'now' or 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Guest checkout details (phone is mandatory)
  const [guestName, setGuestName] = useState(() => localStorage.getItem('guest_name') || '');
  const [guestPhone, setGuestPhone] = useState(() => localStorage.getItem('guest_phone') || '');

  useEffect(() => {
    if (orderChannel === 'delivery') {
      setPaymentMethod('upi');
    } else {
      if (paymentMethod === 'cod') {
        setPaymentMethod('counter');
      }
    }
  }, [orderChannel, paymentMethod]);

  if (!isOpen) return null;

  // Totals Calculation based on item price
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const activeDeliveryFee = (orderChannel === 'delivery' && subtotal < freeThreshold) ? deliveryFee : 0;
  const total = subtotal + activeDeliveryFee;

  const submitOrder = async (utrData = null) => {
    setSubmitting(true);

    const activePhone = customerUser ? customerUser.phone : guestPhone.trim();
    const activeName = customerUser ? customerUser.name : guestName.trim();

    const orderPayload = {
      table_id: null,
      table_snapshot: orderChannel === 'dine_in' ? 'Dine-In' : orderChannel.toUpperCase(),
      customer_name: activeName || 'Guest Customer',
      customer_phone: activePhone,
      order_channel: orderChannel,
      delivery_address: orderChannel === 'delivery' ? deliveryAddress.trim() : '',
      latitude: orderChannel === 'delivery' && coordinates ? coordinates.latitude : null,
      longitude: orderChannel === 'delivery' && coordinates ? coordinates.longitude : null,
      payment_method: paymentMethod,
      payment_utr: utrData?.utr || '',
      notes: orderNotes,
      scheduled_time: orderTimeType === 'scheduled' && scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}:00` : null,
      items: cart.map(item => ({
        menu_item_id: item.menu_item_id || item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || ''
      }))
    };

    if (customerUser) {
      orderPayload.customer_id = customerUser.id;
    } else {
      localStorage.setItem('guest_name', guestName);
      localStorage.setItem('guest_phone', guestPhone);
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (customerToken) headers['Authorization'] = `Bearer ${customerToken}`;

      const response = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      // Save order to local history
      const savedOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
      localStorage.setItem('my_orders', JSON.stringify([data.id, ...savedOrders]));

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#c5a880', '#ffffff', '#282a35']
      });

      addToast('Order submitted successfully to Bombay Chowpati Kitchen!', 'success');
      clearCart();
      onOrderPlaced(data.id);
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
      setIsPaymentModalOpen(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      addToast('Your cart is empty', 'warning');
      return;
    }

    const activePhone = customerUser ? customerUser.phone : guestPhone.trim();
    const activeName = customerUser ? customerUser.name : guestName.trim();

    if (!activeName) {
      addToast('Please enter your name', 'warning');
      return;
    }

    if (!activePhone || activePhone.length < 10) {
      addToast('Customer phone number is compulsory for checkout', 'warning');
      return;
    }

    if (orderChannel === 'delivery' && !deliveryAddress.trim()) {
      addToast('Please enter your delivery address', 'warning');
      return;
    }

    if (orderTimeType === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      addToast('Please pick a valid Date and Time for scheduled order', 'warning');
      return;
    }

    if (paymentMethod === 'upi') {
      setIsPaymentModalOpen(true);
    } else {
      submitOrder();
    }
  };

  const suggestedItems = menuItems
    .filter(item => !cart.some(c => c.menu_item_id === item.id))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="pointer-events-auto w-screen max-w-md transform bg-[#FFF9EE] text-gray-900 shadow-2xl transition-all duration-300 flex flex-col h-full border-l border-[#F8A324]/30">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#F8A324]/20 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#691F1A]" />
              <h3 className="font-serif font-black text-base text-gray-900">Your Cart</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                100% Pure Veg
              </span>
              <button 
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-150 text-gray-500 hover:text-gray-800 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#F8A324]/30 text-[#691F1A] flex items-center justify-center mb-4 shadow-md">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif font-black text-base text-gray-850 mb-1">Your cart is empty</h4>
                <p className="text-xs text-gray-400 max-w-xs mb-6 leading-relaxed font-light">
                  Explore Bombay Chowpati delicacies and add signature items to your cart.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Items loop */}
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div 
                      key={`${item.menu_item_id}-${index}`}
                      className="flex gap-3 p-3 border border-[#F8A324]/20 rounded-2xl bg-white hover:border-[#691F1A]/40 transition-colors shadow-sm"
                    >
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded-xl shrink-0 bg-gray-50 border border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{item.name}</h4>
                            <span className="font-black text-[#691F1A] text-xs sm:text-sm shrink-0">
                              {restaurantConfig.currency}{(parseFloat(item.price) * item.quantity).toFixed(0)}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[10px] text-[#691F1A] font-semibold mt-0.5 italic truncate bg-[#FFF9EE] px-1.5 py-0.5 rounded border border-[#F8A324]/30 w-max max-w-full">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                            <button
                              onClick={() => updateCartQuantity(item.menu_item_id, item.notes, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded transition-all font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs text-gray-700">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.menu_item_id, item.notes, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded transition-all font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.menu_item_id, item.notes)}
                            className="text-gray-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                {suggestedItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h5 className="text-[10px] font-black text-[#691F1A] uppercase tracking-widest block">
                      Recommended Street Snacks
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestedItems.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-2.5 border border-[#F8A324]/20 rounded-xl bg-white hover:border-[#691F1A]/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image_url && (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-9 h-9 object-cover rounded-lg shrink-0 border border-gray-150 bg-gray-50" 
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-[#691F1A] font-black">{restaurantConfig.currency}{parseFloat(item.price).toFixed(0)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(item, 1)}
                            className="bg-[#FFF9EE] hover:bg-[#FFF3D6] text-[#691F1A] text-[10px] font-black px-3 py-1.5 rounded-lg border border-[#F8A324]/30 transition-all cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <hr className="border-gray-200/60" />

                {/* Mandatory Phone & Customer Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-gray-550 uppercase tracking-widest flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#691F1A]" />
                      Customer Details (Phone Compulsory) *
                    </label>
                  </div>
                  {customerUser ? (
                    <div className="bg-emerald-50 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-800">
                      <span className="font-bold text-emerald-800 block">Logged in as {customerUser.name}</span>
                      <span className="text-[11px] text-gray-500 block mt-0.5">Phone: {customerUser.phone}</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 bg-white p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Your Full Name *</span>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#691F1A]"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">
                          Phone Number (Compulsory) *
                        </span>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="10-digit Mobile Number"
                          className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#691F1A]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200/60" />

                {/* Schedule Orders Option */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#691F1A]" />
                    Order Timing (Immediate vs Scheduled)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderTimeType('now')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        orderTimeType === 'now'
                          ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A]'
                          : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Immediate Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderTimeType('scheduled')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        orderTimeType === 'scheduled'
                          ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A]'
                          : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Schedule Order
                    </button>
                  </div>

                  {orderTimeType === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Pick Date *</span>
                        <input
                          type="date"
                          required
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#691F1A]"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Pick Time Slot *</span>
                        <input
                          type="time"
                          required
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#691F1A]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200/60" />

                {/* Order Channel Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest block">
                    Order Channel & Dining Type
                  </label>
                  <select
                    value={orderChannel}
                    onChange={(e) => setOrderChannel(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-[#691F1A]"
                  >
                    <option value="dine_in">Dine-In</option>
                    <option value="takeaway">Takeaway (Self Pickup)</option>
                    <option value="delivery">Home Delivery</option>
                  </select>


                  {orderChannel === 'delivery' && (
                    <div className="pt-1 animate-fade-in space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Delivery Address *</span>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={detectingLocation}
                          className="text-[9px] font-black text-[#691F1A] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {detectingLocation ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <span>📍 Detect Location</span>
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        required
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          setCoordinates(null);
                        }}
                        placeholder="Enter complete address for delivery..."
                        rows="2"
                        className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#691F1A] resize-none font-semibold placeholder:font-normal"
                      />
                    </div>
                  )}
                </div>

                <hr className="border-gray-200/60" />

                {/* Kitchen Notes */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                    Special Kitchen Instructions
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Instructions for chef (e.g. extra spicy, less chutney)..."
                    rows="2"
                    className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#691F1A] resize-none"
                  />
                </div>

                <hr className="border-gray-200/60" />

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payment Method *
                  </label>
                  <div className={orderChannel === 'delivery' ? "block" : "grid grid-cols-2 gap-2"}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        paymentMethod === 'upi'
                          ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A]'
                          : 'border-gray-250 bg-white text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Pay Online (UPI)
                    </button>
                    {orderChannel !== 'delivery' && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('counter')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          paymentMethod === 'counter'
                            ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A]'
                            : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Pay at Counter
                      </button>
                    )}
                  </div>
                </div>

                <hr className="border-gray-200/60" />

                {/* Total Breakdown */}
                <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                    <span>Items Subtotal</span>
                    <span>{restaurantConfig.currency}{subtotal.toFixed(0)}</span>
                  </div>
                  {orderChannel === 'delivery' && (
                    <>
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                        <span>Delivery Charges</span>
                        {activeDeliveryFee === 0 ? (
                          <span className="text-emerald-600 font-extrabold uppercase text-[10px]">Free Delivery</span>
                        ) : (
                          <span>{restaurantConfig.currency}{activeDeliveryFee.toFixed(0)}</span>
                        )}
                      </div>
                      <div className={`text-[10px] font-bold p-2.5 rounded-xl text-center transition-all ${
                        activeDeliveryFee === 0 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50' 
                          : 'bg-amber-50 text-amber-800 border border-amber-100/50'
                      }`}>
                        {activeDeliveryFee === 0 ? (
                          <span>🎉 Free delivery applied!</span>
                        ) : (
                          <span>💡 Add <strong>{restaurantConfig.currency}{Math.ceil(freeThreshold - subtotal)}</strong> more for <strong>FREE Delivery</strong> (on orders above {restaurantConfig.currency}{freeThreshold})</span>
                        )}
                      </div>
                    </>
                  )}
                  <hr className="border-gray-100" />
                  <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                    <span>Total Amount</span>
                    <span className="text-[#691F1A] font-black text-base">{restaurantConfig.currency}{total.toFixed(0)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Sticky Place Order Button */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-150 bg-white shrink-0">
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-110 uppercase tracking-wider text-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Order...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment — {restaurantConfig.currency}{total.toFixed(0)}</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={(utrData) => submitOrder(utrData)}
        totalAmount={total}
      />
    </div>
  );
}
