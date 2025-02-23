import React, { createContext, useState, useContext, useMemo } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

const addToCart = (item) => {
  console.log('Adding to cart:', item); // Log the item being added
  // Check if item already exists in cart
  const existingItem = cart.find((cartItem) => cartItem.id === item.id);
  if (existingItem) {
    console.log('Item already exists in cart, updating quantity'); // Log the update action
    setCart((prevCart) => {
      const updatedCart = prevCart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      );
      console.log('Updated cart:', updatedCart); // Log the updated cart
      return updatedCart;
    });
  } else {
    console.log('Item does not exist in cart, adding new item'); // Log the addition action
    setCart((prevCart) => {
      const newCart = [...prevCart, { ...item, quantity: 1 }];
      console.log('Updated cart:', newCart); // Log the updated cart
      return newCart;
    });
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
