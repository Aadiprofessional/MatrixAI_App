import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Shadow } from 'react-native-shadow-2';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import HomeScreen from './HomeScreen';
import AIShopScreen from './AiShopScreen';
import ProfileScreen from './ProfileScreen';
import * as Animatable from 'react-native-animatable';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => (
  <Shadow distance={10} startColor={'#00000010'} offset={[0, 5]} style={styles.shadowWrapper}>
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const AnimatedTouchable = Animatable.createAnimatableComponent(TouchableOpacity);

        // Define images for icons
        const icons = {
          Home: isFocused ? require('../assets/home-filled.png') : require('../assets/home.png'),
          'AI Shop': isFocused ? require('../assets/shop-filled.png') : require('../assets/shop.png'),
          Profile: isFocused ? require('../assets/profile-filled.png') : require('../assets/profile.png'),
        };

        return (
          <AnimatedTouchable
            key={route.name}
            onPress={onPress}
            style={styles.tabBarItem}
            animation={isFocused ? 'pulse' : undefined}
            duration={500}
          >
            <Image source={icons[route.name]} style={{ width: 24, height: 24 }} resizeMode="contain" />
            <Text style={{ color: isFocused ? '#007BFF' : 'gray', fontSize: 12 }}>{label}</Text>
          </AnimatedTouchable>
        );
      })}
    </View>
  </Shadow>
);

const AppNavigator = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="AI Shop" component={AIShopScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default AppNavigator;

const styles = StyleSheet.create({
  shadowWrapper: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    borderRadius: 35,
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    height: 70,
    elevation: 10,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
