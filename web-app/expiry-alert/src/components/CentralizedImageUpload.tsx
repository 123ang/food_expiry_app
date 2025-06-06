import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CentralizedGoogleDriveService from '../services/centralizedGoogleDriveService';
import toast from 'react-hot-toast';

interface CentralizedImageUploadProps {
  onImageUploaded: (fileId: string, imageUrl: string) => void;
  currentImageId?: string;
  currentImageUrl?: string;
  disabled?: boolean;
  itemName: string;
}

const CentralizedImageUpload: React.FC<CentralizedImageUploadProps> = ({ 
  onImageUploaded, 
  currentImageId, 
  currentImageUrl, 
  disabled,
  itemName
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Safely get centralized service instance
  const getCentralizedService = () => {
    try {
      return CentralizedGoogleDriveService.getInstance();
    } catch (error) {
      console.error('Error getting centralized service:', error);
      return null;
    }
  };

  // Check if centralized service is ready
  const isCentralizedServiceReady = () => {
    const service = getCentralizedService();
    return service ? service.isReady() : false;
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image size must be less than 10MB');
      return;
    }

    if (!user) {
      toast.error('Please log in to upload images');
      return;
    }

    setIsUploading(true);
    
    try {
      const centralizedService = getCentralizedService();
      if (!centralizedService) {
        toast.error('Failed to initialize centralized storage service.');
        setIsUploading(false);
        return;
      }

      // Check if centralized service is ready
      if (!centralizedService.isReady()) {
        toast.error('Centralized image storage not set up. Please contact admin.');
        setIsUploading(false);
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Compress image if it's large
      let fileToUpload = file;
      if (file.size > 1024 * 1024) { // 1MB
        toast.loading('Compressing image...');
        fileToUpload = await centralizedService.compressImage(file, 800, 0.8);
      }

      // Upload to centralized Google Drive
      toast.loading('Uploading to centralized storage...');
      const driveFile = await centralizedService.uploadUserImage(fileToUpload, {
        userId: user.uid,
        itemName: itemName || 'food-item',
        description: `Food item image: ${itemName}`,
      });

      // Get the public image URL
      const imageUrl = await centralizedService.getImageUrl(driveFile.id);
      
      onImageUploaded(driveFile.id, imageUrl);
      toast.success('Image uploaded to centralized storage!');
      
    } catch (error) {
      console.error('Centralized upload error:', error);
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
        const centralizedService = getCentralizedService();
        if (centralizedService) {
          await centralizedService.deleteImage(currentImageId);
          toast.success('Image deleted from centralized storage');
        }
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

  const handleSetupCentralizedStorage = async () => {
    try {
      const centralizedService = getCentralizedService();
      if (centralizedService) {
        await centralizedService.initializeWithOwnerAccount();
      }
    } catch (error) {
      toast.error('Failed to set up centralized storage. Please try again.');
    }
  };

  return (
    <div className="image-upload-container">
      <label className="form-label">Food Item Image</label>
      
      {!isCentralizedServiceReady() ? (
        <div className="google-drive-connect">
          <p>📸 Centralized Image Storage</p>
          <p>All user images will be stored in the app owner's Google Drive</p>
          <button 
            type="button" 
            onClick={handleSetupCentralizedStorage}
            className="btn btn-primary"
            style={{ marginBottom: '0.5rem' }}
          >
            🔧 Set Up Centralized Storage
          </button>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Note: This requires app owner authentication
          </p>
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
                    <p>Uploading to centralized storage...</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">📷</div>
                    <p>Click to select or drag & drop an image</p>
                    <p className="upload-hint">Stored in centralized Google Drive • Max 10MB</p>
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
            disabled={disabled}
          />
        </div>
      )}

              {isCentralizedServiceReady() && (
        <div className="image-info">
          <p>✅ Centralized storage active</p>
          <p>📁 Images stored in: Expiry Alert - All Users/User_{user?.uid}</p>
          <p>🔒 Only accessible by app owner</p>
        </div>
      )}
    </div>
  );
};

export default CentralizedImageUpload; 