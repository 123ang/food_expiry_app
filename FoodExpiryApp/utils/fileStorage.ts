import * as FileSystem from 'expo-file-system';

const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;

/**
 * Initialize the images directory
 */
export const initializeImageStorage = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing image storage:', error);
  }
};

/**
 * Save an image to the app's storage and return the saved file path
 */
export const saveImageToStorage = async (sourceUri: string): Promise<string | null> => {
  try {
    await initializeImageStorage();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `img_${timestamp}_${randomId}.jpg`;
    const destinationUri = `${IMAGES_DIR}${fileName}`;
    
    // Copy the image to our storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    
    return destinationUri;
  } catch (error) {
    console.error('Error saving image to storage:', error);
    return null;
  }
};

/**
 * Get all saved images from storage
 */
export const getSavedImages = async (): Promise<string[]> => {
  try {
    await initializeImageStorage();
    
    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    return files
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'))
      .map(file => `${IMAGES_DIR}${file}`)
      .sort((a, b) => b.localeCompare(a)); // Sort by newest first
  } catch (error) {
    console.error('Error getting saved images:', error);
    return [];
  }
};

/**
 * Delete an image from storage
 */
export const deleteImageFromStorage = async (imageUri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imageUri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    return false;
  }
};

/**
 * Clean up unused images (images not referenced in any food item)
 */
export const cleanupUnusedImages = async (usedImageUris: string[]): Promise<void> => {
  try {
    const allSavedImages = await getSavedImages();
    const unusedImages = allSavedImages.filter(imageUri => !usedImageUris.includes(imageUri));
    
    for (const unusedImage of unusedImages) {
      await deleteImageFromStorage(unusedImage);
    }
  } catch (error) {
    console.error('Error cleaning up unused images:', error);
  }
};

/**
 * Check if a URI is a saved image (in our app's storage)
 */
export const isSavedImage = (uri: string): boolean => {
  return uri.startsWith(IMAGES_DIR);
}; 