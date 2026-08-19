import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from './ToastContext';

const CustomerUIContext = createContext(null);

export const useCustomerUI = () => {
  return useContext(CustomerUIContext);
};

export const CustomerUIProvider = ({ children }) => {
  const { addToast } = useToast();
  
  // Cart & Drawers State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Cart Functions
  const addToCart = (item, quantity = 1, selectedVariant = null, selectedAddons = [], customNotes = '') => {
    let finalPrice = parseFloat(item.price);
    if (selectedVariant) finalPrice += parseFloat(selectedVariant.price || 0);
    if (selectedAddons && selectedAddons.length > 0) {
      selectedAddons.forEach(a => { finalPrice += parseFloat(a.price || 0); });
    }

    const noteParts = [];
    if (selectedVariant) noteParts.push(`Variant: ${selectedVariant.name}`);
    if (selectedAddons && selectedAddons.length > 0) {
      noteParts.push(`Addons: ${selectedAddons.map(a => a.name).join(', ')}`);
    }
    if (customNotes) noteParts.push(customNotes);

    const fullNotes = noteParts.join(' | ');

    // Enforce that cart belongs to only one restaurant at a time
    if (cart.length > 0) {
      const activeRestaurantId = cart[0].restaurantId;
      if (activeRestaurantId && item.restaurantId && activeRestaurantId !== item.restaurantId) {
        const confirmSwitch = window.confirm("Your cart contains items from another restaurant. Clear your cart and continue?");
        if (confirmSwitch) {
          // Clear cart synchronously by passing updater function or emptying array directly
          setCart([]);
        } else {
          return;
        }
      }
    }

    setCart(prev => {
      // If cleared, prev is empty
      const currentCart = prev.length > 0 && prev[0].restaurantId !== item.restaurantId ? [] : prev;
      const existingIndex = currentCart.findIndex(c => c.menu_item_id === item.id && c.notes === fullNotes);
      if (existingIndex > -1) {
        const updated = [...currentCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...currentCart, {
        menu_item_id: item.id,
        id: item.id,
        name: item.name,
        price: finalPrice,
        quantity,
        notes: fullNotes,
        image_url: item.image_url,
        restaurantId: item.restaurantId
      }];
    });

    addToast(`Added "${item.name}" to cart!`, 'success');
  };

  const updateCartQuantity = (menuItemId, notes, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(c => !(c.menu_item_id === menuItemId && c.notes === notes)));
    } else {
      setCart(prev => prev.map(c => 
        c.menu_item_id === menuItemId && c.notes === notes 
          ? { ...c, quantity: newQuantity } 
          : c
      ));
    }
  };

  const removeFromCart = (menuItemId, notes) => {
    setCart(prev => prev.filter(c => !(c.menu_item_id === menuItemId && c.notes === notes)));
  };

  const clearCart = () => setCart([]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    tableInfo,
    setTableInfo,
    lastOrderId,
    setLastOrderId,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartItemCount,
    apiUrl
  };

  return (
    <CustomerUIContext.Provider value={value}>
      {children}
    </CustomerUIContext.Provider>
  );
};
