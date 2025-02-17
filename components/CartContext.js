import React, { createContext, useState, useContext, useMemo } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

const addToCart = (item) => {
  // Check if item already exists in cart
  const existingItem = cart.find((cartItem) => cartItem.id === item.id);
  if (existingItem) {
    setCart(cart.map((cartItem) =>
      cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
    ));
  } else {
    setCart([...cart, { ...item, quantity: 1 }]);
  }
};

const subtotal = useMemo(() => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}, [cart]);

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const calculateSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart,
      calculateSubtotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
