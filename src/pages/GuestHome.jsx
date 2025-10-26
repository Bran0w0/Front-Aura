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

        {/* Aviso flotante para invitados - desktop como antes; móvil full-width fixed */}
        {showBanner && (
          <div className="fixed top-16 left-0 right-0 z-30 px-3 sm:absolute sm:top-4 sm:left-1/2 sm:-translate-x-1/2 sm:px-0">
            <div className="flex flex-col sm:inline-flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-white/5 text-[#6ACCFF] text-sm px-3 py-2 shadow-lg backdrop-blur-sm max-w-[900px] w-full sm:w-auto mx-auto">
              <span className="text-center sm:text-left sm:whitespace-nowrap">Estás usando Aura en modo invitado. Algunas funciones requieren iniciar sesión.</span>
              <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start">
                <button onClick={() => navigate('/login')} className="px-4 py-1.5 rounded-full bg-[#6ACCFF] text-[#020710] hover:bg-[#6ACCFF]/90 sm:whitespace-nowrap">Iniciar sesión</button>
                <button onClick={() => setShowBanner(false)} className="px-3 py-1.5 rounded-full text-[#6ACCFF] hover:bg-[#6ACCFF]/10 sm:whitespace-nowrap">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

