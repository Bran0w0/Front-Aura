import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { FiEdit, FiSearch, FiMapPin, FiSidebar, FiLogOut, FiLogIn, FiSettings, FiMoreHorizontal, FiTrash2 } from "react-icons/fi"
import { HiMenuAlt2 } from "react-icons/hi"
import { IoClose } from "react-icons/io5"
import AuraHead from "./AuraHead"
import { getConversations, createConversation, authMe, authLogout, deleteConversation, updateConversation } from "../lib/api"
import { clearTokens, getRefreshToken, getUserInfo, getAccessToken, colorFromString } from "../lib/auth"
import { useNavigate } from "react-router-dom"

export default function Sidebar({ onSelect, onOpenProfile }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [fixedPos, setFixedPos] = useState({ left: 0, bottom: 24, width: 300 })
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState("")
  const navigate = useNavigate()
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const searchInputRef = useRef(null)
  const [menuFor, setMenuFor] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [menuAnchor, setMenuAnchor] = useState(null)
  const menuRef = useRef(null)

  const user = getUserInfo()
  const [fullName, setFullName] = useState("")
  const email = user?.email || "invitado@aura"
  const isGuest = !user
  const displayName = isGuest ? "Cuenta Invitado" : (fullName || email)
  const initial = (isGuest ? "I" : (displayName[0] || "U")).toUpperCase()
  const avatarBg = colorFromString(displayName)

  useEffect(() => { (async () => {
    try {
      const uid = getUserInfo()?.id
      let list = []
      if (uid) {
        const { data } = await getConversations({ user_id: uid })
        list = (data?.conversations || []).map((c) => ({ conversation_id: c.id, title: c.title || "Nuevo chat", updated_at: c.updated_at || "" }))
      } else {
        // Modo invitado: no cargar desde el servidor; chats efímeros por sesión
        list = []
      }
      list.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
      setItems(list)
    } catch { setError("No pude cargar tus chats.") } finally { setLoading(false) }
  })() }, [])

  useEffect(() => {
    const onTitle = (e) => {
      const { id, title } = e.detail || {}
      if (!title) return
      const uid = getUserInfo()?.id
      const guest = !uid
      setItems((prev) => {
        if (guest) {
          // En invitado, actualiza el primer chat local (null id) en lugar de crear uno con id de servidor
          const idx = prev.findIndex((it) => it.conversation_id == null)
          if (idx >= 0) {
            const copy = prev.slice()
            copy[idx] = { ...copy[idx], title, updated_at: new Date().toISOString() }
            return copy
          }
          return prev
        }
        if (!id) return prev
        const exists = prev.some((it) => it.conversation_id === id)
        if (exists) return prev.map((it) => (it.conversation_id === id ? { ...it, title, updated_at: new Date().toISOString() } : it))
        const newItem = { conversation_id: id, title, updated_at: new Date().toISOString() }
        return [newItem, ...prev]
      })
    }
    window.addEventListener("aura:conv-title", onTitle)
    return () => window.removeEventListener("aura:conv-title", onTitle)
  }, [])

  useEffect(() => { (async () => {
    try { const { data } = await authMe(); const name = data?.profile?.full_name || ""; if (name) setFullName(name) } catch {}
  })() }, [user])

  useEffect(() => {
    if (!profileOpen || !collapsed) return
    const update = () => {
      try {
        const panel = document.getElementById('aura-sidebar')
        const pr = panel?.getBoundingClientRect()
        const br = profileBtnRef.current?.getBoundingClientRect()
        if (pr && br) {
          const left = Math.round(pr.left + 12)
          const bottom = Math.max(24, Math.round((window.innerHeight - br.top) + 8))
          const width = Math.max(260, Math.round(pr.width - 24))
          setFixedPos({ left, bottom, width })
        }
      } catch {}
    }
    update();
    window.addEventListener('resize', update); window.addEventListener('scroll', update, true)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [profileOpen, collapsed])

  // Cerrar al hacer click/touch fuera del menÃº (sirve para portal y absoluto)
  useEffect(() => {
    if (!profileOpen) return
    const onDoc = (e) => {
      const t = e.target
      if (profileMenuRef.current?.contains(t)) return
      if (profileBtnRef.current?.contains(t)) return
      setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  }, [profileOpen])

  const closeSearch = () => {
    try { searchInputRef.current?.blur?.() } catch {}
    setSearchOpen(false)
    setSearch("")
  }

  // Cerrar buscador con ESC
  useEffect(() => {
    if (!searchOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeSearch() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  // Cerrar menú contextual de cada chat con ESC o clic fuera
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuFor(null) }
    const onDown = () => setMenuFor(null)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    // Cierra al scrollear el sidebar
    const sb = document.getElementById('aura-sidebar')
    const onScroll = () => setMenuFor(null)
    try { sb?.addEventListener('scroll', onScroll, { passive: true }) } catch {}
    return () => { 
      document.removeEventListener('keydown', onKey); 
      document.removeEventListener('mousedown', onDown);
      try { sb?.removeEventListener('scroll', onScroll) } catch {}
    }
  }, [])

  // Reposiciona para evitar recortes en bordes de viewport
  useEffect(() => {
    if (!menuFor || !menuAnchor) return
    const el = menuRef.current
    if (!el) return
    const pad = 8
    const rect = el.getBoundingClientRect()
    let top = menuPos.top
    let left = menuPos.left
    const vh = window.innerHeight
    const vw = window.innerWidth
    if (rect.bottom > vh - pad) {
      // Desplaza hacia arriba pero manteniendo el menú bajo el botón (no invertir)
      top = Math.max(pad, Math.round(vh - pad - rect.height))
    }
    if (rect.right > vw - pad) {
      left = Math.max(pad, Math.min(vw - rect.width - pad, left))
    }
    if (top !== menuPos.top || left !== menuPos.left) setMenuPos({ top, left })
  }, [menuFor, menuAnchor, menuPos.top, menuPos.left])

  const rowBase = "grid grid-cols-[56px_auto] items-center gap-x-1 w-full h-12 px-0 hover:bg-white/5 rounded-2xl cursor-pointer"
  const iconCell = "w-14 h-12 flex items-center justify-center"
  const labelCell = "text-base text-left truncate"

  const profileMenu = (
    <div ref={profileMenuRef} className="bg-transparent backdrop-blur-lg text-white rounded-2xl border border-white/10 ring-1 ring-inset ring-white/10 shadow-xl overflow-hidden">
      <div className="px-4 py-3 text-sm text-gray-300 border-b border-white/10 truncate">{email}</div>
      {!isGuest && (
        <button onClick={() => { setProfileOpen(false); onOpenProfile?.(); }} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/10 transition-colors">
          <FiSettings className="w-5 h-5 text-gray-300" />
          <span>Perfil</span>
        </button>
      )}
      {isGuest ? (
        <button onClick={() => { setProfileOpen(false); navigate('/login') }} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/10 transition-colors">
          <FiLogIn className="w-5 h-5 text-gray-300" />
          <span>Iniciar sesión</span>
        </button>
      ) : (
        <button onClick={async () => { setProfileOpen(false); const rt = getRefreshToken(); try { if (rt) await authLogout({ refresh_token: rt }) } catch {} finally { clearTokens(); navigate('/', { replace: true }) } }} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/10 transition-colors">
          <FiLogOut className="w-5 h-5 text-gray-300" />
          <span>Salir</span>
        </button>
      )}
    </div>
  )

  return (
    <>
      <button className="lg:hidden fixed top-4 left-3 z-50 w-14 h-12 flex items-center justify-center text-white hover:opacity-80" onClick={() => setMobileOpen(v=>!v)} aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}>
        {mobileOpen ? <IoClose className="w-8 h-8 text-white" /> : <HiMenuAlt2 className="w-7 h-7" />}
      </button>
      {mobileOpen && (<div className="lg:hidden fixed inset-0 z-70 bg-black/50 backdrop-blur-[1px]" onClick={() => setMobileOpen(false)} />)}

      <div id="aura-sidebar" className={`bg-[#020710] text-white h-[100dvh] flex flex-col border-r border-white/10 transition-all ${collapsed ? 'w-20' : 'w-80'} lg:static lg:translate-x-0 lg:z-0 fixed top-0 left-0 z-80 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-3 h-[72px] border-b border-white/10">
          <div className="grid grid-cols-[56px_auto_48px] items-center py-3">
            {collapsed ? (
              <button onClick={() => setCollapsed(false)} className="group relative w-14 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors cursor-pointer lg:cursor-ew-resize" title="Expandir">
                <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0"><AuraHead className="w-8 h-8" title="Aura" /></span>
                <FiSidebar className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </button>
            ) : (
              <button onClick={() => { 
                if (window.innerWidth < 1024) setMobileOpen(false); 
                // Actúa como "Nuevo chat": reinicia la conversación actual
                try { onSelect?.({ conversation_id: null, title: 'Nuevo chat', updated_at: new Date().toISOString() }) } catch {}
                const token = getAccessToken();
                navigate(token ? '/home' : '/');
              }} className="w-14 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors cursor-pointer" title="Inicio">
                <AuraHead className="w-8 h-8" title="Aura" />
              </button>
            )}
            <div />
            {!collapsed && (
              <button onClick={() => (window.innerWidth < 1024 ? setMobileOpen(false) : setCollapsed(true))} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors lg:cursor-ew-resize" title="Colapsar">
                {mobileOpen ? (<IoClose className="w-6 h-6 text-white" />) : (<FiSidebar className="w-5 h-5 text-gray-400" />)}
              </button>
            )}
          </div>
        </div>

        <div className="px-3 pt-4 pb-2 space-y-1">
          <button className={`${rowBase}`} onClick={async () => {
            try {
              const uid = getUserInfo()?.id
              // No crear conversación inmediata. Solo selecciona un chat vacío.
              const newItem = { conversation_id: null, title: 'Nuevo chat', updated_at: new Date().toISOString() }
              onSelect?.(newItem)
            } catch {}
            if (window.innerWidth < 1024) setMobileOpen(false)
          }}>
            <span className={iconCell}><FiEdit className="w-5 h-5" /></span>
            <span className={`${labelCell} ${collapsed ? 'opacity-0' : ''}`}>Nuevo chat</span>
          </button>

          {!isGuest && (
            <button className={`${rowBase}`} onClick={() => { setSearchOpen(true); setSearch(""); if (collapsed) setCollapsed(false); setTimeout(() => { try { searchInputRef.current?.focus?.() } catch {} }, 0) }}>
              <span className={iconCell}><FiSearch className="w-5 h-5" /></span>
              <span className={`${labelCell} ${collapsed ? 'opacity-0' : ''}`}>Buscar chats</span>
            </button>
          )}

          <button className={`${rowBase}`} onClick={() => { navigate('/map'); if (window.innerWidth < 1024) setMobileOpen(false) }}>
            <span className={iconCell}><FiMapPin className="w-5 h-5" /></span>
            <span className={`${labelCell} ${collapsed ? 'opacity-0' : ''}`}>Ubícate</span>
          </button>
        </div>

        {!isGuest && (
          <>
            <div className="px-3 pt-2">
              {!collapsed && <h3 className="text-[#33AACD] text-base font-semibold mb-2 pl-[18px]">Chats</h3>}
              {!collapsed && loading && <p className="text-gray-400 text-base pl-[18px]">Cargando...</p>}
              {!collapsed && error && <p className="text-red-400 text-base pl-[18px]">{error}</p>}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3">
              {!collapsed && !loading && !error && (
                <div className="space-y-1">
                  {(() => {
                    const q = search.trim().toLowerCase()
                    const filtered = q ? items.filter(it => (it.title || 'Nuevo chat').toLowerCase().includes(q)) : items
                    if (filtered.length === 0) return (<p className="text-gray-500 text-base pl-[18px]">Aun no tienes chats.</p>)
                    return (
                      <>
                        {filtered.map((c, i) => {
                          const open = menuFor === c.conversation_id
                          return (
                            <div key={i} className="group relative">
                              <button
                                onClick={() => { onSelect?.(c); if (window.innerWidth < 1024) setMobileOpen(false) }}
                                className={`w-full text-left pr-8 py-2 pl-[18px] text-gray-300 rounded-xl text-base overflow-hidden ${open ? 'bg-white/5' : ''} group-hover:bg-white/5`}
                                title={c.title}
                              >
                                <span className="block truncate">{c.title || 'Nuevo chat'}</span>
                              </button>
                              {c.conversation_id && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      const r = e.currentTarget.getBoundingClientRect();
                                      setMenuAnchor({ top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height })
                                      setMenuPos({ top: Math.round(r.bottom + 8), left: Math.round(r.right + 8) });
                                      setMenuFor(open ? null : c.conversation_id)
                                    }}
                                    className={`p-1.5 rounded-lg text-gray-400 cursor-pointer transition-opacity md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto md:group-hover:text-white ${open ? 'opacity-100 md:opacity-100 pointer-events-auto md:pointer-events-auto text-white' : ''}`}
                                    title="Más opciones"
                                  >
                                    <FiMoreHorizontal className="w-5 h-5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </>
        )}

        {isGuest && (<div className="flex-1 min-h-0" />)}

        <div className="px-3 py-4 border-t border-white/10 relative">
          <button ref={profileBtnRef} className={`${rowBase}`} onClick={() => setProfileOpen(v=>!v)}>
            <span className={iconCell}><div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: avatarBg }}><span className="text-white text-sm font-medium leading-none">{initial}</span></div></span>
            <span className={`${labelCell} ${collapsed ? 'opacity-0' : ''}`}>{displayName}</span>
          </button>
          {profileOpen && (
            collapsed
              ? createPortal(
                  <div style={{ position: 'fixed', left: fixedPos.left, bottom: fixedPos.bottom, width: fixedPos.width }} className="z-[130]">
                    {profileMenu}
                  </div>, document.body)
              : (<div className="absolute left-3 right-3 bottom-24 z-[120]">{profileMenu}</div>)
          )}
        </div>
      </div>

      {!isGuest && searchOpen && createPortal(
        <div className="fixed inset-0 z-[140]">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full h-full flex items-start justify-center pt-10 md:pt-20 px-4" aria-modal="true" role="dialog" onClick={closeSearch}>
            <div className="w-[min(860px,100%)] max-h-[70vh] bg-transparent backdrop-blur-xl text-white rounded-2xl border border-white/10 ring-1 ring-inset ring-white/10 shadow-2xl overflow-hidden transform-gpu will-change-transform" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-gray-200 font-semibold">Buscar chats</div>
                <button className="p-2 rounded-md hover:bg-white/10" onClick={closeSearch} aria-label="Cerrar">
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 pt-3 pb-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Busca chats por nombre"
                  className="w-full bg-[#020B16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#33AACD]"
                />
              </div>
              <div className="px-3 pb-2">
                <button
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5"
                  onClick={async () => {
                    try {
                      // No crear conversación ni agregar al sidebar; solo selecciona chat vacío
                      const newItem = { conversation_id: null, title: 'Nuevo chat', updated_at: new Date().toISOString() }
                      onSelect?.(newItem)
                    } catch {}
                    closeSearch()
                  }}
                >
                  <FiEdit className="w-5 h-5 text-gray-300" />
                  <span className="text-gray-200">Nuevo chat</span>
                </button>
              </div>
              <div className="px-3 pb-6 overflow-y-auto aura-scroll" style={{ maxHeight: 'calc(70vh - 120px)', contain: 'content' }}>
                <div className="divide-y divide-white/5">
                  {(() => {
                    const q = search.trim().toLowerCase()
                    const filtered = q ? items.filter(it => (it.title || 'Nuevo chat').toLowerCase().includes(q)) : items
                    if (filtered.length === 0) return (<p className="text-gray-500 text-base pl-2 py-4">No hay resultados.</p>)
                    return (
                      <>
                        {filtered.map((c, i) => (
                          <button key={i}
                            onClick={() => { onSelect?.(c); closeSearch(); if (window.innerWidth < 1024) setMobileOpen(false) }}
                            className="w-full text-left px-3 py-3 hover:bg-white/5 text-gray-300 rounded-2xl last:mb-3"
                            title={c.title}
                          >
                            <span className="block truncate">{c.title || 'Nuevo chat'}</span>
                          </button>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>, document.body)}

      {menuFor && createPortal(
        <div className="fixed inset-0 z-[160]" onMouseDown={() => setMenuFor(null)} onClick={() => setMenuFor(null)}>
          <div
            className="fixed bg-transparent backdrop-blur-lg text-white rounded-2xl border border-white/10 ring-1 ring-inset ring-white/10 shadow-2xl overflow-hidden"
            style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, width: '208px' }}
            onMouseDown={(e)=>{ e.stopPropagation() }}
            onClick={(e)=>{ e.stopPropagation() }}
            ref={menuRef}
          >
            <button
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-200 hover:bg-white/10"
              onClick={async () => {
                try {
                  const current = (items.find(it=>it.conversation_id===menuFor)?.title) || ''
                  const name = (window.prompt('Nuevo nombre del chat', current) || '').trim()
                  if (!name) { setMenuFor(null); return }
                  await updateConversation(menuFor, { title: name })
                  setItems(prev => prev.map(it => it.conversation_id === menuFor ? { ...it, title: name, updated_at: new Date().toISOString() } : it))
                  setMenuFor(null)
                } catch { setMenuFor(null) }
              }}
            >
              <FiEdit className="w-4 h-4 text-gray-300" />
              <span>Cambiar nombre</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-400 hover:bg-white/10"
              onClick={async () => {
                try {
                  const uid = getUserInfo()?.id
                  if (uid) {
                    await deleteConversation(menuFor)
                  }
                  setItems(prev => prev.filter(it => it.conversation_id !== menuFor))
                  onSelect?.({ conversation_id: null, title: 'Nuevo chat', updated_at: new Date().toISOString() })
                } catch {}
                setMenuFor(null)
              }}
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>, document.body)}
    </>
  )
}
