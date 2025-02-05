import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back; // Using back camera

  useEffect(() => {
    const getPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'authorized');
    };

    getPermission();
  }, []);

  

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.backIcon} />
      </TouchableOpacity>

      <Camera style={styles.camera} device={device} isActive={true} />

     

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
          <TouchableOpacity>
            <Image source={require('../assets/close.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
