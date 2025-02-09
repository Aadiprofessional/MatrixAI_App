import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { supabase } from '../supabaseClient';

const Header = ({ navigation }) => {
    const [coinCount, setCoinCount] = useState(0);
    const [uid, setUserUid] = useState(null);
    const [loading, setLoading] = useState(true); // Add a loading state

    useEffect(() => {
        // Fetch session on mount
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log("User UID from session:", session.user.id);
                setUserUid(session.user.id); // Set UID if user is authenticated
            } else {
                console.log("No user session found.");
            }
            setLoading(false); // Set loading to false after session is checked
        };

        fetchSession(); // Call to fetch session on component mount

        // Listen for changes in authentication state
        const authListener = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth state change:", event, session);
            if (session?.user) {
                console.log("User UID from auth listener:", session.user.id);
                setUserUid(session.user.id); // Set UID once session is available
            } else {
                console.log("No user in auth listener.");
                setUserUid(null); // Handle case where user is not logged in
            }
        });

        // Clean up the listener when the component is unmounted
        return () => {
            authListener?.data?.unsubscribe?.(); // Attempt to unsubscribe safely if possible
        };
    }, []);

    useEffect(() => {
        if (uid) {  // Only run if UID is set
            const fetchInitialCoins = async () => {
                console.log("Fetching coins for UID:", uid); // Log UID being used to fetch coins
                const { data, error } = await supabase
                    .from('users')
                    .select('user_coins')
                    .eq('uid', uid)
                    .single();

                if (error) {
                    console.error('Error fetching initial coins:', error);
                } else {
                    setCoinCount(data.user_coins);
                }
            };
            fetchInitialCoins();

            // Realtime subscription to listen for changes in user_coins
            const subscription = supabase
                .channel('public:users') // Use schema:table format
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                    },
                    (payload) => {
                        console.log('Change received:', payload);

                        if (payload.new.uid === uid) { // Filter the specific user
                            setCoinCount(payload.new.user_coins);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [uid]);

    if (loading) {
        return <Text>Loading...</Text>; // Render loading state while checking session
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
