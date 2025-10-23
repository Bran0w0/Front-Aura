import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { useNavigate } from "react-router-dom";

export default function GuestHome() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar onSelect={(item) => setSelected(item)} />
      <div className="flex-1 flex flex-col">
        <div className="bg-amber-500/10 text-amber-300 text-sm px-4 py-2 border-b border-amber-600/30 flex items-center justify-between">
          <span>Estás usando Aura en modo invitado. Algunas funciones requieren iniciar sesión.</span>
          <button onClick={() => navigate("/login") } className="bg-amber-500 hover:bg-amber-400 text-gray-900 px-3 py-1 rounded">Iniciar sesión</button>
        </div>
        <ChatArea selected={selected} />
      </div>
    </div>
  );
}

