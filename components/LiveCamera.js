import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { requestCameraPermission } from 'react-native-permissions';
import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import axios from 'axios';

const LiveCamera = ({ onClose }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') || devices[0];
  const camera = useRef(null);
  const [detectedObjects, setDetectedObjects] = useState([]);

  // Frame processor to analyze frames in real-time
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const base64Image = frame.toBase64(); // Convert frame to base64
    runOnJS(analyzeFrame)(base64Image); // Send frame for analysis
  }, []);

  // Function to send frame to Azure Computer Vision API
  const analyzeFrame = async (base64Image) => {
    const endpoint = "https://<your-region>.api.cognitive.microsoft.com/vision/v3.2/analyze";
    const apiKey = "<your-api-key>";

    try {
      const response = await axios.post(
        endpoint,
        base64Image,
        {
          headers: {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": apiKey,
          },
        }
      );

      const objects = response.data.objects || [];
      setDetectedObjects(objects); // Update detected objects
    } catch (error) {
      console.error("Error analyzing frame:", error);
    }
  };

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  if (!hasPermission) {
    return <ActivityIndicator size="large" />;
  }

  if (!device) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />

      {/* Overlay detected objects on the camera feed */}
      <View style={styles.overlay}>
        {detectedObjects.map((obj, index) => (
          <Text key={index} style={styles.objectText}>
            {obj.objectProperty}: {obj.name}
          </Text>
        ))}
      </View>

      {/* Close button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 10,
  },
  objectText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default LiveCamera;
