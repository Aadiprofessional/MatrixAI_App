import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window'); // Get the screen width

const FeatureCardWithDetails = () => {
  const navigation = useNavigation(); // Initialize navigation

  const handleUpgradePress = () => {
    navigation.navigate('SubscriptionScreen'); // Replace 'UpgradeScreen' with your target screen's name
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.card}>
        {/* Top section with "Matrix AI" text and "PRO" container */}
        <View style={styles.topSection}>
          <Text style={styles.matrixAIText}>Matrix AI</Text>
          <View style={styles.proContainer}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        </View>

        {/* List of features with images */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Image source={require('../assets/card/icon1.png')} style={styles.featureIcon} />
            <Text style={styles.featureText}>Advanced Cloud Storage Solutions</Text>
          </View>
          <View style={styles.featureItem}>
            <Image source={require('../assets/card/icon2.png')} style={styles.featureIcon} />
            <Text style={styles.featureText}>Real-Time Data Sync</Text>
          </View>
          <View style={styles.featureItem}>
            <Image source={require('../assets/card/icon3.png')} style={styles.featureIcon} />
            <Text style={styles.featureText}>Monthly Transcription Bonus</Text>
          </View>
          <View style={styles.featureItem}>
            <Image source={require('../assets/card/icon4.png')} style={styles.featureIcon} />
            <Text style={styles.featureText}>Multi-Format Export</Text>
          </View>
        </View>

        {/* Upgrade button */}
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Center the card vertically
    alignItems: 'center', // Center the card horizontally
    backgroundColor: '#F8F9FD',
  },
  card: {
    width: '90%', // 80% of the screen width
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 10,
    borderWidth: 1, // Gray border for the card
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
    justifyContent: 'center', // Center content inside card
    alignItems: 'center', // Center content horizontally in card
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the text and PRO label horizontally
    alignItems: 'center',
    marginBottom: 5, // Add space below top section
  },
  matrixAIText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  proContainer: {
    backgroundColor: '#007BFF', // Blue background
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 10, // Space between "Matrix AI" and "PRO"
  },
  proText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  featureList: {
    marginTop: 5,
    width: '100%', // Make sure feature items fill the width of the card
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1, // Ensures text takes up remaining space
  },
  upgradeButton: {
    backgroundColor: '#007BFF', // Blue background for button
    paddingVertical: 10,
    width: width * 0.7,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FeatureCardWithDetails;
