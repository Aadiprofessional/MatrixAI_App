import React from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import VideoCard from './VideoCard';

const VideoDealsSection = ({ bestVideoDeals, videoLoading, videoError, navigation }) => {

  
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
          ListEmptyComponent={<Text>No Data Found</Text>}
          renderItem={({ item }) => (
            <VideoCard 
              title={item.name} 
              price={`$${item.price}`} 
              image={item.thumbnail_url} 
              navigation={navigation}
              videoproductid={item.videoproductid}
              videoUrl={item.video_url}
              new_label={item.new_label}
              wishlist={item.wishlist}
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
