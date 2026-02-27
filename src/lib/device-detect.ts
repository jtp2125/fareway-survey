/**
 * Detect device type from User-Agent string.
 */
export function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();

  // Tablets first (some tablets have 'mobile' in UA)
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/android/.test(ua) && !/mobile/.test(ua)) return 'tablet';

  // Mobile
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return 'mobile';

  return 'desktop';
}
