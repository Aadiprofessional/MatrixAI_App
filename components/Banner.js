import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const Banner = () => (
  <View style={styles.banner}>
    <Text style={styles.bannerText}>More best AI generated</Text>
    <Text style={styles.subText}>Download more and more AI generated as you want</Text>
    <Text style={styles.comingSoon}>Coming Soon...</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f9f3ec',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subText: {
    fontSize: 14,
    color: 'gray',
  },
  comingSoon: {
    marginTop: 10,
    fontSize: 12,
    color: 'orange',
    fontWeight: 'bold',
  },
});

export default Banner;
