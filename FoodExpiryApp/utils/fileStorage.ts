import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;
const IMAGE_BACKUP_KEY = 'image_backup_registry';

// Image registry for tracking and backup
interface ImageRegistryEntry {
  uri: string;
  originalName: string;
  createdAt: string;
  isBackedUp: boolean;
  linkedToDatabase: boolean;
}

/**
 * Initialize the images directory
 */
export const initializeImageStorage = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }
    
    // Just perform a simple backup of existing images
    await backupImageRegistry();
  } catch (error) {
    console.error('Error initializing image storage:', error);
  }
};

/**
 * Backup image registry to AsyncStorage for persistence across updates
 */
const backupImageRegistry = async (): Promise<void> => {
  try {
    // Direct file system access to avoid circular dependency
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      return; // No images directory, nothing to backup
    }
    
    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    const imageFiles = files
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'))
      .map(file => `${IMAGES_DIR}${file}`);
    
    const registry: ImageRegistryEntry[] = imageFiles.map(uri => ({
      uri,
      originalName: uri.split('/').pop() || 'unknown',
      createdAt: new Date().toISOString(),
      isBackedUp: true,
      linkedToDatabase: true
    }));
    
    await AsyncStorage.setItem(IMAGE_BACKUP_KEY, JSON.stringify(registry));
  } catch (error) {
    console.error('Error backing up image registry:', error);
  }
};

/**
 * Restore images from backup if needed
 */
export const restoreImagesFromBackup = async (): Promise<boolean> => {
  try {
    const backupData = await AsyncStorage.getItem(IMAGE_BACKUP_KEY);
    if (!backupData) return false;
    
    const registry: ImageRegistryEntry[] = JSON.parse(backupData);
    let restoredCount = 0;
    
    for (const entry of registry) {
      // Check if image still exists
      const fileInfo = await FileSystem.getInfoAsync(entry.uri);
      if (!fileInfo.exists) {
        // Image is missing, try to restore from backup or mark as lost
        console.warn(`Image ${entry.originalName} is missing and cannot be restored`);
      } else {
        restoredCount++;
      }
    }
    
    return restoredCount > 0;
  } catch (error) {
    console.error('Error restoring images from backup:', error);
    return false;
  }
};

/**
 * Save an image to the app's storage and return the saved file path
 * This creates a permanent, database-linkable image file
 */
export const saveImageToStorage = async (sourceUri: string): Promise<string | null> => {
  try {
    // Ensure directory exists but don't run full initialization to avoid circular calls
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }
    
    // Generate unique filename with better structure
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `img_${timestamp}_${randomId}.jpg`;
    const destinationUri = `${IMAGES_DIR}${fileName}`;
    
    // Copy the image to our PERMANENT storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    
    // Verify the image was saved successfully
    const fileInfo = await FileSystem.getInfoAsync(destinationUri);
    if (!fileInfo.exists) {
      throw new Error('Failed to save image to storage');
    }
    
    // Add to backup registry with database link flag
    await addToImageRegistry(destinationUri, fileName, true);
    
    console.log(`Image saved successfully: ${destinationUri}`);
    return destinationUri;
  } catch (error) {
    console.error('Error saving image to storage:', error);
    return null;
  }
};

/**
 * Verify image exists and is accessible
 * This ensures database image URIs are always valid
 */
export const verifyImageExists = async (imageUri: string): Promise<boolean> => {
  try {
    if (!imageUri || imageUri.startsWith('emoji:')) {
      return true; // Emojis are always valid
    }
    
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error verifying image:', error);
    return false;
  }
};

/**
 * Get a safe image URI for database storage
 * Returns the permanent file path that will persist across updates
 */
export const getSafeImageUri = async (sourceUri: string): Promise<string> => {
  try {
    // If it's already in our storage directory, return as-is
    if (sourceUri.startsWith(IMAGES_DIR)) {
      const exists = await verifyImageExists(sourceUri);
      return exists ? sourceUri : '';
    }
    
    // If it's an emoji, return as-is
    if (sourceUri.startsWith('emoji:')) {
      return sourceUri;
    }
    
    // Otherwise, save to our permanent storage
    const savedUri = await saveImageToStorage(sourceUri);
    return savedUri || '';
  } catch (error) {
    console.error('Error getting safe image URI:', error);
    return '';
  }
};

/**
 * Clean orphaned images that are not linked to any database records
 */
