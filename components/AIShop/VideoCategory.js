// PopularCategory.js
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity     } from 'react-native';
import Card from './Card'; // Assuming you have a Card component
import VideoCard from './VideoCard';
import Banner from './Banner';
const popularData = [
  { id: '1', title: 'AI Family by xyz', price: '$2' },
  { id: '2', title: 'AI Planet by xyz', price: '$4', image: require('../../assets/AIShopImage1.png') },
  { id: '3', title: 'Woman by abc', price: '$3.6', image: require('../../assets/AIShopImage1.png') },
];

const VideoCategory = () => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest Release</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard title={item.title} price={item.price} image={item.image} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest Release</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard title={item.title} price={item.price} image={item.image} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <Banner />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest Release</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard title={item.title} price={item.price} image={item.image} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />  
      <Banner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: 'orange',
    fontSize: 14,
  },
  });

export default VideoCategory;

// Similar components can be created for MusicCategory, DocumentCategory, VideoCategory, ImageCategory
