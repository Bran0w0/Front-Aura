import React, { useEffect, useState } from "react"
import LogoAura from "./LogoAura"
import ChatInput from "./ChatInput"
import { FiHelpCircle } from "react-icons/fi"
import { PiForkKnifeBold, PiGraduationCapBold } from "react-icons/pi"
import { chatAsk, getMessages } from "../lib/api"
import { getUserInfo } from "../lib/auth"

export default function ChatArea({ selected }) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [scrollerRef, setScrollerRef] = useState(null)
  const [containerEl, setContainerEl] = useState(null)
  const [dockRect, setDockRect] = useState({ left: 0, width: 0 })
  const [abortCtrl, setAbortCtrl] = useState(null)

  const suggestions = [
    { icon: <PiForkKnifeBold className="w-4 h-4 text-yellow-300" />, text: "Llévame a McDoñas" },
    { icon: <PiGraduationCapBold className="w-4 h-4 text-sky-300" />, text: "¿Cómo inicio el servicio?" },
    { icon: <FiHelpCircle className="w-4 h-4 text-purple-400" />, text: "¿Quién es el rector?" },
  ]

  useEffect(() => {
    const load = async () => {
      if (!selected?.conversation_id) {
        setConversationId(null)
        setMessages([])
        return
      }
      setConversationId(selected.conversation_id)
      try {
        const { data } = await getMessages({ conversation_id: selected.conversation_id })
        const msgs = (data?.messages || []).map((m) => ({ role: m.role, content: m.content }))
        setMessages(msgs)
      } catch {
        setMessages([])
      }
    }
    load()
  }, [selected])

  const sendQuestion = async (q) => {
    const pregunta = (q ?? text).trim()
    if (!pregunta || loading) return
    setLoading(true)
    setMessages((m) => [...m, { role: "user", content: pregunta }])
    setText("")
    try {
      const controller = new AbortController()
      setAbortCtrl(controller)
      const uid = getUserInfo()?.id
      const { data } = await chatAsk({ user_id: uid, content: pregunta, conversation_id: conversationId || null, create_if_missing: true }, { signal: controller.signal })
      const cid = data?.conversation_id
      if (cid && !conversationId) setConversationId(cid)
      const userMsg = data?.user_message
      const asstMsg = data?.assistant_message
      if (userMsg?.content && !messages.find((m) => m.content === userMsg.content)) {
        try { window.dispatchEvent(new CustomEvent("aura:conv-title", { detail: { id: cid, title: userMsg.content } })) } catch {}
      }
      setMessages((m) => [...m.filter(Boolean), { role: "assistant", content: asstMsg?.content || "Sin respuesta" }])
    } catch (e) {
      if (e && (e.code === 'ERR_CANCELED' || e.name === 'CanceledError' || e.message?.includes('canceled'))) {
        // cancelado por el usuario: no agregamos mensaje de error
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "No pude obtener respuesta." }])
      }
    } finally {
      setLoading(false)
      setAbortCtrl(null)
    }
  }

  // manejado dentro de ChatInput

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    try {
      if (scrollerRef) scrollerRef.scrollTop = scrollerRef.scrollHeight
    } catch {}
  }, [messages, scrollerRef])

  // Sincroniza el ancho del footer fijo con el ancho visible del ChatArea
  useEffect(() => {
    const update = () => {
      if (!containerEl) return
      const r = containerEl.getBoundingClientRect()
      setDockRect({ left: r.left, width: r.width })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [containerEl])

  const handleStop = () => { try { abortCtrl?.abort?.() } catch {}; setLoading(false); setAbortCtrl(null) }

  return (
    <div ref={setContainerEl} className="flex-1 bg-[#040B17] flex flex-col min-h-0 relative">
      {/* Marca superior sutil */}
      <div className="px-6 pt-4 hidden md:block flex-shrink-0">
        <LogoAura className="h-10" colorClass="text-[#33AACD]" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-36" ref={setScrollerRef}>
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          {messages.map((m, i) => (
            m.role === "user" ? (
              <div key={i} className="flex justify-end mb-4">
                <div className="inline-block bg-[#081A39] text-white rounded-full px-5 py-3 max-w-[80%]">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-3 mb-6">
                <img src="/AURA.png" alt="Aura" className="w-10 h-10" />
                <div className="text-gray-100 text-lg leading-7">
                  {m.content}
                </div>
              </div>
            )
          ))}
        </div>
      
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10">
            <img src="/AURA.png" alt="Aura Robot" className="w-40 h-52 mb-6" />
            <h1 className="text-4xl font-semibold text-white mb-1">
              Hola! Soy <span className="align-middle"><LogoAura className="inline-block h-[1.2em] align-middle" colorClass="text-[#33AACD]" /></span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">¿En qué puedo ayudarte?</p>

            <div className="w-full max-w-4xl mx-auto mb-8 px-4">
              <ChatInput
                value={text}
                onChange={(v) => setText(v)}
                onSubmit={() => sendQuestion()}
                onStop={handleStop}
                loading={loading}
                placeholder="Pregunta lo que quieras"
              />
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuestion(s.text)}
                  className="flex items-center gap-2 text-white/90 px-4 py-2 rounded-full border border-[#223555] bg-transparent hover:bg-white/5 transition-colors"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">{s.icon}</span>
                  <span className="text-sm">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior para escribir cuando ya hay mensajes */}
      {messages.length > 0 && (
        <div style={{ position: 'fixed', left: dockRect.left, width: dockRect.width, bottom: 12, background: '#040B17' }}>
          <div className="w-full max-w-4xl mx-auto px-4 pb-0 pt-2">
            <ChatInput
              value={text}
              onChange={(v) => setText(v)}
              onSubmit={() => sendQuestion()}
              onStop={handleStop}
              loading={loading}
              placeholder="Escribe un mensaje"
            />
            <p className="text-xs text-gray-400 text-center mt-2">AURA puede equivocarse. Trabajamos para que tengas la mejor asistente universitaria.</p>
          </div>
        </div>
      )}
    </div>
  )
}
