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
} from 'react-native';

const { width } = Dimensions.get('window');

const OTPCodeScreen = ({ navigation, route }) => {
    const { email, name, age, gender, password } = route.params || {};
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [activeIndex, setActiveIndex] = useState(0);
    const [error, setError] = useState(false);

    const inputRefs = [];

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
        if (enteredOtp.trim().length === 6) {
            try {
                const response = await fetch('https://matrix-server-gzqd.vercel.app/saveUserData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        name,
                        age,
                        gender,
                        otp: enteredOtp,
                        password,
                    }),
                });
    
                const result = await response.json();
    
                if (response.ok) {
                    setError(false);
                    // Save login status in AsyncStorage
                    await AsyncStorage.setItem('userLoggedIn', 'true');
                    navigation.navigate('Main'); // Navigate to Home Screen
                } else {
                    setError(true);
                    alert(result.message || 'Verification failed. Please try again.');
                }
            } catch (error) {
                setError(true);
                alert('An error occurred. Please try again.');
            }
        } else {
            setError(true);
        }
    };

    // Handle Resend
    const handleResendCode = () => {
        setOtp(['', '', '', '', '', '']);
        inputRefs[0]?.focus();
        setActiveIndex(0);
        setError(false);
        alert('A new code has been sent!');
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
                <Text style={styles.errorText}>Invalid OTP. Please try again.</Text>
            ) : (
                <Text style={styles.subtitle}>Enter the 6 digits code that you received on your SMS</Text>
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
            <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
                <Text style={styles.verifyButtonText}>Verify</Text>
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
        marginTop: 100,
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

export default OTPCodeScreen;
