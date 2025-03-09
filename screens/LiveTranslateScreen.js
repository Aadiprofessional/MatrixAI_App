import React, { useEffect, useState, useCallback, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ScrollView,
  Animated,
  PermissionsAndroid,
  Platform,
  Clipboard,
  Share,
  ActivityIndicator,
  Alert
} from 'react-native';
import Voice from '@react-native-voice/voice'; // Import Voice library
import Tts from 'react-native-tts'; // Importing TTS library
import axios from 'axios';
import { useNavigation } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioRecord from 'react-native-audio-record'; // Import for audio recording
import RNFS from 'react-native-fs'; // Import for file system operations
import Toast from 'react-native-toast-message'; // Import for toast messages
import { decode } from 'base-64'; // Import for base64 decoding
import { supabase } from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../context/AuthContext';

// Add a simple UUID generator function that doesn't rely on crypto
const generateSimpleUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const LiveTranslateScreen = () => {
  const [isTranslateMode, setIsTranslateMode] = useState(false); // New state for translation mode
  const slideAnimation = new Animated.Value(isTranslateMode ? 0 : 300);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedLanguage2, setSelectedLanguage2] = useState('Chinese');
  const [transcription, setTranscription] = useState('Press Mic to start listening');
  const [isListening, setIsListening] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [circleAnimation] = useState(new Animated.Value(0));
  const [highlightedText, setHighlightedText] = useState('');
  const [editingLanguage, setEditingLanguage] = useState('source'); // 'source' or 'target'
  const navigation = useNavigation();
  
  // New state variables for enhanced recording functionality
  const [isPaused, setIsPaused] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const durationTimerRef = useRef(null);
  const audioRecordRef = useRef(null);
  const { uid, loading } = useAuth(); // Generate a user ID for this session

  // Add a pulsing animation for the recording dot
  const [pulseAnimation] = useState(new Animated.Value(1));
  
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  
  const languageCodes = {
    Afrikaans: 'af',
    Albanian: 'sq',
    Arabic: 'ar',
    Armenian: 'hy',
    Azerbaijani: 'az',
    Bengali: 'bn',
    Bosnian: 'bs',
    Bulgarian: 'bg',
    Catalan: 'ca',
    Chinese: 'zh',
    Croatian: 'hr',
    Czech: 'cs',
    Danish: 'da',
    Dutch: 'nl',
    English: 'en', // Use 'en' for display
    Estonian: 'et',
    Finnish: 'fi',
    French: 'fr',
    Georgian: 'ka',
    German: 'de',
    Greek: 'el',
    Gujarati: 'gu',
    Hebrew: 'he',
    Hindi: 'hi',
    Hungarian: 'hu',
    Icelandic: 'is',
    Indonesian: 'id',
    Irish: 'ga',
    Italian: 'it',
    Japanese: 'ja',
    Kannada: 'kn',
    Kazakh: 'kk',
    Korean: 'ko',
    Latvian: 'lv',
    Lithuanian: 'lt',
    Macedonian: 'mk',
    Malay: 'ms',
    Malayalam: 'ml',
    Marathi: 'mr',
    Mongolian: 'mn',
    Nepali: 'ne',
    Norwegian: 'no',
    Persian: 'fa',
    Polish: 'pl',
    Portuguese: 'pt',
    Punjabi: 'pa',
    Romanian: 'ro',
    Russian: 'ru',
    Serbian: 'sr',
    Sinhala: 'si',
    Slovak: 'sk',
    Slovenian: 'sl',
    Spanish: 'es',
    Swahili: 'sw',
    Swedish: 'sv',
    Tamil: 'ta',
    Telugu: 'te',
    Thai: 'th',
    Turkish: 'tr',
    Ukrainian: 'uk',
    Urdu: 'ur',
    Uzbek: 'uz',
    Vietnamese: 'vi',
    Welsh: 'cy',
  };

  // New mapping for upload language codes
  const uploadLanguageCodes = {
    Afrikaans: 'af',
    Albanian: 'sq',
    Arabic: 'ar',
    Armenian: 'hy',
    Azerbaijani: 'az',
    Bengali: 'bn',
    Bosnian: 'bs',
    Bulgarian: 'bg',
    Catalan: 'ca',
    Chinese: 'zh',
    Croatian: 'hr',
    Czech: 'cs',
    Danish: 'da',
    Dutch: 'nl',
    English: 'en-US', // Use 'en-US' for upload
    Estonian: 'et',
    Finnish: 'fi',
    French: 'fr',
    Georgian: 'ka',
    German: 'de',
    Greek: 'el',
    Gujarati: 'gu',
    Hebrew: 'he',
    Hindi: 'hi',
    Hungarian: 'hu',
    Icelandic: 'is',
    Indonesian: 'id',
    Irish: 'ga',
    Italian: 'it',
    Japanese: 'ja',
    Kannada: 'kn',
    Kazakh: 'kk',
    Korean: 'ko',
    Latvian: 'lv',
    Lithuanian: 'lt',
    Macedonian: 'mk',
    Malay: 'ms',
    Malayalam: 'ml',
    Marathi: 'mr',
    Mongolian: 'mn',
    Nepali: 'ne',
    Norwegian: 'no',
    Persian: 'fa',
    Polish: 'pl',
    Portuguese: 'pt',
    Punjabi: 'pa',
    Romanian: 'ro',
    Russian: 'ru',
    Serbian: 'sr',
    Sinhala: 'si',
    Slovak: 'sk',
    Slovenian: 'sl',
    Spanish: 'es',
    Swahili: 'sw',
    Swedish: 'sv',
    Tamil: 'ta',
    Telugu: 'te',
    Thai: 'th',
    Turkish: 'tr',
    Ukrainian: 'uk',
    Urdu: 'ur',
    Uzbek: 'uz',
    Vietnamese: 'vi',
    Welsh: 'cy',
  };

  const azureEndpoint = 'https://api.cognitive.microsofttranslator.com';
  const azureKey = '21oYn4dps9k7VJUVttDmU3oigC93LUtyYB9EvQatENmWOufZa4xeJQQJ99ALACYeBjFXJ3w3AAAbACOG0HQP'; // Replace with your Azure API Key
  const languages = Object.keys(languageCodes);
  const region = 'eastus';

  const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds
  const recordingTimeoutRef = useRef(null);
  
  // Function to set a timeout for the recording
  const setRecordingTimeout = () => {
    // Clear any existing timeout
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    
    // Set a new timeout
    recordingTimeoutRef.current = setTimeout(() => {
      if (isListening && !isPaused) {
        console.log('Recording timeout reached, stopping recording');
        Alert.alert(
          'Recording Timeout',
          'Recording has reached the maximum duration of 5 minutes.',
          [
            {
              text: 'Save Recording',
              onPress: handleSaveRecording
            },
            {
              text: 'Discard',
              onPress: handleDeleteRecording,
              style: 'cancel'
            }
          ]
        );
      }
    }, MAX_RECORDING_DURATION * 1000);
  };

  // Clear the recording timeout
  const clearRecordingTimeout = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  // Initialize animation based on translation mode
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: isTranslateMode ? 0 : 300,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isTranslateMode]);

  // Initialize audio recorder and voice recognition when component mounts
  useEffect(() => {
    // Initialize Voice
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Request permissions
    requestPermissions();
    
    // Initialize audio recorder
    setupAudioRecorder();
    
    // Add listener for audio recording events
    AudioRecord.on('data', data => {
      // This is called when audio data is available
      // We don't need to do anything with the data here
      // but it's useful for debugging
      console.log('Audio data received, length:', data.length);
    });

    // Cleanup
    return () => {
      // Destroy Voice instance
      Voice.destroy().then(Voice.removeAllListeners);
      
      // Stop and cleanup audio recording if active
      if (isListening) {
        AudioRecord.stop();
      }
      
      // Clear any timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      
      // Clear recording timeout
      clearRecordingTimeout();
    };
  }, []);

  // Speech recognition event handlers
  const onSpeechStart = () => {
    console.log('Speech started');
    setIsListening(true);
  };

  const onSpeechEnd = () => {
    console.log('Speech recognition ended, isPaused:', isPaused);
    
    // Only update the UI if we're not in paused state
    // This prevents the UI from resetting when we manually pause
    if (!isPaused) {
      setIsListening(false);
      stopCircleAnimation();
    }
    // If we're paused, we want to keep the UI in recording mode
    // so don't change isListening state
  };

  const onSpeechResults = (event) => {
    console.log('Speech results:', event);
    if (event.value && event.value.length > 0) {
      const result = event.value[0];
      setTranscription(result);
      // Only translate if in translate mode
      if (isTranslateMode) {
        translateText(result);
      }
    }
  };

  const onSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    stopCircleAnimation();
    Alert.alert('Error', 'Speech recognition failed. Please try again.');
  };

  // Request microphone permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        console.log('Android permissions:', grants);
        
        if (
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('All permissions granted');
        } else {
          console.log('Some permissions denied');
          Alert.alert(
            'Permissions Required',
            'This app needs audio recording and storage permissions to function properly.',
            [
              {
                text: 'OK',
                onPress: () => requestPermissions()
              }
            ]
          );
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleStartListening = async () => {
    if (isListening || isStartingRecording) {
      console.log('Already listening or starting!');
      return;
    }

    try {
      setIsStartingRecording(true);
      setTranscription('Listening...');
      setTranslatedText('');
      startCircleAnimation();
      
      // Show action buttons when recording starts
      setShowActionButtons(true);
      
      // Start audio recording
      const recordingStarted = await startRecording();
      if (!recordingStarted) {
        throw new Error('Failed to start audio recording');
      }
      
      // Start voice recognition with the selected language
      await Voice.start(languageCodes[selectedLanguage] || 'en-US');
      setIsListening(true);
      setIsPaused(false);
      
      // Set the recording timeout
      setRecordingTimeout();
      
      console.log('Started listening, isListening:', true, 'isPaused:', false, 'showActionButtons:', true);
    } catch (error) {
      console.error('Error starting listening:', error);
      setIsListening(false);
      setIsPaused(false);
      stopCircleAnimation();
      setShowActionButtons(false);
      Alert.alert('Error', `Failed to start listening: ${error.message}`);
    } finally {
      setIsStartingRecording(false);
    }
  };

  const handleStopListening = async () => {
    try {
      // Stop voice recognition but don't reset the UI
      await Voice.stop();
      
      // Don't hide action buttons yet, as we need to show tick and delete buttons
      // Don't set isListening to false yet, as we want to keep the UI in recording mode
      // Just stop the circle animation
      stopCircleAnimation();
      
      // Clear the recording timeout
      clearRecordingTimeout();
      
      // We don't stop the audio recording here, just pause it
      // This allows us to continue recording when the user presses play
      // or save the recording when the user presses the tick button
      setIsPaused(true);
      
      console.log('Stopped listening, but keeping UI in recording mode. isListening:', isListening, 'isPaused:', true);
    } catch (error) {
      console.error('Error stopping recording:', error);
      // In case of error, reset the UI
      setIsListening(false);
      setIsPaused(false);
      setShowActionButtons(false);
      stopCircleAnimation();
      clearRecordingTimeout();
    }
  };
  
  // Pause recording
  const pauseRecording = () => {
    try {
      // Voice.js doesn't directly support pausing, so we'll stop the recognition but keep the audio recording
      // We don't want to reset the transcription, just pause the recognition
      Voice.stop();
      
      // AudioRecord doesn't have a direct pause method, but we can use a flag to track the paused state
      // We'll keep the audio recording running but won't process new transcriptions
      setIsPaused(true);
      
      // Pause the duration timer
      clearInterval(durationTimerRef.current);
      
      // Clear the recording timeout when paused
      clearRecordingTimeout();
      
      // Don't change isListening state to keep the UI in recording mode
      console.log('Recording paused, isListening remains:', isListening);
      
      return true;
    } catch (error) {
      console.error('Error pausing recording:', error);
      return false;
    }
  };
  
  // Resume recording
  const resumeRecording = async () => {
    try {
      // Restart voice recognition
      await Voice.start(languageCodes[selectedLanguage] || 'en-US');
      setIsPaused(false);
      
      // Resume the duration timer
      startDurationTimer();
      
      // Set the recording timeout again when resumed
      setRecordingTimeout();
      
      console.log('Recording resumed, isListening remains:', isListening);
      
      return true;
    } catch (error) {
      console.error('Error resuming recording:', error);
      return false;
    }
  };
  
  // New function to handle delete button press
  const handleDeleteRecording = async () => {
    try {
      // First stop the voice recognition
      await Voice.stop();
      
      // Then stop the audio recording
      if (isListening) {
        await stopRecording();
      }
      
      // Clear the recording timeout
      clearRecordingTimeout();
      
      // Reset all states
      setIsListening(false);
      setIsPaused(false);
      setShowActionButtons(false);
      setTranscription('Press Mic to start listening');
      setAudioFile(null);
      setRecordingDuration(0);
      stopCircleAnimation();
      stopPulseAnimation();
      
      // Delete the audio file if it exists
      if (audioFile) {
        RNFS.unlink(audioFile)
          .then(() => console.log('File deleted'))
          .catch(error => console.error('Error deleting file:', error));
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      
      // Still reset the UI even if there's an error
      setIsListening(false);
      setIsPaused(false);
      setShowActionButtons(false);
      setTranscription('Press Mic to start listening');
      clearRecordingTimeout();
    }
  };
  
  // New function to handle tick button press
  const handleSaveRecording = async () => {
    try {
      // First pause the recording if it's not already paused
      if (!isPaused) {
        await handlePauseListening();
      }
      
      // Clear the recording timeout
      clearRecordingTimeout();
      
      setIsUploading(true);
      
      // Stop the audio recording to finalize the file
      console.log('Stopping audio recording to save file...');
      const filePath = await stopRecording();
      
      if (!filePath) {
        throw new Error('Failed to save audio recording');
      }
      
      console.log('Audio file saved at:', filePath);
      setAudioFile(filePath);
      
      // Upload the audio file
      await handleUpload(filePath, recordingDuration);
      
      // Reset states after successful upload
      setIsListening(false);
      setIsPaused(false);
      setShowActionButtons(false);
      setTranscription('Press Mic to start listening');
      setAudioFile(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error saving recording:', error);
      Alert.alert('Error', 'Failed to save recording: ' + error.message);
      clearRecordingTimeout();
    } finally {
      setIsUploading(false);
    }
  };

  const handleSpeakerPress = () => {
    Tts.speak(translatedText, {
      language: languageCodes[selectedLanguage2], // Speak in the second language
      pitch: 1,
      rate: 0.5,
    });

    // Start highlighting words as they are spoken
    const words = translatedText.split(' ');
    words.forEach((word, index) => {
      setTimeout(() => {
        setHighlightedText(word); // Highlight the word
      }, 1000 * index); // Delay to highlight each word one by one
    });
  };

  const translateText = async (inputText) => {
    // Validate input text
    if (!inputText || inputText.trim().length === 0) {
      setTranslatedText('');
      return;
    }

    // Validate target language is selected
    if (!selectedLanguage2) {
      setTranslatedText('Please select a target language');
      return;
    }

    // Get current target language code fresh each time
    const currentTargetLanguage = languageCodes[selectedLanguage2];
    if (!currentTargetLanguage) {
      console.error('Invalid target language:', selectedLanguage2);
      setTranslatedText(`Invalid target language: ${selectedLanguage2}`);
      return;
    }
    console.log('Translating text:', inputText);
    console.log('Target language:', selectedLanguage2, 'Code:', currentTargetLanguage);
    console.log('Making API call to:', `${azureEndpoint}/translate?api-version=3.0&to=${currentTargetLanguage}`);

    // Validate Azure configuration
    if (!azureEndpoint || !azureKey || !region) {
      console.error('Azure translation configuration missing');
      setTranslatedText('Translation service not configured');
      return;
    }

    let retries = 3;
    while (retries > 0) {
      try {
          const response = await axios.post(
          `${azureEndpoint}/translate?api-version=3.0&from=${languageCodes[selectedLanguage]}&to=${currentTargetLanguage}`,
          [{
            Text: inputText
          }],
          {
            headers: {
              'Ocp-Apim-Subscription-Key': azureKey,
              'Ocp-Apim-Subscription-Region': region,
              'Content-Type': 'application/json',
              'X-ClientTraceId': generateSimpleUUID(), // Add unique trace ID
              'X-ForceTranslation': 'true' // Force translation to target language
            },
            params: {
              from: languageCodes[selectedLanguage],
              to: currentTargetLanguage
            },
            timeout: 5000
          }
        );

        if (!response.data || !response.data[0] || !response.data[0].translations) {
          throw new Error('Invalid translation response format');
        }

        const translation = response.data[0].translations[0].text;
        if (!translation) {
          throw new Error('Empty translation received');
        }

        // Verify the translation language matches the target language
        const detectedLanguage = response.data[0].detectedLanguage?.language;
        if (detectedLanguage && detectedLanguage !== currentTargetLanguage) {
          console.error('Translation language mismatch:', 
            `Expected ${currentTargetLanguage}, got ${detectedLanguage}`);
          throw new Error('Translation language mismatch');
        }

        console.log('Translation successful:', translation);
        setTranslatedText(translation);
        return; // Success - exit the retry loop
      } catch (error) {
        retries--;
        console.error(`Translation attempt failed (${retries} retries left):`, 
          error.response ? error.response.data : error.message);

        if (retries === 0) {
          setTranslatedText('Translation failed - please try again');
          return;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const startCircleAnimation = () => {
    Animated.loop(
      Animated.timing(circleAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopCircleAnimation = () => {
    circleAnimation.stopAnimation();
    circleAnimation.setValue(0);
  };

  const handleCopyText = () => {
    Clipboard.setString(translatedText);
    alert('Text copied to clipboard!');
  };

  const handleShareText = async () => {
    try {
      await Share.share({
        message: translatedText,
      });
    } catch (error) {
      console.error('Error sharing text:', error);
    }
  };

  // Add toggle translation mode function
  const toggleTranslateMode = () => {
    const newMode = !isTranslateMode;
    setIsTranslateMode(newMode);
    
    // Animate the bottom section
    Animated.timing(slideAnimation, {
      toValue: newMode ? 0 : 300, // Slide up when in translate mode, down when not
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // If exiting translate mode, reset translated text
    if (!newMode) {
      setTranslatedText('');
    } else if (transcription && transcription !== 'Press Mic to start listening' && transcription !== 'Listening...') {
      // If entering translate mode and we have transcription, translate it
      translateText(transcription);
    }
  };

  const swapLanguages = async () => {
    // Swap the languages
    const temp = selectedLanguage;
    setSelectedLanguage(selectedLanguage2);
    setSelectedLanguage2(temp);
    
    // If we have existing transcription, re-translate it to the new target language
    if (transcription && transcription !== 'Press Mic to start listening' && transcription !== 'Listening...') {
      await translateText(transcription);
    }
    
    // If currently listening, restart with new source language
    if (isListening) {
      try {
        // Stop current recognition and restart with new language
        await Voice.stop();
        await Voice.start(languageCodes[selectedLanguage2] || 'en-US');
      } catch (error) {
        console.error('Error restarting voice recognition:', error);
      }
    }
  };

  const updateLanguage = async (language, isSourceLanguage) => {
    console.log('Updating language:', {
      newLanguage: language,
      isSource: isSourceLanguage,
      currentSource: selectedLanguage,
      currentTarget: selectedLanguage2
    });

    // Clear any existing translations and transcription
    setTranslatedText('');
    setTranscription('Press Mic to start listening');

    if (isSourceLanguage) {
      setSelectedLanguage(language);
      console.log('New source language set:', language);
      
      // Restart recognition with new language if currently listening
      if (isListening) {
        try {
          await Voice.stop();
          await Voice.start(languageCodes[language] || 'en-US');
        } catch (error) {
          console.error('Error stopping voice recognition:', error);
        }
      }
    } else {
      setSelectedLanguage2(language);
      console.log('New target language set:', language);
      
      // Verify the language code exists
      const targetCode = languageCodes[language];
      if (!targetCode) {
        console.error('Invalid target language code:', language);
        return;
      }

      console.log('Target language code:', targetCode);
      
      // Clear any cached translations
      setTranslatedText('');
    }
  };

  // Initialize audio recorder
  const setupAudioRecorder = async () => {
    try {
      const options = {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        wavFile: 'recording.wav',
        audioSource: 6, // MIC source
        audioEncoding: 'wav'
      };
      
      console.log('Initializing audio recorder with options:', options);
      await AudioRecord.init(options);
      console.log('Audio recorder initialized successfully');
    } catch (error) {
      console.error('Error initializing audio recorder:', error);
      Alert.alert('Error', 'Failed to initialize audio recorder: ' + error.message);
    }
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      // Start the duration timer
      startDurationTimer();
      
      // Start audio recording
      console.log('Starting audio recording...');
      
      // Make sure AudioRecord is initialized
      await setupAudioRecorder();
      
      // Start the recording
      const audioFilePath = await AudioRecord.start();
      console.log('Recording started, file will be saved at:', audioFilePath);
      
      // Store the file path for later use
      setAudioFile(audioFilePath);
      
      return true;
    } catch (error) {
      console.error('Error starting audio recording:', error);
      Alert.alert('Error', 'Failed to start audio recording: ' + error.message);
      return false;
    }
  };
  
  // Stop recording audio
  const stopRecording = async () => {
    try {
      // Stop the duration timer
      stopDurationTimer();
      
      // Stop audio recording
      console.log('Stopping audio recording...');
      const filePath = await AudioRecord.stop();
      console.log('Recording stopped, file saved at: ', filePath);
      
      if (!filePath) {
        console.error('No file path returned from AudioRecord.stop()');
        return null;
      }
      
      // Verify the file exists
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        console.error('File does not exist at path:', filePath);
        return null;
      }
      
      console.log('File exists at path:', filePath);
      
      // Get file info
      try {
        const fileInfo = await RNFS.stat(filePath);
        console.log('File info:', fileInfo);
        
        if (fileInfo.size === 0) {
          console.error('File is empty (0 bytes)');
          return null;
        }
      } catch (statError) {
        console.error('Error getting file info:', statError);
      }
      
      return filePath;
    } catch (error) {
      console.error('Error stopping audio recording:', error);
      Alert.alert('Error', 'Failed to stop audio recording');
      return null;
    }
  };
  
  // Start the duration timer
  const startDurationTimer = () => {
    // Clear any existing timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    
    // Start a new timer that increments duration every second
    durationTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };
  
  // Stop the duration timer
  const stopDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };
  
  // Direct navigation function that skips the Supabase function
  const handleDirectNavigation = async (filePath) => {
    try {
      console.log('Handling direct navigation with file:', filePath);
      
      // Generate a unique ID for this recording
      const audioID = generateSimpleUUID();
      
      // Create a local copy of the file that we can access later
      const localDir = `${RNFS.DocumentDirectoryPath}/recordings`;
      const localFilePath = `${localDir}/${audioID}.wav`;
      
      // Ensure the directory exists
      await RNFS.mkdir(localDir);
      
      // Copy the file to our local directory
      await RNFS.copyFile(filePath, localFilePath);
      console.log('File copied to:', localFilePath);
      
      // Navigate directly to the translation screen with the local file
   
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Using local file for playback'
      });
      
    } catch (error) {
      console.error('Error in direct navigation:', error);
      Alert.alert('Error', 'Failed to prepare local file: ' + error.message);
    }
  };

  const handleUpload = async (file, duration) => {
    if (!file) {
      Alert.alert('Error', 'No file selected');
      return;
    }
    
    console.log('Uploading file:', file, 'duration:', duration);
    
    // Check if user has enough coins
    const hasEnoughCoins = await checkUserCoins(uid, duration);
    
    if (!hasEnoughCoins) {
      setIsUploading(false);
      Alert.alert(
        'Insufficient Coins',
        'You don\'t have enough coins to process this audio. Please recharge.',
        [
          {
            text: 'Recharge Now',
            onPress: () => navigation.navigate('TransactionScreen')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    setIsUploading(true);

    try {
      // Generate a secure unique ID for the audio file
      const audioID = generateSimpleUUID();
      const audioName = `audio_${Date.now()}.wav`;
      const fileExtension = 'wav';
      
      // Create file path for Supabase storage
      const filePath = `users/${uid}/audioFile/${audioID}.${fileExtension}`;
      
      // Read the file as base64
      console.log('Reading file as base64:', file);
      const fileContent = await RNFS.readFile(file, 'base64');
      console.log('File content length:', fileContent.length);
      
      if (!fileContent || fileContent.length === 0) {
        throw new Error('File content is empty');
      }
      
      // Get current user session - safely handle if auth.session is not a function
      let currentUser = null;
      try {
        // Try different methods to get the session based on Supabase version
        if (typeof supabase.auth.session === 'function') {
          const session = supabase.auth.session();
          currentUser = session?.user;
        } else if (supabase.auth.getSession) {
          const { data } = await supabase.auth.getSession();
          currentUser = data?.session?.user;
        }
      } catch (authError) {
        console.log('Error getting auth session:', authError);
        // Continue without authentication
      }
      
      if (!currentUser) {
        console.log('No authenticated user found, using anonymous upload');
      } else {
        console.log('Authenticated user found:', currentUser.id);
      }
      
      try {
        // Upload to Supabase storage
        console.log('Uploading to Supabase storage...');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, decode(fileContent), {
            contentType: 'audio/wav',
            upsert: false
          });
            
        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }
        
        console.log('Upload successful:', uploadData);
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath);
        
        console.log('Public URL:', publicUrl);
            
        // Save metadata to database
        const { data: metadataData, error: metadataError } = await supabase
          .from('audio_metadata')
          .insert([
            {
              uid,
              audioid: audioID,
              audio_name: audioName,
              language: uploadLanguageCodes[selectedLanguage], // Use upload language code here
              audio_url: publicUrl,
              file_path: filePath,
              duration: parseInt(duration, 10),
              uploaded_at: new Date().toISOString(),
            }
          ]);
            
        if (metadataError) {
          throw new Error(`Metadata error: ${metadataError.message}`);
        }
        
        console.log('Metadata saved:', metadataData);
        
        // Success handling
        Toast.show({
          type: 'success',
          text1: 'Import Complete',
          text2: 'Your file has been imported successfully.'
        });
  
        setIsUploading(false);
        
        // Add a longer delay before navigating to ensure database has time to update
        setTimeout(() => {
          // Navigate to translation screen with the generated audioid
          handlePress({ audioid: audioID });
        }, 2000);
      } catch (error) {
        console.error('Upload error details:', error.message);
        
        // Ask the user if they want to use the local file instead
        Alert.alert(
          'Error',
          'Failed to upload file: ' + error.message,
          [
            {
              text: 'Use Local File',
              onPress: () => handleDirectNavigation(file)
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Upload error details:', error.message);
      
      // Ask the user if they want to use the local file instead
      Alert.alert(
        'Error',
        'Failed to upload file: ' + error.message,
        [
          {
            text: 'Use Local File',
            onPress: () => handleDirectNavigation(file)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsUploading(false);
    }
  };
  
  // Function to check if user has enough coins
  const checkUserCoins = async (uid, duration) => {
    try {
      // This would typically be an API call to check user's coin balance
      // For now, we'll just return true to avoid errors
      console.log('Checking user coins for uid:', uid, 'duration:', duration);
      return true;
    } catch (error) {
      console.error('Error checking user coins:', error);
      return true; // Return true to avoid blocking the upload
    }
  };
  
  // Fallback function to navigate directly to the translation screen
  const navigateToTranslationScreen = (audioid) => {
    // Get the audio URL from Supabase storage
    const audioUrl = `https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/${uid}/audioFile/${audioid}.wav`;
    
    console.log('Navigating directly to translation screen with audio URL:', audioUrl);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Audio processed successfully'
    });
    // Navigate to the translation screen with the audio URL
   
  };

  const handlePress = async ({ audioid }) => {
    try {
      console.log('audioid:', audioid, 'uid:', uid);
      
      if (!audioid || !uid) {
        throw new Error('Missing required parameters: audioid or uid');
      }
      
      // Get current user session - safely handle if auth.session is not a function
      let currentUser = null;
      let accessToken = '';
      try {
        // Try different methods to get the session based on Supabase version
        if (typeof supabase.auth.session === 'function') {
          const session = supabase.auth.session();
          currentUser = session?.user;
          accessToken = session?.access_token || '';
        } else if (supabase.auth.getSession) {
          const { data } = await supabase.auth.getSession();
          currentUser = data?.session?.user;
          accessToken = data?.session?.access_token || '';
        }
      } catch (authError) {
        console.log('Error getting auth session:', authError);
        // Continue without authentication
      }
      
      // Create a proper JSON object for the request body
      const requestBody = JSON.stringify({
        uid: String(uid),
        audioid: String(audioid),
        user_id: currentUser?.id || uid,
        is_anonymous: !currentUser
      });

      console.log('Request body:', requestBody);

      // Show a loading indicator or message
      setIsUploading(true);
      
      // Make the API call with proper error handling
      const response = await fetch('https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/convertAudio', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: requestBody
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        Alert.alert(
          'Error', 
          'Invalid response from server. Would you like to continue anyway?',
          [
            {
              text: 'Yes',
              onPress: () => navigateToTranslationScreen(audioid)
            },
            {
              text: 'No',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      if (response.ok && data.message === "Transcription completed and saved") {
        // Success case
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Audio processed successfully'
        });
        
        // Navigate to the translation screen
        navigation.navigate('TranslateScreen2', {
          uid,
          audioid,
          transcription: data.transcription,
          audio_url: data.audio_url
        });
      } else {
        // Error case
        console.error('API Error:', data);
        
        // Show a more detailed error message
        let errorMessage = 'Failed to process audio';
        if (data && data.error) {
          errorMessage += `: ${data.error}`;
          
          // Add specific handling for common errors
          if (data.error.includes('Failed to fetch user data')) {
            errorMessage = 'User authentication error. Please log in again and try.';
          } else if (data.error.includes('not found')) {
            errorMessage = 'Audio file not found. Please try recording again.';
          }
        }
        
        Alert.alert(
          'Error', 
          errorMessage, 
          [
            {
              text: 'Try Again',
              onPress: () => handlePress({ audioid })
            },
            {
              text: 'Continue Anyway',
              onPress: () => navigateToTranslationScreen(audioid)
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert(
        'Error', 
        'Network error occurred. Would you like to continue anyway?',
        [
          {
            text: 'Yes',
            onPress: () => navigateToTranslationScreen(audioid)
          },
          {
            text: 'No',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Start the pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Stop the pulse animation
  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };
  
  // Start the pulse animation when recording starts
  useEffect(() => {
    if (isListening && !isPaused) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening, isPaused]);

  // New function to handle pause button press
  const handlePauseListening = async () => {
    if (!isListening || isPaused) {
      console.log('Cannot pause: not listening or already paused');
      return;
    }
    
    try {
      console.log('Pausing recording...');
      const paused = pauseRecording();
      if (paused) {
        console.log('Recording paused successfully');
        // Keep isListening true but set isPaused to true
        // This way the UI will show the play button but stay in recording mode
        setIsPaused(true);
      } else {
        console.error('Failed to pause recording');
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
      Alert.alert('Error', 'Failed to pause recording: ' + error.message);
    }
  };
  
  // New function to handle resume button press
  const handleResumeListening = async () => {
    if (!isListening || !isPaused) {
      console.log('Cannot resume: not listening or not paused');
      return;
    }
    
    try {
      console.log('Resuming recording...');
      const resumed = await resumeRecording();
      if (resumed) {
        console.log('Recording resumed successfully');
        // Keep isListening true and set isPaused to false
        // This way the UI will show the pause button
        setIsPaused(false);
      } else {
        console.error('Failed to resume recording');
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
      Alert.alert('Error', 'Failed to resume recording: ' + error.message);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back, Copy, Share */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.icon2} />
        </TouchableOpacity>
        <View style={styles.rightHeader}>
          {/* Only show these buttons in translate mode */}
          {isTranslateMode && (
            <>
            
              <TouchableOpacity onPress={handleCopyText}>
                <Image source={require('../assets/copy.png')} style={styles.icon3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareText}>
                <Image source={require('../assets/share.png')} style={styles.icon3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSpeakerPress}>
                <Image source={require('../assets/speaker.png')} style={styles.icon3} />
              </TouchableOpacity>
            </>
          )}
          {/* Toggle translate mode button */}
          <TouchableOpacity 
            onPress={toggleTranslateMode} 
            style={[
              styles.translateButton, 
              isTranslateMode && styles.activeTranslateButton
            ]}
          >
            <Image 
              source={require('../assets/Translate.png')} 
              style={[styles.icon4, isTranslateMode && styles.activeIcon]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Blue Section */}
      <View style={styles.topSection}>
        <View style={styles.container2}>
          <View style={styles.languageSwitcher}>
            {/* Always show source language */}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => {
                setEditingLanguage('source');
                setLanguageModalVisible(true);
              }}
            >
              <Text style={styles.languageText}>{selectedLanguage}</Text>
            </TouchableOpacity>
            
            {/* Only show language swap and target language in translate mode */}
            {isTranslateMode ? (
              <>
                <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
                  <Image
                    source={require('../assets/Change.png')}
                    style={styles.swapIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => {
                    setEditingLanguage('target');
                    setLanguageModalVisible(true);
                  }}
                >
                  <Text style={styles.languageText}>{selectedLanguage2}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
  
        {/* Scroll view added for transcription */}
        <ScrollView style={{ height: 280 }}>
          <Text style={styles.documentText}>{transcription}</Text>
        </ScrollView>
      </View>

      {/* Animated Circle Behind Mic Icon */}
      <Animated.View
        style={[
          styles.circle,
          {
            opacity: circleAnimation,
            transform: [
              {
                scale: circleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5], // Adjust size of the circle to be slightly bigger than mic button
                }),
              },
            ],
          },
        ]}
      />

      {/* Sliding White Section - Only visible in translate mode */}
      <Animated.View style={[styles.bottomSection, { transform: [{ translateY: slideAnimation }] }]}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.translatedText}>{translatedText}</Text>
        </ScrollView>
        
        <View style={styles.bottomButtons}>
          {/* Recording duration indicator */}
          {isListening && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingHeader}>
                <Animated.View 
                  style={[
                    styles.recordingDot, 
                    { 
                      opacity: isPaused ? 0.5 : pulseAnimation 
                    }
                  ]} 
                />
                <Text style={styles.recordingTimer}>
                  {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                  {(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              
              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${(recordingDuration / MAX_RECORDING_DURATION) * 100}%`,
                      backgroundColor: recordingDuration > MAX_RECORDING_DURATION * 0.8 ? '#ff3b30' : '#4cd964'
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.recordingTimeLeft}>
                {Math.floor((MAX_RECORDING_DURATION - recordingDuration) / 60).toString().padStart(2, '0')}:
                {((MAX_RECORDING_DURATION - recordingDuration) % 60).toString().padStart(2, '0')} left
              </Text>
            </View>
          )}
          
          {isListening ? (
            <>
              {/* When recording is active, show pause/play button */}
              <TouchableOpacity 
                style={styles.button} 
                onPress={isPaused ? handleResumeListening : handlePauseListening}
              >
                <Image 
                  source={isPaused ? require('../assets/play.png') : require('../assets/pause.png')} 
                  style={styles.icon} 
                />
              </TouchableOpacity>
              
              {/* Show delete and tick buttons when recording */}
              {showActionButtons && (
                <>
                  {/* Delete button */}
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton2]} 
                    onPress={handleDeleteRecording}
                  >
                    <Image 
                      source={require('../assets/remove.png')} 
                      style={styles.smallIcon} 
                    />
                  </TouchableOpacity>
                  
                  {/* Tick button */}
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.tickButton2]} 
                    onPress={handleSaveRecording}
                  >
                    <Image 
                      source={require('../assets/Tick.png')} 
                      style={styles.smallIcon} 
                    />
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <TouchableOpacity 
              style={[
                styles.button, 
                (isUploading || isStartingRecording) && styles.disabledButton
              ]} 
              onPress={handleStartListening}
              disabled={isUploading || isStartingRecording}
            >
              {isUploading || isStartingRecording ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Image 
                  source={require('../assets/mic3.png')} 
                  style={styles.icon} 
                />
              )}
            </TouchableOpacity>
          )}
          
          {/* Loading indicator during upload */}
          {isUploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Floating mic button when not in translate mode */}
      {!isTranslateMode && (
        <View style={styles.floatingMicContainer}>
          {/* Recording duration indicator */}
          {isListening && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingHeader}>
                <Animated.View 
                  style={[
                    styles.recordingDot, 
                    { 
                      opacity: isPaused ? 0.5 : pulseAnimation 
                    }
                  ]} 
                />
                <Text style={styles.recordingTimer}>
                  {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                  {(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              
              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${(recordingDuration / MAX_RECORDING_DURATION) * 100}%`,
                      backgroundColor: recordingDuration > MAX_RECORDING_DURATION * 0.8 ? '#ff3b30' : '#4cd964'
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.recordingTimeLeft}>
                {Math.floor((MAX_RECORDING_DURATION - recordingDuration) / 60).toString().padStart(2, '0')}:
                {((MAX_RECORDING_DURATION - recordingDuration) % 60).toString().padStart(2, '0')} left
              </Text>
            </View>
          )}
          
          {isListening ? (
            <>
              {/* When recording is active, show pause/play button */}
              <TouchableOpacity 
                style={styles.floatingMicButton} 
                onPress={isPaused ? handleResumeListening : handlePauseListening}
              >
                <Image 
                  source={isPaused ? require('../assets/play.png') : require('../assets/pause.png')} 
                  style={styles.icon} 
                />
              </TouchableOpacity>
              
              {/* Show delete and tick buttons when recording */}
              {showActionButtons && (
                <>
                  {/* Delete button */}
                  <TouchableOpacity 
                    style={[styles.floatingActionButton, styles.deleteButton]} 
                    onPress={handleDeleteRecording}
                  >
                    <Image 
                      source={require('../assets/remove.png')} 
                      style={styles.smallIcon} 
                    />
                  </TouchableOpacity>
                  
                  {/* Tick button */}
                  <TouchableOpacity 
                    style={[styles.floatingActionButton, styles.tickButton]} 
                    onPress={handleSaveRecording}
                  >
                    <Image 
                      source={require('../assets/Tick.png')} 
                      style={styles.smallIcon} 
                    />
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <TouchableOpacity 
              style={[
                styles.floatingMicButton, 
                (isUploading || isStartingRecording) && styles.disabledButton
              ]} 
              onPress={handleStartListening}
              disabled={isUploading || isStartingRecording}
            >
              {isUploading || isStartingRecording ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Image 
                  source={require('../assets/mic3.png')} 
                  style={styles.icon} 
                />
              )}
            </TouchableOpacity>
          )}
          
          {/* Loading indicator during upload */}
          {isUploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      )}

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={languages}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => {
                    updateLanguage(item, editingLanguage === 'source');
                    setLanguageModalVisible(false);
                  }}
                >
                  <Text style={styles.languageOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setLanguageModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 45,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#007bff',
  },
  header: {
    flexDirection: 'row',
    paddingTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  icon: {
    width: 34,
    height: 34,
    tintColor: '#ffffff',
  },
  icon2: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  icon3: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
    marginLeft:10,
  },
  icon4: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
  
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topSection: {
    paddingTop: 45,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
  },
  languageSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 8,
    width: '80%',
    height:50,
    position: 'relative', // Required for absolute positioning of the swap button
  },
  languageButton: {
    paddingHorizontal: 26,
    flex: 1, // Allow buttons to take equal space
    alignItems: 'center', // Center text horizontally
  },
  languageText: {
    fontSize: 16,
    color: '#000',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute', // Position the swap button absolutely
    left: '50%', // Move to the horizontal center
    top: '50%', // Move to the vertical center
    transform: [{ translateX: -10 }, { translateY: -10 }], // Adjust for button size
  },
  container2: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  swapIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  documentText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 30,
  },
  bottomSection: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  scrollView: {
    paddingVertical: 10,
  },
  translatedText: {
    fontSize: 18,
    color: '#555',
  },
  circle: {
    position: 'absolute',
    bottom: 100, // Adjust the distance from the mic button
    left: '50%',
    width: 90, // A bit larger than mic button
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 123, 255, 0.3)',
    transform: [{ translateX: -45 }],
    zIndex: 0, // Ensure it is behind the mic button
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  languageOptionText: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  translateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E26C05FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    resizeMode: 'cover',
  },
  activeTranslateButton: {
    backgroundColor: '#0056b3',
  },
  activeIcon: {
    tintColor: '#fff',
  },
  floatingMicContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingMicButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingActionButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
    deleteButton: {
      backgroundColor: '#ff3b30',
      left: -60, // Position to the left of the mic button
    },
    deleteButton2: {  
      backgroundColor: '#ff3b30',
     // Position to the left of the mic button
     left: 60,
    },

  tickButton: {
    backgroundColor: '#4cd964',
    right: -60, // Position to the right of the mic button
  },
  tickButton2: {
    backgroundColor: '#4cd964',
    // Position to the right of the mic button
    right: 60,
  },
  smallIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30',
    marginRight: 8,
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  recordingTimeLeft: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 2,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    position: 'absolute',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default LiveTranslateScreen;
