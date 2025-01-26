import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // Install react-native-linear-gradient for gradient backgrounds

const SubscriptionScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState('1 week'); // Default selected plan

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const getButtonPrice = () => {
    if (selectedPlan === '1 week') {
      return '$0.99';
    } else if (selectedPlan === '6 months') {
      return '$19.99';
    } else if (selectedPlan === '1 year') {
      return '$39.99';
    }
  };

  return (
    <LinearGradient
      colors={['#2274F0', '#FF6600']} // Vertical gradient from #2274F0 to #FF6600
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      locations={[0, 1]} // Adjust the gradient angle
      style={styles.container}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton}>
        <Image source={require('../../assets/back.png')} style={styles.backIcon} />
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.title}>Subscription</Text>

      {/* Coin Section */}
      <View style={styles.coinSection}>
     
        <Image source={require('../../assets/coin2.png')} style={styles.coinIcon} />
        <Text style={styles.coinText}>80 COINS</Text>
        <Text style={styles.subtitle}>
          You need to earn 20 coins here to buy a 1-week subscription
        </Text>
      </View>

      {/* Watch Ad Button */}
      <TouchableOpacity style={styles.earnButton}>
        <Text style={styles.earnButtonText}>Watch ad & earn</Text>
        <Image source={require('../../assets/play2.png')} style={styles.playIcon} />
      </TouchableOpacity>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Unlimited Text Generate</Text>
        <Text style={styles.descriptionText}>Get access to 200 Hours of AI Time</Text>
      </View>

      {/* Plans */}
      <View style={styles.plansContainer}>
        <TouchableOpacity
          style={[styles.plan, selectedPlan === '1 week' && styles.activePlan]}
          onPress={() => handlePlanSelect('1 week')}
        >
          <Text style={styles.planTitle}>1 week</Text>
          <Text style={styles.planPrice}>
            $0.99 / <Image source={require('../../assets/coin.png')} style={styles.planCoinIcon} /> 200
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.plan, selectedPlan === '6 months' && styles.activePlan]}
          onPress={() => handlePlanSelect('6 months')}
        >
          <Text style={styles.planTitle}>6 months</Text>
          <Text style={styles.planPrice}>$19.99</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.plan, selectedPlan === '1 year' && styles.activePlan]}
          onPress={() => handlePlanSelect('1 year')}
        >
          <Text style={styles.planTitle}>1 year</Text>
          <Text style={styles.planPrice}>$39.99</Text>
        </TouchableOpacity>
      </View>

      {/* Buy Now Button */}
      <TouchableOpacity style={styles.buyButton}>
        <Text style={styles.buyButtonText}>Buy Now {getButtonPrice()}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50, // Margin top of 50
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    tintColor:'#fff',
    zIndex: 1,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  coinSection: {
    alignItems: 'center',
   
  },
  coinIcon: {
    width: 400,
    height: 200,
  },
  coinIcon2: {
    width: 400,
    height: 80,
    zIndex:-1,
  },
  coinText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  earnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    margin:10,
    borderRadius: 5,
    marginTop: 20,
  },
  earnButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004E92',
    marginRight: 8,
  },
  playIcon: {
    width: 20,
    height: 20,
  },
  descriptionContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  descriptionText: {
    fontSize: 14,
    color: '#fff',
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  plan: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  activePlan: {
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004E92',
  },
  planPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004E92',
    marginTop: 10,
  },
  planCoinIcon: {
    width: 16,
    height: 16,
  },
  buyButton: {
    backgroundColor: '#FFE326',
 
    alignItems: 'center',
  
    paddingVertical: 15,
    margin:10,
    borderRadius: 5,
    marginTop: 20,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: 'medium',
    color: '#2C2C2C',
  },
});

export default SubscriptionScreen;
