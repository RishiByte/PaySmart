import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Home, Receipt, Scale, Sun, Moon, TrendingDown, Network } from 'lucide-react';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/groups', icon: Home, label: 'Groups' },
    { path: '/expenses', icon: Receipt, label: 'Expenses' },
    { path: '/balances', icon: Scale, label: 'Balances' },
    { path: '/metrics', icon: TrendingDown, label: 'Metrics' },
    { path: '/debt-graph', icon: Network, label: 'Debt Graph' },
];

export default function Sidebar() {
    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="logo-text">PaySmart</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="nav-icon"><item.icon /></span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-text">PaySmart v1.0</div>
                <button
                    className="theme-toggle-btn"
                    onClick={() => setIsDark(!isDark)}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </aside>
    );
}
