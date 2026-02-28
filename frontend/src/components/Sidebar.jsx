import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/users', icon: '👥', label: 'Users' },
    { path: '/groups', icon: '🏠', label: 'Groups' },
    { path: '/expenses', icon: '💸', label: 'Expenses' },
    { path: '/balances', icon: '⚖️', label: 'Balances' },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">💳</div>
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
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-text">PaySmart v1.0</div>
            </div>
        </aside>
    );
}
