import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlistItems = async (uid) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://matrix-server.vercel.app/getWishlistProducts/${uid}`
      );
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = JSON.parse(responseText);
      setWishlistItems(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId, productType) => {
    const { user } = useAuth(); // Get UID from auth context
    const uid = user?.id;
    try {
      console.log('Full wishlist add request:', {
        uid: uid || 'undefined', 
        productId: productId || 'undefined',
        productType: productType || 'undefined',
        timestamp: new Date().toISOString()
      });
      if (!uid || !productId || !productType) {
        const missing = [];
        if (!uid) missing.push('uid');
        if (!productId) missing.push('productId');
        if (!productType) missing.push('productType');
        throw new Error(`Missing required parameters: ${missing.join(', ')}`);
      }
      const response = await fetch(`https://matrix-server.vercel.app/addToWishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          product_id: productId,
          product_type: productType
        }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      const result = JSON.parse(responseText);
      if (result.success) {
        await fetchWishlistItems(uid);
      }
      return result;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, error: error.message };
    }
  };

  const removeFromWishlist = async (wishlistId) => {
    try {
      const response = await fetch(
        `https://matrix-server.vercel.app/removeFromWishlist/${wishlistId}`,
        { method: 'DELETE' }
      );
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      const result = JSON.parse(responseText);
      if (result.success) {
        setWishlistItems(prev => 
          prev.filter(item => item.wishlist_id !== wishlistId)
        );
      }
      return result;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        addToWishlist,
        removeFromWishlist,
        fetchWishlistItems
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
