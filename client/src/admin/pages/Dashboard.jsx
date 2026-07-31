import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { restaurantConfig } from '../../config/restaurant';
import { 
  DollarSign, ShoppingBag, Utensils, Users, 
  TrendingUp, BarChart2, Star, RefreshCw,
  Clock, CreditCard, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Calendar, ChevronDown
} from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/admin/live-orders', { replace: true });
    }
  }, [user, navigate]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('7days'); // 'today', 'yesterday', '7days', '30days', 'all'

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const CATEGORY_COLORS = ['#d4af37', '#1b1c23', '#2563eb', '#059669', '#d97706', '#8b5cf6'];
  const PAYMENT_COLORS = {
    COUNTER: '#10b981',
    UPI: '#6366f1',
    ONLINE: '#3b82f6',
    CARD: '#f59e0b'
  };

  const fetchDashboardStats = async (selectedPeriod = period) => {
    try {
      const response = await fetch(`${apiUrl}/api/orders/reports/dashboard?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to load stats');
      const stats = await response.json();
      setData(stats);
    } catch (err) {
      console.error(err);
      addToast('Failed to load analytics dashboard data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(period);
  }, [token, period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats(period);
    addToast('Dashboard metrics refreshed', 'info');
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
  };

  if (loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  if (!data) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-gray-400 font-semibold text-sm">Could not load dashboard metrics. Please check connection.</p>
        <button onClick={handleRefresh} className="mt-4 text-xs text-gold-600 font-bold underline cursor-pointer">Retry Loading</button>
      </div>
    );
  }

  const { metrics, salesTrend, peakHours, categoryShare, paymentSplit, popularDishes } = data;

  const maxDishSold = popularDishes.length > 0 ? Math.max(...popularDishes.map(d => parseInt(d.total_sold))) : 1;

  return (
    <div className="space-y-5 sm:space-y-8 pb-12 max-w-full overflow-x-hidden">
      {/* Header and Controls */}
      <PageHeader 
        title="Analytics Overview" 
        description="Real-time performance indicators, rush hour trends & sales insights."
        icon={BarChart2}
      >
        <div className="flex items-center gap-2">
          {/* Time Period Filter Select Dropdown */}
          <div className="relative shrink-0">
            <Calendar className="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-xs font-bold pl-7 pr-7 py-1.5 sm:py-2 rounded-xl focus:outline-none shadow-xs cursor-pointer appearance-none transition-all"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">7 Days</option>
              <option value="30days">30 Days</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sync Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-1 bg-white border border-gray-200 text-gray-700 font-bold px-2.5 py-1.5 sm:py-2 rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </PageHeader>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* KPI 1: Gross Sales */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 border border-amber-100 text-[#691F1A] flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Gross Sales</span>
            <div className="text-sm sm:text-xl font-black text-gray-900 font-serif mt-0.5 truncate">{restaurantConfig.currency}{parseFloat(metrics.totalSales).toFixed(0)}</div>
            <div className="mt-0.5 flex items-center gap-0.5 text-[9px] font-semibold">
              {metrics.salesGrowth >= 0 ? (
                <span className="text-emerald-600 flex items-center font-bold">
                  <ArrowUpRight className="w-2.5 h-2.5" /> +{metrics.salesGrowth}%
                </span>
              ) : (
                <span className="text-rose-600 flex items-center font-bold">
                  <ArrowDownRight className="w-2.5 h-2.5" /> {metrics.salesGrowth}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Total Orders</span>
            <div className="text-sm sm:text-xl font-black text-gray-900 font-serif mt-0.5">{metrics.totalOrders}</div>
            <span className="text-[9px] text-gray-400 font-medium block">tickets</span>
          </div>
        </div>

        {/* KPI 3: Avg Order Value */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Avg Order</span>
            <div className="text-sm sm:text-xl font-black text-gray-900 font-serif mt-0.5 truncate">{restaurantConfig.currency}{parseFloat(metrics.avgTicket).toFixed(0)}</div>
            <span className="text-[9px] text-gray-400 font-medium block">per ticket</span>
          </div>
        </div>

        {/* KPI 4: Diners Served */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-gray-150 shadow-xs flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Patrons</span>
            <div className="text-sm sm:text-xl font-black text-gray-900 font-serif mt-0.5">{metrics.totalCustomers || 0}</div>
            <span className="text-[9px] text-gray-400 font-medium block">customers</span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sales Performance Area Graph */}
        <div className="lg:col-span-2 bg-white border border-gray-150 p-4 sm:p-6 rounded-3xl shadow-xs flex flex-col h-[260px] sm:h-[380px]">
          <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
            <div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-gold-500" />
                Sales & Revenue Performance
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Revenue trajectory for selected period</p>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-gray-100 text-gray-600 font-extrabold uppercase px-2.5 py-1 rounded-lg">
              {period === 'today' || period === 'yesterday' ? 'Hourly View' : 'Daily View'}
            </span>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            {salesTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                No revenue logs recorded for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1b1c23', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#d4af37', fontSize: 11 }}
                    formatter={(value) => [`${restaurantConfig.currency}${parseFloat(value).toFixed(0)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="sales" name="Revenue" stroke="#d4af37" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="bg-white border border-gray-150 p-4 sm:p-6 rounded-3xl shadow-xs flex flex-col h-[260px] sm:h-[380px]">
          <div className="mb-3 sm:mb-4 shrink-0">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-gray-500" />
              Category Volume Share
            </h3>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Top performing menu categories</p>
          </div>

          <div className="flex-1 w-full min-h-0 relative flex flex-col items-center justify-center">
            {categoryShare.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-10">No category sales recorded for this period.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart>
                    <Pie
                      data={categoryShare}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1b1c23', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      formatter={(val, name, item) => [`${val} units sold`, item.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[9px] sm:text-[10px] text-gray-600 font-bold uppercase shrink-0 px-1 mt-1">
                  {categoryShare.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                      <span>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Peak Dining Hours Heatmap / Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-150 p-4 sm:p-6 rounded-3xl shadow-xs flex flex-col h-[240px] sm:h-[340px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 shrink-0 gap-1">
            <div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Peak Dining Hours (Rush Hours)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Ticket volume distribution throughout operating hours</p>
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold">Lunch (12-3PM) & Dinner (7-10PM)</span>
          </div>

          <div className="flex-1 w-full min-h-0">
            {peakHours.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                No peak hour data available for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1b1c23', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#d4af37', fontSize: 11 }}
                    formatter={(val) => [`${val} orders`, 'Volume']}
                  />
                  <Bar dataKey="orders" name="Orders" fill="#2c2e3b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods Split */}
        <div className="bg-white border border-gray-150 p-4 sm:p-6 rounded-3xl shadow-xs flex flex-col h-[240px] sm:h-[340px]">
          <div className="mb-4 shrink-0">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Payment Methods Split
            </h3>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Revenue by collection channel</p>
          </div>

          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center">
            {paymentSplit.length === 0 ? (
              <p className="text-gray-400 text-xs">No payment records available.</p>
            ) : (
              <div className="w-full space-y-3.5 px-1 sm:px-2">
                {paymentSplit.map((item) => {
                  const totalPaid = paymentSplit.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
                  const pct = totalPaid > 0 ? Math.round((parseFloat(item.amount) / totalPaid) * 100) : 0;
                  const color = PAYMENT_COLORS[item.method] || '#6b7280';

                  return (
                    <div key={item.method} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {item.method === 'COUNTER' ? 'Pay at Counter' : item.method}
                        </span>
                        <div className="text-right font-bold text-gray-900">
                          {restaurantConfig.currency}{parseFloat(item.amount).toFixed(2)}
                          <span className="text-[10px] text-gray-400 font-normal ml-1">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 rounded-full" 
                          style={{ width: `${pct}%`, backgroundColor: color }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Dishes Performance Table Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Top Selling Culinary Creations
            </h3>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Ranked by volume sold in this period</p>
          </div>
        </div>
        
        {popularDishes.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-10">No items sold yet for the selected timeframe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[500px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3 px-4 text-center w-12">Rank</th>
                  <th className="py-3 px-4">Menu Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                {popularDishes.map((dish, index) => {
                  const soldCount = parseInt(dish.total_sold, 10);
                  const progressPct = Math.round((soldCount / maxDishSold) * 100);

                  return (
                    <tr key={dish.name} className="hover:bg-[#FFF9EE]/20 transition-colors">
                      <td className="py-3.5 px-4 text-center font-black text-gray-400 text-xs">#{index + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{dish.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                          {dish.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full border ${dish.is_veg ? 'bg-emerald-500 border-emerald-600' : 'bg-rose-500 border-rose-600'}`} title={dish.is_veg ? 'Vegetarian' : 'Non-Vegetarian'} />
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-gray-900">
                        <div className="flex flex-col items-center">
                          <span>{dish.total_sold} units</span>
                          <div className="w-14 sm:w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-gold-500 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-[#691F1A]">
                        {restaurantConfig.currency}{parseFloat(dish.revenue).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
