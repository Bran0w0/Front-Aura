import Sidebar from "../components/Sidebar"
import ChatArea from "../components/ChatArea"

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <ChatArea />
    </div>
  )
}
