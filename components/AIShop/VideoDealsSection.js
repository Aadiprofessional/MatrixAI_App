import React from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import VideoCard from './VideoCard';

const VideoDealsSection = ({ bestVideoDeals, videoLoading, videoError, navigation }) => {
  console.log('VideoData',bestVideoDeals );
  
  return (
    <View>
      {videoLoading ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : videoError ? (
        <Text style={styles.errorText}>No Data Found</Text>
      ) : (
        <FlatList
          data={bestVideoDeals}
          keyExtractor={(item) => item.videoproductid}
          renderItem={({ item }) => (
            <VideoCard 
              title={item.name} 
              price={`$${item.price}`} 
              image={item.thumbnail_url} 
              navigation={navigation}
              videoproductid={item.videoproductid} 
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = {
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
  },
};

export default VideoDealsSection;
