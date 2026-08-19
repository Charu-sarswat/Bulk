import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Coins, QrCode, Building2, TrendingUp, Wallet, ArrowDownRight, Edit3, Save, CheckCircle2, History } from 'lucide-react';

export default function SuperAdminTransactions() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [reports, setReports] = useState(null);
  const [upiSettings, setUpiSettings] = useState({ upiId: '', upiName: '', qrCodeImage: '' });
  const [editingUpi, setEditingUpi] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const [reportsRes, upiRes] = await Promise.all([
        fetch(`${apiUrl}/api/superadmin/subscription-reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/platform-upi`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (reportsRes.ok) {
        const repData = await reportsRes.json();
        setReports(repData);
      }

      if (upiRes.ok) {
        const uData = await upiRes.json();
        setUpiSettings(uData);
      }
    } catch (err) {
      addToast('Error loading subscription reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleSaveUpi = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/superadmin/platform-upi`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(upiSettings)
      });
      if (res.ok) {
        addToast('Super Admin Platform UPI settings updated!', 'success');
        setEditingUpi(false);
      } else {
        addToast('Failed to save UPI settings', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Loading Platform Ledger & Reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-gray-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-black text-gray-900 flex items-center gap-2.5">
          <Coins className="w-6 h-6 text-[#83560E]" />
          Subscription Revenue & Restaurant Settlements
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Audit platform subscription cash flow, Super Admin UPI configuration, and restaurant-wise consumption settlements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-500">Total Subscription Sales</span>
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-3">
            ₹{reports?.totalSales?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Collected directly by Super Admin</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-500">Consumed at Restaurants</span>
            <div className="p-2.5 bg-amber-50 rounded-2xl text-[#83560E]">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#83560E] mt-3">
            ₹{reports?.totalConsumed?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Total food value claimed by restaurants</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-500">Outstanding Balance</span>
            <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-3">
            ₹{reports?.outstandingBalance?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Remaining prepaid balance with students</p>
        </div>
      </div>

      {/* Super Admin Platform UPI Setup */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-[#83560E]" />
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Super Admin Platform UPI Payment Info</h2>
              <p className="text-[11px] text-gray-500">Students make subscription payments directly to this UPI QR / ID.</p>
            </div>
          </div>

          <button
            onClick={() => setEditingUpi(!editingUpi)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-gray-200 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#83560E]" />
            <span>{editingUpi ? 'Cancel' : 'Edit UPI Details'}</span>
          </button>
        </div>

        {editingUpi ? (
          <form onSubmit={handleSaveUpi} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Super Admin UPI ID</label>
              <input
                type="text"
                placeholder="superadmin@okaxis"
                value={upiSettings.upiId}
                onChange={(e) => setUpiSettings({ ...upiSettings, upiId: e.target.value })}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#83560E]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Payee Name</label>
              <input
                type="text"
                placeholder="Bombay Chowpati Platform"
                value={upiSettings.upiName}
                onChange={(e) => setUpiSettings({ ...upiSettings, upiName: e.target.value })}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#83560E]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">QR Code Image URL</label>
              <input
                type="text"
                placeholder="https://.../qr.png"
                value={upiSettings.qrCodeImage}
                onChange={(e) => setUpiSettings({ ...upiSettings, qrCodeImage: e.target.value })}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#83560E]"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#83560E] hover:bg-[#68410d] text-white font-black text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#83560E]/20"
              >
                <Save className="w-4 h-4" />
                <span>Save UPI Settings</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 text-xs">
            <div className="space-y-1">
              <div className="text-gray-500">Platform UPI ID: <strong className="text-gray-900 font-mono">{upiSettings.upiId || 'Not Configured'}</strong></div>
              <div className="text-gray-500">Payee Display Name: <strong className="text-gray-900">{upiSettings.upiName || 'Bombay Chowpati Central'}</strong></div>
            </div>
            {upiSettings.qrCodeImage && (
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                <img src={upiSettings.qrCodeImage} alt="Super Admin QR" className="w-12 h-12 object-contain rounded-lg" />
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> QR Active
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restaurant Consumption Settlement Table */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#83560E]" />
          Restaurant-Wise Subscription Consumption (Payable to Restaurants)
        </h2>

        <div className="border border-gray-200 bg-white rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider bg-gray-50/70">
                <th className="px-6 py-4">Restaurant / Mess Name</th>
                <th className="px-6 py-4 text-center">Subscription Orders Served</th>
                <th className="px-6 py-4 text-right">Total Food Value Consumed</th>
                <th className="px-6 py-4 text-right">Super Admin Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports?.restaurantConsumption && reports.restaurantConsumption.length > 0 ? (
                reports.restaurantConsumption.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#83560E]" />
                      <span>{r.restaurantName}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 font-bold">
                      {r.usageCount} orders
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-700 text-sm">
                      ₹{r.totalConsumed?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        Recorded for Payout
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-xs">
                    No subscription orders have been consumed at any restaurant yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Activity Logs */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-[#83560E]" />
          Recent Subscription Usages Across All Restaurants
        </h2>

        <div className="border border-gray-200 bg-white rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider bg-gray-50/70">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Restaurant Consumed At</th>
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4 text-right">Amount Deducted</th>
                <th className="px-6 py-4 text-right">Remaining Student Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports?.recentUsages && reports.recentUsages.length > 0 ? (
                reports.recentUsages.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(u.usedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {u.studentName}
                      <span className="block text-[10px] text-gray-500 font-mono">{u.studentPhone}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#83560E]">
                      {u.restaurantName}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">
                      #{u.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-rose-600">
                      -₹{u.amount}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-700">
                      ₹{u.balanceAfter}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400 text-xs">
                    No recent usage logs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
