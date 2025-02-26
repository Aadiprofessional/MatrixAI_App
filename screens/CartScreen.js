import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useCart } from '../components/CartContext.js';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, uid, fetchForCartScreen } = useCart();
  const isFocused = useIsFocused();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);  
  const [total, setTotal] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  useEffect(() => {
    if (isFocused) {
      fetchForCartScreen();
    }
  }, [isFocused, fetchForCartScreen]);

const calculateSubtotal = () => {
  if (!Array.isArray(cart)) {
    return 0;
  }
  const total = cart.reduce((sum, item) => sum + item.product.price, 0);
  return total;
};

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.cartItem}
      onPress={() => navigation.navigate('ProductDetail', {
        imageproductid: item.product.imageproductid,
        videoproductid: item.product.videoproductid,
        musicproductid: item.product.musicproductid
      })}
    >
      <Image source={{ uri: item.product.image_url ||item.product.thumbnail_url}} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.product.name}</Text>
        <Text style={styles.itemPrice}>${item.product.price.toFixed(2)}</Text>
      </View>
      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id, uid)}
      >
        <Icon name="remove-circle" size={24} color="red" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.container2}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={require('../assets/back.png')} style={styles.backImage} />
        </TouchableOpacity>

        <Text style={styles.header}>My Cart</Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id?.toString() || `item-${Math.random().toString(36).substr(2, 9)}`} // Ensure unique keys
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Your cart is empty.</Text>}
      />
      <View style={styles.couponContainer}>
        <TextInput
          style={styles.couponInput}
          placeholder="Enter coupon code"
          value={coupon}
          onChangeText={setCoupon}
        />
      </View>
      <View style={styles.subtotalContainer}>
        <Text style={styles.subtotalText}>Subtotal:</Text>
        <Text style={styles.subtotalAmount}>${calculateSubtotal().toFixed(2)}</Text>
      </View>
      
      <TouchableOpacity style={styles.checkoutButton}>
        <Text style={styles.checkoutText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
       // Add margin top as requested
  },
  container2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  backImage: {
    width: 30,
    height: 30,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 16,
    color: '#FF6F00',
  },
  removeButton: {
    marginLeft: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  couponContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  couponInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checkoutButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  checkoutText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CartScreen;
