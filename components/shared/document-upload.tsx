'use client';

import { useState } from 'react';
import { FileUpload } from './file-upload';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export enum DocumentType {
  ID = 'id',
  INCOME = 'income',
  EMPLOYMENT = 'employment',
  REFERENCE = 'reference',
  RENTAL_HISTORY = 'rental_history',
}

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

interface DocumentUploadProps {
  applicationId: string;
  documentType: DocumentType;
  existingDocuments?: Document[];
  onDocumentsChange: (documents: Document[]) => void;
  maxDocuments?: number;
}

export function DocumentUpload({
  applicationId,
  documentType,
  existingDocuments = [],
  onDocumentsChange,
  maxDocuments = 5,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>(existingDocuments);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (!applicationId) {
      throw new Error('Application ID is required for document upload');
    }

    if (documents.length + files.length > maxDocuments) {
      throw new Error(`Maximum ${maxDocuments} documents allowed`);
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        const intent = await apiClient.applicationDocuments.createUploadIntent(
          applicationId,
          documentType,
          file.name,
          file.size.toString(),
          file.type,
        );

        const uploadResponse = await fetch(intent.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to storage');
        }

        await apiClient.applicationDocuments.completeUpload(applicationId, {
          documentType,
          fileName: file.name,
          storageKey: intent.storageKey,
          fileSize: file.size.toString(),
          mimeType: file.type,
        });

        const newDocument: Document = {
          id: intent.uploadId,
          documentType,
          fileName: file.name,
          fileUrl: intent.publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date(),
        };

        setDocuments((prev) => [...prev, newDocument]);
        onDocumentsChange([...documents, newDocument]);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (document: Document) => {
    if (!applicationId) return;

    try {
      await apiClient.applicationDocuments.deleteDocument(applicationId, document.id);
      setDocuments((prev) => prev.filter((d) => d.id !== document.id));
      onDocumentsChange(documents.filter((d) => d.id !== document.id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isPdf = (mimeType: string) => mimeType === 'application/pdf';

  return (
    <div className="space-y-4">
      <FileUpload
        accept=".pdf,.jpg,.jpeg,.png"
        maxSize={5 * 1024 * 1024}
        maxFiles={maxDocuments - documents.length}
        multiple={true}
        onUpload={handleUpload}
        disabled={isUploading || documents.length >= maxDocuments}
      />

      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Documents ({documents.length}/{maxDocuments})
          </p>

          <div className="space-y-2">
            {documents.map((document) => (
              <Card key={document.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isImage(document.mimeType) ? (
                    <ImageIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  ) : isPdf(document.mimeType) ? (
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{document.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => handleDelete(document)}
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
