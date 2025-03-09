import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useCoinsSubscription } from '../hooks/useCoinsSubscription';
import { supabase } from '../supabaseClient';

const Header = ({ navigation, uid }) => {
    console.log("Header rendering with UID:", uid);
    const coinCount = useCoinsSubscription(uid);
    const [userName, setUserName] = useState('');
    const [dpUrl, setDpUrl] = useState(null);

    useEffect(() => {
        if (uid) {
            fetchUserData();
        }
    }, [uid]);

    const fetchUserData = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('name, dp_url')
                .eq('uid', uid)
                .single();

            if (error) {
                console.error('Error fetching user data:', error);
                return;
            }

            if (data) {
                // Get first name and limit to 10 characters
                const firstName = data.name?.split(' ')[0] || '';
                setUserName(firstName.substring(0, 10));
                
                // Set profile picture URL if it exists
                if (data.dp_url) {
                    setDpUrl(data.dp_url);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (!uid) {
        console.log("No UID in Header");
        return <Text>No UID found</Text>;
    }

    console.log("Current coin count:", coinCount);

    return (
        <View style={styles.header}>
            {/* Welcome Text with Profile Picture */}
            <View style={styles.rowContainer}>
                <Image 
                    source={dpUrl ? { uri: dpUrl } : require('../assets/Avatar/Cat.png')} 
                    style={styles.icon} 
                />
                <Text style={styles.welcomeText}>
                    Welcome{userName ? ` ${userName}!`: '!'}
                </Text>
            </View>

            {/* Coin Display with Coin Icon */}
            <TouchableOpacity
                style={styles.coinContainer}
                onPress={() =>
                    navigation.navigate('TransactionScreen', { coinCount })
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
        width: 40,
        height: 40,
        marginRight: 3,
        borderWidth: 0.8,
        borderColor: '#C9C9C9',
        borderRadius: 17.5, // Make the image circular
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
        borderWidth: 1,
        borderColor: '#C9C9C9',
        borderRadius: 15,
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
