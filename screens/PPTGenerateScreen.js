import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PPTGenerateScreen = () => {
  const [userText, setUserText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [transcription, setTranscription] = useState('Tell me About Your PPT');
  const [selectedNumber, setSelectedNumber] = useState(1); // Default selection
  const navigation = useNavigation();

  const handleSend = () => {
    if (userText.trim().length > 0) {
      setIsFinished(true);
    }
  };

  const handleGenerate = () => {
    navigation.navigate('CreatePPTScreen', { message: transcription, number: selectedNumber });
  };
  const backgrounds = {
    1: require('../assets/bg/bg1.jpg'),
    2: require('../assets/bg/bg2.jpg'),
    3: require('../assets/bg/bg3.jpg'),
    4: require('../assets/bg/bg4.jpg'),
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      {/* Transcription Text */}
      <Text style={styles.transcriptionText}>{transcription}</Text>

      {/* Selection Rectangles */}
      {isFinished && (
     <View style={styles.selectionContainer}>
     {[1, 2, 3, 4].map((num) => (
       <TouchableOpacity
         key={num}
         style={[styles.rectangle, selectedNumber === num && styles.selectedRectangle]}
         onPress={() => setSelectedNumber(num)}
       >
         <Image source={backgrounds[num]} style={styles.image} />
        
       </TouchableOpacity>
     ))}
   </View>
    
      )}

      {/* Text Input */}
      {!isFinished && (
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your prompt here..."
            placeholderTextColor="#999"
            value={userText}
            onChangeText={(text) => {
              setUserText(text);
              setTranscription(text || 'Tell me About Your PPT');
            }}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Image source={require('../assets/send2.png')} style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      )}

      {/* Generate Button */}
      {isFinished && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <View style={styles.horizontalContent}>
              <View style={styles.generateContent}>
                <Text style={styles.generateText}>Generate PPT</Text>
                <View style={styles.horizontalContent}>
                  <Text style={styles.coinText}>-10</Text>
                  <Image source={require('../assets/coin.png')} style={styles.coinIcon} />
                </View>
              </View>
              <Image source={require('../assets/send2.png')} style={styles.icon} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  transcriptionText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
    width: '100%',
  },
  
  rectangle: {
    width: '45%',  
  
    aspectRatio: 1.5, // Maintain square shape
    margin: 5,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRectangle: {
    borderColor: '#007BFF',
    borderWidth: 3,
  },
  image: {
    width: '98%',
    height: '98%',
    resizeMode: 'cover',
    zIndex:-2,
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
    color: '#333',
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
    alignSelf: 'center',
  },
  generateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  generateText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateContent: {
    alignItems: 'center',
  },
  coinIcon: {
    width: 12,
    height: 12,
    marginLeft: 2,
  },
  coinText: {
    fontSize: 12,
    color: '#fff',
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
    marginLeft: 10,
  },
});

export default PPTGenerateScreen;
