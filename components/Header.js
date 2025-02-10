import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';  // Import AsyncStorage
import { supabase } from '../supabaseClient'; // Ensure this path is correct

const Header = ({ navigation }) => {
    const [coinCount, setCoinCount] = useState(0);
    const [uid, setUserUid] = useState(null);
    const [loading, setLoading] = useState(true);

    // Add this debug function
    const debugAuthState = async () => {
        try {
            // Check current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            console.log("Debug - Current User:", user, "Error:", userError);

            // Check current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log("Debug - Current Session:", session, "Error:", sessionError);

            // Check AsyncStorage
            const storedUid = await AsyncStorage.getItem('uid');
            console.log("Debug - Stored UID in AsyncStorage:", storedUid);

            // Check Supabase URL and Key (don't log the full key in production)
            console.log("Debug - Supabase URL:", supabase.supabaseUrl);
            console.log("Debug - Supabase Key (first 6 chars):", supabase.supabaseKey?.substring(0, 6));
        } catch (error) {
            console.error("Debug - Error checking auth state:", error);
        }
    };

    const fetchUidFromStorage = async () => {
        try {
            // First check the current auth state
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            console.log("Current auth user:", user);

            if (user?.id) {
                console.log("Found authenticated user with ID:", user.id);
                await AsyncStorage.setItem('uid', user.id);
                setUserUid(user.id);
                return;
            }

            // If no authenticated user, try AsyncStorage
            const storedUid = await AsyncStorage.getItem('uid');
            console.log("Retrieved UID from AsyncStorage:", storedUid);
            
            if (storedUid) {
                // Verify the stored UID
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('uid')
                    .eq('uid', storedUid)
                    .single();

                if (userData) {
                    console.log("Valid stored UID:", storedUid);
                    setUserUid(storedUid);
                } else {
                    console.log("Invalid stored UID - clearing");
                    await AsyncStorage.removeItem('uid');
                }
            }

        } catch (error) {
            console.error("Error in fetchUidFromStorage:", error);
        } finally {
            setLoading(false);
        }
    };

    // Improved fetchCoins function with error handling
    const fetchCoins = async (userUid) => {
        if (!userUid) {
            console.log("No UID available to fetch coins");
            return;
        }

        try {
            console.log("Fetching coins for UID:", userUid);
            const { data, error } = await supabase
                .from('users')
                .select('user_coins')
                .eq('uid', userUid)
                .single();

            if (error) {
                throw error;
            }

            if (data) {
                console.log("Coins fetched successfully:", data.user_coins);
                setCoinCount(data.user_coins);
            }
        } catch (error) {
            console.error('Error fetching coins:', error.message);
        }
    };

    const initializeAuth = async () => {
        try {
            console.log('Initializing auth...');
            
            // First check if we have a UID
            const storedUid = await AsyncStorage.getItem('uid');
            const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
            
            console.log('Stored values:', {
                uid: storedUid,
                userLoggedIn
            });

            if (!storedUid || !userLoggedIn) {
                console.log('No stored credentials found');
                setLoading(false);
                return;
            }

            // Set the UID even without a session
            setUserUid(storedUid);
            
            try {
                // Try to get/create a session if possible
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    console.log('Active session found');
                    await AsyncStorage.setItem('supabase-session', JSON.stringify(session));
                }
            } catch (sessionError) {
                console.log('Session error (non-fatal):', sessionError);
                // Continue anyway since we have the UID
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            if (mounted) {
                await initializeAuth();
            }
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.id);
                
                if (session?.user && mounted) {
                    await AsyncStorage.setItem('uid', session.user.id);
                    await AsyncStorage.setItem('supabase-session', JSON.stringify(session));
                    await AsyncStorage.setItem('userLoggedIn', 'true');
                    setUserUid(session.user.id);
                } else if (mounted) {
                    await AsyncStorage.multiRemove(['supabase-session', 'uid', 'userLoggedIn']);
                    setUserUid(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Fetch coins when UID is available
    useEffect(() => {
        if (uid) {
            fetchCoins(uid);
        }
    }, [uid]);

    if (loading) {
        return <Text>Loading...</Text>; // Render loading state while checking session
    }

    if (!uid) {
        return <Text>No UID found</Text>; // Show message if UID is not found
    }

    console.log("UID in Header:", uid); // Log UID in the component for debugging

    return (
        <View style={styles.header}>
            {/* Welcome Text with Cat Icon */}
            <View style={styles.rowContainer}>
                <Image source={require('../assets/Avatar/Cat.png')} style={styles.icon} />
                <Text style={styles.welcomeText}>Welcome Back!</Text>
            </View>

            {/* Coin Display with Coin Icon */}
            <TouchableOpacity
                style={styles.coinContainer}
                onPress={() =>
                    navigation.navigate('TransactionScreen', { coinCount }) // Pass coinCount to TransactionScreen
                }
            >
                <Image source={require('../assets/coin.png')} style={styles.coinIcon} />
                <Text style={styles.coinText}>{coinCount?.toString()}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 15,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        width: 35,
        height: 35,
        marginRight: 10, // Space between icon and text
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    coinContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderWidth: 1, // Gray stroke
        borderColor: '#C9C9C9', // Light gray color
        borderRadius: 15, // Rounded corners
    },
    coinIcon: {
        width: 20,
        height: 20,
        marginRight: 5,
    },
    coinText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6600',
    },
});

export default Header;
