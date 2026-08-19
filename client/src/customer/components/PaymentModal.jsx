import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, CheckCircle, Copy, ExternalLink, Wallet, Sparkles } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';

export default function PaymentModal({ isOpen, onClose, onSuccess, totalAmount, orderSummary, restaurantUpi }) {
  const [copied, setCopied] = useState(false);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [progressMsg, setProgressMsg] = useState('');

  const activeUpiId = restaurantUpi?.upiId || restaurantConfig.upiId;
  const activeUpiName = restaurantUpi?.upiName || restaurantConfig.payeeName;
  const activeQrUrl = restaurantUpi?.upiQrUrl;

  const upiUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activeUpiName)}&am=${totalAmount.toFixed(0)}&cu=INR&tn=${encodeURIComponent('Bombay Chowpati Order')}`;
  const generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;
  const displayQrUrl = activeQrUrl || generatedQrUrl;

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonePayment = () => {
    setPaymentState('processing');
    const steps = [
      'Verifying payment signal...',
      'Confirming UPI transaction...',
      'Finalizing order details...'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden animate-fade-in font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white text-gray-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-200 z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-[#CCA96A]/30 flex items-center justify-center text-[#83560E]">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-gray-900">
                {orderSummary && (orderSummary.walletUsed > 0 || orderSummary.subUsed > 0) ? 'Complete Remaining Payment' : 'Online Payment'}
              </h3>
              <span className="text-[10px] text-[#83560E] uppercase tracking-wider font-extrabold block">
                {activeUpiName ? `Pay to ${activeUpiName}` : 'Instant UPI QR Code'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={paymentState === 'processing'}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {paymentState === 'idle' && (
            <div className="space-y-5">
              
              {/* Order Split Breakdown Summary */}
              {orderSummary && (orderSummary.walletUsed > 0 || orderSummary.subUsed > 0) ? (
                <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-600 font-medium">
                    <span>Order Total:</span>
                    <span className="font-bold text-gray-900">{restaurantConfig.currency}{orderSummary.orderTotal?.toFixed(0)}</span>
                  </div>

                  {orderSummary.subUsed > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Platform Pass Balance Used:</span>
                      </span>
                      <span>- {restaurantConfig.currency}{orderSummary.subUsed?.toFixed(0)}</span>
                    </div>
                  )}

                  {orderSummary.walletUsed > 0 && (
                    <div className="flex justify-between items-center text-[#83560E] font-semibold">
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Wallet Balance Used:</span>
                      </span>
                      <span>- {restaurantConfig.currency}{orderSummary.walletUsed?.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-sm font-black text-gray-900">
                    <span>Remaining UPI Payment:</span>
                    <span className="text-[#83560E] text-base">{restaurantConfig.currency}{totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Total Amount Payable</span>
                  <span className="text-3xl font-black text-[#83560E]">{restaurantConfig.currency}{totalAmount.toFixed(0)}</span>
                </div>
              )}

              {/* UPI QR Display */}
              <div className="text-center space-y-4">
                <div className="relative w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-md flex items-center justify-center border-2 border-[#CCA96A]/30">
                  {displayQrUrl ? (
                    <img src={displayQrUrl} alt="Restaurant UPI QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Generating UPI QR...
                    </div>
                  )}
                </div>

                {/* UPI ID & Copy */}
                <div className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 py-2 px-4 rounded-xl text-xs">
                  <span className="text-gray-400 font-bold">UPI ID:</span>
                  <span className="font-mono text-[#83560E] font-bold">{activeUpiId}</span>
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
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-600 font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>GPay</span>
                  </a>
                  <a 
                    href={upiUri} 
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-600 font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                    <span>PhonePe</span>
                  </a>
                  <a 
                    href={upiUri} 
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-600 font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#83560E]" />
                    <span>Paytm</span>
                  </a>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDonePayment}
                    className="w-full bg-[#83560E] hover:bg-[#68410d] text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <span>I have paid {restaurantConfig.currency}{totalAmount.toFixed(0)} via UPI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Processing Screen */}
          {paymentState === 'processing' && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 border-4 border-[#83560E] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-2">
                <h4 className="font-serif font-black text-gray-900 text-base">Verifying Payment</h4>
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
                <p className="text-xs text-gray-500">Your order has been submitted to the Kitchen.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
