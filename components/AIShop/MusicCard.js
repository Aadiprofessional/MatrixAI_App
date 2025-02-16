import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Sound from 'react-native-sound';

import MusicIcon from 'react-native-vector-icons/Ionicons'; // Import music icon
import WishlistIcon from 'react-native-vector-icons/AntDesign'; // Import wishlist icon

const MusicCard = ({ title, price, owner, image, musicproductid, item, navigation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const sound = useRef(null);
  const [positionMillis, setPositionMillis] = useState(0);

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
  console.log(item);
  

  const stopAudio = () => {
    if (sound.current) {
      sound.current.stop(() => {
        sound.current.release();
        sound.current = null;
        setIsPlaying(false);
      });
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };
  const navigateToDetail = () => {
    navigation.navigate('ProductDetail', {musicproductid });
  };
  // Function to truncate text
  const truncateText = (text, limit) => {
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
        <Text style={styles.owner}>{truncateText(owner.split(' ')[0], 10)}</Text>
        <Text style={styles.price}>{truncateText(price, 7)}</Text>
      </View>
      <TouchableOpacity style={styles.wishlistIcon} onPress={toggleLike}>
          <WishlistIcon name={isLiked ? 'heart' : 'hearto'} size={16} color={isLiked ? 'red' : '#333'} />
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
    elevation: 2, // For Android shadow
    shadowColor: '#000', // For iOS shadow
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
    backgroundColor: '#f0f0f0', // Background for the icon
    borderRadius: 5,
    position: 'relative',
  },
  musicIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  playPauseButton: {
    position: 'absolute', // Positioning the button absolutely
    top: 0, // Adjust to align with the icon
    left: 0, // Adjust to align with the icon
    zIndex: 2,
    width: '100%', // Make the button cover the entire icon area
    height: '100%', // Make the button cover the entire icon area
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
    fontSize: 12, // Smaller font size for owner name
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
