import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ImageDealsSection from './ImageDealsSection';

import Banner from './Banner';

const ImageCategory = ({ navigation }) => {
  const [bestDeals, setBestDeals] = useState([]);
  const[highlight,setHighlight]=useState([]);

  const [loading, setLoading] = useState(true);

  const [imageHighlightLoading, setImageHighlightLoading] = useState(true);
  

  const [imageError, setImageError] = useState(false);
  const [imageHighlightError, setImageHighlightError] = useState(false);




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

   
fetchHighlight();
    fetchBestDeals();
   
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
         <Banner />
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

export default ImageCategory;
