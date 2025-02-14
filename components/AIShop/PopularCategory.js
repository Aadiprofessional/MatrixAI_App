import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ImageDealsSection from './ImageDealsSection';
import VideoDealsSection from './VideoDealsSection';
import MusicDealsSection from './MusicDealsSection';

const PopularCategory = ({ navigation }) => {
  const [bestDeals, setBestDeals] = useState([]);
  const [bestVideoDeals, setBestVideoDeals] = useState([]);
  const [bestMusicDeals, setBestMusicDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [musicLoading, setMusicLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [musicError, setMusicError] = useState(false);

  useEffect(() => {
    const fetchBestDeals = async () => {
      try {
        const response = await fetch('https://matrix-server-gzqd.vercel.app/getBestDealsImageProducts');
        const data = await response.json();
        setBestDeals(data);
      } catch (error) {
        console.error('Error fetching best deals:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBestVideoDeals = async () => {
      try {
        const response = await fetch('https://matrix-server-gzqd.vercel.app/getBestDealsVideoProducts');
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
        const response = await fetch('https://matrix-server-gzqd.vercel.app/getBestDealsMusicProducts');
        const data = await response.json();
        setBestMusicDeals(data);
      } catch (error) {
        console.error('Error fetching music deals:', error);
        setMusicError(true);
      } finally {
        setMusicLoading(false);
      }
    };

    fetchBestDeals();
    fetchBestVideoDeals();
    fetchBestMusicDeals();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best In Images</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ImageDealsSection 
        bestDeals={bestDeals}
        loading={loading}
        navigation={navigation}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best In Videos</Text>
        <TouchableOpacity>
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
        <Text style={styles.sectionTitle}>Best In Music</Text>
        <TouchableOpacity>
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

export default PopularCategory;
