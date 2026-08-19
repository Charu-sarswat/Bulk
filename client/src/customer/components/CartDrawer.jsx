import React, { useState, useEffect } from 'react';
import { X, Trash2, CreditCard, ShoppingBag, Banknote, Clipboard, Plus, RefreshCw, Utensils, Calendar, Clock, Phone, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../context/ToastContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
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
  const { restaurant, table } = useRestaurant();
  
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [activeSub, setActiveSub] = useState(null);
  const [useSubscription, setUseSubscription] = useState(false);
  
  const [deliveryFee, setDeliveryFee] = useState(45);
  const [freeThreshold, setFreeThreshold] = useState(399);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true);
  const [deliveryDisabledNotice, setDeliveryDisabledNotice] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [storeOpeningTime, setStoreOpeningTime] = useState('11:30');
  const [storeClosingTime, setStoreClosingTime] = useState('23:30');
  const [storeClosedMessage, setStoreClosedMessage] = useState('');

  // Dining and Channels
  const [orderChannel, setOrderChannel] = useState('dine_in');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (isOpen && customerToken) {
      const checkSubscriptionAndWallet = async () => {
        try {
          const [subRes, walletRes] = await Promise.all([
            fetch(`${apiUrl}/api/student/subscriptions/active`, {
              headers: { 'Authorization': `Bearer ${customerToken}` }
            }),
            fetch(`${apiUrl}/api/student/wallet`, {
              headers: { 'Authorization': `Bearer ${customerToken}` }
            })
          ]);

          if (subRes.ok) {
            const data = await subRes.json();
            const activePlan = Array.isArray(data) ? data[0] : data;
            const bal = activePlan ? (activePlan.remainingBalance !== undefined ? activePlan.remainingBalance : (activePlan.initialBalance || 0)) : 0;
            if (activePlan && bal > 0) {
              setActiveSub(activePlan);
              setHasActiveSub(true);
            } else {
              setActiveSub(null);
              setHasActiveSub(false);
            }
          }

          if (walletRes.ok) {
            const walletData = await walletRes.json();
            if (walletData && walletData.balance !== undefined) {
              setWalletBalance(Number(walletData.balance) || 0);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      checkSubscriptionAndWallet();
    } else if (!isOpen) {
      setUseSubscription(false);
    }
  }, [isOpen, customerToken, restaurant, apiUrl]);

  const [restaurantUpi, setRestaurantUpi] = useState({ upiId: '', upiName: '', upiQrUrl: '' });

  useEffect(() => {
    const activeRestId = restaurant?._id || restaurant?.id || localStorage.getItem('restaurantId');
    if (isOpen) {
      const headers = {};
      if (activeRestId) headers['X-Restaurant-ID'] = activeRestId;

      fetch(`${apiUrl}/api/settings`, { headers })
        .then(res => res.json())
        .then(data => {
          if (data.delivery_fee !== undefined) setDeliveryFee(data.delivery_fee);
          if (data.free_delivery_threshold !== undefined) setFreeThreshold(data.free_delivery_threshold);
          if (data.is_delivery_enabled !== undefined) {
            const enabled = Boolean(data.is_delivery_enabled);
            setIsDeliveryEnabled(enabled);
            if (!enabled) {
              setOrderChannel(prev => (prev === 'delivery' ? 'takeaway' : prev));
            }
          }
          if (data.delivery_disabled_notice !== undefined) setDeliveryDisabledNotice(data.delivery_disabled_notice);
          if (data.is_store_open !== undefined) setIsStoreOpen(Boolean(data.is_store_open));
          if (data.store_opening_time !== undefined) setStoreOpeningTime(data.store_opening_time);
          if (data.store_closing_time !== undefined) setStoreClosingTime(data.store_closing_time);
          if (data.store_closed_message !== undefined) setStoreClosedMessage(data.store_closed_message);
          setRestaurantUpi({
            upiId: data.upi_id || '',
            upiName: data.upi_name || '',
            upiQrUrl: data.upi_qr_url || ''
          });
        })
        .catch(err => console.error('Failed to load settings:', err));
    }
  }, [isOpen, apiUrl, restaurant]);

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

  const [discountRules, setDiscountRules] = useState([]);

  useEffect(() => {
    const activeRestId = restaurant?._id || restaurant?.id || localStorage.getItem('restaurantId');
    if (isOpen && activeRestId) {
      fetch(`${apiUrl}/api/discounts/active?restaurantId=${activeRestId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDiscountRules(data);
        })
        .catch(err => console.error('Error fetching discount rules:', err));
    }
  }, [isOpen, restaurant, apiUrl]);

  if (!isOpen) return null;

  // ─── Real-Time Item-Level & Order Discount Engine (No Stacking) ─────────────
  let rawSubtotal = 0;
  let totalDiscount = 0;

  const itemsWithDiscount = cart.map(item => {
    const unitPrice = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity, 10) || 1;
    const lineSubtotal = Math.round((unitPrice * qty) * 100) / 100;
    rawSubtotal += lineSubtotal;

    const itemId = item.menu_item_id || item._id || item.id;
    const rule = discountRules.find(r => {
      const rItemId = r.menuItemId?._id || r.menuItemId;
      return rItemId?.toString() === itemId?.toString();
    });

    let bulkPct = 0;
    let subPct = 0;

    if (rule && rule.isActive) {
      // Bulk discount applies when quantity reaches bulkMinQuantity
      if (rule.bulkMinQuantity > 0 && qty >= rule.bulkMinQuantity && rule.bulkDiscountPercentage > 0) {
        bulkPct = rule.bulkDiscountPercentage;
      }
      // Subscription discount applies ONLY when customer has an active subscription AND selects "Use Platform Subscription Balance"
      if (useSubscription && hasActiveSub && rule.subscriptionDiscountPercentage > 0) {
        subPct = rule.subscriptionDiscountPercentage;
      }
    }

    // Pick higher discount (NO STACKING)
    let effectivePct = 0;
    let discountType = 'NONE';
    if (subPct > 0 && subPct >= bulkPct) {
      effectivePct = subPct;
      discountType = 'SUBSCRIPTION';
    } else if (bulkPct > 0) {
      effectivePct = bulkPct;
      discountType = 'BULK';
    }

    const itemDisc = Math.round((lineSubtotal * (effectivePct / 100)) * 100) / 100;
    const lineFinal = Math.round((lineSubtotal - itemDisc) * 100) / 100;
    totalDiscount += itemDisc;

    return {
      ...item,
      lineSubtotal,
      effectivePct,
      discountType,
      itemDisc,
      lineFinal
    };
  });

  rawSubtotal = Math.round(rawSubtotal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;
  const discountedFoodTotal = Math.max(0, Math.round((rawSubtotal - totalDiscount) * 100) / 100);

  const subtotal = rawSubtotal;
  const activeDeliveryFee = (orderChannel === 'delivery' && discountedFoodTotal < freeThreshold) ? deliveryFee : 0;
  const orderTotal = discountedFoodTotal + activeDeliveryFee;

  // 3-Tier Split Waterfall: Subscription -> Wallet -> UPI (never negative)
  const availableSubBal = (useSubscription && activeSub) ? Math.max(0, (activeSub.remainingBalance !== undefined ? activeSub.remainingBalance : (activeSub.initialBalance || 0))) : 0;
  const coveredBySub = Math.min(orderTotal, availableSubBal);
  const remainingAfterSub = Math.max(0, Math.round((orderTotal - coveredBySub) * 100) / 100);

  const availableWalletBal = ((useSubscription || paymentMethod === 'wallet') && customerUser) ? Math.max(0, walletBalance) : 0;
  const coveredByWallet = Math.min(remainingAfterSub, availableWalletBal);
  const remainingToPay = Math.max(0, Math.round((remainingAfterSub - coveredByWallet) * 100) / 100);

  const total = remainingToPay;

  const submitOrder = async (utrData = null) => {
    setSubmitting(true);

    const activePhone = customerUser ? customerUser.phone : guestPhone.trim();
    const activeName = customerUser ? customerUser.name : guestName.trim();

    const activeRestaurantId = restaurant?._id || restaurant?.id || localStorage.getItem('restaurantId');

    const orderPayload = {
      restaurantId: activeRestaurantId,
      table_id: table?.id || null,
      table_snapshot: orderChannel === 'dine_in' ? `Table ${table?.tableNumber || ''}` : orderChannel.toUpperCase(),
      customer_name: activeName || 'Guest Customer',
      customer_phone: activePhone,
      order_channel: orderChannel,
      delivery_address: orderChannel === 'delivery' ? deliveryAddress.trim() : '',
      latitude: orderChannel === 'delivery' && coordinates ? coordinates.latitude : null,
      longitude: orderChannel === 'delivery' && coordinates ? coordinates.longitude : null,
      payment_method: useSubscription ? 'online' : paymentMethod,
      payment_utr: utrData?.utr || '',
      notes: orderNotes,
      useSubscription: useSubscription,
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
      if (activeRestaurantId) headers['X-Restaurant-ID'] = activeRestaurantId;
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
      window.dispatchEvent(new Event('subscription_updated'));
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
    const isAlwaysOpen = import.meta.env.VITE_RESTAURANT_ALWAYS_OPEN === 'true';
    if (!isAlwaysOpen && !isStoreOpen) {
      addToast(storeClosedMessage || 'We are currently closed for orders. Please visit during regular hours!', 'error');
      return;
    }

    const openTimeStr = storeOpeningTime || '11:30';
    const closeTimeStr = storeClosingTime || '23:30';
    const [openH, openM] = openTimeStr.split(':').map(Number);
    const [closeH, closeM] = closeTimeStr.split(':').map(Number);
    const openMinutes = (openH * 60) + openM;
    const closeMinutes = (closeH * 60) + closeM;

    if (orderTimeType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        addToast('Please pick a valid Date and Time for scheduled order', 'warning');
        return;
      }
      const [sH, sM] = scheduledTime.split(':').map(Number);
      const schedMinutes = (sH * 60) + sM;
      const isWithinHours = closeMinutes > openMinutes
        ? (schedMinutes >= openMinutes && schedMinutes <= closeMinutes)
        : (schedMinutes >= openMinutes || schedMinutes <= closeMinutes);

      if (!isAlwaysOpen && !isWithinHours) {
        addToast(`Scheduled time (${scheduledTime}) must be between operating hours (${openTimeStr} to ${closeTimeStr}).`, 'warning');
        return;
      }
    } else {
      // Immediate order: check if current time is within operating hours
      const now = new Date();
      const curH = now.getHours();
      const curM = now.getMinutes();
      const currentMinutes = (curH * 60) + curM;
      const isWithinHours = closeMinutes > openMinutes
        ? (currentMinutes >= openMinutes && currentMinutes <= closeMinutes)
        : (currentMinutes >= openMinutes || currentMinutes <= closeMinutes);

      if (!isAlwaysOpen && !isWithinHours) {
        addToast(`We are currently closed. Our ordering hours are ${openTimeStr} to ${closeTimeStr}. You can schedule an order for later!`, 'warning');
        return;
      }
    }

    if (cart.length === 0) {
      addToast('Your cart is empty', 'warning');
      return;
    }

    const activePhone = customerUser ? (customerUser.phone || '') : guestPhone.trim();
    const activeName = customerUser ? (customerUser.name || '') : guestName.trim();

    if (!activeName || activeName.length < 2) {
      addToast('Customer Name is compulsory for ordering', 'warning');
      return;
    }

    const cleanPhone = activePhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      addToast('Customer phone number is compulsory and must be at least 10 digits', 'warning');
      return;
    }

    if (orderChannel === 'delivery' && !deliveryAddress.trim()) {
      addToast('Please enter your delivery address', 'warning');
      return;
    }

    // If remaining total is 0 (order is fully covered by Subscription and/or Wallet)
    if (total === 0) {
      submitOrder();
    } else if (paymentMethod === 'upi' || paymentMethod === 'wallet' || useSubscription) {
      // There is an uncovered remaining amount (e.g. ₹56) that must be paid via UPI
      setIsPaymentModalOpen(true);
    } else {
      // e.g. Pay at Counter (dine-in / takeaway)
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
              <ShoppingBag className="w-5 h-5 text-[#83560E]" />
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

          {/* Store Closed Warning Banner */}
          {!(import.meta.env.VITE_RESTAURANT_ALWAYS_OPEN === 'true') && !isStoreOpen && (
            <div className="bg-rose-50 border-b border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Store Currently Closed</p>
                <p className="text-[11px] text-rose-700 mt-0.5 font-medium">
                  {storeClosedMessage || `We are currently not accepting new orders. Please check back during operating hours (${storeOpeningTime} - ${storeClosingTime}).`}
                </p>
              </div>
            </div>
          )}

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#F8A324]/30 text-[#83560E] flex items-center justify-center mb-4 shadow-md">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif font-black text-base text-gray-850 mb-1">Your cart is empty</h4>
                <p className="text-xs text-gray-400 max-w-xs mb-6 leading-relaxed font-light">
                  Explore Bombay Chowpati delicacies and add signature items to your cart.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#83560E] hover:bg-[#68410d] text-[#F8A324] text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Items loop */}
                <div className="space-y-3">
                  {itemsWithDiscount.map((item, index) => (
                    <div 
                      key={`${item.menu_item_id}-${index}`}
                      className="flex gap-3 p-3 border border-[#F8A324]/20 rounded-2xl bg-white hover:border-[#83560E]/40 transition-colors shadow-sm"
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
                            <div>
                              <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{item.name}</h4>
                              {item.itemDisc > 0 && (
                                <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 mt-0.5">
                                  {item.discountType === 'SUBSCRIPTION' ? `👑 Pass ${item.effectivePct}% OFF` : `⚡ Bulk ${item.effectivePct}% OFF`}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {item.itemDisc > 0 && (
                                <span className="line-through text-gray-400 text-[10px] block">
                                  {restaurantConfig.currency}{item.lineSubtotal.toFixed(0)}
                                </span>
                              )}
                              <span className="font-black text-[#83560E] text-xs sm:text-sm">
                                {restaurantConfig.currency}{item.lineFinal.toFixed(0)}
                              </span>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-[10px] text-[#83560E] font-semibold mt-0.5 italic truncate bg-[#FFF9EE] px-1.5 py-0.5 rounded border border-[#F8A324]/30 w-max max-w-full">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                            <button
                              onClick={() => updateCartQuantity(item.menu_item_id, item.notes, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded transition-all font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs text-gray-700">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.menu_item_id, item.notes, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded transition-all font-bold text-xs cursor-pointer"
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
                    <h5 className="text-[10px] font-black text-[#83560E] uppercase tracking-widest block">
                      Recommended Street Snacks
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestedItems.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-2.5 border border-[#F8A324]/20 rounded-xl bg-white hover:border-[#83560E]/30 transition-colors"
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
                              <p className="text-[10px] text-[#83560E] font-black">{restaurantConfig.currency}{parseFloat(item.price).toFixed(0)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(item, 1)}
                            className="bg-[#FFF9EE] hover:bg-[#FFF3D6] text-[#83560E] text-[10px] font-black px-3 py-1.5 rounded-lg border border-[#F8A324]/30 transition-all cursor-pointer"
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
                      <Phone className="w-3.5 h-3.5 text-[#83560E]" />
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
                          className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#83560E]"
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
                          className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#83560E]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200/60" />

                {/* Schedule Orders Option */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold text-[#83560E] uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#83560E]" />
                    Order Timing (Immediate vs Scheduled)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderTimeType('now')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        orderTimeType === 'now'
                          ? 'border-[#83560E] bg-[#83560E]/5 text-[#83560E]'
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
                          ? 'border-[#83560E] bg-[#83560E]/5 text-[#83560E]'
                          : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Schedule Order
                    </button>
                  </div>

                  {orderTimeType === 'scheduled' && (
                    <div className="space-y-2 pt-1 animate-fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Pick Date *</span>
                          <input
                            type="date"
                            required
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#83560E]"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Pick Time Slot *</span>
                          <input
                            type="time"
                            required
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#83560E]"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg p-2 font-medium">
                        ⏰ Allowed ordering hours: <strong className="font-bold">{storeOpeningTime} to {storeClosingTime}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200/60" />

                {/* Order Channel Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-[#83560E] uppercase tracking-widest block">
                      Order Channel & Dining Type
                    </label>
                    {!isDeliveryEnabled && (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        🛵 Delivery Paused
                      </span>
                    )}
                  </div>
                  <select
                    value={orderChannel}
                    onChange={(e) => setOrderChannel(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-[#83560E]"
                  >
                    <option value="dine_in">🍽️ Dine-In</option>
                    <option value="takeaway">🛍️ Takeaway (Self Pickup)</option>
                    {isDeliveryEnabled ? (
                      <option value="delivery">🛵 Home Delivery</option>
                    ) : (
                      <option value="delivery" disabled>🛵 Home Delivery (Currently Unavailable)</option>
                    )}
                  </select>

                  {!isDeliveryEnabled && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[10px] text-amber-900 font-medium">
                      ℹ️ {deliveryDisabledNotice || 'Home Delivery is temporarily paused. Please choose Takeaway (Self Pickup) or Dine-In!'}
                    </div>
                  )}

                  {orderChannel === 'delivery' && (
                    <div className="pt-1 animate-fade-in space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Delivery Address *</span>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={detectingLocation}
                          className="text-[9px] font-black text-[#83560E] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                        className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#83560E] resize-none font-semibold placeholder:font-normal"
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
                    className="w-full text-xs p-2.5 border border-gray-250 rounded-xl bg-[#FFF9EE] text-gray-800 focus:outline-none focus:border-[#83560E] resize-none"
                  />
                </div>

                {/* Platform Subscription Checkbox & Breakdown */}
                {hasActiveSub && activeSub && (
                  <>
                    <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 max-w-[75%]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-900 block">Use Platform Subscription Balance</span>
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                              ANY OUTLET
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium block">
                            Pass Balance: <strong className="text-emerald-700 font-black">₹{(activeSub.remainingBalance !== undefined ? activeSub.remainingBalance : (activeSub.initialBalance || 0)).toFixed(0)}</strong>
                            {customerUser && walletBalance > 0 && (
                              <span className="ml-1 text-gray-400">| Wallet: <strong className="text-[#83560E]">₹{walletBalance.toFixed(0)}</strong></span>
                            )}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={useSubscription}
                          onChange={(e) => setUseSubscription(e.target.checked)}
                          className="w-5 h-5 accent-[#83560E] rounded cursor-pointer shrink-0"
                        />
                      </div>

                      {useSubscription && (
                        <div className="text-[10px] bg-white/90 p-2.5 rounded-xl border border-amber-200/50 space-y-1 font-semibold">
                          <div className="flex justify-between text-gray-600">
                            <span>1. Subscription Pass:</span>
                            <span className="text-emerald-700 font-bold">
                              - ₹{coveredBySub.toFixed(0)}
                            </span>
                          </div>
                          {coveredByWallet > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>2. Customer Wallet Balance:</span>
                              <span className="text-[#83560E] font-bold">
                                - ₹{coveredByWallet.toFixed(0)}
                              </span>
                            </div>
                          )}
                          {remainingToPay > 0 && (
                            <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-gray-100">
                              <span>3. Remaining via UPI / Online:</span>
                              <span>₹{remainingToPay.toFixed(0)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <hr className="border-gray-200/60" />
                  </>
                )}

                {/* Payment Method Selector (Shown when remaining amount > 0 or not using subscription) */}
                {(!useSubscription || total > 0) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#83560E]" />
                      {useSubscription && total > 0 ? `Pay Remaining (₹${total.toFixed(0)}) via *` : 'Payment Method *'}
                    </label>
                    <div className={`grid ${customerUser && walletBalance > 0 && !useSubscription ? (orderChannel === 'delivery' ? 'grid-cols-2' : 'grid-cols-3') : (orderChannel === 'delivery' ? 'grid-cols-1' : 'grid-cols-2')} gap-2`}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          paymentMethod === 'upi'
                            ? 'border-[#83560E] bg-[#83560E]/5 text-[#83560E]'
                            : 'border-gray-250 bg-white text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Pay Online (UPI)
                      </button>
                      {customerUser && walletBalance > 0 && !useSubscription && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('wallet')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            paymentMethod === 'wallet'
                              ? 'border-[#83560E] bg-[#83560E]/5 text-[#83560E]'
                              : 'border-gray-250 bg-white text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          👛 Wallet (₹{walletBalance.toFixed(0)})
                        </button>
                      )}
                      {orderChannel !== 'delivery' && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('counter')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            paymentMethod === 'counter'
                              ? 'border-[#83560E] bg-[#83560E]/5 text-[#83560E]'
                              : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          Pay at Counter
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <hr className="border-gray-200/60" />

                {/* Total Breakdown */}
                <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                    <span>Items Subtotal</span>
                    <span>{restaurantConfig.currency}{subtotal.toFixed(0)}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200/60">
                      <span>Item Discount (Best Offer Applied)</span>
                      <span>- {restaurantConfig.currency}{totalDiscount.toFixed(0)}</span>
                    </div>
                  )}

                  {useSubscription && coveredBySub > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200/60">
                      <span>Platform Subscription Pass</span>
                      <span>- {restaurantConfig.currency}{coveredBySub.toFixed(0)}</span>
                    </div>
                  )}

                  {useSubscription && coveredByWallet > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-[#83560E] bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/60">
                      <span>Customer Wallet Balance</span>
                      <span>- {restaurantConfig.currency}{coveredByWallet.toFixed(0)}</span>
                    </div>
                  )}

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
                          <span>💡 Add <strong>{restaurantConfig.currency}{Math.ceil(freeThreshold - discountedFoodTotal)}</strong> more for <strong>FREE Delivery</strong></span>
                        )}
                      </div>
                    </>
                  )}
                  <hr className="border-gray-100" />
                  <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                    <span>{useSubscription && total === 0 ? 'Fully Paid (Pass + Wallet)' : 'Final Payable Amount'}</span>
                    <span className="text-[#83560E] font-black text-base">{restaurantConfig.currency}{total.toFixed(0)}</span>
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
                className="w-full bg-[#83560E] hover:bg-[#68410d] text-white font-black py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Order...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {useSubscription && total === 0 
                        ? 'Place Order (Fully Covered)' 
                        : `Proceed to Pay — ${restaurantConfig.currency}${total.toFixed(0)}`}
                    </span>
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
        orderSummary={{
          orderTotal,
          subUsed: coveredBySub,
          walletUsed: coveredByWallet,
          upiAmount: total
        }}
        restaurantUpi={restaurantUpi}
      />
    </div>
  );
}
