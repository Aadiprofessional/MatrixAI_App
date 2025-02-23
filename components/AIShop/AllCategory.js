import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import ImageDealsSection from './ImageDealsSection';
import VideoDealsSection from './VideoDealsSection';
import MusicDealsSection from './MusicDealsSection';
import Banner from './Banner';

const AllCategory = ({ navigation }) => {
  const [bestDeals, setBestDeals] = useState([]);
  const[highlight,setHighlight]=useState([]);
 

  const tabIcons = [
  
    require('../../assets/card/music.png'),
    require('../../assets/card/video1.png'),
    require('../../assets/card/ImageIcon.png'),
    require('../../assets/card/all.png'),
  ];


  const tabs = ['Music', 'Video', 'Image','All Products'];

  return (
    <View style={styles.container}>
        <Text style={styles.title}>All Category</Text>

        <View style={styles.tabContainer}>
            {tabs.map((tab,index)=>(
                <TouchableOpacity 
                  key={index} 
                  style={styles.tab}
                  onPress={() => {
                    if (tab === 'Music') {
                      navigation.navigate('AllMusicAiScreen');
                    } else if (tab === 'Video') {
                      navigation.navigate('AllVideoAIScreen');
                    } else if (tab === 'Image') {
                      navigation.navigate('AllImagesAiScreen');
                    }else if (tab === 'All Products') {
                      navigation.navigate('SearchScreen');
                    }
                    
                  }}
                >
                    <Image source={tabIcons[index]} style={styles.tabIcon} />
                    <Text style={styles.tabText}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>
      <Banner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 10,
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  tab: {
    width: 70,
    height: 70,
    borderRadius: 25,
  

    backgroundColor: '#F9690E',
  },
  tabIcon: {
    width: 50,
    height: 50,
    alignSelf: 'center',
    marginTop: 10,
    tintColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
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
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
  },
  cardList: {
    paddingLeft: 10,
  },
});

export default AllCategory;
