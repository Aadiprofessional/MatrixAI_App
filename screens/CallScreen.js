import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform, Animated, Dimensions } from 'react-native';
import Voice from '@react-native-voice/voice'; // Import for voice recognition
import Tts from 'react-native-tts'; // Import for text-to-speech
import { SafeAreaView } from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
const CallScreen = () => {
  const navigation = useNavigation();
  const [transcribedText, setTranscribedText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [callActive, setCallActive] = useState(true);
  const [ttsReady, setTtsReady] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  // Add new states for the new features
  const [showRoleSlider, setShowRoleSlider] = useState(false);
  const [showTextContainer, setShowTextContainer] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentRole, setCurrentRole] = useState('Assistant');
  const [animationMode, setAnimationMode] = useState('normal');
  
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
  const countdownInterval = useRef(null);
  const silenceCheckInterval = useRef(null);
  const countdownEffectInterval = useRef(null);
  const responseTimer = useRef(null);
  
  // Add a reference to track the last processed text
  const lastProcessedText = useRef('');

  // Add new state and ref for gradient rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Animation refs
  const aiAnimationRef = useRef(null);
  const audioWavesRef = useRef(null);
  
  // Add animation for AI speaking
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Function to handle AI speaking animation
  const startSpeakingAnimation = () => {
    setIsSpeaking(true);
    setAnimationMode('speaking');
    setAnimationSpeed(1.5);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  const stopSpeakingAnimation = () => {
    setIsSpeaking(false);
    setAnimationMode('normal');
    setAnimationSpeed(0.5);
    
    pulseAnimation.setValue(1);
    Animated.timing(pulseAnimation).stop();
  };
  
  // Add a new function for thinking animation
  const startThinkingAnimation = () => {
    setAnimationMode('thinking');
    setAnimationSpeed(0.3);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Role slider animation
  const roleSliderAnim = useRef(new Animated.Value(0)).current;
  
  const toggleRoleSlider = () => {
    const toValue = showRoleSlider ? 0 : 1;
    setShowRoleSlider(!showRoleSlider);
    
    Animated.spring(roleSliderAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  // Select a role
  const selectRole = (role) => {
    setCurrentRole(role);
    // Update the system prompt based on the selected role
    const rolePrompts = {
      'Assistant': "You are an AI assistant on a phone call. Keep your responses brief and conversational as if speaking on the phone.",
      'Teacher': "You are an AI teacher on a phone call. Explain concepts clearly and provide educational guidance.",
      'Mathematician': "You are an AI mathematician on a phone call. Help solve math problems and explain mathematical concepts.",
      'English Teacher': "You are an AI English teacher on a phone call. Help with language learning, grammar, and vocabulary.",
      'Programmer': "You are an AI programming expert on a phone call. Help with coding problems and explain programming concepts.",
      'Singer': "You are an AI singer on a phone call. You can create lyrics, discuss music theory, and talk about songs."
    };
    
    conversationHistory.current = [
      {
        role: "system",
        content: rolePrompts[role] + " Limit responses to 1-3 sentences. Remember previous parts of our conversation for context."
      }
    ];
    
    // Close the slider after selection
    toggleRoleSlider();
  };
  
  // Add rotation animation
  useEffect(() => {
    const startRotationAnimation = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    };
    
    startRotationAnimation();
  }, []);
  
  // Calculate rotation interpolation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Add effect to handle animation mode changes
  useEffect(() => {
    if (animationMode === 'normal') {
      setAnimationSpeed(0.5);
      pulseAnimation.setValue(1);
      Animated.timing(pulseAnimation).stop();
    } else if (animationMode === 'thinking') {
      startThinkingAnimation();
    } else if (animationMode === 'speaking') {
      startSpeakingAnimation();
    }
  }, [animationMode]);

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
        
        // Add event listeners for TTS
        Tts.addEventListener('tts-start', () => {
          console.log('TTS started speaking');
          startSpeakingAnimation();
        });
        
        ttsFinishListener.current = Tts.addEventListener('tts-finish', () => {
          console.log('TTS finished speaking');
          stopSpeakingAnimation();
        });
        
        // Add error listener
        Tts.addEventListener('tts-error', (err) => {
          console.error('TTS error:', err);
          stopSpeakingAnimation();
        });
        
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

  // Effect to monitor countdown and stop recording when it reaches zero
  useEffect(() => {
    if (countdownSeconds === 0 && isListening && !isProcessing.current) {
      console.log('Countdown reached zero in useEffect, stopping recording');
      stopRecording();
    }
  }, [countdownSeconds, isListening]);

  const startCall = async () => {
    // Wait a moment before greeting to ensure TTS is ready
    setTimeout(() => {
      const greeting = "Hello, how can I help you?";
      
      // Add greeting to conversation
      addToConversation('AI', greeting);
      
      // Add to DeepSeek history
      conversationHistory.current.push({
        role: "assistant",
        content: greeting
      });
      
      // Set animation to normal when AI is speaking
      setAnimationSpeed(1.0);
      
      // Remove any existing TTS finish listener before speaking
      if (ttsFinishListener.current) {
        ttsFinishListener.current.remove();
        ttsFinishListener.current = null;
      }
      
      // Set up the TTS finish listener BEFORE speaking
      ttsFinishListener.current = Tts.addEventListener('tts-finish', () => {
        console.log('TTS finished speaking greeting');
        
        // Make sure processing flag is reset
        isProcessing.current = false;
        
        // Remove listener to prevent multiple triggers
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
        
        // Start listening after greeting
        if (callActive) {
          console.log('AI finished greeting, starting to listen...');
          
          // Make sure we're in a clean state before starting recording
          setIsListening(false);
          
          setTimeout(async () => {
            // Double check that we're still not processing before starting
            isProcessing.current = false;
            
            // Ensure Voice is stopped before starting again
            await ensureVoiceStopped();
            
            // Now start recording
            startRecording();
          }, 1000); // Increased delay to ensure everything is reset properly
        }
      });
      
      // Speak the greeting AFTER setting up the listener
      try {
        console.log('Speaking greeting:', greeting);
        Tts.speak(greeting);
      } catch (err) {
        console.error('TTS speak error:', err);
        // If speaking fails, still start listening
        if (callActive) {
          setTimeout(() => {
            startRecording();
          }, 500);
        }
      }
    }, 1000);
  };

  const addToConversation = (speaker, text) => {
    setConversation(prev => [...prev, { speaker, text }]);
  };

  const onSpeechPartialResults = (event) => {
    const partialText = event.value[0] || '';
    console.log('Partial speech results:', partialText);
    
    // Check if this is the same as the last processed text
    if (partialText === lastProcessedText.current) {
      console.log('Ignoring partial result that matches last processed text:', partialText);
      return;
    }
    
    // Only update if the text has changed
    if (partialText !== transcribedText) {
      console.log('Updating transcribed text from:', transcribedText, 'to:', partialText);
      setTranscribedText(partialText);
    }
    
    // Reset the countdown timer when user is speaking
    if (partialText !== lastTranscribedText.current) {
      console.log('Speech detected, resetting timers');
      lastTextChangeTime.current = Date.now();
      lastTranscribedText.current = partialText;
      
      // If countdown is at 0 or not running, restart the silence detection
      if (countdownSeconds <= 0) {
        console.log('Speech detected after timer expired, restarting timer');
        startSilenceDetection();
      } else {
        // Just reset the countdown value and restart the timer
        setCountdownSeconds(8);
        
        // Clear existing timers
        clearTimeout(silenceTimer.current);
        
        // Create a new timeout
        silenceTimer.current = setTimeout(() => {
          if (isListening && !isProcessing.current) {
            console.log('Silence timeout reached, stopping recording');
            stopRecording();
          }
        }, 8000);
      }
    }
  };

  const onSpeechStart = () => {
    console.log('Speech started');
    
    // Set isListening to true when speech starts
    setIsListening(true);
    
    // Clear any existing timers
    clearTimeout(silenceTimer.current);
    clearInterval(silenceTimer.current);
    clearInterval(countdownInterval.current);
    
    // Update the last text change time
    lastTextChangeTime.current = Date.now();
    
    // Set animation to normal when user starts speaking
    setAnimationSpeed(1.0);
    
    // Start the silence detection loop
    startSilenceDetection();
    
    // Start the AudioWaves animation when speech starts
    if (audioWavesRef.current) {
      audioWavesRef.current.play();
    }
  };

  const startSilenceDetection = () => {
    // Clear any existing timers
    clearTimeout(silenceTimer.current);
    clearInterval(silenceTimer.current);
    clearInterval(countdownInterval.current);
    
    // Set initial countdown value (8 seconds)
    setCountdownSeconds(8);
    
    // Create a timeout that will definitely stop recording after 8 seconds
    silenceTimer.current = setTimeout(() => {
      if (isListening && !isProcessing.current) {
        console.log('Silence timeout reached, stopping recording');
        stopRecording();
        // Don't set isListening to false here, let stopRecording handle it
      }
    }, 8000);
    
    // Start countdown timer that updates every second for UI display
    countdownInterval.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Add a separate effect to monitor countdown and trigger stop
    const countdownEffect = setInterval(() => {
      if (countdownSeconds <= 0 && isListening && !isProcessing.current) {
        console.log('Countdown reached zero, stopping recording');
        clearInterval(countdownEffect);
        stopRecording();
      }
    }, 200);
    
    // Store the countdown effect so we can clear it later
    countdownEffectInterval.current = countdownEffect;
    
    // Also set up a recurring check for silence based on text changes
    // This is a backup to the main timer
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastTextChange = now - lastTextChangeTime.current;
      
      // If text hasn't changed for 8 seconds and we have some text
      if (transcribedText && timeSinceLastTextChange > 8000 && isListening && !isProcessing.current) {
        console.log('No text changes for 8 seconds, stopping recording');
        clearInterval(checkInterval);
        stopRecording();
      }
    }, 500); // Check every 500ms
    
    // Store the check interval so we can clear it later
    silenceCheckInterval.current = checkInterval;
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    
    // Stop the AudioWaves animation when speech ends
    if (audioWavesRef.current) {
      audioWavesRef.current.pause();
    }
    
    // Check if we should process the text now
    const currentText = transcribedText;
    const timeSinceLastChange = Date.now() - lastTextChangeTime.current;
    
    console.log('Speech ended with text:', currentText, 'Time since last change:', timeSinceLastChange);
    
    // If we have text and it's been stable for a short time, process it
    if (currentText && timeSinceLastChange > 500 && !isProcessing.current) {
      console.log('Processing text on speech end');
      stopRecording();
    } else {
      console.log('Not processing text on speech end - conditions not met');
    }
  };

  const onSpeechResults = (event) => {
    console.log('onSpeechResults event:', event);
    
    // Get the recognized text
    const results = event.value;
    if (results && results.length > 0) {
      const recognizedText = results[0];
      console.log('Recognized text:', recognizedText);
      
      // Update the transcribed text state
      setTranscribedText(recognizedText);
      
      // Update the last transcribed text ref
      lastTranscribedText.current = recognizedText;
      
      // Update the last text change time
      lastTextChangeTime.current = Date.now();
      
      // If we're already processing, don't send to API again
      if (isProcessing.current) {
        console.log('Already processing, not sending to API');
        return;
      }
      
      // Check if the text is different enough from the last processed text
      if (recognizedText.trim() === lastProcessedText.current.trim()) {
        console.log('Text is the same as last processed text, not sending to API');
        return;
      }
      
      // Update the last processed text ref
      lastProcessedText.current = recognizedText;
      
      // Add user message to conversation history
      addToConversation('You', recognizedText);
      conversationHistory.current.push({
        role: "user",
        content: recognizedText
      });
      
      // Send the text to the API
      sendToApi(recognizedText);
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
    // Ensure isListening is false before checking conditions
    setIsListening(false);
    
    // Use a local variable to track the state we just set
    const currentlyListening = false;
    
    console.log('startRecording called - isListening:', currentlyListening, 'isProcessing:', isProcessing.current, 'callActive:', callActive);
    
    // First check if we can start recording - use the local value we just set
    if (currentlyListening || isProcessing.current || !callActive) {
      console.log('Cannot start recording - conditions not met');
      return;
    }

    try {
      // Reset state - make sure to clear transcribed text first
      console.log('Clearing transcribed text before starting recording. Current text:', transcribedText);
      
      // Force reset the transcribed text to empty string
      setTranscribedText('');
      
      // Reset the last transcribed text reference
      lastTranscribedText.current = '';
      lastTextChangeTime.current = Date.now();
      
      // Reset countdown timer
      setCountdownSeconds(8);
      
      // Set animation state for user speaking
      setAnimationSpeed(1.0);
      
      console.log('Starting voice recognition...');
      // Start voice recognition
      await Voice.start('en-US');
      console.log('Voice recognition started successfully');
      
      // Set isListening to true AFTER successfully starting Voice
      setIsListening(true);
      
      // Start silence detection
      startSilenceDetection();

      // Start the AudioWaves animation when recording starts
      if (audioWavesRef.current) {
        audioWavesRef.current.play();
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      clearInterval(silenceTimer.current);
      clearInterval(countdownInterval.current);
      Alert.alert('Error', `Failed to start listening: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    
    // Store the current listening state before changing it
    const wasListening = isListening;
    
    // Clear all timers
    clearTimeout(silenceTimer.current);
    clearInterval(countdownInterval.current);
    clearInterval(silenceCheckInterval.current);
    clearInterval(countdownEffectInterval.current);
    
    // Set isListening to false immediately
    setIsListening(false);
    
    // Reset timer references
    silenceTimer.current = null;
    countdownInterval.current = null;
    silenceCheckInterval.current = null;
    countdownEffectInterval.current = null;
    
    // Reset countdown display
    setCountdownSeconds(0);
    
    // Only proceed if we were actually listening
    if (!wasListening) {
      console.log('Not listening, ignoring stop recording call');
      return;
    }
    
    try {
      console.log('Stopping Voice recognition');
      await Voice.stop();
      
      // Store the current transcribed text before processing
      const currentText = transcribedText;
      console.log('Current transcribed text before processing:', currentText);
      
      // Check if the current text is the same as the last processed text
      if (currentText === lastProcessedText.current) {
        console.log('Detected repeated text, ignoring:', currentText);
        // Clear the transcribed text
        setTranscribedText('');
        console.log('Cleared transcribed text (repeated)');
        // Reset processing flag
        isProcessing.current = false;
        return;
      }
      
      // Only process if we have text and we're not already processing
      if (currentText && !isProcessing.current) {
        console.log('Processing transcribed text:', currentText);
        
        // Store this text as the last processed text
        lastProcessedText.current = currentText;
        console.log('Updated lastProcessedText to:', currentText);
        
        // Clear the transcribed text immediately to prevent reuse
        setTranscribedText('');
        console.log('Cleared transcribed text');
        
        // Add to conversation
        addToConversation('You', currentText);
        
        // Add to DeepSeek history
        conversationHistory.current.push({
          role: "user",
          content: currentText
        });
        
        // Process the text
        await sendToApi(currentText);
      } else {
        console.log('No transcribed text or already processing, not sending to API');
        // Make sure processing flag is reset if we're not sending to API
        isProcessing.current = false;
        // Clear the transcribed text even if we're not processing it
        setTranscribedText('');
        console.log('Cleared transcribed text (no processing)');
      }

      // Stop the AudioWaves animation when recording stops
      if (audioWavesRef.current) {
        audioWavesRef.current.pause();
      }
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      // Make sure processing flag is reset on error
      isProcessing.current = false;
      // Clear the transcribed text on error
      setTranscribedText('');
      console.log('Cleared transcribed text (error)');
      Alert.alert('Error', `Failed to process speech: ${error.message}`);
    }
  };

  const sendToApi = async (text) => {
    console.log('sendToApi called with text:', text);
    
    // Set processing flag to prevent multiple requests
    isProcessing.current = true;
    
    // Make sure transcribed text is cleared again (redundant but safe)
    console.log('Clearing transcribed text in sendToApi. Current text:', transcribedText);
    setTranscribedText('');
    
    // Set a timeout to reset the lastProcessedText after 30 seconds
    // This allows the same text to be processed again after a while
    setTimeout(() => {
      if (lastProcessedText.current === text) {
        console.log('Resetting lastProcessedText after timeout from:', lastProcessedText.current, 'to empty string');
        lastProcessedText.current = '';
      }
    }, 30000); // 30 seconds
    
    // Set animation to thinking mode for AI thinking
    startThinkingAnimation();
    
    try {
      // Show thinking message
      const thinkingMessage = "Let me think...";
      setResponseText(thinkingMessage);
      
      // Clear any previous TTS listener
      if (ttsFinishListener.current) {
        ttsFinishListener.current.remove();
        ttsFinishListener.current = null;
      }
      
      // Clear any existing backup timer
      if (responseTimer.current) {
        clearTimeout(responseTimer.current);
        responseTimer.current = null;
      }
      
      // Speak thinking message
      Tts.speak(thinkingMessage);
      
      // Get AI response while thinking message is being spoken
      console.log('Sending request to DeepSeek API...');
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
        },
        body: JSON.stringify({
          model: "doubao-pro-32k-241215",
          messages: conversationHistory.current,
          max_tokens: 150
        }),
      });
      
      const data = await response.json();
      console.log('Received response from DeepSeek API');
      setIsListening(false);
      const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
      
      // Update UI and conversation history
      setResponseText(aiResponse);
      addToConversation('AI', aiResponse);
      conversationHistory.current.push({
        role: "assistant",
        content: aiResponse
      });
      
      // Start speaking animation for AI response
      startSpeakingAnimation();
      
      // Set up TTS finish listener
      ttsFinishListener.current = Tts.addEventListener('tts-finish', () => {
        console.log('TTS finished speaking greeting');
        
        // Stop the speaking animation when TTS finishes
        stopSpeakingAnimation();
        
        // Make sure processing flag is reset
        isProcessing.current = false;
        
        // Remove listener to prevent multiple triggers
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
        
        // Start listening after greeting
        if (callActive) {
          setTimeout(() => {
            if (callActive) {
              startRecording();
            }
          }, 500);
        }
      });
      
      // Speak the AI response
      Tts.speak(aiResponse);
      
    } catch (error) {
      console.error('API error:', error);
      
      // Stop the speaking animation in case of error
      stopSpeakingAnimation();
      
      // Handle error case
      const errorMessage = 'Sorry, there was an error processing your request.';
      setResponseText(errorMessage);
      addToConversation('AI', errorMessage);
      
      // Function to start listening again after error
      
      // Speak error message with the same pattern for continuation
      // Clear any previous TTS listener
      if (ttsFinishListener.current) {
        ttsFinishListener.current.remove();
        ttsFinishListener.current = null;
      }
      
      // Set up TTS finish listener for error case
      ttsFinishListener.current = Tts.addEventListener('tts-finish', () => {
        console.log('TTS finished speaking greeting');
        
        // Make sure processing flag is reset
        isProcessing.current = false;
        
        // Remove listener to prevent multiple triggers
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
        
        // Start listening after greeting
        if (callActive) {
          console.log('AI finished greeting, starting to listen...');
          
          // Make sure we're in a clean state before starting recording
          setIsListening(false);
          
          // Make sure transcribed text is cleared
          console.log('Clearing transcribed text in error case TTS finish listener. Current text:', transcribedText);
          setTranscribedText('');
          lastTranscribedText.current = '';
          
          // Force reset the lastProcessedText to allow new recordings
          console.log('Force resetting lastProcessedText in error case TTS finish listener from:', lastProcessedText.current, 'to empty string');
          lastProcessedText.current = '';
          
          setTimeout(async () => {
            // Double check that we're still not processing before starting
            isProcessing.current = false;
            
            // Ensure Voice is stopped before starting again
            await ensureVoiceStopped();
            
            // Now start recording
            startRecording();
          }, 1000); // Increased delay to ensure everything is reset properly
        }
      });
      
      // Set backup timer for error message
      setTimeout(() => {
        console.log('TTS finished speaking greeting');
        
        // Make sure processing flag is reset
        isProcessing.current = false;
        
        // Remove listener to prevent multiple triggers
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
        
        // Start listening after greeting
        if (callActive) {
          console.log('AI finished greeting, starting to listen...');
          
          // Make sure we're in a clean state before starting recording
          setIsListening(false);
          
          // Make sure transcribed text is cleared
          console.log('Clearing transcribed text in error case backup timer. Current text:', transcribedText);
          setTranscribedText('');
          lastTranscribedText.current = '';
          
          // Force reset the lastProcessedText to allow new recordings
          console.log('Force resetting lastProcessedText in error case backup timer from:', lastProcessedText.current, 'to empty string');
          lastProcessedText.current = '';
          
          setTimeout(async () => {
            // Double check that we're still not processing before starting
            isProcessing.current = false;
            
            // Ensure Voice is stopped before starting again
            await ensureVoiceStopped();
            
            // Now start recording
            startRecording();
          }, 1000); // Increased delay to ensure everything is reset properly
        }
      }, 5000); // 5 seconds should be enough for the error message
      
      // Speak error message
      Tts.speak(errorMessage);
    } finally {
      // Make sure processing flag is reset
      isProcessing.current = false;
    }
  };

  // Helper function to ensure Voice is stopped before starting again
  const ensureVoiceStopped = async () => {
    try {
      console.log('Ensuring Voice is stopped before starting again');
      await Voice.destroy();
      await Voice.removeAllListeners();
      setIsListening(false);
      isProcessing.current = false;
      
      console.log('Clearing transcribed text in ensureVoiceStopped. Current text:', transcribedText);
      setTranscribedText('');
      lastTranscribedText.current = '';
      lastTextChangeTime.current = Date.now();
      
      // Reset the last processed text after a certain number of calls
      // This allows new recordings to use the same text after a while
      if (Math.random() < 0.3) { // 30% chance to reset
        console.log('Resetting lastProcessedText from:', lastProcessedText.current, 'to empty string');
        lastProcessedText.current = '';
      }
      
      console.log('Voice successfully stopped and cleaned up');
    } catch (err) {
      console.log('Error stopping Voice:', err);
      // Try again with basic stop if destroy fails
      try {
        await Voice.stop();
        setIsListening(false);
        isProcessing.current = false;
        
        console.log('Clearing transcribed text in ensureVoiceStopped (fallback). Current text:', transcribedText);
        setTranscribedText('');
        lastTranscribedText.current = '';
        lastTextChangeTime.current = Date.now();
      } catch (err2) {
        console.log('Error with basic Voice stop:', err2);
      }
    }
  };

  const endCall = () => {
    console.log('Ending call and cleaning up resources...');
    
    // Update state first
    setCallActive(false);
    setIsListening(false);
    isProcessing.current = false;
    
    // Clear any pending timers
    clearTimeout(silenceTimer.current);
    clearInterval(countdownInterval.current);
    clearInterval(silenceCheckInterval.current);
    
    // Reset timer references
    silenceTimer.current = null;
    countdownInterval.current = null;
    silenceCheckInterval.current = null;
    
    // Make sure transcribed text is cleared
    console.log('Clearing transcribed text in endCall. Current text:', transcribedText);
    setTranscribedText('');
    lastTranscribedText.current = '';
    
    // Force reset the lastProcessedText
    console.log('Force resetting lastProcessedText in endCall from:', lastProcessedText.current, 'to empty string');
    lastProcessedText.current = '';
    
    // Safe cleanup for TTS listeners
    if (ttsFinishListener.current) {
      console.log('Removing TTS finish listener');
      ttsFinishListener.current.remove();
      ttsFinishListener.current = null;
    }
    
    // Stop voice recognition - with safe error handling
    try {
      console.log('Stopping Voice recognition');
      Voice.stop();
    } catch (err) {
      console.error('Voice stop error:', err);
    }
    
    // Stop any ongoing TTS - with safe error handling for iOS
    try {
      console.log('Stopping TTS');
      // On iOS, don't use await with stop() - it causes the BOOL error
      Tts.stop();
    } catch (err) {
      console.error('TTS stop error:', err);
    }
    
    // Reset animation
    setAnimationSpeed(0);
    
    // Navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.gradientContainer, { transform: [{ rotate }] }]}>
        <LinearGradient
          colors={['#0C7BB3', '#F2BAE8']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
     
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.roleButton}
            onPress={toggleRoleSlider}
          >
            <Text style={styles.roleButtonText}>{currentRole}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.textButton}
            onPress={() => setShowTextContainer(!showTextContainer)}
          >
            <Text style={styles.textButtonText}>
              {showTextContainer ? 'Hide Text' : 'Show Text'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Role selection slider */}
        <Animated.View 
          style={[
            styles.roleSlider,
            {
              transform: [
                { 
                  translateY: roleSliderAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  }) 
                }
              ],
              opacity: roleSliderAnim
            }
          ]}
        >
          <View style={styles.roleSliderContent}>
            <Text style={styles.roleSliderTitle}>Select AI Role</Text>
            <View style={styles.roleOptions}>
              {['Assistant', 'Teacher', 'Mathematician', 'English Teacher', 'Programmer', 'Singer'].map((role) => (
                <TouchableOpacity 
                  key={role} 
                  style={[
                    styles.roleOption,
                    currentRole === role && styles.selectedRoleOption
                  ]}
                  onPress={() => selectRole(role)}
                >
                  <Text style={[
                    styles.roleOptionText,
                    currentRole === role && styles.selectedRoleOptionText
                  ]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
   

      <View style={styles.contentContainer}>
        <View style={styles.avatarContainer}>
          <Animated.View style={{
            transform: [{ scale: pulseAnimation }]
          }}>
            <Lottie
              ref={aiAnimationRef}
              source={require('../assets/Animation - 1740689806927.json')}
              autoPlay
              loop
              speed={animationSpeed}
              style={styles.animation}
            />
          </Animated.View>
        </View>
      </View>
      
      {/* Full screen text container */}
      {showTextContainer && (
        <View style={styles.fullScreenTextContainer}>
          <View style={styles.textContainerHeader}>
            <Text style={styles.conversationTitle}>Conversation</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowTextContainer(false)}
            >
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Conversation history */}
          <View style={styles.conversationHistory}>
            {conversation.map((item, index) => (
              <View key={index} style={styles.messageContainer}>
                <Text style={styles.speakerLabel}>{item.speaker}:</Text>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.controlsContainer2}>
        <View style={styles.audioWavesContainer}>
          <Lottie
            ref={audioWavesRef}
            source={require('../assets/AudioWaves.json')}
            autoPlay={false}
            loop
            speed={1.0}
            style={styles.animation2}
          />
          
          {/* Transcribed text below AudioWaves */}
          {isListening && transcribedText && (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionText}>{transcribedText}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.endCallButton2} 
            onPress={startRecording}
          >
            <Icon name="mic" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.stopButton} 
            onPress={stopRecording}
          >
            <Icon name="stop" size={24} color="#FFFFFF00" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.endCallButton} 
            onPress={endCall}
          >
            <Icon name="call-end" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    position: 'absolute',
    width: Dimensions.get('window').width * 4,
    height: Dimensions.get('window').height * 2,
    top: -Dimensions.get('window').height / 2,
    left: -Dimensions.get('window').width / 2,
  },
  gradient: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    zIndex: 50,
  },
  roleButton: {
    position: 'absolute',
    left: '50%',
    top: Platform.OS === 'ios' ? 50 : 20,
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
    elevation: 5,
  },
  textButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
    elevation: 5,
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 10,
  },
  textButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 10,
  },
  roleSlider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    height: 300,
  },
  roleSliderContent: {
    paddingBottom: 30,
  },
  roleSliderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  roleOption: {
    width: '48%',
    backgroundColor: 'rgba(12, 123, 179, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedRoleOption: {
    backgroundColor: 'rgba(12, 123, 179, 0.3)',
    borderWidth: 1,
    borderColor: '#0C7BB3',
  },
  roleOptionText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedRoleOptionText: {
    color: '#0C7BB3',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },
  avatarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    pointerEvents: 'none', // Make sure it doesn't block touch events
  },
  animation: {
    width: 400,
    height: 400,
    alignSelf: 'center',
  },
  animation2: {
    width: 100,
    height: 100,
    marginBottom: 10,
    alignSelf: 'center',
  },
  fullScreenTextContainer: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    maxHeight: '50%',
    backgroundColor: 'rgba(65, 0, 111, 0.04)',
    zIndex: 50,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
    closeButton: {
    padding: 5,
  },
  transcriptionContainer: {
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 10,
    width: '90%',
    alignSelf: 'center',
  },
  transcriptionText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  conversationHistory: {
    maxHeight: '90%',
  },
  messageContainer: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
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
  controlsContainer2: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -50,
  },
  audioWavesContainer: {
    alignItems: 'center',
    width: '100%',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 10,
  },
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginRight: 20,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  endCallButton2: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF90',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginRight: 20,
  },
});

export default CallScreen;
