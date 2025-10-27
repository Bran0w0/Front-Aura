import { useState } from "react"
import Sidebar from "../components/Sidebar"
import ChatArea from "../components/ChatArea"

export default function Home() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="flex min-h-[100dvh] bg-[#040B17] overflow-x-hidden">
      <Sidebar onSelect={(item) => setSelected(item)} />
      <ChatArea selected={selected} />
    </div>
  )
}
