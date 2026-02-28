import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import * as api from '../api';

const AVATAR_COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

export default function Users() {
    const [users, setUsers] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const data = await api.getUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) return addToast('Name is required', 'error');
        setSubmitting(true);
        try {
            await api.createUser(name.trim(), email.trim());
            addToast(`User "${name}" created!`);
            setName('');
            setEmail('');
            loadUsers();
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1>Users</h1>
                <p>Manage PaySmart users</p>
            </div>

            <div className="content-grid">
                <div className="card form-card" style={{ animation: 'slideUp 0.4s ease' }}>
                    <h3 className="section-title">Create User</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                placeholder="Enter name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? '⏳ Creating...' : '➕ Create User'}
                        </button>
                    </form>
                </div>

                <div>
                    <h3 className="section-title">
                        All Users
                        <span className="item-badge badge-purple" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                            {users.length}
                        </span>
                    </h3>
                    {users.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon">👤</div>
                            <p>No users yet. Create your first user!</p>
                        </div>
                    ) : (
                        <div className="items-grid">
                            {users.map((u, i) => (
                                <div key={u._id} className="item-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div
                                        className="avatar"
                                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                                    >
                                        {u.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="item-name">{u.name}</div>
                                        <div className="item-detail">{u.email || 'No email'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
