import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Lottie from 'lottie-react-native';

const SuccessScreen = ({ navigation }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.reset();
      }
    };
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lottie
          ref={animationRef}
          source={require('../assets/success.json')}
          autoPlay
          loop={true}
          style={{ width: 200, height: 200 }}
        />
      </View>
      <Text style={styles.title}>Success!</Text>
      <Text style={styles.subtitle}>
        You have successfully become your Ai shop owner
      </Text>
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.navigate('ManageProductsScreen')}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7D7D7D',
    textAlign: 'center',
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SuccessScreen;
