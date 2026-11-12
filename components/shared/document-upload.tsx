'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from './file-upload';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Image as ImageIcon, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  onDocumentsChange?: (documents: Document[]) => void;
  maxDocuments?: number;
}

export function DocumentUpload({
  applicationId,
  documentType,
  onDocumentsChange,
  maxDocuments = 5,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!applicationId) return;

      try {
        const allDocuments = await apiClient.applicationDocuments.getDocuments(applicationId);
        const typeDocuments = allDocuments
          .filter((doc: any) => doc.documentType === documentType)
          .map((doc: any) => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            uploadedAt: new Date(doc.uploadedAt),
          }));
        setDocuments(typeDocuments);
        onDocumentsChange?.(typeDocuments);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };

    fetchDocuments();
  }, [applicationId, documentType, onDocumentsChange]);

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
          const errorText = await uploadResponse.text();
          console.error('Supabase upload error:', uploadResponse.status, errorText);
          throw new Error(`Failed to upload file to storage: ${uploadResponse.status} - ${errorText}`);
        }

        const documentRecord = await apiClient.applicationDocuments.completeUpload(applicationId, {
          documentType,
          fileName: file.name,
          storageKey: intent.storageKey,
          fileSize: file.size.toString(),
          mimeType: file.type,
        });

        const newDocument: Document = {
          id: documentRecord.id,
          documentType,
          fileName: documentRecord.fileName,
          fileUrl: documentRecord.fileUrl,
          fileSize: documentRecord.fileSize,
          mimeType: documentRecord.mimeType,
          uploadedAt: new Date(documentRecord.uploadedAt),
        };

        setDocuments((prev) => {
          const updated = [...prev, newDocument];
          onDocumentsChange?.(updated);
          return updated;
        });
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
      setDocuments((prev) => {
        const updated = prev.filter((d) => d.id !== document.id);
        onDocumentsChange?.(updated);
        return updated;
      });
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

  const handleDocumentClick = (document: Document) => {
    if (isPdf(document.mimeType)) {
      window.open(document.fileUrl, '_blank');
    } else if (isImage(document.mimeType)) {
      setPreviewImage(document.fileUrl);
    }
  };

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
              <Card
                key={document.id}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleDocumentClick(document)}
              >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(document);
                  }}
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Document preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
