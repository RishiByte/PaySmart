const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Expense API', () => {
    let userA, userB, group;

    beforeEach(async () => {
        userA = (await request(app).post('/api/users')
            .send({ name: 'Alice', email: 'a@t.com' })).body;
        userB = (await request(app).post('/api/users')
            .send({ name: 'Bob', email: 'b@t.com' })).body;
        group = (await request(app).post('/api/groups')
            .send({ name: 'G', createdBy: userA._id })).body;
    });

    it('creates an expense with valid data', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .send({
                group: group._id,
                paidBy: userA._id,
                amount: 300,
                participants: [userA._id, userB._id],
                description: 'Dinner',
            });

        expect(res.status).toBe(201);
        expect(res.body.amount).toBe(300);
        expect(res.body.participants).toHaveLength(2);
    });
});
