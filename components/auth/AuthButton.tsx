import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

export default function AuthButton({ title, onPress, loading }: Props) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={loading} activeOpacity={0.9}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
});
