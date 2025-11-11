import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

export default function AuthLayout() {
  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        console.log('🔒 Auth locked to LANDSCAPE');
      } catch (e) {
        // avoid uncaught errors
        console.warn('Failed to lock auth orientation:', e);
      }
    })();

    return () => {
      (async () => {
        try {
          await ScreenOrientation.unlockAsync();
        } catch (e) {
          console.warn('Failed to unlock auth orientation:', e);
        }
      })();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#0a0e27' },
      }}
    />
  );
}
