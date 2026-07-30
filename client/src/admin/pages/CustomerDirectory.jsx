import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils/csvExporter';
import { Users, Search, Phone, Mail, Clock, CreditCard, RefreshCw, Eye, X, Download, ShieldCheck, User } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function CustomerDirectory() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const handleExportSheet = () => {
    const headers = ['Customer Name', 'Phone Number', 'Email', 'Account Type', 'Total Visits', 'Total Spend (₹)'];
    const rows = customers.map(c => [
      c.name || 'Guest User',
      c.phone || 'N/A',
      c.email || 'N/A',
      (c.email || c.is_registered) ? 'Registered' : 'Guest Walk-in',
      c.orders_count || 1,
      c.total_spend || 0
    ]);
    exportToCSV('Bombay_Chowpati_Customers_Log', headers, rows);
  };

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');

  // Modal / Detail drawer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleOpenDetail = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    try {
      const response = await fetch(`${apiUrl}/api/customers/${customer.id}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setCustomerOrders(data);
      } else {
        setCustomerOrders([]);
      }
    } catch (err) {
      console.error(err);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const nameStr = (c.name || '').toLowerCase();
    const phoneStr = (c.phone || '').toLowerCase();
    const emailStr = (c.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = nameStr.includes(query) || phoneStr.includes(query) || emailStr.includes(query);
    const isRegistered = !!c.email || c.is_registered;
    const matchesType = accountTypeFilter === 'all' ? true : 
                        accountTypeFilter === 'registered' ? isRegistered : !isRegistered;
    return matchesQuery && matchesType;
  });

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header controls */}
      <PageHeader
        title="Customers Log Directory"
        description="Tracking registered client profiles and guest contacts for marketing & support audits."
        icon={Users}
      >
        <button
          onClick={handleExportSheet}
          className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Sheet (CSV)</span>
        </button>
      </PageHeader>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Total Customer Logs</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{customers.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Registered Accounts</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {customers.filter(c => !!c.email || c.is_registered).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Guest Walk-ins</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {customers.filter(c => !c.email && !c.is_registered).length}
            </div>
          </div>
        </div>
      </div>

      {/* Single Unified Edge-to-Edge Table Panel Card Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {/* Search & Control Bar Header with Padding */}
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by name, phone, or email..."
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
              />
            </div>
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F8A324] cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Profile Types</option>
              <option value="registered">Registered Accounts</option>
              <option value="guest">Guest Contacts</option>
            </select>
          </div>
        </div>

        {/* Customers edge-to-edge Table */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs font-semibold">
            No customers found matching search logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[550px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4 sm:px-6">Contact Info</th>
                  <th className="py-3.5 px-4 sm:px-6">Type</th>
                  <th className="py-3.5 px-4 sm:px-6">First / Last Visit</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Orders</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Total Spent</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                {filteredCustomers
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#FFF9EE]/20 transition-colors">
                    {/* User */}
                    <td className="py-4 px-4 sm:px-6 font-bold text-gray-900">
                      {c.name || 'Anonymous Guest'}
                    </td>
                    
                    {/* Contact */}
                    <td className="py-4 px-4 sm:px-6 space-y-1">
                      {c.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-600 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Account Type */}
                    <td className="py-4 px-4 sm:px-6">
                      {c.id ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                          Registered
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-amber-200">
                          Guest
                        </span>
                      )}
                    </td>

                    {/* Visits */}
                    <td className="py-4 px-4 sm:px-6 space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>First: {new Date(c.first_visit).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600 font-semibold">
                        <Clock className="w-3 h-3 text-gold-500" />
                        <span>Last: {new Date(c.last_visit).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Orders count */}
                    <td className="py-4 px-4 sm:px-6 text-center font-bold text-gray-900">
                      {c.total_orders} orders
                    </td>

                    {/* Total spent */}
                    <td className="py-4 px-4 sm:px-6 text-right font-bold text-[#691F1A] text-sm">
                      {restaurantConfig.currency}{parseFloat(c.total_spent).toFixed(2)}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <button
                        onClick={() => viewCustomerProfile(c)}
                        className="p-1.5 bg-gray-100 hover:bg-[#691F1A]/10 text-gray-500 hover:text-[#691F1A] rounded-lg transition-colors cursor-pointer"
                        title="View Complete Profile & History"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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
            currentPage={currentPage}
            totalPages={Math.ceil(filteredCustomers.length / pageSize)}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            pageSizeOptions={[10, 15, 25, 50]}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Customer Profile Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col slide-up max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-500" />
                <span>Customer Profile Detail</span>
              </h3>
              <button 
                onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }} 
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Summary Card */}
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-gray-900">{selectedCustomer.name}</h4>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase mt-1.5 border ${
                    selectedCustomer.id 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedCustomer.id ? 'Registered Client' : 'Guest'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Spent</span>
                  <span className="text-lg font-black text-gold-600">
                    {restaurantConfig.currency}{parseFloat(selectedCustomer.total_spent).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {selectedCustomer.phone && (
                  <div className="border border-gray-100 p-3 rounded-lg space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Phone</span>
                    <div className="font-semibold text-gray-700">{selectedCustomer.phone}</div>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="border border-gray-100 p-3 rounded-lg space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Email</span>
                    <div className="font-semibold text-gray-700">{selectedCustomer.email}</div>
                  </div>
                )}
                <div className="border border-gray-100 p-3 rounded-lg space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">First Visited</span>
                  <div className="font-semibold text-gray-700">
                    {new Date(selectedCustomer.first_visit).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                </div>
                <div className="border border-gray-100 p-3 rounded-lg space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Last Visited</span>
                  <div className="font-semibold text-gray-700">
                    {new Date(selectedCustomer.last_visit).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider border-b border-gray-100 pb-2">
                  Order Purchase History ({selectedCustomer.total_orders} Orders)
                </h4>

                {loadingOrders ? (
                  <div className="py-6 text-center">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-gray-400">Fetching history log...</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">No order items recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {customerOrders.map(order => (
                      <div key={order.id} className="border border-gray-100 rounded-lg p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center font-bold text-[10px] text-gray-400">
                          <span>ORDER #{order.id} ({new Date(order.created_at).toLocaleDateString()})</span>
                          <span className={`uppercase px-1.5 py-0.5 rounded text-[8px] border ${
                            order.status === 'served' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="text-gray-700 font-semibold space-y-0.5 pl-2 border-l border-gold-400/50">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.name} x {item.quantity}</span>
                              <span className="text-gray-400">{restaurantConfig.currency}{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 pt-1 border-t border-gray-50">
                          <span>{order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</span>
                          <span className="text-gray-800 text-xs">Total: {restaurantConfig.currency}{parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
