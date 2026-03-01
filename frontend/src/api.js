const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

export const getGroupById = (groupId) =>
    request('GET', `/groups/${groupId}`);

export const addMember = (groupId, userId) =>
    request('POST', `/groups/${groupId}/add-member`, { groupId, userId });

// Expenses
export const createExpense = (data) =>
    request('POST', '/expenses', data);

export const getExpenses = (groupId) =>
    request('GET', `/expenses?group=${groupId}`);

// Balances
export const getBalances = (groupId) =>
    request('GET', `/groups/${groupId}/balances`);

// Optimization
export const getOptimizedBalances = (groupId) =>
    request('GET', `/groups/${groupId}/optimize`);

// Delete
export const deleteUser = (id) =>
    request('DELETE', `/users/${id}`);

export const deleteGroup = (id) =>
    request('DELETE', `/groups/${id}`);

export const deleteExpense = (id) =>
    request('DELETE', `/expenses/${id}`);

// ── Phase 2: Recurring Expenses ──
export const getRecurringExpenses = (groupId) =>
    request('GET', groupId ? `/recurring-expenses?group=${groupId}` : '/recurring-expenses');

export const triggerRecurringExpenses = () =>
    request('POST', '/recurring-expenses/trigger');

// ── Phase 2: Partial Payments (Transactions) ──
export const createTransaction = (fromUser, toUser, groupId, totalAmount) =>
    request('POST', '/transactions', { fromUser, toUser, groupId, totalAmount });

export const makePayment = (transactionId, amount) =>
    request('POST', `/transactions/${transactionId}/pay`, { amount });

export const getTransactions = (groupId) =>
    request('GET', groupId ? `/transactions?groupId=${groupId}` : '/transactions');

// ── Phase 2: Settlement Simulation ──
export const settleGroup = (groupId) =>
    request('POST', `/groups/${groupId}/settle`);

export const getSettlementHistory = (groupId) =>
    request('GET', `/groups/${groupId}/settlements`);

// ── Phase 2: Reduction Metrics ──
export const getMetrics = (groupId) =>
    request('GET', `/groups/${groupId}/metrics`);

// ── Phase 2: Debt Graph ──
export const getDebtGraph = (groupId) =>
    request('GET', `/groups/${groupId}/debt-graph`);
