import React, { useState } from 'react'
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
  ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { useSupabase } from '../../context/SupabaseContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const { signUp } = useSupabase()

  // Test function to verify Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...')
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Supabase connection test failed:', error)
        Alert.alert('Connection Test Failed', error.message)
      } else {
        console.log('Supabase connection test successful')
        Alert.alert('Connection Test', 'Supabase connection is working!')
      }
    } catch (error) {
      console.error('Supabase connection test error:', error)
      Alert.alert('Connection Test Error', 'Failed to test Supabase connection')
    }
  }

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      console.log('Starting signup process...')
      console.log('Email:', email.trim().toLowerCase())
      console.log('Full name:', fullName.trim())
      
      // Use the context's signUp function instead of direct supabase call
      await signUp(email.trim().toLowerCase(), password, {
        full_name: fullName.trim(),
      })

      console.log('Signup successful')
      Alert.alert(
        'Success!', 
        'Your account has been created successfully. You can now sign in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login' as any)
          }
        ]
      )
    } catch (error: any) {
      console.error('Signup error:', error)
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        stack: error?.stack
      })
      
      // Provide more specific error messages
      let errorMessage = 'An unexpected error occurred during signup'
      
      if (error?.message) {
        if (error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please try signing in instead.'
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.'
        } else if (error.message.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      Alert.alert('Sign Up Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }



  const goToLogin = () => {
    router.replace('/auth/login' as any)
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textColor }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join to sync your food items and share with family
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textColor }]}>
                Full Name
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.cardBackground,
                  color: theme.textColor,
                  borderColor: theme.borderColor
                }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

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
                placeholder="Create a password (min 6 characters)"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textColor }]}>
                Confirm Password
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.cardBackground,
                  color: theme.textColor,
                  borderColor: theme.borderColor
                }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity style={styles.linkButton} onPress={goToLogin}>
              <Text style={[styles.linkText, { color: theme.primaryColor }]}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>

            {/* Debug Button - Remove this in production */}
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: theme.cardBackground }]} 
              onPress={testSupabaseConnection}
            >
              <Text style={[styles.debugButtonText, { color: theme.textColor }]}>
                Test Connection
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
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
  debugButton: {
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugButtonText: {
    fontSize: 12,
    fontStyle: 'italic',
  },

}) 