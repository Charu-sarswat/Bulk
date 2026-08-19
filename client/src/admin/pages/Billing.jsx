import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  CreditCard, Calendar, CheckCircle2, ChevronRight, 
  Users, Layers, QrCode, AlertTriangle 
} from 'lucide-react';

export default function Billing() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchBillingInfo = async () => {
    try {
      const subRes = await fetch(`${apiUrl}/api/restaurant/subscription`);
      const subData = await subRes.json();
      if (subRes.ok) {
        setData(subData);
      } else {
        addToast(subData.message || 'Error fetching subscription', 'error');
      }

      // Fetch public plans list for upgrade selector
      const plansRes = await fetch(`${apiUrl}/api/superadmin/plans`); // Fallback if no permissions, but superadmin plans is public for admins
      const plansData = await plansRes.json();
      if (plansRes.ok) {
        setPlans(plansData);
      }
    } catch (err) {
      console.error(err);
      addToast('Error contacting server for billing information', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const handleRenew = async () => {
    if (!window.confirm('Would you like to simulate plan renewal? this will extend your contract.')) return;
    try {
      const res = await fetch(`${apiUrl}/api/restaurant/subscription/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const resData = await res.json();
      if (res.ok) {
        addToast('Subscription successfully extended!', 'success');
        fetchBillingInfo();
      } else {
        addToast(resData.message || 'Renewal failed', 'error');
      }
    } catch (err) {
      addToast('Renewal failed', 'error');
    }
  };

  const handleUpgrade = async (planId, billingCycle) => {
    if (!window.confirm('Confirm upgrading to this plan?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/restaurant/subscription/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle })
      });
      const resData = await res.json();
      if (res.ok) {
        addToast('Plan updated successfully!', 'success');
        setShowUpgradeModal(false);
        fetchBillingInfo();
      } else {
        addToast(resData.message || 'Upgrade failed', 'error');
      }
    } catch (err) {
      addToast('Upgrade failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F8A324] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-800 text-sm flex items-center gap-2 max-w-xl mx-auto">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span>No active subscription found. Contact Super Admin to register.</span>
      </div>
    );
  }

  const { subscription, usage } = data;
  const isPlanExpired = new Date(subscription.endDate) <= new Date();

  return (
    <div className="space-y-8 p-1 sm:p-4">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-black text-[#3C110D]">Billing & Subscription</h2>
        <p className="text-gray-500 text-xs mt-1">Review active plan restrictions, metrics, and manage plan cycles.</p>
      </div>

      {/* Plan Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Contract info */}
        <div className="lg:col-span-2 bg-[#260907] border border-[#F8A324]/20 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[300px]">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#F8A324]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-amber-200/70 font-black uppercase tracking-widest block">Active Plan Tier</span>
                <span className="text-2xl font-serif font-black text-amber-100">{subscription.planId?.name}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                isPlanExpired 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/35'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
              }`}>
                {isPlanExpired ? 'Contract Expired' : 'Active'}
              </span>
            </div>

            <p className="text-amber-100/70 text-xs max-w-xl">{subscription.planId?.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/5 pt-4">
              <div>
                <span className="text-[9px] text-amber-200/50 font-black uppercase block">Billing Cycle</span>
                <span className="text-xs font-bold text-white capitalize">{subscription.billingCycle}</span>
              </div>
              <div>
                <span className="text-[9px] text-amber-200/50 font-black uppercase block">Price Paid</span>
                <span className="text-xs font-bold text-white">₹{subscription.amount}</span>
              </div>
              <div>
                <span className="text-[9px] text-amber-200/50 font-black uppercase block">Comm. Cut</span>
                <span className="text-xs font-bold text-white">{subscription.commissionPercentage}% on Paid Orders</span>
              </div>
              <div>
                <span className="text-[9px] text-amber-200/50 font-black uppercase block">Expiry Date</span>
                <span className="text-xs font-bold text-white">{new Date(subscription.endDate).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
            <button
              onClick={handleRenew}
              className="bg-gradient-to-r from-[#F8A324] to-[#FFB74D] hover:brightness-110 text-[#3C110D] font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#F8A324]/20"
            >
              Renew Subscription
            </button>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/10"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Right Side: Limits and Resource Counts */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-[#3C110D] uppercase tracking-widest border-b border-gray-100 pb-2">Active Limit Utilization</h3>
          
          {/* Tables Limit */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1.5"><QrCode className="w-4 h-4 text-gray-505" /> Tables Registered</span>
              <span className="font-extrabold text-gray-900">{usage.tables.current} / {usage.tables.max === -1 ? '∞' : usage.tables.max}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${usage.tables.max === -1 ? 10 : Math.min(100, (usage.tables.current / usage.tables.max) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Staff Limit */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-505" /> Staff Accounts</span>
              <span className="font-extrabold text-gray-900">{usage.staff.current} / {usage.staff.max === -1 ? '∞' : usage.staff.max}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${usage.staff.max === -1 ? 10 : Math.min(100, (usage.staff.current / usage.staff.max) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Menu Items Limit */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1.5"><Layers className="w-4 h-4 text-gray-505" /> Menu Catalog Items</span>
              <span className="font-extrabold text-gray-900">{usage.menuItems.current} / {usage.menuItems.max === -1 ? '∞' : usage.menuItems.max}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${usage.menuItems.max === -1 ? 10 : Math.min(100, (usage.menuItems.current / usage.menuItems.max) * 100)}%` }} 
              />
            </div>
          </div>

        </div>
      </div>

      {/* UPGRADE PLAN MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-serif font-black text-[#3C110D] text-base uppercase tracking-wider">Select Subscription Plan Upgrade</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isCurrent = p._id === subscription.planId?._id;
                return (
                  <div key={p._id} className={`border rounded-2xl p-6 flex flex-col justify-between min-h-[350px] transition-all ${
                    isCurrent 
                      ? 'border-[#F8A324] bg-amber-50/20 shadow-md ring-2 ring-[#F8A324]' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-serif font-black text-gray-800 text-base">{p.name}</span>
                        {isCurrent && (
                          <span className="bg-[#F8A324]/10 border border-[#F8A324]/20 text-[#F8A324] text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-[11px] min-h-[32px]">{p.description}</p>
                      
                      <div className="border-t border-gray-100 pt-3">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Pricing models</span>
                        <div className="flex gap-4 mt-1">
                          <div>
                            <span className="text-[9px] text-gray-500 font-bold block">Monthly</span>
                            <span className="text-xs font-black text-gray-800">₹{p.monthlyPrice}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-bold block">Yearly</span>
                            <span className="text-xs font-black text-gray-800">₹{p.yearlyPrice}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Commission Split:</span>
                          <span className="font-extrabold text-gray-800">{p.commissionPercentage}% cut</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Tables limit:</span>
                          <span className="font-extrabold text-gray-800">{p.maxTables === -1 ? 'Unlimited' : p.maxTables}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Staff limit:</span>
                          <span className="font-extrabold text-gray-800">{p.maxStaff === -1 ? 'Unlimited' : p.maxStaff}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Items limit:</span>
                          <span className="font-extrabold text-gray-800">{p.maxMenuItems === -1 ? 'Unlimited' : p.maxMenuItems}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                      {!isCurrent ? (
                        <>
                          <button
                            onClick={() => handleUpgrade(p._id, 'monthly')}
                            className="w-full bg-[#3C110D] hover:bg-[#5C1F1A] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Upgrade Monthly
                          </button>
                          <button
                            onClick={() => handleUpgrade(p._id, 'yearly')}
                            className="w-full bg-gradient-to-r from-[#F8A324] to-[#FFB74D] text-[#3C110D] hover:brightness-105 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Upgrade Yearly
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-xs text-gray-400 font-extrabold py-2">
                          Active Tier
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
