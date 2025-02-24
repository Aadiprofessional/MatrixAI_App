import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../hooks/useAuth';
import Toast from 'react-native-toast-message';

const VideoCard = ({ item, onPress }) => {
  const { addToWishlist } = useWishlist();
  const { uid } = useAuth();

  const handleAddToWishlist = async () => {
    try {
      const productType = 'video';
      const productId = item.videoproductid;
      
      const result = await addToWishlist(uid, productId, productType);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Added to wishlist',
          text2: 'This video has been added to your wishlist'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to add to wishlist'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.price}>${item.price}</Text>
      </View>
      <TouchableOpacity style={styles.wishlistButton} onPress={handleAddToWishlist}>
        <Icon name="favorite-border" size={24} color="#FF6F00" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    width: 160,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  infoContainer: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    fontSize: 12,
    color: '#666',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
});

export default VideoCard;
