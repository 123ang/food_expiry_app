import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { debugSync, SyncDebugResult } from '../utils/syncDebugger';
import { useTheme } from '../context/ThemeContext';

interface SyncDebuggerProps {
  userId: string | null;
  groupId: string | null;
}

const SyncDebugger: React.FC<SyncDebuggerProps> = ({ userId, groupId }) => {
  const [debugResult, setDebugResult] = useState<SyncDebugResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { theme } = useTheme();

  const runDebug = async () => {
    if (!userId || !groupId) {
      console.error('SyncDebugger: Missing userId or groupId');
      return;
    }
    
    setLoading(true);
    try {
      const result = await debugSync(userId, groupId);
      setDebugResult(result);
    } catch (error) {
      console.error('SyncDebugger: Error running debug:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const renderDataSection = (title: string, localData: any[], cloudData: any[]) => {
    const isExpanded = expandedSection === title;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.sectionHeader, { backgroundColor: theme.colors.card }]} 
          onPress={() => toggleSection(title)}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {title} (Local: {localData.length}, Cloud: {cloudData.length})
          </Text>
          <Text style={[styles.expandIcon, { color: theme.colors.text }]}>
            {isExpanded ? '▼' : '►'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.comparisonContainer}>
              <View style={styles.dataColumn}>
                <Text style={[styles.columnHeader, { color: theme.colors.text }]}>Local ({localData.length})</Text>
                <ScrollView style={styles.dataScroll} nestedScrollEnabled={true}>
                  <Text style={[styles.dataText, { color: theme.colors.text }]}>
                    {JSON.stringify(localData, null, 2)}
                  </Text>
                </ScrollView>
              </View>
              
              <View style={styles.dataColumn}>
                <Text style={[styles.columnHeader, { color: theme.colors.text }]}>Cloud ({cloudData.length})</Text>
                <ScrollView style={styles.dataScroll} nestedScrollEnabled={true}>
                  <Text style={[styles.dataText, { color: theme.colors.text }]}>
                    {JSON.stringify(cloudData, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Sync Debugger</Text>
      
      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: theme.colors.text }]}>
          User ID: {userId || 'Not logged in'}
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.text }]}>
          Group ID: {groupId || 'No group selected'}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.debugButton, { backgroundColor: theme.colors.primary }]} 
        onPress={runDebug}
        disabled={loading || !userId || !groupId}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.debugButtonText}>Run Sync Debug</Text>
        )}
      </TouchableOpacity>
      
      {debugResult && !loading && (
        <ScrollView style={styles.resultsContainer}>
          {renderDataSection('Categories', debugResult.local.categories, debugResult.cloud.categories)}
          {renderDataSection('Locations', debugResult.local.locations, debugResult.cloud.locations)}
          {renderDataSection('Food Items', debugResult.local.food_items, debugResult.cloud.food_items)}
          {renderDataSection('Shopping Items', debugResult.local.shopping_items, debugResult.cloud.shopping_items)}
          {renderDataSection('Wish Lists', debugResult.local.wish_lists, debugResult.cloud.wish_lists)}
          {renderDataSection('Groups', debugResult.local.groups, debugResult.cloud.groups)}
          {renderDataSection('Group Members', debugResult.local.group_members, debugResult.cloud.group_members)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  debugButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  debugButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: 16,
  },
  sectionContent: {
    padding: 12,
  },
  comparisonContainer: {
    flexDirection: 'row',
  },
  dataColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  columnHeader: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dataScroll: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default SyncDebugger;