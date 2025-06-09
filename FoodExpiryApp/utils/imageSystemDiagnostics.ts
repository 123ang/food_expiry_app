import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { 
  getSavedImages, 
  verifyImageExists, 
  getImageStorageStats,
  initializeImageSystemForIOS 
} from './fileStorage';

interface DiagnosticResult {
  timestamp: string;
  platform: string;
  overallHealth: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  stats: {
    totalImages: number;
    workingImages: number;
    brokenImages: number;
    databaseLinkedImages: number;
    storageSize: string;
  };
  iosSpecific?: {
    fileSystemAccessible: boolean;
    recoveredImages: number;
    compatibilityIssues: string[];
  };
}

/**
 * Run comprehensive image system diagnostics
 * This helps users understand if their images are working properly after iOS updates
 */
export const runImageSystemDiagnostics = async (): Promise<DiagnosticResult> => {
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    overallHealth: 'healthy',
    issues: [],
    recommendations: [],
    stats: {
      totalImages: 0,
      workingImages: 0,
      brokenImages: 0,
      databaseLinkedImages: 0,
      storageSize: '0 MB'
    }
  };

  try {
    console.log('Running image system diagnostics...');

    // 1. Get basic storage stats
    const storageStats = await getImageStorageStats();
    result.stats.totalImages = storageStats.totalImages;
    result.stats.databaseLinkedImages = storageStats.databaseLinked;
    result.stats.storageSize = `${(storageStats.totalSize / (1024 * 1024)).toFixed(2)} MB`;

    // 2. Check each saved image
    const savedImages = await getSavedImages();
    let workingCount = 0;
    let brokenCount = 0;

    for (const imageUri of savedImages) {
      const exists = await verifyImageExists(imageUri);
      if (exists) {
        workingCount++;
      } else {
        brokenCount++;
        result.issues.push(`Broken image: ${imageUri.split('/').pop()}`);
      }
    }

    result.stats.workingImages = workingCount;
    result.stats.brokenImages = brokenCount;

    // 3. Check database image references - simplified approach
    try {
      const imageBackupKey = 'image_backup_registry';
      const backupData = await AsyncStorage.getItem(imageBackupKey);
      if (backupData) {
        const registry = JSON.parse(backupData);
        const databaseLinkedImages = registry.filter((entry: any) => entry.linkedToDatabase);
        
        let databaseBrokenCount = 0;
        for (const entry of databaseLinkedImages) {
          const exists = await verifyImageExists(entry.uri);
          if (!exists) {
            databaseBrokenCount++;
            result.issues.push(`Database references broken image: ${entry.uri?.split('/').pop()}`);
          }
        }

        if (databaseBrokenCount > 0) {
          result.recommendations.push(`${databaseBrokenCount} food items have broken image links. Try refreshing the app or re-adding images.`);
        }
      }
    } catch (error) {
      result.issues.push('Could not check database image references');
    }

    // 4. iOS-specific diagnostics
    if (Platform.OS === 'ios') {
      try {
        const iosResult = await initializeImageSystemForIOS();
        result.iosSpecific = {
          fileSystemAccessible: iosResult.success,
          recoveredImages: iosResult.recoveredImages,
          compatibilityIssues: iosResult.compatibilityIssues
        };

        if (!iosResult.success) {
          result.issues.push(...iosResult.compatibilityIssues);
          result.recommendations.push('iOS file system access is restricted. Try restarting the app or reinstalling if issues persist.');
        }

        if (iosResult.recoveredImages > 0) {
          result.recommendations.push(`Successfully recovered ${iosResult.recoveredImages} image links that were broken due to iOS updates.`);
        }

        // Include iOS-specific stats
        if (storageStats.iosCompatible === false && storageStats.iosIssues) {
          result.issues.push(...storageStats.iosIssues);
        }
      } catch (error) {
        result.issues.push(`iOS diagnostics failed: ${error}`);
      }
    }

    // 5. Determine overall health
    const criticalIssues = result.issues.filter(issue => 
      issue.includes('file system') || 
      issue.includes('access restricted') ||
      issue.includes('initialization failed')
    );

    if (criticalIssues.length > 0) {
      result.overallHealth = 'critical';
      result.recommendations.push('Critical issues detected. Consider reinstalling the app or contacting support.');
    } else if (result.stats.brokenImages > result.stats.totalImages * 0.3) {
      result.overallHealth = 'warning';
      result.recommendations.push('Many images are broken. This often happens after iOS updates. The app is attempting to recover them automatically.');
    } else if (result.issues.length > 0) {
      result.overallHealth = 'warning';
      result.recommendations.push('Minor issues detected. Most functionality should work normally.');
    }

    // 6. Add general recommendations
    if (result.stats.totalImages === 0) {
      result.recommendations.push('No images found. This is normal for new installations.');
    }

    if (Platform.OS === 'ios' && result.issues.length === 0) {
      result.recommendations.push('Image system is healthy. All images should display correctly.');
    }

  } catch (error) {
    result.overallHealth = 'critical';
    result.issues.push(`Diagnostics failed: ${error}`);
    result.recommendations.push('Unable to complete diagnostics. Please try restarting the app.');
  }

  console.log('Image system diagnostics completed:', result.overallHealth);
  return result;
};

/**
 * Get a user-friendly summary of image system health
 */
export const getImageSystemHealthSummary = async (): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  actionRequired: boolean;
}> => {
  const diagnostics = await runImageSystemDiagnostics();
  
  switch (diagnostics.overallHealth) {
    case 'healthy':
      return {
        status: 'healthy',
        message: `✅ Image system is working correctly. ${diagnostics.stats.workingImages} images available.`,
        actionRequired: false
      };
    
    case 'warning':
      return {
        status: 'warning',
        message: `⚠️ ${diagnostics.stats.brokenImages} images need attention. Most features work normally.`,
        actionRequired: false
      };
    
    case 'critical':
      return {
        status: 'critical',
        message: `❌ Image system needs attention. ${diagnostics.issues.length} issues detected.`,
        actionRequired: true
      };
    
    default:
      return {
        status: 'warning',
        message: '❓ Unable to determine image system status.',
        actionRequired: false
      };
  }
};

/**
 * Attempt to fix common image system issues
 */
export const attemptImageSystemRepair = async (): Promise<{
  success: boolean;
  fixesApplied: string[];
  remainingIssues: string[];
}> => {
  const result = {
    success: false,
    fixesApplied: [] as string[],
    remainingIssues: [] as string[]
  };

  try {
    console.log('Attempting image system repair...');

    // 1. iOS-specific repairs
    if (Platform.OS === 'ios') {
      const iosResult = await initializeImageSystemForIOS();
      if (iosResult.success) {
        result.fixesApplied.push('iOS image system initialized successfully');
        
        if (iosResult.recoveredImages > 0) {
          result.fixesApplied.push(`Recovered ${iosResult.recoveredImages} broken image links`);
        }
      } else {
        result.remainingIssues.push(...iosResult.compatibilityIssues);
      }
    }

    // 2. Re-run diagnostics to check current state
    const postRepairDiagnostics = await runImageSystemDiagnostics();
    
    if (postRepairDiagnostics.overallHealth === 'healthy') {
      result.success = true;
      result.fixesApplied.push('Image system health restored');
    } else {
      result.remainingIssues.push(...postRepairDiagnostics.issues);
    }

  } catch (error) {
    result.remainingIssues.push(`Repair failed: ${error}`);
  }

  return result;
}; 