import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLightningGraph } from './useLightningGraph'
import GraphView from './GraphView'

/* ─── Role Config ────────────────────────────────────────── */
// Role names come from useLightningGraph: 'Major Hub', 'Connector', 'Relay Node', 'Leaf Node'
const ROLES = {
  'Major Hub':  { color: '#FFFFFF', bg: 'rgba(255,255,255,0.07)', dot: '#FFFFFF',  glow: 'rgba(255,255,255,0.20)' },
  'Connector':  { color: '#FEF08A', bg: 'rgba(254,240,138,0.09)', dot: '#FEF08A',  glow: 'rgba(254,240,138,0.18)' },
  'Relay Node': { color: '#F59E0B', bg: 'rgba(245,158,11,0.09)',  dot: '#F59E0B',  glow: 'rgba(245,158,11,0.22)'  },
  'Leaf Node':  { color: '#B07040', bg: 'rgba(176,112,64,0.09)',  dot: '#A06838',  glow: 'rgba(176,112,64,0.16)'  },
}
const getRole = (r) => ROLES[r] || ROLES['Leaf Node']

/* ─── Lattice Logo Mark ──────────────────────────────────── */
function LatticeMark({ size = 24 }) {
  const cx = size / 2
  const r  = size * 0.38
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI * 2) / 6 - Math.PI / 2
        return (
          <line key={i} x1={cx} y1={cx}
            x2={cx + r * Math.cos(a)} y2={cx + r * Math.sin(a)}
            stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        )
      })}
      <circle cx={cx} cy={cx} r={r} stroke="#F59E0B" strokeWidth="1.5" fill="none" opacity="0.22" />
      <circle cx={cx} cy={cx} r="2.5" fill="#F59E0B" />
    </svg>
  )
}

/* ─── Loading Screen ─────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 200,
    }}>
      {/* Spinning ring */}
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2px solid rgba(245,158,11,0.12)',
          borderTopColor: 'var(--gold)',
          animation: 'spin-ring 0.9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LatticeMark size={24} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', margin: '0 0 4px' }}>
          Loading network
        </p>
        <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
          Fetching Lightning graph data
        </p>
      </div>
    </div>
  )
}

