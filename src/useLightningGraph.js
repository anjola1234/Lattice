import { useState, useEffect } from 'react'

export function useLightningGraph() {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchGraph() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/lightning-graph.json')

        if (!response.ok) {
          throw new Error(`Failed to load dataset: ${response.status}`)
        }

        const raw = await response.json()

        // --- Parse edges first ---
        const edges = raw.edges.map(edge => ({
          source: edge.node1_pub,
          target: edge.node2_pub,
          capacity: edge.capacity || 0,
          id: edge.channel_id,
        }))

        // --- Count actual connections per node ---
        const connectionCount = {}
        edges.forEach(edge => {
          if (edge.source !== edge.target) {
            connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1
            connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1
          }
        })

        // --- Calculate degree centrality ---
        // Max possible connections = total nodes - 1
        const totalNodes = raw.nodes.length
        const maxPossibleConnections = totalNodes - 1

        const nodes = raw.nodes.map(node => {
          const degree = connectionCount[node.public_key] || 0
          const centrality = degree / maxPossibleConnections

          // Human-readable label based on centrality score
          let role
          if (centrality >= 0.15) role = 'Major Hub'
          else if (centrality >= 0.08) role = 'Connector'
          else if (centrality >= 0.04) role = 'Relay Node'
          else role = 'Leaf Node'

          return {
            key: node.public_key,
            alias: node.alias || 'Unknown',
            capacity: node.capacity || 0,
            channels: degree,
            centrality: parseFloat(centrality.toFixed(4)),
            role,
          }
        })

        setGraphData({ nodes, edges })

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGraph()
  }, [])

  return { graphData, loading, error }
}