import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import MusicIcon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../components/CartContext';
import { useAuth } from '../hooks/useAuth';

const ProductDetailScreen = ({ route, navigation }) => {
  const { addToCart, cart } = useCart();
  const { uid } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const videoUrl = product?.video_url || '';
  const image = product?.image_url || product?.thumbnail_url || '';
  const [isLiked, setIsLiked] = useState(false);
  const new_label = product?.new_label || false;

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleLike = () => {
    // Like functionality to be implemented
  };

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
        <View style={styles.header}>
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

           
              
            </View>
      <View style={styles.imageContainer}>
        {isPlaying ? (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: videoUrl }}
              ref={videoRef}
              style={styles.video}
              paused={!isPlaying}
              resizeMode="cover"
              repeat={false}
              bufferConfig={{
                minBufferMs: 10000,
                maxBufferMs: 20000,
                bufferForPlaybackMs: 10000,
                bufferForPlaybackAfterRebufferMs: 10000
              }}
              onProgress={({ currentTime }) => setCurrentTime(currentTime)}
              onEnd={handleVideoEnd}
            />
            <TouchableOpacity
              style={styles.videoTouchArea}
              onPress={handleVideoPress}
              activeOpacity={1}
            />
             <Image source={require('../assets/matrix.png')} style={styles.watermark2} />
            <TouchableOpacity 
              onPress={togglePlayPause} 
              style={[styles.playPauseButton2, { opacity: showControls ? 1 : 0 }]}
              activeOpacity={0.7}
              pointerEvents={showControls ? 'auto' : 'none'}
            >
              <MusicIcon 
                name={isPlaying ? 'pause-circle' : 'play-circle'} 
                size={35} 
                color="#F9690E" 
                style={{ backgroundColor: '#fff', borderRadius: 20  }}
              />
            </TouchableOpacity>
              
          </View>
        ) : (
          <View style={styles.imageContainer2}>
               <Image source={require('../assets/matrix.png')} style={styles.watermark} />
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <MusicIcon name="videocam-outline" size={74} color="#ccc" style={styles.MusicIcon} />
            )}
            { !product?.image_url &&
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
              <MusicIcon name="play-circle" size={35} color="#F9690E" backgroundColor="#fff" borderRadius={15} />
            </TouchableOpacity>
            }
          </View>
        )}
        
        {/* New Label */}
        {new_label && (
          <View style={styles.newLabel}>
            <Text style={styles.newLabelText}>Newly Launched</Text>
          </View>
        )}
        
        {/* Watermark */}
        
     
        
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#0066FEFF',
   
    marginTop: 30,
 
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
    marginTop: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    opacity: 0.5,
    zIndex: 100,
    resizeMode: 'contain',
  },
  watermark2: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    opacity: 0.5,
    zIndex: 0,
   top: 60,
    alignSelf: 'center',
    resizeMode: 'contain',
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
    width: 300,
    height: 500,
    resizeMode: 'contain',
  },
  videoContainer: {
    width: '90%',
    height: '90%',
    position: 'relative',
    alignSelf: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  playPauseButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 2,
  },
  playPauseButton2: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    zIndex: 20,
  },
  imageContainer2: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: 300,
    height: 500,
    resizeMode: 'contain',
  },
  newLabel: {
    position: 'absolute',
    top: 20,
    left: -10,
    backgroundColor: '#FF6F00',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 5,
  },
  newLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 20,
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
