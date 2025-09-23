import React, { useEffect, useState } from "react"
import { FiMic } from "react-icons/fi"
import { auraAsk } from "../lib/api"

export default function ChatArea({ selected }) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])

  const suggestions = [
    { icon: "🍟", text: "Llévame a McDoñas" },
    { icon: "🔄", text: "¿Cómo inicio el servicio?" },
    { icon: "❓", text: "¿Quién es el rector?" },
  ]

  // cuando seleccionas un chat en el sidebar
  useEffect(() => {
    if (selected) {
      setMessages([
        { role: "user", content: selected.pregunta || "" },
        { role: "assistant", content: selected.respuesta || "" },
      ])
    }
  }, [selected])

  const sendQuestion = async (q) => {
    const pregunta = (q ?? text).trim()
    if (!pregunta || loading) return
    setLoading(true)
    setMessages((m) => [...m, { role: "user", content: pregunta }])
    setText("")
    try {
      const { data } = await auraAsk({
        usuario_correo: "jose@example.com",
        pregunta,
      })
      const respuesta = data?.respuesta ?? "Sin respuesta"
      setMessages((m) => [...m, { role: "assistant", content: respuesta }])
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "No pude obtener respuesta." }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendQuestion()
    }
  }

  return (
    <div className="flex-1 bg-gray-950 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-2xl px-4 py-3 rounded-2xl ${
              m.role === "user" ? "bg-blue-600/20 text-blue-100 self-end ml-auto" : "bg-gray-800 text-gray-100"
            }`}
          >
            {m.content}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <img src="/AURA.png" alt="Aura Robot" className="w-40 h-52 mb-6" />
            <h1 className="text-3xl font-light text-white mb-2">
              Hola! Soy <span className="text-blue-400 font-medium">aura</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">¿En qué puedo ayudarte?</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuestion(s.text)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full border border-gray-600 transition-colors"
                >
                  <span>{s.icon}</span>
                  <span className="text-sm">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl mx-auto mb-6 px-4">
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Pregunta lo que quieras"
            className="w-full bg-gray-800 text-white rounded-full px-6 py-4 pr-14 text-lg placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            disabled={loading}
          />
          <button
            onClick={() => sendQuestion()}
            disabled={loading || !text.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-60"
            title="Enviar"
          >
            <FiMic className="w-4 h-4 text-gray-800" />
          </button>
        </div>
        {loading && <p className="text-sm text-gray-400 mt-2">Pensando…</p>}
      </div>
    </div>
  )
}
