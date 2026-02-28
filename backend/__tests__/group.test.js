const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Group API', () => {
    let userA;

    beforeEach(async () => {
        userA = (await request(app).post('/api/users')
            .send({ name: 'Alice', email: 'alice@test.com' })).body;
    });

    describe('POST /api/groups', () => {
        it('creates a group with valid data', async () => {
            const res = await request(app)
                .post('/api/groups')
                .send({ name: 'Trip', createdBy: userA._id });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Trip');
            expect(res.body.members).toContain(userA._id);
        });

        it('rejects group without createdBy', async () => {
            const res = await request(app)
                .post('/api/groups')
                .send({ name: 'Trip' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/groups/:groupId/add-member', () => {
        it('adds a member to group', async () => {
            const group = (await request(app).post('/api/groups')
                .send({ name: 'G', createdBy: userA._id })).body;

            const userB = (await request(app).post('/api/users')
                .send({ name: 'Bob', email: 'bob@test.com' })).body;

            const res = await request(app)
                .post(`/api/groups/${group._id}/add-member`)
                .send({ groupId: group._id, userId: userB._id });

            expect(res.status).toBe(200);
            expect(res.body.members).toContain(userB._id);
        });
    });
});
