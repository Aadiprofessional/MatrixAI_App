import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import Voice from '@react-native-voice/voice'; // Import for voice recognition
import Tts from 'react-native-tts'; // Import for text-to-speech
import { SafeAreaView } from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const CallScreen = () => {
  const navigation = useNavigation();
  const [transcribedText, setTranscribedText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [callActive, setCallActive] = useState(true);
  const [ttsReady, setTtsReady] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // Control animation speed
  
  // Store conversation history for DeepSeek
  const conversationHistory = useRef([
    {
      role: "system",
      content: "You are an AI assistant on a phone call. Keep your responses brief and conversational as if speaking on the phone. Limit responses to 1-3 sentences. Remember previous parts of our conversation for context."
    }
  ]);
  
  const silenceTimer = useRef(null);
  const isProcessing = useRef(false);
  const ttsFinishListener = useRef(null);
  const lastTranscribedText = useRef('');
  const lastTextChangeTime = useRef(Date.now());
  const animationRef = useRef(null);

  // Initialize TTS and Voice
  useEffect(() => {
    const setupVoice = async () => {
      // Set up Voice listeners
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;
    };
    
    const setupTts = async () => {
      try {
        // Initialize TTS
        await Tts.getInitStatus();
        
        // Configure TTS settings
        if (Platform.OS === 'ios') {
          // iOS-specific settings
          await Tts.setDefaultLanguage('en-US');
          
          // Get available voices
          const voices = await Tts.voices();
          console.log('Available voices:', voices);
          
          // Find a female voice - look for specific keywords in voice ID or name
          let femaleVoice = voices.find(voice => 
            voice.language?.includes('en') && 
            (voice.id?.toLowerCase().includes('female') || 
             voice.id?.toLowerCase().includes('samantha') ||
             voice.id?.toLowerCase().includes('karen') ||
             voice.id?.toLowerCase().includes('tessa') ||
             voice.name?.toLowerCase().includes('female'))
          );
          
          // If no specific female voice found, try to find any voice with 'f' in the ID
          if (!femaleVoice) {
            femaleVoice = voices.find(voice => 
              voice.language?.includes('en') && voice.id?.toLowerCase().includes('f')
            );
          }
          
          if (femaleVoice) {
            console.log('Setting female voice:', femaleVoice.id);
            await Tts.setDefaultVoice(femaleVoice.id);
          } else {
            console.log('No female voice found, using default voice');
          }
          
          // iOS uses rate values between 0.0 and 1.0
          // Don't use await with setDefaultRate on iOS - it causes the BOOL error
          Tts.setDefaultRate(0.5);
          Tts.setDefaultPitch(1.2);
        } else {
          // Android settings
          await Tts.setDefaultLanguage('en-US');
          
          // Find female voice on Android
          const voices = await Tts.voices();
          const femaleVoice = voices.find(voice => 
            voice.language?.includes('en') && 
            (voice.id?.toLowerCase().includes('female') || voice.name?.toLowerCase().includes('female'))
          );
          
          if (femaleVoice) {
            await Tts.setDefaultVoice(femaleVoice.id);
          }
          
          // Android uses different rate values
          await Tts.setDefaultRate(0.5);
          await Tts.setDefaultPitch(1.2);
        }
        
        setTtsReady(true);
        console.log('TTS initialized successfully');
      } catch (err) {
        console.error('TTS initialization error:', err);
        // Still mark as ready to continue with the app
        setTtsReady(true);
      }
    };
    
    setupVoice();
    setupTts();
    
    // Clean up on unmount
    return () => {
      // Safe cleanup for TTS
      try {
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
        }
        
        // On iOS, don't use await with stop() - it causes the BOOL error
        if (Platform.OS === 'ios') {
          Tts.stop();
        } else {
          Tts.stop();
        }
      } catch (err) {
        console.error('TTS cleanup error:', err);
      }
      
      // Safe cleanup for Voice
      try {
        Voice.destroy().then(Voice.removeAllListeners);
      } catch (err) {
        console.error('Voice cleanup error:', err);
      }
      
      clearTimeout(silenceTimer.current);
      clearInterval(silenceTimer.current);
    };
  }, []);

  // Monitor transcribedText changes
  useEffect(() => {
    if (transcribedText !== lastTranscribedText.current) {
      lastTranscribedText.current = transcribedText;
      lastTextChangeTime.current = Date.now();
    }
  }, [transcribedText]);

  // Start call when TTS is ready
  useEffect(() => {
    if (ttsReady) {
      startCall();
    }
  }, [ttsReady]);

  const startCall = async () => {
    // Wait a moment before greeting to ensure TTS is ready
    setTimeout(() => {
      const greeting = "Hello, how can I help you?";
      
      // Speak with error handling
      try {
        Tts.speak(greeting);
      } catch (err) {
        console.error('TTS speak error:', err);
      }
      
      // Add greeting to conversation
      addToConversation('AI', greeting);
      
      // Add to DeepSeek history
      conversationHistory.current.push({
        role: "assistant",
        content: greeting
      });
      
      // Set animation to normal when AI is speaking
      setAnimationSpeed(1.0);
      
      // Start listening after greeting
      if (ttsFinishListener.current) {
        ttsFinishListener.current.remove();
      }
      
      ttsFinishListener.current = Tts.addEventListener('tts-finish', () => {
        startRecording();
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
      });
    }, 8000);
  };

  const addToConversation = (speaker, text) => {
    setConversation(prev => [...prev, { speaker, text }]);
  };

  const onSpeechPartialResults = (event) => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      setTranscribedText(text);
      // Text changed, update the time
      lastTextChangeTime.current = Date.now();
      
      // Set animation to normal when user is speaking
      setAnimationSpeed(1.0);
    }
  };

  const onSpeechStart = () => {
    console.log('Speech started');
    setIsListening(true);
    clearTimeout(silenceTimer.current);
    clearInterval(silenceTimer.current);
    lastTextChangeTime.current = Date.now();
    
    // Set animation to normal when user starts speaking
    setAnimationSpeed(1.0);
    
    // Start the silence detection loop
    startSilenceDetection();
  };

  const startSilenceDetection = () => {
    // Clear any existing timer
    clearTimeout(silenceTimer.current);
    clearInterval(silenceTimer.current);
    
    // Set up a recurring check for silence based on text changes
    silenceTimer.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastTextChange = now - lastTextChangeTime.current;
      
      // If text hasn't changed for 2 seconds and we have some text
      if (transcribedText && timeSinceLastTextChange > 8000 && isListening && !isProcessing.current) {
        console.log('No text changes for 2 seconds, stopping recording');
        clearInterval(silenceTimer.current);
        stopRecording();
      }
    }, 500); // Check every 500ms
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    
    // When speech ends, wait a short time and then process if we have text
    setTimeout(() => {
      if (isListening && !isProcessing.current && transcribedText) {
        stopRecording();
      }
    }, 8000);
  };

  const onSpeechResults = (event) => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      setTranscribedText(text);
      lastTextChangeTime.current = Date.now();
    }
  };

  const onSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    
    // If it's not a "no match" error (which is common during silence)
    if (error.error && error.error.code !== '7') {
      setIsListening(false);
      clearInterval(silenceTimer.current);
      Alert.alert('Error', 'Speech recognition failed. Please try again.');
    }
  };

  const startRecording = async () => {
    if (isListening || isProcessing.current || !callActive) {
      return;
    }

    try {
      // Reset state
      setIsListening(true);
      setTranscribedText('');
      lastTranscribedText.current = '';
      lastTextChangeTime.current = Date.now();
      
      // Set animation state for user speaking
      setAnimationSpeed(1.0);
      
      // Start voice recognition
      await Voice.start('en-US');
      
      // Start silence detection
      startSilenceDetection();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      clearInterval(silenceTimer.current);
      Alert.alert('Error', `Failed to start listening: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    // Clear the silence detection timer
    clearInterval(silenceTimer.current);
    
    // Only proceed if we're actually listening
    if (!isListening) return;
    
    try {
      await Voice.stop();
      setIsListening(false);
      
      // Only process if we have text and we're not already processing
      if (transcribedText && !isProcessing.current) {
        const userText = transcribedText;
        addToConversation('You', userText);
        
        // Add to DeepSeek history
        conversationHistory.current.push({
          role: "user",
          content: userText
        });
        
        // Set animation to slow while AI is thinking
        setAnimationSpeed(0.5);
        
        await sendToApi(userText);
      } else {
        // If no text was captured, start listening again
        startRecording();
      }
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      startRecording(); // Try to restart listening
    }
  };

  const sendToApi = async (text) => {
    if (!text || isProcessing.current) return;
    
    isProcessing.current = true;
    
    try {
      // Show thinking message
      const thinkingMessage = "Let me think...";
      setResponseText(thinkingMessage);
      
      // Set animation to slow while thinking
      setAnimationSpeed(0.5);
      
      // Speak with error handling
      try {
        Tts.speak(thinkingMessage);
      } catch (err) {
        console.error('TTS speak error:', err);
      }
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: conversationHistory.current,
          max_tokens: 150
        }),
      });
      
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
      
      setResponseText(aiResponse);
      addToConversation('AI', aiResponse);
      
      // Add to DeepSeek history
      conversationHistory.current.push({
        role: "assistant",
        content: aiResponse
      });
      
      // Set animation to normal when AI is speaking
      setAnimationSpeed(1.0);
      
      // Speak the response with error handling
      try {
        Tts.speak(aiResponse);
      } catch (err) {
        console.error('TTS speak error:', err);
      }
      
      // Listen again after speaking
      if (ttsFinishListener.current) {
        ttsFinishListener.current.remove();
      }
      
      ttsFinishListener.current = Tts.addEventListener('tts-finish', () => {
        isProcessing.current = false;
        
        // Set animation to stopped briefly before user speaks
        setAnimationSpeed(0);
        
        // Short delay before starting to listen again
        setTimeout(() => {
          setAnimationSpeed(1.0);
          startRecording();
        }, 500);
        
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
      });
    } catch (error) {
      console.error('API error:', error);
      const errorMessage = 'Sorry, there was an error processing your request.';
      setResponseText(errorMessage);
      addToConversation('AI', errorMessage);
      
      // Add to DeepSeek history
      conversationHistory.current.push({
        role: "assistant",
        content: errorMessage
      });
      
      // Set animation to normal
      setAnimationSpeed(1.0);
      
      // Speak error with error handling
      try {
        Tts.speak(errorMessage);
      } catch (err) {
        console.error('TTS speak error:', err);
      }
      
      // Listen again after error
      if (ttsFinishListener.current) {
        ttsFinishListener.current.remove();
      }
      
      ttsFinishListener.current = Tts.addEventListener('tts-finish', () => {
        isProcessing.current = false;
        startRecording();
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
      });
    }
  };

  const endCall = () => {
    // Update state first
    setCallActive(false);
    setIsListening(false);
    isProcessing.current = false;
    
    // Clear any pending timers
    clearTimeout(silenceTimer.current);
    clearInterval(silenceTimer.current);
    
    // Safe cleanup for TTS listeners
    if (ttsFinishListener.current) {
      ttsFinishListener.current.remove();
      ttsFinishListener.current = null;
    }
    
    // Stop voice recognition - with safe error handling
    try {
      Voice.stop();
    } catch (err) {
      console.error('Voice stop error:', err);
    }
    
    // Stop any ongoing TTS - with safe error handling for iOS
    try {
      // On iOS, don't use await with stop() - it causes the BOOL error
      Tts.stop();
    } catch (err) {
      console.error('TTS stop error:', err);
    }
    
    // Navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.avatarContainer}>
          <Lottie
            ref={animationRef}
            source={require('../assets/CallAnimation.json')}
            autoPlay
            loop
            speed={animationSpeed}
            style={styles.animation}
          />
          <Image 
            source={require('../assets/Avatar/Cat.png')} 
            style={styles.image}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.conversationTitle}>Conversation</Text>
          
          {/* Live transcription */}
          {isListening && transcribedText && (
            <View style={styles.liveTranscriptionContainer}>
              <Text style={styles.liveTranscriptionLabel}>Currently speaking:</Text>
              <Text style={styles.liveTranscriptionText}>{transcribedText}</Text>
            </View>
          )}
          
          {/* Conversation history */}
          <View style={styles.conversationHistory}>
            {conversation.map((item, index) => (
              <View key={index} style={styles.messageContainer}>
                <Text style={styles.speakerLabel}>{item.speaker}:</Text>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            ))}
          </View>
          
          {/* Listening indicator */}
          {isListening && (
            <View style={styles.listeningIndicator}>
              <Text style={styles.listeningText}>Listening...</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.endCallButton} 
          onPress={endCall}
        >
          <Text style={styles.buttonText}>📞</Text>
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
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  animation: {
    width: 200,
    height: 200,
    position: 'absolute',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    zIndex: 1,
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
    maxHeight: '50%',
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  conversationHistory: {
    maxHeight: '70%',
  },
  messageContainer: {
    marginBottom: 12,
  },
  speakerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  liveTranscriptionContainer: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  liveTranscriptionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  liveTranscriptionText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  listeningIndicator: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
  },
  listeningText: {
    color: '#0066cc',
    textAlign: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    transform: [{ rotate: '135deg' }],
  },
});

export default CallScreen;
