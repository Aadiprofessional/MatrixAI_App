import React, { useEffect, useState, useRef, forwardRef } from 'react';
const formatTime = (seconds) => {
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
    
  
    const downloadAndCombineAudio = async (chunkUrls) => {
        if (!chunkUrls || !Array.isArray(chunkUrls) || chunkUrls.length === 0) {
            console.error('Invalid chunk URLs');
            return null;
        }

        try {
            if (isMounted.current) {
                setIsAudioLoading(true);
            }
            
            // Create a unique filename for this audio
            const audioId = audioid || Date.now().toString();
            const localFilePath = `${RNFS.DocumentDirectoryPath}/audio_${audioId}.mp3`;
            
            // Check if we already have this file cached
            const fileExists = await RNFS.exists(localFilePath);
            if (fileExists) {
                console.log('Using cached audio file:', localFilePath);
                return {
                    type: 'file',
                    url: `file://${localFilePath}`
                };
            }
            
            console.log('Downloading audio chunks to:', localFilePath);
            
            // Download all chunks first to temporary files
            const tempFiles = [];
            for (let i = 0; i < chunkUrls.length; i++) {
                const chunkUrl = chunkUrls[i];
                const tempPath = `${RNFS.CachesDirectoryPath}/temp_chunk_${audioId}_${i}.mp3`;
                
                console.log(`Downloading chunk ${i+1}/${chunkUrls.length}: ${chunkUrl}`);
                
                try {
                    const downloadResult = await RNFS.downloadFile({
                        fromUrl: chunkUrl,
                        toFile: tempPath,
                        background: true,
                        discretionary: true,
                        cacheable: true,
                        progressInterval: 1000,
                        progress: (res) => {
                            const progress = res.bytesWritten / res.contentLength;
                            console.log(`Download progress for chunk ${i+1}: ${Math.round(progress * 100)}%`);
                        }
                    }).promise;
                    
                    if (downloadResult.statusCode === 200) {
                        tempFiles.push(tempPath);
                        console.log(`Successfully downloaded chunk ${i+1}`);
                    } else {
                        console.error(`Failed to download chunk ${i+1}, status: ${downloadResult.statusCode}`);
                    }
                } catch (downloadError) {
                    console.error(`Error downloading chunk ${i+1}:`, downloadError);
                    // Continue with other chunks even if one fails
                }
            }
            
            if (tempFiles.length === 0) {
                console.error('Failed to download any audio chunks');
                return {
                    type: 'direct',
                    url: chunkUrls[0] // Fallback to direct URL of first chunk
                };
            }
            
            // Combine all downloaded chunks
            console.log('Combining audio chunks...');
            try {
                // Create the output file with the first chunk
                await RNFS.copyFile(tempFiles[0], localFilePath);
                
                // Append the rest of the chunks
                for (let i = 1; i < tempFiles.length; i++) {
                    const chunkData = await RNFS.readFile(tempFiles[i], 'base64');
                    await RNFS.appendFile(localFilePath, chunkData, 'base64');
                    console.log(`Appended chunk ${i+1}`);
                }
                
                // Clean up temp files
                for (const tempFile of tempFiles) {
                    await RNFS.unlink(tempFile).catch(e => console.log('Cleanup error:', e));
                }
                
                console.log('Successfully combined all chunks to:', localFilePath);
                
                // Save the file path to AsyncStorage for future use
                try {
                    const audioData = await AsyncStorage.getItem(`audioData-${audioid}`);
                    if (audioData) {
                        const parsedData = JSON.parse(audioData);
                        parsedData.localAudioPath = `file://${localFilePath}`;
                        await AsyncStorage.setItem(`audioData-${audioid}`, JSON.stringify(parsedData));
                    }
                } catch (storageError) {
                    console.error('Error updating AsyncStorage:', storageError);
                }
                
                return {
                    type: 'file',
                    url: `file://${localFilePath}`
                };
            } catch (combineError) {
                console.error('Error combining audio chunks:', combineError);
                
                // If combining fails, try to use the first chunk directly
                if (tempFiles.length > 0) {
                    return {
                        type: 'file',
                        url: `file://${tempFiles[0]}`
                    };
                } else {
            return {
                type: 'direct',
                url: chunkUrls[0]
            };
                }
            }
        } catch (error) {
            console.error('Error in downloadAndCombineAudio:', error);
            return {
                type: 'direct',
                url: chunkUrls[0] // Fallback to direct URL
            };
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
        if (!text) return { paragraphs: [], words: [] };
        
        // Handle Chinese text specifically
        const isChinese = /[\u4e00-\u9fff]/.test(text);
        let words = isChinese ? Array.from(text) : text.split(/\s+/);
        
        if (isChinese) {
            // For Chinese text, split into smaller paragraphs
            const charsPerParagraph = 100; // Reduced from 200 to 100 for better readability
            const paragraphs = [];
            
            // First try to split by common Chinese punctuation
            const segments = text.split(/[。！？；,，]/g);
            let currentParagraph = '';
            
            for (const segment of segments) {
                if (!segment.trim()) continue;
                
                // If adding this segment would make the paragraph too long, start a new one
                if ((currentParagraph + segment).length > charsPerParagraph && currentParagraph) {
                    paragraphs.push(currentParagraph.trim());
                    currentParagraph = segment;
                } else {
                    currentParagraph += (currentParagraph ? '，' : '') + segment;
                }
            }
            
            // Add the last paragraph if it's not empty
            if (currentParagraph.trim()) {
                paragraphs.push(currentParagraph.trim() + '。');
            }
            
            // If no paragraphs were created (no punctuation found), split by character count
            if (paragraphs.length === 0) {
                for (let i = 0; i < text.length; i += charsPerParagraph) {
                    const chunk = text.slice(i, Math.min(i + charsPerParagraph, text.length));
                    if (chunk.trim()) {
                        paragraphs.push(chunk.trim());
                    }
                }
            }
            
            return { paragraphs, words };
        } else {
            // For non-Chinese text, use the original sentence-based splitting
            const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
            const paragraphs = [];
            const sentencesPerParagraph = 9;
            
            for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
                const paragraphSentences = sentences.slice(i, i + sentencesPerParagraph);
                const paragraph = paragraphSentences.join('. ') + '.';
                if (paragraph.trim()) {
                    paragraphs.push(paragraph.trim());
                }
            }
            
            return { paragraphs, words };
        }
        
        return { paragraphs, words };
    };

    const calculateParagraphTimings = (words, duration) => {
        if (!words.length || !duration) return [];
        
        // Calculate time per paragraph based on total duration and number of paragraphs
        const wordsPerParagraph = Math.ceil(words.length / Math.ceil(words.length / (9 * 10))); // ~10 words per line, 9 lines
        const paragraphCount = Math.ceil(words.length / wordsPerParagraph);
        const timePerParagraph = duration / paragraphCount;
        
        return Array(paragraphCount).fill(0).map((_, index) => ({
            start: index * timePerParagraph,
            end: (index + 1) * timePerParagraph,
            words: words.slice(index * wordsPerParagraph, (index + 1) * wordsPerParagraph)
        }));
    };

    useEffect(() => {
        // Generate random heights for the waveform bars
        const heights = Array(100).fill(0).map(() => Math.floor(Math.random() * (60 - 10 + 1)) + 10);
        setWaveformHeights(heights);
    }, []);


    const onAudioProgress = (progress) => {
        if (!progress || !progress.currentTime || !progress.duration || !paragraphs.length || !wordTimings.length) return;
        
        const currentTime = Number(progress.currentTime.toFixed(2));
        
        // Find the current paragraph based on timing
        const currentParaIndex = wordTimings.findIndex(timing => 
            currentTime >= timing.start && currentTime < timing.end
        );
        
        if (currentParaIndex !== -1 && currentParaIndex !== currentWordIndex.paraIndex) {
            setCurrentWordIndex({
                paraIndex: currentParaIndex
            });
            
            // Auto-scroll to the current paragraph
            if (scrollViewRef.current) {
                const yOffset = currentParaIndex * 200; // Approximate height per paragraph
                scrollViewRef.current.scrollTo({
                    y: yOffset,
                    animated: true
                });
            }
        }
    };


    // Audio player functions
    const loadAudio = () => {
        if (sound) {
            sound.release();
        }

        // Enable streaming for better performance
        Sound.setCategory('Playback');
        
        const loadWithRetry = (attempt = 0) => {
            const maxAttempts = 3;
            
            console.log(`Attempting to load audio (attempt ${attempt + 1}): ${audioUrl}`);
            
            // Create new sound instance with error handling
            const newSound = new Sound(audioUrl, '', (error) => {
                if (error) {
                    console.warn(`Failed to load sound (attempt ${attempt + 1}):`, error);
                    
                    if (attempt < maxAttempts - 1) {
                        // Retry with exponential backoff
                        setTimeout(() => {
                            loadWithRetry(attempt + 1);
                        }, Math.pow(2, attempt) * 1000);
                    } else {
                        console.error('All audio loading attempts failed');
                        Alert.alert(
                            'Audio Error',
                            'Failed to load audio. Please try again later.',
                            [{ text: 'OK' }]
                        );
                    }
                    return;
                }
                
                console.log('Audio loaded successfully');
                
                // Configure sound instance
                newSound.setVolume(1.0);
                newSound.setNumberOfLoops(0);
                
                // Get duration after a small delay to ensure it's loaded
                setTimeout(() => {
                    const duration = newSound.getDuration();
                    if (duration && duration > 0) {
                        setAudioDuration(duration);
                        setSound(newSound);
                        console.log(`Audio duration: ${duration} seconds`);
                    } else {
                        console.warn('Invalid duration, checking current time');
                        // If duration is invalid, try an alternative approach
                        newSound.getCurrentTime((seconds) => {
                            if (seconds >= 0) {
                                // If we can get current time, the audio is probably valid
                                setAudioDuration(seconds > 0 ? seconds : 0);
                                setSound(newSound);
                            } else {
                        newSound.release();
                                Alert.alert(
                                    'Audio Error',
                                    'Could not determine audio duration.',
                                    [{ text: 'OK' }]
                                );
                            }
                        });
                    }
                }, 300);
            });
        };
        
        loadWithRetry();
    };

    const toggleAudioPlayback = () => {
        if (!sound) return;
        
        if (isAudioPlaying) {
            sound.pause();
            setIsAudioPlaying(false);
        } else {
            // If at the end, start from beginning
            if (audioPosition >= audioDuration) {
                sound.setCurrentTime(0);
                setAudioPosition(0);
                setCurrentWordIndex({ paraIndex: 0 });
            }
            
            sound.play((success) => {
                if (success) {
                    if (isRepeatMode) {
                        // In repeat mode, start from beginning
                        sound.setCurrentTime(0);
                        setAudioPosition(0);
                        setCurrentWordIndex({ paraIndex: 0 });
                        sound.play();
                    } else {
                        setIsAudioPlaying(false);
                        setAudioPosition(audioDuration);
                    }
                } else {
                    console.error('Playback failed');
                    setIsAudioPlaying(false);
                }
            });
            
            setIsAudioPlaying(true);
        }
    };

    const seekAudio = (seconds) => {
        if (!sound) return;
        
        const newPosition = Math.max(0, Math.min(audioPosition + seconds, audioDuration));
        sound.setCurrentTime(newPosition);
        setAudioPosition(newPosition);
        
        // Trigger audio progress update when seeking
        onAudioProgress({
            currentTime: newPosition,
            duration: audioDuration
        });
    };

   
    
 
    useEffect(() => {
        // Basic Sound.js configuration
        Sound.setCategory('Playback');
        
        if (audioUrl) {
            console.log('Initializing audio with URL:', audioUrl);
            
            // Release previous sound if it exists
            if (sound) {
                sound.release();
                setSound(null);
            }
            
            // Determine if this is a local file
            const isLocalFile = audioUrl.startsWith('file://');
            
            // Function to load audio with retry logic
            const loadAudioWithRetry = (attempt = 0) => {
                const maxAttempts = 3;
                
                console.log(`Loading audio attempt ${attempt + 1}/${maxAttempts}`);
                
                // For local files, use empty string as the base path
                // For remote URLs, use null to indicate it's a remote URL
                const basePath = isLocalFile ? '' : null;
                
                try {
                    const newSound = new Sound(audioUrl, basePath, (error) => {
                if (error) {
                            console.error(`Audio loading error (attempt ${attempt + 1}):`, error);
                            
                            if (attempt < maxAttempts - 1) {
                                // Wait a bit longer between retries
                                setTimeout(() => {
                                    loadAudioWithRetry(attempt + 1);
                                }, (attempt + 1) * 1000);
                            } else {
                                // All attempts failed, try one last approach for remote URLs
                                if (!isLocalFile) {
                                    console.log('Trying alternative loading method...');
                                    
                                    // Try downloading the file locally first
                                    const tempFilePath = `${RNFS.CachesDirectoryPath}/temp_audio_${Date.now()}.mp3`;
                                    
                                    RNFS.downloadFile({
                                        fromUrl: audioUrl,
                                        toFile: tempFilePath,
                                        background: true
                                    }).promise.then(result => {
                                        if (result.statusCode === 200) {
                                            console.log('Downloaded audio to temp file:', tempFilePath);
                                            
                                            // Now try to load from the local file
                                            const localSound = new Sound(`file://${tempFilePath}`, '', (localError) => {
                                                if (localError) {
                                                    console.error('Failed to load downloaded audio:', localError);
                    Alert.alert(
                        'Audio Error',
                                                        'Could not load audio after multiple attempts.',
                        [{ text: 'OK' }]
                    );
                                                } else {
                                                    console.log('Successfully loaded audio from downloaded file');
                                                    localSound.setVolume(1.0);
                                                    
                                                    // Use the duration from the API if available
                                                    if (duration && duration > 0) {
                                                        setAudioDuration(duration);
                                                    } else {
                                                        const soundDuration = localSound.getDuration();
                                                        setAudioDuration(soundDuration > 0 ? soundDuration : 30);
                                                    }
                                                    setSound(localSound);
                                                }
                                            });
                                        } else {
                                            console.error('Failed to download audio file:', result);
                                            Alert.alert(
                                                'Audio Error',
                                                'Could not download audio file.',
                                                [{ text: 'OK' }]
                                            );
                                        }
                                    }).catch(downloadError => {
                                        console.error('Error downloading audio:', downloadError);
                                        Alert.alert(
                                            'Audio Error',
                                            'Failed to download audio file.',
                                            [{ text: 'OK' }]
                                        );
                                    });
                                } else {
                                    Alert.alert(
                                        'Audio Error',
                                        'Could not load audio after multiple attempts.',
                                        [{ text: 'OK' }]
                                    );
                                }
                            }
                    return;
                }
                
                        // Audio loaded successfully
                        console.log('Audio loaded successfully');
                newSound.setVolume(1.0);
                
                        // Get duration with a delay to ensure it's properly loaded
                        setTimeout(() => {
                const duration = newSound.getDuration();
                            console.log('Audio duration:', duration);
                            
                            if (duration && duration > 0) {
                    setAudioDuration(duration);
                    setSound(newSound);
                            } else {
                                // Try to get current time as fallback
                                newSound.getCurrentTime((seconds) => {
                                    console.log('Current time fallback:', seconds);
                                    setAudioDuration(seconds > 0 ? seconds : 30);
                                    setSound(newSound);
                                });
                            }
                        }, 500);
                    });
                } catch (e) {
                    console.error('Exception during audio loading:', e);
                    
                    if (attempt < maxAttempts - 1) {
                        setTimeout(() => {
                            loadAudioWithRetry(attempt + 1);
                        }, (attempt + 1) * 1000);
                    } else {
                        Alert.alert(
                            'Audio Error',
                            'An unexpected error occurred while loading audio.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            };
            
            // Start loading the audio
            loadAudioWithRetry();
        }
        
        return () => {
            if (sound) {
                sound.release();
            }
        };
    }, [audioUrl, duration]);

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
        // Trigger audio progress update when slider value changes
        onAudioProgress({
            currentTime: value,
            duration: audioDuration
        });
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

    const fetchAudioMetadata = async (uid, audioid) => {
        try {
            setIsLoading(true);
            
            // Show audio player container with loading state
            setAudioDuration(100); // Temporary duration to show the player
            setAudioPosition(0);
            
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
                setDuration(data.duration || 0);

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
                
                if (data.chunk_urls && Array.isArray(data.chunk_urls) && data.chunk_urls.length > 0) {
                    console.log(`Processing ${data.chunk_urls.length} audio chunks`);
                    
                    // Use our improved function to handle the chunks
                    const processedAudio = await processAudioChunks(data.chunk_urls);
                    if (processedAudio) {
                        audioUrl = processedAudio;
                        console.log('Setting processed audio URL:', audioUrl);
                    }
                }
                
                setAudioUrl(audioUrl);

                // Set key points and XML data
                setKeypoints(data.key_points || '');
                setXMLData(data.xml_data || '');
            } else {
                console.error('Error fetching audio metadata:', data.error);
                Alert.alert('Error', 'Failed to load audio data');
            }
        } catch (error) {
            console.error('Error in fetchAudioMetadata:', error);
            Alert.alert('Error', 'An unexpected error occurred while loading audio data');
        } finally {
            setIsLoading(false);
        }
    };

    // Fix the processAudioChunks function to handle errors better and ensure proper file paths
    const processAudioChunks = async (chunkUrls) => {
        if (!chunkUrls || !Array.isArray(chunkUrls) || chunkUrls.length === 0) {
            console.error('Invalid chunk URLs');
            return null;
        }

        try {
            setIsAudioLoading(true);
            
            // For single chunk, return it directly
            if (chunkUrls.length === 1) {
                console.log('Single chunk detected, using direct URL');
                return chunkUrls[0];
            }
            
            // For multiple chunks, download and combine them
            console.log(`Processing ${chunkUrls.length} chunks`);
            
            // Create a unique timestamp for this operation to avoid conflicts
            const timestamp = Date.now();
            const tempFilePath = `${RNFS.CachesDirectoryPath}/combined_audio_${timestamp}.mp3`;
            
            // Download and combine chunks
            let combinedSuccessfully = false;
            
            // First, try to download the first chunk
            try {
                const firstChunkResult = await RNFS.downloadFile({
                    fromUrl: chunkUrls[0],
                    toFile: tempFilePath,
                    background: true
                }).promise;
                
                if (firstChunkResult.statusCode === 200) {
                    console.log('First chunk downloaded successfully');
                    combinedSuccessfully = true;
                    
                    // Now download and append the rest of the chunks
                    for (let i = 1; i < chunkUrls.length; i++) {
                        try {
                            // Use unique path for each chunk to avoid conflicts
                            const chunkTempPath = `${RNFS.CachesDirectoryPath}/temp_chunk_${timestamp}_${i}.mp3`;
                            
                            console.log(`Downloading chunk ${i+1} to ${chunkTempPath}`);
                            
                            const chunkResult = await RNFS.downloadFile({
                                fromUrl: chunkUrls[i],
                                toFile: chunkTempPath,
                                background: true
                            }).promise;
                            
                            if (chunkResult.statusCode === 200) {
                                // Verify file exists before trying to read it
                                const fileExists = await RNFS.exists(chunkTempPath);
                                if (!fileExists) {
                                    console.error(`Chunk file ${i+1} doesn't exist after download`);
                                    continue;
                                }
                                
                                // Get file size to verify it's not empty
                                const fileInfo = await RNFS.stat(chunkTempPath);
                                if (fileInfo.size === 0) {
                                    console.error(`Chunk file ${i+1} is empty`);
                                    continue;
                                }
                                
                                console.log(`Chunk ${i+1} downloaded (${fileInfo.size} bytes), appending...`);
                                
                                // Read the chunk data and append it to the combined file
                                const chunkData = await RNFS.readFile(chunkTempPath, 'base64');
                                await RNFS.appendFile(tempFilePath, chunkData, 'base64');
                                console.log(`Appended chunk ${i+1}`);
                                
                                // Clean up the temporary chunk file
                                await RNFS.unlink(chunkTempPath).catch((e) => {
                                    console.log(`Error deleting temp file: ${e}`);
                                });
                            } else {
                                console.error(`Failed to download chunk ${i+1}, status: ${chunkResult.statusCode}`);
                            }
                        } catch (chunkError) {
                            console.error(`Error processing chunk ${i+1}:`, chunkError);
                        }
                    }
                    
                    // Verify the combined file
                    const combinedFileExists = await RNFS.exists(tempFilePath);
                    const combinedFileInfo = await RNFS.stat(tempFilePath);
                    console.log(`Combined file size: ${combinedFileInfo.size} bytes`);
                    
                    if (combinedFileExists && combinedFileInfo.size > 0) {
                        console.log('Audio chunks combined successfully');
                        return `file://${tempFilePath}`;
                    } else {
                        console.error('Combined file is invalid or empty');
                        combinedSuccessfully = false;
                    }
                } else {
                    console.error(`Failed to download first chunk, status: ${firstChunkResult.statusCode}`);
                    combinedSuccessfully = false;
                }
            } catch (downloadError) {
                console.error('Error downloading first chunk:', downloadError);
                combinedSuccessfully = false;
            }
            
            if (combinedSuccessfully) {
                return `file://${tempFilePath}`;
            } else {
                console.log('Falling back to first chunk URL');
                return chunkUrls[0];
            }
        } catch (error) {
            console.error('Error in processAudioChunks:', error);
            return chunkUrls[0]; // Fallback to first chunk
        } finally {
            setIsAudioLoading(false);
        }
    };

    // Update the useEffect for component lifecycle
    useEffect(() => {
        // Set isMounted to true when component mounts
        isMounted.current = true;
        
        // Fetch data on mount
        fetchAudioMetadata(uid, audioid);
        
        // Clean up function
        return () => {
            isMounted.current = false;
            
            // Release sound resources
            if (sound) {
                sound.release();
            }
            
            // Clean up any temporary files
            const cleanupTempFiles = async () => {
                try {
                    const files = await RNFS.readDir(RNFS.CachesDirectoryPath);
                    for (const file of files) {
                        if (file.name.startsWith('temp_chunk_') || file.name.startsWith('combined_audio_')) {
                            await RNFS.unlink(file.path).catch(() => {});
                        }
                    }
                } catch (error) {
                    console.log('Error cleaning up temp files:', error);
                }
            };
            
            cleanupTempFiles();
        };
    }, [uid, audioid]);

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
    paragraphText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
        marginBottom: 8,
    },
    editableText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        flex: 1,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 4,
    },
    timestamp: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
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
    pencilIcon: {
        width: 20,
        height: 20,
        tintColor: '#007bff',
        marginLeft: 8,
    },
    editIcon: {
        padding: 4,
    },
});

export default TranslateScreen;
