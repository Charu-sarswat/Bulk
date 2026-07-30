import React, { useState } from 'react';
import { X, User, Phone, Mail, Lock } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';

export default function CustomerLoginModal({ isOpen, onClose }) {
  const { customerLogin, customerRegister, customerError } = useCustomerAuth();
  const { addToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      if (!name || !password || (!phone && !email)) {
        addToast('Please enter name, password, and at least email or phone number', 'warning');
        setLoading(false);
        return;
      }
      const success = await customerRegister(name, phone, email, password);
      if (success) {
        addToast(`Welcome, ${name}! Account created.`, 'success');
        onClose();
      } else {
        addToast(customerError || 'Sign up failed. Phone number might already be registered.', 'error');
      }
    } else {
      if (!loginId || !password) {
        addToast('Please fill in login ID and password', 'warning');
        setLoading(false);
        return;
      }
      const success = await customerLogin(loginId, password);
      if (success) {
        addToast('Logged in successfully!', 'success');
        onClose();
      } else {
        addToast(customerError || 'Invalid phone/email or password.', 'error');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Container */}
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl relative overflow-hidden z-10 p-6 space-y-6 animate-scaleIn border border-[#F8A324]/20">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-serif font-black text-xl text-gray-900">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs text-gray-400 mt-1.5 font-light">
              {isSignUp ? 'Join us to track and speed up orders' : 'Log in to track your past culinary journeys'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFF9EE] text-gray-500 hover:text-gray-800 flex items-center justify-center hover:bg-gray-150 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp ? (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Log In fields */
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Phone or Email</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter phone or email"
                  className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#691F1A] bg-[#FFF9EE]/30"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black py-3 rounded-xl text-xs transition-colors cursor-pointer disabled:bg-gray-200 mt-2 shadow-sm uppercase tracking-wider"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-semibold text-gray-400 hover:text-[#691F1A] transition-colors cursor-pointer"
          >
            {isSignUp ? 'Already registered? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}
