import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator, // Import ActivityIndicator
    Alert,
} from 'react-native';
import { supabase } from '../supabaseClient';

const { width } = Dimensions.get('window');

const OTPCodeScreen2 = ({ route, navigation }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [activeIndex, setActiveIndex] = useState(0);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state for button
    const [otpVerified, setOtpVerified] = useState(false); // Track if OTP is successfully verified

    const inputRefs = [];
    const { phone } = route.params; // Retrieve phone from navigation params

    // Auto-focus on first box when screen loads
    useEffect(() => {
        inputRefs[0]?.focus();
    }, []);

    // Handle OTP input
    const handleOtpChange = (text, index) => {
        if (text.length <= 1) {
            let newOtp = [...otp];
            newOtp[index] = text;
            setOtp(newOtp);

            if (text && index < 5) {
                inputRefs[index + 1]?.focus();
                setActiveIndex(index + 1);
            }
        }
    };

    // Handle Verify OTP Button
    const handleVerify = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length === 6 && phone) {
            try {
                setLoading(true);
                setError(false);
                console.log('Verifying OTP for phone:', phone);

                const response = await fetch('https://matrix-server-gzqd.vercel.app/verifyPhoneOtp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phone: phone,
                        otp: enteredOtp,
                    }),
                });

                const data = await response.json();
                console.log('API Response full data:', JSON.stringify(data, null, 2));

                if (data.message === "OTP verified and user authenticated") {
                    setOtpVerified(true);
                    
                    // The user ID is nested in data.session.user.id
                    if (data.session?.user?.id) {
                        const userId = data.session.user.id;
                        console.log('Found user ID:', userId);
                        
                        // Store the complete session
                        await AsyncStorage.setItem('supabase-session', JSON.stringify(data.session));
                        await AsyncStorage.setItem('uid', userId);
                        await AsyncStorage.setItem('userLoggedIn', 'true');

                        // Set up Supabase session
                        try {
                            const { error: sessionError } = await supabase.auth.setSession({
                                access_token: data.session.session.access_token,
                                refresh_token: data.session.session.refresh_token,
                            });

                            if (sessionError) throw sessionError;
                            console.log('Supabase session established successfully');
                        } catch (sessionError) {
                            console.log('Supabase session error (non-fatal):', sessionError);
                            // Continue anyway since we have the user ID
                        }

                        // Verify storage
                        const storedUid = await AsyncStorage.getItem('uid');
                        console.log('Stored UID:', storedUid);

                        // Navigate to main screen
                        navigation.replace('Main');
                    } else {
                        throw new Error('User ID not found in response');
                    }
                } else {
                    setOtpVerified(false);
                    setError(true);
                    throw new Error(data.error || 'OTP verification failed');
                }
            } catch (error) {
                console.error('Error in OTP verification:', error);
                setError(true);
                Alert.alert(
                    'Error',
                    error.message || 'Failed to verify OTP. Please try again.'
                );
            } finally {
                setLoading(false);
            }
        } else {
            setError(true);
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
        }
    };
    // Handle Resend
    const handleResendCode = () => {
        setOtp(['', '', '', '', '', '']);
        inputRefs[0]?.focus();
        setActiveIndex(0);
        setError(false);
        alert('A new code has been sent!');
        console.log('Resent OTP'); // Log resend action
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={styles.backButtonCircle}>
                    <Image source={require('../assets/back.png')} style={styles.backArrow} />
                </View>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Enter 6 Digits Code</Text>

            {/* Error or Subtitle */}
            {error ? (
                <Text style={styles.errorText}>This code is not correct or phone is invalid</Text>
            ) : (
                <Text style={styles.subtitle}>Enter the 6 digits code that you received on your phone</Text>
            )}

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
                {otp.map((value, index) => (
                    <TextInput
                        key={index}
                        ref={(input) => (inputRefs[index] = input)}
                        style={[
                            styles.otpInput,
                            { borderColor: '#ccc' }, // Default border color
                            activeIndex === index && styles.otpInputActive, // Active box border
                            error ? styles.otpInputError : null, // Error state border
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={value}
                        onFocus={() => setActiveIndex(index)}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === 'Backspace') {
                                // If input is empty, move to the previous box
                                if (!value && index > 0) {
                                    let newOtp = [...otp];
                                    newOtp[index] = '';
                                    setOtp(newOtp);
                                    inputRefs[index - 1]?.focus();
                                    setActiveIndex(index - 1);
                                } else {
                                    // Clear current input
                                    let newOtp = [...otp];
                                    newOtp[index] = '';
                                    setOtp(newOtp);
                                }
                            }
                        }}
                    />
                ))}
            </View>

            {/* Resend Code */}
            <TouchableOpacity style={styles.resendContainer} onPress={handleResendCode}>
                <Image source={require('../assets/resend.png')} style={styles.resendImage} />
                <Text style={styles.resendText}>Get new code</Text>
            </TouchableOpacity>

            {/* Verify Button */}
            <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerify}
                disabled={loading} // Disable button when loading
            >
                {loading ? (
                    <ActivityIndicator color="#fff" /> // Show ActivityIndicator when loading
                ) : (
                    <Text style={styles.verifyButtonText}>Verify</Text> // Show "Verify" text otherwise
                )}
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2274F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        tintColor: '#fff',
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 50,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginBottom: 20,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    otpInput: {
        width: width / 8,
        height: 55,
        borderWidth: 1,
        borderColor: '#ccc', // Default box border
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 24,
        color: '#000',
        marginHorizontal: 5, // Gap between inputs
    },
    otpInputActive: {
        borderColor: '#2274F0', // Active input border color
    },
    otpInputError: {
        borderColor: 'red',
        color: 'red',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    resendImage: {
        width: 20,
        height: 20,
        marginRight: 5,
        resizeMode: 'contain',
    },
    resendText: {
        color: '#3399FF',
        fontSize: 14,
    },
    verifyButton: {
        backgroundColor: '#2274F0',
        paddingVertical: 15,
        borderRadius: 30,
        width: '90%',
        alignItems: 'center',
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OTPCodeScreen2;