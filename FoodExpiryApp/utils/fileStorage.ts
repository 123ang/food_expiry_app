import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;
const IMAGE_BACKUP_KEY = 'image_backup_registry';
const IMAGE_VALIDATION_KEY = 'image_validation_cache';

// Image registry for tracking and backup
interface ImageRegistryEntry {
  uri: string;
  originalName: string;
  createdAt: string;
  isBackedUp: boolean;
  linkedToDatabase: boolean;
  fileSize?: number;
  lastValidated?: string;
}

// iOS App Store specific validation cache
interface ImageValidationCache {
  [key: string]: {
    exists: boolean;
    lastChecked: string;
    fileSize?: number;
  };
}

/**
 * Enhanced iOS compatibility check
 */
const ensureIOSCompatibility = async (): Promise<boolean> => {
  try {
    // Check if we have write permissions to documents directory
    const testFile = `${FileSystem.documentDirectory}ios_test.tmp`;
    await FileSystem.writeAsStringAsync(testFile, 'test', { encoding: FileSystem.EncodingType.UTF8 });
    await FileSystem.deleteAsync(testFile, { idempotent: true });
    return true;
  } catch (error) {
    console.error('iOS compatibility check failed:', error);
    return false;
  }
};

/**
 * Validate image cache for iOS App Store
 */
const validateImageCache = async (): Promise<void> => {
  try {
    const cacheData = await AsyncStorage.getItem(IMAGE_VALIDATION_KEY);
    const cache: ImageValidationCache = cacheData ? JSON.parse(cacheData) : {};
    const now = new Date().toISOString();
    
    // Clean up old cache entries (older than 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const cleanedCache: ImageValidationCache = {};
    
    for (const [path, data] of Object.entries(cache)) {
      if (data.lastChecked > cutoff) {
        cleanedCache[path] = data;
      }
    }
    
    await AsyncStorage.setItem(IMAGE_VALIDATION_KEY, JSON.stringify(cleanedCache));
  } catch (error) {
    console.error('Error validating image cache:', error);
  }
};

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
 * Get validation cache for iOS App Store compatibility
 */
const getValidationCache = async (): Promise<ImageValidationCache> => {
  try {
    const cacheData = await AsyncStorage.getItem(IMAGE_VALIDATION_KEY);
    return cacheData ? JSON.parse(cacheData) : {};
  } catch (error) {
    console.error('Error getting validation cache:', error);
    return {};
  }
};

/**
 * Update validation cache entry
 */
const updateValidationCache = async (imageUri: string, exists: boolean, fileSize?: number): Promise<void> => {
  try {
    const cache = await getValidationCache();
    cache[imageUri] = {
      exists,
      lastChecked: new Date().toISOString(),
      fileSize
    };
    
    await AsyncStorage.setItem(IMAGE_VALIDATION_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error updating validation cache:', error);
  }
};

/**
 * Enhanced iOS App Store compatible image verification
 * Uses caching and fallback mechanisms for production apps
 */
export const verifyImageExists = async (imageUri: string): Promise<boolean> => {
  try {
    if (!imageUri || imageUri.startsWith('emoji:')) {
      return true; // Emojis are always valid
    }
    
    // iOS App Store compatibility check
    if (Platform.OS === 'ios') {
      const cache = await getValidationCache();
      const cacheKey = imageUri;
      
      // Check cache first (for performance in production)
      if (cache[cacheKey]) {
        const cacheEntry = cache[cacheKey];
        const cacheAge = Date.now() - new Date(cacheEntry.lastChecked).getTime();
        
        // Use cached result if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          return cacheEntry.exists;
        }
      }
      
      // Verify file existence with enhanced error handling
      let exists = false;
      let fileSize = 0;
      
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        exists = fileInfo.exists;
        fileSize = 'size' in fileInfo ? (fileInfo.size || 0) : 0;
        
        // Additional iOS validation: ensure file is readable
        if (exists && Platform.OS === 'ios') {
          // Try to read file info to ensure it's not corrupted
          const readTest = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
            length: 100 // Just read first 100 bytes
          });
          exists = readTest.length > 0;
        }
      } catch (error) {
        console.warn(`Image verification failed for ${imageUri}:`, error);
        exists = false;
      }
      
      // Update cache
      await updateValidationCache(cacheKey, exists, fileSize);
      return exists;
    }
    
    // Non-iOS platforms (simplified check)
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error verifying image:', error);
    return false;
  }
};

/**
 * Enhanced iOS App Store compatible image saving
 * Includes validation, backup, and recovery mechanisms
 */
