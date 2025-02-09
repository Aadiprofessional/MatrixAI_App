import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator
} from 'react-native';

const { width } = Dimensions.get('window');

const EmailLoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false); // State to manage loading

    const handleLogin = async () => {
        if (phone.trim() === '') {
            alert('Please enter a valid phone number!');
            return;
        }
    
        setLoading(true);
    
        try {
            const response = await fetch('https://matrix-server-gzqd.vercel.app/sendPhoneOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }), // Send phone number in the request body
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('API Response:', data);  // For debugging
    
            if (data.error) {
                // If the error message is specific (like 'User not registered')
                if (data.error === 'User not registered') {
                    navigation.navigate('SignUpDetails', {
                        phone: phone,
                        disableEmailInput: true,
                    });
                } else {
                    alert(data.error); // Show the error message from the backend
                }
            } else {
                // If OTP is successfully sent, navigate to the OTPCode screen
                navigation.navigate('OTPCode2', { phone: phone });
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            alert(error.message || 'Error sending OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    
    

    const handleSignUp = () => {
        navigation.navigate('SignUpDetails', {
            phone: '', // No predefined email address
            disableEmailInput: false, // Allow email input on SignUpDetails screen
        });
    };

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={styles.backButtonCircle}>
                    <Image source={require('../assets/back.png')} style={styles.backArrow} />
                </View>
            </TouchableOpacity>

            {/* Heading */}
            <Text style={styles.heading}>Log in and unlock{'\n'}the digital universe</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Phone"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    value={phone}
                    onChangeText={setPhone}
                />
            </View>

            {/* Get OTP Button */}
            <TouchableOpacity style={styles.otpButton} onPress={handleLogin}>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.otpButtonText}>Get OTP</Text>
                )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.orText}>or continue with</Text>
                <View style={styles.divider} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={styles.socialButton}>
                    <Image source={require('../assets/google.png')} style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Image source={require('../assets/facebook.png')} style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Image source={require('../assets/apple.png')} style={styles.socialIcon} />
                </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <Text style={styles.signupText}>
                Don’t have an account?
                <Text style={styles.signupLink} onPress={handleSignUp}> Sign up</Text>
            </Text>

            {/* Privacy Policy and Terms */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Privacy Policy  </Text>
                <Text style={styles.footerText}>  Term of Service</Text>
            </View>
        </View>
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
        borderWidth: 1,
        borderColor: '#aaa',
    },
    backArrow: {
        tintColor: '#fff',
        width: 20,
        height: 20,
        marginHorizontal: 5,
        resizeMode: 'contain',
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 80,
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        width: '100%',
        marginBottom: 20,
    },
    phoneIcon: {
        marginRight: 10,
        fontSize: 18,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    otpButton: {
        backgroundColor: '#2274F0',
        paddingVertical: 12,
        borderRadius: 30,
        width: '90%',
        alignItems: 'center',
        marginBottom: 20,
    },
    otpButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'medium',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    orText: {
        marginHorizontal: 10,
        color: '#aaa',
        fontSize: 14,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        marginVertical: 10,
    },
    socialButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 50,
        padding: 10,
    },
    socialIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    signupText: {
        fontSize: 14,
        color: '#000',
        marginTop: 10,
    },
    signupLink: {
        color: '#2274F0',
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        width: '100%',
    },
    footerText: {
        color: '#aaa',
        fontSize: 12,
    },
});

export default EmailLoginScreen;
