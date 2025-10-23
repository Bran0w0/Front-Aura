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

export function getSessionId() {
  const key = "aura_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    if (window.crypto?.randomUUID) id = window.crypto.randomUUID();
    else id = Math.random().toString(36).slice(2) + Date.now().toString(36);
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

// Decodifica un JWT sin validar firma (solo para UI)
export function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserInfo() {
  const t = getAccessToken();
  if (!t) return null;
  const p = parseJwt(t);
  if (!p) return null;
  return { id: p.sub, email: p.email };
}

// Color HSL determinístico a partir de un string
export function colorFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 45%)`;
}
