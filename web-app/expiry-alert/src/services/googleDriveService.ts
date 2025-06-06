import { GoogleAuth } from 'google-auth-library';

// Note: For production, you'll need to set up OAuth2 properly
// This is a simplified version for demonstration

interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  mimeType: string;
  size: string;
  createdTime: string;
}

interface UploadOptions {
  folderId?: string;
  makePublic?: boolean;
  description?: string;
}

class GoogleDriveService {
  private static instance: GoogleDriveService;
  private accessToken: string | null = null;
  private folderId: string | null = null; // Expiry Alert images folder

  private constructor() {}

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  // Initialize with OAuth2 token
  async initialize(accessToken: string): Promise<void> {
    this.accessToken = accessToken;
    if (this.accessToken) {
      await this.ensureExpiryAlertFolder();
    }
  }

  private getAuthHeaders() {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized. Please authenticate first.');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
    };
  }

  // Create or find the "Expiry Alert Images" folder
  private async ensureExpiryAlertFolder(): Promise<string> {
    if (this.folderId) return this.folderId;

    try {
      // Search for existing folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='Expiry Alert Images' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        this.folderId = searchData.files[0].id;
        return this.folderId!;
      }

      // Create new folder
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Expiry Alert Images',
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Images for Expiry Alert food tracking app',
        }),
      });

      const createData = await createResponse.json();
      this.folderId = createData.id;
      return this.folderId!;
    } catch (error) {
      console.error('Error creating/finding folder:', error);
      throw error;
    }
  }

  // Upload image file to Google Drive
  async uploadImage(file: File, options: UploadOptions = {}): Promise<DriveFile> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized. Please authenticate first.');
    }

    try {
      const folderId = options.folderId || await this.ensureExpiryAlertFolder();
      
      // Create form data for multipart upload
      const metadata = {
        name: `${Date.now()}_${file.name}`,
        parents: [folderId],
        description: options.description || 'Expiry Alert food item image',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink,mimeType,size,createdTime',
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: form,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const driveFile: DriveFile = await response.json();

      // Make file publicly viewable if requested
      if (options.makePublic) {
        await this.makeFilePublic(driveFile.id);
      }

      return driveFile;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }

  // Make file publicly viewable
  async makeFilePublic(fileId: string): Promise<void> {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (error) {
      console.error('Error making file public:', error);
      throw error;
    }
  }

  // Get direct download link for an image
  async getImageUrl(fileId: string): Promise<string> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink,thumbnailLink`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();
      // Use thumbnail for faster loading, fallback to full image
      return data.thumbnailLink || data.webContentLink;
    } catch (error) {
      console.error('Error getting image URL:', error);
      throw error;
    }
  }

  // Delete an image from Google Drive
  async deleteImage(fileId: string): Promise<void> {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // List all images in the Expiry Alert folder
  async listImages(): Promise<DriveFile[]> {
    try {
      const folderId = await this.ensureExpiryAlertFolder();
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType contains 'image' and trashed=false&fields=files(id,name,webViewLink,webContentLink,thumbnailLink,mimeType,size,createdTime)`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing images:', error);
      throw error;
    }
  }

  // Compress image before upload (optional)
  async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = img;
        const aspectRatio = width / height;
        
        let newWidth = maxWidth;
        let newHeight = maxWidth / aspectRatio;
        
        if (newHeight > maxWidth) {
          newHeight = maxWidth;
          newWidth = maxWidth * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Get OAuth2 URL for authentication
  getAuthUrl(): string {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: window.location.origin + '/auth/google',
        }),
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Store token in localStorage for persistence
      localStorage.setItem('googleDriveToken', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('googleDriveRefreshToken', data.refresh_token);
      }

      return data.access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken || !!localStorage.getItem('googleDriveToken');
  }

  // Load token from localStorage
  loadStoredToken(): boolean {
    const token = localStorage.getItem('googleDriveToken');
    if (token) {
      this.accessToken = token;
      return true;
    }
    return false;
  }

  // Sign out
  signOut(): void {
    this.accessToken = null;
    localStorage.removeItem('googleDriveToken');
    localStorage.removeItem('googleDriveRefreshToken');
  }
}

export default GoogleDriveService;
export type { DriveFile, UploadOptions }; 