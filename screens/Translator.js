import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, ToastAndroid, Clipboard, Image, Share } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
const TranslatorScreen = ({ route, navigation }) => {
    const { transcription } = route.params || {};
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('zh-Hans');
    const [languageName, setLanguageName] = useState('Detecting...');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const languages = [
        { code: 'zh-Hans', name: 'Chinese (Simplified)' },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
    ];

    const azureEndpoint = 'https://api.cognitive.microsofttranslator.com';
    const azureKey = '21oYn4dps9k7VJUVttDmU3oigC93LUtyYB9EvQatENmWOufZa4xeJQQJ99ALACYeBjFXJ3w3AAAbACOG0HQP'; // Replace with your Azure API Key
    const region = 'eastus'; 

    useEffect(() => {
        if (transcription) {
            setInputText(transcription);
            detectLanguage(transcription);
        }
    }, [transcription]);

    const detectLanguage = async (text) => {
        try {
            const response = await axios.post(
                `${azureEndpoint}/detect?api-version=3.0`,
                [{ Text: text }],
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': azureKey,
                        'Ocp-Apim-Subscription-Region': region,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const detectedLanguage = response.data[0].language;
            setSourceLang(detectedLanguage);
            const languageObj = languages.find((lang) => lang.code === detectedLanguage);
            setLanguageName(languageObj ? languageObj.name : 'Unknown');
        } catch (error) {
            console.error('Error detecting language:', error.message);
        }
    };

    const translateText = async () => {
        try {
            const response = await axios.post(
                `${azureEndpoint}/translate?api-version=3.0&to=${targetLang}`,
                [{ Text: inputText }],
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': azureKey,
                        'Ocp-Apim-Subscription-Region': region,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setTranslatedText(response.data[0].translations[0].text);
        } catch (error) {
            console.error('Error translating text:', error.message);
        }
    };

    const copyToClipboard = () => {
      Clipboard.setString(translatedText);
      Toast.show({
          type: 'success',
          text1: 'Copied to clipboard!',
      });
  };

       const shareText = async () => {
           try {
               await Share.share({
                   message: translatedText || 'No transcription available.',
               });
           } catch (error) {
               console.error('Error sharing:', error);
           }
       };
   

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    return (
        <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image source={require('../assets/back.png')} style={styles.headerIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Language Translator</Text>
                <Image source={require('../assets/threeDot.png')} style={styles.headerIcon} />
            </View>

            {/* Input Section */}
            <View style={styles.textBox}>
                <Text style={styles.textBoxHeader}>Detected Language: {languageName}</Text>
                <TextInput
                    style={[styles.textInput, { height: Math.max(150, inputText.split('\n').length * 20) }]}
                    placeholder="Type here..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity style={styles.translateButton} onPress={translateText}>
                    <Text style={styles.buttonText}>Translate</Text>
                </TouchableOpacity>
            </View>


          

            {/* Output Section */}
            <View style={styles.textBox}>
              <View style={styles.itemRow}>
                <Text style={styles.textBoxHeader}>Translated Text</Text>  <TouchableOpacity style={styles.languageDropdown} onPress={toggleDropdown}>
                <Text style={styles.dropdownText}>
                    {languages.find((lang) => lang.code === targetLang)?.name || 'Select Language'}
                </Text>
                <Image source={require('../assets/downArrow.png')} style={styles.downArrow} />
            </TouchableOpacity>
            {dropdownVisible && (
                <View style={styles.dropdownMenu}>
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            onPress={() => {
                                setTargetLang(lang.code);
                                setDropdownVisible(false);
                            }}
                        >
                            <Text style={styles.dropdownItem}>{lang.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            </View>
                <Text style={styles.translatedText}>{translatedText || 'Translation will appear here.'}</Text>
                <View style={styles.actionIcons}>
                    <TouchableOpacity onPress={copyToClipboard}>
                        <Image source={require('../assets/copy.png')} style={styles.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={shareText}>
                        <Image source={require('../assets/share.png')} style={styles.icon} />
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 , },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerIcon: { width: 24, height: 24, resizeMode: 'contain' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#007bff' },
    textBox: { backgroundColor: '#FFFBFE', padding: 15, borderRadius: 10, marginBottom: 20 },
    textBoxHeader: { fontWeight: 'bold', marginBottom: 10, color: '#007bff' },
    textInput: { padding: 10, textAlignVertical: 'top' },
    translateButton: { marginTop: 20, backgroundColor: '#FF6600', padding: 10, borderRadius: 30, alignSelf: 'flex-end' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    languageDropdown: { flexDirection: 'row', alignItems: 'center' ,marginBottom: 10,},
    dropdownText: { marginLeft: 10, fontSize: 16 ,color:'#FF6600'},
    downArrow: { width: 12, height: 12, resizeMode: 'contain' ,marginLeft:3,tintColor:'#FF6600'},
    dropdownMenu: { position: 'absolute', top: 25, left: 100, backgroundColor: '#fff', borderRadius: 5, elevation: 3, padding: 10, width: 150 , zIndex:120, },
    dropdownItem: { padding: 10, fontSize: 16, color: '#333' },
    translatedText: { fontSize: 16, marginTop: 10 },
    actionIcons: { flexDirection: 'row', marginTop: 10 },
    icon: { width: 24, height: 24, marginHorizontal: 10, resizeMode: 'contain' },
    itemRow:{
      flexDirection: 'row',
      alignItems: 'center',
    
   
   
    }
});

export default TranslatorScreen;
