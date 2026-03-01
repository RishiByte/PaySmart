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
import { Scale, IndianRupee, Users, CheckCircle, BarChart3, CreditCard, History, Handshake } from 'lucide-react';
import { useToast } from '../components/ToastContext';
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
    const { addToast } = useToast();

    // Partial Payments
    const [showPayModal, setShowPayModal] = useState(false);
    const [payTarget, setPayTarget] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [transactions, setTransactions] = useState([]);

    // Settlement
    const [settleHistory, setSettleHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadBalances(selectedGroup);
            loadTransactions(selectedGroup);
            loadSettlementHistory(selectedGroup);
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

    async function loadTransactions(groupId) {
        try {
            const data = await api.getTransactions(groupId);
            setTransactions(Array.isArray(data) ? data : []);
        } catch {
            setTransactions([]);
        }
    }

    async function loadSettlementHistory(groupId) {
        try {
            const data = await api.getSettlementHistory(groupId);
            setSettleHistory(data.history || []);
        } catch {
            setSettleHistory([]);
        }
    }

    function getUserName(idOrObj) {
        if (idOrObj && typeof idOrObj === 'object' && idOrObj.name) return idOrObj.name;
        const found = users.find((u) => u._id === idOrObj);
        return found?.name || `...${String(idOrObj)?.slice(-6)}`;
    }

    async function handlePartialPay(balance) {
        setPayTarget(balance);
        setPayAmount('');
        setShowPayModal(true);
    }

    async function submitPayment() {
        if (!payTarget || !payAmount || parseFloat(payAmount) <= 0) {
            addToast('Enter a valid payment amount', 'error');
            return;
        }

        try {
            // Find or create transaction for this debt
            let tx = transactions.find(
                (t) => {
                    const from = typeof t.fromUser === 'object' ? t.fromUser._id : t.fromUser;
                    const to = typeof t.toUser === 'object' ? t.toUser._id : t.toUser;
                    return from === payTarget.from && to === payTarget.to && t.status !== 'completed';
                }
            );

            if (!tx) {
                tx = await api.createTransaction(payTarget.from, payTarget.to, selectedGroup, payTarget.amount);
            }

            await api.makePayment(tx._id, parseFloat(payAmount));
            addToast(`Payment of ₹${payAmount} recorded!`);
            setShowPayModal(false);
            loadTransactions(selectedGroup);
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleSettleGroup() {
        if (!confirm('Settle all debts in this group? This marks all current debts as settled.')) return;
        try {
            const result = await api.settleGroup(selectedGroup);
            addToast(result.message || 'Group settled!');
            loadSettlementHistory(selectedGroup);
            loadBalances(selectedGroup);
        } catch (err) {
            addToast(err.message, 'error');
        }
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

    // Get payment progress for a balance
    function getPaymentProgress(balance) {
        const tx = transactions.find(
            (t) => {
                const from = typeof t.fromUser === 'object' ? t.fromUser._id : t.fromUser;
                const to = typeof t.toUser === 'object' ? t.toUser._id : t.toUser;
                return from === balance.from && to === balance.to;
            }
        );
        if (!tx) return { paidAmount: 0, remainingAmount: balance.amount, percentage: 0 };
        return {
            paidAmount: tx.paidAmount,
            remainingAmount: tx.remainingAmount,
            percentage: Math.round((tx.paidAmount / tx.totalAmount) * 100),
        };
    }

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

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 28 }}>
                <div className="form-group" style={{ maxWidth: 360, marginBottom: 0 }}>
                    <label>Select Group</label>
                    <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                        <option value="">Choose a group</option>
                        {groups.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                    </select>
                </div>
                {selectedGroup && balances.length > 0 && (
                    <button className="btn btn-primary" onClick={handleSettleGroup} style={{ whiteSpace: 'nowrap' }}>
                        <Handshake size={16} /> Settle Group
                    </button>
                )}
                {selectedGroup && settleHistory.length > 0 && (
                    <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)} style={{ whiteSpace: 'nowrap' }}>
                        <History size={16} /> {showHistory ? 'Hide' : 'Show'} History
                    </button>
                )}
            </div>

            {/* Settlement History Modal */}
            {showHistory && settleHistory.length > 0 && (
                <div className="card" style={{ marginBottom: 24, animation: 'slideUp 0.3s ease' }}>
                    <h3 className="section-title">
                        <History size={18} /> Settlement History
                        <span className="item-badge badge-green" style={{ marginLeft: 8 }}>
                            {settleHistory.length}
                        </span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {settleHistory.map((record, ri) => (
                            <div key={record._id} className="card" style={{ padding: 16 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                    Settled on {new Date(record.settledAt).toLocaleDateString()} at {new Date(record.settledAt).toLocaleTimeString()}
                                </div>
                                {record.settlements.map((s, si) => (
                                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14 }}>
                                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{getUserName(s.fromUser)}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>{getUserName(s.toUser)}</span>
                                        <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--accent)' }}>₹{s.amount}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pay Modal */}
            {showPayModal && payTarget && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16 }}>Record Payment</h3>
                        <div style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600 }}>{getUserName(payTarget.from)}</span> pays{' '}
                            <span style={{ fontWeight: 600 }}>{getUserName(payTarget.to)}</span>
                        </div>
                        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                            Total: ₹{payTarget.amount}
                        </div>
                        <div className="form-group">
                            <label>Payment Amount</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                max={payTarget.amount}
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-primary" onClick={submitPayment}>
                                <CreditCard size={16} /> Pay
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                {balances.map((t, i) => {
                                    const progress = getPaymentProgress(t);
                                    return (
                                        <div
                                            key={i}
                                            className="settlement-card"
                                            style={{ animationDelay: `${i * 0.08}s`, flexDirection: 'column', gap: 12 }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
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

                                            {/* Payment progress + button */}
                                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="progress-bar-container">
                                                        <div
                                                            className="progress-bar-fill"
                                                            style={{ width: `${progress.percentage}%` }}
                                                        />
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                        {progress.paidAmount > 0
                                                            ? `₹${progress.paidAmount} paid · ₹${progress.remainingAmount} remaining`
                                                            : 'No payments yet'}
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handlePartialPay(t)}
                                                    title="Make partial payment"
                                                >
                                                    <CreditCard size={14} /> Pay
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
