import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';  // Import AsyncStorage
import { supabase } from '../supabaseClient'; // Ensure this path is correct

const Header = ({ navigation }) => {
    const [coinCount, setCoinCount] = useState(0);
    const [uid, setUserUid] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch UID from AsyncStorage
    const fetchUidFromStorage = async () => {
        try {
            const storedUid = await AsyncStorage.getItem('uid');
            console.log("Retrieved UID:", storedUid);  // Add this log to check the retrieved UID
            if (storedUid) {
                console.log("Fetched UID from AsyncStorage:", storedUid);
                setUserUid(storedUid); // Set UID if it's found in AsyncStorage
            } else {
                console.log("UID not found in AsyncStorage.");
            }
        } catch (error) {
            console.error("Error fetching UID from AsyncStorage:", error);
        } finally {
            setLoading(false); // Set loading to false after UID is fetched
        }
    };
    

    // Fetch user coins using the UID
    const fetchCoins = async (userUid) => {
        console.log("Fetching coins for UID:", userUid); // Log UID being used to fetch coins
        const { data, error } = await supabase
            .from('users')
            .select('user_coins')
            .eq('uid', userUid)
            .single();

        if (error) {
            console.error('Error fetching coins:', error);
        } else {
            setCoinCount(data.user_coins);
        }
    };

    useEffect(() => {
        fetchUidFromStorage(); // Fetch UID when the component mounts
    }, []);

    useEffect(() => {
        if (uid) { // Only fetch coins after UID is available
            fetchCoins(uid);
        }
    }, [uid]); // Trigger this effect when the UID changes

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
