import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import MusicIcon from 'react-native-vector-icons/Ionicons';
import Sound from 'react-native-sound';
import { useCart } from '../components/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../hooks/useAuth';
import ImageDealsSection from '../components/AIShop/ImageDealsSection';
import Banner from '../components/AIShop/Banner'; 
import ImageCategory2 from '../components/AIShop/ImageCategory copy';
import MusicCategory2 from '../components/AIShop/MusicCategory copy';
import VideoCategory2 from '../components/AIShop/VideoCategory copy';

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
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [musicPosition, setMusicPosition] = useState(0);

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

 

  const { imageproductid, videoproductid, musicproductid } = route.params;
console.log('UID IN PRODUCT',uid);

useEffect(() => {
  setLoading(true); // Start loading

  const fetchProductDetails = async () => {
try {
  const response = await fetch('https://matrix-server.vercel.app/getProductDetails', {
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
    console.log('Fetched product:', data); // Log the fetched product to verify its structure
    setProduct(data);
  } else {
    setError(data.error || 'Failed to fetch product details');
  }
    } catch (err) {
      setError(err.message);
    }
  };

  fetchProductDetails().finally(() => {
    // Delay stopping the loading state separately
    setTimeout(() => {
      setLoading(false);
    }, 1300); // 500ms delay after fetch completes
  });

}, [uid, imageproductid, videoproductid, musicproductid]);


  // Initialize and cleanup music player
  useEffect(() => {
    if (product?.music_url) {
      const newSound = new Sound(product.music_url, null, (error) => {
        if (error) {
          console.log('Failed to load sound', error);
          return;
        }
        newSound.setCurrentTime(musicPosition);
      });
      setSound(newSound);

      return () => {
        if (newSound) {
          newSound.release();
        }
      };
    }
  }, [product?.music_url]);

  // Handle music play/pause
  const toggleMusicPlay = () => {
    if (sound) {
      if (isMusicPlaying) {
        sound.pause();
        sound.getCurrentTime((seconds) => setMusicPosition(seconds));
      } else {
        sound.play((success) => {
          if (success) {
            console.log('Music finished playing');
            setIsMusicPlaying(false);
          } else {
            console.log('Playback failed due to audio decoding errors');
          }
        });
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  if (loading || imageLoading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#fff" />
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

      {/* Wishlist Button */}
      <TouchableOpacity
        style={styles.wishlistButton}
        onPress={() => {
          const productType = product.image_url ? 'image' : 
                            product.video_url ? 'video' : 
                            product.music_url ? 'music' : '';
          const productId = product.id || product.imageproductid || 
                          product.videoproductid || product.musicproductid;
          
          addToWishlist(uid, productId, productType)
            .then(result => {
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Added to wishlist',
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: result.error || 'Failed to add to wishlist',
                });
              }
            })
            .catch(error => {
              console.error('Wishlist error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message,
              });
            });
        }}
      >
        <Icon name={isLiked ? 'favorite' : 'favorite-border'} size={24} color="#FF6F00" />
      </TouchableOpacity>

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
          {!product?.music_url && (
            <Image source={require('../assets/matrix.png')} style={styles.watermark} />
          )}
          
          {image && !product?.music_url ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            !product?.music_url && (
              <MusicIcon name="videocam-outline" size={74} color="#ccc" style={styles.MusicIcon} />
            )
          )}
        
          {product?.music_url && (
            <View style={styles.musicContainer}>
              <Image source={require('../assets/matrix.png')} style={styles.watermark3} />
              <Image 
                source={{ uri: image }} 
                style={styles.musicThumbnail} 
              />
              <TouchableOpacity 
                onPress={toggleMusicPlay} 
                style={styles.musicPlayButton}
              >
                <MusicIcon 
                  name={isMusicPlaying ? 'pause-circle' : 'play-circle'} 
                  size={50} 
                  color="#F9690E" 
                  style={{ backgroundColor: '#fff', borderRadius: 25 }}
                />
              </TouchableOpacity>
            </View>
          )}
        
          {!product?.music_url && !product?.image_url && (
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton3}>
              <MusicIcon name="play-circle" size={35} color="#F9690E" backgroundColor="#fff" borderRadius={15} />
            </TouchableOpacity>
          )}
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
  onPress={() => {
    console.log('Product to add to cart:', product); // Log the product object
    const productType = product.image_url ? 'image' : product.video_url ? 'video' : product.music_url ? 'music' : '';
    const productId = product.id || product.imageproductid || product.videoproductid || product.musicproductid;
addToCart(uid, productId, productType)
  .then(responseData => {
    if (responseData && responseData.message === 'Product already added to cart') {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: responseData.message,
      });
    }
  })
  .catch(error => {
    console.error('Error adding product to cart:', error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Failed to add product to cart',
    });
  });
  }}
>
  <Text style={styles.addToCartText}>Add to Cart</Text>
</TouchableOpacity>
      {!product?.music_url && product?.image_url && (
        <>
    
      <ImageCategory2 navigation={navigation} />
        </>
      )}
         {product?.music_url && !product?.image_url && (
        <>
    
      <MusicCategory2 navigation={navigation} />
        </>
      )}
         {product?.video_url && !product?.image_url && (
        <>
    
      <VideoCategory2 navigation={navigation} />
        </>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark transparent background
    zIndex: 1000, // Ensure it's above everything
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
    alignItems: 'center',
    backgroundColor: '#fff',
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
  watermark3: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    opacity: 0.5,
    zIndex: 10,
    top: 60,
    alignSelf: 'center',
    resizeMode: 'contain',
    left: 10,
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
  playPauseButton3: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    zIndex: 200,
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
  musicContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 20,
  },
  musicThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  musicPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 100,
  },
});

export default ProductDetailScreen;
