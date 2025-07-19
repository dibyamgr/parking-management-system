const mongoose = require("mongoose");

const parkingZoneSchema = mongoose.Schema(
  {
    zoneId: {
      // Unique identifier for the zone (e.g., "ZONE-A")
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      // Embedded Location schema
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    description: {
      type: String,
    },
    totalSlots: {
      // Derived/Updated by logic that counts associated ParkingSlots
      type: Number,
      default: 0,
    },
    availableSlots: {
      // Derived/Updated by logic
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
parkingZoneSchema.index({ location: "2dsphere" });

const ParkingZone = mongoose.model("ParkingZone", parkingZoneSchema);
module.exports = ParkingZone;
