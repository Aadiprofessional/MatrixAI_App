import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
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

const SearchHeader = ({ scrollY, navigation = { navigate: () => {} } }) => {
  const { uid, loading } = useAuth();
  const { addToCart, cart } = useCart();  // Access cart from context
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
  const searchBoxHeight = useRef(new Animated.Value(250)).current; // Use useRef for mutable animated value

  useEffect(() => {
    const targetText = "Let's see the AI world";
    let index = 0;
    setTypingText(''); // Clear text before restarting animation
    const interval = setInterval(() => {
      setTypingText(targetText.slice(0, index + 1));
      index += 1;
      if (index > targetText.length) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Runs every time the component is rendered
  
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
      titleOpacity.setValue(1 - (progress*2)); // Fade out based on scroll progress

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
    <View style={styles.container2}>
      <View style={styles.fixedHeader}>
        <Header navigation={navigation} uid={uid} />
      </View>

      <Animated.View style={[
        styles.container,
        { height: backgroundContainerHeight } // Use the animated height
      ]}>
      <Animated.View
        source={require('../../assets/AIShopImage1.png')}
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
    

      <Animated.View style={[styles.searchContainer, { height: searchBoxHeight }]}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#484848" style={styles.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your products"
            placeholderTextColor="#9F9F9FFF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
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
          <TouchableOpacity onPress={() => navigation.navigate('FillInformationScreen')}>
            <Image
              source={require('../../assets/plus.png')}
              style={styles.plusIcon}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  container2: {
    marginTop:50,
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
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 10,
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
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
  },
    searchContainer: {
    position: 'absolute',
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
  },
  plusIcon: {
    width: 25,
    height: 25,
    tintColor:'#fff'
  },
  icon: {
    marginRight: 10,
    tintColor:'#007BFF'
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
});

export default SearchHeader;
