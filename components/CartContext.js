import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCart = async (uid) => {
        setLoading(true);
        try {
            const response = await fetch(`https://matrix-server-gzqd.vercel.app/getCartProducts/${uid}`);
            const data = await response.json();
            setCart(data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

const addToCart = async (uid, product_id, product_type) => {
  try {
    const response = await fetch('https://matrix-server-gzqd.vercel.app/addToCart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, product_id, product_type }),
    });
    const responseData = await response.text(); // Log the response as text
    console.log('Response from addToCart:', responseData); // Log the response
    if (response.ok) {
      const data = JSON.parse(responseData);
      if (data.success) {
        fetchCart(uid); // Refresh the cart
      }
    } else {
      console.error('Error adding to cart:', responseData); // Log the error response
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

    const removeFromCart = async (cart_id, uid) => {
        try {
            const response = await fetch(`https://matrix-server-gzqd.vercel.app/removeFromCart/${cart_id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                fetchCart(uid); // Refresh the cart
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    };

    const subtotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.product.price || 0), 0);
    }, [cart]);

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, subtotal, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
