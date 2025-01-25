import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProductDetailScreen = () => {
  return (
    <View style={styles.container}>
      {/* Backdrop Image with Watermark */}
      <View style={styles.imageContainer}>
        <Image 
          source={require('../assets/matrix.png')} // Replace with your matrix.png path
          style={styles.watermark} 
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.backButton}>
          <Icon name="arrow-back-ios" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton}>
          <Icon name="shopping-cart" size={24} color="black" />
        </TouchableOpacity>
        <Image 
          source={require('../assets/robot.png')} // Replace with your AI robot image path
          style={styles.productImage} 
        />
      </View>

      {/* Product Details */}
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.productTitle}>AI generated robot</Text>
        <Text style={styles.productPrice}>$12.00</Text>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.tabText}>Description</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Product Description */}
        <Text style={styles.productDescription}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc consectetur velit at massa vehicula, quis fringilla urna gravida.
        </Text>

        {/* Delivery Information */}
        <Text style={styles.deliveryText}>
          <Text style={styles.boldText}>Delivery:</Text> 15 days after payment confirmation
        </Text>
        <Text style={styles.deliveryText}>
          <Text style={styles.boldText}>Delivery:</Text> 15 days after payment confirmation
        </Text>
      </ScrollView>

      {/* Add to Cart and Buy Now */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addToCartButton}>
          <Text style={styles.addToCartText}>Add to cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton}>
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
  },
  cartButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
  },
  productImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 20,
    color: '#FF6F00',
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  activeTab: {
    borderBottomColor: '#FF6F00',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 14,
    color: '#777',
    marginBottom: 20,
  },
  deliveryText: {
    fontSize: 14,
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FF6F00',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProductDetailScreen;
