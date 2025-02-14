import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import { useCoinsSubscription } from '../hooks/useCoinsSubscription';
import { useAuth } from '../hooks/useAuth';
import RNRestart from 'react-native-restart';

import FeatureCardWithDetails2 from '../components/FeatureCardWithDetails copy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
    const { uid, loading } = useAuth();
    const coinCount = useCoinsSubscription(uid);

    const handleUpgradePress = () => {
        navigation.navigate('TimeScreen'); 
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        // Remove user login status from AsyncStorage
                        await AsyncStorage.multiRemove([
                            'userLoggedIn',
                            'uid',
                            // Add any other keys you want to clear
                        ]);
                        
                        // Restart the app
                        RNRestart.Restart();
                        
                        console.log('User logged out successfully');
                    } catch (error) {
                        console.error('Error logging out:', error);
                        Alert.alert(
                            'Logout Error',
                            'Something went wrong while logging out. Please try again.'
                        );
                    }
                },
            },
        ]);
    };

    const MenuItem = ({ iconName, label, onPress }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={20} color="#000" />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
    );

    // Add navigation handlers
    const handleEditProfile = () => {
        navigation.navigate('EditProfile');
    };

    const handleBookmark = () => {
        navigation.navigate('Bookmark');
    };

    const handleVoiceNote = () => {
        navigation.navigate('VoiceNote');
    };

    const handleInside = () => {
        navigation.navigate('Inside');
    };

    const handleAIShop = () => {
        navigation.navigate('FillInformationScreen');
    };

    const handleVoiceSettings = () => {
        navigation.navigate('VoiceSettings');
    };

    const handleTrash = () => {
        navigation.navigate('Trash');
    };

    const handleSettings = () => {
        navigation.navigate('Settings');
    };

    const storagePath = `users/${uid}/`;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
            <Header navigation={navigation} uid={uid} />
            
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.timeCreditsContainer}>
                    <View style={styles.timeIconContainer}>
                        <Ionicons name="time-outline" size={20} color="#fff" />
                    </View>
                    <View style={styles.timeIconContainer2}>
                        <Text style={styles.timeText}>Time Credits</Text>
                        <Text style={styles.timeValue}>14M 26S</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.buyTimeButton} onPress={handleUpgradePress}>
                    <Text style={styles.buyTimeText}>Buy time</Text>
                </TouchableOpacity>
            </View>
            <FeatureCardWithDetails2 />
            
            {/* Updated Menu Items with navigation */}
            <MenuItem 
                iconName="person-outline" 
                label="Edit profile" 
                onPress={handleEditProfile} 
            />
            <MenuItem 
                iconName="bookmark-outline" 
                label="Wishlist" 
                onPress={handleBookmark} 
            />
            <MenuItem 
                iconName="document-text-outline" 
                label="Order History" 
                onPress={handleVoiceNote} 
            />
            <MenuItem 
                iconName="bar-chart-outline" 
                label="Inside" 
                onPress={handleInside} 
            />
            <MenuItem 
                iconName="cart-outline" 
                label="Open your AI Shop" 
                onPress={handleAIShop} 
            />
            <MenuItem 
                iconName="chatbubble-outline" 
                label="Setting Voices" 
                onPress={handleVoiceSettings} 
            />
            <MenuItem 
                iconName="trash-outline" 
                label="Trash" 
                onPress={handleTrash} 
            />
            <MenuItem 
                iconName="settings-outline" 
                label="Settings" 
                onPress={handleSettings} 
            />
            <MenuItem 
                iconName="log-out-outline" 
                label="Logout" 
                onPress={handleLogout} 
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        marginTop:50,
    },
    scrollContent: {
        paddingBottom: 100, // Adjust the value as needed
    },
    
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 55,
        padding: 8,
        marginVertical: 10,
    },
    timeCreditsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 20,
        padding: 8,
        marginRight: 10,
    },
    timeIconContainer2: {
        flexDirection:'column',
        padding: 8,
        marginRight: 10,
    },
    timeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    timeValue: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
    },
    buyTimeButton: {
        backgroundColor: '#fff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 25,
    },
    buyTimeText: {
        color: '#007AFF',
        padding:10,
        fontWeight: 'bold',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    iconContainer: {
        marginRight: 15,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
});

export default ProfileScreen;
