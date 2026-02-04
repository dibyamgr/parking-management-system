const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server/app');
const Invoice = require('../server/models/Invoice');
const User = require('../server/models/User');
const PaymentStatus = require('../server/models/PaymentStatus');
const jwt = require('jsonwebtoken');


let mongoServer;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  const user = await User.create({
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'adminpass',
    role: 'ADMIN',
  });

  authToken = 'Bearer ' + jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

  // Create a dummy payment status
  const status = await PaymentStatus.create({ status: 'PENDING' });

  const mockParkingSessionId = new mongoose.Types.ObjectId();

  // Create sample invoice
  await Invoice.create({
    user: user._id,
    parkingSession: mockParkingSessionId,
    paymentStatus: status._id,
    amount: 10.5,
    issueDate: new Date()
  });
}, 15000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Invoice API", () => {
  it("should fetch all invoices for admin", async () => {
    const res = await request(app)
      .get("/api/invoices/admin/all")
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
