import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load UID from AsyncStorage on startup
    loadUid();
  }, []);

  const loadUid = async () => {
    try {
      const storedUid = await AsyncStorage.getItem('uid');
      if (storedUid) {
        setUid(storedUid);
      }
    } catch (error) {
      console.error('Error loading UID:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUid = async (newUid) => {
    try {
      await AsyncStorage.setItem('uid', newUid);
      setUid(newUid);
    } catch (error) {
      console.error('Error saving UID:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ uid, loading, updateUid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
