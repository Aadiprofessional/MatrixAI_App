import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

// Time in milliseconds before we consider the cart data stale (5 minutes)
const CART_REFRESH_THRESHOLD = 5 * 60 * 1000;

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uid, setUid] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(0);

    // Get UID on mount and when it changes
    useEffect(() => {
        const getUid = async () => {
            try {
                const storedUid = await AsyncStorage.getItem('uid');
                if (storedUid) {
                    setUid(storedUid);
                }
            } catch (error) {
                console.error('Error getting UID from AsyncStorage:', error);
            }
        };
        
        getUid();
    }, []);

    // Fetch cart when uid is available and we don't have cart data
    useEffect(() => {
        if (uid && cart.length === 0) {
            fetchCart();
        }
    }, [uid]);

    const shouldRefreshCart = useCallback(() => {
        const now = Date.now();
        return lastFetchTime === 0 || (now - lastFetchTime) > CART_REFRESH_THRESHOLD;
    }, [lastFetchTime]);

    const fetchCart = useCallback(async (forceRefresh = false) => {
        if (!uid) {
            console.log('Cannot fetch cart: No UID available');
            return;
        }
        
        // Skip fetching if we've fetched recently, unless forced
        if (!forceRefresh && !shouldRefreshCart() && cart.length > 0) {
            console.log('Using cached cart data');
            return;
        }
        
        setLoading(true);
        let response = null;
        
        try {
            // Use the production server URL
            response = await fetch(`https://matrix-server.vercel.app/getCartProducts/${uid}`);
        
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
             
            }
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setCart(data);
                console.log('data', data);
                setLastFetchTime(Date.now());
            } else if (data.error) {
                console.error('Error fetching cart:', data.error);
                setCart([]);
            } else {
                console.error('Unexpected data format:', data);
                setCart([]);
            }
        } catch (error) {
            console.error('Error fetching cart:', error.message);
            
            if (response) {
                try {
                    const text = await response.text();
                    console.error('Response body:', text);
                } catch (textError) {
                    console.error('Could not read response body:', textError);
                }
            }
            
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, [uid, cart.length, shouldRefreshCart]);

    const addToCart = async (product_id, product_type) => {
        if (!uid) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'You must be logged in to add items to cart',
            });
            return;
        }
        
        console.log('Adding to cart with params:', { 
            uid, 
            product_id, 
            product_type 
        });
        
        try {
            const response = await fetch('https://matrix-server.vercel.app/addToCart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    uid, 
                    product_id, 
                    product_type 
                }),
            });
            
            const responseData = await response.json();
            console.log('Response from addToCart:', responseData);
            
            if (response.ok) {
                if (responseData.success) {
                    // Force refresh after adding to cart
                    fetchCart(true);
                    Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: 'Product added to cart',
                    });
                } else if (responseData.message) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: responseData.message,
                    });
                }
            } else {
                console.error('Error adding to cart:', responseData);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to add product to cart',
                });
            }
            
            return responseData;
        } catch (error) {
            console.error('Error adding to cart:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to add product to cart',
            });
            throw error;
        }
    };

    const removeFromCart = async (cart_id) => {
        if (!uid) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'You must be logged in to remove items from cart',
            });
            return;
        }
        
        console.log('Removing from cart:', cart_id);
        
        try {
            const response = await fetch(`https://matrix-server.vercel.app/removeFromCart/${cart_id}`, { method: 'DELETE' });
            const data = await response.json();
            
            if (data.success) {
                // Force refresh after removing from cart
                fetchCart(true);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Product removed from cart',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: data.message || 'Failed to remove product from cart',
                });
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to remove product from cart',
            });
        }
    };

    const subtotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.product?.price || 0), 0);
    }, [cart]);
    
    return (
        <CartContext.Provider value={{ 
            cart, 
            loading, 
            uid,
            addToCart, 
            removeFromCart, 
            subtotal, 
            fetchCart,
            refreshCart: () => fetchCart(true) // Force refresh alias
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
