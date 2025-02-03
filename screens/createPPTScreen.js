import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
} from "react-native";
import { WebView } from 'react-native-webview';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const { width } = Dimensions.get("window");

const CreatePPTScreen = ({ route, navigation }) => {
  const { message } = route.params; // Extract text from params
  const [pptUrl, setPptUrl] = useState(null); // Store the downloaded PPT URL
  const [localFilePath, setLocalFilePath] = useState(null); // Store local file path
  const [loading, setLoading] = useState(true); // Track loading state
  const shimmerTranslateX = new Animated.Value(-200); // For shimmer animation

  const handleTryAgain = () => {
    setLoading(true);
    setImageUrl(null);
    generatePPT();
  };
  const generatePPT = async () => {
    try {
      const response = await axios.post('https://matrix-server-gzqd.vercel.app/generate-ppt', {
        query: message
      });
      
      const { presentationUrl } = response.data;
      
      // Download the PPT file
      const filePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/presentation.pptx`;
      
      await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath
      }).fetch('GET', presentationUrl);
      
      setLocalFilePath(filePath);
      setPptUrl(presentationUrl);
      setLoading(false);
    } catch (error) {
      console.error('Error generating PPT:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePPT();
    Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: 200,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerTranslateX, message]);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="medium" color="#88888874" />
          <Text style={styles.uploadingText}>Creating...</Text>
        </View>
      )}
      <Text style={styles.heading}>
        {loading ? "Generating PPT" : "PPT Generated"}
      </Text>
      <Text style={styles.subtext2}>
  {message.length > 200 ? `${message.substring(0, 200)}...` : message}
</Text>
      {loading && (
        <Text style={styles.subtext}>
          Please don’t turn off your phone or leave this screen while the create
          PPT is starting.
        </Text>
      )}

      <View style={styles.imageContainer}>
        {loading ? (
            <View style={styles.imageSkeleton}>
                         <Animated.View
                                         style={[
                                           styles.shimmer,
                                           { transform: [{ translateX: shimmerTranslateX }] },
                                         ]}
                                       />
                        </View>
                        
        ) : (
          <WebView
            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${pptUrl}` }}
            style={styles.generatedImage}
            startInLoadingState={true}
            renderLoading={() => (
              <ActivityIndicator
                color='black'
                size='large'
                style={styles.flexCenter}
              />
            )}
          />
        )}
      </View>

      {!loading && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.generateButton]}
            onPress={async () => {
              if (localFilePath) {
                ReactNativeBlobUtil.android.actionViewIntent(localFilePath, 'application/vnd.ms-powerpoint');
              }
            }}
          >
            <Text style={styles.generateText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelText}>X</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
  },
  uploadingOverlay: {
    marginBottom: 20,
    flexDirection: "row",
  },
  uploadingText: {
    marginLeft: 13,
    color: "#3333335F",
    fontSize: 18,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  subtext2: {
    fontSize: 16,
    color: "#E66902FF",
    textAlign: "center",
  },
  imageContainer: {
    width: "70%",
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  imageSkeleton: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  generatedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  flexCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  imageSkeleton: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
    borderRadius: 4,
  },
  tryAgainButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  tryAgainText: {
    color: "#000000",
    fontSize: 16,
  },
  shimmer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
    position: "absolute",
  },
  generateButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  generateText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  cancelButton: {
    width: 60,
    height: 60,
    backgroundColor: "#FF5722",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 24,
  },
  cancelText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CreatePPTScreen;
