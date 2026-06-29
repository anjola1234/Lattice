import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── Logo Mark ─────────────────────────────────────────── */
function LatticeMark({ size = 28 }) {
  const cx = size / 2
  const r  = size * 0.38
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI * 2) / 6 - Math.PI / 2
    return { x: cx + r * Math.cos(a), y: cx + r * Math.sin(a) }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      {spokes.map((pt, i) => (
        <line key={i} x1={cx} y1={cx} x2={pt.x} y2={pt.y}
          stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      <circle cx={cx} cy={cx} r={r} stroke="#F59E0B" strokeWidth="1.5" fill="none" opacity="0.22" />
      <circle cx={cx} cy={cx} r="2.5" fill="#F59E0B" />
    </svg>
  )
}

/* ─── Animated Network Canvas ───────────────────────────── */
function NetworkCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
    }
    setSize()
    window.addEventListener('resize', setSize)

    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight

    // 8 hub nodes with organic movement
    const hubs = Array.from({ length: 8 }, (_, i) => ({
      x: W() * 0.12 + Math.random() * W() * 0.76,
      y: H() * 0.12 + Math.random() * H() * 0.76,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      phase: (i / 8) * Math.PI * 2,
    }))

    // 52 leaf nodes, each assigned to a hub
    const leaves = Array.from({ length: 52 }, (_, i) => ({
      x: W() * 0.05 + Math.random() * W() * 0.9,
      y: H() * 0.05 + Math.random() * H() * 0.9,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.32 + 0.12,
      hub: i % 8,
    }))

    const draw = (ts) => {
      ctx.clearRect(0, 0, W(), H())

      // Leaf → hub spokes
      leaves.forEach(leaf => {
        const hub = hubs[leaf.hub]
        const dx = leaf.x - hub.x
        const dy = leaf.y - hub.y
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d > 200) return
        const a = (1 - d / 200) * 0.17
        ctx.beginPath()
        ctx.strokeStyle = `rgba(245,158,11,${a})`
        ctx.lineWidth = 0.6
        ctx.moveTo(leaf.x, leaf.y)
        ctx.lineTo(hub.x, hub.y)
        ctx.stroke()
      })

      // Hub ↔ hub connections
      hubs.forEach((a, i) => {
        hubs.forEach((b, j) => {
          if (j <= i) return
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d > 320) return
          const alpha = (1 - d / 320) * 0.11
          ctx.beginPath()
          ctx.strokeStyle = `rgba(245,158,11,${alpha})`
          ctx.lineWidth = 0.9
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        })
      })

      // Draw leaf nodes
      leaves.forEach(node => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245,158,11,${node.alpha})`
        ctx.fill()

        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > W()) node.vx *= -1
        if (node.y < 0 || node.y > H()) node.vy *= -1
      })

      // Draw hub nodes with pulse glow
      hubs.forEach(hub => {
        const pulse = 0.72 + Math.sin(ts * 0.0008 + hub.phase) * 0.28
        const glow  = 18 * pulse

        const g = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, glow)
        g.addColorStop(0, `rgba(245,158,11,${0.28 * pulse})`)
        g.addColorStop(1, 'rgba(245,158,11,0)')
        ctx.beginPath()
        ctx.arc(hub.x, hub.y, glow, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()

        ctx.beginPath()
        ctx.arc(hub.x, hub.y, 3 * pulse, 0, Math.PI * 2)
        ctx.fillStyle = '#F59E0B'
        ctx.fill()

        hub.x += hub.vx
        hub.y += hub.vy
        if (hub.x < 0 || hub.x > W()) hub.vx *= -1
        if (hub.y < 0 || hub.y > H()) hub.vy *= -1
      })

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', setSize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  )
}

/* ─── Animated Counter ──────────────────────────────────── */
function Counter({ end, suffix = '', label }) {
  const [val, setVal] = useState(0)
  const ref     = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return
      started.current = true
      obs.disconnect()
      const t0  = Date.now()
      const dur = 1300
      const tick = () => {
        const p = Math.min((Date.now() - t0) / dur, 1)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * end))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })

    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end])

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800,
        color: 'var(--t1)', letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>
        {val.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontWeight: 600, marginTop: 7,
      }}>
        {label}
      </div>
    </div>
  )
}

/* ─── Feature Card ──────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay = 0 }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className={`a-fade d${Math.ceil(delay / 80)}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ height: '100%' }}
    >
      <div style={{
        height: '100%',
        background:    hov ? 'var(--s2)' : 'var(--s1)',
        border:        `1px solid ${hov ? 'rgba(245,158,11,0.25)' : 'var(--b1)'}`,
        borderRadius:  'var(--rl)',
        padding:       'clamp(18px, 3vw, 26px)',
        transition:    'all 0.22s',
        transform:     hov ? 'translateY(-2px)' : 'none',
        boxShadow:     hov ? '0 16px 40px rgba(0,0,0,0.35)' : 'none',
      }}>
        <div style={{
          width: 38, height: 38,
          background: 'var(--gold-dim)',
          border: '1px solid rgba(245,158,11,0.14)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.68 }}>
          {desc}
        </p>
      </div>
    </div>
  )
}

