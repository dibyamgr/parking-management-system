const mongoose = require("mongoose");

const parkingZoneSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (value) {
            return value.length === 2 &&
              typeof value[0] === "number" &&
              typeof value[1] === "number";
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    description: {
      type: String,
      default: "",
    },
    totalSlots: {
      type: Number,
      default: 0,
    },
    availableSlots: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Enable geospatial querying with 2dsphere index
parkingZoneSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ParkingZone", parkingZoneSchema);