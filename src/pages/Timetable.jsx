import { useEffect, useMemo, useState } from "react";
import { authMe } from "../lib/api";
import { getTimetables, getTimetableEntries } from "../lib/api";

const DAY_LABELS = { mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb" };

export default function Timetable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [header, setHeader] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        // Perfil
        const me = await authMe();
        const profile = me?.data || {};
        const major = (profile?.profile?.major || "").toUpperCase();
        const semester = profile?.profile?.semester;
        const shift = profile?.profile?.shift || undefined;
        if (!major || !semester) throw new Error("Completa tu carrera y semestre en Perfil.");
        // Busca timetable vigente para combinación; si no hay shift no lo filtramos
        const params = { department_code: "DASC", program_code: major, semester, is_current: true };
        if (shift) params.shift = shift;
        const tt = await getTimetables(params);
        const item = (tt?.data?.timetables || [])[0];
        if (!item) throw new Error("No hay horario publicado para tu combinación.");
        setHeader(item);
        const list = await getTimetableEntries(item.id);
        setEntries(list?.data?.entries || []);
      } catch (e) {
        setError(e?.response?.data?.detail || e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };
    for (const e of entries) {
      map[e.day]?.push(e);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    return map;
  }, [entries]);

  return (
    <div className="flex-1 p-6 text-white bg-[#040B17]">
      <h1 className="text-2xl font-semibold mb-2">Mi horario</h1>
      {header && (
        <p className="text-gray-400 mb-6">{header.title} · {header.shift || ""}</p>
      )}
      {loading && <p className="text-gray-400">Cargando…</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(DAY_LABELS).map(([key, label]) => (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <h3 className="text-blue-400 font-medium mb-3">{label}</h3>
              <div className="space-y-3">
                {grouped[key].length === 0 && (
                  <div className="text-gray-500 text-sm">—</div>
                )}
                {grouped[key].map((e, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-2 text-sm border border-gray-700">
                    <div className="text-gray-300">{e.start_time}–{e.end_time}</div>
                    <div className="text-white font-medium">{e.course_name}</div>
                    {e.instructor && <div className="text-gray-400">{e.instructor}</div>}
                    {(e.room_code || e.module) && (
                      <div className="text-gray-500">{e.room_code}{e.module ? ` · ${e.module}` : ""}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

