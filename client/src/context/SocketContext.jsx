import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Connecting socket to:', socketUrl);
    
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected successfully');
      setConnected(true);
      const restaurantId = localStorage.getItem('restaurantId');
      if (restaurantId) {
        socketInstance.emit('join_restaurant_room', restaurantId);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRestaurantRoom = (restaurantId) => {
    if (socket && connected) {
      socket.emit('join_restaurant_room', restaurantId);
    }
  };

  const joinOrderRoom = (orderId) => {
    if (socket && connected) {
      socket.emit('join_order_room', orderId);
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socket && connected) {
      socket.emit('leave_order_room', orderId);
    }
  };

  const value = {
    socket,
    connected,
    joinRestaurantRoom,
    joinOrderRoom,
    leaveOrderRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
