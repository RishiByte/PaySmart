import { useState, useEffect, useRef, useCallback } from 'react';
import { Network } from 'lucide-react';
import * as api from '../api';

const NODE_COLORS = ['#6366f1', '#06b6d4', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function DebtGraph() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [graphLoading, setGraphLoading] = useState(false);
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) loadGraph(selectedGroup);
    }, [selectedGroup]);

    async function loadGroups() {
        try {
            const g = await api.getGroups().catch(() => []);
            setGroups(Array.isArray(g) ? g : []);
        } finally {
            setLoading(false);
        }
    }

    async function loadGraph(groupId) {
        setGraphLoading(true);
        try {
            const data = await api.getDebtGraph(groupId);
            setGraphData(data);
        } catch {
            setGraphData(null);
        } finally {
            setGraphLoading(false);
        }
    }

    const drawGraph = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !graphData) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;
        const cx = W / 2;
        const cy = H / 2;
        const radius = Math.min(W, H) * 0.32;

        ctx.clearRect(0, 0, W, H);

        const { nodes, edges } = graphData;
        if (!nodes || nodes.length === 0) return;

        // Position nodes in a circle
        const nodePositions = nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
            return {
                ...node,
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle),
                color: NODE_COLORS[i % NODE_COLORS.length],
            };
        });

        // Draw edges
        for (const edge of edges) {
            const fromNode = nodePositions.find((n) => n.id === edge.from);
            const toNode = nodePositions.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) continue;

            // Line
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = Math.max(1.5, Math.min(edge.weight / 50, 6));
            ctx.stroke();

            // Arrow at midpoint
            const mx = (fromNode.x + toNode.x) / 2;
            const my = (fromNode.y + toNode.y) / 2;
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
            const arrowSize = 8;

            ctx.beginPath();
            ctx.moveTo(mx + arrowSize * Math.cos(angle), my + arrowSize * Math.sin(angle));
            ctx.lineTo(
                mx - arrowSize * Math.cos(angle - Math.PI / 6),
                my - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                mx - arrowSize * Math.cos(angle + Math.PI / 6),
                my - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
            ctx.fill();

            // Weight label
            const lx = mx + 14 * Math.cos(angle + Math.PI / 2);
            const ly = my + 14 * Math.sin(angle + Math.PI / 2);
            ctx.font = '600 12px Inter, sans-serif';
            ctx.fillStyle = '#6366f1';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`₹${edge.weight}`, lx, ly);
        }

        // Draw nodes
        for (const node of nodePositions) {
            // Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 26, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Shadow
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Initial letter
            ctx.font = '700 16px Inter, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label?.charAt(0)?.toUpperCase() || '?', node.x, node.y);

            // Name below
            ctx.font = '500 12px Inter, sans-serif';
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#0f172a';
            ctx.fillText(node.label, node.x, node.y + 40);
        }
    }, [graphData]);

    useEffect(() => {
        drawGraph();

        function handleResize() {
            drawGraph();
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawGraph]);

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1>Debt Visualization</h1>
                <p>Interactive debt graph showing who owes whom</p>
            </div>

            <div className="form-group" style={{ maxWidth: 360, marginBottom: 28 }}>
                <label>Select Group</label>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                    <option value="">Choose a group</option>
                    {groups.map((g) => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                </select>
            </div>

            {!selectedGroup ? (
                <div className="card empty-state" style={{ maxWidth: 500 }}>
                    <div className="empty-icon"><Network /></div>
                    <p>Select a group to view the debt graph</p>
                </div>
            ) : graphLoading ? (
                <div className="spinner" />
            ) : graphData && graphData.nodes?.length > 0 ? (
                <div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        {graphData.nodes.map((node, i) => (
                            <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 12, height: 12, borderRadius: '50%',
                                    background: NODE_COLORS[i % NODE_COLORS.length]
                                }} />
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{node.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="card debt-graph-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <canvas
                            ref={canvasRef}
                            style={{ width: '100%', height: '500px', display: 'block' }}
                        />
                    </div>

                    {/* Edge Table */}
                    {graphData.edges.length > 0 && (
                        <div className="card" style={{ marginTop: 20, padding: 20 }}>
                            <h3 className="section-title">Debt Edges</h3>
                            <table className="debt-table">
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>To</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {graphData.edges.map((edge, i) => (
                                        <tr key={i}>
                                            <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{edge.fromLabel}</td>
                                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>{edge.toLabel}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>₹{edge.weight}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-icon"><Network /></div>
                    <p>No debts to visualize in this group</p>
                </div>
            )}
        </div>
    );
}
