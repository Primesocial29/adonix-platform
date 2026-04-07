import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onSkip?: () => void;
}

export default function CameraCapture({ onCapture, onSkip }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setLoading(true);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setLoading(false);
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions to continue.');
      setLoading(false);
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoDataUrl);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <Camera className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Take Your Profile Photo</h1>
          <p className="text-gray-400 text-lg">
            Live camera photo required. No gallery uploads to ensure authenticity.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="relative aspect-video bg-black">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-300 mb-4">{error}</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-full font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!capturedPhoto ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="p-6">
            {!capturedPhoto ? (
              <div className="space-y-3">
                <button
                  onClick={capturePhoto}
                  disabled={loading || !!error}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capture Photo
                </button>
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="w-full py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={retake}
                  className="py-4 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-5 h-5" />
                  Retake
                </button>
                <button
                  onClick={confirmPhoto}
                  className="py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-full font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Looks Good
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
