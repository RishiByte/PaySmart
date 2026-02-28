const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('GET /api/groups/:groupId/balances', () => {
    let userA, userB, userC, userD, group;

    beforeEach(async () => {
        userA = (await request(app).post('/api/users')
            .send({ name: 'A', email: 'a@t.com' })).body;
        userB = (await request(app).post('/api/users')
            .send({ name: 'B', email: 'b@t.com' })).body;
        userC = (await request(app).post('/api/users')
            .send({ name: 'C', email: 'c@t.com' })).body;
        userD = (await request(app).post('/api/users')
            .send({ name: 'D', email: 'd@t.com' })).body;
        group = (await request(app).post('/api/groups')
            .send({ name: 'G', createdBy: userA._id })).body;
    });

    // ── Happy Path ──

    it('returns empty balances when no expenses exist', async () => {
        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.balances).toEqual([]);
    });

    it('computes correct settlement: A pays 600, B pays 300, split 3-way', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 600,
            participants: [userA._id, userB._id, userC._id],
        });
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userB._id, amount: 300,
            participants: [userA._id, userB._id, userC._id],
        });

        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        expect(res.body.success).toBe(true);
        expect(res.body.balances).toHaveLength(1);
        expect(res.body.balances[0]).toMatchObject({
            from: userC._id,
            to: userA._id,
            amount: 300,
        });
    });

    it('produces minimal transactions for 4-user optimization example', async () => {
        // Create balances: A+500, B+200, C-400, D-300
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 400,
            participants: [userC._id],
        });
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 100,
            participants: [userD._id],
        });
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userB._id, amount: 200,
            participants: [userD._id],
        });

        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        expect(res.body.success).toBe(true);
        expect(res.body.balances).toHaveLength(3);

        const totalSettled = res.body.balances.reduce((s, t) => s + t.amount, 0);
        expect(totalSettled).toBe(700);
    });

    // ── Floating Point ──

    it('rounds amounts to 2 decimal places', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 100,
            participants: [userA._id, userB._id, userC._id],
        });

        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        res.body.balances.forEach((t) => {
            const decimals = t.amount.toString().split('.')[1];
            expect(!decimals || decimals.length <= 2).toBe(true);
        });
    });

    // ── Logical Invariants ──

    it('no transaction has amount <= 0', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 900,
            participants: [userA._id, userB._id, userC._id],
        });

        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        res.body.balances.forEach((t) => {
            expect(t.amount).toBeGreaterThan(0);
        });
    });

    it('no self-settlement transactions', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 300,
            participants: [userA._id, userB._id, userC._id],
        });

        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        res.body.balances.forEach((t) => {
            expect(t.from).not.toBe(t.to);
        });
    });

    it('all userIds are strings', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 600,
            participants: [userA._id, userB._id],
        });

        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        res.body.balances.forEach((t) => {
            expect(typeof t.from).toBe('string');
            expect(typeof t.to).toBe('string');
        });
    });

    // ── Edge Cases ──

    it('single user paying self returns empty balances', async () => {
        await request(app).post('/api/expenses').send({
            group: group._id, paidBy: userA._id, amount: 500,
            participants: [userA._id],
        });

        const res = await request(app)
            .get(`/api/groups/${group._id}/balances`);

        expect(res.body.balances).toEqual([]);
    });

    it('returns error for invalid groupId format', async () => {
        const res = await request(app)
            .get('/api/groups/not-valid-id/balances');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });

    it('returns empty balances for non-existent group', async () => {
        const fakeId = '000000000000000000000000';
        const res = await request(app)
            .get(`/api/groups/${fakeId}/balances`);

        expect(res.body.success).toBe(true);
        expect(res.body.balances).toEqual([]);
    });
});
