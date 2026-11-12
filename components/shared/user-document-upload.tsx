'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/shared/toast';
import { formatDate } from '@/lib/utils';
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export enum UserDocumentType {
  ID = 'id',
  INCOME = 'income',
  EMPLOYMENT = 'employment',
  REFERENCE = 'reference',
  RENTAL_HISTORY = 'rental_history',
}

export interface UserDocumentItem {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  isNew?: boolean;
  file?: File;
}

interface PendingUpload {
  file: File;
  storageKey: string;
  url: string;
  previewUrl?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
}

interface UserDocumentUploadProps {
  documentType: UserDocumentType;
  onDocumentsChange?: (documents: UserDocumentItem[]) => void;
  maxDocuments?: number;
  autoSave?: boolean;
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/** Image hole thumbnail, na hole (ba load fail hole) file icon */
function FileThumb({ isImage, src }: { isImage: boolean; src?: string }) {
  const [failed, setFailed] = useState(false);

  if (isImage && src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <FileText className="h-5 w-5" />
    </div>
  );
}

export function UserDocumentUpload({
  documentType,
  onDocumentsChange,
  maxDocuments = 5,
  autoSave = true,
}: UserDocumentUploadProps) {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<UserDocumentItem[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Parent inline function dilew jate refetch loop na hoy
  const onChangeRef = useRef(onDocumentsChange);
  useEffect(() => {
    onChangeRef.current = onDocumentsChange;
  }, [onDocumentsChange]);

  // Unmount e preview URL gulo clean up
  const pendingRef = useRef<PendingUpload[]>([]);
  useEffect(() => {
    pendingRef.current = pendingUploads;
  }, [pendingUploads]);
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const allDocuments = await apiClient.userDocuments.getMyDocuments();
        const typeDocuments: UserDocumentItem[] = allDocuments
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
        onChangeRef.current?.(typeDocuments);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [documentType]);

  const usedSlots = documents.length + pendingUploads.length + uploadingFiles.length;
  const remainingSlots = Math.max(maxDocuments - usedSlots, 0);
  const isFull = remainingSlots === 0;

  /* ---------- Upload ---------- */

  const uploadFile = async (file: File) => {
    const intent = await apiClient.userDocuments.createUploadIntent(
      documentType,
      file.name,
      file.size.toString(),
      file.type,
    );

    const uploadResponse = await fetch(intent.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Supabase upload error:', uploadResponse.status, errorText);
      throw new Error('Upload to storage failed. Please try again.');
    }

    if (autoSave) {
      const record = await apiClient.userDocuments.completeUpload({
        documentType,
        fileName: file.name,
        storageKey: intent.storageKey,
        fileSize: file.size.toString(),
        mimeType: file.type,
      });

      const newDocument: UserDocumentItem = {
        id: record.id,
        documentType,
        fileName: record.fileName,
        fileUrl: record.fileUrl,
        fileSize: record.fileSize,
        mimeType: record.mimeType,
        uploadedAt: new Date(record.uploadedAt),
      };

      setDocuments((prev) => {
        const updated = [...prev, newDocument];
        onChangeRef.current?.(updated);
        return updated;
      });
    } else {
      setPendingUploads((prev) => [
        ...prev,
        {
          file,
          storageKey: intent.storageKey,
          url: intent.publicUrl || intent.uploadUrl.split('?')[0],
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        },
      ]);
    }
  };

  const processFiles = async (incoming: File[]) => {
    if (incoming.length === 0) return;

    const validationErrors: string[] = [];
    const valid: File[] = [];
    let slots = remainingSlots;

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        validationErrors.push(`${file.name}: unsupported format. Use PDF, JPG or PNG.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`${file.name}: larger than ${formatFileSize(MAX_FILE_SIZE)}.`);
        continue;
      }
      if (slots <= 0) {
        validationErrors.push(`${file.name}: limit of ${maxDocuments} documents reached.`);
        continue;
      }
      valid.push(file);
      slots--;
    }

    setErrors(validationErrors);
    if (valid.length === 0) return;

    const batch: UploadingFile[] = valid.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      size: file.size,
    }));
    setUploadingFiles((prev) => [...prev, ...batch]);

    let successCount = 0;
    const uploadErrors: string[] = [];

    for (let i = 0; i < valid.length; i++) {
      try {
        await uploadFile(valid[i]);
        successCount++;
      } catch (error: any) {
        console.error('Upload error:', error);
        uploadErrors.push(`${valid[i].name}: ${error?.message || 'Upload failed.'}`);
      } finally {
        setUploadingFiles((prev) => prev.filter((u) => u.id !== batch[i].id));
      }
    }

    if (uploadErrors.length > 0) setErrors((prev) => [...prev, ...uploadErrors]);
    if (successCount > 0 && autoSave) {
      showToast('success', successCount === 1 ? 'Document uploaded' : `${successCount} documents uploaded`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // same file abar select korar jonno
    processFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isFull) return;
    processFiles(Array.from(e.dataTransfer.files));
  };

  const openPicker = () => {
    if (!isFull) inputRef.current?.click();
  };

  /* ---------- Save pending ---------- */

  const handleSave = async () => {
    setIsSaving(true);
    const saveErrors: string[] = [];
    let saved = 0;

    for (const pending of pendingUploads) {
      try {
        const record = await apiClient.userDocuments.completeUpload({
          documentType,
          fileName: pending.file.name,
          storageKey: pending.storageKey,
          fileSize: pending.file.size.toString(),
          mimeType: pending.file.type,
        });

        const newDocument: UserDocumentItem = {
          id: record.id,
          documentType,
          fileName: record.fileName,
          fileUrl: record.fileUrl,
          fileSize: record.fileSize,
          mimeType: record.mimeType,
          uploadedAt: new Date(record.uploadedAt),
        };

        setDocuments((prev) => {
          const updated = [...prev, newDocument];
          onChangeRef.current?.(updated);
          return updated;
        });
        // Je gulo save hoyeche sudhu segulo pending theke jabe, fail gulo thakbe
        setPendingUploads((prev) => prev.filter((p) => p.storageKey !== pending.storageKey));
        if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);
        saved++;
      } catch (error: any) {
        console.error('Save error:', error);
        saveErrors.push(`${pending.file.name}: ${error?.message || 'Could not save.'}`);
      }
    }

    setIsSaving(false);
    if (saveErrors.length > 0) setErrors(saveErrors);
    if (saved > 0) showToast('success', saved === 1 ? 'Document saved' : `${saved} documents saved`);
  };

  const handleRemovePending = (pending: PendingUpload) => {
    if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPendingUploads((prev) => prev.filter((p) => p.storageKey !== pending.storageKey));
  };

  /* ---------- Delete (with inline confirm) ---------- */

  const handleDelete = async (document: UserDocumentItem) => {
    setDeletingId(document.id);
    try {
      await apiClient.userDocuments.deleteDocument(document.id);
      setDocuments((prev) => {
        const updated = prev.filter((d) => d.id !== document.id);
        onChangeRef.current?.(updated);
        return updated;
      });
      showToast('success', 'Document deleted');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleOpen = (document: UserDocumentItem) => {
    if (document.mimeType === 'application/pdf') {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
    } else if (document.mimeType?.startsWith('image/')) {
      setPreviewDoc({ url: document.fileUrl, name: document.fileName });
    }
  };

  /* ---------- Render ---------- */

  return (
    <div className="space-y-5 min-w-0">
      {/* Dropzone */}
      <div>
        <div
          role="button"
          tabIndex={isFull ? -1 : 0}
          aria-disabled={isFull}
          aria-label="Upload documents"
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isFull) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isFull
              ? 'cursor-not-allowed border-border bg-muted/30 opacity-70'
              : isDragging
                ? 'cursor-pointer border-primary bg-primary/5'
                : 'cursor-pointer border-border hover:border-primary/60 hover:bg-muted/40'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          {isFull ? (
            <p className="text-sm text-muted-foreground">
              Maximum of {maxDocuments} documents reached. Delete one to upload another.
            </p>
          ) : (
            <>
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">Browse files</span>
                <span className="hidden sm:inline"> or drag and drop here</span>
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG or PNG · Max {formatFileSize(MAX_FILE_SIZE)} each · {remainingSlots} of {maxDocuments} slots
                left
              </p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={handleInputChange}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="min-w-0 flex-1 space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="break-words">{err}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setErrors([])}
            aria-label="Dismiss errors"
            className="shrink-0 rounded p-0.5 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Uploading */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                <p className="text-xs text-muted-foreground">Uploading… {formatFileSize(u.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ready to save (only when autoSave is off) */}
      {pendingUploads.length > 0 && (
        <section className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Ready to save ({pendingUploads.length})</h4>
            <p className="text-xs text-muted-foreground">
              These files are uploaded but not saved to your profile yet.
            </p>
          </div>

          <div className="space-y-2">
            {pendingUploads.map((pending) => (
              <div
                key={pending.storageKey}
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20"
              >
                <button
                  type="button"
                  disabled={!pending.previewUrl}
                  onClick={() =>
                    pending.previewUrl && setPreviewDoc({ url: pending.previewUrl, name: pending.file.name })
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                >
                  <FileThumb isImage={pending.file.type.startsWith('image/')} src={pending.previewUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{pending.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(pending.file.size)} ·{' '}
                      <span className="font-medium text-amber-700 dark:text-amber-400">Not saved</span>
                    </p>
                  </div>
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemovePending(pending)}
                  aria-label={`Remove ${pending.file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {!autoSave && (
            <Button onClick={handleSave} disabled={isSaving} className="h-11 w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                `Save ${pendingUploads.length} document${pendingUploads.length > 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </section>
      )}

      {/* Saved documents */}
      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        documents.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Saved documents{' '}
              <span className="font-normal text-muted-foreground">
                ({documents.length}/{maxDocuments})
              </span>
            </h4>

            <div className="space-y-2">
              {documents.map((document) => {
                const isConfirming = confirmDeleteId === document.id;
                const isDeleting = deletingId === document.id;

                return (
                  <div key={document.id} className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpen(document)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        aria-label={`Open ${document.fileName}`}
                      >
                        <FileThumb isImage={!!document.mimeType?.startsWith('image/')} src={document.fileUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{document.fileName}</p>
                          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Saved
                            </span>
                            <span>· {formatFileSize(document.fileSize)}</span>
                            <span className="hidden sm:inline">· {formatDate(document.uploadedAt)}</span>
                          </p>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-muted-foreground"
                          onClick={() => handleOpen(document)}
                          aria-label="View document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmDeleteId(document.id)}
                          disabled={isDeleting}
                          aria-label="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline confirm: bhul kore delete hoye jawa theke bachay */}
                    {isConfirming && (
                      <div className="mt-3 flex flex-col gap-2 rounded-lg bg-destructive/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-destructive">Delete this document permanently?</p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDelete(document)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}

      {/* Image preview */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="truncate pr-6">{previewDoc?.name || 'Document preview'}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <img
              src={previewDoc.url}
              alt={previewDoc.name}
              className="max-h-[70dvh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}