import { Platform, Linking } from 'react-native';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://fda-safewatch.onrender.com';

export interface UpdateInfo {
  version: string;
  apkUrl: string;
  forceUpdate?: boolean;
  releaseNotes?: string;
}

/**
 * Compares two semantic version strings (e.g. "1.0.0" vs "1.0.1").
 * Returns true if latest > current (i.e. an update is available).
 */
export function isUpdateAvailable(current: string, latest: string): boolean {
  const currentParts = (current || '').split('.').map((p) => parseInt(p, 10) || 0);
  const latestParts = (latest || '').split('.').map((p) => parseInt(p, 10) || 0);
  const length = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < length; i++) {
    const cur = currentParts[i] || 0;
    const lat = latestParts[i] || 0;

    if (lat > cur) return true;
    if (lat < cur) return false;
  }

  return false;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/app-version`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Update server returned status ${response.status}`);
      return null;
    }

    const data: Partial<UpdateInfo> = await response.json();

    if (
      typeof data.version !== 'string' ||
      !/^\d+(\.\d+)*$/.test(data.version) ||
      typeof data.apkUrl !== 'string' ||
      !data.apkUrl.trim()
    ) {
      return null;
    }

    const trimmedUrl = data.apkUrl.trim();
    const fullApkUrl =
      trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
        ? trimmedUrl
        : `${API_BASE_URL}${trimmedUrl.startsWith('/') ? '' : '/'}${trimmedUrl}`;

    const update: UpdateInfo = {
      version: data.version,
      apkUrl: fullApkUrl,
      forceUpdate: data.forceUpdate === true,
      releaseNotes:
        typeof data.releaseNotes === 'string' && data.releaseNotes.trim()
          ? data.releaseNotes.trim()
          : undefined,
    };

    const currentVersion =
      Application.nativeApplicationVersion || '1.0.0';

    console.log('Current app version:', currentVersion);
    console.log('Latest remote version:', update.version);

    if (isUpdateAvailable(currentVersion, update.version)) {
      console.log('Remote update is available:', update);
      return update;
    }

    console.log('App is up to date.');
    return null;
  } catch (error) {
    console.log('UPDATE CHECK ERROR:', error);
    return null;
  }
}

export async function downloadAndInstallUpdate(
  update: UpdateInfo,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (!update.apkUrl) {
    throw new Error('APK download URL is missing.');
  }

  if (Platform.OS !== 'android') {
    // Open in browser on non-Android platforms
    await Linking.openURL(update.apkUrl);
    return;
  }

  const fileName = `fda-safewatch-v${update.version}.apk`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  console.log('Downloading remote update from:', update.apkUrl);
  console.log('Saving APK to:', fileUri);

  const downloadResumable = FileSystem.createDownloadResumable(
    update.apkUrl,
    fileUri,
    {},
    (downloadProgress) => {
      if (downloadProgress.totalBytesExpectedToWrite > 0) {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    }
  );

  const result = await downloadResumable.downloadAsync();

  if (!result?.uri) {
    throw new Error('APK download failed. Please check your internet connection.');
  }

  if (result.status && (result.status < 200 || result.status >= 300)) {
    // Clean up invalid downloaded error page
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    throw new Error(
      `APK download failed (HTTP ${result.status}). The release file was not found or is in a private repository.`
    );
  }

  // Validate that the file is an actual APK (greater than 1MB)
  const fileInfo = await FileSystem.getInfoAsync(result.uri);
  if (fileInfo.exists && typeof fileInfo.size === 'number' && fileInfo.size < 1024 * 1024) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    throw new Error(
      `Downloaded file is corrupted or an error page (${Math.round(fileInfo.size / 1024)} KB). Please verify the APK URL.`
    );
  }

  console.log('APK successfully downloaded:', result.uri, 'Size:', fileInfo.exists ? fileInfo.size : 'unknown');

  try {
    const contentUri = await FileSystem.getContentUriAsync(result.uri);
    console.log('Content URI ready for installation:', contentUri);

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: 'application/vnd.android.package-archive',
      flags: 1 | 2,
    });
  } catch (intentErr) {
    console.warn('Direct package installer launch failed, opening APK in browser:', intentErr);
    await Linking.openURL(update.apkUrl);
  }
}
