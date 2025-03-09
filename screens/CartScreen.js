import React, { useEffect, useState, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useCart } from '../components/CartContext.js';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
const CartScreen = ({ navigation }) => {
  const { cart, loading, removeFromCart, uid, fetchCart } = useCart();
  const isFocused = useIsFocused();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);  
  const [total, setTotal] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only fetch cart when screen comes into focus and not already loading
  useEffect(() => {
    if (isFocused && uid && !loading) {
      fetchCart(true); // Force refresh when navigating to cart screen
    }
  }, [isFocused, uid]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (uid) {
      setIsRefreshing(true);
      fetchCart(true).finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [uid, fetchCart]);

  const calculateSubtotal = () => {
    if (!Array.isArray(cart) || cart.length === 0) {
      return 0;
    }
    return cart.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price;
    }, 0);
  };

  const handleRemoveFromCart = (cartId) => {
    if (!cartId) {
      console.error('Cannot remove item: Invalid cart ID');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Cannot remove item from cart',
      });
      return;
    }
    
    console.log('Removing item with cart ID:', cartId);
    removeFromCart(cartId);
  };

  const renderItem = ({ item }) => {
    console.log('Rendering cart item:', item);
    
    // Check if item has valid data
    if (!item || !item.product) {
      console.error('Invalid cart item:', item);
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={styles.cartItem}
        onPress={() => {
          // Determine which product ID to use based on product type
          const params = {};
          if (item.product_type === 'image') {
            params.imageproductid = item.product_id;
          } else if (item.product_type === 'video') {
            params.videoproductid = item.product_id;
          } else if (item.product_type === 'music') {
            params.musicproductid = item.product_id;
          }
          
          navigation.navigate('ProductDetail', params);
        }}
      >
        <Image 
          source={{ uri: item.product?.image_url || item.product?.thumbnail_url }} 
          style={styles.itemImage} 
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.product?.name || 'Product'}</Text>
          <Text style={styles.itemPrice}>${(item.product?.price || 0).toFixed(2)}</Text>
        </View>
        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFromCart(item.cart_id)}
        >
          <Icon name="remove-circle" size={24} color="red" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.cart_id?.toString() || `item-${Math.random().toString(36).substr(2, 9)}`}
          renderItem={renderItem}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your cart is empty.</Text>
              <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.shopButtonText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {cart.length > 0 && (
        <>
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
          
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={() => navigation.navigate('Checkout')}
          >
            <Text style={styles.checkoutText}>Proceed to Payment</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
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
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
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
    padding: 5,
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
  subtotalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6F00',
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
    fontWeight: 'bold',
  },
});

export default CartScreen;
