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
import { saveImageToStorage, getSavedImages } from '../../utils/fileStorage';
import { DatePicker } from '../../components/DatePicker';
import { getCurrentDate } from '../../database/database';
import { BottomNav } from '../../components/BottomNav';
import CategoryIcon from '../../components/CategoryIcon';
import LocationIcon from '../../components/LocationIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function EditScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { foodItems, updateFoodItem, refreshAll, categories, locations } = useDatabase();
  
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

  // Category emojis for selection - same as add screen
  const CATEGORY_EMOJIS = [
    // Fruits
    { emoji: '🍎', label: 'Apple' }, { emoji: '🍌', label: 'Banana' }, { emoji: '🍊', label: 'Orange' },
    { emoji: '🍇', label: 'Grapes' }, { emoji: '🍓', label: 'Strawberry' }, { emoji: '🫐', label: 'Blueberries' },
    { emoji: '🍑', label: 'Cherries' }, { emoji: '🍒', label: 'Cherry' }, { emoji: '🥝', label: 'Kiwi' },
    { emoji: '🍍', label: 'Pineapple' }, { emoji: '🥭', label: 'Mango' }, { emoji: '🍈', label: 'Melon' },
    { emoji: '🍉', label: 'Watermelon' }, { emoji: '🍋', label: 'Lemon' }, { emoji: '🍐', label: 'Pear' },
    { emoji: '🥥', label: 'Coconut' }, { emoji: '🍅', label: 'Tomato' },
    
    // Vegetables  
    { emoji: '🥬', label: 'Leafy Greens' }, { emoji: '🥒', label: 'Cucumber' }, { emoji: '🥕', label: 'Carrot' },
    { emoji: '🌽', label: 'Corn' }, { emoji: '🥔', label: 'Potato' }, { emoji: '🍠', label: 'Sweet Potato' },
    { emoji: '🫑', label: 'Bell Pepper' }, { emoji: '🌶️', label: 'Hot Pepper' }, { emoji: '🧅', label: 'Onion' },
    { emoji: '🧄', label: 'Garlic' }, { emoji: '🥦', label: 'Broccoli' }, { emoji: '🍆', label: 'Eggplant' },
    { emoji: '🥑', label: 'Avocado' }, { emoji: '🫒', label: 'Olives' }, { emoji: '🥜', label: 'Peanuts' },
    
    // Meat & Protein
    { emoji: '🥩', label: 'Red Meat' }, { emoji: '🍖', label: 'Meat on Bone' }, { emoji: '🍗', label: 'Poultry' },
    { emoji: '🥓', label: 'Bacon' }, { emoji: '🌭', label: 'Hot Dog' }, { emoji: '🍤', label: 'Shrimp' },
    { emoji: '🦞', label: 'Lobster' }, { emoji: '🦀', label: 'Crab' }, { emoji: '🐟', label: 'Fish' },
    { emoji: '🍣', label: 'Sushi' }, { emoji: '🥚', label: 'Eggs' }, { emoji: '🫘', label: 'Beans' },
    
    // Dairy
    { emoji: '🥛', label: 'Milk' }, { emoji: '🧀', label: 'Cheese' }, { emoji: '🧈', label: 'Butter' },
    { emoji: '🍦', label: 'Ice Cream' }, { emoji: '🍨', label: 'Ice Cream Cup' }, { emoji: '🥄', label: 'Yogurt' },
    
    // Bread & Grains
    { emoji: '🍞', label: 'Bread' }, { emoji: '🥖', label: 'Baguette' }, { emoji: '🥨', label: 'Pretzel' },
    { emoji: '🥯', label: 'Bagel' }, { emoji: '🧇', label: 'Waffle' }, { emoji: '🥞', label: 'Pancakes' },
    { emoji: '🍝', label: 'Pasta' }, { emoji: '🍚', label: 'Rice' }, { emoji: '🍜', label: 'Noodles' },
    { emoji: '🥣', label: 'Cereal' }, { emoji: '🍲', label: 'Stew' },
    
    // Prepared Foods
    { emoji: '🍕', label: 'Pizza' }, { emoji: '🍔', label: 'Burger' }, { emoji: '🌮', label: 'Taco' },
    { emoji: '🌯', label: 'Burrito' }, { emoji: '🥙', label: 'Stuffed Flatbread' }, { emoji: '🥗', label: 'Salad' },
    { emoji: '🍱', label: 'Bento Box' }, { emoji: '🍛', label: 'Curry' }, { emoji: '🍤', label: 'Fried Shrimp' },
    
    // Snacks
    { emoji: '🍿', label: 'Popcorn' }, { emoji: '🥨', label: 'Pretzel' }, { emoji: '🍪', label: 'Cookie' },
    { emoji: '🍩', label: 'Donut' }, { emoji: '🥜', label: 'Nuts' }, { emoji: '🍯', label: 'Honey' },
    
    // Desserts & Sweets
    { emoji: '🍰', label: 'Cake' }, { emoji: '🎂', label: 'Birthday Cake' }, { emoji: '🧁', label: 'Cupcake' },
    { emoji: '🍮', label: 'Pudding' }, { emoji: '🍭', label: 'Lollipop' }, { emoji: '🍬', label: 'Candy' },
    { emoji: '🍫', label: 'Chocolate' }, { emoji: '🥧', label: 'Pie' },
    
    // Beverages
    { emoji: '☕', label: 'Coffee' }, { emoji: '🍵', label: 'Tea' }, { emoji: '🥤', label: 'Soft Drink' },
    { emoji: '🧃', label: 'Juice Box' }, { emoji: '🧋', label: 'Bubble Tea' }, { emoji: '🍷', label: 'Wine' },
    { emoji: '🍺', label: 'Beer' }, { emoji: '💧', label: 'Water' },
    
    // Beauty & Personal Care
    { emoji: '💄', label: 'Lipstick' }, { emoji: '🧴', label: 'Lotion' }, { emoji: '🧼', label: 'Soap' },
    { emoji: '🌸', label: 'Perfume' }, { emoji: '💊', label: 'Pills' }, { emoji: '🩹', label: 'Bandage' },
    { emoji: '👁️', label: 'Eye Drops' }, { emoji: '🧽', label: 'Sponge' },
    
    // Household & Cleaning
    { emoji: '🧺', label: 'Laundry Basket' }, { emoji: '🔋', label: 'Battery' }, { emoji: '🧯', label: 'Fire Extinguisher' },
    { emoji: '🎨', label: 'Paint' }, { emoji: '🛢️', label: 'Oil Drum' }, { emoji: '⛽', label: 'Fuel' },
    { emoji: '🌞', label: 'Sun Protection' },
    
    // Health & Medical
    { emoji: '🩸', label: 'Blood Test' }, { emoji: '🍀', label: 'Herbs' }, { emoji: '🧪', label: 'Test Tube' },
    
    // Office & Tech
    { emoji: '🏷️', label: 'Label' }, { emoji: '🎟️', label: 'Ticket' }, { emoji: '📱', label: 'Phone' },
    { emoji: '🌱', label: 'Plant' },
    
    // Garden & Nature
    { emoji: '🌿', label: 'Leaves' },
  ];

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
      // Save image to storage and use the saved path
      const savedImageUri = await saveImageToStorage(result.assets[0].uri);
      if (savedImageUri) {
        setImageUri(savedImageUri);
        // Refresh saved photos list
        loadSavedPhotos();
      } else {
        // Fallback to original URI if save fails
        setImageUri(result.assets[0].uri);
      }
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
      // Save image to storage and use the saved path
      const savedImageUri = await saveImageToStorage(result.assets[0].uri);
      if (savedImageUri) {
        setImageUri(savedImageUri);
        // Refresh saved photos list
        loadSavedPhotos();
      } else {
        // Fallback to original URI if save fails
        setImageUri(result.assets[0].uri);
      }
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
    
    // Retry function for database operations
    const retryOperation = async (operation: () => Promise<void>, maxRetries = 3): Promise<void> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await operation();
          return; // Success
        } catch (error) {
          console.log(`Attempt ${attempt} failed:`, error);
          
          if (attempt === maxRetries) {
            throw error; // Last attempt failed
          }
          
          // Wait before retry, with exponential backoff
          const delay = attempt * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    try {
      // Update the food item with retry logic
      await retryOperation(async () => {
        await updateFoodItem({
          id: Number(id),
          name: itemName.trim(),
          quantity: parseInt(quantity),
          category_id: selectedCategory,
          location_id: selectedLocation,
          expiry_date: expiryDate.toISOString().split('T')[0],
          reminder_days: parseInt(reminderDays) || 0,
          notes: notes.trim(),
          image_uri: imageUri,
          created_at: getCurrentDate(),
        });
      });
      
      // Wait before refresh
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh data with retry logic
      await retryOperation(async () => {
        await refreshAll();
      });
      
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
      gap: 12,
      marginBottom: 24,
    },
    optionCard: {
      width: '48%',
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      padding: 16,
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
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 24,
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
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 16,
    },
    emojiGrid: {
      justifyContent: 'flex-start',
      gap: 8,
    },
    emojiItem: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
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
      fontSize: 14,
      fontWeight: '500',
      marginTop: 8,
      textAlign: 'center',
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

        <ScrollView style={styles.content} scrollEnabled={!isSaving}>
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
              {categories.map((category) => (
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
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addItem.storageLocation')}</Text>
            <View style={styles.optionsGrid}>
              {locations.map((location) => (
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
              ))}
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
              numColumns={6}
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
            <View style={styles.imageOptionsGrid}>
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  takePicture();
                }}
              >
                <FontAwesome name="camera" size={32} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>{t('image.takePhoto')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  pickImage();
                }}
              >
                <FontAwesome name="image" size={32} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>{t('image.chooseFromGallery')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showEmojiPicker();
                }}
              >
                <FontAwesome name="smile-o" size={32} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>{t('image.useFoodEmoji')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOptionItem}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showSavedPhotos();
                }}
              >
                <FontAwesome name="folder-open" size={32} color={theme.primaryColor} />
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