import BackgroundScene from '@/components/3d/BackgroundScene';
import AuthButton from '@/components/auth/AuthButton';
import AuthInput from '@/components/auth/AuthInput';
import GoogleButton from '@/components/auth/GoogleButton';
import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { control, handleSubmit } = useForm({ defaultValues: { email: '', password: '' } });

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
        setLoading(false);
        return;
      }

      console.log('✅ Login successful!');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'beingcosmic',
        path: 'login-success',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        Alert.alert('Google Sign In Failed', error.message);
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          console.log('✅ Google sign in successful!');
          router.replace('/(tabs)');
        }
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred with Google sign in');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BackgroundScene />
      <LinearGradient colors={['rgba(10,14,39,0.5)', 'rgba(10,14,39,0.85)']} style={styles.overlay} />
      
      {/* Landscape layout - Split screen design like Supercell */}
      <Animated.View style={[styles.landscapeContainer, { opacity: fadeAnim }]}>
        
        {/* Left side - Compact form */}
        <View style={styles.leftSection}>
          <View style={styles.compactCard}>
            <Controller
              control={control}
              rules={{ required: true, pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i }}
              render={({ field: { onChange, value } }) => (
                <AuthInput icon="mail-outline" placeholder="Email" value={value} onChangeText={onChange} keyboardType="email-address" />
              )}
              name="email"
            />

            <Controller
              control={control}
              rules={{ required: true, minLength: 6 }}
              render={({ field: { onChange, value } }) => (
                <AuthInput icon="lock-closed-outline" placeholder="Password" value={value} onChangeText={onChange} isPassword />
              )}
              name="password"
            />

            <View style={styles.actionRow}>
              <View style={{ width: '100%' }}>
                <AuthButton title="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} />
              </View>
              <View style={{ width: '100%' }}>
                <GoogleButton onPress={handleGoogleSignIn} loading={googleLoading} />
              </View>
            </View>

            <View style={styles.bottomLinks}>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.signupTextBold}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right side - Branding */}
        <View style={styles.rightSection}>
          <View style={styles.brandingContainer}>
            <Text style={styles.title}>BeingCosmic</Text>
            <Text style={styles.subtitle}>✨ Journey Through Knowledge</Text>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  
  // Landscape split-screen layout (Supercell style)
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 2,
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  
  // Left side - Compact form (60%)
  leftSection: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 30,
  },
  
  // Right side - Branding (30%)
  rightSection: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  brandingContainer: {
    gap: 8,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    textShadowColor: 'rgba(99,102,241,0.6)', 
    textShadowOffset: { width: 0, height: 2 }, 
    textShadowRadius: 10,
    letterSpacing: 0.3,
  },
  subtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  welcomeText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginTop: 12,
  },
  compactCard: { 
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 16, 
    padding: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1.5, 
    borderColor: 'rgba(139,92,246,0.3)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  
  // Action buttons row
  actionRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  // Bottom links
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  forgotPasswordText: { 
    color: '#6366f1', 
    fontSize: 11,
    fontWeight: '500',
  },
  signupTextBold: { 
    color: '#8b5cf6', 
    fontWeight: '700',
    fontSize: 11,
  },
});
