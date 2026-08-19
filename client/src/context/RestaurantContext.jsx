import React, { createContext, useContext, useState, useEffect } from 'react';

const RestaurantContext = createContext();

export const useRestaurant = () => useContext(RestaurantContext);

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null); // { id, slug, name, logo }
  const [table, setTable] = useState(null); // { id, tableNumber }
  const [orderMode, setOrderMode] = useState('TAKEAWAY'); // DINE_IN, TAKEAWAY, DELIVERY

  // Load context from localStorage on startup
  useEffect(() => {
    const savedContext = localStorage.getItem('restaurantContext');
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        if (parsed.restaurant) setRestaurant(parsed.restaurant);
        if (parsed.table) setTable(parsed.table);
        if (parsed.orderMode) setOrderMode(parsed.orderMode);
      } catch (err) {
        console.error('Failed to parse saved restaurant context:', err);
      }
    }
  }, []);

  // Save context helper
  const updateRestaurantContext = (newRestaurant, newTable = null, newOrderMode = null) => {
    setRestaurant(newRestaurant);
    setTable(newTable);
    if (newOrderMode) {
      setOrderMode(newOrderMode);
    } else if (newTable) {
      setOrderMode('DINE_IN');
    }

    const contextToSave = {
      restaurant: newRestaurant,
      table: newTable,
      orderMode: newOrderMode || (newTable ? 'DINE_IN' : orderMode)
    };
    localStorage.setItem('restaurantContext', JSON.stringify(contextToSave));
    
    // Legacy support for header filters and resolver prompts
    if (newRestaurant) {
      localStorage.setItem('restaurantId', newRestaurant.id);
      localStorage.setItem('activeRestaurantName', newRestaurant.name);
      localStorage.setItem('activeRestaurantSlug', newRestaurant.slug);
    } else {
      localStorage.removeItem('restaurantId');
      localStorage.removeItem('activeRestaurantName');
      localStorage.removeItem('activeRestaurantSlug');
    }
  };

  const clearRestaurantContext = () => {
    setRestaurant(null);
    setTable(null);
    setOrderMode('TAKEAWAY');
    localStorage.removeItem('restaurantContext');
    localStorage.removeItem('restaurantId');
  };

  return (
    <RestaurantContext.Provider value={{
      restaurant,
      table,
      orderMode,
      setOrderMode,
      updateRestaurantContext,
      clearRestaurantContext
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};
