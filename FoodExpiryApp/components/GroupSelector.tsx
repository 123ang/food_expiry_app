import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useApi } from '../context/ApiContext';
import { useRouter } from 'expo-router';

type IconName = keyof typeof FontAwesome.glyphMap;

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code: string | null;
  max_members: number;
  created_at: string;
  updated_at: string;
}

interface GroupSelectorProps {
  selectedGroupId: string | null;
  onGroupChange: (group: Group) => void;
  groups: Group[];
  isLoading?: boolean;
}

type GroupLike = Omit<Group, 'invite_code' | 'max_members'> & {
  invite_code?: string | null;
  max_members?: number;
};

const normalizeGroup = (group: GroupLike): Group => ({
  ...group,
  invite_code: group.invite_code ?? null,
  max_members: group.max_members ?? 1,
});

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  selectedGroupId,
  onGroupChange,
  groups,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { createGroup } = useApi();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);


  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

  const handleCreateGroup = async () => {
    setIsCreatingGroup(true);
    try {
      let groupName = 'Personal';
      let groupDescription = 'Your personal food management group';
      
      // If user already has a personal group, create a family group
      if (groups.length > 0) {
        groupName = 'Family';
        groupDescription = 'Share food management with your family';
      }
      
      const newGroup = await createGroup(groupName, groupDescription);
      onGroupChange(normalizeGroup(newGroup));
      setShowModal(false);
      Alert.alert('Success', `${groupName} group created successfully!`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    groupInfo: {
      flex: 1,
      marginLeft: 8,
    },
    groupName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
    },
    groupDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    dropdownIcon: {
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    groupList: {
      marginBottom: 16,
    },
    groupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    selectedGroupItem: {
      backgroundColor: `${theme.primaryColor}20`,
      borderColor: theme.primaryColor,
    },
    groupIcon: {
      marginRight: 12,
    },
    groupDetails: {
      flex: 1,
    },
    groupItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
    },
    groupItemDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    createButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    closeButton: {
      backgroundColor: theme.borderColor,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    closeButtonText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  // Show loading state if no groups but user is authenticated
  if (groups.length === 0) {
    return (
      <View style={styles.container}>
        <FontAwesome 
          name="users" as IconName
          size={16} 
          color={theme.primaryColor} 
        />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>
            Personal
          </Text>
          <Text style={styles.groupDescription}>
            Your personal food management group
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={() => setShowModal(true)}
        disabled={groups.length === 0}
      >
        <FontAwesome 
          name="users" as IconName
          size={16} 
          color={theme.primaryColor} 
        />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>
            {selectedGroup ? selectedGroup.name : 'No Group'}
          </Text>
          {selectedGroup && (
            <Text style={styles.groupDescription}>
              {selectedGroup.description || 'Personal group'}
            </Text>
          )}
        </View>
        <FontAwesome 
          name="chevron-down" as IconName
          size={14} 
          color={theme.textSecondary} 
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Group</Text>
            
            <ScrollView style={styles.groupList}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupItem,
                    selectedGroupId === group.id && styles.selectedGroupItem
                  ]}
                  onPress={() => {
                    onGroupChange(normalizeGroup(group));
                    setShowModal(false);
                  }}
                >
                  <FontAwesome 
                    name="users" as IconName
                    size={16} 
                    color={theme.primaryColor} 
                    style={styles.groupIcon}
                  />
                  <View style={styles.groupDetails}>
                    <Text style={styles.groupItemName}>{group.name}</Text>
                    <Text style={styles.groupItemDescription}>
                      {group.description || 'Personal group'}
                    </Text>
                  </View>
                  {selectedGroupId === group.id && (
                    <FontAwesome 
                      name="check" as IconName
                      size={16} 
                      color={theme.primaryColor} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Navigate to Settings → Manage Groups */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setShowModal(false);
                router.push('/settings');
              }}
            >
              <Text style={styles.createButtonText}>
                {t('groups.manageGroups') || 'Manage Groups'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}; 
