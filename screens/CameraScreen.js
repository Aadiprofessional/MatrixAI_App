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
    
    const initTts = async () => {
      try {
        await Tts.setDefaultRate(0.5);
        await Tts.setDefaultPitch(1.0);
        await Tts.setDefaultLanguage('en-US');
        
        errorListener = Tts.addEventListener('error', (error) => {
          console.error('TTS error:', error);
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
      Tts.stop();
    };
  }, []);

  // Initialize Voice recognition
  useEffect(() => {
    let voiceListener = null;
    
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
        Voice.onSpeechStart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };

        Voice.onSpeechEnd = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };

        Voice.onSpeechResults = (event) => {
          if (event.value && event.value.length > 0) {
            const recognizedText = event.value[0];
            console.log('Speech recognized:', recognizedText);
            setRecognizedText(recognizedText);
            // Process the recognized text
            if (recognizedText.trim().length > 0) {
              processVoiceInput(recognizedText);
            }
          }
        };

        Voice.onSpeechError = (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          // Show text input as fallback
          showTextInputDialog();
        };

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
      console.log('Initializing camera...', {
        hasPermission,
        devices: Array.isArray(devices) 
          ? `Array with ${devices.length} items` 
          : {
              back: !!devices?.back,
              front: !!devices?.front
            }
      });

      if (hasPermission === null) {
        console.log('Waiting for permission check...');
        return;
      }

      if (!hasPermission) {
        console.log('No camera permission');
        return;
      }

      // Clear any previous errors
      setCameraError(null);

      // Check if devices is an array (as shown in your logs)
      if (Array.isArray(devices) && devices.length > 0) {
        console.log('Processing array of camera devices...');
        
        // Filter usable devices first
        const usableDevices = devices.filter(isDeviceUsable);
        console.log(`Found ${usableDevices.length} usable devices out of ${devices.length}`);
        
        if (usableDevices.length === 0) {
          console.log('No usable camera devices found');
          setCameraError('No usable camera devices found. Please check your device settings.');
          return;
        }
        
        // Try to identify back and front cameras
        // First check for position property
        let backCamera = usableDevices.find(d => d.position === 'back');
        let frontCamera = usableDevices.find(d => d.position === 'front');
        
        // If position property doesn't exist, try to use physicalDevices
        if (!backCamera && !frontCamera) {
          backCamera = usableDevices.find(d => 
            d.physicalDevices && 
            d.physicalDevices.some(pd => pd.includes('back'))
          );
          
          frontCamera = usableDevices.find(d => 
            d.physicalDevices && 
            d.physicalDevices.some(pd => pd.includes('front'))
          );
        }
        
        // If still can't identify, use the first device as back and second as front if available
        if (!backCamera && usableDevices.length > 0) {
          console.log('Using first device as back camera');
          backCamera = usableDevices[0];
        }
        
        if (!frontCamera && usableDevices.length > 1) {
          console.log('Using second device as front camera');
          frontCamera = usableDevices[1];
        }
        
        console.log('Found back camera:', !!backCamera);
        console.log('Found front camera:', !!frontCamera);
        
        // Set the appropriate device based on cameraType
        if (backCamera && cameraType === 'back') {
          console.log('Setting back camera');
          setDevice(backCamera);
          setIsLoading(false);
        } else if (frontCamera && cameraType === 'front') {
          console.log('Setting front camera');
          setDevice(frontCamera);
          setIsLoading(false);
        } else if (backCamera) {
          console.log('Defaulting to back camera');
          setCameraType('back');
          setDevice(backCamera);
          setIsLoading(false);
        } else if (frontCamera) {
          console.log('Defaulting to front camera');
          setCameraType('front');
          setDevice(frontCamera);
          setIsLoading(false);
        } else {
          console.log('No usable camera devices found in array');
          setCameraError('No usable camera devices found. Please check your device settings.');
        }
      } 
      // Original logic for object-based devices
      else if (devices?.back && cameraType === 'back') {
        console.log('Setting back camera from object');
        setDevice(devices.back);
        setIsLoading(false);
      } else if (devices?.front && cameraType === 'front') {
        console.log('Setting front camera from object');
        setDevice(devices.front);
        setIsLoading(false);
      } else if (devices?.back) {
        console.log('Defaulting to back camera from object');
        setCameraType('back');
        setDevice(devices.back);
        setIsLoading(false);
      } else if (devices?.front) {
        console.log('Defaulting to front camera from object');
        setCameraType('front');
        setDevice(devices.front);
        setIsLoading(false);
      } else {
        console.log('No camera devices available');
        if (hasPermission) {
          setCameraError('No camera devices found. Please check your device settings.');
        }
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      setCameraError('Failed to initialize camera: ' + error.message);
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

  // Retry mechanism for device detection
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

  // Analyze image using DeepSeek API
  const analyzeImageWithDeepSeek = async (imagePath) => {
    try {
      console.log('Reading image file for analysis...');
      const imageBinary = await RNFS.readFile(imagePath, 'base64'); // Read image as base64
      const imageBuffer = Buffer.from(imageBinary, 'base64'); // Convert base64 to binary buffer
  
      let azureDescription = 'No description available';
      let detectedObjects = [];
  
      // Azure Vision API - Object Detection
      try {
        console.log('Sending image to Azure for object detection...');
        const azureObjectResponse = await axios.post(
          'https://imagechatbot.cognitiveservices.azure.com/vision/v3.2/detect',
          imageBuffer, // Send raw binary data
          {
            headers: {
              'Ocp-Apim-Subscription-Key': '7gyhlB7IxeUdV2VgBGFYCyyc8zCUI57KL9Sfl4ZkhkQaS4JpIvttJQQJ99ALACYeBjFXJ3w3AAAFACOGGqMc',
              'Content-Type': 'application/octet-stream' // Required for binary image
            }
          }
        );
  
        console.log('Azure Object Detection Response:', azureObjectResponse.status);
        detectedObjects = azureObjectResponse.data.objects.map(obj => ({
          object: obj.object,
          confidence: obj.confidence.toFixed(2)
        }));
  
      } catch (error) {
        console.error('Azure Object Detection Error:', error.response?.data || error.message);
      }
  
      // Azure Vision API - Image Analysis
      try {
        console.log('Sending image to Azure for description analysis...');
        const azureResponse = await axios.post(
          'https://imagechatbot.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Description',
          imageBuffer, // Send raw binary data
          {
            headers: {
              'Ocp-Apim-Subscription-Key': '7gyhlB7IxeUdV2VgBGFYCyyc8zCUI57KL9Sfl4ZkhkQaS4JpIvttJQQJ99ALACYeBjFXJ3w3AAAFACOGGqMc',
              'Content-Type': 'application/octet-stream'
            }
          }
        );
  
        console.log('Azure Description Response:', azureResponse.status);
        console.log('Azure Description:', azureResponse.data);
        azureDescription = azureResponse.data.description?.captions?.[0]?.text || 'No description available';
  
      } catch (error) {
        console.error('Azure Description Analysis Error:', error.response?.data || error.message);
      }
  
      // Send data to DeepSeek API for user-friendly explanation
      try {
        console.log('Sending data to DeepSeek for explanation...');
        const deepSeekResponse = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: "deepseek-chat", // Ensure this is the correct model name
            messages: [ 
              { role: "system", content: "Understand the image and describe it in a way that is easy to understand in less than 100 words.and at the end ask did question that dud you want more infomation about the image" },
              { role: "user", content: `Description: ${azureDescription}. Detected objects: ${detectedObjects.map(obj => `${obj.object} (${obj.confidence})`).join(', ')}` }
            ]
          },
          {
            headers: {
              'Authorization': 'Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816',
              'Content-Type': 'application/json'
            }
          }
        );
  
        console.log('DeepSeek Response:', deepSeekResponse.status);
        const deepSeekExplanation = deepSeekResponse.data.choices[0].message.content || 'No explanation available';
  
        // Update AI response with DeepSeek explanation
        setAiResponse(deepSeekExplanation);
  
        // Speak the explanation if TTS is initialized
        if (ttsInitialized) {
          Tts.speak(deepSeekExplanation);
        }
  
        return { description: deepSeekExplanation };
  
      } catch (error) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        setAiResponse('Error generating explanation. Please try again.');
        return { description: 'Error generating explanation.' };
      }
    } catch (error) {
      console.error('General Image Analysis Error:', error);
      setAiResponse('Error analyzing the image. Please try again.');
      return { description: 'Error analyzing the image.' };
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

  // Start voice recognition
  const startVoiceRecognition = async () => {
    try {
      // Stop any ongoing TTS
      if (ttsInitialized) {
        Tts.stop();
      }
      
      // Clear previous recognized text
      setRecognizedText('');
      
      // Check if already listening
      if (isListening) {
        console.log('Already listening!');
        return;
      }
      
      // Check if Voice module is available
      if (!isVoiceModuleAvailable()) {
        console.log('Voice module is not properly initialized');
        showTextInputDialog();
        return;
      }
      
      // Start voice recognition
      console.log('Starting voice recognition...');
      setIsListening(true);
      setIsVoiceProcessing(true);
      
      try {
        await Voice.start('en-US');
        console.log('Voice recognition started successfully');
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
      processVoiceInput(textInputValue);
    }
    setInputModalVisible(false);
  };
  
  // Stop voice recognition
  const stopVoiceRecognition = async () => {
    try {
      if (!isListening) {
        console.log('Not currently listening');
        return;
      }
      
      console.log('Stopping voice recognition...');
      
      try {
        await Voice.stop();
        console.log('Voice recognition stopped successfully');
      } catch (error) {
        console.error('Error stopping voice recognition:', error);
      }
      
      setIsListening(false);
    } catch (error) {
      console.error('Error in stop voice recognition process:', error);
      setIsListening(false);
    }
  };
  
  // Process voice input and send to DeepSeek
  const processVoiceInput = async (text) => {
    try {
      setIsVoiceProcessing(true);
      
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
          Tts.speak(greeting);
        }
        
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
      
      console.log('Sending text input to DeepSeek:', text);
      console.log('Conversation history:', messages);
      
      // Send to DeepSeek API
      const deepSeekResponse = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: "deepseek-chat",
          messages: messages
        },
        {
          headers: {
            'Authorization': 'Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('DeepSeek Response:', deepSeekResponse.status);
      const deepSeekReply = deepSeekResponse.data.choices[0].message.content || 'No response available';
      
      // Add AI response to conversation history
      const finalHistory = [
        ...limitedHistory,
        { role: 'assistant', content: deepSeekReply }
      ];
      setConversationHistory(finalHistory);
      
      // Update AI response
      setAiResponse(deepSeekReply);
      
      // Speak the response if TTS is initialized
      if (ttsInitialized) {
        Tts.speak(deepSeekReply);
      }
      
    } catch (error) {
      console.error('DeepSeek API Error:', error.response?.data || error.message);
      setAiResponse('Error processing your request. Please try again.');
      
      // Add error message to conversation history
      setConversationHistory([
        ...conversationHistory,
        { role: 'user', content: text },
        { role: 'assistant', content: 'Error processing your request. Please try again.' }
      ]);
      
    } finally {
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