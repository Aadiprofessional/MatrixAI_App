// PopularCategory.js
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity  } from 'react-native';
import MusicCard from './MusicCard'; // Assuming you have a Card component
import Banner from './AIShop/Banner';
const popularData = [
  { id: '1', title: 'AI Family by xyz', price: '$2', image: require('../../assets/AIShopImage1.png'), owner: 'xyz' },
  { id: '2', title: 'AI Planet by xyz', price: '$4', image: require('../../assets/AIShopImage1.png'), owner: 'xyz' },
  { id: '3', title: 'Woman by abc', price: '$3.6',  owner: 'abc' },
];

const MusicCategory = () => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
<Banner />
<View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />


<View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <Banner />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      /><View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Latest Release</Text>
      <TouchableOpacity>
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    </View>
  <FlatList
    data={popularData}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
    horizontal
    showsHorizontalScrollIndicator={false}
  />
  <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <Banner />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      /><View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Latest Release</Text>
      <TouchableOpacity>
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    </View>
  <FlatList
    data={popularData}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
    horizontal
    showsHorizontalScrollIndicator={false}
  />
  <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <Banner />
      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Release</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={popularData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MusicCard title={item.title} price={item.price} image={item.image} owner={item.owner} />}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: 'orange',
    fontSize: 14,
  },
  cardList: {
    paddingLeft: 10,
  },
});

export default MusicCategory;

// Similar components can be created for MusicCategory, DocumentCategory, VideoCategory, ImageCategory
