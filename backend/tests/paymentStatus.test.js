const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server/app");
const User = require("../server/models/User");
const PaymentStatus = require("../server/models/PaymentStatus");

let mongoServer;
let sampleStatus;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const user = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "adminpass",
    role: "ADMIN",
    });

    authToken = "Bearer " + jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

  sampleStatus = await PaymentStatus.create({
    status: "PAID",
    date: new Date("2025-07-15T15:30:00Z"),
    transactionId: "TXN123456789",
  });
}, 15000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("📄 PaymentStatus Controller", () => {
  it("should return all payment statuses", async () => {
    const res = await request(app)
      .get("/api/payment-statuses/admin/${fakeId}")
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].status).toBe("PAID");
  });

  it("should return status by ID", async () => {
    const res = await request(app).get(`/api/payment-statuses/${sampleStatus._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.transactionId).toBe("TXN123456789");
    expect(res.body.status).toBe("PAID");
  });

  it("should return 404 for nonexistent status ID", async () => {
  const fakeId = new mongoose.Types.ObjectId();
  const res = await request(app)
    .get(`/api/payment-statuses/admin/${fakeId}`)
    .set("Authorization", authToken);

  expect(res.statusCode).toBe(404);
  expect(res.body?.message?.toLowerCase()).toMatch(/not found/i); // ✅ Safely avoids crash
});
});