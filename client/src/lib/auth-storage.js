const ACCESS_KEY = 'campus_mitra_access_token';
const REFRESH_KEY = 'campus_mitra_refresh_token';

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export async function getAccessToken() {
  return getStorage()?.getItem(ACCESS_KEY) || null;
}

export async function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_KEY) || null;
}

export async function setAccessToken(token) {
  const storage = getStorage();
  if (!storage) return;

  if (token) {
    storage.setItem(ACCESS_KEY, token);
  } else {
    storage.removeItem(ACCESS_KEY);
  }
}

export async function setTokens(accessToken, refreshToken) {
  const storage = getStorage();
  if (!storage) return;

  if (accessToken) {
    storage.setItem(ACCESS_KEY, accessToken);
  } else {
    storage.removeItem(ACCESS_KEY);
  }

  if (refreshToken) {
    storage.setItem(REFRESH_KEY, refreshToken);
  } else {
    storage.removeItem(REFRESH_KEY);
  }
}

export async function clearTokens() {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(ACCESS_KEY);
  storage.removeItem(REFRESH_KEY);
}
