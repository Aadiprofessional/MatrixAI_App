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

const TransactionScreen = () => {
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
      <View style={styles.header}>
        <Text style={styles.coinCount}>12 Coins</Text>
        <Image source={require('../../assets/avatar.png')} style={styles.coinImage} />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Image source={require('../../assets/convert_copy.png')} style={styles.actionIcon} />
          <Text style={styles.actionText}>Transaction</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Image source={require('../../assets/export.png')} style={styles.actionIcon} />
          <Text style={styles.actionText}>Watch Ad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Image source={require('../../assets/money-send.png')} style={styles.actionIcon} />
          <Text style={styles.actionText}>Buy Coins</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Image source={require('../../assets/add-circle.png')} style={styles.actionIcon} />
          <Text style={styles.actionText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.subtitle}>Last Transaction</Text>
        <TouchableOpacity>
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
  header: {
    backgroundColor: '#4169E1',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  coinCount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  coinImage: {
    width: 60,
    height: 60,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 14,
    color: '#6b6b6b',
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
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
