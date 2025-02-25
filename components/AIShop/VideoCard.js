import React, { useState, useRef, useEffect, useContext } from 'react';
import { WishlistContext } from '../../context/WishlistContext';
import { useAuth } from '../../hooks/useAuth';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import MusicIcon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

let currentPlayingVideo = null;

const VideoCard = ({ title, price, image, navigation, videoproductid, videoUrl, new_label, wishlist }) => {
  const videoRef = useRef(null);
  const { uid } = useAuth();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useContext(WishlistContext);
  const [isInWishlist, setIsInWishlist] = useState(wishlist || wishlistItems.some(item => item.id === videoproductid));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimeout = useRef(null);

  const togglePlayPause = () => {
    if (currentPlayingVideo && currentPlayingVideo !== videoRef) {
      currentPlayingVideo.current?.pause();
    }

    if (isPlaying) {
      videoRef.current?.pause();
      setShowControls(true);
    } else {
      videoRef.current?.seek(currentTime);
      videoRef.current?.play();
      currentPlayingVideo = videoRef;
      setShowControls(true);
      resetHideTimeout();
    }
    setIsPlaying(!isPlaying);
  };

  const resetHideTimeout = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    if (isPlaying) {
      hideTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  const handleVideoPress = () => {
    setShowControls(prev => {
      if (!prev) {
        resetHideTimeout();
      } else {
        resetHideTimeout();
      }
      return !prev;
    });
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
    setCurrentTime(0);
  };

  const toggleLike = async () => {
    if (isInWishlist) {
      await removeFromWishlist(videoproductid);
      setIsInWishlist(false);
    } else {
      const result = await addToWishlist(uid, videoproductid, 'video');
      if (result.success) {
        setIsInWishlist(true);
      }
    }
  };

  const navigateToDetail = () => {
    navigation.navigate('ProductDetail', { videoproductid });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isPlaying) {
        videoRef.current?.pause();
        setIsPlaying(false);
      }
    });

    return () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      unsubscribe();
    };
  }, [navigation]);

  return (
    <View style={styles.card}>
      {/* Video/Image Section */}
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
            <TouchableOpacity 
              onPress={togglePlayPause} 
              style={[styles.playPauseButton, { opacity: showControls ? 1 : 0 }]}
              activeOpacity={0.7}
              pointerEvents={showControls ? 'auto' : 'none'}
            >
              <MusicIcon 
                name={isPlaying ? 'pause-circle' : 'play-circle'} 
                size={35} 
                color="#F9690E" 
                style={{ backgroundColor: '#fff', borderRadius: 20 }}
              />
               <Image source={require('../../assets/matrix.png')} style={styles.watermark2} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageContainer2}>
               <Image source={require('../../assets/matrix.png')} style={styles.watermark} />
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <MusicIcon name="videocam-outline" size={74} color="#ccc" style={styles.MusicIcon} />
            )}
            
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
              <MusicIcon name="play-circle" size={35} color="#F9690E" backgroundColor="#fff" borderRadius={15} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* New Label */}
        {new_label && (
          <View style={styles.newLabel}>
            <Text style={styles.newLabelText}>Newly Launched</Text>
          </View>
        )}
        
        {/* Watermark */}
        
     
        <TouchableOpacity style={styles.heartIcon} onPress={toggleLike}>
          <Icon name={isInWishlist ? 'heart' : 'hearto'} size={16} color={isInWishlist ? 'red' : '#333'} />
        </TouchableOpacity>
      </View>
      {/* Text Section */}
      <TouchableOpacity style={styles.textContainer} onPress={navigateToDetail}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingBottom: 10,
    marginTop: 30,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  musicIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  playPauseButton: {
    position: 'absolute',
    zIndex: 999,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -17.5 }, { translateY: -17.5 }],
  },
  videoTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: 150,
    height: 100,
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  videoContainer: {
    width: 150,
    height: 100,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 20,
  },
  video: {
    width: 150,
    height: 100,
    borderRadius: 20,
  },
  newLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#F9690E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 2,
  },
  newLabelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  watermark: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    opacity: 0.5,
    zIndex: 10,
    resizeMode: 'contain',
    top: 20,
    left: 25,
  },
  watermark2: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
    zIndex: 10,
    resizeMode: 'contain',
    top: -30,
    left: -45,
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 5,
    zIndex: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 16,
    color: '#3333336A',
    textAlign: 'center',
    marginTop: 5,
  },
  price: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default VideoCard;
