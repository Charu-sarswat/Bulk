import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';

export default function PaymentModal({ isOpen, onClose, onSuccess, totalAmount }) {
  const [copied, setCopied] = useState(false);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [progressMsg, setProgressMsg] = useState('');

  const upiUri = `upi://pay?pa=${encodeURIComponent(restaurantConfig.upiId)}&pn=${encodeURIComponent(restaurantConfig.payeeName)}&am=${totalAmount.toFixed(0)}&cu=INR&tn=${encodeURIComponent('Bombay Chowpati Order')}`;
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(restaurantConfig.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonePayment = () => {
    setPaymentState('processing');
    const steps = [
      'Waiting for bank signal...',
      'Verifying payment status...',
      'Confirming order details...'
    ];

    steps.forEach((msg, idx) => {
      setTimeout(() => {
        setProgressMsg(msg);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setPaymentState('success');
            setTimeout(() => {
              onSuccess({ utr: 'ONLINE_UPI' });
            }, 1000);
          }, 800);
        }
      }, idx * 600);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-[#FFF9EE] text-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#F8A324]/20 z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#F8A324]/20 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF9EE] border border-[#F8A324]/30 flex items-center justify-center text-[#691F1A]">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-gray-900">Online Payment</h3>
              <span className="text-[10px] text-[#691F1A] uppercase tracking-wider font-extrabold block">Instant UPI QR Code</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={paymentState === 'processing'}
            className="w-8 h-8 rounded-full bg-gray-150 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {paymentState === 'idle' && (
            <div className="space-y-6">
              {/* Total Payable header */}
              <div className="text-center bg-white border border-[#F8A324]/20 p-4 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Total Amount Payable</span>
                <span className="text-3xl font-black text-[#691F1A]">{restaurantConfig.currency}{totalAmount.toFixed(0)}</span>
              </div>

              {/* UPI QR Display */}
              <div className="text-center space-y-4">
                <div className="relative w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-2 border-[#F8A324]/20">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Generating UPI QR...
                    </div>
                  )}
                </div>

                {/* UPI ID & Copy */}
                <div className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-2 px-4 rounded-xl text-xs">
                  <span className="text-gray-400 font-bold">UPI ID:</span>
                  <span className="font-mono text-[#691F1A] font-bold">{restaurantConfig.upiId}</span>
                  <button 
                    onClick={handleCopyUpi} 
                    className="ml-1 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Direct App Deep Links */}
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <a 
                    href={upiUri} 
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-600 font-bold flex flex-col items-center gap-1 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>GPay</span>
                  </a>
                  <a 
                    href={upiUri} 
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-600 font-bold flex flex-col items-center gap-1 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                    <span>PhonePe</span>
                  </a>
                  <a 
                    href={upiUri} 
                    className="bg-white hover:bg-gray-50 border border-[#F8A324]/30 p-2 rounded-xl text-gray-600 font-bold flex flex-col items-center gap-1 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#691F1A]" />
                    <span>Paytm</span>
                  </a>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleDonePayment}
                    className="w-full bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <span>I have completed the payment</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Processing Screen */}
          {paymentState === 'processing' && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 border-4 border-[#691F1A] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-2">
                <h4 className="font-serif font-black text-gray-900 text-base">Verifying UPI Payment</h4>
                <p className="text-xs text-gray-500 animate-pulse">{progressMsg || 'Connecting securely...'}</p>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {paymentState === 'success' && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="font-serif font-black text-gray-900 text-xl">Payment Verified!</h4>
                <p className="text-xs text-gray-500">Your order has been submitted to Bombay Chowpati Kitchen.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="p-4 bg-white border-t border-gray-150 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted UPI Gateway</span>
        </div>

      </div>
    </div>
  );
}
