import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { useApi } from '../../context/ApiContext'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const { isAuthenticated, loading: authLoading, signIn } = useApi()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated]);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    setLoading(true)
    
    try {
      // Use signIn from ApiContext to properly set user state
      await signIn(email.trim().toLowerCase(), password)
      // Login successful, navigate to main app
      router.replace('/')
    } catch (error) {
      console.error('LoginScreen: Login error:', error)
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const goToSignUp = () => {
    router.push('/auth/signup' as any)
  }

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.backgroundColor, justifyContent: 'center', alignItems: 'center' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: 20 }]}>
          Loading...
        </Text>
      </KeyboardAvoidingView>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/food_expiry_logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to sync your food items across devices
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textColor }]}>
                Email
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.cardBackground,
                  color: theme.textColor,
                  borderColor: theme.borderColor
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textColor }]}>
                Password
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.cardBackground,
                  color: theme.textColor,
                  borderColor: theme.borderColor
                }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <TouchableOpacity style={styles.linkButton} onPress={goToSignUp}>
              <Text style={[styles.linkText, { color: theme.primaryColor }]}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
}) 