import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const defaultHost =
  Platform.OS === 'android'
    ? 'http://10.117.4.199:5000'
    : 'http://localhost:5000';

export async function createReport(
  listing: string,
  reason: string,
  description = ''
) {
  return api('/reports', {
    method: 'POST',
    body: JSON.stringify({
      listing,
      reason,
      description,
    }),
  });
}



export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || `${defaultHost}/api`
).replace(/\/$/, '');

export const SOCKET_URL = (
  process.env.EXPO_PUBLIC_SOCKET_URL || defaultHost
).replace(/\/$/, '');

export async function token() {
  return SecureStore.getItemAsync('marketly_token');
}

/**
 * Check whether the request body is FormData.
 *
 * React Native's FormData implementation can behave differently
 * from the browser implementation, so we check both instanceof
 * and the object's constructor name.
 */
function isFormData(value: unknown): value is FormData {
  if (!value) {
    return false;
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return true;
  }

  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any).constructor?.name === 'FormData'
  );
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const authToken = await token();

    const body = options.body;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    /**
     * IMPORTANT:
     *
     * Do NOT manually set Content-Type for FormData.
     *
     * React Native fetch automatically creates:
     *
     * multipart/form-data; boundary=...
     *
     * when FormData is used.
     */
    if (!isFormData(body)) {
      headers['Content-Type'] = 'application/json';
    }

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    let payload: any = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(
        payload?.message || `Request failed (${response.status})`
      );
    }

    return payload as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(
        'Request timed out. Check the API server and network.'
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Network request failed');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Upload a listing using multipart/form-data.
 */
export async function uploadListing(form: FormData) {
  return api('/listings', {
    method: 'POST',
    body: form,
  });
}
export function getImageUrl(path?: string) {
  if (!path) {
    return '';
  }

  const baseUrl = API_URL.replace(/\/api\/?$/, '');

  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    try {
      const url = new URL(path);

      return `${baseUrl}${url.pathname}${url.search}`;
    } catch {
      return path;
    }
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}