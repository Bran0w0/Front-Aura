// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
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

// --- Notes (antes: /add-nota, /notas) ---
export const createNote = (payload) => api.post("/notes", payload);
export const getNotes = (usuario_correo) =>
  api.get("/notes", { params: usuario_correo ? { usuario_correo } : {} });

// --- Queries (antes: /consultas) ---
export const createQuery = (payload) => api.post("/queries", payload);
export const getQueries = (usuario_correo) =>
  api.get("/queries", { params: usuario_correo ? { usuario_correo } : {} });

// --- Aura IA ---
export const auraAsk = (payload) => api.post("/aura/ask", payload);

export default api;
