import { useState } from "react"
import Sidebar from "../components/Sidebar"
import ChatArea from "../components/ChatArea"
import ProfilePanel from "../components/ProfilePanel"

export default function Home() {
  const [selected, setSelected] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] bg-[#040B17] overflow-hidden">
      <Sidebar onSelect={(item) => setSelected(item)} onOpenProfile={() => setProfileOpen(true)} />
      <div className={`flex-1 min-h-0 relative`}>
        <ChatArea selected={selected} />
      </div>
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}
