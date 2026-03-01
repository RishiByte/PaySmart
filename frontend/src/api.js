const API_BASE = 'http://localhost:5001/api';

async function request(method, path, body) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Users
export const createUser = (name, email) =>
    request('POST', '/users', { name, email });

export const getUsers = () =>
    request('GET', '/users');

// Groups
export const createGroup = (name, createdBy) =>
    request('POST', '/groups', { name, createdBy });

export const getGroups = () =>
    request('GET', '/groups');

export const addMember = (groupId, userId) =>
    request('POST', `/groups/${groupId}/add-member`, { groupId, userId });

// Expenses
export const createExpense = (group, paidBy, amount, participants, description) =>
    request('POST', '/expenses', { group, paidBy, amount, participants, description });

export const getExpenses = (groupId) =>
    request('GET', `/expenses?group=${groupId}`);

// Balances
export const getBalances = (groupId) =>
    request('GET', `/groups/${groupId}/balances`);

// Delete
export const deleteUser = (id) =>
    request('DELETE', `/users/${id}`);

export const deleteGroup = (id) =>
    request('DELETE', `/groups/${id}`);

export const deleteExpense = (id) =>
    request('DELETE', `/expenses/${id}`);
