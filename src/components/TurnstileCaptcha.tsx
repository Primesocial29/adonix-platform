import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileCaptchaProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileCaptcha({ onSuccess, onError, onExpire }: TurnstileCaptchaProps) {
  // Use Cloudflare's test key that ALWAYS works
  const siteKey = "1x00000000000000000000AA";
  
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