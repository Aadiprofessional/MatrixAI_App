import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';
import * as ort from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import Voice from '@react-native-voice/voice';
import TTS from 'react-native-tts';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const devices = useCameraDevices();
  const [device, setDevice] = useState(null);
  const [isBackCamera, setIsBackCamera] = useState(true);
  const [yoloSession, setYoloSession] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [listening, setListening] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Load YOLO model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading YOLO model...');
        const modelPath = require.resolve('../assets/yolov8n.onnx');
        const session = await ort.InferenceSession.create(modelPath, {
          executionProviders: ['cpu'],
          graphOptimizationLevel: 'all'
        });
        console.log('Model loaded successfully');
        console.log('Model output shape:', session.outputNames);
        setYoloSession(session);
      } catch (err) {
        console.error('Error loading YOLO model:', err);
      }
    };
    loadModel();
  }, []);

  // Initialize voice recognition
  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      const userQuestion = event.value[0];
      handleUserQuestion(userQuestion);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Get object explanation from DeepSeek
  const getObjectExplanation = async (objectName) => {
    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: `What is a ${objectName}?` }],
        },
        {
          headers: { Authorization: 'Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816' }
        }
      );
      return response.data.choices[0].message.content;
    } catch (err) {
      console.error('DeepSeek API error:', err);
      return 'Sorry, I could not understand that object.';
    }
  };

  // Handle user question about detected object
  const handleUserQuestion = async (question) => {
    if (detectedObjects.length > 0) {
      const mainObject = detectedObjects[0].label;
      const explanation = await getObjectExplanation(mainObject);
      setAiResponse(explanation);
      TTS.speak(explanation);
    }
  };

  // Start/stop listening
  const toggleListening = async () => {
    try {
      if (listening) {
        await Voice.stop();
      } else {
        await Voice.start('en-US');
      }
      setListening(!listening);
    } catch (err) {
      console.error('Voice recognition error:', err);
    }
  };

  // Check if a device is usable
  const isDeviceUsable = (device) => {
    return device && 
           device.formats && 
           device.formats.length > 0 &&
           device.supportsFocus;
  };

  // Get first available camera device
  const getFirstDevice = () => {
    if (!devices || !Array.isArray(devices)) return null;
    
    // Find first device that meets minimum requirements
    for (const cameraDevice of devices) {
      if (isDeviceUsable(cameraDevice)) {
        return cameraDevice;
      }
    }
    return null;
  };

  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Request permissions
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'This app needs access to your camera',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } else {
          let permission = await Camera.getCameraPermissionStatus();
          if (permission !== 'authorized') {
            permission = await Camera.requestCameraPermission();
          }
          setHasPermission(permission === 'authorized');
        }
        
        // Initialize camera device
        console.log('Available camera devices:', devices);
        const firstDevice = getFirstDevice();
        if (firstDevice) {
          console.log('Initial camera device:', firstDevice.id);
          setDevice(firstDevice);
          setIsBackCamera(devices.back?.id === firstDevice.id);
        } else {
          console.warn('No usable camera devices found');
        }
      } catch (err) {
        console.warn('Camera setup error:', err);
        setHasPermission(false);
      }
      setIsLoading(false);
    };

    checkCamera();
  }, [devices]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Icon name="upload" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="filter-list" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.animationContainer}>
        <LottieView 
          source={require('../assets/Ai_animation.json')} 
          autoPlay 
          loop 
          style={styles.animation}
          resizeMode="cover"
        />
      </View>

      <View style={styles.cameraContainer}>
        <TouchableOpacity style={styles.flipButton} onPress={() => {
          const newDevice = isBackCamera ? devices.front : devices.back;
          if (newDevice) {
            setDevice(newDevice);
            setIsBackCamera(!isBackCamera);
          }
        }}>
          <Icon name="flip-camera-android" size={24} color="black" />
        </TouchableOpacity>
        {hasPermission ? (
          device ? (
            <Camera 
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
            />
          ) : (
            <View style={styles.permissionOverlay}>
              <Text style={styles.permissionText}>
                No camera device available
              </Text>
            </View>
          )
        ) : (
          <View style={styles.permissionOverlay}>
            <Text style={styles.permissionText}>
              Camera permission required
            </Text>
          </View>
        )}
      </View>

      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconCircle}>
          <Icon name="videocam" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle}>
          <Icon name="mic" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle}>
          <Icon name="more-horiz" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle}>
          <Icon name="close" size={28} color="black" />
        </TouchableOpacity>
      </View>

     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 'auto',
  },
  animationContainer: {
    width: 130,
    height: 130,
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
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    marginVertical: 10,
    position: 'relative',
    height: 500,
  },
  flipButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  icon: {
    width: 28,
    height: 28,
  },
  activeIcon: {
    tintColor: '#00FF00',
  },
});

export default CameraScreen;
