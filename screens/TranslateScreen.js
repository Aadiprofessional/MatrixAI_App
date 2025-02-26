import React, { useEffect, useState, useRef, forwardRef } from 'react';const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  import {
      View,
      Text,
      StyleSheet,
      TouchableOpacity,
      TouchableWithoutFeedback,
      Share,
      ScrollView,
      Image,
      TextInput,
      Switch,
      Modal,
      ActivityIndicator,
      FlatList,
      Animated,
      NativeModules,
      Dimensions,
  } from 'react-native';
import { PDFDocument, rgb, PNGImage } from 'react-native-pdf-lib';
import LottieView from 'lottie-react-native';

import { svg2png } from 'svg-png-converter';
import RNFS from 'react-native-fs';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider'; // Import the Slider component

  import { useNavigation } from '@react-navigation/native';
  import Sound from 'react-native-sound';
  import ForceDirectedGraph from '../components/mindMap';
  import ForceDirectedGraph2 from '../components/mindMap2';
  import { Picker } from '@react-native-picker/picker';
  import DropDownPicker from 'react-native-dropdown-picker';
  import Svg, { Path } from 'react-native-svg';
  const TranslateScreen = ({ route }) => {
    const graphRef = useRef(null);
      const { audioid ,uid} = route.params || {};
      const scrollY = new Animated.Value(0);
      const playerHeight = scrollY.interpolate({
          inputRange: [0, 200],
          outputRange: [120, 60],
          extrapolate: 'clamp',
      });
      const playerPadding = scrollY.interpolate({
          inputRange: [0, 200],
          outputRange: [16, 8],
          extrapolate: 'clamp',
      });
    
      const [waveformHeights, setWaveformHeights] = useState([]);
      const [isTranscriptionGenerating, setIsTranscriptionGenerating] = useState(false);
const [transcriptionGeneratedFor, setTranscriptionGeneratedFor] = useState(new Set());

      const [is2xSpeed, setIs2xSpeed] = useState(false);
      const [isRepeatMode, setIsRepeatMode] = useState(false);
      const [editingStates, setEditingStates] = useState([]);
      const [transcription, setTranscription] = useState([]);
   
      const [sliderWidth, setSliderWidth] = useState(Dimensions.get('window').width);
      const [isLoading, setIsLoading] = useState(true);
      const [paragraphs, setParagraphs] = useState([]);
      const [audioUrl, setAudioUrl] = useState('');
      const [keyPoints, setKeypoints] = useState('');
      const [XMLData, setXMLData] = useState('');
      const [duration, setDuration] = useState('');
      const audioPlayerRef = useRef(null);
      const [isFullScreen, setIsFullScreen] = useState(false);
      const [showMindMap, setShowMindMap] = useState(false);
      const scrollViewRef = useRef(null);
      const [isSeeking, setIsSeeking] = useState(false);

      const isTranscriptionEmpty = transcription  === '';
      const coin = require('../assets/coin.png');
      const [currentWordIndex, setCurrentWordIndex] = useState({
          paraIndex: 0,
          wordIndex: 0,
          word: ''
      });

      useEffect(() => {
        if (scrollViewRef.current && currentWordIndex.paraIndex !== undefined) {
          // Calculate approximate y position based on paragraph index
          const yOffset = currentWordIndex.paraIndex * 200; // 200 is estimated height per paragraph
          scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
        }
      }, [currentWordIndex.paraIndex]);
      const [wordTimings, setWordTimings] = useState([]);
      const navigation = useNavigation();
     
      const [isAudioLoading, setIsAudioLoading] = useState(false);
      const [fileName, setFileName] = useState('');
      const [fileContent, setFileContent] = useState('');
      const [isSliderVisible, setSliderVisible] = useState(false);
      const [isTranscriptionVisible, setTranscriptionVisible] = useState(false);
      const [isSpeechToTextEnabled, setSpeechToTextEnabled] = useState(true);
      const [isEditingEnabled, setEditingEnabled] = useState(true);
   
      const [translations, setTranslations] = useState([]);
      const [selectedButton, setSelectedButton] = useState('transcription');
      const [selectedLanguage, setSelectedLanguage] = useState('zh');
      const [translatedText, setTranslatedText] = useState('');
   
    
      const [showDropdown, setShowDropdown] = useState(false);
      const [audioPosition, setAudioPosition] = useState(0);
      const [audioDuration, setAudioDuration] = useState(0);
      const [isAudioPlaying, setIsAudioPlaying] = useState(false);
      const [sound, setSound] = useState(null);
      const resizeIcon = require('../assets/robot.png');
    
     
      const languages = [
          { label: 'Chinese', value: 'zh' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Hindi', value: 'hi' },
      ];
  
      const handleSelectLanguage = (value) => {
          setSelectedLanguage(value);
          setShowDropdown(false); // Close dropdown after selection
      };
  

  
      const isMounted = useRef(true);
  
    useEffect(() => {
        const fetchData = async () => {
            const cachedData = await AsyncStorage.getItem(`audioData-${audioid}`);
            if (cachedData) {
                const { transcription, paragraphs, audioUrl, keyPoints, XMLData } = JSON.parse(cachedData);
                setTranscription(transcription);
                setParagraphs(paragraphs);
                setAudioUrl(audioUrl);
                setKeypoints(keyPoints);
               
                setIsLoading(false);
            } else {
                fetchAudioMetadata(uid, audioid);
            }
        };

        fetchData();
    }, [uid, audioid]);

    const togglePlaybackSpeed = () => {
        const newSpeed = is2xSpeed ? 1 : 2; // Toggle between 1x and 2x
        if (audioPlayerRef.current) {
            audioPlayerRef.current.setRateAsync(newSpeed, true); // Set playback speed
            setIs2xSpeed(!is2xSpeed); // Update state
        }
    };
    
  
    const fetchAudioMetadata = async (uid, audioid) => {
        try {
            const response = await fetch('https://matrix-server.vercel.app/getAudioFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uid, audioid }),
            });
            const data = await response.json();
    
            if (response.ok) {
                // Set state with fetched data
                setTranscription(data.transcription || '');
                setFileName(data.audio_name || 'Untitled');
                setFileContent(data.file_path || '');
                setDuration(data.duration)
    
                // Handle transcription
                let paragraphs = [];
                let wordTimings = [];
                if (data.transcription) {
                    const { paragraphs: para, words } = splitTranscription(data.transcription);
                    paragraphs = para;
                    setParagraphs(para);
                    if (data.duration) {
                        wordTimings = calculateParagraphTimings(words, data.duration);
                        setWordTimings(wordTimings);
                    }
                }
    
                // Handle audio chunks with enhanced playback options
                let audioUrl = data.audio_url;
                if (data.chunk_urls && Array.isArray(data.chunk_urls)) {
                    const audioSource = await downloadAndCombineAudio(data.chunk_urls);
                    if (audioSource && audioSource.type === 'blob') {
                        audioUrl = audioSource.url;
                    } else if (audioSource && audioSource.type === 'chunked') {
                        audioUrl = audioSource.urls[0]; // Start with first chunk URL
                    } else if (audioSource && audioSource.type === 'direct') {
                        audioUrl = audioSource.url;
                    }
                }
                setAudioUrl(audioUrl);
    
                // Set key points and XML data
                setKeypoints(data.key_points || '');
                setXMLData(data.xml_data || '');
    
                // Save data to local storage
                const audioData = {
                    transcription: data.transcription || '',
                    fileName: data.audio_name || 'Untitled',
                    fileContent: data.file_path || '',
                    paragraphs,
                    wordTimings,
                    audioUrl,
                    keyPoints: data.key_points || '',
                    XMLData: data.xml_data || '',
                };
                await AsyncStorage.setItem(`audioData-${audioid}`, JSON.stringify(audioData));
            } else {
                console.error('Error fetching audio metadata:', data.error);
            }
        } catch (error) {
            console.error('Error fetching audio metadata:', error);
        } finally {
            setIsLoading(false);
        }
    };
   
    const downloadAndCombineAudio = async (chunkUrls) => {
        if (!chunkUrls || !Array.isArray(chunkUrls) || chunkUrls.length === 0) {
            console.error('Invalid chunk URLs');
            return null;
        }

        try {
            if (isMounted.current) {
                setIsAudioLoading(true);
            }
            
            // Download chunks with progress tracking
            const chunks = await Promise.all(chunkUrls.map(async (url, index) => {
                let retries = 3;
                while (retries > 0) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const blob = await response.blob();
                        if (!blob || blob.size === 0) {
                            throw new Error('Empty blob received');
                        }
                        return blob;
                    } catch (error) {
                        retries--;
                        if (retries === 0) throw error;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }));

            // Validate chunks
            if (chunks.some(chunk => !(chunk instanceof Blob) || chunk.size === 0)) {
                throw new Error('Invalid or empty chunk data received');
            }

            // Determine content type from first valid chunk
            const contentType = chunks.find(chunk => chunk.type)?.type || 'audio/mpeg';

            // Combine chunks with detailed validation
            let combinedBlob;
            try {
                console.log('Creating Blob from', chunks.length, 'chunks');
                combinedBlob = new Blob(chunks, { type: contentType });
                
                if (!combinedBlob) {
                    throw new Error('Blob creation returned null');
                }
                
                if (combinedBlob.size === 0) {
                    throw new Error('Created empty Blob (0 bytes)');
                }
                
                if (!combinedBlob.type) {
                    console.warn('Blob has no type, defaulting to audio/mpeg');
                    combinedBlob = new Blob(chunks, { type: 'audio/mpeg' });
                }
                
                console.log('Created Blob:', {
                    size: combinedBlob.size,
                    type: combinedBlob.type
                });
            } catch (error) {
                console.error('Error combining chunks:', {
                    error: error.message,
                    chunkCount: chunks.length,
                    chunkSizes: chunks.map(c => c.size)
                });
                return null;
            }

            // Create URL with enhanced error handling and fallbacks
            let combinedUrl;
            try {
              
                
                // Check memory using React Native's Memory module
                const memoryInfo = await NativeModules.Memory.getMemoryInfo();
                if (memoryInfo && memoryInfo.used > memoryInfo.total * 0.8) {
                    console.warn('Low memory detected - using chunked playback');
                    return {
                        type: 'chunked',
                        urls: chunkUrls
                    };
                }
                
                // Try creating blob URL with timeout
                combinedUrl = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('URL creation timeout'));
                    }, 5000); // 5 second timeout
                    
                    try {
                        const url = URL.createObjectURL(combinedBlob);
                        if (!url) {
                            throw new Error('URL.createObjectURL returned null');
                        }
                        if (!url.startsWith('blob:')) {
                            throw new Error('Invalid URL format');
                        }
                        clearTimeout(timeout);
                        resolve(url);
                    } catch (error) {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });
                
            
                return {
                    type: 'blob',
                    url: combinedUrl
                };
                
            } catch (error) {
              
                
                // Clean up the blob if URL creation failed
                if (combinedBlob) {
                    try {
                        combinedBlob.close && combinedBlob.close();
                    } catch (cleanupError) {
                        console.error('Error cleaning up blob:', cleanupError);
                    }
                }
                
                // Fallback to direct file streaming
                console.warn('Falling back to direct file streaming');
                return {
                    type: 'direct',
                    url: chunkUrls[0]
                };
            }

            // Set cleanup handler
          

        } catch (error) {
            console.error('Error downloading/combining audio:', error);
            return null;
        } finally {
            if (isMounted.current) {
                setIsAudioLoading(false);
            }
        }
    };


  

    const toggleEdit = (index) => {
        const newEditingStates = [...editingStates];
        newEditingStates[index] = !newEditingStates[index];
        setEditingStates(newEditingStates);
    };

   
   


    const toggleSlider = () => setSliderVisible(!isSliderVisible);

 

    const toggleTextEditing = () => {
        setEditingEnabled(!isEditingEnabled);
        // Reset all editing states when toggling editing mode
        setEditingStates(Array(paragraphs.length).fill(false));
    };
   

    const toggleSpeechToText = () => {
        setSpeechToTextEnabled(!isSpeechToTextEnabled);
        // This will control the visibility of timestamps
    };

  

    
    const handleOutsidePress = () => {
        if (isSliderVisible) {
            setSliderVisible(false);
        }
    };

    const azureEndpoint = 'https://api.cognitive.microsofttranslator.com';
    const azureKey = '21oYn4dps9k7VJUVttDmU3oigC93LUtyYB9EvQatENmWOufZa4xeJQQJ99ALACYeBjFXJ3w3AAAbACOG0HQP';
    const region = 'eastus';

 
    
    const handleButtonPress = (button) => {
        setSelectedButton(button);
    
        if (button === 'mindMap') {
            
            fetchAudioMetadata(uid, audioid); 
        }
    };
    useEffect(() => {
     
            fetchAudioMetadata(uid, audioid);
     
    }, [uid, audioid, selectedButton]); 
        
    const splitTranscription = (text) => {
        if (!text) return [];
        const words = text.split(' ');
        const chunks = [];
        for (let i = 0; i < words.length; i += 75) {
            chunks.push(words.slice(i, i + 75).join(' '));
        }
        return { paragraphs: chunks, words };
    };

    const calculateParagraphTimings = (paragraphs, duration) => {
        if (!paragraphs.length || !duration) return [];
        return paragraphs.map((para, index) => ({
            start: index * 40,
            end: (index + 1) * 47,
            words: para.split(' ')
        }));
    };

    useEffect(() => {
        // Generate random heights for the waveform bars
        const heights = Array(100).fill(0).map(() => Math.floor(Math.random() * (60 - 10 + 1)) + 10);
        setWaveformHeights(heights);
    }, []);


    const onAudioProgress = (progress) => {
        if (!progress || !progress.currentTime || !progress.duration || !paragraphs.length) return;
        
        const currentTime = Number(progress.currentTime.toFixed(2));
        const totalDuration = Number(progress.duration.toFixed(2));
        
        // Calculate equal duration per paragraph
        const paraDuration = totalDuration / paragraphs.length;
        
        // Calculate current paragraph index
        const paraIndex = Math.floor(currentTime / paraDuration);
        
        if (paraIndex !== currentWordIndex.paraIndex && paraIndex < paragraphs.length) {
            setCurrentWordIndex({
                paraIndex
            });
        }
    };


    // Audio player functions
    const loadAudio = () => {
        if (sound) {
            sound.release();
        }
        
        const newSound = new Sound(audioUrl, null, (error) => {
            if (error) {
                console.error('Failed to load sound', error);
                return;
            }
            setAudioDuration(newSound.getDuration());
            setSound(newSound);
        });
    };

    const toggleAudioPlayback = () => {
        if (!sound) return;
        
        if (isAudioPlaying) {
            sound.pause();
        } else {
            sound.play((success) => {
                if (success) {
                    setIsAudioPlaying(false);
                    setAudioPosition(audioDuration); // Set to the end of the audio
                    // This resets the position to the start
                } else {
                    console.error('Playback failed');
                }
            });
            
        }
        setIsAudioPlaying(!isAudioPlaying);
    };

    const seekAudio = (seconds) => {
        if (!sound) return;
        
        const newPosition = Math.max(0, Math.min(audioPosition + seconds, audioDuration));
        sound.setCurrentTime(newPosition);
        setAudioPosition(newPosition);
    };

   
    
 
    useEffect(() => {
        if (audioUrl) {
            loadAudio();
        }
        
        return () => {
            if (sound) {
                sound.release();
            }
        };
    }, [audioUrl]);

    useEffect(() => {
        let interval;
        if (isAudioPlaying) {
            interval = setInterval(() => {
                if (sound) {
                    sound.getCurrentTime((seconds) => {
                        setAudioPosition(seconds);
                        onAudioProgress({
                            currentTime: seconds,
                            duration: audioDuration
                        });
                    });
                }
            }, 100);
        }
        
        return () => clearInterval(interval);
    }, [isAudioPlaying, sound]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: transcription || 'No transcription available.',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handlePress = async () => {
        if (transcriptionGeneratedFor.has(audioid)) return;
    
        setIsTranscriptionGenerating(true);
    
        try {
            const formData = new FormData();
            formData.append('uid', uid);
            formData.append('audioid', audioid);
    
            const response = await fetch('https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/convertAudio', {
                method: 'POST',
                body: formData,
            });
    
            const data = await response.json();
          
    
           
            
            if (response.ok) {
                setTranscriptionGeneratedFor(prev => new Set(prev).add(audioid));
                await fetchAudioMetadata(uid, audioid); // Reload data from API
            } else {
                console.error('Transcription generation failed:', await response.text());
            }
        } catch (error) {
            console.error('Error generating transcription:', error);
        } finally {
            setIsTranscriptionGenerating(false);
        }
    };
    
    const handleValueChange = (value) => {
        setAudioPosition(value);
      };
    
      const handleLayout = (event) => {
        const { width } = event.nativeEvent.layout;
        setSliderWidth(width);
      };
    
      // Calculate the position of the custom thumb
      const thumbPosition = (audioPosition / audioDuration) * sliderWidth;
    
    const handleTranslateParagraph = async (index) => {
        if (!paragraphs[index]) return;
    
        try {
            const response = await fetch(
                `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${selectedLanguage}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': azureKey,
                        'Ocp-Apim-Subscription-Region': region,
                    },
                    body: JSON.stringify([{ Text: paragraphs[index] }]),
                }
            );
    
            const data = await response.json();
            console.log('Paragraph Translation Response:', data);  // Log the response to check its structure
    
            // Check if the translation is available
            if (data && data[0] && data[0].translations && data[0].translations[0]) {
                const translation = data[0].translations[0].text;
    
                setTranslations((prev) => {
                    const updatedTranslations = [...prev];
                    updatedTranslations[index] = translation;
                    return updatedTranslations;
                });
            } else {
                console.error('Translation data is not in the expected format:', data);
            }
        } catch (error) {
            console.error('Translation error:', error);
        }
    };
   
    const handleFloatingButtonPress = () => {
        if (transcription) {
            navigation.navigate('BotScreen2', { transcription , XMLData,uid,audioid });
        } else {
            alert('No transcription to translate.');
        }
    };
    useEffect(() => {
        let interval;
        if (isAudioPlaying) {
            interval = setInterval(() => {
                if (sound && !isSeeking) { // Only update if not seeking
                    sound.getCurrentTime((seconds) => {
                        setAudioPosition(seconds);
                        onAudioProgress({
                            currentTime: seconds,
                            duration: audioDuration
                        });
                    });
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isAudioPlaying, sound, isSeeking]);
    
    const toggleTranscriptionVisibility = () => {
        setTranscriptionVisible(!isTranscriptionVisible);
    };

    return (
        <View style={styles.container}>
                 <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                    <Image
                        source={require('../assets/back.png')}
                        style={styles.icon}
                    />
                </TouchableOpacity>
                <Text style={styles.header}>
                    {fileName.length > 20 ? `${fileName.substring(0, 20)}...` : fileName}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                        <Image
                            source={require('../assets/share.png')}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleSlider}>
                        <Image
                            source={require('../assets/threeDot.png')}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            {/* Header Section */}
            {isLoading ? (
                <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
            ) : (
                <>
       
                </>
            )}

{audioUrl && (
    <Animated.View style={[
        styles.audioPlayerContainer,
        {
          height: playerHeight,
          padding: playerPadding,
          borderRadius: playerPadding,
        }
      ]}>
        {/* Lottie Animation at the top */}
  
        {/* Container for inputRange: 120 */}
        <Animated.View style={[
            styles.audioControlsContainer2,
          {
            opacity: playerHeight.interpolate({
              inputRange: [60, 120],
              outputRange: [1, 0], // Visible at 120, hidden at 60
              extrapolate: 'clamp'
            }),
            transform: [
              {
                scale: playerHeight.interpolate({
                  inputRange: [60, 120],
                  outputRange: [0.8, 1], // Optional: Add a scaling effect
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}>
       
            {/* Play/Pause Button */}
            <TouchableOpacity onPress={toggleAudioPlayback} style={styles.playButton}>
              <View style={[styles.playButton2]}>
                <Image
                  source={isAudioPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
                  style={styles.playIcon2}
                />
              </View>
            </TouchableOpacity>
  
            {/* Slider (80% width) */}
            <Animated.View style={[
              styles.waveformBox2,
              {
                width: '80%', // Fixed 80% width
                height: playerHeight._value - 40,
              }
            ]}>
              <View style={[styles.waveformContainer, {
                height: playerHeight._value - 40,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center', // Center slider horizontally
              }]}>
                {/* Slider with Progress Trail */}
                <View style={styles.container69} onLayout={handleLayout}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={audioDuration}
                  value={audioPosition}
                  onValueChange={handleValueChange}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="orange" // Hide the default thumb
                />
               
              
                </View>
  
                {/* Lottie Animation for Waves */}
                <View style={styles.waveAnimationContainer}>
                  <LottieView
                    source={require('../assets/waves.json')} // Add your Lottie animation JSON here
                    autoPlay={isAudioPlaying} // Sync with audio playback
                    loop
                    style={styles.waveAnimation}
                  />
                  {/* Mask to Reveal Animation */}
                  <Animated.View
                    style={[
                      styles.mask,
                      {
                        width: `${100 - (audioPosition / audioDuration) * 100}%`, // Dynamic width based on progress
                      }
                    ]}
                  />
                </View>
              </View>
            </Animated.View>
        
        </Animated.View>
  
        {/* Container for inputRange: 60 */}
        <Animated.View style={[
          styles.audioControlsContainer,
          {
            opacity: playerHeight.interpolate({
              inputRange: [60, 120],
              outputRange: [0, 1], // Visible at 60, hidden at 120
              extrapolate: 'clamp'
            }),
            transform: [
              {
                scale: playerHeight.interpolate({
                  inputRange: [60, 120],
                  outputRange: [0.8, 1], // Optional: Add a scaling effect
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}>
          {/* Slider (100% width) */}
          <Animated.View style={[
            styles.waveformBox,
            {
              width: '95%', // Full width
              height: playerHeight._value - 40,
            }
          ]}>
            <View style={[styles.waveformContainer, {
              height: playerHeight._value - 40,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center', // Center slider horizontally
            }]}>
              {/* Slider with Progress Trail */}
              <View style={styles.container69} onLayout={handleLayout}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={audioDuration}
                  value={audioPosition}
                  onValueChange={handleValueChange}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="transparent" // Hide the default thumb
                />
                {/* Custom Thumb */}
                <View
                  style={[
                    styles.customThumb,
                    { left: thumbPosition -1 }, // Adjust for thumb width
                  ]}
                />
              </View>
  
              {/* Lottie Animation for Waves */}
              <View style={styles.waveAnimationContainer2}>
                <LottieView
                  source={require('../assets/waves.json')} // Add your Lottie animation JSON here
                  autoPlay={isAudioPlaying} // Sync with audio playback
                  loop
                  style={styles.waveAnimation2}
                />
                {/* Mask to Reveal Animation */}
                <Animated.View
                  style={[
                    styles.mask2,
                    {
                      width: `${100 - (audioPosition / audioDuration) * 100}%`, // Dynamic width based on progress
                    }
                  ]}
                />
              </View>
            </View>
          </Animated.View>
  
          {/* Time Container */}
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, styles.leftTime]}>{formatTime(audioPosition)}</Text>
            <Text style={[styles.timeText, styles.rightTime]}>{formatTime(audioDuration)}</Text>
          </View>
  
          {/* Additional Controls */}
          <Animated.View style={[styles.controls, {
            opacity: playerHeight.interpolate({
              inputRange: [60, 120],
              outputRange: [0, 1], // Visible at 60, hidden at 120
              extrapolate: 'clamp'
            })
          }]}>
            <TouchableOpacity onPress={() => setIsRepeatMode(!isRepeatMode)}>
              <Image
                source={require('../assets/repeat.png')}
                style={[
                  styles.navIcon2,
                  { tintColor: isRepeatMode ? 'orange' : 'gray' } // Change color based on state
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekAudio(-10)}>
              <Image
                source={require('../assets/backward.png')}
                style={styles.navIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleAudioPlayback}>
              <Image
                source={isAudioPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
                style={styles.playIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekAudio(10)}>
              <Image
                source={require('../assets/forward.png')}
                style={styles.navIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlaybackSpeed}>
              <Image
                source={require('../assets/2x.png')}
                style={[
                  styles.navIcon2,
                  { tintColor: is2xSpeed ? 'orange' : 'gray' } // Change color based on state
                ]}
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
)}




            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.button, selectedButton === 'transcription' ? styles.selectedButton : null]}
                    onPress={() => handleButtonPress('transcription')}>
                    <Text style={[styles.buttonText, selectedButton === 'transcription' ? styles.buttonText2 : null]}>
                        Transcription
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, selectedButton === 'mindMap' ? styles.selectedButton : null]}
                    onPress={() => handleButtonPress('mindMap')}>
                    <Text style={[styles.buttonText, selectedButton === 'mindMap' ? styles.buttonText2 : null]}>
                        Mind Map
                    </Text>
                </TouchableOpacity>
            </View>
        


{isTranscriptionEmpty && (
    <Text style={styles.generatingText}>Generating Transcription May take some time...</Text>
)}

            {selectedButton === 'transcription' && (
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.contentContainer}
                    onScroll={(event) => {
                        const offsetY = event.nativeEvent.contentOffset.y;
                        scrollY.setValue(offsetY);
                    }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    scrollEventThrottle={16}
                >
                    
                    {paragraphs.map((para, index) => (
                        <View key={index} style={[
                            styles.paragraphContainer,
                            styles.paragraphWrapper,
                            index === currentWordIndex && styles.highlightedParagraph
                        ]}>
                            {isSpeechToTextEnabled && (
                                <Text style={[styles.timestamp, {color: 'orange'}]}>
                                    {formatTime(wordTimings[index]?.start || 0)}
                                </Text>
                            )}
                            <View style={styles.paragraphRow}>
                                {editingStates[index] ? (
                                    <TextInput
                                        style={[
                                            styles.paragraphText,
                                            styles.editableText,
                                            index === currentWordIndex.paraIndex && styles.highlightedParagraph
                                        ]}
                                        value={para}
                                        onChangeText={(text) => {
                                            const newParagraphs = [...paragraphs];
                                            newParagraphs[index] = text;
                                            setParagraphs(newParagraphs);
                                        }}
                                        multiline
                                    />
                                ) : (
                                    <Text style={[
                                        styles.paragraphText,
                                        index === currentWordIndex.paraIndex && styles.highlightedParagraph
                                    ]}>
                                        {para}
                                    </Text>
                                )}
                                {isEditingEnabled && (
                                    <TouchableOpacity 
                                        onPress={() => toggleEdit(index)}
                                        style={styles.editIcon}
                                    >
                                        <Image
                                            source={require('../assets/pencil.png')}
                                            style={styles.pencilIcon}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {isTranscriptionVisible && translations[index] && (
                                <Text style={styles.translatedText}>{translations[index]}</Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}


{selectedButton === 'mindMap' && (
    <View style={styles.contentContainer}>
                   <ForceDirectedGraph 
                     ref={graphRef}
                     transcription={transcription} 
                     uid={uid} 
                     audioid={audioid} 
                     xmlData={XMLData} 
                   />



                   <View style={{flexDirection: 'row', position: 'absolute', bottom: 10, left: '15%'}}>
           
            <TouchableOpacity 
                onPress={() => setIsFullScreen(true)} 
                style={styles.centerFloatingButton}
            >
                <Image
                    source={require('../assets/maximize.png')}
                    style={styles.buttonImage3}
                />
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={async () => {
                    try {
                        // Create PDF path
                        const pdfPath = `${RNFS.CachesDirectoryPath}/graph_${Date.now()}.pdf`;
                        
                        // Create new PDF document
                        const pdfDoc = await PDFDocument.create();
                        if (!pdfDoc) {
                            throw new Error('Failed to create PDF document');
                        }

                        // Create page with A4 dimensions
                        const page = pdfDoc.addPage([595.28, 841.89]);
                        if (!page) {
                            throw new Error('Failed to create PDF page');
                        }

                        // Add title
                        page.drawText('Force Directed Graph', {
                            x: 50,
                            y: 800,
                            size: 20,
                            color: rgb(0, 0, 0),
                        });

                        // Add date
                        page.drawText(`Generated: ${new Date().toLocaleString()}`, {
                            x: 50,
                            y: 780,
                            size: 12,
                            color: rgb(0, 0, 0),
                        });

                        // Add graph description
                        page.drawText('This document contains the visualization of the Force Directed Graph', {
                            x: 50,
                            y: 750,
                            size: 12,
                            color: rgb(0, 0, 0),
                        });

                        // Serialize PDF
                        const pdfBytes = await pdfDoc.save();
                        if (!pdfBytes || pdfBytes.length === 0) {
                            throw new Error('Failed to generate PDF bytes');
                        }

                        // Write to file
                        await RNFS.writeFile(pdfPath, pdfBytes, 'base64');
                        
                        // Verify file
                        const fileExists = await RNFS.exists(pdfPath);
                        if (!fileExists) {
                            throw new Error('PDF file was not created');
                        }

                        // Get file info
                        const fileInfo = await RNFS.stat(pdfPath);
                        if (!fileInfo || fileInfo.size === 0) {
                            throw new Error('PDF file is empty');
                        }

                        // Share PDF
                        await Share.open({
                            url: `file://${pdfPath}`,
                            type: 'application/pdf',
                            title: 'Share Graph PDF',
                            subject: 'Force Directed Graph Export',
                            message: 'Here is the exported Force Directed Graph PDF',
                        });

                        // Clean up after sharing
                        setTimeout(async () => {
                            try {
                                await RNFS.unlink(pdfPath);
                            } catch (cleanupError) {
                                console.warn('Error cleaning up PDF:', cleanupError);
                            }
                        }, 10000); // Clean up after 10 seconds

                    } catch (error) {
                        console.error('PDF Export Error:', error);
                        Alert.alert('Export Error', error.message || 'Failed to export PDF');
                    }
                }}
                style={[styles.centerFloatingButton2]}
            >
                <Image
                    source={require('../assets/downloads.png')}
                    style={styles.buttonImage4}
                />
            </TouchableOpacity>
            </View>
                </View>

            )}


            {/* Floating Buttons */}
          
            <TouchableOpacity onPress={handleFloatingButtonPress} style={styles.floatingButton2}>
                <Image source={resizeIcon} style={styles.buttonImage} />
            </TouchableOpacity>

            {/* Full Screen Modal */}
            <Modal
                visible={isFullScreen}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setIsFullScreen(false)}
            >
                <View style={styles.fullScreenContainer}>
                    <View style={styles.fullScreenGraphContainer}>
                        <ForceDirectedGraph2 transcription={transcription} uid={uid} audioid={audioid} xmlData={XMLData} />
                    </View>
                    <TouchableOpacity 
                        onPress={() => setIsFullScreen(false)} 
                        style={styles.closeFullScreenButton}
                    >
                        <Image
                            source={require('../assets/close.png')}
                            style={styles.closeIcon}
                        />
                    </TouchableOpacity>
                </View>
            </Modal>
          
      {/* Slider with Toggle Buttons */}
{isSliderVisible && (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.sliderContainer}>
            {/* Show Translation Section */}
            <View style={styles.sliderContent}>
                <Text style={styles.sliderText}>Show Translation</Text>
              
                {/* Language Dropdown */}
             <View style={styles.pickerContainer}>
             
                <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)} style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {languages.find(lang => lang.value === selectedLanguage)?.label || 'Select'}
                </Text>
            </TouchableOpacity>

            {/* Custom Dropdown Modal */}
            {showDropdown && (
               <Modal
               transparent={true}
               animationType="slide"  // Change animation to 'slide'
               visible={showDropdown}
               onRequestClose={() => setShowDropdown(false)}
             >
               <View style={styles.modalOverlay}>
                 <View style={styles.dropdownList}>
                   <FlatList
                     data={languages}
                     keyExtractor={(item) => item.value}
                     renderItem={({ item }) => (
                       <TouchableOpacity 
                         onPress={() => handleSelectLanguage(item.value)} 
                         style={styles.dropdownItem}
                       >
                         <Text style={styles.dropdownItemText}>{item.label}</Text>
                         {selectedLanguage === item.value && (
                           <Image 
                             source={require('../assets/Tick.png')} // Update this path to your tick.png location
                             style={styles.tickIcon} 
                           />
                         )}
                       </TouchableOpacity>
                     )}
                     ItemSeparatorComponent={() => <View style={styles.separator} />}
                   />
                 </View>
               </View>
             </Modal>
            )}
            </View>
              <Switch
                    value={isTranscriptionVisible}
                    onValueChange={() => {
                        setTranscriptionVisible(!isTranscriptionVisible);
                        if (!isTranscriptionVisible) {
                            paragraphs.forEach((_, index) => handleTranslateParagraph(index));
                        }
                    }}
                />
            </View>

            {/* Show Editing Section */}
            <View style={styles.sliderContent}>
                <Text style={styles.sliderText}>Show Editing</Text>
                <Switch
                    value={isEditingEnabled}
                    onValueChange={toggleTextEditing}
                />
            </View>

            {/* Show Date Section */}
            <View style={styles.sliderContent}>
                <Text style={styles.sliderText}>Show Time</Text>
                <Switch
                    value={isSpeechToTextEnabled}
                    onValueChange={toggleSpeechToText}
                />
            </View>
        </View>
    </TouchableWithoutFeedback>
)}

            {/* Display the Mind Map if it's toggled on */}
            {showMindMap && (
                <View style={styles.mindMapContainer}>
                    <Text style={styles.mindMapText}>Mind Map for Transcription</Text>
                    {/* Render your Mind Map component here */}
                    <Text style={styles.mindMapText}>[Mind Map View]</Text>
                </View>
    
                
            )}
        </View>
    );
};

