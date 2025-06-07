import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface UploadResult {
  id: string;
  url: string;
  path: string;
}

class FirebaseStorageService {
  private static instance: FirebaseStorageService;

  private constructor() {}

  static getInstance(): FirebaseStorageService {
    if (!FirebaseStorageService.instance) {
      FirebaseStorageService.instance = new FirebaseStorageService();
    }
    return FirebaseStorageService.instance;
  }

  // Compress image before upload
  private async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Upload image to Firebase Storage with progress tracking
  async uploadImage(file: File, itemName?: string, onProgress?: (progress: number) => void): Promise<UploadResult> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    try {
      // Validate file size before processing
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }

      // Compress image if it's large
      let fileToUpload = file;
      if (file.size > 1024 * 1024) { // 1MB
        onProgress?.(10); // 10% for compression start
        fileToUpload = await this.compressImage(file, 800, 0.8);
        onProgress?.(30); // 30% after compression
      } else {
        onProgress?.(20); // Skip compression for small files
      }

      // Generate unique filename with better sanitization
      const fileId = crypto.randomUUID();
      const fileExtension = fileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg';
      const sanitizedItemName = itemName 
        ? itemName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)
        : 'food_item';
      const fileName = `${Date.now()}_${sanitizedItemName}_${fileId.substring(0, 8)}.${fileExtension}`;

      // Create storage reference
      const imagePath = `user-images/${user.uid}/${fileName}`;
      const imageRef = ref(storage, imagePath);

      onProgress?.(50); // 50% before upload

      // Upload file
      const snapshot = await uploadBytes(imageRef, fileToUpload);
      
      onProgress?.(80); // 80% after upload

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      onProgress?.(100); // 100% complete

      return {
        id: fileId,
        url: downloadURL,
        path: imagePath
      };
    } catch (error) {
      console.error('Error uploading image to Firebase Storage:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your account permissions.');
        } else if (error.message.includes('unauthenticated')) {
          throw new Error('Authentication required. Please log in again.');
        } else if (error.message.includes('quota-exceeded')) {
          throw new Error('Storage quota exceeded. Please contact support.');
        } else if (error.message.includes('invalid-argument')) {
          throw new Error('Invalid file format. Please use JPG, PNG, WebP, or GIF.');
        }
      }
      
      throw error;
    }
  }

  // Delete image from Firebase Storage
  async deleteImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image from Firebase Storage:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }
}

export default FirebaseStorageService; 