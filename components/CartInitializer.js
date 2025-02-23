import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from './CartContext';

const CartInitializer = () => {
    const { fetchCart } = useCart();

    useEffect(() => {
        const initializeCart = async () => {
            try {
                const uid = await AsyncStorage.getItem('uid');
                if (uid && !__DEV__) { // Only fetch in production mode
                    fetchCart(uid);
                }
            } catch (error) {
                console.error('Error initializing cart:', error);
            }
        };

        initializeCart();
    }, [fetchCart]);

    return null;
};

export default CartInitializer;
