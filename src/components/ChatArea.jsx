import { FiMic } from "react-icons/fi"

export default function ChatArea() {
  const suggestions = [
    { icon: "🍟", text: "Llevame a McDoñas" },
    { icon: "🔄", text: "¿Cómo inicio el servicio?" },
    { icon: "❓", text: "¿Quién es el rector?" },
  ]

  return (
    <div className="flex-1 bg-gray-950 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Robot Avatar */}
        <div className="mb-8">
          <img src="/AURA.png" alt="Aura Robot" className="w-48 h-60" />
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-2">
            Hola! Soy <span className="text-blue-400 font-medium">aura</span>
          </h1>
          <p className="text-xl text-gray-300">¿En qué puedo ayudarte?</p>
        </div>

        {/* Input Field */}
        <div className="w-full max-w-2xl mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Pregunta lo que quieras"
              className="w-full bg-gray-800 text-white rounded-full px-6 py-4 pr-14 text-lg placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
              <FiMic className="w-4 h-4 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Suggestion Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full border border-gray-600 transition-colors"
            >
              <span>{suggestion.icon}</span>
              <span className="text-sm">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