const styles = StyleSheet.create({

    progressTrail: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'white', // This acts as the mask
        overflow: 'hidden', // Ensures the Lottie animation is clipped
    },
    waveAnimation: {
        width: '100%', // Ensure the Lottie animation covers the entire width
        height: '100%', // Ensure the Lottie animation covers the entire height
    },
    container69: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      },
     
    linePointer: {
        width: 2,
        height: 40,
        backgroundColor: 'orange', // Color of the line pointer
        borderRadius: 0, // No border radius for a straight line
    },
    waveAnimationContainer: {
        position: 'absolute',
        width: '100%', // Cover the entire waveform box
        height: '100%',
        borderRadius:50,
        overflow: 'hidden', // Clip the animation
    },
    waveAnimationContainer2: {
        position: 'absolute',
        width: '100%', // Cover the entire waveform box
        height: '100%',
        overflow: 'hidden', // Clip the animation
        marginBottom: -20,
       
    },
    waveAnimation: {
        width: '200%', // Full width
        height: '250%', // Full height
    },
    waveAnimation2: {
        width: '150%', // Full width
        height: '250%', // Full height
    
    },
    mask: {
        position: 'absolute',
        right: 0, // Start from the right
        top: 0,
        bottom: 0,
        backgroundColor: '#F2F3F7', // Acts as the mask
    },
    mask2: {
        position: 'absolute',
        right: 0, // Start from the right
        top: 0,
        bottom: 0,
        backgroundColor: 'white', // Acts as the mask
    },
    audioPlayerContainer: {
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioControlsContainer: {
        position: 'absolute',
        backgroundColor: '#F2F3F7',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Adjust width as needed
        borderRadius:10,
    },
    audioControlsContainer2: {
       flexDirection:'row',
       alignItems: 'center',
       justifyContent: 'center',
      
       position: 'absolute',
       backgroundColor: '#F2F3F7',
       borderRadius:50,
       paddingLeft:15,
       paddingRight:15,
       width: '100%', // Adjust width as needed

    },
    waveformBox: {
        backgroundColor: '#FFFFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:10,
        width: '80%', // Adjust width as needed
    },
    waveformBox2: {
        
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveformContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        width: '100%',
        position: 'relative',
        justifyContent: 'center',
        paddingVertical: 10,
        minHeight: 80,
    },
   
    waveform: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
    },
    waveformBar: {
        width: 4,
        backgroundColor: '#007bff',
        marginHorizontal: 1,
        borderRadius: 2,
        minHeight: 10,
    },
    timeContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    leftTime: {
        textAlign: 'left',
        flex: 1,
    },
    rightTime: {
        textAlign: 'right',
        flex: 1,
    },
    timeText: {
        fontSize: 14,
        color: '#666',
    },
    customThumb: {
        position: 'absolute',
        width: 5,
        height: 90,
        borderRadius:50,
        backgroundColor: 'orange',
        borderRadius: 0,
      
        zIndex:200,
      },
    container: {
        flex: 1,
        backgroundColor: '#fff',
         
    },
    container2: {
        backgroundColor: '#2CF105FF',
        paddingVertical: 10,
      },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    overlayButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
       
      
    },
    
    blueButton: {
        backgroundColor: '#007BFF',
       width:150,
        borderRadius: 20,
        
       
        marginLeft: 120,
       
        padding: 8, // Adjust padding for better touch area
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5, // Adds shadow for Android
        shadowColor: '#000', // Adds shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    detailIcon2: {
        width: 14,
        height: 14,
        resizeMode: 'contain',
    },
    convert:{
        marginRight:5,
        fontSize:12,
        color:'#fff',
            },
            convert2:{
                marginRight:5,
                fontSize:16,
                color:'#fff',
                    },
    selectedButton: {
        backgroundColor: '#007bff', // Change to the selected button color
    },
    translatedText: {
        color: '#007bff',
        fontSize: 16,
        marginTop: 4,
    },
    word: {
        color: '#000',
    },
    paragraphRow:{
flexDirection:'row',
    },
    playButton2:{
        marginRight:10,
    
        backgroundColor: '#007BFFFF',
        padding:10,
        borderRadius:50,
    },
    highlightedWord: {
        backgroundColor: '#007bff20',
        color: '#007bff',
        borderRadius: 4,
        paddingHorizontal: 2,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      dropdownList: {
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
      },
      dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 5,
      },
     
    
      timeContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 10,
        paddingHorizontal: 10,
      },
      leftTime: {
        textAlign: 'left',
        flex: 1,
      },
      rightTime: {
        textAlign: 'right',
        flex: 1,
      },
      timeText: {
        fontSize: 14,
        color: '#666',
      },
      loadingContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      
      },
      loadingText: {
        color: '#666',
        fontSize: 16,
      },
      controls: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: -10,
        marginBottom:10,
      },
      icon: {
        width: 30,
        height: 30,
        tintColor: '#007bff',
      },
      icon2: {
        width: 30,
        height: 30,
        tintColor: '#ffffff',
      },
      progressContainer: {
        marginHorizontal: 10,
      },
      transcriptContainer: {
        marginTop: 20,
        paddingHorizontal: 10,
      },
      transcriptText: {
        fontSize: 16,
        marginVertical: 2,
      },
   
    
      navIcon: {
        width: 24,
        height: 24,
        tintColor: '#007bff',
        marginHorizontal: 40,
      },
      navIcon2: {
        width: 24,
        height: 24,
        tintColor: '#007bff',
        marginHorizontal: -10,
      },
      playIcon: {
        width: 32,
        height: 32,
        tintColor: '#007bff',
      },
      playIcon2: {
        width: 32,
        height: 32,
        tintColor: '#ffffff',
      },
      separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 5,
      },
      tickIcon: {
   
     alignSelf:'flex-end',
        width:20,
        height:20,
        tintColor:'#0076EDFF'
      },
    button: {
        flex: 1,
        borderColor: '#007BFF',
        borderWidth: 1,
        padding: 5,
        margin: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    button2: {
        marginTop: 20,
        alignSelf: 'center',
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
      },
    buttonText: {
        color: '#007BFF',
        fontWeight: '600',
    },
    buttonText2: {
        color: '#fff',
        fontWeight: '600',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    dropdownButton: {
        padding: 5,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    dropdownButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dropdownList: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 10,
   
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    dropdownItemText: {
        fontSize: 16,
    },
    paragraphContainer: {
        marginBottom: 16,
    },
    paragraphWrapper: {
        padding: 8,
        borderRadius: 4,
    },
    highlightedParagraph: {
        backgroundColor: '#007bff20',
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
        paddingLeft: 12,
    },
    
    mindMapContainer: {
        padding: 20,
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        marginTop: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    mindMapText: {
        fontSize: 18,
        color: '#333',
    },
    header: {
        fontSize: 13,
        fontWeight: '600',
    },
    iconButton: {
        padding: 8,
    },
    icon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    languageInput: {
        fontSize: 16,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#007bff',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
 
 
    buttonText2: {
        color: '#fff',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    transcriptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
    },
    content2: {
        fontSize: 12,
        lineHeight: 24,
        color: '#8A8A8AAE',
        flex: 1,
    },
    languageDropdownContainer: {
        position: 'absolute', // Position it absolutely at the top
        top: 20, // Adjust this as necessary to position it where you want
        left: 10,
        right: 10,
        zIndex: 10, // Ensure it appears above other elements
    },
    pickerContainer: {
        width: '30%',
      marginRight:30,
    },
    picker: {
        backgroundColor: '#fff',
        borderColor: '#007BFF',
        borderWidth: 1,
        borderRadius: 5,
    },
    dropDownStyle: {
        backgroundColor: '#fafafa',
        maxHeight: 200, // Limit the height of the dropdown
    },
    textInput: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#007bff',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 90,
        right: 90,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    floatingButton2: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    buttonImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    buttonImage2: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    buttonImage3: {
        width: 30,
        height: 30,
      
        resizeMode: 'contain',
        tintColor:'#ffffff',
    },
    buttonImage4: {
        width: 30,
        height: 30,
      
        resizeMode: 'cover',
        tintColor:'#ffffff',
    },
    sliderContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 105,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: -3 },
    },
    sliderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    sliderText: {
        fontSize: 16,
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalText: {
        fontSize: 18,
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: '#FF6600',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    centerFloatingButton: {
        position: 'absolute',
        bottom: 160,
        left: '15%',
        marginLeft: -30, // Half of button width to center
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
       
    },
   
    centerFloatingButton2: {
        position: 'absolute',
        bottom: 160,
        marginLeft: 25,
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
       
    },
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: '#fff',
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenGraphContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
       marginTop:200,
       marginRight:50,
        padding: 10,
        overflow: 'hidden',
    },
    closeFullScreenButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF6600',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
    },
    closeIcon: {
        width: 20,
        height: 20,
        tintColor: '#fff',
    },
});

export default TranslateScreen;