// PopularCategory.js
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Card from './Card'; // Assuming you have a Card component

const popularData = [
  { id: '1', title: 'AI Family by xyz', price: '$2', image: require('../assets/AIShopImage1.png') },
  { id: '2', title: 'AI Planet by xyz', price: '$4', image: require('../assets/AIShopImage1.png') },
  { id: '3', title: 'Woman by abc', price: '$3.6', image: require('../assets/AIShopImage1.png') },
];

const VideoCategory = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Card title={item.title} price={item.price} image={item.image} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
});

export default VideoCategory;

// Similar components can be created for MusicCategory, DocumentCategory, VideoCategory, ImageCategory
