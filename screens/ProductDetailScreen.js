import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCart } from '../components/CartContext';
import { useAuth } from '../hooks/useAuth';

const ProductDetailScreen = ({ route, navigation }) => {
  const { addToCart, cart } = useCart();
  const { uid } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);

  const { imageproductid, videoproductid, musicproductid } = route.params;
console.log('UID IN PRODUCT',uid);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch('https://matrix-server-gzqd.vercel.app/getProductDetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: uid,
            imageproductid,
            videoproductid, 
            musicproductid
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          setProduct(data);
        } else {
          setError(data.error || 'Failed to fetch product details');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [uid, imageproductid, videoproductid, musicproductid]);

  if (loading && imageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image 
          source={require('../assets/matrix.png')}
          style={styles.watermark} 
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <View style={styles.cartIconContainer}>
            <Icon name="shopping-cart" size={24} color="black" />
            {cart.length > 0 && (
              <View style={styles.cartItemCount}>
                <Text style={styles.cartItemCountText}>{cart.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {product?.image_url && (
          <Image 
            source={{ uri: product.image_url }}
            style={styles.productImage}
         
            
          />
        )}
        {(product?.video_url || product?.music_url) && (
          <View style={styles.playerContainer}>
            {/* Video/Music player would go here */}
            <Text style={styles.playerText}>
              {product.video_url ? 'Video Player' : 'Music Player'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.productTitle}>{product?.name}</Text>
        <Text style={styles.productPrice}>${product?.price}</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.tabText}>Description</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Reviews</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.productDescription}>
          {product?.description}
        </Text>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => addToCart(product)}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center'
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
  cartIconContainer: {
    position: 'relative',
  },
  cartItemCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6F00',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  playerContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginVertical: 10,
  },
  playerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  addToCartButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProductDetailScreen;