export const saveImageToStorage = async (sourceUri: string): Promise<string | null> => {
  try {
    // iOS App Store compatibility check
    if (Platform.OS === 'ios') {
      const isCompatible = await ensureIOSCompatibility();
      if (!isCompatible) {
        console.error('iOS file system not accessible');
        return null;
      }
    }
    
    // Ensure directory exists with proper permissions
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
      
      // iOS: Verify directory was created successfully
      if (Platform.OS === 'ios') {
        const verifyDir = await FileSystem.getInfoAsync(IMAGES_DIR);
        if (!verifyDir.exists) {
          throw new Error('Failed to create images directory on iOS');
        }
      }
    }
    
    // Generate unique filename with iOS-safe structure
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const safeFileName = `img_${timestamp}_${randomId}.jpg`;
    const destinationUri = `${IMAGES_DIR}${safeFileName}`;
    
    // iOS: Pre-validate source image
    if (Platform.OS === 'ios') {
      try {
        const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
        if (!sourceInfo.exists || !('size' in sourceInfo) || !sourceInfo.size) {
          throw new Error('Source image is invalid or empty');
        }
      } catch (error) {
        console.error('Source image validation failed:', error);
        return null;
      }
    }
    
    // Copy the image to permanent storage with error handling
    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });
    } catch (copyError) {
      console.error('Image copy failed:', copyError);
      
      // iOS: Try alternative copy method
      if (Platform.OS === 'ios') {
        try {
          // Read and write manually as fallback
          const imageData = await FileSystem.readAsStringAsync(sourceUri, {
            encoding: FileSystem.EncodingType.Base64
          });
          await FileSystem.writeAsStringAsync(destinationUri, imageData, {
            encoding: FileSystem.EncodingType.Base64
          });
        } catch (fallbackError) {
          console.error('Fallback copy method failed:', fallbackError);
          return null;
        }
      } else {
        return null;
      }
    }
    
    // Verify the image was saved successfully with enhanced validation
    const fileInfo = await FileSystem.getInfoAsync(destinationUri);
    if (!fileInfo.exists) {
      throw new Error('Failed to save image to storage');
    }
    
    // iOS: Additional validation
    if (Platform.OS === 'ios') {
      const fileSize = 'size' in fileInfo ? fileInfo.size : 0;
      if (!fileSize || fileSize < 100) { // Minimum reasonable image size
        await FileSystem.deleteAsync(destinationUri, { idempotent: true });
        throw new Error('Saved image is too small or corrupted');
      }
      
      // Test read access
      try {
        await FileSystem.readAsStringAsync(destinationUri, {
          encoding: FileSystem.EncodingType.Base64,
          length: 100
        });
      } catch (readError) {
        await FileSystem.deleteAsync(destinationUri, { idempotent: true });
        throw new Error('Saved image is not readable');
      }
    }
    
    // Add to backup registry with enhanced metadata
    const fileSize = 'size' in fileInfo ? fileInfo.size : 0;
    await addToImageRegistry(destinationUri, safeFileName, true, fileSize);
    
    // Update validation cache
    if (Platform.OS === 'ios') {
      await updateValidationCache(destinationUri, true, fileSize);
    }
    
    console.log(`Image saved successfully: ${destinationUri} (${fileSize} bytes)`);
    return destinationUri;
  } catch (error) {
    console.error('Error saving image to storage:', error);
    return null;
  }
};

/**
 * Enhanced iOS App Store compatible getSafeImageUri
 * Includes validation, recovery, and fallback mechanisms
 */
