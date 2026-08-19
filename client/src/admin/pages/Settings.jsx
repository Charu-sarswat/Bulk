import React, { useState, useEffect } from 'react';
import { Save, Truck, Sparkles, Settings as SettingsIcon, AlertCircle, Shield, QrCode } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../components/PageHeader';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Settings() {
  const { addToast } = useToast();
  const { token } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [deliveryFee, setDeliveryFee] = useState(45);
  const [freeThreshold, setFreeThreshold] = useState(399);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true);
  const [deliveryDisabledNotice, setDeliveryDisabledNotice] = useState('Home Delivery is temporarily paused. Please choose Takeaway (Self Pickup) or Dine-In!');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [storeOpeningTime, setStoreOpeningTime] = useState('11:30');
  const [storeClosingTime, setStoreClosingTime] = useState('23:30');
  const [storeClosedMessage, setStoreClosedMessage] = useState('We are currently closed for orders. Please visit during regular hours (11:30 AM - 11:30 PM)!');
  
  // UPI Payment Settings
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load current settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.delivery_fee !== undefined) setDeliveryFee(data.delivery_fee);
          if (data.free_delivery_threshold !== undefined) setFreeThreshold(data.free_delivery_threshold);
          if (data.is_delivery_enabled !== undefined) setIsDeliveryEnabled(Boolean(data.is_delivery_enabled));
          if (data.delivery_disabled_notice !== undefined) setDeliveryDisabledNotice(data.delivery_disabled_notice);
          if (data.is_store_open !== undefined) setIsStoreOpen(Boolean(data.is_store_open));
          if (data.store_opening_time !== undefined) setStoreOpeningTime(data.store_opening_time);
          if (data.store_closing_time !== undefined) setStoreClosingTime(data.store_closing_time);
          if (data.store_closed_message !== undefined) setStoreClosedMessage(data.store_closed_message);
          if (data.upi_id !== undefined) setUpiId(data.upi_id);
          if (data.upi_name !== undefined) setUpiName(data.upi_name);
          if (data.upi_qr_url !== undefined) setUpiQrUrl(data.upi_qr_url);
          if (data.is_payment_enabled !== undefined) setIsPaymentEnabled(Boolean(data.is_payment_enabled));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        addToast('Failed to load settings from server.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [apiUrl, addToast]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_fee: Number(deliveryFee),
          free_delivery_threshold: Number(freeThreshold),
          is_delivery_enabled: isDeliveryEnabled,
          delivery_disabled_notice: deliveryDisabledNotice,
          is_store_open: isStoreOpen,
          store_opening_time: storeOpeningTime,
          store_closing_time: storeClosingTime,
          store_closed_message: storeClosedMessage,
          upi_id: upiId.trim(),
          upi_name: upiName.trim(),
          upi_qr_url: upiQrUrl.trim(),
          is_payment_enabled: isPaymentEnabled
        })
      });

      const data = await res.json();
      if (res.ok) {
        addToast('System settings updated successfully!', 'success');
      } else {
        addToast(data.message || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="System Configuration"
        description="Manage global delivery rules, shipping thresholds, and courier integrations."
        icon={SettingsIcon}
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-gray-800 tracking-wide">Home Delivery & Shipping Configuration</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Toggle home delivery on/off and define pricing guidelines</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                isDeliveryEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isDeliveryEnabled ? '🟢 Delivery Active' : '🔴 Delivery Paused'}
              </span>
            </div>

            <div className="space-y-5">
              {/* Home Delivery Active Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF9EE] border border-gray-200/80">
                <div>
                  <label className="block text-xs font-bold text-gray-800">Home Delivery Service</label>
                  <p className="text-[10px] text-gray-500 mt-0.5">When disabled, customers can only choose Dine-In or Takeaway (Self Pickup).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeliveryEnabled(!isDeliveryEnabled)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    isDeliveryEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                    isDeliveryEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {!isDeliveryEnabled && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-bold text-gray-600">Delivery Disabled Announcement Notice</label>
                  <textarea
                    rows="2"
                    value={deliveryDisabledNotice}
                    onChange={(e) => setDeliveryDisabledNotice(e.target.value)}
                    className="w-full bg-[#FFF9EE] border border-gray-250 rounded-xl px-4 py-2 text-xs text-gray-850 focus:outline-none focus:border-[#691F1A] font-semibold"
                    placeholder="Notice shown to customers when Home Delivery is paused..."
                  />
                  <span className="text-[10px] text-gray-400 block font-medium">Customers selecting delivery will see this explanation banner.</span>
                </div>
              )}
              {/* Delivery Fee Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">Flat Delivery Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full bg-[#FFF9EE] border border-gray-250 rounded-xl px-4 py-2.5 text-xs text-gray-850 focus:outline-none focus:border-[#691F1A] font-bold"
                  placeholder="e.g. 45"
                />
                <span className="text-[10px] text-gray-400 block font-medium">This amount will be added to the customer's cart for Home Delivery.</span>
              </div>

              {/* Free Delivery Threshold Input */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-gray-600">Free Delivery Threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(e.target.value)}
                  className="w-full bg-[#FFF9EE] border border-gray-250 rounded-xl px-4 py-2.5 text-xs text-gray-850 focus:outline-none focus:border-[#691F1A] font-bold"
                  placeholder="e.g. 399"
                />
                <span className="text-[10px] text-gray-400 block font-medium">Orders with a subtotal greater than or equal to this amount qualify for free delivery.</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-5 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-[#F8A324] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Settings</span>
              </button>
            </div>
          </div>

          {/* Store Operation & Orders Restriction Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-[#691F1A] flex items-center justify-center font-bold shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-gray-800 tracking-wide">Store Status & Order Acceptance</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Control whether customer side ordering is active or locked</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                isStoreOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isStoreOpen ? '🟢 Accepting Orders' : '🔴 Closed / Restricted'}
              </span>
            </div>

            <div className="space-y-5">
              {/* Store Open Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF9EE] border border-gray-200/80">
                <div>
                  <label className="block text-xs font-bold text-gray-800">Store Ordering Active</label>
                  <p className="text-[10px] text-gray-500 mt-0.5">When disabled, customer online orders are blocked with your custom notice.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStoreOpen(!isStoreOpen)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    isStoreOpen ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                    isStoreOpen ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Store Opening & Closing Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FFF9EE] border border-gray-200/80">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Store Opening Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={storeOpeningTime}
                    onChange={(e) => setStoreOpeningTime(e.target.value)}
                    className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#691F1A] font-bold"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Default: 11:30 (11:30 AM)</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Store Closing Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={storeClosingTime}
                    onChange={(e) => setStoreClosingTime(e.target.value)}
                    className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#691F1A] font-bold"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Default: 23:30 (11:30 PM)</span>
                </div>
              </div>

              {/* Store Closed Message */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">Store Closed Announcement Notice</label>
                <textarea
                  rows="2"
                  value={storeClosedMessage}
                  onChange={(e) => setStoreClosedMessage(e.target.value)}
                  className="w-full bg-[#FFF9EE] border border-gray-250 rounded-xl px-4 py-2 text-xs text-gray-850 focus:outline-none focus:border-[#691F1A] font-semibold"
                  placeholder="Message shown to customers when ordering is disabled..."
                />
                <span className="text-[10px] text-gray-400 block font-medium">This banner will appear in the customer cart when the store is closed or outside operating hours.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-5 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </button>
            </div>
          </div>

          {/* UPI & Mess Payment QR Settings */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#F8A324]" />
                <div>
                  <h3 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">UPI / QR Payment Settings</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Configure this Mess's UPI ID & QR Code for customer wallet top-ups.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaymentEnabled}
                  onChange={(e) => setIsPaymentEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Mess UPI ID (VPA) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. bombaychowpati@upi or 9876543210@paytm"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white transition-all font-mono"
                />
                <span className="text-[10px] text-gray-400 block font-medium">Customers will be asked to pay to this UPI ID.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  UPI Payee Name
                </label>
                <input
                  type="text"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  placeholder="e.g. Bombay Chowpati Food Mess"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white transition-all"
                />
                <span className="text-[10px] text-gray-400 block font-medium">Business / Account Name shown on UPI payment apps.</span>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  QR Code Image URL (Optional / Cloudinary)
                </label>
                <input
                  type="url"
                  value={upiQrUrl}
                  onChange={(e) => setUpiQrUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or uploaded QR link"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white transition-all font-mono"
                />
                <span className="text-[10px] text-gray-400 block font-medium">If provided, this QR image will be displayed for customers to scan. If left empty, a dynamic UPI QR will be auto-rendered.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-5 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Payment Settings</span>
              </button>
            </div>
          </div>

          {/* Pricing Preview / Simulator Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-gray-800 tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F8A324]" />
              Customer Checkout Preview
            </h4>
            <div className="bg-[#FFF9EE] rounded-2xl p-4 space-y-2 border border-orange-100/50">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Subtotal less than ₹{freeThreshold}</span>
                <span className="font-semibold text-gray-800">Subtotal + ₹{deliveryFee} Delivery Fee</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-medium border-t border-gray-200/50 pt-2">
                <span>Subtotal of ₹{freeThreshold} or more</span>
                <span className="font-extrabold text-emerald-600 uppercase text-[10px]">Free Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Status Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Truck className="w-5 h-5 text-[#F8A324]" />
              <h3 className="font-black text-xs text-gray-800 uppercase tracking-wider">Couriers & Partners</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-emerald-100 rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-gray-800">🛵 Borzo Express 2-Wheeler</span>
                  <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Active & Connected
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium leading-none">Pickup Hub</p>
                  <p className="text-[10px] text-gray-700 font-mono mt-1 font-bold truncate">Shop 36, MPM Mall, Abids Road, Hyderabad</p>
                </div>
                <p className="text-[9px] text-gray-500 leading-normal font-medium pt-1">
                  Borzo Business API v1.8 is active. Fast point-to-point bike dispatches are automatically triggered when kitchen prepares the order.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-2xl space-y-1.5 opacity-70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-gray-700">Shadowfax Hyperlocal</span>
                  <span className="bg-gray-200 text-gray-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Backup Provider
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 font-medium">Configured as alternate fallback provider.</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F8A324] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-bold text-[11px] text-amber-950">Credential Security</h5>
              <p className="text-[10px] text-amber-800/80 leading-relaxed font-medium">
                To guarantee optimal safety, API credentials and partner setup constants are maintained securely inside system configuration files.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
