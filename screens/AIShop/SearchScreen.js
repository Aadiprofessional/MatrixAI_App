import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import ProductCard from '../../components/ProductCard'; // Assuming a ProductCard component exists

const SearchScreen = ({ route }) => {
  const { searchQuery } = route.params;
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBox}
        placeholder="Search..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductCard product={item} />}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
});

export default SearchScreen;
