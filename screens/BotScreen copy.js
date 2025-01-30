import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import OpenAI from 'openai';
import ForceDirectedGraph2 from '../components/mindMap2';

const BotScreen2 = ({ navigation, route }) => {
  const flatListRef = React.useRef(null);
  const { transcription ,XMLData,uid,audioid} = route.params || {};
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello.👋 I'm your new friend, MatrixAI Bot. You can ask me any questions.",
      sender: 'bot',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [fullTranscription, setFullTranscription] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  useEffect(() => {
    if (transcription) {
      setFullTranscription(transcription);
      
      // Add auto-generated user message requesting summary
      const userMessage = {
        id: Date.now().toString(),
        text: "Help me generate summary of the given transcription",
        sender: 'user',
        fullText: transcription
      };
      setMessages((prev) => [...prev, userMessage]);
      
      // Get summary from bot
      fetchDeepSeekResponse(`Please summarize this text in structured format: ${transcription}`);
    }
  }, [transcription]);

  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-fed0eb08e6ad4f1aabe2b0c27c643816',
  });

  // Format message history for API
  const messageHistory = messages.map(msg => ({
    role: msg.sender === 'bot' ? 'assistant' : 'user',
    content: msg.text
  }));

  const fetchDeepSeekResponse = async (userMessage, retryCount = 0) => {
    const maxRetries = 5;
    const retryDelay = Math.min(Math.pow(2, retryCount) * 1000, 60000);
  
    setIsLoading(true); 
    try {
      // Only include transcription context for the first summary request
      const contextMessage = messages.length <= 2 && fullTranscription
        ? `\n\nFull transcription for context: ${fullTranscription}`
        : '';
        
      const response = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...messageHistory,
          { 
            role: "user", 
            content: userMessage + contextMessage
          }
        ],
        model: "deepseek-chat",
      });
  
      const botMessage = response.choices[0].message.content.trim();
      
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString(), 
          text: botMessage, 
          sender: 'bot',
          context: fullTranscription // Store transcription context
        },
      ]);
    } catch (error) {
      if (retryCount < maxRetries) {
        setTimeout(() => fetchDeepSeekResponse(userMessage, retryCount + 1), retryDelay);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), text: 'Error fetching response. Try again later.', sender: 'bot' },
        ]);
      }
    } finally {
      setIsLoading(false);
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
      fetchDeepSeekResponse(inputText);
      setInputText('');
      setIsTyping(false);
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
      }
    });
  };

  const renderMessage = ({ item }) => {
    const isBot = item.sender === 'bot';
    const isExpanded = expandedMessages[item.id];
    return (
      <GestureHandlerRootView>
        <Swipeable
          overshootRight={false}
        >
          <Animatable.View
            animation="fadeInUp"
            duration={100}
            style={[
              styles.messageContainer,
              isBot ? styles.botMessageContainer : styles.userMessageContainer,
            ]}
          >
            {item.text && (
              <Text style={isBot ? styles.botText : styles.userText}>
                {isExpanded ? item.text : item.text.slice(0, 100)}
                {item.text.length > 100 && (
                  <Text 
                    style={styles.viewMoreText}
                    onPress={() => toggleMessageExpansion(item.id)}
                  >
                    {isExpanded ? ' View less' : ' View more'}
                  </Text>
                )}
              </Text>
            )}
            {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
          </Animatable.View>
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
        />
      )}

      {/* Loading Animation */}
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

      {/* Buttons for Mindmap and PPT */}
    
      {/* Chat Input Box */}
      <View style={styles.chatBoxContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
          multiline
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Image source={require('../assets/send2.png')} style={styles.sendIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.mindmapButton]} 
          onPress={() => setIsFullScreen(true)} 
        >
          <Text style={styles.buttonText}>Generate Mindmap</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.pptButton]} 
          onPress={() =>  navigation.navigate('CreatePPTScreen', { message : transcription ,audioid })}
        >
          <Text style={styles.buttonText}>Generate PPT</Text>
        </TouchableOpacity>
      </View>
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
          

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    marginBottom:100,
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
    bottom: -10,
    width: '90%',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'blue',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    marginHorizontal: '5%',
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
    zIndex:100,
    bottom:-60,
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
    marginLeft: 10,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#4C8EF7',
    marginRight: 10,
  },
  botText: {
    color: '#333',
    fontSize: 16,
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
    bottom: -100,
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
});

export default BotScreen2;
