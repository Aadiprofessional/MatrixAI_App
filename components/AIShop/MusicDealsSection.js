import React from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import MusicCard from './MusicCard';

const MusicDealsSection = ({ bestMusicDeals, musicLoading, musicError, navigation }) => {
  return (
    <View>
      {musicLoading ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : musicError ? (
        <Text style={styles.errorText}>No Data Found</Text>
      ) : (
        <FlatList
          data={bestMusicDeals}
          keyExtractor={(item) => item.musicproductid}
          renderItem={({ item }) => (
            <MusicCard 
              title={item.name} 
              price={`$${item.price}`} 
              audioUrl={item.audio_url} 
              navigation={navigation} 
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

export default MusicDealsSection;
