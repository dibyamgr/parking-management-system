const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../server/app");

const ParkingZone = require("../server/models/ParkingZone");
const User = require("../server/models/User");

let mongoServer;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await mongoose.connection.db.collection("parkingzones").createIndex({ location: "2dsphere" });

  const user = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "adminpass",
    role: "ADMIN",
  });

  authToken = "Bearer " + jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
}, 15000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Parking Zone Controller", () => {
  it("should create a parking zone", async () => {
    const res = await request(app)
      .post("/api/parking-zones")
      .set("Authorization", authToken)
      .send({
        zoneId: "Z001",
        name: "Zone A",
        address: "123 Main St",
        latitude: 47.575,
        longitude: -52.73,
        description: "Test zone",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.zoneId).toBe("Z001");
    expect(res.body.location.coordinates.length).toBe(2);
    expect(res.body.location.coordinates[0]).toBeCloseTo(-52.73);
    expect(res.body.location.coordinates[1]).toBeCloseTo(47.575);
  });

  it("should not create a zone with missing coordinates", async () => {
    const res = await request(app)
      .post("/api/parking-zones")
      .set("Authorization", authToken)
      .send({
        zoneId: "Z002",
        name: "Zone B",
        address: "456 Water St",
        description: "Invalid zone",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/please include zone id/i);
  });

  it("should retrieve all parking zones", async () => {
    const res = await request(app).get("/api/parking-zones");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should get a zone by ID", async () => {
    const res = await request(app).get("/api/parking-zones/Z001");

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Zone A");
  });

  it("should update a zone", async () => {
    const res = await request(app)
      .put("/api/parking-zones/Z001")
      .set("Authorization", authToken)
      .send({ name: "Zone A Updated", description: "Updated zone" });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Zone A Updated");
    expect(res.body.description).toBe("Updated zone");
  });

  it("should delete a zone", async () => {
    const res = await request(app)
      .delete("/api/parking-zones/Z001")
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/removed successfully/i);
  });
});