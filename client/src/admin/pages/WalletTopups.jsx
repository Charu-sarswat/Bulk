import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, XCircle, Clock, AlertCircle, Search, Filter, IndianRupee, RefreshCw, Check, X, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SkeletonLoader from '../components/SkeletonLoader';

export default function WalletTopups() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Confirmation modal / action state
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null); // request object for modal
  const [rejectionReason, setRejectionReason] = useState('Payment not received in bank/UPI account.');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/admin/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        addToast('Failed to fetch top-up requests.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while loading requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [apiUrl, token]);

  const handleConfirm = async (reqId, amount, customerName) => {
    if (!window.confirm(`Are you sure you verified ₹${amount} received from ${customerName} in your bank/UPI? This will credit the customer's wallet.`)) {
      return;
    }

    setActionLoadingId(reqId);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/admin/${reqId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`✅ ${data.message}`, 'success');
        fetchRequests();
      } else {
        addToast(data.message || 'Confirmation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error during confirmation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    if (!rejectionReason.trim()) {
      addToast('Please provide a rejection reason.', 'warning');
      return;
    }

    setActionLoadingId(rejectingRequest.id);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/admin/${rejectingRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Payment request rejected. Wallet was not credited.', 'info');
        setRejectingRequest(null);
        setRejectionReason('Payment not received in bank/UPI account.');
        fetchRequests();
      } else {
        addToast(data.message || 'Rejection failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error during rejection.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  
  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending' && r.status !== 'PENDING') return false;
    if (activeTab === 'all' && statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.customerName?.toLowerCase().includes(q);
      const matchPhone = r.customerPhone?.toLowerCase().includes(q);
      const matchUtr = r.utrNumber?.toLowerCase().includes(q);
      return matchName || matchPhone || matchUtr;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Wallet Top-Up Verifications"
        description="Verify manual UPI QR payments submitted by students and credit their global ordering wallet."
        icon={IndianRupee}
      />

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#691F1A] text-[#F8A324] shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Verifications</span>
            {pendingRequests.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1 animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#691F1A] text-[#F8A324] shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>All Requests ({requests.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === 'all' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#691F1A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Only</option>
              <option value="CONFIRMED">Confirmed Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, phone, UTR..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white"
            />
          </div>

          <button
            onClick={fetchRequests}
            title="Refresh list"
            className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <SkeletonLoader type="table" />
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <div className="w-14 h-14 bg-amber-50 text-[#F8A324] rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">
            {activeTab === 'pending' ? 'No pending top-up requests' : 'No top-up requests found'}
          </h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'Great job! All submitted UPI payments have been verified and processed.'
              : 'Student top-up submissions will appear here once submitted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-3xl p-6 border shadow-xs transition-all flex flex-col md:flex-row justify-between gap-5 items-start md:items-center ${
                req.status === 'PENDING'
                  ? 'border-amber-200/80 bg-amber-50/10'
                  : req.status === 'CONFIRMED'
                  ? 'border-emerald-100'
                  : 'border-rose-100 bg-rose-50/10'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-serif font-black text-gray-900">{req.customerName}</span>
                  <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {req.customerPhone}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                      req.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : req.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Payment info badges */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 font-medium pt-1">
                  <div className="bg-[#FFF9EE] border border-[#F8A324]/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-black">UTR / Ref:</span>
                    <span className="font-mono font-bold text-gray-800">{req.utrNumber}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-black">Paid On:</span>
                    <span className="font-bold text-gray-700">
                      {new Date(req.paymentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Submitted: {new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {req.customerNote && (
                  <p className="text-[11px] text-gray-500 bg-gray-50/80 p-2.5 rounded-xl border border-gray-150 font-medium">
                    <span className="font-bold text-gray-600">Student Note:</span> {req.customerNote}
                  </p>
                )}

                {req.status === 'REJECTED' && req.rejectionReason && (
                  <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-semibold">
                    <span className="font-bold">Rejection Reason:</span> {req.rejectionReason}
                  </p>
                )}

                {req.status === 'CONFIRMED' && (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Verified by {req.verifiedBy || 'Admin'} on {new Date(req.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Right Action / Amount */}
              <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Top-Up Amount</span>
                  <span className="text-2xl font-black text-[#691F1A] block">₹{req.amount}</span>
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRejectingRequest(req)}
                      disabled={actionLoadingId === req.id}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl uppercase tracking-wider border border-rose-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleConfirm(req.id, req.amount, req.customerName)}
                      disabled={actionLoadingId === req.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{actionLoadingId === req.id ? 'Processing...' : 'Confirm'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-150 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-base text-gray-900">Reject Top-Up Request</h3>
                <p className="text-xs text-gray-400 font-medium">₹{rejectingRequest.amount} from {rejectingRequest.customerName}</p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Payment not found in bank account for UTR..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white"
                />
                <span className="text-[10px] text-gray-400 block font-medium">
                  This note will be shown to the student so they know why their payment was not credited.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectingRequest.id}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  {actionLoadingId === rejectingRequest.id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
