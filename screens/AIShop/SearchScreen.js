import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import axios from 'axios';
import Card from '../../components/AIShop/Card';
import VideoCard from '../../components/AIShop/VideoCard';
import MusicCard from '../../components/AIShop/MusicCard';

const SearchScreen = ({ route, navigation }) => {
  const { searchQuery: initialSearchQuery } = route.params;
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (initialSearchQuery) {
      handleSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products.slice(0, 3));
    }
    setShowDropdown(true);
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
      setFilteredProducts(allProducts.slice(0, 3));
    } catch (error) {
      console.error('Error fetching products:', error);
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
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {filteredProducts.length > 0 && (
        <>
          {renderSection(
            'Videos',
            filteredProducts.filter(product => product.type === 'video'),
            ({ item }) => <VideoCard video={item} />,
            item => item.videoproductid.toString()
          )}
          {renderSection(
            'Music',
            filteredProducts.filter(product => product.type === 'music'),
            ({ item }) => <MusicCard music={item} />,
            item => item.musicproductid.toString()
          )}
          {renderSection(
            'Images',
            filteredProducts.filter(product => product.type === 'image'),
            ({ item }) => <Card product={item} />,
            item => item.imageproductid.toString()
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
