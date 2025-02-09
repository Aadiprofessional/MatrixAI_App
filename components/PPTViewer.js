import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const PPTViewer = ({ pptUrl }) => {
  // Use Google Docs Viewer to render the PPT
  const googleDocsViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pptUrl)}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: googleDocsViewerUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '130%',
    height: 300, // Fixed height, adjust as needed
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

export default PPTViewer;