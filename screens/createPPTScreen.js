import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Linking,
} from "react-native";
import ReactNativeBlobUtil from 'react-native-blob-util';
import PDFView from 'react-native-pdf';
import PPTViewer from "../components/PPTViewer";
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get("window");

const CreatePPTScreen = ({ route, navigation }) => {
  const { message, number } = route.params; // Extract text from params
  const [pptUrl, setPptUrl] = useState(null); // Store the downloaded PPT URL
  const [loading, setLoading] = useState(true); // Track loading state
  const shimmerTranslateX = new Animated.Value(-200); // For shimmer animation
  const [presentationUrl, setPresentation] = useState('');

  const handleTryAgain = () => {
    setLoading(true);
    setPptUrl(null); // Clear previous PPT URL
    generatePPT(); // Re-trigger PPT generation
  };

  const generatePPT = async () => {
    try {
      console.log("Starting PPT generation...");
      setLoading(true);

      if (!number) {
        throw new Error("Number parameter is missing");
      }

      console.log("Making API request...");
      const response = await axios.post(
        "https://matrixai.deno.dev",
        {
          query: message,
          number: number,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API response received:", response);

      const { presentationUrl } = response.data;

      if (!presentationUrl) {
        throw new Error("No PPT URL received");
      }

      console.log("Generated PPT URL:", presentationUrl); // For debugging

      // Download the PPT file and set the local file path for PDFView
      const localFilePath = await ReactNativeBlobUtil.config({
        fileCache: true,
      }).fetch('GET', presentationUrl);

      setPptUrl(localFilePath.path()); // Set the local file path for rendering
      setPresentation (presentationUrl)
      setLoading(false);
    } catch (error) {
      console.error("Error generating PPT:", error);

      setLoading(false);
    }
  };

  useEffect(() => {
    generatePPT(); // Run once when the component is mounted
    Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: 200,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []); // Empty dependency array ensures this runs only once

  return (
    <SafeAreaView style={styles.container}>
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
          <PPTViewer pptUrl={presentationUrl} />
        )}
      </View>

      {!loading && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.generateButton]}
            onPress={() => {
              if (presentationUrl) {
                Linking.openURL(presentationUrl); // Open PPT in browser or another app
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
    </SafeAreaView>
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
  buttonsContainer: {
    flexDirection: "row",
    marginTop: 20,
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