/* ─── Icon Shortcuts ────────────────────────────────────── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string'
      ? <path d={d} />
      : d.map((p, i) => <path key={i} d={p} />)}
  </svg>
)

/* ─── Landing Page ──────────────────────────────────────── */
export default function Landing() {
  const nav        = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const featuresRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ══ NAV ══════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px, 5vw, 48px)',
        background: scrolled ? 'rgba(5,9,18,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--b1)' : 'transparent'}`,
        transition: 'all 0.3s',
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <LatticeMark size={24} />
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.025em' }}>
            Lattice
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="btn btn-ghost nav-links"
            style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => scrollTo(featuresRef)}
          >
            Features
          </button>
          <button
            className="btn btn-gold"
            style={{ padding: '9px 18px', fontSize: 13 }}
            onClick={() => nav('/explorer')}
          >
            Launch Explorer
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 'clamp(80px, 12vh, 120px) clamp(16px, 5vw, 48px) 60px',
      }}>
        {/* Canvas network */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <NetworkCanvas />
        </div>

        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(245,158,11,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        {/* Dark overlay for contrast */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,9,18,0.44)', pointerEvents: 'none' }} />

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 180, background: 'linear-gradient(to top, var(--bg), transparent)',
          pointerEvents: 'none',
        }} />

        {/* ── Content ── */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 660, width: '100%' }}>

          {/* Badge */}
          <div className="a-fade" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.24)',
            borderRadius: 9999, padding: '5px 14px', marginBottom: 28,
            fontSize: 11, fontWeight: 700, color: 'var(--gold)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--gold)', boxShadow: '0 0 5px var(--gold)',
              flexShrink: 0, display: 'inline-block',
            }} />
            Bitcoin Lightning Network
          </div>

          {/* Headline */}
          <h1 className="a-fade d1" style={{
            fontSize: 'clamp(36px, 7.5vw, 76px)',
            fontWeight: 800, letterSpacing: '-0.035em',
            lineHeight: 1.05, color: 'var(--t1)',
            margin: '0 0 20px',
          }}>
            Map every node.<br />
            <span style={{ color: 'var(--gold)' }}>Explore the&nbsp;network.</span>
          </h1>

          {/* Subtext */}
          <p className="a-fade d2" style={{
            fontSize: 'clamp(15px, 2.2vw, 18px)', color: 'var(--t2)',
            lineHeight: 1.72, margin: '0 auto 36px',
            maxWidth: 500,
          }}>
            Interactive visualization of the Bitcoin Lightning Network.
            Explore 500+ nodes, 1,300+ channels, and discover the topology
            powering instant Bitcoin payments.
          </p>

          {/* CTAs */}
          <div className="a-fade d3" style={{
            display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <button
              className="btn btn-gold"
              style={{ fontSize: 15, padding: '13px 28px' }}
              onClick={() => nav('/explorer')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Launch Explorer
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 15, padding: '13px 28px' }}
              onClick={() => scrollTo(featuresRef)}
            >
              Learn more
            </button>
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ═════════════════════════════════════════ */}
      <section style={{
        background: 'var(--s1)',
        borderTop: '1px solid var(--b1)',
        borderBottom: '1px solid var(--b1)',
        padding: '44px clamp(16px, 5vw, 48px)',
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 32,
        }}>
          <Counter end={500}  suffix="+" label="Active Nodes" />
          <Counter end={1310} suffix="+" label="Payment Channels" />
          <Counter end={47}   suffix=" BTC" label="Network Capacity" />
          <Counter end={4}    label="Node Tiers" />
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section ref={featuresRef} style={{
        padding: '96px clamp(16px, 5vw, 48px)',
        maxWidth: 1100, margin: '0 auto',
      }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{
            fontSize: 11, color: 'var(--gold)', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px',
          }}>
            Capabilities
          </p>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800,
            letterSpacing: '-0.028em', color: 'var(--t1)', margin: '0 0 14px',
          }}>
            Built for network analysis
          </h2>
          <p style={{
            fontSize: 15, color: 'var(--t2)', maxWidth: 440,
            margin: '0 auto', lineHeight: 1.72,
          }}>
            Everything you need to explore, understand, and analyze the
            Lightning Network's topology.
          </p>
        </div>

        {/* Cards grid — 3 cols desktop, 2 tablet, 1 mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 10,
        }}>
          <FeatureCard
            delay={80}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>}
            title="Force-Directed Graph"
            desc="Physics simulation organizes nodes by connectivity. High-traffic hubs cluster naturally at the center, leaf nodes float at the edges."
          />
          <FeatureCard
            delay={160}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
            title="Instant Node Search"
            desc="Search any node by name with live autocomplete. Press ⌘K anywhere in the explorer to jump to search instantly."
          />
          <FeatureCard
            delay={240}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            title="Centrality Scoring"
            desc="Every node is scored by degree centrality and classified as Major Hub, Connector, Relay Node, or Leaf Node automatically."
          />
          <FeatureCard
            delay={320}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
            title="Channel Inspection"
            desc="Click any node to reveal its channels, BTC capacity, satoshi balance, and its direct connections to neighboring nodes."
          />
          <FeatureCard
            delay={400}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
            title="Hub Filtering"
            desc="Toggle between all nodes and major hubs with 4+ channels. Reveal the backbone routing infrastructure of the network."
          />
          <FeatureCard
            delay={480}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
            title="Capacity Metrics"
            desc="View total channel capacity in BTC and satoshis. Understand which nodes control the most liquidity in the network."
          />
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section style={{
        background: 'var(--s1)',
        borderTop: '1px solid var(--b1)',
        borderBottom: '1px solid var(--b1)',
        padding: '96px clamp(16px, 5vw, 48px)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{
              fontSize: 11, color: 'var(--gold)', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px',
            }}>
              How it works
            </p>
            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800,
              letterSpacing: '-0.028em', color: 'var(--t1)', margin: 0,
            }}>
              Three steps to the network
            </h2>
          </div>

          {/* Steps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}>
            {[
              {
                n: '01',
                title: 'Load the graph',
                body: 'The explorer fetches real Lightning Network data and renders all nodes and channels as a live force-directed graph visualization.',
              },
              {
                n: '02',
                title: 'Explore freely',
                body: 'Pan, zoom, and navigate the graph. Nodes are sized and colored by centrality score. Major hubs rise naturally to the center.',
              },
              {
                n: '03',
                title: 'Inspect any node',
                body: "Click any node to reveal its full profile: alias, role, channel count, BTC capacity, and centrality score in the network.",
              },
            ].map((step, i) => (
              <div key={i} className="step-item">
                <div style={{
                  fontSize: 11, fontWeight: 800, color: 'var(--t3)',
                  letterSpacing: '0.12em', marginBottom: 16,
                }}>
                  {step.n}
                </div>
                <h3 style={{
                  fontSize: 16, fontWeight: 700, color: 'var(--t1)',
                  margin: '0 0 10px', letterSpacing: '-0.01em',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.68 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════ */}
      <section style={{
        padding: '120px clamp(16px, 5vw, 48px)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="a-float" style={{ display: 'inline-flex', marginBottom: 28 }}>
            <LatticeMark size={50} />
          </div>

          <h2 style={{
            fontSize: 'clamp(30px, 5.5vw, 54px)', fontWeight: 800,
            letterSpacing: '-0.032em', color: 'var(--t1)', margin: '0 0 14px', lineHeight: 1.1,
          }}>
            Ready to explore?
          </h2>

          <p style={{
            fontSize: 'clamp(14px, 2vw, 17px)', color: 'var(--t2)',
            margin: '0 auto 32px', maxWidth: 380, lineHeight: 1.68,
          }}>
            Dive into the world's most connected payment network.
            No account required.
          </p>

          <button
            className="btn btn-gold"
            style={{ fontSize: 15, padding: '14px 32px' }}
            onClick={() => nav('/explorer')}
          >
            Launch Explorer
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 18 }}>
            Free to use · No sign-up · Open data
          </p>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer style={{
        borderTop: '1px solid var(--b1)',
        background: 'var(--s1)',
        padding: '24px clamp(16px, 5vw, 48px)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LatticeMark size={18} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Lattice</span>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>
            — Lightning Network Explorer
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>
          Built for the Bitcoin Lightning Network
        </span>
      </footer>

    </div>
  )
}
