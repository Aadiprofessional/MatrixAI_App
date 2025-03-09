import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, PermissionsAndroid, Platform, Animated, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native-animatable';
import * as Animatable from 'react-native-animatable';
import Voice from '@react-native-voice/voice';
import { SafeAreaView } from 'react-native-safe-area-context';

const VoiceTranslateScreen = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('Click on mic and start speaking...');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isModalVisible, setModalVisible] = useState(false);
  const [languages, setLanguages] = useState([
    { label: 'English', value: 'en-US' },
    { label: 'Spanish', value: 'es-ES' },
    { label: 'French', value: 'fr-FR' },
    { label: 'German', value: 'de-DE' },
    { label: 'Italian', value: 'it-IT' },
    { label: 'Portuguese', value: 'pt-PT' },
    { label: 'Russian', value: 'ru-RU' },
    { label: 'Chinese', value: 'zh-CN' },
    { label: 'Japanese', value: 'ja-JP' },
    { label: 'Korean', value: 'ko-KR' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [textAnimation] = useState(new Animated.Value(0));

  const navigation = useNavigation();

  useEffect(() => {
    // Set up Voice listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;
    
    // Request permissions
    requestPermissions();
    
    // Clean up on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Request microphone permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Recording Permission',
            message: 'This app needs access to your microphone to perform voice recognition.',
            buttonPositive: 'Grant Permission',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.error('Microphone permission denied');
          Alert.alert(
            'Permission Required',
            'Microphone permission is required for voice recognition. Please enable it in app settings.'
          );
        }
      } catch (err) {
        console.error('Error requesting audio permission:', err);
      }
    }
  };

  // Speech recognition event handlers
  const onSpeechStart = () => {
    console.log('Speech started');
    setTranscription('Listening...');
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    setIsListening(false);
  };

  const onSpeechPartialResults = (e) => {
    if (e.value && e.value.length > 0) {
      setTranscription(e.value[0]);
    }
  };

  const onSpeechResults = (e) => {
    if (e.value && e.value.length > 0) {
      setTranscription(e.value[0]);
    }
  };

  const onSpeechError = (e) => {
    console.error('Speech recognition error:', e);
    setIsListening(false);
    Alert.alert('Error', 'Speech recognition failed. Please try again.');
  };

  const handleStartListening = async () => {
    if (isListening) {
      console.log('Already listening!');
      return;
    }

    try {
      setIsListening(true);
      setTranscription('Listening...');
      
      // Start voice recognition with selected language
      const languageValue = languages.find(lang => lang.label === selectedLanguage)?.value || 'en-US';
      console.log('Starting Voice recognition with language:', languageValue);
      
      await Voice.start(languageValue);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      Alert.alert('Error', `Failed to start listening: ${error.message}`);
    }
  };

  const handleStopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const filterLanguages = (query) => {
    return languages.filter(lang => 
      lang.label.toLowerCase().includes(query.toLowerCase())
    );
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.label);
    toggleModal();
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Recognition</Text>
     
      </View>

      <View style={styles.languageSelector}>
        <TouchableOpacity style={styles.languageButton} onPress={toggleModal}>
          <Text style={styles.languageText}>{selectedLanguage}</Text>
          <Image source={require('../assets/downArrow.png')} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.transcriptionContainer}>
        <Animatable.Text 
          animation="fadeIn" 
          style={styles.transcriptionText}
        >
          {transcription}
        </Animatable.Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.micButton, isListening ? styles.activeButton : null]} 
          onPress={isListening ? handleStopListening : handleStartListening}
        >
          <Image 
            source={isListening ? require('../assets/Tick.png') : require('../assets/mic.png')} 
            style={styles.micIcon} 
          />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <TouchableWithoutFeedback onPress={toggleModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Language</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <FlatList
                  data={filterLanguages(searchQuery)}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.languageItem}
                      onPress={() => handleLanguageSelect(item)}
                    >
                      <Text style={styles.languageItemText}>{item.label}</Text>
                      {selectedLanguage === item.label && (
                        <Image source={require('../assets/Tick.png')} style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#007bff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  translateIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  languageSelector: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: '#007bff',
  },
  transcriptionContainer: {
    flex: 1,
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transcriptionText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  activeButton: {
    backgroundColor: '#dc3545',
  },
  micIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#f1f3f4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageItemText: {
    fontSize: 16,
  },
  checkIcon: {
    width: 20,
    height: 20,
    tintColor: '#007bff',
  },
});

export default VoiceTranslateScreen;
