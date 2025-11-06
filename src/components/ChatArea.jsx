import React, { useEffect, useState, useRef } from "react"
import LogoAura from "./LogoAura"
import ChatInput from "./ChatInput"
import { FiHelpCircle } from "react-icons/fi"
import { PiForkKnifeBold, PiGraduationCapBold } from "react-icons/pi"
import { chatAsk, getMessages, API_BASE } from "../lib/api"
import { getUserInfo } from "../lib/auth"

import aura_error from "../animations/aura_error"
import aura_idle from "../animations/aura_idle"
import aura_blink from "../animations/aura_blink"
import aura_stretch from "../animations/aura_stretch"
import aura_wave from "../animations/aura_wave";
import aura_think from "../animations/aura_think";
import aura_got_it from "../animations/aura_got_it";
import Aura from "./Aura"

export default function ChatArea({ selected }) {
  const auraWrapperRef = useRef(null);
  const collapseTimerRef = useRef(null);

  const [currentAnimation, setCurrentAnimation] = useState(aura_wave);
  const [thinkLoop, setThinkLoop] = useState(false);

  useEffect(() => {
    // Después de 1 ciclo de aura_wave, el componente mismo
    // detectará "onComplete" y volverá a idle
  }, []);

  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [scrollerRef, setScrollerRef] = useState(null)
  const [containerEl, setContainerEl] = useState(null)
  const [dockRect, setDockRect] = useState({ left: 0, width: 0 })
  const [abortCtrl, setAbortCtrl] = useState(null)
  const [previewImg, setPreviewImg] = useState(null)

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!messages.length) return;

    const lastMsg = messages[messages.length - 1];

    if (lastMsg.role === "assistant") {
      setCurrentAnimation(aura_got_it);
      setThinkLoop(false)
    } else if (lastMsg.role === "user") {
      setThinkLoop(true)
      setCurrentAnimation(aura_think);
    }
  }, [messages]);

  const [auraWrapper, setAuraWrapper] = useState("aura-center");

  useEffect(() => {
    if (hasMessages) {
      setAuraWrapper("aura-left");
    } else {
      setAuraWrapper("aura-center");
    }
  }, [hasMessages]);

  const [chatWrapper, setChatWrapper] = useState("chat-center");

  useEffect(() => {
    if (hasMessages) {
      setChatWrapper("chat-left");
    } else {
      setChatWrapper("chat-center");
    }
  }, [hasMessages]);

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
        const msgs = (data?.messages || []).map((m) => ({ role: m.role, content: m.content, attachments: m.attachments || [] }))
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
        try { window.dispatchEvent(new CustomEvent("aura:conv-title", { detail: { id: cid, title: userMsg.content } })) } catch { }
      }
      setMessages((m) => [
        ...m.filter(Boolean),
        { role: "assistant", content: asstMsg?.content || "Sin respuesta", attachments: asstMsg?.attachments || [] },
      ])
    } catch (e) {
      if (e && (e.code === 'ERR_CANCELED' || e.name === 'CanceledError' || e.message?.includes('canceled'))) {
        // cancelado por el usuario
      } else {
        setCurrentAnimation(aura_error)
        setMessages((m) => [...m, { role: "assistant", content: "No pude obtener respuesta." }])
      }
    } finally {
      setLoading(false)
      setAbortCtrl(null)
    }
  }

  useEffect(() => {
    try { if (scrollerRef) scrollerRef.scrollTop = scrollerRef.scrollHeight } catch { }
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
    } catch { }
    return () => {
      window.removeEventListener('resize', update)
      try { ro?.disconnect?.() } catch { }
    }
  }, [containerEl])

  const handleStop = () => { try { abortCtrl?.abort?.() } catch { }; setLoading(false); setAbortCtrl(null) }

  const [messagesPaddingTop, setMessagesPaddingTop] = useState(420);
  const [overlayExpanded, setOverlayExpanded] = useState(false);

  // limpiar timers al desmontar
  useEffect(() => {
    return () => clearTimeout(collapseTimerRef.current);
  }, []);

  // detectar mensajes: expandir al enviar usuario; cuando responde el assistant, esperar 4s y colapsar
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const last = messages[messages.length - 1];

    if (last.role === "user") {
      // usuario mandó mensaje: mostrar AURA completa hasta que responda
      clearTimeout(collapseTimerRef.current);
      setOverlayExpanded(true);
    } else if (last.role === "assistant") {
      // asistente respondió: mostrar AURA completa y mantener 4s antes de cubrir
      clearTimeout(collapseTimerRef.current);
      setOverlayExpanded(true);
      collapseTimerRef.current = setTimeout(() => {
        setOverlayExpanded(false);
      }, 4000);
    }
  }, [messages]);

  const headVisibleHeight = 500;
  const overlayHeightCollapsed = Math.max(0, messagesPaddingTop - headVisibleHeight);
  const overlayHeight = overlayExpanded ? 0 : overlayHeightCollapsed;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const auraStyle = isMobile
    ? {
        position: "fixed",
        top: `calc(max(env(safe-area-inset-top), 0px) - ${hasMessages ? "100px" : "75px"})`,
        left: dockRect.left,
        width: dockRect.width,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 1,
        transform: "none",
      }
    : {};

  useEffect(() => {
    const update = () => {
      const el = auraWrapperRef.current;
      if (!el) return;

      // Si Aura está fixed en móvil medimos su rect en viewport.
      // Si no está fixed (desktop) usamos offsetHeight como fallback.
      const rect = el.getBoundingClientRect();
      const bottom = rect && rect.bottom ? rect.bottom : el.offsetHeight;
      // añadimos 8-16px de separación
      setMessagesPaddingTop(Math.ceil(bottom + 12));
    };

    update();
    window.addEventListener("resize", update);
    // si cambian variables que mueven aura, actualiza también:
    return () => window.removeEventListener("resize", update);
  }, [isMobile, /* si usas dockRect cambia aquí para re-mediciones */]);

  const HEADER_HEIGHT = 72; // px

  return (
    <div className="relative">
      <div ref={auraWrapperRef} className={`aura-wrapper ${auraWrapper}`} style={auraStyle}>
        <Aura
          thinking={thinkLoop}
          idleAnimation={aura_idle}
          idleAlternates={[aura_blink, aura_wave, aura_stretch]}
          currentAnimation={currentAnimation}
          onAnimationComplete={() => {
            setCurrentAnimation(null);
          }}
        />
      </div>

      {/* Overlay: fijo, usa dockRect para alinearlo con el ancho del layout */}
      {isMobile && hasMessages && (
        <div
          style={{
            position: "fixed",
            left: dockRect.left,
            width: dockRect.width,
            bottom: "max(env(safe-area-inset-bottom), 0px)",
            height: overlayHeight,
            pointerEvents: "none",
            transition: "height 1s cubic-bezier(0.4, 0.8, 0.4, 1)",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {/* Gradiente opaco abajo → transparente arriba */}
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(to top, rgba(4,11,23,1.0) 0%, rgba(4,11,23,1.0) 45%, rgba(4, 11, 23, 1) 70%, rgba(4,11,23,0) 100%)",
              boxShadow: "0 -20px 40px rgba(4,11,23,0.8)",
            }}
          />
        </div>
      )}

      <div>
        <div ref={setContainerEl} className="flex-1 flex flex-col min-h-0 relative overflow-x-hidden" style={{ height: '100dvh' }}>
          {/* Header se vuelve sticky dentro del área scrolleable */}

          {/* Scroll area (no scroll in mobile on empty state) */}
          <div
            className={`${messages.length === 0 ? 'overflow-hidden md:overflow-y-auto pb-0' : 'overflow-y-auto pb-36'} flex-1 min-h-0`}
            ref={setScrollerRef}
            style={{
              position: 'fixed',
              left: dockRect.left,
              width: dockRect.width,
              top: 0,
              bottom: 0,
              paddingTop: hasMessages ? (isMobile ? 300 : messagesPaddingTop) : 0,
              zIndex: 2,
              transition: "padding-top 300ms cubic-bezier(.2,.9,.2,1)",
              overscrollBehavior: 'contain',
            }}
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
                    <div className="text-gray-100 text-lg leading-7">
                      <div className="whitespace-pre-wrap">{sanitizeContent(m.content, m.attachments)}</div>
                      {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {m.attachments.map((u, idx) => {
                            const isImg = /\.(png|jpe?g|webp|gif)$/i.test(u)
                            const isPdf = /\.pdf($|\?)/i.test(u)
                            const downloadUrl = `${API_BASE}/library/download?u=${encodeURIComponent(u)}`
                            return (
                              <div key={idx} className="border border-[#1a2a44] rounded-xl p-2 bg-[#0b1426] max-w-sm">
                                {isImg ? (
                                  <button type="button" className="block focus:outline-none" onClick={() => setPreviewImg(u)} title="Ver imagen">
                                    <img src={u} alt="adjunto" className="w-full h-auto max-h-72 object-contain rounded-lg" />
                                  </button>
                                ) : isPdf ? (
                                  <div className="text-sm text-gray-200">PDF adjunto</div>
                                ) : (
                                  <div className="text-sm text-gray-200">Archivo</div>
                                )}
                                <div className="mt-2 flex gap-2">
                                  {isImg ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImg(u)}
                                      className="text-xs text-sky-300 hover:underline"
                                      title="Ver imagen"
                                    >
                                      Ver
                                    </button>
                                  ) : (
                                    <a
                                      href={u}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-sky-300 hover:underline"
                                    >
                                      Ver
                                    </a>
                                  )}
                                  <a
                                    href={downloadUrl}
                                    className="text-xs text-gray-300 hover:underline"
                                  >
                                    Descargar
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-start md:justify-center py-6 md:py-10 mt-100">
                {/*<img src="/AURA.png" alt="Aura Robot" className="w-36 h-48 md:w-40 md:h-52 mb-5 md:mb-6" />*/}
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

          {previewImg && (
            <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black text-xl flex items-center justify-center shadow"
                  onClick={() => setPreviewImg(null)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <img src={previewImg} alt="imagen" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" />
                <div className="mt-3 flex justify-center">
                  <a href={`${API_BASE}/library/download?u=${encodeURIComponent(previewImg)}`} className="px-3 py-1.5 text-sm rounded bg-white/90 text-[#0b1426] hover:bg-white">Descargar</a>
                </div>
              </div>
            </div>
          )}

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
      </div>
    </div>
  )
}

function sanitizeContent(text, attachments) {
  let s = (text || "").toString()
  // Si hay adjuntos, oculta URLs crudas y líneas de "Descargar/Ver"
  if (attachments && attachments.length > 0) {
    try {
      // Quita líneas que contengan alguna URL adjunta
      const lines = s.split(/\n+/)
      const cleaned = lines.filter((ln) => {
        const hasUrl = (attachments || []).some((u) => ln.includes(u))
        if (hasUrl) return false
        const lower = ln.trim().toLowerCase()
        if (lower.startsWith("descargar/ver") || lower.startsWith("descargar:") || lower.startsWith("ver:")) return false
        // Quita líneas que parezcan URLs sueltas
        if (/https?:\/\//i.test(lower) && lower.length > 20) return false
        return true
      })
      s = cleaned.join("\n").trim()
    } catch { }
  }
  return s
}
