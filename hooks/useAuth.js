import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';

export const useAuth = () => {
    const [uid, setUid] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeUser = async () => {
            try {
                // First try to get current user
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user?.id) {
                    console.log("Found authenticated user:", user.id);
                    setUid(user.id);
                    await AsyncStorage.setItem('uid', user.id);
                    return;
                }

                // Fallback to AsyncStorage
                const storedUid = await AsyncStorage.getItem('uid');
                if (storedUid) {
                    console.log("Found stored UID:", storedUid);
                    setUid(storedUid);
                }
            } catch (error) {
                console.error("Error initializing user:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("Auth state changed:", event, session?.user?.id);
                if (session?.user) {
                    setUid(session.user.id);
                    await AsyncStorage.setItem('uid', session.user.id);
                } else {
                    setUid(null);
                    await AsyncStorage.removeItem('uid');
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    return { uid, loading };
}; 