/* ─── Welcome Overlay ────────────────────────────────────── */
function WelcomeOverlay({ graphData, onDismiss }) {
  const totalBtc = graphData
    ? (graphData.nodes.reduce((s, n) => s + (n.capacity || 0), 0) / 1e8).toFixed(1)
    : '0'

  const stats = [
    { v: graphData?.nodes.length.toLocaleString() ?? '—', l: 'Nodes' },
    { v: graphData?.edges.length.toLocaleString() ?? '—', l: 'Channels' },
    { v: totalBtc,                                         l: 'BTC Capacity' },
  ]

  return (
    <div
      className="a-overlay"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5,9,18,0.88)',
        backdropFilter: 'blur(22px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="a-scale"
        style={{
          background: 'var(--s1)',
          border: '1px solid var(--b2)',
          borderRadius: 20,
          padding: 'clamp(28px, 6vw, 44px) clamp(20px, 5vw, 36px)',
          maxWidth: 400, width: '100%',
          textAlign: 'center',
          boxShadow: '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(245,158,11,0.04)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)',
        }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <LatticeMark size={44} />
        </div>

        <h2 style={{
          fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800,
          color: 'var(--t1)', margin: '0 0 7px', letterSpacing: '-0.025em',
        }}>
          Lattice Explorer
        </h2>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 28px', lineHeight: 1.65 }}>
          Interactive visualization of the Bitcoin Lightning Network topology.
        </p>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderRadius: 11, overflow: 'hidden',
          border: '1px solid var(--b1)',
          marginBottom: 22,
        }}>
          {stats.map((s, i) => (
            <div key={s.l} style={{
              padding: '14px 6px', background: 'var(--s2)', textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--b1)' : 'none',
            }}>
              <div style={{
                fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 800,
                color: 'var(--gold)', letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {s.v}
              </div>
              <div style={{
                fontSize: 9, color: 'var(--t3)', marginTop: 3,
                textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
              }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-gold"
          style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '12px 20px' }}
          onClick={onDismiss}
        >
          Start Exploring
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ─── Search Bar ─────────────────────────────────────────── */
function SearchBar({ nodes, onSelect }) {
  const [q,    setQ]    = useState('')
  const [open, setOpen] = useState(false)
  const [idx,  setIdx]  = useState(-1)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)

  const results = q.trim().length > 0
    ? nodes
        .filter(n => n.alias?.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 6)
    : []

  const commit = useCallback((node) => {
    setQ(''); setOpen(false); setIdx(-1)
    onSelect(node)
  }, [onSelect])

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={wrapRef} style={{
      position: 'relative', flexShrink: 0,
      width: 'clamp(160px, 22vw, 272px)',
    }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--s2)',
        border: `1px solid ${open ? 'rgba(245,158,11,0.45)' : 'var(--b2)'}`,
        borderRadius: 'var(--r)',
        padding: '7px 10px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: open ? '0 0 0 3px rgba(245,158,11,0.07)' : 'none',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setIdx(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)) }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, -1)) }
            if (e.key === 'Enter' && idx >= 0) commit(results[idx])
            if (e.key === 'Escape')    { setOpen(false); inputRef.current?.blur() }
          }}
          placeholder="Search nodes…"
          aria-label="Search Lightning Network nodes"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 12, color: 'var(--t1)', padding: 0, minWidth: 0,
          }}
        />

        <kbd style={{
          fontSize: 9, color: 'var(--t3)', background: 'var(--s3)',
          padding: '2px 5px', borderRadius: 4, fontFamily: 'inherit',
          border: '1px solid var(--b2)', flexShrink: 0, letterSpacing: '0.04em',
        }}>
          ⌘K
        </kbd>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--s1)', border: '1px solid var(--b2)',
          borderRadius: 11, boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
          overflow: 'hidden', zIndex: 50,
        }}>
          {results.map((node, i) => {
            const rc = getRole(node.role)
            return (
              <div
                key={node.key}
                onMouseDown={() => commit(node)}
                onMouseEnter={() => setIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: idx === i ? 'var(--s2)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  borderBottom: i < results.length - 1 ? '1px solid var(--b1)' : 'none',
                }}
              >
                {/* Left: dot + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: rc.dot, flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 12, color: 'var(--t1)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {node.alias}
                  </span>
                </div>

                {/* Right: channels + role badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--t3)' }}>{node.channels}ch</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: rc.color,
                    background: rc.bg, borderRadius: 4, padding: '2px 6px',
                    letterSpacing: '0.03em',
                  }}>
                    {node.role}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Node Info Panel ────────────────────────────────────── */
function NodePanel({ node, onClose }) {
  if (!node) return null

  const rc          = getRole(node.role)
  const btc         = node.capacity ? (node.capacity / 1e8).toFixed(4) : '0.0000'
  const centralPct  = ((node.centrality || 0) * 100).toFixed(2)
  const barWidth    = `${Math.min((node.centrality || 0) * 500, 100)}%`

  return (
    <div
      className="a-slide"
      style={{
        position: 'absolute', top: 12, right: 12,
        width: 'clamp(230px, 26vw, 296px)',
        background: 'rgba(8,13,30,0.95)',
        backdropFilter: 'blur(30px)',
        border: '1px solid var(--b2)',
        borderRadius: 17,
        boxShadow: '0 28px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(245,158,11,0.03)',
        overflow: 'hidden',
        zIndex: 30,
      }}
    >
      {/* Accent line — matches role color */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${rc.dot}55, transparent)`,
      }} />

      {/* Header */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid var(--b1)',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: rc.dot, boxShadow: `0 0 5px ${rc.dot}`,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 9, fontWeight: 800, color: rc.color,
              background: rc.bg, borderRadius: 4, padding: '2px 7px',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {node.role}
            </span>
          </div>

          {/* Alias */}
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: 'var(--t1)',
            margin: 0, letterSpacing: '-0.01em',
            wordBreak: 'break-word', lineHeight: 1.28,
          }}>
            {node.alias || 'Unknown Node'}
          </h2>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close node panel"
          style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'var(--s3)', border: '1px solid var(--b1)',
            color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color    = 'var(--t1)'
            e.currentTarget.style.background = 'var(--b2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color    = 'var(--t2)'
            e.currentTarget.style.background = 'var(--s3)'
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6"  y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Centrality bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{
              fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase',
              letterSpacing: '0.1em', fontWeight: 700,
            }}>
              Network Centrality
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: rc.color }}>
              {centralPct}%
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, width: barWidth,
              background: `linear-gradient(to right, ${rc.dot}88, ${rc.dot})`,
              transition: 'width 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {[
            { label: 'Channels',     value: node.channels ?? '—',      span: false },
            { label: 'Capacity BTC', value: btc,                       span: false },
            { label: 'Satoshis',     value: node.capacity?.toLocaleString() ?? '—', span: true },
          ].map(({ label, value, span }) => (
            <div
              key={label}
              style={{
                background: 'var(--s2)',
                borderRadius: 8,
                padding: '10px 12px',
                border: '1px solid var(--b1)',
                gridColumn: span ? '1 / -1' : undefined,
              }}
            >
              <div style={{
                fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: span ? 12 : 17, fontWeight: 700,
                color: 'var(--t1)', fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.2,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Legend ─────────────────────────────────────────────── */
function Legend({ compact = false }) {
  return (
    <div style={{ display: 'flex', gap: compact ? 10 : 14, alignItems: 'center', flexWrap: 'wrap' }}>
      {Object.entries(ROLES).map(([role, cfg]) => (
        <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: cfg.dot,
            boxShadow: `0 0 4px ${cfg.dot}55`,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: compact ? 10 : 11,
            color: 'var(--t3)', whiteSpace: 'nowrap',
          }}>
            {role}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  const nav = useNavigate()
  const { graphData, loading, error } = useLightningGraph()

  const [selected,    setSelected]    = useState(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showAll,     setShowAll]     = useState(false)

  // Build filtered dataset
  const filtered = (() => {
    if (!graphData) return null
    if (showAll)   return graphData

    const nodes = graphData.nodes.filter(n => (n.channels || 0) >= 4)
    const keySet = new Set(nodes.map(n => n.key))
    const edges  = graphData.edges.filter(e => keySet.has(e.source) && keySet.has(e.target))
    return { nodes, edges }
  })()

  const handleSelect = useCallback((node) => {
    setSelected(node)
    if (showWelcome) setShowWelcome(false)
  }, [showWelcome])

  const handleDeselect = useCallback(() => setSelected(null), [])

  const toggleFilter = useCallback(() => {
    setShowAll(v => !v)
    setSelected(null)
  }, [])

  // ── Loading ──────────────────────────────────────────────
  if (loading) return <LoadingScreen />

  // ── Error ────────────────────────────────────────────────
  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ color: '#EF4444', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>
          Failed to load graph data
        </p>
        <p style={{ color: 'var(--t3)', fontSize: 13, margin: 0 }}>{error}</p>
      </div>
    </div>
  )

  const nodeCount    = (filtered?.nodes.length ?? 0).toLocaleString()
  const channelCount = (filtered?.edges.length  ?? 0).toLocaleString()

  // ── Main Render ──────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden',
    }}>

      {/* ══ HEADER ════════════════════════════════════════════ */}
      <header style={{
        height: 54, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 12px',
        background: 'rgba(8,13,30,0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--b1)',
        zIndex: 20,
      }}>
        {/* Logo — click to go home */}
        <button
          onClick={() => nav('/')}
          title="Back to home"
          aria-label="Lattice home"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 7,
            transition: 'background 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LatticeMark size={20} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Lattice
          </span>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--b2)', flexShrink: 0 }} />

        {/* Search */}
        <SearchBar nodes={filtered?.nodes ?? []} onSelect={handleSelect} />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Filter toggle */}
        <button
          onClick={toggleFilter}
          title={showAll ? 'Show hubs only (≥4 channels)' : 'Show all nodes'}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            background: showAll ? 'rgba(245,158,11,0.1)' : 'var(--s2)',
            border: `1px solid ${showAll ? 'rgba(245,158,11,0.38)' : 'var(--b2)'}`,
            borderRadius: 7,
            fontSize: 11, fontWeight: 700,
            color: showAll ? 'var(--gold)' : 'var(--t2)',
            cursor: 'pointer', transition: 'all 0.15s',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          <span className="hide-xs">{showAll ? 'All nodes' : 'Hubs only'}</span>
        </button>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{
            padding: '4px 9px',
            background: 'var(--s2)', border: '1px solid var(--b1)',
            borderRadius: 6, fontSize: 11, color: 'var(--t2)',
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{nodeCount}</span>
            <span className="hide-xs"> nodes</span>
          </div>
          <div style={{
            padding: '4px 9px',
            background: 'var(--s2)', border: '1px solid var(--b1)',
            borderRadius: 6, fontSize: 11, color: 'var(--t2)',
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{channelCount}</span>
            <span className="hide-xs"> ch</span>
          </div>
        </div>

        {/* Legend — desktop only */}
        <div className="desktop-legend" style={{ marginLeft: 4 }}>
          <Legend />
        </div>
      </header>

      {/* ══ GRAPH CANVAS ══════════════════════════════════════ */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <GraphView
          graphData={filtered}
          selectedNode={selected}
          onNodeClick={handleSelect}
        />

        {/* Node info panel */}
        {selected && (
          <NodePanel node={selected} onClose={handleDeselect} />
        )}

        {/* Mobile legend — bottom center */}
        <div style={{
          position: 'absolute', bottom: 12, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(8,13,30,0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--b1)',
          borderRadius: 9, padding: '7px 14px',
          pointerEvents: 'none',
        }}>
          <Legend compact />
        </div>
      </main>

      {/* ══ WELCOME OVERLAY ═══════════════════════════════════ */}
      {showWelcome && (
        <WelcomeOverlay graphData={graphData} onDismiss={() => setShowWelcome(false)} />
      )}
    </div>
  )
}