export const cleanupOrphanedImages = async (databaseImageUris: string[]): Promise<number> => {
  try {
    const allStoredImages = await getSavedImages();
    const orphanedImages: string[] = [];
    
    for (const storedImage of allStoredImages) {
      // Check if this image is referenced in the database
      const isLinked = databaseImageUris.some(dbUri => 
        dbUri === storedImage || dbUri.endsWith(storedImage.split('/').pop() || '')
      );
      
      if (!isLinked) {
        orphanedImages.push(storedImage);
      }
    }
    
    // Delete orphaned images
    for (const orphanedImage of orphanedImages) {
      await deleteImageFromStorage(orphanedImage);
    }
    
    return orphanedImages.length;
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
    return 0;
  }
};

/**
 * Validate and repair database image links
 */
export const validateDatabaseImageLinks = async (databaseImageUris: string[]): Promise<{
  valid: string[];
  broken: string[];
  repaired: string[];
}> => {
  const result = {
    valid: [] as string[],
    broken: [] as string[],
    repaired: [] as string[]
  };
  
  try {
    for (const imageUri of databaseImageUris) {
      if (!imageUri || imageUri.startsWith('emoji:')) {
        result.valid.push(imageUri);
        continue;
      }
      
      const exists = await verifyImageExists(imageUri);
      if (exists) {
        result.valid.push(imageUri);
      } else {
        // Try to find the image by filename
        const fileName = imageUri.split('/').pop();
        if (fileName) {
          const possiblePath = `${IMAGES_DIR}${fileName}`;
          const foundExists = await verifyImageExists(possiblePath);
          if (foundExists) {
            result.repaired.push(possiblePath);
            console.log(`Repaired image link: ${imageUri} -> ${possiblePath}`);
          } else {
            result.broken.push(imageUri);
            console.warn(`Broken image link: ${imageUri}`);
          }
        } else {
          result.broken.push(imageUri);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error validating database image links:', error);
    return result;
  }
};

/**
 * Add image to backup registry
 */
const addToImageRegistry = async (uri: string, fileName: string, linkedToDatabase: boolean = false): Promise<void> => {
  try {
    const backupData = await AsyncStorage.getItem(IMAGE_BACKUP_KEY);
    const registry: ImageRegistryEntry[] = backupData ? JSON.parse(backupData) : [];
    
    const newEntry: ImageRegistryEntry = {
      uri,
      originalName: fileName,
      createdAt: new Date().toISOString(),
      isBackedUp: true,
      linkedToDatabase
    };
    
    registry.push(newEntry);
    await AsyncStorage.setItem(IMAGE_BACKUP_KEY, JSON.stringify(registry));
  } catch (error) {
    console.error('Error adding to image registry:', error);
  }
};

/**
 * Remove image from backup registry
 */
const removeFromImageRegistry = async (uri: string): Promise<void> => {
  try {
    const backupData = await AsyncStorage.getItem(IMAGE_BACKUP_KEY);
    if (!backupData) return;
    
    const registry: ImageRegistryEntry[] = JSON.parse(backupData);
    const updatedRegistry = registry.filter(entry => entry.uri !== uri);
    
    await AsyncStorage.setItem(IMAGE_BACKUP_KEY, JSON.stringify(updatedRegistry));
  } catch (error) {
    console.error('Error removing from image registry:', error);
  }
};

/**
 * Get all saved images from storage
 */
export const getSavedImages = async (): Promise<string[]> => {
  try {
    // Ensure directory exists but don't run full initialization to avoid circular calls
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }
    
    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    const imageFiles = files
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'))
      .map(file => `${IMAGES_DIR}${file}`)
      .sort((a, b) => b.localeCompare(a)); // Sort by newest first
    
    return imageFiles;
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
      // Remove from backup registry
      await removeFromImageRegistry(imageUri);
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

/**
 * Get image storage statistics
 */
export const getImageStorageStats = async (): Promise<{
  totalImages: number;
  totalSize: number;
  registryEntries: number;
  databaseLinked: number;
}> => {
  try {
    const images = await getSavedImages();
    let totalSize = 0;
    
    for (const imageUri of images) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size || 0;
        }
      } catch (error) {
        console.warn(`Error getting size for ${imageUri}:`, error);
      }
    }
    
    const backupData = await AsyncStorage.getItem(IMAGE_BACKUP_KEY);
    const registry: ImageRegistryEntry[] = backupData ? JSON.parse(backupData) : [];
    const databaseLinked = registry.filter(entry => entry.linkedToDatabase).length;
    
    return {
      totalImages: images.length,
      totalSize,
      registryEntries: registry.length,
      databaseLinked
    };
  } catch (error) {
    console.error('Error getting image storage stats:', error);
    return { totalImages: 0, totalSize: 0, registryEntries: 0, databaseLinked: 0 };
  }
}; 