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
        // cancelado por el usuario
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "No pude obtener respuesta." }])
      }
    } finally {
      setLoading(false)
      setAbortCtrl(null)
    }
  }

  useEffect(() => {
    try { if (scrollerRef) scrollerRef.scrollTop = scrollerRef.scrollHeight } catch {}
  }, [messages, scrollerRef])

  useEffect(() => {
    const update = () => {
      if (!containerEl) return
      const r = containerEl.getBoundingClientRect()
      setDockRect({ left: r.left, width: r.width })
    }
    update()
    window.addEventListener('resize', update)
    let ro
    try {
      ro = new ResizeObserver(() => update())
      if (containerEl) ro.observe(containerEl)
    } catch {}
    return () => {
      window.removeEventListener('resize', update)
      try { ro?.disconnect?.() } catch {}
    }
  }, [containerEl])

  const handleStop = () => { try { abortCtrl?.abort?.() } catch {}; setLoading(false); setAbortCtrl(null) }

  return (
    <div ref={setContainerEl} className="flex-1 bg-[#040B17] flex flex-col min-h-0 relative overflow-x-hidden">
      {/* Header se vuelve sticky dentro del área scrolleable */}

      {/* Scroll area (no scroll in mobile on empty state) */}
      <div
        className={`${messages.length === 0 ? 'overflow-hidden md:overflow-y-auto pb-0' : 'overflow-y-auto pb-36'} flex-1 min-h-0 pt-[72px]`}
        ref={setScrollerRef}
      >
        {/* Fixed header aligned to chat container with solid background */}
        <div
          style={{ position: 'fixed', left: dockRect.left, width: dockRect.width, top: 'max(env(safe-area-inset-top), 0px)' }}
          className="z-40"
        >
          <div className="relative h-[72px] bg-[#040B17]">
            {/* Fila posicionada exactamente como el botón móvil: top-4, h-12 */}
            <div className="absolute inset-x-0 top-4 h-12 flex items-center pl-[80px] md:pl-6 pr-4">
              <LogoAura className="h-10" colorClass="text-[#33AACD]" />
            </div>
          </div>
        </div>
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          {messages.map((m, i) => (
            m.role === "user" ? (
              <div key={i} className="flex justify-end mb-4">
                <div className={`inline-block bg-[#081A39] text-white px-5 py-3 max-w-[80%] ${(() => {
                  const t = (m.content || "").toString();
                  return t.includes("\n") || t.length > 48 ? "rounded-3xl" : "rounded-full";
                })()}`}>{m.content}</div>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-3 mb-6">
                <img src="/AURA.png" alt="Aura" className="w-10 h-10" />
                <div className="text-gray-100 text-lg leading-7">{m.content}</div>
              </div>
            )
          ))}
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-start md:justify-center py-6 md:py-10">
            <img src="/AURA.png" alt="Aura Robot" className="w-36 h-48 md:w-40 md:h-52 mb-5 md:mb-6" />
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-1">
              Hola! Soy <span className="align-middle"><LogoAura className="inline-block h-10 md:h-[1.2em] align-middle" colorClass="text-[#33AACD]" /></span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8">¿En qué puedo ayudarte?</p>

            {/* Input desktop en home (antes de conversar) */}
            <div className="w-full max-w-4xl mx-auto mb-8 px-4 hidden md:block">
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
                <button key={idx} onClick={() => sendQuestion(s.text)} className="flex items-center gap-2 text-white/90 px-4 py-2 rounded-full border border-[#223555] bg-transparent hover:bg-white/5 transition-colors">
                  <span className="inline-flex items-center justify-center w-5 h-5">{s.icon}</span>
                  <span className="text-sm">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cortina inferior para ocultar contenido debajo del input (estilo ChatGPT) */}
      {messages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: dockRect.left,
            width: dockRect.width,
            bottom: 0,
            height: 72,
            pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(4,11,23,1) 60%, rgba(4,11,23,0) 100%)',
          }}
        />
      )}

      {/* Barra inferior fija: en móvil siempre; en desktop solo con mensajes */}
      <div style={{ position: 'fixed', left: dockRect.left, width: dockRect.width, bottom: 'max(env(safe-area-inset-bottom), 16px)' }} className={`z-50 ${messages.length === 0 ? 'md:hidden' : ''}`}>
        <div className="w-full max-w-4xl mx-auto px-4 pb-0 pt-2">
          <ChatInput
            value={text}
            onChange={(v) => setText(v)}
            onSubmit={() => sendQuestion()}
            onStop={handleStop}
            loading={loading}
            placeholder={messages.length > 0 ? 'Escribe un mensaje' : 'Pregunta lo que quieras'}
          />
          {messages.length > 0 && (
            <p className="hidden md:block text-xs text-gray-400 text-center mt-2">AURA puede equivocarse. Trabajamos para que tengas la mejor asistente universitaria.</p>
          )}
        </div>
      </div>
    </div>
  )
}
