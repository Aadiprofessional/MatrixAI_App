import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';

const ReferralScreen = () => {
  const referralCode = '03AERET78';

  const copyToClipboard = () => {
    Clipboard.setString(referralCode);
    alert('Referral code copied to clipboard!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Refer Your Friends</Text>
      <Text style={styles.subtitle}>Get 25 coins for each Invite</Text>
      <Text style={styles.coins}>Total Coins</Text>
      <Text style={styles.description}>
        Invite your friend to install the app. When your friend signs up, you will get 25 coins and they will get 15 coins.
      </Text>
      <Text style={styles.referralLabel}>Your referral code</Text>
      <TouchableOpacity style={styles.referralCodeContainer} onPress={copyToClipboard}>
        <Text style={styles.referralCode}>{referralCode}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.inviteButton}>
        <Text style={styles.inviteButtonText}>Invite Friend</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  coins: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  referralLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  referralCodeContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inviteButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReferralScreen;