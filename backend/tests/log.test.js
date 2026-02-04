const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../server/app");
const Log = require("../server/models/Log");
const User = require("../server/models/User");

let mongoServer;
let authToken;
let logId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create test user
  const user = await User.create({
    name: "Test Logger",
    email: "log@test.com",
    password: "123456",
    role: "ADMIN",
  });

  authToken = "Bearer " + jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // Create sample log
  const log = await Log.create({
    action: "Invoice Paid",
    userId: user._id,
    details: { invoiceId: "123", amount: 50, status: "PAID" },
  });

  logId = log._id;
}, 15000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Log API", () => {
  it("should fetch all logs", async () => {
    const res = await request(app)
      .get("/api/logs") // Adjust path if needed
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should fetch a log by ID", async () => {
    const res = await request(app)
      .get(`/api/logs/${logId}`)
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(logId.toString());
  });

  it("should return 404 for invalid log ID", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/logs/${fakeId}`)
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(404);
  });
});

