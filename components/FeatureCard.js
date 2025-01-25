import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window'); // Get the screen width

const FeatureCard = ({ title, description, iconSource, navigation, targetScreen }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  // Interpolate the rotation value into a rotation degree
  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(targetScreen)} // Navigate to the target screen
    >
      {/* Animated Gradient Background */}
      <Animated.View
        style={[
          styles.animatedGradientContainer,
          {
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        <LinearGradient
          colors={['#D9D3FCFF', '#20BDFF', '#A5FECB']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientBackground}
        />
      </Animated.View>

      {/* Circle with icon */}
      <View style={styles.circleContainer}>
        <Image source={iconSource} style={styles.icon} />
      </View>

      {/* Card content */}
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.40, // 40% of the screen width
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
    alignItems: 'flex-start',
    overflow: 'hidden', // Ensures gradient stays inside card
  },
  animatedGradientContainer: {
    position: 'absolute',
    width: 350, // Diameter of the circle
    height: 350,
    borderRadius: 75, // Ensures it's circular
    top: -80, // Position above the card content
    left: -40, // Slightly offset to the left
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 75, // Circular shape
  },
  circleContainer: {
    width: 50,
    height: 50,
    borderRadius: 25, // Circle shape
    backgroundColor: '#FF6600',
    borderColor: '#FF6600', // Orange color border
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F3F3FF',
    textAlign: 'left', // Left align the title
    width: '100%',
  },
  cardDescription: {
    fontSize: 14,
    color: '#FFFFFFFF',
    marginTop: 5,
    textAlign: 'left',
    width: '100%',
  },
});

export default FeatureCard;
