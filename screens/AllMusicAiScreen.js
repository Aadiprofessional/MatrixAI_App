import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MusicDealsSection from '../components/AIShop/MusicDealsSection';
import Banner from '../components/AIShop/Banner';

const AllMusicAiScreen = ({ navigation }) => {
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
    fetchHighlightMusic();
  
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.header}>    
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
                <Image source={require('../assets/back.png')} style={styles.backButtonIcon} />
            </TouchableOpacity>
            <Text style={styles.title}>All Music Ai</Text>
            </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best In Music</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SeeAllScreen', { category: 'Music', type: 'Best Deals' })}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <MusicDealsSection
        bestMusicDeals={bestMusicDeals}
        musicLoading={musicLoading}
        musicError={musicError}
        navigation={navigation}
      />
         <Banner />
       <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Highlighted Music</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SeeAllScreen', { category: 'Music', type: 'Highlighted' })}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
     
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
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

export default AllMusicAiScreen;
