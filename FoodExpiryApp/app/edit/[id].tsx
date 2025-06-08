import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDatabase } from '../../context/DatabaseContext';
import { saveImageToStorage, getSavedImages, getSafeImageUri } from '../../utils/fileStorage';
import { DatePicker } from '../../components/DatePicker';
import { getCurrentDate } from '../../database/database';
import { BottomNav } from '../../components/BottomNav';
import CategoryIcon from '../../components/CategoryIcon';
import LocationIcon from '../../components/LocationIcon';
import { EMOJI_CATEGORIES, CATEGORY_EMOJIS } from '../../constants/emojis';
import { useResponsive } from '../../hooks/useResponsive';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function EditScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { foodItems, updateFoodItem, refreshAll, categories, locations } = useDatabase();
  const responsive = useResponsive();
  
  // Ensure we have a theme before rendering
  if (!theme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showImageOptionsModal, setShowImageOptionsModal] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);



  const loadSavedPhotos = async () => {
    try {
      // Get all saved photos from file storage
      const photos = await getSavedImages();
      setSavedPhotos(photos);
    } catch (error) {
      console.error('Error loading saved photos:', error);
    }
  };

  useEffect(() => {
    const loadItem = async () => {
      setIsLoading(true);
      try {
        await refreshAll();
        const item = foodItems.find(item => item.id === Number(id));
        if (item) {
          setItemName(item.name);
          setQuantity(item.quantity.toString());
          setSelectedCategory(item.category_id);
          setSelectedLocation(item.location_id);
          setExpiryDate(new Date(item.expiry_date));
          setReminderDays(item.reminder_days.toString());
          setNotes(item.notes || '');
          setImageUri(item.image_uri);
        } else {
          Alert.alert(t('alert.error'), t('error.itemNotFound'));
          router.back();
        }
      } catch (error) {
        console.error('Error loading item:', error);
        Alert.alert(t('alert.error'), t('error.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    };
    loadItem();
    loadSavedPhotos();
  }, [id]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(
        t('image.permissionLibraryTitle'),
        t('image.permissionLibraryMessage')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        console.log('Processing picked gallery image (edit):', result.assets[0].uri);
        // Use bulletproof image storage
        const safeImageUri = await getSafeImageUri(result.assets[0].uri);
        console.log('Safe image URI from gallery (edit):', safeImageUri);
        if (safeImageUri) {
          setImageUri(safeImageUri);
          console.log('Gallery image URI set successfully (edit)');
          // Refresh saved photos list
          loadSavedPhotos();
        } else {
          console.error('getSafeImageUri returned null for gallery image (edit)');
          Alert.alert(t('alert.error'), t('image.failedToSave'));
        }
      } catch (error) {
        console.error('Error processing gallery image (edit):', error);
        Alert.alert(t('alert.error'), t('image.failedToProcess'));
      }
    } else {
      console.log('Gallery picker was canceled (edit)');
    }
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(
        t('image.permissionCameraTitle'),
        t('image.permissionCameraMessage')
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        console.log('Processing camera image (edit):', result.assets[0].uri);
        // Use bulletproof image storage
        const safeImageUri = await getSafeImageUri(result.assets[0].uri);
        console.log('Safe image URI from camera (edit):', safeImageUri);
        if (safeImageUri) {
          setImageUri(safeImageUri);
          console.log('Camera image URI set successfully (edit)');
          // Refresh saved photos list
          loadSavedPhotos();
        } else {
          console.error('getSafeImageUri returned null for camera image (edit)');
          Alert.alert(t('alert.error'), t('image.failedToSave'));
        }
      } catch (error) {
        console.error('Error processing camera image (edit):', error);
        Alert.alert(t('alert.error'), t('image.failedToProcess'));
      }
    } else {
      console.log('Camera picker was canceled (edit)');
    }
  };

  const showImageOptions = () => {
    setShowImageOptionsModal(true);
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const showEmojiPicker = () => {
    setShowEmojiModal(true);
  };

  const showSavedPhotos = () => {
    setShowPhotosModal(true);
  };

  const selectEmoji = (emoji: string) => {
    setImageUri(`emoji:${emoji}`);
    setShowEmojiModal(false);
  };

  const selectSavedPhoto = (uri: string) => {
    setImageUri(uri);
    setShowPhotosModal(false);
  };

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert(t('alert.error'), t('alert.nameRequired'));
      return;
    }

    const quantityNum = parseInt(quantity);
    if (!quantityNum || quantityNum < 1) {
      Alert.alert(t('alert.error'), t('alert.quantityRequired'));
      return;
    }

    if (!selectedLocation) {
      Alert.alert(t('alert.error'), t('error.selectStorageLocation'));
      return;
    }

    setIsSaving(true);

    try {
      // Image is already processed by picker functions, just use it directly
      const finalImageUri = imageUri;

      // Update the food item directly
      await updateFoodItem({
        id: Number(id),
        name: itemName.trim(),
        quantity: parseInt(quantity),
        category_id: selectedCategory,
        location_id: selectedLocation,
        expiry_date: expiryDate.toISOString().split('T')[0],
        reminder_days: parseInt(reminderDays) || 0,
        notes: notes.trim(),
        image_uri: finalImageUri,
        created_at: getCurrentDate(),
      });
      
      // Refresh data
      await refreshAll();
      
      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error saving item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(t('alert.error'), `${t('alert.saveFailed')}: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
      flex: 1,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textColor,
      fontSize: 16,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textColor,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.cardBackground,
      padding: 12,
      borderRadius: 8,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.layout.spacing.grid,
      marginBottom: 24,
    },
    optionCard: {
      width: responsive.getGridItemWidth(Math.min(responsive.layout.gridColumns.categories, 4), responsive.layout.spacing.grid),
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: responsive.layout.spacing.card,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    optionCardSelected: {
      borderColor: theme.primaryColor,
      backgroundColor: theme.primaryColor + '10',
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionName: {
      color: theme.textColor,
      fontSize: 14,
      fontWeight: '500',
    },
    datePickerContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 24,
      // Remove padding to avoid double padding with DatePicker
      overflow: 'hidden', // Ensure rounded corners work properly
    },
    notesInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      padding: 8,
    },
    imageContainer: {
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      alignItems: 'center',
    },
    imagePreview: {
      width: 200,
      height: 150,
      borderRadius: 8,
      marginBottom: 12,
    },
    imagePlaceholder: {
      width: 200,
      height: 150,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}10`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: theme.borderColor,
      borderStyle: 'dashed',
    },
    placeholderTitle: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 8,
      textAlign: 'center',
    },
    placeholderSubtitle: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
      maxWidth: 180,
    },
    imageButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    imageButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    imageButtonSecondary: {
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    imageButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    imageButtonTextSecondary: {
      color: theme.textColor,
    },
    emojiPreview: {
      width: 200,
      height: 150,
      borderRadius: 8,
      backgroundColor: `${theme.primaryColor}10`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    emojiText: {
      fontSize: 80,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: responsive.getResponsiveValue({
        largeTablet: 32,
        tablet: 24,
        default: 20,
      }),
      width: responsive.getResponsiveValue({
        largeTablet: '70%',
        tablet: '80%',
        default: '90%',
      }),
      maxHeight: responsive.getResponsiveValue({
        largeTablet: '70%',
        tablet: '75%',
        default: '80%',
      }),
      alignSelf: 'center',
    },
    modalTitle: {
      fontSize: responsive.getResponsiveValue({
        largeTablet: 22,
        tablet: 20,
        default: 18,
      }),
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: responsive.getResponsiveValue({
        largeTablet: 24,
        tablet: 20,
        default: 16,
      }),
    },
    emojiGrid: {
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    emojiContainer: {
      flex: 1,
      maxHeight: 400,
      paddingHorizontal: 16,
    },
    emojiListContent: {
      padding: 16,
    },
    emojiItem: {
      flex: 1,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
      margin: 4,
      maxWidth: 60,
    },
    emojiItemText: {
      fontSize: 24,
    },
    photoGrid: {
      justifyContent: 'flex-start',
      gap: 8,
    },
    photoItem: {
      width: 100,
      height: 100,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    closeButton: {
      backgroundColor: theme.backgroundColor,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    closeButtonText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '500',
    },
    noPhotosText: {
      color: theme.textSecondary,
      textAlign: 'center',
      fontSize: 16,
      marginVertical: 32,
    },
    modalSubtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    imageOptionsContainer: {
      width: '100%',
      marginBottom: 24,
    },
    imageOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    imageOptionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    imageOptionItem: {
      width: '48%',
      backgroundColor: theme.backgroundColor,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    imageOptionText: {
      color: theme.textColor,
      fontSize: 16,
      marginLeft: 16,
      fontWeight: '500',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={styles.loadingText}>{t('addItem.loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Text style={{ fontSize: 24, color: theme.textColor }}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('addItem.editTitle')}</Text>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{t('form.save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSaving}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.itemName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addItem.itemNamePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={itemName}
              onChangeText={setItemName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.quantity')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addItem.quantityPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('form.photo')}</Text>
            <View style={styles.imageContainer}>
              {imageUri ? (
                <>
                  {imageUri.startsWith('emoji:') ? (
                    <View style={styles.emojiPreview}>
                      <Text style={styles.emojiText}>{imageUri.replace('emoji:', '')}</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  )}
                  <View style={styles.imageButtons}>
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={showImageOptions}
                    >
                      <FontAwesome name="camera" size={14} color="#FFFFFF" />
                      <Text style={styles.imageButtonText}>{t('image.changePhoto')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.imageButton, styles.imageButtonSecondary]}
                      onPress={removeImage}
                    >
                      <FontAwesome name="trash" size={14} color={theme.textColor} />
                      <Text style={[styles.imageButtonText, styles.imageButtonTextSecondary]}>{t('image.removePhoto')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.imagePlaceholder}
                    onPress={showImageOptions}
                  >
                    <FontAwesome name="image" size={48} color={theme.textSecondary} />
                    <Text style={styles.placeholderTitle}>{t('image.noPhotoAdded')}</Text>
                    <Text style={styles.placeholderSubtitle}>{t('image.tapToAddPhoto')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={showImageOptions}
                  >
                    <FontAwesome name="plus" size={14} color="#FFFFFF" />
                    <Text style={styles.imageButtonText}>{t('image.addPhoto')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.category')}</Text>
            <View style={styles.optionsGrid}>
              {categories && categories.length > 0 ? categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionCard,
                    selectedCategory === category.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id!)}
                >
                  <View style={styles.optionIcon}>
                    <CategoryIcon iconName={category.icon} size={20} />
                  </View>
                  <Text style={styles.optionName}>{category.name}</Text>
                </TouchableOpacity>
              )) : (
                <Text style={styles.loadingText}>{t('loading.categories')}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.storageLocation')}</Text>
            <View style={styles.optionsGrid}>
              {locations && locations.length > 0 ? locations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.optionCard,
                    selectedLocation === location.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedLocation(location.id!)}
                >
                  <View style={styles.optionIcon}>
                    <LocationIcon iconName={location.icon} size={20} />
                  </View>
                  <Text style={styles.optionName}>{location.name}</Text>
                </TouchableOpacity>
              )) : (
                <Text style={styles.loadingText}>{t('loading.locations')}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.expiryDate')}</Text>
            <View style={styles.datePickerContainer}>
              <DatePicker
                value={expiryDate}
                onChange={setExpiryDate}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.reminderDays')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addItem.reminderDaysPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={reminderDays}
              onChangeText={setReminderDays}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.notes')}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder={t('addItem.notesPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </ScrollView>
      </View>
      
      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('image.selectEmoji')}</Text>
            <FlatList
              data={CATEGORY_EMOJIS}
              numColumns={5}
              keyExtractor={(item, index) => index.toString()}
              columnWrapperStyle={styles.emojiGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.emojiItem}
                  onPress={() => selectEmoji(item.emoji)}
                >
                  <Text style={styles.emojiItemText}>{item.emoji}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.emojiListContent}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEmojiModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Saved Photos Modal */}
      <Modal
        visible={showPhotosModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotosModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('image.selectSavedPhoto')}</Text>
            {savedPhotos.length > 0 ? (
              <FlatList
                data={savedPhotos}
                numColumns={3}
                keyExtractor={(item, index) => index.toString()}
                columnWrapperStyle={styles.photoGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => selectSavedPhoto(item)}>
                    <Image source={{ uri: item }} style={styles.photoItem} />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={styles.noPhotosText}>{t('image.noSavedPhotos')}</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPhotosModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('image.addPhoto')}</Text>
            <Text style={styles.modalSubtitle}>{t('image.choosePhotoMethod')}</Text>
            
            <View style={styles.imageOptionsContainer}>
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  takePicture();
                }}
              >
                <FontAwesome name="camera" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>{t('image.takePhoto')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  pickImage();
                }}
              >
                <FontAwesome name="image" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>{t('image.chooseFromGallery')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showEmojiPicker();
                }}
              >
                <FontAwesome name="smile-o" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>{t('image.useFoodEmoji')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showSavedPhotos();
                }}
              >
                <FontAwesome name="folder" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>{t('image.mySavedPhotos')}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowImageOptionsModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <BottomNav />
    </>
  );
} 