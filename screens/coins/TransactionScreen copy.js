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

const TransactionScreen2 = ({ navigation }) => {
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
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../../assets/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
       
      </View>

      {/* Transaction List */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.subtitle}>Last Transaction</Text>
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
    flexDirection: 'row',
  marginLeft:-20,
  
    paddingHorizontal: 10,

  },
  backButton: {
    marginRight: 10,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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

export default TransactionScreen2;
