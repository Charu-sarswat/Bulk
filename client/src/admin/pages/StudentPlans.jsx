import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { History, ShieldCheck, Sparkles, User, Utensils, Receipt, Layers, TrendingUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function StudentPlans() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [activeTab, setActiveTab] = useState('usages'); // 'usages' | 'platform_plans'
  const [plans, setPlans] = useState([]);
  const [usagesData, setUsagesData] = useState({ totalConsumed: 0, totalOrders: 0, usages: [] });
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/restaurant/mess-plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsages = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/restaurant/mess-plans/usages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsagesData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchPlans(), fetchUsages()]);
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Platform Subscription Orders & Usages"
        subtitle="View all customer food orders consumed at your restaurant using their platform subscription balance."
      />

      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-amber-200 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>Platform Subscription Model:</strong> Food subscriptions are managed centrally by the Super Admin. When customers place food orders using their subscription balance at your outlet, the order amount is recorded below for payout settlement.
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Subscription Food Served</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">₹{usagesData.totalConsumed?.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Recorded for Super Admin settlement</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Subscription Orders</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{usagesData.totalOrders}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Fulfilled at your outlet</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-850 pb-2">
        <button
          onClick={() => setActiveTab('usages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'usages'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Subscription Consumption Ledger ({usagesData.usages?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('platform_plans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'platform_plans'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Platform Plans ({plans.length})</span>
        </button>
      </div>

      {/* Usages Ledger Tab */}
      {activeTab === 'usages' && (
        <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading consumption records...</div>
          ) : usagesData.usages?.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Utensils className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No subscription orders yet</h3>
              <p className="text-xs text-slate-400">
                When customers order food using their platform subscription at your outlet, the deductions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-900/60 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Order Number</th>
                    <th className="px-6 py-4">Platform Plan</th>
                    <th className="px-6 py-4 text-right">Order Amount Claimed</th>
                    <th className="px-6 py-4 text-right">Remaining Student Bal.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {usagesData.usages.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {new Date(u.usedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span>{u.studentName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.studentPhone}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-300">
                        #{u.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-amber-400 font-semibold">
                        {u.planName}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-400 text-sm">
                        ₹{u.amount}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-400">
                        ₹{u.balanceAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Platform Plans Tab (Information Only) */}
      {activeTab === 'platform_plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p._id} className="bg-slate-950 border border-slate-850 rounded-2xl p-6 relative flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif font-black text-white text-base">{p.name}</h3>
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Platform Plan
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{p.description || 'Valid at any restaurant on the platform'}</p>

                  <div className="bg-slate-900 p-3.5 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price:</span>
                      <strong className="text-amber-400 font-black">₹{p.price}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prepaid Value:</span>
                      <strong className="text-emerald-400 font-black">₹{p.prepaidBalance !== undefined ? p.prepaidBalance : p.price}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <strong className="text-white">{p.durationDays} Days</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900 mt-4 text-[10px] text-slate-500 italic text-center">
                  Managed centrally by Super Admin
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
