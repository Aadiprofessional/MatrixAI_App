import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Video from "react-native-video"; // Add the video player component
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get("window");

const CreateVideoScreen = ({ route, navigation }) => {
  const { message, UID, prompt, videoDuration, videoRatio, ImageUrl } = route.params; // Extract params
  const [loading, setLoading] = useState(true); // Track loading state
  const [videoUrl, setVideoUrl] = useState(null); // Store video URL
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [videoId, setVideoId] = useState(null); // Store videoId
  const shimmerTranslateX = new Animated.Value(-200); // For shimmer animation

  // Function to fetch the video URL using getVideo API
// Function to fetch the video URL using getVideo API
const fetchVideoUrl = async (videoId, retries = 0) => {
    try {
      const response = await axios.get(
        `https://matrix-server.vercel.app/getVideo?uid=${UID}&videoId=${videoId}`,
        {
          headers: {
            Authorization:
              "Bearer key_242fcce49b88066f61c71689b4ba1fe484efbb952195d27d2821a6f4969d959be338ad6f93904e7e845916b16698768e993b71bd4d80877fe70991ffbe36a324",
          },
        }
      );
  
      if (response.data.videoUrl) {
        setVideoUrl(response.data.videoUrl); // Set video URL if available
        setLoading(false);
      } else {
        console.error("No video URL found in the response.");
        // Retry fetching the video URL after 30 seconds, if the video URL is still not found
        if (retries < 30) {
          setTimeout(() => fetchVideoUrl(videoId, retries + 1), 10000); // Retry after 30 seconds
        } else {
          setLoading(false); // Stop loading after 10 retries
          console.log("Failed to fetch video after multiple attempts.");
        }
      }
    } catch (error) {
      console.error("Error fetching video URL:", error);
      // Retry fetching the video URL after 30 seconds even if there's an error
      if (retries < 30) {
        setTimeout(() => fetchVideoUrl(videoId, retries + 1), 10000); // Retry after 30 seconds
      } else {
        setLoading(false); // Stop loading after 10 retries
        console.log("Failed to fetch video after multiple attempts.");
      }
    }
  };
  
  // Function to generate the video using createVideo API
  const generateVideo = async () => {
    try {
      const response = await axios.post(
        "https://matrix-server.vercel.app/createVideo",
        {
          uid: UID,
          imageUrl: ImageUrl,
          promptText: prompt,
          ratio: videoRatio,
          duration: videoDuration,
          videoStyle: "realistic", // Adjust based on your requirements
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer key_242fcce49b88066f61c71689b4ba1fe484efbb952195d27d2821a6f4969d959be338ad6f93904e7e845916b16698768e993b71bd4d80877fe70991ffbe36a324",
          },
        }
      );
      if (response.data.videoId) {
        setLoading(true); // Set loading while the video is being generated
        setVideoId(response.data.videoId); // Set videoId received from createVideo response
        console.log("Video ID:", response.data.videoId); // Log the videoId
        // Start fetching the video URL with the new videoId
        fetchVideoUrl(response.data.videoId);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      setLoading(false); // Stop loading in case of an error
    }
  };

  // Effect hook to generate video when the component mounts
  useEffect(() => {
    generateVideo();
  }, []); // Empty dependency array to only run once on mount

  // Start shimmer animation for loading state
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: 200,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerTranslateX]);

  const handleSelectVideo = () => {
    setModalVisible(false);
  };

  const handleTryAgain = () => {
    setLoading(true);
    setVideoUrl(null);
    generateVideo(); // Retry video generation
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="medium" color="#88888874" />
          <Text style={styles.uploadingText}>Generating Video...</Text>
        </View>
      )}
      {loading ? (
        <Text style={styles.heading}>Generating Video</Text>
      ) : (
        <Text style={styles.heading}>Video Ready</Text>
      )}
      <Text style={styles.subtext2}>{message}</Text>

      {loading && (
        <Text style={styles.subtext}>
          Please don't turn off your phone or leave this screen while the video is generating.
        </Text>
      )}

      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={styles.box}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.videoSkeleton}>
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslateX }] },
                ]}
              />
            </View>
          ) : (
            videoUrl && (
              <Video
                source={{ uri: videoUrl }}
                style={styles.video}
                resizeMode="contain"
                controls={true} // Display controls (play, pause, etc.)
              />
            )
          )}
          
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {videoUrl && (
              <Video
                source={{ uri: videoUrl }}
                style={styles.modalVideo}
                resizeMode="contain"
                controls={true}
              />
            )}
            <TouchableOpacity style={styles.generateButton} onPress={handleSelectVideo}>
              <Text style={styles.generateText}>Select This Video</Text>
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
  gridContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  box: {
    width: width * 0.8, // Adjusted for one item in the grid
    height: width * 0.5, // Adjusted for better video display
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    backgroundColor: "#f8f8f8",
  },
  videoSkeleton: {
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
  video: {
    width: "100%",
    height: "100%",
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
  modalVideo: {
    width: "100%",
    height: "80%",
    marginBottom: 16,
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

export default CreateVideoScreen;
