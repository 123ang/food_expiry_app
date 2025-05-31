import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      padding: 2,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    button: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 18,
      minWidth: 40,
      alignItems: 'center',
    },
    activeButton: {
      backgroundColor: theme.primaryColor,
    },
    inactiveButton: {
      backgroundColor: 'transparent',
    },
    activeText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 12,
    },
    inactiveText: {
      color: theme.textSecondary,
      fontWeight: '500',
      fontSize: 12,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, language === 'en' ? styles.activeButton : styles.inactiveButton]}
        onPress={() => setLanguage('en')}
      >
        <Text style={language === 'en' ? styles.activeText : styles.inactiveText}>
          EN
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, language === 'zh' ? styles.activeButton : styles.inactiveButton]}
        onPress={() => setLanguage('zh')}
      >
        <Text style={language === 'zh' ? styles.activeText : styles.inactiveText}>
          中
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, language === 'ja' ? styles.activeButton : styles.inactiveButton]}
        onPress={() => setLanguage('ja')}
      >
        <Text style={language === 'ja' ? styles.activeText : styles.inactiveText}>
          日
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 