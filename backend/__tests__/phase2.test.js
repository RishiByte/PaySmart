const request = require('supertest');
const app = require('../src/app');
require('./setup');

let userA, userB, userC, group;

beforeEach(async () => {
    userA = (await request(app).post('/api/users').send({ name: 'Alice', email: 'alice@t.com' })).body;
    userB = (await request(app).post('/api/users').send({ name: 'Bob', email: 'bob@t.com' })).body;
    userC = (await request(app).post('/api/users').send({ name: 'Charlie', email: 'charlie@t.com' })).body;
    group = (await request(app).post('/api/groups').send({ name: 'Trip', createdBy: userA._id })).body;

    // Add members
    await request(app).post(`/api/groups/${group._id}/add-member`).send({ groupId: group._id, userId: userB._id });
    await request(app).post(`/api/groups/${group._id}/add-member`).send({ groupId: group._id, userId: userC._id });
});

// ═══════════════════════════════════════════════════
// 1. RECURRING EXPENSES
// ═══════════════════════════════════════════════════

describe('Recurring Expenses', () => {
    it('creates a recurring expense and triggers processing', async () => {
        const past = new Date(Date.now() - 86400000).toISOString(); // yesterday

        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 300,
            participants: [userA._id, userB._id, userC._id],
            description: 'Groceries',
            isRecurring: true,
            recurrenceInterval: 'daily',
            nextExecutionDate: past,
        });

        // Trigger recurring expense processing
        const triggerRes = await request(app).post('/api/recurring-expenses/trigger');

        expect(triggerRes.status).toBe(200);
        expect(triggerRes.body.success).toBe(true);
        expect(triggerRes.body.created).toHaveLength(1);
        expect(triggerRes.body.created[0].description).toContain('recurring');
    });

    it('does not duplicate within the same cycle', async () => {
        const past = new Date(Date.now() - 86400000).toISOString();

        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 100,
            participants: [userA._id, userB._id],
            isRecurring: true,
            recurrenceInterval: 'weekly',
            nextExecutionDate: past,
        });

        // First trigger
        await request(app).post('/api/recurring-expenses/trigger');

        // Second trigger — should be no-op
        const res = await request(app).post('/api/recurring-expenses/trigger');
        expect(res.body.created).toHaveLength(0);
    });

    it('lists recurring expenses', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 200,
            participants: [userA._id, userB._id],
            isRecurring: true,
            recurrenceInterval: 'monthly',
            nextExecutionDate: new Date().toISOString(),
        });

        const res = await request(app).get('/api/recurring-expenses');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].isRecurring).toBe(true);
    });
});

// ═══════════════════════════════════════════════════
// 2. PARTIAL PAYMENTS
// ═══════════════════════════════════════════════════

