import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ImageDealsSection from './ImageDealsSection';
import VideoDealsSection from './VideoDealsSection';
import MusicDealsSection from './MusicDealsSection';
import Banner from './Banner';

const MusicCategory2 = ({ navigation }) => {
  const [bestDeals, setBestDeals] = useState([]);
  const[highlight,setHighlight]=useState([]);
  const [bestVideoDeals, setBestVideoDeals] = useState([]);
  const [bestMusicDeals, setBestMusicDeals] = useState([]);
  const [musicHighlight, setMusicHighlight] = useState([]);
  const [videoHighlight, setVideoHighlight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [musicHighlightLoading, setMusicHighlightLoading] = useState(true);
  const [videoHighlightLoading, setVideoHighlightLoading] = useState(true);
  const [imageHighlightLoading, setImageHighlightLoading] = useState(true);
  
  const [musicLoading, setMusicLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageHighlightError, setImageHighlightError] = useState(false);
  const [videoHighlightError, setVideoHighlightError] = useState(false);
  const [musicHighlightError, setMusicHighlightError] = useState(false);
  const [musicError, setMusicError] = useState(false);



  useEffect(() => {
    

  
  
    const fetchBestMusicDeals = async () => {
      try {
        const response = await fetch('https://matrix-server.vercel.app/getBestDealsMusicProduct');
        const data = await response.json();
        setBestMusicDeals(data);
      } catch (error) {
        console.error('Error fetching music deals:', error);
        setMusicError(true);
      } finally {
        setMusicLoading(false);
      }
    };

    fetchBestMusicDeals();
    
  }, []);

  const handleSeeAllPress = (category, type) => {
    navigation.navigate('SeeAllScreen', { category, type });
  };

  return (
    <View style={styles.container}>
    
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Related Music</Text>
        <TouchableOpacity onPress={() => handleSeeAllPress('Music', 'Best Deals')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <MusicDealsSection
        bestMusicDeals={bestMusicDeals}
        musicLoading={musicLoading}
        musicError={musicError}
        navigation={navigation}
      />
     
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

export default MusicCategory2;
