import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ImageDealsSection from './ImageDealsSection';

import Banner from './Banner';

const ImageCategory2 = ({ navigation }) => {
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
 

   

    fetchBestDeals();
   
  }, []);

  const handleSeeAllPress = (category, type) => {
    navigation.navigate('SeeAllScreen', { category, type });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Related Images</Text>
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

export default ImageCategory2;
