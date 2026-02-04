const request = require('supertest');
const app = require('../server/app'); 
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require("jsonwebtoken"); 
const User = require("../server/models/User");


let mongoServer;
let authToken;
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    dbName: "testDB", 
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // admin user
  const user = await User.create({
    name: "Admin Tester",
    email: "admin@test.com",
    password: "test123",
    role: "ADMIN",
  });

  authToken = "Bearer " + jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  }, 15000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('GET /users', () => {
  it('should return all users', async () => {
    const res = await request(app)
    .get('/api/auth/users')
    .set('Authorization', authToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// Close DB connection after tests
afterAll(() => mongoose.connection.close());