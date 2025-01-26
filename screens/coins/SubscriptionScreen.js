import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SubscriptionScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription</Text>
      <Text style={styles.coins}>80 COINS</Text>
      <Text style={styles.subtitle}>You need to Earn 20 coins here to buy 1 week subscription</Text>
      <TouchableOpacity style={styles.earnButton}>
        <Text style={styles.earnButtonText}>Watch ad & earn</Text>
      </TouchableOpacity>
      <Text style={styles.description}>Unlimited Text Generate</Text>
      <Text style={styles.description}>Get access to 200 Hours of AI Time</Text>
      <View style={styles.plansContainer}>
        <View style={styles.plan}>
          <Text style={styles.planTitle}>1 week</Text>
          <Text style={styles.planPrice}>49 / 200</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.plan}>
          <Text style={styles.planTitle}>6 months</Text>
          <Text style={styles.planPrice}>1399</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.plan}>
          <Text style={styles.planTitle}>1 year</Text>
          <Text style={styles.planPrice}>2799</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  coins: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  earnButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  earnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plan: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    margin: 5,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SubscriptionScreen;