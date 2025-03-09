import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Text, ScrollView, Modal, Button } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import Card from '../../components/AIShop/Card';
import VideoCard from '../../components/AIShop/VideoCard';
import MusicCard from '../../components/AIShop/MusicCard';

const SearchScreen = ({ route, navigation }) => {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' for low to high, 'desc' for high to low

  const handleFilterPress = () => {
    setFilterModalVisible(true);
  };

  const handleSortPress = () => {
    setSortModalVisible(true);
  };

const handleFilterSelect = (filter) => {
  setSelectedFilter(filter);
  setFilterModalVisible(false);
  filterProducts(filter);
};

const handleSortSelect = (order) => {
  setSortOrder(order);
  setSortModalVisible(false);
  sortProducts(order);
};
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
    const response = await axios.get('https://matrix-server.vercel.app/getAllProducts');
    const allProducts = [
      ...response.data.images.map(item => ({ ...item, type: 'image' })),
      ...response.data.videos.map(item => ({ ...item, type: 'video' })),
      ...response.data.music.map(item => ({ ...item, type: 'music' }))
    ];
    setProducts(allProducts);
    setFilteredProducts(allProducts); // Initialize filteredProducts with all products
    return allProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

const filterProducts = (filter) => {
  if (filter) {
    const filtered = products.filter(product => product.type === filter);
    setFilteredProducts(filtered);
  } else {
    setFilteredProducts(products);
  }
};

const sortProducts = (order) => {
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (order === 'asc') {
      return a.price - b.price;
    } else {
      return b.price - a.price;
    }
  });
  setFilteredProducts(sortedProducts);
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
     <View style={styles.header}>
                   <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
                                       <Image
                                           source={require('../../assets/back.png')} 
                                           style={styles.headerIcon}
                                       />
                                   </TouchableOpacity>
                    <Text style={styles.headerTitle}>Matrix AI</Text>
                  
                </View>
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
    <TouchableOpacity style={styles.button} onPress={handleFilterPress}>
      <AntDesign name="filter" size={24} color="white" />
      <Text style={styles.buttonText}>Filter</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.button} onPress={handleSortPress}>
      <MaterialIcons name="sort" size={24} color="white" />
      <Text style={styles.buttonText}>Sort</Text>
    </TouchableOpacity>
  </View>

  {/* Filter Modal */}
  <Modal
    animationType="slide"
    transparent={true}
    visible={filterModalVisible}
    onRequestClose={() => {
      setFilterModalVisible(!filterModalVisible);
    }}
  >
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <Text style={styles.modalText}>Select Filter</Text>
<View style={styles.modalButtonContainer}>
  <TouchableOpacity
    style={styles.modalButton}
    onPress={() => handleFilterSelect('image')}
  >
    <Text style={styles.modalButtonText}>Images</Text>
    {selectedFilter === 'image' && <AntDesign name="checkcircle" size={24} color="#007bff" />}
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.modalButton}
    onPress={() => handleFilterSelect('video')}
  >
    <Text style={styles.modalButtonText}>Videos</Text>
    {selectedFilter === 'video' && <AntDesign name="checkcircle" size={24} color="#007bff" />}
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.modalButton}
    onPress={() => handleFilterSelect('music')}
  >
    <Text style={styles.modalButtonText}>Music</Text>
    {selectedFilter === 'music' && <AntDesign name="checkcircle" size={24} color="#007bff" />}
  </TouchableOpacity>
 
</View>
        <Button title="Cancel" onPress={() => setFilterModalVisible(!filterModalVisible)} />
      </View>
    </View>
  </Modal>

  {/* Sort Modal */}
  <Modal
    animationType="slide"
    transparent={true}
    visible={sortModalVisible}
    onRequestClose={() => {
      setSortModalVisible(!sortModalVisible);
    }}
  >
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <Text style={styles.modalText}>Sort By Price</Text>
<View style={styles.modalButtonContainer}>
  <TouchableOpacity
    style={styles.modalButton}
    onPress={() => handleSortSelect('asc')}
  >
    <Text style={styles.modalButtonText}>Low to High</Text>
    {sortOrder === 'asc' && <AntDesign name="checkcircle" size={24} color="#007bff" />}
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.modalButton}
    onPress={() => handleSortSelect('desc')}
  >
    <Text style={styles.modalButtonText}>High to Low</Text>
    {sortOrder === 'desc' && <AntDesign name="checkcircle" size={24} color="#007bff" />}
  </TouchableOpacity>
 
</View>
        <Button title="Cancel" onPress={() => setSortModalVisible(!sortModalVisible)} />
      </View>
    </View>
  </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalButtonContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalButtonText: {
    fontSize: 16,
    marginRight: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {

    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
},
headerTitle: {
    fontSize: 20,
    position:'absolute',
    left:'45%',
    fontWeight: 'bold',
    color: '#007bff',
},
headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
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
    flexDirection: 'row',
    alignContent:'center',
    alignItems:'center'
    
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
