import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { useNavigate } from "react-router-dom";

export default function GuestHome() {
  const [selected, setSelected] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-[#040B17]">
      <Sidebar onSelect={(item) => setSelected(item)} />
      <div className="flex-1 relative">
        {/* Área de chat */}
        <ChatArea selected={selected} />

        {/* Aviso flotante para invitados (centrado arriba, una sola línea) */}
        {showBanner && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 z-10 px-3">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-[#6ACCFF] text-sm px-3 py-2 shadow-lg backdrop-blur-sm">
              <span className="whitespace-nowrap">Estás usando Aura en modo invitado. Algunas funciones requieren iniciar sesión.</span>
              <button onClick={() => navigate('/login')} className="px-4 py-1.5 rounded-full bg-[#6ACCFF] text-[#020710] hover:bg-[#6ACCFF]/90 whitespace-nowrap">Iniciar sesión</button>
              <button onClick={() => setShowBanner(false)} className="px-3 py-1.5 rounded-full text-[#6ACCFF] hover:bg-[#6ACCFF]/10 whitespace-nowrap">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
