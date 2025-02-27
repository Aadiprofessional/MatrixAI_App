import React, { useEffect, useState, useCallback } from 'react';
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
        
        // Get the correct path to the model file
        let modelPath;
        if (Platform.OS === 'android') {
          // For Android, copy from assets to app storage first
          const destPath = `${RNFS.DocumentDirectoryPath}/yolov8n.onnx`;
          await RNFS.copyFileAssets('yolov8n.onnx', destPath);
          modelPath = destPath;
        } else {
          modelPath = `${RNFS.MainBundlePath}/yolov8n.onnx`;
        }
        
        console.log('Attempting to load model from:', modelPath);
        
        // Verify file exists
        const exists = await RNFS.exists(modelPath);
        if (!exists) {
          console.error('YOLO model file not found at:', modelPath);
          return;
        }

        const session = await ort.InferenceSession.create(modelPath);
        console.log('Model loaded successfully');
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
          const status = await Camera.requestCameraPermission();
          setHasPermission(status === 'authorized');
        }

        // Wait for devices to be initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Checking camera devices...');
        
        if (!devices) {
          console.log('Devices not yet initialized');
          return;
        }

        console.log('Back camera:', devices.back ? 'Available' : 'Not available');
        console.log('Front camera:', devices.front ? 'Available' : 'Not available');
        
        // Set the camera device
        if (devices.back) {
          console.log('Setting back camera as active device');
          setDevice(devices.back);
          setIsBackCamera(true);
        } else if (devices.front) {
          console.log('Setting front camera as active device');
          setDevice(devices.front);
          setIsBackCamera(false);
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

  // Function to process frame and detect objects
  const onFrameProcessed = useCallback(async (frame) => {
    if (!yoloSession || !frame?.data) return;

    try {
      // Log frame data for debugging
      console.log('Processing frame:', {
        width: frame.width,
        height: frame.height,
        bytesPerRow: frame.bytesPerRow,
        dataLength: frame.data.length
      });

      // Convert frame to tensor format expected by YOLO
      const inputTensor = new ort.Tensor(
        'float32',
        new Float32Array(frame.data),
        [1, 3, frame.height, frame.width]
      );
      
      // Run inference
      const feeds = { images: inputTensor };
      const results = await yoloSession.run(feeds);
      
      // Process results - assuming YOLO v8 output format
      const output = results[Object.keys(results)[0]];
      const detections = [];
      
      // Process each detection
      for (let i = 0; i < output.dims[1]; i++) {
        const confidence = output.data[i * output.dims[2] + 4];
        if (confidence > 0.5) { // Confidence threshold
          const classId = output.data[i * output.dims[2] + 5];
          const bbox = {
            x: output.data[i * output.dims[2]],
            y: output.data[i * output.dims[2] + 1],
            width: output.data[i * output.dims[2] + 2],
            height: output.data[i * output.dims[2] + 3]
          };
          
          detections.push({
            label: `Object ${Math.round(classId)}`,
            confidence: confidence,
            bbox: bbox
          });
        }
      }

      if (detections.length > 0) {
        console.log('Detected objects:', detections);
      }

      setDetectedObjects(detections);
    } catch (err) {
      console.error('Error processing frame:', err);
    }
  }, [yoloSession]);

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
            console.log('Switching camera to:', isBackCamera ? 'front' : 'back');
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
              frameProcessor={{
                frameProcessor: onFrameProcessed,
                fps: 5,
              }}
            />
          ) : (
            <View style={styles.permissionOverlay}>
              <Text style={styles.permissionText}>
                Initializing camera...
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

        {/* Display detected objects */}
        {detectedObjects.map((obj, index) => (
          <View key={index} style={styles.detectionBox}>
            <Text style={styles.detectionText}>
              {obj.label} ({Math.round(obj.confidence * 100)}%)
            </Text>
          </View>
        ))}
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
  detectionBox: {
    position: 'absolute',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    margin: 4,
  },
  detectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CameraScreen;
