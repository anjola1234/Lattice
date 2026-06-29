import { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'

cytoscape.use(fcose)

/* ─── Centrality → Visual Properties ────────────────────── */
function centralityToColor(c) {
  if (c >= 0.15) return '#FFFFFF'  // Major Hub   — bright white
  if (c >= 0.08) return '#FEF08A'  // Connector   — soft yellow
  if (c >= 0.04) return '#F59E0B'  // Relay Node  — amber
  if (c >= 0.01) return '#C07840'  // small relay — warm brown
  return '#6B4B2A'                 // Leaf Node   — dark brown (still visible)
}

function centralityToSize(c) {
  // Min 5px, max 58px, smooth curve
  return 5 + Math.pow(c, 0.6) * 62
}

function roleTooltipColor(role) {
  const m = {
    'Major Hub':  '#FFFFFF',
    'Connector':  '#FEF08A',
    'Relay Node': '#F59E0B',
    'Leaf Node':  '#B07040',
  }
  return m[role] || '#F59E0B'
}

/* ─── GraphView Component ────────────────────────────────── */
export default function GraphView({ graphData, selectedNode, onNodeClick }) {
  const containerRef = useRef(null)
  const cyRef        = useRef(null)
  const tooltipRef   = useRef(null)

  /* ── Build / rebuild graph when data changes ───────────── */
  useEffect(() => {
    if (!graphData || !containerRef.current) return

    // Map data to Cytoscape elements
    const cytoscapeNodes = graphData.nodes.map(node => ({
      data: {
        id:         node.key,
        label:      node.alias || 'Unknown',
        size:       centralityToSize(node.centrality || 0),
        channels:   node.channels || 0,
        capacity:   node.capacity  || 0,
        alias:      node.alias     || 'Unknown',
        centrality: node.centrality || 0,
        role:       node.role,
        color:      centralityToColor(node.centrality || 0),
      },
    }))

    const cytoscapeEdges = graphData.edges
      .filter(e => e.source !== e.target)
      .map(e => ({
        data: { id: e.id, source: e.source, target: e.target },
      }))

    const cy = cytoscape({
      container: containerRef.current,
      elements: { nodes: cytoscapeNodes, edges: cytoscapeEdges },

      style: [
        /* ── Default node ── */
        {
          selector: 'node',
          style: {
            'background-color':        'data(color)',
            'width':                   'data(size)',
            'height':                  'data(size)',
            'label':                   '',
            'opacity':                 1,
            'border-width':            0,
            'transition-property':     'opacity, border-width',
            'transition-duration':     '200ms',
          },
        },

        /* ── Labels only for significant nodes ── */
        {
          selector: 'node[centrality >= 0.08]',
          style: {
            'label':                    'data(label)',
            'color':                    '#C4D4EE',
            'font-size':                '9px',
            'font-family':              "'Inter', -apple-system, sans-serif",
            'font-weight':              '500',
            'text-valign':              'bottom',
            'text-halign':              'center',
            'text-margin-y':            '4px',
            'text-background-color':    '#080D1E',
            'text-background-opacity':  0.88,
            'text-background-padding':  '2px',
          },
        },

        /* ── Edges: hidden by default, shown on selection ── */
        {
          selector: 'edge',
          style: { 'width': 0, 'opacity': 0 },
        },

        /* ── Selected node ── */
        {
          selector: 'node.selected',
          style: {
            'background-color':         '#FFFFFF',
            'border-width':             2,
            'border-color':             '#F59E0B',
            'border-opacity':           1,
            'label':                    'data(label)',
            'color':                    '#EEF2FF',
            'font-size':                '11px',
            'font-weight':              '700',
            'text-valign':              'bottom',
            'text-halign':              'center',
            'text-margin-y':            '6px',
            'text-background-color':    '#080D1E',
            'text-background-opacity':  0.95,
            'text-background-padding':  '3px',
            'opacity':                  1,
            'z-index':                  10,
          },
        },

        /* ── Neighbor nodes (amber highlight instead of blue) ── */
        {
          selector: 'node.neighbor',
          style: {
            'background-color':         '#F59E0B',
            'label':                    'data(label)',
            'color':                    '#FCD34D',
            'font-size':                '9px',
            'font-weight':              '500',
            'text-valign':              'bottom',
            'text-halign':              'center',
            'text-margin-y':            '4px',
            'text-background-color':    '#080D1E',
            'text-background-opacity':  0.88,
            'text-background-padding':  '2px',
            'opacity':                  1,
            'z-index':                  5,
          },
        },

        /* ── Highlighted edges (amber, subtle) ── */
        {
          selector: 'edge.highlighted',
          style: {
            'line-color':    'rgba(245, 158, 11, 0.65)',
            'opacity':       1,
            'width':         1.4,
            'curve-style':   'bezier',
          },
        },

        /* ── Faded (de-emphasised) ── */
        {
          selector: 'node.faded',
          style: { 'opacity': 0.055 },
        },
        {
          selector: 'edge.faded',
          style: { 'opacity': 0 },
        },
      ],

      layout: {
        name:                    'fcose',
        animate:                 true,
        animationDuration:       1200,
        animationEasing:         'ease-out',
        fit:                     true,
        padding:                 48,
        nodeRepulsion:           () => 9500,
        idealEdgeLength:         () => 130,
        edgeElasticity:          () => 0.3,
        gravity:                 0.25,
        gravityRange:            1.5,
        numIter:                 2500,
        tile:                    true,
        tilingPaddingVertical:   20,
        tilingPaddingHorizontal: 20,
        randomize:               true,
      },

      wheelSensitivity: 0.28,
      minZoom: 0.04,
      maxZoom: 14,
    })

    /* ── Tooltip on hover ── */
    const tooltip = tooltipRef.current
    cy.on('mouseover', 'node', (event) => {
      const node = event.target
      const pos  = event.renderedPosition
      const rect = containerRef.current.getBoundingClientRect()
      const color = roleTooltipColor(node.data('role'))

      tooltip.style.display = 'block'
      tooltip.style.left    = (pos.x + rect.left + 14) + 'px'
      tooltip.style.top     = (pos.y + rect.top  -  8) + 'px'
      tooltip.innerHTML = `
        <span style="font-weight:700;color:${color}">${node.data('alias')}</span>
        <span style="color:#8899B8;margin-left:8px">${node.data('channels')} ch</span>
        <span style="color:#445570;margin:0 5px">·</span>
        <span style="color:#445570;font-size:10px">${node.data('role')}</span>
      `
    })

    cy.on('mouseout', 'node', () => {
      tooltip.style.display = 'none'
    })

    /* ── Node click ── */
    cy.on('tap', 'node', (event) => {
      const node = event.target
      tooltip.style.display = 'none'
      onNodeClick({
        key:        node.id(),
        alias:      node.data('alias'),
        channels:   node.data('channels'),
        capacity:   node.data('capacity'),
        centrality: node.data('centrality'),
        role:       node.data('role'),
      })
    })

    /* ── Background click clears selection ── */
    cy.on('tap', (event) => {
      if (event.target === cy) onNodeClick(null)
    })

    cyRef.current = cy
    return () => cy.destroy()
  }, [graphData])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Highlight selected node + neighbors ─────────────── */
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('selected neighbor faded highlighted')
    if (!selectedNode) return

    const target = cy.getElementById(selectedNode.key)
    if (!target || target.empty()) return

    const neighbors    = target.neighborhood('node')
    const connEdges    = target.connectedEdges()

    cy.nodes().addClass('faded')
    cy.edges().addClass('faded')

    target.removeClass('faded').addClass('selected')
    neighbors.removeClass('faded').addClass('neighbor')
    connEdges.removeClass('faded').addClass('highlighted')

    cy.animate({
      fit: { eles: target.union(neighbors), padding: 64 },
      duration: 480,
      easing: 'ease-in-out-cubic',
    })
  }, [selectedNode])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Cytoscape container */}
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '100%',
          background: '#050912',
          backgroundImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, #0a0f20 0%, #050912 72%)',
        }}
      />

      {/* Hover tooltip */}
      <div
        ref={tooltipRef}
        style={{
          display: 'none',
          position: 'fixed',
          background: 'rgba(8,13,30,0.97)',
          color: 'var(--t1)',
          fontSize: 12,
          padding: '6px 12px',
          borderRadius: 8,
          pointerEvents: 'none',
          zIndex: 50,
          border: '1px solid var(--b2)',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
        }}
      />
    </div>
  )
}
