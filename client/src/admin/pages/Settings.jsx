import React, { useState, useEffect } from 'react';
import { Save, Truck, Sparkles, Settings as SettingsIcon, AlertCircle, Shield } from 'lucide-react';
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
          free_delivery_threshold: Number(freeThreshold)
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
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm text-gray-800 tracking-wide">Delivery & Shipping Fees</h3>
                <p className="text-[10px] text-gray-400 font-medium">Define customer-facing delivery pricing guidelines</p>
              </div>
            </div>

            <div className="space-y-5">
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
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-orange-850">Shiprocket</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium leading-none">Registered Email</p>
                  <p className="text-[10px] text-gray-700 font-mono mt-1 font-bold truncate">shoebalimohammed03@gmail.com</p>
                </div>
                <p className="text-[9px] text-gray-500 leading-normal font-medium pt-1">
                  API integration is live. Delivery rides are automatically created when kitchen tickets transition to the "Ready" stage.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-2xl space-y-1.5 opacity-70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-gray-700">Shadowfax</span>
                  <span className="bg-gray-200 text-gray-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Inactive
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 font-medium">Integration configured as backup.</p>
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
