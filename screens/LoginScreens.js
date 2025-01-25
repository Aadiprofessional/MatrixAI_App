import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../supabaseClient';

const LoginScreen = ({ navigation }) => {
  // Social Login
  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
    });
    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Phone OTP Login
  const handlePhoneLogin = () => {
    navigation.navigate('OTPScreen');
  };

  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <Image
        source={require('../assets/logo.png')} // Replace with your logo path
        style={styles.logo}
      />

      {/* Welcome Text */}
      <Text style={styles.title}>Let's Get Started!</Text>

      {/* Social Login Buttons */}
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => handleSocialLogin('facebook')}
      >
        <Image source={require('../assets/facebook.png')} style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => handleSocialLogin('google')}
      >
        <Image source={require('../assets/google.png')} style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => handleSocialLogin('apple')}
      >
        <Image source={require('../assets/apple.png')} style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </TouchableOpacity>

      {/* Or Separator */}
      <Text style={styles.orText}>or</Text>

      {/* Phone Login Button */}
      <TouchableOpacity style={styles.phoneButton} onPress={handlePhoneLogin}>
        <Text style={styles.phoneButtonText}>Sign in with OTP</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footerText}>
        Don’t have an account?{' '}
        <Text style={styles.signUpText} onPress={() => navigation.navigate('SignUpDetails')}>
          Sign up
        </Text>
      </Text>

      <View style={styles.footerLinks}>
        <Text style={styles.footerLink}>Privacy Policy </Text>
        <Text style={styles.footerLink}> Term of Service</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 10,
    width: '90%',
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCCE8',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    marginVertical: 10,
    fontSize: 16,
    color: '#888',
  },
  phoneButton: {
    backgroundColor: '#2274F0',
    width: '90%',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  phoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
  signUpText: {
    color: '#2274F0',
    fontWeight: 'bold',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  footerLink: {
    fontSize: 12,
    color: '#888',
  },
});

export default LoginScreen;
