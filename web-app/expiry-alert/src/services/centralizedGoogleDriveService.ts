// Centralized Google Drive service - stores all user images in app owner's Drive account

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
  userId: string;
  itemName: string;
  description?: string;
}

class CentralizedGoogleDriveService {
  private static instance: CentralizedGoogleDriveService;
  private accessToken: string | null = null;
  private mainFolderId: string | null = null; // "Expiry Alert - All Users" folder
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): CentralizedGoogleDriveService {
    if (!CentralizedGoogleDriveService.instance) {
      CentralizedGoogleDriveService.instance = new CentralizedGoogleDriveService();
    }
    return CentralizedGoogleDriveService.instance;
  }

  // Initialize with app owner's credentials (one-time setup)
  async initializeWithOwnerAccount(): Promise<boolean> {
    try {
      // Check if we have stored app owner credentials
      const storedToken = localStorage.getItem('appOwnerGoogleDriveToken');
      if (storedToken) {
        this.accessToken = storedToken;
        await this.ensureMainFolder();
        this.isInitialized = true;
        return true;
      }

      // If no token, need to authenticate as app owner
      await this.authenticateAppOwner();
      return true;
    } catch (error) {
      console.error('Failed to initialize centralized Google Drive:', error);
      return false;
    }
  }

  // App owner authentication (one-time setup)
  private async authenticateAppOwner(): Promise<void> {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/owner');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
    
    // Store flag to indicate this is owner authentication
    localStorage.setItem('googleDriveOwnerAuth', 'true');
    window.location.href = authUrl;
  }

  // Exchange code for token (for app owner)
  async exchangeOwnerCodeForToken(code: string): Promise<string> {
    try {
      console.log('🔧 Starting token exchange...');
      
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1059614977887-v6eeiahl6drcr3fp9psq1fuljoa0gl4i.apps.googleusercontent.com';
      const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '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';
      
      console.log('🔧 Using Client ID:', clientId);
      console.log('🔧 Redirect URI:', window.location.origin + '/auth/google/owner');
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: window.location.origin + '/auth/google/owner',
        }),
      });
      
      console.log('🔧 Token exchange response status:', response.status);

      const data = await response.json();
      console.log('🔧 Token response data:', data);
      
      if (!data.access_token) {
        console.error('❌ No access token in response:', data);
        throw new Error('No access token received: ' + (data.error || 'Unknown error'));
      }
      
      this.accessToken = data.access_token;
      
      // Store owner token separately
      console.log('🔧 Storing tokens in localStorage...');
      localStorage.setItem('appOwnerGoogleDriveToken', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('appOwnerGoogleDriveRefreshToken', data.refresh_token);
        console.log('🔧 Refresh token stored');
      }
      
      console.log('🔧 Tokens stored successfully');
      
      await this.ensureMainFolder();
      this.isInitialized = true;

      return data.access_token;
    } catch (error) {
      console.error('Error exchanging owner code for token:', error);
      throw error;
    }
  }

  private getAuthHeaders() {
    if (!this.accessToken) {
      throw new Error('App owner Google Drive not initialized');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
    };
  }

  // Create main folder structure
  private async ensureMainFolder(): Promise<string> {
    if (this.mainFolderId) return this.mainFolderId;

    try {
      // Search for existing main folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='Expiry Alert - All Users' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        this.mainFolderId = searchData.files[0].id;
        return this.mainFolderId!;
      }

      // Create main folder
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Expiry Alert - All Users',
          mimeType: 'application/vnd.google-apps.folder',
          description: 'All user images from Expiry Alert app',
        }),
      });

      const createData = await createResponse.json();
      this.mainFolderId = createData.id;
      return this.mainFolderId!;
    } catch (error) {
      console.error('Error creating/finding main folder:', error);
      throw error;
    }
  }

  // Create or get user-specific subfolder
  private async ensureUserFolder(userId: string): Promise<string> {
    try {
      const mainFolderId = await this.ensureMainFolder();
      
      // Search for user's folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='User_${userId}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Create user folder
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `User_${userId}`,
          parents: [mainFolderId],
          mimeType: 'application/vnd.google-apps.folder',
          description: `Images for user ${userId}`,
        }),
      });

      const createData = await createResponse.json();
      return createData.id;
    } catch (error) {
      console.error('Error creating/finding user folder:', error);
      throw error;
    }
  }

  // Upload image to centralized drive
  async uploadUserImage(file: File, options: UploadOptions): Promise<DriveFile> {
    if (!this.isInitialized) {
      throw new Error('Centralized Google Drive not initialized. Please set up app owner authentication.');
    }

    try {
      const userFolderId = await this.ensureUserFolder(options.userId);
      
      // Create filename with user context
      const timestamp = Date.now();
      const filename = `${timestamp}_${options.itemName}_${file.name}`;
      
      const metadata = {
        name: filename,
        parents: [userFolderId],
        description: options.description || `Food item image for ${options.itemName} by user ${options.userId}`,
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

      // Make file publicly viewable
      await this.makeFilePublic(driveFile.id);

      return driveFile;
    } catch (error) {
      console.error('Error uploading to centralized Google Drive:', error);
      throw error;
    }
  }

  // Make file publicly viewable
  private async makeFilePublic(fileId: string): Promise<void> {
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

  // Delete image from centralized drive
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

  // Get image URL
  async getImageUrl(fileId: string): Promise<string> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink,thumbnailLink`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();
      return data.thumbnailLink || data.webContentLink;
    } catch (error) {
      console.error('Error getting image URL:', error);
      throw error;
    }
  }

  // List all user images (for admin purposes)
  async listAllUserImages(): Promise<DriveFile[]> {
    try {
      const mainFolderId = await this.ensureMainFolder();
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${mainFolderId}' in parents and mimeType contains 'image' and trashed=false&fields=files(id,name,webViewLink,webContentLink,thumbnailLink,mimeType,size,createdTime)`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing all images:', error);
      throw error;
    }
  }

  // List images for specific user
  async listUserImages(userId: string): Promise<DriveFile[]> {
    try {
      const userFolderId = await this.ensureUserFolder(userId);
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${userFolderId}' in parents and mimeType contains 'image' and trashed=false&fields=files(id,name,webViewLink,webContentLink,thumbnailLink,mimeType,size,createdTime)`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing user images:', error);
      throw error;
    }
  }

  // Compress image (same as before)
  async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
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

  // Check if centralized system is ready
  isReady(): boolean {
    return this.isInitialized && !!this.accessToken;
  }

  // Get folder organization info
  async getFolderStructure(): Promise<any> {
    try {
      const mainFolderId = await this.ensureMainFolder();
      
      // Get all user folders
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,createdTime)`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();
      return {
        mainFolderId,
        userFolders: data.files || [],
        totalUsers: data.files?.length || 0
      };
    } catch (error) {
      console.error('Error getting folder structure:', error);
      throw error;
    }
  }
}

export default CentralizedGoogleDriveService;
export type { DriveFile, UploadOptions }; 