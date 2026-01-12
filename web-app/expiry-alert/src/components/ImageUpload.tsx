import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageUploaded: (fileId: string, imageUrl: string) => void;
  currentImageId?: string;
  currentImageUrl?: string;
  disabled?: boolean;
  itemName?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
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
  const [currentFilename, setCurrentFilename] = useState<string | null>(currentImageId || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

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
      const uploadToast = toast.loading('📤 Uploading image...');
      
      // Compress image if it's large (>1MB)
      let fileToUpload = file;
      if (file.size > 1024 * 1024) {
        toast.loading('Compressing image...', { id: uploadToast });
        fileToUpload = await compressImage(file, 800, 0.8);
      }
      
      // Upload to backend
      const result = await apiClient.uploadImage(fileToUpload);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data?.file) {
        throw new Error('Invalid response from server');
      }

      const uploadedFile = result.data.file;
      
      // Update state with uploaded image info
      setCurrentFilename(uploadedFile.filename);
      onImageUploaded(uploadedFile.filename, uploadedFile.url);
      
      // Success feedback
      toast.dismiss(uploadToast);
      toast.success('✅ Image uploaded successfully!', {
        duration: 3000,
        icon: '📷'
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss();
      
      // Show specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Session expired')) {
          toast.error('Session expired. Please log in again.');
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
    if (currentFilename) {
      try {
        const result = await apiClient.deleteImage(currentFilename);
        if (result.error) {
          toast.error('Failed to delete image');
        } else {
          toast.success('Image deleted successfully');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete image');
      }
    }
    
    setPreviewUrl(null);
    setCurrentFilename(null);
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
                  <p>Uploading image...</p>
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
    </div>
  );
};

export default ImageUpload;
