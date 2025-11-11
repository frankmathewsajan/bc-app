import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onPress: () => void;
  loading?: boolean;
}

export default function GoogleButton({ onPress, loading }: Props) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={loading}
      style={styles.button}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons name="logo-google" size={16} color="#4285F4" />
        <Text style={styles.text}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '600',
  },
});
