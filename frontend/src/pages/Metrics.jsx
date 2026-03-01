import { useState, useEffect } from 'react';
import { TrendingDown, BarChart3, Percent, ArrowRight } from 'lucide-react';
import * as api from '../api';

export default function Metrics() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) loadMetrics(selectedGroup);
    }, [selectedGroup]);

    async function loadGroups() {
        try {
            const g = await api.getGroups().catch(() => []);
            setGroups(Array.isArray(g) ? g : []);
        } finally {
            setLoading(false);
        }
    }

    async function loadMetrics(groupId) {
        setMetricsLoading(true);
        try {
            const data = await api.getMetrics(groupId);
            setMetrics(data);
        } catch {
            setMetrics(null);
        } finally {
            setMetricsLoading(false);
        }
    }

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1>Reduction Metrics</h1>
                <p>Optimization efficiency of debt settlement</p>
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
                    <div className="empty-icon"><BarChart3 /></div>
                    <p>Select a group to view optimization metrics</p>
                </div>
            ) : metricsLoading ? (
                <div className="spinner" />
            ) : metrics ? (
                <div>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="stat-card">
                            <div className="stat-icon pink"><BarChart3 /></div>
                            <div className="stat-value">{metrics.originalTransactions}</div>
                            <div className="stat-label">Original Transactions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><TrendingDown /></div>
                            <div className="stat-value">{metrics.optimizedTransactions}</div>
                            <div className="stat-label">Optimized Transactions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple"><Percent /></div>
                            <div className="stat-value">{metrics.reductionPercentage}%</div>
                            <div className="stat-label">Reduction</div>
                        </div>
                    </div>

                    {/* Visual comparison */}
                    <div className="card metrics-visual" style={{ marginTop: 24, padding: 32 }}>
                        <h3 className="section-title" style={{ justifyContent: 'center', marginBottom: 24 }}>
                            Optimization Impact
                        </h3>
                        <div className="metrics-comparison">
                            <div className="metrics-before">
                                <div className="metrics-circle" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                                    {metrics.originalTransactions}
                                </div>
                                <div className="metrics-label">Before</div>
                                <div className="metrics-sub">Naive pairwise</div>
                            </div>
                            <div className="metrics-arrow">
                                <ArrowRight size={28} style={{ color: 'var(--accent)' }} />
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                                    {metrics.reductionPercentage}% less
                                </div>
                            </div>
                            <div className="metrics-after">
                                <div className="metrics-circle" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                                    {metrics.optimizedTransactions}
                                </div>
                                <div className="metrics-label">After</div>
                                <div className="metrics-sub">Greedy optimized</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card empty-state">
                    <p>Could not load metrics</p>
                </div>
            )}
        </div>
    );
}
