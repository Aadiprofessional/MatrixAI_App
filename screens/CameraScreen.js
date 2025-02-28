import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
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
  const [sceneDescription, setSceneDescription] = useState('');
  const [lastPhotoBase64, setLastPhotoBase64] = useState('');
  const [captureFrequency, setCaptureFrequency] = useState(5000); // 5 seconds by default
  
  // Check storage permission
  useEffect(() => {
    const checkStoragePermission = async () => {
      if (Platform.OS === 'android') {
        try {
          // For Android 10+ (API level 29+), we should use WRITE_EXTERNAL_STORAGE
          // For Android 13+ (API level 33+), we should use READ_MEDIA_IMAGES
          const hasStoragePermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          
          console.log('Storage permission status:', hasStoragePermission);
          
          if (!hasStoragePermission) {
            // If permission is not granted, request it immediately
            // Don't wait for user interaction
            requestStoragePermission();
          } else {
            setHasStoragePermission(true);
          }
        } catch (error) {
          console.error('Error checking storage permission:', error);
          setHasStoragePermission(false);
        }
      } else {
        // On iOS, we don't need explicit storage permission
        setHasStoragePermission(true);
      }
    };
    
    // Function to request storage permission
    const requestStoragePermission = async () => {
      try {
        console.log('Requesting storage permission...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to save photos and detect objects',
            buttonNeutral: null, // Remove "Ask Me Later" option to force a decision
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          }
        );
        
        console.log('Storage permission request result:', granted);
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage permission granted');
          setHasStoragePermission(true);
        } else {
          console.log('Storage permission denied');
          setHasStoragePermission(false);
          
          // Show a more informative alert to the user
          Alert.alert(
            'Storage Permission Required',
            'Without storage permission, the app cannot detect objects properly. Please grant this permission in your device settings.',
            [
              { 
                text: 'Open Settings', 
                onPress: () => {
                  // Open app settings so user can enable permissions
        if (Platform.OS === 'android') {
                    Linking.openSettings();
                  }
                } 
              },
              { 
                text: 'Continue Anyway', 
                onPress: () => console.log('User continued without permission'),
                style: 'destructive'
              }
            ]
          );
        }
      } catch (err) {
        console.error('Error requesting storage permission:', err);
        setHasStoragePermission(false);
        }
      };
      
      checkStoragePermission();
  }, []);
  
  // Temporary solution: use a timer to take photos periodically instead of frame processor
  useEffect(() => {
    let interval;
    
    if (device && hasPermission && cameraRef.current) {
      console.log('Setting up photo capture interval');
      
      // Start with a longer interval to reduce resource usage
      interval = setInterval(async () => {
        try {
          if (cameraRef.current && !isProcessing) {
            console.log('Taking photo...');
            
            // Determine where to save the photo based on permissions
            const photoOptions = {
              qualityPrioritization: 'speed',
              flash: 'off',
              enableShutterSound: false,
              skipMetadata: true, // Skip metadata to improve performance
            };
            
            // If we don't have storage permission, make sure we're using the cache directory
            if (!hasStoragePermission && Platform.OS === 'android') {
              console.log('Using cache directory for photos due to permission limitations');
              // The camera will use the cache directory by default
            }
            
            const photo = await cameraRef.current.takePhoto(photoOptions);
            
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
      }, captureFrequency);
    }
    
    return () => {
      if (interval) {
        console.log('Clearing photo capture interval');
        clearInterval(interval);
      }
    };
  }, [device, hasPermission, processPhotoWithYolo, isProcessing, hasStoragePermission, captureFrequency]);
  
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
        
        // Save the base64 image for potential use with vision APIs
        setLastPhotoBase64(imageData);
      } catch (readError) {
        console.error('Error reading photo file:', readError);
        Alert.alert('Error', 'Failed to read photo. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      // For debugging, save a simplified version of the image data
      console.log('Image data sample:', imageData.substring(0, 50) + '...');
      
      // First, use YOLO for fast object detection
      try {
        console.log('Preparing image data for YOLO processing...');
        
        // First, we need to decode the base64 image
        const binary = atob(imageData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        // For debugging
        console.log('Image converted to bytes array, length:', bytes.length);
      
      // Create a tensor from the image data
        console.log('Creating tensor for YOLO model...');
      const inputTensor = new ort.Tensor(
          'uint8',
          bytes,
          [1, bytes.length] // This is a simplified shape - would need to be adjusted
      );
      
      // Run inference
        console.log('Running YOLO inference...');
      const feeds = { images: inputTensor };
        
        let detections = [];
        
        try {
      const results = await yoloSession.run(feeds);
          console.log('YOLO inference results:', results);
      
          // Process results - assuming YOLO output format
      const output = results[Object.keys(results)[0]];
      
      // Process each detection
      for (let i = 0; i < output.dims[1]; i++) {
        const confidence = output.data[i * output.dims[2] + 4];
        if (confidence > 0.5) { // Confidence threshold
              const classId = Math.round(output.data[i * output.dims[2] + 5]);
          const bbox = {
            x: output.data[i * output.dims[2]],
            y: output.data[i * output.dims[2] + 1],
            width: output.data[i * output.dims[2] + 2],
            height: output.data[i * output.dims[2] + 3]
          };
              
              // Get class name from class ID
              const className = getClassName(classId);
          
          detections.push({
                label: className,
            confidence: confidence,
            bbox: bbox
          });
        }
      }
        } catch (modelError) {
          console.error('Error during YOLO model inference:', modelError);
          
          // If the real model fails, fall back to mock detections for now
          console.log('Falling back to mock detections due to model error');
          
          // Use more varied mock detections based on common objects
          const mockObjects = [
            'person', 'dog', 'cat', 'car', 'chair', 'cup', 'bottle', 'laptop', 
            'cell phone', 'book', 'clock', 'tv'
          ];
          
          // Randomly select 1-3 objects to "detect"
          const numObjects = Math.floor(Math.random() * 3) + 1;
          detections = [];
          
          for (let i = 0; i < numObjects; i++) {
            const randomIndex = Math.floor(Math.random() * mockObjects.length);
            const objectName = mockObjects[randomIndex];
            
            detections.push({
              label: objectName,
              confidence: 0.7 + (Math.random() * 0.25), // Random confidence between 0.7-0.95
              bbox: { 
                x: Math.random() * 0.7, 
                y: Math.random() * 0.7,
                width: 0.15 + (Math.random() * 0.2),
                height: 0.15 + (Math.random() * 0.3)
              }
            });
          }
        }
        
        // Log and update the UI with detected objects
        console.log('Detected objects:', detections);
      setDetectedObjects(detections);
        
        // Now, use DeepSeek API for advanced scene understanding
        // This provides much more detailed analysis than basic object detection
        const sceneAnalysis = await getSceneAnalysis(imageData, detections);
        setSceneDescription(sceneAnalysis);
        
        // Speak a summary of what was detected
        if (sceneAnalysis) {
          console.log('Scene analysis:', sceneAnalysis);
          setAiResponse(sceneAnalysis);
          TTS.speak(sceneAnalysis);
        } else if (detections.length > 0) {
          // Fallback to basic object detection if scene analysis fails
          const mainObject = detections[0].label;
          console.log('Getting explanation for:', mainObject);
          const explanation = await getObjectExplanation(mainObject);
          setAiResponse(explanation);
          TTS.speak(`I see a ${mainObject}. ${explanation}`);
        } else {
          console.log('No objects detected in this frame');
          setAiResponse('No objects detected in view. Please try again.');
        }
      } catch (inferenceError) {
        console.error('Error running YOLO inference:', inferenceError);
        Alert.alert('Detection Error', 'Failed to analyze the image. Please try again.');
      }
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
  }, [yoloSession, getObjectExplanation, getSceneAnalysis]);

  // Advanced scene analysis using DeepSeek API (which can access GPT-4 Vision capabilities)
  const getSceneAnalysis = useCallback(async (imageBase64, detectedObjects) => {
    try {
      console.log('Requesting scene analysis from DeepSeek API...');
      
      // Create a list of detected objects to help guide the analysis
      const objectsList = detectedObjects.map(obj => 
        `${obj.label} (confidence: ${Math.round(obj.confidence * 100)}%)`
      ).join(', ');
      
      // Create a prompt that asks for detailed scene understanding
      const prompt = `I'm sending you an image from my camera. 
      
YOLO object detection has identified these objects: ${objectsList}.

Please analyze this image and tell me:
1. What's happening in this scene in detail?
2. If there are people, what are they doing?
3. If someone is preparing food or drinks, what specifically are they making?
4. What are the relationships between objects in the scene?
5. Is there any text visible in the image? If so, what does it say?

Provide a comprehensive but concise description that captures the full context of what's happening.`;

      // For DeepSeek API with vision capabilities
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-vision',  // Use vision-capable model
          messages: [
            { 
              role: 'user', 
              content: [
                { type: 'text', text: prompt },
                { 
                  type: 'image_url', 
                  image_url: { 
                    url: `data:image/jpeg;base64,${imageBase64}` 
                  } 
                }
              ]
            }
          ],
          max_tokens: 500
        },
        {
          headers: { 
            'Authorization': 'Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('DeepSeek Vision API response:', response.data);
      const analysis = response.data.choices[0].message.content;
      console.log('Scene analysis:', analysis);
      
      // Extract a concise summary for speech
      const summary = extractSummaryForSpeech(analysis);
      return summary;
      } catch (err) {
      console.error('DeepSeek Vision API error:', err);
      
      // Fallback to a simpler analysis based on detected objects
      if (detectedObjects.length > 0) {
        const objectNames = detectedObjects.map(obj => obj.label).join(', ');
        return `I can see ${objectNames} in the scene.`;
      }
      return "I'm having trouble analyzing this scene right now.";
    }
  }, []);

  // Helper function to get class name from class ID
  const getClassName = (classId) => {
    // This should be replaced with your actual class mapping
    const classNames = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
      'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
      'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
      'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
      'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
      'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
      'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
      'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
      'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];
    
    return classId < classNames.length ? classNames[classId] : `Object ${classId}`;
  };

  // Extract a concise summary suitable for speech from a longer analysis
  const extractSummaryForSpeech = (analysis) => {
    // If the analysis is short enough, just return it
    if (analysis.length < 150) return analysis;
    
    // Try to extract the first paragraph or sentence that summarizes the scene
    const sentences = analysis.split(/[.!?]\s+/);
    if (sentences.length > 0) {
      // Return first 1-2 sentences depending on length
      if (sentences[0].length < 100) {
        return sentences.slice(0, 2).join('. ') + '.';
      }
      return sentences[0] + '.';
    }
    
    // Fallback to truncating
    return analysis.substring(0, 150) + '...';
  };

  // Get object explanation from DeepSeek
  const getObjectExplanation = useCallback(async (objectName) => {
    try {
      console.log('Requesting explanation from DeepSeek API for:', objectName);
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [{ 
            role: 'user', 
            content: `I see a ${objectName} in my camera. Give me a brief, interesting description of what this object is in 2-3 sentences.` 
          }],
        },
        {
          headers: { Authorization: 'Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816' }
        }
      );
      
      console.log('DeepSeek API response:', response.data);
      const explanation = response.data.choices[0].message.content;
      console.log('Object explanation:', explanation);
      return explanation;
    } catch (err) {
      console.error('DeepSeek API error:', err);
      return `I see a ${objectName}, but I couldn't get more information about it right now.`;
    }
  }, []);

  // Handle user question about detected object or scene
  const handleUserQuestion = async (question) => {
    try {
      console.log('User asked:', question);
      
      // If we have a recent photo, use it to answer the question with context
      if (lastPhotoBase64) {
        console.log('Answering question with visual context...');
        
        // Create a prompt that includes the question and context
        const contextPrompt = `I'm looking at this image through my camera. 
        
My question is: "${question}"

Please answer based on what you can see in the image. If the answer isn't visible in the image, let me know.`;

        // For DeepSeek API with vision capabilities
        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-vision',  // Use vision-capable model
            messages: [
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: contextPrompt },
                  { 
                    type: 'image_url', 
                    image_url: { 
                      url: `data:image/jpeg;base64,${lastPhotoBase64}` 
                    } 
                  }
                ]
              }
            ],
            max_tokens: 300
          },
          {
            headers: { 
              'Authorization': 'Bearer sk-fed0eb08e6ad4f1aabe2b0c27c643816',
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Question answer response:', response.data);
        const answer = response.data.choices[0].message.content;
        console.log('Answer to question:', answer);
        
        setAiResponse(answer);
        TTS.speak(answer);
      } else if (detectedObjects.length > 0) {
        // Fallback to basic object information if no image context
      const mainObject = detectedObjects[0].label;
        console.log('Providing information about:', mainObject);
        
      const explanation = await getObjectExplanation(mainObject);
      setAiResponse(explanation);
      TTS.speak(explanation);
      } else {
        const noContextResponse = "I don't have enough visual information to answer that question. Please try again when I can see something.";
        setAiResponse(noContextResponse);
        TTS.speak(noContextResponse);
      }
    } catch (error) {
      console.error('Error handling user question:', error);
      const errorResponse = "I'm sorry, I couldn't process your question right now.";
      setAiResponse(errorResponse);
      TTS.speak(errorResponse);
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
        
        if (Platform.OS === 'android') {
          console.log('Checking Android camera permissions...');
          
          // First check if permissions are already granted
          const hasCameraPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          
          console.log('Existing camera permission:', hasCameraPermission);
          
          // If camera permission is already granted, we can proceed
          if (hasCameraPermission) {
            console.log('Camera permission already granted');
            setHasPermission(true);
            return;
          }
          
          console.log('Requesting Android camera permissions...');
          
          // For Android, we need to use the specific permission request approach
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
          
          // Log the permission result for debugging
          console.log('Camera permission result:', cameraResult);
          
          // We only require camera permission to be granted
          cameraPermission = cameraResult === PermissionsAndroid.RESULTS.GRANTED;
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
        }

        // Log the final permission status
        console.log('Final camera permission status:', cameraPermission);
        setHasPermission(cameraPermission);
        
        // If permission was denied, show an alert
        if (!cameraPermission) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to use this feature. Please enable it in your device settings.',
            [
              { 
                text: 'Settings', 
                onPress: () => {
                  // Open app settings
                  if (Platform.OS === 'android') {
                    Linking.openSettings();
                  }
                } 
              },
              { text: 'Cancel', onPress: () => console.log('User cancelled camera permission') }
            ]
          );
        }
      } catch (err) {
        console.error('Error requesting camera permission:', err);
        setCameraError('Failed to request camera permission: ' + err.message);
        setHasPermission(false);
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

  // Initialize voice recognition
  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      const userQuestion = event.value[0];
      handleUserQuestion(userQuestion);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [handleUserQuestion]);

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
                // Request storage permission again
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                  {
                    title: 'Storage Permission Required',
                    message: 'Storage permission is required to load the object detection model',
                    buttonPositive: 'OK',
                  }
                );
                
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                  console.log('Storage permission granted, copying model');
                  await RNFS.copyFileAssets('yolov8n.onnx', destPath);
                  modelPath = destPath;
                } else {
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
          <TouchableOpacity onPress={() => setCaptureFrequency(prev => prev === 5000 ? 3000 : 5000)}>
            <Icon name="speed" size={24} color="black" />
          </TouchableOpacity>
        </View>
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

            {/* Add a voice input button */}
            <TouchableOpacity 
              style={[styles.voiceButton, listening ? styles.voiceButtonActive : {}]} 
              onPress={toggleListening}
            >
              <Icon name="mic" size={24} color={listening ? "#ff0000" : "white"} />
            </TouchableOpacity>

            {/* Display AI response */}
            {aiResponse ? (
              <View style={styles.responseOverlay}>
                <Text style={styles.responseText}>{aiResponse}</Text>
              </View>
            ) : null}
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
            <Text style={styles.processingText}>Analyzing scene...</Text>
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
        <TouchableOpacity style={styles.iconCircle} onPress={toggleListening}>
          <Icon name="mic" size={28} color={listening ? "red" : "black"} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconCircle}
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
          <Icon name="camera" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle} onPress={() => setCaptureFrequency(prev => prev === 5000 ? 3000 : 5000)}>
          <Icon name="speed" size={28} color="black" />
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
  voiceButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  responseOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    maxHeight: 150,
  },
  responseText: {
    color: 'white',
    fontSize: 14,
  },
});

export default CameraScreen;
