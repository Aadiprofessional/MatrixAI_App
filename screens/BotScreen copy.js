import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,

  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { GestureHandlerRootView, Swipeable, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import ForceDirectedGraph2 from '../components/mindMap2';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';

// Add a module-scope variable to persist summary call status across mounts
const summaryCalledForAudioId = {};

const BotScreen2 = ({ navigation, route }) => {
  const flatListRef = React.useRef(null);
  const { transcription, XMLData, uid, audioid } = route.params || {};
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data is loaded
  const [showSummaryPrompt, setShowSummaryPrompt] = useState(true); // New state for summary prompt
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSummaryPrompt = async (choice) => {
    setShowSummaryPrompt(false); // Hide the prompt immediately

    if (choice === 'yes') {
      await fetchDeepSeekResponse(`Please summarize this text in a structured format: ${transcription}`);
    }
    try {
      await axios.post('https://matrix-server.vercel.app/saveSummaryPreference', {
        uid,
        audioid,
        preference: choice,
      });
    } catch (error) {
      console.error('Error saving summary preference:', error);
    }
  };

  useEffect(() => {
    const checkSummaryPreference = async () => {
      if (!isMounted.current || !dataLoaded) return;

      if (!audioid || summaryCalledForAudioId[audioid]) {
        return;
      }

      try {
        const response = await axios.post('https://matrix-server.vercel.app/getSummaryPreference', {
          uid,
          audioid,
        });
        const preference = response.data.preference;

        // Check if chat history is empty
        const chatHistoryIsEmpty = messages.length === 1 && 
          (messages[0]?.text === "Hello.👋 I'm your new friend, MatrixAI Bot. You can ask me any questions.");

        // If a preference exists ('yes' or 'no') or chat history has data, do not show the prompt
        if (preference || messages.length > 1) {
          setShowSummaryPrompt(false);

          if (preference === 'yes' && transcription) {
            await fetchDeepSeekResponse(`Please summarize this text in a structured format in the same language as the input transcription language: ${transcription} remember to use the same language as the input transcription`);
          }
        } else {
          // Show the prompt only if no preference exists and chat history is empty
          setShowSummaryPrompt(true);
        }
      } catch (error) {
        console.error('Error fetching summary preference:', error);
      }
    };

    if (transcription && audioid) {
      checkSummaryPreference();
    }
  }, [transcription, dataLoaded, audioid]);

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello.👋 I'm your new friend, MatrixAI Bot. You can ask me any questions.",
      sender: 'bot',
    },
    // Add summary request message conditionally
    ...(transcription ? [{
      id: `summary-request-${audioid}`,
      text: "Help me generate a summary of the given transcription",
      sender: 'user',
      fullText: transcription,
    }] : []),
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [fullTranscription, setFullTranscription] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showAdditionalButtons, setShowAdditionalButtons] = useState(false); // New state for additional buttons
  const swipeableRefs = useRef({});

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleAttach = () => {
    setShowAdditionalButtons(prev => !prev); // Toggle additional buttons visibility
    // Change the icon from plus to cross
  };

  // Format message history for API
  const messageHistory = messages.map(msg => ({
    role: msg.sender === 'bot' ? 'assistant' : 'user',
    content: msg.text
  }));

  const handleCamera = (navigation) => {
    navigation.navigate('CameraScreen');
  };

  const saveChatHistory = async (messageText, sender) => {
    try {
      const response = await axios.post('https://matrix-server.vercel.app/sendChat', {
        uid,
        chatid: audioid, // Using audioid as chatid
        updatedMessage: messageText,
        sender,
      });
      console.log('Message saved:', response.data);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
      };
      setMessages((prev) => [...prev, newMessage]);
      saveChatHistory(inputText, 'user'); // Save user message
      fetchDeepSeekResponse(inputText);
      setInputText('');
      setIsTyping(false);
    }
  };

  const fetchDeepSeekResponse = async (userMessage, retryCount = 0) => {
    const maxRetries = 5;
    const retryDelay = Math.min(Math.pow(2, retryCount) * 1000, 60000);

    setIsLoading(true);
    try {
      const response = await axios.post(
        'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        {
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...messageHistory,
            { role: 'user', content: userMessage },
          ],
          model: 'doubao-pro-32k-241215',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89'
          }
        }
      );

      let botMessage = response.data.choices[0].message.content.trim();
      botMessage = botMessage.replace(/(\*\*|\#\#)/g, "");

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: botMessage, sender: 'bot' },
      ]);
      saveChatHistory(botMessage, 'bot'); // Save bot response
    } catch (error) {
      console.error('Error fetching response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = () => {
    launchImageLibrary({ noData: true }, (response) => {
      if (response.assets) {
        const newMessage = {
          id: Date.now().toString(),
          image: response.assets[0].uri,
          sender: 'user',
        };
        setMessages((prev) => [...prev, newMessage]);
        saveChatHistory(newMessage.image, 'user'); // Save image message
      }
    });
  };

  const handleImageOCR = async (source = 'gallery') => {
    launchImageLibrary({ noData: true }, async (response) => {
      if (response.assets) {
        const { uri } = response.assets[0];
        const formData = new FormData();
        formData.append('uid', uid);
        formData.append('image', {
          uri,
          type: 'image/png',
          name: 'image.png',
        });

        try {
          setIsLoading(true);
          const apiResponse = await axios.post(
            'https://matrix-server.vercel.app/understandImage',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          const { ocrText, imageUrl } = apiResponse.data;
          const cleanedText = ocrText.replace(/(\*\*|\#\#)/g, "");

          setMessages((prev) => [
            ...prev,
            { 
              id: Date.now().toString(), 
              image: imageUrl,
              sender: 'user' 
            },
          ]);
          setIsLoading(true);
          fetchDeepSeekResponse(`Please understand this ocrtext of the image and give response in human readable format and also give the summary of the image and if thier is any numerical data solve it: ${cleanedText}`);
          saveChatHistory(imageUrl, 'user');
        } catch (error) {
          console.error('Error attaching image:', error);
          Alert.alert('Error', 'Failed to send image for processing');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.post('https://matrix-server.vercel.app/getChat', {
          uid,
          chatid: audioid, // Using audioid as chatid
        });

        const fetchedMessages = response.data.messages || [];
        const hasChatHistory = fetchedMessages.length > 0;

        setMessages((prev) => [
          ...prev,
          ...fetchedMessages.map(msg => ({
            ...msg,
            image: msg.imageUrl || msg.image,
            text: msg.text.replace(/(\*\*|\#\#)/g, ""),
          }))
        ]);

        setDataLoaded(true);
        setShowSummaryPrompt(!hasChatHistory); // Set prompt visibility based on chat history
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setDataLoaded(true);
        setShowSummaryPrompt(true); // Show prompt if there's an error fetching chat history
      }
    };

    fetchChatHistory();
  }, [audioid]);
  
  const handleGeneratePPT = (message) => {
    navigation.navigate('CreatePPTScreen', {
      message: message.text,
      audioid,
      number: 1,
    });
  };

  const handleGenerateMindmap = (message) => {
    setSelectedMessage(message);
    setIsFullScreen(true);
  };

  const renderMessage = ({ item }) => {
    const isBot = item.sender === 'bot';
    const isUser = item.sender === 'user';
    const isExpanded = expandedMessages[item.id];

    // Function to detect if the text contains a URL
    const containsUrl = (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text && urlRegex.test(text);
    };

    // Function to process and format the message text
    const formatMessageText = (text) => {
      if (!text) return [];
      
      const lines = text.split('\n');
      return lines.map(line => {
        // Check for heading (starts with number and dot, or has : at the end)
        const isHeading = /^\d+\.\s+.+/.test(line) || /.*:$/.test(line);
        // Check for subheading (starts with - or • or *)
        const isSubheading = /^[-•*]\s+.+/.test(line);
        
        return {
          text: line,
          isHeading,
          isSubheading
        };
      });
    };

    const renderLeftActions = () => {
      return (
        <View style={styles.swipeableButtons}>
          <TouchableOpacity
            style={styles.swipeButton}
            onPress={() => handleGenerateMindmap(item)}
          >
            <Ionicons name="git-network-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.swipeButton}
            onPress={() => handleGeneratePPT(item)}
          >
            <AntDesign name="pptfile1" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <GestureHandlerRootView>
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current[item.id] = ref;
            }
          }}
          renderLeftActions={isBot ? renderLeftActions : null}

          leftThreshold={40}
          rightThreshold={40}
          overshootLeft={false}
          overshootRight={false}
          enabled={isBot}
        >
          <View style={{ flexDirection: isBot ? 'row' : 'row-reverse', alignItems: 'center' }}>
            <Animatable.View
              animation={isBot ? "fadeInUp" : undefined}
              duration={100}
              style={[
                styles.messageContainer,
                isBot ? styles.botMessageContainer : styles.userMessageContainer,
              ]}
            >
              {/* Show image if the user sends an image */}
              {isUser && item.image && (
                <Image source={{ uri: item.image }} style={styles.messageImage} />
              )}

              {/* Show text if the user sends a text message */}
              {isUser && item.text && !containsUrl(item.text) && (
                <Text style={styles.userText}>{item.text}</Text>
              )}

              {/* Bot's message can have both text and images */}
              {isBot && item.image && (
                <Image source={{ uri: item.image }} style={styles.messageImage} />
              )}
              {isBot && item.text && (
                <Text style={styles.botText}>{item.text}</Text>
              )}
            </Animatable.View>
            <TouchableOpacity
              onPress={() => {
                if (isBot && swipeableRefs.current[item.id]) {
                  swipeableRefs.current[item.id].openLeft();
                }
              }}
            >
              <Ionicons
                name={isBot ? 'arrow-redo-sharp' : ''}
                size={24}
                color="#4588F5FF"
                style={{ marginHorizontal: 5 }}
              />
            </TouchableOpacity>
          </View>
        </Swipeable>
      </GestureHandlerRootView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}  
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.headerIcon} />
        </TouchableOpacity>
        <Image source={require('../assets/Avatar/Cat.png')} style={styles.botIcon} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.botName}>MatrixAI Bot</Text>
          <Text style={styles.botDescription}>Your virtual assistant</Text>
        </View>
      </View>

      {/* Chat List or Animation */}
      {messages.length === 1 ? (
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../assets/loading.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chat}
          onContentSizeChange={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)}
          onLayout={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)}
          ref={flatListRef}
          style={{ marginBottom: showAdditionalButtons ? 50 : 0 }}
        />
      )}

      {/* Loading Animation */}
      {isLoading && (
        <View style={[styles.loadingContainer, { bottom: showAdditionalButtons ? -100 : -140 }]}>
          <LottieView
            source={require('../assets/dot.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </View>
      )}

      {/* Buttons for Mindmap and PPT */}

      {/* Chat Input Box */}
      <View style={[styles.chatBoxContainer, { bottom: showAdditionalButtons ? -10 : -50 }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
          multiline
        />
        <TouchableOpacity onPress={handleAttach} style={styles.sendButton}>
          {showAdditionalButtons ? (
            <Ionicons name="close" size={24} color="#4C8EF7" />
          ) : (
            <Ionicons name="add" size={24} color="#4C8EF7" />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleCamera(navigation)} style={styles.sendButton}>
          <Ionicons name="camera" size={24} color="#4C8EF7" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#4C8EF7" />
        </TouchableOpacity>
      </View>

      {showAdditionalButtons && (
        <View style={styles.additionalButtonsContainer}>
          <TouchableOpacity style={styles.additionalButton} onPress={() => handleImageOCR('camera')}>
            <Ionicons name="camera" size={24} color="#4C8EF7" />
            <Text>Photo OCR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.additionalButton} onPress={() => handleImageOCR('gallery')}>
            <Ionicons name="image" size={24} color="#4C8EF7" />
            <Text>Image OCR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.additionalButton}>
            <Ionicons name="attach" size={24} color="#4C8EF7" />
            <Text>Document</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isFullScreen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenGraphContainer}>
            <ForceDirectedGraph2 transcription={selectedMessage?.text || ''} uid={uid} audioid={audioid}/>
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

      {showSummaryPrompt && (
        <View style={styles.summaryPromptContainer}>
          <Text style={styles.summaryPromptText}>Would you like to generate a summary of the text provided?</Text>
          <View style={styles.summaryPromptButtons}>
            <TouchableOpacity
              style={styles.summaryPromptButton}
              onPress={() => handleSummaryPrompt('yes')}
            >
              <Text style={styles.summaryPromptButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.summaryPromptButton}
              onPress={() => handleSummaryPrompt('no')}
            >
              <Text style={styles.summaryPromptButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    marginBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },

  chatBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: -50,
    width: '90%',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'blue',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    marginHorizontal: '5%',
  },
  messageImage: {
    width: 200,  // Adjust width based on your UI design
    height: 200, // Adjust height as needed
    borderRadius: 10,
    marginVertical: 10,
  },
  textInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 10,
  },
  sendIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#4C8EF7',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: '5%',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    zIndex: 100,
    bottom: -60,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mindmapButton: {
    backgroundColor: '#007bff',
  },
  pptButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    maxWidth: '70%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
    marginLeft: 0,
    marginRight: 10,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#4C8EF7',
    marginRight: 0,
    marginLeft: 10,
  },
  botText: {
    color: '#333',
    fontSize: 16,
  },
  headingText: {
    fontWeight: 'bold',
    fontSize: 17,
    marginVertical: 4,
  },
  subheadingText: {
  
    fontSize: 16,
    marginVertical: 2,
  },
  userText: {
    color: '#FFF',
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
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
    marginTop: 200,
    marginRight: 50,
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
  animationContainer: {
    width: '100%',
    height: 600,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFFFF',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    zIndex: 1,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',

    left: -200,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 300,
    height: 300,
  },
  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  botIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 10,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  botName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  botDescription: {
    color: '#888',
    fontSize: 14,
  },
  viewMoreText: {
    color: '#007bff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  swipeableButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  swipeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  additionalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: -60, // Adjust based on your layout
    width: '100%',
  },
  additionalButton: {
    alignItems: 'center',
  },
  additionalIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  summaryPromptContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  summaryPromptText: {
    fontSize: 16,
    marginBottom: 10,
  },
  summaryPromptButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  summaryPromptButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  summaryPromptButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default BotScreen2;
