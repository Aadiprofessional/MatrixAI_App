import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import VideoDealsSection from '../components/AIShop/VideoDealsSection';
import Banner from '../components/AIShop/Banner';
import { SafeAreaView } from 'react-native-safe-area-context';
const AllVideoAIScreen = ({ navigation }) => {
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

   
    fetchBestVideoDeals();
    fetchHighlightVideo();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
                <Image source={require('../assets/back.png')} style={styles.backButtonIcon} />
            </TouchableOpacity>
                <Text style={styles.title}>All Video Ai</Text>
        </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best In Videos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SeeAllScreen', { category: 'Videos', type: 'Best Deals' })} >
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <VideoDealsSection
        bestVideoDeals={bestVideoDeals}
        videoLoading={videoLoading}
        videoError={videoError}
        navigation={navigation}
      />

      <Banner />
        <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Highlighted Videos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SeeAllScreen', { category: 'Videos', type: 'Highlighted' })}>
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
    </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
     
  },    
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },    
  backButtonIcon: {
    width: 24,
    height: 24,
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

export default AllVideoAIScreen;
