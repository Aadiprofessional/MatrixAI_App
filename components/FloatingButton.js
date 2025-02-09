import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Image, View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import ChatSlider from './ChatSlider';

const FloatingButton = () => {
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  const [typingText, setTypingText] = useState('');

  // Typing effect that runs when the screen is navigated to
  useEffect(() => {
    const targetText = 'Ask Matrix Bot';
    let index = 0;
    setTypingText(''); // Clear text before restarting animation
    const interval = setInterval(() => {
      setTypingText(targetText.slice(0, index + 1));
      index += 1;
      if (index > targetText.length) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Runs every time the component is rendered

  // Toggle ChatSlider visibility
  const toggleSlider = () => {
    setIsSliderVisible((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Typing Animation Above Button */}
      {typingText !== '' && (
        <Animatable.View animation="fadeInUp" duration={800} style={styles.popup}>
          <View style={styles.speechBubble}>
            <Animatable.Text animation="fadeIn" style={styles.typingText}>
              {typingText}
            </Animatable.Text>
            <View style={styles.triangle} />
          </View>
        </Animatable.View>
      )}

      {/* Floating Button */}
      <TouchableOpacity onPress={toggleSlider} style={styles.floatingButton}>
        <Image
          source={require('../assets/robot.png')} // Replace with your image path
          style={styles.buttonImage}
        />
      </TouchableOpacity>

      {/* ChatSlider Component */}
      <Animatable.View
        animation={isSliderVisible ? 'slideInUp' : 'fadeOutDown'}
        duration={500}
        style={styles.chatSliderContainer}
      >
        <ChatSlider isVisible={isSliderVisible} setIsVisible={setIsSliderVisible} />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  popup: {
    position: 'absolute',
    bottom: 160, // Position above the floating button
    right: 20,
    zIndex: 999,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderColor: '#ccc',
    borderWidth: 1,
  },
  triangle: {
    position: 'absolute',
    bottom: -10,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#85858549',
  },
  typingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  chatSliderContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
});

export default FloatingButton;
