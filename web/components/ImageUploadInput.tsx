'use client';

import { useState, useRef } from 'react';
import { compressImage } from '../lib/image-compression';

interface ImageUploadInputProps {
  onImageSelected: (file: File) => void;
  maxSizeMB?: number;
  maxWidth?: number;
  label?: string;
  accept?: string;
  disabled?: boolean;
}

/**
 * Image Upload Input Component
 * PERFORMANCE: Automatically compresses images before selection
 */
export function ImageUploadInput({
  onImageSelected,
  maxSizeMB = 2,
  maxWidth = 1920,
  label = 'Upload Image',
  accept = 'image/*',
  disabled = false,
}: ImageUploadInputProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB * 2) {
      alert(`Image is too large. Maximum size: ${maxSizeMB * 2}MB`);
      return;
    }

    setIsCompressing(true);

    try {
      // Compress image before selection
      const compressed = await compressImage(file, {
        maxSizeMB,
        maxWidth,
        quality: 0.8,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressed);

      // Notify parent component
      onImageSelected(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
      // Fallback to original file
      onImageSelected(file);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex items-center space-x-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || isCompressing}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
        
        {isCompressing && (
          <span className="text-sm text-gray-500">Compressing...</span>
        )}
      </div>

      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-lg border border-gray-300"
          />
        </div>
      )}
    </div>
  );
}
