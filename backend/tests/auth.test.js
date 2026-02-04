const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server/app');
const User = require('../server/models/User');
const jwt = require('jsonwebtoken');

let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create an admin user
  const adminUser = new User({
    name: 'Admin User',
    email: 'admin@test.com',
    password: '123456',
    role: 'ADMIN'
  });
  await adminUser.save();

  // Generate token
  token = jwt.sign(
    { id: adminUser._id, role: adminUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}, 15000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: '123456',
        role: 'USER'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.token).toBeDefined();
  });

  it('should reject duplicate registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: '123456',
        role: 'USER'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: '123456',
        role: 'USER'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/User already exists/i);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const user = new User({
      name: 'Login User',
      email: 'login@example.com',
      password: '123456',
      role: 'USER'
    });
    await user.save();
  });

  it('should log in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('should fail with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });
});