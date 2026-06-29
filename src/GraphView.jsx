import { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'

cytoscape.use(fcose)

function centralityToColor(centrality) {
  if (centrality >= 0.20) return '#ffffff'
  if (centrality >= 0.12) return '#fef08a'
  if (centrality >= 0.06) return '#f59e0b'
  if (centrality >= 0.02) return '#b45309'
  return '#44200a'
}

function centralityToSize(centrality) {
  return 6 + (centrality * 50)
}

export default function GraphView({ graphData, selectedNode, onNodeClick }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!graphData || !containerRef.current) return

    const nodes = graphData.nodes.map(node => ({
      data: {
        id: node.key,
        label: node.alias,
        size: centralityToSize(node.centrality),
        channels: node.channels,
        capacity: node.capacity,
        alias: node.alias,
        centrality: node.centrality,
        role: node.role,
        color: centralityToColor(node.centrality),
      }
    }))

    const edges = graphData.edges
      .filter(edge => edge.source !== edge.target)
      .map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
        }
      }))

    const cy = cytoscape({
      container: containerRef.current,
      elements: { nodes, edges },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'width': 'data(size)',
            'height': 'data(size)',
            'label': '',
            'opacity': 1,
            'border-width': 0,
          }
        },
        // Labels only for major hubs and connectors
        {
          selector: 'node[centrality >= 0.10]',
          style: {
            'label': 'data(label)',
            'color': '#cbd5e1',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': '5px',
            'text-background-color': '#030712',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
          }
        },
        // Edges hidden by default — shown only on selection
        {
          selector: 'edge',
          style: {
            'width': 0,
            'opacity': 0,
          }
        },
        // Selected node
        {
          selector: 'node.selected',
          style: {
            'background-color': '#ffffff',
            'border-width': 3,
            'border-color': '#f59e0b',
            'label': 'data(label)',
            'color': '#ffffff',
            'font-size': '12px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': '6px',
            'text-background-color': '#030712',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            'opacity': 1,
            'z-index': 10,
          }
        },
        // Neighbor nodes
        {
          selector: 'node.neighbor',
          style: {
            'background-color': '#60a5fa',
            'label': 'data(label)',
            'color': '#bfdbfe',
            'font-size': '9px',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': '4px',
            'text-background-color': '#030712',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
            'opacity': 1,
            'z-index': 5,
          }
        },
        // Highlighted edges — amber, visible only on selection
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#f59e0b',
            'opacity': 1,
            'width': 2,
            'curve-style': 'bezier',
          }
        },
        // Faded nodes when something is selected
        {
          selector: 'node.faded',
          style: { 'opacity': 0.08 }
        },
        {
          selector: 'edge.faded',
          style: { 'opacity': 0 }
        },
      ],
      layout: {
        name: 'fcose',
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 50,
        nodeRepulsion: () => 8500,
        idealEdgeLength: () => 120,
        edgeElasticity: () => 0.35,
        gravity: 0.25,
        gravityRange: 1.5,
        numIter: 2500,
        tile: true,
        tilingPaddingVertical: 20,
        tilingPaddingHorizontal: 20,
        randomize: true,
      },
      wheelSensitivity: 0.3,
      minZoom: 0.05,
      maxZoom: 10,
    })

    // --- Tooltip on hover ---
    const tooltip = tooltipRef.current
    cy.on('mouseover', 'node', event => {
      const node = event.target
      const pos = event.renderedPosition
      const container = containerRef.current.getBoundingClientRect()
      tooltip.style.display = 'block'
      tooltip.style.left = (pos.x + container.left + 14) + 'px'
      tooltip.style.top = (pos.y + container.top - 12) + 'px'
      tooltip.innerHTML = `
        <span style="color:#f59e0b;font-weight:bold">${node.data('alias')}</span>
        <span style="color:#94a3b8;margin-left:6px">${node.data('channels')} channels</span>
        <span style="color:#64748b;margin-left:6px">·</span>
        <span style="color:#64748b;margin-left:6px">${node.data('role')}</span>
      `
    })

    cy.on('mouseout', 'node', () => {
      tooltip.style.display = 'none'
    })

    // --- Node click ---
    cy.on('tap', 'node', event => {
      const node = event.target
      tooltip.style.display = 'none'
      onNodeClick({
        key: node.id(),
        alias: node.data('alias'),
        channels: node.data('channels'),
        capacity: node.data('capacity'),
        centrality: node.data('centrality'),
        role: node.data('role'),
      })
    })

    // --- Background click clears selection ---
    cy.on('tap', event => {
      if (event.target === cy) onNodeClick(null)
    })

    cyRef.current = cy

    return () => cy.destroy()
  }, [graphData])

  // --- Highlight selected node and neighbors ---
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('selected neighbor faded highlighted')

    if (!selectedNode) return

    const target = cy.getElementById(selectedNode.key)
    if (!target || target.empty()) return

    const neighbors = target.neighborhood('node')
    const connectedEdges = target.connectedEdges()

    cy.nodes().addClass('faded')
    cy.edges().addClass('faded')

    target.removeClass('faded').addClass('selected')
    neighbors.removeClass('faded').addClass('neighbor')
    connectedEdges.removeClass('faded').addClass('highlighted')

    cy.animate({
      fit: { eles: target.union(neighbors), padding: 80 },
      duration: 500,
      easing: 'ease-in-out-cubic',
    })
  }, [selectedNode])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#030712',
          backgroundImage: 'radial-gradient(ellipse at 50% 50%, #0f172a 0%, #030712 70%)',
        }}
      />
      <div
        ref={tooltipRef}
        style={{
          display: 'none',
          position: 'fixed',
          background: 'rgba(15,23,42,0.95)',
          color: '#f1f5f9',
          fontSize: '12px',
          padding: '6px 12px',
          borderRadius: '8px',
          pointerEvents: 'none',
          zIndex: 50,
          border: '1px solid #1e3a5f',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  )
}