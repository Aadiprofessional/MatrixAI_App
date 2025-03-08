import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,

  TextInput,
  TouchableOpacity,
  Image,
  DrawerLayoutAndroid,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

import OpenAI from 'openai';
import LeftNavbarBot from '../components/LeftNavbarBot';

const BotScreen = ({ navigation, route }) => {
  const { chatName, chatDescription, chatImage, chatid } = route.params;
  const flatListRef = React.useRef(null);
  const [chats, setChats] = useState([
    {
      id: '1',
      name: 'First Chat',
      description: 'Your initial chat with MatrixAI Bot.',
      messages: [
        {
          id: '1',
          text: "Hello.👋 I'm your new friend, MatrixAI Bot. You can ask me any questions.",
          sender: 'bot',
        },
      ],
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState('1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const currentChat = chats.find(chat => chat.id === currentChatId);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);  // Track if user is typing
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data is loaded
  const [expandedMessages, setExpandedMessages] = useState({}); // Track expanded messages
  const uid = 'user123';
  const [showAdditionalButtons, setShowAdditionalButtons] = useState(false); 
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Function to get response from DeepSeek (Gemini API in your case)
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',  // DeepSeek API URL
    apiKey: 'sk-fed0eb08e6ad4f1aabe2b0c27c643816', // Your DeepSeek API key
  });

const fetchDeepSeekResponse = async (userMessage, retryCount = 0) => {
  const maxRetries = 5;
  const retryDelay = Math.min(Math.pow(2, retryCount) * 1000, 60000); // Max delay is 1 minute

  setIsLoading(true);
  try {
    // Format message history for API
    const messageHistory = messages.map(msg => ({
      role: msg.sender === 'bot' ? 'assistant' : 'user',
      content: msg.text
    }));

    const response = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...messageHistory,
        { role: 'user', content: userMessage },
      ],
      model: 'deepseek-chat',
    });

    const botMessage = response.choices[0].message.content.trim();

    let chatNameUpdated = false;
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === currentChatId && chat.name === 'New Chat' && !chatNameUpdated) {
        chatNameUpdated = true;
        return { ...chat, name: `Message: ${botMessage.substring(0, 20)}`, description: userMessage };
      }
      return chat;
    }));

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: botMessage, sender: 'bot' },
    ]);

    // Save the bot's message to the server
    await saveChatHistory(botMessage, 'bot');
  } catch (error) {
    if (retryCount < maxRetries) {
      console.log(`Error occurred. Retrying in ${retryDelay / 1000} seconds...`);
      setTimeout(() => fetchDeepSeekResponse(userMessage, retryCount + 1), retryDelay);
    } else {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: 'Error fetching response. Try again later.', sender: 'bot' },
      ]);
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      // Update the current chat's messages
      setChats(prevChats => prevChats.map(chat => 
        chat.id === currentChatId ? { ...chat, messages: updatedMessages } : chat
      ));

      // Save the user's message to the server
      await saveChatHistory(inputText, 'user');
      
      fetchDeepSeekResponse(inputText);  // Fetch response from DeepSeek
      setInputText('');
      setIsTyping(false);
    }
  };

  const saveChatHistory = async (messageText, sender) => {
    try {
      const response = await axios.post('https://matrix-server.vercel.app/sendChat', {
        uid,
        chatid,
        updatedMessage: messageText,
        sender,
      });
      console.log('Message saved:', response.data);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    setIsTyping(text.length > 0); // Toggle typing state
  };

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const renderMessage = ({ item }) => {
    // Log the messages state for debugging
    console.log('Messages:', messages);
    
    // Ensure messages is an array and data is loaded
    if (!dataLoaded || !Array.isArray(messages) || messages.length === 0) return null; 

    const isBot = item.sender === 'bot';
    const isExpanded = expandedMessages[item.id];
    const shouldTruncate = item.text && item.text.length > 100; // Check if text exists
    const displayText = shouldTruncate && !isExpanded 
      ? `${item.text.substring(0, 100)}...`
      : item.text;

    return (
      <Animatable.View
        animation="fadeInUp"
        duration={800}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}
      >
        {item.image ? ( // Check if the message has an image
          <Image
            source={{ uri: item.image }}
            style={{ width: 200, height: 200, borderRadius: 10 }} // Adjust size as needed
          />
        ) : (
          <Text style={isBot ? styles.botText : styles.userText}>
            {displayText}
          </Text>
        )}
        {shouldTruncate && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => toggleMessageExpansion(item.id)}
          >
            <Text style={styles.viewMoreText}>
              {isExpanded ? 'View less' : 'View more'}
            </Text>
          </TouchableOpacity>
        )}
      </Animatable.View>
    );
  };

  useEffect(() => {
    // Fetch chat history when component mounts
    const fetchChatHistory = async () => {
      try {
        const response = await axios.post('https://matrix-server.vercel.app/getChat', { uid, chatid });
        const history = response.data.messages || []; // Default to an empty array if undefined
        setChats(prevChats => [
          ...prevChats,
          {
            id: Date.now().toString(),
            name: 'First Chat',
            description: 'Your initial chat with MatrixAI Bot.',
            messages: history,
          },
        ]);
        setCurrentChatId(Date.now().toString());
        setMessages(history); // Set messages from the server
        setDataLoaded(true); // Mark data as loaded
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setDataLoaded(true); // Still mark as loaded even if error
      }
    };

    fetchChatHistory();
  }, []);

  const handleAttach = () => {
    setShowAdditionalButtons(prev => !prev); // Toggle additional buttons visibility
    // Change the icon from plus to cross
  };

  const handleCamera = (navigation) => {
    navigation.navigate('CameraScreen');
  };
  

  
  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
    const selectedChat = chats.find(chat => chat.id === chatId);
    setMessages(selectedChat ? selectedChat.messages : []);
    setIsSidebarOpen(false);
  };

  const startNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      name: 'New Chat',
      description: '',
      messages: [],
    };
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChatId);
    setMessages([]);
    setIsSidebarOpen(false);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.backButton, { marginLeft: isSidebarOpen ? 300 : 0 }]}
        onPress={() => {
          if (isSidebarOpen) {
            setIsSidebarOpen(false);
          } else {
            setIsSidebarOpen(true);
          }
        }}
      >
        {isSidebarOpen ? (
          <MaterialIcons name="arrow-back-ios" size={24} color="#000" style={styles.headerIcon2} />
        ) : (
          <MaterialIcons name="arrow-forward-ios" size={24} color="#000" style={styles.headerIcon} />
        )}
      </TouchableOpacity>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={24} color="#000" style={styles.headerIcon} />
        </TouchableOpacity>
        <Image source={require('../assets/Avatar/Cat.png')} style={styles.botIcon} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.botName}>{currentChat ? currentChat.name : chatName}</Text>
          <Text style={styles.botDescription}>{currentChat ? currentChat.description : chatDescription}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CallScreen')}>
          <MaterialIcons name="call" size={24} color="#4C8EF7" marginHorizontal={1} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('CameraScreen')}>
          <Ionicons name="video-outline" size={28} color="#4C8EF7" marginHorizontal={10} />
        </TouchableOpacity>
        <TouchableOpacity onPress={startNewChat}>
          <Ionicons name="chat-plus-outline" size={24} color="#4C8EF7" />
        </TouchableOpacity>
     
       
      </View>

      {/* Chat List */}
      <Animatable.View animation="fadeIn" duration={1000} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chat}
          onContentSizeChange={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)}
          onLayout={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)}
        />

        {/* Placeholder for New Chat */}
        {messages.length === 0 && dataLoaded && (
          <View style={styles.placeholderContainer}>
            <Image source={require('../assets/matrix.png')} style={styles.placeholderImage} />
            <Text style={styles.placeholderText}>Hi, I'm MatrixAI Bot.</Text>
            <Text style={styles.placeholderText2}>How can I help you today?</Text>
          </View>
        )}
      </Animatable.View>

      
       <View style={[styles.chatBoxContainer, { bottom: showAdditionalButtons ? 70 : 30}]}>
          <TextInput
            style={[styles.textInput, { textAlignVertical: 'top' }]}
            placeholder="Send a message..."
            value={inputText}
            onChangeText={handleInputChange}
            onSubmitEditing={handleSendMessage}
            multiline
            numberOfLines={3}
            maxLength={250}
          />
            <TouchableOpacity onPress={handleAttach} style={styles.sendButton}>
                  {showAdditionalButtons ? (
                    <Ionicons name="close" size={24} color="#4C8EF7" />
                  ) : (
                    <Ionicons name="plus" size={24} color="#4C8EF7" />
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
                    <Ionicons name="attachment" size={24} color="#4C8EF7" />
                    <Text>Document</Text>
                  </TouchableOpacity>
                </View>
              )}
  

      {isLoading && (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/dot.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </View>
      )}

      {isSidebarOpen && (
        <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
          <LeftNavbarBot
            chats={chats}
            onSelectChat={selectChat}
            onNewChat={startNewChat}
            onClose={() => setIsSidebarOpen(false)}
          />
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    zIndex: 1,
    width:20,
    height:70,
    backgroundColor:'#D2D2D257',
    justifyContent:'center',
    alignItems:'center',
    borderRadius:15,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  headerIcon: {
    width: 30,
    height: 30,
    marginHorizontal: 5,
  },
  headerIcon2: {
    marginHorizontal: 5,
  },
  botIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sendButton: {
   padding: 10,
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
    bottom: 20, // Adjust based on your layout
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
  chatBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
   
    width: '90%',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'blue',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    marginHorizontal: '5%',
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  botName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  botDescription: {
    fontSize: 12,
    color: '#666',
  },
  chat: {
    paddingVertical: 10,
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
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#4C8EF7',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: -50,
    right: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 300,
    height: 300,
  },
  botText: {
    color: '#333',
    fontSize: 16,
  },
  userText: {
    color: '#FFF',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    marginHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  icon: {
    marginHorizontal: 10,
  },
  loading: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  viewMoreButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  viewMoreText: {
    color: '#4C8EF7',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  placeholderContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    alignItems: 'center',

  },
  placeholderImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  placeholderText2: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default BotScreen;
