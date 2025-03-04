import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
const images = [
  { src: require('../assets/VideoImages/image1.png'), name: 'Cinematic' },
  { src: require('../assets/VideoImages/image2.png'), name: 'Vlog' },
  { src: require('../assets/VideoImages/image3.png'), name: 'Travel' },
  { src: require('../assets/VideoImages/image4.png'), name: 'Food' },
  { src: require('../assets/VideoImages/image5.png'), name: 'Fashion' },
  { src: require('../assets/VideoImages/image6.png'), name: 'Dance' },
];

const tick = require('../assets/Tick.png');

const ImageSelectScreen = ({ route }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState(5); // Store as number (5 or 10)
  const [videoRatio, setVideoRatio] = useState('1280:768');
  const [isDropdownVisible, setDropdownVisible] = useState({
    duration: false,
    ratio: false,
  });

  const navigation = useNavigation();
  const {  UID,ImageUrl } = route.params || {};

  const handleSelect = (index) => setSelectedIndex(index);

  const handleCancel = () => {
    setSelectedIndex(null);
    navigation.goBack();
  };


  const handleOk = () => {
    if (selectedIndex !== null && prompt.trim()) {
      const selectedName = images[selectedIndex].name;
      navigation.navigate('CreateVideoScreen', {
        videoType: selectedName,
        UID,
        prompt,
        videoDuration, // Send numeric value
        videoRatio,
        ImageUrl
      });
    }
  };

  const closeDropdowns = () => {
    setDropdownVisible({ duration: false, ratio: false });
    Keyboard.dismiss(); // Close keyboard as well
  };

  return (
    <TouchableWithoutFeedback onPress={closeDropdowns}>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Video Type</Text>
        <Text style={styles.subtitle}>
          Please select the type of video you want to create.
        </Text>
        <FlatList
          data={images}
          keyExtractor={(_, index) => index.toString()}
          numColumns={3}
          contentContainerStyle={styles.imageGrid}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => handleSelect(index)}
            >
              <Image source={item.src} style={styles.image} />
              <Text style={styles.imageLabel}>{item.name}</Text>
              {selectedIndex === index && (
                <View style={styles.overlay}>
                  <Image source={tick} style={styles.tick} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
        <View style={styles.row}>
          {/* Video Duration Dropdown */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() =>
              setDropdownVisible((prev) => ({
                ...prev,
                duration: !prev.duration,
                ratio: false,
              }))
            }
          >
            <Text style={styles.dropdownText}>{videoDuration} seconds</Text>
          </TouchableOpacity>
          {/* Video Ratio Dropdown */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() =>
              setDropdownVisible((prev) => ({
                ...prev,
                ratio: !prev.ratio,
                duration: false,
              }))
            }
          >
            <Text style={styles.dropdownText}>{videoRatio}</Text>
          </TouchableOpacity>
        </View>
        {/* Duration Dropdown Options */}
        {isDropdownVisible.duration && (
          <View style={styles.dropdownOptions}>
            {[5, 10].map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.option}
                onPress={() => {
                  setVideoDuration(option);
                  setDropdownVisible({ duration: false, ratio: false });
                }}
              >
                <Text>{option} seconds</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Ratio Dropdown Options */}
        {isDropdownVisible.ratio && (
          <View style={styles.dropdownOptions}>
            {['Landscape:1280:768', 'Portrait: 768:1280'].map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.option}
                onPress={() => {
                  setVideoRatio(option);
                  setDropdownVisible({ duration: false, ratio: false });
                }}
              >
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TextInput
          style={styles.textInput}
          placeholder="Please write prompt to continue"
          placeholderTextColor="#007AFF"
          value={prompt}
          onChangeText={setPrompt}
        />
        {selectedIndex !== null && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.okButton,
                !(prompt.trim() && selectedIndex !== null) && styles.disabledButton,
              ]}
              onPress={handleOk}
              disabled={!(prompt.trim() && selectedIndex !== null)}
            >
              <View style={styles.horizontalContent}>
                <Text style={styles.okText}>OK</Text>
                <Text style={styles.coinText}>   -10</Text>
                <Image
                  source={require('../assets/coin.png')}
                  style={styles.coinIcon}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 16,
     
  },
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 12,
    height: 12,
    marginTop: 2,
  },
  coinText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  imageGrid: {
    justifyContent: 'center',
  },
  imageContainer: {
    margin: 8,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  imageLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 17,
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tick: {
    width: 40,
    height: 40,
  },
  row: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdown: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dropdownText: {
    color: '#333',
    fontSize: 14,
  },
  dropdownOptions: {
    position: 'absolute',
    bottom:170,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    zIndex: 10,
    width: '80%',
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  textInput: {
    width: '80%',
    height: 40,
    borderColor: '#007AFF',
    borderWidth: 1,
    marginBottom:10,
    borderRadius: 20,
    paddingHorizontal: 10,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '80%',
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  okButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  okText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ImageSelectScreen;
