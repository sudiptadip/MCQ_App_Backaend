import { getDeviceFingerprint } from './fingerprint';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5207';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // Add the device fingerprint required by the backend's DeviceValidationMiddleware
    const fingerprint = getDeviceFingerprint();
    if (fingerprint) {
      defaultHeaders['X-Device-Fingerprint'] = fingerprint;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event("auth-change"));
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.title || 'API request failed');
  }

  return response.json();
}
