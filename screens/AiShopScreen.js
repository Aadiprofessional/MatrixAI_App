import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import SearchHeader from '../components/SearchHeader';
import CategoryTabs from '../components/CategoryTabs';
import Card from '../components/Card';
import Banner from '../components/Banner';
import Header from '../components/Header';

// Import the category components
import PopularCategory from '../components/PopularCategory';
import MusicCategory from '../components/MusicCategory';
import DocumentCategory from '../components/DocumentCategory';
import VideoCategory from '../components/VideoCategory';
import ImageCategory from '../components/ImageCategory';

const AiShop = ({ navigation }) => {

  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedTab, setSelectedTab] = useState(0); // Manage selectedTab state here

  const latestRelease = [
    { id: '1', title: 'AI Family by xyz', price: '$2', image: require('../assets/AIShopImage1.png') },
    { id: '2', title: 'AI Planet by xyz', price: '$4', image: require('../assets/AIShopImage1.png') },
    { id: '3', title: 'Woman by abc', price: '$3.6', image: require('../assets/AIShopImage1.png') },
    { id: '4', title: 'Human AI by xy', price: '$8', image: require('../assets/AIShopImage1.png') },
    { id: '5', title: 'AI Child Video by mx', price: '$23', image: require('../assets/AIShopImage1.png') },
    { id: '6', title: 'AI Driving Car by asdf', price: '$7', image: require('../assets/AIShopImage1.png') },
  ];

  // Render the appropriate category based on the selectedTab
  const renderCategoryComponent = () => {
    switch (selectedTab) {
      case 0:
        return <PopularCategory  navigation={navigation} />;
      case 1:
        return <MusicCategory />;
      case 2:
        return <DocumentCategory />;
      case 3:
        return <VideoCategory />;
      case 4:
        return <ImageCategory />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Search Header */}
      <SearchHeader scrollY={scrollY} navigation={navigation} />

      {/* Pass setSelectedTab as a prop to CategoryTabs */}
      <CategoryTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

   {renderCategoryComponent()}
        <Banner />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={latestRelease.slice(4)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card title={item.title} price={item.price} image={item.image} navigation={navigation} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardList}
        />

        {/* Render the selected category component below the ScrollView */}
      
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: 'orange',
    fontSize: 14,
  },
  cardList: {
    paddingLeft: 10,
  },
});

export default AiShop;
