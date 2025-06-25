import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { forceImageRecovery } from '../utils/fileStorage';
import { runImageSystemDiagnostics } from '../utils/imageSystemDiagnostics';
import { useTheme } from '../context/ThemeContext';

export default function ImageRecoveryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [recoveryResults, setRecoveryResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const results = await runImageSystemDiagnostics();
      setDiagnosticResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to run diagnostics: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const runRecovery = async () => {
    setIsLoading(true);
    try {
      const results = await forceImageRecovery();
      setRecoveryResults(results);
      
      if (results.success) {
        Alert.alert(
          'Recovery Complete', 
          `Successfully recovered ${results.recoveredImages} images. Please restart the app for changes to take effect.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Recovery Issues', 
          `Recovery completed with some issues: ${results.errors.join(', ')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to run recovery: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Stack.Screen options={{ 
        title: 'Image Recovery',
        headerStyle: { backgroundColor: theme.headerBackground },
        headerTintColor: theme.textColor,
      }} />

      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          Image Recovery Tool
        </Text>
        
        <Text style={[styles.description, { color: theme.textColor }]}>
          If your food item or category images disappeared after an iOS update, 
          this tool can help recover them.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={runDiagnostics}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Run Diagnostics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.tertiaryColor }]}
            onPress={runRecovery}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Recover Images</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
            <Text style={[styles.loadingText, { color: theme.textColor }]}>
              Please wait...
            </Text>
          </View>
        )}

        {diagnosticResults && (
          <View style={[styles.resultContainer, { borderColor: theme.borderColor }]}>
            <Text style={[styles.resultTitle, { color: theme.textColor }]}>Diagnostic Results</Text>
            
            <Text style={[styles.resultLabel, { color: theme.textColor }]}>Status:</Text>
            <Text style={[
              styles.resultValue, 
              { 
                color: 
                  diagnosticResults.overallHealth === 'healthy' ? 'green' : 
                  diagnosticResults.overallHealth === 'warning' ? 'orange' : 'red' 
              }
            ]}>
              {diagnosticResults.overallHealth.toUpperCase()}
            </Text>
            
            <Text style={[styles.resultLabel, { color: theme.textColor }]}>Total Images:</Text>
            <Text style={[styles.resultValue, { color: theme.textColor }]}>
              {diagnosticResults.stats.totalImages}
            </Text>
            
            <Text style={[styles.resultLabel, { color: theme.textColor }]}>Working Images:</Text>
            <Text style={[styles.resultValue, { color: theme.textColor }]}>
              {diagnosticResults.stats.workingImages}
            </Text>
            
            <Text style={[styles.resultLabel, { color: theme.textColor }]}>Broken Images:</Text>
            <Text style={[
              styles.resultValue, 
              { color: diagnosticResults.stats.brokenImages > 0 ? 'red' : 'green' }
            ]}>
              {diagnosticResults.stats.brokenImages}
            </Text>
            
            {diagnosticResults.issues.length > 0 && (
              <>
                <Text style={[styles.resultLabel, { color: theme.textColor }]}>Issues:</Text>
                {diagnosticResults.issues.map((issue: string, index: number) => (
                  <Text key={index} style={[styles.issue, { color: 'red' }]}>
                    • {issue}
                  </Text>
                ))}
              </>
            )}
            
            {diagnosticResults.recommendations.length > 0 && (
              <>
                <Text style={[styles.resultLabel, { color: theme.textColor }]}>Recommendations:</Text>
                {diagnosticResults.recommendations.map((rec: string, index: number) => (
                  <Text key={index} style={[styles.recommendation, { color: theme.textColor }]}>
                    • {rec}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {recoveryResults && (
          <View style={[styles.resultContainer, { borderColor: theme.borderColor }]}>
            <Text style={[styles.resultTitle, { color: theme.textColor }]}>Recovery Results</Text>
            
            <Text style={[styles.resultLabel, { color: theme.textColor }]}>Status:</Text>
            <Text style={[
              styles.resultValue, 
              { color: recoveryResults.success ? 'green' : 'red' }
            ]}>
              {recoveryResults.success ? 'SUCCESS' : 'FAILED'}
            </Text>
            
            <Text style={[styles.resultLabel, { color: theme.textColor }]}>Images Recovered:</Text>
            <Text style={[styles.resultValue, { color: theme.textColor }]}>
              {recoveryResults.recoveredImages}
            </Text>
            
            {recoveryResults.errors.length > 0 && (
              <>
                <Text style={[styles.resultLabel, { color: theme.textColor }]}>Errors:</Text>
                {recoveryResults.errors.map((error: string, index: number) => (
                  <Text key={index} style={[styles.issue, { color: 'red' }]}>
                    • {error}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  resultContainer: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resultValue: {
    fontSize: 16,
    marginBottom: 4,
  },
  issue: {
    fontSize: 14,
    marginLeft: 8,
    marginTop: 4,
  },
  recommendation: {
    fontSize: 14,
    marginLeft: 8,
    marginTop: 4,
  },
}); 