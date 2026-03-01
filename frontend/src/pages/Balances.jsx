import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Scale, IndianRupee, Users, CheckCircle, BarChart3 } from 'lucide-react';
import * as api from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Balances() {
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [balances, setBalances] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balLoading, setBalLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadBalances(selectedGroup);
        }
    }, [selectedGroup]);

    async function loadData() {
        try {
            const [g, u] = await Promise.all([
                api.getGroups().catch(() => []),
                api.getUsers().catch(() => []),
            ]);
            setGroups(Array.isArray(g) ? g : []);
            setUsers(Array.isArray(u) ? u : []);
        } finally {
            setLoading(false);
        }
    }

    async function loadBalances(groupId) {
        setBalLoading(true);
        try {
            const [balData, expData] = await Promise.all([
                api.getBalances(groupId),
                api.getExpenses(groupId).catch(() => []),
            ]);
            setBalances(balData.balances || []);
            setExpenses(Array.isArray(expData) ? expData : []);
        } catch {
            setBalances([]);
            setExpenses([]);
        } finally {
            setBalLoading(false);
        }
    }

    function getUserName(idOrObj) {
        if (idOrObj && typeof idOrObj === 'object' && idOrObj.name) return idOrObj.name;
        const found = users.find((u) => u._id === idOrObj);
        return found?.name || `...${String(idOrObj)?.slice(-6)}`;
    }

    const netMap = {};
    expenses.forEach((e) => {
        const payerName = getUserName(e.paidBy);
        const participantList = e.participants || [];
        const share = e.amount / (participantList.length || 1);
        netMap[payerName] = (netMap[payerName] || 0) + e.amount;
        participantList.forEach((p) => {
            const pName = getUserName(p);
            netMap[pName] = (netMap[pName] || 0) - share;
        });
    });

    Object.keys(netMap).forEach((k) => {
        netMap[k] = Math.round(netMap[k] * 100) / 100;
    });

    const barLabels = Object.keys(netMap);
    const barValues = Object.values(netMap);

    const barData = {
        labels: barLabels,
        datasets: [
            {
                label: 'Net Balance',
                data: barValues,
                backgroundColor: barValues.map((v) =>
                    v >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
                ),
                borderColor: barValues.map((v) =>
                    v >= 0 ? '#10b981' : '#ef4444'
                ),
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.raw}`,
                },
            },
        },
        scales: {
            x: {
                ticks: { color: 'var(--text-secondary)', font: { family: 'Inter', size: 12 } },
                grid: { color: 'var(--border)' },
            },
            y: {
                ticks: {
                    color: 'var(--text-secondary)',
                    font: { family: 'Inter', size: 12 },
                    callback: (v) => `${v}`,
                },
                grid: { color: 'var(--border)' },
            },
        },
    };

    const totalSettled = balances.reduce((s, t) => s + t.amount, 0);

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1>Balances & Settlements</h1>
                <p>View optimized debt settlements per group</p>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                    <div className="stat-icon indigo"><Scale /></div>
                    <div className="stat-value">{balances.length}</div>
                    <div className="stat-label">Transactions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><IndianRupee /></div>
                    <div className="stat-value">{totalSettled.toLocaleString()}</div>
                    <div className="stat-label">To Settle</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan"><Users /></div>
                    <div className="stat-value">{barLabels.length}</div>
                    <div className="stat-label">Users Involved</div>
                </div>
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
                    <div className="empty-icon"><Scale /></div>
                    <p>Select a group to view settlements</p>
                </div>
            ) : balLoading ? (
                <div className="spinner" />
            ) : (
                <div className="content-grid">
                    <div>
                        <h3 className="section-title">Settlement Transactions</h3>
                        {balances.length === 0 ? (
                            <div className="card empty-state">
                                <div className="empty-icon"><CheckCircle /></div>
                                <p>All settled! No outstanding debts.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {balances.map((t, i) => (
                                    <div
                                        key={i}
                                        className="settlement-card"
                                        style={{ animationDelay: `${i * 0.08}s` }}
                                    >
                                        <div className="user-from">
                                            <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginBottom: 4 }}>
                                                PAYS
                                            </div>
                                            <div className="user-name">{getUserName(t.from)}</div>
                                        </div>
                                        <div className="arrow">
                                            <div className="arrow-amount">{t.amount}</div>
                                            <div className="arrow-line" />
                                        </div>
                                        <div className="user-to">
                                            <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>
                                                RECEIVES
                                            </div>
                                            <div className="user-name">{getUserName(t.to)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="chart-container" style={{ marginBottom: 20 }}>
                            <h3>Net Balance per User</h3>
                            {barLabels.length > 0 ? (
                                <div className="chart-wrapper" style={{ height: '280px' }}>
                                    <Bar data={barData} options={barOptions} />
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon"><BarChart3 /></div>
                                    <p>No data to display</p>
                                </div>
                            )}
                        </div>
                        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Algorithm
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)', marginTop: 4 }}>
                                Greedy Debt Minimization · O(U log U)
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
