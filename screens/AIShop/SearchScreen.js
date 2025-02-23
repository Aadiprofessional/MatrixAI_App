import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Text, ScrollView } from 'react-native';
import axios from 'axios';
import Card from '../../components/AIShop/Card';
import VideoCard from '../../components/AIShop/VideoCard';
import MusicCard from '../../components/AIShop/MusicCard';

const SearchScreen = ({ route, navigation }) => {
  const { searchQuery } = route.params || {};
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState(searchQuery || '');
  const [showButtons, setShowButtons] = useState(true);
  const scrollOffset = useRef(0);

  useEffect(() => {
    const initialize = async () => {
      const allProducts = await fetchProducts();
      if (searchQuery) {
        const filtered = allProducts.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(allProducts);
      }
    };
    initialize();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    if (scrollOffset.current > currentOffset) {
      setShowButtons(true);
    } else {
      setShowButtons(false);
    }
    scrollOffset.current = currentOffset;
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://matrix-server-gzqd.vercel.app/getAllProducts');
      const allProducts = [
        ...response.data.images.map(item => ({ ...item, type: 'image' })),
        ...response.data.videos.map(item => ({ ...item, type: 'video' })),
        ...response.data.music.map(item => ({ ...item, type: 'music' }))
      ];
      setProducts(allProducts);
      return allProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const renderSection = (title, data, renderItem, keyExtractor) => {
    if (data.length > 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image source={require('../../assets/back.png')} style={styles.backIcon} />
      </TouchableOpacity>
      <TextInput
        style={styles.searchBox}
        placeholder="Search..."
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          handleSearch(text);
        }}
      />
      <ScrollView style={styles.scrollView} onScroll={handleScroll}bounces={false}   showsVerticalScrollIndicator={false}>
        {filteredProducts.length > 0 && (
          <>
            {renderSection(
              'Videos',
              filteredProducts.filter(product => product.type === 'video'),
              ({ item }) => (
                <VideoCard 
                  title={item.name} 
                  price={`$${item.price}`} 
                  image={item.thumbnail_url} 
                  navigation={navigation}
                  videoproductid={item.videoproductid}
                  videoUrl={item.video_url}
                  new_label={item.new_label}
                />
              ),
              item => item.videoproductid.toString()
            )}
            {renderSection(
              'Music',
              filteredProducts.filter(product => product.type === 'music'),
              ({ item }) => (
                <MusicCard 
                  title={item.name} 
                  price={`$${item.price}`} 
                  navigation={navigation} 
                  owner={item.name}
                  musicproductid={item.musicproductid}
                  item={item}
                />
              ),
              item => item.musicproductid.toString()
            )}
            {renderSection(
              'Images',
              filteredProducts.filter(product => product.type === 'image'),
              ({ item }) => (
                <Card
                  key={item.id}
                  title={item.name}
                  price={`$${item.price}`}
                  image={{ uri: item.image_url }}
                  imageproductid={item.imageproductid}
                  navigation={navigation}
                />
              ),
              item => item.imageproductid.toString()
            )}
          </>
        )}
      </ScrollView>
      <View style={[styles.buttonContainer, !showButtons && styles.hidden]}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Button 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Button 2</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius:20,
    transition: 'transform 0.3s ease', // For smooth transition
  },
  hidden: {
    transform: [{ translateY: 100 }], // Move down to hide
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 56, // Adjust padding to make space for the back button
  },
  searchBox: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});

export default SearchScreen;
