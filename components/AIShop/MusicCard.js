import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Sound from 'react-native-sound';
import { WishlistContext } from '../../context/WishlistContext';
import { useAuth } from '../../hooks/useAuth';
import MusicIcon from 'react-native-vector-icons/Ionicons';
import WishlistIcon from 'react-native-vector-icons/AntDesign';

const MusicCard = ({ title, price, owner, image, musicproductid, item, navigation, wishlist }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sound = useRef(null);
  const [positionMillis, setPositionMillis] = useState(0);
  const { uid } = useAuth();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useContext(WishlistContext);
  const [isInWishlist, setIsInWishlist] = useState(wishlist || wishlistItems.some(item => item.id === musicproductid));

  const toggleLike = async () => {
    if (isInWishlist) {
      await removeFromWishlist(musicproductid);
      setIsInWishlist(false);
    } else {
      const result = await addToWishlist(uid, musicproductid, 'music');
      if (result.success) {
        setIsInWishlist(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.stop();
        sound.current.release();
        sound.current = null;
      }
    };
  }, []);

  const togglePlayPause = () => {
    if (!sound.current) {
      sound.current = new Sound(item.music_url, null, (error) => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }
        sound.current.play(() => {
          sound.current.release();
          sound.current = null;
        });
        setIsPlaying(true);
      });
    } else if (isPlaying) {
      sound.current.pause(() => {
        setIsPlaying(false);
      });
    } else {
      sound.current.play(() => {
        setIsPlaying(true);
      });
    }
  };

  const stopAudio = () => {
    if (sound.current) {
      sound.current.stop(() => {
        sound.current.release();
        sound.current = null;
        setIsPlaying(false);
      });
    }
  };

  const navigateToDetail = () => {
    navigation.navigate('ProductDetail', {musicproductid });
  };

  const truncateText = (text, limit) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={navigateToDetail}>
      <View style={styles.iconContainer}>
        {item.thumbnail_url ? (
          <ImageBackground 
            source={{ uri: item.thumbnail_url }} 
            style={styles.image}
            resizeMode="cover"
          >
            <Image source={require('../../assets/matrix.png')} style={styles.watermark} />
          </ImageBackground>
        ) : (
          <MusicIcon name="musical-notes-outline" size={44} color="#ccc" style={styles.musicIcon} />
        )}
        <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
          <MusicIcon name={isPlaying ? 'pause-circle' : 'play-circle'} size={30} color="#F9690E" backgroundColor="#fff" borderRadius={15} />
        </TouchableOpacity>
      </View>
      <View style={styles.details}>
        <Text style={styles.title}>{truncateText(title, 15)}</Text>
        <Text style={styles.owner}>{truncateText(owner?.split(' ')[0], 10)}</Text>
        <Text style={styles.price}>{truncateText(price, 7)}</Text>
      </View>
      <TouchableOpacity style={styles.wishlistIcon} onPress={toggleLike}>
          <WishlistIcon name={isInWishlist ? 'heart' : 'hearto'} size={16} color={isInWishlist ? 'red' : '#333'} />
        </TouchableOpacity>   
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  watermark: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: 35,
    right: 15,
    resizeMode: 'contain',
    opacity: 0.7,
  },
  card: {
    height: 90, 
    width: 220,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginInline: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  iconContainer: {
    width: 70,
    height: 70,
    marginLeft: -30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    position: 'relative',
  },
  musicIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  playPauseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 5,
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  owner: {
    fontSize: 12,
    color: '#888',
  },
  price: {
    fontSize: 14,
    color: '#888',
  },
  wishlistIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
});

export default MusicCard;
