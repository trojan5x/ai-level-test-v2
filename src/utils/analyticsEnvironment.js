const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isLocalDevEnvironment() {
  if (typeof window === 'undefined') return false;
  return LOCAL_DEV_HOSTS.has(window.location.hostname);
}

export function shouldTrackAnalytics() {
  return !isLocalDevEnvironment();
}

export function isDevLandingPage(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return LOCAL_DEV_HOSTS.has(hostname);
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}
