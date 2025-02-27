import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native';
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
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const devices = useCameraDevices();
  const [device, setDevice] = useState(null);
  const [isBackCamera, setIsBackCamera] = useState(true);
  const [yoloSession, setYoloSession] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [listening, setListening] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const cameraRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(null);
  
  // Check storage permission
  useEffect(() => {
    const checkStoragePermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          console.log('Storage permission status:', hasPermission);
          setHasStoragePermission(hasPermission);
        } catch (error) {
          console.error('Error checking storage permission:', error);
          setHasStoragePermission(false);
        }
      } else {
        // On iOS, we don't need explicit storage permission
        setHasStoragePermission(true);
      }
    };
    
    checkStoragePermission();
  }, []);
  
  // Temporary solution: use a timer to take photos periodically instead of frame processor
  useEffect(() => {
    let interval;
    
    if (device && hasPermission && cameraRef.current) {
      console.log('Setting up photo capture interval');
      
      // Check if we have storage permission
      const checkStoragePermission = async () => {
        if (Platform.OS === 'android') {
          const hasStoragePermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          
          if (!hasStoragePermission) {
            console.warn('Storage permission denied, some features may be limited');
            // Show a warning to the user
            Alert.alert(
              'Limited Functionality',
              'Storage permission was denied. The app will still work, but some features may be limited.',
              [{ text: 'OK' }]
            );
          }
        }
      };
      
      checkStoragePermission();
      
      // Start with a longer interval to reduce resource usage
      interval = setInterval(async () => {
        try {
          if (cameraRef.current && !isProcessing) {
            console.log('Taking photo...');
            const photo = await cameraRef.current.takePhoto({
              qualityPrioritization: 'speed',
              flash: 'off',
              enableShutterSound: false,
              skipMetadata: true, // Skip metadata to improve performance
            });
            
            console.log('Photo taken:', photo.path);
            // Process the photo with YOLO
            processPhotoWithYolo(photo.path);
          } else if (isProcessing) {
            console.log('Skipping photo capture - still processing previous photo');
          } else if (!cameraRef.current) {
            console.error('Camera reference is not available');
          }
        } catch (error) {
          console.error('Error taking photo:', error);
          // If there's an error, we might need to reset the camera
          if (error.message && error.message.includes('Camera not ready')) {
            console.log('Camera not ready, attempting to reset...');
            // You could implement a camera reset mechanism here if needed
          }
        }
      }, 5000); // Take a photo every 5 seconds instead of 2 seconds
    }
    
    return () => {
      if (interval) {
        console.log('Clearing photo capture interval');
        clearInterval(interval);
      }
    };
  }, [device, hasPermission, processPhotoWithYolo, isProcessing]);
  
  // Function to process a photo with YOLO
  const processPhotoWithYolo = useCallback(async (photoPath) => {
    if (!yoloSession) {
      console.log('YOLO session not initialized yet');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Processing photo with YOLO:', photoPath);
      
      // Check if the photo file exists
      try {
        const exists = await RNFS.exists(photoPath);
        if (!exists) {
          console.error('Photo file does not exist:', photoPath);
          Alert.alert('Error', 'Photo file not found. Please try again.');
          setIsProcessing(false);
          return;
        }
      } catch (existsError) {
        console.error('Error checking if photo exists:', existsError);
        // Continue anyway, as some devices might have issues with RNFS.exists
      }
      
      // Get file stats to verify it's a valid file
      try {
        const stats = await RNFS.stat(photoPath);
        console.log('Photo file stats:', stats);
        
        if (stats.size === 0) {
          console.error('Photo file is empty');
          Alert.alert('Error', 'Photo file is empty. Please try again.');
          setIsProcessing(false);
          return;
        }
      } catch (statsError) {
        console.error('Error getting photo stats:', statsError);
        // Continue anyway, as we might still be able to read the file
      }
      
      // Read the image file
      console.log('Reading photo file...');
      let imageData;
      try {
        imageData = await RNFS.readFile(photoPath, 'base64');
        console.log('Photo file read successfully, size:', imageData.length);
        
        if (!imageData || imageData.length === 0) {
          console.error('Failed to read photo data');
          Alert.alert('Error', 'Failed to read photo data. Please try again.');
          setIsProcessing(false);
          return;
        }
      } catch (readError) {
        console.error('Error reading photo file:', readError);
        Alert.alert('Error', 'Failed to read photo. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      // For debugging, save a simplified version of the image data
      console.log('Image data sample:', imageData.substring(0, 50) + '...');
      
      // Create a simple mock detection for testing
      // This will help verify if the UI is working correctly
      const mockDetections = [
        {
          label: 'Test Object',
          confidence: 0.95,
          bbox: { x: 0.2, y: 0.3, width: 0.3, height: 0.2 }
        }
      ];
      
      console.log('Setting mock detections for testing');
      setDetectedObjects(mockDetections);
      
      // TODO: Implement actual YOLO processing when the frame processor is working
      // The following code is commented out until we can properly process the image
      /*
      // Convert base64 to array buffer
      const buffer = Buffer.from(imageData, 'base64');
      
      // Create a tensor from the image data
      const inputTensor = new ort.Tensor(
        'float32',
        new Float32Array(buffer),
        [1, 3, 640, 640] // Adjust dimensions based on your model's requirements
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
      */
    } catch (err) {
      console.error('Error processing photo with YOLO:', err);
      Alert.alert('Processing Error', 'Failed to process the photo. Please try again.');
    } finally {
      // Clean up the temporary photo file
      try {
        await RNFS.unlink(photoPath);
        console.log('Deleted temporary photo file');
      } catch (err) {
        console.error('Error deleting temporary photo:', err);
        // Don't show an alert for this error as it's not critical
      }
      
      setIsProcessing(false);
    }
  }, [yoloSession]);

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
          
          // Check if the model already exists in the document directory
          const exists = await RNFS.exists(destPath);
          if (exists) {
            console.log('Model already exists in document directory, using it');
            modelPath = destPath;
          } else {
            console.log('Copying model from assets to document directory');
            try {
              // Check if we have storage permission
              const hasStoragePermission = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
              );
              
              if (!hasStoragePermission) {
                console.warn('Storage permission denied, trying to use asset directly');
                // Try to use the asset directly (may not work on all devices)
                try {
                  // Try to create the model in cache directory instead
                  const cachePath = `${RNFS.CacheDirPath}/yolov8n.onnx`;
                  await RNFS.copyFileAssets('yolov8n.onnx', cachePath);
                  console.log('Successfully copied model to cache directory');
                  modelPath = cachePath;
                } catch (cacheError) {
                  console.error('Error copying to cache:', cacheError);
                  // As a last resort, try to use the asset directly
                  modelPath = 'asset:/yolov8n.onnx';
                  console.log('Attempting to use asset directly:', modelPath);
                }
              } else {
                // List assets to verify the model file is there
                const assets = await RNFS.readDirAssets('');
                console.log('Assets directory contents:', assets.map(a => a.name).join(', '));
                
                // Copy the file from assets
                await RNFS.copyFileAssets('yolov8n.onnx', destPath);
                console.log('Successfully copied model from assets');
                modelPath = destPath;
              }
            } catch (copyError) {
              console.error('Error copying model from assets:', copyError);
              
              // Try a fallback approach - use the asset directly
              try {
                modelPath = 'asset:/yolov8n.onnx';
                console.log('Attempting to use asset directly as fallback:', modelPath);
              } catch (assetError) {
                console.error('Error using asset directly:', assetError);
                Alert.alert(
                  'Model Loading Error',
                  'Could not access the YOLO model. Please check app permissions.',
                  [{ text: 'OK' }]
                );
                return;
              }
            }
          }
        } else {
          modelPath = `${RNFS.MainBundlePath}/yolov8n.onnx`;
        }
        
        console.log('Attempting to load model from:', modelPath);
        
        // Verify file exists (skip for asset:/ paths which can't be checked with exists)
        if (!modelPath.startsWith('asset:')) {
          const exists = await RNFS.exists(modelPath);
          if (!exists) {
            console.error('YOLO model file not found at:', modelPath);
            Alert.alert(
              'Model Not Found',
              'The YOLO model file could not be found. Please reinstall the app.',
              [{ text: 'OK' }]
            );
            return;
          }

          // Get file stats to verify it's a valid file
          const stats = await RNFS.stat(modelPath);
          console.log('Model file stats:', stats);
          
          if (stats.size === 0) {
            console.error('YOLO model file is empty');
            Alert.alert(
              'Invalid Model',
              'The YOLO model file is empty. Please reinstall the app.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        // Load the model
        console.log('Creating inference session...');
        const session = await ort.InferenceSession.create(modelPath);
        console.log('Model loaded successfully');
        setYoloSession(session);
      } catch (err) {
        console.error('Error loading YOLO model:', err);
        Alert.alert(
          'Model Loading Error',
          `Failed to load the YOLO model: ${err.message}`,
          [{ text: 'OK' }]
        );
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

  // Request camera permissions
  useEffect(() => {
    const checkAndRequestCameraPermission = async () => {
      try {
        let cameraPermission = false;
        let storagePermission = false; // Track storage permission separately
        
        if (Platform.OS === 'android') {
          console.log('Checking Android camera permissions...');
          
          // Check if camera permission is already granted
          const hasCameraPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );

          // Check if storage permission is already granted
          const hasStoragePermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );

          console.log('Existing camera permission:', hasCameraPermission);
          console.log('Existing storage permission:', hasStoragePermission);

          // Request permissions if not already granted
          if (!hasCameraPermission) {
            const cameraResult = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                title: 'Camera Permission',
                message: 'This app needs access to your camera to detect objects',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            cameraPermission = cameraResult === PermissionsAndroid.RESULTS.GRANTED;
          } else {
            cameraPermission = true; // Camera permission already granted
          }

          if (!hasStoragePermission) {
            const storageResult = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              {
                title: 'Storage Permission',
                message: 'This app needs access to your storage to save photos',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            storagePermission = storageResult === PermissionsAndroid.RESULTS.GRANTED;
          } else {
            storagePermission = true; // Storage permission already granted
          }

          // Log the final permission status
          console.log('Final camera permission status:', cameraPermission);
          console.log('Final storage permission status:', storagePermission);
          
          setHasPermission(cameraPermission);
          setHasStoragePermission(storagePermission); // Update state for storage permission
          
          // If camera permission was denied, show an alert
          if (!cameraPermission) {
            Alert.alert(
              'Permission Required',
              'Camera permission is required to use this feature. Please enable it in your device settings.',
              [{ text: 'OK' }]
            );
          }
          
          // If storage permission was denied, show a warning
          if (!storagePermission) {
            Alert.alert(
              'Limited Functionality',
              'Storage permission was denied. The app will still work, but some features may be limited.',
              [{ text: 'OK' }]
            );
          }
        } else {
          // For iOS, first check the current authorization status
          const status = await Camera.getCameraPermissionStatus();
          console.log('iOS camera permission status:', status);
          
          if (status === 'authorized') {
            console.log('Camera permission already granted');
            setHasPermission(true);
            return;
          }
          
          // If not authorized, request permission
          const result = await Camera.requestCameraPermission();
          console.log('iOS camera permission result:', result);
          cameraPermission = result === 'authorized';
          
          // For iOS, storage permission is not required
          storagePermission = true;
        }

      } catch (err) {
        console.error('Error requesting camera permission:', err);
        setCameraError('Failed to request camera permission: ' + err.message);
        setHasPermission(false);
        setHasStoragePermission(false); // Ensure storage permission state is updated
      }
    };

    checkAndRequestCameraPermission();
  }, []);

  // Handle device initialization
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (hasPermission === null) {
          console.log('Waiting for permission status...');
          return; // Wait for permission to be determined
        }

        if (!hasPermission) {
          console.log('Camera permission not granted');
          return;
        }

        // Wait for devices to be available
        if (!devices || devices.length === 0) {
          console.log('No camera devices detected yet, waiting...');
          return;
        }

        // Log available devices with more details
        console.log('Available devices:', devices);
        devices.forEach((device, index) => {
          console.log(`Device ${index}:`, device);
        });

        // Prefer back camera, fall back to front
        const firstDevice = getFirstDevice();
        if (firstDevice) {
          console.log('Using camera:', firstDevice);
          setDevice(firstDevice);
          setIsBackCamera(firstDevice === devices.back);
        } else {
          console.log('No usable camera device found');
          setCameraError('No camera device found');
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        setCameraError('Failed to initialize camera');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCamera();
  }, [hasPermission, devices]);

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
        {hasPermission === null ? (
          <View style={styles.permissionOverlay}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        ) : !hasPermission ? (
          <View style={styles.permissionOverlay}>
            <Text style={styles.permissionText}>Camera permission denied</Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={() => {
                // Reset permission state to trigger the permission request again
                setHasPermission(null);
              }}
            >
              <Text style={styles.permissionButtonText}>Request Permission Again</Text>
            </TouchableOpacity>
          </View>
        ) : device ? (
          <>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              enableZoomGesture={true}
              photo={true}
            />
            
            {/* Show storage permission warning if needed */}
            {hasStoragePermission === false && (
              <View style={styles.warningOverlay}>
                <Text style={styles.warningText}>
                  Storage permission denied. Some features may be limited.
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.flipButton, { backgroundColor: 'rgba(255,255,255,0.7)' }]} 
              onPress={() => {
                const newDevice = isBackCamera ? devices.front : devices.back;
                if (newDevice) {
                  setDevice(newDevice);
                  setIsBackCamera(!isBackCamera);
                }
              }}
            >
              <Icon name="flip-camera-android" size={24} color="black" />
            </TouchableOpacity>
            
            {/* Add a button to manually take a photo */}
            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={async () => {
                if (cameraRef.current) {
                  try {
                    const photo = await cameraRef.current.takePhoto({
                      qualityPrioritization: 'speed',
                      flash: 'off',
                    });
                    console.log('Manual photo taken:', photo.path);
                    processPhotoWithYolo(photo.path);
                  } catch (err) {
                    console.error('Error taking manual photo:', err);
                    Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
                  }
                }
              }}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.permissionOverlay}>
            <Text style={styles.permissionText}>
              {isLoading ? 'Initializing camera...' : cameraError || 'No camera available'}
            </Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingText}>Processing with YOLO...</Text>
          </View>
        )}

        {/* Display detected objects */}
        {detectedObjects.map((obj, index) => (
          <View key={index} style={[
            styles.detectionBox,
            {
              left: obj.bbox.x * 100 + '%',
              top: obj.bbox.y * 100 + '%',
              width: obj.bbox.width * 100 + '%',
              height: obj.bbox.height * 100 + '%',
            }
          ]}>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
    fontWeight: '600',
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
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.7)',
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
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 4,
  },
  detectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  warningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 165, 0, 0.8)', // Orange with transparency
    padding: 10,
    alignItems: 'center',
    zIndex: 100,
  },
  warningText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
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
  permissionButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CameraScreen;
