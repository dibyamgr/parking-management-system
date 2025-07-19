const request = require('supertest');
const app = require('../server/app'); // your Express app
const mongoose = require('mongoose');

describe('GET /users', () => {
  it('should return all users', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// Close DB connection after tests
afterAll(() => mongoose.connection.close());