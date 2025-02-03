import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';

import FeatureCardWithDetails2 from '../components/FeatureCardWithDetails copy';

const ProfileScreen = ({ navigation }) => {

   
    
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
         
        },
      },
    ]);
  };

  const MenuItem = ({ iconName, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={20} color="#000" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-forward" size={20} color="#B0B0B0" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
    <Header navigation={navigation} />
    
    {/* Header Section */}
    <View style={styles.header}>
       <View style={styles.timeCreditsContainer}>
          <View style={styles.timeIconContainer}>
             <Icon name="time-outline" size={20} color="#fff" />
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
    
    {/* Menu Items */}
    <MenuItem iconName="person-outline" label="Edit profile" />
    <MenuItem iconName="bookmark-outline" label="Bookmark" />
    <MenuItem iconName="document-text-outline" label="Imported from Voice Note" />
    <MenuItem iconName="bar-chart-outline" label="Inside" />
    <MenuItem iconName="cart-outline" label="Open your AI Shop" />
    <MenuItem iconName="chatbubble-outline" label="Setting Voices" />
    <MenuItem iconName="trash-outline" label="Trash" />
    <MenuItem iconName="settings-outline" label="Settings" />
    <MenuItem iconName="log-out-outline" label="Logout" onPress={handleLogout} />
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
