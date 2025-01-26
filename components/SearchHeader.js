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
} from 'react-native';
import Header from './Header.js'
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const SearchHeader = ({ scrollY, navigation = { navigate: () => {} } }) => {
  const [coinCount, setCoinCount] = useState(122);
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

  // Plus button animations
  const plusTop = useRef(new Animated.Value(10)).current;
  const plusRight = useRef(new Animated.Value(10)).current;

  const [typingText, setTypingText] = useState('');

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
    scrollY.addListener(({ value }) => {
      const scrollThreshold = 100;
      const progress = Math.min(value / scrollThreshold, 1);
  
      // Search bar animations
      searchBarHeight.setValue(50 + (200 * (1 - progress))); // Shrinks from 250 to 50
      searchBarWidth.setValue((width - 40) * (1 - progress) + 40 * progress);
      searchBarLeft.setValue(20 * (1 - progress));
      searchBarTop.setValue(100 * (1 - progress) + 10 * progress);
      searchBarRadius.setValue(25 * (1 - progress) + 20 * progress);
  
      // Title animations
      titleLeft.setValue((width / 2 - 100) * (1 - progress) + 80 * progress);
      titleTop.setValue((searchBarHeight._value / 2 - 70) * (1 - progress) + (70 / 2 - 20) * progress);
      titleFontSize.setValue(24 * (1 - progress) + 16 * progress);
  
      // Plus button animations
      plusTop.setValue(10 * (2 - progress));
      plusRight.setValue(10);
    });
  
    return () => scrollY.removeAllListeners();
  }, []);
  
  return (
    <View style={styles.container2}>
      <View style={styles.fixedHeader}>
        <Header coinCount={coinCount}navigation={navigation}  />
      </View>

      <Animated.View style={[
        styles.container,
        { height: searchBarHeight }
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

      <Animated.Text
        style={[
          styles.title,
          { left: titleLeft, top: titleTop, fontSize: titleFontSize },
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

      <Animated.View
        style={[
          styles.searchContainer,
          {
            width: searchBarWidth,
            height: 40,
            left: searchBarLeft,
            top: searchBarTop,
            borderRadius: searchBarRadius,
            backgroundColor: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: ['rgba(255, 255, 255, 0.9)', '#FFFFFF00'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        {showSearch ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search Item"
            placeholderTextColor="#999"
            onBlur={() => setShowSearch(false)}
          />
        ) : (
          <Image
            source={require('../assets/search.png')}
            style={styles.searchIcon}
            onStartShouldSetResponder={() => {
              setShowSearch(true);
            }}
          />
        )}
      </Animated.View>

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
  title: {
    position: 'absolute',
    top: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
    searchContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
});

export default SearchHeader;
