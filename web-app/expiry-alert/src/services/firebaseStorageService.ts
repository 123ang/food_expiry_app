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

  // Upload image to Firebase Storage
  async uploadImage(file: File, itemName?: string): Promise<UploadResult> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    try {
      // Compress image if it's large
      let fileToUpload = file;
      if (file.size > 1024 * 1024) { // 1MB
        fileToUpload = await this.compressImage(file, 800, 0.8);
      }

      // Generate unique filename
      const fileId = crypto.randomUUID();
      const fileExtension = fileToUpload.name.split('.').pop() || 'jpg';
      const fileName = itemName 
        ? `${Date.now()}_${itemName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`
        : `${Date.now()}_${fileId}.${fileExtension}`;

      // Create storage reference
      const imagePath = `user-images/${user.uid}/${fileName}`;
      const imageRef = ref(storage, imagePath);

      // Upload file
      const snapshot = await uploadBytes(imageRef, fileToUpload);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        id: fileId,
        url: downloadURL,
        path: imagePath
      };
    } catch (error) {
      console.error('Error uploading image to Firebase Storage:', error);
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