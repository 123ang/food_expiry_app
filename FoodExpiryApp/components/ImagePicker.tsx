import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePickerExpo from 'expo-image-picker';
import { useLanguage } from '../context/LanguageContext';
import { getSavedImages, getSafeImageUri } from '../utils/fileStorage';
import { ImageDisplayContext, getOptimizedImageUri } from '../utils/imageUtils';
import { CATEGORY_EMOJIS } from '../constants/emojis';

interface ImagePickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string | null) => void;
  theme: any;
  showThumbnail?: boolean;
  thumbnailSize?: number;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  imageUri,
  onImageSelected,
  theme,
  showThumbnail = false,
  thumbnailSize = 60,
}) => {
  const { t } = useLanguage();
  const [showImageOptionsModal, setShowImageOptionsModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);
  const [optimizedImageUri, setOptimizedImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSavedPhotos();
  }, []);

  useEffect(() => {
    const updateOptimizedUri = async () => {
      if (imageUri) {
        const optimized = await getOptimizedImageUri(imageUri, ImageDisplayContext.EDIT_PREVIEW);
        setOptimizedImageUri(optimized);
      } else {
        setOptimizedImageUri(null);
      }
    };
    
    updateOptimizedUri();
  }, [imageUri]);

  const loadSavedPhotos = async () => {
    try {
      const photos = await getSavedImages();
      setSavedPhotos(photos);
    } catch (error) {
      console.error('Error loading saved photos:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const safeImageUri = await getSafeImageUri(result.assets[0].uri);
        
        if (safeImageUri) {
          onImageSelected(safeImageUri);
        } else {
          Alert.alert(t('alert.error'), t('alert.failedToSaveImage'));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const cameraPermission = await ImagePickerExpo.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert(t('alert.error'), t('alert.cameraPermissionDenied'));
        return;
      }
      
      const result = await ImagePickerExpo.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1.0,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsSaving(true);
        
        try {
          const safeImageUri = await getSafeImageUri(result.assets[0].uri);
          
          if (safeImageUri) {
            onImageSelected(safeImageUri);
          } else {
            Alert.alert(t('alert.error'), t('alert.failedToSaveImage'));
          }
        } finally {
          setIsSaving(false);
        }
      }
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.cameraError'));
      console.error('Camera error:', error);
    }
  };

  const showImageOptions = () => {
    setShowImageOptionsModal(true);
  };

  const removeImage = () => {
    onImageSelected(null);
  };

  const showEmojiPicker = () => {
    setShowEmojiModal(true);
  };

  const showSavedPhotos = () => {
    setShowPhotosModal(true);
  };

  const selectEmoji = (emoji: string) => {
    onImageSelected(`emoji:${emoji}`);
    setShowEmojiModal(false);
  };

  const selectSavedPhoto = (uri: string) => {
    onImageSelected(uri);
    setShowPhotosModal(false);
  };

  // Render just the icon button if in thumbnail mode
  if (showThumbnail) {
    return (
      <>
        <TouchableOpacity
          style={styles.thumbnailButton}
          onPress={showImageOptions}
        >
          {imageUri ? (
            imageUri.startsWith('emoji:') ? (
              <View style={[styles.thumbnail, { 
                width: thumbnailSize, 
                height: thumbnailSize, 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: `${theme.primaryColor}10`,
                borderRadius: 4
              }]}>
                <Text style={{ fontSize: thumbnailSize * 0.6 }}>{imageUri.replace('emoji:', '')}</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: optimizedImageUri || imageUri }} 
                style={[styles.thumbnail, { width: thumbnailSize, height: thumbnailSize }]} 
              />
            )
          ) : (
            <FontAwesome name="camera" size={24} color={theme.primaryColor} />
          )}
        </TouchableOpacity>

        {/* Image Options Modal */}
        <Modal
          visible={showImageOptionsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageOptionsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>{t('image.addPhoto')}</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{t('image.choosePhotoMethod')}</Text>
              
              <View style={styles.imageOptionsContainer}>
                <TouchableOpacity 
                  style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                  onPress={() => {
                    setShowImageOptionsModal(false);
                    takePhoto();
                  }}
                >
                  <FontAwesome name="camera" size={24} color={theme.primaryColor} />
                  <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.takePhoto')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                  onPress={() => {
                    setShowImageOptionsModal(false);
                    pickImage();
                  }}
                >
                  <FontAwesome name="image" size={24} color={theme.primaryColor} />
                  <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.chooseFromGallery')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                  onPress={() => {
                    setShowImageOptionsModal(false);
                    showEmojiPicker();
                  }}
                >
                  <FontAwesome name="smile-o" size={24} color={theme.primaryColor} />
                  <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.useFoodEmoji')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                  onPress={() => {
                    setShowImageOptionsModal(false);
                    showSavedPhotos();
                  }}
                >
                  <FontAwesome name="folder" size={24} color={theme.primaryColor} />
                  <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.mySavedPhotos')}</Text>
                </TouchableOpacity>

                {imageUri && (
                  <TouchableOpacity 
                    style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.dangerColor }]}
                    onPress={() => {
                      setShowImageOptionsModal(false);
                      removeImage();
                    }}
                  >
                    <FontAwesome name="trash" size={24} color={theme.dangerColor} />
                    <Text style={[styles.imageOptionText, { color: theme.dangerColor }]}>{t('image.removePhoto')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
                onPress={() => setShowImageOptionsModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: theme.textColor }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Emoji Picker Modal */}
        <Modal
          visible={showEmojiModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmojiModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>{t('image.selectEmoji')}</Text>
              <FlatList
                data={CATEGORY_EMOJIS}
                numColumns={5}
                keyExtractor={(item, index) => index.toString()}
                columnWrapperStyle={styles.emojiGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.emojiItem, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
                    onPress={() => selectEmoji(item.emoji)}
                  >
                    <Text style={styles.emojiItemText}>{item.emoji}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.emojiListContent}
              />
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
                onPress={() => setShowEmojiModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: theme.textColor }]}>{t('common.cancel')}</Text>
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
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>{t('image.selectSavedPhoto')}</Text>
              {savedPhotos.length > 0 ? (
                <FlatList
                  data={savedPhotos}
                  numColumns={3}
                  keyExtractor={(item, index) => index.toString()}
                  columnWrapperStyle={styles.photoGrid}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => selectSavedPhoto(item)}
                    >
                      <Image 
                        source={{ uri: item }} 
                        style={[styles.photoItem, { borderColor: theme.borderColor }]} 
                      />
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={[styles.noPhotosText, { color: theme.textSecondary }]}>{t('image.noSavedPhotos')}</Text>
              )}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
                onPress={() => setShowPhotosModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: theme.textColor }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Full image picker UI
  return (
    <View style={[styles.imageContainer, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
      {imageUri ? (
        <>
          <TouchableOpacity onPress={showImageOptions}>
            {imageUri.startsWith('emoji:') ? (
              <View style={[styles.imagePreview, { justifyContent: 'center', alignItems: 'center', backgroundColor: `${theme.primaryColor}10` }]}>
                <Text style={{ fontSize: 48 }}>{imageUri.replace('emoji:', '')}</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: optimizedImageUri || imageUri }} 
                style={styles.imagePreview} 
              />
            )}
          </TouchableOpacity>
          <View style={styles.imageButtons}>
            <TouchableOpacity 
              style={[styles.imageButton, { backgroundColor: theme.primaryColor }]}
              onPress={showImageOptions}
            >
              <FontAwesome name="camera" size={14} color="#FFFFFF" />
              <Text style={styles.imageButtonText}>{t('image.changePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.imageButton, styles.imageButtonSecondary, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
              onPress={removeImage}
            >
              <FontAwesome name="trash" size={14} color={theme.textColor} />
              <Text style={[styles.imageButtonText, styles.imageButtonTextSecondary, { color: theme.textColor }]}>{t('image.removePhoto')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.imagePlaceholder, { backgroundColor: `${theme.primaryColor}10`, borderColor: theme.borderColor }]}
            onPress={showImageOptions}
          >
            <FontAwesome name="camera" size={32} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 8 }}>{t('image.addPhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.imageButton, { backgroundColor: theme.primaryColor }]}
            onPress={showImageOptions}
          >
            <FontAwesome name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.imageButtonText}>{t('image.addPhoto')}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>{t('image.addPhoto')}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{t('image.choosePhotoMethod')}</Text>
            
            <View style={styles.imageOptionsContainer}>
              <TouchableOpacity 
                style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  takePhoto();
                }}
              >
                <FontAwesome name="camera" size={24} color={theme.primaryColor} />
                <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.takePhoto')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  pickImage();
                }}
              >
                <FontAwesome name="image" size={24} color={theme.primaryColor} />
                <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.chooseFromGallery')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showEmojiPicker();
                }}
              >
                <FontAwesome name="smile-o" size={24} color={theme.primaryColor} />
                <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.useFoodEmoji')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageOptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
                onPress={() => {
                  setShowImageOptionsModal(false);
                  showSavedPhotos();
                }}
              >
                <FontAwesome name="folder" size={24} color={theme.primaryColor} />
                <Text style={[styles.imageOptionText, { color: theme.textColor }]}>{t('image.mySavedPhotos')}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
              onPress={() => setShowImageOptionsModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.textColor }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>{t('image.selectEmoji')}</Text>
            <FlatList
              data={CATEGORY_EMOJIS}
              numColumns={5}
              keyExtractor={(item, index) => index.toString()}
              columnWrapperStyle={styles.emojiGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.emojiItem, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
                  onPress={() => selectEmoji(item.emoji)}
                >
                  <Text style={styles.emojiItemText}>{item.emoji}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.emojiListContent}
            />
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
              onPress={() => setShowEmojiModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.textColor }]}>{t('common.cancel')}</Text>
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
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>{t('image.selectSavedPhoto')}</Text>
            {savedPhotos.length > 0 ? (
              <FlatList
                data={savedPhotos}
                numColumns={3}
                keyExtractor={(item, index) => index.toString()}
                columnWrapperStyle={styles.photoGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => selectSavedPhoto(item)}
                  >
                    <Image 
                      source={{ uri: item }} 
                      style={[styles.photoItem, { borderColor: theme.borderColor }]} 
                    />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={[styles.noPhotosText, { color: theme.textSecondary }]}>{t('image.noSavedPhotos')}</Text>
            )}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
              onPress={() => setShowPhotosModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.textColor }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageButtonSecondary: {
    borderWidth: 1,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  imageButtonTextSecondary: {
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
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
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  imageOptionText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  emojiGrid: {
    justifyContent: 'space-between',
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
    borderRadius: 8,
    borderWidth: 1,
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
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  noPhotosText: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 32,
  },
  thumbnail: {
    borderRadius: 8,
  },
  thumbnailButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 