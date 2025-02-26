import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';

const TimeScreen = () => {
  const transactions = [
    { id: '1', title: 'Image', description: 'AI generated Image', time: '15 Sec' },
    { id: '2', title: 'Image', description: 'AI generated Image', time: '15 Sec' },
    { id: '3', title: 'Image', description: 'AI generated Image', time: '15 Sec' },
    { id: '4', title: 'Image', description: 'AI generated Image', time: '15 Sec' },
    { id: '5', title: 'Image', description: 'AI generated Image', time: '15 Sec' },
    { id: '6', title: 'Image', description: 'AI generated Image', time: '15 Sec' },
  ];

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionRow}>
      <Image source={require('../../assets/profile.png')} style={styles.transactionImage} />
      <View style={styles.transactionText}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
      </View>
      <Text style={styles.transactionTime}>{item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <TouchableOpacity style={styles.backButton}>
        <Image source={require('../../assets/back.png')} style={styles.backIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton}>
        <Image source={require('../../assets/threeDot.png')} style={styles.menuIcon} />
      </TouchableOpacity>

      {/* Graph Section */}
      <View style={styles.graphContainer}>
        <Text style={styles.timeLeft}>1.2 Hours left</Text>
        <Text style={styles.expiry}>/ Expire on 15 March</Text>
        <View style={styles.graph}>
          {/* Graph Placeholder */}
          <Image source={require('../../assets/graph.png')} style={styles.graphImage} />
        </View>
      </View>

      {/* Transaction Section */}
      <View style={styles.transactionContainer}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitleHeader}>Last Transaction</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Buy More Time Button */}
      <TouchableOpacity style={styles.buyMoreButton}>
        <Text style={styles.buyMoreText}>Buy More Time</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  menuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,

  },
  menuIcon: {
    width: 24,
    height: 24,
        resizeMode:'contain'
  },
  graphContainer: {
    backgroundColor: '#FFF5EB',
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  timeLeft: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E5A33',
  },
  expiry: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  graph: {
    width: '100%',
    height: 150,
    marginTop: 16,
  },
  graphImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  transactionContainer: {
    flex: 1,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionTitleHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  viewAll: {
    fontSize: 14,
    color: '#FF6600',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EAEAEA',
    marginRight: 10,
  },
  transactionText: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#888888',
  },
  transactionTime: {
    fontSize: 14,
    color: '#333333',
  },
  buyMoreButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  buyMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TimeScreen;
