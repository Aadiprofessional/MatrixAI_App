import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ImageDealsSection from './ImageDealsSection';
import VideoDealsSection from './VideoDealsSection';
import MusicDealsSection from './MusicDealsSection';
import Banner from './Banner';

const PopularCategory = ({ navigation }) => {
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
    const fetchBestDeals = async () => {
      try {
        const response = await fetch('https://matrix-server.vercel.app/getBestDealsImageProducts');
        const data = await response.json();
        setBestDeals(data);
      } catch (error) {
        console.error('Error fetching best deals:', error);
        setImageError(true);
      } finally {
        setLoading(false);
      }
    };
    const fetchHighlight = async () => {
      try {
        const response = await fetch('https://matrix-server.vercel.app/getHighlightsImageProducts');
        const data = await response.json();
        setHighlight(data);
      } catch (error) {
        console.error('Error fetching best deals:', error);
        setImageHighlightError(true);
      } finally {
        setImageHighlightLoading(false);
      }
    };

    const fetchHighlightVideo = async () => {
      try {
        const response = await fetch('https://matrix-server.vercel.app/getHighlightsVideoProduct');
        const data = await response.json();
        setVideoHighlight(data);
      } catch (error) {
        console.error('Error fetching best deals:', error);
        setVideoHighlightError(true);
      } finally {
        setVideoHighlightLoading(false);
      }
    };

    const fetchHighlightMusic = async () => {
      try {
        const response = await fetch('https://matrix-server.vercel.app/getHighlightsMusicProduct');
        const data = await response.json();
        setMusicHighlight(data);
      } catch (error) {
        console.error('Error fetching best deals:', error);
        setMusicHighlightError(true);
      } finally {
        setMusicHighlightLoading(false);
      }
    };
    const fetchBestVideoDeals = async () => {
      try {
        const response = await fetch('https://matrix-server.vercel.app/getBestDealsVideoProduct');
        const data = await response.json();
        setBestVideoDeals(data);
      } catch (error) {
        console.error('Error fetching video deals:', error);
        setVideoError(true);
      } finally {
        setVideoLoading(false);
      }
    };

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
fetchHighlight();
    fetchBestDeals();
    fetchBestVideoDeals();
    fetchBestMusicDeals();
    fetchHighlightMusic();
    fetchHighlightVideo();
  }, []);

  const handleSeeAllPress = (category, type) => {
    navigation.navigate('SeeAllScreen', { category, type });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best In Images</Text>
        <TouchableOpacity onPress={() => handleSeeAllPress('Images', 'Best Deals')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ImageDealsSection 
        bestDeals={bestDeals}
        loading={loading}
        navigation={navigation}
        imageError={imageError}
      />
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Highlighted Images</Text>
        <TouchableOpacity onPress={() => handleSeeAllPress('Images', 'Highlighted')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ImageDealsSection 
        bestDeals={highlight}
        loading={imageHighlightLoading}
        navigation={navigation}
        imageError={imageHighlightError}
      />
         <Banner />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best In Videos</Text>
        <TouchableOpacity onPress={() => handleSeeAllPress('Videos', 'Best Deals')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <VideoDealsSection
        bestVideoDeals={bestVideoDeals}
        videoLoading={videoLoading}
        videoError={videoError}
        navigation={navigation}
      />
        <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Highlighted Videos</Text>
        <TouchableOpacity onPress={() => handleSeeAllPress('Videos', 'Highlighted')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <VideoDealsSection
        bestVideoDeals={videoHighlight}
        videoLoading={videoHighlightLoading}
        videoError={videoHighlightError}
        navigation={navigation}
      />
   <Banner />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best In Music</Text>
        <TouchableOpacity onPress={() => handleSeeAllPress('Music', 'Best Deals')}  >
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <MusicDealsSection
        bestMusicDeals={bestMusicDeals}
        musicLoading={musicLoading}
        musicError={musicError}
        navigation={navigation}
      />
       <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Highlighted Music</Text>
          <TouchableOpacity onPress={() => handleSeeAllPress('Music', 'Highlighted')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <MusicDealsSection
        bestMusicDeals={musicHighlight}
        musicLoading={musicHighlightLoading}
        musicError={musicHighlightError}
        navigation={navigation}
      />
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

export default PopularCategory;
