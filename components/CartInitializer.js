import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from './CartContext';

const CartInitializer = () => {
    const cartContext = useCart();
    console.log('Cart context:', cartContext);
    const { fetchCart } = cartContext;

    useEffect(() => {
        const fetchInitialCart = async () => {
            try {
                const uid = await AsyncStorage.getItem('uid');
                if (uid) {
                    fetchCart(uid);
                }
            } catch (error) {
                console.error('Error fetching initial cart:', error);
            }
        };

        fetchInitialCart();
    }, [fetchCart]);

    return null;
};

export default CartInitializer;
