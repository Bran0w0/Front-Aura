import { FiEdit3, FiSearch, FiMapPin, FiSettings, FiSidebar } from "react-icons/fi"

export default function Sidebar() {
  const chats = [
    "Quien es el rector de l...",
    "Quien es el rector de l...",
    "Quien es el rector de l...",
    "Quien es el rector de l...",
  ]

  return (
    <div className="w-80 bg-gray-900 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <img
            src="/Cabeza AURA.png"
            alt="Aura"
            className="w-9 h-8"
          />
          <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors">
            <FiSidebar className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-3">
        <button className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <FiEdit3 className="w-5 h-5" />
          <span>Nuevo chat</span>
        </button>
        <button className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <FiSearch className="w-5 h-5" />
          <span>Buscar chats</span>
        </button>
        <button className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <FiMapPin className="w-5 h-5" />
          <span>Ubicate</span>
        </button>
      </div>

      {/* Chats Section */}
      <div className="flex-1 px-4">
        <h3 className="text-blue-400 text-sm font-medium mb-4">Chats</h3>
        <div className="space-y-2">
          {chats.map((chat, index) => (
            <button
              key={index}
              className="w-full text-left p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
            >
              {chat}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        <button className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <FiSettings className="w-5 h-5" />
          <span>Ajustes</span>
        </button>
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">F</span>
          </div>
          <span className="text-sm">Fernando Gutierrez</span>
        </div>
      </div>
    </div>
  )
}
