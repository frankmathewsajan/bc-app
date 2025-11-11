import BackgroundScene from '@/components/3d/BackgroundScene';
import AuthButton from '@/components/auth/AuthButton';
import AuthInput from '@/components/auth/AuthInput';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Additional info
  const { control, handleSubmit, watch, trigger } = useForm({ 
    defaultValues: { 
      fullName: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      class: '',
      contactNumber: '',
      organization: ''
    } 
  });
  const password = watch('password');

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const goToStep2 = async () => {
    // Validate step 1 fields
    const isValid = await trigger(['fullName', 'email', 'password', 'confirmPassword']);
    if (isValid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            class: data.class,
            contact_number: data.contactNumber,
            organization: data.organization,
          },
          emailRedirectTo: 'beingcosmic://login-success',
        }
      });

      if (error) {
        Alert.alert('Signup Failed', error.message);
        setLoading(false);
        return;
      }

      console.log('✅ Signup successful!', authData);
      Alert.alert(
        'Success!',
        'Account created successfully. Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BackgroundScene />
      <LinearGradient colors={['rgba(10,14,39,0.5)', 'rgba(10,14,39,0.85)']} style={styles.overlay} />
      
      {/* Landscape layout - Split screen */}
      <Animated.View style={[styles.landscapeContainer, { opacity: fadeAnim }]}>
        
        {/* Left side - Compact single-column form */}
        <View style={styles.leftSection}>
          <View style={styles.compactCard}>
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
              <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
            </View>

            {step === 1 ? (
              <>
                {/* Step 1: Basic Information */}
                <Text style={styles.stepTitle}>Basic Information</Text>
                
                <Controller
                  control={control}
                  rules={{ required: true, minLength: 2 }}
                  render={({ field: { onChange, value } }) => (
                    <AuthInput icon="person-outline" placeholder="Full Name" value={value} onChangeText={onChange} />
                  )}
                  name="fullName"
                />

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

                <Controller
                  control={control}
                  rules={{ required: true, validate: (value) => value === password || 'Passwords do not match' }}
                  render={({ field: { onChange, value } }) => (
                    <AuthInput icon="lock-closed-outline" placeholder="Confirm Password" value={value} onChangeText={onChange} isPassword />
                  )}
                  name="confirmPassword"
                />

                <View style={styles.buttonContainer}>
                  <View style={{ width: '100%' }}>
                    <AuthButton title="Next Step" onPress={goToStep2} loading={false} />
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Step 2: Additional Information */}
                <Text style={styles.stepTitle}>Additional Details</Text>
                
                <Controller
                  control={control}
                  rules={{ required: true, pattern: /^[0-9]{10}$/ }}
                  render={({ field: { onChange, value } }) => (
                    <AuthInput 
                      icon="call-outline" 
                      placeholder="Contact Number (10 digits)" 
                      value={value} 
                      onChangeText={onChange} 
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  )}
                  name="contactNumber"
                />

                <Controller
                  control={control}
                  rules={{ required: true, minLength: 1 }}
                  render={({ field: { onChange, value } }) => (
                    <AuthInput icon="school-outline" placeholder="Class (e.g., 10th Grade)" value={value} onChangeText={onChange} />
                  )}
                  name="class"
                />

                <Controller
                  control={control}
                  rules={{ required: true, minLength: 2 }}
                  render={({ field: { onChange, value } }) => (
                    <AuthInput icon="business-outline" placeholder="Organization/School" value={value} onChangeText={onChange} />
                  )}
                  name="organization"
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <AuthButton title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} />
                  </View>
                </View>
              </>
            )}

            <View style={styles.bottomLinks}>
              <Text style={styles.termsText}>By signing up, you agree to Terms</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginTextBold}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right side - Branding */}
        <View style={styles.rightSection}>
          <View style={styles.brandingContainer}>
            <Text style={styles.title}>BeingCosmic</Text>
            <Text style={styles.subtitle}>🚀 Start Your Learning Journey</Text>
            <Text style={styles.welcomeText}>Create Account</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  
  // Landscape split-screen layout
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
  
  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: '#8b5cf6',
    width: 24,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  
  // Buttons
  buttonContainer: {
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  backButton: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  termsText: { 
    fontSize: 10, 
    color: 'rgba(255,255,255,0.5)',
  },
  loginTextBold: { 
    color: '#8b5cf6', 
    fontWeight: '700',
    fontSize: 11,
  },
});
