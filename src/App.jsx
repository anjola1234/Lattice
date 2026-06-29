import './App.css'
import { useState } from 'react'
import { useLightningGraph } from './useLightningGraph'
import GraphView from './GraphView'

// ── Role colours (match Cytoscape node colours exactly) ──────────────────────
const ROLE_COLOR = {
  'Major Hub':  '#ffffff',
  'Connector':  '#fef08a',
  'Relay Node': '#f59e0b',
  'Leaf':       '#44200a',
}
const ROLE_BG = {
  'Major Hub':  'rgba(255,255,255,0.10)',
  'Connector':  'rgba(254,240,138,0.12)',
  'Relay Node': 'rgba(245,158,11,0.12)',
  'Leaf':       'rgba(68,32,10,0.45)',
}

// ── SVG logo mark ─────────────────────────────────────────────────────────────
function LatticeMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hexagon */}
      <polygon
        points="14,2 24.1,8 24.1,20 14,26 3.9,20 3.9,8"
        stroke="#f59e0b"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Inner node */}
      <circle cx="14" cy="14" r="2.5" fill="#f59e0b" />
      {/* Spokes to vertices */}
      <line x1="14" y1="14" x2="14" y2="2"   stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="14" y1="14" x2="24.1" y2="8"  stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="14" y1="14" x2="24.1" y2="20" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="14" y1="14" x2="14" y2="26"  stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="14" y1="14" x2="3.9" y2="20"  stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="14" y1="14" x2="3.9" y2="8"   stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  )
}

// ── Loading splash ─────────────────────────────────────────────────────────────
function LoadingSplash() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: '#030712',
        backgroundImage: `
          linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6 text-center px-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <LatticeMark size={48} />
          <div>
            <h1 className="text-white text-4xl font-bold tracking-tight">Lattice</h1>
            <p className="text-amber-400 text-sm font-medium mt-1 tracking-widest uppercase">
              The Lightning Network, visualized.
            </p>
          </div>
        </div>

        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          Mapping the topology of Bitcoin's Layer 2 payment network — nodes, channels, and routing hubs.
        </p>

        {/* Pulsing dot ring */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{
                top:  `${50 - 42 * Math.cos((i / 6) * 2 * Math.PI)}%`,
                left: `${50 + 42 * Math.sin((i / 6) * 2 * Math.PI)}%`,
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.3,
              }}
            />
          ))}
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" style={{ opacity: 0.8 }} />
        </div>

        <p className="text-slate-600 text-xs tracking-wide">Loading graph data…</p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

// ── Welcome overlay ────────────────────────────────────────────────────────────
function WelcomeOverlay({ graphData, onDismiss }) {
  const totalCapacityBTC = graphData
    ? (graphData.nodes.reduce((sum, n) => sum + n.capacity, 0) / 1e8).toFixed(1)
    : '0'

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(3,7,18,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.98)' }}
      >
        {/* Amber top accent */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />

        <div className="p-8 flex flex-col items-center text-center gap-5">
          {/* Wordmark */}
          <div className="flex flex-col items-center gap-2">
            <LatticeMark size={36} />
            <h2 className="text-white text-2xl font-bold tracking-tight">Lattice</h2>
            <p className="text-amber-400 text-xs font-medium tracking-widest uppercase">
              The Lightning Network, visualized.
            </p>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Explore the topology of Bitcoin's Lightning Network. Click any node to inspect its channels,
            capacity, and routing role. Search by node name to highlight it and its peers.
          </p>

          {/* Stats row */}
          <div className="flex gap-3 w-full">
            {[
              { label: 'Nodes',    value: graphData?.nodes.length.toLocaleString() ?? '—' },
              { label: 'Channels', value: graphData?.edges.length.toLocaleString() ?? '—' },
              { label: 'Total BTC',value: `${totalCapacityBTC}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 rounded-xl border border-gray-800 bg-gray-950 py-3 px-2">
                <p className="text-white font-bold text-lg leading-none">{value}</p>
                <p className="text-slate-500 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-gray-950 transition-all duration-150 hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #fef08a)',
              boxShadow: '0 0 24px rgba(245,158,11,0.35)',
            }}
          >
            Explore the Network →
          </button>
        </div>

        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)' }} />
      </div>
    </div>
  )
}

