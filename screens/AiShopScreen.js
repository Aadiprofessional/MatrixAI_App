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

import CategoryTabs from '../components/AIShop/CategoryTabs';


// Import the category components
import PopularCategory from '../components/AIShop/PopularCategory';
import MusicCategory from '../components/AIShop/MusicCategory';

import VideoCategory from '../components/AIShop/VideoCategory';
import ImageCategory from '../components/AIShop/ImageCategory';
import SearchHeader from '../components/AIShop/SearchHeader';
import AllCategory from '../components/AIShop/AllCategory';
const AiShop = ({ navigation }) => {

  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedTab, setSelectedTab] = useState(0); // Manage selectedTab state here

 
  // Render the appropriate category based on the selectedTab
  const renderCategoryComponent = () => {
    switch (selectedTab) {
      case 0:
        return <PopularCategory  navigation={navigation} />;
      case 1:
        return <MusicCategory  navigation={navigation}  />;
      case 2:
        return <VideoCategory  navigation={navigation} />;
      case 3:
        return <ImageCategory  navigation={navigation} />;
      case 4:
        return <AllCategory  navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Search Header */}
      <SearchHeader scrollY={scrollY} navigation={navigation} style={{ position: 'absolute', top: 0, width: '100%', zIndex: 100 }} />

      {/* Pass setSelectedTab as a prop to CategoryTabs */}
      <CategoryTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} style={{ zIndex: 200 }} />

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.scrollContainer, { zIndex: 1000 }]}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        bounces={false}
      >

   {renderCategoryComponent()}
      

        {/* Render the selected category component below the ScrollView */}
        <View style={styles.endTextContainer}>
          <Text style={styles.crossBee}>MatrixAI❤️</Text>
          <Text style={styles.AppYard3}>World's best AI tools</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Debugging background color
  },
  endTextContainer: {
    alignItems: 'left',
    marginTop: 1,
    marginLeft: 10,
  },
  endText: {
    fontSize: 40,


    opacity: 0.1,
    color: '#000',
  },
  emoji: {
    fontSize: 40,
 
    opacity: 1,
  },
  line: {
    width: '90%',
    height: 1,
    backgroundColor: '#000',
    marginVertical: 10,
    opacity: 0.1,
  },
  crossBee: {
    fontSize: 40,

    opacity: 0.1,

    color: '#000',
  },
  AppYard3: {
    fontSize: 20,

 
    opacity: 0.1,

    color: '#000',
  },
  AppYard: {
    fontSize: 14,


    opacity: 0.1,

      color: '#000',
  },
  AppYard2: {
    fontSize: 16,


    opacity: 0.1,
    marginBottom: 10,
    color: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Adjust the value as needed
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
