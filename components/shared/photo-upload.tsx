'use client';

import { useState } from 'react';
import { FileUpload } from './file-upload';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { GripVertical, Star, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Photo {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface PhotoUploadProps {
  propertyId?: string;
  existingPhotos?: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({
  propertyId,
  existingPhotos = [],
  onPhotosChange,
  maxPhotos = 20,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>(existingPhotos);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (!propertyId) {
      throw new Error('Property ID is required for photo upload');
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        const intent = await apiClient.uploads.createIntent(
          'property_photo',
          propertyId,
          file.type,
          file.size.toString(),
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

        await apiClient.uploads.completeUpload(propertyId, intent.storageKey, 'Property photo', false, photos.length);

        const newPhoto: Photo = {
          id: intent.uploadId,
          url: intent.publicUrl,
          caption: 'Property photo',
          isPrimary: photos.length === 0,
          sortOrder: photos.length,
        };

        setPhotos((prev) => [...prev, newPhoto]);
        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!propertyId) return;

    try {
      await apiClient.uploads.deletePropertyPhoto(propertyId, photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      onPhotosChange(photos.filter((p) => p.id !== photo.id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSetPrimary = (photoId: string) => {
    const updatedPhotos = photos.map((p) => ({
      ...p,
      isPrimary: p.id === photoId,
    }));
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const reorderedPhotos = [...photos];
    const [movedPhoto] = reorderedPhotos.splice(fromIndex, 1);
    reorderedPhotos.splice(toIndex, 0, movedPhoto);

    const updatedPhotos = reorderedPhotos.map((photo, index) => ({
      ...photo,
      sortOrder: index,
    }));

    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  return (
    <div className="space-y-4">
      <FileUpload
        accept="image/*"
        maxSize={10 * 1024 * 1024}
        maxFiles={maxPhotos - photos.length}
        multiple={true}
        onUpload={handleUpload}
        disabled={isUploading || photos.length >= maxPhotos}
      />

      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Photos ({photos.length}/{maxPhotos})
            </p>
            <p className="text-xs text-muted-foreground">
              Drag to reorder • Star to set primary
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <Card key={photo.id} className="relative overflow-hidden group">
                <img
                  src={photo.url}
                  alt={photo.caption || 'Property photo'}
                  className="w-full h-32 object-cover"
                />

                {photo.isPrimary && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                )}

                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleSetPrimary(photo.id)}
                    title="Set as primary"
                  >
                    <Star className={`h-4 w-4 ${photo.isPrimary ? 'fill-primary text-primary' : ''}`} />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDelete(photo)}
                    title="Delete photo"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="absolute top-2 left-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
