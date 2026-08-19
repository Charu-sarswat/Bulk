import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Layers, Plus, Edit3, Trash2, CheckCircle2, X, Sparkles, ShieldCheck } from 'lucide-react';

export default function SuperAdminPlans() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal/Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 5000,
    durationDays: 30,
    prepaidBalance: 5000,
    isActive: true
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/superadmin/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPlans(data);
    } catch (err) {
      addToast('Error loading platform plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPlans();
  }, [token]);

  const handleEditClick = (plan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      durationDays: plan.durationDays || 30,
      prepaidBalance: plan.prepaidBalance !== undefined ? plan.prepaidBalance : plan.price,
      isActive: plan.isActive !== undefined ? plan.isActive : true
    });
    setShowModal(true);
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: 'Valid across ALL restaurants and messes on Bombay Chowpati platform',
      price: 5000,
      durationDays: 30,
      prepaidBalance: 5000,
      isActive: true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined) {
      addToast('Name and Price are required.', 'warning');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description,
      price: Number(formData.price),
      durationDays: Number(formData.durationDays || 30),
      prepaidBalance: Number(formData.prepaidBalance !== undefined ? formData.prepaidBalance : formData.price),
      isActive: Boolean(formData.isActive)
    };

    try {
      const url = editingId ? `${apiUrl}/api/superadmin/plans/${editingId}` : `${apiUrl}/api/superadmin/plans`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast(editingId ? 'Platform Plan updated successfully' : 'Platform Plan created successfully', 'success');
        setShowModal(false);
        fetchPlans();
      } else {
        const err = await res.json();
        addToast(err.message || 'Operation failed', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/superadmin/plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Plan deleted successfully', 'success');
        fetchPlans();
      } else {
        addToast('Could not delete plan', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-gray-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-gray-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#83560E]" />
            Platform Subscription Plans
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Create and manage platform-wide food subscription plans available to students across all restaurants.
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 bg-[#83560E] hover:bg-[#68410d] text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md shadow-[#83560E]/20 transition-all cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Create Platform Plan
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-[#CCA96A]/30 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs">
        <ShieldCheck className="w-5 h-5 text-[#83560E] shrink-0" />
        <span>
          <strong>Super Admin Rule:</strong> Subscriptions created here are <strong>PLATFORM-WIDE</strong>. Students who purchase these plans can spend their prepaid balance at <strong>ANY</strong> restaurant on the Bombay Chowpati platform.
        </span>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading Plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center space-y-4 shadow-xs">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No Subscription Plans Created</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Click the button above to create your first platform subscription plan (e.g. ₹5000 for 30 days).
          </p>
          <button
            onClick={handleCreateClick}
            className="px-6 py-2.5 bg-[#83560E] hover:bg-[#68410d] text-white font-black text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Create Plan Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white border border-gray-200 rounded-3xl p-6 relative flex flex-col justify-between hover:border-[#83560E]/40 transition-all shadow-xs"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-serif font-black text-lg text-gray-900">{plan.name}</h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      plan.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed min-h-[40px]">
                  {plan.description || 'Valid at any restaurant on the platform'}
                </p>

                {/* Price & Balance Box */}
                <div className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Purchase Price</span>
                    <span className="text-2xl font-black text-[#83560E]">₹{plan.price}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 text-xs">
                    <span className="text-gray-500">Prepaid Food Value:</span>
                    <span className="font-black text-emerald-700">₹{plan.prepaidBalance !== undefined ? plan.prepaidBalance : plan.price}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-gray-500">Validity:</span>
                    <span className="font-bold text-gray-800">{plan.durationDays} Days</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Works across ALL platform restaurants</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6 flex gap-2">
                <button
                  onClick={() => handleEditClick(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-gray-200"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#83560E]" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(plan._id, plan.name)}
                  className="p-2.5 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer border border-gray-200 hover:border-rose-200"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-gray-900">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <h3 className="font-serif font-black text-lg text-gray-900">
                  {editingId ? 'Edit Platform Plan' : 'Create Platform Plan'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Universal plan for all restaurants & outlets
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Monthly Student Pass"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="e.g. ₹5000 prepaid food balance valid across all restaurants on the platform"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="5000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value, prepaidBalance: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#83560E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Prepaid Food Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="5000"
                    value={formData.prepaidBalance}
                    onChange={(e) => setFormData({ ...formData, prepaidBalance: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#83560E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Validity (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="30"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#83560E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Plan Status
                  </label>
                  <select
                    value={formData.isActive ? 'active' : 'disabled'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#83560E]"
                  >
                    <option value="active">Active & Available to Students</option>
                    <option value="disabled">Disabled (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#83560E] hover:bg-[#68410d] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#83560E]/20"
                >
                  {editingId ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
