import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FirebaseStorageService from '../services/firebaseStorageService';
import toast from 'react-hot-toast';

interface FirebaseImageUploadProps {
  onImageUploaded: (fileId: string, imageUrl: string) => void;
  currentImageId?: string;
  currentImageUrl?: string;
  disabled?: boolean;
  itemName?: string;
}

const FirebaseImageUpload: React.FC<FirebaseImageUploadProps> = ({ 
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
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageService = FirebaseStorageService.getInstance();

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Check authentication
    if (!user) {
      toast.error('Please log in to upload images');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Show upload progress
      const uploadToast = toast.loading('📤 Uploading image to Firebase Storage...');
      
      // Upload to Firebase Storage
      const result = await storageService.uploadImage(file, itemName);
      
      // Update state with uploaded image info
      setCurrentImagePath(result.path);
      onImageUploaded(result.id, result.url);
      
      // Success feedback
      toast.dismiss(uploadToast);
      toast.success('✅ Image uploaded successfully!', {
        duration: 3000,
        icon: '📷'
      });
      
    } catch (error) {
      console.error('Firebase upload error:', error);
      toast.dismiss();
      
      // Show specific error messages
      if (error instanceof Error) {
        if (error.message.includes('auth')) {
          toast.error('Authentication error. Please log in again.');
        } else if (error.message.includes('permission')) {
          toast.error('Permission denied. Please check your account permissions.');
        } else if (error.message.includes('quota')) {
          toast.error('Storage quota exceeded. Please contact support.');
        } else {
          toast.error(`Upload failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
      
      // Reset preview on error
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
    if (currentImagePath) {
      try {
        await storageService.deleteImage(currentImagePath);
        toast.success('Image deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete image');
      }
    }
    
    setPreviewUrl(null);
    setCurrentImagePath(null);
    onImageUploaded('', '');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <label className="form-label">Food Item Image</label>
      
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
                  <p>Uploading to Firebase Storage...</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">📷</div>
                  <p><strong>Click to upload</strong> or drag and drop</p>
                  <p className="upload-hint">PNG, JPG, WebP up to 10MB</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />
      
      <div className="storage-info">
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          🔥 Images stored securely in Firebase Storage
        </p>
      </div>
    </div>
  );
};

export default FirebaseImageUpload; 