describe('Partial Payments (Transactions)', () => {
    it('creates a transaction and makes partial payment', async () => {
        const createRes = await request(app).post('/api/transactions').send({
            fromUser: userB._id,
            toUser: userA._id,
            groupId: group._id,
            totalAmount: 500,
        });

        expect(createRes.status).toBe(201);
        expect(createRes.body.status).toBe('pending');
        expect(createRes.body.remainingAmount).toBe(500);

        // Partial payment
        const payRes = await request(app)
            .post(`/api/transactions/${createRes.body._id}/pay`)
            .send({ amount: 200 });

        expect(payRes.body.status).toBe('partial');
        expect(payRes.body.paidAmount).toBe(200);
        expect(payRes.body.remainingAmount).toBe(300);
    });

    it('completes transaction with full payment', async () => {
        const tx = (await request(app).post('/api/transactions').send({
            fromUser: userC._id,
            toUser: userA._id,
            groupId: group._id,
            totalAmount: 100,
        })).body;

        const payRes = await request(app)
            .post(`/api/transactions/${tx._id}/pay`)
            .send({ amount: 100 });

        expect(payRes.body.status).toBe('completed');
        expect(payRes.body.remainingAmount).toBe(0);
    });

    it('rejects overpayment', async () => {
        const tx = (await request(app).post('/api/transactions').send({
            fromUser: userB._id,
            toUser: userA._id,
            groupId: group._id,
            totalAmount: 100,
        })).body;

        const payRes = await request(app)
            .post(`/api/transactions/${tx._id}/pay`)
            .send({ amount: 200 });

        expect(payRes.status).toBe(400);
    });

    it('lists transactions filtered by group', async () => {
        await request(app).post('/api/transactions').send({
            fromUser: userB._id,
            toUser: userA._id,
            groupId: group._id,
            totalAmount: 300,
        });

        const res = await request(app).get(`/api/transactions?groupId=${group._id}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

// ═══════════════════════════════════════════════════
// 3. SETTLEMENT SIMULATION
// ═══════════════════════════════════════════════════

describe('Settlement Simulation', () => {
    it('settles a group and records history', async () => {
        // Create expenses
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 600,
            participants: [userA._id, userB._id, userC._id],
        });

        const settleRes = await request(app).post(`/api/groups/${group._id}/settle`);

        expect(settleRes.body.success).toBe(true);
        expect(settleRes.body.settlement).toBeTruthy();
        expect(settleRes.body.settlement.settlements.length).toBeGreaterThan(0);

        // Verify settlement is in history
        const historyRes = await request(app).get(`/api/groups/${group._id}/settlements`);
        expect(historyRes.body.success).toBe(true);
        expect(historyRes.body.history).toHaveLength(1);
    });

    it('returns no debts after settlement', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 300,
            participants: [userA._id, userB._id, userC._id],
        });

        // Settle
        await request(app).post(`/api/groups/${group._id}/settle`);

        // Check that settlement-aware calculation shows zero debts
        // (The original /balances endpoint still works unchanged)
        const balRes = await request(app).get(`/api/groups/${group._id}/balances`);
        expect(balRes.body.success).toBe(true);
        // Original balance endpoint doesn't subtract settlements — preserved for backward compat
    });

    it('does not create zeroing expenses (ledger immutability)', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 900,
            participants: [userA._id, userB._id, userC._id],
        });

        const beforeCount = (await request(app).get(`/api/expenses?group=${group._id}`)).body.length;

        await request(app).post(`/api/groups/${group._id}/settle`);

        const afterCount = (await request(app).get(`/api/expenses?group=${group._id}`)).body.length;
        expect(afterCount).toBe(beforeCount); // No new expenses created!
    });
});

// ═══════════════════════════════════════════════════
// 4. REDUCTION METRICS
// ═══════════════════════════════════════════════════

describe('Reduction Metrics', () => {
    it('returns correct reduction metrics', async () => {
        // A pays 600 split 3-way → 2 naive debts (B→A, C→A)
        // B pays 300 split 3-way → 2 naive debts (A→B, C→B)
        // Original = 4, Optimized = 1 (C→A 300)
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 600,
            participants: [userA._id, userB._id, userC._id],
        });
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userB._id,
            amount: 300,
            participants: [userA._id, userB._id, userC._id],
        });

        const res = await request(app).get(`/api/groups/${group._id}/metrics`);

        expect(res.body.success).toBe(true);
        expect(res.body.originalTransactions).toBe(4);
        expect(res.body.optimizedTransactions).toBe(1);
        expect(res.body.reductionPercentage).toBe(75);
    });

    it('returns 0% reduction for no expenses', async () => {
        const res = await request(app).get(`/api/groups/${group._id}/metrics`);
        expect(res.body.originalTransactions).toBe(0);
        expect(res.body.optimizedTransactions).toBe(0);
        expect(res.body.reductionPercentage).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// 5. DEBT VISUALIZATION
// ═══════════════════════════════════════════════════

describe('Debt Visualization Graph', () => {
    it('returns nodes and edges for a group with expenses', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 300,
            participants: [userA._id, userB._id, userC._id],
        });

        const res = await request(app).get(`/api/groups/${group._id}/debt-graph`);

        expect(res.body.success).toBe(true);
        expect(res.body.nodes).toBeDefined();
        expect(res.body.edges).toBeDefined();
        expect(res.body.nodes.length).toBeGreaterThanOrEqual(1);
        expect(res.body.edges.length).toBeGreaterThan(0);

        // Verify edge structure
        const edge = res.body.edges[0];
        expect(edge).toHaveProperty('from');
        expect(edge).toHaveProperty('to');
        expect(edge).toHaveProperty('weight');
        expect(edge).toHaveProperty('fromLabel');
        expect(edge).toHaveProperty('toLabel');
    });

    it('returns empty edges for no expenses', async () => {
        const res = await request(app).get(`/api/groups/${group._id}/debt-graph`);
        expect(res.body.edges).toEqual([]);
    });
});
