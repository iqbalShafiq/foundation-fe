import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui';
import { apiService } from '../../services/api';
import { DocumentUploadResponse } from '../../types/document';

interface DocumentUploadProps {
  onUploadSuccess?: (document: DocumentUploadResponse) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    
    if (!supportedTypes.includes(file.type)) {
      const error = 'Unsupported file type. Please upload PDF, Word, Excel, PowerPoint, CSV, or text files.';
      onUploadError?.(error);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      const error = 'File size too large. Please upload files smaller than 10MB.';
      onUploadError?.(error);
      return;
    }

    setIsUploading(true);

    try {
      const response = await apiService.uploadDocument(file);
      onUploadSuccess?.(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-900/20'
            : 'border-gray-600 hover:border-gray-500'
        } ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.pptx,.csv,.txt"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
              <Upload className="h-8 w-8 text-gray-300" />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-100">
              {isUploading ? 'Uploading document...' : 'Upload Document'}
            </h3>
            <p className="text-gray-400 text-sm max-w-md">
              {isUploading
                ? 'Please wait while we process your document'
                : 'Drag and drop your file here, or click to browse'}
            </p>
          </div>

          {!isUploading && (
            <Button variant="secondary" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>Supported formats: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV (.csv), Text (.txt)</span>
        </div>
        <div className="mt-1 ml-6">
          Maximum file size: 10MB
        </div>
      </div>
    </div>
  );
};