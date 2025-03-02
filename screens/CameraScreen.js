import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, Linking ,Image} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import Tts from 'react-native-tts'; 
import { Buffer } from 'buffer';

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
        azureDescription = azureResponse.data.description?.captions?.[0]?.text || 'No description available';
  
      } catch (error) {
        console.error('Azure Description Analysis Error:', error.response?.data || error.message);
      }
  
      // Combine results into a single response
      const objectDetails = detectedObjects.map(obj => `${obj.object} (${obj.confidence})`).join(', ');
      const finalDescription = `${azureDescription}. Detected objects: ${objectDetails || 'None'}`;
  
      setAiResponse(finalDescription);
  
      // Speak the description if TTS is initialized
      if (ttsInitialized) {
        Tts.speak(finalDescription);
      }
  
      return { description: finalDescription };
  
    } catch (error) {
      console.error('General Image Analysis Error:', error);
      setAiResponse('Error analyzing the image. Please try again.');
      return { description: 'Error analyzing the image.' };
    }
  };
  
      // Try Azure Vision API first
  
    

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraToggle} onPress={toggleCameraType}>
          <Icon name="flip-camera-android" size={24} color="black" />
        </TouchableOpacity>
      </View>

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
        <Text style={styles.responseText} numberOfLines={3}>
          {aiResponse || 'Tap the camera button to analyze what you see'}
        </Text>
      </View>

      <View style={styles.iconRow}>
        <TouchableOpacity 
          style={styles.iconCircle} 
          onPress={() => aiResponse && ttsInitialized && Tts.speak(aiResponse)}
        >
          <Icon name="mic" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconCircle, styles.captureButton]} 
          onPress={capturePhoto}
          disabled={isProcessing}
        >
          <Icon name="camera" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color="black" />
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 10,
    margin: 10,
    borderRadius: 10,
  },
  responseText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  iconCircle: {
    backgroundColor: 'lightgray',
    borderRadius: 50,
    padding: 10,
  },
  captureButton: {
    backgroundColor: '#ff4757',
    padding: 15,
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
});

export default CameraScreen;