export const getSafeImageUri = async (sourceUri: string): Promise<string> => {
  try {
    // Handle emoji format
    if (sourceUri.startsWith('emoji:')) {
      return sourceUri;
    }
    
    // If it's already in our storage directory, validate it
    if (sourceUri.startsWith(IMAGES_DIR)) {
      const exists = await verifyImageExists(sourceUri);
      if (exists) {
        return sourceUri;
      }
      
      // iOS App Store: Try to recover broken image link
      if (Platform.OS === 'ios') {
        const recoveredUri = await attemptImageRecovery(sourceUri);
        if (recoveredUri) {
          console.log(`Recovered broken image link: ${sourceUri} -> ${recoveredUri}`);
          return recoveredUri;
        }
      }
      
      console.warn(`Stored image no longer exists: ${sourceUri}`);
      return '';
    }
    
    // iOS App Store: Enhanced validation for new images
    if (Platform.OS === 'ios') {
      // Validate source before processing
      try {
        const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
        if (!sourceInfo.exists) {
          console.error('Source image does not exist');
          return '';
        }
      } catch (error) {
        console.error('Cannot access source image:', error);
        return '';
      }
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
 * iOS App Store image recovery mechanism
 * Attempts to find images that may have moved due to iOS updates
 */
const attemptImageRecovery = async (brokenUri: string): Promise<string | null> => {
  try {
    if (Platform.OS !== 'ios') {
      return null;
    }
    
    // Extract filename from broken URI
    const fileName = brokenUri.split('/').pop();
    if (!fileName) {
      return null;
    }
    
    // Try different possible locations
    const possiblePaths = [
      `${IMAGES_DIR}${fileName}`,
      `${FileSystem.documentDirectory}${fileName}`,
      `${FileSystem.documentDirectory}images/${fileName}`,
    ];
    
    for (const possiblePath of possiblePaths) {
      try {
        const exists = await verifyImageExists(possiblePath);
        if (exists) {
          // Update validation cache with recovered path
          await updateValidationCache(possiblePath, true);
          return possiblePath;
        }
      } catch (error) {
        continue; // Try next path
      }
    }
    
    // Check backup registry for alternative locations
    try {
      const backupData = await AsyncStorage.getItem(IMAGE_BACKUP_KEY);
      if (backupData) {
        const registry: ImageRegistryEntry[] = JSON.parse(backupData);
        const entry = registry.find(r => r.originalName === fileName || r.uri.endsWith(fileName));
        
        if (entry && entry.uri !== brokenUri) {
          const exists = await verifyImageExists(entry.uri);
          if (exists) {
            return entry.uri;
          }
        }
      }
    } catch (error) {
      console.error('Error checking backup registry:', error);
    }
    
    return null;
  } catch (error) {
    console.error('Error during image recovery:', error);
    return null;
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
const addToImageRegistry = async (uri: string, fileName: string, linkedToDatabase: boolean = false, fileSize?: number): Promise<void> => {
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
    
    if (fileSize !== undefined) {
      newEntry.fileSize = fileSize;
    }
    
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
 * Get image storage statistics with iOS App Store compatibility info
 */
export const getImageStorageStats = async (): Promise<{
  totalImages: number;
  totalSize: number;
  registryEntries: number;
  databaseLinked: number;
  iosCompatible?: boolean;
  iosIssues?: string[];
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
    
    const result = {
      totalImages: images.length,
      totalSize,
      registryEntries: registry.length,
      databaseLinked
    };
    
    // Add iOS-specific information
    if (Platform.OS === 'ios') {
      try {
        const iosCompatible = await ensureIOSCompatibility();
        return {
          ...result,
          iosCompatible,
          iosIssues: iosCompatible ? [] : ['File system access restricted']
        };
      } catch (error) {
        return {
          ...result,
          iosCompatible: false,
          iosIssues: [`iOS compatibility check failed: ${error}`]
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error getting image storage stats:', error);
    return { 
      totalImages: 0, 
      totalSize: 0, 
      registryEntries: 0, 
      databaseLinked: 0,
      iosCompatible: false,
      iosIssues: [`Stats collection failed: ${error}`]
    };
  }
};

/**
 * iOS App Store compatibility initialization
 * Call this when the app starts to ensure image system works properly
 */
export const initializeImageSystemForIOS = async (): Promise<{
  success: boolean;
  compatibilityIssues: string[];
  recoveredImages: number;
}> => {
  const result = {
    success: false,
    compatibilityIssues: [] as string[],
    recoveredImages: 0
  };
  
  try {
    console.log('Initializing image system for iOS App Store compatibility...');
    
    // 1. Check iOS compatibility
    if (Platform.OS === 'ios') {
      const isCompatible = await ensureIOSCompatibility();
      if (!isCompatible) {
        result.compatibilityIssues.push('File system access restricted');
        return result;
      }
    }
    
    // 2. Ensure images directory exists
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
        console.log('Created images directory');
      }
    } catch (error) {
      result.compatibilityIssues.push('Cannot create images directory');
      return result;
    }
    
    // 3. Validate existing image cache
    await validateImageCache();
    
    // 4. iOS-specific: Scan for broken image links and attempt recovery
    if (Platform.OS === 'ios') {
      try {
        const backupData = await AsyncStorage.getItem(IMAGE_BACKUP_KEY);
        if (backupData) {
          const registry: ImageRegistryEntry[] = JSON.parse(backupData);
          let recoveredCount = 0;
          
          for (const entry of registry) {
            if (entry.linkedToDatabase) {
              const exists = await verifyImageExists(entry.uri);
              if (!exists) {
                const recovered = await attemptImageRecovery(entry.uri);
                if (recovered) {
                  // Update registry with new location
                  entry.uri = recovered;
                  entry.lastValidated = new Date().toISOString();
                  recoveredCount++;
                }
              }
            }
          }
          
          if (recoveredCount > 0) {
            await AsyncStorage.setItem(IMAGE_BACKUP_KEY, JSON.stringify(registry));
            result.recoveredImages = recoveredCount;
            console.log(`Recovered ${recoveredCount} image links`);
          }
        }
      } catch (error) {
        console.error('Error during image recovery scan:', error);
        result.compatibilityIssues.push('Image recovery scan failed');
      }
    }
    
    // 5. Success
    result.success = true;
    console.log('Image system initialization completed successfully');
    
  } catch (error) {
    console.error('Image system initialization failed:', error);
    result.compatibilityIssues.push(`Initialization error: ${error}`);
  }
  
  return result;
}; 