import { useEffect, useState } from "react"
import { FiEdit3, FiSearch, FiMapPin, FiSettings, FiSidebar, FiLogOut } from "react-icons/fi"
import { getConversations, createConversation, authMe } from "../lib/api"
import { authLogout } from "../lib/api"
import { clearTokens, getRefreshToken, getUserInfo, colorFromString } from "../lib/auth"
import { useNavigate } from "react-router-dom"

export default function Sidebar({ onSelect }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const user = getUserInfo()
  const [fullName, setFullName] = useState("")
  const email = user?.email || "usuario@aura";
  const initial = (email[0] || "U").toUpperCase();
  const avatarBg = colorFromString(email);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = getUserInfo()?.id
        if (!uid) throw new Error("NO_USER")
        const { data } = await getConversations({ user_id: uid })
        const list = (data?.conversations || []).map((c) => ({
          conversation_id: c.id,
          title: c.title || "Nuevo chat",
          updated_at: c.updated_at || "",
        }))
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

  // Escucha cambios de título enviados desde ChatArea para actualizar en caliente
  useEffect(() => {
    const onTitle = (e) => {
      const { id, title } = e.detail || {}
      if (!id || !title) return
      setItems((prev) => {
        const next = prev.map((it) => (it.conversation_id === id ? { ...it, title } : it))
        return next
      })
    }
    window.addEventListener("aura:conv-title", onTitle)
    return () => window.removeEventListener("aura:conv-title", onTitle)
  }, [])

  // Cargar perfil del usuario para mostrar nombre si existe
  useEffect(() => {
    const loadMe = async () => {
      try {
        const { data } = await authMe()
        const name = data?.profile?.full_name || ""
        if (name) setFullName(name)
      } catch {
        // si falla, mantenemos email
      }
    }
    if (user) loadMe()
  }, [user])

  return (
    <div className="w-80 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <img src="/Cabeza AURA.png" alt="Aura" className="w-9 h-8" />
          <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors">
            <FiSidebar className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <button
          className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors"
          onClick={async () => {
            try {
              const uid = getUserInfo()?.id
              if (!uid) return
              const { data } = await createConversation({ user_id: uid, title: "Nuevo chat" })
              const cid = data?.id
              if (!cid) return
              const newItem = { conversation_id: cid, title: "Nuevo chat", updated_at: new Date().toISOString() }
              setItems((prev) => [newItem, ...prev])
              onSelect?.(newItem)
            } catch (e) {
              // ignore
            }
          }}
        >
          <FiEdit3 className="w-5 h-5" /><span>Nuevo chat</span>
        </button>
        <button className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <FiSearch className="w-5 h-5" /><span>Buscar chats</span>
        </button>
        <button className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <FiMapPin className="w-5 h-5" /><span>Ubícate</span>
        </button>
      </div>

      <div className="flex-1 px-4">
        <h3 className="text-blue-400 text-sm font-medium mb-4">Chats</h3>
        {loading && <p className="text-gray-400 text-sm">Cargando…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!loading && !error && (
          <div className="space-y-2">
            {items.length === 0 && <p className="text-gray-500 text-sm">Aún no tienes chats.</p>}
            {items.map((c, i) => {
              const preview = (c.title || "").length > 28 ? c.title.slice(0, 28) + "…" : c.title || "Nuevo chat"
              return (
                <button
                  key={i}
                  onClick={() => onSelect?.(c)}
                  className="w-full text-left p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                  title={c.title}
                >
                  {preview}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 space-y-3">
        <button className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <FiSettings className="w-5 h-5" /><span>Ajustes</span>
        </button>
        <button
          onClick={async () => {
            const rt = getRefreshToken()
            try {
              if (rt) await authLogout({ refresh_token: rt })
            } catch {
              // ignora errores; de todas formas limpiaremos el estado local
            } finally {
              clearTokens()
              navigate("/login", { replace: true })
            }
          }}
          className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiLogOut className="w-5 h-5" /><span>Salir</span>
        </button>
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: avatarBg }}>
            <span className="text-white text-sm font-medium">{initial}</span>
          </div>
          <span className="text-sm truncate" title={fullName || email}>{fullName || email}</span>
        </div>
      </div>
    </div>
  )
}
