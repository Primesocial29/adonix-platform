import { Turnstile } from '@marsidev/react-turnstile';
import { useState, useEffect } from 'react';

interface TurnstileCaptchaProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileCaptcha({ onSuccess, onError, onExpire }: TurnstileCaptchaProps) {
  const [siteKey, setSiteKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    const devKey = import.meta.env.VITE_TURNSTILE_SITE_KEY_DEV;
    const prodKey = import.meta.env.VITE_TURNSTILE_SITE_KEY_PROD;
    
    const fallbackDevKey = '0x4AAAAAAAC85hzmi4sizIJ-y';
    const fallbackProdKey = '0x4AAAAAAAS5hzmj4sizJ-y';
    
    let key = '';
    if (isDev) {
      key = devKey || fallbackDevKey;
      console.log('Using Turnstile DEV key');
    } else {
      key = prodKey || fallbackProdKey;
      console.log('Using Turnstile PROD key');
    }
    
    setSiteKey(key);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: 'dark',
      }}
    />
  );
}