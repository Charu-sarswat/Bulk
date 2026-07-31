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
    const headers = ['Dish Name', 'Category', 'Stock Quantity', 'Min Stock Level', 'Daily Prep Qty', 'Unit', 'Status'];
    const rows = items.map(i => [
      i.name,
      i.category_name || 'Unassigned',
      i.stock_quantity,
      i.min_stock_level,
      i.daily_prepared_quantity,
      i.unit || 'servings',
      i.is_available ? 'In Stock' : 'Out of Stock'
    ]);
    exportToCSV('Bombay_Chowpati_Inventory_Sheet', headers, rows);
  };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'logs'
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | IN_STOCK | LOW_STOCK | OUT_OF_STOCK
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');

  // Pagination
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(15);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(15);

  React.useEffect(() => { setStockPage(1); }, [searchQuery, selectedCategory, statusFilter]);
  React.useEffect(() => { setLogsPage(1); }, [searchQuery, logTypeFilter]);

  // Modals
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    change_type: 'STOCK_ADD', // STOCK_ADD | STOCK_SUB | STOCK_SET
    quantity: 10,
    reason: '',
    min_stock_level: 10
  });

  const [itemHistoryModal, setItemHistoryModal] = useState(null);
  const [itemHistoryLogs, setItemHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchInventoryData = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        addToast(data.message || 'Failed to load inventory data', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/menu/categories`);
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

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

  const fetchItemHistory = async (itemId) => {
    setHistoryLoading(true);
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
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchGlobalLogs();
    }
  }, [activeTab, logTypeFilter]);

  const handleOpenAdjustModal = (item) => {
    setAdjustModalItem(item);
    setAdjustForm({
      change_type: 'STOCK_ADD',
      quantity: 10,
      reason: 'Regular inventory update',
      min_stock_level: item.min_stock_level || 10
    });
  };

  const handleSaveStockAdjust = async (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    try {
      const res = await fetch(`${apiUrl}/api/inventory/${adjustModalItem.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adjustForm)
      });
      const data = await res.json();

      if (res.ok) {
        addToast(`Updated stock for ${adjustModalItem.name}`, 'success');
        setAdjustModalItem(null);
        fetchInventoryData();
        if (activeTab === 'logs') fetchGlobalLogs();
      } else {
        addToast(data.message || 'Failed to update stock', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating inventory stock', 'error');
    }
  };

  const handleOpenItemHistory = (item) => {
    setItemHistoryModal(item);
    fetchItemHistory(item.id);
  };

  // Filtered Overview Items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.category_name && item.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'ALL' || item.category_id === selectedCategory;
    const matchesStatus = statusFilter === 'ALL' || item.stock_status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header Controls */}
      <PageHeader 
        title="Inventory & Stock Control" 
        description="Monitor dish availability, track stock deductions, and audit stock updates."
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
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Total Catalog Dishes</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{metrics.totalDishes}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Low Stock Alert</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{metrics.lowStockCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Out of Stock</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{metrics.outOfStockCount}</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="overflow-x-auto border-b border-gray-100 bg-gray-50/70">
          <div className="flex px-4 sm:px-6 pt-3 gap-4 sm:gap-6 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#691F1A] text-[#691F1A]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <Boxes className="w-4 h-4" />
              Stock Overview
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

      {/* Tab 1: Stock Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
          {/* Filter Bar Header with Padding */}
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu dish or category..."
                  className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F8A324] w-full md:w-auto cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F8A324] w-full md:w-auto cursor-pointer"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock Alert</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Inventory edge-to-edge Table */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm">No inventory items match your filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Dish Item</th>
                    <th className="py-3.5 px-4 sm:px-6">Category</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">In Stock</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Price</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                  {filteredItems
                    .slice((stockPage - 1) * stockPageSize, stockPage * stockPageSize)
                    .map(item => (
                    <tr key={item.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            <img 
                              src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {item.name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-light">Min Threshold: {item.min_stock_level} {item.unit}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 sm:px-6">
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {item.category_name || 'General'}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className={`font-serif font-bold text-base ${
                          item.stock_status === 'OUT_OF_STOCK' ? 'text-rose-600' :
                          item.stock_status === 'LOW_STOCK' ? 'text-amber-600' : 'text-gray-900'
                        }`}>
                          {item.stock_quantity}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-light">{item.unit}</span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full flex items-center justify-center gap-1 w-max mx-auto ${
                          item.stock_status === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.stock_status === 'LOW_STOCK' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.stock_status === 'IN_STOCK' && <CheckCircle2 className="w-3 h-3" />}
                          {item.stock_status === 'LOW_STOCK' && <AlertTriangle className="w-3 h-3" />}
                          {item.stock_status === 'OUT_OF_STOCK' && <XCircle className="w-3 h-3" />}
                          {item.stock_status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right font-bold text-[#691F1A]">
                        {restaurantConfig.currency}{parseFloat(item.price).toFixed(2)}
                      </td>

                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Adjust stock quantity"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Update Stock
                          </button>
                          <button
                            onClick={() => handleOpenItemHistory(item)}
                            className="p-1.5 bg-gray-100 hover:bg-[#691F1A]/10 hover:text-[#691F1A] text-gray-600 rounded-lg transition-colors cursor-pointer"
                            title="View item change history log"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer with Padding */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 bg-white">
            <Pagination
              currentPage={stockPage}
              totalPages={Math.ceil(filteredItems.length / stockPageSize)}
              totalItems={filteredItems.length}
              pageSize={stockPageSize}
              onPageChange={(p) => setStockPage(p)}
              pageSizeOptions={[10, 15, 25, 50]}
              onPageSizeChange={(s) => { setStockPageSize(s); setStockPage(1); }}
            />
          </div>
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

      {/* Stock Adjust Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gold-500" />
                Update Stock: {adjustModalItem.name}
              </h3>
              <button onClick={() => setAdjustModalItem(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Action Type</label>
                <select
                  value={adjustForm.change_type}
                  onChange={(e) => setAdjustForm({...adjustForm, change_type: e.target.value})}
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
                    value={`${adjustModalItem.stock_quantity} ${adjustModalItem.unit}`}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value, 10) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Low Stock Warning Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={adjustForm.min_stock_level}
                  onChange={(e) => setAdjustForm({...adjustForm, min_stock_level: parseInt(e.target.value, 10) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Reason / Notes</label>
                <textarea
                  rows="2"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                  placeholder="e.g. Fresh stock arrival..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
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

      {/* Item History Modal */}
      {itemHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col slide-up max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold-500" />
                  {itemHistoryModal.name} - Change History
                </h3>
                <span className="text-xs text-gray-400">Date & timestamped audit log</span>
              </div>
              <button onClick={() => setItemHistoryModal(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {historyLoading ? (
                <p className="text-gray-400 text-xs py-8 text-center">Loading item history...</p>
              ) : itemHistoryLogs.length === 0 ? (
                <p className="text-gray-400 text-xs py-8 text-center">No history logs recorded for this item.</p>
              ) : (
                itemHistoryLogs.map(log => (
                  <div key={log.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-gray-400">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        log.quantity_change > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs font-semibold text-gray-800">
                        Stock: {log.previous_stock} → <span className="font-bold text-gold-600">{log.new_stock}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">By: {log.recorded_by}</div>
                    </div>

                    {log.reason && (
                      <div className="text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-100">
                        "{log.reason}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
