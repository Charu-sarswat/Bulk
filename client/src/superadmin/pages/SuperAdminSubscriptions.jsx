import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CalendarDays, Check, X, ShieldCheck, Clock, Search, Sparkles, User, AlertCircle } from 'lucide-react';

export default function SuperAdminSubscriptions() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'active'
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/superadmin/customer-subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSubscriptions(data);
    } catch (err) {
      addToast('Error loading customer subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSubscriptions();
  }, [token]);

  const handleVerify = async (id) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${apiUrl}/api/superadmin/customer-subscriptions/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Student subscription verified and activated successfully!', 'success');
        fetchSubscriptions();
      } else {
        addToast(data.message || 'Verification failed', 'error');
      }
    } catch (err) {
      addToast('Connection error', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this subscription payment request?')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`${apiUrl}/api/superadmin/customer-subscriptions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        addToast('Subscription request rejected.', 'info');
        fetchSubscriptions();
      } else {
        addToast('Action failed', 'error');
      }
    } catch (err) {
      addToast('Connection error', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'pending' ? sub.status === 'PENDING' :
      activeTab === 'active' ? sub.status === 'ACTIVE' : true;

    const matchesSearch = 
      sub.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.studentPhone?.includes(searchTerm) ||
      sub.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const pendingCount = subscriptions.filter(s => s.status === 'PENDING').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-gray-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-gray-900 flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-[#83560E]" />
            Student Subscriptions & Payment Verification
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Verify student manual UPI payments, activate platform subscriptions, and audit remaining balances.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 text-[#83560E]" />
            <span>{pendingCount} Pending Payment Request{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#83560E] text-white font-black shadow-xs'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            All Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'pending'
                ? 'bg-[#83560E] text-white font-black shadow-xs'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            Pending Verification ({pendingCount})
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#83560E] text-white font-black shadow-xs'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            Active Subscribers ({subscriptions.filter(s => s.status === 'ACTIVE').length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, phone, or UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#83560E] w-full sm:w-64"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading Customer Subscriptions...</p>
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center space-y-3 shadow-xs">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No subscriptions found</h3>
          <p className="text-xs text-gray-500">No student subscription records match your current filter.</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider bg-gray-50/70">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Platform Plan</th>
                  <th className="px-6 py-4">Initial Value</th>
                  <th className="px-6 py-4">Spent on Food</th>
                  <th className="px-6 py-4">Remaining Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment Ref / UTR</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#83560E]" />
                        <span>{sub.studentName}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{sub.studentPhone}</div>
                    </td>

                    <td className="px-6 py-4 font-bold text-[#83560E]">
                      {sub.planName}
                    </td>

                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{sub.initialBalance}
                    </td>

                    <td className="px-6 py-4 font-bold text-rose-600">
                      ₹{sub.usedAmount}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        ₹{sub.remainingBalance}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : sub.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-gray-600">
                      {sub.paymentReference || 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-gray-500 text-[11px]">
                      {sub.startDate && sub.endDate ? (
                        <span>
                          {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Pending confirmation</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {sub.status === 'PENDING' ? (
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleVerify(sub.id)}
                            disabled={processingId === sub.id}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold cursor-pointer shadow-xs"
                            title="Verify & Activate Subscription"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(sub.id)}
                            disabled={processingId === sub.id}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all font-bold cursor-pointer"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          {sub.status === 'ACTIVE' ? 'Verified' : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
