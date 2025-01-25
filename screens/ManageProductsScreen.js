import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ImageBackground } from 'react-native';

const products = [
  { id: 1, name: 'Ai Woman', price: '$2.00', image: require('../assets/OnBoard/1.png') },
  { id: 2, name: 'Ai World', price: '$10.00', image: require('../assets/OnBoard/1.png') },
  { id: 3, name: 'Ai Family', price: '$4.00', image: require('../assets/OnBoard/1.png') },
];

const ManageProductsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Image 
            source={require('../assets/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>
      <ImageBackground 
          source={require('../assets/matrix.png')} 
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
        >
        {products.map((product) => (
          <View key={product.id} style={styles.productContainer}>
            <View style={styles.mainRow}>
              <Image source={product.image} style={styles.productImage} />
              <View style={styles.detailsColumn}>
                <View style={styles.nameContainer}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Image 
                    source={require('../assets/pencil.png')}
                    style={styles.pencilIcon}
                  />
                </View>
                <Text style={styles.productPrice}>{product.price}</Text>
                <Text style={styles.productPrice}>Quantity Sold:5</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Image 
                      source={require('../assets/remove.png')}
                      style={styles.removeIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.boostButton}>
                    <Text style={styles.boostText}>Boost</Text>
                    <Image 
                      source={require('../assets/coin.png')}
                      style={styles.coinIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
    </ImageBackground>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  productContainer: {
    flexDirection: 'column',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    margin: 10,
    backgroundColor: '#FFF',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailsColumn: {
    flex: 1,
    marginLeft: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 160,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  pencilIcon: {
    width: 20,
    height: 20,
  },
  productPrice: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    backgroundColor: '#FF5733',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  boostButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  boostText: {
    color: '#FFF',
    fontSize: 14,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  removeIcon: {
    width: 24,
    height: 24,
  },
});

export default ManageProductsScreen;
