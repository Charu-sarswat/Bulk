import React, { useState, useEffect } from 'react';
import { useSEO } from '../../hooks/useSEO';
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
  AlertCircle,
  QrCode,
  Copy,
  Check,
  X,
  ShieldCheck,
  IndianRupee,
  RefreshCw,
  Info,
  Sparkles,
  Lock,
  Utensils,
  CheckCircle2
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';
import { restaurantConfig } from '../../config/restaurant';
import { useRestaurant } from '../../context/RestaurantContext';
import Footer from '../components/Footer';

export default function Account() {
  useSEO({
    title: 'My Account - Order History & Profile',
    description: 'Manage your Bombay Chowpati account. View past orders, update your profile and track your order history.',
    canonical: 'https://bombaychowpati.com/account',
  });
  const { customerUser, customerToken, customerLogout, customerLogin, customerRegister, customerLoading } = useCustomerAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { restaurant: activeRestaurant } = useRestaurant();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet_subs'); // 'wallet_subs' or 'orders'

  // Student wallet & subscriptions states
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [subTransactions, setSubTransactions] = useState([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Manual UPI Top-up Modal & Requests states
  const [topupRequests, setTopupRequests] = useState([]);
  const [loadingTopupRequests, setLoadingTopupRequests] = useState(false);
  // Manual UPI Modal States (for Wallet Top-up)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [customerNoteInput, setCustomerNoteInput] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Platform Subscription Purchase States (Direct to Super Admin)
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSubPlan, setSelectedSubPlan] = useState(null);
  const [platformUpi, setPlatformUpi] = useState(null);
  const [subUtrInput, setSubUtrInput] = useState('');
  const [subDateInput, setSubDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [submittingSubPurchase, setSubmittingSubPurchase] = useState(false);
  const [subPurchaseMethod, setSubPurchaseMethod] = useState('UPI'); // 'UPI' | 'WALLET'
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);

  // Plans browsing & purchase states
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState(null);
  
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

  const fetchWalletAndSubs = async () => {
    setLoadingWallet(true);
    setLoadingSubs(true);
    try {
      const walletRes = await fetch(`${apiUrl}/api/student/wallet`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (walletRes.ok) {
        const wData = await walletRes.json();
        setWallet(wData);
      }

      const activeRes = await fetch(`${apiUrl}/api/student/subscriptions/active`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (activeRes.ok) {
        const aData = await activeRes.json();
        setActiveSubscriptions(aData);
      }

      const usagesRes = await fetch(`${apiUrl}/api/student/subscriptions/usages`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (usagesRes.ok) {
        const uData = await usagesRes.json();
        setSubTransactions(uData);
      }

      const subReqRes = await fetch(`${apiUrl}/api/student/subscriptions/my-requests`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (subReqRes.ok) {
        const srData = await subReqRes.json();
        setSubscriptionRequests(srData);
      }

      const plansRes = await fetch(`${apiUrl}/api/student/plans`);
      if (plansRes.ok) {
        const pData = await plansRes.json();
        setAvailablePlans(pData);
      }

      const upiRes = await fetch(`${apiUrl}/api/student/platform-upi`);
      if (upiRes.ok) {
        const upiData = await upiRes.json();
        setPlatformUpi(upiData);
      }
    } catch (err) {
      console.error('Error fetching wallet/subs:', err);
    } finally {
      setLoadingWallet(false);
      setLoadingSubs(false);
    }
  };

  const fetchTopupRequests = async () => {
    if (!customerToken) return;
    setLoadingTopupRequests(true);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/my-requests`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopupRequests(data);
      }
    } catch (err) {
      console.error('Error fetching topup requests:', err);
    } finally {
      setLoadingTopupRequests(false);
    }
  };

  // Fetch Order History and Wallet/Subs data
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
    fetchWalletAndSubs();
    fetchTopupRequests();

    const handleSubUpdate = () => {
      fetchWalletAndSubs();
    };
    window.addEventListener('subscription_updated', handleSubUpdate);
    window.addEventListener('focus', handleSubUpdate);

    return () => {
      window.removeEventListener('subscription_updated', handleSubUpdate);
      window.removeEventListener('focus', handleSubUpdate);
    };
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

  // Step 1: Open Manual UPI Payment Modal
  const handleInitiateTopup = async (e) => {
    e.preventDefault();
    if (!topupAmount || isNaN(topupAmount) || parseFloat(topupAmount) <= 0) {
      addToast('Please enter a valid amount to top up.', 'warning');
      return;
    }

    if (!activeRestaurant?.id) {
      addToast('Please select a mess/restaurant first to load their specific UPI payment QR.', 'warning');
      return;
    }

    setLoadingPaymentSettings(true);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/payment-settings?restaurantId=${activeRestaurant.id}`);
      if (res.ok) {
        const pData = await res.json();
        setPaymentSettings(pData);
        setUtrInput('');
        setPaymentDateInput(new Date().toISOString().split('T')[0]);
        setCustomerNoteInput('');
        setShowPaymentModal(true);
      } else {
        addToast('Could not load payment settings for this mess.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading payment configuration.', 'error');
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  // Step 2: Submit UTR & Payment Proof for Admin Verification
  const handleSubmitPaymentProof = async (e) => {
    e.preventDefault();
    if (!utrInput.trim()) {
      addToast('Please enter your UTR / Transaction reference number.', 'warning');
      return;
    }
    if (!paymentDateInput) {
      addToast('Please select the payment date.', 'warning');
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await fetch(`${apiUrl}/api/wallet-topups/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          restaurantId: activeRestaurant.id,
          amount: parseFloat(topupAmount),
          utrNumber: utrInput.trim(),
          paymentDate: paymentDateInput,
          customerNote: customerNoteInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        addToast('🎉 Payment proof submitted! Admin will verify your payment and credit your wallet.', 'success');
        setShowPaymentModal(false);
        setTopupAmount('');
        fetchTopupRequests();
      } else {
        addToast(data.message || 'Submission failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error during submission.', 'error');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleCopyUpi = (upiId) => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    addToast('UPI ID copied to clipboard!', 'info');
    setTimeout(() => setCopiedUpi(false), 2500);
  };
  const handleOpenSubModal = (plan) => {
    // Strict Check: ONLY ONE ACTIVE SUBSCRIPTION AT A TIME
    const activeSub = activeSubscriptions.find(s => {
      const rem = s.remainingBalance !== undefined ? s.remainingBalance : (s.initialBalance || 0);
      const isNotExpired = new Date(s.endDate) >= new Date();
      return s.status === 'ACTIVE' && isNotExpired && rem > 0;
    });

    if (activeSub) {
      const rem = activeSub.remainingBalance !== undefined ? activeSub.remainingBalance : (activeSub.initialBalance || 0);
      addToast(`You already have an active subscription with ₹${rem.toFixed(0)} remaining balance (valid until ${new Date(activeSub.endDate).toLocaleDateString('en-IN')}). You can buy a new subscription only when your balance reaches ₹0 or your subscription expires.`, 'warning');
      return;
    }

    const hasPending = subscriptionRequests.some(r => r.status === 'PENDING');
    if (hasPending) {
      addToast('You already have a subscription payment verification request pending with Super Admin.', 'warning');
      return;
    }

    setSelectedSubPlan(plan);
    setSubUtrInput('');
    setSubDateInput(new Date().toISOString().split('T')[0]);
    setSubPurchaseMethod(wallet.balance >= plan.price ? 'WALLET' : 'UPI');
    setShowSubModal(true);
  };

  const handleSubmitSubPurchase = async (e) => {
    e.preventDefault();
    if (!selectedSubPlan) return;

    if (subPurchaseMethod === 'UPI' && !subUtrInput.trim()) {
      addToast('Please enter the 12-digit UTR / Transaction reference ID.', 'warning');
      return;
    }

    setSubmittingSubPurchase(true);
    try {
      const res = await fetch(`${apiUrl}/api/student/subscriptions/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          planId: selectedSubPlan._id,
          paymentMethod: subPurchaseMethod === 'WALLET' ? 'WALLET' : 'UPI_MANUAL',
          utrNumber: subPurchaseMethod === 'UPI' ? subUtrInput.trim() : '',
          paymentDate: subPurchaseMethod === 'UPI' ? subDateInput : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (subPurchaseMethod === 'WALLET') {
          addToast(`🎉 "${selectedSubPlan.name}" activated! ₹${selectedSubPlan.price} deducted from wallet.`, 'success');
        } else {
          addToast('🎉 Payment proof submitted to Super Admin! Your subscription will be activated upon verification.', 'success');
        }
        setShowSubModal(false);
        fetchWalletAndSubs();
      } else {
        addToast(data.message || 'Subscription purchase failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error.', 'error');
    } finally {
      setSubmittingSubPurchase(false);
    }
  };

  const handleCancelAutoRenew = async (subId) => {
    try {
      const res = await fetch(`${apiUrl}/api/student/subscriptions/${subId}/cancel-autorenew`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (res.ok) {
        addToast('Auto-renewal cancelled successfully.', 'success');
        fetchWalletAndSubs();
      } else {
        addToast('Failed to cancel auto-renewal.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error.', 'error');
    }
  };

  const handlePurchasePlan = async (planId, planPrice, planName) => {
    if (!customerToken) {
      addToast('Please log in to purchase a subscription.', 'warning');
      return;
    }
    if (wallet.balance < planPrice) {
      addToast(`Insufficient wallet balance. Top up at least ₹${(planPrice - wallet.balance).toFixed(0)} more to purchase this plan.`, 'error');
      return;
    }
    if (!window.confirm(`Purchase "${planName}" for ₹${planPrice}? This will be deducted from your wallet.`)) return;

    setPurchasingPlanId(planId);
    try {
      const res = await fetch(`${apiUrl}/api/student/subscriptions/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`🎉 "${planName}" purchased successfully! Enjoy your meals.`, 'success');
        if (data.wallet && data.wallet.balance !== undefined) {
          setWallet(prev => ({
            ...prev,
            balance: data.wallet.balance
          }));
        }
        fetchWalletAndSubs();
      } else {
        addToast(data.message || 'Purchase failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error.', 'error');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'preparing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ready': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'out_for_delivery': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'served': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
      <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-76px)] bg-[#FFF9EE] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#691F1A] focus:bg-white font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#691F1A] focus:bg-white font-medium"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#691F1A] focus:bg-white font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#691F1A] focus:bg-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md mt-2 disabled:opacity-50"
            >
              {authSubmitting ? 'Please wait...' : isRegister ? 'Register Account' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-gray-500 hover:text-[#691F1A] font-semibold cursor-pointer"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9EE] flex flex-col justify-between">
      {/* Top Banner Header */}
      <header className="bg-[#691F1A] text-white py-8 px-4 sm:px-6 border-b border-[#F8A324]/20 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F8A324] font-serif font-black text-2xl shadow-inner">
              {customerUser.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black text-[#F8A324]">{customerUser.name}</h1>
              <div className="flex items-center gap-3 text-xs text-amber-100/70 mt-0.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customerUser.phone}</span>
                {customerUser.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customerUser.email}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5 text-[#F8A324]" />
              <span>Explore Outlets</span>
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 bg-white/10 hover:bg-rose-500/20 text-gray-300 hover:text-rose-200 rounded-xl transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Account Tabs & Dashboard */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Tab Selection */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('wallet_subs')}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'wallet_subs'
                ? 'border-[#691F1A] text-[#691F1A]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Wallet & Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-[#691F1A] text-[#691F1A]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Order History
          </button>
        </div>

        {activeTab === 'wallet_subs' ? (
          <div className="space-y-6">
            {/* Top Cards: Global Wallet & Active Platform Food Subscription */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Wallet Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F8A324]/20 flex flex-col justify-between min-h-[180px]">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Global Wallet Balance</span>
                      <span className="text-3xl font-black text-[#691F1A] block mt-1">₹{(wallet.balance || 0).toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] bg-amber-50 text-[#691F1A] border border-amber-200/60 px-2 py-0.5 rounded-lg font-bold">
                      Platform Wallet
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">
                    Use wallet for instant food checkout or platform subscription purchases.
                  </p>
                </div>
                <form onSubmit={handleInitiateTopup} className="mt-4 flex gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Topup amount (₹)"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/20 font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={loadingPaymentSettings}
                    className="px-4 py-2 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] text-xs font-black rounded-xl uppercase tracking-wider transition-colors cursor-pointer border border-[#F8A324]/20 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{loadingPaymentSettings ? 'Loading...' : 'Top Up'}</span>
                  </button>
                </form>
              </div>

              {/* Active Platform Subscription Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F8A324]/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Platform Food Subscription</h4>
                    <span className="text-[9px] text-emerald-700 font-black">VALID AT ALL RESTAURANTS</span>
                  </div>
                  {activeSubscriptions.length > 0 && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>

                {loadingSubs ? (
                  <div className="text-center py-4">
                    <div className="w-5 h-5 border-2 border-[#691F1A] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : activeSubscriptions.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">
                      No active platform food subscription. Browse the platform plans below to buy a prepaid balance pass valid at ANY outlet!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {activeSubscriptions.map((sub) => {
                      const initBal = sub.initialBalance !== undefined ? sub.initialBalance : (sub.amountPaid || 0);
                      const remBal = sub.remainingBalance !== undefined ? sub.remainingBalance : initBal;
                      const used = sub.usedAmount !== undefined ? sub.usedAmount : Math.max(0, initBal - remBal);
                      const progressPercent = initBal > 0 ? Math.min(100, Math.round((remBal / initBal) * 100)) : 0;

                      return (
                        <div key={sub._id} className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-3 shadow-2xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-serif font-black text-sm text-gray-900 block">
                                {sub.planId?.name || 'Platform Food Subscription'}
                              </span>
                              <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                                Works at ALL messes & restaurants
                              </span>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded text-[9px] font-black uppercase">
                              ACTIVE
                            </span>
                          </div>

                          {/* Prepaid Rupee Balance Card */}
                          <div className="bg-white/90 p-3 rounded-xl border border-amber-200/60 space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                                <span className="text-[9px] uppercase font-bold text-gray-400 block">Initial</span>
                                <span className="text-xs font-black text-gray-800">₹{initBal.toFixed(0)}</span>
                              </div>
                              <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                                <span className="text-[9px] uppercase font-bold text-rose-500 block">Used</span>
                                <span className="text-xs font-black text-rose-700">₹{used.toFixed(0)}</span>
                              </div>
                              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Remaining</span>
                                <span className="text-xs font-black text-emerald-700">₹{remBal.toFixed(0)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-1">
                              <div className="bg-emerald-600 h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium pt-0.5">
                            <span>Valid Until: {new Date(sub.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Platform Subscription Purchase Requests (Pending Super Admin Verification) */}
            {subscriptionRequests.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-300 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Subscription Payment Verification Requests</span>
                  </h4>
                  <button onClick={fetchWalletAndSubs} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {subscriptionRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2 ${
                        req.status === 'PENDING'
                          ? 'border-amber-200 bg-amber-50/30'
                          : req.status === 'ACTIVE'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black text-sm text-[#691F1A]">{req.planName}</span>
                          <div className="text-[11px] text-gray-600 font-bold mt-0.5">₹{req.price} • {req.durationDays} Days</div>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 font-semibold">
                            UTR / Ref: <span className="font-bold text-gray-800">{req.paymentReference || 'N/A'}</span>
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            req.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : req.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.status === 'PENDING' && (
                        <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />
                          Awaiting Super Admin payment verification. Your platform subscription will activate immediately upon verification.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Top-Up Requests (Pending Super Admin Verification) */}
            {topupRequests.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-300 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Wallet Top-Up Verification Requests</span>
                  </h4>
                  <button onClick={fetchTopupRequests} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {topupRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2 ${
                        req.status === 'PENDING'
                          ? 'border-amber-200 bg-amber-50/30'
                          : req.status === 'CONFIRMED'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[#691F1A]">₹{req.amount}</span>
                            <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded border border-gray-150">
                              Central Wallet Top-Up
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 font-semibold">
                            UTR / Ref: <span className="font-bold text-gray-800">{req.utrNumber}</span>
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            req.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : req.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                        <span>Paid: {new Date(req.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>

                      {req.status === 'REJECTED' && req.rejectionReason && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-medium flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                          <div>
                            <span className="font-bold block">Super Admin Rejection Note:</span>
                            {req.rejectionReason}
                          </div>
                        </div>
                      )}

                      {req.status === 'PENDING' && (
                        <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />
                          Awaiting Super Admin verification. Wallet will update automatically once verified.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Browse & Purchase Platform Food Subscriptions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F8A324]/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    Available Platform Subscription Plans
                  </h4>
                  <p className="text-[10px] text-gray-500">Buy once, spend at ANY restaurant on the Bombay Chowpati platform!</p>
                </div>
                <span className="text-[9px] text-[#691F1A] font-black uppercase bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Wallet: ₹{(wallet.balance || 0).toFixed(0)}
                </span>
              </div>

              {/* Active Subscription Notice Banner */}
              {(() => {
                const activeSubObj = activeSubscriptions.find(s => {
                  const rem = s.remainingBalance !== undefined ? s.remainingBalance : (s.initialBalance || 0);
                  const isNotExpired = new Date(s.endDate) >= new Date();
                  return s.status === 'ACTIVE' && isNotExpired && rem > 0;
                });

                if (!activeSubObj) return null;

                const remBal = activeSubObj.remainingBalance !== undefined ? activeSubObj.remainingBalance : (activeSubObj.initialBalance || 0);

                return (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Active pass in use: <strong>₹{remBal.toFixed(0)} remaining balance</strong> (Valid until {new Date(activeSubObj.endDate).toLocaleDateString('en-IN')}). New purchases are locked until balance reaches ₹0 or expires.
                      </span>
                    </div>
                    <span className="text-[9px] uppercase font-black text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded border border-amber-400 shrink-0">
                      1 Active Pass Limit
                    </span>
                  </div>
                );
              })()}

              {availablePlans.length === 0 ? (
                <p className="text-xs text-gray-400">No active platform subscription plans available currently.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availablePlans.map((plan) => {
                    const activeSubObj = activeSubscriptions.find(s => {
                      const rem = s.remainingBalance !== undefined ? s.remainingBalance : (s.initialBalance || 0);
                      const isNotExpired = new Date(s.endDate) >= new Date();
                      return s.status === 'ACTIVE' && isNotExpired && rem > 0;
                    });
                    const hasActivePlatformSub = !!activeSubObj;
                    const isSubscribedToThisPlan = activeSubObj && (
                      (activeSubObj.planId?._id && activeSubObj.planId._id.toString() === plan._id.toString()) ||
                      (activeSubObj.planId && activeSubObj.planId.toString() === plan._id.toString()) ||
                      (activeSubObj.planName && activeSubObj.planName === plan.name) ||
                      (activeSubObj.planId?.name && activeSubObj.planId.name === plan.name)
                    );

                    return (
                      <div
                        key={plan._id}
                        className={`relative rounded-2xl border p-5 space-y-3 transition-all ${
                          isSubscribedToThisPlan
                            ? 'border-emerald-500/40 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20'
                            : hasActivePlatformSub
                            ? 'border-gray-200 bg-gray-50/40 opacity-80'
                            : 'border-gray-200 bg-white hover:border-[#83560E]/40 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-serif font-black text-gray-900 text-sm">{plan.name}</h5>
                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{plan.description || 'Valid at all platform outlets'}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSubscribedToThisPlan ? (
                              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                                Subscribed
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                                Non-Subscribed
                              </span>
                            )}
                            <span className="text-[8px] font-black uppercase bg-amber-50 text-[#83560E] px-2 py-0.5 rounded border border-[#CCA96A]/30">
                              Platform Wide
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                            {plan.durationDays} Days Validity
                          </span>
                          <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            ₹{plan.prepaidBalance !== undefined ? plan.prepaidBalance : plan.price} Food Balance
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[9px] text-gray-400 block font-bold uppercase">Price</span>
                            <span className="text-lg font-black text-[#83560E]">₹{plan.price}</span>
                          </div>

                          {isSubscribedToThisPlan ? (
                            <button
                              disabled
                              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 cursor-default flex items-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Subscribed</span>
                            </button>
                          ) : hasActivePlatformSub ? (
                            <button
                              disabled
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                              title="You already have an active subscription for another plan. A new subscription can only be purchased once your current balance reaches ₹0 or expires."
                            >
                              Non-Subscribed
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSubModal(plan)}
                              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer bg-[#83560E] hover:bg-[#68410d] text-white border border-[#83560E]/20 shadow-xs"
                            >
                              Subscribe Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Subscription Usages Ledger (Prepaid Food Deductions across Outlets) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Platform Subscription Usages</span>
                  </h4>
                  <p className="text-[10px] text-gray-500">Record of food orders paid using your platform subscription balance.</p>
                </div>
                {subTransactions.length > 0 && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    {subTransactions.length} Orders
                  </span>
                )}
              </div>

              {subTransactions.length === 0 ? (
                <p className="text-xs text-gray-400">No food order deductions from your subscription balance yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-gray-600">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Restaurant Outlet</th>
                        <th className="py-2.5">Order #</th>
                        <th className="py-2.5 text-right">Amount Deducted</th>
                        <th className="py-2.5 text-right">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subTransactions.map((tx) => (
                        <tr key={tx._id || tx.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2.5">{new Date(tx.usedAt || tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-2.5 font-bold text-gray-900">{tx.restaurantName || 'Bombay Chowpati Outlet'}</td>
                          <td className="py-2.5 font-mono text-slate-500">#{tx.orderNumber || 'N/A'}</td>
                          <td className="py-2.5 text-right font-black text-rose-600">-₹{tx.amount}</td>
                          <td className="py-2.5 text-right font-mono text-emerald-700 font-bold">₹{tx.balanceAfter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Order History */
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
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] text-xs font-black rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Explore Messes
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
                        {order.restaurant && (
                          <span className="text-[10px] font-serif font-black text-[#691F1A] bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded uppercase tracking-wider">
                            {order.restaurant.name}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {order.order_channel === 'dine_in' ? 'Dine-In' : order.order_channel === 'delivery' ? 'Delivery' : 'Takeaway'}
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
        )}
      </main>
      {/* Manual UPI Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-gray-150 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#691F1A]">Platform Wallet Top-Up</span>
                <h3 className="font-serif font-black text-lg text-gray-900 leading-tight">
                  Add ₹{topupAmount} to Wallet
                </h3>
                <p className="text-xs text-emerald-700 font-bold">
                  Verified & Credited by Super Admin
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* UPI ID & Copy Card */}
            <div className="p-3.5 bg-[#FFF9EE] border border-[#F8A324]/30 rounded-2xl space-y-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Super Admin UPI ID (Central)</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-black text-xs sm:text-sm text-gray-900 truncate select-all">
                  {paymentSettings?.upi_id || 'superadmin@upi'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUpi(paymentSettings?.upi_id || 'superadmin@upi')}
                  className="px-3 py-1.5 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="text-center space-y-2 py-1">
              <div className="inline-block p-3 bg-white border-2 border-dashed border-[#F8A324]/60 rounded-3xl shadow-sm">
                <img
                  src={
                    paymentSettings?.upi_qr_url ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `upi://pay?pa=${paymentSettings?.upi_id || 'superadmin@upi'}&pn=${encodeURIComponent(
                        paymentSettings?.upi_name || 'Bombay Chowpati Central'
                      )}&am=${topupAmount}&cu=INR`
                    )}`
                  }
                  alt="Super Admin UPI QR"
                  className="w-44 h-44 object-contain rounded-2xl mx-auto"
                />
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Scan with Google Pay, PhonePe, Paytm or any UPI app
              </p>
            </div>

            {/* Payment Proof Form */}
            <form onSubmit={handleSubmitPaymentProof} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  12-Digit UTR / Transaction ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 324156789012 or UPI Ref No."
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white transition-all font-mono"
                />
                <span className="text-[10px] text-gray-400 block font-medium">
                  Found on your payment success screen as "UPI Ref No." or "UTR".
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDateInput}
                    onChange={(e) => setPaymentDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via PhonePe"
                    value={customerNoteInput}
                    onChange={(e) => setCustomerNoteInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProof}
                  className="flex-2 py-3 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer border border-[#F8A324]/20 disabled:opacity-50"
                >
                  {submittingProof ? 'Submitting...' : 'I Have Paid — Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Platform Subscription Purchase Modal (Direct to Super Admin) */}
      {showSubModal && selectedSubPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-gray-150 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#691F1A]">Platform Food Subscription</span>
                <h3 className="font-serif font-black text-lg text-gray-900 leading-tight">
                  {selectedSubPlan.name}
                </h3>
                <p className="text-xs text-emerald-700 font-bold">
                  Prepaid Balance: ₹{selectedSubPlan.prepaidBalance !== undefined ? selectedSubPlan.prepaidBalance : selectedSubPlan.price} • {selectedSubPlan.durationDays} Days
                </p>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubPurchaseMethod('UPI')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  subPurchaseMethod === 'UPI'
                    ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-black shadow-xs'
                    : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
                }`}
              >
                Direct UPI Payment (Super Admin)
              </button>
              <button
                type="button"
                onClick={() => setSubPurchaseMethod('WALLET')}
                disabled={wallet.balance < selectedSubPlan.price}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                  subPurchaseMethod === 'WALLET'
                    ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-black shadow-xs'
                    : wallet.balance < selectedSubPlan.price
                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700 cursor-pointer'
                }`}
              >
                Pay from Wallet (₹{(wallet.balance || 0).toFixed(0)})
              </button>
            </div>

            {subPurchaseMethod === 'UPI' ? (
              <form onSubmit={handleSubmitSubPurchase} className="space-y-4 pt-1">
                {/* Super Admin UPI ID & Copy Card */}
                <div className="p-3.5 bg-[#FFF9EE] border border-[#F8A324]/30 rounded-2xl space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Super Admin UPI ID (Platform Central)</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-xs sm:text-sm text-gray-900 truncate select-all">
                      {platformUpi?.upiId || 'superadmin@upi'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyUpi(platformUpi?.upiId || 'superadmin@upi')}
                      className="px-3 py-1.5 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="text-center space-y-2 py-1">
                  <div className="inline-block p-3 bg-white border-2 border-dashed border-[#F8A324]/60 rounded-3xl shadow-sm">
                    <img
                      src={
                        platformUpi?.qrCodeImage ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          `upi://pay?pa=${platformUpi?.upiId || 'superadmin@upi'}&pn=${encodeURIComponent(
                            platformUpi?.upiName || 'Bombay Chowpati Central'
                          )}&am=${selectedSubPlan.price}&cu=INR`
                        )}`
                      }
                      alt="Super Admin UPI QR"
                      className="w-40 h-40 object-contain rounded-2xl mx-auto"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Scan with any UPI app to pay ₹{selectedSubPlan.price}
                  </p>
                </div>

                {/* UTR Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    12-Digit UTR / Transaction ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 324156789012 or UPI Ref No."
                    value={subUtrInput}
                    onChange={(e) => setSubUtrInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white transition-all font-mono"
                  />
                  <span className="text-[10px] text-gray-400 block font-medium">
                    Found on payment success screen as "UPI Ref No." or "UTR".
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={subDateInput}
                    onChange={(e) => setSubDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#691F1A] focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSubModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSubPurchase}
                    className="flex-2 py-3 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer border border-[#F8A324]/20 disabled:opacity-50"
                  >
                    {submittingSubPurchase ? 'Submitting...' : 'Submit Payment Proof'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitSubPurchase} className="space-y-4 pt-2">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan Cost:</span>
                    <strong className="text-gray-900 font-bold">₹{selectedSubPlan.price}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Wallet:</span>
                    <strong className="text-gray-900 font-bold">₹{(wallet.balance || 0).toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-amber-200">
                    <span className="text-gray-600">Balance After Debit:</span>
                    <strong className="text-emerald-700 font-black">₹{((wallet.balance || 0) - selectedSubPlan.price).toFixed(0)}</strong>
                  </div>
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSubModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSubPurchase}
                    className="flex-2 py-3 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer border border-[#F8A324]/20 disabled:opacity-50"
                  >
                    {submittingSubPurchase ? 'Activating...' : `Pay ₹${selectedSubPlan.price} & Activate`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
