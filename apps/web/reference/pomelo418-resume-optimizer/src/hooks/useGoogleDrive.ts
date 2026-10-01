/**
 * useGoogleDrive.ts
 *
 * Manages Google OAuth token lifecycle and exposes a single `saveFile` helper.
 *
 * The @react-oauth/google useGoogleLogin hook handles the popup OAuth flow.
 * We store the short-lived access token in component state (not localStorage
 * — tokens expire in ~1 hour and storing them in localStorage is a security
 * anti-pattern for sensitive scopes).
 */

import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { uploadToDrive } from '../services/googleDriveService';
import type { GoogleDriveFile } from '../types';

interface UseGoogleDriveReturn {
  isConnected: boolean;
  isLoading: boolean;
  savedFile: GoogleDriveFile | null;
  login: () => void;
  logout: () => void;
  saveFile: (blob: Blob, fileName: string, mimeType: string) => Promise<GoogleDriveFile>;
}

export function useGoogleDrive(): UseGoogleDriveReturn {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedFile, setSavedFile] = useState<GoogleDriveFile | null>(null);

  const googleLogin = useGoogleLogin({
    // drive.file scope lets us create files but not read the user's existing Drive.
    // This is the minimum necessary scope — principle of least privilege.
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
    },
  });

  const login = useCallback(() => googleLogin(), [googleLogin]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setSavedFile(null);
  }, []);

  const saveFile = useCallback(
    async (blob: Blob, fileName: string, mimeType: string): Promise<GoogleDriveFile> => {
      if (!accessToken) throw new Error('Not authenticated with Google Drive. Please sign in first.');

      setIsLoading(true);
      try {
        const file = await uploadToDrive(accessToken, blob, fileName, mimeType);
        setSavedFile(file);
        return file;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  return {
    isConnected: !!accessToken,
    isLoading,
    savedFile,
    login,
    logout,
    saveFile,
  };
}
