import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // For now, just do a simple validation
    if (email.trim() && password.trim()) {
      // Navigate to main screen
      router.replace('/');
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      padding: 20,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 40,
      backgroundColor: theme.cardBackground,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 40,
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
      marginBottom: 20,
    },
    input: {
      backgroundColor: theme.cardBackground,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    loginButton: {
      backgroundColor: theme.primaryColor,
      padding: 15,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center',
      marginTop: 20,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    forgotPassword: {
      marginTop: 15,
    },
    forgotPasswordText: {
      color: theme.primaryColor,
      textAlign: 'center',
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logo}>
          <Image 
            source={require('../assets/food_expiry_logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Expiry Alert</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
} 