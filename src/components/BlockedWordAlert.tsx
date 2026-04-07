// src/components/BlockedWordAlert.tsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface BlockedWordAlertProps {
  blockedWords: string[];
  onClose?: () => void;
}

export default function BlockedWordAlert({ blockedWords, onClose }: BlockedWordAlertProps) {
  if (blockedWords.length === 0) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">Content Not Allowed</p>
            <p className="text-red-300 text-sm mt-1">
              Your text contains blocked words that are not allowed on Hot Buddies:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {blockedWords.map((word, index) => (
                <span key={index} className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded">
                  {word}
                </span>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3">
              For safety, we don't allow sharing personal contact info, social media handles, 
              or adult content. Please remove these words.
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}