import React from "react"
import { ImArrowUp2 } from "react-icons/im"
import { IoSquareSharp } from "react-icons/io5"
import { PiMicrophoneBold } from "react-icons/pi"

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  loading = false,
  placeholder = "Escribe un mensaje",
}) {
  const textPresent = (value || "").trim().length > 0

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (loading) onStop?.()
      else if (textPresent) onSubmit?.()
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-[#081A39] text-white rounded-full py-5 pl-7 ${textPresent ? "pr-32" : "pr-16"} text-lg placeholder-gray-300 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#33AACD]`}
      />

      {/* Mic que se desplaza al aparecer texto */}
      <button
        type="button"
        title="Dictar"
        className={`absolute top-1/2 -translate-y-1/2 rounded-full cursor-pointer flex items-center justify-center text-white/90 hover:bg-white/10 transition-all duration-200 ease-out ${textPresent ? "right-16 w-11 h-11 opacity-100" : "right-3 w-11 h-11 opacity-0 pointer-events-none"}`}
      >
        <PiMicrophoneBold className="w-5 h-5 block" />
      </button>

      {/* Botón principal: mic (vacío) -> flecha (texto) -> stop (loading) */}
      <button
        onClick={() => {
          if (loading) onStop?.()
          else if (textPresent) onSubmit?.()
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full cursor-pointer disabled:cursor-default flex items-center justify-center hover:bg-gray-100 transition-colors"
        title={loading ? "Detener" : textPresent ? "Enviar" : "Micrófono"}
      >
        <span className="relative inline-block w-5 h-5">
          <ImArrowUp2 className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-gray-800 transition-opacity duration-150 ease-out ${textPresent && !loading ? 'opacity-100' : 'opacity-0'}`} />
          <PiMicrophoneBold className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-gray-800 transition-opacity duration-150 ease-out ${!textPresent && !loading ? 'opacity-100' : 'opacity-0'}`} />
          <IoSquareSharp className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-gray-800 transition-opacity duration-150 ease-out ${loading ? 'opacity-100' : 'opacity-0'}`} />
        </span>
      </button>
    </div>
  )
}

