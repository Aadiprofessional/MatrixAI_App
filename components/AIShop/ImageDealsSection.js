import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import Card from './Card';

const ImageDealsSection = ({ bestDeals, loading, navigation,imageError }) => {
  return (
    <View>
      {loading ? (
       <ActivityIndicator size="small" color="#0000ff" />
             ) : imageError ? (
               <Text style={styles.errorText}>No Data Found</Text>
             ) : (
        <FlatList
          data={bestDeals}
          keyExtractor={(item) => item.imageproductid}
          renderItem={({ item }) => (
          <Card
            key={item.id}
            title={item.name}
            price={`$${item.price}`}
            image={{ uri: item.image_url }}
            imageproductid={item.imageproductid}
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

export default ImageDealsSection;
