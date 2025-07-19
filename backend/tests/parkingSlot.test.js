const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../server/app");

const ParkingSlot = require("../server/models/ParkingSlot");
const ParkingZone = require("../server/models/ParkingZone");
const ParkingSession = require("../server/models/ParkingSession");
const User = require("../server/models/User");

let mongoServer;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  await mongoose.connection.db.collection('parkingzones').createIndex({ location: "2dsphere" });

  const user = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "adminpass",
    role: "ADMIN",
  });

  authToken = "Bearer " + jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  await ParkingZone.create({
    zoneId: "Z001",
    name: "Zone A",
    address: "123 Main St",
    location: {
        type: "Point",
        coordinates: [-52.73, 47.575],
    },
    totalSlots: 0,
    availableSlots: 0,
  });
}, 15000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Parking Slot Controller", () => {
  it("should create a parking slot", async () => {
    const res = await request(app)
      .post("/api/parking-slots")
      .set("Authorization", authToken)
      .send({
        slotId: "P100",
        slotType: "REGULAR",
        pricePerHour: 5,
        parkingZoneId: "Z001",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.slotId).toBe("P100");
  });

  it("should search for available parking slots", async () => {
    const res = await request(app).get(
        `/api/parking-slots/search?location=Memorial University&date=2099-01-01&arrivalTime=10:00&exitTime=12:00`
    );

    console.log("Search response:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots.length).toBeGreaterThan(0);
    expect(res.body.message).toBe("Available parking spots found.");
  });

  it("should get a slot by ID", async () => {
    const res = await request(app).get("/api/parking-slots/P100");

    expect(res.statusCode).toBe(200);
    expect(res.body.slotId).toBe("P100");
  });

  it("should update a parking slot", async () => {
    const res = await request(app)
      .put("/api/parking-slots/P100")
      .set("Authorization", authToken)
      .send({ status: "OCCUPIED", pricePerHour: 7 });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("OCCUPIED");
    expect(res.body.pricePerHour).toBe(7);
  });

  it("should not delete slot with active sessions", async () => {
    const slot = await ParkingSlot.findOne({ slotId: "P100" });
    await ParkingSession.create({
      parkingSlot: slot._id,
      entryTime: new Date(),
      exitTime: new Date(Date.now() + 60 * 60 * 1000),
      actualExitTime: null,
      status: "RESERVED",
      vehicle: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const res = await request(app)
      .delete("/api/parking-slots/P100")
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Cannot delete slot/);
  });
});