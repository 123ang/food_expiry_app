/**
 * Image configuration settings
 * Controls resizing, compression, and storage parameters for images in the app
 */

export const imageConfig = {
  /**
   * Maximum width and height for saved images
   * Images will be resized to fit within these dimensions while maintaining aspect ratio
   * Higher values mean better quality but larger file size
   * Recommended: 400-800 for food items that only need visual identification
   */
  maxImageDimensions: {
    width: 800, // Maximum width in pixels
    height: 800, // Maximum height in pixels
  },

  /**
   * Compression quality for JPEG images
   * Range: 0.0 (maximum compression, worst quality) to 1.0 (no compression, best quality)
   * Recommended: 0.7-0.8 for good quality with reasonable file size
   */
  compressionQuality: 0.8,

  /**
   * Thumbnail size for list views and small displays
   * Used when displaying images in lists or small containers
   */
  thumbnailDimensions: {
    width: 100,
    height: 100,
  },

  /**
   * Default maximum file size (in bytes) for images
   * Used for validation purposes and warnings
   */
  maxFileSize: 1024 * 1024, // 1MB
}; 