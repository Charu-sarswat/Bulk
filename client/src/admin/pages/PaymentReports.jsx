import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils/csvExporter';
import { restaurantConfig } from '../../config/restaurant';
import { IndianRupee, Search, CheckCircle, FileText, CheckCircle2, Clock, Download, CreditCard } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function PaymentReports() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const handleExportSheet = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Payment Method', 'Payment UTR / Ref', 'Status', 'Total Amount (₹)'];
    const rows = orders.map(o => [
      o.order_number || o.id,
      new Date(o.created_at).toLocaleString('en-IN'),
      o.customer_name || 'Guest',
      o.payment_method,
      o.payment_utr || 'N/A',
      o.payment_status,
      o.total_amount
    ]);
    exportToCSV('Bombay_Chowpati_Payments_Sheet', headers, rows);
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all'); // all | upi | counter
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Reset page when filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, methodFilter]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchOrdersHistory = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      addToast('Error loading transaction history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersHistory();
  }, [token]);

  const settlePayment = async (orderId) => {
    if (!window.confirm(`Mark Order #${orderId} as PAID?`)) return;

    try {
      const response = await fetch(`${apiUrl}/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: 'paid' })
      });

      if (!response.ok) throw new Error('Error settling payment');
      
      addToast(`Order #${orderId} settled successfully!`, 'success');
      // Update locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, payment_status: 'paid' } : order
        )
      );
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Computations
  const filteredOrders = orders.filter((order) => {
    const tableNum = order.table_number || '';
    const orderNum = order.order_number || '';
    const matchesSearch = order.id.toString().includes(searchQuery) || 
                          orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tableNum.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.payment_status === statusFilter;
    const matchesMethod = methodFilter === 'all' || order.payment_method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  const pendingSettle = orders
    .filter(o => o.payment_status === 'pending' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeader 
        title="Payment & Revenue Logs"
        description="Track settled drawers, awaiting payments, and overall income."
        icon={IndianRupee}
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Settled Drawer</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5 truncate">{restaurantConfig.currency}{totalRevenue.toFixed(0)}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Awaiting Payment</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5 truncate">{restaurantConfig.currency}{pendingSettle.toFixed(0)}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Total Volume</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5 truncate">{orders.length} Transactions</div>
          </div>
        </div>
      </div>

      {/* Single Unified Edge-to-Edge Table Panel Card Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {/* Table Controls Header with Padding */}
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket #, table, or customer..."
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#F8A324] cursor-pointer"
              >
                <option value="all">All States</option>
                <option value="pending">Awaiting Pay</option>
                <option value="paid">Settled</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#F8A324] cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="upi">Online UPI</option>
                <option value="counter">Cash Counter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit list edge-to-edge table */}
        {filteredOrders.length === 0 ? (
          <p className="text-gray-400 text-xs py-16 text-center">No transaction records logged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 text-center">Ticket #</th>
                  <th className="py-3.5 px-4 sm:px-6">Table</th>
                  <th className="py-3.5 px-4 sm:px-6">Ordered Dishes</th>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Bill Amt</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Method</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                {filteredOrders
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                    <td className="py-4 px-4 sm:px-6 text-center font-bold text-gray-900">#{order.id}</td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-gray-900">{order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</td>
                    <td className="py-4 px-4 sm:px-6 max-w-[200px] truncate text-xs text-gray-500 font-normal">
                      {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-xs text-gray-400 font-light">
                      {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right font-bold text-[#691F1A]">{restaurantConfig.currency}{parseFloat(order.total_amount).toFixed(2)}</td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        order.payment_status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : order.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                      }`}>
                        {order.payment_status === 'paid' ? 'Paid' : order.status === 'cancelled' ? 'Cancelled' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      {order.payment_status === 'pending' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => settlePayment(order.id)}
                          className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                        >
                          Settle
                        </button>
                      )}
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
            totalPages={Math.ceil(filteredOrders.length / pageSize)}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            pageSizeOptions={[10, 15, 25, 50]}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        </div>
      </div>

    </div>
  );
}
