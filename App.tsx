import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-url-polyfill/auto';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from './screens/OnboardingScreen';
import AppNavigator from './screens/AppNavigator'; // Bottom Tab Navigator
import LoginScreen from './screens/LoginScreens';
import OTPCodeScreen from './screens/OTPCodeScreen';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import EmailLoginScreen from './screens/PhoneLoginScreen';
import OTPCodeScreen2 from './screens/OTPCodeScreen copy';
import BotScreen from './screens/BotScreen';
import SignUpDetailsScreen from './screens/SignUpDetailsScreen';
import AudioVideoUploadScreen from './screens/AudioVideoUploadScreen';
import TranslateScreen from './screens/TranslateScreen';
import BotScreen2 from './screens/BotScreen copy';
import TranslatorScreen from './screens/Translator';
import VoiceTranslateScreen from './screens/TranslateVoice';
import ImageGenerateScreen from './screens/ImageGenerateScreen';
import LiveTranslateScreen from './screens/LiveTranslateScreen';
import CreateImagesScreen from './screens/createImageScreen';
import CreateImagesScreen2 from './screens/createImageScreen copy';
import VideoUploadScreen from './screens/VideoGenerate.js';
import ImageSelectScreen from './screens/ImageSelectScreen.js';
import CreateVideoScreen from './screens/createVideoScreen.js';
import PPTGenerateScreen from './screens/PPTGenerateScreen.js';
import CreatePPTScreen from './screens/createPPTScreen.js';
import WaveformTestScreen from './screens/WaveformTestScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import FillInformationScreen from './screens/FillInformationScreen';
import SuccessScreen from './screens/successScreen';
import ManageProductsScreen from './screens/ManageProductsScreen';



const Stack = createStackNavigator();

const App = () => {
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Show loading state while checking AsyncStorage
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check if the user is logged in on initial app load
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const userStatus = await AsyncStorage.getItem('userLoggedIn');
                if (userStatus === 'true') {
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error('Error checking login status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    // If still loading, show a spinner
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
    <Stack.Navigator>
        {/* Onboarding Screen */}
        {!onboardingCompleted && !isLoggedIn && (
            <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
                {(props) => (
                    <OnboardingScreen
                        {...props}
                        onFinish={() => setOnboardingCompleted(true)}
                    />
                )}
            </Stack.Screen>
        )}

        {/* Login Screens */}
        {!isLoggedIn && (
            <>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="OTPScreen" component={EmailLoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="OTPCode2" component={OTPCodeScreen2} options={{ headerShown: false }} />
                <Stack.Screen name="OTPCode" component={OTPCodeScreen} options={{ headerShown: false }} />
                <Stack.Screen name="SignUpDetails" component={SignUpDetailsScreen} options={{ headerShown: false }} />
            </>
        )}

        {/* Main App Screens */}
        <Stack.Screen name="Main" component={AppNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="BotScreen" component={BotScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BotScreen2" component={BotScreen2} options={{ headerShown: false }} />
        <Stack.Screen name="TranslateScreen" component={AudioVideoUploadScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TranslateScreen4" component={VoiceTranslateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TranslateScreen2" component={TranslateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TranslateScreen3" component={TranslatorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ImageTextScreen" component={ImageGenerateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LiveTranslateScreen" component={LiveTranslateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateImageScreen" component={CreateImagesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateImageScreen2" component={CreateImagesScreen2} options={{ headerShown: false }} />
        <Stack.Screen name="VideoUpload" component={VideoUploadScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ImageSelectScreen" component={ImageSelectScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateVideoScreen" component={CreateVideoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PPTGenerateScreen" component={PPTGenerateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreatePPTScreen" component={CreatePPTScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WaveformTest" component={WaveformTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="FillInformationScreen" component={FillInformationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SuccessScreen" component={SuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManageProductsScreen" component={ManageProductsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
</NavigationContainer>

    );
};

export default App;