import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, PermissionsAndroid, Platform, Animated, Alert, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AudioRecord from 'react-native-audio-record';
import { Image } from 'react-native-animatable';
import * as Animatable from 'react-native-animatable';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import Voice from '@react-native-voice/voice';

const VoiceTranslateScreen = () => {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcription, setTranscription] = useState('Click on mic and start speaking...');
  const [isLoading, setIsLoading] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
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
  const [audioFilePath, setAudioFilePath] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Recording Permission',
            message: 'This app needs access to your microphone to perform voice recognition.',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.error('Microphone permission denied');
        }
      }
    };
    requestPermissions();

    // Initialize Voice recognition
    Voice.onSpeechStart = () => {
      console.log('Speech started');
      setTranscription('Listening...');
    };
    Voice.onSpeechEnd = () => {
      console.log('Speech ended');
      if (!isPaused) {
        setTranscription(prev => prev + ' [Ended]');
      }
    };
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscription(prev => {
          // Only update if we're not paused
          if (!isPaused) {
            return e.value[0];
          }
          return prev;
        });
      }
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setTranscription(prev => {
          // Only update if we're not paused
          if (!isPaused) {
            return e.value[0];
          }
          return prev;
        });
      }
    };
    Voice.onSpeechError = (e) => {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    };

    AudioRecord.on('data', data => {
     
    });

    return () => {
      AudioRecord.stop();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);


  const handleStartListening = async () => {
    if (isListening) {
      console.log('Already listening!');
      return;
    }

    setIsLoading(true);
    setIsListening(true);
    setIsPaused(false);

    try {
      // Start audio recording
      AudioRecord.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        wavFile: `${uuidv4()}.wav`,
      });
      AudioRecord.start();

      // Start voice recognition
      await Voice.start(selectedLanguage);
      
      setTranscription('Listening...');
      setRecordingStartTime(Date.now());
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      setIsLoading(false);
    }
  };

  const handlePauseListening = async () => {
    setIsPaused(true);
    try {
      // Stop recording but keep the file
      const result = await AudioRecord.stop();
      
      // Stop speech recognition
      await Voice.stop();
      
      // Save current state
      setAudioFilePath(result);
      setAudioFile({ 
        uri: result, 
        type: 'audio/wav', 
        name: `${uuidv4()}.wav`
      });
      
      setTranscription(prev => prev + ' [Paused]');
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  };

  const handleResumeListening = async () => {
    setIsPaused(false);
    try {
      // Start a new recording session
      await AudioRecord.start();
      
      // Restart speech recognition
      await Voice.start(selectedLanguage);
      setTranscription(prev => prev.replace(' [Paused]', ''));
    } catch (error) {
      console.error('Error resuming recording:', error);
    }
  };

  const handleStopListening = async () => {
    setIsListening(false);
    setIsLoading(false);
    setIsPaused(false);

    try {
      // Stop both audio recording and speech recognition
      const result = await AudioRecord.stop();
      await Voice.stop();
      
      setAudioFilePath(result);
      setAudioFile({ 
        uri: result, 
        type: 'audio/wav', 
        name: `${uuidv4()}.wav`
      });
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const handleUpload = async () => {
    setUploading(true);

    try {
      let fileToUpload = audioFile;
      
      // If recording is active, stop it and get the file
      if (isListening) {
        const result = await AudioRecord.stop();
        await Voice.stop();
        
        fileToUpload = { 
          uri: result, 
          type: 'audio/wav', 
          name: `${uuidv4()}.wav`
        };
        
        setAudioFilePath(result);
        setAudioFile(fileToUpload);
        setIsListening(false);
        setIsPaused(false);
      }

      if (!fileToUpload) {
        throw new Error('No audio file available');
      }

      const user = '595dfce5-0898-4364-9046-0aa850190321';
      const { uri, name } = fileToUpload;
      const duration = Math.floor((Date.now() - recordingStartTime) / 1000);

      const formData = new FormData();
      formData.append('audio', { 
        uri, 
        type: fileToUpload.type, 
        name 
      });
      formData.append('uid', user);
      formData.append('duration', duration);
      formData.append('transcription', transcription);

      // Add timeout to fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://ddtgdhehxhgarkonvpfq.functions.supabase.co/uploadAudio', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'File uploaded successfully');
        setAudioFile(null);
        setAudioFilePath('');
        setTranscription('Click on mic and start speaking...');
      } else {
        throw new Error(result.error || 'Failed to upload the file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Error', 
        error.message === 'Network request failed' 
          ? 'Please check your internet connection'
          : error.message || 'An error occurred during file upload'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAudioFile = () => {
    setAudioFilePath('');
    setAudioFile(null);
  };


  const filterLanguages = (query) => {
    if (!query) {
      return languages;
    }
    return languages.filter((lang) =>
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

  const navigateToTranslateScreen = () => {
    navigation.navigate('TranslateScreen3', { transcription: transcription, language: selectedLanguage });
    toggleModal();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.headerIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.languageBox} onPress={toggleModal}>
          <Text style={styles.languageText}>{selectedLanguage}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.liveTranslateButton}
          onPress={() => navigation.navigate('LiveTranslateScreen')}
        >
          <Image source={require('../assets/Translate.png')} style={styles.liveTranslateIcon} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.transcriptionText]}>
        {transcription}
      </Text>

      <View style={styles.bottomButtons}>
        {isListening ? (
          <>
            {isPaused ? (
              <TouchableOpacity style={styles.button} onPress={handleResumeListening}>
                <Image source={require('../assets/play.png')} style={styles.icon} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.button} onPress={handlePauseListening}>
                <Image source={require('../assets/pause.png')} style={styles.icon} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.button, uploading && styles.disabledButton]} 
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Image source={require('../assets/Tick.png')} style={styles.icon} />
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleStartListening}
            disabled={uploading}
          >
            <Image 
              source={require('../assets/mic.png')} 
              style={[styles.icon, uploading && styles.disabledIcon]} 
            />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleModal}
      >
        <TouchableWithoutFeedback onPress={toggleModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.header}>
                  <Text style={styles.headerText}>All Languages</Text>
                  <TouchableOpacity 
                    onPress={navigateToTranslateScreen} 
                    style={styles.convertButtonContainer}
                  >
                    <Image 
                      source={require('../assets/Translate.png')} 
                      style={styles.convertButtonIcon} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                  <Image 
                    source={require('../assets/search.png')} 
                    style={styles.searchIcon} 
                  />
                  <TextInput
                    placeholder="Search Language"
                    style={styles.textInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <FlatList
                  data={filterLanguages(searchQuery)}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.languageItem} 
                      onPress={() => handleLanguageSelect(item)}
                    >
                      <Text style={styles.languageItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.value}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
     
    backgroundColor: '#f9f9f9',
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  liveTranslateButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    backgroundColor: '#007bff',
    borderRadius: 50,
    padding: 8,
  },
  liveTranslateIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  disabledIcon: {
    opacity: 0.5,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageBox: {
    backgroundColor: '#FF6600',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 'auto',
  },
  languageText: {
    color: 'white',
    fontSize: 16,
  },
  transcriptionText: {
    fontSize: 20,
    marginVertical: 20,
    color: '#141515FF',
    textAlign: 'center',
    zIndex:100,
  },
  microphoneButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
  },
  microphoneIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  tickButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,  // Adjust position if needed
  },
  tickIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  speechWave: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechWaveIcon: {
    width: 40,
    height: 40,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    maxHeight: '80%',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  convertButtonContainer: {
    backgroundColor: '#007bff',
    borderRadius: 17,
    padding: 10,
  },
  convertButtonIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  languageItem: {
    padding: 10,
    backgroundColor: '#D6D6D65A',
    borderRadius: 10,
    marginVertical: 5,
  },
  languageItemText: {
    fontSize: 16,
    color: '#333',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
  },
});

export default VoiceTranslateScreen;
