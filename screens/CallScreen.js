import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Voice from '@react-native-voice/voice'; // Import for voice recognition
import Tts from 'react-native-tts'; // Import for text-to-speech
import { SafeAreaView } from 'react-native-safe-area-context';
const CallScreen = () => {
  const [transcribedText, setTranscribedText] = useState('');
  const [responseText, setResponseText] = useState('');

  const startRecording = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error(error);
    }
  };

  const onSpeechResults = (event) => {
    const text = event.value[0];
    setTranscribedText(text);
    sendToApi(text);
  };

  const sendToApi = async (text) => {
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
    Tts.speak(data.response); // Speak the response
  };

  // Add event listeners for voice recognition
  React.useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={{ uri: 'https://example.com/your-image.png' }} // Replace with your image URL
        style={styles.image}
      />
      <TouchableOpacity style={styles.micButton} onPress={startRecording}>
        <Text style={styles.buttonText}>🎤</Text>
      </TouchableOpacity>
      <Text>{transcribedText}</Text>
      <Text>{responseText}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  micButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
  },
});

export default CallScreen;
