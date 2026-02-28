const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('POST /api/users', () => {
    it('creates a user with valid data', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({ name: 'Alice', email: 'alice@test.com' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('Alice');
        expect(res.body.email).toBe('alice@test.com');
    });

    it('rejects user without name', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({ email: 'no-name@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Name is required/i);
    });

    it('rejects duplicate email', async () => {
        await request(app)
            .post('/api/users')
            .send({ name: 'A', email: 'dup@test.com' });

        const res = await request(app)
            .post('/api/users')
            .send({ name: 'B', email: 'dup@test.com' });

        expect(res.status).toBe(500);
    });
});
