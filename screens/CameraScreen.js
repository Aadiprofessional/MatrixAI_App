import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, Linking ,Image, Modal, TextInput, KeyboardAvoidingView} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import Tts from 'react-native-tts'; 
import Voice from '@react-native-voice/voice';
import { Buffer } from 'buffer';
import { SafeAreaView } from 'react-native-safe-area-context';
const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const devices = useCameraDevices();
  const [device, setDevice] = useState(null);
  const [cameraType, setCameraType] = useState('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const cameraRef = useRef(null);
  const [ttsInitialized, setTtsInitialized] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  
  // Add new states for conversation flow
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  
  // Add refs for conversation flow
  const silenceTimer = useRef(null);
  const isProcessingRef = useRef(false);
  const ttsFinishListener = useRef(null);
  const lastTranscribedText = useRef('');
  const lastTextChangeTime = useRef(Date.now());
  const countdownInterval = useRef(null);
  const silenceCheckInterval = useRef(null);
  const countdownEffectInterval = useRef(null);
  const lastProcessedText = useRef('');

  // Helper function to check if a device is usable
  const isDeviceUsable = (device) => {
    if (!device) return false;
    
    // Check if the device has the necessary properties to be usable
    return (
      // Check for hasCamera property if it exists
      (typeof device.hasCamera !== 'undefined' ? device.hasCamera : true) &&
      // Make sure it has a valid format
      Array.isArray(device.formats) && device.formats.length > 0
    );
  };

  // Initialize TTS with proper cleanup
  useEffect(() => {
    let errorListener = null;
    let finishListener = null;
    
    const initTts = async () => {
      try {
        await Tts.setDefaultRate(0.5);
        await Tts.setDefaultPitch(1.0);
        await Tts.setDefaultLanguage('en-US');
        
        errorListener = Tts.addEventListener('error', (error) => {
          console.error('TTS error:', error);
        });
        
        // Add finish listener for conversation flow
        finishListener = Tts.addEventListener('tts-finish', () => {
          console.log('TTS finished speaking');
          setIsSpeaking(false);
          
          // Start listening again after AI finishes speaking
          if (!isProcessingRef.current) {
            setTimeout(() => {
              startVoiceRecognition();
            }, 500);
          }
        });
        
        setTtsInitialized(true);
        console.log('TTS initialized');
      } catch (error) {
        console.error('Failed to initialize TTS:', error);
      }
    };
    
    initTts();
    
    return () => {
      if (errorListener) {
        errorListener.remove();
      }
      if (finishListener) {
        finishListener.remove();
      }
      Tts.stop();
    };
  }, []);

  // Initialize Voice recognition
  useEffect(() => {
    const setupVoiceRecognition = async () => {
      try {
        // Check if Voice is available
        try {
          if (typeof Voice.isAvailable === 'function') {
            const isVoiceAvailable = await Voice.isAvailable();
            if (!isVoiceAvailable) {
              console.log('Voice recognition is not available on this device');
              return;
            }
            console.log('Voice recognition is available');
          }
        } catch (availabilityError) {
          console.log('Error checking Voice availability:', availabilityError);
          // Continue anyway, as the availability check might not be supported
        }
        
        // Set up Voice event listeners directly
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechError = onSpeechError;

        // Request microphone permission if needed
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: "Microphone Permission",
              message: "App needs microphone permission for voice recognition",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Microphone permission denied');
          }
        }
      } catch (error) {
        console.error('Error setting up voice recognition:', error);
      }
    };

    setupVoiceRecognition();

    // Cleanup
    return () => {
      try {
        Voice.destroy().then(() => {
          console.log('Voice recognition destroyed');
        }).catch(e => {
          console.error('Error destroying Voice instance:', e);
        });
      } catch (error) {
        console.error('Error during Voice cleanup:', error);
      }
    };
  }, []);

  // Request camera permissions
  useEffect(() => {
    const checkAndRequestCameraPermission = async () => {
      try {
        console.log('Checking camera permissions...');
        
        if (Platform.OS === 'android') {
          // Check existing permissions first
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          
          console.log('Existing camera permission:', hasPermission);
          
          if (!hasPermission) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                title: "Camera Permission",
                message: "App needs camera permission to detect objects",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );
            
            console.log('Camera permission result:', granted);
            
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              // Also request storage permissions
              await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
              );
              await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
              );
            }
            
            setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
          } else {
            setHasPermission(true);
          }
        } else {
          const status = await Camera.getCameraPermissionStatus();
          console.log('iOS camera permission status:', status);
          
          if (status !== 'authorized') {
            const result = await Camera.requestCameraPermission();
            console.log('Camera permission result:', result);
            setHasPermission(result === 'authorized');
          } else {
            setHasPermission(true);
          }
        }
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        Alert.alert(
          'Permission Error',
          'Failed to request camera permissions. Please grant camera permissions in your device settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        setHasPermission(false);
      }
    };
    
    checkAndRequestCameraPermission();
  }, []);

  // Move initializeCamera function outside of useEffect
  const initializeCamera = async () => {
    try {
      console.log('Initializing camera...');
      
      // Check if we have permission
      if (!hasPermission) {
        console.log('No camera permission, requesting...');
        await checkAndRequestCameraPermission();
        return;
      }
      
      // Get available devices
      console.log('Getting available devices...');
      
      // Check if we have any devices
      if (!devices) {
        console.log('No devices available yet');
        setIsLoading(true);
        return;
      }
      
      // Find the appropriate device based on camera type
      let selectedDevice = null;
      
      if (cameraType === 'back' && devices.back) {
        console.log('Using back camera');
        selectedDevice = devices.back;
      } else if (cameraType === 'front' && devices.front) {
        console.log('Using front camera');
        selectedDevice = devices.front;
      } else {
        // Fallback to any available camera
        console.log('Preferred camera not available, checking alternatives...');
        if (devices.back) {
          console.log('Using back camera as fallback');
          selectedDevice = devices.back;
          setCameraType('back');
        } else if (devices.front) {
          console.log('Using front camera as fallback');
          selectedDevice = devices.front;
          setCameraType('front');
        }
      }
      
      // Check if the selected device is usable
      if (selectedDevice && isDeviceUsable(selectedDevice)) {
        console.log('Setting device:', selectedDevice.id);
        setDevice(selectedDevice);
        setIsLoading(false);
        setCameraError(null);
        
        // Start the conversation after camera is initialized and TTS is ready
        if (ttsInitialized) {
          setTimeout(() => {
            const greeting = "Hello! I'm Matrix AI. You can ask me questions or ask me what I can see.";
            setAiResponse(greeting);
            
            if (ttsInitialized) {
              setIsSpeaking(true);
              Tts.speak(greeting);
            }
            
            // Add AI greeting to conversation history
            setConversationHistory([
              { role: 'assistant', content: greeting }
            ]);
          }, 1500);
        }
      } else {
        console.log('No usable camera device found');
        setCameraError('No usable camera found on this device');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initializing camera:', error);
      setCameraError(`Camera error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Use initializeCamera in useEffect
  useEffect(() => {
    initializeCamera();
  }, [devices, cameraType, hasPermission]);

  // Add detailed logging for device detection
  useEffect(() => {
    if (devices) {
      console.log('Devices detected:', devices);
      
      // Add more detailed logging about device structure
      if (Array.isArray(devices)) {
        console.log('Devices is an array with', devices.length, 'items');
        devices.forEach((device, index) => {
          console.log(`Device ${index} details:`, {
            position: device.position,
            physicalDevices: device.physicalDevices,
            hasCamera: device.hasCamera,
            sensorOrientation: device.sensorOrientation
          });
        });
      } else {
        console.log('Devices is an object with properties:', Object.keys(devices));
        if (devices.back) console.log('Back camera details:', devices.back);
        if (devices.front) console.log('Front camera details:', devices.front);
      }
    }
  }, [devices]);

  // Retry camera initialization if it fails
  useEffect(() => {
    const retryInterval = setInterval(() => {
      if (!device && hasPermission) {
        console.log('Retrying device detection...');
        initializeCamera();
      } else {
        clearInterval(retryInterval);
      }
    }, 3000); // Retry every 3 seconds

    return () => clearInterval(retryInterval);
  }, [device, hasPermission]);

  // Start conversation when camera is ready
  useEffect(() => {
    if (device && ttsInitialized && !isLoading) {
      // Start the conversation after a short delay
      setTimeout(() => {
        const greeting = "Hello! I'm Matrix AI. You can ask me questions or ask me what I can see.";
        setAiResponse(greeting);
        
        if (ttsInitialized) {
          setIsSpeaking(true);
          Tts.speak(greeting);
        }
        
        // Add AI greeting to conversation history
        setConversationHistory([
          { role: 'assistant', content: greeting }
        ]);
      }, 1500);
    }
  }, [device, ttsInitialized, isLoading]);

  // Toggle camera type (front/back)
  const toggleCameraType = () => {
    console.log('Toggling camera from', cameraType);
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  // Capture photo
  const capturePhoto = async () => {
    if (cameraRef.current && !isProcessing) {
      console.log('Manual photo capture initiated');
      setIsProcessing(true);
      try {
        console.log('Taking photo...');
        const photo = await cameraRef.current.takePhoto({ 
          flash: 'off',
          qualityPrioritization: 'speed',
          enableShutterSound: false,
          base64: true
        });
        console.log('Photo taken, path:', photo.path);
        
        const analysisResult = await analyzeImageWithDeepSeek(photo.path);
        console.log('Analysis result:', analysisResult);
        
        // TTS is now handled in the analyzeImageWithDeepSeek function
      } catch (error) {
        console.error('Error capturing or analyzing image:', error);
        Alert.alert('Error', 'Failed to capture or analyze the image');
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.log('Cannot capture: camera not ready or processing in progress');
    }
  };

  // Analyze image using DeepSeek Vision API
  const analyzeImageWithDeepSeek = async (imagePath, userPrompt = "What do you see in this image?") => {
    try {
      console.log('Reading image file for analysis...');
      const imageBinary = await RNFS.readFile(imagePath, 'base64'); // Read image as base64
      
      // First, upload the image to Supabase storage
      console.log('Uploading image to Supabase storage...');
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filename = `camera_capture_${timestamp}.jpg`;
      
      // Upload to Supabase
      const response = await fetch('https://rnbdxfpbxvxjjrxjlnpz.supabase.co/storage/v1/object/public/images/' + filename, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYmR4ZnBieHZ4ampyeGpsbnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1NzA1NzYsImV4cCI6MjAyNTE0NjU3Nn0.Nh83ebqzf8OtRCGjpDHcLCzNUmby_vPFTdXJsQQy1Ck',
          'x-upsert': 'true'
        },
        body: Buffer.from(imageBinary, 'base64')
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }
      
      console.log('Image uploaded successfully');
      
      // Get the public URL of the uploaded image
      const imageUrl = `https://rnbdxfpbxvxjjrxjlnpz.supabase.co/storage/v1/object/public/images/${filename}`;
      console.log('Image URL:', imageUrl);
      
      // Now use DeepSeek Vision API to analyze the image
      console.log('Sending image to DeepSeek Vision API...');
      const deepSeekResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "doubao-vision-pro-32k-241028",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ]
        })
      });
      
      if (!deepSeekResponse.ok) {
        throw new Error(`DeepSeek API error: ${deepSeekResponse.statusText}`);
      }
      
      const deepSeekData = await deepSeekResponse.json();
      console.log('DeepSeek Vision API response:', deepSeekData);
      
      // Extract the response text
      const analysisResult = deepSeekData.choices?.[0]?.message?.content || "I couldn't analyze the image properly.";
      
      // Speak the result if TTS is initialized
      if (ttsInitialized) {
        setIsSpeaking(true);
        Tts.speak(analysisResult);
      }
      
      // Update AI response
      setAiResponse(analysisResult);
      
      return analysisResult;
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorMessage = "I'm sorry, I couldn't analyze the image. " + (error.message || "Please try again.");
      
      // Speak the error message if TTS is initialized
      if (ttsInitialized) {
        setIsSpeaking(true);
        Tts.speak(errorMessage);
      }
      
      // Update AI response
      setAiResponse(errorMessage);
      
      return errorMessage;
    }
  };
  
  // Check if Voice module is available
  const isVoiceModuleAvailable = () => {
    try {
      return (
        Voice !== null && 
        Voice !== undefined && 
        typeof Voice.start === 'function' &&
        typeof Voice.stop === 'function'
      );
    } catch (error) {
      console.error('Error checking Voice module availability:', error);
      return false;
    }
  };

  // Add conversation flow functions
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
    
    // Start the silence detection loop
    startSilenceDetection();
  };

  const startSilenceDetection = () => {
    // Clear any existing timers
    clearTimeout(silenceTimer.current);
    clearInterval(silenceTimer.current);
    clearInterval(countdownInterval.current);
    clearInterval(countdownEffectInterval.current);
    clearInterval(silenceCheckInterval.current);
    
    // Set initial countdown value (3 seconds)
    setCountdownSeconds(3);
    
    // Create a timeout that will stop recording after 3 seconds of silence
    silenceTimer.current = setTimeout(() => {
      if (isListening && !isProcessingRef.current) {
        // Only stop recording if we have some text
        if (recognizedText && recognizedText.trim() !== '') {
          console.log('Silence timeout reached with text, stopping recording');
          stopVoiceRecognition();
          processVoiceInput(recognizedText);
        } else {
          console.log('Silence timeout reached but no text detected, resetting timer');
          // Reset the timer to give more time for speech detection
          startSilenceDetection();
        }
      }
    }, 3000);
    
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
    
    // Also set up a recurring check for silence based on text changes
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastTextChange = now - lastTextChangeTime.current;
      
      // If text hasn't changed for 3 seconds and we have some text
      if (recognizedText && recognizedText.trim() !== '' && 
          timeSinceLastTextChange > 3000 && isListening && !isProcessingRef.current) {
        console.log('No text changes for 3 seconds with text, stopping recording');
        clearInterval(checkInterval);
        stopVoiceRecognition();
        processVoiceInput(recognizedText);
      }
    }, 500); // Check every 500ms
    
    // Store the check interval so we can clear it later
    silenceCheckInterval.current = checkInterval;
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    
    // Check if we should process the text now
    const currentText = recognizedText;
    const timeSinceLastChange = Date.now() - lastTextChangeTime.current;
    
    console.log('Speech ended with text:', currentText, 'Time since last change:', timeSinceLastChange);
    
    // If we have text and it's been stable for a short time, process it
    if (currentText && currentText.trim() !== '' && timeSinceLastChange > 500 && !isProcessingRef.current) {
      console.log('Processing text on speech end');
      stopVoiceRecognition();
      processVoiceInput(currentText);
    } else if (!currentText || currentText.trim() === '') {
      console.log('No text detected on speech end, continuing to listen');
      // Reset the timer to give more time for speech detection
      startSilenceDetection();
    } else {
      console.log('Not processing text on speech end - conditions not met');
    }
  };

  const onSpeechPartialResults = (event) => {
    // Only process partial results if we're not already processing a request
    if (isProcessingRef.current) {
      console.log('Ignoring partial results while processing a request');
      return;
    }

    const partialText = event.value[0] || '';
    console.log('Partial speech results:', partialText);
    
    // Check if this is the same as the last processed text
    if (partialText === lastProcessedText.current) {
      console.log('Ignoring partial result that matches last processed text:', partialText);
      return;
    }
    
    // Only update if the text has changed
    if (partialText !== recognizedText) {
      console.log('Updating recognized text from:', recognizedText, 'to:', partialText);
      setRecognizedText(partialText);
    }
    
    // Reset the countdown timer when user is speaking
    if (partialText !== lastTranscribedText.current) {
      console.log('Speech detected, resetting timers');
      lastTextChangeTime.current = Date.now();
      lastTranscribedText.current = partialText;
      
      // Always restart the silence detection when new speech is detected
      startSilenceDetection();
    }
  };

  const onSpeechResults = (event) => {
    console.log('onSpeechResults event:', event);
    
    // If we're already processing, don't process again
    if (isProcessingRef.current) {
      console.log('Already processing, not processing speech results');
      return;
    }
    
    // Get the recognized text
    const results = event.value;
    if (results && results.length > 0) {
      const recognizedText = results[0];
      console.log('Recognized text:', recognizedText);
      
      // Update the recognized text state
      setRecognizedText(recognizedText);
      
      // Update the last transcribed text ref
      lastTranscribedText.current = recognizedText;
      
      // Update the last text change time
      lastTextChangeTime.current = Date.now();
      
      // Check if the text is different enough from the last processed text
      if (recognizedText.trim() === lastProcessedText.current.trim()) {
        console.log('Text is the same as last processed text, not processing');
        return;
      }
      
      // Set processing flag to prevent multiple requests
      isProcessingRef.current = true;
      
      // Update the last processed text ref
      lastProcessedText.current = recognizedText;
      
      // Process the recognized text
      processVoiceInput(recognizedText);
    }
  };

  const onSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    
    // Only show text input dialog if we're not already processing
    if (!isProcessingRef.current) {
      showTextInputDialog();
    }
  };

  // Custom text input dialog
  const showTextInputDialog = () => {
    // If we're in "listening" mode on Android, stop it
    if (Platform.OS === 'android' && isListening) {
      setIsListening(false);
    }
    
    setTextInputValue('');
    setInputModalVisible(true);
  };

  // Handle text input submission
  const handleTextInputSubmit = () => {
    if (textInputValue.trim().length > 0) {
      setRecognizedText(textInputValue);
      
      // Set processing flag to prevent multiple requests
      isProcessingRef.current = true;
      
      // Update the last processed text ref
      lastProcessedText.current = textInputValue;
      
      // Process the text input
      processVoiceInput(textInputValue);
    }
    setInputModalVisible(false);
    setTextInputValue('');
  };

  // Start voice recognition
  const startVoiceRecognition = async () => {
    // Don't start recording if AI is speaking or we're processing
    if (isSpeaking || isProcessingRef.current) {
      console.log('Cannot start recording - AI is speaking or processing');
      return;
    }

    // Ensure isListening is false before starting
    if (isListening) {
      console.log('Already listening, stopping before starting again');
      try {
        await Voice.stop();
        await Voice.destroy();
        
        // Re-initialize Voice with our listeners
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechError = onSpeechError;
      } catch (error) {
        console.error('Error stopping voice before restart:', error);
      }
      setIsListening(false);
    }
    
    console.log('startVoiceRecognition called - isProcessing:', isProcessingRef.current);
    
    try {
      // Stop any ongoing TTS
      if (ttsInitialized) {
        Tts.stop();
      }
      
      // Reset state - make sure to clear recognized text first
      console.log('Clearing recognized text before starting recording. Current text:', recognizedText);
      
      // Force reset the recognized text to empty string
      setRecognizedText('');
      
      // Reset the last transcribed text reference
      lastTranscribedText.current = '';
      lastTextChangeTime.current = Date.now();
      
      // Reset the last processed text reference to prevent duplicate detection
      lastProcessedText.current = '';
      
      // Reset countdown timer
      setCountdownSeconds(3);
      
      // Check if Voice module is available
      if (!isVoiceModuleAvailable()) {
        console.log('Voice module is not properly initialized');
        showTextInputDialog();
        return;
      }
      
      // Add a small delay before starting Voice to ensure it's ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Start voice recognition
      console.log('Starting voice recognition...');
      setIsListening(true);
      setIsVoiceProcessing(false);
      
      try {
        await Voice.start('en-US');
        console.log('Voice recognition started successfully');
        
        // Start silence detection
        startSilenceDetection();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
        setIsVoiceProcessing(false);
        showTextInputDialog();
      }
    } catch (error) {
      console.error('Error in voice recognition process:', error);
      setIsListening(false);
      setIsVoiceProcessing(false);
      showTextInputDialog();
    }
  };

  // Stop voice recognition
  const stopVoiceRecognition = async () => {
    console.log('Stopping voice recognition...');
    
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
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  // Process voice input and send to DeepSeek
  const processVoiceInput = async (text) => {
    try {
      // Set processing flag to prevent multiple requests
      isProcessingRef.current = true;
      setIsVoiceProcessing(true);
      
      // Check if the user is asking about what's in front of the camera
      const shouldTakePhoto = 
        text.toLowerCase().includes('what do you see') || 
        text.toLowerCase().includes('what is in front of you') || 
        text.toLowerCase().includes('what is in front of the camera') ||
        text.toLowerCase().includes('what can you see') ||
        text.toLowerCase().includes('take a picture') ||
        text.toLowerCase().includes('take a photo') ||
        text.toLowerCase().includes('capture') ||
        text.toLowerCase().includes('snap a photo') ||
        text.toLowerCase().includes('analyze what you see');
      
      if (shouldTakePhoto && cameraRef.current) {
        // Let the user know we're taking a photo
        const processingMessage = "I'll take a photo and analyze what I see.";
        setAiResponse(processingMessage);
        
        // Speak the processing message
        if (ttsInitialized) {
          setIsSpeaking(true);
          Tts.speak(processingMessage);
        }
        
        // Add user message to conversation history
        const updatedHistory = [
          ...conversationHistory,
          { role: 'user', content: text }
        ];
        
        // Keep only the last 10 messages to avoid token limits
        const limitedHistory = updatedHistory.slice(-10);
        setConversationHistory(limitedHistory);
        
        try {
          console.log('Taking photo for analysis...');
          const photo = await cameraRef.current.takePhoto({ 
            flash: 'off',
            qualityPrioritization: 'speed',
            enableShutterSound: false,
            base64: true
          });
          console.log('Photo taken, path:', photo.path);
          
          const analysisResult = await analyzeImageWithDeepSeek(photo.path, text);
          console.log('Analysis result:', analysisResult);
          
          // Update conversation history with AI response
          const finalHistory = [
            ...limitedHistory,
            { role: 'assistant', content: analysisResult }
          ];
          setConversationHistory(finalHistory);
          
          // Reset processing flags
          isProcessingRef.current = false;
          setIsVoiceProcessing(false);
          
          // Start listening again after a delay (this will happen via TTS finish listener)
          return;
        } catch (error) {
          console.error('Error capturing or analyzing image:', error);
          
          // Handle error
          const errorMessage = "I'm sorry, I couldn't take or analyze the photo. Please try again.";
          setAiResponse(errorMessage);
          
          // Speak the error message
          if (ttsInitialized) {
            setIsSpeaking(true);
            Tts.speak(errorMessage);
          }
          
          // Update conversation history with error
          const finalHistory = [
            ...limitedHistory,
            { role: 'assistant', content: errorMessage }
          ];
          setConversationHistory(finalHistory);
          
          // Reset processing flags
          isProcessingRef.current = false;
          setIsVoiceProcessing(false);
          
          return;
        }
      }
      
      // Special handling for "Hello Matrix" greeting
      if (text.toLowerCase().includes('hello matrix')) {
        const greeting = "Hello! I'm Matrix AI, your visual and conversational assistant. How can I help you today?";
        
        // Add user message and AI response to conversation history
        const updatedHistory = [
          ...conversationHistory,
          { role: 'user', content: text },
          { role: 'assistant', content: greeting }
        ];
        setConversationHistory(updatedHistory);
        
        // Update AI response
        setAiResponse(greeting);
        
        // Speak the greeting if TTS is initialized
        if (ttsInitialized) {
          setIsSpeaking(true);
          Tts.speak(greeting);
        }
        
        // Reset processing flags
        isProcessingRef.current = false;
        setIsVoiceProcessing(false);
        return;
      }
      
      // Add user message to conversation history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: text }
      ];
      
      // Keep only the last 10 messages to avoid token limits
      const limitedHistory = updatedHistory.slice(-10);
      setConversationHistory(limitedHistory);
      
      // Prepare messages for DeepSeek API
      const messages = [
        { role: "system", content: "You are a helpful assistant that responds to user queries in a conversational manner. Keep responses concise and under 100 words." },
        ...limitedHistory
      ];
      
      // Send to DeepSeek API
      console.log('Sending to DeepSeek API...');
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
        },
        body: JSON.stringify({
          model: "doubao-pro-32k-241215",
          messages: messages,
          max_tokens: 150
        }),
      });
      
      const data = await response.json();
      console.log('Received response from DeepSeek API');
      
      // Extract AI response
      const aiResponseText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
      
      // Update conversation history with AI response
      const finalHistory = [
        ...limitedHistory,
        { role: 'assistant', content: aiResponseText }
      ];
      setConversationHistory(finalHistory);
      
      // Update AI response
      setAiResponse(aiResponseText);
      
      // Speak the response if TTS is initialized
      if (ttsInitialized) {
        setIsSpeaking(true);
        Tts.speak(aiResponseText);
      }
      
      // Reset processing flags
      isProcessingRef.current = false;
      setIsVoiceProcessing(false);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      
      // Handle error
      const errorMessage = "I'm sorry, I couldn't process your request. Please try again.";
      setAiResponse(errorMessage);
      
      // Speak the error message if TTS is initialized
      if (ttsInitialized) {
        setIsSpeaking(true);
        Tts.speak(errorMessage);
      }
      
      // Reset processing flags
      isProcessingRef.current = false;
      setIsVoiceProcessing(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render error state
  if (cameraError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{cameraError}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            setCameraError(null);
            setIsLoading(true);
          }}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, {marginTop: 10}]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render no device available state
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera device available</Text>
        <Text style={styles.infoText}>
          Please ensure:
          {'\n'}- Your device has a camera
          {'\n'}- No other app is using the camera
          {'\n'}- Camera permissions are granted
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setIsLoading(true)}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, {marginTop: 10}]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraToggle} onPress={toggleCameraType}>
          <Icon name="flip-camera-android" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Text Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inputModalVisible}
        onRequestClose={() => {
          setInputModalVisible(false);
          if (Platform.OS === 'android' && isListening) {
            setIsListening(false);
          }
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => {
            setInputModalVisible(false);
            if (Platform.OS === 'android' && isListening) {
              setIsListening(false);
            }
          }}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {Platform.OS === 'android' && isListening 
                    ? 'Voice Recognition' 
                    : 'Talk to Matrix AI'}
                </Text>
                {Platform.OS === 'android' && isListening && (
                  <View style={styles.androidVoiceSimulation}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.androidVoiceText}>
                      Listening... (Type your message below)
                    </Text>
                  </View>
                )}
                <TextInput
                  style={styles.textInput}
                  placeholder={Platform.OS === 'android' && isListening 
                    ? "What you want to say..." 
                    : "Type your message here..."}
                  value={textInputValue}
                  onChangeText={setTextInputValue}
                  autoFocus={true}
                  multiline={true}
                  maxLength={200}
                  returnKeyType="send"
                  onSubmitEditing={handleTextInputSubmit}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setInputModalVisible(false);
                      if (Platform.OS === 'android' && isListening) {
                        setIsListening(false);
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.sendButton]} 
                    onPress={handleTextInputSubmit}
                  >
                    <Text style={styles.buttonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      <View style={styles.animationContainer}>
        <LottieView
          source={require('../assets/Animation - 1740689806927.json')}
          autoPlay
          loop
          style={styles.animation}
          resizeMode="cover"
        />
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          enableZoomGesture={true}
          onError={(error) => {
            console.error('Camera error:', error);
            Alert.alert('Camera Error', 'There was an error with the camera: ' + error.message);
          }}
        />
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </View>

      <View style={styles.responseContainer}>
        <Text style={styles.responseText} numberOfLines={4}>
          {aiResponse || 'Tap the camera button to analyze what you see, or use the mic/chat buttons to start a conversation'}
        </Text>
        {recognizedText ? (
          <Text style={styles.userQueryText} numberOfLines={2}>
            You: {recognizedText}
          </Text>
        ) : null}
        {isListening && (
          <View style={styles.listeningIndicator}>
            <Text style={styles.listeningText}>Listening...</Text>
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        )}
        {isVoiceProcessing && (
          <View style={styles.listeningIndicator}>
            <Text style={styles.listeningText}>Processing...</Text>
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        )}
        {conversationHistory.length > 0 && (
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => {
              if (conversationHistory.length > 0) {
                const historyText = conversationHistory
                  .map(msg => `${msg.role === 'user' ? 'You' : 'Matrix AI'}: ${msg.content}`)
                  .join('\n\n');
                Alert.alert('Conversation History', historyText);
              }
            }}
          >
            <Text style={styles.historyButtonText}>View Conversation History</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.iconRow}>
        <View style={styles.iconContainer}>
          <TouchableOpacity 
            style={styles.iconCircle} 
            onPress={() => showTextInputDialog()}
            disabled={isProcessing || isVoiceProcessing || isListening}
          >
            <Icon name="chat" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.iconLabel}>Text</Text>
        </View>
        
        <View style={styles.iconContainer}>
          <TouchableOpacity 
            style={[styles.iconCircle, isListening ? styles.activeIconCircle : null]} 
            onPress={() => {
              if (isListening) {
                stopVoiceRecognition();
              } else {
                startVoiceRecognition();
              }
            }}
            disabled={isProcessing || isVoiceProcessing}
          >
            <Icon name={isListening ? "stop" : "mic"} size={28} color="black" />
            {isListening && <View style={styles.pulseDot} />}
          </TouchableOpacity>
          <Text style={styles.iconLabel}>Voice</Text>
        </View>
        
        <View style={styles.iconContainer}>
          <TouchableOpacity 
            style={[styles.iconCircle, styles.captureButton]} 
            onPress={capturePhoto}
            disabled={isProcessing || isListening || isVoiceProcessing}
          >
            <Icon name="camera" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.iconLabel}>Camera</Text>
        </View>
        
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
            <Icon name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.iconLabel}>Close</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
  },
  cameraToggle: {
    padding: 8,
  },
  animationContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    marginTop: -40,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
  responseContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    margin: 10,
    borderRadius: 15,
    maxHeight: 150,
  },
  responseText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  userQueryText: {
    color: '#a0e1ff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  listeningText: {
    color: '#ff9f7f',
    fontSize: 14,
    marginRight: 10,
    fontWeight: 'bold',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#333',
  },
  iconCircle: {
    backgroundColor: 'lightgray',
    borderRadius: 50,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  activeIconCircle: {
    backgroundColor: '#ff4757',
  },
  captureButton: {
    backgroundColor: '#ff4757',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
    padding: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    textAlign: 'left',
    padding: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    alignSelf: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  pulseDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  textInput: {
    width: '100%',
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4757',
  },
  sendButton: {
    backgroundColor: '#2196F3',
  },
  historyButton: {
    marginTop: 10,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    alignSelf: 'center',
  },
  historyButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  androidVoiceSimulation: {
    alignItems: 'center',
    marginBottom: 15,
  },
  androidVoiceText: {
    marginTop: 10,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default CameraScreen;
