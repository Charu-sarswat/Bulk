import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { restaurantConfig } from '../../config/restaurant';
import { exportToCSV } from '../../utils/csvExporter';
import { 
  Boxes, Search, RefreshCw, History, 
  AlertTriangle, CheckCircle2, XCircle, 
  SlidersHorizontal, ArrowUpRight, ArrowDownRight, Clock, X, Save, Download
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SkeletonLoader from '../components/SkeletonLoader';
import Pagination from '../components/Pagination';

export default function InventoryManagement() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const handleExportSheet = () => {
    const headers = ['Material Name', 'Stock Level', 'Min Threshold', 'Unit', 'Status'];
    const rows = rawMaterials.map(m => [
      m.name,
      m.stock_quantity,
      m.min_stock_level,
      m.unit || 'units',
      m.stock_quantity === 0 ? 'Out of Stock' : m.stock_quantity <= m.min_stock_level ? 'Low Stock' : 'In Stock'
    ]);
    exportToCSV('Bombay_Chowpati_Raw_Materials_Sheet', headers, rows);
  };

  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'raw' | 'logs'
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Menu Items / Finished Goods States
  const [menuItems, setMenuItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [adjustItemModal, setAdjustItemModal] = useState(null);
  const [adjustItemForm, setAdjustItemForm] = useState({
    change_type: 'STOCK_ADD',
    quantity: 10,
    reason: '',
    min_stock_level: 10
  });
  const [itemHistoryModal, setItemHistoryModal] = useState(null);
  const [itemHistoryLogs, setItemHistoryLogs] = useState([]);
  const [itemHistoryLoading, setItemHistoryLoading] = useState(false);

  // Raw Materials States
  const [rawMaterials, setRawMaterials] = useState([]);
  const [rawLoading, setRawLoading] = useState(true);
  const [showAddRawModal, setShowAddRawModal] = useState(false);
  const [addRawForm, setAddRawForm] = useState({
    name: '',
    stock_quantity: 0,
    unit: 'pcs',
    min_stock_level: 10
  });

  const [adjustRawModalItem, setAdjustRawModalItem] = useState(null);
  const [adjustRawForm, setAdjustRawForm] = useState({
    change_type: 'STOCK_ADD',
    quantity: 10,
    reason: '',
    min_stock_level: 10
  });

  const [rawHistoryModal, setRawHistoryModal] = useState(null);
  const [rawHistoryLogs, setRawHistoryLogs] = useState([]);
  const [rawHistoryLoading, setRawHistoryLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');

  // Pagination
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(15);

  React.useEffect(() => { setLogsPage(1); }, [searchQuery, logTypeFilter]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchGlobalLogs = async () => {
    setLogsLoading(true);
    try {
      let url = `${apiUrl}/api/inventory/logs?`;
      if (logTypeFilter !== 'ALL') url += `change_type=${logTypeFilter}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchRawMaterials = async () => {
    setRawLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/inventory/raw`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setRawMaterials(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRawLoading(false);
    }
  };

  const fetchRawMaterialLogs = async (matId) => {
    setRawHistoryLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/inventory/raw/${matId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setRawHistoryLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRawHistoryLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    setItemsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.items) {
        setMenuItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchItemHistory = async (itemId) => {
    setItemHistoryLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/inventory/items/${itemId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItemHistoryLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setItemHistoryLoading(false);
    }
  };

  const handleOpenItemAdjustModal = (item) => {
    setAdjustItemModal(item);
    setAdjustItemForm({
      change_type: 'STOCK_ADD',
      quantity: 10,
      reason: 'Dish batch prepared / restocked',
      min_stock_level: item.min_stock_level || 5
    });
  };

  const handleSaveItemStockAdjust = async (e) => {
    e.preventDefault();
    if (!adjustItemModal) return;

    try {
      const res = await fetch(`${apiUrl}/api/inventory/${adjustItemModal.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adjustItemForm)
      });
      const data = await res.json();

      if (res.ok) {
        addToast(`Updated stock for dish "${adjustItemModal.name}"`, 'success');
        setAdjustItemModal(null);
        fetchMenuItems();
        if (activeTab === 'logs') fetchGlobalLogs();
      } else {
        addToast(data.message || 'Failed to adjust stock', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error adjusting dish stock', 'error');
    }
  };

  useEffect(() => {
    fetchRawMaterials();
    fetchMenuItems();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchGlobalLogs();
    }
  }, [activeTab, logTypeFilter]);

  const handleOpenItemHistory = (item) => {
    setItemHistoryModal(item);
    fetchItemHistory(item.id);
  };

  // Raw Material Handlers
  const handleCreateRawMaterial = async (e) => {
    e.preventDefault();
    if (!addRawForm.name) return;

    try {
      const res = await fetch(`${apiUrl}/api/inventory/raw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addRawForm)
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Raw material "${addRawForm.name}" registered successfully!`, 'success');
        setShowAddRawModal(false);
        setAddRawForm({ name: '', stock_quantity: 0, unit: 'pcs', min_stock_level: 10 });
        fetchRawMaterials();
      } else {
        addToast(data.message || 'Failed to create raw material', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error creating raw material', 'error');
    }
  };

  const handleOpenRawAdjustModal = (item) => {
    setAdjustRawModalItem(item);
    setAdjustRawForm({
      change_type: 'STOCK_ADD',
      quantity: 10,
      reason: 'Regular raw material restock',
      min_stock_level: item.min_stock_level || 10
    });
  };

  const handleSaveRawStockAdjust = async (e) => {
    e.preventDefault();
    if (!adjustRawModalItem) return;

    try {
      const res = await fetch(`${apiUrl}/api/inventory/raw/${adjustRawModalItem._id || adjustRawModalItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adjustRawForm)
      });
      const data = await res.json();

      if (res.ok) {
        addToast(`Updated stock for raw material ${adjustRawModalItem.name}`, 'success');
        setAdjustRawModalItem(null);
        fetchRawMaterials();
        if (activeTab === 'logs') fetchGlobalLogs();
      } else {
        addToast(data.message || 'Failed to adjust stock', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error adjusting raw material stock', 'error');
    }
  };

  const handleOpenRawHistory = (item) => {
    setRawHistoryModal(item);
    fetchRawMaterialLogs(item._id || item.id);
  };

  const handleDeleteRawMaterial = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete raw material "${name}"?`)) return;

    try {
      const res = await fetch(`${apiUrl}/api/inventory/raw/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast(`Raw material "${name}" deleted.`, 'info');
        fetchRawMaterials();
      } else {
        addToast('Failed to delete raw material', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalRawCount = rawMaterials.length;
  const lowRawCount = rawMaterials.filter(m => m.stock_quantity <= m.min_stock_level).length;
  const outOfRawCount = rawMaterials.filter(m => m.stock_quantity === 0).length;

  const totalItemsCount = menuItems.length;
  const lowItemsCount = menuItems.filter(m => m.stock_quantity <= m.min_stock_level).length;
  const outOfItemsCount = menuItems.filter(m => m.stock_quantity === 0 || !m.is_available).length;

  if (rawLoading && itemsLoading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header Controls */}
      <PageHeader 
        title="Inventory & Stock Control" 
        description="Monitor prepared dish batches, raw ingredient levels, and automatic stock deductions."
        icon={Boxes}
      >
        <button
          onClick={handleExportSheet}
          className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30"
        >
          <Download className="w-4 h-4" />
          <span>Export Stock Sheet (Excel)</span>
        </button>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">
              {activeTab === 'items' ? 'Total Dishes & Drinks' : 'Total Raw Ingredients'}
            </span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {activeTab === 'items' ? totalItemsCount : totalRawCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Low Stock Alert</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {activeTab === 'items' ? lowItemsCount : lowRawCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Out of Stock / Sold Out</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {activeTab === 'items' ? outOfItemsCount : outOfRawCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="overflow-x-auto border-b border-gray-100 bg-gray-50/70">
          <div className="flex px-4 sm:px-6 pt-3 gap-4 sm:gap-6 min-w-max">
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'items'
                  ? 'border-[#691F1A] text-[#691F1A]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <Boxes className="w-4 h-4" />
              Dishes & Finished Goods ({menuItems.length})
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'raw'
                  ? 'border-[#691F1A] text-[#691F1A]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Raw Materials ({rawMaterials.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-[#691F1A] text-[#691F1A]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4" />
              Audit Trail Logs
            </button>
          </div>
        </div>

      {/* Tab: Menu Items / Dishes */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
          {/* Header Controls for Dishes */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, drinks, or categories..."
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#F8A324] focus:ring-1"
              />
            </div>

            <button
              onClick={fetchMenuItems}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${itemsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Dishes Table */}
          {itemsLoading ? (
            <p className="text-gray-400 text-xs py-12 text-center">Loading menu stock levels...</p>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-16">
              <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm">No dishes found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Dish / Product Name</th>
                    <th className="py-3.5 px-4 sm:px-6">Category</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Stock Level</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Low Threshold</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                  {menuItems
                    .filter(m => 
                      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (m.category_name && m.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map(item => {
                      const isUnlimited = Boolean(item.is_unlimited_stock);
                      const isLow = !isUnlimited && item.stock_quantity <= item.min_stock_level && item.stock_quantity > 0;
                      const isOut = !isUnlimited && (item.stock_quantity === 0 || !item.is_available);
                      return (
                        <tr key={item.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-bold text-gray-900 flex items-center gap-2.5">
                            {item.image_url && (
                              <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <div>
                              <span>{item.name}</span>
                              {isUnlimited && (
                                <span className="ml-2 text-[10px] text-blue-700 font-black bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  ♾️ Unlimited Stock
                                </span>
                              )}
                              {!item.is_available && !isUnlimited && (
                                <span className="ml-2 text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                  Disabled in Menu
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-gray-500">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">
                              {item.category_name}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center font-serif text-base font-bold text-gray-800">
                            {isUnlimited ? (
                              <span className="text-blue-700 font-black text-xs">Always In Stock</span>
                            ) : (
                              <>{item.stock_quantity} <span className="text-xs text-gray-400 font-normal">{item.unit || 'portions'}</span></>
                            )}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center text-gray-500">
                            {isUnlimited ? 'N/A' : `${item.min_stock_level} ${item.unit || 'portions'}`}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center">
                            <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full flex items-center justify-center gap-1 w-max mx-auto ${
                              isUnlimited ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              isOut ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              isLow ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isUnlimited ? '♾️ Unlimited' : isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenItemAdjustModal(item)}
                                className="px-3 py-1.5 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Restock / Adjust
                              </button>
                              <button
                                onClick={() => handleOpenItemHistory(item)}
                                className="p-1.5 bg-gray-100 hover:bg-[#691F1A]/10 hover:text-[#691F1A] text-gray-600 rounded-lg transition-colors cursor-pointer"
                                title="View history"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



      {/* Tab: Raw Materials */}
      {activeTab === 'raw' && (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
          {/* Header Controls for Raw Materials */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw materials..."
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#F8A324] focus:ring-1"
              />
            </div>
            
            <button
              onClick={() => setShowAddRawModal(true)}
              className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer border border-[#F8A324]/30"
            >
              + Add Raw Material
            </button>
          </div>

          {/* Raw Materials Table */}
          {rawLoading ? (
            <p className="text-gray-400 text-xs py-12 text-center">Loading ingredients list...</p>
          ) : rawMaterials.length === 0 ? (
            <div className="text-center py-16">
              <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm">No raw materials registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Material Name</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Stock Level</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Threshold</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                  {rawMaterials
                    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => {
                      const isLow = item.stock_quantity <= item.min_stock_level;
                      const isOut = item.stock_quantity === 0;
                      return (
                        <tr key={item._id || item.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-bold text-gray-900">
                            {item.name}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center font-serif text-base font-bold text-gray-805">
                            {item.stock_quantity} <span className="text-xs text-gray-400 font-normal">{item.unit}</span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center text-gray-500">
                            {item.min_stock_level} {item.unit}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center">
                            <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full flex items-center justify-center gap-1 w-max mx-auto ${
                              isOut ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              isLow ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenRawAdjustModal(item)}
                                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Update Stock
                              </button>
                              <button
                                onClick={() => handleOpenRawHistory(item)}
                                className="p-1.5 bg-gray-100 hover:bg-[#691F1A]/10 hover:text-[#691F1A] text-gray-600 rounded-lg transition-colors cursor-pointer"
                                title="View history"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRawMaterial(item._id || item.id, item.name)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Global Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
          {/* Filter Bar Header with Padding */}
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history by dish name, order #, reason..."
                  className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
                />
              </div>

              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F8A324] w-full sm:w-auto cursor-pointer"
              >
                <option value="ALL">All Action Types</option>
                <option value="STOCK_ADD">Add (+)</option>
                <option value="STOCK_SUB">Subtract (-)</option>
                <option value="STOCK_SET">Set (=)</option>
                <option value="ORDER_DEDUCT">Order Auto-Deducted</option>
              </select>

              <button
                onClick={fetchGlobalLogs}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 w-full sm:w-auto justify-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh Logs
              </button>
            </div>
          </div>

          {/* Audit Trail edge-to-edge Table */}
          {logsLoading ? (
            <p className="text-gray-400 text-xs py-12 text-center">Loading audit history...</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm">No inventory audit history recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Date & Time</th>
                    <th className="py-3.5 px-4 sm:px-6">Dish Item</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Action Type</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Quantity Change</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Stock Transition</th>
                    <th className="py-3.5 px-4 sm:px-6">Reason / Order Ref</th>
                    <th className="py-3.5 px-4 sm:px-6">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                  {logs
                    .slice((logsPage - 1) * logsPageSize, logsPage * logsPageSize)
                    .map(log => {
                    const isPositive = log.quantity_change > 0;
                    return (
                      <tr key={log.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                        <td className="py-4 px-4 sm:px-6 text-xs font-semibold text-gray-500">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </td>

                        <td className="py-4 px-4 sm:px-6 font-bold text-gray-900">
                          {log.item_name}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-center">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            log.change_type === 'ORDER_DEDUCT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            log.change_type === 'STOCK_ADD' || log.change_type === 'RESTOCK' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.change_type === 'STOCK_SUB' || log.change_type === 'WASTAGE' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {log.change_type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-center">
                          <span className={`font-serif font-bold text-sm inline-flex items-center gap-1 ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? `+${log.quantity_change}` : log.quantity_change}
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-center text-xs font-semibold text-gray-600">
                          <span className="text-gray-400">{log.previous_stock}</span>
                          <span className="mx-1 text-gray-300">→</span>
                          <span className="font-bold text-gray-900">{log.new_stock}</span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-xs text-gray-500 font-normal">
                          {log.reason || 'N/A'}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-xs text-gray-500 font-normal">
                          👤 {log.performed_by || 'System'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer with Padding */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 bg-white">
            <Pagination
              currentPage={logsPage}
              totalPages={Math.ceil(logs.length / logsPageSize)}
              totalItems={logs.length}
              pageSize={logsPageSize}
              onPageChange={(p) => setLogsPage(p)}
              pageSizeOptions={[10, 15, 25, 50]}
              onPageSizeChange={(s) => { setLogsPageSize(s); setLogsPage(1); }}
            />
          </div>
        </div>
      )}
    </div>



      {/* Add Raw Material Modal */}
      {showAddRawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-gold-500" />
                Register New Raw Material
              </h3>
              <button onClick={() => setShowAddRawModal(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRawMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pav, Potatoes, Amul Butter"
                  value={addRawForm.name}
                  onChange={(e) => setAddRawForm({...addRawForm, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addRawForm.stock_quantity}
                    onChange={(e) => setAddRawForm({...addRawForm, stock_quantity: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pcs, g, kg, ml"
                    value={addRawForm.unit}
                    onChange={(e) => setAddRawForm({...addRawForm, unit: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Low Stock Warning Threshold</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={addRawForm.min_stock_level}
                  onChange={(e) => setAddRawForm({...addRawForm, min_stock_level: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddRawModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Raw Material Stock Modal */}
      {adjustRawModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gold-500" />
                Update Stock: {adjustRawModalItem.name}
              </h3>
              <button onClick={() => setAdjustRawModalItem(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRawStockAdjust} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Action Type</label>
                <select
                  value={adjustRawForm.change_type}
                  onChange={(e) => setAdjustRawForm({...adjustRawForm, change_type: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-gold-500"
                >
                  <option value="STOCK_ADD">Add Stock (+)</option>
                  <option value="STOCK_SUB">Subtract Stock (-)</option>
                  <option value="STOCK_SET">Set Stock (=)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Current Stock</label>
                  <input
                    type="text"
                    disabled
                    value={`${adjustRawModalItem.stock_quantity} ${adjustRawModalItem.unit}`}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={adjustRawForm.quantity}
                    onChange={(e) => setAdjustRawForm({...adjustRawForm, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Low Stock Warning Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={adjustRawForm.min_stock_level}
                  onChange={(e) => setAdjustRawForm({...adjustRawForm, min_stock_level: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Reason / Notes</label>
                <textarea
                  rows="2"
                  value={adjustRawForm.reason}
                  onChange={(e) => setAdjustRawForm({...adjustRawForm, reason: e.target.value})}
                  placeholder="e.g. Bulk ingredients restock..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustRawModalItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Inventory Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raw Material History Modal */}
      {rawHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col slide-up max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold-500" />
                  {rawHistoryModal.name} - Change History
                </h3>
                <span className="text-xs text-gray-400">Ingredient audit trail log</span>
              </div>
              <button onClick={() => setRawHistoryModal(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {rawHistoryLoading ? (
                <p className="text-gray-400 text-xs py-8 text-center">Loading audit log...</p>
              ) : rawHistoryLogs.length === 0 ? (
                <p className="text-gray-400 text-xs py-8 text-center">No history logs recorded for this ingredient.</p>
              ) : (
                rawHistoryLogs.map(log => {
                  const isPositive = log.quantity_change > 0;
                  return (
                    <div key={log.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          log.change_type === 'ORDER_DEDUCT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {log.change_type === 'ORDER_DEDUCT' ? 'Auto-Deduct' : log.change_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs font-semibold text-gray-800">
                          Stock: {log.previous_stock} → <span className="font-bold text-gold-600">{log.new_stock}</span>
                          <span className="text-[10px] text-gray-400 ml-1">({isPositive ? `+${log.quantity_change}` : log.quantity_change})</span>
                        </div>
                        <div className="text-[10px] text-gray-500">By: {log.recorded_by}</div>
                      </div>

                      {log.reason && (
                        <div className="text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-100">
                          "{log.reason}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* Adjust Menu Item Dish Stock Modal */}
      {adjustItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gold-500" />
                Restock Dish: {adjustItemModal.name}
              </h3>
              <button onClick={() => setAdjustItemModal(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemStockAdjust} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Action Type</label>
                <select
                  value={adjustItemForm.change_type}
                  onChange={(e) => setAdjustItemForm({...adjustItemForm, change_type: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-gold-500"
                >
                  <option value="STOCK_ADD">Add Portions Prepared (+)</option>
                  <option value="STOCK_SUB">Deduct Portions (-)</option>
                  <option value="STOCK_SET">Set Absolute Stock (=)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Current Stock</label>
                  <input
                    type="text"
                    disabled
                    value={`${adjustItemModal.stock_quantity} ${adjustItemModal.unit || 'portions'}`}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={adjustItemForm.quantity}
                    onChange={(e) => setAdjustItemForm({...adjustItemForm, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Low Stock Warning Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={adjustItemForm.min_stock_level}
                  onChange={(e) => setAdjustItemForm({...adjustItemForm, min_stock_level: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Reason / Batch Notes</label>
                <textarea
                  rows="2"
                  value={adjustItemForm.reason}
                  onChange={(e) => setAdjustItemForm({...adjustItemForm, reason: e.target.value})}
                  placeholder="e.g. Daily morning prep batch, kitchen stock replenishment..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustItemModal(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Dish Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item Dish History Modal */}
      {itemHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col slide-up max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold-500" />
                  {itemHistoryModal.name} - Change History
                </h3>
                <span className="text-xs text-gray-400">Dish stock & order deduction trail</span>
              </div>
              <button onClick={() => setItemHistoryModal(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {itemHistoryLoading ? (
                <p className="text-gray-400 text-xs py-8 text-center">Loading audit log...</p>
              ) : itemHistoryLogs.length === 0 ? (
                <p className="text-gray-400 text-xs py-8 text-center">No history logs recorded for this dish.</p>
              ) : (
                itemHistoryLogs.map(log => {
                  const isPositive = log.quantity_change > 0;
                  return (
                    <div key={log.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          log.change_type === 'ORDER_DEDUCT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {log.change_type === 'ORDER_DEDUCT' ? 'Order Auto-Deduct' : log.change_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs font-semibold text-gray-800">
                          Stock: {log.previous_stock} → <span className="font-bold text-gold-600">{log.new_stock}</span>
                          <span className="text-[10px] text-gray-400 ml-1">({isPositive ? `+${log.quantity_change}` : log.quantity_change})</span>
                        </div>
                        <div className="text-[10px] text-gray-500">By: {log.recorded_by}</div>
                      </div>

                      {log.reason && (
                        <div className="text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-100">
                          "{log.reason}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
