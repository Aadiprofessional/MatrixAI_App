import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

const transactions = [
  { id: '1', type: 'Image', coins: 2 },
  { id: '2', type: 'Image', coins: 2 },
  { id: '3', type: 'Image', coins: 2 },
  { id: '4', type: 'Image', coins: 2 },
  { id: '5', type: 'Image', coins: 2 },
  { id: '6', type: 'Image', coins: 2 },
];

const TransactionScreen = ({ route, navigation }) => {
 

  const renderItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <Image source={require('../../assets/coin.png')} style={styles.image} />
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>{item.type}</Text>
        <Text style={styles.transactionSubText}>AI generated Image</Text>
      </View>
      <Text style={styles.coinsText}>{item.coins} Coins</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image source={require('../../assets/back.png')} style={styles.backIcon} />
      </TouchableOpacity>

      {/* Header with full background */}
      <View style={styles.header}>
        <Image source={require('../../assets/Header.png')} style={styles.headerImage} />
        <Text style={styles.coinCount }>{ } Coins</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TransactionScreen2')}>
            <Image source={require('../../assets/convert_copy.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <Text style={styles.actionText}>Transaction</Text>
        </View>
        <View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('WatchAdScreen')}>
            <Image source={require('../../assets/export.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <Text style={styles.actionText}>Watch Ad</Text>
        </View>
        <View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BuyCoinsScreen')}>
            <Image source={require('../../assets/money-send.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <Text style={styles.actionText}>Buy Coins</Text>
        </View>
        <View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReferralScreen')}>
            <Image source={require('../../assets/add-circle.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <Text style={styles.actionText}>Invite</Text>
        </View>
      </View>

      {/* Transaction List */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.subtitle}>Last Transaction</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TransactionScreen2')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.transactionList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    padding: 20,
     
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  header: {
    position: 'relative',
    height: 200,
    marginBottom: 40,
  },
  headerImage: {
    width: '105%',
    height: '130%',
    resizeMode: 'contain',
  },
  
    coinCount:{position: 'absolute',
    top: 110,
    left: 20,
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  actionIcon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 14,
    color: '#4169E1',
    textAlign: 'center',
    marginTop: 5,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#FF4500',
    fontSize: 14,
  },
  transactionList: {
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionSubText: {
    fontSize: 12,
    color: '#6b6b6b',
  },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default TransactionScreen;
