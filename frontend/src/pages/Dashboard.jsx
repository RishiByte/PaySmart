import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import * as api from '../api';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
    const [stats, setStats] = useState({ users: 0, groups: 0, expenses: [], totalAmount: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                const [users, groups] = await Promise.all([
                    api.getUsers().catch(() => []),
                    api.getGroups().catch(() => []),
                ]);

                let allExpenses = [];
                for (const g of groups) {
                    const exps = await api.getExpenses(g._id).catch(() => []);
                    allExpenses.push(...(Array.isArray(exps) ? exps : []));
                }

                const totalAmount = allExpenses.reduce((s, e) => s + e.amount, 0);
                setStats({
                    users: Array.isArray(users) ? users.length : 0,
                    groups: Array.isArray(groups) ? groups.length : 0,
                    expenses: allExpenses,
                    totalAmount,
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Doughnut chart: expenses by payer
    const payerMap = {};
    stats.expenses.forEach((e) => {
        const id = e.paidBy;
        payerMap[id] = (payerMap[id] || 0) + e.amount;
    });

    const chartData = {
        labels: Object.keys(payerMap).map((id) => id.slice(-6)),
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
                labels: { color: '#9ca3c7', padding: 16, font: { family: 'Inter', size: 12 } },
            },
        },
    };

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Overview of your PaySmart activity</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon purple">👥</div>
                    <div className="stat-value">{stats.users}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card" onClick={() => navigate('/groups')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon cyan">🏠</div>
                    <div className="stat-value">{stats.groups}</div>
                    <div className="stat-label">Groups</div>
                </div>
                <div className="stat-card" onClick={() => navigate('/expenses')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon pink">💸</div>
                    <div className="stat-value">{stats.expenses.length}</div>
                    <div className="stat-label">Expenses</div>
                </div>
                <div className="stat-card" onClick={() => navigate('/balances')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon green">💰</div>
                    <div className="stat-value">₹{stats.totalAmount.toLocaleString()}</div>
                    <div className="stat-label">Total Spent</div>
                </div>
            </div>

            <div className="content-grid">
                <div>
                    <h3 className="section-title">Recent Expenses</h3>
                    {stats.expenses.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon">📝</div>
                            <p>No expenses yet. Add some to get started!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats.expenses.slice(-5).reverse().map((e) => (
                                <div key={e._id} className="item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div className="item-name">{e.description || 'Expense'}</div>
                                        <div className="item-detail">Paid by: ...{e.paidBy?.slice(-6)}</div>
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-light)' }}>
                                        ₹{e.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chart-container">
                    <h3>Expense Distribution by Payer</h3>
                    {stats.expenses.length > 0 ? (
                        <div className="chart-wrapper" style={{ height: '280px' }}>
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <p>Chart will appear when expenses are added</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
