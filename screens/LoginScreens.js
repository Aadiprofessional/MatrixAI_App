import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { SafeAreaView } from 'react-native-safe-area-context';

// Generate a nonce at app startup
const generateNonce = (length = 32) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

const LoginScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In only once when component mounts
    GoogleSignin.configure({
      webClientId: '1046714115920-83sdiqi07763luik2p1d54ka442optra.apps.googleusercontent.com',
      iosClientId: '1046714115920-83sdiqi07763luik2p1d54ka442optra.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['profile', 'email']
    });

    // Handle deep linking
    const handleDeepLink = async ({ url }) => {
      console.log('Received deep link:', url);
      
      if (url) {
        try {
          // Extract the access_token and refresh_token from the URL if present
          const params = new URL(url).searchParams;
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token) {
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            console.log('Session after setting tokens:', session);

            if (error) throw error;

            if (session) {
              const userId = session.user.id;
              await AsyncStorage.setItem('supabase-session', JSON.stringify(session));
              await AsyncStorage.setItem('uid', userId);
              await AsyncStorage.setItem('userLoggedIn', 'true');

              // Check if user exists in users table
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();

              if (userError) throw userError;

              if (userData) {
                navigation.replace('Main');
              } else {
                navigation.navigate('SignUpDetails');
              }
            }
          }
        } catch (error) {
          console.error('Error handling auth callback:', error);
          Alert.alert('Error', 'Failed to complete authentication');
        }
      }
    };

    // Add event listener for deep linking
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  // Helper function to decode JWT token
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google Sign-In process...');
      
      // Sign out of any existing Google session
      await GoogleSignin.signOut();
      
      // Start Google Sign-In
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In response:', userInfo);

      // Get the ID token from the user info
      const idToken = userInfo?.data?.idToken; // Access idToken directly from userInfo
      console.log('Raw userInfo:', userInfo);
      console.log('Extracted ID token:', idToken ? 'Token exists' : 'No token found');

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Generate a nonce for this sign-in attempt
      const currentNonce = generateNonce();

      // Sign in to Supabase with the Google ID token
      const { data: { session }, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: currentNonce
      });

      console.log('Supabase auth response:', { session, error });

      if (error) {
        throw error;
      }

      if (session) {
        console.log('Successfully authenticated with Supabase:', session.user);
        const userId = session.user.id;
        
        // Store session data
        await AsyncStorage.setItem('supabase-session', JSON.stringify(session));
        await AsyncStorage.setItem('uid', userId);
        await AsyncStorage.setItem('userLoggedIn', 'true');

        try {
          // Check if user exists in users table using text comparison for UUID
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

          console.log('User query response:', { userData, userError });

          // If there's an error or no user found, proceed to signup
          if (userError || !userData) {
            console.log('User not found, proceeding to signup');
            const userInfo = {
              user_id: userId,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
              avatar_url: session.user.user_metadata?.picture || '',
              phone: session.user.phone || ''
            };
            console.log('Navigating to SignUpDetails with user info:', userInfo);
            navigation.navigate('SignUpDetails', { userInfo });
            return;
          }

          // If user exists, go to main screen
          console.log('User found, proceeding to main screen');
          navigation.replace('Main');
        } catch (error) {
          console.error('Error checking user data:', error);
          Alert.alert('Error', 'Failed to verify user information');
        }
      }
    } catch (error) {
      console.error('Detailed error:', error);
      Alert.alert('Error', `Failed to login with Google: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Social Login
  const handleSocialLogin = async (provider) => {
    Alert.alert('Coming Soon', 'This login method will be available soon!');
  };

  // Phone OTP Login
  const handlePhoneLogin = () => {
    navigation.navigate('OTPScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
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
        style={[styles.socialButton, isLoading && styles.disabledButton]}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#2274F0" />
        ) : (
          <>
            <Image source={require('../assets/google.png')} style={styles.icon} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </>
        )}
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
        Don't have an account?{' '}
        <Text style={styles.signUpText} onPress={() => navigation.navigate('SignUpDetails')}>
          Sign up
        </Text>
      </Text>

      <View style={styles.footerLinks}>
        <Text style={styles.footerLink}>Privacy Policy </Text>
        <Text style={styles.footerLink}> Term of Service</Text>
      </View>
    </SafeAreaView>
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
  disabledButton: {
    opacity: 0.7,
  },
});

export default LoginScreen;
