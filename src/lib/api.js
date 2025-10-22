// src/lib/api.js
import axios from "axios";

const api = axios.create({
  // Recomendado: define VITE_API_URL=http://127.0.0.1:8000/api
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Adjunta Authorization si existe access_token
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("aura_access_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

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
export const getConversations = ({ user_id, status } = {}) =>
  api.get("/chat/conversations", { params: { ...(user_id ? { user_id } : {}), ...(status ? { status_f: status } : {}) } });
export const createMessage = (payload) => api.post("/chat/messages", payload);
export const getMessages = ({ conversation_id, user_id } = {}) =>
  api.get("/chat/messages", { params: { ...(conversation_id ? { conversation_id } : {}), ...(user_id ? { user_id } : {}) } });

// --- Chat orchestration ---
export const chatAsk = (payload) => api.post("/chat/ask", payload);

// --- Aura IA ---
export const auraAsk = (payload) => api.post("/aura/ask", payload);

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
  api.post("/auth/refresh", { refresh_token, device_id });

export const authLogout = ({ refresh_token }) =>
  api.post("/auth/logout", { refresh_token });

export const authMe = () => api.get("/auth/me");
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
