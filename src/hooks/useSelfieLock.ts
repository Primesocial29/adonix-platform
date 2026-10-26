import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LOCK_MESSAGE =
  'You must complete your profile and verify your identity via live selfie to use this feature.';

export function useSelfieLock() {
  const { user } = useAuth();
  const selfieVerified = !!(user?.user_metadata?.selfie_verified);

  const guarded = useCallback(
    (action: () => void) => {
      if (!selfieVerified) {
        alert(LOCK_MESSAGE);
        return;
      }
      action();
    },
    [selfieVerified],
  );

  return { selfieVerified, guarded, lockMessage: LOCK_MESSAGE };
}
