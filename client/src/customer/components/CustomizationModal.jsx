import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';

export default function CustomizationModal({ isOpen = true, item, menuItems = [], onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Carousel & Lightbox states
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    if (item && item.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setQuantity(1);
    setNotes('');
    setSelectedAddons([]);
  }, [item]);

  if (!isOpen || !item) return null;

  // Resolve combo items if this is a combo
  const resolvedComboItems = (item?.is_combo && item?.combo_items && Array.isArray(menuItems))
    ? item.combo_items.map(id => menuItems.find(mi => mi.id === id)).filter(Boolean)
    : [];

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // Price Calculation
  let upgradePrice = 0;
  if (selectedVariant) {
    upgradePrice += parseFloat(selectedVariant.price) || 0;
  }
  selectedAddons.forEach(add => {
    upgradePrice += parseFloat(add.price) || 0;
  });
  const unitPrice = (parseFloat(item?.price) || 0) + upgradePrice;

  const handleAdd = () => {
    let finalNotes = notes.trim();
    let labelParts = [];
    if (selectedVariant) {
      labelParts.push(`Flavour: ${selectedVariant.name}`);
    }
    if (selectedAddons.length > 0) {
      labelParts.push(`Extras: ${selectedAddons.map(a => a.name).join(', ')}`);
    }
    
    if (labelParts.length > 0) {
      const labelStr = `[${labelParts.join(' | ')}]`;
      finalNotes = finalNotes ? `${finalNotes} ${labelStr}` : labelStr;
    }

    const customizedItem = {
      ...item,
      price: unitPrice
    };

    onAddToCart(customizedItem, quantity, finalNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Background backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl relative overflow-hidden z-10 max-h-[90vh] flex flex-col sm:flex-row slide-up sm:animate-none">
        
        {/* Header Photo Carousel */}
        {(() => {
          const images = item.image_urls && item.image_urls.length > 0 
            ? item.image_urls 
            : (item.image_url ? [item.image_url] : []);
            
          if (images.length > 0) {
            return (
              <div className="w-full sm:w-1/2 aspect-video sm:aspect-square relative overflow-hidden shrink-0 bg-gray-100 group">
                <img 
                  src={images[activeImgIndex]} 
                  alt={item.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => {
                    setLightboxIndex(activeImgIndex);
                    setIsLightboxOpen(true);
                  }}
                />
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70 transition-all cursor-pointer shadow-sm active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setActiveImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70 transition-all cursor-pointer shadow-sm active:scale-90"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImgIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            activeImgIndex === idx ? 'bg-gold-500 w-4' : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-md z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            );
          } else {
            return (
              <div className="p-4 flex justify-between items-center border-b border-gray-100 shrink-0 w-full sm:w-1/2">
                <h3 className="font-serif font-bold text-lg text-gray-900">Customize Item</h3>
                <button 
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            );
          }
        })()}

        {/* Right Side: Form / Details body & Footer actions */}
        <div className="flex-1 flex flex-col min-w-0 max-h-[60vh] sm:max-h-[90vh] bg-white">
          {/* Form / Details body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="flex items-start gap-2">
                  <span className={`w-3.5 h-3.5 mt-1 rounded flex items-center justify-center border ${item.is_veg ? 'border-emerald-600' : 'border-red-600'} shrink-0`} title={item.is_veg ? 'Veg' : 'Non-veg'}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                  </span>
                  <h3 className="font-serif font-black text-xl text-gray-900 leading-tight">{item.name}</h3>
                </div>
                <span className="text-lg font-black text-[#691F1A] shrink-0">{restaurantConfig.currency}{unitPrice.toFixed(0)}</span>
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                {item.description || 'Delicately prepared with fresh ingredients.'}
              </p>

              {/* Combo Package Components List */}
              {item.is_combo && resolvedComboItems.length > 0 && (
                <div className="bg-[#FFF9EE] border border-dashed border-[#F8A324]/50 p-4 rounded-xl space-y-2 mt-3.5">
                  <span className="text-[10px] uppercase font-black text-[#691F1A] tracking-wider block">Combo Package Includes:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {resolvedComboItems.map(comboItem => (
                      <div key={comboItem.id} className="flex items-center gap-2 font-semibold text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F8A324] shrink-0" />
                        <span>{comboItem.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants/Flavors Selection */}
              {item.variants && item.variants.length > 0 && (
                <div className="border-t border-gray-100 pt-4 space-y-2.5 mt-4">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block">Choose Variant / Flavor</span>
                  <div className="grid grid-cols-2 gap-2">
                    {item.variants.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedVariant?.name === v.name
                            ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-black'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{v.name}</div>
                        {v.price > 0 && (
                          <div className="text-[9px] text-[#691F1A]/80 font-black mt-0.5">
                            +{restaurantConfig.currency}{parseFloat(v.price).toFixed(0)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Checklist Selection */}
              {item.addons && item.addons.length > 0 && (
                <div className="border-t border-gray-100 pt-4 space-y-2.5 mt-4">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block">Add Extras / Add-ons</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.addons.map((a, idx) => {
                      const isChecked = selectedAddons.some(add => add.name === a.name);
                      return (
                        <label
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-black'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedAddons(prev => prev.filter(add => add.name !== a.name));
                                } else {
                                  setSelectedAddons(prev => [...prev, a]);
                                }
                              }}
                              className="w-4 h-4 text-[#691F1A] focus:ring-[#691F1A] border-gray-300 rounded"
                            />
                            <span>{a.name}</span>
                          </div>
                          {a.price > 0 && (
                            <span className="text-[10px] text-[#691F1A] font-black">
                              +{restaurantConfig.currency}{parseFloat(a.price).toFixed(0)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cooking Instructions */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Special Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., No sauce, extra spicy, allergies, dressings on the side..."
                rows="2"
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#691F1A]/10 focus:border-[#691F1A] transition-colors resize-none placeholder:text-gray-400 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 shrink-0">
            {/* Quantity selector */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-1 h-12">
              <button
                onClick={handleDecrement}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-gray-800 text-sm">{quantity}</span>
              <button
                onClick={handleIncrement}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add action */}
            <button
              onClick={handleAdd}
              className="flex-1 bg-[#691F1A] hover:bg-[#551915] active:scale-[0.99] text-[#F8A324] font-black h-12 px-5 rounded-xl transition-all duration-200 flex justify-between items-center shadow-lg shadow-black/10 cursor-pointer text-xs sm:text-sm whitespace-nowrap min-w-0"
            >
              <span className="truncate mr-2 uppercase tracking-wider">Add to Cart</span>
              <span>{restaurantConfig.currency}{(unitPrice * quantity).toFixed(0)}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Full Screen Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-55 bg-black/95 flex flex-col justify-between p-4 animate-fadeIn">
          <div className="flex justify-between items-center text-white py-2 shrink-0">
            <span className="text-xs font-bold tracking-wider">
              {lightboxIndex + 1} / {(item.image_urls && item.image_urls.length > 0 ? item.image_urls : [item.image_url]).length}
            </span>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
            {(item.image_urls && item.image_urls.length > 1) && (
              <button 
                onClick={() => setLightboxIndex(prev => (prev === 0 ? item.image_urls.length - 1 : prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            <img 
              src={(item.image_urls && item.image_urls.length > 0 ? item.image_urls : [item.image_url])[lightboxIndex]} 
              alt={`${item.name} Fullscreen`} 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            
            {(item.image_urls && item.image_urls.length > 1) && (
              <button 
                onClick={() => setLightboxIndex(prev => (prev === item.image_urls.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          <div className="text-center text-white/85 py-4 shrink-0 font-serif text-sm font-semibold tracking-wider">
            {item.name}
          </div>
        </div>
      )}
    </div>
  );
}
