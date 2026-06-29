import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function NetworkCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const nodes = []
    const NUM = 60
    for (let i = 0; i < NUM; i++) {
      const isHub = i < 6
      const isConnector = i < 18
      nodes.push({
        x: W * 0.2 + Math.random() * W * 0.6,
        y: H * 0.15 + Math.random() * H * 0.7,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: isHub ? 10 + Math.random() * 7 : isConnector ? 5 + Math.random() * 4 : 2 + Math.random() * 3,
        color: isHub ? '#ffffff' : isConnector ? '#a78bfa' : '#f59e0b',
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
        isHub,
      })
    }

    const edges = []
    for (let i = 0; i < NUM; i++) {
      const maxConn = i < 6 ? 8 : i < 18 ? 4 : 2
      const conns = Math.floor(Math.random() * maxConn) + 1
      for (let c = 0; c < conns; c++) {
        const target = Math.floor(Math.random() * Math.min(i < 6 ? 18 : 6, NUM))
        if (target !== i) edges.push([i, target])
      }
    }

    let frame
    function draw() {
      ctx.clearRect(0, 0, W, H)
      edges.forEach(([a, b]) => {
        const na = nodes[a]
        const nb = nodes[b]
        const dist = Math.hypot(na.x - nb.x, na.y - nb.y)
        if (dist > 280) return
        const alpha = Math.max(0, (1 - dist / 280) * 0.25)
        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      })
      nodes.forEach(node => {
        node.pulse += node.pulseSpeed
        const glow = node.isHub ? (0.7 + Math.sin(node.pulse) * 0.3) : 1
        if (node.isHub) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 3.5)
          gradient.addColorStop(0, `rgba(167, 139, 250, ${0.25 * glow})`)
          gradient.addColorStop(1, 'rgba(167, 139, 250, 0)')
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.r * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r * glow, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.globalAlpha = node.isHub ? 0.95 : 0.75
        ctx.fill()
        ctx.globalAlpha = 1
        node.x += node.vx
        node.y += node.vy
        if (node.x < 10 || node.x > W - 10) node.vx *= -1
        if (node.y < 10 || node.y > H - 10) node.vy *= -1
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let start = 0
      const duration = 1800
      const step = (timestamp) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        setCount(Math.floor(progress * target))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#09090b', color: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '60px',
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(124,58,237,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px',
            background: 'linear-gradient(135deg, #7c3aed, #f59e0b)',
            borderRadius: '7px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px',
          }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>Lattice</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          {['Features', 'How It Works', 'About'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              style={{ color: '#a1a1aa', fontSize: '14px', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#ffffff'}
              onMouseLeave={e => e.target.style.color = '#a1a1aa'}
            >{link}</a>
          ))}
          <button onClick={() => navigate('/explorer')} style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#ffffff', border: 'none', borderRadius: '8px',
            padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>Launch Explorer →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', padding: '100px 48px 60px', gap: '48px',
        maxWidth: '1400px', margin: '0 auto',
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '100px', padding: '6px 14px', marginBottom: '32px',
          }}>
            <span style={{ width: '6px', height: '6px', background: '#7c3aed', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 500 }}>Bitcoin Infrastructure Tooling</span>
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-2px', margin: '0 0 24px' }}>
            The Lightning<br />Network,{' '}
            <span style={{ background: 'linear-gradient(90deg, #7c3aed, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              made visible.
            </span>
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '18px', lineHeight: 1.7, maxWidth: '480px', margin: '0 0 40px' }}>
            Lattice maps the topology of the Bitcoin Lightning Network. Explore 500+ nodes,
            1,310 payment channels, and centrality scores — rendered as a live, interactive
            graph you can search, zoom, and navigate.
          </p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '48px' }}>
            <button onClick={() => navigate('/explorer')} style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#09090b', border: 'none', borderRadius: '10px',
              padding: '14px 28px', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
            }}>Launch Explorer →</button>
            <a href="https://github.com" style={{
              color: '#a1a1aa', fontSize: '15px', textDecoration: 'none',
              border: '1px solid #27272a', borderRadius: '10px', padding: '14px 24px',
            }}>View on GitHub</a>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[{ value: '500+', label: 'Nodes' }, { value: '1,310', label: 'Channels' }, { value: '4', label: 'Node Tiers' }].map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700 }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          height: '520px', borderRadius: '20px', overflow: 'hidden',
          border: '1px solid rgba(124,58,237,0.25)',
          background: 'rgba(124,58,237,0.04)',
          boxShadow: '0 0 60px rgba(124,58,237,0.12)',
          position: 'relative',
        }}>
          <NetworkCanvas />
          <div style={{
            position: 'absolute', top: '16px', left: '16px',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '100px', padding: '5px 12px',
          }}>
            <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Live Network Data</span>
          </div>
          <div style={{
            position: 'absolute', bottom: '28px', right: '24px',
            background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '8px', padding: '8px 14px', fontSize: '12px',
          }}>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>ACINQ</span>
            <span style={{ color: '#71717a', margin: '0 6px' }}>·</span>
            <span style={{ color: '#a1a1aa' }}>53 channels</span>
            <span style={{ color: '#71717a', margin: '0 6px' }}>·</span>
            <span style={{ color: '#a78bfa' }}>Major Hub</span>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{
        background: 'linear-gradient(90deg, rgba(124,58,237,0.08), rgba(124,58,237,0.14), rgba(124,58,237,0.08))',
        borderTop: '1px solid rgba(124,58,237,0.15)',
        borderBottom: '1px solid rgba(124,58,237,0.15)',
        padding: '40px 48px',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          textAlign: 'center', gap: '24px',
        }}>
          {[
            { target: 500, suffix: '+', label: 'Network Nodes' },
            { target: 1310, suffix: '+', label: 'Payment Channels' },
            { target: 4, suffix: '', label: 'Node Tiers' },
            { target: 100, suffix: '%', label: 'Open Data' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'monospace', fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                <Counter target={stat.target} suffix={stat.suffix} />
              </div>
              <div style={{ color: '#71717a', fontSize: '13px', marginTop: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
{/* WHAT IS THE LIGHTNING NETWORK */}
      <section id="about" style={{ padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>The Basics</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 20px' }}>Bitcoin payments at the speed of light.</h2>
          <p style={{ color: '#71717a', fontSize: '17px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            The Lightning Network is a second-layer protocol built on Bitcoin. Before you can explore it, here is what you are looking at.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: '⚡', title: 'Payment Channels', body: 'Two parties lock Bitcoin into a shared channel and transact instantly — settling on-chain only when the channel closes.' },
            { icon: '🕸️', title: 'Routing Network', body: 'Payments flow through interconnected nodes, finding paths automatically across thousands of channels in milliseconds.' },
            { icon: '🔭', title: 'Open Graph', body: 'The full network topology is publicly visible — every node, every channel, every connection available for anyone to explore.' },
          ].map(card => (
            <div key={card.title}
              style={{
                background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: '16px', padding: '32px', transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = 'rgba(124,58,237,0.10)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.15)'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)' }}
            >
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>{card.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px', color: '#ffffff' }}>{card.title}</h3>
              <p style={{ color: '#71717a', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px 48px 120px', background: 'rgba(124,58,237,0.03)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Features</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', margin: 0 }}>Everything you need to understand the network.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
            {[
              { title: 'Interactive Graph Visualization', body: 'Lattice renders the full Lightning Network topology as a force-directed graph. Nodes are sized and colored by centrality score — major hubs glow white at the center, leaf nodes sit quietly at the edges. Zoom, pan, and explore at your own pace.', icon: '🗺️', flip: false },
              { title: 'Search Any Node Instantly', body: 'Type any node name and Lattice highlights it immediately — zooming in, revealing direct connections, and showing a full info panel with channel count, capacity, and centrality score. Find any node in a 500-node network in under a second.', icon: '🔍', flip: true },
              { title: 'Centrality and Network Role', body: 'Every node is scored by degree centrality and classified as a Major Hub, Connector, Relay Node, or Leaf Node. Understand who controls the most routing power in the network at a glance.', icon: '📊', flip: false },
            ].map(feature => (
              <div key={feature.title} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center',
                direction: feature.flip ? 'rtl' : 'ltr',
              }}>
                <div style={{ direction: 'ltr' }}>
                  <div style={{ fontSize: '36px', marginBottom: '20px' }}>{feature.icon}</div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 16px' }}>{feature.title}</h3>
                  <p style={{ color: '#71717a', fontSize: '16px', lineHeight: 1.8, margin: '0 0 28px' }}>{feature.body}</p>
                  <button onClick={() => navigate('/explorer')} style={{
                    background: 'transparent', color: '#a78bfa',
                    border: '1px solid rgba(124,58,237,0.4)', borderRadius: '8px',
                    padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>Try it in the Explorer →</button>
                </div>
                <div style={{ direction: 'ltr' }}>
                  <div style={{
                    height: '260px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(9,9,11,0.8))',
                    border: '1px solid rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '64px', boxShadow: '0 0 40px rgba(124,58,237,0.08)',
                  }}>{feature.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section id="how-it-works" style={{ padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Why Lattice</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 20px' }}>
            The Lightning Network is complex.{' '}
            <span style={{ background: 'linear-gradient(90deg, #7c3aed, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Lattice makes it legible.
            </span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {[
            { icon: '⚙️', title: 'For Node Operators', body: 'Understand your position in the network, identify well-connected peers, and make smarter decisions about which channels to open.' },
            { icon: '🔬', title: 'For Researchers', body: 'Analyze real network topology, centrality distribution, and graph structure. Visualize scale-free network properties in an actual deployed system.' },
            { icon: '👩‍💻', title: 'For Developers', body: 'Explore the data layer behind Lightning without touching payments or wallets. Understand graph structure before building routing logic.' },
            { icon: '🧭', title: 'For Curious Minds', body: "See Bitcoin's payment infrastructure as a living network graph. No wallet needed, no Bitcoin required — just curiosity about how the system works." },
          ].map(item => (
            <div key={item.title}
              style={{
                display: 'flex', gap: '20px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '28px', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            >
              <div style={{ fontSize: '28px', flexShrink: 0 }}>{item.icon}</div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 10px' }}>{item.title}</h3>
                <p style={{ color: '#71717a', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '120px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-2px', margin: '0 0 20px' }}>
            Ready to explore the network?
          </h2>
          <p style={{ color: '#71717a', fontSize: '18px', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Launch Lattice and see the Lightning Network like never before. No account needed. No payments. Just data.
          </p>
          <button onClick={() => navigate('/explorer')} style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#09090b', border: 'none', borderRadius: '12px',
            padding: '18px 40px', fontSize: '18px', fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 0 40px rgba(245,158,11,0.25)',
          }}>Launch Explorer →</button>
          <p style={{ color: '#3f3f46', fontSize: '13px', marginTop: '20px' }}>
            Free to use · Open source · No sign-up required
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(124,58,237,0.15)',
        padding: '40px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(124,58,237,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px', height: '26px',
            background: 'linear-gradient(135deg, #7c3aed, #f59e0b)',
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Lattice</span>
          <span style={{ color: '#3f3f46', fontSize: '13px', marginLeft: '8px' }}>The Lightning Network, made visible.</span>
        </div>
        <div style={{ color: '#3f3f46', fontSize: '13px' }}>
          © 2025 Lattice · Open source project · Built on Bitcoin's Lightning Network
        </div>
      </footer>

    </div>
  )
}