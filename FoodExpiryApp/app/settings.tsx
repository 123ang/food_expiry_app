import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { useApi } from '../context/ApiContext';
import { apiClient } from '../services/ApiClient';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../components/BottomNav';
import { Category, Location } from '../database/models';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';

import { useResponsive } from '../hooks/useResponsive';
import { CATEGORY_EMOJIS, LOCATION_EMOJIS, EMOJI_CATEGORIES, EmojiItem, EmojiCategory } from '../constants/emojis';
import { getItemCategoryName, getItemLocationName } from '../utils/translationHelpers';

type IconName = keyof typeof FontAwesome.glyphMap;

type ManagementModalProps = {
  visible: boolean;
  onClose: () => void;
  type: 'categories' | 'locations';
};

type SettingItem = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  type: 'switch' | 'language' | 'navigation';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
};

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
  title: string;
  initialName?: string;
  initialIcon?: string;
  isCategory?: boolean;
};

type EmojiSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  isCategory: boolean;
  selectedEmoji?: string;
};

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  isCategory,
  selectedEmoji,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['emojiCategory.food'])); // Food expanded by default
  
  const emojis = isCategory ? CATEGORY_EMOJIS : LOCATION_EMOJIS;
  const categories = isCategory ? EMOJI_CATEGORIES : [{ title: 'Locations', icon: '📍', items: LOCATION_EMOJIS }];
  
  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
  };
  
  const styles = StyleSheet.create({
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
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    scrollContainer: {
      maxHeight: 400,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      marginVertical: 4,
    },
    categoryIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      flex: 1,
    },
    expandIcon: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center', // Center the emoji grid
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 8,
    },
    emojiItem: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiItemSelected: {
      borderColor: theme.primaryColor,
      backgroundColor: `${theme.primaryColor}20`,
    },
    emojiIcon: {
      fontSize: 28,
      textAlign: 'center',
    },
    closeButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.primaryColor,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            Select {isCategory ? 'Category' : 'Location'} Icon ({emojis.length} options)
          </Text>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            {categories.map((category) => (
              <View key={category.title}>
                <TouchableOpacity 
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.title)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryTitle}>{t(category.title)}</Text>
                  <Text style={styles.expandIcon}>
                    {expandedCategories.has(category.title) ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                
                {expandedCategories.has(category.title) && (
                  <View style={styles.emojiGrid}>
                    {category.items.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.emojiItem,
                          selectedEmoji === item.emoji && styles.emojiItemSelected
                        ]}
                        onPress={() => {
                          onSelect(item.emoji);
                        }}
                      >
                        <Text style={styles.emojiIcon}>{item.emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Group Management Modal Component
const GroupManagementModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user: localUser, userGroups, createGroup, deleteGroup, currentGroup } = useApi();
  
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  // Extract groups from userGroups
  const groups = userGroups.map(membership => ({
    ...membership.groups,
    role: membership.role,
  }));

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setIsLoading(true);
    try {
      await createGroup(newGroupName.trim(), newGroupDescription.trim() || undefined);
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateModal(false);
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMembers = async (group: any) => {
    setSelectedGroup(group);
    setIsLoading(true);
    try {
      // Fetch group members from backend
      const response = await apiClient.get<{ members: any[] }>(`/groups/${group.id}/members`);
      if (response.data?.members) {
        setGroupMembers(response.data.members);
      }
    } catch (error) {
      // Show current user as the only member if fetch fails
      setGroupMembers([{
        id: localUser?.supabase_id,
        email: localUser?.email,
        full_name: localUser?.full_name || 'You',
        role: group.role || 'owner',
      }]);
    } finally {
      setIsLoading(false);
      setShowMembersModal(true);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedGroup) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(`/groups/${selectedGroup.id}/invite`, {
        email: inviteEmail.trim(),
      });
      Alert.alert(
        'Invitation Sent',
        `Invitation sent to ${inviteEmail}.`,
        [{ text: 'OK', onPress: () => setInviteEmail('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!selectedGroup) return;
    
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/groups/${selectedGroup.id}/members/${memberId}`);
              setGroupMembers(prev => prev.filter(member => member.id !== memberId));
              Alert.alert('Success', `${memberName} has been removed from the group.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteGroup = (group: any) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"?\n\nThis will permanently delete:\n• All food items\n• All shopping items\n• All wish items\n• All categories\n• All locations\n• The group itself\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteGroup(group.id);
              setIsLoading(false);
              Alert.alert(
                'Success',
                `"${group.name}" and all related data have been deleted successfully.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              setIsLoading(false);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete group. Please try again.'
              );
            }
          }
        }
      ]
    );
  };

  const modalStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
      width: '90%',
      maxWidth: 500,
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      padding: 24,
      maxHeight: '90%',
    },
    modalHeader: {
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 10,
    },
    groupNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    input: {
      backgroundColor: theme.backgroundColor,
      padding: 14,
      borderRadius: 8,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      fontSize: 16,
      width: '100%',
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    inviteContainer: {
      marginBottom: 16,
    },
    inviteInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    inviteButton: {
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    inviteButtonDisabled: {
      backgroundColor: theme.textSecondary,
    },
    inviteButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    inviteNote: {
      fontSize: 14,
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
    membersList: {
      maxHeight: 250,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    memberAvatarText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 2,
    },
    memberEmail: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    memberRole: {
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginRight: 8,
    },
    memberRoleText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
    adminRole: {
      backgroundColor: '#FFD700',
    },
    removeButton: {
      backgroundColor: theme.dangerColor,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      backgroundColor: theme.backgroundColor,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    closeButtonText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '600',
    },
    groupStats: {
      backgroundColor: theme.backgroundColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statsLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    statsValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textColor,
    },
  });

  return (
    <>
      {/* Main Groups Modal */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>👥 {t('settings.groups') || 'Manage Groups'}</Text>
                <Text style={modalStyles.modalSubtitle}>
                  {t('settings.groupsDescription') || 'Create and manage your groups'}
                </Text>
              </View>

              {/* Groups List */}
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>📋 Your Groups ({groups.length})</Text>
                {groups.length === 0 ? (
                  <View style={modalStyles.groupStats}>
                    <Text style={[modalStyles.statsLabel, { textAlign: 'center' }]}>
                      No groups yet. Create your first group!
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={modalStyles.membersList} nestedScrollEnabled>
                    {groups.map((group) => (
                      <View key={group.id} style={modalStyles.memberItem}>
                        <View style={modalStyles.memberAvatar}>
                          <Text style={modalStyles.memberAvatarText}>
                            {group.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={modalStyles.memberInfo}>
                          <Text style={modalStyles.memberName}>{group.name}</Text>
                          <Text style={modalStyles.memberEmail}>
                            {group.description || 'No description'}
                          </Text>
                        </View>
                        <View style={[
                          modalStyles.memberRole,
                          group.role === 'owner' && modalStyles.adminRole
                        ]}>
                          <Text style={modalStyles.memberRoleText}>
                            {group.role === 'owner' ? 'Owner' : group.role === 'admin' ? 'Admin' : 'Member'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[modalStyles.saveButton, { marginLeft: 8 }]}
                          onPress={() => handleViewMembers(group)}
                        >
                          <FontAwesome name="users" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        {group.role === 'owner' && group.name !== 'Personal' && (
                          <TouchableOpacity
                            style={[modalStyles.removeButton, { marginLeft: 8 }]}
                            onPress={() => handleDeleteGroup(group)}
                          >
                            <FontAwesome name="trash" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Create Group Button */}
              <TouchableOpacity
                style={[modalStyles.saveButton, { marginTop: 16, paddingVertical: 14 }]}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={modalStyles.saveButtonText}>➕ Create New Group</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
              <Text style={modalStyles.closeButtonText}>{t('common.close') || 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, { maxHeight: '80%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>➕ Create New Group</Text>
              </View>
              
              <View style={[modalStyles.section, { marginBottom: 20 }]}>
                <Text style={modalStyles.sectionTitle}>Group Name</Text>
                <TextInput
                  style={modalStyles.input}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="e.g., Family, Roommates, Office"
                  placeholderTextColor={theme.textSecondary}
                  autoFocus
                />
              </View>

              <View style={[modalStyles.section, { marginBottom: 24 }]}>
                <Text style={modalStyles.sectionTitle}>Description (optional)</Text>
                <TextInput
                  style={[modalStyles.input, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={newGroupDescription}
                  onChangeText={setNewGroupDescription}
                  placeholder="What is this group for?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[modalStyles.closeButton, { flex: 1 }]}
                  onPress={() => {
                    setShowCreateModal(false);
                    setNewGroupName('');
                    setNewGroupDescription('');
                  }}
                  disabled={isLoading}
                >
                  <Text style={modalStyles.closeButtonText}>{t('common.cancel') || 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.saveButton, { flex: 1, paddingVertical: 16 }]}
                  onPress={handleCreateGroup}
                  disabled={isLoading || !newGroupName.trim()}
                >
                  <Text style={modalStyles.saveButtonText}>
                    {isLoading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Members Modal */}
      <Modal visible={showMembersModal} transparent animationType="fade" onRequestClose={() => setShowMembersModal(false)}>
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>
                  👥 {selectedGroup?.name || 'Group'} Members
                </Text>
                <Text style={modalStyles.modalSubtitle}>
                  {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Invite Section - Only for owners/admins */}
              {selectedGroup && (selectedGroup.role === 'owner' || selectedGroup.role === 'admin') && (
                <View style={modalStyles.section}>
                  <Text style={modalStyles.sectionTitle}>📧 Invite New Member</Text>
                  <View style={modalStyles.inviteInputContainer}>
                    <TextInput
                      style={modalStyles.input}
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="Enter email address"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={[modalStyles.inviteButton, isLoading && modalStyles.inviteButtonDisabled]}
                      onPress={handleInviteUser}
                      disabled={isLoading}
                    >
                      <Text style={modalStyles.inviteButtonText}>
                        {isLoading ? '...' : 'Invite'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Members List */}
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>👥 Current Members</Text>
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.primaryColor} />
                ) : (
                  <ScrollView style={modalStyles.membersList} nestedScrollEnabled>
                    {groupMembers.map((member) => {
                      const isCurrentUser = member.id === localUser?.supabase_id;
                      return (
                        <View key={member.id} style={modalStyles.memberItem}>
                          <View style={modalStyles.memberAvatar}>
                            <Text style={modalStyles.memberAvatarText}>
                              {(member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={modalStyles.memberInfo}>
                            <Text style={modalStyles.memberName}>
                              {member.full_name || 'Unknown'} {isCurrentUser && '(You)'}
                            </Text>
                            <Text style={modalStyles.memberEmail}>{member.email}</Text>
                          </View>
                          <View style={[
                            modalStyles.memberRole,
                            member.role === 'owner' && modalStyles.adminRole
                          ]}>
                            <Text style={modalStyles.memberRoleText}>
                              {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                            </Text>
                          </View>
                          {!isCurrentUser && selectedGroup?.role === 'owner' && (
                            <TouchableOpacity
                              style={modalStyles.removeButton}
                              onPress={() => handleRemoveMember(member.id, member.full_name || member.email)}
                            >
                              <FontAwesome name="times" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => {
                setShowMembersModal(false);
                setSelectedGroup(null);
                setGroupMembers([]);
                setInviteEmail('');
              }}
            >
              <Text style={modalStyles.closeButtonText}>{t('common.close') || 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center' as any,
      height: '100vh' as any,
    }),
  } as any,
  header: {
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textColor,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    // Remove paddingBottom to avoid conflicts with contentContainerStyle
  },
  section: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borderColor,
    alignSelf: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${theme.primaryColor}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textColor,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  addButton: {
    backgroundColor: theme.primaryColor,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  languageModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    width: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  languageText: {
    fontSize: 16,
    color: theme.textColor,
  },
  languageSelected: {
    color: theme.primaryColor,
    fontWeight: '600',
  },
  expandableContent: {
    backgroundColor: theme.backgroundColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.cardBackground,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  managementItemIcon: {
    marginRight: 12,
  },
  managementItemText: {
    flex: 1,
    fontSize: 16,
    color: theme.textColor,
  },
  managementItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.backgroundColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.primaryColor,
    marginTop: 8,
    borderRadius: 8,
  },
  addNewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expandIcon: {
    marginLeft: 8,
  },
  customHeader: {
    backgroundColor: theme.cardBackground,
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textColor,
    textAlign: 'center',
  },
  // About modal styles
  aboutModal: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textColor,
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutContent: {
    flex: 1,
  },
  aboutSection: {
    marginBottom: 16,
  },
  aboutSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textColor,
    marginBottom: 8,
  },
  aboutSectionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  aboutFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aboutFeatureText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  aboutFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    paddingTop: 16,
    alignItems: 'center',
  },
  aboutFooterText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeAboutButton: {
    backgroundColor: theme.primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeAboutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iconSelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPreview: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themePreview: {
    flexDirection: 'row',
    width: 60,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  themeColorBox: {
    flex: 1,
    height: 20,
  },
  themeInfo: {
    flex: 1,
  },
  themeDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
} as any);

const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  initialName = '',
  initialIcon = '',
  isCategory = true,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(initialIcon || (isCategory ? '🍎' : '❄️'));
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const iconWasManuallySet = React.useRef(false);
  const styles = createStyles(theme);

  // Reset state when modal opens/closes or when initial values change
  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      // Only set icon when modal first opens, not on subsequent renders
      if (initialIcon) {
        setIcon(initialIcon);
        iconWasManuallySet.current = false; // Reset flag for editing existing items
      } else if (!initialName && !iconWasManuallySet.current) {
        // Creating new item - only set default if icon hasn't been manually set
        setIcon(isCategory ? '🍎' : '❄️');
      }
      // If editing existing item (has initialName) but no initialIcon, keep current icon
    }
  }, [visible, initialName, initialIcon, isCategory]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), icon);
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    iconWasManuallySet.current = false; // Reset flag for next use
    // Don't reset icon here - let the useEffect handle icon state properly
    onClose();
  };

  return (
    <>
      {/*
        Do not display this modal while the emoji selector is open. Presenting
        two native modals simultaneously causes issues on iOS, preventing the
        icon picker from appearing. */}
      <Modal
        visible={visible && !showEmojiSelector}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>{title}</Text>
            
            <TextInput
              style={[styles.input, { 
                color: theme.textColor,
                borderColor: theme.borderColor,
                backgroundColor: theme.backgroundColor
              }]}
              placeholder={t('categoryName')}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
            
            <TouchableOpacity
              style={[styles.iconSelector, { 
                borderColor: theme.borderColor,
                backgroundColor: theme.backgroundColor
              }]}
              onPress={() => setShowEmojiSelector(true)}
            >
              <View style={styles.iconPreview}>
                <Text style={{ fontSize: 24 }}>{icon}</Text>
              </View>
              <Text style={[styles.iconText, { color: theme.textColor }]}>
                {t('selectIcon')} ({icon})
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>▶</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.dangerColor }]}
                onPress={handleClose}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EmojiSelector
        visible={showEmojiSelector}
        onClose={() => setShowEmojiSelector(false)}
        onSelect={(selectedIcon: string) => {
          setIcon(selectedIcon);
          iconWasManuallySet.current = true; // Mark as manually set
          setShowEmojiSelector(false);
        }}
        isCategory={isCategory}
        selectedEmoji={icon}
      />
    </>
  );
};

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme, currentThemeType, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { categories: allCategories, locations: allLocations, createCategory, updateCategory, deleteCategory, createLocation, updateLocation, deleteLocation, deleteAllExpired, foodItems } = useDatabase();
  const { user, isAuthenticated, signOut, currentGroup } = useApi();
  
  // Filter categories and locations by current group (same as in home/dashboard)
  const categories = useMemo(() => {
    if (!currentGroup?.id) return allCategories;
    const filtered = allCategories.filter(cat => cat.group_id === currentGroup.id);
    // Deduplicate by name - keep the one with cloud_id if available
    const seen = new Map<string, Category>();
    for (const cat of filtered) {
      const key = cat.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, cat);
      } else {
        const existing = seen.get(key)!;
        // Prefer the one with cloud_id (synced from server)
        if (cat.cloud_id && !existing.cloud_id) {
          seen.set(key, cat);
        }
      }
    }
    return Array.from(seen.values());
  }, [allCategories, currentGroup?.id]);
  
  const locations = useMemo(() => {
    if (!currentGroup?.id) return allLocations;
    const filtered = allLocations.filter(loc => loc.group_id === currentGroup.id);
    // Deduplicate by name - keep the one with cloud_id if available
    const seen = new Map<string, Location>();
    for (const loc of filtered) {
      const key = loc.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, loc);
      } else {
        const existing = seen.get(key)!;
        // Prefer the one with cloud_id (synced from server)
        if (loc.cloud_id && !existing.cloud_id) {
          seen.set(key, loc);
        }
      }
    }
    return Array.from(seen.values());
  }, [allLocations, currentGroup?.id]);
  const localUser = user; // ApiContext uses 'user' instead of 'localUser'
  // Note: isOnlineMode and isOfflineMode are not in ApiContext, and createFamilySubscription is not needed for PostgreSQL
  const responsive = useResponsive();
  const router = useRouter();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | Location | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [managementModalType, setManagementModalType] = useState<'categories' | 'locations'>('categories');
  const [showGroupManagementModal, setShowGroupManagementModal] = useState(false);

  const openManagementModal = (type: 'categories' | 'locations') => {
    setManagementModalType(type);
    setManagementModalVisible(true);
  };

  const getThemeDisplayName = (themeType: string) => {
    switch (themeType) {
      case 'original':
        return t('settings.themeOriginal') || 'Original (White & Green)';
      case 'recycled':
        return t('settings.themeRecycled') || 'Recycled (Warm & Eco)';
      case 'darkBrown':
        return t('settings.themeDarkBrown') || 'Dark Brown Theme';
      case 'black':
        return t('settings.themeBlack') || 'Black Theme';
      case 'blue':
        return t('settings.themeBlue') || 'Blue Theme';
      case 'green':
        return t('settings.themeGreen') || 'Green Theme';
      case 'softPink':
        return t('settings.themeSoftPink') || 'Soft Pink Theme';
      case 'brightPink':
        return t('settings.themeBrightPink') || 'Bright Pink Theme';
      case 'naturalGreen':
        return t('settings.themeYellow') || 'Yellow Theme';
      case 'mintRed':
        return t('settings.themeMintRed') || 'Mint-Red Theme';
      case 'darkGold':
        return t('settings.themeDarkGold') || 'Dark Gold Theme';
      default:
        return themeType;
    }
  };

  const settings: SettingItem[] = [
    {
      id: 'language',
      icon: 'language',
      title: t('settings.language'),
      description: t('settings.languageDescription'),
      type: 'language',
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'account',
      icon: 'user',
      title: isAuthenticated ? (t('settings.account') || 'Account') : 'Login',
      description: isAuthenticated 
        ? (user?.email || localUser?.email || 'Loading...')
        : 'Sign in to sync data and access premium features',
      type: 'navigation',
      onPress: () => {
        if (isAuthenticated) {
          // Show account info and sign out options
          Alert.alert(
            'Account',
            `Email: ${user?.email || localUser?.email || 'Loading...'}\nSubscription: ${localUser?.subscription_type || 'Free'}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Sign Out', 
                style: 'destructive', 
                onPress: async () => {
                  try {
                    await signOut();
                    // Navigate to login screen after successful sign out
                    router.push('/auth/login');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to sign out. Please try again.');
                  }
                }
              }
            ]
          );
        } else {
          router.push('/auth/login' as any);
        }
      },
    },
    // Group management option - only visible when authenticated
    ...(isAuthenticated ? [{
      id: 'groups',
      icon: 'users' as IconName,
      title: t('settings.groups') || 'Groups',
      description: t('settings.groupsDescription') || 'Manage your personal and family groups',
      type: 'navigation' as const,
      onPress: () => setShowGroupManagementModal(true),
    }] : []),
    {
      id: 'theme',
      icon: 'paint-brush',
      title: t('settings.theme') || 'Theme',
      description: `${t('settings.themeDescription') || 'Choose your preferred theme'}: ${getThemeDisplayName(currentThemeType)}`,
      type: 'navigation',
      onPress: () => setShowThemeModal(true),
    },
    {
      id: 'categories',
      icon: 'tags',
      title: t('settings.categories'),
      description: t('settings.categoriesDescription'),
      type: 'navigation',
      onPress: () => router.push('/categories'),
    },
    {
      id: 'locations',
      icon: 'map-marker',
      title: t('settings.storageLocations'),
      description: t('settings.storageLocationsDescription'),
      type: 'navigation',
      onPress: () => router.push('/locations'),
    },
    {
      id: 'notifications',
      icon: 'bell',
      title: t('settings.notifications'),
      description: t('settings.notificationsDescription'),
      type: 'navigation',
      onPress: () => router.push('/notifications'),
    },
    {
      id: 'clearExpired',
      icon: 'trash',
      title: t('settings.clearExpiredItems'),
      description: t('settings.clearExpiredItemsDescription'),
      type: 'navigation',
      onPress: () => {
        handleClearExpired();
      },
    },
    {
      id: 'clearUsed',
      icon: 'check-circle',
      title: t('settings.clearUsedItems'),
      description: t('settings.clearUsedItemsDescription'),
      type: 'navigation',
      onPress: () => {
        handleClearUsedItems();
      },
    },
  ];

  // Logout button - separate from other settings for prominent display
  const logoutButton: SettingItem = {
    id: 'logout',
    icon: 'sign-out' as IconName,
    title: t('settings.signOut') || 'Sign Out',
    description: t('settings.signOutDescription') || 'Sign out of your account and switch to another account',
    type: 'navigation',
    onPress: () => {
      Alert.alert(
        t('settings.signOut') || 'Sign Out',
        t('settings.signOutConfirm') || 'Are you sure you want to sign out? You will need to sign in again to access your data.',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          { 
            text: t('settings.signOut') || 'Sign Out', 
            style: 'destructive', 
            onPress: async () => {
              try {
                await signOut();
                // Navigate to login screen after successful sign out
                router.push('/auth/login');
              } catch (error) {
                Alert.alert(
                  t('common.error') || 'Error', 
                  t('settings.signOutError') || 'Failed to sign out. Please try again.'
                );
              }
            }
          }
        ]
      );
    },
  };

  const handleDeleteCategory = async (id: number) => {
    Alert.alert(
      t('deleteCategory'),
      t('deleteCategoryConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteCategory(id)
        }
      ]
    );
  };

  const handleDeleteLocation = async (id: number) => {
    Alert.alert(
      t('deleteLocation'),
      t('deleteLocationConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteLocation(id)
        }
      ]
    );
  };


  const handleClearExpired = async () => {
    Alert.alert(
      t('settings.clearExpiredConfirmTitle'),
      t('settings.clearExpiredConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.clearExpiredButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedCount = await deleteAllExpired();
              const plural = deletedCount === 1 ? '' : 's';
              Alert.alert(
                t('common.success'), 
                t('settings.clearExpiredSuccess').replace('{count}', deletedCount.toString()).replace('{plural}', plural)
              );
            } catch (error) {
              Alert.alert(
                t('common.error'), 
                t('settings.clearExpiredError')
              );
            }
          }
        }
      ]
    );
  };

  const handleClearUsedItems = async () => {
    // Navigate to a selection screen where users can select items to mark as used/removed
    router.push('/clear-items');
  };

  const styles = createStyles(theme);

  const renderSettingItem = (item: SettingItem, index: number, total: number, isLogout: boolean = false) => {
    const isLast = index === total - 1;

    // Special styling for logout button
    if (isLogout) {
      return (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.settingItem, 
            isLast && styles.settingItemLast,
            {
              backgroundColor: `${theme.dangerColor || '#FF3B30'}15`, // Light red background
              borderLeftWidth: 3,
              borderLeftColor: theme.dangerColor || '#FF3B30',
            }
          ]}
          onPress={item.onPress}
        >
          <View style={[styles.settingIcon, { backgroundColor: `${theme.dangerColor || '#FF3B30'}30` }]}>
            <FontAwesome name={item.icon} size={16} color={theme.dangerColor || '#FF3B30'} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.dangerColor || '#FF3B30' }]}>{item.title}</Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={theme.dangerColor || '#FF3B30'} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, isLast && styles.settingItemLast]}
        onPress={item.onPress}
        disabled={item.type === 'switch'}
      >
        <View style={styles.settingIcon}>
          <FontAwesome name={item.icon} size={16} color={theme.primaryColor} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: theme.borderColor, true: theme.primaryColor }}
            thumbColor={theme.cardBackground}
          />
        )}
        {item.type === 'navigation' && (
          <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.languageModal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('settings.language')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <FontAwesome name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setLanguage('en');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'en' && styles.languageSelected
            ]}>
              {t('language.english')}
            </Text>
            {language === 'en' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setLanguage('zh');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'zh' && styles.languageSelected
            ]}>
              {t('language.chinese')}
            </Text>
            {language === 'zh' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setLanguage('ja');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'ja' && styles.languageSelected
            ]}>
              {t('language.japanese')}
            </Text>
            {language === 'ja' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setLanguage('th');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'th' && styles.languageSelected
            ]}>
              {t('language.thai')}
            </Text>
            {language === 'th' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              setLanguage('ms');
              setShowLanguageModal(false);
            }}
          >
            <Text style={[
              styles.languageText,
              language === 'ms' && styles.languageSelected
            ]}>
              {t('language.malay')}
            </Text>
            {language === 'ms' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderThemeModal = () => (
    <Modal
      visible={showThemeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowThemeModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowThemeModal(false)}
      >
        <TouchableOpacity 
          style={[styles.languageModal, { maxHeight: '80%', flex: 0 }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('settings.theme') || 'Choose Theme'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowThemeModal(false)}
            >
              <FontAwesome name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={{ maxHeight: 400 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {/* Original Theme */}
            <TouchableOpacity
              style={styles.languageOption}
            onPress={() => {
              setTheme('original');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#F8F9FA', borderColor: '#CED4DA', borderWidth: 1 }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#2E7D32' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#FFFFFF', borderColor: '#CED4DA', borderWidth: 1 }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'original' && styles.languageSelected
                ]}>
                  {t('settings.themeOriginal') || 'Original'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeOriginalDesc') || 'Improved contrast white theme with better visibility'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'original' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Recycled Theme */}
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setTheme('recycled');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#F3C88B' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#4CAF50' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#FDF0C0' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'recycled' && styles.languageSelected
                ]}>
                  {t('settings.themeRecycled') || 'Recycled'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeRecycledDesc') || 'Warm eco-friendly peach and cream tones'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'recycled' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Dark Brown Theme */}
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setTheme('darkBrown');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#2C2417' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#4CAF50' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#3D3426' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'darkBrown' && styles.languageSelected
                ]}>
                  {t('settings.themeDarkBrown') || 'Dark Brown'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeDarkBrownDesc') || 'Dark warm brown with green accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'darkBrown' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Black Theme */}
          <TouchableOpacity
            style={styles.languageOption}
            onPress={() => {
              setTheme('black');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#000000' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#4CAF50' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#1A1A1A' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'black' && styles.languageSelected
                ]}>
                  {t('settings.themeBlack') || 'Black'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeBlackDesc') || 'Pure black background with high contrast'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'black' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Blue Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              setTheme('blue');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#c1d9e3' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#5b88a8' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#edf4f7' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'blue' && styles.languageSelected
                ]}>
                  {t('settings.themeBlue') || 'Blue'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeBlueDesc') || 'Cool blue tones with light backgrounds'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'blue' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Green Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('green');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#dbe1c0' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#3d6a28' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#fafaf0' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'green' && styles.languageSelected
                ]}>
                  {t('settings.themeGreen') || 'Green'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeGreenDesc') || 'Natural earth tones with green accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'green' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Soft Pink Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('softPink');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#fce7dd' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#a37d6c' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#f5d3d3' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'softPink' && styles.languageSelected
                ]}>
                  {t('settings.themeSoftPink') || 'Soft Pink'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeSoftPinkDesc') || 'Warm and cozy pink tones'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'softPink' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Bright Pink Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('brightPink');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#fdd0d4' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#ad5b62' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#ffe5e5' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'brightPink' && styles.languageSelected
                ]}>
                  {t('settings.themeBrightPink') || 'Bright Pink'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeBrightPinkDesc') || 'Vibrant and energetic pink theme'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'brightPink' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Natural Green Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('naturalGreen');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#fbfcee' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#3971b8' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#f6e6a5' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'naturalGreen' && styles.languageSelected
                ]}>
                  {t('settings.themeYellow') || 'Yellow'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeYellowDesc') || 'Warm and bright yellow tones'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'naturalGreen' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Mint-Red Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 1, borderBottomColor: theme.borderColor }]}
            onPress={() => {
              setTheme('mintRed');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#d8f2c9' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#ef5f5f' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#8cd1b8' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'mintRed' && styles.languageSelected
                ]}>
                  {t('settings.themeMintRed') || 'Mint-Red'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeMintRedDesc') || 'Fresh mint with vibrant red accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'mintRed' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>

          {/* Dark Gold Theme */}
          <TouchableOpacity
            style={[styles.languageOption, { borderBottomWidth: 0 }]}
            onPress={() => {
              setTheme('darkGold');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.themeOption}>
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBox, { backgroundColor: '#2c2c2c' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#b6862e' }]} />
                <View style={[styles.themeColorBox, { backgroundColor: '#494949' }]} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.languageText,
                  currentThemeType === 'darkGold' && styles.languageSelected
                ]}>
                  {t('settings.themeDarkGold') || 'Dark Gold'}
                </Text>
                <Text style={styles.themeDescription}>
                  {t('settings.themeDarkGoldDesc') || 'Elegant dark theme with gold accents'}
                </Text>
              </View>
            </View>
            {currentThemeType === 'darkGold' && (
              <FontAwesome name="check" size={16} color={theme.primaryColor} />
            )}
          </TouchableOpacity>
          
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderAboutModal = () => (
    <Modal
      visible={showAboutModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAboutModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAboutModal(false)}
      >
        <TouchableOpacity 
          style={styles.aboutModal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* App Header */}
          <View style={styles.aboutHeader}>
            <View style={styles.appIcon}>
              <Image 
                source={require('../assets/food_expiry_logo.png')} 
                style={{ width: 64, height: 64, borderRadius: 16 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>{t('about.appName')}</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appTagline}>"{t('about.appTagline')}"</Text>
          </View>

          {/* App Content */}
          <ScrollView 
            style={styles.aboutContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>{t('about.sectionAbout')}</Text>
              <Text style={styles.aboutSectionText}>
                {t('about.description')}
              </Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>{t('about.sectionFeatures')}</Text>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>📅</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureCalendar')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>🏷️</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureCategories')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>📊</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureDashboard')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>🔍</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureSearch')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>🌙</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureDarkMode')}</Text>
              </View>
              <View style={styles.aboutFeature}>
                <Text style={{ color: theme.primaryColor }}>📱</Text>
                <Text style={styles.aboutFeatureText}>{t('about.featureCrossPlatform')}</Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>{t('about.sectionTechnology')}</Text>
              <Text style={styles.aboutSectionText}>
                {t('about.technologyDescription')}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.aboutFooter}>
            <Text style={styles.aboutFooterText}>
              {t('about.footerText')}
            </Text>
            <TouchableOpacity 
              style={styles.closeAboutButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.closeAboutButtonText}>{t('about.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const ManagementModal: React.FC<ManagementModalProps> = ({ visible, onClose, type }) => {
    const { theme } = useTheme();
    const { t, language, getCategoryName, getLocationName } = useLanguage();
    const { categories, locations, createCategory, updateCategory, deleteCategory, createLocation, updateLocation, deleteLocation } = useDatabase();
    const { currentGroup } = useApi();
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Category | Location | null>(null);
  
    const items = type === 'categories' ? categories : locations;
    const getDisplayName = type === 'categories' 
      ? (item: Category) => getItemCategoryName(item.id || null, categories, { getCategoryName, t })
      : (item: Location) => getItemLocationName(item.id || null, locations, { getLocationName, t });
  
    const handleDelete = (item: Category | Location) => {
      if (type === 'categories') {
        handleDeleteCategory(item.id!);
      } else {
        handleDeleteLocation(item.id!);
      }
    };
  
    const handleSave = async (name: string, icon: string) => {
      if (editingItem) {
        if (type === 'categories') {
          await updateCategory({ ...editingItem as Category, name, icon });
        } else {
          await updateLocation({ ...editingItem as Location, name, icon });
        }
      } else {
        // When creating new item, include current group_id
        const newItem = {
          name,
          icon,
          group_id: currentGroup?.id || undefined,
        };
        if (type === 'categories') {
          await createCategory(newItem as Category);
        } else {
          await createLocation(newItem as Location);
        }
      }
      setEditingItem(null);
      setShowEditModal(false);
    };
  
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t(type === 'categories' ? 'settings.manageCategories' : 'settings.manageLocations')}</Text>
            <ScrollView style={styles.itemList}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  {type === 'categories' ? (
                    <CategoryIcon iconName={item.icon} size={24} />
                  ) : (
                    <LocationIcon iconName={item.icon} size={24} />
                  )}
                  <Text style={styles.itemName}>{getDisplayName(item)}</Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setEditingItem(item);
                        setShowEditModal(true);
                      }}
                    >
                      <FontAwesome name="edit" size={20} color={theme.primaryColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item)}
                    >
                      <FontAwesome name="trash" size={20} color={theme.dangerColor} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.addNewButton}
              onPress={() => {
                setEditingItem(null);
                setShowEditModal(true);
              }}
            >
              <FontAwesome name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addNewButtonText}>
                {type === 'categories' ? t('addCategory') : t('addLocation')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.dangerColor, marginTop: 10 }]} onPress={onClose}>
              <Text style={styles.modalButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <EditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
          title={editingItem ? (type === 'categories' ? t('editCategory') : t('editLocation')) : (type === 'categories' ? t('addCategory') : t('addLocation'))}
          initialName={editingItem?.name}
          initialIcon={editingItem?.icon}
          isCategory={type === 'categories'}
        />
      </Modal>
    );
  };

  return (
    <>
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <Text style={styles.headerTitle}>{t('header.settings')}</Text>
        </View>
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ 
            paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Sufficient space for bottom navigation
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.section,
            {
              width: responsive.getResponsiveValue({
                small: '95%',        // Almost full width on small screens
                tablet: '80%',       // 80% width on tablets
                largeTablet: '70%',  // 70% width on large tablets
                default: '90%'       // 90% width on default phones
              })
            }
          ]}>
            {settings.map((item, index) => renderSettingItem(item, index, settings.length))}
          </View>

          {/* Logout Button Section - Separate section when authenticated */}
          {isAuthenticated && (
            <View style={[
              styles.section,
              {
                width: responsive.getResponsiveValue({
                  small: '95%',
                  tablet: '80%',
                  largeTablet: '70%',
                  default: '90%'
                }),
                marginTop: 8, // Add some space between sections
              }
            ]}>
              {renderSettingItem(logoutButton, 0, 1, true)}
            </View>
          )}
          

        </ScrollView>

        <ManagementModal
          visible={managementModalVisible}
          onClose={() => setManagementModalVisible(false)}
          type={managementModalType}
        />

        {renderLanguageModal()}
        {renderThemeModal()}
        {renderAboutModal()}
        <BottomNav />
      </View>
      <GroupManagementModal
        visible={showGroupManagementModal}
        onClose={() => setShowGroupManagementModal(false)}
      />
    </>
  );
} 
