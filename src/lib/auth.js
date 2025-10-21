// Utilidades simples de autenticación para el Front

export function getDeviceId() {
  const key = "aura_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    // Usa crypto si está disponible
    if (window.crypto?.randomUUID) {
      id = window.crypto.randomUUID();
    } else {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    localStorage.setItem(key, id);
  }
  return id;
}

export function saveTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem("aura_access_token", access_token);
  if (refresh_token) localStorage.setItem("aura_refresh_token", refresh_token);
}

export function getAccessToken() {
  return localStorage.getItem("aura_access_token");
}

export function clearTokens() {
  localStorage.removeItem("aura_access_token");
  localStorage.removeItem("aura_refresh_token");
}

export function getRefreshToken() {
  return localStorage.getItem("aura_refresh_token");
}
