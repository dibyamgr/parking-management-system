const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server/app");

const Vehicle = require("../server/models/Vehicle");
const User = require("../server/models/User");
const ParkingSession = require("../server/models/ParkingSession");

let mongoServer;
let user, admin, vehicle, authUserToken, authAdminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create User and Admin
  user = await User.create({
    name: "Regular User",
    email: "user@example.com",
    password: "userpass",
    role: "USER",
  });

  admin = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "adminpass",
    role: "ADMIN",
  });

  authUserToken =
    "Bearer " + jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  authAdminToken =
    "Bearer " + jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);

  // Create vehicle owned by user
  vehicle = await Vehicle.create({
    licensePlate: "ABC123",
    vehicleType: "CAR",
    owner: user._id,
  });
}, 15000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("🚗 Vehicle Controller", () => {
  it("should allow a user to view their own vehicle", async () => {
    const res = await request(app)
      .get(`/api/vehicles/${vehicle._id}`)
      .set("Authorization", authUserToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.licensePlate).toBe("ABC123");
  });

  it("should allow admin to view any vehicle", async () => {
    const res = await request(app)
      .get(`/api/vehicles/${vehicle._id}`)
      .set("Authorization", authAdminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.owner.email).toBe("user@example.com");
  });

  it("should deny other users from viewing another user's vehicle", async () => {
    const outsider = await User.create({
      name: "Outsider",
      email: "outside@example.com",
      password: "outpass",
      role: "USER",
    });

    const outsiderToken =
      "Bearer " + jwt.sign({ id: outsider._id, role: outsider.role }, process.env.JWT_SECRET);

    const res = await request(app)
      .get(`/api/vehicles/${vehicle._id}`)
      .set("Authorization", outsiderToken);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it("should create a new vehicle", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", authUserToken)
      .send({
        licensePlate: "XYZ789",
        vehicleType: "BIKE",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.licensePlate).toBe("XYZ789");
  });

  it("should not allow duplicate license plates", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", authUserToken)
      .send({
        licensePlate: "ABC123", // Already exists
        vehicleType: "TRUCK",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it("should update vehicle info by owner", async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicle._id}`)
      .set("Authorization", authUserToken)
      .send({ licensePlate: "NEW123", vehicleType: "TRUCK" });

    expect(res.statusCode).toBe(200);
    expect(res.body.licensePlate).toBe("NEW123");
    expect(res.body.vehicleType).toBe("TRUCK");
  });

  it("should prevent deleting vehicle with active session", async () => {
    await ParkingSession.create({
      vehicle: vehicle._id,
      user: user._id,
      parkingSlot: new mongoose.Types.ObjectId(),
      entryTime: new Date(),
      exitTime: new Date(Date.now() + 3600000),
      status: "ACTIVE",
    });

    const res = await request(app)
      .delete(`/api/vehicles/${vehicle._id}`)
      .set("Authorization", authUserToken);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot delete.*active.*sessions/i);
  });

  it("should allow admin to delete any vehicle without active session", async () => {
    const cleanVehicle = await Vehicle.create({
      licensePlate: "DEL789",
      vehicleType: "CAR",
      owner: user._id,
    });

    const res = await request(app)
      .delete(`/api/vehicles/${cleanVehicle._id}`)
      .set("Authorization", authAdminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/removed successfully/i);
  });
});