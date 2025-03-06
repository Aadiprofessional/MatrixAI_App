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
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  
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
    
    // Reset the countdown timer when speech ends
    setCountdownSeconds(8);
    
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
      console.log('Final speech results:', text);
      
      // Check if this is the same as the last processed text
      if (text === lastProcessedText.current) {
        console.log('Ignoring final result that matches last processed text:', text);
        return;
      }
      
      // Only update if the text has changed
      if (text !== transcribedText) {
        console.log('Updating final transcribed text from:', transcribedText, 'to:', text);
        setTranscribedText(text);
      }
      
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
    
    // Set animation to active
    setAnimationSpeed(1.0);
    
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
      
      // Set up TTS finish listener
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
          console.log('Clearing transcribed text in TTS finish listener. Current text:', transcribedText);
          setTranscribedText('');
          lastTranscribedText.current = '';
          
          // Force reset the lastProcessedText to allow new recordings
          console.log('Force resetting lastProcessedText in TTS finish listener from:', lastProcessedText.current, 'to empty string');
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
      
      // Calculate estimated speech duration in milliseconds (approx 100ms per character + buffer)
      const estimatedDuration = aiResponse.length * 100 + 3000;
      console.log(`Setting backup timer for ${estimatedDuration}ms to ensure recording restarts`);
      
      // Set backup timer in case TTS finish event doesn't trigger
      responseTimer.current = setTimeout(() => {
        console.log('Backup timer triggered to restart recording');
        
        // Clear any existing TTS listener that hasn't fired
        if (ttsFinishListener.current) {
          ttsFinishListener.current.remove();
          ttsFinishListener.current = null;
        }
        
        // Make sure processing flag is reset
        isProcessing.current = false;
        
        // Make sure we're in a clean state before starting recording
        setIsListening(false);
        
        // Make sure transcribed text is cleared
        console.log('Clearing transcribed text in backup timer. Current text:', transcribedText);
        setTranscribedText('');
        lastTranscribedText.current = '';
        
        // Force reset the lastProcessedText to allow new recordings
        console.log('Force resetting lastProcessedText in backup timer from:', lastProcessedText.current, 'to empty string');
        lastProcessedText.current = '';
        
        // Start the listening cycle
        console.log('Starting the listening cycle after AI response');
        
        // Follow the same pattern as the TTS finish listener
        console.log('Following the listening pattern');
        
        // Make sure isListening is false before starting recording
        console.log('isListening set to false before starting recording');
        setIsListening(false);
        
        // Make sure isProcessing is false before starting recording
        console.log('isProcessing set to false before starting recording');
        isProcessing.current = false;
        
        // Ensure Voice is stopped before starting again
        (async () => {
          await ensureVoiceStopped();
          
          // Now start recording
          console.log('STARTING RECORDING AFTER AI RESPONSE');
          startRecording();
        })();
      }, estimatedDuration);
      
      // Speak the AI response
      console.log('Speaking AI response:', aiResponse);
      Tts.speak(aiResponse);
      
    } catch (error) {
      console.error('API error:', error);
      
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
          
          {/* Listening indicator with countdown */}
          {isListening && (
            <View style={styles.listeningIndicator}>
              <Text style={styles.listeningText}>
                Listening{countdownSeconds > 0 ? ` (${countdownSeconds}s)` : '...'}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.stopButton} 
          onPress={stopRecording}
        >
          <Text style={styles.buttonText}>⏹️</Text>
        </TouchableOpacity>
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
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffc107',
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
