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
   * Compression quality for images
   * Range: 0.0 (maximum compression, worst quality) to 1.0 (no compression, best quality)
   * We use 0.95 for high quality with minimal compression to preserve colors
   * Note: PNG format is now used for better color preservation
   */
  compressionQuality: 0.95,

  /**
   * Thumbnail size for list views and small displays
   * Used when displaying images in lists or small containers
   * Note: We use higher quality thumbnails (0.95 compression) with PNG format
   * to ensure good color reproduction even at smaller sizes
   */
  thumbnailDimensions: {
    width: 150, // Square thumbnail for consistent display
    height: 150, // Same as width to maintain square aspect ratio
  },

  /**
   * Default maximum file size (in bytes) for images
   * Used for validation purposes and warnings
   * PNG files may be larger than JPEGs but offer better quality
   */
  maxFileSize: 2 * 1024 * 1024, // 2MB (increased to accommodate PNG format)
}; 