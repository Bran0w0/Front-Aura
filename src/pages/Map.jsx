import { useMemo, useState, useRef } from "react"
import { Link } from "react-router-dom"
import campusLegend from "../lib/campus-legend.json"
import { FiTarget, FiNavigation, FiRefreshCw, FiEye, FiEyeOff } from "react-icons/fi"
import { getGridMeta, nearestWalkable, findPath } from "../lib/pathfinding"

const gridMeta = getGridMeta()
const AURA_HEAD_SRC = "/Cabeza%20AURA.png"

const MODE_LABEL = {
  origin: "origen",
  destination: "destino",
}

export default function MapPage() {
  const containerRef = useRef(null)
  const [selectionMode, setSelectionMode] = useState("origin")
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [path, setPath] = useState(null)
  const [error, setError] = useState("")
  const [metrics, setMetrics] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [showNumbers, setShowNumbers] = useState(true)

  const handleMapClick = (event) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relX = (event.clientX - rect.left) / rect.width
    const relY = (event.clientY - rect.top) / rect.height
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return

    const col = Math.min(Math.max(Math.round(relX * (gridMeta.cols - 1)), 0), gridMeta.cols - 1)
    const row = Math.min(Math.max(Math.round(relY * (gridMeta.rows - 1)), 0), gridMeta.rows - 1)
    const point = { row, col }

    if (selectionMode === "origin") {
      setOrigin(point)
    } else {
      setDestination(point)
    }
    setPath(null)
    setMetrics(null)
    setError("")
  }

  const handleCompute = () => {
    if (!origin || !destination) {
      setError("Selecciona un punto de origen y uno de destino haciendo click sobre el mapa.")
      return
    }

    const start = nearestWalkable(origin.row, origin.col)
    const goal = nearestWalkable(destination.row, destination.col)
    if (!start || !goal) {
      setError("No encontré una celda libre cerca de los puntos seleccionados. Intenta moverlos ligeramente.")
      return
    }

    setIsComputing(true)
    setError("")
    setPath(null)
    setMetrics(null)

    requestAnimationFrame(() => {
      const computed = findPath(start, goal)
      setIsComputing(false)
      if (!computed) {
        setError("No existe una ruta libre entre los puntos elegidos.")
        return
      }
      setPath(computed)
      setMetrics({
        steps: computed.length,
        start,
        goal,
      })
    })
  }

  const handleReset = () => {
    setOrigin(null)
    setDestination(null)
    setPath(null)
    setMetrics(null)
    setError("")
  }

  const routePathId = useMemo(() => `map-route-${Math.random().toString(36).slice(2, 9)}`, [])

  const routePathD = useMemo(() => {
    if (!path?.length) return ""
    return path.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.col} ${p.row}`).join(" ")
  }, [path])

  const routeDuration = useMemo(() => {
    if (!path?.length) return 0
    return Math.min(Math.max(path.length * 0.05, 1.35), 6)
  }, [path])

  const renderMarker = (point, color) => {
    if (!point) return null
    return <circle cx={point.col} cy={point.row} r={2.6} fill={color} stroke="#040B17" strokeWidth={0.8} />
  }

  const renderAuraDestination = (point) => {
    if (!point) return null
    const size = 7
    const half = size / 2
    return (
      <>
        <circle cx={point.col} cy={point.row} r={3.8} className="map-destination-glow" />
        {!path?.length && (
          <image
            href={AURA_HEAD_SRC}
            x={point.col - half}
            y={point.row - half}
            width={size}
            height={size}
            className="map-destination-icon map-destination-icon--idle"
            preserveAspectRatio="xMidYMid meet"
          />
        )}
      </>
    )
  }

  const renderAuraTraveler = () => {
    if (!routePathD) return null
    const size = 7
    return (
      <g className="map-travel" key={`${routePathD}-${routeDuration.toFixed(2)}`}>
        <image
          href={AURA_HEAD_SRC}
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          className="map-destination-icon map-destination-icon--travel"
          preserveAspectRatio="xMidYMid meet"
        />
        <animateMotion
          begin="0s"
          dur={`${routeDuration || 2}s`}
          fill="freeze"
          key={`${routePathD}-${routeDuration.toFixed(2)}`}
        >
          <mpath xlinkHref={`#${routePathId}`} />
        </animateMotion>
      </g>
    )
  }

  const infoRow = (label, point) => (
    <div className="flex items-center justify-between text-sm text-gray-300">
      <span>{label}</span>
      {point ? (
        <span className="font-mono text-gray-100">
          r{point.row.toString().padStart(3, "0")} · c{point.col.toString().padStart(3, "0")}
        </span>
      ) : (
        <span className="text-gray-500">—</span>
      )}
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-[#040B17] text-white p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.1em] text-[#33AACD]">Ubícate</p>
        <h1 className="text-3xl md:text-4xl font-semibold">Mapa interactivo UABCS</h1>
        <p className="text-gray-300 max-w-3xl">
          Haz click en el mapa para elegir un punto de origen y otro de destino. Con la guía numérica podrás ubicar
          edificios específicos. Aura trazará la ruta más corta usando el plano discretizado en cuadrícula.
        </p>
        <div>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#33AACD] border border-[#33AACD]/40 px-4 py-2 rounded-full hover:bg-[#0a1a28]"
          >
            ← Volver a Home
          </Link>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div
            ref={containerRef}
            onClick={handleMapClick}
            className="relative border border-white/10 rounded-3xl overflow-hidden bg-[#020710] cursor-crosshair shadow-2xl"
            style={{ aspectRatio: `${gridMeta.cols} / ${gridMeta.rows}` }}
          >
            <picture className="absolute inset-0 block pointer-events-none select-none">
              <source srcSet="/Mapa_Final.png" type="image/png" />
              <source srcSet="/Mapa.png" type="image/png" />
              <img
                src="/Mapa_Uabcs.jpg"
                alt="Mapa UABCS"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                draggable={false}
              />
            </picture>
            {showNumbers && (
              <picture className="absolute inset-0 block pointer-events-none select-none">
                <source srcSet="/Numeros_Mapa_Final.png" type="image/png" />
                <source srcSet="/Numeros_Mapa.png" type="image/png" />
                <img
                  src="/Numeros_Mapa_Uabcs.png"
                  alt="Números de referencia"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none opacity-80"
                  draggable={false}
                />
              </picture>
            )}
            <svg
              viewBox={`0 0 ${gridMeta.cols} ${gridMeta.rows}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {routePathD ? (
                <>
                  <path
                    id={routePathId}
                    d={routePathD}
                    fill="none"
                    className="map-route"
                    pathLength="1"
                    style={{ "--route-duration": `${routeDuration}s` }}
                  />
                  {renderAuraTraveler()}
                </>
              ) : null}
              {renderMarker(origin, "#2DD4BF")}
              {renderAuraDestination(destination)}
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF]" />
              <span>Origen</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-white/10">
                <img
                  src={AURA_HEAD_SRC}
                  alt="Aura destino"
                  className="w-4 h-4 object-contain"
                  draggable={false}
                />
              </span>
              <span>Destino</span>
            </div>
            <button
              type="button"
              onClick={() => setShowNumbers((v) => !v)}
              className="ml-auto inline-flex items-center gap-2 text-xs uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              {showNumbers ? <FiEyeOff /> : <FiEye />}
              {showNumbers ? "Ocultar guía" : "Mostrar guía"}
            </button>
          </div>
        </div>

        <aside className="w-full xl:w-96 bg-white/5 border border-white/10 rounded-3xl p-5 space-y-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectionMode("origin")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2 font-semibold transition-colors ${
                selectionMode === "origin" ? "bg-[#2DD4BF] text-black" : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <FiTarget />
              Origen
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode("destination")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2 font-semibold transition-colors ${
                selectionMode === "destination" ? "bg-[#FDE047] text-black" : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <FiNavigation />
              Destino
            </button>
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0B162C] p-4">
            {infoRow("Punto origen", origin)}
            {infoRow("Punto destino", destination)}
            <div className="h-px bg-white/10 my-2" />
            {metrics ? (
              <div className="text-sm text-gray-100">
                <p>
                  Pasos totales: <span className="font-semibold text-white">{metrics.steps}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Calcula una ruta para ver los pasos estimados.</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleCompute}
              disabled={isComputing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#33AACD] hover:bg-[#2891AF] disabled:opacity-60 disabled:cursor-not-allowed py-3 font-semibold transition-all"
            >
              {isComputing ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full" />
                  Calculando…
                </>
              ) : (
                <>
                  <FiNavigation />
                  Trazar ruta
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 py-3 font-semibold transition-colors"
            >
              <FiRefreshCw />
              Reiniciar selección
            </button>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <p className="text-xs text-gray-500">
            Consejo: deja activada la guía de números para ubicarte y selecciona los puntos directamente sobre el área
            del edificio correspondiente. El algoritmo usa A* sobre una grilla de {gridMeta.cols}×{gridMeta.rows} celdas.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Guía de números</p>
              <span className="text-[11px] text-gray-500">Colores = familia de edificios</span>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 legend-scroll">
              {campusLegend.map((group) => (
                <div key={group.title} className="bg-white/5 rounded-2xl border border-white/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-[0.3em] font-semibold text-white/70">{group.title}</p>
                    <span
                      className="inline-flex w-3 h-3 rounded-full border border-white/40"
                      style={{ backgroundColor: group.color }}
                      aria-hidden
                    />
                  </div>
                  <div className="divide-y divide-white/5 text-xs">
                    {group.items.map((item) => (
                      <div key={`${group.title}-${item.code}`} className="flex items-start gap-3 py-1.5">
                        <span className="font-semibold text-white bg-white/10 rounded-lg px-2 py-1 min-w-[2.75rem] text-center">
                          {item.code}
                        </span>
                        <span className="text-gray-200 leading-snug">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
