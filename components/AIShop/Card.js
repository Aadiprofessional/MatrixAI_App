import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import MusicIcon from 'react-native-vector-icons/Ionicons';
const Card = ({ title, price, image, navigation,imageproductid }) => {
  const [isLiked, setIsLiked] = useState(false);

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const navigateToDetail = () => {
    navigation.navigate('ProductDetail', { imageproductid });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={navigateToDetail}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
      {image ? (
          <Image source={image} style={styles.image} />
        ) : (
            <MusicIcon name="image-outline" size={74} color="#ccc" style={styles.MusicIcon} />
        )}    
        <TouchableOpacity style={styles.heartIcon} onPress={toggleLike}>
          <Icon name={isLiked ? 'heart' : 'hearto'} size={16} color={isLiked ? 'red' : '#333'} />
        </TouchableOpacity>
      </View>
      {/* Text Section */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
    </TouchableOpacity>
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
  MusicIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  imageContainer: {
    position: 'relative',
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0', // Background for the icon
    borderRadius: 20,
    width: 150,
    height: 100,
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 20,
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 5,
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

export default Card;
