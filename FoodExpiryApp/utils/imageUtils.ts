/**
 * Image utility functions for optimizing image display
 */
import { generateThumbnail } from './fileStorage';
import { imageConfig } from '../constants/imageConfig';

/**
 * Image display context - determines which image version to use
 */
export enum ImageDisplayContext {
  LIST_ITEM = 'list_item',
  DETAIL_VIEW = 'detail_view',
  EDIT_PREVIEW = 'edit_preview',
}

/**
 * Get the appropriate image URI for the current display context
 * Helps optimize performance by using thumbnails when appropriate
 * 
 * @param originalUri The original image URI
 * @param context Where the image will be displayed
 * @returns The appropriate image URI for the context (may be thumbnail or original)
 */
export const getOptimizedImageUri = async (
  originalUri: string | null, 
  context: ImageDisplayContext
): Promise<string | null> => {
  // Return null or emoji images as-is
  if (!originalUri || originalUri.startsWith('emoji:')) {
    return originalUri;
  }
  
  switch (context) {
    case ImageDisplayContext.LIST_ITEM:
      // Use thumbnail in lists for performance
      const thumbnailUri = await generateThumbnail(originalUri);
      return thumbnailUri || originalUri;
      
    case ImageDisplayContext.DETAIL_VIEW:
    case ImageDisplayContext.EDIT_PREVIEW:
    default:
      // Use the original (already resized during upload)
      return originalUri;
  }
};

/**
 * Calculate the optimal dimensions for displaying an image in a container
 * Maintains aspect ratio while ensuring image fits within container
 * 
 * @param containerWidth Maximum width available
 * @param containerHeight Maximum height available
 * @param isListItem Whether this is for a list item (uses smaller size for performance)
 * @returns The optimal dimensions to display the image
 */
export const getOptimalImageDimensions = (
  containerWidth: number,
  containerHeight: number,
  isListItem: boolean = false
): { width: number; height: number } => {
  if (isListItem) {
    // Use thumbnail size for list items
    return {
      width: Math.min(containerWidth, imageConfig.thumbnailDimensions.width),
      height: Math.min(containerHeight, imageConfig.thumbnailDimensions.height)
    };
  }
  
  // For detail views, use larger size but still respect container
  return {
    width: Math.min(containerWidth, imageConfig.maxImageDimensions.width),
    height: Math.min(containerHeight, imageConfig.maxImageDimensions.height)
  };
};

/**
 * Get the image file size in a human-readable format
 * 
 * @param fileSizeInBytes The file size in bytes
 * @returns Formatted string (e.g., "1.2 MB" or "340 KB")
 */
export const getReadableFileSize = (fileSizeInBytes: number): string => {
  if (fileSizeInBytes < 1024) {
    return `${fileSizeInBytes} B`;
  } else if (fileSizeInBytes < 1024 * 1024) {
    return `${(fileSizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(fileSizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}; 