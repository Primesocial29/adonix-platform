import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, X, CheckCircle } from 'lucide-react';

interface LiveCameraCaptureProps {
  onCapture: (photoBlob: Blob) => void;
  onClose: () => void;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  isEditMode?: boolean;
  onReplaceConfirm?: () => Promise<boolean>;
}

export default function LiveCameraCapture({ 
  onCapture, 
  onClose, 
  aspectRatio = 'square',
  isEditMode = false,
  onReplaceConfirm
}: LiveCameraCaptureProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Touch zoom and pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Touch tracking refs
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0, zoom: 1 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    initCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initCamera = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err) {
      console.error('Camera error:', err);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (aspectRatio === 'square') {
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
      } else {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, width, height);
      }
      
      const photoDataURL = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoDataURL);
      setIsEditing(true);
      stopCamera();
      // Reset zoom and pan when entering edit mode
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  // Touch handlers for pinch zoom and pan
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single finger - prepare for pan
      setIsDragging(true);
      touchStartRef.current.x = e.touches[0].clientX - pan.x;
      touchStartRef.current.y = e.touches[0].clientY - pan.y;
    } else if (e.touches.length === 2) {
      // Two fingers - prepare for pinch zoom
      touchStartRef.current.distance = getTouchDistance(e.touches);
      touchStartRef.current.zoom = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      // Pan with one finger
      const newPanX = e.touches[0].clientX - touchStartRef.current.x;
      const newPanY = e.touches[0].clientY - touchStartRef.current.y;
      
      // Calculate max pan based on zoom level
      const maxPanX = (zoom - 1) * 150;
      const maxPanY = (zoom - 1) * 150;
      
      setPan({
        x: Math.min(maxPanX, Math.max(-maxPanX, newPanX)),
        y: Math.min(maxPanY, Math.max(-maxPanY, newPanY))
      });
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const newDistance = getTouchDistance(e.touches);
      if (touchStartRef.current.distance > 0) {
        let newZoom = touchStartRef.current.zoom * (newDistance / touchStartRef.current.distance);
        newZoom = Math.min(3, Math.max(1, newZoom));
        setZoom(newZoom);
        
        // Adjust pan to keep image centered when zooming
        if (newZoom !== zoom) {
          setPan(prev => ({
            x: prev.x * (newZoom / zoom),
            y: prev.y * (newZoom / zoom)
          }));
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleAccept = async () => {
    if (capturedPhoto && imgRef.current) {
      // Create an image element to get dimensions
      const img = new Image();
      img.src = capturedPhoto;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Calculate crop area based on zoom and pan
      const zoomFactor = zoom;
      const imgWidth = img.width;
      const imgHeight = img.height;
      
      // Calculate the visible area based on zoom
      const visibleWidth = imgWidth / zoomFactor;
      const visibleHeight = imgHeight / zoomFactor;
      
      // Calculate pan offset as percentage of visible area
      const panOffsetX = (pan.x / 150) * (visibleWidth / 2);
      const panOffsetY = (pan.y / 150) * (visibleHeight / 2);
      
      // Calculate crop rectangle (centered + pan offset)
      let cropX = (imgWidth - visibleWidth) / 2 - panOffsetX;
      let cropY = (imgHeight - visibleHeight) / 2 - panOffsetY;
      
      // Ensure crop stays within image bounds
      cropX = Math.max(0, Math.min(cropX, imgWidth - visibleWidth));
      cropY = Math.max(0, Math.min(cropY, imgHeight - visibleHeight));
      
      // Create canvas and crop the image
      const cropCanvas = document.createElement('canvas');
      const ctx = cropCanvas.getContext('2d');
      cropCanvas.width = visibleWidth;
      cropCanvas.height = visibleHeight;
      ctx?.drawImage(img, cropX, cropY, visibleWidth, visibleHeight, 0, 0, visibleWidth, visibleHeight);
      
      const finalPhoto = cropCanvas.toDataURL('image/jpeg', 0.9);
      const response = await fetch(finalPhoto);
      const blob = await response.blob();
      
      if (isEditMode && onReplaceConfirm) {
        const confirmed = await onReplaceConfirm();
        if (confirmed) {
          onCapture(blob);
          onClose();
        }
      } else {
        onCapture(blob);
        onClose();
      }
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsEditing(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    initCamera();
  };

  // Get image style with zoom and pan
  const getImageStyle = () => {
    return {
      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none' as const
    };
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold mb-2">Camera Access Denied</h3>
          <p className="text-gray-600 mb-4">
            Please allow camera access to take a profile photo.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white">
          {isEditMode ? 'Edit Profile Photo' : 'Take Profile Photo'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        
        {!isEditing ? (
          // Camera View - No zoom, just take photo
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          // Preview with Touch Zoom and Pan
          <div 
            ref={imageContainerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden bg-black"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                ref={imgRef}
                src={capturedPhoto!} 
                alt="Preview - Use two fingers to zoom, one finger to move" 
                className="max-w-full max-h-full object-contain"
                style={getImageStyle()}
                draggable={false}
              />
              
              {/* Guide overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-20 left-0 right-0 text-center">
                  <div className="inline-block bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 mx-auto">
                    <p className="text-white text-sm">
                      ✨ Pinch to zoom • Drag to move ✨
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Buttons */}
      <div className="p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-3 max-w-md mx-auto">
          {!isEditing ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={takePicture}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Accept Photo
              </button>
            </>
          )}
        </div>
        
        {/* Instructions for mobile */}
        {isEditing && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Use two fingers to zoom • Use one finger to move the photo
          </p>
        )}
      </div>
    </div>
  );
}