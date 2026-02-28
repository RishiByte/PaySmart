import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useToast } from '../components/ToastContext';
import * as api from '../api';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function Expenses() {
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [amount, setAmount] = useState('');
    const [participants, setParticipants] = useState([]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedGroup) loadExpenses(selectedGroup);
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

    async function loadExpenses(groupId) {
        try {
            const data = await api.getExpenses(groupId);
            setExpenses(Array.isArray(data) ? data : []);
        } catch {
            setExpenses([]);
        }
    }

    function getUserName(id) {
        return users.find((u) => u._id === id)?.name || `...${id?.slice(-6)}`;
    }

    function toggleParticipant(userId) {
        setParticipants((prev) =>
            prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedGroup || !paidBy || !amount || participants.length === 0)
            return addToast('Fill all fields and select participants', 'error');

        try {
            await api.createExpense(
                selectedGroup,
                paidBy,
                parseFloat(amount),
                participants,
                description.trim()
            );
            addToast('Expense added!');
            setAmount('');
            setDescription('');
            setParticipants([]);
            setPaidBy('');
            loadExpenses(selectedGroup);
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    // Chart data: amount per payer for selected group
    const payerMap = {};
    expenses.forEach((e) => {
        const name = getUserName(e.paidBy);
        payerMap[name] = (payerMap[name] || 0) + e.amount;
    });

    const chartData = {
        labels: Object.keys(payerMap),
        datasets: [
            {
                data: Object.values(payerMap),
                backgroundColor: COLORS,
                borderWidth: 0,
                hoverOffset: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#9ca3c7', padding: 14, font: { family: 'Inter', size: 12 } },
            },
        },
    };

    // Get members of selected group for participant list
    const currentGroup = groups.find((g) => g._id === selectedGroup);
    const groupMembers = currentGroup
        ? users.filter((u) => currentGroup.members?.includes(u._id))
        : users;

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1>Expenses</h1>
                <p>Add and track group expenses</p>
            </div>

            <div className="content-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card form-card" style={{ animation: 'slideUp 0.4s ease' }}>
                        <h3 className="section-title">Add Expense</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Group</label>
                                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                                    <option value="">Select group</option>
                                    {groups.map((g) => (
                                        <option key={g._id} value={g._id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Paid By</label>
                                    <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                                        <option value="">Select payer</option>
                                        {groupMembers.map((u) => (
                                            <option key={u._id} value={u._id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dinner, Taxi"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Split Among</label>
                                <div className="multi-select">
                                    {groupMembers.length === 0 ? (
                                        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                                            Select a group first
                                        </div>
                                    ) : (
                                        groupMembers.map((u) => (
                                            <label key={u._id}>
                                                <input
                                                    type="checkbox"
                                                    checked={participants.includes(u._id)}
                                                    onChange={() => toggleParticipant(u._id)}
                                                />
                                                {u.name}
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary">💸 Add Expense</button>
                        </form>
                    </div>

                    {/* Pie chart */}
                    {expenses.length > 0 && (
                        <div className="chart-container">
                            <h3>Who Paid What</h3>
                            <div className="chart-wrapper" style={{ height: '250px' }}>
                                <Doughnut data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="section-title">
                        Expenses
                        {selectedGroup && (
                            <span className="item-badge badge-pink" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                                {expenses.length}
                            </span>
                        )}
                    </h3>

                    {!selectedGroup ? (
                        <div className="card empty-state">
                            <div className="empty-icon">👆</div>
                            <p>Select a group to view expenses</p>
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon">📝</div>
                            <p>No expenses in this group yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {expenses.map((e) => (
                                <div key={e._id} className="item-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div className="item-name">{e.description || 'Untitled'}</div>
                                            <div className="item-detail">
                                                Paid by <strong>{getUserName(e.paidBy)}</strong> · Split among {e.participants?.length} people
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-light)' }}>
                                            ₹{e.amount}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="item-card" style={{ textAlign: 'center', background: 'rgba(99, 102, 241, 0.06)' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-light)' }}>
                                    ₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
