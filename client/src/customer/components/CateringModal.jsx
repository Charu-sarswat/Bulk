import React, { useState } from 'react';
import { X, Calendar, Users, Phone, User, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';
import { useToast } from '../../context/ToastContext';
import WhatsAppIcon from './WhatsAppIcon';

export default function CateringModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    event_date: '',
    guest_count: '50',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.event_date || !formData.guest_count) {
      addToast('Please fill in all required catering fields', 'warning');
      return;
    }

    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${apiUrl}/api/catering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        addToast('Catering inquiry submitted successfully!', 'success');
      } else {
        throw new Error('Failed to submit catering inquiry');
      }
    } catch (err) {
      console.error(err);
      addToast('Error submitting catering inquiry. Opening WhatsApp directly...', 'info');
      // Direct WhatsApp Fallback
      const waText = encodeURIComponent(
        `*Bombay Chowpati Catering Inquiry*\n\n` +
        `*Name:* ${formData.name}\n` +
        `*Phone:* ${formData.phone}\n` +
        `*Event Date:* ${formData.event_date}\n` +
        `*Guest Count:* ${formData.guest_count}\n` +
        `*Special Notes:* ${formData.message || 'N/A'}`
      );
      window.open(`https://wa.me/${restaurantConfig.whatsappNumber}?text=${waText}`, '_blank');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const waText = encodeURIComponent(
      `Hello Bombay Chowpati Team! I want to enquire about bulk catering for an upcoming event.`
    );
    window.open(`https://wa.me/${restaurantConfig.whatsappNumber}?text=${waText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1C1D24] text-white w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#dec599]/10 via-[#c5a880]/10 to-transparent">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Pure Veg Catering
            </div>
            <h3 className="text-xl font-serif font-bold text-white">Party & Catering Inquiry</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-serif font-bold text-white">Inquiry Received!</h4>
              <p className="text-gray-300 text-sm max-w-sm mx-auto">
                Thank you! Our Bombay Chowpati catering manager will call you at <span className="text-[#c5a880] font-bold">{formData.phone}</span> shortly.
              </p>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleWhatsAppDirect}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Chat on WhatsApp
                </button>
                <button
                  onClick={onClose}
                  className="px-6 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Your Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile No."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Expected Guests *</label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      required
                      min="10"
                      placeholder="No. of guests"
                      value={formData.guest_count}
                      onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Event Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Special Requirements / Menu Choices</label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <textarea
                    rows="3"
                    placeholder="Mention preferred dishes (e.g. Live Pani Puri Counter, Pav Bhaji Counter...)"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#dec599] via-[#c5a880] to-[#a3845b] text-[#14151B] font-bold py-3.5 rounded-xl shadow-lg hover:brightness-110 transition-all text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting...' : 'Submit Catering Inquiry'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppDirect}
                  className="w-full bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40 font-extrabold py-3 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4" color="currentColor" />
                  <span>Enquire Directly via WhatsApp</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