// ── Node info panel ────────────────────────────────────────────────────────────
function NodeInfoPanel({ node, onClose }) {
  const btc       = (node.capacity / 1e8).toFixed(4)
  const barWidth  = `${Math.min(node.centrality * 500, 100)}%`
  const roleColor = ROLE_COLOR[node.role] ?? '#f59e0b'
  const roleBg    = ROLE_BG[node.role]    ?? 'rgba(245,158,11,0.12)'

  return (
    <div
      className="absolute top-4 right-4 z-30 w-72 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(15,23,42,0.97)',
        border: '1px solid #1e293b',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 0 0 1px rgba(245,158,11,0.08), 0 24px 48px rgba(0,0,0,0.6)',
      }}
    >
      {/* Amber top rule */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b 40%, transparent)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">Node Details</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-gray-800 transition-colors text-base leading-none"
        >
          ×
        </button>
      </div>

      <div className="px-4 pt-4 pb-2">
        {/* Alias */}
        <p className="text-white font-bold text-base leading-snug break-words">{node.alias}</p>

        {/* Role badge */}
        <span
          className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: roleBg, color: roleColor, border: `1px solid ${roleColor}22` }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: roleColor }} />
          {node.role}
        </span>
      </div>

      {/* Centrality */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">Network Centrality</span>
          <span className="text-white font-medium tabular-nums">{(node.centrality * 100).toFixed(2)}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: barWidth,
              background: 'linear-gradient(90deg, #b45309, #f59e0b, #fef08a)',
              transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-gray-950 border border-gray-800/60 p-3">
          <p className="text-slate-500 text-xs mb-1">Channels</p>
          <p className="text-white font-bold text-xl tabular-nums">{node.channels}</p>
        </div>
        <div className="rounded-xl bg-gray-950 border border-gray-800/60 p-3">
          <p className="text-slate-500 text-xs mb-1">Capacity</p>
          <p className="text-white font-bold text-xl tabular-nums">{btc}</p>
          <p className="text-slate-600 text-xs mt-0.5">BTC</p>
        </div>
        <div className="col-span-2 rounded-xl bg-gray-950 border border-gray-800/60 p-3">
          <p className="text-slate-500 text-xs mb-1">Satoshis</p>
          <p className="text-slate-300 font-semibold text-sm tabular-nums">
            {node.capacity.toLocaleString()} sats
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main app ──────────────────────────────────────────────────────────────────
function App() {
  const { graphData, loading, error } = useLightningGraph()
  const [selectedNode,  setSelectedNode]  = useState(null)
  const [searchTerm,    setSearchTerm]    = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showAllNodes,  setShowAllNodes]  = useState(false)
  const [showWelcome,   setShowWelcome]   = useState(true)   // UI-only toggle

  // ── Filter logic (unchanged) ──────────────────────────────────────────────
  function getFilteredData() {
    if (!graphData) return null
    if (showAllNodes) return graphData
    const visibleNodes = graphData.nodes.filter(n => n.channels >= 4)
    const visibleKeys  = new Set(visibleNodes.map(n => n.key))
    const visibleEdges = graphData.edges.filter(e =>
      visibleKeys.has(e.source) && visibleKeys.has(e.target)
    )
    return { nodes: visibleNodes, edges: visibleEdges }
  }

  const filteredData = getFilteredData()

  function handleSearch(term) {
    setSearchTerm(term)
    if (!term.trim() || !graphData) { setSearchResults([]); return }
    const lower   = term.toLowerCase()
    const matches = graphData.nodes.filter(n => n.alias.toLowerCase().includes(lower))
    setSearchResults(matches.slice(0, 6))
  }

  function handleSelectNode(node) {
    setSelectedNode(node)
    setSearchTerm(node.alias)
    setSearchResults([])
  }

  function handleClear() {
    setSelectedNode(null)
    setSearchTerm('')
    setSearchResults([])
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) return <LoadingSplash />

  if (error) return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#030712' }}
    >
      <div className="text-center space-y-2">
        <p className="text-red-400 font-bold text-lg">Failed to load graph data</p>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    </div>
  )

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#030712' }}>

      {/* ── Welcome overlay ── */}
      {showWelcome && (
        <WelcomeOverlay graphData={graphData} onDismiss={() => setShowWelcome(false)} />
      )}

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header
        className="shrink-0 flex items-center gap-4 px-5 border-b border-gray-800/80 overflow-visible"
        style={{
          height: '60px',
          background: 'rgba(3,7,18,0.98)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 1px 0 0 rgba(245,158,11,0.18)',
          zIndex: 20,
        }}
      >
        {/* ── Logo ── */}
        <div className="shrink-0 flex items-center gap-2.5">
          <LatticeMark size={26} />
          <div className="leading-none">
            <span className="text-white font-bold text-base tracking-tight">Lattice</span>
            <p className="text-amber-500/60 text-[10px] mt-0.5 tracking-wide">
              The Lightning Network, visualized.
            </p>
          </div>
        </div>

        <div className="w-px h-7 bg-gray-800 shrink-0 mx-1" />

        {/* ── Search ── */}
        <div className="relative w-60 shrink-0">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            width="13" height="13" viewBox="0 0 20 20" fill="none"
          >
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M14 14l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full bg-gray-900/80 text-white text-sm rounded-xl pl-8 pr-8 py-1.5 border border-gray-800 focus:outline-none focus:border-amber-500/60 placeholder-slate-600 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg leading-none transition-colors"
            >×</button>
          )}
          {/* Search dropdown */}
          {searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-gray-800 overflow-hidden shadow-2xl"
              style={{ background: 'rgba(15,23,42,0.99)', backdropFilter: 'blur(8px)', zIndex: 9999 }}
            >
              {searchResults.map(node => (
                <button
                  key={node.key}
                  onClick={() => handleSelectNode(node)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800/70 border-b border-gray-800/60 last:border-0 transition-colors flex items-center justify-between gap-2"
                >
                  <span className="text-white font-medium truncate">{node.alias}</span>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-md shrink-0"
                    style={{ color: ROLE_COLOR[node.role], background: ROLE_BG[node.role] }}
                  >
                    {node.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Live stats ── */}
        <div className="flex items-center gap-4 text-xs ml-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>
              <span className="text-white font-semibold tabular-nums">
                {filteredData ? filteredData.nodes.length.toLocaleString() : 0}
              </span>
              {!showAllNodes && graphData && (
                <span className="text-slate-600">/{graphData.nodes.length}</span>
              )}
              <span className="text-slate-500 ml-1">nodes</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            <span>
              <span className="text-white font-semibold tabular-nums">
                {filteredData ? filteredData.edges.length.toLocaleString() : 0}
              </span>
              <span className="text-slate-500 ml-1">channels</span>
            </span>
          </div>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Legend ── */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 shrink-0">
          {Object.entries(ROLE_COLOR).map(([role, color]) => (
            <span key={role} className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: color,
                  boxShadow: role === 'Leaf' ? 'none' : `0 0 5px ${color}66`,
                }}
              />
              {role}
            </span>
          ))}
        </div>

        <div className="w-px h-7 bg-gray-800 shrink-0 mx-1" />

        {/* ── All nodes toggle ── */}
        <button
          onClick={() => { setShowAllNodes(v => !v); setSelectedNode(null) }}
          className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all duration-150 font-medium active:scale-95"
          style={showAllNodes
            ? { background: '#f59e0b', color: '#030712', border: '1px solid #f59e0b', boxShadow: '0 0 12px rgba(245,158,11,0.3)' }
            : { background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b' }
          }
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="4" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="6.2" y1="7.1" x2="10.2" y2="4.9" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="6.2" y1="8.9" x2="10.2" y2="11.1" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          All nodes
        </button>
      </header>

      {/* ══ GRAPH CANVAS ════════════════════════════════════════════════════ */}
      <main className="flex-1 relative" style={{ minHeight: 0 }}>

        {/* Node info panel */}
        {selectedNode && (
          <NodeInfoPanel node={selectedNode} onClose={handleClear} />
        )}

        <GraphView
          graphData={filteredData}
          selectedNode={selectedNode}
          onNodeClick={setSelectedNode}
        />
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer
        className="shrink-0 flex items-center justify-between px-5 border-t border-gray-800/60"
        style={{ height: '32px', background: 'rgba(3,7,18,0.98)' }}
      >
        <span className="text-slate-600 text-xs">
          <span className="text-slate-500 font-medium">Lattice</span>
          {' · '}The Lightning Network, visualized.
        </span>
        <span className="text-slate-700 text-xs hidden sm:block">
          Exploring {graphData?.nodes.length.toLocaleString()} nodes and {graphData?.edges.length.toLocaleString()} channels on the Bitcoin Lightning Network
        </span>
      </footer>

    </div>
  )
}

export default App