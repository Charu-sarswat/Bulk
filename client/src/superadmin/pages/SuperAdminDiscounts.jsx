import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Percent, Plus, Search, Edit3, Trash2, Check, X, Shield, 
  Store, Utensils, Zap, Users, AlertCircle, RefreshCw, Layers, Sparkles, Filter 
} from 'lucide-react';

export default function SuperAdminDiscounts() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [rules, setRules] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestFilter, setSelectedRestFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form Fields
  const [modalRestFilter, setModalRestFilter] = useState('ALL');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [bulkMinQty, setBulkMinQty] = useState(10);
  const [bulkDiscountPct, setBulkDiscountPct] = useState(10);
  const [subDiscountPct, setSubDiscountPct] = useState(15);
  const [isActive, setIsActive] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Discount Rules
      const rulesRes = await fetch(`${apiUrl}/api/discounts/superadmin/discounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData);
      }

      // 2. Fetch Restaurants
      const restRes = await fetch(`${apiUrl}/api/superadmin/restaurants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (restRes.ok) {
        const restData = await restRes.json();
        setRestaurants(restData);
      }

      // 3. Fetch all Menu Items platform-wide
      const menuRes = await fetch(`${apiUrl}/api/discounts/superadmin/menu-items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setAllMenuItems(menuData);
      }
    } catch (err) {
      addToast('Error loading discount rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setModalRestFilter('ALL');
    setSelectedMenuItemId(allMenuItems[0]?._id || '');
    setBulkMinQty(10);
    setBulkDiscountPct(10);
    setSubDiscountPct(15);
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    const itemId = rule.menuItemId?._id || rule.menuItemId;
    setSelectedMenuItemId(itemId);
    const restId = rule.restaurantId?._id || rule.restaurantId;
    setModalRestFilter(restId || 'ALL');
    setBulkMinQty(rule.bulkMinQuantity || 0);
    setBulkDiscountPct(rule.bulkDiscountPercentage || 0);
    setSubDiscountPct(rule.subscriptionDiscountPercentage || 0);
    setIsActive(rule.isActive);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMenuItemId) {
      addToast('Please select a menu item.', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        menuItemId: selectedMenuItemId,
        bulkMinQuantity: Number(bulkMinQty) || 0,
        bulkDiscountPercentage: Number(bulkDiscountPct) || 0,
        subscriptionDiscountPercentage: Number(subDiscountPct) || 0,
        isActive
      };

      const url = editingRule 
        ? `${apiUrl}/api/discounts/superadmin/discounts/${editingRule._id}` 
        : `${apiUrl}/api/discounts/superadmin/discounts`;

      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Menu item discount rule saved successfully!', 'success');
        setShowModal(false);
        fetchData();
      } else {
        addToast(data.message || 'Failed to save discount rule', 'error');
      }
    } catch (err) {
      addToast('Network error while saving discount rule', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggle = async (ruleId) => {
    try {
      const res = await fetch(`${apiUrl}/api/discounts/superadmin/discounts/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, 'info');
        setRules(rules.map(r => r._id === ruleId ? { ...r, isActive: data.isActive } : r));
      }
    } catch (err) {
      addToast('Error toggling rule status', 'error');
    }
  };

  const handleDelete = async (ruleId, itemName) => {
    if (!window.confirm(`Delete discount rule for "${itemName}"?`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/discounts/superadmin/discounts/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Discount rule deleted.', 'info');
        setRules(rules.filter(r => r._id !== ruleId));
      }
    } catch (err) {
      addToast('Error deleting discount rule', 'error');
    }
  };

  // Filter menu items for modal dropdown
  const modalFilteredMenuItems = allMenuItems.filter(item => {
    if (modalRestFilter === 'ALL') return true;
    const itemRestId = item.restaurantId?._id || item.restaurantId;
    return itemRestId?.toString() === modalRestFilter?.toString();
  });

  // Filtering rules for main view
  const filteredRules = rules.filter(r => {
    if (selectedRestFilter !== 'ALL') {
      const rId = r.restaurantId?._id || r.restaurantId;
      if (rId !== selectedRestFilter) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchItem = r.menuItemId?.name?.toLowerCase().includes(term);
      const matchRest = r.restaurantId?.name?.toLowerCase().includes(term);
      return matchItem || matchRest;
    }
    return true;
  });

  const activeRulesCount = rules.filter(r => r.isActive).length;
  const bulkRulesCount = rules.filter(r => r.bulkDiscountPercentage > 0).length;
  const subRulesCount = rules.filter(r => r.subscriptionDiscountPercentage > 0).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-wide flex items-center gap-3">
            <Percent className="w-8 h-8 text-[#83560E]" />
            <span>Menu-Item Discount Rules</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Super Admin configuration for Item-Level Bulk Discounts & Subscription Pass Discounts. (Non-stacking: higher discount applies).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white hover:bg-gray-50 text-gray-600 hover:text-[#83560E] rounded-xl transition-all border border-gray-200 cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#83560E] hover:bg-[#68410d] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-[#83560E]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Item Discount</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Active Item Rules</p>
            <Zap className="w-4 h-4 text-[#83560E]" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{activeRulesCount}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{rules.length} configured menu-item rules</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Bulk Discount Rules</p>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{bulkRulesCount}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Quantity-triggered item discounts</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Pass Discounts</p>
            <Sparkles className="w-4 h-4 text-[#83560E]" />
          </div>
          <h3 className="text-2xl font-black text-[#83560E] mt-1">{subRulesCount}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Discounts for active platform pass holders</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#83560E]" />
            <span>Filter by Outlet:</span>
          </span>
          <select
            value={selectedRestFilter}
            onChange={(e) => setSelectedRestFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#83560E] font-bold cursor-pointer"
          >
            <option value="ALL">All Outlets ({restaurants.length})</option>
            {restaurants.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by menu item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#83560E]"
          />
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-xs font-bold">Loading discount rules...</p>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <Percent className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No Menu Item Discount Rules Configured</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click "Create Item Discount" to set up bulk or subscription discounts directly on specific menu items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule) => {
            const item = rule.menuItemId;
            const rest = rule.restaurantId;

            return (
              <div
                key={rule._id}
                className={`bg-white border rounded-3xl p-5 space-y-4 transition-all shadow-xs ${
                  rule.isActive
                    ? 'border-gray-200 hover:border-[#83560E]/50'
                    : 'border-gray-100 opacity-60 bg-gray-50/50'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    {rest?.name && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#83560E] bg-amber-50 px-2 py-0.5 rounded border border-[#CCA96A]/30">
                        {rest.name}
                      </span>
                    )}
                    <h4 className="font-bold text-gray-900 text-base mt-1.5">{item?.name || 'Unknown Item'}</h4>
                    <p className="text-xs text-gray-500 font-mono">Base Price: ₹{item?.price || '0'}</p>
                  </div>

                  <span
                    onClick={() => handleToggle(rule._id)}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border cursor-pointer transition-all ${
                      rule.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                {/* Rule Badges */}
                <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-gray-200/80 space-y-2.5 text-xs">
                  {/* Bulk Discount */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-[11px] font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bulk ({rule.bulkMinQuantity}+ items):</span>
                    </span>
                    <span className="font-black text-emerald-700">
                      {rule.bulkDiscountPercentage > 0 ? `${rule.bulkDiscountPercentage}% OFF` : 'None'}
                    </span>
                  </div>

                  {/* Subscription Discount */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-[11px] font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#83560E]" />
                      <span>Pass Holder Discount:</span>
                    </span>
                    <span className="font-black text-[#83560E]">
                      {rule.subscriptionDiscountPercentage > 0 ? `${rule.subscriptionDiscountPercentage}% OFF` : 'None'}
                    </span>
                  </div>

                  {/* Non-stacking badge */}
                  <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-[#83560E] shrink-0" />
                    <span>Non-stacking: higher discount automatically applies.</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEditModal(rule)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 transition-all cursor-pointer"
                    title="Edit Rule"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#83560E]" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule._id, item?.name || 'this item')}
                    className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl text-xs font-bold border border-gray-200 hover:border-rose-200 transition-all cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-gray-900">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#83560E]" />
                <span>{editingRule ? 'Edit Menu Item Discount' : 'Create Menu Item Discount'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Optional Restaurant Filter */}
              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1.5">
                  <Filter className="w-3 h-3 text-[#83560E]" />
                  <span>Filter Menu Items by Outlet (Optional Filter)</span>
                </label>
                <select
                  value={modalRestFilter}
                  onChange={(e) => {
                    const newFilter = e.target.value;
                    setModalRestFilter(newFilter);
                    const matching = allMenuItems.filter(item => {
                      if (newFilter === 'ALL') return true;
                      const itemRestId = item.restaurantId?._id || item.restaurantId;
                      return itemRestId?.toString() === newFilter?.toString();
                    });
                    if (matching.length > 0) {
                      setSelectedMenuItemId(matching[0]._id);
                    }
                  }}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#83560E] font-bold"
                >
                  <option value="ALL">All Outlets ({restaurants.length})</option>
                  {restaurants.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Discounts are attached to Menu Items (menuItemId). Restaurant is only used to filter the list below.
                </span>
              </div>

              {/* Menu Item Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Select Menu Item <span className="text-[#83560E]">*</span>
                </label>
                {modalFilteredMenuItems.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 text-center">
                    No menu items found for this outlet filter.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedMenuItemId}
                    onChange={(e) => setSelectedMenuItemId(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#83560E] font-bold"
                  >
                    {modalFilteredMenuItems.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.name} — ₹{item.price} {item.restaurantId?.name ? `(${item.restaurantId.name})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bulk Discount Settings */}
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <Layers className="w-4 h-4" />
                  <span>Bulk Order Discount (Per-Item Quantity)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      Min Quantity (e.g. 10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bulkMinQty}
                      onChange={(e) => setBulkMinQty(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#83560E] font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      Discount % (e.g. 10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bulkDiscountPct}
                      onChange={(e) => setBulkDiscountPct(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#83560E] font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Pass Discount Settings */}
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#83560E]">
                  <Sparkles className="w-4 h-4" />
                  <span>Platform Subscription Pass Discount</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">
                    Pass Holder Discount % (e.g. 15)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={subDiscountPct}
                    onChange={(e) => setSubDiscountPct(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#83560E] font-bold"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#FAF9F6] rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Rule Active Status</span>
                  <span className="text-[10px] text-gray-500">Enable or disable this rule immediately across the store.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 accent-[#83560E] rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-3 bg-[#83560E] hover:bg-[#68410d] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#83560E]/20"
                >
                  {formSubmitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
