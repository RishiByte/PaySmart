const request = require('supertest');
const app = require('../src/app');
require('./setup');

let userA, userB, userC, group;

beforeEach(async () => {
    userA = (await request(app).post('/api/users').send({ name: 'Alice', email: 'alice@v.com' })).body;
    userB = (await request(app).post('/api/users').send({ name: 'Bob', email: 'bob@v.com' })).body;
    userC = (await request(app).post('/api/users').send({ name: 'Charlie', email: 'charlie@v.com' })).body;
    group = (await request(app).post('/api/groups').send({ name: 'Audit', createdBy: userA._id })).body;
    await request(app).post(`/api/groups/${group._id}/add-member`).send({ groupId: group._id, userId: userB._id });
    await request(app).post(`/api/groups/${group._id}/add-member`).send({ groupId: group._id, userId: userC._id });
});

// ═══════════════════════════════════════════════════
// NEW ENDPOINT: GET /api/groups/:groupId
// ═══════════════════════════════════════════════════

describe('GET /api/groups/:groupId', () => {
    it('returns a single group by ID with populated members', async () => {
        const res = await request(app).get(`/api/groups/${group._id}`);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Audit');
        expect(res.body.members).toBeDefined();
        expect(res.body.members.length).toBeGreaterThanOrEqual(1);
        // Members should be populated with name/email
        expect(res.body.members[0]).toHaveProperty('name');
        expect(res.body.members[0]).toHaveProperty('email');
    });

    it('returns 404 for non-existent group', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app).get(`/api/groups/${fakeId}`);
        expect(res.status).toBe(404);
    });
});

// ═══════════════════════════════════════════════════
// NEW ENDPOINT: GET /api/groups/:groupId/optimize
// ═══════════════════════════════════════════════════

describe('GET /api/groups/:groupId/optimize', () => {
    it('returns optimized transactions', async () => {
        // A pays 900 split 3-way
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 900,
            participants: [userA._id, userB._id, userC._id],
        });

        const res = await request(app).get(`/api/groups/${group._id}/optimize`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.optimizedTransactions).toBeDefined();
        expect(res.body.transactionCount).toBeDefined();
        expect(res.body.optimizedTransactions.length).toBe(2); // B→A and C→A
        expect(res.body.transactionCount).toBe(2);
    });

    it('returns empty for no expenses', async () => {
        const res = await request(app).get(`/api/groups/${group._id}/optimize`);
        expect(res.body.success).toBe(true);
        expect(res.body.optimizedTransactions).toEqual([]);
        expect(res.body.transactionCount).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// DATA SAFETY: Settlement doesn't modify expenses
// ═══════════════════════════════════════════════════

describe('Data Safety — Ledger Immutability', () => {
    it('settlement creates independent record — no expense modification', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 600,
            participants: [userA._id, userB._id, userC._id],
        });

        const expBefore = (await request(app).get(`/api/expenses?group=${group._id}`)).body;

        // Settle
        await request(app).post(`/api/groups/${group._id}/settle`);

        const expAfter = (await request(app).get(`/api/expenses?group=${group._id}`)).body;

        // Expense count must be exactly the same — no zeroing expenses
        expect(expAfter.length).toBe(expBefore.length);

        // Each expense must have the same data
        for (let i = 0; i < expBefore.length; i++) {
            expect(expAfter[i].amount).toBe(expBefore[i].amount);
            expect(expAfter[i]._id).toBe(expBefore[i]._id);
        }
    });
});

// ═══════════════════════════════════════════════════
// DATA SAFETY: Recurring expense duplicate guard
// ═══════════════════════════════════════════════════

describe('Data Safety — Recurring Duplicate Guard', () => {
    it('triple trigger produces no duplicates', async () => {
        const past = new Date(Date.now() - 86400000).toISOString();

        await request(app).post('/api/expenses').send({
            group: group._id,
            paidBy: userA._id,
            amount: 100,
            participants: [userA._id, userB._id],
            isRecurring: true,
            recurrenceInterval: 'daily',
            nextExecutionDate: past,
        });

        const r1 = await request(app).post('/api/recurring-expenses/trigger');
        const r2 = await request(app).post('/api/recurring-expenses/trigger');
        const r3 = await request(app).post('/api/recurring-expenses/trigger');

        // Only first trigger should create; 2nd and 3rd are no-ops
        expect(r1.body.created.length).toBe(1);
        expect(r2.body.created.length).toBe(0);
        expect(r3.body.created.length).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// DATA SAFETY: Transaction status lifecycle
// ═══════════════════════════════════════════════════

describe('Data Safety — Transaction Status Lifecycle', () => {
    it('transitions pending → partial → completed correctly', async () => {
        const tx = (await request(app).post('/api/transactions').send({
            fromUser: userB._id,
            toUser: userA._id,
            groupId: group._id,
            totalAmount: 300,
        })).body;

        expect(tx.status).toBe('pending');

        const pay1 = (await request(app)
            .post(`/api/transactions/${tx._id}/pay`)
            .send({ amount: 100 })).body;
        expect(pay1.status).toBe('partial');
        expect(pay1.paidAmount).toBe(100);
        expect(pay1.remainingAmount).toBe(200);

        const pay2 = (await request(app)
            .post(`/api/transactions/${tx._id}/pay`)
            .send({ amount: 200 })).body;
        expect(pay2.status).toBe('completed');
        expect(pay2.paidAmount).toBe(300);
        expect(pay2.remainingAmount).toBe(0);

        // Completed transaction rejects further payment
        const pay3 = await request(app)
            .post(`/api/transactions/${tx._id}/pay`)
            .send({ amount: 50 });
        expect(pay3.status).toBe(400);
    });
});
