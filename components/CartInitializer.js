import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { useCart } from './CartContext';

const CartInitializer = () => {
    const { fetchCart } = useCart();

    useEffect(() => {
        // Initial fetch when component mounts
        fetchCart();

        // Set up app state listener to refresh cart when app comes to foreground
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                // App has come to the foreground
                fetchCart();
            }
        });

        // Clean up the subscription
        return () => {
            subscription.remove();
        };
    }, [fetchCart]);

    return null;
};

export default CartInitializer;
