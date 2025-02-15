import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import MusicIcon from 'react-native-vector-icons/Ionicons'; // Import music icon
import WishlistIcon from 'react-native-vector-icons/AntDesign'; // Import wishlist icon

const MusicCard = ({ title, price, owner, image ,musicproductid}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
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
        {image ? (
          <Image source={image} style={styles.image} />
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
