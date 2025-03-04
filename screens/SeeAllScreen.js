import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import Card from '../components/AIShop/Card';
import VideoCard from '../components/AIShop/VideoCard';
import MusicCard from '../components/AIShop/MusicCard';
import { SafeAreaView } from 'react-native-safe-area-context';
const SeeAllScreen = ({ navigation, route }) => {
  const [bestDeals, setBestDeals] = useState([]);
  const [highlight, setHighlight] = useState([]);
  const [bestVideoDeals, setBestVideoDeals] = useState([]);
  const [videoHighlight, setVideoHighlight] = useState([]);
  const [bestMusicDeals, setBestMusicDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageHighlightError, setImageHighlightError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoHighlightError, setVideoHighlightError] = useState(false);
  const [imageHighlightLoading, setImageHighlightLoading] = useState(true);
  const [videoHighlightLoading, setVideoHighlightLoading] = useState(true);
  const { category, type } = route.params;

  useEffect(() => {
    if (category === 'Images') {
      if (type === 'Best Deals') {
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
        fetchBestDeals();
      } else if (type === 'Highlighted') {
        const fetchHighlight = async () => {
          try {
            const response = await fetch('https://matrix-server.vercel.app/getHighlightsImageProducts');
            const data = await response.json();
            setHighlight(data);
          } catch (error) {
            console.error('Error fetching highlights:', error);
            setImageHighlightError(true);
          } finally {
            setImageHighlightLoading(false);
          }
        };
        fetchHighlight();
      }
    } else if (category === 'Videos') {
      if (type === 'Best Deals') {
        const fetchBestVideoDeals = async () => {
          try {
            const response = await fetch('https://matrix-server.vercel.app/getBestDealsVideoProduct');
            const data = await response.json();
            setBestVideoDeals(data);
          } catch (error) {
            console.error('Error fetching video deals:', error);
            setVideoError(true);
          } finally {
            setLoading(false);
          }
        };
        fetchBestVideoDeals();
      } else if (type === 'Highlighted') {
        const fetchHighlightVideo = async () => {
          try {
            const response = await fetch('https://matrix-server.vercel.app/getHighlightsVideoProduct');
            const data = await response.json();
            setVideoHighlight(data);
          } catch (error) {
            console.error('Error fetching video highlights:', error);
            setVideoHighlightError(true);
          } finally {
            setVideoHighlightLoading(false);
          }
        };
        fetchHighlightVideo();
      }
    } else if (category === 'Music') {
      if (type === 'Best Deals') {
        const fetchBestMusicDeals = async () => {
          try {
            const response = await fetch('https://matrix-server.vercel.app/getBestDealsMusicProduct');
            const data = await response.json();
            setBestMusicDeals(data);
          } catch (error) {
            console.error('Error fetching music deals:', error);
            setVideoError(true);
          } finally {
            setLoading(false);
          }
        };
        fetchBestMusicDeals();
      } else if (type === 'Highlighted') {
        const fetchHighlightMusic = async () => {
          try {
            const response = await fetch('https://matrix-server.vercel.app/getHighlightsMusicProduct');
            const data = await response.json();
            setBestMusicDeals(data);
          } catch (error) {
            console.error('Error fetching music highlights:', error);
            setVideoHighlightError(true);
          } finally {
            setVideoHighlightLoading(false);
          }
        };
        fetchHighlightMusic();
      }
    }
  }, [category, type]);

  const Header = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} >
          <Image source={require('../assets/back.png')} style={styles.backButtonIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>All Deals</Text>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{category} Deals</Text>
        <Text style={styles.sectionSubtitle}>{type} Deals</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    if (category === 'Images') {
      return (
        <Card
          key={item.id}
          title={item.name}
          price={`$${item.price}`}
          image={{ uri: item.image_url }}
          imageproductid={item.imageproductid}
          navigation={navigation}
        />
      );
    } else if (category === 'Videos') {
      return (
        <VideoCard 
          title={item.name} 
          price={`$${item.price}`} 
          image={item.thumbnail_url} 
          navigation={navigation}
          videoproductid={item.videoproductid}
          videoUrl={item.video_url}
          new_label={item.new_label}
        />
      );
    } else if (category === 'Music') {
      return (
        <MusicCard 
          title={item.name} 
          price={`$${item.price}`} 
          navigation={navigation} 
          owner={item.name}
          musicproductid={item.musicproductid}
          item={item}
        />
      );
    }
  };

  const getData = () => {
    if (category === 'Images') {
      return type === 'Best Deals' ? bestDeals : highlight;
    } else if (category === 'Videos') {
      return type === 'Best Deals' ? bestVideoDeals : videoHighlight;
    } else if (category === 'Music') {
      return bestMusicDeals;
    }
    return [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={getData()}
        numColumns={2}
        ListHeaderComponent={Header}
        keyExtractor={(item) => 
          category === 'Images' ? item.imageproductid :
          category === 'Videos' ? item.videoproductid :
          item.musicproductid
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No Data Found</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',

  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
     
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backButtonIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionHeader: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default SeeAllScreen;
