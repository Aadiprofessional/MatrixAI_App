// Header.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const Header = ({ coinCount }) => {
  return (
    <View style={styles.header}>
      {/* Welcome Text with Cat Icon */}
      <View style={styles.rowContainer}>
        <Image source={require('../assets/Avatar/Cat.png')} style={styles.icon} />
        <Text style={styles.welcomeText}>Welcome Back!</Text>
      </View>

      {/* Coin Display with Coin Icon */}
      <TouchableOpacity style={styles.coinContainer}>
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
    borderWidth: 1,          // Gray stroke
    borderColor: '#C9C9C9', // Light gray color
    borderRadius: 15,       // Rounded corners
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
