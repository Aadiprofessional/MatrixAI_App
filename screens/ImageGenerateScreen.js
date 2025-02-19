import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Easing
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const ImageGenerateScreen = () => {
  const [userText, setUserText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [transcription, setTranscription] = useState(
    'Start writing to generate Images (eg: generate tree with red apples)'
  );
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0);
  const sendRotation = new Animated.Value(0);
  const navigation = useNavigation();
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(sendRotation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    ]).start();
  }, []);
  
  const handleSend = () => {
    if (userText.trim().length > 0) {
      setIsFinished(true); // Show buttons after sending the input
    }
  };

  const handleTryAgain = () => {
    setIsFinished(false); // Reset to show the input box again
    setUserText(''); // Clear the text input
    setTranscription(
      'Start writing to generate Images (eg: generate tree with red apples)'
    );
  };

  const handleGenerate = () => {
    navigation.navigate('CreateImageScreen', { message: transcription });
  };
  const handleGenerate2 = () => {
    navigation.navigate('CreateImageScreen2', { message: transcription });
  };

  return (
<Animated.View style={[styles.container, { opacity: fadeAnim }]}>
  {/* Header Animation */}
 
  <Animated.View style={[styles.header, { transform: [{ scale: scaleAnim }] }]}>
             <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
                                 <Image
                                     source={require('../assets/back.png')} 
                                     style={styles.headerIcon}
                                 />
                             </TouchableOpacity>
              <Text style={styles.headerTitle}>Matrix AI</Text>
            
          </Animated.View>
          <Animated.View style={[styles.placeholderContainer, { opacity: fadeAnim }]}>
          <Image   
            source={require('../assets/matrix.png')}
            style={{width: 120, height: 120,resizeMode:'contain',marginTop:20}}
          />
          <Text style={styles.placeholderText}>Hi, Welcome to Matrix AI</Text>
          <Text style={styles.placeholderText2}>What can I generate for you today?</Text>
        </Animated.View>
        <LottieView 
    source={require('../assets/image.json')}
    autoPlay
    loop
    style={{width: '100%', height: 100}}
  />
      {/* Text Input Box */}
      {!isFinished && (
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your prompt here..."
            placeholderTextColor="#999999"
            value={userText}
            onChangeText={(text) => {
              setUserText(text); // Update input
              setTranscription(text || 'Start writing to generate Images (eg: generate tree with red apples)');
            }}
          />
<TouchableOpacity 
  style={styles.sendButton} 
  onPress={handleSend}
 >
    <Image
      source={require('../assets/send2.png')}
      style={[styles.sendIcon, {tintColor: '#FFFFFF'}]}
    />

</TouchableOpacity>
        </View>
      )}

      {/* Buttons */}
      {isFinished && (
        <View style={styles.buttonContainer}>
       
       
        <TouchableOpacity style={styles.generateButton2} onPress={handleGenerate2}>
          <View style={styles.horizontalContent}>
            <View style={styles.generateContent}>
              <Text style={styles.generateText}>Generate</Text>
              <View style={styles.horizontalContent}>
              <Text style={styles.coinText}>-1</Text>
              <Image source={require('../assets/coin.png')} style={styles.coinIcon} />
            </View>
            </View>
            <Image source={require('../assets/send2.png')} style={styles.icon} />
          </View>
        </TouchableOpacity>
      
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <View style={styles.horizontalContent}>
            <View style={styles.generateContent}>
              <Text style={styles.generateText}>Generate IV</Text>
              <View style={styles.horizontalContent}>
              <Text style={styles.coinText}>-4</Text>
              <Image source={require('../assets/coin.png')} style={styles.coinIcon} />
              </View>
            </View>
            <Image source={require('../assets/send2.png')} style={styles.icon} />
          </View>
        </TouchableOpacity>
      </View>
   
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle:{
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  placeholderContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  placeholderImage: { 
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  placeholderText: {
    fontSize: 16,
    color: '#333',

  },
  placeholderText2: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
  },
  tryAgainButton: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
    flex: 1, // Adjust to fit the available space
    marginHorizontal: 5,
  },

  horizontalContent: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center', // Center-align vertically
  },
  icon: {
    width: 16, // Adjust icon size as needed
    height: 16,
    tintColor:'#fff',
    marginLeft:10,
 // Spacing between icon and text
  },
  icon2: {
    width: 16, // Adjust icon size as needed
    height: 16,
    tintColor:'#333',
    marginRight: 5, // Spacing between icon and text
  },
  generateContent: {
    alignItems: 'center', // Center-align text and coin details vertically
  },
  generateText: {
    fontSize: 16,
    color: '#fff',
  },
  coinIcon: {
    width: 12,
    height: 12,
    marginTop: 2, // Spacing between text and the coin icon
  },
  coinText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2, // Align "-1" or "-4" below the icon
  },
  tryAgainText: {
    fontSize: 16,
    color: '#000',
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  transcriptionText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
  textInputContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#F9F9F9',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  sendButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 25,
    marginLeft: 10,
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  buttonContainer: {

    position: 'absolute',
    bottom: 70,
    flexDirection: 'row',
    alignItems: 'center',
  
   
   alignSelf: 'center',
   
  },
  tryAgainButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  tryAgainText: {
    color: '#000000',
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  generateButton2: {
    backgroundColor: '#FF6600FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  generateText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default ImageGenerateScreen;
