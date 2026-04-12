import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Trash2, Star, X, Loader2, Info, ZoomIn } from 'lucide-react';
import LiveCameraCapture from './LiveCameraCapture';

const MAX_PHOTOS = 6;

interface ProfileGalleryProps {
  userId: string;
  initialPhotos: string[];
  primaryPhotoUrl: string | null;
  onPrimaryChanged: (url: string) => void;
  onPhotosChanged: (photos: string[]) => void;
}

function FullScreenModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        onClick={onClose}
        aria-label="Close fullscreen"
      >
        <X className="w-8 h-8" />
      </button>
      <img
        src={url}
        alt="Full size photo"
        className="max-w-full max-h-full object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function ProfileGallery({
  userId,
  initialPhotos,
  primaryPhotoUrl,
  onPrimaryChanged,
  onPhotosChanged,
}: ProfileGalleryProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [primary, setPrimary] = useState<string | null>(primaryPhotoUrl);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullScreenUrl, setFullScreenUrl] = useState<string | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<number | null>(null);

  const dataURLtoBlob = (dataURL: string): Blob => {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleCapture = async (blobOrDataURL: Blob | string) => {
    setShowCamera(false);
    if (photos.length >= MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed. Delete one before adding another.`);
      return;
    }
    setUploading(true);
    try {
      let blob: Blob;
      if (typeof blobOrDataURL === 'string') {
        blob = dataURLtoBlob(blobOrDataURL);
      } else {
        blob = blobOrDataURL;
      }
      const timestamp = Date.now();
      const fileName = `${userId}/gallery_${timestamp}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('partner-photos')
        .upload(fileName, blob, { upsert: false, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('partner-photos').getPublicUrl(fileName);
      const url = `${urlData.publicUrl}?t=${timestamp}`;

      const updatedPhotos = [...photos, url];
      setPhotos(updatedPhotos);
      onPhotosChanged(updatedPhotos);

      await supabase.from('profiles').update({ profile_photos: updatedPhotos }).eq('id', userId);

      if (!primary) {
        setPrimary(url);
        onPrimaryChanged(url);
        await supabase.from('profiles').update({ live_photo_url: url }).eq('id', userId);
      }
    } catch (err: any) {
      console.error('Gallery upload error:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index: number) => {
    setDeletingIndex(index);
    try {
      const url = photos[index];
      const pathMatch = url.match(/partner-photos\/(.+?)(\?|$)/);
      if (pathMatch) {
        await supabase.storage.from('partner-photos').remove([pathMatch[1]]);
      }

      const updatedPhotos = photos.filter((_, i) => i !== index);
      setPhotos(updatedPhotos);
      onPhotosChanged(updatedPhotos);
      await supabase.from('profiles').update({ profile_photos: updatedPhotos }).eq('id', userId);

      if (primary === url) {
        const newPrimary = updatedPhotos[0] ?? null;
        setPrimary(newPrimary);
        onPrimaryChanged(newPrimary ?? '');
        await supabase.from('profiles').update({ live_photo_url: newPrimary }).eq('id', userId);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete photo.');
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleSetPrimary = async (index: number) => {
    setSettingPrimary(index);
    try {
      const url = photos[index];
      setPrimary(url);
      onPrimaryChanged(url);
      await supabase.from('profiles').update({ live_photo_url: url }).eq('id', userId);
    } catch (err: any) {
      console.error('Set primary error:', err);
      alert('Failed to set primary photo.');
    } finally {
      setSettingPrimary(null);
    }
  };

  const slots = Array.from({ length: MAX_PHOTOS });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-white">Profile Gallery</h3>
          <p className="text-xs text-gray-500 mt-0.5">{photos.length}/{MAX_PHOTOS} photos</p>
        </div>
        {photos.length < MAX_PHOTOS && (
          <button
            onClick={() => setShowCamera(true)}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Add Photo'}
          </button>
        )}
      </div>

      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl mb-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <p className="text-xs text-red-300">
          No AI-generated images, no nudity, face must be clearly visible. Real human photos only. Violations result in immediate suspension.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {slots.map((_, i) => {
          const photo = photos[i];
          const isPrimary = photo === primary;
          const isDeleting = deletingIndex === i;
          const isSettingPrimary = settingPrimary === i;

          if (!photo) {
            return (
              <div
                key={i}
                onClick={photos.length < MAX_PHOTOS ? () => setShowCamera(true) : undefined}
                className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 bg-white/2 cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <Camera className="w-6 h-6 text-gray-600" />
                <span className="text-[10px] text-gray-600">Add Photo</span>
              </div>
            );
          }

          return (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={photo}
                alt={`Gallery photo ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-yellow-500 rounded-full px-1.5 py-0.5 flex items-center gap-1 z-10">
                  <Star className="w-2.5 h-2.5 text-black fill-black" />
                  <span className="text-[9px] font-bold text-black">PRIMARY</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setFullScreenUrl(photo)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                  aria-label="View fullscreen"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>

                {!isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(i)}
                    disabled={isSettingPrimary}
                    className="w-8 h-8 bg-yellow-500/80 hover:bg-yellow-500 rounded-full flex items-center justify-center transition-colors"
                    aria-label="Set as primary"
                  >
                    {isSettingPrimary
                      ? <Loader2 className="w-4 h-4 text-black animate-spin" />
                      : <Star className="w-4 h-4 text-black fill-black" />
                    }
                  </button>
                )}

                <button
                  onClick={() => handleDelete(i)}
                  disabled={isDeleting}
                  className="w-8 h-8 bg-red-600/80 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Delete photo"
                >
                  {isDeleting
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Trash2 className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-600 mt-3">
        Tap a photo to view options. Star = set as profile picture. The primary photo appears on your public listing.
      </p>

      {showCamera && (
        <LiveCameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          aspectRatio="square"
        />
      )}

      {fullScreenUrl && (
        <FullScreenModal url={fullScreenUrl} onClose={() => setFullScreenUrl(null)} />
      )}
    </div>
  );
}
