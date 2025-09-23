import { useState } from "react"
import Sidebar from "../components/Sidebar"
import ChatArea from "../components/ChatArea"

export default function Home() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar onSelect={(item) => setSelected(item)} />
      <ChatArea selected={selected} />
    </div>
  )
}
