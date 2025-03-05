import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Voice from '@react-native-voice/voice'; // Import for voice recognition
import Tts from 'react-native-tts'; // Import for text-to-speech
import { SafeAreaView } from 'react-native-safe-area-context';

const CallScreen = () => {
  const [transcribedText, setTranscribedText] = useState('Press mic to start speaking');
  const [responseText, setResponseText] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Set up Voice listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    
    // Clean up on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    console.log('Speech started');
    setIsListening(true);
    setTranscribedText('Listening...');
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    setIsListening(false);
  };

  const onSpeechResults = (event) => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      setTranscribedText(text);
      sendToApi(text);
    }
  };

  const onSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    Alert.alert('Error', 'Speech recognition failed. Please try again.');
  };

  const startRecording = async () => {
    if (isListening) {
      console.log('Already listening!');
      return;
    }

    try {
      setIsListening(true);
      setTranscribedText('Listening...');
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      Alert.alert('Error', `Failed to start listening: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const sendToApi = async (text) => {
    try {
      setResponseText('Processing your request...');
      
      const response = await fetch('https://api.deepseek.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816',
        },
        body: JSON.stringify({ query: text }),
      });
      
      const data = await response.json();
      setResponseText(data.response);
      
      // Speak the response
      if (data.response) {
        Tts.speak(data.response);
      }
    } catch (error) {
      console.error('API error:', error);
      setResponseText('Sorry, there was an error processing your request.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Image 
          source={require('../assets/Avatar/Cat.png')} 
          style={styles.image}
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.transcriptionLabel}>You said:</Text>
          <Text style={styles.transcriptionText}>{transcribedText}</Text>
          
          {responseText ? (
            <>
              <Text style={styles.responseLabel}>Response:</Text>
              <Text style={styles.responseText}>{responseText}</Text>
            </>
          ) : null}
        </View>
      </View>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.micButton, isListening ? styles.activeButton : null]} 
          onPress={isListening ? stopRecording : startRecording}
        >
          <Text style={styles.buttonText}>{isListening ? '■' : '🎤'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 30,
    borderRadius: 75,
  },
  textContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transcriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  transcriptionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  responseText: {
    fontSize: 18,
    color: '#333',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  activeButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
  },
});

export default CallScreen;
