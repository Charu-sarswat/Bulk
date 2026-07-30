import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerAuthContext = createContext(null);

export const useCustomerAuth = () => {
  return useContext(CustomerAuthContext);
};

export const CustomerAuthProvider = ({ children }) => {
  const [customerUser, setCustomerUser] = useState(null);
  const [customerToken, setCustomerToken] = useState(localStorage.getItem('customer_token'));
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerToken) {
        setCustomerLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/auth/customer/me`, {
          headers: {
            'Authorization': `Bearer ${customerToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setCustomerUser(userData);
        } else {
          // Token expired or invalid
          localStorage.removeItem('customer_token');
          setCustomerToken(null);
          setCustomerUser(null);
        }
      } catch (err) {
        console.error('Error fetching current customer:', err);
        setCustomerError('Connection error');
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomer();
  }, [customerToken, apiUrl]);

  const customerLogin = async (loginId, password) => {
    setCustomerLoading(true);
    setCustomerError(null);
    try {
      const response = await fetch(`${apiUrl}/api/auth/customer/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginId, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('customer_token', data.token);
      setCustomerToken(data.token);
      setCustomerUser(data.customer);
      return true;
    } catch (err) {
      setCustomerError(err.message);
      setCustomerLoading(false);
      return false;
    }
  };

  const customerRegister = async (name, phone, email, password) => {
    setCustomerLoading(true);
    setCustomerError(null);
    try {
      const response = await fetch(`${apiUrl}/api/auth/customer/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('customer_token', data.token);
      setCustomerToken(data.token);
      setCustomerUser(data.customer);
      return true;
    } catch (err) {
      setCustomerError(err.message);
      setCustomerLoading(false);
      return false;
    }
  };

  const customerLogout = () => {
    localStorage.removeItem('customer_token');
    setCustomerToken(null);
    setCustomerUser(null);
  };

  const value = {
    customerUser,
    customerToken,
    customerLoading,
    customerError,
    customerLogin,
    customerRegister,
    customerLogout,
    apiUrl
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};
