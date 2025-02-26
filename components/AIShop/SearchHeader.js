import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

import {
  View,
  Text,
  TextInput,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import { supabase } from '../../supabaseClient';

import * as Animatable from 'react-native-animatable';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Icon from 'react-native-vector-icons/Feather';

import Header from '../Header';
import { useCart } from '../CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useCoinsSubscription } from '../../hooks/useCoinsSubscription';

const { width } = Dimensions.get('window');

const SearchHeader = ({ scrollY, navigation = { navigate: () => {} }, closeDropdown }) => {
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const handlePressOutside = (event) => {
    if (!showDropdown) return;

    const { pageX, pageY } = event.nativeEvent;

    // Get the layout of the dropdown
    dropdownRef.current.measure((fx, fy, width, height, px, py) => {
      const isInsideDropdown = pageX >= px && pageX <= px + width && pageY >= py && pageY <= py + height;

      // Get the layout of the searchInput
      searchInputRef.current.measure((fx, fy, width, height, px, py) => {
        const isInsideSearchInput = pageX >= px && pageX <= px + width && pageY >= py && pageY <= py + height;

        if (!isInsideDropdown && !isInsideSearchInput) {
          setShowDropdown(false);
          if (closeDropdown) {
            closeDropdown();
          }
        }
      });
    });
  };

  const { uid, loading } = useAuth();
  const { addToCart, cart } = useCart();
console.log('useCart result:', { addToCart, cart }); // Log the result of useCart
  const [isSeller, setIsSeller] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (uid) {
      checkUserStatus();
    }
  }, [uid]);

  const checkUserStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('seller, verified')
        .eq('uid', uid)
        .single();

      if (error) throw error;

      if (data) {
        setIsSeller(data.seller);
        setIsVerified(data.verified);
      }
    } catch (error) {
      console.error('Error checking user status:', error.message);
    }
  };
  
  const titleOpacity = useRef(new Animated.Value(1)).current;

  // Plus button animations
  const plusTop = useRef(new Animated.Value(10)).current;
  const plusRight = useRef(new Animated.Value(10)).current;

  const cartLeft = useRef(new Animated.Value(10)).current;
  const [typingText, setTypingText] = useState('');
  const coinCount = useCoinsSubscription(uid);

  // Define backgroundOpacity as a ref
  const backgroundOpacity = useRef(new Animated.Value(1)).current;

  // Set initial height for the background image container
  const backgroundContainerHeight = useRef(new Animated.Value(200)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchBoxHeightValue, setSearchBoxHeightValue] = useState(200); // Track search box height

  const searchBoxHeight = useRef(new Animated.Value(250)).current; // Use useRef for mutable animated value
  const [searchHeight, setSearchHeight] = useState(250);

  useEffect(() => {
    fetchProducts();
    
    const targetText = "Let's see the AI world";
    let index = 0;
    setTypingText(''); // Clear text before restarting animation
    const interval = setInterval(() => {
      setTypingText(targetText.slice(0, index + 1));
      index += 1;
      if (index > targetText.length) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  
  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://matrix-server.vercel.app/getAllProducts');
      const allProducts = [
        ...response.data.images.map(item => ({...item, type: 'image'})),
        ...response.data.videos.map(item => ({...item, type: 'video'})),
        ...response.data.music.map(item => ({...item, type: 'music'}))
      ];
      setProducts(allProducts);
      setFilteredProducts(allProducts.slice(0, 3));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

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

  const handleSearchNavigation = () => {
    if (searchQuery.trim()) {
      navigation.navigate('SearchScreen', {searchQuery });
    }
  };

  useEffect(() => {
    const scrollThreshold = 150; // Adjust threshold as needed

    const listenerId = scrollY.addListener(({ value }) => {
      const progress = Math.min(value / scrollThreshold, 1);

      // Update the height of the search box from 100 to 50
      searchBoxHeight.setValue(250 * (1 - progress) + 50 * progress); // From 100 to 50

      // Update the background image visibility based on scroll
      backgroundOpacity.setValue(Math.max(1 - progress, 0)); // Update opacity based on scroll

      // Update the height of the background container
      backgroundContainerHeight.setValue(200 * (1 - progress) + 50 * progress); // From 200 to 50

      // Adjust title opacity to fade out smoothly
      titleOpacity.setValue(1 - (progress * 2)); // Fade out based on scroll progress

      // Plus button animations
      plusTop.setValue(10 * (1.5 - progress));
      plusRight.setValue(10);
      cartLeft.setValue(10);
    });

    return () => {
      scrollY.removeListener(listenerId); // Clean up listener
    };
  }, [scrollY]); // Ensure scrollY is included in the dependency array

  return (
    <TouchableWithoutFeedback onPress={handlePressOutside}>
      <View style={styles.container2}>
        <View>
          <View style={styles.fixedHeader}>
            <Header navigation={navigation} uid={uid} />
          </View>

          <Animated.View style={[
            styles.container,
            { height: backgroundContainerHeight } // Use the animated height
          ]}>
            <Animated.View
              style={[
                styles.backgroundImageContainer,
                {
                  backgroundColor: scrollY.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['transparent', '#007BFF'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Animated.Image
                source={require('../../assets/AIShop.png')}
                style={[
                  styles.backgroundImage,
                  {
                    opacity: scrollY.interpolate({
                      inputRange: [0, 100],
                      outputRange: [1, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </Animated.View>

            <View style={styles.titleContainer}>
              <Animated.Text
                style={[
                  styles.title,
                  { opacity: titleOpacity },
                ]}
              >
                {typingText !== '' && (
                  <View style={styles.speechBubble}>
                    <Animatable.Text animation="fadeIn" style={styles.typingText}>
                      {typingText}
                    </Animatable.Text>
                  </View>
                )}
              </Animated.Text>
            </View>
          
            <Animated.View
              style={[styles.searchAndDropdownContainer, { height: searchBoxHeight }]}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setSearchBoxHeightValue(height); // Update search box height
              }}
            >
              <View style={styles.searchBox}>
                <TextInput
                  ref={searchInputRef} // Attach the ref here
                  style={styles.searchInput}
                  placeholder="Search your products"
                  placeholderTextColor="#9F9F9FFF"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  onSubmitEditing={() => handleSearchNavigation()}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setShowDropdown(false)} // Close dropdown on blur
                  returnKeyType="search"
                />
                <TouchableOpacity onPress={() => handleSearchNavigation()} style={styles.icon} >
                  <Icon name="search" size={20} color="#484848"  />
                </TouchableOpacity>
              </View>
            </Animated.View>
            <Animated.View
              style={[
                styles.plusContainer,
                {
                  top: plusTop,
                  left: cartLeft,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <View style={styles.cartIconContainer}>
                  <Icon name="shopping-cart" size={24} color="white" />
                  {cart.length > 0 && (
                    <View style={styles.cartItemCount}>
                      <Text style={styles.cartItemCountText}>{cart.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
            {isSeller && isVerified && (
              <Animated.View
                style={[
                  styles.plusContainer,
                  {
                    top: plusTop,
                    right: plusRight,
                  },
                ]}
              >
                <TouchableOpacity onPress={() => navigation.navigate('AddProductScreen')}>
                  <Image
                    source={require('../../assets/plus.png')}
                    style={styles.plusIcon}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>

          {showDropdown && (
            <TouchableWithoutFeedback>
              <Animated.View
                ref={dropdownRef}
                style={[
                  styles.dropdown,
                  {
                    top: searchBoxHeight.interpolate({
                      inputRange: [50, 250], // Adjust these based on your min/max search box height
                      outputRange: [100, 200], // 50 + 10 to 250 + 10
                    }),
                  },
                ]}
              >
                {filteredProducts.map((product, index) => {
                  const navigateToDetail = () => {
                    if (product.type === 'music') {
                      navigation.navigate('ProductDetail', { musicproductid: product.musicproductid });
                    } else if (product.type === 'video') {
                      navigation.navigate('ProductDetail', { videoproductid: product.videoproductid });
                    } else if (product.type === 'image') {
                      navigation.navigate('ProductDetail', { imageproductid: product.imageproductid });
                    }
                  };

                  return (
                    <TouchableOpacity key={index} onPress={navigateToDetail} style={styles.dropdownItem}>
                      <Text>{product.name} ({product.type})</Text>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#fff', // Debugging background color
  },
  container2: {
     
    zIndex: 1, // Ensure the main container has a lower zIndex
  },
  typingText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  backgroundImageContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
    zIndex: 2, // Ensure the background image is below the dropdown
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    resizeMode: 'cover',
    left: 0,
    right: 0,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    zIndex: 3, // Ensure the header is below the dropdown
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  titleContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4, // Ensure the title is below the dropdown
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
  },
  searchAndDropdownContainer: {
    position: 'absolute',
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    zIndex: 5, // Ensure the search and dropdown container is below the dropdown
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '100%',
  },
  searchInput: {
    fontSize: 16,
    paddingRight: 50,
  },
  plusContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6, // Ensure the plus container is below the dropdown
  },
  plusIcon: {
    width: 25,
    height: 25,
    tintColor: '#fff'
  },
  icon: {
    position: 'absolute',
    right: 10,
    tintColor: '#007BFF'
  },
  cartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  cartIconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
  },  
  cartItemCount: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cartItemCountText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex:  50, // Directly use showDropdown in the style
    width: '70%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  dropdownItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
});

export default SearchHeader;
