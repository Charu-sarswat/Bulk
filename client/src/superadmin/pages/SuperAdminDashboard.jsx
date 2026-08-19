import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Store, ShoppingBag, Landmark, BadgePercent, AlertTriangle, 
  TrendingUp, Layers, CheckCircle2, AlertOctagon 
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/superadmin/analytics`);
      const payload = await res.json();
      if (res.ok) {
        setData(payload);
      } else {
        addToast(payload.message || 'Error fetching analytics', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error fetching analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Loading Analytics Summary...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, restaurants } = data;

  const statCards = [
    {
      title: 'Total Restaurants',
      value: summary.totalRestaurants,
      icon: Store,
      color: 'border-gray-200 bg-white text-gray-900',
      iconColor: 'text-[#83560E]',
      sub: `${summary.activeRestaurants} active, ${summary.suspendedRestaurants} suspended`
    },
    {
      title: 'Active Subscriptions',
      value: summary.activeSubscriptions,
      icon: Layers,
      color: 'border-gray-200 bg-white text-emerald-700',
      iconColor: 'text-emerald-600',
      sub: `${summary.expiredSubscriptions} expired plans`
    },
    {
      title: 'Total Orders',
      value: summary.totalOrders,
      icon: ShoppingBag,
      color: 'border-gray-200 bg-white text-blue-700',
      iconColor: 'text-blue-600',
      sub: `All time orders across stores`
    },
    {
      title: 'Total GMV',
      value: `₹${summary.totalGMV.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'border-gray-200 bg-white text-purple-700',
      iconColor: 'text-purple-600',
      sub: 'Cumulative food sales revenue'
    },
    {
      title: 'Subscription Revenue',
      value: `₹${summary.subscriptionRevenue.toLocaleString('en-IN')}`,
      icon: Landmark,
      color: 'border-gray-200 bg-white text-[#83560E]',
      iconColor: 'text-[#83560E]',
      sub: 'Earnings from platform signups'
    },
    {
      title: 'Commission Earned',
      value: `₹${summary.platformCommissionRevenue.toLocaleString('en-IN')}`,
      icon: BadgePercent,
      color: 'border-gray-200 bg-white text-indigo-700',
      iconColor: 'text-indigo-600',
      sub: 'Earnings from food sales splits'
    }
  ];

  return (
    <div className="space-y-8 font-sans text-gray-900">
      <div>
        <h2 className="text-2xl font-serif font-black text-gray-900">System Dashboard</h2>
        <p className="text-gray-500 text-xs mt-1">Real-time overall monitoring of platform metrics and multi-tenant performance.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`p-6 border rounded-3xl ${card.color} flex flex-col justify-between h-36 shadow-xs`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{card.title}</span>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-serif font-black">{card.value}</span>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase mt-1 tracking-wider">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restaurant Performance Table */}
      <div className="border border-gray-200 bg-white rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
          <h3 className="text-sm font-serif font-black text-gray-900 uppercase tracking-wider">Tenant Stores Performance</h3>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase border border-gray-200">
            {restaurants.length} Registered Tenants
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Subscription Plan</th>
                <th className="px-6 py-4 text-center">Total Orders</th>
                <th className="px-6 py-4 text-right">GMV (Sales)</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {restaurants.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 text-gray-800">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {r.name}
                    <span className="block text-[10px] font-normal text-gray-400 mt-0.5">/{r.slug}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{r.ownerName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 border border-[#CCA96A]/30 text-[#83560E] px-2.5 py-1 rounded-full font-bold uppercase">
                      {r.planName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-blue-700">{r.totalOrders}</td>
                  <td className="px-6 py-4 text-right font-black text-purple-700">₹{r.gmv.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      r.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : r.status === 'suspended'
                        ? 'bg-rose-50 text-rose-700 border border-rose-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
