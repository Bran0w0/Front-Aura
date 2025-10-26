import React, { useState } from "react"

export default function AuraHead({ className = "w-8 h-8", title = "Aura" }) {
  const [idx, setIdx] = useState(0)
  const sources = [
    "/aura-head.svg",     // prefer head mark if provided (square)
    "/aura-logo.svg",     // fallback to full logo svg
  ]

  const src = sources[idx]
  if (!src) {
    return (
      <span className={`inline-flex items-center justify-center ${className} bg-white/10 text-[#33AACD] font-semibold`}>a</span>
    )
  }

  return (
    <img
      src={src}
      alt={title}
      className={className}
      onError={() => setIdx((i) => i + 1)}
      decoding="async"
      loading="lazy"
    />
  )
}

