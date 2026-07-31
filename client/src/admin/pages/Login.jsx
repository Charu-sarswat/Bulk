import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';

// Brand Logo
import logoFull from '../../assets/bombay-logo-3.png';

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
      if (loggedInUser.role === 'staff' || loggedInUser.role === 'kitchen') {
        navigate('/admin/live-orders');
      } else {
        navigate('/admin');
      }
    } else {
      addToast('Authentication failed. Check credentials.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#3C110D] px-6 relative overflow-hidden font-sans">
      {/* Brand Background Glow Spheres */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#691F1A]/80 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#F8A324]/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F8A324]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in z-10">
        
        {/* Official Brand Logo Banner */}
        <div className="text-center mb-6 space-y-3">
          <img 
            src={logoFull} 
            alt="Bombay Chowpati Chat Bhandar" 
            className="h-28 w-auto mx-auto object-contain drop-shadow-2xl"
          />
          <div className="inline-flex items-center gap-1.5 bg-[#F8A324]/20 border border-[#F8A324]/40 px-3 py-1 rounded-full text-[10px] font-extrabold text-[#F8A324] uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Control & Staff Portal
          </div>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-maroon p-8 rounded-3xl shadow-2xl border border-[#F8A324]/30 bg-[#260907]/90 backdrop-blur-xl">
          <h2 className="text-lg font-serif font-black text-white mb-6">System Authentication</h2>

          {authError && (
            <div className="mb-6 bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-extrabold text-amber-200 uppercase tracking-widest block mb-2">
                Username
              </label>
              <div className="flex items-center bg-[#1A0A09] border border-[#F8A324]/30 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#F8A324]/50 focus-within:border-[#F8A324] transition-all">
                <User className="w-4.5 h-4.5 text-[#F8A324] mr-3 shrink-0" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / staff / kitchen"
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-amber-200 uppercase tracking-widest block mb-2">
                Password
              </label>
              <div className="flex items-center bg-[#1A0A09] border border-[#F8A324]/30 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#F8A324]/50 focus-within:border-[#F8A324] transition-all">
                <Lock className="w-4.5 h-4.5 text-[#F8A324] mr-3 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F8A324] via-[#FFB74D] to-[#F8A324] hover:brightness-110 disabled:opacity-50 text-[#3C110D] font-black py-4 rounded-2xl shadow-xl shadow-[#F8A324]/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#3C110D] border-t-transparent rounded-full animate-spin"></div>
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
