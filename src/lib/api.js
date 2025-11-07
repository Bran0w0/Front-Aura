// src/lib/api.js
import axios from "axios";
import { getDeviceId, getSessionId } from "./auth";

const api = axios.create({
  // Recomendado: define VITE_API_URL=http://127.0.0.1:8000/api
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

export const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api");

// Cliente sin interceptor para operaciones de refresh/logout y evitar bucles
const authClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Garantiza un único refresh en vuelo para evitar tormentas de peticiones
let refreshPromise = null;
function refreshOnce({ refresh_token, device_id }) {
  if (!refreshPromise) {
    refreshPromise = authClient
      .post("/auth/refresh", { refresh_token, device_id })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Adjunta Authorization si existe access_token
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("aura_access_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  else {
    // modo invitado: enviar session id
    const sid = getSessionId();
    if (sid) config.headers["X-Session-Id"] = sid;
  }
  return config;
});

// Auto-refresh en 401 y reintenta 1 vez
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    const url = config?.url || "";
    // Evitar bucle: no intentar refresh si el 401 proviene del propio endpoint de refresh
    if (response && response.status === 401 && !config?._retry && !url.includes("/auth/refresh")) {
      const rt = localStorage.getItem("aura_refresh_token");
      if (!rt) throw error;
      config._retry = true;
      try {
        const device_id = getDeviceId();
        const { data } = await refreshOnce({ refresh_token: rt, device_id });
        if (data?.access_token) localStorage.setItem("aura_access_token", data.access_token);
        if (data?.refresh_token) localStorage.setItem("aura_refresh_token", data.refresh_token);
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${data.access_token}`;
        return api(config);
      } catch (e) {
        // Intento de conciliación entre pestañas: si otro contexto ya rotó el RT,
        // vuelve a leer y reintenta una sola vez con el RT actualizado.
        try {
          const device_id = getDeviceId();
          const latest = localStorage.getItem("aura_refresh_token");
          if (latest && latest !== rt) {
            const { data } = await refreshOnce({ refresh_token: latest, device_id });
            if (data?.access_token) localStorage.setItem("aura_access_token", data.access_token);
            if (data?.refresh_token) localStorage.setItem("aura_refresh_token", data.refresh_token);
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${data.access_token}`;
            return api(config);
          }
        } catch (_) {
          // cae a limpieza
        }
        // Limpia tokens si no se puede refrescar
        localStorage.removeItem("aura_access_token");
        localStorage.removeItem("aura_refresh_token");
        // Redirige a login (reemplaza el historial para evitar loops al volver)
        try {
          if (typeof window !== "undefined") window.location.replace("/login");
        } catch {}
        throw e;
      }
    }
    throw error;
  }
);

// --- Health ---
export const ping = () => api.get("/ping");

// --- Users (antes: /add-usuario, /usuarios) ---
export const createUser = (payload) => api.post("/users", payload);
export const getUsers = () => api.get("/users");

// --- Subjects (antes: /add-materia, /materias) ---
export const createSubject = (payload) => api.post("/subjects", payload);
export const getSubjects = () => api.get("/subjects");

// --- Schedules (antes: /add-horario, /horarios) ---
export const createSchedule = (payload) => api.post("/schedules", payload);
export const getSchedules = (usuario_correo) =>
  api.get("/schedules", { params: usuario_correo ? { usuario_correo } : {} });

// --- Note (singular, reemplaza notas/notes) ---
export const createNote = (payload) => api.post("/note", payload);
export const getNote = ({ user_id, status, tag } = {}) =>
  api.get("/note", { params: { ...(user_id ? { user_id } : {}), ...(status ? { status_f: status } : {}), ...(tag ? { tag } : {}) } });

// --- Chat (conversations/messages) ---
export const createConversation = (payload) => api.post("/chat/conversations", payload);
export const getConversations = ({ user_id, status, session_id } = {}) =>
  api.get("/chat/conversations", { params: { ...(user_id ? { user_id } : {}), ...(status ? { status_f: status } : {}), ...(session_id ? { session_id } : {}) } });
export const createMessage = (payload) => api.post("/chat/messages", payload);
export const getMessages = ({ conversation_id, user_id } = {}) =>
  api.get("/chat/messages", { params: { ...(conversation_id ? { conversation_id } : {}), ...(user_id ? { user_id } : {}) } });

export const deleteConversation = (id, params = {}) =>
  api.delete(`/chat/conversations/${id}`, { params });

// --- Chat orchestration ---
export const chatAsk = (payload, config = {}) => api.post("/chat/ask", payload, config);

// --- Aura IA ---
export const auraAsk = (payload, config = {}) => api.post("/aura/ask", payload, config);

export default api;
// --- Auth ---
export const authRegisterLocal = ({ email, password }) =>
  api.post("/auth/register", {
    user: { email, auth_provider: "local" },
    password,
  });

export const authLoginLocal = ({ email, password, device_id }) =>
  api.post("/auth/login", { email, password, device_id });

export const authLoginGoogle = ({ id_token, device_id }) =>
  api.post("/auth/google", { id_token, device_id });

export const authRefresh = ({ refresh_token, device_id }) =>
  authClient.post("/auth/refresh", { refresh_token, device_id });

export const authLogout = ({ refresh_token }) =>
  authClient.post("/auth/logout", { refresh_token });

export const authMe = () => api.get("/auth/me");
// --- Profile ---
export const getMyProfile = () => api.get("/profile");
export const updateMyProfile = (payload) => api.patch("/profile", payload);
// --- Academics: Catálogos ---
export const createDepartment = (payload) => api.post("/academics/departments", payload);
export const getDepartments = () => api.get("/academics/departments");
export const createProgram = (payload) => api.post("/academics/programs", payload);
export const getPrograms = (department_code) => api.get("/academics/programs", { params: department_code ? { department_code } : {} });
export const createPeriod = (payload) => api.post("/academics/periods", payload);
export const getPeriods = (status_f) => api.get("/academics/periods", { params: status_f ? { status_f } : {} });
export const createCourse = (payload) => api.post("/academics/courses", payload);
export const getCourses = () => api.get("/academics/courses");

// --- Academics: Timetables ---
export const createTimetable = (payload) => api.post("/academics/timetables", payload);
export const getTimetables = (params = {}) => api.get("/academics/timetables", { params });
export const publishTimetable = (id) => api.post(`/academics/timetables/${id}/publish`);
export const createTimetableEntries = (payload) => api.post("/academics/timetable-entries", payload);
export const getTimetableEntries = (timetable_id) => api.get("/academics/timetable-entries", { params: { timetable_id } });
