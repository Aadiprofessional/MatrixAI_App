import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import Toast from 'react-native-toast-message';

const CartContext = createContext();

export const CartProvider = ({ children, uid }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAppOpenFetchDone, setIsAppOpenFetchDone] = useState(false);
    const [isCartScreenFetchDone, setIsCartScreenFetchDone] = useState(false);

    useEffect(() => {
        if (uid && !isAppOpenFetchDone) {
            fetchCart(uid);
            setIsAppOpenFetchDone(true);
        }
    }, [uid]);

    const fetchForCartScreen = () => {
        if (uid && !isCartScreenFetchDone) {
            fetchCart(uid);
            setIsCartScreenFetchDone(true);
        }
    };


    const fetchCart = async (uid) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/getCartProducts/${uid}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setCart(data);
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
                console.error('Response status:', response.status);
                const text = await response.text();
                console.error('Response body:', text);
            }
            setCart([]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (uid, product_id, product_type) => {
        try {
            const response = await fetch('https://matrix-server.vercel.app/addToCart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, product_id, product_type }),
            });
            const responseData = await response.json(); // Parse the response as JSON
            console.log('Response from addToCart:', responseData); // Log the response
            if (response.ok) {
                if (responseData.success) {
                    fetchCart(uid); // Refresh the cart
                } else if (responseData.message) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: responseData.message,
                    });
                }
            } else {
                console.error('Error adding to cart:', responseData); // Log the error response
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to add product to cart',
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to add product to cart',
            });
        }
    };

    const removeFromCart = async (cart_id, uid) => {
        try {
            const response = await fetch(`https://matrix-server.vercel.app/removeFromCart/${cart_id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                fetchCart(uid); // Refresh the cart
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Product removed from cart',
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
        return cart.reduce((total, item) => total + (item.product.price || 0), 0);
    }, [cart]);
    
    // Remove the console log as it's not needed in production
    return (
        <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, subtotal, fetchCart, fetchForCartScreen }}>
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
