import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Linking } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get("window");

const CreateImagesScreen2 = ({ route, navigation }) => {
  const { message } = route.params; // Extract text from params
  const [imageUrl, setImageUrl] = useState(null); // Store the downloaded image URL
  const [loading, setLoading] = useState(true); // Track loading state
  const shimmerTranslateX = new Animated.Value(-200); // For shimmer animation
  useEffect(() => {
    const fetchAndStoreImage = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem("downloadedImageUrl");
        if (storedUrl) {
          setImageUrl(storedUrl);
          setLoading(false);
        } else {
          const response = await axios.post(
            "https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/generateImage",
            { text: message, uid: "some-unique-id" },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY`,
              },
            }
          );

          if (response.data.images && response.data.images.length > 0) {
            const url = response.data.images[0];
            await AsyncStorage.setItem("downloadedImageUrl", url);
            setImageUrl(url);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    };

    if (message) fetchAndStoreImage();

    return () => {
      AsyncStorage.removeItem("downloadedImageUrl");
    };
  }, [message]);

  const handleTryAgain = () => {
    setLoading(true);
    setImageUrl(null);
  };
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: 200,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerTranslateX]);

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="medium" color="#88888874" />
          <Text style={styles.uploadingText}>Creating...</Text>
        </View>
      )}
      <Text style={styles.heading}>
        {loading ? "Generating Images" : "Image Generated"}
      </Text>
      <Text style={styles.subtext2}>{message}</Text>
      {loading && (
        <Text style={styles.subtext}>
          Please don’t turn off your phone or leave this screen while the create
          images is starting.
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
          <Image
            source={{ uri: imageUrl }}
            style={styles.generatedImage}
            resizeMode="contain"
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
  onPress={() => Linking.openURL(imageUrl)}
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

export default CreateImagesScreen2;
