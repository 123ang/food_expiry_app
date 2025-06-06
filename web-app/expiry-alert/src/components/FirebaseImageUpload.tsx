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
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Upload to Firebase Storage
      toast.loading('Uploading image...');
      const result = await storageService.uploadImage(file, itemName);
      
      setCurrentImagePath(result.path);
      onImageUploaded(result.id, result.url);
      toast.dismiss();
      toast.success('✅ Image uploaded successfully!');
      
    } catch (error) {
      console.error('Firebase upload error:', error);
      toast.dismiss();
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