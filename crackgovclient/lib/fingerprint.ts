export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  let fingerprint = localStorage.getItem('device_fingerprint');
  if (!fingerprint) {
    // Generate a simple unique string for now
    fingerprint = 'dfp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_fingerprint', fingerprint);
  }
  return fingerprint;
}
