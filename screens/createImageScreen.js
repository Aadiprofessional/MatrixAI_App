import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Animated,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get("window");

const CreateImagesScreen = ({ route, navigation }) => {
  const { message } = route.params; // Extract text from params
  const [imageUrls, setImageUrls] = useState([]); // Store the array of image URLs
  const [loading, setLoading] = useState(true); // Track loading state
  const [selectedImage, setSelectedImage] = useState(null); // Track selected image
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const shimmerTranslateX = new Animated.Value(-200); // For shimmer animation

  useEffect(() => {
    const fetchAndStoreImages = async () => {
      try {
        const storedUrls = await AsyncStorage.getItem("downloadedImageUrls");
        if (storedUrls) {
          setImageUrls(JSON.parse(storedUrls));
          setLoading(false);
        } else {
          const response = await axios.post(
            "https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/generateImage2",
            { text: message, uid: "some-unique-id" },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY`,
              },
            }
          );
          console.log(response);

          if (response.data.images && response.data.images.length > 0) {
            const urls = response.data.images;
            await AsyncStorage.setItem("downloadedImageUrls", JSON.stringify(urls));
            setImageUrls(urls);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    if (message) fetchAndStoreImages();

    return () => {
      AsyncStorage.removeItem("downloadedImageUrls");
    };
  }, [message]);

  // Start shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: 200,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerTranslateX]);

  const handleSelectImage = (url) => {
    setSelectedImage(url);
    setModalVisible(false);
  };

  const handleTryAgain = () => {
    setSelectedImage(null);
    setLoading(true);
    setImageUrls([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="medium" color="#88888874" />
          <Text style={styles.uploadingText}>Creating...</Text>
        </View>
      )}
      {loading ? (
        <Text style={styles.heading}>Generating Images</Text>
      ) : (
        <Text style={styles.heading}>Images Generated</Text>
      )}
      <Text style={styles.subtext2}>{message}</Text>
      {loading && (
        <Text style={styles.subtext}>
          Please don’t turn off your phone or leave this screen while the create images is starting.
        </Text>
      )}

      <View style={styles.gridContainer}>
        {Array.from({ length: 4 }).map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.box,
              selectedImage === imageUrls[index] ? styles.selectedBox : null,
            ]}
            onPress={() => setModalVisible(true)}
            disabled={loading}
          >
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
                source={{ uri: imageUrls[index] }}
                style={styles.image}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedImage && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={[styles.generateButton]}
  onPress={() => Linking.openURL(selectedImage)}
>
  <Text style={styles.generateText}>OK</Text>
</TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => handleSelectImage(selectedImage)}
            >
              <Text style={styles.generateText}>Select This Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  tryAgainText: {
    color: '#000000',
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  generateText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  uploadingOverlay: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  uploadingText: {
    marginLeft: 13,
    color: '#3333335F',
    fontSize: 18,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  imageSkeleton: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
    borderRadius: 4,
  },
  shimmer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
    position: "absolute",
  },
  selectedBox: {
    borderColor: "#025BD7FF",
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
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  box: {
    width: width * 0.4,
    height: width * 0.4,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    backgroundColor: "#f8f8f8",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  buttonsContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FF5722",
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "80%",
    height: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "80%",
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalCloseButton: {
    backgroundColor: "#FF5722",
    padding: 10,
    borderRadius: 5,
  },
  modalCloseButtonText: {
    color: "#fff",
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

export default CreateImagesScreen;
