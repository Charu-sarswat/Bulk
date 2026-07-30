import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { restaurantConfig } from '../../config/restaurant';
import { exportToCSV } from '../../utils/csvExporter';
import { 
  FileText, Search, Eye, Printer, X, Plus, 
  Utensils, User, CreditCard, ShoppingBag, CheckCircle2, 
  AlertTriangle, Filter, Send, Download, IndianRupee, TrendingUp
} from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import WhatsAppIcon from '../../customer/components/WhatsAppIcon';

export default function OrderHistory() {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | received | preparing | ready | served | cancelled
  const [payFilter, setPayFilter] = useState('ALL'); // ALL | paid | pending
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Admin Create Order Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Create Order Form State
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customTableNumber, setCustomTableNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('counter');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [orderNotes, setOrderNotes] = useState('');

  // Cart for new order
  const [cart, setCart] = useState([]); // [{ item_id, name, price, quantity, notes, stock_quantity }]
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCatFilter, setMenuCatFilter] = useState('ALL');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading orders.', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreateOrderDependencies = async () => {
    try {
      // Fetch Tables
      const tRes = await fetch(`${apiUrl}/api/tables`);
      const tData = await tRes.json();
      if (tRes.ok) setTables(tData);

      // Fetch Categories
      const cRes = await fetch(`${apiUrl}/api/menu/categories`);
      const cData = await cRes.json();
      if (cRes.ok) setCategories(cData);

      // Fetch Menu Items
      const mRes = await fetch(`${apiUrl}/api/menu/items`);
      const mData = await mRes.json();
      if (mRes.ok) setMenuItems(mData);

      // Fetch Customers
      const custRes = await fetch(`${apiUrl}/api/orders/reports/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const custData = await custRes.json();
      if (custRes.ok && custData.registered) setCustomers(custData.registered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleOpenCreateModal = () => {
    fetchCreateOrderDependencies();
    setCart([]);
    setSelectedTableId('');
    setCustomTableNumber('');
    setSelectedCustomerId('');
    setGuestName('');
    setGuestPhone('');
    setPaymentMethod('counter');
    setPaymentStatus('paid');
    setOrderNotes('');
    setCreateModalOpen(true);
  };

  // Cart operations
  const handleAddToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.id);
    if (existing) {
      if (existing.quantity >= (item.stock_quantity || 99)) {
        addToast(`Cannot add more. Max stock available is ${item.stock_quantity}`, 'warning');
        return;
      }
      setCart(cart.map(c => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      if ((item.stock_quantity || 0) <= 0) {
        addToast(`Item "${item.name}" is currently out of stock`, 'warning');
        return;
      }
      setCart([...cart, {
        item_id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
        notes: '',
        stock_quantity: item.stock_quantity || 50
      }]);
    }
  };

  const handleUpdateCartQty = (itemId, delta) => {
    setCart(cart.map(c => {
      if (c.item_id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const handleUpdateItemNotes = (itemId, notes) => {
    setCart(cart.map(c => c.item_id === itemId ? { ...c, notes } : c));
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      addToast('Please add at least one dish to the order.', 'warning');
      return;
    }

    let customerName = guestName;
    let customerPhone = guestPhone;

    if (selectedCustomerId) {
      const found = customers.find(c => c.id === parseInt(selectedCustomerId, 10));
      if (found) {
        customerName = found.name;
        customerPhone = found.phone;
      }
    }

    const payload = {
      admin_created: true,
      table_id: selectedTableId ? parseInt(selectedTableId, 10) : null,
      table_number_override: !selectedTableId ? (customTableNumber || 'Takeaway') : null,
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      notes: orderNotes || null,
      items: cart.map(c => ({
        menu_item_id: c.item_id,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        notes: c.notes || null
      }))
    };

    try {
      const res = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        addToast(`Order #${data.id} created successfully!`, 'success');
        setCreateModalOpen(false);
        fetchOrders();
      } else {
        addToast(data.message || 'Failed to create order', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error placing order.', 'error');
    }
  };
  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    const tableNum = order.table_number || '';
    const customer = order.customer_name || '';
    const searchLow = searchQuery.toLowerCase();
    const orderNum = order.order_number || '';
    
    const matchesSearch = order.id.toString().includes(searchLow) || 
                          orderNum.toLowerCase().includes(searchLow) ||
                          tableNum.toLowerCase().includes(searchLow) ||
                          customer.toLowerCase().includes(searchLow);
                          
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesPayment = payFilter === 'ALL' || order.payment_status === payFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  }) : [];

  const handlePrint = () => {
    if (!selectedOrder) return;
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Invoice #${selectedOrder.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 400px; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; font-size: 12px; }
            .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            .item { font-size: 12px; margin-bottom: 5px; }
            .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restaurantConfig.name}</h1>
            <p>${restaurantConfig.tagline}</p>
            <p>Invoice #${selectedOrder.id}</p>
            <p>${new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="flex-between item">
            <span>Table: ${selectedOrder.table_number || 'Takeaway'}</span>
            <span>Type: ${selectedOrder.payment_method}</span>
          </div>
          ${selectedOrder.customer_name ? `
          <div class="item">Customer: ${selectedOrder.customer_name}</div>
          ` : ''}

          <div class="divider"></div>
          
          ${selectedOrder.items?.map(item => `
            <div class="flex-between item">
              <span>${item.quantity}x ${item.name}</span>
              <span>${restaurantConfig.currency}${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            ${item.notes ? `<div style="font-size:10px; margin-left: 15px;">- ${item.notes}</div>` : ''}
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="flex-between total">
            <span>TOTAL</span>
            <span>${restaurantConfig.currency}${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
          </div>
          
          <div class="footer">
            <p>Thank you for dining with us!</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCat = menuCatFilter === 'ALL' || item.category_id === parseInt(menuCatFilter, 10);
    return matchesSearch && matchesCat;
  });

  const handleExportSheet = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Phone', 'Channel', 'Table', 'Status', 'Payment Method', 'Payment Status', 'Total (₹)'];
    const rows = orders.map(o => [
      o.order_number || o.id,
      new Date(o.created_at).toLocaleString('en-IN'),
      o.customer_name || 'Guest',
      o.customer_phone || '',
      o.order_channel || 'dine_in',
      o.table_number || 'Takeaway',
      o.status,
      o.payment_method,
      o.payment_status,
      o.total_amount
    ]);
    exportToCSV('Bombay_Chowpati_Orders_Sheet', headers, rows);
  };

  const handleSendWhatsAppUpdate = (order) => {
    if (!order.customer_phone) {
      addToast('Customer phone number not available for this order', 'warning');
      return;
    }
    const cleanPhone = order.customer_phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${order.customer_name || 'Valued Customer'}! Update on your Bombay Chowpati Order #${order.order_number || order.id}:\nStatus: *${order.status.toUpperCase()}*\nTotal: ₹${order.total_amount}. Thank you!`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
  };

  // Reset to page 1 when search or filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, payFilter]);

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header with Create Order Button & Export Sheet */}
      <PageHeader 
        title={user?.role === 'staff' ? "Today's Orders" : "Orders & Invoices"}
        description={user?.role === 'staff' ? "Order entries recorded today for Bombay Chowpati." : "Comprehensive log of all orders placed, with sheet exports and WhatsApp notifications."}
        icon={FileText}
      >
        <button
          onClick={handleExportSheet}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#F8A324]" />
          <span>Export Sheet (CSV)</span>
        </button>

        <button
          onClick={handleOpenCreateModal}
          className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Order</span>
        </button>
      </PageHeader>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Total Tickets</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{orders.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Served Orders</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {orders.filter(o => o.status === 'served').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-[#691F1A] flex items-center justify-center font-bold shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Total Revenue</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5 truncate">
              ₹{orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(0)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Avg Ticket</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5 truncate">
              ₹{orders.length > 0 ? (orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) / orders.length).toFixed(0) : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Single Unified Edge-to-Edge Table Panel Card Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {/* Search & Filters Header with Padding */}
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket #, table, or customer name..."
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#F8A324] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="received">Received</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={payFilter}
                onChange={(e) => setPayFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#F8A324] cursor-pointer"
              >
                <option value="ALL">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit list edge-to-edge table */}
        {filteredOrders.length === 0 ? (
          <p className="text-gray-400 text-xs py-16 text-center">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 text-center">Ticket #</th>
                  <th className="py-3.5 px-4 sm:px-6">Table / Customer</th>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Payment</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Total</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                {filteredOrders
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                    <td className="py-4 px-4 sm:px-6 text-center font-bold text-gray-900">#{order.id}</td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-gray-900">{order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</div>
                      {order.customer_name && <div className="text-[10px] text-gray-500 font-normal">👤 {order.customer_name}</div>}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-xs text-gray-400 font-light">
                      {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                         order.status === 'served' ? 'bg-emerald-50 text-emerald-700' : 
                         order.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                       }`}>
                         {order.status}
                       </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.payment_status} ({order.payment_method})
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right font-bold text-[#691F1A]">
                      {restaurantConfig.currency}{parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-[#691F1A]/10 hover:text-[#691F1A] rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintBill(order)}
                          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gold-500/20 hover:text-gold-700 rounded-lg transition-colors cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {order.customer_phone && (
                          <button
                            onClick={() => handleSendWhatsAppBill(order)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            title="Send WhatsApp Bill"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
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

      {/* Admin Create Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col slide-up max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="font-serif font-bold text-xl text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-gold-500" />
                  Create New Order (Admin)
                </h3>
                <span className="text-xs text-gray-400">Place walk-in or phone order with real-time stock awareness</span>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split into Menu Picker (Left) and Order Details/Cart (Right) */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left Column: Menu Catalog Picker */}
              <div className="flex-1 p-5 border-r border-gray-100 flex flex-col overflow-hidden">
                {/* Search & Category Filter */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                    <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search menu..."
                      className="w-full bg-transparent text-xs focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <select
                    value={menuCatFilter}
                    onChange={(e) => setMenuCatFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Dish Grid */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[450px]">
                  {filteredMenuItems.length === 0 ? (
                    <p className="text-gray-400 text-xs py-8 text-center">No menu dishes found.</p>
                  ) : (
                    filteredMenuItems.map(item => {
                      const inCart = cart.find(c => c.item_id === item.id);
                      const isOutOfStock = (item.stock_quantity || 0) <= 0;

                      return (
                        <div key={item.id} className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/60 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-gray-900 truncate flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {item.name}
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium">
                                {restaurantConfig.currency}{parseFloat(item.price).toFixed(2)} • <span className={isOutOfStock ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                                  {isOutOfStock ? 'Out of stock' : `Stock: ${item.stock_quantity || 50}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 ${
                              isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                              inCart ? 'bg-gold-500 text-white' : 'bg-gray-900 hover:bg-black text-white'
                            }`}
                          >
                            {inCart ? `Added (${inCart.quantity})` : 'Add +'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Order Setup & Cart Summary */}
              <form onSubmit={handleCreateOrderSubmit} className="w-full lg:w-96 p-5 flex flex-col bg-gray-50/50 overflow-y-auto">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-gold-600" /> Order Details
                </h4>

                {/* Table Selection */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Select Dining Table / Service</label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="">-- Takeaway / Custom Location --</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>
                          Table {t.table_number} ({t.capacity} seats - {t.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedTableId && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Custom Location / Table Override</label>
                      <input
                        type="text"
                        value={customTableNumber}
                        onChange={(e) => setCustomTableNumber(e.target.value)}
                        placeholder="e.g. Counter, Takeaway, Parcel 1"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Customer Selection */}
                <div className="space-y-3 mb-4 border-t border-gray-200/60 pt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Customer Account</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="">-- Guest / Walk-in Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</option>
                      ))}
                    </select>
                  </div>

                  {!selectedCustomerId && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Guest Name"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 space-y-2 mb-4 border-t border-gray-200/60 pt-3">
                  <div className="text-[11px] font-bold text-gray-600 mb-2">Selected Items ({cart.length})</div>
                  {cart.length === 0 ? (
                    <p className="text-gray-400 text-xs py-4 text-center">No dishes added to cart yet.</p>
                  ) : (
                    cart.map(cItem => (
                      <div key={cItem.item_id} className="p-2.5 bg-white rounded-xl border border-gray-200/80 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-gray-900">{cItem.name}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(cItem.item_id, -1)}
                              className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold px-1">{cItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(cItem.item_id, 1)}
                              className="w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <input
                            type="text"
                            placeholder="Add item instruction..."
                            value={cItem.notes}
                            onChange={(e) => handleUpdateItemNotes(cItem.item_id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-[10px] flex-1 mr-2 focus:outline-none"
                          />
                          <span className="font-bold text-gray-900">
                            {restaurantConfig.currency}{(cItem.price * cItem.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Payment Options & Summary */}
                <div className="border-t border-gray-200/60 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      >
                        <option value="counter">Cash / Counter</option>
                        <option value="upi">UPI / QR</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Payment Status</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-sm text-gray-700">Total Amount</span>
                    <span className="font-serif font-bold text-xl text-gold-600">
                      {restaurantConfig.currency}{calculateCartTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer ${
                      cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gold-500 hover:bg-gold-600'
                    }`}
                  >
                    Place & Print Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-serif font-bold text-xl text-gray-900 flex items-center gap-2">
                Order #{selectedOrder.id}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">Details</div>
                  <div className="font-semibold text-sm">{selectedOrder.table_number ? `Table ${selectedOrder.table_number}` : 'Takeaway'}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</div>
                  {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      {selectedOrder.customer_name && <div className="font-semibold">👤 {selectedOrder.customer_name}</div>}
                      {selectedOrder.customer_phone && <div className="text-[10px] text-gray-400">📞 {selectedOrder.customer_phone}</div>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">Status</div>
                  <div className="font-semibold text-sm capitalize">{selectedOrder.status}</div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{selectedOrder.payment_status} ({selectedOrder.payment_method})</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-gray-400 font-bold tracking-wider uppercase border-b border-gray-100 pb-2">Items</div>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-semibold">{item.quantity}x {item.name}</div>
                      {item.notes && <div className="text-xs text-amber-600 mt-0.5">Note: {item.notes}</div>}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {restaurantConfig.currency}{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-700">Total</span>
                <span className="font-bold text-xl text-gold-600">
                  {restaurantConfig.currency}{parseFloat(selectedOrder.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs uppercase tracking-wider"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>

              {selectedOrder.customer_phone && (
                <button 
                  onClick={() => {
                    const text = encodeURIComponent(`Hello ${selectedOrder.customer_name || 'Valued Guest'}! Your Bombay Chowpati Order #${selectedOrder.id} status is: ${selectedOrder.status.toUpperCase()}. Total Amount: ${restaurantConfig.currency}${parseFloat(selectedOrder.total_amount).toFixed(2)}. Thank you!`);
                    window.open(`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}?text=${text}`, '_blank');
                  }}
                  className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs uppercase tracking-wider shadow-md"
                >
                  <WhatsAppIcon className="w-4 h-4" color="currentColor" />
                  Notify Customer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
