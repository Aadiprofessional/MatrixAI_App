import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const devices = useCameraDevices();
  const [device, setDevice] = useState(null);
  const [isBackCamera, setIsBackCamera] = useState(true);

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
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.backIcon} />
      </TouchableOpacity>

      <View style={styles.camera}>
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

      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.tab}><Text>Friends</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabActive}><Text>Recommend</Text></TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity>
          <Image source={require('../assets/voice.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={require('../assets/mic.png')} style={styles.icon} />
        </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            const newDevice = isBackCamera ? devices.front : devices.back;
            if (newDevice) {
              setDevice(newDevice);
              setIsBackCamera(!isBackCamera);
            }
          }}>
            <Image source={require('../assets/Change.png')} style={styles.icon} />
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
  backIcon: {
    width: 24,
    height: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 5,
  },
  iconSmall: {
    width: 16,
    height: 16,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  tab: {
    padding: 5,
  },
  tabActive: {
    padding: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'black',
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
});

export default CameraScreen;
