import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { saveImageToStorage, getSavedImages } from '../utils/fileStorage';
import { DatePicker } from '../components/DatePicker';
import { getCurrentDate } from '../database/database';
import { BottomNav } from '../components/BottomNav';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';
import { FoodItem } from '../database/models';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function AddScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { createFoodItem, refreshFoodItems, refreshAll, locations, categories, foodItems } = useDatabase();
  const { prefilledDate } = useLocalSearchParams();
  
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

  // Category emojis for selection
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
  ];

  useEffect(() => {
    if (prefilledDate && typeof prefilledDate === 'string') {
      // Parse the date string manually to avoid timezone issues
      const [year, month, day] = prefilledDate.split('-').map(Number);
      setExpiryDate(new Date(year, month - 1, day)); // month is 0-indexed
    }
    loadSavedPhotos();
  }, [prefilledDate]);

  const loadSavedPhotos = async () => {
    try {
      // Get all saved photos from file storage
      const photos = await getSavedImages();
      setSavedPhotos(photos);
    } catch (error) {
      console.error('Error loading saved photos:', error);
    }
  };

  const pickImage = async () => {
    // Request permission first
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
    // Request permission first
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
      Alert.alert(t('alert.error'), t('error.enterItemName'));
      return;
    }

    if (!selectedLocation) {
      Alert.alert(t('alert.error'), t('error.selectStorageLocation'));
      return;
    }

    try {
      const item: Omit<FoodItem, 'id'> = {
        name: itemName.trim(),
        quantity: parseInt(quantity) || 1,
        category_id: selectedCategory,
        location_id: selectedLocation,
        expiry_date: expiryDate.toISOString().split('T')[0],
        reminder_days: parseInt(reminderDays) || 3,
        notes: notes.trim() || null,
        image_uri: imageUri,
        created_at: new Date().toISOString().split('T')[0]
      };

      const id = await createFoodItem(item);

      // Navigate back to home
      router.push('/');
    } catch (error) {
      console.error('Error creating food item:', error);
      Alert.alert(
        t('alert.error'), 
        error instanceof Error ? error.message : t('error.failedToCreate')
      );
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
      backgroundColor: `${theme.primaryColor}10`,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.primaryColor}20`,
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
      borderRadius: 4,
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
    imageOptionText: {
      color: theme.textColor,
      fontSize: 16,
      marginLeft: 16,
      fontWeight: '500',
    },
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('addItem.title')}</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('form.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
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
                    <FontAwesome name="camera" size={32} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, marginTop: 8 }}>{t('image.addPhoto')}</Text>
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
                minimumDate={new Date()}
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
            <Text style={styles.modalTitle}>Add Photo</Text>
            <Text style={styles.modalSubtitle}>Choose how you want to add a photo</Text>
            
            <View style={styles.imageOptionsContainer}>
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  takePicture();
                }}
              >
                <FontAwesome name="camera" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  pickImage();
                }}
              >
                <FontAwesome name="image" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showEmojiPicker();
                }}
              >
                <FontAwesome name="smile-o" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>Use Food Emoji</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageOptionButton}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showSavedPhotos();
                }}
              >
                <FontAwesome name="folder" size={24} color={theme.primaryColor} />
                <Text style={styles.imageOptionText}>My Saved Photos</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowImageOptionsModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <BottomNav />
    </>
  );
}