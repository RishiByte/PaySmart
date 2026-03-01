import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import { Plus, Trash2, UserPlus, Home } from 'lucide-react';
import * as api from '../api';

const AVATAR_COLORS = ['#6366f1', '#06b6d4', '#7c3aed', '#ec4899', '#f59e0b', '#10b981'];

export default function Groups() {
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [name, setName] = useState('');
    const [createdBy, setCreatedBy] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

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

    async function handleCreate(e) {
        e.preventDefault();
        if (!name.trim() || !createdBy) return addToast('Name and creator are required', 'error');
        try {
            await api.createGroup(name.trim(), createdBy);
            addToast(`Group "${name}" created!`);
            setName('');
            setCreatedBy('');
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleAddMember(e) {
        e.preventDefault();
        if (!selectedGroup || !selectedUser) return addToast('Select group and user', 'error');
        try {
            await api.addMember(selectedGroup, selectedUser);
            addToast('Member added!');
            setSelectedUser('');
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    async function handleDelete(group) {
        if (!confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
        try {
            await api.deleteGroup(group._id);
            addToast(`Group "${group.name}" deleted`);
            loadData();
        } catch (err) {
            addToast(err.message, 'error');
        }
    }

    function getUserName(member) {
        if (member && typeof member === 'object' && member.name) return member.name;
        const found = users.find((u) => u._id === member);
        return found?.name || `...${String(member)?.slice(-6)}`;
    }

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1>Groups</h1>
                <p>Create groups and manage members</p>
            </div>

            <div className="content-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Create Group */}
                    <div className="card form-card" style={{ animation: 'slideUp 0.4s ease' }}>
                        <h3 className="section-title">Create Group</h3>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Group Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter group name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Created By</label>
                                <select value={createdBy} onChange={(e) => setCreatedBy(e.target.value)}>
                                    <option value="">Select user</option>
                                    {users.map((u) => (
                                        <option key={u._id} value={u._id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary"><Plus size={16} /> Create Group</button>
                        </form>
                    </div>

                    {/* Add Member */}
                    <div className="card form-card" style={{ animation: 'slideUp 0.5s ease' }}>
                        <h3 className="section-title">Add Member</h3>
                        <form onSubmit={handleAddMember}>
                            <div className="form-group">
                                <label>Group</label>
                                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                                    <option value="">Select group</option>
                                    {groups.map((g) => (
                                        <option key={g._id} value={g._id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>User</label>
                                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                                    <option value="">Select user</option>
                                    {users.map((u) => (
                                        <option key={u._id} value={u._id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary"><UserPlus size={16} /> Add Member</button>
                        </form>
                    </div>
                </div>

                <div>
                    <h3 className="section-title">
                        All Groups
                        <span className="item-badge badge-cyan" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                            {groups.length}
                        </span>
                    </h3>
                    {groups.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon"><Home /></div>
                            <p>No groups yet. Create your first group!</p>
                        </div>
                    ) : (
                        <div className="items-grid">
                            {groups.map((g) => (
                                <div key={g._id} className="item-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div className="item-name">{g.name}</div>
                                            <div className="item-detail">Created by: {getUserName(g.createdBy)}</div>
                                        </div>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(g)}
                                            title="Delete group"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <div className="avatar-stack">
                                        {(g.members || []).slice(0, 5).map((m, i) => (
                                            <div
                                                key={typeof m === 'object' ? m._id : m}
                                                className="avatar"
                                                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                                                title={getUserName(m)}
                                            >
                                                {getUserName(m)?.charAt(0)?.toUpperCase()}
                                            </div>
                                        ))}
                                        {(g.members || []).length > 5 && (
                                            <div className="avatar" style={{ background: 'var(--text-muted)', fontSize: 10 }}>
                                                +{g.members.length - 5}
                                            </div>
                                        )}
                                    </div>
                                    <span className="item-badge badge-cyan" style={{ marginTop: 10 }}>
                                        {g.members?.length || 0} members
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
