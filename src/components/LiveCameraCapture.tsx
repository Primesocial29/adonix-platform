import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Loader2, X, CheckCircle, RotateCcw } from 'lucide-react';

interface LiveCameraCaptureProps {
  onCapture: (photoBlob: Blob) => void;
  onClose: () => void;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  isEditMode?: boolean;
  onReplaceConfirm?: () => Promise<boolean>;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const CROP_SIZE_FRACTION = 0.82;

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

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const lastDistanceRef = useRef(0);
  const lastZoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  useEffect(() => {
    initCamera();
    return () => { stopCamera(); };
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

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
    } catch {
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.95));
    setIsEditing(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    stopCamera();
  };

  const clampPan = useCallback((x: number, y: number, z: number) => {
    if (!containerRef.current) return { x, y };
    const rect = containerRef.current.getBoundingClientRect();
    const cropSize = Math.min(rect.width, rect.height) * CROP_SIZE_FRACTION;
    const maxPan = ((cropSize * z) - cropSize) / 2;
    return {
      x: Math.min(maxPan, Math.max(-maxPan, x)),
      y: Math.min(maxPan, Math.max(-maxPan, y))
    };
  }, []);

  const getTouchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      lastDistanceRef.current = getTouchDistance(e.touches);
      lastZoomRef.current = zoomRef.current;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      const newPan = clampPan(
        panRef.current.x + dx,
        panRef.current.y + dy,
        zoomRef.current
      );
      setPan(newPan);
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      if (lastDistanceRef.current > 0) {
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM,
          lastZoomRef.current * (dist / lastDistanceRef.current)
        ));
        setZoom(newZoom);
        const clamped = clampPan(panRef.current.x, panRef.current.y, newZoom);
        setPan(clamped);
      }
    }
  }, [clampPan]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleAccept = async () => {
    if (!capturedPhoto || !containerRef.current) return;

    const img = new Image();
    img.src = capturedPhoto;
    await new Promise<void>(res => { img.onload = () => res(); });

    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;
    const cropPx = Math.min(containerW, containerH) * CROP_SIZE_FRACTION;

    const displayScale = Math.min(
      (containerW * zoomRef.current) / img.width,
      (containerH * zoomRef.current) / img.height
    );

    const scaledImgW = img.width * displayScale;
    const scaledImgH = img.height * displayScale;

    const imgLeft = (containerW - scaledImgW) / 2 + panRef.current.x;
    const imgTop = (containerH - scaledImgH) / 2 + panRef.current.y;

    const cropLeft = (containerW - cropPx) / 2;
    const cropTop = (containerH - cropPx) / 2;

    const srcX = (cropLeft - imgLeft) / displayScale;
    const srcY = (cropTop - imgTop) / displayScale;
    const srcSize = cropPx / displayScale;

    const OUTPUT_SIZE = 800;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = OUTPUT_SIZE;
    cropCanvas.height = OUTPUT_SIZE;
    const ctx = cropCanvas.getContext('2d');
    ctx?.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const dataURL = cropCanvas.toDataURL('image/jpeg', 0.92);
    const response = await fetch(dataURL);
    const blob = await response.blob();

    if (isEditMode && onReplaceConfirm) {
      const confirmed = await onReplaceConfirm();
      if (confirmed) { onCapture(blob); onClose(); }
    } else {
      onCapture(blob);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsEditing(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    initCamera();
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold mb-2">Camera Access Denied</h3>
          <p className="text-gray-600 mb-4">Please allow camera access to take a profile photo.</p>
          <button onClick={onClose} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center px-4 py-3 bg-black/60 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">
          {isEditing ? 'Adjust & Crop' : isEditMode ? 'Edit Profile Photo' : 'Take Profile Photo'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {!isEditing ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center bg-black overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <img
              src={capturedPhoto!}
              alt="Preview"
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDraggingRef.current ? 'none' : 'transform 0.05s linear',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            />

            {/* Dark overlay with square cutout */}
            <div className="absolute inset-0 pointer-events-none" style={{ isolation: 'isolate' }}>
              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: 0 }}
              >
                <defs>
                  <mask id="cropMask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x="50%"
                      y="50%"
                      width={`${CROP_SIZE_FRACTION * 100}%`}
                      height={`${CROP_SIZE_FRACTION * 100}vmin`}
                      transform={`translate(-${CROP_SIZE_FRACTION * 50}%, -${CROP_SIZE_FRACTION * 50}vmin)`}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.55)"
                  mask="url(#cropMask)"
                />
              </svg>

              {/* Dashed crop border */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${CROP_SIZE_FRACTION * 100}vmin`,
                  height: `${CROP_SIZE_FRACTION * 100}vmin`,
                  maxWidth: `${CROP_SIZE_FRACTION * 100}%`,
                  maxHeight: `${CROP_SIZE_FRACTION * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  border: '2.5px dashed rgba(255,255,255,0.9)',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Corner accent marks */}
                {[
                  { top: -2, left: -2, borderTop: '3px solid white', borderLeft: '3px solid white', borderRadius: '2px 0 0 0' },
                  { top: -2, right: -2, borderTop: '3px solid white', borderRight: '3px solid white', borderRadius: '0 2px 0 0' },
                  { bottom: -2, left: -2, borderBottom: '3px solid white', borderLeft: '3px solid white', borderRadius: '0 0 0 2px' },
                  { bottom: -2, right: -2, borderBottom: '3px solid white', borderRight: '3px solid white', borderRadius: '0 0 2px 0' }
                ].map((style, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 22,
                      height: 22,
                      ...style
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              className="absolute bottom-4 left-0 right-0 text-center pointer-events-none"
            >
              <span className="text-white/70 text-xs bg-black/40 px-3 py-1 rounded-full">
                Pinch to zoom • Drag to reposition
              </span>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="px-4 py-4 bg-black/60 backdrop-blur-sm">
        {!isEditing ? (
          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={takePicture}
              className="flex-2 px-8 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Capture
            </button>
          </div>
        ) : (
          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
