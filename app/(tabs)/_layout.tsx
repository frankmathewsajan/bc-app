import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, useWindowDimensions, View } from 'react-native';


import ModelScene from '@/components/3d/ModelScene';

export default function TabLayout() {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        console.log('🔒 Tabs locked to LANDSCAPE');
      } catch (err) {
        console.warn('Orientation lock failed:', err);
      }
    })();

    // Don't unlock on unmount - keep it landscape throughout the app
    return () => {
      // Keep landscape orientation
    };
  }, []);

  // Background image - bg.jpg for landscape mode
  const bgSource = require('../../assets/images/bg.jpg');

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={bgSource} 
        style={[styles.bg, { width, height }]} 
        resizeMode="cover"
        imageStyle={styles.bgImage}>
        {/* ModelScene renders transparent GLView on top of background */}
        <ModelScene />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bg: { 
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
});
