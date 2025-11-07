import React, { useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { getMyProfile, updateMyProfile, getDepartments, getPrograms } from "../lib/api";
import { getUserInfo, colorFromString } from "../lib/auth";

// Catálogo local por defecto (se usa si la API aún no tiene datos)
const DEFAULT_DEPARTMENTS = [
  { code: "DASC", name: "Departamento Académico de Sistemas Computacionales" },
];

const DEFAULT_PROGRAMS = {
  DASC: [
    { code: "IDS", name: "INGENIERO EN DESARROLLO DE SOFTWARE" },
    { code: "ITC", name: "INGENIERO EN TECNOLOGÍA COMPUTACIONAL" },
    { code: "IC", name: "INGENIERO EN CIBERSEGURIDAD" },
    { code: "LATI", name: "LICENCIADO EN ADMINISTRACIÓN DE TECNOLOGÍAS DE LA INFORMACIÓN" },
    { code: "LITI", name: "LICENCIADO EN TECNOLOGÍAS DE LA INFORMACIÓN" },
  ],
};

export default function ProfilePanel({ open, onClose }) {
  const user = getUserInfo();
  const email = user?.email || "invitado@aura";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [programsByDept, setProgramsByDept] = useState(DEFAULT_PROGRAMS);

  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("DASC");
  const [program, setProgram] = useState("");
  const [shift, setShift] = useState(""); // TM | TV
  const [semester, setSemester] = useState("");

  // Deriva avatar de nombre si existe; si no, del email
  const displayName = (fullName?.trim() || email);
  const initial = (displayName?.[0] || "U").toUpperCase();
  const avatarBg = colorFromString(displayName);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        // Intenta cargar catálogos desde la API; si falla, usa defaults
        try {
          const { data: dpts } = await getDepartments();
          const dep = (dpts?.departments || []).length ? dpts.departments : DEFAULT_DEPARTMENTS;
          setDepartments(dep);
          const map = { ...DEFAULT_PROGRAMS };
          for (const it of dep) {
            try {
              const { data: prog } = await getPrograms(it.code);
              const list = (prog?.programs || []).length ? prog.programs : (DEFAULT_PROGRAMS[it.code] || []);
              map[it.code] = list;
            } catch {
              map[it.code] = DEFAULT_PROGRAMS[it.code] || [];
            }
          }
          setProgramsByDept(map);
        } catch {}

        try {
          const { data } = await getMyProfile();
          const p = (data?.profile || {});
          setFullName(p.full_name || "");
          setProgram(p.major || "");
          setSemester(p.semester || "");
          setShift(p.shift || "");
        } catch {}
      } catch (e) {
        setError(e?.response?.data?.detail || e.message);
      } finally {
        setLoading(false);
      }
    };
    if (open) load();
  }, [open]);

  // Opciones de semestre: LITI/LATI 1..7; otros 1..9
  const semesterOptions = useMemo(() => {
    const upper = String(program || "").toUpperCase();
    const max = (upper === "LITI" || upper === "LATI") ? 7 : 9;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [program]);

  const programList = useMemo(() => programsByDept[department] || [], [programsByDept, department]);

  const onSave = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...(fullName ? { full_name: fullName } : {}),
        ...(program ? { major: program.toUpperCase() } : {}),
        ...(semester ? { semester: Number(semester) } : {}),
        ...(shift ? { shift } : {}),
      };
      await updateMyProfile(payload);
      onClose?.();
      // Notifica a otras vistas que podrían depender del perfil (horario)
      try { window.dispatchEvent(new CustomEvent("aura:profile-updated")); } catch {}
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  // Cerrar con tecla Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-[min(560px,100%)] max-h-[90vh] bg-[#040F20] text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} aria-modal="true" role="dialog">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="text-lg font-semibold">Perfil</div>
            <button className="p-2 rounded-lg hover:bg-white/10" onClick={onClose} aria-label="Cerrar">
              <IoClose className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6 overflow-y-auto aura-scroll" style={{ maxHeight: 'calc(90vh - 64px)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: avatarBg }}>
                <span className="text-white text-2xl font-medium leading-none">{initial}</span>
              </div>
              <div className="text-center">
                <div className="text-xl font-medium">{fullName || "Alumno"}</div>
                <div className="text-gray-400 text-sm">{email}</div>
              </div>
            </div>

          {loading && <div className="text-gray-400">Cargando…</div>}
          {error && <div className="text-red-400 text-sm">{error}</div>}

          {/* Campos */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Nombre</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ingresa tu nombre" className="w-full bg-[#020B16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#33AACD]" />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Departamento</label>
              <select value={department} onChange={(e) => { setDepartment(e.target.value); setProgram(""); }} className="w-full bg-[#020B16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#33AACD]">
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>{d.code} · {d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Carrera</label>
              <select value={program} onChange={(e) => setProgram(e.target.value)} className="w-full bg-[#020B16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#33AACD]">
                <option value="" disabled>Selecciona tu carrera</option>
                {programList.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Turno</label>
                <select value={shift} onChange={(e) => setShift(e.target.value)} className="w-full bg-[#020B16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#33AACD]">
                  <option value="">—</option>
                  <option value="TM">TM</option>
                  <option value="TV">TV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Semestre</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full bg-[#020B16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#33AACD]">
                  <option value="" disabled>—</option>
                  {semesterOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

            <div className="pt-2">
              <button disabled={saving} onClick={onSave} className="w-full px-4 py-2.5 rounded-2xl bg-[#6ACCFF] text-[#020710] hover:bg-[#6ACCFF]/90 disabled:opacity-60 mb-4">
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
