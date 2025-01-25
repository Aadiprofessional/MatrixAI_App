import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import OpenAI from 'openai';
import LottieView from 'lottie-react-native';

const BotScreen = ({ navigation, route }) => {
  const { chatName, chatDescription, chatImage,chatid} = route.params;
  const flatListRef = React.useRef(null);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello.👋 I'm your new friend, MatrixAI Bot. You can ask me any questions.",
      sender: 'bot',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);  // Track if user is typing
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data is loaded
  const [expandedMessages, setExpandedMessages] = useState({}); // Track expanded messages
  const uid ='user123';

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
      setMessages((prev) => [...prev, newMessage]);

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
    if (!dataLoaded) return null;
    
    const isBot = item.sender === 'bot';
    const isExpanded = expandedMessages[item.id];
    const shouldTruncate = item.text.length > 100;
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
        <Text style={isBot ? styles.botText : styles.userText}>
          {displayText}
        </Text>
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
        const history = response.data.messages;
        setMessages(history); // Set messages from the server
        setDataLoaded(true); // Mark data as loaded
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setDataLoaded(true); // Still mark as loaded even if error
      }
    };

    fetchChatHistory();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.headerIcon} />
        </TouchableOpacity>
        <Image source={require('../assets/Avatar/Cat.png')} style={styles.botIcon} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.botName}>{chatName}</Text>
          <Text style={styles.botDescription}>{chatDescription}</Text>
        </View>
        <TouchableOpacity>
          <Image source={require('../assets/threeDot.png')} style={styles.headerIcon2} />
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
      </Animatable.View>

      {/* Input Box */}
      {showInput && (
        <View style={styles.inputContainer}>
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
          {isTyping ? (
            <TouchableOpacity onPress={handleSendMessage}>
              <Image source={require('../assets/send2.png')} style={styles.icon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowInput(false)}>
              <Image source={require('../assets/mic.png')} style={styles.icon} />
            </TouchableOpacity>
          )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    resizeMode: 'contain',
  },
  headerIcon2: {
    width: 15,
    height: 15,
    marginHorizontal: 5,
    resizeMode: 'contain',
  },
  botIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 20,
    height: 20,
    marginHorizontal: 10,
    resizeMode: 'contain',
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
});

export default BotScreen;
