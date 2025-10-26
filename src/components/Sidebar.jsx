import { useEffect, useState } from "react"
import { FiEdit, FiSearch, FiMapPin, FiSettings, FiSidebar, FiLogOut } from "react-icons/fi"
import AuraHead from "./AuraHead"
import { getConversations, createConversation, authMe } from "../lib/api"
import { authLogout } from "../lib/api"
import { clearTokens, getRefreshToken, getUserInfo, colorFromString, getSessionId } from "../lib/auth"
import { useNavigate } from "react-router-dom"

export default function Sidebar({ onSelect }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const user = getUserInfo()
  const [fullName, setFullName] = useState("")
  const email = user?.email || "usuario@aura"
  const initial = (email[0] || "U").toUpperCase()
  const avatarBg = colorFromString(email)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = getUserInfo()?.id
        let list = []
        if (uid) {
          const { data } = await getConversations({ user_id: uid })
          list = (data?.conversations || []).map((c) => ({ conversation_id: c.id, title: c.title || "Nuevo chat", updated_at: c.updated_at || "" }))
        } else {
          const sid = getSessionId()
          const { data } = await getConversations({ session_id: sid })
          list = (data?.conversations || []).map((c) => ({ conversation_id: c.id, title: c.title || "Nuevo chat", updated_at: c.updated_at || "" }))
        }
        list.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
        setItems(list)
      } catch {
        setError("No pude cargar tus chats.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const onTitle = (e) => {
      const { id, title } = e.detail || {}
      if (!id || !title) return
      setItems((prev) => prev.map((it) => (it.conversation_id === id ? { ...it, title } : it)))
    }
    window.addEventListener("aura:conv-title", onTitle)
    return () => window.removeEventListener("aura:conv-title", onTitle)
  }, [])

  useEffect(() => {
    const loadMe = async () => {
      try {
        const { data } = await authMe()
        const name = data?.profile?.full_name || ""
        if (name) setFullName(name)
      } catch {}
    }
    if (user) loadMe()
  }, [user])

  const rowBase = "grid grid-cols-[56px_auto] items-center gap-x-1 w-full h-12 px-0 hover:bg-white/5 rounded-2xl cursor-pointer"
  const iconCell = "w-14 h-12 flex items-center justify-center"
  const labelCell = "text-base text-left truncate"

  return (
    <div id="aura-sidebar" className={`bg-[#020710] text-white h-screen flex flex-col border-r border-white/10 transition-all ${collapsed ? "w-20" : "w-80"}`}>
      <div className="px-3 py-4 border-b border-white/10">
        <div className="grid grid-cols-[56px_auto_48px] items-center">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="group relative w-14 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors cursor-ew-resize"
              title="Expandir"
            >
              <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0">
                <AuraHead className="w-8 h-8" title="Aura" />
              </span>
              <FiSidebar className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/home')}
              className="w-14 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Inicio"
            >
              <AuraHead className="w-8 h-8" title="Aura" />
            </button>
          )}
          <div />
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 transition-colors cursor-ew-resize"
              title="Colapsar"
            >
              <FiSidebar className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      <div className="px-3 py-4 space-y-1">
        <button className={`${rowBase}`}
          onClick={async () => {
            try {
              const uid = getUserInfo()?.id
              if (uid) {
                const { data } = await createConversation({ user_id: uid, title: "Nuevo chat" })
                const cid = data?.id
                if (!cid) return
                const newItem = { conversation_id: cid, title: "Nuevo chat", updated_at: new Date().toISOString() }
                setItems((prev) => [newItem, ...prev])
                onSelect?.(newItem)
              } else {
                const newItem = { conversation_id: null, title: "Nuevo chat", updated_at: new Date().toISOString() }
                setItems((prev) => [newItem, ...prev])
                onSelect?.(newItem)
              }
            } catch {}
          }}>
          <span className={iconCell}><FiEdit className="w-5 h-5" /></span>
          <span className={`${labelCell} ${collapsed ? "opacity-0" : ""}`}>Nuevo chat</span>
        </button>

        <button className={`${rowBase}`}>
          <span className={iconCell}><FiSearch className="w-5 h-5" /></span>
          <span className={`${labelCell} ${collapsed ? "opacity-0" : ""}`}>Buscar chats</span>
        </button>

        <button className={`${rowBase}`} onClick={() => navigate("/timetable")}>
          <span className={iconCell}><FiMapPin className="w-5 h-5" /></span>
          <span className={`${labelCell} ${collapsed ? "opacity-0" : ""}`}>Ubicate</span>
        </button>
      </div>

      {/* Heading and messages (non-scrollable) */}
      <div className="px-3">
        {!collapsed && <h3 className="text-[#33AACD] text-base font-semibold mb-2 pl-[18px]">Chats</h3>}
        {!collapsed && loading && <p className="text-gray-400 text-base pl-[18px]">Cargando...</p>}
        {!collapsed && error && <p className="text-red-400 text-base pl-[18px]">{error}</p>}
      </div>

      {/* Only the list scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3">
        {!collapsed && !loading && !error && (
          <div className="space-y-1">
            {items.length === 0 && (
              <p className="text-gray-500 text-base pl-[18px]">Aun no tienes chats.</p>
            )}
            {items.map((c, i) => (
              <button
                key={i}
                onClick={() => onSelect?.(c)}
                className="w-full text-left pr-2 py-2 pl-[18px] text-gray-300 hover:bg-white/5 rounded-xl text-base overflow-hidden"
                title={c.title}
              >
                <span className="block truncate">{c.title || "Nuevo chat"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button className={`${rowBase}`}>
          <span className={iconCell}><FiSettings className="w-5 h-5" /></span>
          <span className={`${labelCell} ${collapsed ? "opacity-0" : ""}`}>Ajustes</span>
        </button>
        <button className={`${rowBase}`}
          onClick={async () => {
            const rt = getRefreshToken()
            try { if (rt) await authLogout({ refresh_token: rt }) } catch {}
            finally {
              clearTokens()
              navigate("/login", { replace: true })
            }
          }}>
          <span className={iconCell}><FiLogOut className="w-5 h-5" /></span>
          <span className={`${labelCell} ${collapsed ? "opacity-0" : ""}`}>Salir</span>
        </button>
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: avatarBg }}>
            <span className="text-white text-sm font-medium">{initial}</span>
          </div>
          {!collapsed && <span className="text-sm truncate" title={fullName || email}>{fullName || email}</span>}
        </div>
      </div>
    </div>
  )
}
