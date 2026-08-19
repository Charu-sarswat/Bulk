import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Wallet, Check, X, ShieldCheck, Clock, Search, Sparkles, 
  User, AlertCircle, Copy, CheckCircle2, RefreshCw, IndianRupee 
} from 'lucide-react';

export default function SuperAdminWalletTopups() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'confirmed'
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Rejection modal states
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedUtr, setCopiedUtr] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/superadmin/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRequests(data);
    } catch (err) {
      addToast('Error loading wallet top-up requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleConfirm = async (id, amount, customerName) => {
    if (!window.confirm(`Confirm ₹${amount} wallet top-up for ${customerName}? Customer wallet balance will be credited immediately.`)) return;

    setProcessingId(id);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/superadmin/${id}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`🎉 ₹${amount} credited to ${customerName}'s wallet!`, 'success');
        fetchRequests();
      } else {
        addToast(data.message || 'Confirmation failed', 'error');
      }
    } catch (err) {
      addToast('Network error while confirming top-up', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      addToast('Please enter a rejection reason', 'warning');
      return;
    }

    setProcessingId(rejectModalId);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/superadmin/${rejectModalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Top-up request rejected.', 'info');
        setRejectModalId(null);
        setRejectionReason('');
        fetchRequests();
      } else {
        addToast(data.message || 'Rejection failed', 'error');
      }
    } catch (err) {
      addToast('Network error while rejecting request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    addToast('UTR copied to clipboard!', 'info');
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  // Filter & Search Logic
  const filtered = requests.filter(r => {
    if (activeTab === 'pending' && r.status !== 'PENDING') return false;
    if (activeTab === 'confirmed' && r.status !== 'CONFIRMED') return false;
    if (activeTab === 'rejected' && r.status !== 'REJECTED') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchCustomer = r.customerName?.toLowerCase().includes(term);
      const matchPhone = r.customerPhone?.includes(term);
      const matchUtr = r.utrNumber?.toLowerCase().includes(term);
      return matchCustomer || matchPhone || matchUtr;
    }
    return true;
  });

  const totalTopupVolume = requests
    .filter(r => r.status === 'CONFIRMED')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const confirmedCount = requests.filter(r => r.status === 'CONFIRMED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-wide flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#83560E]" />
            <span>Customer Wallet Top-Up Approvals</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Super Admin verification hub for manual UPI wallet top-ups across all students and customers.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-gray-200 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Total Confirmed Top-Up Volume</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">₹{totalTopupVolume.toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{confirmedCount} confirmed deposits</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Pending Verification</p>
          <h3 className="text-2xl font-black text-[#83560E] mt-1">{pendingCount}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Awaiting Super Admin UTR verification</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Total Requests Logged</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{requests.length}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">All customer top-up transactions</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#83560E] text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-[#83560E] text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'confirmed'
                ? 'bg-[#83560E] text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, phone, UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-xs font-bold">Loading top-up records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No Top-Up Requests Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm ? 'No results matched your search query.' : 'There are no wallet top-up requests under this filter tab.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className={`bg-white border rounded-3xl p-5 space-y-4 transition-all shadow-xs ${
                req.status === 'PENDING'
                  ? 'border-amber-400 shadow-md shadow-amber-500/10 bg-amber-50/20'
                  : req.status === 'CONFIRMED'
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-rose-200 bg-rose-50/30'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#83560E] font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{req.customerName}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{req.customerPhone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-emerald-700 block">₹{req.amount}</span>
                  <span
                    className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border mt-1 ${
                      req.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                        : req.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>

              {/* UTR & Payment Proof Details */}
              <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase text-[10px]">12-Digit UTR:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-[#83560E] select-all">{req.utrNumber}</span>
                    <button
                      onClick={() => handleCopy(req.utrNumber)}
                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                      title="Copy UTR"
                    >
                      {copiedUtr === req.utrNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-gray-500 text-[11px]">
                  <span>Paid On:</span>
                  <span className="text-gray-800 font-medium">{new Date(req.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>

                {req.customerNote && (
                  <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-700">
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Customer Note:</span>
                    "{req.customerNote}"
                  </div>
                )}

                {req.rejectionReason && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700">
                    <strong className="text-rose-800 block">Rejection Note:</strong>
                    {req.rejectionReason}
                  </div>
                )}
              </div>

              {/* Action Buttons for Super Admin */}
              {req.status === 'PENDING' ? (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setRejectModalId(req.id);
                      setRejectionReason('');
                    }}
                    disabled={processingId === req.id}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleConfirm(req.id, req.amount, req.customerName)}
                    disabled={processingId === req.id}
                    className="flex-2 py-2.5 bg-[#83560E] hover:bg-[#68410d] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#83560E]/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{processingId === req.id ? 'Verifying...' : 'Verify & Credit Wallet'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                  <span>Logged: {new Date(req.createdAt).toLocaleDateString()}</span>
                  {req.verifiedBy && <span>Verified by: <strong className="text-gray-700">{req.verifiedBy}</strong></span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-gray-900">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span>Reject Wallet Top-Up</span>
              </h3>
              <button
                onClick={() => setRejectModalId(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Invalid UTR, transaction not credited to Super Admin account, amount mismatch..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-rose-500 resize-none font-medium"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectModalId}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {processingId === rejectModalId ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
