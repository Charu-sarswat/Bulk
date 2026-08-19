import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';

// Brand Logo
const logoFull = '/log.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('Please enter both username and password', 'warning');
      return;
    }

    setLoading(true);
    const loggedInUser = await login(username, password);
    setLoading(false);

    if (loggedInUser) {
      addToast('Welcome to Bombay Chowpati Control Panel!', 'success');
      if (loggedInUser.role === 'super_admin') {
        navigate('/superadmin/dashboard');
      } else if (loggedInUser.role === 'staff' || loggedInUser.role === 'kitchen') {
        navigate('/admin/live-orders');
      } else {
        navigate('/admin');
      }
    } else {
      addToast('Authentication failed. Check credentials.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-md animate-fade-in z-10">
        
        {/* Official Brand Logo Banner */}
        <div className="text-center mb-6 space-y-3">
          <img 
            src={logoFull} 
            alt="Bombay Chowpati Chat Bhandar" 
            className="h-28 w-auto mx-auto object-contain drop-shadow-md"
          />
          <div className="inline-flex items-center gap-1.5 bg-[#F8A324]/20 border border-[#F8A324]/40 px-3 py-1 rounded-full text-[10px] font-extrabold text-[#F8A324] uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Control & Staff Portal
          </div>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl shadow-xl border border-gray-200 bg-white">
          <h2 className="text-lg font-serif font-black text-black mb-6">System Authentication</h2>

          {authError && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-widest block mb-2">
                Username
              </label>
              <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#F8A324]/50 focus-within:border-[#F8A324] transition-all">
                <User className="w-4.5 h-4.5 text-[#F8A324] mr-3 shrink-0" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / staff / kitchen"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  className="w-full bg-transparent text-sm text-black focus:outline-none placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-widest block mb-2">
                Password
              </label>
              <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#F8A324]/50 focus-within:border-[#F8A324] transition-all">
                <Lock className="w-4.5 h-4.5 text-[#F8A324] mr-3 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  className="w-full bg-transparent text-sm text-black focus:outline-none placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F8A324] via-[#FFB74D] to-[#F8A324] hover:brightness-110 disabled:opacity-50 text-[#83560E] font-black py-4 rounded-2xl shadow-xl shadow-[#F8A324]/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#83560E] border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
