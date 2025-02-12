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
import Header from './Header.js'
import * as Animatable from 'react-native-animatable';
import { useCoinsSubscription } from '../hooks/useCoinsSubscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const SearchHeader = ({ scrollY, navigation = { navigate: () => {} } }) => {
  const { uid, loading } = useAuth();

  // Animations
  const [showSearch, setShowSearch] = useState(true);
  const searchBarWidth = useRef(new Animated.Value(width - 40)).current;
  const searchBarHeight = useRef(new Animated.Value(40)).current;
  const searchBarLeft = useRef(new Animated.Value((width - (width - 40)) / 2)).current;
  const searchBarTop = useRef(new Animated.Value((Dimensions.get('window').height - 40) / 2 - 100)).current;
  const searchBarRadius = useRef(new Animated.Value(20)).current;
  const searchBarOpacity = useRef(new Animated.Value(1)).current;

  // Title animations
  const titleLeft = useRef(new Animated.Value(width / 2 - 100)).current;
  const titleTop = useRef(new Animated.Value(100)).current; // Initial position at top of container
  const titleFontSize = useRef(new Animated.Value(24)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;

  // Plus button animations
  const plusTop = useRef(new Animated.Value(10)).current;
  const plusRight = useRef(new Animated.Value(10)).current;
  const searchBoxOpacity = useRef(new Animated.Value(1)).current;

  const [typingText, setTypingText] = useState('');
  const coinCount = useCoinsSubscription(uid);

  // Define backgroundOpacity as a ref
  const backgroundOpacity = useRef(new Animated.Value(1)).current;

  // Set initial height for the background image container
  const backgroundContainerHeight = useRef(new Animated.Value(200)).current;

  const [searchQuery, setSearchQuery] = useState('');

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

      // Update the height of the search bar from 120 to 50
 

      // Update the background image visibility based on scroll
      backgroundOpacity.setValue(Math.max(1 - progress, 0)); // Update opacity based on scroll

      // Update the height of the background container
      backgroundContainerHeight.setValue(200 * (1 - progress) + 50 * progress); // From 200 to 50

      // Adjust title opacity to fade out smoothly
      titleOpacity.setValue(1 - progress); // Fade out based on scroll progress

      // Plus button animations
      plusTop.setValue(10 * (1.5 - progress));
      plusRight.setValue(10);
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
          source={require('../assets/AIShop.png')}
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
          resizeMode="cover"
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

      <View style={[styles.searchContainer,   {
         
           
          },]}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#484848" style={styles.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your products"
            placeholderTextColor="#484848"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </View>

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
            source={require('../assets/plus.png')}
            style={styles.plusIcon}
          />
        </TouchableOpacity>
      </Animated.View>
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
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  speechBubble: {
    maxWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'center',
    alignItems: 'center',
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
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
    paddingHorizontal: 10,
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
});

export default SearchHeader;
