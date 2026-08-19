import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Store, User, Shield, Phone, Mail, MapPin, 
  Plus, Check, X, ShieldAlert, Key, Calendar 
} from 'lucide-react';

export default function SuperAdminRestaurants() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    logo: '',
    planId: '',
    billingCycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    durationMonths: '1',
    adminUsername: '',
    adminPassword: ''
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const restRes = await fetch(`${apiUrl}/api/superadmin/restaurants`);
      const restData = await restRes.json();
      if (restRes.ok) setRestaurants(restData);

      const planRes = await fetch(`${apiUrl}/api/superadmin/plans`);
      const planData = await planRes.json();
      if (planRes.ok) {
        setPlans(planData);
        if (planData.length > 0) {
          setFormData(prev => ({ ...prev, planId: planData[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching restaurant details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.adminUsername || !formData.adminPassword) {
      addToast('Please fill all mandatory fields.', 'warning');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/superadmin/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Restaurant and Admin created successfully!', 'success');
        setShowCreateModal(false);
        fetchData();
        // Reset
        setFormData({
          name: '',
          slug: '',
          ownerName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          logo: '',
          planId: plans[0]?._id || '',
          billingCycle: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          durationMonths: '1',
          adminUsername: '',
          adminPassword: ''
        });
      } else {
        addToast(data.message || 'Failed to create restaurant', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error creating restaurant', 'error');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change this restaurant status to: ${nextStatus}?`)) return;

    try {
      const res = await fetch(`${apiUrl}/api/superadmin/restaurants/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        addToast(`Restaurant status changed to ${nextStatus}`, 'success');
        fetchData();
      } else {
        addToast('Error changing status', 'error');
      }
    } catch (err) {
      addToast('Connection error changing status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Loading Restaurants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-gray-900">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-black text-gray-900">Restaurants Management</h2>
          <p className="text-gray-500 text-xs mt-1">Create and manage tenant stores, billing credentials, and statuses.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#83560E] hover:bg-[#68410d] text-white px-5 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#83560E]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Create Restaurant
        </button>
      </div>

      {/* Restaurants List Table */}
      <div className="border border-gray-200 bg-white rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider bg-gray-50/70">
                <th className="px-6 py-4">Store details</th>
                <th className="px-6 py-4">Owner details</th>
                <th className="px-6 py-4">Subscription plan</th>
                <th className="px-6 py-4">Plan expiry</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {restaurants.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 text-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {r.logo ? (
                        <img src={r.logo} alt={r.name} className="w-10 h-10 rounded-xl object-cover bg-gray-100 border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#83560E]">
                          <Store className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="font-serif font-black text-gray-900 text-sm block">{r.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5">slug: /{r.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold block text-gray-900">{r.ownerName}</span>
                    <span className="text-gray-500 block text-[10px] mt-0.5">{r.email || r.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 border border-[#CCA96A]/30 text-[#83560E] px-2.5 py-1 rounded-full font-bold uppercase">
                      {r.subscription?.planName || 'No Active Plan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-600">
                    {r.subscription ? new Date(r.subscription.endDate).toLocaleDateString('en-IN') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      r.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border border-rose-300'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(r.id, r.status)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase cursor-pointer border ${
                          r.status === 'active'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {r.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-gray-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <h3 className="font-serif font-black text-lg text-gray-900">Register New Store</h3>
                <p className="text-xs text-gray-500 mt-0.5">Add a new food outlet or mess on the platform</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="space-y-6">
              
              {/* Restaurant Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[#83560E] uppercase tracking-widest border-b border-gray-200 pb-1 flex items-center gap-2">
                  <Store className="w-4.5 h-4.5" /> Store Profile details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Restaurant Name *</label>
                    <input 
                      type="text" required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Bombay Chowpati Hyderabad"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Unique Slug (URL) *</label>
                    <input 
                      type="text" required 
                      value={formData.slug} 
                      onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      placeholder="e.g. bc-abids"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Owner Name</label>
                    <input 
                      type="text"
                      value={formData.ownerName} 
                      onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Logo URL (Optional)</label>
                    <input 
                      type="text"
                      value={formData.logo} 
                      onChange={(e) => setFormData({...formData, logo: e.target.value})}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Contact Email</label>
                    <input 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g. Rajesh@gmail.com"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Phone Number</label>
                    <input 
                      type="text"
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                </div>
                
                {/* Address details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Street Address</label>
                    <input 
                      type="text"
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="MPM Mall, Abids"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">City</label>
                    <input 
                      type="text"
                      value={formData.city} 
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Hyderabad"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Pincode</label>
                    <input 
                      type="text"
                      value={formData.pincode} 
                      onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                      placeholder="500001"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Account details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[#83560E] uppercase tracking-widest border-b border-gray-200 pb-1 flex items-center gap-2">
                  <Key className="w-4.5 h-4.5" /> Restaurant Admin Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Admin Username *</label>
                    <input 
                      type="text" required
                      value={formData.adminUsername} 
                      onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
                      placeholder="e.g. rajesh_admin"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-700 font-extrabold uppercase mb-1.5 block">Admin Password *</label>
                    <input 
                      type="password" required
                      value={formData.adminPassword} 
                      onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-2xl text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#83560E] hover:bg-[#68410d] text-white px-6 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#83560E]/20 cursor-pointer"
                >
                  Register Store
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
