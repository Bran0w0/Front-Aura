import React, { useState } from "react"

export default function LogoAura({ className = "", colorClass = "text-[#33AACD]", title = "Aura" }) {
  const [fallback, setFallback] = useState(false)

  if (fallback) {
    return (
      <span className={`${colorClass} font-semibold tracking-wide`}>aura</span>
    )
  }

  return (
    <img
      src="/aura-logo.svg"
      alt={title}
      className={className}
      onError={() => setFallback(true)}
      decoding="async"
      loading="lazy"
    />
  )
}

