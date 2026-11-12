'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  onUpload: (files: File[]) => Promise<void>;
  disabled?: boolean;
}

interface UploadFile {
  file: File;
  preview?: string;
  progress: number;
  error?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

export function FileUpload({
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024,
  maxFiles = 20,
  multiple = true,
  onUpload,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / 1024 / 1024}MB limit`;
    }
    return null;
  };

  const handleFiles = useCallback(async (newFiles: FileList) => {
    const fileArray = Array.from(newFiles);

    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const uploadFiles: UploadFile[] = fileArray.map((file) => {
      const error = validateFile(file);
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;

      return {
        file,
        preview,
        progress: 0,
        error: error ?? undefined,
        status: error ? 'error' : 'pending',
      };
    });

    setFiles((prev) => [...prev, ...uploadFiles]);

    const filesToUpload = uploadFiles.filter((f) => f.status === 'pending');

    for (const uploadFile of filesToUpload) {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, status: 'uploading', progress: 0 } : f,
          ),
        );

        await onUpload([uploadFile.file]);

        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, status: 'success', progress: 100 } : f,
          ),
        );
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file
              ? { ...f, status: 'error', error: error.message || 'Upload failed' }
              : f,
          ),
        );
      }
    }
  }, [files.length, maxFiles, maxSize, onUpload]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      handleFiles(droppedFiles);
    },
    [disabled, handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const retryUpload = async (index: number) => {
    const file = files[index];
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'pending', error: undefined } : f)),
    );

    try {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'uploading', progress: 0 } : f)),
      );

      await onUpload([file.file]);

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'success', progress: 100 } : f)),
      );
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error', error: error.message || 'Upload failed' } : f,
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <div className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-2">
            Drag and drop files here, or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            {accept === 'image/*' ? 'Images' : 'Files'} up to {maxSize / 1024 / 1024}MB each
            {maxFiles > 1 && ` (max ${maxFiles} files)`}
          </p>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((uploadFile, index) => (
            <Card key={index} className="relative overflow-hidden">
              {uploadFile.preview ? (
                <img
                  src={uploadFile.preview}
                  alt={uploadFile.file.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-muted">
                  {uploadFile.file.type === 'application/pdf' ? (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}

              <div className="p-2">
                <p className="text-xs font-medium truncate">{uploadFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadFile.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              {uploadFile.status === 'uploading' && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {uploadFile.status === 'error' && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-2">
                  <AlertCircle className="h-6 w-6 text-destructive mb-1" />
                  <p className="text-xs text-destructive text-center">{uploadFile.error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      retryUpload(index);
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}

              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 left-2 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
