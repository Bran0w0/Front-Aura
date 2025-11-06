import { useState } from "react"
import Sidebar from "../components/Sidebar"
import ChatArea from "../components/ChatArea"

export default function Home() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="flex h-[100dvh] bg-[#040B17] overflow-hidden">
      <Sidebar onSelect={(item) => setSelected(item)} />
      <div className="flex-1 min-h-0 relative">
        <ChatArea selected={selected} />
      </div>
    </div>
  )
}
