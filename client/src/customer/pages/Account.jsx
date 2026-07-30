import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  ChevronLeft, 
  LogOut, 
  Clock, 
  Receipt, 
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';
import { restaurantConfig } from '../../config/restaurant';
import Footer from '../components/Footer';

export default function Account() {
  const { customerUser, customerToken, customerLogout, customerLogin, customerRegister, customerLoading } = useCustomerAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Auth Form State (for logged out view)
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch Order History
  useEffect(() => {
    if (!customerToken) return;

    const fetchHistory = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch(`${apiUrl}/api/auth/customer/orders`, {
          headers: {
            'Authorization': `Bearer ${customerToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          addToast('Could not fetch order history.', 'error');
        }
      } catch (err) {
        console.error('Error fetching order history:', err);
        addToast('Connection error.', 'error');
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchHistory();
  }, [customerToken, apiUrl, addToast]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthSubmitting(true);
    let success = false;

    if (isRegister) {
      if (!formData.name || !formData.phone || !formData.password) {
        addToast('Please fill out all required fields.', 'warning');
        setAuthSubmitting(false);
        return;
      }
      success = await customerRegister(formData.name, formData.phone, formData.email, formData.password);
      if (success) {
        addToast('Account created successfully!', 'success');
      } else {
        addToast('Registration failed. Phone or Email might already be registered.', 'error');
      }
    } else {
      if (!formData.phone || !formData.password) {
        addToast('Please enter your phone number and password.', 'warning');
        setAuthSubmitting(false);
        return;
      }
      // customerLogin accepts phone/email as loginId
      success = await customerLogin(formData.phone, formData.password);
      if (success) {
        addToast('Logged in successfully!', 'success');
      } else {
        addToast('Invalid credentials. Please try again.', 'error');
      }
    }

    setAuthSubmitting(false);
  };

  const handleLogout = () => {
    customerLogout();
    addToast('Logged out successfully', 'info');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'preparing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf7]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium font-serif">Verifying profile...</p>
        </div>
      </div>
    );
  }

  // Not Logged In View
  if (!customerUser) {
    return (
      <div className="min-h-screen bg-[#FFF9EE] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-[64px] sm:pt-[76px]">
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl border border-[#F8A324]/20 overflow-hidden">
          <div className="p-6 bg-[#691F1A] text-white relative">
            <button 
              onClick={() => navigate(-1)} 
              className="absolute left-6 top-6 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center pt-4">
              <h2 className="text-2xl font-serif font-black text-[#F8A324] tracking-wide">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-amber-100/80 mt-1.5 font-light">
                {isRegister ? 'Join us to track orders and save history' : 'Sign in to access your orders'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="p-8 space-y-5">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30 text-sm font-semibold transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="Enter 10-digit number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30 text-sm font-semibold transition-all"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30 text-sm font-semibold transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30 text-sm font-semibold transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3.5 bg-[#691F1A] text-[#F8A324] hover:bg-[#551915] transition-colors rounded-xl font-black uppercase tracking-wider text-xs shadow-md mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {authSubmitting ? 'Processing...' : isRegister ? 'Register' : 'Login'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setFormData({ name: '', phone: '', email: '', password: '' });
                }}
                className="text-xs text-gray-500 hover:text-[#691F1A] font-semibold cursor-pointer"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Logged In View
  return (
    <div className="min-h-screen bg-[#FFF9EE] font-sans flex flex-col justify-between pt-[64px] sm:pt-[76px]">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 flex-1 w-full">
        {/* Profile Card */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#F8A324]/20 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-4.5">
            <div className="w-16 h-16 bg-[#691F1A] text-[#F8A324] rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{customerUser.name}</h2>
              <p className="text-xs text-gray-400 font-medium">Customer Account</p>
            </div>
          </div>

          <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-600 bg-[#FFF9EE]/50 p-4.5 rounded-2xl border border-[#F8A324]/20">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#691F1A]" />
              <span>{customerUser.phone}</span>
            </div>
            {customerUser.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#691F1A]" />
                <span>{customerUser.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 sm:col-span-2">
              <Calendar className="w-4 h-4 text-[#691F1A]" />
              <span>Joined {new Date(customerUser.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </section>

        {/* Order History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-150 pb-2">
            <h3 className="text-base font-serif font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#691F1A]" />
              <span>Order History</span>
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-[#FFF9EE] border border-[#F8A324]/30 px-2.5 py-0.5 rounded-full">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {loadingOrders ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-[#691F1A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-400 font-semibold">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-700 mb-1">No orders yet</h4>
              <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">Once you place order at any table or for takeaway, they will appear here.</p>
              <button 
                onClick={() => navigate('/menu')}
                className="px-5 py-2.5 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] text-xs font-black rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
              >
                Go to Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row justify-between gap-4 cursor-pointer"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        #{order.order_number || order.id}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                      </span>
                    </div>

                    {/* Order Items Summary */}
                    <div className="text-xs text-gray-600 font-semibold space-y-1 bg-[#FFF9EE]/20 p-3 rounded-xl border border-gray-100">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.name} <span className="text-gray-400 text-[10px]">x{item.quantity}</span></span>
                          <span>{restaurantConfig.currency}{parseFloat(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-between items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Total Amount</span>
                      <span className="text-base font-extrabold text-[#691F1A]">
                        {restaurantConfig.currency}{parseFloat(order.total_amount).toFixed(0)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                        order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl text-center space-y-5">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-extrabold text-lg text-gray-900 leading-tight">Confirm Log Out</h3>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed">Are you sure you want to log out of your account?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-rose-600/10"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rich Brand Footer */}
      <Footer />
    </div>
  );
}
