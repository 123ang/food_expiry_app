import React, { useState, useRef } from 'react';
import GoogleDriveService from '../services/googleDriveService';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageUploaded: (fileId: string, imageUrl: string) => void;
  currentImageId?: string;
  currentImageUrl?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageUploaded, 
  currentImageId, 
  currentImageUrl, 
  disabled 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const driveService = GoogleDriveService.getInstance();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Check if user is authenticated with Google Drive
      if (!driveService.isAuthenticated()) {
        if (!driveService.loadStoredToken()) {
          toast.error('Please connect your Google Drive first');
          setIsUploading(false);
          return;
        }
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Compress image if it's large
      let fileToUpload = file;
      if (file.size > 1024 * 1024) { // 1MB
        toast.loading('Compressing image...');
        fileToUpload = await driveService.compressImage(file, 800, 0.8);
      }

      // Upload to Google Drive
      toast.loading('Uploading image...');
      const driveFile = await driveService.uploadImage(fileToUpload, {
        makePublic: true,
        description: `Food item image - ${file.name}`,
      });

      // Get the public image URL
      const imageUrl = await driveService.getImageUrl(driveFile.id);
      
      onImageUploaded(driveFile.id, imageUrl);
      toast.success('Image uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemoveImage = async () => {
    if (currentImageId) {
      try {
        await driveService.deleteImage(currentImageId);
        toast.success('Image deleted');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete image');
      }
    }
    
    setPreviewUrl(null);
    onImageUploaded('', '');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConnectGoogleDrive = () => {
    const authUrl = driveService.getAuthUrl();
    window.open(authUrl, '_blank');
    toast('Please authorize Google Drive access and try again', { icon: 'ℹ️' });
  };

  return (
    <div className="image-upload-container">
      <label className="form-label">Food Item Image</label>
      
      {!driveService.isAuthenticated() && !driveService.loadStoredToken() ? (
        <div className="google-drive-connect">
          <p>Connect your Google Drive to save images</p>
          <button 
            type="button" 
            onClick={handleConnectGoogleDrive}
            className="btn btn-primary"
          >
            📸 Connect Google Drive
          </button>
        </div>
      ) : (
        <div className="image-upload-area">
          {previewUrl ? (
            <div className="image-preview">
              <img src={previewUrl} alt="Food item" className="preview-image" />
              <div className="image-overlay">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-small"
                  disabled={disabled || isUploading}
                >
                  📷 Change
                </button>
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
                  className="btn btn-danger btn-small"
                  disabled={disabled || isUploading}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ) : (
            <div 
              className={`upload-zone ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <div className="upload-content">
                {isUploading ? (
                  <>
                    <div className="upload-spinner"></div>
                    <p>Uploading image...</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">📷</div>
                    <p>Click to select or drag & drop an image</p>
                    <p className="upload-hint">Supports JPG, PNG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            disabled={disabled || isUploading}
          />
        </div>
      )}
      
      <div className="image-info">
        <p>📱 Images are saved to your Google Drive in "Expiry Alert Images" folder</p>
        <p>🔒 Only you can access your images</p>
      </div>
    </div>
  );
};

export default ImageUpload; 