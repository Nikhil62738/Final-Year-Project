import { Platform } from 'react-native';
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

function compareVersions(current: string, latest: string): number {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  const length = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < length; i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return 1;
    if (latestPart < currentPart) return -1;
  }

  return 0;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    if (Platform.OS !== 'android') {
      return null;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/app-version`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Update server returned ${response.status}`);
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

    let apkUrl: URL;
    try {
      apkUrl = new URL(data.apkUrl);
    } catch {
      return null;
    }

    if (apkUrl.protocol !== 'https:') {
      return null;
    }

    const update: UpdateInfo = {
      version: data.version,
      apkUrl: apkUrl.toString(),
      forceUpdate: data.forceUpdate === true,
      releaseNotes:
        typeof data.releaseNotes === 'string'
          ? data.releaseNotes
          : undefined,
    };

    const currentVersion =
      Application.nativeApplicationVersion || '1.0.0';

    console.log('Current app version:', currentVersion);
    console.log('Latest app version:', data.version);

    const comparison = compareVersions(
      currentVersion,
      update.version
    );

    if (comparison < 0) {
      return update;
    }

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
  if (Platform.OS !== 'android') {
    throw new Error('APK updates are supported only on Android.');
  }

  if (!update.apkUrl) {
    throw new Error('APK download URL is missing.');
  }

  const fileName = `fda-safewatch-${update.version}.apk`;

  const fileUri =
    `${FileSystem.cacheDirectory}${fileName}`;

  console.log('Downloading update from:', update.apkUrl);
  console.log('Saving APK to:', fileUri);

  const downloadResumable =
    FileSystem.createDownloadResumable(
      update.apkUrl,
      fileUri,
      {},
      (downloadProgress) => {
        if (
          downloadProgress.totalBytesExpectedToWrite > 0
        ) {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;

          onProgress?.(progress);
        }
      }
    );

  const result = await downloadResumable.downloadAsync();

  if (!result?.uri) {
    throw new Error('APK download failed.');
  }

  console.log('APK downloaded:', result.uri);

  const contentUri =
    await FileSystem.getContentUriAsync(result.uri);

  console.log('APK content URI:', contentUri);

  await IntentLauncher.startActivityAsync(
    'android.intent.action.VIEW',
    {
      data: contentUri,
      type: 'application/vnd.android.package-archive',
      flags: 1 | 2,
    }
  );
}
